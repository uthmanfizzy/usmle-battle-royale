import { useState, useEffect, useRef, useCallback } from 'react';
import './LandingPage.css';

// ── Data ───────────────────────────────────────────────────────────────────────

const EXAMS = [
  { name: 'USMLE Step 1', live: true  },
  { name: 'USMLE Step 2', live: false },
  { name: 'PLAB',         live: false },
  { name: 'AMC Australia',live: false },
  { name: 'MCCQE Canada', live: false },
  { name: 'FMGE India',   live: false },
  { name: 'MRCP',         live: false },
];

const STATS = [
  { value: 7,   suffix: '+', label: 'Game Modes',   icon: '🎮', isInf: false },
  { value: 100, suffix: '',  label: 'Tower Floors', icon: '🏰', isInf: false },
  { value: 6,   suffix: '+', label: 'Subjects',     icon: '📚', isInf: false },
  { value: 0,   suffix: '',  label: 'Questions',    icon: '❓', isInf: true  },
];

const MODES = [
  { icon: '⚔️', name: 'Battle Royale',  desc: 'Wrong answer = lose a life. 3 lives. Last doctor standing wins.',   color: '#EF4444', featured: true  },
  { icon: '⚡', name: 'Speed Race',     desc: 'First to 20 correct answers wins.',                                  color: '#3B82F6', featured: false },
  { icon: '🎯', name: 'Trivia Pursuit', desc: 'Collect all 6 subject wedges.',                                      color: '#8B5CF6', featured: false },
  { icon: '🏰', name: 'The Tower',      desc: '100 floors. Boss every 10th.',                                       color: '#F59E0B', featured: false },
  { icon: '🔬', name: 'Scan Master',    desc: 'Identify conditions from images.',                                   color: '#10B981', featured: false },
  { icon: '⚡', name: 'Buzz Fun',       desc: 'HY associations. 8 seconds each.',                                   color: '#F97316', featured: false },
  { icon: '🎮', name: 'Solo Practice',  desc: 'Study at your own pace.',                                            color: '#6366F1', featured: false },
];

const STEPS = [
  { num: '01', icon: '🔑', title: 'Sign in with Google',    desc: 'One click, no forms, no downloads'      },
  { num: '02', icon: '⚔️', title: 'Pick your battleground', desc: '7 game modes, thousands of questions'  },
  { num: '03', icon: '🏆', title: 'Study and compete',      desc: 'Learn through winning every round'     },
];

const GLOBAL = [
  { flag: '🇬🇧', name: 'PLAB',  country: 'United Kingdom' },
  { flag: '🇦🇺', name: 'AMC',   country: 'Australia'      },
  { flag: '🇨🇦', name: 'MCCQE', country: 'Canada'         },
  { flag: '🇮🇳', name: 'FMGE',  country: 'India'          },
  { flag: '🇳🇬', name: 'MDCN',  country: 'Nigeria'        },
];

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCountUp(target, active, dur = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, dur]);
  return val;
}

// ── Mockup components ──────────────────────────────────────────────────────────

function LobbyMockup() {
  return (
    <div className="lp-mockup">
      <div className="lp-mock-topbar">
        <span className="lp-mtb-dot r" /><span className="lp-mtb-dot y" /><span className="lp-mtb-dot g" />
        <span className="lp-mtb-title">⚔️ Battle Royale · Lobby MXQR7</span>
      </div>
      <div className="lp-mock-body">
        {[
          { name: 'DrFiz',    host: true,  delay: '0s'    },
          { name: 'MedBoss',  host: false, delay: '0.25s' },
          { name: 'CardioQ',  host: false, delay: '0.5s'  },
          { name: 'Joining…', host: false, delay: '0.8s', joining: true },
        ].map((p, i) => (
          <div key={i} className={`lp-mock-player ${p.joining ? 'joining' : ''}`} style={{ animationDelay: p.delay }}>
            <span className={`lp-mp-status ${p.joining ? 'pulse' : 'on'}`} />
            <span className="lp-mp-name">{p.name}</span>
            {p.host && <span className="lp-mp-badge">Host</span>}
            {!p.host && !p.joining && <span className="lp-mp-check">✓</span>}
          </div>
        ))}
        <button className="lp-mock-btn">Start Game →</button>
      </div>
    </div>
  );
}

