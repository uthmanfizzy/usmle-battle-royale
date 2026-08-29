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

// "Review Rated Questions" pile picker — same five self-assessment buckets
// SoloGame's rating row writes (see UWORLD_RATINGS there and server-side),
// plus two synthetic piles the server's by-rating endpoint also understands:
// 'all' (every UWorld question this user has ever been served) and 'unrated'
// (served, never rated). Order here is render order.
const UWORLD_RATING_PILES = [
  { key: 'all',               label: 'Study All',       icon: '📚' },
  { key: 'knowledge_gap',     label: 'Knowledge Gap',    icon: '🧠' },
  { key: 'careless_miss',     label: 'Careless Miss',    icon: '😅' },
  { key: 'lucky_guess',       label: 'Lucky Guess',      icon: '🍀' },
  { key: 'somewhat_know',     label: 'Somewhat Know',    icon: '🤔' },
  { key: 'fully_understood',  label: 'Fully Understood', icon: '✅' },
  { key: 'unrated',           label: 'Not Yet Rated',    icon: '⬜' },
];
// A review pull is capped the same as any other session request — see
// UNSEEN_MAX_LIMIT server-side.
const UWORLD_REVIEW_LIMIT = 100;

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
  // Which system's option menu is open (subject id), or null. Opening it is
  // what clicking a subject does.
  const [systemModal, setSystemModal] = useState(null);
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

  // Question order for a block: 'random' (the long-standing behaviour, kept as
  // the default) or 'sequential' — /api/questions/unseen's own deterministic
  // pagination order. Stored per-user in localStorage like Journey's own order
  // toggle, so it sticks between visits.
  const [questionOrder, setQuestionOrder] = useState(() => {
    try { return localStorage.getItem('mr_uwa_q_order') === 'sequential' ? 'sequential' : 'random'; }
    catch { return 'random'; }
  });
  function chooseQuestionOrder(v) {
    setQuestionOrder(v);
    try { localStorage.setItem('mr_uwa_q_order', v); } catch {}
  }

  // The live session. Held in state and set ONCE per start so the array
  // reference stays stable — SoloGame's fetch effect depends on it.
  const [sessionQuestions, setSessionQuestions] = useState(null);
  // Set alongside sessionQuestions when the current session came from a
  // rating-group pile rather than "Start Today's Questions" — tells SoloGame
  // to skip seen-tracking (uwaReview) and changes the level label / End
  // Block copy so a review reads as one, not a fresh daily block.
  const [reviewSession, setReviewSession] = useState(false);
  const [reviewLabel,   setReviewLabel]   = useState('');
  const [reviewLoading, setReviewLoading] = useState(null); // pile key currently loading, or null
  const [reviewError,   setReviewError]   = useState('');
  // { total, unrated, knowledge_gap, careless_miss, lucky_guess, somewhat_know,
  // fully_understood } — counts for the "Review Rated Questions" pile list.
  const [ratingCounts, setRatingCounts] = useState(null);

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
  // "when do I finish UWorld Adventure" is a question about all of it. Also
  // carries the client's own local date + zone offset, so `done_today` (how
  // much of today's pace is already spent) is bucketed by the player's own
  // calendar day rather than server UTC — same convention AnKing's daily new-
  // card allowance uses.
  const loadOverall = useCallback(async () => {
    if (!user?.id) return null;
    const now = new Date();
    const params = new URLSearchParams({
      local_date: now.toLocaleDateString('en-CA'),
      tz_offset:  String(now.getTimezoneOffset()),
    });
    const res = await authFetch(`/api/users/${user.id}/question-bank-progress?${params}`);
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

  // Rating-pile counts for "Review Rated Questions" — scoped to the OPEN
  // SUBJECT. Revision is per system: a pile mixing biochemistry with
  // pulmonology is not a session anyone would choose to sit. (The pace above
  // stays adventure-wide; that one genuinely is a whole-adventure number.)
  const loadRatingCounts = useCallback(async (subjectId) => {
    if (!user?.id || !subjectId) return null;
    const res = await authFetch(`/api/uworld-questions/rating-counts?subject=${encodeURIComponent(subjectId)}`);
    return res.json();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selected) { setRatingCounts(null); return; }
    let cancelled = false;
    // Clear FIRST. Without this the counts linger from the previously opened
    // system until the new fetch lands, so tapping a system with one question
    // right after a system with forty-four showed "44 questions" — the piles
    // are disabled while null, so this also stops anyone launching a pile
    // against another system's numbers.
    setRatingCounts(null);
    loadRatingCounts(selected)
      .then(c => { if (!cancelled && c) setRatingCounts(c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, selected, loadRatingCounts]);

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

  // Adventure-wide, not per-subject — the pace itself is adventure-wide (see
  // PACE_SCOPE), so finishing 20 of an 80/day goal in Anatomy this morning must
  // leave only 60 owed this afternoon, in Pharmacology or anywhere else. Once
  // the day's goal is met, a block reverts to serving a full `pace` again
  // rather than refusing to start — the goal is a target, not a lockout.
  const doneToday      = overall?.done_today ?? 0;
  const remainingToday = Math.max(0, pace - doneToday);
  const blockSize      = remainingToday > 0 ? remainingToday : pace;

  // Whole-adventure projection — computed here (not just below, alongside the
  // setup page) because the End Block confirm dialog needs it too, and that
  // dialog renders from the early `sessionQuestions` return below.
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

  async function startSession() {
    if (!selected || starting) return;
    setStarting(true);
    setStartError('');
    try {
      const res = await authFetch(`/api/questions/unseen?subject=${encodeURIComponent(selected)}&limit=${blockSize}`);
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        setStartError('No unseen questions left for this subject — you have finished the bank.');
        setStarting(false);
        return;
      }
      setReviewSession(false);
      // set once: stable reference for SoloGame
      setSessionQuestions(questionOrder === 'random' ? shuffle(qs) : qs);
    } catch {
      setStartError('Could not load your questions. Check your connection and try again.');
    }
    setStarting(false);
  }

  // Rating-group review: pulls up to UWORLD_REVIEW_LIMIT questions from one
  // pile and plays them through the SAME exam skin, minus its consequences —
  // SoloGame's uwaReview prop skips postQuestionSeen entirely for this
  // session, so nothing here can move the 3,659-question total or the daily
  // pace either way, no matter how many times a pile is replayed.
  async function startReview(ratingKey, label) {
    if (reviewLoading) return;
    setReviewLoading(ratingKey);
    setReviewError('');
    try {
      // Always subject-scoped — the piles are per system, so the questions
      // pulled for one must be too.
      const res = await authFetch(
        `/api/uworld-questions/by-rating?rating=${encodeURIComponent(ratingKey)}` +
        `&subject=${encodeURIComponent(selected)}&limit=${UWORLD_REVIEW_LIMIT}`
      );
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        setReviewError('No questions in this group yet.');
        setReviewLoading(null);
        return;
      }
      setSystemModal(null);   // the session replaces the view; don't leave it queued to reopen
      setReviewLabel(label);
      setReviewSession(true);
      setSessionQuestions(shuffle(qs)); // set once: stable reference for SoloGame
    } catch {
      setReviewError('Could not load these questions. Check your connection and try again.');
    }
    setReviewLoading(null);
  }

  // Game-over side effect. Mirrors handleTrainingComplete: fire-and-forget, and
  // the player's results screen never waits on it. Fires for review sessions
  // too (still worth an activity_sessions row so a review shows up in Daily
  // Activity) — it's only the SEEN-tracking that a review skips.
  function handleComplete({ pct, activeSeconds }) {
    authFetch('/api/question-bank-session', {
      method: 'POST',
      body: JSON.stringify({ subject: selected, pct, seconds: activeSeconds }),
    }).catch(() => {});
  }

  // Leaving the session: back to setup with FRESH counts — the questions just
  // answered are now marked seen (unless this was a review), so the remaining
  // pool and the rating piles both visibly update.
  function endSession() {
    setSessionQuestions(null);
    setReviewSession(false);
    if (selected) {
      loadProgress(selected).then(p => { if (p) setProgress(p); }).catch(() => {});
    }
    // The adventure-wide count moved too, so the projection shortens visibly.
    loadOverall().then(o => { if (o) setOverall(o); }).catch(() => {});
    loadRatingCounts().then(c => { if (c) setRatingCounts(c); }).catch(() => {});
  }

  if (sessionQuestions) {
    return (
      <SoloGame
        subject={selected}
        username={user?.username}
        difficulty="easy"
        providedQuestions={sessionQuestions}
        uworldSkin
        uwaReview={reviewSession}
        onComplete={handleComplete}
        onBack={endSession}
        levelLabel={reviewSession ? `Review · ${reviewLabel}` : `Daily Set · ${subjects.find(s => s.id === selected)?.name || selected}`}
        // End Block's own confirm dialog needs to say "you'll have N left
        // today, to finish by <date>" — SoloGame has no idea about the
        // adventure-wide pace/projection, so it's handed down as of this
        // block's start. SoloGame subtracts its own live answered-count from
        // uwaRemainingToday to keep the number accurate as the block plays.
        // Ignored entirely when uwaReview is set (SoloGame shows a different
        // message there instead — a review never touches either number).
        uwaRemainingToday={remainingToday}
        uwaCompletionLabel={plannedRemaining > 0 ? formatDate(completionDate) : null}
      />
    );
  }

  // Esc closes the system menu, like any other dialog.
  useEffect(() => {
    if (!systemModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setSystemModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [systemModal]);

  const activeName = subjects.find(s => s.id === selected)?.name || '';

  // Two different numbers, deliberately kept apart:
  //   unseen  — what the OPEN SUBJECT can actually serve right now. Governs the
  //             Start button and the session. Always real.
  //   planned — the whole adventure at its finished size. Governs the pace
  //             projection and the deadline solver.
  const unseen = progress?.unseen ?? 0;
  const todaysCount = Math.min(blockSize, unseen);
  const goalMetToday = doneToday > 0 && remainingToday === 0;

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

              {/* Today's slice of the daily pace — resets at the player's own
                  midnight (see done_today on question-bank-progress). A block
                  started later today is capped at what's still owed, not a
                  fresh `pace`, so ending a block early and coming back finishes
                  the day rather than restarting it. */}
              <div className="uwa-counts" style={{ marginTop: 20 }}>
                <div>
                  <span className="uwa-proj-label">TODAY'S PROGRESS</span>
                  <span className="uwa-count-val">{Math.min(doneToday, pace)} / {pace}</span>
                </div>
              </div>
              <div
                className="uwa-bar"
                role="img"
                aria-label={`${doneToday} of ${pace} questions answered today`}
              >
                <div
                  className="uwa-bar-fill"
                  style={{ width: `${pace ? Math.min(100, (doneToday / pace) * 100) : 0}%` }}
                />
              </div>
              {goalMetToday && (
                <p className="uwa-note">🎉 Today's goal is complete — starting another block goes beyond it.</p>
              )}
            </>
          )}

          {/* Question order for the block about to start. 'Random' is the
              long-standing default; 'In order' plays the server's own stable
              pagination order, unshuffled. */}
          <div className="uwa-planby" role="tablist" aria-label="Question order" style={{ marginTop: 18 }}>
            <button
              type="button" role="tab" aria-selected={questionOrder === 'random'}
              className={`uwa-planby-btn ${questionOrder === 'random' ? 'on' : ''}`}
              onClick={() => chooseQuestionOrder('random')}
            >🎲 Random</button>
            <button
              type="button" role="tab" aria-selected={questionOrder === 'sequential'}
              className={`uwa-planby-btn ${questionOrder === 'sequential' ? 'on' : ''}`}
              onClick={() => chooseQuestionOrder('sequential')}
            >📖 In Order</button>
          </div>

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
              : goalMetToday
                ? `🎉 Keep Going Beyond Today's Goal (${todaysCount})`
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
              // Selecting also opens the system's own menu: today's set, a
              // full redo, and the rating piles are all one decision about
              // this system, so they belong on one surface rather than
              // scattered up and down the page.
              onClick={() => { setSelected(s.id); setSystemModal(s.id); setReviewError(''); }}
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

        <p className="uwa-intro" style={{ marginTop: 10 }}>
          Pick a system to choose what to play — today&apos;s set, a full redo, or a
          group you&apos;ve already rated.
        </p>
      </div>

      {/* ── One system's options ─────────────────────────────────────────────
          Everything you can do with a system on one surface: today's set, a
          full redo, and the rating piles. Only the daily set advances the
          {plannedTotal}-question total and today's pace — every review route
          runs through SoloGame's uwaReview, which skips seen-tracking, so it
          can be replayed as often as it is useful. */}
      {systemModal && (
        <div
          className="uwa-modal-overlay"
          onClick={() => setSystemModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeName || 'System'} options`}
        >
          <div className="uwa-modal" onClick={e => e.stopPropagation()}>
            <div className="uwa-modal-head">
              <h3 className="uwa-modal-title">{activeName || 'System'}</h3>
              <button
                type="button"
                className="uwa-modal-close"
                onClick={() => setSystemModal(null)}
                aria-label="Close"
              >✕</button>
            </div>

            {reviewError && <p className="uwa-error">{reviewError}</p>}
            {startError && <p className="uwa-error">{startError}</p>}

            {/* Today's set — the only route that counts toward the plan, so it
                leads and is visually separated from the review routes. */}
            <button
              type="button"
              className="uwa-pile uwa-pile--today"
              onClick={() => { setSystemModal(null); startSession(); }}
              disabled={starting || loadingSubject || unseen === 0}
            >
              <span className="uwa-pile-name">▶ Today&apos;s Questions</span>
              <span className="uwa-pile-sub">
                {starting || loadingSubject ? 'Loading…'
                  : unseen === 0 ? 'System complete'
                  : `${todaysCount} question${todaysCount === 1 ? '' : 's'} · counts toward your plan`}
              </span>
            </button>

            <p className="uwa-modal-sub">
              Or revisit — none of these count toward the plan or today&apos;s pace:
            </p>

            <div className="uwa-pile-list">
              {/* Redo replays the ENTIRE system, seen or not, rather than
                  revisiting only what has already been answered. */}
              {(() => {
                const systemCount = ratingCounts?.system_total ?? 0;
                const loadingThis = reviewLoading === 'system';
                return (
                  <button
                    type="button"
                    className={`uwa-pile uwa-pile--redo${systemCount === 0 ? ' is-disabled' : ''}`}
                    disabled={!ratingCounts || systemCount === 0 || !!reviewLoading}
                    onClick={() => startReview('system', `Redo — ${activeName || 'System'}`)}
                  >
                    <span className="uwa-pile-name">🔄 Redo Whole System</span>
                    <span className="uwa-pile-sub">
                      {loadingThis ? 'Loading…' : `${systemCount} question${systemCount === 1 ? '' : 's'} · seen or not`}
                    </span>
                  </button>
                );
              })()}
              {UWORLD_RATING_PILES.map(p => {
                const count = ratingCounts ? (ratingCounts[p.key === 'all' ? 'total' : p.key] ?? 0) : 0;
                const loadingThis = reviewLoading === p.key;
                const disabled = !ratingCounts || count === 0 || !!reviewLoading;
                return (
                  <button
                    key={p.key}
                    type="button"
                    className={`uwa-pile${count === 0 ? ' is-disabled' : ''}`}
                    disabled={disabled}
                    onClick={() => startReview(p.key, p.label)}
                  >
                    <span className="uwa-pile-name">{p.icon} {p.label}</span>
                    <span className="uwa-pile-sub">
                      {loadingThis ? 'Loading…'
                        : !ratingCounts ? 'Loading…'
                        : `${count} question${count === 1 ? '' : 's'}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
