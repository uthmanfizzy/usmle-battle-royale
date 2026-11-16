'use strict';
/**
 * Buzz Fun's built-in card bank, in the shape the game server's question
 * bank uses. Played alongside any cards an admin tags `buzz_fun`.
 *
 * Ids are stable (BF-<SUBJECT>-<n>) so a card keeps its identity across
 * restarts; the answer is always stored as option A and shuffled when served
 * (withShuffledOptions in index.js), so the right letter moves every time.
 */
const SOURCES = {
  biochemistry: require('./biochemistry'),
  immunology: require('./immunology'),
};
const PREFIX = { biochemistry: 'BIO', immunology: 'IMM' };
const TYPES = ['BUZZWORD', 'TRIAD', 'ASSOCIATION', 'SIDE_EFFECT', 'DEFICIENCY', 'MECHANISM'];

function build() {
  const cards = [];
  for (const [subject, rows] of Object.entries(SOURCES)) {
    rows.forEach(([type, topic, clue, answer, wrong, why], i) => {
      cards.push({
        id: `BF-${PREFIX[subject]}-${String(i + 1).padStart(3, '0')}`,
        subject,
        difficulty: 'easy',
        question: clue,
        options: [answer, ...wrong],
        correct: 'A',
        explanation: why,
        game_modes: ['buzz_fun'],
        buzz_type: type,
        topic,
        builtin: true,
      });
    });
  }
  return cards;
}

const BUZZ_BANK = build();
module.exports = { BUZZ_BANK, BUZZ_SUBJECTS: Object.keys(SOURCES), BUZZ_TYPES: TYPES };
