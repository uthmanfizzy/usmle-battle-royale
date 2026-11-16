import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MurmurPanel, { ChestMap, MurmurDiagram, stopAllMurmurs } from '../murmur/MurmurPanel';
import { MURMURS, CATEGORIES, QUIZ_STEMS, murmurById, whyNot } from '../murmur/murmurData';
import { sfx } from '../minigameSfx';
import { useGameSettings } from '../contexts/GameSettingsContext';
import SfxToggle from './SfxToggle';
import './Murmurs.css';

/**
 * Murmurs — listen, and name what you hear.
 *
 * Same shape as the other minigames: an intro, a run of ten, a summary, a
 * score and a streak, nothing saved to the server.
 *
 * Every sound is synthesised (src/murmur), so the diagram a student can open
 * is drawn from the same events and loudness curves as the audio — the
 * crescendo–decrescendo "hill" between S1 and S2 is the very sound playing.
 *
 * After each answer the reveal lists EVERY classic presentation of that
 * murmur, so a student can be sure they have met all the ways it turns up in
 * a question, and lets them play any of the wrong options beside it.
 *
 * The Library is the same material without a clock: every murmur, its sound,
 * its diagram and all its cases.
 */

const RUN_LENGTH = 10;
const BASE_POINTS = 100;
const STREAK_BONUS = 20;
const STREAK_BONUS_MAX = 5;
const OPTIONS = 4;

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function buildQuestion(m) {
  const wrong = shuffle(m.distractors).slice(0, OPTIONS - 1).map(murmurById);
  return {
    murmur: m,
    options: shuffle([m, ...wrong]),
    // A quiz stem describes the patient only; the case story names the sound.
    caseDef: (() => { const s = pick(QUIZ_STEMS[m.id] || []); return s ? { title: s.title, story: s.stem } : pick(m.cases); })(),
    seed: 1 + Math.floor(Math.random() * 1e6),
  };
}

const pref = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const savePref = (key, v) => { try { localStorage.setItem(key, v); } catch { /* not remembered */ } };

