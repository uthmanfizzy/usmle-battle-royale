import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CASES, CASES_BY_DOCKET, DOCKETS, docketOf } from '../kaplanEthics/kaplanEthicsData';
import { sfx } from '../minigameSfx';
import { useStudySession } from '../studySession';
import { useStudyActivity } from '../studyPresence';
import SfxToggle from './SfxToggle';
import './KaplanEthics.css';

/**
 * Kaplan → 100 HY Ethics: "The Ethics Tribunal".
 *
 *   CASE DOCKET    twelve dockets (topics). Each case is a file you rule on:
 *                  pick a motion, then STAKE how sure you are (Certain /
 *                  Likely / Unsure). Certainty pays more when right and costs
 *                  when wrong, so the score rewards knowing what you know.
 *                  The verdict shows the precedent and why each motion fails.
 *                  Dockets earn bronze / silver / gold seals.
 *   RAPID RULINGS  75 seconds: a situation and a response — ethical or not?
 *   RETRIAL        only the cases you have lost, until you win them.
 *   PRECEDENTS     every rule, searchable, with the ones you've won ticked.
 *
 * Cases are original (kaplanEthics/). Progress is saved per device.
 */

const PROG_KEY = 'mv_kaplan_ethics_v1';
const LETTERS = 'ABCD';
const RAPID_TIME = 75;
const STAKES = [
  { id: 'certain', label: 'Certain', hint: '+3 / −2', win: 3, lose: -2 },
  { id: 'likely', label: 'Likely', hint: '+2 / 0', win: 2, lose: 0 },
  { id: 'unsure', label: 'Unsure', hint: '+1 / 0', win: 1, lose: 0 },
];

const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const loadProg = () => {
  try { const p = JSON.parse(localStorage.getItem(PROG_KEY)); return { seals: {}, won: {}, lost: {}, ...(p || {}) }; }
  catch { return { seals: {}, won: {}, lost: {} }; }
};
const saveProg = (p) => { try { localStorage.setItem(PROG_KEY, JSON.stringify(p)); } catch { /* per device only */ } };
const sealFor = (acc) => (acc >= 0.9 ? 'gold' : acc >= 0.7 ? 'silver' : acc >= 0.5 ? 'bronze' : null);
const SEAL_LABEL = { gold: 'Gold seal', silver: 'Silver seal', bronze: 'Bronze seal' };
const caseNo = (c) => String(CASES.indexOf(c) + 1).padStart(3, '0');

function Seal({ tier, size = 'md' }) {
  return (
    <span className={`ke-seal ke-seal--${tier || 'none'} ke-seal--${size}`} aria-label={tier ? SEAL_LABEL[tier] : 'No seal yet'}>
      <span className="ke-seal-ring" />
      <span className="ke-seal-core">{tier ? '⚖' : '·'}</span>
    </span>
  );
}

