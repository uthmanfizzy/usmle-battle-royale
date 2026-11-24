// Sanity check for the Kaplan 100 HY Ethics bank (client/src/kaplanEthics).
//   node tools/kaplan-ethics-check.mjs
// Fails on structural problems; reports how often the correct motion is the
// longest one so the answer never stands out by length.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const dir = path.resolve('client/src/kaplanEthics');
const load = async (f) => (await import(pathToFileURL(path.join(dir, f)).href)).default;
const cases = [...await load('cases1.js'), ...await load('cases2.js')];
const DOCKETS = ['capacity','consent','surrogates','minors','confidentiality','records','reporting','hiv','reproduction','endoflife','professionalism','research'];
const errs = [];
const ids = new Set(); const refs = new Map();
let longest = 0, shortest = 0;
for (const c of cases) {
  if (ids.has(c.id)) errs.push(`duplicate id ${c.id}`); ids.add(c.id);
  if (!DOCKETS.includes(c.docket)) errs.push(`${c.id}: unknown docket ${c.docket}`);
  for (const k of ['title','file','ask','rule','pearl']) if (!c[k] || typeof c[k] !== 'string') errs.push(`${c.id}: missing ${k}`);
  if (!Array.isArray(c.opts) || c.opts.length !== 4) errs.push(`${c.id}: needs exactly 4 opts`);
  else {
    if (c.opts[0].why) errs.push(`${c.id}: correct option must not carry why`);
    c.opts.slice(1).forEach((o, i) => { if (!o.why) errs.push(`${c.id}: wrong option ${i + 2} lacks why`); });
    const texts = c.opts.map(o => o.t.trim().toLowerCase());
    if (new Set(texts).size !== 4) errs.push(`${c.id}: duplicate option text`);
    const lens = c.opts.map(o => o.t.length);
    if (lens[0] > Math.max(...lens.slice(1))) longest++;
    if (lens[0] < Math.min(...lens.slice(1))) shortest++;
  }
  if (refs.has(c.ref)) errs.push(`${c.id}: ref ${c.ref} also used by ${refs.get(c.ref)}`); refs.set(c.ref, c.id);
}
const missing = []; for (let r = 1; r <= 102; r++) if (!refs.has(r)) missing.push(r);
if (missing.length) errs.push(`book questions not covered: ${missing.join(', ')}`);
const per = Object.fromEntries(DOCKETS.map(d => [d, cases.filter(c => c.docket === d).length]));
console.log(`${cases.length} cases`, per);
console.log(`correct option strictly shortest in ${shortest}/${cases.length} (${Math.round(shortest / cases.length * 100)}%)`);
console.log(`correct option strictly longest in ${longest}/${cases.length} (${Math.round(longest / cases.length * 100)}%; chance = 25%)`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('OK');
