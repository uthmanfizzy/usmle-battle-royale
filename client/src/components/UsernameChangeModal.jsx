import { useState, useEffect } from 'react';
import { authFetch } from '../auth';
import './UsernameChangeModal.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

function fmtLong(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// When this user may next change their name, or null if they can now.
export function nextUsernameChange(user) {
  if (!user?.last_username_change) return null;
  const next = new Date(new Date(user.last_username_change).getTime() + MS_PER_YEAR);
  return next > new Date() ? next : null;
}

/**
 * Change-username dialog, shared by the Progress profile and Settings. Self-
 * styled (ucm-*) so it works on pages that don't load Dashboard.css. The
 * once-a-year rule is enforced by PUT /auth/username; the client only mirrors
 * it so the player sees the date instead of a form that will be refused.
 */
export default function UsernameChangeModal({ user, onClose, onSuccess }) {
  const [value,     setValue]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [checking,  setChecking]  = useState(false);
  const [available, setAvailable] = useState(null);

  const trimmed    = value.trim();
  const validLen   = trimmed.length >= 3 && trimmed.length <= 20;
  const validChars = /^[a-zA-Z0-9_]*$/.test(trimmed);
  const isSame     = trimmed.toLowerCase() === (user.username || '').toLowerCase();
  const formatOk   = validLen && validChars && !isSame;

  const lastChange = user.last_username_change ? new Date(user.last_username_change) : null;
  const nextChange = nextUsernameChange(user);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced availability check (same endpoint the signup page uses).
  useEffect(() => {
    if (!formatOk) { setAvailable(null); setChecking(false); return; }
    setChecking(true);
    setAvailable(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/username/check?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setAvailable(!!data.available);
      } catch { setAvailable(null); }
      setChecking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [trimmed, formatOk]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formatOk || available === false || loading) return;
    if (!window.confirm(`Change your username to "${trimmed}"? You won't be able to change it again for a year.`)) return;
    setLoading(true); setError('');
    try {
      const res = await authFetch('/auth/username', {
        method: 'PUT',
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change username.'); setLoading(false); return; }
      onSuccess(data.username, data.last_username_change);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  let status = null;
  if (trimmed) {
    if (!validChars)             status = <span className="ucm-err">✗ Letters, numbers and _ only</span>;
    else if (!validLen)          status = <span className="ucm-err">✗ 3–20 characters</span>;
    else if (isSame)             status = <span className="ucm-err">✗ That's already your username</span>;
    else if (checking)           status = <span className="ucm-muted">Checking…</span>;
    else if (available === true) status = <span className="ucm-ok">✓ Available</span>;
    else if (available === false) status = <span className="ucm-err">✗ Already taken</span>;
  }

  return (
    <div className="ucm-overlay" onClick={onClose}>
      <div className="ucm-card" role="dialog" aria-modal="true" aria-label="Change username" onClick={e => e.stopPropagation()}>
        <div className="ucm-head">
          <h3 className="ucm-title">Change Username</h3>
          <button type="button" className="ucm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="ucm-current">Current: <strong>{user.username || 'Player'}</strong></p>
        {lastChange && <p className="ucm-muted">Last changed {fmtLong(lastChange)}</p>}

        {nextChange ? (
          <div className="ucm-cooldown">
            <p>You can next change your username on</p>
            <strong>{fmtLong(nextChange)}</strong>
            <p className="ucm-muted">Username changes are limited to once a year.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ucm-form">
            <label className="ucm-label" htmlFor="ucm-input">New username</label>
            <input
              id="ucm-input"
              className="ucm-input"
              type="text"
              value={value}
              onChange={e => setValue(e.target.value.replace(/\s/g, ''))}
              placeholder={user.username || 'YourUsername'}
              maxLength={20}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <div className="ucm-status">{status}</div>
            {error && <p className="ucm-error">{error}</p>}
            <p className="ucm-warning">⚠️ You can only change your username once a year.</p>
            <button
              className="ucm-submit"
              type="submit"
              disabled={loading || !formatOk || available !== true}
            >
              {loading ? 'Saving…' : 'Change Username'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
