import { useState, useEffect, useRef } from 'react';

const LABELS = ['A', 'B', 'C', 'D'];

function Timer({ timeLimit, active, questionId, onTick }) {
  const [left, setLeft] = useState(timeLimit);
  const ref = useRef(null);

  useEffect(() => {
    setLeft(timeLimit);
    if (!active) return;
    ref.current = setInterval(() => setLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(ref.current);
  }, [timeLimit, active, questionId]);

  useEffect(() => {
    if (active && left <= 5 && left > 0 && onTick) onTick();
  }, [left, active, onTick]);

  const pct  = (left / timeLimit) * 100;
  const tier = left > 10 ? 'green' : left > 5 ? 'yellow' : 'red';
  return (
    <div className="timer-wrap">
      <div className={`timer-number ${tier}`}>{left}s</div>
      <div className="timer-track">
        <div className={`timer-fill ${tier}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SpeedRaceGame({
  question,
  round,
  timeLimit,
  myAnswer,
  hasAnswered,
  raceProgress,
  answerResult,
  onAnswer,
  username,
  onTick,
  streaks = {},
}) {
  const GOAL = 20;
  const sortedProgress = [...(raceProgress || [])].sort((a, b) => b.correct - a.correct);

  return (
    <div className="screen game-screen speed-race-screen">

      {/* Race progress panel */}
      <div className="race-panel">
        <div className="race-panel-title">⚡ Speed Race — First to {GOAL} wins!</div>
        {sortedProgress.map(p => {
          const streak = p.streak || streaks[p.id] || 0;
          return (
          <div key={p.id} className={`race-row ${p.username === username ? 'race-row-me' : ''}`}>
            <div className="race-row-name">
              {p.position && <span className="race-medal">#{p.position} </span>}
              {p.username === username ? `${p.username} (you)` : p.username}
              {streak >= 1 && (
                <span className={`streak-badge ${streak >= 3 ? 'on-fire' : ''}`}>🔥{streak}</span>
              )}
            </div>
            <div className="race-bar-track">
              <div
                className="race-bar-fill"
                style={{ width: `${Math.min(100, (p.correct / GOAL) * 100)}%` }}
              />
            </div>
            <div className="race-count">{p.correct}/{GOAL}</div>
          </div>
          );
        })}
      </div>

      {/* Question panel */}
      <div className="race-question-panel">
        <div className="round-indicator">Round {round}</div>

        {question ? (
          <>
            <Timer
              timeLimit={timeLimit}
              active={!hasAnswered}
              questionId={question.id}
              onTick={onTick}
            />

            <div className="question-text">{question.question}</div>

            <div className="options-grid">
              {LABELS.map((opt, i) => {
                const val = question.options[i];
                let cls = 'option-btn';
                if (answerResult) {
                  if (opt === answerResult.correctAnswer) cls += ' correct';
                  else if (opt === myAnswer) cls += ' wrong';
                } else if (myAnswer === opt) {
                  cls += ' selected';
                }
                return (
                  <button key={opt} className={cls}
                    onClick={() => onAnswer(opt)}
                    disabled={hasAnswered}>
                    <span className="opt-label">{opt}</span>
                    <span className="opt-text">{val}</span>
                  </button>
                );
              })}
            </div>

            {answerResult && (
              <div className={`answer-feedback ${answerResult.correct ? 'correct' : 'wrong'}`}>
                {answerResult.correct
                  ? `✓ Correct! (${answerResult.score}/${GOAL})`
                  : `✗ Wrong — Answer: ${answerResult.correctAnswer}`}
              </div>
            )}
          </>
        ) : (
          <div className="waiting-msg">Get ready…</div>
        )}
      </div>
    </div>
  );
}
