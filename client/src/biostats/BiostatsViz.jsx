import { useEffect, useRef, useState } from 'react';
import { CountUp } from '../abg/AbgViz';
import { MEASURES, BANDS } from './biostatsCore';

/**
 * Biostats Lab pictures. Each one draws the question's OWN numbers, so the
 * picture and the arithmetic can never disagree:
 *   TwoByTwo     — the table; on answer, the numerator cells glow and the
 *                  denominator cells are outlined.
 *   CutoffCurves — healthy and diseased curves with a live cutoff; on
 *                  answer the cutoff (or the prevalence) slides, and the
 *                  sensitivity/specificity/PPV/NPV chips move with it.
 *   RiskArrays   — 100-person icon arrays per group, the difference marked.
 *   NormalCurve, CiPlot, Scatter, ErrorGrid, SkewCurve, Target, RatesBar,
 *   DesignFlow   — one each for the concept questions.
 */

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function useTween(target, ms = 900) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (reduceMotion()) { cur.current = target; setV(target); return undefined; }
    const from = cur.current;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      cur.current = from + (target - from) * e;
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// ── The 2×2 table ─────────────────────────────────────────────────────────
export function TwoByTwo({ t, measure, reveal }) {
  const M = MEASURES[measure];
  const cls = (k) => (!reveal ? '' : M.num.includes(k) ? ' is-num' : M.den.includes(k) ? ' is-den' : ' is-off');
  const cell = (k, label, i) => (
    <td className={`bsl-tt-cell bsl-tt-${k}${cls(k)}`} style={{ '--d': `${0.08 * i}s` }}>
      <small>{label}</small>
      <b><CountUp value={t[k]} /></b>
    </td>
  );
  const D = t.TP + t.FN, H = t.FP + t.TN;
  return (
    <div className="bsl-tt-wrap">
      <table className="bsl-tt">
        <thead>
          <tr>
            <th aria-hidden="true" />
            <th className="bsl-tt-h is-d">Disease +</th>
            <th className="bsl-tt-h is-h">Disease −</th>
            <th className="bsl-tt-h is-tot">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="bsl-tt-r">Test +</th>
            {cell('TP', 'TP · a', 0)}
            {cell('FP', 'FP · b', 1)}
            <td className="bsl-tt-tot">{t.TP + t.FP}</td>
          </tr>
          <tr>
            <th className="bsl-tt-r">Test −</th>
            {cell('FN', 'FN · c', 2)}
            {cell('TN', 'TN · d', 3)}
            <td className="bsl-tt-tot">{t.FN + t.TN}</td>
          </tr>
          <tr className="bsl-tt-totrow">
            <th className="bsl-tt-r">Total</th>
            <td className="bsl-tt-tot">{D}</td>
            <td className="bsl-tt-tot">{H}</td>
            <td className="bsl-tt-tot">{D + H}</td>
          </tr>
        </tbody>
      </table>
      {reveal && (
        <p className="bsl-tt-key"><span className="is-num">numerator</span><span className="is-den">denominator</span></p>
      )}
    </div>
  );
}

// ── Cutoff curves ─────────────────────────────────────────────────────────
const HMU = 125, DMU = 215, SIG = 34, BASE = 128, AMP = 100, X0 = 10, X1 = 330;
const g = (x, mu) => Math.exp(-((x - mu) ** 2) / (2 * SIG * SIG));
// Standard normal CDF (Abramowitz–Stegun 7.1.26) — accurate to ~1e-7.
function phi(z) {
  const tt = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * tt - 1.453152027) * tt) + 1.421413741) * tt - 0.284496736) * tt + 0.254829592) * tt * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
