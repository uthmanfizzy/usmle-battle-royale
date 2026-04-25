import { useState, useEffect, useRef } from 'react';
import TriviaBoard from './TriviaBoard';

const LABELS = ['A', 'B', 'C', 'D'];

const CATEGORY_META = {
  cardiology:    { label: 'Cardiology',    color: '#e74c3c', icon: '❤️' },
  neurology:     { label: 'Neurology',     color: '#3498db', icon: '🧠' },
  pharmacology:  { label: 'Pharmacology',  color: '#f1c40f', icon: '💊' },
  microbiology:  { label: 'Microbiology',  color: '#2ecc71', icon: '🦠' },
  biochemistry:  { label: 'Biochemistry',  color: '#ff4b8b', icon: '⚗️' },
  biostatistics: { label: 'Biostatistics', color: '#9b59b6', icon: '📊' },
};

const CAT_ORDER = ['cardiology','neurology','pharmacology','microbiology','biochemistry','biostatistics'];

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

function WedgeTokens({ wedges }) {
  return (
    <div className="wedge-tokens">
      {CAT_ORDER.map(cat => {
        const meta   = CATEGORY_META[cat];
        const earned = wedges.includes(cat);
        return (
          <div
            key={cat}
            className={`wedge-token ${earned ? 'earned' : ''}`}
            style={{ '--wedge-color': meta.color }}
            title={meta.label}
          >
            {earned && <span className="wedge-icon">{meta.icon}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function TriviaGame({
  triviaState,
  triviaResult,
  onAnswer,
  username,
  socketId,
  onTick,
  hasAnswered,
  myAnswer,
}) {
  if (!triviaState) {
    return (
      <div className="screen trivia-screen">
        <div className="waiting-screen">
          <div className="spinner" />
          <p>Loading Trivia Pursuit…</p>
        </div>
      </div>
    );
  }

  const {
    currentPlayerId, currentUsername, category,
    question, round, timeLimit, wedgeState, playerOrder,
    positions,
  } = triviaState;

  const isMyTurn = socketId === currentPlayerId;
  const catMeta  = CATEGORY_META[category] || { label: category, color: '#9b59b6', icon: '❓' };
  const canAnswer = isMyTurn && !hasAnswered;

  return (
    <div className="screen trivia-screen">
      <div className="trivia-inner">

        {/* ── Board ── */}
        <div className="trivia-board-container">
          <TriviaBoard
            positions={positions || {}}
            currentPlayerId={currentPlayerId}
            mySocketId={socketId}
            wedgeState={wedgeState || {}}
            playerOrder={playerOrder || []}
          />
        </div>

        {/* ── Players + wedges ── */}
        <div className="trivia-players-board">
          {(playerOrder || []).map(({ id, username: pname }) => {
            const pState   = wedgeState?.[id];
            const wedges   = pState?.wedges || [];
            const isCurrent = id === currentPlayerId;
            const isMe      = id === socketId;
            return (
              <div key={id} className={`trivia-player-row ${isCurrent ? 'current-turn' : ''}`}>
                <div className="trivia-player-meta">
                  <span className="trivia-player-name">
                    {isCurrent && <span className="turn-arrow">▶ </span>}
                    {isMe ? `${pname} (you)` : pname}
                  </span>
                  <span className="trivia-wedge-count">{wedges.length}/6</span>
                </div>
                <WedgeTokens wedges={wedges} />
              </div>
            );
          })}
        </div>

        {/* ── Turn banner ── */}
        <div className={`trivia-turn-banner ${isMyTurn ? 'my-turn' : ''}`}>
          {isMyTurn ? '🎯 Your turn — answer now!' : `⏳ ${currentUsername}'s turn`}
        </div>

        {/* ── Category badge ── */}
        {category && (
          <div className="trivia-cat-header">
            <span className="trivia-round">Round {round}</span>
            <div className="trivia-cat-badge"
              style={{ background: catMeta.color + '22', borderColor: catMeta.color, color: catMeta.color }}>
              {catMeta.icon} {catMeta.label}
            </div>
            <span className="trivia-goal">Collect all 6 wedges to win</span>
          </div>
        )}

        {/* ── Question card ── */}
        <div className="trivia-question-card">
          {question ? (
            <>
              <Timer
                timeLimit={timeLimit}
                active={!triviaResult && !hasAnswered}
                questionId={question.id}
                onTick={isMyTurn ? onTick : undefined}
              />

              <div className="question-text">{question.question}</div>

              <div className="options">
                {LABELS.map((opt, i) => {
                  const val = question.options[i];
                  let cls = 'option-btn';
                  if (triviaResult) {
                    if (opt === triviaResult.correctAnswer) cls += ' correct';
                    else if (isMyTurn && opt === myAnswer) cls += ' wrong';
                  } else if (isMyTurn && myAnswer === opt) {
                    cls += ' selected';
                  }
                  return (
                    <button
                      key={opt}
                      className={cls}
                      onClick={() => onAnswer(opt)}
                      disabled={!canAnswer || !!triviaResult}
                    >
                      <span className="opt-label">{opt}</span>
                      <span className="opt-text">{val}</span>
                    </button>
                  );
                })}
              </div>

              {triviaResult && (
                <div className={`trivia-result-feedback ${triviaResult.correct ? 'correct' : 'wrong'}`}>
                  <div className="trf-main">
                    {triviaResult.correct
                      ? `✓ Correct!${triviaResult.earnedWedge ? ` ${currentUsername} earned the ${catMeta.label} wedge ${catMeta.icon}` : ''}`
                      : `✗ Wrong — Answer was ${triviaResult.correctAnswer}`}
                  </div>
                  {triviaResult.explanation && (
                    <p className="trf-explanation">{triviaResult.explanation}</p>
                  )}
                  <p className="trf-next">Next player's turn…</p>
                </div>
              )}

              {!triviaResult && !isMyTurn && (
                <p className="trivia-spectate">Watching {currentUsername} answer…</p>
              )}
            </>
          ) : (
            <div className="waiting-msg">
              {isMyTurn
                ? '🎲 Roll the dice to move around the board…'
                : `Waiting for ${currentUsername} to roll…`}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
