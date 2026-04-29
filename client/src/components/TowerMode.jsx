import { useState, useEffect, useRef } from 'react';
import * as audio from '../audio';
import { getToken } from '../auth';
import './TowerMode.css';

const SERVER = 'https://usmle-battle-royale-production.up.railway.app';
const LABELS  = ['A', 'B', 'C', 'D'];

// ── Zone & floor data ──────────────────────────────────────────────────────────

const ZONES = [
  {
    id: 1,  start: 1,   end: 10,
    name: 'The Basement',       subject: 'biochemistry',  color: '#c9a84c',
    desc: 'Deep beneath the hospital, the foundations of biochemistry echo through stone walls. Master the basics or be buried here forever.',
    story: 'You descend into the dimly lit basement. The smell of old textbooks fills the air. Enzyme pathways are scrawled across the crumbling walls.',
  },
  {
    id: 2,  start: 11,  end: 20,
    name: 'The Laboratory',     subject: 'microbiology',  color: '#00b894',
    desc: 'Culture plates and microscopes everywhere. Invisible enemies lurk in every petri dish. Identify them or be consumed.',
    story: 'You push through the lab doors. Incubators hum. Cultures grow in the dim light. The microbial world awaits your expertise.',
  },
  {
    id: 3,  start: 21,  end: 30,
    name: 'The Ward',           subject: 'pharmacology',  color: '#4a9eff',
    desc: 'Medication carts line the hallways. Every drug interaction, every mechanism — your patients depend on your knowledge.',
    story: 'The ward is eerily quiet at this hour. A medication cart stands unattended. Every label matters. Every interaction could be the difference.',
  },
  {
    id: 4,  start: 31,  end: 40,
    name: 'The Clinic',         subject: 'neurology',     color: '#a29bfe',
    desc: 'Neurological exams await. Reflex hammers and MRI films are scattered across darkened examination rooms.',
    story: 'You enter the neurology clinic. A patient gazes blankly ahead. Cortex, brainstem, peripheral nerves — can you navigate them all?',
  },
  {
    id: 5,  start: 41,  end: 50,
    name: 'The Cardio Unit',    subject: 'cardiology',    color: '#e17055',
    desc: 'ECG tracings paper the walls. The rhythms of the heart are your language here. One misread and the case collapses.',
    story: 'Monitors beep steadily. A 12-lead ECG rolls off the printer. The Cardio Unit demands precision above all else.',
  },
  {
    id: 6,  start: 51,  end: 60,
    name: 'The Research Floor', subject: 'biostatistics', color: '#fd79a8',
    desc: 'Whiteboards covered in p-values and confidence intervals. The numbers tell the truth — if you know how to read them.',
    story: 'Stacks of journal articles tower around you. P-values and NNTs guard every door. Evidence-based medicine is your only weapon.',
  },
  {
    id: 7,  start: 61,  end: 70,
    name: 'The GI Tract',       subject: 'gastroenterology', color: '#fdcb6e',
    desc: 'The gut is more complex than it appears. Motility disorders, inflammatory conditions, and neoplasms hide behind everyday symptoms.',
    story: 'The GI unit stretches before you — colonoscopy reports stacked high, biopsy results pending. The gut tells its own story.',
  },
  {
    id: 8,  start: 71,  end: 80,
    name: 'The Lungs',          subject: 'pulmonology',      color: '#74b9ff',
    desc: 'Breath by breath, the pulmonary floor tests your knowledge of obstruction, restriction, infection and beyond. Every wheeze has a reason.',
    story: 'The respiratory ward echoes with the hiss of ventilators. Peak flow charts and CT chest films litter every surface. Breathe carefully.',
  },
  {
    id: 9,  start: 81,  end: 90,
    name: 'The Reproductive System', subject: 'reproductive', color: '#e84393',
    desc: 'Obstetrics and reproductive medicine collide at the upper floors. From conception to complications — nothing here is straightforward.',
    story: 'The maternity wing is busy. Fetal heart tracings, hormone panels, and obstetric emergencies demand your attention. Life itself hangs in the balance.',
  },
  {
    id: 10, start: 91,  end: 100,
    name: 'The Summit',         subject: 'all',            color: '#f5c518',
    desc: 'The final ten floors. Boss encounters on every level. Only legends reach the top.',
    story: "Wind howls at the summit. The final guardian waits. Everything you've learned brought you here. Give everything.",
  },
];

