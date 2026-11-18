import { useEffect, useRef, useState } from 'react';
import { corners, edpvr, PHASES, V0_ES } from './pvEngine';

/**
 * The PV loop chart. Volume across, pressure up, every loop drawn from the
 * engine's points so a pathology and the normal it is compared against are
 * on exactly the same axes.
 */
export const V_MAX = 240;
export const P_MAX = 200;
const W = 560, H = 420, ML = 54, MR = 18, MT = 18, MB = 48;
export const sx = (v) => ML + (v / V_MAX) * (W - ML - MR);
export const sy = (p) => H - MB - (Math.min(p, P_MAX + 10) / P_MAX) * (H - MT - MB);

const path = (pts) => pts.map((q, i) => `${i ? 'L' : 'M'}${sx(q.v).toFixed(1)},${sy(q.p).toFixed(1)}`).join(' ') + ' Z';
const segPath = (pts, phase) => {
  const idx = pts.map((q, i) => (q.phase === phase ? i : -1)).filter(i => i >= 0);
  if (!idx.length) return '';
  const last = idx[idx.length - 1];
  const seg = idx.map(i => pts[i]).concat(pts[(last + 1) % pts.length]);
  return seg.map((q, i) => `${i ? 'L' : 'M'}${sx(q.v).toFixed(1)},${sy(q.p).toFixed(1)}`).join(' ');
};

export const PHASE_COLOURS = { ivc: '#ffb347', ej: '#ff5e7a', ivr: '#8f7bff', fill: '#3fd0c9' };
const CORNER_LABEL = { mc: 'Mitral closes', ao: 'Aortic opens', ac: 'Aortic closes', mo: 'Mitral opens' };

