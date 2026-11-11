import { useEffect, useMemo, useState } from 'react';
import { PLEXUS, NERVES, MUSCLES, SIGNS, pathTo, downstreamOf, rootsLabel } from './muscleData';

/**
 * The Muscle Mapper's pictures.
 *
 * PlexusMap — the brachial or lumbosacral plexus as the graph it is (roots
 * → trunks → divisions → cords → nerves). Lighting a nerve walks the graph
 * back to the roots and keeps only the branches carrying that nerve's own
 * roots, so the axillary nerve lights the posterior cord but only its C5–C6
 * part. Signals flow along the lit path. A lesion is a cut: everything
 * downstream that depends ONLY on the cut part goes dark (lost), and
 * anything that still gets fibres another way goes amber (weakened) — which
 * is exactly why Erb palsy takes the deltoid but only weakens the median.
 *
 * MusclePanel — the nerve's muscles, with the lost ones struck through.
 * RootLadder — the spinal roots as a column, for reflexes and dermatomes.
 * SignCard — the clinical sign, as the picture that names it.
 */

function useArrive(delay = 60) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t); }, [delay]);
  return on;
}

// Which roots each node carries — for deciding lost vs weakened.
function carriesMap(region) {
  const P = PLEXUS[region];
  const parents = {};
  for (const [a, b] of P.edges) (parents[b] = parents[b] || []).push(a);
  const memo = {};
  const carry = (id) => {
    if (memo[id]) return memo[id];
    if (P.nodes[id]?.kind === 'root') return (memo[id] = new Set([id]));
    const s = new Set();
    for (const p of parents[id] || []) for (const r of carry(p)) s.add(r);
    return (memo[id] = s);
  };
  for (const id of Object.keys(P.nodes)) carry(id);
  // A NERVE carries its own textbook roots, not everything its cord could
  // bring: the axillary nerve leaves the posterior cord (C5–T1) but is
  // C5–C6, so an upper trunk lesion takes it out entirely — it is lost in
  // Erb palsy, not merely weakened.
  for (const [id, n] of Object.entries(P.nodes)) {
    if (n.kind === 'nerve' && NERVES[id]) memo[id] = new Set(NERVES[id].roots);
  }
  return memo;
}

/**
 * focus   nerve id whose pathway to light (or null)
 * lesion  node id that is cut (nerve, trunk or root), or null
 * showRoots  whether the focus nerve's roots are labelled as the answer
 * onPick  (nodeId) => void — makes nerves clickable (the atlas)
 */
