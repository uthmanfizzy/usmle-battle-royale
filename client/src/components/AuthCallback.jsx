import { useEffect, useState } from 'react';
import { setToken, fetchMe } from '../auth';
import WelcomeOverlay from './WelcomeOverlay';

export default function AuthCallback() {
  // Set only once fetchMe has returned a real user. `to` is where we go after
  // the overlay's hold; `username` is empty for a brand-new account that still
  // has to pick one, which WelcomeOverlay renders as "Your saga begins."
  const [welcome, setWelcome] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const error  = params.get('error');

    if (error || !token) {
      window.location.replace('/?auth_error=' + (error || 'no_token'));
      return;
    }

    setToken(token);
    fetchMe().then(user => {
      if (user) {
        // Auth has genuinely succeeded here — this is the earliest honest
        // point to welcome them, and the first point the real username exists.
        setWelcome({
          username: user.username || '',
          to: user.username ? '/dashboard' : '/username-setup',
        });
      } else {
        window.location.replace('/?auth_error=profile_failed');
      }
    });
  }, []);

  if (welcome) {
    return (
      <WelcomeOverlay
        username={welcome.username}
        onDone={() => window.location.replace(welcome.to)}
      />
    );
  }

  return (
    <div className="screen entry-screen">
      <div className="spinner" style={{ width: 52, height: 52 }} />
      <p style={{ marginTop: 16, color: '#ccc' }}>Signing you in…</p>
    </div>
  );
}
