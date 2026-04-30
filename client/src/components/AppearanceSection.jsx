import { useState } from 'react';
import { useTheme, PALETTE } from '../theme';
import './AppearanceSection.css';

// ── Mini preview mockups (CSS-only) ───────────────────────────────────────────

function DefaultPreview({ color }) {
  const c = PALETTE.find(p => p.id === color) || PALETTE[0];
  return (
    <div className="ap-prev ap-prev-default">
      <div className="ap-prev-nav" style={{ borderBottomColor: `${c.hex}44` }}>
        <div className="ap-prev-logo" />
        <div className="ap-prev-btn-sm" style={{ background: c.hex }} />
      </div>
      <div className="ap-prev-body">
        <div className="ap-prev-card">
          <div className="ap-prev-avatar" />
          <div className="ap-prev-lines">
            <div className="ap-prev-line ap-prev-line-lg" style={{ background: `${c.hex}cc` }} />
            <div className="ap-prev-line ap-prev-line-md" />
          </div>
        </div>
        <div className="ap-prev-xpbar">
          <div className="ap-prev-xpfill" style={{ background: `linear-gradient(90deg, ${c.hex}, ${c.light})`, width: '62%' }} />
        </div>
        <div className="ap-prev-stats">
          {[1,2,3].map(i => (
            <div key={i} className="ap-prev-stat">
              <div className="ap-prev-stat-val" style={{ color: c.light }}>—</div>
              <div className="ap-prev-stat-lbl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PixelPreview({ color }) {
  const c = PALETTE.find(p => p.id === color) || PALETTE[0];
  const px = {
    border: `2px solid ${c.hex}`,
    boxShadow: `3px 3px 0 rgba(0,0,0,0.7)`,
    borderRadius: 0,
  };
  return (
    <div className="ap-prev ap-prev-pixel" style={{ borderColor: c.hex }}>
      <div className="ap-prev-nav ap-prev-nav-px" style={{ borderColor: c.hex }}>
        <div className="ap-prev-logo ap-prev-logo-px" style={{ color: c.light }}>MR</div>
        <div className="ap-prev-btn-sm ap-prev-btn-px" style={{ background: c.hex, ...px }} />
      </div>
      <div className="ap-prev-body ap-prev-body-px">
        {/* Pixel grid background lines */}
        <div className="ap-prev-pgrid" style={{ backgroundImage: `linear-gradient(${c.hex}18 1px, transparent 1px), linear-gradient(90deg, ${c.hex}18 1px, transparent 1px)` }} />
        <div className="ap-prev-card ap-prev-card-px" style={{ ...px, borderColor: c.hex }}>
          <div className="ap-prev-avatar ap-prev-avatar-px" style={{ border: `2px solid ${c.hex}` }} />
          <div className="ap-prev-lines">
            <div className="ap-prev-line ap-prev-line-lg ap-prev-line-px" style={{ background: c.hex }} />
            <div className="ap-prev-line ap-prev-line-md ap-prev-line-px" style={{ background: `${c.hex}80` }} />
          </div>
        </div>
        {/* Health bar style */}
        <div className="ap-prev-xpbar ap-prev-xpbar-px" style={{ border: `1px solid ${c.hex}` }}>
          <div className="ap-prev-xpfill ap-prev-xpfill-px" style={{
            width: '62%',
            background: `repeating-linear-gradient(90deg, ${c.hex} 0px, ${c.hex} 6px, rgba(0,0,0,0.4) 6px, rgba(0,0,0,0.4) 8px)`,
          }} />
        </div>
        <div className="ap-prev-scanlines" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AppearanceSection() {
  const { theme, color, applyTheme } = useTheme();
  const [selTheme, setSelTheme] = useState(theme);
  const [selColor, setSelColor] = useState(color);
  const [saved,    setSaved]    = useState(false);

  const dirty = selTheme !== theme || selColor !== color;

  function handleApply() {
    applyTheme(selTheme, selColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Live preview: apply to DOM immediately on selection (reset on cancel)
  function previewTheme(t) {
    setSelTheme(t);
    document.documentElement.dataset.theme = t;
  }
  function previewColor(c) {
    setSelColor(c);
    const p = PALETTE.find(x => x.id === c) || PALETTE[0];
    document.documentElement.style.setProperty('--color-primary',      p.hex);
    document.documentElement.style.setProperty('--color-primary-light', p.light);
    document.documentElement.style.setProperty('--color-primary-dark',  p.dark);
    document.documentElement.style.setProperty('--color-glow',          p.glow);
  }

  return (
    <div className="dash-content ap-content">

      {/* ── Theme chooser ─── */}
      <div className="dash-card ap-card">
        <div className="card-title">Theme</div>

        <div className="ap-themes">
          {/* Default theme card */}
          <button
            className={`ap-theme-card ${selTheme === 'default' ? 'ap-selected' : ''}`}
            onClick={() => previewTheme('default')}
            style={{ '--tc': selColor !== 'purple' ? PALETTE.find(p => p.id === selColor)?.hex : '#7C3AED' }}
          >
            {selTheme === 'default' && <div className="ap-tick">✓</div>}
            <DefaultPreview color={selColor} />
            <div className="ap-theme-name">Default</div>
            <div className="ap-theme-desc">Clean glassmorphism dark UI</div>
          </button>

          {/* Pixel art theme card */}
          <button
            className={`ap-theme-card ${selTheme === 'pixel' ? 'ap-selected' : ''}`}
            onClick={() => previewTheme('pixel')}
            style={{ '--tc': selColor !== 'purple' ? PALETTE.find(p => p.id === selColor)?.hex : '#7C3AED' }}
          >
            {selTheme === 'pixel' && <div className="ap-tick">✓</div>}
            <PixelPreview color={selColor} />
            <div className="ap-theme-name">Pixel Art 🕹️</div>
            <div className="ap-theme-desc">Retro 8-bit RPG style</div>
          </button>
        </div>
      </div>

      {/* ── Colour picker ─── */}
      <div className="dash-card ap-card">
        <div className="card-title">Accent Colour</div>
        <div className="ap-colors">
          {PALETTE.map(p => (
            <button
              key={p.id}
              className={`ap-color-btn ${selColor === p.id ? 'ap-col-selected' : ''}`}
              style={{ '--c': p.hex }}
              onClick={() => previewColor(p.id)}
              title={p.label}
            >
              <div className="ap-swatch" />
              {selColor === p.id && <span className="ap-col-check">✓</span>}
              <span className="ap-col-label">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Save row ─── */}
      <div className="ap-save-row">
        {dirty && (
          <button
            className="btn-secondary ap-reset"
            onClick={() => { previewTheme(theme); previewColor(color); }}
          >
            Reset
          </button>
        )}
        <button className="btn-primary ap-apply" onClick={handleApply}>
          {saved ? '✓ Saved!' : 'Apply Changes'}
        </button>
        {saved && (
          <span className="ap-saved-note">
            Theme saved {typeof navigator !== 'undefined' && navigator.onLine ? '& synced' : 'locally'}
          </span>
        )}
      </div>

    </div>
  );
}
