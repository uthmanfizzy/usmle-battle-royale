'use strict';
/**
 * `node server/clueladder/check.js` — run after editing the bank.
 * Fails (exit 1) when:
 *   - a case does not have exactly 6 clues, or a clue is empty;
 *   - an alias belongs to two different diagnoses;
 *   - a clue names its own diagnosis or one of its aliases (a giveaway);
 *   - a diagnosis name does not resolve to itself.
 */
const bank = require('./bank');

const problems = [];
const owner = new Map();
for (const a of bank.answers.values()) {
  for (const al of a.aliases) {
    if (owner.has(al) && owner.get(al) !== a.key) problems.push(`alias "${al}" is used by ${owner.get(al)} and ${a.key}`);
    owner.set(al, a.key);
  }
  if (bank.resolve(a.name) !== a.key) problems.push(`"${a.name}" does not resolve to itself`);
}

const wordsIn = (s) => ` ${bank.norm(s)} `;
for (const c of bank.cases) {
  if (c.clues.length !== bank.CLUE_COUNT) problems.push(`${c.id} (${c.answer}) has ${c.clues.length} clues`);
  const a = bank.answers.get(c.answer);
  c.clues.forEach((clue, i) => {
    if (!String(clue).trim()) problems.push(`${c.id} clue ${i + 1} is empty`);
    const text = wordsIn(clue);
    for (const al of a.aliases) {
      // Short abbreviations (BPH, CIN) are checked as whole words too.
      if (al.length >= 3 && text.includes(` ${al} `)) problems.push(`${c.id} (${a.name}) clue ${i + 1} names "${al}"`);
    }
  });
}

const names = new Set([...bank.answers.values()].map(a => a.name));
for (const n of bank.LOW_YIELD) if (!names.has(n)) problems.push(`lowyield.js names "${n}", which is not in the bank`);

const per = {};
for (const c of bank.cases) per[c.group] = (per[c.group] || 0) + 1;
console.log(`${bank.cases.length} cases (${bank.cases.filter(c => c.hy).length} HY), ${bank.answers.size} diagnoses`);
for (const s of bank.SYSTEMS) console.log(`  ${s.name}: ${s.cases} cases, ${s.hyCases} HY`);
console.log(Object.entries(per).map(([g, n]) => `${g} ${n}`).join(' · '));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