export default function Murmurs({ onExit }) {
  // Recorded clips an admin has imported ({ murmurId: url }). A murmur with
  // one plays the recording; the rest keep their synthesised sound.
  const { settings } = useGameSettings();
  const recordings = settings?.murmurAudio || {};
  const rec = (m) => recordings[m.id] || null;
  const [phase, setPhase] = useState('intro');      // intro | run | summary | library
  const [category, setCategory] = useState('all');
  const [withCase, setWithCase] = useState(() => pref('mv_murm_case', 'off') === 'on');
  const [diagramOn, setDiagramOn] = useState(() => pref('mv_murm_diagram', 'off') === 'on');
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);       // murmur id
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBest] = useState(0);
  const [log, setLog] = useState([]);
  const [hintSite, setHintSite] = useState(false);
  const [compareWith, setCompareWith] = useState(null);
  const [openCase, setOpenCase] = useState(null);
  const [libraryId, setLibraryId] = useState(null);
  const topNextRef = useRef(null);
  const compareRef = useRef(null);

  const pool = useMemo(
    () => (category === 'all' ? MURMURS : MURMURS.filter((m) => m.category === category)),
    [category],
  );

  const q = queue[index] || null;
  const answered = picked != null;
  const correct = answered && picked === q?.murmur.id;

  const toggleDiagram = () => { const v = !diagramOn; setDiagramOn(v); savePref('mv_murm_diagram', v ? 'on' : 'off'); };
  const toggleCase = () => { const v = !withCase; setWithCase(v); savePref('mv_murm_case', v ? 'on' : 'off'); };

  // Leaving a screen silences it.
  useEffect(() => stopAllMurmurs, []);
  useEffect(() => { stopAllMurmurs(); }, [phase, index, libraryId]);

  const start = () => {
    // A run is RUN_LENGTH questions; a small category repeats murmurs (each
    // time with a different case) rather than ending after three.
    const picks = [];
    while (picks.length < RUN_LENGTH) picks.push(...shuffle(pool));
    setQueue(picks.slice(0, RUN_LENGTH).map(buildQuestion));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBest(0);
    setLog([]);
    setHintSite(false);
    setCompareWith(null);
    setOpenCase(null);
    setPhase('run');
  };

  const choose = useCallback((m) => {
    if (!q || picked != null) return;
    const ok = m.id === q.murmur.id;
    setPicked(m.id);
    setCompareWith(ok ? null : m.id);
    setOpenCase(null);
    setLog((l) => [...l, { murmur: q.murmur, picked: m, correct: ok }]);
    if (ok) {
      sfx.correct();
      if (streak + 1 >= 3) setTimeout(() => sfx.sparkle(), 140);
      setScore((s) => s + BASE_POINTS + STREAK_BONUS * Math.min(streak, STREAK_BONUS_MAX));
      setStreak(streak + 1);
      setBest((b) => Math.max(b, streak + 1));
    } else {
      sfx.wrong();
      setStreak(0);
    }
  }, [q, picked, streak]);

  const next = useCallback(() => {
    if (index + 1 >= queue.length) { sfx.fanfare(); setPhase('summary'); return; }
    sfx.next();
    setIndex((i) => i + 1);
    setPicked(null);
    setHintSite(false);
    setCompareWith(null);
    setOpenCase(null);
    document.querySelector('.murm')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, queue.length]);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (!answered && /^[1-4]$/.test(e.key) && q) {
        const opt = q.options[Number(e.key) - 1];
        if (opt) { e.preventDefault(); choose(opt); }
      } else if (answered && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault(); next();
      } else if (e.key === ' ') {
        e.preventDefault();
        document.querySelector('.murm-run-panel .murm-play')?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answered, q, choose, next]);

  useEffect(() => { if (answered) topNextRef.current?.focus({ preventScroll: true }); }, [answered]);

  // ── Intro ───────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="murm murm--intro">
        <TopBar onExit={onExit} />
        <div className="murm-intro">
          <span className="murm-intro-icon" aria-hidden="true">🩺</span>
          <p className="murm-kicker">Cardiology · Minigame</p>
          <h1 className="murm-title">Murmurs</h1>
          <p className="murm-lede">
            Put the stethoscope on and listen. Name the murmur — systolic or diastolic, the shape
            of it, the clicks and snaps around it, what breathing does to it.
          </p>

          <div className="murm-intro-preview">
            <MurmurDiagram spec={murmurById('as').spec} compact />
            <span className="murm-intro-caption">Aortic stenosis — the crescendo–decrescendo “hill” between S1 and S2</span>
          </div>

          <div className="murm-choose">
            <span className="murm-choose-label">Practise</span>
            <div className="murm-chips" role="group" aria-label="Which murmurs">
              {Object.entries(CATEGORIES).map(([id, label]) => {
                const n = id === 'all' ? MURMURS.length : MURMURS.filter((m) => m.category === id).length;
                return (
                  <button key={id} type="button" className={`murm-chip${category === id ? ' is-on' : ''}`} aria-pressed={category === id} onClick={() => setCategory(id)}>
                    {label} <span className="murm-chip-n">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="murm-choose">
            <span className="murm-choose-label">Question style</span>
            <div className="murm-chips" role="group" aria-label="Question style">
              <button type="button" className={`murm-chip${!withCase ? ' is-on' : ''}`} aria-pressed={!withCase} onClick={() => withCase && toggleCase()}>🎧 Sound only</button>
              <button type="button" className={`murm-chip${withCase ? ' is-on' : ''}`} aria-pressed={withCase} onClick={() => !withCase && toggleCase()}>🧑‍⚕️ Sound + patient</button>
            </div>
          </div>

          <ul className="murm-rules">
            <li>Each clip loops two beats breathing in and two breathing out, so you can hear what inspiration does.</li>
            <li>Stuck? Open the <strong>diagram</strong> to see the sound’s shape, or ask <strong>where it is loudest</strong>.</li>
            <li>After each answer: every way that murmur presents, and the wrong options to play side by side.</li>
            <li>{RUN_LENGTH} sounds a run · 100 points each, plus a bonus for every answer in a row.</li>
          </ul>

          <div className="murm-intro-btns">
            <button type="button" className="murm-start" onClick={start}>Start listening</button>
            <button type="button" className="murm-ghost" onClick={() => { setLibraryId(null); setPhase('library'); }}>📚 Study the library</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Library ─────────────────────────────────────────────────────────────
  if (phase === 'library') {
    const m = libraryId ? murmurById(libraryId) : null;
    return (
      <div className="murm murm--library">
        <TopBar
          onExit={() => (m ? setLibraryId(null) : setPhase('intro'))}
          exitLabel={m ? '← All murmurs' : '← Back'}
        />
        {!m ? (
          <div className="murm-library">
            <h1 className="murm-title murm-title--sm">Murmur library</h1>
            <p className="murm-lede">Every sound in the game — listen, see its diagram, and read every way it presents.</p>
            {Object.entries(CATEGORIES).filter(([id]) => id !== 'all').map(([id, label]) => (
              <section key={id} className="murm-lib-group">
                <h2 className="murm-lib-h">{label}</h2>
                <div className="murm-lib-grid">
                  {MURMURS.filter((x) => x.category === id).map((x) => (
                    <button key={x.id} type="button" className="murm-lib-card" onClick={() => setLibraryId(x.id)}>
                      <MurmurDiagram spec={x.spec} compact />
                      <span className="murm-lib-name">{x.answer}</span>
                      <span className="murm-lib-sub">{x.timing}</span>
                      <span className="murm-lib-n">{x.cases.length} presentations</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="murm-detail">
            <h1 className="murm-title murm-title--sm">{m.answer}</h1>
            <MurmurPanel murmur={m} seed={11} showDiagram recordingUrl={rec(m)} />
            <Teaching murmur={m} />
            <Cases murmur={m} openCase={openCase} setOpenCase={setOpenCase} allOpen />
          </div>
        )}
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const right = log.filter((l) => l.correct).length;
    const missed = log.filter((l) => !l.correct);
    const pct = Math.round((right / Math.max(1, log.length)) * 100);
    return (
      <div className="murm murm--summary">
        <TopBar onExit={onExit} />
        <div className="murm-summary">
          <p className="murm-kicker">Run complete</p>
          <h1 className="murm-title">{pct >= 80 ? 'Sharp ears.' : pct >= 50 ? 'Getting there.' : 'Keep listening.'}</h1>
          <div className="murm-stats">
            <div className="murm-stat"><span className="murm-stat-n">{score}</span><span className="murm-stat-l">Points</span></div>
            <div className="murm-stat"><span className="murm-stat-n">{right}/{log.length}</span><span className="murm-stat-l">Correct</span></div>
            <div className="murm-stat"><span className="murm-stat-n">{bestStreak}</span><span className="murm-stat-l">Best streak</span></div>
          </div>
          {missed.length > 0 ? (
            <div className="murm-missed">
              <h2 className="murm-missed-title">To listen to again</h2>
              <ul>
                {missed.map((x, i) => (
                  <li key={i}>
                    <span className="murm-missed-answer">{x.murmur.answer}</span>
                    <span className="murm-missed-you">you said {x.picked.answer}</span>
                    <span className="murm-missed-key">{x.murmur.tell}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="murm-perfect">Every sound named correctly.</p>
          )}
          <div className="murm-intro-btns">
            <button type="button" className="murm-start" onClick={start}>Another run</button>
            <button type="button" className="murm-ghost" onClick={() => setPhase('intro')}>Change set</button>
            <button type="button" className="murm-ghost" onClick={() => { setLibraryId(null); setPhase('library'); }}>📚 Library</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Run ─────────────────────────────────────────────────────────────────
  const other = compareWith ? murmurById(compareWith) : null;
  return (
    <div className="murm murm--run">
      <div className="murm-topbar">
        {onExit && <button type="button" className="murm-back" onClick={onExit}>← Quit</button>}
        <div className="murm-hud">
          <SfxToggle />
          <span className="murm-hud-item">Sound <strong>{index + 1}</strong>/{queue.length}</span>
          <span className="murm-hud-item">Score <strong>{score}</strong></span>
          <span className={`murm-hud-item murm-streak${streak >= 2 ? ' is-hot' : ''}`}>🔥 <strong>{streak}</strong></span>
        </div>
      </div>

      <div className="murm-progress" aria-hidden="true">
        {queue.map((_, i) => {
          const entry = log[i];
          const cls = entry ? (entry.correct ? 'is-right' : 'is-wrong') : i === index ? 'is-now' : '';
          return <span key={i} className={cls} />;
        })}
      </div>

      <div className="murm-stage">
        {withCase && (
          <div className="murm-vignette">
            <span className="murm-vignette-tag">Patient</span>
            <p>{q.caseDef.story}</p>
          </div>
        )}

        <div className="murm-run-panel">
          <MurmurPanel key={`${index}-${q.seed}`} murmur={q.murmur} seed={q.seed} showDiagram={diagramOn || answered} recordingUrl={rec(q.murmur)} />
          <div className="murm-tools">
            <button type="button" className={`murm-tool${diagramOn || answered ? ' is-on' : ''}`} onClick={toggleDiagram} disabled={answered} aria-pressed={diagramOn}>
              📈 {diagramOn || answered ? 'Diagram shown' : 'Show diagram'}
            </button>
            <button type="button" className={`murm-tool${hintSite || answered ? ' is-on' : ''}`} onClick={() => setHintSite((v) => !v)} disabled={answered}>
              📍 {hintSite || answered ? 'Loudest here' : 'Where is it loudest?'}
            </button>
          </div>
          {(hintSite || answered) && <ChestMap site={q.murmur.site} radiation={answered ? q.murmur.radiation : null} />}
        </div>

        <h2 className="murm-prompt">What do you hear?</h2>
        <div className="murm-options">
          {q.options.map((opt, i) => {
            const isAnswer = opt.id === q.murmur.id;
            const cls = !answered ? '' : isAnswer ? ' is-right' : opt.id === picked ? ' is-wrong' : ' is-dim';
            return (
              <button key={opt.id} type="button" className={`murm-option${cls}`} onClick={() => choose(opt)} disabled={answered} style={{ '--d': `${i * 0.05}s` }}>
                <span className="murm-option-key">{i + 1}</span>
                <span className="murm-option-text">{opt.answer}</span>
                {answered && isAnswer && <span className="murm-option-mark" aria-hidden="true">✓</span>}
                {answered && !isAnswer && opt.id === picked && <span className="murm-option-mark" aria-hidden="true">✗</span>}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`murm-reveal${correct ? ' is-right' : ' is-wrong'}`}>
            <div className="murm-reveal-head">
              <span className="murm-verdict">{correct ? 'Correct' : 'Not quite'}</span>
              <span className="murm-reveal-answer">{q.murmur.answer}</span>
              {correct && streak >= 2 && <span className="murm-reveal-streak">{streak} in a row</span>}
              <button type="button" className="murm-next murm-next--top" onClick={next} ref={topNextRef}>
                {index + 1 >= queue.length ? 'See results' : 'Next sound'} →
              </button>
            </div>

            <Teaching murmur={q.murmur} />

            <Cases murmur={q.murmur} openCase={openCase} setOpenCase={setOpenCase} highlight={withCase ? q.caseDef.title : null} />

            <div className="murm-wrongs">
              <h3 className="murm-h">Why the other answers are wrong</h3>
              <ul>
                {q.options.filter((o) => o.id !== q.murmur.id).map((o) => {
                  const mine = o.id === picked;
                  const open = compareWith === o.id;
                  return (
                    <li key={o.id} className={`murm-wrong${mine ? ' is-mine' : ''}${open ? ' is-open' : ''}`}>
                      <div className="murm-wrong-head">
                        <span className="murm-wrong-name">
                          {o.answer}
                          {mine && <span className="murm-wrong-tag">your answer</span>}
                        </span>
                        <button
                          type="button"
                          className="murm-compare-btn"
                          aria-expanded={open}
                          onClick={() => {
                            setCompareWith(open ? null : o.id);
                            if (!open) setTimeout(() => compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
                          }}
                        >
                          {open ? 'Hide comparison' : '🎧 Compare side by side'}
                        </button>
                      </div>
                      <p className="murm-wrong-why">{whyNot(q.murmur, o)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {other && (
              <div className="murm-compare" ref={compareRef}>
                <p className="murm-compare-why"><strong>Listen to both:</strong> {other.tell}</p>
                <div className="murm-compare-grid">
                  <MurmurPanel murmur={q.murmur} seed={q.seed} title={`✓ ${q.murmur.answer} — this sound`} tone="case" recordingUrl={rec(q.murmur)} />
                  <MurmurPanel murmur={other} seed={97} title={`${other.answer} — for comparison`} tone="other" recordingUrl={rec(other)} />
                </div>
              </div>
            )}

            <button type="button" className="murm-next" onClick={next}>
              {index + 1 >= queue.length ? 'See results' : 'Next sound'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ onExit, exitLabel = '← Minigames' }) {
  return (
    <div className="murm-topbar">
      {onExit && <button type="button" className="murm-back" onClick={onExit}>{exitLabel}</button>}
      <SfxToggle />
    </div>
  );
}

/** Timing, shape, quality, location, manoeuvres and associated findings. */
function Teaching({ murmur: m }) {
  return (
    <div className="murm-teach">
      <p className="murm-tell"><strong>The tell:</strong> {m.tell}</p>
      <div className="murm-teach-grid">
        <dl className="murm-facts">
          <div><dt>Timing</dt><dd>{m.timing}</dd></div>
          <div><dt>Shape</dt><dd>{m.shape}</dd></div>
          <div><dt>Quality</dt><dd>{m.quality}</dd></div>
          <div><dt>Radiation</dt><dd>{m.radiation}</dd></div>
        </dl>
        <ChestMap site={m.site} radiation={m.radiation} />
      </div>
      {(m.louder.length > 0 || m.softer.length > 0) && (
        <div className="murm-manoeuvres">
          {m.louder.length > 0 && (
            <div className="murm-man murm-man--up">
              <h4>⬆ Louder / more obvious with</h4>
              <ul>{m.louder.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          {m.softer.length > 0 && (
            <div className="murm-man murm-man--down">
              <h4>⬇ Softer / less obvious with</h4>
              <ul>{m.softer.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      <h3 className="murm-h">Goes with</h3>
      <ul className="murm-findings">{m.findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
    </div>
  );
}

/** Every classic presentation, so nothing in an exam stem is new. */
function Cases({ murmur: m, openCase, setOpenCase, highlight = null, allOpen = false }) {
  return (
    <div className="murm-cases">
      <h3 className="murm-h">Every way it presents <span className="murm-h-n">{m.cases.length}</span></h3>
      <p className="murm-cases-sub">The cases an exam can build around {m.answer.toLowerCase()} — the same sound, different stories.</p>
      <div className="murm-case-list">
        {m.cases.map((c) => {
          const open = allOpen || openCase === c.title || highlight === c.title;
          return (
            <div key={c.title} className={`murm-case${open ? ' is-open' : ''}${highlight === c.title ? ' is-this' : ''}`}>
              <button type="button" className="murm-case-head" onClick={() => !allOpen && setOpenCase(openCase === c.title ? null : c.title)} aria-expanded={open}>
                <span>{c.title}</span>
                {highlight === c.title && <span className="murm-case-tag">this patient</span>}
                {!allOpen && <span className="murm-case-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>}
              </button>
              {open && (
                <div className="murm-case-body">
                  <p>{c.story}</p>
                  <ul>{c.clues.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
