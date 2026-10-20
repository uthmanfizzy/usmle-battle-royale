// ─────────────────────────────────────────────────────────────────────────────
// explanationHighlights — the SINGLE SOURCE OF TRUTH for explanation highlighting.
//
// THE INVARIANT: highlights anchor to VISIBLE-TEXT character offsets, never to the
// raw stored explanation string (markup delimiters like ** [color] are stripped on
// render, and inter-sentence whitespace is collapsed by .trim(), so raw offsets do
// NOT match what the user sees/selects). Capture (selection -> offsets) and apply
// (offsets -> <mark>) MUST compute the visible string the SAME way. They both go
// through parseExplanation()/toVisibleText() here, so they cannot drift apart.
//
// This file is plain JS (no JSX) on purpose so the invariant test can import it in
// Node. The offset-aware renderer (ExplanationText.jsx) consumes parseExplanation()
// and offsetsToSegments() from here.
// ─────────────────────────────────────────────────────────────────────────────

// Mirror of parseRichText's palette — keep in sync.
export const COLORS = {
  red:    '#ff6b6b',
  blue:   '#74b9ff',
  green:  '#55efc4',
  yellow: '#fdcb6e',
  orange: '#fd9644',
  purple: '#a29bfe',
  gold:   '#ffd700',
  pink:   '#fd79a8',
  cyan:   '#00cec9',
  white:  '#ffffff',
};

// The highlight swatch colours offered in the toolbar (a separate, fixed set
// from COLORS above, though purple deliberately shares its hex).
export const HIGHLIGHT_COLORS = ['yellow', 'green', 'pink', 'blue', 'purple'];

// ── Markup tokenizers (mirror parseRichText exactly, but emit text RUNS) ─────────
//
// A "run" is { text, bold?, italic?, underline?, color? } carrying the VISIBLE
// (markup-stripped) text plus its formatting. Concatenating every run's `text` in
// document order yields the visible string — the same text the DOM shows.

