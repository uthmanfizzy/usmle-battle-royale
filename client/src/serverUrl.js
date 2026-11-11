/**
 * Where the client talks to.
 *
 * This URL used to be typed out in 38 separate files, which meant `npm run
 * dev` on localhost drove the LIVE server: there was no single place to
 * point somewhere else, so local work created real lobbies, joined real
 * players' rooms and wrote to the real database.
 *
 * One constant now, and an env override for local work:
 *
 *     # client/.env.local  (gitignored)
 *     VITE_SERVER_URL=http://localhost:3001
 *
 * Read at BUILD time by Vite, not at runtime — `import.meta.env` is
 * substituted when the bundle is built, so a deployed build keeps the
 * production default below unless the deploy itself sets the variable.
 *
 * The trailing slash is stripped so callers can keep writing
 * `${SERVER_URL}/api/thing` without doubling it.
 */
const RAW = import.meta.env?.VITE_SERVER_URL
  || 'https://usmle-battle-royale-production.up.railway.app';

export const SERVER_URL = String(RAW).replace(/\/+$/, '');

export default SERVER_URL;
