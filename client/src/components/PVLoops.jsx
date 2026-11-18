import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildLoop, coupledLoop, eesOf, metrics, NORMAL_INPUTS, NORMAL_LOOP, NORMAL_STIFF, PHASES, pointAt } from '../pv/pvEngine';
import { CASE_BY_ID, LAB_PRESETS, PV_CASES } from '../pv/pvData';
import PVChart, { HeartSchematic, PHASE_COLOURS, useCycle } from '../pv/PVChart';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './PVLoops.css';

/**
 * PV Loop Lab — pressure–volume loops, learned fast and properly.
 *
 *   LEARN        a guided tour: the axes, the four phases, the four valve
 *                events, SV and EF, the two boundary curves, then preload,
 *                afterload, contractility and compliance one at a time. Every
 *                step animates the loop with the left heart beside it, and
 *                ends with a one-question check.
 *   LAB          sliders for the four determinants, the normal loop as a
 *                ghost, and the numbers that moved.
 *   PATHOLOGIES  AS, AR, MR, MS, HFrEF, HFpEF and HCM (plus the acute
 *                changes), each over the normal loop, with what to spot.
 *   QUIZ         a 10-question run mixing "name this loop", "pick the loop",
 *                phases, valve events and EF.
 *
 * Nothing is saved to the server — like the other minigames, it is practice.
 */

