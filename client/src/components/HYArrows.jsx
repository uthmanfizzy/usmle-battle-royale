import { useEffect, useMemo, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import './HYArrows.css';

/**
 * HY Arrows — Mehlman Rapid Fire's arrow drill.
 *
 * Pick one or more systems, then for each scenario fill in a table: every
 * value gets ↑, ↓ or ↔. Check the table, see which rows were right, read why,
 * move on. Scored per arrow and per table (a table only counts as perfect
 * when every row is right). Bank: server/hyarrows.
 */

const COUNT_LABEL = { 0: 'All' };
const ARROW_NAME = { '↑': 'increased', '↓': 'decreased', '↔': 'unchanged' };

// The bank writes ions plainly (Ca2+, PO43-, HCO3-); show them as formulas.
const FORMULAS = [
  [/PO43-/g, 'PO₄³⁻'], [/HCO3-/g, 'HCO₃⁻'], [/Ca2\+/g, 'Ca²⁺'], [/Mg2\+/g, 'Mg²⁺'],
  [/\bNa\+/g, 'Na⁺'], [/\bK\+/g, 'K⁺'], [/\bH\+/g, 'H⁺'], [/\bCl-/g, 'Cl⁻'],
  [/\bCO2\b/g, 'CO₂'], [/\bpO2\b/g, 'pO₂'], [/\bO2\b/g, 'O₂'], [/\(OH\)2/g, '(OH)₂'],
];
const chem = (t) => FORMULAS.reduce((x, [re, to]) => x.replace(re, to), String(t || ''));

/** The explanation, with ==high-yield== phrases in Mehlman yellow. */
function Explanation({ text }) {
  return (
    <p className="hya-expl-text">
      {String(text || '').split('==').map((p, i) => (i % 2 ? <mark key={i}>{chem(p)}</mark> : <span key={i}>{chem(p)}</span>))}
    </p>
  );
}

function Chooser({ catalog, error, picked, setPicked, count, setCount, order, setOrder, onStart, onExit }) {
  const subjects = catalog?.subjects || [];
  const pool = picked.length ? subjects.filter(s => picked.includes(s.id)).reduce((n, s) => n + s.count, 0) : (catalog?.total || 0);
  const toggle = (id) => { sfx.select(); setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])); };
  const n = count && count < pool ? count : pool;
  return (
    <div className="hya-chooser">
      <button type="button" className="hya-back" onClick={onExit}>← Mehlman</button>
      <header className="hya-hero">
        <div className="hya-hero-arrows" aria-hidden="true"><span>↑</span><span>↓</span><span>↔</span></div>
        <h1>HY ARROWS</h1>
        <p>For every scenario, decide which way each value goes. Pick the systems you want to drill.</p>
      </header>

      <section className="hya-section">
        <div className="hya-section-head">
          <span>SYSTEMS</span>
          <button type="button" className="hya-link" onClick={() => { sfx.select(); setPicked([]); }} disabled={!picked.length}>
            {picked.length ? 'Clear — use all systems' : 'All systems selected'}
          </button>
        </div>
        <div className="hya-grid">
          <button type="button" className={`hya-subject hya-subject--all${!picked.length ? ' is-on' : ''}`}
            aria-pressed={!picked.length} onClick={() => { sfx.select(); setPicked([]); }}>
            <span className="hya-subject-icon" aria-hidden="true">🗂️</span>
            <span className="hya-subject-name">All systems</span>
            <span className="hya-subject-count">{catalog?.total || 0} tables</span>
          </button>
          {subjects.map(s => (
            <button key={s.id} type="button" className={`hya-subject${picked.includes(s.id) ? ' is-on' : ''}`}
              aria-pressed={picked.includes(s.id)} onClick={() => toggle(s.id)}>
              <span className="hya-subject-icon" aria-hidden="true">{s.icon}</span>
              <span className="hya-subject-name">{s.name}</span>
              <span className="hya-subject-count">{s.count} tables</span>
              <span className="hya-subject-check" aria-hidden="true">{picked.includes(s.id) ? '✓' : ''}</span>
            </button>
          ))}
          {!catalog && !error && <p className="hya-muted">Loading systems…</p>}
        </div>
      </section>

      <section className="hya-section hya-options">
        <div>
          <span className="hya-section-head"><span>TABLES PER SET</span></span>
          <div className="hya-pills">
            {(catalog?.counts || [10, 20, 0]).map(c => (
              <button key={c} type="button" className={`hya-pill${count === c ? ' is-on' : ''}`} aria-pressed={count === c}
                onClick={() => { sfx.select(); setCount(c); }}>{COUNT_LABEL[c] || c}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="hya-section-head"><span>ORDER</span></span>
          <div className="hya-pills">
            {[['shuffle', 'Shuffled'], ['book', 'In order']].map(([id, label]) => (
              <button key={id} type="button" className={`hya-pill${order === id ? ' is-on' : ''}`} aria-pressed={order === id}
                onClick={() => { sfx.select(); setOrder(id); }}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="hya-error">{error}</p>}
      <button type="button" className="hya-start" disabled={!pool} onClick={onStart}>
        {pool ? `Start — ${n} arrow table${n === 1 ? '' : 's'}` : !catalog ? 'Loading…' : 'Nothing here yet'} <span aria-hidden="true">▸</span>
      </button>
      <div className="hya-foot"><SfxToggle /></div>
    </div>
  );
}

function ArrowTable({ q, idx, total, picks, setPick, checked, onCheck, onNext }) {
  const filled = q.rows.every((_, i) => picks[i]);
  const rightRows = q.rows.filter((r, i) => picks[i] === r.arrow).length;
  const perfect = checked && rightRows === q.rows.length;

  useEffect(() => {
    function key(e) {
      if (e.key === 'Enter') {
        if (!checked && filled) { e.preventDefault(); onCheck(); }
        else if (checked) { e.preventDefault(); onNext(); }
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [checked, filled, onCheck, onNext]);

  return (
    <div className="hya-card">
      <div className="hya-card-top">
        <span className="hya-tag">{q.subjectName}</span>
        <span className="hya-num">Mehlman HY Arrows #{q.n}</span>
      </div>
      <h2 className="hya-stem">{chem(q.stem)}</h2>

      <div className="hya-table-wrap">
        <table className="hya-table">
          <thead>
            <tr>
              <th scope="col" className="hya-th-label">Value</th>
              {q.arrows.map(a => <th key={a} scope="col" className="hya-th-arrow" title={ARROW_NAME[a]}>{a}</th>)}
              {checked && <th scope="col" className="hya-th-res"><span className="hya-sr">Result</span></th>}
            </tr>
          </thead>
          <tbody>
            {q.rows.map((r, i) => {
              const mine = picks[i];
              const ok = checked && mine === r.arrow;
              return (
                <tr key={r.label} className={checked ? (ok ? 'is-right' : 'is-wrong') : ''} style={{ '--i': i }}>
                  <th scope="row" className="hya-td-label">{chem(r.label)}</th>
                  {q.arrows.map(a => {
                    let cls = '';
                    if (checked) {
                      if (a === r.arrow) cls = ' is-answer';
                      else if (a === mine) cls = ' is-miss';
                    } else if (a === mine) cls = ' is-on';
                    return (
                      <td key={a} className="hya-td-arrow">
                        <button type="button" className={`hya-cell${cls}`} disabled={checked}
                          aria-pressed={mine === a} aria-label={`${r.label}: ${ARROW_NAME[a]}`}
                          onClick={() => { sfx.select(); setPick(i, a); }}>
                          {a}
                        </button>
                      </td>
                    );
                  })}
                  {checked && <td className="hya-td-res" aria-label={ok ? 'correct' : 'incorrect'}>{ok ? '✓' : '✗'}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!checked ? (
        <div className="hya-actions">
          <span className="hya-muted">{q.rows.filter((_, i) => picks[i]).length}/{q.rows.length} arrows filled</span>
          <button type="button" className="hya-start hya-check" disabled={!filled} onClick={onCheck}>Check arrows ▸</button>
        </div>
      ) : (
        <div className={`hya-expl${perfect ? ' is-perfect' : ''}`}>
          <p className="hya-expl-head">
            {perfect ? '✓ Every arrow right' : `${rightRows} of ${q.rows.length} arrows right`}
          </p>
          <Explanation text={q.explanation} />
          <button type="button" className="hya-start hya-next" onClick={onNext} autoFocus>
            {idx + 1 >= total ? 'See results' : 'Next table'} ▸
          </button>
        </div>
      )}
    </div>
  );
}

function Results({ results, onAgain, onExit }) {
  const arrows = results.reduce((n, r) => n + r.total, 0);
  const right = results.reduce((n, r) => n + r.right, 0);
  const perfect = results.filter(r => r.right === r.total).length;
  const pct = arrows ? Math.round((right / arrows) * 100) : 0;
  const bySubject = {};
  results.forEach(r => {
    const s = (bySubject[r.q.subjectName] ||= { right: 0, total: 0 });
    s.right += r.right; s.total += r.total;
  });
  const missed = results.filter(r => r.right < r.total);
  return (
    <div className="hya-results">
      <div className="hya-score">
        <span className="hya-score-pct">{pct}%</span>
        <span className="hya-muted">of arrows right — {right}/{arrows}</span>
        <span className="hya-score-perfect">{perfect}/{results.length} tables perfect</span>
      </div>
      <div className="hya-bars">
        {Object.entries(bySubject).map(([s, v]) => (
          <div key={s} className="hya-bar">
            <span>{s}</span>
            <i><em style={{ width: `${(v.right / v.total) * 100}%` }} /></i>
            <b>{v.right}/{v.total}</b>
          </div>
        ))}
      </div>
      {missed.length > 0 && (
        <div className="hya-missed">
          <p className="hya-section-head"><span>GO BACK OVER THESE</span></p>
          {missed.map(r => (
            <div key={r.q.id} className="hya-missed-row">
              <span className="hya-missed-num">#{r.q.n}</span>
              <span>
                <b>{chem(r.q.stem)}</b>
                <small>{chem(r.q.rows.map(x => `${x.arrow} ${x.label}`).join(' · '))}</small>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="hya-results-actions">
        <button type="button" className="hya-start" onClick={onAgain}>Another set ▸</button>
        <button type="button" className="hya-back" onClick={onExit}>← Mehlman</button>
      </div>
    </div>
  );
}

export default function HYArrows({ onExit }) {
  const exit = onExit || (() => { window.location.href = '/mehlman'; });
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState([]);
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState('shuffle');
  const [phase, setPhase] = useState('choose');
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState([]);

  const study = useStudySession({ mode: 'hy_arrows', active: phase === 'run', subject: picked.length === 1 ? picked[0] : null });
  useStudyActivity(phase === 'run' ? 'HY Arrows' : null, null, 'hy_arrows');

  useEffect(() => {
    fetch(`${SERVER_URL}/api/hy-arrows/catalog`)
      .then(r => r.json())
      .then(setCatalog)
      .catch(() => setError('Could not load HY Arrows. Check your connection and try again.'));
  }, []);

  async function start() {
    setError('');
    try {
      const params = new URLSearchParams({ count: String(count), order });
      if (picked.length) params.set('subjects', picked.join(','));
      const r = await fetch(`${SERVER_URL}/api/hy-arrows/run?${params}`);
      const d = await r.json();
      if (!d.questions?.length) throw new Error('No tables came back.');
      study.flush(); study.touch();
      setQs(d.questions); setIdx(0); setPicks({}); setChecked(false); setResults([]);
      setPhase('run');
      window.scrollTo(0, 0);
    } catch (err) { setError(err.message); }
  }

  const q = qs[idx];
  const correct = useMemo(() => results.reduce((n, r) => n + r.right, 0), [results]);
  const done = useMemo(() => results.reduce((n, r) => n + r.total, 0), [results]);

  function check() {
    if (!q || checked) return;
    const right = q.rows.filter((r, i) => picks[i] === r.arrow).length;
    const all = right === q.rows.length;
    if (all) sfx.correct(); else sfx.wrong();
    setChecked(true);
    setResults(rs => [...rs, { q, right, total: q.rows.length }]);
    study.count(all);
  }

  function next() {
    study.touch();
    if (idx + 1 >= qs.length) { study.flush(); sfx.fanfare(); setPhase('results'); window.scrollTo(0, 0); return; }
    sfx.next();
    setIdx(i => i + 1); setPicks({}); setChecked(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="hya">
      {phase === 'choose' && (
        <Chooser catalog={catalog} error={error} picked={picked} setPicked={setPicked} count={count} setCount={setCount}
          order={order} setOrder={setOrder} onStart={start} onExit={exit} />
      )}
      {phase === 'run' && q && (
        <div className="hya-run">
          <header className="hya-bar-top">
            <button type="button" className="hya-back" onClick={() => { study.flush(); setPhase(results.length ? 'results' : 'choose'); }}>✕ End set</button>
            <span className="hya-progress"><i style={{ width: `${(idx / qs.length) * 100}%` }} /></span>
            <span className="hya-count">{idx + 1}/{qs.length}</span>
            <span className="hya-arrows-score" title="Arrows right so far">{correct}/{done} ↕</span>
          </header>
          <ArrowTable key={q.id} q={q} idx={idx} total={qs.length} picks={picks}
            setPick={(i, a) => setPicks(p => ({ ...p, [i]: a }))} checked={checked} onCheck={check} onNext={next} />
        </div>
      )}
      {phase === 'results' && <Results results={results} onAgain={() => setPhase('choose')} onExit={exit} />}
    </div>
  );
}
