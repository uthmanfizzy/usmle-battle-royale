import React from 'react';
import { offsetsToSegments } from './explanationHighlights';

// A "lab value" line looks like  Name: value [units] [(reference/note)]  — a short
// test-name label (cap <= ~41 chars so ordinary prose with a mid-sentence colon
// doesn't match), a colon, then a recognisable VALUE. The value qualifies if it is:
//   • a number, optionally with a comparator   (7.8, <5, ~3)
//   • a known qualitative result word          (negative, normal, elevated, …)
//   • a single short term, maybe parenthesised  (echinocytes (spiculated red cells))
// A non-empty value is required, so "Laboratory studies show:" (nothing after the
// colon) is never a lab line. The 2+ consecutive-run guard is the final backstop
// against a stray prose colon being boxed.
const LAB_LABEL_RE  = /^([A-Za-z][A-Za-z0-9 ,.\/()%+\-']{0,40}):\s*(\S.*)$/;
const NUM_VALUE_RE  = /^[<>~]?\s*[.\d]/;
// one word (letters, optional hyphen/slash), optionally followed by a parenthetical
const SINGLE_TERM_RE = /^[A-Za-z][A-Za-z\-/]{1,29}\.?(\s*\([^)]*\))?$/;
const QUAL_WORDS = new Set([
  'positive', 'negative', 'normal', 'elevated', 'decreased', 'increased',
  'low', 'high', 'abnormal', 'reactive', 'nonreactive', 'non-reactive',
  'absent', 'present', 'trace', 'raised', 'reduced', 'unremarkable',
  'detected', 'undetected', 'positive/negative',
]);

// Shared value rule — used by BOTH the line-break detector (isLabLine) and the
// run-on detector below, so the two modes agree on what counts as a value.
function isLabValue(value) {
  const v = (value || '').trim();
  if (!v) return false;
  if (NUM_VALUE_RE.test(v)) return true;
  const firstWord = (v.toLowerCase().match(/^[a-z][a-z\-/]*/) || [''])[0];
  if (QUAL_WORDS.has(firstWord)) return true;
  if (SINGLE_TERM_RE.test(v)) return true;
  return false;
}

export function isLabLine(line) {
  const m = LAB_LABEL_RE.exec((line || '').trim());
  return !!m && isLabValue(m[2]);
}

// ── Run-on (no-newline) detection ───────────────────────────────────────────
// Questions saved before the parser fix have their lab values flattened into one
// line, e.g. "…studies show: Haemoglobin: 7.8 g/dL Reticulocyte count: 8% …".
// We recover the panel at display time by scanning for a CONTIGUOUS run of 2+
// "Label: value" segments where each value matches the strict value rule. Two
// things make this safe against boxing prose:
//   1. The label must be Uppercase-initial and short (units like "g/dL" are
//      lowercase, so a value never gets mistaken for the next label).
//   2. Each value is matched by a PRECISE pattern (number+unit / qualitative word
//      / single term + optional parenthetical), so the value can't run off into
//      the following sentence — the trailing question/paragraph stays prose.
// A run is only accepted at a clean boundary (string start, or after . ? ! : )
// or a newline) and only when 2+ segments chain directly together.
const ESC      = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const QUAL_ALT = [...QUAL_WORDS].sort((a, b) => b.length - a.length).map(ESC).join('|');
const UC_LABEL = "[A-Z][A-Za-z0-9()/'’%+\\-]*(?:[ \\t][A-Za-z0-9()/'’%+\\-]+){0,6}";
const PAREN    = "(?:\\s*\\([^)]*\\))?";
const NUM_VAL  = "[<>~]?\\s*\\d[\\d.,]*(?:\\s*[A-Za-zµμ%][A-Za-zµμ%/0-9.^\\-]*)?" + PAREN;
const QUAL_VAL = "(?:" + QUAL_ALT + ")(?:/[A-Za-z]+)?" + PAREN;
const TERM_VAL = "[A-Za-z][A-Za-z\\-/]{1,29}\\.?" + PAREN;
// Sticky: a single "Label: value" segment, value bounded to end at a separator.
const SEG_RE   = new RegExp(
  "(" + UC_LABEL + "):[ \\t]*(" + NUM_VAL + "|" + QUAL_VAL + "|" + TERM_VAL + ")(?=$|[ \\t.,;)])",
  'y'
);

function matchSegmentAt(text, pos) {
  SEG_RE.lastIndex = pos;
  const m = SEG_RE.exec(text);
  if (!m || m.index !== pos) return null;
  const label = m[1].trim();
  if (label.length > 41 || !isLabValue(m[2])) return null;
  return { start: pos, end: SEG_RE.lastIndex, label, value: m[2].trim() };
}

function findInlineLabRun(text) {
  // candidate start positions: string start + just after a sentence/colon/paren
  // boundary or a newline (a fresh label may legitimately begin there)
  const starts = [0];
  const bRe = /[.?!:)\n][ \t]+|\n/g;
  let bm;
  while ((bm = bRe.exec(text))) {
    const idx = bm.index + bm[0].length;
    if (idx < text.length) starts.push(idx);
  }
  for (const s of starts) {
    let pos = s;
    while (pos < text.length && /[ \t]/.test(text[pos])) pos++;
    const segs = [];
    let p = pos;
    for (;;) {
      const seg = matchSegmentAt(text, p);
      if (!seg) break;
      segs.push(seg);
      p = seg.end;
      while (p < text.length && /\s/.test(text[p])) p++;
    }
    if (segs.length >= 2) {
      return {
        before: text.slice(0, segs[0].start),
        labs:   segs.map((g) => `${g.label}: ${g.value}`),
        after:  text.slice(segs[segs.length - 1].end),
      };
    }
  }
  return null;
}

