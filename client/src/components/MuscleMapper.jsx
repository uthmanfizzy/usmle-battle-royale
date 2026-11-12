import { useCallback, useEffect, useMemo, useState } from 'react';
import { NERVES, MUSCLES, SIGNS, rootsLabel } from '../muscle/muscleData';
import { SETS, optionLabel } from '../muscle/muscleCases';
import { PlexusMap, MusclePanel, RootLadder, SignCard } from '../muscle/MuscleViz';
import { sheetFor, CheatCard } from '../muscle/muscleSheets';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import InjuryTheatre from './InjuryTheatre';
import './MuscleMapper.css';

/**
 * Muscle Mapper — a movement is lost or a nerve is cut: name what is behind
 * it, all the way down the chain.
 *
 *     injury → nerve → roots → muscle → sign
 *
 * Each link is its own question (muscle/muscleCases.js), and the plexus map
 * tells the story as you go: answer the nerve and its pathway lights from
 * the roots, signals flowing; a beat later the lesion CUTS it and everything
 * downstream goes dark — or amber, where other roots still reach it. That is
 * the picture a brachial plexus question is really about.
 *
 * Three sets: nerve injuries (the classic Step 1 lesions, Erb and Klumpke,
 * disc herniations), muscles & actions (which nerve, what it does), and
 * reflexes / myotomes / dermatomes. Guided mode shows a cheat sheet for each
 * question — the high-yield table that answers that TYPE of question;
 * Challenge hides it (revealing it halves the points).
 *
 * The intro is also an atlas: click any nerve on either plexus to see its
 * roots, muscles, injury sites and signs. Nothing is saved to the server.
 */

const RUN_LENGTH = 10;
const Q_POINTS = 20;
const PERFECT_BONUS = 30;

const KIND_TITLE = {
  nerve: 'Which nerve?',
  roots: 'Which roots?',
  muscle: 'Which muscle?',
  sign: 'Which sign?',
  level: 'Which level?',
  root: 'Which root?',
  action: 'What does it do?',
};
const KIND_LABEL = { nerve: 'Nerve', roots: 'Roots', muscle: 'Muscle', sign: 'Sign', level: 'Level', root: 'Root', action: 'Action' };

const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// Which nerve a case is "about", for the map and the muscle panel.
function focusNerveOf(c) {
  if (c.focusNerve) return c.focusNerve;
  if (c.lesion?.muscle) return MUSCLES[c.lesion.muscle].nerve;
  if (c.lesion && NERVES[c.lesion.node]) return c.lesion.node;
  return null;
}

