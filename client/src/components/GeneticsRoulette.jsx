import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONDITIONS, PATTERNS, PATTERN_RULES } from '../genetics/geneticsData';
import { buildRound, geneOwner } from '../genetics/geneticsEngine';
import { Wheel, Punnett, Pedigree } from '../genetics/GeneticsViz';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './GeneticsRoulette.css';

/**
 * Genetics Roulette — spin the wheel, call the condition.
 *
 * The wheel lands on a condition and you call it in three steps:
 *   1. the inheritance PATTERN,
 *   2. the GENE or chromosome behind it,
 *   3. the RISK to the next child in a family scenario — counted from a
 *      Punnett square of the parents' genotypes (genetics/geneticsEngine.js)
 *      — or, for chromosomal and imprinting disorders, the MECHANISM.
 *
 *   GUIDED    — the pedigree rules and the empty Punnett square are shown.
 *   CHALLENGE — they are hidden; showing them halves that step's points.
 *
 * Nothing is saved to the server — like the other minigames, a run is
 * practice.
 */

const RUN_LENGTH = 8;
const WHEEL_SIZE = 12;
const STEP_POINTS = 20;
const PERFECT_BONUS = 20;

const FILTERS = {
  all: { label: 'Everything', test: () => true },
  dominant: { label: 'Autosomal dominant', test: c => c.pattern === 'AD' },
  recessive: { label: 'Autosomal recessive', test: c => c.pattern === 'AR' },
  x: { label: 'X-linked', test: c => c.pattern === 'XLR' || c.pattern === 'XLD' },
  other: { label: 'Mito & chromosomal', test: c => ['MITO', 'CHROM', 'IMPRINT'].includes(c.pattern) },
};
const STEP_INFO = {
  pattern: { n: 1, title: 'Pattern', icon: '🧬' },
  gene: { n: 2, title: 'Gene', icon: '🔬' },
  risk: { n: 3, title: 'Risk', icon: '👪' },
};