// Split a prose string into prose/labs segments by recovering inline lab runs.
// Returns [{ type:'prose', text }] when nothing is found (the common case).
function splitInlineLabs(text) {
  const run = findInlineLabRun(text);
  if (!run) return [{ type: 'prose', text }];
  const out = [];
  if (run.before.trim()) out.push({ type: 'prose', text: run.before.trim() });
  out.push({ type: 'labs', lines: run.labs });
  if (run.after.trim()) out.push(...splitInlineLabs(run.after.trim()));
  return out;
}

// ── Table detection ──────────────────────────────────────────────────────────
// A pipe-delimited table the author writes as consecutive lines:
//   | Header 1 | Header 2 |
//   | Cell A1  | Cell A2  |
// Split a row on '|', trim cells, and drop a single empty leading/trailing cell so
// both "| a | b |" and "a | b" work.
export function splitTableRow(line) {
  let cells = String(line).split('|').map((c) => c.trim());
  if (cells.length && cells[0] === '') cells = cells.slice(1);
  if (cells.length && cells[cells.length - 1] === '') cells = cells.slice(0, -1);
  return cells;
}

// A table LINE has a pipe and yields 2+ cells, at least 2 of them non-empty (so a
// lone "a | b" still qualifies as a line, but a single such line never becomes a
// table — that needs a RUN of 2+, enforced in groupStem). "| |" is not a table.
export function isTableLine(line) {
  if (!line || line.indexOf('|') === -1) return false;
  const cells = splitTableRow(line);
  if (cells.length < 2) return false;
  return cells.filter((c) => c.length > 0).length >= 2;
}

// Markdown separator row, e.g. "| --- | :--: |" — dropped at render time so a pasted
// markdown table looks right (the author's structure has no separator, this is a bonus).
function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

// ── Run-on (flattened) table recovery ────────────────────────────────────────
// A table stored before the parser preserved its line breaks gets flattened onto one
// line, e.g. "| A | B | | 1 | 2 | | 3 | 4 |". Because each row was wrapped in outer
// pipes, joining rows with a space leaves a "| |" boundary between them. Recover by
// splitting on that boundary. CONSERVATIVE: only accept a clean grid — 2+ rows, 2+
// columns, and a uniform column count — so ordinary prose with a stray pipe is never
// mistaken for a table.
function findFlattenedTable(text) {
  const t = String(text).trim();
  const first = t.indexOf('|');
  const last = t.lastIndexOf('|');
  if (first < 0 || last <= first) return null;
  const tableStr = t.slice(first, last + 1);
  if (!/\|\s*\|/.test(tableStr)) return null; // no "| |" row boundary → not multi-row
  const chunks = tableStr.split(/\|\s*\|/);
  const rows = chunks.map((c, idx) => {
    // Re-add the boundary pipes the split consumed so each chunk is a full row.
    let s = c;
    if (idx > 0) s = '|' + s;
    if (idx < chunks.length - 1) s = s + '|';
    return splitTableRow(s);
  });
  if (rows.length < 2) return null;
  const n = rows[0].length;
  if (n < 2) return null;
  if (!rows.every((r) => r.length === n)) return null; // uniform grid only
  return { before: t.slice(0, first).trim(), rows, after: t.slice(last + 1).trim() };
}

