/**
 * The Buzz Fun cards this browser has been shown today (and yesterday), so a
 * second run of 30 can skip them (duelOptions.buzzSkipSeen, plus
 * buzzSkipYesterday for the day before). Kept per local calendar day: when
 * the day rolls over, today's list becomes yesterday's and anything older is
 * dropped.
 *
 * The server keeps its own copy per signed-in account too (it covers another
 * device); this one covers guests and a server restart.
 */
const KEY = 'buzz_seen_today';
const MAX = 3000;

function dayStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function buzzToday() { return dayStr(new Date()); }
export function buzzYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayStr(d);
}

// { today: [...ids], yesterday: [...ids] } for the current local day.
function read() {
  const today = buzzToday();
  const yday = buzzYesterday();
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && Array.isArray(v.ids)) {
      if (v.day === today) {
        return { today: v.ids, yesterday: v.prevDay === yday && Array.isArray(v.prevIds) ? v.prevIds : [] };
      }
      // Stored list is from yesterday: it becomes yesterday's.
      if (v.day === yday) return { today: [], yesterday: v.ids };
    }
  } catch { /* storage blocked or corrupt: nothing seen */ }
  return { today: [], yesterday: [] };
}

export function buzzSeenIds() { return read().today; }
export function buzzSeenYesterdayIds() { return read().yesterday; }

export function markBuzzSeen(id) {
  if (!id) return;
  const { today, yesterday } = read();
  if (today.includes(String(id))) return;
  today.push(String(id));
  try {
    localStorage.setItem(KEY, JSON.stringify({
      day: buzzToday(), ids: today.slice(-MAX),
      prevDay: buzzYesterday(), prevIds: yesterday.slice(-MAX),
    }));
  } catch { /* ignore */ }
}

/**
 * The cards this browser got wrong (or let time out) recently, for the
 * "review wrong cards" run (duelOptions.buzzWrongDays). Kept 14 days;
 * answering a card right takes it off. { [id]: { at, s: subject, b: bank } }
 */
const WRONG_KEY = 'buzz_wrong';
const WRONG_KEEP_MS = 14 * 86400000;

function readWrong() {
  try {
    const v = JSON.parse(localStorage.getItem(WRONG_KEY) || 'null');
    if (!v || typeof v !== 'object') return {};
    const cutoff = Date.now() - WRONG_KEEP_MS;
    const out = {};
    for (const [id, e] of Object.entries(v)) if (e && Number(e.at) >= cutoff) out[id] = e;
    return out;
  } catch { return {}; }
}

export function noteBuzzResult(card, correct) {
  if (!card || !card.id) return;
  const all = readWrong();
  if (correct) delete all[card.id];
  else all[card.id] = { at: Date.now(), s: card.subject || '', b: card.bank || 'vanilla' };
  const ids = Object.keys(all);
  if (ids.length > MAX) {
    ids.sort((a, b) => all[a].at - all[b].at).slice(0, ids.length - MAX).forEach(id => delete all[id]);
  }
  try { localStorage.setItem(WRONG_KEY, JSON.stringify(all)); } catch { /* ignore */ }
}

// [[id, missedAt], ...] to send to the server.
export function buzzWrongList() {
  return Object.entries(readWrong()).map(([id, e]) => [id, Number(e.at)]);
}

// How many cards this browser missed in the last `days` days, in a bank,
// optionally only in some systems; plus the count per system.
export function buzzWrongCounts(days, bank) {
  const cutoff = Date.now() - days * 86400000;
  const bySubject = {};
  let total = 0;
  for (const e of Object.values(readWrong())) {
    if (Number(e.at) < cutoff || (e.b || 'vanilla') !== bank) continue;
    total++;
    bySubject[e.s] = (bySubject[e.s] || 0) + 1;
  }
  return { total, bySubject };
}
