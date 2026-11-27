import { useEffect, useRef, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import { useStudySession } from '../studySession';
import { useFaRatings, useMyFaRatings, FARatingBar, FARatingTally, FA_RATING_FILTERS } from './FARatings';
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

// One sentence per line: split after . ! ? (allowing a closing quote/bracket
// or the end of a == mark) where the next sentence starts with a capital,
// digit, quote, bracket, Greek letter or a == mark.
const SENTENCE_BREAK = /(?<=[.!?](?:["”')]|==)*)\s+(?=(?:==)?["“(]?[A-Z0-9α-ωΑ-Ω])/;

/**
 * The explanation, laid out to read: each sentence on its own line, and the
 * bank's ==high-yield== phrases in First Aid gold. A mark that runs across a
 * sentence break stays open into the next line.
 */
function Explanation({ text }) {
  let open = false;
  const lines = String(text || '').split(SENTENCE_BREAK).map(sentence => {
    const parts = sentence.split('==');
    const out = parts.map((p, i) => {
      const gold = i === 0 ? open : (open = !open);
      if (!p) return null;
      return gold ? <mark key={i} className="fahq-hy">{p}</mark> : <span key={i}>{p}</span>;
    });
    return out;
  });
  return (
    <div className="fahq-expl">
      {lines.map((l, i) => <p key={i} className="fahq-line" style={{ '--i': i }}>{l}</p>)}
    </div>
  );
}
function RunningHeader({ chapter, page, right, step = 1 }) {
  return (
    <header className="fai-run">
      <span className="fai-run-tab"><b>{page}</b><i>{step === 2 ? 'SECTION II' : 'SECTION III'}</i></span>
      <span className="fai-run-band">
        <b>{(chapter || 'First Aid').toUpperCase()}</b>
        <span className="fai-run-sub">▸ HIGH-YIELD QUESTIONS</span>
        <span className="fai-run-right">{right}</span>
      </span>
    </header>
  );
}

// Ids of this chapter's questions the student last rated one of `keys`.
const ratedIds = (ratings, chapter, keys) => Object.entries(ratings || {})
  .filter(([id, r]) => id.startsWith(`${chapter}-`) && keys.includes(r)).map(([id]) => id);
// Every id of this chapter the student has rated at all.
const allRated = (ratings, chapter) => Object.keys(ratings || {}).filter(id => id.startsWith(`${chapter}-`));

function Opener({ catalog, error, chapter, setChapter, sections, setSections, count, setCount, onStart, onExit, mine, byRating, setByRating, step = 1 }) {
  const chapters = catalog?.chapters || [];
  const picked = chapters.find(c => c.id === chapter);
  const sectionPool = picked ? (sections.length ? picked.sections.filter(s => sections.includes(s.id)).reduce((n, s) => n + s.count, 0) : picked.count) : 0;
  // With a rating filter on, the pool is the rated questions of this chapter
  // (the server intersects them with any picked sections).
  const unratedN = picked ? Math.max(0, picked.count - allRated(mine.ratings, chapter).length) : 0;
  const ratedHere = ratedIds(mine.ratings, chapter, byRating).length + (byRating.includes('unrated') ? unratedN : 0);
  const pool = byRating.length ? Math.min(ratedHere, sectionPool) : sectionPool;
  const toggle = (id) => { sfx.select(); setSections(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])); };
  const toggleRating = (key) => { sfx.select(); setByRating(r => (r.includes(key) ? r.filter(x => x !== key) : [...r, key])); };
  const countFor = (key) => (key === 'unrated' ? unratedN : ratedIds(mine.ratings, chapter, [key]).length);
  return (
    <div className="fai-opener">
      <div className="fai-opener-main">
        <button type="button" className="fai-back" onClick={onExit}>← First Aid Journey</button>
        <p className="fai-kicker">{step === 2 ? 'STEP 2 CK · HIGH-YIELD QUESTIONS' : 'HIGH-YIELD QUESTIONS'}</p>
        <div className="fai-kicker-rule" />
        <h1 className="fai-title">{picked ? picked.name : 'FA HY Qs'}</h1>
        <blockquote className="fai-quote">
          “Know the fact. Then know what it means for the patient.”
          <cite>—the step after the Qbank</cite>
        </blockquote>
        {step === 2 ? (
          <p className="fai-lede">
            Step 2 CK vignettes from First Aid for the Step 2 CK — the next best step, the best initial and the
            most accurate test, and how to manage the patient in front of you. Five options, one best answer;
            every question tells you which First Aid page to go back to.
          </p>
        ) : (
          <p className="fai-lede">
            Clinical vignettes built on the facts you drilled in the FA Qbank — the mechanism behind a finding,
            the test that confirms it, the drug and its catch. Five options, one best answer; every question
            tells you which First Aid page to go back to.
          </p>
        )}

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
        {picked && (
          <div className="fai-setup">
            <span className="fai-setup-label">STUDY BY YOUR RATING <small className="fahq-hint">(none picked = every question)</small></span>
            {!mine.signedIn ? (
              <p className="fahq-hint fahq-rate-note">Sign in and rate questions under each explanation — then you can come back to just your Knowledge Gaps.</p>
            ) : mine.problem === 'missing_table' ? (
              <p className="fahq-hint fahq-rate-note">Ratings are not being saved yet (the database table is missing), so there is nothing to filter by.</p>
            ) : (
              <div className="fai-counts" role="group" aria-label="Study by your rating">
                {FA_RATING_FILTERS.map(r => {
                  const n = countFor(r.key);
                  const on = byRating.includes(r.key);
                  return (
                    <button key={r.key} type="button" className={`fai-count fahq-sec fahq-ratef${on ? ' is-on' : ''}`}
                      aria-pressed={on} disabled={!n && !on} onClick={() => toggleRating(r.key)}>
                      <span aria-hidden="true">{r.icon}</span> {r.label} <small>{n}</small>
                    </button>
                  );
                })}
              </div>
            )}
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
          {pool ? `Start the block — ${byRating.length && sections.length ? 'up to ' : ''}${count && count < pool ? count : pool} questions`
            : !catalog ? 'Loading…' : byRating.length ? 'No questions with that rating here' : 'No questions here yet'}
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

function QuestionPage({ q, idx, total, correct, onAnswer, onNext, picked, flip, rating }) {
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
              <Explanation text={q.explanation} />
              <span className="fahq-review">Review: First Aid p. {q.page} · {q.topic}</span>
              <FARatingBar questionId={q.id} current={rating.ratings[q.id]} onRate={rating.rate}
                onNext={onNext} problem={rating.problem} signedIn={rating.signedIn} />
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

function NotesPage({ results, onAgain, onExit, tally }) {
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
          {tally}
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
// First Aid for the Step 2 CK, Section II.
const ALL_CHAPTERS_STEP2 = [
  ['cardio2', 'Cardiovascular'], ['derm2', 'Dermatology'], ['endo2', 'Endocrinology'], ['epi2', 'Epidemiology'],
  ['ethics2', 'Ethics & Patient Safety'], ['gi2', 'Gastrointestinal'], ['gyn2', 'Gynecology'],
  ['heme2', 'Hematology & Oncology'], ['id2', 'Infectious Disease'], ['msk2', 'Musculoskeletal'],
  ['neuro2', 'Neurology'], ['ob', 'Obstetrics'], ['peds2', 'Pediatrics'], ['psych2', 'Psychiatry'],
  ['pulm2', 'Pulmonary'], ['renal2', 'Renal & Genitourinary'],
].map(([id, name]) => ({ id, name }));
// Which book: ?step=2 is First Aid for the Step 2 CK (First Aid Journey's
// Step 2 tab links here with it); anything else is the Step 1 book.
const readStep = () => (new URLSearchParams(window.location.search).get('step') === '2' ? 2 : 1);
const STEP_DEFAULTS = { 1: { chapter: 'endo', name: 'Endocrine', pages: [329, 362] }, 2: { chapter: 'ob', name: 'Obstetrics', pages: [427, 466] } };

export default function FAHYQs({ onExit }) {
  const [step] = useState(readStep);
  const exit = onExit || (() => { window.location.href = '/?story=fa'; });
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState(STEP_DEFAULTS[step].chapter);
  const [sections, setSections] = useState([]);
  const [count, setCount] = useState(20);
  const [phase, setPhase] = useState('opener');
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [flip, setFlip] = useState(false);
  // "Study by your rating": every rating the student has given in this mode,
  // reloaded whenever the opener is shown so ratings from a block just
  // finished count straight away.
  const [byRating, setByRating] = useState([]);
  const mine = useMyFaRatings('fa_hy_qs', phase === 'opener');
  // Study time + Daily Activity (active seconds only — see studySession.js).
  const study = useStudySession({ mode: 'fa_hy_qs', active: phase === 'run', subject: chapter });
  useStudyActivity(phase === 'run' ? 'FA HY Qs' : null, null, 'fa_hy_qs');
  useEffect(() => { if (phase === 'notes') study.flush(); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`${SERVER_URL}/api/fa-hyq/catalog`)
      .then(r => r.json())
      .then(d => setCatalog({ ...d, chapters: (d.chapters || []).filter(c => (c.step || 1) === step), allChapters: step === 2 ? ALL_CHAPTERS_STEP2 : ALL_CHAPTERS }))
      .catch(() => setError('Could not reach the library. Check your connection and try again.'));
  }, [step]);

  async function start() {
    setError('');
    try {
      const unrated = byRating.includes('unrated');
      const ids = byRating.length ? ratedIds(mine.ratings, chapter, byRating) : [];
      if (byRating.length && !unrated && !ids.length) throw new Error('No questions in this chapter have that rating yet.');
      // POST: with "unrated" on, every rated id of the chapter goes along to be left out.
      const r = await fetch(`${SERVER_URL}/api/fa-hyq/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter, count, sections, ids, unrated, rated: unrated ? allRated(mine.ratings, chapter) : [] }),
      });
      const d = await r.json();
      if (!d.questions?.length) throw new Error(byRating.length ? 'None of the questions with that rating are in the sections you picked.' : 'No questions came back.');
      study.flush();
      study.touch();
      setQs(d.questions); setIdx(0); setPicked(null); setResults([]);
      setPhase('run');
      window.scrollTo(0, 0);
    } catch (err) { setError(err.message); }
  }

  const q = qs[idx];
  // Recall ratings for this run's questions (loaded once per run).
  const rating = useFaRatings('fa_hy_qs', phase === 'opener' ? null : qs.map(x => x.id));
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

  const liveChapter = (catalog?.chapters || []).find(c => c.id === chapter);
  const chapterName = liveChapter?.name || STEP_DEFAULTS[step].name;
  const [firstPage, lastPage] = liveChapter?.pages || STEP_DEFAULTS[step].pages;
  return (
    <div className="fai fahq">
      <RunningHeader step={step} chapter={chapterName} page={phase === 'run' && q ? q.page : phase === 'notes' ? lastPage : firstPage}
        right={phase === 'run' ? <button type="button" className="fai-run-quit" onClick={() => setPhase('notes')}>Close book</button> : null} />
      <main className="fai-sheet">
        {phase === 'opener' && (
          <Opener catalog={catalog} error={error} chapter={chapter} setChapter={setChapter}
            sections={sections} setSections={setSections} count={count} setCount={setCount}
            onStart={start} onExit={exit} mine={mine} byRating={byRating} setByRating={setByRating} step={step} />
        )}
        {phase === 'run' && q && (
          <QuestionPage key={q.id} q={q} idx={idx} total={qs.length} correct={correct}
            picked={picked} flip={flip} onAnswer={answer} onNext={next} rating={rating} />
        )}
        {phase === 'notes' && <NotesPage results={results} tally={<FARatingTally ids={results.map(r => r.q.id)} ratings={rating.ratings} />} onAgain={() => setPhase('opener')} onExit={exit} />}
      </main>
    </div>
  );
}
