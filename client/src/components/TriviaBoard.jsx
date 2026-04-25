import { useState, useEffect, useRef, useMemo } from 'react';

const W = 540;
const CX = 270, CY = 270;
const OUTER_R   = 260;
const TRACK_R   = 214;
const CENTER_R  = 150;
const SP_R      = 12;
const HQ_R      = 20;

const CATS = [
  'cardiology','neurology','pharmacology',
  'microbiology','biochemistry','biostatistics',
];
const COLOR = {
  cardiology:    '#e74c3c',
  neurology:     '#3498db',
  pharmacology:  '#f1c40f',
  microbiology:  '#2ecc71',
  biochemistry:  '#ff4b8b',
  biostatistics: '#9b59b6',
};

// Player piece colours: white, red, blue, green
const PIECE_COLORS = ['#f0f0f0', '#ff4444', '#4fa3e8', '#44cc66'];

// Corner positions (outside circular board, in SVG corners)
const CORNERS = [
  { x: 52,  y: 52  },  // P1 top-left
  { x: 488, y: 52  },  // P2 top-right
  { x: 52,  y: 488 },  // P3 bottom-left
  { x: 488, y: 488 },  // P4 bottom-right
];

const BOARD = (() => {
  const b = [];
  for (let s = 0; s < 6; s++)
    for (let i = 0; i < 6; i++)
      b.push({ cat: CATS[(s + i) % 6], isHQ: i === 0 });
  return b;
})();

const rad      = d => d * Math.PI / 180;
const pt       = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const posAngle = pos => pos * 10 - 90;

function arcPath(rIn, rOut, a1, a2) {
  const [x1o, y1o] = pt(rOut, a1), [x2o, y2o] = pt(rOut, a2);
  const [x1i, y1i] = pt(rIn,  a1), [x2i, y2i] = pt(rIn,  a2);
  return `M${x1o},${y1o} A${rOut},${rOut} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${rIn},${rIn} 0 0,0 ${x1i},${y1i}Z`;
}

// Pie segment path centred at origin
function segPath(r, i) {
  const a1 = rad(i * 60 - 90), a2 = rad((i + 1) * 60 - 90);
  const sr = r - 1.5;
  return `M0,0 L${sr * Math.cos(a1)},${sr * Math.sin(a1)} A${sr},${sr} 0 0,1 ${sr * Math.cos(a2)},${sr * Math.sin(a2)} Z`;
}

// Reusable pie token rendered at origin — wrap in <g transform="translate(x,y)">
function PieToken({ r = 14, pieceColor = '#f0f0f0', wedges = [], isActive = false }) {
  const sw = Math.max(2, r * 0.16);
  return (
    <g>
      {/* Active glow rings */}
      {isActive && (
        <>
          <circle r={r + 9}  fill={pieceColor} fillOpacity={0.15} className="tb-tok-pulse" />
          <circle r={r + 4}  fill="none" stroke={pieceColor} strokeWidth={1.5} opacity={0.55} className="tb-tok-pulse" />
        </>
      )}
      {/* Dark base */}
      <circle r={r} fill="#080615" />
      {/* Wedge segments */}
      {CATS.map((cat, i) => (
        <path key={cat}
          d={segPath(r, i)}
          fill={COLOR[cat]}
          fillOpacity={wedges.includes(cat) ? 0.95 : 0.08}
          style={{ transition: 'fill-opacity 0.45s ease' }}
        />
      ))}
      {/* Outer ring in piece colour */}
      <circle r={r} fill="none" stroke={pieceColor} strokeWidth={sw}
        style={{ filter: isActive ? `drop-shadow(0 0 ${r * 0.35}px ${pieceColor})` : 'none',
                 transition: 'filter 0.3s' }}
      />
      {/* Centre dot */}
      <circle r={r * 0.22} fill={pieceColor} opacity={0.9} />
    </g>
  );
}

