import { useEffect, useState } from 'react';
import { SERVER_URL } from '../serverUrl';

/**
 * MedJinx's settings, inside the shared lobby panel.
 *
 * It takes the place of the "which questions" section the other modes show:
 * MedJinx has its own bank and none of those choices apply to it. Shown to
 * everyone, editable only by the host — the player who joins should know
 * what kind of match they are walking into.
 *
 * The choices come from the server's catalogue (systems, with how many
 * topics each has) so the list can never offer a system the bank lacks.
 * Reuses the lobby-duel-* classes so it looks like every other lobby.
 */

const VARIANTS = [
  { id: 'mixed', label: 'Mixed', note: 'Open rounds and clinical cases, alternating.' },
  { id: 'open', label: 'Open-Ended Jinx', note: 'You are shown a condition. Name everything that goes with it.' },
  { id: 'clinical', label: 'Clinical Jinx', note: 'You are shown a vignette. Work out what it is, then name what goes with it.' },
];

const LEVELS = [
  { id: 'mixed', label: 'Mixed' },
  { id: 'easy', label: 'Easy' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export default function MedJinxLobby({ isHost, options, onChange }) {
  const [catalog, setCatalog] = useState(null);
  const o = options || { variant: 'mixed', rounds: 5, seconds: 30, difficulty: 'mixed', systems: [], events: true };
  const set = (patch) => onChange?.({ ...o, ...patch });

  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/medjinx/catalog`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setCatalog(d); })
      .catch(() => { /* the match still plays with every system */ });
    return () => { cancelled = true; };
  }, []);

  const systems = catalog?.systems || [];
  const chosen = Array.isArray(o.systems) ? o.systems : [];
  const variant = VARIANTS.find(v => v.id === o.variant) || VARIANTS[0];

  const Choice = ({ value, current, children, onPick }) => (
    <button
      type="button"
      className={`lobby-duel-chip${value === current ? ' is-on' : ''}`}
      aria-pressed={value === current}
      onClick={onPick}
    >{children}</button>
  );

  return (
    <div className="lobby-duel-section">
      <p className="lobby-duel-title">{isHost ? 'MedJinx settings' : 'The host has set'}</p>

      <div className="lobby-duel-row lobby-duel-row--stack">
        <span className="lobby-duel-label">Mode</span>
        {isHost ? (
          <div className="lobby-duel-subjects">
            {VARIANTS.map(v => (
              <Choice key={v.id} value={v.id} current={o.variant} onPick={() => set({ variant: v.id })}>{v.label}</Choice>
            ))}
          </div>
        ) : <span className="lobby-duel-value">{variant.label}</span>}
      </div>

      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Rounds</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            {[3, 5, 7].map(n => <Choice key={n} value={n} current={o.rounds} onPick={() => set({ rounds: n })}>{n}</Choice>)}
          </div>
        ) : <span className="lobby-duel-value">{o.rounds}</span>}
      </div>

      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Clock</span>
        <span className="lobby-duel-value">30 seconds a round</span>
      </div>

      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Difficulty</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            {LEVELS.map(l => <Choice key={l.id} value={l.id} current={o.difficulty} onPick={() => set({ difficulty: l.id })}>{l.label}</Choice>)}
          </div>
        ) : <span className="lobby-duel-value">{(LEVELS.find(l => l.id === o.difficulty) || LEVELS[0]).label}</span>}
      </div>

      <div className="lobby-duel-row lobby-duel-row--stack">
        <span className="lobby-duel-label">Systems</span>
        {isHost ? (
          <div className="lobby-duel-subjects">
            <button
              type="button"
              className={`lobby-duel-chip${!chosen.length ? ' is-on' : ''}`}
              onClick={() => set({ systems: [] })}
            >Everything</button>
            {systems.map((s) => {
              const on = chosen.includes(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  className={`lobby-duel-chip${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => set({ systems: on ? chosen.filter(x => x !== s.name) : [...chosen, s.name] })}
                >{s.name} · {s.count}</button>
              );
            })}
            {!catalog && <span className="lobby-duel-value">Loading systems…</span>}
          </div>
        ) : <span className="lobby-duel-value">{chosen.length ? chosen.join(', ') : 'Every system'}</span>}
      </div>

      <div className="lobby-duel-row">
        <span className="lobby-duel-label">Special rounds</span>
        {isHost ? (
          <div className="lobby-duel-choice">
            <Choice value current={o.events !== false} onPick={() => set({ events: true })}>On</Choice>
            <Choice value={false} current={o.events !== false} onPick={() => set({ events: false })}>Off</Choice>
          </div>
        ) : <span className="lobby-duel-value">{o.events === false ? 'Off' : 'On'}</span>}
      </div>

      <p className="lobby-duel-note">{variant.note}</p>
      <p className="lobby-duel-note">
        Every correct answer is worth its rarity — 1,000 for the obvious up to 8,000 for the obscure — shared
        between everyone who gave it. Nobody sees anyone else&apos;s answers until the round ends.
        {o.events !== false && ' Special rounds (Double Points, Rare Knowledge, Rapid Recall, Reverse Jinx, Streak) drop in along the way, and the last round is a Boss Case.'}
        {catalog && chosen.length > 0 && (() => {
          const have = systems.filter(s => chosen.includes(s.name)).reduce((t, s) => t + s.count, 0);
          return have < o.rounds
            ? ` Those systems have ${have} topic${have === 1 ? '' : 's'} so far; the rest of the rounds are drawn from the other systems.`
            : '';
        })()}
      </p>
    </div>
  );
}
