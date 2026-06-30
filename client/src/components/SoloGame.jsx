import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { useTheme } from '../theme';
import * as audio from '../audio';
import ExplanationText from './ExplanationText';
import ExplanationHighlightToolbar from './ExplanationHighlightToolbar';
import { parseRichText } from '../utils/parseRichText';
import { renderStem, toStemVisibleText } from '../utils/renderStem';
import Calculator from './Calculator';
import LabValues from './LabValues';
import { shuffleQuestionOptions } from '../utils/shuffleOptions';
import { toVisibleText, resolveHighlights, normalizeHighlightRow } from '../utils/explanationHighlights';
import { getToken } from '../auth';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Strip a single baked-in letter prefix ("A. ", "B) ", "C: " …) from stored
// option text so the DISPLAY letter we prepend doesn't produce "B. C. text".
// Display-only — never touches answer-check logic.
function stripLetterPrefix(text) {
  return String(text ?? '').replace(/^\s*[A-J][.):]\s+/, '');
}

function getHi(subject) {
  try { return parseInt(localStorage.getItem(`usmle-hs-${subject}`) || '0', 10); } catch { return 0; }
}
function saveHi(subject, score) {
  try { localStorage.setItem(`usmle-hs-${subject}`, String(score)); } catch {}
}

export default function SoloGame({ subject, username, difficulty, onBack, onTryAgain, onChangeSubject, onBackToTopics, topicId, questionsUrl, onComplete, levelLabel, isJourney }) {
  const { settings } = useGameSettings();
  const { study: studyPref } = useTheme();   // Layer 1 chrome renders only when study mode is on
  // Journey respects study mode exactly like training/solo: full two-pane study
  // chrome when study mode is on, plain single-pane screen when off.
  const study = studyPref;

  // Hard mode and easy mode each use their own admin-configured timer / explanation
  // time / hide-explanations setting (falling back to legacy generic keys, then literals)
  const isHardMode = difficulty === 'hard';
  const defaultTimer = isHardMode
    ? (settings.hardModeTimer || 30)
    : (settings.easyModeTimer || settings.timerDefault || 20);
  const defaultLives = isJourney ? 5 : (settings.battleRoyaleLives || 3);
  const maxLives = defaultLives;   // heart slots shown = max lives for this mode (5 in journey)
  const explanationTime = isHardMode
    ? (settings.hardModeExplanationTime || 20)
    : (settings.easyModeExplanationTime || settings.explanationTime || 5);
  const hideExplanations = isHardMode
    ? !!settings.hardModeHideExplanations
    : !!settings.easyModeHideExplanations;

  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(defaultLives);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultTimer);
  // Pause (Training Grounds + First Aid Journey only — never plain solo, and Battle
  // Royale uses GameRoom not SoloGame). Freezes the countdown + covers the question.
  const canPause = isJourney || !!topicId || !!questionsUrl;
  const [isPaused, setIsPaused] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalBestStreak, setFinalBestStreak] = useState(0);
  const [isNewHi, setIsNewHi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showLabValues, setShowLabValues] = useState(false);
  const [noQuestionsFound, setNoQuestionsFound] = useState(false);
  const [noQuestionsMessage, setNoQuestionsMessage] = useState('');

  // Explanation highlighting. `highlights` holds the current question's stored
  // highlights (client shape: { start, end, color, scope, ... }) — official (global)
  // + the user's own (private). Stage 2 adds developer mode: an admin authoring
  // OFFICIAL highlights everyone sees.
  const [highlights, setHighlights] = useState([]);
  const explContainerRef = useRef(null);
  const stemContainerRef = useRef(null);
  // Highlight-visibility filter (display only): 'official' | 'own' | 'both'. Saved
  // per-user in localStorage; persists across sessions. Creating highlights is
  // unaffected by this — it only filters what is SHOWN.
  const [hlVisibility, setHlVisibility] = useState(() => {
    try {
      const v = localStorage.getItem('mr_hl_visibility');
      return v === 'official' || v === 'own' ? v : 'both';
    } catch { return 'both'; }
  });
  function setHighlightVisibility(v) {
    setHlVisibility(v);
    try { localStorage.setItem('mr_hl_visibility', v); } catch {}
  }
  // Question-stem hints visibility (display only, per-user). Default OFF.
  const [showHints, setShowHints] = useState(() => {
    try { return localStorage.getItem('mr_show_hints') === 'true'; } catch { return false; }
  });
  function setShowHintsPref(v) {
    setShowHints(v);
    try { localStorage.setItem('mr_show_hints', String(v)); } catch {}
  }
  // Background-music on/off (per-user pref, default ON). Controls whether the game
  // music plays; the pause state still overrides it (paused → music paused).
  const [musicOn, setMusicOn] = useState(() => {
    try { return localStorage.getItem('mr_music_on') !== 'false'; } catch { return true; }
  });
  function setMusicPref(v) {
    setMusicOn(v);
    try { localStorage.setItem('mr_music_on', String(v)); } catch {}
  }
  // When dev mode is active (admin entered via the panel), official-highlight
  // authoring defaults ON globally — no per-screen re-toggle needed. The per-screen
  // toggle still works (it just flips this for the current screen).
  const [devHlMode, setDevHlMode] = useState(() => {
    try {
      if (localStorage.getItem('mr_dev_mode_active') === '1') return true;
      return localStorage.getItem('mr_dev_highlight_mode') === 'true';
    } catch { return false; }
  });
  // Admin session = the admin password stored by /admin login (AdminApp sets
  // localStorage['usmle_admin_session']). It enables developer-mode (official)
  // highlighting. Kept in state so the in-game unlock takes effect immediately.
  const [adminSession, setAdminSession] = useState(() => {
    try { return localStorage.getItem('usmle_admin_session'); } catch { return null; }
  });
  // `?dev=1` in the URL surfaces an in-game unlock so an admin can enable developer
  // mode in ANY play tab without first visiting /admin in that browser.
  const devParam = (() => {
    try { return new URLSearchParams(window.location.search).has('dev'); } catch { return false; }
  })();
  function unlockDevMode() {
    let pw = '';
    try { pw = window.prompt('Enter admin password to enable Developer Mode (author OFFICIAL highlights):') || ''; } catch {}
    if (!pw) return;
    try { localStorage.setItem('usmle_admin_session', pw); } catch {}
    setAdminSession(pw);
    setDevHlMode(true);
    try { localStorage.setItem('mr_dev_highlight_mode', 'true'); } catch {}
  }

  // Layer 1/2 (study mode only): explanation pane layout, time-spent, burger menu
  const [explLayout, setExplLayout] = useState(() => localStorage.getItem('mr_solo_expl_layout') || 'right');
  const [timeSpent, setTimeSpent] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  function setLayout(value) {
    setExplLayout(value);
    localStorage.setItem('mr_solo_expl_layout', value);
    setMenuOpen(false);
  }
  // Close the burger dropdown on outside click (no-op unless menu is open → study only)
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const timerRef      = useRef(null);
  const timeLeftRef   = useRef(defaultTimer);
  const revealedRef   = useRef(false);
  const pausedRef     = useRef(false);
  const livesRef      = useRef(defaultLives);
  const scoreRef      = useRef(0);
  const streakRef     = useRef(0);
  const bestStreakRef = useRef(0);
  const qIdxRef       = useRef(0);
  const questionsRef  = useRef([]);
  const skipTimerRef  = useRef(null);
  const skipActionRef = useRef(null);
  // Holds the shuffled clone of the current question. Computed once per appearance
  // (keyed by qIdx + base identity) during render; processAnswer reads the SAME
  // object so the answer-check and the displayed correct answer never disagree.
  const shuffledQRef       = useRef({ qIdx: -1, base: null, q: null });
  const correctCountRef    = useRef(0);
  const completionFiredRef = useRef(false);
  const onCompleteRef      = useRef(onComplete);

  revealedRef.current = revealed;
  pausedRef.current = isPaused;
  livesRef.current = lives;
  scoreRef.current = score;
  streakRef.current = streak;
  bestStreakRef.current = bestStreak;
  qIdxRef.current = qIdx;
  questionsRef.current = questions;
  onCompleteRef.current = onComplete;

  // Stable per-question id (survives the option shuffle — shuffle keeps `id`).
  const currentQid = questions[qIdx]?.id;

  // Fetch this question's highlights when the explanation reveals. Soft auth: a
  // logged-in user gets their own highlights (Bearer); guests get none (stage 1).
  // Degrades silently to [] on any error / missing table.
  useEffect(() => {
    setHighlights([]); // clear stale highlights from the previous question
    if (!revealed || hideExplanations || !currentQid) return;
    let cancelled = false;
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(currentQid)}/highlights`, { headers })
      .then(r => (r.ok ? r.json() : { highlights: [] }))
      .then(data => { if (!cancelled) setHighlights((data.highlights || []).map(normalizeHighlightRow)); })
      .catch(() => { if (!cancelled) setHighlights([]); });
    return () => { cancelled = true; };
  }, [revealed, hideExplanations, currentQid]);

  // Stop lobby music on mount; stop game music on unmount.
  useEffect(() => {
    audio.stopBgMusic();
    return () => audio.stopGameMusic();
  }, []);

  // Background music plays only when ENABLED (burger Music toggle) AND NOT paused,
  // while the game is live. One effect covers mount-start, pause/resume, and the
  // on/off toggle: music-off → silent; paused → silent; otherwise → playing.
  useEffect(() => {
    if (loading || gameOver) return;
    if (musicOn && !isPaused) audio.startGameMusic();
    else audio.stopGameMusic();
  }, [musicOn, isPaused, loading, gameOver]);

  useEffect(() => {
    let url = questionsUrl || (topicId
      ? `${SERVER_URL}/api/questions?topic_id=${topicId}`
      : `${SERVER_URL}/api/questions?subject=${subject}`);

    // Add difficulty filter to ensure strict filtering
    if (difficulty && !questionsUrl) {
      url += `&difficulty=${difficulty}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const questions = data.questions || [];

        // DEBUG: Check what fields the question object actually has
        if (questions.length > 0) {
          console.log('[SoloGame] First question structure:', {
            hasOptions: 'options' in questions[0],
            hasChoices: 'choices' in questions[0],
            optionsValue: questions[0].options,
            choicesValue: questions[0].choices,
            correctValue: questions[0].correct,
            allKeys: Object.keys(questions[0])
          });
        }

        // Check if empty or server indicated no questions
        if (questions.length === 0 || data.empty) {
          setNoQuestionsFound(true);
          setNoQuestionsMessage(
            data.message || `No ${difficulty || ''} questions found for this selection. Try a different topic or difficulty.`
          );
          setLoading(false);
          return;
        }

        setQuestions(questions);
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Failed to load questions. Check your connection.');
        setLoading(false);
      });
  }, [subject, topicId, difficulty, questionsUrl]);

  const processAnswerRef = useRef(null);

  const processAnswer = useCallback((label) => {
    if (revealedRef.current) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    // Use the SAME shuffled clone that render produced for this appearance, so the
    // letter check matches what the player actually saw. Fall back to the raw
    // question only if the ref is somehow out of sync.
    const q = (shuffledQRef.current && shuffledQRef.current.qIdx === qIdxRef.current && shuffledQRef.current.q)
      ? shuffledQRef.current.q
      : questionsRef.current[qIdxRef.current];
    if (!q) return;

    revealedRef.current = true;
    setRevealed(true);
    setSelected(label);

    // q.correct is now stored as letter (A, B, C...), label is also letter
    console.log('[SoloGame] Answer check:', {
      submittedLabel: label,
      qCorrect: q.correct,
      match: label === q.correct
    });
    const correct = label === q.correct;
    const tl = timeLeftRef.current;
    setTimeSpent(defaultTimer - tl);   // Layer 1: additive only — no flow/timer/scoring change
    let newLives = livesRef.current;
    let newScore = scoreRef.current;
    let newStreak = streakRef.current;
    let newBest = bestStreakRef.current;
    let bonus = 0;

    if (correct) {
      correctCountRef.current += 1;
      bonus = Math.floor(tl * 5);
      newScore += 100 + bonus;
      newStreak += 1;
      if (newStreak > newBest) newBest = newStreak;
      audio.playCorrect();
    } else {
      newLives = Math.max(0, newLives - 1);
      newStreak = 0;
      if (label !== null) audio.playWrong();
      if (newLives === 0) audio.playEliminated();
    }

    setBonusPoints(bonus);
    setLives(newLives);
    setScore(newScore);
    setStreak(newStreak);
    setBestStreak(newBest);

    const nextIdx  = qIdxRef.current + 1;
    const exhausted = nextIdx >= questionsRef.current.length;

    const doAdvance = () => {
      skipTimerRef.current  = null;
      skipActionRef.current = null;
      if (newLives === 0 || exhausted) {
        audio.stopGameMusic();
        const hi    = getHi(subject);
        const newHi = newScore > hi;
        if (newHi) saveHi(subject, newScore);
        setFinalScore(newScore);
        setFinalBestStreak(newBest);
        setIsNewHi(newHi);
        setGameOver(true);
        if (onCompleteRef.current && !completionFiredRef.current) {
          completionFiredRef.current = true;
          const total = questionsRef.current.length;
          const c = correctCountRef.current;
          onCompleteRef.current({ correct: c, total, pct: total ? Math.round((c / total) * 100) : 0 });
        }
      } else {
        revealedRef.current = false;
        setRevealed(false);
        setSelected(null);
        setBonusPoints(0);
        setQIdx(nextIdx);
      }
    };

    skipActionRef.current = doAdvance;
    // Use admin-configured explanation display time (hard/easy mode specific) + 2.5s buffer
    const explanationDelay = explanationTime * 1000 + 2500;
    skipTimerRef.current  = setTimeout(doAdvance, explanationDelay);
  }, [subject, explanationTime]);

  processAnswerRef.current = processAnswer;

  useEffect(() => {
    if (loading || gameOver || questions.length === 0) return;

    timeLeftRef.current = defaultTimer;
    setTimeLeft(defaultTimer);
    setIsPaused(false); // new question always starts unpaused

    timerRef.current = setInterval(() => {
      if (pausedRef.current) return; // frozen while paused — no time lost
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 5 && timeLeftRef.current > 0) audio.playTick();
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        processAnswerRef.current(null);
      }
    }, 1000);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [qIdx, loading, gameOver, questions.length, defaultTimer]);

  function handleSkip() {
    if (skipTimerRef.current) { clearTimeout(skipTimerRef.current); skipTimerRef.current = null; }
    const fn = skipActionRef.current;
    if (fn) { skipActionRef.current = null; fn(); }
  }

  if (loading) {
    return (
      <div className="screen solo-screen">
        <div className="waiting-screen"><div className="spinner" /><p>Loading questions…</p></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="screen solo-screen">
        <div className="solo-card"><p className="error-msg">{fetchError}</p><button className="btn-start" onClick={onBack}>Back</button></div>
      </div>
    );
  }

  if (noQuestionsFound) {
    return (
      <div className="no-questions-screen">
        <div className="no-questions-card">
          <span className="no-questions-icon">📭</span>
          <h3>No Questions Available</h3>
          <p>{noQuestionsMessage}</p>
          <button className="no-questions-back-btn" onClick={onBack}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen solo-screen">
        <div className="solo-gameover">
          <h2>Game Over</h2>
          {levelLabel && <p className="sgo-level-label">{levelLabel}</p>}
          {isNewHi && <div className="new-hi-badge">🏆 New High Score!</div>}
          <div className="sgo-stats">
            <div className="sgo-stat">
              <span className="sgo-val">{finalScore}</span>
              <span className="sgo-label">Score</span>
            </div>
            <div className="sgo-stat">
              <span className="sgo-val">{finalBestStreak}</span>
              <span className="sgo-label">Best Streak</span>
            </div>
            <div className="sgo-stat">
              <span className="sgo-val">{getHi(subject)}</span>
              <span className="sgo-label">High Score</span>
            </div>
          </div>
          {onTryAgain      && <button className="btn-start"    onClick={onTryAgain}>Try Again</button>}
          {onBackToTopics  && <button className="btn-secondary" onClick={onBackToTopics}>Back to Topics</button>}
          <button className="btn-secondary" onClick={onBack}>Home</button>
        </div>
      </div>
    );
  }

  const baseQ = questions[qIdx];
  if (!baseQ) return null;

  // Shuffle options + remap correct ONCE per appearance (keyed by qIdx + base
  // identity). Re-renders from the timer don't change qIdx, so the memo stays
  // stable — no reshuffle mid-question. A fresh question (or refetch) gets a fresh
  // order. This shuffled clone drives both render AND processAnswer (via the ref).
  if (shuffledQRef.current.qIdx !== qIdx || shuffledQRef.current.base !== baseQ) {
    const { options, correct } = shuffleQuestionOptions(baseQ.options || [], baseQ.correct);
    shuffledQRef.current = { qIdx, base: baseQ, q: { ...baseQ, options, correct } };
  }
  const q = shuffledQRef.current.q;

  // ── Explanation highlighting (per-user + official) ──────────────────────────
  const loggedIn = !!getToken();
  // Admin session (the admin password) enables developer mode. The server is the
  // real gate — this only decides whether the toggle/UI shows. `adminSession` is
  // state (above), so the in-game `?dev=1` unlock reflects immediately.
  const isAdminSession = !!adminSession;
  // Authoring OFFICIAL (global) highlights only when an admin has dev mode ON.
  const authoringOfficial = isAdminSession && devHlMode;
  // The toolbar is usable by logged-in students (private) and admins (official).
  const canHighlight = loggedIn || isAdminSession;

  function toggleDevHlMode() {
    setDevHlMode(prev => {
      const next = !prev;
      try { localStorage.setItem('mr_dev_highlight_mode', String(next)); } catch {}
      return next;
    });
  }

  // Region-split (MANDATORY): explanation offsets and stem ('question') offsets live
  // in DIFFERENT visible-text spaces — mixing them would mis-anchor. Resolve each
  // against its own visible string (drift-resilient).
  const explVisibleText = q.explanation ? toVisibleText(q.explanation) : '';
  const stemVisibleText = q.question ? toStemVisibleText(q.question) : '';
  const explRows     = highlights.filter(h => (h.region || 'explanation') === 'explanation');
  const questionRows = highlights.filter(h => h.region === 'question');

  // Explanation: resolve + apply the per-user official/own/both visibility filter.
  const resolvedHighlights = resolveHighlights(explVisibleText, explRows);
  const displayHighlights = resolvedHighlights.filter(h => {
    if (hlVisibility === 'official') return h.scope === 'official';
    if (hlVisibility === 'own')      return h.scope === 'user';
    return true; // 'both'
  });

  // Stem hints: official region='question'. Hidden unless "Show hints" is ON; the
  // dev-mode author always sees them (so they can author/verify).
  const resolvedStem = resolveHighlights(stemVisibleText, questionRows);
  const stemDisplayHighlights = (showHints || authoringOfficial) ? resolvedStem : [];

  // Create a highlight or format span in a given region. Format spans + question
  // hints are official (server gates to admin); explanation colour follows dev mode.
  function handleCreateHighlight(region, payload) {
    if (!q?.id) return;
    const token = getToken();
    const isFormat = payload.format != null;
    const official = isFormat || region === 'question' || authoringOfficial;
    if (official && !adminSession) return;   // official authoring needs admin session
    if (!official && !token) return;         // students need a token for their own
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tmpId, start: payload.start, end: payload.end,
      color: payload.color ?? null, format: payload.format ?? null, region,
      quote: payload.quote, prefix: payload.prefix, suffix: payload.suffix,
      created_at: new Date().toISOString(), scope: official ? 'official' : 'user',
    };
    setHighlights(hs => [...hs, optimistic]);
    const headers = { 'Content-Type': 'application/json' };
    if (official) headers['x-admin-password'] = adminSession;
    else headers['Authorization'] = `Bearer ${token}`;
    const body = {
      start_offset: payload.start, end_offset: payload.end,
      region, scope: official ? 'official' : 'user',
      quote: payload.quote, prefix: payload.prefix, suffix: payload.suffix,
    };
    if (isFormat) body.format = payload.format; else body.color = payload.color;
    fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(q.id)}/highlights`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.highlight) {
          setHighlights(hs => hs.map(h => (h.id === tmpId ? normalizeHighlightRow(data.highlight) : h)));
        } else {
          setHighlights(hs => hs.filter(h => h.id !== tmpId)); // roll back on failure
        }
      })
      .catch(() => setHighlights(hs => hs.filter(h => h.id !== tmpId)));
  }

  function handleRemoveRange(region, start, end) {
    const token = getToken();
    const pool = region === 'question' ? stemDisplayHighlights : displayHighlights;
    const targets = pool.filter(
      h => h.start < end && h.end > start && !String(h.id).startsWith('tmp-')
    );
    const deletable = targets.filter(
      h => (h.scope === 'user' && token) || (h.scope === 'official' && adminSession)
    );
    if (!deletable.length) return;
    const ids = deletable.map(h => h.id);
    setHighlights(hs => hs.filter(h => !ids.includes(h.id)));
    deletable.forEach(h => {
      const headers = {};
      if (h.scope === 'official') headers['x-admin-password'] = adminSession;
      else headers['Authorization'] = `Bearer ${token}`;
      fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(q.id)}/highlights/${encodeURIComponent(h.id)}`, {
        method: 'DELETE', headers,
      }).catch(() => {});
    });
  }

  const pct = (timeLeft / defaultTimer) * 100;
  const tier = timeLeft > 10 ? 'green' : timeLeft > 5 ? 'yellow' : 'red';

  return (
    <div className="screen solo-screen">
      {/* Developer-mode unlock: only when ?dev=1 is in the URL and not yet unlocked.
          Lets an admin enable official-highlight authoring from any play tab. */}
      {devParam && !isAdminSession && (
        <button type="button" className="dev-hl-unlock" onClick={unlockDevMode}>
          🔧 Enable Developer Mode
        </button>
      )}
      {!study && (
        <div className="solo-topbar">
          {levelLabel && <span className="topbar-level-label">{levelLabel}</span>}
          <span className="topbar-round">Q {qIdx + 1}</span>
          <span className="topbar-score">🏅 {score} pts</span>
          <div className="lives-bar">
            {Array.from({ length: maxLives }, (_, k) => k + 1).map(i => (
              <span key={i} className={`heart-icon ${i > lives ? 'dead' : ''}`}>
                {i <= lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>
      )}

      {!study && streak >= 2 && <div className="streak-badge">🔥 {streak} streak!</div>}

      <div className="solo-body" data-expl-layout={study ? explLayout : undefined}>
        {study && (
          <div className="study-header">
            <div className="shd-left">
              <div className="study-menu" ref={menuRef}>
                <button
                  className="shd-burger"
                  onClick={() => setMenuOpen(o => !o)}
                  title="Menu"
                  aria-expanded={menuOpen}
                >
                  ☰
                </button>
                {menuOpen && (
                  <div className="study-menu-panel">
                    <div className="smp-title">Explanation</div>
                    <button
                      className={`smp-opt ${explLayout === 'right' ? 'smp-active' : ''}`}
                      onClick={() => setLayout('right')}
                    >
                      Explanation: Right
                    </button>
                    <button
                      className={`smp-opt ${explLayout === 'below' ? 'smp-active' : ''}`}
                      onClick={() => setLayout('below')}
                    >
                      Explanation: Below
                    </button>
                    <div className="smp-title">Highlights</div>
                    <button
                      className={`smp-opt ${hlVisibility === 'official' ? 'smp-active' : ''}`}
                      onClick={() => setHighlightVisibility('official')}
                    >
                      Official only
                    </button>
                    <button
                      className={`smp-opt ${hlVisibility === 'own' ? 'smp-active' : ''}`}
                      onClick={() => setHighlightVisibility('own')}
                    >
                      My own only
                    </button>
                    <button
                      className={`smp-opt ${hlVisibility === 'both' ? 'smp-active' : ''}`}
                      onClick={() => setHighlightVisibility('both')}
                    >
                      Both
                    </button>
                    <div className="smp-title">Question hints</div>
                    <button
                      className={`smp-opt ${showHints ? 'smp-active' : ''}`}
                      onClick={() => setShowHintsPref(true)}
                    >
                      Show hints
                    </button>
                    <button
                      className={`smp-opt ${!showHints ? 'smp-active' : ''}`}
                      onClick={() => setShowHintsPref(false)}
                    >
                      Hide hints
                    </button>
                    <div className="smp-title">Music</div>
                    <button
                      className={`smp-opt ${musicOn ? 'smp-active' : ''}`}
                      onClick={() => setMusicPref(true)}
                    >
                      Music: On
                    </button>
                    <button
                      className={`smp-opt ${!musicOn ? 'smp-active' : ''}`}
                      onClick={() => setMusicPref(false)}
                    >
                      Music: Off
                    </button>
                  </div>
                )}
              </div>
              <div className="shd-meta">
                <span className="stb-count">Item {qIdx + 1} of {questions.length}</span>
              </div>
            </div>
            <div className="shd-center">
              {!revealed && (
                <div className="timer-wrap">
                  <div className={`timer-number ${tier}`}>{timeLeft}s</div>
                  <div className="timer-track">
                    <div className={`timer-fill ${tier}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="shd-right">
              {streak >= 2 && (
                <span className="study-streak-pill" title={`${streak} in a row`}>
                  <span className="ssp-flame">🔥</span>{streak}
                </span>
              )}
              <div className="lives-bar">
                {Array.from({ length: maxLives }, (_, k) => k + 1).map(i => (
                  <span key={i} className={`heart-icon ${i > lives ? 'dead' : ''}`}>
                    {i <= lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!study && !revealed && (
          <div className="timer-wrap">
            <div className={`timer-number ${tier}`}>{timeLeft}s</div>
            <div className="timer-track">
              <div className={`timer-fill ${tier}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="question-card">
          {/* Pause (Training + Journey only, during the question countdown). NON-STUDY:
              in-flow, right-aligned above the stem so it never overlaps the question.
              STUDY: rendered in the footer between the prev/next arrows (below). */}
          {!study && canPause && !revealed && !isPaused && (
            <button
              type="button"
              className="pause-btn"
              style={{ position: 'static', display: 'block', width: 'fit-content', marginLeft: 'auto', marginBottom: '10px' }}
              onClick={() => setIsPaused(true)}
              title="Pause"
            >
              ⏸ Pause
            </button>
          )}
          {/* Pause overlay — covers stem + options so you can't read/answer while paused */}
          {canPause && isPaused && !revealed && (
            <div className="pause-overlay">
              <div className="pause-overlay-inner">
                <div className="pause-overlay-icon">⏸</div>
                <div className="pause-overlay-title">Paused</div>
                <button
                  type="button"
                  className="pause-resume-btn"
                  onClick={() => setIsPaused(false)}
                >
                  ▶ Resume
                </button>
              </div>
            </div>
          )}
          <div className="stem-text" ref={stemContainerRef}>
            {renderStem(q.question, { highlights: stemDisplayHighlights })}
          </div>
          {/* Stem hint authoring toolbar — admin + dev mode only; official region='question'.
              v1 rejects selections that touch a lab box or table (prose-only authoring). */}
          {authoringOfficial && (
            <ExplanationHighlightToolbar
              containerRef={stemContainerRef}
              highlights={stemDisplayHighlights}
              onCreate={(p) => handleCreateHighlight('question', p)}
              onRemoveRange={(s, e) => handleRemoveRange('question', s, e)}
              allowFormat={true}
              rejectSelector=".lab-values-box, .stem-table"
            />
          )}
          {q?.image_url && (
            <div className="game-question-image">
              <img src={q.image_url} alt="Question" style={{maxWidth:'100%', maxHeight:'300px', borderRadius:'8px', margin:'12px auto', display:'block'}} onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}

          {/* Calculator button - appears below question */}
          <button
            className="calculator-toggle-btn"
            onClick={() => setShowCalculator(!showCalculator)}
            title="Toggle Calculator"
          >
            🧮 {showCalculator ? 'Hide' : 'Show'} Calculator
          </button>

          {/* Lab Values button - sits alongside the calculator button */}
          <button
            className="lab-values-toggle-btn"
            onClick={() => setShowLabValues(s => !s)}
            title="Toggle Lab Values"
          >
            🧪 {showLabValues ? 'Hide' : 'Show'} Lab Values
          </button>

          {/* Calculator inline - between question and answers on mobile */}
          {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}

          <div className="options">
            {q.options.map((opt, i) => {
              const label = LABELS[i];
              const isMine = selected === label;
              // Compare letter to letter (q.correct is now "A", "B", "C"...)
              const isRight = revealed && label === q.correct;
              const isWrong = revealed && isMine && label !== q.correct;
              return (
                <button
                  key={i}
                  className={['option-btn', isMine ? 'selected' : '', isRight ? 'correct' : '', isWrong ? 'wrong' : ''].join(' ')}
                  onClick={() => processAnswer(label)}
                  disabled={revealed}
                >
                  <span className="opt-label">{label}</span>
                  <span className="opt-text">{stripLetterPrefix(opt)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {study && revealed && (
          <div className={`study-result-strip ${selected === q.correct ? 'is-correct' : 'is-wrong'}`}>
            <span className="srs-mark">{selected === q.correct ? '✓ Correct' : '✗ Incorrect'}</span>
            {timeSpent != null && <span className="srs-time">Time spent: {timeSpent}s</span>}
          </div>
        )}

        {study && !revealed && (
          <div className="study-expl-placeholder">Answer to reveal the explanation</div>
        )}

        {revealed && (
          <div className={`round-result ${selected === q.correct ? 'correct-bg' : 'wrong-bg'}`}>
            <div className="rr-header">
              <span className="rr-icon">{selected === q.correct ? '✅' : '❌'}</span>
              <span className={`rr-label ${selected === q.correct ? 'correct' : 'wrong'}`}>
                {selected === null
                  ? "TIME'S UP!"
                  : selected === q.correct
                    ? `CORRECT! +${100 + bonusPoints} pts`
                    : 'WRONG!'}
              </span>
            </div>
            <div className="rr-explanation">
              <strong>Correct answer: {q.correct}. {stripLetterPrefix(q.options[q.correct.charCodeAt(0) - 65])}</strong>
              {!hideExplanations && (
                <ExplanationText
                  text={q.explanation}
                  highlights={displayHighlights}
                  containerRef={explContainerRef}
                />
              )}
              {!hideExplanations && canHighlight && (
                <ExplanationHighlightToolbar
                  containerRef={explContainerRef}
                  highlights={displayHighlights}
                  onCreate={(p) => handleCreateHighlight('explanation', p)}
                  onRemoveRange={(s, e) => handleRemoveRange('explanation', s, e)}
                  allowFormat={authoringOfficial}
                />
              )}
              {!hideExplanations && isAdminSession && (
                <div className="dev-hl-bar">
                  <span className="dev-hl-bar-label">🛠️ Developer Mode</span>
                  <button
                    type="button"
                    className={`dev-hl-toggle ${authoringOfficial ? 'on' : ''}`}
                    onClick={toggleDevHlMode}
                    title="Toggle developer mode: author OFFICIAL (global) highlights vs personal"
                  >
                    {authoringOfficial
                      ? '✏️ ON — new highlights are OFFICIAL (everyone sees them)'
                      : '👤 OFF — new highlights are personal · tap to author OFFICIAL'}
                  </button>
                </div>
              )}
              {!hideExplanations && q.explanation_image_url && (
                <img
                  src={q.explanation_image_url}
                  alt="Explanation"
                  className="rr-explanation-img"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
            {!hideExplanations && q.why_others_wrong && (
              <div className="why-wrong-box">
                <div className="why-wrong-header">
                  <span className="why-wrong-icon">❌</span>
                  <h4 className="why-wrong-title">Why Are The Other Options Wrong?</h4>
                </div>
                <div className="explanation-rich why-wrong-content">
                  {parseRichText(q.why_others_wrong)}
                </div>
              </div>
            )}
            <div className="rr-skip-row">
              <button className="rr-skip-btn" onClick={handleSkip}>Next Question →</button>
            </div>
          </div>
        )}

        {study && (
          <div className="study-statusbar">
            <div className="ssb-left">
              <button className="ssb-home" onClick={onBack} title="Home">⌂ <span className="ssb-btn-label">Home</span></button>
            </div>
            <div className="ssb-arrows">
              <button className="stb-arrow" disabled title="Previous (not available)">←</button>
              {/* Pause sits BETWEEN the arrows (training/journey only, during the
                  question countdown): [← prev] [⏸ pause] [next →]. */}
              {canPause && !revealed && !isPaused && (
                <button
                  className="stb-arrow stb-pause"
                  onClick={() => setIsPaused(true)}
                  title="Pause"
                >
                  ⏸
                </button>
              )}
              <button
                className="stb-arrow stb-next"
                onClick={handleSkip}
                disabled={!revealed}
                title="Next question"
              >
                →
              </button>
            </div>
            <div className="ssb-right">
              <button
                className="ssb-calc"
                onClick={() => setShowCalculator(s => !s)}
                title="Toggle Calculator"
              >
                🧮 <span className="ssb-btn-label">Calculator</span>
              </button>
              <button
                className="ssb-calc ssb-lab"
                onClick={() => setShowLabValues(s => !s)}
                title="Toggle Lab Values"
              >
                🧪 <span className="ssb-btn-label">Lab Values</span>
              </button>
            </div>
          </div>
        )}

        {/* Lab Values reference overlay — independent of game/timer/scoring,
            available in all modes (solo / training / journey) */}
        {showLabValues && <LabValues onClose={() => setShowLabValues(false)} />}
      </div>
    </div>
  );
}
