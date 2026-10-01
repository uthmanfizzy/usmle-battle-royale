import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clearToken, getCachedUser } from '../auth';
import * as audio from '../audio';
import './SettingsDropdown.css';

/**
 * Settings as a panel under the gear, the way notifications sit under the bell.
 *
 * The things people actually open settings for — sound, music, and the way out
 * — are here and take effect immediately. Everything else (account detail, the
 * toggles that are still coming) stays on the full /settings page, one tap
 * away, rather than being duplicated into a menu this size.
 */
export default function SettingsDropdown({ onClose }) {
  const panelRef = useRef(null);
  const [caretX, setCaretX] = useState(null);
  const user = getCachedUser();

  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('medvale_sound') !== 'false'; } catch { return true; }
  });
  const [musicOn, setMusicOn] = useState(() => {
    try { return localStorage.getItem('medvale_music') !== 'false'; } catch { return true; }
  });

  // Same caret placement as the notifications panel: pointed at whichever
  // button opened it, wherever that button sits at this width.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const btn = panel?.closest('.settings-wrapper, .dn-drop-wrap, .friends-dropdown-wrapper')?.querySelector('button');
    if (!panel || !btn) return;
    const place = () => {
      const b = btn.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      setCaretX(Math.max(18, Math.min(p.width - 18, b.left + b.width / 2 - p.left)));
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  // Escape closes, like every other panel in the header.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleSound = () => {
    setSoundOn(v => {
      const next = !v;
      try { localStorage.setItem('medvale_sound', String(next)); } catch { /* private mode */ }
      return next;
    });
  };
  const toggleMusic = () => {
    setMusicOn(v => {
      const next = !v;
      try { localStorage.setItem('medvale_music', String(next)); } catch { /* private mode */ }
      // Silence whatever is playing right now; the next screen reads the flag.
      if (!next) audio.stopBgMusic?.();
      return next;
    });
  };

  const go = (href) => { onClose?.(); window.location.href = href; };

  const logout = () => {
    if (!window.confirm('Log out of Medvale?')) return;
    clearToken();
    window.location.href = '/';
  };

  return (
    <div className="sd-panel mv-plain" ref={panelRef} role="dialog" aria-label="Settings">
      <span className="sd-caret" style={caretX != null ? { left: caretX } : undefined} aria-hidden="true" />

      <div className="sd-head">
        <h3 className="sd-title">Settings</h3>
        {user?.username && <span className="sd-who">{user.username}</span>}
      </div>

      <div className="sd-group">
        <button type="button" className="sd-row sd-row--toggle" onClick={toggleSound} aria-pressed={soundOn}>
          <span className="sd-ico" aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
          <span className="sd-label">Sound effects</span>
          <span className={`sd-switch${soundOn ? ' is-on' : ''}`} aria-hidden="true"><span /></span>
        </button>
        <button type="button" className="sd-row sd-row--toggle" onClick={toggleMusic} aria-pressed={musicOn}>
          <span className="sd-ico" aria-hidden="true">{musicOn ? '🎵' : '🔕'}</span>
          <span className="sd-label">Background music</span>
          <span className={`sd-switch${musicOn ? ' is-on' : ''}`} aria-hidden="true"><span /></span>
        </button>
      </div>

      <div className="sd-group">
        <button type="button" className="sd-row" onClick={() => go('/stats')}>
          <span className="sd-ico" aria-hidden="true">📈</span>
          <span className="sd-label">My stats</span>
          <span className="sd-chev" aria-hidden="true">›</span>
        </button>
        <button type="button" className="sd-row" onClick={() => go('/activity')}>
          <span className="sd-ico" aria-hidden="true">🗓️</span>
          <span className="sd-label">Daily activity</span>
          <span className="sd-chev" aria-hidden="true">›</span>
        </button>
        <button type="button" className="sd-row" onClick={() => go('/guide')}>
          <span className="sd-ico" aria-hidden="true">📖</span>
          <span className="sd-label">Guide</span>
          <span className="sd-chev" aria-hidden="true">›</span>
        </button>
        <button type="button" className="sd-row" onClick={() => go('/settings')}>
          <span className="sd-ico" aria-hidden="true">⚙️</span>
          <span className="sd-label">All settings</span>
          <span className="sd-chev" aria-hidden="true">›</span>
        </button>
      </div>

      <div className="sd-group">
        <button type="button" className="sd-row sd-row--danger" onClick={logout}>
          <span className="sd-ico" aria-hidden="true">🚪</span>
          <span className="sd-label">Log out</span>
        </button>
      </div>
    </div>
  );
}
