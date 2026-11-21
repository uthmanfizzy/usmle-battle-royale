'use strict';
// node server/hyarrows/check.js — validates the HY Arrows bank.
const { BANK, SUBJECTS } = require('./index');
let problems = 0;
const bad = (q, msg) => { problems++; console.log(`#${q.n} ${q.id} ${msg}`); };
const stems = new Set();
for (const q of BANK) {
  if (!SUBJECTS.some(s => s.id === q.subject)) bad(q, `unknown subject ${q.subject}`);
  if (!q.rows.length) bad(q, 'no rows');
  if (q.arrows.length < 2) bad(q, 'needs at least two arrow columns');
  for (const r of q.rows) {
    if (!['↑', '↓', '↔'].includes(r.arrow)) bad(q, `row "${r.label}" does not start with an arrow`);
    else if (!q.arrows.includes(r.arrow)) bad(q, `row "${r.label}" answer ${r.arrow} is not an offered column`);
    if (!r.label) bad(q, 'empty row label');
  }
  const labels = q.rows.map(r => r.label.toLowerCase());
  if (new Set(labels).size !== labels.length) bad(q, 'duplicate row labels');
  if (q.stem.length < 25 || !/[?.]$/.test(q.stem)) bad(q, 'stem too short or missing ? / .');
  if (/[↑↓↔]/.test(q.stem)) bad(q, 'arrow in the stem gives the answer away');
  if (!q.explanation || q.explanation.length < 60) bad(q, 'explanation too short');
  if ((q.explanation.split('==').length - 1) % 2) bad(q, 'unbalanced == highlight');
  if (/[‘’“”]/.test(q.stem + q.explanation)) bad(q, 'smart quote');
  if (stems.has(q.stem)) bad(q, 'duplicate stem');
  stems.add(q.stem);
}
const by = {};
BANK.forEach(q => { by[q.subject] = (by[q.subject] || 0) + 1; });
const nums = new Set(BANK.map(q => q.n));
const missing = [];
for (let i = 1; i <= 166; i++) if (!nums.has(i)) missing.push(i);
console.log(`${BANK.length} questions, ${BANK.reduce((n, q) => n + q.rows.length, 0)} arrows`, by);
if (missing.length) console.log('source numbers not covered:', missing.join(', '));
console.log(problems ? `${problems} problem(s)` : 'OK');
process.exit(problems ? 1 : 0);
