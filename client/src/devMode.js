// ─────────────────────────────────────────────────────────────────────────────
// Developer mode — a clean global the whole app can read.
//
// Dev mode is the single entry point for admin-only editing features on the live
// site (today: authoring OFFICIAL explanation highlights; future: inline question
// editing, etc.). It is ACTIVE only when BOTH are true:
//   • mr_dev_mode_active === '1'  (set by the admin "Enter Developer Mode" button)
//   • usmle_admin_session present (the admin password, set by /admin login)
//
// The server remains the real gate for every privileged write (it still requires a
// valid x-admin-password header) — this flag only drives client UI/affordances.
// ─────────────────────────────────────────────────────────────────────────────

export const DEV_MODE_KEY    = 'mr_dev_mode_active';
export const ADMIN_SESSION_KEY = 'usmle_admin_session';

export function getAdminSession() {
  try { return localStorage.getItem(ADMIN_SESSION_KEY); } catch { return null; }
}

export function isDevModeActive() {
  try {
    return localStorage.getItem(DEV_MODE_KEY) === '1' && !!getAdminSession();
  } catch {
    return false;
  }
}

export function enterDevMode() {
  try { localStorage.setItem(DEV_MODE_KEY, '1'); } catch {}
}

export function exitDevMode() {
  try { localStorage.removeItem(DEV_MODE_KEY); } catch {}
}
