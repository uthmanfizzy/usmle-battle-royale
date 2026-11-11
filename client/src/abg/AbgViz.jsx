import { useEffect, useRef, useState } from 'react';

/**
 * The ABG Reader's pictures. Each one is the explanation of a step, drawn:
 * the pH as a dial, the primary process as a see-saw of acid against base,
 * compensation as an expected band with the real value dropped onto it, the
 * anion gap as the cations stacked against the anions, the delta ratio as a
 * gauge. They animate IN — the needle swings, the beam tips, the gap grows —
 * because watching the number arrive is what makes it stick.
 *
 * Pure SVG + CSS transitions. Every animation starts from a neutral state
 * (pH 7.40, a level beam, an empty gap) and moves to the case's value one
 * frame after mount, so the motion always means "from normal to this".
 */

// Mount → next frame → true. Lets a CSS transition run from its start state.
function useArrive(delay = 60) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}

/** A number that counts up to its value. */
export function CountUp({ value, decimals = 0, duration = 900 }) {
  const [shown, setShown] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const target = Number(value);
    if (!Number.isFinite(target)) { setShown(value); return undefined; }
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(target); return undefined; }
    const start = performance.now();
    const from = decimals > 0 ? Math.floor(target) - 0.3 : 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(from + (target - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, decimals, duration]);
  return <>{Number.isFinite(Number(shown)) ? Number(shown).toFixed(decimals) : shown}</>;
}

// ── 1. The pH dial ────────────────────────────────────────────────────────
const PH_MIN = 6.9, PH_MAX = 7.7;
const phAngle = (ph) => -90 + ((Math.min(PH_MAX, Math.max(PH_MIN, ph)) - PH_MIN) / (PH_MAX - PH_MIN)) * 180;

function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

export function PhDial({ pH }) {
  const on = useArrive();
  // Starts at 7.40 — the middle of NORMAL, not the middle of the scale
  // (6.9–7.7 centres on 7.30) — so the swing always reads "from normal to this".
  const angle = on ? phAngle(pH) : phAngle(7.40);
  const zone = pH < 7.35 ? 'acid' : pH > 7.45 ? 'alk' : 'normal';
  const ticks = [6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7];
  return (
    <figure className="abgv abgv-dial">
      <svg viewBox="0 0 320 190" role="img" aria-label={`pH ${pH.toFixed(2)}`}>
        <defs>
          <linearGradient id="abg-dial-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="49%" stopColor="#ffb86b" />
            <stop offset="56%" stopColor="#35e0a1" />
            <stop offset="64%" stopColor="#35e0a1" />
            <stop offset="72%" stopColor="#6fb6ff" />
            <stop offset="100%" stopColor="#7a6bff" />
          </linearGradient>
        </defs>
        <path d={arc(160, 160, 120, -90, 90)} className="abgv-dial-track" />
        <path d={arc(160, 160, 120, -90, 90)} stroke="url(#abg-dial-grad)" className="abgv-dial-band" />
        {/* The normal band, 7.35–7.45, outlined. */}
        <path d={arc(160, 160, 136, phAngle(7.35), phAngle(7.45))} className="abgv-dial-normal" />
        {ticks.map(t => {
          const a = (phAngle(t) * Math.PI) / 180;
          const x1 = 160 + 102 * Math.sin(a), y1 = 160 - 102 * Math.cos(a);
          const x2 = 160 + 92 * Math.sin(a), y2 = 160 - 92 * Math.cos(a);
          const xl = 160 + 78 * Math.sin(a), yl = 160 - 78 * Math.cos(a);
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="abgv-dial-tick" />
              <text x={xl} y={yl + 4} className="abgv-dial-num">{t.toFixed(1)}</text>
            </g>
          );
        })}
        <text x="30" y="182" className="abgv-dial-zone abgv-acid">ACID</text>
        <text x="290" y="182" className="abgv-dial-zone abgv-alk" textAnchor="end">ALKALI</text>
        <g className="abgv-needle" style={{ transform: `rotate(${angle}deg)` }}>
          <line x1="160" y1="160" x2="160" y2="52" />
          <circle cx="160" cy="52" r="5" />
        </g>
        <circle cx="160" cy="160" r="11" className="abgv-dial-hub" />
      </svg>
      <figcaption className={`abgv-readout abgv-readout--${zone}`}>
        pH <strong><CountUp value={pH} decimals={2} /></strong>
      </figcaption>
    </figure>
  );
}