const NORMAL_PTS = buildLoop(NORMAL_LOOP);
const NORMAL_M = metrics(NORMAL_LOOP, NORMAL_PTS);
const fmt = (x) => Math.round(x);
const pct = (x) => `${Math.round(x * 100)}%`;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ── The tour ─────────────────────────────────────────────────────────────────
const LESSONS = [
  {
    title: 'One loop = one heartbeat',
    body: [
      'Volume runs along the bottom, pressure up the side. Each point is the left ventricle at one instant.',
      'The dot goes round ANTI-CLOCKWISE once per beat: along the bottom (filling), up the right side, across the top (ejection), down the left side.',
      'Watch the heart beside it — the LV swells as the dot moves right and shrinks as it moves left.',
    ],
    view: { phaseColours: true },
    check: { q: 'Which direction does a PV loop run?', options: ['Anti-clockwise', 'Clockwise', 'Left to right only'], answer: 0, why: 'Filling (bottom, rightwards) → contraction (right side, up) → ejection (top, leftwards) → relaxation (left side, down): anti-clockwise.' },
  },
  {
    title: 'Phase 1 — Isovolumetric contraction',
    body: [
      'The mitral valve has just shut (S1). The LV squeezes, but the aortic valve is still closed, so no blood can leave.',
      'Pressure shoots up while volume stays the same — a vertical line on the RIGHT side, at end-diastolic volume (EDV).',
    ],
    view: { highlight: 'ivc' },
    check: { q: 'During isovolumetric contraction, which valves are open?', options: ['Neither', 'Mitral only', 'Aortic only'], answer: 0, why: 'Both valves are shut — that is why the volume cannot change ("iso-volumetric").' },
  },
  {
    title: 'Phase 2 — Ejection',
    body: [
      'Once LV pressure passes aortic diastolic pressure (~80 mmHg) the aortic valve opens and blood leaves.',
      'Volume falls (the line runs LEFT across the top) while pressure peaks (~120 mmHg = systolic BP) and then starts to fall.',
    ],
    view: { highlight: 'ej' },
    check: { q: 'What decides the pressure at which the aortic valve opens?', options: ['Aortic diastolic pressure', 'Left atrial pressure', 'End-diastolic volume'], answer: 0, why: 'The valve opens when LV pressure exceeds the pressure on the other side of it — aortic diastolic pressure.' },
  },
  {
    title: 'Phase 3 — Isovolumetric relaxation',
    body: [
      'The aortic valve shuts (S2) at end-systole. Both valves are closed again.',
      'The LV relaxes: pressure drops steeply at a constant, small volume — the vertical line on the LEFT, at end-systolic volume (ESV).',
    ],
    view: { highlight: 'ivr' },
    check: { q: 'The left vertical side of the loop sits at which volume?', options: ['End-systolic volume', 'End-diastolic volume', 'Stroke volume'], answer: 0, why: 'Relaxation happens after ejection has finished, at the smallest volume — the ESV.' },
  },
  {
    title: 'Phase 4 — Filling',
    body: [
      'When LV pressure drops below LA pressure the mitral valve opens and the LV fills.',
      'Volume rises a lot while pressure barely changes — the flat bottom of the loop — ending at EDV. Then the mitral valve shuts and the beat starts again.',
    ],
    view: { highlight: 'fill' },
    check: { q: 'Why is the bottom of a normal loop so flat?', options: ['A compliant LV fills with little rise in pressure', 'The aortic valve is open', 'The LV is contracting'], answer: 0, why: 'A healthy LV is compliant: it accepts ~70 mL with only a few mmHg rise. A stiff LV makes this line steep.' },
  },
  {
    title: 'The four corners are the four valve events',
    body: [
      'Bottom-right: MITRAL CLOSES (S1). Top-right: AORTIC OPENS. Top-left: AORTIC CLOSES (S2). Bottom-left: MITRAL OPENS.',
      'Learn the corners and you can read any loop: the right side is EDV, the left side is ESV.',
    ],
    view: { corners: true },
    check: { q: 'Which corner marks S2?', options: ['Top-left (aortic closes)', 'Bottom-right (mitral closes)', 'Top-right (aortic opens)'], answer: 0, why: 'S2 is aortic (and pulmonic) valve closure at the end of ejection — the top-left corner.' },
  },
  {
    title: 'Width = stroke volume; width ÷ EDV = ejection fraction',
    body: [
      `SV = EDV − ESV = ${fmt(NORMAL_M.edv)} − ${fmt(NORMAL_M.esv)} = ${fmt(NORMAL_M.sv)} mL.`,
      `EF = SV ÷ EDV = ${fmt(NORMAL_M.sv)} ÷ ${fmt(NORMAL_M.edv)} ≈ ${pct(NORMAL_M.ef)} (normal ≥ 55%).`,
      'The AREA inside the loop is the stroke work — the work the LV does on the blood each beat.',
    ],
    view: { svBracket: true, shade: true },
    check: { q: 'EDV 150 mL, ESV 90 mL. What is the EF?', options: ['40%', '60%', '67%'], answer: 0, why: 'SV = 150 − 90 = 60 mL; EF = 60 ÷ 150 = 40% — reduced.' },
  },
  {
    title: 'Two boundaries: ESPVR and EDPVR',
    body: [
      'The ESPVR (end-systolic pressure–volume relationship) is the straight line through the top-left corner. Its SLOPE is CONTRACTILITY — steeper = stronger.',
      'The EDPVR (end-diastolic) is the curve the bottom of the loop rides on. Its steepness is STIFFNESS — steeper = less compliant.',
      'Every loop lives between these two: contraction stops on the ESPVR, filling runs along the EDPVR.',
    ],
    view: { boundaries: true },
    check: { q: 'A steeper ESPVR means…', options: ['Increased contractility', 'Decreased compliance', 'Increased preload'], answer: 0, why: 'ESPVR slope (end-systolic elastance) is the load-independent index of contractility.' },
  },
  {
    title: 'Preload ↑ — the loop gets wider to the right',
    body: [
      'More venous return (IV fluids, lying down) stretches the LV further along the SAME filling curve → EDV ↑.',
      'Frank–Starling: more stretch → more forceful contraction → SV ↑. The end-systolic corner stays on the same ESPVR.',
    ],
    view: { compare: 'preload_up', boundaries: true },
    check: { q: 'Increased preload mainly changes…', options: ['EDV (right side moves right)', 'ESPVR slope', 'Aortic opening pressure only'], answer: 0, why: 'Preload is end-diastolic stretch — it moves the right-hand side.' },
  },
  {
    title: 'Afterload ↑ — taller and narrower',
    body: [
      'Higher arterial pressure (hypertension, vasoconstrictors) means the LV must build more pressure before the aortic valve opens.',
      'Ejection meets the ESPVR at a higher pressure, so it stops at a LARGER volume → ESV ↑, SV ↓.',
    ],
    view: { compare: 'afterload_up', boundaries: true },
    check: { q: 'With increased afterload, ESV…', options: ['Rises', 'Falls', 'Does not change'], answer: 0, why: 'The end-systolic point slides UP the ESPVR — higher pressure, larger volume.' },
  },
  {
    title: 'Contractility ↑ — the ESPVR steepens',
    body: [
      'Sympathetic drive, dobutamine or digoxin make the myocardium stronger at every volume — the ESPVR rotates up.',
      'The LV empties further: ESV ↓, SV ↑, EF ↑ — with the same EDV.',
    ],
    view: { compare: 'contractility_up', boundaries: true },
    check: { q: 'Which change leaves EDV the same but lowers ESV?', options: ['Increased contractility', 'Increased preload', 'Increased afterload'], answer: 0, why: 'Inotropes move the left side leftwards without changing filling.' },
  },
  {
    title: 'Compliance ↓ — the filling curve steepens',
    body: [
      'A stiff LV (hypertrophy, amyloid, ageing) needs much more pressure to hold the same volume.',
      'The bottom of the loop climbs steeply: EDP ↑, EDV ↓ or ↔, EF normal — diastolic dysfunction (HFpEF).',
    ],
    view: { compare: 'hfpef', boundaries: true },
    check: { q: 'A stiff LV with a normal EF shows mainly…', options: ['High EDP for its volume', 'A flat ESPVR', 'A very large EDV'], answer: 0, why: 'Stiffness raises filling pressure; contraction (EF) is preserved.' },
  },
  {
    title: 'Regurgitation breaks the "isovolumetric" rule',
    body: [
      'If a valve leaks, volume CAN change while both "proper" valves are shut.',
      'MR: blood escapes to the LA as soon as the LV squeezes and while it relaxes → both vertical sides lean LEFT.',
      'AR: blood pours back from the aorta while the LV relaxes → the left side leans RIGHT, and EDV gets huge.',
      'Now open Pathologies to see every classic loop side by side.',
    ],
    view: { compare: 'mr', also: 'ar' },
    check: { q: 'A loop with no true isovolumetric relaxation whose left side leans RIGHT suggests…', options: ['Aortic regurgitation', 'Mitral regurgitation', 'Aortic stenosis'], answer: 0, why: 'In AR the LV gains volume from the aorta during relaxation, so the line moves right as pressure falls.' },
  },
];

