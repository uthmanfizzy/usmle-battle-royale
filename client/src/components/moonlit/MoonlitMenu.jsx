import { Fragment, useEffect, useRef, useState } from 'react';
import { useTodayGoals } from '../../planner/plan';
import { startScene, createMenuAudio, W, H } from './moonlitFx';
import {
  ART, Scene, DriftC, DriftA, ShadeLeft, ShadeBottom, DriftB, Flash,
  SidebarTop, SidebarBottom, Chips, Welcome, Beat, Tagline, PlayButton,
  EventPanel, TodayPanel, FxCanvas, CardProfile, CardLeaderboards, CardClans, CardNews,
} from './MoonlitDesign';
import './MoonlitMenu.css';

export { ART };

/**
 * Moonlit — the "Medvale Main Menu" design as the home screen (Settings →
 * Appearance → Moonlit): a sidebar, the moonlit painting with the welcome and
 * Play, four destination cards, the latest news and today's planner goals.
 *
 * The design's markup lives in MoonlitDesign.jsx, in its own 1672 × 941 px
 * space. Here it is placed in layers (see MoonlitMenu.css): the painting
 * scaled to cover the screen, and the interface at one scale that keeps all
 * of it visible, anchored to the corners it belongs to. Phones get a column.
 *
 * Honest content: the design's "Events" is News (there is no events feature),
 * its "Upcoming Event" is the newest announcement, the currencies are the
 * player's real gems and coins, and Today's goals comes from the Week Planner.
 * The designer muted every click and hover sound, leaving only the ambience
 * (wind, a soft pad and distant chimes) — kept that way.
 */

