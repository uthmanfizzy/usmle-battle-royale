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

// ── Achievement definitions ────────────────────────────────────────────────────

const ACHIEVEMENT_CATS = ['Battle', 'Knowledge', 'Tower', 'Social'];

const ACHIEVEMENT_DEFS = [
  // Battle
  { id: 'first_blood',   cat: 'Battle',    icon: '🎮', name: 'First Blood',          desc: 'Play your first game',                check: s => s.gamesPlayed >= 1         },
  { id: 'survivor',      cat: 'Battle',    icon: '⚔️', name: 'Survivor',              desc: 'Win your first Battle Royale',        check: s => s.gamesWon >= 1            },
  { id: 'unstoppable',   cat: 'Battle',    icon: '💀', name: 'Unstoppable',           desc: 'Win 10 Battle Royales',               check: s => s.gamesWon >= 10           },
  { id: 'apex_predator', cat: 'Battle',    icon: '👑', name: 'Apex Predator',         desc: 'Win 50 Battle Royales',               check: s => s.gamesWon >= 50           },
  { id: 'speed_demon',   cat: 'Battle',    icon: '⚡', name: 'Speed Demon',           desc: 'Win a Speed Race',                    check: s => s.gamesWon >= 3            },
  { id: 'trivia_master', cat: 'Battle',    icon: '🎯', name: 'Trivia Master',         desc: 'Win a Trivia Pursuit game',           check: s => s.gamesWon >= 5            },
  // Knowledge
  { id: 'quick_learner', cat: 'Knowledge', icon: '🧠', name: 'Quick Learner',         desc: 'Answer 100 questions correctly',      check: s => s.totalCorrect >= 100      },
  { id: 'scholar',       cat: 'Knowledge', icon: '📚', name: 'Scholar',               desc: 'Answer 500 questions correctly',      check: s => s.totalCorrect >= 500      },
  { id: 'encyclopaedia', cat: 'Knowledge', icon: '🎓', name: 'Encyclopaedia',         desc: 'Answer 1000 questions correctly',     check: s => s.totalCorrect >= 1000     },
  { id: 'cardio_cert',   cat: 'Knowledge', icon: '❤️', name: 'Cardiology Certified', desc: 'Reach 80% mastery in Cardiology',     check: s => s.getMastery('cardiology') >= 80    },
  { id: 'pharma_pro',    cat: 'Knowledge', icon: '💊', name: 'Pharma Pro',            desc: 'Reach 80% mastery in Pharmacology',   check: s => s.getMastery('pharmacology') >= 80  },
  { id: 'bug_expert',    cat: 'Knowledge', icon: '🦠', name: 'Bug Expert',            desc: 'Reach 80% mastery in Microbiology',   check: s => s.getMastery('microbiology') >= 80  },
  // Tower
  { id: 'tower_rookie',  cat: 'Tower',     icon: '🏰', name: 'Tower Rookie',          desc: 'Complete floor 10',                   check: s => s.towerFloor >= 10         },
  { id: 'halfway_hero',  cat: 'Tower',     icon: '🗡️', name: 'Halfway Hero',          desc: 'Complete floor 50',                   check: s => s.towerFloor >= 50         },
  { id: 'tower_master',  cat: 'Tower',     icon: '👑', name: 'Tower Master',          desc: 'Complete all 100 floors',             check: s => s.towerFloor >= 100        },
  // Social
  { id: 'team_player',   cat: 'Social',    icon: '👥', name: 'Team Player',           desc: 'Join a clan',                         check: s => !!s.hasClan                },
  { id: 'on_fire',       cat: 'Social',    icon: '🔥', name: 'On Fire',               desc: 'Get a 10-answer streak',              check: s => s.streak >= 10             },
  { id: 'dedicated',     cat: 'Social',    icon: '📅', name: 'Dedicated',             desc: '7 day login streak',                  check: s => s.streak >= 7              },
  { id: 'veteran',       cat: 'Social',    icon: '💎', name: 'Veteran',               desc: '30 day login streak',                 check: s => s.streak >= 30             },
];

