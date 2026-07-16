import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getToken, fetchMe, getCachedUser, authFetch } from '../auth';
import { formatStudyTime } from './ProfileModal';
import { evaluateAchievements, LEVEL_MILESTONES } from '../utils/achievements';
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

// Gold ramp hand-derived from --mv-gold #e8b04b (CSS custom properties can't
// reach these JS values) — brighter gold = higher mastery, gray = Novice.
function getMasteryColor(pct) {
  if (pct >= 81) return '#e8b04b';
  if (pct >= 61) return '#c9973f';
  if (pct >= 41) return '#a67c34';
  if (pct >= 21) return '#8a6529';
  return '#6b7280';
}

const MODE_LABELS = {
  battle_royale:  'Battle Royale',
  speed_race:     'Speed Race',
  trivia_pursuit: 'Trivia Pursuit',
};
const modeLabel = mode =>
  MODE_LABELS[mode] || (mode ? mode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Battle Royale');

// 'Today' / 'Yesterday' / 'N days ago' / short date beyond 30 days
function timeAgo(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= 30) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

// Compact 30-day XP sparkline (gold polyline; static, no hover tooling)
function XpSparkline({ days }) {
  const VW = 600, VH = 100, PAD = 6;
  const max = Math.max(...days.map(d => d.xp || 0), 1);
  const step = (VW - PAD * 2) / Math.max(days.length - 1, 1);
  const pts = days.map((d, i) => {
    const x = PAD + i * step;
    const y = VH - PAD - ((d.xp || 0) / max) * (VH - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg className="pp-xp-graph" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon
        points={`${PAD},${VH - PAD} ${pts.join(' ')} ${VW - PAD},${VH - PAD}`}
        fill="rgba(232, 176, 75, 0.12)"
      />
      <polyline points={pts.join(' ')} fill="none" stroke="#e8b04b" strokeWidth="2" />
    </svg>
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
  const [gameStats, setGameStats] = useState(null); // /api/users/:id/game-stats response
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailSubject, setDetailSubject] = useState(null); // subject row whose detail modal is open

  // Own-profile-only data (the "Your Stats" section — StatsPage's unique
  // own-user content, fetched from the same endpoints StatsPage uses)
  const [own,         setOwn]         = useState(null); // fresh /auth/me (tower floor, streak)
  const [ownRank,     setOwnRank]     = useState(null);
  const [xpHistory,   setXpHistory]   = useState(null);
  const [globalStats, setGlobalStats] = useState(null);

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
      fetch(`${SERVER_URL}/api/users/${viewedId}/game-stats`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([m, s, g]) => { if (!cancelled) { setData(m); setStudy(s); setGameStats(g); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Player not found.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [viewedId]);

  const isOwn = !!viewedId && !!myId && viewedId === myId;

  // Own profile only: the same data StatsPage fetches for its unique sections
  // (global rank, XP history, global comparison; fresh /auth/me for tower
  // floor + streak). All best-effort — the section degrades gracefully.
  useEffect(() => {
    if (!isOwn) return;
    let cancelled = false;
    fetchMe().then(me => { if (!cancelled && me) setOwn(me); });
    authFetch('/api/leaderboard/players')
      .then(r => (r.ok ? r.json() : null))
      .then(lb => {
        if (cancelled || !lb?.players) return;
        const idx = lb.players.findIndex(p => p.id === myId);
        if (idx >= 0) setOwnRank(idx + 1);
      })
      .catch(() => {});
    authFetch('/api/stats/xp-history')
      .then(r => (r.ok ? r.json() : null))
      .then(h => { if (!cancelled && h?.days) setXpHistory(h.days); })
      .catch(() => {});
    authFetch('/api/stats/global')
      .then(r => (r.ok ? r.json() : null))
      .then(g => { if (!cancelled && g) setGlobalStats(g); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOwn, myId]);

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
  const gs = gameStats || { total_games: 0, wins: 0, win_rate: 0, total_correct_answers: 0, recent_matches: [] };

  // Achievements from public data (mastery + game-stats + study streak);
  // tower floor is only known for the own profile (/auth/me), others show
  // tower achievements as locked.
  const achievements = evaluateAchievements({
    gamesPlayed:  gs.total_games,
    gamesWon:     gs.wins,
    totalCorrect: gs.total_correct_answers,
    mastery:      data.subjects || [],
    towerFloor:   isOwn ? (own?.tower_floor || own?.tower_progress || 0) : 0,
    streak:       study?.streak_days || 0,
    hasClan:      !!u.clan_tag,
  });
  const level = u.level || 1;
  const xpToNext = 500 - xpInLevel;

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
          {/* Wrapper so the diamond level badge can overhang the clipped
              avatar circle (same technique as the dashboard header) */}
          <div className="pp-avatar-wrap">
            <div className="pp-avatar">
              {u.avatar_url
                ? <img src={u.avatar_url} alt={u.username} referrerPolicy="no-referrer" />
                : <span>{u.username?.[0]?.toUpperCase() || '?'}</span>
              }
            </div>
            <div className="pp-lvl-badge" title={`Level ${level}`}>
              <span className="pp-lvl-num">{level}</span>
            </div>
          </div>
          <div className="pp-id-text">
            <div className="pp-username">
              {u.username || 'Player'}
              {u.clan_tag && (
                <a className="pp-clan-tag" href="/dashboard?tab=clans"> [{u.clan_tag}]</a>
              )}
              {isOwn && <span className="pp-you-badge"> (you)</span>}
            </div>
            <div className="pp-level">Level {level} · {(u.xp || 0).toLocaleString()} XP</div>
            <div className="pp-xp-track">
              <div className="pp-xp-fill" style={{ width: `${Math.round(xpInLevel / 500 * 100)}%` }} />
            </div>
            <div className="pp-xp-text">{xpInLevel.toLocaleString()} / 500 XP to next level</div>
          </div>
        </div>

        {/* Stat grid (mockup): value-over-label tiles from /game-stats.
            "Allies Healed" = lifetime correct answers (the closest real
            derivable stat — no healing mechanic exists). */}
        <div className="pp-tiles">
          <div className="pp-tile">
            <div className="pp-tile-value pp-tile-value--gold">{gs.wins.toLocaleString()}</div>
            <div className="pp-tile-label">TOTAL WINS</div>
          </div>
          <div className="pp-tile">
            <div className="pp-tile-value">{gs.total_correct_answers.toLocaleString()}</div>
            <div className="pp-tile-label">ALLIES HEALED</div>
          </div>
          <div className="pp-tile">
            <div className="pp-tile-value">{gs.win_rate}%</div>
            <div className="pp-tile-label">WIN RATE</div>
          </div>
          <div className="pp-tile">
            <div className="pp-tile-value">{gs.total_games.toLocaleString()}</div>
            <div className="pp-tile-label">MATCHES PLAYED</div>
          </div>
        </div>

        {/* Equipped Gear — INERT placeholders: no gear/cosmetics system
            exists yet (mockup parity only, nothing clickable) */}
        <div className="pp-section-head">
          Equipped Gear <span className="pp-soon-chip">COMING SOON</span>
        </div>
        <div className="pp-gear" aria-disabled="true">
          {[1, 2, 3].map(i => (
            <div className="pp-gear-card" key={i}>
              <div className="pp-gear-art" />
              <div className="pp-gear-name">Gear Slot {i}</div>
            </div>
          ))}
        </div>

        {/* Achievements (shared evaluator; mockup badge circles) */}
        <div className="pp-section-head">Achievements</div>
        <div className="pp-ach-grid">
          {achievements.map(a => (
            <div
              className={`pp-ach${a.unlocked ? ' pp-ach--unlocked' : ''}`}
              key={a.id}
              title={`${a.name} — ${a.desc}`}
            >
              <span className="pp-ach-circle">{a.unlocked ? a.icon : '?'}</span>
              <span className="pp-ach-name">{a.unlocked ? a.name : 'Locked'}</span>
            </div>
          ))}
        </div>

        {/* Recent Matches (mockup list) from /game-stats */}
        <div className="pp-section-head">Recent Matches</div>
        <div className="pp-panel pp-matches">
          {gs.recent_matches.length === 0 ? (
            <div className="pp-match-empty">No ranked matches recorded yet.</div>
          ) : (
            gs.recent_matches.map((m, i) => (
              <div className="pp-match-row" key={`${m.played_at}-${i}`}>
                <span className={`pp-match-tag ${m.is_win ? 'pp-match-tag--win' : 'pp-match-tag--loss'}`}>
                  {m.is_win ? 'WIN' : 'LOSS'}
                </span>
                <span className="pp-match-mode">
                  {modeLabel(m.mode)}
                  <span className="pp-match-score"> · {m.correct_answers}/{m.total_questions}</span>
                </span>
                <span className="pp-match-date">{timeAgo(m.played_at)}</span>
              </div>
            ))
          )}
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

        {/* ── Your Stats — OWN profile only. StatsPage's unique own-user
               content (global rank / tower / streak, level milestones, XP
               graph, global comparison, CTA), re-rendered here on the
               page's token palette from the same endpoints StatsPage uses.
               StatsPage itself is untouched. ── */}
        {isOwn && (
          <>
            <div className="pp-section-head">Your Stats</div>

            <div className="pp-tiles pp-tiles--own">
              <div className="pp-tile">
                <div className="pp-tile-value pp-tile-value--gold">{ownRank ? `#${ownRank}` : '—'}</div>
                <div className="pp-tile-label">GLOBAL RANK</div>
              </div>
              <div className="pp-tile">
                <div className="pp-tile-value">{own?.tower_floor || own?.tower_progress || 0}/100</div>
                <div className="pp-tile-label">TOWER FLOOR</div>
              </div>
              <div className="pp-tile">
                <div className="pp-tile-value">🔥 {study?.streak_days || 0}d</div>
                <div className="pp-tile-label">DAILY STREAK</div>
              </div>
            </div>

            {/* Level milestones */}
            <div className="pp-panel">
              <div className="pp-panel-hd">
                <h2 className="pp-panel-title">🗺️ Level Milestones</h2>
                <span className="pp-panel-note">Level {level}</span>
              </div>
              <div className="pp-miles">
                {LEVEL_MILESTONES.map(m => (
                  <div className={`pp-mile${level >= m.level ? ' pp-mile--done' : ''}`} key={m.level}>
                    <span className="pp-mile-level">Lv {m.level}</span>
                    <span className="pp-mile-title">{m.title}</span>
                    <span className="pp-mile-reward">{m.reward}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* XP over the last 30 days */}
            {xpHistory && xpHistory.length > 0 && (
              <div className="pp-panel">
                <div className="pp-panel-hd">
                  <h2 className="pp-panel-title">📈 XP — Last 30 Days</h2>
                  <span className="pp-panel-note">
                    {xpHistory.reduce((s, d) => s + (d.xp || 0), 0).toLocaleString()} XP earned
                  </span>
                </div>
                <XpSparkline days={xpHistory} />
              </div>
            )}

            {/* Global comparison */}
            <div className="pp-panel">
              <div className="pp-panel-hd">
                <h2 className="pp-panel-title">🌍 How You Stack Up</h2>
                <span className="pp-panel-note">You vs global average</span>
              </div>
              {(() => {
                const subjects = data.subjects || [];
                const totalC = subjects.reduce((s, m) => s + (m.questions_correct || 0), 0);
                const totalA = subjects.reduce((s, m) => s + (m.questions_attempted || 0), 0);
                const yourAcc = totalA > 0 ? Math.round((totalC / totalA) * 100) : 0;
                const g = globalStats || { accuracy: 50, win_rate: 20, tower_floor: 5 };
                const rows = [
                  { label: 'Answer Accuracy', yours: yourAcc, global: g.accuracy, fmt: v => `${v}%` },
                  { label: 'Win Rate', yours: gs.win_rate, global: g.win_rate, fmt: v => `${v}%` },
                  { label: 'Tower Floor', yours: own?.tower_floor || own?.tower_progress || 0, global: g.tower_floor, fmt: v => `${v}` },
                ];
                return (
                  <div className="pp-cmp">
                    {rows.map(r => {
                      const max = Math.max(r.yours, r.global, 1);
                      return (
                        <div className="pp-cmp-row" key={r.label}>
                          <div className="pp-cmp-label">{r.label}</div>
                          <div className="pp-cmp-bars">
                            <div className="pp-cmp-track">
                              <div className="pp-cmp-fill pp-cmp-fill--you" style={{ width: `${(r.yours / max) * 100}%` }} />
                            </div>
                            <span className="pp-cmp-val pp-cmp-val--you">{r.fmt(r.yours)}</span>
                          </div>
                          <div className="pp-cmp-bars">
                            <div className="pp-cmp-track">
                              <div className="pp-cmp-fill pp-cmp-fill--avg" style={{ width: `${(r.global / max) * 100}%` }} />
                            </div>
                            <span className="pp-cmp-val">{r.fmt(r.global)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pp-cmp-legend">
                      <span className="pp-cmp-leg pp-cmp-leg--you">■ You</span>
                      <span className="pp-cmp-leg">■ Global Average</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* CTA */}
            <div className="pp-panel pp-cta">
              <div className="pp-cta-text">
                Keep climbing. Your next level is
                <span className="pp-cta-xp"> {xpToNext.toLocaleString()} XP </span>
                away.
              </div>
              <button className="pp-cta-btn" onClick={() => { window.location.href = '/'; }}>
                Play Now →
              </button>
            </div>
          </>
        )}

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
