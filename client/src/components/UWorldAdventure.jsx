import { useState, useEffect, useRef, useCallback } from 'react';
import { getToken, fetchMe, getCachedUser, authFetch } from '../auth';
import SoloGame from './SoloGame';
import './UWorldAdventure.css';

// Slider bounds (mockup) and the fallback pace for a subject with no saved one.
// 15 rather than the mockup's larger number: the real pool is 708 questions
// across four subjects, so a big default would "finish" a subject in days.
const PACE_MIN = 5;
const PACE_MAX = 100;
const PACE_DEFAULT = 15;
const PACE_SAVE_DEBOUNCE_MS = 600;

// Star field for the ambient backdrop — position, size and animation offsets
// straight from the mockup. Static data, so it lives outside the component and
// never re-creates on render.
const UWA_STARS = [
  { top: '12%', left: '20%', '--s': '3px', '--dur': '4s',   '--delay': '0s'   },
  { top: '22%', left: '70%', '--s': '2px', '--dur': '5.5s', '--delay': '0.8s' },
  { top: '60%', left: '82%', '--s': '3px', '--dur': '3.6s', '--delay': '1.4s' },
  { top: '75%', left: '12%', '--s': '2px', '--dur': '4.8s', '--delay': '2.1s' },
  { top: '45%', left: '8%',  '--s': '2px', '--dur': '5s',   '--delay': '0.4s' },
  { top: '85%', left: '55%', '--s': '3px', '--dur': '4.2s', '--delay': '1.8s' },
];

// Fisher-Yates. /api/questions/unseen returns a DETERMINISTIC order (stable
// pagination), so without this every session would play in the same sequence.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Mockup's format: "March 14, 2027".
function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// <input type="date"> wants yyyy-mm-dd in LOCAL time. toISOString() would shift
// the day for anyone west of UTC, so build it from the local parts.
function toInputDate(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Study days from today to a yyyy-mm-dd string, INCLUSIVE of both ends — today
// is day 1, so "finish by tomorrow" is two days of work, not one. That has to
// match the projection's `today + days - 1` or the two directions disagree by a
// day. Floor 1: "finish by today" and any past date both mean one sitting.
function daysUntil(inputDate) {
  const [y, m, d] = inputDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today  = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((target - today) / 86400000) + 1);
}

// The pace endpoint validates 1-200, so a deadline that demands more than that
// cannot be saved — it is reported as out of reach instead of silently clamped.
const PACE_SAVE_MAX = 200;

// The finished size of UWorld Adventure. Upload is still in progress, so the
// live bank is smaller — but a plan is only useful if it covers the whole
// journey, and a player pacing against today's partial bank would be told they
// finish in a week. So PLANNING uses this number while PLAYING uses whatever is
// really there.
//
// Delete this and plan against the real total once the upload is complete; the
// max() below means an over-full bank already ignores it.
const UWA_TARGET_TOTAL = 3659;

// user_prep_pace is keyed (user_id, subject), but the plan this page shows is
// adventure-wide — so the pace is stored ONCE under a reserved key rather than
// per subject. Switching subjects used to load that subject's own saved pace and
// silently move the slider, which read as the page changing your mind for you.
// `subject` has no FK and is validated only as a non-empty string, so a sentinel
// is safe here.
const PACE_SCOPE = '__adventure__';

/**
 * UWorld Adventure — pick a subject, commit to a daily pace, and see honestly
 * how long the remaining question bank will take at that rate.
 *
 * Everything on this page is real: subjects come from the live `active` flag (so
 * a fifth subject appears here the moment it has content, with no code change),
 * counts come from /api/users/:id/question-bank-progress, and a session plays
 * only questions this user has genuinely never seen.
 *
 * There is deliberately NO "Systems" facet — no real data backs one today.
 */
