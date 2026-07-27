require('./config');
const jwt = require('../../server/node_modules/jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const BASE = 'http://localhost:3002';
const JWT_SECRET = 'e2e-test-secret';
const USER = '00000000-dead-beef-0000-000000000001';
const TOKEN = jwt.sign({ userId: USER }, JWT_SECRET, { expiresIn: '1h' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });

const cards = JSON.parse(fs.readFileSync('out/e2e-cards.json', 'utf8'));

let pass = 0, fail = 0;
const failed = [];
function check(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${label} -> ${a}`); }
  else { fail++; failed.push(label); console.log(`  FAIL ${label}\n         expected ${e}\n         actual   ${a}`); }
}

const api = async (path, opts = {}) => {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const review = (card_id, rating) => api('/api/anking/review', { method: 'POST', body: JSON.stringify({ card_id, rating }) });

const readState = async (cardId) => {
  const { data } = await sb.from('anking_review_state').select('*').eq('user_id', USER).eq('card_id', cardId).maybeSingle();
  return data;
};
const readLogs = async (cardId) => {
  const { data } = await sb.from('anking_review_log').select('*').eq('user_id', USER).eq('card_id', cardId).order('reviewed_at', { ascending: true });
  return data || [];
};
const wipe = async () => {
  await sb.from('anking_review_log').delete().eq('user_id', USER);
  await sb.from('anking_review_state').delete().eq('user_id', USER);
};

(async () => {
  console.log('\n════ CLEAN SLATE ════');
  await wipe();
  console.log('  cleared all review state/log rows for the test user');

  // ── VALIDATION ──
  console.log('\n════ VALIDATION ════');
  check('bad rating -> 400', (await review(cards.cloze.id, 'brilliant')).status, 400);
  check('missing card_id -> 400', (await api('/api/anking/review', { method: 'POST', body: JSON.stringify({ rating: 'good' }) })).status, 400);
  check('unknown card_id -> 404', (await review('00000000-0000-0000-0000-0000000000ff', 'good')).status, 404);
  const noAuth = await fetch(BASE + '/api/anking/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card_id: cards.cloze.id, rating: 'good' }) });
  check('no auth -> 401', noAuth.status, 401);

  // ── STATE TRANSITIONS: Again -> Good -> Good -> Easy on one card ──
  console.log('\n════ TRANSITIONS on one real cloze card ════');
  console.log(`  card ${cards.cloze.id} (${cards.cloze.subject})`);
  const trail = [];
  const step = async (rating, label) => {
    const { status, body } = await review(cards.cloze.id, rating);
    const st = await readState(cards.cloze.id);
    const row = {
      rating, http: status,
      api_interval: body.interval_days, api_ease: body.ease_factor, api_due: body.due_date,
      db_interval: st.interval_days, db_ease: Number(st.ease_factor), db_step: st.learning_step,
      db_due: st.due_date, db_reviews: st.review_count, db_lapses: st.lapse_count,
    };
    trail.push(row);
    console.log(`  ${label.padEnd(28)} interval=${row.db_interval} ease=${row.db_ease} step=${row.db_step} due=${row.db_due} reviews=${row.db_reviews} lapses=${row.db_lapses}`);
    check(`  ${label}: API matches DB`, [body.interval_days, body.ease_factor], [st.interval_days, Number(st.ease_factor)]);
    return row;
  };

  const today = new Date().toISOString().slice(0, 10);
  const plusDays = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

  let r = await step('again', '1. again (new card)');
  check('    new+again: interval 0, step 0', [r.db_interval, r.db_step], [0, 0]);
  check('    new+again: due today (1-min step)', r.db_due, today);
  check('    review_count = 1', r.db_reviews, 1);

  r = await step('good', '2. good  (step 0 -> 1)');
  check('    still learning, step advanced', [r.db_interval, r.db_step], [0, 1]);

  r = await step('good', '3. good  (last step -> GRADUATE)');
  check('    graduated: interval 1, ease 2.5', [r.db_interval, r.db_ease], [1, 2.5]);
  check('    due = today + 1', r.db_due, plusDays(1));

  r = await step('easy', '4. easy  (review: 1*2.5*1.3=3)');
  check('    interval 3, ease 2.65', [r.db_interval, r.db_ease], [3, 2.65]);
  check('    due = today + 3', r.db_due, plusDays(3));

  r = await step('hard', '5. hard  (3*1.2=3.6 -> 4)');
  check('    interval 4, ease 2.65-0.15=2.5', [r.db_interval, r.db_ease], [4, 2.5]);

  r = await step('again', '6. again (lapse from review)');
  check('    lapse: interval->1, ease 2.3, lapses 1', [r.db_interval, r.db_ease, r.db_lapses], [1, 2.3, 1]);
  check('    learning_step NOT reset to 0 (stays graduated)', r.db_step, 2);

  r = await step('good', '7. good  (1*2.3=2.3 -> 2)');
  check('    interval 2, ease 2.3', [r.db_interval, r.db_ease], [2, 2.3]);
  check('    review_count = 7 across all ratings', r.db_reviews, 7);

  // ── LOG ROWS ──
  console.log('\n════ anking_review_log ════');
  const logs = await readLogs(cards.cloze.id);
  check('one log row per rating', logs.length, 7);
  console.log('  rating   prev_interval -> new_interval');
  for (const l of logs) console.log(`  ${l.rating.padEnd(8)} ${String(l.previous_interval_days).padStart(3)} -> ${l.new_interval_days}`);
  check('log ratings in order', logs.map((l) => l.rating), ['again', 'good', 'good', 'easy', 'hard', 'again', 'good']);
  check('log prev_interval chain', logs.map((l) => l.previous_interval_days), [0, 0, 0, 1, 3, 4, 1]);
  check('log new_interval chain', logs.map((l) => l.new_interval_days), [0, 0, 1, 3, 4, 1, 2]);

  // ── OTHER CARD TYPES ──
  console.log('\n════ mcq + basic cards ════');
  for (const t of ['mcq', 'basic']) {
    const { status, body } = await review(cards[t].id, 'good');
    const st = await readState(cards[t].id);
    console.log(`  ${t}: http=${status} interval=${st.interval_days} step=${st.learning_step} reviews=${st.review_count}`);
    check(`  ${t} card accepted`, [status, body.ok, st.learning_step], [200, true, 1]);
  }

  // ── DUE-CARDS: not-yet-due exclusion ──
  console.log('\n════ GET /api/anking/due-cards ════');
  const due1 = await api('/api/anking/due-cards');
  const dueIds = due1.body.due_reviews.map((d) => d.card.id);
  check('card due in 2 days is NOT offered as due', dueIds.includes(cards.cloze.id), false);
  check('new_cards excludes already-reviewed cards',
    due1.body.new_cards.some((c) => [cards.cloze.id, cards.mcq.id, cards.basic.id].includes(c.id)), false);
  console.log(`  due_reviews=${due1.body.due_reviews.length} new_cards=${due1.body.new_cards.length} remaining=${due1.body.new_cards_remaining_today}`);
  check('new_cards payload carries real content', typeof due1.body.new_cards[0]?.question_html === 'string', true);

  // learning cards (mcq/basic just rated) sit in a 10-min step -> gated out
  check('learning-step cards gated out of due_reviews',
    dueIds.includes(cards.mcq.id) || dueIds.includes(cards.basic.id), false);

  // force one card due by backdating
  await sb.from('anking_review_state').update({ due_date: '2020-01-01' }).eq('user_id', USER).eq('card_id', cards.cloze.id);
  const due2 = await api('/api/anking/due-cards');
  check('backdated card IS offered as due', due2.body.due_reviews.map((d) => d.card.id).includes(cards.cloze.id), true);
  const dueCard = due2.body.due_reviews.find((d) => d.card.id === cards.cloze.id);
  check('due_reviews entry carries card + state', [typeof dueCard.card.question_html, typeof dueCard.state.interval_days], ['string', 'number']);

  // ── SUBJECT FILTER ──
  console.log('\n════ subject filter ════');
  const subjA = await api('/api/anking/due-cards?subject=neurology');
  const subjB = await api('/api/anking/due-cards?subject=dermatology');
  check('subject=neurology -> all new_cards are neurology',
    subjA.body.new_cards.every((c) => c.subject === 'neurology'), true);
  check('subject=dermatology -> all new_cards are dermatology',
    subjB.body.new_cards.every((c) => c.subject === 'dermatology'), true);
  check('different subjects return different cards',
    subjA.body.new_cards[0]?.id !== subjB.body.new_cards[0]?.id, true);
  check('cardiology filter excludes the backdated cardiology card? (it IS cardiology, so included)',
    (await api('/api/anking/due-cards?subject=cardiology')).body.due_reviews.map((d) => d.card.id).includes(cards.cloze.id), true);
  check('neurology filter excludes the cardiology due card',
    subjA.body.due_reviews.map((d) => d.card.id).includes(cards.cloze.id), false);
  const bogus = await api('/api/anking/due-cards?subject=__nope__');
  check('unknown subject -> empty, still 200', [bogus.status, bogus.body.new_cards.length], [200, 0]);

  console.log('\n════ DAILY NEW-CARD LIMIT (20/day) ════');
  await wipe();
  const fresh = await api('/api/anking/due-cards');
  check('fresh user: 20 remaining', fresh.body.new_cards_remaining_today, 20);
  check('fresh user: exactly 20 new cards offered', fresh.body.new_cards.length, 20);

  // Review 20 distinct new cards
  const twenty = fresh.body.new_cards.map((c) => c.id);
  for (const id of twenty) await review(id, 'good');
  const after20 = await api('/api/anking/due-cards');
  console.log(`  after reviewing 20 new: remaining=${after20.body.new_cards_remaining_today} new_cards=${after20.body.new_cards.length}`);
  check('limit exhausted: 0 remaining', after20.body.new_cards_remaining_today, 0);
  check('21st card NOT offered as new', after20.body.new_cards.length, 0);

  // Re-rating an ALREADY-SEEN card must not consume more allowance
  await review(twenty[0], 'good');
  const afterRepeat = await api('/api/anking/due-cards');
  check('re-rating a seen card does not change the count', afterRepeat.body.new_cards_remaining_today, 0);

  // A card introduced YESTERDAY must not count against today
  await wipe();
  const y = new Date(); y.setUTCDate(y.getUTCDate() - 1);
  await sb.from('anking_review_state').insert({
    user_id: USER, card_id: twenty[0], ease_factor: 2.5, interval_days: 1,
    due_date: y.toISOString().slice(0, 10), learning_step: 2, review_count: 1, lapse_count: 0,
    last_reviewed_at: y.toISOString(),
  });
  await sb.from('anking_review_log').insert({
    user_id: USER, card_id: twenty[0], rating: 'good',
    previous_interval_days: 0, new_interval_days: 1, reviewed_at: y.toISOString(),
  });
  const withYesterday = await api('/api/anking/due-cards');
  check('yesterday\'s card does not consume today\'s allowance', withYesterday.body.new_cards_remaining_today, 20);
  check('yesterday\'s card IS due today', withYesterday.body.due_reviews.map((d) => d.card.id).includes(twenty[0]), true);

  // A card seen yesterday AND again today counts as a REVIEW, not a new introduction
  await review(twenty[0], 'good');
  const afterOldReview = await api('/api/anking/due-cards');
  check('reviewing an old card does not consume new-card allowance', afterOldReview.body.new_cards_remaining_today, 20);

  console.log('\n════ CLEANUP ════');
  await wipe();
  const { count: sLeft } = await sb.from('anking_review_state').select('*', { count: 'exact', head: true }).eq('user_id', USER);
  const { count: lLeft } = await sb.from('anking_review_log').select('*', { count: 'exact', head: true }).eq('user_id', USER);
  check('all test review_state rows removed', sLeft, 0);
  check('all test review_log rows removed', lLeft, 0);

  console.log(`\n${'='.repeat(64)}`);
  console.log(`${pass} passed, ${fail} failed`);
  if (fail) { console.log('failed: ' + failed.join(' | ')); process.exit(1); }
})();
