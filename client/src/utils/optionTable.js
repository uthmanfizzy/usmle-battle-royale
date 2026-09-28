// "Listed as renal plasma flow, glomerular filtration rate, then filtration
// fraction" questions: every option is the same set of directions in the same
// order, and read as prose they are almost impossible to compare. This turns
// them into a table with one column per variable, the way the exams print them.
//
// Two ways a question opts in:
//
//   1. Explicitly, which is what question authors should write:
//        Columns: RPF | GFR | FF
//        A) ↓↓ | ↓ | ↑
//      The `Columns:` line is taken out of the stem and used as the header row.
//
//   2. Automatically, for questions already written as prose: if EVERY option
//      splits into the same number of parts (2–5) and every part is a direction
//      ("increased", "no change", "↓↓"…), the options are tabulated and the
//      headers are read from a "listed as A, B, then C" phrase in the stem when
//      one is there.
//
// Anything else is left exactly as it was — a normal option list.

const MAX_COLUMNS = 5;

// One cell, as an arrow plus the words it came from. The arrow is what the eye
// compares down a column; the words stay for screen readers and for anyone who
// finds arrows ambiguous.
const DIRECTIONS = [
  [/^(?:↑↑|⇈|markedly|marked(?:ly)?\s+(?:increased?|raised|elevated|higher?)|greatly\s+increased?|much\s+(?:higher|greater))$/i, '↑↑'],
  [/^(?:↑|increased?|raised|elevated|higher?|greater|more|rises?|rising)$/i, '↑'],
  [/^(?:↓↓|⇊|markedly\s+(?:reduced?|decreased?|lower(?:ed)?)|greatly\s+(?:reduced?|decreased?)|much\s+(?:lower|less))$/i, '↓↓'],
  [/^(?:↓|reduced?|decreased?|lower(?:ed)?|less|falls?|falling|low)$/i, '↓'],
  [/^(?:↔|—|-|no\s+change|unchanged|normal|same|stable|unaffected|none)$/i, '↔'],
];

function toArrow(text) {
  const t = String(text || '').trim().replace(/\.$/, '');
  if (!t) return null;
  for (const [re, arrow] of DIRECTIONS) if (re.test(t)) return arrow;
  // "markedly reduced" style phrases that the patterns above missed, e.g.
  // "markedly increased" written as two words in the other order.
  const marked = /^(?:markedly|greatly|severely)\s+(.+)$/i.exec(t);
  if (marked) {
    const base = toArrow(marked[1]);
    if (base === '↑') return '↑↑';
    if (base === '↓') return '↓↓';
  }
  return null;
}

const splitCells = (text) => String(text || '')
  .split(/\s*\|\s*|\s*,\s*/)
  .map(s => s.trim())
  .filter(Boolean);

/**
 * Pull `Columns: a | b | c` out of a stem.
 * Returns { headers, stem } — stem is the text with that line removed.
 */
export function extractColumns(stem) {
  const text = String(stem || '');
  const m = /^[ \t]*columns?[ \t]*:[ \t]*(.+)$/im.exec(text);
  if (!m) return { headers: null, stem: text };
  const headers = m[1].split('|').map(h => h.trim()).filter(Boolean);
  if (headers.length < 2 || headers.length > MAX_COLUMNS) return { headers: null, stem: text };
  return {
    headers,
    // Take the whole line, and the blank line it leaves behind.
    stem: text.replace(m[0], '').replace(/\n{3,}/g, '\n\n').trim(),
  };
}

// "…listed as renal plasma flow, glomerular filtration rate, then filtration
// fraction?" — the phrasing these questions already use.
function headersFromPhrase(stem, count) {
  const m = /(?:listed|given|shown|in the order|in order)\s+(?:as|is|are)?\s*:?\s*([^.?]+)\?/i.exec(String(stem || ''));
  if (!m) return null;
  const parts = m[1]
    .split(/,|\bthen\b|\band\b/i)
    .map(s => s.trim().replace(/^(?:the|then)\s+/i, ''))
    .filter(Boolean);
  if (parts.length !== count) return null;
  // Long names would make the table wider than the page; the full name stays
  // as the column's title attribute in the component.
  return parts.map(p => ({ short: abbreviate(p), full: p }));
}

// "glomerular filtration rate" → "GFR"; short names are left alone.
function abbreviate(name) {
  const words = String(name).trim().split(/\s+/);
  if (words.length === 1) return words[0].length > 12 ? words[0].slice(0, 11) + '…' : words[0];
  const initials = words.filter(w => w.length > 2).map(w => w[0].toUpperCase()).join('');
  return initials.length >= 2 ? initials : words.map(w => w[0].toUpperCase()).join('');
}

/**
 * Decide whether these options should render as a table.
 * Returns null, or { headers: [{short, full}], rows: [[{arrow, text}]] }.
 */
export function buildOptionTable(stem, options) {
  if (!Array.isArray(options) || options.length < 2) return null;

  const { headers: explicit } = extractColumns(stem);
  const cellLists = options.map(splitCells);
  const count = cellLists[0]?.length || 0;
  if (count < 2 || count > MAX_COLUMNS) return null;
  if (!cellLists.every(cells => cells.length === count)) return null;

  // Every cell of every option must be a direction, otherwise this is an
  // ordinary comma-separated answer and tabulating it would be wrong.
  const rows = cellLists.map(cells => cells.map(text => ({ text, arrow: toArrow(text) })));
  if (!rows.every(cells => cells.every(c => c.arrow))) return null;

  let headers = null;
  if (explicit && explicit.length === count) {
    headers = explicit.map(h => ({ short: h, full: h }));
  } else {
    headers = headersFromPhrase(stem, count);
  }

  return { headers, rows };
}
