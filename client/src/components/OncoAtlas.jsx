import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CLUES, CLUE_TYPES, KINDS, ORGANS, ORGAN_BY_ID, TUMORS, famOf } from '../onco/oncoData';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './OncoAtlas.css';

/**
 * Onco Atlas — breast and reproductive tumours, female and male.
 *
 *   ATLAS        a body map: tap an organ to see what to know first and every
 *                lesion that grows there, benign to malignant; tap one for its
 *                card (who, how it shows, what the slide shows, marker,
 *                associations, memory hook).
 *   TUMOR BOARD  a patient is presented; name the lesion from five. Order one
 *                more finding if stuck (fewer points). Ten cases a round.
 *   CLUE RUSH    75 seconds of single clues (slide, marker, association,
 *                presentation): pick the lesion from four, combos multiply.
 *
 * Content: onco/oncoData.js (check with tools/onco-check.mjs). Only Clue Rush
 * best scores are kept, in localStorage. Study time comes from <StudyTracked>.
 */

const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const RUSH_TIME = 75;
const BOARD_LEN = 10;
const BEST_KEY = 'mv_onco_rush_best';
const SCOPES = [
  ['all', 'Everything'],
  ['F', 'Women'],
  ['M', 'Men'],
  ['breast', 'Breast only'],
];
const sexOf = (t) => ORGAN_BY_ID[t.organ].sex;
const inScope = (t, scope) => scope === 'all' || (scope === 'breast' ? t.organ === 'breast' : sexOf(t) === scope || sexOf(t) === 'both');

/** Distractors: other families, same organ first, then same sex, then anything. */
function options(answer, n, scope) {
  const taken = new Set([famOf(answer)]);
  const pick = [];
  const tiers = [
    TUMORS.filter(t => t.organ === answer.organ),
    TUMORS.filter(t => sexOf(t) === sexOf(answer) && inScope(t, scope)),
    TUMORS,
  ];
  for (const tier of tiers) {
    for (const t of shuffle(tier)) {
      if (pick.length >= n - 1) break;
      if (taken.has(famOf(t))) continue;
      taken.add(famOf(t)); pick.push(t);
    }
  }
  return shuffle([answer, ...pick]);
}

function KindChip({ kind }) {
  const k = KINDS[kind];
  return <span className={`oa-kind is-${k.tone}`}>{k.label}</span>;
}

function TumorCard({ t, compact }) {
  const organ = ORGAN_BY_ID[t.organ];
  return (
    <article className="oa-card">
      <header className="oa-card-head">
        <span className="oa-card-ic" aria-hidden="true">{organ.icon}</span>
        <div>
          <h3>{t.name}</h3>
          <p className="oa-card-sub">{organ.name} · <KindChip kind={t.kind} /></p>
        </div>
      </header>
      <dl className="oa-facts">
        <div><dt>👤 Who</dt><dd>{t.who}</dd></div>
        <div><dt>🩺 How it shows</dt><dd>{t.presents}</dd></div>
        <div><dt>🔬 Path</dt><dd>{t.micro}</dd></div>
        {t.marker && <div><dt>🧪 Marker</dt><dd>{t.marker}</dd></div>}
        {!compact && <div><dt>🔗 Know too</dt><dd>{t.assoc}</dd></div>}
      </dl>
      <p className="oa-hook">💡 {t.hook}</p>
    </article>
  );
}

// ── The body map ────────────────────────────────────────────────────────────
function Spot({ id, sel, onPick, children, label }) {
  return (
    <g className={`oa-spot${sel === id ? ' is-sel' : ''}`} onClick={() => onPick(id)} role="button" tabIndex={0}
      aria-label={label} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(id); } }}>
      {children}
    </g>
  );
}

