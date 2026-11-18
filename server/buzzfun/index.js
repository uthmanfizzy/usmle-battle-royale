'use strict';
/**
 * Buzz Fun's built-in card bank, in the shape the game server's question
 * bank uses. Played alongside any cards an admin tags `buzz_fun`.
 *
 * Ids are stable (BF-<SUBJECT>-<n>, n = row order) so a card keeps its
 * identity across restarts — add new rows at the END of a deck. The answer is
 * always stored as option A and shuffled when served (withShuffledOptions in
 * index.js), so the right letter moves every time.
 *
 * Explanations are a few high-yield points, one per line: a deck's row can
 * carry a list of points itself (endocrinology.js), and the older decks add
 * points to their one-line explanation through extra-<deck>.js.
 */
const SOURCES = {
  biochemistry: require('./biochemistry'),
  immunology: require('./immunology'),
  endocrinology: require('./endocrinology'),
};
const EXTRA = {
  biochemistry: require('./extra-biochemistry'),
  immunology: require('./extra-immunology'),
};
const PREFIX = { biochemistry: 'BIO', immunology: 'IMM', endocrinology: 'END' };
const NAMES = { biochemistry: 'Biochemistry', immunology: 'Immunology', endocrinology: 'Endocrinology' };
const TYPES = ['BUZZWORD', 'TRIAD', 'ASSOCIATION', 'SIDE_EFFECT', 'DEFICIENCY', 'MECHANISM'];

function build() {
  const cards = [];
  for (const [subject, rows] of Object.entries(SOURCES)) {
    rows.forEach(([type, topic, clue, answer, wrong, why], i) => {
      const id = `BF-${PREFIX[subject]}-${String(i + 1).padStart(3, '0')}`;
      const points = [
        ...(Array.isArray(why) ? why : [why]),
        ...((EXTRA[subject] && EXTRA[subject][id]) || []),
      ].map(p => String(p).trim()).filter(Boolean);
      cards.push({
        id,
        subject,
        difficulty: 'easy',
        question: clue,
        options: [answer, ...wrong],
        correct: 'A',
        // One point per line; the client lays each out as its own bullet.
        explanation: points.join('\n'),
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

// ── UWorld Buzz Fun ─────────────────────────────────────────────────────────
// A second bank, played instead of the one above when the host picks
// "UWorld" in the lobby (duelOptions.buzzBank). One card per UWorld Adventure
// question, so the id carries the source question: BFU-<question id>.
const UWORLD_SOURCES = {
  pulmonology: require("./uworld/pulmonology"),
  nephrology: require("./uworld/nephrology"),
  endocrinology: require("./uworld/endocrinology"),
  cardiology: require("./uworld/cardiology"),
};
const UWORLD_NAMES = { pulmonology: "Pulmonology", nephrology: "Nephrology", endocrinology: "Endocrinology", cardiology: "Cardiology" };

function buildUworld() {
  const cards = [];
  for (const [subject, rows] of Object.entries(UWORLD_SOURCES)) {
    for (const [sourceId, type, topic, clue, answer, wrong, why] of rows) {
      cards.push({
        id: `BFU-${sourceId}`,
        subject,
        difficulty: "easy",
        question: clue,
        options: [answer, ...wrong],
        correct: "A",
        explanation: (Array.isArray(why) ? why : [why]).map(p => String(p).trim()).filter(Boolean).join('\n'),
        game_modes: ["buzz_fun"],
        buzz_type: type,
        topic,
        builtin: true,
        bank: "uworld",
        source_question_id: sourceId,
      });
    }
  }
  return cards;
}

const BUZZ_UWORLD_BANK = buildUworld();
const BUZZ_BANKS = ["vanilla", "uworld"];

module.exports = {
  BUZZ_BANK,
  BUZZ_UWORLD_BANK,
  BUZZ_BANKS,
  BUZZ_UWORLD_SUBJECT_NAMES: UWORLD_NAMES,
  BUZZ_SUBJECTS: Object.keys(SOURCES),
  BUZZ_SUBJECT_NAMES: NAMES,
  BUZZ_TYPES: TYPES,
  BUZZ_EXTRA: EXTRA,
};
