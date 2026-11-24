import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CascadeMap from '../clot/CascadeMap';
import {
  BUILD_DECOYS, BUILD_STEPS, CASES, DRUGS, DX, NODES, NODE_BY_ID, OVERLAYS, PEARLS,
} from '../clot/clotData';
import { clotSfx } from '../clot/clotSfx';
import SfxToggle from './SfxToggle';
import './ClotCascade.css';

/**
 * Clot Cascade — the coagulation pathway for Step 1, as a game.
 *
 *   LEARN          the whole map (intrinsic, extrinsic, common, kinins,
 *                  fibrinolysis, protein C/S, antithrombin); tap any node for
 *                  its high-yield facts; overlays for PT, PTT, vitamin K and
 *                  "neither test"; a button that fires the cascade end to end.
 *   BUILD          a vessel is torn and the patient is bleeding — fill each
 *                  empty slot in order before blood loss hits 100%.
 *   DRUG STRIKE    a drug card drops; tap the node(s) it acts on and strike.
 *   LAB DETECTIVE  a vignette and PT / PTT / platelets / bleeding time; name
 *                  the disorder before the clock runs out (3 lives).
 *   PEARLS         flip cards of the facts that get asked.
 *
 * Nothing is saved to the server — like the other minigames, it is practice.
 */

const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const COAG_IDS = ['CONTACT', 'XII', 'XI', 'IX', 'VIII', 'TF', 'VII', 'X', 'V', 'II', 'I', 'XIII', 'CLOT'];
const ALL_IDS = NODES.map(n => n.id);

const TABS = [
  { id: 'learn', label: 'Learn', icon: '🗺️' },
  { id: 'build', label: 'Build the Cascade', icon: '🩸' },
  { id: 'drugs', label: 'Drug Strike', icon: '💉' },
  { id: 'labs', label: 'Lab Detective', icon: '🔬' },
  { id: 'pearls', label: 'Pearls', icon: '💎' },
];

// ── Little shared pieces ─────────────────────────────────────────────────────
function Stars({ n }) {
  return <div className="cc-stars" aria-label={`${n} of 3 stars`}>{[0, 1, 2].map(i => <span key={i} className={i < n ? 'is-on' : ''} style={{ animationDelay: `${i * 180}ms` }}>★</span>)}</div>;
}

function Burst({ k, good }) {
  // A one-shot spray of platelets (good) or blood drops (bad), keyed to re-run.
  const bits = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    a: (i / 14) * 360 + Math.random() * 20, d: 40 + Math.random() * 50, s: 0.6 + Math.random() * 0.7,
  })), [k]);
  return (
    <div className={`cc-burst ${good ? 'is-good' : 'is-bad'}`} key={k} aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ '--a': `${b.a}deg`, '--d': `${b.d}px`, '--s': b.s }} />)}
    </div>
  );
}

function Pearl({ text }) {
  if (!text) return null;
  return <div className="cc-pearl" key={text}><span className="cc-pearl-ic">💎</span><span>{text}</span></div>;
}

