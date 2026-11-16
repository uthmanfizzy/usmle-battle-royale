'use strict';
// node server/buzzfun/check.js — sanity checks for the built-in bank.
const { BUZZ_BANK, BUZZ_TYPES, BUZZ_EXTRA } = require('./index');
let bad = 0;
const seen = new Map();
for (const c of BUZZ_BANK) {
  const where = `${c.id} (${c.question.slice(0, 40)}…)`;
  if (!BUZZ_TYPES.includes(c.buzz_type)) { console.log('unknown type', where, c.buzz_type); bad++; }
  if (c.options.length !== 4) { console.log('needs 4 options', where); bad++; }
  const norm = c.options.map(o => String(o).trim().toLowerCase());
  if (new Set(norm).size !== norm.length) { console.log('duplicate option', where); bad++; }
  if (c.options.some(o => !o || o.length > 110)) { console.log('empty/overlong option', where); bad++; }
  if (!c.explanation || !c.topic) { console.log('missing why/topic', where); bad++; }
  // A few high-yield points each, one per line.
  const lines = c.explanation.split('\n');
  if (lines.length < 3) { console.log('fewer than 3 HY points', where, lines.length); bad++; }
  if (lines.some(l => l.length > 220)) { console.log('point too long', where); bad++; }
  const k = c.question.trim().toLowerCase();
  if (seen.has(k)) { console.log('duplicate clue', where, 'and', seen.get(k)); bad++; }
  seen.set(k, c.id);
}
// Every extra-*.js key must be a real card.
const ids = new Set(BUZZ_BANK.map(c => c.id));
for (const [deck, map] of Object.entries(BUZZ_EXTRA)) {
  for (const id of Object.keys(map)) if (!ids.has(id)) { console.log('extra for unknown card', deck, id); bad++; }
}
const by = {};
for (const c of BUZZ_BANK) by[c.subject] = (by[c.subject] || 0) + 1;
const topics = {};
for (const c of BUZZ_BANK) topics[c.subject + ' · ' + c.topic] = (topics[c.subject + ' · ' + c.topic] || 0) + 1;
console.log(by);
if (process.argv.includes('--topics')) console.log(Object.entries(topics).map(([t, n]) => `${t} ${n}`).join('\n'));
console.log(bad ? `${bad} problem(s)` : `${BUZZ_BANK.length} cards OK`);
process.exit(bad ? 1 : 0);
