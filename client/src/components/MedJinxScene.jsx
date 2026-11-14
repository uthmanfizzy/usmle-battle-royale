import { memo } from 'react';

/**
 * The room MedJinx is played in: a night ward drawn on a 320x180 grid, one
 * unit to a "pixel", and scaled up to cover the screen. Everything is built
 * from rectangles so it stays hard-edged at any size — there is no image
 * file behind this, which is why the mode adds nothing to the download.
 *
 * Purely decorative (aria-hidden), and static apart from a few CSS
 * animations that stop under prefers-reduced-motion.
 */

const R = ({ x, y, w, h = 1, f, o, c }) => (
  <rect x={x} y={y} width={w} height={h} fill={f} opacity={o} className={c} />
);

// A filled circle made of one-unit rows.
function disc(cx, cy, r, fill, key) {
  const rows = [];
  for (let j = -r; j < r; j++) {
    const hw = Math.round(Math.sqrt(r * r - (j + 0.5) ** 2));
    rows.push(<rect key={`${key}${j}`} x={cx - hw} y={cy + j} width={hw * 2} height={1.05} fill={fill} />);
  }
  return rows;
}

// A round-topped block: the window frame and the glass inside it.
function arch(cx, top, r, height, fill, key) {
  const rows = [];
  for (let j = 0; j < r; j++) {
    const hw = Math.round(Math.sqrt(r * r - (r - j - 0.5) ** 2));
    rows.push(<rect key={`${key}${j}`} x={cx - hw} y={top + j} width={hw * 2} height={1.05} fill={fill} />);
  }
  rows.push(<rect key={`${key}b`} x={cx - r} y={top + r} width={r * 2} height={height - r} fill={fill} />);
  return rows;
}

const STARS = [[-14, 30], [-6, 18], [5, 12], [12, 34], [-18, 44], [16, 22], [-2, 38], [9, 46], [-10, 52], [18, 50]];

function Window({ cx, moon = 1, id }) {
  const top = 14, r = 28, h = 86;
  return (
    <g>
      {arch(cx, top + 2, r + 2, h, '#161845', `${id}s`)}
      {arch(cx, top, r, h, '#6b62cf', `${id}f`)}
      {arch(cx, top + 4, r - 4, h - 8, '#0b0f36', `${id}g`)}
      <R x={cx - r + 4} y={top + 52} w={(r - 4) * 2} h={30} f="#121a52" />
      {STARS.map(([dx, dy], i) => (
        <R key={i} x={cx + dx} y={top + dy} w={1} h={1} f="#dfe6ff" c={`mjx-star mjx-star--${i % 3}`} />
      ))}
      {disc(cx + moon * 11, top + 22, 5, '#f6f0c8', `${id}m`)}
      <R x={cx + moon * 11 - 2} y={top + 20} w={2} h={2} f="#e2d9a4" />
      {/* the hospital across the street */}
      <R x={cx - 16} y={top + 50} w={22} h={32} f="#1c2b78" />
      <R x={cx - 16} y={top + 50} w={22} h={2} f="#2b3fa0" />
      <R x={cx + 8} y={top + 60} w={12} h={22} f="#17225f" />
      {[0, 1, 2].map(row => [0, 1, 2].map(col => (
        <R key={`${row}${col}`} x={cx - 13 + col * 6} y={top + 58 + row * 8} w={3} h={4}
          f={(row + col) % 3 === 1 ? '#3a4aa8' : '#ffd95e'} />
      )))}
      <R x={cx + 11} y={top + 66} w={2} h={3} f="#ffd95e" />
      <R x={cx + 15} y={top + 72} w={2} h={3} f="#ffd95e" />
      <R x={cx - 9} y={top + 41} w={8} h={8} f="#f4f6ff" />
      <R x={cx - 6} y={top + 42} w={2} h={6} f="#e23b4a" />
      <R x={cx - 8} y={top + 44} w={6} h={2} f="#e23b4a" />
      {/* glazing bars, then the sill */}
      <R x={cx - 1} y={top + 4} w={2} h={h - 8} f="#5a52b8" />
      <R x={cx - r + 4} y={top + 46} w={(r - 4) * 2} h={2} f="#5a52b8" />
      <R x={cx - r - 4} y={top + h} w={r * 2 + 8} h={4} f="#7d74de" />
      <R x={cx - r - 4} y={top + h + 4} w={r * 2 + 8} h={2} f="#161845" />
    </g>
  );
}

