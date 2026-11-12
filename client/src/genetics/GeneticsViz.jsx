import { useEffect, useRef, useState } from 'react';

/**
 * Genetics Roulette pictures:
 *   Wheel    — the roulette wheel, spun to land a chosen condition under the
 *              pointer (the rotation is computed, so it always lands true).
 *   Punnett  — the 2×2 square built from the parents' gametes; on reveal the
 *              children fill in one by one, affected and carriers marked and
 *              the ones the question counts outlined.
 *   Pedigree — the parents in standard symbols (square ♂, circle ♀; filled
 *              affected, dot carrier) and the child in question.
 */

const PALETTE = ['#e9a23b', '#2a9d8f', '#e76f51', '#8a6fdf', '#4ea8de', '#d6457a'];

export function Wheel({ segments, target, spinKey, onDone }) {
  const n = segments.length;
  const step = 360 / n;
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (spinKey == null || target == null) return undefined;
    // Land the centre of segment `target` under the pointer at the top.
    const want = ((-(target * step + step / 2)) % 360 + 360) % 360;
    const cur = ((rotRef.current % 360) + 360) % 360;
    let delta = want - cur;
    if (delta < 0) delta += 360;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const next = rotRef.current + (reduce ? 0 : 360 * 5) + delta;
    rotRef.current = next;
    setRot(next);
    const t = setTimeout(() => doneRef.current?.(), reduce ? 50 : 3300);
    return () => clearTimeout(t);
  }, [spinKey, target, step]);

  const R = 150;
  const arc = (i) => {
    const a0 = ((i * step - 90) * Math.PI) / 180, a1 = (((i + 1) * step - 90) * Math.PI) / 180;
    return `M0,0 L${R * Math.cos(a0)},${R * Math.sin(a0)} A${R},${R} 0 0 1 ${R * Math.cos(a1)},${R * Math.sin(a1)} Z`;
  };
  return (
    <div className="gr-wheel">
      <svg viewBox="-170 -170 340 340" role="img" aria-label="Roulette wheel of genetic conditions">
        <circle r="166" className="gr-wheel-rim" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          return <circle key={i} cx={158 * Math.cos(a)} cy={158 * Math.sin(a)} r="3.2" className="gr-wheel-bulb" style={{ '--i': i }} />;
        })}
        <g className="gr-wheel-spin" style={{ transform: `rotate(${rot}deg)` }}>
          {segments.map((s, i) => (
            <g key={s.id}>
              <path d={arc(i)} fill={PALETTE[i % PALETTE.length]} className={`gr-seg${i === target ? ' is-target' : ''}`} />
              <text
                transform={`rotate(${i * step + step / 2}) translate(0 -${R - 14}) rotate(90)`}
                className="gr-seg-t"
              >{s.short.length > 15 ? `${s.short.slice(0, 14)}…` : s.short}</text>
            </g>
          ))}
          <circle r="34" className="gr-wheel-hub" />
          <text className="gr-wheel-hub-t" y="5">🧬</text>
        </g>
      </svg>
      <div className="gr-pointer" aria-hidden="true" />
    </div>
  );
}

// ── Punnett square ────────────────────────────────────────────────────────
const SYM = {
  AD: { D: 'A', n: 'a' },
  AR: { D: 'a', n: 'A' },
  XLR: { D: 'Xᵃ', n: 'Xᴬ', Y: 'Y' },
  XLD: { D: 'Xᴬ', n: 'Xᵃ', Y: 'Y' },
};
const childLabel = (pattern, [m, f]) => {
  const s = SYM[pattern];
  const up = (x) => (x === x.toUpperCase() ? 0 : 1);
  if (pattern === 'AD' || pattern === 'AR') return [s[m], s[f]].sort((x, y) => up(x) - up(y)).join('');
  return f === 'Y' ? `${s[m]}Y` : [s[m], s[f]].sort().join('');
};

export function Punnett({ step, reveal }) {
  const { pattern, scenario, sol } = step;
  const s = SYM[pattern];
  const hitSet = new Set(sol.hits);
  const groupSet = new Set(sol.group);
  return (
    <div className="gr-punnett">
      <div className="gr-pq">
        <span className="gr-pq-corner"><small>♀ \ ♂</small></span>
        {scenario.father.map((a, i) => <span key={`f${i}`} className="gr-pq-head is-f">{s[a]}</span>)}
        {scenario.mother.map((ma, r) => (
          <FragmentRow key={`r${r}`}>
            <span className="gr-pq-head is-m">{s[ma]}</span>
            {scenario.father.map((fa, c) => {
              const cell = sol.cells[r * 2 + c];
              const cls = !reveal ? '' : ` is-${cell.status}${groupSet.has(cell) ? ' in-group' : ' out-group'}${hitSet.has(cell) ? ' is-hit' : ''}`;
              return (
                <span key={c} className={`gr-pq-cell${cls}`} style={{ '--d': `${0.18 * (r * 2 + c)}s` }}>
                  <b>{reveal ? childLabel(pattern, cell.alleles) : '?'}</b>
                  {reveal && <small>{cell.son === true ? '♂ ' : cell.son === false ? '♀ ' : ''}{cell.status}</small>}
                </span>
              );
            })}
          </FragmentRow>
        ))}
      </div>
      <p className="gr-pq-key">
        {pattern === 'AD' && <>A = disease allele (dominant) · a = normal</>}
        {pattern === 'AR' && <>a = disease allele (recessive) · A = normal</>}
        {pattern === 'XLR' && <>Xᵃ = X carrying the disease allele · Xᴬ = normal X</>}
        {pattern === 'XLD' && <>Xᴬ = X carrying the dominant disease allele · Xᵃ = normal X</>}
      </p>
    </div>
  );
}
function FragmentRow({ children }) { return <>{children}</>; }

// ── Pedigree ──────────────────────────────────────────────────────────────
export function Pedigree({ m, f, childQ = '?' }) {
  const sym = (status, shape, x) => {
    const fill = status === 'affected' ? 'gr-pd-aff' : 'gr-pd-un';
    return (
      <g>
        {shape === 'sq'
          ? <rect x={x - 18} y="12" width="36" height="36" rx="3" className={fill} />
          : <circle cx={x} cy="30" r="18" className={fill} />}
        {status === 'carrier' && <circle cx={x} cy="30" r="6" className="gr-pd-dot" />}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 220 130" className="gr-pedigree" role="img" aria-label={`Father ${f}, mother ${m}`}>
      <line x1="78" y1="30" x2="142" y2="30" className="gr-pd-line" />
      <line x1="110" y1="30" x2="110" y2="86" className="gr-pd-line" />
      {sym(f, 'sq', 60)}
      {sym(m, 'ci', 160)}
      <text x="60" y="64" className="gr-pd-t">father</text>
      <text x="160" y="64" className="gr-pd-t">mother</text>
      <g className="gr-pd-child">
        <rect x="94" y="86" width="32" height="32" rx="16" className="gr-pd-q" />
        <text x="110" y="108" className="gr-pd-qt">{childQ}</text>
      </g>
    </svg>
  );
}
