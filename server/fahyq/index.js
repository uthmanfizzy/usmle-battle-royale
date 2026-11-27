'use strict';

/**
 * FA HY Qs — high-yield vignettes for First Aid Journey, one bank per First
 * Aid chapter. The banks are code (original wording), so a change ships with
 * a commit; run check.js after editing.
 *
 * Each chapter belongs to a step: 1 is First Aid for Step 1 (book pages run
 * 31-706), 2 is First Aid for Step 2 CK (its own page numbers). The page
 * lists them under the step the student picked in First Aid Journey.
 */

const CHAPTERS = [
  { id: 'biochem', name: 'Biochemistry', icon: '🧬', file: './biochemistry', pages: [31, 92] },
  { id: 'cardio', name: 'Cardiovascular', icon: '🫀', file: './cardiovascular', pages: [283, 328] },
  { id: 'endo', name: 'Endocrine', icon: '🦋', file: './endocrine', pages: [329, 362] },
  { id: 'immuno', name: 'Immunology', icon: '🛡️', file: './immunology', pages: [93, 119] },
  { id: 'repro', name: 'Reproductive', icon: '🌸', file: './reproductive', pages: [629, 676] },
  { id: 'resp', name: 'Respiratory', icon: '🫁', file: './respiratory', pages: [677, 706] },
  // ── Step 2 CK ──
  { id: 'ob', name: 'Obstetrics', icon: '🤰', file: './obstetrics', pages: [427, 466], step: 2 },
].map(c => ({ step: 1, ...c }));

// The book's section for a page, so a run can be narrowed to one part.
const SECTION_RANGES = {
  biochem: [[32, 43, 'Molecular'], [44, 50, 'Cellular'], [51, 54, 'Laboratory Techniques'], [55, 62, 'Genetics'], [63, 70, 'Nutrition'], [71, 92, 'Metabolism']],
  cardio: [[284, 286, 'Embryology'], [287, 287, 'Anatomy'], [288, 299, 'Physiology'], [300, 320, 'Pathology'], [321, 328, 'Pharmacology']],
  endo: [[330, 330, 'Embryology'], [331, 331, 'Anatomy'], [332, 341, 'Physiology'], [342, 357, 'Pathology'], [358, 361, 'Pharmacology']],
  immuno: [[94, 96, 'Lymphoid Structures'], [97, 101, 'Cellular Components'], [102, 117, 'Immune Responses'], [118, 119, 'Immunosuppressants']],
  repro: [[630, 641, 'Embryology'], [642, 646, 'Anatomy'], [647, 654, 'Physiology'], [655, 672, 'Pathology'], [673, 676, 'Pharmacology']],
  resp: [[678, 679, 'Embryology'], [680, 681, 'Anatomy'], [682, 689, 'Physiology'], [690, 703, 'Pathology'], [704, 706, 'Pharmacology']],
  // Step 2 CK Obstetrics. Pages two sections share (430, 436, 438, 445, 462)
  // name the section on the row itself.
  ob: [[428, 429, 'Basics of Pregnancy'], [430, 435, 'Prenatal Care & Testing'], [436, 437, 'Abortion'],
    [438, 444, 'Maternal Complications'], [445, 453, 'Obstetric Complications'], [454, 456, 'Normal Labor & Delivery'],
    [457, 461, 'Abnormal Labor & Delivery'], [462, 466, 'Puerperium']],
};
// A chapter's sections, in book order.
const sectionsOf = (ch) => (SECTION_RANGES[ch] || []).map(r => r[2]);
const sectionOf = (ch, page) => (SECTION_RANGES[ch] || []).find(([a, b]) => page >= a && page <= b)?.[2] || 'Other';

function build(ch) {
  const rows = require(ch.file);
  // An optional 6th field names the section outright, for a page the book
  // shares between two sections (biochem p50: elastin, then PCR).
  return rows.map(([topic, page, stem, options, explanation, section]) => ({
    // Stable id from the stem, not the row's position, so a question keeps
    // its id (and its ratings) when rows are added or reordered.
    id: `${ch.id}-${require('crypto').createHash('sha1').update(stem).digest('hex').slice(0, 10)}`,
    chapter: ch.id, section: section || sectionOf(ch.id, page), topic, page,
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
      return { id: c.id, name: c.name, icon: c.icon, pages: c.pages, step: c.step, count: bank.length, sections };
    }),
    counts: COUNTS,
  };
}

/** A run: shuffled questions, each with shuffled options and the correct index (solo, marked in the browser). */
// `ids` (optional) narrows the run to particular questions — the browser sends
// the ones the student rated a certain way (e.g. Knowledge Gap). An empty
// list means "no filter"; the browser never sends one when a filter is on.
function run({ chapter, sections, count, ids, unrated, rated }) {
  const bank = BANKS[chapter] || [];
  const want = (sections || []).filter(s => sectionsOf(chapter).includes(s));
  // A rating filter: the picked ids, plus (with `unrated`) every question not in `rated`.
  const only = (ids && ids.length) || unrated ? new Set(ids || []) : null;
  const ratedSet = new Set(rated || []);
  const pool = bank.filter(q => (!want.length || want.includes(q.section))
    && (!only || only.has(q.id) || (unrated && !ratedSet.has(q.id))));
  const n = COUNTS.includes(Number(count)) ? Number(count) : 20;
  const picked = shuffle(pool);
  return (n ? picked.slice(0, n) : picked).map(q => {
    const options = shuffle(q.options);
    return { id: q.id, section: q.section, topic: q.topic, page: q.page, stem: q.stem, options, correct: options.indexOf(q.answer), explanation: q.explanation };
  });
}

function mount(app, { rateLimit }) {
  app.get('/api/fa-hyq/catalog', rateLimit(60, 60000), (req, res) => res.json(catalog()));
  const idList = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
    .map(String).filter(x => /^[a-z_]+-[0-9a-f]{10}$/.test(x)).slice(0, 5000);
  app.get('/api/fa-hyq/run', rateLimit(30, 60000), (req, res) => {
    res.json({ questions: run({
      chapter: String(req.query.chapter || 'endo'),
      sections: String(req.query.sections || '').split(',').filter(Boolean),
      count: req.query.count,
      ids: idList(req.query.ids),
    }) });
  });
  // POST takes long id lists: the rating filter, and `unrated` + `rated` (ids to leave out).
  app.post('/api/fa-hyq/run', rateLimit(30, 60000), (req, res) => {
    const b = req.body || {};
    res.json({ questions: run({
      chapter: String(b.chapter || 'endo'),
      sections: (Array.isArray(b.sections) ? b.sections : []).map(String),
      count: b.count,
      ids: idList(b.ids),
      unrated: b.unrated === true,
      rated: idList(b.rated),
    }) });
  });
}

module.exports = { BANKS, CHAPTERS, SECTION_RANGES, catalog, run, mount };
