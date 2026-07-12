import { useState, useEffect } from 'react';
import './SubjectDetailModal.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// '2026-07-11T09:41:00Z' -> 'Jul 11, 2026' (viewer's locale month/day order)
function formatGameDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Per-subject drill-down opened by clicking a mastery row on ProgressPage.
// Summary comes from the row's own data (already fetched by /mastery — no
// refetch); the recent-games list is fetched here from the public
// subject-history endpoint. Same overlay/card/close conventions as
// ProfileModal, restyled to ProgressPage's dark look (see the CSS header).
export default function SubjectDetailModal({ userId, s, rank, color, onClose }) {
  const [games, setGames] = useState(null); // null = loading

  useEffect(() => {
    if (!userId || !s?.subject) return;
    let cancelled = false;
    setGames(null);
    fetch(`${SERVER_URL}/api/users/${userId}/subject-history/${encodeURIComponent(s.subject)}`)
      .then(r => (r.ok ? r.json() : { games: [] }))
      .then(d => { if (!cancelled) setGames(d.games || []); })
      .catch(() => { if (!cancelled) setGames([]); });
    return () => { cancelled = true; };
  }, [userId, s?.subject]);

  if (!s) return null;
  const pct = s.mastery_percent || 0;

  return (
    <div className="sdm-overlay" onClick={onClose}>
      <div className="sdm-card" onClick={e => e.stopPropagation()}>
        <div className="sdm-header">
          <h3 className="sdm-title">{s.icon} {s.name}</h3>
          <button className="sdm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sdm-summary">
          <div className="sdm-summary-top">
            <span className="sdm-pct" style={{ color }}>{pct}%</span>
            <span className="sdm-rank" style={{ color }}>{rank}</span>
            <span className="sdm-count">{s.questions_correct}/{s.questions_attempted} correct</span>
          </div>
          <div className="sdm-track">
            <div className="sdm-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        <div className="sdm-games-label">🎮 Recent Ranked Games</div>
        {games === null ? (
          <div className="sdm-muted">Loading…</div>
        ) : games.length === 0 ? (
          <div className="sdm-muted">No recorded games for this subject yet</div>
        ) : (
          <div className="sdm-games">
            {games.map((g, i) => {
              const acc = g.total_questions
                ? Math.round((g.correct_answers / g.total_questions) * 100)
                : 0;
              return (
                <div key={`${g.played_at}-${i}`} className="sdm-game-row">
                  <span className="sdm-game-date">{formatGameDate(g.played_at)}</span>
                  <span className="sdm-game-score">{g.correct_answers}/{g.total_questions}</span>
                  <span className="sdm-game-acc">{acc}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
