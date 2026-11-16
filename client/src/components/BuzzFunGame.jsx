import { useState, useEffect, useRef } from 'react';
import './BuzzFunGame.css';
import ExplanationText from './ExplanationText';
import Calculator from './Calculator';

/**
 * Buzz Fun — eight-second flash cards of high-yield buzzwords.
 *
 * Orange hive theme. The card is the whole screen: a type badge (what kind of
 * fact this is), the topic and subject, the clue in big type, four answer
 * tiles, and a ring that empties as the seconds go. Answering pops a "BUZZ!"
 * with the points won; a streak lights the flame and the combo meter.
 *
 * Server events and props are unchanged from the original screen — this is
 * the same multiplayer mode (server/index.js startBuzzFun), dressed properly.
 */

export const BUZZ_TYPES = {
  BUZZWORD:    { label: 'Buzzword',    icon: '🐝', hue: '255, 159, 28' },
  TRIAD:       { label: 'Triad',       icon: '🔺', hue: '255, 99, 72' },
  ASSOCIATION: { label: 'Association', icon: '🔗', hue: '255, 193, 7' },
  SIDE_EFFECT: { label: 'Side effect', icon: '💊', hue: '255, 120, 60' },
  DEFICIENCY:  { label: 'Deficiency',  icon: '🥕', hue: '240, 140, 40' },
  MECHANISM:   { label: 'Mechanism',   icon: '⚙️', hue: '255, 176, 80' },
};

const SUBJECT_LABEL = { biochemistry: 'Biochemistry', immunology: 'Immunology' };
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const RING = 2 * Math.PI * 44;

