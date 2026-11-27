import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { triviaSfx } from '../triviaSfx';
import SfxToggle from './SfxToggle';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import './FATrivia.css';

/**
 * FA Trivia — the game-show round of First Aid Journey.
 *
 * Quick one-line questions on a First Aid chapter, four options, 15 seconds.
 * A category wheel picks each question's book section, speed and streaks
 * score points, and three once-per-show lifelines (50:50, Freeze, Double Dip)
 * can rescue a round. Every answer ends with a fun fact and its First Aid page.
 *
 * The stage has its own look (velvet curtains, marquee bulbs, spotlights) and
 * its own sounds (triviaSfx.js), so it never feels like the book-styled
 * FA Images / FA HY Qs pages.
 */

const SECONDS = 15;
const LETTERS = ['A', 'B', 'C', 'D'];
const TILE = ['pink', 'cyan', 'lime', 'amber'];
// Eight colours, so an eight-category chapter (Step 2 Obstetrics) never puts two alike side by side.
const WEDGE = ['#ff3d8b', '#22d3ee', '#a3e635', '#fb923c', '#c084fc', '#facc15', '#60a5fa', '#f87171'];
// Wheel wedges are narrow; long category names get a short label there.
const WEDGE_LABEL = {
  'Basic Bacteriology': 'Basic Bact', 'Clinical Bacteriology': 'Clin Bact', 'Laboratory Techniques': 'Lab Tech',
  Parasitology: 'Parasites', Antimicrobials: 'Antimicro', Pharmacology: 'Pharm',
  'Basics of Pregnancy': 'Basics', 'Prenatal Care & Testing': 'Prenatal', 'Maternal Complications': 'Maternal',
  'Obstetric Complications': 'Obstetric', 'Normal Labor & Delivery': 'Labor', 'Abnormal Labor & Delivery': 'Hard labor',
};
// Which book: ?step=2 is First Aid for the Step 2 CK (First Aid Journey's
// Step 2 tab links here with it); anything else is the Step 1 book.
const readStep = () => (new URLSearchParams(window.location.search).get('step') === '2' ? 2 : 1);
const STEP_DEFAULT_CHAPTER = { 1: 'repro', 2: 'ob' };
const wedgeLabel = (c) => { const s = WEDGE_LABEL[c] || c; return s.length > 11 ? `${s.slice(0, 10)}.` : s; };
const ROUND_LABEL = { 10: 'Quick show', 20: 'Full show', 30: 'Marathon' };

const RANKS = [
  [90, 'First Aid Legend', '👑'],
  [70, 'Chief Resident', '🏆'],
  [50, 'Sharp Resident', '🩺'],
  [30, 'Night Float Intern', '🌙'],
  [0, 'Lost in the Lecture Hall', '📚'],
];
const rankFor = (pct) => RANKS.find(([min]) => pct >= min);

const multiplierFor = (streak) => (streak >= 5 ? 3 : streak >= 3 ? 2 : 1);

// High scores live in this browser only — a nicety, never required.
const bestKey = (ch, n) => `mv_fa_trivia_best_${ch}_${n}`;
function readBest(ch, n) { try { return Number(localStorage.getItem(bestKey(ch, n))) || 0; } catch { return 0; } }
function writeBest(ch, n, v) { try { localStorage.setItem(bestKey(ch, n), String(v)); } catch { /* not remembered */ } }

// Questions seen today, per chapter — this browser only. Skipping them is a lobby toggle.
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const SEEN_KEY = 'mv_fa_trivia_seen';
const SKIP_KEY = 'mv_fa_trivia_skip_seen';
function readSeen(ch) {
  try {
    const d = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    return d.day === today() ? (d.ids?.[ch] || []) : [];
  } catch { return []; }
}
function addSeen(ch, id) {
  try {
    let d = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    if (d.day !== today() || !d.ids) d = { day: today(), ids: {} };
    const list = d.ids[ch] || (d.ids[ch] = []);
    const h = String(id).split('-').pop();
    if (!list.includes(h)) list.push(h);
    localStorage.setItem(SEEN_KEY, JSON.stringify(d));
  } catch { /* not remembered */ }
}
function readSkip() { try { return localStorage.getItem(SKIP_KEY) !== '0'; } catch { return true; } }
function writeSkip(v) { try { localStorage.setItem(SKIP_KEY, v ? '1' : '0'); } catch { /* not remembered */ } }