function buildAchievements(user) {
  const mastery     = user.subject_mastery || [];
  const getMastery  = id => mastery.find(m => m.subject === id)?.mastery_percent || 0;
  const totalCorrect = mastery.reduce((s, m) => s + (m.questions_correct || 0), 0);
  const stats = {
    gamesPlayed:  user.games_played  || 0,
    gamesWon:     user.games_won     || 0,
    totalCorrect,
    towerFloor:   user.tower_floor || user.tower_progress || 0,
    streak:       user.current_streak || user.streak || 0,
    hasClan:      !!user.clan_id,
    getMastery,
  };
  return ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: a.check(stats) }));
}

// ── Placement helpers ──────────────────────────────────────────────────────────

const PLACEMENT_META = {
  1: { label: '1st Place',  emoji: '🥇', color: '#F59E0B', border: '#F59E0B' },
  2: { label: '2nd Place',  emoji: '🥈', color: '#9CA3AF', border: '#9CA3AF' },
  3: { label: '3rd Place',  emoji: '🥉', color: '#CD7F32', border: '#CD7F32' },
};
function getPlacementMeta(placement) {
  return PLACEMENT_META[placement] || { label: `Eliminated`, emoji: '💀', color: '#EF4444', border: '#EF4444' };
}

const MODE_META = {
  battle_royale:   { icon: '⚔️', label: 'Battle Royale' },
  speed_race:      { icon: '⚡', label: 'Speed Race'     },
  trivia_pursuit:  { icon: '🎯', label: 'Trivia Pursuit' },
  buzz_fun:        { icon: '🔔', label: 'Buzz Fun'       },
  scan_master:     { icon: '🔬', label: 'Scan Master'    },
};
function getModeMeta(mode) {
  return MODE_META[mode] || { icon: '⚔️', label: 'Battle Royale' };
}

const SUBJECT_LABELS = {
  cardiology: 'Cardiology ❤️', neurology: 'Neurology 🧠',
  pharmacology: 'Pharmacology 💊', microbiology: 'Microbiology 🦠',
  biochemistry: 'Biochemistry ⚗️', biostatistics: 'Biostatistics 📊',
  all: 'All Subjects',
};

// ── Sound ──────────────────────────────────────────────────────────────────────

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
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25, vy: -(Math.random() * 0.35 + 0.08),
      r: Math.random() * 1.6 + 0.4, alpha: Math.random() * 0.35 + 0.08,
      col: Math.random() > 0.55 ? '124,58,237' : '245,158,11',
    }));
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -4)               { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        if (p.x < -4)                 p.x = canvas.width + 4;
        if (p.x > canvas.width + 4)   p.x = -4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${p.alpha})`; ctx.fill();
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

// ── Intersection hook ──────────────────────────────────────────────────────────

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
      <div className="sp-hero-glow" style={{ background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)` }} />
      <div className="sp-hero-left">
        <div className="sp-avatar-wrap" style={{ '--ring': ringColor }}>
          <div className="sp-avatar-ring" />
          <div className="sp-avatar-ring sp-avatar-ring2" />
          {user.avatar_url
            ? <img src={user.avatar_url} alt={user.username} className="sp-avatar" referrerPolicy="no-referrer" />
            : <div className="sp-avatar-ph">{(user.username || '?')[0].toUpperCase()}</div>
          }
          <div className="sp-lvl-badge" style={{ '--ring': ringColor }}>LVL {level}</div>
        </div>
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
  const towerFloor  = user.tower_floor || user.tower_progress || 0;
  const streak      = user.current_streak || user.streak || 0;
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
                      background: master ? 'linear-gradient(90deg, #F59E0B, #FFD700, #F59E0B)' : color,
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
                {i > 0 && <div className={`sp-cp-line ${done || current ? 'lit' : ''}`} />}
                <div className="sp-cp-circle">{done ? '✓' : current ? '★' : '🔒'}</div>
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

// ── Achievements ───────────────────────────────────────────────────────────────

