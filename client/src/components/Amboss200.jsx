import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch, getToken } from '../auth';
import { SERVER_URL } from '../serverUrl';
import { renderStem, toStemVisibleText, parseStemInline, renderTokenText } from '../utils/renderStem';
import { resolveHighlights, offsetsToSegments } from '../utils/explanationHighlights';
import ExplanationHighlightToolbar from './ExplanationHighlightToolbar';
import { useHighlightRights, useQuestionHighlights } from './useQuestionHighlights';
import { sfx } from '../minigameSfx';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import SfxToggle from './SfxToggle';
import { useFaRatings, FA_RATING_GROUPS, FA_RATINGS, FA_RATING_FILTERS } from './FARatings';
import './Amboss200.css';

/**
 * Amboss 200 Concepts — an expedition through the 200 concepts, played as a
 * game rather than worked down like a qbank.
 *
 *   BASECAMP   pick the systems to explore (any mix), which questions by
 *              the student's own recall rating (or all), how many, and timed
 *              or not. Each system tile shows how much of it has been charted.
 *   EXPEDITION one vignette at a time; answer, then the HY explanation card
 *              (concept, why, the high-yield facts, the trap) and the six
 *              recall ratings (fa_question_ratings, mode amboss_200). Streaks
 *              build a combo multiplier; every question is a waypoint.
 *   SUMMIT     score, accuracy, per-system results and every missed concept
 *              to review.
 *
 * Questions come from /api/amboss200/run (Supabase, tag amboss_200_concepts);
 * the explanations are attached server-side from server/amboss200/hy.js.
 * Answers are reported to /api/questions/seen so "not seen" / "missed" work.
 * Lime (132, 204, 22) is Amboss Quest's colour everywhere it appears.
 */

const SYSTEM_ICON = {
  biochemistry: '🧬', pathology: '🔬', pharmacology: '💊', microbiology: '🦠',
  immunology: '🛡️', haematology_oncology: '🩸', cardiology: '❤️', endocrinology: '🦋',
  gastroenterology: '🍽️', musculoskeletal: '🦴', neurology: '🧠', psychiatry: '🧩',
  nephrology: '🫘', reproductive: '🤰', pulmonology: '🫁', biostatistics: '📊',
};
const iconFor = (id) => SYSTEM_ICON[id] || '🧭';
const LETTERS = 'ABCDEFGHIJ';
const COUNTS = [10, 20, 40, 0]; // 0 = every question that matches
// The UWorld Adventure clocks: 80 s to answer, 85 s on the explanation.
const TIME_LIMIT = 80;
const EXPL_LIMIT = 85;
const TIMED_KEY = 'mv_amboss200_timed';
const SEL_KEY = 'mv_amboss200_systems';
const RATE_KEY = 'mv_amboss200_ratings';

