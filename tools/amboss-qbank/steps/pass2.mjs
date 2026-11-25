import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
const doc = await pdfjs.getDocument({ url: process.argv[2], disableFontFace: true }).promise;
const O = pdfjs.OPS; const out = [];
const mul = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
const seenObj = new Map();
for (let n = 1; n <= doc.numPages; n++) {
  const p = await doc.getPage(n);
  const ol = await p.getOperatorList();
  let ctm = [1,0,0,1,0,0]; const stack = []; let fill = '#000000'; const fstack = [];
  const imgs = [], rects = []; let lastPath = null;
  for (let i = 0; i < ol.fnArray.length; i++) {
    const fn = ol.fnArray[i], a = ol.argsArray[i];
    if (fn === O.save) { stack.push(ctm); fstack.push(fill); }
    else if (fn === O.restore) { ctm = stack.pop() || ctm; fill = fstack.pop() || fill; }
    else if (fn === O.transform) ctm = mul(ctm, a);
    else if (fn === O.setFillRGBColor) fill = typeof a[0] === 'string' ? a[0] : '#' + a.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
    else if (fn === O.setFillGray) fill = a[0];
    else if (fn === O.constructPath) { lastPath = a[2] ? [...a[2]] : null; }
    else if ((fn === O.fill || fn === O.eoFill) && lastPath) {
      const [x0, y0, x1, y1] = lastPath; const pts = [[x0,y0],[x1,y1]].map(([x,y]) => [ctm[0]*x+ctm[2]*y+ctm[4], ctm[1]*x+ctm[3]*y+ctm[5]]);
      const r = { fill, x0: Math.min(pts[0][0], pts[1][0]), x1: Math.max(pts[0][0], pts[1][0]), y0: Math.min(pts[0][1], pts[1][1]), y1: Math.max(pts[0][1], pts[1][1]) };
      if (r.x1 - r.x0 > 100 && r.y1 - r.y0 > 15) rects.push(r);
    }
    else if (fn === O.paintImageXObject) {
      const id = a[0];
      const pts = [[0,0],[1,1]].map(([x,y]) => [ctm[0]*x+ctm[2]*y+ctm[4], ctm[1]*x+ctm[3]*y+ctm[5]]);
      const box = { x0: Math.min(pts[0][0], pts[1][0]), x1: Math.max(pts[0][0], pts[1][0]), y0: Math.min(pts[0][1], pts[1][1]), y1: Math.max(pts[0][1], pts[1][1]) };
      let file = null;
      try {
        const im = await new Promise((res) => p.objs.get(id, res));
        if (im && im.data && im.width >= 60 && im.height >= 60) {
          const { width: w, height: h, kind, data } = im; const rgba = new Uint8ClampedArray(w * h * 4);
          if (kind === 3) rgba.set(data); else if (kind === 2) { for (let j = 0, k = 0; j < w*h; j++) { rgba[k++] = data[j*3]; rgba[k++] = data[j*3+1]; rgba[k++] = data[j*3+2]; rgba[k++] = 255; } }
          else if (kind === 1) { const rb = (w + 7) >> 3; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = (data[y*rb + (x>>3)] >> (7 - (x & 7))) & 1 ? 255 : 0; const k = (y*w+x)*4; rgba[k]=rgba[k+1]=rgba[k+2]=v; rgba[k+3]=255; } }
          const c = createCanvas(w, h); const ctx = c.getContext('2d'); const id2 = ctx.createImageData(w, h); id2.data.set(rgba); ctx.putImageData(id2, 0, 0);
          let outC = c; const MAX = 1400; if (w > MAX) { const s = MAX / w; outC = createCanvas(MAX, Math.round(h * s)); outC.getContext('2d').drawImage(c, 0, 0, outC.width, outC.height); }
          const buf = outC.toBuffer('image/jpeg', 86);
          file = `p${String(n).padStart(3,'0')}_${imgs.length}.jpg`; fs.writeFileSync('imgs/' + file, buf);
          box.w = w; box.h = h;
        }
      } catch (e) { box.err = e.message; }
      imgs.push({ ...box, file });
    }
  }
  out.push({ n, imgs, rects });
  if (n % 100 === 0) console.error('page', n);
}
fs.writeFileSync('layout.json', JSON.stringify(out));
const fills = {}; out.forEach(p => p.rects.forEach(r => fills[r.fill] = (fills[r.fill] || 0) + 1)); console.log(fills);
console.log('images', out.reduce((s, p) => s + p.imgs.filter(i => i.file).length, 0), 'small/none', out.reduce((s, p) => s + p.imgs.filter(i => !i.file).length, 0));
