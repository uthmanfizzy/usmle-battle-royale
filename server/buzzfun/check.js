'use strict';
// node server/buzzfun/check.js — sanity checks for the built-in bank.
const { BUZZ_BANK, BUZZ_TYPES } = require('./index');
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
  const k = c.question.trim().toLowerCase();
  if (seen.has(k)) { console.log('duplicate clue', where, 'and', seen.get(k)); bad++; }
  seen.set(k, c.id);
}
const by = {};
for (const c of BUZZ_BANK) by[c.subject] = (by[c.subject] || 0) + 1;
const topics = {};
for (const c of BUZZ_BANK) topics[c.subject + ' · ' + c.topic] = (topics[c.subject + ' · ' + c.topic] || 0) + 1;
console.log(by);
console.log(Object.entries(topics).map(([t, n]) => `${t} ${n}`).join('\n'));
console.log(bad ? `${bad} problem(s)` : `${BUZZ_BANK.length} cards OK`);
process.exit(bad ? 1 : 0);
