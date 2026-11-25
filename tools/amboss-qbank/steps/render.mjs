import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
const doc = await pdfjs.getDocument({ url: process.argv[2] }).promise;
const scale = +process.argv[3];
for (const n of process.argv.slice(4).map(Number)) {
  const p = await doc.getPage(n); const vp = p.getViewport({ scale });
  const c = createCanvas(vp.width, vp.height);
  await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  fs.writeFileSync(`p${n}.png`, c.toBuffer('image/png'));
}
