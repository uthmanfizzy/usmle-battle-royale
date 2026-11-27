import { useEffect, useMemo, useRef, useState } from 'react';
import socket from '../socket';
import { clueSfx } from '../clueSfx';
import { markClSeen, sendClSeen } from '../clueSeen';
import { ClueTicket, ClueSection } from './ClueLadderHome';
import './ClueLadder.css';

/**
 * Clue Ladder — name the disease in as few clues as you can.
 *
 * The server (server/clueladder/game.js) owns the clock, the clues and the
 * scoring. Everyone starts on the same vague first clue; each wrong guess (or
 * "Next clue") costs an attempt and unlocks the next, more specific clue for
 * that player only. Fewest total attempts wins.
 *
 * Listens to cl_* socket events and asks for the current state on mount
 * (cl_sync), because the first case can be announced before this lazy
 * component mounts.
 */

const fmtSecs = (ms) => Math.max(0, Math.ceil(ms / 1000));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/α/g, 'alpha').replace(/[^a-z0-9]+/g, ' ').trim();

function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Six pips: used attempts filled, the winning one green, a failed run red. */
function Pips({ attempts = 0, solved = false, out = false, max = 6 }) {
  return (
    <span className="cl-pips" aria-label={solved ? `Solved on attempt ${attempts}` : out ? 'Out of clues' : `${attempts} of ${max} attempts used`}>
      {Array.from({ length: max }, (_, i) => {
        let cls = '';
        if (i < attempts) cls = solved && i === attempts - 1 ? ' is-win' : ' is-used';
        if (out) cls = ' is-out';
        return <i key={i} className={`cl-pip${cls}`} />;
      })}
    </span>
  );
}

function Podium({ rows, me }) {
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return (
    <div className="cl-podium">
      {order.map((p) => (
        <div key={p.id || p.username} className={`cl-podium-col cl-podium-col--${p.place}${p.username === me ? ' is-me' : ''}`}>
          <span className="cl-podium-crown" aria-hidden="true">{p.place === 1 ? '👑' : p.place === 2 ? '🥈' : '🥉'}</span>
          <span className="cl-podium-name">{p.username}</span>
          <span className="cl-podium-score">{p.attempts} attempts</span>
          <div className="cl-podium-block"><b>{p.place}</b></div>
        </div>
      ))}
    </div>
  );
}

