import { useState, useEffect, useRef } from 'react';
import { getToken, clearToken, fetchMe, authFetch } from '../auth';
import './StatsPage.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getTitle(lvl) {
  if (lvl >= 100) return 'Med Royale Master 👑';
  if (lvl >= 76)  return 'Medical Legend 🌟';
  if (lvl >= 51)  return 'Attending Physician 👨‍⚕️';
  if (lvl >= 41)  return 'Chief Resident 🏥';
  if (lvl >= 31)  return 'Board Crusher ⚔️';
  if (lvl >= 21)  return 'Diagnostic Expert 🧠';
  if (lvl >= 11)  return 'Clinical Explorer 🔬';
  if (lvl >= 6)   return 'Resident Scholar 📚';
  return 'Medical Rookie 🩺';
}

function getRingColor(lvl) {
  if (lvl >= 100) return '#FFD700';
  if (lvl >= 76)  return '#FF4444';
  if (lvl >= 51)  return '#FF6B35';
  if (lvl >= 41)  return '#F59E0B';
  if (lvl >= 31)  return '#10B981';
  if (lvl >= 21)  return '#8B5CF6';
  if (lvl >= 11)  return '#7C3AED';
  if (lvl >= 6)   return '#3B82F6';
  return '#6B7280';
}

function getMasteryRank(pct) {
  if (pct >= 100) return 'Master ⭐';
  if (pct >= 81)  return 'Expert';
  if (pct >= 61)  return 'Proficient';
  if (pct >= 41)  return 'Competent';
  if (pct >= 21)  return 'Apprentice';
  return 'Novice';
}

function getMasteryColor(pct) {
  if (pct >= 81) return '#F59E0B';
  if (pct >= 61) return '#10B981';
  if (pct >= 41) return '#3B82F6';
  if (pct >= 21) return '#6366F1';
  return '#4B5563';
}

const SUBJECTS = [
  { id: 'cardiology',    label: 'Cardiology',    icon: '❤️' },
  { id: 'neurology',     label: 'Neurology',     icon: '🧠' },
  { id: 'pharmacology',  label: 'Pharmacology',  icon: '💊' },
  { id: 'microbiology',  label: 'Microbiology',  icon: '🦠' },
  { id: 'biochemistry',  label: 'Biochemistry',  icon: '⚗️' },
  { id: 'biostatistics', label: 'Biostatistics', icon: '📊' },
];

const MILESTONES = [
  { level: 1,   title: 'Medical Rookie 🩺',      reward: '🎮 Access Granted'  },
  { level: 5,   title: 'Resident Scholar 📚',     reward: '⚡ Speed Booster'   },
  { level: 10,  title: 'Clinical Explorer 🔬',    reward: '🛡️ Clan Access'    },
  { level: 20,  title: 'Diagnostic Expert 🧠',    reward: '👑 Elite Frame'     },
  { level: 30,  title: 'Board Crusher ⚔️',        reward: '🔥 Fire Badge'      },
  { level: 40,  title: 'Chief Resident 🏥',       reward: '💎 Diamond Rank'    },
  { level: 50,  title: 'Attending Physician 👨‍⚕️', reward: '🌟 Gold Aura'      },
  { level: 75,  title: 'Medical Legend 🌟',       reward: '⭐ Legend Title'    },
  { level: 100, title: 'Med Royale Master 👑',    reward: '👑 Master Crown'    },
];

// ── Achievement sound ──────────────────────────────────────────────────────────

function playAchievementSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.38]].forEach(([freq, d]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = ctx.currentTime + d;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.6);
    });
  } catch {}
}

// ── Canvas particles ───────────────────────────────────────────────────────────

function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 70 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      vx:    (Math.random() - 0.5) * 0.25,
      vy:    -(Math.random() * 0.35 + 0.08),
      r:     Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.35 + 0.08,
      col:   Math.random() > 0.55 ? '124,58,237' : '245,158,11',
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -4)              { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        if (p.x < -4)                p.x = canvas.width + 4;
        if (p.x > canvas.width + 4)  p.x = -4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="sp-particles" aria-hidden="true" />;
}

// ── Count-up hook ──────────────────────────────────────────────────────────────

function useCountUp(target, active, dur = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, dur]);
  return val;
}

// ── Intersection hook ─────────────────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

// ── Player hero card ───────────────────────────────────────────────────────────

