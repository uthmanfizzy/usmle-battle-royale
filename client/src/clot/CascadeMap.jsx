import { useMemo } from 'react';
import { EDGES, NODES, NODE_BY_ID, PANELS } from './clotData';

/**
 * The cascade, drawn as one SVG every mode shares.
 *
 *   lit       Set of node ids that are "on" — glowing, with energy flowing
 *             along every edge whose two ends are both on
 *   hidden    Set of node ids drawn as empty "?" slots (Build mode)
 *   current   the slot that is pulsing, waiting to be filled
 *   overlay   (node) => bool — highlight these, dim the rest (Learn overlays)
 *   selected  Set of node ids the player has tapped (Drug Strike)
 *   effects   { [id]: 'inhibit' | 'activate' } — drug shields / boosts
 *   hit       Set of node ids to ring in red (Lab Detective)
 *   focus     the node whose card is open (Learn)
 *   sealed    show the fibrin mesh knitting itself round the clot
 *   lysing    show the clot dissolving (thrombolytic)
 *   shake     id of a slot to shake (wrong answer)
 */

const SIZE = {
  factor: { r: 25 },
  cofactor: { hw: 23, hh: 23 },
  trigger: { hw: 40, hh: 17 },
  end: { r: 34 },
  reg: { hw: 32, hh: 18 },
  kinin: { hw: 50, hh: 17 },
  lysis: { hw: 44, hh: 18 },
};

function sizeOf(n) {
  if (n.id === 'C1') return { hw: 38, hh: 17 };
  return SIZE[n.kind] || { r: 25 };
}

// Where a ray from the node centre in direction (dx, dy) leaves its shape.
function exitPoint(n, dx, dy) {
  const s = sizeOf(n);
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  let t;
  if (s.r) t = s.r + 3;
  else t = Math.min(ux ? (s.hw + 3) / Math.abs(ux) : Infinity, uy ? (s.hh + 3) / Math.abs(uy) : Infinity);
  return [n.x + ux * t, n.y + uy * t];
}

// Curved edges: control point pushed sideways by `bend` px.
const BENDS = { 'II>V': -70, 'II>VIII': -150, 'II>XI': 70, 'AT>X': -20, 'AT>II': 20, 'C1>XII': 40, 'XII>KAL': -30 };

