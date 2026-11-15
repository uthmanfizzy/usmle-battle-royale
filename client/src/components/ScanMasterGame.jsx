import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import socket from '../socket';
import * as audio from '../audio';
import { SERVER_URL } from '../serverUrl';
import './ScanMaster.css';

/**
 * Scan Master — one image, four options, read it before the clock runs out.
 *
 * Runs two ways with the same screen:
 *   mode="online"  the server (server/scanmaster/game.js) owns the clock and
 *                  the scoring; this listens to scan_* socket events and asks
 *                  for the current state on mount (scan_sync), because the
 *                  first question can be sent before a lazy component mounts.
 *   mode="solo"    the run is fetched from /api/scan-master/solo and marked
 *                  here, with the same timings and the same points formula.
 *
 * Points for a right answer: 100 + up to 100 for speed + 20 per right answer
 * in a row after the first (capped at +100). Wrong or too slow: 0.
 */

const INTRO_MS = 1800;
const REVEAL_MS = 5200;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

function pointsFor(msLeft, msTotal, streakBefore) {
  const speed = Math.round(100 * Math.max(0, Math.min(1, msLeft / msTotal)));
  const streak = Math.min(100, 20 * streakBefore);
  return { base: 100, speed, streakBonus: streak, total: 100 + speed + streak };
}

