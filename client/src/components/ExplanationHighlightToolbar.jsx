import { useState, useEffect, useCallback } from 'react';
import { rangeToOffsets, captureContext, HIGHLIGHT_COLORS } from '../utils/explanationHighlights';

// Swatch backgrounds (the 4 offered colours). Kept readable on both themes via CSS
// (.hl marks force dark text on the bright highlight).
const SWATCH = { yellow: '#fdcb6e', green: '#55efc4', pink: '#fd79a8', blue: '#74b9ff' };

/**
 * Floating colour toolbar shown on a text selection WITHIN the explanation.
 * Selections that bleed into options / why-wrong / stem are rejected by
 * rangeToOffsets (container.contains check). Picking a colour captures the
 * visible-text offsets + drift context and calls onCreate. If the selection
 * overlaps an existing highlight, a remove (✕) action is also shown.
 */
export default function ExplanationHighlightToolbar({ containerRef, highlights, onCreate, onRemoveRange, allowFormat = false, rejectSelector = null }) {
  const [popup, setPopup] = useState(null);

  const computeFromSelection = useCallback(() => {
    const container = containerRef?.current;
    if (!container || typeof window === 'undefined') return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const offsets = rangeToOffsets(container, range);
    if (!offsets) return null; // collapsed or bleeding outside the container
    // v1 stem authoring: reject selections that touch a lab box / table (prose-only).
    if (rejectSelector) {
      const blocks = container.querySelectorAll(rejectSelector);
      for (const el of blocks) { if (range.intersectsNode(el)) return null; }
    }
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    const overlaps = (highlights || []).some((h) => h.start < offsets.end && h.end > offsets.start);
    return {
      start: offsets.start,
      end: offsets.end,
      overlaps,
      x: rect.left + rect.width / 2,
      y: rect.top,
    };
  }, [containerRef, highlights, rejectSelector]);

  useEffect(() => {
    function onMouseUp(e) {
      if (e.target.closest && e.target.closest('.expl-hl-toolbar')) return;
      // let the selection settle before measuring
      setTimeout(() => setPopup(computeFromSelection()), 0);
    }
    function onSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setPopup(null);
    }
    function onScroll() {
      setPopup(null);
    }
    function onDocMouseDown(e) {
      if (e.target.closest && e.target.closest('.expl-hl-toolbar')) return;
      setPopup(null); // a new selection/click elsewhere dismisses the toolbar
    }
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [computeFromSelection]);

  const pick = (color) => {
    const container = containerRef?.current;
    if (!container || !popup) return;
    const visible = container.textContent || ''; // === toVisibleText (invariant)
    const ctx = captureContext(visible, popup.start, popup.end, 30);
    onCreate({ start: popup.start, end: popup.end, color, ...ctx });
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  };

  const pickFormat = (format) => {
    const container = containerRef?.current;
    if (!container || !popup) return;
    const visible = container.textContent || '';
    const ctx = captureContext(visible, popup.start, popup.end, 30);
    onCreate({ start: popup.start, end: popup.end, format, ...ctx });
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  };

  const removeOverlap = () => {
    if (!popup) return;
    onRemoveRange(popup.start, popup.end);
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  };

  if (!popup) return null;
  return (
    <div
      className="expl-hl-toolbar"
      style={{ left: popup.x, top: popup.y }}
      onMouseDown={(e) => e.preventDefault()} // keep the selection alive while clicking
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className="expl-hl-swatch"
          title={`Highlight ${c}`}
          style={{ background: SWATCH[c] }}
          onClick={() => pick(c)}
        />
      ))}
      {allowFormat && (
        <>
          <span className="expl-hl-divider" />
          <button type="button" className="expl-hl-fmt" title="Bold (official)" onClick={() => pickFormat('bold')}>
            <strong>B</strong>
          </button>
          <button type="button" className="expl-hl-fmt" title="Italic (official)" onClick={() => pickFormat('italic')}>
            <em>I</em>
          </button>
        </>
      )}
      {popup.overlaps && (
        <button type="button" className="expl-hl-remove" title="Remove highlight" onClick={removeOverlap}>
          ✕
        </button>
      )}
    </div>
  );
}