// ── The quiz ────────────────────────────────────────────────────────────────
const VIGNETTES = {
  as: 'A 78-year-old with exertional syncope and a crescendo–decrescendo murmur radiating to the carotids.',
  ar: 'A man with Marfan syndrome, bounding pulses and a wide pulse pressure.',
  mr: 'A patient 4 days after an MI with a new holosystolic murmur at the apex radiating to the axilla.',
  ms: 'A woman with past rheumatic fever, an opening snap and a diastolic rumble.',
  hfref: 'A heavy drinker with an S3, a displaced apex and an EF of 25%.',
  hfpef: 'An elderly hypertensive woman with dyspnoea, an S4 and an EF of 60%.',
  hcm: 'A young athlete who collapsed; his systolic murmur gets louder with Valsalva.',
  preload_up: 'A patient receives a 1 L bolus of IV saline.',
  preload_down: 'A trauma patient loses 1.5 L of blood.',
  afterload_up: 'A patient is started on a phenylephrine infusion.',
  afterload_down: 'A patient is given hydralazine, an arteriolar dilator.',
  contractility_up: 'A patient in cardiogenic shock is started on dobutamine.',
  contractility_down: 'A patient takes a large dose of a β-blocker.',
};
const EVENT_OPTIONS = { mc: 'Mitral valve closes', ao: 'Aortic valve opens', ac: 'Aortic valve closes', mo: 'Mitral valve opens' };
const EVENT_WHY = {
  mc: 'Bottom-right: end of filling, the mitral valve shuts (S1) and isovolumetric contraction begins.',
  ao: 'Top-right: LV pressure exceeds aortic diastolic pressure, the aortic valve opens and ejection begins.',
  ac: 'Top-left: end of ejection, the aortic valve shuts (S2) and isovolumetric relaxation begins.',
  mo: 'Bottom-left: LV pressure falls below LA pressure, the mitral valve opens and filling begins.',
};

function makeQuiz() {
  const ids = shuffle(PV_CASES.map(c => c.id));
  const qs = [];
  const distract = (id) => {
    const c = CASE_BY_ID[id];
    const pool = c.confusers.concat(shuffle(PV_CASES.map(x => x.id).filter(x => x !== id && !c.confusers.includes(x))));
    return pool.slice(0, 3);
  };
  // Name the loop ×5
  ids.slice(0, 5).forEach(id => {
    qs.push({ type: 'identify', id, options: shuffle([id, ...distract(id)]) });
  });
  // Pick the loop ×2
  ids.slice(5, 7).forEach(id => {
    qs.push({ type: 'pick', id, options: shuffle([id, ...distract(id)]) });
  });
  // Phase
  const ph = shuffle(Object.keys(PHASES))[0];
  qs.push({ type: 'phase', phase: ph, options: shuffle(Object.keys(PHASES)) });
  // Valve event
  const ev = shuffle(Object.keys(EVENT_OPTIONS))[0];
  qs.push({ type: 'event', corner: ev, options: shuffle(Object.keys(EVENT_OPTIONS)) });
  // EF
  const calcId = shuffle(['hfref', 'contractility_up', 'preload_up', 'contractility_down', 'normal'])[0];
  qs.push({ type: 'calc', id: calcId });
  return shuffle(qs);
}

function loopFor(id) {
  return id === 'normal' ? NORMAL_LOOP : CASE_BY_ID[id].loop;
}

// ── Page ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'learn', label: 'Learn', icon: '🎓' },
  { id: 'lab', label: 'Lab', icon: '🎛️' },
  { id: 'path', label: 'Pathologies', icon: '🩺' },
  { id: 'quiz', label: 'Quiz', icon: '🏆' },
];

