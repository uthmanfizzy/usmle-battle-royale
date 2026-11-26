// Extract images per question from an "images by question" PDF.
// usage: node steps/qimages.mjs <pdf> <outdir>
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
const [pdf, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir + '/imgs', { recursive: true });
const doc = await pdfjs.getDocument({ url: pdf, disableFontFace: true }).promise;
const O = pdfjs.OPS;
const mul = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
const events = [];
for (let n = 1; n <= doc.numPages; n++) {
  const p = await doc.getPage(n);
  const tc = await p.getTextContent();
  // group text into lines by y
  const lines = new Map();
  for (const it of tc.items) { if (!it.str) continue; const y = Math.round(it.transform[5]); const k = [...lines.keys()].find(v => Math.abs(v - y) < 3) ?? y; lines.set(k, (lines.get(k) || []).concat([[it.transform[4], it.str]])); }
  for (const [y, parts] of lines) events.push({ page: n, y, type: 'text', text: parts.sort((a,b)=>a[0]-b[0]).map(p=>p[1]).join('').trim() });
  const ol = await p.getOperatorList();
  let ctm = [1,0,0,1,0,0]; const stack = []; let idx = 0;
  for (let i = 0; i < ol.fnArray.length; i++) {
    const fn = ol.fnArray[i], a = ol.argsArray[i];
    if (fn === O.save) stack.push(ctm);
    else if (fn === O.restore) ctm = stack.pop() || ctm;
    else if (fn === O.transform) ctm = mul(ctm, a);
    else if (fn === O.paintImageXObject) {
      const top = Math.max(ctm[5], ctm[5] + ctm[3]), bot = Math.min(ctm[5], ctm[5] + ctm[3]);
      const store = String(a[0]).startsWith("g_") ? p.commonObjs : p.objs; const im = await new Promise((res) => { const t = setTimeout(() => { console.error("timeout", n, a[0]); res(null); }, 20000); store.get(a[0], (v) => { clearTimeout(t); res(v); }); });
      if (!im || !im.width || im.width < 40 || im.height < 40) continue;
      const { width: w, height: h, kind, data } = im;
      let c;
      if (im.bitmap) { c = createCanvas(w, h); c.getContext('2d').drawImage(im.bitmap, 0, 0); }
      else {
        const rgba = new Uint8ClampedArray(w * h * 4);
        if (kind === 3) rgba.set(data); else if (kind === 2) { for (let j = 0, k = 0; j < w*h; j++) { rgba[k++] = data[j*3]; rgba[k++] = data[j*3+1]; rgba[k++] = data[j*3+2]; rgba[k++] = 255; } }
        else { const rb = (w + 7) >> 3; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = (data[y*rb + (x>>3)] >> (7 - (x & 7))) & 1 ? 255 : 0; const k = (y*w+x)*4; rgba[k]=rgba[k+1]=rgba[k+2]=v; rgba[k+3]=255; } }
        c = createCanvas(w, h); const ctx = c.getContext('2d'); const d2 = ctx.createImageData(w, h); d2.data.set(rgba); ctx.putImageData(d2, 0, 0);
      }
      let outC = c; const MAX = 1400; if (w > MAX) { const s = MAX / w; outC = createCanvas(MAX, Math.round(h * s)); outC.getContext('2d').drawImage(c, 0, 0, outC.width, outC.height); }
      const file = `p${String(n).padStart(3,'0')}_${idx++}.jpg`;
      fs.writeFileSync(`${outDir}/imgs/${file}`, outC.toBuffer('image/jpeg', 86));
      events.push({ page: n, y: top, bot, type: 'img', file, w, h });
    }
  }
}
events.sort((a, b) => a.page - b.page || b.y - a.y);
fs.writeFileSync(outDir + '/events.json', JSON.stringify(events, null, 1));
console.log('pages', doc.numPages, 'imgs', events.filter(e => e.type === 'img').length);
