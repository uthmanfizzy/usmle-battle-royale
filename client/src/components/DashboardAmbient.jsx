import { useMemo } from 'react';
import './DashboardAmbient.css';

// Purely decorative atmosphere behind the dashboard content. No data, no
// interaction — see DashboardAmbient.css for why the layers are structured
// this way (transform/opacity only, isolated compositing layer).

const EMBER_COUNT = 18;

export default function DashboardAmbient() {
  // Positions/timings are randomised once per mount so the field doesn't look
  // like a grid, then frozen — re-rolling on every render would restart the
  // animations and produce visible flicker.
  const embers = useMemo(
    () => Array.from({ length: EMBER_COUNT }, (_, i) => ({
      left: `${(i * 100) / EMBER_COUNT + Math.random() * 4}%`,
      size: 2 + Math.random() * 2,
      duration: 8 + Math.random() * 7,
      delay: Math.random() * 12,
      red: i % 3 === 0,
    })),
    []
  );

  return (
    <div className="dash-ambient" aria-hidden="true">
      <div className="dash-amb-blob dash-amb-blob--1" />
      <div className="dash-amb-blob dash-amb-blob--2" />
      <div className="dash-amb-blob dash-amb-blob--3" />
      <div className="dash-amb-blob dash-amb-blob--4" />

      <svg className="dash-amb-rune" viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="190" stroke="#e8b04b" strokeWidth="1" />
        <circle cx="200" cy="200" r="164" stroke="#e8b04b" strokeWidth="0.5" strokeDasharray="6 10" />
        <circle cx="200" cy="200" r="120" stroke="#7ad678" strokeWidth="1" />
        <circle cx="200" cy="200" r="84" stroke="#e8b04b" strokeWidth="0.5" strokeDasharray="3 7" />
        {/* Two offset triangles = the mockup's six-point rune star */}
        <path d="M200 40 L338 280 L62 280 Z" stroke="#e8b04b" strokeWidth="1" />
        <path d="M200 360 L62 120 L338 120 Z" stroke="#c1291e" strokeWidth="1" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI * 2) / 12;
          return (
            <line
              key={i}
              x1={200 + Math.cos(a) * 164}
              y1={200 + Math.sin(a) * 164}
              x2={200 + Math.cos(a) * 190}
              y2={200 + Math.sin(a) * 190}
              stroke="#e8b04b"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {embers.map((e, i) => (
        <span
          key={i}
          className={`dash-amb-ember${e.red ? ' dash-amb-ember--red' : ''}`}
          style={{
            left: e.left,
            width: `${e.size}px`,
            height: `${e.size}px`,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
          }}
        />
      ))}

      <div className="dash-amb-fog dash-amb-fog--1" />
      <div className="dash-amb-fog dash-amb-fog--2" />
    </div>
  );
}
