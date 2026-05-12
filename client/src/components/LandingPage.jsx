import { useState, useEffect, useCallback } from 'react';
import './LandingPage.css';

const API = 'https://usmle-battle-royale-production.up.railway.app';

const STATS = [
  { icon: '👥', label: 'STUDENTS', value: '12,458' },
  { icon: '✗', label: 'QUESTIONS', value: '3.24M' },
  { icon: '⭕', label: 'AVG. SCORE', value: '87.6%' },
];

const GAME_MODES = [
  {
    id: 'battle_royale',
    number: '01',
    icon: '♛',
    title: 'BATTLE ROYALE',
    description: '100 players. One winner.',
    hasArrow: true,
  },
  {
    id: 'speed_race',
    number: '02',
    icon: '⏱',
    title: 'SPEED RACE',
    description: 'Beat the clock. Score higher.',
    hasArrow: true,
  },
  {
    id: 'tower',
    number: '03',
    icon: '🏰',
    title: 'THE TOWER',
    description: 'Climb the endless tower.',
    hasArrow: true,
  },
  {
    id: 'more_to_come',
    number: '04',
    icon: '🌿',
    title: 'MORE TO COME',
    description: 'New modes coming soon!',
    hasArrow: false,
  },
];

function ImagePlaceholder({ text = 'Upload in Admin' }) {
  return (
    <div className="lp-card-placeholder">
      <span className="lp-card-placeholder-icon">🖼️</span>
    </div>
  );
}

export default function LandingPage({ onSignIn }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [images, setImages] = useState({});

  useEffect(() => {
    fetch(`${API}/api/landing-images`)
      .then(res => res.ok ? res.json() : { images: {} })
      .then(data => setImages(data.images || {}))
      .catch(() => setImages({}));
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const scrollToTop = useCallback(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToModes = useCallback(() => {
    setMenuOpen(false);
    document.getElementById('game-modes')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const pageStyle = images.hero_bg ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.5)), url(${images.hero_bg})`,
  } : {};

  return (
    <div className={`lp ${images.hero_bg ? 'has-bg' : ''}`} style={pageStyle}>
      {/* Navigation - Transparent */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <button className="lp-logo" onClick={scrollToTop}>
            <span className="lp-logo-leaf">🌿</span>
            <span className="lp-logo-icon">⚕</span>
            <span className="lp-logo-text">MedVale</span>
            <span className="lp-logo-leaf">🌿</span>
          </button>

          <div className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
            <button className="lp-nav-link active" onClick={scrollToTop}>HOME</button>
            <button className="lp-nav-link" onClick={scrollToModes}>GAME MODES</button>
            <button className="lp-nav-link">LEADERBOARD</button>
            <button className="lp-nav-link">NEWS</button>
            <button className="lp-nav-link">ABOUT</button>
            <button className="lp-discord-btn mobile-only" onClick={onSignIn}>
              <svg className="lp-discord-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              JOIN DISCORD
            </button>
          </div>

          <div className="lp-nav-right">
            <button className="lp-discord-btn desktop-only" onClick={onSignIn}>
              <svg className="lp-discord-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              JOIN DISCORD
            </button>
            <button
              className={`lp-burger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && <div className="lp-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Main Content - All in one viewport */}
      <main className="lp-main">
        {/* Hero Section - Top ~55% */}
        <section className="lp-hero">
          <div className="lp-hero-content">
            {/* Left Side - Main Content */}
            <div className="lp-hero-left">
              <div className="lp-hero-welcome">
                <span className="lp-ornament">✦</span>
                <span>WELCOME TO</span>
                <span className="lp-ornament">✦</span>
              </div>

              <h1 className="lp-hero-title">MedVale</h1>

              <p className="lp-hero-tagline">
                🌿 LIVE. FIGHT. SURVIVE. BECOME LEGEND. 🌿
              </p>

              <p className="lp-hero-desc">
                Ace your exams. Master your future. Challenge yourself with fun competitive modes.
              </p>

              <div className="lp-hero-buttons">
                <button className="lp-btn-parchment" onClick={onSignIn}>
                  <span className="lp-btn-text">PLAY NOW</span>
                </button>
                <button className="lp-btn-ghost" onClick={onSignIn}>
                  <span>WATCH TRAILER</span>
                  <span className="lp-play-icon">▶</span>
                </button>
              </div>
            </div>

            {/* Right Side - Stats Panel */}
            <div className="lp-hero-right">
              <div className="lp-stats-panel">
                {STATS.map((stat, i) => (
                  <div key={i} className="lp-stat-box">
                    <div className="lp-stat-icon">{stat.icon}</div>
                    <div className="lp-stat-label">{stat.label}</div>
                    <div className="lp-stat-value">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Game Modes Section - Bottom ~45% */}
        <section id="game-modes" className="lp-modes">
          <div className="lp-modes-header">
            <span className="lp-modes-ornament">❧</span>
            <h2 className="lp-modes-title">GAME MODES</h2>
            <span className="lp-modes-ornament">❧</span>
          </div>

          <div className="lp-modes-grid">
            {GAME_MODES.map((mode) => (
              <div key={mode.id} className="lp-mode-card" onClick={mode.hasArrow ? onSignIn : undefined}>
                <div className="lp-mode-image">
                  <div className="lp-mode-badge">{mode.number}</div>
                  {images[mode.id] ? (
                    <img src={images[mode.id]} alt={mode.title} />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
                <div className="lp-mode-content">
                  <div className="lp-mode-icon">{mode.icon}</div>
                  <h3 className="lp-mode-title">{mode.title}</h3>
                  <p className="lp-mode-desc">{mode.description}</p>
                  {mode.hasArrow && <span className="lp-mode-arrow">→</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="lp-footer">
        <span className="lp-footer-brand">MEDVALE</span>
        <span className="lp-footer-caduceus">⚕</span>
        <span className="lp-footer-copy">© 2026</span>
      </footer>
    </div>
  );
}