// ── 2. The see-saw ────────────────────────────────────────────────────────
/**
 * pH follows the RATIO of base to acid: HCO₃⁻ ÷ (0.03 × PaCO₂). So the
 * picture is a balance — acid (CO₂) on the left, base (HCO₃⁻) on the right,
 * each weight sized by how far it is from normal — that tips the way the pH
 * went. The side that moved the most, in the direction of the pH, is the
 * primary process.
 */
export function Seesaw({ pH, paco2, hco3, primary }) {
  const on = useArrive();
  const tilt = on ? Math.max(-16, Math.min(16, (pH - 7.40) * 70)) : 0;   // + = base side down
  const rAcid = 15 + 18 * Math.min(2.2, paco2 / 40) / 2.2 * 1.6;
  const rBase = 15 + 18 * Math.min(2.2, hco3 / 24) / 2.2 * 1.6;
  const acidMoved = primary === 'resp-acidosis' || primary === 'resp-alkalosis' || primary === 'mixed';
  const baseMoved = primary === 'met-acidosis' || primary === 'met-alkalosis' || primary === 'mixed';
  return (
    <figure className="abgv abgv-seesaw">
      <svg viewBox="0 0 340 170" role="img" aria-label={`Acid PaCO2 ${paco2} against base HCO3 ${hco3}`}>
        <polygon points="170,150 150,170 190,170" className="abgv-fulcrum" />
        <g className="abgv-beam" style={{ transform: `rotate(${tilt}deg)` }}>
          <rect x="30" y="144" width="280" height="8" rx="4" className="abgv-beam-bar" />
          <g className={`abgv-weight abgv-weight--acid${acidMoved ? ' is-moved' : ''}`}>
            <circle cx="70" cy={144 - rAcid} r={rAcid} />
            <text x="70" y={144 - rAcid - 2} className="abgv-weight-big">{paco2}</text>
            <text x="70" y={144 - rAcid + 13} className="abgv-weight-small">PaCO₂</text>
          </g>
          <g className={`abgv-weight abgv-weight--base${baseMoved ? ' is-moved' : ''}`}>
            <circle cx="270" cy={144 - rBase} r={rBase} />
            <text x="270" y={144 - rBase - 2} className="abgv-weight-big">{hco3}</text>
            <text x="270" y={144 - rBase + 13} className="abgv-weight-small">HCO₃⁻</text>
          </g>
        </g>
        <text x="20" y="18" className="abgv-side abgv-acid">ACID · normal 40</text>
        <text x="320" y="18" className="abgv-side abgv-alk" textAnchor="end">BASE · normal 24</text>
      </svg>
      <figcaption className="abgv-caption">pH follows the ratio <b>HCO₃⁻ ÷ PaCO₂</b> — the beam tips the way the pH went.</figcaption>
    </figure>
  );
}

// ── 3. Expected band with the real value dropped onto it ─────────────────
export function RangeBar({ label, unit, actual, lo, hi, markers = [], min, max, verdictGood }) {
  const on = useArrive(120);
  const lo0 = min ?? Math.floor(Math.min(lo, actual) - 6);
  const hi0 = max ?? Math.ceil(Math.max(hi, actual) + 6);
  const x = (v) => 20 + ((v - lo0) / (hi0 - lo0)) * 300;
  const ticks = [];
  for (let t = Math.ceil(lo0 / 5) * 5; t <= hi0; t += 5) ticks.push(t);
  return (
    <figure className="abgv abgv-range">
      <svg viewBox="0 0 340 126" role="img" aria-label={`${label}: actual ${actual}, expected ${lo} to ${hi}`}>
        <rect x="20" y="46" width="300" height="14" rx="7" className="abgv-range-track" />
        <rect
          x={x(lo)} y="42" height="22" rx="6"
          width={on ? Math.max(4, x(hi) - x(lo)) : 0}
          className="abgv-range-band"
        />
        <text x={(x(lo) + x(hi)) / 2} y="96" className="abgv-range-bandlabel">expected {lo}–{hi}</text>
        {markers.map(m => (
          <g key={m.label}>
            <line x1={x(m.at)} x2={x(m.at)} y1="40" y2="66" className="abgv-range-mark" />
            <text x={x(m.at)} y="80" className="abgv-range-marklabel">{m.label} {m.at}</text>
          </g>
        ))}
        {ticks.map(t => <text key={t} x={x(t)} y="118" className="abgv-range-tick">{t}</text>)}
        <g className={`abgv-range-pin${verdictGood ? ' is-good' : ' is-off'}`} style={{ transform: `translate(${on ? x(actual) : x(lo0)}px, 0)` }}>
          <line x1="0" x2="0" y1="18" y2="68" />
          <circle cx="0" cy="53" r="7" />
          <text x="0" y="12">{actual}</text>
        </g>
      </svg>
      <figcaption className="abgv-caption">{label} ({unit}) — the band is what compensation alone would give; the pin is the patient.</figcaption>
    </figure>
  );
}

