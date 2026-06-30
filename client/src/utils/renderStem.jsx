import React from 'react';

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
      if (seg.type === 'labs') out.push(seg);
      else if (seg.text.trim()) out.push({ type: 'prose', text: seg.text });
    }
  }
  return out;
}

// Render a question stem. Prose flows as paragraphs; a detected lab-values block
// (from newline-separated lines OR a run-on sequence) renders as a styled,
// line-separated lab panel. Reads theme variables so it's correct in both normal
// (dark) and study (light) modes.
export function renderStem(text) {
  if (!text) return null;

  const segments = segmentStem(text);
  // No lab block found → render exactly as before (single prose paragraph).
  if (segments.length === 1 && segments[0].type === 'prose') {
    return <p className="question-text">{renderProse(segments[0].text)}</p>;
  }

  return segments.map((seg, idx) => {
    if (seg.type === 'table') {
      const rows = seg.rows.filter((r) => !isSeparatorRow(r));
      if (rows.length === 0) return null;
      const [header, ...body] = rows;
      return (
        <div className="stem-table-wrap" key={idx}>
          <table className="stem-table">
            <thead>
              <tr>{header.map((c, ci) => <th key={ci}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (seg.type === 'labs') {
      return (
        <div className="lab-values-box" key={idx}>
          {seg.lines.map((ln, li) => {
            const ci = ln.indexOf(':');
            const name = ci >= 0 ? ln.slice(0, ci).trim() : ln.trim();
            const val  = ci >= 0 ? ln.slice(ci + 1).trim() : '';
            return (
              <div className="lab-row" key={li}>
                <span className="lab-name">{val ? `${name}:` : name}</span>
                {val && <span className="lab-value">{val}</span>}
              </div>
            );
          })}
        </div>
      );
    }
    return <p className="question-text" key={idx}>{renderProse(seg.text)}</p>;
  });
}

// Prose with internal newlines preserved as line breaks.
function renderProse(text) {
  const lines = String(text).split('\n');
  return lines.map((ln, li) => (
    <React.Fragment key={li}>
      {ln}
      {li < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

export default renderStem;
