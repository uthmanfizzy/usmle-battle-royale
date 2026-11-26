/**
 * HY Diseases: the patient, drawn.
 *
 * One parametric full-body figure. A case describes the person (`look`) and
 * the figure is built from it: age sets the proportions (an infant lies in a
 * bassinet seen from above, a toddler has a big head on a small body), build
 * sets the width, `motion` is a looping CSS animation class (floppy,
 * tremor, chorea, self-biting, hand-wringing, seizure...), and `signs` are
 * overlays drawn where they would really show (blue sclerae, coarse face,
 * angiokeratomas round the waist, bowed legs, a big liver under the ribs).
 *
 * The signs that cannot be seen from across the room (a cherry-red spot, a
 * hexagonal crystal) live in ExamInset instead. Everything here is
 * decorative: the exam list carries the content in words, so the figure is
 * aria-hidden.
 *
 * Every motion / sign / face name used by the case data must exist here —
 * tools/hyd-check.mjs checks the lists exported at the bottom.
 */

const AGES = {
  //            scale  head  body-width  pose default
  infant:  { s: 0.5,  head: 1.55, w: 1.15, lie: true },
  toddler: { s: 0.56, head: 1.4,  w: 1.05 },
  child:   { s: 0.72, head: 1.18, w: 0.92 },
  teen:    { s: 0.9,  head: 1.04, w: 0.94 },
  adult:   { s: 1,    head: 1,    w: 1 },
  older:   { s: 0.97, head: 1,    w: 1.02 },
};

const SKIN = {
  light: '#f3d2b8', fair: '#f9e3d3', tan: '#d9a77f', brown: '#a8714d', dark: '#6e4630',
};
const HAIR = {
  black: '#2a211c', brown: '#5b3a24', blond: '#e5c77a', fairblond: '#f1e2b0', red: '#a8482a', grey: '#b9b4ad', white: '#ecebe8', copper: '#b9a58a',
};

const FACES = {
  // brows (left, right), mouth
  neutral: [['M180,49 L193,48', 'M207,48 L220,49'], 'M192,77 Q200,80 208,77'],
  happy:   [['M180,47 L193,46', 'M207,46 L220,47'], 'M189,74 Q200,86 211,74'],
  laugh:   [['M180,45 L193,44', 'M207,44 L220,45'], 'M188,73 Q200,90 212,73 Z'],
  sad:     [['M180,51 L193,46', 'M207,46 L220,51'], 'M191,80 Q200,73 209,80'],
  pain:    [['M180,46 L193,52', 'M207,52 L220,46'], 'M190,79 Q195,74 200,79 Q205,74 210,79'],
  worried: [['M180,51 L193,46', 'M207,46 L220,51'], 'M193,78 Q200,75 207,78'],
  sleepy:  [['M180,50 L193,50', 'M207,50 L220,50'], 'M194,78 L206,78'],
  crying:  [['M180,51 L193,45', 'M207,45 L220,51'], 'M190,76 Q200,68 210,76 Q200,84 190,76 Z'],
  blank:   [['M180,49 L193,49', 'M207,49 L220,49'], 'M193,78 L207,78'],
  angry:   [['M180,45 L193,51', 'M207,51 L220,45'], 'M191,79 Q200,75 209,79'],
};

