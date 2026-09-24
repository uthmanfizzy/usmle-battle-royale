import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { embedUrl, thumbnailUrl, PLATFORM_LABELS, PLATFORM_ICONS } from '../utils/shortEmbeds';
import './ShortsFeed.css';

// Vertical TikTok-style Shorts feed (new dashboard Shorts tab, stage 2b).
//
// - Full-height slides, scroll-snap; mouse-wheel snap on desktop, swipe on mobile.
// - PERF RULE: only the ACTIVE slide mounts an iframe (well inside the
//   "active ± 1" budget); neighbors show instant thumbnails, everything else
//   stays cheap. Off-screen iframes are unmounted, never left playing —
//   this matters doubly for TikTok, whose embeds are heavy.
// - YouTube plays inline (muted autoplay when the slide becomes active).
//   TikTok (2b) renders inline via the direct iframe (tiktok.com/embed/v2/ID);
//   it has no reliable muted-autoplay, so the slide holds its thumbnail (or a
//   branded gradient) until active, then the player's own controls take over.
//   Instagram is still a tap-to-open fallback card (inline embed = stage 2c).
// - Every slide keeps a permanent "Open in <platform> ↗" link: cross-origin
//   iframe failures (login wall, removed video, blocked network) are silent,
//   so the way out is always visible.

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