// ── LEARN ────────────────────────────────────────────────────────────────────
function Learn() {
  const [overlay, setOverlay] = useState('none');
  const [focus, setFocus] = useState('II');
  const [lit, setLit] = useState(() => new Set(COAG_IDS));
  const [sealed, setSealed] = useState(true);
  const timers = useRef([]);
  const ov = OVERLAYS.find(o => o.id === overlay);
  const node = NODE_BY_ID[focus];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const fire = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOverlay('none');
    setSealed(false);
    const order = [['CONTACT', 'TF'], ['XII', 'VII'], ['XI'], ['IX', 'VIII'], ['X'], ['V'], ['II'], ['I', 'XIII'], ['CLOT']];
    setLit(new Set());
    order.forEach((ids, i) => {
      timers.current.push(setTimeout(() => {
        setLit(prev => new Set([...prev, ...ids]));
        if (ids.includes('II')) clotSfx.thrombin();
        else if (ids.includes('CLOT')) { clotSfx.fibrin(); setSealed(true); }
        else clotSfx.activate(i);
      }, 350 + i * 480));
    });
  };

  return (
    <div className="cc-learn">
      <div className="cc-mapcard">
        <div className="cc-chips">
          {OVERLAYS.map(o => (
            <button key={o.id} type="button" className={`cc-chip${overlay === o.id ? ' is-on' : ''}`}
                    onClick={() => { setOverlay(o.id); clotSfx.pick(); }}>{o.label}</button>
          ))}
          <button type="button" className="cc-chip cc-chip-fire" onClick={fire}>⚡ Fire the cascade</button>
        </div>
        <CascadeMap lit={lit} overlay={ov?.test || null} focus={focus} sealed={sealed}
                    onNode={(id) => { setFocus(id); clotSfx.pick(); }} />
        {ov?.note && <p className="cc-ovnote" key={ov.id}>{ov.note}</p>}
        <div className="cc-legend">
          <span><i className="lg-act" /> activates</span>
          <span><i className="lg-cof" /> cofactor</span>
          <span><i className="lg-fb" /> thrombin feedback</span>
          <span><i className="lg-inh" /> inhibits</span>
          <span><i className="lg-vitk" /> vitamin K-dependent</span>
        </div>
      </div>
      <aside className="cc-info" key={focus}>
        <p className="cc-info-kicker">{node.path === 'reg' ? 'Natural anticoagulant' : node.path === 'lysis' ? 'Fibrinolysis' : node.path === 'kinin' ? 'Kinin cascade' : `${node.path} pathway`}</p>
        <h3 className="cc-info-title">{node.kind === 'factor' || node.kind === 'cofactor' ? `Factor ${node.label}` : node.label}</h3>
        <p className="cc-info-sub">{node.sub}</p>
        <div className="cc-badges">
          {node.pt && <span className="b-pt">PT</span>}
          {node.ptt && <span className="b-ptt">PTT</span>}
          {node.vitK && <span className="b-vitk">Vit K</span>}
          {node.kind === 'cofactor' && <span className="b-cof">Cofactor</span>}
        </div>
        <ul className="cc-facts">
          {node.facts.map((f, i) => <li key={i} style={{ animationDelay: `${i * 90}ms` }}>{f}</li>)}
        </ul>
        <p className="cc-info-hint">Tap any node on the map.</p>
      </aside>
    </div>
  );
}

