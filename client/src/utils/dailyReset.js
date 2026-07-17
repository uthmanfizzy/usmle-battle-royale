// Daily-quest reset countdown — the server keys daily_quests strictly by the
// UTC date string, so the reset boundary is midnight UTC. This is the exact
// calc HomeSection's widget timer uses (Dashboard.jsx); extracted so
// QuestsPage can't drift from it.
export function timeToDailyReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const diff = midnight - now;
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hrs}h ${mins}m`;
}
