/**
 * Question-stem pictures — one list, however many figures.
 *
 * STORAGE SHAPE: `stem_images` is a JSONB array of plain URL strings, in the
 * order they should appear above the options. No `pos` here, unlike the
 * explanation's list: an explanation has paragraphs to sit between, a stem is
 * one block of text with its figures beneath it, so a position would be a
 * field that could only ever hold one value.
 *
 * THE LEGACY COLUMN IS A MIRROR, NOT A SECOND SOURCE OF TRUTH:
 * `image_url` always holds figure #1, so every reader written before this —
 * the live multiplayer modes, the admin list thumbnails, any cached payload —
 * keeps showing the first figure instead of nothing. When the list is present
 * it WINS, so anything writing the legacy column alone must go through
 * mergeStemImages() or its change would be invisible behind a stale list.
 *
 * A row whose list is empty but whose image_url is set is a pre-migration row.
 * It reads back as a one-figure list, which is exactly what it is — so nothing
 * needs backfilling.
 *
 * Mirrored in server/questionMapper.js. Keep the two in step.
 */

// A stem with nine figures is not a stem. The cap also means a bad payload
// cannot push an unbounded array into a JSONB column.
export const MAX_STEM_IMAGES = 8;

const clean = (item) => {
  const url = typeof item === 'string' ? item : item?.url;
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
};

/** Row (or anything row-shaped) -> [url, ...]. */
export function normalizeStemImages(row) {
  const out = [];
  const raw = row?.stem_images;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const url = clean(item);
      if (url && !out.includes(url)) out.push(url);
      if (out.length >= MAX_STEM_IMAGES) break;
    }
  }
  // Pre-migration row, or a row whose list was dropped because the column was
  // missing: the legacy single url IS the list.
  if (!out.length) {
    const legacy = clean(row?.image_url);
    if (legacy) out.push(legacy);
  }
  return out;
}

/** The update record for a stem-picture list, legacy mirror included. */
export function stemImagesToDb(list) {
  const urls = (list || []).map(clean).filter(Boolean).slice(0, MAX_STEM_IMAGES);
  return {
    stem_images: urls.length ? urls : null,
    // Figure #1, for every reader that predates the list.
    image_url: urls[0] || null,
  };
}

/**
 * The list a write should end up with, resolved against the row as it stands.
 *
 * `stem_images` in the body replaces the list outright. A bare `image_url`
 * replaces figure #1 and leaves the rest alone — which is what the old
 * single-picture slot still sends, and what would otherwise silently drop
 * every other figure.
 */
export function mergeStemImages(existing, body) {
  const has = (k) => body && Object.prototype.hasOwnProperty.call(body, k);
  if (has('stem_images')) {
    return normalizeStemImages({ stem_images: body.stem_images });
  }
  const list = normalizeStemImages(existing);
  if (!has('image_url')) return list;
  const url = clean(body.image_url);
  if (!url) return list.slice(1);          // clearing figure #1 promotes the rest
  const next = [...list];
  next[0] = url;
  return normalizeStemImages({ stem_images: next });
}
