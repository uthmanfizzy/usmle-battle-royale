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
//      headers are read out of the stem.
//
// HEADERS ARE REQUIRED. A row of bare arrows under no headings is worse than
// the prose it replaced: "↔ ↑ ↔" is unreadable unless you already know what
// the three columns are, and the reader has just been given no way to find
// out. So when the stem's variables cannot be identified, the options are left
// exactly as they were.
//
// Anything else is left alone too — a normal option list.

const MAX_COLUMNS = 5;

// One cell, as an arrow plus the words it came from. The arrow is what the eye
// compares down a column; the words are kept and shown with it, because
// "Decreased" is the answer and "↓" is shorthand for it.
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

// ── Finding the column names in the stem ───────────────────────────────────
//
// These questions name their variables in one of two arrangements, and real
// exam stems use both about equally often:
//
//   AFTER a marker   "…listed as renal plasma flow, GFR, then filtration
//                     fraction?"
//   BEFORE a marker  "Which changes in portal capillary oncotic pressure,
//                     portal capillary hydrostatic pressure and portal
//                     capillary permeability, in that order, caused his
//                     ascites?"
//
// Only the first was handled before, which is why a stem saying "in that
// order" tabulated into unlabelled arrows.

// Names follow the marker.
const NAMES_AFTER = [
  /(?:listed|given|shown|presented|reported)\s+(?:as|in)?\s*:?\s*([^.?]+?)\s*[.?]/i,
  /in\s+(?:the following|this)\s+order\s*:?\s*([^.?]+?)\s*[.?]/i,
];

// Names precede the marker. Deliberately anchored on the marker rather than on
// the question word: the lead-in varies ("Which changes in…", "What happens
// to…", "The effect on…") while the marker does not.
const NAMES_BEFORE = /([^.?]+?)\s*,?\s*(?:in\s+(?:that|this|the above)\s+order|respectively)\b/i;

// The lead-in glued to the first name — "Which changes in", "What happens to".
// Non-greedy to the FIRST linking word, so a name that itself contains "of"
// keeps all of itself.
const LEAD_IN = /^(?:which|what|how|the)\b.*?\b(?:in|of|to|for|on|are|is|were|would\s+be)\s+/i;

// Applied until it stops matching. One pass strips only to the FIRST linking
// word, which leaves "What are the expected changes in X" as "the expected
// changes in X"; a second pass takes the rest. Greedy matching would do it in
// one, but it would also eat a name that itself contains " in " or " of ".
function stripLeadIn(name) {
  let out = String(name).trim();
  for (let i = 0; i < 4; i++) {
    const next = out.replace(LEAD_IN, '').trim();
    if (next === out || !next) break;
    out = next;
  }
  return out;
}

function splitNames(text) {
  return String(text || '')
    .split(/\s*,\s*|\s+then\s+|\s+and\s+/i)
    .map(s => s.trim().replace(/^(?:the|a|an|then)\s+/i, '').replace(/[.;:]$/, ''))
    .filter(Boolean);
}

// A column name is a short noun phrase. Anything long or sentence-shaped is a
// sign the list was mis-detected, and a wrong header is worse than none.
const looksLikeName = (s) => s.length >= 2 && s.length <= 64 && s.split(/\s+/).length <= 9;

function headersFromPhrase(stem, count) {
  const text = String(stem || '');
  const tries = [];

  for (const re of NAMES_AFTER) {
    const m = re.exec(text);
    if (m) tries.push(splitNames(m[1]));
  }
  const before = NAMES_BEFORE.exec(text);
  if (before) {
    const parts = splitNames(before[1]);
    // The capture stops at the previous full stop, so these parts are the list
    // and its lead-in and nothing earlier — only the first can carry one.
    //
    // The count must then match EXACTLY. Taking the last few of a longer list
    // would quietly mislabel the table: a stem naming four variables against
    // three columns has been mis-read, and a wrong header is worse than none.
    if (parts.length) {
      parts[0] = stripLeadIn(parts[0]);
      tries.push(parts);
    }
  }

  for (const parts of tries) {
    if (parts.length !== count) continue;
    if (!parts.every(looksLikeName)) continue;
    const trimmed = dropSharedPrefix(parts);
    // The FULL name is kept for the tooltip even when the header shows the
    // shortened one — the reader can always find out what a column is.
    return parts.map((p, i) => ({ short: shorten(trimmed[i]), full: p }));
  }
  return null;
}

// What these names have in COMMON tells the reader nothing — it is the part
// that differs that identifies a column. "portal capillary oncotic pressure /
// portal capillary hydrostatic pressure / portal capillary permeability"
// becomes "oncotic pressure / hydrostatic pressure / permeability", which
// fits and can actually be read; initials ("PCOP / PCHP / PCP") fit too and
// cannot.
//
// Only a prefix shared by EVERY name, and never the last word of any of them:
// "Right atrium / Right ventricle / Left atrium" keeps its "Right", because
// there the shared word is doing work.
function dropSharedPrefix(names) {
  if (names.length < 2) return names;
  const split = names.map(n => n.trim().split(/\s+/));
  let shared = 0;
  const first = split[0];
  while (shared < first.length - 1
         && split.every(w => w.length > shared + 1
                          && w[shared].toLowerCase() === first[shared].toLowerCase())) {
    shared += 1;
  }
  if (!shared) return names;
  return split.map(w => w.slice(shared).join(' '));
}

// Headers are shown in full where they fit — that is how the exams print them,
// and "Right atrium" is worth more than "RA". Only a genuinely long name is
// reduced to initials, and the full text stays as the cell's title either way.
function shorten(name) {
  const clean = String(name).trim();
  if (clean.length <= 22) return clean;
  const words = clean.split(/\s+/);
  const initials = words.filter(w => w.length > 2).map(w => w[0].toUpperCase()).join('');
  return initials.length >= 2 ? initials : clean.slice(0, 21) + '…';
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

  const headers = (explicit && explicit.length === count)
    ? explicit.map(h => ({ short: shorten(h), full: h }))
    : headersFromPhrase(stem, count);

  // No headings, no table — see the note at the top of this file.
  if (!headers) return null;

  return { headers, rows };
}
