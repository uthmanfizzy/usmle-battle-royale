import React from 'react';
import { parseExplanation, offsetsToSegments, sliceRun, COLORS } from '../utils/explanationHighlights';

/**
 * Offset-aware explanation renderer.
 *
 * Renders explanation text with rich formatting (**bold**, *italic*, __underline__,
 * [color]text[/color], line breaks) AND highlight <mark>s — both driven by the SAME
 * parse (parseExplanation) that toVisibleText uses, so highlight offsets always line
 * up with what's shown (the anchoring invariant). Marks are REACT nodes, never direct
 * DOM mutation, so there's no reconciliation war and reload is stable.
 *
 * @param {string}   text         raw explanation string
 * @param {Array}    highlights   resolved highlights [{ start, end, color, created_at }]
 * @param {Function} containerRef ref attached to .explanation-text (for selection capture)
 */
export default function ExplanationText({ text, className = '', highlights = [], containerRef }) {
  if (!text) return null;

  const blocks = parseExplanation(text);
  // Visible length only matters for clamping inside offsetsToSegments; the last run's
  // end IS the visible length (cheap, avoids rebuilding the whole string here).
  let visibleLen = 0;
  for (const b of blocks) for (const line of b.lines) for (const run of line) visibleLen = run.end;
  const segments = offsetsToSegments({ length: visibleLen }, highlights);

  return (
    <div className={`explanation-text explanation-rich ${className}`} ref={containerRef}>
      {blocks.map((block, bi) => (
        <p key={bi} className="explanation-sentence">
          {block.lines.map((runs, li) => (
            <React.Fragment key={li}>
              {splitLineIntoSentences(runs).map((group, si) => (
                <span key={si} className="explanation-line">
                  {group.map((run, ri) => renderRun(run, `${bi}-${li}-${si}-${ri}`, segments))}
                </span>
              ))}
              {li < block.lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

/**
 * Group a line's runs into one array per sentence, so each can be put on its
 * own line.
 *
 * WRAPPING ONLY — not a text transform. The cut lands AFTER the punctuation
 * and the whitespace following it, so every character stays exactly where it
 * was and the rendered textContent is byte-identical. That matters: highlight
 * offsets are anchored against that string, and an added or dropped space
 * would shift every highlight after it. (This is the trap the old
 * sentence-splitting parser fell into — it trimmed, silently eating the space.)
 *
 * A run can straddle a boundary ("...done. Next..." inside one bold span), so
 * runs are sliced, carrying their offsets with them.
 */
function splitLineIntoSentences(runs) {
  if (!runs || runs.length === 0) return [runs || []];
  const text = runs.map((r) => r.text).join('');
  // End punctuation, any closing quote/bracket, then the whitespace after it.
  const boundary = /[.!?]["')\]]*\s+/g;
  const cuts = new Set();
  let m;
  while ((m = boundary.exec(text)) !== null) cuts.add(m.index + m[0].length);
  if (cuts.size === 0) return [runs];

  const slice = (run, a, b) => ({
    ...run,
    text: run.text.slice(a, b),
    start: run.start + a,
    end: run.start + b,
  });

  const groups = [];
  let current = [];
  let pos = 0;
  for (const run of runs) {
    let local = 0;
    for (let i = 1; i <= run.text.length; i++) {
      if (!cuts.has(pos + i)) continue;
      current.push(slice(run, local, i));
      groups.push(current);
      current = [];
      local = i;
    }
    if (local < run.text.length) current.push(slice(run, local, run.text.length));
    pos += run.text.length;
  }
  if (current.length) groups.push(current);
  return groups;
}

// Render a single run, splitting it where highlight segments cross it.
function renderRun(run, runKey, segments) {
  const pieces = sliceRun(run, segments);
  return pieces.map((piece, pi) => {
    const inner = formatPiece(piece, run);
    const key = `${runKey}-${pi}`;
    if (piece.color) {
      return (
        <mark key={key} className={`hl hl-${piece.color}`}>
          {inner}
        </mark>
      );
    }
    return <React.Fragment key={key}>{inner}</React.Fragment>;
  });
}

// Wrap a text piece in its formatting. Bold/italic come from EITHER the authored
// markup (run.bold/italic) OR a saved format span (piece.bold/italic) — OR-ed so the
// two coexist. Colour outermost so the highlight mark sits behind the coloured text.
function formatPiece(piece, run) {
  let node = piece.text;
  const bold = run.bold || piece.bold;
  const italic = run.italic || piece.italic;
  if (run.underline) node = <u>{node}</u>;
  if (italic) node = <em>{node}</em>;
  if (bold) node = <strong style={{ fontWeight: 700 }}>{node}</strong>;
  if (run.color && COLORS[run.color]) node = <span style={{ color: COLORS[run.color] }}>{node}</span>;
  return node;
}
