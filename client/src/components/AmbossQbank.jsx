import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch, getToken } from '../auth';
import { renderStem } from '../utils/renderStem';
import { sfx } from '../minigameSfx';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import SfxToggle from './SfxToggle';
import { FA_RATING_GROUPS as RATING_GROUPS, FA_RATINGS as RATINGS, FA_UNRATED as UNRATED } from './FARatings';
import './AmbossQbank.css';

/**
 * Amboss Quest → Qbank (/amboss-qbank). Worked like a real qbank, block by
 * block, in tutor mode:
 *
 *   PICK     one or more systems (mixed in one session), optionally narrowed
 *            to blocks ("Blocks on"), filtered by the student's own recall
 *            rating (or All), in order or shuffled. The hero tracks progress
 *            through the whole 2,745-question bank.
 *   SESSION  one vignette at a time with its figures. 💡 Hint opens AMBOSS's
 *            hint without giving the answer away. Strike out a choice with
 *            right-click (or its ✕), pick one, Submit. Then every choice opens
 *            its own explanation, figures included; the correct one and the
 *            one picked open by themselves.
 *   REVIEW   score, every question with its result; jump back into any of
 *            them, or run just the ones missed.
 *
 * Content: /api/amboss-qbank/* (Supabase tables amboss_qbank + _answers,
 * amboss-qbank-migration.sql), imported by an admin from a local pack.
 */

const LETTERS = 'ABCDEFGHIJ';
// The whole AMBOSS bank; progress on the picker is measured against it.
const BANK_TOTAL = 2745;
const RATING_FILTERS = [...RATINGS, UNRATED];
const ratingOf = (key) => RATINGS.find(r => r.key === key);
const PREF_KEY = 'mv_aqb_prefs_v2';
const CATALOG_KEY = 'mv_aqb_catalog';
const SYSTEM_ICON = { pulmonology: '🫁', cardiology: '❤️', nephrology: '🫘', gastroenterology: '🍽️', neurology: '🧠', endocrinology: '🦋', reproductive: '🤰', haematology_oncology: '🩸', musculoskeletal: '🦴', psychiatry: '🧩', immunology: '🛡️', microbiology: '🦠', biochemistry: '🧬', pharmacology: '💊', pathology: '🔬' };

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
}

function Figure({ src, onZoom, alt }) {
  return (
    <button type="button" className="aqb-fig" onClick={() => onZoom(src)} title="Enlarge">
      <img src={src} alt={alt} loading="lazy" />
      <span className="aqb-fig-zoom" aria-hidden="true">⤢</span>
    </button>
  );
}

// ── Block picker ────────────────────────────────────────────────────────────
// The selection is a list of "system:block" keys, so one session can mix any
// blocks of any systems. With blocks off (the default) a system is picked
// whole and only its question count shows; "Blocks on" opens each picked
// system's blocks to fine-tune it.
const selKey = (sys, block) => `${sys}:${block}`;
const fmt = (n) => n.toLocaleString('en-US');

