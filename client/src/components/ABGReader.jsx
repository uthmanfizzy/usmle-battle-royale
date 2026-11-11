import { useCallback, useEffect, useMemo, useState } from 'react';
import { ABG_CASES, LEVEL_LABELS } from '../abg/abgCases';
import { buildSteps, interpretation, NORMALS, toKpa } from '../abg/abgEngine';
import { PhDial, Seesaw, RangeBar, GapBars, DeltaGauge, CountUp } from '../abg/AbgViz';
import { RULES, RuleCard } from '../abg/abgRules';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './ABGReader.css';

/**
 * ABG Reader — read a blood gas the way it is taught: one step at a time.
 *
 * An ABG is not one guess, it is a method: pH, primary process,
 * compensation, anion gap, delta ratio, cause. So each case is played as
 * those steps, in order, each its own question — and each answered step
 * shows its own working, with the patient's real numbers plugged into the
 * rule, and a picture of it (abg/AbgViz). The method is the thing being
 * learned; the diagnosis falls out of it.
 *
 * Two ways to play:
 *   GUIDED    — the rule for each step is shown before you answer.
 *   CHALLENGE — the rule is hidden; revealing it halves that step's points.
 *
 * The rules themselves live in abg/abgRules.jsx, laid out as tables and
 * if → then rows rather than paragraphs.
 *
 * Steps that do not apply are skipped OUT LOUD ("no compensation step: this
 * is a mixed disorder"), because knowing when a step is not used is part of
 * the method too.
 *
 * Nothing is saved to the server — like the other minigames, a run is
 * practice. The summary shows which STEP costs you most, which is the thing
 * worth practising next.
 */

const RUN_LENGTH = 8;
const STEP_POINTS = 20;
const PERFECT_BONUS = 30;

const STEP_INFO = {
  ph: {
    n: 1, title: 'pH', icon: '⚖️',
    question: 'Is the blood acidaemic or alkalaemic?',
    focus: ['pH'],
  },
  primary: {
    n: 2, title: 'Primary process', icon: '🔎',
    question: 'Which process explains that pH?',
    focus: ['pH', 'PaCO2', 'HCO3'],
  },
  comp: {
    n: 3, title: 'Compensation', icon: '🔁',
    question: 'Is the compensation what you would expect?',
    focus: ['PaCO2', 'HCO3'],
  },
  ag: {
    n: 4, title: 'Anion gap', icon: '🧮',
    question: 'Is the anion gap high?',
    focus: ['Na', 'Cl', 'HCO3', 'albumin'],
  },
  delta: {
    n: 5, title: 'Delta ratio', icon: '⚡',
    question: 'Is a second metabolic process hiding?',
    focus: ['HCO3'],
  },
  cause: {
    n: 6, title: 'Cause', icon: '🩺',
    question: 'What is the most likely cause?',
    focus: ['extra'],
  },
};


const SKIP_TEXT = {
  mixed: 'No compensation step: both processes push the pH the same way, so neither is compensating for the other.',
  none: 'No compensation step: there is no primary disorder to compensate for.',
  'normal-ag': 'No delta ratio: the anion gap is normal, so there is no high-gap acidosis to compare against.',
};

const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

