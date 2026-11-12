import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  screeningQuestion, cutoffQuestion, riskQuestion, normalQuestion, ratesQuestion,
  ciQuestion, powerQuestion, correlationQuestion, shuffle,
} from '../biostats/biostatsCore';
import { designQuestion, biasQuestion, errorConceptQuestion, testQuestion, shapeQuestion, measureQuestion } from '../biostats/biostatsBank';
import { RULES, RuleCard } from '../biostats/biostatsRules';
import {
  TwoByTwo, CutoffCurves, RiskArrays, NormalCurve, CiPlot, Scatter, ErrorGrid,
  SkewCurve, Target, RatesBar, DesignFlow, TableBuilder,
} from '../biostats/BiostatsViz';
import DrawPad from '../biostats/DrawPad';
import { CountUp } from '../abg/AbgViz';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './BiostatsLab.css';

/**
 * Biostats Lab — USMLE Step 1 biostatistics as eight small games.
 *
 * Each STATION is a sub-minigame on one high-yield topic: the 2×2 table, the
 * cutoff and prevalence, risk and NNT, study designs, biases, errors and
 * power, choosing the test, and the normal curve with incidence and
 * prevalence. A Mixed run draws from all of them.
 *
 * The numerical questions are generated fresh every time (biostats/
 * biostatsCore.js) and every answer is computed from the numbers shown, so
 * a station never runs out and never disagrees with itself. The concept
 * questions are vignettes (biostats/biostatsBank.js) whose wrong options
 * each explain what THEY mean.
 *
 *   GUIDED    — the rule card is shown with the question (half points).
 *   CHALLENGE — the rule is hidden; revealing it halves the points.
 *
 * Nothing is saved to the server; the best score per station is remembered
 * on this device only.
 */

const RUN_LENGTH = 8;
const POINTS = 20;
const PERFECT_BONUS = 40;
const BUILD_BONUS = 5;      // for building the 2×2 yourself, correctly

export const STATIONS = [
  { id: 'screening', name: 'Screening Room', icon: '🧪', accent: '46, 196, 160', blurb: 'The 2×2 table — given, or built yourself from the stem as on exam day: sensitivity, specificity, PPV, NPV, LRs.', gens: [screeningQuestion] },
  { id: 'cutoff', name: 'Cutoff Slider', icon: '🎚️', accent: '120, 140, 255', blurb: 'Slide the cutoff, change the prevalence — what rises and what falls?', gens: [cutoffQuestion] },
  { id: 'risk', name: 'Risk Clinic', icon: '💊', accent: '255, 140, 90', blurb: 'RR, ARR, RRR, NNT, NNH, odds ratios and vaccine efficacy from real trials.', gens: [riskQuestion] },
  { id: 'design', name: 'Study Design Detective', icon: '🔍', accent: '236, 190, 70', blurb: 'Case–control or cohort? Cross-sectional or ecological? And the four trial phases.', gens: [designQuestion] },
  { id: 'bias', name: 'Bias Hunter', icon: '🎯', accent: '240, 96, 130', blurb: 'Berkson, recall, lead-time, Hawthorne, confounding — name the flaw.', gens: [biasQuestion] },
  { id: 'error', name: 'Errors & Power', icon: '⚖️', accent: '170, 120, 255', blurb: 'Type I and II errors, power, p-values and confidence intervals.', gens: [errorConceptQuestion, ciQuestion, powerQuestion] },
  { id: 'tests', name: 'Test Picker', icon: '🧮', accent: '80, 190, 240', blurb: 't-test, ANOVA, chi-square, Fisher or correlation — pick the right tool.', gens: [testQuestion, testQuestion, correlationQuestion] },
  { id: 'curves', name: 'Curves & Rates', icon: '🔔', accent: '150, 210, 90', blurb: 'The normal curve, skew, precision vs accuracy, incidence vs prevalence.', gens: [normalQuestion, ratesQuestion, shapeQuestion, measureQuestion] },
];
const MIXED = { id: 'mixed', name: 'Mixed Round', icon: '🎲', accent: '255, 205, 90', blurb: 'One from every station — the closest thing to the real exam.' };

