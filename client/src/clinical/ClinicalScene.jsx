/**
 * Clinical · the animated people.
 *
 *   <Baby>    a baby lying on the examination couch, seen from above. What
 *             the case says about breathing is drawn: the rate sets the
 *             breathing speed, and recession, nasal flaring, head bobbing,
 *             snuffles and cyanosis switch on their own animations. With
 *             `onRegion` the body parts become hotspots for the examination
 *             tools, and `marks` pins a small icon where something was done.
 *   <Parent>  a parent from the waist up, who talks (mouth moves) while
 *             `talking` is on.
 *
 * Motion is transform and opacity only (see the Animation Perf note), and no
 * animated group carries an SVG transform attribute, because the CSS
 * transform would replace it.
 */

import './ClinicalScene.css';

export const BABY_REGIONS = [
  { id: 'head', label: 'Head and fontanelle' },
  { id: 'face', label: 'Face, eyes and nose' },
  { id: 'mouth', label: 'Mouth and throat' },
  { id: 'ears', label: 'Ears' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'hands', label: 'Arms and hands' },
  { id: 'legs', label: 'Legs, hips and feet' },
  // Not a spot on the body: offered as buttons beside the picture.
  { id: 'whole', label: 'The whole baby (from the end of the couch)', offBody: true },
  { id: 'skin', label: 'Skin all over', offBody: true },
];

const SKIN = { light: ['#f6d2b8', '#e7b596'], medium: ['#d9a77f', '#c48d64'], brown: ['#a8724d', '#8d5c3b'] };

export function Baby({ look = {}, onRegion = null, active = null, marks = {}, size = 'lg' }) {
  const rr = look.rr || 40;
  const breath = `${(60 / rr).toFixed(2)}s`;
  const [skin, shade] = SKIN[look.skin || 'light'];
  const lips = look.cyanosis ? '#8a8fc4' : '#d9787a';
  const hot = (id) => (onRegion ? {
    className: `clb-hot${active ? ' is-armed' : ''}`,
    onClick: () => onRegion(id),
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRegion(id); } },
    'aria-label': BABY_REGIONS.find(r => r.id === id)?.label,
  } : { className: 'clb-hot is-off' });
  const Mark = ({ x, y, id }) => (marks[id] ? (
    <g className="clb-mark">
      <circle cx={x} cy={y} r="11" />
      <text x={x} y={y + 4} textAnchor="middle">{marks[id]}</text>
    </g>
  ) : null);

  return (
    <svg className={`clb clb--${size}`} viewBox="0 0 320 400" style={{ '--breath': breath }} aria-label="The baby on the examination couch">
      {/* couch and blanket */}
      <rect x="20" y="10" width="280" height="380" rx="26" className="clb-couch" />
      <rect x="44" y="34" width="232" height="340" rx="22" className="clb-blanket" />
      <g className="clb-blanket-dots">{Array.from({ length: 18 }, (_, i) => <circle key={i} cx={64 + (i % 6) * 38} cy={60 + Math.floor(i / 6) * 120} r="3" />)}</g>

      {/* legs, frog position */}
      <g className="clb-legs">
        <path d="M128 268 C 92 290, 84 318, 104 340" className="clb-limb" stroke={skin} />
        <path d="M192 268 C 228 290, 236 318, 216 340" className="clb-limb" stroke={skin} />
        <ellipse cx="104" cy="346" rx="13" ry="9" fill={skin} />
        <ellipse cx="216" cy="346" rx="13" ry="9" fill={skin} />
      </g>
      {marks.legs === '📟' && <rect x="94" y="338" width="20" height="14" rx="4" className="clb-probe" />}

      {/* arms */}
      <g className="clb-arms">
        <path d="M112 150 C 82 160, 70 190, 76 222" className="clb-limb" stroke={skin} />
        <path d="M208 150 C 238 160, 250 190, 244 222" className="clb-limb" stroke={skin} />
        <circle cx="76" cy="228" r="11" fill={skin} />
        <circle cx="244" cy="228" r="11" fill={skin} />
      </g>

      {/* body: chest and belly rise with each breath */}
      <g className="clb-body">
        <path d="M112 140 Q160 126 208 140 L214 262 Q160 286 106 262 Z" className="clb-suit" />
        <path d="M118 258 Q160 278 202 258 L204 278 Q160 300 116 278 Z" className="clb-nappy" />
        <g className="clb-ribs">
          <path d="M128 168 Q160 158 192 168" /><path d="M126 182 Q160 172 194 182" /><path d="M126 196 Q160 186 194 196" />
        </g>
        {look.recession && <path d="M124 210 Q160 226 196 210" className="clb-recession" />}
        {look.recession && <path d="M130 176 Q160 170 190 176" className="clb-recession clb-recession--ic" />}
      </g>

      {/* head */}
      <g className={`clb-head${look.headBob ? ' is-bobbing' : ''}`}>
        <circle cx="160" cy="86" r="50" fill={skin} />
        <path d="M118 66 Q130 40 160 38 Q190 40 202 66 Q190 52 160 50 Q130 52 118 66 Z" className="clb-hair" />
        <ellipse cx="160" cy="52" rx="10" ry="7" className="clb-fontanelle" />
        <ellipse cx="110" cy="90" rx="7" ry="11" fill={shade} />
        <ellipse cx="210" cy="90" rx="7" ry="11" fill={shade} />
        {/* eyes: tired, slow blink */}
        <g className="clb-eyes">
          <path d="M136 84 Q144 90 152 84" />
          <path d="M168 84 Q176 90 184 84" />
        </g>
        <ellipse cx="136" cy="100" rx="8" ry="5" className="clb-cheek" />
        <ellipse cx="184" cy="100" rx="8" ry="5" className="clb-cheek" />
        {/* nose and nostrils */}
        <ellipse cx="160" cy="98" rx="6" ry="5" fill={shade} />
        <g className={look.flaring ? 'clb-nostrils is-flaring' : 'clb-nostrils'}>
          <ellipse cx="156" cy="101" rx="2" ry="1.6" />
          <ellipse cx="164" cy="101" rx="2" ry="1.6" />
        </g>
        {look.snuffly && <path d="M164 104 q3 6 0 9 q-3 -3 0 -9" className="clb-snot" />}
        {/* mouth, breathing */}
        <ellipse cx="160" cy="116" rx="6" ry="3.6" className="clb-mouth" fill={lips} />
      </g>

      {/* hotspots (drawn last so they sit on top) */}
      <ellipse cx="160" cy="52" rx="34" ry="16" {...hot('head')} />
      <ellipse cx="160" cy="92" rx="34" ry="16" {...hot('face')} />
      <ellipse cx="160" cy="117" rx="16" ry="9" {...hot('mouth')} />
      <ellipse cx="108" cy="90" rx="11" ry="16" {...hot('ears')} />
      <ellipse cx="212" cy="90" rx="11" ry="16" {...hot('ears')} />
      <rect x="132" y="128" width="56" height="14" rx="7" {...hot('neck')} />
      <path d="M112 144 Q160 132 208 144 L210 206 Q160 220 110 206 Z" {...hot('chest')} />
      <path d="M110 208 Q160 222 210 208 L213 262 Q160 286 107 262 Z" {...hot('abdomen')} />
      <path d="M60 150 L112 140 L104 176 L92 240 L60 240 Z" {...hot('hands')} />
      <path d="M260 150 L208 140 L216 176 L228 240 L260 240 Z" {...hot('hands')} />
      <path d="M84 270 L236 270 L236 362 L84 362 Z" {...hot('legs')} />

      <Mark x={196} y={44} id="head" />
      <Mark x={200} y={108} id="face" />
      <Mark x={184} y={124} id="mouth" />
      <Mark x={94} y={70} id="ears" />
      <Mark x={196} y={136} id="neck" />
      <Mark x={222} y={170} id="chest" />
      <Mark x={222} y={236} id="abdomen" />
      <Mark x={58} y={214} id="hands" />
      <Mark x={246} y={330} id="legs" />
      <Mark x={62} y={52} id="skin" />
      <Mark x={258} y={52} id="whole" />
    </svg>
  );
}

