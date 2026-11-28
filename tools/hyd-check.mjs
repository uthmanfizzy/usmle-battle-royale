// Sanity check for HY Diseases · Biochemistry (client/src/hyd).
//   node tools/hyd-check.mjs
// Every look-alike must be another case and every case must have exactly
// three; every motion, sign, face, age, skin and hair must exist in
// HydPatient.jsx; every exam inset kind must exist in ExamInset.jsx.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('client/src/hyd');
const load = async (f) => (await import(pathToFileURL(path.join(dir, 'bio', f)).href)).default;
const cases = [
  ...await load('molecularCellular.js'), ...await load('genetics.js'),
  ...await load('nutrition.js'), ...await load('metabolism.js'),
];

const patientSrc = fs.readFileSync(path.join(dir, 'HydPatient.jsx'), 'utf8');
const insetSrc = fs.readFileSync(path.join(dir, 'ExamInset.jsx'), 'utf8');
const list = (name) => {
  const m = patientSrc.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
};
const objKeys = (src, objName) => {
  const start = src.indexOf(`const ${objName} = {`);
  const body = src.slice(start, src.indexOf('\n};', start));
  return [...body.matchAll(/^\s{2}([a-zA-Z0-9]+):/gm)].map(m => m[1]);
};
const MOTIONS = list('HP_MOTIONS');
const SIGNS = list('HP_SIGNS');
const FACES = objKeys(patientSrc, 'FACES');
const AGES = objKeys(patientSrc, 'AGES');
// SKIN and HAIR are one- or two-line objects, so take every `key: '` in them.
const inlineKeys = (name) => {
  const start = patientSrc.indexOf(`const ${name} = {`);
  const body = patientSrc.slice(start, patientSrc.indexOf('};', start));
  return [...body.matchAll(/([a-zA-Z0-9]+):\s*'/g)].map(x => x[1]);
};
const SKINS = inlineKeys('SKIN');
const HAIRS = inlineKeys('HAIR');
const INSETS = objKeys(insetSrc, 'KINDS');
const CHAPTERS = ['molecular', 'cellular', 'genetics', 'nutrition', 'metabolism'];
const INHERIT = ['AR', 'AD', 'XR', 'XD', 'Trisomy', 'Deletion', 'Imprinting', 'Mitochondrial', 'Diet'];

const errs = [];
const ids = new Set(cases.map(c => c.id));
const seen = new Set();
for (const c of cases) {
  const at = (m) => errs.push(`${c.id}: ${m}`);
  if (seen.has(c.id)) at('duplicate id'); seen.add(c.id);
  if (!CHAPTERS.includes(c.chapter)) at(`bad chapter ${c.chapter}`);
  if (!INHERIT.includes(c.inherit)) at(`bad inherit ${c.inherit}`);
  for (const k of ['name', 'who', 'hint']) if (!c[k]) at(`missing ${k}`);
  const L = c.look || {};
  if (!AGES.includes(L.age)) at(`bad age ${L.age}`);
  if (L.skin && !SKINS.includes(L.skin)) at(`bad skin ${L.skin}`);
  if (L.hair && !HAIRS.includes(L.hair)) at(`bad hair ${L.hair}`);
  if (!MOTIONS.includes(L.motion)) at(`bad motion ${L.motion}`);
  if (L.face && !FACES.includes(L.face)) at(`bad face ${L.face}`);
  for (const s of L.signs || []) if (!SIGNS.includes(s)) at(`bad sign ${s}`);
  if (!Array.isArray(c.history) || c.history.length < 2) at('history needs 2+ lines');
  for (const h of c.history || []) if (!Array.isArray(h) || h.length !== 2 || !h[1]) at('bad history line');
  if (!Array.isArray(c.exam) || !c.exam.length) at('exam empty');
  for (const [txt, kind] of c.exam || []) {
    if (!txt) at('exam finding without text');
    if (kind && !INSETS.includes(kind)) at(`unknown inset ${kind}`);
  }
  const la = Object.keys(c.lookalikes || {});
  if (la.length !== 3) at(`needs exactly 3 lookalikes (has ${la.length})`);
  for (const o of la) {
    if (!ids.has(o)) at(`lookalike ${o} is not a case`);
    if (o === c.id) at('lookalike is itself');
    if (!c.lookalikes[o] || c.lookalikes[o].length < 20) at(`lookalike ${o} needs a why-not`);
  }
  const l = c.learn || {};
  for (const k of ['plain', 'tx', 'hook']) if (!l[k]) at(`learn.${k} missing`);
  if (!Array.isArray(l.chain) || l.chain.length < 2) at('learn.chain needs 2+ steps');
  if (!Array.isArray(l.key) || !l.key.length) at('learn.key empty');
  const all = JSON.stringify(c);
  if (/[‘’“”]/.test(all)) at('smart quotes present');
}

// Held-back tests (bioCases.js): each must match a real lab line exactly, and
// no case may be left with an empty exam once they are removed.
const casesSrc = fs.readFileSync(path.join(dir, 'bioCases.js'), 'utf8');
const setBody = (name) => {
  const start = casesSrc.indexOf(`const ${name} = new Set([`);
  return casesSrc.slice(start, casesSrc.indexOf(']);', start));
};
const heldLabs = [...setBody('CONFIRM_LABS').matchAll(/'([^']+)'/g)].map(m => m[1]);
const heldInsets = [...setBody('CONFIRM_INSETS').matchAll(/'([^']+)'/g)].map(m => m[1]);
const allLabs = new Set(cases.flatMap(c => c.labs || []));
for (const l of heldLabs) if (!allLabs.has(l)) errs.push(`held-back lab not found in any case: "${l}"`);
for (const k of heldInsets) if (!INSETS.includes(k)) errs.push(`held-back inset kind unknown: ${k}`);
for (const c of cases) if (!c.exam.some(([, k]) => !heldInsets.includes(k))) errs.push(`${c.id}: exam empty once confirmations are held back`);

// Qbank cards (hyd/qbank/bioQbank.js): one per case, condensed, and the
// stem must not give the answer away.
const qb = (await import(pathToFileURL(path.join(dir, 'qbank', 'bioQbank.js')).href)).default;
for (const id of Object.keys(qb)) if (!ids.has(id)) errs.push(`qbank: ${id} is not a case`);
for (const c of cases) {
  const at = (m) => errs.push(`qbank ${c.id}: ${m}`);
  const q = qb[c.id];
  if (!q) { at('missing'); continue; }
  if (!q.s || q.s.length > 420) at(`stem missing or too long (${q.s?.length})`);
  if ((q.s.match(/\*\*/g) || []).length % 2) at('unbalanced ** in stem');
  const bare = q.s.replace(/\*\*/g, '').toLowerCase();
  const head = c.name.toLowerCase().replace(/\s*\(.*\)$/, '');
  if (bare.includes(head)) at('stem names the disease');
  if (!Array.isArray(q.hy) || q.hy.length !== 3) at('needs exactly 3 hy points');
  for (const h of q.hy || []) if (h.length > 130) at(`hy point too long: ${h.slice(0, 40)}…`);
  if (!Array.isArray(q.vs) || q.vs.length !== 2) at('vs must be [id, text]');
  else if (!Object.keys(c.lookalikes).includes(q.vs[0])) at(`vs ${q.vs[0]} is not one of its lookalikes`);
  if (/[‘’“”]/.test(JSON.stringify(q))) at('smart quotes present');
}

const byChapter =Object.fromEntries(CHAPTERS.map(ch => [ch, cases.filter(c => c.chapter === ch).length]));
console.log(`${cases.length} cases`, byChapter);
console.log(`patient vocab: ${MOTIONS.length} motions, ${SIGNS.length} signs, ${FACES.length} faces; ${INSETS.length} inset kinds`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('OK');
