/**
 * The Clue Ladder diseases this browser has had, and on which day, so a
 * match can skip what you did today or in the last few days
 * (clOptions.skipDays). Kept for two weeks. The server keeps its own copy per
 * signed-in account too (another device); this one covers guests and a
 * server restart. Sent to the server with `cl_seen`.
 */
const KEY = 'cl_seen';
const KEEP_DAYS = 14;

export function clToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dayNum = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : null;
};

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v === 'object') return v;
  } catch { /* storage blocked or corrupt: nothing seen */ }
  return {};
}

/** { answerKey: 'YYYY-MM-DD' } for the last two weeks. */
export function clSeenMap() {
  const today = dayNum(clToday());
  const out = {};
  for (const [k, d] of Object.entries(read())) {
    const n = dayNum(d);
    if (n != null && today - n <= KEEP_DAYS) out[k] = d;
  }
  return out;
}

export function markClSeen(key) {
  if (!key) return;
  const m = clSeenMap();
  delete m[key];
  m[key] = clToday();
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* not kept */ }
}

/** Tell the server what this browser has had (cheap; safe to repeat). */
export function sendClSeen(socket) {
  try { socket.emit('cl_seen', { today: clToday(), seen: clSeenMap() }); } catch { /* offline */ }
}
