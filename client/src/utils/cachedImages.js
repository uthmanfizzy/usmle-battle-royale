// Admin-set page images (home icons/art, journey backdrop, play background) are
// URLs fetched from the server on every page load. Until that request returns
// the page renders with NO image, so each refresh showed a blank flash before
// the art popped in.
//
// The URLs are remembered in localStorage: a refresh renders the last-known
// images immediately (the browser usually has the files cached too), and the
// fresh request quietly replaces them if the admin changed anything. Cached
// URLs are also preloaded at startup so the files are already warm.

const PREFIX = 'mv_img_cache:';

function read(key) {
  try { return JSON.parse(localStorage.getItem(PREFIX + key) || 'null'); }
  catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* quota / private mode */ }
}

const preloaded = new Set();
function preload(map) {
  if (typeof Image === 'undefined' || !map) return;
  for (const url of Object.values(map)) {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url) || preloaded.has(url)) continue;
    preloaded.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

/** Synchronous read of a cached map, for state initialisers outside the hook. */
export function cachedImageMap(key) {
  const cached = read(key) || {};
  preload(cached);
  return cached;
}

/** Store a fresh map fetched by existing code (and warm its files). */
export function rememberImageMap(key, map) {
  if (!map || typeof map !== 'object') return;
  write(key, map);
  preload(map);
}

/** True when the browser already has this image ready (no fade needed). */
export function isImageReady(url) {
  if (!url || typeof Image === 'undefined') return false;
  const img = new Image();
  img.src = url;
  return img.complete && img.naturalWidth > 0;
}
