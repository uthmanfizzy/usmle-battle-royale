require('./config');
const jwt = require('../../server/node_modules/jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const BASE = 'http://localhost:3002';
const USER = '00000000-dead-beef-0000-000000000001';
const TOKEN = jwt.sign({ userId: USER }, 'e2e-test-secret', { expiresIn: '1h' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });

let pass = 0, fail = 0; const failed = [];
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${label} -> ${a}`); }
  else { fail++; failed.push(label); console.log(`  FAIL ${label}\n         expected ${e}\n         actual   ${a}`); }
};
const api = async (p, o = {}) => {
  const r = await fetch(BASE + p, { ...o, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, ...(o.headers || {}) } });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const review = (card_id, rating) => api('/api/anking/review', { method: 'POST', body: JSON.stringify({ card_id, rating }) });
const wipe = async () => {
  await sb.from('anking_review_log').delete().eq('user_id', USER);
  await sb.from('anking_review_state').delete().eq('user_id', USER);
  await sb.from('activity_sessions').delete().eq('user_id', USER);
};
/** Force a card to be due today so a session deterministically includes it. */
const makeDue = (card_id) => sb.from('anking_review_state').upsert({
  user_id: USER, card_id, ease_factor: 2.5, interval_days: 5, due_date: '2020-01-01',
  learning_step: 2, review_count: 1, lapse_count: 0,
  last_reviewed_at: new Date(Date.now() - 86400000 * 6).toISOString(),
}, { onConflict: 'user_id,card_id' });

(async () => {
  await sb.from('users').upsert({ id: USER, username: '__anking_e2e_test__', email: 'anking-e2e@test.invalid', xp: 0, level: 1, games_played: 0, games_won: 0, coins: 0, gems: 0 }, { onConflict: 'id' });
  await wipe();

  // Pick real cards: one of each type, plus one with a real image and one with audio.
  const pick = async (f) => (await f).data?.[0];
  const audio = await pick(sb.from('anking_cards').select('*').eq('card_type', 'cloze').like('question_html', '%[sound:%').limit(1));
  // Must be a DIFFERENT card from `audio` — the audio cards also carry images,
  // and reusing one card for both fixtures chains the ratings and invalidates
  // the per-rating interval maths below.
  const cloze = await pick(sb.from('anking_cards').select('*').eq('card_type', 'cloze')
    .not('media_keys', 'eq', '{}').like('question_html', '%<img%').neq('id', audio.id).limit(1));
  const mcq   = await pick(sb.from('anking_cards').select('*').eq('card_type', 'mcq').limit(1));
  const basic = await pick(sb.from('anking_cards').select('*').eq('card_type', 'basic').limit(1));
  console.log('\n════ CARDS UNDER TEST ════');
  for (const [k, c] of Object.entries({ cloze, audio, mcq, basic })) console.log(`  ${k.padEnd(6)} ${c.id}  ${c.subject}`);

  for (const c of [cloze, audio, mcq, basic]) await makeDue(c.id);

  // ── MEDIA RESOLUTION ──
  console.log('\n════ MEDIA RESOLUTION (server-side join) ════');
  const { body } = await api('/api/anking/due-cards');
  const byId = Object.fromEntries(body.due_reviews.map((d) => [d.card.id, d.card]));
  const imgCard = byId[cloze.id];
  check('due batch includes the image card', !!imgCard, true);
  check('card carries a resolved media map', typeof imgCard.media === 'object' && Object.keys(imgCard.media).length > 0, true);

  const rawSrc = imgCard.question_html.match(/<img[^>]+src="([^"]+)"/)?.[1];
  console.log(`  raw <img src> in stored html: "${rawSrc}"`);
  const resolved = imgCard.media[rawSrc];
  check('the raw filename maps to a public URL', typeof resolved?.url === 'string' && resolved.url.includes('/storage/v1/object/public/anking-media/'), true);
  console.log(`  -> ${resolved.url}`);

  const r = await fetch(resolved.url);
  const buf = Buffer.from(await r.arrayBuffer());
  const magic = buf.slice(0, 4).toString('hex');
  check('image actually loads over HTTP', [r.status, r.headers.get('content-type')], [200, 'image/jpeg']);
  check('  and is a real JPEG', magic.startsWith('ffd8ff'), true);
  console.log(`  fetched ${buf.length} bytes, magic ${magic}`);

  const audCard = byId[audio.id];
  const sndName = audCard.question_html.match(/\[sound:([^\]]+)\]/)?.[1];
  console.log(`  raw [sound:] reference: "${sndName}"`);
  const audUrl = audCard.media[sndName];
  check('audio reference maps to a public URL', typeof audUrl?.url === 'string', true);
  const ar = await fetch(audUrl.url);
  check('audio actually loads over HTTP', [ar.status, ar.headers.get('content-type')], [200, 'audio/mpeg']);
  console.log(`  -> ${audUrl.url}`);

  // Client-side rewrite (mirrors AnKingMode.jsx resolveMedia)
  const resolveMedia = (html, media) => {
    let out = html.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (full, pre, src, post) => media[src] ? `${pre}${media[src].url}${post}` : full);
    return out.replace(/\[sound:([^\]]+)\]/gi, (full, n) => media[n] ? `<audio class="anking-audio" controls preload="none" src="${media[n].url}"></audio>` : '');
  };
  const rewritten = resolveMedia(audCard.question_html, audCard.media);
  check('rewrite swaps <img> src for a URL', /<img[^>]+src="https:\/\/[^"]*anking-media/.test(rewritten), true);
  check('rewrite converts [sound:] to <audio>', /<audio class="anking-audio" controls/.test(rewritten), true);
  check('no [sound:] literal survives', /\[sound:/.test(rewritten), false);

  // ── CARD TYPE PAYLOADS ──
  console.log('\n════ PER-TYPE PAYLOAD ════');
  check('cloze: question_html carries the cloze-blank span', /class="cloze-blank"/.test(byId[cloze.id].question_html) || /class="cloze-blank"/.test(byId[audio.id].question_html), true);
  const m = byId[mcq.id];
  check('mcq: options are a real array with letter+text', Array.isArray(m.mcq_options) && typeof m.mcq_options[0].letter === 'string' && typeof m.mcq_options[0].text === 'string', true);
  check('mcq: correct letter is present and among the options', m.mcq_options.some((o) => o.letter === m.mcq_correct_letter), true);
  console.log(`  mcq correct=${m.mcq_correct_letter} options=${m.mcq_options.map((o) => o.letter).join('')}`);
  const b = byId[basic.id];
  check('basic: has question + answer, no options', [typeof b.question_html, typeof b.answer_html, b.mcq_options], ['string', 'string', null]);

  // ── RATINGS: verify DB math ──
  console.log('\n════ RATINGS -> anking_review_state ════');
  const stateOf = async (id) => (await sb.from('anking_review_state').select('*').eq('user_id', USER).eq('card_id', id).maybeSingle()).data;

  // seeded: interval 5, ease 2.5
  await review(cloze.id, 'good');
  let st = await stateOf(cloze.id);
  console.log(`  cloze  good: interval 5 -> ${st.interval_days} (5*2.5=12.5->13), ease ${st.ease_factor}`);
  check('good on interval 5 -> 13', [st.interval_days, Number(st.ease_factor)], [13, 2.5]);

  await review(mcq.id, 'hard');
  st = await stateOf(mcq.id);
  console.log(`  mcq    hard: interval 5 -> ${st.interval_days} (5*1.2=6), ease ${st.ease_factor} (2.5-0.15)`);
  check('hard on interval 5 -> 6, ease 2.35', [st.interval_days, Number(st.ease_factor)], [6, 2.35]);

  await review(basic.id, 'again');
  st = await stateOf(basic.id);
  console.log(`  basic  again: interval 5 -> ${st.interval_days} (lapse), ease ${st.ease_factor}, lapses ${st.lapse_count}`);
  check('again on review -> lapse to 1, ease 2.3', [st.interval_days, Number(st.ease_factor), st.lapse_count], [1, 2.3, 1]);

  await review(audio.id, 'easy');
  st = await stateOf(audio.id);
  console.log(`  audio  easy: interval 5 -> ${st.interval_days} (5*2.5*1.3=16.25->16), ease ${st.ease_factor}`);
  check('easy on interval 5 -> 16, ease 2.65', [st.interval_days, Number(st.ease_factor)], [16, 2.65]);

  // ── SESSION CAP + CONTINUE ──
  console.log('\n════ SESSION CAP + CONTINUE ════');
  await wipe();
  const batch1 = (await api('/api/anking/due-cards')).body;
  const b1 = [...batch1.due_reviews.map((d) => d.card), ...batch1.new_cards].slice(0, 20);
  check('first batch caps at 20', b1.length, 20);
  for (const c of b1) await review(c.id, 'good');

  const batch2 = (await api('/api/anking/due-cards')).body;
  const b2 = [...batch2.due_reviews.map((d) => d.card), ...batch2.new_cards].slice(0, 20);
  const overlap = b2.filter((c) => b1.some((x) => x.id === c.id));
  console.log(`  batch1=${b1.length} batch2=${b2.length} overlap=${overlap.length} remaining=${batch2.new_cards_remaining_today}`);
  check('Continue does not re-serve the same cards', overlap.length, 0);
  check('daily new-card allowance exhausted after 20', batch2.new_cards_remaining_today, 0);
  check('batch2 is empty once new cards are used up and nothing is due', b2.length, 0);

  // ── SESSION COMPLETE -> activity_sessions ──
  console.log('\n════ POST /api/anking/session-complete ════');
  const sc = await api('/api/anking/session-complete', { method: 'POST', body: JSON.stringify({ cards_reviewed: 20, good_or_easy_count: 17, duration_seconds: 480, subject: null }) });
  check('returns ok', [sc.status, sc.body.ok], [200, true]);
  const { data: act } = await sb.from('activity_sessions').select('*').eq('user_id', USER).order('ended_at', { ascending: false }).limit(1);
  const a = act[0];
  console.log(`  row: game_mode=${a.game_mode} subject=${a.subject} outcome=${a.outcome_type} score=${a.score_pct}% dur=${a.duration_seconds}s is_win=${a.is_win}`);
  check('game_mode', a.game_mode, 'anking');
  check('subject null for mixed session', a.subject, null);
  check('outcome_type', a.outcome_type, 'score_pct');
  check('score_pct = round(17/20*100)', a.score_pct, 85);
  check('duration_seconds', a.duration_seconds, 480);
  check('is_win null', a.is_win, null);
  check('journey fields null', [a.journey_chapter_name, a.journey_level_name], [null, null]);
  const span = Math.round((Date.parse(a.ended_at) - Date.parse(a.started_at)) / 1000);
  check('started_at/ended_at span matches duration', span, 480);

  const scSubj = await api('/api/anking/session-complete', { method: 'POST', body: JSON.stringify({ cards_reviewed: 10, good_or_easy_count: 10, duration_seconds: 120, subject: 'neurology' }) });
  const { data: act2 } = await sb.from('activity_sessions').select('*').eq('user_id', USER).eq('subject', 'neurology').limit(1);
  check('subject-filtered session records its subject', [scSubj.body.ok, act2[0].subject, act2[0].score_pct], [true, 'neurology', 100]);

  console.log('\n════ VALIDATION ════');
  check('cards_reviewed 0 -> 400', (await api('/api/anking/session-complete', { method: 'POST', body: JSON.stringify({ cards_reviewed: 0, good_or_easy_count: 0, duration_seconds: 10 }) })).status, 400);
  check('good_or_easy > cards_reviewed -> 400', (await api('/api/anking/session-complete', { method: 'POST', body: JSON.stringify({ cards_reviewed: 5, good_or_easy_count: 9, duration_seconds: 10 }) })).status, 400);
  check('negative duration -> 400', (await api('/api/anking/session-complete', { method: 'POST', body: JSON.stringify({ cards_reviewed: 5, good_or_easy_count: 1, duration_seconds: -5 }) })).status, 400);
  const noAuth = await fetch(BASE + '/api/anking/session-complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cards_reviewed: 1, good_or_easy_count: 1, duration_seconds: 1 }) });
  check('no auth -> 401', noAuth.status, 401);

  console.log('\n════ CLEANUP ════');
  await wipe();
  const { count: s } = await sb.from('anking_review_state').select('*', { count: 'exact', head: true }).eq('user_id', USER);
  const { count: l } = await sb.from('anking_review_log').select('*', { count: 'exact', head: true }).eq('user_id', USER);
  const { count: ac } = await sb.from('activity_sessions').select('*', { count: 'exact', head: true }).eq('user_id', USER);
  check('test rows removed', [s, l, ac], [0, 0, 0]);

  console.log(`\n${'='.repeat(60)}\n${pass} passed, ${fail} failed`);
  if (fail) { console.log('failed: ' + failed.join(' | ')); process.exit(1); }
})();
