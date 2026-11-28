import { useEffect, useMemo, useRef, useState } from 'react';
import { BIO_CASES, BIO_BY_ID, BIO_CHAPTERS, INHERIT_LABEL } from '../hyd/bioCases';
import QB from '../hyd/qbank/bioQbank';
import { hydSfx } from '../hydSfx';
import { createHydMusic, hydMusicPref, setHydMusicPref } from '../hydMusic';
import SfxToggle from './SfxToggle';
import './HydQbank.css';

/**
 * HY Diseases · Biochemistry Qbank, Buzz Fun style.
 *
 * Setup: pick wards (chapters), how many questions this cycle, and whether
 * to skip the ones already done today. Then a fast block: a condensed HY
 * vignette, four diagnoses, and tapping one IS the answer (no Submit). A
 * short explanation follows: three high-yield points and the one difference
 * from the disease it is most confused with.
 *
 * Content: hyd/qbank/bioQbank.js (condensed stems), keyed by the case ids
 * in hyd/bioCases.js, whose lookalikes are the wrong options.
 */

const SEEN_KEY = 'mv_hyd_qb_seen';
const SETUP_KEY = 'mv_hyd_qb_setup';
const SIZES = [5, 10, 20, 40];

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function readSeen() {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || 'null');
    if (v && v.day === today() && Array.isArray(v.ids)) return new Set(v.ids);
  } catch { /* storage blocked */ }
  return new Set();
}
function markSeen(id) {
  const s = readSeen(); s.add(id);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify({ day: today(), ids: [...s] })); } catch { /* not remembered */ }
}
function readSetup() {
  try { return { size: 10, skip: true, chapters: [], ...JSON.parse(localStorage.getItem(SETUP_KEY) || '{}') }; } catch { return { size: 10, skip: true, chapters: [] }; }
}
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// "**bold**" in a stem → <strong>.
function Rich({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

// Ambient background: drifting glows, floating cells, an ECG trace.
function Backdrop({ flash }) {
  return (
    <div className={`hq-bg${flash ? ` is-${flash}` : ''}`} aria-hidden="true">
      <span className="hq-glow hq-glow--a" />
      <span className="hq-glow hq-glow--b" />
      <span className="hq-glow hq-glow--c" />
      {Array.from({ length: 14 }).map((_, i) => <i key={i} className="hq-cell" style={{ '--k': i }} />)}
      <div className="hq-ecg">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d={Array.from({ length: 6 }).map((_, i) => {
            const x = i * 200;
            return `${i ? 'L' : 'M'}${x},30 L${x + 70},30 L${x + 80},24 L${x + 90},30 L${x + 100},30 L${x + 106},6 L${x + 114},52 L${x + 120},30 L${x + 140},30 L${x + 155},22 L${x + 170},30 L${x + 200},30`;
          }).join(' ')} />
        </svg>
      </div>
    </div>
  );
}

function Burst({ k }) {
  return (
    <span className="hq-burst" key={k} aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => <i key={i} style={{ '--a': `${i * 22.5}deg`, '--d': `${60 + (i % 3) * 22}px` }} />)}
    </span>
  );
}

