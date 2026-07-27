'use strict';
/**
 * Unit tests for the AnKing scheduler. Pure — no database, no server.
 *   node server/ankingScheduler.test.js
 */

const S = require('./ankingScheduler');

let pass = 0;
let fail = 0;
const failures = [];

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
    console.log(`  ok   ${label}  -> ${a}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  FAIL ${label}\n         expected ${e}\n         actual   ${a}`);
  }
}

// Fixed clock: 2026-07-27T12:00:00Z
const NOW = new Date('2026-07-27T12:00:00.000Z');
const pick = (s) => ({
  interval: s.interval_days,
  ease: s.ease_factor,
  step: s.learning_step,
  due: s.due_date,
  reviews: s.review_count,
  lapses: s.lapse_count,
});

console.log('\n── NEW CARD (no state row) ──');
check('new + again    (restart step 0, due in 1 min -> today)',
  pick(S.computeNextReview(null, 'again', NOW)),
  { interval: 0, ease: 2.5, step: 0, due: '2026-07-27', reviews: 1, lapses: 0 });

check('new + hard     (repeat step 0)',
  pick(S.computeNextReview(null, 'hard', NOW)),
  { interval: 0, ease: 2.5, step: 0, due: '2026-07-27', reviews: 1, lapses: 0 });

check('new + good     (step 0 -> step 1, still learning)',
  pick(S.computeNextReview(null, 'good', NOW)),
  { interval: 0, ease: 2.5, step: 1, due: '2026-07-27', reviews: 1, lapses: 0 });

const atStep1 = { ease_factor: 2.5, interval_days: 0, learning_step: 1, review_count: 1, lapse_count: 0 };
check('new + good     (step 1 = last step -> GRADUATE, interval 1)',
  pick(S.computeNextReview(atStep1, 'good', NOW)),
  { interval: 1, ease: 2.5, step: 2, due: '2026-07-28', reviews: 2, lapses: 0 });

check('new + easy     (graduate immediately, interval 4)',
  pick(S.computeNextReview(null, 'easy', NOW)),
  { interval: 4, ease: 2.5, step: 2, due: '2026-07-31', reviews: 1, lapses: 0 });

check('new + easy from step 1 (still graduates at 4)',
  pick(S.computeNextReview(atStep1, 'easy', NOW)),
  { interval: 4, ease: 2.5, step: 2, due: '2026-07-31', reviews: 2, lapses: 0 });

console.log('\n── REVIEW CARD (interval_days > 0) ──');
const review = { ease_factor: 2.5, interval_days: 10, learning_step: 2, review_count: 5, lapse_count: 0 };

check('review + again (lapse: interval->1, ease 2.5-0.2)',
  pick(S.computeNextReview(review, 'again', NOW)),
  { interval: 1, ease: 2.3, step: 2, due: '2026-07-28', reviews: 6, lapses: 1 });

check('review + hard  (10*1.2=12, ease 2.5-0.15)',
  pick(S.computeNextReview(review, 'hard', NOW)),
  { interval: 12, ease: 2.35, step: 2, due: '2026-08-08', reviews: 6, lapses: 0 });

check('review + good  (10*2.5=25, ease unchanged)',
  pick(S.computeNextReview(review, 'good', NOW)),
  { interval: 25, ease: 2.5, step: 2, due: '2026-08-21', reviews: 6, lapses: 0 });

check('review + easy  (10*2.5*1.3=32.5 -> 33, ease 2.5+0.15)',
  pick(S.computeNextReview(review, 'easy', NOW)),
  { interval: 33, ease: 2.65, step: 2, due: '2026-08-29', reviews: 6, lapses: 0 });

