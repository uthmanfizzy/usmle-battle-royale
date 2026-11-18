import { useEffect, useRef, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import './FAImages.css';
import './FAHYQs.css';

/**
 * FA HY Qs — high-yield vignettes for First Aid Journey.
 *
 * Where the FA Qbank asks one fact at a time, these ask the next step: the
 * mechanism behind a finding, the confirming test, the drug and its catch.
 * Tutor mode — answer, read why, carry on — with the First Aid page to
 * revise from on every question. Same book furniture as FA Images (the CSS
 * is shared), so the First Aid modes read as one family.
 */

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
// Each vignette gets 30 seconds — exam pace. Running out marks it wrong and
// shows the explanation, exactly like a wrong answer.
const SECONDS = 30;
const COUNT_LABEL = { 0: 'All' };

function RunningHeader({ chapter, page, right }) {
  return (
    <header className="fai-run">
      <span className="fai-run-tab"><b>{page}</b><i>SECTION III</i></span>
      <span className="fai-run-band">
        <b>{(chapter || 'First Aid').toUpperCase()}</b>
        <span className="fai-run-sub">▸ HIGH-YIELD QUESTIONS</span>
        <span className="fai-run-right">{right}</span>
      </span>
    </header>
  );
}

function Opener({ catalog, error, chapter, setChapter, sections, setSections, count, setCount, onStart, onExit }) {
  const chapters = catalog?.chapters || [];
  const picked = chapters.find(c => c.id === chapter);
  const pool = picked ? (sections.length ? picked.sections.filter(s => sections.includes(s.id)).reduce((n, s) => n + s.count, 0) : picked.count) : 0;
  const toggle = (id) => { sfx.select(); setSections(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])); };
  return (
    <div className="fai-opener">
      <div className="fai-opener-main">
        <button type="button" className="fai-back" onClick={onExit}>← First Aid Journey</button>
        <p className="fai-kicker">HIGH-YIELD QUESTIONS</p>
        <div className="fai-kicker-rule" />
        <h1 className="fai-title">{picked ? picked.name : 'FA HY Qs'}</h1>
        <blockquote className="fai-quote">
          “Know the fact. Then know what it means for the patient.”
          <cite>—the step after the Qbank</cite>
        </blockquote>
        <p className="fai-lede">
          Clinical vignettes built on the facts you drilled in the FA Qbank — the mechanism behind a finding,
          the test that confirms it, the drug and its catch. Five options, one best answer; every question
          tells you which First Aid page to go back to.
        </p>

        {picked && (
          <div className="fai-setup">
            <span className="fai-setup-label">SECTIONS <small className="fahq-hint">(none picked = the whole chapter)</small></span>
            <div className="fai-counts" role="group" aria-label="Sections">
              {picked.sections.map(s => (
                <button key={s.id} type="button" className={`fai-count fahq-sec${sections.includes(s.id) ? ' is-on' : ''}`}
                  aria-pressed={sections.includes(s.id)} onClick={() => toggle(s.id)}>
                  {s.id} <small>{s.count}</small>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="fai-setup">
          <span className="fai-setup-label">QUESTIONS PER BLOCK</span>
          <div className="fai-counts" role="group" aria-label="Questions per block">
            {(catalog?.counts || [10, 20, 40, 0]).map(n => (
              <button key={n} type="button" className={`fai-count${count === n ? ' is-on' : ''}`}
                aria-pressed={count === n} onClick={() => { sfx.select(); setCount(n); }}>
                {COUNT_LABEL[n] || n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="fai-error">{error}</p>}
        <button type="button" className="fai-start" disabled={!pool} onClick={onStart}>
          {pool ? `Start the block — ${count && count < pool ? count : pool} questions` : catalog ? 'No questions here yet' : 'Loading…'}
          <span aria-hidden="true">▸</span>
        </button>
        <SfxToggle className="fai-sfx" />
      </div>

      <nav className="fai-toc" aria-label="Chapters">
        {(catalog?.allChapters || []).map((c, i) => {
          const live = chapters.find(x => x.id === c.id);
          return (
            <button key={c.id} type="button" disabled={!live}
              className={`fai-toc-row${chapter === c.id ? ' is-on' : ''}${live ? '' : ' is-soon'}`}
              style={{ '--i': i }}
              onClick={() => { sfx.select(); setChapter(c.id); setSections([]); }}>
              <span>▸ {c.name}</span>
              <b>{live ? live.count : 'soon'}</b>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function QuestionPage({ q, idx, total, correct, onAnswer, onNext, picked, flip }) {
  const answered = picked !== null;
  const noteRef = useRef(null);
  const [msLeft, setMsLeft] = useState(SECONDS * 1000);
  // The page's answer handler is a fresh function each render; the clock
  // reads it through a ref so re-renders never restart the 30 seconds.
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;
  useEffect(() => {
    if (answered) return undefined;
    const from = performance.now();
    let done = false;
    const t = setInterval(() => {
      const left = Math.max(0, SECONDS * 1000 - (performance.now() - from));
      setMsLeft(left);
      if (left <= 0 && !done) { done = true; clearInterval(t); answerRef.current(-1); }
    }, 100);
    return () => clearInterval(t);
  }, [answered]);
  useEffect(() => {
    function key(e) {
      if (!answered && /^[1-5]$/.test(e.key)) onAnswer(Number(e.key) - 1);
      else if (answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onNext(); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [answered, onAnswer, onNext]);
  useEffect(() => {
    if (answered) setTimeout(() => noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 250);
  }, [answered]);

  const right = answered && picked === q.correct;
  return (
    <div className={`fai-page${flip ? ' is-turning' : ''}`}>
      <div className="fai-sectionbar">▸ {q.section.toUpperCase()}—{q.topic.toUpperCase()}</div>
      <div className="fai-grid">
        <div className="fai-left">
          <h2 className="fai-heading">Question {idx + 1}</h2>
          <div className="fai-stats">
            <span><i>CORRECT</i><b>{correct}/{idx + (answered ? 1 : 0)}</b></span>
            <span><i>BLOCK</i><b>{idx + 1}/{total}</b></span>
            <span><i>FIRST AID</i><b>p. {q.page}</b></span>
          </div>
          {/* The plum ribbon from FA Images: the clock as a shortening bookmark. */}
          <div className={`fai-ribbon${msLeft / (SECONDS * 1000) < 0.3 && !answered ? ' is-low' : ''}`} aria-label={`${Math.ceil(msLeft / 1000)} seconds left`}>
            <span style={{ height: `${Math.max(0, msLeft / (SECONDS * 1000)) * 100}%` }} />
            <b>{answered ? '—' : Math.ceil(msLeft / 1000)}</b>
          </div>
        </div>
        <div className="fai-main">
          <p className="fahq-stem">{q.stem}</p>
          <div className="fai-table" role="group" aria-label="Options">
            <div className="fai-th"><span>OPTION</span><span>ANSWER</span></div>
            {q.options.map((o, i) => {
              let cls = '';
              if (answered) {
                if (i === q.correct) cls = ' is-right';
                else if (i === picked) cls = ' is-wrong';
                else cls = ' is-dim';
              }
              return (
                <button key={o} type="button" className={`fai-row${cls}`} style={{ '--i': i }}
                  disabled={answered} onClick={() => onAnswer(i)}>
                  <span className="fai-row-key">{LETTERS[i]}<small>{i + 1}</small></span>
                  <span className="fai-row-text"><span className="fai-ink">{o}</span></span>
                  {answered && i === q.correct && <span className="fai-mark fai-mark--tick" aria-label="correct">✓</span>}
                  {answered && i === picked && i !== q.correct && <span className="fai-mark fai-mark--cross" aria-label="your answer">✗</span>}
                </button>
              );
            })}
          </div>
          {answered && (
            <aside ref={noteRef} className={`fai-note${right ? ' is-right' : ' is-wrong'}`}>
              <span className="fai-note-head">{right ? 'Correct' : picked === -1 ? "Time's up" : 'Not quite'} — {q.options[q.correct]}</span>
              <p>{q.explanation}</p>
              <span className="fahq-review">Review: First Aid p. {q.page} · {q.topic}</span>
              <button type="button" className="fai-next" onClick={onNext} autoFocus>
                {idx + 1 >= total ? 'Close the book' : 'Next question'} <span aria-hidden="true">▸</span>
              </button>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function NotesPage({ results, onAgain, onExit }) {
  const right = results.filter(r => r.right).length;
  const pct = results.length ? Math.round((right / results.length) * 100) : 0;
  const bySection = {};
  results.forEach(r => {
    const s = (bySection[r.q.section] ||= { right: 0, total: 0 });
    s.total += 1; if (r.right) s.right += 1;
  });
  const missed = results.filter(r => !r.right);
  return (
    <div className="fai-page fai-notes">
      <div className="fai-sectionbar">▸ NOTES</div>
      <div className="fai-notes-grid">
        <div className="fai-notes-score">
          <span className="fai-kicker">YOUR BLOCK</span>
          <b className="fai-big">{pct}%</b>
          <span className="fai-notes-line">{right} of {results.length} correct</span>
          <div className="fahq-sections">
            {Object.entries(bySection).map(([s, v]) => (
              <span key={s}><i>{s}</i><b>{v.right}/{v.total}</b>
                <em style={{ width: `${(v.right / v.total) * 100}%` }} /></span>
            ))}
          </div>
          <div className="fai-notes-actions">
            <button type="button" className="fai-start" onClick={onAgain}>Another block <span aria-hidden="true">▸</span></button>
            <button type="button" className="fai-back" onClick={onExit}>← First Aid Journey</button>
          </div>
        </div>
        <div className="fai-ruled">
          {missed.length ? (
            <>
              <span className="fai-ruled-head">Go back over these pages</span>
              {missed.map((r, i) => (
                <div key={r.q.id} className="fai-ruled-row fahq-ruled-row" style={{ '--i': i }}>
                  <span className="fahq-page">p. {r.q.page}</span>
                  <span>
                    <b>{r.q.options[r.q.correct]}</b>
                    <small>{r.q.topic} — {r.q.stem}</small>
                  </span>
                </div>
              ))}
            </>
          ) : (
            <span className="fai-ruled-head">Every question right. Not a single note to make.</span>
          )}
        </div>
      </div>
    </div>
  );
}

// The book's chapter list, for the contents column (live ones come from the server).
const ALL_CHAPTERS = [
  ['biochem', 'Biochemistry'], ['immuno', 'Immunology'], ['micro', 'Microbiology'], ['path', 'Pathology'],
  ['pharm', 'Pharmacology'], ['cardio', 'Cardiovascular'], ['endo', 'Endocrine'], ['gi', 'Gastrointestinal'],
  ['heme_onc', 'Hematology & Oncology'], ['msk', 'Musculoskeletal & Skin'], ['neuro', 'Neurology'],
  ['psych', 'Psychiatry'], ['renal', 'Renal'], ['repro', 'Reproductive'], ['resp', 'Respiratory'],
].map(([id, name]) => ({ id, name }));

export default function FAHYQs({ onExit }) {
  const exit = onExit || (() => { window.location.href = '/?story=1'; });
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState('endo');
  const [sections, setSections] = useState([]);
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState('opener');
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [flip, setFlip] = useState(false);
  // Study time + Daily Activity (active seconds only — see studySession.js).
  const study = useStudySession({ mode: 'fa_hy_qs', active: phase === 'run', subject: chapter });
  useStudyActivity(phase === 'run' ? 'FA HY Qs' : null, null, 'fa_hy_qs');
  useEffect(() => { if (phase === 'notes') study.flush(); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`${SERVER_URL}/api/fa-hyq/catalog`)
      .then(r => r.json())
      .then(d => setCatalog({ ...d, allChapters: ALL_CHAPTERS }))
      .catch(() => setError('Could not reach the library. Check your connection and try again.'));
  }, []);

  async function start() {
    setError('');
    try {
      const r = await fetch(`${SERVER_URL}/api/fa-hyq/run?chapter=${chapter}&count=${count}&sections=${encodeURIComponent(sections.join(','))}`);
      const d = await r.json();
      if (!d.questions?.length) throw new Error('No questions came back.');
      study.flush();
      study.touch();
      setQs(d.questions); setIdx(0); setPicked(null); setResults([]);
      setPhase('run');
      window.scrollTo(0, 0);
    } catch (err) { setError(err.message); }
  }

  const q = qs[idx];
  const correct = results.filter(r => r.right).length;

  function answer(i) {
    if (!q || picked !== null) return;
    setPicked(i);
    const right = i === q.correct;
    if (right) sfx.correct(); else sfx.wrong();
    setResults(rs => [...rs, { q, right }]);
    study.count(right);
  }

  function next() {
    study.touch();
    if (idx + 1 >= qs.length) { sfx.fanfare(); setPhase('notes'); window.scrollTo(0, 0); return; }
    sfx.next();
    setFlip(true);
    setTimeout(() => {
      setIdx(i => i + 1); setPicked(null); setFlip(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 420);
  }

  const chapterName = (catalog?.chapters || []).find(c => c.id === chapter)?.name || 'Endocrine';
  return (
    <div className="fai fahq">
      <RunningHeader chapter={chapterName} page={phase === 'run' && q ? q.page : phase === 'notes' ? 362 : 329}
        right={phase === 'run' ? <button type="button" className="fai-run-quit" onClick={() => setPhase('notes')}>Close book</button> : null} />
      <main className="fai-sheet">
        {phase === 'opener' && (
          <Opener catalog={catalog} error={error} chapter={chapter} setChapter={setChapter}
            sections={sections} setSections={setSections} count={count} setCount={setCount}
            onStart={start} onExit={exit} />
        )}
        {phase === 'run' && q && (
          <QuestionPage key={q.id} q={q} idx={idx} total={qs.length} correct={correct}
            picked={picked} flip={flip} onAnswer={answer} onNext={next} />
        )}
        {phase === 'notes' && <NotesPage results={results} onAgain={() => setPhase('opener')} onExit={exit} />}
      </main>
    </div>
  );
}
