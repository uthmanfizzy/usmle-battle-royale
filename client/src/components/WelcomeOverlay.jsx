import { useEffect, useRef } from 'react';
import './WelcomeOverlay.css';

/**
 * "Welcome to MEDVALE" portal overlay.
 *
 * Shown only AFTER authentication has actually succeeded — never on the
 * "Continue with Google" click. Greeting someone before they've been handed
 * off to an external domain would be a lie whenever they cancel or fail at
 * Google's consent screen; the mockup only gets away with it because it's a
 * static prototype with no real auth behind it.
 *
 * @param username  Real username. Omit/empty when none exists yet (a brand-new
 *                  Google account that still has to pick one) — the copy falls
 *                  back to "Your saga begins." rather than rendering a blank
 *                  or "undefined" name.
 * @param duration  How long to hold before onDone fires. Default matches the
 *                  mockup's 1.8s.
 * @param onDone    Called once when the hold elapses. Callers navigate here.
 */
export default function WelcomeOverlay({ username, duration = 1800, onDone }) {
  // Held in a ref so a caller passing an inline arrow (the common case) can't
  // re-trigger the timeout on every render and stretch the hold indefinitely.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => { onDoneRef.current?.(); }, duration);
    return () => clearTimeout(t);
  }, [duration]);

  const name = typeof username === 'string' ? username.trim() : '';

  return (
    <div className="welcome-overlay" role="status" aria-live="polite">
      <div className="welcome-ring welcome-ring--1" aria-hidden="true" />
      <div className="welcome-ring welcome-ring--2" aria-hidden="true" />
      <div className="welcome-ring welcome-ring--3" aria-hidden="true" />

      <div className="welcome-content">
        <div className="welcome-tag">Welcome to</div>
        <div className="welcome-logo">MEDVALE</div>
        <div className="welcome-saga">
          {name ? `Your saga continues, ${name}.` : 'Your saga begins.'}
        </div>
      </div>
    </div>
  );
}