console.log('\n── EASE FLOOR (MIN_EASE = 1.3) ──');
let s = { ease_factor: 2.5, interval_days: 10, learning_step: 2, review_count: 0, lapse_count: 0 };
const easeTrail = [s.ease_factor];
for (let i = 0; i < 12; i++) {
  s = S.computeNextReview(s, 'again', NOW);
  easeTrail.push(s.ease_factor);
}
console.log(`  ease after each of 12 consecutive Agains: ${easeTrail.join(' -> ')}`);
check('ease never drops below MIN_EASE after 12 Agains', s.ease_factor, 1.3);
check('  floor holds exactly (not 1.29999…)', easeTrail.every((e) => e >= 1.3), true);
check('  lapse_count incremented every time', s.lapse_count, 12);
check('  review_count incremented every time', s.review_count, 12);

let h = { ease_factor: 1.4, interval_days: 10, learning_step: 2, review_count: 0, lapse_count: 0 };
h = S.computeNextReview(h, 'hard', NOW);
check('hard penalty also clamps at floor (1.4-0.15 -> 1.3)', h.ease_factor, 1.3);
h = S.computeNextReview(h, 'hard', NOW);
check('  and stays there', h.ease_factor, 1.3);

console.log('\n── SEQUENCES ──');
let seq = null;
const trail = [];
for (const r of ['again', 'good', 'good', 'easy', 'hard', 'again', 'good']) {
  seq = S.computeNextReview(seq, r, NOW);
  trail.push(`${r}=>i${seq.interval_days}/e${seq.ease_factor}/s${seq.learning_step}`);
}
console.log('  ' + trail.join('  '));
// Traced by hand: again(step0) -> good(step1) -> good(graduate i=1,e=2.5)
// -> easy(round(1*2.5*1.3)=3, e=2.65) -> hard(round(3*1.2)=4, e=2.50)
// -> again(lapse i=1, e=2.30) -> good(round(1*2.3)=2, e=2.30)
check('sequence ends in a sane review state', pick(seq), { interval: 2, ease: 2.3, step: 2, due: '2026-07-29', reviews: 7, lapses: 1 });

console.log('\n── EDGE CASES ──');
check('interval never rounds below 1 day (1 * 1.2 -> 1)',
  S.computeNextReview({ ease_factor: 2.5, interval_days: 1, learning_step: 2 }, 'hard', NOW).interval_days, 1);

check('previous_interval_days reports the value BEFORE the rating',
  S.computeNextReview({ ease_factor: 2.5, interval_days: 10, learning_step: 2 }, 'good', NOW).previous_interval_days, 10);

check('previous_interval_days is 0 for a brand-new card',
  S.computeNextReview(null, 'good', NOW).previous_interval_days, 0);

check('is_new flags the learning branch', S.computeNextReview(null, 'good', NOW).is_new, true);
check('is_new false once graduated',
  S.computeNextReview({ ease_factor: 2.5, interval_days: 5, learning_step: 2 }, 'good', NOW).is_new, false);

let threw = false;
try { S.computeNextReview(null, '銀'); } catch (_) { threw = true; }
check('invalid rating throws', threw, true);

console.log('\n── isLearningCardDue (sub-day gate) ──');
const justRated = { interval_days: 0, learning_step: 0, last_reviewed_at: NOW.toISOString() };
check('learning card NOT due 30s after rating',
  S.isLearningCardDue(justRated, new Date(NOW.getTime() + 30 * 1000)), false);
check('learning card IS due 2min after rating (step 0 = 1min)',
  S.isLearningCardDue(justRated, new Date(NOW.getTime() + 120 * 1000)), true);
check('step 1 card NOT due 5min after rating (step 1 = 10min)',
  S.isLearningCardDue({ interval_days: 0, learning_step: 1, last_reviewed_at: NOW.toISOString() },
    new Date(NOW.getTime() + 5 * 60000)), false);
check('graduated card is never gated by this',
  S.isLearningCardDue({ interval_days: 5, learning_step: 2, last_reviewed_at: NOW.toISOString() }, NOW), true);

console.log(`\n${'='.repeat(60)}`);
console.log(`${pass} passed, ${fail} failed`);
if (fail) {
  console.log('failed: ' + failures.join(', '));
  process.exit(1);
}