export default function ClueLadderGame({ players = [], username, gameResult, onLeave, onPlayAgain, isHost, muted, onToggleMute }) {
  const [phase, setPhase] = useState('loading');     // loading | intro | playing | reveal | final
  const [round, setRound] = useState(null);
  const [openAt, setOpenAt] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [me, setMe] = useState(null);
  const [progress, setProgress] = useState([]);
  const [reveal, setReveal] = useState(null);
  const [revealEnds, setRevealEnds] = useState(0);
  const [text, setText] = useState('');
  const [hi, setHi] = useState(0);
  const [msg, setMsg] = useState(null);              // { kind, text }
  const [busy, setBusy] = useState(false);
  const [names, setNames] = useState({});            // id -> username, from every source we see
  const inputRef = useRef(null);
  const ladderEnd = useRef(null);

  const now = useNow(phase === 'intro' || phase === 'playing' || phase === 'reveal');
  const msTotal = (round?.seconds || 90) * 1000;
  const msLeft = phase === 'playing' ? Math.max(0, deadline - now) : phase === 'intro' ? msTotal : 0;

  // The clock ticks out loud for the last ten seconds while you are still climbing.
  const secsLeft = fmtSecs(msLeft);
  const tickAt = phase === 'playing' && secsLeft > 0 && secsLeft <= 10 && !me?.solved && !me?.out ? secsLeft : -1;
  useEffect(() => { if (tickAt > 0) clueSfx.tick(tickAt % 2 === 0); }, [tickAt]);

  useEffect(() => {
    setNames(cur => {
      const next = { ...cur };
      for (const p of players || []) if (p?.id) next[p.id] = p.username;
      return next;
    });
  }, [players]);

  // ── Socket wiring ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onRound = (d) => {
      setRound(d);
      setReveal(null);
      setMe(null);
      setText('');
      setMsg(null);
      setProgress([]);
      if (d.phase === 'playing') {
        setPhase('playing');
        setDeadline(Date.now() + (d.msLeft || 0));
      } else {
        setPhase('intro');
        setOpenAt(Date.now() + (d.msToOpen || 2600));
        clueSfx.intro();
      }
    };
    const onOpen = (d) => {
      setPhase('playing');
      setDeadline(Date.now() + (d.msLeft || 0));
      clueSfx.open();
      setTimeout(() => inputRef.current?.focus(), 60);
    };
    const onMe = (d) => setMe(d);
    const onProgress = (d) => setProgress(d.players || []);
    const onReveal = (d) => {
      setReveal(d);
      clueSfx.reveal();
      markClSeen(d.answerKey);
      setRevealEnds(Date.now() + (d.msLeft || 11000));
      setPhase('reveal');
      setNames(cur => {
        const next = { ...cur };
        for (const r of d.results || []) next[r.id] = r.username;
        return next;
      });
    };
    socket.on('cl_round', onRound);
    socket.on('cl_open', onOpen);
    socket.on('cl_me', onMe);
    socket.on('cl_progress', onProgress);
    socket.on('cl_reveal', onReveal);
    socket.emit('cl_sync');
    sendClSeen(socket);
    return () => {
      socket.off('cl_round', onRound);
      socket.off('cl_open', onOpen);
      socket.off('cl_me', onMe);
      socket.off('cl_progress', onProgress);
      socket.off('cl_reveal', onReveal);
    };
  }, []);

  useEffect(() => {
    if (!gameResult) return;
    setPhase('final');
    clueSfx.fanfare(gameResult.players?.[0]?.username === username);
  }, [gameResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // A clue prints (not the first one: the bell rings when the case opens).
  const clueCount = me?.clues?.length || 0;
  const lastClues = useRef(0);
  useEffect(() => {
    if (phase === 'playing' && clueCount > 1 && clueCount > lastClues.current && !me?.solved && !me?.out) clueSfx.clue();
    lastClues.current = clueCount;
  }, [clueCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // A far-off bell when someone else climbs to the answer.
  const othersSolved = progress.filter(p => p.solved && p.id !== socket.id).length;
  const lastSolved = useRef(0);
  useEffect(() => {
    if (othersSolved > lastSolved.current) clueSfx.other();
    lastSolved.current = othersSolved;
  }, [othersSolved]);

  // Keep the newest clue in view as the ladder grows.
  useEffect(() => { ladderEnd.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [me?.clues?.length]);

  // ── Guessing ──────────────────────────────────────────────────────────────
  const answers = useMemo(() => round?.answers || [], [round]);
  const tried = useMemo(() => new Set((me?.guesses || []).filter(g => g.name).map(g => norm(g.name))), [me]);
  const suggestions = useMemo(() => {
    const q = norm(text);
    if (!q) return [];
    const scored = [];
    for (const a of answers) {
      if (tried.has(norm(a.name))) continue;
      const keys = [norm(a.name), ...(a.aliases || [])];
      let best = 99;
      // The diagnosis's own name outranks an alias that matches equally well.
      keys.forEach((k, i) => {
        const alias = i > 0 ? 1 : 0;
        if (k === q) best = Math.min(best, 0 + alias);
        else if (k.startsWith(q)) best = Math.min(best, 2 + alias);
        else if (k.split(' ').some(w => w.startsWith(q))) best = Math.min(best, 4 + alias);
        else if (k.includes(q)) best = Math.min(best, 6 + alias);
      });
      if (best < 99) scored.push({ a, best });
    }
    return scored.sort((x, y) => x.best - y.best || x.a.name.localeCompare(y.a.name)).slice(0, 7).map(x => x.a);
  }, [text, answers, tried]);
  useEffect(() => { setHi(0); }, [text]);

  const done = Boolean(me?.solved || me?.out);
  const canAct = phase === 'playing' && me && !done && !busy;

  function handleResult(res, guessed) {
    setBusy(false);
    if (res?.me) setMe(res.me);
    if (!res) return;
    if (res.reason === 'unknown') {
      setMsg({ kind: 'warn', text: 'Pick a diagnosis from the list. Nothing was used.' });
      return;
    }
    if (res.result === 'repeat') { setMsg({ kind: 'warn', text: 'You already tried that one.' }); return; }
    if (res.reason === 'closed') { setMsg({ kind: 'warn', text: 'Time is up for this case.' }); return; }
    if (res.result === 'correct') {
      clueSfx.correct(res.me?.attempts || 3);
      setMsg({ kind: 'win', text: `Correct! ${res.name} on attempt ${res.me?.attempts}.` });
    } else if (res.result === 'wrong') {
      if (res.me?.out) clueSfx.out(); else clueSfx.wrong();
      setMsg({ kind: res.me?.out ? 'lose' : 'miss', text: res.me?.out ? `${guessed} is wrong, and that was your last clue.` : `${guessed} is wrong. Next clue unlocked.` });
    } else if (res.result === 'pass') {
      if (res.me?.out) clueSfx.out(); else clueSfx.pass();
      setMsg({ kind: res.me?.out ? 'lose' : 'miss', text: res.me?.out ? 'That was your last clue.' : 'Next clue unlocked.' });
    }
  }

  function submit(name) {
    const guess = (name ?? (suggestions[hi]?.name || text)).trim();
    if (!guess || !canAct) return;
    setBusy(true);
    setText('');
    socket.emit('cl_guess', { text: guess }, (res) => handleResult(res, guess));
  }

  function pass() {
    if (!canAct) return;
    setBusy(true);
    socket.emit('cl_pass', (res) => handleResult(res, null));
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, Math.max(0, suggestions.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Escape') setText('');
  }

  // ── Final ─────────────────────────────────────────────────────────────────
  if (phase === 'final' && gameResult) {
    const rows = gameResult.players || [];
    const mine = rows.find(r => r.username === username);
    return (
      <div className="cl cl--final">
        <div className="cl-final">
          <ClueTicket
            kicker="END OF SHIFT"
            title={rows[0]?.username === username ? 'TOP DOC!' : 'SHIFT OVER'}
            tagline={rows[0]?.username === username ? 'You climbed it best.' : `${rows[0]?.username || '—'} climbed it best.`}
            stub={[`${gameResult.total || rows[0]?.played || 0} CASES`, 'FEWEST WINS']}
            cells={[['DOC', username || 'Guest'], ['PLACE', mine ? `#${mine.place} of ${rows.length}` : '—']]}
          />
          {mine && (
            <p className="cl-final-sub">
              You used <b>{mine.attempts}</b> attempts and solved <b>{mine.solved}</b> of {mine.played} cases.
            </p>
          )}
          <Podium rows={rows} me={username} />
          <ClueSection letter="A" title="Leaderboard" />
          <div className="clt-panel">
          <table className="cl-table">
            <thead><tr><th>#</th><th>Player</th><th>Attempts</th><th>Solved</th><th>Time</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id || r.username} className={r.username === username ? 'is-me' : ''}>
                  <td>{r.place}</td><td>{r.username}</td>
                  <td><b>{r.attempts}</b></td><td>{r.solved}/{r.played}</td><td>{Math.round(r.seconds)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <ClueSection letter="B" title="The case files" />
          <ol className="cl-recap">
            {(gameResult.history || []).map(h => (
              <li key={h.index}>
                <b>{h.answer}</b> <span className="cl-chip">{h.group}</span>
                <small>{h.solvedBy ? `solved by ${h.solvedBy}, best in ${h.best}` : 'nobody got it'}</small>
              </li>
            ))}
          </ol>
          <div className="cl-final-actions">
            {isHost && <button type="button" className="clt-cta" onClick={onPlayAgain}><span>Play again</span><i aria-hidden="true">→</i></button>}
            <button type="button" className="cl-btn" onClick={onLeave}>Leave</button>
          </div>
          <p className="cl-note">Fewest attempts wins. A case you do not solve counts as 7.</p>
        </div>
      </div>
    );
  }

  // ── In play ───────────────────────────────────────────────────────────────
  const clues = me?.clues || [];
  const max = round?.maxAttempts || 6;
  const lowTime = phase === 'playing' && msLeft < 10000;
  const nameFor = (id) => names[id] || (id === socket.id ? username : 'Player');
  const rows = progress.length ? progress : (players || []).map(p => ({ id: p.id, attempts: 0 }));

  return (
    <div className="cl">
      <div className="cl-top">
        <button type="button" className="cl-link" onClick={onLeave}>✕ Leave</button>
        <button type="button" className="cl-link" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
      </div>

      {round && (
        <div className="cl-head">
          <ClueTicket
            kicker={`CASE ${round.index} OF ${round.total}`}
            title="CLUE LADDER"
            tagline={<>{round.system?.icon} {round.system?.name} · <b>{round.group}</b></>}
            stub={[
              <b key="t" className={`cl-stub-time${lowTime ? ' is-low' : ''}`}>{phase === 'intro' ? '--' : fmtSecs(msLeft)}s</b>,
              `ATTEMPTS ${me?.attempts || 0}/${round.maxAttempts || 6}`,
            ]}
          />
          <span className={`cl-clock${lowTime ? ' is-low' : ''}`} aria-hidden="true">
            <i style={{ width: `${(phase === 'intro' ? 1 : msLeft / msTotal) * 100}%` }} />
          </span>
        </div>
      )}

      {phase === 'loading' && <p className="cl-wait">Setting up the first case…</p>}

      {phase === 'intro' && round && (
        <div className="cl-intro" key={round.index}>
          <p className="cl-eyebrow">Case {round.index}</p>
          <h2>{round.group}</h2>
          <p>Starts vague. Every wrong guess unlocks a sharper clue. Fewest attempts wins.</p>
          {round.notice && <p className="cl-notice">{round.notice}</p>}
          <b className="cl-intro-count">{fmtSecs(Math.max(0, openAt - now))}</b>
        </div>
      )}

      {phase === 'reveal' && reveal && (
        <section className="cl-reveal" aria-label="Answer">
          <div className="cl-reveal-card">
            <p className="cl-eyebrow">Case {reveal.index} of {reveal.total} · {reveal.group}</p>
            <h2 className="cl-reveal-answer">{reveal.answer}</h2>
            <span className="cl-stamp" aria-hidden="true">Diagnosed</span>
            {reveal.brief && (
              <div className="cl-brief">
                <span className="cl-brief-tag">Study note</span>
                <p className="cl-brief-what">{reveal.brief.what}</p>
                <ul>{reveal.brief.points.map(p => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            <table className="cl-table cl-table--compact">
              <thead><tr><th>Player</th><th>Attempts</th><th>Guesses</th></tr></thead>
              <tbody>
                {reveal.results.map(r => (
                  <tr key={r.id} className={r.id === socket.id ? 'is-me' : ''}>
                    <td>{r.username}</td>
                    <td>{r.solved ? <b className="cl-ok">{r.attempts}</b> : <span className="cl-bad">✗ (7)</span>}</td>
                    <td className="cl-guesses">{r.guesses.length ? r.guesses.join(' → ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cl-reveal-next">{reveal.isLast ? 'Final results' : 'Next case'} in {fmtSecs(Math.max(0, revealEnds - now))}s</p>
          </div>
        </section>
      )}
      {(phase === 'playing' || phase === 'reveal') && (
        <main className="cl-main">
          <section className="cl-ladder-wrap" aria-label="Your clues">
            <ClueSection letter="A" title="The case file" meta={phase === 'reveal' ? 'All clues' : `${clues.length} of ${max} open`} />
            <ol className="cl-ladder">
              {Array.from({ length: max }, (_, i) => {
                const clue = (phase === 'reveal' ? reveal?.clues?.[i] : clues[i]);
                const open = Boolean(clue);
                const newest = phase === 'playing' && !done && i === clues.length - 1;
                return (
                  <li key={i} className={`cl-rung${open ? ' is-open' : ''}${newest ? ' is-new' : ''}`} ref={newest ? ladderEnd : undefined}>
                    <span className="cl-rung-n">{i + 1}</span>
                    <span className="cl-rung-text">{open ? clue : 'Locked. A wrong guess or "Next clue" opens it.'}</span>
                  </li>
                );
              })}
            </ol>

            {phase === 'playing' && <ClueSection letter="B" title="Your diagnosis" />}
            {phase === 'playing' && (
              <div className="cl-guess">
                <div className="cl-attempts">
                  <span>Attempts</span>
                  <Pips attempts={me?.attempts || 0} solved={me?.solved} out={me?.out} max={max} />
                </div>
                {done ? (
                  <p className={`cl-done ${me?.solved ? 'is-win' : 'is-lose'}`}>
                    {me?.solved ? `Solved on attempt ${me.attempts}. Waiting for the others…` : 'Out of clues. Waiting for the others…'}
                  </p>
                ) : (
                  <>
                    <div className="cl-input-wrap">
                      <input
                        ref={inputRef}
                        className="cl-input"
                        value={text}
                        onChange={e => { setText(e.target.value); clueSfx.key(); }}
                        onKeyDown={onKey}
                        placeholder="Type a diagnosis…"
                        aria-label="Your diagnosis"
                        autoComplete="off"
                        spellCheck={false}
                        disabled={!canAct}
                      />
                      {suggestions.length > 0 && (
                        <ul className="cl-suggest" role="listbox">
                          {suggestions.map((a, i) => (
                            <li
                              key={a.name}
                              role="option"
                              aria-selected={i === hi}
                              className={i === hi ? 'is-hi' : ''}
                              onMouseDown={(e) => { e.preventDefault(); submit(a.name); }}
                              onMouseEnter={() => setHi(i)}
                            >{a.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="cl-guess-actions">
                      <button type="button" className="clt-cta" disabled={!canAct || !text.trim()} onClick={() => submit()}><span>Diagnose</span><i aria-hidden="true">→</i></button>
                      <button type="button" className="cl-btn" disabled={!canAct} onClick={pass} title="Costs one attempt">Next clue ↓</button>
                    </div>
                  </>
                )}
                {msg && <p className={`cl-msg cl-msg--${msg.kind}`} role="status">{msg.text}</p>}
                {(me?.guesses || []).length > 0 && (
                  <div className="cl-tried">
                    {me.guesses.map((g, i) => (
                      <span key={i} className={`cl-tag${g.correct ? ' is-win' : ''}`}>{g.correct ? '✓' : '✗'} {g.pass ? 'Next clue' : g.name}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="cl-side" aria-label="Players">
            <ClueSection letter="C" title="On shift" />
            <ul className="cl-players">
              {rows.map(p => (
                <li key={p.id} className={p.id === socket.id ? 'is-me' : ''}>
                  <span className="cl-player-name">{nameFor(p.id)}</span>
                  <Pips attempts={p.attempts} solved={p.solved} out={p.out} max={max} />
                  <span className="cl-player-state">{p.solved ? `✓ ${p.attempts}` : p.out ? '✗' : '…'}</span>
                </li>
              ))}
            </ul>
            <p className="cl-note">You see how far each player has climbed, never what they guessed.</p>
          </aside>
        </main>
      )}

    </div>
  );
}