export default function TriviaBoard({
  positions = {},
  currentPlayerId,
  mySocketId,
  wedgeState = {},
  playerOrder = [],
}) {
  // ── Animation state ───────────────────────────────────────────────────────
  const [displayPos, setDisplayPos] = useState(positions);
  const prevPosRef  = useRef(positions);
  const timersRef   = useRef([]);

  useEffect(() => {
    const prev = prevPosRef.current;
    prevPosRef.current = positions;

    // Clear pending animation steps
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const movers = Object.entries(positions).filter(
      ([pid, p]) => prev[pid] !== undefined && prev[pid] !== p
    );

    if (movers.length === 0) {
      setDisplayPos(positions);
      return;
    }

    // Animate movers step-by-step around the ring
    movers.forEach(([pid, finalPos]) => {
      const steps = [];
      let cur = prev[pid] ?? 0;
      while (cur !== finalPos) {
        cur = (cur + 1) % 36;
        steps.push(cur);
      }
      steps.forEach((stepPos, idx) => {
        const t = setTimeout(
          () => setDisplayPos(p => ({ ...p, [pid]: stepPos })),
          (idx + 1) * 160
        );
        timersRef.current.push(t);
      });
    });

    // Non-movers update immediately
    const moverSet = new Set(movers.map(([pid]) => pid));
    setDisplayPos(p => {
      const next = { ...p };
      Object.entries(positions).forEach(([pid, pos]) => {
        if (!moverSet.has(pid)) next[pid] = pos;
      });
      return next;
    });

    return () => timersRef.current.forEach(clearTimeout);
  }, [positions]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const pieceColorOf = useMemo(() => {
    const m = {};
    playerOrder.forEach(({ id }, i) => { m[id] = PIECE_COLORS[i % PIECE_COLORS.length]; });
    return m;
  }, [playerOrder]);

  const getWedges = pid => wedgeState?.[pid]?.wedges || [];

  const byPos = useMemo(() => {
    const m = {};
    Object.entries(displayPos).forEach(([pid, pos]) => {
      (m[pos] = m[pos] || []).push(pid);
    });
    return m;
  }, [displayPos]);

  const activePosNum = displayPos[currentPlayerId] ?? null;

  const myWedges = useMemo(() => {
    if (!mySocketId || !wedgeState[mySocketId]) return new Set();
    return new Set(wedgeState[mySocketId].wedges || []);
  }, [wedgeState, mySocketId]);

  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="trivia-board-svg" aria-label="Trivia Pursuit game board">
      <defs>
        <radialGradient id="tbBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1e1340" />
          <stop offset="100%" stopColor="#070612" />
        </radialGradient>
        <radialGradient id="tbCenBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#150f2e" />
          <stop offset="100%" stopColor="#0a0720" />
        </radialGradient>
        <filter id="tbHqGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="tbCenGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#5b21b6" floodOpacity="0.65" />
        </filter>
        <filter id="tbActiveSpace">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* ── Board base ── */}
      <circle cx={CX} cy={CY} r={OUTER_R + 8} fill="url(#tbBg)" />
      <circle cx={CX} cy={CY} r={OUTER_R + 8} fill="none" stroke="#2d1f6e" strokeWidth="7" />
      <circle cx={CX} cy={CY} r={OUTER_R + 3} fill="none" stroke="#1a1047" strokeWidth="2" />

      {/* ── Sector colour fills ── */}
      {CATS.map((cat, i) => (
        <path key={cat}
          d={arcPath(CENTER_R + 2, OUTER_R, i * 60 - 95, i * 60 - 35)}
          fill={COLOR[cat]} fillOpacity={0.14} />
      ))}

      {/* ── Sector dividers ── */}
      {CATS.map((_, i) => {
        const [x1, y1] = pt(CENTER_R + 2, i * 60 - 95);
        const [x2, y2] = pt(OUTER_R, i * 60 - 95);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />;
      })}

      {/* ── Spokes: centre → HQ ── */}
      {CATS.map((cat, i) => {
        const [x1, y1] = pt(CENTER_R + 6, i * 60 - 90);
        const [x2, y2] = pt(TRACK_R - HQ_R - 5, i * 60 - 90);
        return <line key={cat} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={COLOR[cat]} strokeWidth="3.5" strokeOpacity="0.55" strokeLinecap="round" />;
      })}

      {/* ── Track ring (shadow + highlight) ── */}
      <circle cx={CX} cy={CY} r={TRACK_R} fill="none"
        stroke="rgba(0,0,0,0.6)" strokeWidth={SP_R * 2 + 12} />
      <circle cx={CX} cy={CY} r={TRACK_R} fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth={SP_R * 2 + 6} />

      {/* ── Regular spaces (non-HQ) ── */}
      {BOARD.map((sp, pos) => {
        if (sp.isHQ) return null;
        const [x, y] = pt(TRACK_R, posAngle(pos));
        const c = COLOR[sp.cat];
        const active = pos === activePosNum;
        return (
          <g key={pos} filter={active ? 'url(#tbActiveSpace)' : undefined}>
            <circle cx={x} cy={y} r={SP_R + 2.5} fill="rgba(0,0,0,0.5)" />
            <circle cx={x} cy={y} r={SP_R} fill={c} fillOpacity={active ? 1 : 0.9}
              stroke={active ? '#ffffff' : 'rgba(0,0,0,0.4)'}
              strokeWidth={active ? 3 : 1} />
          </g>
        );
      })}

      {/* ── HQ spaces ── */}
      {CATS.map((cat, i) => {
        const pos = i * 6;
        const [x, y] = pt(TRACK_R, posAngle(pos));
        const c = COLOR[cat];
        const active = pos === activePosNum;
        return (
          <g key={cat} filter="url(#tbHqGlow)">
            <circle cx={x} cy={y} r={HQ_R + 11} fill={c} fillOpacity={0.16} />
            <circle cx={x} cy={y} r={HQ_R + 3}  fill="#0e0b24" stroke={c} strokeWidth="2.5" />
            <circle cx={x} cy={y} r={HQ_R} fill={c} />
            <circle cx={x} cy={y} r={HQ_R - 7} fill="rgba(255,255,255,0.25)" />
            <text x={x} y={y + 1.5} textAnchor="middle" dominantBaseline="middle"
              fontSize="7.5" fontWeight="900" fill="white"
              style={{ fontFamily: 'sans-serif', letterSpacing: '0.5px' }}>
              HQ
            </text>
            {active && (
              <circle cx={x} cy={y} r={HQ_R + 15} fill="none"
                stroke="#ffffff" strokeWidth="2.5" opacity="0.55" />
            )}
          </g>
        );
      })}

      {/* ── On-board player pieces (animated) ── */}
      {Object.entries(byPos).flatMap(([posStr, pids]) =>
        pids.map((pid, idx) => {
          const pos = parseInt(posStr);
          const a   = rad(posAngle(pos));
          // Spread tangentially when multiple pieces on same space
          const off = (idx - (pids.length - 1) / 2) * 14;
          const tx  = CX + TRACK_R * Math.cos(a) + off * Math.sin(a);
          const ty  = CY + TRACK_R * Math.sin(a) - off * Math.cos(a);
          const pc  = pieceColorOf[pid] || '#f0f0f0';
          const isActive = pid === currentPlayerId;
          return (
            <g key={pid} transform={`translate(${tx.toFixed(2)},${ty.toFixed(2)})`}>
              <PieToken r={13} pieceColor={pc} wedges={getWedges(pid)} isActive={isActive} />
            </g>
          );
        })
      )}

      {/* ── Centre circle ── */}
      <circle cx={CX} cy={CY} r={CENTER_R + 10} fill="rgba(0,0,0,0.65)" />
      <circle cx={CX} cy={CY} r={CENTER_R}
        fill="url(#tbCenBg)"
        stroke="rgba(255,255,255,0.14)" strokeWidth="3"
        filter="url(#tbCenGlow)" />

      {/* ── Centre decorative wedge ring (lights up with my earned wedges) ── */}
      {CATS.map((cat, i) => {
        const earned = myWedges.has(cat);
        return (
          <path key={cat}
            d={arcPath(CENTER_R - 34, CENTER_R - 8, i * 60 - 90 - 27, i * 60 - 90 + 27)}
            fill={COLOR[cat]}
            fillOpacity={earned ? 1 : 0.3} />
        );
      })}
      {CATS.map((_, i) => {
        const [x1, y1] = pt(CENTER_R - 34, i * 60 - 90 - 27);
        const [x2, y2] = pt(CENTER_R - 8,  i * 60 - 90 - 27);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,0,0,0.55)" strokeWidth="2" />;
      })}
      <circle cx={CX} cy={CY} r={CENTER_R - 36} fill="#0c0820" />
      <circle cx={CX} cy={CY} r={CENTER_R - 36} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <text x={CX} y={CY - 18} textAnchor="middle" dominantBaseline="middle"
        fontSize="17" fontWeight="900" fill="white"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: '3.5px' }}>
        TRIVIA
      </text>
      <text x={CX} y={CY + 4} textAnchor="middle" dominantBaseline="middle"
        fontSize="17" fontWeight="900" fill="white"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: '3.5px' }}>
        PURSUIT
      </text>
      <text x={CX} y={CY + 24} textAnchor="middle" dominantBaseline="middle"
        fontSize="9.5" fill="rgba(255,255,255,0.45)"
        style={{ fontFamily: 'sans-serif', letterSpacing: '2px' }}>
        USMLE Edition
      </text>

      {/* ── Corner player wedge panels ── */}
      {playerOrder.slice(0, 4).map(({ id, username }, idx) => {
        const c     = PIECE_COLORS[idx % PIECE_COLORS.length];
        const ws    = getWedges(id);
        const isCur = id === currentPlayerId;
        const isMe  = id === mySocketId;
        const { x, y } = CORNERS[idx];
        const PR = 22;   // corner pie radius
        const BW = PR + 8;  // background half-width

        // Label: truncate long names
        const label = isMe ? 'You' : (username.length > 6 ? username.slice(0, 5) + '…' : username);

        return (
          <g key={`cp-${id}`} transform={`translate(${x},${y})`}>
            {/* Panel background */}
            <rect x={-BW} y={-BW} width={BW * 2} height={BW * 2 + 16}
              rx="7" ry="7"
              fill="rgba(8,6,20,0.82)"
              stroke={isCur ? c : 'rgba(255,255,255,0.12)'}
              strokeWidth={isCur ? 1.8 : 1} />
            {/* Pie token */}
            <PieToken r={PR} pieceColor={c} wedges={ws} isActive={isCur} />
            {/* Player name */}
            <text x={0} y={PR + 10} textAnchor="middle" dominantBaseline="middle"
              fontSize="8.5" fontWeight={isMe ? '700' : '500'}
              fill={isMe ? c : 'rgba(255,255,255,0.72)'}
              style={{ fontFamily: 'sans-serif' }}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
