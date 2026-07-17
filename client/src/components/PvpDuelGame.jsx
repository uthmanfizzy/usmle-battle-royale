import { useState, useEffect, useRef } from 'react';
import ExplanationText from './ExplanationText';
import { renderStem } from '../utils/renderStem';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const STARTING_HP = 100; // display default until the first server snapshot arrives

// Minimal duplicate of GameRoom's Timer (that one is a private component
// carrying powerup bonus-seconds plumbing this mode doesn't have).
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

// Plain HP readout — Phase 4c restyles this into the mockup HUD bars.
function HpRow({ label, hp, mine }) {
  const pct = Math.max(0, Math.min(100, (hp / STARTING_HP) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 130, textAlign: 'left' }}>
        {label}: {hp}/{STARTING_HP} HP
      </span>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 5,
          background: mine ? '#4fd1c5' : '#c1291e', transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// Phase 4a: functional 1v1 duel screen (SpeedRaceGame/TriviaGame sibling
// precedent). Deliberately plain — the mockup PvP HUD treatment is Phase 4c.
export default function PvpDuelGame({
  question,
  round,
  timeLimit,
  myAnswer,
  hasAnswered,
  answeredCount,
  players,
  answerResult,
  roundResults,
  showingRoundResult,
  onAnswer,
  username,
  onTick,
  socketId,
}) {
  // HP: prefer the latest round snapshot, then the new_question snapshot,
  // then the starting value (before round 1 resolves).
  const snapshotPlayers = roundResults?.players;
  const findHp = (isMe) => {
    const bySnapshot = snapshotPlayers?.find(p => (p.id === socketId) === isMe);
    if (bySnapshot && typeof bySnapshot.hp === 'number') return bySnapshot.hp;
    if (question?.duelHp) {
      const entry = Object.entries(question.duelHp).find(([id]) => (id === socketId) === isMe);
      if (entry) return entry[1];
    }
    return STARTING_HP;
  };
  const myHp  = findHp(true);
  const oppHp = findHp(false);
  const oppName = (snapshotPlayers || players || []).find(p => p.id !== socketId)?.username || 'Opponent';

  if (!question) {
    return (
      <div className="screen game-screen">
        <div className="waiting-screen">
          <div className="spinner" />
          <p>Your opponent approaches…</p>
        </div>
      </div>
    );
  }

  const timerActive = !hasAnswered && !showingRoundResult;

  return (
    <div className="screen game-screen">
      <div className="game-topbar">
        <span className="topbar-round">⚔️ Duel · Round {round}</span>
      </div>

      <div className="game-layout">
        <div className="game-center">
          {/* Plain HP block (both players) */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8, width: '100%',
            maxWidth: 640, margin: '0 auto 14px', padding: '12px 16px',
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
          }}>
            <HpRow label={`${username} (you)`} hp={myHp} mine />
            <HpRow label={oppName} hp={oppHp} mine={false} />
          </div>

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
            {renderStem(question.question)}
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

            <div className="options">
              {question.options.map((opt, i) => {
                const label   = LABELS[i];
                const isMine  = myAnswer === label;
                const isRight = showingRoundResult && roundResults?.correctAnswer === label;
                const isWrong = showingRoundResult && isMine && roundResults?.correctAnswer !== label;
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
                    disabled={hasAnswered || showingRoundResult}
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
                  <span>Waiting… {answeredCount}/2 answered</span>
                </div>
              </div>
            )}
          </div>

          {showingRoundResult && roundResults && (
            <div className={`round-result ${answerResult ? (answerResult.correct ? 'correct-bg' : 'wrong-bg') : 'neutral-bg'}`}>
              {answerResult && (
                <div className="rr-header">
                  <span className="rr-icon">{answerResult.correct ? '✅' : '❌'}</span>
                  <span className={`rr-label ${answerResult.correct ? 'correct' : 'wrong'}`}>
                    {answerResult.correct ? 'CORRECT!' : 'WRONG!'}
                  </span>
                </div>
              )}
              <p style={{ fontWeight: 700, margin: '6px 0' }}>
                {roundResults.striker
                  ? (roundResults.striker === username
                      ? '⚔️ You strike first — 5 damage dealt!'
                      : `🛡 ${roundResults.striker} strikes you for 5 damage!`)
                  : 'No strike this round — nobody answered correctly first.'}
              </p>
              <div className="rr-explanation">
                <strong>
                  Correct answer: {roundResults.correctAnswer}
                  {question?.options?.[(roundResults.correctAnswer || 'A').charCodeAt(0) - 65]
                    ? `. ${question.options[(roundResults.correctAnswer || 'A').charCodeAt(0) - 65]}`
                    : ''}
                </strong>
                <ExplanationText text={roundResults.explanation} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