// Inline parser used INSIDE a [color] span: bold/italic + plain only (mirrors
// parseRichText's parseInline).
function parseInlineRuns(text) {
  const runs = [];
  let remaining = text;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
    if (boldMatch) {
      runs.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    const italicMatch = remaining.match(/^\*([\s\S]*?)\*/);
    if (italicMatch) {
      runs.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    let plainEnd = 0;
    while (plainEnd < remaining.length) {
      const next = remaining.slice(plainEnd);
      if (next.match(/^\*\*/) || next.match(/^\*[^*]/)) break;
      plainEnd++;
    }
    if (plainEnd === 0) plainEnd = 1;
    runs.push({ text: remaining.slice(0, plainEnd) });
    remaining = remaining.slice(plainEnd);
  }
  return runs;
}

// Top-level line tokenizer: [color], **bold**, *italic*, __underline__, plain.
// Mirrors the order and regexes of parseRichText's main loop.
function tokenizeLine(line) {
  const runs = [];
  let remaining = line;
  while (remaining.length > 0) {
    const colorMatch = remaining.match(/^\[(\w+)\]([\s\S]*?)\[\/\1\]/);
    if (colorMatch && COLORS[colorMatch[1]]) {
      for (const inner of parseInlineRuns(colorMatch[2])) {
        runs.push({ ...inner, color: colorMatch[1] });
      }
      remaining = remaining.slice(colorMatch[0].length);
      continue;
    }
    const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
    if (boldMatch) {
      runs.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    const italicMatch = remaining.match(/^\*([\s\S]*?)\*/);
    if (italicMatch) {
      runs.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    const underlineMatch = remaining.match(/^__([\s\S]*?)__/);
    if (underlineMatch) {
      runs.push({ text: underlineMatch[1], underline: true });
      remaining = remaining.slice(underlineMatch[0].length);
      continue;
    }
    let plainEnd = 0;
    while (plainEnd < remaining.length) {
      const next = remaining.slice(plainEnd);
      if (
        next.match(/^\*\*/) ||
        next.match(/^\*[^*]/) ||
        next.match(/^__/) ||
        next.match(/^\[\w+\]/)
      ) break;
      plainEnd++;
    }
    if (plainEnd === 0) plainEnd = 1;
    runs.push({ text: remaining.slice(0, plainEnd) });
    remaining = remaining.slice(plainEnd);
  }
  return runs;
}

// Sentence split — IDENTICAL to ExplanationText. Each sentence becomes a <p> block.
/* splitSentences removed: blocks follow the AUTHOR'S LINES now, not sentences.
   Splitting on sentence boundaries gave every sentence its own <p>, so prose
   written as a single paragraph rendered with a gap after every full stop —
   which read as random breaks mid-paragraph. Authors structure explanations
   with newlines (a __Header__ line, then a paragraph line), and that is what
   the renderer should honour. */

// Parse an explanation into blocks (= sentences). Each block has `lines` (split on
// \n, with <br> between), each line is an array of runs carrying global visible
// offsets { ...format, start, end }. This drives BOTH the renderer and toVisibleText.
export function parseExplanation(explanation) {
  if (!explanation) return [];
  const blocks = [];
  let offset = 0;
  // One block per authored line. Sentences inside a line flow together as the
  // author wrote them; a blank line yields an empty block, which renders as the
  // paragraph gap it was meant to be.
  for (const line of String(explanation).split('\n')) {
    const runs = tokenizeLine(line).map((run) => {
      const start = offset;
      offset += run.text.length;
      return { ...run, start, end: offset };
    });
    blocks.push({ lines: [runs] });
  }
  return blocks;
}

// The canonical VISIBLE string. MUST equal the rendered container's textContent.
// (Verified by the invariant test in explanationHighlights.invariant.mjs.)
export function toVisibleText(explanation) {
  if (!explanation) return '';
  let s = '';
  for (const block of parseExplanation(explanation)) {
    for (const line of block.lines) {
      for (const run of line) s += run.text;
    }
  }
  return s;
}

// ── DOM <-> offset bridge (capture side) ────────────────────────────────────────

// Ordered TreeWalker(SHOW_TEXT) walk of the explanation container.
export function getExplanationTextNodes(containerEl) {
  if (!containerEl || typeof document === 'undefined') return [];
  const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// Convert a DOM (node, offset) boundary point to a global visible-text offset.
// Uses Range.toString() (concatenated text-node data up to the point) so it works
// for both text-node and element-node boundaries, and stays consistent with
// textContent / toVisibleText.
function pointToOffset(container, node, offset) {
  const r = document.createRange();
  r.selectNodeContents(container);
  try {
    r.setEnd(node, offset);
  } catch {
    return null;
  }
  return r.toString().length;
}

// Convert a DOM selection Range to [start, end] visible-text offsets, or null if
// the selection is collapsed or bleeds outside the explanation container.
export function rangeToOffsets(container, range) {
  if (!container || !range) return null;
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null; // selection bleeds into options / why-wrong / stem -> reject
  }
  const a = pointToOffset(container, range.startContainer, range.startOffset);
  const b = pointToOffset(container, range.endContainer, range.endOffset);
  if (a == null || b == null) return null;
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  if (start === end) return null;
  return { start, end };
}

// ── Overlap flattening (apply side) ──────────────────────────────────────────────

// Win priority for overlap flattening: a student's OWN ('user') highlight takes
// precedence over an 'official' one on their screen; within the same scope, most
// recent wins. Returns a comparable rank — higher beats lower.
function highlightRank(h) {
  const scopeRank = h.scope === 'user' ? 1 : 0; // user over official
  return scopeRank * 1e15 + h.__pri; // scope dominates; recency breaks ties
}

// Flatten possibly-overlapping highlights into minimal NON-overlapping MULTI-ATTRIBUTE
// segments { start, end, color?, bold, italic }. Two layers merge per interval:
//   • COLOUR — at most one, picked by highlightRank (user-over-official, recency).
//   • FORMAT — bold/italic are additive: true if ANY covering (official) format span
//     of that kind covers the interval.
// A row is either a colour row (h.color) or a format row (h.format) — see the DB
// color-XOR-format constraint. No nested <mark> is produced.
export function offsetsToSegments(visibleString, highlights) {
  const len = visibleString.length;
  const valid = (highlights || [])
    .filter(
      (h) =>
        Number.isInteger(h.start) &&
        Number.isInteger(h.end) &&
        h.start >= 0 &&
        h.end > h.start &&
        h.end <= len &&
        (HIGHLIGHT_COLORS.includes(h.color) || h.format === 'bold' || h.format === 'italic')
    )
    .map((h, i) => ({
      ...h,
      __pri: h.created_at ? Date.parse(h.created_at) || i : i,
    }));
  if (!valid.length) return [];

  const points = new Set([0, len]);
  for (const h of valid) {
    points.add(h.start);
    points.add(h.end);
  }
  const sorted = [...points].sort((x, y) => x - y);

  const segments = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a >= b) continue;
    let bestColor = null;
    let bold = false;
    let italic = false;
    for (const h of valid) {
      if (h.start <= a && h.end >= b) {
        if (HIGHLIGHT_COLORS.includes(h.color)) {
          if (!bestColor || highlightRank(h) >= highlightRank(bestColor)) bestColor = h;
        } else if (h.format === 'bold') bold = true;
        else if (h.format === 'italic') italic = true;
      }
    }
    const color = bestColor ? bestColor.color : undefined;
    if (!color && !bold && !italic) continue;
    const last = segments[segments.length - 1];
    if (last && last.end === a && last.color === color && last.bold === bold && last.italic === italic) {
      last.end = b;
    } else {
      segments.push({ start: a, end: b, color, bold, italic });
    }
  }
  return segments;
}

// Slice a single run's text by the (sorted, non-overlapping) segments, yielding
// pieces { text, color?, bold?, italic? }. Used by the renderer to wrap pieces.
export function sliceRun(run, segments) {
  const pieces = [];
  let pos = run.start;
  for (const seg of segments) {
    if (seg.end <= run.start || seg.start >= run.end) continue;
    const s = Math.max(seg.start, run.start);
    const e = Math.min(seg.end, run.end);
    if (s > pos) pieces.push({ text: run.text.slice(pos - run.start, s - run.start) });
    pieces.push({ text: run.text.slice(s - run.start, e - run.start), color: seg.color, bold: seg.bold, italic: seg.italic });
    pos = e;
  }
  if (pos < run.end) pieces.push({ text: run.text.slice(pos - run.start) });
  return pieces;
}

// ── Drift resilience ──────────────────────────────────────────────────────────────
//
// Stored offsets can drift if the explanation text is later edited. On render we
// re-resolve each highlight against the CURRENT visible string:
//   1. exact: stored [start,end] still equals the stored quote -> use as-is
//   2. relocate: search prefix+quote+suffix, then quote-nearest-to-start
//   3. otherwise DROP it (never render on the wrong text)

function resolveOne(visibleString, h) {
  const len = visibleString.length;
  const { start, end, quote } = h;

  // No stored quote (legacy / quote omitted): trust offsets if still in range.
  if (quote == null || quote === '') {
    if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= len) {
      return { ...h };
    }
    return null;
  }

  // 1. exact at stored offsets
  if (
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end <= len &&
    visibleString.slice(start, end) === quote
  ) {
    return { ...h, start, end };
  }

  // 2a. relocate via prefix + quote + suffix
  const prefix = h.prefix || '';
  const suffix = h.suffix || '';
  if (prefix || suffix) {
    const needle = prefix + quote + suffix;
    const idx = visibleString.indexOf(needle);
    if (idx >= 0) {
      const s = idx + prefix.length;
      return { ...h, start: s, end: s + quote.length };
    }
  }

  // 2b. relocate via the quote alone, choosing the occurrence nearest the old start
  const occ = [];
  let p = visibleString.indexOf(quote);
  while (p >= 0) {
    occ.push(p);
    p = visibleString.indexOf(quote, p + 1);
  }
  if (occ.length === 0) return null; // 3. drop
  occ.sort((x, y) => Math.abs(x - (start || 0)) - Math.abs(y - (start || 0)));
  const s = occ[0];
  return { ...h, start: s, end: s + quote.length };
}

