import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch, getToken } from '../auth';
import { SERVER_URL } from '../serverUrl';
import { renderStem } from '../utils/renderStem';
import { sfx } from '../minigameSfx';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import SfxToggle from './SfxToggle';
import './Amboss200.css';

/**
 * Amboss 200 Concepts — an expedition through the 200 concepts, played as a
 * game rather than worked down like a qbank.
 *
 *   BASECAMP   pick the systems to explore (any mix), which questions
 *              (all / not seen yet / ones I missed), how many, and timed or
 *              not. Each system tile shows how much of it has been charted.
 *   EXPEDITION one vignette at a time; answer, then the HY explanation card
 *              (concept, why, the high-yield facts, the trap). Streaks build
 *              a combo multiplier; every question is a waypoint on the trail.
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
const TIME_LIMIT = 90;
const SEL_KEY = 'mv_amboss200_systems';

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
function Basecamp({ catalog, error, picked, setPicked, scope, setScope, count, setCount, timed, setTimed, onStart, starting, startError }) {
  const systems = catalog || [];
  const chosen = systems.filter(s => picked.includes(s.id));
  const pool = chosen.reduce((n, s) => n + (scope === 'unseen' ? s.total - s.seen : scope === 'missed' ? s.wrong : s.total), 0);
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
        <div>
          <h2>2 · Which questions</h2>
          <div className="a2-seg">
            {[['all', 'All'], ['unseen', 'Not seen yet'], ['missed', 'Ones I missed']].map(([id, label]) => (
              <button key={id} type="button" className={scope === id ? 'is-on' : ''} onClick={() => { sfx.select(); setScope(id); }}>{label}</button>
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
            <button type="button" className={timed ? 'is-on' : ''} onClick={() => { sfx.select(); setTimed(true); }}>⏱ {TIME_LIMIT}s each</button>
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
function HYCard({ q, right }) {
  const hy = q.hy;
  const answerText = q.options?.[LETTERS.indexOf(q.correct)];
  return (
    <div className={`a2-hy ${right ? 'is-right' : 'is-wrong'}`}>
      <div className="a2-hy-top">
        <span className="a2-hy-badge">HY</span>
        <div>
          <p className="a2-hy-kicker">{right ? 'Concept unlocked' : `Answer: ${q.correct}. ${answerText || ''}`}</p>
          <h3 className="a2-hy-title">{hy?.c || answerText}</h3>
        </div>
      </div>
      {hy ? (
        <>
          <p className="a2-hy-why">{hy.w}</p>
          <ul className="a2-hy-list">
            {hy.hy.map((f, i) => <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>{f}</li>)}
          </ul>
          {hy.t && <p className="a2-hy-trap"><b>Trap:</b> {hy.t}</p>}
        </>
      ) : q.explanation ? <p className="a2-hy-why">{q.explanation}</p> : null}
    </div>
  );
}

// ── Expedition ──────────────────────────────────────────────────────────────
function Expedition({ qs, idx, results, picked, onAnswer, onNext, onQuit, timed, combo, score }) {
  const q = qs[idx];
  const [time, setTime] = useState(TIME_LIMIT);
  useEffect(() => { setTime(TIME_LIMIT); }, [idx]);
  useEffect(() => {
    if (!timed || picked !== null) return undefined;
    if (time <= 0) { onAnswer(-1); return undefined; }
    const t = setTimeout(() => setTime(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, time, picked, onAnswer]);

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
        <div className={`a2-timer${time <= 15 ? ' is-low' : ''}`}><div style={{ width: `${(time / TIME_LIMIT) * 100}%` }} /><span>{time}s</span></div>
      )}

      <div className="a2-qgrid">
        <article className="a2-qcard" key={q.id}>
          <div className="a2-qmeta">
            <span className="a2-qsys">{iconFor(q.subject)} {q.subjectName}</span>
            <span className="a2-qno">Waypoint {idx + 1} / {qs.length}</span>
          </div>
          <div className="a2-stem stem-text">{renderStem(q.question)}</div>
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
              <HYCard q={q} right={right} />
              <button type="button" className="a2-go" onClick={onNext}>{idx + 1 >= qs.length ? 'Reach the summit →' : 'Next waypoint →'}</button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Summit ──────────────────────────────────────────────────────────────────
function Summit({ results, score, bestCombo, onAgain, onMissed }) {
  const right = results.filter(r => r.right).length;
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
  const [scope, setScope] = useState('all');
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(false);
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
      const qsParams = new URLSearchParams({ subjects: picked.join(','), scope, count: String(count || 200) });
      const r = await authFetch(`/api/amboss200/run?${qsParams}`);
      const d = await r.json();
      if (!d.questions?.length) throw new Error(scope === 'missed' ? 'Nothing missed in those systems yet — nice.' : scope === 'unseen' ? 'You have seen every question in those systems.' : 'No questions came back.');
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
          <Basecamp catalog={catalog} error={error} picked={picked} setPicked={setPicked} scope={scope} setScope={setScope}
            count={count} setCount={setCount} timed={timed} setTimed={setTimed} onStart={start} starting={starting} startError={startError} />
        )}
        {phase === 'run' && q && (
          <Expedition qs={qs} idx={idx} results={results} picked={choice} onAnswer={answer} onNext={next} onQuit={quit}
            timed={timed} combo={combo} score={score} />
        )}
        {phase === 'summit' && (
          <Summit results={results.filter(Boolean)} score={score} bestCombo={bestCombo}
            onAgain={() => setPhase('camp')}
            onMissed={() => begin(results.filter(r => r && !r.right).map(r => r.q))} />
        )}
      </main>
    </div>
  );
}
