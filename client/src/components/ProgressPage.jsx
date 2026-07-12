import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getToken, fetchMe, getCachedUser } from '../auth';
import { formatStudyTime } from './ProfileModal';
import StudyCalendar from './StudyCalendar';
import SubjectDetailModal from './SubjectDetailModal';
import './ProgressPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Rank/color tiers copied from StatsPage's SubjectMastery pattern (StatsPage
// itself is intentionally left untouched — see task notes).
function getMasteryRank(pct) {
  if (pct >= 100) return 'Master ⭐';
  if (pct >= 81)  return 'Expert';
  if (pct >= 61)  return 'Proficient';
  if (pct >= 41)  return 'Competent';
  if (pct >= 21)  return 'Apprentice';
  return 'Novice';
}

function getMasteryColor(pct) {
  if (pct >= 81) return '#F59E0B';
  if (pct >= 61) return '#10B981';
  if (pct >= 41) return '#3B82F6';
  if (pct >= 21) return '#6366F1';
  return '#4B5563';
}

function SubjectBar({ s, i, onClick }) {
  const pct   = s.mastery_percent || 0;
  const color = getMasteryColor(pct);
  return (
    <div
      className="pp-skill-row pp-skill-row--clickable"
      style={{ '--delay': `${i * 0.06}s` }}
      onClick={onClick}
    >
      <div className="pp-skill-left">
        <span className="pp-skill-icon">{s.icon}</span>
        <div>
          <div className="pp-skill-name">{s.name}</div>
          <div className="pp-skill-rank" style={{ color }}>
            {getMasteryRank(pct)} · {s.questions_correct}/{s.questions_attempted} correct
          </div>
        </div>
      </div>
      <div className="pp-skill-track">
        <div className="pp-skill-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="pp-skill-pct" style={{ color }}>{pct}%</span>
    </div>
  );
}

function HighlightCard({ title, icon, items, tone }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`pp-highlight pp-highlight--${tone}`}>
      <div className="pp-highlight-title">{icon} {title}</div>
      {items.map(s => (
        <div key={s.subject} className="pp-highlight-row">
          <span className="pp-highlight-subj">{s.icon} {s.name}</span>
          <span className="pp-highlight-pct" style={{ color: getMasteryColor(s.mastery_percent) }}>
            {s.mastery_percent}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const { userId: paramId } = useParams();
  const [viewedId, setViewedId] = useState(paramId || null);
  const [myId]                  = useState(() => getCachedUser()?.id || null);
  const [data,  setData]  = useState(null);   // /api/users/:id/mastery response
  const [study, setStudy] = useState(null);   // /api/users/:id/study-stats response
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailSubject, setDetailSubject] = useState(null); // subject row whose detail modal is open

  // No :userId param = my own progress. Same own-identity resolution StatsPage
  // uses: token check, cached user, fetchMe fallback, redirect home if guest.
  useEffect(() => {
    if (paramId) { setViewedId(paramId); return; }
    if (!getToken()) { window.location.href = '/'; return; }
    const cached = getCachedUser();
    if (cached?.id) { setViewedId(cached.id); return; }
    fetchMe().then(me => {
      if (!me?.id) { window.location.href = '/'; return; }
      setViewedId(me.id);
    });
  }, [paramId]);

  useEffect(() => {
    if (!viewedId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`${SERVER_URL}/api/users/${viewedId}/mastery`)
        .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); }),
      fetch(`${SERVER_URL}/api/users/${viewedId}/study-stats`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([m, s]) => { if (!cancelled) { setData(m); setStudy(s); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Player not found.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [viewedId]);

  const isOwn = !!viewedId && !!myId && viewedId === myId;

  if (loading) {
    return (
      <div className="pp pp-load">
        <div className="pp-load-ring" />
        <div className="pp-load-text">Loading progress…</div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="pp pp-load">
        <div className="pp-load-text">😕 {error || 'Player not found.'}</div>
        <button className="pp-nav-back" onClick={() => { window.location.href = '/dashboard'; }}>
          ← Back
        </button>
      </div>
    );
  }

  const u = data.user;
  const xpInLevel = (u.xp || 0) % 500;

  return (
    <div className="pp">
      <nav className="pp-nav">
        <button className="pp-nav-back" onClick={() => { window.location.href = '/dashboard'; }}>
          ← Back
        </button>
        <span className="pp-nav-brand">📈 Progress</span>
        {!isOwn && getToken() ? (
          <button className="pp-nav-back" onClick={() => { window.location.href = '/progress'; }}>
            View my progress
          </button>
        ) : <span className="pp-nav-spacer" />}
      </nav>

      <div className="pp-page">
        {/* Identity header */}
        <div className="pp-panel pp-identity">
          <div className="pp-avatar">
            {u.avatar_url
              ? <img src={u.avatar_url} alt={u.username} referrerPolicy="no-referrer" />
              : <span>{u.username?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <div className="pp-id-text">
            <div className="pp-username">
              {u.username || 'Player'}
              {u.clan_tag && <span className="pp-clan-tag"> [{u.clan_tag}]</span>}
              {isOwn && <span className="pp-you-badge"> (you)</span>}
            </div>
            <div className="pp-level">Level {u.level || 1} · {(u.xp || 0).toLocaleString()} XP</div>
            <div className="pp-xp-track">
              <div className="pp-xp-fill" style={{ width: `${Math.round(xpInLevel / 500 * 100)}%` }} />
            </div>
            <div className="pp-xp-text">{xpInLevel.toLocaleString()} / 500 XP to next level</div>
          </div>
        </div>

        {/* Study time */}
        <div className="pp-panel">
          <div className="pp-panel-hd">
            <h2 className="pp-panel-title">📚 Study Time</h2>
            <span className="pp-panel-note">Active time answering questions</span>
          </div>
          <div className="pp-stats-grid">
            <div className="pp-stat">
              <span className="pp-stat-value">{formatStudyTime(study?.total_seconds)}</span>
              <span className="pp-stat-key">Total</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">{formatStudyTime(study?.today_seconds)}</span>
              <span className="pp-stat-key">Today</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">{formatStudyTime(study?.week_seconds)}</span>
              <span className="pp-stat-key">This Week</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">🔥 {study?.streak_days || 0}d</span>
              <span className="pp-stat-key">Streak</span>
            </div>
          </div>

          <StudyCalendar userId={viewedId} />
        </div>

        {/* Subject mastery */}
        <div className="pp-panel">
          <div className="pp-panel-hd">
            <h2 className="pp-panel-title">⚔️ Subject Mastery</h2>
            <span className="pp-panel-note">Based on ranked multiplayer games</span>
          </div>

          {!data.hasData ? (
            <div className="pp-empty">
              <span className="pp-empty-icon">🎮</span>
              <p>No ranked multiplayer games played yet — mastery tracking is based on ranked games.</p>
              <p className="pp-empty-sub">Solo, Training Grounds and Journey progress don't count toward subject mastery (yet).</p>
            </div>
          ) : (
            <>
              <div className="pp-highlights">
                <HighlightCard title="Strongest" icon="💪" items={data.strongest} tone="strong" />
                <HighlightCard title="Needs work" icon="🎯" items={data.weakest} tone="weak" />
              </div>
              <div className="pp-skill-list">
                {data.subjects.map((s, i) => (
                  <SubjectBar key={s.subject} s={s} i={i} onClick={() => setDetailSubject(s)} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="pp-footer-space" />
      </div>

      {detailSubject && (
        <SubjectDetailModal
          userId={viewedId}
          s={detailSubject}
          rank={getMasteryRank(detailSubject.mastery_percent || 0)}
          color={getMasteryColor(detailSubject.mastery_percent || 0)}
          onClose={() => setDetailSubject(null)}
        />
      )}
    </div>
  );
}
