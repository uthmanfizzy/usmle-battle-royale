import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PSYCH_CASES, CATEGORIES, DX } from '../psych/psychCases';
import PatientStage from '../psych/PatientStage';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './SpotTheDiagnosis.css';

/**
 * Spot the Diagnosis — psychiatry, from how the patient presents.
 *
 * Each case plays like a short video: the patient on screen moves the way
 * the condition looks, and the interview runs as live subtitles. Answer as
 * soon as you know — before the end earns a quick-read bonus.
 *
 *   GUIDED    — a mental-state-exam notepad fills in as you watch.
 *   CHALLENGE — the notepad is hidden; opening it halves the points.
 *
 * After answering: the clues that gave it away, the criteria as a table
 * (durations are the exam's favourite discriminator), the first-line
 * management, and why each other option is wrong.
 *
 * Nothing is saved to the server — like the other minigames, a run is
 * practice.
 */

const RUN_LENGTH = 8;
const POINTS = 20;
const QUICK_BONUS = 5;
const PERFECT_BONUS = 30;
const CHAR_MS = 26;          // subtitle typing speed at 1×
const LINE_GAP_MS = 950;     // pause between lines

const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

function buildQuestion(c) {
  const wrong = shuffle(c.distractors).slice(0, 3);
  return { caseDef: c, options: shuffle([c.answer, ...wrong]) };
}
const whyNot = (c, dx) => c.not?.[dx] || DX[dx];