function reportSeen(q, correct) {
  if (!q?._supabase_id || !getToken()) return;
  fetch(`${SERVER_URL}/api/questions/seen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ seen: [{ question_id: q._supabase_id, answered: true, correct }] }),
  }).catch(() => {});
}

function Ring({ value, size = 44, stroke = 5, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="a2-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="a2-ring-bg" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="a2-ring-fg" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
      </svg>
      <span className="a2-ring-in">{children}</span>
    </span>
  );
}

// ── Basecamp ────────────────────────────────────────────────────────────────
function Basecamp({ catalog, error, picked, setPicked, rateSel, setRateSel, count, setCount, timed, setTimed, onStart, starting, startError }) {
  const systems = catalog || [];
  const chosen = systems.filter(s => picked.includes(s.id));
  const ratingCount = (k) => chosen.reduce((n, s) => n + ((s.ratings || {})[k] || 0), 0);
  const chosenTotal = chosen.reduce((n, s) => n + s.total, 0);
  const pool = rateSel.length ? rateSel.reduce((n, k) => n + ratingCount(k), 0) : chosenTotal;
  const toggleRating = (k) => { sfx.select(); setRateSel(p => (p.includes(k) ? p.filter(x => x !== k) : [...p, k])); };
  const total = systems.reduce((n, s) => n + s.total, 0);
  const charted = systems.reduce((n, s) => n + s.seen, 0);
  const toggle = (id) => { sfx.select(); setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); };

  return (
    <div className="a2-camp">
      <section className="a2-hero">
        <div className="a2-compass" aria-hidden="true">
          <span className="a2-compass-ring" />
          <span className="a2-compass-needle" />
          <span className="a2-compass-dot" />
        </div>
        <div className="a2-hero-text">
          <p className="a2-kicker">Amboss Quest · Expedition</p>
          <h1 className="a2-title">200 Concepts</h1>
          <p className="a2-sub">The concepts that turn up on every Step 1 exam. Pick your route, answer each one, and collect the high-yield facts on the way.</p>
          {catalog && (
            <div className="a2-overall">
              <Ring value={total ? charted / total : 0} size={54} stroke={6}><b>{total ? Math.round((charted / total) * 100) : 0}%</b></Ring>
              <span><b>{charted}</b> of {total} concepts charted</span>
            </div>
          )}
        </div>
      </section>

      <section className="a2-panel">
        <div className="a2-panel-head">
          <h2>1 · Choose your systems</h2>
          <div className="a2-panel-actions">
            <button type="button" className="a2-link" onClick={() => { sfx.select(); setPicked(systems.map(s => s.id)); }}>Select all</button>
            <button type="button" className="a2-link" onClick={() => { sfx.select(); setPicked([]); }}>Clear</button>
          </div>
        </div>
        {error && <p className="a2-error">{error}</p>}
        {!catalog && !error && <div className="a2-loading"><span /><span /><span /></div>}
        <div className="a2-systems">
          {systems.map((s, i) => {
            const on = picked.includes(s.id);
            return (
              <button key={s.id} type="button" className={`a2-sys${on ? ' is-on' : ''}`} onClick={() => toggle(s.id)}
                aria-pressed={on} style={{ animationDelay: `${i * 30}ms` }}>
                <span className="a2-sys-check" aria-hidden="true">{on ? '✓' : ''}</span>
                <Ring value={s.total ? s.seen / s.total : 0} size={46}><span className="a2-sys-ic">{iconFor(s.id)}</span></Ring>
                <span className="a2-sys-body">
                  <span className="a2-sys-name">{s.name}</span>
                  <span className="a2-sys-meta">{s.seen}/{s.total} seen{s.wrong ? ` · ${s.wrong} missed` : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="a2-panel a2-opts">
        <div className="a2-opt-wide">
          <h2>2 · Which questions, by your rating</h2>
          <div className="a2-rfilter" role="group" aria-label="Which ratings to study">
            <button type="button" className={`a2-rchip${!rateSel.length ? ' is-on' : ''}`} aria-pressed={!rateSel.length}
              onClick={() => { sfx.select(); setRateSel([]); }}>
              <span aria-hidden="true">📚</span> All <b>{chosen.length ? chosenTotal : '–'}</b>
            </button>
            {FA_RATING_FILTERS.map(r => (
              <button key={r.key} type="button" className={`a2-rchip${rateSel.includes(r.key) ? ' is-on' : ''}`}
                aria-pressed={rateSel.includes(r.key)} onClick={() => toggleRating(r.key)}>
                <span aria-hidden="true">{r.icon}</span> {r.label} <b>{chosen.length ? ratingCount(r.key) : '–'}</b>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2>3 · How many</h2>
          <div className="a2-seg">
            {COUNTS.map(n => (
              <button key={n} type="button" className={count === n ? 'is-on' : ''} onClick={() => { sfx.select(); setCount(n); }}>{n || 'All'}</button>
            ))}
          </div>
        </div>
        <div>
          <h2>4 · Pace</h2>
          <div className="a2-seg">
            <button type="button" className={!timed ? 'is-on' : ''} onClick={() => { sfx.select(); setTimed(false); }}>Untimed</button>
            <button type="button" className={timed ? 'is-on' : ''} onClick={() => { sfx.select(); setTimed(true); }}>⏱ Timed · {TIME_LIMIT}s + {EXPL_LIMIT}s review</button>
          </div>
        </div>
      </section>

      <div className="a2-launch">
        <p className="a2-launch-info">
          {picked.length === 0 ? 'Pick at least one system to set off.'
            : <><b>{Math.min(pool, count || pool)}</b> question{Math.min(pool, count || pool) === 1 ? '' : 's'} from <b>{picked.length}</b> system{picked.length === 1 ? '' : 's'}</>}
        </p>
        {startError && <p className="a2-error">{startError}</p>}
        <button type="button" className="a2-go" disabled={!picked.length || !pool || starting} onClick={onStart}>
          {starting ? 'Packing…' : 'Start expedition →'}
        </button>
      </div>
    </div>
  );
}

// ── The HY explanation card ─────────────────────────────────────────────────
//
// The card's body is one text model, like a stem: every piece knows where it
// starts in the card's visible text, so highlights (saved as offsets into
// that text) land on the same words every time. The rendered body's
// textContent must equal `visible` exactly, which is why the "Trap: " label
// is a token too and the list bullets are CSS.
//
// **bold** written into hy.js is honoured; a fact that opens with a label
// ("Acute: nausea…") gets the label in bold automatically.
function hyModel(q) {
  let at = 0;
  const tok = (raw, autoLead = false) => {
    const { text, marks } = parseStemInline(raw);
    const m = autoLead && !marks.length ? text.match(/^([^:.]{2,45}):\s/) : null;
    const t = { text, start: at, end: at + text.length, marks: m ? [{ start: 0, end: m[1].length + 1, bold: true }] : marks };
    at += text.length;
    return t;
  };
  const hy = q.hy;
  if (!hy) {
    const w = q.explanation ? tok(q.explanation) : null;
    return { w, facts: [], trap: null, visible: w ? w.text : '' };
  }
  const w = tok(hy.w);
  const facts = hy.hy.map(f => tok(f, true));
  const trap = hy.t ? [tok('Trap: '), tok(hy.t)] : null;
  const visible = [w, ...facts, ...(trap || [])].map(t => t.text).join('');
  return { w, facts, trap, visible };
}

function HYCard({ q, right, bodyRef = null, segments = [] }) {
  const hy = q.hy;
  const answerText = q.options?.[LETTERS.indexOf(q.correct)];
  const model = useMemo(() => hyModel(q), [q]);
  const R = (t, k) => renderTokenText(t, segments, k);
  return (
    <div className={`a2-hy ${right ? 'is-right' : 'is-wrong'}`}>
      <div className="a2-hy-top">
        <span className="a2-hy-badge">HY</span>
        <div>
          <p className="a2-hy-kicker">{right ? 'Concept unlocked' : `Answer: ${q.correct}. ${answerText || ''}`}</p>
          <h3 className="a2-hy-title">{hy?.c || answerText}</h3>
        </div>
      </div>
      <div className="a2-hy-body" ref={bodyRef}>
        {model.w && <p className="a2-hy-why">{R(model.w, 'w')}</p>}
        {hy && (
          <ul className="a2-hy-list">
            {model.facts.map((f, i) => <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>{R(f, `f${i}`)}</li>)}
          </ul>
        )}
        {model.trap && <p className="a2-hy-trap"><b>{R(model.trap[0], 'tl')}</b>{R(model.trap[1], 't')}</p>}
      </div>
    </div>
  );
}

// ── Recall rating, under the HY card ────────────────────────────────────────
function RateBar({ current, onRate, problem }) {
  return (
    <div className="a2-rate" role="group" aria-label="How well did you know this?">
      <span className="a2-rate-head">How well did you know it?</span>
      {FA_RATING_GROUPS.map(g => (
        <div key={g.label} className="a2-rate-group">
          <span className="a2-rate-label">{g.label}</span>
          <div className="a2-rate-row">
            {g.items.map(it => (
              <button key={it.key} type="button" className={`a2-rate-btn${current === it.key ? ' is-on' : ''}`}
                aria-pressed={current === it.key} onClick={() => { sfx.select(); onRate(it.key); }}>
                <span aria-hidden="true">{it.icon}</span> {it.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {problem === 'missing_mode' && <span className="a2-rate-warn">Ratings are not saving yet: run amboss200-ratings-migration.sql in Supabase.</span>}
      {problem === 'missing_table' && <span className="a2-rate-warn">Ratings are not saving yet: run fa-question-ratings-migration.sql in Supabase.</span>}
      {problem === 'failed' && <span className="a2-rate-warn">That rating did not save. Check your connection and pick it again.</span>}
    </div>
  );
}

// ── Expedition ──────────────────────────────────────────────────────────────
function Expedition({ qs, idx, results, picked, onAnswer, onNext, onQuit, timed, combo, score, rating, onRate, rateProblem, signedIn }) {
  const q = qs[idx];
  // Two clocks, as in UWorld Adventure: the question's, then the
  // explanation's. The explanation clock can be paused; when it runs out an
  // unrated question waits for a rating (rating is what moves you on), and
  // anyone who cannot rate is moved on.
  const [time, setTime] = useState(TIME_LIMIT);
  const [explTime, setExplTime] = useState(EXPL_LIMIT);
  const [explPaused, setExplPaused] = useState(false);
  const [rated, setRated] = useState(false);
  useEffect(() => { setTime(TIME_LIMIT); setExplTime(EXPL_LIMIT); setExplPaused(false); setRated(false); }, [idx]);
  useEffect(() => {
    if (!timed || picked !== null) return undefined;
    if (time <= 0) { onAnswer(-1); return undefined; }
    const t = setTimeout(() => setTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, time, picked, onAnswer]);
  const mustRate = signedIn && !rating;
  const explExpired = timed && picked !== null && explTime <= 0;
  useEffect(() => {
    if (!timed || picked === null || explPaused || rated) return undefined;
    if (explTime <= 0) { if (!mustRate) onNext(); return undefined; }
    const t = setTimeout(() => setExplTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, picked, explPaused, explTime, rated, mustRate, onNext]);
  function rateAndGo(k) {
    onRate(k);
    if (!timed || rated) return;
    setRated(true);
    setTimeout(onNext, 700);
  }

  // Highlighting, as in UWorld Adventure.
  const rights = useHighlightRights();
  const hl = useQuestionHighlights(q?.id, rights);
  const stemRef = useRef(null);
  const hyRef = useRef(null);
  const stemVisible = useMemo(() => toStemVisibleText(q.question || ''), [q]);
  const hyVisible = useMemo(() => hyModel(q).visible, [q]);
  const stemShown = useMemo(() => resolveHighlights(stemVisible, hl.rows.filter(h => h.region === 'question')), [stemVisible, hl.rows]);
  const hyShown = useMemo(() => resolveHighlights(hyVisible, hl.rows.filter(h => (h.region || 'explanation') === 'explanation')), [hyVisible, hl.rows]);
  const hySegments = useMemo(() => offsetsToSegments(hyVisible, hyShown), [hyVisible, hyShown]);
  const canMarkExpl = rights.loggedIn || rights.isAdmin;

  useEffect(() => {
    function key(e) {
      if (e.target?.closest?.('input, textarea, select')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (picked === null) {
        const i = LETTERS.indexOf(e.key.toUpperCase());
        if (i >= 0 && i < q.options.length) onAnswer(i);
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [q, picked, onAnswer, onNext]);

  // One column on a phone: bring the verdict and HY card up after answering.
  useEffect(() => {
    if (picked === null || window.innerWidth >= 960) return undefined;
    const t = setTimeout(() => document.querySelector('.a2-verdict')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(t);
  }, [picked]);

  const correctIdx = LETTERS.indexOf(q.correct);
  const right = picked !== null && picked === correctIdx;
  const mult = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;

  return (
    <div className="a2-run">
      <div className="a2-hud">
        <button type="button" className="a2-quit" onClick={onQuit}>✕ End</button>
        <div className="a2-trail" aria-label={`Question ${idx + 1} of ${qs.length}`}>
          {qs.map((_, i) => {
            const r = results[i];
            return <span key={i} className={`a2-wp${i === idx ? ' is-now' : ''}${r ? (r.right ? ' is-ok' : ' is-bad') : ''}`} />;
          })}
        </div>
        <div className="a2-hud-stats">
          <span className={`a2-combo${combo >= 3 ? ' is-hot' : ''}`} title="Streak">🔥 {combo}{mult > 1 && <i>×{mult}</i>}</span>
          <span className="a2-score" key={score}>{score} XP</span>
        </div>
      </div>
      {timed && picked === null && (
        <div className={`a2-timer${time <= 5 ? ' is-low' : time <= 10 ? ' is-mid' : ''}`}><div style={{ width: `${(time / TIME_LIMIT) * 100}%` }} /><span>{time}s</span></div>
      )}
      {hl.error && <p className="a2-hl-error" role="alert">{hl.error}</p>}

      <div className="a2-qgrid">
        <article className="a2-qcard" key={q.id}>
          <div className="a2-qmeta">
            <span className="a2-qsys">{iconFor(q.subject)} {q.subjectName}</span>
            <span className="a2-qno">Waypoint {idx + 1} / {qs.length}</span>
            {rights.isAdmin && (
              <button type="button" className={`a2-dev${rights.devMode ? ' is-on' : ''}`} aria-pressed={rights.devMode}
                onClick={() => rights.setDevMode(!rights.devMode)}
                title="Developer Mode: select words in the question or the HY card to bold, italicise or highlight them for everyone">
                🛠 {rights.devMode ? 'Editing on' : 'Edit highlights'}
              </button>
            )}
          </div>
          <div className="a2-stem">
            <div className="stem-text" ref={stemRef}>{renderStem(q.question, { highlights: stemShown })}</div>
          </div>
          {rights.authoringOfficial && (
            <ExplanationHighlightToolbar
              containerRef={stemRef}
              highlights={stemShown}
              onCreate={(p) => hl.create('question', p)}
              onRemoveRange={(s, e) => hl.removeRange('question', stemShown, stemVisible, s, e)}
              allowFormat
              rejectSelector=".lab-values-box, .stem-table"
            />
          )}
          {q.image_url && <img className="a2-fig" src={q.image_url} alt="Figure for this question" loading="lazy" />}
          <div className="a2-choices">
            {q.options.map((o, i) => {
              const state = picked === null ? '' : i === correctIdx ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
              return (
                <button key={i} type="button" className={`a2-choice${state}`} disabled={picked !== null}
                  onClick={() => onAnswer(i)} style={{ animationDelay: `${i * 45}ms` }}>
                  <span className="a2-letter">{LETTERS[i]}</span>
                  <span className="a2-choice-t">{o}</span>
                  {picked !== null && i === correctIdx && <span className="a2-mark">✓</span>}
                  {picked !== null && i === picked && i !== correctIdx && <span className="a2-mark">✕</span>}
                </button>
              );
            })}
          </div>
        </article>

        <aside className="a2-side">
          {picked === null ? (
            <div className="a2-tip">
              <span className="a2-tip-ic">🧭</span>
              <p>Read the vignette, commit to an answer, then the HY card opens here.</p>
              <p className="a2-muted">Keys: <kbd>A</kbd>–<kbd>{LETTERS[q.options.length - 1]}</kbd> to answer, <kbd>Enter</kbd> for next.</p>
            </div>
          ) : (
            <>
              <div className={`a2-verdict ${right ? 'ok' : 'bad'}`}>
                <span>{right ? (combo >= 3 ? `🔥 ${combo} in a row!` : '✓ Correct') : picked === -1 ? '⏱ Out of time' : '✕ Not quite'}</span>
                {right && <b>+{(100) * mult} XP</b>}
              </div>
              {timed && (
                <div className={`a2-expl-clock${explExpired ? ' is-out' : explPaused ? ' is-held' : ''}`} aria-live="polite">
                  {rated ? <span>✓ Rated — moving on…</span>
                    : explExpired ? <span>⏱ Time’s up — rate your recall to continue</span>
                      : (
                        <>
                          <span className="a2-expl-left">⏱ {explTime}s</span>
                          <span className="a2-expl-track"><span style={{ width: `${(explTime / EXPL_LIMIT) * 100}%` }} /></span>
                          <button type="button" onClick={() => setExplPaused(p => !p)} aria-pressed={explPaused}>
                            {explPaused ? '▶ Resume' : '⏸ Pause timer'}
                          </button>
                        </>
                      )}
                </div>
              )}
              <HYCard q={q} right={right} bodyRef={hyRef} segments={hySegments} />
              {canMarkExpl && (
                <ExplanationHighlightToolbar
                  containerRef={hyRef}
                  highlights={hyShown}
                  onCreate={(p) => hl.create('explanation', p)}
                  onRemoveRange={(s, e) => hl.removeRange('explanation', hyShown, hyVisible, s, e)}
                  allowFormat={rights.authoringOfficial}
                />
              )}
              {signedIn && <RateBar current={rating} onRate={rateAndGo} problem={rateProblem} />}
              <button type="button" className="a2-go" onClick={onNext}>{idx + 1 >= qs.length ? 'Reach the summit →' : 'Next waypoint →'}</button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Summit ──────────────────────────────────────────────────────────────────
function Summit({ results, score, bestCombo, onAgain, onMissed, ratings }) {
  const right = results.filter(r => r.right).length;
  const tally = FA_RATINGS.map(r => ({ ...r, n: results.filter(x => ratings[x.q.id] === r.key).length })).filter(r => r.n);
  const pct = results.length ? right / results.length : 0;
  const bySys = useMemo(() => {
    const m = new Map();
    for (const r of results) {
      const k = r.q.subject;
      const s = m.get(k) || { id: k, name: r.q.subjectName, n: 0, ok: 0 };
      s.n += 1; if (r.right) s.ok += 1;
      m.set(k, s);
    }
    return [...m.values()].sort((a, b) => a.ok / a.n - b.ok / b.n);
  }, [results]);
  const missed = results.filter(r => !r.right);
  const [open, setOpen] = useState(null);
  const rank = pct >= 0.9 ? ['🏔️', 'Summit legend'] : pct >= 0.75 ? ['⛰️', 'Peak climber'] : pct >= 0.5 ? ['🥾', 'Trail blazer'] : ['🏕️', 'Basecamp scout'];

  return (
    <div className="a2-summit">
      <section className="a2-summit-hero">
        <div className="a2-flag" aria-hidden="true">{rank[0]}</div>
        <p className="a2-kicker">{rank[1]}</p>
        <Ring value={pct} size={130} stroke={11}><b className="a2-big">{Math.round(pct * 100)}%</b><span className="a2-muted">{right}/{results.length}</span></Ring>
        <div className="a2-summit-stats">
          <div><b>{score}</b><span>XP earned</span></div>
          <div><b>🔥 {bestCombo}</b><span>Best streak</span></div>
          <div><b>{missed.length}</b><span>To review</span></div>
        </div>
        {tally.length > 0 && (
          <div className="a2-rfilter a2-rtally">
            {tally.map(r => <span key={r.key} className="a2-rchip is-static"><span aria-hidden="true">{r.icon}</span> {r.label} <b>{r.n}</b></span>)}
          </div>
        )}
        <div className="a2-summit-actions">
          <button type="button" className="a2-go" onClick={onAgain}>New expedition</button>
          {missed.length > 0 && <button type="button" className="a2-ghost" onClick={onMissed}>Retry the {missed.length} I missed</button>}
        </div>
      </section>

      <section className="a2-panel">
        <h2>By system</h2>
        <div className="a2-bars">
          {bySys.map(s => (
            <div key={s.id} className="a2-bar">
              <span className="a2-bar-name">{iconFor(s.id)} {s.name}</span>
              <span className="a2-bar-track"><span style={{ width: `${(s.ok / s.n) * 100}%` }} /></span>
              <span className="a2-bar-n">{s.ok}/{s.n}</span>
            </div>
          ))}
        </div>
      </section>

      {missed.length > 0 && (
        <section className="a2-panel">
          <h2>Concepts to review</h2>
          <div className="a2-review">
            {missed.map(({ q }) => (
              <div key={q.id} className={`a2-rev${open === q.id ? ' is-open' : ''}`}>
                <button type="button" className="a2-rev-head" onClick={() => { sfx.select(); setOpen(open === q.id ? null : q.id); }}>
                  <span>{iconFor(q.subject)}</span>
                  <span className="a2-rev-title">{q.hy?.c || q.options[LETTERS.indexOf(q.correct)]}</span>
                  <span className="a2-rev-chev">{open === q.id ? '−' : '+'}</span>
                </button>
                {open === q.id && <HYCard q={q} right={false} />}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Amboss200() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(() => { try { return JSON.parse(localStorage.getItem(SEL_KEY)) || []; } catch { return []; } });
  const [rateSel, setRateSel] = useState(() => { try { const v = JSON.parse(localStorage.getItem(RATE_KEY)); return Array.isArray(v) ? v : []; } catch { return []; } });
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(() => { try { return localStorage.getItem(TIMED_KEY) !== '0'; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem(TIMED_KEY, timed ? '1' : '0'); } catch { /* not remembered */ } }, [timed]);
  const [phase, setPhase] = useState('camp');
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState(null);
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [flash, setFlash] = useState(null);

  const q = qs[idx];
  const study = useStudySession({ mode: 'amboss_200_concepts_practice', active: phase === 'run', subject: q?.subject || null });
  useStudyActivity(phase === 'run' ? 'Amboss 200 Concepts' : null, null, 'amboss_200_concepts_practice');

  const loadCatalog = useCallback(() => {
    if (!getToken()) { setError('Sign in to start an expedition — your progress is saved to your account.'); return; }
    authFetch('/api/amboss200/catalog')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d.subjects)) throw new Error(d.error || 'bad');
        setCatalog(d.subjects);
        if (!d.subjects.length) setError('No 200 Concepts questions are in the bank yet.');
        setPicked(p => p.filter(id => d.subjects.some(s => s.id === id)));
      })
      .catch(() => setError('Could not reach basecamp. Check your connection and try again.'));
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => { try { localStorage.setItem(SEL_KEY, JSON.stringify(picked)); } catch { /* not remembered */ } }, [picked]);
  useEffect(() => { try { localStorage.setItem(RATE_KEY, JSON.stringify(rateSel)); } catch { /* not remembered */ } }, [rateSel]);
  // Ratings for this run's questions (keyed by the AMB200-### business id).
  const runIds = useMemo(() => qs.map(x => x.id), [qs]);
  const { ratings, rate: saveRating, problem: rateProblem, signedIn } = useFaRatings('amboss_200', runIds);

  const names = useMemo(() => new Map((catalog || []).map(s => [s.id, s.name])), [catalog]);

  function begin(list) {
    setQs(list.map(x => ({ ...x, subjectName: names.get(x.subject) || x.subject })));
    setIdx(0); setChoice(null); setResults([]); setCombo(0); setBestCombo(0); setScore(0);
    setPhase('run');
    study.flush(); study.touch();
    sfx.sparkle?.();
    window.scrollTo(0, 0);
  }

  async function start() {
    setStarting(true); setStartError('');
    try {
      const qsParams = new URLSearchParams({ subjects: picked.join(','), count: String(count || 200) });
      if (rateSel.length) qsParams.set('ratings', rateSel.join(','));
      const r = await authFetch(`/api/amboss200/run?${qsParams}`);
      const d = await r.json();
      if (!d.questions?.length) throw new Error(rateSel.length ? 'No questions in those systems have that rating.' : 'No questions came back.');
      begin(d.questions);
    } catch (e) { setStartError(e.message); }
    setStarting(false);
  }

  const answer = useCallback((i) => {
    if (!q || choice !== null) return;
    const right = i === LETTERS.indexOf(q.correct);
    setChoice(i);
    setResults(rs => { const n = rs.slice(); n[idx] = { q, right }; return n; });
    study.count(right);
    reportSeen(q, right);
    if (right) {
      const nc = combo + 1;
      const mult = nc >= 5 ? 3 : nc >= 3 ? 2 : 1;
      setCombo(nc); setBestCombo(b => Math.max(b, nc));
      setScore(s => s + 100 * mult);
      sfx.correct();
      setFlash({ k: Date.now(), ok: true });
    } else {
      setCombo(0);
      sfx.wrong();
      setFlash({ k: Date.now(), ok: false });
    }
  }, [q, choice, idx, combo, study]);

  const next = useCallback(() => {
    study.touch();
    if (idx + 1 >= qs.length) { study.flush(); sfx.complete(); setPhase('summit'); window.scrollTo(0, 0); loadCatalog(); return; }
    sfx.next();
    setIdx(i => i + 1); setChoice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx, qs.length, study, loadCatalog]);

  const quit = () => {
    const done = results.filter(Boolean);
    if (!done.length) { setPhase('camp'); return; }
    setResults(done); study.flush(); setPhase('summit'); loadCatalog();
  };

  return (
    <div className="a2">
      <div className="a2-bg" aria-hidden="true">
        <svg className="a2-contours" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse key={i} cx={610} cy={140} rx={60 + i * 55} ry={40 + i * 38} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse key={`b${i}`} cx={120} cy={520} rx={50 + i * 50} ry={34 + i * 32} />
          ))}
        </svg>
        <span className="a2-glow a2-glow--1" /><span className="a2-glow a2-glow--2" />
      </div>
      {flash && <div key={flash.k} className={`a2-flash ${flash.ok ? 'ok' : 'bad'}`} aria-hidden="true" />}

      <header className="a2-top">
        <button type="button" className="a2-back" onClick={() => { window.location.href = '/amboss-quest'; }}>← Amboss Quest</button>
        <span className="a2-brand">🧭 <b>200 Concepts</b></span>
        <SfxToggle />
      </header>

      <main className="a2-main">
        {phase === 'camp' && (
          <Basecamp catalog={catalog} error={error} picked={picked} setPicked={setPicked} rateSel={rateSel} setRateSel={setRateSel}
            count={count} setCount={setCount} timed={timed} setTimed={setTimed} onStart={start} starting={starting} startError={startError} />
        )}
        {phase === 'run' && q && (
          <Expedition qs={qs} idx={idx} results={results} picked={choice} onAnswer={answer} onNext={next} onQuit={quit}
            timed={timed} combo={combo} score={score}
            rating={ratings[q.id] || null} onRate={(k) => saveRating(q.id, k)} rateProblem={rateProblem} signedIn={signedIn} />
        )}
        {phase === 'summit' && (
          <Summit results={results.filter(Boolean)} score={score} bestCombo={bestCombo} ratings={ratings}
            onAgain={() => setPhase('camp')}
            onMissed={() => begin(results.filter(r => r && !r.right).map(r => r.q))} />
        )}
      </main>
    </div>
  );
}
