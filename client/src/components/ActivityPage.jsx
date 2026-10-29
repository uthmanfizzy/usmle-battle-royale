import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getToken, fetchMe, getCachedUser } from '../auth';
import { getMasteryColor } from '../utils/masteryColors';
import { QUESTION_BANK_MODES } from '../questionBankModes';
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
  saudi_mle_practice:     { icon: '📗', label: 'Saudi MLE'         },
  ore_lds_practice:       { icon: '🦷', label: 'ORE / LDS'         },
  mehlman_rapid_fire_practice: { icon: '⚡', label: 'Mehlman Rapid Fire' },
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

// "1 hour and 10 minutes" / "45 minutes" / "30 seconds", for the day's total.
// formatDuration above stays as it is: it labels each session on its own card,
// where there is room for a badge and not for a sentence. A whole day runs to
// hours, and "70m" makes the reader do the division.
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function formatLongDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (s < 60) return plural(s, 'second');
  const mins = Math.floor(s / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return plural(m, 'minute');
  // A whole number of hours says so, rather than trailing "and 0 minutes".
  if (m === 0) return plural(h, 'hour');
  return `${plural(h, 'hour')} and ${plural(m, 'minute')}`;
}

// Which question banks exist, and what each one logs its sessions under.
// Read from the modes config rather than listed here, so a new bank gets its
// own line on this page for free — the way Mehlman Rapid Fire just did.
const BANK_SUMMARY_MODES = QUESTION_BANK_MODES.map(m => ({
  mode: m.activityMode, label: m.label, icon: m.icon,
}));

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

/**
 * How the day's breaks sat against the work around them.
 *
 * Each break is judged against the study immediately BEFORE it, not against
 * the day's total: ten minutes of work followed by an hour off is the thing
 * worth noticing, and a day-wide average would bury it under a good morning.
 * The study block is active seconds — the time actually spent answering —
 * while the break is wall-clock, which is the honest pairing: what was
 * earned against what was taken.
 *
 * The thresholds are a rule of thumb, not a finding. A break up to three
 * times the block before it is treated as earned; up to five is long; past
 * that the rest outweighs the work by enough to be worth saying out loud.
 * They are named rather than buried in the comparisons, so changing one's
 * mind about them is a one-line job.
 */
const BREAK_EARNED_RATIO    = 3;  // a break up to 3x the study before it
const BREAK_STRETCHED_RATIO = 5;  // ... and past this it is out of proportion

function breakGrade(breakSeconds, studyBefore) {
  // A break with no study in front of it cannot be judged against anything.
  if (!(studyBefore > 0)) return null;
  const ratio = breakSeconds / studyBefore;
  if (ratio <= BREAK_EARNED_RATIO) return 'earned';
  if (ratio <= BREAK_STRETCHED_RATIO) return 'long';
  return 'over';
}