// Resolve a list of stored highlights against the current visible string.
export function resolveHighlights(visibleString, highlights) {
  const out = [];
  for (const h of highlights || []) {
    const r = resolveOne(visibleString, h);
    if (r) out.push(r);
  }
  return out;
}

// Normalize a server row (DB column names) into the client highlight shape
// ({ start, end, ... }) used by the renderer, resolver and overlap checks.
export function normalizeHighlightRow(row) {
  return {
    id: row.id,
    start: row.start_offset,
    end: row.end_offset,
    color: row.color ?? null,
    format: row.format ?? null,
    region: row.region ?? 'explanation',
    quote: row.quote ?? null,
    prefix: row.prefix ?? null,
    suffix: row.suffix ?? null,
    created_at: row.created_at,
    scope: row.scope,
  };
}

// Capture context around a selection for drift-resilient re-anchoring.
export function captureContext(visibleString, start, end, ctx = 30) {
  return {
    quote: visibleString.slice(start, end),
    prefix: visibleString.slice(Math.max(0, start - ctx), start),
    suffix: visibleString.slice(end, Math.min(visibleString.length, end + ctx)),
  };
}

// ── Cutting text out of the stored string ───────────────────────────────────
//
// A selection is measured in VISIBLE offsets — the text with its markup
// stripped, which is what the DOM shows and what highlights are stored
// against. The stored string is not that: it still carries **bold**,
// __underline__ and [color] wrappers, and its newlines contribute no visible
// characters at all. Splicing a visible range straight into the raw string
// would therefore cut in the wrong place the moment a question contains any
// formatting, and silently corrupt it.
//
// visibleSpans walks the raw string with the SAME rules the tokenizers above
// use and reports, for every run, the raw slice it came from and the visible
// range it occupies. A run's text is always one contiguous slice of the raw
// string, so within a span the two line up one for one and a visible range
// can be translated exactly.
//
// The test beside this file asserts that the spans' own text, concatenated,
// is byte-identical to toVisibleText for a batch of awkward strings — if the
// tokenizers above ever change and this walker does not, that fails rather
// than questions quietly losing the wrong words.

