import { useCallback, useEffect, useRef, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { sfx } from '../minigameSfx';
import { createFaMusic, musicPref, setMusicPref } from '../faMusic';
import SfxToggle from './SfxToggle';
import './FAImages.css';

/**
 * First Aid Images — a solo figure quiz, dressed as the First Aid book.
 *
 * The figures are the book's own (clinical photos, slides, scans and
 * diagrams with one label blurred), imported by the admin as a pack; this
 * screen only asks for a run and marks it. The look borrows the book's
 * furniture: the teal running header with its plum section tab, the teal
 * section bar, blue sans headings over serif text, lettered figure panels,
 * the chapter-opener table of contents, and the Notes page at the end.
 *
 * Points: 100 for a right answer, up to 100 more for speed, and 20 per answer
 * in a row after the first (capped at +100).
 */

const LETTERS = ['A', 'B', 'C', 'D'];
const COUNT_LABEL = { 0: 'All' };

function pointsFor(msLeft, msTotal, streakBefore) {
  const speed = Math.round(100 * Math.max(0, Math.min(1, msLeft / msTotal)));
  const streak = Math.min(100, 20 * streakBefore);
  return 100 + speed + streak;
}

function RunningHeader({ chapter, page, right }) {
  return (
    <header className="fai-run">
      <span className="fai-run-tab"><b>{page}</b><i>SECTION III</i></span>
      <span className="fai-run-band">
        <b>{(chapter || 'First Aid').toUpperCase()}</b>
        <span className="fai-run-sub">▸ {(chapter || 'First Aid').toUpperCase()}—FIGURES</span>
        <span className="fai-run-right">{right}</span>
      </span>
    </header>
  );
}

// ── The chapter-opener: pick a chapter and a length ─────────────────────────
function Opener({ catalog, error, chapter, setChapter, count, setCount, onStart, onExit }) {
  const chapters = catalog?.chapters || [];
  const picked = chapters.find(c => c.id === chapter);
  const ready = picked && picked.count > 0;
  return (
    <div className="fai-opener">
      <div className="fai-opener-main">
        <button type="button" className="fai-back" onClick={onExit}>← First Aid Journey</button>
        <p className="fai-kicker">HIGH-YIELD FIGURES</p>
        <div className="fai-kicker-rule" />
        <h1 className="fai-title">{picked ? picked.name : 'First Aid Images'}</h1>
        <blockquote className="fai-quote">
          “The picture is the question.”
          <cite>—every Step 1 examiner, more or less</cite>
        </blockquote>
        <p className="fai-lede">
          The photos, slides, scans and diagrams from First Aid. Name what each figure shows —
          and where a diagram has a label <span className="fai-blurword">blurred</span>, recall what it hides.
          Answer fast for more points; answers in a row build a streak.
        </p>

        <div className="fai-setup">
          <span className="fai-setup-label">FIGURES PER RUN</span>
          <div className="fai-counts" role="group" aria-label="Figures per run">
            {(catalog?.counts || [10, 20, 30, 0]).map(n => (
              <button key={n} type="button" className={`fai-count${count === n ? ' is-on' : ''}`}
                aria-pressed={count === n} onClick={() => { sfx.select(); setCount(n); }}>
                {COUNT_LABEL[n] || n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="fai-error">{error}</p>}
        {catalog && !catalog.ready && (
          <p className="fai-error">The figure bank is not set up yet — check back soon.</p>
        )}
        <button type="button" className="fai-start" disabled={!ready} onClick={onStart}>
          {ready ? `Open the chapter — ${count && count < picked.count ? `${count} of ${picked.count}` : `all ${picked.count}`} figures` : catalog ? 'No figures in this chapter yet' : 'Loading…'}
          <span aria-hidden="true">▸</span>
        </button>
        <SfxToggle className="fai-sfx" />
      </div>

      {/* The slate contents column from the book's chapter openers. */}
      <nav className="fai-toc" aria-label="Chapters">
        {chapters.map((c, i) => {
          const live = c.count > 0;
          return (
            <button key={c.id} type="button" disabled={!live}
              className={`fai-toc-row${chapter === c.id ? ' is-on' : ''}${live ? '' : ' is-soon'}`}
              style={{ '--i': i }}
              onClick={() => { sfx.select(); setChapter(c.id); }}>
              <span>▸ {c.name}</span>
              <b>{live ? c.count : 'soon'}</b>
            </button>
          );
        })}
        {!chapters.length && <span className="fai-toc-row is-soon"><span>▸ Loading…</span></span>}
      </nav>
    </div>
  );
}

// ── One figure ─────────────────────────────────────────────────────────────
function FigurePage({ q, idx, total, seconds, score, streak, onAnswer, onNext, picked, flip, paused, onResume }) {
  const [msLeft, setMsLeft] = useState(seconds * 1000);
  const [zoom, setZoom] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Time used so far, banked whenever the clock stops (a pause), so it
  // carries on from where it was rather than from the start.
  const used = useRef(0);
  const noteRef = useRef(null);
  const imgRef = useRef(null);
  // A figure already in the cache can finish loading before React is
  // listening, so check on mount as well as on the load event.
  useEffect(() => {
    const im = imgRef.current;
    if (im && im.complete) setLoaded(true);
  }, []);
  const answered = picked !== null;

  // The clock starts once the figure has printed, not while it downloads,
  // and stands still while the run is paused.
  useEffect(() => {
    if (!loaded || answered || paused) return undefined;
    const from = performance.now();
    let done = false;
    const t = setInterval(() => {
      const left = Math.max(0, seconds * 1000 - (used.current + performance.now() - from));
      setMsLeft(left);
      if (left <= 0 && !done) { done = true; clearInterval(t); onAnswer(-1, 0); }
    }, 100);
    return () => { clearInterval(t); if (!done) used.current += performance.now() - from; };
  }, [loaded, answered, paused, seconds, onAnswer]);

  useEffect(() => {
    function key(e) {
      if (zoom) { if (e.key === 'Escape') setZoom(false); return; }
      if (paused) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onResume(); } return; }
      if (!answered && loaded && /^[1-4]$/.test(e.key)) onAnswer(Number(e.key) - 1, msLeft);
      else if (answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onNext(); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [answered, loaded, msLeft, onAnswer, onNext, zoom, paused, onResume]);

  // Bring the explanation on screen once it appears.
  useEffect(() => {
    if (answered) setTimeout(() => noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 250);
  }, [answered]);

  const frac = msLeft / (seconds * 1000);
  const right = answered && picked === q.correct;
  return (
    <div className={`fai-page${flip ? ' is-turning' : ''}`}>
      <div className="fai-sectionbar">▸ {q.chapter.name.toUpperCase()}—FIGURE {idx + 1}</div>

      <div className="fai-grid">
        <div className="fai-left">
          <h2 className="fai-heading">{q.modality || 'Figure'}</h2>
          <div className="fai-stats">
            <span><i>SCORE</i><b>{score}</b></span>
            <span><i>STREAK</i><b>{streak}</b></span>
            <span><i>FIGURE</i><b>{idx + 1}/{total}</b></span>
          </div>
          {/* The plum ribbon: the clock, drawn as a bookmark that shortens. */}
          <div className={`fai-ribbon${frac < 0.3 && !answered ? ' is-low' : ''}`} aria-label={`${Math.ceil(msLeft / 1000)} seconds left`}>
            <span style={{ height: `${Math.max(0, frac) * 100}%` }} />
            <b>{answered ? '—' : Math.ceil(msLeft / 1000)}</b>
          </div>
        </div>

        <div className="fai-main">
          {/* Paused: the book is shut over the figure and the options, so a
              pause cannot be used to study the picture off the clock. */}
          {paused && (
            <div className="fai-paused" role="dialog" aria-label="Paused">
              <span className="fai-paused-book" aria-hidden="true"><i /><i /></span>
              <b>Paused</b>
              <small>{answered ? 'Take a breather — open the book when you are ready.' : `The clock has stopped at ${Math.ceil(msLeft / 1000)} s.`}</small>
              <button type="button" className="fai-start" onClick={onResume} autoFocus>Open the book again <span aria-hidden="true">▸</span></button>
            </div>
          )}
          <p className="fai-prompt">{q.prompt}</p>
          <button type="button" className={`fai-figure${loaded ? ' is-printed' : ''}`} onClick={() => setZoom(true)} aria-label="Enlarge the figure">
            <img ref={imgRef} src={q.image} alt="" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} draggable="false" />
            <span className="fai-zoomhint">⤢ enlarge</span>
          </button>

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
                  disabled={answered || !loaded} onClick={() => onAnswer(i, msLeft)}>
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
              <span className="fai-note-head">
                {picked === -1 ? 'Out of time' : right ? 'Correct' : 'Not quite'} — {q.answer}
              </span>
              {q.explanation && <p>{q.explanation}</p>}
              <button type="button" className="fai-next" onClick={onNext} autoFocus>
                {idx + 1 >= total ? 'Close the book' : 'Turn the page'} <span aria-hidden="true">▸</span>
              </button>
            </aside>
          )}
        </div>
      </div>

      {zoom && (
        <div className="fai-zoom" role="dialog" aria-label="Figure, enlarged" onClick={() => setZoom(false)}>
          <img src={q.image} alt="" />
          <span>Click anywhere or press Esc to close</span>
        </div>
      )}
    </div>
  );
}

// ── The Notes page at the back ─────────────────────────────────────────────
function NotesPage({ results, score, best, onAgain, onExit }) {
  const right = results.filter(r => r.right).length;
  const pct = results.length ? Math.round((right / results.length) * 100) : 0;
  const missed = results.filter(r => !r.right);
  return (
    <div className="fai-page fai-notes">
      <div className="fai-sectionbar">▸ NOTES</div>
      <div className="fai-notes-grid">
        <div className="fai-notes-score">
          <span className="fai-kicker">YOUR RUN</span>
          <b className="fai-big">{score}</b>
          <span className="fai-notes-line">{right} of {results.length} figures · {pct}%</span>
          <span className="fai-notes-line">Best streak: {best}</span>
          <div className="fai-notes-actions">
            <button type="button" className="fai-start" onClick={onAgain}>Read it again <span aria-hidden="true">▸</span></button>
            <button type="button" className="fai-back" onClick={onExit}>← First Aid Journey</button>
          </div>
        </div>
        <div className="fai-ruled">
          {missed.length ? (
            <>
              <span className="fai-ruled-head">Go back over these</span>
              {missed.map((r, i) => (
                <div key={r.q.id} className="fai-ruled-row" style={{ '--i': i }}>
                  <img src={r.q.image} alt="" />
                  <span>
                    <b>{r.q.answer}</b>
                    <small>{r.q.prompt}</small>
                  </span>
                </div>
              ))}
            </>
          ) : (
            <span className="fai-ruled-head">Every figure named. Not a single note to make.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FAImages({ onExit }) {
  const exit = onExit || (() => { window.location.href = '/?story=1'; });
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState('endo');
  const [count, setCount] = useState(10);
  const [phase, setPhase] = useState('opener');   // opener | loading | run | notes
  const [run, setRun] = useState(null);           // { seconds, questions }
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [results, setResults] = useState([]);
  const [flip, setFlip] = useState(false);
  const [paused, setPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(musicPref);
  const music = useRef(null);
  if (!music.current) music.current = createFaMusic();

  // The study music plays during a run, while not paused, if it is switched on.
  useEffect(() => {
    if (phase === 'run' && !paused && musicOn) music.current.start();
    else music.current.stop();
  }, [phase, paused, musicOn]);
  useEffect(() => () => music.current.stop(), []);

  // P pauses and resumes from anywhere in a run.
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const key = (e) => { if (e.key === 'p' || e.key === 'P') setPaused(p => !p); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase]);

  function toggleMusic() {
    setMusicOn(on => { setMusicPref(!on); return !on; });
  }

  useEffect(() => {
    fetch(`${SERVER_URL}/api/fa-images/catalog`)
      .then(r => r.json())
      .then(d => {
        setCatalog(d);
        // Land on a chapter that has figures.
        const live = (d.chapters || []).filter(c => c.count > 0);
        if (live.length && !live.some(c => c.id === 'endo')) setChapter(live[0].id);
      })
      .catch(() => setError('Could not reach the library. Check your connection and try again.'));
  }, []);

  async function start() {
    setPhase('loading');
    setError('');
    try {
      const r = await fetch(`${SERVER_URL}/api/fa-images/solo?chapters=${chapter}&count=${count}`);
      const d = await r.json();
      if (!d.questions?.length) throw new Error(d.error || 'No figures came back.');
      // Warm the next few figures so pages turn without a wait.
      d.questions.slice(0, 4).forEach(q => { const im = new Image(); im.src = q.image; });
      setPaused(false);
      setRun(d); setIdx(0); setPicked(null); setScore(0); setStreak(0); setBest(0); setResults([]);
      setPhase('run');
    } catch (err) {
      setError(err.message);
      setPhase('opener');
    }
  }

  const q = run?.questions[idx];

  const answer = useCallback((choice, msLeft) => {
    if (!q || picked !== null) return;
    setPicked(choice);
    const right = choice === q.correct;
    if (right) {
      const pts = pointsFor(msLeft, run.seconds * 1000, streak);
      setScore(s => s + pts);
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n; });
      sfx.correct();
      if (streak + 1 >= 3 && (streak + 1) % 3 === 0) sfx.sparkle();
    } else {
      setStreak(0);
      sfx.wrong();
    }
    setResults(rs => [...rs, { q, right }]);
  }, [q, picked, run, streak]);

  const next = useCallback(() => {
    if (!run) return;
    if (idx + 1 >= run.questions.length) { sfx.fanfare(); setPhase('notes'); return; }
    sfx.next();
    setFlip(true);
    // The page turns, then the next one is printed underneath.
    setTimeout(() => {
      const after = run.questions[idx + 4];
      if (after) { const im = new Image(); im.src = after.image; }
      setIdx(i => i + 1); setPicked(null); setFlip(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 420);
  }, [run, idx]);

  const chapterName = (catalog?.chapters || []).find(c => c.id === chapter)?.name || 'Endocrine';

  return (
    <div className="fai">
      <RunningHeader chapter={chapterName} page={phase === 'run' ? 330 + idx : phase === 'notes' ? 362 : 329}
        right={phase === 'run' ? (
          <span className="fai-run-tools">
            <button type="button" className={`fai-run-quit${musicOn ? ' is-on' : ''}`} onClick={toggleMusic}
              aria-pressed={musicOn} title="Background music">{musicOn ? '♫ Music on' : '♫ Music off'}</button>
            <button type="button" className="fai-run-quit" onClick={() => setPaused(p => !p)} aria-pressed={paused}>
              {paused ? '▶ Resume' : '❚❚ Pause'}
            </button>
            <button type="button" className="fai-run-quit" onClick={() => { setPaused(false); setPhase('notes'); }}>Close book</button>
          </span>
        ) : null} />
      <main className="fai-sheet">
        {(phase === 'opener' || phase === 'loading') && (
          <Opener catalog={catalog} error={error} chapter={chapter} setChapter={setChapter}
            count={count} setCount={setCount} onStart={start} onExit={exit} />
        )}
        {phase === 'run' && q && (
          <FigurePage key={q.id} q={q} idx={idx} total={run.questions.length} seconds={run.seconds}
            score={score} streak={streak} picked={picked} flip={flip}
            paused={paused} onResume={() => setPaused(false)}
            onAnswer={answer} onNext={next} />
        )}
        {phase === 'notes' && (
          <NotesPage results={results} score={score} best={best}
            onAgain={() => setPhase('opener')} onExit={exit} />
        )}
      </main>
    </div>
  );
}