function PlayerCard({ user }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 80); return () => clearTimeout(t); }, []);

  const level     = user.level || 1;
  const xp        = user.xp    || 0;
  const xpInto    = xp % 500;
  const xpPct     = Math.round((xpInto / 500) * 100);
  const ringColor = getRingColor(level);
  const title     = getTitle(level);

  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const winRate     = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const streak      = user.current_streak || user.streak || 0;

  const xpAnim = useCountUp(xpInto, entered);

  return (
    <div className={`sp-hero-card ${entered ? 'sp-entered' : ''}`}>
      {/* Glow behind card */}
      <div className="sp-hero-glow" style={{ background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)` }} />

      <div className="sp-hero-left">
        {/* Avatar + animated ring */}
        <div className="sp-avatar-wrap" style={{ '--ring': ringColor }}>
          <div className="sp-avatar-ring" />
          <div className="sp-avatar-ring sp-avatar-ring2" />
          {user.avatar_url
            ? <img src={user.avatar_url} alt={user.username} className="sp-avatar" referrerPolicy="no-referrer" />
            : <div className="sp-avatar-ph">{(user.username || '?')[0].toUpperCase()}</div>
          }
          <div className="sp-lvl-badge" style={{ '--ring': ringColor }}>LVL {level}</div>
        </div>

        {/* Name / title / XP */}
        <div className="sp-hero-info">
          <div className="sp-name-row">
            <h1 className="sp-username">{user.username}</h1>
            {user.clan?.tag && <span className="sp-clan-tag">[{user.clan.tag}]</span>}
          </div>
          <div className="sp-char-title">{title}</div>

          <div className="sp-xp-block">
            <div className="sp-xp-meta">
              <span className="sp-xp-cur">{xpAnim.toLocaleString()} / 500 XP</span>
              <span className="sp-xp-next">→ Level {level + 1}</span>
            </div>
            <div className="sp-xp-track">
              <div className="sp-xp-fill" style={{ width: entered ? `${xpPct}%` : '0%' }}>
                <div className="sp-xp-shimmer" />
              </div>
            </div>
            <div className="sp-xp-total-label">{xp.toLocaleString()} total XP</div>
          </div>
        </div>
      </div>

      {/* Quick stat boxes */}
      <div className="sp-hero-right">
        {[
          { icon: '🎮', val: gamesPlayed,       label: 'Games Played' },
          { icon: '🏆', val: gamesWon,           label: 'Games Won'   },
          { icon: '🎯', val: `${winRate}%`,      label: 'Win Rate'    },
          { icon: '🔥', val: `${streak}d`,       label: 'Streak'      },
        ].map((s, i) => (
          <div key={i} className="sp-qstat" style={{ '--delay': `${i * 0.07 + 0.3}s` }}>
            <div className="sp-qstat-icon">{s.icon}</div>
            <div className="sp-qstat-val">{s.val}</div>
            <div className="sp-qstat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rank row ───────────────────────────────────────────────────────────────────

function RankRow({ user, globalRank }) {
  const towerFloor = user.tower_floor || user.tower_progress || 0;
  const streak     = user.current_streak || user.streak || 0;
  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const winRate     = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const pills = [
    { icon: '👑', val: globalRank ? `#${globalRank}` : '—', label: 'Global Rank',    accent: '#F59E0B' },
    { icon: '🏰', val: `${towerFloor}/100`,                  label: 'Tower Floor',   accent: '#7C3AED' },
    { icon: '🎯', val: `${winRate}%`,                         label: 'Win Rate',      accent: '#10B981' },
    { icon: '🔥', val: `${streak} day${streak !== 1 ? 's' : ''}`, label: 'Daily Streak', accent: '#EF4444' },
  ];

  return (
    <div className="sp-rank-row">
      {pills.map((p, i) => (
        <div key={i} className="sp-rank-pill" style={{ '--acc': p.accent, '--delay': `${i * 0.08}s` }}>
          <div className="sp-rp-icon">{p.icon}</div>
          <div className="sp-rp-val" style={{ color: p.accent }}>{p.val}</div>
          <div className="sp-rp-label">{p.label}</div>
          <div className="sp-rp-glow" />
        </div>
      ))}
    </div>
  );
}

// ── Subject mastery ────────────────────────────────────────────────────────────

