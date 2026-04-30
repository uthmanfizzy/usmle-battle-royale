import { useState, useEffect, useRef, useCallback } from 'react';
import './LandingPage.css';

// ── Data ───────────────────────────────────────────────────────────────────────

const FLOATING_ICONS = [
  { icon: '❤️', x: 8,  y: 18, size: 26, dur: 14, delay: 0   },
  { icon: '🧠', x: 22, y: 65, size: 20, dur: 17, delay: 2.5 },
  { icon: '💊', x: 78, y: 12, size: 22, dur: 13, delay: 1.2 },
  { icon: '🦠', x: 88, y: 52, size: 24, dur: 18, delay: 3.8 },
  { icon: '🔬', x: 48, y: 82, size: 18, dur: 15, delay: 0.7 },
  { icon: '🩺', x: 62, y: 28, size: 22, dur: 16, delay: 2.1 },
  { icon: '⚗️', x: 14, y: 74, size: 19, dur: 19, delay: 4.2 },
  { icon: '🫁', x: 92, y: 22, size: 21, dur: 12, delay: 1.8 },
  { icon: '🫀', x: 36, y: 44, size: 18, dur: 20, delay: 3.3 },
  { icon: '🩸', x: 68, y: 72, size: 17, dur: 14, delay: 0.4 },
  { icon: '💉', x: 4,  y: 50, size: 20, dur: 16, delay: 5.0 },
  { icon: '🧬', x: 54, y: 88, size: 22, dur: 18, delay: 2.9 },
  { icon: '💊', x: 40, y: 10, size: 16, dur: 15, delay: 6.1 },
  { icon: '❤️', x: 75, y: 85, size: 18, dur: 13, delay: 4.7 },
];

const EXAMS = [
  { name: 'USMLE Step 1', available: true  },
  { name: 'USMLE Step 2', available: false },
  { name: 'PLAB',         available: false },
  { name: 'AMC Australia', available: false },
  { name: 'MCCQE Canada', available: false },
  { name: 'MRCP',         available: false },
  { name: 'FMGE India',   available: false },
];

const STATS = [
  { value: 6,      suffix: '+', label: 'Subjects Available', icon: '📚', isText: false },
  { value: 7,      suffix: '+', label: 'Game Modes',         icon: '🎮', isText: false },
  { value: 100,    suffix: '',  label: 'Tower Floors',       icon: '🏰', isText: false },
  { value: 'Free', suffix: '',  label: 'Forever',            icon: '✨', isText: true  },
];

const MODES = [
  { icon: '⚔️', name: 'Battle Royale',  desc: 'Last doctor standing wins. 3 lives. No mercy.',                color: '#e74c3c', glow: 'rgba(231,76,60,0.35)'   },
  { icon: '⚡', name: 'Speed Race',     desc: 'First to 20 correct answers wins. Think fast.',                color: '#3498db', glow: 'rgba(52,152,219,0.35)'  },
  { icon: '🎯', name: 'Trivia Pursuit', desc: 'Collect all 6 subject wedges on a real game board.',           color: '#9b59b6', glow: 'rgba(155,89,182,0.35)'  },
  { icon: '🏰', name: 'The Tower',      desc: '100 floors of medical knowledge. Can you reach the summit?',   color: '#c9a84c', glow: 'rgba(201,168,76,0.35)'  },
  { icon: '🔬', name: 'Scan Master',    desc: 'Identify conditions from real medical images.',                 color: '#00b894', glow: 'rgba(0,184,148,0.35)'   },
  { icon: '⚡', name: 'Buzz Fun',       desc: 'Buzzwords, triads and HY associations. 8 seconds. Go.',        color: '#e67e22', glow: 'rgba(230,126,34,0.35)'  },
  { icon: '🎮', name: 'Solo Practice',  desc: 'Practice at your own pace. Track your mastery per subject.',   color: '#6c5ce7', glow: 'rgba(108,92,231,0.35)'  },
];