function analyseBalance(timeline) {
  const breaks = [];
  let block = 0;  // active seconds studied since the last break
  for (const it of timeline) {
    if (it.type === 'session') {
      block += Number(it.s.duration_seconds) || 0;
    } else {
      breaks.push({
        key: it.key,
        seconds: it.seconds,
        studyBefore: block,
        grade: breakGrade(it.seconds, block),
      });
      block = 0;
    }
  }

  const judged = breaks.filter(b => b.grade);
  if (judged.length === 0) return { verdict: null, breaks };

  const over = judged.filter(b => b.grade === 'over').length;
  const long = judged.filter(b => b.grade === 'long').length;

  // One break out of proportion among several is worth a nudge, not a
  // verdict; most of them being so is the pattern.
  const verdict = (over === 0 && long === 0) ? 'good'
    : (over / judged.length > 0.5) ? 'poor'
    : 'moderate';

  // The clearest single example, so the reading can be checked against the
  // timeline rather than merely asserted.
  const worst = [...judged].sort(
    (a, b) => (b.seconds / b.studyBefore) - (a.seconds / a.studyBefore))[0];

  return { verdict, breaks, judged: judged.length, over, long, worst };
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
            {/* How much work the session actually was. A run that was left
              early says what it got through, which a percentage alone does
              not — 80% of five questions and 80% of forty are not the same
              afternoon. Absent on rows written before the count existed,
              which say nothing rather than claiming zero. */}
          {s.questions_answered > 0 && (
            <span className="da-card-questions">
              {s.questions_answered} question{s.questions_answered === 1 ? '' : 's'}
            </span>
          )}
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
function GapRow({ item, editable, note, onSave, grade }) {
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
            {/* What this particular break followed. The verdict at the top of
                the day is made of these, so each one says its own working. */}
            {grade && (
              <span className={`da-gap-grade da-gap-grade--${grade.grade}`}>
                after {formatDuration(grade.studyBefore)} of study
              </span>
            )}
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
  // ?date=YYYY-MM-DD opens straight onto that day — how the study calendar
  // hands off when a tile is clicked. Validated rather than trusted: anything
  // that is not a plain date falls back to today, so a hand-edited URL cannot
  // put the page into a state its own controls could not reach.
  const [date, setDate]         = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('date');
      if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
        // Round-trip, not just Date.parse: an impossible date like 2026-02-30
        // parses fine and silently ROLLS OVER to March 2, which would show the
        // wrong day under a date that does not exist.
        const d = new Date(`${q}T00:00:00Z`);
        if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === q) return q;
      }
    } catch { /* no URL access — fall through to today */ }
    return todayUTC();
  });
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

  // Journey levels finished today. Counted by level, not by session: a level
  // replayed after it was already passed is the same level, and the day's
  // summary should not read as two. A row with no level name falls back to
  // its own id so it still counts once rather than collapsing every unnamed
  // level into one. journey_passed is the server's call, made against the
  // configured pass threshold.
  const journeySessions = sessions.filter(s => s.game_mode === 'journey');
  const journeyLevelsDone = new Set(
    journeySessions
      .filter(s => s.journey_passed)
      .map(s => s.journey_level_name
        ? `${s.journey_chapter_name || ''}|${s.journey_level_name}`
        : `id:${s.id}`),
  ).size;
  // Each question bank played today, with its own time and its own question
  // count. UWorld Adventure is the one that prompted this, but the banks are
  // one family running on one machine, so a day that mixed two of them gets a
  // line for each rather than one figure that silently merges them.
  //
  // questions_answered is NULL on every session recorded before the column
  // existed, and summing those as zero would quietly understate the day. So
  // only sessions that actually carry a count are added up, and the line says
  // how many it could see when that is not all of them.
  const bankSummaries = BANK_SUMMARY_MODES.map(({ mode, label, icon }) => {
    const rows = sessions.filter(s => s.game_mode === mode);
    if (!rows.length) return null;
    const counted = rows.filter(s => Number(s.questions_answered) > 0);
    return {
      mode, label, icon,
      seconds: rows.reduce((a, s) => a + (Number(s.duration_seconds) || 0), 0),
      questions: counted.reduce((a, s) => a + Number(s.questions_answered), 0),
      counted: counted.length,
      total: rows.length,
    };
  }).filter(Boolean);

  const timeline = buildTimeline(sessions);
  const breaks = timeline.filter(i => i.type === 'gap');
  const balance = analyseBalance(timeline);
  const gradeByGap = new Map(balance.breaks.map(b => [b.key, b]));
  const breakSeconds = breaks.reduce((a, g) => a + g.seconds, 0);

  return (
    <div className="da">
      {/* Top bar: wordmark + avatar (coins/gems are shown on the Shop page only) */}
      <div className="da-topbar">
        <a className="da-wordmark" href="/dashboard">MEDVALE</a>
        <div className="da-topbar-right">
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
        ← Back
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
                <strong>{formatLongDuration(totalSeconds)}</strong> active
              </span>
              {/* Only on a day the Journey was actually played — on every
                  other day a "0 levels" reading would say nothing. */}
              {journeySessions.length > 0 && (
                <>
                  <span className="da-summary-divider" aria-hidden="true" />
                  <span className="da-summary-item">
                    <strong>{journeyLevelsDone}</strong> Journey level{journeyLevelsDone === 1 ? '' : 's'} completed
                  </span>
                </>
              )}
              {breaks.length > 0 && (
                <>
                  <span className="da-summary-divider" aria-hidden="true" />
                  <span className="da-summary-item">
                    <strong>{breaks.length}</strong> break{breaks.length === 1 ? '' : 's'} ({formatGap(breakSeconds)})
                  </span>
                </>
              )}
            </div>

            {/* A line per question bank played today. Its own band rather
                than more chips in the strip above: those are the whole day's
                totals, and "42 questions" sitting beside them would read as
                the day's, not the bank's. */}
            {bankSummaries.length > 0 && (
              <div className="da-banks">
                {bankSummaries.map(b => (
                  <div className="da-bank" key={b.mode}>
                    <span className="da-bank-name">
                      <span aria-hidden="true">{b.icon}</span> {b.label}
                    </span>
                    <span className="da-bank-stat">
                      <strong>{formatLongDuration(b.seconds)}</strong> active
                    </span>
                    {/* Omitted entirely when nothing could be counted — a
                        "0 questions" reading on a day plainly spent in the
                        bank is worse than saying nothing. */}
                    {b.counted > 0 && (
                      <span className="da-bank-stat">
                        <strong>{b.questions}</strong> question{b.questions === 1 ? '' : 's'}
                        {b.counted < b.total && (
                          <span className="da-bank-note">
                            {' '}· counted from {b.counted} of {b.total} session{b.total === 1 ? '' : 's'}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {balance.verdict && (
              <div className={`da-balance da-balance--${balance.verdict}`}>
                <span className="da-balance-chip">
                  {balance.verdict === 'good' ? 'Good balance'
                    : balance.verdict === 'moderate' ? 'Moderate balance'
                    : 'Off balance'}
                </span>
                <span className="da-balance-text">
                  {balance.verdict === 'good'
                    ? 'Every break was in proportion to the study before it.'
                    : `${balance.over + balance.long} of ${balance.judged} break${balance.judged === 1 ? '' : 's'} ran long for the work before ${balance.judged === 1 ? 'it' : 'them'} — after ${formatDuration(balance.worst.studyBefore)} of study you took ${formatGap(balance.worst.seconds)} off.`}
                </span>
              </div>
            )}

            <ul className="da-timeline">
              {timeline.map(item =>
                item.type === 'gap' ? (
                  <GapRow
                    key={item.key}
                    item={item}
                    editable={isOwn}
                    note={notes[item.gapStart] || ''}
                    onSave={saveNote}
                    grade={gradeByGap.get(item.key) || null}
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
