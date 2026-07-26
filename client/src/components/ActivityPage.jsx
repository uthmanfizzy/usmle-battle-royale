import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getToken, fetchMe, getCachedUser } from '../auth';
import { getMasteryColor } from '../utils/masteryColors';
import './ActivityPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Standalone Daily Activity page: one day of activity_sessions rows, in the
// order they happened. Reads the public
// GET /api/users/:userId/activity-sessions?date=YYYY-MM-DD endpoint, which
// buckets by ended_at in UTC — so the day boundaries here are UTC too, matching
// what the server considers "today".
//
// Coverage note: activity_sessions is populated for the six multiplayer modes,
// Journey and Training Grounds. Plain Solo and AnKing write no session rows at
// all yet, so they can never appear here.

// Mode icons/labels. The five multiplayer entries are the same pairs StatsPage's
// MODE_META uses; pvp_duel, journey and training_grounds extend it with the
// icons those modes already carry elsewhere in the app (⚔️ duel HUD, 🚑 First
// Aid Journey card, 🎯 Training Grounds tile).
const MODE_META = {
  battle_royale:    { icon: '⚔️', label: 'Battle Royale'   },
  speed_race:       { icon: '⚡', label: 'Speed Race'      },
  trivia_pursuit:   { icon: '🎯', label: 'Trivia Pursuit'  },
  buzz_fun:         { icon: '🔔', label: 'Buzz Fun'        },
  scan_master:      { icon: '🔬', label: 'Scan Master'     },
  pvp_duel:         { icon: '🤺', label: 'PvP Duel'        },
  journey:          { icon: '🚑', label: 'First Aid Journey' },
  training_grounds: { icon: '🎯', label: 'Training Grounds'  },
};
const modeMeta = (m) =>
  MODE_META[m] || {
    icon: '🎮',
    label: m ? m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Session',
  };

