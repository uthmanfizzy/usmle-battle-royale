#!/usr/bin/env node
'use strict';
/**
 * Amboss Quest → 200 Concepts: builds the Supabase import.
 *
 *   node tools/amboss-200/build.js            # every question must have an answer
 *   node tools/amboss-200/build.js --partial  # only the answered ones
 *
 * Reads (local only, gitignored: the repo is public):
 *   data/questions.js   the transcription, one entry per question
 *   data/answers.txt    optional: "1 E", "2. B", "3) C", ... one per line,
 *                       which overrides any `ans` in questions.js
 *   data/images/        amboss200-q001.jpg, ... one per question with a figure
 *
 * Writes out/amboss-200-concepts-partNN-of-MM.sql: run them in order in the
 * Supabase SQL editor (it rejects one big file). The questions upsert on question_id (AMB200-001 ... AMB200-200), so running it again
 * with corrected answers updates the rows in place. Figures go in as data:
 * URIs in image_url — there are no storage credentials on this machine, and a
 * data URI renders anywhere an <img src> does. An admin can swap any of them
 * for an uploaded picture later from the 200 Concepts admin tab.
 *
 * No answer, no row. `correct` is NOT NULL and the bank grades on it, so a
 * question imported without its answer would mark every right reply wrong.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'out');
const TAG = 'amboss_200_concepts';
const PARTIAL = process.argv.includes('--partial');

// AMBOSS's sixteen sections → this app's subject ids (all active live).
const SUBJECT = {
  'Biochemistry and genetics': 'biochemistry',
  'General pathology': 'pathology',
  'General pharmacology': 'pharmacology',
  'Microbiology': 'microbiology',
  'Immune system': 'immunology',
  'Blood & lymphoreticular system': 'haematology_oncology',
  'Cardiovascular system': 'cardiology',
  'Endocrine system': 'endocrinology',
  'Gastrointestinal system': 'gastroenterology',
  'Skin & musculoskeletal system': 'musculoskeletal',
  'Nervous system & special senses': 'neurology',
  'Behavioral health': 'psychiatry',
  'Renal & urinary system': 'nephrology',
  'Pregnancy & reproductive system': 'reproductive',
  'Respiratory system': 'pulmonology',
  'Biostatistics, epidemiology & social sciences': 'biostatistics',
};

const Q = require(path.join(DATA, 'questions.js'));

// answers.txt wins over any `ans` written into questions.js.
const answers = new Map(Q.filter(q => q.ans).map(q => [q.n, q.ans]));
const ansFile = path.join(DATA, 'answers.txt');
if (fs.existsSync(ansFile)) {
  for (const line of fs.readFileSync(ansFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:Q\s*)?(\d{1,3})\s*[.):\-]?\s*([A-J])\b/i);
    if (m) answers.set(Number(m[1]), m[2].toUpperCase());
  }
}

const problems = [];
const rows = [];
for (const q of Q) {
  const sub = SUBJECT[q.sys];
  if (!sub) problems.push(`Q${q.n}: no subject for section "${q.sys}"`);
  const ans = answers.get(q.n);
  if (!ans) { if (!PARTIAL) problems.push(`Q${q.n}: no answer`); continue; }
  const idx = ans.charCodeAt(0) - 65;
  if (idx < 0 || idx >= q.ch.length) { problems.push(`Q${q.n}: answer ${ans} but only ${q.ch.length} choices`); continue; }
  let image = null;
  if (q.img) {
    const f = path.join(DATA, 'images', `amboss200-q${String(q.n).padStart(3, '0')}.jpg`);
    if (!fs.existsSync(f)) problems.push(`Q${q.n}: figure missing (${path.basename(f)})`);
    else image = 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
  }
  rows.push({
    question_id: `AMB200-${String(q.n).padStart(3, '0')}`,
    question: q.stem,
    choices: q.ch,
    correct: ans,
    category: sub,
    image_url: image,
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s); nothing written.` + (PARTIAL ? '' : ' (--partial imports only the answered questions.)'));
  process.exit(1);
}
if (!rows.length) { console.error('No answered questions yet; nothing written.'); process.exit(1); }

// Dollar-quoting with a tag that cannot occur in the text avoids every
// escaping question for stems full of quotes and apostrophes.
const lit = (s) => {
  if (s == null) return 'NULL';
  const t = String(s);
  if (t.includes('$amb$')) throw new Error('text contains the quote tag');
  return `$amb$${t}$amb$`;
};

// The Supabase SQL editor refuses a query much over ~1 MB, so the import is
// split into numbered files under PART_MAX bytes each: the questions first
// (text only), then the figures as UPDATEs. Run them in order; each file is
// its own transaction and every one is safe to run again.
const PART_MAX = 200 * 1024;
const stmts = [];
for (const r of rows) {
  stmts.push([
    'INSERT INTO questions (question_id, question, choices, correct, category, difficulty, game_modes)',
    `VALUES (${lit(r.question_id)}, ${lit(r.question)}, ${lit(JSON.stringify(r.choices))}::jsonb, ${lit(r.correct)}, ${lit(r.category)}, 'hard', '${JSON.stringify([TAG])}'::jsonb)`,
    'ON CONFLICT (question_id) DO UPDATE SET',
    '  question = EXCLUDED.question, choices = EXCLUDED.choices, correct = EXCLUDED.correct,',
    '  category = EXCLUDED.category,',
    // Merge, never replace: a question an admin has also put in another bank stays there.
    `  game_modes = (SELECT jsonb_agg(DISTINCT m) FROM jsonb_array_elements(COALESCE(questions.game_modes, '[]'::jsonb) || EXCLUDED.game_modes) m),`,
    '  updated_at = NOW();',
  ].join('\n'));
}
for (const r of rows.filter(r => r.image_url)) {
  // Only fills an empty slot, so a picture an admin uploaded later is kept.
  stmts.push(`UPDATE questions SET image_url = ${lit(r.image_url)} WHERE question_id = ${lit(r.question_id)} AND (image_url IS NULL OR image_url = '');`);
}
const parts = [];
let cur = [];
let size = 0;
for (const st of stmts) {
  if (cur.length && size + st.length > PART_MAX) { parts.push(cur); cur = []; size = 0; }
  cur.push(st); size += st.length + 1;
}
if (cur.length) parts.push(cur);

fs.mkdirSync(OUT, { recursive: true });
for (const old of fs.readdirSync(OUT)) if (/^amboss-200-concepts.*\.sql$/.test(old)) fs.unlinkSync(path.join(OUT, old));
parts.forEach((p, i) => {
  const name = `amboss-200-concepts-part${String(i + 1).padStart(2, '0')}-of-${String(parts.length).padStart(2, '0')}.sql`;
  const body = [
    `-- Amboss Quest -> 200 Concepts, part ${i + 1} of ${parts.length}. Generated by tools/amboss-200/build.js.`,
    '-- Run the parts in order in the Supabase SQL editor. Safe to run again.',
    'BEGIN;', ...p, 'COMMIT;', '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, name), body);
  console.log(`${name}  ${(Buffer.byteLength(body) / 1024).toFixed(0)} KB`);
});
console.log(`${rows.length} question(s), ${rows.filter(r => r.image_url).length} figure(s), ${parts.length} file(s) in ${OUT}`);