export function PlexusMap({ region, focus = null, lesion = null, showRoots = false, onPick = null, picked = null }) {
  const P = PLEXUS[region];
  const carries = useMemo(() => carriesMap(region), [region]);
  const lit = useMemo(() => (focus && P.nodes[focus] ? pathTo(region, focus) : null), [region, focus, P]);
  const cut = useMemo(() => {
    if (!lesion || !P.nodes[lesion]) return null;
    const down = downstreamOf(region, lesion);
    const via = carries[lesion];
    const lost = new Set(), weak = new Set();
    for (const id of down) {
      const c = carries[id];
      // Lost: every root it carries ran through the cut. Weakened: SOME did.
      // Untouched: none did — Klumpke (C8–T1) cuts the lower trunk, which
      // feeds the posterior cord, but the axillary nerve (C5–C6) takes
      // nothing from it and must not be shown as affected.
      const hit = [...c].filter(r => via.has(r)).length;
      if (hit === c.size) lost.add(id); else if (hit > 0) weak.add(id);
    }
    return { lost, weak };
  }, [region, lesion, carries, P]);

  // An edge leaving the cut (or leaving anything the cut took out) is dead;
  // an edge on the lit pathway carries signal; everything else is at rest.
  const edgeState = (a, b) => {
    if (cut && (a === lesion || cut.lost.has(a))) return 'is-cut';
    if (lit && lit.edges.has(`${a}>${b}`)) return 'is-lit';
    return '';
  };


  return (
    <figure className={`mmv mmv-map mmv-map--${region}`}>
      <svg viewBox={`0 0 ${P.width} ${P.height}`} role="img" aria-label={`${P.title}${focus ? ', ' + (NERVES[focus]?.name || focus) + ' highlighted' : ''}`}>
        <defs>
          <filter id={`mm-glow-${region}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {P.columns.map(c => c.label && (
          <text key={c.label} x={c.x} y={P.height - 6} className="mmv-col">{c.label.toUpperCase()}</text>
        ))}

        {/* Edges: faint base, then the lit path with signals flowing along it. */}
        {P.edges.map(([a, b]) => {
          const A = P.nodes[a], B = P.nodes[b];
          const st = edgeState(a, b);
          const mid = (A.x + B.x) / 2;
          const d = `M ${A.x} ${A.y} C ${mid} ${A.y}, ${mid} ${B.y}, ${B.x} ${B.y}`;
          return (
            <g key={`${a}>${b}`} className={`mmv-edge ${st}`}>
              <path d={d} className="mmv-edge-base" />
              {st.includes('is-lit') && <path d={d} className="mmv-edge-flow" />}
            </g>
          );
        })}

        {/* Nodes. */}
        {Object.entries(P.nodes).map(([id, n]) => {
          const isFocus = id === focus;
          const onPath = lit?.nodes.has(id);
          const state = cut?.lost.has(id) ? 'is-lost' : cut?.weak.has(id) ? 'is-weak' : '';
          const isLesion = id === lesion;
          const clickable = onPick && n.kind === 'nerve';
          const label = n.kind === 'nerve' ? NERVES[id]?.short || id : n.label;
          const cls = `mmv-node mmv-node--${n.kind}${n.minor ? ' is-minor' : ''}${onPath ? ' is-on' : ''}${isFocus ? ' is-focus' : ''}${isLesion ? ' is-lesion' : ''}${picked === id ? ' is-picked' : ''} ${state}${clickable ? ' is-click' : ''}`;
          const props = clickable ? { onClick: () => onPick(id), role: 'button', tabIndex: 0, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(id); } } } : {};

          if (n.kind === 'nerve') {
            const w = Math.max(64, label.length * 6.6 + 16);
            return (
              <g key={id} className={cls} transform={`translate(${n.x}, ${n.y})`} {...props}>
                <rect x={-w / 2} y="-11" width={w} height="22" rx="11" filter={isFocus ? `url(#mm-glow-${region})` : undefined} />
                <text y="4">{label}</text>
                {isLesion && <g className="mmv-scissors"><circle r="10" cx={w / 2 + 4} cy="-12" /><text x={w / 2 + 4} y="-8">✂</text></g>}
              </g>
            );
          }
          const r = n.kind === 'root' ? 15 : n.kind === 'div' ? 8 : 13;
          return (
            <g key={id} className={cls} transform={`translate(${n.x}, ${n.y})`}>
              <circle r={r} filter={isFocus || (onPath && showRoots && n.kind === 'root') ? `url(#mm-glow-${region})` : undefined} />
              <text y={n.kind === 'div' ? 3 : 4} className={n.kind === 'div' ? 'mmv-div-t' : ''}>{n.kind === 'cord' || n.kind === 'trunk' ? n.label[0] : label}</text>
              {(n.kind === 'cord' || n.kind === 'trunk') && <text y={r + 13} className="mmv-sub">{n.label}</text>}
              {isLesion && <g className="mmv-scissors"><circle r="10" cx="14" cy="-14" /><text x="14" y="-10">✂</text></g>}
            </g>
          );
        })}
      </svg>
      {focus && showRoots && NERVES[focus] && (
        <figcaption className="mmv-roots">
          {NERVES[focus].name}: <b>{rootsLabel(NERVES[focus].roots)}</b>
        </figcaption>
      )}
      {cut && (
        <div className="mmv-legend">
          <span className="mmv-leg mmv-leg--lost">lost</span>
          {cut.weak.size > 0 && <span className="mmv-leg mmv-leg--weak">still supplied by other roots — weakened</span>}
        </div>
      )}
    </figure>
  );
}

/** The nerve's muscles; lost ones struck through, the asked one glowing. */
export function MusclePanel({ nerve, lostAll = false, lost = [], spared = [], highlight = null }) {
  const on = useArrive(80);
  if (!NERVES[nerve]) return null;
  const list = NERVES[nerve].muscles;
  return (
    <div className="mmv-muscles">
      <p className="mmv-muscles-h">{NERVES[nerve].short} supplies</p>
      <ul>
        {list.map((m, i) => {
          const isLost = (lostAll || lost.includes(m)) && !spared.includes(m);
          return (
            <li
              key={m}
              className={`${isLost ? 'is-lost' : ''}${spared.includes(m) ? ' is-spared' : ''}${highlight === m ? ' is-hi' : ''}`}
              style={{ transitionDelay: `${0.06 * i}s`, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)' }}
            >
              <b>{MUSCLES[m].name}</b>
              <span>{MUSCLES[m].action}</span>
              {spared.includes(m) && <em>spared at this site</em>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const LADDER = ['C5', 'C6', 'C7', 'C8', 'T1', 'T4', 'T7', 'T10', 'L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3', 'S4'];

/** The roots as a column; the answer lights up. */
export function RootLadder({ root, revealed }) {
  const on = useArrive(80);
  return (
    <div className="mmv-ladder" aria-label={revealed ? `Root ${root}` : 'Spinal roots'}>
      {LADDER.map((r, i) => {
        const region = r[0];
        const hit = revealed && r === root;
        return (
          <span
            key={r}
            className={`mmv-rung mmv-rung--${region}${hit ? ' is-hit' : ''}`}
            style={{ transitionDelay: `${0.03 * i}s`, opacity: on ? 1 : 0 }}
          >
            {r}
          </span>
        );
      })}
    </div>
  );
}

export function SignCard({ sign }) {
  const s = SIGNS[sign];
  if (!s) return null;
  return (
    <div className="mmv-sign">
      <span className="mmv-sign-icon" aria-hidden="true">{s.icon}</span>
      <div>
        <b>{s.name}</b>
        <p>{s.desc}</p>
      </div>
    </div>
  );
}
