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
    ref.current = setInterval(() => setLeft(t => Math.max(0, t - 1)), 1000);
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
  myPowerups = [],
  usedPowerupThisQ = false,
  onUsePowerup,
  hiddenOptions = [],
  extraTimeBonus = 0,
  showPowerupIntro = false,
  socketId,
}) {
  const GOAL = 20;
  const sortedProgress = [...(raceProgress || [])].sort((a, b) => b.correct - a.correct);

  const POWERUP_META = {
    '50_50': { icon: '🎯', label: '50/50' },
    extra_time: { icon: '⏰', label: '+10s' },
    skip: { icon: '⏭️', label: 'Skip' },
    freeze: { icon: '❄️', label: 'Freeze' },
    double_xp: { icon: '⭐', label: '2× XP' },
  };

  if (showPowerupIntro && myPowerups.length > 0) {
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
              bonusSeconds={extraTimeBonus}
            />

            <div className="question-text">{question.question}</div>

            <div className="options-grid">
              {LABELS.map((opt, i) => {
                if (hiddenOptions.includes(opt)) return null;
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

            <PowerupBar
              powerups={myPowerups}
              usedPowerupThisQ={usedPowerupThisQ}
              onUse={onUsePowerup}
              gameMode="speed_race"
              players={sortedProgress}
              mySocketId={socketId}
              isFrozen={false}
              hasAnswered={hasAnswered}
            />

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
