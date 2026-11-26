/**
 * HY Diseases: close-up exam cards.
 *
 * The findings you only see up close, under a scope or on a film: a
 * cherry-red macula, a dislocated lens, a hexagonal stone, foam cells, a
 * trinucleotide stutter. Each `kind` is a small stylised SVG, 120x90, drawn
 * to show the one feature that makes it diagnostic. Decorative; the card's
 * caption carries the words.
 *
 * Kinds used by the case data must be listed in INSET_KINDS (checked by
 * tools/hyd-check.mjs).
 */

const EYE = (iris = '#6b8fb5', sclera = '#fff', extra = null) => (
  <g>
    <path d="M10,45 Q60,8 110,45 Q60,82 10,45 Z" fill={sclera} stroke="#c9a487" strokeWidth="3" />
    <circle cx="60" cy="45" r="18" fill={iris} />
    <circle cx="60" cy="45" r="8" fill="#1d1612" />
    {extra}
    <circle cx="66" cy="39" r="3" fill="#fff" opacity="0.8" />
  </g>
);

const FUNDUS = (children) => (
  <g>
    <circle cx="60" cy="45" r="40" fill="#c4542f" />
    <circle cx="60" cy="45" r="40" fill="url(#ins-fundus)" />
    <circle cx="36" cy="40" r="9" fill="#f2c79a" />
    {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => (
      <path key={`${a}${b}`} d={`M36,40 Q${48 + a * 10},${40 + b * 14} ${60 + a * 26},${45 + b * 30}`} stroke="#8a1f16" strokeWidth="2.2" fill="none" />
    ))}
    {children}
  </g>
);

const SMEAR = (children) => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill="#f6e7ef" />
    {[[18, 18], [96, 20], [20, 72], [100, 70], [58, 80]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="9" fill="#e7a3b4" />)}
    {children}
  </g>
);