export default function PVChart({
  loops = [],              // [{ pts, color, dashed, label, fill }]
  dot = null,              // { v, p }
  highlight = null,        // phase id, on loops[0]
  phaseColours = false,    // colour each phase of loops[0]
  showCorners = false,     // valve-event markers on loops[0]
  cornerLabels = true,
  markCorner = null,       // one corner to ring (quiz)
  espvr = null,            // { ees }
  edpvrCurve = null,       // stiff params
  svBracket = null,        // { edv, esv }
  shadeArea = false,
  volTicks = null,         // [{ v, label }] dashed verticals with values
  compact = false,
  ariaLabel = 'Pressure–volume loop',
}) {
  const main = loops[0];
  const c = main && showCorners ? corners(main.pts) : null;
  const espvrEnd = espvr ? Math.min(V_MAX, V0_ES + (P_MAX + 10) / espvr.ees) : 0;
  const edCurve = edpvrCurve
    ? Array.from({ length: 60 }, (_, i) => {
      const v = 20 + (i / 59) * (V_MAX - 20);
      return { v, p: edpvr(v, edpvrCurve) };
    }).filter(q => q.p <= P_MAX + 5)
    : null;

  return (
    <svg className={`pvc${compact ? ' pvc--compact' : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {/* Grid */}
      {[0, 40, 80, 120, 160, 200].map(p => (
        <g key={`p${p}`}>
          <line x1={ML} x2={W - MR} y1={sy(p)} y2={sy(p)} className="pvc-grid" />
          {!compact && <text x={ML - 8} y={sy(p) + 4} className="pvc-tick" textAnchor="end">{p}</text>}
        </g>
      ))}
      {[0, 40, 80, 120, 160, 200, 240].map(v => (
        <g key={`v${v}`}>
          <line y1={MT} y2={H - MB} x1={sx(v)} x2={sx(v)} className="pvc-grid" />
          {!compact && <text x={sx(v)} y={H - MB + 18} className="pvc-tick" textAnchor="middle">{v}</text>}
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={sy(0)} y2={sy(0)} className="pvc-axis" />
      <line x1={ML} x2={ML} y1={MT} y2={sy(0)} className="pvc-axis" />
      {!compact && (
        <>
          <text x={(ML + W - MR) / 2} y={H - 8} className="pvc-axlabel" textAnchor="middle">LV volume (mL)</text>
          <text x={16} y={(MT + H - MB) / 2} className="pvc-axlabel" textAnchor="middle" transform={`rotate(-90 16 ${(MT + H - MB) / 2})`}>LV pressure (mmHg)</text>
        </>
      )}

      {/* Boundary curves */}
      {espvr && (
        <g className="pvc-espvr">
          <line x1={sx(V0_ES)} y1={sy(0)} x2={sx(espvrEnd)} y2={sy(espvr.ees * (espvrEnd - V0_ES))} />
          {!compact && <text x={sx(espvrEnd) - 6} y={sy(espvr.ees * (espvrEnd - V0_ES)) + 16} textAnchor="end">ESPVR</text>}
        </g>
      )}
      {edCurve && edCurve.length > 1 && (
        <g className="pvc-edpvr">
          <path d={edCurve.map((q, i) => `${i ? 'L' : 'M'}${sx(q.v)},${sy(q.p)}`).join(' ')} />
          {!compact && <text x={sx(edCurve[edCurve.length - 1].v) - 4} y={sy(edCurve[edCurve.length - 1].p) - 6} textAnchor="end">EDPVR</text>}
        </g>
      )}

      {volTicks && volTicks.map(t => (
        <g key={t.label} className="pvc-voltick">
          <line x1={sx(t.v)} x2={sx(t.v)} y1={MT} y2={sy(0)} />
          <text x={sx(t.v)} y={MT + 12} textAnchor="middle">{t.label}</text>
        </g>
      ))}

      {/* Loops — the comparison ones first so the main one sits on top */}
      {loops.slice().reverse().map((l, ri) => {
        const i = loops.length - 1 - ri;
        return (
          <g key={i} className="pvc-loop">
            {i === 0 && shadeArea && <path d={path(l.pts)} className="pvc-area" />}
            <path
              d={path(l.pts)}
              fill={l.fill || 'none'}
              stroke={l.color}
              strokeWidth={l.width || (i === 0 ? 3.2 : 2)}
              strokeDasharray={l.dashed ? '7 6' : undefined}
              strokeLinejoin="round"
              opacity={l.opacity ?? 1}
            />
          </g>
        );
      })}

      {main && phaseColours && Object.keys(PHASES).map(ph => (
        <path key={ph} d={segPath(main.pts, ph)} stroke={PHASE_COLOURS[ph]} strokeWidth="4" fill="none" strokeLinecap="round" />
      ))}
      {main && highlight && (
        <path d={segPath(main.pts, highlight)} className="pvc-highlight" stroke={PHASE_COLOURS[highlight]} />
      )}

      {svBracket && (
        <g className="pvc-sv">
          <line x1={sx(svBracket.esv)} x2={sx(svBracket.edv)} y1={sy(-6) - 0} y2={sy(-6)} />
          <line x1={sx(svBracket.esv)} x2={sx(svBracket.esv)} y1={sy(0) - 6} y2={sy(0) + 6} />
          <line x1={sx(svBracket.edv)} x2={sx(svBracket.edv)} y1={sy(0) - 6} y2={sy(0) + 6} />
          <text x={(sx(svBracket.esv) + sx(svBracket.edv)) / 2} y={sy(0) - 10} textAnchor="middle">SV = {Math.round(svBracket.edv - svBracket.esv)} mL</text>
        </g>
      )}

      {c && Object.entries(c).map(([k, q]) => (
        <g key={k} className="pvc-corner">
          <circle cx={sx(q.v)} cy={sy(q.p)} r="6" />
          {cornerLabels && (
            <text
              x={sx(q.v) + (k === 'mc' || k === 'ao' ? 10 : -10)}
              y={sy(q.p) + (k === 'mc' || k === 'mo' ? 18 : -10)}
              textAnchor={k === 'mc' || k === 'ao' ? 'start' : 'end'}
            >{CORNER_LABEL[k]}</text>
          )}
        </g>
      ))}
      {markCorner && main && (() => {
        const q = corners(main.pts)[markCorner];
        return (
          <g className="pvc-mark">
            <circle cx={sx(q.v)} cy={sy(q.p)} r="13" />
            <circle cx={sx(q.v)} cy={sy(q.p)} r="5" className="pvc-mark-dot" />
          </g>
        );
      })()}

      {dot && (
        <g className="pvc-dot">
          <circle cx={sx(dot.v)} cy={sy(dot.p)} r="11" className="pvc-dot-halo" />
          <circle cx={sx(dot.v)} cy={sy(dot.p)} r="6" />
        </g>
      )}
    </svg>
  );
}

/** A cycle clock: t goes 0 → 1 once per beat, while `running`. */
export function useCycle(running = true, seconds = 3.6) {
  const [t, setT] = useState(0);
  const last = useRef(null);
  const tRef = useRef(0);
  useEffect(() => {
    if (!running) { last.current = null; return undefined; }
    let raf;
    const step = (now) => {
      if (last.current != null) {
        tRef.current = (tRef.current + (now - last.current) / 1000 / seconds) % 1;
        setT(tRef.current);
      }
      last.current = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, seconds]);
  return t;
}

/**
 * The left heart as the loop goes round: LA, LV and aorta, with the mitral
 * and aortic valves opening and closing and the LV swelling with volume.
 */
export function HeartSchematic({ v, minV, maxV, phase }) {
  const info = PHASES[phase] || PHASES.fill;
  const f = maxV > minV ? Math.max(0, Math.min(1, (v - minV) / (maxV - minV))) : 0.5;
  // The base (valve plane) stays put; the LV grows and shrinks towards the
  // apex, the way a real ventricle does.
  const rx = 40 + f * 18;
  const ry = 44 + f * 18;
  const cy = 92 + ry;
  const mitralOpen = info.mitral;
  const aorticOpen = info.aortic;
  return (
    <svg className="pvh" viewBox="0 0 220 220" role="img" aria-label={`${info.name}: mitral ${mitralOpen ? 'open' : 'closed'}, aortic ${aorticOpen ? 'open' : 'closed'}`}>
      <defs>
        <marker id="pvh-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#fff" />
        </marker>
      </defs>
      {/* Aorta, rising from the aortic valve */}
      <path d="M124 90 C 124 44, 160 24, 204 30 L 204 50 C 170 46, 146 58, 146 90 Z" className="pvh-aorta" />
      <text x="206" y="22" className="pvh-lab" textAnchor="end">Aorta</text>
      {/* LA, above the mitral valve */}
      <ellipse cx="66" cy="48" rx="44" ry="30" className="pvh-la" />
      <text x="66" y="53" className="pvh-lab" textAnchor="middle">LA</text>
      {/* LV */}
      <ellipse cx="102" cy={cy} rx={rx} ry={ry} className={`pvh-lv pvh-lv--${phase}`} />
      <text x="102" y={cy + 6} className="pvh-lab pvh-lab--lv" textAnchor="middle">LV</text>
      {/* Mitral valve (LA → LV) */}
      <g className={`pvh-valve${mitralOpen ? ' is-open' : ''}`}>
        {mitralOpen
          ? (<><line x1="62" y1="84" x2="68" y2="102" /><line x1="90" y1="84" x2="84" y2="102" /></>)
          : (<><line x1="62" y1="88" x2="76" y2="92" /><line x1="90" y1="88" x2="76" y2="92" /></>)}
      </g>
      {/* Aortic valve (LV → aorta) */}
      <g className={`pvh-valve${aorticOpen ? ' is-open' : ''}`}>
        {aorticOpen
          ? (<><line x1="124" y1="92" x2="120" y2="74" /><line x1="146" y1="92" x2="150" y2="74" /></>)
          : (<><line x1="124" y1="90" x2="135" y2="84" /><line x1="146" y1="90" x2="135" y2="84" /></>)}
      </g>
      {mitralOpen && <path d="M76 60 L76 108" className="pvh-flow" markerEnd="url(#pvh-arrow)" />}
      {aorticOpen && <path d="M135 112 L135 58" className="pvh-flow" markerEnd="url(#pvh-arrow)" />}
      {/* Valve state, written out */}
      <text x="4" y="212" className={`pvh-vlab${mitralOpen ? ' is-open' : ''}`}>Mitral: {mitralOpen ? 'OPEN' : 'shut'}</text>
      <text x="216" y="212" textAnchor="end" className={`pvh-vlab${aorticOpen ? ' is-open' : ''}`}>Aortic: {aorticOpen ? 'OPEN' : 'shut'}</text>
    </svg>
  );
}