function useLayout() {
  const read = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const cover = Math.max(vw / W, vh / H);
    const s = Math.min(vw / W, vh / H);
    return { vw, vh, s, cover, cx: (vw - W * cover) / 2, cy: (vh - H * cover) / 2, mobile: s < 0.56 };
  };
  const [l, setL] = useState(read);
  useEffect(() => {
    const on = () => setL(read());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return l;
}

/** Shows a block drawn at w × h design pixels, scaled to the width it is given. */
function Fit({ w, h, x = 0, y = 0, className = '', children }) {
  const ref = useRef(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const on = () => setK(el.clientWidth / w);
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className={`mvm-fit ${className}`} style={{ height: h * k }}>
      <div className="mvm-fit-in" style={{ width: w, height: h, transform: `scale(${k})` }}>
        <div style={{ position: 'absolute', left: -x, top: -y }}>{children}</div>
      </div>
    </div>
  );
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

const noop = () => {};
const goto = (path) => () => { window.location.href = path; };

export default function MoonlitMenu({ user, announcements = [], unread = 0, onTab, onPlay, onLogout }) {
  const L = useLayout();
  const canvasRef = useRef(null);
  const fxRef = useRef(null);
  const burst = useRef(false);
  const audio = useRef(null);
  const [flash, setFlash] = useState(0);
  const today = useTodayGoals();
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const a = createMenuAudio();
    audio.current = a;
    return () => a.close();
  }, []);
  // The painting's canvas is mounted in both layouts; restart on a switch.
  useEffect(() => {
    if (!canvasRef.current) return undefined;
    return startScene(canvasRef.current, {
      fx: fxRef.current,
      consumeBurst: () => { const b = burst.current; burst.current = false; return b; },
    });
  }, [L.mobile]);

  const play = () => {
    burst.current = true;
    setFlash(f => f + 1);
    // Let the burst land before the screen changes.
    setTimeout(() => onPlay?.(), 420);
  };
  const go = {
    profile: goto('/progress'),
    settings: goto('/settings'),
    shop: goto('/shop'),
    leaderboard: () => onTab?.('leaderboard'),
    clans: () => onTab?.('clans'),
    news: () => onTab?.('announcements'),
    planner: goto('/planner'),
  };
  const h = (click) => ({ enter: noop, click });
  const navItem = (key, pick) => ({ on: key === 'home' ? 'is-on' : '', cur: key === 'home' ? 'page' : 'false', enter: noop, pick });

  const name = (user?.username || 'Player').toUpperCase();
  const latest = announcements.find(a => a.pinned) || announcements[0] || null;
  const V = {
    setCanvas: (el) => { canvasRef.current = el; },
    setFx: (el) => { fxRef.current = el; },
    nav: {
      home: navItem('home', noop),
      profile: navItem('profile', go.profile),
      play: navItem('play', play),
      leader: navItem('leader', go.leaderboard),
      clans: navItem('clans', go.clans),
      events: navItem('events', go.news),
    },
    sfx: {
      play: h(play), profile: h(go.profile), leader: h(go.leaderboard), clans: h(go.clans), events: h(go.news),
      settings: h(go.settings), logout: h(() => onLogout?.()), gem: h(go.shop), coin: h(go.shop), acct: h(go.profile),
    },
    go,
    flashClass: flash ? 'mv-flash-on' : 'mv-flash-off',
    name: user?.username || 'Player',
    nameFirst: name[0],
    nameRest: name.slice(1),
    // The design fits about seven letters beside the art; longer names shrink.
    nameScale: Math.min(1, 7.5 / Math.max(name.length, 1)),
    gems: (user?.gems || 0).toLocaleString(),
    coins: (user?.coins || 0).toLocaleString(),
    avatar: user?.avatar_url
      ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" style={{ display: 'block', width: 63, height: 63, margin: '-3px 0 0 -3px', objectFit: 'cover' }} />
      : <span style={{ display: 'flex', width: 57, height: 57, alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff6e4', background: 'linear-gradient(160deg, #3b4f9a, #1d2a5e)' }}>{name[0]}</span>,
    unreadBadge: unread > 0 ? <span className="mvm-badge" aria-label={`${unread} new`}>{unread > 9 ? '9+' : unread}</span> : null,
    unreadPill: unread > 0 ? <span className="mvm-pill" aria-label={`${unread} new`}>{unread > 9 ? '9+' : unread}</span> : null,
    news: latest,
    ago,
    today,
  };

  const s = L.s;
  const cards = [CardProfile, CardLeaderboards, CardClans, CardNews];

  return (
    <div className={`mvm ${reduce ? 'mv-still' : 'mv-live'}`} onPointerDown={() => audio.current?.unlock()}>
      {/* ── The painting, its glows and clouds, and the shading ── */}
      <div className="mvm-paint" aria-hidden="true" style={{ transform: `translate(${L.cx}px, ${L.cy}px) scale(${L.cover})` }}>
        {Scene(V)}
        {DriftC(V)}
        {DriftA(V)}
        {ShadeLeft(V)}
        {ShadeBottom(V)}
        {DriftB(V)}
        <Fragment key={flash}>{Flash(V)}</Fragment>
      </div>

      {!L.mobile ? (
        <>
          <nav className="mvm-side" aria-label="Main" style={{ width: 207 * s }}>
            <div className="mvm-side-top" style={{ transform: `scale(${s})` }}>{SidebarTop(V)}</div>
            <div className="mvm-side-bot" style={{ transform: `scale(${s})` }}>{SidebarBottom(V)}</div>
          </nav>
          <div className="mvm-tl" style={{ transform: `scale(${s})` }}>
            {Welcome(V)}
            {Beat(V)}
            {Tagline(V)}
            {PlayButton(V)}
          </div>
          <div className="mvm-tr" style={{ transform: `scale(${s})` }}>{Chips(V)}</div>
          <div className="mvm-bl" style={{ transform: `scale(${s})` }}>
            <div style={{ position: 'absolute', left: 0, top: -470, width: W, height: H }}>
              <nav aria-label="Main menu" style={{ position: 'absolute', left: 235, top: 478, display: 'flex', gap: 26 }}>
                {cards.map((C, i) => <Fragment key={i}>{C(V)}</Fragment>)}
              </nav>
              <div style={{ position: 'absolute', left: 235, top: 657 }}>{EventPanel(V)}</div>
              <div style={{ position: 'absolute', left: 1005, top: 657 }}>{TodayPanel(V)}</div>
            </div>
          </div>
          <div className="mvm-fx" style={{ transform: `scale(${s})` }}>{FxCanvas(V)}</div>
        </>
      ) : (
        <div className="mvm-m">
          <div className="mvm-m-top">
            <Fit w={440} h={76} x={1216} y={16}>{Chips(V)}</Fit>
          </div>
          <Fit w={600} h={300} x={250} y={138}>
            {Welcome(V)}
            {Beat(V)}
            {Tagline(V)}
            {PlayButton(V)}
            {/* Sparks stay inside the hero box so the column never grows. */}
            <div style={{ position: 'absolute', left: 250, top: 138, width: 600, height: 300, overflow: 'hidden', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', left: -250, top: -138 }}>{FxCanvas(V)}</div>
            </div>
          </Fit>
          <nav className="mvm-m-cards" aria-label="Main menu">
            {cards.map((C, i) => (
              <Fit key={i} w={332} h={148}><div style={{ position: 'absolute', left: 0, top: 0 }}>{C(V)}</div></Fit>
            ))}
          </nav>
          <Fit w={480} h={239}>{EventPanel(V, 480)}</Fit>
          <Fit w={480} h={239}>{TodayPanel(V, 480)}</Fit>
          <Fit w={207} h={70} y={830} className="mvm-m-foot">
            <div style={{ position: 'absolute', left: 0, top: 540 }}>{SidebarBottom(V)}</div>
          </Fit>
        </div>
      )}
    </div>
  );
}
