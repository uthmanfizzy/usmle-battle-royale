import fs from 'fs';
const P = JSON.parse(fs.readFileSync('decoded.json', 'utf8'));
const L = JSON.parse(fs.readFileSync('layout.json', 'utf8'));
const { fonts } = JSON.parse(fs.readFileSync('pass.json', 'utf8'));
const isBold = (f) => /Bold/.test(fonts[f]?.name || '');
const skipFont = (f) => /Arial|Courier|Tahoma/.test(fonts[f]?.name || '');
const SUP = { '+': '⁺', '-': '⁻', '−': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ', '(': '⁽', ')': '⁾', '–': '⁻' };
const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋' };
const conv = (s, M) => [...s].every(c => M[c]) ? [...s].map(c => M[c]).join('') : null;

const stream = [];
for (const pg of P) {
  const lines = []; let cur = null;
  const items = pg.items.filter(i => i.t !== undefined && i.t !== '' && !skipFont(i.f) && !/USMLEAmboss/.test(i.t));
  for (const it of items) {
    if (!it.t.trim()) { if (cur) cur.pendingSpace = true; continue; }
    if (cur && Math.abs(it.y - cur.y) < 7.5 && !(Math.abs(it.y - cur.y) > 2 && it.h >= cur.h)) {
      const dy = it.y - cur.y; let t = it.t;
      if (it.h < cur.h * 0.9 && (dy > 1.5 || dy < -0.8)) { const c = conv(t.trim(), dy > 0 ? SUP : SUB); t = c ?? t.trim(); cur.text += t; }
      else { const gap = it.x - cur.xe; if (it.glue) {
        // No space glyph either way, so decide from the word before it: "an|FEV",
        // "decreased|FEV" start a new word; "Ig|E", "AC|E", "EC|G", "FEV1:|FVC" do not.
        const tok = (cur.text.match(/(S*)$/) || ['', ''])[1];
        if (tok && (/^(a|A)$/.test(tok) || (/[a-z]{2}$/.test(tok) && !/^(Ig|kat)$/.test(tok)))) cur.text += ' ';
        cur.glueNext = true;
      } else if (cur.glueNext) { t = t.replace(/^s+/, ''); } else if (gap > 12 && cur.text.trim()) { cur.text = cur.text.replace(/\s+$/, '') + ' | '; t = t.replace(/^\s+/, ''); } else if ((gap > 1.2 || cur.pendingSpace) && !/\s$/.test(cur.text) && !/^\s/.test(t)) cur.text += ' '; cur.text += t; }
      cur.xe = it.x + it.w; cur.pendingSpace = false; if (!it.glue) cur.glueNext = false; if (isBold(it.f) === false) cur.allBold = false;
    } else {
      cur = { page: pg.n, y: it.y, h: it.h, text: it.t, xe: it.x + it.w, x: it.x, allBold: isBold(it.f), pendingSpace: false, glueNext: Boolean(it.glue) };
      lines.push(cur);
    }
  }
  const evs = lines.map(l => ({ t: 'line', page: l.page, y: l.y, h: l.h, bold: l.allBold, x: l.x, text: l.text.replace(/\s+/g, ' ').trim() }));
  const lay = L[pg.n - 1];
  for (const im of lay.imgs) if (im.file) evs.push({ t: 'img', page: pg.n, y: im.y1, yc: (im.y0 + im.y1) / 2, x: im.x0, file: im.file, w: im.w, h: im.h });
  evs.sort((a, b) => b.y - a.y);
  for (const e of evs) { e.gray = lay.rects.some(r => r.fill === '#808080' && e.y >= r.y0 - 2 && e.y <= r.y1 + 2); stream.push(e); }
}
// Code-32 letters (F/S/G/O/E per block font) come out split from their word:
// "E xamination", ".G lucocorticoids". Rejoin when the tail is never a word
// on its own anywhere else in the text ("penicillin G grows" stays).
{
  const lines = stream.filter(e => e.t === 'line');
  const freq = new Map();
  for (const e of lines) for (const m of e.text.matchAll(/(^|[^A-Za-z])([a-z]+)\b/g)) {
    const before = e.text.slice(Math.max(0, m.index + m[1].length - 2), m.index + m[1].length);
    if (/[FSGOE] $/.test(before) || m.index === 0) continue;
    freq.set(m[2], (freq.get(m[2]) || 0) + 1);
  }
  let fixed = 0;
  for (const e of lines) {
    e.text = e.text.replace(/(^|[^A-Za-z])([FSGOE]) ([a-z]+)/g, (all, pre, L, tail) => {
      if ((freq.get(tail) || 0) > 0) return all;
      fixed++;
      return (pre === '' || pre === ' ' || pre === '(' || pre === '-' || pre === '/' ? pre : pre + ' ') + L + tail;
    });
  }
  console.log('rejoined split capitals:', fixed);
}
fs.writeFileSync('stream.json', JSON.stringify(stream));

// ── segmentation
const Qs = []; let q = null, mode = null, block = 0, opt = null, sec = null, lastY = null, lastPage = null;
const addText = (target, key, line) => {
  const prev = target[key] || '';
  let sep = prev ? ' ' : '';
  if (prev && lastPage === line.page && lastY != null && lastY - line.y > 22) sep = '\n\n';
  if (prev && /[A-Za-z]-$/.test(prev) && sep === ' ') sep = '';
  target[key] = prev + sep + line.text;
};
for (const e of stream) {
  if (e.t === 'line') {
    let m;
    if (e.bold && (m = e.text.match(/^Question # (\d+)$/))) {
      const n = +m[1]; if (n === 1 || !q || n < q.n) block++;
      q = { block, n, page: e.page, stem: '', stemImgs: [], table: [], hint: '', opts: [] }; Qs.push(q); mode = 'stem'; opt = null; sec = null; lastY = null; continue;
    }
    if (!q) continue;
    if (e.bold && /^Answer (\| )?Image$/.test(e.text)) { mode = 'table'; continue; }
    if (e.bold && e.text === 'Hint') { mode = 'hint'; lastY = null; continue; }
    if (e.bold && e.text === 'Correct Answer') { mode = 'ans'; continue; }
    if (mode === 'ans') {
      if (e.bold && e.h >= 13 && (m = e.text.match(/^([A-J]) -\s*(.*)$/))) { opt = { L: m[1], text: m[2], correct: e.gray, blocks: [] }; q.opts.push(opt); sec = null; continue; }
      if (e.bold && e.h >= 13 && opt && !sec) { opt.text = (opt.text + ' ' + e.text).trim(); opt.correct ||= e.gray; continue; }
      if (e.bold && (m = e.text.match(/^Explanation (Why|But)$/))) { sec = { type: m[1].toLowerCase(), text: '' }; opt.blocks.push(sec); lastY = null; continue; }
      if (e.bold && e.text === 'Image') { sec = { type: 'imgs', files: [] }; opt.blocks.push(sec); continue; }
      if (!opt) { (q.junk ||= []).push(e.text); continue; }
      if (!sec || sec.type === 'imgs') { sec = { type: 'text', text: '' }; opt.blocks.push(sec); }
      addText(sec, 'text', e); lastY = e.y; lastPage = e.page; continue;
    }
    if (mode === 'stem') { addText(q, 'stem', e); lastY = e.y; lastPage = e.page; continue; }
    if (mode === 'table') { q.table.push(e.text); if (e.x < 85) { q.rows ||= []; q.rows.push({ L: String.fromCharCode(65 + q.rows.length), y: e.y, page: e.page }); } continue; }
    if (mode === 'hint') { addText(q, 'hint', e); lastY = e.y; lastPage = e.page; continue; }
  } else {
    if (!q) continue;
    if (mode === 'stem') q.stemImgs.push(e.file);
    else if (mode === 'table') (q.tableImgs ||= []).push({ file: e.file, page: e.page, yc: e.yc });
    else if (mode === 'hint') (q.hintImgs ||= []).push(e.file);
    else if (mode === 'ans' && opt) { if (!sec || sec.type !== 'imgs') { sec = { type: 'imgs', files: [] }; opt.blocks.push(sec); } sec.files.push(e.file); }
    else (q.lostImgs ||= []).push(e.file);
  }
}
for (const q of Qs) for (const im of q.tableImgs || []) {
  const rows = (q.rows || []).filter(r => r.page === im.page);
  let best = null; for (const r of rows) if (!best || Math.abs(r.y - im.yc) < Math.abs(best.y - im.yc)) best = r;
  if (!best) { (q.lostImgs ||= []).push(im.file); continue; }
  ((q.optImgs ||= {})[best.L] ||= []).push(im.file);
}
fs.writeFileSync('questions.json', JSON.stringify(Qs, null, 1));
const byBlock = {}; Qs.forEach(q => byBlock[q.block] = (byBlock[q.block] || 0) + 1);
console.log('questions', Qs.length, byBlock);
for (const q of Qs) {
  const nc = q.opts.filter(o => o.correct).length;
  const issues = [];
  if (nc !== 1) issues.push('correct=' + nc);
  if (q.opts.length < 3) issues.push('opts=' + q.opts.length);
  if (!q.hint) issues.push('nohint');
  if (q.junk) issues.push('junk:' + q.junk.join('|').slice(0, 80));
  if (q.lostImgs) issues.push('lostImgs');
  if (q.hintImgs) issues.push('hintImgs');
  if (q.opts.some((o, i) => o.L !== String.fromCharCode(65 + i))) issues.push('letters:' + q.opts.map(o => o.L).join(''));
  if (issues.length) console.log(`B${q.block} Q${q.n} p${q.page}:`, issues.join(' ; '));
}
console.log('stem imgs', Qs.reduce((s, q) => s + q.stemImgs.length, 0), 'expl imgs', Qs.reduce((s, q) => s + q.opts.reduce((t, o) => t + o.blocks.filter(b => b.type === 'imgs').reduce((u, b) => u + b.files.length, 0), 0), 0));