function Hair({ style, color, older }) {
  const c = color;
  switch (style) {
    case 'long': return <path d="M172,62 Q168,26 200,24 Q232,26 228,62 L234,112 Q220,104 222,72 Q218,40 200,40 Q182,40 178,72 Q180,104 166,112 Z" fill={c} />;
    case 'bun': return <g fill={c}><circle cx="200" cy="22" r="10" /><path d="M172,58 Q170,30 200,28 Q230,30 228,58 Q222,40 200,39 Q178,40 172,58 Z" /></g>;
    case 'pony': return <g fill={c}><path d="M172,58 Q170,28 200,27 Q230,28 228,58 Q222,40 200,39 Q178,40 172,58 Z" /><path d="M226,44 Q246,60 238,92 Q232,70 224,56 Z" /></g>;
    case 'curly': return <g fill={c}>{[[180, 36], [192, 30], [205, 29], [218, 33], [228, 44], [172, 46], [186, 33], [214, 30]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="9" />)}</g>;
    case 'kinky': return (
      <g fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round">
        {[176, 183, 190, 197, 204, 211, 218, 225].map((x, i) => (
          <path key={x} d={`M${x},${44 - (i % 2) * 3} q-3,-4 1,-7 q4,-3 0,-7 q-4,-3 1,-6`} />
        ))}
        <path d="M172,54 Q172,36 200,33 Q228,36 228,54" stroke={c} strokeWidth="5" opacity="0.55" />
      </g>
    );
    case 'sparse': return <g fill={c} opacity="0.75"><path d="M176,48 Q190,36 200,36 Q212,36 224,48 Q214,42 200,42 Q188,42 176,48 Z" /></g>;
    case 'balding': return <g fill={c}><path d="M172,66 Q170,50 176,44 L178,66 Z" /><path d="M228,66 Q230,50 224,44 L222,66 Z" /></g>;
    case 'tuft': return <path d="M196,32 Q200,22 204,32 Q200,28 196,32 Z" fill={c} />;
    case 'none': return null;
    case 'short':
    default: return <path d="M172,58 Q170,28 200,27 Q230,28 228,58 Q222,40 200,39 Q178,40 172,58 Z" fill={c} opacity={older ? 0.95 : 1} />;
  }
}