function pushRun(out, raw, rawStart, rawEnd, vis) {
  if (rawEnd <= rawStart) return vis;
  out.push({ rawStart, rawEnd, visStart: vis, visEnd: vis + (rawEnd - rawStart) });
  return vis + (rawEnd - rawStart);
}

// Mirrors parseInlineRuns: bold/italic/plain, inside a [color] span.
function inlineSpans(out, raw, from, to, vis) {
  let i = from;
  while (i < to) {
    const rest = raw.slice(i, to);
    const bold = rest.match(/^\*\*([\s\S]*?)\*\*/);
    if (bold) {
      vis = pushRun(out, raw, i + 2, i + 2 + bold[1].length, vis);
      i += bold[0].length;
      continue;
    }
    const italic = rest.match(/^\*([\s\S]*?)\*/);
    if (italic) {
      vis = pushRun(out, raw, i + 1, i + 1 + italic[1].length, vis);
      i += italic[0].length;
      continue;
    }
    let plain = 0;
    while (plain < rest.length) {
      const next = rest.slice(plain);
      if (next.match(/^\*\*/) || next.match(/^\*[^*]/)) break;
      plain++;
    }
    if (plain === 0) plain = 1;
    vis = pushRun(out, raw, i, i + plain, vis);
    i += plain;
  }
  return vis;
}

/**
 * Every visible run of `raw`, with the raw slice it came from.
 * Markup delimiters and newlines appear in no span, which is exactly what
 * makes them survive a cut.
 */
export function visibleSpans(raw) {
  const text = String(raw || '');
  const out = [];
  let vis = 0;
  let lineStart = 0;
  for (const line of text.split('\n')) {
    const to = lineStart + line.length;
    let i = lineStart;
    while (i < to) {
      const rest = text.slice(i, to);
      const color = rest.match(/^\[(\w+)\]([\s\S]*?)\[\/\1\]/);
      if (color && COLORS[color[1]]) {
        const innerFrom = i + color[1].length + 2;
        vis = inlineSpans(out, text, innerFrom, innerFrom + color[2].length, vis);
        i += color[0].length;
        continue;
      }
      const bold = rest.match(/^\*\*([\s\S]*?)\*\*/);
      if (bold) {
        vis = pushRun(out, text, i + 2, i + 2 + bold[1].length, vis);
        i += bold[0].length;
        continue;
      }
      const italic = rest.match(/^\*([\s\S]*?)\*/);
      if (italic) {
        vis = pushRun(out, text, i + 1, i + 1 + italic[1].length, vis);
        i += italic[0].length;
        continue;
      }
      const underline = rest.match(/^__([\s\S]*?)__/);
      if (underline) {
        vis = pushRun(out, text, i + 2, i + 2 + underline[1].length, vis);
        i += underline[0].length;
        continue;
      }
      let plain = 0;
      while (plain < rest.length) {
        const next = rest.slice(plain);
        if (
          next.match(/^\*\*/) ||
          next.match(/^\*[^*]/) ||
          next.match(/^__/) ||
          next.match(/^\[\w+\]/)
        ) break;
        plain++;
      }
      if (plain === 0) plain = 1;
      vis = pushRun(out, text, i, i + plain, vis);
      i += plain;
    }
    lineStart = to + 1;   // step over the newline, which is never visible
  }
  return out;
}

