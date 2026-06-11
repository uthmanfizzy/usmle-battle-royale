import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { getToken } from '../auth';
import { SUBJECTS } from './SubjectSelect';
import './JourneyMode.css';

const SERVER = 'https://usmle-battle-royale-production.up.railway.app';

// Journey has no "all subjects" concept — ids match what admin authors chapters under
const JOURNEY_SUBJECTS = SUBJECTS.filter(s => s.id !== 'all');

function starsFor(pct, threshold) {
  if (pct >= 100) return 3;
  if (pct >= 90) return 2;
  if (pct >= threshold) return 1;
  return 0;
}

// Decorative compass rose for the map corner
function CompassRose() {
  return (
    <svg className="jm-compass" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 4" />
      <polygon points="50,6 55,45 50,50 45,45" fill="currentColor" />
      <polygon points="50,94 55,55 50,50 45,55" fill="currentColor" opacity="0.5" />
      <polygon points="6,50 45,45 50,50 45,55" fill="currentColor" opacity="0.5" />
      <polygon points="94,50 55,45 50,50 55,55" fill="currentColor" opacity="0.5" />
      <polygon points="22,22 46,46 50,50 44,44" fill="currentColor" opacity="0.3" />
      <polygon points="78,22 54,46 50,50 56,44" fill="currentColor" opacity="0.3" />
      <polygon points="22,78 46,54 50,50 44,56" fill="currentColor" opacity="0.3" />
      <polygon points="78,78 54,54 50,50 56,56" fill="currentColor" opacity="0.3" />
      <text x="50" y="20" textAnchor="middle" fontSize="11" fill="currentColor">N</text>
    </svg>
  );
}

