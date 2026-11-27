'use strict';

/**
 * Sanity check for the Inner Circle banks: `node server/innercircle/check.js`.
 * Fails (exit 1) on a broken row; prints the answer-is-longest rate, which
 * should stay well under half (chance is 20%).
 */

const { SYSTEMS, BANKS } = require('./index');

let bad = 0;
const fail = (q, msg) => { bad += 1; console.log(`✗ [${q.system}/${q.section}/${q.topic}] ${msg}\n    ${q.stem.slice(0, 90)}`); };

for (const sys of SYSTEMS) {
  const bank = BANKS[sys.id];
  const stems = new Set();
  const topicSection = {};
  let longest = 0;
  let shortest = 0;
  for (const q of bank) {
    if (q.options.length !== 5) fail(q, `has ${q.options.length} options`);
    if (new Set(q.options.map(o => o.toLowerCase())).size !== q.options.length) fail(q, 'duplicate option');
    if (stems.has(q.stem)) fail(q, 'duplicate stem');
    stems.add(q.stem);
    if (!q.topic || !q.explanation || !q.takeHome) fail(q, 'missing topic, explanation or take-home');
    if (!(q.page >= sys.pages[0] && q.page <= sys.pages[1])) fail(q, `page ${q.page} outside ${sys.pages}`);
    const marks = (q.explanation.match(/==/g) || []).length;
    if (!marks || marks % 2) fail(q, 'explanation needs balanced ==marks==');
    if (/[‘’“”]/.test(q.options.join('') + q.stem)) fail(q, 'curly quote in stem/options');
    if (q.answer.length > 12 && q.stem.toLowerCase().includes(q.answer.toLowerCase())) fail(q, 'answer appears in the stem');
    if (topicSection[q.topic] && topicSection[q.topic] !== q.section) fail(q, `topic also used in ${topicSection[q.topic]}`);
    topicSection[q.topic] = q.section;
    // Every sentence should end properly (full sentences, not notes).
    if (!/[.!?]$/.test(q.explanation.replace(/==/g, '').trim())) fail(q, 'explanation does not end in a full stop');
    const maxOther = Math.max(...q.options.slice(1).map(o => o.length));
    if (q.answer.length > maxOther) longest += 1;
    if (q.answer.length < Math.min(...q.options.slice(1).map(o => o.length))) shortest += 1;
    if (q.answer.length > maxOther * 2.2 && q.answer.length > 30) fail(q, 'correct answer is far longer than every distractor');
  }
  const topics = Object.keys(topicSection).length;
  console.log(`${sys.name}: ${bank.length} questions, ${topics} topics, ${sys.sections.length} sections; answer is longest ${Math.round((longest / bank.length) * 100)}%, shortest ${Math.round((shortest / bank.length) * 100)}%`);
}
if (bad) { console.log(`\n${bad} problem(s).`); process.exit(1); }
console.log('OK');
