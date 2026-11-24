import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHAPTERS, PRINCIPLES, SCENARIOS, SCENARIOS_BY_CH } from '../ethics/ethicsData';
import { sfx } from '../minigameSfx';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import SfxToggle from './SfxToggle';
import './AmbossEthics.css';

/**
 * Amboss Quest → HY Ethics: "The Ethics Ward".
 *
 *   WARD ROUNDS   ten rooms, one per topic. Knock on a door and each
 *                 character tells you their dilemma in a speech bubble; pick
 *                 what you would do. They react, and a rule card explains the
 *                 right move AND why every other move fails. Stars per room.
 *   RIGHT/WRONG   a 60-second swipe round: a situation and a response — is it
 *                 the ethical move? Built from the same scenarios (the right
 *                 option or one of the wrong ones), so it drills the rules.
 *   RULEBOOK      every rule, room by room, for a quick review.
 *
 * The scenarios are original (ethics/ethicsData.js). Progress is per device.
 */

const PROG_KEY = 'mv_ethics_progress';
const LETTERS = 'ABCD';
const SWIPE_TIME = 60;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const loadProg = () => { try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch { return {}; } };
const saveProg = (p) => { try { localStorage.setItem(PROG_KEY, JSON.stringify(p)); } catch { /* per device only */ } };
const starsFor = (pct) => (pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0);

function Stars({ n, big }) {
  return (
    <span className={`ae-stars${big ? ' is-big' : ''}`} aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map(i => <span key={i} className={i < n ? 'on' : ''} style={{ animationDelay: `${i * 160}ms` }}>★</span>)}
    </span>
  );
}

function Badge({ tag }) {
  const p = PRINCIPLES[tag] || PRINCIPLES.professionalism;
  return <span className="ae-badge" style={{ '--pc': p.hue }}>{p.icon} {p.label}</span>;
}

/** Types the speech out a few characters at a time. */
function useTypewriter(text, speed = 18) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return undefined;
    const id = setInterval(() => setN(x => { if (x >= text.length) { clearInterval(id); return x; } return x + 2; }), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return [text.slice(0, n), n >= text.length];
}

// ── Hub ─────────────────────────────────────────────────────────────────────
function Hub({ prog, onMode }) {
  const cleared = CHAPTERS.filter(c => (prog[c.id]?.stars || 0) > 0).length;
  const stars = CHAPTERS.reduce((n, c) => n + (prog[c.id]?.stars || 0), 0);
  return (
    <div className="ae-hub">
      <section className="ae-hero">
        <div className="ae-scales" aria-hidden="true">
          <span className="ae-scales-beam"><i className="l" /><i className="r" /></span>
          <span className="ae-scales-post" />
        </div>
        <div>
          <p className="ae-kicker">Amboss Quest · HY Ethics</p>
          <h1 className="ae-title">The Ethics Ward</h1>
          <p className="ae-sub">Every patient brings a dilemma. Choose what you’d say or do, see how they react, and leave each room with the rule that the exam asks about.</p>
          <div className="ae-hero-stats">
            <span><b>{cleared}</b>/{CHAPTERS.length} rooms cleared</span>
            <span><b>{stars}</b>/{CHAPTERS.length * 3} ★</span>
            <span><b>{SCENARIOS.length}</b> dilemmas</span>
          </div>
        </div>
      </section>

      <div className="ae-modes">
        <button type="button" className="ae-mode ae-mode--rounds" onClick={() => onMode('ward')}>
          <span className="ae-mode-ic">🚪</span>
          <span className="ae-mode-name">Ward Rounds</span>
          <span className="ae-mode-sub">Ten rooms, one topic each. Talk to every patient and earn your stars.</span>
        </button>
        <button type="button" className="ae-mode ae-mode--swipe" onClick={() => onMode('swipe')}>
          <span className="ae-mode-ic">⚡</span>
          <span className="ae-mode-name">Right or Wrong?</span>
          <span className="ae-mode-sub">60 seconds. Is that the ethical move? Swipe or tap — fast.</span>
        </button>
        <button type="button" className="ae-mode ae-mode--book" onClick={() => onMode('book')}>
          <span className="ae-mode-ic">📖</span>
          <span className="ae-mode-name">Rulebook</span>
          <span className="ae-mode-sub">Every rule on one page for a last look before the exam.</span>
        </button>
      </div>
    </div>
  );
}