function curve(mu, scale, from = X0, to = X1, close = false) {
  let d = '';
  for (let x = from; x <= to + 0.01; x += 3) {
    const y = BASE - AMP * scale * g(x, mu);
    d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  if (close) d += `L${to},${BASE}L${from},${BASE}Z`;
  return d;
}

export function CutoffCurves({ q, reveal }) {
  const start = 170;
  const cutTarget = q.mode === 'cutoff' && reveal ? (q.dir === 'lower' ? 140 : 200) : start;
  const dTarget = q.mode === 'prevalence' && reveal ? (q.more ? 1 : 0.22) : 0.5;
  const cut = useTween(cutTarget, 1100);
  const dScale = useTween(dTarget, 1100);
  const sens = 1 - phi((cut - DMU) / SIG);
  const spec = phi((cut - HMU) / SIG);
  const prev = dScale / (dScale + 1);       // curve areas are proportional to their heights here
  const ppv = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
  const npv = (spec * (1 - prev)) / (spec * (1 - prev) + (1 - sens) * prev);
  const chip = (label, v, key) => (
    <span className={`bsl-chip${q.what === key ? ' is-asked' : ''}`}>{label} <b>{Math.round(v * 100)}%</b></span>
  );
  return (
    <div className="bsl-viz">
      <svg viewBox="0 0 340 150" className="bsl-svg" role="img" aria-label="Healthy and diseased distributions with a test cutoff">
        <path d={curve(HMU, 1, cut, X1, true)} className="bsl-fp" />
        <path d={curve(DMU, dScale, X0, cut, true)} className="bsl-fn" />
        <path d={curve(HMU, 1)} className="bsl-curve is-h" />
        <path d={curve(DMU, dScale)} className="bsl-curve is-d" />
        <line x1={X0} x2={X1} y1={BASE} y2={BASE} className="bsl-axis" />
        <line x1={cut} x2={cut} y1={14} y2={BASE + 4} className="bsl-cut" />
        <text x={cut} y={10} className="bsl-cut-t">cutoff</text>
        {q.mode === 'cutoff' && !reveal && (
          <path d={q.dir === 'lower' ? `M${start - 8},22 l-22,0 m6,-5 l-6,5 l6,5` : `M${start + 8},22 l22,0 m-6,-5 l6,5 l-6,5`} className="bsl-cut-arrow" />
        )}
        <text x={HMU} y={BASE + 16} className="bsl-lbl is-h">healthy</text>
        <text x={DMU} y={BASE + 16} className="bsl-lbl is-d">diseased</text>
        <text x={X1 - 4} y={BASE + 16} className="bsl-lbl is-end">test + →</text>
        <text x={X0 + 2} y={BASE + 16} className="bsl-lbl is-start">← test −</text>
      </svg>
      <div className="bsl-chips">
        {chip('Sens', sens, 'sens')}
        {chip('Spec', spec, 'spec')}
        {chip('PPV', ppv, 'ppv')}
        {chip('NPV', npv, 'npv')}
        <span className="bsl-legend"><i className="is-fp" />false +<i className="is-fn" />false −</span>
      </div>
    </div>
  );
}

// ── Icon arrays: events per 100 ───────────────────────────────────────────
export function RiskArrays({ q, reveal }) {
  const e = Math.round(q.eer * 100), c = Math.round(q.cer * 100);
  const lo = Math.min(e, c);
  const grid = (count, label, rate, isLower) => (
    <div className="bsl-arr">
      <p className="bsl-arr-t">{label} <b>{Math.round(rate * 1000) / 10}%</b></p>
      <div className="bsl-arr-grid">
        {Array.from({ length: 100 }, (_, i) => {
          const ev = i < count;
          const extra = reveal && ev && !isLower && i >= lo;
          return <i key={i} className={`${ev ? 'is-ev' : ''}${extra ? ' is-extra' : ''}`} style={{ '--d': `${(i % 10) * 0.012 + Math.floor(i / 10) * 0.03}s` }} />;
        })}
      </div>
    </div>
  );
  const top = q.harm ? 'Exposed' : 'Treated';
  const bottom = q.harm ? 'Unexposed' : 'Control';
  return (
    <div className="bsl-viz">
      <div className="bsl-arrs">
        {grid(e, top, q.eer, e <= c)}
        {grid(c, bottom, q.cer, c < e)}
      </div>
      <table className="bsl-mini">
        <thead><tr><th /><th>Event</th><th>No event</th></tr></thead>
        <tbody>
          <tr><th>{top}</th><td>a = {q.a}</td><td>b = {q.b}</td></tr>
          <tr><th>{bottom}</th><td>c = {q.c}</td><td>d = {q.d}</td></tr>
        </tbody>
      </table>
      {reveal && <p className="bsl-viz-note"><i className="bsl-dot is-extra" /> the extra events per 100 — the absolute difference ({Math.abs(e - c)} in 100)</p>}
    </div>
  );
}

// ── The normal curve ──────────────────────────────────────────────────────
const NMU = 170, NS = 44, NBASE = 112;
const nx = (k) => (k <= -4 ? 8 : k >= 4 ? 332 : NMU + k * NS);
const ny = (x) => NBASE - 92 * Math.exp(-((x - NMU) ** 2) / (2 * NS * NS));
function npath(from, to, close) {
  let d = '';
  for (let x = from; x <= to + 0.01; x += 2) d += `${d ? 'L' : 'M'}${x.toFixed(1)},${ny(x).toFixed(1)}`;
  if (close) d += `L${to},${NBASE}L${from},${NBASE}Z`;
  return d;
}
export function NormalCurve({ q, reveal }) {
  return (
    <div className="bsl-viz">
      <svg viewBox="0 0 340 150" className="bsl-svg" role="img" aria-label="Normal distribution with the asked range shaded">
        <path d={npath(nx(q.lo), nx(q.hi), true)} className="bsl-norm-fill" />
        <path d={npath(8, 332)} className="bsl-curve is-n" />
        <line x1={8} x2={332} y1={NBASE} y2={NBASE} className="bsl-axis" />
        {[-3, -2, -1, 0, 1, 2, 3].map(k => (
          <g key={k}>
            <line x1={nx(k)} x2={nx(k)} y1={NBASE} y2={k === 0 ? 18 : ny(nx(k))} className={k === 0 ? 'bsl-mu' : 'bsl-tick'} />
            <text x={nx(k)} y={NBASE + 13} className="bsl-lbl">{k === 0 ? 'μ' : `${k > 0 ? '+' : '−'}${Math.abs(k)}σ`}</text>
            <text x={nx(k)} y={NBASE + 25} className="bsl-lbl is-val">{q.mu + k * q.sd}</text>
          </g>
        ))}
        {reveal && BANDS.slice(1, 7).map((b, i) => (
          <text key={i} x={nx(i - 3) + NS / 2} y={Math.min(NBASE - 6, ny(nx(i - 3) + NS / 2) + (i === 2 || i === 3 ? 30 : 14))} className="bsl-band" style={{ '--d': `${0.08 * i}s` }}>{b}%</text>
        ))}
      </svg>
    </div>
  );
}

// ── Confidence interval ───────────────────────────────────────────────────
export function CiPlot({ q, reveal }) {
  // Ratios on a log scale (0.25 … 4) so 0.5 and 2 sit equally far from 1.
  const sx = q.ratio
    ? (v) => 30 + ((Math.log2(v) + 2) / 4) * 280
    : (v) => 30 + ((v + 10) / 20) * 280;
  const ticks = q.ratio ? [0.25, 0.5, 1, 2, 4] : [-10, -5, 0, 5, 10];
  const crosses = q.lo <= q.nul && q.nul <= q.hi;
  return (
    <div className="bsl-viz">
      <svg viewBox="0 0 340 96" className="bsl-svg" role="img" aria-label={`95% confidence interval from ${q.lo} to ${q.hi}`}>
        <line x1={30} x2={310} y1={70} y2={70} className="bsl-axis" />
        {ticks.map(t => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={70} y2={74} className="bsl-tick" />
            <text x={sx(t)} y={86} className="bsl-lbl">{t}</text>
          </g>
        ))}
        <line x1={sx(q.nul)} x2={sx(q.nul)} y1={10} y2={70} className={`bsl-null${reveal ? ' is-on' : ''}`} />
        <text x={sx(q.nul) + 4} y={18} className="bsl-lbl is-start">no effect</text>
        <g className={`bsl-ci${reveal ? (crosses ? ' is-ns' : ' is-sig') : ''}`}>
          <line x1={sx(q.lo)} x2={sx(q.hi)} y1={42} y2={42} />
          <line x1={sx(q.lo)} x2={sx(q.lo)} y1={35} y2={49} />
          <line x1={sx(q.hi)} x2={sx(q.hi)} y1={35} y2={49} />
          <rect x={sx(q.point) - 5} y={37} width={10} height={10} />
        </g>
      </svg>
      <p className="bsl-viz-note">{q.ratio ? 'Ratio — log scale, the null is 1' : 'Difference — the null is 0'}</p>
    </div>
  );
}

