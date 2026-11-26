import { useEffect, useState } from 'react';
import { getToken } from '../auth';
import { SERVER_URL } from '../serverUrl';

/**
 * Does this browser belong to someone with admin permissions? The owner's
 * admin password (stored by the /admin login) or a signed-in account with the
 * moderator flag. Asked of the server, which knows both: /api/me/permissions
 * checks the password header first, then the account.
 *
 * Returns 'checking' | true | false. Used to keep unfinished areas (Clinical)
 * open to admins only; the page itself is still public code, so this hides
 * work in progress rather than protecting a secret.
 */
export function useAdminAccess() {
  const [state, setState] = useState('checking');
  useEffect(() => {
    let alive = true;
    const headers = {};
    try {
      const pw = localStorage.getItem('usmle_admin_session');
      if (pw) headers['x-admin-password'] = pw;
    } catch { /* storage blocked */ }
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!headers.Authorization && !headers['x-admin-password']) { setState(false); return undefined; }
    fetch(`${SERVER_URL}/api/me/permissions`, { headers })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive) setState(!!d?.moderator); })
      .catch(() => { if (alive) setState(false); });
    return () => { alive = false; };
  }, []);
  return state;
}
