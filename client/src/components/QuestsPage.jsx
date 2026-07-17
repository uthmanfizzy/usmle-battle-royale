import { useState, useEffect } from 'react';
import { getToken, fetchMe, getCachedUser, authFetch } from '../auth';
import { timeToDailyReset } from '../utils/dailyReset';
import './QuestsPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Standalone Quests page (Phase C) — promoted from the Dashboard dock's
// temporary scroll-to-widget bridge. Reads the same two endpoints the Home
// widget merges (GET /api/daily-quests + GET /api/quest-progress) and shows
// the same auto-award truth: completed quests already paid out server-side
// (updateQuestProgress), so they get a "✓ Claimed" badge, never a button.
// Weekly is a real tab but no weekly tier exists in the backend — it renders
// an honest coming-soon state.
export default function QuestsPage() {
  const [user, setUser] = useState(getCachedUser);
  const [tab, setTab] = useState('daily'); // 'daily' | 'weekly'
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [resetIn, setResetIn] = useState(timeToDailyReset());

  // Same own-identity guard /settings and /progress use: no token → landing.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => { if (me) setUser(me); });
  }, []);

  // Same merge HomeSection does: quest defs (public) + today's per-user
  // progress rows keyed by quest_id.
  useEffect(() => {
    async function loadQuests() {
      try {
        const [questsRes, progressRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/daily-quests`),
          authFetch('/api/quest-progress'),
        ]);
        const questsData = await questsRes.json();
        const progressData = await progressRes.json();

        const progressMap = {};
        (progressData.progress || []).forEach(p => {
          progressMap[p.quest_id] = p;
        });

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
        setLoadError(true);
      }
      setLoading(false);
    }
    loadQuests();
  }, []);

  // Countdown to the shared midnight-UTC reset boundary
  useEffect(() => {
    const t = setInterval(() => setResetIn(timeToDailyReset()), 30000);
    return () => clearInterval(t);
  }, []);

  const rewardParts = (q) => {
    const parts = [];
    if (q.coin_reward > 0) parts.push(`🪙 ${q.coin_reward}`);
    if (q.xp_reward > 0) parts.push(`⚡ ${q.xp_reward} XP`);
    if (q.gem_reward > 0) parts.push(`💎 ${q.gem_reward}`);
    return parts;
  };

  return (
    <div className="qp">
      {/* Top bar: wordmark + currency pills + avatar */}
      <div className="qp-topbar">
        <a className="qp-wordmark" href="/dashboard">MEDVALE</a>
        <div className="qp-topbar-right">
          <div className="qp-currency" aria-label="Currency">
            <span className="qp-currency-item">🪙 {user?.coins ?? 0}</span>
            <span className="qp-currency-divider" aria-hidden="true" />
            <span className="qp-currency-item">💎 {user?.gems ?? 0}</span>
          </div>
          <div className="qp-avatar" title={user?.username || 'Player'}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
              : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="qp-back"
        onClick={() => { window.location.href = '/dashboard'; }}
      >
        ← Back to Dashboard
      </button>

      <div className="qp-col">
        <h1 className="qp-title">Quests</h1>

        <div className="qp-tabs-row">
          <div className="qp-tabs">
            <button
              type="button"
              className={`qp-tab ${tab === 'daily' ? 'qp-tab--active' : ''}`}
              onClick={() => setTab('daily')}
            >
              ⚔️ DAILY
            </button>
            <button
              type="button"
              className={`qp-tab ${tab === 'weekly' ? 'qp-tab--active' : ''}`}
              onClick={() => setTab('weekly')}
            >
              🛡 WEEKLY
            </button>
          </div>
          {tab === 'daily' && (
            <span className="qp-reset">RESETS IN {resetIn}</span>
          )}
        </div>

        {tab === 'daily' && (
          <div className="qp-list">
            {loading && <p className="qp-empty">Loading quests…</p>}
            {!loading && loadError && (
              <p className="qp-empty">Couldn't load quests — check your connection.</p>
            )}
            {!loading && !loadError && quests.length === 0 && (
              <p className="qp-empty">No active quests today. Check back after the reset!</p>
            )}
            {!loading && quests.map((q, i) => {
              const pct = Math.min(100, ((q.current || 0) / (q.target || 1)) * 100);
              const rewards = rewardParts(q);
              return (
                <div className={`qp-quest${q.completed ? ' qp-quest--done' : ''}`} key={q.id || i}>
                  <div className="qp-quest-main">
                    <span className="qp-quest-icon">
                      {q.icon_image
                        ? <img src={q.icon_image} alt="" />
                        : <span>{(q.name || '?')[0].toUpperCase()}</span>}
                    </span>
                    <div className="qp-quest-text">
                      <span className="qp-quest-name">{q.name}</span>
                      {q.description && <span className="qp-quest-desc">{q.description}</span>}
                    </div>
                    <div className="qp-quest-side">
                      {rewards.length > 0 && (
                        <span className="qp-quest-reward">{rewards.join(' · ')}</span>
                      )}
                      {q.completed ? (
                        <span className="qp-claimed">✓ Claimed</span>
                      ) : (
                        <span className="qp-inprogress">In Progress</span>
                      )}
                    </div>
                  </div>
                  <div className="qp-bar">
                    <div
                      className={`qp-bar-fill${q.completed ? ' qp-bar-fill--done' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="qp-bar-label">{q.current || 0} / {q.target || 1}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'weekly' && (
          <div className="qp-soon">
            <span className="qp-soon-icon" aria-hidden="true">🛡</span>
            <h2 className="qp-soon-title">Weekly quests are coming soon!</h2>
            <p className="qp-soon-sub">
              Bigger challenges, bigger rewards. Keep clearing your daily quests in the meantime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
