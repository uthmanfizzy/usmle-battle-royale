import { useState, useEffect } from 'react';
import { getToken, fetchMe, authFetch } from '../auth';
import './UsernameSetupPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

function makeSuggestions(email) {
  const base = (email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Player';
  const cap  = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  return [
    `Dr${cap}`,
    `${cap}_MD`,
    `Future_Dr${cap}`,
  ].map(s => s.slice(0, 20));
}

export default function UsernameSetupPage() {
  const [user,      setUser]      = useState(null);
  const [username,  setUsername]  = useState('');
  const [checking,  setChecking]  = useState(false);
  const [available, setAvailable] = useState(null); // null | true | false
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => {
      if (!me)          { window.location.href = '/'; return; }
      if (me.username)  { window.location.href = '/dashboard'; return; }
      setUser(me);
    });
  }, []);

  const trimmed    = username.trim();
  const validLen   = trimmed.length >= 3 && trimmed.length <= 20;
  const validChars = trimmed.length === 0 || /^[a-zA-Z0-9_]+$/.test(trimmed);
  const isFormatOk = validLen && validChars;

  // Debounced availability check
  useEffect(() => {
    if (!isFormatOk) { setAvailable(null); setChecking(false); return; }
    setChecking(true);
    setAvailable(null);
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`${SERVER_URL}/api/username/check?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setAvailable(data.available);
      } catch {
        setAvailable(null);
      }
      setChecking(false);
    }, 600);
    return () => clearTimeout(t);
  }, [trimmed, isFormatOk]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormatOk || available !== true || loading) return;
    setLoading(true);
    setError('');
    try {
      const res  = await authFetch('/auth/username', {
        method: 'PUT',
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to set username.'); setLoading(false); return; }
      // Brand-new account's first navigation: land on the Guide once, with a
      // Continue button back to the dashboard. This page only runs pre-username,
      // so it can never re-fire for an existing account.
      window.location.href = '/guide?onboarding=1';
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="usp-screen">
        <div className="spinner" style={{ width: 52, height: 52 }} />
      </div>
    );
  }

  const suggestions = makeSuggestions(user.email);
  const canSubmit   = isFormatOk && available === true && !loading;

  function statusIcon() {
    if (!trimmed)       return null;
    if (!validChars)    return <span className="usp-status usp-status-err">✗ Letters, numbers and _ only</span>;
    if (!validLen)      return <span className="usp-status usp-status-err">✗ 3–20 characters</span>;
    if (checking)       return <span className="usp-status usp-status-chk">Checking…</span>;
    if (available === true)  return <span className="usp-status usp-status-ok">✓ Available!</span>;
    if (available === false) return <span className="usp-status usp-status-err">✗ Already taken</span>;
    return null;
  }

  return (
    <div className="usp-screen">
      <div className="usp-card">
        <div className="usp-logo">⚕️</div>
        <h1 className="usp-title">Choose Your Username 🏥</h1>
        <p className="usp-subtitle">
          This is how other players will know you.<br />
          Choose wisely — you can only change it once a year!
        </p>

        {user.avatar_url && (
          <img src={user.avatar_url} alt="" className="usp-avatar" referrerPolicy="no-referrer" />
        )}

        <form onSubmit={handleSubmit} className="usp-form">
          <div className="usp-input-wrap">
            <input
              type="text"
              className="usp-input"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="YourUsername"
              maxLength={20}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <div className="usp-char-count">{trimmed.length}/20</div>
          </div>

          <div className="usp-status-row">{statusIcon()}</div>

          {error && <p className="usp-error">{error}</p>}

          <button
            type="submit"
            className="usp-btn"
            disabled={!canSubmit}
          >
            {loading ? 'Saving…' : 'Choose Username →'}
          </button>
        </form>

        <div className="usp-suggestions-wrap">
          <p className="usp-suggestions-label">Need inspiration?</p>
          <div className="usp-suggestions">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                className="usp-suggestion-chip"
                onClick={() => setUsername(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
