import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMe, authFetch } from '../auth';
import { DefaultPreview, PixelPreview } from './AppearanceSection';
import { useTheme, PALETTE } from '../theme';
import FriendsPanel from './FriendsPanel';
import NotificationsDropdown from './NotificationsDropdown';
import SettingsDropdown from './SettingsDropdown';
import ClansPage from './ClansPage';
import './Dashboard.css';

// Error Boundary to prevent black screens
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('🔴 DASHBOARD ERROR BOUNDARY CAUGHT:', {
      error: error,
      errorInfo: info,
      stack: error?.stack,
      componentStack: info?.componentStack
    });
    // Also alert to make it visible immediately
    alert(`Dashboard crashed: ${error?.message || error}\n\nCheck console for details`);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f08',
          color: 'white',
          fontFamily: 'Cinzel, serif',
          gap: '16px'
        }}>
          <h2 style={{color:'rgba(220,190,80,0.9)'}}>Something went wrong</h2>
          <pre style={{
            color: 'rgba(220,100,100,0.8)',
            fontSize: '12px',
            maxWidth: '600px',
            whiteSpace: 'pre-wrap',
            textAlign: 'center'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px',
              background: 'rgba(40,50,20,0.8)',
              border: '1px solid rgba(180,140,40,0.5)',
              borderRadius: '8px',
              color: 'rgba(220,190,80,0.9)',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
const ANN_READ_KEY    = 'mrb_read_announcements';
const ANN_WELCOME_KEY = 'mrb_welcome_v1';
const ANN_CAT_COLORS  = { Update: '#3498db', News: '#9b59b6', Maintenance: '#e67e22', Event: '#27ae60' };

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(ANN_READ_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveReadIds(ids) {
  localStorage.setItem(ANN_READ_KEY, JSON.stringify([...ids]));
}

const SUBJECTS = [
  { id: 'cardiology',    label: 'Cardiology',    icon: '❤️' },
  { id: 'neurology',     label: 'Neurology',     icon: '🧠' },
  { id: 'pharmacology',  label: 'Pharmacology',  icon: '💊' },
  { id: 'microbiology',  label: 'Microbiology',  icon: '🦠' },
  { id: 'biochemistry',  label: 'Biochemistry',  icon: '⚗️' },
  { id: 'biostatistics', label: 'Biostatistics', icon: '📊' },
];
const PLACE_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const GAME_MODE_ICONS = {
  battle_royale: '⚔️',
  speed_race: '⚡',
  tower: '🏰',
  trivia_pursuit: '🎯',
  buzz_fun: '🐝',
  scan_master: '🔬',
};
const GAME_MODE_LABELS = {
  battle_royale: 'Battle Royale',
  speed_race: 'Speed Race',
  tower: 'Tower',
  trivia_pursuit: 'Trivia Pursuit',
  buzz_fun: 'Buzz Fun',
  scan_master: 'Scan Master',
};

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function timeAgo(str) {
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Rank tiers based on XP
function getRank(xp) {
  if (xp < 500)   return { tier: 'I', name: 'Medical Student I', next: 500, progress: xp / 500 };
  if (xp < 1500)  return { tier: 'II', name: 'Medical Student II', next: 1500, progress: (xp - 500) / 1000 };
  if (xp < 3000)  return { tier: 'III', name: 'Medical Student III', next: 3000, progress: (xp - 1500) / 1500 };
  if (xp < 5000)  return { tier: 'I', name: 'Medical Intern I', next: 5000, progress: (xp - 3000) / 2000 };
  if (xp < 8000)  return { tier: 'II', name: 'Medical Intern II', next: 8000, progress: (xp - 5000) / 3000 };
  if (xp < 12000) return { tier: 'III', name: 'Medical Intern III', next: 12000, progress: (xp - 8000) / 4000 };
  if (xp < 18000) return { tier: 'I', name: 'Resident I', next: 18000, progress: (xp - 12000) / 6000 };
  if (xp < 25000) return { tier: 'II', name: 'Resident II', next: 25000, progress: (xp - 18000) / 7000 };
  if (xp < 35000) return { tier: 'III', name: 'Resident III', next: 35000, progress: (xp - 25000) / 10000 };
  if (xp < 50000) return { tier: 'I', name: 'Attending I', next: 50000, progress: (xp - 35000) / 15000 };
  return { tier: '∞', name: 'Chief Physician', next: null, progress: 1 };
}

// ── Username Change Modal ──────────────────────────────────────────────────────
const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

function fmtLong(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function UsernameChangeModal({ user, onClose, onSuccess }) {
  const [newUsername, setNewUsername] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const trimmed    = newUsername.trim();
  const validLen   = trimmed.length >= 3 && trimmed.length <= 20;
  const validChars = trimmed.length === 0 || /^[a-zA-Z0-9_]+$/.test(trimmed);
  const isSame     = trimmed.toLowerCase() === (user.username || '').toLowerCase();
  const canSubmit  = trimmed.length > 0 && validLen && validChars && !isSame;

  const lastChange    = user.last_username_change ? new Date(user.last_username_change) : null;
  const nextChangeDate = lastChange ? new Date(lastChange.getTime() + MS_PER_YEAR) : null;
  const canChange      = !nextChangeDate || nextChangeDate <= new Date();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError('');
    try {
      const res  = await authFetch('/auth/username', {
        method: 'PUT',
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change username.'); setLoading(false); return; }
      onSuccess(data.username, data.last_username_change);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Change Username</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {lastChange && (
          <p className="username-meta">Last changed: {fmtLong(lastChange)}</p>
        )}

        {!canChange ? (
          <div className="username-cooldown-box">
            <p>You can next change your username on:</p>
            <strong className="username-next-date">{fmtLong(nextChangeDate)}</strong>
            <p className="username-cooldown-note">Username changes are limited to once per year.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-field">
              <label>New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder={user.username}
                maxLength={20}
                autoFocus
              />
            </div>

            {trimmed.length > 0 && (
              <div className="username-hints">
                <span className={validLen ? 'hint-ok' : 'hint-err'}>
                  {validLen ? '✓' : '✗'} 3–20 characters
                </span>
                <span className={validChars ? 'hint-ok' : 'hint-err'}>
                  {validChars ? '✓' : '✗'} Letters, numbers, underscores only
                </span>
                {isSame && trimmed.length > 0 && (
                  <span className="hint-err">✗ Same as current username</span>
                )}
              </div>
            )}

            {error && <p className="modal-error">{error}</p>}

            <p className="username-warning">
              You can only change your username once per year.
            </p>

            <button className="btn-primary" type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Saving…' : 'Change Username'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Home Section (RPG Style) ───────────────────────────────────────────────────
function HomeSection({ user, bgUrl, onUserUpdate, homeImages }) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [quests, setQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  const [questsLoading, setQuestsLoading] = useState(true);
  const [completedQuest, setCompletedQuest] = useState(null);
  const [panelBackgrounds, setPanelBackgrounds] = useState({
    profile_panel_bg: '',
    stats_panel_bg: '',
    quests_panel_bg: '',
    recent_games_panel_bg: '',
  });
  const [newsItems, setNewsItems] = useState([]);
  const [rewardChest, setRewardChest] = useState(null);

  const xp          = user.xp    || 0;
  const level       = user.level || 1;
  const xpIntoLevel = xp % 500;
  const xpProgress  = Math.round((xpIntoLevel / 500) * 100);
  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const winRate     = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : 0;
  const gameHistory = user.game_history || [];
  const rank        = getRank(xp);

  // Fetch daily quests and progress from server
  useEffect(() => {
    async function loadQuests() {
      try {
        const [questsRes, progressRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/daily-quests`),
          authFetch('/api/quest-progress'),
        ]);
        const questsData = await questsRes.json();
        const progressData = await progressRes.json();

        // Map progress by quest_id
        const progressMap = {};
        (progressData.progress || []).forEach(p => {
          progressMap[p.quest_id] = p;
        });
        setQuestProgress(progressMap);

        // Merge quests with progress data
        const mergedQuests = (questsData.quests || []).map(q => {
          const prog = progressMap[q.id];
          return {
            ...q,
            current: prog?.current_progress || 0,
            completed: prog?.completed || false,
            rewards_claimed: prog?.rewards_claimed || false,
          };
        });
        setQuests(mergedQuests);
      } catch (err) {
        console.error('Failed to load quests:', err);
      }
      setQuestsLoading(false);
    }
    loadQuests();
  }, [user]);

  // Fetch panel background images
  useEffect(() => {
    async function loadPanelBackgrounds() {
      try {
        const res = await fetch(`${SERVER_URL}/api/home-images`);
        if (res.ok) {
          const data = await res.json();
          setPanelBackgrounds({
            profile_panel_bg: data.images?.profile_panel_bg || '',
            stats_panel_bg: data.images?.stats_panel_bg || '',
            quests_panel_bg: data.images?.quests_panel_bg || '',
            recent_games_panel_bg: data.images?.recent_games_panel_bg || '',
          });
        }
      } catch (err) {
        console.error('Failed to load panel backgrounds:', err);
      }
    }
    loadPanelBackgrounds();
  }, []);

  // Fetch news/announcements
  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch(`${SERVER_URL}/api/announcements`);
        if (res.ok) {
          const data = await res.json();
          setNewsItems((data.announcements || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load news:', err);
      }
    }
    loadNews();
  }, []);

  // Fetch reward chest status
  useEffect(() => {
    async function loadRewardChest() {
      if (!user?.id) return;
      try {
        const res = await fetch(`${SERVER_URL}/api/rewards/chest/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setRewardChest(data);
        }
      } catch (err) {
        console.error('Failed to load reward chest:', err);
      }
    }
    loadRewardChest();
  }, [user]);

  // Time until daily reset (midnight UTC)
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = midnight - now;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hrs}h ${mins}m left`);
    }
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle claiming reward chest
  const handleClaimChest = async () => {
    if (!user?.id || !rewardChest?.available) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/rewards/claim/${user.id}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Refresh chest status
          const refreshRes = await fetch(`${SERVER_URL}/api/rewards/chest/${user.id}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setRewardChest(refreshData);
          }
          // Update user coins/gems
          if (onUserUpdate) {
            onUserUpdate({
              ...user,
              coins: (user.coins || 0) + (data.coins || 0),
              gems: (user.gems || 0) + (data.gems || 0),
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to claim chest:', err);
    }
  };

  return (
    <div className="dash-main">
      {/* Left Column */}
      <div className="dash-left-col">
        <div className="home-widgets">

          {/* DAILY QUESTS */}
          <div className="home-widget">
            <div className="home-widget-header">
              <h3 className="home-widget-title">DAILY QUESTS</h3>
            </div>
            <div className="home-widget-content">
              {quests.slice(0, 3).map((quest, i) => (
                <div className="quest-item" key={quest.id || i}>
                  <div className="quest-icon-wrap">
                    {quest.icon_image ? (
                      <img src={quest.icon_image} alt={quest.name} className="quest-icon-img" />
                    ) : (
                      <span className="quest-icon-emoji">{quest.icon || '⚔️'}</span>
                    )}
                  </div>
                  <div className="quest-info">
                    <p className="quest-name">{quest.name}</p>
                    <div className="quest-progress-bar">
                      <div
                        className="quest-progress-fill"
                        style={{ width: `${Math.min(100, ((quest.current || 0) / (quest.target || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="quest-progress-text">{quest.current || 0} / {quest.target || 1}</p>
                  </div>
                  <div className="quest-reward">
                    {quest.coin_reward > 0 && (
                      <>
                        <span className="quest-gem-icon">🪙</span>
                        <span className="quest-reward-amount">{quest.coin_reward}</span>
                      </>
                    )}
                    {quest.gem_reward > 0 && (
                      <>
                        <span className="quest-gem-icon">💎</span>
                        <span className="quest-reward-amount">{quest.gem_reward}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {quests.length === 0 && (
                <p className="home-widget-empty">No active quests today</p>
              )}
            </div>
          </div>

          {/* REWARDS */}
          <div className="home-widget">
            <div className="home-widget-header">
              <h3 className="home-widget-title">REWARDS</h3>
            </div>
            <div className="home-widget-content reward-content">
              <div className="reward-chest-wrap">
                {homeImages.chest_image ? (
                  <img src={homeImages.chest_image} alt="Reward Chest" className="reward-chest-img" />
                ) : (
                  <div className="reward-chest-placeholder" />
                )}
              </div>
              <div className="reward-info">
                <p className="reward-text">
                  {rewardChest?.available ? 'Open your free chest!' : `Next chest in ${rewardChest?.timeLeft || '24h'}`}
                </p>
                <button
                  className={`reward-claim-btn ${!rewardChest?.available ? 'reward-claim-btn--disabled' : ''}`}
                  onClick={handleClaimChest}
                  disabled={!rewardChest?.available}
                >
                  {rewardChest?.available ? 'CLAIM' : 'CLAIMED'}
                </button>
              </div>
            </div>
          </div>

          {/* NEWS */}
          <div className="home-widget">
            <div className="home-widget-header">
              <h3 className="home-widget-title">NEWS</h3>
            </div>
            <div className="home-widget-content">
              {newsItems.map((item, i) => (
                <div className="news-item" key={item.id || i}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="news-item-img" />
                  ) : (
                    <div className="news-item-img-placeholder">📢</div>
                  )}
                  <div className="news-item-info">
                    <p className="news-item-title">{item.title || item.message?.substring(0, 40)}</p>
                    <p className="news-item-desc">{item.message?.substring(0, 60)}{item.message?.length > 60 ? '...' : ''}</p>
                  </div>
                </div>
              ))}
              {newsItems.length === 0 && (
                <p className="home-widget-empty">No news yet</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Center Column - Transparent */}
      <div className="dash-center-col">
        <div className="center-welcome">
          <div className="center-welcome-title">Welcome Back, {user.username}!</div>
          <div className="center-welcome-sub">Ready for your next challenge?</div>
        </div>
      </div>

      {/* Right Column */}
      <div className="dash-right-col">
      </div>

      {showUsernameModal && (
        <UsernameChangeModal
          user={user}
          onClose={() => setShowUsernameModal(false)}
          onSuccess={(newUsername, lastChanged) => {
            onUserUpdate({ ...user, username: newUsername, last_username_change: lastChanged });
            setShowUsernameModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Leaderboard Section ────────────────────────────────────────────────────────
function LeaderboardSection({ userId, user }) {
  const [activeTab, setActiveTab] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [topClan, setTopClan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchTopClan();
  }, [activeTab, userId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let url;
      if (activeTab === 'clans') {
        url = `/api/leaderboard/clans`;
      } else if (activeTab === 'friends') {
        url = `/api/leaderboard/players`; // TODO: Add friends filtering
      } else {
        url = `/api/leaderboard/players`;
      }

      const res = await authFetch(url);
      const data = await res.json();

      if (activeTab === 'clans') {
        // Clans data is already in the correct format
        setLeaderboard(data || []);
      } else {
        // Players data needs formatting
        const players = (data.players || []).map((p, i) => ({
          ...p,
          rank: i + 1,
          winRate: p.wins ? Math.round((p.wins / Math.max(1, p.wins + (p.losses || 0))) * 100) : 0
        }));
        setLeaderboard(players);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
      setLeaderboard([]);
    }
    setLoading(false);
  };

  const fetchTopClan = async () => {
    try {
      const res = await authFetch('/api/clans/leaderboard');
      const data = await res.json();
      const clans = data.clans || [];
      setTopClan(clans.length > 0 ? clans[0] : null);
    } catch (e) {
      console.error('Failed to load top clan:', e);
    }
  };

  const topPlayer = leaderboard[0];
  const isCurrentUser = (playerId) => playerId === userId;

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="lb-rank-badge lb-rank-1"><span>👑</span><span>1</span></div>;
    if (rank === 2) return <div className="lb-rank-badge lb-rank-2"><span>🥈</span><span>2</span></div>;
    if (rank === 3) return <div className="lb-rank-badge lb-rank-3"><span>🥉</span><span>3</span></div>;
    return <div className="lb-rank-num">{rank}</div>;
  };

  const getPlayerIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '💎';
    if (rank === 3) return '⚔️';
    return null;
  };

  return (
    <div className="lb-page">

      {/* Header */}
      <div className="lb-header">
        <h1 className="lb-title">LEADERBOARDS</h1>
        <p className="lb-subtitle">Compete with players and climb to the top!</p>
        <div className="lb-divider">
          <div className="lb-divider-line" />
          <div className="lb-divider-diamond">◆</div>
          <div className="lb-divider-line" />
        </div>
      </div>

      <div className="lb-body">

        {/* LEFT: Tabs + Table */}
        <div className="lb-left">

          {/* Tabs */}
          <div className="lb-tabs">
            {[
              { id: 'global', label: 'GLOBAL', icon: '🌍' },
              { id: 'clans', label: 'CLANS', icon: '🛡' },
              { id: 'friends', label: 'FRIENDS', icon: '👥' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`lb-tab ${activeTab === tab.id ? 'lb-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="lb-table">
            <div className="lb-table-header">
              {activeTab === 'clans' ? (
                <>
                  <span className="lb-col-rank">RANK</span>
                  <span className="lb-col-player">CLAN</span>
                  <span className="lb-col-level">LEVEL</span>
                  <span className="lb-col-xp">SCORE</span>
                  <span className="lb-col-wins">MEMBERS</span>
                  <span className="lb-col-winrate">TAG</span>
                </>
              ) : (
                <>
                  <span className="lb-col-rank">RANK</span>
                  <span className="lb-col-player">PLAYER</span>
                  <span className="lb-col-level">LEVEL</span>
                  <span className="lb-col-xp">XP</span>
                  <span className="lb-col-wins">WINS</span>
                  <span className="lb-col-winrate">WIN RATE</span>
                </>
              )}
            </div>

            {loading ? (
              <div className="lb-loading">Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div className="lb-loading">
                {activeTab === 'clans' ? 'No clans yet. Create one to compete!' :
                 activeTab === 'friends' ? 'Add friends to see their rankings!' :
                 'No players yet.'}
              </div>
            ) : (
              <>
                {leaderboard.slice(0, 10).map(item => (
                  <div
                    key={item.id}
                    className={`lb-row ${activeTab !== 'clans' && isCurrentUser(item.id) ? 'lb-row--you' : ''} ${item.rank <= 3 ? `lb-row--top${item.rank}` : ''}`}
                  >
                    <span className="lb-col-rank">{getRankBadge(item.rank)}</span>

                    {activeTab === 'clans' ? (
                      /* CLAN ROW */
                      <>
                        <span className="lb-col-player">
                          <div className="lb-player-avatar">
                            {item.banner_url
                              ? <img src={item.banner_url} alt={item.name} />
                              : <span>🛡</span>
                            }
                          </div>
                          <span className="lb-player-name">{item.name}</span>
                          {item.rank <= 3 && (
                            <span className="lb-player-icon">{getPlayerIcon(item.rank)}</span>
                          )}
                        </span>
                        <span className="lb-col-level">Level {item.level || 1}</span>
                        <span className="lb-col-xp">{(item.score || 0).toLocaleString()}</span>
                        <span className="lb-col-wins">{item.memberCount || 0}</span>
                        <span className="lb-col-winrate">[{item.tag || 'N/A'}]</span>
                      </>
                    ) : (
                      /* PLAYER ROW */
                      <>
                        <span className="lb-col-player">
                          <div className="lb-player-avatar">
                            {item.avatar_url
                              ? <img src={item.avatar_url} alt={item.username} referrerPolicy="no-referrer" />
                              : <span>{item.username?.[0]?.toUpperCase()}</span>
                            }
                          </div>
                          <span className="lb-player-name">
                            {item.username}
                            {isCurrentUser(item.id) && <span className="lb-you-badge"> (YOU)</span>}
                          </span>
                          {getPlayerIcon(item.rank) && (
                            <span className="lb-player-icon">{getPlayerIcon(item.rank)}</span>
                          )}
                        </span>
                        <span className="lb-col-level">Level {item.level || 1}</span>
                        <span className="lb-col-xp">{(item.xp || 0).toLocaleString()} XP</span>
                        <span className="lb-col-wins">{item.wins || 0}</span>
                        <span className="lb-col-winrate">{item.winRate || 0}%</span>
                      </>
                    )}
                  </div>
                ))}

                {/* Current user if not in top 10 (only for player tabs) */}
                {activeTab !== 'clans' && user && !leaderboard.slice(0, 10).find(p => p.id === userId) && (
                  <>
                    <div className="lb-row-separator">...</div>
                    <div className="lb-row lb-row--you">
                      <span className="lb-col-rank"><div className="lb-rank-num">-</div></span>
                      <span className="lb-col-player">
                        <div className="lb-player-avatar">
                          {user.avatar_url
                            ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
                            : <span>{user.username?.[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <span className="lb-player-name">{user.username} <span className="lb-you-badge">(YOU)</span></span>
                      </span>
                      <span className="lb-col-level">Level {user.level || 1}</span>
                      <span className="lb-col-xp">{(user.xp || 0).toLocaleString()} XP</span>
                      <span className="lb-col-wins">{user.wins || 0}</span>
                      <span className="lb-col-winrate">0%</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <p className="lb-refresh-note">Leaderboards refresh every 10 minutes.</p>
        </div>

        {/* RIGHT: Top Player, Top Clan, Rewards */}
        <div className="lb-right">

          {/* Top Player */}
          <div className="lb-right-section">
            <p className="lb-right-label">TOP PLAYERS</p>
            <div className="lb-top-player-card">
              <div className="lb-top-player-icon">
                {topPlayer?.avatar_url
                  ? <img src={topPlayer.avatar_url} alt={topPlayer.username} referrerPolicy="no-referrer" />
                  : <span>{topPlayer?.username?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <h3 className="lb-top-player-name">
                {topPlayer?.username || 'No players yet'} {topPlayer && '👑'}
              </h3>
              <p className="lb-top-player-stats">
                Level {topPlayer?.level || '-'} &nbsp;·&nbsp; {(topPlayer?.xp || 0).toLocaleString()} XP
              </p>
              <button className="lb-view-btn">VIEW PROFILE</button>
            </div>
          </div>

          {/* Top Clan */}
          <div className="lb-right-section">
            <p className="lb-right-label">TOP CLAN</p>
            <div className="lb-top-clan-card">
              <div className="lb-clan-banner">
                {topClan?.banner_url
                  ? <img src={topClan.banner_url} alt={topClan.name} />
                  : <span>🛡</span>
                }
              </div>
              <div className="lb-clan-info">
                <h4 className="lb-clan-name">{topClan?.name || 'No clans yet'} {topClan && '👑'}</h4>
                <p className="lb-clan-members">Members: {topClan?.member_count || 0} / 50</p>
                <p className="lb-clan-score">🏆 {(topClan?.total_xp || 0).toLocaleString()}</p>
              </div>
              <button className="lb-view-btn">VIEW CLAN</button>
            </div>
          </div>

          {/* Leaderboard Rewards */}
          <div className="lb-right-section">
            <p className="lb-right-label">LEADERBOARD REWARDS</p>
            <div className="lb-rewards-card">
              <div className="lb-reward-tiers">
                <div className="lb-reward-tier">
                  <span className="lb-reward-chest">🏆</span>
                  <p className="lb-reward-rank">Top 1</p>
                  <p className="lb-reward-name">Exclusive Chest</p>
                </div>
                <div className="lb-reward-tier">
                  <span className="lb-reward-chest">🥈</span>
                  <p className="lb-reward-rank">Top 2-10</p>
                  <p className="lb-reward-name">Epic Chest</p>
                </div>
                <div className="lb-reward-tier">
                  <span className="lb-reward-chest">🥉</span>
                  <p className="lb-reward-rank">Top 11-50</p>
                  <p className="lb-reward-name">Rare Chest</p>
                </div>
              </div>
              <button className="lb-view-btn lb-view-btn--full">VIEW ALL REWARDS</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Clan Section ───────────────────────────────────────────────────────────────
function ClanSection({ user, onUserUpdate }) {
  const [view,      setView]      = useState('home');
  const [clanName,  setClanName]  = useState('');
  const [clanTag,   setClanTag]   = useState('');
  const [searchQ,   setSearchQ]   = useState('');
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [clanLb,    setClanLb]    = useState([]);
  const [lbLoaded,  setLbLoaded]  = useState(false);

  useEffect(() => {
    authFetch('/api/clans/leaderboard')
      .then(r => r.ok ? r.json() : { clans: [] })
      .then(d => { setClanLb(d.clans || []); setLbLoaded(true); });
  }, []);

  useEffect(() => {
    if (view !== 'search' || searchQ.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      authFetch(`/api/clans/search?q=${encodeURIComponent(searchQ)}`)
        .then(r => r.ok ? r.json() : { clans: [] })
        .then(d => setResults(d.clans || []));
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, view]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!clanName.trim() || !clanTag.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await authFetch('/api/clans', {
        method: 'POST',
        body: JSON.stringify({ name: clanName.trim(), tag: clanTag.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create clan.'); setLoading(false); return; }
      const me = await fetchMe();
      if (me) onUserUpdate(me);
      setView('home'); setClanName(''); setClanTag('');
    } catch { setError('Network error.'); }
    setLoading(false);
  }

  async function handleJoin(clanId) {
    setLoading(true); setError('');
    try {
      const res = await authFetch(`/api/clans/${clanId}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to join clan.'); setLoading(false); return; }
      const me = await fetchMe();
      if (me) onUserUpdate(me);
      setView('home');
    } catch { setError('Network error.'); }
    setLoading(false);
  }

  async function handleLeave() {
    if (!window.confirm('Leave your clan?')) return;
    setLoading(true); setError('');
    try {
      const res = await authFetch('/api/clans/leave', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to leave clan.'); setLoading(false); return; }
      const me = await fetchMe();
      if (me) onUserUpdate(me);
    } catch { setError('Network error.'); }
    setLoading(false);
  }

  const clan = user.clan;

  return (
    <div className="dash-content">
      {clan ? (
        <div className="dash-card clan-info-card">
          <div className="clan-header">
            <div className="clan-tag-badge">[{clan.tag}]</div>
            <div className="clan-name-block">
              <h3 className="clan-name">{clan.name}</h3>
              <div className="clan-meta">{clan.member_count} member{clan.member_count !== 1 ? 's' : ''} · {clan.total_xp?.toLocaleString()} XP</div>
            </div>
          </div>
          <div className="clan-members-list">
            <div className="card-title" style={{ marginTop: 16 }}>Top Members</div>
            {(clan.top_members || []).map((m, i) => (
              <div key={m.id} className="clan-member-row">
                <span className="cm-rank">{i + 1}</span>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" className="cm-avatar" referrerPolicy="no-referrer" />
                  : <div className="cm-avatar-placeholder">{m.username?.[0]?.toUpperCase()}</div>
                }
                <span className="cm-name">{m.username}{m.id === user.id ? ' (you)' : ''}</span>
                {m.role === 'owner' && <span className="cm-owner">Owner</span>}
                <span className="cm-xp">{(m.xp || 0).toLocaleString()} XP</span>
              </div>
            ))}
          </div>
          {error && <p className="clan-error">{error}</p>}
          <button className="btn-leave-clan" onClick={handleLeave} disabled={loading}>
            {loading ? 'Leaving…' : 'Leave Clan'}
          </button>
        </div>
      ) : (
        <div>
          {view === 'home' && (
            <div className="clan-actions">
              <div className="dash-card clan-action-card" onClick={() => { setView('create'); setError(''); }}>
                <div className="clan-action-icon">🏰</div>
                <h3>Create Clan</h3>
                <p>Found your own clan and recruit members</p>
              </div>
              <div className="dash-card clan-action-card" onClick={() => { setView('search'); setError(''); }}>
                <div className="clan-action-icon">🔍</div>
                <h3>Join Clan</h3>
                <p>Search for an existing clan to join</p>
              </div>
            </div>
          )}

          {view === 'create' && (
            <div className="dash-card">
              <button className="clan-back-btn" onClick={() => { setView('home'); setError(''); }}>← Back</button>
              <div className="card-title">Create a Clan</div>
              <form className="clan-form" onSubmit={handleCreate}>
                <div className="clan-form-group">
                  <label>Clan Name</label>
                  <input
                    type="text" placeholder="e.g. Study Squad"
                    value={clanName} onChange={e => setClanName(e.target.value)}
                    maxLength={50} autoFocus
                  />
                </div>
                <div className="clan-form-group">
                  <label>Tag (2–4 chars)</label>
                  <input
                    type="text" placeholder="e.g. USMLE"
                    value={clanTag}
                    onChange={e => setClanTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                  {clanTag && <span className="tag-preview">[{clanTag}]</span>}
                </div>
                {error && <p className="clan-error">{error}</p>}
                <button className="btn-primary" type="submit"
                  disabled={loading || !clanName.trim() || clanTag.length < 2}>
                  {loading ? 'Creating…' : 'Create Clan'}
                </button>
              </form>
            </div>
          )}

          {view === 'search' && (
            <div className="dash-card">
              <button className="clan-back-btn" onClick={() => { setView('home'); setSearchQ(''); setResults([]); setError(''); }}>← Back</button>
              <div className="card-title">Join a Clan</div>
              <input
                className="clan-search-input"
                type="text" placeholder="Search clan by name…"
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                autoFocus
              />
              {error && <p className="clan-error">{error}</p>}
              <div className="clan-search-results">
                {searchQ.length >= 2 && results.length === 0 && (
                  <p className="no-history">No clans found.</p>
                )}
                {results.map(c => (
                  <div key={c.id} className="clan-result-row">
                    <span className="clan-tag-badge sm">[{c.tag}]</span>
                    <div className="clan-result-info">
                      <span className="clan-result-name">{c.name}</span>
                      <span className="clan-result-meta">{c.member_count} members · {c.total_xp?.toLocaleString()} XP</span>
                    </div>
                    <button className="btn-join-clan" onClick={() => handleJoin(c.id)} disabled={loading}>
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {lbLoaded && clanLb.length > 0 && (
        <div className="dash-card" style={{ marginTop: 20 }}>
          <div className="card-title">Top Clans</div>
          <table className="lb-big-table">
            <thead>
              <tr><th>#</th><th>Clan</th><th>Members</th><th>Total XP</th></tr>
            </thead>
            <tbody>
              {clanLb.map((c, i) => (
                <tr key={c.id} className={user.clan?.id === c.id ? 'lb-me' : ''}>
                  <td className="lb-rank-cell">
                    {i < 3 ? PLACE_ICONS[i + 1] : <span className="lb-rank-num">#{i + 1}</span>}
                  </td>
                  <td className="lb-player-cell">
                    <span className="lb-clan-tag-big">[{c.tag}]</span>
                    <span className="lb-username">{c.name}</span>
                  </td>
                  <td className="lb-members">{c.member_count}</td>
                  <td className="lb-xp">{c.total_xp?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Welcome Popup ──────────────────────────────────────────────────────────────
function WelcomePopup({ announcement, onClose }) {
  return (
    <div className="welcome-popup-overlay" onClick={onClose}>
      <div className="welcome-popup" onClick={e => e.stopPropagation()}>
        <h2>{announcement?.title || 'Welcome to MedVale!'}</h2>
        <p>{announcement?.message || 'The most epic way to prepare for your medical exams. Study hard, play hard!'}</p>
        <button onClick={onClose}>Let's Go!</button>
      </div>
    </div>
  );
}

// ── Announcements Section ──────────────────────────────────────────────────────
function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/announcements`)
      .then(r => r.json())
      .then(d => {
        const list = d.announcements || [];
        setAnnouncements(list);
        const readIds = getReadIds();
        list.forEach(a => readIds.add(String(a.id)));
        saveReadIds(readIds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="lb-loading"><div className="spinner" /></div>;

  return (
    <div className="dash-content">
      {announcements.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: 32 }}>
          <p className="no-history">No announcements yet. Check back soon!</p>
        </div>
      ) : (
        announcements.map(a => (
          <div key={a.id} className="dash-card">
            <div className="card-title">{a.category}</div>
            <h3 style={{ marginBottom: 8, color: 'var(--text-dark)' }}>{a.title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>{a.message}</p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
function Dashboard({ user, onPlayNow, onLogout, onUserUpdate }) {
  const [dashTab,      setDashTab]      = useState('home');
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [showWelcome,  setShowWelcome]  = useState(false);
  const [welcomeAnn,   setWelcomeAnn]   = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const friendsDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  const [bgUrl,        setBgUrl]        = useState(null);
  const [homeImages,   setHomeImages]   = useState({
    dashboard_bg: '',
    footer_bg: '',
    icon_home: '',
    icon_leaderboards: '',
    icon_clans: '',
    icon_news: '',
    icon_play: '',
    icon_coins: '',
    icon_gems: '',
    icon_notification: '',
    icon_friends: '',
    icon_settings: '',
    chest_image: '',
  });

  // DEBUG: Catch runtime errors to diagnose black screen
  useEffect(() => {
    window.onerror = (msg, src, line, col, err) => {
      console.error('🔴 DASHBOARD RUNTIME ERROR:', {
        message: msg,
        source: src,
        line: line,
        column: col,
        error: err,
        stack: err?.stack
      });
      alert(`Dashboard Error at line ${line}: ${msg}`);
      return false;
    };
    window.onunhandledrejection = (event) => {
      console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
      alert(`Promise Rejection: ${event.reason}`);
    };
    console.log('✅ Dashboard error handlers installed');
    return () => {
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, []);

  // Fetch home page images (backgrounds and icons)
  useEffect(() => {
    fetch(`${SERVER_URL}/api/home-images`)
      .then(r => r.json())
      .then(d => {
        console.log('Home images loaded:', d.images);
        if (d.images) {
          setHomeImages(d.images);
          // Set dashboard background
          if (d.images.dashboard_bg) setBgUrl(d.images.dashboard_bg);
        }
      })
      .catch(err => {
        console.error('Failed to load home images:', err);
      });
  }, []);

  // Close friends dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (friendsDropdownRef.current && !friendsDropdownRef.current.contains(e.target)) {
        setShowFriendsPanel(false);
      }
    };
    if (showFriendsPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside); // mobile touch
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showFriendsPanel]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside); // mobile touch
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside); // mobile touch
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/announcements`)
      .then(r => r.json())
      .then(d => {
        const list = d.announcements || [];
        const readIds = getReadIds();
        const unread = list.filter(a => !readIds.has(String(a.id))).length;
        setUnreadCount(unread);
        if (!localStorage.getItem(ANN_WELCOME_KEY) && list.length > 0) {
          setWelcomeAnn(list.find(a => a.pinned) || list[0]);
          setShowWelcome(true);
        }
      })
      .catch(() => {});
  }, []);

  function handleAnnouncementsTab() {
    setDashTab('announcements');
    setUnreadCount(0);
  }

  function handleWelcomeClose() {
    setShowWelcome(false);
    localStorage.setItem(ANN_WELCOME_KEY, '1');
  }

  // User currency
  const coins = user.coins || 0;
  const gems = user.gems || 0;

  return (
    <div className="dashboard-screen">
      {/* Background */}
      <div className="dashboard-bg">
        {bgUrl && <img src={bgUrl} alt="" className="dashboard-bg-image" />}
        <div className="dashboard-bg-overlay" />
      </div>

      <div className="dashboard-container">
        {showWelcome && <WelcomePopup announcement={welcomeAnn} onClose={handleWelcomeClose} />}

        {/* Dashboard Header - Profile Left, Currency + Icons Right */}
        <div className="dashboard-header">
          <div className="header-left">
            {/* Profile Card */}
            <div className="horizontal-profile-card">
              <div className="profile-card-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
                ) : (
                  <div className="profile-card-avatar-placeholder">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="profile-card-panel">
                <div className="profile-card-username">
                  {user.username || 'Player'}
                  <span className="profile-card-crown">👑</span>
                </div>
                <div className="profile-card-level">Level {user.level || 1}</div>
                <div className="profile-card-xp">
                  <div className="profile-card-xp-bar">
                    <div
                      className="profile-card-xp-fill"
                      style={{ width: `${Math.round(((user.xp || 0) % 500) / 500 * 100)}%` }}
                    />
                  </div>
                  <div className="profile-card-xp-text">
                    {((user.xp || 0) % 500).toLocaleString()} / 500 XP
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Currency Bar */}
            <div className="currency-bar">
              <div className="currency-item">
                {homeImages.icon_coins && (
                  <img loading="lazy" src={homeImages.icon_coins} alt="" className="currency-icon" />
                )}
                <span className="currency-value">{coins.toLocaleString()}</span>
              </div>
              <div className="currency-divider"></div>
              <div className="currency-item">
                {homeImages.icon_gems && (
                  <img loading="lazy" src={homeImages.icon_gems} alt="" className="currency-icon" />
                )}
                <span className="currency-value">{gems.toLocaleString()}</span>
              </div>
            </div>

            {/* Individual Icon Bubbles */}
            <div className="header-icon-group">
              {/* 1. NOTIFICATIONS - top on mobile */}
              <div className="friends-dropdown-wrapper" ref={notifDropdownRef}>
                <button
                  className="header-icon-bubble notification-btn"
                  onClick={() => { setShowNotifications(!showNotifications); setShowFriendsPanel(false); setShowSettings(false); }}
                  title="Notifications"
                >
                  {homeImages.icon_notification ? (
                    <img loading="lazy" src={homeImages.icon_notification} alt="Notifications" className="header-icon-img" />
                  ) : (
                    <span>🔔</span>
                  )}
                  {unreadCount > 0 && <span className="notification-dot" />}
                </button>

                {showNotifications && (
                  <div className="friends-dropdown">
                    <NotificationsDropdown
                      user={user}
                      onClose={() => setShowNotifications(false)}
                    />
                  </div>
                )}
              </div>

              {/* 2. FRIENDS - middle on mobile */}
              <div className="friends-dropdown-wrapper" ref={friendsDropdownRef}>
                <button
                  className="header-icon-bubble friends-btn"
                  onClick={() => { setShowFriendsPanel(!showFriendsPanel); setShowNotifications(false); setShowSettings(false); }}
                  title="Friends"
                >
                  {homeImages.icon_friends ? (
                    <img loading="lazy" src={homeImages.icon_friends} alt="Friends" className="header-icon-img" />
                  ) : (
                    <span>👥</span>
                  )}
                </button>

                {showFriendsPanel && (
                  <div className="friends-dropdown">
                    <FriendsPanel
                      user={user}
                      onClose={() => setShowFriendsPanel(false)}
                      onInviteToGame={(friend) => {
                        setShowFriendsPanel(false);
                        console.log('Invite friend to game:', friend);
                      }}
                      isDropdown={true}
                    />
                  </div>
                )}
              </div>

              {/* 3. SETTINGS - bottom on mobile */}
              <div className="friends-dropdown-wrapper" ref={settingsDropdownRef}>
                <button
                  className="header-icon-bubble settings-btn"
                  onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowFriendsPanel(false); }}
                  title="Settings"
                >
                  {homeImages.icon_settings ? (
                    <img
                      loading="lazy"
                      src={homeImages.icon_settings}
                      alt="Settings"
                      className="header-icon-img"
                      style={{width:'28px', height:'28px', minWidth:'28px', minHeight:'28px', position:'static', margin:'0', display:'block'}}
                    />
                  ) : (
                    <span>⚙️</span>
                  )}
                </button>

                {showSettings && (
                  <div className="friends-dropdown friends-dropdown--left">
                    <SettingsDropdown
                      user={user}
                      onClose={() => setShowSettings(false)}
                      onLogout={onLogout}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab content */}
        {dashTab === 'home'          && <HomeSection user={user} bgUrl={bgUrl} onUserUpdate={onUserUpdate} homeImages={homeImages} />}
        {dashTab === 'leaderboard'   && <LeaderboardSection userId={user.id} user={user} />}
        {dashTab === 'clans'         && <ClansPage user={user} />}
        {dashTab === 'announcements' && <AnnouncementsSection />}

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <div
            className={`nav-item ${dashTab === 'home' ? 'nav-item--active' : ''}`}
            onClick={() => setDashTab('home')}
          >
            {homeImages.icon_home && (
              <img loading="lazy" src={homeImages.icon_home} className="nav-icon" alt="Home" />
            )}
            <span className="nav-label">HOME</span>
          </div>
          <div className="nav-divider" />
          <div
            className={`nav-item nav-item--leaderboards ${dashTab === 'leaderboard' ? 'nav-item--active' : ''}`}
            onClick={() => setDashTab('leaderboard')}
          >
            {homeImages.icon_leaderboards && (
              <img loading="lazy" src={homeImages.icon_leaderboards} className="nav-icon nav-icon--leaderboards" alt="Leaderboards" />
            )}
            <span className="nav-label">LEADERBOARDS</span>
          </div>
          <div className="nav-divider" />
          <div
            className={`nav-item ${dashTab === 'clans' ? 'nav-item--active' : ''}`}
            onClick={() => setDashTab('clans')}
          >
            {homeImages.icon_clans && (
              <img loading="lazy" src={homeImages.icon_clans} className="nav-icon" alt="Clans" />
            )}
            <span className="nav-label">CLANS</span>
          </div>
          <div className="nav-divider" />
          <div
            className={`nav-item ${dashTab === 'announcements' ? 'nav-item--active' : ''}`}
            onClick={handleAnnouncementsTab}
            style={{ position: 'relative' }}
          >
            {unreadCount > 0 && <span className="ann-unread-dot" />}
            {homeImages.icon_news && (
              <img loading="lazy" src={homeImages.icon_news} className="nav-icon" alt="News" />
            )}
            <span className="nav-label">NEWS</span>
          </div>
          <div className="nav-divider" />
          <div className="nav-item nav-item--play" onClick={onPlayNow}>
            {homeImages.icon_play && (
              <img loading="lazy" src={homeImages.icon_play} className="nav-icon" alt="Play" />
            )}
            <span className="nav-label">PLAY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap Dashboard with Error Boundary
export default function DashboardWithBoundary(props) {
  return (
    <DashboardErrorBoundary>
      <Dashboard {...props} />
    </DashboardErrorBoundary>
  );
}
