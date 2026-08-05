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
  const [progress, setProgress] = useState(null);       // { total, seen, unseen }
  const [pace, setPace] = useState(PACE_DEFAULT);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  // The live session. Held in state and set ONCE per start so the array
  // reference stays stable — SoloGame's fetch effect depends on it.
  const [sessionQuestions, setSessionQuestions] = useState(null);

  const saveTimerRef = useRef(null);
  const paceLoadedForRef = useRef(null); // guards the save-on-change effect

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

  // Selecting a subject pulls its real counts and any saved pace together.
  useEffect(() => {
    if (!selected || !user?.id) return;
    let cancelled = false;
    setLoadingSubject(true);
    paceLoadedForRef.current = null; // suppress the save effect until this lands

    Promise.all([
      loadProgress(selected),
      authFetch(`/api/users/${user.id}/prep-pace?subject=${encodeURIComponent(selected)}`).then(r => r.json()),
    ])
      .then(([prog, paceData]) => {
        if (cancelled) return;
        setProgress(prog || { total: 0, seen: 0, unseen: 0 });
        const saved = Number(paceData?.daily_target);
        setPace(Number.isFinite(saved) && saved > 0
          ? Math.min(PACE_MAX, Math.max(PACE_MIN, saved))
          : PACE_DEFAULT);
        paceLoadedForRef.current = selected;
      })
      .catch(() => {
        if (cancelled) return;
        setProgress({ total: 0, seen: 0, unseen: 0 });
        setPace(PACE_DEFAULT);
        paceLoadedForRef.current = selected;
      })
      .finally(() => { if (!cancelled) setLoadingSubject(false); });

    return () => { cancelled = true; };
  }, [selected, user?.id, loadProgress]);

  // Persist the pace, debounced — a slider drag fires this once at rest, not per
  // pixel. Skipped until the saved pace for THIS subject has loaded, so the
  // fetched value is never immediately overwritten by its own arrival.
  useEffect(() => {
    if (!selected || paceLoadedForRef.current !== selected) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      authFetch('/api/prep-pace', {
        method: 'POST',
        body: JSON.stringify({ subject: selected, daily_target: pace }),
      }).catch(() => {}); // a lost preference must never interrupt the page
    }, PACE_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [pace, selected]);

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
  const unseen = progress?.unseen ?? 0;
  const daysToFinish = unseen > 0 ? Math.ceil(unseen / pace) : 0;
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysToFinish);
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
        {/* Mockup reads "3,659 questions across every USMLE subject and system";
            that figure is a design placeholder and there are no system-tagged
            questions, so this states the REAL total for the subjects that
            actually have content. */}
        <p className="uwa-intro">
          A high-yield board-review expedition through the wards of Medvale
          {progress ? ` — ${progress.total.toLocaleString()} questions in ${activeName || 'this subject'}.` : '.'}
        </p>

        {/* ── Set Your Pace ─────────────────────────────────────────────── */}
        <div className="uwa-card">
          <div className="uwa-card-title">Set Your Pace</div>
          <div className="uwa-card-sub">How many questions do you want to answer per day?</div>

          <div className="uwa-slider-row">
            <input
              className="uwa-slider"
              type="range"
              min={PACE_MIN}
              max={PACE_MAX}
              step={1}
              value={pace}
              onChange={e => setPace(Number(e.target.value))}
              aria-label="Questions per day"
            />
            <div className="uwa-pace-chip">
              <span className="uwa-pace-num">{pace}</span>
              <span className="uwa-pace-unit">questions/day</span>
            </div>
          </div>

          <div className="uwa-projection">
            <div>
              <span className="uwa-proj-label">DAYS TO FINISH</span>
              <span className="uwa-proj-val uwa-proj-val--blue">
                {unseen > 0 ? `${daysToFinish} days` : '—'}
              </span>
            </div>
            <div>
              <span className="uwa-proj-label">ESTIMATED COMPLETION</span>
              <span className="uwa-proj-val">
                {unseen > 0 ? formatDate(completionDate) : 'Complete'}
              </span>
            </div>
          </div>

          {/* Real progress — the mockup is a static design and has no equivalent,
              so these borrow the projection row's own treatment. */}
          {progress && (
            <>
              <div className="uwa-counts">
                <div>
                  <span className="uwa-proj-label">TOTAL QUESTIONS</span>
                  <span className="uwa-count-val">{progress.total}</span>
                </div>
                <div>
                  <span className="uwa-proj-label">ALREADY ANSWERED</span>
                  <span className="uwa-count-val">{progress.seen}</span>
                </div>
                <div>
                  <span className="uwa-proj-label">REMAINING</span>
                  <span className="uwa-count-val uwa-count-val--blue">{progress.unseen}</span>
                </div>
              </div>
              <div
                className="uwa-bar"
                role="img"
                aria-label={`${progress.seen} of ${progress.total} questions answered`}
              >
                <div
                  className="uwa-bar-fill"
                  style={{ width: `${progress.total ? (progress.seen / progress.total) * 100 : 0}%` }}
                />
              </div>
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
            {starting ? 'Loading…'
              : loadingSubject ? 'Loading…'
              : unseen === 0 ? 'Subject Complete'
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
