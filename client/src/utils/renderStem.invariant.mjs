// HARD-GATE invariant test for the offset-aware stem renderer.
//
// THE INVARIANT: toStemVisibleText(stem) must equal the rendered .stem-text
// container's textContent. We can't run a browser in Node, so we esbuild-transform
// renderStem.jsx with a React SHIM whose createElement builds plain {t,p,c} nodes,
// render via the REAL renderStem, then extract textContent from the node tree and
// compare to toStemVisibleText. This genuinely exercises the render path (prose +
// lab boxes + tables, with and without highlight marks) against the claimed visible
// string — i.e. capture==apply for the stem.
//
// If any sample fails, the stem anchor is broken: STOP (do not ship B/C).

import { build } from 'esbuild';
import { pathToFileURL } from 'url';
import fs from 'fs';

const out = 'src/utils/_renderStem.compiled.mjs'; // in src/utils so ./explanationHighlights resolves
await build({
  entryPoints: ['src/utils/renderStem.jsx'],
  bundle: false,
  format: 'esm',
  jsx: 'transform',
  loader: { '.jsx': 'jsx' },
  outfile: out,
  banner: { js: "const React={createElement:(t,p,...c)=>({t,p,c}),Fragment:'F'};" },
});
let code = fs.readFileSync(out, 'utf8').replace(/^import React.*$/m, '');
// Node ESM needs an explicit extension on the relative import esbuild left in place.
code = code.replace(/from\s+['"]\.\/explanationHighlights['"]/g, "from './explanationHighlights.js'");
fs.writeFileSync(out, code);
const m = await import(pathToFileURL(out).href + '?v=' + Date.now());
const { renderStem, toStemVisibleText } = m;

// Extract textContent from the shim node tree (strings = text nodes; <br> etc. with
// no string children contribute nothing — exactly like the DOM).
function textOf(n) {
  if (n == null || n === false || n === true) return '';
  if (typeof n === 'string') return n;
  if (typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(textOf).join('');
  if (n && n.c) return n.c.map(textOf).join('');
  return '';
}

const SAMPLES = [
  // prose only
  'A 45-year-old man presents with acute chest pain radiating to the left arm.',
  // prose, multi-line (\n -> <br>, 0 chars)
  'First line of the vignette.\nSecond line continues here.\nWhat is the diagnosis?',
  // prose + lab box (newline-separated) + prose
  'A patient presents with fatigue:\nHemoglobin: 7.8\nPlatelets: 50\nWhat is the most likely diagnosis?',
  // prose + table + prose
  'Compare the agents:\n| Drug | Effect |\n| A | Increases cAMP |\n| B | Blocks Na channel |\nWhich drug is first-line?',
  // markdown table with separator row (dropped at render)
  '| Marker | Value |\n| --- | --- |\n| WBC | 12 |\n| CRP | high |',
  // fully mixed: prose + labs + table + prose
  'History below.\nSodium: 140\nPotassium: 5.1\n| Test | Result |\n| ECG | normal |\n| CXR | clear |\nWhat next?',
  // run-on inline labs (the trim-the-surrounding-space case)
  'Laboratory studies show Hemoglobin: 7.8 Reticulocyte: 8% and the patient is stable.',
  // lab box only
  'Glucose: 180\nHbA1c: 9.2',
  // prose with a non-lab mid-sentence colon
  'Note: the following findings were observed during the examination today.',
  // the user's table, multi-line
  '| Option | Type 1 | Type 2 | Basement membrane | Fibroblasts |\n| A | Decreased | Decreased | Intact | Increased |\n| B | Decreased | Increased | Abnormal | Increased |',
  // FLATTENED table (run-on recovery) — prompt + table on one line
  'Which option is correct? | Option | T1 | T2 | | A | Decreased | Intact | | B | Increased | Abnormal |',
];

let pass = 0, fail = 0;
const failures = [];
for (const s of SAMPLES) {
  const claimed = toStemVisibleText(s);
  const rendered = textOf(renderStem(s));                       // no highlights
  const renderedHL = textOf(renderStem(s, { highlights: [      // marks must NOT change text
    { start: 0, end: Math.min(4, claimed.length || 1), color: 'yellow', scope: 'official', created_at: '2026-01-01T00:00:00Z' },
  ] }));
  if (claimed === rendered && claimed === renderedHL) pass++;
  else { fail++; failures.push({ s, claimed, rendered, renderedHL }); }
}

console.log('STEM INVARIANT: toStemVisibleText === rendered textContent');
console.log(`  PASS: ${pass}/${SAMPLES.length}`);
try { fs.unlinkSync(out); } catch {}
if (fail) {
  console.log(`  FAIL: ${fail}`);
  for (const f of failures) {
    console.log('  ── mismatch ──');
    console.log('    sample  :', JSON.stringify(f.s));
    console.log('    claimed :', JSON.stringify(f.claimed));
    console.log('    rendered:', JSON.stringify(f.rendered));
    console.log('    +marks  :', JSON.stringify(f.renderedHL));
  }
  process.exit(1);
} else {
  console.log('  ✅ STEM INVARIANT HOLDS — stem capture==apply; marks do not alter visible text.');
  process.exit(0);
}