export default function ABGReader({ onExit }) {
  const [phase, setPhase] = useState('intro');      // intro | run | summary
  const [level, setLevel] = useState('all');
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mv_abg_mode') === 'challenge' ? 'challenge' : 'guided'; } catch { return 'guided'; }
  });
  const [units, setUnits] = useState(() => {
    try { return localStorage.getItem('mv_abg_units') === 'kpa' ? 'kpa' : 'mmhg'; } catch { return 'mmhg'; }
  });
  const [queue, setQueue] = useState([]);
  const [ci, setCi] = useState(0);                  // case index
  const [si, setSi] = useState(0);                  // step index
  const [picked, setPicked] = useState(null);
  const [hinted, setHinted] = useState(false);
  const [caseLog, setCaseLog] = useState([]);       // per step: { id, correct } for the current case
  const [allLog, setAllLog] = useState([]);         // every case: { caseDef, steps: [...] }
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBest] = useState(0);
  const [caseDone, setCaseDone] = useState(false);

  const caseDef = queue[ci] || null;
  const built = useMemo(() => (caseDef ? buildSteps(caseDef) : null), [caseDef]);
  const step = built?.steps[si] || null;
  const a = built?.analysis;
  const answered = picked != null;
  const correct = answered && step && picked === step.answer;

  // Options shown in a stable random order per step — the right answer is
  // never always first.
  const optionOrder = useMemo(() => (step && !step.skipped ? shuffle(Object.keys(step.options)) : []), [step]);

  const pool = useMemo(() => (level === 'all' ? ABG_CASES : ABG_CASES.filter(c => c.level === level)), [level]);

  const start = () => {
    setQueue(shuffle(pool).slice(0, Math.min(RUN_LENGTH, pool.length)));
    setCi(0); setSi(0); setPicked(null); setHinted(false);
    setCaseLog([]); setAllLog([]); setScore(0); setStreak(0); setBest(0); setCaseDone(false);
    setPhase('run');
  };

  const choose = useCallback((key) => {
    if (!step || step.skipped || picked != null) return;
    const ok = key === step.answer;
    setPicked(key);
    const pts = ok ? (mode === 'challenge' && !hinted ? STEP_POINTS : STEP_POINTS / 2) : 0;
    setScore(s => s + pts);
    if (ok) { sfx.correct(); setTimeout(() => sfx.bubble(), 260); } else sfx.wrong();
    setCaseLog(l => [...l, { id: step.id, correct: ok, picked: key }]);
  }, [step, picked, mode, hinted]);

  const finishCase = useCallback((log) => {
    const perfect = log.every(s => s.correct);
    sfx.complete();
    if (perfect) {
      setTimeout(() => sfx.sparkle(), 120);
      setScore(s => s + PERFECT_BONUS);
      setStreak(st => { const n = st + 1; setBest(b => Math.max(b, n)); return n; });
    } else {
      setStreak(0);
    }
    setAllLog(l => [...l, { caseDef, steps: log }]);
    setCaseDone(true);
  }, [caseDef]);

  const nextStep = useCallback(() => {
    if (!built) return;
    if (si + 1 >= built.steps.length) { finishCase(caseLog); return; }
    sfx.next();
    setSi(i => i + 1);
    setPicked(null);
    setHinted(false);
  }, [built, si, caseLog, finishCase]);

  const nextCase = useCallback(() => {
    if (ci + 1 >= queue.length) { sfx.fanfare(); setPhase('summary'); return; }
    sfx.next();
    setCi(i => i + 1); setSi(0); setPicked(null); setHinted(false); setCaseLog([]); setCaseDone(false);
    document.querySelector('.abgr')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ci, queue.length]);

  // Keys: 1–6 answer, Enter continues.
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (caseDone) { if (e.key === 'Enter') { e.preventDefault(); nextCase(); } return; }
      if (step?.skipped) { if (e.key === 'Enter') { e.preventDefault(); nextStep(); } return; }
      if (!answered && /^[1-6]$/.test(e.key)) {
        const k = optionOrder[Number(e.key) - 1];
        if (k) { e.preventDefault(); choose(k); }
      } else if (answered && e.key === 'Enter') { e.preventDefault(); nextStep(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, caseDone, step, answered, optionOrder, choose, nextStep, nextCase]);

  const saveMode = (m) => { setMode(m); try { localStorage.setItem('mv_abg_mode', m); } catch { /* not remembered */ } };
  const saveUnits = (u) => { setUnits(u); try { localStorage.setItem('mv_abg_units', u); } catch { /* not remembered */ } };

  // ── Intro ───────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="abgr abgr--intro">
        <Bubbles />
        <div className="abgr-top">
          {onExit && <button type="button" className="abgr-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="abgr-intro">
          <span className="abgr-intro-icon" aria-hidden="true">🫁</span>
          <p className="abgr-kicker">Respiratory · Minigame</p>
          <h1 className="abgr-title">ABG Reader</h1>
          <p className="abgr-lede">
            Read a blood gas the way it is taught — one step at a time. Each step shows its working
            with the patient’s own numbers, and a picture of what it means.
          </p>

          <ol className="abgr-method" aria-label="The method">
            {Object.entries(STEP_INFO).map(([id, s], i) => (
              <li key={id} style={{ '--d': `${0.08 * i}s` }}>
                <span className="abgr-method-n">{s.n}</span>
                <span className="abgr-method-icon" aria-hidden="true">{s.icon}</span>
                <span className="abgr-method-t">{s.title}</span>
              </li>
            ))}
          </ol>

          <div className="abgr-choose">
            <div className="abgr-choose-row">
              <span className="abgr-choose-label">Mode</span>
              <div className="abgr-seg" role="group" aria-label="Mode">
                <button type="button" className={mode === 'guided' ? 'is-on' : ''} onClick={() => saveMode('guided')}>
                  Guided <small>rules shown</small>
                </button>
                <button type="button" className={mode === 'challenge' ? 'is-on' : ''} onClick={() => saveMode('challenge')}>
                  Challenge <small>rules hidden</small>
                </button>
              </div>
            </div>
            <div className="abgr-choose-row">
              <span className="abgr-choose-label">Cases</span>
              <div className="abgr-chips" role="group" aria-label="Which cases">
                {Object.entries(LEVEL_LABELS).map(([id, label]) => {
                  const n = id === 'all' ? ABG_CASES.length : ABG_CASES.filter(c => c.level === id).length;
                  return (
                    <button key={id} type="button" className={`abgr-chip${level === id ? ' is-on' : ''}`} aria-pressed={level === id} onClick={() => setLevel(id)}>
                      {label} <span>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="abgr-choose-row">
              <span className="abgr-choose-label">PaCO₂ in</span>
              <div className="abgr-seg abgr-seg--small" role="group" aria-label="Units">
                <button type="button" className={units === 'mmhg' ? 'is-on' : ''} onClick={() => saveUnits('mmhg')}>mmHg</button>
                <button type="button" className={units === 'kpa' ? 'is-on' : ''} onClick={() => saveUnits('kpa')}>kPa</button>
              </div>
            </div>
          </div>

          <p className="abgr-fine">
            {RUN_LENGTH} cases a run · {STEP_POINTS} points a step ({STEP_POINTS / 2} in Guided, or when you reveal a rule) · +{PERFECT_BONUS} for a perfect case.
          </p>
          <button type="button" className="abgr-start" onClick={start}>Read the first gas</button>
        </div>
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const stepStats = {};
    for (const c of allLog) for (const s of c.steps) {
      stepStats[s.id] = stepStats[s.id] || { right: 0, total: 0 };
      stepStats[s.id].total++;
      if (s.correct) stepStats[s.id].right++;
    }
    const perfect = allLog.filter(c => c.steps.every(s => s.correct)).length;
    const weakest = Object.entries(stepStats).filter(([, v]) => v.total).sort((x, y) => x[1].right / x[1].total - y[1].right / y[1].total)[0];
    return (
      <div className="abgr abgr--summary">
        <Bubbles />
        <div className="abgr-top">
          {onExit && <button type="button" className="abgr-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="abgr-summary">
          <p className="abgr-kicker">Run complete</p>
          <h1 className="abgr-title">{perfect === allLog.length ? 'Every gas read.' : perfect >= allLog.length / 2 ? 'Solid reading.' : 'The method is the thing.'}</h1>
          <div className="abgr-stats">
            <div className="abgr-stat"><span className="abgr-stat-n"><CountUp value={score} /></span><span>Points</span></div>
            <div className="abgr-stat"><span className="abgr-stat-n">{perfect}/{allLog.length}</span><span>Perfect cases</span></div>
            <div className="abgr-stat"><span className="abgr-stat-n">{bestStreak}</span><span>Best streak</span></div>
          </div>

          {/* Where the method breaks down — per step, not per case. */}
          <div className="abgr-steps-card">
            <h2>Step by step</h2>
            {Object.entries(STEP_INFO).map(([id, s]) => {
              const st = stepStats[id];
              if (!st) return null;
              const pct = Math.round((st.right / st.total) * 100);
              return (
                <div className="abgr-stepbar" key={id}>
                  <span className="abgr-stepbar-name">{s.icon} {s.title}</span>
                  <span className="abgr-stepbar-track"><i style={{ width: `${pct}%` }} className={pct >= 80 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-low'} /></span>
                  <span className="abgr-stepbar-pct">{st.right}/{st.total}</span>
                </div>
              );
            })}
            {weakest && weakest[1].right < weakest[1].total && (
              <div className="abgr-weak">
                <p>Practise next: <b>{STEP_INFO[weakest[0]].title}</b></p>
                <RuleCard rule={weakest[0] === 'comp' ? RULES.comp['met-acidosis'] : RULES[weakest[0]]} />
              </div>
            )}
          </div>

          <div className="abgr-summary-btns">
            <button type="button" className="abgr-start" onClick={start}>Another run</button>
            <button type="button" className="abgr-ghost" onClick={() => setPhase('intro')}>Change settings</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ─────────────────────────────────────────────────────────────────
  const info = step ? STEP_INFO[step.id] : null;
  const rule = step?.id === 'comp' ? RULES.comp[a?.primary] : RULES[step?.id];
  const showRule = mode === 'guided' || hinted;
  const focus = info?.focus || [];

  return (
    <div className="abgr abgr--run">
      <Bubbles />
      <div className="abgr-top">
        {onExit && <button type="button" className="abgr-back" onClick={onExit}>← Quit</button>}
        <div className="abgr-hud">
          <SfxToggle />
          <span>Case <b>{ci + 1}</b>/{queue.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={streak >= 2 ? 'is-hot' : ''}>🔥 <b>{streak}</b></span>
        </div>
      </div>

      <div className="abgr-layout">
        {/* ── The patient ───────────────────────────────────────────── */}
        <section className="abgr-patient" key={caseDef.id}>
          <p className="abgr-case-kicker">Case {ci + 1}</p>
          <h2 className="abgr-case-title">{caseDef.title}</h2>
          <p className="abgr-vignette">{caseDef.vignette}</p>
          <LabCard caseDef={caseDef} pH={a.pH} units={units} focus={caseDone ? [] : focus} onUnits={saveUnits} />
        </section>

        {/* ── The method, one step at a time ────────────────────────── */}
        <section className="abgr-work">
          <ol className="abgr-stepper" aria-label="Steps">
            {built.steps.map((s, i) => {
              const done = caseLog.find(l => l.id === s.id);
              const cls = s.skipped && i < si ? 'is-skip' : done ? (done.correct ? 'is-right' : 'is-wrong') : i === si && !caseDone ? 'is-now' : s.skipped && caseDone ? 'is-skip' : '';
              return (
                <li key={s.id} className={cls} title={STEP_INFO[s.id].title}>
                  <span className="abgr-stepper-dot">{done ? (done.correct ? '✓' : '✗') : s.skipped && (i < si || caseDone) ? '–' : STEP_INFO[s.id].n}</span>
                  <span className="abgr-stepper-t">{STEP_INFO[s.id].title}</span>
                </li>
              );
            })}
          </ol>

          {!caseDone && step && step.skipped && (
            <div className="abgr-card abgr-skip" key={`skip-${si}`}>
              <h3><span aria-hidden="true">{info.icon}</span> Step {info.n}: {info.title} — not needed</h3>
              <p>{SKIP_TEXT[step.skipped]}</p>
              <button type="button" className="abgr-next" onClick={nextStep}>Continue →</button>
            </div>
          )}

          {!caseDone && step && !step.skipped && (
            <div className="abgr-card abgr-step" key={`step-${ci}-${si}`}>
              <p className="abgr-step-kicker">Step {info.n} of 6 · {info.title}</p>
              <h3 className="abgr-q">{info.question}</h3>

              {rule && (showRule ? (
                <RuleCard rule={rule} />
              ) : !answered && (
                <button type="button" className="abgr-hint" onClick={() => { sfx.select(); setHinted(true); }}>
                  💡 Show the rule <small>(half points for this step)</small>
                </button>
              ))}

              <div className={`abgr-options${optionOrder.length > 4 ? ' is-many' : ''}`}>
                {optionOrder.map((k, i) => {
                  const isAns = k === step.answer;
                  const cls = !answered ? '' : isAns ? ' is-right' : k === picked ? ' is-wrong' : ' is-dim';
                  return (
                    <button key={k} type="button" className={`abgr-option${cls}`} onClick={() => choose(k)} disabled={answered} style={{ '--d': `${0.05 * i}s` }}>
                      <span className="abgr-option-key">{i + 1}</span>
                      <span>{step.options[k]}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className={`abgr-feedback${correct ? ' is-right' : ' is-wrong'}`}>
                  <p className="abgr-verdict">{correct ? 'Correct' : `Not quite — ${step.options[step.answer]}`}</p>
                  <StepExplain step={step} caseDef={caseDef} a={a} picked={picked} units={units} />
                  <button type="button" className="abgr-next" onClick={nextStep} autoFocus>
                    {si + 1 >= built.steps.length ? 'Finish the case' : 'Next step'} →
                  </button>
                </div>
              )}
            </div>
          )}

          {caseDone && (
            <div className="abgr-card abgr-done">
              <p className="abgr-step-kicker">The interpretation</p>
              <p className="abgr-interp">{interpretation(caseDef, a)}</p>
              <ul className="abgr-recap">
                {built.steps.map(s => {
                  const l = caseLog.find(x => x.id === s.id);
                  return (
                    <li key={s.id} className={s.skipped ? 'is-skip' : l?.correct ? 'is-right' : 'is-wrong'}>
                      <span>{STEP_INFO[s.id].icon} {STEP_INFO[s.id].title}</span>
                      <b>{s.skipped ? 'not needed' : s.options[s.answer]}</b>
                    </li>
                  );
                })}
              </ul>
              {caseLog.every(s => s.correct) && <p className="abgr-perfect">Perfect read · +{PERFECT_BONUS}</p>}
              <button type="button" className="abgr-next" onClick={nextCase} autoFocus>
                {ci + 1 >= queue.length ? 'See results' : 'Next gas'} →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── The lab report ────────────────────────────────────────────────────────
function LabCard({ caseDef, pH, units, focus, onUnits }) {
  const v = caseDef.values;
  const press = (mm) => (units === 'kpa' ? toKpa(mm) : mm);
  const pUnit = units === 'kpa' ? 'kPa' : 'mmHg';
  const range = (r) => (units === 'kpa' ? r.map(toKpa) : r);
  const flag = (x, [lo, hi]) => (x < lo ? 'L' : x > hi ? 'H' : '');
  const rows = [
    { key: 'pH', label: 'pH', value: pH, dec: 2, unit: '', ref: '7.35–7.45', flag: flag(pH, NORMALS.pH) },
    { key: 'PaCO2', label: 'PaCO₂', value: press(v.PaCO2), dec: units === 'kpa' ? 1 : 0, unit: pUnit, ref: range(NORMALS.PaCO2).join('–'), flag: flag(v.PaCO2, NORMALS.PaCO2) },
    { key: 'HCO3', label: 'HCO₃⁻', value: v.HCO3, dec: 0, unit: 'mmol/L', ref: '22–26', flag: flag(v.HCO3, NORMALS.HCO3) },
    { key: 'PaO2', label: 'PaO₂', value: press(v.PaO2), dec: units === 'kpa' ? 1 : 0, unit: pUnit, ref: range(NORMALS.PaO2).join('–'), flag: flag(v.PaO2, NORMALS.PaO2) },
    { key: 'Na', label: 'Na⁺', value: v.Na, dec: 0, unit: 'mmol/L', ref: '135–145', flag: flag(v.Na, [135, 145]) },
    { key: 'Cl', label: 'Cl⁻', value: v.Cl, dec: 0, unit: 'mmol/L', ref: '98–106', flag: flag(v.Cl, [98, 106]) },
  ];
  if (v.albumin != null) rows.push({ key: 'albumin', label: 'Albumin', value: v.albumin, dec: 1, unit: 'g/dL', ref: '3.5–5.0', flag: flag(v.albumin, [3.5, 5]) });
  return (
    <div className="abgr-lab">
      <div className="abgr-lab-head">
        <span>Arterial blood gas</span>
        <div className="abgr-seg abgr-seg--tiny" role="group" aria-label="Units">
          <button type="button" className={units === 'mmhg' ? 'is-on' : ''} onClick={() => onUnits('mmhg')}>mmHg</button>
          <button type="button" className={units === 'kpa' ? 'is-on' : ''} onClick={() => onUnits('kpa')}>kPa</button>
        </div>
      </div>
      <table>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className={focus.includes(r.key) ? 'is-focus' : ''} style={{ '--d': `${0.06 * i}s` }}>
              <th>{r.label}</th>
              <td className="abgr-lab-v"><CountUp value={r.value} decimals={r.dec} /></td>
              <td className={`abgr-lab-flag abgr-flag-${r.flag || 'n'}`}>{r.flag}</td>
              <td className="abgr-lab-u">{r.unit}</td>
              <td className="abgr-lab-ref">{r.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {caseDef.extra?.length > 0 && (
        <div className={`abgr-extra${focus.includes('extra') ? ' is-focus' : ''}`}>
          {caseDef.extra.map(x => (
            <span key={x.label} className={`abgr-extra-chip${x.flag ? ' is-' + x.flag : ''}`}>
              {x.label} <b>{x.value}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── The working for each step, with a picture ────────────────────────────
function StepExplain({ step, caseDef, a, picked, units }) {
  const v = caseDef.values;
  const kpa = (mm) => (units === 'kpa' ? ` (${toKpa(mm)} kPa)` : '');

  if (step.id === 'ph') {
    const side = a.pH < 7.40 ? 'below' : a.pH > 7.40 ? 'above' : 'exactly at';
    return (
      <>
        <PhDial pH={a.pH} />
        <p className="abgr-working">
          pH {a.pH.toFixed(2)} is {a.phStatus === 'acidaemia' ? 'below 7.35 — acidaemia' : a.phStatus === 'alkalaemia' ? 'above 7.45 — alkalaemia' : `within 7.35–7.45, ${side} 7.40`}.
          {a.phStatus === 'normal' && a.primary !== 'none' && ' A normal pH does not mean a normal gas — keep going.'}
        </p>
      </>
    );
  }

  if (step.id === 'primary') {
    const lines = [];
    if (v.PaCO2 > 45) lines.push(`PaCO₂ ${v.PaCO2}${kpa(v.PaCO2)} is HIGH — that pushes the pH down (acid).`);
    else if (v.PaCO2 < 35) lines.push(`PaCO₂ ${v.PaCO2}${kpa(v.PaCO2)} is LOW — that pushes the pH up (alkali).`);
    else lines.push(`PaCO₂ ${v.PaCO2}${kpa(v.PaCO2)} is normal.`);
    if (v.HCO3 < 22) lines.push(`HCO₃⁻ ${v.HCO3} is LOW — that pushes the pH down (acid).`);
    else if (v.HCO3 > 26) lines.push(`HCO₃⁻ ${v.HCO3} is HIGH — that pushes the pH up (alkali).`);
    else lines.push(`HCO₃⁻ ${v.HCO3} is normal.`);
    const verdict = {
      'met-acidosis': 'The bicarbonate explains the acid pH; the low PaCO₂ is the lungs compensating.',
      'resp-acidosis': 'The CO₂ explains the acid pH; any rise in bicarbonate is the kidneys compensating.',
      'met-alkalosis': 'The bicarbonate explains the alkaline pH; the higher PaCO₂ is the lungs compensating.',
      'resp-alkalosis': 'The CO₂ explains the alkaline pH; any fall in bicarbonate is compensation — or something more.',
      mixed: 'BOTH values push the pH the same way — two primary processes at once, which is why it has moved so far.',
      none: 'Neither value has moved: no acid–base disorder on these numbers.',
    }[a.primary];
    return (
      <>
        <Seesaw pH={a.pH} paco2={v.PaCO2} hco3={v.HCO3} primary={a.primary} />
        <ul className="abgr-working-list">{lines.map(l => <li key={l}>{l}</li>)}</ul>
        <p className="abgr-working">{verdict}</p>
      </>
    );
  }

  if (step.id === 'comp') {
    const c = a.comp;
    const good = c.verdict === 'appropriate' || c.verdict === 'acute' || c.verdict === 'chronic';
    const meaning = {
      appropriate: 'Within the expected band: the compensation is appropriate and there is no second respiratory process.',
      'resp-acidosis-added': 'The PaCO₂ is HIGHER than compensation alone would give — the lungs are not keeping up: an added respiratory acidosis.',
      'resp-alkalosis-added': 'The PaCO₂ is LOWER than compensation alone would give — something is driving breathing harder: an added respiratory alkalosis.',
      acute: 'Matches an acute change — the kidneys have not had time to respond.',
      chronic: 'Matches a chronic change — days of renal compensation.',
      'acute-on-chronic': 'Between the acute and chronic predictions — a chronically compensated patient who has acutely got worse.',
      'met-acidosis-added': 'Lower than the timing allows — hours are not enough for the kidneys to dump this much bicarbonate. A metabolic acidosis is present too.',
    }[c.verdict];
    if (c.variable === 'PaCO2') {
      return (
        <>
          <RangeBar label="PaCO₂" unit="mmHg" actual={c.actual} lo={c.lo} hi={c.hi} verdictGood={good} />
          <p className="abgr-working"><b>{c.working}</b> Actual {c.actual}{kpa(c.actual)}. {meaning}</p>
        </>
      );
    }
    const markers = [{ label: 'acute', at: c.acute }];
    if (a.primary === 'resp-acidosis') markers.push({ label: 'chronic', at: c.chronic });
    const [lo, hi] = a.primary === 'resp-alkalosis' && c.chronicRange
      ? (caseDef.timing === 'chronic' ? c.chronicRange : [c.acute - 1.5, c.acute + 1.5])
      : (c.verdict === 'chronic' ? [c.chronic - 1.5, c.chronic + 1.5] : c.verdict === 'acute-on-chronic' ? [c.acute, c.chronic] : [c.acute - 1.5, c.acute + 1.5]);
    if (a.primary === 'resp-alkalosis' && c.chronicRange && caseDef.timing !== 'chronic') markers.push({ label: 'chronic', at: c.chronic });
    return (
      <>
        <RangeBar label="HCO₃⁻" unit="mmol/L" actual={c.actual} lo={Math.round(lo * 10) / 10} hi={Math.round(hi * 10) / 10} markers={markers} verdictGood={good} />
        <p className="abgr-working"><b>{c.working}</b> Actual {c.actual}. {meaning}{caseDef.timing && ` The history says ${caseDef.timing}.`}</p>
      </>
    );
  }

  if (step.id === 'ag') {
    const g = a.ag;
    return (
      <>
        <GapBars na={v.Na} cl={v.Cl} hco3={v.HCO3} ag={g.measured} agCorr={g.corrected} albumin={v.albumin} />
        <p className="abgr-working">
          <b>AG = {v.Na} − ({v.Cl} + {v.HCO3}) = {g.measured}.</b>
          {g.albuminCorrected && <> Albumin {v.albumin} g/dL: + 2.5 × (4 − {v.albumin}) = +{(g.corrected - g.measured).toFixed(1)} → <b>corrected AG {g.corrected}.</b></>}
          {' '}{g.high ? `Above 14 — a HIGH anion gap: unmeasured acid anions are present.` : 'Within 12 ± 2 — a normal gap.'}
          {g.albuminCorrected && g.high && g.measured <= 14 && ' Uncorrected, it would have looked normal — that is the trap.'}
        </p>
      </>
    );
  }

  if (step.id === 'delta') {
    const d = a.delta;
    const meaning = {
      pure: 'The bicarbonate fell about as much as the gap rose: one high-gap acidosis explains it all.',
      'hagma+nagma': 'The bicarbonate fell MORE than the gap explains — a normal-gap acidosis is also taking bicarbonate.',
      'hagma+met-alk': 'The bicarbonate fell LESS than the gap rose — something is adding bicarbonate back: a metabolic alkalosis.',
    }[a.deltaClass];
    return (
      <>
        <DeltaGauge dAG={d.dAG} dHCO3={d.dHCO3} ratio={d.ratio} />
        <p className="abgr-working"><b>Δ ratio = ({a.ag.corrected} − 12) ÷ (24 − {v.HCO3}) = {d.dAG} ÷ {d.dHCO3} = {d.ratio}.</b> {meaning}</p>
      </>
    );
  }

  if (step.id === 'cause') {
    const wrong = picked !== step.answer ? caseDef.cause.not?.[picked] : null;
    return (
      <>
        <p className="abgr-working"><b>{caseDef.cause.answer}.</b> {caseDef.cause.why}</p>
        {wrong && <p className="abgr-working abgr-working--not"><b>Not {picked}:</b> {wrong}</p>}
        <ul className="abgr-nots">
          {caseDef.cause.options.filter(o => o !== caseDef.cause.answer && o !== picked).map(o => (
            <li key={o}><b>{o}</b> — {caseDef.cause.not?.[o]}</li>
          ))}
        </ul>
      </>
    );
  }
  return null;
}

// Gas bubbles rising behind everything — it is a blood GAS. Decorative only.
function Bubbles() {
  return (
    <div className="abgr-bubbles" aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}
    </div>
  );
}

