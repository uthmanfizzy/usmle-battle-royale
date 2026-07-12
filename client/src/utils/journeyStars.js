// Star rating for First Aid Journey levels — computed on the fly from
// best_score_pct (0-100 integer, clamped server-side in /api/journey/complete),
// never stored. Single source of truth: both the level map nodes and the
// level-complete interstitial must call this, not duplicate the thresholds.
//
// Boundaries: 0-49 → 0★ · 50-74 → 1★ · 75-89 → 2★ · 90-100 → 3★
// (49→0, 50→1, 74→1, 75→2, 89→2, 90→3, 100→3 — verified in journeyStars.invariant.mjs)
export function getStarCount(pct) {
  if (pct >= 90) return 3;
  if (pct >= 75) return 2;
  if (pct >= 50) return 1;
  return 0;
}