const PARENT_LOOK = {
  mum: { hair: '#4a2e1f', top: '#7aa6c9', skin: '#f0c7a6', long: true },
  dad: { hair: '#2b2b2b', top: '#8a9a6b', skin: '#e9bd97', long: false },
};

export function Parent({ who = 'mum', talking = false, worried = true }) {
  const p = PARENT_LOOK[who] || PARENT_LOOK.mum;
  return (
    <svg className={`clp${talking ? ' is-talking' : ''}`} viewBox="0 0 200 220" aria-label={who === 'mum' ? 'Mum' : 'Dad'}>
      {p.long && <path d="M52 86 Q48 160 64 176 L136 176 Q152 160 148 86 Z" fill={p.hair} />}
      <path d="M30 220 Q34 160 100 150 Q166 160 170 220 Z" fill={p.top} />
      <rect x="88" y="128" width="24" height="28" rx="10" fill={p.skin} />
      <g className="clp-head">
        <ellipse cx="100" cy="92" rx="44" ry="50" fill={p.skin} />
        <path d={p.long ? 'M56 92 Q54 40 100 38 Q146 40 144 92 Q132 60 100 58 Q68 60 56 92 Z' : 'M58 80 Q60 40 100 40 Q140 40 142 80 Q128 58 100 58 Q72 58 58 80 Z'} fill={p.hair} />
        <g className="clp-eyes">
          <ellipse cx="84" cy="92" rx="4" ry="5" />
          <ellipse cx="116" cy="92" rx="4" ry="5" />
        </g>
        {/* Worried: the inner ends of the brows lift (inner ends down reads as angry). */}
        {worried && <><path d="M74 82 Q82 79 92 76" className="clp-brow" /><path d="M126 82 Q118 79 108 76" className="clp-brow" /></>}
        <ellipse cx="100" cy="120" rx="9" ry="4" className="clp-mouth" />
      </g>
    </svg>
  );
}
