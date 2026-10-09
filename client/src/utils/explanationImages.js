/**
 * Explanation pictures — one list, however many images.
 *
 * STORAGE SHAPE: `explanation_images` is a JSONB array of { url, pos }, where
 * `pos` is which paragraph gap the picture sits in (0 = above the first
 * paragraph, 1 = after it, and so on) — the same meaning the old single
 * `explanation_image_pos` column had.
 *
 * THE LEGACY COLUMNS ARE A MIRROR, NOT A SECOND SOURCE OF TRUTH:
 * `explanation_image_url` / `explanation_image_pos` always hold picture #1, so
 * every reader written before this (other game modes, the row thumbnails in
 * the admin list, any cached payload) keeps showing the first picture instead
 * of nothing. When the list is present it WINS — so anything that writes the
 * legacy column alone must go through mergeExplanationImages(), or its change
 * would be invisible behind a stale list.
 *
 * A row whose list is empty but whose legacy column is set is a pre-migration
 * row: it reads back as a one-picture list, which is exactly what it is.
 *
 * This is a mirror of the server's copy in server/questionMapper.js — the two
 * must agree, so keep them in sync (same arrangement as shuffleOptions).
 */

// Enough for any explanation that is still an explanation, and a cap means a
// bad payload can't push an unbounded array into a JSONB column.
export const MAX_EXPLANATION_IMAGES = 8;

export function clampImagePos(v) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(99, n));
}

/**
 * Row (or anything row-shaped) -> [{ url, pos }]. Accepts a list of plain URL
 * strings too, since that is what a hand-written payload tends to send.
 */
export function normalizeExplanationImages(row) {
  const out = [];
  const raw = row?.explanation_images;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const url = typeof item === 'string' ? item : item?.url;
      if (!url || typeof url !== 'string' || !url.trim()) continue;
      out.push({ url: url.trim(), pos: clampImagePos(typeof item === 'string' ? 0 : item?.pos) });
      if (out.length >= MAX_EXPLANATION_IMAGES) break;
    }
  }
  if (out.length === 0 && row?.explanation_image_url) {
    out.push({
      url: String(row.explanation_image_url).trim(),
      pos: clampImagePos(row.explanation_image_pos),
    });
  }
  return out;
}

/**
 * The three columns to write for a list. Picture #1 is mirrored into the
 * legacy pair; an empty list clears all three.
 */
export function explanationImagesToDb(images) {
  const list = normalizeExplanationImages({ explanation_images: images });
  return {
    explanation_images: list.length ? list : null,
    explanation_image_url: list[0]?.url ?? null,
    explanation_image_pos: list[0] ? list[0].pos : null,
  };
}