function FemaleMap({ sel, onPick }) {
  return (
    <svg viewBox="0 0 320 370" className="oa-map" role="group" aria-label="Female body map">
      <Spot id="breast" sel={sel} onPick={onPick} label="Breast">
        <circle cx="122" cy="52" r="30" /><circle cx="198" cy="52" r="30" />
        <circle cx="122" cy="56" r="4" className="oa-nip" /><circle cx="198" cy="56" r="4" className="oa-nip" />
      </Spot>
      <text x="160" y="104" className="oa-lab">Breast</text>
      <path d="M124 146 Q92 128 72 160" className="oa-tube" /><path d="M196 146 Q228 128 248 160" className="oa-tube" />
      <Spot id="ovary" sel={sel} onPick={onPick} label="Ovaries">
        <ellipse cx="66" cy="174" rx="20" ry="13" /><ellipse cx="254" cy="174" rx="20" ry="13" />
      </Spot>
      <text x="66" y="204" className="oa-lab">Ovary</text><text x="254" y="204" className="oa-lab">Ovary</text>
      <Spot id="uterus" sel={sel} onPick={onPick} label="Uterus">
        <path d="M118 140 Q160 108 202 140 L192 204 Q178 228 170 236 L150 236 Q142 228 128 204 Z" />
      </Spot>
      <Spot id="placenta" sel={sel} onPick={onPick} label="Pregnancy: gestational trophoblastic disease">
        <ellipse cx="160" cy="166" rx="20" ry="15" className="oa-placenta" />
        <text x="160" y="171" className="oa-emoji">🤰</text>
      </Spot>
      <text x="236" y="236" className="oa-lab oa-lab--l">Uterus</text>
      <path d="M200 222 L230 232" className="oa-lead" />
      <Spot id="cervix" sel={sel} onPick={onPick} label="Cervix">
        <rect x="148" y="236" width="24" height="20" rx="6" />
      </Spot>
      <text x="96" y="252" className="oa-lab oa-lab--r">Cervix</text><path d="M100 248 L146 246" className="oa-lead" />
      <Spot id="vagina" sel={sel} onPick={onPick} label="Vagina">
        <path d="M150 256 L170 256 L174 306 L146 306 Z" />
      </Spot>
      <text x="230" y="286" className="oa-lab oa-lab--l">Vagina</text><path d="M176 284 L226 284" className="oa-lead" />
      <Spot id="vulva" sel={sel} onPick={onPick} label="Vulva">
        <ellipse cx="160" cy="324" rx="34" ry="14" />
      </Spot>
      <text x="160" y="356" className="oa-lab">Vulva</text>
    </svg>
  );
}

function MaleMap({ sel, onPick }) {
  return (
    <svg viewBox="0 0 320 370" className="oa-map" role="group" aria-label="Male body map">
      <Spot id="breast" sel={sel} onPick={onPick} label="Breast">
        <ellipse cx="118" cy="52" rx="28" ry="18" /><ellipse cx="202" cy="52" rx="28" ry="18" />
        <circle cx="118" cy="54" r="3.5" className="oa-nip" /><circle cx="202" cy="54" r="3.5" className="oa-nip" />
      </Spot>
      <text x="160" y="94" className="oa-lab">Breast</text>
      <circle cx="160" cy="140" r="34" className="oa-inert" />
      <text x="160" y="144" className="oa-lab oa-lab--dim">bladder</text>
      <Spot id="prostate" sel={sel} onPick={onPick} label="Prostate">
        <ellipse cx="160" cy="190" rx="30" ry="18" />
      </Spot>
      <path d="M160 172 L160 300" className="oa-urethra" />
      <text x="232" y="194" className="oa-lab oa-lab--l">Prostate</text><path d="M192 190 L228 190" className="oa-lead" />
      <path d="M100 248 Q100 320 160 322 Q220 320 220 248 Q190 232 160 246 Q130 232 100 248 Z" className="oa-inert" />
      <Spot id="testis" sel={sel} onPick={onPick} label="Testes">
        <ellipse cx="128" cy="282" rx="19" ry="25" /><ellipse cx="192" cy="282" rx="19" ry="25" />
      </Spot>
      <text x="64" y="300" className="oa-lab oa-lab--r">Testis</text><path d="M70 296 L108 288" className="oa-lead" />
      <Spot id="penis" sel={sel} onPick={onPick} label="Penis">
        <rect x="147" y="208" width="26" height="92" rx="12" />
        <ellipse cx="160" cy="300" rx="16" ry="12" />
      </Spot>
      <text x="160" y="346" className="oa-lab">Penis</text>
    </svg>
  );
}

