// Shorts feed URL parsing + embed helpers — the ONE source of truth shared by
// the admin panel (live preview) and the student feed, so they can't drift.
// The server has its own authoritative copy of the parser (parseShortUrl in
// server/index.js); keep the regexes in sync when editing.
//
// Stage 2b: YouTube + TikTok render inline; Instagram is stored + shown as a
// tap-to-open fallback card (its inline embed is stage 2c).

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
  //
  // `vertical` matters at render: a Short is a 9:16 video, and playing one in
  // a 16:9 frame letterboxes it into a column down the middle with the
  // player's own furniture — title, channel, buttons — sitting over the
  // picture on either side. The only place that says which kind of video an
  // id belongs to is the url it came in on, so it is read here and carried.
  let m = s.match(/youtube\.com\/shorts\/([\w-]{11})/i);
  if (m) return { platform: 'youtube', video_id: m[1], vertical: true };
  m = s.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
  if (m) return { platform: 'youtube', video_id: m[1], vertical: false };

  // TikTok: tiktok.com/@user/video/DIGITS
  m = s.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
  if (m) return { platform: 'tiktok', video_id: m[1], vertical: true };

  // Instagram: instagram.com/(reel|reels|p)/CODE
  m = s.match(/instagram\.com\/(?:reel|reels|p)\/([\w-]+)/i);
  if (m) return { platform: 'instagram', video_id: m[1], vertical: true };

  return { error: 'Unrecognized link — paste a YouTube Shorts, TikTok video, or Instagram Reel URL.' };
}

// Inline-embed URL for a platform, or null when the platform isn't inline yet
// (Instagram = 2c — the feed shows a tap-to-open card instead).
export function embedUrl(platform, videoId) {
  if (platform === 'youtube') {
    // Still starts MUTED, deliberately: every browser blocks autoplay with
    // sound in a document the user has not interacted with, and an unmuted
    // src would simply not start — worse than starting quiet. The feed turns
    // sound on via the postMessage API the moment it is allowed to, which is
    // what `enablejsapi` is here for.
    return `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&autoplay=1&mute=1&rel=0&enablejsapi=1`;
  }
  if (platform === 'tiktok') {
    // Direct, script-free iframe endpoint. No reliable muted-autoplay — the
    // feed shows a thumbnail/placeholder until the slide is active, then
    // mounts this player (its own controls take over).
    return `https://www.tiktok.com/embed/v2/${videoId}`;
  }
  return null;
}

// Play-on-demand embed URL (no autoplay) — for places where a video is *offered*
// and the user presses play themselves, e.g. the Journey level confirm screen.
// Same endpoints as embedUrl minus the autoplay/mute flags. null when not inline.
//
// WHAT THESE PARAMETERS CAN AND CANNOT DO. controls=0 takes away YouTube's own
// control bar, iv_load_policy=3 the annotations, rel=0 keeps the end screen to
// the same channel, fs=0 and disablekb=1 the fullscreen button and the
// shortcuts. What NO parameter removes is the title and channel strip that
// appears across the top on hover and when paused, or the watermark: YouTube
// requires its own player for its own video, and those are part of it. A
// player of ours wrapped around theirs (ShortPlayer) is as close as this gets,
// and it is close — with the bar gone and the frame the right shape, the
// furniture only returns if you pause by tapping the video itself.
export function embedUrlStatic(platform, videoId, { bare = false } = {}) {
  if (platform === 'youtube') {
    const base = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&iv_load_policy=3&modestbranding=1`;
    return bare ? `${base}&controls=0&disablekb=1&fs=0&enablejsapi=1` : base;
  }
  if (platform === 'tiktok') {
    return `https://www.tiktok.com/embed/v2/${videoId}`;
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
