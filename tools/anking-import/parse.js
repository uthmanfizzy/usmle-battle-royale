'use strict';
/**
 * Pure parsing helpers — no I/O, no database, no global state.
 * Every function that can encounter malformed input pushes a structured record
 * onto the caller's `issues` array instead of throwing, so one bad note never
 * aborts a run.
 */

const cheerio = require('cheerio');
const cfg = require('./config');

// ── HTML → DOM helpers ────────────────────────────────────────────────────────

/** Load an HTML fragment without cheerio wrapping it in <html><body>. */
function loadFragment(html) {
  return cheerio.load(html || '', null, false);
}

/**
 * Sanitise a field's HTML: drop dangerous subtrees, unwrap disallowed elements
 * (keeping their text), and filter attributes down to the per-tag allow-list.
 * Uses a real parser rather than regex because the collection mixes
 * self-closing and non-self-closing <img>, and varies attribute order.
 */
function sanitizeHtml(html, issues, ctx) {
  if (!html) return '';
  let $;
  try {
    $ = loadFragment(html);
  } catch (e) {
    issues.push({ kind: 'html_parse_failed', ...ctx, message: e.message, sample: String(html).slice(0, 300) });
    return String(html).replace(/<[^>]*>/g, '');
  }

  // 1. Remove subtrees outright.
  $(Array.from(cfg.DROP_SUBTREE_TAGS).join(',')).remove();

  // 2. Snapshot every element in document order, then unwrap disallowed ones.
  //    Snapshotting first means children of an unwrapped node are still visited.
  const els = $('*').toArray();
  for (const el of els) {
    const tag = (el.tagName || '').toLowerCase();
    if (!cfg.ALLOWED_TAGS.has(tag)) {
      const $el = $(el);
      try {
        $el.replaceWith($el.contents());
      } catch (e) {
        issues.push({ kind: 'unwrap_failed', ...ctx, tag, message: e.message });
      }
    }
  }

  // 3. Attribute allow-list on what survived.
  for (const el of $('*').toArray()) {
    const tag = (el.tagName || '').toLowerCase();
    const allowed = cfg.ALLOWED_ATTRS[tag] || [];
    for (const attr of Object.keys(el.attribs || {})) {
      if (!allowed.includes(attr.toLowerCase())) delete el.attribs[attr];
    }
  }

  return $.html();
}

/**
 * Flatten HTML to plain text with block-level newlines preserved — needed to
 * find "A) option" lines in the MCQ note type, where options are separated by
 * <div> and <br> rather than real newlines.
 */
function htmlToLines(html, issues, ctx) {
  if (!html) return [];
  let $;
  try {
    $ = loadFragment(html);
  } catch (e) {
    issues.push({ kind: 'html_parse_failed', ...ctx, message: e.message });
    return [];
  }
  const BLOCK = new Set(['div', 'p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);
  let out = '';
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.type === 'text') {
        out += n.data;
      } else if (n.type === 'tag') {
        const tag = n.tagName.toLowerCase();
        if (cfg.DROP_SUBTREE_TAGS.has(tag)) continue;
        if (tag === 'br') { out += '\n'; continue; }
        const block = BLOCK.has(tag);
        if (block) out += '\n';
        walk(n.children || []);
        if (block) out += '\n';
      }
    }
  };
  // .contents() not .children() — the latter drops text nodes, which silently
  // ate every question stem that sat before the first <div>.
  walk($.root().contents().toArray());

  return out
    .replace(/ /g, ' ')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// ── Cloze ─────────────────────────────────────────────────────────────────────