// ── 4. The anion gap: cations against anions ─────────────────────────────
export function GapBars({ na, cl, hco3, ag, agCorr, albumin }) {
  const on = useArrive(120);
  const scale = 1.25;   // px per mmol/L
  const H = (v) => v * scale;
  const corr = Math.max(0, agCorr - ag);
  const high = agCorr > 14;
  const base = 196;
  // Anion column, bottom up: Cl⁻, HCO₃⁻, the measured gap. It ALWAYS
  // stacks to exactly the height of Na⁺ — that is electroneutrality, and
  // it is the point of the picture. The albumin correction is NOT more
  // anion on top (an earlier version stacked it there and the anions came
  // out taller than the cations); it is a re-reading of the gap, drawn as a
  // separate hatched bar beside it: "this gap, with albumin accounted for".
  const segs = [
    { key: 'cl', v: cl, label: `Cl⁻ ${cl}`, cls: 'abgv-seg-cl' },
    { key: 'hco3', v: hco3, label: `HCO₃⁻ ${hco3}`, cls: 'abgv-seg-hco3' },
    { key: 'ag', v: Math.max(0, ag), label: `gap ${ag}`, cls: `abgv-seg-ag${high ? ' is-high' : ''}`, grow: true },
  ];
  const gapBottom = base - H(cl) - H(hco3);
  let y = base;
  return (
    <figure className="abgv abgv-gap">
      <svg viewBox="0 0 340 214" role="img" aria-label={`Sodium ${na} against chloride ${cl} plus bicarbonate ${hco3}; gap ${agCorr}`}>
        <defs>
          <pattern id="abg-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(255, 196, 92, 0.18)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255, 196, 92, 0.9)" strokeWidth="2.4" />
          </pattern>
        </defs>
        {/* Cations */}
        <rect x="60" y={base - H(na)} width="70" height={H(na)} rx="6" className="abgv-seg-na" />
        <text x="95" y={base - H(na) / 2} className="abgv-seg-text">Na⁺ {na}</text>
        <text x="95" y="210" className="abgv-col-label">CATIONS</text>
        {/* Anions */}
        {segs.map((s, i) => {
          const h = H(s.v);
          y -= h;
          const shown = s.grow ? (on ? h : 0) : h;
          return (
            <g key={s.key} style={{ transitionDelay: `${0.25 * i}s` }}>
              <rect
                x="200" width="70" rx={i === segs.length - 1 ? 6 : 1}
                y={s.grow ? y + (h - shown) : y} height={shown}
                className={s.cls}
                fill={s.key === 'corr' ? 'url(#abg-hatch)' : undefined}
                style={{ transition: 'y 0.9s cubic-bezier(.2,.9,.3,1), height 0.9s cubic-bezier(.2,.9,.3,1)', transitionDelay: `${0.35 + 0.35 * i}s` }}
              />
              {h > 14 && (
                <text x="235" y={y + h / 2} className="abgv-seg-text" style={s.grow ? { opacity: on ? 1 : 0, transition: 'opacity 0.4s', transitionDelay: `${0.9 + 0.35 * i}s` } : undefined}>{s.label}</text>
              )}
              {h <= 14 && (
                <text x="280" y={y + h / 2} className="abgv-seg-side" style={s.grow ? { opacity: on ? 1 : 0, transition: 'opacity 0.4s', transitionDelay: `${0.9 + 0.35 * i}s` } : undefined}>{s.label}</text>
              )}
            </g>
          );
        })}
        <text x="235" y="210" className="abgv-col-label">ANIONS</text>
        {corr > 0 && (
          <g>
            <rect
              x="286" width="26" rx="5"
              y={on ? gapBottom - H(agCorr) : gapBottom}
              height={on ? H(agCorr) : 0}
              fill="url(#abg-hatch)" className="abgv-seg-corr"
              style={{ transition: 'y 0.9s cubic-bezier(.2,.9,.3,1), height 0.9s cubic-bezier(.2,.9,.3,1)', transitionDelay: '1.4s' }}
            />
            <text x="299" y={gapBottom - H(agCorr) - 16} className="abgv-seg-side abgv-corr-label" style={{ opacity: on ? 1 : 0, transition: 'opacity 0.4s', transitionDelay: '2s' }}>corrected</text>
            <text x="299" y={gapBottom - H(agCorr) - 4} className="abgv-seg-side abgv-corr-label" style={{ opacity: on ? 1 : 0, transition: 'opacity 0.4s', transitionDelay: '2s' }}>{agCorr}</text>
          </g>
        )}
        <line x1="40" x2="300" y1={base} y2={base} className="abgv-gap-floor" />
      </svg>
      <figcaption className="abgv-caption">
        The body is electrically neutral: whatever Na⁺ is not matched by Cl⁻ and HCO₃⁻ is unmeasured anion — the gap.
        {albumin != null && <> Low albumin hides some of it (hatched).</>}
      </figcaption>
    </figure>
  );
}

