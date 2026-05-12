import { useState, useEffect, useCallback } from 'react';
import { fetchMe, authFetch } from '../auth';
import { DefaultPreview, PixelPreview } from './AppearanceSection';
import { useTheme, PALETTE } from '../theme';
import './Dashboard.css';

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
function HomeSection({ user, bgUrl, onUserUpdate }) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const xp          = user.xp    || 0;
  const level       = user.level || 1;
  const xpIntoLevel = xp % 500;
  const xpProgress  = Math.round((xpIntoLevel / 500) * 100);
  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const winRate     = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : 0;
  const gameHistory = user.game_history || [];
  const rank        = getRank(xp);

  // Mock daily quests (would come from server in real implementation)
  const quests = [
    { id: 1, icon: '🎮', desc: 'Play 3 games today', current: 1, total: 3, reward: 150 },
    { id: 2, icon: '❓', desc: 'Answer 10 questions correctly', current: 7, total: 10, reward: 200 },
    { id: 3, icon: '⚔️', desc: 'Win a Battle Royale match', current: 0, total: 1, reward: 300 },
  ];

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

  return (
    <div className="dash-main">
      {/* Left Column */}
      <div className="dash-left-col">
        {/* Player Profile */}
        <div className="parchment-panel profile-panel">
          <div className="profile-avatar-wrap">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="profile-avatar" referrerPolicy="no-referrer" />
              : <div className="profile-avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
            }
            <div className="profile-avatar-frame" />
            <div className="profile-level-badge">{level}</div>
          </div>
          <div className="profile-username">
            {user.username}
            <button className="profile-edit-btn" onClick={() => setShowUsernameModal(true)} title="Edit username">
              ✏️
            </button>
          </div>
          <div className="profile-title">
            <span>🌿</span> Future Doctor
          </div>
          <div className="profile-xp-section">
            <div className="profile-xp-text">
              <span className="profile-xp-current">{xp.toLocaleString()} / {(Math.floor(xp / 500) + 1) * 500} XP</span>
            </div>
            <div className="profile-xp-bar">
              <div className="profile-xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="parchment-panel">
          <div className="panel-title">Stats Overview</div>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-icon">✨</div>
              <div className="stat-label">Total XP</div>
              <div className="stat-value">{xp.toLocaleString()}</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🎮</div>
              <div className="stat-label">Games Played</div>
              <div className="stat-value">{gamesPlayed}</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🏆</div>
              <div className="stat-label">Win Rate</div>
              <div className="stat-value">{winRate}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🔥</div>
              <div className="stat-label">Best Streak</div>
              <div className="stat-value">{user.best_streak || 0}</div>
            </div>
          </div>
        </div>

        {/* Current Rank */}
        <div className="parchment-panel rank-panel">
          <div className="panel-title">Current Rank</div>
          <div className="rank-crest">
            <div className="rank-numeral">{rank.tier}</div>
          </div>
          <div className="rank-name">{rank.name}</div>
          <div className="rank-progress-text">
            <span>🏆</span> {xp.toLocaleString()} / {rank.next?.toLocaleString() || '∞'}
          </div>
          <div className="rank-progress-bar">
            <div className="rank-progress-fill" style={{ width: `${Math.round(rank.progress * 100)}%` }} />
          </div>
          {rank.next && (
            <div className="rank-next">Next: {getRank(rank.next).name}</div>
          )}
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
        {/* Daily Quests */}
        <div className="parchment-panel">
          <div className="panel-title">
            Daily Quests
            <span className="quests-timer">⏰ {timeLeft}</span>
          </div>
          <div className="quest-list">
            {quests.map(q => (
              <div key={q.id} className="quest-item">
                <div className="quest-icon">{q.icon}</div>
                <div className="quest-info">
                  <div className="quest-desc">{q.desc}</div>
                  <div className="quest-progress-bar">
                    <div
                      className="quest-progress-fill"
                      style={{ width: `${Math.min(100, (q.current / q.total) * 100)}%` }}
                    />
                  </div>
                  <div className="quest-progress-text">{q.current} / {q.total}</div>
                </div>
                <div className="quest-reward">
                  <span>🪙</span> {q.reward}
                </div>
              </div>
            ))}
          </div>
          <div className="view-all-link" onClick={() => window.location.href = '/stats'}>
            VIEW ALL QUESTS →
          </div>
        </div>

        {/* Recent Games */}
        <div className="parchment-panel">
          <div className="panel-title">
            Recent Games
            <span className="panel-title-link" onClick={() => window.location.href = '/stats'}>VIEW ALL →</span>
          </div>
          {gameHistory.length === 0 ? (
            <p className="no-games-msg">No games yet — start your first battle!</p>
          ) : (
            <div className="recent-games-list">
              {gameHistory.slice(0, 4).map(g => {
                const modeIcon = GAME_MODE_ICONS[g.game_mode] || '🎮';
                const modeLabel = GAME_MODE_LABELS[g.game_mode] || cap(g.game_mode || 'Game');
                const subj = SUBJECTS.find(s => s.id === g.subject);
                const placeClass = g.placement === 1 ? 'gold' : g.placement === 2 ? 'silver' : 'normal';
                return (
                  <div key={g.id} className="recent-game-row">
                    <div className="recent-game-thumb">{modeIcon}</div>
                    <div className="recent-game-info">
                      <div className="recent-game-mode">{modeLabel}</div>
                      <div className="recent-game-subject">{subj?.icon || '📚'} {cap(g.subject)}</div>
                    </div>
                    <div className="recent-game-result">
                      <div className={`recent-game-place ${placeClass}`}>
                        {g.placement === 1 ? '1st 🏆' : g.placement === 2 ? '2nd' : `#${g.placement}`}
                      </div>
                      <div className="recent-game-xp">+{g.xp_earned} XP</div>
                      <div className="recent-game-time">{timeAgo(g.played_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
function LeaderboardSection({ userId }) {
  const [lbTab,    setLbTab]    = useState('players');
  const [players,  setPlayers]  = useState([]);
  const [clans,    setClans]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoading(true);
    Promise.all([
      authFetch('/api/leaderboard/players').then(r => r.ok ? r.json() : { players: [] }),
      authFetch('/api/clans/leaderboard').then(r => r.ok ? r.json() : { clans: [] }),
    ]).then(([pd, cd]) => {
      setPlayers(pd.players || []);
      setClans(cd.clans || []);
      setLoaded(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="dash-content">
      <div className="lb-tab-bar">
        <button className={`lb-tab-btn ${lbTab === 'players' ? 'active' : ''}`} onClick={() => setLbTab('players')}>
          Players
        </button>
        <button className={`lb-tab-btn ${lbTab === 'clans' ? 'active' : ''}`} onClick={() => setLbTab('clans')}>
          Clans
        </button>
      </div>

      {loading && <div className="lb-loading"><div className="spinner" /></div>}

      {!loading && lbTab === 'players' && (
        <div className="dash-card">
          <div className="card-title">Top 50 Players</div>
          {players.length === 0
            ? <p className="no-history">No players ranked yet.</p>
            : (
              <table className="lb-big-table">
                <thead>
                  <tr><th>#</th><th>Player</th><th>Clan</th><th>Level</th><th>XP</th></tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className={p.id === userId ? 'lb-me' : ''}>
                      <td className="lb-rank-cell">
                        {p.rank <= 3 ? PLACE_ICONS[p.rank] : <span className="lb-rank-num">#{p.rank}</span>}
                      </td>
                      <td className="lb-player-cell">
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt="" className="lb-avatar" referrerPolicy="no-referrer" />
                          : <div className="lb-avatar-placeholder">{p.username?.[0]?.toUpperCase()}</div>
                        }
                        <span className="lb-username">{p.username}</span>
                      </td>
                      <td>{p.clan_tag ? <span className="lb-clan-tag">[{p.clan_tag}]</span> : <span className="lb-no-clan">—</span>}</td>
                      <td><span className="lb-level">Lv {p.level}</span></td>
                      <td className="lb-xp">{p.xp?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {!loading && lbTab === 'clans' && (
        <div className="dash-card">
          <div className="card-title">Top 10 Clans</div>
          {clans.length === 0
            ? <p className="no-history">No clans yet.</p>
            : (
              <table className="lb-big-table">
                <thead>
                  <tr><th>#</th><th>Clan</th><th>Members</th><th>Total XP</th></tr>
                </thead>
                <tbody>
                  {clans.map((c, i) => (
                    <tr key={c.id}>
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
            )
          }
        </div>
      )}
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

// ── Settings Panel ─────────────────────────────────────────────────────────────
function SettingsPanel({ onClose, onLogout }) {
  const { theme, color, applyTheme } = useTheme();

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>

        <div className="settings-panel-header">
          <span className="settings-panel-title">⚙️ Settings</span>
          <button className="settings-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-panel-body">
          <div className="stp-section-label">APPEARANCE</div>

          <div className="stp-subsect">
            <div className="stp-subsect-title">Theme</div>
            <div className="stp-theme-grid">
              {[
                { id: 'default', name: 'Default', Preview: DefaultPreview },
                { id: 'pixel',   name: 'Pixel Art', Preview: PixelPreview  },
              ].map(({ id, name, Preview }) => (
                <button
                  key={id}
                  className={`stp-theme-card ${theme === id ? 'stp-theme-sel' : ''}`}
                  onClick={() => applyTheme(id, color)}
                  style={{ '--tc': PALETTE.find(p => p.id === color)?.hex || '#7C3AED' }}
                >
                  {theme === id && <div className="stp-theme-check">✓</div>}
                  <Preview color={color} />
                  <div className="stp-theme-name">{name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="stp-subsect">
            <div className="stp-subsect-title">Accent Colour</div>
            <div className="stp-color-grid">
              {PALETTE.map(p => (
                <button
                  key={p.id}
                  className={`stp-color-dot ${color === p.id ? 'stp-color-sel' : ''}`}
                  style={{ '--c': p.hex }}
                  onClick={() => applyTheme(theme, p.id)}
                  title={p.label}
                >
                  <div className="stp-dot" />
                </button>
              ))}
            </div>
          </div>

          <div className="stp-subsect" style={{ marginTop: 32 }}>
            <button className="btn-logout" onClick={onLogout} style={{ width: '100%' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ user, onPlayNow, onLogout, onUserUpdate }) {
  const [dashTab,      setDashTab]      = useState('home');
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [showWelcome,  setShowWelcome]  = useState(false);
  const [welcomeAnn,   setWelcomeAnn]   = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [bgUrl,        setBgUrl]        = useState(null);

  // Fetch background image
  useEffect(() => {
    fetch(`${SERVER_URL}/api/landing-images`)
      .then(r => r.json())
      .then(d => {
        if (d.images?.hero_bg) setBgUrl(d.images.hero_bg);
      })
      .catch(() => {});
  }, []);

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

  // Mock currency values
  const coins = 24850;
  const gems = 1250;

  return (
    <div className="dashboard-screen">
      {/* Background */}
      <div className="dashboard-bg">
        {bgUrl && <img src={bgUrl} alt="" className="dashboard-bg-image" />}
        <div className="dashboard-bg-overlay" />
      </div>

      <div className="dashboard-container">
        {showWelcome && <WelcomePopup announcement={welcomeAnn} onClose={handleWelcomeClose} />}

        {/* Top Bar */}
        <div className="dash-topbar">
          <div className="dash-logo-section">
            <div className="dash-logo">
              <span className="dash-logo-icon">🏆</span>
              MedVale
            </div>
            <div className="dash-tagline">LIVE. FIGHT. SURVIVE. BECOME LEGEND.</div>
          </div>

          <div className="dash-topbar-right">
            <div className="currency-box">
              <span className="currency-icon">🪙</span>
              <span className="currency-value">{coins.toLocaleString()}</span>
            </div>
            <div className="currency-box">
              <span className="currency-icon">💎</span>
              <span className="currency-value">{gems.toLocaleString()}</span>
            </div>
            <button className="topbar-icon-btn" title="Notifications">
              🔔
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            <button className="topbar-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
              ⚙️
            </button>
          </div>
        </div>

        {/* Tab content */}
        {dashTab === 'home'          && <HomeSection user={user} bgUrl={bgUrl} onUserUpdate={onUserUpdate} />}
        {dashTab === 'leaderboard'   && <LeaderboardSection userId={user.id} />}
        {dashTab === 'clans'         && <ClanSection user={user} onUserUpdate={onUserUpdate} />}
        {dashTab === 'announcements' && <AnnouncementsSection />}

        {/* Bottom Navigation */}
        <nav className="dash-nav">
          <button
            className={`dash-nav-btn ${dashTab === 'home' ? 'active' : ''}`}
            onClick={() => setDashTab('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button
            className={`dash-nav-btn ${dashTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setDashTab('leaderboard')}
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-label">Leaderboards</span>
          </button>
          <button
            className={`dash-nav-btn ${dashTab === 'clans' ? 'active' : ''}`}
            onClick={() => setDashTab('clans')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Clans</span>
          </button>
          <button
            className={`dash-nav-btn ${dashTab === 'announcements' ? 'active' : ''}`}
            onClick={handleAnnouncementsTab}
            style={{ position: 'relative' }}
          >
            {unreadCount > 0 && <span className="ann-unread-dot" />}
            <span className="nav-icon">📰</span>
            <span className="nav-label">News</span>
          </button>
          <button className="dash-nav-btn dash-nav-play" onClick={onPlayNow}>
            <span className="nav-icon">⚔️</span>
            <span className="nav-label">Play</span>
          </button>
        </nav>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} onLogout={onLogout} />}
    </div>
  );
}
