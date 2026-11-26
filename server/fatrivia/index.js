'use strict';

/**
 * FA Trivia — quick-fire First Aid trivia for First Aid Journey, one bank per
 * chapter. Where FA HY Qs are vignettes, these are one-line questions with
 * four options and a fun fact: the game-show round of the Journey.
 *
 * Banks are code (original wording), so a change ships with a commit; run
 * `node server/fatrivia/check.js` after editing.
 *
 * Row: [topic, FA page, question, [correct, ...three wrong], fun fact]
 */

const crypto = require('crypto');

const CHAPTERS = [
  { id: 'biochem', name: 'Biochemistry', icon: '🧬', file: './biochemistry', pages: [31, 92] },
  { id: 'micro', name: 'Microbiology', icon: '🦠', file: './microbiology', pages: [121, 200] },
  { id: 'repro', name: 'Reproductive', icon: '🌸', file: './reproductive', pages: [629, 676] },
  { id: 'resp', name: 'Respiratory', icon: '🫁', file: './respiratory', pages: [677, 706] },
];

// The book's sections become the game's categories.
const SECTION_RANGES = {
  biochem: [[32, 43, 'Molecular'], [44, 50, 'Cellular'], [51, 54, 'Laboratory Techniques'], [55, 62, 'Genetics'], [63, 70, 'Nutrition'], [71, 92, 'Metabolism']],
  micro: [[122, 131, 'Basic Bacteriology'], [132, 148, 'Clinical Bacteriology'], [149, 151, 'Mycology'], [152, 158, 'Parasitology'], [159, 173, 'Virology'], [174, 182, 'Systems'], [183, 200, 'Antimicrobials']],
  repro: [[630, 641, 'Embryology'], [642, 646, 'Anatomy'], [647, 654, 'Physiology'], [655, 672, 'Pathology'], [673, 676, 'Pharmacology']],
  resp: [[678, 679, 'Embryology'], [680, 681, 'Anatomy'], [682, 689, 'Physiology'], [690, 703, 'Pathology'], [704, 706, 'Pharmacology']],
};
const sectionsOf = (ch) => (SECTION_RANGES[ch] || []).map(r => r[2]);
const sectionOf = (ch, page) => (SECTION_RANGES[ch] || []).find(([a, b]) => page >= a && page <= b)?.[2] || 'Other';

function build(ch) {
  // An optional 6th field names the category for a page two sections share.
  return require(ch.file).map(([topic, page, question, options, fact, category]) => ({
    // Stable id from the question text, never the row's position.
    id: `${ch.id}-${crypto.createHash('sha1').update(question).digest('hex').slice(0, 10)}`,
    chapter: ch.id, section: category || sectionOf(ch.id, page), topic, page,
    question, answer: options[0], options, fact,
  }));
}

const BANKS = Object.fromEntries(CHAPTERS.map(c => [c.id, build(c)]));
const ROUNDS = [10, 20, 30];

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function catalog() {
  return {
    chapters: CHAPTERS.map(c => {
      const bank = BANKS[c.id];
      const categories = sectionsOf(c.id).map(s => ({ id: s, count: bank.filter(q => q.section === s).length })).filter(s => s.count);
      return { id: c.id, name: c.name, icon: c.icon, pages: c.pages, count: bank.length, categories };
    }),
    rounds: ROUNDS,
  };
}

/** A game: shuffled questions, each with shuffled options and the correct index (marked in the browser). */
function run({ chapter, categories, count, exclude }) {
  const bank = BANKS[chapter] || [];
  const want = (categories || []).filter(s => sectionsOf(chapter).includes(s));
  // `exclude` = ids (or their hash part) the player already saw today.
  const skip = new Set((exclude || []).map(x => String(x).split('-').pop()));
  const pool = bank.filter(q => (!want.length || want.includes(q.section)) && !skip.has(q.id.split('-').pop()));
  const n = ROUNDS.includes(Number(count)) ? Number(count) : 10;
  return shuffle(pool).slice(0, n).map(q => {
    const options = shuffle(q.options);
    return { id: q.id, category: q.section, topic: q.topic, page: q.page, question: q.question, options, correct: options.indexOf(q.answer), fact: q.fact };
  });
}

function mount(app, { rateLimit }) {
  app.get('/api/fa-trivia/catalog', rateLimit(60, 60000), (req, res) => res.json(catalog()));
  app.get('/api/fa-trivia/run', rateLimit(30, 60000), (req, res) => {
    res.json({ questions: run({
      chapter: String(req.query.chapter || 'repro'),
      categories: String(req.query.categories || '').split(',').filter(Boolean),
      count: req.query.count,
      exclude: String(req.query.exclude || '').split(',').filter(Boolean).slice(0, 2000),
    }) });
  });
}

module.exports = { BANKS, CHAPTERS, catalog, run, mount };