const KIND_LABEL = {
  screening: '2×2 table', cutoff: 'Cutoff & prevalence', risk: 'Risk & NNT', design: 'Study design', phase: 'Trial phases',
  bias: 'Bias', error: 'Type I / II error', pvalue: 'p-values & power', ci: 'Confidence intervals', power: 'Power',
  test: 'Choosing a test', corr: 'Correlation', normal: 'Normal curve', rates: 'Incidence & prevalence', shape: 'Skew', measure: 'Precision & accuracy',
};

const loadBest = () => { try { return JSON.parse(localStorage.getItem('mv_biostats_best') || '{}') || {}; } catch { return {}; } };

function buildRun(stationId) {
  const gens = stationId === 'mixed'
    ? shuffle(STATIONS.map(s => s.gens[Math.floor(Math.random() * s.gens.length)]))
    : STATIONS.find(s => s.id === stationId).gens;
  const out = [];
  const seen = new Set();
  let tries = 0;
  while (out.length < RUN_LENGTH && tries < 200) {
    tries++;
    const gen = stationId === 'mixed' ? gens[out.length % gens.length] : gens[(out.length + tries) % gens.length];
    const q = gen();
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

export default function BiostatsLab({ onExit }) {
  const [phase, setPhase] = useState('hub');           // hub | run | summary
  const [station, setStation] = useState(null);
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mv_biostats_mode') === 'challenge' ? 'challenge' : 'guided'; } catch { return 'guided'; }
  });
  const [queue, setQueue] = useState([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [hinted, setHinted] = useState(false);
  // 2×2 questions: the table given, or read the stem and build it yourself —
  // which is what the exam actually asks of you. Remembered per device.
  // given | build (type the cells in, checked) | draw (pen on paper, compared after)
  const [tableMode, setTableMode] = useState(() => {
    try { const v = localStorage.getItem('mv_biostats_build'); return v === 'build' || v === 'draw' ? v : 'given'; } catch { return 'given'; }
  });
  const buildMode = tableMode === 'build';
  const drawMode = tableMode === 'draw';
  const [tableState, setTableState] = useState('building');   // building | built | shown
  const [log, setLog] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [best, setBest] = useState(loadBest);

  const q = queue[qi] || null;
  const answered = picked != null;
  const correct = answered && q && picked === q.answer;
  const meta = station === 'mixed' ? MIXED : STATIONS.find(s => s.id === station);

  const saveTableMode = (m) => { setTableMode(m); setTableState('building'); try { localStorage.setItem('mv_biostats_build', m); } catch { /* not remembered */ } };
  const saveMode = (m) => { setMode(m); try { localStorage.setItem('mv_biostats_mode', m); } catch { /* not remembered */ } };

  const start = (id) => {
    sfx.select();
    setStation(id);
    setQueue(buildRun(id));
    setQi(0); setPicked(null); setHinted(false); setTableState('building'); setLog([]); setScore(0); setStreak(0); setBestStreak(0);
    setPhase('run');
    document.querySelector('.bsl')?.scrollTo({ top: 0 });
  };

  const choose = useCallback((key) => {
    if (!q || picked != null) return;
    const building = buildMode && q.kind === 'screening';
    if (building && tableState === 'building') return;   // build the table first
    const ok = key === q.answer;
    setPicked(key);
    const full = mode === 'challenge' && !hinted && !(building && tableState === 'shown');
    const pts = ok ? (full ? POINTS : POINTS / 2) + (building && tableState === 'built' ? BUILD_BONUS : 0) : 0;
    setScore(s => s + pts);
    if (ok) {
      sfx.correct(); setTimeout(() => sfx.bubble(), 240);
      setStreak(st => { const n = st + 1; setBestStreak(b => Math.max(b, n)); return n; });
    } else {
      sfx.wrong(); setStreak(0);
    }
    setLog(l => [...l, { kind: q.kind, correct: ok }]);
  }, [q, picked, mode, hinted, buildMode, tableState]);

  const next = useCallback(() => {
    if (qi + 1 >= queue.length) {
      const perfect = log.length === queue.length && log.every(l => l.correct);
      const final = score + (perfect ? PERFECT_BONUS : 0);
      if (perfect) { setScore(final); setTimeout(() => sfx.sparkle(), 200); }
      sfx.fanfare();
      setBest(b => {
        if ((b[station] || 0) >= final) return b;
        const nb = { ...b, [station]: final };
        try { localStorage.setItem('mv_biostats_best', JSON.stringify(nb)); } catch { /* not remembered */ }
        return nb;
      });
      setPhase('summary');
      return;
    }
    sfx.next();
    setQi(i => i + 1); setPicked(null); setHinted(false); setTableState('building');
    document.querySelector('.bsl')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [qi, queue.length, log, score, station]);

  // Keys: 1–4 answer, Enter continues.
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (!answered && /^[1-5]$/.test(e.key)) {
        const o = q?.options[Number(e.key) - 1];
        if (o) { e.preventDefault(); choose(o.key); }
      } else if (answered && e.key === 'Enter') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answered, q, choose, next]);

  // ── Hub ─────────────────────────────────────────────────────────────────
  if (phase === 'hub') {
    return (
      <div className="bsl bsl--hub">
        <Backdrop />
        <div className="bsl-top">
          {onExit && <button type="button" className="bsl-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <header className="bsl-hero">
          <span className="bsl-hero-icon" aria-hidden="true">📊</span>
          <p className="bsl-kicker">Biostatistics · Minigame</p>
          <h1 className="bsl-title">Biostats Lab</h1>
          <p className="bsl-lede">
            Eight stations, one for each high-yield corner of Step 1 biostatistics. The numbers are fresh every run and
            every answer is worked out in front of you.
          </p>
          <div className="bsl-seg" role="group" aria-label="Mode">
            <button type="button" className={mode === 'guided' ? 'is-on' : ''} aria-pressed={mode === 'guided'} onClick={() => saveMode('guided')}>
              Guided <small>rules shown</small>
            </button>
            <button type="button" className={mode === 'challenge' ? 'is-on' : ''} aria-pressed={mode === 'challenge'} onClick={() => saveMode('challenge')}>
              Challenge <small>rules hidden</small>
            </button>
          </div>
        </header>

        <div className="bsl-stations">
          {[...STATIONS, MIXED].map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`bsl-station${s.id === 'mixed' ? ' is-mixed' : ''}`}
              style={{ '--accent': s.accent, '--d': `${0.05 * i}s` }}
              onClick={() => start(s.id)}
            >
              <span className="bsl-station-icon" aria-hidden="true">{s.icon}</span>
              <span className="bsl-station-n">{s.id === 'mixed' ? 'All stations' : `Station ${i + 1}`}</span>
              <span className="bsl-station-name">{s.name}</span>
              <span className="bsl-station-blurb">{s.blurb}</span>
              <span className="bsl-station-foot">
                {best[s.id] ? <span className="bsl-best">Best {best[s.id]}</span> : <span className="bsl-best is-none">Not played yet</span>}
                <span className="bsl-go" aria-hidden="true">Play →</span>
              </span>
            </button>
          ))}
        </div>
        <p className="bsl-fine">
          {RUN_LENGTH} questions a run · {POINTS} points each in Challenge, {POINTS / 2} in Guided or with the rule revealed · +{PERFECT_BONUS} for a perfect run. Keys 1–4 answer, Enter continues.
        </p>
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const right = log.filter(l => l.correct).length;
    const byKind = {};
    for (const l of log) { byKind[l.kind] = byKind[l.kind] || { right: 0, total: 0 }; byKind[l.kind].total++; if (l.correct) byKind[l.kind].right++; }
    const weakest = Object.entries(byKind).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)[0];
    return (
      <div className="bsl bsl--summary" style={{ '--accent': meta.accent }}>
        <Backdrop />
        <div className="bsl-top">
          <button type="button" className="bsl-back" onClick={() => setPhase('hub')}>← The Lab</button>
          <SfxToggle />
        </div>
        <div className="bsl-summary">
          <p className="bsl-kicker">{meta.icon} {meta.name} · complete</p>
          <h1 className="bsl-title">{right === log.length ? 'Flawless.' : right >= log.length * 0.75 ? 'Strong numbers.' : right >= log.length / 2 ? 'Getting there.' : 'Worth another run.'}</h1>
          <div className="bsl-stats">
            <div className="bsl-stat"><span className="bsl-stat-n"><CountUp value={score} /></span><span>Points</span></div>
            <div className="bsl-stat"><span className="bsl-stat-n">{right}/{log.length}</span><span>Correct</span></div>
            <div className="bsl-stat"><span className="bsl-stat-n">{bestStreak}</span><span>Best streak</span></div>
          </div>
          {right === log.length && <p className="bsl-perfect">Perfect run · +{PERFECT_BONUS}</p>}
          <div className="bsl-card bsl-breakdown">
            <h2>By topic</h2>
            {Object.entries(byKind).map(([k, v]) => {
              const p = Math.round((v.right / v.total) * 100);
              return (
                <div className="bsl-bar" key={k}>
                  <span className="bsl-bar-name">{KIND_LABEL[k] || k}</span>
                  <span className="bsl-bar-track"><i style={{ width: `${p}%` }} className={p >= 80 ? 'is-good' : p >= 50 ? 'is-mid' : 'is-low'} /></span>
                  <span className="bsl-bar-n">{v.right}/{v.total}</span>
                </div>
              );
            })}
            {weakest && weakest[1].right < weakest[1].total && (
              <div className="bsl-weak">
                <p>Revise next: <b>{KIND_LABEL[weakest[0]]}</b></p>
                <RuleCard rule={RULES[weakest[0]]} />
              </div>
            )}
          </div>
          <div className="bsl-summary-btns">
            <button type="button" className="bsl-start" onClick={() => start(station)}>Run it again</button>
            <button type="button" className="bsl-ghost" onClick={() => setPhase('hub')}>Choose another station</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ─────────────────────────────────────────────────────────────────
  const rule = RULES[q.kind];
  const showRule = mode === 'guided' || hinted;
  const pickedOpt = q.options.find(o => o.key === picked);
  const answerOpt = q.options.find(o => o.key === q.answer);

  return (
    <div className="bsl bsl--run" style={{ '--accent': meta.accent }}>
      <Backdrop />
      <div className="bsl-top">
        <button type="button" className="bsl-back" onClick={() => setPhase('hub')}>← The Lab</button>
        <div className="bsl-hud">
          <SfxToggle />
          <span>{meta.icon} <b>{meta.name}</b></span>
          <span>Q <b>{qi + 1}</b>/{queue.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={streak >= 2 ? 'is-hot' : ''}>🔥 <b>{streak}</b></span>
        </div>
      </div>

      <div className="bsl-progress" aria-hidden="true">
        {queue.map((_, i) => {
          const l = log[i];
          return <i key={i} className={l ? (l.correct ? 'is-right' : 'is-wrong') : i === qi ? 'is-now' : ''} />;
        })}
      </div>

      <div className="bsl-layout">
        <section className="bsl-card bsl-q" key={`q-${qi}`}>
          <p className="bsl-q-kicker">{KIND_LABEL[q.kind]}</p>
          {q.kind === 'screening' && (
            <div className="bsl-tablemode" role="group" aria-label="How the 2×2 table is given">
              <button type="button" className={tableMode === 'given' ? 'is-on' : ''} aria-pressed={tableMode === 'given'} disabled={answered} onClick={() => saveTableMode('given')}>Table given</button>
              <button type="button" className={buildMode ? 'is-on' : ''} aria-pressed={buildMode} disabled={answered} onClick={() => saveTableMode('build')}>⌨️ Type it in</button>
              <button type="button" className={drawMode ? 'is-on' : ''} aria-pressed={drawMode} disabled={answered} onClick={() => saveTableMode('draw')}>🖊️ Draw it</button>
            </div>
          )}
          {q.kind === 'screening' && (buildMode || drawMode) && <p className="bsl-stem">{q.vignette}</p>}
          <h2 className="bsl-prompt">{q.prompt}</h2>
          {q.kind === 'screening' && drawMode ? (
            <>
              {/* The pad stays mounted after answering so the drawing is kept,
                  read-only, beside the real table to compare against. */}
              {answered && <p className="bsl-compare-h">Your table</p>}
              <DrawPad key={`pad-${qi}`} readOnly={answered} />
              {answered && (
                <>
                  <p className="bsl-compare-h">The real table — does yours match?</p>
                  <Picture q={q} reveal instant />
                  <div className="bsl-tb-how">
                    <p>How each cell comes from the question:</p>
                    <ul>{['TP', 'FP', 'FN', 'TN'].map(k => <li key={k}><b>{k}</b> {q.steps[k]}</li>)}</ul>
                  </div>
                </>
              )}
            </>
          ) : q.kind === 'screening' && buildMode && !answered
            ? <TableBuilder key={`tb-${qi}`} t={q.table} steps={q.steps} onDone={(r) => { setTableState(r); if (r === 'built') sfx.sparkle(); }} />
            : <Picture q={q} reveal={answered} instant={buildMode} />}
        </section>

        <section className="bsl-card bsl-a" key={`a-${qi}`}>
          {rule && (showRule ? <RuleCard rule={rule} /> : !answered && (
            <button type="button" className="bsl-hint" onClick={() => { sfx.select(); setHinted(true); }}>
              💡 Show the rule <small>(half points)</small>
            </button>
          ))}

          {q.kind === 'screening' && buildMode && tableState === 'building' && !answered && (
            <p className="bsl-locked">🔒 Build the table first — then the answers unlock. (+{BUILD_BONUS} for building it right.)</p>
          )}
          <div className="bsl-options">
            {q.options.map((o, i) => {
              const isAns = o.key === q.answer;
              const cls = !answered ? '' : isAns ? ' is-right' : o.key === picked ? ' is-wrong' : ' is-dim';
              return (
                <button key={o.key} type="button" className={`bsl-option${cls}`} onClick={() => choose(o.key)} disabled={answered || (q.kind === 'screening' && buildMode && tableState === 'building')} style={{ '--d': `${0.05 * i}s` }}>
                  <span className="bsl-option-key">{i + 1}</span>
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className={`bsl-feedback${correct ? ' is-right' : ' is-wrong'}`}>
              <p className="bsl-verdict">{correct ? 'Correct' : `Not quite — ${answerOpt.label}`}</p>
              {!correct && pickedOpt?.why && <p className="bsl-whynot"><b>Why not “{pickedOpt.label}”:</b> {pickedOpt.why}</p>}
              {q.formula && <p className="bsl-working">{q.formula}</p>}
              <p className="bsl-why">{q.why}</p>
              <button type="button" className="bsl-next" onClick={next} autoFocus>
                {qi + 1 >= queue.length ? 'See results' : 'Next question'} →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Picture({ q, reveal, instant }) {
  switch (q.kind) {
    case 'screening': return <TwoByTwo t={q.table} measure={q.measure} reveal={reveal} instant={instant} />;
    case 'cutoff': return <CutoffCurves q={q} reveal={reveal} />;
    case 'risk': return <RiskArrays q={q} reveal={reveal} />;
    case 'normal': return <NormalCurve q={q} reveal={reveal} />;
    case 'ci': return <CiPlot q={q} reveal={reveal} />;
    case 'corr': return <Scatter q={q} reveal={reveal} />;
    case 'error': return <ErrorGrid answer={q.answer} reveal={reveal} />;
    case 'power': return <ErrorGrid answer="power" reveal={reveal} />;
    case 'shape': return <SkewCurve skew={q.skew} reveal={reveal} />;
    case 'measure': return q.target && reveal ? <Target target={q.target} /> : null;
    case 'rates': return <RatesBar q={q} />;
    case 'design': return reveal ? <DesignFlow answer={q.answer} /> : null;
    default: return null;
  }
}

// Faint grid of plotted points and a bell curve drifting behind it all — decorative.
function Backdrop() {
  const dots = useMemo(() => Array.from({ length: 22 }, (_, i) => i), []);
  return (
    <div className="bsl-bg" aria-hidden="true">
      <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="bsl-bg-curve">
        <path d="M0,560 C300,560 420,90 600,90 C780,90 900,560 1200,560" />
      </svg>
      {dots.map(i => <span key={i} style={{ '--i': i }} />)}
    </div>
  );
}
