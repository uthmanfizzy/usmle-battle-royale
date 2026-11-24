import { useEffect, useMemo, useRef, useState } from 'react';
import { CLUE_TYPES, EXTRA_FACTS, NUTRIENTS, NUTRIENT_BY_ID, PATIENTS } from '../nutrition/nutritionData';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './VitaminVault.css';

/**
 * Vitamin Vault — Step 1 nutrition as a night-shift pharmacy.
 *
 *   CLINIC     a patient walks in with 2–3 clues (deficiency, excess,
 *              function, or cause/diet); treat them by tapping the right
 *              bottle on the shelf. The bottle pours, the patient perks up,
 *              and the nutrient's card opens.
 *   RUSH       90 seconds of the same, no pauses — combos multiply.
 *   MATCH      six enzymes, six vitamins: wire every cofactor to its enzyme.
 *   VAULT      every bottle's card: role, sources, deficiency, excess,
 *              causes, cofactor jobs and the memory hook.
 *
 * Content: nutrition/nutritionData.js. Nothing is saved to the server.
 */

const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const RUSH_TIME = 90;
const CLINIC_LEN = 12;

function makeCase(types) {
  const pool = [];
  for (const n of NUTRIENTS) for (const t of types) if (n[t]?.length) pool.push([n, t]);
  const [n, t] = rand(pool);
  const k = t === 'cause' ? 1 : Math.min(n[t].length, t === 'def' ? 3 : 2);
  return { key: Math.random(), n, t, clues: shuffle(n[t]).slice(0, k), who: rand(PATIENTS) };
}

// ── A bottle ────────────────────────────────────────────────────────────────
function Bottle({ n, state = '', onClick, small, disabled }) {
  const fill = n.pem ? 0.55 : 0.72;
  return (
    <button type="button" className={`vv-bottle${state ? ` is-${state}` : ''}${small ? ' is-small' : ''}${n.pem ? ' is-sack' : ''}`}
      style={{ '--bc': n.color }} onClick={onClick} disabled={disabled} aria-label={`${n.label} — ${n.name}`}>
      <svg viewBox="0 0 60 90" aria-hidden="true">
        {n.pem ? (
          <>
            <path d="M14 22 Q30 14 46 22 L52 78 Q30 88 8 78 Z" className="vv-glass" />
            <path d="M18 22 Q30 30 42 22" className="vv-tie" />
            <rect x="24" y="10" width="12" height="10" rx="3" className="vv-cap" />
          </>
        ) : (
          <>
            <rect x="20" y="4" width="20" height="12" rx="3" className="vv-cap" />
            <path d="M22 16 h16 v8 q14 6 14 22 v32 q0 8 -8 8 h-28 q-8 0 -8 -8 v-32 q0 -16 14 -22 z" className="vv-glass" />
            <clipPath id={`clip-${n.id}`}><path d="M22 16 h16 v8 q14 6 14 22 v32 q0 8 -8 8 h-28 q-8 0 -8 -8 v-32 q0 -16 14 -22 z" /></clipPath>
            <g clipPath={`url(#clip-${n.id})`}>
              <path className="vv-liquid" d={`M-30 ${90 - fill * 70} q15 -6 30 0 t30 0 t30 0 t30 0 V100 H-30 Z`} />
            </g>
            <path d="M15 46 q2 -14 12 -18" className="vv-shine" />
          </>
        )}
      </svg>
      <span className="vv-label">{n.label}</span>
      {!small && <span className="vv-name">{n.name}</span>}
    </button>
  );
}

