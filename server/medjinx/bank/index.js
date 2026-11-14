'use strict';

/**
 * The MedJinx question bank.
 *
 * One file per group of systems, each exporting an array of topics. A topic
 * is a condition (or drug) together with everything a student could
 * correctly associate with it, each answer hand-placed in a rarity tier,
 * plus the tempting wrong answers ("traps") and why they are wrong.
 *
 * Every topic doubles as an open round (the name is shown) and a clinical
 * round (a vignette is shown and the name has to be worked out).
 *
 * This directory is content only. Nothing in it knows about sockets or
 * scoring, so adding a topic is adding an object — then run
 *
 *     node server/medjinx/check.js
 *
 * which fails if two answers in a topic would match the same typed text, or
 * if a trap would swallow a correct answer.
 */
const TOPICS = [
  ...require('./endocrine'),
  ...require('./cardioResp'),
  ...require('./renalGiHeme'),
  ...require('./neuroMskGenPharm'),
];

const byId = new Map(TOPICS.map(t => [t.id, t]));

/** What the lobby may know about the bank: its shape, never its answers. */
function catalog() {
  const systems = new Map();
  const difficulties = { easy: 0, intermediate: 0, advanced: 0 };
  for (const t of TOPICS) {
    systems.set(t.system, (systems.get(t.system) || 0) + 1);
    difficulties[t.difficulty] = (difficulties[t.difficulty] || 0) + 1;
  }
  return {
    topics: TOPICS.length,
    systems: [...systems].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)),
    difficulties,
  };
}

module.exports = { TOPICS, byId, catalog };
