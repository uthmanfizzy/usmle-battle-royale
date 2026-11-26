import { useEffect, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import './ClueLadder.css';

/** The systems and lobby choices, from the server. */
export function useClueCatalog() {
  const [catalog, setCatalog] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/clue-ladder/catalog`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setCatalog(d); })
      .catch(() => { if (!cancelled) setCatalog({ systems: [], counts: [5, 10, 15, 20], seconds: [60, 90, 120, 180], clues: 6, total: 0 }); });
    return () => { cancelled = true; };
  }, []);
  return catalog;
}

/**
 * The Clue Ladder front door, where its card on the Online page lands.
 * Choose how many cases and how long each lasts, then play alone, against
 * bots, open a room for friends, or join one by code. PlayPage opens the
 * lobby and applies these choices to it.
 */
export default function ClueLadderHome({ username, error, busy, onBack, onCreate, onJoin, onQuickPlay, onSolo }) {
  const catalog = useClueCatalog();
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(90);
  const [code, setCode] = useState('');
  const opts = { systems: [], count, seconds };
  const counts = catalog?.counts || [5, 10, 15, 20];
  const secs = catalog?.seconds || [60, 90, 120, 180];
  const sys = catalog?.systems || [];

  return (
    <div className="clh">
      <div className="cl-bg" aria-hidden="true" />
      <div className="clh-body">
        <div className="clh-top">
          <button type="button" className="cl-btn cl-btn--mini" onClick={onBack}>← All modes</button>
          <span>Playing as <b>{username || 'Guest'}</b></span>
        </div>

        <header className="clh-hero">
          <span className="clh-logo" aria-hidden="true">🪜</span>
          <h1>CLUE LADDER</h1>
          <p>A case starts vague. Every wrong guess unlocks a sharper clue. Name the disease in the fewest attempts to win.</p>
        </header>

        <section className="clh-card">
          <h2>How it works</h2>
          <ol className="clh-how">
            <li>Everyone gets the same first clue, a brief and vague history.</li>
            <li>Type a diagnosis. Wrong? You get the next clue. There are {catalog?.clues || 6} clues per case.</li>
            <li>Stuck? Take the next clue without guessing. It still costs an attempt.</li>
            <li>Solved on your 2nd try = 2 attempts. Not solved = 7. Fewest attempts wins.</li>
          </ol>
        </section>

        <section className="clh-card">
          <h2>System</h2>
          <p className="clh-sub">More systems are on the way.</p>
          <div className="clh-chips">
            {sys.map(s => (
              <span key={s.id} className="clh-chip is-on">{s.icon} {s.name} · {s.cases} cases</span>
            ))}
            {!catalog && <span className="clh-sub">Loading…</span>}
          </div>
        </section>

        <section className="clh-card">
          <h2>Cases per match</h2>
          <div className="clh-chips">
            {counts.map(n => (
              <button key={n} type="button" className={`clh-chip${count === n ? ' is-on' : ''}`} aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
          <h2 style={{ marginTop: 16 }}>Time per case</h2>
          <div className="clh-chips">
            {secs.map(n => (
              <button key={n} type="button" className={`clh-chip${seconds === n ? ' is-on' : ''}`} aria-pressed={seconds === n} onClick={() => setSeconds(n)}>{n}s</button>
            ))}
          </div>
        </section>

        <section className="clh-card">
          <h2>Play</h2>
          <div className="clh-play">
            <button type="button" className="clh-big clh-big--main" disabled={busy} onClick={() => onCreate(opts)}>
              <b>➕ Create a room</b><small>Invite friends with a code</small>
            </button>
            <button type="button" className="clh-big" disabled={busy} onClick={() => onQuickPlay(opts)}>
              <b>⚡ Quick play</b><small>You against two bots, now</small>
            </button>
            <button type="button" className="clh-big" disabled={busy} onClick={() => onSolo(opts)}>
              <b>🎯 Solo</b><small>Just you, beat your own count</small>
            </button>
          </div>
          <form className="clh-join" onSubmit={(e) => { e.preventDefault(); if (code.trim()) onJoin(code.trim()); }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Room code"
              maxLength={8}
              aria-label="Room code"
              autoComplete="off"
            />
            <button type="submit" className="cl-btn cl-btn--go" disabled={!code.trim() || busy}>Join</button>
          </form>
          {error && <p className="clh-err" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  );
}

/** The host's settings inside the shared lobby panel (lobby-duel-* look). */
export function ClueLadderLobby({ isHost, options, onChange }) {
  const catalog = useClueCatalog();
  const o = options || { systems: [], count: 10, seconds: 90 };
  const set = (patch) => onChange?.({ ...o, ...patch });
  const counts = catalog?.counts || [5, 10, 15, 20];
  const secs = catalog?.seconds || [60, 90, 120, 180];
  return (
    <div className="lobby-duel-section">
      <p className="lobby-duel-title">{isHost ? 'Clue Ladder settings' : 'The host has set'}</p>
      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Cases</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            {counts.map(n => (
              <button key={n} type="button" className={`lobby-duel-chip${o.count === n ? ' is-on' : ''}`} aria-pressed={o.count === n} onClick={() => set({ count: n })}>{n}</button>
            ))}
          </div>
        ) : <span className="lobby-duel-value">{o.count} cases</span>}
      </div>
      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Time</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            {secs.map(n => (
              <button key={n} type="button" className={`lobby-duel-chip${o.seconds === n ? ' is-on' : ''}`} aria-pressed={o.seconds === n} onClick={() => set({ seconds: n })}>{n}s</button>
            ))}
          </div>
        ) : <span className="lobby-duel-value">{o.seconds}s a case</span>}
      </div>
      <div className="lobby-duel-row">
        <span className="lobby-duel-label">System</span>
        <span className="lobby-duel-value">👶 Reproductive</span>
      </div>
      <p className="lobby-duel-note">
        Each case starts vague and gets sharper with every wrong guess. Six clues, six attempts.
        Fewest total attempts wins; an unsolved case counts as 7.
      </p>
    </div>
  );
}