function Atlas() {
  const [sex, setSex] = useState('F');
  const [organ, setOrgan] = useState('breast');
  const [open, setOpen] = useState(null);
  const o = ORGAN_BY_ID[organ];
  const list = TUMORS.filter(t => t.organ === organ);
  const pickOrgan = (id) => { sfx.select(); setOrgan(id); setOpen(null); };
  const flip = (s) => {
    sfx.select(); setSex(s);
    const ok = ORGANS.find(x => x.id === organ && (x.sex === s || x.sex === 'both'));
    if (!ok) { setOrgan('breast'); setOpen(null); }
  };
  return (
    <div className="oa-atlas">
      <section className="oa-panel oa-map-panel">
        <div className="oa-seg" role="tablist" aria-label="Body">
          <button type="button" role="tab" aria-selected={sex === 'F'} className={sex === 'F' ? 'is-on' : ''} onClick={() => flip('F')}>♀ Female</button>
          <button type="button" role="tab" aria-selected={sex === 'M'} className={sex === 'M' ? 'is-on' : ''} onClick={() => flip('M')}>♂ Male</button>
        </div>
        {sex === 'F' ? <FemaleMap sel={organ} onPick={pickOrgan} /> : <MaleMap sel={organ} onPick={pickOrgan} />}
        <p className="oa-muted oa-center">Tap an organ.</p>
      </section>

      <section className="oa-panel oa-organ">
        <h2><span aria-hidden="true">{o.icon}</span> {o.name}</h2>
        <ul className="oa-intro">{o.intro.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <div className="oa-list">
          {list.map(t => (
            <button key={t.id} type="button" className={`oa-item${open === t.id ? ' is-open' : ''}`}
              onClick={() => { sfx.select(); setOpen(open === t.id ? null : t.id); }} aria-expanded={open === t.id}>
              <span className="oa-item-name">{t.name}</span>
              <KindChip kind={t.kind} />
            </button>
          ))}
        </div>
        {open && <TumorCard t={TUMORS.find(t => t.id === open)} />}
      </section>
    </div>
  );
}

// ── Tumor Board ─────────────────────────────────────────────────────────────
function makeBoard(scope) {
  const pool = shuffle(TUMORS.filter(t => inScope(t, scope))).slice(0, BOARD_LEN);
  return pool.map(t => ({ key: `${t.id}-${Math.random()}`, t, opts: options(t, 5, scope), more: shuffle(t.case.more || [])[0] || null }));
}

function TumorBoard() {
  const [scope, setScope] = useState('all');
  const [cases, setCases] = useState(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [asked, setAsked] = useState(false);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState([]);
  const start = (s = scope) => { sfx.select(); setCases(makeBoard(s)); setI(0); setPick(null); setAsked(false); setScore(0); setLog([]); };
  const c = cases?.[i];
  const answer = (t) => {
    if (pick) return;
    const right = t.id === c.t.id;
    setPick(t.id);
    if (right) { sfx.correct(); setScore(s => s + (asked ? 60 : 100)); } else sfx.wrong();
    setLog(l => [...l, { t: c.t, right }]);
  };
  const next = () => { sfx.next(); setI(n => n + 1); setPick(null); setAsked(false); };

  if (!cases) {
    return (
      <section className="oa-panel oa-intro-panel">
        <h2>🩻 Tumor Board</h2>
        <p className="oa-muted">A patient is presented to the board. Name the lesion. Stuck? Order one more finding, for 60 points instead of 100.</p>
        <div className="oa-seg">
          {SCOPES.map(([id, label]) => <button key={id} type="button" className={scope === id ? 'is-on' : ''} onClick={() => { sfx.select(); setScope(id); }}>{label}</button>)}
        </div>
        <button type="button" className="oa-btn oa-btn--go" onClick={() => start()}>Present the first case</button>
      </section>
    );
  }
  if (!c) {
    const right = log.filter(x => x.right).length;
    return (
      <section className="oa-panel oa-intro-panel">
        <h2>Board adjourned: {right}/{log.length}</h2>
        <p className="oa-score">{score} points</p>
        {log.some(x => !x.right) && <><h3 className="oa-h3">Review the ones you missed</h3><div className="oa-review">{log.filter(x => !x.right).map((x, k) => <TumorCard key={k} t={x.t} compact />)}</div></>}
        <button type="button" className="oa-btn oa-btn--go" onClick={() => start()}>Another round</button>
      </section>
    );
  }
  return (
    <section className="oa-board">
      <div className="oa-board-top"><span>Case {i + 1} of {cases.length}</span><span className="oa-score-sm">{score} pts</span></div>
      <div className="oa-panel oa-case">
        <p className="oa-case-text">{c.t.case.who} {c.t.case.sees}.</p>
        {(asked || pick) && c.more && <p className="oa-case-more">🧾 {c.more}</p>}
        {!asked && !pick && c.more && <button type="button" className="oa-btn oa-btn--ghost" onClick={() => { sfx.select(); setAsked(true); }}>🧾 Order one more finding (−40)</button>}
      </div>
      <div className="oa-opts">
        {c.opts.map(t => {
          const st = pick ? (t.id === c.t.id ? 'right' : t.id === pick ? 'wrong' : 'dim') : '';
          return (
            <button key={t.id} type="button" className={`oa-opt${st ? ` is-${st}` : ''}`} onClick={() => answer(t)} disabled={Boolean(pick)}>
              <span>{t.name}</span><small>{ORGAN_BY_ID[t.organ].name}</small>
            </button>
          );
        })}
      </div>
      {pick && (
        <>
          <p className={`oa-verdict ${pick === c.t.id ? 'ok' : 'bad'}`}>{pick === c.t.id ? 'Correct.' : `It was ${c.t.name}.`}</p>
          <TumorCard t={c.t} />
          <button type="button" className="oa-btn oa-btn--go" onClick={next}>{i + 1 < cases.length ? 'Next case →' : 'Finish'}</button>
        </>
      )}
    </section>
  );
}

// ── Clue Rush ───────────────────────────────────────────────────────────────
function makeClue(scope, lastKey) {
  const pool = CLUES.filter(c => inScope(c.tumor, scope) && c.key !== lastKey);
  const c = pool[Math.floor(Math.random() * pool.length)];
  return { ...c, opts: options(c.tumor, 4, scope), id: Math.random() };
}

function ClueRush() {
  const [scope, setScope] = useState('all');
  const [phase, setPhase] = useState('ready');
  const [q, setQ] = useState(null);
  const [left, setLeft] = useState(RUSH_TIME);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(null);
  const [missed, setMissed] = useState([]);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } });
  const lock = useRef(false);

  const start = () => {
    sfx.select(); setPhase('run'); setLeft(RUSH_TIME); setScore(0); setCombo(0); setMissed([]);
    setQ(makeClue(scope, null));
  };
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const id = setInterval(() => setLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => {
    if (phase === 'run' && left <= 0) {
      setPhase('done'); sfx.complete();
      setBest(b => { const nb = Math.max(b, score); try { localStorage.setItem(BEST_KEY, String(nb)); } catch { /* not remembered */ } return nb; });
    }
  }, [left, phase, score]);

  const answer = useCallback((t) => {
    if (lock.current || phase !== 'run') return;
    lock.current = true;
    const right = t.id === q.tumor.id;
    if (right) {
      const nc = combo + 1; setCombo(nc);
      setScore(s => s + 10 * (nc >= 6 ? 3 : nc >= 3 ? 2 : 1)); sfx.correct();
    } else {
      setCombo(0); sfx.wrong(); setMissed(m => (m.some(x => x.key === q.key) ? m : [...m, q]));
    }
    setFlash({ id: t.id, right });
    setTimeout(() => { setFlash(null); setQ(prev => makeClue(scope, prev?.key)); lock.current = false; }, right ? 350 : 900);
  }, [q, combo, phase, scope]);

  if (phase === 'ready') {
    return (
      <section className="oa-panel oa-intro-panel">
        <h2>⚡ Clue Rush</h2>
        <p className="oa-muted">{RUSH_TIME} seconds. One clue at a time: a slide, a marker, an association or a presentation. Three right in a row doubles your points; six triples them.</p>
        <div className="oa-seg">
          {SCOPES.map(([id, label]) => <button key={id} type="button" className={scope === id ? 'is-on' : ''} onClick={() => { sfx.select(); setScope(id); }}>{label}</button>)}
        </div>
        {best > 0 && <p className="oa-muted">Best: <b>{best}</b></p>}
        <button type="button" className="oa-btn oa-btn--go" onClick={start}>Go</button>
      </section>
    );
  }
  if (phase === 'done') {
    return (
      <section className="oa-panel oa-intro-panel">
        <h2>Time! {score} points</h2>
        <p className="oa-muted">Best: <b>{best}</b></p>
        {missed.length > 0 && (
          <div className="oa-missed">
            <h3 className="oa-h3">Clues you missed</h3>
            {missed.map(m => <p key={m.key}><span aria-hidden="true">{CLUE_TYPES[m.t].icon}</span> {m.x} → <b>{m.tumor.name}</b></p>)}
          </div>
        )}
        <button type="button" className="oa-btn oa-btn--go" onClick={start}>Again</button>
      </section>
    );
  }
  const ct = CLUE_TYPES[q.t];
  return (
    <section className="oa-rush">
      <div className="oa-board-top">
        <span className={`oa-timer${left <= 10 ? ' is-low' : ''}`}>⏱ {left}s</span>
        <span>{combo >= 3 && <b className="oa-combo">×{combo >= 6 ? 3 : 2} combo</b>} <span className="oa-score-sm">{score}</span></span>
      </div>
      <div className="oa-timebar"><i style={{ width: `${(left / RUSH_TIME) * 100}%` }} /></div>
      <div key={q.id} className="oa-panel oa-clue">
        <span className="oa-clue-type">{ct.icon} {ct.label}</span>
        <p>{q.x}</p>
      </div>
      <div className="oa-opts oa-opts--4">
        {q.opts.map(t => {
          const st = flash ? (t.id === q.tumor.id ? 'right' : t.id === flash.id ? 'wrong' : 'dim') : '';
          return (
            <button key={t.id} type="button" className={`oa-opt${st ? ` is-${st}` : ''}`} onClick={() => answer(t)}>
              <span>{t.name}</span><small>{ORGAN_BY_ID[t.organ].name}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const TABS = [['atlas', '🗺️ Atlas'], ['board', '🩻 Tumor Board'], ['rush', '⚡ Clue Rush']];

export default function OncoAtlas({ onExit }) {
  const [tab, setTab] = useState('atlas');
  const counts = useMemo(() => ({ n: TUMORS.length, m: TUMORS.filter(t => t.kind === 'malignant').length }), []);
  return (
    <div className="oa">
      <div className="oa-bg" aria-hidden="true"><i /><i /><i /></div>
      <header className="oa-top">
        <button type="button" className="oa-back" onClick={onExit}>← Minigames</button>
        <div className="oa-brand">
          <span className="oa-brand-ic" aria-hidden="true">🎗️</span>
          <div>
            <p className="oa-kicker">Reproductive · Minigame</p>
            <h1>Onco Atlas</h1>
          </div>
        </div>
        <SfxToggle />
      </header>
      <p className="oa-sub">Breast and reproductive tumours in women and men: {counts.n} lesions, {counts.m} of them malignant.</p>
      <nav className="oa-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''}
            onClick={() => { sfx.select(); setTab(id); }}>{label}</button>
        ))}
      </nav>
      <main className="oa-main">
        {tab === 'atlas' && <Atlas />}
        {tab === 'board' && <TumorBoard />}
        {tab === 'rush' && <ClueRush />}
      </main>
    </div>
  );
}
