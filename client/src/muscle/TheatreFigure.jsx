import { useEffect, useRef, useState } from 'react';

/**
 * Injury Theatre — the actors.
 *
 *   Body     a standing figure, front view, whose AFFECTED arm (on the
 *            viewer's right) and leg are articulated: shoulder abduction,
 *            elbow flexion, wrist flexion, forearm pronation, a coarse hand
 *            shape, and the foot. Every joint is a group rotated about the
 *            joint's own point, and every rotation is a CSS transition, so a
 *            change of pose IS the animation.
 *   Hand     a close-up of the affected hand, palm toward you, fingers up —
 *            each finger curls on its own, so a full claw, an ulnar claw and
 *            the hand of benediction look different.
 *   Foot     a side view of the lower leg and foot, for foot drop and the
 *            steppage gait.
 *   Back     the back, both scapulae, for winging.
 *
 * Overlays (`overlay`) draw the injury itself on the body: hands pulling the
 * head sideways at delivery, an arm yanked upward, a crack through the
 * humerus, a bumper meeting the knee.
 */

const SKIN = '#e7b996';
const SKIN_DK = '#c8916a';
const SHIRT = '#5b8bd6';

const ARM_L = 82, FORE_L = 74;

/**
 * Joint angles glide to each new pose. They are SVG transform ATTRIBUTES
 * (rotate(angle cx cy) pivots exactly on the joint, whatever the viewBox or
 * the parent's scaling) — CSS transform-origin on SVG resolves against the
 * viewBox origin, which put every joint's pivot in the wrong place once
 * scenes used different frames. Attributes cannot CSS-transition, so the
 * angles are tweened here instead.
 */
const JOINTS = ['abd', 'elbow', 'wrist', 'head', 'foot'];
function useTweenedPose(p, ms = 750) {
  const [v, setV] = useState(p);
  const cur = useRef(p);
  const key = JOINTS.map(k => p[k]).join('|');
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { cur.current = p; setV(p); return undefined; }
    const from = cur.current;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const nv = { ...p };
      for (const j of JOINTS) nv[j] = (from[j] ?? p[j]) + (p[j] - (from[j] ?? p[j])) * e;
      cur.current = nv;
      setV(nv);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { ...p, ...Object.fromEntries(JOINTS.map(j => [j, v[j] ?? p[j]])) };
}

const FRAMES = { tall: "0 -70 350 500", normal: "30 36 300 392", baby: "56 76 236 318" };

