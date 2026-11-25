// questions.json + imgs/ → amboss-qbank pack (one JSON with the figures inline).
import fs from 'fs';
import path from 'path';
const [,, outFile, system = 'respiratory', systemName = 'Respiratory system', code = 'RESP'] = process.argv;
const Q = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
const clean = (s) => {
  if (!s) return '';
  let t = s
    .replace(/\bG iemsa/g, 'Giemsa')
    .replace(/\bP([Aa]) ([OC])/g, 'P$1$2') // alveolar PAO₂ / PACO₂ (subscript A)
    .replace(/\)\.([A-Z][a-z])/g, '). $1')
    .replace(/([a-z]{2}|\d|\))\.([A-Z][a-z])/g, '$1. $2')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.;:])(?=\s|$)/g, '$1')
    // "Na⁺ /K⁺ -ATPase", "(HCO₃⁻ )": no gap after a raised or lowered character.
    .replace(/([⁺⁻⁰¹²³⁴-⁹₀-₉]) (?=[\/\-–)\]])/g, '$1');
  // Pipe rows: one per line so the renderer sees a table, and the header padded
  // to the body's width ("pH | pCO2 | HCO3" over "A | 7.29 | 71 | 33").
  const paras = t.split(/\n{2,}/);
  const out = []; let run = [];
  const flush = () => {
    if (!run.length) return;
    if (run.length >= 2) {
      const w = Math.max(...run.map(r => r.split(' | ').length));
      const h = run[0].split(' | ');
      if (h.length < w) run[0] = [...Array(w - h.length).fill('Option'), ...h].join(' | ');
      out.push(run.join('\n'));
    } else out.push(run[0]);
    run = [];
  };
  for (const p of paras) { if (p.includes(' | ') && !p.includes('\n')) run.push(p.trim()); else { flush(); out.push(p.trim()); } }
  flush();
  return out.filter(Boolean).join('\n\n').trim();
};
const images = {};
const img = (file) => {
  const key = file.replace(/\.jpg$/, '');
  if (!images[key]) images[key] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join('imgs', file)).toString('base64');
  return key;
};
const questions = Q.map(q => {
  const correct = q.opts.find(o => o.correct).L;
  return {
    id: `AQB-${code}-B${q.block}-Q${String(q.n).padStart(2, '0')}`,
    system, block: q.block, num: q.n,
    stem: clean(q.stem),
    stem_images: q.stemImgs.map(img),
    hint: clean(q.hint) || null,
    correct,
    choices: q.opts.map(o => ({
      letter: o.L,
      text: clean(o.text),
      explanation: o.blocks.map(b => b.type === 'imgs'
        ? { type: 'images', images: b.files.map(img) }
        : { type: b.type, text: clean(b.text) }).filter(b => b.type === 'images' ? b.images.length : b.text),
    })),
  };
});
const pack = { format: 'amboss-qbank-pack', version: 1, system, systemName, name: `AMBOSS Qbank — ${systemName}`, images, questions };
fs.writeFileSync(outFile, JSON.stringify(pack));
const blocks = {}; questions.forEach(q => blocks[q.block] = (blocks[q.block] || 0) + 1);
console.log(`${questions.length} questions`, blocks, `${Object.keys(images).length} images`, `${(fs.statSync(outFile).size / 1048576).toFixed(1)} MB`);
const bad = questions.filter(q => !q.stem || q.choices.length < 3 || q.choices.some(c => !c.text) || q.choices.some(c => !c.explanation.length));
console.log('suspect:', bad.map(q => q.id + ':' + q.choices.filter(c => !c.text || !c.explanation.length).map(c => c.letter).join('')).join(' ') || 'none');
