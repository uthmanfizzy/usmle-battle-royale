import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import FriendsPanel from './FriendsPanel';
import NotificationsDropdown from './NotificationsDropdown';
import ClansPage from './ClansPage';
import ShortsFeed from './ShortsFeed';
import { HomeSection, LeaderboardSection, AnnouncementsSection } from './Dashboard';
import './DashboardNew.css';

// New dashboard shell. Bottom nav: Home · Stats · Shorts · Play.
// Leaderboards / Clans / News are reached from cards INSIDE Home (not the bar).
// Shorts (stage 2a) is a vertical snap feed (ShortsFeed) — the dn header hides
// on that tab for the TikTok feel. All other page content is REUSED from the
// existing app (HomeSection/LeaderboardSection/ClansPage/AnnouncementsSection/
// StatsPage) — this component is only a shell + nav.
// Rendered only when the admin toggle `useNewDashboard` is on (default: off).

const StatsPage = lazy(() => import('./StatsPage'));

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
const ANN_READ_KEY = 'mrb_read_announcements';

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(ANN_READ_KEY) || '[]')); }
  catch { return new Set(); }
}

const HOME_VIEW_TITLES = {
  leaderboard: '🏆 Leaderboards',
  clans:       '🛡️ Clans',
  news:        '📰 News',
};

