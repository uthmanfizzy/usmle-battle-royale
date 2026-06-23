import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { useTheme } from '../theme';
import * as audio from '../audio';
import ExplanationText from './ExplanationText';
import { parseRichText } from '../utils/parseRichText';
import Calculator from './Calculator';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

function getHi(subject) {
  try { return parseInt(localStorage.getItem(`usmle-hs-${subject}`) || '0', 10); } catch { return 0; }
}
function saveHi(subject, score) {
  try { localStorage.setItem(`usmle-hs-${subject}`, String(score)); } catch {}
}

export default function SoloGame({ subject, username, difficulty, onBack, onTryAgain, onChangeSubject, onBackToTopics, topicId, questionsUrl, onComplete, levelLabel, isJourney }) {
  const { settings } = useGameSettings();
  const { study: studyPref } = useTheme();   // Layer 1 chrome renders only when study mode is on
  // Journey always renders the plain (training-style) single-pane game screen,
  // never the two-pane study chrome — even when study mode is globally enabled.
  const study = isJourney ? false : studyPref;

  // Hard mode and easy mode each use their own admin-configured timer / explanation
  // time / hide-explanations setting (falling back to legacy generic keys, then literals)
  const isHardMode = difficulty === 'hard';
  const defaultTimer = isHardMode
    ? (settings.hardModeTimer || 30)
    : (settings.easyModeTimer || settings.timerDefault || 20);
  const defaultLives = isJourney ? 5 : (settings.battleRoyaleLives || 3);
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
  const [noQuestionsFound, setNoQuestionsFound] = useState(false);
  const [noQuestionsMessage, setNoQuestionsMessage] = useState('');

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
  const livesRef      = useRef(defaultLives);
  const scoreRef      = useRef(0);
  const streakRef     = useRef(0);
  const bestStreakRef = useRef(0);
  const qIdxRef       = useRef(0);
  const questionsRef  = useRef([]);
  const skipTimerRef  = useRef(null);
  const skipActionRef = useRef(null);
  const correctCountRef    = useRef(0);
  const completionFiredRef = useRef(false);
  const onCompleteRef      = useRef(onComplete);

  revealedRef.current = revealed;
  livesRef.current = lives;
  scoreRef.current = score;
  streakRef.current = streak;
  bestStreakRef.current = bestStreak;
  qIdxRef.current = qIdx;
  questionsRef.current = questions;
  onCompleteRef.current = onComplete;

  // Start / stop game music with this component's lifetime
  useEffect(() => {
    audio.stopBgMusic();
    audio.startGameMusic();
    return () => audio.stopGameMusic();
  }, []);

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

    const q = questionsRef.current[qIdxRef.current];
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

    timerRef.current = setInterval(() => {
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

  const q = questions[qIdx];
  if (!q) return null;

  const pct = (timeLeft / defaultTimer) * 100;
  const tier = timeLeft > 10 ? 'green' : timeLeft > 5 ? 'yellow' : 'red';

  return (
    <div className="screen solo-screen">
      {!study && (
        <div className="solo-topbar">
          {levelLabel && <span className="topbar-level-label">{levelLabel}</span>}
          <span className="topbar-round">Q {qIdx + 1}</span>
          <span className="topbar-score">🏅 {score} pts</span>
          <div className="lives-bar">
            {[1, 2, 3].map(i => (
              <span key={i} className={`heart-icon ${i > lives ? 'dead' : ''}`}>
                {i <= lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>
      )}

      {streak >= 2 && <div className="streak-badge">🔥 {streak} streak!</div>}

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
              <div className="lives-bar">
                {[1, 2, 3].map(i => (
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
          <p className="question-text">{q.question}</p>
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
                  <span className="opt-text">{opt}</span>
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
              <strong>Correct answer: {q.correct}</strong>
              {!hideExplanations && <ExplanationText text={q.explanation} />}
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
              <button className="ssb-home" onClick={onBack} title="Home">⌂ Home</button>
            </div>
            <div className="ssb-arrows">
              <button className="stb-arrow" disabled title="Previous (not available)">←</button>
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
                🧮 Calculator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
