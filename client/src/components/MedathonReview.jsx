import { useState, useMemo, useEffect } from 'react';
import { parseRichText } from '../utils/parseRichText';
import './MedathonReview.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

/**
 * The post-match review.
 *
 * The race itself tells a player only right or wrong — this is where the
 * explanations live, read at leisure once the clock has stopped. Every racer's
 * run is here, not just your own: the question list is shared (everyone raced
 * the same run), so switching racer swaps one set of answers for another over
 * the same questions. That is also what makes it fair to show — you can only
 * see someone else's answers to a race you were in.
 *
 * `review` is handed over in the game_over payload. `matchId` alone is enough
 * to fetch it back later, which is what happens when the tab has been closed
 * and reopened.
 */
export default function MedathonReview({ review: inline, matchId, meId, username, onClose }) {
  const [review, setReview] = useState(inline || null);
  const [loadError, setLoadError] = useState('');
  const [who, setWho] = useState(null);      // player id being read
  const [filter, setFilter] = useState('all'); // all | wrong | right | missed
  const [system, setSystem] = useState('all');
  const [open, setOpen] = useState(() => new Set());

  // Nothing inline (a reopened tab): fetch the saved match.
  useEffect(() => {
    if (inline || !matchId) return undefined;
    let cancelled = false;
    fetch(`${SERVER_URL}/api/medathon/match/${encodeURIComponent(matchId)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then(d => { if (!cancelled) setReview(d); })
      .catch(() => {
        if (!cancelled) setLoadError('This race is no longer saved — reviews are kept only once the match history table exists.');
      });
    return () => { cancelled = true; };
  }, [inline, matchId]);

  const players = review?.players || [];
  const current = useMemo(() => {
    if (!players.length) return null;
    const id = who || meId;
    return players.find(p => p.id === id) || players.find(p => p.username === username) || players[0];
  }, [players, who, meId, username]);

  // One row per question, with this racer's answer attached.
  const rows = useMemo(() => {
    if (!review || !current) return [];
    const byIndex = new Map((current.answers || []).map(a => [a.i, a]));
    return (review.questions || []).map(q => ({ ...q, mine: byIndex.get(q.i) || null }));
  }, [review, current]);

  const shown = useMemo(() => rows.filter(r => {
    if (system !== 'all' && r.systemShort !== system) return false;
    if (filter === 'wrong') return r.mine && !r.mine.correct && r.mine.picked != null;
    if (filter === 'right') return r.mine && r.mine.correct;
    if (filter === 'missed') return !r.mine || r.mine.picked == null;
    return true;
  }), [rows, filter, system]);

  const systems = useMemo(() => {
    const seen = [];
    for (const r of rows) if (!seen.includes(r.systemShort)) seen.push(r.systemShort);
    return seen;
  }, [rows]);

  // Per-system accuracy, which is the thing worth taking away from a race
  // across the whole of medicine.
  const bySystem = useMemo(() => {
    const acc = new Map();
    for (const r of rows) {
      const cur = acc.get(r.systemShort) || { short: r.systemShort, icon: r.systemIcon, right: 0, total: 0 };
      cur.total += 1;
      if (r.mine?.correct) cur.right += 1;
      acc.set(r.systemShort, cur);
    }
    return [...acc.values()];
  }, [rows]);

  if (loadError) {
    return (
      <div className="mrv-root">
        <div className="mrv-empty">
          <p>{loadError}</p>
          <button type="button" className="mrv-btn" onClick={onClose}>Back</button>
        </div>
      </div>
    );
  }

  if (!review || !current) {
    return (
      <div className="mrv-root">
        <div className="mrv-empty"><div className="mrv-spin" aria-hidden="true" /><p>Opening the race…</p></div>
      </div>
    );
  }

  const isMe = current.id === meId || current.username === username;
  const answered = (current.answers || []).filter(a => a.picked != null).length;
  const accuracy = answered ? Math.round((current.correct / answered) * 100) : 0;
  const avgMs = current.answered ? Math.round(current.totalMs / current.answered) : 0;
  const best = [...bySystem].filter(s => s.total >= 2).sort((a, b) => (b.right / b.total) - (a.right / a.total))[0];
  const worst = [...bySystem].filter(s => s.total >= 2).sort((a, b) => (a.right / a.total) - (b.right / b.total))[0];

  const toggle = (i) => setOpen(prev => {
    const n = new Set(prev);
    if (n.has(i)) n.delete(i); else n.add(i);
    return n;
  });
  const allOpen = shown.length > 0 && shown.every(r => open.has(r.i));

  return (
    <div className="mrv-root">
      <header className="mrv-head">
        <button type="button" className="mrv-back" onClick={onClose}>← Back to standings</button>
        <h1 className="mrv-title">Race Review</h1>
        <span className="mrv-sub">{review.total} questions · {bySystem.length} systems</span>
      </header>

      {/* Whose race am I reading? */}
      <div className="mrv-racers" role="tablist" aria-label="Racers">
        {players.map(p => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === current.id}
            className={`mrv-racer${p.id === current.id ? ' is-on' : ''}`}
            onClick={() => { setWho(p.id); setOpen(new Set()); }}
          >
            <span className="mrv-racer-rank">{p.rank}</span>
            <span className="mrv-racer-name">
              {p.username}{(p.id === meId || p.username === username) ? ' (you)' : ''}
              {p.isBot && <span className="mrv-bot">BOT</span>}
            </span>
            <span className="mrv-racer-score">{(p.score || 0).toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* The numbers for whoever is being read. */}
      <section className="mrv-stats">
        <div className="mrv-stat"><span className="mrv-stat-num">{(current.score || 0).toLocaleString()}</span><span className="mrv-stat-label">Points</span></div>
        <div className="mrv-stat"><span className="mrv-stat-num">{current.correct}<small> / {review.total}</small></span><span className="mrv-stat-label">Correct</span></div>
        <div className="mrv-stat"><span className="mrv-stat-num">{accuracy}<small>%</small></span><span className="mrv-stat-label">Accuracy</span></div>
        <div className="mrv-stat"><span className="mrv-stat-num">{(avgMs / 1000).toFixed(1)}<small>s</small></span><span className="mrv-stat-label">Avg answer</span></div>
        <div className="mrv-stat"><span className="mrv-stat-num">#{current.rank}</span><span className="mrv-stat-label">Finish</span></div>
      </section>

      {/* Where the race was won and lost. */}
      <section className="mrv-systems">
        {bySystem.map(s => {
          const pct = s.total ? Math.round((s.right / s.total) * 100) : 0;
          return (
            <button
              key={s.short}
              type="button"
              className={`mrv-sys${system === s.short ? ' is-on' : ''}`}
              onClick={() => setSystem(system === s.short ? 'all' : s.short)}
              title={`${s.right} of ${s.total} correct`}
            >
              <span className="mrv-sys-icon" aria-hidden="true">{s.icon}</span>
              <span className="mrv-sys-name">{s.short}</span>
              <span className="mrv-sys-bar"><i style={{ width: `${pct}%` }} className={pct >= 80 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-poor'} /></span>
              <span className="mrv-sys-pct">{s.right}/{s.total}</span>
            </button>
          );
        })}
      </section>

      {(best || worst) && best !== worst && (
        <p className="mrv-takeaway">
          {isMe ? 'Your' : `${current.username}'s`} strongest system was <strong>{best.icon} {best.short}</strong>
          {worst && <> · weakest was <strong>{worst.icon} {worst.short}</strong></>}
        </p>
      )}

      {/* Filters. */}
      <div className="mrv-filters">
        {[['all', 'All'], ['wrong', 'Wrong'], ['right', 'Correct'], ['missed', 'Timed out']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`mrv-filter${filter === key ? ' is-on' : ''}`}
            onClick={() => setFilter(key)}
          >{label}</button>
        ))}
        {system !== 'all' && (
          <button type="button" className="mrv-filter is-clear" onClick={() => setSystem('all')}>
            {system} ✕
          </button>
        )}
        <span className="mrv-count">{shown.length} shown</span>
        <button
          type="button"
          className="mrv-filter mrv-filter--wide"
          onClick={() => setOpen(allOpen ? new Set() : new Set(shown.map(r => r.i)))}
        >{allOpen ? 'Collapse all' : 'Expand all'}</button>
      </div>

      {/* The questions. */}
      <ol className="mrv-list">
        {shown.map(r => {
          const mine = r.mine;
          const state = !mine || mine.picked == null ? 'missed' : mine.correct ? 'right' : 'wrong';
          const isOpen = open.has(r.i);
          return (
            <li key={r.i} className={`mrv-item mrv-item--${state}${isOpen ? ' is-open' : ''}`}>
              <button type="button" className="mrv-item-head" onClick={() => toggle(r.i)} aria-expanded={isOpen}>
                <span className="mrv-item-num">{r.i + 1}</span>
                <span className="mrv-item-sys">{r.systemIcon} {r.systemShort}</span>
                <span className="mrv-item-q">{r.question}</span>
                <span className="mrv-item-mark" aria-hidden="true">
                  {state === 'right' ? '✓' : state === 'wrong' ? '✕' : '⏱'}
                </span>
                {mine && <span className="mrv-item-pts">{mine.points ? `+${mine.points}` : '0'}</span>}
              </button>

              {isOpen && (
                <div className="mrv-item-body">
                  {r.imageUrl && <img className="mrv-item-img" src={r.imageUrl} alt="" />}
                  <div className="mrv-answers">
                    <p className={`mrv-answer mrv-answer--${state === 'right' ? 'right' : 'wrong'}`}>
                      <span className="mrv-answer-label">{isMe ? 'You answered' : `${current.username} answered`}</span>
                      <span className="mrv-answer-text">
                        {mine && mine.picked != null ? mine.picked : 'No answer — the clock ran out'}
                      </span>
                    </p>
                    {state !== 'right' && (
                      <p className="mrv-answer mrv-answer--key">
                        <span className="mrv-answer-label">Correct answer</span>
                        <span className="mrv-answer-text">{r.correctAnswer || '—'}</span>
                      </p>
                    )}
                  </div>

                  {r.explanation ? (
                    <div className="mrv-expl explanation-rich">
                      <span className="mrv-expl-label">Why</span>
                      {parseRichText(r.explanation)}
                    </div>
                  ) : (
                    <p className="mrv-expl mrv-expl--none">No explanation was written for this question.</p>
                  )}

                  {mine && (
                    <p className="mrv-meta">
                      {(mine.ms / 1000).toFixed(1)}s
                      {mine.points > 0 && <> · {mine.points} points{mine.points > 100 ? ` (${mine.points - 100} speed bonus)` : ''}</>}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {shown.length === 0 && <p className="mrv-none">Nothing matches that filter.</p>}

      <footer className="mrv-foot">
        <button type="button" className="mrv-btn" onClick={onClose}>← Back to standings</button>
      </footer>
    </div>
  );
}
