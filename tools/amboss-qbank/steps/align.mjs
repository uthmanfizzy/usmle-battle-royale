import fs from 'fs';
const { fonts, pages } = JSON.parse(fs.readFileSync('pass.json', 'utf8'));
const maps = JSON.parse(fs.readFileSync('maps.json', 'utf8'));
// Code 1 is the space glyph. Code 32 renders as a letter but pdfjs reads it as
// a space, so template matching skips it: it is whichever letter sits between
// codes 31 and 33 (subset codes run in Unicode order). The last code of a font
// that matched "k" a second time is kappa. SegoeUISymbol's only glyph is "~".
for (const [id, F] of Object.entries(fonts)) if (/SegoeUISymbol/.test(F.name || '')) maps[id] = { 1: '~' };
for (const id in maps) {
  const m = maps[id];
  if (/SegoeUISymbol/.test(fonts[id]?.name || '')) continue;
  m[1] = ' ';
  if (m[31] && m[33] && m[33].charCodeAt(0) - m[31].charCodeAt(0) === 2) m[32] = String.fromCharCode(m[31].charCodeAt(0) + 1);
  const ks = Object.keys(m).filter(k => m[k] === 'k').map(Number);
  if (ks.length > 1) m[Math.max(...ks)] = 'κ';
}
fs.writeFileSync('maps2.json', JSON.stringify(maps, null, 1));
let mism = 0, tot = 0; const samples = [];
for (const pg of pages) {
  let gi = 0; const G = pg.glyphs;
  for (const it of pg.items) {
    if (!maps[it.f]) { // unscrambled: advance glyphs loosely
      let out = ''; for (const ch of it.s) { out += ch; if (ch !== ' ' && G[gi] && G[gi].u === ch) gi++; else if (ch !== ' ') { let k = gi; while (k < G.length && k < gi + 40 && G[k].u !== ch) k++; if (k < G.length && G[k].u === ch) gi = k + 1; } }
      it.t = out; continue; }
    let out = '';
    const ctl = (g) => g && g.f === it.f && (g.u.length === 1 && (g.u.charCodeAt(0) < 32 || g.u === '�'));
    for (const ch of it.s) {
      tot++;
      let g = G[gi];
      if (ch === ' ' && g && g.f === it.f && g.u !== ' ' && g.u.length === 1 && g.u.charCodeAt(0) < 32 && g.c !== 1 && /\s/.test(g.u)) { out += maps[it.f][g.c]; gi++; continue; }
      while (ch !== '�' && ch !== ' ' && ctl(g) && g.u !== ch && g.c !== 1 && !/\s/.test(g.u)) { out += maps[it.f][g.c]; gi++; g = G[gi]; }
      if (g && g.f === it.f && (g.u === ch || (ch === '�'))) { out += maps[it.f][g.c] ?? '?'; gi++; continue; }
      if (ch === ' ') { out += ' '; continue; }
      // resync
      let k = gi; while (k < G.length && k < gi + 60 && !(G[k].f === it.f && G[k].u === ch)) k++;
      if (k < G.length && G[k].f === it.f && G[k].u === ch) {
        // A code-32 letter skipped over here (pdfjs dropped it as a space,
        // e.g. the "E" opening a paragraph) is still part of the text.
        for (let j = gi; j < k; j++) if (G[j].f === it.f && G[j].u === ' ' && G[j].c !== 1 && /^[A-Z]$/.test(maps[it.f][G[j].c] || '')) out += maps[it.f][G[j].c];
        gi = k; out += maps[it.f][G[gi].c] ?? '?'; gi++; mism++;
      }
      else { out += '¿'; mism++; if (samples.length < 15) samples.push([pg.n, it.s.slice(0, 40), ch.charCodeAt(0)]); }
    }
    while (G[gi] && G[gi].f === it.f && G[gi].c !== 1 && G[gi].u !== ' ' && G[gi].u.length === 1 && /\s/.test(G[gi].u)) { out += maps[it.f][G[gi].c]; gi++; }
    // A run that is only the code-32 letter (pdfjs reads it as a space) is the
    // first letter of the next word: keep it, and glue it to what follows.
    if (!it.s.trim() && /^[A-Z]$/.test(out.trim())) { out = out.trim(); it.glue = 1; }
    it.t = out;
  }
}
console.log('chars', tot, 'mismatch', mism); console.log(samples);
fs.writeFileSync('decoded.json', JSON.stringify(pages.map(p => ({ n: p.n, items: p.items, imgs: p.imgs }))));
for (const n of [2, 3, 4]) console.log(n, pages[n - 1].items.map(i => i.t).join(' | ').slice(0, 1500));