// Split a prose string into prose/table segments by recovering a flattened table.
function splitInlineTable(text) {
  const run = findFlattenedTable(text);
  if (!run) return [{ type: 'prose', text }];
  const out = [];
  if (run.before) out.push({ type: 'prose', text: run.before });
  out.push({ type: 'table', rows: run.rows });
  if (run.after) out.push(...splitInlineTable(run.after));
  return out;
}

// ── Line-break detection (original + table) ─────────────────────────────────
// Classify each LINE as 'table' | 'labs' | 'prose'. A RUN of 2+ consecutive table
// lines becomes a table; a RUN of 2+ consecutive lab lines becomes a lab box; the
// rest is prose. Tables are detected first (a table line has a pipe; a lab line has
// a colon-value and no pipe, so they don't collide). Returns blocks of
// { type, lines: string[] }.
export function groupStem(text) {
  const lines = String(text).split('\n');
  const n = lines.length;
  const kind = new Array(n).fill('prose');

  // Tables: 2+ consecutive pipe-rows.
  for (let i = 0; i < n; ) {
    if (isTableLine(lines[i])) {
      let j = i;
      while (j < n && isTableLine(lines[j])) j++;
      if (j - i >= 2) { for (let k = i; k < j; k++) kind[k] = 'table'; i = j; continue; }
    }
    i++;
  }
  // Labs: 2+ consecutive lab lines among the lines not already claimed as table.
  for (let i = 0; i < n; ) {
    if (kind[i] === 'prose' && isLabLine(lines[i])) {
      let j = i;
      while (j < n && kind[j] === 'prose' && isLabLine(lines[j])) j++;
      if (j - i >= 2) { for (let k = i; k < j; k++) kind[k] = 'labs'; i = j; continue; }
    }
    i++;
  }
  const blocks = [];
  for (let k = 0; k < n; k++) {
    const type = kind[k];
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) last.lines.push(lines[k]);
    else blocks.push({ type, lines: [lines[k]] });
  }
  return blocks;
}

// Unified segmentation: line-break detection first (handles newline-separated
// panels), then run-on detection inside each prose block (handles flattened
// pre-existing questions). Both share isLabValue, so they agree on values.
export function segmentStem(text) {
  const out = [];
  for (const b of groupStem(text)) {
    if (b.type === 'labs') { out.push({ type: 'labs', lines: b.lines }); continue; }
    if (b.type === 'table') { out.push({ type: 'table', rows: b.lines.map(splitTableRow) }); continue; }
    for (const seg of splitInlineLabs(b.lines.join('\n'))) {
      if (seg.type === 'labs') { out.push(seg); continue; }
      if (!seg.text.trim()) continue;
      // Recover a flattened (run-on) table inside this prose segment, if any.
      for (const tseg of splitInlineTable(seg.text)) {
        if (tseg.type === 'table') out.push(tseg);
        else if (tseg.text.trim()) out.push({ type: 'prose', text: tseg.text });
      }
    }
  }
  return out;
}

// ── Inline markup (**bold**, *italic*, __underline__) ───────────────────────
//
// The explanation has parsed these since it was written; the stem never did, so
// an author who typed **aortic dissection** got the asterisks on screen.
//
// Parsed HERE, inside the offset model, rather than at render time — that is
// what keeps the stem's one hard invariant true. toStemVisibleText and
// renderStem both read token.text, so stripping the markers in mk() changes
// BOTH together and the rendered textContent still equals the claimed visible
// string. Parsing in the renderer alone would have silently broken every
// highlight anchor in the app.
//
// The markers stop being visible characters, so a highlight stored against a
// marked-up stem before this shifts by the width of its markers. The resolver
// already drops a highlight whose context no longer matches, which is the
// right outcome: approximately-placed highlights are worse than absent ones.
//
// Colour tags ([red]…[/red]) are deliberately NOT handled here. Colour in a
// stem is the highlighter's, and a second source of colour would fight the
// hl-* marks for the same characters.
//
// No lookbehind anywhere: Safari only learned it in 16.4, and an unsupported
// regex throws when the module is PARSED, which would take the whole game down
// rather than degrade.
const INLINE_RE = /(\*\*)([\s\S]+?)\*\*|(__)([\s\S]+?)__|(^|[^\w*])\*([^*\n]+?)\*(?![\w*])/g;

