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

// The 4 highlight swatch colours offered in the toolbar (a separate, fixed set).
export const HIGHLIGHT_COLORS = ['yellow', 'green', 'pink', 'blue'];

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
function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])$/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Parse an explanation into blocks (= sentences). Each block has `lines` (split on
// \n, with <br> between), each line is an array of runs carrying global visible
// offsets { ...format, start, end }. This drives BOTH the renderer and toVisibleText.
export function parseExplanation(explanation) {
  if (!explanation) return [];
  const blocks = [];
  let offset = 0;
  for (const sentence of splitSentences(explanation)) {
    const lines = sentence.split('\n').map((line) => {
      const runs = tokenizeLine(line).map((run) => {
        const start = offset;
        offset += run.text.length;
        return { ...run, start, end: offset };
      });
      return runs;
    });
    blocks.push({ lines });
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

// Flatten possibly-overlapping highlights into minimal NON-overlapping coloured
// segments. Priority: user-over-official, then most-recent (see highlightRank), so
// no nested <mark> is ever produced.
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
        HIGHLIGHT_COLORS.includes(h.color)
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
    let best = null;
    for (const h of valid) {
      if (h.start <= a && h.end >= b) {
        if (!best || highlightRank(h) >= highlightRank(best)) best = h;
      }
    }
    if (best) {
      const last = segments[segments.length - 1];
      if (last && last.end === a && last.color === best.color) last.end = b;
      else segments.push({ start: a, end: b, color: best.color });
    }
  }
  return segments;
}

// Slice a single run's text by the (sorted, non-overlapping) segments, yielding
// pieces { text, color|null }. Used by the renderer to wrap highlighted portions.
export function sliceRun(run, segments) {
  const pieces = [];
  let pos = run.start;
  for (const seg of segments) {
    if (seg.end <= run.start || seg.start >= run.end) continue;
    const s = Math.max(seg.start, run.start);
    const e = Math.min(seg.end, run.end);
    if (s > pos) pieces.push({ text: run.text.slice(pos - run.start, s - run.start), color: null });
    pieces.push({ text: run.text.slice(s - run.start, e - run.start), color: seg.color });
    pos = e;
  }
  if (pos < run.end) pieces.push({ text: run.text.slice(pos - run.start), color: null });
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
    color: row.color,
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