// ── Scatter ───────────────────────────────────────────────────────────────
export function Scatter({ q, reveal }) {
  const sx = (x) => 170 + x * 45, sy = (y) => 70 - y * 20;
  return (
    <div className="bsl-viz">
      <svg viewBox="0 0 340 140" className="bsl-svg" role="img" aria-label={`Scatter plot with r = ${q.r}`}>
        <line x1={20} x2={320} y1={130} y2={130} className="bsl-axis" />
        <line x1={20} x2={20} y1={6} y2={130} className="bsl-axis" />
        {q.pts.map(([x, y], i) => (
          <circle key={i} cx={Math.max(26, Math.min(316, sx(x)))} cy={Math.max(8, Math.min(126, sy(y)))} r={3.4} className="bsl-pt" style={{ '--d': `${i * 0.015}s` }} />
        ))}
        {reveal && <line x1={sx(-3)} y1={sy(-3 * q.r)} x2={sx(3)} y2={sy(3 * q.r)} className="bsl-fit" />}
      </svg>
    </div>
  );
}

// ── Truth vs decision ─────────────────────────────────────────────────────
const ERR_CELL = { t1: 0, power: 1, correct: 2, t2: 3 };
export function ErrorGrid({ answer, reveal }) {
  const on = reveal ? ERR_CELL[answer] : -1;
  const cells = [
    ['Type I error', 'α · false +', 'bad'], ['Power', '1 − β', 'good'],
    ['Correct', '1 − α', 'good'], ['Type II error', 'β · false −', 'bad'],
  ];
  return (
    <div className="bsl-viz">
      <div className="bsl-eg">
        <span />
        <span className="bsl-eg-h">H₀ true <small>no real effect</small></span>
        <span className="bsl-eg-h">H₀ false <small>real effect</small></span>
        <span className="bsl-eg-r">Reject H₀</span>
        {cells.slice(0, 2).map((c, i) => <span key={i} className={`bsl-eg-c is-${c[2]}${on === i ? ' is-on' : ''}`}><b>{c[0]}</b>{c[1]}</span>)}
        <span className="bsl-eg-r">Keep H₀</span>
        {cells.slice(2).map((c, i) => <span key={i + 2} className={`bsl-eg-c is-${c[2]}${on === i + 2 ? ' is-on' : ''}`}><b>{c[0]}</b>{c[1]}</span>)}
      </div>
    </div>
  );
}

