'use strict';
/**
 * Clue Ladder's bank: every case by system, and the list of diagnoses a
 * player can guess from.
 *
 * A diagnosis (answer) can have more than one case — a yolk sac tumor in a
 * girl and in a toddler boy are the same answer with different ladders. The
 * answer list for a system is EVERY diagnosis in it, not just the ones that
 * will come up, so the autocomplete never gives the case away.
 */
const SYSTEMS = [
  { id: 'repro', name: 'Reproductive', icon: '👶', rows: [...require('./repro1'), ...require('./repro2'), ...require('./repro3')] },
  { id: 'heme', name: 'Hematology', icon: '🩸', rows: [...require('./heme1'), ...require('./heme2'), ...require('./heme3')] },
];

// Diagnoses skipped by "HY only" (they stay guessable, they just never come up).
const LOW_YIELD = require('./lowyield');

const CLUE_COUNT = 6;

/** Lower-case, accents off, punctuation to spaces, Greek alpha spelled out. */
function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/α/g, 'alpha')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const slug = (s) => norm(s).replace(/ /g, '-');

const answers = new Map();   // key -> { key, name, system, aliases: Set }
const cases = [];            // { id, system, group, answer, clues }

for (const sys of SYSTEMS) {
  sys.rows.forEach(([name, aka, group, clues], i) => {
    const key = slug(name);
    let a = answers.get(key);
    if (!a) {
      a = { key, name, system: sys.id, aliases: new Set() };
      answers.set(key, a);
    }
    for (const x of [name, ...(aka || [])]) a.aliases.add(norm(x));
    cases.push({ id: `${sys.id}-${i + 1}`, system: sys.id, group, answer: key, hy: !LOW_YIELD.has(name), clues: clues.slice(0, CLUE_COUNT) });
  });
}

// Spoken text -> answer key. Built once; aliases never collide (check.js).
const lookup = new Map();
for (const a of answers.values()) for (const al of a.aliases) lookup.set(al, a.key);

// A looser key for typed guesses: British spellings folded, generic words
// (syndrome, disease, of, the…) and plural s dropped. Only used when the
// loose form points at exactly ONE diagnosis, so it can never pick between two.
const GENERIC = new Set(['syndrome', 'disease', 'disorder', 'of', 'the', 'a', 'an']);
function loose(s) {
  return norm(s)
    .replace(/our\b/g, 'or').replace(/ae/g, 'e').replace(/oe/g, 'e')
    .split(' ')
    .filter(w => w && !GENERIC.has(w))
    .map(w => (w.length > 3 ? w.replace(/s$/, '') : w))
    .join(' ');
}
const looseLookup = new Map();
for (const a of answers.values()) {
  for (const al of a.aliases) {
    const k = loose(al);
    if (!k) continue;
    if (looseLookup.has(k) && looseLookup.get(k) !== a.key) looseLookup.set(k, null);
    else looseLookup.set(k, a.key);
  }
}

/** The answer key a typed guess names, or null. */
function resolve(text) {
  const n = norm(text);
  if (!n) return null;
  if (lookup.has(n)) return lookup.get(n);
  return looseLookup.get(loose(n)) || null;
}

/** Every diagnosis a system offers, sorted, with its accepted aliases. */
function answerList(systemIds) {
  const want = new Set(systemIds && systemIds.length ? systemIds : SYSTEMS.map(s => s.id));
  return [...answers.values()]
    .filter(a => want.has(a.system))
    .map(a => ({ key: a.key, name: a.name, aliases: [...a.aliases].filter(x => x !== norm(a.name)) }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

module.exports = {
  SYSTEMS: SYSTEMS.map(({ rows, ...s }) => ({ ...s, cases: rows.length, hyCases: rows.filter(r => !LOW_YIELD.has(r[0])).length })),
  LOW_YIELD, CLUE_COUNT, cases, answers, norm, resolve, answerList,
};
