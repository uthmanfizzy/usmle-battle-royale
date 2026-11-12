/**
 * The patient, on screen.
 *
 * A seated figure drawn in SVG whose body language IS the clue: the
 * `demeanor` sets a looping way of being (slumped and slow in depression,
 * bouncing and gesturing in mania, glancing at an empty corner when
 * hallucinating, tics, tremor, rigidity), the `face` sets brows and mouth,
 * and each line of the interview can add an `act` — a one-off gesture
 * (crying, startling, a tic, looking away) that plays as it is said.
 *
 * All motion is CSS (PsychStage styles in SpotTheDiagnosis.css), keyed off
 * classes on the root, so it costs nothing per frame and honours
 * prefers-reduced-motion. Decorative: the subtitles carry the content.
 */

const SETTINGS = {
  clinic: { wall: '#e9e4da', wall2: '#d8d0c2', floor: '#b9a68a', label: 'Outpatient clinic' },
  ward: { wall: '#dfe9ec', wall2: '#c9d8dc', floor: '#9fb1b5', label: 'Hospital ward' },
  er: { wall: '#e2e6ef', wall2: '#cbd2df', floor: '#8f99a8', label: 'Emergency department' },
};

const BROWS = {
  sad: ['M168,79 L188,74', 'M212,74 L232,79'],          // inner ends raised
  happy: ['M168,74 L188,72', 'M212,72 L232,74'],
  worried: ['M168,78 L188,72', 'M212,72 L232,78'],
  angry: ['M168,72 L188,79', 'M212,79 L232,72'],         // inner ends lowered
  flat: ['M168,76 L188,76', 'M212,76 L232,76'],
  neutral: ['M168,75 L188,74', 'M212,74 L232,75'],
  smug: ['M168,74 L188,75', 'M212,71 L232,73'],
};
const MOUTHS = {
  sad: 'M186,127 Q200,119 214,127',
  happy: 'M182,121 Q200,136 218,121',
  worried: 'M188,125 Q200,121 212,125',
  angry: 'M186,126 Q200,122 214,126',
  flat: 'M188,124 L212,124',
  neutral: 'M188,123 Q200,126 212,123',
  smug: 'M188,124 Q204,129 216,119',
};

function Hair({ style, color, child }) {
  const c = color;
  switch (style) {
    case 'long': return <path d="M158,98 Q156,50 200,46 Q244,50 242,98 L248,168 Q232,160 232,120 Q230,74 200,70 Q170,74 168,120 Q168,160 152,168 Z" fill={c} />;
    case 'bun': return <g fill={c}><circle cx="200" cy="44" r="15" /><path d="M160,96 Q158,56 200,54 Q242,56 240,96 Q232,72 200,70 Q168,72 160,96 Z" /></g>;
    case 'bob': return <path d="M158,104 Q154,52 200,50 Q246,52 242,104 L242,128 Q236,128 234,110 Q232,72 200,70 Q168,72 166,110 Q164,128 158,128 Z" fill={c} />;
    case 'curly': return <g fill={c}>{[[168, 66], [184, 56], [200, 52], [216, 56], [232, 66], [240, 82], [160, 82], [176, 62], [224, 62]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="13" />)}</g>;
    case 'messy': return <path d="M160,92 Q156,58 176,54 L172,46 L188,52 L194,42 L204,52 L216,44 L218,54 Q246,58 240,94 Q232,72 200,70 Q170,72 160,92 Z" fill={c} />;
    case 'buzz': return <path d="M163,90 Q162,58 200,56 Q238,58 237,90 Q228,70 200,68 Q172,70 163,90 Z" fill={c} opacity="0.85" />;
    case 'slick': return <path d="M161,92 Q158,56 200,54 Q244,56 239,90 Q236,72 214,66 Q190,64 172,76 Q166,82 161,92 Z" fill={c} />;
    case 'neat': return <path d="M162,90 Q160,58 200,56 Q240,58 238,90 Q234,70 214,68 L186,68 Q166,70 162,90 Z" fill={c} />;
    case 'bald': return <g fill={c}><path d="M158,104 Q158,88 164,84 L166,104 Z" /><path d="M242,104 Q242,88 236,84 L234,104 Z" /></g>;
    case 'short':
    default: return <path d="M161,94 Q158,54 200,52 Q242,54 239,94 Q232,70 200,68 Q168,70 161,94 Z" fill={c} />;
  }
}