export default function PVLoops({ onExit }) {
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem('mv_pv_tab') || 'learn'; } catch { return 'learn'; }
  });
  const go = (t) => { sfx.select(); setTab(t); try { localStorage.setItem('mv_pv_tab', t); } catch { /* not remembered */ } };

  return (
    <div className="pvl">
      <div className="pvl-glow" aria-hidden="true" />
      <header className="pvl-top">
        {onExit && <button type="button" className="pvl-back" onClick={onExit}>← Minigames</button>}
        <div className="pvl-brand">
          <span className="pvl-brand-icon" aria-hidden="true">🫀</span>
          <div>
            <p className="pvl-kicker">Cardiology · Minigame</p>
            <h1 className="pvl-title">PV Loop Lab</h1>
          </div>
        </div>
        <SfxToggle />
      </header>
      <nav className="pvl-tabs" role="tablist" aria-label="Section">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={`pvl-tab${tab === t.id ? ' is-on' : ''}`} onClick={() => go(t.id)}>
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>
      <main className="pvl-main">
        {tab === 'learn' && <Learn onDone={() => go('path')} />}
        {tab === 'lab' && <Lab />}
        {tab === 'path' && <Pathologies />}
        {tab === 'quiz' && <Quiz onReview={() => go('path')} />}
      </main>
    </div>
  );
}

// ── Shared: an animated chart with the heart beside it ─────────────────────
function LiveLoop({ main, compare = [], running, speed, chartProps = {}, mainColor = '#ff7a59' }) {
  const pts = useMemo(() => buildLoop(main), [main]);
  const cmp = useMemo(() => compare.map(c => ({ ...c, pts: buildLoop(c.loop) })), [compare]);
  const t = useCycle(running, 3.8 / speed);
  const dot = pointAt(pts, t);
  const vs = pts.map(q => q.v);
  return (
    <div className="pvl-live">
      <div className="pvl-chart">
        <PVChart
          loops={[{ pts, color: mainColor }, ...cmp.map(c => ({ pts: c.pts, color: c.color, dashed: c.dashed, width: 2 }))]}
          dot={dot}
          {...chartProps}
        />
      </div>
      <div className="pvl-side">
        <HeartSchematic v={dot.v} minV={Math.min(...vs)} maxV={Math.max(...vs)} phase={dot.phase} />
        <div className="pvl-phase" style={{ '--ph': PHASE_COLOURS[dot.phase] }}>
          <span className="pvl-phase-dot" />
          <b>{PHASES[dot.phase].name}</b>
        </div>
        <div className="pvl-readout">
          <span><small>Volume</small>{fmt(dot.v)} mL</span>
          <span><small>Pressure</small>{fmt(dot.p)} mmHg</span>
        </div>
      </div>
    </div>
  );
}

function PlayControls({ running, setRunning, speed, setSpeed }) {
  return (
    <div className="pvl-controls">
      <button type="button" className="pvl-ctl" onClick={() => setRunning(!running)}>{running ? '⏸ Pause' : '▶ Play'}</button>
      {[0.5, 1, 2].map(s => (
        <button key={s} type="button" className={`pvl-ctl${speed === s ? ' is-on' : ''}`} onClick={() => setSpeed(s)}>{s}×</button>
      ))}
    </div>
  );
}