// A wrapper whose whole content has gone leaves its delimiters behind —
// "****" where a bold phrase was. Those are swept, and only those: an empty
// pair means something was removed from between them, while a lone "*" might
// be a multiplication sign somebody typed.
function sweepEmptyMarkup(text) {
  let out = text;
  let before;
  do {
    before = out;
    out = out
      .replace(/\*\*\*\*/g, '')
      .replace(/____/g, '')
      .replace(/\[(\w+)\]\[\/\1\]/g, '');
  } while (out !== before);
  return out;
}

/**
 * Remove the visible range [start, end) from `raw`, keeping every piece of
 * markup whose text survives.
 *
 * Returns null when the range is empty, reversed, or reaches past the end of
 * the visible text — a caller handed a stale offset should write nothing at
 * all rather than cut somewhere arbitrary.
 */
export function cutVisibleRange(raw, start, end) {
  const text = String(raw || '');
  const a = Number(start), b = Number(end);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b <= a) return null;
  const spans = visibleSpans(text);
  const visibleLength = spans.length ? spans[spans.length - 1].visEnd : 0;
  if (b > visibleLength) return null;

  // Raw indices to drop, gathered span by span.
  const drop = new Array(text.length).fill(false);
  for (const sp of spans) {
    const from = Math.max(a, sp.visStart);
    const to   = Math.min(b, sp.visEnd);
    if (to <= from) continue;
    const rawFrom = sp.rawStart + (from - sp.visStart);
    const rawTo   = sp.rawStart + (to - sp.visStart);
    for (let i = rawFrom; i < rawTo; i++) drop[i] = true;
  }

  let out = '';
  for (let i = 0; i < text.length; i++) if (!drop[i]) out += text[i];
  return sweepEmptyMarkup(out);
}

// ── Cutting by what was selected, when offsets cannot be mapped ─────────────
//
// cutVisibleRange above needs the stored string and the text on screen to be
// related by markup alone. For the EXPLANATION they are. For the STEM they are
// not: its renderer joins prose lines with <br> (so a newline in the stored
// string is no characters on screen), pulls lab rows apart into "Name:" and
// value with the whitespace trimmed off, and drops table separator rows
// altogether. There is no offset arithmetic that survives all of that, and
// renderStem's own model does not carry the raw positions to do it with —
// segmentStem rebuilds its text as it goes.
//
// So this does not use offsets at all. It takes the words that were selected
// and finds them in the stored string. One occurrence is unambiguous. Several
// are decided by what sits either side, compared loosely enough to see past
// the markup and whitespace that differ between the two forms. Anything still
// undecided returns null, because removing the wrong sentence is far worse
// than refusing to remove this one.

// Comparable across the two forms: markup, punctuation spacing and every kind
// of whitespace stop counting, so "**pain**.\nHe" and "pain. He" line up.
function loosely(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\[\/?\w+\]/g, ' ')     // [red] [/red]
    .replace(/[*_~`]/g, ' ')         // bold / italic / underline marks
    .replace(/\s+/g, ' ')
    .trim();
}

const TAIL = 28;

/**
 * Remove `quote` from `raw`, using the text either side of it to choose
 * between repeats. Returns the new string, or null when it cannot be sure.
 */
export function cutByQuote(raw, quote, prefix = '', suffix = '') {
  const text = String(raw || '');
  const needle = String(quote || '');
  if (!needle) return null;

  const at = [];
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) at.push(i);
  if (at.length === 0) return null;

  let pick = at[0];
  if (at.length > 1) {
    const wantBefore = loosely(prefix).slice(-TAIL);
    const wantAfter  = loosely(suffix).slice(0, TAIL);
    // Score each occurrence by how much of its own surroundings agrees.
    const scored = at.map((i) => {
      const before = loosely(text.slice(0, i)).slice(-TAIL);
      const after  = loosely(text.slice(i + needle.length)).slice(0, TAIL);
      let score = 0;
      if (wantBefore && before.endsWith(wantBefore)) score += wantBefore.length;
      if (wantAfter && after.startsWith(wantAfter)) score += wantAfter.length;
      return { i, score };
    }).sort((a, b) => b.score - a.score);
    // A tie is not a decision.
    if (scored[0].score === 0 || scored[0].score === scored[1].score) return null;
    pick = scored[0].i;
  }

  return text.slice(0, pick) + text.slice(pick + needle.length);
}
