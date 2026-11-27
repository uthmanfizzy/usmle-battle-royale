import { useEffect, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import { clueSfx } from '../clueSfx';
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

/** A decorative barcode for the ticket stub (fixed widths, so it never jitters). */
const BARS = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3];
export function Barcode() {
  return (
    <span className="clt-barcode" aria-hidden="true">
      {BARS.map((w, i) => <i key={i} style={{ width: w * 2 }} />)}
    </span>
  );
}

/** The ladder mark beside the title (inline SVG, inherits currentColor). */
export function LadderMark({ size = 56 }) {
  return (
    <svg className="clt-mark" width={size} height={size} viewBox="0 0 56 56" aria-hidden="true">
      <path d="M17 52 L21 6 M39 52 L35 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" fill="none" />
      {[14, 23, 32, 41].map((y, i) => (
        <path key={y} d={`M${20.4 - i * 0.8} ${y} H${35.6 + i * 0.8}`} stroke={i === 0 ? 'var(--cl-red)' : 'currentColor'} strokeWidth="3" />
      ))}
      <circle cx="28" cy="6" r="3.4" fill="var(--cl-red)" />
    </svg>
  );
}

/** The ticket header shared by the front door and the game. */
export function ClueTicket({ kicker = 'PLAY', title = 'CLUE LADDER', tagline, stub, cells }) {
  return (
    <header className="clt-ticket">
      <div className="clt-ticket-main">
        <LadderMark />
        <div className="clt-ticket-words">
          <span className="clt-kicker">{kicker}</span>
          <h1 className="clt-title">{title}</h1>
          {tagline && <p className="clt-tagline">{tagline}</p>}
        </div>
        {stub && (
          <div className="clt-stub">
            <Barcode />
            {stub.map((line, i) => <span key={i}>{line}</span>)}
          </div>
        )}
      </div>
      {cells && (
        <div className="clt-cells">
          {cells.map(([k, v]) => <span key={k}><small>{k}</small> {v}</span>)}
        </div>
      )}
    </header>
  );
}

/** A lettered section bar: [A] TITLE ........ meta */
export function ClueSection({ letter, title, meta }) {
  return (
    <div className="clt-sec">
      <b className="clt-sec-letter">{letter}</b>
      <span className="clt-sec-title">{title}</span>
      {meta && <span className="clt-sec-meta">{meta}</span>}
    </div>
  );
}

const shiftDate = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Toggle one system in a "[] means all" list. */
function toggleIn(list, id, all) {
  const on = list.length ? list : all;
  const next = on.includes(id) ? on.filter(x => x !== id) : [...on, id];
  return next.length === 0 || next.length === all.length ? [] : next;
}

/**
 * The Clue Ladder front door, where its card on the Online page lands.
 * Choose the systems, HY only or every disease, how many cases and how long
 * each lasts, then play alone, against bots, open a room for friends, or join
 * one by code. PlayPage opens the lobby and applies these choices to it.
 */
