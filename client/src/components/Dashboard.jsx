import { useState, useEffect, useCallback } from 'react';
import { fetchMe, authFetch } from '../auth';
import './Dashboard.css';

const SUBJECTS = [
  { id: 'cardiology',    label: 'Cardiology',    icon: '❤️' },
  { id: 'neurology',     label: 'Neurology',     icon: '🧠' },
  { id: 'pharmacology',  label: 'Pharmacology',  icon: '💊' },
  { id: 'microbiology',  label: 'Microbiology',  icon: '🦠' },
  { id: 'biochemistry',  label: 'Biochemistry',  icon: '⚗️' },
  { id: 'biostatistics', label: 'Biostatistics', icon: '📊' },
];
const PLACE_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
              ⚠️ You can only change your username once per year.
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

// ── Home Section ───────────────────────────────────────────────────────────────
function HomeSection({ user, onUserUpdate }) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const xp          = user.xp    || 0;
  const level       = user.level || 1;
  const xpIntoLevel = xp % 500;
  const xpProgress  = Math.round((xpIntoLevel / 500) * 100);
  const xpToNext    = 500 - xpIntoLevel;
  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const winRate     = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const mastery      = user.subject_mastery || [];
  const gameHistory  = user.game_history    || [];
  const totalCorrect = mastery.reduce((s, m) => s + (m.questions_correct || 0), 0);

  function getMastery(subject) {
    const m = mastery.find(m => m.subject === subject);
    return m ? m.mastery_percent : 0;
  }
  function masteryColor(pct) {
    if (pct >= 80) return 'var(--green)';
    if (pct >= 50) return '#ffaa00';
    return 'var(--blue)';
  }

  return (
    <div className="dash-content">
      {/* Profile + Stats */}
      <div className="dash-top-row">
        <div className="dash-card profile-card">
          <div className="profile-top">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="profile-avatar" referrerPolicy="no-referrer" />
              : <div className="profile-avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
            }
            <div className="profile-details">
              <h2 className="profile-username">{user.username}</h2>
              <span className="level-badge">Level {level}</span>
              {user.last_username_change && (
                <span className="username-last-changed">
                  Name changed {fmtDate(user.last_username_change)}
                </span>
              )}
              <button
                className="btn-change-username"
                onClick={() => setShowUsernameModal(true)}
              >
                ✏️ Change Username
              </button>
            </div>
          </div>
          <div className="xp-section">
            <div className="xp-label-row">
              <span className="xp-total">{xp.toLocaleString()} XP</span>
              <span className="xp-next">{xpToNext} XP to Lv {level + 1}</span>
            </div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="dash-card stats-card">
          <div className="card-title">Overall Stats</div>
          <div className="stats-grid">
            <div className="stat-item"><div className="stat-val">{gamesPlayed}</div><div className="stat-label">Played</div></div>
            <div className="stat-item"><div className="stat-val">{gamesWon}</div><div className="stat-label">Wins</div></div>
            <div className="stat-item"><div className="stat-val">{winRate}%</div><div className="stat-label">Win Rate</div></div>
            <div className="stat-item"><div className="stat-val">{totalCorrect}</div><div className="stat-label">Correct</div></div>
          </div>
        </div>
      </div>

      {/* Mastery */}
      <div className="dash-card mastery-card">
        <div className="card-title">Subject Mastery</div>
        <div className="mastery-grid">
          {SUBJECTS.map(({ id, label, icon }) => {
            const pct = getMastery(id);
            return (
              <div key={id} className="mastery-item">
                <div className="mastery-header">
                  <span className="mastery-icon">{icon}</span>
                  <span className="mastery-name">{label}</span>
                  <span className="mastery-pct">{pct}%</span>
                </div>
                <div className="mastery-track">
                  <div className="mastery-fill" style={{ width: `${pct}%`, background: masteryColor(pct) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game history */}
      <div className="dash-card history-card">
        <div className="card-title">Recent Games</div>
        {gameHistory.length === 0 ? (
          <p className="no-history">No games yet — start your first battle!</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr><th>Subject</th><th>Place</th><th>Correct</th><th>XP</th><th>Date</th></tr>
            </thead>
            <tbody>
              {gameHistory.map(g => {
                const subj = SUBJECTS.find(s => s.id === g.subject);
                return (
                  <tr key={g.id}>
                    <td className="history-subject">{subj?.icon || '🎮'} {cap(g.subject)}</td>
                    <td>{PLACE_ICONS[g.placement] || `#${g.placement}`}</td>
                    <td className="history-correct">{g.correct_answers}/{g.total_questions}</td>
                    <td className="history-xp">+{g.xp_earned}</td>
                    <td className="history-date">{fmtDate(g.played_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
  const [view,      setView]      = useState('home'); // 'home' | 'create' | 'search'
  const [clanName,  setClanName]  = useState('');
  const [clanTag,   setClanTag]   = useState('');
  const [searchQ,   setSearchQ]   = useState('');
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [clanLb,    setClanLb]    = useState([]);
  const [lbLoaded,  setLbLoaded]  = useState(false);

  // Fetch clan leaderboard once
  useEffect(() => {
    authFetch('/api/clans/leaderboard')
      .then(r => r.ok ? r.json() : { clans: [] })
      .then(d => { setClanLb(d.clans || []); setLbLoaded(true); });
  }, []);

  // Debounced clan search
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

      {/* In-clan view */}
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
        /* No-clan view */
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

      {/* Clan leaderboard */}
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

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ user, onPlayNow, onLogout, onUserUpdate }) {
  const [dashTab, setDashTab] = useState('home'); // 'home' | 'leaderboard' | 'clans'

  return (
    <div className="dashboard-screen">
      <div className="dashboard-container">

        {/* Header */}
        <div className="dash-header">
          <div className="dash-logo">⚕️ USMLE Battle Royale</div>
          <button className="btn-logout" onClick={onLogout}>Sign Out</button>
        </div>

        {/* Tab content */}
        {dashTab === 'home'        && <HomeSection user={user} onUserUpdate={onUserUpdate} />}
        {dashTab === 'leaderboard' && <LeaderboardSection userId={user.id} />}
        {dashTab === 'clans'       && <ClanSection user={user} onUserUpdate={onUserUpdate} />}

        {/* Bottom navigation */}
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
            <span className="nav-label">Leaderboard</span>
          </button>
          <button
            className={`dash-nav-btn ${dashTab === 'clans' ? 'active' : ''}`}
            onClick={() => setDashTab('clans')}
          >
            <span className="nav-icon">🛡️</span>
            <span className="nav-label">Clans</span>
          </button>
          <button className="dash-nav-btn dash-nav-play" onClick={onPlayNow}>
            <span className="nav-icon">⚔️</span>
            <span className="nav-label">Play</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
