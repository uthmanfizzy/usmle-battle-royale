import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
const { fonts } = JSON.parse(fs.readFileSync('pass.json', 'utf8'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/times.ttf', 'RefR');
GlobalFonts.registerFromPath('C:/Windows/Fonts/timesbd.ttf', 'RefB');
GlobalFonts.registerFromPath('C:/Windows/Fonts/seguisym.ttf', 'RefS');
const S = 64, W = 96, H = 96;
function bmp(family, ch) {
  const c = createCanvas(W, H); const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000';
  x.font = `${S}px "${family}"`; x.textBaseline = 'alphabetic'; x.fillText(ch, 16, 72);
  const d = x.getImageData(0, 0, W, H).data; const a = new Uint8Array(W * H);
  let ink = 0; for (let i = 0; i < W * H; i++) { a[i] = d[i * 4] < 128 ? 1 : 0; ink += a[i]; }
  return { a, ink };
}
function score(p, q) { let inter = 0, uni = 0; for (let i = 0; i < p.a.length; i++) { inter += p.a[i] & q.a[i]; uni += p.a[i] | q.a[i]; } return uni ? inter / uni : (p.ink === 0 && q.ink === 0 ? 1 : 0); }
const cands = [];
for (let c = 33; c < 127; c++) cands.push(String.fromCharCode(c));
cands.push(...'βαγδεθλμπσΔ↑↓→←↔°±≥≤–—‘’“”•×÷½¼²³⁺⁻₂₃·…≈≠µ'.split(''), '\u00ae', '\u2122', '\u00e9', '\u00e8', '\u00f6', '\u00fc', '\u00e4', '\u00b7');
const scrambled = Object.entries(fonts).filter(([k, v]) => /^[A-Z]{6}\+TimesNew/.test(v.name || ''));
const maps = {};
for (const [id, F] of scrambled) {
  const bold = /Bold/.test(F.name);
  GlobalFonts.registerFromPath(`fonts/${id}.otf`, 'F_' + id);
  const ref = cands.map(ch => ({ ch, b: bmp(bold ? 'RefB' : 'RefR', ch) }));
  const refS = cands.map(ch => ({ ch, b: bmp('RefS', ch) }));
  const m = {}; const report = [];
  for (const [code, g] of Object.entries(F.codes)) {
    if (+code === 32) { m[code] = ' '; continue; }
    const gb = bmp('F_' + id, g.fc);
    let best = [];
    for (const r of [...ref, ...refS]) best.push([score(gb, r.b), r.ch]);
    best.sort((a, b) => b[0] - a[0]);
    m[code] = best[0][1];
    report.push(`${code}:${best[0][1]}(${best[0][0].toFixed(2)}${best[0][0] - best[1][0] < 0.05 ? ' ~' + best[1][1] : ''})`);
  }
  maps[id] = m;
  console.log(id, F.name, '\n ', report.join(' '));
}
fs.writeFileSync('maps.json', JSON.stringify(maps, null, 1));
