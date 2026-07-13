import { useState, useEffect } from 'react';
import { useTheme, PALETTE } from '../theme';
import { DefaultPreview, PixelPreview } from './AppearanceSection';

export default function SettingsDropdown({ user, onClose, onLogout }) {
  const { theme, color, study, applyTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSound = localStorage.getItem('medvale_sound') !== 'false';
    const savedMusic = localStorage.getItem('medvale_music') !== 'false';
    setSoundEnabled(savedSound);
    setMusicEnabled(savedMusic);
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

  const settingToggle = (label, value, onChange) => (
    <div className="settings-row">
      <span className="settings-row-label">{label}</span>
      <div
        className={`settings-toggle ${value ? 'settings-toggle--on' : 'settings-toggle--off'}`}
        onClick={onChange}
      >
        <div className="settings-toggle-knob" />
      </div>
    </div>
  );

  return (
    <div className="dropdown-panel dropdown-panel--settings">
      <div className="dropdown-panel-header">
        <h3 className="dropdown-panel-title">⚙️ Settings</h3>
        <button className="dropdown-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="dropdown-panel-content">

        <div className="settings-section">
          <p className="settings-section-label">APPEARANCE</p>

          <div className="settings-themes">
            {[
              { id: 'default', name: 'Default', Preview: DefaultPreview },
              { id: 'pixel',   name: 'Pixel Art', Preview: PixelPreview  },
            ].map(({ id, name, Preview }) => (
              <button
                key={id}
                className={`settings-theme-card ${theme === id ? 'settings-theme-card--active' : ''}`}
                onClick={() => applyTheme(id, color)}
              >
                {theme === id && <div className="settings-theme-check">✓</div>}
                <Preview color={color} />
                <div className="settings-theme-name">{name}</div>
              </button>
            ))}
          </div>

          <div className="settings-colors">
            {PALETTE.map(p => (
              <button
                key={p.id}
                className={`settings-color-dot ${color === p.id ? 'settings-color-dot--active' : ''}`}
                style={{ '--c': p.hex }}
                onClick={() => applyTheme(theme, p.id)}
                title={p.label}
              >
                <div className="settings-color-inner" />
              </button>
            ))}
          </div>

          {settingToggle('Study Mode (light answers)', study, () => applyTheme(theme, color, !study))}
        </div>

        <div className="settings-section">
          <p className="settings-section-label">AUDIO</p>
          {settingToggle('Sound Effects', soundEnabled, toggleSound)}
          {settingToggle('Background Music', musicEnabled, toggleMusic)}
        </div>

        <div className="settings-section">
          <p className="settings-section-label">ACCOUNT</p>
          <div className="settings-row">
            <span className="settings-row-label">{user?.username || 'Player'}</span>
            <span className="settings-row-value">Level {user?.level || 1}</span>
          </div>
          <button
            className="settings-link-btn"
            onClick={() => { window.location.href = '/guide'; }}
          >
            📖 View Guide
          </button>
          <button
            className="settings-danger-btn"
            onClick={() => {
              if(window.confirm('Sign out?')) {
                onClose();
                if (onLogout) onLogout();
              }
            }}
          >
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