/** The fun fact, with ==marks== in marquee gold. */
function Fact({ text }) {
  return (
    <p className="ftr-fact-text">
      {String(text || '').split('==').map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
    </p>
  );
}

/** Bursts of confetti for a right answer. */
function Confetti({ seed }) {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.25, dur: 0.9 + Math.random() * 0.8,
    rot: Math.random() * 720 - 360, color: WEDGE[i % WEDGE.length], drift: Math.random() * 120 - 60,
  })), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="ftr-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, background: b.color, animationDelay: `${b.delay}s`,
          animationDuration: `${b.dur}s`, '--rot': `${b.rot}deg`, '--drift': `${b.drift}px` }} />
      ))}
    </div>
  );
}

/** The category wheel. Spins and lands on `target`, ratcheting past each wedge. */
function Wheel({ categories, target, onLanded }) {
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);
  const doneRef = useRef(onLanded);
  doneRef.current = onLanded;
  const n = categories.length;
  const seg = 360 / n;

  useEffect(() => {
    const k = Math.max(0, categories.indexOf(target));
    const center = (k + 0.5) * seg;
    const start = rotRef.current;
    const base = start - (start % 360) + 360 * 3;
    const end = base + ((360 - center) % 360) + (Math.random() - 0.5) * seg * 0.5;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 300 : 1700;
    const t0 = performance.now();
    let lastWedge = Math.floor(start / seg);
    let raf = 0;
    let lastT = t0;
    let lastR = start;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const r = start + (end - start) * eased;
      rotRef.current = r;
      setRot(r);
      const w = Math.floor(r / seg);
      if (w !== lastWedge) {
        const speed = Math.min(1, Math.abs(r - lastR) / Math.max(1, now - lastT) / 1.2);
        triviaSfx.ratchet(speed);
        lastWedge = w;
      }
      lastT = now; lastR = r;
      if (p < 1) raf = requestAnimationFrame(step);
      else land();
    };
    // Lands once, whether the animation finishes or the fallback fires first.
    let landed = false;
    let doneTimer = 0;
    const land = () => {
      if (landed) return;
      landed = true;
      cancelAnimationFrame(raf);
      rotRef.current = end; setRot(end);
      triviaSfx.land();
      doneTimer = setTimeout(() => doneRef.current(), reduce ? 150 : 550);
    };
    raf = requestAnimationFrame(step);
    // A background tab pauses requestAnimationFrame; never leave the show stuck on the wheel.
    const fallback = setTimeout(land, dur + 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); clearTimeout(doneTimer); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const arc = (i) => {
    const a0 = ((i * seg) - 90) * Math.PI / 180;
    const a1 = (((i + 1) * seg) - 90) * Math.PI / 180;
    const x0 = 100 + 94 * Math.cos(a0), y0 = 100 + 94 * Math.sin(a0);
    const x1 = 100 + 94 * Math.cos(a1), y1 = 100 + 94 * Math.sin(a1);
    return `M100,100 L${x0},${y0} A94,94 0 ${seg > 180 ? 1 : 0} 1 ${x1},${y1} Z`;
  };
  return (
    <div className="ftr-wheel-wrap">
      <div className="ftr-wheel-pointer" aria-hidden="true">▼</div>
      <svg className="ftr-wheel" viewBox="0 0 200 200" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true">
        <circle cx="100" cy="100" r="99" fill="#2a0f45" />
        {categories.map((c, i) => (
          <g key={c}>
            <path d={arc(i)} fill={WEDGE[i % WEDGE.length]} stroke="#1a0a2e" strokeWidth="2" />
            <text x="100" y="34" transform={`rotate(${(i + 0.5) * seg} 100 100)`} textAnchor="middle"
              className="ftr-wheel-label">{wedgeLabel(c)}</text>
          </g>
        ))}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * 15 - 90) * Math.PI / 180;
          return <circle key={i} cx={100 + 97 * Math.cos(a)} cy={100 + 97 * Math.sin(a)} r="2.2" className="ftr-wheel-bulb" style={{ '--i': i }} />;
        })}
        <circle cx="100" cy="100" r="18" fill="#1a0a2e" stroke="#fde68a" strokeWidth="3" />
        <text x="100" y="105" textAnchor="middle" className="ftr-wheel-hub">FA</text>
      </svg>
      <p className="ftr-wheel-caption">Spinning for a category…</p>
    </div>
  );
}