const FEATURES = [
  { icon: '🏆', title: 'Real-time Multiplayer',    desc: 'Compete live against classmates from anywhere in the world. Real stakes, real adrenaline.', color: '#e67e22' },
  { icon: '📊', title: 'Performance Analytics',    desc: 'Track your accuracy, spot weak areas and measure improvement after every session.',          color: '#3498db' },
  { icon: '🧬', title: 'Subject Mastery',          desc: 'Level up in each subject as you answer more questions correctly. Watch your mastery grow.',  color: '#9b59b6' },
  { icon: '👥', title: 'Clan System',              desc: 'Create or join a clan, compete together as a team and climb the clan leaderboard.',          color: '#27ae60' },
  { icon: '🔥', title: 'Streak Bonuses',           desc: 'Answer 3 in a row correctly and earn double XP. Stay hot or start over.',                   color: '#e74c3c' },
  { icon: '📢', title: 'Daily Challenges',         desc: 'New questions every day. Build a study streak and never let your momentum drop.',            color: '#c9a84c' },
];

const STEPS = [
  { num: '01', icon: '🔑', title: 'Sign in with Google', desc: 'No registration form, no credit card. One click and you are in instantly.' },
  { num: '02', icon: '🎮', title: 'Choose Your Game Mode', desc: '7 different ways to study. Pick based on your mood — competitive, solo, or quick fire.' },
  { num: '03', icon: '🏆', title: 'Compete and Learn', desc: 'Real-time battles with instant explanations. Every wrong answer teaches you something.' },
];

const COMING_SOON = [
  { flag: '🇬🇧', name: 'PLAB',  country: 'United Kingdom' },
  { flag: '🇦🇺', name: 'AMC',   country: 'Australia' },
  { flag: '🇨🇦', name: 'MCCQE', country: 'Canada' },
  { flag: '🇮🇳', name: 'FMGE',  country: 'India' },
  { flag: '🇸🇦', name: 'Saudi Medical Licensing', country: 'Saudi Arabia' },
  { flag: '🇳🇬', name: 'MDCN',  country: 'Nigeria' },
];

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref  = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCountUp(target, duration = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return val;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ stat, active }) {
  const count = useCountUp(stat.isText ? 0 : stat.value, 1800, active);
  return (
    <div className="lp-stat-card">
      <div className="lp-stat-icon">{stat.icon}</div>
      <div className="lp-stat-value">
        {stat.isText ? stat.value : `${count}${stat.suffix}`}
      </div>
      <div className="lp-stat-label">{stat.label}</div>
    </div>
  );
}

function ModeCard({ mode, index }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`lp-mode-card ${inView ? 'lp-visible' : ''}`}
      style={{
        '--mode-color': mode.color,
        '--mode-glow': mode.glow,
        animationDelay: `${index * 0.07}s`,
      }}
    >
      <div className="lp-mode-icon">{mode.icon}</div>
      <div className="lp-mode-color-bar" style={{ background: mode.color }} />
      <h3 className="lp-mode-name">{mode.name}</h3>
      <p className="lp-mode-desc">{mode.desc}</p>
    </div>
  );
}

