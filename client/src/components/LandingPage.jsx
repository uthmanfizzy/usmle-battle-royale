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

    </div>
  );
}
