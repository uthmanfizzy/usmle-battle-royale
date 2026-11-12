import { useCallback, useEffect, useMemo, useState } from 'react';
import { SCENES, ACT_ORDER, ACT_LABEL } from '../muscle/theatreScenes';
import { Body, Hand, Foot, Back } from '../muscle/TheatreFigure';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './InjuryTheatre.css';

/**
 * Injury Theatre — Muscle Mapper's second section. Watch it happen:
 *
 *   1. THE INJURY   the mechanism, played out on the patient
 *   2. THE PRESENTATION  the posture it leaves
 *   3. THE ATTEMPTS the patient tries to move; what is lost fails (✗),
 *                   what is spared works (✓)
 *
 * then name the lesion. Every state on screen is FOLDED from the beats up to
 * the current one (muscle/theatreScenes.js), so jumping to an act, replaying
 * or pausing can never leave the figure in a pose the script does not
 * describe.
 *
 *   Mystery clinic — the cases unnamed, shuffled, scored.
 *   Study a lesion — pick one by name and watch it.
 */

const flatten = (scene) => ACT_ORDER.flatMap(act => scene.acts[act].map(b => ({ ...b, act })));
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const POINTS = 20;
const EARLY_BONUS = 5;

// Short label for an attempt: the caption before its result, up to the "…".
const attemptLabel = (cap) => cap.split('…')[0].split(' (')[0].replace(/^Tries to /, '').replace(/^\w/, c => c.toUpperCase());