// Subject display names. Same map StatsPage uses, widened with the journey
// subject ids; anything unmapped falls back to a tidied raw id rather than
// showing nothing.
const SUBJECT_LABELS = {
  all: 'All Subjects',
  cardiology: 'Cardiology', neurology: 'Neurology', pharmacology: 'Pharmacology',
  microbiology: 'Microbiology', biochemistry: 'Biochemistry', biostatistics: 'Biostatistics',
  pathology: 'Pathology', pulmonology: 'Pulmonology', immunology: 'Immunology',
  public_health: 'Public Health Sciences', cardiovascular: 'Cardiovascular',
  endocrine: 'Endocrine', gastrointestinal: 'Gastrointestinal', heme_onc: 'Heme & Onc',
  msk_skin: 'MSK & Skin', neuro_special: 'Neuro & Special Senses', psychiatry: 'Psychiatry',
  renal: 'Renal', reproductive: 'Reproductive', respiratory: 'Respiratory',
  scan_master: 'Image Questions',
};
const subjectLabel = (s) =>
  !s ? null : (SUBJECT_LABELS[s] || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

// "2m 17s" / "45s". ProfileModal's formatStudyTime is hour/minute only, which
// collapses a whole session to "0m", so single sessions need second precision.
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

const todayUTC = () => new Date().toISOString().slice(0, 10);

// Shift a YYYY-MM-DD string by whole days without tripping over local timezones.
function shiftDate(ymd, days) {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

function prettyDate(ymd) {
  const d = new Date(`${ymd}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function clockTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Score colouring reuses the shared mastery gold-ramp so a 78% here reads the
// same tier as a 78% on Progress. Journey/Training scores are percentages of the
// same kind, so the ramp transfers directly.
function SessionOutcome({ s }) {
  if (s.outcome_type === 'win_loss') {
    const win = s.is_win === true;
    return (
      <span className={`da-tag ${win ? 'da-tag--win' : 'da-tag--loss'}`}>
        {win ? 'WIN' : 'LOSS'}
      </span>
    );
  }
  if (s.outcome_type === 'score_pct' && s.score_pct !== null && s.score_pct !== undefined) {
    return (
      <span className="da-score" style={{ color: getMasteryColor(s.score_pct) }}>
        {s.score_pct}%
      </span>
    );
  }
  return <span className="da-tag da-tag--none">—</span>;
}

function SessionRow({ s }) {
  const meta = modeMeta(s.game_mode);
  const subj = subjectLabel(s.subject);

  // Journey carries both names ("chapter → level"); Training Grounds has no
  // chapter concept, so it carries the topic/folder name alone.
  let detail = null;
  if (s.journey_chapter_name && s.journey_level_name) {
    detail = `${s.journey_chapter_name} → ${s.journey_level_name}`;
  } else if (s.journey_level_name) {
    detail = s.journey_level_name;
  }

  return (
    <li className="da-card">
      <span className="da-card-icon" aria-hidden="true">{meta.icon}</span>
      <div className="da-card-main">
        <div className="da-card-head">
          <span className="da-card-mode">{meta.label}</span>
          {subj && <span className="da-card-subject">{subj}</span>}
        </div>
        {detail && <div className="da-card-detail">{detail}</div>}
      </div>
      <div className="da-card-meta">
        <SessionOutcome s={s} />
        <span className="da-card-duration">{formatDuration(s.duration_seconds)}</span>
        <span className="da-card-time">{clockTime(s.started_at || s.ended_at)}</span>
      </div>
    </li>
  );
}

export default function ActivityPage() {
  const { userId: paramId } = useParams();
  const [viewedId, setViewedId] = useState(paramId || null);
  const [me, setMe]             = useState(getCachedUser);
  const [date, setDate]         = useState(todayUTC);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Same own-identity resolution ProgressPage uses: no :userId → my own log;
  // token check, cached user, then fetchMe; guests go back to the landing page.
  useEffect(() => {
    if (paramId) { setViewedId(paramId); return; }
    if (!getToken()) { window.location.href = '/'; return; }
    const cached = getCachedUser();
    if (cached?.id) { setViewedId(cached.id); return; }
    fetchMe().then(user => {
      if (!user?.id) { window.location.href = '/'; return; }
      setViewedId(user.id);
    });
  }, [paramId]);

  // Own header identity (currency pills + avatar) — best effort, chrome only.
  useEffect(() => {
    if (!getToken()) return;
    fetchMe().then(user => { if (user) setMe(user); });
  }, []);

  useEffect(() => {
    if (!viewedId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${SERVER_URL}/api/users/${viewedId}/activity-sessions?date=${date}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setSessions([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [viewedId, date]);

  const isToday = date === todayUTC();
  const isOwn   = !!viewedId && !!me?.id && viewedId === me.id;
  const totalSeconds = sessions.reduce((a, s) => a + (Number(s.duration_seconds) || 0), 0);

  return (
    <div className="da">
      {/* Top bar: wordmark + currency pills + avatar */}
      <div className="da-topbar">
        <a className="da-wordmark" href="/dashboard">MEDVALE</a>
        <div className="da-topbar-right">
          <div className="da-currency" aria-label="Currency">
            <span className="da-currency-item">🪙 {me?.coins ?? 0}</span>
            <span className="da-currency-divider" aria-hidden="true" />
            <span className="da-currency-item">💎 {me?.gems ?? 0}</span>
          </div>
          <div className="da-avatar" title={me?.username || 'Player'}>
            {me?.avatar_url
              ? <img src={me.avatar_url} alt={me.username} referrerPolicy="no-referrer" />
              : <span>{me?.username?.[0]?.toUpperCase() || '?'}</span>}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="da-back"
        onClick={() => { window.location.href = '/dashboard'; }}
      >
        ← Back to Dashboard
      </button>

      <div className="da-col">
        <h1 className="da-title">Daily Activity</h1>
        {!isOwn && <p className="da-sub">Viewing another player&apos;s activity</p>}

        {/* Day navigation — Next Day is disabled on the current UTC date so the
            log can never be scrolled into the future (StudyCalendar convention). */}
        <div className="da-daynav">
          <button
            type="button"
            className="da-daynav-btn"
            onClick={() => setDate(d => shiftDate(d, -1))}
          >
            ← Previous Day
          </button>
          <div className="da-daynav-label">
            <span className="da-daynav-day">{isToday ? 'Today' : prettyDate(date)}</span>
            {isToday && <span className="da-daynav-date">{prettyDate(date)}</span>}
          </div>
          <button
            type="button"
            className="da-daynav-btn"
            onClick={() => setDate(d => shiftDate(d, 1))}
            disabled={isToday}
            aria-disabled={isToday}
            title={isToday ? 'No activity beyond today' : undefined}
          >
            Next Day →
          </button>
        </div>

        {loading ? (
          <div className="da-empty">
            <div className="da-load-ring" />
            <p className="da-empty-text">Loading activity…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="da-empty">
            <span className="da-empty-icon" aria-hidden="true">🗓️</span>
            <p className="da-empty-text">No activity recorded on this day.</p>
            <p className="da-empty-hint">
              Games, Journey levels and Training Grounds runs show up here once played.
            </p>
          </div>
        ) : (
          <>
            <div className="da-summary">
              <span className="da-summary-item">
                <strong>{sessions.length}</strong> session{sessions.length === 1 ? '' : 's'}
              </span>
              <span className="da-summary-divider" aria-hidden="true" />
              <span className="da-summary-item">
                <strong>{formatDuration(totalSeconds)}</strong> active
              </span>
            </div>
            <ul className="da-list">
              {sessions.map((s, i) => <SessionRow key={s.id || i} s={s} />)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
