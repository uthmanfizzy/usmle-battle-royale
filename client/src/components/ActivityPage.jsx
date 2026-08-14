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
  // The three study-only writers. They emit activity_sessions rows too, so
  // without these they'd fall through to the generic 🎮 "Hy Flashcards" title.
  anking:                 { icon: '🃏', label: 'AnKing Flashcards' },
  hy_flashcards:          { icon: '⭐', label: 'HY Flashcards'     },
  question_bank_practice: { icon: '📚', label: 'UWorld Adventure'  },
  solo:                   { icon: '🧠', label: 'Solo Practice'     },
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

const clockMs = (ms) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

// "1h 25m" / "40m". Breaks are hours-scale, so formatDuration's minutes-only
// output ("145m") would be unreadable here.
function formatGap(totalSeconds) {
  const mins = Math.max(0, Math.round(totalSeconds / 60));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Anything under this between two sessions is just the pause between clicking
// "next" — not a break worth drawing a block for.
const GAP_MIN_MS = 10 * 60 * 1000;

/**
 * Turn a flat session list into an ordered timeline of session + gap entries.
 *
 * Sessions are ordered by START, not ended_at (which is how the server sorts
 * them) — a long session begun at 1pm should sit above a short one begun at
 * 2pm even if they finish in the other order. started_at is derived
 * (ended_at - duration) for some writers, so it's reconstructed here when absent.
 *
 * Gaps use a running `cursor` of "latest end seen so far" rather than the
 * previous session's end, so an overlapping or fully-nested session can't
 * manufacture a negative or phantom gap.
 */
function buildTimeline(sessions) {
  const norm = [];
  for (const s of sessions) {
    const end = Date.parse(s.ended_at);
    if (!Number.isFinite(end)) continue;
    const durMs = (Number(s.duration_seconds) || 0) * 1000;
    const parsedStart = s.started_at ? Date.parse(s.started_at) : NaN;
    const start = Number.isFinite(parsedStart) ? parsedStart : end - durMs;
    norm.push({ s, start, end: Math.max(start, end) });
  }
  norm.sort((a, b) => a.start - b.start || a.end - b.end);

  const items = [];
  let cursor = null;
  for (const x of norm) {
    if (cursor !== null && x.start - cursor >= GAP_MIN_MS) {
      items.push({
        type: 'gap',
        key: `gap-${cursor}`,
        gapStart: new Date(cursor).toISOString(), // note key — see server comment
        start: cursor,
        end: x.start,
        seconds: Math.round((x.start - cursor) / 1000),
      });
    }
    items.push({ type: 'session', key: x.s.id || `s-${x.start}`, ...x });
    cursor = cursor === null ? x.end : Math.max(cursor, x.end);
  }
  return items;
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

function SessionRow({ item }) {
  const { s, start, end } = item;
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
    <li className="da-item da-item--session">
      <div className="da-rail" aria-hidden="true">
        <span className="da-rail-dot" />
      </div>
      <div className="da-item-body">
        <span className="da-when">{clockMs(start)} – {clockMs(end)}</span>
        <div className="da-card">
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
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * A break between two sessions. When you're looking at your OWN timeline it
 * doubles as a note field — "why wasn't I studying here" — which is the whole
 * point of surfacing gaps rather than just closing them up. On someone else's
 * timeline it renders as a plain gap: notes are private to their author.
 */
function GapRow({ item, editable, note, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(note || '');
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState(false);

  // A note arriving from the server after mount (the notes fetch resolves
  // independently of the sessions fetch) must not clobber an open draft.
  useEffect(() => { if (!editing) setDraft(note || ''); }, [note, editing]);

  async function commit() {
    setSaving(true);
    setError(false);
    const ok = await onSave(item.gapStart, draft.trim());
    setSaving(false);
    // On failure, stay in editing mode with the draft intact — closing here
    // would silently discard what they typed, which is the exact bug this
    // is fixing.
    if (ok) setEditing(false);
    else setError(true);
  }

  return (
    <li className="da-item da-item--gap">
      <div className="da-rail" aria-hidden="true">
        <span className="da-rail-gap" />
      </div>
      <div className="da-item-body">
        <span className="da-when da-when--gap">{clockMs(item.start)} – {clockMs(item.end)}</span>
        <div className="da-gap">
          <div className="da-gap-head">
            <span className="da-gap-icon" aria-hidden="true">☕</span>
            <span className="da-gap-len">{formatGap(item.seconds)} break</span>
          </div>

          {editing ? (
            <div className="da-note-edit">
              <textarea
                className="da-note-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="What were you doing? e.g. work shift, lectures, rest day…"
                maxLength={500}
                rows={2}
                autoFocus
              />
              <div className="da-note-actions">
                <button type="button" className="da-note-btn da-note-btn--save" onClick={commit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="da-note-btn"
                  onClick={() => { setDraft(note || ''); setEditing(false); setError(false); }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
              {error && <p className="da-note-error">Couldn&apos;t save — check your connection and try again.</p>}
            </div>
          ) : note ? (
            <button
              type="button"
              className={`da-note${editable ? '' : ' da-note--ro'}`}
              onClick={() => editable && setEditing(true)}
              disabled={!editable}
              title={editable ? 'Edit this note' : undefined}
            >
              <span className="da-note-text">{note}</span>
              {editable && <span className="da-note-pencil" aria-hidden="true">✎</span>}
            </button>
          ) : editable ? (
            <button type="button" className="da-note-add" onClick={() => setEditing(true)}>
              ＋ Add a reason
            </button>
          ) : null}
        </div>
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
  const [notes, setNotes]       = useState({});   // gap_start ISO -> note

  const isOwn = !!viewedId && !!me?.id && viewedId === me.id;

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

  // Gap notes are owner-only on the server, so there's nothing to fetch when
  // viewing someone else — skipping the call keeps the page working for guests.
  useEffect(() => {
    if (!isOwn) { setNotes({}); return; }
    const token = getToken();
    if (!token) { setNotes({}); return; }
    let cancelled = false;
    fetch(`${SERVER_URL}/api/activity/gap-notes?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setNotes(d?.notes || {}); })
      .catch(() => { if (!cancelled) setNotes({}); });
    return () => { cancelled = true; };
  }, [isOwn, date]);

  // Confirm-then-reflect, NOT optimistic: local `notes` state only updates
  // once the server has actually accepted the write. The previous optimistic
  // version updated local state immediately and never checked the response —
  // a failed write (e.g. the activity_gap_notes migration not having been run
  // yet) still showed the note as saved, right up until the next reload
  // silently dropped it. Returns true/false so GapRow can keep its editor
  // open (draft intact) and show an error on failure, instead of closing on
  // a save that never actually happened.
  async function saveNote(gapStart, text) {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch(`${SERVER_URL}/api/activity/gap-notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gap_start: gapStart, note: text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return false;
      setNotes(prev => {
        const next = { ...prev };
        if (text) next[gapStart] = text;
        else delete next[gapStart];
        return next;
      });
      return true;
    } catch {
      return false;
    }
  }

  const isToday = date === todayUTC();
  const totalSeconds = sessions.reduce((a, s) => a + (Number(s.duration_seconds) || 0), 0);
  const timeline = buildTimeline(sessions);
  const breaks = timeline.filter(i => i.type === 'gap');
  const breakSeconds = breaks.reduce((a, g) => a + g.seconds, 0);

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
              Games, Journey levels, Training Grounds runs and flashcard sessions
              show up here once played.
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
              {breaks.length > 0 && (
                <>
                  <span className="da-summary-divider" aria-hidden="true" />
                  <span className="da-summary-item">
                    <strong>{breaks.length}</strong> break{breaks.length === 1 ? '' : 's'} ({formatGap(breakSeconds)})
                  </span>
                </>
              )}
            </div>

            <ul className="da-timeline">
              {timeline.map(item =>
                item.type === 'gap' ? (
                  <GapRow
                    key={item.key}
                    item={item}
                    editable={isOwn}
                    note={notes[item.gapStart] || ''}
                    onSave={saveNote}
                  />
                ) : (
                  <SessionRow key={item.key} item={item} />
                )
              )}
              <li className="da-item da-item--end">
                <div className="da-rail" aria-hidden="true"><span className="da-rail-cap" /></div>
                <span className="da-end-label">End of day</span>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