export default function SpotTheDiagnosis({ onExit }) {
  const [phase, setPhase] = useState('intro');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mv_psych_mode') === 'challenge' ? 'challenge' : 'guided'; } catch { return 'guided'; }
  });
  const [speed, setSpeed] = useState(1);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [hinted, setHinted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [log, setLog] = useState([]);

  // Playback: which line, how many characters of it, playing or not.
  const [li, setLi] = useState(0);
  const [chars, setChars] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ended, setEnded] = useState(false);

  const q = queue[index] || null;
  const c = q?.caseDef;
  const answered = picked != null;
  const correct = answered && picked === c.answer;
  const pool = useMemo(() => (category === 'all' ? PSYCH_CASES : PSYCH_CASES.filter(x => x.category === category)), [category]);
  const transcriptRef = useRef(null);

  const saveMode = (m) => { setMode(m); try { localStorage.setItem('mv_psych_mode', m); } catch { /* not remembered */ } };

  const resetPlayback = () => { setLi(0); setChars(0); setPlaying(true); setEnded(false); };

  const start = () => {
    sfx.select();
    setQueue(shuffle(pool).slice(0, Math.min(RUN_LENGTH, pool.length)).map(buildQuestion));
    setIndex(0); setPicked(null); setHinted(false); setScore(0); setStreak(0); setBestStreak(0); setLog([]);
    resetPlayback();
    setPhase('run');
  };

  // The subtitle clock.
  useEffect(() => {
    if (phase !== 'run' || !c || !playing || ended) return undefined;
    const line = c.script[li];
    if (!line) { setEnded(true); return undefined; }
    if (chars < line.text.length) {
      const t = setTimeout(() => setChars(n => Math.min(line.text.length, n + 2)), (CHAR_MS * 2) / speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (li + 1 >= c.script.length) { setEnded(true); return; }
      setLi(i => i + 1); setChars(0);
    }, LINE_GAP_MS / speed);
    return () => clearTimeout(t);
  }, [phase, c, li, chars, playing, ended, speed]);

  // Keep the newest transcript line in view.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [li, chars]);

  const choose = useCallback((opt) => {
    if (!c || picked != null) return;
    const ok = opt === c.answer;
    setPicked(opt);
    const base = mode === 'challenge' && !hinted ? POINTS : POINTS / 2;
    const quick = ok && !ended ? QUICK_BONUS : 0;
    setScore(s => s + (ok ? base + quick : 0));
    if (ok) {
      sfx.correct(); setTimeout(() => sfx.sparkle(), 220);
      setStreak(st => { const nn = st + 1; setBestStreak(b => Math.max(b, nn)); return nn; });
    } else {
      sfx.wrong(); setStreak(0);
    }
    setLog(l => [...l, { caseDef: c, picked: opt, correct: ok, quick: quick > 0 }]);
    // Show the whole interview once answered — the rest is worth reading.
    setLi(c.script.length - 1); setChars(c.script[c.script.length - 1].text.length); setEnded(true);
  }, [c, picked, mode, hinted, ended]);

  const next = useCallback(() => {
    if (index + 1 >= queue.length) {
      const perfect = log.length === queue.length && log.every(l => l.correct);
      if (perfect) setScore(s => s + PERFECT_BONUS);
      sfx.fanfare();
      setPhase('summary');
      return;
    }
    sfx.next();
    setIndex(i => i + 1); setPicked(null); setHinted(false);
    resetPlayback();
    document.querySelector('.std')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, queue.length, log]);

  const replay = () => { sfx.select(); resetPlayback(); };

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (e.key === ' ') { e.preventDefault(); if (ended) replay(); else setPlaying(p => !p); return; }
      if (!answered && /^[1-4]$/.test(e.key)) { const o = q?.options[Number(e.key) - 1]; if (o) { e.preventDefault(); choose(o); } }
      else if (answered && e.key === 'Enter') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answered, q, choose, next, ended]);

  // ── Intro ───────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const demo = PSYCH_CASES.find(x => x.id === 'mania');
    return (
      <div className="std std--intro">
        <div className="std-top">
          {onExit && <button type="button" className="std-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="std-intro">
          <div className="std-intro-stage">
            <PatientStage patient={demo.patient} demeanor="elated" face="happy" talking />
          </div>
          <div className="std-intro-copy">
            <p className="std-kicker">Psychiatry · Minigame</p>
            <h1 className="std-title">Spot the Diagnosis</h1>
            <p className="std-lede">
              A patient sits down and the interview plays. Watch how they move, listen to what they say,
              and name the diagnosis — the sooner you know, the more it is worth.
            </p>
            <ul className="std-how">
              <li><span>🎬</span> Watch the interview — body language is a clue</li>
              <li><span>📝</span> The mental state exam fills in as you go</li>
              <li><span>⏱</span> Answer any time; before the end is a quick read (+{QUICK_BONUS})</li>
              <li><span>📋</span> Then the criteria, the durations and why the others are wrong</li>
            </ul>
            <div className="std-choose">
              <span className="std-choose-label">Mode</span>
              <div className="std-seg" role="group" aria-label="Mode">
                <button type="button" className={mode === 'guided' ? 'is-on' : ''} aria-pressed={mode === 'guided'} onClick={() => saveMode('guided')}>Guided <small>notes shown</small></button>
                <button type="button" className={mode === 'challenge' ? 'is-on' : ''} aria-pressed={mode === 'challenge'} onClick={() => saveMode('challenge')}>Challenge <small>notes hidden</small></button>
              </div>
            </div>
            <div className="std-choose">
              <span className="std-choose-label">Cases</span>
              <div className="std-chips" role="group" aria-label="Which cases">
                {Object.entries(CATEGORIES).map(([id, label]) => {
                  const nn = id === 'all' ? PSYCH_CASES.length : PSYCH_CASES.filter(x => x.category === id).length;
                  return (
                    <button key={id} type="button" className={`std-chip${category === id ? ' is-on' : ''}`} aria-pressed={category === id} onClick={() => setCategory(id)}>
                      {label} <span>{nn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" className="std-start" onClick={start}>See the first patient</button>
            <p className="std-fine">{Math.min(RUN_LENGTH, pool.length)} patients a run · {POINTS} points each ({POINTS / 2} in Guided or with notes revealed) · +{PERFECT_BONUS} for a perfect run</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const right = log.filter(l => l.correct).length;
    const missed = log.filter(l => !l.correct);
    const byCat = {};
    for (const l of log) { const k = l.caseDef.category; byCat[k] = byCat[k] || { right: 0, total: 0 }; byCat[k].total++; if (l.correct) byCat[k].right++; }
    return (
      <div className="std std--summary">
        <div className="std-top">
          {onExit && <button type="button" className="std-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="std-summary">
          <p className="std-kicker">Clinic closed</p>
          <h1 className="std-title">{right === log.length ? 'Every patient read.' : right >= log.length * 0.75 ? 'Sharp clinical eye.' : right >= log.length / 2 ? 'Getting there.' : 'Worth another clinic.'}</h1>
          <div className="std-stats">
            <div><b>{score}</b><span>Points</span></div>
            <div><b>{right}/{log.length}</b><span>Correct</span></div>
            <div><b>{log.filter(l => l.quick).length}</b><span>Quick reads</span></div>
            <div><b>{bestStreak}</b><span>Best streak</span></div>
          </div>
          <div className="std-card std-bycat">
            {Object.entries(byCat).map(([k, v]) => {
              const p = Math.round((v.right / v.total) * 100);
              return (
                <div className="std-bar" key={k}>
                  <span>{CATEGORIES[k]}</span>
                  <span className="std-bar-track"><i style={{ width: `${p}%` }} className={p >= 80 ? 'is-good' : p >= 50 ? 'is-mid' : 'is-low'} /></span>
                  <span>{v.right}/{v.total}</span>
                </div>
              );
            })}
          </div>
          {missed.length > 0 && (
            <div className="std-card std-missed">
              <h2>Worth another look</h2>
              {missed.map((m, i) => (
                <div key={i} className="std-missed-row">
                  <p><b>{m.caseDef.answer}</b> <span>— you said {m.picked}</span></p>
                  <p className="std-missed-key">{whyNot(m.caseDef, m.picked)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="std-summary-btns">
            <button type="button" className="std-start" onClick={start}>Another clinic</button>
            <button type="button" className="std-ghost" onClick={() => setPhase('intro')}>Change settings</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ─────────────────────────────────────────────────────────────────
  const line = c.script[li];
  const typing = line && chars < line.text.length;
  const ptTalking = !answered && playing && !ended && line?.who === 'pt' && typing;
  const act = !answered && line?.who === 'pt' && line.act ? line.act : null;
  const shownLines = c.script.slice(0, li + 1);
  const lineNotes = c.script.slice(0, li + 1).filter(l => l.note).map(l => l.note);
  const notesVisible = mode === 'guided' || hinted || answered;
  const progress = ended ? 1 : (li + (line ? chars / Math.max(1, line.text.length) : 0)) / c.script.length;

  return (
    <div className="std std--run">
      <div className="std-top">
        {onExit && <button type="button" className="std-back" onClick={onExit}>← Quit</button>}
        <div className="std-hud">
          <SfxToggle />
          <span>Patient <b>{index + 1}</b>/{queue.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={streak >= 2 ? 'is-hot' : ''}>🔥 <b>{streak}</b></span>
        </div>
      </div>

      <div className="std-layout">
        <section className="std-left">
          <div className="std-video" key={c.id}>
            <PatientStage
              patient={c.patient}
              demeanor={c.demeanor}
              face={c.face}
              act={act}
              talking={ptTalking}
              caption={line && !answered && (
                <div className={`std-sub std-sub--${line.who}`} key={li}>
                  <span className="std-sub-who">{line.who === 'pt' ? c.patient.name : 'Doctor'}</span>
                  <span>{line.text.slice(0, chars)}{typing && <i className="std-caret" />}</span>
                </div>
              )}
            />
            <div className="std-controls">
              <button type="button" className="std-ctl" onClick={() => (ended ? replay() : setPlaying(p => !p))} aria-label={ended ? 'Replay' : playing ? 'Pause' : 'Play'}>
                {ended ? '↺' : playing ? '❚❚' : '▶'}
              </button>
              <span className="std-scrub" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></span>
              <div className="std-speed" role="group" aria-label="Playback speed">
                {[1, 1.5, 2].map(s => (
                  <button key={s} type="button" className={speed === s ? 'is-on' : ''} onClick={() => setSpeed(s)}>{s}×</button>
                ))}
              </div>
            </div>
          </div>

          <div className="std-card std-transcript" ref={transcriptRef} aria-live="polite">
            <p className="std-card-k">Transcript</p>
            {shownLines.map((l, i) => {
              const isNow = i === li && !ended;
              return (
                <p key={i} className={`std-line std-line--${l.who}${isNow ? ' is-now' : ''}`}>
                  <b>{l.who === 'pt' ? c.patient.name : 'Dr'}</b>
                  <span>{isNow ? l.text.slice(0, chars) : l.text}</span>
                </p>
              );
            })}
          </div>
        </section>

        <section className="std-right">
          <div className="std-card std-patient">
            <p className="std-card-k">Patient</p>
            <p className="std-patient-id"><b>{c.patient.name}</b>, {c.patient.age}{c.patient.sex}</p>
          </div>

          <div className={`std-card std-notes${notesVisible ? '' : ' is-hidden'}`}>
            <p className="std-card-k">📝 Mental state exam</p>
            {notesVisible ? (
              <ul>
                {[...c.mse, ...lineNotes].map((nn, i) => (
                  <li key={`${nn.k}-${i}`} style={{ '--d': `${0.04 * (i % 4)}s` }}><b>{nn.k}</b><span>{nn.v}</span></li>
                ))}
              </ul>
            ) : (
              <button type="button" className="std-hint" onClick={() => { sfx.select(); setHinted(true); }}>
                Open the notepad <small>(half points)</small>
              </button>
            )}
          </div>

          <div className="std-card std-q">
            <h2 className="std-prompt">What is the most likely diagnosis?</h2>
            <div className="std-options">
              {q.options.map((opt, i) => {
                const isAns = opt === c.answer;
                const cls = !answered ? '' : isAns ? ' is-right' : opt === picked ? ' is-wrong' : ' is-dim';
                return (
                  <button key={opt} type="button" className={`std-option${cls}`} onClick={() => choose(opt)} disabled={answered} style={{ '--d': `${0.05 * i}s` }}>
                    <span className="std-option-key">{i + 1}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {answered && (
        <div className={`std-reveal${correct ? ' is-right' : ' is-wrong'}`}>
          <p className="std-verdict">
            {correct ? `Correct — ${c.answer}` : `It was ${c.answer}`}
            {log[log.length - 1]?.quick && <span className="std-quick">⚡ Quick read +{QUICK_BONUS}</span>}
          </p>
          {!correct && <p className="std-whynot"><b>Why not {picked}:</b> {whyNot(c, picked)}</p>}

          <div className="std-reveal-grid">
            <div className="std-card">
              <p className="std-card-k">🔎 What gave it away</p>
              <ol className="std-clues">{c.clues.map((cl, i) => <li key={i} style={{ '--d': `${0.1 * i}s` }}>{cl}</li>)}</ol>
            </div>
            <div className="std-card std-criteria">
              <p className="std-card-k">📋 Criteria — {c.answer}</p>
              <table>
                <tbody>
                  {c.rule.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
                </tbody>
              </table>
              <p className="std-tx"><b>Management</b> {c.tx}</p>
            </div>
          </div>

          <div className="std-card std-others">
            <p className="std-card-k">Why not the others</p>
            <ul>
              {q.options.filter(o => o !== c.answer).map(o => (
                <li key={o} className={o === picked ? 'is-picked' : ''}><b>{o}</b> <span>{whyNot(c, o)}</span></li>
              ))}
            </ul>
          </div>

          <button type="button" className="std-next" onClick={next} autoFocus>
            {index + 1 >= queue.length ? 'See results' : 'Next patient'} →
          </button>
        </div>
      )}
    </div>
  );
}
