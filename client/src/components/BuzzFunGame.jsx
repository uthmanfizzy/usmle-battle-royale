import { useState, useEffect, useRef } from 'react';
import './BuzzFunGame.css';

const BUZZ_TYPE_LABELS = {
  BUZZWORD:    { label: 'BUZZWORD',    color: '#e67e22' },
  TRIAD:       { label: 'TRIAD',       color: '#e74c3c' },
  ASSOCIATION: { label: 'ASSOCIATION', color: '#9b59b6' },
  SIDE_EFFECT: { label: 'SIDE EFFECT', color: '#27ae60' },
};

const LETTERS = ['A', 'B', 'C', 'D'];

export default function BuzzFunGame({
  question, round, timeLimit, myAnswer, hasAnswered,
  answeredCount, totalAlive, myScore, players,
  answerResult, roundResults, showingRoundResult,
  onAnswer, username, onTick,
}) {
  const [timeLeft,    setTimeLeft]    = useState(timeLimit || 8);
  const [flashState,  setFlashState]  = useState(null); // 'correct' | 'wrong' | null
  const [revealCorrect, setRevealCorrect] = useState(false);
  const timerRef = useRef(null);

  // Reset timer when a new question arrives
  useEffect(() => {
    if (!question) return;
    setTimeLeft(timeLimit || 8);
    setFlashState(null);
    setRevealCorrect(false);
    clearInterval(timerRef.current);

    const start = Date.now();
    const total = (timeLimit || 8) * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, Math.ceil((total - elapsed) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 3 && remaining > 0 && onTick) onTick();
      if (remaining === 0) clearInterval(timerRef.current);
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [question?.id]);

  // Handle answer result animation
  useEffect(() => {
    if (!answerResult) return;
    clearInterval(timerRef.current);
    if (answerResult.correct) {
      setFlashState('correct');
    } else {
      setFlashState('wrong');
      setTimeout(() => setRevealCorrect(true), 400);
    }
  }, [answerResult]);

  if (!question) {
    return (
      <div className="bf-screen">
        <div className="bf-waiting">
          <div className="bf-spinner" />
          <p>Waiting for first card…</p>
        </div>
      </div>
    );
  }

  const buzzType    = BUZZ_TYPE_LABELS[question.buzz_type] || BUZZ_TYPE_LABELS.BUZZWORD;
  const totalRounds = question.totalRounds || 30;
  const progress    = ((round - 1) / totalRounds) * 100;
  const timerPct    = (timeLeft / (timeLimit || 8)) * 100;
  const timerColor  = timerPct > 50 ? '#e67e22' : timerPct > 25 ? '#e74c3c' : '#c0392b';

  const sortedPlayers = players
    ? [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
    : [];

  if (showingRoundResult && roundResults) {
    const sorted = [...(roundResults.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
    return (
      <div className="bf-screen">
        <div className="bf-round-result">
          <div className="bf-rr-header">
            <div className="bf-rr-answer">
              <span className="bf-rr-label">Correct answer:</span>
              <span className="bf-rr-correct">{roundResults.correctAnswer}</span>
            </div>
            {roundResults.explanation && (
              <p className="bf-rr-explanation">{roundResults.explanation}</p>
            )}
          </div>
          <div className="bf-rr-scores">
            {sorted.map((p, i) => (
              <div key={p.id} className={`bf-rr-row ${p.username === username ? 'bf-rr-me' : ''}`}>
                <span className="bf-rr-rank">{i + 1}</span>
                <span className="bf-rr-name">{p.username}</span>
                <span className="bf-rr-score">{p.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bf-screen">
      {/* Progress bar (top) */}
      <div className="bf-progress-track">
        <div className="bf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="bf-meta">
        <span className="bf-round-label">Card {round} of {totalRounds}</span>
        <span className="bf-answered-label">{answeredCount}/{totalAlive} answered</span>
        <span className="bf-score-label">⚡ {myScore || 0}</span>
      </div>

      {/* Timer bar */}
      <div className="bf-timer-track">
        <div
          className="bf-timer-fill"
          style={{
            width: `${timerPct}%`,
            background: timerColor,
            transition: hasAnswered ? 'none' : 'width 0.25s linear, background 0.25s',
          }}
        />
      </div>

      {/* Main card */}
      <div className={`bf-card ${flashState ? `bf-card-${flashState}` : ''}`}>
        <div className="bf-type-badge" style={{ background: buzzType.color }}>
          {buzzType.label}
        </div>

        <div className="bf-term">{question.question}</div>

        {/* Answer options */}
        <div className="bf-options">
          {question.options.map((opt, i) => {
            const letter   = LETTERS[i];
            const selected = myAnswer === letter;
            const isCorrect = revealCorrect && letter === answerResult?.correctAnswer;
            const isWrong   = revealCorrect && selected && !answerResult?.correct;

            let cls = 'bf-opt';
            if (!hasAnswered)       cls += ' bf-opt-active';
            if (selected)           cls += ' bf-opt-selected';
            if (isCorrect)          cls += ' bf-opt-reveal-correct';
            if (isWrong)            cls += ' bf-opt-reveal-wrong';

            return (
              <button
                key={letter}
                className={cls}
                onClick={() => !hasAnswered && onAnswer(letter)}
                disabled={hasAnswered}
              >
                <span className="bf-opt-letter">{letter}</span>
                <span className="bf-opt-text">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback overlay */}
        {answerResult && (
          <div className={`bf-feedback ${answerResult.correct ? 'bf-fb-correct' : 'bf-fb-wrong'}`}>
            {answerResult.correct
              ? `✓ +${answerResult.pointsEarned || 100} pts`
              : `✗ Wrong — correct: ${answerResult.correctAnswer}`}
          </div>
        )}
      </div>

      {/* Mini leaderboard */}
      {sortedPlayers.length > 0 && (
        <div className="bf-leaderboard">
          {sortedPlayers.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`bf-lb-row ${p.username === username ? 'bf-lb-me' : ''}`}>
              <span className="bf-lb-rank">{i + 1}</span>
              <span className="bf-lb-name">{p.username}</span>
              <span className="bf-lb-score">{p.score || 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