function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    let raf;
    const tick = () => { setNow(Date.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

function TimerRing({ msLeft, msTotal }) {
  const frac = Math.max(0, Math.min(1, msLeft / msTotal));
  const r = 26;
  const c = 2 * Math.PI * r;
  const secs = Math.ceil(msLeft / 1000);
  return (
    <div className={`smg-timer${secs <= 5 ? ' is-low' : ''}`} aria-label={`${secs} seconds left`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="smg-timer-track" />
        <circle
          cx="32" cy="32" r={r} className="smg-timer-fill"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      <b>{secs}</b>
    </div>
  );
}

function Podium({ rows, me }) {
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return (
    <div className="smg-podium">
      {order.map((p) => (
        <div
          key={p.id || p.username}
          className={`smg-podium-col smg-podium-col--${p.place}${p.username === me ? ' is-me' : ''}`}
        >
          <span className="smg-podium-crown" aria-hidden="true">{p.place === 1 ? '👑' : p.place === 2 ? '🥈' : '🥉'}</span>
          <span className="smg-podium-name">{p.username}</span>
          <span className="smg-podium-score">{fmt(p.score)}</span>
          <div className="smg-podium-block"><b>{p.place}</b></div>
        </div>
      ))}
    </div>
  );
}

export default function ScanMasterGame({
  mode = 'online',
  // online
  players = [], socketId, username, gameResult, onLeave, onPlayAgain, isHost,
  // solo
  soloOptions, onExit,
  muted, onToggleMute,
}) {
  const online = mode === 'online';
  // Options that are single letters (labels on the image) get numbered keys,
  // so a button never reads "A · F".
  const [phase, setPhase] = useState(online ? 'loading' : 'loading');
  const [q, setQ] = useState(null);
  const [openAt, setOpenAt] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [myPick, setMyPick] = useState(null);
  const [locked, setLocked] = useState([]);
  const [reveal, setReveal] = useState(null);
  const [revealAt, setRevealAt] = useState(0);
  const [standings, setStandings] = useState([]);
  const [zoom, setZoom] = useState(false);
  const [error, setError] = useState('');
  const [pop, setPop] = useState(null);           // { key, total, streak }
  // Which picture has finished loading. Keyed by src rather than a boolean
  // reset on every question: a cached picture can fire onLoad before the
  // effect that would reset the flag, and then it would never show.
  const [loadedSrc, setLoadedSrc] = useState('');

  // Solo state
  const [soloRun, setSoloRun] = useState(null);   // { questions, seconds }
  const [soloIdx, setSoloIdx] = useState(0);
  const [soloScore, setSoloScore] = useState(0);
  const [soloStreak, setSoloStreak] = useState(0);
  const [soloBest, setSoloBest] = useState(0);
  const [soloLog, setSoloLog] = useState([]);
  const soloTimer = useRef(null);
  const ticked = useRef(new Set());

  const letterOpts = Boolean(q?.options?.length && q.options.every(o => /^[A-Z]$/.test(String(o).trim())));
  const live = phase === 'intro' || phase === 'answering' || phase === 'reveal';
  const now = useNow(live);
  const msTotal = (q?.seconds || 20) * 1000;
  const msLeft = phase === 'answering' ? Math.max(0, deadline - now) : phase === 'intro' ? msTotal : 0;

  // ── Online wiring ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!online) return undefined;
    const onQuestion = (d) => {
      setQ(d);
      setReveal(null);
      setLocked([]);
      setPop(null);
      ticked.current = new Set();
      setMyPick(d.mine ?? null);
      if (d.phase === 'answering') {
        setPhase('answering');
        setDeadline(Date.now() + (d.msLeft || 0));
      } else {
        setPhase('intro');
        setOpenAt(Date.now() + (d.msToOpen || INTRO_MS));
        audio.playScanSweep();
      }
    };
    const onOpen = (d) => {
      setPhase('answering');
      setDeadline(Date.now() + (d.msLeft || 0));
    };
    const onProgress = (d) => setLocked(d.locked || []);
    const onReveal = (d) => {
      setReveal(d);
      setRevealAt(Date.now());
      setStandings(d.standings || []);
      setPhase('reveal');
      const mine = d.gains?.[socket.id];
      if (mine?.correct) {
        audio.playScanCorrect(mine.streak || 1);
        setPop({ key: Date.now(), total: mine.total, streak: mine.streak });
      } else {
        setPop(null);
        audio.playScanWrong();
      }
    };
    socket.on('scan_question', onQuestion);
    socket.on('scan_open', onOpen);
    socket.on('scan_progress', onProgress);
    socket.on('scan_reveal', onReveal);
    socket.emit('scan_sync');
    return () => {
      socket.off('scan_question', onQuestion);
      socket.off('scan_open', onOpen);
      socket.off('scan_progress', onProgress);
      socket.off('scan_reveal', onReveal);
    };
  }, [online]);

  useEffect(() => {
    if (online && gameResult) setPhase('final');
  }, [online, gameResult]);

  // ── Solo engine ───────────────────────────────────────────────────────────
  const loadSolo = useCallback(() => {
    setPhase('loading');
    setError('');
    const systems = (soloOptions?.systems || []).join(',');
    const count = soloOptions?.count || 10;
    fetch(`${SERVER_URL}/api/scan-master/solo?systems=${encodeURIComponent(systems)}&count=${count}`)
      .then(r => r.json())
      .then((d) => {
        const questions = d?.questions || [];
        if (!questions.length) { setPhase('empty'); return; }
        // Warm the cache so each picture is ready when its turn comes.
        questions.forEach(x => { const im = new Image(); im.src = x.image; });
        setSoloRun({ questions, seconds: d.seconds || 20 });
        setSoloIdx(0);
        setSoloScore(0);
        setSoloStreak(0);
        setSoloBest(0);
        setSoloLog([]);
      })
      .catch(() => { setError('Could not load Scan Master images.'); setPhase('error'); });
  }, [soloOptions]);

  useEffect(() => { if (!online) loadSolo(); }, [online, loadSolo]);

  // Start each solo question.
  useEffect(() => {
    if (online || !soloRun) return undefined;
    const item = soloRun.questions[soloIdx];
    if (!item) return undefined;
    setQ({
      index: soloIdx + 1, total: soloRun.questions.length, system: item.system,
      modality: item.modality, prompt: item.prompt, image: item.image,
      options: item.options, seconds: soloRun.seconds,
    });
    setReveal(null);
    setMyPick(null);
    setPop(null);
    ticked.current = new Set();
    setPhase('intro');
    setOpenAt(Date.now() + INTRO_MS);
    audio.playScanSweep();
    clearTimeout(soloTimer.current);
    soloTimer.current = setTimeout(() => {
      setPhase('answering');
      setDeadline(Date.now() + soloRun.seconds * 1000);
    }, INTRO_MS);
    return () => clearTimeout(soloTimer.current);
  }, [online, soloRun, soloIdx]);

  const soloReveal = useCallback((choice) => {
    if (!soloRun) return;
    const item = soloRun.questions[soloIdx];
    const left = Math.max(0, deadline - Date.now());
    const correct = choice === item.correct;
    const pts = correct ? pointsFor(left, soloRun.seconds * 1000, soloStreak) : { base: 0, speed: 0, streakBonus: 0, total: 0 };
    const streak = correct ? soloStreak + 1 : 0;
    setSoloStreak(streak);
    setSoloBest(b => Math.max(b, streak));
    setSoloScore(s => s + pts.total);
    setSoloLog(l => [...l, { ...item, choice, isRight: correct, points: pts.total }]);
    setReveal({
      correct: item.correct, answer: item.answer, explanation: item.explanation,
      gains: { me: { choice, correct, ...pts, streak } },
      isLast: soloIdx >= soloRun.questions.length - 1,
    });
    setRevealAt(Date.now());
    setPhase('reveal');
    if (correct) {
      audio.playScanCorrect(streak);
      setPop({ key: Date.now(), total: pts.total, streak });
    } else {
      setPop(null);
      audio.playScanWrong();
    }
    clearTimeout(soloTimer.current);
    soloTimer.current = setTimeout(() => advanceSolo(), REVEAL_MS + 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloRun, soloIdx, deadline, soloStreak]);

  const advanceSolo = () => {
    clearTimeout(soloTimer.current);
    if (!soloRun) return;
    if (soloIdx >= soloRun.questions.length - 1) {
      setPhase('final');
      audio.playScanFanfare(true);
    } else {
      setSoloIdx(i => i + 1);
    }
  };

  // Solo: the clock runs out.
  useEffect(() => {
    if (online || phase !== 'answering') return undefined;
    const t = setTimeout(() => soloReveal(null), Math.max(0, deadline - Date.now()) + 50);
    return () => clearTimeout(t);
  }, [online, phase, deadline, soloReveal]);

  useEffect(() => () => clearTimeout(soloTimer.current), []);

  // ── Countdown bleeps ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'answering' || myPick !== null) return;
    const s = Math.ceil(msLeft / 1000);
    if (s <= 5 && s >= 1 && !ticked.current.has(s)) {
      ticked.current.add(s);
      audio.playScanCountdown(s <= 2);
    }
  }, [phase, msLeft, myPick]);

  // ── Answering ─────────────────────────────────────────────────────────────
  const pick = useCallback((i) => {
    if (phase !== 'answering' || myPick !== null || !q || i >= q.options.length) return;
    setMyPick(i);
    audio.playScanLock();
    if (online) {
      socket.emit('scan_answer', { choice: i }, (res) => {
        if (res && res.ok === false && res.reason === 'closed') setMyPick(null);
      });
    } else {
      soloReveal(i);
    }
  }, [phase, myPick, q, online, soloReveal]);

  useEffect(() => {
    const onKey = (e) => {
      if (zoom && e.key === 'Escape') { setZoom(false); return; }
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key.toUpperCase();
      // When the options are themselves letters ("which letter is the
      // lesion?"), only the number keys pick — A-D would be ambiguous.
      const n = /^[1-6]$/.test(k) ? Number(k) - 1 : (letterOpts ? -1 : LETTERS.indexOf(k));
      if (n >= 0) pick(n);
      if (!online && phase === 'reveal' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); advanceSolo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, zoom, online, phase, letterOpts]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const myId = online ? socket.id : 'me';
  const myGain = reveal?.gains?.[myId] || null;
  const myStanding = online ? standings.find(s => s.id === myId) : null;
  const myScore = online ? (myStanding?.score ?? 0) : soloScore;
  const myStreak = online ? (myStanding?.streak ?? 0) : soloStreak;

  const liveRows = useMemo(() => {
    if (!online) return [];
    const base = standings.length ? standings : players.map(p => ({ id: p.id, username: p.username, isBot: p.isBot, score: 0, correct: 0, streak: 0 }));
    return base;
  }, [online, standings, players]);

  const imgLoaded = Boolean(q && loadedSrc === q.image);
  const revealLeft = phase === 'reveal' ? Math.max(0, (online ? REVEAL_MS : REVEAL_MS + 1500) - (now - revealAt)) : 0;

  // ── Screens ───────────────────────────────────────────────────────────────
  const leave = online ? onLeave : onExit;

  if (phase === 'final') {
    const rows = online
      ? (gameResult?.players || []).map((p) => ({ ...p }))
      : [{ id: 'me', username: username || 'You', place: 1, score: soloScore, correct: soloLog.filter(l => l.isRight).length, answered: soloLog.length, bestStreak: soloBest }];
    const total = online ? (gameResult?.total || 0) : soloLog.length;
    const recap = online ? (gameResult?.history || []) : soloLog;
    const meRow = rows.find(r => (online ? r.id === myId : true));
    return (
      <div className="smg smg--final">
        <div className="smg-bg" aria-hidden="true" />
        <div className="smg-confetti" aria-hidden="true">
          {Array.from({ length: 26 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
        </div>
        <div className="smg-final">
          <p className="smg-kicker">🔬 Scan Master</p>
          <h1 className="smg-final-title">
            {online
              ? (meRow?.place === 1 ? 'You read them best!' : `${rows[0]?.username || 'Someone'} takes it`)
              : 'Run complete'}
          </h1>
          {online && rows.length > 1 && <Podium rows={rows} me={username} />}
          {!online && (
            <div className="smg-solo-sum">
              <div><b>{fmt(soloScore)}</b><span>points</span></div>
              <div><b>{rows[0].correct}/{total}</b><span>correct</span></div>
              <div><b>{soloBest}</b><span>best streak</span></div>
            </div>
          )}
          {online && (
            <table className="smg-table">
              <thead>
                <tr><th>#</th><th>Player</th><th>Points</th><th>Correct</th><th>Best streak</th><th>Fastest</th></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id || r.username} className={r.id === myId ? 'is-me' : ''}>
                    <td>{r.place}</td>
                    <td>{r.username}</td>
                    <td><b>{fmt(r.score)}</b></td>
                    <td>{r.correct}/{total}</td>
                    <td>{r.bestStreak ? `🔥 ${r.bestStreak}` : '—'}</td>
                    <td>{r.fastest != null ? `${r.fastest}s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {recap.length > 0 && (
            <section className="smg-recap">
              <h2>The images</h2>
              <div className="smg-recap-grid">
                {recap.map((r, i) => (
                  <figure key={i} className={`smg-recap-item${online ? '' : r.isRight ? ' is-right' : ' is-wrong'}`}>
                    <img src={r.image} alt="" loading="lazy" />
                    <figcaption>
                      <b>{r.answer}</b>
                      {online
                        ? <small>{r.right} got it</small>
                        : <small>{r.isRight ? `✓ +${r.points}` : r.choice == null ? '⏱ no answer' : `✗ you said ${r.options[r.choice]}`}</small>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
          <div className="smg-final-actions">
            <button type="button" className="smg-btn smg-btn--ghost" onClick={leave}>← Leave</button>
            {online
              ? (isHost && <button type="button" className="smg-btn smg-btn--go" onClick={onPlayAgain}>Play again ▶</button>)
              : <button type="button" className="smg-btn smg-btn--go" onClick={loadSolo}>New run ▶</button>}
          </div>
          {online && !isHost && <p className="smg-note">The host can start another match.</p>}
        </div>
      </div>
    );
  }

  if (phase === 'empty' || phase === 'error') {
    return (
      <div className="smg">
        <div className="smg-bg" aria-hidden="true" />
        <div className="smg-empty">
          <span aria-hidden="true">🩻</span>
          <h2>{phase === 'error' ? error : 'No images to scan yet'}</h2>
          <p>{phase === 'error'
            ? 'Check your connection and try again.'
            : 'There are no Scan Master images for that choice of systems yet. Try All systems, or add images in Admin → Scan Master.'}</p>
          <button type="button" className="smg-btn smg-btn--go" onClick={leave}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`smg smg--${phase}`}>
      <div className="smg-bg" aria-hidden="true" />

      {/* ── HUD ── */}
      <header className="smg-hud">
        <button type="button" className="smg-btn smg-btn--mini" onClick={leave} title="Leave">✕</button>
        <div className="smg-hud-q">
          <span className="smg-kicker">🔬 Scan Master</span>
          {q && <b>Image {q.index} <i>/ {q.total}</i></b>}
        </div>
        {q && (
          <div className="smg-hud-tags">
            <span className="smg-chip">{q.system?.icon} {q.system?.name}</span>
            {q.modality && <span className="smg-chip smg-chip--dim">{q.modality}</span>}
          </div>
        )}
        <div className="smg-hud-score">
          <span>Score</span>
          <b key={myScore} className="smg-bump">{fmt(myScore)}</b>
        </div>
        {myStreak >= 2 && <div className="smg-streak" key={myStreak}>🔥 {myStreak}</div>}
        {onToggleMute && (
          <button type="button" className="smg-btn smg-btn--mini" onClick={onToggleMute} title={muted ? 'Sound on' : 'Sound off'}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}
      </header>

      {q && (
        <div className="smg-progress" aria-hidden="true">
          <span style={{ width: `${((q.index - (phase === 'reveal' ? 0 : 1)) / q.total) * 100}%` }} />
        </div>
      )}

      <main className="smg-main">
        {/* ── The film ── */}
        <section className="smg-viewer-wrap">
          <div className={`smg-viewer${imgLoaded ? ' is-loaded' : ''}`}>
            <span className="smg-corner smg-corner--tl" aria-hidden="true" />
            <span className="smg-corner smg-corner--tr" aria-hidden="true" />
            <span className="smg-corner smg-corner--bl" aria-hidden="true" />
            <span className="smg-corner smg-corner--br" aria-hidden="true" />
            {q && (
              <img
                key={q.image}
                src={q.image}
                alt="The image to identify"
                className="smg-img"
                onLoad={() => setLoadedSrc(q.image)}
                ref={(el) => { if (el && el.complete && el.naturalWidth && loadedSrc !== q.image) setLoadedSrc(q.image); }}
                onClick={() => phase !== 'intro' && setZoom(true)}
                draggable={false}
              />
            )}
            {phase === 'intro' && (
              <div className="smg-scan" aria-hidden="true">
                <span className="smg-scan-line" />
                <span className="smg-scan-label">SCANNING<i>.</i><i>.</i><i>.</i></span>
              </div>
            )}
            {phase === 'loading' && <div className="smg-loading">Warming up the scanner…</div>}
            {phase !== 'intro' && q && <span className="smg-zoom-hint">🔍 Tap to enlarge</span>}
            {pop && phase === 'reveal' && (
              <span className="smg-pop" key={pop.key}>
                +{pop.total}
                {pop.streak >= 2 && <small>🔥 streak ×{pop.streak}</small>}
              </span>
            )}
          </div>
          {q && <p className="smg-prompt">{q.prompt}</p>}
        </section>

        {/* ── The options ── */}
        <section className="smg-side">
          <div className="smg-clock-row">
            {q && (phase === 'answering' || phase === 'intro') && <TimerRing msLeft={msLeft} msTotal={msTotal} />}
            <p className="smg-status" aria-live="polite">
              {phase === 'intro' && 'Get ready…'}
              {phase === 'answering' && (myPick === null ? 'Lock in your answer' : online ? 'Locked in — waiting for the others' : 'Locked in')}
              {phase === 'reveal' && (myGain?.correct ? '✓ Correct!' : myGain?.choice == null ? '⏱ Time’s up' : '✗ Not quite')}
            </p>
          </div>

          <div className="smg-options" role="group" aria-label="Answer options">
            {q?.options.map((opt, i) => {
              const isCorrect = phase === 'reveal' && reveal?.correct === i;
              const isMine = myPick === i;
              const wrongMine = phase === 'reveal' && isMine && reveal?.correct !== i;
              const pickers = online && phase === 'reveal'
                ? liveRows.filter(p => reveal?.gains?.[p.id]?.choice === i)
                : [];
              return (
                <button
                  key={`${q.index}-${i}`}
                  type="button"
                  className={[
                    'smg-opt',
                    isMine ? 'is-mine' : '',
                    isCorrect ? 'is-correct' : '',
                    wrongMine ? 'is-wrong' : '',
                    phase === 'reveal' && !isCorrect && !isMine ? 'is-dim' : '',
                  ].join(' ')}
                  style={{ '--d': `${0.06 * i}s` }}
                  disabled={phase !== 'answering' || myPick !== null}
                  onClick={() => pick(i)}
                >
                  <span className="smg-opt-key">{letterOpts ? i + 1 : LETTERS[i]}</span>
                  <span className={`smg-opt-text${letterOpts ? ' smg-opt-text--label' : ''}`}>{letterOpts ? `Label ${opt}` : opt}</span>
                  {isCorrect && <span className="smg-opt-mark" aria-hidden="true">✓</span>}
                  {wrongMine && <span className="smg-opt-mark" aria-hidden="true">✗</span>}
                  {pickers.length > 0 && (
                    <span className="smg-opt-pickers">
                      {pickers.slice(0, 4).map(p => <i key={p.id} title={p.username}>{(p.username || '?')[0]}</i>)}
                      {pickers.length > 4 && <i>+{pickers.length - 4}</i>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {phase === 'reveal' && reveal && (
            <div className="smg-reveal">
              <p className="smg-reveal-answer">
                <span>Answer</span> {reveal.answer}
              </p>
              {myGain?.correct && (
                <p className="smg-reveal-points">
                  +{myGain.base} correct · +{myGain.speed} speed{myGain.streakBonus ? ` · +${myGain.streakBonus} streak bonus` : ''}
                </p>
              )}
              {reveal.explanation && <p className="smg-reveal-expl">{reveal.explanation}</p>}
              <div className="smg-reveal-foot">
                <span className="smg-reveal-bar"><i style={{ width: `${(revealLeft / (online ? REVEAL_MS : REVEAL_MS + 1500)) * 100}%` }} /></span>
                {!online && (
                  <button type="button" className="smg-btn smg-btn--go" onClick={advanceSolo}>
                    {reveal.isLast ? 'Results ▶' : 'Next ▶'}
                  </button>
                )}
                {online && <span className="smg-note">{reveal.isLast ? 'Final standings next…' : 'Next image coming up…'}</span>}
              </div>
            </div>
          )}

          {online && (
            <ol className="smg-board" aria-label="Standings">
              {[...liveRows].sort((a, b) => b.score - a.score).map((p, i) => {
                const gain = phase === 'reveal' ? reveal?.gains?.[p.id] : null;
                const isLocked = phase === 'answering' && locked.includes(p.id);
                return (
                  <li key={p.id} className={`${p.id === myId ? 'is-me' : ''}${isLocked ? ' is-locked' : ''}`}>
                    <em>{i + 1}</em>
                    <span className="smg-board-name">{p.username}</span>
                    {isLocked && <span className="smg-board-lock" title="Locked in">🔒</span>}
                    {gain && <span className={`smg-board-gain${gain.correct ? ' is-up' : ''}`}>{gain.correct ? `+${gain.total}` : '+0'}</span>}
                    <b>{fmt(p.score)}</b>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>

      {zoom && q && (
        <div className="smg-zoom" onClick={() => setZoom(false)} role="dialog" aria-label="Enlarged image">
          <img src={q.image} alt="" />
          <span>Tap anywhere to close</span>
        </div>
      )}
    </div>
  );
}
