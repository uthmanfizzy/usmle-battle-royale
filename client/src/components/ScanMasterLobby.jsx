import { useEffect, useState } from 'react';
import { SERVER_URL } from '../serverUrl';

/**
 * Scan Master's settings inside the shared lobby panel: which systems the
 * pictures come from and how many questions the match runs. Shown to
 * everyone, editable only by the host. Systems with no pictures yet are
 * shown but cannot be picked, so the host can see what is coming.
 * Reuses the lobby-duel-* classes so it looks like every other lobby.
 */
export function useScanCatalog() {
  const [catalog, setCatalog] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/scan-master/catalog`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setCatalog(d); })
      .catch(() => { if (!cancelled) setCatalog({ ready: false, total: 0, systems: [], counts: [5, 10, 15, 20, 30] }); });
    return () => { cancelled = true; };
  }, []);
  return catalog;
}

export default function ScanMasterLobby({ isHost, options, onChange }) {
  const catalog = useScanCatalog();
  const o = options || { systems: [], count: 10 };
  const set = (patch) => onChange?.({ ...o, ...patch });
  const systems = catalog?.systems || [];
  const chosen = Array.isArray(o.systems) ? o.systems : [];
  const counts = catalog?.counts || [5, 10, 15, 20, 30];
  const available = chosen.length
    ? systems.filter(s => chosen.includes(s.id)).reduce((t, s) => t + s.count, 0)
    : (catalog?.total || 0);

  return (
    <div className="lobby-duel-section">
      <p className="lobby-duel-title">{isHost ? 'Scan Master settings' : 'The host has set'}</p>

      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Questions</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            {counts.map(n => (
              <button
                key={n}
                type="button"
                className={`lobby-duel-chip${o.count === n ? ' is-on' : ''}`}
                aria-pressed={o.count === n}
                onClick={() => set({ count: n })}
              >{n}</button>
            ))}
          </div>
        ) : <span className="lobby-duel-value">{o.count} images</span>}
      </div>

      <div className="lobby-duel-row lobby-duel-row--stack">
        <span className="lobby-duel-label">Systems</span>
        {isHost ? (
          <div className="lobby-duel-subjects">
            <button
              type="button"
              className={`lobby-duel-chip${!chosen.length ? ' is-on' : ''}`}
              onClick={() => set({ systems: [] })}
            >All systems</button>
            {systems.map((s) => {
              const on = chosen.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`lobby-duel-chip${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  disabled={!s.count && !on}
                  title={s.count ? `${s.count} image${s.count === 1 ? '' : 's'}` : 'No images in this system yet'}
                  onClick={() => set({ systems: on ? chosen.filter(x => x !== s.id) : [...chosen, s.id] })}
                >{s.icon} {s.name} · {s.count}</button>
              );
            })}
            {!catalog && <span className="lobby-duel-value">Loading systems…</span>}
          </div>
        ) : (
          <span className="lobby-duel-value">
            {chosen.length ? systems.filter(s => chosen.includes(s.id)).map(s => s.name).join(', ') || chosen.join(', ') : 'All systems'}
          </span>
        )}
      </div>

      <p className="lobby-duel-note">
        Everyone sees the same image and the same four options. Lock in once — a right answer is worth
        100 points plus up to 100 for speed, and a run of right answers adds a streak bonus.
        {catalog && available < o.count && available > 0 && ` Only ${available} image${available === 1 ? ' is' : 's are'} available for that choice, so the match will be ${available} long.`}
        {catalog && available === 0 && ' There are no images for that choice yet — add some in Admin → Scan Master.'}
      </p>
    </div>
  );
}