export default function UWorldAdventure() {
  const [user, setUser] = useState(getCachedUser);
  const [subjects, setSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState(false);
  const [selected, setSelected] = useState(null);       // subject id
  const [progress, setProgress] = useState(null);       // selected subject: { total, seen, unseen }
  const [overall, setOverall]   = useState(null);       // every subject, same shape
  const [pace, setPace] = useState(PACE_DEFAULT);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  // Which way round the player is planning: set a daily pace and be told the
  // finish date, or name a finish date and be told the daily pace. Both write to
  // the SAME `pace` state — the deadline input just solves for it — so the two
  // views can never drift apart or disagree about when you finish.
  const [planBy, setPlanBy] = useState('pace');   // 'pace' | 'date'
  const [deadlineWarning, setDeadlineWarning] = useState('');
  // The date the player actually picked. Kept separately from the projection so
  // the field does not snap under them: whole questions per day rarely divide a
  // pool evenly (177 in 31 days is 6/day, which really finishes in 30), so the
  // honest finish date can land a day or two EARLY. That truth belongs in the
  // projection row below, not in the box they just typed in.
  const [pickedDate, setPickedDate] = useState(null);

  // The live session. Held in state and set ONCE per start so the array
  // reference stays stable — SoloGame's fetch effect depends on it.
  const [sessionQuestions, setSessionQuestions] = useState(null);

  const saveTimerRef = useRef(null);
  const paceLoadedRef = useRef(false); // guards the save-on-change effect

  // Same own-identity guard the other authed pages use.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => { if (me) setUser(me); });
  }, []);

  // Live active subjects — never a hardcoded list, so newly activated subjects
  // show up here on their own.
  useEffect(() => {
    let cancelled = false;
    authFetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const active = (data.subjects || []).filter(s => s.active);
        setSubjects(active);
        // Open on the first subject so the pace card is populated on arrival,
        // the way the mockup shows it — an empty card above a subject grid
        // reads as broken. Picking another subject just re-points it.
        setSelected(prev => prev || (active[0]?.id ?? null));
      })
      .catch(() => { if (!cancelled) setSubjectsError(true); });
    return () => { cancelled = true; };
  }, []);

  const loadProgress = useCallback(async (subjectId) => {
    if (!user?.id) return null;
    const res = await authFetch(`/api/users/${user.id}/question-bank-progress?subject=${encodeURIComponent(subjectId)}`);
    return res.json();
  }, [user?.id]);

  // Whole-adventure progress: the same endpoint with NO subject sums every
  // active subject. The pace card plans against this, not the open subject —
  // "when do I finish UWorld Adventure" is a question about all of it.
  const loadOverall = useCallback(async () => {
    if (!user?.id) return null;
    const res = await authFetch(`/api/users/${user.id}/question-bank-progress`);
    return res.json();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadOverall()
      .then(o => { if (!cancelled && o) setOverall(o); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, loadOverall]);

  // The pace is loaded ONCE per visit, not per subject — it belongs to the
  // adventure, so switching subjects must leave the slider exactly where the
  // player put it.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    authFetch(`/api/users/${user.id}/prep-pace?subject=${encodeURIComponent(PACE_SCOPE)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const saved = Number(data?.daily_target);
        if (Number.isFinite(saved) && saved > 0) {
          setPace(Math.min(PACE_SAVE_MAX, Math.max(PACE_MIN, saved)));
        }
        paceLoadedRef.current = true;
      })
      .catch(() => { if (!cancelled) paceLoadedRef.current = true; });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Selecting a subject pulls its real counts. The pace is untouched here.
  useEffect(() => {
    if (!selected || !user?.id) return;
    let cancelled = false;
    setLoadingSubject(true);

    loadProgress(selected)
      .then(prog => { if (!cancelled) setProgress(prog || { total: 0, seen: 0, unseen: 0 }); })
      .catch(() => { if (!cancelled) setProgress({ total: 0, seen: 0, unseen: 0 }); })
      .finally(() => { if (!cancelled) setLoadingSubject(false); });

    return () => { cancelled = true; };
  }, [selected, user?.id, loadProgress]);

  // Persist the pace, debounced — a slider drag fires this once at rest, not per
  // pixel. Skipped until the saved pace has loaded, so the fetched value is
  // never immediately overwritten by its own arrival.
  useEffect(() => {
    if (!paceLoadedRef.current) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      authFetch('/api/prep-pace', {
        method: 'POST',
        body: JSON.stringify({ subject: PACE_SCOPE, daily_target: pace }),
      }).catch(() => {}); // a lost preference must never interrupt the page
    }, PACE_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [pace]);

  async function startSession() {
    if (!selected || starting) return;
    setStarting(true);
    setStartError('');
    try {
      const res = await authFetch(`/api/questions/unseen?subject=${encodeURIComponent(selected)}&limit=${pace}`);
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        setStartError('No unseen questions left for this subject — you have finished the bank.');
        setStarting(false);
        return;
      }
      setSessionQuestions(shuffle(qs)); // set once: stable reference for SoloGame
    } catch {
      setStartError('Could not load your questions. Check your connection and try again.');
    }
    setStarting(false);
  }

  // Game-over side effect. Mirrors handleTrainingComplete: fire-and-forget, and
  // the player's results screen never waits on it.
  function handleComplete({ pct, activeSeconds }) {
    authFetch('/api/question-bank-session', {
      method: 'POST',
      body: JSON.stringify({ subject: selected, pct, seconds: activeSeconds }),
    }).catch(() => {});
  }

  // Leaving the session: back to setup with FRESH counts — the questions just
  // answered are now marked seen, so the remaining pool visibly shrinks.
  function endSession() {
    setSessionQuestions(null);
    if (selected) {
      loadProgress(selected).then(p => { if (p) setProgress(p); }).catch(() => {});
    }
    // The adventure-wide count moved too, so the projection shortens visibly.
    loadOverall().then(o => { if (o) setOverall(o); }).catch(() => {});
  }

  if (sessionQuestions) {
    return (
      <SoloGame
        subject={selected}
        username={user?.username}
        difficulty="easy"
        providedQuestions={sessionQuestions}
        onComplete={handleComplete}
        onBack={endSession}
        levelLabel={`Daily Set · ${subjects.find(s => s.id === selected)?.name || selected}`}
      />
    );
  }

  const activeName = subjects.find(s => s.id === selected)?.name || '';

  // Two different numbers, deliberately kept apart:
  //   unseen  — what the OPEN SUBJECT can actually serve right now. Governs the
  //             Start button and the session. Always real.
  //   planned — the whole adventure at its finished size. Governs the pace
  //             projection and the deadline solver.
  const unseen = progress?.unseen ?? 0;
  // If the bank ever outgrows the target, the target stops mattering.
  const plannedTotal     = Math.max(UWA_TARGET_TOTAL, overall?.total ?? 0);
  const plannedSeen      = Math.min(overall?.seen ?? 0, plannedTotal);
  const plannedRemaining = Math.max(0, plannedTotal - plannedSeen);
  const daysToFinish = plannedRemaining > 0 ? Math.ceil(plannedRemaining / pace) : 0;
  const completionDate = new Date();
  // Day 1 is TODAY, so a one-day plan finishes today — not tomorrow. This also
  // makes the deadline picker round-trip exactly: pick a date, get a pace, and
  // that pace projects back to the date you picked.
  completionDate.setDate(completionDate.getDate() + Math.max(0, daysToFinish - 1));
  const todaysCount = Math.min(pace, unseen);

  return (
    <div className="uwa">
      {/* Ambient backdrop: three drifting blurred blobs + a scatter of twinkling
          stars. Purely decorative — inert to pointers, hidden from assistive
          tech, and clipped by its own layer so the oversized blobs never add a
          scrollbar. Animates transform/opacity only (compositor-friendly), and
          stops entirely under prefers-reduced-motion. */}
      <div className="uwa-decor" aria-hidden="true">
        <span className="uwa-blob uwa-blob--1" />
        <span className="uwa-blob uwa-blob--2" />
        <span className="uwa-blob uwa-blob--3" />
        {UWA_STARS.map((s, i) => (
          <span key={i} className="uwa-star" style={s} />
        ))}
      </div>

      {/* Mockup's top bar is deliberately minimal here — wordmark and avatar
          only, no currency pills. */}
      <div className="uwa-topbar">
        <a className="uwa-wordmark" href="/dashboard">MEDVALE</a>
        <div className="uwa-avatar" title={user?.username || 'Player'}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
            : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
        </div>
      </div>

      <div className="uwa-headrow">
        <button type="button" className="uwa-back" onClick={() => { window.location.href = '/?story=1'; }}>
          ← Back to Story Mode
        </button>
        <h1 className="uwa-title">UWorld Adventure</h1>
        <div />
      </div>

      <div className="uwa-col">
        <p className="uwa-intro">
          A high-yield board-review expedition through the wards of Medvale
          {` — ${plannedTotal.toLocaleString()} questions across every USMLE subject.`}
        </p>

        {/* ── Set Your Pace ─────────────────────────────────────────────── */}
        <div className="uwa-card">
          <div className="uwa-card-title">Set Your Pace</div>
          <div className="uwa-card-sub">
            {planBy === 'pace'
              ? 'How many questions do you want to answer per day?'
              : 'When do you want to finish? We work out the daily pace.'}
          </div>

          <div className="uwa-planby" role="tablist" aria-label="Plan by">
            <button
              type="button" role="tab" aria-selected={planBy === 'pace'}
              className={`uwa-planby-btn ${planBy === 'pace' ? 'on' : ''}`}
              onClick={() => { setPlanBy('pace'); setDeadlineWarning(''); setPickedDate(null); }}
            >Questions per day</button>
            <button
              type="button" role="tab" aria-selected={planBy === 'date'}
              className={`uwa-planby-btn ${planBy === 'date' ? 'on' : ''}`}
              onClick={() => { setPlanBy('date'); setDeadlineWarning(''); setPickedDate(null); }}
            >Finish by a date</button>
          </div>

          {planBy === 'pace' ? (
            <div className="uwa-slider-row">
              <input
                className="uwa-slider"
                type="range"
                min={PACE_MIN}
                max={PACE_MAX}
                step={1}
                value={Math.min(pace, PACE_MAX)}
                onChange={e => { setPace(Number(e.target.value)); setDeadlineWarning(''); }}
                aria-label="Questions per day"
              />
              <div className="uwa-pace-chip">
                <span className="uwa-pace-num">{pace}</span>
                <span className="uwa-pace-unit">questions/day</span>
              </div>
            </div>
          ) : (
            <div className="uwa-slider-row">
              <input
                className="uwa-date"
                type="date"
                min={toInputDate(new Date())}
                value={pickedDate || toInputDate(completionDate)}
                disabled={plannedRemaining === 0}
                onChange={e => {
                  const days = daysUntil(e.target.value);
                  if (!days) return;
                  setPickedDate(e.target.value);
                  const needed = Math.ceil(plannedRemaining / days);
                  if (needed > PACE_SAVE_MAX) {
                    setDeadlineWarning(
                      `That would need ${needed} questions a day. The most you can set is ${PACE_SAVE_MAX}/day — pick a later date.`
                    );
                    setPace(PACE_SAVE_MAX);
                  } else {
                    setDeadlineWarning('');
                    // Floor at PACE_MIN: a very distant date solves to 1/day, and
                    // the projection row then honestly shows the earlier finish.
                    setPace(Math.max(PACE_MIN, needed));
                  }
                }}
                aria-label="Target completion date"
              />
              <div className="uwa-pace-chip">
                <span className="uwa-pace-num">{pace}</span>
                <span className="uwa-pace-unit">questions/day</span>
              </div>
            </div>
          )}
          {deadlineWarning && <p className="uwa-warn">{deadlineWarning}</p>}

          <div className="uwa-projection">
            <div>
              <span className="uwa-proj-label">DAYS TO FINISH</span>
              <span className="uwa-proj-val uwa-proj-val--blue">
                {plannedRemaining > 0 ? `${daysToFinish} ${daysToFinish === 1 ? 'day' : 'days'}` : '—'}
              </span>
            </div>
            <div>
              <span className="uwa-proj-label">ESTIMATED COMPLETION</span>
              <span className="uwa-proj-val">
                {plannedRemaining > 0 ? formatDate(completionDate) : 'Complete'}
              </span>
            </div>
          </div>

          {/* Whole-adventure progress. These MUST describe the same journey the
              projection above does — a "days to finish" computed from 3,659
              sitting over a total of 708 would just look broken. "Already
              answered" is your real count across every subject. */}
          {overall && (
            <>
              <div className="uwa-counts">
                <div>
                  <span className="uwa-proj-label">TOTAL QUESTIONS</span>
                  <span className="uwa-count-val">{plannedTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="uwa-proj-label">ALREADY ANSWERED</span>
                  <span className="uwa-count-val">{plannedSeen.toLocaleString()}</span>
                </div>
                <div>
                  <span className="uwa-proj-label">REMAINING</span>
                  <span className="uwa-count-val uwa-count-val--blue">{plannedRemaining.toLocaleString()}</span>
                </div>
              </div>
              <div
                className="uwa-bar"
                role="img"
                aria-label={`${plannedSeen} of ${plannedTotal} questions answered`}
              >
                <div
                  className="uwa-bar-fill"
                  style={{ width: `${plannedTotal ? (plannedSeen / plannedTotal) * 100 : 0}%` }}
                />
              </div>
              {/* Says plainly why the plan is bigger than what is playable today,
                  so the gap reads as "still uploading" rather than a bug. */}
              {overall.total < plannedTotal && (
                <p className="uwa-note">
                  Planning against the full {plannedTotal.toLocaleString()}-question adventure.
                  {' '}{overall.total.toLocaleString()} are in the bank so far — the rest are still being added.
                </p>
              )}
            </>
          )}

          {startError && <p className="uwa-error">{startError}</p>}

          <button
            type="button"
            className="uwa-start"
            onClick={startSession}
            disabled={starting || loadingSubject || unseen === 0}
            style={{ marginTop: 22 }}
          >
            {/* The count in brackets is what will REALLY be served, which can be
                short of the pace while the bank is still filling — better a
                small honest number than a promise of 80 that delivers 1. */}
            {starting ? 'Loading…'
              : loadingSubject ? 'Loading…'
              : unseen === 0
                ? (overall && overall.total < plannedTotal
                    ? `No ${activeName || 'subject'} questions left yet`
                    : 'Subject Complete')
              : `Start Today's Questions (${todaysCount})`}
          </button>
        </div>

        {/* ── Subjects ──────────────────────────────────────────────────── */}
        <h2 className="uwa-section-title">Subjects</h2>
        {subjectsError && <p className="uwa-empty">Couldn&apos;t load subjects — check your connection.</p>}
        {!subjectsError && subjects.length === 0 && <p className="uwa-empty">Loading subjects…</p>}
        <div className="uwa-subjects">
          {subjects.map(s => (
            <button
              key={s.id}
              type="button"
              className={`uwa-subject${selected === s.id ? ' uwa-subject--active' : ''}`}
              // Picking a subject changes only what TODAY draws from. The plan
              // spans the whole adventure, so the pace and any chosen deadline
              // deliberately survive the switch.
              onClick={() => setSelected(s.id)}
              aria-pressed={selected === s.id}
            >
              {/* Mockup uses the subject's first letter in this badge; the real
                  subjects carry their own icons AND two of the four both start
                  with "B", so the icon goes in the mockup's circle instead. */}
              <span className="uwa-subject-badge" aria-hidden="true">{s.icon || s.name[0]}</span>
              <span className="uwa-subject-name">{s.name}</span>
              {selected === s.id && progress && (
                <span className="uwa-subject-meta">{progress.unseen} left</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