const SPINES = ['#e2504c', '#3fa7e0', '#35c48a', '#f2c84b', '#8b5cf6', '#e2504c', '#3fa7e0', '#f08a3c', '#35c48a'];
const BOOKS = [['USMLE', '#2f6fd6'], ['PLAB', '#2596c9'], ['AMC', '#6b3fc4'], ['MCCQE', '#4c2c96']];
const FLOOR_BOOKS = [['ANATOMY', '#2f6fd6'], ['PATHOLOGY', '#35a37a'], ['PHARMACOLOGY', '#6b3fc4']];

function Flask({ x, y, fill }) {
  return (
    <g>
      <R x={x + 2} y={y} w={4} h={1} f="#cfe6ff" />
      <R x={x + 3} y={y + 1} w={2} h={5} f="#9fc4ee" o={0.85} />
      <R x={x + 2} y={y + 6} w={4} h={2} f="#9fc4ee" o={0.85} />
      <R x={x + 1} y={y + 8} w={6} h={2} f={fill} />
      <R x={x} y={y + 10} w={8} h={3} f={fill} />
      <R x={x + 1} y={y + 9} w={1} h={2} f="#ffffff" o={0.5} />
    </g>
  );
}

function Plant({ x, y }) {
  return (
    <g>
      <R x={x + 3} y={y - 9} w={2} h={9} f="#2f9e5a" />
      <R x={x} y={y - 7} w={3} h={2} f="#3fc070" />
      <R x={x + 5} y={y - 10} w={3} h={2} f="#3fc070" />
      <R x={x + 1} y={y - 12} w={2} h={3} f="#2f9e5a" />
      <R x={x + 5} y={y - 5} w={3} h={2} f="#2f9e5a" />
      <R x={x} y={y} w={8} h={2} f="#e9e4f5" />
      <R x={x + 1} y={y + 2} w={6} h={4} f="#cfc8e6" />
    </g>
  );
}

function Kit({ x, y, body = '#f1f3fa', cross = '#e23b4a' }) {
  return (
    <g>
      <R x={x + 8} y={y - 3} w={8} h={3} f="#8d93b8" />
      <R x={x + 10} y={y - 2} w={4} h={2} f="#252869" />
      <R x={x} y={y} w={24} h={16} f={body} />
      <R x={x} y={y + 14} w={24} h={2} f="#000" o={0.18} />
      <R x={x + 10} y={y + 3} w={4} h={10} f={cross} />
      <R x={x + 7} y={y + 6} w={10} h={4} f={cross} />
    </g>
  );
}

