import { useState, useEffect } from 'react';
import './ProfileModal.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

const ZERO_STATS = { total_seconds: 0, today_seconds: 0, week_seconds: 0, streak_days: 0 };

// "Xh Ym" for >= 1h, "Xm" below that; never blank (sub-minute shows "0m").
export function formatStudyTime(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Public player profile: identity from the row that opened it (leaderboard /
// friends already have id, username, avatar_url, level, xp, clan_tag), study
// stats fetched from the public study-stats endpoint. Reuses the shared
// modal-overlay/modal-card styles from Dashboard.css.
export default function ProfileModal({ user, onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetch(`${SERVER_URL}/api/users/${user.id}/study-stats`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setStats({ ...ZERO_STATS, ...d }); })
      .catch(() => { if (!cancelled) setStats(ZERO_STATS); });
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user) return null;
  const s = stats || ZERO_STATS;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card profile-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Player Profile</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="pm-identity">
          <div className="pm-avatar">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
              : <span>{user.username?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <div className="pm-id-text">
            <div className="pm-username">
              {user.username || 'Player'}
              {user.clan_tag && <span className="pm-clan-tag"> [{user.clan_tag}]</span>}
            </div>
            <div className="pm-level">
              Level {user.level || 1} &nbsp;·&nbsp; {(user.xp || 0).toLocaleString()} XP
            </div>
          </div>
        </div>

        <div className="pm-study-label">📚 Study Time</div>
        <div className="pm-stats-grid">
          <div className="pm-stat">
            <span className="pm-stat-value">{formatStudyTime(s.total_seconds)}</span>
            <span className="pm-stat-key">Total</span>
          </div>
          <div className="pm-stat">
            <span className="pm-stat-value">{formatStudyTime(s.today_seconds)}</span>
            <span className="pm-stat-key">Today</span>
          </div>
          <div className="pm-stat">
            <span className="pm-stat-value">{formatStudyTime(s.week_seconds)}</span>
            <span className="pm-stat-key">This Week</span>
          </div>
          <div className="pm-stat">
            <span className="pm-stat-value">🔥 {s.streak_days || 0}d</span>
            <span className="pm-stat-key">Streak</span>
          </div>
        </div>

        <button
          className="pm-progress-btn"
          onClick={() => { window.location.href = `/progress/${user.id}`; }}
        >
          📈 View full progress
        </button>
      </div>
    </div>
  );
}
