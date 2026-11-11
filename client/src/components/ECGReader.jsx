import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ECGStrip from '../ecg/ECGStrip';
import { buildSignal } from '../ecg/ecgEngine';
import { ECG_CASES, CATEGORY_LABELS } from '../ecg/ecgCases';
import './ECGReader.css';

/**
 * ECG Reader — a strip comes up live, and you name it.
 *
 * Same shape as the Pathway Navigator beside it on the Minigames shelf: an
 * intro, a run, a summary, a score and a streak, and nothing saved to the
 * server. A run is practice, not a ranking.
 *
 * The strips are not pictures. Each is synthesised from its rhythm and its
 * morphology (src/ecg) and drawn at true paper scale, so rate, intervals and
 * axis can all be measured off the grid the way they would be on a real
 * ECG — and the same case never looks quite the same twice, because every
 * question gets a fresh seed.
 *
 * No heart rate is displayed. On a monitor it would be, but counting the
 * large squares between R waves IS the skill this drills; a number in the
 * corner would answer half the questions for you.
 */

const RUN_LENGTH = 10;
const BASE_POINTS = 100;
const STREAK_BONUS = 20;          // per answer in a row
const STREAK_BONUS_MAX = 5;       // capped, so one long streak cannot dwarf accuracy
const OPTIONS = 4;

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function buildQuestion(caseDef) {
  // Three of the case's own chosen confusers, never three random diagnoses:
  // a Wenckebach should be told apart from Mobitz II, not from asystole.
  const wrong = shuffle(caseDef.distractors).slice(0, OPTIONS - 1);
  return {
    caseDef,
    options: shuffle([caseDef.answer, ...wrong]),
    seed: 1 + Math.floor(Math.random() * 1e9),
  };
}