function MedJinxScene() {
  return (
    <svg
      className="mjx-scene"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* wall */}
      <R x={0} y={0} w={320} h={150} f="#262a6e" />
      {Array.from({ length: 20 }).map((_, i) => <R key={i} x={i * 16 + 7} y={0} w={1} h={150} f="#21245f" />)}
      <R x={0} y={0} w={320} h={6} f="#1b1d52" />

      <Window cx={62} moon={1} id="wl" />
      <Window cx={258} moon={-1} id="wr" />

      {/* the shelf: exam books, a neon caduceus, flasks, a brain — hung high,
          so it clears the question panel (see .mjx-stage's top padding) */}
      <g transform="translate(0 -13)">
      <R x={106} y={46} w={108} h={3} f="#9a6642" />
      <R x={106} y={49} w={108} h={1} f="#5e3a24" />
      <R x={112} y={50} w={3} h={5} f="#5e3a24" />
      <R x={205} y={50} w={3} h={5} f="#5e3a24" />
      {BOOKS.map(([label, fill], i) => (
        <g key={label}>
          <R x={112} y={17 + i * 7.2} w={38} h={6.6} f={fill} />
          <R x={112} y={17 + i * 7.2} w={4} h={6.6} f="#e2504c" />
          <R x={146} y={17 + i * 7.2} w={2} h={6.6} f="#f2c84b" o={0.8} />
          <text x={119} y={22.2 + i * 7.2} className="mjx-scene-text" fontSize="4">{label}</text>
        </g>
      ))}
      <g className="mjx-neon">
        <R x={164} y={13} w={2} h={32} f="#48e6ff" />
        {disc(165, 12, 2, '#9ff3ff', 'cd')}
        <R x={154} y={16} w={10} h={2} f="#48e6ff" />
        <R x={166} y={16} w={10} h={2} f="#48e6ff" />
        <R x={156} y={18} w={7} h={1} f="#48e6ff" />
        <R x={167} y={18} w={7} h={1} f="#48e6ff" />
        <R x={158} y={19} w={5} h={1} f="#48e6ff" />
        <R x={167} y={19} w={5} h={1} f="#48e6ff" />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <R x={161} y={23 + i * 7} w={3} h={1.5} f="#48e6ff" />
            <R x={166} y={26.5 + i * 7} w={3} h={1.5} f="#48e6ff" />
            <R x={160} y={24.5 + i * 7} w={1.5} h={2} f="#48e6ff" />
            <R x={168.5} y={28 + i * 7} w={1.5} h={2} f="#48e6ff" />
          </g>
        ))}
      </g>
      <Flask x={177} y={33} fill="#3d8bff" />
      <Flask x={186} y={33} fill="#a25bff" />
      {disc(200, 39, 6, '#ee8fb0', 'br')}
      <R x={199} y={33} w={1} h={12} f="#c96a8e" />
      <R x={196} y={37} w={3} h={1} f="#c96a8e" />
      <R x={201} y={40} w={4} h={1} f="#c96a8e" />
      <R x={196} y={42} w={3} h={1} f="#c96a8e" />
      <R x={198} y={45} w={4} h={1} f="#8d93b8" />

      {/* a heartbeat in neon, under the shelf */}
      <polyline
        className="mjx-ecg-base"
        points="88,57 136,57 139,54 142,60 145,52 149,61 152,57 176,57 179,54 182,60 185,53 188,61 191,57 232,57"
        fill="none" stroke="#48e6ff" strokeWidth="1" shapeRendering="auto"
      />
      <polyline
        className="mjx-ecg"
        points="88,57 136,57 139,54 142,60 145,52 149,61 152,57 176,57 179,54 182,60 185,53 188,61 191,57 232,57"
        fill="none" stroke="#48e6ff" strokeWidth="1.2" shapeRendering="auto"
      />
      </g>

      {/* a poster */}
      <R x={296} y={36} w={20} h={26} f="#161845" />
      <R x={297} y={37} w={18} h={24} f="#3a3f9a" />
      <polyline points="299,44 303,44 305,40 307,47 309,44 313,44" fill="none" stroke="#9fb4ff" strokeWidth="0.8" shapeRendering="auto" />
      <text x={306} y={52} className="mjx-scene-text" fontSize="2.6" textAnchor="middle">KEEP</text>
      <text x={306} y={57} className="mjx-scene-text" fontSize="2.6" textAnchor="middle">STUDYING</text>

      {/* candle on the right-hand sill */}
      <R x={228} y={93} w={3} h={7} f="#f3ead2" />
      <R x={229} y={89} w={1} h={3} f="#ffcf4a" c="mjx-flame" />
      <R x={228.5} y={90} w={2} h={2} f="#ff9a3c" o={0.7} c="mjx-flame" />

      {/* skirting and floor */}
      <R x={0} y={146} w={320} h={4} f="#3b3585" />
      <R x={0} y={150} w={320} h={30} f="#2a1f52" />
      <R x={0} y={150} w={320} h={1} f="#4b3f8a" />
      {[160, 170].map(y => <R key={y} x={0} y={y} w={320} h={1} f="#21183f" />)}
      {Array.from({ length: 14 }).map((_, i) => (
        <R key={i} x={i * 24 + (i % 2 ? 9 : 0)} y={i % 3 === 0 ? 151 : i % 3 === 1 ? 161 : 171} w={1} h={9} f="#21183f" />
      ))}

      {/* bookcase, left */}
      <R x={4} y={98} w={38} h={52} f="#4a2e1f" />
      <R x={6} y={100} w={34} h={48} f="#1a1440" />
      {[0, 1, 2].map(row => (
        <g key={row}>
          <R x={6} y={114 + row * 16} w={34} h={2} f="#6a4530" />
          {SPINES.slice(0, 8).map((f, i) => (
            <R key={i} x={7 + i * 4} y={102 + row * 16 + ((i * 7 + row * 3) % 4)} w={3}
              h={12 - ((i * 7 + row * 3) % 4)} f={SPINES[(i + row * 2) % SPINES.length]} />
          ))}
        </g>
      ))}
      <Plant x={10} y={92} />
      <Plant x={26} y={93} />

      {/* on the floor, left: first-aid box and the pre-clinical books */}
      <Kit x={8} y={156} />
      {FLOOR_BOOKS.map(([label, fill], i) => (
        <g key={label}>
          <R x={40 + i} y={155 + i * 6} w={46} h={5.4} f={fill} />
          <R x={40 + i} y={155 + i * 6} w={4} h={5.4} f="#f2c84b" />
          <text x={47 + i} y={159.3 + i * 6} className="mjx-scene-text" fontSize="3.1">{label}</text>
        </g>
      ))}
      <Plant x={92} y={164} />
      <Flask x={104} y={160} fill="#35b8ff" />

      {/* right: drip stand, monitor on a trolley, a bed, a red kit */}
      <R x={226} y={104} w={1.5} h={62} f="#aeb4d6" />
      <R x={221} y={104} w={12} h={1.5} f="#aeb4d6" />
      <R x={221} y={107} w={5} h={9} f="#dff1ff" />
      <R x={222} y={111} w={3} h={4} f="#5ab0ff" />
      <R x={223} y={116} w={1} h={14} f="#7f86ad" />
      <R x={220} y={166} w={14} h={2} f="#7f86ad" />

      <R x={238} y={112} w={24} h={18} f="#cfd3ea" />
      <R x={240} y={114} w={20} h={13} f="#0c1a2c" />
      <polyline className="mjx-monitor" points="241,121 245,121 247,117 249,125 251,119 253,121 259,121"
        fill="none" stroke="#49f08a" strokeWidth="0.9" shapeRendering="auto" />
      <R x={246} y={130} w={8} h={3} f="#9aa0c2" />
      <R x={236} y={133} w={28} h={3} f="#b9bedb" />
      <R x={238} y={136} w={2} h={28} f="#8d93b8" />
      <R x={260} y={136} w={2} h={28} f="#8d93b8" />
      <R x={238} y={148} w={24} h={2} f="#8d93b8" />
      <R x={241} y={139} w={18} h={7} f="#dfe3f5" />

      <R x={270} y={128} w={3} h={38} f="#aeb4d6" />
      <R x={270} y={144} w={50} h={4} f="#aeb4d6" />
      <R x={273} y={136} w={47} h={8} f="#eef1fb" />
      <R x={290} y={137} w={30} h={7} f="#3d7fe0" />
      <R x={274} y={131} w={13} h={6} f="#ffffff" />
      <R x={273} y={148} w={47} h={3} f="#6a70a0" />

      <Kit x={244} y={158} body="#d92f3f" cross="#ffffff" />
    </svg>
  );
}

export default memo(MedJinxScene);
