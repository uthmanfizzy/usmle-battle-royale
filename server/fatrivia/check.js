'use strict';
// node server/fatrivia/check.js — validates every FA Trivia bank.
const { BANKS, CHAPTERS } = require('./index');
let problems = 0;
const bad = (q, msg) => { problems++; console.log(`${q.id} [${q.topic}] ${msg}`); };
for (const [ch, bank] of Object.entries(BANKS)) {
  const seen = new Set();
  for (const q of bank) {
    if (q.options.length !== 4) bad(q, `has ${q.options.length} options (want 4)`);
    const lower = q.options.map(o => o.trim().toLowerCase());
    if (new Set(lower).size !== lower.length) bad(q, 'duplicate options');
    if (q.options.some(o => !o.trim())) bad(q, 'empty option');
    const longestWrong = Math.max(...q.options.slice(1).map(o => o.length));
    if (q.answer.length > longestWrong * 1.5 + 6) bad(q, `answer stands out by length (${q.answer.length} vs ${longestWrong})`);
    if (q.question.length < 20) bad(q, 'question too short');
    if (!/[?.]$/.test(q.question.trim())) bad(q, 'question should end with ? or .');
    if (!q.fact || q.fact.length < 25) bad(q, 'fun fact too short');
    const marks = q.fact.split('==').length - 1;
    if (marks % 2) bad(q, 'unbalanced == highlight');
    if (q.question.toLowerCase().includes(q.answer.toLowerCase()) && q.answer.length > 5) bad(q, 'answer appears in the question');
    if (/[‘’“”]/.test(q.question + q.fact + q.options.join(''))) bad(q, 'smart quote');
    if (seen.has(q.question)) bad(q, 'duplicate question');
    seen.add(q.question);
    const [lo, hi] = CHAPTERS.find(c => c.id === ch).pages;
    if (!(q.page >= lo && q.page <= hi)) bad(q, `page ${q.page} is outside the chapter (${lo}-${hi})`);
    if (q.section === 'Other') bad(q, `page ${q.page} has no category`);
  }
  const by = {};
  bank.forEach(q => { by[q.section] = (by[q.section] || 0) + 1; });
  const longest = bank.filter(q => q.answer.length > Math.max(...q.options.slice(1).map(o => o.length))).length;
  console.log(`${ch}: ${bank.length} questions, ${new Set(bank.map(q => q.topic)).size} topics`, by,
    `| answer is the longest option in ${Math.round((longest / bank.length) * 100)}%`);
}
console.log(problems ? `${problems} problem(s)` : 'OK');
process.exit(problems ? 1 : 0);
