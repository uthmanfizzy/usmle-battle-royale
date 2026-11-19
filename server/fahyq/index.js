'use strict';

/**
 * FA HY Qs — high-yield vignettes for First Aid Journey, one bank per First
 * Aid chapter. The banks are code (original wording), so a change ships with
 * a commit; run check.js after editing.
 */

const CHAPTERS = [
  { id: 'endo', name: 'Endocrine', icon: '🦋', file: './endocrine', pages: [329, 362] },
  { id: 'immuno', name: 'Immunology', icon: '🛡️', file: './immunology', pages: [93, 119] },
];

// The book's section for a page, so a run can be narrowed to one part.
const SECTION_RANGES = {
  endo: [[330, 330, 'Embryology'], [331, 331, 'Anatomy'], [332, 341, 'Physiology'], [342, 357, 'Pathology'], [358, 361, 'Pharmacology']],
  immuno: [[94, 96, 'Lymphoid Structures'], [97, 101, 'Cellular Components'], [102, 117, 'Immune Responses'], [118, 119, 'Immunosuppressants']],
};
// A chapter's sections, in book order.
const sectionsOf = (ch) => (SECTION_RANGES[ch] || []).map(r => r[2]);
const sectionOf = (ch, page) => (SECTION_RANGES[ch] || []).find(([a, b]) => page >= a && page <= b)?.[2] || 'Other';

function build(ch) {
  const rows = require(ch.file);
  return rows.map(([topic, page, stem, options, explanation]) => ({
    // Stable id from the stem, not the row's position, so a question keeps
    // its id (and its ratings) when rows are added or reordered.
    id: `${ch.id}-${require('crypto').createHash('sha1').update(stem).digest('hex').slice(0, 10)}`,
    chapter: ch.id, section: sectionOf(ch.id, page), topic, page,
    stem, answer: options[0], options, explanation,
  }));
}

const BANKS = Object.fromEntries(CHAPTERS.map(c => [c.id, build(c)]));
const COUNTS = [10, 20, 40, 0];   // 0 = all

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function catalog() {
  return {
    chapters: CHAPTERS.map(c => {
      const bank = BANKS[c.id];
      const sections = sectionsOf(c.id).map(s => ({ id: s, count: bank.filter(q => q.section === s).length })).filter(s => s.count);
      return { id: c.id, name: c.name, icon: c.icon, pages: c.pages, count: bank.length, sections };
    }),
    counts: COUNTS,
  };
}

/** A run: shuffled questions, each with shuffled options and the correct index (solo, marked in the browser). */
// `ids` (optional) narrows the run to particular questions — the browser sends
// the ones the student rated a certain way (e.g. Knowledge Gap). An empty
// list means "no filter"; the browser never sends one when a filter is on.
function run({ chapter, sections, count, ids }) {
  const bank = BANKS[chapter] || [];
  const want = (sections || []).filter(s => sectionsOf(chapter).includes(s));
  const only = ids && ids.length ? new Set(ids) : null;
  const pool = bank.filter(q => (!want.length || want.includes(q.section)) && (!only || only.has(q.id)));
  const n = COUNTS.includes(Number(count)) ? Number(count) : 20;
  const picked = shuffle(pool);
  return (n ? picked.slice(0, n) : picked).map(q => {
    const options = shuffle(q.options);
    return { id: q.id, section: q.section, topic: q.topic, page: q.page, stem: q.stem, options, correct: options.indexOf(q.answer), explanation: q.explanation };
  });
}

function mount(app, { rateLimit }) {
  app.get('/api/fa-hyq/catalog', rateLimit(60, 60000), (req, res) => res.json(catalog()));
  app.get('/api/fa-hyq/run', rateLimit(30, 60000), (req, res) => {
    res.json({ questions: run({
      chapter: String(req.query.chapter || 'endo'),
      sections: String(req.query.sections || '').split(',').filter(Boolean),
      count: req.query.count,
      ids: String(req.query.ids || '').split(',').filter(x => /^[a-z_]+-[0-9a-f]{10}$/.test(x)).slice(0, 500),
    }) });
  });
}

module.exports = { BANKS, CHAPTERS, catalog, run, mount };