export default function PatientStage({ patient, demeanor = 'calm', face = 'neutral', act, talking, caption }) {
  const p = patient;
  const set = SETTINGS[p.setting] || SETTINGS.clinic;
  const shirt = p.gown ? '#a7c7e7' : p.shirt;
  const bw = p.thin ? 0.78 : p.child ? 0.84 : 1;   // body width
  const sc = p.child ? 0.88 : 1;                     // child sits smaller
  const [bl, br] = BROWS[face] || BROWS.neutral;

  return (
    <div className={`ps ps--${demeanor}${act ? ` ps-act--${act}` : ''}${talking ? ' is-talking' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 400 300" className="ps-svg">
        <defs>
          <linearGradient id="ps-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={set.wall} />
            <stop offset="1" stopColor={set.wall2} />
          </linearGradient>
          <radialGradient id="ps-vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.35)" />
          </radialGradient>
        </defs>

        {/* Room */}
        <rect x="0" y="0" width="400" height="300" fill="url(#ps-wall)" />
        <rect x="0" y="236" width="400" height="64" fill={set.floor} />
        <rect x="0" y="232" width="400" height="6" fill="rgba(0,0,0,0.08)" />
        {p.setting === 'clinic' && (
          <g className="ps-window">
            <rect x="28" y="40" width="86" height="96" rx="4" fill="#b9d7ea" stroke="#f5f0e6" strokeWidth="6" />
            <line x1="71" y1="40" x2="71" y2="136" stroke="#f5f0e6" strokeWidth="4" />
            <circle className="ps-cloud" cx="56" cy="70" r="9" fill="#fff" opacity="0.8" />
            <g transform="translate(330 180)"><rect x="-12" y="20" width="24" height="34" rx="3" fill="#a0694a" /><path d="M0,22 C-24,-6 -18,-30 0,-14 C18,-30 24,-6 0,22" fill="#5f8f55" className="ps-plant" /></g>
          </g>
        )}
        {(p.setting === 'ward' || p.setting === 'er') && (
          <g>
            <line x1="332" y1="40" x2="332" y2="240" stroke="#8b96a3" strokeWidth="4" />
            <rect x="318" y="44" width="28" height="38" rx="6" fill="rgba(220,240,255,0.85)" stroke="#8b96a3" strokeWidth="2" />
            <rect x="34" y="52" width="70" height="48" rx="5" fill="#1d2733" />
            <polyline className="ps-monitor" points="38,78 50,78 54,70 58,88 62,78 74,78 78,72 82,84 86,78 100,78" fill="none" stroke="#3dff96" strokeWidth="2" />
            {p.setting === 'er' && <rect x="0" y="0" width="400" height="10" fill="rgba(214,54,60,0.25)" className="ps-er-light" />}
          </g>
        )}

        {/* The person */}
        <g className="ps-person" transform={`translate(${200 - 200 * sc} ${300 - 300 * sc}) scale(${sc})`}>
          {/* chair */}
          <rect x="132" y="146" width="136" height="110" rx="14" fill="#4a3f37" />
          <rect x="120" y="240" width="160" height="16" rx="6" fill="#3a312b" />
          <g className="ps-body">
            {/* torso */}
            <path
              d={`M${200 - 64 * bw},300 L${200 - 62 * bw},196 Q${200 - 58 * bw},172 ${200 - 26},168 L${200 + 26},168 Q${200 + 58 * bw},172 ${200 + 62 * bw},196 L${200 + 64 * bw},300 Z`}
              fill={shirt}
            />
            {p.gown && <g fill="rgba(255,255,255,0.35)">{[180, 200, 220, 240, 260, 280].map(y => <circle key={y} cx={200 + ((y / 20) % 2 ? -22 : 22)} cy={y} r="3" />)}</g>}
            {p.tie && <path d="M196,170 L204,170 L208,214 L200,226 L192,214 Z" fill="#7a1f2b" />}
            {p.scarf && <path d="M168,166 Q200,186 232,166 L236,178 Q200,200 164,178 Z" fill="#e9c46a" />}
            {/* neck */}
            <rect x="188" y="136" width="24" height="36" rx="10" fill={p.skin} />
            {/* arms */}
            <g className="ps-arm ps-arm--l">
              <path d={`M${200 - 58 * bw},190 Q${200 - 74 * bw},226 ${200 - 40},256`} stroke="rgba(0,0,0,0.28)" strokeWidth="25" strokeLinecap="round" fill="none" />
              <path d={`M${200 - 58 * bw},190 Q${200 - 74 * bw},226 ${200 - 40},256`} stroke={shirt} strokeWidth="20" strokeLinecap="round" fill="none" />
              <circle className="ps-hand" cx={160} cy={256} r="11" fill={p.skin} />
            </g>
            <g className="ps-arm ps-arm--r">
              <path d={`M${200 + 58 * bw},190 Q${200 + 74 * bw},226 ${200 + 40},256`} stroke="rgba(0,0,0,0.28)" strokeWidth="25" strokeLinecap="round" fill="none" />
              <path d={`M${200 + 58 * bw},190 Q${200 + 74 * bw},226 ${200 + 40},256`} stroke={shirt} strokeWidth="20" strokeLinecap="round" fill="none" />
              <circle className="ps-hand" cx={240} cy={256} r="11" fill={p.skin} />
            </g>
            {p.brace && <rect x="150" y="214" width="100" height="16" rx="6" fill="#d9d9d9" opacity="0.9" />}

            {/* head */}
            <g className="ps-head">
              <ellipse cx="160" cy="104" rx="7" ry="11" fill={p.skin} />
              <ellipse cx="240" cy="104" rx="7" ry="11" fill={p.skin} />
              <ellipse cx="200" cy="100" rx={p.thin ? 36 : 39} ry="45" fill={p.skin} />
              <Hair style={p.style} color={p.hair} child={p.child} />
              {/* eyes */}
              <g className="ps-eyes">
                <ellipse cx="183" cy="96" rx="8" ry="6" fill="#fff" />
                <ellipse cx="217" cy="96" rx="8" ry="6" fill="#fff" />
                <g className="ps-pupils">
                  <circle cx="183" cy="96" r="3.6" fill="#2a1d14" />
                  <circle cx="217" cy="96" r="3.6" fill="#2a1d14" />
                </g>
                <g className="ps-lids" fill={p.skin}>
                  <rect x="174" y="88" width="18" height="9" />
                  <rect x="208" y="88" width="18" height="9" />
                </g>
              </g>
              <g className="ps-brows" stroke={p.hair === '#f0f0f0' || p.hair === '#e8e8e8' ? '#9a9a9a' : p.hair} strokeWidth="4.6" strokeLinecap="round" fill="none">
                <path d={bl} transform="translate(0 6)" />
                <path d={br} transform="translate(0 6)" />
              </g>
              <ellipse cx="178" cy="114" rx="7" ry="4" fill="rgba(220,90,90,0.18)" /><ellipse cx="222" cy="114" rx="7" ry="4" fill="rgba(220,90,90,0.18)" />
              <path d="M200,100 Q196,112 200,114" stroke="rgba(0,0,0,0.25)" strokeWidth="2" fill="none" />
              {p.glasses && (
                <g stroke="#2b2b2b" strokeWidth="2.4" fill="rgba(255,255,255,0.12)">
                  <rect x="170" y="87" width="26" height="18" rx="6" />
                  <rect x="204" y="87" width="26" height="18" rx="6" />
                  <line x1="196" y1="95" x2="204" y2="95" />
                </g>
              )}
              <path className="ps-mouth" d={MOUTHS[face] || MOUTHS.neutral} stroke="#7a3b2e" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <ellipse className="ps-mouth-talk" cx="200" cy="125" rx="8" ry="5" fill="#5a2a22" />
              {/* tears, sweat */}
              <path className="ps-tear" d="M186,104 Q182,114 186,118 Q190,114 186,104 Z" fill="#8ecae6" />
              <path className="ps-sweat" d="M236,70 Q231,80 236,84 Q241,80 236,70 Z" fill="#8ecae6" />
            </g>
          </g>
        </g>

        <rect x="0" y="0" width="400" height="300" fill="url(#ps-vignette)" pointerEvents="none" />
      </svg>
      <span className="ps-setting">{set.label}</span>
      <span className="ps-rec"><i /> REC</span>
      {caption}
    </div>
  );
}