// ── Skew ──────────────────────────────────────────────────────────────────
export function SkewCurve({ skew, reveal }) {
  // A skewed hump: a gamma-like shape, mirrored for a left skew.
  const shape = (x) => {
    if (!skew) return Math.exp(-((x - 170) ** 2) / (2 * 45 * 45));
    const u = skew > 0 ? (x - 40) / 50 : (300 - x) / 50;
    return u <= 0 ? 0 : Math.pow(u, 2) * Math.exp(-u) / (4 * Math.exp(-2));
  };
  let d = '';
  for (let x = 10; x <= 330; x += 3) d += `${d ? 'L' : 'M'}${x},${(116 - 90 * shape(x)).toFixed(1)}`;
  const m = skew > 0 ? { mode: 140, median: 174, mean: 190 } : skew < 0 ? { mode: 200, median: 166, mean: 150 } : { mode: 170, median: 170, mean: 170 };
  return (
    <div className="bsl-viz">
      <svg viewBox="0 0 340 150" className="bsl-svg" role="img" aria-label="Distribution shape">
        <path d={`${d}L330,116L10,116Z`} className="bsl-norm-fill is-soft" />
        <path d={d} className="bsl-curve is-n" />
        <line x1={10} x2={330} y1={116} y2={116} className="bsl-axis" />
        {reveal && (skew ? (
          [['mode', m.mode, 0], ['median', m.median, 1], ['mean', m.mean, 2]].map(([k, x, i]) => (
            <g key={k} className="bsl-mark" style={{ '--d': `${i * 0.15}s` }}>
              <line x1={x} x2={x} y1={20} y2={116} className={`bsl-m is-${k}`} />
              <text x={x} y={130 + (i % 2) * 12} className={`bsl-lbl is-${k}`}>{k}</text>
            </g>
          ))
        ) : (
          <g className="bsl-mark"><line x1={170} x2={170} y1={20} y2={116} className="bsl-m is-mean" /><text x={170} y={132} className="bsl-lbl is-mean">mean = median = mode</text></g>
        ))}
      </svg>
    </div>
  );
}

