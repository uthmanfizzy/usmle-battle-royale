import { useEffect, useState } from 'react';
import { sfxEnabled, setSfxEnabled, onSfxChange, sfx } from '../minigameSfx';

/**
 * The minigames' sound switch. One shared preference, so turning it off in
 * the ECG Reader keeps the ABG Reader and Muscle Mapper quiet too.
 */
export default function SfxToggle({ className = '' }) {
  const [on, setOn] = useState(sfxEnabled);
  useEffect(() => onSfxChange(setOn), []);
  return (
    <button
      type="button"
      className={`sfx-toggle${on ? ' is-on' : ''} ${className}`}
      aria-pressed={on}
      title={on ? 'Sound effects on' : 'Sound effects off'}
      onClick={() => {
        const next = !on;
        setSfxEnabled(next);
        if (next) sfx.select();   // so turning it on proves it works
      }}
    >
      <span aria-hidden="true">{on ? '🔊' : '🔇'}</span>
      <span className="sfx-toggle-t">{on ? 'Sound' : 'Muted'}</span>
    </button>
  );
}
