'use strict';

/**
 * Shorthand for writing bank entries.
 *
 *   A(label, tier, category, synonyms, why)   an accepted answer
 *   T(terms, why)                             a known-wrong answer ("trap")
 *
 * Tier is 1 (everybody says it) to 5 (almost nobody does). Category is a key
 * of CATEGORIES in ../engine.js. Synonyms only need the genuinely different
 * wordings: the matcher already folds case, hyphens, plurals, British
 * spellings, raised/elevated/high, reduced/decreased/low and the various
 * ways of writing "anti-X antibodies", and it tolerates small typos.
 */
const A = (label, tier, category, syn, why) => ({ label, tier, category, syn: syn || [], why });
const T = (terms, why) => ({ terms, why });

module.exports = { A, T };