function Setup({ onStart, onExit, clinic, onClinic, progress }) {
  const [cfg, setCfg] = useState(readSetup);
  const [custom, setCustom] = useState(SIZES.includes(cfg.size) || cfg.size === 0 ? '' : String(cfg.size));
  const seen = useMemo(readSeen, []);
  const save = (next) => { setCfg(next); try { localStorage.setItem(SETUP_KEY, JSON.stringify(next)); } catch { /* fine */ } };

  const inWards = BIO_CASES.filter(c => !cfg.chapters.length || cfg.chapters.includes(c.chapter));
  const pool = cfg.skip ? inWards.filter(c => !seen.has(c.id)) : inWards;
  const want = cfg.size === 0 ? pool.length : Math.min(cfg.size, pool.length);
  const doneToday = inWards.filter(c => seen.has(c.id)).length;
  const learned = Object.keys(progress).length;

  const toggleWard = (id) => {
    const has = cfg.chapters.includes(id);
    save({ ...cfg, chapters: has ? cfg.chapters.filter(x => x !== id) : [...cfg.chapters, id] });
    hydSfx.tap();
  };

  return (
    <div className="hq-setup">
      <div className="hq-topbar">
        <button type="button" className="hq-back" onClick={onExit}>← HY Diseases</button>
        <span className="hq-top-title">Biochemistry</span>
        <SfxToggle className="hq-sfx" />
      </div>

      <header className="hq-hero">
        <span className="hq-kicker"><span className="hq-pulse-dot" /> HY Diseases · Qbank</span>
        <h1>Name the <em>disease</em>.</h1>
        <p>Short, high-yield cases. Tap a diagnosis to lock it in, then get the facts that matter and how it differs from its look-alike.</p>
        <div className="hq-hero-stats">
          <span><b>{BIO_CASES.length}</b> cases</span>
          <span><b>{learned}</b> seen ever</span>
          <span><b>{seen.size}</b> done today</span>
        </div>
      </header>

      <div className="hq-modes" role="radiogroup" aria-label="Style">
        <button type="button" role="radio" aria-checked="true" className="hq-mode is-on">
          <b>📝 Qbank</b><small>condensed HY vignettes</small>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked="false"
          className={`hq-mode${clinic ? '' : ' is-locked'}`}
          onClick={clinic ? onClinic : undefined}
          disabled={!clinic}
          title={clinic ? 'Open the animated clinic' : 'Clinic is locked for now'}
        >
          <b>🩺 Clinic {clinic ? '' : '🔒'}</b><small>{clinic ? 'admin preview' : 'coming soon'}</small>
        </button>
      </div>

      <section className="hq-panel">
        <h2><span>1</span> Wards</h2>
        <div className="hq-chips">
          <button type="button" className={`hq-chip${cfg.chapters.length ? '' : ' is-on'}`} onClick={() => { save({ ...cfg, chapters: [] }); hydSfx.tap(); }}>
            ✨ All <small>{BIO_CASES.length}</small>
          </button>
          {BIO_CHAPTERS.map(ch => {
            const n = BIO_CASES.filter(c => c.chapter === ch.id).length;
            return (
              <button key={ch.id} type="button" style={{ '--t': ch.tint }} className={`hq-chip${cfg.chapters.includes(ch.id) ? ' is-on' : ''}`} onClick={() => toggleWard(ch.id)}>
                {ch.icon} {ch.name} <small>{n}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hq-panel">
        <h2><span>2</span> Questions this cycle</h2>
        <div className="hq-chips">
          {SIZES.map(n => (
            <button key={n} type="button" className={`hq-chip hq-chip--num${cfg.size === n && !custom ? ' is-on' : ''}`} onClick={() => { setCustom(''); save({ ...cfg, size: n }); hydSfx.tap(); }}>{n}</button>
          ))}
          <button type="button" className={`hq-chip hq-chip--num${cfg.size === 0 ? ' is-on' : ''}`} onClick={() => { setCustom(''); save({ ...cfg, size: 0 }); hydSfx.tap(); }}>All</button>
          <label className={`hq-custom${custom ? ' is-on' : ''}`}>
            <span>Custom</span>
            <input
              type="number"
              min="1"
              max={BIO_CASES.length}
              inputMode="numeric"
              placeholder="#"
              value={custom}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 3);
                setCustom(v);
                const n = parseInt(v, 10);
                if (n > 0) save({ ...cfg, size: Math.min(n, BIO_CASES.length) });
              }}
            />
          </label>
        </div>
      </section>

      <section className="hq-panel">
        <h2><span>3</span> Today</h2>
        <button type="button" className={`hq-switch${cfg.skip ? ' is-on' : ''}`} role="switch" aria-checked={cfg.skip} onClick={() => { save({ ...cfg, skip: !cfg.skip }); hydSfx.tap(); }}>
          <span className="hq-switch-knob" aria-hidden="true" />
          <span>
            <b>Skip questions I did today</b>
            <small>{doneToday} of {inWards.length} in these wards done today</small>
          </span>
        </button>
      </section>

      <div className="hq-start-row">
        {pool.length === 0 ? (
          <p className="hq-empty">You have done every question in these wards today. 🎉 Turn off “Skip questions I did today” to go again.</p>
        ) : (
          <button type="button" className="hq-start" onClick={() => onStart(shuffle(pool).slice(0, want))}>
            Start {want} question{want === 1 ? '' : 's'} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Question({ c, index, total, streak, score, onAnswer, onNext, onQuit, musicOn, toggleMusic }) {
  const q = QB[c.id];
  const options = useMemo(() => shuffle([c.id, ...Object.keys(c.lookalikes)]), [c]);
  const [pick, setPick] = useState(null);
  const expRef = useRef(null);
  const done = pick !== null;
  const right = pick === c.id;
  const chapter = BIO_CHAPTERS.find(ch => ch.id === c.chapter);
  const [vsId, vsText] = q?.vs || [];

  useEffect(() => { hydSfx.card(); }, []);

  function choose(id) {
    if (done) return;
    setPick(id);
    onAnswer(c.id, id === c.id);
  }

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => expRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 450);
    return () => clearTimeout(t);
  }, [done]);

  // Keys: 1–4 or A–D answer; Enter / → moves on.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      const i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
      if (!done && i >= 0 && options[i]) { e.preventDefault(); choose(options[i]); }
      else if (done && (e.key === 'Enter' || e.key === 'ArrowRight')) { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pct = ((index + (done ? 1 : 0)) / total) * 100;

  return (
    <div className="hq-run">
      <div className="hq-hud">
        <button type="button" className="hq-back" onClick={onQuit}>✕ End</button>
        <div className="hq-hud-mid">
          <span className="hq-hud-count">Q <b>{index + 1}</b> / {total}</span>
          <span className="hq-bar"><i style={{ width: `${pct}%` }} /></span>
        </div>
        <span className={`hq-streak${streak >= 2 ? ' is-hot' : ''}`} key={`s${streak}`} title="Streak">🔥 {streak}</span>
        <span className="hq-score" title="Correct">✓ {score}</span>
        <button type="button" className={`hq-music${musicOn ? ' is-on' : ''}`} onClick={toggleMusic} aria-pressed={musicOn} title="Background music">♫</button>
        <SfxToggle className="hq-sfx" />
      </div>

      <article className={`hq-card${done ? (right ? ' is-right' : ' is-wrong') : ''}`} key={c.id}>
        <div className="hq-card-tags">
          <span className="hq-tag" style={{ '--t': chapter?.tint }}>{chapter?.icon} {chapter?.name}</span>
        </div>
        <p className="hq-stem"><Rich text={q?.s || c.hint} /></p>
        <p className="hq-ask">Most likely diagnosis?</p>
        <div className="hq-options">
          {options.map((id, i) => {
            const state = !done ? '' : id === c.id ? ' is-right' : id === pick ? ' is-wrong' : ' is-dim';
            return (
              <button
                key={id}
                type="button"
                className={`hq-opt${state}`}
                style={{ '--i': i }}
                onClick={() => choose(id)}
                disabled={done}
              >
                <span className="hq-opt-l">{'ABCD'[i]}</span>
                <span className="hq-opt-t">{BIO_BY_ID[id].name}</span>
                {done && id === c.id && <span className="hq-opt-m" aria-hidden="true">✓</span>}
                {done && id === pick && !right && <span className="hq-opt-m" aria-hidden="true">✕</span>}
                {done && id === c.id && right && <Burst k={c.id} />}
              </button>
            );
          })}
        </div>
        {done && right && <span className="hq-plus" aria-hidden="true">+1{streak >= 3 ? ` · ${streak} in a row!` : ''}</span>}
      </article>

      {done && (
        <section className={`hq-exp${right ? ' is-right' : ' is-wrong'}`} ref={expRef}>
          <div className="hq-verdict">
            <span className="hq-verdict-icon" aria-hidden="true">{right ? '✓' : '✕'}</span>
            <div>
              <small>{right ? 'Correct' : 'Not quite: the answer is'}</small>
              <strong>{c.name}</strong>
            </div>
            <span className="hq-tag hq-tag--dim hq-verdict-inherit">{INHERIT_LABEL[c.inherit] || c.inherit}</span>
          </div>

          <ul className="hq-hy">
            {(q?.hy || c.learn.key).map((h, i) => <li key={h} style={{ '--i': i }}>{h}</li>)}
          </ul>

          {vsId && (
            <div className="hq-vs">
              <span className="hq-vs-tag">⚖ vs {BIO_BY_ID[vsId]?.name}</span>
              <p>{vsText}</p>
            </div>
          )}
          {!right && pick !== vsId && c.lookalikes[pick] && (
            <div className="hq-vs hq-vs--picked">
              <span className="hq-vs-tag">Why not {BIO_BY_ID[pick]?.name}</span>
              <p>{c.lookalikes[pick]}</p>
            </div>
          )}

          <button type="button" className="hq-next" onClick={onNext}>
            {index + 1 < total ? <>Next question <span aria-hidden="true">→</span></> : <>See results <span aria-hidden="true">★</span></>}
          </button>
        </section>
      )}
    </div>
  );
}

function Summary({ log, bestStreak, onAgain, onSetup, onExit }) {
  const got = log.filter(r => r.right).length;
  const pct = log.length ? Math.round((got / log.length) * 100) : 0;
  const msg = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Great work!' : pct >= 50 ? 'Solid. Keep going.' : 'Every miss is a fact learned.';
  return (
    <div className="hq-summary">
      <div className="hq-ring" style={{ '--p': pct }}>
        <span><b>{pct}%</b><small>{got} / {log.length}</small></span>
      </div>
      <h2>{msg}</h2>
      <p className="hq-summary-sub">Best streak 🔥 {bestStreak}</p>
      <ul className="hq-summary-list">
        {log.map((r, i) => (
          <li key={r.id} className={r.right ? 'is-right' : 'is-wrong'} style={{ '--i': i }}>
            <span aria-hidden="true">{r.right ? '✓' : '✕'}</span>
            {BIO_BY_ID[r.id].name}
          </li>
        ))}
      </ul>
      <div className="hq-summary-actions">
        <button type="button" className="hq-start" onClick={onAgain}>Another cycle <span aria-hidden="true">→</span></button>
        <button type="button" className="hq-ghost" onClick={onSetup}>Change settings</button>
        <button type="button" className="hq-ghost" onClick={onExit}>Back to HY Diseases</button>
      </div>
    </div>
  );
}

export default function HydQbank({ onExit, clinic, onClinic, progress, onResult }) {
  const [phase, setPhase] = useState('setup');   // setup | run | summary
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [log, setLog] = useState([]);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState(null);
  const [musicOn, setMusicOn] = useState(hydMusicPref);
  const music = useRef(null);
  if (!music.current) music.current = createHydMusic();

  useEffect(() => {
    if (phase === 'run' && musicOn) music.current.start();
    else music.current.stop();
  }, [phase, musicOn]);
  useEffect(() => () => music.current.stop(), []);

  function toggleMusic() { const n = !musicOn; setMusicOn(n); setHydMusicPref(n); }

  function start(list) {
    setQueue(list); setIndex(0); setLog([]); setStreak(0); setBest(0);
    setPhase('run');
    hydSfx.start();
    window.scrollTo(0, 0);
  }

  function answer(id, right) {
    markSeen(id);
    onResult?.(id, right);
    setLog(l => [...l, { id, right }]);
    const s = right ? streak + 1 : 0;
    setStreak(s);
    setBest(b => Math.max(b, s));
    if (right) { hydSfx.correct(s); if (s > 0 && s % 5 === 0) hydSfx.streak(); } else hydSfx.wrong();
    setFlash(right ? 'right' : 'wrong');
    setTimeout(() => setFlash(null), 900);
  }

  function next() {
    if (index + 1 < queue.length) { setIndex(i => i + 1); hydSfx.next(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else { setPhase('summary'); hydSfx.complete(); window.scrollTo(0, 0); }
  }

  function again() {
    const seen = readSeen();
    const { skip, chapters, size } = readSetup();
    const inWards = BIO_CASES.filter(c => !chapters.length || chapters.includes(c.chapter));
    const pool = skip ? inWards.filter(c => !seen.has(c.id)) : inWards;
    if (!pool.length) { setPhase('setup'); return; }
    start(shuffle(pool).slice(0, size === 0 ? pool.length : size));
  }

  const score = log.filter(r => r.right).length;

  return (
    <div className="hq-screen">
      <Backdrop flash={flash} />
      <div className="hq-wrap">
        {phase === 'setup' && <Setup onStart={start} onExit={onExit} clinic={clinic} onClinic={onClinic} progress={progress} />}
        {phase === 'run' && queue[index] && (
          <Question
            key={queue[index].id}
            c={queue[index]}
            index={index}
            total={queue.length}
            streak={streak}
            score={score}
            onAnswer={answer}
            onNext={next}
            onQuit={() => (log.length ? setPhase('summary') : setPhase('setup'))}
            musicOn={musicOn}
            toggleMusic={toggleMusic}
          />
        )}
        {phase === 'summary' && <Summary log={log} bestStreak={best} onAgain={again} onSetup={() => setPhase('setup')} onExit={onExit} />}
      </div>
    </div>
  );
}