export default function ClueLadderHome({ username, error, busy, onBack, onCreate, onJoin, onQuickPlay, onSolo }) {
  const catalog = useClueCatalog();
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(90);
  const [systems, setSystems] = useState([]);       // [] = every system
  const [hyOnly, setHyOnly] = useState(true);
  const [code, setCode] = useState('');
  const opts = { systems, count, seconds, hyOnly };
  const counts = catalog?.counts || [5, 10, 15, 20];
  const secs = catalog?.seconds || [60, 90, 120, 180];
  const sys = catalog?.systems || [];
  const picked = systems.length ? sys.filter(s => systems.includes(s.id)) : sys;
  const pool = picked.reduce((n, s) => n + (hyOnly ? (s.hyCases ?? s.cases) : s.cases), 0);
  const isOn = (id) => !systems.length || systems.includes(id);
  const tap = (fn) => () => { clueSfx.tap(); fn(); };

  return (
    <div className="clh">
      <div className="clh-body">
        <div className="clh-top">
          <button type="button" className="cl-link" onClick={onBack}>← All modes</button>
        </div>

        <ClueTicket
          tagline={<>Start <s>vague</s> <b>sharp</b>. Climb to the diagnosis.</>}
          stub={[`${catalog?.clues || 6} CLUES`, `${seconds} SEC EACH`]}
          cells={[['DOC', username || 'Guest'], ['SHIFT', shiftDate()]]}
        />

        <ClueSection letter="A" title="Pick your ward" meta={catalog ? `${pool} cases in play` : 'Loading…'} />
        <div className="clt-list">
          {sys.map(s => (
            <button
              key={s.id}
              type="button"
              className={`clt-row${isOn(s.id) ? ' is-on' : ''}`}
              aria-pressed={isOn(s.id)}
              onClick={tap(() => setSystems(cur => toggleIn(cur, s.id, sys.map(x => x.id))))}
            >
              <span className="clt-row-text">
                <b>{s.icon} {s.name}</b>
                <small>{s.cases} cases · {s.hyCases ?? s.cases} high-yield</small>
              </span>
              <span className="clt-box">{isOn(s.id) ? 'On ✓' : 'Off'}</span>
            </button>
          ))}
          {!catalog && <p className="clt-row clt-row--empty">Loading the case files…</p>}
        </div>
        <div className="clt-toggle" role="group" aria-label="Which diseases">
          <button type="button" className={hyOnly ? 'is-on' : ''} aria-pressed={hyOnly} onClick={tap(() => setHyOnly(true))}>
            <b>HY only</b><small>The diseases the USMLE loves</small>
          </button>
          <button type="button" className={!hyOnly ? 'is-on' : ''} aria-pressed={!hyOnly} onClick={tap(() => setHyOnly(false))}>
            <b>Every disease</b><small>Low-yield zebras too</small>
          </button>
        </div>

        <ClueSection letter="B" title="Shift length" />
        <div className="clt-panel clt-grid2">
          <div className="clt-field">
            <span className="clt-label">Cases</span>
            <div className="clt-chips">
              {counts.map(n => (
                <button key={n} type="button" className={`clt-chip${count === n ? ' is-on' : ''}`} aria-pressed={count === n} onClick={tap(() => setCount(n))}>{n}</button>
              ))}
            </div>
          </div>
          <div className="clt-field">
            <span className="clt-label">Seconds a case</span>
            <div className="clt-chips">
              {secs.map(n => (
                <button key={n} type="button" className={`clt-chip${seconds === n ? ' is-on' : ''}`} aria-pressed={seconds === n} onClick={tap(() => setSeconds(n))}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        <ClueSection letter="C" title="Clock in" />
        <div className="clt-list">
          <button type="button" className="clt-row is-on" disabled={busy} onClick={tap(() => onQuickPlay(opts))}>
            <span className="clt-row-text"><b>Quick play</b><small>You against two bots, right now</small></span>
            <span className="clt-box">Play →</span>
          </button>
          <button type="button" className="clt-row" disabled={busy} onClick={tap(() => onCreate(opts))}>
            <span className="clt-row-text"><b>Create a room</b><small>Invite friends with a code</small></span>
            <span className="clt-box">Create →</span>
          </button>
          <button type="button" className="clt-row" disabled={busy} onClick={tap(() => onSolo(opts))}>
            <span className="clt-row-text"><b>Solo</b><small>Just you, beat your own count</small></span>
            <span className="clt-box">Start →</span>
          </button>
        </div>
        <form className="clt-join" onSubmit={(e) => { e.preventDefault(); if (code.trim()) onJoin(code.trim()); }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="ROOM CODE"
            maxLength={8}
            aria-label="Room code"
            autoComplete="off"
          />
          <button type="submit" className="clt-cta" disabled={!code.trim() || busy}><span>Join room</span><i aria-hidden="true">→</i></button>
        </form>
        {error && <p className="clh-err" role="alert">{error}</p>}

        <details className="clt-how">
          <summary>How to play →</summary>
          <ol>
            <li>Everyone gets the same first clue, a brief and vague history.</li>
            <li>Type a diagnosis. Wrong? You get the next, sharper clue. {catalog?.clues || 6} clues per case.</li>
            <li>Stuck? Tear off the next clue without guessing. It still costs an attempt.</li>
            <li>Solved on your 2nd try = 2 attempts. Not solved = 7. Fewest attempts wins.</li>
          </ol>
        </details>
      </div>
    </div>
  );
}

/** The host's settings inside the shared lobby panel (lobby-duel-* look). */
export function ClueLadderLobby({ isHost, options, onChange }) {
  const catalog = useClueCatalog();
  const o = { systems: [], count: 10, seconds: 90, hyOnly: true, ...(options || {}) };
  const set = (patch) => onChange?.({ ...o, ...patch });
  const counts = catalog?.counts || [5, 10, 15, 20];
  const secs = catalog?.seconds || [60, 90, 120, 180];
  const sys = catalog?.systems || [];
  const allIds = sys.map(s => s.id);
  const sysLabel = (o.systems.length ? sys.filter(s => o.systems.includes(s.id)) : sys)
    .map(s => `${s.icon} ${s.name}`).join(', ') || 'Every system';
  return (
    <div className="lobby-duel-section">
      <p className="lobby-duel-title">{isHost ? 'Clue Ladder settings' : 'The host has set'}</p>
      <div className="lobby-duel-row">
        <span className="lobby-duel-label">System</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            {sys.map(s => {
              const on = !o.systems.length || o.systems.includes(s.id);
              return (
                <button key={s.id} type="button" className={`lobby-duel-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => set({ systems: toggleIn(o.systems, s.id, allIds) })}>{s.icon} {s.name}</button>
              );
            })}
          </div>
        ) : <span className="lobby-duel-value">{sysLabel}</span>}
      </div>
      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Diseases</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            <button type="button" className={`lobby-duel-chip${o.hyOnly ? ' is-on' : ''}`} aria-pressed={o.hyOnly} onClick={() => set({ hyOnly: true })}>HY only</button>
            <button type="button" className={`lobby-duel-chip${!o.hyOnly ? ' is-on' : ''}`} aria-pressed={!o.hyOnly} onClick={() => set({ hyOnly: false })}>Every disease</button>
          </div>
        ) : <span className="lobby-duel-value">{o.hyOnly ? 'HY only' : 'Every disease'}</span>}
      </div>
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
      <p className="lobby-duel-note">
        Each case starts vague and gets sharper with every wrong guess. Six clues, six attempts.
        Fewest total attempts wins; an unsolved case counts as 7.
      </p>
    </div>
  );
}
