import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import { useFaRatings, useMyFaRatings, FA_RATING_GROUPS, FA_RATINGS, FA_RATING_FILTERS } from './FARatings';
import './InnerCircle.css';

/**
 * Inner Circle — Story Mode's Step 2 CK campaign. Its Qbank is built for
 * learning rather than for looking like an exam:
 *
 *   • a reading column held to ~68 characters, set in Atkinson Hyperlegible
 *     (a typeface drawn for legibility) at a comfortable size and leading,
 *     with three reading themes and three text sizes the student can pick;
 *   • colour that means something — green/red only for right/wrong (always
 *     with a ✓/✗ so it never depends on colour alone), gold only for the
 *     line to remember;
 *   • the explanation one sentence per line, the key phrase marked, and a
 *     single "take-home" line boxed apart so it is the last thing read;
 *   • 30 seconds a question on a ring clock that can be paused at any time
 *     (button or P; the question is hidden while paused, and the clock
 *     also pauses itself if the tab is left);
 *   • any mix of topics, or all of them, and "study by your rating" with the
 *     six recall ratings (fa_question_ratings, mode inner_circle).
 */

const SECONDS = 30;
const IMAGE_BONUS = 10;   // extra seconds on a picture question
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const COUNT_LABEL = { 0: 'All' };
const RATING_MODE = 'inner_circle';

// First Aid for the Step 2 CK-style system list; live ones come from the server.
const ALL_SYSTEMS = [
  ['endo', 'Endocrinology', '🦋'], ['cardio', 'Cardiology', '🫀'], ['pulm', 'Pulmonology', '🫁'],
  ['gi', 'Gastroenterology', '🍽️'], ['renal', 'Nephrology', '💧'], ['heme', 'Hematology & Oncology', '🩸'],
  ['id', 'Infectious Disease', '🦠'], ['neuro', 'Neurology', '🧠'], ['psych', 'Psychiatry', '💭'],
  ['ob', 'Obstetrics', '🤰'], ['gyn', 'Gynecology', '🌸'], ['peds', 'Pediatrics', '🧸'],
  ['msk', 'Rheumatology & MSK', '🦴'], ['derm', 'Dermatology', '🧴'], ['ethics', 'Ethics & Biostatistics', '⚖️'],
].map(([id, name, icon]) => ({ id, name, icon }));

// ── Reading preferences (per device; a convenience, so failures are ignored) ──
const PREFS_KEY = 'mv_ic_prefs';
const THEMES = [
  { id: 'day', label: 'Day', swatch: '#fbf8f2' },
  { id: 'sepia', label: 'Sepia', swatch: '#f3e7cf' },
  { id: 'night', label: 'Night', swatch: '#151a2c' },
];
const SIZES = ['S', 'M', 'L'];
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return { theme: THEMES.some(t => t.id === p.theme) ? p.theme : 'day', size: [0, 1, 2].includes(p.size) ? p.size : 1 };
  } catch { return { theme: 'day', size: 1 }; }
}
function savePrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* not remembered */ } }