// ── Precision vs accuracy ─────────────────────────────────────────────────
export function Target({ target }) {
  const shots = target === 'precise' ? [[34, -26], [38, -22], [31, -21], [36, -29]] : [[-22, 14], [18, -20], [8, 24], [-12, -18]];
  return (
    <div className="bsl-viz bsl-target">
      <svg viewBox="0 0 120 120" role="img" aria-label={target === 'precise' ? 'Tight cluster away from the centre' : 'Scattered shots centred on the bullseye'}>
        {[52, 38, 24, 10].map((r, i) => <circle key={r} cx={60} cy={60} r={r} className={`bsl-ring r${i}`} />)}
        {shots.map(([x, y], i) => <circle key={i} cx={60 + x} cy={60 + y} r={4} className="bsl-shot" style={{ '--d': `${0.12 * i}s` }} />)}
      </svg>
      <p>{target === 'precise' ? 'Tight together, off the truth' : 'Scattered, but centred on the truth'}</p>
    </div>
  );
}

// ── Who is at risk ────────────────────────────────────────────────────────
export function RatesBar({ q }) {
  const p = (q.P / q.N) * 100, i = (q.I / q.N) * 100;
  return (
    <div className="bsl-viz">
      <div className="bsl-rates" aria-hidden="true">
        <span className="is-old" style={{ width: `${p}%` }} />
        <span className="is-new" style={{ width: `${i}%` }} />
        <span className="is-risk" />
      </div>
      <p className="bsl-rates-key">
        <span><i className="is-old" />already ill {q.P}</span>
        <span><i className="is-new" />new this year {q.I}</span>
        <span><i className="is-risk" />at risk on 1 Jan {q.N - q.P}</span>
      </p>
    </div>
  );
}

// ── Which way the study looks ─────────────────────────────────────────────
const FLOWS = {
  caseControl: ['Exposure?', '← look back', 'Cases + controls'],
  prospCohort: ['Exposed + unexposed', 'follow forward →', 'Outcome?'],
  retroCohort: ['Exposure in old records', 'records →', 'Outcome by now?'],
  crossSectional: ['Exposure', '= same moment =', 'Disease'],
  ecological: ['Country A, B, C…', 'population rates', 'No individuals'],
  rct: ['Randomise', 'intervention vs control →', 'Outcome'],
  crossover: ['Drug A → washout → Drug B', 'each is own control', 'Compare'],
  caseSeries: ['Patients with X', 'describe', 'No comparison'],
  meta: ['Study 1 + 2 + 3…', 'pool →', 'One estimate'],
};
export function DesignFlow({ answer }) {
  const f = FLOWS[answer];
  if (!f) return null;
  return (
    <div className="bsl-flow">
      <span className="bsl-flow-a">{f[0]}</span>
      <span className="bsl-flow-arrow">{f[1]}</span>
      <span className="bsl-flow-b">{f[2]}</span>
    </div>
  );
}
