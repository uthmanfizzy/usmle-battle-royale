// Shorts feed URL parsing + embed helpers — the ONE source of truth shared by
// the admin panel (live preview) and the student feed, so they can't drift.
// The server has its own authoritative copy of the parser (parseShortUrl in
// server/index.js); keep the regexes in sync when editing.
//
// Stage 2a: YouTube renders inline; TikTok/Instagram are stored + shown as
// tap-to-open fallback cards (their inline embeds are stage 2b/2c).

export const PLATFORM_LABELS = {
  youtube:   'YouTube',
  tiktok:    'TikTok',
  instagram: 'Instagram',
};

export const PLATFORM_ICONS = {
  youtube:   '▶',
  tiktok:    '🎵',
  instagram: '📷',
};

// parseShortUrl(url) → { platform, video_id } | { error }
export function parseShortUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return { error: 'Paste a video URL.' };
  const s = url.trim();

  // TikTok share/short links carry no video id — they redirect. Reject with
  // guidance instead of storing something we can never embed.
  if (/(?:vm\.tiktok\.com|tiktok\.com\/t)\//i.test(s)) {
    return { error: 'That is a TikTok share link — paste the full URL from the address bar (tiktok.com/@user/video/…).' };
  }

  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID — 11-char ids
  let m = s.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
  if (m) return { platform: 'youtube', video_id: m[1] };

  // TikTok: tiktok.com/@user/video/DIGITS
  m = s.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
  if (m) return { platform: 'tiktok', video_id: m[1] };

  // Instagram: instagram.com/(reel|reels|p)/CODE
  m = s.match(/instagram\.com\/(?:reel|reels|p)\/([\w-]+)/i);
  if (m) return { platform: 'instagram', video_id: m[1] };

  return { error: 'Unrecognized link — paste a YouTube Shorts, TikTok video, or Instagram Reel URL.' };
}

// Inline-embed URL for a platform, or null when the platform isn't inline yet
// (TikTok = 2b, Instagram = 2c — the feed shows a tap-to-open card instead).
export function embedUrl(platform, videoId) {
  if (platform === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&autoplay=1&mute=1&rel=0`;
  }
  return null;
}

// Derivable thumbnail, or null (TikTok thumbs come from oEmbed at add-time and
// live in the row's thumbnail_url; Instagram has no free thumbnail source).
export function thumbnailUrl(platform, videoId) {
  if (platform === 'youtube') {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}