// ── BUILD ────────────────────────────────────────────────────────────────────
function Build() {
  const [phase, setPhase] = useState('intro'); // intro | play | won | lost
  const [step, setStep] = useState(0);
  const [bleed, setBleed] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [shake, setShake] = useState(null);
  const [badTile, setBadTile] = useState(null);
  const [pearl, setPearl] = useState('');
  const [burst, setBurst] = useState(null);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('mv_clot_build_best')) || 0; } catch { return 0; } });
  const stepStart = useRef(Date.now());
  const bleedRef = useRef(0);
  bleedRef.current = bleed;

  const start = () => {
    setTiles(shuffle([
      ...BUILD_STEPS.map(s => ({ id: s.node, label: NODE_BY_ID[s.node].label })),
      ...BUILD_DECOYS,
    ]));
    setStep(0); setBleed(0); setScore(0); setMisses(0); setPearl(''); setPhase('play');
    stepStart.current = Date.now();
    clotSfx.drip();
  };

  // The patient bleeds while you think.
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const t = setInterval(() => setBleed(b => Math.min(100, b + 0.32)), 250);
    return () => clearInterval(t);
  }, [phase]);

  // The heartbeat speeds up as blood is lost.
  useEffect(() => {
    if (phase !== 'play') return undefined;
    let id;
    const beat = () => {
      const b = bleedRef.current;
      clotSfx.beat(b / 100);
      id = setTimeout(beat, Math.max(380, 1100 - b * 7));
    };
    id = setTimeout(beat, 600);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && bleed >= 100) { setPhase('lost'); clotSfx.flatline(); }
  }, [bleed, phase]);

  const litIds = useMemo(() => {
    const s = new Set(['CONTACT', 'TF']);
    BUILD_STEPS.slice(0, step).forEach(st => s.add(st.node));
    if (phase === 'won') s.add('CLOT');
    return s;
  }, [step, phase]);
  const hidden = useMemo(() => new Set(BUILD_STEPS.slice(step).map(s => s.node)), [step]);
  const cur = BUILD_STEPS[step];

  const choose = (tile) => {
    if (phase !== 'play' || !cur) return;
    if (tile.id === cur.node) {
      const secs = (Date.now() - stepStart.current) / 1000;
      const gain = 100 + Math.max(0, Math.round((8 - secs) * 15));
      setScore(s => s + gain);
      setTiles(ts => ts.filter(t => t.id !== tile.id));
      setPearl(NODE_BY_ID[cur.node].facts[0]);
      setBurst({ k: Date.now(), good: true });
      setBleed(b => Math.max(0, b - 3));
      stepStart.current = Date.now();
      if (cur.node === 'II') clotSfx.thrombin();
      else if (cur.node === 'I') clotSfx.fibrin();
      else clotSfx.activate(step);
      const next = step + 1;
      setStep(next);
      if (next >= BUILD_STEPS.length) {
        setTimeout(() => {
          setPhase('won');
          clotSfx.fibrin();
          setTimeout(() => clotSfx.sealed(), 450);
          setScore(s => {
            const total = s + Math.round((100 - bleedRef.current) * 5);
            setBest(bst => { const nb = Math.max(bst, total); try { localStorage.setItem('mv_clot_build_best', String(nb)); } catch { /* */ } return nb; });
            return total;
          });
        }, 350);
      }
    } else {
      setMisses(m => m + 1);
      setBleed(b => Math.min(100, b + 10));
      setShake(cur.node); setBadTile(tile.id);
      setBurst({ k: Date.now(), good: false });
      clotSfx.drip();
      setTimeout(() => { setShake(null); setBadTile(null); }, 450);
    }
  };

  const stars = bleed < 35 && misses <= 1 ? 3 : bleed < 65 ? 2 : 1;
  const sbp = Math.round(120 - bleed * 0.6);
  const hr = Math.round(76 + bleed * 0.9);

  return (
    <div className="cc-build">
      <div className="cc-mapcard">
        <div className={`cc-vitals${bleed > 65 ? ' is-crit' : bleed > 35 ? ' is-warn' : ''}`}>
          <div className="cc-vital"><span>BP</span><b>{sbp}/{Math.round(sbp * 0.62)}</b></div>
          <div className="cc-vital cc-vital-hr"><span>HR</span><b>{hr}</b><i className="cc-ecg" style={{ animationDuration: `${60 / hr}s` }} /></div>
          <div className="cc-bleedbar" aria-label={`Blood loss ${Math.round(bleed)}%`}>
            <div className="cc-bleedfill" style={{ width: `${bleed}%` }} />
            <span>Blood loss {Math.round(bleed)}%</span>
          </div>
          <div className="cc-vital"><span>Score</span><b>{score}</b></div>
        </div>

        <div className="cc-vessel" aria-hidden="true">
          <div className="cc-vessel-tube"><div className="cc-cells" /></div>
          <div className={`cc-tear${phase === 'won' ? ' is-sealed' : ''}`}>
            {phase !== 'won' && Array.from({ length: 6 }, (_, i) => (
              <i key={i} className="cc-drop" style={{ animationDelay: `${i * 0.27}s`, animationDuration: `${Math.max(0.6, 1.6 - bleed / 90)}s`, left: `${8 + i * 14}%` }} />
            ))}
            {phase === 'won' && <span className="cc-plug" />}
          </div>
          <div className="cc-pool" style={{ transform: `scaleX(${0.2 + bleed / 110})` }} />
        </div>

        <div className="cc-mapwrap">
          <CascadeMap lit={litIds} hidden={hidden} current={phase === 'play' ? cur?.node : null}
                      shake={shake} sealed={phase === 'won'} hideKinin />
          {burst && <Burst k={burst.k} good={burst.good} />}
        </div>
      </div>

      <aside className="cc-side">
        {phase === 'intro' && (
          <div className="cc-card cc-intro">
            <div className="cc-big-ic">🩸</div>
            <h3>A vessel has torn.</h3>
            <p>The patient is bleeding. Fill the empty slots in the order the cascade fires — every second costs blood, every wrong factor costs more.</p>
            <ul className="cc-rules"><li>⚡ Fast answers score bonus points</li><li>❌ Wrong factor = +10% blood loss</li><li>🩹 Seal it with cross-linked fibrin to win</li></ul>
            <button type="button" className="cc-go" onClick={start}>Stop the bleeding →</button>
            {best > 0 && <p className="cc-best">Best: {best}</p>}
          </div>
        )}
        {phase === 'play' && cur && (
          <div className="cc-card">
            <p className="cc-stepno">Step {step + 1} / {BUILD_STEPS.length}</p>
            <p className="cc-prompt" key={step}>{cur.prompt}</p>
            <div className="cc-tray">
              {tiles.map(t => (
                <button key={t.id} type="button"
                        className={`cc-tile${badTile === t.id ? ' is-bad' : ''}${t.id.startsWith('d_') ? ' is-decoy' : ''}`}
                        onClick={() => choose(t)}>{t.label}</button>
              ))}
            </div>
            <Pearl text={pearl} />
          </div>
        )}
        {(phase === 'won' || phase === 'lost') && (
          <div className={`cc-card cc-result ${phase === 'won' ? 'is-won' : 'is-lost'}`}>
            <div className="cc-big-ic">{phase === 'won' ? '🩹' : '💀'}</div>
            <h3>{phase === 'won' ? 'Bleeding stopped!' : 'The patient crashed.'}</h3>
            {phase === 'won' && <Stars n={stars} />}
            <p className="cc-final">{score} pts · {misses} wrong · {Math.round(bleed)}% blood lost</p>
            {phase === 'won' && score >= best && <p className="cc-newbest">New best!</p>}
            <p className="cc-muted">{phase === 'won'
              ? 'XII → XI → IX (+VIII) and TF + VII → X (+V) → thrombin → fibrin, cross-linked by XIII.'
              : 'Review the map in Learn, then try again — XII, XI, IX, VIII… VII… X, V, II, I, XIII.'}</p>
            <button type="button" className="cc-go" onClick={start}>Play again</button>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── DRUG STRIKE ──────────────────────────────────────────────────────────────
const DRUG_ROUND = 8;
const DRUG_TIME = 25;

function DrugStrike() {
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(() => new Set());
  const [res, setRes] = useState(null); // { ok }
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [time, setTime] = useState(DRUG_TIME);
  const [phase, setPhase] = useState('intro');
  const drug = deck[idx];

  const start = () => {
    setDeck(shuffle(DRUGS).slice(0, DRUG_ROUND));
    setIdx(0); setSel(new Set()); setRes(null); setScore(0); setStreak(0); setRight(0); setTime(DRUG_TIME);
    setPhase('play');
    clotSfx.shield();
  };

  const strike = useCallback((timeout = false) => {
    if (!drug || res) return;
    const need = new Set(drug.targets);
    const ok = !timeout && drug.targets.every(t => sel.has(t))
      && [...sel].every(t => need.has(t) || (drug.optional || []).includes(t));
    setRes({ ok, timeout });
    if (ok) {
      const ns = streak + 1;
      setStreak(ns); setRight(r => r + 1);
      setScore(s => s + (100 + time * 6) * (ns >= 3 ? 2 : 1));
      if (drug.targets.includes('PLG') && drug.effect === 'activate') clotSfx.dissolve();
      else clotSfx.shield();
      if (ns >= 3) setTimeout(() => clotSfx.combo(ns), 250);
    } else {
      setStreak(0);
      timeout ? clotSfx.flatline() : clotSfx.drip();
    }
  }, [drug, res, sel, streak, time]);

  useEffect(() => {
    if (phase !== 'play' || res) return undefined;
    if (time <= 0) { strike(true); return undefined; }
    const t = setTimeout(() => setTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, res, time, strike]);

  const next = () => {
    if (idx + 1 >= deck.length) { setPhase('done'); clotSfx.sealed(); return; }
    setIdx(i => i + 1); setSel(new Set()); setRes(null); setTime(DRUG_TIME);
  };

  const effects = useMemo(() => {
    if (!res || !drug) return {};
    const e = {};
    drug.targets.forEach(t => { e[t] = drug.effect; });
    return e;
  }, [res, drug]);

  const lit = useMemo(() => {
    const s = new Set(ALL_IDS);
    if (res && drug && drug.effect === 'inhibit') drug.targets.forEach(t => s.delete(t));
    return s;
  }, [res, drug]);

  return (
    <div className="cc-build">
      <div className="cc-mapcard">
        <div className="cc-vitals">
          <div className="cc-vital"><span>Drug</span><b>{phase === 'play' ? `${idx + 1}/${deck.length}` : '—'}</b></div>
          <div className={`cc-timer${time <= 5 && !res ? ' is-low' : ''}`}><div style={{ width: `${(time / DRUG_TIME) * 100}%` }} /><span>{phase === 'play' ? `${time}s` : ''}</span></div>
          <div className="cc-vital"><span>Streak</span><b>{streak >= 3 ? `🔥${streak}` : streak}</b></div>
          <div className="cc-vital"><span>Score</span><b>{score}</b></div>
        </div>
        <div className="cc-mapwrap">
          <CascadeMap lit={lit} selected={sel} effects={effects} lysing={!!(res?.ok && drug?.id === 'tpa')}
                      hit={res && !res.ok ? new Set(drug.targets) : new Set()}
                      onNode={phase === 'play' && !res ? (id) => {
                        clotSfx.pick();
                        setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
                      } : undefined} />
        </div>
      </div>
      <aside className="cc-side">
        {phase === 'intro' && (
          <div className="cc-card cc-intro">
            <div className="cc-big-ic">💉</div>
            <h3>Drug Strike</h3>
            <p>A drug card drops. Tap every node it acts on — the factor it blocks, or the step it boosts — then hit <b>Strike</b>.</p>
            <ul className="cc-rules"><li>🎯 Some drugs hit several factors (tap them all)</li><li>⏱️ {DRUG_TIME} s each — faster = more points</li><li>🔥 3 in a row doubles your score</li></ul>
            <button type="button" className="cc-go" onClick={start}>Load the syringe →</button>
          </div>
        )}
        {phase === 'play' && drug && (
          <div className="cc-card">
            <div className={`cc-drugcard${res ? (res.ok ? ' is-ok' : ' is-bad') : ''}`} key={drug.id}>
              <span className="cc-drug-cls">{drug.cls}</span>
              <span className="cc-drug-name">{drug.name}</span>
            </div>
            {!res && (
              <>
                <p className="cc-muted">Selected: {sel.size ? [...sel].map(id => NODE_BY_ID[id].label).join(', ') : 'nothing yet — tap the map'}</p>
                <button type="button" className="cc-go" disabled={!sel.size} onClick={() => strike(false)}>⚡ Strike</button>
              </>
            )}
            {res && (
              <div className="cc-explain">
                <p className={`cc-verdict ${res.ok ? 'ok' : 'bad'}`}>{res.ok ? '✔ Direct hit!' : res.timeout ? '⏱ Out of time' : '✘ Missed'}</p>
                <p><b>Acts on:</b> {drug.targets.map(t => NODE_BY_ID[t].label).join(', ')} ({drug.effect === 'inhibit' ? 'blocks' : 'boosts'})</p>
                <p><b>How:</b> {drug.mech}</p>
                <p><b>Monitor:</b> {drug.monitor} · <b>Reverse:</b> {drug.reversal}</p>
                <Pearl text={drug.pearl} />
                <button type="button" className="cc-go" onClick={next}>{idx + 1 >= deck.length ? 'See results' : 'Next drug →'}</button>
              </div>
            )}
          </div>
        )}
        {phase === 'done' && (
          <div className="cc-card cc-result is-won">
            <div className="cc-big-ic">🎯</div>
            <h3>{right}/{deck.length} direct hits</h3>
            <Stars n={right >= deck.length - 1 ? 3 : right >= deck.length / 2 ? 2 : 1} />
            <p className="cc-final">{score} pts</p>
            <button type="button" className="cc-go" onClick={start}>New round</button>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── LAB DETECTIVE ────────────────────────────────────────────────────────────
const LAB_ROUND = 10;
const LAB_TIME = 30;

function LabTile({ name, value, i }) {
  const cls = value.includes('↑') ? 'up' : value.includes('↓') ? 'down' : 'norm';
  return (
    <div className={`cc-lab is-${cls}`} style={{ animationDelay: `${i * 110}ms` }}>
      <span>{name}</span>
      <b>{value === 'N' ? 'Normal' : value}</b>
    </div>
  );
}

function LabDetective() {
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [opts, setOpts] = useState([]);
  const [pick, setPick] = useState(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [time, setTime] = useState(LAB_TIME);
  const [phase, setPhase] = useState('intro');
  const c = deck[idx];

  const deal = (d, i) => { setOpts(shuffle([d[i].dx, ...d[i].others])); setPick(null); setTime(LAB_TIME); };
  const start = () => {
    const d = shuffle(CASES).slice(0, LAB_ROUND);
    setDeck(d); setIdx(0); setLives(3); setScore(0); setStreak(0); setRight(0);
    deal(d, 0); setPhase('play'); clotSfx.flip();
  };

  const answer = useCallback((dx) => {
    if (!c || pick) return;
    setPick(dx || '__timeout');
    if (dx === c.dx) {
      const ns = streak + 1;
      setStreak(ns); setRight(r => r + 1);
      setScore(s => s + (100 + time * 5) * (ns >= 3 ? 2 : 1));
      clotSfx.activate(Math.min(ns + 3, 11));
      if (ns >= 3) setTimeout(() => clotSfx.combo(ns), 200);
    } else {
      setStreak(0);
      setLives(l => l - 1);
      dx ? clotSfx.drip() : clotSfx.flatline();
    }
  }, [c, pick, streak, time]);

  useEffect(() => {
    if (phase !== 'play' || pick) return undefined;
    if (time <= 0) { answer(null); return undefined; }
    const t = setTimeout(() => setTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, pick, time, answer]);

  const next = () => {
    if (lives <= 0 || idx + 1 >= deck.length) { setPhase('done'); lives > 0 ? clotSfx.sealed() : clotSfx.flatline(); return; }
    deal(deck, idx + 1); setIdx(i => i + 1); clotSfx.flip();
  };

  return (
    <div className="cc-labs-mode">
      {phase === 'intro' && (
        <div className="cc-card cc-intro cc-intro-wide">
          <div className="cc-big-ic">🔬</div>
          <h3>Lab Detective</h3>
          <p>A patient, a coag panel. Read PT, PTT, platelets and bleeding time and name the disorder — then see which part of the cascade broke.</p>
          <ul className="cc-rules"><li>❤️ 3 lives</li><li>⏱️ {LAB_TIME} s per case</li><li>🔥 3 in a row doubles points</li></ul>
          <button type="button" className="cc-go" onClick={start}>Open the first chart →</button>
        </div>
      )}
      {phase === 'play' && c && (
        <>
          <div className="cc-vitals">
            <div className="cc-vital"><span>Case</span><b>{idx + 1}/{deck.length}</b></div>
            <div className="cc-vital"><span>Lives</span><b className="cc-lives">{[0, 1, 2].map(i => <span key={i} className={i < lives ? 'on' : ''}>❤</span>)}</b></div>
            <div className={`cc-timer${time <= 7 && !pick ? ' is-low' : ''}`}><div style={{ width: `${(time / LAB_TIME) * 100}%` }} /><span>{time}s</span></div>
            <div className="cc-vital"><span>Streak</span><b>{streak >= 3 ? `🔥${streak}` : streak}</b></div>
            <div className="cc-vital"><span>Score</span><b>{score}</b></div>
          </div>
          <div className="cc-labgrid">
            <div className="cc-card cc-chart" key={idx}>
              <p className="cc-stem">{c.stem}</p>
              <div className="cc-labrow">
                <LabTile name="PT" value={c.labs.PT} i={0} />
                <LabTile name="PTT" value={c.labs.PTT} i={1} />
                <LabTile name="Platelets" value={c.labs.plt} i={2} />
                <LabTile name="Bleeding time" value={c.labs.BT} i={3} />
              </div>
              {c.extra && <p className="cc-extra">🧾 {c.extra}</p>}
              <div className="cc-opts">
                {opts.map(o => {
                  const state = pick ? (o === c.dx ? ' is-right' : o === pick ? ' is-wrong' : ' is-faded') : '';
                  return <button key={o} type="button" className={`cc-opt${state}`} disabled={!!pick} onClick={() => answer(o)}>{DX[o]}</button>;
                })}
              </div>
            </div>
            <div className="cc-card cc-reveal">
              {!pick ? (
                <p className="cc-muted cc-center">The broken step lights up here once you answer.</p>
              ) : (
                <>
                  <p className={`cc-verdict ${pick === c.dx ? 'ok' : 'bad'}`}>{pick === c.dx ? '✔ Correct' : pick === '__timeout' ? `⏱ Time — it was ${DX[c.dx]}` : `✘ It was ${DX[c.dx]}`}</p>
                  {c.hit.length > 0
                    ? <CascadeMap lit={new Set(ALL_IDS.filter(i => !c.hit.includes(i)))} hit={new Set(c.hit)} flow={false} />
                    : <p className="cc-platelet-note">🟣 A platelet problem — the coagulation cascade itself is intact (PT and PTT normal).</p>}
                  <p>{c.why}</p>
                  <Pearl text={c.pearl} />
                  <button type="button" className="cc-go" onClick={next}>{lives <= 0 || idx + 1 >= deck.length ? 'See results' : 'Next case →'}</button>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {phase === 'done' && (
        <div className={`cc-card cc-result cc-intro-wide ${lives > 0 ? 'is-won' : 'is-lost'}`}>
          <div className="cc-big-ic">{lives > 0 ? '🕵️' : '💀'}</div>
          <h3>{right} solved{lives <= 0 ? ' — out of lives' : ''}</h3>
          {lives > 0 && <Stars n={right >= 9 ? 3 : right >= 6 ? 2 : 1} />}
          <p className="cc-final">{score} pts</p>
          <button type="button" className="cc-go" onClick={start}>New shift</button>
        </div>
      )}
    </div>
  );
}

// ── PEARLS ───────────────────────────────────────────────────────────────────
function Pearls() {
  const tags = useMemo(() => ['All', ...new Set(PEARLS.map(p => p.tag))], []);
  const [tag, setTag] = useState('All');
  const [flipped, setFlipped] = useState(() => new Set());
  const [order, setOrder] = useState(PEARLS);
  const list = order.filter(p => tag === 'All' || p.tag === tag);
  return (
    <div className="cc-pearls">
      <div className="cc-chips">
        {tags.map(t => <button key={t} type="button" className={`cc-chip${tag === t ? ' is-on' : ''}`} onClick={() => { setTag(t); clotSfx.pick(); }}>{t}</button>)}
        <button type="button" className="cc-chip cc-chip-fire" onClick={() => { setOrder(shuffle(PEARLS)); setFlipped(new Set()); clotSfx.flip(); }}>🔀 Shuffle</button>
        <button type="button" className="cc-chip" onClick={() => { setFlipped(new Set(PEARLS.map(p => p.q))); clotSfx.flip(); }}>Reveal all</button>
      </div>
      <div className="cc-pgrid">
        {list.map((p, i) => {
          const on = flipped.has(p.q);
          return (
            <button key={p.q} type="button" className={`cc-flip${on ? ' is-on' : ''}`} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    onClick={() => { clotSfx.flip(); setFlipped(prev => { const n = new Set(prev); n.has(p.q) ? n.delete(p.q) : n.add(p.q); return n; }); }}>
              <span className="cc-flip-in">
                <span className="cc-flip-face cc-flip-q"><em>{p.tag}</em>{p.q}</span>
                <span className="cc-flip-face cc-flip-a"><em>{p.tag}</em>{p.a}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ClotCascade({ onExit }) {
  const [tab, setTab] = useState(() => {
    try { const t = new URLSearchParams(window.location.search).get('tab'); return TABS.some(x => x.id === t) ? t : 'learn'; } catch { return 'learn'; }
  });
  return (
    <div className="cc">
      <div className="cc-bg" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${14 + (i % 5) * 3}s`, '--sz': `${10 + (i % 4) * 6}px` }} />)}
      </div>
      <header className="cc-top">
        {onExit && <button type="button" className="cc-back" onClick={onExit}>← Minigames</button>}
        <div className="cc-brand">
          <span className="cc-brand-icon" aria-hidden="true">🩸</span>
          <div>
            <p className="cc-kicker">Hematology · Step 1</p>
            <h1 className="cc-title">Clot Cascade</h1>
          </div>
        </div>
        <SfxToggle />
      </header>
      <nav className="cc-tabs">
        {TABS.map(t => (
          <button key={t.id} type="button" className={`cc-tab${tab === t.id ? ' is-on' : ''}`}
                  onClick={() => { setTab(t.id); clotSfx.pick(); }}>
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>
      <main className="cc-main" key={tab}>
        {tab === 'learn' && <Learn />}
        {tab === 'build' && <Build />}
        {tab === 'drugs' && <DrugStrike />}
        {tab === 'labs' && <LabDetective />}
        {tab === 'pearls' && <Pearls />}
      </main>
    </div>
  );
}
