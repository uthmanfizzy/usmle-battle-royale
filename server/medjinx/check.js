'use strict';

/**
 * Checks the MedJinx bank and the matcher. Run after adding or editing a
 * topic:
 *
 *     node server/medjinx/check.js
 *
 * Exits non-zero on any problem, so it can sit in front of a deploy.
 */
const { TOPICS } = require('./bank');
const E = require('./engine');

let failed = 0;
const fail = (msg) => { failed += 1; console.error('  FAIL  ' + msg); };

// ── The bank ────────────────────────────────────────────────────────────────

const ids = new Set();
let answerCount = 0;
for (const topic of TOPICS) {
  if (ids.has(topic.id)) fail(`duplicate topic id ${topic.id}`);
  ids.add(topic.id);

  for (const f of ['title', 'subject', 'system', 'difficulty', 'description', 'vignette', 'vignetteType', 'source']) {
    if (!topic[f]) fail(`${topic.id}: missing ${f}`);
  }
  if (!['easy', 'intermediate', 'advanced'].includes(topic.difficulty)) fail(`${topic.id}: bad difficulty`);
  if (!Array.isArray(topic.takeaways) || topic.takeaways.length < 3 || topic.takeaways.length > 5) {
    fail(`${topic.id}: needs 3-5 takeaways`);
  }

  const tiers = new Set();
  for (const a of topic.answers) {
    answerCount += 1;
    if (!E.TIER_POINTS[a.tier]) fail(`${topic.id}: "${a.label}" has tier ${a.tier}`);
    if (!E.CATEGORIES[a.category]) fail(`${topic.id}: "${a.label}" has category ${a.category}`);
    if (!a.why) fail(`${topic.id}: "${a.label}" has no explanation`);
    tiers.add(a.tier);
  }
  for (const t of [1, 2, 3, 4, 5]) if (!tiers.has(t)) fail(`${topic.id}: no tier ${t} answer`);

  // Both variants, because the diagnosis is an answer in one and a trap in
  // the other and can collide with different entries in each.
  for (const variant of ['open', 'clinical']) {
    const c = E.compileTopic(topic, variant);
    for (const p of c.problems) fail(`[${variant}] ${p}`);

    // Every label and synonym must come back as its own answer; every trap
    // term as a trap. This is what catches a fuzzy match stealing an entry.
    for (const a of topic.answers) {
      for (const text of [a.label, ...(a.syn || [])]) {
        const m = E.matchAnswer(c, text);
        if (m.status !== 'accepted' || m.answer.label !== a.label) {
          fail(`[${variant}] ${topic.id}: "${text}" should match "${a.label}", got ${m.status}${m.answer ? ` "${m.answer.label}"` : ''}`);
        }
      }
    }
    for (const tr of topic.traps || []) {
      for (const text of tr.terms) {
        const m = E.matchAnswer(c, text);
        if (m.status !== 'trap') fail(`[${variant}] ${topic.id}: trap "${text}" came back ${m.status}`);
      }
    }
  }
}

// ── The matcher ─────────────────────────────────────────────────────────────

const hypo = E.compileTopic(TOPICS.find(t => t.id === 'hypothyroidism'), 'open');
const expect = (text, status, label) => {
  const m = E.matchAnswer(hypo, text);
  const ok = m.status === status && (!label || m.answer?.label === label);
  if (!ok) fail(`matcher: "${text}" → ${m.status}${m.answer ? ` "${m.answer.label}"` : ''}, wanted ${status}${label ? ` "${label}"` : ''}`);
};
expect('Anti-TPO', 'accepted', 'Anti-thyroid peroxidase antibodies');
expect('anti-thyroid peroxidase antibodies', 'accepted', 'Anti-thyroid peroxidase antibodies');
expect('TPO antibodies', 'accepted', 'Anti-thyroid peroxidase antibodies');
expect('Hürthle cells', 'accepted', 'Hurthle cells');
expect('hurtle cells', 'accepted', 'Hurthle cells');             // a typo
expect('raised TSH', 'accepted', 'Elevated TSH');
expect('↑TSH', 'accepted', 'Elevated TSH');
expect('TSH elevated', 'accepted', 'Elevated TSH');             // word order
expect('hypercholesterolaemia', 'accepted', 'Hypercholesterolemia');
expect('constipaton', 'accepted', 'Constipation');
expect('High T4', 'trap');
expect('pretibial myxedema', 'trap');
expect('low TSH', 'trap');                                      // must not fuzzy onto "high tsh"
expect('hypothyroidism', 'trap');                               // the topic itself, in an open round
expect('banana', 'unknown');
expect('', 'empty');

const clin = E.compileTopic(TOPICS.find(t => t.id === 'hypothyroidism'), 'clinical');
if (E.matchAnswer(clin, 'hypothyroidism').status !== 'accepted') fail('clinical: the diagnosis should be an answer');
if (E.matchAnswer(clin, 'hyperthyroidism').status === 'accepted') fail('clinical: hyperthyroidism must not fuzzy-match hypothyroidism');

// ── Scoring ─────────────────────────────────────────────────────────────────

{
  const hashimoto = hypo.answers.find(a => a.label === 'Hashimoto thyroiditis');
  const fatigue = hypo.answers.find(a => a.label === 'Fatigue');
  const found = new Map([
    ['p1', new Map([[hashimoto.id, 'hashimoto'], [fatigue.id, 'fatigue']])],
    ['p2', new Map([[hashimoto.id, 'hashimotos']])],
    ['p3', new Map()],
  ]);
  const s = E.scoreRound(hypo, found);
  if (s.players.get('p1').points !== 2000 + 1000) fail(`scoring: p1 got ${s.players.get('p1').points}, wanted 3000`);
  if (s.players.get('p2').points !== 2000) fail(`scoring: p2 got ${s.players.get('p2').points}, wanted 2000`);
  if (s.players.get('p1').unique !== 1) fail('scoring: p1 should have one unique answer');
  if (E.scoreRound(hypo, found, 'double').players.get('p2').points !== 4000) fail('scoring: double points');
  if (E.scoreRound(hypo, found, 'rare').players.get('p1').points !== 0) fail('scoring: rare knowledge should pay nothing below tier 4');
  if (E.scoreRound(hypo, found, 'reverse').players.get('p1').points !== 2000 + 8000) fail('scoring: reverse jinx');
}

console.log(`${TOPICS.length} topics, ${answerCount} answers.`);
if (failed) { console.error(`${failed} problem(s).`); process.exit(1); }
console.log('All checks passed.');
