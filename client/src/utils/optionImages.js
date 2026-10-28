/**
 * Picture options — when the ANSWERS are images and the student picks the
 * right picture, not the right sentence.
 *
 * Client copy of the helpers in server/questionMapper.js — keep the two in
 * sync.
 *
 * STORAGE SHAPE: `option_images` is positionally aligned to `options`: entry i
 * is option i's picture, or null where that option has none, so a question can
 * mix words and pictures. A null is a real value here, not an absence, which
 * is why nothing in this file compacts the array — dropping a hole would move
 * every later picture onto the wrong option.
 *
 * Trailing nulls ARE dropped: they say nothing the array's end does not.
 *
 * ORDER IS NOT STABLE. Options are shuffled per appearance, so a picture has
 * to be read through the shuffle's permutation (`order` from
 * shuffleQuestionOptions) rather than by display position.
 */

export const MAX_OPTION_IMAGES = 10;

/** Row (or anything row-shaped) -> [url|null, ...]. */
export function normalizeOptionImages(row) {
  const raw = row && row.option_images;
  if (!Array.isArray(raw)) return [];
  const out = raw.slice(0, MAX_OPTION_IMAGES).map((item) => {
    const url = typeof item === 'string' ? item : (item && item.url);
    return url && /^https?:\/\//i.test(String(url)) ? String(url) : null;
  });
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

/**
 * The list with ONE option's picture set or cleared, padded with nulls so the
 * index lands where it was asked for. Returns a new array; `index` is an
 * AUTHOR index, never a display position.
 */
export function withOptionImage(list, index, url) {
  const next = Array.isArray(list) ? [...list] : [];
  while (next.length <= index) next.push(null);
  next[index] = url || null;
  while (next.length && next[next.length - 1] === null) next.pop();
  return next;
}

/** Does this question have any picture options at all? */
export function hasAnyOptionImage(row) {
  return normalizeOptionImages(row).some(Boolean);
}
