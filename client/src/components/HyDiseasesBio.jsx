import { useEffect, useMemo, useRef, useState } from 'react';
import { BIO_CASES, BIO_BY_ID, BIO_CHAPTERS, INHERIT_LABEL } from '../hyd/bioCases';
import HydPatient from '../hyd/HydPatient';
import ExamInset from '../hyd/ExamInset';
import HydQbank from './HydQbank';
import { useAdminAccess } from './useAdminAccess';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './HyDiseases.css';

/**
 * HY Diseases · Biochemistry: "Clinic Rounds".
 *
 * A calm diagnose-the-patient game. No clock, no lives. Each patient comes in
 * four beats:
 *   1. History: the story arrives as chat bubbles (tap to skip ahead).
 *   2. Exam: the animated patient shows what you would see; close-up cards
 *      show what you would find; labs follow.
 *   3. Diagnose: the answer and three look-alikes. A wrong pick explains
 *      itself kindly and you try again; a hint is always there.
 *   4. Learn: what is broken, in plain words, the chain from enzyme to
 *      symptom, how it differs from each look-alike, treatment, a hook.
 *
 * Stars (3 first try, 2 second, 1 after) are kept in this browser so the
 * wards and the casebook show progress. Nothing is graded on the server; the
 * route is wrapped in StudyTracked so study time counts.
 */

const ROUND = 8;
const LINE_MS = 1100;
const STORE = 'mv_hyd_bio_v1';

const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const loadProgress = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
const saveProgress = (p) => { try { localStorage.setItem(STORE, JSON.stringify(p)); } catch { /* private mode */ } };

// Unlearned patients first, then the rest, each group shuffled.
function pickRound(pool, progress, n = ROUND) {
  const fresh = shuffle(pool.filter(c => !progress[c.id]));
  const known = shuffle(pool.filter(c => progress[c.id]));
  return [...fresh, ...known].slice(0, n);
}