/** The clock: fifteen bulbs in a ring that go dark one per second. */
function BulbClock({ msLeft, frozen }) {
  const lit = Math.ceil(msLeft / 1000);
  return (
    <div className={`ftr-clock${frozen ? ' is-frozen' : ''}${lit <= 5 && !frozen ? ' is-low' : ''}`}
      role="timer" aria-label={frozen ? 'Clock frozen' : `${lit} seconds left`}>
      {Array.from({ length: SECONDS }, (_, i) => {
        const a = (i / SECONDS) * 2 * Math.PI - Math.PI / 2;
        return <i key={i} className={i < lit ? 'on' : ''} style={{ left: `${50 + 42 * Math.cos(a)}%`, top: `${50 + 42 * Math.sin(a)}%` }} />;
      })}
      <b>{frozen ? '❄' : lit}</b>
    </div>
  );
}

function Lobby({ catalog, error, notice, chapter, setChapter, cats, setCats, rounds, setRounds, skipSeen, setSkipSeen, onStart, onExit }) {
  const chapters = catalog?.chapters || [];
  const picked = chapters.find(c => c.id === chapter);
  const pool = picked ? (cats.length ? picked.categories.filter(c => cats.includes(c.id)).reduce((n, c) => n + c.count, 0) : picked.count) : 0;
  const best = picked ? readBest(chapter, rounds) : 0;
  const seenToday = picked ? readSeen(chapter).length : 0;
  const toggle = (id) => { triviaSfx.press(); setCats(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])); };
  return (
    <div className="ftr-lobby">
      <button type="button" className="ftr-back" onClick={onExit}>← First Aid Journey</button>
      <div className="ftr-sign">
        <span className="ftr-sign-bulbs" aria-hidden="true" />
        <p className="ftr-sign-kicker">LIVE FROM THE WARDS</p>
        <h1 className="ftr-sign-title">FA <span>TRIVIA</span></h1>
        <p className="ftr-sign-sub">The First Aid game show</p>
      </div>

      <div className="ftr-panel">
        <div className="ftr-row">
          <span className="ftr-label">TONIGHT'S CHAPTER</span>
          <div className="ftr-chips">
            {chapters.map(c => (
              <button key={c.id} type="button" className={`ftr-chip${chapter === c.id ? ' is-on' : ''}`}
                onClick={() => { triviaSfx.press(); setChapter(c.id); setCats([]); }}>
                <span aria-hidden="true">{c.icon}</span> {c.name} <small>{c.count}</small>
              </button>
            ))}
            {!chapters.length && <span className="ftr-muted">{error ? '' : 'Setting up the stage…'}</span>}
          </div>
          <p className="ftr-muted ftr-soon">More chapters coming soon.</p>
        </div>

        {picked && (
          <div className="ftr-row">
            <span className="ftr-label">CATEGORIES <small>(none picked = all of them)</small></span>
            <div className="ftr-chips">
              {picked.categories.map((c, i) => (
                <button key={c.id} type="button" className={`ftr-chip ftr-chip--cat${cats.includes(c.id) ? ' is-on' : ''}`}
                  style={{ '--cat': WEDGE[i % WEDGE.length] }} aria-pressed={cats.includes(c.id)} onClick={() => toggle(c.id)}>
                  {c.id} <small>{c.count}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ftr-row">
          <span className="ftr-label">SHOW LENGTH</span>
          <div className="ftr-chips">
            {(catalog?.rounds || [10, 20, 30]).map(n => (
              <button key={n} type="button" className={`ftr-chip${rounds === n ? ' is-on' : ''}`} aria-pressed={rounds === n}
                onClick={() => { triviaSfx.press(); setRounds(n); }}>
                {ROUND_LABEL[n] || n} <small>{n} Qs</small>
              </button>
            ))}
          </div>
        </div>

        <div className="ftr-row">
          <span className="ftr-label">REPEATS</span>
          <div className="ftr-chips">
            <button type="button" className={`ftr-chip${skipSeen ? ' is-on' : ''}`} aria-pressed={skipSeen}
              onClick={() => { triviaSfx.press(); setSkipSeen(!skipSeen); }}>
              {skipSeen ? '✓ ' : ''}Skip questions seen today <small>{seenToday} seen</small>
            </button>
          </div>
        </div>

        <ul className="ftr-rules">
          <li><b>15 s</b> a question — faster answers score more</li>
          <li><b>🔥 Streaks</b> — 3 in a row doubles points, 5 triples them</li>
          <li><b>Lifelines</b> — 50:50, ❄ Freeze, 🎯 Double Dip — once each per show</li>
        </ul>

        {error && <p className="ftr-error">{error}</p>}
        {notice && !error && <p className="ftr-muted">{notice}</p>}
        <button type="button" className="ftr-go" disabled={!pool} onClick={onStart}>
          {pool ? `Start the show — ${Math.min(rounds, pool)} questions` : !catalog ? 'Loading…' : 'No questions here yet'}
        </button>
        <div className="ftr-lobby-foot">
          {best > 0 && <span className="ftr-best">🏅 Your best ({rounds} Qs): <b>{best.toLocaleString()}</b></span>}
          <SfxToggle className="ftr-sfx" />
        </div>
      </div>
    </div>
  );
}

function Final({ results, score, bestStreak, best, isRecord, onAgain, onExit }) {
  const right = results.filter(r => r.right).length;
  const pct = results.length ? Math.round((right / results.length) * 100) : 0;
  const [, title, icon] = rankFor(pct);
  const missed = results.filter(r => !r.right);
  return (
    <div className="ftr-final">
      {pct >= 50 && <Confetti seed="final" />}
      <div className="ftr-podium">
        <span className="ftr-rank-icon" aria-hidden="true">{icon}</span>
        <p className="ftr-sign-kicker">TONIGHT'S TITLE</p>
        <h2 className="ftr-rank">{title}</h2>
        <div className="ftr-final-score">{score.toLocaleString()}<small>points</small></div>
        {isRecord && <p className="ftr-record">★ New personal best! ★</p>}
        <div className="ftr-final-stats">
          <span><b>{right}/{results.length}</b><i>correct</i></span>
          <span><b>{pct}%</b><i>accuracy</i></span>
          <span><b>🔥 {bestStreak}</b><i>best streak</i></span>
          <span><b>{best.toLocaleString()}</b><i>your best</i></span>
        </div>
        <div className="ftr-final-actions">
          <button type="button" className="ftr-go" onClick={onAgain}>Play again</button>
          <button type="button" className="ftr-back" onClick={onExit}>← First Aid Journey</button>
        </div>
      </div>
      {missed.length > 0 && (
        <div className="ftr-missed">
          <p className="ftr-label">BRUSH UP ON THESE</p>
          {missed.map(r => (
            <div key={r.q.id} className="ftr-missed-row">
              <span className="ftr-missed-page">p. {r.q.page}</span>
              <span><b>{r.q.options[r.q.correct]}</b><small>{r.q.question}</small></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FATrivia({ onExit }) {
  const exit = onExit || (() => { window.location.href = '/?story=fa'; });
  const [step] = useState(readStep);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState(STEP_DEFAULT_CHAPTER[step]);
  const [cats, setCats] = useState([]);
  const [rounds, setRounds] = useState(10);
  const [skipSeen, setSkipSeenState] = useState(readSkip);
  const setSkipSeen = (v) => { setSkipSeenState(v); writeSkip(v); };
  const [notice, setNotice] = useState('');
  // lobby → spin → ask → (locked → reveal) → … → final
  const [phase, setPhase] = useState('lobby');
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);       // final pick (-1 = time out)
  const [locked, setLocked] = useState(null);       // pick waiting on the drumroll
  const [msLeft, setMsLeft] = useState(SECONDS * 1000);
  const [frozen, setFrozen] = useState(false);
  const [hidden, setHidden] = useState([]);         // options removed by 50:50
  const [struck, setStruck] = useState([]);         // first miss under Double Dip
  const [dipArmed, setDipArmed] = useState(false);
  const [lifelines, setLifelines] = useState({ fifty: true, freeze: true, dip: true });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gain, setGain] = useState(null);           // points flying up after a hit
  const [results, setResults] = useState([]);
  const [record, setRecord] = useState({ best: 0, isRecord: false });

  const inShow = phase === 'spin' || phase === 'ask' || phase === 'reveal';
  const study = useStudySession({ mode: 'fa_trivia', active: inShow, subject: chapter });
  useStudyActivity(inShow ? 'FA Trivia' : null, null, 'fa_trivia');

  useEffect(() => {
    fetch(`${SERVER_URL}/api/fa-trivia/catalog`)
      .then(r => r.json())
      .then(d => setCatalog({ ...d, chapters: (d.chapters || []).filter(c => (c.step || 1) === step) }))
      .catch(() => setError('The stage lights would not come on — check your connection and try again.'));
  }, []);

  const q = qs[idx];
  const categories = useMemo(() => (catalog?.chapters || []).find(c => c.id === chapter)?.categories.map(c => c.id) || [], [catalog, chapter]);

  async function start() {
    setError(''); setNotice('');
    try {
      const params = new URLSearchParams({ chapter, count: String(rounds) });
      if (cats.length) params.set('categories', cats.join(','));
      const seen = skipSeen ? readSeen(chapter) : [];
      if (seen.length) params.set('exclude', seen.join(','));
      const r = await fetch(`${SERVER_URL}/api/fa-trivia/run?${params}`);
      const d = await r.json();
      if (!d.questions?.length) {
        throw new Error(seen.length
          ? 'You have already seen every question here today. Pick other categories or turn off "Skip questions seen today".'
          : 'No questions came back.');
      }
      if (seen.length && d.questions.length < rounds) setNotice(`Only ${d.questions.length} unseen question${d.questions.length === 1 ? '' : 's'} left here today, so this show is shorter.`);
      study.flush(); study.touch();
      setQs(d.questions); setIdx(0); setResults([]); setScore(0); setStreak(0); setBestStreak(0);
      setLifelines({ fifty: true, freeze: true, dip: true });
      resetQuestion();
      triviaSfx.intro();
      setPhase('spin');
      window.scrollTo(0, 0);
    } catch (err) { setError(err.message); }
  }

  function resetQuestion() {
    setPicked(null); setLocked(null); setMsLeft(SECONDS * 1000); setFrozen(false);
    setHidden([]); setStruck([]); setDipArmed(false); setGain(null);
  }

  // The clock. Runs only while asking, not frozen, and nothing locked in.
  const answerRef = useRef(null);
  useEffect(() => {
    if (phase !== 'ask' || frozen || locked !== null) return undefined;
    const from = performance.now() - (SECONDS * 1000 - msLeft);
    let lastSec = Math.ceil(msLeft / 1000);
    const t = setInterval(() => {
      const left = Math.max(0, SECONDS * 1000 - (performance.now() - from));
      setMsLeft(left);
      const sec = Math.ceil(left / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        if (sec <= 5 && sec > 0) triviaSfx.tick(sec % 2 === 0);
      }
      if (left <= 0) { clearInterval(t); answerRef.current?.(-1); }
    }, 100);
    return () => clearInterval(t);
  }, [phase, frozen, locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const reveal = useCallback((i, left) => {
    const right = i === q.correct;
    setPicked(i);
    setPhase('reveal');
    study.count(right);
    addSeen(chapter, q.id);
    if (right) {
      const speed = Math.round(100 * (left / (SECONDS * 1000)));
      const nextStreak = streak + 1;
      const mult = multiplierFor(nextStreak);
      const pts = Math.round((100 + speed) * mult * (struck.length ? 0.5 : 1));
      setScore(s => s + pts);
      setStreak(nextStreak);
      setBestStreak(b => Math.max(b, nextStreak));
      setGain({ pts, mult });
      triviaSfx.correct();
      setTimeout(() => triviaSfx.kaching(), 380);
      if (nextStreak === 3 || nextStreak === 5 || (nextStreak > 5 && nextStreak % 5 === 0)) setTimeout(() => triviaSfx.airhorn(), 900);
    } else {
      setStreak(0);
      if (i === -1) triviaSfx.buzzer(); else triviaSfx.wrong();
    }
    setResults(rs => [...rs, { q, right }]);
  }, [q, streak, struck, study, chapter]);

  const answer = useCallback((i) => {
    if (phase !== 'ask' || locked !== null || !q) return;
    if (i === -1) { reveal(-1, 0); return; }
    if (hidden.includes(i) || struck.includes(i)) return;
    study.touch();
    // Double Dip: a first wrong pick is struck out and the clock keeps going.
    if (dipArmed && !struck.length && i !== q.correct) {
      triviaSfx.press();
      setStruck([i]);
      setDipArmed(false);
      return;
    }
    const left = msLeft;
    setLocked(i);
    triviaSfx.drumroll(0.6);
    setTimeout(() => reveal(i, left), 700);
  }, [phase, locked, q, hidden, struck, dipArmed, msLeft, reveal, study]);
  answerRef.current = answer;

  function takeFifty() {
    if (!lifelines.fifty || phase !== 'ask' || locked !== null) return;
    const wrong = [0, 1, 2, 3].filter(i => i !== q.correct && !struck.includes(i));
    const drop = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setHidden(drop);
    setLifelines(l => ({ ...l, fifty: false }));
    triviaSfx.fifty();
  }
  function takeFreeze() {
    if (!lifelines.freeze || phase !== 'ask' || locked !== null) return;
    setFrozen(true);
    setLifelines(l => ({ ...l, freeze: false }));
    triviaSfx.freeze();
  }
  function takeDip() {
    if (!lifelines.dip || phase !== 'ask' || locked !== null) return;
    setDipArmed(true);
    setLifelines(l => ({ ...l, dip: false }));
    triviaSfx.press();
  }

  function next() {
    study.touch();
    if (idx + 1 >= qs.length) {
      study.flush();
      const prev = readBest(chapter, rounds);
      const isRecord = score > prev;
      if (isRecord) writeBest(chapter, rounds, score);
      setRecord({ best: Math.max(prev, score), isRecord });
      const right = results.filter(r => r.right).length;
      triviaSfx.applause(right / Math.max(1, results.length) >= 0.5);
      setPhase('final');
      window.scrollTo(0, 0);
      return;
    }
    setIdx(i => i + 1);
    resetQuestion();
    setPhase('spin');
  }

  useEffect(() => {
    function key(e) {
      if (phase === 'ask' && /^[1-4]$/.test(e.key)) answer(Number(e.key) - 1);
      else if (phase === 'reveal' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }); // re-bound each render so it always sees the current question

  const mult = multiplierFor(streak);
  return (
    <div className="ftr">
      <div className="ftr-curtain ftr-curtain--l" aria-hidden="true" />
      <div className="ftr-curtain ftr-curtain--r" aria-hidden="true" />
      <div className="ftr-spot ftr-spot--l" aria-hidden="true" />
      <div className="ftr-spot ftr-spot--r" aria-hidden="true" />

      {phase === 'lobby' && (
        <Lobby catalog={catalog} error={error} chapter={chapter} setChapter={setChapter}
          cats={cats} setCats={setCats} rounds={rounds} setRounds={setRounds}
          skipSeen={skipSeen} setSkipSeen={setSkipSeen} notice={notice} onStart={start} onExit={exit} />
      )}

      {inShow && q && (
        <div className="ftr-show">
          <header className="ftr-hud">
            <button type="button" className="ftr-quit" onClick={() => { study.flush(); setPhase('lobby'); }}>✕ Leave</button>
            <span className="ftr-hud-q">Q <b>{idx + 1}</b>/{qs.length}</span>
            <span className={`ftr-hud-streak${streak >= 3 ? ' is-hot' : ''}`}>🔥 {streak}{mult > 1 && <em>×{mult}</em>}</span>
            <span className="ftr-hud-score">{score.toLocaleString()}<small>pts</small></span>
          </header>

          {phase === 'spin' && (
            <Wheel key={idx} categories={categories.length ? categories : [q.category]} target={q.category}
              onLanded={() => setPhase('ask')} />
          )}

          {(phase === 'ask' || phase === 'reveal') && (
            <div className="ftr-stage">
              <div className="ftr-marquee">
                <span className="ftr-marquee-bulbs" aria-hidden="true" />
                <div className="ftr-card-top">
                  <span className="ftr-cat" style={{ '--cat': WEDGE[Math.max(0, categories.indexOf(q.category)) % WEDGE.length] }}>{q.category}</span>
                  <BulbClock msLeft={msLeft} frozen={frozen} />
                </div>
                <h2 className="ftr-question">{q.question}</h2>
                {dipArmed && <p className="ftr-dip-note">🎯 Double Dip is on — a wrong first guess gets a second chance (half points).</p>}
              </div>

              <div className="ftr-tiles" role="group" aria-label="Answers">
                {q.options.map((o, i) => {
                  const gone = hidden.includes(i);
                  let cls = '';
                  if (gone) cls = '';
                  else if (phase === 'reveal') cls = i === q.correct ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
                  else if (locked === i) cls = ' is-locked';
                  if (struck.includes(i)) cls += ' is-struck';
                  return (
                    <button key={o} type="button" className={`ftr-tile ftr-tile--${TILE[i]}${cls}${gone ? ' is-gone' : ''}`}
                      style={{ '--i': i }} disabled={phase !== 'ask' || locked !== null || gone || struck.includes(i)}
                      onClick={() => answer(i)}>
                      <span className="ftr-tile-key">{LETTERS[i]}</span>
                      <span className="ftr-tile-text">{o}</span>
                    </button>
                  );
                })}
              </div>

              {phase === 'ask' && (
                <div className="ftr-lifelines" role="group" aria-label="Lifelines">
                  <button type="button" className="ftr-life" disabled={!lifelines.fifty || locked !== null} onClick={takeFifty}>
                    <b>50:50</b><small>drop two</small>
                  </button>
                  <button type="button" className="ftr-life ftr-life--ice" disabled={!lifelines.freeze || frozen || locked !== null} onClick={takeFreeze}>
                    <b>❄</b><small>freeze clock</small>
                  </button>
                  <button type="button" className="ftr-life ftr-life--dip" disabled={!lifelines.dip || locked !== null} onClick={takeDip}>
                    <b>🎯</b><small>double dip</small>
                  </button>
                </div>
              )}

              {phase === 'reveal' && (
                <div className={`ftr-result${picked === q.correct ? ' is-right' : ' is-wrong'}`}>
                  {picked === q.correct && <Confetti seed={q.id} />}
                  {gain && <span className="ftr-gain" aria-hidden="true">+{gain.pts}{gain.mult > 1 ? ` ×${gain.mult}` : ''}</span>}
                  <p className="ftr-result-head">
                    {picked === q.correct ? ['Nailed it!', 'Ding ding ding!', 'Correct!', 'Brilliant!'][idx % 4]
                      : picked === -1 ? "Time's up!" : 'Oh no!'}
                    {picked !== q.correct && <span> The answer was <b>{q.options[q.correct]}</b>.</span>}
                  </p>
                  <div className="ftr-fact">
                    <span className="ftr-fact-tag">💡 FUN FACT</span>
                    <Fact text={q.fact} />
                    <span className="ftr-fact-src">First Aid p. {q.page} · {q.topic}</span>
                  </div>
                  <button type="button" className="ftr-go ftr-next" onClick={next} autoFocus>
                    {idx + 1 >= qs.length ? 'Final scores' : 'Next question'} ▸
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'final' && (
        <Final results={results} score={score} bestStreak={bestStreak} best={record.best} isRecord={record.isRecord}
          onAgain={() => setPhase('lobby')} onExit={exit} />
      )}
    </div>
  );
}