export default function InjuryTheatre({ onBack }) {
  const [view, setView] = useState('menu');        // menu | play | summary
  const [mystery, setMystery] = useState(true);
  const [queue, setQueue] = useState([]);
  const [si, setSi] = useState(0);
  const [bi, setBi] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState([]);

  const scene = queue[si] || null;
  const beats = useMemo(() => (scene ? flatten(scene) : []), [scene]);
  const ended = bi >= beats.length - 1;
  const options = useMemo(() => (scene ? shuffle(Object.keys(scene.options)) : []), [scene]);
  const answered = picked != null;

  const begin = (list, isMystery) => {
    sfx.select();
    setMystery(isMystery);
    setQueue(list);
    setSi(0); setBi(0); setPlaying(true); setPicked(null); setScore(0); setLog([]);
    setView('play');
  };

  // The clock: hold each beat for its time, then move on.
  useEffect(() => {
    if (view !== 'play' || !playing || bi >= beats.length - 1) return undefined;
    const t = setTimeout(() => setBi(i => i + 1), (beats[bi]?.ms || 2000) / speed);
    return () => clearTimeout(t);
  }, [view, playing, bi, beats, speed]);

  // A sound for each result.
  useEffect(() => {
    const b = beats[bi];
    if (view !== 'play' || !b) return;
    if (b.result === 'ok') sfx.bubble();
    else if (b.result === 'fail') sfx.cut();
    else if (b.overlay && (bi === 0 || beats[bi - 1].overlay !== b.overlay)) sfx.zap();
  }, [bi, beats, view]);

  // Fold the beats into what is on screen now.
  const state = useMemo(() => {
    let pose = {}, inset = null, insetState = {};
    const results = [];
    for (let i = 0; i <= bi && i < beats.length; i++) {
      const b = beats[i];
      if (b.pose) pose = { ...pose, ...b.pose };
      if ('inset' in b) {
        if (b.inset !== inset) insetState = {};
        inset = b.inset;
      }
      if (b.insetState) insetState = { ...insetState, ...b.insetState };
      if (b.result) results.push({ label: attemptLabel(beats[i - 1]?.cap || b.cap), result: b.result });
    }
    const cur = beats[bi] || {};
    return { pose, inset, insetState, overlay: cur.overlay, struggle: !!cur.struggle, mark: cur.result, cap: cur.cap, act: cur.act, results };
  }, [bi, beats]);

  const jumpAct = (act) => {
    const i = beats.findIndex(b => b.act === act);
    if (i >= 0) { sfx.select(); setBi(i); setPlaying(true); }
  };

  const choose = useCallback((opt) => {
    if (!scene || answered) return;
    const ok = opt === scene.answer;
    setPicked(opt);
    const early = ok && !ended;
    if (mystery) setScore(s => s + (ok ? POINTS + (early ? EARLY_BONUS : 0) : 0));
    if (ok) { sfx.correct(); setTimeout(() => sfx.sparkle(), 220); } else sfx.wrong();
    setLog(l => [...l, { scene, picked: opt, ok, early }]);
  }, [scene, answered, ended, mystery]);

  const next = () => {
    if (si + 1 >= queue.length) {
      if (!mystery) { sfx.next(); setView('menu'); return; }
      sfx.fanfare(); setView('summary'); return;
    }
    sfx.next();
    setSi(i => i + 1); setBi(0); setPlaying(true); setPicked(null);
    document.querySelector('.it')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (view !== 'play') return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (e.key === ' ') { e.preventDefault(); if (ended) { setBi(0); setPlaying(true); } else setPlaying(p => !p); }
      else if (!answered && /^[1-4]$/.test(e.key)) { const o = options[Number(e.key) - 1]; if (o) choose(o); }
      else if (answered && e.key === 'Enter') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Menu ────────────────────────────────────────────────────────────────
  if (view === 'menu') {
    return (
      <div className="it it--menu">
        <div className="it-top">
          <button type="button" className="it-back" onClick={onBack}>← Muscle Mapper</button>
          <SfxToggle />
        </div>
        <header className="it-hero">
          <p className="it-kicker">Muscle Mapper · Injury Theatre</p>
          <h1 className="it-title">Watch it happen</h1>
          <p className="it-lede">See the injury, then the posture it leaves, then the patient trying to move — what the lesion took fails, what it spared works. Then name the lesion.</p>
          <ol className="it-acts">
            {ACT_ORDER.map((a, i) => <li key={a}><b>{i + 1}</b>{ACT_LABEL[a]}</li>)}
          </ol>
          <button type="button" className="it-start" onClick={() => begin(shuffle(SCENES), true)}>🎬 Mystery clinic — {SCENES.length} unnamed patients</button>
        </header>
        <h2 className="it-sub">Or study one lesion</h2>
        <div className="it-scenes">
          {SCENES.map((s, i) => (
            <button key={s.id} type="button" className="it-scene" style={{ '--d': `${0.05 * i}s` }} onClick={() => begin([s], false)}>
              <span className="it-scene-t">{s.title}</span>
              <span className="it-scene-s">{s.setting}</span>
              <span className="it-scene-go">Watch →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (view === 'summary') {
    const right = log.filter(l => l.ok).length;
    return (
      <div className="it it--summary">
        <div className="it-top">
          <button type="button" className="it-back" onClick={onBack}>← Muscle Mapper</button>
          <SfxToggle />
        </div>
        <div className="it-summary">
          <p className="it-kicker">{mystery ? 'Clinic closed' : 'Done'}</p>
          <h1 className="it-title">{mystery ? `${right} of ${log.length} lesions named` : log[0]?.scene.title}</h1>
          {mystery && <p className="it-lede">{score} points · {log.filter(l => l.early).length} named before the end</p>}
          <ul className="it-recap">
            {log.map((l, i) => (
              <li key={i} className={l.ok ? 'is-ok' : 'is-bad'}>
                <b>{l.scene.title}</b>
                <span>{l.scene.teach.sign}</span>
              </li>
            ))}
          </ul>
          <div className="it-summary-btns">
            <button type="button" className="it-start" onClick={() => begin(shuffle(SCENES), true)}>Another clinic</button>
            <button type="button" className="it-ghost" onClick={() => setView('menu')}>All lesions</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Play ────────────────────────────────────────────────────────────────
  const name = !mystery || answered ? scene.title : `Patient ${si + 1}`;
  return (
    <div className="it it--play">
      <div className="it-top">
        <button type="button" className="it-back" onClick={() => setView('menu')}>← All lesions</button>
        <div className="it-hud">
          <SfxToggle />
          {mystery && <span>Patient <b>{si + 1}</b>/{queue.length}</span>}
          {mystery && <span>Score <b>{score}</b></span>}
        </div>
      </div>

      <div className="it-stage-wrap">
        <div className="it-head">
          <h2 className="it-name">{name}</h2>
          <span className="it-setting">{scene.setting}</span>
        </div>
        <ol className="it-stepper">
          {ACT_ORDER.map((a, i) => {
            const now = state.act === a;
            const past = ACT_ORDER.indexOf(state.act) > i;
            return (
              <li key={a}>
                <button type="button" className={now ? 'is-now' : past ? 'is-past' : ''} onClick={() => jumpAct(a)}>
                  <b>{i + 1}</b>{ACT_LABEL[a]}
                </button>
              </li>
            );
          })}
        </ol>

        <div className={`it-stage${state.inset ? ' has-inset' : ''}`}>
          <div className="it-body" key={`${scene.id}`}>
            <Body pose={state.pose} overlay={state.overlay} baby={scene.baby} struggling={state.struggle} mark={state.mark} frame={scene.frame} />
          </div>
          {state.inset && (
            <div className="it-inset" key={state.inset}>
              <p className="it-inset-h">{state.inset === 'hand' ? 'The hand' : state.inset === 'foot' ? 'The foot, from the side' : 'From behind'}</p>
              {state.inset === 'hand' && <Hand state={state.insetState} struggling={state.struggle} />}
              {state.inset === 'foot' && <Foot angle={state.insetState.angle ?? 0} steppage={!!state.insetState.steppage} struggling={state.struggle} />}
              {state.inset === 'back' && <Back wing={!!state.insetState.wing} pushing={!!state.insetState.pushing} />}
            </div>
          )}
        </div>

        <div className={`it-caption${state.mark ? ` is-${state.mark}` : ''}`} key={bi} aria-live="polite">
          {state.mark && <span className="it-caption-mark">{state.mark === 'ok' ? '✓' : '✗'}</span>}
          <p>{state.cap}</p>
        </div>

        <div className="it-controls">
          <button type="button" className="it-ctl" onClick={() => (ended ? (setBi(0), setPlaying(true)) : setPlaying(p => !p))}>
            {ended ? '↺ Replay' : playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <span className="it-scrub"><i style={{ width: `${((bi + 1) / beats.length) * 100}%` }} /></span>
          <div className="it-speed">
            {[1, 1.5, 2].map(s => <button key={s} type="button" className={speed === s ? 'is-on' : ''} onClick={() => setSpeed(s)}>{s}×</button>)}
          </div>
        </div>

        {state.results.length > 0 && (
          <ul className="it-results">
            {state.results.map((r, i) => (
              <li key={i} className={`is-${r.result}`}><span>{r.result === 'ok' ? '✓' : '✗'}</span>{r.label}</li>
            ))}
          </ul>
        )}
      </div>

      <section className="it-q">
        <h3>Which lesion is this?{!ended && !answered && mystery && <small> Answer before the end for +{EARLY_BONUS}</small>}</h3>
        <div className="it-options">
          {options.map((o, i) => {
            const cls = !answered ? '' : o === scene.answer ? ' is-right' : o === picked ? ' is-wrong' : ' is-dim';
            return (
              <button key={o} type="button" className={`it-option${cls}`} disabled={answered} onClick={() => choose(o)}>
                <span className="it-option-key">{i + 1}</span>{o}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`it-reveal${picked === scene.answer ? ' is-right' : ' is-wrong'}`}>
            <p className="it-verdict">{picked === scene.answer ? `Correct — ${scene.title}` : `It was ${scene.answer}`}</p>
            {picked !== scene.answer && <p className="it-whynot"><b>Why not {picked}:</b> {scene.options[picked]}</p>}
            <div className="it-teach">
              <div><span>Roots</span><b>{scene.teach.roots}</b></div>
              <div><span>Lost</span><ul>{scene.teach.lost.map(l => <li key={l}>{l}</li>)}</ul></div>
              <div><span>Sign</span><b>{scene.teach.sign}</b></div>
              <div><span>How it happens</span><b>{scene.teach.key}</b></div>
            </div>
            <ul className="it-others">
              {Object.entries(scene.options).filter(([o]) => o !== scene.answer && o !== picked).map(([o, why]) => <li key={o}><b>{o}</b> — {why}</li>)}
            </ul>
            <button type="button" className="it-start" onClick={next} autoFocus>
              {si + 1 >= queue.length ? (mystery ? 'See results' : 'Back to the lesions') : 'Next patient'} →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
