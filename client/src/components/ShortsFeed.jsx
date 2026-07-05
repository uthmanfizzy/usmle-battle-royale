import { useState, useEffect, useRef, useCallback } from 'react';
import { embedUrl, thumbnailUrl, PLATFORM_LABELS, PLATFORM_ICONS } from '../utils/shortEmbeds';
import './ShortsFeed.css';

// Vertical TikTok-style Shorts feed (new dashboard Shorts tab, stage 2a).
//
// - Full-height slides, scroll-snap; mouse-wheel snap on desktop, swipe on mobile.
// - PERF RULE: only the ACTIVE slide mounts an iframe (well inside the
//   "active ± 1" budget); neighbors show instant thumbnails, everything else
//   stays cheap. Off-screen iframes are unmounted, never left playing.
// - YouTube plays inline (muted autoplay when the slide becomes active).
//   TikTok / Instagram are tap-to-open fallback cards this stage (inline
//   embeds are stage 2b/2c — embedUrl() returns null for them).
// - Every slide keeps a permanent "Open in <platform> ↗" link: cross-origin
//   iframe failures can't be detected, so the way out is always visible.

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

function Slide({ short, isActive, isNear }) {
  const thumb = short.thumbnail_url || thumbnailUrl(short.platform, short.video_id);
  const inline = embedUrl(short.platform, short.video_id); // null → fallback card (2b/2c)

  return (
    <div className="sf-media">
      {inline ? (
        isActive ? (
          // Active slide only: the one mounted iframe in the whole feed
          <iframe
            className="sf-iframe"
            src={inline}
            title={short.title || 'Short'}
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="sf-thumb-wrap">
            {/* Neighbors keep a cheap thumbnail warm; far slides render it lazily */}
            {thumb && <img className="sf-thumb" src={thumb} alt="" loading={isNear ? 'eager' : 'lazy'} />}
            <span className="sf-play-glyph" aria-hidden="true">▶</span>
          </div>
        )
      ) : (
        // TikTok / Instagram (stage 2a): tap-to-open fallback card
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
  const [shorts, setShorts]       = useState(null); // null = loading
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/shorts`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setShorts(Array.isArray(d.shorts) ? d.shorts : []); })
      .catch(() => { if (!cancelled) setShorts([]); });
    return () => { cancelled = true; };
  }, []);

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

  if (shorts === null) {
    return <div className="sf-state"><div className="spinner" /></div>;
  }

  if (shorts.length === 0) {
    return (
      <div className="sf-state">
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
      {shorts.map((short, i) => (
        <section className="sf-slide" data-idx={i} key={short.id}>
          <Slide short={short} isActive={i === activeIdx} isNear={Math.abs(i - activeIdx) <= 1} />

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
