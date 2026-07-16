import { useState } from 'react';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.015 17.64 11.707 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function UsernameEntry({ onJoin, onGoogleLogin, error }) {
  const [showGuest, setShowGuest] = useState(false);
  const [name,      setName]      = useState('');

  const cleanName = name.replace(/[^a-zA-Z0-9_\- ]/g, '');
  const canSubmit = cleanName.trim().length >= 1;

  function handleSubmit(e) {
    e.preventDefault();
    if (canSubmit) onJoin(cleanName.trim());
  }

  // Mockup login card: MEDVALE wordmark, "Enter Medvale" heading, white
  // octagon-cut Google button, red-outlined guest button. Handlers are the
  // SAME onGoogleLogin/onJoin as before — presentation only. (The mockup's
  // "Continue as Guest" corresponds to the real, pre-existing guest flow.)
  return (
    <div className="screen entry-screen">
      <div className="entry-outer">
        <div className="entry-wordmark">MEDVALE</div>
        <div className="entry-card">
          <h1 className="entry-heading">Enter Medvale</h1>
          <p className="entry-tagline">Sign in to continue your saga.</p>

          <button className="btn-google" onClick={onGoogleLogin} type="button">
            {GOOGLE_SVG}
            Continue with Google
          </button>

          <div className="entry-divider"><span>or</span></div>

          {!showGuest ? (
            <button className="btn-guest" onClick={() => setShowGuest(true)} type="button">
              Continue as Guest
            </button>
          ) : (
            <div className="guest-form-wrap">
              <p className="guest-form-label">What should we call you?</p>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Enter a name..."
                  value={name}
                  onChange={e => setName(e.target.value.slice(0, 20))}
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                />
                <p className="guest-form-hint">
                  Guest accounts don't save progress.{' '}
                  <button type="button" className="guest-form-signin-link" onClick={onGoogleLogin}>
                    Sign in instead →
                  </button>
                </p>
                {error && <p className="error-msg">{error}</p>}
                <button className="btn-primary" type="submit" disabled={!canSubmit}>
                  Play as Guest →
                </button>
              </form>
            </div>
          )}
        </div>
        <p className="entry-terms">By entering, you agree to the Terms and Early Access Agreement.</p>
      </div>
    </div>
  );
}
