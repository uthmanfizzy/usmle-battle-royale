import { useState, useEffect } from 'react';
import './GuidePage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// 16:9 responsive embed — same wrapper convention as JourneyMode's
// .jm-confirm-video-frame (aspect-ratio box + absolutely-filled iframe).
function VideoEmbed({ type, embedId, title }) {
  const src = type === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${embedId}?rel=0`
    : `https://player.vimeo.com/video/${embedId}`;
  return (
    <div className="gp-video-frame">
      <iframe
        src={src}
        title={title || 'Guide video'}
        frameBorder="0"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// Public guide page: admin-authored sections from /api/guide-sections,
// rendered in sort_order. Content is plain text (white-space: pre-wrap) —
// no HTML injection anywhere.
export default function GuidePage() {
  const [sections, setSections] = useState(null); // null = loading
  const [error, setError] = useState(false);
  // First navigation after signup (UsernameSetupPage sends ?onboarding=1):
  // show a prominent Continue CTA. Same URLSearchParams pattern as AuthCallback.
  const onboarding = new URLSearchParams(window.location.search).get('onboarding') === '1';

  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/guide-sections`)
      .then(r => (r.ok ? r.json() : { sections: [] }))
      .then(d => { if (!cancelled) setSections(d.sections || []); })
      .catch(() => { if (!cancelled) { setSections([]); setError(true); } });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="gp">
      <nav className="gp-nav">
        <button className="gp-nav-back" onClick={() => { window.location.href = '/dashboard'; }}>
          ← Back
        </button>
        <span className="gp-nav-brand">📖 Guide</span>
        <span className="gp-nav-spacer" />
      </nav>

      <div className="gp-page">
        {sections === null ? (
          <div className="gp-load">
            <div className="gp-load-ring" />
            <div className="gp-load-text">Loading guide…</div>
          </div>
        ) : sections.length === 0 ? (
          <div className="gp-panel gp-empty">
            <span className="gp-empty-icon">📖</span>
            <p>Guide coming soon!</p>
            <p className="gp-empty-sub">
              {error
                ? 'The guide could not be loaded right now — check back in a bit.'
                : 'We are writing up everything you need to get the most out of the game.'}
            </p>
          </div>
        ) : (
          sections.map(s => (
            <div key={s.id} className="gp-panel gp-section">
              <h2 className="gp-section-title">{s.title}</h2>
              {s.video_type && s.video_embed_id && (
                <VideoEmbed type={s.video_type} embedId={s.video_embed_id} title={s.title} />
              )}
              {s.content && <p className="gp-section-content">{s.content}</p>}
            </div>
          ))
        )}
        {onboarding && sections !== null && (
          <button
            className="gp-continue-btn"
            onClick={() => { window.location.href = '/dashboard'; }}
          >
            Continue to Dashboard →
          </button>
        )}
        <div className="gp-footer-space" />
      </div>
    </div>
  );
}
