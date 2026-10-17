import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  NODES, EDGES, NODE_BY_ID, REGIONS, START_POINTS,
  nodeAnswers, enzymeAnswers, diseaseAnswers, matches, stepsFrom,
} from '../data/metabolicMap';
import './PathwayNavigator.css';

/**
 * Metabolic Pathway Navigator — walking First Aid's summary map on foot.
 *
 * You stand on a metabolite. Every reaction leading out of it is a door; you
 * pick one and name what is on the other side before you may step through.
 * Naming is the whole exercise, so the map withholds exactly what you are
 * being asked for: in METABOLITE mode an unvisited box shows nothing until
 * you have said what it is, and in ENZYME mode the boxes are labelled and
 * the arrows are blank.
 *
 * A wrong answer costs the streak and nothing else — you stay where you are
 * and may try again, because being sent back to the start for misspelling
 * "argininosuccinate" teaches nothing. Two wrong tries and the answer is
 * offered, for free, with no points: a student stuck on a step should be
 * told, not stranded.
 *
 * Where an enzyme has a disease behind it, naming the step earns a second
 * question. That pairing — this enzyme, that deficiency — is the thing the
 * exam actually asks, and it is asked here at the moment the enzyme is in
 * mind rather than on a list at the end.
 *
 * Nothing is saved to the server. A run is a revision session, not a score
 * to defend, and the best streak is worth more said out loud at the end than
 * kept in a table.
 */

const MODES = {
  metabolite: {
    id: 'metabolite',
    label: 'Metabolites',
    blurb: 'Name the molecule in each box.',
  },
  enzyme: {
    id: 'enzyme',
    label: 'Enzymes',
    blurb: 'Name the enzyme for each step.',
  },
};

const COFACTOR_NOTE = {
  biotin: 'Requires biotin',
  tpp: 'Requires thiamine (TPP)',
  b12: 'Requires B₁₂',
};

const POINTS_STEP    = 10;
const POINTS_DISEASE = 15;
// Each unbroken step adds a little, so a run of eight is worth more than
// eight separate ones. Capped, or a long streak stops being a bonus and
// starts being the only thing that matters.
const STREAK_BONUS_MAX = 10;

const canvasW = 1000;
const canvasH = 1060;

