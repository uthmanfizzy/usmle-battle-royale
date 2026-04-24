import { useEffect } from 'react';
import { setToken, fetchMe } from '../auth';

export default function AuthCallback() {
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
        window.location.replace('/dashboard');
      } else {
        window.location.replace('/?auth_error=profile_failed');
      }
    });
  }, []);

  return (
    <div className="screen entry-screen">
      <div className="spinner" style={{ width: 52, height: 52 }} />
      <p style={{ marginTop: 16, color: '#ccc' }}>Signing you in…</p>
    </div>
  );
}
