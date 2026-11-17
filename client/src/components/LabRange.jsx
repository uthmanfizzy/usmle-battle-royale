import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, LABS, parseNum, gradeBound, rangeText, tolFor, fmt } from '../labs/labValues';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './LabRange.css';

/**
 * Lab Values — type the normal range from memory.
 *
 * A card names a lab and its unit; the player types the low and high limit
 * (or one limit, for "below X" / "at least X" values). Each bound is graded
 * against the NBME sheet with a tolerance, because books disagree by a unit
 * or two: within tolerance is exact (10 pts), within three times it is close
 * (5 pts). A card with every bound exact keeps the streak going, and the
 * streak adds a bonus. The reveal shows the real range and one clinical pearl.
 *
 * A study view lists every value by category. Nothing is sent to the server;
 * the best score per round length lives in localStorage (per-viewer only).
 */

const EXACT_PTS = 10;
const CLOSE_PTS = 5;
const LENGTHS = [10, 20, 0];   // 0 = every lab in the chosen categories

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function readBest(key) {
  try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; }
}
function writeBest(key, v) {
  try { localStorage.setItem(key, String(v)); } catch { /* storage blocked */ }
}

function boundsOf(lab) {
  if (lab.kind === 'max') return [{ key: 'high', label: 'Upper limit', prefix: '<' }];
  if (lab.kind === 'min') return [{ key: 'low', label: 'Lower limit', prefix: '≥' }];
  return [{ key: 'low', label: 'Low' }, { key: 'high', label: 'High' }];
}

function Bubbles() {
  return (
    <div className="lv-bubbles" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
    </div>
  );
}

