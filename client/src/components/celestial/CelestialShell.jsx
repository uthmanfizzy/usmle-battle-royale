import { useEffect, useRef, useState } from 'react';
import { clearToken } from '../../auth';
import './CelestialShell.css';

/**
 * The Celestial theme's page frame (Settings → Appearance → Celestial): the
 * left sidebar from the Homepage / Profile designs, with the page beside it.
 * Below 760px the sidebar folds into a top bar with a menu button, the same
 * way the design's own layout wraps on a phone.
 *
 * Every item is a real destination. The design's "Events" item became News:
 * there is no events feature, and News (announcements) is real.
 */

export const ART = '/themes/celestial';

const I = {
  home: <path d="M12 2.6 1.8 11.4h2.7V21h5.6v-6.2h3.8V21h5.6v-9.6h2.7z" />,
  profile: <><circle cx="12" cy="7.6" r="4.4" /><path d="M3.2 21.2c0-4.7 3.9-7.6 8.8-7.6s8.8 2.9 8.8 7.6z" /></>,
  play: <path d="M5.5 4v16l14-8z" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />,
  leaderboard: <><path d="M7 2.8h10v7.4a5 5 0 0 1-10 0z" /><path d="M7 4.8H3.2v2.4a4.3 4.3 0 0 0 4.3 4.3M17 4.8h3.8v2.4a4.3 4.3 0 0 1-4.3 4.3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10.8 14.6h2.4v3.2h-2.4z" /><path d="M7.2 17.6h9.6v3.4H7.2z" /></>,
  clans: <><circle cx="12" cy="7.4" r="3.3" /><path d="M5.6 20.4c0-3.8 2.9-6.1 6.4-6.1s6.4 2.3 6.4 6.1z" /><circle cx="4.8" cy="9.6" r="2.4" /><circle cx="19.2" cy="9.6" r="2.4" /><path d="M.6 19.4c0-3 1.8-4.9 4.3-4.9.5 0 1 .1 1.5.2-1.4 1.2-2.2 2.8-2.3 4.7z" /><path d="M23.4 19.4c0-3-1.8-4.9-4.3-4.9-.5 0-1 .1-1.5.2 1.4 1.2 2.2 2.8 2.3 4.7z" /></>,
  quests: <path d="M4 20 14.5 9.5M14 4l6 6M3.5 14.5l6 6M9.5 3.5 20.5 14.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  shop: <><path d="M3 4h2.6l2.2 11.2h11L21 7.4H6.6" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" /><circle cx="9" cy="19.5" r="1.7" /><circle cx="17.5" cy="19.5" r="1.7" /></>,
  news: <><path d="M4.6 4.4h12.6v15.2H6.4a1.8 1.8 0 0 1-1.8-1.8z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M17.2 8.4h2.4v9.4a1.8 1.8 0 0 1-3.6 0" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M7.6 8h6.6v2H7.6zM7.6 12h6.6v1.6H7.6zM7.6 15.2h4.4v1.6H7.6z" /></>,
};

export const NAV = [
  { key: 'home',        label: 'Home',         href: '/dashboard',                     tab: 'home' },
  { key: 'profile',     label: 'Profile',      href: '/progress' },
  { key: 'play',        label: 'Play',         href: '/?play=1' },
  { key: 'leaderboard', label: 'Leaderboards', href: '/dashboard?tab=leaderboard',     tab: 'leaderboard' },
  { key: 'clans',       label: 'Clans',        href: '/dashboard?tab=clans',           tab: 'clans' },
  { key: 'quests',      label: 'Quests',       href: '/quests' },
  { key: 'shop',        label: 'Shop',         href: '/shop' },
  { key: 'news',        label: 'News',         href: '/dashboard?tab=announcements',   tab: 'announcements' },
];

export function NavIcon({ name, className }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>{I[name]}</svg>;
}

function logout() {
  if (!window.confirm('Sign out?')) return;
  clearToken();
  window.location.href = '/';
}

