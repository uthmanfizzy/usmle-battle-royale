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

function formatDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
        setSubjects((data.subjects || []).filter(s => s.active));
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

  const unseen = progress?.unseen ?? 0;
  const daysToFinish = unseen > 0 ? Math.ceil(unseen / pace) : 0;
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysToFinish);
  const todaysCount = Math.min(pace, unseen);

  return (
    <div className="uwa">
      <div className="uwa-topbar">
        <a className="uwa-wordmark" href="/dashboard">MEDVALE</a>
        <div className="uwa-topbar-right">
          <div className="uwa-currency" aria-label="Currency">
            <span>🪙 {user?.coins ?? 0}</span>
            <span className="uwa-currency-divider" aria-hidden="true" />
            <span>💎 {user?.gems ?? 0}</span>
          </div>
          <div className="uwa-avatar" title={user?.username || 'Player'}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
              : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
          </div>
        </div>
      </div>

      <button type="button" className="uwa-back" onClick={() => { window.location.href = '/dashboard'; }}>
        ← Back to Dashboard
      </button>

      <div className="uwa-col">
        <h1 className="uwa-title">UWorld Adventure</h1>
        <p className="uwa-sub">
          Pick a subject, set a daily pace, and see exactly when you'll finish the bank.
        </p>

        <div className="uwa-section-label">Subjects</div>
        {subjectsError && <p className="uwa-empty">Couldn't load subjects — check your connection.</p>}
        {!subjectsError && subjects.length === 0 && <p className="uwa-empty">Loading subjects…</p>}
        <div className="uwa-subjects">
          {subjects.map(s => (
            <button
              key={s.id}
              type="button"
              className={`uwa-subject${selected === s.id ? ' uwa-subject--active' : ''}`}
              onClick={() => setSelected(s.id)}
            >
              <span className="uwa-subject-icon">{s.icon || '📚'}</span>
              <span className="uwa-subject-name">{s.name}</span>
            </button>
          ))}
        </div>

        {selected && loadingSubject && <p className="uwa-empty">Loading your progress…</p>}

        {selected && !loadingSubject && progress && (
          <>
            <div className="uwa-stats">
              <div className="uwa-stat">
                <span className="uwa-stat-val">{progress.total}</span>
                <span className="uwa-stat-label">Total Questions</span>
              </div>
              <div className="uwa-stat">
                <span className="uwa-stat-val">{progress.seen}</span>
                <span className="uwa-stat-label">Already Answered</span>
              </div>
              <div className="uwa-stat uwa-stat--accent">
                <span className="uwa-stat-val">{progress.unseen}</span>
                <span className="uwa-stat-label">Remaining</span>
              </div>
            </div>

            <div className="uwa-bar" role="img"
                 aria-label={`${progress.seen} of ${progress.total} questions answered`}>
              <div
                className="uwa-bar-fill"
                style={{ width: `${progress.total ? (progress.seen / progress.total) * 100 : 0}%` }}
              />
            </div>

            <div className="uwa-card">
              <div className="uwa-pace-head">
                <span className="uwa-pace-label">Daily Pace</span>
                <span className="uwa-pace-value">{pace} <span>/ day</span></span>
              </div>
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
              <div className="uwa-slider-ends">
                <span>{PACE_MIN}</span>
                <span>{PACE_MAX}</span>
              </div>

              <div className="uwa-projection">
                <div className="uwa-proj">
                  <span className="uwa-proj-val">{unseen > 0 ? daysToFinish : '—'}</span>
                  <span className="uwa-proj-label">Days to Finish</span>
                </div>
                <div className="uwa-proj">
                  <span className="uwa-proj-val uwa-proj-val--date">
                    {unseen > 0 ? formatDate(completionDate) : 'Complete'}
                  </span>
                  <span className="uwa-proj-label">Estimated Completion</span>
                </div>
              </div>
            </div>

            {startError && <p className="uwa-error">{startError}</p>}

            <button
              type="button"
              className="mv-btn-cut mv-btn-cut--lg uwa-start"
              onClick={startSession}
              disabled={starting || unseen === 0}
            >
              {starting ? 'Loading…'
                : unseen === 0 ? 'Subject Complete'
                : `Start Today's Questions (${todaysCount})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
