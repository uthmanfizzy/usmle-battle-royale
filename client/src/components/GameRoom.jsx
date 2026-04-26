import { useState, useEffect, useRef } from 'react';
import PowerupBar from './PowerupBar';

const LABELS = ['A', 'B', 'C', 'D'];

function Timer({ timeLimit, active, questionId, onTick, bonusSeconds = 0 }) {
  const [left, setLeft] = useState(timeLimit);
  const ref = useRef(null);
  const prevBonusRef = useRef(0);

  useEffect(() => {
    prevBonusRef.current = 0;
    setLeft(timeLimit);
    if (!active) return;
    ref.current = setInterval(() => setLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(ref.current);
  }, [timeLimit, active, questionId]);

  useEffect(() => {
    if (bonusSeconds > prevBonusRef.current && active) {
      setLeft(prev => prev + (bonusSeconds - prevBonusRef.current));
    }
    prevBonusRef.current = bonusSeconds;
  }, [bonusSeconds, active]);

  useEffect(() => {
    if (active && left <= 5 && left > 0 && onTick) onTick();
  }, [left, active, onTick]);

  const pct  = Math.min(100, (left / timeLimit) * 100);
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
  streaks = {},
  suddenDeath = false,
  showSuddenDeathScreen = false,
  myPowerups = [],
  usedPowerupThisQ = false,
  onUsePowerup,
  isFrozen = false,
  hiddenOptions = [],
  extraTimeBonus = 0,
  showPowerupIntro = false,
  socketId,
  gameMode = 'battle_royale',
}) {
  if (showSuddenDeathScreen) {
    return (
      <div className="screen sd-announcement-screen">
        <div className="sd-announcement">
          <div className="sd-bolt">⚡</div>
          <h1 className="sd-title">SUDDEN DEATH</h1>
          <div className="sd-bolt">⚡</div>
          <p className="sd-subtitle">One wrong answer and you're out</p>
          <p className="sd-timer-note">5 seconds per question</p>
        </div>
      </div>
    );
  }

  if (showPowerupIntro && myPowerups.length > 0) {
    const POWERUP_META = {
      '50_50': { icon: '🎯', label: '50/50' },
      extra_time: { icon: '⏰', label: '+10s' },
      skip: { icon: '⏭️', label: 'Skip' },
      freeze: { icon: '❄️', label: 'Freeze' },
      double_xp: { icon: '⭐', label: '2× XP' },
    };
    return (
      <div className="screen powerup-intro-screen">
        <div className="powerup-intro-card">
          <div className="powerup-intro-title">⚡ Your Power-Ups!</div>
          <p className="powerup-intro-sub">Use them wisely — one per question</p>
          <div className="powerup-intro-list">
            {myPowerups.map(type => {
              const m = POWERUP_META[type] || { icon: '❓', label: type };
              return (
                <div key={type} className="powerup-intro-item">
                  <span className="powerup-intro-icon">{m.icon}</span>
                  <span className="powerup-intro-label">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
    <div className={`screen game-screen ${suddenDeath ? 'sudden-death-mode' : ''}`}>
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
              bonusSeconds={extraTimeBonus}
            />
          )}

          <div className="question-card">
            {question.image_url && (
              <div className="question-image-wrap">
                <img
                  src={question.image_url}
                  alt="Medical scan"
                  className="question-image"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
            <p className="question-text">{question.question}</p>

            <div className="options">
              {question.options.map((opt, i) => {
                const label    = LABELS[i];
                if (hiddenOptions.includes(label)) return null;
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
                    disabled={hasAnswered || !isAlive || showingRoundResult || isFrozen}
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

          {!showingRoundResult && isAlive && (
            <PowerupBar
              powerups={myPowerups}
              usedPowerupThisQ={usedPowerupThisQ}
              onUse={onUsePowerup}
              gameMode="battle_royale"
              players={players}
              mySocketId={socketId}
              isFrozen={isFrozen}
              hasAnswered={hasAnswered}
            />
          )}

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
          {players.map((p) => {
            const streak = streaks[p.id] || 0;
            return (
              <div key={p.id} className={`sidebar-player ${!p.alive ? 'dead' : ''}`}>
                <span className={`sp-name ${p.username === username ? 'sp-you' : ''}`}>
                  {p.username}{p.username === username ? ' (you)' : ''}
                  {streak >= 1 && (
                    <span className={`streak-badge ${streak >= 3 ? 'on-fire' : ''}`}>
                      🔥{streak}
                    </span>
                  )}
                </span>
                <div className="sp-lives">
                  {[1, 2, 3].map((i) => (
                    <span key={i}>{i <= p.lives ? '❤️' : '🖤'}</span>
                  ))}
                </div>
                {!p.alive && <span className="sp-elim">ELIMINATED</span>}
              </div>
            );
          })}
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
              {correct
                ? (answerResult.streak >= 3
                    ? `CORRECT! +100 pts 🔥 Streak x${answerResult.streak}!`
                    : 'CORRECT! +100 pts')
                : 'WRONG!'}
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