// Mirrors Anki's own cloze regex: non-greedy body, first "::" separates the
// answer from an optional hint. [\s\S] so embedded newlines are matched.
const CLOZE_RE = /\{\{c(\d+)::([\s\S]*?)\}\}/g;
// Any cloze *opening* — used to detect unterminated markup.
const CLOZE_OPEN_RE = /\{\{c\d+::/g;

function splitClozeBody(body) {
  const i = body.indexOf('::');
  if (i === -1) return { answer: body, hint: null };
  return { answer: body.slice(0, i), hint: body.slice(i + 2) };
}

/** Every distinct ordinal in a Text field, ascending. Handles non-contiguous ordinals. */
function clozeOrdinals(text) {
  const set = new Set();
  for (const m of String(text).matchAll(CLOZE_RE)) set.add(Number(m[1]));
  return [...set].sort((a, b) => a - b);
}

/**
 * Render one cloze card.
 *   target === null -> the answer side: every cloze revealed.
 *   target === N    -> the question side: ordinal N blanked (hint if present),
 *                      every other ordinal revealed, matching Anki behaviour.
 * Repeated identical ordinals resolve together because every match is visited.
 */
function renderCloze(text, target) {
  return String(text).replace(CLOZE_RE, (_full, ordStr, body) => {
    const { answer, hint } = splitClozeBody(body);
    if (target !== null && Number(ordStr) === target) return cfg.clozeBlank(hint);
    return answer;
  });
}

/** Structural problems worth surfacing before a live import. */
function inspectCloze(text, issues, ctx) {
  const raw = String(text);
  const opens = (raw.match(CLOZE_OPEN_RE) || []).length;
  const closed = [...raw.matchAll(CLOZE_RE)].length;
  if (opens !== closed) {
    issues.push({ kind: 'cloze_unterminated', ...ctx, opens, closed, sample: raw.slice(0, 300) });
  }
  for (const m of raw.matchAll(CLOZE_RE)) {
    const ord = Number(m[1]);
    const { answer, hint } = splitClozeBody(m[2]);
    if (ord === 0) issues.push({ kind: 'cloze_ordinal_zero', ...ctx, sample: m[0].slice(0, 200) });
    if (!answer.replace(/<[^>]*>/g, '').trim()) {
      issues.push({ kind: 'cloze_empty_answer', ...ctx, sample: m[0].slice(0, 200) });
    }
    if (hint !== null && hint.includes('::')) {
      issues.push({ kind: 'cloze_hint_contains_separator', ...ctx, sample: m[0].slice(0, 200) });
    }
  }
}

// ── MCQ (Basic-a40be) ─────────────────────────────────────────────────────────

// UPPERCASE only. This deck consistently uses "A)" for answer options and
// lowercase "a)" for sub-questions of a multi-part prompt — matching both
// turned every multi-part card into a bogus 2-option MCQ.
const OPTION_RE = /^\(?([A-H])\s*[).:\]]\s*(.+)$/;
const SUBQUESTION_RE = /^\(?([a-h])\s*[).:\]]\s*(.+)$/;
const NUMERIC_OPTION_RE = /^\(?(\d{1,2})\s*[).:\]]\s*(.+)$/;
// "Answers are B and D." — a genuine select-multiple prompt. One correct letter
// cannot represent it, so it is reported rather than silently truncated.
const MULTI_ANSWER_RE = /answers?\s+are\s+\(?([A-H])\)?\s*(?:,|and|&)\s*\(?([A-H])\)?/i;
const ANSWER_RE = /(?:the\s+)?(?:correct\s+)?answers?\s*(?:is|=|:)?\s*[:\-]?\s*\(?([A-Ha-h])\)?(?![A-Za-z0-9])/i;
const BARE_LETTER_RE = /^\(?([A-Ha-h])\)?\s*[).:\-]/;
// "A is correct." / "B is the correct answer" — an explicit letter statement,
// just phrased letter-first. Still a stated letter, not an inference.
const LETTER_IS_CORRECT_RE = /^\(?([A-Ha-h])\)?\s+(?:is\s+)?(?:the\s+)?correct\b/i;

/**
 * Parse a Basic-a40be note into stem + lettered options + correct letter.
 * Returns { ok: true, ... } or { ok: false, reason, detail } — never guesses.
 */
