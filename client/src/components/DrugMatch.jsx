import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SYSTEMS, DECKS, DRUGS } from '../pharm/drugData';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './DrugMatch.css';

/**
 * Drug Mechanism Match — pair each drug with its mechanism against the
 * clock, then say what it costs the patient.
 *
 * A board is up to six CLASSES from the chosen deck; each shows one of its
 * drugs (at random — lisinopril one time, ramipril the next) on the left
 * and its mechanism on the right. Because a board never holds two drugs of
 * one class, every pairing has exactly one right answer. Correct pairs are
 * joined by a line and lock; a wrong pairing says which drug that mechanism
 * really belongs to. Then a short follow-up: the key adverse effect or fact
 * for drugs from the board.
 *
 *   GUIDED    — each drug card shows its clinical uses as a hint.
 *   CHALLENGE — names only.
 *
 * A study view lists the whole deck: class, drugs, mechanism, uses,
 * adverse effects. Nothing is saved to the server.
 */

const BOARD = 6;
const BOARDS_PER_RUN = 3;
const SECS_PER_PAIR = 14;
const PAIR_POINTS = 10;
const FOLLOW_POINTS = 10;
const WRONG_PENALTY = 3;
const HUES = ['226, 76, 96', '64, 170, 220', '150, 190, 58', '236, 170, 60', '160, 110, 230', '46, 196, 160'];

const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function deckGroups(system, deck) {
  return DRUGS.filter(d => d.system === system && (deck === 'all' || d.deck === deck));
}

function makeBoard(groups) {
  const items = groups.map((g, i) => ({ g, drug: pick(g.drugs), hue: HUES[i % HUES.length] }));
  return { items, left: shuffle(items.map(x => x.g.id)), right: shuffle(items.map(x => x.g.id)) };
}

function makeFollowUps(board, system) {
  const pool = DRUGS.filter(d => d.system === system);
  return shuffle(board.items).slice(0, 3).map(({ g, drug }) => {
    const others = shuffle([
      ...board.items.filter(x => x.g.id !== g.id).map(x => x.g),
      ...shuffle(pool.filter(d => d.id !== g.id && !board.items.some(x => x.g.id === d.id))),
    ]).filter(d => d.fact !== g.fact).slice(0, 3);
    return { g, drug, options: shuffle([g.fact, ...others.map(o => o.fact)]) };
  });
}

