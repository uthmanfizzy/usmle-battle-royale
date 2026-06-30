import { useState, useEffect } from 'react';
import { isDevModeActive, exitDevMode } from '../devMode';

/**
 * Persistent developer-mode banner. Mounted app-level (main.jsx) so it stays across
 * all site navigation (play, journey, training, dashboard, ...). Renders ONLY when
 * dev mode is active (admin session + dev flag) and NOT on /admin routes (admin has
 * its own chrome). Normal users never see it.
 */
export default function DevModeBanner() {
  const [active, setActive] = useState(() => isDevModeActive());

  // Toggle a body class so pages can offset content under the fixed bar.
  useEffect(() => {
    const onAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const show = active && !onAdmin;
    document.body.classList.toggle('dev-mode-banner-active', show);
    return () => document.body.classList.remove('dev-mode-banner-active');
  }, [active]);

  // Keep in sync if another tab/flow flips dev mode.
  useEffect(() => {
    const sync = () => setActive(isDevModeActive());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const onAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (!active || onAdmin) return null;

  return (
    <div className="dev-mode-banner" role="region" aria-label="Developer mode">
      <span className="dmb-tag">🛠️ Developer Mode</span>
      <span className="dmb-hint">Authoring OFFICIAL highlights — visible to everyone</span>
      <span className="dmb-spacer" />
      <button
        type="button"
        className="dmb-btn dmb-back"
        onClick={() => { window.location.href = '/admin'; }}
      >
        ← Back to Admin
      </button>
      <button
        type="button"
        className="dmb-btn dmb-exit"
        onClick={() => { exitDevMode(); setActive(false); }}
        title="Leave developer mode and browse normally"
      >
        Exit Dev Mode
      </button>
    </div>
  );
}
