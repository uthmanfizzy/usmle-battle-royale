import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BIO_CASES, BIO_BY_ID, BIO_CHAPTERS, INHERIT_LABEL } from '../hyd/bioCases';
import QB from '../hyd/qbank/bioQbank';
import { hydSfx } from '../hydSfx';
import { createHydMusic, hydMusicPref, setHydMusicPref } from '../hydMusic';
import './HydQbank.css';

/**
 * HY Diseases Qbank, Buzz Fun style. Story Mode's "HY Diseases" card opens
 * straight on this setup page (/hy-diseases).
 *
 * Setup: subject (Biochemistry open, the rest coming), wards (chapters), how
 * many questions this cycle, and whether to skip the ones done today.
 * Run: a condensed HY vignette, 40 s to tap a diagnosis (tapping IS the
 * answer), then 30 s with the explanation before it moves on by itself.
 * After answering, the highlighted clues in the stem open a small pop-up
 * saying why each one happens. Pause freezes both clocks.
 *
 * Content: hyd/qbank/bioQbank.js, keyed by the case ids in hyd/bioCases.js,
 * whose lookalikes are the wrong options.
 */

const SEEN_KEY = 'mv_hyd_qb_seen';
const SETUP_KEY = 'mv_hyd_qb_setup';
const SIZES = [5, 10, 20, 40];
const ANSWER_S = 40;
const READ_S = 30;

// Subjects. Only Biochemistry has cases so far; the rest show as "soon".
const SUBJECTS = [
  { id: 'biochem', name: 'Biochemistry', icon: '⚗️', open: true },
  { id: 'immuno', name: 'Immunology', icon: '🛡️' },
  { id: 'micro', name: 'Microbiology', icon: '🦠' },
  { id: 'heme', name: 'Haematology', icon: '🩸' },
  { id: 'neuro', name: 'Neurology', icon: '🧠' },
  { id: 'cardio', name: 'Cardiology', icon: '🫀' },
  { id: 'endo', name: 'Endocrinology', icon: '🦋' },
  { id: 'resp', name: 'Respiratory', icon: '🫁' },
];

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
  const base = { subject: 'biochem', size: 10, skip: true, chapters: [] };
  try { return { ...base, ...JSON.parse(localStorage.getItem(SETUP_KEY) || '{}') }; } catch { return base; }
}
function poolFor({ skip, chapters }) {
  const seen = readSeen();
  const inWards = BIO_CASES.filter(c => !chapters.length || chapters.includes(c.chapter));
  return { inWards, pool: skip ? inWards.filter(c => !seen.has(c.id)) : inWards, seen };
}
// The app scrolls inside #root, not the window, so scroll the page's own
// top into view (works whichever element is the scroller).
const toTop = (smooth = false) => {
  const el = document.querySelector('.hq-screen');
  if (el) el.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
};
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

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

function MusicButton({ on, onToggle }) {
  return (
    <button type="button" className={`hq-music${on ? ' is-on' : ''}`} onClick={onToggle} aria-pressed={on} title={on ? 'Music on' : 'Music off'}>
      <span aria-hidden="true">♫</span><span className="hq-music-t">{on ? 'Music' : 'Off'}</span>
    </button>
  );
}

/** Countdown ring: fills down from full; turns gold then red near the end. */
function Clock({ left, total, label }) {
  const frac = Math.max(0, left / total);
  const r = 17, circ = 2 * Math.PI * r;
  const tone = left <= 5 ? ' is-red' : left <= 12 ? ' is-gold' : '';
  return (
    <span className={`hq-clock${tone}`} title={label} aria-label={`${Math.ceil(left)} seconds left`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} className="hq-clock-bg" />
        <circle cx="20" cy="20" r={r} className="hq-clock-fg" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} />
      </svg>
      <b>{Math.ceil(left)}</b>
    </span>
  );
}