// One sentence per line: split after . ! ? (allowing a closing quote/bracket
// or the end of a == mark) where the next sentence starts with a capital,
// digit, quote or bracket (or a == mark).
const SENTENCE_BREAK = /(?<=[.!?](?:["”')]|==)*)\s+(?=(?:==)?["“(]?[A-Z0-9])/;

function Explanation({ text }) {
  let open = false;
  const lines = String(text || '').split(SENTENCE_BREAK).map(sentence => sentence.split('==').map((p, i) => {
    const gold = i === 0 ? open : (open = !open);
    if (!p) return null;
    return gold ? <mark key={i} className="ic-key">{p}</mark> : <span key={i}>{p}</span>;
  }));
  return (
    <div className="ic-expl">
      {lines.map((l, i) => <p key={i} className="ic-expl-line" style={{ '--i': i }}>{l}</p>)}
    </div>
  );
}

/**
 * A picture from the notes: under the stem (an image question) or under the
 * explanation. Click or Enter opens it full screen; Esc or a click closes it.
 */
function Figure({ src, alt, caption, className = '' }) {
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!zoom) return undefined;
    // While enlarged, keys belong to the picture: no answering or skipping behind it.
    const key = (e) => {
      e.stopPropagation();
      if (['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setZoom(false); }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [zoom]);
  if (failed) return null;
  return (
    <figure className={`ic-fig ${className}`}>
      <button type="button" className="ic-fig-btn" onClick={() => setZoom(true)} aria-label={`Enlarge picture: ${alt}`}>
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        <span className="ic-fig-zoom" aria-hidden="true">⤢</span>
      </button>
      {caption && <figcaption>{caption}</figcaption>}
      {zoom && (
        <div className="ic-lightbox" role="dialog" aria-label={alt} onClick={() => setZoom(false)}>
          <img src={src} alt={alt} />
          <button type="button" className="ic-lightbox-x" aria-label="Close picture" autoFocus>✕</button>
        </div>
      )}
    </figure>
  );
}

/** The clock as a ring that empties; amber in the last 10 s. */
function RingClock({ msLeft, total = SECONDS, paused, done }) {
  const frac = Math.max(0, Math.min(1, msLeft / (total * 1000)));
  const r = 22;
  const c = 2 * Math.PI * r;
  const secs = Math.ceil(msLeft / 1000);
  const low = !done && secs <= 10;
  return (
    <div className={`ic-ring${low ? ' is-low' : ''}${paused ? ' is-paused' : ''}${done ? ' is-done' : ''}`}
      role="timer" aria-label={done ? 'Answered' : `${secs} seconds left${paused ? ', paused' : ''}`}>
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle className="ic-ring-track" cx="26" cy="26" r={r} />
        <circle className="ic-ring-fill" cx="26" cy="26" r={r}
          strokeDasharray={c} strokeDashoffset={c * (1 - (done ? 0 : frac))} />
      </svg>
      <b>{done ? '✓' : paused ? 'II' : secs}</b>
    </div>
  );
}

function ReadingPrefs({ prefs, setPrefs }) {
  const set = (p) => { const next = { ...prefs, ...p }; setPrefs(next); savePrefs(next); sfx.select(); };
  return (
    <div className="ic-prefs" role="group" aria-label="Reading settings">
      <div className="ic-prefs-group" role="radiogroup" aria-label="Reading theme">
        {THEMES.map(t => (
          <button key={t.id} type="button" role="radio" aria-checked={prefs.theme === t.id} title={`${t.label} theme`}
            className={`ic-swatch${prefs.theme === t.id ? ' is-on' : ''}`} style={{ '--sw': t.swatch }}
            onClick={() => set({ theme: t.id })}>
            <span className="ic-sr">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="ic-prefs-group" role="radiogroup" aria-label="Text size">
        {SIZES.map((s, i) => (
          <button key={s} type="button" role="radio" aria-checked={prefs.size === i} title={`Text size ${s}`}
            className={`ic-size ic-size--${i}${prefs.size === i ? ' is-on' : ''}`} onClick={() => set({ size: i })}>
            A
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Opener ────────────────────────────────────────────────────────────────

function TopicPicker({ system, topics, setTopics }) {
  const [open, setOpen] = useState(() => new Set());
  const has = (id) => topics.includes(id);
  const toggleTopic = (id) => { sfx.select(); setTopics(t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id])); };
  const toggleSection = (sec) => {
    sfx.select();
    const ids = sec.topics.map(t => t.id);
    const all = ids.every(has);
    setTopics(t => (all ? t.filter(x => !ids.includes(x)) : [...new Set([...t, ...ids])]));
  };
  const toggleOpen = (id) => setOpen(o => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="ic-sections">
      {system.sections.map((sec, si) => {
        const picked = sec.topics.filter(t => has(t.id)).length;
        const state = picked === 0 ? 'none' : picked === sec.topics.length ? 'all' : 'some';
        const isOpen = open.has(sec.id);
        return (
          <section key={sec.id} className={`ic-sec${isOpen ? ' is-open' : ''}`} style={{ '--i': si }}>
            <div className="ic-sec-head">
              <button type="button" className={`ic-check is-${state}`} role="checkbox"
                aria-checked={state === 'all' ? 'true' : state === 'some' ? 'mixed' : 'false'}
                aria-label={`All of ${sec.id}`} onClick={() => toggleSection(sec)}>
                <span aria-hidden="true">{state === 'all' ? '✓' : state === 'some' ? '–' : ''}</span>
              </button>
              <button type="button" className="ic-sec-title" aria-expanded={isOpen} onClick={() => toggleOpen(sec.id)}>
                <span className="ic-sec-name">{sec.id}</span>
                <span className="ic-sec-meta">
                  {picked ? `${picked} of ${sec.topics.length} topics` : `${sec.topics.length} topics`} · {sec.count} q
                </span>
                <span className="ic-sec-caret" aria-hidden="true">▾</span>
              </button>
            </div>
            {isOpen && (
              <div className="ic-topics" role="group" aria-label={`${sec.id} topics`}>
                {sec.topics.map(t => (
                  <button key={t.id} type="button" className={`ic-topic${has(t.id) ? ' is-on' : ''}`}
                    aria-pressed={has(t.id)} onClick={() => toggleTopic(t.id)}>
                    <span className="ic-topic-tick" aria-hidden="true">{has(t.id) ? '✓' : '+'}</span>
                    {t.id} <small>{t.count}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Opener({ catalog, error, systemId, setSystemId, topics, setTopics, count, setCount, byRating, setByRating, mine, onStart, onExit }) {
  const live = catalog?.systems || [];
  const system = live.find(s => s.id === systemId);
  const allTopics = system ? system.sections.flatMap(s => s.topics) : [];
  // The questions in play: the picked topics, or the whole system.
  const poolIds = useMemo(() => {
    if (!system) return [];
    return topics.length ? allTopics.filter(t => topics.includes(t.id)).flatMap(t => t.ids) : system.ids;
  }, [system, topics]); // eslint-disable-line react-hooks/exhaustive-deps
  const countFor = (key) => (key === 'unrated'
    ? poolIds.filter(id => !mine.ratings[id]).length
    : poolIds.filter(id => mine.ratings[id] === key).length);
  const pool = byRating.length ? byRating.reduce((n, k) => n + countFor(k), 0) : poolIds.length;
  const blockN = count && count < pool ? count : pool;
  const toggleRating = (key) => { sfx.select(); setByRating(r => (r.includes(key) ? r.filter(x => x !== key) : [...r, key])); };

  return (
    <div className="ic-opener">
      <aside className="ic-rail" aria-label="Systems">
        <span className="ic-eyebrow">SYSTEMS</span>
        {ALL_SYSTEMS.map((s, i) => {
          const l = live.find(x => x.id === s.id);
          return (
            <button key={s.id} type="button" disabled={!l} style={{ '--i': i }}
              className={`ic-rail-row${systemId === s.id ? ' is-on' : ''}${l ? '' : ' is-soon'}`}
              onClick={() => { sfx.select(); setSystemId(s.id); setTopics([]); setByRating([]); }}>
              <span className="ic-rail-icon" aria-hidden="true">{s.icon}</span>
              <span className="ic-rail-name">{s.name}</span>
              <b>{l ? l.count : 'soon'}</b>
            </button>
          );
        })}
      </aside>

      <div className="ic-setup">
        <span className="ic-eyebrow">STEP 2 CK · QBANK</span>
        <h1 className="ic-title">{system?.name || 'Endocrinology'}</h1>
        <p className="ic-lede">
          Short clinical vignettes on every high-yield concept in the Inner Circle notes. Thirty seconds a question,
          then a clear explanation in full sentences and one line to take home. Rate how well you knew each one, and
          come back to your knowledge gaps later.
        </p>

        <div className="ic-howto" aria-label="How it works">
          <span><b>30 s</b> per question</span>
          {system?.images > 0 && <span><b>{system.images}</b> picture questions · <b>+10 s</b> each</span>}
          <span><b>Pause</b> any time · <kbd>P</kbd></span>
          <span><kbd>1</kbd>–<kbd>5</kbd> answer · <kbd>Enter</kbd> next</span>
          <span className="ic-howto-mouse"><b>Right-click</b> an option to cross it out</span>
        </div>

        {system && (
          <div className="ic-block">
            <div className="ic-block-head">
              <h2 className="ic-h2">Topics</h2>
              <span className="ic-hint">{topics.length ? `${topics.length} picked` : 'None picked = every topic'}</span>
              <div className="ic-block-actions">
                <button type="button" className="ic-link" onClick={() => { sfx.select(); setTopics(allTopics.map(t => t.id)); }}>Select all</button>
                <button type="button" className="ic-link" disabled={!topics.length} onClick={() => { sfx.select(); setTopics([]); }}>Clear</button>
              </div>
            </div>
            <TopicPicker system={system} topics={topics} setTopics={setTopics} />
          </div>
        )}

        {system && (
          <div className="ic-block">
            <div className="ic-block-head">
              <h2 className="ic-h2">Study by your rating</h2>
              <span className="ic-hint">None picked = every question</span>
            </div>
            {!mine.signedIn ? (
              <p className="ic-note">Sign in, then rate questions under each explanation — you can come back to just your Knowledge Gaps.</p>
            ) : mine.problem === 'missing_table' ? (
              <p className="ic-note">Ratings are not being saved yet (the database table is missing), so there is nothing to filter by.</p>
            ) : (
              <div className="ic-chips" role="group" aria-label="Study by your rating">
                {FA_RATING_FILTERS.map(r => {
                  const n = countFor(r.key);
                  const on = byRating.includes(r.key);
                  return (
                    <button key={r.key} type="button" className={`ic-chip ic-chip--${r.key}${on ? ' is-on' : ''}`}
                      aria-pressed={on} disabled={!n && !on} onClick={() => toggleRating(r.key)}>
                      <span aria-hidden="true">{r.icon}</span> {r.label} <small>{n}</small>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="ic-block">
          <div className="ic-block-head"><h2 className="ic-h2">Questions per block</h2></div>
          <div className="ic-chips" role="radiogroup" aria-label="Questions per block">
            {(catalog?.counts || [10, 20, 40, 0]).map(n => (
              <button key={n} type="button" role="radio" aria-checked={count === n}
                className={`ic-chip ic-chip--count${count === n ? ' is-on' : ''}`}
                onClick={() => { sfx.select(); setCount(n); }}>
                {COUNT_LABEL[n] || n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="ic-error" role="alert">{error}</p>}
        <div className="ic-start-row">
          <button type="button" className="ic-start" disabled={!pool} onClick={onStart}>
            {pool ? <>Start block <span className="ic-start-n">{blockN} questions · ~{Math.max(1, Math.round((blockN * 75) / 60))} min</span></>
              : !catalog ? 'Loading…' : byRating.length ? 'No questions with that rating here' : 'No questions here yet'}
          </button>
          <button type="button" className="ic-link" onClick={onExit}>← Story Mode</button>
        </div>
      </div>
    </div>
  );
}

// ── A question ────────────────────────────────────────────────────────────

function QuestionView({ q, idx, total, results, picked, onAnswer, onNext, paused, setPaused, rating }) {
  const answered = picked !== null;
  // Picture questions get 10 extra seconds to look at the image.
  const limit = q.image ? SECONDS + IMAGE_BONUS : SECONDS;
  const [msLeft, setMsLeft] = useState(limit * 1000);
  const [struck, setStruck] = useState(() => new Set());
  const noteRef = useRef(null);
  // The clock reads the latest handler and pause state through refs, so a
  // re-render never restarts the 30 seconds and pausing banks the time left.
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    if (answered) return undefined;
    let left = limit * 1000;
    let last = performance.now();
    let done = false;
    const t = setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current) left -= now - last;
      last = now;
      setMsLeft(Math.max(0, left));
      if (left <= 0 && !done) { done = true; clearInterval(t); answerRef.current(-1); }
    }, 100);
    return () => clearInterval(t);
  }, [answered, limit]);

  useEffect(() => {
    function key(e) {
      if (e.target.closest?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if (k === 'p' && !answered) { e.preventDefault(); setPaused(p => !p); return; }
      if (paused) return;
      const n = /^[1-5]$/.test(k) ? Number(k) - 1 : LETTERS.map(l => l.toLowerCase()).indexOf(k);
      if (!answered && n >= 0 && n < q.options.length) onAnswer(n);
      else if (answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onNext(); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [answered, paused, onAnswer, onNext, setPaused, q]);

  useEffect(() => {
    if (answered) setTimeout(() => noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
  }, [answered]);

  const right = answered && picked === q.correct;
  const strike = (e, i) => {
    e.preventDefault();
    if (answered) return;
    setStruck(s => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };
  return (
    <div className="ic-q">
      <div className="ic-q-top">
        <div className="ic-progress" aria-label={`Question ${idx + 1} of ${total}`}>
          {Array.from({ length: total }, (_, i) => {
            const r = results[i];
            const cls = r ? (r.right ? ' is-right' : ' is-wrong') : i === idx ? ' is-now' : '';
            return <span key={i} className={`ic-pip${cls}`} />;
          })}
        </div>
        <div className="ic-q-meta">
          <span className="ic-crumb">{q.section} <i aria-hidden="true">›</i> <b>{q.topic}</b></span>
          <span className="ic-count">Question {idx + 1} <small>of {total}</small></span>
        </div>
        <div className="ic-clock">
          <RingClock msLeft={msLeft} total={limit} paused={paused} done={answered} />
          {!answered && (
            <button type="button" className="ic-pause" onClick={() => { sfx.select(); setPaused(p => !p); }}
              aria-label={paused ? 'Resume' : 'Pause'} title={paused ? 'Resume (P)' : 'Pause (P)'}>
              {paused ? '▶' : '❚❚'}
            </button>
          )}
        </div>
      </div>

      <div className={`ic-card${paused ? ' is-hidden' : ''}`} aria-hidden={paused}>
        <p className="ic-stem">{q.stem}</p>
        {q.image && <Figure src={q.image} alt={q.imageAlt || 'Question picture'} className="ic-fig--stem" />}
        <div className="ic-options" role="group" aria-label="Answer options">
          {q.options.map((o, i) => {
            let cls = '';
            if (answered) cls = i === q.correct ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
            else if (struck.has(i)) cls = ' is-struck';
            return (
              <button key={o} type="button" className={`ic-opt${cls}`} style={{ '--i': i }}
                disabled={answered || paused} onClick={() => onAnswer(i)} onContextMenu={(e) => strike(e, i)}>
                <span className="ic-opt-key">{LETTERS[i]}</span>
                <span className="ic-opt-text">{o}</span>
                {answered && i === q.correct && <span className="ic-opt-mark" aria-label="correct answer">✓</span>}
                {answered && i === picked && i !== q.correct && <span className="ic-opt-mark" aria-label="your answer">✗</span>}
              </button>
            );
          })}
        </div>
      </div>

      {paused && (
        <div className="ic-paused" role="dialog" aria-label="Paused">
          <span className="ic-paused-ring" aria-hidden="true" />
          <h2>Paused</h2>
          <p>{Math.ceil(msLeft / 1000)} seconds left on this question. The question is hidden until you come back.</p>
          <button type="button" className="ic-start ic-start--sm" autoFocus onClick={() => { sfx.select(); setPaused(false); }}>
            Resume <kbd>P</kbd>
          </button>
        </div>
      )}

      {answered && (
        <section ref={noteRef} className={`ic-answer${right ? ' is-right' : ' is-wrong'}`} aria-live="polite">
          <header className="ic-answer-head">
            <span className="ic-verdict">{right ? '✓ Correct' : picked === -1 ? "⏱ Time's up" : '✗ Not quite'}</span>
            <span className="ic-answer-is">Answer: <b>{LETTERS[q.correct]}. {q.options[q.correct]}</b></span>
          </header>
          <Explanation text={q.explanation} />
          {q.explanationImage && (
            <Figure src={q.explanationImage} alt={`Notes figure for ${q.topic}`} caption={`From the notes · ${q.topic}`} className="ic-fig--expl" />
          )}
          <div className="ic-takehome">
            <span className="ic-eyebrow">TAKE-HOME</span>
            <p>{q.takeHome}</p>
          </div>
          <span className="ic-source">Inner Circle notes · p. {q.page} · {q.topic}</span>
          <RatingBar q={q} rating={rating} onNext={onNext} />
          <button type="button" className="ic-start ic-next" onClick={onNext} autoFocus>
            {idx + 1 >= total ? 'See my results' : 'Next question'} <kbd>Enter</kbd>
          </button>
        </section>
      )}
    </div>
  );
}

function RatingBar({ q, rating, onNext }) {
  if (!rating.signedIn) return <p className="ic-note">Sign in to rate your recall and build a Knowledge Gap list.</p>;
  const current = rating.ratings[q.id];
  return (
    <div className="ic-rate" role="group" aria-label="How well did you know this?">
      <span className="ic-rate-q">How well did you know it?</span>
      {FA_RATING_GROUPS.map(g => (
        <div key={g.label} className="ic-rate-group">
          <span className="ic-rate-label">{g.label}</span>
          <div className="ic-rate-row">
            {g.items.map(it => (
              <button key={it.key} type="button" aria-pressed={current === it.key}
                className={`ic-rate-btn ic-rate-btn--${it.key}${current === it.key ? ' is-on' : ''}`}
                onClick={() => { sfx.select(); rating.rate(q.id, it.key); setTimeout(onNext, 380); }}>
                <span aria-hidden="true">{it.icon}</span> {it.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {rating.problem === 'missing_mode' && <p className="ic-warn">Ratings are not saving yet — inner-circle-ratings-migration.sql needs running in the database.</p>}
      {rating.problem === 'missing_table' && <p className="ic-warn">Ratings are not saving yet — inner-circle-ratings-migration.sql needs running in the database.</p>}
      {rating.problem === 'failed' && <p className="ic-warn">That rating did not save — check your connection.</p>}
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────

function Results({ results, ratings, onRetry, onAgain, onExit }) {
  const right = results.filter(r => r.right).length;
  const pct = results.length ? Math.round((right / results.length) * 100) : 0;
  const byTopic = {};
  results.forEach(r => {
    const t = (byTopic[r.q.topic] ||= { section: r.q.section, right: 0, total: 0 });
    t.total += 1; if (r.right) t.right += 1;
  });
  const missed = results.filter(r => !r.right);
  const tally = FA_RATINGS.map(r => ({ ...r, n: results.filter(x => ratings[x.q.id] === r.key).length })).filter(r => r.n);
  const C = 2 * Math.PI * 54;
  return (
    <div className="ic-results">
      <div className="ic-score">
        <div className="ic-score-ring" aria-label={`${pct}% correct`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ic-ring-track" cx="60" cy="60" r="54" />
            <circle className="ic-score-fill" cx="60" cy="60" r="54" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          </svg>
          <b>{pct}<small>%</small></b>
        </div>
        <p className="ic-score-line">{right} of {results.length} correct</p>
        {tally.length > 0 && (
          <div className="ic-tally" aria-label="Your ratings this block">
            {tally.map(t => <span key={t.key} className={`ic-chip ic-chip--${t.key} is-static`}><span aria-hidden="true">{t.icon}</span> {t.label} <small>{t.n}</small></span>)}
          </div>
        )}
        <div className="ic-score-actions">
          {missed.length > 0 && <button type="button" className="ic-start" onClick={() => onRetry(missed.map(m => m.q.id))}>Retry the {missed.length} I missed</button>}
          <button type="button" className={missed.length ? 'ic-ghost' : 'ic-start'} onClick={onAgain}>New block</button>
          <button type="button" className="ic-link" onClick={onExit}>← Story Mode</button>
        </div>
      </div>

      <div className="ic-review">
        <h2 className="ic-h2">By topic</h2>
        <div className="ic-topic-bars">
          {Object.entries(byTopic).sort((a, b) => (a[1].right / a[1].total) - (b[1].right / b[1].total)).map(([t, v]) => (
            <div key={t} className="ic-bar">
              <span className="ic-bar-name">{t}</span>
              <span className="ic-bar-track"><span style={{ width: `${(v.right / v.total) * 100}%` }} /></span>
              <b>{v.right}/{v.total}</b>
            </div>
          ))}
        </div>

        <h2 className="ic-h2">{missed.length ? 'Your review sheet' : 'Nothing to review'}</h2>
        {missed.length ? (
          <ol className="ic-sheet">
            {missed.map(r => (
              <li key={r.q.id}>
                <span className="ic-sheet-topic">{r.q.topic} · p. {r.q.page}</span>
                <b>{r.q.options[r.q.correct]}</b>
                <p>{r.q.takeHome}</p>
              </li>
            ))}
          </ol>
        ) : <p className="ic-note">Every question right — not a single line to write down.</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function InnerCircle({ onExit }) {
  const exit = onExit || (() => { window.location.href = '/?story=1'; });
  const [prefs, setPrefs] = useState(loadPrefs);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [systemId, setSystemId] = useState('endo');
  const [topics, setTopics] = useState([]);
  const [count, setCount] = useState(20);
  const [byRating, setByRating] = useState([]);
  const [phase, setPhase] = useState('opener'); // opener | run | results
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [paused, setPaused] = useState(false);

  const mine = useMyFaRatings(RATING_MODE, phase === 'opener');
  const rating = useFaRatings(RATING_MODE, phase === 'opener' ? null : qs.map(x => x.id));
  // Study time counts only while a question or its explanation is on screen
  // and not paused.
  const study = useStudySession({ mode: RATING_MODE, active: phase === 'run' && !paused, subject: systemId });
  useStudyActivity(phase === 'run' ? 'Inner Circle' : null, null, RATING_MODE);
  useEffect(() => { if (phase === 'results') study.flush(); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`${SERVER_URL}/api/inner-circle/catalog`)
      .then(r => r.json())
      .then(setCatalog)
      .catch(() => setError('Could not reach the question bank. Check your connection and try again.'));
  }, []);

  // Leaving the tab mid-question pauses the clock.
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const onVis = () => { if (document.hidden && picked === null) setPaused(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase, picked]);

  async function start(retryIds) {
    setError('');
    try {
      const system = catalog?.systems.find(s => s.id === systemId);
      const all = system?.ids || [];
      let body;
      if (retryIds) {
        body = { system: systemId, topics: [], count: 0, ids: retryIds };
      } else {
        const unrated = byRating.includes('unrated');
        const ids = byRating.length ? all.filter(id => byRating.includes(mine.ratings[id])) : [];
        if (byRating.length && !unrated && !ids.length) throw new Error('No questions here have that rating yet.');
        body = { system: systemId, topics, count, ids, unrated, rated: unrated ? all.filter(id => mine.ratings[id]) : [] };
      }
      const r = await fetch(`${SERVER_URL}/api/inner-circle/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!d.questions?.length) throw new Error(byRating.length ? 'None of the questions with that rating are in the topics you picked.' : 'No questions came back.');
      study.flush();
      study.touch();
      setQs(d.questions); setIdx(0); setPicked(null); setResults([]); setPaused(false);
      setPhase('run');
      window.scrollTo(0, 0);
    } catch (err) { setError(err.message); if (retryIds) setPhase('opener'); }
  }

  const q = qs[idx];
  const answer = useCallback((i) => {
    if (!q || picked !== null) return;
    setPicked(i);
    setPaused(false);
    const right = i === q.correct;
    if (right) sfx.correct(); else sfx.wrong();
    setResults(rs => [...rs, { q, right }]);
    study.count(right);
  }, [q, picked, study]);

  const next = useCallback(() => {
    study.touch();
    if (idx + 1 >= qs.length) { sfx.fanfare(); setPhase('results'); window.scrollTo(0, 0); return; }
    sfx.next();
    setIdx(i => i + 1); setPicked(null); setPaused(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx, qs.length, study]);

  const sysName = catalog?.systems.find(s => s.id === systemId)?.name || 'Endocrinology';
  return (
    <div className={`ic ic-theme--${prefs.theme} ic-size--${prefs.size}`}>
      <header className="ic-bar-top">
        <button type="button" className="ic-brand" onClick={phase === 'opener' ? exit : () => setPhase('opener')}
          title={phase === 'opener' ? 'Back to Story Mode' : 'Back to the topic list'}>
          <span className="ic-logo" aria-hidden="true"><i /><i /><i /></span>
          <span className="ic-brand-t"><b>INNER CIRCLE</b><small>Step 2 CK · {sysName}</small></span>
        </button>
        <div className="ic-bar-right">
          <ReadingPrefs prefs={prefs} setPrefs={setPrefs} />
          <SfxToggle className="ic-sfx" />
          {phase === 'run' && (
            <button type="button" className="ic-ghost ic-end" onClick={() => { if (results.length) setPhase('results'); else setPhase('opener'); }}>
              End block
            </button>
          )}
        </div>
      </header>

      <main className="ic-main">
        {phase === 'opener' && (
          <Opener catalog={catalog} error={error} systemId={systemId} setSystemId={setSystemId}
            topics={topics} setTopics={setTopics} count={count} setCount={setCount}
            byRating={byRating} setByRating={setByRating} mine={mine}
            onStart={() => start()} onExit={exit} />
        )}
        {phase === 'run' && q && (
          <QuestionView key={q.id} q={q} idx={idx} total={qs.length} results={results}
            picked={picked} onAnswer={answer} onNext={next} paused={paused} setPaused={setPaused} rating={rating} />
        )}
        {phase === 'results' && (
          <Results results={results} ratings={rating.ratings}
            onRetry={(ids) => start(ids)} onAgain={() => setPhase('opener')} onExit={exit} />
        )}
      </main>
    </div>
  );
}