// Raw string -> { text: what the student sees, marks: local-offset spans }.
// The italic form needs its opening * to sit at a word boundary, so "5*5 and
// 3*3" stays arithmetic instead of turning into one italic run.
export function parseStemInline(raw) {
  const s = String(raw ?? '');
  if (!s || (s.indexOf('*') < 0 && s.indexOf('_') < 0)) return { text: s, marks: [] };
  let text = '';
  const marks = [];
  let last = 0;
  let m;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(s)) !== null) {
    text += s.slice(last, m.index);
    let inner, kind;
    if (m[2] !== undefined) { inner = m[2]; kind = 'bold'; }
    else if (m[4] !== undefined) { inner = m[4]; kind = 'underline'; }
    else { text += m[5] || ''; inner = m[6]; kind = 'italic'; }
    const start = text.length;
    text += inner;
    marks.push({ start, end: text.length, [kind]: true });
    last = m.index + m[0].length;
  }
  text += s.slice(last);
  return { text, marks };
}

// ── Offset model (the SINGLE SOURCE shared by toStemVisibleText + renderStem) ──
//
// buildStemModel walks segmentStem and assigns GLOBAL VISIBLE OFFSETS to every text
// fragment, in the SAME document order the renderer emits them. The key alignment
// rules (so toStemVisibleText === the rendered container's textContent):
//   • prose: lines joined with nothing (\n → <br>, contributes 0 chars)
//   • labs:  per row "Name:" + value with NO space between (two adjacent spans)
//   • table: separator rows dropped; cells concatenated header-first, no separators
// Both renderStem and toStemVisibleText derive from THIS function, so capture
// (Range.toString over .stem-text) and apply (these offsets) cannot drift apart.
export function buildStemModel(text) {
  const segs = segmentStem(text);
  let offset = 0;
  // Markers are stripped HERE, so every offset downstream — visible text,
  // highlight anchors, the admin text-cut — counts the same characters the
  // student actually sees.
  const mk = (s) => {
    const { text: vis, marks } = parseStemInline(s);
    const tok = { text: vis, start: offset, end: offset + vis.length, marks };
    offset += vis.length;
    return tok;
  };
  const blocks = [];
  for (const seg of segs) {
    if (seg.type === 'prose') {
      const lines = String(seg.text).split('\n').map((ln) => mk(ln));
      blocks.push({ type: 'prose', lines });
    } else if (seg.type === 'labs') {
      const rows = seg.lines.map((ln) => {
        const ci = ln.indexOf(':');
        const name = ci >= 0 ? ln.slice(0, ci).trim() : ln.trim();
        const val  = ci >= 0 ? ln.slice(ci + 1).trim() : '';
        const nameTok = mk(val ? `${name}:` : name);
        const valTok  = val ? mk(val) : null;
        return { nameTok, valTok };
      });
      blocks.push({ type: 'labs', rows });
    } else if (seg.type === 'table') {
      const rows = seg.rows.filter((r) => !isSeparatorRow(r)).map((r) => r.map((c) => mk(c)));
      blocks.push({ type: 'table', rows });
    }
  }
  return blocks;
}

// Canonical VISIBLE string for the stem — MUST equal the rendered .stem-text
// container's textContent (verified by renderStem.invariant.mjs).
export function toStemVisibleText(text) {
  if (!text) return '';
  let s = '';
  for (const b of buildStemModel(text)) {
    if (b.type === 'prose') for (const t of b.lines) s += t.text;
    else if (b.type === 'labs') for (const r of b.rows) { s += r.nameTok.text; if (r.valTok) s += r.valTok.text; }
    else if (b.type === 'table') for (const row of b.rows) for (const t of row) s += t.text;
  }
  return s;
}

function renderPiece(p, key) {
  let node = p.text;
  if (p.underline) node = <u>{node}</u>;
  if (p.italic) node = <em>{node}</em>;
  if (p.bold) node = <strong style={{ fontWeight: 700 }}>{node}</strong>;
  if (p.color) return <mark key={key} className={`hl hl-${p.color}`}>{node}</mark>;
  if (p.bold || p.italic || p.underline) return <React.Fragment key={key}>{node}</React.Fragment>;
  return node;
}

