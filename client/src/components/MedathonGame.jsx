import { useState, useEffect, useRef, useMemo } from 'react';
import './MedathonGame.css';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/**
 * Medathon — the fifteen-system marathon race.
 *
 * Everything here is driven by the server: the question, the verdict, and the
 * standings. The component's job is to make a race *feel* like one — a live
 * track where the field moves, points that fly off a fast answer, and a
 * curtain between systems — while telling the player only what the mode
 * promises: right or wrong, and on a wrong answer, which option was right.
 * There are no explanations in this mode by design.
 *
 * It is built for landscape. On a phone held upright the whole screen is
 * replaced by a rotate prompt rather than squeezing the track into a column.
 */

/** The clock. Counts the question down and colours itself as it runs out. */
function MedTimer({ timeLimit, active, questionKey, onTick }) {
  const [left, setLeft] = useState(timeLimit);
  const ref = useRef(null);

  useEffect(() => {
    setLeft(timeLimit);
    if (!active) return undefined;
    ref.current = setInterval(() => setLeft(t => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(ref.current);
  }, [timeLimit, active, questionKey]);

  const whole = Math.ceil(left);
  useEffect(() => {
    if (active && whole <= 5 && whole > 0 && onTick) onTick();
  }, [whole, active, onTick]);

  const pct  = Math.max(0, Math.min(100, (left / timeLimit) * 100));
  const tier = pct > 50 ? 'ok' : pct > 22 ? 'warn' : 'crit';
  return (
    <div className={`mdt-timer mdt-timer--${tier}`}>
      <div className="mdt-timer-track"><div className="mdt-timer-fill" style={{ width: `${pct}%` }} /></div>
      <span className="mdt-timer-num">{whole}</span>
    </div>
  );
}

/**
 * The race track: one lane per player, each puck sitting at the share of the
 * run they have answered. Lanes are ordered by place, and the DOM order is the
 * standing order, so a lead change visibly re-sorts the board.
 */
function Track({ rows, total, meId }) {
  return (
    <div className="mdt-track">
      {rows.map((p) => {
        const pct = total ? Math.min(100, (p.answered / total) * 100) : 0;
        const isMe = p.id === meId;
        return (
          <div
            key={p.id}
            className={`mdt-lane${isMe ? ' is-me' : ''}${p.place === 1 ? ' is-lead' : ''}${p.finished ? ' is-done' : ''}`}
          >
            <span className="mdt-lane-place">{p.place}</span>
            <span className="mdt-lane-name">
              {p.place === 1 && <span className="mdt-lane-crown" aria-hidden="true">👑</span>}
              {p.username}{isMe ? ' (you)' : ''}
              {p.isBot && <span className="mdt-lane-bot">BOT</span>}
            </span>
            <div className="mdt-lane-rail">
              <div className="mdt-lane-fill" style={{ width: `${pct}%` }} />
              <div className="mdt-lane-puck" style={{ left: `${pct}%` }}>
                <span className="mdt-lane-puck-face">{p.username.charAt(0).toUpperCase()}</span>
              </div>
              {p.finished && <span className="mdt-lane-flag" aria-hidden="true">🏁</span>}
            </div>
            <span className="mdt-lane-score">{p.score.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MedathonGame({
  question,
  timeLimit,
  myAnswer,
  hasAnswered,
  answerResult,
  progress = [],
  setup,
  onAnswer,
  username,
  onTick,
  socketId,
  muted,
  onToggleMute,
  onQuit,
}) {
  const med = question?.medathon || null;
  const total = setup?.total || med?.total || 0;

  // Portrait on a phone: the track and a five-option question do not belong in
  // one narrow column, so ask for the rotate instead of shipping a bad layout.
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // The system curtain. Raised whenever a question opens a new stage, and on
  // the very first question, then dropped on a timer.
  const [curtain, setCurtain] = useState(null);
  const lastStage = useRef(null);
  useEffect(() => {
    if (!med) return undefined;
    if (!med.newStage || lastStage.current === med.stageIndex) return undefined;
    lastStage.current = med.stageIndex;
    setCurtain({ name: med.system, icon: med.systemIcon, index: med.stageIndex, of: med.stageTotal, count: med.stageCount });
    const t = setTimeout(() => setCurtain(null), 1500);
    return () => clearTimeout(t);
  }, [med]);

  // Points that fly off a correct answer. Keyed so a repeat score re-animates.
  const [pop, setPop] = useState(null);
  const popKey = useRef(0);
  useEffect(() => {
    if (!answerResult) return undefined;
    if (!answerResult.correct) return undefined;
    popKey.current += 1;
    setPop({ key: popKey.current, points: answerResult.points || 0, bonus: answerResult.speedBonus || 0 });
    const t = setTimeout(() => setPop(null), 1200);
    return () => clearTimeout(t);
  }, [answerResult]);

  const me = useMemo(() => progress.find(p => p.id === socketId) || null, [progress, socketId]);
  const myPlace = me?.place || null;
  const myScore = me?.score ?? med?.score ?? 0;
  const myCorrect = me?.correct ?? med?.correct ?? 0;

  // Who is immediately ahead — the number that actually makes a race tense.
  const chasing = useMemo(() => {
    if (!myPlace || myPlace === 1) return null;
    const ahead = progress.find(p => p.place === myPlace - 1);
    return ahead ? { username: ahead.username, gap: Math.max(0, ahead.score - myScore) } : null;
  }, [progress, myPlace, myScore]);

  if (portrait) {
    return (
      <div className="mdt-rotate">
        <div className="mdt-rotate-phone" aria-hidden="true" />
        <h2>Turn your phone sideways</h2>
        <p>The Medathon runs in landscape — the race track needs the width.</p>
      </div>
    );
  }

  const waiting = !question;
  const verdict = answerResult ? (answerResult.correct ? 'right' : 'wrong') : null;

  return (
    <div className={`mdt-root${verdict ? ` mdt-root--${verdict}` : ''}`}>
      {/* ── Top bar: where you are, how long you have, how you are doing ── */}
      <header className="mdt-top">
        <div className="mdt-stage">
          <span className="mdt-stage-icon" aria-hidden="true">{med?.systemIcon || '\u{1F3C1}'}</span>
          <span className="mdt-stage-text">
            <strong>{med?.system || 'Medathon'}</strong>
            <small>
              {med ? `${med.stagePos} of ${med.stageCount} · system ${med.stageIndex}/${med.stageTotal}` : 'Starting…'}
            </small>
          </span>
        </div>

        <div className="mdt-top-mid">
          <div className="mdt-qcount">
            Q<strong>{med?.index || 0}</strong><span>/ {total}</span>
          </div>
          <MedTimer
            timeLimit={timeLimit || setup?.timeLimit || 25}
            active={!!question && !hasAnswered && !answerResult}
            questionKey={question?.id}
            onTick={onTick}
          />
        </div>

        <div className="mdt-top-right">
          <div className="mdt-score">
            <span className="mdt-score-num">{myScore.toLocaleString()}</span>
            <span className="mdt-score-label">{myCorrect} correct</span>
          </div>
          {myPlace && (
            <div className={`mdt-place${myPlace === 1 ? ' is-first' : ''}`}>
              <span className="mdt-place-num">{myPlace}</span>
              <span className="mdt-place-label">{myPlace === 1 ? 'LEAD' : 'PLACE'}</span>
            </div>
          )}
          <button type="button" className="mdt-icon-btn" onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '\u{1F507}' : '\u{1F50A}'}
          </button>
          <button type="button" className="mdt-icon-btn mdt-icon-btn--quit" onClick={onQuit} title="Leave the race">
            ✕
          </button>
        </div>
      </header>

      {/* ── The question ───────────────────────────────────────────────── */}
      <main className="mdt-main">
        <section className="mdt-qpanel">
          {waiting ? (
            <div className="mdt-waiting">
              <div className="mdt-waiting-pulse" aria-hidden="true" />
              <p>Lining up the field…</p>
            </div>
          ) : (
            <>
              {question.image_url && (
                <img className="mdt-qimg" src={question.image_url} alt="" />
              )}
              <p className="mdt-qtext">{question.question}</p>
            </>
          )}
          {answerResult && (
            <div className={`mdt-verdict mdt-verdict--${answerResult.correct ? 'right' : 'wrong'}`}>
              {answerResult.correct ? (
                <>
                  <span className="mdt-verdict-mark">✓</span>
                  <span className="mdt-verdict-word">Correct</span>
                </>
              ) : (
                <>
                  <span className="mdt-verdict-mark">✕</span>
                  <span className="mdt-verdict-word">
                    {answerResult.timedOut ? 'Out of time' : 'Wrong'}
                    <small>Answer: {answerResult.correctAnswer}</small>
                  </span>
                </>
              )}
            </div>
          )}

          {chasing && !waiting && !answerResult && (
            <p className="mdt-chase">
              {chasing.gap === 0
                ? `Level with ${chasing.username}`
                : `${chasing.gap.toLocaleString()} behind ${chasing.username}`}
            </p>
          )}
        </section>

        <section className="mdt-options">
          {(question?.options || []).map((opt, i) => {
            const letter = LABELS[i];
            const chosen = myAnswer === letter || myAnswer === opt;
            const isRight = answerResult && answerResult.correctAnswer === letter;
            const isWrongPick = answerResult && chosen && !answerResult.correct;
            return (
              <button
                key={letter}
                type="button"
                className={`mdt-opt${chosen ? ' is-chosen' : ''}${isRight ? ' is-right' : ''}${isWrongPick ? ' is-wrong' : ''}`}
                disabled={hasAnswered || !!answerResult}
                onClick={() => onAnswer(letter)}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="mdt-opt-letter">{letter}</span>
                <span className="mdt-opt-text">{opt}</span>
                {isRight && <span className="mdt-opt-mark" aria-hidden="true">✓</span>}
                {isWrongPick && <span className="mdt-opt-mark" aria-hidden="true">✕</span>}
              </button>
            );
          })}
        </section>
      </main>

      {/* ── The field ──────────────────────────────────────────────────── */}
      <footer className="mdt-bottom">
        <Track rows={progress} total={total} meId={socketId} />
      </footer>

      {pop && (
        <div className="mdt-pop" key={pop.key}>
          +{pop.points}
          {pop.bonus > 0 && <small>{pop.bonus} speed bonus</small>}
        </div>
      )}

      {curtain && (
        <div className="mdt-curtain">
          <div className="mdt-curtain-inner">
            <span className="mdt-curtain-icon" aria-hidden="true">{curtain.icon}</span>
            <span className="mdt-curtain-kicker">System {curtain.index} of {curtain.of}</span>
            <h2 className="mdt-curtain-name">{curtain.name}</h2>
            <span className="mdt-curtain-count">{curtain.count} question{curtain.count === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}

      {me?.finished && (
        <div className="mdt-finished">
          <span className="mdt-finished-flag" aria-hidden="true">🏁</span>
          <h2>You finished!</h2>
          <p>{myScore.toLocaleString()} points · {myCorrect} correct</p>
          <small>Waiting for the rest of the field…</small>
        </div>
      )}
    </div>
  );
}
