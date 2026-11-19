import { useCallback, useEffect, useState } from 'react';
import { getToken } from '../auth';
import { SERVER_URL } from '../serverUrl';

/**
 * Recall ratings for FA Images and FA HY Qs — the same six self-assessments
 * UWorld Adventure and the First Aid Journey use, picked under each
 * explanation. Saved per (user, mode, question) in fa_question_ratings
 * (fa-question-ratings-migration.sql); re-rating overwrites.
 */
export const FA_RATING_GROUPS = [
  {
    label: 'Didn’t have it',
    items: [
      { key: 'knowledge_gap', label: 'Knowledge Gap', icon: '🧠' },
      { key: 'careless_miss', label: 'Careless Miss', icon: '😅' },
      { key: 'lucky_guess', label: 'Educational/Lucky Guess', icon: '🍀' },
    ],
  },
  {
    label: 'Had it',
    items: [
      { key: 'somewhat_know', label: 'Somewhat Know', icon: '🤔' },
      { key: 'fully_understood', label: 'Fully Understood', icon: '✅' },
      { key: 'long_term_memory', label: 'Long-term Memory', icon: '🗄️' },
    ],
  },
];
export const FA_RATINGS = FA_RATING_GROUPS.flatMap(g => g.items);
// Not a rating: the opener's "study by rating" chip for questions never rated.
export const FA_UNRATED = { key: 'unrated', label: 'Unrated', icon: '○' };
export const FA_RATING_FILTERS = [...FA_RATINGS, FA_UNRATED];

const authHeaders = () => {
  const t = getToken();
  return t ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` } : null;
};

/**
 * Ratings for one run: loads what the student gave these questions before,
 * and saves new ones. `ids` should change only when a new run starts.
 */
export function useFaRatings(mode, ids) {
  const [ratings, setRatings] = useState({});
  const [problem, setProblem] = useState(null);   // null | 'missing_table' | 'failed'
  const key = (ids || []).join(',');

  useEffect(() => {
    setRatings({});
    const h = authHeaders();
    if (!h || !key) return undefined;
    let live = true;
    fetch(`${SERVER_URL}/api/fa-ratings?mode=${mode}&ids=${encodeURIComponent(key)}`, { headers: h })
      .then(r => r.json())
      .then(d => {
        if (!live) return;
        setRatings(d.ratings || {});
        if (d.reason === 'missing_table') setProblem('missing_table');
      })
      .catch(() => {});
    return () => { live = false; };
  }, [mode, key]);

  const rate = useCallback((questionId, rating) => {
    setRatings(r => ({ ...r, [questionId]: rating }));
    const h = authHeaders();
    if (!h) return;
    fetch(`${SERVER_URL}/api/fa-ratings`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ mode, question_id: questionId, rating }),
    })
      .then(r => r.json())
      .then(d => { setProblem(d.ok ? null : d.reason === 'missing_table' ? 'missing_table' : 'failed'); })
      .catch(() => setProblem('failed'));
  }, [mode]);

  return { ratings, rate, problem, signedIn: Boolean(getToken()) };
}

/**
 * Every rating the student has given in `mode` ({ question_id: rating }), for
 * "study by your rating". Reloads each time `active` turns on (the opener
 * coming back after a block), so new ratings count at once.
 */
export function useMyFaRatings(mode, active) {
  const [ratings, setRatings] = useState({});
  const [problem, setProblem] = useState(null);
  const signedIn = Boolean(getToken());
  useEffect(() => {
    const h = authHeaders();
    if (!active || !h) return undefined;
    let live = true;
    fetch(`${SERVER_URL}/api/fa-ratings/mine?mode=${mode}`, { headers: h })
      .then(r => r.json())
      .then(d => {
        if (!live) return;
        setRatings(d.ratings || {});
        setProblem(d.reason === 'missing_table' ? 'missing_table' : d.reason ? 'failed' : null);
      })
      .catch(() => { if (live) setProblem('failed'); });
    return () => { live = false; };
  }, [mode, active]);
  return { ratings, problem, signedIn };
}

/** The six buttons, under an explanation. Picking one saves it, then moves on. */
export function FARatingBar({ questionId, current, onRate, onNext, problem, signedIn }) {
  if (!signedIn) return null;
  return (
    <div className="fai-rate" role="group" aria-label="How well did you know this?">
      <span className="fai-rate-head">How well did you know it?</span>
      {FA_RATING_GROUPS.map(g => (
        <div key={g.label} className="fai-rate-group">
          <span className="fai-rate-label">{g.label}</span>
          <div className="fai-rate-row">
            {g.items.map(it => (
              <button key={it.key} type="button"
                className={`fai-rate-btn${current === it.key ? ' is-on' : ''}`}
                aria-pressed={current === it.key}
                onClick={() => { onRate(questionId, it.key); setTimeout(() => onNext?.(), 350); }}>
                <span aria-hidden="true">{it.icon}</span> {it.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {current && <span className="fai-rate-was">Your rating: {FA_RATINGS.find(r => r.key === current)?.label}</span>}
      {problem === 'missing_table' && <span className="fai-rate-warn">Ratings are not saving yet — the fa_question_ratings table needs creating in the database.</span>}
      {problem === 'failed' && <span className="fai-rate-warn">That rating did not save — check your connection.</span>}
    </div>
  );
}

/** Tally of this run's ratings, for the notes page. */
export function FARatingTally({ ids, ratings }) {
  const counts = FA_RATINGS.map(r => ({ ...r, n: ids.filter(id => ratings[id] === r.key).length })).filter(r => r.n);
  if (!counts.length) return null;
  return (
    <div className="fai-rate-tally">
      <span className="fai-kicker">YOUR RATINGS</span>
      {counts.map(c => <span key={c.key} className="fai-rate-chip"><span aria-hidden="true">{c.icon}</span> {c.label} <b>{c.n}</b></span>)}
    </div>
  );
}
