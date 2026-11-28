import { useMemo } from 'react';
import './BuzzFunResults.css';

/**
 * Buzz Fun's own end screen, in the hive theme (same honey-on-dark-brown
 * palette as BuzzFunGame and BuzzFunLobby).
 *
 * The server's game_over for buzz_fun carries, per player, a `buzz` tally
 * (correct, answered, bestStreak, firsts, fastestMs, topics) and the match's
 * `totalCards`. Older servers send neither — every number below falls back
 * to something sensible rather than breaking the screen.
 *
 * Three ways out: play again (back to the same room), back to Online (leaves
 * the room, lands on the Online page) or Home.
 */

const MEDAL = ['🥇', '🥈', '🥉'];

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

function verdict(acc) {
  if (acc >= 90) return { title: 'Queen Bee', line: 'Near-perfect recall. The hive bows.' };
  if (acc >= 75) return { title: 'Honey Master', line: 'Strong buzzwords — a few left to polish.' };
  if (acc >= 50) return { title: 'Busy Bee', line: 'Solid run. Revisit the weaker topics below.' };
  return { title: 'Worker Bee', line: 'Every card you missed is one you will remember next time.' };
}

export default function BuzzFunResults({ gameResult, username, onPlayAgain, onOnline, onHome, isGuest, onSignIn }) {
  const board = gameResult?.leaderboard || [];
  const me = board.find(p => p.username === username) || null;
  const total = gameResult?.totalCards || me?.buzz?.answered || 0;
  const st = me?.buzz || { correct: 0, answered: 0, bestStreak: 0, firsts: 0, fastestMs: null, topics: {} };
  const acc = pct(st.correct, total);
  const solo = board.length <= 1;
  const top = board[0]?.score ?? 0;
  const tiedTop = board.filter(p => p.score === top);
  const tie = !solo && tiedTop.length > 1;
  const iWon = !tie && gameResult?.winner?.username === username;
  const v = verdict(acc);

  const title = solo ? v.title
    : tie ? (tiedTop.some(p => p.username === username) ? 'A shared hive!' : 'A tie at the top')
    : iWon ? 'You took the honey!'
    : `${gameResult?.winner?.username || 'Nobody'} takes the honey`;
  const sub = solo ? v.line
    : tie ? `${tiedTop.length} players level on ${top.toLocaleString()}. ${v.line}`
    : iWon ? `Top of ${board.length} players. ${v.line}`
    : `You finished #${me?.rank || '–'} of ${board.length}. ${v.line}`;

  const topics = useMemo(() => Object.entries(st.topics || {}).map(([topic, t]) => ({ topic, ...t, p: pct(t.correct, t.total) })), [st]);

  // Honey drops for the celebration — fixed positions, no randomness on rerender.
  const drops = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: (i * 61) % 100, delay: (i * 0.37) % 3.2, dur: 3.6 + ((i * 7) % 5) * 0.4, size: 10 + ((i * 5) % 4) * 4,
  })), []);

  if (!gameResult) return null;

  return (
    <div className="bfr">
      <div className="bfr-drops" aria-hidden="true">
        {drops.map((d, i) => (
          <span key={i} className="bfr-drop" style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, width: d.size, height: d.size * 1.15 }} />
        ))}
      </div>

      <main className="bfr-card">
        <header className="bfr-head">
          <div className="bfr-kicker"><span aria-hidden="true">🐝</span> Buzz Fun · {gameResult?.reason === 'forfeit' ? (solo ? 'Run ended early' : 'Match ended early') : `${solo ? 'Solo run' : 'Match'} complete`}</div>
          <h1 className="bfr-title">{title}</h1>
          <p className="bfr-sub">{sub}</p>
        </header>

        {/* ── Score + accuracy ─────────────────────────────────────────── */}
        <section className="bfr-hero">
          <div className="bfr-ring" style={{ '--p': acc }} role="img" aria-label={`${acc}% correct`}>
            <div className="bfr-ring-in">
              <b>{acc}%</b>
              <span>accuracy</span>
            </div>
          </div>
          <div className="bfr-score">
            <span className="bfr-score-label">Honey earned</span>
            <b className="bfr-score-n">{(me?.score ?? 0).toLocaleString()}</b>
            <span className="bfr-score-sub">{st.correct} of {total} cards right</span>
          </div>
        </section>

        <section className="bfr-stats">
          <div className="bfr-hex"><span aria-hidden="true">✅</span><b>{st.correct}/{total}</b><small>Correct</small></div>
          <div className="bfr-hex"><span aria-hidden="true">🔥</span><b>{st.bestStreak}</b><small>Best streak</small></div>
          <div className="bfr-hex"><span aria-hidden="true">⚡</span><b>{st.firsts}</b><small>First buzzes</small></div>
          <div className="bfr-hex"><span aria-hidden="true">⏱️</span><b>{st.fastestMs != null ? `${(st.fastestMs / 1000).toFixed(1)}s` : '—'}</b><small>Fastest</small></div>
        </section>

        {/* ── How far through the bank (only when skipping today's cards) ── */}
        {me?.buzzLeft && me.buzzLeft.total > 0 && (
          me.buzzLeft.left === 0 ? (
            <section className="bfr-bank is-done" role="status">
              <span className="bfr-bank-icon" aria-hidden="true">🏆</span>
              <div>
                <b>{me.buzzLeft.replay ? `You had already finished ${me.buzzLeft.label} ${me.buzzLeft.withYesterday ? "today or yesterday" : "today"}` : `You have finished the entire ${me.buzzLeft.label} bank!`}</b>
                <small>All {me.buzzLeft.total} cards done {me.buzzLeft.withYesterday ? 'today or yesterday' : 'today'}{me.buzzLeft.replay ? ', so this run was a repeat.' : '. Pick another system, or allow repeats to go round again.'}</small>
              </div>
            </section>
          ) : (
            <section className="bfr-bank" role="status">
              <span className="bfr-bank-icon" aria-hidden="true">🍯</span>
              <div>
                <b>{me.buzzLeft.left} card{me.buzzLeft.left === 1 ? '' : 's'} left in {me.buzzLeft.label}</b>
                <small>{me.buzzLeft.total - me.buzzLeft.left} of {me.buzzLeft.total} done {me.buzzLeft.withYesterday ? 'today or yesterday' : 'today'}. Play again to keep going.</small>
                <span className="bfr-bar"><span style={{ width: `${pct(me.buzzLeft.total - me.buzzLeft.left, me.buzzLeft.total)}%` }} /></span>
              </div>
            </section>
          )
        )}

        {/* ── Topic by topic ───────────────────────────────────────────── */}
        {topics.length > 0 && (
          <section className="bfr-block">
            <h2 className="bfr-h">Topic by topic</h2>
            <ul className="bfr-topics">
              {topics.map((t, i) => (
                <li key={t.topic} className={`bfr-topic ${t.p >= 75 ? 'is-good' : t.p >= 50 ? 'is-ok' : 'is-weak'}`} style={{ '--i': i }}>
                  <span className="bfr-topic-name">{t.topic}</span>
                  <span className="bfr-bar"><span style={{ width: `${t.p}%` }} /></span>
                  <span className="bfr-topic-n">{t.correct}/{t.total}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Standings (when there was anyone to race) ────────────────── */}
        {board.length > 1 && (
          <section className="bfr-block">
            <h2 className="bfr-h">Final standings</h2>
            <ol className="bfr-board">
              {board.map(p => {
                const b = p.buzz;
                return (
                  <li key={p.username} className={`bfr-row${p.username === username ? ' is-me' : ''}${p.rank === 1 ? ' is-top' : ''}`}>
                    <span className="bfr-rank">{MEDAL[p.rank - 1] || `#${p.rank}`}</span>
                    <span className="bfr-name">
                      {p.username}
                      {p.username === username && <em>you</em>}
                      {p.isBot && <em className="bfr-bot">bot</em>}
                    </span>
                    {b && <span className="bfr-row-acc">{pct(b.correct, total)}%</span>}
                    <span className="bfr-row-score">{p.score.toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {isGuest && (
          <div className="bfr-guest">
            <span>Sign in to keep your Buzz Fun stats and XP.</span>
            <button type="button" onClick={onSignIn}>Sign in</button>
          </div>
        )}

        <nav className="bfr-actions">
          <button type="button" className="bfr-btn bfr-btn--main" onClick={onPlayAgain}>🍯 Play again</button>
          <div className="bfr-actions-row">
            <button type="button" className="bfr-btn" onClick={onOnline}>🌐 Back to Online</button>
            <button type="button" className="bfr-btn" onClick={onHome}>🏠 Home</button>
          </div>
        </nav>
      </main>
    </div>
  );
}
