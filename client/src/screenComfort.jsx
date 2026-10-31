import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Night-time comfort: a dimmer and a blue-light filter, laid over the whole
 * app.
 *
 * Both are ONE fixed, click-through layer rather than a filter on the page:
 * `filter` on a root element creates a containing block, which would re-anchor
 * every position:fixed thing in the app — the exam header, the dock, every
 * modal — and quietly break layouts that have nothing to do with brightness.
 * A layer on top changes only what reaches the eye.
 *
 * PER DEVICE, not per account. How dark a screen should be is a fact about the
 * room you are sitting in, not about you: a phone in bed and a laptop at a
 * desk want different answers, and syncing them would make each one wrong half
 * the time. Stored in localStorage, read before first paint.
 *
 * The dimmer is capped below total black on purpose — a slider that can reach
 * "cannot see the slider" is a trap, and the way out would be clearing site
 * data.
 */
const DIM_KEY = 'mr_screen_dim';
const WARM_KEY = 'mr_screen_warm';

// Strengths are 0–100 in storage and in the UI. What they become on screen:
export const MAX_DIM_ALPHA = 0.72;   // never fully black — see above
export const MAX_WARM_ALPHA = 0.42;  // past this, white text starts to tint
// The filter's colour. Amber rather than pure orange: blue light is what is
// being cut, and this leaves greens and reds close to where they were.
const WARM_RGB = '255, 150, 40';

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

const read = (key) => {
  try { return clamp(localStorage.getItem(key)); } catch { return 0; }
};

// One store, so the overlay and every control that sets it agree without
// prop-drilling through the whole app.
let state = { dim: read(DIM_KEY), warm: read(WARM_KEY) };
const listeners = new Set();

function emit() { for (const fn of listeners) fn(state); }

export function getScreenComfort() { return state; }

export function setScreenComfort(next) {
  state = {
    dim: clamp(next.dim ?? state.dim),
    warm: clamp(next.warm ?? state.warm),
  };
  try {
    localStorage.setItem(DIM_KEY, String(state.dim));
    localStorage.setItem(WARM_KEY, String(state.warm));
  } catch { /* private mode — the setting still applies for this session */ }
  emit();
}

export function useScreenComfort() {
  const [value, setValue] = useState(state);
  useEffect(() => {
    const fn = (s) => setValue(s);
    listeners.add(fn);
    // Another tab may have changed it since this component mounted.
    fn(state);
    return () => listeners.delete(fn);
  }, []);
  return {
    dim: value.dim,
    warm: value.warm,
    setDim: (v) => setScreenComfort({ dim: v }),
    setWarm: (v) => setScreenComfort({ warm: v }),
  };
}

/**
 * The layer itself. Mounted once, at the root.
 *
 * Portalled to <body> and given the top of the z-index range so it covers
 * modals and the exam skin's own fixed bars too — a dimmer that stops at the
 * edge of a dialog is worse than none, because the bright thing is then the
 * thing you are looking at.
 */
export default function ScreenComfortOverlay() {
  const { dim, warm } = useScreenComfort();
  if (!dim && !warm) return null;   // nothing in the tree at all when it is off

  const dimA = (dim / 100) * MAX_DIM_ALPHA;
  const warmA = (warm / 100) * MAX_WARM_ALPHA;

  return createPortal(
    <div
      aria-hidden="true"
      data-screen-comfort="on"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
        // Two washes in one layer: the warm one over the dark one, which is
        // the order they would sit in physically — a filter in front of a
        // screen turned down.
        backgroundColor: `rgba(0, 0, 0, ${dimA})`,
        backgroundImage: warmA
          ? `linear-gradient(rgba(${WARM_RGB}, ${warmA}), rgba(${WARM_RGB}, ${warmA}))`
          : 'none',
      }}
    />,
    document.body,
  );
}