export default function ECGReader({ onExit }) {
  const [phase, setPhase] = useState('intro');        // 'intro' | 'run' | 'summary'
  const [category, setCategory] = useState('all');
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);         // the option clicked this question
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBest] = useState(0);
  const [log, setLog] = useState([]);                 // { caseDef, picked, correct }
  const [paused, setPaused] = useState(false);
  const [look, setLook] = useState(() => {
    try { return localStorage.getItem('mv_ecg_look') === 'monitor' ? 'monitor' : 'paper'; } catch { return 'paper'; }
  });
  const [beatKey, setBeatKey] = useState(0);
  const nextBtnRef = useRef(null);

  const pool = useMemo(
    () => (category === 'all' ? ECG_CASES : ECG_CASES.filter(c => c.category === category)),
    [category],
  );

  const q = queue[index] || null;
  // Rebuilt only when the question changes — the strip must not reset while
  // you are reading it.
  const signal = useMemo(() => (q ? buildSignal(q.caseDef, q.seed) : null), [q]);
  const answered = picked != null;
  const correct = answered && picked === q.caseDef.answer;

  const start = () => {
    const cases = shuffle(pool).slice(0, Math.min(RUN_LENGTH, pool.length));
    setQueue(cases.map(buildQuestion));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBest(0);
    setLog([]);
    setPaused(false);
    setPhase('run');
  };

  const choose = useCallback((opt) => {
    if (!q || picked != null) return;
    const ok = opt === q.caseDef.answer;
    setPicked(opt);
    setLog(l => [...l, { caseDef: q.caseDef, picked: opt, correct: ok }]);
    if (ok) {
      const nextStreak = streak + 1;
      setScore(s => s + BASE_POINTS + STREAK_BONUS * Math.min(streak, STREAK_BONUS_MAX));
      setStreak(nextStreak);
      setBest(b => Math.max(b, nextStreak));
    } else {
      setStreak(0);
    }
    // Freeze the strip so the features named in the explanation can be found
    // on it. The player can set it running again.
    setPaused(true);
  }, [q, picked, streak]);

  const next = useCallback(() => {
    if (index + 1 >= queue.length) { setPhase('summary'); return; }
    setIndex(i => i + 1);
    setPicked(null);
    setPaused(false);
  }, [index, queue.length]);

  // Keys: 1–4 to answer, Enter or → for the next strip, Space to pause.
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (!answered && /^[1-4]$/.test(e.key) && q) {
        const opt = q.options[Number(e.key) - 1];
        if (opt) { e.preventDefault(); choose(opt); }
      } else if (answered && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault(); next();
      } else if (e.key === ' ') {
        e.preventDefault(); setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answered, q, choose, next]);

  // Focus "Next" once answered, so Enter carries straight on.
  useEffect(() => { if (answered) nextBtnRef.current?.focus(); }, [answered]);

  const setLookSaved = (v) => {
    setLook(v);
    try { localStorage.setItem('mv_ecg_look', v); } catch { /* not remembered */ }
  };

  const onBeat = useCallback(() => setBeatKey(k => k + 1), []);

  // ── Intro ───────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="ecgr ecgr--intro">
        <div className="ecgr-topbar">
          {onExit && <button type="button" className="ecgr-back" onClick={onExit}>← Minigames</button>}
        </div>
        <div className="ecgr-intro">
          <span className="ecgr-intro-icon" aria-hidden="true">💓</span>
          <p className="ecgr-kicker">Cardiology · Minigame</p>
          <h1 className="ecgr-title">ECG Reader</h1>
          <p className="ecgr-lede">
            A live strip sweeps across the screen. Read it — rate, rhythm, P waves,
            intervals, QRS width, ST segments — and name what it shows.
          </p>

          {/* A preview strip, so the first thing seen is the thing itself. */}
          <div className="ecgr-intro-preview" aria-hidden="true">
            <IntroPreview look={look} />
          </div>

          <div className="ecgr-choose">
            <span className="ecgr-choose-label">Practise</span>
            <div className="ecgr-chips" role="group" aria-label="Which ECGs">
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => {
                const n = id === 'all' ? ECG_CASES.length : ECG_CASES.filter(c => c.category === id).length;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`ecgr-chip${category === id ? ' is-on' : ''}`}
                    aria-pressed={category === id}
                    onClick={() => setCategory(id)}
                  >
                    {label} <span className="ecgr-chip-n">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="ecgr-rules">
            <li>Paper runs at <strong>25 mm/s</strong> and <strong>10 mm/mV</strong>: a small square is 0.04 s, a large one 0.2 s.</li>
            <li>Rate = 300 ÷ large squares between R waves. No number is shown — counting is the skill.</li>
            <li>Pause any strip (Space) to count. After you answer, it freezes so you can find the features.</li>
            <li>{RUN_LENGTH} strips a run · 100 points each, plus a bonus for every answer in a row.</li>
          </ul>

          <button type="button" className="ecgr-start" onClick={start}>Start reading</button>
        </div>
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const right = log.filter(l => l.correct).length;
    const missed = log.filter(l => !l.correct);
    const pct = Math.round((right / Math.max(1, log.length)) * 100);
    return (
      <div className="ecgr ecgr--summary">
        <div className="ecgr-topbar">
          {onExit && <button type="button" className="ecgr-back" onClick={onExit}>← Minigames</button>}
        </div>
        <div className="ecgr-summary">
          <p className="ecgr-kicker">Run complete</p>
          <h1 className="ecgr-title">{pct >= 80 ? 'Sharp reading.' : pct >= 50 ? 'Getting there.' : 'Keep at it.'}</h1>
          <div className="ecgr-stats">
            <div className="ecgr-stat"><span className="ecgr-stat-n">{score}</span><span className="ecgr-stat-l">Points</span></div>
            <div className="ecgr-stat"><span className="ecgr-stat-n">{right}/{log.length}</span><span className="ecgr-stat-l">Correct</span></div>
            <div className="ecgr-stat"><span className="ecgr-stat-n">{bestStreak}</span><span className="ecgr-stat-l">Best streak</span></div>
          </div>

          {missed.length > 0 ? (
            <div className="ecgr-missed">
              <h2 className="ecgr-missed-title">To revisit</h2>
              <ul>
                {missed.map((m, i) => (
                  <li key={i}>
                    <span className="ecgr-missed-answer">{m.caseDef.answer}</span>
                    <span className="ecgr-missed-you">you said {m.picked}</span>
                    <span className="ecgr-missed-key">{m.caseDef.look[0]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="ecgr-perfect">Every strip read correctly.</p>
          )}

          <div className="ecgr-summary-btns">
            <button type="button" className="ecgr-start" onClick={start}>Another run</button>
            <button type="button" className="ecgr-ghost" onClick={() => setPhase('intro')}>Change set</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ─────────────────────────────────────────────────────────────────
  const leadNames = signal?.leads.map(l => l.name).join(', ') || 'II';
  return (
    <div className="ecgr ecgr--run">
      <div className="ecgr-topbar">
        {onExit && <button type="button" className="ecgr-back" onClick={onExit}>← Quit</button>}
        <div className="ecgr-hud">
          <span className="ecgr-hud-item">Strip <strong>{index + 1}</strong>/{queue.length}</span>
          <span className="ecgr-hud-item">Score <strong>{score}</strong></span>
          <span className={`ecgr-hud-item ecgr-streak${streak >= 2 ? ' is-hot' : ''}`}>
            🔥 <strong>{streak}</strong>
          </span>
        </div>
      </div>

      <div className="ecgr-progress" aria-hidden="true">
        {queue.map((_, i) => {
          const entry = log[i];
          const cls = entry ? (entry.correct ? 'is-right' : 'is-wrong') : (i === index ? 'is-now' : '');
          return <span key={i} className={cls} />;
        })}
      </div>

      <div className="ecgr-stage">
        <div className="ecgr-monitor">
          <div className="ecgr-monitor-bar">
            <span className="ecgr-monitor-pulse" key={beatKey} aria-hidden="true">♥</span>
            <span className="ecgr-monitor-meta">
              Lead{signal?.leads.length > 1 ? 's' : ''} {leadNames} · 25 mm/s · 10 mm/mV
            </span>
            <div className="ecgr-monitor-ctrls">
              <div className="ecgr-seg" role="group" aria-label="Display">
                <button type="button" className={look === 'paper' ? 'is-on' : ''} onClick={() => setLookSaved('paper')}>Paper</button>
                <button type="button" className={look === 'monitor' ? 'is-on' : ''} onClick={() => setLookSaved('monitor')}>Monitor</button>
              </div>
              <button
                type="button"
                className="ecgr-pause"
                onClick={() => setPaused(p => !p)}
                aria-pressed={paused}
                title="Pause to count squares (Space)"
              >
                {paused ? '▶ Play' : '❚❚ Pause'}
              </button>
            </div>
          </div>

          {signal && (
            <ECGStrip
              signal={signal}
              paused={paused}
              look={look}
              onBeat={onBeat}
              ariaLabel={`ECG strip, ${leadNames}`}
            />
          )}
        </div>

        <h2 className="ecgr-prompt">What does this ECG show?</h2>

        <div className="ecgr-options">
          {q.options.map((opt, i) => {
            const isAnswer = opt === q.caseDef.answer;
            const cls = !answered ? '' : isAnswer ? ' is-right' : opt === picked ? ' is-wrong' : ' is-dim';
            return (
              <button
                key={opt}
                type="button"
                className={`ecgr-option${cls}`}
                onClick={() => choose(opt)}
                disabled={answered}
                style={{ '--d': `${i * 0.05}s` }}
              >
                <span className="ecgr-option-key">{i + 1}</span>
                <span className="ecgr-option-text">{opt}</span>
                {answered && isAnswer && <span className="ecgr-option-mark" aria-hidden="true">✓</span>}
                {answered && !isAnswer && opt === picked && <span className="ecgr-option-mark" aria-hidden="true">✗</span>}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`ecgr-reveal${correct ? ' is-right' : ' is-wrong'}`}>
            <div className="ecgr-reveal-head">
              <span className="ecgr-verdict">{correct ? 'Correct' : 'Not quite'}</span>
              <span className="ecgr-reveal-answer">{q.caseDef.answer}</span>
              {correct && streak >= 2 && <span className="ecgr-reveal-streak">{streak} in a row</span>}
            </div>
            <div className="ecgr-reveal-body">
              <div>
                <h3 className="ecgr-reveal-h">What to look for</h3>
                <ul className="ecgr-look">
                  {q.caseDef.look.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="ecgr-reveal-h">Why it matters</h3>
                <p className="ecgr-why">{q.caseDef.why}</p>
              </div>
            </div>
            <button type="button" className="ecgr-next" onClick={next} ref={nextBtnRef}>
              {index + 1 >= queue.length ? 'See results' : 'Next strip'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// The intro shows a strip, not a description of one: normal sinus rhythm,
// sweeping, so the paper and the scale are familiar before the first question.
function IntroPreview({ look }) {
  const signal = useMemo(() => buildSignal(ECG_CASES.find(c => c.id === 'nsr'), 4242), []);
  return <ECGStrip signal={signal} look={look} ariaLabel="A normal ECG, for illustration" />;
}