// ── Learn ───────────────────────────────────────────────────────────────────
function Learn({ onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const L = LESSONS[i];
  const v = L.view || {};
  useEffect(() => { setPicked(null); }, [i]);
  // The right answer is written first in LESSONS; show the options in a fresh
  // order each time so it is never simply "the top one".
  const order = useMemo(() => shuffle(L.check ? L.check.options.map((_, k) => k) : []), [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const compare = [];
  let main = NORMAL_LOOP;
  const mainColor = '#ff7a59';
  if (v.compare) {
    main = CASE_BY_ID[v.compare].loop;
    compare.push({ loop: NORMAL_LOOP, color: 'rgba(255,255,255,0.55)', dashed: true });
    if (v.also) compare.push({ loop: CASE_BY_ID[v.also].loop, color: '#6fb6ff' });
  }
  const chartProps = {
    phaseColours: Boolean(v.phaseColours),
    highlight: v.highlight || null,
    showCorners: Boolean(v.corners),
    shadeArea: Boolean(v.shade),
    svBracket: v.svBracket ? { edv: NORMAL_M.edv, esv: NORMAL_M.esv } : null,
    espvr: v.boundaries ? { ees: eesOf(main) } : null,
    edpvrCurve: v.boundaries ? (main.stiff || NORMAL_STIFF) : null,
  };
  const answer = (k) => {
    if (picked != null) return;
    setPicked(k);
    if (k === L.check.answer) sfx.correct(); else sfx.wrong();
  };

  return (
    <section className="pvl-learn">
      <div className="pvl-steps" aria-label="Lesson progress">
        {LESSONS.map((l, k) => (
          <button key={k} type="button" className={`pvl-step${k === i ? ' is-on' : ''}${k < i ? ' is-done' : ''}`} onClick={() => setI(k)} title={l.title} aria-label={`Step ${k + 1}: ${l.title}`} />
        ))}
      </div>
      <div className="pvl-grid">
        <div>
          <LiveLoop main={main} compare={compare} running={running} speed={speed} chartProps={chartProps} mainColor={mainColor} />
          <PlayControls running={running} setRunning={setRunning} speed={speed} setSpeed={setSpeed} />
          {v.compare && (
            <p className="pvl-legend">
              <span className="pvl-key pvl-key--main" /> {CASE_BY_ID[v.compare].short}
              {v.also && <><span className="pvl-key pvl-key--blue" /> {CASE_BY_ID[v.also].short}</>}
              <span className="pvl-key pvl-key--dash" /> Normal
            </p>
          )}
        </div>
        <div className="pvl-card">
          <p className="pvl-card-n">Step {i + 1} of {LESSONS.length}</p>
          <h2 className="pvl-card-title">{L.title}</h2>
          {L.body.map((b, k) => <p key={k} className="pvl-card-p">{b}</p>)}
          {L.check && (
            <div className="pvl-check">
              <p className="pvl-check-q">✋ Quick check: {L.check.q}</p>
              <div className="pvl-check-opts">
                {order.map((k) => { const o = L.check.options[k]; return (
                  <button key={k} type="button" disabled={picked != null}
                    className={`pvl-opt${picked != null && k === L.check.answer ? ' is-right' : ''}${picked === k && k !== L.check.answer ? ' is-wrong' : ''}`}
                    onClick={() => answer(k)}>{o}</button>
                ); })}
              </div>
              {picked != null && <p className={`pvl-why${picked === L.check.answer ? ' is-right' : ''}`}>{picked === L.check.answer ? '✓ ' : '✗ '}{L.check.why}</p>}
            </div>
          )}
          <div className="pvl-nav">
            <button type="button" className="pvl-btn pvl-btn--ghost" disabled={i === 0} onClick={() => { sfx.select(); setI(i - 1); }}>← Back</button>
            {i < LESSONS.length - 1
              ? <button type="button" className="pvl-btn" onClick={() => { sfx.next(); setI(i + 1); }}>Next →</button>
              : <button type="button" className="pvl-btn" onClick={() => { sfx.complete(); onDone(); }}>See the pathologies →</button>}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Lab ─────────────────────────────────────────────────────────────────────
const SLIDERS = [
  { key: 'fill', label: 'Preload', sub: 'filling pressure (EDP)', min: 3, max: 25, step: 0.5, unit: 'mmHg', fmt: (x) => x.toFixed(1) },
  { key: 'ea', label: 'Afterload', sub: 'arterial elastance (Ea)', min: 0.7, max: 3.2, step: 0.05, unit: 'mmHg/mL', fmt: (x) => x.toFixed(2) },
  { key: 'ees', label: 'Contractility', sub: 'ESPVR slope (Ees)', min: 0.8, max: 4.5, step: 0.05, unit: 'mmHg/mL', fmt: (x) => x.toFixed(2) },
  { key: 'stiffMul', label: 'Stiffness', sub: 'EDPVR steepness', min: 0.6, max: 1.8, step: 0.05, unit: '× normal', fmt: (x) => x.toFixed(2) },
];

function Lab() {
  const [inp, setInp] = useState(NORMAL_INPUTS);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const L = useMemo(() => coupledLoop(inp), [inp]);
  const m = useMemo(() => metrics(L), [L]);
  const rows = [
    ['EDV', m.edv, NORMAL_M.edv, 'mL'],
    ['ESV', m.esv, NORMAL_M.esv, 'mL'],
    ['Stroke volume', m.sv, NORMAL_M.sv, 'mL'],
    ['Ejection fraction', m.ef * 100, NORMAL_M.ef * 100, '%'],
    ['EDP', m.edp, NORMAL_M.edp, 'mmHg'],
    ['Peak pressure', m.peak, NORMAL_M.peak, 'mmHg'],
    ['Stroke work', m.sw / 1000, NORMAL_M.sw / 1000, 'k·mmHg·mL'],
  ];
  const notes = labNotes(inp);
  return (
    <section className="pvl-lab">
      <div className="pvl-grid">
        <div>
          <LiveLoop
            main={L}
            compare={[{ loop: NORMAL_LOOP, color: 'rgba(255,255,255,0.5)', dashed: true }]}
            running={running} speed={speed}
            chartProps={{ espvr: { ees: inp.ees }, edpvrCurve: L.stiff }}
          />
          <PlayControls running={running} setRunning={setRunning} speed={speed} setSpeed={setSpeed} />
          <p className="pvl-legend"><span className="pvl-key pvl-key--main" /> Your loop <span className="pvl-key pvl-key--dash" /> Normal</p>
        </div>
        <div className="pvl-card">
          <h2 className="pvl-card-title">Turn the dials</h2>
          <div className="pvl-presets">
            {LAB_PRESETS.map(p => (
              <button key={p.id} type="button" className="pvl-chip" onClick={() => { sfx.select(); setInp(p.inputs); }}>
                <span aria-hidden="true">{p.icon}</span> {p.label}
              </button>
            ))}
          </div>
          {SLIDERS.map(s => (
            <label key={s.key} className="pvl-slider">
              <span className="pvl-slider-head">
                <b>{s.label}</b> <small>{s.sub}</small>
                <em>{s.fmt(inp[s.key])} {s.unit}</em>
              </span>
              <input type="range" min={s.min} max={s.max} step={s.step} value={inp[s.key]}
                onChange={e => setInp({ ...inp, [s.key]: Number(e.target.value) })} />
            </label>
          ))}
          <table className="pvl-table">
            <thead><tr><th /><th>Now</th><th>Normal</th><th /></tr></thead>
            <tbody>
              {rows.map(([n, a, b, u]) => {
                const d = (a - b) / (Math.abs(b) || 1);
                const arrow = d > 0.04 ? '↑' : d < -0.04 ? '↓' : '↔';
                return (
                  <tr key={n}>
                    <th>{n}</th>
                    <td>{n === 'Stroke work' ? a.toFixed(1) : fmt(a)} <small>{u}</small></td>
                    <td>{n === 'Stroke work' ? b.toFixed(1) : fmt(b)}</td>
                    <td className={`pvl-arrow pvl-arrow--${arrow === '↑' ? 'up' : arrow === '↓' ? 'down' : 'flat'}`}>{arrow}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {notes.length > 0 && (
            <ul className="pvl-notes">{notes.map((n, k) => <li key={k}>{n}</li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

function labNotes(inp) {
  const n = [];
  const N = NORMAL_INPUTS;
  if (inp.fill > N.fill + 1) n.push('Preload ↑: the LV stretches further along its filling curve — EDV ↑, and Frank–Starling raises SV.');
  if (inp.fill < N.fill - 1) n.push('Preload ↓: less filling — EDV ↓ and SV ↓ (think haemorrhage, diuretics, nitrates).');
  if (inp.ea > N.ea + 0.15) n.push('Afterload ↑: the aortic valve opens later and ejection stops at a higher pressure — ESV ↑, SV ↓.');
  if (inp.ea < N.ea - 0.15) n.push('Afterload ↓: the LV ejects more easily — ESV ↓, SV ↑, lower pressures.');
  if (inp.ees > N.ees + 0.2) n.push('Contractility ↑: the ESPVR steepens — the LV empties further, ESV ↓ and EF ↑.');
  if (inp.ees < N.ees - 0.2) n.push('Contractility ↓: the ESPVR flattens — ESV ↑, SV and EF ↓ (systolic dysfunction).');
  if (inp.stiffMul > 1.08) n.push('Stiffness ↑: the EDPVR steepens — at the same filling pressure the LV holds less (EDV ↓). Diastolic dysfunction.');
  if (inp.stiffMul < 0.92) n.push('Stiffness ↓: a very compliant (dilated) LV fills to a larger volume at the same pressure.');
  return n;
}

// ── Pathologies ─────────────────────────────────────────────────────────────
const GROUPS = [
  ['Valve disease', ['as', 'ar', 'ms', 'mr']],
  ['Heart failure & cardiomyopathy', ['hfref', 'hfpef', 'hcm']],
  ['Acute changes', ['preload_up', 'preload_down', 'afterload_up', 'afterload_down', 'contractility_up', 'contractility_down']],
];

function Pathologies() {
  const [id, setId] = useState('as');
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const c = CASE_BY_ID[id];
  const m = metrics(c.loop);
  const showEspvr = c.kind === 'change' || id === 'hfref';
  return (
    <section className="pvl-path">
      <div className="pvl-groups">
        {GROUPS.map(([g, ids]) => (
          <div key={g} className="pvl-group">
            <p className="pvl-group-t">{g}</p>
            <div className="pvl-group-chips">
              {ids.map(x => (
                <button key={x} type="button" className={`pvl-chip${x === id ? ' is-on' : ''}`}
                  onClick={() => { sfx.select(); setId(x); }}>
                  <span aria-hidden="true">{CASE_BY_ID[x].icon}</span> {CASE_BY_ID[x].short}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pvl-grid">
        <div>
          <LiveLoop
            main={c.loop}
            compare={[{ loop: NORMAL_LOOP, color: 'rgba(255,255,255,0.5)', dashed: true }]}
            running={running} speed={speed}
            chartProps={{
              espvr: showEspvr ? { ees: eesOf(c.loop) } : null,
              edpvrCurve: c.loop.stiff || NORMAL_STIFF,
            }}
          />
          <PlayControls running={running} setRunning={setRunning} speed={speed} setSpeed={setSpeed} />
          <p className="pvl-legend"><span className="pvl-key pvl-key--main" /> {c.short} <span className="pvl-key pvl-key--dash" /> Normal</p>
        </div>
        <div className="pvl-card">
          <p className="pvl-card-n">{c.kind === 'disease' ? 'Pathology' : 'Acute change'}</p>
          <h2 className="pvl-card-title"><span aria-hidden="true">{c.icon}</span> {c.name}</h2>
          <p className="pvl-sig"><b>Spot it:</b> {c.signature}</p>
          <div className="pvl-changes">
            {c.changes.map(([k, a]) => (
              <span key={k} className={`pvl-change${/↑/.test(a) ? ' is-up' : /↓/.test(a) ? ' is-down' : ''}`}><b>{a}</b> {k}</span>
            ))}
          </div>
          <div className="pvl-nums">
            <span><small>EDV</small>{fmt(m.edv)}</span>
            <span><small>ESV</small>{fmt(m.esv)}</span>
            <span><small>SV</small>{fmt(m.sv)}</span>
            <span><small>EF</small>{pct(m.ef)}</span>
            <span><small>EDP</small>{fmt(m.edp)}</span>
            <span><small>Peak</small>{fmt(m.peak)}</span>
          </div>
          <h3 className="pvl-h3">Why it looks like this</h3>
          <ul className="pvl-why-list">{c.why.map((w, k) => <li key={k}>{w}</li>)}</ul>
          <h3 className="pvl-h3">In a vignette</h3>
          <p className="pvl-card-p">{c.clues}</p>
          {(id === 'mr' || id === 'ar') && (
            <p className="pvl-tip">EF and "SV" here are TOTAL stroke volume. The forward stroke volume reaching the body is lower, because part of every beat leaks backwards.</p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Quiz ────────────────────────────────────────────────────────────────────
function Quiz({ onReview }) {
  const [qs, setQs] = useState(makeQuiz);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [log, setLog] = useState([]);
  const done = i >= qs.length;
  const q = qs[i];

  const restart = () => { setQs(makeQuiz()); setI(0); setPicked(null); setScore(0); setStreak(0); setLog([]); };
  const correctKey = q ? (q.type === 'identify' || q.type === 'pick' ? q.id : q.type === 'phase' ? q.phase : q.type === 'event' ? q.corner : q.answer) : null;

  const calc = useMemo(() => {
    if (!q || q.type !== 'calc') return null;
    const m = metrics(loopFor(q.id));
    const edv = Math.round(m.edv), esv = Math.round(m.esv);
    const ef = Math.round(((edv - esv) / edv) * 100);
    const opts = new Set([ef]);
    for (const d of [Math.round((esv / edv) * 100), Math.round(((edv - esv) / esv) * 100), ef + 15, ef - 15, ef + 8]) {
      if (opts.size < 4 && d > 5 && d < 99 && !opts.has(d)) opts.add(d);
    }
    return { edv, esv, ef, options: shuffle([...opts]) };
  }, [q]);

  const choose = useCallback((k) => {
    if (picked != null || done) return;
    const key = q.type === 'calc' ? calc.ef : correctKey;
    const ok = k === key;
    setPicked(k);
    if (ok) {
      sfx.correct();
      setScore(s => s + 100 + streak * 20);
      setStreak(s => s + 1);
    } else {
      sfx.wrong();
      setStreak(0);
    }
    setLog(l => [...l, { q, ok }]);
  }, [picked, done, q, calc, correctKey, streak]);

  const next = useCallback(() => {
    if (picked == null) return;
    if (i + 1 >= qs.length) sfx.fanfare(); else sfx.next();
    setPicked(null);
    setI(i + 1);
  }, [picked, i, qs.length]);

  const opts = !q ? [] : q.type === 'calc' ? (calc?.options || []) : q.options;
  useEffect(() => {
    const onKey = (e) => {
      if (done) return;
      if (/^[1-4]$/.test(e.key) && picked == null && opts[Number(e.key) - 1] !== undefined) choose(opts[Number(e.key) - 1]);
      else if ((e.key === 'Enter' || e.key === ' ') && picked != null) { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts, picked, choose, next, done]);

  if (done) {
    const right = log.filter(x => x.ok).length;
    const missed = log.filter(x => !x.ok);
    return (
      <section className="pvl-quiz pvl-card pvl-summary">
        <p className="pvl-card-n">Run complete</p>
        <h2 className="pvl-big">{right} / {log.length}</h2>
        <p className="pvl-card-p">{score} points{right === log.length ? ' — a perfect run! 🏆' : ''}</p>
        {missed.length > 0 && (
          <>
            <h3 className="pvl-h3">Worth another look</h3>
            <ul className="pvl-why-list">
              {missed.map((x, k) => <li key={k}>{summaryLabel(x.q)}</li>)}
            </ul>
          </>
        )}
        <div className="pvl-nav">
          <button type="button" className="pvl-btn pvl-btn--ghost" onClick={onReview}>Review pathologies</button>
          <button type="button" className="pvl-btn" onClick={restart}>Play again</button>
        </div>
      </section>
    );
  }

  const isRight = (k) => (q.type === 'calc' ? k === calc.ef : k === correctKey);
  const label = (k) => {
    if (q.type === 'identify') return CASE_BY_ID[k].name;
    if (q.type === 'phase') return PHASES[k].name;
    if (q.type === 'event') return EVENT_OPTIONS[k];
    if (q.type === 'calc') return `${k}%`;
    return null;
  };

  let prompt, chart = null, why = '';
  if (q.type === 'identify') {
    const c = CASE_BY_ID[q.id];
    prompt = 'Which condition produced the solid loop? (dashed = normal)';
    chart = <PVChart loops={[{ pts: buildLoop(c.loop), color: '#ff7a59' }, { pts: NORMAL_PTS, color: 'rgba(255,255,255,0.5)', dashed: true }]} />;
    why = `${c.name}: ${c.signature}`;
  } else if (q.type === 'pick') {
    const c = CASE_BY_ID[q.id];
    prompt = `${VIGNETTES[q.id]} Which solid loop fits? (dashed = normal)`;
    why = `${c.name}: ${c.signature}`;
  } else if (q.type === 'phase') {
    prompt = 'Which phase of the cardiac cycle is the highlighted segment?';
    chart = <PVChart loops={[{ pts: NORMAL_PTS, color: 'rgba(255,255,255,0.55)' }]} highlight={q.phase} />;
    why = {
      ivc: 'The right vertical side: both valves shut, pressure rises at EDV.',
      ej: 'The top: the aortic valve is open and volume falls as blood is ejected.',
      ivr: 'The left vertical side: both valves shut, pressure falls at ESV.',
      fill: 'The bottom: the mitral valve is open and volume rises at low pressure.',
    }[q.phase];
  } else if (q.type === 'event') {
    prompt = 'Which valve event happens at the ringed corner?';
    chart = <PVChart loops={[{ pts: NORMAL_PTS, color: 'rgba(255,255,255,0.55)' }]} markCorner={q.corner} />;
    why = EVENT_WHY[q.corner];
  } else {
    prompt = 'Read the loop. What is the ejection fraction?';
    chart = (
      <PVChart
        loops={[{ pts: buildLoop(loopFor(q.id)), color: '#ff7a59' }]}
        volTicks={[{ v: calc.esv, label: `${calc.esv} mL` }, { v: calc.edv, label: `${calc.edv} mL` }]}
      />
    );
    why = `EDV is the right side (${calc.edv} mL), ESV the left (${calc.esv} mL). SV = ${calc.edv - calc.esv} mL; EF = ${calc.edv - calc.esv} ÷ ${calc.edv} = ${calc.ef}%.`;
  }

  return (
    <section className="pvl-quiz">
      <div className="pvl-qbar">
        <span>Question {i + 1} / {qs.length}</span>
        <span>🔥 {streak}</span>
        <span>⭐ {score}</span>
      </div>
      <div className="pvl-qbar-track"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <h2 className="pvl-qprompt">{prompt}</h2>
      {q.type === 'pick' ? (
        <div className="pvl-pick">
          {q.options.map((k, n) => (
            <button key={k} type="button" disabled={picked != null}
              className={`pvl-pick-opt${picked != null && isRight(k) ? ' is-right' : ''}${picked === k && !isRight(k) ? ' is-wrong' : ''}`}
              onClick={() => choose(k)}>
              <span className="pvl-pick-n">{n + 1}</span>
              <PVChart compact loops={[{ pts: buildLoop(CASE_BY_ID[k].loop), color: '#ff7a59' }, { pts: NORMAL_PTS, color: 'rgba(255,255,255,0.45)', dashed: true }]} />
              {picked != null && <span className="pvl-pick-name">{CASE_BY_ID[k].short}</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="pvl-qgrid">
          <div className="pvl-chart">{chart}</div>
          <div className="pvl-qopts">
            {opts.map((k, n) => (
              <button key={k} type="button" disabled={picked != null}
                className={`pvl-opt pvl-opt--big${picked != null && isRight(k) ? ' is-right' : ''}${picked === k && !isRight(k) ? ' is-wrong' : ''}`}
                onClick={() => choose(k)}>
                <span className="pvl-opt-n">{n + 1}</span> {label(k)}
              </button>
            ))}
          </div>
        </div>
      )}
      {picked != null && (
        <div className={`pvl-feedback${isRight(picked) ? ' is-right' : ''}`}>
          <p><b>{isRight(picked) ? '✓ Correct.' : '✗ Not quite.'}</b> {why}</p>
          <button type="button" className="pvl-btn" onClick={next}>{i + 1 >= qs.length ? 'See results' : 'Next →'}</button>
        </div>
      )}
    </section>
  );
}

function summaryLabel(q) {
  if (q.type === 'identify' || q.type === 'pick') return `${CASE_BY_ID[q.id].name} — ${CASE_BY_ID[q.id].signature}`;
  if (q.type === 'phase') return `Phases: ${PHASES[q.phase].name}`;
  if (q.type === 'event') return `Valve events: ${EVENT_OPTIONS[q.corner]} — ${EVENT_WHY[q.corner]}`;
  return 'Reading EF: EF = (EDV − ESV) ÷ EDV, with EDV the right side and ESV the left side of the loop.';
}