// ── 5. The delta ratio ────────────────────────────────────────────────────
export function DeltaGauge({ dAG, dHCO3, ratio }) {
  const on = useArrive(120);
  const MAXR = 4;
  const x = (r) => 20 + (Math.min(MAXR, Math.max(0, r)) / MAXR) * 300;
  const zones = [
    { from: 0, to: 0.8, cls: 'abgv-dz-nagma', label: '+ normal-gap' },
    { from: 0.8, to: 2, cls: 'abgv-dz-pure', label: 'pure HAGMA' },
    { from: 2, to: MAXR, cls: 'abgv-dz-alk', label: '+ met. alkalosis' },
  ];
  // The two changes, on ONE scale, wide enough to compare at a glance —
  // comparing them is the whole idea of the ratio.
  const s = Math.min(11, 210 / Math.max(1, dAG, dHCO3));
  return (
    <figure className="abgv abgv-delta">
      <svg viewBox="0 0 340 150" role="img" aria-label={`Delta ratio ${ratio}`}>
        <text x="20" y="15" className="abgv-delta-label">ΔAG {dAG}</text>
        <rect x="110" y="6" height="16" rx="5" width={on ? Math.max(3, dAG * s) : 0} className="abgv-delta-ag" />
        <text x="20" y="41" className="abgv-delta-label">ΔHCO₃⁻ {dHCO3}</text>
        <rect x="110" y="32" height="16" rx="5" width={on ? Math.max(3, dHCO3 * s) : 0} className="abgv-delta-hco3" style={{ transitionDelay: '0.2s' }} />

        {/* The ratio on its scale: value above the pin, ticks and zone
            names below the bar, so nothing overprints. */}
        {zones.map(z => (
          <rect key={z.cls} x={x(z.from)} y="92" width={x(z.to) - x(z.from)} height="16" className={z.cls} />
        ))}
        {[0, 0.8, 2, 3, 4].map(t => <text key={t} x={x(t)} y="121" className="abgv-range-tick">{t}</text>)}
        {zones.map(z => (
          <text key={z.label} x={(x(z.from) + x(z.to)) / 2} y="139" className="abgv-dz-text">{z.label}</text>
        ))}
        <g className="abgv-delta-pin" style={{ transform: `translate(${on ? x(ratio) : x(0)}px, 0)` }}>
          <text x="0" y="70">{Number.isFinite(ratio) ? ratio : '∞'}</text>
          <polygon points="0,90 -8,76 8,76" />
        </g>
      </svg>
      <figcaption className="abgv-caption">Did the bicarbonate fall by as much as the gap rose? The ratio says whether a second process is hiding.</figcaption>
    </figure>
  );
}