function parseMcq(frontHtml, backHtml, issues, ctx) {
  const frontLines = htmlToLines(frontHtml, issues, ctx);
  const backLines = htmlToLines(backHtml, issues, ctx);

  if (!frontLines.length) return { ok: false, reason: 'empty_front' };

  const options = [];
  let firstOptionIdx = -1;
  for (let i = 0; i < frontLines.length; i++) {
    const m = frontLines[i].match(OPTION_RE);
    if (!m) continue;
    if (firstOptionIdx === -1) firstOptionIdx = i;
    options.push({ letter: m[1].toUpperCase(), text: m[2].trim() });
  }

  if (options.length < 2) {
    // Distinguish the fixable patterns from genuinely-not-an-MCQ so the report
    // shows actionable categories rather than one unclassifiable blob.
    const numeric = frontLines.filter((l) => NUMERIC_OPTION_RE.test(l)).length;
    const subq = frontLines.filter((l) => SUBQUESTION_RE.test(l)).length;
    let reason = 'no_options_found';
    if (subq >= 2) reason = 'multipart_question_not_mcq';
    else if (numeric >= 2) reason = 'numeric_options_not_lettered';
    return {
      ok: false,
      reason,
      detail: { optionsFound: options.length, numericLines: numeric, subQuestionLines: subq },
    };
  }

  // Duplicate letters mean our line detection latched onto prose, not options.
  const letters = options.map((o) => o.letter);
  if (new Set(letters).size !== letters.length) {
    return { ok: false, reason: 'duplicate_option_letters', detail: { letters } };
  }

  const stem = frontLines.slice(0, firstOptionIdx).join(' ').trim();
  if (!stem) return { ok: false, reason: 'no_stem_before_options', detail: { letters } };

  const backText = backLines.join('\n');
  let correct = null;
  const m = backText.match(ANSWER_RE);
  if (m) correct = m[1].toUpperCase();
  if (!correct && backLines.length) {
    const bare = backLines[0].match(BARE_LETTER_RE);
    if (bare) correct = bare[1].toUpperCase();
  }
  if (!correct && backLines.length) {
    const li = backLines[0].match(LETTER_IS_CORRECT_RE);
    if (li) correct = li[1].toUpperCase();
  }
  if (!correct) {
    const multi = backText.match(MULTI_ANSWER_RE);
    if (multi) {
      return { ok: false, reason: 'multi_answer_not_supported', detail: { letters, stated: [multi[1], multi[2]] } };
    }
    return { ok: false, reason: 'no_answer_letter_in_back', detail: { letters } };
  }
  if (!letters.includes(correct)) {
    return { ok: false, reason: 'answer_letter_not_among_options', detail: { correct, letters } };
  }

  return { ok: true, stem, options, correct };
}

// ── Media ─────────────────────────────────────────────────────────────────────

const SOUND_RE = /\[sound:([^\]]+)\]/gi;

/** Normalise a raw src/[sound:] target to a bare filename for disk lookup. */
function normalizeMediaRef(raw) {
  let s = String(raw).trim();
  const wasLocalServer = cfg.LOCAL_MEDIA_SERVER_RE.test(s);
  s = s.replace(cfg.LOCAL_MEDIA_SERVER_RE, '');
  const isRemote = /^(https?:)?\/\//i.test(s) || /^data:/i.test(s);
  s = s.split(/[?#]/)[0];
  const base = s.split(/[/\\]/).pop() || '';
  let decoded = base;
  try {
    decoded = decodeURIComponent(base);
  } catch (_) {
    /* leave as-is: a stray % that isn't an escape */
  }
  return { filename: decoded, wasLocalServer, isRemote };
}

/** Collect every media reference in a raw field. Uses the parser for <img>. */
function extractMedia(html, issues, ctx) {
  const refs = [];
  if (!html) return refs;
  let $;
  try {
    $ = loadFragment(html);
  } catch (e) {
    issues.push({ kind: 'html_parse_failed', ...ctx, message: e.message });
    return refs;
  }
  for (const el of $('img').toArray()) {
    const src = (el.attribs || {}).src;
    if (!src) {
      issues.push({ kind: 'img_without_src', ...ctx, sample: $.html(el).slice(0, 200) });
      continue;
    }
    refs.push({ type: 'image', raw: src, ...normalizeMediaRef(src) });
  }
  for (const m of String(html).matchAll(SOUND_RE)) {
    refs.push({ type: 'audio', raw: m[1], ...normalizeMediaRef(m[1]) });
  }
  return refs;
}

// ── Tags ──────────────────────────────────────────────────────────────────────

function splitTags(tagString) {
  return String(tagString || '').trim().split(/\s+/).filter(Boolean);
}

/** Drop contributor-provenance markers wherever they appear as a tag segment. */
function stripProvenance(tag) {
  const kept = tag.split('::').filter((seg) => !cfg.PROVENANCE_SEGMENTS.has(seg));
  return kept.join('::');
}

module.exports = {
  sanitizeHtml,
  htmlToLines,
  clozeOrdinals,
  renderCloze,
  inspectCloze,
  splitClozeBody,
  parseMcq,
  extractMedia,
  normalizeMediaRef,
  splitTags,
  stripProvenance,
  CLOZE_RE,
};