export function Body({ pose, overlay, baby = false, struggling = false, mark, frame }) {
  const target = { abd: 8, elbow: 0, wrist: 0, pron: false, hand: 'open', head: 0, foot: 0, deltoidFlat: false, ...pose };
  const p = useTweenedPose(target);
  const sx = 214, sy = 150;          // affected shoulder
  return (
    <svg viewBox={FRAMES[frame || (baby ? "baby" : "normal")]} className={`tf-body${baby ? ' is-baby' : ''}${struggling ? ' is-struggling' : ''}`} role="img" aria-label="The patient">
      <defs>
        <radialGradient id="tf-flash" r="0.5"><stop offset="0" stopColor="#fff6c4" /><stop offset="0.45" stopColor="#ff6b6b" stopOpacity="0.85" /><stop offset="1" stopColor="#ff6b6b" stopOpacity="0" /></radialGradient>
      </defs>
      <g className="tf-fig" transform={baby ? 'translate(48 92) scale(0.7)' : undefined}>
        {/* legs */}
        <rect x="120" y="290" width="30" height="118" rx="12" fill="#3d4a66" />
        <g className="tf-leg">
          <rect x="170" y="290" width="30" height="118" rx="12" fill="#3d4a66" />
          <g className="tf-foot" transform={`rotate(${p.foot} 185 404)`}>
            <path d="M172,400 L212,400 Q222,402 222,412 L172,414 Z" fill="#2c2c34" />
          </g>
        </g>
        <path d="M126,412 L114,414 Q104,412 106,402 L150,400 L150,414 Z" fill="#2c2c34" />

        {/* torso */}
        <path d="M108,148 Q160,132 212,148 L206,298 L114,298 Z" fill={SHIRT} />
        {/* the normal arm, for comparison */}
        <g>
          <rect x="94" y="148" width="22" height={ARM_L} rx="11" fill={SHIRT} transform="rotate(8 106 150)" />
          <rect x="84" y="222" width="20" height={FORE_L} rx="10" fill={SKIN} transform="rotate(8 106 150)" />
          <ellipse cx="88" cy="306" rx="11" ry="15" fill={SKIN} transform="rotate(8 106 150)" />
        </g>

        {/* the affected arm */}
        <g className="tf-arm" transform={`rotate(${-p.abd} ${sx} ${sy})`}>
          <rect x={sx - 11} y={sy - 2} width="22" height={ARM_L} rx="11" fill={SHIRT} />
          {p.deltoidFlat && <rect x={sx - 6} y={sy - 4} width="14" height="26" rx="6" fill="rgba(0,0,0,0.18)" />}
          <g className="tf-fore" transform={`rotate(${p.elbow} ${sx} ${sy + ARM_L - 6})`}>
            <rect x={sx - 10} y={sy + ARM_L - 10} width="20" height={FORE_L} rx="10" fill={SKIN} />
            <g className="tf-wrist" transform={`rotate(${p.wrist} ${sx} ${sy + ARM_L + FORE_L - 12})`}>
              <MiniHand x={sx} y={sy + ARM_L + FORE_L - 12} shape={p.hand} pron={p.pron} />
            </g>
          </g>
        </g>

        {/* head */}
        <g className="tf-head" transform={`rotate(${p.head} 160 140)`}>
          <rect x="150" y="116" width="20" height="26" rx="8" fill={SKIN} />
          <circle cx="160" cy="92" r={baby ? 36 : 30} fill={SKIN} />
          <path d={baby ? 'M126,84 Q160,46 194,84 Q176,66 160,66 Q142,66 126,84 Z' : 'M131,86 Q132,56 160,56 Q188,56 189,86 Q182,68 160,68 Q138,68 131,86 Z'} fill="#3a2a20" />
          <circle cx="149" cy="94" r="3.4" fill="#2a1d14" />
          <circle cx="171" cy="94" r="3.4" fill="#2a1d14" />
          <path className="tf-mouth" d={struggling ? 'M150,112 Q160,106 170,112' : 'M151,108 Q160,114 169,108'} stroke="#7a3b2e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {struggling && <path d="M184,74 Q180,82 184,86 Q188,82 184,74 Z" fill="#8ecae6" className="tf-sweat" />}
        </g>

        <Overlay kind={overlay} sx={sx} sy={sy} pose={p} />
      </g>
      {mark && <text x={frame === "tall" ? 292 : baby ? 250 : 286} y={frame === "tall" ? -20 : baby ? 120 : 92} className={`tf-mark is-${mark}`}>{mark === 'ok' ? '✓' : '✗'}</text>}
    </svg>
  );
}

function MiniHand({ x, y, shape, pron }) {
  const back = pron;                         // pronated / internally rotated: the back of the hand faces you
  const fill = back ? SKIN_DK : SKIN;
  const fingers = { open: [1, 1, 1, 1], fist: [0.3, 0.3, 0.3, 0.3], claw: [0.45, 0.45, 0.45, 0.45], ulnar: [1, 1, 0.45, 0.45], bened: [1, 1, 0.3, 0.3], droop: [1, 1, 1, 1] }[shape] || [1, 1, 1, 1];
  return (
    <g>
      <rect x={x - 11} y={y} width="22" height="20" rx="7" fill={fill} />
      {fingers.map((f, i) => (
        <rect key={i} x={x - 10 + i * 5.2} y={y + 17} width="4.6" height={16 * f} rx="2.3" fill={fill} className="tf-finger" />
      ))}
      <rect x={back ? x + 8 : x - 15} y={y + 4} width="5" height="13" rx="2.5" fill={fill} />
    </g>
  );
}