export default function DashboardNew({ user, onPlayNow, onLogout, onUserUpdate }) {
  const [tab,      setTab]      = useState('home');   // 'home' | 'stats' | 'shorts'
  const [homeView, setHomeView] = useState('main');   // 'main' | 'leaderboard' | 'clans' | 'news'
  const [unreadCount, setUnreadCount] = useState(0);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showFriendsPanel,  setShowFriendsPanel]  = useState(false);
  const notifDropdownRef    = useRef(null);
  const friendsDropdownRef  = useRef(null);

  const [bgUrl,      setBgUrl]      = useState(null);
  const [homeImages, setHomeImages] = useState({});

  // Same data the current dashboard loads: admin images + unread news count
  useEffect(() => {
    fetch(`${SERVER_URL}/api/home-images`)
      .then(r => r.json())
      .then(d => {
        if (d.images) {
          setHomeImages(d.images);
          if (d.images.dashboard_bg) setBgUrl(d.images.dashboard_bg);
        }
      })
      .catch(() => {});
    fetch(`${SERVER_URL}/api/announcements`)
      .then(r => r.json())
      .then(d => {
        const list = d.announcements || [];
        const readIds = getReadIds();
        setUnreadCount(list.filter(a => !readIds.has(String(a.id))).length);
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click/tap (same pattern as the current dashboard)
  useEffect(() => {
    const anyOpen = showNotifications || showFriendsPanel;
    if (!anyOpen) return;
    const handle = (e) => {
      if (showNotifications && notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) setShowNotifications(false);
      if (showFriendsPanel && friendsDropdownRef.current && !friendsDropdownRef.current.contains(e.target)) setShowFriendsPanel(false);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [showNotifications, showFriendsPanel]);

  function openHomeView(view) {
    setHomeView(view);
    if (view === 'news') setUnreadCount(0);
  }

  function handleHomeTab() {
    // Tapping Home while already there returns to the Home landing
    if (tab === 'home') setHomeView('main');
    setTab('home');
  }

  const coins = user.coins || 0;
  const gems  = user.gems  || 0;

  const isShorts = tab === 'shorts';

  return (
    <div className={`dn-screen${isShorts ? ' dn-screen--shorts' : ''}`}>
      {/* Background (admin dashboard_bg image, dimmed) */}
      <div className="dn-bg" aria-hidden="true">
        {bgUrl && <img src={bgUrl} alt="" className="dn-bg-img" />}
        <div className="dn-bg-overlay" />
      </div>

      {/* ── Header: profile · currency · notifications/friends/settings ──
          Hidden on the Shorts tab so the feed fills the screen (TikTok feel). */}
      {!isShorts && (
      <header className="dn-header">
        <div className="dn-profile">
          <div className="dn-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
            ) : (
              <span className="dn-avatar-fallback">{user.username?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="dn-profile-meta">
            <span className="dn-username">{user.username || 'Player'}</span>
            <span className="dn-level">Level {user.level || 1}</span>
          </div>
        </div>

        <div className="dn-header-right">
          <div className="dn-currency">
            <span className="dn-currency-item" title="Coins">
              {homeImages.icon_coins
                ? <img loading="lazy" src={homeImages.icon_coins} alt="" className="dn-currency-icon" />
                : <span className="dn-currency-emoji">🪙</span>}
              {coins.toLocaleString()}
            </span>
            <span className="dn-currency-item" title="Gems">
              {homeImages.icon_gems
                ? <img loading="lazy" src={homeImages.icon_gems} alt="" className="dn-currency-icon" />
                : <span className="dn-currency-emoji">💎</span>}
              {gems.toLocaleString()}
            </span>
          </div>

          <div className="dn-icon-group">
            <div className="dn-drop-wrap" ref={notifDropdownRef}>
              <button
                type="button"
                className="dn-icon-btn"
                title="Notifications"
                onClick={() => { setShowNotifications(v => !v); setShowFriendsPanel(false); }}
              >
                🔔
                {unreadCount > 0 && <span className="dn-dot" />}
              </button>
              {showNotifications && (
                <div className="dn-dropdown">
                  <NotificationsDropdown user={user} onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
            <div className="dn-drop-wrap" ref={friendsDropdownRef}>
              <button
                type="button"
                className="dn-icon-btn"
                title="Friends"
                onClick={() => { setShowFriendsPanel(v => !v); setShowNotifications(false); }}
              >
                👥
              </button>
              {showFriendsPanel && (
                <div className="dn-dropdown">
                  <FriendsPanel
                    user={user}
                    onClose={() => setShowFriendsPanel(false)}
                    onInviteToGame={() => setShowFriendsPanel(false)}
                    isDropdown={true}
                  />
                </div>
              )}
            </div>
            {/* Navigates to the standalone /settings page (the old
                SettingsDropdown is retired) */}
            <button
              type="button"
              className="dn-icon-btn"
              title="Settings"
              onClick={() => { window.location.href = '/settings'; }}
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ── Tab content ── */}
      <main className={`dn-main${isShorts ? ' dn-main--shorts' : ''}`}>
        {tab === 'home' && homeView === 'main' && (
          <>
            {/* Explore row: Leaderboards / Clans / News live INSIDE Home now */}
            <div className="dn-explore">
              <button type="button" className="dn-explore-card" onClick={() => openHomeView('leaderboard')}>
                <span className="dn-explore-icon">🏆</span>
                <span className="dn-explore-label">Leaderboards</span>
                <span className="dn-explore-arrow" aria-hidden="true">›</span>
              </button>
              <button type="button" className="dn-explore-card" onClick={() => openHomeView('clans')}>
                <span className="dn-explore-icon">🛡️</span>
                <span className="dn-explore-label">Clans</span>
                <span className="dn-explore-arrow" aria-hidden="true">›</span>
              </button>
              <button type="button" className="dn-explore-card" onClick={() => openHomeView('news')}>
                <span className="dn-explore-icon">📰</span>
                <span className="dn-explore-label">News</span>
                {unreadCount > 0 && <span className="dn-dot dn-dot--card" />}
                <span className="dn-explore-arrow" aria-hidden="true">›</span>
              </button>
            </div>

            <HomeSection
              user={user}
              bgUrl={bgUrl}
              onUserUpdate={onUserUpdate}
              homeImages={homeImages}
              withWelcome
              onViewAllNews={() => openHomeView('news')}
            />
          </>
        )}

        {tab === 'home' && homeView !== 'main' && (
          <>
            <div className="dn-subhead">
              <button type="button" className="dn-back-btn" onClick={() => setHomeView('main')}>← Home</button>
              <span className="dn-subhead-title">{HOME_VIEW_TITLES[homeView]}</span>
            </div>
            {homeView === 'leaderboard' && <LeaderboardSection userId={user.id} user={user} />}
            {homeView === 'clans'       && <ClansPage user={user} />}
            {homeView === 'news'        && <AnnouncementsSection />}
          </>
        )}

        {tab === 'stats' && (
          <div className="dn-stats-embed">
            <Suspense fallback={<div className="dn-tab-loading"><div className="spinner" /></div>}>
              <StatsPage />
            </Suspense>
          </div>
        )}

        {tab === 'shorts' && <ShortsFeed />}
      </main>

      {/* ── Bottom nav: Home · Stats · Shorts · Play ── */}
      <nav className="dn-nav">
        <button type="button" className={`dn-nav-item ${tab === 'home' ? 'dn-nav-item--active' : ''}`} aria-current={tab === 'home' ? 'page' : undefined} onClick={handleHomeTab}>
          {homeImages.icon_home
            ? <img loading="lazy" src={homeImages.icon_home} alt="" className="dn-nav-img" />
            : <span className="dn-nav-icon">🏠</span>}
          <span className="dn-nav-label">Home</span>
        </button>
        <button type="button" className={`dn-nav-item ${tab === 'stats' ? 'dn-nav-item--active' : ''}`} aria-current={tab === 'stats' ? 'page' : undefined} onClick={() => setTab('stats')}>
          <span className="dn-nav-icon">📊</span>
          <span className="dn-nav-label">Stats</span>
        </button>
        <button type="button" className={`dn-nav-item ${tab === 'shorts' ? 'dn-nav-item--active' : ''}`} aria-current={tab === 'shorts' ? 'page' : undefined} onClick={() => setTab('shorts')}>
          <span className="dn-nav-icon">🎬</span>
          <span className="dn-nav-label">Shorts</span>
        </button>
        <button type="button" className="dn-nav-item dn-nav-item--play" onClick={onPlayNow}>
          {homeImages.icon_play
            ? <img loading="lazy" src={homeImages.icon_play} alt="" className="dn-nav-img" />
            : <span className="dn-nav-icon">▶️</span>}
          <span className="dn-nav-label">Play</span>
        </button>
      </nav>
    </div>
  );
}