function Achievements({ user }) {
  const [ref, vis] = useInView(0.05);
  const [activeCat, setActiveCat] = useState('All');
  const achievements = buildAchievements(user);
  const unlockCount  = achievements.filter(a => a.unlocked).length;

  const cats = ['All', ...ACHIEVEMENT_CATS];
  const filtered = activeCat === 'All' ? achievements : achievements.filter(a => a.cat === activeCat);

  return (
    <div ref={ref} className="sp-panel sp-achievements-panel">
      <div className="sp-panel-hd">
        <span className="sp-panel-icon">🏆</span>
        <h2 className="sp-panel-title">Achievements</h2>
        <span className="sp-ach-count">{unlockCount}/{achievements.length}</span>
      </div>

      {/* Category filter tabs */}
      <div className="sp-ach-tabs">
        {cats.map(c => (
          <button key={c}
            className={`sp-ach-tab ${activeCat === c ? 'active' : ''}`}
            onClick={() => setActiveCat(c)}
          >{c}</button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="sp-ach-grid">
        {filtered.map((a, i) => (
          <div
            key={a.id}
            className={`sp-ach-card ${a.unlocked ? 'unlocked' : 'locked'}`}
            style={{ '--delay': vis ? `${Math.min(i * 0.04, 0.6)}s` : '0s' }}
          >
            {a.unlocked && <div className="sp-ach-glow" />}
            <div className="sp-ach-icon-wrap">
              {a.unlocked
                ? <span className="sp-ach-icon">{a.icon}</span>
                : <span className="sp-ach-icon sp-ach-locked-icon">🔒</span>
              }
            </div>
            <div className="sp-ach-body">
              <div className="sp-ach-name">{a.unlocked ? a.name : '???'}</div>
              <div className="sp-ach-desc">{a.unlocked ? a.desc : 'Keep playing to unlock'}</div>
              {a.unlocked && (
                <div className="sp-ach-status">
                  <span className="sp-ach-check">✓</span> Unlocked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recent Games ───────────────────────────────────────────────────────────────

function RecentGames({ history }) {
  const [ref, vis] = useInView(0.05);

  if (!history?.length) {
    return (
      <div className="sp-panel">
        <div className="sp-panel-hd">
          <span className="sp-panel-icon">⚔️</span>
          <h2 className="sp-panel-title">Battle History</h2>
        </div>
        <div className="sp-empty">No games played yet. Jump in and battle!</div>
      </div>
    );
  }

  const fmtDate = iso => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div ref={ref} className="sp-panel sp-history-panel">
      <div className="sp-panel-hd">
        <span className="sp-panel-icon">⚔️</span>
        <h2 className="sp-panel-title">Battle History</h2>
        <span className="sp-hist-count">Last {history.length} games</span>
      </div>

      <div className="sp-hist-list">
        {history.map((g, i) => {
          const pm   = getPlacementMeta(g.placement);
          const mm   = getModeMeta(g.game_mode);
          const acc  = g.total_questions > 0
            ? Math.round((g.correct_answers / g.total_questions) * 100)
            : 0;

          return (
            <div
              key={i}
              className={`sp-hist-card ${g.placement <= 3 ? `sp-hist-p${g.placement}` : 'sp-hist-elim'}`}
              style={{ '--pm-color': pm.color, '--delay': vis ? `${Math.min(i * 0.05, 0.4)}s` : '0s' }}
            >
              <div className="sp-hist-left">
                <div className="sp-hist-mode">
                  <span className="sp-hist-mode-icon">{mm.icon}</span>
                  <span className="sp-hist-mode-label">{mm.label}</span>
                </div>
                <div className="sp-hist-subject">{SUBJECT_LABELS[g.subject] || g.subject || 'All Subjects'}</div>
              </div>

              <div className="sp-hist-mid">
                <div className="sp-hist-placement" style={{ color: pm.color }}>
                  {pm.emoji} {pm.label}
                </div>
                <div className="sp-hist-acc">{g.correct_answers}/{g.total_questions} correct · {acc}%</div>
              </div>

              <div className="sp-hist-right">
                <div className="sp-hist-xp">+{g.xp_earned} XP</div>
                <div className="sp-hist-date">{fmtDate(g.played_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── XP Graph ───────────────────────────────────────────────────────────────────

function XpGraph({ days }) {
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [ref, vis] = useInView(0.05);

  if (!days?.length) return null;

  const VW = 600, VH = 110;
  const PAD = { t: 14, b: 26, l: 8, r: 8 };
  const pW  = VW - PAD.l - PAD.r;
  const pH  = VH - PAD.t - PAD.b;
  const maxXp = Math.max(...days.map(d => d.xp), 50);

  const ptX = i  => PAD.l + (i / Math.max(days.length - 1, 1)) * pW;
  const ptY = xp => PAD.t + pH - (xp / maxXp) * pH;

  // Smooth path using cubic bezier interpolation
  let linePath = `M ${ptX(0)} ${ptY(days[0].xp)}`;
  for (let i = 1; i < days.length; i++) {
    const cpX = (ptX(i - 1) + ptX(i)) / 2;
    linePath += ` C ${cpX} ${ptY(days[i-1].xp)} ${cpX} ${ptY(days[i].xp)} ${ptX(i)} ${ptY(days[i].xp)}`;
  }
  const areaPath = linePath
    + ` L ${ptX(days.length - 1)} ${PAD.t + pH} L ${PAD.l} ${PAD.t + pH} Z`;

  const zoneW = pW / Math.max(days.length, 1);

  const fmtDate = s => {
    try { const d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return s; }
  };

  return (
    <div ref={ref} className="sp-panel sp-graph-panel">
      <div className="sp-panel-hd">
        <span className="sp-panel-icon">📈</span>
        <h2 className="sp-panel-title">XP Over Time</h2>
        <span className="sp-graph-range">Last 30 days</span>
      </div>

      <div className="sp-graph-outer">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="sp-graph-svg"
          style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.5s' }}
        >
          <defs>
            <linearGradient id="xpAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--purple)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f}
              x1={PAD.l} x2={VW - PAD.r}
              y1={PAD.t + f * pH} y2={PAD.t + f * pH}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          ))}

          {/* Area */}
          <path d={areaPath} fill="url(#xpAreaGrad)" />

          {/* Glow line */}
          <path d={linePath} fill="none"
            stroke="var(--purple)" strokeWidth="6"
            strokeOpacity="0.2" strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Main line */}
          <path d={linePath} fill="none"
            stroke="var(--purple2)" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Dots for days with XP */}
          {days.map((d, i) => (
            <circle key={i}
              cx={ptX(i)} cy={ptY(d.xp)}
              r={hoverIdx === i ? 5 : d.xp > 0 ? 2.5 : 0}
              fill={hoverIdx === i ? 'var(--purple2)' : 'var(--bg2)'}
              stroke="var(--purple2)" strokeWidth="1.5"
              style={{ cursor: 'crosshair', transition: 'r 0.1s' }}
            />
          ))}

          {/* Hover zones */}
          {days.map((_, i) => (
            <rect key={`hz${i}`}
              x={ptX(i) - zoneW / 2} y={0}
              width={zoneW} height={VH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(-1)}
            />
          ))}

          {/* X-axis date labels every 5 days */}
          {days.filter((_, i) => i === 0 || i === days.length - 1 || i % 5 === 0).map((d, _, arr) => {
            const i = days.indexOf(d);
            return (
              <text key={d.date}
                x={ptX(i)} y={VH - 4}
                textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}
                fontSize="7" fill="rgba(232,232,244,0.28)"
              >{fmtDate(d.date)}</text>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoverIdx >= 0 && (
          <div className="sp-graph-tip" style={{
            left: `calc(${((ptX(hoverIdx) - PAD.l) / pW * 100).toFixed(1)}% - 40px)`,
          }}>
            <div className="sp-tip-xp">+{days[hoverIdx].xp} XP</div>
            <div className="sp-tip-date">{fmtDate(days[hoverIdx].date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Comparison ─────────────────────────────────────────────────────────────────

function CompareBar({ label, yours, global: avg, format = v => `${v}%` }) {
  const [ref, vis] = useInView(0.1);
  const max = Math.max(yours, avg, 1);
  return (
    <div ref={ref} className="sp-cmp-item">
      <div className="sp-cmp-label">{label}</div>
      <div className="sp-cmp-bars">
        {[
          { who: 'You', val: yours, cls: 'yours' },
          { who: 'Avg', val: avg,   cls: 'global' },
        ].map(row => (
          <div key={row.who} className="sp-cmp-row">
            <span className="sp-cmp-who">{row.who}</span>
            <div className="sp-cmp-track">
              <div
                className={`sp-cmp-fill sp-cmp-${row.cls}`}
                style={{ width: vis ? `${(row.val / max) * 100}%` : '0%' }}
              />
            </div>
            <span className="sp-cmp-val">{format(row.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comparison({ user, globalStats }) {
  const mastery     = user.subject_mastery || [];
  const totalC      = mastery.reduce((s, m) => s + (m.questions_correct   || 0), 0);
  const totalA      = mastery.reduce((s, m) => s + (m.questions_attempted || 0), 0);
  const yourAcc     = totalA > 0 ? Math.round((totalC / totalA) * 100) : 0;
  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const yourWin     = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const yourFloor   = user.tower_floor || user.tower_progress || 0;

  const g = globalStats || { accuracy: 50, win_rate: 20, tower_floor: 5 };

  return (
    <div className="sp-panel sp-cmp-panel">
      <div className="sp-panel-hd">
        <span className="sp-panel-icon">🌍</span>
        <h2 className="sp-panel-title">How You Stack Up</h2>
      </div>
      <div className="sp-cmp-grid">
        <CompareBar label="Answer Accuracy"  yours={yourAcc}   global={g.accuracy}    format={v => `${v}%`}  />
        <CompareBar label="Win Rate"          yours={yourWin}   global={g.win_rate}    format={v => `${v}%`}  />
        <CompareBar label="Tower Floor"       yours={yourFloor} global={g.tower_floor} format={v => `${v}`}   />
      </div>
      <div className="sp-cmp-legend">
        <span className="sp-cmp-leg sp-cmp-leg-you">■ You</span>
        <span className="sp-cmp-leg sp-cmp-leg-avg">■ Global Average</span>
      </div>
    </div>
  );
}

// ── Bottom CTA ─────────────────────────────────────────────────────────────────

function BottomCTA({ user }) {
  const level   = user.level || 1;
  const xp      = user.xp   || 0;
  const xpToNext = 500 - (xp % 500);

  return (
    <div className="sp-cta-panel">
      <div className="sp-cta-glow" />
      <div className="sp-cta-text">
        Keep climbing. Your next level is
        <span className="sp-cta-xp"> {xpToNext.toLocaleString()} XP </span>
        away.
      </div>
      <div className="sp-cta-sub">You&apos;re {level - 1 > 0 ? `${level - 1} levels` : 'just starting'} into your journey.</div>
      <button className="sp-cta-btn" onClick={() => window.location.href = '/'}>
        Play Now →
      </button>
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
  const [user,        setUser]        = useState(null);
  const [globalRank,  setGlobalRank]  = useState(null);
  const [xpHistory,   setXpHistory]   = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [ready,       setReady]       = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }

    fetchMe().then(me => {
      if (!me) { clearToken(); window.location.href = '/'; return; }
      setUser(me);
      setReady(true);
      playAchievementSound();

      // Parallel fetch: rank, XP history, global stats
      Promise.all([
        authFetch('/api/leaderboard/players').then(r => r.ok ? r.json() : null),
        authFetch('/api/stats/xp-history').then(r => r.ok ? r.json() : null),
        authFetch('/api/stats/global').then(r => r.ok ? r.json() : null),
      ]).then(([lb, hist, global]) => {
        if (lb?.players) {
          const found = lb.players.find(p => p.id === me.id);
          if (found) setGlobalRank(found.rank);
        }
        if (hist?.days)  setXpHistory(hist.days);
        if (global)      setGlobalStats(global);
      }).catch(() => {});
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
        <Achievements user={user} />
        <RecentGames history={user.game_history || []} />
        {xpHistory && <XpGraph days={xpHistory} />}
        <Comparison user={user} globalStats={globalStats} />
        <BottomCTA user={user} />
        <div className="sp-footer-space" />
      </div>
    </div>
  );
}
