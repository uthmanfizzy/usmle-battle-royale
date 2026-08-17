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
import { useScrollToTopOnChange } from '../utils/useScrollToTopOnChange';
import { toVisibleText, resolveHighlights, normalizeHighlightRow } from '../utils/explanationHighlights';
import { getToken } from '../auth';
import './SoloGameJourney.css';
import './SoloGameUWorld.css';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Self-assessment buckets shown below the explanation on every UWorld
// Adventure question — same five categories and exact value strings as HY
// Flashcards' own rating picker, kept identical for a familiar UX. Order
// here is the order the buttons render in.
const UWORLD_RATINGS = [
  { key: 'knowledge_gap',    label: 'Knowledge Gap',    icon: '🧠' },
  { key: 'careless_miss',    label: 'Careless Miss',    icon: '😅' },
  { key: 'lucky_guess',      label: 'Lucky Guess',      icon: '🍀' },
  { key: 'somewhat_know',    label: 'Somewhat Know',    icon: '🤔' },
  { key: 'fully_understood', label: 'Fully Understood', icon: '✅' },
];

// Strip a single baked-in letter prefix ("A. ", "B) ", "C: " …) from stored
// option text so the DISPLAY letter we prepend doesn't produce "B. C. text".
// Display-only — never touches answer-check logic.
function stripLetterPrefix(text) {
  return String(text ?? '').replace(/^\s*[A-J][.):]\s+/, '');
}

// Tell the server this main-bank question has now been met.
//
// Multiplayer records exposure server-side (it grades there), but Solo and
// Training Grounds grade ENTIRELY on the client — the server ships whole
// questions and only ever hears back an aggregate percentage — so this call is
// the only way it learns which individual questions were served.
//
// Sends `_supabase_id`, the questions.id UUID. Anything without one is skipped,
// which is exactly the right filter: the local questions.js fallback has no id,
// and so does Journey, whose levels play through this same component but come
// from journey_questions and track themselves via journey_progress.
//
// Fire-and-forget and guest-guarded, same contract as postStudyTime below — the
// run never waits on it and a failure is invisible to the player.
function postQuestionSeen(q, { answered, correct }) {
  const questionId = q?._supabase_id;
  if (!questionId) return;
  const token = getToken();
  if (!token) return; // guests are never tracked
  fetch(`${SERVER_URL}/api/questions/seen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ seen: [{ question_id: questionId, answered, correct }] }),
  }).catch(() => {});
}

// UWorld Adventure only: the self-assessment rating chosen below the
// explanation. Fire-and-forget, same contract as postQuestionSeen — a lost
// rating never blocks advancing (the button that triggers this has already
// advanced by the time the request settles).
function postQuestionRating(q, rating) {
  const questionId = q?._supabase_id;
  if (!questionId) return;
  const token = getToken();
  if (!token) return;
  fetch(`${SERVER_URL}/api/uworld-questions/${questionId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating }),
  }).catch(() => {});
}

function getHi(subject) {
  try { return parseInt(localStorage.getItem(`usmle-hs-${subject}`) || '0', 10); } catch { return 0; }
}
function saveHi(subject, score) {
  try { localStorage.setItem(`usmle-hs-${subject}`, String(score)); } catch {}
}

/**
 * Dev-mode-only image slot, rendered under the stem and under the explanation
 * during play. Drop a file on it, or click it to arm and Ctrl+V — the paste
 * listener lives in SoloGame so a paste works from anywhere on the page, not
 * only while this element happens to hold focus.
 *
 * Purely presentational: the upload/save is SoloGame's uploadDevImage.
 */
function DevImageSlot({ field, label, qid, armed, busy, message, currentUrl, onArm, onFile }) {
  const [over, setOver] = useState(false);
  const state = busy ? 'busy' : message?.kind === 'ok' ? 'ok' : message?.kind === 'err' ? 'err' : '';

  return (
    <div
      className={`dev-imgslot${armed ? ' is-armed' : ''}${over ? ' is-over' : ''}${state ? ` is-${state}` : ''}`}
      onClick={onArm}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (!busy) setOver(true); }}
      onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setOver(false); }}
      onDrop={e => {
        e.preventDefault(); e.stopPropagation(); setOver(false);
        if (busy) return;
        const file = e.dataTransfer?.files?.[0];
        // qid pins the write to the question this slot belongs to.
        if (file) onFile(field, file, qid);
      }}
      title={`${label} image — drop a file, or click then Ctrl+V`}
    >
      <span className="dev-imgslot-icon" aria-hidden="true">
        {busy ? '⏳' : state === 'ok' ? '✓' : state === 'err' ? '⚠' : currentUrl ? '🖼' : '📷'}
      </span>
      <span className="dev-imgslot-text">
        {busy ? 'Uploading…' : message?.text || `${label} image`}
      </span>
      {/* Only one slot can receive a paste at a time, so say which. */}
      <span className="dev-imgslot-hint">{armed ? 'Ctrl+V here' : 'click to arm'}</span>
    </div>
  );
}

