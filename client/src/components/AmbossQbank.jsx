import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch, getToken } from '../auth';
import { renderStem } from '../utils/renderStem';
import { sfx } from '../minigameSfx';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import SfxToggle from './SfxToggle';
import './AmbossQbank.css';

/**
 * Amboss Quest → Qbank (/amboss-qbank). Worked like a real qbank, block by
 * block, in tutor mode:
 *
 *   BLOCKS   pick a system and one or more of its blocks, which questions
 *            (all / unused / incorrect) and in order or shuffled. Each block
 *            card shows how much of it is done and how much of that was right.
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
const SCOPES = [['all', 'All'], ['unused', 'Unused'], ['incorrect', 'Incorrect']];
const PREF_KEY = 'mv_aqb_prefs';
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
function Picker({ catalog, error, setup, sys, setSys, blocks, setBlocks, scope, setScope, shuffle, setShuffle, onStart, starting, startError }) {
  const system = (catalog || []).find(s => s.id === sys) || (catalog || [])[0];
  const list = system?.blocks || [];
  const chosen = list.filter(b => blocks.includes(b.block));
  const pool = chosen.reduce((n, b) => n + (scope === 'unused' ? b.total - b.answered : scope === 'incorrect' ? b.answered - b.correct : b.total), 0);
  const total = list.reduce((n, b) => n + b.total, 0);
  const done = list.reduce((n, b) => n + b.answered, 0);
  const right = list.reduce((n, b) => n + b.correct, 0);
  const toggle = (n) => { sfx.select(); setBlocks(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n].sort((a, b) => a - b)); };

  return (
    <div className="aqb-picker">
      <section className="aqb-hero">
        <p className="aqb-kicker">Amboss Quest · Qbank</p>
        <h1>The AMBOSS Qbank</h1>
        <p className="aqb-sub">Block by block, in tutor mode. Ask for a hint when you are stuck, and read why every option is right or wrong.</p>
        {system && (
          <div className="aqb-hero-stats">
            <span><b>{done}</b>/{total} done</span>
            <span><b>{done ? Math.round((right / done) * 100) : 0}%</b> correct</span>
          </div>
        )}
      </section>

      {setup && <p className="aqb-error">The Qbank is not set up yet. An admin needs to run <code>amboss-qbank-migration.sql</code> and import a question pack.</p>}
      {error && <p className="aqb-error">{error}</p>}
      {!catalog && !error && <div className="aqb-loading"><span /><span /><span /></div>}

      {catalog && catalog.length > 1 && (
        <section className="aqb-panel">
          <h2>System</h2>
          <div className="aqb-seg">
            {catalog.map(s => (
              <button key={s.id} type="button" className={system?.id === s.id ? 'is-on' : ''}
                onClick={() => { sfx.select(); setSys(s.id); setBlocks([]); }}>
                {SYSTEM_ICON[s.id] || '🗂️'} {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {system && (
        <section className="aqb-panel">
          <div className="aqb-panel-head">
            <h2>{SYSTEM_ICON[system.id] || '🗂️'} {system.name} · blocks</h2>
            <div>
              <button type="button" className="aqb-link" onClick={() => { sfx.select(); setBlocks(list.map(b => b.block)); }}>Select all</button>
              <button type="button" className="aqb-link" onClick={() => { sfx.select(); setBlocks([]); }}>Clear</button>
            </div>
          </div>
          <div className="aqb-blocks">
            {list.map(b => {
              const on = blocks.includes(b.block);
              const pctDone = b.total ? (b.answered / b.total) * 100 : 0;
              const pctRight = b.total ? (b.correct / b.total) * 100 : 0;
              return (
                <button key={b.block} type="button" className={`aqb-block${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(b.block)}>
                  <span className="aqb-block-check" aria-hidden="true">{on ? '✓' : ''}</span>
                  <span className="aqb-block-name">Block {b.block}</span>
                  <span className="aqb-block-meta">{b.total} questions</span>
                  <span className="aqb-bar" aria-hidden="true">
                    <i className="aqb-bar-done" style={{ width: `${pctDone}%` }} />
                    <i className="aqb-bar-right" style={{ width: `${pctRight}%` }} />
                  </span>
                  <span className="aqb-block-meta">
                    {b.answered ? `${b.answered}/${b.total} done · ${Math.round((b.correct / b.answered) * 100)}% correct` : 'Not started'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {system && (
        <section className="aqb-panel aqb-opts">
          <div>
            <h2>Questions</h2>
            <div className="aqb-seg">
              {SCOPES.map(([id, label]) => (
                <button key={id} type="button" className={scope === id ? 'is-on' : ''} onClick={() => { sfx.select(); setScope(id); }}>{label}</button>
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

      {system && (
        <div className="aqb-start">
          {startError && <p className="aqb-error">{startError}</p>}
          <button type="button" className="aqb-btn aqb-btn--go" disabled={!chosen.length || !pool || starting} onClick={onStart}>
            {starting ? 'Loading…' : !chosen.length ? 'Pick a block' : !pool ? 'Nothing to do here' : `Start · ${pool} question${pool === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── One question ────────────────────────────────────────────────────────────
function Question({ q, pos, total, st, onPick, onStrike, onHint, onSubmit, onToggleExp, onZoom }) {
  const submitted = st.submitted;
  const correctIdx = LETTERS.indexOf(q.correct);
  return (
    <article className="aqb-q">
      <header className="aqb-q-head">
        <span className="aqb-q-pos">Question {pos + 1} <small>of {total}</small></span>
        <span className="aqb-q-tag">Block {q.block} · #{q.num}</span>
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
                  <span className="aqb-review-ans">{s?.submitted ? `${LETTERS[s.pick]} → ${q.correct}` : '—'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const freshState = () => ({ pick: null, struck: [], hint: false, submitted: false, open: [] });

export default function AmbossQbank() {
  const prefs = useMemo(loadPrefs, []);
  const [phase, setPhase] = useState('pick');
  const [catalog, setCatalog] = useState(null);
  const [setup, setSetup] = useState(false);
  const [error, setError] = useState('');
  const [sys, setSys] = useState(prefs.sys || null);
  const [blocks, setBlocks] = useState(prefs.blocks || []);
  const [scope, setScope] = useState(prefs.scope || 'all');
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
  const st = states[idx] || freshState();
  const study = useStudySession({ mode: 'amboss_qbank', active: phase === 'run', subject: q?.system || null });
  useStudyActivity(phase === 'run' ? 'Amboss Qbank' : null, null, 'amboss_qbank');

  const loadCatalog = useCallback(() => {
    if (!getToken()) { setError('Sign in to use the Qbank; your progress is saved to your account.'); return; }
    authFetch('/api/amboss-qbank/catalog')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d.systems)) throw new Error(d.error || 'bad');
        setCatalog(d.systems);
        setSetup(Boolean(d.setup));
        if (!d.systems.length && !d.setup) setError('No Qbank questions have been added yet.');
        setSys(s => (d.systems.some(x => x.id === s) ? s : d.systems[0]?.id || null));
      })
      .catch(() => setError('Could not load the Qbank. Check your connection and try again.'));
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ sys, blocks, scope, shuffle })); } catch { /* not remembered */ }
  }, [sys, blocks, scope, shuffle]);

  function begin(list) {
    setQs(list); setStates(list.map(freshState)); setIdx(0);
    setPhase('run'); study.flush(); study.touch();
    toTop(false);
  }

  async function start() {
    setStarting(true); setStartError('');
    try {
      const params = new URLSearchParams({ system: sys || catalog?.[0]?.id || '', blocks: blocks.join(','), scope });
      const r = await authFetch(`/api/amboss-qbank/questions?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not load the questions.');
      let list = d.questions || [];
      if (!list.length) throw new Error(scope === 'incorrect' ? 'Nothing answered incorrectly in those blocks.' : scope === 'unused' ? 'You have done every question in those blocks.' : 'No questions came back.');
      if (shuffle) list = [...list].sort(() => Math.random() - 0.5);
      begin(list);
    } catch (e) { setStartError(e.message); }
    setStarting(false);
  }

  const patch = useCallback((fn) => setStates(ss => { const n = ss.slice(); n[idx] = fn(n[idx] || freshState()); return n; }), [idx]);

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
    authFetch('/api/amboss-qbank/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: q.id, choice: LETTERS[st.pick], used_hint: st.hint }),
    }).catch(() => {});
  }, [q, st, patch, study]);

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
          <Picker catalog={catalog} error={error} setup={setup} sys={sys} setSys={setSys} blocks={blocks} setBlocks={setBlocks}
            scope={scope} setScope={setScope} shuffle={shuffle} setShuffle={setShuffle} onStart={start} starting={starting} startError={startError} />
        )}
        {phase === 'run' && q && (
          <>
            <Question q={q} pos={idx} total={qs.length} st={st} onPick={pick} onStrike={strike} onHint={hint}
              onSubmit={submit} onToggleExp={toggleExp} onZoom={setZoom} />
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