// ── Hub ─────────────────────────────────────────────────────────────────────
function Hub({ prog, onMode }) {
  const won = Object.keys(prog.won).length;
  const lost = Object.keys(prog.lost).length;
  const sealed = DOCKETS.filter(d => prog.seals[d.id]).length;
  const golds = DOCKETS.filter(d => prog.seals[d.id] === 'gold').length;
  const pct = Math.round((won / CASES.length) * 100);
  return (
    <div className="ke-hub">
      <section className="ke-hero">
        <div className="ke-gavel" aria-hidden="true">
          <span className="ke-gavel-head" /><span className="ke-gavel-handle" /><span className="ke-gavel-block" />
        </div>
        <div className="ke-hero-text">
          <p className="ke-kicker">Kaplan · 100 HY Ethics</p>
          <h1 className="ke-title">The Ethics Tribunal</h1>
          <p className="ke-sub">
            {CASES.length} case files, twelve dockets. Read each file, choose your motion, then say how sure you are.
            The verdict gives you the rule and explains why every other motion fails.
          </p>
          <div className="ke-progress" aria-label={`${won} of ${CASES.length} cases won`}>
            <div className="ke-progress-bar"><span style={{ width: `${pct}%` }} /></div>
            <span>{won}/{CASES.length} cases won</span>
          </div>
          <div className="ke-hero-stats">
            <span><b>{sealed}</b>/{DOCKETS.length} dockets sealed</span>
            <span><b>{golds}</b> gold</span>
            <span><b>{lost}</b> awaiting retrial</span>
          </div>
        </div>
      </section>

      <div className="ke-modes">
        <button type="button" className="ke-mode ke-mode--main" onClick={() => onMode('docket')}>
          <span className="ke-mode-icon" aria-hidden="true">📂</span>
          <span className="ke-mode-name">Case Docket</span>
          <span className="ke-mode-sub">Twelve dockets. Rule on every case and earn a seal for each docket.</span>
        </button>
        <button type="button" className="ke-mode" onClick={() => onMode('rapid')}>
          <span className="ke-mode-icon" aria-hidden="true">⏱️</span>
          <span className="ke-mode-name">Rapid Rulings</span>
          <span className="ke-mode-sub">{RAPID_TIME} seconds. Ethical or not? Build a streak.</span>
        </button>
        <button type="button" className="ke-mode" onClick={() => onMode('retrial')} disabled={lost === 0}>
          <span className="ke-mode-icon" aria-hidden="true">🔁</span>
          <span className="ke-mode-name">Retrial</span>
          <span className="ke-mode-sub">{lost ? `${lost} lost case${lost === 1 ? '' : 's'} — win them back.` : 'No lost cases. Lose one and it waits here.'}</span>
        </button>
        <button type="button" className="ke-mode" onClick={() => onMode('book')}>
          <span className="ke-mode-icon" aria-hidden="true">📜</span>
          <span className="ke-mode-name">Precedents</span>
          <span className="ke-mode-sub">Every rule in one book, searchable.</span>
        </button>
      </div>
    </div>
  );
}