export default function SoloGame({ subject, username, difficulty, onBack, onTryAgain, onChangeSubject, onBackToTopics, topicId, questionsUrl, onComplete, levelLabel, isJourney, providedQuestions, shuffleOptions = true, uworldSkin = false, uwaRemainingToday = 0, uwaCompletionLabel = null, uwaReview = false }) {
  const { settings } = useGameSettings();
  const { study: studyPref } = useTheme();   // Layer 1 chrome renders only when study mode is on
  // Journey ALWAYS renders the full study-layout chrome (burger menu, header
  // timer/hearts, footer with pause + calculator + arrows) regardless of the
  // study preference — but skinned VIBRANT via .jm-vibrant, not the light study
  // look. SoloGameJourney.css replicates the layout rules (which normally live
  // behind html[data-study="on"]) under .jm-vibrant and overrides the study
  // colours at higher specificity. Solo/training still respect the preference.
  // UWorld Adventure renders the same chrome for the same reason — the exam
  // layout IS the mockup's layout (item counter, timer, prev/pause/next footer,
  // Lab Values + Calculator), so it only needs re-skinning, not rebuilding.
  const study = (isJourney || uworldSkin) ? true : studyPref;
  // Per-mode skin gates: SoloGameJourney.css / SoloGameUWorld.css apply solely
  // under their class, so solo/training/BR keep their normal (dark or study) look.
  const screenClass = `screen solo-screen${isJourney ? ' jm-vibrant' : ''}${uworldSkin ? ' uw-exam' : ''}`;

  // The study LAYOUT rules live behind html[data-study="on"], which follows the
  // user's preference. Journey duplicates them under .jm-vibrant; this mode
  // instead turns the attribute on for the length of the session and puts it
  // back afterwards, so there is one copy of the layout rather than three.
  useEffect(() => {
    if (!uworldSkin) return;
    const root = document.documentElement;
    const had = root.dataset.study;
    root.dataset.study = 'on';
    return () => {
      if (had) root.dataset.study = had;
      else delete root.dataset.study;
    };
  }, [uworldSkin]);

  // Hard mode and easy mode each use their own admin-configured timer / explanation
  // time / hide-explanations setting (falling back to legacy generic keys, then literals).
  // UWorld Adventure gets its own fixed, exam-paced timings instead — it always runs
  // with difficulty="easy", so it would otherwise share (and be skewed by) whatever
  // admins configure for easy mode across Solo/Training.
  const isHardMode = difficulty === 'hard';
  const defaultTimer = uworldSkin
    ? 70
    : isHardMode
      ? (settings.hardModeTimer || 30)
      : (settings.easyModeTimer || settings.timerDefault || 20);
  const defaultLives = isJourney ? 5 : (settings.battleRoyaleLives || 3);
  const maxLives = defaultLives;   // heart slots shown = max lives for this mode (5 in journey)
  const explanationTime = uworldSkin
    ? 60
    : isHardMode
      ? (settings.hardModeExplanationTime || 20)
      : (settings.easyModeExplanationTime || settings.explanationTime || 5);
  const hideExplanations = isHardMode
    ? !!settings.hardModeHideExplanations
    : !!settings.easyModeHideExplanations;

  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  // Reset the view to the top on each new question (keyed on the index, so
  // answering/timer ticks don't retrigger it). Attach to the gameplay root.
  const screenRef = useScrollToTopOnChange(qIdx);
  const [lives, setLives] = useState(defaultLives);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultTimer);
  // Pause (Training Grounds + First Aid Journey only — never plain solo, and Battle
  // Royale uses GameRoom not SoloGame). Freezes the countdown + covers the question.
  const canPause = isJourney || !!topicId || !!questionsUrl || !!providedQuestions;
  const [isPaused, setIsPaused] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  // Exam skin only: items flagged for review. Session-scoped — surfaced on the
  // results screen rather than persisted, since there is no review pass yet.
  const [marked, setMarked] = useState(() => new Set());
  // Exam skin only: "End Block" asks for confirmation first — a stray tap used
  // to lose the rest of the block instantly, with no way back.
  const [showEndBlockConfirm, setShowEndBlockConfirm] = useState(false);
  // Exam skin only: has the CURRENT question been rated yet? Gates advancing —
  // see ratedRef below.
  const [rated, setRated] = useState(false);
  // Exam skin only: has the explanation's countdown run out on a question that
  // still hasn't been rated? At that point the question is closed — reading on
  // changes nothing — so the rating row becomes the only thing left to do.
  const [explanationExpired, setExplanationExpired] = useState(false);
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

  // Moderator = a signed-in account the owner has granted the flag to. It buys
  // exactly two powers: authoring OFFICIAL highlights, and pulling a bad question
  // out of circulation mid-game. The server re-checks both — this only decides
  // whether the controls render.
  const [isModerator, setIsModerator] = useState(false);
  useEffect(() => {
    const token = getToken();
    if (!token) { setIsModerator(false); return; }
    let alive = true;
    fetch(`${SERVER_URL}/api/me/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive) setIsModerator(!!d?.moderator); })
      .catch(() => {});   // fail closed: no flag, no controls
    return () => { alive = false; };
  }, []);

  // Retiring a question mid-game.
  const [retireState, setRetireState] = useState(null);   // null | 'saving' | 'done'
  const [retireError, setRetireError] = useState('');
  // Journey levels and bosses are SEPARATE tables (journey_questions,
  // boss_questions) with their own UUID id space — a journey/boss question's
  // id never matches anything in `questions.question_id`, so retiring it
  // through the main-bank route always 404'd with "Question not found". This
  // is the one signal available client-side to tell them apart: questionsUrl
  // is the fetch URL JourneyMode hands SoloGame, and it names its own endpoint.
  // Everything else (plain subject Solo, Training Grounds by topic, UWorld
  // Adventure's providedQuestions) reads from the main `questions` table.
  const retireEndpoint = questionsUrl?.includes('boss-questions')
    ? 'boss-questions'
    : questionsUrl?.includes('journey-questions')
      ? 'journey-questions'
      : 'questions';

  // One click, no dialog. There was a window.prompt for an optional reason here,
  // and it made the button look broken: Chrome returns null from prompt() when
  // it suppresses dialogs (after one has been dismissed, and in embedded
  // contexts), which this read as "cancelled" and silently did nothing.
  // Retiring is reversible from the admin Permissions tab, so a confirm step
  // buys nothing either.
  function retireQuestion(questionId) {
    if (!questionId || retireState === 'saving') return;
    setRetireState('saving');
    // Send BOTH credentials when we have them. moderatorFrom tries the password
    // first and falls through to the JWT, so this survives a stale or wrong
    // usmle_admin_session in localStorage — which previously sent only the bad
    // password and 403'd a user who was a perfectly good moderator.
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (adminSession) headers['x-admin-password'] = adminSession;
    if (token)        headers['Authorization'] = `Bearer ${token}`;
    fetch(`${SERVER_URL}/api/${retireEndpoint}/${encodeURIComponent(questionId)}/retire`, {
      method: 'POST', headers, body: JSON.stringify({}),
    })
      .then(async (r) => {
        if (r.ok) return r.json();
        // Say WHY it failed, on screen. A generic "try again" on a permission
        // or lookup error just sends the moderator round the same loop.
        let detail = `HTTP ${r.status}`;
        try { const e = await r.json(); detail = e.error || detail; } catch {}
        throw new Error(detail);
      })
      .then(() => setRetireState('done'))
      .catch(err => {
        console.error('[retire] failed:', err.message);
        setRetireError(err.message);
        setRetireState(null);
      });
  }
  // Reset the banner when the question changes.
  useEffect(() => { setRetireState(null); setRetireError(''); }, [qIdx]);

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
  const activeSecondsRef   = useRef(0);     // sum of per-question active time (s): answering + explanation
  const revealedAtRef      = useRef(0);     // Date.now() when the explanation was shown, for the line below
  const answeredCountRef   = useRef(0);     // questions answered or timed out this run
  // Ledger of what has ALREADY been posted to /api/study-time this run. Study
  // time is now banked per question rather than once at game-over, so these
  // track the high-water mark and every post sends only the delta above it.
  const sentSecondsRef     = useRef(0);
  const sentQuestionsRef   = useRef(0);
  const runLoggedRef       = useRef(false); // activity_sessions row written for this run
  // Exam skin only. ratedRef mirrors `rated` state but is readable synchronously
  // from doAdvance's closure (avoids a stale-closure read of the state value).
  // doAdvanceRef holds the CURRENT question's doAdvance closure independently of
  // skipActionRef/skipTimerRef, which doAdvance nulls out at its own first line —
  // rate() needs a handle that survives that so it can trigger the same advance
  // logic (explanation-time accounting, game-over check, etc.) after the auto
  // timer has already fired and paused on an unrated question.
  const ratedRef      = useRef(false);
  const doAdvanceRef  = useRef(null);
  const rateRowRef    = useRef(null);   // scrolled to when the explanation timer expires unrated

  revealedRef.current = revealed;
  pausedRef.current = isPaused;
  livesRef.current = lives;
  scoreRef.current = score;
  streakRef.current = streak;
  bestStreakRef.current = bestStreak;
  qIdxRef.current = qIdx;
  questionsRef.current = questions;
  onCompleteRef.current = onComplete;

  // Bank whatever active study seconds have accrued since the last post. Called
  // after EVERY question completes, plus on early exit / unmount / pagehide —
  // so a run that's abandoned, backgrounded or killed keeps every question it
  // actually finished instead of losing the lot at game-over.
  //
  // Sends the DELTA, not the running total: add_study_time is additive, so
  // re-sending the total would credit the same seconds again on each call. The
  // ledger advances by the rounded amount actually sent, so the sub-second
  // remainder carries into the next flush rather than being dropped.
  //
  // Guests (no token) never post, same check as App's handleTrainingComplete.
  // Fire-and-forget: errors are swallowed and the UI never waits on it. Kept in
  // a ref (like onCompleteRef) so processAnswer's useCallback sees the latest.
  const postStudyTime = (useKeepalive = false) => {
    const seconds = Math.round(activeSecondsRef.current - sentSecondsRef.current);
    if (seconds <= 0) return;
    const token = getToken();
    if (!token) return; // guests don't record study time
    // Only feeds the server's per-question ceiling (185s each) — it is not
    // stored. Floored at 1 because a flush can land mid-question, carrying
    // that question's leftover explanation time with no NEW question answered;
    // a 0 there would cap the whole post away.
    const questions = Math.max(1, answeredCountRef.current - sentQuestionsRef.current);
    sentSecondsRef.current += seconds;
    sentQuestionsRef.current = answeredCountRef.current;
    fetch(`${SERVER_URL}/api/study-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        seconds,
        questions,
        date: new Date().toLocaleDateString('en-CA'), // local YYYY-MM-DD
      }),
      ...(useKeepalive ? { keepalive: true } : {}),
    }).catch(() => {});
  };
  const postStudyTimeRef = useRef(postStudyTime);
  postStudyTimeRef.current = postStudyTime;

  // Best-effort flush so an abandoned run still credits its time. Two triggers,
  // both funnelled through postStudyTime so studyTimeSentRef keeps it to one send:
  //  - unmount cleanup: soft exits (Journey Home sets phase state, React unmounts
  //    normally) — this was already correct and is unchanged.
  //  - 'pagehide': HARD exits (solo/training Home runs window.location.href,
  //    which never unmounts React, so cleanup alone silently lost the time).
  // sendBeacon would be the more reliable unload transport, but it cannot set
  // an Authorization header and /api/study-time authenticates via Bearer — so
  // per the endpoint's existing contract we keep fetch(keepalive) instead.
  useEffect(() => {
    const finish = () => {
      postStudyTimeRef.current(true);
      // Teardown deliberately does NOT go through endRunEarly: that can fire
      // onComplete, which sets state on the parent (and for UWorld navigates) —
      // unsafe from an unmount cleanup. The timeline row is the part that would
      // otherwise be lost, and logRunSession is a plain fire-and-forget POST.
      // Its own runLoggedRef keeps pagehide-then-unmount to a single row.
      if (completionFiredRef.current || answeredCountRef.current === 0) return;
      const total = answeredCountRef.current;
      const c     = correctCountRef.current;
      logRunSessionRef.current(total ? Math.round((c / total) * 100) : 0);
    };
    const onPageHide = () => finish();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      finish();
    };
  }, []);

  // Which activity_sessions.game_mode this run belongs to. Derived rather than
  // passed: every distinguishing prop is already here, and the two call sites
  // (App.jsx, UWorldAdventure.jsx) would otherwise both need a new prop that
  // could drift out of step with the skin flags they already send.
  const activityMode = uworldSkin ? 'question_bank_practice'
    : isJourney ? 'journey'
    : topicId ? 'training_grounds'
    : 'solo';

  // Write ONE activity_sessions row for this run, so it appears on the Daily
  // Activity timeline. Deliberately hits the side-effect-free /api/study-session
  // rather than the per-mode completion endpoints: those also award progress
  // (Journey unlocks/mastery, the Training Grounds >=85% folder tick), and an
  // abandoned run must never bank those. keepalive because the Home button
  // navigates with window.location.href, which would otherwise cancel this.
  const logRunSession = (pct) => {
    if (runLoggedRef.current) return;
    const seconds = Math.round(activeSecondsRef.current);
    if (seconds <= 0) return;
    const token = getToken();
    if (!token) return; // guests don't record activity
    runLoggedRef.current = true;
    fetch(`${SERVER_URL}/api/study-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        game_mode: activityMode,
        subject,
        pct,
        seconds,
        level_label: levelLabel || null,
      }),
      keepalive: true,
    }).catch(() => {});
  };
  const logRunSessionRef = useRef(logRunSession);
  logRunSessionRef.current = logRunSession;

  // Every early exit (Home, End Block) funnels through here so leaving mid-run
  // records exactly what was actually done: the outstanding study seconds, and
  // one timeline entry scored against what was ANSWERED so far rather than the
  // full block size. completionFiredRef is the same guard natural game-over
  // uses, so finishing normally and then leaving cannot double-post.
  function endRunEarly() {
    postStudyTimeRef.current(true);
    if (completionFiredRef.current || answeredCountRef.current === 0) return;
    completionFiredRef.current = true;
    const total = answeredCountRef.current;
    const c     = correctCountRef.current;
    const pct   = total ? Math.round((c / total) * 100) : 0;
    // UWorld Adventure's own completion handler writes its activity row AND the
    // daily-block bookkeeping the mode depends on, so it stays the owner of
    // that path. Journey/Training deliberately do NOT go through onComplete
    // here — theirs carries progress the player hasn't earned.
    if (uworldSkin && onCompleteRef.current) {
      onCompleteRef.current({ correct: c, total, pct, activeSeconds: activeSecondsRef.current });
      return;
    }
    logRunSessionRef.current(pct);
  }
  const endRunEarlyRef = useRef(endRunEarly);
  endRunEarlyRef.current = endRunEarly;

  function confirmEndBlock() {
    setShowEndBlockConfirm(false);
    endRunEarly();
    onBack();
  }

  // In-game Home. Solo/Training exit via window.location.href, which never
  // unmounts React — so without this the run's tail was only ever caught by the
  // 'pagehide' study-time flush, and never produced a timeline entry at all.
  function handleHome() {
    endRunEarly();
    onBack();
  }

  // ── Dev-mode inline image authoring ───────────────────────────────────────
  // Drop or paste an image straight onto the question you are playing. Writes
  // to whichever table this game is reading from — retireEndpoint already
  // works that out (main bank / journey level / boss), and all three admin PUT
  // routes take image_url and explanation_image_url.
  //
  // Auth is the admin password already held for official-highlight authoring:
  // same credential, same trust level, no second login on the play page.
  // The armed target carries the QUESTION it was armed for, not just the field.
  // Explanations auto-advance: without this, starting a paste on an explanation
  // and having the timer roll over mid-upload would write the image onto the
  // NEXT question's stem — silently, and to the wrong row in the database.
  const [devImgArmed, setDevImgArmed] = useState({ field: 'image_url', qid: null });
  const [devImgBusy,  setDevImgBusy]  = useState(null);        // field currently uploading
  const [devImgMsg,   setDevImgMsg]   = useState(null);        // { field, kind: 'ok'|'err', text }

  // Show the new image immediately. Matched BY ID rather than by index, since
  // the game may have advanced while the upload was in flight. The patched
  // object goes into both the questions array and the shuffle memo so their
  // identities still match — otherwise the next render sees a new base and
  // reshuffles the options underneath the player mid-question.
  const applyDevImage = useCallback((field, url, qid) => {
    const arr = questionsRef.current;
    const idx = arr.findIndex(x => x.id === qid);
    if (idx === -1) return;
    // ONE patched object shared by the array and the memo — two separate copies
    // would differ by identity and trip the memo's reshuffle check.
    const patched = { ...arr[idx], [field]: url };
    setQuestions(qs => qs.map((x, i) => (i === idx ? patched : x)));
    const memo = shuffledQRef.current;
    if (memo.q && memo.base?.id === qid) {
      shuffledQRef.current = { ...memo, base: patched, q: { ...memo.q, [field]: url } };
    }
  }, []);

  const uploadDevImage = useCallback(async (field, file, qid) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const fail = (text) => {
      setDevImgBusy(null);
      setDevImgMsg({ field, kind: 'err', text });
      setTimeout(() => setDevImgMsg(null), 3200);
    };
    if (!file || !file.type?.startsWith('image/')) return fail('Images only');
    if (!allowed.includes(file.type))              return fail('JPG, PNG or WEBP');
    if (file.size > 5 * 1024 * 1024)               return fail('Max 5MB');

    // Resolve the question the slot/paste was aimed at, NOT whatever happens to
    // be on screen now — an explanation can auto-advance mid-upload.
    const target = qid
      ? questionsRef.current.find(x => x.id === qid)
      : questionsRef.current[qIdxRef.current];
    if (!target?.id) return fail('Question gone');
    if (!adminSession) return fail('Admin session required');

    setDevImgMsg(null);
    setDevImgBusy(field);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const headers = { 'Content-Type': 'application/json', 'x-admin-password': adminSession };
      const upRes = await fetch(`${SERVER_URL}/admin/upload-image`, {
        method: 'POST', headers,
        // A pasted screenshot has no filename; the server only uses it for the
        // storage key's suffix, so any stable name works.
        body: JSON.stringify({ base64, filename: file.name || 'pasted.png', mimeType: file.type }),
      });
      const upData = await upRes.json().catch(() => ({}));
      if (!upRes.ok) throw new Error(upData.error || `Upload failed (${upRes.status})`);

      const putRes = await fetch(`${SERVER_URL}/admin/${retireEndpoint}/${encodeURIComponent(target.id)}`, {
        method: 'PUT', headers, body: JSON.stringify({ [field]: upData.url }),
      });
      const putData = await putRes.json().catch(() => ({}));
      if (!putRes.ok) throw new Error(putData.error || `Save failed (${putRes.status})`);

      applyDevImage(field, upData.url, target.id);
      setDevImgBusy(null);
      setDevImgMsg({ field, kind: 'ok', text: 'Saved' });
      setTimeout(() => setDevImgMsg(null), 2000);
    } catch (err) {
      fail(err.message || 'Failed');
    }
  }, [adminSession, retireEndpoint, applyDevImage]);

  // Ctrl+V anywhere on the page while dev mode is on. Recomputed from state
  // rather than reusing `authoringOfficial` below, because that is derived
  // AFTER this component's early returns — a hook depending on it would run
  // conditionally. Same inputs, so the two never disagree.
  const devImageAuthoring = (!!adminSession || isModerator) && devHlMode;

  // Read the armed target through a ref so the listener below doesn't need
  // re-binding every time it changes.
  const devImgArmedRef = useRef(devImgArmed);
  devImgArmedRef.current = devImgArmed;

  useEffect(() => {
    if (!devImageAuthoring) return;
    const onPaste = (e) => {
      // Ignore pastes aimed at a real input — a dev typing into a field should
      // still get normal paste behaviour.
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type?.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const { field, qid } = devImgArmedRef.current;
            uploadDevImage(field, file, qid);
          }
          return;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [devImageAuthoring, uploadDevImage]);

  // Point Ctrl+V at whichever half is actually on screen: the stem while the
  // question is live, the explanation once it is revealed. Clicking either slot
  // still overrides this.
  useEffect(() => {
    setDevImgArmed({
      field: revealed ? 'explanation_image_url' : 'image_url',
      qid: questionsRef.current[qIdxRef.current]?.id ?? null,
    });
  }, [revealed, qIdx]);

  // Stable per-question id (survives the option shuffle — shuffle keeps `id`).
  const currentQid = questions[qIdx]?.id;

  // Fetch this question's highlights on question LOAD (not gated behind reveal) so
  // the stem's official bold/italic format spans (region='question') — the hints —
  // are available DURING the question and toggle live with "Show hints". Explanation
  // highlights come down in the same payload; they just aren't shown until reveal.
  // Soft auth: a logged-in user also gets their own highlights (Bearer); guests get
  // the official ones. Degrades silently to [] on any error / missing table.
  useEffect(() => {
    setHighlights([]); // clear stale highlights from the previous question
    if (!currentQid) return;
    let cancelled = false;
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(currentQid)}/highlights`, { headers })
      .then(r => (r.ok ? r.json() : { highlights: [] }))
      .then(data => { if (!cancelled) setHighlights((data.highlights || []).map(normalizeHighlightRow)); })
      .catch(() => { if (!cancelled) setHighlights([]); });
    return () => { cancelled = true; };
  }, [currentQid]);

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
    // Pre-fetched pool (UWorld Adventure): play exactly this array and skip the
    // fetch entirely. The caller owns the selection — which questions, in which
    // order — so nothing here re-derives it.
    //
    // The array reference MUST be stable across renders (UWorldAdventure holds it
    // in state, set once per session start); a freshly-built array every render
    // would re-fire this effect and reset the run mid-question.
    if (providedQuestions) {
      if (providedQuestions.length === 0) {
        setNoQuestionsFound(true);
        setNoQuestionsMessage('No unseen questions left for this subject. You have finished the bank!');
        setLoading(false);
        return;
      }
      setQuestions(providedQuestions);
      setLoading(false);
      return;
    }

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
  }, [subject, topicId, difficulty, questionsUrl, providedQuestions]);

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
    revealedAtRef.current = Date.now(); // explanation is on screen from this instant
    setRevealed(true);
    setSelected(label);
    // Exam skin only: a fresh question always starts unrated and with its
    // explanation deadline unexpired, regardless of what the previous
    // question's state left behind.
    ratedRef.current = false;
    setRated(false);
    setExplanationExpired(false);

    // q.correct is now stored as letter (A, B, C...), label is also letter
    console.log('[SoloGame] Answer check:', {
      submittedLabel: label,
      qCorrect: q.correct,
      match: label === q.correct
    });
    const correct = label === q.correct;
    // Additive: a timeout (label === null) still counts as SEEN, just not answered.
    // Skipped entirely during a review pass (uwaReview) — reviewing an
    // already-rated question must never move the 3,659-question completion
    // total or the daily pace, and this POST is the only thing that would.
    if (!uwaReview) postQuestionSeen(q, { answered: label !== null, correct });
    const tl = timeLeftRef.current;
    setTimeSpent(defaultTimer - tl);   // Layer 1: additive only — no flow/timer/scoring change
    // Study time, answering phase: inherently capped at defaultTimer, so an
    // idle/backgrounded question can't log a huge value. The EXPLANATION phase
    // is added separately in doAdvance below, once we know how long it was
    // actually on screen (auto-advance vs an early manual skip both end there).
    activeSecondsRef.current += (defaultTimer - tl);
    answeredCountRef.current += 1;
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
      // A question bank is not a survival game: in the exam skin a wrong answer
      // costs nothing but the mark, and the block runs to its last item. Without
      // this, a player's daily set could end three questions in.
      if (!uworldSkin) newLives = Math.max(0, newLives - 1);
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
      // Exam skin only: an unrated question never advances on its own — the
      // explanation timer expiring just stops here rather than moving on, and
      // the rating row is the only way to actually leave. rate() calls
      // doAdvanceRef.current() directly once a rating is picked, re-entering
      // this same closure.
      //
      // The question is CLOSED at this point — reading further changes nothing
      // — so rather than silently stalling on an explanation the player can no
      // longer act on, bring the rating row to them: flag the deadline (the
      // prompt and the row restyle) and scroll it into view.
      if (uworldSkin && !ratedRef.current) {
        setExplanationExpired(true);
        rateRowRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center',
        });
        return;
      }
      skipTimerRef.current  = null;
      skipActionRef.current = null;
      // Explanation phase: however long it was actually on screen, whether the
      // timeout fired naturally or the player hit Next early. revealedAtRef is
      // stamped the instant the explanation appears, a few lines up. Clamped to
      // the delay auto-advance itself uses — a tab left open and walked away
      // from can't inflate this past what the UI ever intended to show, same
      // spirit as the answer phase being capped at defaultTimer.
      const explanationSecs = (Date.now() - revealedAtRef.current) / 1000;
      activeSecondsRef.current += Math.max(0, Math.min(explanationSecs, explanationDelay / 1000));
      // This question is finished — bank its time NOW rather than waiting for
      // game-over. A run that's later abandoned, backgrounded or force-closed
      // keeps every question up to this point instead of losing all of them.
      postStudyTimeRef.current();
      if (newLives === 0 || exhausted) {
        audio.stopGameMusic();
        const hi    = getHi(subject);
        const newHi = newScore > hi;
        if (newHi) saveHi(subject, newScore);
        setFinalScore(newScore);
        setFinalBestStreak(newBest);
        setIsNewHi(newHi);
        setGameOver(true);
        if (!completionFiredRef.current) {
          completionFiredRef.current = true;
          const total = questionsRef.current.length;
          const c = correctCountRef.current;
          const pct = total ? Math.round((c / total) * 100) : 0;
          if (onCompleteRef.current) {
            onCompleteRef.current({ correct: c, total, pct, activeSeconds: activeSecondsRef.current });
          } else {
            // Plain Solo has no completion handler, so nothing else would ever
            // write its activity row — it was the one mode absent from the
            // Daily Activity timeline even when finished properly.
            logRunSessionRef.current(pct);
          }
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
    doAdvanceRef.current  = doAdvance;
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

  // Exam skin only: rating IS the advance action, same as HY Flashcards' own
  // rate() — there is no separate Next button once revealed. Posts the rating
  // (independent of postQuestionSeen/uwaReview — a rating never affects the
  // 3,659 completion total either way, it is purely the student's own
  // judgement) then re-enters the SAME doAdvance closure the auto-timer
  // already paused on, via doAdvanceRef rather than skipActionRef (which
  // doAdvance's own early-return left unconsumed, still pointing at itself,
  // but going through the same ref two different call sites use would be
  // fragile — doAdvanceRef is the one guaranteed not to have been nulled).
  function rate(ratingKey) {
    if (ratedRef.current) return; // ignore a double-tap while already advancing
    ratedRef.current = true;
    setRated(true);
    const q = (shuffledQRef.current && shuffledQRef.current.qIdx === qIdxRef.current && shuffledQRef.current.q)
      ? shuffledQRef.current.q
      : questionsRef.current[qIdxRef.current];
    postQuestionRating(q, ratingKey);
    if (skipTimerRef.current) { clearTimeout(skipTimerRef.current); skipTimerRef.current = null; }
    doAdvanceRef.current?.();
  }

  if (loading) {
    return (
      <div className={screenClass}>
        <div className="waiting-screen"><div className="spinner" /><p>Loading questions…</p></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={screenClass}>
        <div className="solo-card"><p className="error-msg">{fetchError}</p><button className="btn-start" onClick={onBack}>Back</button></div>
      </div>
    );
  }

  if (noQuestionsFound) {
    return (
      <div className={`no-questions-screen${isJourney ? ' jm-vibrant' : ''}`}>
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
      <div className={screenClass}>
        <div className="solo-gameover">
          {/* "Game Over" is a survival-game word, and nothing was survived here
              — the block simply ran out of items. */}
          <h2>{uworldSkin ? 'Block Complete' : 'Game Over'}</h2>
          {uworldSkin && marked.size > 0 && (
            <p className="sgo-level-label">
              ⚑ {marked.size} item{marked.size === 1 ? '' : 's'} marked for review
            </p>
          )}
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
  // shuffleOptions=false serves the choices exactly as authored (Journey's "In
  // order"). The ref is still populated the same way so processAnswer and the
  // render keep reading one identical object — only the ordering differs.
  if (shuffledQRef.current.qIdx !== qIdx || shuffledQRef.current.base !== baseQ) {
    const { options, correct } = shuffleOptions
      ? shuffleQuestionOptions(baseQ.options || [], baseQ.correct)
      : { options: baseQ.options || [], correct: baseQ.correct };
    shuffledQRef.current = { qIdx, base: baseQ, q: { ...baseQ, options, correct } };
  }
  const q = shuffledQRef.current.q;

  // ── Explanation highlighting (per-user + official) ──────────────────────────
  const loggedIn = !!getToken();
  // Admin session (the admin password) enables developer mode. The server is the
  // real gate — this only decides whether the toggle/UI shows. `adminSession` is
  // state (above), so the in-game `?dev=1` unlock reflects immediately.
  // A granted moderator counts the same as an admin session for these controls.
  const isAdminSession = !!adminSession || isModerator;
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
    if (official && !isAdminSession) return; // official authoring needs admin/moderator
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
    // Both when available — the server tries the password, then the JWT, so a
    // stale stored password can't lock out a genuine moderator.
    if (official && adminSession) headers['x-admin-password'] = adminSession;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const body = {
      start_offset: payload.start, end_offset: payload.end,
      region, scope: official ? 'official' : 'user',
      quote: payload.quote, prefix: payload.prefix, suffix: payload.suffix,
    };
    if (isFormat) body.format = payload.format; else body.color = payload.color;
    fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(q.id)}/highlights`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (r.ok) return r.json();
        // Surface the server's reason instead of failing silently.
        let detail = `HTTP ${r.status}`;
        try { const e = await r.json(); detail = e.detail || e.error || detail; } catch {}
        console.error(`[highlight save] failed (${region}, ${isFormat ? `format=${payload.format}` : `color=${payload.color}`}):`, detail);
        return null;
      })
      .then(data => {
        if (data?.highlight) {
          setHighlights(hs => hs.map(h => (h.id === tmpId ? normalizeHighlightRow(data.highlight) : h)));
        } else {
          setHighlights(hs => hs.filter(h => h.id !== tmpId)); // roll back on failure
        }
      })
      .catch((err) => {
        console.error('[highlight save] network error:', err);
        setHighlights(hs => hs.filter(h => h.id !== tmpId));
      });
  }

  function handleRemoveRange(region, start, end) {
    const token = getToken();
    const pool = region === 'question' ? stemDisplayHighlights : displayHighlights;
    const targets = pool.filter(
      h => h.start < end && h.end > start && !String(h.id).startsWith('tmp-')
    );
    const deletable = targets.filter(
      h => (h.scope === 'user' && token) || (h.scope === 'official' && isAdminSession)
    );
    if (!deletable.length) return;
    const ids = deletable.map(h => h.id);
    setHighlights(hs => hs.filter(h => !ids.includes(h.id)));
    deletable.forEach(h => {
      const headers = {};
      if (h.scope === 'official' && adminSession) headers['x-admin-password'] = adminSession;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(q.id)}/highlights/${encodeURIComponent(h.id)}`, {
        method: 'DELETE', headers,
      }).catch(() => {});
    });
  }

  const pct = (timeLeft / defaultTimer) * 100;
  const tier = timeLeft > 10 ? 'green' : timeLeft > 5 ? 'yellow' : 'red';

  // Exam skin, explanation time expired, still unrated: the question is closed,
  // so the stem, the options and the explanation are all withdrawn and only the
  // rating row is left (see .uw-timeup in SoloGameUWorld.css). Hiding the
  // content — rather than trying to pin the scroll position — is what actually
  // makes it unreachable: the rating row is the LAST element on the page, so
  // there is no way to scroll it to the top and push the question off-screen,
  // and a scroll lock would still leave the stem sitting in view above it.
  const timeUpLock = uworldSkin && explanationExpired && !rated;

  return (
    <div className={`${screenClass}${timeUpLock ? ' uw-timeup' : ''}`} ref={screenRef}>
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

      {/* The exam skin is always the full-width sheet of the mockup: the
          explanation appears BELOW the item after answering rather than taking
          half the width while the stem is still being read. */}
      <div className="solo-body" data-expl-layout={study ? (uworldSkin ? 'below' : explLayout) : undefined}>
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
                {isJourney && levelLabel && <span className="stb-id">{levelLabel}</span>}
                {uworldSkin && q?.id && <span className="stb-id">Question Id: {q.id}</span>}
              </div>
              {uworldSkin && (
                <button
                  type="button"
                  className={`uw-mark${marked.has(qIdx) ? ' is-marked' : ''}`}
                  onClick={() => setMarked(m => {
                    const next = new Set(m);
                    if (next.has(qIdx)) next.delete(qIdx); else next.add(qIdx);
                    return next;
                  })}
                  title="Mark this item for review"
                >
                  <span className="uw-mark-flag" aria-hidden="true">⚑</span>
                  Mark
                </button>
              )}
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
              {/* No hearts in the exam skin — they would be lying, since a wrong
                  answer costs nothing here. End Block replaces them. */}
              {uworldSkin ? (
                <button type="button" className="uw-endblock" onClick={() => setShowEndBlockConfirm(true)} title={uwaReview ? 'End this review' : 'End this block'}>
                  <span className="uw-endblock-icon" aria-hidden="true">⬢</span>
                  {uwaReview ? 'End Review' : 'End Block'}
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}

        {/* End Block confirm — live remaining-today is uwaRemainingToday (the
            adventure's daily pace still owed as of this block's START) minus
            what THIS block has answered so far, so it stays accurate as the
            block plays without another server round trip. */}
        {uworldSkin && showEndBlockConfirm && (
          <div className="uw-endblock-overlay" onClick={() => setShowEndBlockConfirm(false)}>
            <div className="uw-endblock-card" onClick={e => e.stopPropagation()}>
              <h3 className="uw-endblock-title">{uwaReview ? 'End this review?' : 'End this block?'}</h3>
              <p className="uw-endblock-msg">
                {(() => {
                  // A review pass never touches the daily pace (uwaReview skips
                  // postQuestionSeen entirely), so the remaining-today math
                  // below would be true but misleading here — say so plainly
                  // instead, echoing the "doesn't count" guarantee the pile
                  // picker already promises.
                  if (uwaReview) {
                    return "Reviewing doesn't count toward today's pace or your overall progress — end whenever you like.";
                  }
                  const remaining = Math.max(0, uwaRemainingToday - answeredCountRef.current);
                  if (remaining === 0) {
                    return "You've already hit today's goal — nice work! Ending now won't change that.";
                  }
                  return uwaCompletionLabel
                    ? <>You'll have <strong>{remaining}</strong> question{remaining === 1 ? '' : 's'} left today to stay on pace to finish by <strong>{uwaCompletionLabel}</strong>.</>
                    : <>You'll have <strong>{remaining}</strong> question{remaining === 1 ? '' : 's'} left to hit today's goal.</>;
                })()}
              </p>
              <div className="uw-endblock-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEndBlockConfirm(false)}>
                  Keep Going
                </button>
                <button type="button" className="btn-start uw-endblock-confirm-btn" onClick={confirmEndBlock}>
                  {uwaReview ? 'End Review' : 'End Block'}
                </button>
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
          {authoringOfficial && (
            <DevImageSlot
              field="image_url"
              label="Stem"
              qid={q?.id}
              armed={devImgArmed.field === 'image_url'}
              busy={devImgBusy === 'image_url'}
              message={devImgMsg?.field === 'image_url' ? devImgMsg : null}
              currentUrl={q?.image_url}
              onArm={() => setDevImgArmed({ field: 'image_url', qid: q?.id ?? null })}
              onFile={uploadDevImage}
            />
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
            {/* Reuses rr-skip-btn so every skin's existing theming (base/Journey/
                UWorld) applies for free; .srs-next-btn only adds the push to the
                far right (the strip is already a flex row in every skin). Same
                handler as the button below the explanation — this is just a
                closer way to reach it without scrolling past the explanation
                first. Omitted in the exam skin: rating (below the explanation)
                is the only way to advance there, so a shortcut past it would
                defeat the point. */}
            {!uworldSkin && (
              <button className="rr-skip-btn srs-next-btn" onClick={handleSkip}>Next Question →</button>
            )}
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
              {isAdminSession && (
                <div className="mod-retire-bar">
                  {retireState === 'done' ? (
                    <span className="mod-retire-done">
                      ✅ Pulled from circulation — it will not be served again. Restore it from
                      the admin Permissions tab if that was a mistake.
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="mod-retire-btn"
                        disabled={retireState === 'saving'}
                        onClick={() => retireQuestion(q.id)}
                        title="Pull this question out of circulation for review"
                      >
                        {retireState === 'saving' ? 'Removing…' : '🚫 Flag as a bad question'}
                      </button>
                      {retireError && <span className="mod-retire-err">Couldn&apos;t remove it — {retireError}</span>}
                    </>
                  )}
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
              {authoringOfficial && (
                <DevImageSlot
                  field="explanation_image_url"
                  label="Explanation"
                  qid={q?.id}
                  armed={devImgArmed.field === 'explanation_image_url'}
                  busy={devImgBusy === 'explanation_image_url'}
                  message={devImgMsg?.field === 'explanation_image_url' ? devImgMsg : null}
                  currentUrl={q?.explanation_image_url}
                  onArm={() => setDevImgArmed({ field: 'explanation_image_url', qid: q?.id ?? null })}
                  onFile={uploadDevImage}
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
            {/* Exam skin: rating replaces the Next button entirely — picking a
                rating IS the advance action (rate()), same as HY Flashcards.
                An unrated question also never auto-advances (doAdvance's own
                guard), so this row is the only way off the screen. */}
            {uworldSkin ? (
              <div
                ref={rateRowRef}
                className={`uw-rate-row${explanationExpired && !rated ? ' uw-rate-row--due' : ''}`}
                role="group"
                aria-label="Rate your recall"
              >
                <p className="uw-rate-prompt" aria-live="polite">
                  {rated
                    ? '✓ Rated — advancing…'
                    : explanationExpired
                      ? '⏱ Time’s up — rate your recall to continue'
                      : 'Rate your recall to continue'}
                </p>
                <div className="uw-rate-buttons">
                  {UWORLD_RATINGS.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      className={`uw-rate-btn uw-rate-btn--${r.key}`}
                      disabled={rated}
                      onClick={() => rate(r.key)}
                    >
                      <span aria-hidden="true">{r.icon}</span> {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rr-skip-row">
                <button className="rr-skip-btn" onClick={handleSkip}>Next Question →</button>
              </div>
            )}
          </div>
        )}

        {study && (
          <div className="study-statusbar">
            <div className="ssb-left">
              <button className="ssb-home" onClick={handleHome} title="Home">⌂ <span className="ssb-btn-label">Home</span></button>
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
