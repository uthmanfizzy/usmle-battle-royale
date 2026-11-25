// Checks client/src/onco/oncoData.js (Onco Atlas). Run: node tools/onco-check.mjs
import { TUMORS, ORGANS, KINDS, CLUE_TYPES } from '../client/src/onco/oncoData.js';

const problems = [];
const ids = new Set();
const organs = new Set(ORGANS.map(o => o.id));
const clueText = new Map();
for (const t of TUMORS) {
  if (ids.has(t.id)) problems.push(`duplicate id ${t.id}`);
  ids.add(t.id);
  if (!organs.has(t.organ)) problems.push(`${t.id}: unknown organ ${t.organ}`);
  if (!KINDS[t.kind]) problems.push(`${t.id}: unknown kind ${t.kind}`);
  for (const f of ['name', 'who', 'presents', 'micro', 'assoc', 'hook']) if (!t[f]) problems.push(`${t.id}: missing ${f}`);
  if (!t.clues?.length) problems.push(`${t.id}: no clues`);
  for (const c of t.clues || []) {
    if (!CLUE_TYPES[c.t]) problems.push(`${t.id}: bad clue type ${c.t}`);
    const k = c.x.toLowerCase();
    if (clueText.has(k)) problems.push(`clue used twice: "${c.x}" (${clueText.get(k)}, ${t.id})`);
    clueText.set(k, t.id);
  }
  if (!t.case?.who || !t.case?.sees) problems.push(`${t.id}: incomplete case`);
  // A case must not give its own answer away.
  const words = t.name.toLowerCase().replace(/\(.*?\)/g, '').split(/[\s/-]+/).filter(w => w.length > 5 && !['carcinoma', 'cancer', 'tumor', 'disease', 'squamous', 'invasive', 'ductal', 'breast', 'vaginal', 'vagina', 'endometrial', 'cystic', 'ovarian', 'testicular', 'penile', 'prostatic', 'cervical'].includes(w));
  const text = `${t.case?.sees || ''} ${(t.case?.more || []).join(' ')}`.toLowerCase();
  for (const w of words) if (text.includes(w)) problems.push(`${t.id}: case mentions "${w}"`);
}
for (const o of ORGANS) {
  const n = TUMORS.filter(t => t.organ === o.id).length;
  if (n < 1) problems.push(`organ ${o.id} has no tumours`);
}
// Families: members must share a defining feature, so check each family has 2+.
const fams = {};
for (const t of TUMORS) if (t.fam) (fams[t.fam] ||= []).push(t.id);
for (const [f, m] of Object.entries(fams)) if (m.length < 2) problems.push(`family ${f} has one member (${m})`);

console.log(`${TUMORS.length} tumours, ${ORGANS.length} organs, ${clueText.size} clues, families: ${Object.entries(fams).map(([f, m]) => `${f}(${m.length})`).join(' ')}`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('OK');
