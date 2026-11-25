/**
 * Mehlman Rapid Fire's animated backdrop: a receding neon grid, speed streaks,
 * drifting sparks and lightning that cracks across the sky now and then.
 *
 * Purely decorative — fixed behind the page, inert to pointers, hidden from
 * assistive tech. Everything animates transform/opacity only, and all of it
 * stops under prefers-reduced-motion (see RapidFire.css).
 *
 * `variant="game"` is the quieter version for the question screen, where the
 * text has to stay the loudest thing on screen.
 */

// Fixed positions rather than Math.random() so a re-render never reshuffles
// the scene under the player.
const STREAKS = [
  { top: '12%', delay: '0s',   dur: '2.6s', w: '22vw' },
  { top: '27%', delay: '1.1s', dur: '3.1s', w: '14vw' },
  { top: '41%', delay: '2.3s', dur: '2.2s', w: '30vw' },
  { top: '58%', delay: '0.6s', dur: '3.4s', w: '18vw' },
  { top: '73%', delay: '1.8s', dur: '2.8s', w: '25vw' },
  { top: '86%', delay: '2.9s', dur: '2.4s', w: '12vw' },
];

const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  delay: `${((i * 0.73) % 7).toFixed(2)}s`,
  dur: `${6 + ((i * 1.7) % 6)}s`,
  size: `${2 + (i % 3)}px`,
}));

// Two jagged bolts; each flashes on its own long cycle.
const BOLTS = [
  { cls: 'rf-bolt--a', d: 'M60 0 L38 70 L62 74 L30 160 L52 164 L18 260' },
  { cls: 'rf-bolt--b', d: 'M40 0 L58 62 L36 68 L66 150 L42 156 L72 250' },
];

export default function RapidFireDecor({ variant = 'page' }) {
  return (
    <div className={`rf-decor rf-decor--${variant}`} aria-hidden="true">
      <div className="rf-sky" />
      <div className="rf-flash" />
      {BOLTS.map(b => (
        <svg key={b.cls} className={`rf-bolt ${b.cls}`} viewBox="0 0 90 270" preserveAspectRatio="none">
          <path d={b.d} className="rf-bolt-glow" />
          <path d={b.d} className="rf-bolt-core" />
        </svg>
      ))}
      <div className="rf-grid-wrap"><div className="rf-grid" /></div>
      {STREAKS.map((s, i) => (
        <span
          key={i}
          className="rf-streak"
          style={{ top: s.top, width: s.w, animationDelay: s.delay, animationDuration: s.dur }}
        />
      ))}
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="rf-spark"
          style={{ left: s.left, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur }}
        />
      ))}
    </div>
  );
}