const KARYO = (label, n, color = '#7d6bc4') => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3f1fb" />
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(${34 + i * 18} 22)`}>
        <rect x="0" y="0" width="7" height="38" rx="3.5" fill={color} />
        <rect x="0" y="16" width="7" height="3" fill="#fff" opacity="0.7" />
      </g>
    ))}
    <text x="60" y="78" textAnchor="middle" fontSize="13" fontWeight="800" fill="#463a7a">{label}</text>
  </g>
);

const PEDIGREE = (kind) => {
  // squares = male, circles = female; filled = affected
  const sq = (x, y, f) => <rect x={x - 6} y={y - 6} width="12" height="12" fill={f ? '#3a5f8f' : '#fff'} stroke="#3a5f8f" strokeWidth="2" />;
  const ci = (x, y, f, carrier) => (
    <g><circle cx={x} cy={y} r="6.5" fill={f ? '#3a5f8f' : '#fff'} stroke="#3a5f8f" strokeWidth="2" />{carrier && <circle cx={x} cy={y} r="2.4" fill="#3a5f8f" />}</g>
  );
  const lines = <g stroke="#3a5f8f" strokeWidth="1.6"><line x1="36" y1="22" x2="84" y2="22" /><line x1="60" y1="22" x2="60" y2="40" /><line x1="24" y1="40" x2="96" y2="40" />{[24, 48, 72, 96].map(x => <line key={x} x1={x} y1="40" x2={x} y2="52" />)}</g>;
  const kids = {
    XR: [sq(24, 58, 1), ci(48, 58, 0, 1), sq(72, 58, 0), ci(96, 58, 0, 1)],
    AR: [sq(24, 58, 0), ci(48, 58, 1), sq(72, 58, 0), ci(96, 58, 0)],
    AD: [sq(24, 58, 1), ci(48, 58, 1), sq(72, 58, 0), ci(96, 58, 0)],
    MT: [sq(24, 58, 1), ci(48, 58, 1), sq(72, 58, 1), ci(96, 58, 1)],
  }[kind];
  const parents = {
    XR: [sq(30, 22, 0), ci(90, 22, 0, 1)],
    AR: [sq(30, 22, 0), ci(90, 22, 0)],
    AD: [sq(30, 22, 1), ci(90, 22, 0)],
    MT: [sq(30, 22, 0), ci(90, 22, 1)],
  }[kind];
  return (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef4fb" />
      {lines}
      {[...parents, ...kids].map((el, i) => <g key={i}>{el}</g>)}
      <text x="60" y="82" textAnchor="middle" fontSize="10" fontWeight="800" fill="#3a5f8f">
        {{ XR: 'X-linked recessive', AR: 'Autosomal recessive', AD: 'Autosomal dominant', MT: 'Mother to all children' }[kind]}
      </text>
    </g>
  );
};

const XRAY = (children) => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill="#10161d" />
    {children}
  </g>
);

const DNA = (label, children) => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef7f2" />
    {children}
    {label && <text x="60" y="82" textAnchor="middle" fontSize="10" fontWeight="800" fill="#2f6b4f">{label}</text>}
  </g>
);

const SKIN_BG = (tone = '#f1c9ab', children) => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill={tone} />
    {children}
  </g>
);

const URINE = (fill, children) => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef1f4" />
    <path d="M42,18 L78,18 L74,80 Q60,86 46,80 Z" fill="#fff" stroke="#9aa6b2" strokeWidth="2.5" />
    <path d="M44,40 L76,40 L74,80 Q60,86 46,80 Z" fill={fill} />
    {children}
  </g>
);

const LAB = (label, value, unit, tone = '#b23a3a') => (
  <g>
    <rect x="2" y="2" width="116" height="86" rx="10" fill="#f4f1ea" />
    <rect x="14" y="14" width="92" height="62" rx="8" fill="#1e2a35" />
    <text x="60" y="34" textAnchor="middle" fontSize="10" fontWeight="700" fill="#9fb5c6">{label}</text>
    <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="900" fill={tone}>{value}</text>
    <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#9fb5c6">{unit}</text>
  </g>
);

const KINDS = {
  // ── eyes ─────────────────────────────────────────────
  cherrySpot: FUNDUS(<g><circle cx="74" cy="47" r="20" fill="#f3e7df" opacity="0.85" /><circle cx="74" cy="47" r="6" fill="#c0122a" /></g>),
  blueSclera: EYE('#6b4d2f', '#b7cdee'),
  lensDown: EYE('#7a9cc0', '#fff', <ellipse cx="60" cy="56" rx="12" ry="9" fill="rgba(255,255,255,0.75)" stroke="#9bb" />),
  lensUp: EYE('#7a9cc0', '#fff', <ellipse cx="62" cy="34" rx="12" ry="9" fill="rgba(255,255,255,0.75)" stroke="#9bb" />),
  cataract: EYE('#7a9cc0', '#fff', <circle cx="60" cy="45" r="8" fill="#eef1f2" />),
  oilDrop: EYE('#7a9cc0', '#fff', <g><circle cx="60" cy="45" r="8" fill="#d9e4e8" /><circle cx="60" cy="45" r="4" fill="#f7fbfc" /></g>),
  cloudyCornea: EYE('#7a9cc0', '#fff', <circle cx="60" cy="45" r="19" fill="rgba(235,240,243,0.78)" />),
  bitotSpots: EYE('#6b4d2f', '#f0ece0', <g fill="#d8cfa6"><ellipse cx="26" cy="45" rx="6" ry="4" /><ellipse cx="94" cy="45" rx="6" ry="4" /></g>),
  paleDisc: FUNDUS(<circle cx="36" cy="40" r="10" fill="#f6efe6" />),
  boneSpicules: FUNDUS(<g fill="#2a1812">{[[70, 22], [86, 34], [88, 58], [70, 70], [54, 72], [60, 18]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x},${y} l4,4 l-4,4 l4,4`} stroke="#2a1812" strokeWidth="2.2" fill="none" />)}</g>),
  eyeMovement: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f1ebe3" />
      {[34, 86].map(x => <g key={x}><ellipse cx={x} cy="45" rx="18" ry="11" fill="#fff" stroke="#c9a487" strokeWidth="2" /><circle cx={x} cy="45" r="6" fill="#2a1d14" /></g>)}
      <path d="M52,22 l-8,-6 m8,6 l-8,6 M68,22 l8,-6 m-8,6 l8,6" stroke="#c0392b" strokeWidth="2.4" />
      <text x="60" y="82" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8a3b2e">gaze palsy · nystagmus</text>
    </g>
  ),

  // ── hair, skin, mouth ───────────────────────────────
  kinkyHair: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f7ede4" />
      {[20, 34, 48, 62, 76, 90].map((x, i) => <path key={x} d={`M${x},80 q-6,-8 0,-14 q6,-6 0,-14 q-6,-6 0,-14 q6,-6 0,-14 q-6,-6 0,-12`} stroke={i % 2 ? '#b9a58a' : '#cbbca4'} strokeWidth="3" fill="none" />)}
    </g>
  ),
  corkscrew: SKIN_BG('#f1c9ab', <g>{[[30, 40], [60, 30], [88, 46], [44, 66], [78, 68]].map(([x, y]) => <g key={`${x}${y}`}><circle cx={x} cy={y} r="8" fill="#c0392b" opacity="0.55" /><path d={`M${x},${y} q4,-4 0,-8 q-4,-4 0,-8`} stroke="#4a3426" strokeWidth="2" fill="none" /></g>)}</g>),
  angiokeratoma: SKIN_BG('#f3d2b8', <g fill="#a3102f">{[[20, 30], [34, 50], [48, 26], [62, 44], [76, 60], [90, 34], [100, 56], [30, 70], [56, 70], [84, 76]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" />)}</g>),
  stretchySkin: SKIN_BG('#f3d2b8', <g><path d="M40,50 Q60,10 80,50" fill="#f6dcc6" stroke="#d9a986" strokeWidth="2" /><circle cx="40" cy="50" r="7" fill="#e6b796" /><circle cx="80" cy="50" r="7" fill="#e6b796" /><path d="M58,22 l0,-10 m0,10 l-4,-4 m4,4 l4,-4" stroke="#7a5" strokeWidth="2" /></g>),
  hyperJoint: SKIN_BG('#eef1f4', <g fill="#f1c9ab" stroke="#d9a986" strokeWidth="2"><rect x="30" y="50" width="56" height="26" rx="10" /><path d="M80,56 Q102,30 92,10 L86,12 Q92,32 74,52 Z" /></g>),
  xpSkin: SKIN_BG('#f1c9ab', <g>{Array.from({ length: 26 }).map((_, i) => <circle key={i} cx={10 + ((i * 37) % 100)} cy={10 + ((i * 23) % 70)} r="2" fill="#8a5a3a" />)}<circle cx="78" cy="58" r="9" fill="#5b2f22" /><circle cx="40" cy="30" r="6" fill="#9a4a3a" /></g>),
  casalNecklace: SKIN_BG('#d9a77f', <g><path d="M10,30 Q60,70 110,30 L110,48 Q60,88 10,48 Z" fill="#6e3a22" opacity="0.8" /><text x="60" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#5a2a12">sun-exposed collar</text></g>),
  periorificial: SKIN_BG('#f1c9ab', <g><ellipse cx="60" cy="50" rx="16" ry="9" fill="#a64a3a" /><path d="M36,50 Q60,24 84,50 Q60,78 36,50 Z" fill="none" stroke="#d9654f" strokeWidth="6" opacity="0.75" /></g>),
  petechiae: SKIN_BG('#f3d2b8', <g fill="#a31d2b">{Array.from({ length: 22 }).map((_, i) => <circle key={i} cx={12 + ((i * 41) % 96)} cy={12 + ((i * 29) % 66)} r="1.6" />)}<ellipse cx="80" cy="56" rx="14" ry="9" fill="#6d4a96" opacity="0.55" /></g>),
  bleedingGums: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#5a2a2a" />
      <path d="M12,40 Q60,20 108,40 L108,52 Q60,34 12,52 Z" fill="#e0909a" />
      {[22, 36, 50, 64, 78, 92].map(x => <rect key={x} x={x} y="44" width="11" height="18" rx="3" fill="#fbf8ef" />)}
      {[30, 58, 86].map(x => <path key={x} d={`M${x},46 q2,6 0,10 q-2,-4 0,-10`} fill="#c0121f" />)}
    </g>
  ),
  bigTongue: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f1c9ab" />
      <path d="M30,30 Q60,18 90,30 Q92,50 60,52 Q28,50 30,30 Z" fill="#5a2a22" />
      <path d="M34,36 Q60,30 86,36 Q90,76 60,80 Q30,76 34,36 Z" fill="#e07a85" />
      <path d="M60,40 L60,66" stroke="#c45a66" strokeWidth="2" />
    </g>
  ),
  glossitis: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f1c9ab" />
      <path d="M30,30 Q60,18 90,30 Q92,50 60,52 Q28,50 30,30 Z" fill="#5a2a22" />
      <path d="M40,36 Q60,32 80,36 Q84,66 60,70 Q36,66 40,36 Z" fill="#e8384f" />
      <g fill="#d9534f"><circle cx="30" cy="32" r="4" /><circle cx="90" cy="32" r="4" /></g>
    </g>
  ),
  pittingEdema: SKIN_BG('#a8714d', <g><path d="M20,30 Q60,20 100,30 L100,80 L20,80 Z" fill="#b98262" /><ellipse cx="60" cy="50" rx="10" ry="7" fill="#8a5a3c" /><text x="60" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">press: dent stays</text></g>),

  // ── urine, stool, breath ────────────────────────────
  darkUrine: URINE('#2b1d14', <text x="60" y="12" textAnchor="middle" fontSize="9" fontWeight="800" fill="#2b1d14">darkens on standing</text>),
  diaperCrystals: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef1f4" />
      <path d="M14,24 L106,24 L92,76 Q60,86 28,76 Z" fill="#fff" stroke="#cfd6dc" strokeWidth="2" />
      {Array.from({ length: 16 }).map((_, i) => <circle key={i} cx={36 + ((i * 13) % 50)} cy={40 + ((i * 7) % 26)} r="2.2" fill="#e8742a" />)}
    </g>
  ),
  hexCrystal: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#e9eef3" />
      {[[40, 36, 16], [80, 54, 12], [72, 24, 8]].map(([x, y, r]) => (
        <polygon key={`${x}${y}`} points={Array.from({ length: 6 }).map((_, k) => `${x + r * Math.cos(k * Math.PI / 3)},${y + r * Math.sin(k * Math.PI / 3)}`).join(' ')} fill="rgba(190,215,235,0.7)" stroke="#5b85a8" strokeWidth="2" />
      ))}
    </g>
  ),
  needleCrystals: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef1ea" />
      {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={20 + i * 7} y1={20 + (i % 3) * 14} x2={36 + i * 7} y2={58 + (i % 2) * 10} stroke="#b88a2a" strokeWidth="2.4" />)}
    </g>
  ),
  maple: URINE('#c88a2a', <g><text x="60" y="12" textAnchor="middle" fontSize="9" fontWeight="800" fill="#8a5a12">sweet burnt-sugar smell</text><path d="M84,40 q6,-6 0,-12 q-6,-6 0,-12" stroke="#c88a2a" strokeWidth="2" fill="none" /></g>),
  mousy: URINE('#e4d27a', <text x="60" y="12" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7a6a1a">musty, mousy smell</text>),
  milkyPlasma: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef1f4" />
      <rect x="48" y="10" width="24" height="72" rx="10" fill="#fff" stroke="#9aa6b2" strokeWidth="2" />
      <rect x="50" y="20" width="20" height="16" fill="#fffdf2" />
      <rect x="50" y="36" width="20" height="44" rx="8" fill="#f3e8c9" />
      <text x="90" y="30" fontSize="8" fontWeight="800" fill="#7a6a3a">creamy</text>
      <text x="90" y="40" fontSize="8" fontWeight="800" fill="#7a6a3a">layer</text>
    </g>
  ),
  breathTest: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f4f1ea" />
      <polyline points="14,70 34,68 54,50 74,30 94,24 106,22" fill="none" stroke="#c0392b" strokeWidth="3" />
      <line x1="14" y1="76" x2="106" y2="76" stroke="#9aa6b2" strokeWidth="1.5" />
      <text x="60" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7a3a2a">breath H₂ after lactose</text>
    </g>
  ),
  fattyStool: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef1ea" />
      <ellipse cx="60" cy="54" rx="34" ry="18" fill="#d9c27a" />
      {[[44, 48], [64, 58], [76, 46], [52, 62]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#f6ecc2" />)}
      <text x="60" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#6a5a1a">pale, greasy, floats</text>
    </g>
  ),

  // ── smears, cells, biopsies ─────────────────────────
  acanthocyte: SMEAR(<g>{[[40, 44], [76, 48]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="14" fill="#d9637d" />{Array.from({ length: 9 }).map((_, k) => <circle key={k} cx={x + 15 * Math.cos(k * 0.7)} cy={y + 15 * Math.sin(k * 0.7)} r="3" fill="#d9637d" />)}</g>)}</g>),
  biteCells: SMEAR(<g><path d="M28,44 a16,16 0 1,0 30,-6 a8,8 0 0,1 -14,-6 a16,16 0 0,0 -16,12 Z" fill="#d9637d" /><circle cx="84" cy="46" r="15" fill="#d9637d" /><circle cx="80" cy="42" r="3.2" fill="#5a2a5a" /><circle cx="90" cy="50" r="2.6" fill="#5a2a5a" /></g>),
  hypersegmented: SMEAR(<g><circle cx="60" cy="45" r="24" fill="#e9d7ef" />{[[46, 38], [54, 50], [62, 36], [70, 50], [76, 40], [58, 58]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#6b3a8a" />)}<path d="M46,38 L54,50 L62,36 L70,50 L76,40 M54,50 L58,58" stroke="#6b3a8a" strokeWidth="2" /></g>),
  ringSidero: SMEAR(<g><circle cx="60" cy="45" r="22" fill="#d9c7e6" /><circle cx="60" cy="45" r="9" fill="#5a3a8a" />{Array.from({ length: 10 }).map((_, k) => <circle key={k} cx={60 + 13 * Math.cos(k * 0.63)} cy={45 + 13 * Math.sin(k * 0.63)} r="2.4" fill="#1f5fae" />)}</g>),
  echinocyte: SMEAR(<g>{[[40, 44], [78, 46]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="14" fill="#d9637d" />{Array.from({ length: 14 }).map((_, k) => <circle key={k} cx={x + 14 * Math.cos(k * 0.45)} cy={y + 14 * Math.sin(k * 0.45)} r="1.8" fill="#d9637d" />)}</g>)}</g>),
  foamCell: SMEAR(<g><circle cx="60" cy="45" r="28" fill="#f1e6ee" stroke="#c9a4b7" strokeWidth="2" />{Array.from({ length: 16 }).map((_, k) => <circle key={k} cx={46 + (k % 4) * 9} cy={32 + Math.floor(k / 4) * 8} r="3.6" fill="#fff" stroke="#d8bcd0" />)}<circle cx="72" cy="58" r="6" fill="#6b3a8a" /></g>),
  gaucherCell: SMEAR(<g><circle cx="60" cy="45" r="28" fill="#e2c9e6" />{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M36,${30 + i * 7} q12,-5 24,0 t24,0`} stroke="#b08ac2" strokeWidth="2" fill="none" />)}<circle cx="46" cy="58" r="6" fill="#5a2a7a" /></g>),
  globoidCell: SMEAR(<g>{[[40, 40], [64, 54], [84, 36]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="13" fill="#e0c3e8" />{[[-4, -3], [4, 2], [-2, 5]].map(([a, b]) => <circle key={`${a}${b}`} cx={x + a} cy={y + b} r="3" fill="#6b3a8a" />)}</g>)}</g>),
  inclusionCell: SMEAR(<g><circle cx="60" cy="45" r="26" fill="#efe2ea" stroke="#c9a4b7" strokeWidth="2" />{Array.from({ length: 12 }).map((_, k) => <circle key={k} cx={48 + (k % 4) * 8} cy={34 + Math.floor(k / 4) * 10} r="3.4" fill="#c98aa8" />)}</g>),
  raggedRed: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3d9de" />
      {[[30, 30], [72, 26], [52, 62], [92, 60]].map(([x, y], i) => <path key={i} d={`M${x - 16},${y} q4,-14 16,-14 q14,0 16,14 q-2,14 -16,14 q-14,0 -16,-14 Z`} fill={i === 1 ? '#b9283a' : '#e5a1ad'} stroke={i === 1 ? '#7a0f1f' : '#c9808d'} strokeWidth={i === 1 ? 3 : 1.5} strokeDasharray={i === 1 ? '3 2' : undefined} />)}
    </g>
  ),
  pasLiver: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3dbe8" />
      {Array.from({ length: 12 }).map((_, k) => <rect key={k} x={10 + (k % 4) * 26} y={10 + Math.floor(k / 4) * 26} width="22" height="22" rx="4" fill="#d14d8f" opacity={0.6 + (k % 3) * 0.13} />)}
      <text x="60" y="84" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7a1f4f">glycogen-packed (PAS)</text>
    </g>
  ),
  cilia: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#eef4fb" />
      <circle cx="60" cy="45" r="32" fill="#fff" stroke="#9fb5c6" strokeWidth="2" />
      {Array.from({ length: 9 }).map((_, k) => {
        const a = k * (2 * Math.PI / 9); const x = 60 + 22 * Math.cos(a); const y = 45 + 22 * Math.sin(a);
        return <g key={k}><circle cx={x - 2.5} cy={y} r="4" fill="#4a6fa5" /><circle cx={x + 2.5} cy={y} r="4" fill="#4a6fa5" /></g>;
      })}
      <circle cx="56" cy="45" r="4" fill="#4a6fa5" /><circle cx="64" cy="45" r="4" fill="#4a6fa5" />
      <text x="60" y="86" textAnchor="middle" fontSize="8" fontWeight="800" fill="#c0392b">dynein arms missing</text>
    </g>
  ),

  // ── films ────────────────────────────────────────────
  dextrocardia: XRAY(<g><path d="M30,14 Q60,8 90,14 L96,80 L24,80 Z" fill="#26313c" /><ellipse cx="44" cy="50" rx="12" ry="26" fill="#55636f" /><ellipse cx="78" cy="50" rx="12" ry="26" fill="#55636f" /><path d="M58,40 Q36,42 34,60 Q44,74 60,66 Z" fill="#cfd8de" /><text x="16" y="20" fontSize="10" fontWeight="900" fill="#fff">L</text></g>),
  bigHeart: XRAY(<g><path d="M30,14 Q60,8 90,14 L96,80 L24,80 Z" fill="#26313c" /><ellipse cx="60" cy="58" rx="32" ry="22" fill="#cfd8de" /></g>),
  bowedXray: XRAY(<g><path d="M44,10 Q28,46 44,80" stroke="#dfe7ec" strokeWidth="9" fill="none" /><path d="M76,10 Q92,46 76,80" stroke="#dfe7ec" strokeWidth="9" fill="none" /><g fill="#dfe7ec"><ellipse cx="44" cy="12" rx="9" ry="5" /><ellipse cx="76" cy="12" rx="9" ry="5" /></g></g>),
  fractures: XRAY(<g><path d="M30,14 L36,40 L33,44 L40,78" stroke="#dfe7ec" strokeWidth="8" fill="none" /><path d="M80,12 L76,36 L82,40 L78,80" stroke="#dfe7ec" strokeWidth="8" fill="none" /><g stroke="#f4b860" strokeWidth="2"><path d="M28,42 l14,0" /><path d="M72,38 l14,2" /></g></g>),
  rachiticRosary: XRAY(<g>{[0, 1, 2, 3, 4].map(i => <g key={i}><path d={`M20,${16 + i * 14} Q50,${10 + i * 14} 60,${18 + i * 14} Q70,${10 + i * 14} 100,${16 + i * 14}`} stroke="#9aa9b5" strokeWidth="4" fill="none" /><circle cx="42" cy={13 + i * 14} r="4" fill="#dfe7ec" /><circle cx="78" cy={13 + i * 14} r="4" fill="#dfe7ec" /></g>)}</g>),

  // ── DNA and chromosomes ─────────────────────────────
  trisomy21: KARYO('Trisomy 21', 3),
  trisomy18: KARYO('Trisomy 18', 3, '#4b8fa8'),
  trisomy13: KARYO('Trisomy 13', 3, '#a86b4b'),
  del5p: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3f1fb" />
      <rect x="40" y="22" width="9" height="44" rx="4.5" fill="#7d6bc4" />
      <rect x="68" y="34" width="9" height="32" rx="4.5" fill="#7d6bc4" />
      <rect x="66" y="18" width="13" height="14" rx="3" fill="none" stroke="#c0392b" strokeWidth="2" strokeDasharray="3 2" />
      <text x="60" y="82" textAnchor="middle" fontSize="11" fontWeight="800" fill="#463a7a">5p deleted</text>
    </g>
  ),
  del7q: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3f1fb" />
      <rect x="40" y="16" width="9" height="52" rx="4.5" fill="#7d6bc4" />
      <rect x="68" y="16" width="9" height="40" rx="4.5" fill="#7d6bc4" />
      <rect x="66" y="40" width="13" height="10" rx="3" fill="#f3f1fb" stroke="#c0392b" strokeWidth="2" strokeDasharray="3 2" />
      <text x="60" y="82" textAnchor="middle" fontSize="11" fontWeight="800" fill="#463a7a">7q11.23 deleted</text>
    </g>
  ),
  del22q: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3f1fb" />
      <rect x="40" y="26" width="9" height="36" rx="4.5" fill="#7d6bc4" />
      <rect x="68" y="26" width="9" height="28" rx="4.5" fill="#7d6bc4" />
      <rect x="66" y="40" width="13" height="10" rx="3" fill="#f3f1fb" stroke="#c0392b" strokeWidth="2" strokeDasharray="3 2" />
      <text x="60" y="82" textAnchor="middle" fontSize="11" fontWeight="800" fill="#463a7a">22q11 deleted</text>
    </g>
  ),
  imprint15: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f3f1fb" />
      <rect x="40" y="18" width="9" height="46" rx="4.5" fill="#4a90d9" />
      <rect x="68" y="18" width="9" height="46" rx="4.5" fill="#e07aa8" />
      <text x="44" y="14" textAnchor="middle" fontSize="9" fontWeight="800" fill="#4a90d9">dad</text>
      <text x="72" y="14" textAnchor="middle" fontSize="9" fontWeight="800" fill="#e07aa8">mum</text>
      <text x="60" y="82" textAnchor="middle" fontSize="11" fontWeight="800" fill="#463a7a">chromosome 15</text>
    </g>
  ),
  repeatCGG: DNA('CGG × 200+', <g fontSize="9" fontWeight="800" fill="#2f6b4f">{[0, 1, 2, 3].map(i => <text key={i} x="12" y={20 + i * 14}>CGG CGG CGG CGG CGG</text>)}</g>),
  repeatCAG: DNA('CAG expanded', <g fontSize="9" fontWeight="800" fill="#2f6b4f">{[0, 1, 2, 3].map(i => <text key={i} x="12" y={20 + i * 14}>CAG CAG CAG CAG CAG</text>)}</g>),
  repeatCTG: DNA('CTG expanded', <g fontSize="9" fontWeight="800" fill="#2f6b4f">{[0, 1, 2, 3].map(i => <text key={i} x="12" y={20 + i * 14}>CTG CTG CTG CTG CTG</text>)}</g>),
  repeatGAA: DNA('GAA expanded', <g fontSize="9" fontWeight="800" fill="#2f6b4f">{[0, 1, 2, 3].map(i => <text key={i} x="12" y={20 + i * 14}>GAA GAA GAA GAA GAA</text>)}</g>),
  thymineDimer: DNA('UV → T=T dimer', <g><path d="M20,24 L100,24 M20,58 L100,58" stroke="#2f6b4f" strokeWidth="3" />{[30, 46, 62, 78, 94].map(x => <line key={x} x1={x} y1="24" x2={x} y2="58" stroke="#7fb59a" strokeWidth="3" />)}<rect x="56" y="28" width="28" height="12" rx="4" fill="#f4b860" /><circle cx="22" cy="10" r="6" fill="#f4c430" /></g>),
  mismatch: DNA('mismatch left unfixed', <g><path d="M20,24 L100,24 M20,58 L100,58" stroke="#2f6b4f" strokeWidth="3" />{[30, 46, 62, 78, 94].map(x => <line key={x} x1={x} y1="24" x2={x} y2="58" stroke={x === 62 ? '#c0392b' : '#7fb59a'} strokeWidth="3" />)}<text x="66" y="44" fontSize="11" fontWeight="900" fill="#c0392b">G·T</text></g>),
  pedigreeXR: PEDIGREE('XR'),
  pedigreeAR: PEDIGREE('AR'),
  pedigreeAD: PEDIGREE('AD'),
  pedigreeMito: PEDIGREE('MT'),

  // ── lab readouts ─────────────────────────────────────
  lowGlucose: LAB('GLUCOSE', 'LOW', 'and NO ketones'),
  lowGlucoseKetones: LAB('GLUCOSE', 'LOW', 'with ketones'),
  highAmmonia: LAB('AMMONIA', 'HIGH', 'blood NH₃'),
  highLactate: LAB('LACTATE', 'HIGH', 'lactic acidosis'),
  highUrate: LAB('URIC ACID', 'HIGH', 'serum urate'),
  highLDL: LAB('LDL', 'VERY HIGH', 'cholesterol', '#e08a2a'),
  highTG: LAB('TRIGLYCERIDES', 'VERY HIGH', 'fasting', '#e08a2a'),
  highCK: LAB('CK', 'VERY HIGH', 'creatine kinase'),
  ckFlat: LAB('LACTATE', 'NO RISE', 'after exercise', '#e0b84a'),
  highPhe: LAB('PHENYLALANINE', 'HIGH', 'newborn screen'),
  highHcy: LAB('HOMOCYSTEINE', 'HIGH', 'plasma'),
  highMMA: LAB('METHYLMALONIC', 'HIGH', 'acid'),
  lowLymph: LAB('LYMPHOCYTES', 'VERY LOW', 'no thymic shadow'),
  sweatTest: LAB('SWEAT CHLORIDE', 'HIGH', 'pilocarpine test'),
  ptLong: LAB('PT / INR', 'PROLONGED', 'corrects with vitamin K'),
  lowCopper: LAB('COPPER', 'LOW', 'and ceruloplasmin'),
  vlcfa: LAB('VLCFA', 'HIGH', 'very-long-chain FA'),
  phytanic: LAB('PHYTANIC ACID', 'HIGH', 'plasma'),
  lowAlbumin: LAB('ALBUMIN', 'LOW', 'g/dL'),
  hematuria: LAB('URINE', 'BLOOD', 'microscopic haematuria'),
  oroticUrine: LAB('URINE OROTIC', 'HIGH', 'acid'),
  reducingSugar: LAB('URINE SUGAR', 'POSITIVE', 'reducing, not glucose'),
  hemolysis: LAB('HAEMOLYSIS', 'YES', 'LDH ↑, haptoglobin ↓'),
  galactose: LAB('GALACTOSE', 'HIGH', 'blood and urine'),
  colonTumor: (
    <g>
      <rect x="2" y="2" width="116" height="86" rx="10" fill="#f6ebe3" />
      <path d="M30,80 L30,30 Q30,16 46,16 L76,16 Q92,16 92,30 L92,80" stroke="#d99b84" strokeWidth="14" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="54" r="10" fill="#9a2a2a" />
      <text x="60" y="56" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7a2a2a">right side</text>
    </g>
  ),
};

export default function ExamInset({ kind }) {
  const art = KINDS[kind];
  if (!art) return null;
  return (
    <svg viewBox="0 0 120 90" className="hd-inset" aria-hidden="true">
      <defs>
        <radialGradient id="ins-fundus" cx="0.55" cy="0.5" r="0.6">
          <stop offset="0" stopColor="rgba(255,190,140,0.35)" />
          <stop offset="1" stopColor="rgba(80,10,0,0.35)" />
        </radialGradient>
      </defs>
      {art}
    </svg>
  );
}

export const INSET_KINDS = Object.keys(KINDS);
