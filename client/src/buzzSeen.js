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