function OpenLink({ short, prominent = false }) {
  return (
    <a
      className={`sf-open${prominent ? ' sf-open--big' : ''}`}
      href={short.video_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open in {PLATFORM_LABELS[short.platform] || 'app'} ↗
    </a>
  );
}

// Tell a YouTube iframe to turn its sound on. Uses the player's postMessage
// API (enabled by `enablejsapi=1` in embedUrl) rather than reloading the src
// with mute=0, which would restart the video from the top.
//
// Fired repeatedly on a short schedule because there is no ready signal without
// pulling in YouTube's whole iframe_api script: commands sent before the player
// has bound its listener are simply dropped, so a few cheap retries are the
// pragmatic substitute.
function unmuteYouTube(iframe) {
  const win = iframe?.contentWindow;
  if (!win) return () => {};
  const send = (payload) => {
    try { win.postMessage(JSON.stringify(payload), '*'); } catch {}
  };
  const tick = () => {
    // YouTube's player binds its message handler after announcing itself; the
    // `listening` event is what its own iframe API sends first, and commands
    // posted before it can be ignored.
    send({ event: 'listening', id: 'medvale-reels' });
    send({ event: 'command', func: 'unMute', args: [] });
    send({ event: 'command', func: 'setVolume', args: [100] });
  };
  tick();
  const timers = [200, 600, 1200, 2500].map(ms => setTimeout(tick, ms));
  return () => timers.forEach(clearTimeout);
}

function Slide({ short, isActive, isNear, soundOn, gesture }) {
  const thumb = short.thumbnail_url || thumbnailUrl(short.platform, short.video_id);
  const inline = embedUrl(short.platform, short.video_id); // null → fallback card (Instagram, 2c)
  const frameRef = useRef(null);

  // Turn the sound on as soon as this slide is the active one. Re-runs when the
  // user toggles sound, so the control affects the playing video immediately.
  useEffect(() => {
    if (!isActive || short.platform !== 'youtube') return;
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    if (soundOn) return unmuteYouTube(frameRef.current);
    try { win.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*'); } catch {}
  }, [isActive, soundOn, gesture, short.platform]);

  return (
    <div className="sf-media">
      {inline ? (
        isActive ? (
          // Active slide only: the one mounted iframe in the whole feed
          <iframe
            ref={frameRef}
            className={`sf-iframe sf-iframe--${short.platform}`}
            src={inline}
            title={short.title || 'Short'}
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => { if (soundOn && short.platform === 'youtube') unmuteYouTube(frameRef.current); }}
          />
        ) : (
          // Neighbors keep a cheap thumbnail warm; far slides render it lazily.
          // The platform modifier paints a branded gradient behind slides with
          // no thumbnail (e.g. TikTok rows whose oEmbed thumb expired).
          <div className={`sf-thumb-wrap sf-thumb-wrap--${short.platform}`}>
            {thumb && <img className="sf-thumb" src={thumb} alt="" loading={isNear ? 'eager' : 'lazy'} />}
            <span className="sf-play-glyph" aria-hidden="true">▶</span>
          </div>
        )
      ) : (
        // Instagram (until 2c): tap-to-open fallback card
        <a
          className={`sf-fallback sf-fallback--${short.platform}`}
          href={short.video_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {thumb && <img className="sf-thumb sf-thumb--dim" src={thumb} alt="" loading={isNear ? 'eager' : 'lazy'} />}
          <div className="sf-fallback-inner">
            <span className="sf-fallback-icon">{PLATFORM_ICONS[short.platform]}</span>
            <span className="sf-fallback-name">{PLATFORM_LABELS[short.platform]}</span>
            <span className="sf-fallback-hint">Tap to watch in {PLATFORM_LABELS[short.platform]}</span>
            <span className="sf-open sf-open--big">Open in {PLATFORM_LABELS[short.platform]} ↗</span>
          </div>
        </a>
      )}
    </div>
  );
}

export default function ShortsFeed() {
  const [allShorts, setAllShorts] = useState(null); // null = loading
  const [categories, setCategories] = useState([]); // admin-managed tabs
  // Which tab is showing. 'all' is always offered first, and is remembered so
  // the feed reopens on the kind of video this viewer actually watches.
  const [category, setCategory] = useState(() => {
    try { return localStorage.getItem('mr_reels_category') || 'all'; } catch { return 'all'; }
  });
  const [activeIdx, setActiveIdx] = useState(0);
  // Sound is ON by default — this is a video feed, not a background banner.
  // Remembered so a viewer who silences it stays silenced next visit.
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('mr_reels_sound') !== 'off'; } catch { return true; }
  });
  const containerRef = useRef(null);

  function toggleSound() {
    setSoundOn(on => {
      const next = !on;
      try { localStorage.setItem('mr_reels_sound', next ? 'on' : 'off'); } catch {}
      return next;
    });
  }

  // Autoplay policy: a document the user has not touched cannot play sound, and
  // the Reels card is a full page load so no gesture carries over from the
  // dashboard. The first interaction of any kind lifts the block, so bump a
  // counter then — it re-runs each slide's unmute effect at the first moment
  // the command can actually succeed. One-shot; harmless if sound is off.
  const [gesture, setGesture] = useState(0);
  useEffect(() => {
    const events = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'];
    const onFirst = () => setGesture(g => g + 1);
    events.forEach(e => window.addEventListener(e, onFirst, { once: true, passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, onFirst));
  }, []);

  // The whole feed in one request, filtered to a tab in memory: the list is
  // small, and switching tabs with no network round-trip is the point.
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/shorts`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setAllShorts(Array.isArray(d.shorts) ? d.shorts : []); })
      .catch(() => { if (!cancelled) setAllShorts([]); });
    fetch(`${SERVER_URL}/api/reel-categories`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setCategories(Array.isArray(d.categories) ? d.categories : []); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);

  // Only tabs that actually have videos, so a category set up in advance never
  // greets a viewer with an empty feed.
  const tabs = useMemo(() => {
    const counts = new Map();
    for (const s of allShorts || []) {
      if (s.category) counts.set(s.category, (counts.get(s.category) || 0) + 1);
    }
    return [
      { slug: 'all', name: 'All', icon: '✨', count: (allShorts || []).length },
      ...categories
        .filter(c => counts.get(c.slug))
        .map(c => ({ slug: c.slug, name: c.name, icon: c.icon, count: counts.get(c.slug) })),
    ];
  }, [allShorts, categories]);

  // A remembered tab whose category has since been emptied or removed falls
  // back to All rather than showing nothing.
  const activeTab = tabs.some(t => t.slug === category) ? category : 'all';
  const shorts = useMemo(() => (
    activeTab === 'all'
      ? allShorts
      : (allShorts || []).filter(s => s.category === activeTab)
  ), [allShorts, activeTab]);

  function chooseCategory(slug) {
    setCategory(slug);
    setActiveIdx(0);
    try { localStorage.setItem('mr_reels_category', slug); } catch { /* private mode */ }
    // Back to the first slide of the new tab, not wherever the old one was.
    containerRef.current?.scrollTo({ top: 0 });
  }

  // Track the visible slide: the IntersectionObserver drives which slide is
  // "active" (mounts the iframe / autoplays) as the user snaps through.
  const observeSlides = useCallback((node) => {
    containerRef.current = node;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-idx'));
            if (Number.isFinite(idx)) setActiveIdx(idx);
          }
        }
      },
      { root: node, threshold: 0.6 }
    );
    node.querySelectorAll('.sf-slide').forEach(el => observer.observe(el));
    node._sfObserver?.disconnect();
    node._sfObserver = observer;
  }, []);

  // Re-observe when the list arrives/changes
  useEffect(() => {
    if (shorts && containerRef.current) observeSlides(containerRef.current);
    return () => containerRef.current?._sfObserver?.disconnect();
  }, [shorts, observeSlides]);

  if (allShorts === null) {
    return <div className="sf-state"><div className="spinner" /></div>;
  }

  const tabBar = tabs.length > 1 && (
    <nav className="sf-tabs" aria-label="Reel categories">
      {tabs.map(t => (
        <button
          key={t.slug}
          type="button"
          className={`sf-tab${t.slug === activeTab ? ' is-active' : ''}`}
          aria-pressed={t.slug === activeTab}
          onClick={() => chooseCategory(t.slug)}
        >
          {t.icon && <span className="sf-tab-icon" aria-hidden="true">{t.icon}</span>}
          {t.name}
          <span className="sf-tab-count">{t.count}</span>
        </button>
      ))}
    </nav>
  );

  if (shorts.length === 0) {
    return (
      <div className="sf-state">
        {tabBar}
        <div className="sf-empty">
          <span className="sf-empty-icon">🎬</span>
          <h2 className="sf-empty-title">No shorts yet</h2>
          <p className="sf-empty-text">Check back soon — bite-size videos are on the way.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-feed" ref={observeSlides}>
      {tabBar}
      {/* Sound control. Also the guaranteed escape hatch from the autoplay
          policy: tapping it IS the gesture that lets sound start. */}
      <button
        type="button"
        className="sf-sound"
        onClick={toggleSound}
        title={soundOn ? 'Mute' : 'Unmute'}
        aria-label={soundOn ? 'Mute videos' : 'Unmute videos'}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>

      {shorts.map((short, i) => (
        <section className="sf-slide" data-idx={i} key={short.id}>
          <Slide
            short={short}
            isActive={i === activeIdx}
            isNear={Math.abs(i - activeIdx) <= 1}
            soundOn={soundOn}
            gesture={gesture}
          />

          {/* Permanent overlay: title/caption + platform chip + open link */}
          <div className="sf-overlay">
            <div className="sf-overlay-meta">
              <span className={`sf-chip sf-chip--${short.platform}`}>
                {PLATFORM_ICONS[short.platform]} {PLATFORM_LABELS[short.platform]}
              </span>
              {short.title && <h3 className="sf-title">{short.title}</h3>}
              {short.caption && <p className="sf-caption">{short.caption}</p>}
              <OpenLink short={short} />
            </div>
          </div>

          <span className="sf-counter">{i + 1} / {shorts.length}</span>
        </section>
      ))}
    </div>
  );
}
