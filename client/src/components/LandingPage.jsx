import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../auth';
import LandingHero from './LandingHero';
import './LandingPage.css';

const TRAILER_URL = ''; // TODO: paste YouTube/Vimeo embed URL here

const FEATURES = [
  { letter: 'B', title: 'Battle Royale', desc: 'Last medic standing wins the war.' },
  { letter: 'P', title: 'PvP Arenas', desc: 'Duel rival healers in ranked combat.' },
  { letter: 'S', title: 'Story Mode', desc: 'Uncover why the realm started bleeding.' },
];

export default function LandingPage({ onSignIn }) {
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    if (!trailerOpen) return;
    const fn = (e) => { if (e.key === 'Escape') setTrailerOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [trailerOpen]);

  // Logged-in visitors go straight to the dashboard; everyone else through Google auth
  const handleEnter = useCallback(() => {
    if (getToken()) {
      window.location.replace('/dashboard');
      return;
    }
    onSignIn();
  }, [onSignIn]);

  // Header links: the logo goes to the top, the rest to their sections.
  const navTo = useCallback((id) => {
    // The app scrolls #root (height:100%, overflow:auto), not the window
    const el = id === 'top' ? document.querySelector('.lp') : document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="lp">
      <LandingHero onEnter={handleEnter} onTrailer={() => setTrailerOpen(true)} onNav={navTo} />

      {/* ── Lore ── */}
      <section id="lore" className="lp-section lp-lore">
        <h2 className="lp-section-heading">THE WORLD OF MEDVALE</h2>
        <div className="lp-lore-row">
          <div className="lp-lore-art">
            <span className="lp-lore-art-label">world art placeholder</span>
          </div>
          <div className="lp-lore-text">
            <p className="lp-lore-quote">
              Once the realm's greatest healers — now its last line of defense.
            </p>
            <div className="lp-lore-bar" style={{ width: '92%' }} />
            <div className="lp-lore-bar" style={{ width: '80%' }} />
            <div className="lp-lore-bar" style={{ width: '60%' }} />
            {/* Placeholder: no lore page exists yet */}
            <button className="lp-lore-link">Read the Lore →</button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="lp-section lp-features">
        <h2 className="lp-section-heading">THREE WAYS TO PLAY</h2>
        <div className="lp-features-row">
          {FEATURES.map((f) => (
            <div key={f.letter} className="lp-feature-card">
              <div className="lp-feature-icon">{f.letter}</div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span className="lp-footer-copy">© Medvale — Early Access Build</span>
        <div className="lp-footer-icons">
          {/* Visual placeholders: no social/Discord links exist in the app yet */}
          <span className="lp-footer-icon" aria-hidden="true" />
          <span className="lp-footer-icon" aria-hidden="true" />
        </div>
      </footer>

      {/* ── Trailer modal (mirrors the app's modal-overlay/modal-card pattern) ── */}
      {trailerOpen && (
        <div className="lp-modal-overlay" onClick={() => setTrailerOpen(false)}>
          <div className="lp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h3 className="lp-modal-title">Medvale — Official Trailer</h3>
              <button
                className="lp-modal-close"
                onClick={() => setTrailerOpen(false)}
                aria-label="Close"
              >✕</button>
            </div>
            {TRAILER_URL ? (
              <div className="lp-trailer-frame">
                <iframe
                  src={TRAILER_URL}
                  title="Medvale trailer"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="lp-trailer-soon">
                <span className="lp-trailer-soon-icon">▶</span>
                <p>Trailer coming soon</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