export default function LabRange({ onExit }) {
  const [view, setView] = useState('home');           // home | play | done | study
  const [cats, setCats] = useState(() => Object.keys(CATEGORIES));
  const [length, setLength] = useState(10);
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [inputs, setInputs] = useState({ low: '', high: '' });
  const [result, setResult] = useState(null);          // { grades: {low, high}, pts, nailed }
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [log, setLog] = useState([]);                  // [{ lab, inputs, grades, pts }]
  const [search, setSearch] = useState('');
  const firstInput = useRef(null);
  const nextBtn = useRef(null);

  const pool = useMemo(() => LABS.filter(l => cats.includes(l.cat)), [cats]);
  const bestKey = `lv-best-${length}`;
  const [best, setBest] = useState(() => readBest(bestKey));
  useEffect(() => { setBest(readBest(bestKey)); }, [bestKey]);

  const lab = deck[idx];

  useEffect(() => {
    if (view !== 'play') return;
    if (result) nextBtn.current?.focus();
    else firstInput.current?.focus();
  }, [view, idx, result]);

  const start = (labs) => {
    const d = shuffle(labs);
    setDeck(length && labs === pool ? d.slice(0, length) : d);
    setIdx(0); setInputs({ low: '', high: '' }); setResult(null);
    setScore(0); setStreak(0); setBestStreak(0); setLog([]);
    setView('play');
    sfx.select();
  };

  const submit = () => {
    if (!lab || result) return;
    const bounds = boundsOf(lab);
    if (bounds.some(b => inputs[b.key].trim() === '')) return;
    const grades = {};
    let pts = 0;
    for (const b of bounds) {
      const g = gradeBound(lab, parseNum(inputs[b.key]), lab[b.key]);
      grades[b.key] = g;
      pts += g === 'exact' ? EXACT_PTS : g === 'close' ? CLOSE_PTS : 0;
    }
    // A range whose bounds are swapped is still a range the player knows.
    if (lab.kind === 'range' && grades.low === 'miss' && grades.high === 'miss') {
      const lo = parseNum(inputs.high), hi = parseNum(inputs.low);
      const gl = gradeBound(lab, lo, lab.low), gh = gradeBound(lab, hi, lab.high);
      if (gl !== 'miss' && gh !== 'miss') {
        grades.low = gl; grades.high = gh;
        pts = (gl === 'exact' ? EXACT_PTS : CLOSE_PTS) + (gh === 'exact' ? EXACT_PTS : CLOSE_PTS);
      }
    }
    const nailed = bounds.every(b => grades[b.key] === 'exact');
    // Single-bound cards are worth the same as a range.
    if (bounds.length === 1) pts *= 2;
    let bonus = 0;
    if (nailed) {
      const s = streak + 1;
      bonus = Math.min(10, (s - 1) * 2);
      setStreak(s);
      setBestStreak(b => Math.max(b, s));
      sfx.correct();
      if (s > 2) setTimeout(() => sfx.sparkle?.(), 160);
    } else {
      setStreak(0);
      if (pts > 0) sfx.select(); else sfx.wrong();
    }
    const total = pts + bonus;
    setScore(sc => sc + total);
    setResult({ grades, pts: total, bonus, nailed });
    setLog(l => [...l, { lab, inputs: { ...inputs }, grades, pts: total, nailed }]);
  };

  const next = () => {
    if (idx + 1 >= deck.length) {
      const final = score;
      if (final > best && deck.length >= (length || 1)) { setBest(final); writeBest(bestKey, final); }
      sfx.fanfare?.();
      setView('done');
      return;
    }
    setIdx(i => i + 1);
    setInputs({ low: '', high: '' });
    setResult(null);
  };

  const onKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (result) next(); else submit();
  };

  const toggleCat = (c) => {
    sfx.select();
    setCats(cs => (cs.includes(c) ? (cs.length > 1 ? cs.filter(x => x !== c) : cs) : [...cs, c]));
  };

  // ── Home ──────────────────────────────────────────────────────────────
  if (view === 'home') {
    const n = length ? Math.min(length, pool.length) : pool.length;
    return (
      <div className="lv">
        <Bubbles />
        <div className="lv-top">
          {onExit && <button type="button" className="lv-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <header className="lv-hero">
          <span className="lv-hero-icon" aria-hidden="true">🧪</span>
          <p className="lv-kicker">Clinical labs · Minigame</p>
          <h1 className="lv-title">Lab Values</h1>
          <p className="lv-lede">
            A lab comes up with its unit. Type the normal range from memory, then
            see the real one and why it matters. Close counts for half.
          </p>
        </header>

        <section className="lv-cats" aria-label="Categories">
          {Object.entries(CATEGORIES).map(([id, c]) => {
            const on = cats.includes(id);
            const count = LABS.filter(l => l.cat === id).length;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                className={`lv-cat${on ? ' is-on' : ''}`}
                style={{ '--acc': c.accent }}
                onClick={() => toggleCat(id)}
              >
                <span className="lv-cat-icon" aria-hidden="true">{c.icon}</span>
                <span className="lv-cat-name">{c.name}</span>
                <span className="lv-cat-n">{count} values</span>
              </button>
            );
          })}
        </section>

        <div className="lv-panel">
          <div className="lv-row">
            <span className="lv-label">Round</span>
            <div className="lv-seg" role="group" aria-label="Round length">
              {LENGTHS.map(L => (
                <button key={L} type="button" className={length === L ? 'is-on' : ''} onClick={() => { sfx.select(); setLength(L); }}>
                  {L ? `${L} labs` : 'All'}
                </button>
              ))}
            </div>
            {best > 0 && <span className="lv-best">Best: <b>{best}</b></span>}
          </div>
          <div className="lv-actions">
            <button type="button" className="lv-start" onClick={() => start(pool)}>Start · {n} labs</button>
            <button type="button" className="lv-ghost" onClick={() => { sfx.select(); setView('study'); }}>Study the sheet</button>
          </div>
          <p className="lv-fine">
            Ranges follow the NBME lab values sheet. Commas are fine (150,000), and
            WBC and platelets can be typed in thousands (4.5 for 4,500).
          </p>
        </div>
      </div>
    );
  }

  // ── Study ─────────────────────────────────────────────────────────────
  if (view === 'study') {
    const q = search.trim().toLowerCase();
    return (
      <div className="lv">
        <Bubbles />
        <div className="lv-top">
          <button type="button" className="lv-back" onClick={() => setView('home')}>← Back</button>
          <SfxToggle />
        </div>
        <div className="lv-study-head">
          <h1 className="lv-title">The sheet</h1>
          <input className="lv-search" type="search" placeholder="Search a lab…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {Object.entries(CATEGORIES).map(([id, c]) => {
          const rows = LABS.filter(l => l.cat === id && (!q || l.name.toLowerCase().includes(q) || l.note.toLowerCase().includes(q)));
          if (!rows.length) return null;
          return (
            <section key={id} className="lv-study-cat" style={{ '--acc': c.accent }}>
              <h2>{c.icon} {c.name}</h2>
              <div className="lv-table">
                {rows.map(l => (
                  <div key={l.id} className="lv-tr">
                    <span className="lv-td-name">{l.name}</span>
                    <span className="lv-td-range">{rangeText(l)}</span>
                    <span className="lv-td-note">{l.note}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────
  if (view === 'done') {
    const nailed = log.filter(e => e.nailed).length;
    const misses = log.filter(e => !e.nailed);
    const max = log.length * EXACT_PTS * 2;
    return (
      <div className="lv">
        <Bubbles />
        <div className="lv-top">
          {onExit && <button type="button" className="lv-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <header className="lv-hero">
          <span className="lv-hero-icon" aria-hidden="true">{nailed === log.length ? '🏆' : '📋'}</span>
          <h1 className="lv-title">{score} points</h1>
          <p className="lv-lede">
            {nailed} of {log.length} nailed · best streak {bestStreak} · {Math.round((score / Math.max(1, max)) * 100)}% before bonuses
            {score >= best && score > 0 && deck.length >= (length || 1) ? ' · new best!' : ''}
          </p>
        </header>
        {misses.length > 0 && (
          <div className="lv-panel lv-review">
            <h2>Worth another look</h2>
            {misses.map((e, i) => (
              <div key={i} className="lv-tr">
                <span className="lv-td-name">{e.lab.name}</span>
                <span className="lv-td-range">{rangeText(e.lab)}</span>
                <span className="lv-td-note">
                  You said {boundsOf(e.lab).map(b => `${b.prefix || ''}${e.inputs[b.key]}`).join('–')}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="lv-actions">
          <button type="button" className="lv-start" onClick={() => start(pool)}>Play again</button>
          {misses.length > 0 && (
            <button type="button" className="lv-ghost" onClick={() => start(misses.map(e => e.lab))}>Retry the {misses.length} missed</button>
          )}
          <button type="button" className="lv-ghost" onClick={() => setView('home')}>Change categories</button>
        </div>
      </div>
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────
  const c = CATEGORIES[lab.cat];
  const bounds = boundsOf(lab);
  const gradeWord = { exact: 'Spot on', close: 'Close', miss: 'Off' };
  return (
    <div className="lv" style={{ '--acc': c.accent }}>
      <Bubbles />
      <div className="lv-top">
        <button type="button" className="lv-back" onClick={() => setView('home')}>← Quit</button>
        <div className="lv-hud">
          <span><b>{idx + 1}</b>/{deck.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={streak >= 3 ? 'is-hot' : ''}>Streak <b>{streak}</b>{streak >= 3 ? ' 🔥' : ''}</span>
          <SfxToggle />
        </div>
      </div>
      <div className="lv-progress"><span style={{ width: `${((idx + (result ? 1 : 0)) / deck.length) * 100}%` }} /></div>

      <article key={lab.id} className={`lv-card${result ? (result.nailed ? ' is-good' : ' is-off') : ''}`}>
        <p className="lv-card-cat">{c.icon} {c.name}</p>
        <h2 className="lv-card-name">{lab.name}</h2>
        <p className="lv-card-ask">
          {lab.kind === 'max' ? 'Normal is below…' : lab.kind === 'min' ? 'Normal is at least…' : 'Normal range is…'}
        </p>

        <div className="lv-inputs">
          {bounds.map((b, i) => (
            <label key={b.key} className={`lv-field${result ? ` is-${result.grades[b.key]}` : ''}`}>
              <span className="lv-field-label">{b.label}</span>
              <span className="lv-field-box">
                {b.prefix && <span className="lv-field-prefix">{b.prefix}</span>}
                <input
                  ref={i === 0 ? firstInput : null}
                  inputMode="decimal"
                  autoComplete="off"
                  value={inputs[b.key]}
                  disabled={!!result}
                  onChange={e => setInputs(v => ({ ...v, [b.key]: e.target.value }))}
                  onKeyDown={onKey}
                  aria-label={`${lab.name} ${b.label.toLowerCase()}`}
                />
              </span>
              {result && <span className="lv-field-grade">{gradeWord[result.grades[b.key]]}</span>}
            </label>
          )).reduce((acc, el, i) => (i ? [...acc, <span key={`dash${i}`} className="lv-dash">–</span>, el] : [el]), [])}
          {lab.unit && <span className="lv-unit">{lab.unit}</span>}
        </div>

        {!result ? (
          <button
            type="button"
            className="lv-start"
            onClick={submit}
            disabled={bounds.some(b => inputs[b.key].trim() === '')}
          >
            Check
          </button>
        ) : (
          <div className="lv-reveal">
            <p className="lv-answer">
              Normal: <b>{rangeText(lab)}</b>
              <span className="lv-pts">+{result.pts}{result.bonus ? ` (streak +${result.bonus})` : ''}</span>
            </p>
            <p className="lv-tol">Accepted within ±{fmt(Number(tolFor(lab, lab.kind === 'min' ? lab.low : lab.high).toPrecision(2)))} of each limit.</p>
            <p className="lv-note">💡 {lab.note}</p>
            <button ref={nextBtn} type="button" className="lv-start" onClick={next}>
              {idx + 1 >= deck.length ? 'See results' : 'Next lab →'}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