// Render a token's text, with the author's own markup and the reader's
// highlights laid over the same characters.
//
// Per character rather than by slicing ranges: a highlight and a bold run can
// start and end anywhere relative to each other, and two overlapping range
// lists cannot be walked in one pass without inventing a rule for which one
// wins. Each character simply collects every attribute covering it, and equal
// neighbours are then joined back up. Tokens are one line long, so this is
// cheap.
//
// With nothing covering it the BARE string comes back, so the common path is
// byte-identical to the original renderer.
function renderTokenText(tok, segments, keyBase) {
  const marks = tok.marks || [];
  const covering = (segments || []).filter(seg => seg.end > tok.start && seg.start < tok.end);
  if (!covering.length && !marks.length) return tok.text;

  const n = tok.text.length;
  const attr = [];
  for (let i = 0; i < n; i++) attr.push({ color: undefined, bold: false, italic: false, underline: false });
  // Highlights carry global offsets; the author's marks are local to the token.
  for (const seg of covering) {
    const from = Math.max(0, seg.start - tok.start);
    const to   = Math.min(n, seg.end - tok.start);
    for (let i = from; i < to; i++) {
      if (seg.color) attr[i].color = seg.color;
      if (seg.bold) attr[i].bold = true;
      if (seg.italic) attr[i].italic = true;
    }
  }
  for (const mk of marks) {
    for (let i = Math.max(0, mk.start); i < Math.min(n, mk.end); i++) {
      if (mk.bold) attr[i].bold = true;
      if (mk.italic) attr[i].italic = true;
      if (mk.underline) attr[i].underline = true;
    }
  }

  const same = (a, b) => a.color === b.color && a.bold === b.bold
    && a.italic === b.italic && a.underline === b.underline;
  const pieces = [];
  for (let i = 0; i < n; ) {
    let j = i + 1;
    while (j < n && same(attr[i], attr[j])) j++;
    pieces.push({ ...attr[i], text: tok.text.slice(i, j) });
    i = j;
  }
  if (pieces.length === 1 && !pieces[0].color && !pieces[0].bold
      && !pieces[0].italic && !pieces[0].underline) return tok.text;
  return pieces.map((p, i) => renderPiece(p, `${keyBase}-${i}`));
}

// Render a question stem. Prose flows as paragraphs; a detected lab-values block
// renders as a styled lab panel; a pipe table renders as a styled <table>. When
// `opts.highlights` is given, official/own highlight + bold/italic spans are applied
// over the SAME offset model. With no highlights the output is byte-identical to the
// original renderer (GameRoom + every existing caller unaffected). Reads theme
// variables so it's correct in both normal (dark) and study (light) modes.
export function renderStem(text, opts = {}) {
  if (!text) return null;
  const highlights = opts.highlights || [];
  const blocks = buildStemModel(text);

  let segments = [];
  if (highlights.length) {
    let visibleLen = 0;
    for (const b of blocks) {
      if (b.type === 'prose') for (const t of b.lines) visibleLen = Math.max(visibleLen, t.end);
      else if (b.type === 'labs') for (const r of b.rows) { visibleLen = Math.max(visibleLen, r.nameTok.end); if (r.valTok) visibleLen = Math.max(visibleLen, r.valTok.end); }
      else if (b.type === 'table') for (const row of b.rows) for (const t of row) visibleLen = Math.max(visibleLen, t.end);
    }
    segments = offsetsToSegments({ length: visibleLen }, highlights);
  }

  return blocks.map((b, bi) => {
    if (b.type === 'table') {
      if (b.rows.length === 0) return null;
      const [header, ...body] = b.rows;
      return (
        <div className="stem-table-wrap" key={bi}>
          <table className="stem-table">
            <thead>
              <tr>{header.map((c, ci) => <th key={ci}>{renderTokenText(c, segments, `h${bi}-${ci}`)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderTokenText(c, segments, `c${bi}-${ri}-${ci}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (b.type === 'labs') {
      return (
        <div className="lab-values-box" key={bi}>
          {b.rows.map((r, li) => (
            <div className="lab-row" key={li}>
              <span className="lab-name">{renderTokenText(r.nameTok, segments, `ln${bi}-${li}`)}</span>
              {r.valTok && <span className="lab-value">{renderTokenText(r.valTok, segments, `lv${bi}-${li}`)}</span>}
            </div>
          ))}
        </div>
      );
    }
    // prose
    return (
      <p className="question-text" key={bi}>
        {b.lines.map((tok, li) => (
          <React.Fragment key={li}>
            {renderTokenText(tok, segments, `p${bi}-${li}`)}
            {li < b.lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export default renderStem;
