import { useEffect, useState } from 'react';
import { SERVER_URL } from '../serverUrl';
import MedJinxScene from './MedJinxScene';
import { PixelDoc } from './MedJinxGame';
import './MedJinx.css';

/**
 * The MedJinx front door: where clicking the MedJinx card on the Online page
 * lands. Same room as the game itself, with the ways in laid out on one
 * card — make a room, find one, join by code, or play the bots right now.
 *
 * Everything on it does something or reports something true. The numbers
 * (players online, open rooms, top scores) come from /api/medjinx/home and
 * are refreshed while the page is open; the one thing that is not built yet
 * (Daily Case) is marked as such instead of being a button that goes nowhere.
 *
 * It opens no lobby itself. It calls back into PlayPage, whose lobby overlay
 * then appears on top of this page exactly as it does over the card wall.
 */

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

const NAV = [
  { label: 'Skills', href: '/minigames', icon: 'cap', guest: true },
  { label: 'Progress', href: '/progress', icon: 'cup' },
  { label: 'Quests', href: '/quests', icon: 'shield' },
  { label: 'Reels', href: '/reels', icon: 'film', guest: true },
];

// Four small pixel icons for the bottom row, drawn on a 12x12 grid.
function NavIcon({ kind }) {
  const r = (x, y, w, h, f) => <rect key={`${x}-${y}-${f}`} x={x} y={y} width={w} height={h} fill={f} />;
  const art = {
    cap: [r(1, 4, 10, 2, '#2f6fd6'), r(3, 2, 6, 2, '#3d8bff'), r(3, 6, 6, 3, '#1c4fa8'), r(10, 5, 1, 5, '#f2c84b'), r(9, 9, 3, 2, '#f2c84b')],
    cup: [r(3, 1, 6, 5, '#ffcf3a'), r(1, 2, 2, 3, '#e0a81e'), r(9, 2, 2, 3, '#e0a81e'), r(5, 6, 2, 3, '#e0a81e'), r(3, 9, 6, 2, '#ffcf3a')],
    shield: [r(2, 1, 8, 6, '#6b62cf'), r(3, 7, 6, 2, '#6b62cf'), r(4, 9, 4, 1, '#6b62cf'), r(5, 10, 2, 1, '#6b62cf'), r(5, 3, 2, 5, '#eaf6ff'), r(4, 5, 4, 1, '#eaf6ff')],
    film: [r(1, 2, 10, 8, '#2f6fd6'), r(1, 2, 10, 2, '#12205a'), r(1, 8, 10, 2, '#12205a'), r(2, 2.5, 1, 1, '#fff'), r(5, 2.5, 1, 1, '#fff'), r(8, 2.5, 1, 1, '#fff'), r(2, 8.5, 1, 1, '#fff'), r(5, 8.5, 1, 1, '#fff'), r(8, 8.5, 1, 1, '#fff'), r(5, 4.5, 1, 3, '#fff'), r(6, 5.5, 1, 1, '#fff')],
  }[kind];
  return <svg width="40" height="40" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">{art}</svg>;
}

export default function MedJinxHome({
  user, username, error, busy,
  onBack, onCreate, onFind, onJoin, onQuickPlay,
}) {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => fetch(`${SERVER_URL}/api/medjinx/home`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setStats(d); })
      .catch(() => { /* the page works without the numbers */ });
    load();
    const id = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const join = (e) => {
    e?.preventDefault();
    if (code.trim()) onJoin(code.trim());
  };

  const top = stats?.top || [];
  const nav = NAV.filter(n => user || n.guest);

  return (
    <div className="mjx mjx-home">
      <MedJinxScene />
      <div className="mjx-shade" aria-hidden="true" />

      <div className="mjx-top">
        <button type="button" className="mjx-btn mjx-btn--mini" onClick={onBack}>← All modes</button>
        <span className="mjx-top-actions">
          {user && (
            <>
              <a className="mjx-btn mjx-btn--mini" href="/quests">🏆 Achievements</a>
              <a className="mjx-btn mjx-btn--mini" href="/settings" aria-label="Settings">⚙</a>
            </>
          )}
        </span>
      </div>

      <div className="mjx-home-body">
        {/* ── left: what the game is, and who you are in it ── */}
        <aside className="mjx-home-side mjx-home-side--left">
          <section className="mjx-frame">
            <h2>▶ How to play</h2>
            <ol>
              <li>A condition or a case goes up.</li>
              <li>Type everything that goes with it.</li>
              <li>Rare answers pay more. Shared answers split.</li>
            </ol>
          </section>
          <section className="mjx-frame mjx-frame--doc">
            <h2>Your doctor</h2>
            <PixelDoc seed={username || '?'} size={96} />
          </section>
        </aside>

        {/* ── centre: the wordmark and the ways in ── */}
        <main className="mjx-home-main">
          <h1 className="mjx-wordmark">Med<b>Jinx</b></h1>
          <p className="mjx-tagline">Play. Learn. Excel in Medicine.</p>

          <section className="mjx-panel mjx-door">
            <label className="mjx-door-label" htmlFor="mjx-nick">Your nickname</label>
            <div className="mjx-nick" id="mjx-nick">{username || 'Guest'}</div>

            <div className="mjx-door-row">
              <button type="button" className="mjx-big mjx-big--lime" onClick={onCreate} disabled={busy}>
                Create a room <i aria-hidden="true">+</i>
              </button>
              <button type="button" className="mjx-big mjx-big--blue" onClick={onFind} disabled={busy}>
                <span>Find a room<small>2–20 players{stats ? ` · ${stats.rooms} open` : ''}</small></span>
              </button>
            </div>

            <form className="mjx-door-row mjx-door-row--code" onSubmit={join}>
              <input
                className="mjx-code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="CODE"
                maxLength={8}
                autoComplete="off"
                spellCheck={false}
                aria-label="Room code"
              />
              <button type="submit" className="mjx-big mjx-big--violet" disabled={!code.trim() || busy}>Join</button>
            </form>

            <div className="mjx-door-row">
              <button type="button" className="mjx-big mjx-big--gold" onClick={onQuickPlay} disabled={busy}>
                <span>⚡ Quick play<small>You against the bots, right now</small></span>
              </button>
              <button type="button" className="mjx-big mjx-big--blue" disabled title="Not built yet">
                <span>🎁 Daily case<small>Coming soon</small></span>
              </button>
            </div>

            {error && <p className="mjx-door-error" role="alert">{error}</p>}
          </section>

          <nav className="mjx-home-nav" aria-label="More of MedVale">
            {nav.map(n => (
              <a key={n.label} href={n.href}>
                <NavIcon kind={n.icon} />
                <span>{n.label}</span>
              </a>
            ))}
          </nav>
        </main>

        {/* ── right: who is here, and who is winning ── */}
        <aside className="mjx-home-side mjx-home-side--right">
          <section className="mjx-sign" aria-live="polite">
            <b>{stats ? fmt(stats.online) : '—'}</b>
            <span><i aria-hidden="true" /> {stats?.online === 1 ? 'Player online' : 'Players online'}</span>
          </section>
          <section className="mjx-scroll mjx-home-board">
            <h2>🏆 Top scores</h2>
            {top.length ? (
              <ul>
                {top.map((t, i) => (
                  <li key={t.username}>
                    <em>{i + 1}</em>
                    <span>{t.username}</span>
                    <b>{fmt(t.score)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mjx-home-board-empty">No match has finished yet. The first score on the board is yours to take.</p>
            )}
            <p>Best single-match scores since the server last restarted.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
