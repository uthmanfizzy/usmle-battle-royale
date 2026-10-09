import { useEffect, useRef } from 'react';
import './FallingShaft.css';

/**
 * An endless fall down a lit industrial shaft.
 *
 * Used twice, and deliberately the same component both times: the Medathon
 * opening ends by falling into it, and the race itself is played over it. The
 * two are separate mounts, so their loops are not in step — but every layer is
 * a fresh one at the same cycle, so the crossfade between them reads as one
 * continuous descent.
 *
 * HOW THE FALL IS BUILT: every layer travels the same straight line towards
 * the camera, in a perspective box, at a LINEAR rate. That is what makes it a
 * fall rather than a zoom — constant speed through space becomes accelerating
 * growth on screen, because perspective does that for you. Layers are spaced
 * evenly along the line by negative animation delays, so the shaft is already
 * full on the first frame instead of building up from nothing.
 *
 * A storey is four walls around an open middle, not a filled plane — that is
 * what makes it architecture rather than a field of sparks. You see straight
 * down the shaft past every storey below, their inner edges stacking into the
 * lines that run to the vanishing point. The windows are three offset dot
 * grids on each wall, and they grow with it.
 *
 * Nothing here paints per frame: transform and opacity only, which is the
 * whole budget a twenty-minute match can afford.
 */
export default function FallingShaft({ layers = 9, seconds = 7.5, className = '' }) {
  const ref = useRef(null);

  // A race runs for a long time, and nobody needs a shaft animating in a tab
  // they are not looking at.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const sync = () => el.classList.toggle('is-held', document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const steps = Array.from({ length: layers }, (_, i) => i);

  return (
    <div className={`fs ${className}`} ref={ref} aria-hidden="true">
      <div className="fs-deep">
        {/* The bottom of the shaft, far below and still lit. */}
        <span className="fs-core" />

        {steps.map(i => (
          <span
            key={i}
            className={`fs-layer fs-layer--${i % 4}`}
            style={{
              animationDuration: `${seconds}s`,
              // Negative, so this layer is already part-way down the shaft.
              animationDelay: `${-(i * seconds) / layers}s`,
            }}
          >
            <i className="fs-w fs-w--t" />
            <i className="fs-w fs-w--b" />
            <i className="fs-w fs-w--l" />
            <i className="fs-w fs-w--r" />
          </span>
        ))}

        {/* Girders crossing the shaft, on the same journey but turned, so the
            fall is not a tidy repeat of one shape. */}
        {[0, 1, 2].map(i => (
          <span
            key={`b${i}`}
            className={`fs-beam fs-beam--${i}`}
            style={{
              animationDuration: `${seconds * 1.5}s`,
              animationDelay: `${-(i * seconds * 1.5) / 3}s`,
            }}
          />
        ))}
      </div>

      {/* Warm air, and the dark the lights have to read against. */}
      <span className="fs-haze" />
      <span className="fs-vig" />
    </div>
  );
}
