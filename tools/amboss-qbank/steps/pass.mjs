// One sequential pass: glyph runs (with font + original code + position) per page, font files, image list.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const doc = await pdfjs.getDocument({ url: process.argv[2], fontExtraProperties: true, disableFontFace: true }).promise;
fs.mkdirSync('fonts', { recursive: true });
const fonts = {}; const pages = [];
for (let n = 1; n <= doc.numPages; n++) {
  const p = await doc.getPage(n);
  const ol = await p.getOperatorList();
  const tc = await p.getTextContent();
  // glyph sequence per showText
  const glyphs = []; let cur = null; const imgs = [];
  for (let i = 0; i < ol.fnArray.length; i++) {
    const fn = ol.fnArray[i];
    if (fn === pdfjs.OPS.setFont) cur = ol.argsArray[i][0];
    else if (fn === pdfjs.OPS.showText) {
      for (const g of ol.argsArray[i][0]) {
        if (!g || typeof g !== 'object') continue;
        glyphs.push({ f: cur, c: g.originalCharCode, u: g.unicode });
        const F = fonts[cur] ||= { codes: {}, pages: [] };
        if (!F.codes[g.originalCharCode]) F.codes[g.originalCharCode] = { fc: g.fontChar, u: g.unicode, n: 0 };
        F.codes[g.originalCharCode].n++;
        if (F.pages[F.pages.length - 1] !== n) F.pages.push(n);
      }
    } else if (fn === pdfjs.OPS.paintImageXObject) imgs.push(ol.argsArray[i][0]);
  }
  for (const id of Object.keys(fonts)) {
    if (fonts[id].saved) continue;
    try { const fo = p.commonObjs.get(id); if (fo) { fonts[id].name = fo.name; if (fo.data) fs.writeFileSync(`fonts/${id}.otf`, Buffer.from(fo.data)); fonts[id].saved = true; } } catch (e) {}
  }
  const items = tc.items.filter(i => i.str !== undefined).map(i => ({ f: i.fontName, s: i.str, x: +i.transform[4].toFixed(1), y: +i.transform[5].toFixed(1), w: +i.width.toFixed(1), h: +Math.abs(i.transform[3]).toFixed(1), e: i.hasEOL ? 1 : 0 }));
  pages.push({ n, glyphs, items, imgs });
  if (n % 100 === 0) console.error('page', n);
}
fs.writeFileSync('pass.json', JSON.stringify({ fonts, pages }));
for (const [k, v] of Object.entries(fonts)) console.log(k, v.name, v.pages[0] + '-' + v.pages[v.pages.length - 1], Object.keys(v.codes).length);
