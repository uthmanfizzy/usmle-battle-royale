import { useMemo } from 'react';

const W = 540;
const CX = 270, CY = 270;
const OUTER_R   = 260;
const TRACK_R   = 214;   // radius of space centres
const CENTER_R  = 150;   // centre circle radius
const SP_R      = 12;    // regular space radius
const HQ_R      = 20;    // HQ space radius

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

// Board mirrors server: 6 sectors × 6 spaces, HQ is first of each sector
const BOARD = (() => {
  const b = [];
  for (let s = 0; s < 6; s++)
    for (let i = 0; i < 6; i++)
      b.push({ cat: CATS[(s + i) % 6], isHQ: i === 0 });
  return b;
})();

const rad      = d => d * Math.PI / 180;
const pt       = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const posAngle = pos => pos * 10 - 90;   // degrees, position 0 = top

function arcPath(rIn, rOut, a1, a2) {
  const [x1o, y1o] = pt(rOut, a1), [x2o, y2o] = pt(rOut, a2);
  const [x1i, y1i] = pt(rIn,  a1), [x2i, y2i] = pt(rIn,  a2);
  return `M${x1o},${y1o} A${rOut},${rOut} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${rIn},${rIn} 0 0,0 ${x1i},${y1i}Z`;
}

export default function TriviaBoard({ positions = {}, currentPlayerId, mySocketId, wedgeState = {} }) {
  // Group player tokens by board position
  const byPos = useMemo(() => {
    const m = {};
    Object.entries(positions).forEach(([pid, pos]) => {
      (m[pos] = m[pos] || []).push(pid);
    });
    return m;
  }, [positions]);

  const activePosNum = positions[currentPlayerId] ?? null;

  // Wedges earned by current player (to light up centre ring)
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
        <filter id="tbTokGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
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
            {/* Outer glow aura */}
            <circle cx={x} cy={y} r={HQ_R + 11} fill={c} fillOpacity={0.16} />
            {/* Dark ring border */}
            <circle cx={x} cy={y} r={HQ_R + 3}  fill="#0e0b24" stroke={c} strokeWidth="2.5" />
            {/* Main filled circle */}
            <circle cx={x} cy={y} r={HQ_R} fill={c} />
            {/* Inner highlight disc */}
            <circle cx={x} cy={y} r={HQ_R - 7} fill="rgba(255,255,255,0.25)" />
            {/* HQ label */}
            <text x={x} y={y + 1.5} textAnchor="middle" dominantBaseline="middle"
              fontSize="7.5" fontWeight="900" fill="white"
              style={{ fontFamily: 'sans-serif', letterSpacing: '0.5px' }}>
              HQ
            </text>
            {/* Active indicator ring */}
            {active && (
              <circle cx={x} cy={y} r={HQ_R + 15} fill="none"
                stroke="#ffffff" strokeWidth="2.5" opacity="0.55" />
            )}
          </g>
        );
      })}

      {/* ── Player tokens ── */}
      {Object.entries(byPos).flatMap(([posStr, pids]) =>
        pids.map((pid, idx) => {
          const pos = parseInt(posStr);
          const a = rad(posAngle(pos));
          const tR = TRACK_R - SP_R - 4;
          // Spread multiple tokens tangentially
          const off = (idx - (pids.length - 1) / 2) * 10;
          const tx = CX + tR * Math.cos(a) + off * Math.sin(a);
          const ty = CY + tR * Math.sin(a) - off * Math.cos(a);
          const isMe  = pid === mySocketId;
          const isCur = pid === currentPlayerId;
          return (
            <g key={pid} filter={isCur ? 'url(#tbTokGlow)' : undefined}>
              {isCur && (
                <circle cx={tx} cy={ty} r={11} fill="none"
                  stroke="#ffffff" strokeWidth="1.5" opacity="0.65" />
              )}
              <circle cx={tx} cy={ty} r={7.5}
                fill={isMe ? '#ffd700' : '#d4d4d4'}
                stroke={isCur ? '#ffffff' : '#444444'} strokeWidth="2" />
              {/* Small dot to distinguish "me" */}
              {isMe && <circle cx={tx} cy={ty} r={2.5} fill="rgba(0,0,0,0.5)" />}
            </g>
          );
        })
      )}

      {/* ── Centre circle (placeholder for question area) ── */}
      <circle cx={CX} cy={CY} r={CENTER_R + 10} fill="rgba(0,0,0,0.65)" />
      <circle cx={CX} cy={CY} r={CENTER_R}
        fill="url(#tbCenBg)"
        stroke="rgba(255,255,255,0.14)" strokeWidth="3"
        filter="url(#tbCenGlow)" />

      {/* ── Centre decorative wedge ring ── */}
      {CATS.map((cat, i) => {
        const earned = myWedges.has(cat);
        return (
          <path key={cat}
            d={arcPath(CENTER_R - 34, CENTER_R - 8, i * 60 - 90 - 27, i * 60 - 90 + 27)}
            fill={COLOR[cat]}
            fillOpacity={earned ? 1 : 0.3} />
        );
      })}
      {/* Wedge ring dividers */}
      {CATS.map((_, i) => {
        const [x1, y1] = pt(CENTER_R - 34, i * 60 - 90 - 27);
        const [x2, y2] = pt(CENTER_R - 8,  i * 60 - 90 - 27);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,0,0,0.55)" strokeWidth="2" />;
      })}

      {/* ── Centre inner dark circle ── */}
      <circle cx={CX} cy={CY} r={CENTER_R - 36} fill="#0c0820" />
      {/* Subtle inner ring */}
      <circle cx={CX} cy={CY} r={CENTER_R - 36} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

      {/* ── Centre title text ── */}
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
        style={{ fontFamily: 'sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>
        USMLE Edition
      </text>
    </svg>
  );
}