const Stars = ({ n, size = 'sm' }) => (
  <span className={`hd-stars hd-stars--${size}`} aria-label={`${n} of 3 stars`}>
    {[1, 2, 3].map(i => <span key={i} className={i <= n ? 'is-on' : ''}>★</span>)}
  </span>
);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Shouted words in the notes ("HIGH", "NOT") stay loud.
function Loud({ text }) {
  const parts = text.split(/\b(HIGH|LOW|NOT|NO|ALWAYS|NEVER)\b/);
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

// A fact's lead in bold, so the list can be skimmed: the label before a
// colon ("Chronic: alopecia..."), else the first clause ("Night blindness
// first, then dry eyes...").
function Fact({ text }) {
  const colon = text.match(/^([^,;:]{2,40}):\s+(.*)$/);
  if (colon) return <><strong>{colon[1]}:</strong> <Loud text={colon[2]} /></>;
  const m = text.match(/^(.{3,55}?)([;,]\s)(.*)$/);
  if (m) return <><strong>{m[1]}</strong>{m[2]}<Loud text={m[3]} /></>;
  return <strong>{text}</strong>;
}

function LearnBlock({ icon, title, tone = 'teal', children }) {
  return (
    <div className={`hd-learn-block hd-learn-block--${tone}`}>
      <h4><span className="hd-learn-icon" aria-hidden="true">{icon}</span>{title}</h4>
      {children}
    </div>
  );
}

function LearnCard({ c, picked = [] }) {
  const steps = c.learn.chain;
  return (
    <section className="hd-learn" aria-label={`About ${c.name}`}>
      <header className="hd-learn-head">
        <h3>{c.name}</h3>
        <span className="hd-chip">{INHERIT_LABEL[c.inherit] || c.inherit}</span>
      </header>

      <div className="hd-bigidea">
        <span className="hd-bigidea-tag">The big idea</span>
        <p>{c.learn.plain}</p>
      </div>

      {c.hint && (
        <div className="hd-giveaway">
          <span aria-hidden="true">🔑</span>
          <p><strong>Spot it by:</strong> {c.hint}</p>
        </div>
      )}

      <LearnBlock icon="⛓" title="How it happens" tone="blue">
        <ol className="hd-steps">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s} className={i === 0 ? 'is-cause' : last ? 'is-result' : ''} style={{ '--i': i }}>
                <span className="hd-step-dot" aria-hidden="true">{i + 1}</span>
                <div className="hd-step-body">
                  {(i === 0 || last) && <span className="hd-step-tag">{i === 0 ? 'Cause' : 'Result'}</span>}
                  {s.split(' + ').map(part => <p key={part}>{cap(part)}</p>)}
                </div>
              </li>
            );
          })}
        </ol>
      </LearnBlock>

      <LearnBlock icon="★" title="High-yield facts" tone="gold">
        <ol className="hd-facts">
          {c.learn.key.map((k, i) => (
            <li key={k}><span className="hd-fact-n" aria-hidden="true">{i + 1}</span><p><Fact text={k} /></p></li>
          ))}
        </ol>
      </LearnBlock>

      {c.confirm?.length > 0 && (
        <div className="hd-learn-block">
          <h4><span className="hd-learn-icon" aria-hidden="true">🧪</span>Confirmed by</h4>
          <div className="hd-confirm">
            {c.confirm.map(([text, kind]) => (
              <div key={text} className={`hd-confirm-item${kind ? ' has-inset' : ''}`}>
                {kind && <ExamInset kind={kind} />}
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <LearnBlock icon="✕" title="Why not the others" tone="coral">
        <div className="hd-contrast">
          {Object.entries(c.lookalikes).map(([id, why]) => (
            <div key={id} className={`hd-contrast-row${picked.includes(id) ? ' was-picked' : ''}`}>
              <strong>{BIO_BY_ID[id]?.name || id}</strong>
              <p>{why}</p>
            </div>
          ))}
        </div>
      </LearnBlock>

      <div className="hd-learn-split">
        <div className="hd-learn-block hd-tx">
          <h4><span className="hd-learn-icon" aria-hidden="true">💊</span>Treatment</h4>
          <p>{c.learn.tx}</p>
        </div>
        <div className="hd-hook">
          <span className="hd-hook-pin" aria-hidden="true">📌</span>
          <h4>Remember it</h4>
          <p>{c.learn.hook}</p>
        </div>
      </div>
    </section>
  );
}

function CaseView({ c, index, total, onSolved, onNext, onExit }) {
  const [shown, setShown] = useState(0);          // history lines shown
  const [stage, setStage] = useState('history');  // history | exam | diagnose | learn
  const [wrong, setWrong] = useState([]);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const scrollRef = useRef(null);
  const options = useMemo(() => shuffle([c.id, ...Object.keys(c.lookalikes)]), [c]);
  const firstName = c.who.split(',')[0].replace(/^Baby /, '').split(' ')[0];
  const speaking = stage === 'history' && shown > 0 && shown <= c.history.length
    && c.history[shown - 1][0].toLowerCase().includes(firstName.toLowerCase());

  // History lines arrive one by one.
  useEffect(() => {
    if (stage !== 'history' || shown >= c.history.length) return undefined;
    const t = setTimeout(() => { setShown(s => s + 1); sfx.bubble(); }, shown === 0 ? 500 : LINE_MS);
    return () => clearTimeout(t);
  }, [stage, shown, c]);

  // Bring the newest part into view: the end of the notes while the case
  // unfolds, but the TOP of the explanation once it opens (it is long, and
  // its beginning is what should be read first). scrollIntoView also works
  // on phones, where the notes are not their own scroll box.
  const learnRef = useRef(null);
  useEffect(() => {
    if (stage === 'learn') {
      learnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const el = scrollRef.current;
    const last = el?.lastElementChild;
    if (!last) return;
    if (el.scrollHeight > el.clientHeight) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [shown, stage, wrong.length, hint]);

  const historyDone = shown >= c.history.length;

  function choose(id) {
    if (solved || wrong.includes(id)) return;
    if (id === c.id) {
      const stars = Math.max(1, 3 - wrong.length);
      setSolved(true);
      sfx.correct();
      setTimeout(() => { setStage('learn'); sfx.sparkle(); }, 900);
      onSolved(stars, wrong);
    } else {
      setWrong(w => [...w, id]);
      sfx.wrong();
    }
  }

  const motion = solved ? (c.look.motion === 'seizure' ? 'calm' : c.look.motion) : c.look.motion;

  return (
    <div className="hd-case">
      <div className="hd-topbar">
        <button type="button" className="hd-back" onClick={onExit}>← Clinic</button>
        <div className="hd-progress" aria-label={`Patient ${index + 1} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} />
          ))}
        </div>
        <SfxToggle className="hd-sfx" />
      </div>

      <div className="hd-case-grid">
        <div className="hd-stage-col">
          <div className={`hd-stage${stage !== 'history' ? ' is-examining' : ''}${solved ? ' is-solved' : ''}`}>
            <HydPatient look={c.look} motion={motion} face={solved ? 'happy' : c.look.face} talking={speaking} />
            {stage !== 'history' && <span className="hd-scan" aria-hidden="true" />}
            {solved && <span className="hd-confetti" aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ '--k': i }} />)}</span>}
          </div>
          <div className="hd-chart">
            <span className="hd-chart-tag">Patient {index + 1}</span>
            <strong>{c.who}</strong>
            <span className="hd-chart-ward">{BIO_CHAPTERS.find(ch => ch.id === c.chapter)?.name} ward</span>
          </div>
        </div>

        <div className="hd-notes" ref={scrollRef}>
          {/* 1 · History */}
          <section className="hd-sec">
            <h3 className="hd-sec-title"><span>1</span> History</h3>
            <div className="hd-chat">
              {c.history.slice(0, shown).map(([who, line], i) => (
                <div key={i} className={`hd-bubble${/doctor|nurse|midwife|paramedic|dermatologist/i.test(who) ? ' is-staff' : ''}`}>
                  <span className="hd-bubble-who">{who}</span>
                  <p>{line}</p>
                </div>
              ))}
              {!historyDone && <div className="hd-typing" aria-hidden="true"><i /><i /><i /></div>}
            </div>
            {stage === 'history' && (
              historyDone
                ? <button type="button" className="hd-step-btn" onClick={() => { setStage('exam'); sfx.next(); }}>Examine the patient <span aria-hidden="true">→</span></button>
                : <button type="button" className="hd-skip" onClick={() => setShown(c.history.length)}>Show all</button>
            )}
          </section>

          {/* 2 · Exam */}
          {stage !== 'history' && (
            <section className="hd-sec">
              <h3 className="hd-sec-title"><span>2</span> Examination</h3>
              <div className="hd-exam">
                {c.exam.map(([text, kind], i) => (
                  <div key={text} className={`hd-finding${kind ? ' has-inset' : ''}`} style={{ '--i': i }}>
                    {kind && <ExamInset kind={kind} />}
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              {c.labs?.length > 0 && (
                <div className="hd-labs" style={{ '--i': c.exam.length }}>
                  <h4>Tests</h4>
                  <ul>{c.labs.map(l => <li key={l}>{l}</li>)}</ul>
                </div>
              )}
              {stage === 'exam' && (
                <button type="button" className="hd-step-btn" onClick={() => { setStage('diagnose'); sfx.next(); }}>I&apos;m ready to diagnose <span aria-hidden="true">→</span></button>
              )}
            </section>
          )}

          {/* 3 · Diagnose */}
          {(stage === 'diagnose' || stage === 'learn') && (
            <section className="hd-sec">
              <h3 className="hd-sec-title"><span>3</span> What is the diagnosis?</h3>
              <div className="hd-options">
                {options.map(id => {
                  const isWrong = wrong.includes(id);
                  const isRight = solved && id === c.id;
                  return (
                    <div key={id} className="hd-option-wrap">
                      <button
                        type="button"
                        className={`hd-option${isWrong ? ' is-wrong' : ''}${isRight ? ' is-right' : ''}`}
                        onClick={() => choose(id)}
                        disabled={solved || isWrong}
                      >
                        <span className="hd-option-mark" aria-hidden="true">{isRight ? '✓' : isWrong ? '✕' : ''}</span>
                        {BIO_BY_ID[id].name}
                      </button>
                      {isWrong && <p className="hd-why-not"><strong>Not quite.</strong> {c.lookalikes[id]}</p>}
                    </div>
                  );
                })}
              </div>
              {!solved && (
                hint
                  ? <p className="hd-hint"><span aria-hidden="true">🗝️</span> {c.hint}</p>
                  : <button type="button" className="hd-hint-btn" onClick={() => { setHint(true); sfx.select(); }}>Need a nudge? Show the key clue</button>
              )}
              {solved && stage !== 'learn' && <p className="hd-nice">Lovely diagnosis!</p>}
            </section>
          )}

          {/* 4 · Learn */}
          {stage === 'learn' && (
            <section className="hd-sec hd-sec--learn" ref={learnRef} style={{ scrollMarginTop: 8 }}>
              <h3 className="hd-sec-title"><span>4</span> Learn it</h3>
              <LearnCard c={c} picked={wrong} />
              <button type="button" className="hd-step-btn hd-step-btn--next" onClick={onNext}>
                {index + 1 < total ? <>Next patient <span aria-hidden="true">→</span></> : <>Finish rounds <span aria-hidden="true">✓</span></>}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const STYLE_KEY = 'mv_hyd_style';
const loadStyle = () => { try { return localStorage.getItem(STYLE_KEY) === 'clinic' ? 'clinic' : 'qbank'; } catch { return 'qbank'; } };

export default function HyDiseasesBio({ onExit }) {
  const [style, setStyleState] = useState(loadStyle);
  const setStyle = (s) => { setStyleState(s); try { localStorage.setItem(STYLE_KEY, s); } catch { /* not remembered */ } };
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState('home');   // home | case | summary | book
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [log, setLog] = useState([]);
  const [bookOpen, setBookOpen] = useState(null);

  // The animated Clinic is admin-only for now; everyone else gets the Qbank.
  const isAdmin = useAdminAccess() === true;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  const learned = Object.keys(progress).length;

  function start(pool) {
    setQueue(pickRound(pool, progress, Math.min(ROUND, pool.length)));
    setIndex(0);
    setLog([]);
    setScreen('case');
    sfx.next();
    window.scrollTo(0, 0);
  }

  function solved(stars, wrongPicks) {
    const c = queue[index];
    setLog(l => [...l, { id: c.id, stars, wrong: wrongPicks }]);
    setProgress(p => {
      const next = { ...p, [c.id]: Math.max(p[c.id] || 0, stars) };
      saveProgress(next);
      return next;
    });
  }

  function next() {
    if (index + 1 < queue.length) { setIndex(i => i + 1); window.scrollTo(0, 0); }
    else { setScreen('summary'); sfx.complete(); }
  }

  if (!isAdmin || style === 'qbank') {
    return (
      <HydQbank
        onExit={onExit}
        clinic={isAdmin}
        onClinic={() => setStyle('clinic')}
        progress={progress}
        onResult={(id, right) => setProgress(p => {
          const nextP = { ...p, [id]: Math.max(p[id] || 0, right ? 3 : 1) };
          saveProgress(nextP);
          return nextP;
        })}
      />
    );
  }

  if (screen === 'case' && queue[index]) {
    return (
      <div className="hd-screen">
        <CaseView key={queue[index].id} c={queue[index]} index={index} total={queue.length} onSolved={solved} onNext={next} onExit={() => setScreen('home')} />
      </div>
    );
  }

  if (screen === 'summary') {
    const got = log.reduce((a, r) => a + r.stars, 0);
    return (
      <div className="hd-screen">
        <div className="hd-summary">
          <div className="hd-summary-badge" aria-hidden="true">🩺</div>
          <h2>Rounds complete</h2>
          <p className="hd-summary-sub">{log.length} patients seen · {got} of {log.length * 3} stars</p>
          <ul className="hd-summary-list">
            {log.map(r => (
              <li key={r.id}>
                <span>{BIO_BY_ID[r.id].name}</span>
                <Stars n={r.stars} />
              </li>
            ))}
          </ul>
          <div className="hd-summary-actions">
            <button type="button" className="hd-step-btn" onClick={() => start(BIO_CASES)}>Another round</button>
            <button type="button" className="hd-ghost" onClick={() => setScreen('home')}>Back to the clinic</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'book') {
    const open = bookOpen && BIO_BY_ID[bookOpen];
    return (
      <div className="hd-screen">
        <div className="hd-home">
          <div className="hd-topbar">
            <button type="button" className="hd-back" onClick={() => { setBookOpen(null); setScreen('home'); }}>← Clinic</button>
            <span className="hd-top-title">Casebook</span>
            <SfxToggle className="hd-sfx" />
          </div>
          <p className="hd-book-intro">Every disease in the chapter. Open any card to read it, whether or not you have met the patient yet.</p>
          {BIO_CHAPTERS.map(ch => (
            <section key={ch.id} className="hd-book-sec" style={{ '--t': ch.tint }}>
              <h3><span aria-hidden="true">{ch.icon}</span> {ch.name}</h3>
              <div className="hd-book-grid">
                {BIO_CASES.filter(c => c.chapter === ch.id).map(c => (
                  <button key={c.id} type="button" className={`hd-book-item${progress[c.id] ? ' is-known' : ''}`} onClick={() => setBookOpen(c.id)}>
                    <span>{c.name}</span>
                    {progress[c.id] ? <Stars n={progress[c.id]} /> : <small>not met yet</small>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        {open && (
          <div className="hd-modal" role="dialog" aria-modal="true" aria-label={open.name} onClick={(e) => { if (e.target === e.currentTarget) setBookOpen(null); }}>
            <div className="hd-modal-card">
              <button type="button" className="hd-modal-x" onClick={() => setBookOpen(null)} aria-label="Close">✕</button>
              <div className="hd-modal-stage"><HydPatient look={open.look} motion={open.look.motion} face={open.look.face} /></div>
              <LearnCard c={open} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hd-screen">
      <div className="hd-home">
        <div className="hd-topbar">
          <button type="button" className="hd-back" onClick={onExit}>← HY Diseases</button>
          <span className="hd-top-title">Biochemistry</span>
          <SfxToggle className="hd-sfx" />
        </div>

        <header className="hd-hero">
          <div className="hd-hero-text">
            <span className="hd-kicker">Clinic Rounds</span>
            <h1>Who walks in today?</h1>
            <p>Take the history, look at the patient, then name the disease. No clock, no lives: get it wrong and you will learn exactly why, then try again.</p>
            <div className="hd-hero-stats">
              <span><b>{learned}</b> / {BIO_CASES.length} diagnosed</span>
              <span><b>{totalStars}</b> ★ earned</span>
            </div>
            <div className="hd-style" role="radiogroup" aria-label="How cases are shown">
              <button type="button" role="radio" aria-checked={style === 'clinic'} className={style === 'clinic' ? 'is-on' : ''} onClick={() => setStyle('clinic')}>
                <b>🩺 Clinic</b><small>animated patient, history and exam step by step</small>
              </button>
              <button type="button" role="radio" aria-checked={style === 'qbank'} className={style === 'qbank' ? 'is-on' : ''} onClick={() => setStyle('qbank')}>
                <b>📝 Qbank</b><small>condensed HY vignettes, tap to answer</small>
              </button>
            </div>
            <div className="hd-hero-actions">
              <button type="button" className="hd-step-btn" onClick={() => start(BIO_CASES)}>Start mixed rounds <span aria-hidden="true">→</span></button>
              <button type="button" className="hd-ghost" onClick={() => setScreen('book')}>Open the casebook</button>
            </div>
          </div>
          <div className="hd-hero-stage" aria-hidden="true">
            <HydPatient look={{ age: 'child', sex: 'f', skin: 'tan', hair: 'black', hairStyle: 'pony', face: 'happy' }} motion="calm" />
          </div>
        </header>

        <h2 className="hd-wards-title">Or pick a ward</h2>
        <div className="hd-wards">
          {BIO_CHAPTERS.map((ch, i) => {
            const pool = BIO_CASES.filter(c => c.chapter === ch.id);
            const done = pool.filter(c => progress[c.id]).length;
            return (
              <button key={ch.id} type="button" className="hd-ward" style={{ '--t': ch.tint, '--i': i }} onClick={() => start(pool)}>
                <span className="hd-ward-icon" aria-hidden="true">{ch.icon}</span>
                <span className="hd-ward-name">{ch.name}</span>
                <span className="hd-ward-blurb">{ch.blurb}</span>
                <span className="hd-ward-bar"><i style={{ width: `${(done / pool.length) * 100}%` }} /></span>
                <span className="hd-ward-count">{done} / {pool.length} patients</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