function Setup({ onStart, onExit, clinic, onClinic, progress, musicOn, toggleMusic }) {
  const [cfg, setCfg] = useState(readSetup);
  const [custom, setCustom] = useState(SIZES.includes(cfg.size) || cfg.size === 0 ? '' : String(cfg.size));
  const save = (next) => { setCfg(next); try { localStorage.setItem(SETUP_KEY, JSON.stringify(next)); } catch { /* fine */ } };

  const { inWards, pool, seen } = poolFor(cfg);
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
        <button type="button" className="hq-back" onClick={onExit}>← Story Mode</button>
        <span className="hq-top-title">HY Diseases</span>
        <MusicButton on={musicOn} onToggle={toggleMusic} />
      </div>

      <header className="hq-hero">
        <span className="hq-kicker"><span className="hq-pulse-dot" /> HY Diseases · Qbank</span>
        <h1>Name the <em>disease</em>.</h1>
        <p>Short, high-yield cases against the clock. Tap a diagnosis to lock it in, then tap the highlighted clues to see why they happen.</p>
        <div className="hq-hero-stats">
          <span><b>{BIO_CASES.length}</b> cases</span>
          <span><b>{learned}</b> seen ever</span>
          <span><b>{seen.size}</b> done today</span>
          <span><b>{ANSWER_S}s</b> per question</span>
        </div>
      </header>

      {clinic && (
        <div className="hq-modes" role="radiogroup" aria-label="Style">
          <button type="button" role="radio" aria-checked="true" className="hq-mode is-on">
            <b>📝 Qbank</b><small>condensed HY vignettes</small>
          </button>
          <button type="button" role="radio" aria-checked="false" className="hq-mode" onClick={onClinic}>
            <b>🩺 Clinic</b><small>admin preview</small>
          </button>
        </div>
      )}

      <section className="hq-panel">
        <h2><span>1</span> Subject</h2>
        <div className="hq-subjects">
          {SUBJECTS.map(sub => (
            <button
              key={sub.id}
              type="button"
              className={`hq-subject${cfg.subject === sub.id ? ' is-on' : ''}${sub.open ? '' : ' is-locked'}`}
              onClick={sub.open ? () => { save({ ...cfg, subject: sub.id }); hydSfx.tap(); } : undefined}
              disabled={!sub.open}
              aria-pressed={cfg.subject === sub.id}
            >
              <span className="hq-subject-icon" aria-hidden="true">{sub.icon}</span>
              <span className="hq-subject-name">{sub.name}</span>
              <small>{sub.open ? `${BIO_CASES.length} cases` : '🔒 Soon'}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="hq-panel">
        <h2><span>2</span> Wards</h2>
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
        <h2><span>3</span> Questions this cycle</h2>
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
        <h2><span>4</span> Today</h2>
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

/**
 * The stem. Before answering, highlighted clues are just bold. After, each
 * is a button that opens a small pop-up beside it saying why it happens.
 */
function Stem({ text, notes, live, open, setOpen }) {
  const wrapRef = useRef(null);
  const btnRefs = useRef({});
  const [pos, setPos] = useState(null);
  const parts = text.split(/\*\*(.+?)\*\*/g);

  useLayoutEffect(() => {
    if (open == null) { setPos(null); return; }
    const wrap = wrapRef.current, btn = btnRefs.current[open];
    if (!wrap || !btn) return;
    // A clue can wrap over two lines: anchor under its last line.
    const W = wrap.getBoundingClientRect();
    const rects = btn.getClientRects();
    const B = rects.length ? rects[rects.length - 1] : btn.getBoundingClientRect();
    const width = Math.min(320, W.width);
    const left = Math.max(0, Math.min(B.left - W.left, W.width - width));
    const arrow = Math.max(14, Math.min(B.left - W.left - left + Math.min(B.width, 120) / 2, width - 14));
    setPos({ top: B.bottom - W.top + 8, left, width, arrow });
  }, [open]);

  // Outside tap or Escape closes it.
  useEffect(() => {
    if (open == null) return undefined;
    const close = (e) => { if (!e.target.closest?.('.hq-clue, .hq-pop')) setOpen(null); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('keydown', esc); };
  }, [open, setOpen]);

  return (
    <div className="hq-stem-wrap" ref={wrapRef}>
      <p className={`hq-stem${live ? ' is-live' : ''}`}>
        {parts.map((p, i) => {
          if (i % 2 === 0) return p;
          if (!live || !notes?.[p]) return <strong key={i}>{p}</strong>;
          return (
            // A span, not a <button>: a button cannot wrap across lines.
            <span
              key={i}
              role="button"
              tabIndex={0}
              ref={(el) => { btnRefs.current[i] = el; }}
              className={`hq-clue${open === i ? ' is-open' : ''}`}
              onClick={() => { setOpen(open === i ? null : i); hydSfx.tap(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(open === i ? null : i); } }}
              aria-expanded={open === i}
            >
              {p}
            </span>
          );
        })}
      </p>
      {open != null && pos && (
        <div className="hq-pop" role="dialog" aria-label="Why this happens" style={{ top: pos.top, left: pos.left, width: pos.width, '--arrow': `${pos.arrow}px` }}>
          <div className="hq-pop-head">
            <span>💡 Why it happens</span>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close">✕</button>
          </div>
          <p>{notes[parts[open]]}</p>
        </div>
      )}
    </div>
  );
}

function Question({ c, index, total, streak, score, onAnswer, onNext, onQuit, musicOn, toggleMusic, paused, setPaused }) {
  const q = QB[c.id];
  const options = useMemo(() => shuffle([c.id, ...Object.keys(c.lookalikes)]), [c]);
  const [pick, setPick] = useState(null);       // id, or 'timeout'
  const [open, setOpen] = useState(null);       // open clue index
  const [left, setLeft] = useState(ANSWER_S);
  const remaining = useRef(ANSWER_S * 1000);
  const expRef = useRef(null);
  const done = pick !== null;
  const timedOut = pick === 'timeout';
  const right = pick === c.id;
  const chapter = BIO_CHAPTERS.find(ch => ch.id === c.chapter);
  const [vsId, vsText] = q?.vs || [];

  useEffect(() => { hydSfx.card(); }, []);

  function choose(id) {
    if (done || paused) return;
    setPick(id);
    remaining.current = READ_S * 1000;
    setLeft(READ_S);
    onAnswer(c.id, id === c.id);
  }

  // One clock: 40 s to answer, then 30 s of explanation before moving on.
  // Frozen while paused, and while a clue pop-up is being read.
  const live = useRef({});
  live.current = { done, paused, open, choose, onNext };
  useEffect(() => {
    let last = performance.now();
    let shown = Math.ceil(remaining.current / 1000);
    const t = setInterval(() => {
      const now = performance.now();
      const dt = now - last; last = now;
      const L = live.current;
      if (L.paused || (L.done && L.open != null)) return;
      remaining.current = Math.max(0, remaining.current - dt);
      const s = Math.ceil(remaining.current / 1000);
      if (s !== shown) {
        shown = s;
        setLeft(remaining.current / 1000);
        if (!L.done && s <= 5 && s > 0) hydSfx.tick(s);
      } else {
        setLeft(remaining.current / 1000);
      }
      if (remaining.current <= 0) {
        if (!L.done) { hydSfx.timeUp(); L.choose('timeout'); shown = READ_S; }
        else { clearInterval(t); L.onNext(); }
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => expRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 450);
    return () => clearTimeout(t);
  }, [done]);

  // Keys: 1–4 or A–D answer; Enter / → moves on; P or Space pauses.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, .hq-clue, .hq-pop')) return;
      const k = e.key.toLowerCase();
      if (k === 'p' || k === ' ') { e.preventDefault(); setPaused(p => !p); return; }
      if (paused) return;
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
          <span className="hq-hud-count">Q <b>{index + 1}</b> / {total}{done ? <em> · reading</em> : null}</span>
          <span className="hq-bar"><i style={{ width: `${pct}%` }} /></span>
        </div>
        <Clock left={left} total={done ? READ_S : ANSWER_S} label={done ? 'Time to read' : 'Time to answer'} />
        <span className={`hq-streak${streak >= 2 ? ' is-hot' : ''}`} key={`s${streak}`} title="Streak">🔥 {streak}</span>
        <span className="hq-score" title="Correct">✓ {score}</span>
        <button type="button" className={`hq-pause${paused ? ' is-on' : ''}`} onClick={() => setPaused(p => !p)} aria-pressed={paused} title="Pause (P)">
          {paused ? '▶' : '❚❚'}
        </button>
        <MusicButton on={musicOn} onToggle={toggleMusic} />
      </div>

      <div className="hq-stage">
        <article className={`hq-card${done ? (right ? ' is-right' : ' is-wrong') : ''}`} key={c.id}>
          <div className="hq-card-tags">
            <span className="hq-tag" style={{ '--t': chapter?.tint }}>{chapter?.icon} {chapter?.name}</span>
          </div>
          <Stem text={q?.s || c.hint} notes={q?.w} live={done} open={open} setOpen={setOpen} />
          {done
            ? <p className="hq-clue-tip">💡 Tap a highlighted clue to see why it happens</p>
            : <p className="hq-ask">Most likely diagnosis?</p>}
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
                  disabled={done || paused}
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
              <span className="hq-verdict-icon" aria-hidden="true">{right ? '✓' : timedOut ? '⏱' : '✕'}</span>
              <div>
                <small>{right ? 'Correct' : timedOut ? 'Time’s up: the answer is' : 'Not quite: the answer is'}</small>
                <strong>{c.name}</strong>
              </div>
              <span className="hq-tag hq-tag--dim hq-verdict-inherit">{INHERIT_LABEL[c.inherit] || c.inherit}</span>
            </div>

            <p className="hq-x">{q?.x || c.learn.plain}</p>

            <div className="hq-hy">
              <span className="hq-hy-tag">★ Step 1 high-yield</span>
              <ul>
                {(q?.hy || c.learn.key.slice(0, 2)).map((h, i) => <li key={h} style={{ '--i': i }}>{h}</li>)}
              </ul>
            </div>

            {vsId && (
              <div className="hq-vs">
                <span className="hq-vs-tag">⚖ How it differs from {BIO_BY_ID[vsId]?.name}</span>
                <p>{vsText}</p>
              </div>
            )}
            {!right && !timedOut && pick !== vsId && c.lookalikes[pick] && (
              <div className="hq-vs hq-vs--picked">
                <span className="hq-vs-tag">Why not {BIO_BY_ID[pick]?.name}</span>
                <p>{c.lookalikes[pick]}</p>
              </div>
            )}

            <button type="button" className="hq-next" onClick={onNext}>
              <span>{index + 1 < total ? 'Next question →' : 'See results ★'}</span>
              <small className="hq-next-in">{open != null ? 'paused while reading' : `auto in ${Math.ceil(left)}s`}</small>
            </button>
          </section>
        )}

        {paused && (
          <div className="hq-paused">
            <div>
              <b>Paused</b>
              <button type="button" className="hq-start" onClick={() => setPaused(false)}>Resume ▶</button>
            </div>
          </div>
        )}
      </div>
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
        <button type="button" className="hq-ghost" onClick={onExit}>Back to Story Mode</button>
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
  const [paused, setPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(hydMusicPref);
  const music = useRef(null);
  if (!music.current) music.current = createHydMusic();

  useEffect(() => {
    if (phase === 'run' && musicOn && !paused) music.current.start();
    else music.current.stop();
  }, [phase, musicOn, paused]);
  useEffect(() => () => music.current.stop(), []);

  function toggleMusic() { const n = !musicOn; setMusicOn(n); setHydMusicPref(n); }

  function start(list) {
    setQueue(list); setIndex(0); setLog([]); setStreak(0); setBest(0); setPaused(false);
    setPhase('run');
    hydSfx.start();
    toTop();
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
    setPaused(false);
    if (index + 1 < queue.length) { setIndex(i => i + 1); hydSfx.next(); toTop(true); }
    else { setPhase('summary'); hydSfx.complete(); toTop(); }
  }

  function again() {
    const cfg = readSetup();
    const { pool } = poolFor(cfg);
    if (!pool.length) { setPhase('setup'); return; }
    start(shuffle(pool).slice(0, cfg.size === 0 ? pool.length : cfg.size));
  }

  const score = log.filter(r => r.right).length;

  return (
    <div className="hq-screen">
      <Backdrop flash={flash} />
      <div className="hq-wrap">
        {phase === 'setup' && (
          <Setup onStart={start} onExit={onExit} clinic={clinic} onClinic={onClinic} progress={progress} musicOn={musicOn} toggleMusic={toggleMusic} />
        )}
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
            onQuit={() => { setPaused(false); setPhase(log.length ? 'summary' : 'setup'); }}
            musicOn={musicOn}
            toggleMusic={toggleMusic}
            paused={paused}
            setPaused={setPaused}
          />
        )}
        {phase === 'summary' && <Summary log={log} bestStreak={best} onAgain={again} onSetup={() => setPhase('setup')} onExit={onExit} />}
      </div>
    </div>
  );
}
