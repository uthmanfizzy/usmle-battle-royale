const TOKEN_KEY  = 'usmle_jwt';
const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export function getToken()        { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token)   { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken()      { localStorage.removeItem(TOKEN_KEY); }

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${SERVER_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { clearToken(); return null; }
    return await res.json();
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