function Overlay({ kind, sx, sy, pose }) {
  if (!kind) return null;
  // Where the joints are for this pose: the upper arm points along
  // (sin abd, cos abd) from the shoulder; the forearm along (sin(abd − elbow), cos(abd − elbow)).
  const rad = (d) => (d * Math.PI) / 180;
  const ua = rad(pose.abd), fa = rad(pose.abd - pose.elbow);
  const elbow = [sx + Math.sin(ua) * (ARM_L - 6), sy + Math.cos(ua) * (ARM_L - 6)];
  const midHum = [sx + Math.sin(ua) * ARM_L * 0.48, sy + Math.cos(ua) * ARM_L * 0.48];
  const hand = [elbow[0] + Math.sin(fa) * (FORE_L + 8), elbow[1] + Math.cos(fa) * (FORE_L + 8)];
  const flash = (x, y, r = 26) => <circle cx={x} cy={y} r={r} fill="url(#tf-flash)" className="tf-flash" />;
  const arrow = (x1, y1, x2, y2) => (
    <g className="tf-arrow">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${x2},${y2} l${(x1 - x2) * 0.25 - (y1 - y2) * 0.18},${(y1 - y2) * 0.25 + (x1 - x2) * 0.18} M${x2},${y2} l${(x1 - x2) * 0.25 + (y1 - y2) * 0.18},${(y1 - y2) * 0.25 - (x1 - x2) * 0.18}`} />
    </g>
  );
  switch (kind) {
    case 'delivery': return (
      <g>
        {/* The mother’s pubic bone, catching the baby’s shoulder (shoulder dystocia). */}
        <path d="M178,112 Q214,94 262,104 L262,120 Q216,112 186,126 Z" fill="#efe6d2" stroke="#bfae8c" strokeWidth="2" />
        <text x="226" y="96" className="tf-label tf-label--sm">pubic bone</text>
        {/* The obstetrician’s gloved hands and sleeves, pulling the head away. */}
        <g className="tf-glove">
          <rect x="38" y="70" width="76" height="20" rx="10" fill="#4f9d8f" transform="rotate(-8 76 80)" />
          <rect x="42" y="98" width="76" height="20" rx="10" fill="#4f9d8f" transform="rotate(6 80 108)" />
          <ellipse cx="122" cy="80" rx="16" ry="12" fill="#9fd3c7" /><ellipse cx="126" cy="106" rx="15" ry="11" fill="#9fd3c7" />
        </g>
        {arrow(150, 70, 84, 54)}
        {flash(196, 132, 30)}
        <text x="214" y="120" className="tf-label">neck stretched from the shoulder</text>
      </g>
    );
    case 'upward': return (
      <g>
        {/* The hand of an arm abducted 150° sits ~0.5·L right and ~0.87·L up of the shoulder. */}
        <g className="tf-glove"><path d={`M${sx + 78},${sy - 168} q14,-26 28,-2 l-4,18 q-12,8 -24,-16 Z`} fill="#7a5a3a" /><line x1={sx + 92} y1={sy - 176} x2={sx + 120} y2={sy - 210} stroke="#6b4a2a" strokeWidth="7" strokeLinecap="round" /></g>
        {arrow(sx + 112, sy - 120, sx + 112, sy - 200)}
        {flash(sx - 8, sy + 10, 32)}
        <text x="6" y="10" className="tf-label">arm wrenched upward — grabbing a branch to break a fall</text>
      </g>
    );
    case 'humerus': return (
      <g>
        <path d={`M${midHum[0] - 14},${midHum[1] - 4} l10,4 l-6,6 l12,4`} stroke="#fff" strokeWidth="3" fill="none" className="tf-crack" />
        {flash(midHum[0], midHum[1], 30)}
        <text x={midHum[0] + 22} y={midHum[1] + 4} className="tf-label">mid-shaft fracture</text>
      </g>
    );
    case 'dislocation': return (
      <g>{flash(sx, sy, 34)}{arrow(sx + 50, sy + 40, sx + 18, sy + 18)}<text x="232" y={sy - 20} className="tf-label">shoulder dislocates</text></g>
    );
    case 'foosh': return (
      <g>{flash(elbow[0], elbow[1], 30)}{flash(hand[0], hand[1], 18)}<text x={elbow[0] + 20} y={elbow[1] - 22} className="tf-label">falls on an outstretched hand — the elbow breaks</text></g>
    );
    case 'elbow-medial': return (
      <g>{flash(elbow[0] - 10, elbow[1], 26)}<text x={elbow[0] + 16} y={elbow[1] - 22} className="tf-label">blow to the medial elbow</text></g>
    );
    case 'hamate': return (
      <g>{flash(hand[0], hand[1], 26)}<text x={hand[0] - 150} y={hand[1] + 40} className="tf-label">heel of the hand — hook of hamate</text></g>
    );
    case 'bumper': return (
      <g>
        <rect x="236" y="330" width="80" height="26" rx="6" fill="#9aa4b2" className="tf-bumper" />
        {flash(204, 340, 28)}
        <text x="214" y="318" className="tf-label">bumper strikes the fibular neck</text>
      </g>
    );
    case 'surgery': return (
      <g>
        <path d="M236,222 l40,-24 l6,6 l-40,24 Z" fill="#cfd6df" className="tf-scalpel" />
        <line x1="204" y1="200" x2="206" y2="250" stroke="#ff6b6b" strokeWidth="3" strokeDasharray="5 4" />
        {flash(206, 224, 24)}
        <text x="18" y="232" className="tf-label">axillary surgery on the lateral chest wall</text>
      </g>
    );
    default: return null;
  }
}

// ── Close-up: the hand ────────────────────────────────────────────────────
const FINGERS = [
  { id: 'index', x: 60, len: 84 },
  { id: 'middle', x: 85, len: 92 },
  { id: 'ring', x: 110, len: 86 },
  { id: 'little', x: 133, len: 68 },
];
const SPREAD = { index: -13, middle: -4, ring: 5, little: 14 };

/** state: { index, middle, ring, little } curls 0 (straight) … 1 (curled);
 *  spread: bool; thumb: 'rest' | 'oppose' | 'froment'; thenarWasted: bool;
 *  hypothenarWasted: bool. */
export function Hand({ state = {}, struggling }) {
  const s = { index: 0, middle: 0, ring: 0, little: 0, spread: false, thumb: 'rest', ...state };
  return (
    <svg viewBox={s.profile ? "0 0 360 250" : "0 0 200 250"} className={`tf-hand${struggling ? ' is-struggling' : ''}`} role="img" aria-label="Close-up of the hand">
      <rect x="62" y="200" width="78" height="50" rx="16" fill={SKIN} />
      <rect x="48" y="118" width="104" height="96" rx="26" fill={SKIN} />
      <ellipse cx="66" cy="178" rx={s.thenarWasted ? 9 : 19} ry={s.thenarWasted ? 16 : 26} fill={SKIN_DK} opacity={s.thenarWasted ? 0.35 : 0.55} className="tf-thenar" />
      <ellipse cx="138" cy="176" rx={s.hypothenarWasted ? 7 : 13} ry="24" fill={SKIN_DK} opacity={s.hypothenarWasted ? 0.3 : 0.45} />
      {FINGERS.map(f => {
        const c = s[f.id];
        // A curled finger is seen end-on: foreshortened, knuckles forward.
        const h = f.len * (1 - 0.68 * c);
        return (
          <g key={f.id} className="tf-hfinger" style={{ transform: `rotate(${s.spread ? SPREAD[f.id] : 0}deg)`, transformOrigin: `${f.x + 10}px 124px` }}>
            <rect x={f.x} width="21" rx="10.5" fill={SKIN} className="tf-hfinger-r" style={{ y: 124 - h, height: h + 8 }} />
            {c > 0.2 && <circle cx={f.x + 10.5} cy={124 - h + 8} r="8.5" fill={SKIN_DK} opacity={0.35 + 0.4 * c} />}
            {c < 0.2 && <rect x={f.x + 4} y={124 - h + 3} width="13" height="10" rx="4" fill="#f6dcc8" />}
          </g>
        );
      })}
      <g className="tf-thumb" style={{ transform: `rotate(${s.thumb === 'oppose' ? 62 : s.thumb === 'froment' ? 18 : 0}deg)`, transformOrigin: '60px 196px' }}>
        <rect x="18" y={s.thumb === 'froment' ? 150 : 132} width="22" height={s.thumb === 'froment' ? 52 : 70} rx="11" fill={SKIN} transform="rotate(-28 40 200)" />
      </g>
      {s.thumb === 'froment' && <rect x="20" y="138" width="60" height="6" rx="2" fill="#f5f0e6" stroke="#ccc" transform="rotate(-20 50 140)" />}
      {s.profile && <FingerProfile kind={s.profile} />}
    </svg>
  );
}

/**
 * One finger seen from the side — the only view in which a claw is obvious:
 * the knuckle (MCP) bent BACK, the finger joints (PIP, DIP) curled. Angles
 * are degrees of flexion (negative = hyperextension), each phalanx rotating
 * about its own joint and carrying the ones beyond it.
 */
const PROFILES = {
  straight: [0, 0, 0],
  claw: [-26, 82, 52],
  fist: [82, 96, 66],
  drop: [58, 12, 6],
  try: [-8, 48, 30],
};
const PROFILE_TEXT = {
  straight: 'MCP, PIP, DIP straight',
  claw: 'MCP bent BACK · PIP & DIP curled',
  fist: 'MCP, PIP, DIP all flexed',
  drop: 'MCP flexed — cannot extend',
  try: 'straining to straighten…',
};
function FingerProfile({ kind }) {
  const target = PROFILES[kind] || PROFILES.straight;
  const a = useTweenedPose({ abd: target[0], elbow: target[1], wrist: target[2], head: 0, foot: 0 });
  const [mcp, pip, dip] = [a.abd, a.elbow, a.wrist];
  const x0 = 236, y0 = 120;          // the MCP joint; the back of the hand runs off to the left
  // Nested SVG transform attributes: each joint pivots exactly and carries
  // the joints beyond it. Flexion turns the finger DOWN (toward the palm).
  return (
    <g>
      <rect x="206" y="40" width="148" height="186" rx="14" fill="rgba(0,0,0,0.28)" />
      <text x="280" y="62" className="tf-prof-h">from the side</text>
      <line x1="206" y1="128" x2={x0} y2={y0} stroke={SKIN_DK} strokeWidth="24" strokeLinecap="round" />
      <g transform={`translate(${x0} ${y0}) rotate(${mcp})`}>
        <line x1="0" y1="0" x2="44" y2="0" stroke={SKIN} strokeWidth="17" strokeLinecap="round" />
        <g transform={`translate(44 0) rotate(${pip})`}>
          <line x1="0" y1="0" x2="30" y2="0" stroke={SKIN} strokeWidth="15" strokeLinecap="round" />
          <g transform={`translate(30 0) rotate(${dip})`}>
            <line x1="0" y1="0" x2="22" y2="0" stroke={SKIN} strokeWidth="13" strokeLinecap="round" />
            <rect x="10" y="-8" width="11" height="5" rx="2" fill="#f6dcc8" />
            <circle cx="0" cy="0" r="4" fill="#ffd166" />
          </g>
          <circle cx="0" cy="0" r="4.5" fill="#ffd166" />
        </g>
        <circle cx="0" cy="0" r="5" fill="#ffd166" />
      </g>
      <text x="222" y="98" className="tf-prof-j">MCP</text>
      <text x="280" y="214" className="tf-prof-t">{PROFILE_TEXT[kind]}</text>
    </g>
  );
}

// ── Close-up: the foot, from the side ─────────────────────────────────────
export function Foot({ angle = 0, steppage = false, struggling }) {
  return (
    <svg viewBox="0 0 220 220" className={`tf-footv${steppage ? ' is-steppage' : ''}${struggling ? ' is-struggling' : ''}`} role="img" aria-label="Side view of the lower leg and foot">
      <rect x="0" y="196" width="220" height="24" fill="rgba(255,255,255,0.06)" />
      <g className="tf-shin">
        <rect x="90" y="10" width="36" height="150" rx="16" fill="#3d4a66" />
        <rect x="94" y="150" width="28" height="30" rx="10" fill={SKIN} />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '108px 172px', transition: 'transform 0.7s cubic-bezier(0.3, 0.9, 0.3, 1)' }}>
          <path d="M92,168 L112,166 L178,178 Q190,182 186,192 L96,194 Q86,192 88,180 Z" fill="#2c2c34" />
        </g>
      </g>
    </svg>
  );
}

// ── Close-up: the back ────────────────────────────────────────────────────
export function Back({ wing = false, pushing = false }) {
  return (
    <svg viewBox="0 0 220 220" className={`tf-back${pushing ? ' is-pushing' : ''}`} role="img" aria-label="The back and shoulder blades">
      <path d="M30,40 Q110,14 190,40 L180,210 L40,210 Z" fill={SKIN} />
      <line x1="110" y1="30" x2="110" y2="206" stroke={SKIN_DK} strokeWidth="3" strokeDasharray="4 6" />
      <path d="M58,60 L96,64 L84,138 Z" fill={SKIN_DK} opacity="0.6" />
      <g style={{ transform: wing ? 'translate(10px, -4px) rotate(-14deg)' : 'none', transformOrigin: '140px 64px', transition: 'transform 0.8s cubic-bezier(0.3, 1.4, 0.4, 1)' }}>
        <path d="M162,60 L124,64 L136,138 Z" fill={SKIN_DK} opacity="0.6" />
        {wing && <path d="M124,64 L136,138" stroke="#4a2c1d" strokeWidth="4" className="tf-wingedge" />}
      </g>
      {pushing && <rect x="0" y="0" width="220" height="8" fill="#9aa4b2" />}
    </svg>
  );
}
