import { createContext, useContext, useState, useEffect } from 'react';
import { authFetch, getToken } from './auth';

// ── Colour palette ─────────────────────────────────────────────────────────────

export const PALETTE = [
  { id: 'purple', label: 'Royal Purple',  emoji: '🟣', hex: '#7C3AED', light: '#9D5CF5', dark: '#5B21B6', glow: 'rgba(124,58,237,0.35)' },
  { id: 'blue',   label: 'Ocean Blue',    emoji: '🔵', hex: '#2563EB', light: '#60A5FA', dark: '#1D4ED8', glow: 'rgba(37,99,235,0.35)'   },
  { id: 'green',  label: 'Matrix Green',  emoji: '🟢', hex: '#16A34A', light: '#4ADE80', dark: '#15803D', glow: 'rgba(22,163,74,0.35)'   },
  { id: 'red',    label: 'Crimson Red',   emoji: '🔴', hex: '#DC2626', light: '#F87171', dark: '#B91C1C', glow: 'rgba(220,38,38,0.35)'   },
  { id: 'orange', label: 'Sunset Orange', emoji: '🟠', hex: '#EA580C', light: '#FB923C', dark: '#C2410C', glow: 'rgba(234,88,12,0.35)'   },
  { id: 'pink',   label: 'Hot Pink',      emoji: '🩷', hex: '#DB2777', light: '#F472B6', dark: '#BE185D', glow: 'rgba(219,39,119,0.35)'  },
  { id: 'cyan',   label: 'Cyber Cyan',    emoji: '🩵', hex: '#0891B2', light: '#22D3EE', dark: '#0E7490', glow: 'rgba(8,145,178,0.35)'   },
  { id: 'yellow', label: 'Golden Yellow', emoji: '🟡', hex: '#D97706', light: '#FCD34D', dark: '#B45309', glow: 'rgba(217,119,6,0.35)'   },
];

// ── Pixel click sound ──────────────────────────────────────────────────────────

let _actx = null;
function playPixelClick() {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = _actx.createOscillator();
    const gain = _actx.createGain();
    osc.connect(gain); gain.connect(_actx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, _actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, _actx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.07, _actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, _actx.currentTime + 0.09);
    osc.start(_actx.currentTime);
    osc.stop(_actx.currentTime + 0.1);
  } catch {}
}

function handlePixelClick(e) {
  if (e.target.closest('button')) playPixelClick();
}

// ── DOM applier ────────────────────────────────────────────────────────────────

function applyToDOM(theme, colorId) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.color = colorId;
  const c = PALETTE.find(p => p.id === colorId) || PALETTE[0];
  root.style.setProperty('--color-primary',      c.hex);
  root.style.setProperty('--color-primary-light', c.light);
  root.style.setProperty('--color-primary-dark',  c.dark);
  root.style.setProperty('--color-glow',          c.glow);
}

// ── Context ────────────────────────────────────────────────────────────────────

const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('mr_theme') || 'default');
  const [color, setColor] = useState(() => localStorage.getItem('mr_color') || 'purple');

  // Apply on mount + whenever they change
  useEffect(() => {
    applyToDOM(theme, color);
  }, [theme, color]);

  // Pixel click sound listener
  useEffect(() => {
    if (theme === 'pixel') {
      document.addEventListener('click', handlePixelClick, true);
    } else {
      document.removeEventListener('click', handlePixelClick, true);
    }
    return () => document.removeEventListener('click', handlePixelClick, true);
  }, [theme]);

  function applyTheme(newTheme, newColor) {
    setTheme(newTheme);
    setColor(newColor);
    localStorage.setItem('mr_theme', newTheme);
    localStorage.setItem('mr_color', newColor);
    // Best-effort server save — silently ignored if endpoint not yet live
    if (getToken()) {
      authFetch('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({ theme: newTheme, color: newColor }),
      }).catch(() => {});
    }
  }

  return (
    <ThemeCtx.Provider value={{ theme, color, applyTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
