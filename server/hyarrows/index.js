'use strict';

/**
 * HY Arrows — Mehlman Rapid Fire's second mode: for each scenario, mark every
 * value ↑, ↓ or ↔ in a table. The bank is code (bank.js); run check.js after
 * editing. Marked in the browser, like FA HY Qs.
 */

const crypto = require('crypto');

const SUBJECTS = [
  { id: 'adrenal', name: 'Adrenal & RAAS', icon: '🧂' },
  { id: 'pituitary', name: 'Pituitary & ADH', icon: '💧' },
  { id: 'thyroid', name: 'Thyroid', icon: '🦋' },
  { id: 'calcium', name: 'Calcium, Bone & Vitamin D', icon: '🦴' },
  { id: 'repro', name: 'Reproductive', icon: '🌸' },
  { id: 'renal', name: 'Renal & Diuretics', icon: '🫘' },
  { id: 'acidbase', name: 'Acid-Base & Toxicology', icon: '⚗️' },
  { id: 'resp', name: 'Respiratory', icon: '🫁' },
  { id: 'cardio', name: 'Cardiovascular', icon: '❤️' },
  { id: 'heme', name: 'Hematology', icon: '🩸' },
  { id: 'biochem', name: 'GI & Biochemistry', icon: '🧬' },
];

const ARROWS = ['↑', '↓', '↔'];

function parseRows(answers) {
  return answers.split('|').map(s => s.trim()).filter(Boolean).map(s => ({ arrow: s[0], label: s.slice(1).trim() }));
}

const BANK = require('./bank').map(([subject, n, stem, answers, explanation, allowed]) => ({
  // Stable id from the stem, so a question keeps it when rows are reordered.
  id: `hya-${crypto.createHash('sha1').update(stem).digest('hex').slice(0, 10)}`,
  subject, n, stem, rows: parseRows(answers), explanation,
  arrows: ARROWS.filter(a => (allowed || '↑↓↔').includes(a)),
}));

const COUNTS = [10, 20, 0];   // 0 = all

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function catalog() {
  return {
    subjects: SUBJECTS.map(s => ({ ...s, count: BANK.filter(q => q.subject === s.id).length })).filter(s => s.count),
    total: BANK.length,
    counts: COUNTS,
  };
}

function run({ subjects, count, order }) {
  const want = (subjects || []).filter(s => SUBJECTS.some(x => x.id === s));
  const pool = BANK.filter(q => !want.length || want.includes(q.subject));
  const n = COUNTS.includes(Number(count)) ? Number(count) : 10;
  // "In order" walks the source document's numbering; otherwise shuffled.
  const list = order === 'book' ? pool.slice().sort((a, b) => a.n - b.n) : shuffle(pool);
  return (n ? list.slice(0, n) : list).map(q => ({ ...q, subjectName: SUBJECTS.find(s => s.id === q.subject)?.name || q.subject }));
}

function mount(app, { rateLimit }) {
  app.get('/api/hy-arrows/catalog', rateLimit(60, 60000), (req, res) => res.json(catalog()));
  app.get('/api/hy-arrows/run', rateLimit(30, 60000), (req, res) => {
    res.json({ questions: run({
      subjects: String(req.query.subjects || '').split(',').filter(Boolean),
      count: req.query.count,
      order: String(req.query.order || ''),
    }) });
  });
}

module.exports = { BANK, SUBJECTS, catalog, run, mount };
