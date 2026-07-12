// Boundary check for the Journey star thresholds — the off-by-one here is the
// most likely bug, so every edge is pinned. Run: node src/utils/journeyStars.invariant.mjs
import { getStarCount } from './journeyStars.js';

const cases = [
  [0, 0], [49, 0],
  [50, 1], [74, 1],
  [75, 2], [89, 2],
  [90, 3], [100, 3],
];

let failed = 0;
for (const [pct, want] of cases) {
  const got = getStarCount(pct);
  if (got !== want) { failed++; console.error(`FAIL getStarCount(${pct}) = ${got}, want ${want}`); }
}
if (failed) { console.error(`${failed} case(s) failed`); process.exit(1); }
console.log(`journeyStars invariant OK — ${cases.length} boundary cases pass`);