export default function HydPatient({ look = {}, motion = 'calm', face: faceProp, highlight, talking }) {
  const age = AGES[look.age] || AGES.adult;
  const lying = look.pose === 'bed' || (look.pose !== 'stand' && age.lie);
  const skinBase = SKIN[look.skin] || look.skin || SKIN.light;
  const signs = new Set(look.signs || []);
  const skin = signs.has('jaundice') ? '#ecc98a' : signs.has('pale') ? '#f1dccd' : skinBase;
  const hair = HAIR[look.hair] || look.hair || HAIR.brown;
  const face = faceProp || look.face || 'neutral';
  const [[bl, br], mouth] = FACES[face] || FACES.neutral;
  const female = look.sex === 'f';
  const shirt = look.shirt || (lying ? '#cfe3f3' : female ? '#c9879b' : '#6d8fb3');
  const pants = look.pants || '#3c4a5e';

  // Build: body width multiplier.
  const bw = age.w * ({ thin: 0.8, wasted: 0.66, obese: 1.45, stocky: 1.18, tall: 0.86 }[look.build] || 1);
  const tall = look.build === 'tall' || signs.has('longLimbs');
  const legLen = tall ? 1.14 : 1;
  const armLen = tall ? 1.12 : 1;
  const W = (n) => 200 + n * bw;      // horizontal offset from centre
  const sh = 44, waist = signs.has('bigBelly') || signs.has('edemaBelly') ? 46 : 32, hip = 36;

  const kneeY = 222 - (legLen - 1) * 10;
  const hipY = 182 - (legLen - 1) * 30;
  const torsoTop = 102 - (legLen - 1) * 30;
  const shoulderY = torsoTop + 6;

  const bowed = signs.has('bowLegs');
  const legPath = (side) => {
    const x0 = 200 + side * 17;
    const xk = 200 + side * (bowed ? 31 : 19);
    const xf = 200 + side * 20;
    return `M${x0},${hipY} Q${xk},${kneeY} ${xf},${262}`;
  };

  const handY = shoulderY + 80 * armLen;
  const armPath = (side) => {
    const xs = W(side * (sh - 4));
    const xh = W(side * (sh + 8));
    return `M${xs},${shoulderY + 4} Q${W(side * (sh + 12))},${shoulderY + 44 * armLen} ${xh},${handY}`;
  };

  // Root classes: motion + face, so CSS can animate them.
  const cls = ['hp', `hp--${motion}`, `hp-face--${face}`, lying ? 'hp--crib' : 'hp--standing', `hp-age--${look.age || 'adult'}`];
  if (talking) cls.push('is-talking');
  if (highlight) cls.push(`hp-hl--${highlight}`);

  // Babies sit upright in a crib (face readable), feet hidden behind the rail.
  const scale = lying ? 0.66 : age.s;
  const anchor = lying ? 318 : 270;
  const personTf = `translate(200 ${anchor}) scale(${scale}) translate(-200 -270)`;
  const headTf = `translate(200 98) scale(${age.head}) translate(-200 -98)`;

  // Camera: frame the person rather than the room. Full body only when the
  // legs carry a sign or the movement is a whole-body one; otherwise head to
  // hips, so faces and hands read clearly. Always 4:3.
  const legsMatter = ['bowLegs', 'calfBig', 'edemaLegs', 'pesCavus', 'longLimbs'].some(s => signs.has(s))
    || ['gowers', 'ataxia', 'limp'].includes(motion) || look.framing === 'full';
  const toGlobal = (y) => anchor + scale * (y - 270);
  const top = toGlobal(98 - 80 * age.head);
  const bottom = lying ? 280 : legsMatter ? 290 : toGlobal(hipY + 34);
  const vh = Math.max(bottom - top + 16, 120);
  const vw = vh * (4 / 3);
  const viewBox = `${200 - vw / 2} ${top - 12} ${vw} ${vh}`;

  return (
    <div className={cls.join(' ')} aria-hidden="true">
      <svg viewBox={viewBox} className="hp-svg">
        <defs>
          <linearGradient id="hp-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={look.setting === 'night' ? '#3b4660' : '#eef0ea'} />
            <stop offset="1" stopColor={look.setting === 'night' ? '#2a3247' : '#dfe3da'} />
          </linearGradient>
          <radialGradient id="hp-spot" cx="0.5" cy="0.55" r="0.6">
            <stop offset="0" stopColor="rgba(255,250,235,0.55)" />
            <stop offset="1" stopColor="rgba(255,250,235,0)" />
          </radialGradient>
          <radialGradient id="hp-vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.62" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.28)" />
          </radialGradient>
        </defs>

        {/* Room */}
        <rect x="-300" y="-200" width="1000" height="700" fill="url(#hp-wall)" />
        <rect x="-300" y="268" width="1000" height="200" fill={look.setting === 'night' ? '#252b3a' : '#c9bfae'} />
        <rect x="-300" y="266" width="1000" height="4" fill="rgba(0,0,0,0.07)" />
        {look.setting !== 'night' && (
          <g opacity="0.9">
            <rect x="24" y="34" width="70" height="80" rx="4" fill="#cfe6f3" stroke="#fff" strokeWidth="5" />
            <line x1="59" y1="34" x2="59" y2="114" stroke="#fff" strokeWidth="3" />
            <circle className="hp-cloud" cx="44" cy="62" r="7" fill="#fff" opacity="0.85" />
            {/* height chart */}
            <g transform="translate(330 60)">
              <rect width="26" height="206" rx="3" fill="#fff" opacity="0.7" />
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <line key={i} x1="0" x2={i % 2 ? 8 : 14} y1={10 + i * 20} y2={10 + i * 20} stroke="#9aa6b2" strokeWidth="1.5" />)}
            </g>
          </g>
        )}
        {look.setting === 'night' && <g><circle cx="60" cy="60" r="16" fill="#f6efd0" opacity="0.85" /><circle cx="68" cy="54" r="14" fill="#3b4660" /></g>}
        <ellipse cx="200" cy="200" rx="190" ry="120" fill="url(#hp-spot)" />

        {/* Crib back and pillow behind a baby */}
        {lying && (
          <g>
            <rect x="96" y="150" width="208" height="130" rx="18" fill="#f3ece0" stroke="#dccfb9" strokeWidth="3" />
            <ellipse cx="200" cy="196" rx="62" ry="26" fill="#ffffff" opacity="0.9" />
          </g>
        )}

        <g className="hp-person" transform={personTf}>
          <g className="hp-body">
            {/* shadow */}
            {!lying && <ellipse cx="200" cy="268" rx={46 * bw} ry="6" fill="rgba(0,0,0,0.14)" />}

            {/* legs */}
            <g className="hp-legs">
              {[-1, 1].map(side => (
                <g key={side} className={`hp-leg hp-leg--${side < 0 ? 'l' : 'r'}`}>
                  <path d={legPath(side)} stroke={look.age === 'infant' || look.shorts ? skin : pants} strokeWidth={signs.has('calfBig') ? 22 : 18 * Math.min(bw, 1.25)} strokeLinecap="round" fill="none" />
                  {look.shorts && <rect x={200 + side * 17 - 12} y={hipY - 4} width="24" height="30" rx="6" fill={pants} />}
                  {signs.has('calfBig') && <ellipse cx={200 + side * 20} cy={kneeY + 18} rx="14" ry="20" fill={look.shorts || look.age === 'infant' ? skin : pants} />}
                  {signs.has('edemaLegs') && <ellipse cx={200 + side * 21} cy="250" rx="13" ry="14" fill={skin} stroke="rgba(0,0,0,0.12)" />}
                  <ellipse cx={200 + side * 24} cy="265" rx="12" ry="6" fill={look.age === 'infant' ? skin : '#2b2b30'} />
                  {signs.has('pesCavus') && <path d={`M${200 + side * 14},262 Q${200 + side * 24},252 ${200 + side * 34},262`} stroke="#2b2b30" strokeWidth="4" fill="none" />}
                </g>
              ))}
            </g>

            {/* torso */}
            <g className="hp-torso">
              <path
                d={`M${W(-sh)},${shoulderY} Q${W(-sh - 4)},${torsoTop + 40} ${W(-waist)},${hipY - 8} L${W(-hip)},${hipY + 6} L${W(hip)},${hipY + 6} L${W(waist)},${hipY - 8} Q${W(sh + 4)},${torsoTop + 40} ${W(sh)},${shoulderY} Q200,${torsoTop - 6} ${W(-sh)},${shoulderY} Z`}
                fill={look.age === 'infant' ? skin : shirt}
              />
              {look.age === 'infant' && <path d={`M${W(-hip)},${hipY - 10} L${W(hip)},${hipY - 10} L${W(hip - 6)},${hipY + 16} Q200,${hipY + 24} ${W(-hip + 6)},${hipY + 16} Z`} fill="#fbfbfb" stroke="#d9d9d9" />}
              {look.age !== 'infant' && <rect x={W(-hip)} y={hipY - 8} width={hip * 2 * bw} height="16" rx="6" fill={pants} />}
              {(signs.has('bigBelly') || signs.has('edemaBelly')) && (
                <ellipse className="hp-belly" cx="200" cy={hipY - 30} rx={36 * bw} ry="30" fill={look.age === 'infant' ? skin : shirt} stroke="rgba(0,0,0,0.08)" />
              )}
              {signs.has('liverEdge') && <path d={`M${W(-30)},${torsoTop + 52} Q200,${torsoTop + 74} ${W(34)},${torsoTop + 46}`} stroke="#b3522f" strokeWidth="3" strokeDasharray="5 4" fill="none" opacity="0.8" />}
              {signs.has('ribs') && [0, 1, 2, 3].map(i => <path key={i} d={`M${W(-26)},${torsoTop + 24 + i * 10} Q200,${torsoTop + 30 + i * 10} ${W(26)},${torsoTop + 24 + i * 10}`} stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none" />)}
              {signs.has('pectus') && <ellipse cx="200" cy={torsoTop + 30} rx="12" ry="10" fill="rgba(0,0,0,0.16)" />}
              {signs.has('angiokeratoma') && [[-22, 6], [-12, 10], [-4, 2], [8, 9], [18, 4], [26, 10], [-28, 12], [14, 14]].map(([dx, dy]) => (
                <circle key={`${dx}${dy}`} cx={W(dx)} cy={hipY - 14 + dy} r="2.2" fill="#b3123a" />
              ))}
              {signs.has('xanthomaEruptive') && [[-24, -40], [-10, -30], [16, -44], [26, -24], [-2, -50]].map(([dx, dy]) => (
                <circle key={`${dx}${dy}`} cx={W(dx)} cy={hipY + dy} r="3" fill="#f2d067" stroke="#c9302c" strokeWidth="1.2" />
              ))}
              {signs.has('heartRight') && <path className="hp-heart" d={`M${W(16)},${torsoTop + 30} c-4,-6 -12,-2 -8,4 l8,8 l8,-8 c4,-6 -4,-10 -8,-4 z`} fill="#e0485a" opacity="0.85" />}
              {signs.has('scar') && <path d={`M200,${torsoTop + 14} L200,${torsoTop + 50}`} stroke="#c47a7a" strokeWidth="2.4" strokeDasharray="3 3" />}
              {signs.has('gtube') && <g><circle cx={W(-12)} cy={hipY - 28} r="4" fill="#9cc" /><path d={`M${W(-12)},${hipY - 28} q-20,10 -30,40`} stroke="#9cc" strokeWidth="3" fill="none" /></g>}
            </g>

            {/* arms */}
            {[-1, 1].map(side => (
              <g key={side} className={`hp-arm hp-arm--${side < 0 ? 'l' : 'r'}`}>
                <path d={armPath(side)} stroke={look.age === 'infant' || look.sleeveless ? skin : shirt} strokeWidth={14 * Math.min(bw, 1.3)} strokeLinecap="round" fill="none" />
                {signs.has('rashSun') && <path d={armPath(side)} stroke="#8a4b2e" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.55" strokeDasharray="0 46 100" />}
                <g className="hp-hand">
                  <circle cx={W(side * (sh + 8))} cy={handY} r={signs.has('clenched') ? 7.5 : 8.5} fill={skin} />
                  {signs.has('clenched') && <path d={`M${W(side * (sh + 8)) - 6},${handY - 2} l12,0 M${W(side * (sh + 8)) - 6},${handY + 2} l12,0`} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />}
                  {signs.has('xanthomaTendon') && <circle cx={W(side * (sh + 8))} cy={handY - 7} r="3.4" fill="#f2d79a" stroke="#c59a52" />}
                  {signs.has('xanthomaPalmar') && <path d={`M${W(side * (sh + 8)) - 5},${handY + 2} l10,0`} stroke="#f0b34a" strokeWidth="2.4" />}
                  {signs.has('polydactyly') && <circle cx={W(side * (sh + 15))} cy={handY + 2} r="3" fill={skin} stroke="rgba(0,0,0,0.2)" />}
                  {signs.has('bandageHands') && <rect x={W(side * (sh + 8)) - 8} y={handY - 4} width="16" height="8" rx="3" fill="#fafafa" stroke="#ddd" />}
                </g>
                {signs.has('cast') && side > 0 && <rect x={W(sh + 2)} y={shoulderY + 40} width="16" height="34" rx="6" fill="#f4f4f4" stroke="#ccc" transform={`rotate(-8 ${W(sh + 10)} ${shoulderY + 56})`} />}
                {signs.has('bruises') && side < 0 && <ellipse cx={W(-sh - 9)} cy={shoulderY + 46} rx="6" ry="4" fill="#7b5aa6" opacity="0.6" />}
                {signs.has('petechiae') && side > 0 && [0, 1, 2, 3].map(i => <circle key={i} cx={W(sh + 6 + (i % 2) * 4)} cy={shoulderY + 30 + i * 9} r="1.4" fill="#b31d2b" />)}
              </g>
            ))}

            {/* neck */}
            <rect x="192" y="88" width="16" height={torsoTop - 84} rx="6" fill={skin} />
            {signs.has('rashNeck') && <path d={`M190,${torsoTop - 4} Q200,${torsoTop + 10} 210,${torsoTop - 4} L216,${torsoTop + 4} Q200,${torsoTop + 22} 184,${torsoTop + 4} Z`} fill="#8a4b2e" opacity="0.6" />}

            {/* head */}
            <g className="hp-head" transform={headTf}>
              <g className="hp-head-inner">
                {/* ears */}
                <ellipse cx={signs.has('bigEars') ? 170 : 173} cy="62" rx={signs.has('bigEars') ? 7 : 5} ry={signs.has('bigEars') ? 11 : 8} fill={skin} />
                <ellipse cx={signs.has('bigEars') ? 230 : 227} cy="62" rx={signs.has('bigEars') ? 7 : 5} ry={signs.has('bigEars') ? 11 : 8} fill={skin} />
                {/* skull */}
                <ellipse
                  cx="200"
                  cy={signs.has('longFace') ? 64 : 60}
                  rx={signs.has('microcephaly') ? 22 : signs.has('roundFace') ? 30 : 26}
                  ry={signs.has('longFace') ? 34 : signs.has('microcephaly') ? 26 : signs.has('roundFace') ? 29 : 31}
                  fill={skin}
                />
                {signs.has('smallJaw') && <path d="M186,84 Q200,92 214,84 L214,80 L186,80 Z" fill="url(#hp-wall)" opacity="0.9" />}
                {signs.has('prominentJaw') && <path d="M186,84 Q200,100 214,84 Z" fill={skin} />}
                <Hair style={signs.has('kinkyHair') ? 'kinky' : signs.has('frontalBalding') ? 'balding' : (look.hairStyle || (look.age === 'infant' ? 'tuft' : 'short'))} color={hair} older={look.age === 'older'} />
                {/* cheeks */}
                <ellipse cx="185" cy="70" rx="6" ry="3.6" fill={signs.has('pale') ? 'rgba(255,255,255,0)' : 'rgba(225,95,95,0.2)'} />
                <ellipse cx="215" cy="70" rx="6" ry="3.6" fill={signs.has('pale') ? 'rgba(255,255,255,0)' : 'rgba(225,95,95,0.2)'} />
                {signs.has('freckles') && [[184, 66], [188, 70], [180, 70], [212, 66], [216, 70], [220, 67], [198, 66], [203, 64]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#8a5a3a" />)}
                {signs.has('skinCancer') && <g><circle cx="216" cy="56" r="3.2" fill="#5b3a2a" /><circle cx="186" cy="78" r="2.6" fill="#8a3a3a" /></g>}
                {signs.has('dermatitisFace') && <path d="M188,80 Q200,92 212,80 Q200,86 188,80 Z M186,72 q-4,4 0,8" fill="#d97a6a" opacity="0.6" stroke="#c8604f" strokeWidth="1.5" />}
                {signs.has('coarseFace') && <g><ellipse cx="200" cy="70" rx="7" ry="5" fill="rgba(0,0,0,0.12)" /><path d="M190,78 Q200,84 210,78" stroke="#a65a48" strokeWidth="4" fill="none" /></g>}
                {signs.has('xanthelasma') && <g fill="#f0d27a"><ellipse cx="186" cy="52" rx="5" ry="2" /><ellipse cx="214" cy="52" rx="5" ry="2" /></g>}

                {/* eyes */}
                <g className="hp-eyes">
                  {signs.has('upslant')
                    ? <g fill="#fff"><path d="M182,59 Q188,52 196,55 Q190,61 182,59 Z" /><path d="M218,59 Q212,52 204,55 Q210,61 218,59 Z" /></g>
                    : <g fill={signs.has('blueSclera') ? '#bcd3f2' : signs.has('jaundice') ? '#f4e39c' : '#fff'}><ellipse cx="189" cy="58" rx="6" ry="4.4" /><ellipse cx="211" cy="58" rx="6" ry="4.4" /></g>}
                  <g className="hp-pupils" fill={signs.has('cataract') ? '#e6edf0' : '#2a1d14'}>
                    <circle cx="189" cy="58" r="2.7" />
                    <circle cx="211" cy="58" r="2.7" />
                  </g>
                  {signs.has('cloudyCornea') && <g fill="rgba(230,236,240,0.75)"><ellipse cx="189" cy="58" rx="5.6" ry="4" /><ellipse cx="211" cy="58" rx="5.6" ry="4" /></g>}
                  {signs.has('arcus') && <g fill="none" stroke="rgba(240,240,240,0.9)" strokeWidth="1.2"><circle cx="189" cy="58" r="3.4" /><circle cx="211" cy="58" r="3.4" /></g>}
                  <g className="hp-lids" fill={skin}>
                    <rect x="181" y="51" width="16" height="7" />
                    <rect x="203" y="51" width="16" height="7" />
                  </g>
                </g>
                <g stroke={hair === HAIR.white || hair === HAIR.grey ? '#9a958e' : hair} strokeWidth={signs.has('coarseFace') ? 4.2 : 3} strokeLinecap="round" fill="none">
                  <path d={bl} /><path d={br} />
                </g>
                {/* nose */}
                {signs.has('flatNose')
                  ? <ellipse cx="200" cy="68" rx="4" ry="2.6" fill="rgba(0,0,0,0.14)" />
                  : <path d="M200,60 Q196,68 200,70" stroke="rgba(0,0,0,0.25)" strokeWidth="1.8" fill="none" />}
                {/* mouth */}
                {signs.has('cleftLip') && <path d="M196,72 L198,78" stroke="#a55" strokeWidth="2.4" />}
                <path className="hp-mouth" d={mouth} stroke="#8a3b2e" strokeWidth={signs.has('widemouth') ? 3.4 : 2.6} strokeLinecap="round" fill={face === 'laugh' || face === 'crying' ? '#6a2a22' : 'none'} />
                <ellipse className="hp-mouth-talk" cx="200" cy="78" rx="5" ry="3.2" fill="#5a2a22" />
                {signs.has('macroglossia') && <ellipse className="hp-tongue" cx="200" cy="81" rx="6" ry="4.6" fill="#e07a85" />}
                {signs.has('bleedingGums') && <path d="M193,79 L207,79" stroke="#c22" strokeWidth="1.6" />}
                {signs.has('bandageLip') && <rect x="192" y="80" width="16" height="5" rx="2" fill="#f6f6f6" stroke="#ccc" />}
                {signs.has('cheilitis') && <g fill="#d9534f"><circle cx="191" cy="77" r="1.8" /><circle cx="209" cy="77" r="1.8" /></g>}
                <path className="hp-tear" d="M188,64 Q185,71 188,74 Q191,71 188,64 Z" fill="#8ecae6" />
                <path className="hp-sweat" d="M224,42 Q220,49 224,52 Q228,49 224,42 Z" fill="#8ecae6" />
                {signs.has('glasses') && <g stroke="#2b2b2b" strokeWidth="1.8" fill="rgba(255,255,255,0.1)"><rect x="180" y="52" width="18" height="12" rx="4" /><rect x="202" y="52" width="18" height="12" rx="4" /><line x1="198" y1="57" x2="202" y2="57" /></g>}
                {signs.has('hearingAid') && <path d="M228,56 q6,4 2,12" stroke="#d9a35a" strokeWidth="3" fill="none" />}
              </g>
            </g>
          </g>
        </g>

        {/* Crib front: rail and blanket hide a baby's legs */}
        {lying && (
          <g>
            <path d="M84,272 Q200,258 316,272 L316,340 L84,340 Z" fill="#cfe3f3" />
            <path d="M84,272 Q200,258 316,272" stroke="#b6cfe4" strokeWidth="3" fill="none" />
            {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={110 + i * 36} cy={286 + (i % 2) * 6} r="4" fill="#fff" opacity="0.7" />)}
            <rect x="80" y="268" width="240" height="7" rx="3.5" fill="#d8c3a2" />
            {[96, 124, 152, 180, 208, 236, 264, 292].map(x => <rect key={x} x={x} y="268" width="5" height="30" rx="2" fill="#d8c3a2" opacity="0.85" />)}
          </g>
        )}

        {/* Floating cues: smell, sounds, thoughts */}
        {look.smell && (
          <g className="hp-smell">
            <path d="M268,150 q8,-10 0,-20 q-8,-10 0,-20" stroke="#c48a3a" strokeWidth="2.4" fill="none" opacity="0.7" />
            <path d="M282,156 q8,-10 0,-20 q-8,-10 0,-20" stroke="#c48a3a" strokeWidth="2.4" fill="none" opacity="0.5" />
          </g>
        )}
        {motion === 'confused' && <g className="hp-qmarks" fill="#6c7a8a" fontSize="18" fontWeight="700"><text x="244" y="58">?</text><text x="258" y="42">?</text></g>}
        {motion === 'catcry' && <g className="hp-cry-waves" fill="none" stroke="#7aa6c9" strokeWidth="2"><path d="M262,130 q6,6 0,12" /><path d="M270,124 q10,12 0,24" /><path d="M278,118 q14,18 0,36" /></g>}
        {motion === 'seizure' && <g className="hp-jolt" stroke="#e0a43a" strokeWidth="2.4"><path d="M132,120 l-10,-6" /><path d="M268,120 l10,-6" /><path d="M140,160 l-12,0" /><path d="M260,160 l12,0" /></g>}

        <rect width="400" height="300" fill="url(#hp-vig)" pointerEvents="none" />
      </svg>
    </div>
  );
}

export const HP_MOTIONS = ['calm', 'floppy', 'tremor', 'chorea', 'ataxia', 'seizure', 'selfbite', 'handwring', 'laugh', 'lethargic', 'cramp', 'gowers', 'cough', 'irritable', 'vomit', 'dystonia', 'confused', 'eating', 'weak', 'catcry', 'grip', 'limp', 'scratch', 'squint'];
export const HP_SIGNS = ['jaundice', 'pale', 'blueSclera', 'cataract', 'cloudyCornea', 'arcus', 'upslant', 'flatNose', 'bigEars', 'longFace', 'prominentJaw', 'smallJaw', 'microcephaly', 'roundFace', 'coarseFace', 'cleftLip', 'widemouth', 'macroglossia', 'bleedingGums', 'bandageLip', 'cheilitis', 'freckles', 'skinCancer', 'dermatitisFace', 'xanthelasma', 'kinkyHair', 'frontalBalding', 'glasses', 'hearingAid', 'rashNeck', 'rashSun', 'angiokeratoma', 'xanthomaEruptive', 'xanthomaTendon', 'xanthomaPalmar', 'heartRight', 'scar', 'gtube', 'bigBelly', 'edemaBelly', 'liverEdge', 'ribs', 'pectus', 'clenched', 'polydactyly', 'bandageHands', 'cast', 'bruises', 'petechiae', 'bowLegs', 'calfBig', 'edemaLegs', 'pesCavus', 'longLimbs'];
export const HP_FACES = Object.keys(FACES);
export const HP_AGES = Object.keys(AGES);
export const HP_SKINS = Object.keys(SKIN);
export const HP_HAIRS = Object.keys(HAIR);