function SubjectMastery({ mastery }) {
  const [ref, vis] = useInView(0.08);

  function getPct(id) {
    const m = mastery.find(m => m.subject === id);
    return m ? (m.mastery_percent || 0) : 0;
  }

  return (
    <div ref={ref} className="sp-panel sp-mastery-panel">
      <div className="sp-panel-hd">
        <span className="sp-panel-icon">⚔️</span>
        <h2 className="sp-panel-title">Subject Mastery</h2>
      </div>

      <div className="sp-skill-list">
        {SUBJECTS.map((s, i) => {
          const pct    = getPct(s.id);
          const rank   = getMasteryRank(pct);
          const color  = getMasteryColor(pct);
          const expert = pct >= 81;
          const master = pct >= 100;

          return (
            <div key={s.id} className={`sp-skill-row ${expert ? 'sp-skill-expert' : ''}`}
              style={{ '--delay': `${i * 0.09}s`, '--col': color }}>
              <div className="sp-skill-left">
                <span className="sp-skill-icon">{s.icon}</span>
                <div>
                  <div className="sp-skill-name">{s.label}</div>
                  <div className="sp-skill-rank" style={{ color }}>{rank}</div>
                </div>
              </div>
              <div className="sp-skill-bar">
                <div className="sp-skill-track">
                  <div
                    className={`sp-skill-fill ${master ? 'sp-master-fill' : ''}`}
                    style={{
                      width: vis ? `${pct}%` : '0%',
                      background: master
                        ? 'linear-gradient(90deg, #F59E0B, #FFD700, #F59E0B)'
                        : color,
                      transitionDelay: vis ? `${i * 0.09}s` : '0s',
                    }}
                  />
                  {expert && <div className="sp-skill-glow-line" style={{ '--col': color }} />}
                </div>
                {master && <span className="sp-master-star">★</span>}
              </div>
              <span className="sp-skill-pct" style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Level journey map ──────────────────────────────────────────────────────────

function LevelMap({ level }) {
  const [ref, vis] = useInView(0.06);

  return (
    <div ref={ref} className="sp-panel sp-journey-panel">
      <div className="sp-panel-hd">
        <span className="sp-panel-icon">🗺️</span>
        <h2 className="sp-panel-title">Your Journey</h2>
      </div>

      <div className="sp-timeline-wrap">
        <div className="sp-timeline">
          {MILESTONES.map((m, i) => {
            const done    = level > m.level;
            const current = !done && (i === MILESTONES.length - 1
              ? level >= m.level
              : level >= m.level && level < MILESTONES[i + 1].level);
            const locked  = !done && !current;

            return (
              <div key={m.level} className={`sp-cp ${done ? 'done' : ''} ${current ? 'current' : ''} ${locked ? 'locked' : ''}`}
                style={{ '--delay': vis ? `${i * 0.1}s` : '0s' }}>

                {/* Connector line */}
                {i > 0 && (
                  <div className={`sp-cp-line ${done || current ? 'lit' : ''}`} />
                )}

                {/* Circle */}
                <div className="sp-cp-circle">
                  {done ? '✓' : current ? '★' : '🔒'}
                </div>

                {/* Info */}
                <div className="sp-cp-body">
                  <div className="sp-cp-lvl">Lv {m.level}</div>
                  <div className="sp-cp-name">{m.title}</div>
                  <div className="sp-cp-reward">{m.reward}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Loading screen ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="sp-load">
      <div className="sp-load-ring" />
      <div className="sp-load-text">Loading your stats…</div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [user,       setUser]       = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [ready,      setReady]      = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }

    fetchMe().then(me => {
      if (!me) { clearToken(); window.location.href = '/'; return; }
      setUser(me);
      setReady(true);
      playAchievementSound();

      authFetch('/api/leaderboard/players')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d?.players) return;
          const found = d.players.find(p => p.id === me.id);
          if (found) setGlobalRank(found.rank);
        })
        .catch(() => {});
    });
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="sp">
      <Particles />

      <nav className="sp-nav">
        <button className="sp-nav-back" onClick={() => window.location.href = '/dashboard'}>
          ← Dashboard
        </button>
        <span className="sp-nav-brand">⚕️ Player Stats</span>
        <div />
      </nav>

      <div className="sp-page">
        <PlayerCard user={user} />
        <RankRow user={user} globalRank={globalRank} />
        <SubjectMastery mastery={user.subject_mastery || []} />
        <LevelMap level={user.level || 1} />
        <div className="sp-footer-space" />
      </div>
    </div>
  );
}
