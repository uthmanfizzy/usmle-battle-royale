import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const pointerDownRef = useRef(false);
  const settleRef = useRef(null);
  const rafRef = useRef(0);
  const barRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Measure the bar whenever it (re)appears or its contents change (the ✕
  // remove button comes and goes), so placement uses its real width/height.
  const hasPopup = !!popup;
  const overlaps = !!popup?.overlaps;
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) { if (size.w) setSize({ w: 0, h: 0 }); return; }
    const r = el.getBoundingClientRect();
    if (Math.round(r.width) !== size.w || Math.round(r.height) !== size.h) {
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    }
  }, [hasPopup, overlaps, allowFormat, size.w, size.h]);

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
      yBottom: rect.bottom, // used when there is no room above (see render)
    };
  }, [containerRef, highlights, rejectSelector]);

  useEffect(() => {
    const show = () => setPopup(computeFromSelection());
    const inToolbar = (e) => !!(e.target?.closest && e.target.closest('.expl-hl-toolbar'));

    // Pointer events rather than mouse events: on a phone a tap produces no
    // mousedown/mouseup at all in some browsers, so the mouse-only listeners
    // this used to have meant the toolbar simply never appeared on mobile.
    function onPointerDown(e) {
      if (inToolbar(e)) return;
      pointerDownRef.current = true;
      setPopup(null); // a new selection/tap elsewhere dismisses the toolbar
    }
    function onPointerUp(e) {
      pointerDownRef.current = false;
      if (inToolbar(e)) return;
      setTimeout(show, 0); // let the selection settle before measuring
    }

    // The other half of the mobile fix. Touch selections are made with the OS's
    // own drag handles, which are not page content — dragging them fires NO
    // pointerup on the document, so waiting for one leaves the toolbar hidden
    // forever. Showing it once the selection stops changing is the only signal
    // that survives. Suppressed while a pointer is down so a desktop click-drag
    // doesn't pop the toolbar up mid-sweep; onPointerUp covers that case.
    function onSelectionChange() {
      clearTimeout(settleRef.current);
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setPopup(null); return; }
      settleRef.current = setTimeout(() => {
        if (!pointerDownRef.current) show();
      }, 250);
    }

    // Follow the selection instead of dismissing. Dismissing was fine on
    // desktop but bad on mobile, where selecting text often nudges the page:
    // the toolbar vanished and could never come back, because an unchanged
    // selection fires no further selectionchange.
    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(show);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      clearTimeout(settleRef.current);
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('selectionchange', onSelectionChange);
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

  // Placed directly UNDER the selection, on every device (it used to float above
  // on desktop and dock to the bottom of the screen on touch, which put it far
  // from the text being highlighted). Below also keeps clear of the OS's own
  // Copy / Look Up callout, which phones put above a selection.
  //
  // The bar's real size is measured after it mounts (size state), so it can be
  // kept fully on screen horizontally, and flipped above the selection only when
  // there isn't room for it below.
  const coarse = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
  // Touch selections have drag handles hanging under the last line; leave room
  // so the bar isn't sitting on top of them. Either way it drops well clear of
  // the next line or two, so the sentence right under the selection can still
  // be selected without the bar in the way.
  const GAP = coarse ? 64 : 52;
  const EDGE = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const w = size.w || 0;
  const h = size.h || 0;
  let left = popup.x - w / 2;
  if (vw && w) left = Math.min(Math.max(left, EDGE), Math.max(EDGE, vw - EDGE - w));
  let top = popup.yBottom + GAP;
  if (vh && h && top + h > vh - EDGE) {
    const above = popup.y - GAP - h;
    top = above >= EDGE ? above : Math.max(EDGE, vh - EDGE - h);
  }
  // Until measured, render invisibly at the target so the measurement is real.
  const style = { left, top, visibility: w ? 'visible' : 'hidden' };

  // PORTALLED TO <body>. The toolbar is position:fixed, and a fixed element is
  // positioned against the nearest ancestor carrying a transform, filter,
  // backdrop-filter or perspective — not the viewport. In the play screen it
  // renders inside .round-result, which runs an animation on `transform`, under
  // ancestors that use backdrop-filter. So "fixed to the bottom of the screen"
  // was resolving to the bottom of that tall panel: on a phone the colour bar
  // appeared far down the page instead of on screen.
  //
  // Rendering into <body> puts it outside every one of those containing blocks,
  // and keeps it correct against any future CSS on the play screen.
  return createPortal(
    <div
      ref={barRef}
      className="expl-hl-toolbar"
      style={style}
      // pointerdown, not mousedown: on touch this is what stops the tap from
      // collapsing the selection (and unmounting the toolbar) before the click
      // lands. Preventing pointerdown still leaves click to fire, so onClick
      // below — and keyboard activation — keep working.
      onPointerDown={(e) => e.preventDefault()}
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
    </div>,
    document.body
  );
}
