import { useEffect, useRef, useState } from 'react';
import { startScene, createMenuAudio, W, H } from './moonlitFx';
import './MoonlitMenu.css';

/**
 * Moonlit — the "Main Menu" design as the home screen (Settings → Appearance
 * → Moonlit). A moonlit painting of the floating city, gently moving, with
 * the menu over it.
 *
 * The painting and its effects live on a 1672 × 941 "stage" scaled to cover
 * the screen, so the glows and the canvas stay pinned to the art. The menu
 * itself is laid out with ordinary responsive CSS on top, so it never gets
 * cropped on a narrow screen.
 *
 * Honest content: the design's "Events" is News (no events feature exists),
 * and its "Upcoming Event" panel shows the newest announcement.
 */

export const ART = '/themes/moonlit';

function useCoverScale() {
  const [fit, setFit] = useState({ s: 1, x: 0, y: 0 });
  useEffect(() => {
    const on = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.max(vw / W, vh / H);
      setFit({ s, x: (vw - W * s) / 2, y: (vh - H * s) / 2 });
    };
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return fit;
}

function ago(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return '';
  const d = Math.floor((Date.now() - t) / 86400000);
  if (d <= 0) return 'Posted today';
  if (d === 1) return 'Posted yesterday';
  if (d < 30) return `Posted ${d} days ago`;
  return `Posted ${new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

// ── Icons from the design ─────────────────────────────────────────────────────
const SPRIG = 'M6.0,9.0 C8.4,6.0 7.8,1.8 4.7,-0.4 C2.3,2.6 2.9,6.8 6.0,9.0 Z M8.0,17.0 C6.7,12.8 2.5,10.5 -1.7,11.8 C-0.4,16.0 3.8,18.3 8.0,17.0 Z M8.6,16.0 C12.6,15.1 14.8,11.3 13.6,7.3 C9.6,8.3 7.4,12.1 8.6,16.0 Z M12.0,24.5 C9.9,20.5 5.1,18.9 1.1,20.9 C3.1,25.0 7.9,26.5 12.0,24.5 Z M13.2,23.0 C17.1,21.3 18.7,17.0 16.8,13.1 C12.9,14.8 11.3,19.2 13.2,23.0 Z M18.0,30.5 C15.1,27.0 10.1,26.5 6.6,29.3 C9.4,32.8 14.5,33.3 18.0,30.5 Z M19.6,29.4 C23.0,27.0 23.6,22.7 21.0,19.5 C17.6,21.9 17.0,26.2 19.6,29.4 Z';
function Sprig({ flip }) {
  return (
    <svg className="ml-sprig" aria-hidden="true" width="32" height="38" viewBox="0 0 32 38">
      <g transform={flip ? 'translate(30,1) scale(-1,1)' : 'translate(2,1)'}>
        <path d="M27,36 C17,31 8,21 6,6" fill="none" stroke="#d9a550" strokeWidth="1.6" strokeLinecap="round" />
        <path d={SPRIG} fill="#e4b05a" />
      </g>
    </svg>
  );
}
function Trophy({ size = 74 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 74 74">
      <path d="M18,14 H9 q-3,0 -3,4 c0,12 6,18 16,20" fill="none" stroke="#e9b25c" strokeWidth="5" strokeLinecap="round" />
      <path d="M56,14 H65 q3,0 3,4 c0,12 -6,18 -16,20" fill="none" stroke="#e9b25c" strokeWidth="5" strokeLinecap="round" />
      <path d="M16,6 H58 V24 c0,13 -9,22 -21,22 s-21,-9 -21,-22 Z" fill="#f3c06c" />
      <path d="M21,9 h7 v17 c0,7 2,12 5,16 c-8,-3 -12,-10 -12,-18 Z" fill="#fbdc9a" opacity=".75" />
      <rect x="14" y="3" width="46" height="6" rx="2.4" fill="#fbdc9a" />
      <path d="M32,45 h10 l2,13 h-14 Z" fill="#e0a24a" />
      <rect x="22" y="58" width="30" height="6" rx="1.6" fill="#f0bd69" />
      <rect x="18" y="64" width="38" height="8" rx="2" fill="#e0a24a" />
    </svg>
  );
}
const CARD_ICONS = {
  profile: (
    <svg aria-hidden="true" width="52" height="62" viewBox="0 0 52 62">
      <circle cx="26" cy="14.5" r="14.5" fill="#efe3d0" />
      <path d="M0,57 V56 A26,24 0 0 1 52,56 V57 A5,5 0 0 1 47,62 H5 A5,5 0 0 1 0,57 Z" fill="#efe3d0" />
    </svg>
  ),
  leaderboard: <Trophy />,
  clans: (
    <svg aria-hidden="true" width="64" height="78" viewBox="0 0 64 78">
      <path d="M32,1 C40,7 52,10 63,10 V38 C63,57 50,70 32,77 C14,70 1,57 1,38 V10 C12,10 24,7 32,1 Z" fill="#ebe4d8" />
      <path d="M32,8 C39,12.5 48,15 57,15.5 V38 C57,53 47,64 32,70.5 C17,64 7,53 7,38 V15.5 C16,15 25,12.5 32,8 Z" fill="#4254a4" />
      <path d="M32,8 C39,12.5 48,15 57,15.5 V38 C57,40 56.8,42 56.4,44 C40,40 22,28 14,14.6 C20,13.6 27,11.2 32,8 Z" fill="#5568bd" opacity=".55" />
      <path d="M27,23 h10 v10.5 h10.5 v10 H37 V54 H27 V43.5 H16.5 v-10 H27 Z" fill="#f3ead8" />
    </svg>
  ),
  news: (
    <svg aria-hidden="true" width="69" height="72" viewBox="0 0 69 72">
      <rect x="0" y="8" width="69" height="64" rx="8" fill="#efe6d6" />
      <path d="M0,26 V16 a8,8 0 0 1 8,-8 H61 a8,8 0 0 1 8,8 V26 Z" fill="#f7f0e3" />
      <rect x="13.5" y="0" width="6.5" height="17" rx="3.2" fill="#f7f0e3" stroke="#28356f" strokeWidth="2" />
      <rect x="49" y="0" width="6.5" height="17" rx="3.2" fill="#f7f0e3" stroke="#28356f" strokeWidth="2" />
      <rect x="9" y="32" width="9" height="8" fill="#28356f" />
      <rect x="9" y="52" width="9" height="8" fill="#28356f" />
      <rect x="51" y="32" width="9" height="8" fill="#28356f" />
      <rect x="51" y="52" width="9" height="5" fill="#28356f" />
      <path d="M34.5,32.5 L37.9,41.6 L47.6,42 L40,48.1 L42.6,57.4 L34.5,52.1 L26.4,57.4 L29,48.1 L21.4,42 L31.1,41.6 Z" fill="#c9903e" stroke="#28356f" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  ),
};
// Ornate gold frame shared by the panel and the cards.
function Frame() {
  return (
    <svg className="ml-frame" aria-hidden="true" viewBox="0 0 200 160" preserveAspectRatio="none">
      <rect x="0.75" y="0.75" width="198.5" height="158.5" rx="18" fill="none" stroke="#c9a56a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const CARDS = [
  { key: 'profile', label: 'Profile', href: '/progress', tone: 1046.5 },
  { key: 'leaderboard', label: 'Leaderboards', tab: 'leaderboard', tone: 1174.66 },
  { key: 'clans', label: 'Clans', tab: 'clans', tone: 1318.5 },
  { key: 'news', label: 'News', tab: 'announcements', tone: 1567.98 },
];

export default function MoonlitMenu({ user, announcements = [], unread = 0, onTab, onPlay, onLogout }) {
  const fit = useCoverScale();
  const canvasRef = useRef(null);
  const burst = useRef(false);
  const audio = useRef(null);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    const a = createMenuAudio();
    audio.current = a;
    return () => a.close();
  }, []);
  useEffect(() => {
    if (!canvasRef.current) return undefined;
    return startScene(canvasRef.current, {
      consumeBurst: () => { const b = burst.current; burst.current = false; return b; },
    });
  }, []);

  // Read the ref when a handler runs, not at render (it is set in an effect).
  const sfx = {
    unlock: () => audio.current?.unlock(),
    hover: (f) => audio.current?.hover(f),
    click: (k, f) => audio.current?.click(k, f),
  };
  const hover = (f) => () => sfx?.hover(f);
  const go = (fn, kind, f) => (e) => {
    sfx?.click(kind, f);
    fn?.(e);
  };

  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpPct = Math.round(((xp % 500) / 500) * 100);
  const latest = announcements?.[0] || null;

  const play = () => {
    burst.current = true;
    setFlash(f => f + 1);
    sfx?.click('play');
    // Let the burst and the chord land before the screen changes.
    setTimeout(() => onPlay?.(), 420);
  };
  const openCard = (c) => (e) => {
    sfx?.click('tap', c.tone);
    if (c.tab) { e.preventDefault(); onTab?.(c.tab); }
  };

  return (
    <div className="ml" onPointerDown={() => sfx?.unlock()}>
      {/* ── The painting ── */}
      <div className="ml-stage" aria-hidden="true"
        style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.s})` }}>
        <div className="ml-scene">
          <img src={`${ART}/scene.jpg`} alt="" className="ml-scene-img" />
          <div className="ml-glow ml-pulse" style={{ left: 433, top: -5, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle closest-side, rgba(255,236,190,0) 48%, rgba(255,232,180,.4) 53%, rgba(255,226,170,.14) 72%, rgba(255,226,170,0) 100%)' }} />
          <div className="ml-glow ml-pulse-c" style={{ left: 810, top: -30, width: 640, height: 300, background: 'radial-gradient(ellipse closest-side, rgba(244,176,255,.2), rgba(244,176,255,0) 100%)' }} />
          <div className="ml-glow ml-pulse-b" style={{ left: 809, top: 89, width: 620, height: 190, background: 'radial-gradient(ellipse closest-side, rgba(255,214,130,.3), rgba(255,200,120,.1) 55%, rgba(255,200,120,0) 100%)' }} />
          <div className="ml-glow ml-pulse" style={{ left: 945, top: 265, width: 520, height: 260, background: 'radial-gradient(ellipse closest-side, rgba(255,205,120,.2), rgba(255,205,120,0) 100%)' }} />
          <div className="ml-glow ml-flicker" style={{ left: 9, top: 563, width: 200, height: 200, background: 'radial-gradient(circle closest-side, rgba(255,190,100,.5), rgba(255,170,80,.16) 45%, rgba(255,170,80,0) 100%)' }} />
          <div className="ml-glow ml-pulse-b" style={{ left: 1510, top: 768, width: 130, height: 130, background: 'radial-gradient(circle closest-side, rgba(96,205,255,.45), rgba(96,205,255,0) 100%)' }} />
          <div className="ml-fall" style={{ left: 1383, top: 496, width: 72, height: 205 }} />
          <div className="ml-fall ml-fall--slow" style={{ left: 428, top: 330, width: 24, height: 132 }} />
          <div className="ml-fall" style={{ left: 1155, top: 832, width: 40, height: 109 }} />
          <div className="ml-fall ml-fall--slow" style={{ left: 1320, top: 805, width: 30, height: 55 }} />
          <div className="ml-mist" style={{ left: 1328, top: 664, width: 190, height: 76 }} />
          <canvas ref={canvasRef} width={W} height={H} className="ml-canvas" />
        </div>
        <div className="ml-cloud ml-cloud--c" />
        <div className="ml-cloud ml-cloud--a" />
        <div className="ml-cloud ml-cloud--b" />
        <div key={flash} className={`ml-flash${flash ? ' is-on' : ''}`} />
        {/* Soft vignette so the menu reads over the bright parts of the art. */}
        <div className="ml-vignette" />
      </div>

      {/* ── The menu ── */}
      <header className="ml-top">
        <a className="ml-chip" href="/progress" aria-label={`${user?.username || 'Player'}, level ${level}: open profile`}
          onMouseEnter={hover(1174.66)} onClick={() => sfx?.click('tap', 1174.66)}>
          <span className="ml-chip-pill" />
          <span className="ml-chip-av">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
              : <span>{(user?.username || 'P')[0].toUpperCase()}</span>}
          </span>
          <span className="ml-chip-body">
            <span className="ml-chip-name">
              <svg aria-hidden="true" width="26" height="24" viewBox="0 0 30 28">
                <path d="M3,21 L1,6 L9,12 L15,1 L21,12 L29,6 L27,21 Z" fill="#f6cf85" stroke="#f6cf85" strokeWidth="2" strokeLinejoin="round" />
                <rect x="2.5" y="22.5" width="25" height="4.5" rx="1.6" fill="#e9b458" />
              </svg>
              <span>{user?.username || 'Player'}</span>
            </span>
            <span className="ml-chip-rule" />
            <span className="ml-chip-lvl">
              <span>Level {level}</span>
              <span className="ml-chip-xp" title={`${xp % 500} / 500 XP`}><i style={{ width: `${xpPct}%` }} /></span>
            </span>
          </span>
        </a>

        <div className="ml-rounds">
          <a className="ml-round" href="/settings" aria-label="Settings" onMouseEnter={hover(1760)} onClick={() => sfx?.click('settings')}>
            <svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30">
              <g transform="translate(15,15)" fill="#e9e6ec">
                {[0, 45, 90, 135, 180, 225, 270, 315].map(r => <rect key={r} x="-3.3" y="-13.2" width="6.6" height="7" rx="1.6" transform={`rotate(${r})`} />)}
                <circle cx="0" cy="0" r="6.6" fill="none" stroke="#e9e6ec" strokeWidth="5.4" />
              </g>
            </svg>
          </a>
          <button type="button" className="ml-round" aria-label={unread ? `News, ${unread} new` : 'News'}
            onMouseEnter={hover(1975.53)} onClick={go(() => onTab?.('announcements'), 'bell')}>
            <svg aria-hidden="true" width="28" height="30" viewBox="0 0 28 30">
              <path d="M14,2 a2,2 0 0 1 2,2 v.8 c4,1 6.6,4.4 6.6,8.6 v5.4 l2.4,3 v1.2 H3 v-1.2 l2.4,-3 v-5.4 c0,-4.2 2.6,-7.6 6.6,-8.6 V4 a2,2 0 0 1 2,-2 Z" fill="#e9e6ec" />
              <path d="M11,25.4 a3,3 0 0 0 6,0 Z" fill="#e9e6ec" />
            </svg>
            {unread > 0 && (<><span className="ml-ping" aria-hidden="true" /><span className="ml-dot" aria-hidden="true">{unread > 9 ? '9+' : unread}</span></>)}
          </button>
          <button type="button" className="ml-round" aria-label="Log out" onMouseEnter={hover(2093)} onClick={go(onLogout, 'logout')}>
            <svg aria-hidden="true" width="30" height="28" viewBox="0 0 30 28">
              <path d="M16,3 H7 a3,3 0 0 0 -3,3 v16 a3,3 0 0 0 3,3 H16" fill="none" stroke="#e9e6ec" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11,14 H21" fill="none" stroke="#e9e6ec" strokeWidth="3.4" strokeLinecap="round" />
              <path d="M20.5,8 L27,14 L20.5,20 Z" fill="#e9e6ec" stroke="#e9e6ec" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <aside className="ml-event">
        <Frame />
        <div className="ml-event-head">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20"><path d="M10,.5 L12.47,7.1 L19.51,7.41 L13.99,11.8 L15.88,18.59 L10,14.7 L4.12,18.59 L6.01,11.8 L.49,7.41 L7.53,7.1 Z" fill="#f3c873" /></svg>
          <span>Latest News</span>
        </div>
        <div className="ml-event-body">
          <Trophy size={46} />
          <span className="ml-event-text">
            <b>{latest ? (latest.title || 'Announcement') : 'No news yet'}</b>
            <small>{latest ? ago(latest.created_at || latest.date) : 'Check back soon'}</small>
          </span>
        </div>
        <button type="button" className="ml-event-link" onMouseEnter={hover(1318.5)} onClick={go(() => onTab?.('announcements'), 'tap', 1318.5)}>
          View News
          <svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12"><path d="M1,6 H12 M8,2 L12,6 L8,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </aside>

      {/* Title, Play and the cards sit on the same scaled stage as the
          painting, at the design's positions, so they always cover the
          soft patches the art leaves for them. (Phones: normal flow.) */}
      <div className="ml-uistage" style={{ '--fit': `translate(${fit.x}px, ${fit.y}px) scale(${fit.s})` }}>
      <main className="ml-center">
        <div className="ml-crest" aria-hidden="true">
          <svg className="ml-crest-line" viewBox="0 0 500 240" width="500" height="240">
            <path d="M150,84 C220,72 290,70 340,72" fill="none" stroke="#f3dfb4" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
            <path d="M92,100 C50,112 10,128 16,150 C22,170 120,172 253,171 L253,169 C130,168 40,164 30,148 C24,134 55,116 92,100 Z" fill="#f3dfb4" />
            <path d="M253,170 L258,170 L262,165 L266,176 L272,154 L279,188 L285,163 L290,174 L294,169 L300,170 L400,170" fill="none" stroke="#f3dfb4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M400,170 L467,169" fill="none" stroke="#f3dfb4" strokeWidth="1.4" strokeLinecap="round" opacity=".55" />
            <path className="ml-beat" d="M120,171 L253,170 L258,170 L262,165 L266,176 L272,154 L279,188 L285,163 L290,174 L294,169 L300,170 L467,169" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34 500" strokeDashoffset="568" opacity=".95" />
            <g transform="translate(60,13)">
              <path d="M48,32 C36,24 18,24 2,28 C8,34 12,36 16,36 C14,38 18,42 24,42 C24,45 30,47 36,45 C40,47 46,44 48,40 Z" fill="#f6ead0" />
              <path d="M56,32 C68,24 86,24 102,28 C96,34 92,36 88,36 C90,38 86,42 80,42 C80,45 74,47 68,45 C64,47 58,44 56,40 Z" fill="#f6ead0" />
              <path d="M52,0 C58,9 60,14 60,18 a8,8 0 0 1 -16,0 C44,14 46,9 52,0 Z" fill="#f6ead0" />
              <rect x="49" y="24" width="6" height="102" rx="2" fill="#f6ead0" />
              <path d="M52,140 l-4,-8 4,-7 4,7 Z" fill="#f6ead0" />
              <path d="M39,47 C30,53 34,62 52,68 C70,74 70,86 52,91 C38,95 38,105 52,109 C61,112 60,119 53,122" fill="none" stroke="#1f3170" strokeWidth="9" strokeLinecap="round" />
              <path d="M39,47 C30,53 34,62 52,68 C70,74 70,86 52,91 C38,95 38,105 52,109 C61,112 60,119 53,122" fill="none" stroke="#f6ead0" strokeWidth="5" strokeLinecap="round" />
              <path d="M65,47 C74,53 70,62 52,68 C34,74 34,86 52,91 C66,95 66,105 52,109 C43,112 44,119 51,122" fill="none" stroke="#1f3170" strokeWidth="9" strokeLinecap="round" />
              <path d="M65,47 C74,53 70,62 52,68 C34,74 34,86 52,91 C66,95 66,105 52,109 C43,112 44,119 51,122" fill="none" stroke="#f6ead0" strokeWidth="5" strokeLinecap="round" />
              <ellipse cx="37" cy="45" rx="6" ry="4" transform="rotate(-28 37 45)" fill="#f6ead0" />
              <ellipse cx="67" cy="45" rx="6" ry="4" transform="rotate(28 67 45)" fill="#f6ead0" />
            </g>
            <path className="ml-twinkle" d="M457,48 Q458.6,68 473,72 Q458.6,76 457,96 Q455.4,76 441,72 Q455.4,68 457,48 Z" fill="#f8e6bd" />
            <path className="ml-twinkle-b" d="M15,83 Q15.8,89.2 22,90 Q15.8,90.8 15,97 Q14.2,90.8 8,90 Q14.2,89.2 15,83 Z" fill="#f3d9a2" />
          </svg>
          <h1 className="ml-title">Medvale</h1>
        </div>
        <p className="ml-tagline">
          <span>Learn</span><i aria-hidden="true" /><span>Play</span><i aria-hidden="true" /><span>Excel</span>
        </p>

        <button type="button" className="ml-play" aria-label="Play" onMouseEnter={hover(1567.98)} onClick={play}>
          <span className="ml-play-glow">
            <span className="ml-play-body"><span className="ml-sheen" /></span>
          </span>
          <svg className="ml-play-frame" aria-hidden="true" width="392" height="101" viewBox="0 0 392 101">
            <path d="M82,7 H308 Q328,7 336,24 Q344,40 362,50.5 Q344,61 336,77 Q328,94 308,94 H82 Q62,94 54,77 Q46,61 28,50.5 Q46,40 54,24 Q62,7 82,7 Z" fill="none" stroke="#c08a42" strokeWidth="2.6" />
            <path d="M84,13 H306 Q322,13 329,27 Q335,41 342,50.5 Q335,60 329,74 Q322,88 306,88 H84 Q68,88 61,74 Q55,60 50,50.5 Q55,41 61,27 Q68,13 84,13 Z" fill="none" stroke="#c99b55" strokeWidth="1.3" opacity=".85" />
            <path d="M33.5,50.5 l7.5,-7.5 7.5,7.5 -7.5,7.5 Z M343.5,50.5 l7.5,-7.5 7.5,7.5 -7.5,7.5 Z" fill="#f8dfab" stroke="#b88645" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M125,36 L151,52.5 L125,69 Z" fill="#5a3820" stroke="#5a3820" strokeWidth="6" strokeLinejoin="round" />
          </svg>
          <span className="ml-play-label">Play</span>
        </button>
      </main>

      <nav className="ml-cards" aria-label="Main menu">
        {CARDS.map(c => (
          <a key={c.key} className="ml-card" href={c.href || `/dashboard?tab=${c.tab}`}
            onMouseEnter={hover(c.tone)} onClick={openCard(c)}>
            <Frame />
            <span className="ml-card-art">
              <Sprig />
              {CARD_ICONS[c.key]}
              <Sprig flip />
            </span>
            <span className="ml-card-label">
              {c.label}
              {c.key === 'news' && unread > 0 && <span className="ml-card-badge">{unread > 9 ? '9+' : unread}</span>}
            </span>
          </a>
        ))}
      </nav>
      </div>
    </div>
  );
}