function ProgressMockup() {
  const subjects = [
    { name: 'Cardiology',   pct: 84, color: '#EF4444' },
    { name: 'Pharmacology', pct: 67, color: '#8B5CF6' },
    { name: 'Neurology',    pct: 78, color: '#3B82F6' },
    { name: 'Microbiology', pct: 41, color: '#10B981' },
    { name: 'Biochemistry', pct: 55, color: '#F59E0B' },
  ];
  return (
    <div className="lp-mockup">
      <div className="lp-mock-topbar">
        <span className="lp-mtb-dot r" /><span className="lp-mtb-dot y" /><span className="lp-mtb-dot g" />
        <span className="lp-mtb-title">📊 Subject Mastery</span>
      </div>
      <div className="lp-mock-body">
        <div className="lp-mock-xp">
          <span>Level 12 · 4,200 XP</span>
          <div className="lp-mock-xpbar"><div className="lp-mock-xpfill" /></div>
        </div>
        {subjects.map((s, i) => (
          <div key={i} className="lp-mock-subj" style={{ animationDelay: `${i * 0.1}s` }}>
            <span className="lp-ms-name">{s.name}</span>
            <div className="lp-ms-track">
              <div className="lp-ms-fill" style={{ '--w': `${s.pct}%`, background: s.color }} />
            </div>
            <span className="lp-ms-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TowerMockup() {
  const floors = [
    { n: 10, label: '👹 Boss Floor',    cls: 'boss',      current: true  },
    { n: 9,  label: '⚔️ Challenge',    cls: 'challenge', done: true     },
    { n: 8,  label: '✅ Normal',        cls: 'normal',    done: true     },
    { n: 7,  label: '✅ Normal',        cls: 'normal',    done: true     },
    { n: 6,  label: '✅ Normal',        cls: 'normal',    done: true     },
  ];
  return (
    <div className="lp-mockup">
      <div className="lp-mock-topbar">
        <span className="lp-mtb-dot r" /><span className="lp-mtb-dot y" /><span className="lp-mtb-dot g" />
        <span className="lp-mtb-title">🏰 The Tower · Zone 1</span>
      </div>
      <div className="lp-mock-body">
        {floors.map((f, i) => (
          <div key={i} className={`lp-mock-floor ${f.cls} ${f.current ? 'current' : ''} ${f.done ? 'done' : ''}`}
            style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="lp-mf-n">F{f.n}</span>
            <span className="lp-mf-l">{f.label}</span>
            {f.current && <span className="lp-mf-you">← You</span>}
          </div>
        ))}
        <div className="lp-mock-tprog">
          <span>Zone Progress</span>
          <div className="lp-mock-tpbar"><div className="lp-mock-tpfill" /></div>
          <span>9/10</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ stat, active }) {
  const count = useCountUp(stat.isInf ? 0 : stat.value, active);
  return (
    <div className="lp-sc">
      <div className="lp-sc-num">{stat.isInf ? '∞' : `${count}${stat.suffix}`}</div>
      <div className="lp-sc-label">{stat.icon} {stat.label}</div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function LandingPage({ onSignIn }) {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [statsRef,   statsVisible]  = useInView(0.2);

  const modesRef    = useRef(null);
  const featuresRef = useRef(null);
  const examsRef    = useRef(null);

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

  const goTo = useCallback((ref) => {
    setMenuOpen(false);
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goToId = useCallback((id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="lp">
      <div className="lp-grid-bg" />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? 'solid' : ''}`}>
        <div className="lp-nav-inner">
          <button className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="lp-logo-icon">⚕️</span>
            <span className="lp-logo-text">Med Royale</span>
          </button>

          <div className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
            <button className="lp-nl" onClick={() => goToId('lp-feats')}>Features</button>
            <button className="lp-nl" onClick={() => goTo(modesRef)}>Game Modes</button>
            <button className="lp-nl" onClick={() => goTo(examsRef)}>Exams</button>
            <button className="lp-nl" onClick={() => goToId('lp-leaderboard')}>Leaderboard</button>
            <button className="lp-nav-cta mobile-only" onClick={onSignIn}>Play Free →</button>
          </div>

          <button className="lp-nav-cta desktop-only" onClick={onSignIn}>Play Free →</button>
          <button className={`lp-burger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      {menuOpen && <div className="lp-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-orb orb-1" />
        <div className="lp-orb orb-2" />
        <div className="lp-orb orb-3" />

        <div className="lp-hero-wrap">
          {/* Left: text */}
          <div className="lp-hero-text">
            <div className="lp-hero-pill">
              <span className="lp-pill-pulse" />
              USMLE Step 1 · Live Now
            </div>
            <h1 className="lp-h1">
              Study Smarter.<br />
              <span className="lp-grad">Beat Everyone.</span>
            </h1>
            <p className="lp-hero-sub">
              The world's first multiplayer medical exam battle platform.
              Turn revision into competition.
            </p>
            <div className="lp-hero-btns">
              <button className="lp-btn-pri" onClick={onSignIn}>Start for Free →</button>
              <button className="lp-btn-ghost" onClick={() => goTo(modesRef)}>See it in action ▶</button>
            </div>
            <div className="lp-hero-perks">
              <span>⚡ Free forever</span>
              <span className="lp-dot-sep">·</span>
              <span>🎮 7 game modes</span>
              <span className="lp-dot-sep">·</span>
              <span>🌍 Global leaderboards</span>
            </div>
          </div>

          {/* Right: floating UI cards */}
          <div className="lp-hero-vis">
            {/* Question card */}
            <div className="lp-fc lp-fc-q">
              <div className="lp-fc-head">
                <span className="lp-fc-badge">⚔️ Battle Royale</span>
                <span className="lp-fc-rnd">Round 3 / 20</span>
              </div>
              <p className="lp-fc-qtext">A 72-year-old with atrial fibrillation presents with nausea, yellow-green visual halos and bradycardia after dose adjustment…</p>
              <div className="lp-fc-opts">
                <div className="lp-opt correct">A — Digoxin toxicity ✓</div>
                <div className="lp-opt">B — Hypertensive emergency</div>
                <div className="lp-opt">C — MI with heart block</div>
                <div className="lp-opt">D — Aortic stenosis</div>
              </div>
              <div className="lp-fc-timebar"><div className="lp-fc-timefill" /></div>
            </div>

            {/* Leaderboard card */}
            <div className="lp-fc lp-fc-lb">
              <div className="lp-fc-lbtitle">🏆 Live Scores</div>
              {[
                { r:1, n:'DrFiz',   s:2400, fire:true  },
                { r:2, n:'You',     s:2100, me:true    },
                { r:3, n:'MedBoss', s:1850             },
              ].map(p => (
                <div key={p.r} className={`lp-lb-row ${p.me ? 'me' : ''}`}>
                  <span className="lp-lb-r">{p.r}</span>
                  <span className="lp-lb-n">{p.n}{p.fire ? ' 🔥' : ''}</span>
                  <span className="lp-lb-s">{p.s.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Sudden death card */}
            <div className="lp-fc lp-fc-sd">
              <div className="lp-sd-label">⚡ SUDDEN DEATH</div>
              <div className="lp-sd-vs">
                <div className="lp-sd-p">DrFiz<br /><span className="lp-sd-life">❤️</span></div>
                <div className="lp-sd-sep">VS</div>
                <div className="lp-sd-p">MedBoss<br /><span className="lp-sd-life">❤️</span></div>
              </div>
              <div className="lp-sd-clock">5 seconds…</div>
            </div>
          </div>
        </div>

        <div className="lp-scroll-hint" onClick={() => goTo(examsRef)}>
          <div className="lp-scroll-mouse"><div className="lp-scroll-wheel" /></div>
        </div>
      </section>

      {/* ── Exam Strip ──────────────────────────────────────────────────── */}
      <section ref={examsRef} className="lp-strip-section">
        <p className="lp-strip-label">Preparing students for exams worldwide</p>
        <div className="lp-marquee">
          <div className="lp-marquee-track">
            {[...EXAMS, ...EXAMS, ...EXAMS].map((e, i) => (
              <div key={i} className={`lp-exam-pill ${e.live ? 'live' : ''}`}>
                <span className={`lp-exam-indicator ${e.live ? 'live' : ''}`} />
                <span className="lp-exam-name">{e.name}</span>
                <span className={`lp-exam-tag ${e.live ? 'live' : ''}`}>{e.live ? 'Live' : 'Soon'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="lp-stats-section">
        <div ref={statsRef} className="lp-stats-row">
          {STATS.map((s, i) => <StatCard key={i} stat={s} active={statsVisible} />)}
        </div>
      </section>

      {/* ── Game Modes Bento ────────────────────────────────────────────── */}
      <section ref={modesRef} className="lp-modes-section">
        <div className="lp-section-hd">
          <span className="lp-eyebrow">Game Modes</span>
          <h2 className="lp-section-h2">One Platform.<br /><span className="lp-grad">Seven Battlegrounds.</span></h2>
          <p className="lp-section-p">Every study session feels different</p>
        </div>

        <div className="lp-bento">
          {/* Featured — Battle Royale */}
          <div className="lp-bc lp-bc-feat" style={{ '--c': MODES[0].color }}>
            <div className="lp-bc-glow" />
            <div className="lp-bc-feat-top">
              <span className="lp-bc-tag">Most Popular</span>
              <span className="lp-bc-icon">{MODES[0].icon}</span>
            </div>
            <h3 className="lp-bc-name">{MODES[0].name}</h3>
            <p className="lp-bc-desc">{MODES[0].desc}</p>
            <div className="lp-bc-fight">
              <div className="lp-bf-p p1">DrFiz ❤️❤️❤️</div>
              <div className="lp-bf-vs">VS</div>
              <div className="lp-bf-p p2">MedBoss ❤️</div>
            </div>
          </div>

          {/* Small mode cards */}
          {MODES.slice(1).map((m) => (
            <div key={m.id || m.name} className="lp-bc lp-bc-sm" style={{ '--c': m.color }}>
              <div className="lp-bc-sm-glow" />
              <span className="lp-bc-sm-icon">{m.icon}</span>
              <h4 className="lp-bc-sm-name">{m.name}</h4>
              <p className="lp-bc-sm-desc">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="lp-modes-cta">
          <button className="lp-btn-pri" onClick={onSignIn}>Play All Modes Free →</button>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="lp-feats" ref={featuresRef} className="lp-feats-section">
        <div className="lp-section-hd">
          <span className="lp-eyebrow">Features</span>
          <h2 className="lp-section-h2">Built to make you<br /><span className="lp-grad">actually study.</span></h2>
        </div>

        {/* Row 1 */}
        <div className="lp-feat-row">
          <div className="lp-feat-text">
            <span className="lp-feat-num">01</span>
            <h3 className="lp-feat-title">Real-time multiplayer battles</h3>
            <p className="lp-feat-desc">Challenge classmates from anywhere. Live lobbies, instant results, real competition. No more studying alone in silence.</p>
            <button className="lp-feat-link" onClick={onSignIn}>Get started →</button>
          </div>
          <div className="lp-feat-vis"><LobbyMockup /></div>
        </div>

        {/* Row 2 (flipped) */}
        <div className="lp-feat-row flip">
          <div className="lp-feat-text">
            <span className="lp-feat-num">02</span>
            <h3 className="lp-feat-title">Track every step of your progress</h3>
            <p className="lp-feat-desc">Subject mastery bars, performance graphs, streak counters and XP levels. Know exactly where you stand and what to fix.</p>
            <button className="lp-feat-link" onClick={onSignIn}>Get started →</button>
          </div>
          <div className="lp-feat-vis"><ProgressMockup /></div>
        </div>

        {/* Row 3 */}
        <div className="lp-feat-row">
          <div className="lp-feat-text">
            <span className="lp-feat-num">03</span>
            <h3 className="lp-feat-title">Climb The Tower. All 100 floors.</h3>
            <p className="lp-feat-desc">A solo adventure through every USMLE subject. Normal floors, challenge floors and brutal boss floors. Progress saves automatically.</p>
            <button className="lp-feat-link" onClick={onSignIn}>Get started →</button>
          </div>
          <div className="lp-feat-vis"><TowerMockup /></div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="lp-hiw-section">
        <div className="lp-section-hd">
          <span className="lp-eyebrow">How It Works</span>
          <h2 className="lp-section-h2">Up and running<br /><span className="lp-grad">in 30 seconds.</span></h2>
        </div>
        <div className="lp-hiw-steps">
          {STEPS.map((s, i) => (
            <div key={i} className="lp-hiw-step">
              {i < STEPS.length - 1 && <div className="lp-hiw-line" />}
              <div className="lp-hiw-bubble">{s.num}</div>
              <div className="lp-hiw-icon">{s.icon}</div>
              <h3 className="lp-hiw-title">{s.title}</h3>
              <p className="lp-hiw-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-hiw-cta">
          <button className="lp-btn-pri lp-btn-lg" onClick={onSignIn}>Start Playing Free 🎮</button>
        </div>
      </section>

      {/* ── Going Global ────────────────────────────────────────────────── */}
      <section className="lp-global-section">
        <div className="lp-section-hd">
          <span className="lp-eyebrow">Going Global</span>
          <h2 className="lp-section-h2">USMLE is<br /><span className="lp-grad">just the beginning.</span></h2>
          <p className="lp-section-p">Expanding to cover licensing exams worldwide</p>
        </div>
        <div className="lp-global-grid">
          {GLOBAL.map((g) => (
            <div key={g.name} className="lp-gc">
              <span className="lp-gc-pill">Coming Soon</span>
              <span className="lp-gc-flag">{g.flag}</span>
              <span className="lp-gc-name">{g.name}</span>
              <span className="lp-gc-country">{g.country}</span>
            </div>
          ))}
        </div>
        <p className="lp-global-hint">Join now and be ready when your exam launches.</p>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="lp-fcta">
        <div className="lp-fcta-orb orb-a" />
        <div className="lp-fcta-orb orb-b" />
        <div className="lp-fcta-inner">
          <h2 className="lp-fcta-h2">Your exam<br /><span className="lp-grad">is waiting.</span></h2>
          <p className="lp-fcta-p">Join medical students who study smarter with Med Royale</p>
          <button className="lp-btn-pri lp-btn-xl lp-btn-glow" onClick={onSignIn}>
            Start Playing Free →
          </button>
          <p className="lp-fcta-fine">No credit card. No download. Just sign in.</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">⚕️ <span>Med Royale</span></div>
            <p className="lp-footer-tl">Built for future doctors 🏥</p>
            <div className="lp-socials">
              <a href="#" className="lp-soc" aria-label="Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="lp-soc" aria-label="Discord">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="#" className="lp-soc" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
            </div>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <button onClick={() => goToId('lp-feats')}>Features</button>
            <button onClick={() => goTo(modesRef)}>Game Modes</button>
            <button onClick={() => goToId('lp-leaderboard')}>Leaderboard</button>
          </div>
          <div className="lp-footer-col">
            <h4>Exams</h4>
            <button>USMLE Step 1</button>
            <button>Coming Soon →</button>
          </div>
          <div className="lp-footer-col">
            <h4>Company</h4>
            <button>About</button>
            <button>Contact</button>
            <button>Privacy Policy</button>
            <button>Terms of Service</button>
          </div>
        </div>
        <div className="lp-footer-bar">
          <span>© 2026 Med Royale. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