export default function DrugMatch({ onExit }) {
  const [view, setView] = useState('home');      // home | study | play | follow | summary
  const [system, setSystem] = useState('cardio');
  const [deck, setDeck] = useState('all');
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mv_dm_mode') === 'challenge' ? 'challenge' : 'guided'; } catch { return 'guided'; }
  });
  const [boards, setBoards] = useState([]);
  const [bi, setBi] = useState(0);
  const [selL, setSelL] = useState(null);
  const [selR, setSelR] = useState(null);
  const [matched, setMatched] = useState([]);     // group ids, in order matched
  const [wrong, setWrong] = useState(null);       // { l, r, msg }
  const [timeLeft, setTimeLeft] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [pop, setPop] = useState(null);           // floating "+12" near the match
  const [follow, setFollow] = useState([]);
  const [fi, setFi] = useState(0);
  const [fPicked, setFPicked] = useState(null);
  const [mistakes, setMistakes] = useState({});   // group id → count
  const [stats, setStats] = useState({ pairs: 0, wrong: 0, follow: 0, followRight: 0 });
  const [search, setSearch] = useState('');

  const board = boards[bi] || null;
  const byId = useMemo(() => Object.fromEntries((board?.items || []).map(x => [x.g.id, x])), [board]);
  const boardDone = board && (matched.length === board.items.length || timedOut);

  const saveMode = (m) => { setMode(m); try { localStorage.setItem('mv_dm_mode', m); } catch { /* not remembered */ } };

  const start = () => {
    const groups = shuffle(deckGroups(system, deck));
    const nBoards = Math.max(1, Math.min(BOARDS_PER_RUN, Math.ceil(groups.length / BOARD)));
    const list = [];
    for (let i = 0; i < nBoards; i++) {
      let chunk = groups.slice(i * BOARD, i * BOARD + BOARD);
      if (chunk.length < 3) chunk = shuffle(groups).slice(0, Math.min(BOARD, groups.length));
      list.push(makeBoard(chunk));
    }
    sfx.select();
    setBoards(list); setBi(0);
    resetBoard(list[0]);
    setScore(0); setCombo(0); setMistakes({}); setStats({ pairs: 0, wrong: 0, follow: 0, followRight: 0 });
    setView('play');
  };

  const resetBoard = (b) => {
    setSelL(null); setSelR(null); setMatched([]); setWrong(null); setTimedOut(false); setPop(null);
    setTimeLeft(b.items.length * SECS_PER_PAIR);
  };

  // The clock.
  useEffect(() => {
    if (view !== 'play' || boardDone) return undefined;
    if (timeLeft <= 0) { setTimedOut(true); sfx.wrong(); return undefined; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [view, timeLeft, boardDone]);

  // Board cleared: time bonus.
  const bonusGiven = useRef(-1);
  useEffect(() => {
    if (view === 'play' && board && matched.length === board.items.length && bonusGiven.current !== bi) {
      bonusGiven.current = bi;
      setScore(s => s + timeLeft);
      sfx.fanfare();
    }
  }, [view, board, matched.length, bi, timeLeft]);

  const tryPair = useCallback((l, r) => {
    if (l === r) {
      const c = combo + 1;
      const pts = PAIR_POINTS + (c - 1) * 2;
      setMatched(m => [...m, l]);
      setCombo(c);
      setScore(s => s + pts);
      setPop({ id: l, text: `+${pts}${c > 1 ? ` · combo ×${c}` : ''}` });
      setStats(st => ({ ...st, pairs: st.pairs + 1 }));
      sfx.correct(); if (c > 2) setTimeout(() => sfx.sparkle(), 160);
    } else {
      setCombo(0);
      setScore(s => Math.max(0, s - WRONG_PENALTY));
      setMistakes(m => ({ ...m, [l]: (m[l] || 0) + 1 }));
      setStats(st => ({ ...st, wrong: st.wrong + 1 }));
      setWrong({ l, r, msg: `That mechanism belongs to ${byId[r].drug}. ${byId[l].drug} is ${byId[l].g.cls.replace(/^\w/, c => c.toLowerCase())}.` });
      sfx.wrong();
      setTimeout(() => setWrong(w => (w && w.l === l && w.r === r ? { ...w, fading: true } : w)), 1600);
    }
    setSelL(null); setSelR(null);
  }, [combo, byId]);

  const clickL = (id) => {
    if (boardDone || matched.includes(id)) return;
    sfx.select();
    if (selR) tryPair(id, selR); else setSelL(s => (s === id ? null : id));
  };
  const clickR = (id) => {
    if (boardDone || matched.includes(id)) return;
    sfx.select();
    if (selL) tryPair(selL, id); else setSelR(s => (s === id ? null : id));
  };

  const toFollow = () => {
    sfx.next();
    setFollow(makeFollowUps(board, system)); setFi(0); setFPicked(null);
    setView('follow');
  };
  const answerFollow = (opt) => {
    if (fPicked) return;
    const ok = opt === follow[fi].g.fact;
    setFPicked(opt);
    setStats(st => ({ ...st, follow: st.follow + 1, followRight: st.followRight + (ok ? 1 : 0) }));
    if (ok) { setScore(s => s + FOLLOW_POINTS); sfx.correct(); } else { sfx.wrong(); setMistakes(m => ({ ...m, [follow[fi].g.id]: (m[follow[fi].g.id] || 0) + 1 })); }
  };
  const nextFollow = () => {
    if (fi + 1 < follow.length) { sfx.next(); setFi(i => i + 1); setFPicked(null); return; }
    if (bi + 1 < boards.length) {
      sfx.next(); setBi(i => i + 1); resetBoard(boards[bi + 1]); bonusGiven.current = -1; setView('play');
    } else { sfx.complete(); setView('summary'); }
  };

  // ── Lines between matched pairs ─────────────────────────────────────────
  const boardRef = useRef(null);
  const leftRefs = useRef({});
  const rightRefs = useRef({});
  const [lines, setLines] = useState([]);
  const measure = useCallback(() => {
    const host = boardRef.current;
    if (!host || !board) { setLines([]); return; }
    const hb = host.getBoundingClientRect();
    const show = timedOut ? board.items.map(x => x.g.id) : matched;
    setLines(show.map(id => {
      const a = leftRefs.current[id]?.getBoundingClientRect();
      const b = rightRefs.current[id]?.getBoundingClientRect();
      if (!a || !b) return null;
      return { id, x1: a.right - hb.left, y1: a.top + a.height / 2 - hb.top, x2: b.left - hb.left, y2: b.top + b.height / 2 - hb.top, hue: byId[id].hue, missed: !matched.includes(id) };
    }).filter(Boolean));
  }, [board, matched, timedOut, byId]);
  useLayoutEffect(() => { measure(); }, [measure, view]);
  useEffect(() => {
    if (!boardRef.current) return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, [measure, view]);

  // ── Home ────────────────────────────────────────────────────────────────
  if (view === 'home') {
    const decks = DECKS[system] || {};
    return (
      <div className="dm dm--home" style={{ '--acc': SYSTEMS[system].accent }}>
        <Pills />
        <div className="dm-top">
          {onExit && <button type="button" className="dm-back" onClick={onExit}>← Minigames</button>}
          <SfxToggle />
        </div>
        <header className="dm-hero">
          <span className="dm-hero-icon" aria-hidden="true">💊</span>
          <p className="dm-kicker">Pharmacology · Minigame</p>
          <h1 className="dm-title">Drug Mechanism Match</h1>
          <p className="dm-lede">Drugs on the left, mechanisms on the right — pair them before the clock runs out, then say what each one costs the patient.</p>
        </header>

        <section className="dm-systems" aria-label="Systems">
          {Object.entries(SYSTEMS).map(([id, s]) => (
            <button
              key={id}
              type="button"
              className={`dm-system${system === id ? ' is-on' : ''}${s.ready ? '' : ' is-soon'}`}
              style={{ '--acc': s.accent }}
              disabled={!s.ready}
              onClick={() => { sfx.select(); setSystem(id); setDeck('all'); }}
            >
              <span className="dm-system-icon" aria-hidden="true">{s.icon}</span>
              <span className="dm-system-name">{s.name}</span>
              <span className="dm-system-n">{s.ready ? `${DRUGS.filter(d => d.system === id).length} classes` : 'Coming soon'}</span>
            </button>
          ))}
        </section>

        <section className="dm-panel">
          <div className="dm-row">
            <span className="dm-label">Deck</span>
            <div className="dm-chips">
              <button type="button" className={`dm-chip${deck === 'all' ? ' is-on' : ''}`} onClick={() => setDeck('all')}>All {SYSTEMS[system].name.toLowerCase()} <span>{deckGroups(system, 'all').length}</span></button>
              {Object.entries(decks).map(([id, name]) => (
                <button key={id} type="button" className={`dm-chip${deck === id ? ' is-on' : ''}`} onClick={() => setDeck(id)}>{name} <span>{deckGroups(system, id).length}</span></button>
              ))}
            </div>
          </div>
          <div className="dm-row">
            <span className="dm-label">Mode</span>
            <div className="dm-seg">
              <button type="button" className={mode === 'guided' ? 'is-on' : ''} onClick={() => saveMode('guided')}>Guided <small>uses shown</small></button>
              <button type="button" className={mode === 'challenge' ? 'is-on' : ''} onClick={() => saveMode('challenge')}>Challenge <small>names only</small></button>
            </div>
          </div>
          <div className="dm-actions">
            <button type="button" className="dm-start" onClick={start}>Start matching</button>
            <button type="button" className="dm-ghost" onClick={() => { sfx.select(); setView('study'); }}>📖 Study the deck</button>
          </div>
          <p className="dm-fine">Up to {BOARDS_PER_RUN} boards of {BOARD} · {SECS_PER_PAIR}s a pair · +{PAIR_POINTS} a pair with combo bonus, −{WRONG_PENALTY} for a wrong pairing · seconds left are points · +{FOLLOW_POINTS} per follow-up.</p>
        </section>
      </div>
    );
  }

  // ── Study ───────────────────────────────────────────────────────────────
  if (view === 'study') {
    const q = search.trim().toLowerCase();
    const list = deckGroups(system, deck).filter(g => !q || [g.cls, g.mech, g.uses, g.adverse, ...g.drugs].join(' ').toLowerCase().includes(q));
    const grouped = Object.entries(DECKS[system]).map(([id, name]) => [name, list.filter(g => g.deck === id)]).filter(([, l]) => l.length);
    return (
      <div className="dm dm--study" style={{ '--acc': SYSTEMS[system].accent }}>
        <div className="dm-top">
          <button type="button" className="dm-back" onClick={() => setView('home')}>← Back</button>
          <SfxToggle />
        </div>
        <div className="dm-study-head">
          <h1 className="dm-title">{SYSTEMS[system].icon} {SYSTEMS[system].name}</h1>
          <input className="dm-search" type="search" placeholder="Search a drug, mechanism or side effect…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {grouped.map(([name, l]) => (
          <section key={name} className="dm-study-deck">
            <h2>{name}</h2>
            <div className="dm-study-grid">
              {l.map((g, i) => (
                <article key={g.id} className="dm-study-card" style={{ '--d': `${0.03 * i}s` }}>
                  <p className="dm-study-cls">{g.cls}</p>
                  <p className="dm-study-drugs">{g.drugs.join(' · ')}</p>
                  <dl>
                    <dt>Mechanism</dt><dd>{g.mech}</dd>
                    <dt>Uses</dt><dd>{g.uses}</dd>
                    <dt>Adverse</dt><dd>{g.adverse}</dd>
                  </dl>
                  <p className="dm-study-fact">💡 {g.fact}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
        {!grouped.length && <p className="dm-fine">Nothing matches “{search}”.</p>}
      </div>
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (view === 'summary') {
    const worst = Object.entries(mistakes).sort((a, b) => b[1] - a[1]).map(([id]) => DRUGS.find(d => d.id === id)).filter(Boolean);
    const acc = stats.pairs + stats.wrong ? Math.round((stats.pairs / (stats.pairs + stats.wrong)) * 100) : 0;
    return (
      <div className="dm dm--summary" style={{ '--acc': SYSTEMS[system].accent }}>
        <Pills />
        <div className="dm-top">
          <button type="button" className="dm-back" onClick={() => setView('home')}>← Decks</button>
          <SfxToggle />
        </div>
        <div className="dm-summary">
          <p className="dm-kicker">{SYSTEMS[system].name} · {deck === 'all' ? 'all decks' : DECKS[system][deck]}</p>
          <h1 className="dm-title">{acc === 100 && stats.followRight === stats.follow ? 'Flawless pharmacology.' : acc >= 80 ? 'Sharp.' : 'Worth another round.'}</h1>
          <div className="dm-stats">
            <div><b>{score}</b><span>Points</span></div>
            <div><b>{acc}%</b><span>Pairing accuracy</span></div>
            <div><b>{stats.followRight}/{stats.follow}</b><span>Follow-ups</span></div>
          </div>
          {worst.length > 0 && (
            <div className="dm-card dm-review">
              <h2>Review these</h2>
              {worst.map(g => (
                <div key={g.id} className="dm-review-row">
                  <p><b>{g.drugs.join(', ')}</b> <span>— {g.cls}</span></p>
                  <p className="dm-review-mech">{g.mech}</p>
                  <p className="dm-review-fact">💡 {g.fact}</p>
                </div>
              ))}
            </div>
          )}
          <div className="dm-actions">
            <button type="button" className="dm-start" onClick={start}>Play again</button>
            <button type="button" className="dm-ghost" onClick={() => setView('study')}>📖 Study the deck</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Follow-up ───────────────────────────────────────────────────────────
  if (view === 'follow') {
    const f = follow[fi];
    return (
      <div className="dm dm--follow" style={{ '--acc': SYSTEMS[system].accent }}>
        <div className="dm-top">
          <button type="button" className="dm-back" onClick={() => setView('home')}>← Quit</button>
          <div className="dm-hud"><SfxToggle /><span>Score <b>{score}</b></span></div>
        </div>
        <div className="dm-follow" key={`${bi}-${fi}`}>
          <p className="dm-kicker">What it costs the patient · {fi + 1} of {follow.length}</p>
          <h2 className="dm-follow-q">Which goes with <b>{f.drug}</b>?</h2>
          <p className="dm-follow-cls">{f.g.cls}</p>
          <div className="dm-options">
            {f.options.map((o, i) => {
              const cls = !fPicked ? '' : o === f.g.fact ? ' is-right' : o === fPicked ? ' is-wrong' : ' is-dim';
              return (
                <button key={o} type="button" className={`dm-option${cls}`} disabled={!!fPicked} onClick={() => answerFollow(o)} style={{ '--d': `${0.05 * i}s` }}>
                  <span className="dm-option-key">{i + 1}</span>{o}
                </button>
              );
            })}
          </div>
          {fPicked && (
            <div className={`dm-follow-fb${fPicked === f.g.fact ? ' is-right' : ' is-wrong'}`}>
              <p><b>{fPicked === f.g.fact ? 'Correct.' : 'Not quite.'}</b> {f.g.adverse}.</p>
              {fPicked !== f.g.fact && <p className="dm-follow-not">“{fPicked}” goes with {DRUGS.find(d => d.fact === fPicked)?.drugs.join(', ')}.</p>}
              <button type="button" className="dm-start" onClick={nextFollow} autoFocus>
                {fi + 1 < follow.length ? 'Next' : bi + 1 < boards.length ? 'Next board' : 'See results'} →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Play ────────────────────────────────────────────────────────────────
  const total = board.items.length * SECS_PER_PAIR;
  return (
    <div className="dm dm--play" style={{ '--acc': SYSTEMS[system].accent }}>
      <div className="dm-top">
        <button type="button" className="dm-back" onClick={() => setView('home')}>← Quit</button>
        <div className="dm-hud">
          <SfxToggle />
          <span>Board <b>{bi + 1}</b>/{boards.length}</span>
          <span>Score <b>{score}</b></span>
          <span className={combo >= 2 ? 'is-hot' : ''}>Combo <b>×{Math.max(1, combo)}</b></span>
        </div>
      </div>

      <div className="dm-timer" aria-label={`${timeLeft} seconds left`}>
        <i style={{ width: `${(timeLeft / total) * 100}%` }} className={timeLeft <= 10 ? 'is-low' : ''} />
        <span>{timeLeft}s</span>
      </div>

      <p className="dm-instr">{boardDone ? (timedOut ? 'Time! The missing pairs are shown dashed.' : 'Board cleared!') : 'Tap a drug, then its mechanism (or the other way round).'}</p>

      <div className="dm-board" ref={boardRef}>
        <svg className="dm-lines" aria-hidden="true">
          {lines.map(l => {
            const mx = (l.x1 + l.x2) / 2;
            return (
              <path
                key={l.id}
                d={`M${l.x1},${l.y1} C${mx},${l.y1} ${mx},${l.y2} ${l.x2},${l.y2}`}
                className={`dm-line${l.missed ? ' is-missed' : ''}`}
                style={{ '--hue': l.hue }}
              />
            );
          })}
        </svg>
        <div className="dm-col dm-col--drugs">
          {board.left.map((id, i) => {
            const it = byId[id];
            const done = matched.includes(id);
            const cls = `${done ? ' is-done' : ''}${selL === id ? ' is-sel' : ''}${wrong?.l === id && !wrong.fading ? ' is-wrong' : ''}${timedOut && !done ? ' is-missed' : ''}`;
            return (
              <button key={id} ref={el => { leftRefs.current[id] = el; }} type="button" className={`dm-card-drug${cls}`} style={{ '--hue': it.hue, '--d': `${0.05 * i}s` }} onClick={() => clickL(id)} disabled={done || boardDone}>
                <span className="dm-pill" aria-hidden="true" />
                <b>{it.drug}</b>
                {(mode === 'guided' || done || timedOut) && <small>{done || timedOut ? it.g.cls : it.g.uses}</small>}
                {pop?.id === id && <span className="dm-pop" key={pop.text}>{pop.text}</span>}
              </button>
            );
          })}
        </div>
        <div className="dm-col dm-col--mechs">
          {board.right.map((id, i) => {
            const it = byId[id];
            const done = matched.includes(id);
            const cls = `${done ? ' is-done' : ''}${selR === id ? ' is-sel' : ''}${wrong?.r === id && !wrong.fading ? ' is-wrong' : ''}${timedOut && !done ? ' is-missed' : ''}`;
            return (
              <button key={id} ref={el => { rightRefs.current[id] = el; }} type="button" className={`dm-card-mech${cls}`} style={{ '--hue': it.hue, '--d': `${0.05 * i + 0.1}s` }} onClick={() => clickR(id)} disabled={done || boardDone}>
                {it.g.mech}
              </button>
            );
          })}
        </div>
      </div>

      {wrong && !wrong.fading && <p className="dm-toast" role="alert">✗ {wrong.msg}</p>}

      {boardDone && (
        <div className="dm-board-done">
          {!timedOut && <p>Board cleared with <b>{timeLeft}s</b> to spare (+{timeLeft}).</p>}
          <button type="button" className="dm-start" onClick={toFollow} autoFocus>What do they cost the patient? →</button>
        </div>
      )}
    </div>
  );
}

// Capsules drifting behind the menus — decorative.
function Pills() {
  return (
    <div className="dm-pills" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}
    </div>
  );
}