const BOSS_NAMES = {
  10:  'The Metabolic Guardian',
  20:  'The Microbial Overlord',
  30:  'The Pharmacological Titan',
  40:  'The Neural Architect',
  50:  'The Cardiac Sentinel',
  60:  'The Statistical Oracle',
  70:  'The GI Guardian',
  80:  'The Pulmonary Sentinel',
  90:  'The Obstetric Warden',
  100: 'The Summit Master',
};

const MILESTONE_BADGES = [
  { floor: 10,  icon: '🥉', name: 'Tower Rookie',   desc: 'Cleared Floor 10' },
  { floor: 25,  icon: '🥈', name: 'Quarter Master', desc: 'Reached Floor 25' },
  { floor: 50,  icon: '🥇', name: 'Halfway Hero',   desc: 'Reached Floor 50' },
  { floor: 75,  icon: '💎', name: 'Summit Chaser',  desc: 'Reached Floor 75' },
  { floor: 100, icon: '👑', name: 'Tower Master',   desc: 'Conquered all 100 floors' },
];

const ZONE_BADGES = [
  { floor: 10,  icon: '⚗️',  name: 'Biochem Survivor',  desc: 'Completed The Basement' },
  { floor: 20,  icon: '🔬',  name: 'Micro Warrior',     desc: 'Completed The Laboratory' },
  { floor: 30,  icon: '💊',  name: 'Pharma Knight',     desc: 'Completed The Ward' },
  { floor: 40,  icon: '🧠',  name: 'Neuro Ace',         desc: 'Completed The Clinic' },
  { floor: 50,  icon: '❤️',  name: 'Cardio Champion',   desc: 'Completed The Cardio Unit' },
  { floor: 60,  icon: '📊',  name: 'Stats Scholar',     desc: 'Completed The Research Floor' },
  { floor: 70,  icon: '🫃',  name: 'GI Specialist',     desc: 'Completed The GI Tract' },
  { floor: 80,  icon: '🫁',  name: 'Pulmonology Pro',   desc: 'Completed The Lungs' },
  { floor: 90,  icon: '👶',  name: 'OB/GYN Expert',     desc: 'Completed The Reproductive System' },
  { floor: 100, icon: '👑',  name: 'Summit Master',     desc: 'Conquered The Summit' },
];

function getZone(floor) {
  return ZONES.find(z => floor >= z.start && floor <= z.end) || ZONES[0];
}

function floorType(floor) {
  if (floor % 10 === 0) return 'boss';
  if (floor % 5 === 0)  return 'challenge';
  return 'normal';
}

function floorTarget(floor) {
  const t = floorType(floor);
  if (t === 'boss')      return 10;
  if (t === 'challenge') return 5;
  return 3;
}

function floorName(floor) {
  const t = floorType(floor);
  if (t === 'boss')      return BOSS_NAMES[floor] || `Boss: Floor ${floor}`;
  if (t === 'challenge') return `Challenge — Floor ${floor}`;
  return `Floor ${floor}`;
}

function typeTag(type) {
  if (type === 'boss')      return { label: 'BOSS',      color: '#ff4455' };
  if (type === 'challenge') return { label: 'CHALLENGE', color: '#fdcb6e' };
  return                           { label: 'NORMAL',    color: '#3ddc84' };
}

function calcFloorXp(floorNum, livesLost) {
  const t = floorType(floorNum);
  let xp = t === 'boss' ? 150 : t === 'challenge' ? 60 : 30;
  if (livesLost === 0) xp += 20;        // perfect run bonus
  if (floorNum % 10 === 0) xp += 200;   // zone completion bonus
  return xp;
}

// ── Progress persistence ───────────────────────────────────────────────────────

