import { useState } from 'react';
import { useScanCatalog } from './ScanMasterLobby';
import './ScanMaster.css';

/**
 * The Scan Master front door: where clicking its card on the Online page
 * lands. Choose the systems and how many images, then play alone, open a
 * room for friends, join one by code, or take on the bots straight away.
 *
 * The systems list comes from the server's catalogue, with how many images
 * each system has — an empty system is shown but cannot be picked.
 * It opens no lobby itself: PlayPage does, and applies the choices made here
 * to the room it creates.
 */
export default function ScanMasterHome({ username, error, busy, onBack, onSolo, onCreate, onJoin, onQuickPlay }) {
  const catalog = useScanCatalog();
  const [systems, setSystems] = useState([]);
  const [count, setCount] = useState(10);
  const [code, setCode] = useState('');

  const list = catalog?.systems || [];
  const counts = catalog?.counts || [5, 10, 15, 20, 30];
  const available = systems.length
    ? list.filter(s => systems.includes(s.id)).reduce((t, s) => t + s.count, 0)
    : (catalog?.total || 0);
  const opts = { systems, count };
  const none = catalog && available === 0;

  const toggle = (id) => setSystems(cur => (cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]));

  return (
    <div className="smg smh">
      <div className="smg-bg" aria-hidden="true" />
      <div className="smh-body">
        <div className="smh-top">
          <button type="button" className="smg-btn smg-btn--mini" onClick={onBack}>← All modes</button>
          <span className="smg-note">Playing as <b>{username || 'Guest'}</b></span>
        </div>

        <header className="smh-hero">
          <span className="smh-logo" aria-hidden="true">🔬</span>
          <h1 className="smh-title">SCAN MASTER</h1>
          <p className="smh-tag">High-yield images. Read the film, pick the answer, beat the clock.</p>
        </header>

        <section className="smh-card">
          <h2>1 · Systems</h2>
          <p className="smh-sub">Pick one or more, or leave it on All systems.</p>
          <div className="smh-systems">
            <button
              type="button"
              className={`smh-sys${!systems.length ? ' is-on' : ''}`}
              onClick={() => setSystems([])}
            >
              <span aria-hidden="true">🩺</span><span>All systems</span><small>{catalog ? catalog.total : '…'}</small>
            </button>
            {list.map(s => (
              <button
                key={s.id}
                type="button"
                className={`smh-sys${systems.includes(s.id) ? ' is-on' : ''}`}
                aria-pressed={systems.includes(s.id)}
                disabled={!s.count && !systems.includes(s.id)}
                title={s.count ? `${s.count} image${s.count === 1 ? '' : 's'}` : 'No images yet'}
                onClick={() => toggle(s.id)}
              >
                <span aria-hidden="true">{s.icon}</span><span>{s.name}</span><small>{s.count}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="smh-card">
          <h2>2 · How many images</h2>
          <p className="smh-sub">For a multiplayer room this is the match length; you can still change it in the lobby.</p>
          <div className="smh-counts">
            {counts.map(n => (
              <button key={n} type="button" className={`smh-count${count === n ? ' is-on' : ''}`} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </section>

        <section className="smh-card">
          <h2>3 · Play</h2>
          {catalog && !catalog.ready && (
            <p className="smh-warn">The image bank has not been set up yet. Run scan-master-migration.sql in Supabase, then add images in Admin → Scan Master.</p>
          )}
          {catalog && catalog.ready && none && (
            <p className="smh-warn">There are no images for this choice yet. Add some in Admin → Scan Master.</p>
          )}
          {catalog && available > 0 && available < count && (
            <p className="smh-sub">Only {available} image{available === 1 ? ' is' : 's are'} available, so a run will be {available} long.</p>
          )}
          <div className="smh-play">
            <button type="button" className="smh-big smh-big--solo" disabled={none || busy} onClick={() => onSolo(opts)}>
              <b>🎯 Solo practice</b><small>Just you, at your own pace</small>
            </button>
            <button type="button" className="smh-big" disabled={none || busy} onClick={() => onCreate(opts)}>
              <b>➕ Create a room</b><small>Invite friends with a code</small>
            </button>
            <button type="button" className="smh-big" disabled={none || busy} onClick={() => onQuickPlay(opts)}>
              <b>⚡ Quick play</b><small>You against two bots, right now</small>
            </button>
          </div>
          <form
            className="smh-join"
            style={{ marginTop: 10 }}
            onSubmit={(e) => { e.preventDefault(); if (code.trim()) onJoin(code.trim()); }}
          >
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Room code"
              maxLength={8}
              aria-label="Room code"
              autoComplete="off"
            />
            <button type="submit" className="smg-btn smg-btn--go" disabled={!code.trim() || busy}>Join</button>
          </form>
          {error && <p className="smh-err" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  );
}
