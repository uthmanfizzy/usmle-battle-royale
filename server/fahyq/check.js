'use strict';
// node server/fahyq/check.js — validates every FA HY Qs bank.
const { BANKS, CHAPTERS } = require('./index');
let problems = 0;
const bad = (q, msg) => { problems++; console.log(`${q.id} [${q.topic}] ${msg}`); };
for (const [ch, bank] of Object.entries(BANKS)) {
  const stems = new Set();
  for (const q of bank) {
    if (q.options.length !== 5) bad(q, `has ${q.options.length} options (want 5)`);
    const lower = q.options.map(o => o.trim().toLowerCase());
    if (new Set(lower).size !== lower.length) bad(q, 'duplicate options');
    if (q.options.some(o => !o.trim())) bad(q, 'empty option');
    const longestWrong = Math.max(...q.options.slice(1).map(o => o.length));
    if (q.answer.length > longestWrong * 1.5 + 8) bad(q, `answer stands out by length (${q.answer.length} vs ${longestWrong})`);
    if (q.stem.length < 40) bad(q, 'stem too short');
    if (!/[?.]$/.test(q.stem.trim())) bad(q, 'stem should end with ? or .');
    if (!q.explanation || q.explanation.length < 60) bad(q, 'explanation too short');
    if (/\b(option|choice) [A-E]\b/i.test(q.explanation)) bad(q, 'explanation refers to an option letter (they are shuffled)');
    if (q.stem.toLowerCase().includes(q.answer.toLowerCase()) && q.answer.length > 6) bad(q, 'answer appears in the stem');
    if (stems.has(q.stem)) bad(q, 'duplicate stem');
    stems.add(q.stem);
    const [lo, hi] = CHAPTERS.find(c => c.id === ch).pages;
    if (!(q.page >= lo && q.page <= hi)) bad(q, `page ${q.page} is outside the chapter (${lo}-${hi})`);
    if (q.section === 'Other') bad(q, `page ${q.page} has no section`);
  }
  const bySection = {};
  bank.forEach(q => { bySection[q.section] = (bySection[q.section] || 0) + 1; });
  console.log(`${ch}: ${bank.length} questions, ${new Set(bank.map(q => q.topic)).size} topics`, bySection);
}
console.log(problems ? `${problems} problem(s)` : 'OK');
process.exit(problems ? 1 : 0);