// ── Ward map ────────────────────────────────────────────────────────────────
function Ward({ prog, onRoom, onAll }) {
  return (
    <div className="ae-ward">
      <div className="ae-section-head">
        <h2>Ward Rounds</h2>
        <button type="button" className="ae-ghost" onClick={onAll}>🎲 Mixed round (10 random)</button>
      </div>
      <div className="ae-doors">
        {CHAPTERS.map((c, i) => {
          const p = prog[c.id];
          const n = SCENARIOS_BY_CH[c.id].length;
          return (
            <button key={c.id} type="button" className={`ae-door${p?.stars ? ' is-done' : ''}`} onClick={() => onRoom(c.id)}
              style={{ animationDelay: `${i * 50}ms` }}>
              <span className="ae-door-frame">
                <span className="ae-door-leaf"><span className="ae-door-knob" /><span className="ae-door-num">{String(101 + i)}</span></span>
                <span className="ae-door-inside">{c.icon}</span>
              </span>
              <span className="ae-door-name">{c.name}</span>
              <span className="ae-door-blurb">{c.blurb}</span>
              <span className="ae-door-foot"><Stars n={p?.stars || 0} /><span>{n} patients</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Encounter ───────────────────────────────────────────────────────────────
function Encounter({ sc, idx, total, onDone, trust }) {
  const opts = useMemo(() => shuffle(sc.opts.map((o, i) => ({ ...o, ok: i === 0 }))), [sc]);
  const [pick, setPick] = useState(null);
  const [said, typed] = useTypewriter(sc.says);
  const ok = pick !== null && opts[pick].ok;

  const choose = useCallback((i) => {
    if (pick !== null) return;
    setPick(i);
    if (opts[i].ok) sfx.correct(); else sfx.wrong();
  }, [pick, opts]);

  useEffect(() => {
    function key(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (pick === null) { const i = LETTERS.indexOf(e.key.toUpperCase()); if (i >= 0 && i < opts.length) choose(i); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDone(ok); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [pick, opts, choose, onDone, ok]);

  useEffect(() => {
    if (pick === null || window.innerWidth >= 900) return undefined;
    const t = setTimeout(() => document.querySelector('.ae-rule')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    return () => clearTimeout(t);
  }, [pick]);

  return (
    <div className="ae-enc" key={sc.id}>
      <div className="ae-enc-top">
        <span className="ae-step">Patient {idx + 1} / {total}</span>
        <div className="ae-dots">{Array.from({ length: total }, (_, i) => <i key={i} className={i < idx ? 'past' : i === idx ? 'now' : ''} />)}</div>
        <span className="ae-trust" key={trust + (ok ? 10 : 0)}>💚 {trust + (ok ? 10 : 0)}</span>
      </div>

      <div className="ae-scene">
        <div className={`ae-char${pick !== null ? (ok ? ' is-happy' : ' is-sad') : ''}`}>
          <span className="ae-char-face">{sc.who}</span>
          {pick !== null && <span className="ae-react">{ok ? '😊' : '😟'}</span>}
          {pick !== null && ok && <span className="ae-hearts" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ '--d': `${i * 90}ms`, '--x': `${(i - 2) * 18}px` }}>💚</i>)}</span>}
          <span className="ae-char-name">{sc.name}</span>
        </div>
        <div className="ae-bubble">
          <p className="ae-says">“{said}{!typed && <span className="ae-caret">▍</span>}”</p>
          {sc.ctx && <p className="ae-ctx">{sc.ctx}</p>}
        </div>
      </div>

      <div className="ae-grid">
        <div className="ae-opts">
          <p className="ae-ask">What do you do?</p>
          {opts.map((o, i) => {
            const st = pick === null ? '' : o.ok ? ' is-right' : i === pick ? ' is-wrong' : ' is-dim';
            return (
              <button key={i} type="button" className={`ae-opt${st}`} disabled={pick !== null} onClick={() => choose(i)}
                style={{ animationDelay: `${300 + i * 70}ms` }}>
                <span className="ae-opt-l">{LETTERS[i]}</span>
                <span className="ae-opt-t">{o.t}
                  {pick !== null && !o.ok && <em className="ae-opt-why">✗ {o.why}</em>}
                </span>
              </button>
            );
          })}
        </div>
        {pick !== null && (
          <aside className={`ae-rule ${ok ? 'ok' : 'bad'}`}>
            <div className="ae-rule-head">
              <span className="ae-verdict">{ok ? '✓ Good call' : '✗ Not the best move'}</span>
              <Badge tag={sc.tag} />
            </div>
            <p className="ae-rule-label">The best move</p>
            <p className="ae-rule-best">{sc.best}</p>
            <p className="ae-rule-label">The rule</p>
            <p className="ae-rule-text">{sc.rule}</p>
            {sc.hy?.length > 0 && <ul className="ae-rule-hy">{sc.hy.map((h, i) => <li key={i}>{h}</li>)}</ul>}
            <button type="button" className="ae-go" onClick={() => onDone(ok)}>{idx + 1 >= total ? 'Finish the room →' : 'Next patient →'}</button>
          </aside>
        )}
      </div>
    </div>
  );
}

function RoomDone({ title, results, onBack, onAgain }) {
  const right = results.filter(r => r.ok).length;
  const pct = results.length ? right / results.length : 0;
  const n = starsFor(pct);
  return (
    <div className="ae-done">
      <div className="ae-done-card">
        <div className="ae-done-ic">{n >= 3 ? '🏆' : n >= 2 ? '🎉' : n >= 1 ? '👍' : '📚'}</div>
        <p className="ae-kicker">{title}</p>
        <h2>{right} / {results.length} handled well</h2>
        <Stars n={n} big />
        <div className="ae-done-actions">
          <button type="button" className="ae-go" onClick={onAgain}>Replay room</button>
          <button type="button" className="ae-ghost" onClick={onBack}>Back to the ward</button>
        </div>
      </div>
      <div className="ae-learned">
        <h3>Rules from this room</h3>
        {results.map(({ sc, ok }) => (
          <div key={sc.id} className={`ae-learned-row ${ok ? 'ok' : 'bad'}`}>
            <span>{ok ? '✓' : '✗'}</span>
            <span className="ae-learned-who">{sc.who}</span>
            <span>{sc.rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Right or Wrong? ─────────────────────────────────────────────────────────
function makeCard() {
  const sc = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  const good = Math.random() < 0.5;
  const wrongs = sc.opts.slice(1);
  const o = good ? sc.opts[0] : wrongs[Math.floor(Math.random() * wrongs.length)];
  return { key: `${sc.id}-${Math.random()}`, sc, text: o.t, good, why: good ? sc.rule : o.why };
}

function Swipe({ onExit }) {
  const [phase, setPhase] = useState('ready');
  const [card, setCard] = useState(makeCard);
  const [time, setTime] = useState(SWIPE_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('mv_ethics_swipe_best')) || 0; } catch { return 0; } });
  const [log, setLog] = useState([]);
  const [fly, setFly] = useState(null);
  const [drag, setDrag] = useState(0);
  const start0 = useRef(null);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    if (time <= 0) {
      setPhase('over'); sfx.complete();
      setBest(b => { const nb = Math.max(b, score); try { localStorage.setItem('mv_ethics_swipe_best', String(nb)); } catch { /* */ } return nb; });
      return undefined;
    }
    const t = setTimeout(() => setTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, time, score]);

  const answer = useCallback((saysGood) => {
    if (phase !== 'play' || fly) return;
    const right = saysGood === card.good;
    setLog(l => [{ ...card, right }, ...l].slice(0, 40));
    if (right) { const s = streak + 1; setStreak(s); setScore(x => x + 10 * (s >= 5 ? 3 : s >= 3 ? 2 : 1)); sfx.correct(); }
    else { setStreak(0); sfx.wrong(); }
    setFly({ dir: saysGood ? 'r' : 'l', right });
    setTimeout(() => { setCard(makeCard()); setFly(null); setDrag(0); }, 380);
  }, [phase, fly, card, streak]);

  useEffect(() => {
    function key(e) {
      if (phase !== 'play') return;
      if (e.key === 'ArrowRight') answer(true);
      if (e.key === 'ArrowLeft') answer(false);
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase, answer]);

  const begin = () => { setPhase('play'); setTime(SWIPE_TIME); setScore(0); setStreak(0); setLog([]); setCard(makeCard()); sfx.sparkle?.(); };

  const onDown = (e) => { if (phase === 'play') start0.current = e.clientX; };
  const onMove = (e) => { if (start0.current !== null) setDrag(e.clientX - start0.current); };
  const onUp = () => {
    if (start0.current === null) return;
    start0.current = null;
    if (drag > 90) answer(true); else if (drag < -90) answer(false); else setDrag(0);
  };

  if (phase === 'ready') {
    return (
      <div className="ae-swipe-intro">
        <div className="ae-big-ic">⚡</div>
        <h2>Right or Wrong?</h2>
        <p>A situation and a response appear. Is it the <b>ethical move</b>? Swipe right (or →) for yes, left (or ←) for no. Three in a row doubles your points, five triples them.</p>
        <button type="button" className="ae-go" onClick={begin}>Start the clock</button>
        {best > 0 && <p className="ae-muted">Best: {best}</p>}
      </div>
    );
  }

  if (phase === 'over') {
    const right = log.filter(l => l.right).length;
    return (
      <div className="ae-done">
        <div className="ae-done-card">
          <div className="ae-done-ic">⏱️</div>
          <p className="ae-kicker">Time!</p>
          <h2>{score} points</h2>
          <p className="ae-muted">{right}/{log.length} correct · best {best}</p>
          <div className="ae-done-actions">
            <button type="button" className="ae-go" onClick={begin}>Go again</button>
            <button type="button" className="ae-ghost" onClick={onExit}>Back</button>
          </div>
        </div>
        <div className="ae-learned">
          <h3>Your calls</h3>
          {log.map(l => (
            <div key={l.key} className={`ae-learned-row ${l.right ? 'ok' : 'bad'}`}>
              <span>{l.right ? '✓' : '✗'}</span>
              <span className="ae-learned-who">{l.sc.who}</span>
              <span><b>{l.good ? 'Ethical' : 'Not ethical'}:</b> {l.text} <em className="ae-muted">— {l.why}</em></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tilt = fly ? 0 : drag / 14;
  return (
    <div className="ae-swipe">
      <div className="ae-swipe-hud">
        <div className={`ae-timer${time <= 10 ? ' is-low' : ''}`}><div style={{ width: `${(time / SWIPE_TIME) * 100}%` }} /><span>{time}s</span></div>
        <span className={`ae-streak${streak >= 3 ? ' hot' : ''}`}>🔥 {streak}{streak >= 3 && <i>×{streak >= 5 ? 3 : 2}</i>}</span>
        <span className="ae-score" key={score}>{score}</span>
      </div>
      <div className="ae-deck">
        <div className="ae-card-under" />
        <div className={`ae-card${fly ? ` fly-${fly.dir}` : ''}`}
          style={fly ? undefined : { transform: `translateX(${drag}px) rotate(${tilt}deg)` }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} key={card.key}>
          <span className={`ae-stamp yes${drag > 40 ? ' on' : ''}`}>ETHICAL</span>
          <span className={`ae-stamp no${drag < -40 ? ' on' : ''}`}>NOPE</span>
          <div className="ae-card-who"><span>{card.sc.who}</span>{card.sc.name}</div>
          <p className="ae-card-says">“{card.sc.says}”</p>
          <p className="ae-card-label">You respond:</p>
          <p className="ae-card-resp">{card.text}</p>
        </div>
        {fly && <div className={`ae-flash ${fly.right ? 'ok' : 'bad'}`}>{fly.right ? '✓' : '✗'}</div>}
      </div>
      <div className="ae-swipe-btns">
        <button type="button" className="ae-no" onClick={() => answer(false)}>✗ Not ethical</button>
        <button type="button" className="ae-yes" onClick={() => answer(true)}>✓ Ethical</button>
      </div>
      {log[0] && (
        <p className={`ae-last ${log[0].right ? 'ok' : 'bad'}`} key={log[0].key}>
          {log[0].right ? '✓' : '✗'} {log[0].good ? 'That was ethical' : 'That was not ethical'} — {log[0].why}
        </p>
      )}
    </div>
  );
}

// ── Rulebook ────────────────────────────────────────────────────────────────
function Rulebook() {
  const [open, setOpen] = useState(CHAPTERS[0].id);
  return (
    <div className="ae-book">
      <h2>Rulebook</h2>
      {CHAPTERS.map(c => (
        <div key={c.id} className={`ae-book-ch${open === c.id ? ' is-open' : ''}`}>
          <button type="button" className="ae-book-head" onClick={() => { sfx.select(); setOpen(open === c.id ? null : c.id); }}>
            <span>{c.icon}</span><span className="ae-book-name">{c.name}</span><span className="ae-book-n">{SCENARIOS_BY_CH[c.id].length}</span><span>{open === c.id ? '−' : '+'}</span>
          </button>
          {open === c.id && (
            <div className="ae-book-body">
              {SCENARIOS_BY_CH[c.id].map(sc => (
                <div key={sc.id} className="ae-book-rule">
                  <span className="ae-book-who">{sc.who}</span>
                  <div>
                    <p className="ae-book-sit"><b>{sc.name}:</b> “{sc.says}”</p>
                    <p className="ae-book-do">→ {sc.best}</p>
                    <p className="ae-book-r">{sc.rule}</p>
                    {sc.hy?.map((h, i) => <p key={i} className="ae-book-hy">• {h}</p>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function AmbossEthics() {
  const [view, setView] = useState('hub'); // hub | ward | room | done | swipe | book
  const [prog, setProg] = useState(loadProg);
  const [room, setRoom] = useState(null); // { id, title, list }
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const study = useStudySession({ mode: 'amboss_hy_ethics', active: view === 'room' || view === 'swipe', subject: 'ethics' });
  useStudyActivity(view === 'room' || view === 'swipe' ? 'Amboss HY Ethics' : null, null, 'amboss_hy_ethics');

  const trust = results.filter(r => r.ok).length * 10;

  const openRoom = (id) => {
    const c = CHAPTERS.find(x => x.id === id);
    setRoom({ id, title: `Room ${101 + CHAPTERS.indexOf(c)} · ${c.name}`, list: shuffle(SCENARIOS_BY_CH[id]) });
    setIdx(0); setResults([]); setView('room'); sfx.select(); study.touch();
    window.scrollTo(0, 0);
  };
  const openMixed = () => {
    setRoom({ id: null, title: 'Mixed round', list: shuffle(SCENARIOS).slice(0, 10) });
    setIdx(0); setResults([]); setView('room'); sfx.select(); study.touch();
    window.scrollTo(0, 0);
  };

  const done = useCallback((ok) => {
    study.count(ok); study.touch();
    const sc = room.list[idx];
    const next = [...results, { sc, ok }];
    setResults(next);
    if (idx + 1 >= room.list.length) {
      if (room.id) {
        const pct = next.filter(r => r.ok).length / next.length;
        const s = starsFor(pct);
        setProg(p => { const np = { ...p, [room.id]: { stars: Math.max(p[room.id]?.stars || 0, s) } }; saveProg(np); return np; });
      }
      study.flush();
      sfx.complete();
      setView('done');
    } else {
      sfx.next();
      setIdx(i => i + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [room, idx, results, study]);

  const back = () => {
    if (view === 'room' || view === 'done') setView('ward');
    else if (view === 'hub') window.location.href = '/amboss-quest';
    else setView('hub');
    if (view === 'swipe') study.flush();
  };

  return (
    <div className="ae">
      <div className="ae-bg" aria-hidden="true">
        <span className="ae-orb ae-orb--1" /><span className="ae-orb ae-orb--2" /><span className="ae-orb ae-orb--3" />
        <div className="ae-floor" />
      </div>
      <header className="ae-top">
        <button type="button" className="ae-back" onClick={back}>← {view === 'hub' ? 'Amboss Quest' : view === 'room' || view === 'done' ? 'Ward' : 'Ethics Ward'}</button>
        <span className="ae-brand">⚖️ <b>HY Ethics</b></span>
        <SfxToggle />
      </header>
      <main className="ae-main" key={view}>
        {view === 'hub' && <Hub prog={prog} onMode={(m) => { sfx.select(); setView(m); }} />}
        {view === 'ward' && <Ward prog={prog} onRoom={openRoom} onAll={openMixed} />}
        {view === 'room' && room && <Encounter key={room.list[idx].id + idx} sc={room.list[idx]} idx={idx} total={room.list.length} onDone={done} trust={trust} />}
        {view === 'done' && room && <RoomDone title={room.title} results={results} onBack={() => setView('ward')} onAgain={() => (room.id ? openRoom(room.id) : openMixed())} />}
        {view === 'swipe' && <Swipe onExit={() => setView('hub')} />}
        {view === 'book' && <Rulebook />}
      </main>
    </div>
  );
}