function NutrientCard({ n, compact }) {
  return (
    <div className="vv-card" style={{ '--bc': n.color }}>
      <div className="vv-card-head">
        <span className="vv-card-tag">{n.label}</span>
        <div>
          <h3>{n.name}</h3>
          <p className="vv-card-kind">{n.pem ? 'Protein-energy malnutrition' : n.mineral ? 'Mineral' : n.fat ? 'Fat-soluble vitamin' : 'Water-soluble vitamin'}</p>
        </div>
      </div>
      <p className="vv-card-role">{n.role}</p>
      {!compact && n.sources && <p className="vv-row"><b>Sources</b>{n.sources}</p>}
      {n.def.length > 0 && <div className="vv-row"><b>📉 Deficiency</b><ul>{n.def.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      {n.exc.length > 0 && <div className="vv-row"><b>📈 Excess</b><ul>{n.exc.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      {!compact && n.cause.length > 0 && <div className="vv-row"><b>🍽️ Causes of deficiency</b><ul>{n.cause.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      {!compact && n.cof.length > 0 && <div className="vv-row"><b>⚙️ Cofactor for</b><ul>{n.cof.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      <p className="vv-hook">💡 {n.note}</p>
    </div>
  );
}

function Shelf({ onPick, states = {}, disabled }) {
  return (
    <div className="vv-shelf">
      <div className="vv-shelf-row">
        {NUTRIENTS.map((n, i) => (
          <span key={n.id} className="vv-slot" style={{ animationDelay: `${i * 25}ms` }}>
            <Bottle n={n} state={states[n.id]} onClick={() => onPick(n.id)} disabled={disabled} />
          </span>
        ))}
      </div>
      <div className="vv-plank" />
    </div>
  );
}

function PatientCard({ c, mood }) {
  const T = CLUE_TYPES[c.t];
  return (
    <div className={`vv-patient is-${mood}`} key={c.key}>
      <div className="vv-pt-face">
        <span>{c.who}</span>
        {mood === 'happy' && <span className="vv-pt-fx">✨</span>}
        {mood === 'sick' && <span className="vv-pt-fx">💫</span>}
      </div>
      <div className="vv-pt-body">
        <span className="vv-pt-type">{T.icon} {T.label}</span>
        <p className="vv-pt-ask">{T.ask}</p>
        <div className="vv-clues">
          {c.clues.map((cl, i) => <span key={i} className="vv-clue" style={{ animationDelay: `${150 + i * 220}ms` }}>{cl}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── Clinic ──────────────────────────────────────────────────────────────────
function Clinic() {
  const [types, setTypes] = useState(['def', 'exc', 'fn', 'cause']);
  const [phase, setPhase] = useState('setup');
  const [cases, setCases] = useState([]);
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const c = cases[idx];

  const start = () => {
    const list = []; const seen = new Set();
    while (list.length < CLINIC_LEN) { const x = makeCase(types); const k = x.n.id + x.t; if (seen.has(k) && seen.size < 40) continue; seen.add(k); list.push(x); }
    setCases(list); setIdx(0); setPick(null); setScore(0); setPhase('play'); sfx.select();
  };

  const choose = (id) => {
    if (pick) return;
    setPick(id);
    if (id === c.n.id) { setScore(s => s + 1); sfx.correct(); } else sfx.wrong();
  };
  const next = () => {
    if (idx + 1 >= cases.length) { setPhase('done'); sfx.complete(); return; }
    setIdx(i => i + 1); setPick(null); sfx.next();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (phase === 'setup') {
    return (
      <div className="vv-panel vv-setup">
        <div className="vv-big">🩺</div>
        <h2>The Night Clinic</h2>
        <p>{CLINIC_LEN} patients. Each brings clues — tap the bottle that explains them. Choose which kinds of clue to see:</p>
        <div className="vv-chips">
          {Object.entries(CLUE_TYPES).map(([k, T]) => (
            <button key={k} type="button" className={`vv-chip${types.includes(k) ? ' is-on' : ''}`}
              onClick={() => { sfx.select(); setTypes(t => t.includes(k) ? (t.length > 1 ? t.filter(x => x !== k) : t) : [...t, k]); }}>
              {T.icon} {T.label}
            </button>
          ))}
        </div>
        <button type="button" className="vv-go" onClick={start}>Open the clinic →</button>
      </div>
    );
  }
  if (phase === 'done') {
    const n = score >= 11 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
    return (
      <div className="vv-panel vv-setup">
        <div className="vv-big">{n >= 2 ? '🏆' : '💊'}</div>
        <h2>{score} / {cases.length} patients treated</h2>
        <div className="vv-stars">{[0, 1, 2].map(i => <span key={i} className={i < n ? 'on' : ''} style={{ animationDelay: `${i * 150}ms` }}>★</span>)}</div>
        <button type="button" className="vv-go" onClick={start}>Next shift</button>
        <button type="button" className="vv-ghost" onClick={() => setPhase('setup')}>Change clue types</button>
      </div>
    );
  }

  const right = pick === c.n.id;
  const states = pick ? { [c.n.id]: 'right', ...(right ? {} : { [pick]: 'wrong' }) } : {};
  return (
    <div className="vv-clinic">
      <div className="vv-hud"><span>Patient {idx + 1}/{cases.length}</span><span className="vv-hud-score">✓ {score}</span></div>
      <div className="vv-clinic-top">
        <PatientCard c={c} mood={!pick ? 'wait' : right ? 'happy' : 'sick'} />
        {pick && (
          <div className="vv-result">
            <p className={`vv-verdict ${right ? 'ok' : 'bad'}`}>{right ? '✓ Right bottle!' : `✗ That was ${NUTRIENT_BY_ID[pick].label}. Answer: ${c.n.label} (${c.n.name})`}</p>
            <NutrientCard n={c.n} />
            <button type="button" className="vv-go" onClick={next}>{idx + 1 >= cases.length ? 'End shift' : 'Next patient →'}</button>
          </div>
        )}
      </div>
      <Shelf onPick={choose} states={states} disabled={!!pick} />
    </div>
  );
}

// ── Rush ────────────────────────────────────────────────────────────────────
function Rush() {
  const [phase, setPhase] = useState('ready');
  const [c, setC] = useState(() => makeCase(['def', 'fn', 'cause', 'exc']));
  const [time, setTime] = useState(RUSH_TIME);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(null);
  const [last, setLast] = useState(null);
  const [tally, setTally] = useState({ ok: 0, n: 0 });
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('mv_vv_rush_best')) || 0; } catch { return 0; } });
  const lock = useRef(false);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    if (time <= 0) {
      setPhase('over'); sfx.complete();
      setBest(b => { const nb = Math.max(b, score); try { localStorage.setItem('mv_vv_rush_best', String(nb)); } catch { /* */ } return nb; });
      return undefined;
    }
    const t = setTimeout(() => setTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, time, score]);

  const choose = (id) => {
    if (phase !== 'play' || lock.current) return;
    lock.current = true;
    const ok = id === c.n.id;
    setTally(t => ({ ok: t.ok + (ok ? 1 : 0), n: t.n + 1 }));
    if (ok) { const nc = combo + 1; setCombo(nc); setScore(s => s + 10 * (nc >= 6 ? 3 : nc >= 3 ? 2 : 1)); sfx.correct(); }
    else { setCombo(0); sfx.wrong(); }
    setFlash({ id, ok, ans: c.n.id });
    setLast({ ok, c, id });
    setTimeout(() => { setC(makeCase(['def', 'fn', 'cause', 'exc'])); setFlash(null); lock.current = false; }, ok ? 450 : 900);
  };

  const begin = () => { setPhase('play'); setTime(RUSH_TIME); setScore(0); setCombo(0); setTally({ ok: 0, n: 0 }); setLast(null); setC(makeCase(['def', 'fn', 'cause', 'exc'])); sfx.select(); };

  if (phase !== 'play') {
    return (
      <div className="vv-panel vv-setup">
        <div className="vv-big">{phase === 'over' ? '⏱️' : '⚡'}</div>
        <h2>{phase === 'over' ? `${score} points` : 'Pharmacy Rush'}</h2>
        <p>{phase === 'over' ? `${tally.ok}/${tally.n} correct · best ${best}` : `${RUSH_TIME} seconds. Clue in, bottle out — as many as you can. 3 in a row doubles, 6 triples.`}</p>
        <button type="button" className="vv-go" onClick={begin}>{phase === 'over' ? 'Again!' : 'Start the rush'}</button>
        {phase === 'ready' && best > 0 && <p className="vv-muted">Best: {best}</p>}
      </div>
    );
  }
  const states = flash ? { [flash.ans]: 'right', ...(flash.ok ? {} : { [flash.id]: 'wrong' }) } : {};
  return (
    <div className="vv-clinic">
      <div className="vv-rush-hud">
        <div className={`vv-timer${time <= 15 ? ' is-low' : ''}`}><div style={{ width: `${(time / RUSH_TIME) * 100}%` }} /><span>{time}s</span></div>
        <span className={`vv-combo${combo >= 3 ? ' hot' : ''}`}>🔥 {combo}{combo >= 3 && <i>×{combo >= 6 ? 3 : 2}</i>}</span>
        <span className="vv-hud-score" key={score}>{score}</span>
      </div>
      <PatientCard c={c} mood={!flash ? 'wait' : flash.ok ? 'happy' : 'sick'} />
      {last && <p className={`vv-last ${last.ok ? 'ok' : 'bad'}`}>{last.ok ? '✓' : '✗'} {last.c.n.label} — {last.c.n.name}: {last.c.n.note}</p>}
      <Shelf onPick={choose} states={states} disabled={!!flash} />
    </div>
  );
}

// ── Match ───────────────────────────────────────────────────────────────────
function Match() {
  const deal = () => {
    const vits = shuffle(NUTRIENTS.filter(n => n.cof.length)).slice(0, 6);
    return { left: shuffle(vits.map(n => ({ id: n.id, enzyme: rand(n.cof) }))), right: shuffle(vits.map(n => n.id)) };
  };
  const [board, setBoard] = useState(deal);
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState([]);
  const [bad, setBad] = useState(null);
  const [misses, setMisses] = useState(0);
  const [t0, setT0] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const finished = done.length === board.left.length;

  useEffect(() => { if (finished) return undefined; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [finished]);
  useEffect(() => { if (finished) sfx.complete(); }, [finished]);

  const pickRight = (id) => {
    if (!sel || done.includes(id)) return;
    if (sel === id) { setDone(d => [...d, id]); setSel(null); sfx.correct(); }
    else { setBad(id); setMisses(m => m + 1); sfx.wrong(); setTimeout(() => setBad(null), 450); }
  };
  const reset = () => { setBoard(deal()); setSel(null); setDone([]); setMisses(0); setT0(Date.now()); setNow(Date.now()); sfx.select(); };
  const secs = Math.round(((finished ? now : Date.now()) - t0) / 1000);

  return (
    <div className="vv-match">
      <div className="vv-hud"><span>⏱ {secs}s · ✗ {misses}</span><button type="button" className="vv-ghost" onClick={reset}>New board</button></div>
      <p className="vv-muted vv-center">Tap an enzyme, then the vitamin it needs as a cofactor.</p>
      <div className="vv-match-grid">
        <div className="vv-col">
          {board.left.map(l => (
            <button key={l.id} type="button" disabled={done.includes(l.id)}
              className={`vv-enz${sel === l.id ? ' is-sel' : ''}${done.includes(l.id) ? ' is-done' : ''}`}
              style={done.includes(l.id) ? { '--bc': NUTRIENT_BY_ID[l.id].color } : undefined}
              onClick={() => { sfx.select(); setSel(l.id); }}>
              ⚙️ {l.enzyme}{done.includes(l.id) && <b> → {NUTRIENT_BY_ID[l.id].label}</b>}
            </button>
          ))}
        </div>
        <div className="vv-col vv-col-b">
          {board.right.map(id => (
            <span key={id} className={`vv-mslot${done.includes(id) ? ' is-done' : ''}`}>
              <Bottle n={NUTRIENT_BY_ID[id]} small state={bad === id ? 'wrong' : done.includes(id) ? 'right' : ''} onClick={() => pickRight(id)} disabled={done.includes(id)} />
            </span>
          ))}
        </div>
      </div>
      {finished && (
        <div className="vv-panel vv-setup vv-match-done">
          <h2>All wired up in {secs}s!</h2>
          <p className="vv-muted">{misses === 0 ? 'Flawless.' : `${misses} miss${misses === 1 ? '' : 'es'}.`}</p>
          <button type="button" className="vv-go" onClick={reset}>Another board</button>
        </div>
      )}
    </div>
  );
}

// ── Vault ───────────────────────────────────────────────────────────────────
function Vault() {
  const [open, setOpen] = useState('B1');
  const n = NUTRIENT_BY_ID[open];
  return (
    <div className="vv-vault">
      <div className="vv-facts">
        {EXTRA_FACTS.map((f, i) => <div key={i} className="vv-fact" style={{ animationDelay: `${i * 70}ms` }}><b>{f.t}</b><p>{f.d}</p></div>)}
      </div>
      <div className="vv-vault-grid">
        <div>
          <div className="vv-shelf">
            <div className="vv-shelf-row">
              {NUTRIENTS.map(x => <span key={x.id} className="vv-slot"><Bottle n={x} state={open === x.id ? 'open' : ''} onClick={() => { sfx.select(); setOpen(x.id); }} /></span>)}
            </div>
            <div className="vv-plank" />
          </div>
        </div>
        <div key={open} className="vv-vault-card"><NutrientCard n={n} /></div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'clinic', label: 'Clinic', icon: '🩺' },
  { id: 'rush', label: 'Rush', icon: '⚡' },
  { id: 'match', label: 'Cofactor Match', icon: '🔗' },
  { id: 'vault', label: 'The Vault', icon: '📖' },
];

export default function VitaminVault({ onExit }) {
  const [tab, setTab] = useState('clinic');
  const bubbles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ l: (i * 61) % 100, d: -i * 1.3, s: 8 + (i % 5) * 5, t: 12 + (i % 4) * 4, c: NUTRIENTS[i % NUTRIENTS.length].color })), []);
  return (
    <div className="vv">
      <div className="vv-bg" aria-hidden="true">
        {bubbles.map((b, i) => <i key={i} style={{ left: `${b.l}%`, animationDelay: `${b.d}s`, width: b.s, height: b.s, animationDuration: `${b.t}s`, '--bc': b.c }} />)}
      </div>
      <header className="vv-top">
        {onExit && <button type="button" className="vv-back" onClick={onExit}>← Minigames</button>}
        <div className="vv-brand">
          <span className="vv-brand-ic" aria-hidden="true">💊</span>
          <div><p className="vv-kicker">Biochemistry · Nutrition</p><h1 className="vv-title">Vitamin Vault</h1></div>
        </div>
        <SfxToggle />
      </header>
      <nav className="vv-tabs">
        {TABS.map(t => (
          <button key={t.id} type="button" className={`vv-tab${tab === t.id ? ' is-on' : ''}`} onClick={() => { sfx.select(); setTab(t.id); }}>
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>
      <main className="vv-main" key={tab}>
        {tab === 'clinic' && <Clinic />}
        {tab === 'rush' && <Rush />}
        {tab === 'match' && <Match />}
        {tab === 'vault' && <Vault />}
      </main>
    </div>
  );
}