export default function BuzzFunGame({
  question, round, timeLimit, myAnswer, hasAnswered,
  answeredCount, totalAlive, myScore, players,
  answerResult, roundResults, showingRoundResult,
  onAnswer, username, onTick,
}) {
  const limit = timeLimit || 8;
  const [timeLeft, setTimeLeft] = useState(limit);
  const [fraction, setFraction] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);
  const [flash, setFlash] = useState(null);           // 'correct' | 'wrong' | null
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const timerRef = useRef(null);
  const lastTick = useRef(null);

  // A new card: reset the ring and the reveal.
  useEffect(() => {
    if (!question) return undefined;
    setTimeLeft(limit);
    setFraction(1);
    setFlash(null);
    setRevealCorrect(false);
    clearInterval(timerRef.current);
    lastTick.current = null;
    const start = Date.now();
    const total = limit * 1000;
    timerRef.current = setInterval(() => {
      const remainingMs = Math.max(0, total - (Date.now() - start));
      const secs = Math.ceil(remainingMs / 1000);
      setFraction(remainingMs / total);
      setTimeLeft(secs);
      if (secs <= 3 && secs > 0 && lastTick.current !== secs) { lastTick.current = secs; onTick?.(); }
      if (remainingMs === 0) clearInterval(timerRef.current);
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The verdict on my answer.
  useEffect(() => {
    if (!answerResult) return;
    clearInterval(timerRef.current);
    const ok = !!answerResult.correct;
    setFlash(ok ? 'correct' : 'wrong');
    const s = typeof answerResult.streak === 'number' ? answerResult.streak : (ok ? streak + 1 : 0);
    setStreak(s);
    setBestStreak(b => Math.max(b, s));
    if (!ok) setTimeout(() => setRevealCorrect(true), 350);
    else setRevealCorrect(true);
  }, [answerResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keys 1–4 or A–D to answer.
  useEffect(() => {
    if (!question || hasAnswered || showingRoundResult) return undefined;
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = e.key.toUpperCase();
      let idx = -1;
      if (/^[1-6]$/.test(k)) idx = Number(k) - 1;
      else if (/^[A-F]$/.test(k)) idx = k.charCodeAt(0) - 65;
      if (idx >= 0 && idx < (question.options || []).length) { e.preventDefault(); onAnswer(LETTERS[idx]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, hasAnswered, showingRoundResult, onAnswer]);

  if (!question) {
    return (
      <div className="bf-screen">
        <Hive />
        <div className="bf-waiting">
          <div className="bf-bee-loader" aria-hidden="true">🐝</div>
          <p>The hive is waking up…</p>
        </div>
      </div>
    );
  }

  const type = BUZZ_TYPES[question.buzz_type] || BUZZ_TYPES.BUZZWORD;
  const totalRounds = question.totalRounds || 30;
  const sorted = (players ? [...players] : []).sort((a, b) => (b.score || 0) - (a.score || 0));
  const myRank = Math.max(1, sorted.findIndex(p => p.username === username) + 1);
  const combo = Math.min(5, streak);
  const optionText = (letter) => question.options?.[(letter || 'A').charCodeAt(0) - 65] || '';

  // ── Between cards: the answer, why, and the table ─────────────────────
  if (showingRoundResult && roundResults) {
    const table = [...(roundResults.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
    const verdicts = new Map((roundResults.results || []).map(r => [r.id, r]));
    return (
      <div className="bf-screen">
        <Hive />
        <Hud round={round} totalRounds={totalRounds} score={myScore} streak={streak} rank={myRank} field={sorted.length} />
        <div className="bf-reveal">
          <div className="bf-reveal-card">
            <div className="bf-reveal-top">
              <TypeBadge type={type} />
              {question.topic && <span className="bf-chip">{question.topic}</span>}
            </div>
            <p className="bf-reveal-clue">{question.question}</p>
            <div className="bf-reveal-answer">
              <span className="bf-reveal-key">{roundResults.correctAnswer}</span>
              <span>{optionText(roundResults.correctAnswer)}</span>
            </div>
            {roundResults.explanation && (
              <div className="bf-reveal-why">
                <span className="bf-reveal-why-tag">💡 High-yield</span>
                <ExplanationText text={roundResults.explanation} />
              </div>
            )}
          </div>

          <div className="bf-table">
            <div className="bf-table-head">🏆 Hive leaderboard</div>
            {table.map((p, i) => {
              const v = verdicts.get(p.id);
              const mark = !v || !v.answered ? '·' : v.correct ? '✓' : '✗';
              return (
                <div key={p.id} className={`bf-row${p.username === username ? ' is-me' : ''}${i < 3 ? ` is-top is-top${i + 1}` : ''}`} style={{ '--i': i }}>
                  <span className="bf-row-rank">{i === 0 ? '👑' : i + 1}</span>
                  <span className="bf-row-name">{p.username}</span>
                  {p.streak >= 3 && <span className="bf-row-fire" title={`${p.streak} in a row`}>🔥{p.streak}</span>}
                  <span className={`bf-row-mark${v?.correct ? ' is-ok' : v?.answered ? ' is-bad' : ''}`}>{mark}</span>
                  <span className="bf-row-score">{p.score || 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── The card ──────────────────────────────────────────────────────────
  const urgent = timeLeft <= 3 && !hasAnswered;
  return (
    <div className={`bf-screen${urgent ? ' is-urgent' : ''}`}>
      <Hive />
      <Hud round={round} totalRounds={totalRounds} score={myScore} streak={streak} rank={myRank} field={sorted.length} />

      <div className="bf-stage">
        <div className={`bf-card${flash ? ` is-${flash}` : ''}`} style={{ '--type': type.hue }} key={question.id}>
          <div className="bf-card-top">
            <TypeBadge type={type} />
            <div className="bf-chips">
              {question.subject && <span className="bf-chip bf-chip--subject">{SUBJECT_LABEL[question.subject] || question.subject}</span>}
              {question.topic && <span className="bf-chip">{question.topic}</span>}
            </div>
            <div className={`bf-ring${urgent ? ' is-urgent' : ''}`} aria-label={`${timeLeft} seconds left`}>
              <svg viewBox="0 0 100 100">
                <circle className="bf-ring-bg" cx="50" cy="50" r="44" />
                <circle
                  className="bf-ring-fg"
                  cx="50" cy="50" r="44"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - (hasAnswered ? fraction : fraction))}
                />
              </svg>
              <span className="bf-ring-n">{hasAnswered && !answerResult ? '🐝' : timeLeft}</span>
            </div>
          </div>

          <p className="bf-clue">{question.question}</p>

          {question.image_url && (
            <img className="bf-img" src={question.image_url} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
          )}

          <div className="bf-options">
            {question.options.map((opt, i) => {
              const letter = LETTERS[i];
              const mine = myAnswer === letter;
              const right = revealCorrect && letter === answerResult?.correctAnswer;
              const wrong = revealCorrect && mine && !answerResult?.correct;
              const cls = [
                'bf-opt',
                !hasAnswered && 'is-live',
                mine && 'is-mine',
                right && 'is-right',
                wrong && 'is-wrong',
                revealCorrect && !right && !wrong && 'is-dim',
              ].filter(Boolean).join(' ');
              return (
                <button key={letter} type="button" className={cls} onClick={() => !hasAnswered && onAnswer(letter)} disabled={hasAnswered} style={{ '--d': `${i * 0.06}s` }}>
                  <span className="bf-opt-key">{i + 1}</span>
                  <span className="bf-opt-text">{opt}</span>
                  {right && <span className="bf-opt-mark">✓</span>}
                  {wrong && <span className="bf-opt-mark">✗</span>}
                </button>
              );
            })}
          </div>

          {hasAnswered && !answerResult && (
            <div className="bf-locked">🔒 Locked in — {answeredCount}/{totalAlive} buzzed</div>
          )}

          {answerResult && (
            answerResult.correct ? (
              <div className="bf-burst" key={`b${question.id}`}>
                <span className="bf-burst-word">BUZZ!</span>
                <span className="bf-burst-pts">+{answerResult.pointsEarned || 100}</span>
                {streak >= 3 && <span className="bf-burst-streak">🔥 {streak} in a row</span>}
                <Sparks />
              </div>
            ) : (
              <div className="bf-miss" key={`m${question.id}`}>
                {myAnswer ? 'Stung!' : 'Too slow!'} <span>It was {answerResult.correctAnswer} — {optionText(answerResult.correctAnswer)}</span>
              </div>
            )
          )}
        </div>

        <aside className="bf-side">
          <div className="bf-combo" aria-label={`Combo ${combo} of 5`}>
            <span className="bf-combo-label">Combo</span>
            <div className="bf-combo-cells">
              {[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= combo ? 'is-on' : ''} />)}
            </div>
            <span className="bf-combo-best">Best 🔥 {bestStreak}</span>
          </div>
          {sorted.length > 0 && (
            <div className="bf-mini">
              {sorted.slice(0, 5).map((p, i) => (
                <div key={p.id} className={`bf-mini-row${p.username === username ? ' is-me' : ''}`}>
                  <span className="bf-mini-rank">{i === 0 ? '👑' : i + 1}</span>
                  <span className="bf-mini-name">{p.username}</span>
                  <span className="bf-mini-score">{p.score || 0}</span>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="bf-calc-btn" onClick={() => setShowCalculator(v => !v)} title="Calculator">
            🧮 {showCalculator ? 'Hide' : 'Calculator'}
          </button>
          {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
        </aside>
      </div>
    </div>
  );
}

function Hud({ round, totalRounds, score, streak, rank, field }) {
  return (
    <header className="bf-hud">
      <div className="bf-brand"><span aria-hidden="true">🐝</span> BUZZ <b>FUN</b></div>
      <div className="bf-honeycomb" aria-label={`Card ${round} of ${totalRounds}`}>
        {Array.from({ length: totalRounds }, (_, i) => (
          <span key={i} className={i + 1 < round ? 'is-done' : i + 1 === round ? 'is-now' : ''} />
        ))}
      </div>
      <div className="bf-hud-stats">
        <span className="bf-pill">Card <b>{round}</b>/{totalRounds}</span>
        {field > 1 && <span className="bf-pill">#{rank}</span>}
        <span className={`bf-pill bf-pill--fire${streak >= 3 ? ' is-hot' : ''}`}>🔥 <b>{streak}</b></span>
        <span className="bf-pill bf-pill--score">🍯 <b>{score || 0}</b></span>
      </div>
    </header>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="bf-type" style={{ '--type': type.hue }}>
      <span aria-hidden="true">{type.icon}</span> {type.label}
    </span>
  );
}

// Floating honeycomb backdrop — decorative, static positions.
function Hive() {
  return (
    <div className="bf-hive" aria-hidden="true">
      {[...Array(14)].map((_, i) => <span key={i} style={{ '--i': i }} />)}
    </div>
  );
}

function Sparks() {
  return (
    <span className="bf-sparks" aria-hidden="true">
      {[...Array(12)].map((_, i) => <i key={i} style={{ '--a': `${i * 30}deg` }} />)}
    </span>
  );
}