function FeatureCard({ feature, index }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`lp-feat-card ${inView ? 'lp-visible' : ''}`}
      style={{ '--feat-color': feature.color, animationDelay: `${index * 0.08}s` }}
    >
      <div className="lp-feat-icon-wrap" style={{ background: `${feature.color}18`, border: `1px solid ${feature.color}40` }}>
        <span className="lp-feat-icon">{feature.icon}</span>
      </div>
      <h3 className="lp-feat-title">{feature.title}</h3>
      <p className="lp-feat-desc">{feature.desc}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LandingPage({ onSignIn }) {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const modesRef = useRef(null);
  const [statsRef, statsInView] = useInView(0.2);

  // Scroll listener for navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = useCallback((id) => {
    setMobileOpen(false);
    const el = id === 'modes' ? modesRef.current : document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="lp-root">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-solid' : ''}`}>
        <div className="lp-nav-inner">
          <a href="/" className="lp-logo" onClick={e => e.preventDefault()}>
            <span className="lp-logo-symbol">⚕️</span>
            <span className="lp-logo-text">Med Royale</span>
          </a>

          <div className={`lp-nav-links ${mobileOpen ? 'lp-nav-open' : ''}`}>
            <button className="lp-nav-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="lp-nav-link" onClick={() => scrollTo('modes')}>Game Modes</button>
            <button className="lp-nav-link" onClick={() => scrollTo('exams')}>Exams</button>
            <button className="lp-signin-btn lp-signin-mobile" onClick={onSignIn}>Sign In</button>
          </div>

          <button className="lp-signin-btn lp-signin-desktop" onClick={onSignIn}>Sign In</button>

          <button
            className={`lp-burger ${mobileOpen ? 'lp-burger-open' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {mobileOpen && <div className="lp-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Animated background */}
        <div className="lp-hero-bg">
          <div className="lp-hero-glow lp-hero-glow-purple" />
          <div className="lp-hero-glow lp-hero-glow-gold" />
          <div className="lp-hero-grid" />
          {FLOATING_ICONS.map((item, i) => (
            <span
              key={i}
              className="lp-float-icon"
              style={{
                left: `${item.x}%`,
                top:  `${item.y}%`,
                fontSize: item.size,
                animationDuration: `${item.dur}s`,
                animationDelay: `${item.delay}s`,
              }}
            >
              {item.icon}
            </span>
          ))}
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Free for all medical students
          </div>

          <h1 className="lp-hero-title">
            Master Medicine.<br />
            Beat Your Friends.<br />
            <span className="lp-title-accent">Ace Your Exams.</span>
          </h1>

          <p className="lp-hero-sub">
            The world's first multiplayer medical exam preparation platform.
            Battle classmates in real-time, climb leaderboards and make studying actually fun.
          </p>

          <div className="lp-hero-cta">
            <button className="lp-cta-primary" onClick={onSignIn}>
              Start Playing Free 🎮
            </button>
            <button className="lp-cta-secondary" onClick={() => scrollTo('modes')}>
              Watch How It Works ▶
            </button>
          </div>

          <div className="lp-hero-proof">
            <div className="lp-proof-avatars">
              {['👨‍⚕️','👩‍⚕️','🧑‍⚕️','👩‍⚕️'].map((a, i) => (
                <span key={i} className="lp-proof-avatar" style={{ left: i * 24 }}>{a}</span>
              ))}
            </div>
            <span className="lp-proof-text">Join hundreds of medical students studying smarter</span>
          </div>
        </div>

        <div className="lp-scroll-indicator" onClick={() => scrollTo('exams')}>
          <div className="lp-scroll-dot" />
        </div>
      </section>

      {/* ── Exam Badges Marquee ─────────────────────────────────────────── */}
      <section id="exams" className="lp-exams">
        <p className="lp-exams-label">Supported &amp; upcoming exams</p>
        <div className="lp-marquee-wrap">
          <div className="lp-marquee-track">
            {[...EXAMS, ...EXAMS, ...EXAMS].map((exam, i) => (
              <div
                key={i}
                className={`lp-exam-badge ${exam.available ? 'lp-exam-active' : 'lp-exam-soon'}`}
              >
                <span className="lp-exam-icon">{exam.available ? '✅' : '🔜'}</span>
                <span className="lp-exam-name">{exam.name}</span>
                <span className={`lp-exam-tag ${exam.available ? '' : 'lp-exam-tag-soon'}`}>
                  {exam.available ? 'Available Now' : 'Coming Soon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section id="features" className="lp-stats-section">
        <div ref={statsRef} className="lp-stats-grid">
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} active={statsInView} />
          ))}
        </div>
      </section>

      {/* ── Game Modes ─────────────────────────────────────────────────── */}
      <section id="modes" ref={modesRef} className="lp-modes-section">
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">Game Modes</p>
          <h2 className="lp-section-title">7 Ways to Study.<br /><span className="lp-title-accent">0 Ways to Be Bored.</span></h2>
          <p className="lp-section-sub">
            Every mode is a different way to test yourself. Pick your battle or try them all.
          </p>
        </div>

        <div className="lp-modes-grid">
          {MODES.map((mode, i) => (
            <ModeCard key={mode.name} mode={mode} index={i} />
          ))}
        </div>

        <div className="lp-modes-cta">
          <button className="lp-cta-primary" onClick={onSignIn}>Play All Modes Free →</button>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features-cards" className="lp-features-section">
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">Why Med Royale</p>
          <h2 className="lp-section-title">Everything You Need to<br /><span className="lp-title-accent">Ace Your Exams</span></h2>
          <p className="lp-section-sub">Built by medical students, for medical students.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="lp-hiw-section">
        <div className="lp-hiw-inner">
          <div className="lp-section-header">
            <p className="lp-section-eyebrow">How It Works</p>
            <h2 className="lp-section-title">Get Started in<br /><span className="lp-title-accent">30 Seconds</span></h2>
          </div>

          <div className="lp-steps">
            {STEPS.map((step, i) => (
              <div key={step.num} className="lp-step-wrap">
                <div className="lp-step">
                  <div className="lp-step-num">{step.num}</div>
                  <div className="lp-step-icon">{step.icon}</div>
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-desc">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="lp-step-arrow">→</div>
                )}
              </div>
            ))}
          </div>

          <div className="lp-hiw-cta">
            <button className="lp-cta-primary lp-cta-large" onClick={onSignIn}>
              Start Playing Free 🎮
            </button>
          </div>
        </div>
      </section>

      {/* ── Coming Soon Exams ──────────────────────────────────────────── */}
      <section className="lp-coming-section">
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">Global Expansion</p>
          <h2 className="lp-section-title">More Exams<br /><span className="lp-title-accent">Coming Soon</span></h2>
          <p className="lp-section-sub">We are expanding to cover medical licensing exams worldwide.</p>
        </div>

        <div className="lp-coming-grid">
          {COMING_SOON.map((exam) => (
            <div key={exam.name} className="lp-coming-card">
              <span className="lp-coming-badge">Coming Soon</span>
              <span className="lp-coming-flag">{exam.flag}</span>
              <h4 className="lp-coming-name">{exam.name}</h4>
              <p className="lp-coming-country">{exam.country}</p>
            </div>
          ))}
        </div>

        <p className="lp-coming-hint">Join now and be ready when your exam is added.</p>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-cta-glow lp-cta-glow-left" />
        <div className="lp-cta-glow lp-cta-glow-right" />
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to Start Winning?</h2>
          <p className="lp-cta-sub">Join medical students studying smarter with Med Royale</p>
          <button className="lp-cta-primary lp-cta-large lp-cta-google" onClick={onSignIn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <p className="lp-cta-disclaimer">100% Free. No credit card required.</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <span>⚕️</span>
              <span className="lp-footer-logo-text">Med Royale</span>
            </div>
            <p className="lp-footer-tagline">Built for future doctors</p>
            <div className="lp-footer-social">
              <a href="#" className="lp-social-btn" aria-label="Twitter/X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="lp-social-btn" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="#" className="lp-social-btn" aria-label="Discord">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
            </div>
          </div>

          <div className="lp-footer-links-col">
            <h4 className="lp-footer-col-title">Product</h4>
            <a href="#" className="lp-footer-link" onClick={e => { e.preventDefault(); scrollTo('modes'); }}>Game Modes</a>
            <a href="#" className="lp-footer-link" onClick={e => { e.preventDefault(); scrollTo('features-cards'); }}>Features</a>
            <a href="#" className="lp-footer-link" onClick={e => { e.preventDefault(); scrollTo('exams'); }}>Exams</a>
          </div>

          <div className="lp-footer-links-col">
            <h4 className="lp-footer-col-title">Company</h4>
            <a href="#" className="lp-footer-link">About</a>
            <a href="#" className="lp-footer-link">Contact</a>
            <a href="#" className="lp-footer-link">Privacy Policy</a>
            <a href="#" className="lp-footer-link">Terms of Service</a>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© 2026 Med Royale. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
