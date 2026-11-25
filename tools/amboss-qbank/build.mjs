#!/usr/bin/env node
/**
 * Amboss Quest → Qbank: builds an import pack from an AMBOSS block-export PDF.
 *
 *   cd tools/amboss-qbank && npm install          # once
 *   node tools/amboss-qbank/build.mjs "<pdf>" --system pulmonology --name "Respiratory system" --code RESP
 *   add --block-offset N when a second PDF shares a system (male repro after
 *   female: --block-offset 3 numbers its blocks 4, 5, ...)
 *
 * Writes out/amboss-qbank-<code>.json. Import it in Admin → Amboss Qbank
 * (📦 Import pack), which uploads every figure and saves the questions to the
 * amboss_qbank table (amboss-qbank-migration.sql). work/ and out/ hold the
 * questions themselves and are gitignored: this repository is public.
 *
 * Why it takes six steps: these exports draw their body text in subset fonts
 * whose character codes are glyph indices, so copying the text gives
 * gibberish ("M95FC@8" for "year-old"). The steps:
 *   pass    every page's glyph codes, text runs and embedded font files
 *   match   draw each glyph of each subset font and match it against Times
 *           New Roman (C:/Windows/Fonts) to recover what character it is
 *   align   decode the text runs with those maps
 *   pass2   pull the figures (JPEG) with their positions, and the grey box
 *           that marks the correct answer
 *   parse   cut the page stream into questions: stem, answer table, hint,
 *           and per choice its explanation and figures
 *   export  the pack: figures inline as data URLs, ids AQB-<CODE>-B<n>-Q<nn>
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const pdf = args[0] && path.resolve(args[0]);
const system = opt('system');
const name = opt('name');
const code = (opt('code') || '').toUpperCase();
const blockOffset = String(Math.max(0, parseInt(opt('block-offset', '0'), 10) || 0));
if (!pdf || !fs.existsSync(pdf) || !system || !name || !/^[A-Z0-9]+$/.test(code)) {
  console.error('usage: node build.mjs "<pdf>" --system <subject id> --name "<AMBOSS section>" --code <SHORT>');
  process.exit(1);
}
const work = path.join(HERE, 'work', code);
fs.mkdirSync(path.join(work, 'imgs'), { recursive: true });
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
const out = path.join(HERE, 'out', `amboss-qbank-${code.toLowerCase()}.json`);

const steps = [
  ['pass', [pdf]], ['match', []], ['align', []], ['pass2', [pdf]], ['parse', []],
  ['export', [out, system, name, code, blockOffset]],
];
for (const [step, extra] of steps) {
  console.log(`\n── ${step}`);
  const r = spawnSync(process.execPath, [path.join(HERE, 'steps', `${step}.mjs`), ...extra], { cwd: work, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', maxBuffer: 1 << 26 });
  // match prints every glyph it matched; only its summary matters here.
  const text = (r.stdout || '').split('\n').filter(l => step !== 'match' || !/^\s+\d+:/.test(l)).join('\n');
  process.stdout.write(text);
  if (r.status !== 0) { console.error(`\n${step} failed`); process.exit(r.status || 1); }
}
console.log(`\nPack: ${out}`);