function Picker({ catalog, error, setup, sel, setSel, showBlocks, setShowBlocks, rateSel, setRateSel, shuffle, setShuffle, onStart, starting, startError }) {
  const systems = catalog || [];
  const all = systems.flatMap(s => s.blocks.map(b => ({ ...b, sys: s.id })));
  const chosen = all.filter(b => sel.includes(selKey(b.sys, b.block)));
  const ratingCount = (key) => chosen.reduce((n, b) => n + ((b.ratings || {})[key] || 0), 0);
  const chosenTotal = chosen.reduce((n, b) => n + b.total, 0);
  const pool = rateSel.length ? rateSel.reduce((n, k) => n + ratingCount(k), 0) : chosenTotal;

  // Whole-bank progress, measured against the full AMBOSS bank.
  const loaded = all.reduce((n, b) => n + b.total, 0);
  const bankTotal = Math.max(BANK_TOTAL, loaded);
  const done = all.reduce((n, b) => n + b.answered, 0);
  const rated = all.reduce((n, b) => n + b.total - ((b.ratings || {}).unrated || 0), 0);
  const bankRatings = RATINGS.map(r => ({ ...r, n: all.reduce((n, b) => n + ((b.ratings || {})[r.key] || 0), 0) }));

  const sysKeys = (s) => s.blocks.map(b => selKey(s.id, b.block));
  const sysState = (s) => { const k = sysKeys(s); const n = k.filter(x => sel.includes(x)).length; return n === 0 ? 'off' : n === k.length ? 'on' : 'part'; };
  const toggleSys = (s) => {
    sfx.select();
    const k = sysKeys(s);
    const wasOn = sysState(s) === 'on';
    setSel(p => (wasOn ? p.filter(x => !k.includes(x)) : [...new Set([...p, ...k])]));
  };
  const toggleBlock = (sys, block) => { sfx.select(); const k = selKey(sys, block); setSel(p => (p.includes(k) ? p.filter(x => x !== k) : [...p, k])); };
  const toggleRating = (k) => { sfx.select(); setRateSel(p => (p.includes(k) ? p.filter(x => x !== k) : [...p, k])); };
  const pickedSystems = systems.filter(s => sysState(s) !== 'off');

  return (
    <div className="aqb-picker">
      <section className="aqb-hero">
        <p className="aqb-kicker">Amboss Quest · Qbank</p>
        <h1>The AMBOSS Qbank</h1>
        <p className="aqb-sub">Pick any systems, mix them, and study by how well you know each question.</p>
        {catalog && (
          <div className="aqb-bank">
            <div className="aqb-bank-top">
              <span className="aqb-bank-total"><b>{fmt(bankTotal)}</b> questions in this Qbank</span>
              <span className="aqb-bank-pct">{Math.round((done / bankTotal) * 100)}% complete</span>
            </div>
            <span className="aqb-bar aqb-bar--bank" aria-hidden="true">
              <i className="aqb-bar-right" style={{ width: `${(done / bankTotal) * 100}%` }} />
            </span>
            <div className="aqb-hero-stats">
              <span><b>{fmt(done)}</b> done</span>
              <span><b>{fmt(rated)}</b> rated</span>
              <span><b>{fmt(bankTotal - done)}</b> to go</span>
            </div>
            {rated > 0 && (
              <div className="aqb-rate-tally">
                {bankRatings.filter(r => r.n).map(r => (
                  <span key={r.key} className="aqb-rchip is-static"><span aria-hidden="true">{r.icon}</span> {r.label} <b>{fmt(r.n)}</b></span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {setup && <p className="aqb-error">The Qbank is not set up yet. An admin needs to run <code>amboss-qbank-migration.sql</code> and import a question pack.</p>}
      {error && <p className="aqb-error">{error}</p>}
      {!catalog && !error && <div className="aqb-loading"><span /><span /><span /></div>}

      {systems.length > 0 && (
        <section className="aqb-panel">
          <div className="aqb-panel-head">
            <h2>Systems &amp; subjects</h2>
            <div className="aqb-panel-tools">
              <button type="button" className="aqb-link" onClick={() => { sfx.select(); setSel(all.map(b => selKey(b.sys, b.block))); }}>Select all</button>
              <button type="button" className="aqb-link" onClick={() => { sfx.select(); setSel([]); }}>Clear</button>
              <button type="button" className={`aqb-toggle${showBlocks ? ' is-on' : ''}`} aria-pressed={showBlocks}
                onClick={() => { sfx.select(); setShowBlocks(v => !v); }}>
                <span className="aqb-toggle-track" aria-hidden="true"><i /></span> Blocks {showBlocks ? 'on' : 'off'}
              </button>
            </div>
          </div>
          <p className="aqb-note">Pick one or more; mixing systems puts them in one session.</p>
          <div className="aqb-systems">
            {systems.map(s => {
              const state = sysState(s);
              const total = s.blocks.reduce((n, b) => n + b.total, 0);
              const sdone = s.blocks.reduce((n, b) => n + b.answered, 0);
              const picked = s.blocks.filter(b => sel.includes(selKey(s.id, b.block)));
              return (
                <button key={s.id} type="button" className={`aqb-block aqb-sys${state !== 'off' ? ' is-on' : ''}${state === 'part' ? ' is-part' : ''}`}
                  aria-pressed={state === 'on' ? true : state === 'part' ? 'mixed' : false} onClick={() => toggleSys(s)}>
                  <span className="aqb-block-check" aria-hidden="true">{state === 'on' ? '✓' : state === 'part' ? '–' : ''}</span>
                  <span className="aqb-sys-name"><span aria-hidden="true">{SYSTEM_ICON[s.id] || '🗂️'}</span> {s.name}</span>
                  <span className="aqb-block-meta"><b>{total}</b> questions{state === 'part' ? ` · ${picked.reduce((n, b) => n + b.total, 0)} picked` : ''}</span>
                  <span className="aqb-bar" aria-hidden="true"><i className="aqb-bar-right" style={{ width: `${total ? (sdone / total) * 100 : 0}%` }} /></span>
                  <span className="aqb-block-meta">{sdone ? `${sdone}/${total} done` : 'Not started'}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {showBlocks && pickedSystems.map(s => (
        <section key={s.id} className="aqb-panel">
          <div className="aqb-panel-head"><h2>{SYSTEM_ICON[s.id] || '🗂️'} {s.name} · blocks</h2></div>
          <div className="aqb-blocks">
            {s.blocks.map(b => {
              const on = sel.includes(selKey(s.id, b.block));
              return (
                <button key={b.block} type="button" className={`aqb-block${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleBlock(s.id, b.block)}>
                  <span className="aqb-block-check" aria-hidden="true">{on ? '✓' : ''}</span>
                  <span className="aqb-block-name">Block {b.block}</span>
                  <span className="aqb-block-meta">{b.total} questions</span>
                  <span className="aqb-bar" aria-hidden="true"><i className="aqb-bar-right" style={{ width: `${b.total ? (b.answered / b.total) * 100 : 0}%` }} /></span>
                  <span className="aqb-block-meta">{b.answered ? `${b.answered}/${b.total} done` : 'Not started'}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {showBlocks && !pickedSystems.length && systems.length > 0 && (
        <p className="aqb-note aqb-note--pad">Pick a system above to see its blocks.</p>
      )}

      {systems.length > 0 && (
        <section className="aqb-panel aqb-opts">
          <div>
            <h2>Questions by rating</h2>
            <div className="aqb-rating-filter" role="group" aria-label="Which ratings to study">
              <button type="button" className={`aqb-rchip${!rateSel.length ? ' is-on' : ''}`} aria-pressed={!rateSel.length}
                onClick={() => { sfx.select(); setRateSel([]); }}>
                <span aria-hidden="true">📚</span> All <b>{chosen.length ? chosenTotal : '–'}</b>
              </button>
              {RATING_FILTERS.map(r => (
                <button key={r.key} type="button" className={`aqb-rchip${rateSel.includes(r.key) ? ' is-on' : ''}`}
                  aria-pressed={rateSel.includes(r.key)} onClick={() => toggleRating(r.key)}>
                  <span aria-hidden="true">{r.icon}</span> {r.label} <b>{chosen.length ? ratingCount(r.key) : '–'}</b>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2>Order</h2>
            <div className="aqb-seg">
              <button type="button" className={!shuffle ? 'is-on' : ''} onClick={() => { sfx.select(); setShuffle(false); }}>In order</button>
              <button type="button" className={shuffle ? 'is-on' : ''} onClick={() => { sfx.select(); setShuffle(true); }}>Shuffled</button>
            </div>
          </div>
        </section>
      )}

      {systems.length > 0 && (
        <div className="aqb-start">
          {startError && <p className="aqb-error">{startError}</p>}
          <button type="button" className="aqb-btn aqb-btn--go" disabled={!chosen.length || !pool || starting} onClick={onStart}>
            {starting ? 'Loading…' : !chosen.length ? 'Pick a system' : !pool ? 'No questions with that rating' : `Start · ${pool} question${pool === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── One question ────────────────────────────────────────────────────────────
function Question({ q, sysName, pos, total, st, onPick, onStrike, onHint, onSubmit, onToggleExp, onZoom, onRate, rateProblem, signedIn }) {
  const submitted = st.submitted;
  const correctIdx = LETTERS.indexOf(q.correct);
  return (
    <article className="aqb-q">
      <header className="aqb-q-head">
        <span className="aqb-q-pos">Question {pos + 1} <small>of {total}</small></span>
        <span className="aqb-q-tag">{sysName ? `${sysName} · ` : ''}Block {q.block} · #{q.num}</span>
      </header>

      <div className="aqb-stem">{renderStem(q.stem)}</div>
      {q.stem_images?.length > 0 && (
        <div className="aqb-figs">{q.stem_images.map((u, i) => <Figure key={i} src={u} onZoom={onZoom} alt={`Figure ${i + 1}`} />)}</div>
      )}

      <div className="aqb-hint-row">
        <button type="button" className={`aqb-hint-btn${st.hint ? ' is-on' : ''}`} disabled={!q.hint} onClick={onHint}
          title={q.hint ? 'Show a hint (H)' : 'No hint for this question'}>
          💡 {q.hint ? (st.hint ? 'Hide hint' : 'Hint') : 'No hint'}
        </button>
      </div>
      {st.hint && q.hint && (
        <aside className="aqb-hint">
          <b>Hint</b>
          <div>{renderStem(q.hint)}</div>
        </aside>
      )}

      <ol className="aqb-choices">
        {q.choices.map((c, i) => {
          const isPicked = st.pick === i;
          const struck = st.struck.includes(i);
          const isRight = submitted && i === correctIdx;
          const isWrong = submitted && isPicked && i !== correctIdx;
          const open = submitted && st.open.includes(i);
          const cls = ['aqb-choice', isPicked && 'is-picked', struck && 'is-struck', isRight && 'is-right', isWrong && 'is-wrong', submitted && 'is-done'].filter(Boolean).join(' ');
          return (
            <li key={`${q.id}-${c.letter}`} className={cls}>
              <div className="aqb-choice-row">
                <button type="button" className="aqb-choice-main"
                  onClick={() => (submitted ? onToggleExp(i) : onPick(i))}
                  onContextMenu={(e) => { if (!submitted) { e.preventDefault(); onStrike(i); } }}>
                  <span className="aqb-letter">{c.letter}</span>
                  <span className="aqb-choice-text">{c.text}</span>
                  {submitted && <span className="aqb-mark" aria-hidden="true">{isRight ? '✓' : isWrong ? '✗' : (open ? '▴' : '▾')}</span>}
                </button>
                {!submitted && (
                  <button type="button" className="aqb-strike" onClick={() => onStrike(i)} title={struck ? 'Bring back' : 'Strike out'} aria-label={struck ? `Bring back ${c.letter}` : `Strike out ${c.letter}`}>
                    {struck ? '↺' : '✕'}
                  </button>
                )}
              </div>
              {open && (
                <div className="aqb-exp">
                  {[...c.explanation].sort((a, b) => (a.type === 'but') - (b.type === 'but')).map((b, bi) => (
                    b.type === 'images'
                      ? <div key={bi} className="aqb-figs">{b.images.map((u, k) => <Figure key={k} src={u} onZoom={onZoom} alt={`${c.letter} figure ${k + 1}`} />)}</div>
                      : (
                        <div key={bi} className={`aqb-exp-text aqb-exp-text--${b.type}`}>
                          {b.type === 'but' && <span className="aqb-exp-label">Good to know</span>}
                          {renderStem(b.text)}
                        </div>
                      )
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted && (
        <div className="aqb-actions">
          <button type="button" className="aqb-btn aqb-btn--go" disabled={st.pick == null} onClick={onSubmit}>Submit</button>
          <span className="aqb-tip">Keys: A–{q.choices[q.choices.length - 1].letter} pick · Enter submit · H hint · right-click strikes out</span>
        </div>
      )}
      {submitted && (
        <p className={`aqb-verdict ${st.pick === correctIdx ? 'ok' : 'bad'}`}>
          {st.pick === correctIdx ? 'Correct.' : `Incorrect. The answer is ${q.correct}.`}{st.hint ? ' (hint used)' : ''} Tap any choice to read its explanation.
        </p>
      )}
      {submitted && signedIn && (
        <div className="aqb-rate" role="group" aria-label="How well did you know this?">
          <span className="aqb-rate-head">How well did you know it?</span>
          {RATING_GROUPS.map(g => (
            <div key={g.label} className="aqb-rate-group">
              <span className="aqb-rate-label">{g.label}</span>
              <div className="aqb-rate-row">
                {g.items.map(it => (
                  <button key={it.key} type="button" className={`aqb-rate-btn${st.rating === it.key ? ' is-on' : ''}`}
                    aria-pressed={st.rating === it.key} onClick={() => onRate(it.key)}>
                    <span aria-hidden="true">{it.icon}</span> {it.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {rateProblem === 'missing_column' && <span className="aqb-rate-warn">Ratings are not saving yet: the Qbank tables need the rating column (re-run amboss-qbank-migration.sql).</span>}
          {rateProblem === 'failed' && <span className="aqb-rate-warn">That rating did not save. Check your connection and pick it again.</span>}
        </div>
      )}
    </article>
  );
}

// ── Review ─────────────────────────────────────────────────────────────────
function Review({ qs, states, onOpen, onMissed, onBack }) {
  const done = qs.map((q, i) => ({ q, i, s: states[i] })).filter(x => x.s?.submitted);
  const right = done.filter(x => x.s.pick === LETTERS.indexOf(x.q.correct)).length;
  const pct = done.length ? Math.round((right / done.length) * 100) : 0;
  return (
    <div className="aqb-review">
      <section className="aqb-hero">
        <p className="aqb-kicker">Session complete</p>
        <h1>{pct}% correct</h1>
        <p className="aqb-sub">{right} of {done.length} answered correctly{done.length < qs.length ? ` · ${qs.length - done.length} left unanswered` : ''}.</p>
        {done.some(x => x.s.rating) && (
          <div className="aqb-rate-tally">
            {RATINGS.map(r => ({ ...r, n: done.filter(x => x.s.rating === r.key).length })).filter(r => r.n).map(r => (
              <span key={r.key} className="aqb-rchip is-static"><span aria-hidden="true">{r.icon}</span> {r.label} <b>{r.n}</b></span>
            ))}
          </div>
        )}
        <div className="aqb-start">
          {done.length > right && <button type="button" className="aqb-btn aqb-btn--go" onClick={onMissed}>Redo the {done.length - right} I missed</button>}
          <button type="button" className="aqb-btn" onClick={onBack}>Back to blocks</button>
        </div>
      </section>
      <section className="aqb-panel">
        <h2>Every question</h2>
        <ul className="aqb-review-list">
          {qs.map((q, i) => {
            const s = states[i];
            const ok = s?.submitted && s.pick === LETTERS.indexOf(q.correct);
            return (
              <li key={q.id}>
                <button type="button" onClick={() => onOpen(i)}>
                  <span className={`aqb-dot ${!s?.submitted ? '' : ok ? 'ok' : 'bad'}`}>{i + 1}</span>
                  <span className="aqb-review-text">{q.stem.split('\n')[0].slice(0, 150)}…</span>
                  <span className="aqb-review-ans">{s?.rating && <span title={ratingOf(s.rating)?.label}>{ratingOf(s.rating)?.icon} </span>}{s?.submitted ? `${LETTERS[s.pick]} → ${q.correct}` : '—'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// rating starts as the student's saved one, so re-doing a question shows it.
const freshState = (q) => ({ pick: null, struck: [], hint: false, submitted: false, open: [], rating: q?.last?.rating || null });

export default function AmbossQbank() {
  const prefs = useMemo(loadPrefs, []);
  const [phase, setPhase] = useState('pick');
  // The last catalog paints at once; the fresh one replaces it when it lands.
  const [catalog, setCatalog] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem(CATALOG_KEY)); return Array.isArray(c) && c.length ? c : null; } catch { return null; }
  });
  const [setup, setSetup] = useState(false);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(Array.isArray(prefs.sel) ? prefs.sel : []);
  const [showBlocks, setShowBlocks] = useState(Boolean(prefs.showBlocks));
  const [rateSel, setRateSel] = useState(Array.isArray(prefs.rateSel) ? prefs.rateSel : []);
  const [rateProblem, setRateProblem] = useState(null);
  // The answer POST for each question, so a rating is only sent once the row
  // it lands on exists (rating straight after Submit would otherwise race it).
  const answerReq = useRef({});
  const [shuffle, setShuffle] = useState(Boolean(prefs.shuffle));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [qs, setQs] = useState([]);
  const [states, setStates] = useState([]);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(null);

  // The page is its own fixed scroller, so window.scrollTo does nothing here.
  const rootRef = useRef(null);
  const toTop = useCallback((smooth) => rootRef.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }), []);

  const q = qs[idx];
  const st = states[idx] || freshState(q);
  const study = useStudySession({ mode: 'amboss_qbank', active: phase === 'run', subject: q?.system || null });
  useStudyActivity(phase === 'run' ? 'Amboss Qbank' : null, null, 'amboss_qbank');

  const loadCatalog = useCallback(() => {
    if (!getToken()) { setCatalog(null); setError('Sign in to use the Qbank; your progress is saved to your account.'); return; }
    authFetch('/api/amboss-qbank/catalog')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d.systems)) throw new Error(d.error || 'bad');
        setCatalog(d.systems);
        try { localStorage.setItem(CATALOG_KEY, JSON.stringify(d.systems)); } catch { /* not cached */ }
        setSetup(Boolean(d.setup));
        if (!d.systems.length && !d.setup) setError('No Qbank questions have been added yet.');
        // Drop remembered picks for blocks that no longer exist.
        const live = new Set(d.systems.flatMap(s => s.blocks.map(b => `${s.id}:${b.block}`)));
        setSel(p => p.filter(k => live.has(k)));
      })
      .catch(() => setError('Could not load the Qbank. Check your connection and try again.'));
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ sel, showBlocks, rateSel, shuffle })); } catch { /* not remembered */ }
  }, [sel, showBlocks, rateSel, shuffle]);
  const sysNames = useMemo(() => new Map((catalog || []).map(s => [s.id, s.name])), [catalog]);

  function begin(list) {
    setQs(list); setStates(list.map(q => freshState(q))); setIdx(0); setRateProblem(null);
    setPhase('run'); study.flush(); study.touch();
    toTop(false);
  }

  async function start() {
    setStarting(true); setStartError('');
    try {
      const params = new URLSearchParams({ sel: sel.join(',') });
      if (rateSel.length) params.set('ratings', rateSel.join(','));
      const r = await authFetch(`/api/amboss-qbank/questions?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not load the questions.');
      let list = d.questions || [];
      if (!list.length) throw new Error(rateSel.length ? 'No questions in that selection have that rating.' : 'No questions came back.');
      if (shuffle) list = [...list].sort(() => Math.random() - 0.5);
      begin(list);
    } catch (e) { setStartError(e.message); }
    setStarting(false);
  }

  const patch = useCallback((fn) => setStates(ss => { const n = ss.slice(); n[idx] = fn(n[idx] || freshState(qs[idx])); return n; }), [idx, qs]);

  const pick = useCallback((i) => { if (st.submitted) return; sfx.select(); study.touch(); patch(s => ({ ...s, pick: i, struck: s.struck.filter(x => x !== i) })); }, [st.submitted, patch, study]);
  const strike = useCallback((i) => { if (st.submitted) return; study.touch(); patch(s => ({ ...s, struck: s.struck.includes(i) ? s.struck.filter(x => x !== i) : [...s.struck, i], pick: s.pick === i ? null : s.pick })); }, [st.submitted, patch, study]);
  const hint = useCallback(() => { if (!q?.hint) return; sfx.select(); study.touch(); patch(s => ({ ...s, hint: !s.hint })); }, [q, patch, study]);
  const toggleExp = useCallback((i) => { study.touch(); patch(s => ({ ...s, open: s.open.includes(i) ? s.open.filter(x => x !== i) : [...s.open, i] })); }, [patch, study]);

  const submit = useCallback(() => {
    if (!q || st.submitted || st.pick == null) return;
    const correctIdx = LETTERS.indexOf(q.correct);
    const right = st.pick === correctIdx;
    patch(s => ({ ...s, submitted: true, open: [...new Set([correctIdx, s.pick])] }));
    study.count(right);
    if (right) sfx.correct(); else sfx.wrong();
    answerReq.current[q.id] = authFetch('/api/amboss-qbank/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: q.id, choice: LETTERS[st.pick], used_hint: st.hint }),
    }).catch(() => {});
  }, [q, st, patch, study]);

  const rate = useCallback((key) => {
    if (!q || !st.submitted) return;
    sfx.select(); study.touch();
    patch(s => ({ ...s, rating: key }));
    const id = q.id;
    Promise.resolve(answerReq.current[id])
      .then(() => authFetch('/api/amboss-qbank/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: id, rating: key }),
      }))
      .then(r => r.json())
      .then(d => setRateProblem(d.ok ? null : d.reason === 'missing_column' ? 'missing_column' : 'failed'))
      .catch(() => setRateProblem('failed'));
  }, [q, st.submitted, patch, study]);

  const go = useCallback((to) => {
    if (to < 0 || to >= qs.length) return;
    study.touch(); sfx.next?.();
    setIdx(to);
    toTop(true);
  }, [qs.length, study, toTop]);

  const finish = useCallback(() => { study.flush(); sfx.complete?.(); setPhase('review'); toTop(false); loadCatalog(); }, [study, loadCatalog, toTop]);

  useEffect(() => {
    if (phase !== 'run' || !q) return undefined;
    const onKey = (e) => {
      if (zoom) { if (e.key === 'Escape') setZoom(null); return; }
      if (e.target.closest?.('input, textarea')) return;
      const k = e.key.toUpperCase();
      const li = LETTERS.indexOf(k);
      if (k.length === 1 && li >= 0 && li < q.choices.length && !st.submitted) { pick(li); return; }
      if (k === 'H') { hint(); return; }
      if (e.key === 'Enter') { if (!st.submitted) submit(); else if (idx + 1 < qs.length) go(idx + 1); else finish(); return; }
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, st.submitted, idx, qs.length, zoom, pick, hint, submit, go, finish]);

  const answered = states.filter(s => s?.submitted).length;
  const rightCount = qs.reduce((n, qq, i) => n + (states[i]?.submitted && states[i].pick === LETTERS.indexOf(qq.correct) ? 1 : 0), 0);

  return (
    <div className="aqb" ref={rootRef}>
      <header className="aqb-top">
        {phase === 'run'
          ? <button type="button" className="aqb-back" onClick={finish}>■ End session</button>
          : <button type="button" className="aqb-back" onClick={() => { window.location.href = '/amboss-quest'; }}>← Amboss Quest</button>}
        <span className="aqb-brand">🗂️ <b>Qbank</b>{phase === 'run' && <small> · {answered}/{qs.length} done · {rightCount} correct</small>}</span>
        <SfxToggle />
      </header>

      {phase === 'run' && (
        <nav className="aqb-nav" aria-label="Questions in this session">
          {qs.map((qq, i) => {
            const s = states[i];
            const cls = !s?.submitted ? '' : s.pick === LETTERS.indexOf(qq.correct) ? 'ok' : 'bad';
            return (
              <button key={qq.id} type="button" className={`aqb-dot ${cls}${i === idx ? ' is-cur' : ''}`} onClick={() => go(i)} aria-label={`Question ${i + 1}`}>{i + 1}</button>
            );
          })}
        </nav>
      )}

      <main className="aqb-main">
        {phase === 'pick' && (
          <Picker catalog={catalog} error={error} setup={setup} sel={sel} setSel={setSel} showBlocks={showBlocks} setShowBlocks={setShowBlocks}
            rateSel={rateSel} setRateSel={setRateSel} shuffle={shuffle} setShuffle={setShuffle} onStart={start} starting={starting} startError={startError} />
        )}
        {phase === 'run' && q && (
          <>
            <Question q={q} sysName={sysNames.get(q.system)} pos={idx} total={qs.length} st={st} onPick={pick} onStrike={strike} onHint={hint}
              onSubmit={submit} onToggleExp={toggleExp} onZoom={setZoom}
              onRate={rate} rateProblem={rateProblem} signedIn={Boolean(getToken())} />
            <div className="aqb-pager">
              <button type="button" className="aqb-btn" disabled={idx === 0} onClick={() => go(idx - 1)}>← Previous</button>
              {idx + 1 < qs.length
                ? <button type="button" className={`aqb-btn${st.submitted ? ' aqb-btn--go' : ''}`} onClick={() => go(idx + 1)}>Next →</button>
                : <button type="button" className="aqb-btn aqb-btn--go" onClick={finish}>Finish</button>}
            </div>
          </>
        )}
        {phase === 'review' && (
          <Review qs={qs} states={states}
            onOpen={(i) => { setIdx(i); setPhase('run'); toTop(false); }}
            onMissed={() => begin(qs.filter((qq, i) => states[i]?.submitted && states[i].pick !== LETTERS.indexOf(qq.correct)))}
            onBack={() => setPhase('pick')} />
        )}
      </main>

      {zoom && (
        <div className="aqb-lightbox" role="dialog" aria-label="Figure" onClick={() => setZoom(null)}>
          <img src={zoom} alt="Figure, enlarged" />
          <button type="button" className="aqb-lightbox-x" aria-label="Close">✕</button>
        </div>
      )}
    </div>
  );
}
