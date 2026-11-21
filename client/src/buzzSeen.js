/**
 * The Buzz Fun cards this browser has been shown today, so a second run of
 * 30 can skip them (duelOptions.buzzSkipSeen). Kept per local calendar day;
 * yesterday's list is dropped the first time today's is touched.
 *
 * The server keeps its own copy per signed-in account too (it covers another
 * device); this one covers guests and a server restart.
 */
const KEY = 'buzz_seen_today';
const MAX = 3000;

export function buzzToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && v.day === buzzToday() && Array.isArray(v.ids)) return v.ids;
  } catch { /* storage blocked or corrupt: nothing seen */ }
  return [];
}

export function buzzSeenIds() { return read(); }

export function markBuzzSeen(id) {
  if (!id) return;
  const ids = read();
  if (ids.includes(id)) return;
  ids.push(String(id));
  try { localStorage.setItem(KEY, JSON.stringify({ day: buzzToday(), ids: ids.slice(-MAX) })); } catch { /* ignore */ }
}
