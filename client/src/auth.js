const TOKEN_KEY  = 'authToken';
const USER_KEY   = 'user';
const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

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
