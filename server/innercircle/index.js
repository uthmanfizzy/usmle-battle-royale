'use strict';

/**
 * Inner Circle — the Step 2 CK campaign in Story Mode. Its Qbank is a bank
 * of original vignettes per system, written from the Inner Circle Step 2 CK
 * notes; every row names its topic so a student can study any mix of topics
 * (or all of them). The banks are CODE, so a change ships with a commit; run
 * `node server/innercircle/check.js` after editing.
 *
 * Row shape (see endo/*.js): [topic, notesPage, stem, [correct, wrong x4], explanation, takeHome]
 * The explanation is plain full sentences; ==phrase== marks the line to remember.
 */

const crypto = require('crypto');

// Systems, each split into the notes' own sections (in book order).
const SYSTEMS = [
  {
    id: 'endo', name: 'Endocrinology', icon: '🦋', pages: [276, 319],
    sections: [
      ['Pituitary', './endo/pituitary'],
      ['Thyroid', './endo/thyroid'],
      ['Parathyroid', './endo/parathyroid'],
      ['Adrenal', './endo/adrenal'],
      ['Pancreas & Diabetes', './endo/pancreas'],
      ['Endocrine Tumors', './endo/tumors'],
      ['Endocrine Drugs', './endo/drugs'],
      ['Miscellaneous', './endo/misc'],
      ['Pediatric Endocrine', './endo/peds'],
    ],
  },
];

const ID_RE = /^ic_[a-z0-9]+-[0-9a-f]{10}$/;

function build(sys) {
  const out = [];
  for (const [section, file] of sys.sections) {
    for (const [topic, page, stem, options, explanation, takeHome] of require(file)) {
      out.push({
        // Stable id from the stem, so a question keeps its ratings when rows move.
        id: `ic_${sys.id}-${crypto.createHash('sha1').update(stem).digest('hex').slice(0, 10)}`,
        system: sys.id, section, topic, page, stem, answer: options[0], options, explanation, takeHome,
      });
    }
  }
  return out;
}

const BANKS = Object.fromEntries(SYSTEMS.map(s => [s.id, build(s)]));
const COUNTS = [10, 20, 40, 0];   // 0 = all

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function catalog() {
  return {
    systems: SYSTEMS.map(s => {
      const bank = BANKS[s.id];
      return {
        id: s.id, name: s.name, icon: s.icon, pages: s.pages, count: bank.length,
        // Every question id, so the page can count "unrated" and filter by
        // rating without a second request.
        ids: bank.map(q => q.id),
        sections: s.sections.map(([name]) => {
          const qs = bank.filter(q => q.section === name);
          const topics = [];
          for (const q of qs) {
            let t = topics.find(x => x.id === q.topic);
            if (!t) topics.push(t = { id: q.topic, count: 0, ids: [] });
            t.count += 1; t.ids.push(q.id);
          }
          return { id: name, count: qs.length, topics };
        }),
      };
    }),
    counts: COUNTS,
  };
}

/**
 * A block: shuffled questions with shuffled options and the correct index
 * (marked in the browser). `topics` empty = the whole system. `ids` narrows
 * to rated questions; with `unrated`, questions not in `rated` are kept too.
 */
function run({ system, topics, count, ids, unrated, rated }) {
  const bank = BANKS[system] || [];
  const want = new Set((topics || []).map(String));
  const only = (ids && ids.length) || unrated ? new Set(ids || []) : null;
  const ratedSet = new Set(rated || []);
  const pool = bank.filter(q => (!want.size || want.has(q.topic))
    && (!only || only.has(q.id) || (unrated && !ratedSet.has(q.id))));
  const n = COUNTS.includes(Number(count)) ? Number(count) : 20;
  const picked = shuffle(pool);
  return (n ? picked.slice(0, n) : picked).map(q => {
    const options = shuffle(q.options);
    return {
      id: q.id, section: q.section, topic: q.topic, page: q.page, stem: q.stem,
      options, correct: options.indexOf(q.answer), explanation: q.explanation, takeHome: q.takeHome,
    };
  });
}

function mount(app, { rateLimit }) {
  app.get('/api/inner-circle/catalog', rateLimit(60, 60000), (req, res) => res.json(catalog()));
  const idList = (v) => (Array.isArray(v) ? v : []).map(String).filter(x => ID_RE.test(x)).slice(0, 5000);
  app.post('/api/inner-circle/run', rateLimit(30, 60000), (req, res) => {
    const b = req.body || {};
    res.json({ questions: run({
      system: String(b.system || 'endo'),
      topics: (Array.isArray(b.topics) ? b.topics : []).map(String).slice(0, 500),
      count: b.count,
      ids: idList(b.ids),
      unrated: b.unrated === true,
      rated: idList(b.rated),
    }) });
  });
}

module.exports = { SYSTEMS, BANKS, catalog, run, mount };
