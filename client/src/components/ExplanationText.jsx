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
              {runs.map((run, ri) => renderRun(run, `${bi}-${li}-${ri}`, segments))}
              {li < block.lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

// Render a single run, splitting it where highlight segments cross it.
function renderRun(run, runKey, segments) {
  const pieces = sliceRun(run, segments);
  return pieces.map((piece, pi) => {
    const inner = formatPiece(piece.text, run);
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

// Wrap a text piece in its run's formatting (color outermost so the highlight mark
// background sits behind the coloured text).
function formatPiece(text, run) {
  let node = text;
  if (run.underline) node = <u>{node}</u>;
  if (run.italic) node = <em>{node}</em>;
  if (run.bold) node = <strong style={{ fontWeight: 700 }}>{node}</strong>;
  if (run.color && COLORS[run.color]) node = <span style={{ color: COLORS[run.color] }}>{node}</span>;
  return node;
}