export default function MuscleMapper({ onExit }) {
  const [phase, setPhase] = useState('intro');
  const [setKey, setSetKey] = useState('injuries');
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mv_mm_mode') === 'challenge' ? 'challenge' : 'guided'; } catch { return 'guided'; }
  });
  const [queue, setQueue] = useState([]);
  const [ci, setCi] = useState(0);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [hinted, setHinted] = useState(false);
  const [caseLog, setCaseLog] = useState([]);
  const [allLog, setAllLog] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [caseDone, setCaseDone] = useState(false);
  const [cutOn, setCutOn] = useState(false);

  // Atlas (intro)
  const [atlasRegion, setAtlasRegion] = useState('upper');
  const [atlasNerve, setAtlasNerve] = useState('radial');

  const c = queue[ci] || null;
  const q = c?.chain[qi] || null;
  const answered = picked != null;
  const correct = answered && picked === q.answer;
  const optionOrder = useMemo(() => (q ? shuffle(q.options) : []), [q]);

  // How far the story has got, from what has been answered so far.
  const firstDone = caseLog.length > 0 || caseDone;
  const focusNerve = c ? focusNerveOf(c) : null;
  const rootsShown = caseLog.some(l => l.kind === 'roots') || caseDone;
  const muscleAsked = c?.chain.find(x => x.kind === 'muscle' || x.kind === 'action');
  const muscleShown = caseLog.some(l => l.kind === 'muscle' || l.kind === 'action') || caseDone;
  const signQ = c?.chain.find(x => x.kind === 'sign');
  const signShown = signQ && (caseLog.some(l => l.kind === 'sign') || caseDone);
  const isLesion = c && c.lesion && c.kind !== 'drill';

  // The cut lands a beat after the pathway lights — light, then snip.
  useEffect(() => {
    if (!isLesion || !firstDone) { setCutOn(false); return undefined; }
    const t = setTimeout(() => { setCutOn(true); sfx.cut(); }, 900);
    return () => clearTimeout(t);
  }, [isLesion, firstDone, ci]);

  const start = () => {
    setQueue(SETS[setKey].build().slice(0, RUN_LENGTH));
    setCi(0); setQi(0); setPicked(null); setHinted(false); setCaseLog([]); setAllLog([]);
    setScore(0); setStreak(0); setBest(0); setCaseDone(false); setCutOn(false);
    setPhase('run');
    sfx.next();
  };

  const choose = useCallback((key) => {
    if (!q || picked != null) return;
    const ok = key === q.answer;
    setPicked(key);
    setScore(s => s + (ok ? (mode === 'challenge' && !hinted ? Q_POINTS : Q_POINTS / 2) : 0));
    setCaseLog(l => [...l, { kind: q.kind, correct: ok, picked: key }]);
    if (ok) sfx.correct(); else sfx.wrong();
    // The first link lights the pathway.
    if (qi === 0 && (q.kind === 'nerve' || q.kind === 'level' || q.kind === 'muscle')) setTimeout(() => sfx.zap(), 280);
  }, [q, picked, mode, hinted, qi]);

  const finishCase = useCallback((log) => {
    const perfect = log.every(l => l.correct);
    sfx.complete();
    if (perfect) {
      setTimeout(() => sfx.sparkle(), 120);
      setScore(s => s + PERFECT_BONUS);
      setStreak(st => { const n = st + 1; setBest(b => Math.max(b, n)); return n; });
    } else setStreak(0);
    setAllLog(l => [...l, { caseDef: c, log }]);
    setCaseDone(true);
  }, [c]);

  const nextQ = useCallback(() => {
    if (!c) return;
    if (qi + 1 >= c.chain.length) { finishCase(caseLog); return; }
    sfx.next();
    setQi(i => i + 1); setPicked(null); setHinted(false);
  }, [c, qi, caseLog, finishCase]);

  const nextCase = useCallback(() => {
    if (ci + 1 >= queue.length) { sfx.fanfare(); setPhase('summary'); return; }
    sfx.next();
    setCi(i => i + 1); setQi(0); setPicked(null); setHinted(false); setCaseLog([]); setCaseDone(false); setCutOn(false);
    document.querySelector('.mm')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ci, queue.length]);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (caseDone) { if (e.key === 'Enter') { e.preventDefault(); nextCase(); } return; }
      if (!answered && /^[1-4]$/.test(e.key)) { const k = optionOrder[Number(e.key) - 1]; if (k) { e.preventDefault(); choose(k); } }
      else if (answered && e.key === 'Enter') { e.preventDefault(); nextQ(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, caseDone, answered, optionOrder, choose, nextQ, nextCase]);

  const saveMode = (m) => { setMode(m); try { localStorage.setItem('mv_mm_mode', m); } catch { /* not remembered */ } };

  // ── Injury Theatre: the second section — watch the lesion happen ───────
  if (phase === 'theatre') return <InjuryTheatre onBack={() => setPhase('intro')} />;

  // ── Intro, with the atlas ──────────────────────────────────────────────
  if (phase === 'intro') {
    const n = NERVES[atlasNerve];
    return (
      <div className="mm mm--intro">
        <Fibres />
        <div className="mm-top">
          {onExit && <button type="button" className="mm-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="mm-intro">
          <span className="mm-intro-icon" aria-hidden="true">🦴</span>
          <p className="mm-kicker">Musculoskeletal · Minigame</p>
          <h1 className="mm-title">Muscle Mapper</h1>
          <p className="mm-lede">
            A movement is lost or a nerve is cut. Walk the chain — <b>injury → nerve → roots → muscle → sign</b> —
            and watch the plexus light up, then go dark where the lesion falls.
          </p>

          {/* The second way to play: watch the lesion happen on a patient. */}
          <button type="button" className="mm-theatre-card" onClick={() => { sfx.select(); setPhase('theatre'); }}>
            <span className="mm-theatre-icon" aria-hidden="true">🎬</span>
            <span className="mm-theatre-copy">
              <b>Injury Theatre — watch it happen</b>
              <small>See the injury (Erb at delivery, Klumpke grabbing a branch…), the posture it leaves, then the patient trying to move — and name the lesion.</small>
            </span>
            <span className="mm-theatre-go" aria-hidden="true">Watch →</span>
          </button>

          {/* The atlas: study before you play. */}
          <section className="mm-atlas">
            <div className="mm-atlas-head">
              <h2>Atlas</h2>
              <div className="mm-seg" role="group" aria-label="Plexus">
                <button type="button" className={atlasRegion === 'upper' ? 'is-on' : ''} onClick={() => { setAtlasRegion('upper'); setAtlasNerve('radial'); }}>Brachial plexus</button>
                <button type="button" className={atlasRegion === 'lower' ? 'is-on' : ''} onClick={() => { setAtlasRegion('lower'); setAtlasNerve('commonPeroneal'); }}>Lumbosacral plexus</button>
              </div>
              <span className="mm-atlas-hint">Tap a nerve</span>
            </div>
            <div className="mm-atlas-grid">
              <PlexusMap region={atlasRegion} focus={atlasNerve} showRoots onPick={(id) => { setAtlasNerve(id); sfx.zap(); }} picked={atlasNerve} />
              {n && (
                <div className="mm-atlas-card" key={atlasNerve}>
                  <h3>{n.name}</h3>
                  <p className="mm-atlas-roots">{rootsLabel(n.roots)}</p>
                  <dl>
                    <dt>Muscles</dt><dd>{n.muscles.map(m => MUSCLES[m].name).join(', ')}</dd>
                    <dt>Sensation</dt><dd>{n.sensory}</dd>
                    {n.injury.length > 0 && (<><dt>Injured by</dt><dd>{n.injury.join('; ')}</dd></>)}
                    <dt>Deficit</dt><dd>{n.deficit}</dd>
                    {n.signs?.length > 0 && (<><dt>Signs</dt><dd>{n.signs.map(s => `${SIGNS[s].icon} ${SIGNS[s].name}`).join(' · ')}</dd></>)}
                  </dl>
                  {n.mnemonic && <p className="mm-atlas-mn">💡 {n.mnemonic}</p>}
                </div>
              )}
            </div>
          </section>

          <div className="mm-choose">
            <div className="mm-choose-row">
              <span className="mm-choose-label">Mode</span>
              <div className="mm-seg" role="group" aria-label="Mode">
                <button type="button" className={mode === 'guided' ? 'is-on' : ''} onClick={() => saveMode('guided')}>Guided <small>guides shown</small></button>
                <button type="button" className={mode === 'challenge' ? 'is-on' : ''} onClick={() => saveMode('challenge')}>Challenge <small>guides hidden</small></button>
              </div>
            </div>
            <div className="mm-choose-row">
              <span className="mm-choose-label">Practise</span>
              <div className="mm-chips" role="group" aria-label="Which set">
                {Object.entries(SETS).map(([k, v]) => (
                  <button key={k} type="button" className={`mm-chip${setKey === k ? ' is-on' : ''}`} aria-pressed={setKey === k} onClick={() => setSetKey(k)}>{v.label}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="mm-fine">{RUN_LENGTH} cases a run · {Q_POINTS} points a link ({Q_POINTS / 2} with the guide) · +{PERFECT_BONUS} for a perfect chain.</p>
          <button type="button" className="mm-start" onClick={start}>Start mapping</button>
        </div>
      </div>
    );
  }

  // ── Summary ────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const stats = {};
    for (const x of allLog) for (const l of x.log) { stats[l.kind] = stats[l.kind] || { r: 0, t: 0 }; stats[l.kind].t++; if (l.correct) stats[l.kind].r++; }
    const perfect = allLog.filter(x => x.log.every(l => l.correct)).length;
    const missed = allLog.filter(x => x.log.some(l => !l.correct));
    return (
      <div className="mm mm--summary">
        <Fibres />
        <div className="mm-top">
          {onExit && <button type="button" className="mm-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <div className="mm-summary">
          <p className="mm-kicker">Run complete</p>
          <h1 className="mm-title">{perfect === allLog.length ? 'Every chain mapped.' : perfect >= allLog.length / 2 ? 'Good mapping.' : 'Keep tracing.'}</h1>
          <div className="mm-stats">
            <div><b>{score}</b><span>Points</span></div>
            <div><b>{perfect}/{allLog.length}</b><span>Perfect chains</span></div>
            <div><b>{best}</b><span>Best streak</span></div>
          </div>
          <div className="mm-kinds">
            <h2>By link</h2>
            {Object.entries(stats).map(([k, v]) => {
              const pct = Math.round((v.r / v.t) * 100);
              return (
                <div className="mm-kind" key={k}>
                  <span>{KIND_LABEL[k]}</span>
                  <span className="mm-kind-track"><i style={{ width: `${pct}%` }} className={pct >= 80 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-low'} /></span>
                  <span>{v.r}/{v.t}</span>
                </div>
              );
            })}
          </div>
          {missed.length > 0 && (
            <div className="mm-missed">
              <h2>To revisit</h2>
              <ul>
                {missed.map((x, i) => {
                  const fn = focusNerveOf(x.caseDef);
                  return (
                    <li key={i}>
                      <b>{x.caseDef.title}</b>
                      <span>{fn ? `${NERVES[fn].name} (${rootsLabel(NERVES[fn].roots)})` : x.caseDef.lesion?.level || x.caseDef.chain[0].answer}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="mm-btns">
            <button type="button" className="mm-start" onClick={start}>Another run</button>
            <button type="button" className="mm-ghost" onClick={() => setPhase('intro')}>Atlas & settings</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ────────────────────────────────────────────────────────────────
  const sheet = q ? sheetFor(q.kind, c) : null;
  const showSheet = mode === 'guided' || hinted;
  const isRootDrill = c.kind === 'root';
  const levelLesion = isLesion && !NERVES[c.lesion.node] && !c.lesion.muscle;

  return (
    <div className="mm mm--run">
      <Fibres />
      <div className="mm-top">
        {onExit && <button type="button" className="mm-back" onClick={onExit}>← Quit</button>}
        <div className="mm-hud">
          <SfxToggle />
          <span>Case <b>{ci + 1}</b>/{queue.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={streak >= 2 ? 'is-hot' : ''}>🔥 <b>{streak}</b></span>
        </div>
      </div>

      <div className="mm-layout">
        {/* ── The patient, and the map ───────────────────────────────── */}
        <section className="mm-patient" key={c.id}>
          <p className="mm-case-kicker">{c.kind === 'drill' ? 'Drill' : c.kind === 'root' ? 'Roots' : c.region === 'upper' ? 'Upper limb' : 'Lower limb'}</p>
          <h2 className="mm-case-title">{c.title}</h2>
          <p className="mm-vignette">{c.vignette}</p>

          {isRootDrill ? (
            <RootLadder root={c.chain[0].answer} revealed={answered || caseDone} />
          ) : (
            <>
              <PlexusMap
                region={c.region}
                focus={firstDone ? focusNerve : null}
                lesion={cutOn ? (c.lesion?.muscle ? null : c.lesion.node) : null}
                showRoots={rootsShown}
              />
              {firstDone && focusNerve && (
                <MusclePanel
                  nerve={focusNerve}
                  lostAll={cutOn && !c.lesion?.muscle}
                  lost={c.lesion?.muscle && cutOn ? [c.lesion.muscle] : []}
                  spared={c.lesion?.spared || []}
                  highlight={muscleShown && muscleAsked ? muscleAsked.answer : null}
                />
              )}
              {levelLesion && cutOn && c.lesion.muscles && (
                <div className="mmv-muscles">
                  <p className="mmv-muscles-h">{c.lesion.level} — muscles lost</p>
                  <ul>
                    {c.lesion.muscles.map(m => (
                      <li key={m} className={`is-lost${muscleShown && muscleAsked?.answer === m ? ' is-hi' : ''}`}><b>{MUSCLES[m].name}</b><span>{MUSCLES[m].action}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {signShown && <SignCard sign={signQ.answer} />}
        </section>

        {/* ── The chain ───────────────────────────────────────────────── */}
        <section className="mm-work">
          <ol className="mm-chain" aria-label="The chain">
            {c.chain.map((x, i) => {
              const l = caseLog[i];
              const cls = l ? (l.correct ? 'is-right' : 'is-wrong') : i === qi && !caseDone ? 'is-now' : '';
              return (
                <li key={i} className={cls}>
                  <span className="mm-chain-dot">{l ? (l.correct ? '✓' : '✗') : i + 1}</span>
                  <span className="mm-chain-t">{KIND_LABEL[x.kind]}</span>
                </li>
              );
            })}
          </ol>

          {!caseDone && q && (
            <div className="mm-card" key={`${ci}-${qi}`}>
              <p className="mm-step-kicker">Link {qi + 1} of {c.chain.length}</p>
              <h3 className="mm-q">{KIND_TITLE[q.kind]}</h3>

              {sheet && (showSheet ? <CheatCard sheet={sheet} /> : !answered && (
                <button type="button" className="mm-hint" onClick={() => { sfx.select(); setHinted(true); }}>
                  💡 Show the guide <small>(half points for this link)</small>
                </button>
              ))}

              <div className="mm-options">
                {optionOrder.map((k, i) => {
                  const isAns = k === q.answer;
                  const cls = !answered ? '' : isAns ? ' is-right' : k === picked ? ' is-wrong' : ' is-dim';
                  return (
                    <button key={k} type="button" className={`mm-option${cls}`} onClick={() => choose(k)} disabled={answered} style={{ '--d': `${0.05 * i}s` }}>
                      <span className="mm-option-key">{i + 1}</span>
                      <span>{optionLabel(q.kind, k)}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className={`mm-feedback${correct ? ' is-right' : ' is-wrong'}`}>
                  <p className="mm-verdict">{correct ? 'Correct' : `Not quite — ${optionLabel(q.kind, q.answer)}`}</p>
                  <p className="mm-why">{q.why}</p>
                  {!correct && q.not?.[picked] && <p className="mm-why mm-why--not"><b>Not {optionLabel(q.kind, picked)}:</b> {q.not[picked]}</p>}
                  <button type="button" className="mm-next" onClick={nextQ} autoFocus>
                    {qi + 1 >= c.chain.length ? 'Finish the chain' : 'Next link'} →
                  </button>
                </div>
              )}
            </div>
          )}

          {caseDone && (
            <div className="mm-card mm-done">
              <p className="mm-step-kicker">The chain</p>
              <ol className="mm-recap">
                {c.chain.map((x, i) => (
                  <li key={i} className={caseLog[i]?.correct ? 'is-right' : 'is-wrong'} style={{ animationDelay: `${0.08 * i}s` }}>
                    <span>{KIND_LABEL[x.kind]}</span>
                    <b>{optionLabel(x.kind, x.answer)}</b>
                  </li>
                ))}
              </ol>
              {focusNerve && NERVES[focusNerve].mnemonic && <p className="mm-mn">💡 {NERVES[focusNerve].mnemonic}</p>}
              {caseLog.every(l => l.correct) && <p className="mm-perfect">Perfect chain · +{PERFECT_BONUS}</p>}
              <button type="button" className="mm-next" onClick={nextCase} autoFocus>
                {ci + 1 >= queue.length ? 'See results' : 'Next case'} →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Slow-moving muscle fibres behind everything. Decorative.
function Fibres() {
  return <div className="mm-fibres" aria-hidden="true"><span /><span /><span /></div>;
}
