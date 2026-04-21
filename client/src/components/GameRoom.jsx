import { useState, useEffect, useRef } from 'react';

const LABELS = ['A', 'B', 'C', 'D'];

function Timer({ timeLimit, active, questionId, onTick }) {
  const [left, setLeft] = useState(timeLimit);
  const ref = useRef(null);

  useEffect(() => {
    setLeft(timeLimit);
    if (!active) return;
    ref.current = setInterval(() => {
      setLeft((t) => {
        const next = Math.max(0, t - 1);
        return next;
      });
    }, 1000);
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
        <div
          className={`timer-fill ${tier}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Hearts({ count }) {
  return (
    <div className="lives-bar">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`heart-icon ${i > count ? 'dead' : ''}`}>
          {i <= count ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  );
}

export default function GameRoom({
  question,
  round,
  timeLimit,
  myAnswer,
  hasAnswered,
  answeredCount,
  totalAlive,
  myLives,
  myScore,
  isAlive,
  players,
  answerResult,
  roundResults,
  showingRoundResult,
  onAnswer,
  username,
  onTick,
}) {
  if (!question) {
    return (
      <div className="screen game-screen">
        <div className="waiting-screen">
          <div className="spinner" />
          <p>Preparing the next question…</p>
        </div>
      </div>
    );
  }

  const timerActive = !hasAnswered && isAlive && !showingRoundResult;

  return (
    <div className="screen game-screen">
      {/* Fixed top bar */}
      <div className="game-topbar">
        <span className="topbar-round">Round {round}</span>
        <span className="topbar-score">🏅 {myScore} pts</span>
        <Hearts count={myLives} />
      </div>

      <div className="game-layout">
        {/* Main question column */}
        <div className="game-center">
          {!showingRoundResult && (
            <Timer
              key={question.id}
              timeLimit={timeLimit}
              active={timerActive}
              questionId={question.id}
              onTick={onTick}
            />
          )}

          <div className="question-card">
            <p className="question-text">{question.question}</p>

            <div className="options">
              {question.options.map((opt, i) => {
                const label    = LABELS[i];
                const isMine   = myAnswer === label;
                const isRight  = showingRoundResult && roundResults?.correctAnswer === label;
                const isWrong  = showingRoundResult && isMine && roundResults?.correctAnswer !== label;

                return (
                  <button
                    key={i}
                    className={[
                      'option-btn',
                      isMine  ? 'selected' : '',
                      isRight ? 'correct'  : '',
                      isWrong ? 'wrong'    : '',
                    ].join(' ')}
                    onClick={() => onAnswer(label)}
                    disabled={hasAnswered || !isAlive || showingRoundResult}
                  >
                    <span className="opt-label">{label}</span>
                    <span className="opt-text">{opt}</span>
                  </button>
                );
              })}
            </div>

            {hasAnswered && !showingRoundResult && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                <div className="answer-progress">
                  <div className="dot" />
                  <span>Waiting… {answeredCount}/{totalAlive} answered</span>
                </div>
              </div>
            )}

            {!isAlive && !showingRoundResult && (
              <p className="status-line spectator">
                💀 You've been eliminated — spectating
              </p>
            )}
          </div>

          {/* Round result */}
          {showingRoundResult && roundResults && (
            <RoundResult
              answerResult={answerResult}
              roundResults={roundResults}
              isAlive={isAlive}
            />
          )}
        </div>

        {/* Sidebar player list */}
        <aside className="players-sidebar">
          <div className="sidebar-title">Players</div>
          {players.map((p) => (
            <div key={p.id} className={`sidebar-player ${!p.alive ? 'dead' : ''}`}>
              <span className={`sp-name ${p.username === username ? 'sp-you' : ''}`}>
                {p.username}{p.username === username ? ' (you)' : ''}
              </span>
              <div className="sp-lives">
                {[1, 2, 3].map((i) => (
                  <span key={i}>{i <= p.lives ? '❤️' : '🖤'}</span>
                ))}
              </div>
              {!p.alive && <span className="sp-elim">ELIMINATED</span>}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function RoundResult({ answerResult, roundResults, isAlive }) {
  const hasPersonalResult = answerResult !== null;
  const correct = hasPersonalResult && answerResult.correct;

  let bgClass = 'neutral-bg';
  if (hasPersonalResult) bgClass = correct ? 'correct-bg' : 'wrong-bg';

  return (
    <div className={`round-result ${bgClass}`}>
      {hasPersonalResult && (
        <>
          <div className="rr-header">
            <span className="rr-icon">{correct ? '✅' : '❌'}</span>
            <span className={`rr-label ${correct ? 'correct' : 'wrong'}`}>
              {correct ? 'CORRECT! +100 pts' : 'WRONG!'}
            </span>
          </div>
          {!correct && (
            <p className="rr-lives">
              Lives remaining: {answerResult.lives}
              {answerResult.lives === 0 ? ' — You are eliminated!' : ''}
            </p>
          )}
        </>
      )}

      <div className="rr-explanation">
        <strong>Correct answer: {roundResults.correctAnswer}</strong>
        <p>{roundResults.explanation}</p>
      </div>

      {roundResults.eliminated?.length > 0 && (
        <p className="rr-eliminated">
          💀 Eliminated this round: {roundResults.eliminated.join(', ')}
        </p>
      )}
    </div>
  );
}