export default function PathwayNavigator({ onExit }) {
  const [phase, setPhase]   = useState('intro');       // 'intro' | 'run' | 'summary'
  const [mode, setMode]     = useState('metabolite');
  const [startId, setStartId] = useState(START_POINTS[0].id);

  const [current, setCurrent] = useState(null);
  const [named, setNamed]     = useState(() => new Set());   // node ids already named
  const [solved, setSolved]   = useState(() => new Set());   // edge keys already named
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [bestStreak, setBest] = useState(0);
  const [steps, setSteps]     = useState(0);
  // Where the walk has been. Cholesterol and urea are the ends of their
  // pathways — nothing leads out of either — so without a way back a run
  // that reached one would be over whether the student wanted it or not.
  // Retracing is free and scores nothing: it is not a step forward.
  const [trail, setTrail]     = useState([]);

  // The step being attempted: { edge, to, stage: 'step' | 'disease', tries }
  const [ask, setAsk]       = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);  // { kind: 'ok'|'no'|'told', text }

  const inputRef = useRef(null);
  useEffect(() => { if (ask) inputRef.current?.focus(); }, [ask]);

  // ── The map's own pan and zoom ───────────────────────────────────────
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const dragRef = useRef(null);
  const frameRef = useRef(null);

  const begin = () => {
    setCurrent(startId);
    setNamed(new Set([startId]));      // you are told where you are standing
    setSolved(new Set());
    setScore(0); setStreak(0); setBest(0); setSteps(0);
    setAsk(null); setAnswer(''); setFeedback(null);
    setTrail([]);
    setPhase('run');
    // Put the starting metabolite in the middle of the frame.
    centreOn(startId, 1);
  };

  const centreOn = useCallback((nodeId, k) => {
    const n = NODE_BY_ID[nodeId];
    const box = frameRef.current?.getBoundingClientRect();
    if (!n || !box) return;
    setView(v => {
      const scale = k ?? v.k;
      return { k: scale, x: box.width / 2 - n.x * scale, y: box.height / 2 - n.y * scale };
    });
  }, []);

  useEffect(() => {
    if (phase === 'run' && current) centreOn(current);
    // Only when the foot moves — not on every score change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase]);

  const outgoing = useMemo(() => (current ? stepsFrom(current) : []), [current]);
  const reachable = useMemo(() => new Set(outgoing.map(s => s.to)), [outgoing]);

  // In enzyme mode a step with no single named enzyme has nothing to ask, so
  // it is not a door. Said plainly on the map rather than silently ignored.
  const askable = useMemo(() => new Set(
    outgoing.filter(s => mode === 'metabolite' || s.edge.enzyme).map(s => s.to),
  ), [outgoing, mode]);

  function openStep(to) {
    const step = outgoing.find(s => s.to === to);
    if (!step) return;
    if (mode === 'enzyme' && !step.edge.enzyme) return;
    setAsk({ ...step, stage: 'step', tries: 0 });
    setAnswer('');
    setFeedback(null);
  }

  const accepted = (a) => {
    if (!a) return new Set();
    if (a.stage === 'disease') return diseaseAnswers(a.edge);
    return mode === 'metabolite' ? nodeAnswers(NODE_BY_ID[a.to]) : enzymeAnswers(a.edge);
  };

  const wanted = (a) => {
    if (!a) return '';
    if (a.stage === 'disease') return a.edge.disease;
    return mode === 'metabolite' ? NODE_BY_ID[a.to].label : a.edge.enzyme;
  };

  function award(base) {
    const bonus = Math.min(streak, STREAK_BONUS_MAX);
    setScore(s => s + base + bonus);
    setStreak(s => {
      const next = s + 1;
      setBest(b => Math.max(b, next));
      return next;
    });
  }

  // Moving on: the step is banked, and the disease question (if there is
  // one) is asked before the foot actually lands.
  function finishStep(a, { scored }) {
    setSolved(prev => new Set(prev).add(a.edge.key));
    setNamed(prev => new Set(prev).add(a.to));
    const hasDisease = !!a.edge.disease && scored;
    if (hasDisease) {
      setAsk({ ...a, stage: 'disease', tries: 0 });
      setAnswer('');
      setFeedback({ kind: 'ok', text: `${wanted(a)} — now the disease.` });
      return;
    }
    land(a.to);
  }

  function land(to) {
    setTrail(t => [...t, current]);
    setCurrent(to);
    setSteps(n => n + 1);
    setAsk(null);
    setAnswer('');
  }

  // Back the way you came. No points either way — it undoes a step rather
  // than taking one.
  function stepBack() {
    setTrail(t => {
      if (t.length === 0) return t;
      setCurrent(t[t.length - 1]);
      setAsk(null);
      setAnswer('');
      setFeedback(null);
      return t.slice(0, -1);
    });
  }

  function submit(e) {
    e?.preventDefault();
    if (!ask || !answer.trim()) return;
    const ok = matches(answer, accepted(ask));
    if (ok) {
      if (ask.stage === 'disease') {
        award(POINTS_DISEASE);
        setFeedback({ kind: 'ok', text: `Yes — ${ask.edge.disease}.` });
        setTimeout(() => land(ask.to), 650);
        return;
      }
      award(POINTS_STEP);
      finishStep(ask, { scored: true });
      return;
    }
    // Wrong: the streak goes, the foot stays.
    setStreak(0);
    const tries = ask.tries + 1;
    setAsk(a => ({ ...a, tries }));
    setAnswer('');
    setFeedback(tries >= 2
      ? { kind: 'told', text: `It is ${wanted(ask)}.` }
      : { kind: 'no', text: 'Not that one — try again.' });
  }

  // After being told, step through for nothing rather than being stuck.
  function takeTold() {
    if (!ask) return;
    if (ask.stage === 'disease') { land(ask.to); return; }
    finishStep(ask, { scored: false });
  }

  // ── Pan / zoom plumbing ──────────────────────────────────────────────
  const onWheel = (e) => {
    const box = frameRef.current.getBoundingClientRect();
    const px = e.clientX - box.left, py = e.clientY - box.top;
    setView(v => {
      const k = Math.min(2.2, Math.max(0.35, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      // Keep whatever is under the pointer under the pointer.
      return { k, x: px - (px - v.x) * (k / v.k), y: py - (py - v.y) * (k / v.k) };
    });
  };
  const onPointerDown = (e) => {
    if (e.target.closest('.pn-node')) return;      // a node press is a choice, not a drag
    dragRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setView(v => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
  };
  const endDrag = () => { dragRef.current = null; };
  const zoomBy = (f) => setView(v => ({ ...v, k: Math.min(2.2, Math.max(0.35, v.k * f)) }));

  // ── Intro ────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="pn pn--intro">
        <div className="pn-intro-card">
          <h1 className="pn-title">Metabolic Pathway Navigator</h1>
          <p className="pn-sub">Navigate biochemistry&apos;s central pathways, one metabolite at a time.</p>

          <ol className="pn-rules">
            <li>You&apos;ll be placed at a metabolite on the map. Click a box connected to it, then name what is there.</li>
            <li>Correct steps score points and build your streak. A wrong guess resets the streak — but you stay put.</li>
            <li>Where an enzyme causes a disease, you&apos;ll be asked for the disease too.</li>
            <li>Zoom or drag to explore the map.</li>
          </ol>

          <span className="pn-choose">What are you naming?</span>
          <div className="pn-mode-row">
            {Object.values(MODES).map(m => (
              <button
                key={m.id}
                type="button"
                className={`pn-pick${mode === m.id ? ' is-on' : ''}`}
                onClick={() => setMode(m.id)}
              >
                <span className="pn-pick-name">{m.label}</span>
                <span className="pn-pick-blurb">{m.blurb}</span>
              </button>
            ))}
          </div>

          <span className="pn-choose">Choose your starting point</span>
          <div className="pn-start-grid">
            {START_POINTS.map(s => (
              <button
                key={s.id}
                type="button"
                className={`pn-pick${startId === s.id ? ' is-on' : ''}`}
                onClick={() => setStartId(s.id)}
              >
                <span className="pn-pick-name">{s.title}</span>
                <span className="pn-pick-blurb">{s.blurb}</span>
              </button>
            ))}
          </div>

          <button type="button" className="pn-begin" onClick={begin}>Begin run →</button>
          {onExit && (
            <button type="button" className="pn-quit-link" onClick={onExit}>Back</button>
          )}
        </div>
      </div>
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────
  if (phase === 'summary') {
    return (
      <div className="pn pn--intro">
        <div className="pn-intro-card">
          <h1 className="pn-title">Run over</h1>
          <div className="pn-summary">
            <div><strong>{score}</strong><span>points</span></div>
            <div><strong>{steps}</strong><span>steps walked</span></div>
            <div><strong>{bestStreak}</strong><span>best streak</span></div>
            <div><strong>{named.size}</strong><span>of {NODES.length} metabolites named</span></div>
          </div>
          <button type="button" className="pn-begin" onClick={() => setPhase('intro')}>Run again</button>
          {onExit && <button type="button" className="pn-quit-link" onClick={onExit}>Back to the Journey</button>}
        </div>
      </div>
    );
  }

  // ── The run ──────────────────────────────────────────────────────────
  const here = NODE_BY_ID[current];
  const region = REGIONS[here?.region];

  return (
    <div className="pn">
      <header className="pn-bar">
        <button type="button" className="pn-bar-btn" onClick={() => setPhase('summary')}>
          Finish
        </button>
        <button
          type="button"
          className="pn-bar-btn"
          onClick={stepBack}
          disabled={trail.length === 0}
          title="Back to the metabolite you came from"
        >
          ← Back
        </button>
        <div className="pn-where">
          <span className="pn-where-label">You are at</span>
          <span className="pn-where-name">{here?.label}</span>
          {region && <span className="pn-where-region">{region.label}</span>}
        </div>
        <div className="pn-stats">
          <span><strong>{score}</strong> pts</span>
          <span className={streak >= 3 ? 'is-hot' : ''}><strong>{streak}</strong> streak</span>
          <span className="pn-stats-mode">{MODES[mode].label}</span>
        </div>
      </header>

      <div
        className="pn-frame"
        ref={frameRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg
          className="pn-canvas"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          width={canvasW * view.k}
          height={canvasH * view.k}
          style={{ transform: `translate(${view.x}px, ${view.y}px)` }}
        >
          {EDGES.map(e => {
            const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
            if (!a || !b) return null;
            const live = (e.from === current || (e.both && e.to === current)
              || e.to === current || (e.both && e.from === current));
            return (
              <line
                key={e.key}
                className={`pn-edge${live ? ' is-live' : ''}${solved.has(e.key) ? ' is-solved' : ''}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              />
            );
          })}
          {NODES.map(n => {
            const isHere   = n.id === current;
            const isOpen   = askable.has(n.id);
            const isNear   = reachable.has(n.id);
            // Metabolite mode hides what it is asking for. Enzyme mode needs
            // the names visible — the arrows are the blanks there.
            const show = mode === 'enzyme' || named.has(n.id);
            return (
              <g
                key={n.id}
                className={[
                  'pn-node',
                  isHere ? 'is-here' : '',
                  isOpen ? 'is-open' : '',
                  isNear && !isOpen ? 'is-shut' : '',
                  show ? '' : 'is-hidden',
                ].join(' ')}
                transform={`translate(${n.x}, ${n.y})`}
                onClick={() => isOpen && openStep(n.id)}
                role={isOpen ? 'button' : undefined}
                tabIndex={isOpen ? 0 : undefined}
                onKeyDown={e => { if (isOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openStep(n.id); } }}
              >
                <rect className="pn-node-box" x={-62} y={-16} width={124} height={32} rx={9} />
                <text
                  className={`pn-node-text${n.label.length > 15 ? ' is-long' : ''}${n.label.length > 21 ? ' is-very-long' : ''}`}
                  y={4}
                >
                  {show ? n.label : '?'}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="pn-zoom">
          <button type="button" onClick={() => zoomBy(1.2)} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => centreOn(current, 1)} aria-label="Centre on where you are">⌖</button>
        </div>

        {!ask && (
          <div className="pn-hint">
            {askable.size > 0
              ? `Click one of the ${askable.size} highlighted box${askable.size === 1 ? '' : 'es'} to step there.`
              : trail.length > 0
                ? 'This is the end of the pathway — step back the way you came, or finish the run.'
                : 'Nothing leads out of here in this mode. Finish the run and start somewhere else.'}
          </div>
        )}
      </div>

      {ask && (
        <div className="pn-ask" onClick={e => e.stopPropagation()}>
          <div className="pn-ask-head">
            <span className="pn-ask-from">{NODE_BY_ID[ask.edge.from === current ? ask.edge.from : current]?.label}</span>
            <span className="pn-ask-arrow" aria-hidden="true">→</span>
            <span className="pn-ask-to">
              {mode === 'enzyme' ? NODE_BY_ID[ask.to]?.label : '?'}
            </span>
          </div>

          <p className="pn-ask-q">
            {ask.stage === 'disease'
              ? `Which disease follows a deficiency of ${ask.edge.enzyme}?`
              : mode === 'metabolite'
                ? 'What is this metabolite?'
                : 'Which enzyme catalyses this step?'}
          </p>

          {ask.stage !== 'disease' && (ask.edge.cofactor || ask.edge.irreversible) && (
            <p className="pn-ask-note">
              {ask.edge.cofactor ? COFACTOR_NOTE[ask.edge.cofactor] : ''}
              {ask.edge.cofactor && ask.edge.irreversible ? ' · ' : ''}
              {ask.edge.irreversible ? 'Irreversible, regulated step' : ''}
            </p>
          )}

          <form onSubmit={submit} className="pn-ask-form">
            <input
              ref={inputRef}
              className="pn-ask-input"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer"
              autoComplete="off"
              spellCheck="false"
            />
            <button type="submit" className="pn-ask-go" disabled={!answer.trim()}>Answer</button>
          </form>

          {feedback && (
            <p className={`pn-ask-feedback pn-ask-feedback--${feedback.kind}`}>{feedback.text}</p>
          )}

          <div className="pn-ask-foot">
            {feedback?.kind === 'told' ? (
              <button type="button" className="pn-ask-secondary" onClick={takeTold}>
                Step there anyway
              </button>
            ) : (
              <button type="button" className="pn-ask-secondary" onClick={() => { setAsk(null); setFeedback(null); }}>
                Pick another box
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

