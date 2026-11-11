const TOKEN_KEY  = 'authToken';
const USER_KEY   = 'user';
import { SERVER_URL } from './serverUrl';

export function getToken()              { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token)         { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken()            { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export function getCachedUser()         { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
export function setCachedUser(user)     { localStorage.setItem(USER_KEY, JSON.stringify(user)); }

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${SERVER_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { clearToken(); return null; }
    const user = await res.json();
    setCachedUser(user);
    // Cross-device theme sync — ThemeProvider listens and adopts server prefs
    try { window.dispatchEvent(new CustomEvent('mr-prefs-sync', { detail: user })); } catch {}
    return user;
  } catch {
    return null;
  }
}

export function redirectToGoogle() {
  window.location.href = `${SERVER_URL}/auth/google`;
}

export async function authFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res;
}

// ── The guest's name ───────────────────────────────────────────────────────
// A guest has no account and no token, so a refresh used to throw them back
// to the landing page and make them type a name again. The name is the whole
// of a guest's identity here, so remembering it IS remembering the guest.
//
// Wrapped because storage throws in a private window and comes back empty
// after a clear; a guest who cannot be remembered simply signs in again.
const GUEST_KEY = 'mv_guest_name';

export function getGuestName() {
  try { return localStorage.getItem(GUEST_KEY) || ''; } catch { return ''; }
}

export function setGuestName(name) {
  try { localStorage.setItem(GUEST_KEY, String(name || '').slice(0, 20)); } catch { /* not remembered */ }
}

export function clearGuestName() {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* nothing to clear */ }
}