const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export default function GeneticsRoulette({ onExit }) {
  const [phase, setPhase] = useState('intro');     // intro | run | summary
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mv_gen_mode') === 'challenge' ? 'challenge' : 'guided'; } catch { return 'guided'; }
  });
  const [queue, setQueue] = useState([]);
  const [wheel, setWheel] = useState([]);
  const [ci, setCi] = useState(0);
  const [stage, setStage] = useState('spin');      // spin | spinning | steps | done
  const [spinKey, setSpinKey] = useState(null);
  const [steps, setSteps] = useState([]);
  const [si, setSi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [hinted, setHinted] = useState(false);
  const [roundLog, setRoundLog] = useState([]);
  const [allLog, setAllLog] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const tickTimers = useRef([]);
  const preview = useMemo(() => shuffle(CONDITIONS).slice(0, WHEEL_SIZE), []);

  const pool = useMemo(() => CONDITIONS.filter(FILTERS[filter].test), [filter]);
  const cond = queue[ci] || null;
  const step = steps[si] || null;
  const answered = picked != null;
  const correct = answered && step && picked === step.answer;

  const saveMode = (m) => { setMode(m); try { localStorage.setItem('mv_gen_mode', m); } catch { /* not remembered */ } };

  const start = () => {
    sfx.select();
    const q = shuffle(pool).slice(0, Math.min(RUN_LENGTH, pool.length));
    const extra = shuffle(CONDITIONS.filter(c => !q.includes(c))).slice(0, Math.max(0, WHEEL_SIZE - q.length));
    setQueue(q);
    setWheel(shuffle([...q, ...extra]));
    setCi(0); setStage('spin'); setSpinKey(null); setSteps([]); setSi(0); setPicked(null); setHinted(false);
    setRoundLog([]); setAllLog([]); setScore(0); setStreak(0); setBestStreak(0);
    setPhase('run');
  };

  const spin = useCallback(() => {
    if (stage !== 'spin') return;
    setStage('spinning');
    setSpinKey(k => (k == null ? 1 : k + 1));
    // Clicks that slow down with the wheel: tick k at the time the eased
    // rotation passes k/N of its travel (cubic ease-out, inverted).
    tickTimers.current.forEach(clearTimeout);
    const N = 22;
    tickTimers.current = Array.from({ length: N }, (_, k) => {
      const p = k / N;
      const x = 1 - Math.cbrt(1 - p);
      return setTimeout(() => sfx.select(), x * 3200);
    });
  }, [stage]);
  useEffect(() => () => tickTimers.current.forEach(clearTimeout), []);

  const landed = useCallback(() => {
    sfx.sparkle();
    setSteps(buildRound(queue[ci]));
    setSi(0); setPicked(null); setHinted(false); setRoundLog([]);
    setStage('steps');
  }, [queue, ci]);

  const choose = useCallback((opt) => {
    if (!step || picked != null) return;
    const ok = opt === step.answer;
    setPicked(opt);
    setScore(s => s + (ok ? (mode === 'challenge' && !hinted ? STEP_POINTS : STEP_POINTS / 2) : 0));
    if (ok) { sfx.correct(); setTimeout(() => sfx.bubble(), 240); } else sfx.wrong();
    setRoundLog(l => [...l, { id: step.id, correct: ok }]);
  }, [step, picked, mode, hinted]);

  const nextStep = useCallback(() => {
    if (si + 1 < steps.length) {
      sfx.next(); setSi(i => i + 1); setPicked(null); setHinted(false);
      return;
    }
    const perfect = roundLog.every(l => l.correct);
    sfx.complete();
    if (perfect) {
      setTimeout(() => sfx.sparkle(), 150);
      setScore(s => s + PERFECT_BONUS);
      setStreak(st => { const n = st + 1; setBestStreak(b => Math.max(b, n)); return n; });
    } else setStreak(0);
    setAllLog(l => [...l, { cond, steps: roundLog }]);
    setStage('done');
  }, [si, steps.length, roundLog, cond]);

  const nextCondition = useCallback(() => {
    if (ci + 1 >= queue.length) { sfx.fanfare(); setPhase('summary'); return; }
    sfx.next();
    setCi(i => i + 1); setStage('spin'); setSteps([]); setSi(0); setPicked(null); setHinted(false);
    document.querySelector('.gr')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ci, queue.length]);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (stage === 'spin' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); spin(); return; }
      if (stage === 'done' && e.key === 'Enter') { e.preventDefault(); nextCondition(); return; }
      if (stage !== 'steps') return;
      if (!answered && /^[1-5]$/.test(e.key)) { const o = step?.options[Number(e.key) - 1]; if (o) { e.preventDefault(); choose(o); } }
      else if (answered && e.key === 'Enter') { e.preventDefault(); nextStep(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, stage, answered, step, choose, nextStep, nextCondition, spin]);

  // ── Intro ───────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="gr gr--intro">
        <Helix />
        <div className="gr-top">
          {onExit && <button type="button" className="gr-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="gr-intro">
          <div className="gr-intro-wheel"><IdleWheel segments={preview} /></div>
          <div className="gr-intro-copy">
            <p className="gr-kicker">Genetics · Minigame</p>
            <h1 className="gr-title">Genetics Roulette</h1>
            <p className="gr-lede">Spin the wheel. Wherever it lands, call it in three steps — and see the Punnett square work the answer out.</p>
            <ol className="gr-steps-intro">
              {Object.values(STEP_INFO).map(s => (
                <li key={s.n}><span>{s.icon}</span><b>{s.n}. {s.title}</b>
                  <small>{s.n === 1 ? 'AD, AR, X-linked, mitochondrial…' : s.n === 2 ? 'The gene or chromosome behind it' : 'The chance for the next child — or the mechanism'}</small>
                </li>
              ))}
            </ol>
            <div className="gr-choose">
              <span className="gr-choose-label">Mode</span>
              <div className="gr-seg" role="group" aria-label="Mode">
                <button type="button" className={mode === 'guided' ? 'is-on' : ''} aria-pressed={mode === 'guided'} onClick={() => saveMode('guided')}>Guided <small>rules shown</small></button>
                <button type="button" className={mode === 'challenge' ? 'is-on' : ''} aria-pressed={mode === 'challenge'} onClick={() => saveMode('challenge')}>Challenge <small>rules hidden</small></button>
              </div>
            </div>
            <div className="gr-choose">
              <span className="gr-choose-label">Wheel</span>
              <div className="gr-chips" role="group" aria-label="Which conditions">
                {Object.entries(FILTERS).map(([id, f]) => (
                  <button key={id} type="button" className={`gr-chip${filter === id ? ' is-on' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                    {f.label} <span>{CONDITIONS.filter(f.test).length}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="gr-start" onClick={start}>Step up to the wheel</button>
            <p className="gr-fine">{Math.min(RUN_LENGTH, pool.length)} spins a run · {STEP_POINTS} points a step ({STEP_POINTS / 2} in Guided or with the rules shown) · +{PERFECT_BONUS} for a perfect spin</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const stats = {};
    for (const r of allLog) for (const s of r.steps) { stats[s.id] = stats[s.id] || { right: 0, total: 0 }; stats[s.id].total++; if (s.correct) stats[s.id].right++; }
    const perfect = allLog.filter(r => r.steps.every(s => s.correct)).length;
    const missed = allLog.filter(r => !r.steps.every(s => s.correct));
    return (
      <div className="gr gr--summary">
        <Helix />
        <div className="gr-top">
          {onExit && <button type="button" className="gr-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="gr-summary">
          <p className="gr-kicker">The wheel stops</p>
          <h1 className="gr-title">{perfect === allLog.length ? 'House beaten.' : perfect >= allLog.length / 2 ? 'Lucky? No — learned.' : 'Spin again.'}</h1>
          <div className="gr-stats">
            <div><b>{score}</b><span>Points</span></div>
            <div><b>{perfect}/{allLog.length}</b><span>Perfect spins</span></div>
            <div><b>{bestStreak}</b><span>Best streak</span></div>
          </div>
          <div className="gr-card gr-bystep">
            {Object.entries(STEP_INFO).map(([id, s]) => {
              const st = stats[id]; if (!st) return null;
              const p = Math.round((st.right / st.total) * 100);
              return (
                <div className="gr-bar" key={id}>
                  <span>{s.icon} {s.title}</span>
                  <span className="gr-bar-track"><i style={{ width: `${p}%` }} className={p >= 80 ? 'is-good' : p >= 50 ? 'is-mid' : 'is-low'} /></span>
                  <span>{st.right}/{st.total}</span>
                </div>
              );
            })}
          </div>
          {missed.length > 0 && (
            <div className="gr-card gr-missed">
              <h2>Worth another look</h2>
              {missed.map(r => (
                <p key={r.cond.id}><b>{r.cond.name}</b> — {PATTERNS[r.cond.pattern].label} · {r.cond.gene}</p>
              ))}
            </div>
          )}
          <div className="gr-summary-btns">
            <button type="button" className="gr-start" onClick={start}>Spin again</button>
            <button type="button" className="gr-ghost" onClick={() => setPhase('intro')}>Change the wheel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ─────────────────────────────────────────────────────────────────
  const target = cond ? wheel.indexOf(cond) : null;
  const showRule = mode === 'guided' || hinted;
  return (
    <div className="gr gr--run">
      <Helix />
      <div className="gr-top">
        {onExit && <button type="button" className="gr-back" onClick={onExit}>← Quit</button>}
        <div className="gr-hud">
          <SfxToggle />
          <span>Spin <b>{ci + 1}</b>/{queue.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={streak >= 2 ? 'is-hot' : ''}>🔥 <b>{streak}</b></span>
        </div>
      </div>

      <div className={`gr-layout${stage === 'spin' || stage === 'spinning' ? ' is-spinning' : ''}`}>
        <section className="gr-wheel-col">
          <Wheel segments={wheel} target={target} spinKey={spinKey} onDone={landed} />
          {stage === 'spin' && (
            <button type="button" className="gr-spin" onClick={spin} autoFocus>Spin the wheel</button>
          )}
          {stage === 'spinning' && <p className="gr-spin-note">Round and round it goes…</p>}
        </section>

        {(stage === 'steps' || stage === 'done') && cond && (
          <section className="gr-play">
            <div className="gr-card gr-landed" key={cond.id}>
              <p className="gr-kicker">The wheel lands on</p>
              <h2 className="gr-cond">{cond.name}</h2>
              <p className="gr-clue">{cond.clue}</p>
            </div>

            <ol className="gr-stepper" aria-label="Steps">
              {steps.map((s, i) => {
                const l = roundLog[i];
                const cls = l ? (l.correct ? 'is-right' : 'is-wrong') : i === si && stage === 'steps' ? 'is-now' : '';
                return (
                  <li key={s.id} className={cls}>
                    <span className="gr-stepper-dot">{l ? (l.correct ? '✓' : '✗') : STEP_INFO[s.id].n}</span>
                    <span>{s.id === 'risk' && s.kind === 'mech' ? 'Mechanism' : STEP_INFO[s.id].title}</span>
                  </li>
                );
              })}
            </ol>

            {stage === 'steps' && step && (
              <div className="gr-card gr-step" key={`${cond.id}-${si}`}>
                <h3 className="gr-q">{step.prompt}</h3>

                {/* What the step needs to be worked out from. */}
                {step.id === 'risk' && step.pedigree && <Pedigree m={step.pedigree.m} f={step.pedigree.f} />}

                {showRule ? (
                  <StepHelp step={step} cond={cond} reveal={answered} />
                ) : !answered && (
                  <button type="button" className="gr-hint" onClick={() => { sfx.select(); setHinted(true); }}>
                    💡 {step.kind === 'punnett' ? 'Show the Punnett square' : 'Show the rules'} <small>(half points)</small>
                  </button>
                )}
                {!showRule && answered && <StepHelp step={step} cond={cond} reveal />}

                <div className="gr-options">
                  {step.options.map((o, i) => {
                    const isAns = o === step.answer;
                    const cls = !answered ? '' : isAns ? ' is-right' : o === picked ? ' is-wrong' : ' is-dim';
                    return (
                      <button key={o} type="button" className={`gr-option${cls}`} onClick={() => choose(o)} disabled={answered} style={{ '--d': `${0.05 * i}s` }}>
                        <span className="gr-option-key">{i + 1}</span><span>{o}</span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className={`gr-feedback${correct ? ' is-right' : ' is-wrong'}`}>
                    <p className="gr-verdict">{correct ? 'Correct' : `Not quite — ${step.answer}`}</p>
                    <Explain step={step} cond={cond} picked={picked} />
                    <button type="button" className="gr-next" onClick={nextStep} autoFocus>
                      {si + 1 >= steps.length ? 'Finish this spin' : 'Next step'} →
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage === 'done' && (
              <div className="gr-card gr-done">
                <p className="gr-kicker">{cond.name}</p>
                <ul className="gr-recap">
                  <li><span>🧬 Pattern</span><b>{PATTERNS[cond.pattern].label}</b></li>
                  <li><span>🔬 Gene</span><b>{cond.gene}</b></li>
                  <li><span>💡 Remember</span><b>{cond.fact}</b></li>
                </ul>
                {roundLog.every(l => l.correct) && <p className="gr-perfect">Perfect spin · +{PERFECT_BONUS}</p>}
                <button type="button" className="gr-next" onClick={nextCondition} autoFocus>
                  {ci + 1 >= queue.length ? 'See results' : 'Spin again'} →
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// What helps with a step — the rules, or the square — before answering.
function StepHelp({ step, cond, reveal }) {
  if (step.id === 'pattern') return <RuleTable title="Reading a pedigree" rows={[['Autosomal dominant', 'Every generation, either sex, 50% from one affected parent'], ['Autosomal recessive', 'Skips generations, carrier parents, 25%'], ['X-linked recessive', 'Mostly males, via carrier mothers, never father → son'], ['X-linked dominant', 'Affected father → ALL daughters, no sons'], ['Mitochondrial', 'Only from the mother, to all her children']]} />;
  if (step.id === 'gene') return <RuleTable title="Think about the clue" rows={[['Classic picture', cond.clue]]} />;
  if (step.kind === 'punnett') return <><RuleTable title={PATTERNS[step.pattern].label} rows={PATTERN_RULES[step.pattern]} /><Punnett step={step} reveal={reveal} /></>;
  if (step.kind === 'mito') return <RuleTable title="Mitochondrial inheritance" rows={PATTERN_RULES.MITO} />;
  if (step.kind === 'mech') return <RuleTable title={PATTERNS[cond.pattern].label} rows={PATTERN_RULES[cond.pattern]} />;
  return null;
}

function RuleTable({ title, rows }) {
  return (
    <div className="gr-rule">
      <span className="gr-rule-tag">Rule</span>
      <div>
        <p className="gr-rule-lead">{title}</p>
        <ul>{rows.map(([k, v]) => <li key={k}><b>{k}</b><span>{v}</span></li>)}</ul>
      </div>
    </div>
  );
}

function Explain({ step, cond, picked }) {
  const wrong = picked !== step.answer;
  if (step.id === 'pattern') {
    return (
      <>
        <p className="gr-working"><b>{cond.name}</b> is {PATTERNS[cond.pattern].label.toLowerCase()}. {cond.fact}</p>
        {PATTERN_RULES[cond.pattern] && <ul className="gr-mini">{PATTERN_RULES[cond.pattern].map(([k, v]) => <li key={k}><b>{k}</b> {v}</li>)}</ul>}
      </>
    );
  }
  if (step.id === 'gene') {
    const owner = wrong ? geneOwner(picked) : null;
    return (
      <>
        <p className="gr-working"><b>{cond.gene}</b> — {cond.fact}</p>
        {owner && <p className="gr-working gr-working--not"><b>{picked}</b> is the gene for {owner.name}.</p>}
      </>
    );
  }
  if (step.kind === 'mech') {
    return (
      <>
        <p className="gr-working">{step.working}</p>
        {wrong && step.whyNot?.[picked] && <p className="gr-working gr-working--not"><b>Not {picked.toLowerCase()}:</b> {step.whyNot[picked]}</p>}
      </>
    );
  }
  return <p className="gr-working"><b>{step.answer}.</b> {step.working}</p>;
}

// A slow decorative spin for the intro.
function IdleWheel({ segments }) {
  return <div className="gr-idle"><Wheel segments={segments} target={null} spinKey={null} onDone={() => {}} /></div>;
}

// A DNA double helix drifting behind everything — decorative only.
function Helix() {
  return (
    <div className="gr-helix" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => <span key={i} style={{ '--i': i }}><i /><i /></span>)}
    </div>
  );
}