function edgePath(e) {
  const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
  const bend = BENDS[`${e.from}>${e.to}`] || 0;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
  const [x1, y1] = exitPoint(a, cx - a.x, cy - a.y);
  const [x2, y2] = exitPoint(b, cx - b.x, cy - b.y);
  return bend ? `M${x1},${y1} Q${cx},${cy} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
}

const EDGE_CLASS = { act: 'cc-e-act', cof: 'cc-e-cof', fb: 'cc-e-fb', inh: 'cc-e-inh', lyse: 'cc-e-lyse' };
const MARKER = { act: 'url(#cc-arrow)', cof: 'url(#cc-arrow-cof)', fb: 'url(#cc-arrow-fb)', inh: 'url(#cc-bar)', lyse: 'url(#cc-bar-lyse)' };

// A fixed, hand-placed fibrin mesh around the clot (cx 740, cy 556).
const MESH = (() => {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    pts.push([740 + Math.cos(a) * 58, 556 + Math.sin(a) * 40]);
  }
  const lines = [];
  for (let i = 0; i < pts.length; i++) {
    lines.push([pts[i], pts[(i + 3) % pts.length]]);
    lines.push([pts[i], pts[(i + 4) % pts.length]]);
  }
  return lines;
})();

export default function CascadeMap({
  lit = new Set(), hidden = new Set(), current = null, overlay = null, selected = new Set(),
  effects = {}, hit = new Set(), focus = null, sealed = false, lysing = false, shake = null,
  onNode, flow = true, showPanels = true, hideKinin = false,
}) {
  const nodes = useMemo(() => NODES.filter(n => !(hideKinin && (n.path === 'kinin' || n.path === 'lysis'))), [hideKinin]);
  const ids = useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);
  const edges = useMemo(() => EDGES.filter(e => ids.has(e.from) && ids.has(e.to)), [ids]);
  const dim = (n) => overlay && !overlay(n);

  return (
    <svg className={`cc-map${lysing ? ' is-lysing' : ''}`} viewBox={hideKinin ? "0 0 700 620" : "0 0 1000 620"} role="img" aria-label="Coagulation cascade map">
      <defs>
        <marker id="cc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="cc-mk-act" />
        </marker>
        <marker id="cc-arrow-cof" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="cc-mk-cof" />
        </marker>
        <marker id="cc-arrow-fb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="cc-mk-fb" />
        </marker>
        <marker id="cc-bar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <rect x="4" y="0" width="2.4" height="10" className="cc-mk-inh" />
        </marker>
        <marker id="cc-bar-lyse" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <rect x="4" y="0" width="2.4" height="10" className="cc-mk-lyse" />
        </marker>
        <radialGradient id="cc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,240,200,0.95)" />
          <stop offset="55%" stopColor="rgba(255,90,90,0.55)" />
          <stop offset="100%" stopColor="rgba(255,60,80,0)" />
        </radialGradient>
        <radialGradient id="cc-clot" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ff6b7d" />
          <stop offset="60%" stopColor="#b3122f" />
          <stop offset="100%" stopColor="#5a0616" />
        </radialGradient>
      </defs>

      {showPanels && PANELS.filter(p => !(hideKinin && (p.id === 'kinin' || p.id === 'lysis'))).map(p => (
        <g key={p.id} className="cc-panel" style={{ '--pc': p.colour }}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="16" />
          {p.top
            ? <text x={p.x + p.w - 12} y={p.y + 20} textAnchor="end">{p.label}</text>
            : <text x={p.x + 12} y={p.y + p.h - 10}>{p.label}</text>}
        </g>
      ))}

      {/* Edges */}
      {edges.map(e => {
        const d = edgePath(e);
        const on = lit.has(e.from) && lit.has(e.to);
        const faded = overlay && !(overlay(NODE_BY_ID[e.from]) && overlay(NODE_BY_ID[e.to]));
        return (
          <g key={`${e.from}>${e.to}`} className={`cc-edge ${EDGE_CLASS[e.type]}${on ? ' is-on' : ''}${e.dashed ? ' is-dashed' : ''}${faded ? ' is-dim' : ''}`}>
            <path d={d} className="cc-e-line" markerEnd={MARKER[e.type]} />
            {on && flow && <path d={d} className="cc-e-flow" />}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const s = sizeOf(n);
        const isHidden = hidden.has(n.id);
        const cls = [
          'cc-node', `cc-k-${n.kind}`,
          lit.has(n.id) && 'is-lit',
          isHidden && 'is-hidden',
          current === n.id && 'is-current',
          dim(n) && 'is-dim',
          overlay && overlay(n) && 'is-over',
          selected.has(n.id) && 'is-sel',
          hit.has(n.id) && 'is-hit',
          focus === n.id && 'is-focus',
          effects[n.id] && `is-${effects[n.id]}`,
          shake === n.id && 'is-shake',
          n.vitK && 'is-vitk',
          onNode && 'is-click',
        ].filter(Boolean).join(' ');
        const label = isHidden ? '?' : n.label;
        return (
          <g key={n.id} className={cls} transform={`translate(${n.x} ${n.y})`}
             onClick={onNode ? () => onNode(n.id) : undefined}
             role={onNode ? 'button' : undefined} tabIndex={onNode ? 0 : undefined}
             aria-label={onNode ? (isHidden ? 'Empty slot' : `${n.label} — ${n.sub}`) : undefined}
             onKeyDown={onNode ? (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onNode(n.id); } } : undefined}>
            <g className="cc-node-in">
              {lit.has(n.id) && !isHidden && <circle r={(s.r || s.hw) + 22} className="cc-halo" fill="url(#cc-glow)" />}
              {n.vitK && !isHidden && <circle r={(s.r || s.hw) + 6} className="cc-vitk-ring" />}
              {n.kind === 'end' ? (
                <>
                  <circle r={s.r} className="cc-shape cc-clot" fill={lit.has(n.id) ? 'url(#cc-clot)' : undefined} />
                  <text className="cc-label" y="5">{label}</text>
                </>
              ) : s.r ? (
                <circle r={s.r} className="cc-shape" />
              ) : (
                <rect x={-s.hw} y={-s.hh} width={s.hw * 2} height={s.hh * 2} rx={n.kind === 'cofactor' ? 7 : s.hh} className="cc-shape" />
              )}
              {n.kind !== 'end' && (
                <text className={`cc-label${label.length > 4 ? ' is-long' : ''}`} y={label.length > 4 ? 4 : 6}>{label}</text>
              )}
              {n.id === 'II' && lit.has('II') && !isHidden && <text className="cc-tag" y="42">Thrombin</text>}
              {n.id === 'I' && lit.has('I') && !isHidden && <text className="cc-tag" y="42">Fibrin</text>}
              {effects[n.id] === 'inhibit' && (
                <g className="cc-shield"><circle r={(s.r || s.hw) + 9} /><path d="M-9,-9 L9,9 M9,-9 L-9,9" /></g>
              )}
              {effects[n.id] === 'activate' && (
                <g className="cc-boost"><circle r={(s.r || s.hw) + 9} /><text y="-30">＋</text></g>
              )}
            </g>
          </g>
        );
      })}

      {sealed && (
        <g className="cc-mesh">
          {MESH.map(([[x1, y1], [x2, y2]], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} style={{ animationDelay: `${i * 45}ms` }} />
          ))}
        </g>
      )}
    </svg>
  );
}