/** Gems, coins and the avatar menu — top right of the home hero and the profile banner. */
export function CelestialTopbar({ user, reward }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="cs-topbar">
      {/* The daily chest (the old home's dock button), when the page has one. */}
      {reward && (
        <div className="cs-reward-wrap">
          <button
            type="button"
            className={`cs-reward${reward.available ? ' is-ready' : ''}`}
            onClick={reward.onClaim}
            disabled={!reward.available || reward.claiming}
            title={reward.available ? 'Claim your daily chest' : reward.label}
          >
            <span aria-hidden="true">🎁</span>
            <span className="cs-reward-text">{reward.claiming ? 'Claiming…' : reward.available ? 'Daily reward' : reward.label}</span>
          </button>
          {reward.notice && <span className="cs-reward-toast" role="status">{reward.notice}</span>}
        </div>
      )}
      <div className="cs-cur">
        <svg viewBox="0 0 20 24" role="img" aria-label="Gems" className="cs-cur-gem"><path d="M10 .8 18.6 10 10 23.2 1.4 10z" fill="#9b4dff" /><path d="M10 .8 18.6 10 10 12.6 1.4 10z" fill="#d9b0ff" /><path d="M10 .8 13 10 10 23.2 7 10z" fill="#c48cff" opacity=".7" /></svg>
        <span>{(user?.gems || 0).toLocaleString()}</span>
        <a className="cs-cur-add" href="/shop" aria-label="Get gems"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v13M1.5 8h13" /></svg></a>
      </div>
      <div className="cs-cur">
        <svg viewBox="0 0 24 24" role="img" aria-label="Coins" className="cs-cur-coin"><circle cx="12" cy="12" r="11" fill="#f5a623" /><circle cx="12" cy="12" r="8" fill="#ffc94d" stroke="#c97a10" strokeWidth="1.4" /><text x="12" y="16.4" textAnchor="middle" style={{ font: "700 12px 'Nunito Sans', sans-serif", fill: '#9a5200' }}>S</text></svg>
        <span>{(user?.coins || 0).toLocaleString()}</span>
        <a className="cs-cur-add" href="/shop" aria-label="Get coins"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v13M1.5 8h13" /></svg></a>
      </div>
      <div className="cs-acct" ref={ref}>
        <button type="button" className="cs-acct-btn" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <span className="cs-acct-av">
            <Avatar user={user} size={48} />
            <span className="cs-online" aria-hidden="true" />
          </span>
          <svg viewBox="0 0 16 10" aria-hidden="true" className="cs-acct-chev"><path d="M1.5 1.5 8 8l6.5-6.5" /></svg>
        </button>
        {open && (
          <div className="cs-menu" role="menu">
            <div className="cs-menu-head">{user?.username || 'Player'}<small>Level {user?.level || 1}</small></div>
            <a role="menuitem" href="/progress">Profile</a>
            <a role="menuitem" href="/settings">Settings</a>
            <button role="menuitem" type="button" onClick={logout}>Log out</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Avatar({ user, size = 48, className = '' }) {
  return user?.avatar_url
    ? <img className={`cs-av ${className}`} style={{ width: size, height: size }} src={user.avatar_url} alt={user.username || ''} referrerPolicy="no-referrer" />
    : <span className={`cs-av cs-av--letter ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>{user?.username?.[0]?.toUpperCase() || '?'}</span>;
}

/**
 * @param active   which NAV key is the current page
 * @param onTab    optional — on the dashboard, switch tabs in place instead of reloading
 */
export default function CelestialShell({ active, onTab, children }) {
  const [menu, setMenu] = useState(false);

  const go = (e, item) => {
    if (onTab && item.tab) { e.preventDefault(); onTab(item.tab); }
    setMenu(false);
  };

  return (
    <div className="cs">
      <nav className={`cs-side${menu ? ' is-open' : ''}`} aria-label="Main">
        <div className="cs-side-in">
          <div className="cs-side-top">
            <a href="/dashboard" className="cs-emblem-link" aria-label="Home"><img className="cs-emblem" src={`${ART}/emblem.png`} alt="" /></a>
            <button type="button" className="cs-burger" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(v => !v)}>
              <span /><span /><span />
            </button>
          </div>
          <div className="cs-items">
            {NAV.map(item => (
              item.key === active ? (
                <div key={item.key} className="cs-item-on-wrap">
                  <a href={item.href} aria-current="page" className={`cs-item-on${item.label.length > 9 ? " cs-item-on--long" : ""}`} onClick={(e) => go(e, item)}>
                    <span className="cs-item-on-in">
                      <NavIcon name={item.key} className="cs-ic" />
                      <span>{item.label}</span>
                    </span>
                  </a>
                </div>
              ) : (
                <a key={item.key} href={item.href} className="cs-item" onClick={(e) => go(e, item)}>
                  <NavIcon name={item.key} className="cs-ic" />
                  <span>{item.label}</span>
                </a>
              )
            ))}
          </div>
          <div className="cs-side-foot">
            <a className="cs-foot-btn" href="/settings" aria-label="Settings" title="Settings">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" strokeWidth="3" strokeDasharray="3.4 3.354" /><circle cx="12" cy="12" r="6.6" strokeWidth="2.2" /><circle cx="12" cy="12" r="2.5" strokeWidth="2" /></svg>
            </a>
            <button type="button" className="cs-foot-btn" aria-label="Log out" title="Log out" onClick={logout}>
              <svg viewBox="0 0 24 24" aria-hidden="true" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 3.5H6.2A1.7 1.7 0 0 0 4.5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h7.3" /><path d="M10.5 12h11m-3.8-4 4 4-4 4" /></svg>
            </button>
          </div>
        </div>
      </nav>
      <main className="cs-main">{children}</main>
    </div>
  );
}

/** The diamond + title bar used by every panel ("TOP PLAYERS", "STUDY TIME"…). */
export function PanelHead({ id, title, link, linkLabel = 'See all', onLink, children }) {
  return (
    <div className="cs-ph">
      <div className="cs-ph-l">
        <span className="cs-diamond" aria-hidden="true" />
        <h2 id={id}>{title}</h2>
      </div>
      {children}
      {(link || onLink) && (
        <a href={link || '#'} className="cs-ph-link" onClick={onLink ? (e) => { e.preventDefault(); onLink(); } : undefined}>
          <span>{linkLabel}</span>
          <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6h13.5M10 1.5 14.5 6 10 10.5" /></svg>
        </a>
      )}
    </div>
  );
}
