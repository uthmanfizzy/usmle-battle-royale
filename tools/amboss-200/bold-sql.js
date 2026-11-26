'use strict';
/**
 * Bold the key clues in the 200 Concepts stems.
 *
 *   node tools/amboss-200/bold-sql.js
 *
 * Reads data/bold.js (question number -> exact phrases from that stem),
 * checks every phrase against data/questions.js, and writes
 * out/amboss-200-bold.sql: one UPDATE per question that wraps each phrase in
 * **…** (the stem renderer's bold). Paste it into the Supabase SQL editor.
 *
 * The SQL edits the LIVE text with replace(), so a stem changed since import
 * still gets whatever phrases it still contains; a stem that already has any
 * ** in it is left alone, so running it twice does nothing. The markers are
 * not visible characters, so highlights already saved on a stem stay put.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'data');
const OUT = path.join(__dirname, 'out');
const Q = require(path.join(DATA, 'questions.js'));
const BOLD = require(path.join(DATA, 'bold.js'));

const errors = [];
const warns = [];
const sql = [
  '-- 200 Concepts: bold the key clues in each stem (tools/amboss-200/bold-sql.js).',
  '-- Safe to run twice: a stem that already contains ** is skipped.',
];
let phrases = 0;

for (const q of Q) {
  const list = BOLD[q.n];
  if (!list || !list.length) { warns.push(`Q${q.n}: no phrases`); continue; }
  const stem = q.stem;
  if (/\*\*|__/.test(stem)) warns.push(`Q${q.n}: stem already has markup`);
  const spans = [];
  for (const p of list) {
    const at = stem.indexOf(p);
    if (at < 0) { errors.push(`Q${q.n}: not in stem: "${p}"`); continue; }
    if (/[\n|]/.test(p)) { errors.push(`Q${q.n}: crosses a line or table cell: "${p}"`); continue; }
    if (p !== p.trim()) { errors.push(`Q${q.n}: leading/trailing space: "${p}"`); continue; }
    const again = stem.indexOf(p, at + 1);
    if (again >= 0) warns.push(`Q${q.n}: "${p}" appears more than once (all are bolded)`);
    spans.push([at, at + p.length, p]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < spans.length; i++) {
    if (spans[i][0] < spans[i - 1][1]) errors.push(`Q${q.n}: "${spans[i - 1][2]}" overlaps "${spans[i][2]}"`);
  }
  if (!spans.length) continue;
  phrases += spans.length;
  let expr = 'question';
  for (const [, , p] of spans) expr = `replace(${expr}, $b$${p}$b$, $b$**${p}**$b$)`;
  const id = `AMB200-${String(q.n).padStart(3, '0')}`;
  sql.push(`UPDATE questions SET question = ${expr} WHERE question_id = '${id}' AND position('**' in question) = 0;`);
}

warns.forEach(w => console.warn('warn ', w));
if (errors.length) {
  errors.forEach(e => console.error('ERROR', e));
  console.error(`\n${errors.length} problem(s); no SQL written.`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'amboss-200-bold.sql');
fs.writeFileSync(file, sql.join('\n') + '\n');
console.log(`${phrases} phrases across ${sql.length - 2} questions -> ${path.relative(process.cwd(), file)}`);