function loadProgress(username) {
  try {
    const raw = localStorage.getItem(`tower_${username}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { floor: 1, xp: 0 };
}

function saveProgress(username, floor, xp = 0) {
  try { localStorage.setItem(`tower_${username}`, JSON.stringify({ floor, xp })); } catch {}
  const token = getToken();
  if (token) {
    fetch(`${SERVER}/api/tower/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ floor }),
    }).catch(() => {});
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TowerMode({ username, onBack }) {
  const saved = loadProgress(username);

  const [unlockedFloor,   setUnlockedFloor]   = useState(saved.floor || 1);
  const [activeFloor,     setActiveFloor]     = useState(saved.floor || 1);
  const [view,            setView]            = useState('map');

  const [questions,       setQuestions]       = useState([]);
  const [qIdx,            setQIdx]            = useState(0);
  const [lives,           setLives]           = useState(3);
  const [correctCount,    setCorrectCount]    = useState(0);
  const [selected,        setSelected]        = useState(null);
  const [revealed,        setRevealed]        = useState(false);
  const [timeLeft,        setTimeLeft]        = useState(20);
  const [loading,         setLoading]         = useState(false);
  const [bossKilled,      setBossKilled]      = useState(false);
  const [introCountdown,  setIntroCountdown]  = useState(3);
  const [xpEarned,        setXpEarned]        = useState(0);
  const [xpBreakdown,     setXpBreakdown]     = useState([]);
  const [totalXp,         setTotalXp]         = useState(saved.xp || 0);
  const [mapTab,          setMapTab]          = useState('map');
  const [lbData,          setLbData]          = useState(null);
  const [lbLoading,       setLbLoading]       = useState(false);

  // refs to prevent stale closures in timer / processAnswer
  const timerRef          = useRef(null);
  const timeLeftRef       = useRef(20);
  const revealedRef       = useRef(false);
  const livesRef          = useRef(3);
  const correctRef        = useRef(0);
  const qIdxRef           = useRef(0);
  const questionsRef      = useRef([]);
  const processRef        = useRef(null);
  const livesLostRef      = useRef(0);
  const activeFloorRef    = useRef(saved.floor || 1);
  const unlockedFloorRef  = useRef(saved.floor || 1);
  const totalXpRef        = useRef(saved.xp || 0);
  const beginPlayingRef   = useRef(null);

  // keep refs in sync with state at each render
  revealedRef.current      = revealed;
  livesRef.current         = lives;
  correctRef.current       = correctCount;
  qIdxRef.current          = qIdx;
  questionsRef.current     = questions;
  activeFloorRef.current   = activeFloor;
  unlockedFloorRef.current = unlockedFloor;

  useEffect(() => {
    audio.stopBgMusic();
    audio.startGameMusic();
    return () => audio.stopGameMusic();
  }, []);

  // 3-second intro countdown → auto-advance to boss_warning or playing
  useEffect(() => {
    if (view !== 'intro') return;
    let cnt = 3;
    const cntId = setInterval(() => {
      cnt -= 1;
      setIntroCountdown(cnt);
    }, 1000);
    const advId = setTimeout(() => {
      clearInterval(cntId);
      if (floorType(activeFloorRef.current) === 'boss') setView('boss_warning');
      else beginPlayingRef.current?.();
    }, 3000);
    return () => { clearInterval(cntId); clearTimeout(advId); };
  }, [view]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function startTimer() {
    stopTimer();
    timeLeftRef.current = 20;
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 5 && timeLeftRef.current > 0) audio.playTick();
      if (timeLeftRef.current <= 0) {
        stopTimer();
        processRef.current?.(null);
      }
    }, 1000);
  }

  function beginPlaying() {
    setView('playing');
    startTimer();
  }
  beginPlayingRef.current = beginPlaying;

  async function fetchLeaderboard() {
    setLbLoading(true);
    try {
      const res  = await fetch(`${SERVER}/api/tower/leaderboard`);
      const data = await res.json();
      setLbData(data);
    } catch {
      setLbData({ players: [] });
    }
    setLbLoading(false);
  }

  async function fetchQuestions(floor) {
    const zone = getZone(floor);
    setLoading(true);
    try {
      const res  = await fetch(`${SERVER}/api/questions?tower_floor=${floor}&subject=${zone.subject}`);
      const data = await res.json();
      const qs   = data.questions || [];
      setQuestions(qs);
      questionsRef.current = qs;
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }

  function enterFloor(floor) {
    const zone = getZone(floor);
    setActiveFloor(floor);
    activeFloorRef.current = floor;
    setLives(3);         livesRef.current    = 3;
    setCorrectCount(0);  correctRef.current  = 0;
    setQIdx(0);          qIdxRef.current     = 0;
    setSelected(null);
    setRevealed(false);  revealedRef.current = false;
    setBossKilled(false);
    livesLostRef.current = 0;
    setIntroCountdown(3);
    setXpEarned(0);
    setXpBreakdown([]);
    fetchQuestions(floor);
    setView('intro');
  }

  // ── Process answer ─────────────────────────────────────────────────────────

  function processAnswer(label) {
    if (revealedRef.current) return;
    stopTimer();

    const qs = questionsRef.current;
    const q  = qs[qIdxRef.current % Math.max(qs.length, 1)];
    if (!q) return;

    revealedRef.current = true;
    setRevealed(true);
    setSelected(label);

    const correct = label !== null && label === q.correct;
    const floor   = activeFloorRef.current;
    const type    = floorType(floor);
    const target  = floorTarget(floor);

    if (correct) {
      audio.playCorrect();
      const newCorrect = correctRef.current + 1;
      correctRef.current = newCorrect;
      setCorrectCount(newCorrect);

      setTimeout(() => {
        if (newCorrect >= target) {
          // ── Floor cleared: calculate XP ──
          const baseXp       = type === 'boss' ? 150 : type === 'challenge' ? 60 : 30;
          const perfectBonus = livesLostRef.current === 0 ? 20 : 0;
          const zoneBonus    = floor % 10 === 0 ? 200 : 0;
          const xp           = baseXp + perfectBonus + zoneBonus;
          const newTotal     = totalXpRef.current + xp;
          totalXpRef.current = newTotal;

          const breakdown = [
            {
              label: type === 'boss' ? 'Boss defeated' : type === 'challenge' ? 'Challenge cleared' : 'Floor cleared',
              xp: baseXp,
            },
            ...(perfectBonus > 0 ? [{ label: 'Perfect run bonus', xp: perfectBonus }] : []),
            ...(zoneBonus    > 0 ? [{ label: 'Zone completed!',   xp: zoneBonus    }] : []),
          ];

          setXpEarned(xp);
          setXpBreakdown(breakdown);
          setTotalXp(newTotal);

          const next        = floor + 1;
          const newUnlocked = Math.max(next, unlockedFloorRef.current);
          setUnlockedFloor(newUnlocked);
          unlockedFloorRef.current = newUnlocked;
          saveProgress(username, newUnlocked, newTotal);
          setView('cleared');
        } else {
          // next question
          const nextIdx = qIdxRef.current + 1;
          qIdxRef.current = nextIdx;
          setQIdx(nextIdx);
          revealedRef.current = false;
          setRevealed(false);
          setSelected(null);
          startTimer();
        }
      }, 2200);

    } else {
      audio.playWrong();

      if (type === 'boss') {
        setBossKilled(true);
        setTimeout(() => setView('failed'), 2200);
      } else {
        livesLostRef.current += 1;
        const newLives = livesRef.current - 1;
        livesRef.current = newLives;
        setLives(newLives);

        if (newLives <= 0) {
          audio.playEliminated();
          setTimeout(() => setView('failed'), 2200);
        } else {
          setTimeout(() => {
            const nextIdx = qIdxRef.current + 1;
            qIdxRef.current = nextIdx;
            setQIdx(nextIdx);
            revealedRef.current = false;
            setRevealed(false);
            setSelected(null);
            startTimer();
          }, 2200);
        }
      }
    }
  }

  processRef.current = processAnswer;

  // ── Derived ────────────────────────────────────────────────────────────────

  const zone   = getZone(activeFloor);
  const type   = floorType(activeFloor);
  const target = floorTarget(activeFloor);
  const tag    = typeTag(type);
  const q      = questions.length > 0 ? questions[qIdx % questions.length] : null;

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: MAP
  // ════════════════════════════════════════════════════════════════════════════

  if (view === 'map') {
    const displayZone = getZone(unlockedFloor);
    const earnedMilestones = MILESTONE_BADGES.filter(b => unlockedFloor > b.floor);
    const earnedZones      = ZONE_BADGES.filter(b => unlockedFloor > b.floor);
    const allBadges        = [...earnedMilestones, ...earnedZones];

    return (
      <div className="tw-screen" style={{ '--zc': displayZone.color }}>
        <div className="tw-map-wrap">

          <div className="tw-header">
            <div className="tw-title-row">
              <span className="tw-castle-icon">🏰</span>
              <h1 className="tw-title">The Tower</h1>
            </div>
            <div className="tw-global-prog">
              <span className="tw-prog-label">Floor {unlockedFloor} / 100</span>
              <div className="tw-prog-track">
                <div className="tw-prog-fill" style={{ width: `${Math.max((unlockedFloor - 1), 0)}%` }} />
              </div>
            </div>
            {totalXp > 0 && (
              <div className="tw-map-xp">⚡ {totalXp.toLocaleString()} Tower XP</div>
            )}
          </div>

          <div className="tw-map-tabs">
            <button
              className={`tw-map-tab ${mapTab === 'map' ? 'active' : ''}`}
              onClick={() => setMapTab('map')}
            >
              🗺️ Tower Map
            </button>
            <button
              className={`tw-map-tab ${mapTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => { setMapTab('leaderboard'); if (!lbData) fetchLeaderboard(); }}
            >
              🏆 Leaderboard
            </button>
          </div>

          {mapTab === 'map' && (
            <>
              <div className="tw-zone-banner">
                <div className="tw-zb-meta">
                  <span className="tw-zb-num">Zone {displayZone.id} of 10</span>
                  <span className="tw-zb-subject">
                    {displayZone.subject === 'all' ? 'All Subjects' : displayZone.subject.charAt(0).toUpperCase() + displayZone.subject.slice(1)}
                  </span>
                </div>
                <div className="tw-zb-name" style={{ color: displayZone.color }}>{displayZone.name}</div>
                <p className="tw-zb-desc">{displayZone.desc}</p>
              </div>

              <div className="tw-floor-list">
                {Array.from({ length: 10 }, (_, i) => {
                  const floor     = displayZone.end - i;
                  const ft        = floorType(floor);
                  const ftag      = typeTag(ft);
                  const completed = floor < unlockedFloor;
                  const isCurrent = floor === unlockedFloor;
                  const locked    = floor > unlockedFloor;

                  return (
                    <div
                      key={floor}
                      className={`tw-floor-row ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${locked ? 'locked' : ''}`}
                      onClick={() => isCurrent && enterFloor(floor)}
                    >
                      <div className="tw-fr-num">
                        <span className="tw-fr-status">
                          {completed ? '✓' : isCurrent ? '▶' : '🔒'}
                        </span>
                        <span>{floor}</span>
                      </div>
                      <div className="tw-fr-info">
                        <span className="tw-fr-name">{floorName(floor)}</span>
                        <span className="tw-fr-type" style={{ color: ftag.color }}>{ftag.label}</span>
                      </div>
                      <div className="tw-fr-req">
                        {ft === 'boss' ? '⚡ 10 correct, 0 wrong'
                          : ft === 'challenge' ? `⚔️ ${floorTarget(floor)} correct, 3 lives`
                          : `✅ ${floorTarget(floor)} correct, 3 lives`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {allBadges.length > 0 && (
                <div className="tw-badges-section">
                  <div className="tw-badges-title">🎖️ Your Badges</div>
                  <div className="tw-badges-grid">
                    {allBadges.map((b, i) => (
                      <div key={i} className="tw-badge">
                        <div className="tw-badge-icon">{b.icon}</div>
                        <div className="tw-badge-name">{b.name}</div>
                        <div className="tw-badge-desc">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="tw-map-actions">
                {unlockedFloor > 1 && (
                  <div className="tw-continue-hint">Continue from Floor {unlockedFloor}</div>
                )}
                <button
                  className="tw-enter-btn"
                  style={{ background: `linear-gradient(135deg, ${displayZone.color} 0%, ${displayZone.color}99 100%)` }}
                  onClick={() => enterFloor(unlockedFloor)}
                >
                  Enter Floor {unlockedFloor} →
                </button>
                {unlockedFloor > 1 && (
                  <button className="tw-secondary-btn tw-danger-btn" onClick={() => {
                    if (window.confirm('Reset all progress and start from Floor 1?')) {
                      saveProgress(username, 1, 0);
                      setUnlockedFloor(1); unlockedFloorRef.current = 1;
                      setActiveFloor(1);  activeFloorRef.current  = 1;
                      setTotalXp(0);      totalXpRef.current      = 0;
                    }
                  }}>
                    Start Over
                  </button>
                )}
                <button className="tw-secondary-btn" onClick={onBack}>← Back to Menu</button>
              </div>
            </>
          )}

          {mapTab === 'leaderboard' && (
            <div className="tw-lb-wrap">
              {lbLoading ? (
                <div className="tw-lb-loading">Loading leaderboard…</div>
              ) : lbData?.players?.length > 0 ? (
                <div className="tw-lb-table">
                  <div className="tw-lb-header">
                    <span className="tw-lb-col-rank">Rank</span>
                    <span className="tw-lb-col-user">Player</span>
                    <span className="tw-lb-col-floor">Highest Floor</span>
                    <span className="tw-lb-col-cleared">Floors Cleared</span>
                  </div>
                  {lbData.players.map(p => (
                    <div
                      key={p.username}
                      className={`tw-lb-row ${p.username === username ? 'tw-lb-me' : ''}`}
                    >
                      <span className="tw-lb-col-rank tw-lb-rank-num">#{p.rank}</span>
                      <span className="tw-lb-col-user tw-lb-username">{p.username}</span>
                      <span className="tw-lb-col-floor">Floor {p.highestFloor}</span>
                      <span className="tw-lb-col-cleared">{p.floorsCleared}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw-lb-empty">
                  <div className="tw-lb-empty-icon">🏰</div>
                  <p>No tower climbers yet — be the first to make the board!</p>
                </div>
              )}
              <div className="tw-lb-actions">
                <button className="tw-secondary-btn" onClick={onBack}>← Back to Menu</button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: INTRO  (auto-advances after 3 seconds)
  // ════════════════════════════════════════════════════════════════════════════

  if (view === 'intro') {
    const isZoneEntry = activeFloor === zone.start;

    return (
      <div className="tw-screen tw-center-screen" style={{ '--zc': zone.color }}>
        <div className="tw-intro-card">

          {isZoneEntry && (
            <div className="tw-zone-entry">
              <div className="tw-ze-eyebrow">Entering Zone {zone.id} of 10</div>
              <div className="tw-ze-name" style={{ color: zone.color }}>{zone.name}</div>
              <p className="tw-ze-story">{zone.story}</p>
            </div>
          )}

          <div className="tw-floor-intro">
            <div className="tw-fi-badge" style={{ color: tag.color, borderColor: tag.color }}>
              {tag.label}
            </div>
            <h2 className="tw-fi-name">{floorName(activeFloor)}</h2>
            <div className="tw-fi-num">Floor {activeFloor} of 100</div>

            <div className="tw-fi-rules">
              {type === 'boss' ? (
                <>
                  <div className="tw-fi-rule">⚡ Answer {target} questions correctly</div>
                  <div className="tw-fi-rule tw-fi-danger">💀 One wrong answer restarts this boss floor</div>
                  <div className="tw-fi-rule tw-fi-danger">🏆 Perfect run required — no mistakes allowed</div>
                </>
              ) : (
                <>
                  <div className="tw-fi-rule">
                    {type === 'challenge' ? '⚔️' : '✅'} Answer {target} questions correctly to pass
                  </div>
                  <div className="tw-fi-rule">❤️ 3 lives — each wrong answer costs one life</div>
                  <div className="tw-fi-rule">🔄 Lose all lives and the floor resets</div>
                </>
              )}
            </div>
          </div>

          <div className="tw-intro-countdown">
            <div className="tw-ic-num" key={introCountdown}>
              {introCountdown > 0 ? introCountdown : '…'}
            </div>
            <p className="tw-ic-label">
              {introCountdown > 0 ? `Starting in ${introCountdown}s` : 'Loading…'}
              {' — '}
              <span
                className="tw-ic-skip"
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (type === 'boss') setView('boss_warning');
                  else beginPlaying();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (type === 'boss') setView('boss_warning');
                    else beginPlaying();
                  }
                }}
              >
                skip
              </span>
            </p>
          </div>

          <button className="tw-secondary-btn" onClick={() => setView('map')}>← Back to Tower</button>

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: BOSS WARNING  (dramatic entrance before boss floor)
  // ════════════════════════════════════════════════════════════════════════════

  if (view === 'boss_warning') {
    return (
      <div className="tw-screen tw-center-screen tw-boss-warning-screen">
        <div className="tw-boss-warning-card">
          <div className="tw-bw-icon">⚠️</div>
          <div className="tw-bw-eyebrow">Boss Floor {activeFloor} of 100</div>
          <h2 className="tw-bw-name">{floorName(activeFloor)}</h2>
          <p className="tw-bw-zone">{zone.name}</p>
          <div className="tw-bw-rules">
            <div className="tw-bw-rule">⚡ Answer {target} questions correctly</div>
            <div className="tw-bw-rule tw-bw-danger">💀 ONE wrong answer = immediate failure</div>
            <div className="tw-bw-rule tw-bw-danger">🏆 A flawless performance is required</div>
          </div>
          <button
            className="tw-enter-btn tw-boss-challenge-btn"
            onClick={beginPlaying}
            disabled={loading}
          >
            {loading ? 'Loading Questions…' : '⚡ Challenge the Boss'}
          </button>
          <button className="tw-secondary-btn" onClick={() => setView('map')}>← Back to Tower</button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: PLAYING
  // ════════════════════════════════════════════════════════════════════════════

  if (view === 'playing') {
    const pct  = (timeLeft / 20) * 100;
    const tier = timeLeft > 10 ? 'green' : timeLeft > 5 ? 'yellow' : 'red';

    return (
      <div className="tw-screen tw-playing-screen" style={{ '--zc': zone.color }}>

        <div className="tw-topbar">
          <div className="tw-tb-left">
            <span className="tw-tb-floor">🏰 Floor {activeFloor}</span>
            <span className="tw-tb-zone" style={{ color: zone.color }}>{zone.name}</span>
          </div>

          <div className="tw-tb-mid">
            <div className="tw-dots">
              {Array.from({ length: target }, (_, i) => (
                <span key={i} className={`tw-dot ${i < correctCount ? 'filled' : ''}`} />
              ))}
            </div>
            <div className="tw-dot-label">Question {correctCount + 1} of {target}</div>
          </div>

          <div className="tw-tb-right">
            {type === 'boss' ? (
              <span className="tw-boss-badge">⚡ NO MISTAKES</span>
            ) : (
              <div className="tw-hearts">
                {[1, 2, 3].map(i => (
                  <span key={i} className={`tw-heart ${i > lives ? 'dead' : ''}`}>
                    {i <= lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {!revealed && (
          <div className="tw-timer-wrap">
            <div className={`tw-timer-num ${tier}`}>{timeLeft}s</div>
            <div className="tw-timer-track">
              <div className={`tw-timer-fill ${tier}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="tw-q-wrap">
          {q ? (
            <>
              {q.image_url && (
                <img src={q.image_url} alt="" className="tw-q-img" />
              )}
              <div className="tw-q-text">{q.question}</div>
              <div className="tw-options">
                {q.options.map((opt, i) => {
                  const label   = LABELS[i];
                  const isMine  = selected === label;
                  const isRight = revealed && q.correct === label;
                  const isWrong = revealed && isMine && q.correct !== label;
                  return (
                    <button
                      key={i}
                      className={`tw-opt ${isMine ? 'selected' : ''} ${isRight ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                      onClick={() => processAnswer(label)}
                      disabled={revealed}
                    >
                      <span className="tw-opt-lbl">{label}</span>
                      <span className="tw-opt-txt">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {revealed && (
                <div className={`tw-reveal ${selected === q.correct ? 'correct' : 'wrong'}`}>
                  <div className="tw-rv-head">
                    <span className="tw-rv-icon">
                      {selected === q.correct ? '✅' : bossKilled ? '💀' : '❌'}
                    </span>
                    <span className="tw-rv-label">
                      {selected === null ? "TIME'S UP!"
                        : selected === q.correct ? 'CORRECT!'
                        : bossKilled ? 'BOSS FLOOR FAILED!'
                        : lives <= 1 && type !== 'boss' ? 'FLOOR FAILED!'
                        : 'WRONG!'}
                    </span>
                  </div>
                  <div className="tw-rv-expl">
                    <strong>Correct answer: {q.correct}</strong>
                    <p>{q.explanation}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="tw-loading-q">Loading question…</div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: CLEARED  🎉
  // ════════════════════════════════════════════════════════════════════════════

  if (view === 'cleared') {
    const nextFloor   = activeFloor + 1;
    const nextZone    = getZone(nextFloor);
    const isLastFloor = activeFloor >= 100;
    const isBossFloor = type === 'boss';

    return (
      <div className="tw-screen tw-center-screen" style={{ '--zc': zone.color }}>
        <div className="tw-result-card tw-cleared">
          <div className="tw-rc-icon">{isBossFloor ? '🏆' : '🎉'}</div>
          <h2 className="tw-rc-title">{isBossFloor ? 'Boss Defeated!' : 'Floor Cleared!'}</h2>
          <div className="tw-rc-floor" style={{ color: zone.color }}>
            {floorName(activeFloor)} — Complete
          </div>
          <p className="tw-rc-detail">
            {isBossFloor
              ? `Perfect run! All ${target} answers correct.`
              : `${correctCount} of ${target} correct answers.`}
          </p>

          {xpEarned > 0 && (
            <div className="tw-xp-block">
              <div className="tw-xp-total">+{xpEarned} XP</div>
              <div className="tw-xp-breakdown">
                {xpBreakdown.map((row, i) => (
                  <div key={i} className="tw-xp-row">
                    <span>{row.label}</span>
                    <span className="tw-xp-val">+{row.xp}</span>
                  </div>
                ))}
              </div>
              <div className="tw-xp-cumulative">Total Tower XP: {totalXp.toLocaleString()}</div>
            </div>
          )}

          {isLastFloor ? (
            <div className="tw-summit-msg">
              <div className="tw-summit-crown">👑</div>
              <h3>YOU CONQUERED THE TOWER!</h3>
              <p>All 100 floors cleared. You have reached the summit. You are a true master of medicine.</p>
              <button className="tw-enter-btn" style={{ background: 'linear-gradient(135deg, #f5c518, #c49b10)' }} onClick={() => setView('map')}>
                Return to Tower
              </button>
            </div>
          ) : (
            <>
              {getZone(nextFloor).id !== zone.id && (
                <div className="tw-new-zone-hint" style={{ color: nextZone.color }}>
                  🔓 New zone unlocked: {nextZone.name}
                </div>
              )}
              <div className="tw-rc-next">Floor {nextFloor} unlocked →</div>
              <button
                className="tw-enter-btn"
                style={{ background: `linear-gradient(135deg, ${nextZone.color} 0%, ${nextZone.color}99 100%)` }}
                onClick={() => enterFloor(nextFloor)}
              >
                Enter Floor {nextFloor} →
              </button>
              <button className="tw-secondary-btn" onClick={() => setView('map')}>
                Back to Tower Map
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: FAILED  💀
  // ════════════════════════════════════════════════════════════════════════════

  if (view === 'failed') {
    return (
      <div className="tw-screen tw-center-screen" style={{ '--zc': zone.color }}>
        <div className="tw-result-card tw-failed">
          <div className="tw-rc-icon">{type === 'boss' ? '💀' : '💔'}</div>
          <h2 className="tw-rc-title">
            {type === 'boss' ? 'Boss Defeated You 💀' : 'Floor Failed 💀'}
          </h2>
          <div className="tw-rc-floor" style={{ color: '#ff4455' }}>{floorName(activeFloor)}</div>
          <p className="tw-rc-detail">
            {type === 'boss'
              ? 'The boss demands a flawless performance. One wrong answer ends your run. Study the explanation and try again.'
              : 'You lost all your lives. Lives fully refill at the start of each attempt.'}
          </p>
          <button
            className="tw-enter-btn"
            style={{ background: 'linear-gradient(135deg, #c0392b, #922b21)' }}
            onClick={() => enterFloor(activeFloor)}
          >
            ↺ Try Again
          </button>
          <button className="tw-secondary-btn" onClick={() => setView('map')}>
            Back to Tower Map
          </button>
        </div>
      </div>
    );
  }

  return null;
}
