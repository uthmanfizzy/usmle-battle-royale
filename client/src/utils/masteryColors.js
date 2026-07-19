/* Shared tier ramps for mastery / level accents.
 *
 * These live in JS rather than CSS because they're applied as inline style
 * values computed from a number — CSS custom properties can't reach them.
 * All values are hand-derived from --mv-gold (#e8b04b): brighter gold = higher
 * tier, ending on a neutral gray for the lowest. Keep them in sync with
 * designTokens.css by eye; there is no build-time link.
 *
 * getMasteryColor was previously duplicated in ProgressPage.jsx and (in a
 * different, pre-reskin purple/blue palette) StatsPage.jsx. Both now import
 * from here so the two screens can't drift apart again.
 */

/** 5 mastery tiers, matching the Novice→Master labels used on both screens. */
export function getMasteryColor(pct) {
  if (pct >= 81) return '#e8b04b';
  if (pct >= 61) return '#c9973f';
  if (pct >= 41) return '#a67c34';
  if (pct >= 21) return '#8a6529';
  return '#6b7280';
}

/** 9 level tiers for the Stats hero avatar ring. Same ramp approach as
 *  getMasteryColor, just with finer steps; shares its exact endpoints and
 *  intermediate stops so the two read as one system. */
export function getRingColor(lvl) {
  if (lvl >= 100) return '#f2cd85';
  if (lvl >= 76)  return '#e8b04b';
  if (lvl >= 51)  return '#d9a344';
  if (lvl >= 41)  return '#c9973f';
  if (lvl >= 31)  return '#b8883a';
  if (lvl >= 21)  return '#a67c34';
  if (lvl >= 11)  return '#94702f';
  if (lvl >= 6)   return '#8a6529';
  return '#6b7280';
}