export default function JourneyMode({ username, onBack }) {
  const [view,        setView]        = useState('subjects'); // 'subjects' | 'path'
  const [subject,     setSubject]     = useState(null);       // entry from JOURNEY_SUBJECTS
  const [path,        setPath]        = useState(null);       // GET /api/journey/:subject response
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [authExpired, setAuthExpired] = useState(false);
  const [confirmNode, setConfirmNode] = useState(null);       // { kind, name, questionCount, bestPct, completed }

  const frontierRef = useRef(null);

  // Reusable so J3c can re-enter the path with fresh unlock state
  const loadPath = useCallback(async (subj) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER}/api/journey/${subj.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) { setAuthExpired(true); setLoading(false); return; }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setPath(data);
      setSubject(subj);
      setView('path');
    } catch {
      setError('Could not load the journey. Check your connection.');
    }
    setLoading(false);
  }, []);

  // Auto-scroll to the frontier node (first unlocked, not-yet-completed) when a path renders
  useEffect(() => {
    if (view === 'path' && path && frontierRef.current) {
      frontierRef.current.scrollIntoView({ block: 'center' });
    }
  }, [view, path]);

  // ----- Guest gate: journey progress is per-account -----
  if (!getToken() || authExpired) {
    return (
      <div className="screen jm-screen">
        <div className="jm-scroll-card">
          <span className="jm-scroll-icon">🚑</span>
          <h2>Sign in to begin your Journey</h2>
          <p>Your progress through First Aid is saved to your account.</p>
          <button className="btn-start" onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen jm-screen">
        <div className="waiting-screen"><div className="spinner" /><p>Charting your journey…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen jm-screen">
        <div className="jm-scroll-card">
          <span className="jm-scroll-icon">🗺️</span>
          <h2>Lost the trail</h2>
          <p className="error-msg">{error}</p>
          {subject && <button className="btn-start" onClick={() => loadPath(subject)}>Retry</button>}
          <button className="btn-secondary" onClick={() => { setError(''); setView('subjects'); }}>← Subjects</button>
        </div>
      </div>
    );
  }

  // ----- Subject select -----
  if (view === 'subjects') {
    return (
      <div className="screen jm-screen">
        <button className="jm-back-btn" onClick={onBack}>← Back</button>
        <div className="jm-banner">
          <span className="jm-banner-flourish">⚕ ─────── ⚕</span>
          <h1 className="jm-title">First Aid Journey</h1>
          <p className="jm-tagline">Choose a realm of medicine and chart your course</p>
        </div>
        <div className="jm-subject-grid">
          {JOURNEY_SUBJECTS.map(s => (
            <button key={s.id} className="jm-subject-card" onClick={() => loadPath(s)}>
              <span className="jm-subject-icon">{s.icon}</span>
              <span className="jm-subject-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ----- Pathway -----
  const threshold = path?.threshold || 80;
  const chapters  = path?.chapters || [];
  const ultimate  = path?.ultimate;

  // Empty path: no chapters authored (or journey tables not migrated) — friendly, not an error
  if (chapters.length === 0) {
    return (
      <div className="screen jm-screen">
        <div className="jm-scroll-card">
          <span className="jm-scroll-icon">{subject?.icon || '🗺️'}</span>
          <h2>{subject?.label}</h2>
          <p>This journey hasn’t been charted yet — check back soon.</p>
          <button className="btn-start" onClick={() => setView('subjects')}>← Subjects</button>
        </div>
      </div>
    );
  }

  // Progress counter: levels + bosses that actually require play (auto-skipped bosses excluded)
  let totalNodes = 0, doneNodes = 0;
  for (const c of chapters) {
    totalNodes += c.levels.length;
    doneNodes  += c.levels.filter(l => l.completed).length;
    if (!c.boss.auto_skipped) { totalNodes += 1; if (c.boss.completed) doneNodes += 1; }
  }
  if (ultimate && !ultimate.auto_skipped) { totalNodes += 1; if (ultimate.completed) doneNodes += 1; }

  // The frontier = first node that is unlocked but not completed (for auto-scroll + pulse)
  const frontierKey = (() => {
    for (const c of chapters) {
      for (const l of c.levels) {
        if (l.unlocked && !l.completed && l.question_count > 0) return l.level_key;
      }
      if (c.boss.unlocked && !c.boss.completed && !c.boss.auto_skipped) return c.boss.level_key;
    }
    if (ultimate?.unlocked && !ultimate.completed && !ultimate.auto_skipped) return ultimate.level_key;
    return null;
  })();

  // Winding trail: nodes alternate left/right; a dashed hand-drawn segment leads into each node
  let slot = 0;
  let nodeCount = 0;
  const takeSide = () => (slot++ % 2 === 0 ? 'left' : 'right');

  const trailSeg = (toSide) => (
    <div className={`jm-trail-seg jm-trail-seg--${toSide}`} aria-hidden="true" />
  );

  const openConfirm = (node) => setConfirmNode(node);

  const renderLevelNode = (l) => {
    const side       = takeSide();
    const showSeg    = nodeCount > 0;
    nodeCount += 1;
    const empty      = l.question_count === 0;
    const isFrontier = l.level_key === frontierKey;
    const tappable   = l.unlocked && !empty;
    const stars      = l.completed ? starsFor(l.best_score_pct, threshold) : 0;
    const cls = [
      'jm-node', 'jm-node--level',
      !l.unlocked ? 'jm-node--locked' : '',
      l.completed ? 'jm-node--done' : '',
      isFrontier ? 'jm-node--frontier' : '',
      empty ? 'jm-node--empty' : '',
    ].join(' ');
    return (
      <Fragment key={l.level_key}>
        {showSeg && trailSeg(side)}
        <div className={`jm-node-row jm-node-row--${side}`} ref={isFrontier ? frontierRef : null}>
          <button
            className={cls}
            disabled={!tappable}
            onClick={() => openConfirm({
              kind: 'level', name: l.name, questionCount: l.question_count,
              bestPct: l.best_score_pct, completed: l.completed,
            })}
          >
            <span className="jm-node-face">
              {!l.unlocked ? '🔒' : l.completed ? '✓' : '⚑'}
            </span>
          </button>
          <div className="jm-node-caption">
            <span className="jm-node-name">{l.name}</span>
            {l.completed && <span className="jm-node-stars">{'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 3 - stars))}</span>}
            {empty && <span className="jm-node-tag">Uncharted</span>}
          </div>
        </div>
      </Fragment>
    );
  };

  const renderBossNode = (boss, label, big) => {
    const side       = big ? 'center' : takeSide();
    const showSeg    = nodeCount > 0;
    nodeCount += 1;
    const isFrontier = boss.level_key === frontierKey;
    const tappable   = boss.unlocked && !boss.auto_skipped && boss.question_count > 0;
    const stars      = boss.completed ? starsFor(boss.best_score_pct, threshold) : 0;
    const cls = [
      'jm-node', big ? 'jm-node--ultimate' : 'jm-node--boss',
      !boss.unlocked ? 'jm-node--locked' : '',
      boss.completed ? 'jm-node--done' : '',
      isFrontier ? 'jm-node--frontier' : '',
      boss.auto_skipped ? 'jm-node--skipped' : '',
    ].join(' ');
    return (
      <Fragment key={boss.level_key}>
        {showSeg && trailSeg(side)}
        <div className={`jm-node-row jm-node-row--${side}`} ref={isFrontier ? frontierRef : null}>
          <button
            className={cls}
            disabled={!tappable}
            onClick={() => openConfirm({
              kind: big ? 'ultimate' : 'boss', name: label, questionCount: boss.question_count,
              bestPct: boss.best_score_pct, completed: boss.completed,
            })}
          >
            <span className="jm-node-face">
              {boss.auto_skipped ? '💨' : !boss.unlocked ? '🔒' : boss.completed ? '✓' : big ? '🐉' : '💀'}
            </span>
          </button>
          <div className="jm-node-caption">
            <span className="jm-node-name">{label}</span>
            {boss.auto_skipped && <span className="jm-node-tag">BYPASSED</span>}
            {boss.completed && <span className="jm-node-stars">{'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 3 - stars))}</span>}
          </div>
        </div>
      </Fragment>
    );
  };

  return (
    <div className="screen jm-screen jm-screen--path">
      <div className="jm-path-header">
        <button className="jm-back-btn" onClick={() => { setView('subjects'); setPath(null); setConfirmNode(null); }}>
          ← Subjects
        </button>
        <span className="jm-path-subject">{subject?.icon} {subject?.label}</span>
        <span className="jm-path-progress">{doneNodes}/{totalNodes}</span>
      </div>

      <div className="jm-path-scroll">
        <div className="jm-map">
          <CompassRose />
          <div className="jm-path">
            {chapters.map((c, ci) => (
              <section key={c.chapter.id} className="jm-chapter">
                <header className="jm-chapter-banner">
                  <span className="jm-chapter-num">⚕ Chapter {ci + 1} ⚕</span>
                  <span className="jm-chapter-name">{c.chapter.name}</span>
                </header>
                {c.levels.map(renderLevelNode)}
                {renderBossNode(c.boss, `${c.chapter.name} Boss`, false)}
              </section>
            ))}

            {ultimate && renderBossNode(ultimate, 'ULTIMATE BOSS', true)}

            <div className={`jm-mastery ${path.mastery ? 'jm-mastery--earned' : ''}`}>
              <span className="jm-mastery-icon">🏆</span>
              <span className="jm-mastery-text">FULL MASTERY</span>
              <span className="jm-mastery-sub">{path.mastery ? `${subject?.label} conquered!` : 'Defeat the Ultimate Boss to claim it'}</span>
            </div>
          </div>
        </div>
      </div>

      {confirmNode && (
        <div className="jm-confirm-overlay" onClick={() => setConfirmNode(null)}>
          <div className="jm-confirm-card" onClick={e => e.stopPropagation()}>
            <span className="jm-confirm-seal" aria-hidden="true">⚕</span>
            <span className="jm-confirm-kind">
              {confirmNode.kind === 'ultimate' ? '🐉 Ultimate Boss' : confirmNode.kind === 'boss' ? '💀 Chapter Boss' : '⚑ Level'}
            </span>
            <h3 className="jm-confirm-name">{confirmNode.name}</h3>
            <div className="jm-confirm-stats">
              <span>{confirmNode.questionCount} question{confirmNode.questionCount === 1 ? '' : 's'}</span>
              {confirmNode.bestPct > 0 && <span>Best: {confirmNode.bestPct}%</span>}
            </div>
            <p className="jm-confirm-threshold">Pass with ≥{threshold}% to unlock the next {confirmNode.kind === 'level' ? 'level' : 'stage'}</p>
            {/* PLAY is wired to the solo engine in the next update (J3c) */}
            <button className="btn-start jm-confirm-play" disabled>▶ PLAY</button>
            <span className="jm-confirm-soon">Coming in the next update</span>
            <button className="btn-secondary" onClick={() => setConfirmNode(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