// ── Docket board ────────────────────────────────────────────────────────────
function DocketBoard({ prog, onOpen, onMixed }) {
  return (
    <div className="ke-board">
      <div className="ke-board-head">
        <h2>The Docket</h2>
        <button type="button" className="ke-chip-btn" onClick={onMixed}>🎲 Mixed session · 12 cases</button>
      </div>
      <div className="ke-dockets">
        {DOCKETS.map((d, i) => {
          const list = CASES_BY_DOCKET[d.id];
          const won = list.filter(c => prog.won[c.id]).length;
          return (
            <button key={d.id} type="button" className="ke-docket" style={{ '--dh': d.hue, '--i': i }} onClick={() => onOpen(d.id)}>
              <span className="ke-docket-tab">Docket {String(i + 1).padStart(2, '0')}</span>
              <span className="ke-docket-icon" aria-hidden="true">{d.icon}</span>
              <span className="ke-docket-name">{d.name}</span>
              <span className="ke-docket-blurb">{d.blurb}</span>
              <span className="ke-docket-foot">
                <span>{won}/{list.length} won</span>
                <Seal tier={prog.seals[d.id]} size="sm" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── A hearing: one case ─────────────────────────────────────────────────────
function Hearing({ c, idx, total, merit, streak, onDone }) {
  const d = docketOf(c);
  const motions = useMemo(() => shuffle(c.opts.map((o, i) => ({ ...o, ok: i === 0 }))), [c]);
  const [pick, setPick] = useState(null);
  const [stake, setStake] = useState(null);
  const [ruled, setRuled] = useState(false);
  const verdictRef = useRef(null);

  const rule = useCallback((stk) => {
    if (pick === null || ruled) return;
    const s = STAKES.find(x => x.id === stk) || STAKES[1];
    setStake(s.id);
    setRuled(true);
    if (motions[pick].ok) sfx.correct(); else sfx.wrong();
    setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
  }, [pick, ruled, motions]);

  const ok = ruled && motions[pick].ok;
  const s = STAKES.find(x => x.id === stake);
  const delta = ruled ? (ok ? s.win : s.lose) : 0;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if (!ruled) {
        const n = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
        if (n >= 0 && n < motions.length) { setPick(n); sfx.select(); }
      } else if (k === 'enter' || k === 'arrowright') {
        onDone({ c, ok, delta, stake });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ruled, pick, motions, rule, onDone, c, ok, delta, stake]);

  return (
    <div className="ke-hearing" style={{ '--dh': d.hue }}>
      <div className="ke-bench">
        <span className="ke-bench-docket">{d.icon} {d.name}</span>
        <span className="ke-bench-count">Case {idx + 1} of {total}</span>
        <span className="ke-bench-merit" title="Merit">⚖ {merit}</span>
        {streak >= 2 && <span className="ke-bench-streak">🔥 {streak}</span>}
      </div>
      <div className="ke-steps" aria-hidden="true"><span style={{ width: `${(idx / total) * 100}%` }} /></div>

      <article className="ke-file">
        <header className="ke-file-head">
          <span className="ke-file-no">Case № {caseNo(c)}</span>
          <span className="ke-file-ref" title="Matching question in your Kaplan book">Kaplan Q{c.ref}</span>
        </header>
        <h2 className="ke-file-title">{c.title}</h2>
        <p className="ke-file-text">{c.file}</p>
        <p className="ke-file-ask">{c.ask}</p>
      </article>

      <div className="ke-motions" role="radiogroup" aria-label="Motions">
        {motions.map((m, i) => {
          let cls = 'ke-motion';
          if (pick === i) cls += ' is-picked';
          if (ruled && m.ok) cls += ' is-right';
          if (ruled && pick === i && !m.ok) cls += ' is-wrong';
          if (ruled && pick !== i && !m.ok) cls += ' is-dim';
          return (
            <button
              key={m.t}
              type="button"
              role="radio"
              aria-checked={pick === i}
              className={cls}
              disabled={ruled}
              onClick={() => { setPick(i); sfx.select(); }}
            >
              <span className="ke-motion-letter">{LETTERS[i]}</span>
              <span className="ke-motion-text">{m.t}</span>
              {ruled && <span className="ke-motion-mark" aria-hidden="true">{m.ok ? '✔' : pick === i ? '✘' : ''}</span>}
            </button>
          );
        })}
      </div>

      {!ruled && (
        <div className={`ke-stake${pick === null ? ' is-waiting' : ''}`}>
          <p className="ke-stake-q">{pick === null ? 'Choose a motion, then rule with your confidence.' : 'How sure are you?'}</p>
          <div className="ke-stake-row">
            {STAKES.map(st => (
              <button key={st.id} type="button" className={`ke-stake-btn ke-stake-btn--${st.id}`} disabled={pick === null} onClick={() => rule(st.id)}>
                <b>{st.label}</b><small>{st.hint}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {ruled && (
        <section ref={verdictRef} className={`ke-verdict ${ok ? 'is-upheld' : 'is-overruled'}`}>
          <div className="ke-verdict-top">
            <span className="ke-stamp">{ok ? 'Sustained' : 'Overruled'}</span>
            <span className={`ke-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>
              {delta > 0 ? `+${delta}` : delta} merit · staked {s.label.toLowerCase()}
            </span>
          </div>
          <div className="ke-precedent">
            <span className="ke-precedent-label">Precedent</span>
            <p>{c.rule}</p>
          </div>
          <p className="ke-pearl"><b>Pearl ·</b> {c.pearl}</p>
          <ul className="ke-whys">
            {motions.filter(m => !m.ok).map(m => (
              <li key={m.t}><b>{m.t}</b> {m.why}</li>
            ))}
          </ul>
          <button type="button" className="ke-next" onClick={() => onDone({ c, ok, delta, stake })}>
            {idx + 1 >= total ? 'Close the session' : 'Next case'} →
          </button>
        </section>
      )}
    </div>
  );
}

// ── Session summary ─────────────────────────────────────────────────────────
function Adjourned({ session, results, seal, onAgain, onBack }) {
  const right = results.filter(r => r.ok).length;
  const merit = results.reduce((n, r) => n + r.delta, 0);
  const certain = results.filter(r => r.stake === 'certain');
  const certainRight = certain.filter(r => r.ok).length;
  const acc = results.length ? right / results.length : 0;
  let calib = null;
  if (certain.length >= 2) {
    const ca = certainRight / certain.length;
    calib = ca >= 0.85 ? 'Well calibrated: when you were certain, you were nearly always right.'
      : ca >= 0.6 ? 'When you said "certain", you were right only some of the time. Save it for rules you really know.'
        : 'Overconfident: most of your "certain" rulings were overturned. Review the precedents below.';
  }
  return (
    <div className="ke-adjourned">
      <p className="ke-kicker">Court adjourned</p>
      <h2>{session.title}</h2>
      <Seal tier={seal} size="lg" />
      <p className="ke-adj-seal">{seal ? `${SEAL_LABEL[seal]} earned` : session.docket ? 'No seal this time — win 50% for bronze.' : 'Mixed session'}</p>
      <div className="ke-adj-stats">
        <span><b>{right}/{results.length}</b> won</span>
        <span><b>{Math.round(acc * 100)}%</b> accuracy</span>
        <span><b>{merit}</b> merit</span>
        {certain.length > 0 && <span><b>{certainRight}/{certain.length}</b> certain rulings upheld</span>}
      </div>
      {calib && <p className="ke-calib">{calib}</p>}
      <ol className="ke-adj-list">
        {results.map(r => (
          <li key={r.c.id} className={r.ok ? 'ok' : 'no'}>
            <span className="ke-adj-mark">{r.ok ? '✔' : '✘'}</span>
            <span><b>{r.c.title}</b><small>{r.c.rule}</small></span>
          </li>
        ))}
      </ol>
      <div className="ke-adj-actions">
        <button type="button" className="ke-next" onClick={onAgain}>Rehear this session</button>
        <button type="button" className="ke-ghost" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

// ── Rapid Rulings ───────────────────────────────────────────────────────────
function buildRapid() {
  // One prompt per case: the right motion or one wrong motion, at random.
  return shuffle(CASES).map(c => {
    const right = Math.random() < 0.5;
    const o = right ? c.opts[0] : c.opts[1 + Math.floor(Math.random() * 3)];
    const lead = c.file.split(/(?<=[.!?])\s+/)[0];
    return { c, lead, t: o.t, ethical: right, why: right ? c.rule : o.why };
  });
}

function Rapid({ onExit, onAnswer }) {
  const [deck, setDeck] = useState(buildRapid);
  const [i, setI] = useState(0);
  const [time, setTime] = useState(RAPID_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState(null); // { ok, why }
  const [log, setLog] = useState([]);
  const over = time <= 0;

  useEffect(() => {
    if (over) { sfx.complete(); return undefined; }
    const id = setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [over]);

  const answer = useCallback((saysEthical) => {
    if (over || flash) return;
    const card = deck[i % deck.length];
    const ok = card.ethical === saysEthical;
    const nextStreak = ok ? streak + 1 : 0;
    setStreak(nextStreak);
    setBest(b => Math.max(b, nextStreak));
    setScore(s => s + (ok ? 10 * (1 + Math.floor(nextStreak / 3)) : 0));
    setLog(l => [...l, { card, ok }]);
    onAnswer(ok);
    if (ok) sfx.correct(); else sfx.wrong();
    setFlash({ ok, why: card.why });
    setTimeout(() => { setFlash(null); setI(n => n + 1); }, ok ? 650 : 1700);
  }, [over, flash, deck, i, streak, onAnswer]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') answer(false);
      if (e.key === 'ArrowRight') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer]);

  if (over) {
    const right = log.filter(x => x.ok).length;
    return (
      <div className="ke-adjourned">
        <p className="ke-kicker">Time</p>
        <h2>Rapid Rulings</h2>
        <div className="ke-adj-stats">
          <span><b>{score}</b> points</span>
          <span><b>{right}/{log.length}</b> correct</span>
          <span><b>{best}</b> best streak</span>
        </div>
        <ol className="ke-adj-list">
          {log.filter(x => !x.ok).slice(0, 12).map((x, n) => (
            <li key={n} className="no">
              <span className="ke-adj-mark">✘</span>
              <span><b>{x.card.t}</b><small>{x.card.ethical ? 'This was the ethical move.' : 'Not ethical:'} {x.card.why}</small></span>
            </li>
          ))}
        </ol>
        <div className="ke-adj-actions">
          <button type="button" className="ke-next" onClick={() => { setDeck(buildRapid()); setI(0); setTime(RAPID_TIME); setScore(0); setStreak(0); setBest(0); setLog([]); }}>Again</button>
          <button type="button" className="ke-ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const card = deck[i % deck.length];
  return (
    <div className="ke-rapid">
      <div className="ke-bench">
        <span className={`ke-clock${time <= 10 ? ' is-low' : ''}`}>⏱ {time}s</span>
        <span className="ke-bench-merit">★ {score}</span>
        {streak >= 2 && <span className="ke-bench-streak">🔥 {streak} · ×{1 + Math.floor(streak / 3)}</span>}
      </div>
      <div className="ke-timebar" aria-hidden="true"><span style={{ width: `${(time / RAPID_TIME) * 100}%` }} /></div>
      <article key={i} className={`ke-rapid-card${flash ? (flash.ok ? ' is-ok' : ' is-no') : ''}`}>
        <span className="ke-file-no">{docketOf(card.c).icon} {card.c.title}</span>
        <p className="ke-rapid-lead">{card.lead}</p>
        <p className="ke-rapid-move">“{card.t}”</p>
        {flash && !flash.ok && <p className="ke-rapid-why">{card.ethical ? 'It was ethical — ' : ''}{flash.why}</p>}
      </article>
      <div className="ke-rapid-btns">
        <button type="button" className="ke-rule-btn ke-rule-btn--no" onClick={() => answer(false)}>✘ Unethical <small>←</small></button>
        <button type="button" className="ke-rule-btn ke-rule-btn--yes" onClick={() => answer(true)}>✔ Ethical <small>→</small></button>
      </div>
    </div>
  );
}

// ── Precedents ──────────────────────────────────────────────────────────────
function Precedents({ prog }) {
  const [q, setQ] = useState('');
  const [dk, setDk] = useState('all');
  const needle = q.trim().toLowerCase();
  const list = CASES.filter(c => (dk === 'all' || c.docket === dk)
    && (!needle || `${c.title} ${c.rule} ${c.pearl}`.toLowerCase().includes(needle)));
  return (
    <div className="ke-book">
      <h2>Precedents</h2>
      <div className="ke-book-tools">
        <input type="search" placeholder="Search the precedents" value={q} onChange={e => setQ(e.target.value)} aria-label="Search the precedents" />
        <select value={dk} onChange={e => setDk(e.target.value)} aria-label="Filter by docket">
          <option value="all">All dockets</option>
          {DOCKETS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
        </select>
      </div>
      <p className="ke-book-count">{list.length} precedent{list.length === 1 ? '' : 's'}</p>
      <ol className="ke-book-list">
        {list.map(c => {
          const d = docketOf(c);
          return (
            <li key={c.id} style={{ '--dh': d.hue }} className={prog.won[c.id] ? 'is-won' : ''}>
              <span className="ke-book-no">№ {caseNo(c)}</span>
              <div>
                <span className="ke-book-meta">{d.icon} {d.name} · {c.title}{prog.won[c.id] ? ' · ✔ won' : ''}</span>
                <p className="ke-book-rule">{c.rule}</p>
                <p className="ke-book-pearl">{c.pearl}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function KaplanEthics() {
  const [view, setView] = useState('hub'); // hub | docket | hearing | adjourned | rapid | book
  const [prog, setProg] = useState(loadProg);
  const [session, setSession] = useState(null); // { title, docket, list }
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [seal, setSeal] = useState(null);
  const playing = view === 'hearing' || view === 'rapid';
  const study = useStudySession({ mode: 'kaplan_hy_ethics', active: playing, subject: 'ethics' });
  useStudyActivity(playing ? 'Kaplan HY Ethics' : null, null, 'kaplan_hy_ethics');

  const start = (s) => {
    setSession(s); setIdx(0); setResults([]); setSeal(null); setView('hearing');
    sfx.select(); study.touch(); window.scrollTo(0, 0);
  };
  const openDocket = (id) => {
    const d = DOCKETS.find(x => x.id === id);
    start({ title: d.name, docket: id, list: shuffle(CASES_BY_DOCKET[id]) });
  };
  const openMixed = () => start({ title: 'Mixed session', docket: null, list: shuffle(CASES).slice(0, 12) });
  const openRetrial = () => {
    const lost = CASES.filter(c => prog.lost[c.id]);
    if (lost.length) start({ title: 'Retrial', docket: null, list: shuffle(lost) });
    else setView('hub'); // every lost case has been won back
  };

  const done = useCallback((r) => {
    study.count(r.ok); study.touch();
    setProg(p => {
      const won = { ...p.won }; const lost = { ...p.lost };
      if (r.ok) { won[r.c.id] = true; delete lost[r.c.id]; } else lost[r.c.id] = true;
      const np = { ...p, won, lost }; saveProg(np); return np;
    });
    const next = [...results, r];
    setResults(next);
    if (idx + 1 >= session.list.length) {
      let tier = null;
      if (session.docket) {
        const acc = next.filter(x => x.ok).length / next.length;
        tier = sealFor(acc);
        const rank = { gold: 3, silver: 2, bronze: 1 };
        setProg(p => {
          const cur = p.seals[session.docket];
          if (!tier || (cur && rank[cur] >= rank[tier])) return p;
          const np = { ...p, seals: { ...p.seals, [session.docket]: tier } }; saveProg(np); return np;
        });
      }
      setSeal(tier);
      study.flush(); sfx.complete();
      setView('adjourned');
    } else {
      sfx.next();
      setIdx(i => i + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [results, idx, session, study]);

  const back = () => {
    if (view === 'rapid') study.flush();
    if (view === 'hearing' || view === 'adjourned') setView(session?.docket ? 'docket' : 'hub');
    else if (view === 'hub') window.location.href = '/kaplan';
    else setView('hub');
  };

  const merit = results.reduce((n, r) => n + r.delta, 0);
  let streak = 0;
  for (let k = results.length - 1; k >= 0 && results[k].ok; k--) streak++;

  return (
    <div className="ke">
      <div className="ke-bg" aria-hidden="true">
        <span className="ke-column ke-column--l" /><span className="ke-column ke-column--r" />
        <span className="ke-glow" />
      </div>
      <header className="ke-top">
        <button type="button" className="ke-back" onClick={back}>
          ← {view === 'hub' ? 'Kaplan' : view === 'hearing' || view === 'adjourned' ? (session?.docket ? 'Docket' : 'Tribunal') : 'Tribunal'}
        </button>
        <span className="ke-brand">⚖️ <b>100 HY Ethics</b></span>
        <SfxToggle />
      </header>
      <main className="ke-main" key={view + (session?.title || '')}>
        {view === 'hub' && <Hub prog={prog} onMode={(m) => {
          sfx.select();
          if (m === 'retrial') openRetrial(); else setView(m);
        }} />}
        {view === 'docket' && <DocketBoard prog={prog} onOpen={openDocket} onMixed={openMixed} />}
        {view === 'hearing' && session && (
          <Hearing key={session.list[idx].id + idx} c={session.list[idx]} idx={idx} total={session.list.length} merit={merit} streak={streak} onDone={done} />
        )}
        {view === 'adjourned' && session && (
          <Adjourned session={session} results={results} seal={seal}
            onAgain={() => (session.docket ? openDocket(session.docket) : session.title === 'Retrial' ? openRetrial() : openMixed())}
            onBack={() => setView(session.docket ? 'docket' : 'hub')} />
        )}
        {view === 'rapid' && <Rapid onExit={() => { study.flush(); setView('hub'); }} onAnswer={(ok) => { study.count(ok); study.touch(); }} />}
        {view === 'book' && <Precedents prog={prog} />}
      </main>
    </div>
  );
}
