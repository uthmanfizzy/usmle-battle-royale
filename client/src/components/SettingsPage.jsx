import { useState, useEffect } from 'react';
import { getToken, clearToken, fetchMe, getCachedUser } from '../auth';
import { useTheme, PALETTE } from '../theme';
import { DefaultPreview, PixelPreview } from './AppearanceSection';
import './SettingsPage.css';

// Mockup-style toggle switch: red track when on, white knob, knob-right
// when active. Disabled = coming-soon rows (no backend exists for them).
function Toggle({ on, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      className={`stg-toggle${on ? ' stg-toggle--on' : ''}`}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
    >
      <span className="stg-toggle-knob" />
    </button>
  );
}

// Standalone Settings page (Phase D) — promoted from the header gear's
// SettingsDropdown. Same immediate-apply behavior as the dropdown: theme/
// color/study call applyTheme() directly, audio toggles write localStorage
// in the click handler. No Save button (matching both the mockup and the
// dropdown's convention). Notifications/Gameplay are visual-only
// coming-soon sections: no notification-preference or gameplay backend
// exists, so their toggles are disabled.
export default function SettingsPage() {
  const [user, setUser] = useState(getCachedUser);
  const { theme, color, study, applyTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('medvale_sound') !== 'false');
  const [musicEnabled, setMusicEnabled] = useState(() => localStorage.getItem('medvale_music') !== 'false');

  // Same own-identity guard /progress uses: no token → back to landing.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => { if (me) setUser(me); });
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('medvale_sound', newValue);
  };

  const toggleMusic = () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    localStorage.setItem('medvale_music', newValue);
  };

  function handleLogout() {
    if (!window.confirm('Sign out?')) return;
    clearToken();
    window.location.href = '/';
  }

  return (
    <div className="stg">
      {/* Top bar: wordmark + avatar only — the mockup's Settings chrome has
          no coin/gem pills */}
      <div className="stg-topbar">
        <a className="stg-wordmark" href="/dashboard">MEDVALE</a>
        <div className="stg-avatar" title={user?.username || 'Player'}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
            : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
        </div>
      </div>

      <button
        type="button"
        className="stg-back"
        onClick={() => { window.location.href = '/dashboard'; }}
      >
        ← Back to Dashboard
      </button>

      <div className="stg-col">
        <h1 className="stg-title">Settings</h1>

        {/* ── 1. Account ── */}
        <h2 className="stg-section-head">Account</h2>
        <div className="stg-card">
          <div className="stg-row">
            <span className="stg-row-label">Username</span>
            <span className="stg-row-value">{user?.username || 'Player'}</span>
          </div>
          <div className="stg-row">
            <span className="stg-row-label">Level</span>
            <span className="stg-row-value">Level {user?.level || 1}</span>
          </div>
          <div className="stg-row">
            <span className="stg-row-label">Signed in with</span>
            <span className="stg-row-value">Google</span>
          </div>
          <div className="stg-row">
            <span className="stg-row-label">Guide</span>
            <a className="stg-link" href="/guide">📖 View Guide</a>
          </div>
          <div className="stg-row">
            <span className="stg-row-label">Session</span>
            <button type="button" className="stg-link stg-link--logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        {/* ── 2. Audio (real: same localStorage booleans the dropdown used) ── */}
        <h2 className="stg-section-head">Audio</h2>
        <div className="stg-card">
          <div className="stg-row">
            <span className="stg-row-label">Sound Effects</span>
            <Toggle on={soundEnabled} onChange={toggleSound} label="Sound Effects" />
          </div>
          <div className="stg-row">
            <span className="stg-row-label">Background Music</span>
            <Toggle on={musicEnabled} onChange={toggleMusic} label="Background Music" />
          </div>
        </div>

        {/* ── 3. Notifications (visual only — no backend, disabled) ── */}
        <h2 className="stg-section-head">
          Notifications <span className="stg-soon-chip">COMING SOON</span>
        </h2>
        <div className="stg-card stg-card--soon" aria-disabled="true">
          {['Clan Alerts', 'Event Reminders', 'Friend Requests'].map(label => (
            <div className="stg-row" key={label}>
              <span className="stg-row-label">{label}</span>
              <Toggle on={false} disabled label={label} />
            </div>
          ))}
        </div>

        {/* ── 4. Gameplay (visual only — no backend, disabled) ── */}
        <h2 className="stg-section-head">
          Gameplay <span className="stg-soon-chip">COMING SOON</span>
        </h2>
        <div className="stg-card stg-card--soon" aria-disabled="true">
          {['Show Damage Numbers', 'Auto-Equip Best Gear'].map(label => (
            <div className="stg-row" key={label}>
              <span className="stg-row-label">{label}</span>
              <Toggle on={false} disabled label={label} />
            </div>
          ))}
        </div>

        {/* ── 5. Appearance (real; ported from SettingsDropdown, same
               immediate applyTheme() behavior, no Save button) ── */}
        <h2 className="stg-section-head">Appearance</h2>
        <div className="stg-card stg-card--appearance">
          <div className="stg-themes">
            {[
              { id: 'default', name: 'Default', Preview: DefaultPreview },
              { id: 'pixel',   name: 'Pixel Art', Preview: PixelPreview  },
            ].map(({ id, name, Preview }) => (
              <button
                key={id}
                type="button"
                className={`stg-theme-card${theme === id ? ' stg-theme-card--active' : ''}`}
                onClick={() => applyTheme(id, color)}
              >
                {theme === id && <div className="stg-theme-check">✓</div>}
                <Preview color={color} />
                <div className="stg-theme-name">{name}</div>
              </button>
            ))}
          </div>

          <div className="stg-colors">
            {PALETTE.map(p => (
              <button
                key={p.id}
                type="button"
                className={`stg-color-dot${color === p.id ? ' stg-color-dot--active' : ''}`}
                style={{ '--c': p.hex }}
                onClick={() => applyTheme(theme, p.id)}
                title={p.label}
              >
                <span className="stg-color-inner" />
              </button>
            ))}
          </div>

          <div className="stg-row stg-row--last">
            <span className="stg-row-label">Study Mode (light answers)</span>
            <Toggle on={study} onChange={() => applyTheme(theme, color, !study)} label="Study Mode" />
          </div>
        </div>

        <div className="stg-footer-space" />
      </div>
    </div>
  );
}
