import { useLayoutEffect, useRef } from 'react';

/*
 * Reset the gameplay view to the top whenever a new question appears.
 *
 * Why this isn't just window.scrollTo: App.css sets
 * `html, body, #root { height: 100%; overflow: auto }`, so #root is the real
 * scroll container and window.scrollY is always 0 — window.scrollTo() is a
 * no-op here. On top of that, some screens scroll their own box instead
 * (.trivia-screen has its own overflow-y: auto), so there is no single element
 * that is always "the" scroller.
 *
 * So we walk UP from the gameplay element and reset every scrollable ancestor.
 * Walking up rather than scanning the document means we only ever touch
 * containers the question actually sits inside — a scrolled sibling panel like
 * .players-sidebar keeps its position.
 */

function isScrollable(el) {
  if (!el || el.nodeType !== 1) return false;
  const oy = getComputedStyle(el).overflowY;
  return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight;
}

/**
 * @param {string|number|null|undefined} key
 *   The question identity (question.id, or an index where that's all there is).
 *   The reset fires only when this value changes — not on answer selection,
 *   timer ticks, or any other re-render.
 * @returns a ref to attach to the element wrapping the question.
 *
 * IMPORTANT: attach the ref to the element that actually scrolls, or to a
 * descendant of it. This walks UPWARD only, so a ref placed on a screen root
 * whose stem scrolls in some inner box (PvpDuelGame's .pvd-modal is exactly
 * this) will silently do nothing. Each of the five gameplay screens was
 * checked against its real scroll container rather than assumed.
 */
export function useScrollToTopOnChange(key) {
  const ref = useRef(null);

  // useLayoutEffect, not useEffect: this runs before paint, so the new question
  // is never briefly visible at the old scroll offset.
  useLayoutEffect(() => {
    if (key === null || key === undefined) return;

    for (let el = ref.current; el; el = el.parentElement) {
      if (isScrollable(el)) el.scrollTop = 0;
    }

    // Baseline for screens whose ref isn't mounted on this branch, and for the
    // document scroller when the page is short enough that #root isn't scrolling.
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  }, [key]);

  return ref;
}
