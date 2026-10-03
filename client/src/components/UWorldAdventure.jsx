import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getToken, fetchMe, getCachedUser, authFetch } from '../auth';
import SoloGame from './SoloGame';
import { useStudyActivity } from '../studyPresence';
import { cachedImageMap, rememberImageMap } from '../utils/cachedImages';
import { JOURNEY_SUBJECTS } from '../journeySubjects';
import { DEFAULT_QUESTION_BANK_MODE } from '../questionBankModes';
import './UWorldAdventure.css';

// Slider bounds (mockup) and the fallback pace for a subject with no saved one.
// 15 rather than the mockup's larger number: the real pool is 708 questions
// across four subjects, so a big default would "finish" a subject in days.
const PACE_MIN = 5;
const PACE_MAX = 100;
const PACE_DEFAULT = 15;
const PACE_SAVE_DEBOUNCE_MS = 600;

// "Review Rated Questions" pile picker — same five self-assessment buckets
// SoloGame's rating row writes (see UWORLD_RATINGS there and server-side),
// plus two synthetic piles the server's by-rating endpoint also understands:
// 'all' (every UWorld question this user has ever been served) and 'unrated'
// (served, never rated). Order here is render order.
const UWORLD_RATING_PILES = [
  { key: 'all',               label: 'Study All',       icon: '📚' },
  { key: 'knowledge_gap',     label: 'Knowledge Gap',    icon: '🧠' },
  { key: 'careless_miss',     label: 'Careless Miss',    icon: '😅' },
  { key: 'lucky_guess',       label: 'Lucky Guess',      icon: '🍀' },
  { key: 'somewhat_know',     label: 'Somewhat Know',    icon: '🤔' },
  { key: 'fully_understood',  label: 'Fully Understood', icon: '✅' },
  { key: 'unrated',           label: 'Not Yet Rated',    icon: '⬜' },
];
// A review pull is capped the same as any other session request — see
// UNSEEN_MAX_LIMIT server-side.
const UWORLD_REVIEW_LIMIT = 100;

// Star field for the ambient backdrop — position, size and animation offsets
// straight from the mockup. Static data, so it lives outside the component and
// never re-creates on render.
const UWA_STARS = [
  { top: '12%', left: '20%', '--s': '3px', '--dur': '4s',   '--delay': '0s'   },
  { top: '22%', left: '70%', '--s': '2px', '--dur': '5.5s', '--delay': '0.8s' },
  { top: '60%', left: '82%', '--s': '3px', '--dur': '3.6s', '--delay': '1.4s' },
  { top: '75%', left: '12%', '--s': '2px', '--dur': '4.8s', '--delay': '2.1s' },
  { top: '45%', left: '8%',  '--s': '2px', '--dur': '5s',   '--delay': '0.4s' },
  { top: '85%', left: '55%', '--s': '3px', '--dur': '4.2s', '--delay': '1.8s' },
];

// Fisher-Yates. /api/questions/unseen returns a DETERMINISTIC order (stable
// pagination), so without this every session would play in the same sequence.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Mockup's format: "March 14, 2027".
function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// <input type="date"> wants yyyy-mm-dd in LOCAL time. toISOString() would shift
// the day for anyone west of UTC, so build it from the local parts.
function toInputDate(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Study days from today to a yyyy-mm-dd string, INCLUSIVE of both ends — today
// is day 1, so "finish by tomorrow" is two days of work, not one. That has to
// match the projection's `today + days - 1` or the two directions disagree by a
// day. Floor 1: "finish by today" and any past date both mean one sitting.
function daysUntil(inputDate) {
  const [y, m, d] = inputDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today  = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((target - today) / 86400000) + 1);
}

// The pace endpoint validates 1-200, so a deadline that demands more than that
// cannot be saved — it is reported as out of reach instead of silently clamped.
const PACE_SAVE_MAX = 200;


// user_prep_pace is keyed (user_id, subject), but the plan this page shows is
// adventure-wide — so the pace is stored ONCE under a reserved key rather than
// per subject. Switching subjects used to load that subject's own saved pace and
// silently move the slider, which read as the page changing your mind for you.
// `subject` has no FK and is validated only as a non-empty string, so a sentinel
// is safe here.
// (PACE_SCOPE is now per-mode — see questionBankModes.js.)

/**
 * UWorld Adventure — pick a subject, commit to a daily pace, and see honestly
 * how long the remaining question bank will take at that rate.
 *
 * Everything on this page is real: subjects come from the live `active` flag (so
 * a fifth subject appears here the moment it has content, with no code change),
 * counts come from /api/users/:id/question-bank-progress, and a session plays
 * only questions this user has genuinely never seen.
 *
 * There is deliberately NO "Systems" facet — no real data backs one today.
 */
// The four paces the mockup offers as one tap each. The slider under
// "Fine-tune your plan" still reaches everything in between.
const PACE_PRESETS = [10, 20, 30, 40];

// A line under each subject's name. Keyed on the subject NAME rather than its
// id because ids differ between banks while the names are the standard ones;
// anything unrecognised gets a sentence built from its own name rather than a
// blank space.
const SUBJECT_BLURBS = {
  anatomy: 'Explore the structure that makes life possible.',
  physiology: 'Discover how the body works together.',
  pathology: 'Uncover the why behind disease.',
  pharmacology: 'Learn how treatments make a difference.',
  microbiology: 'Meet the microbes that shape our world.',
  biochemistry: 'Connect the molecules of life.',
  'behavioral science': 'Understand the mind, behavior, and society.',
  'behavioural science': 'Understand the mind, behaviour, and society.',
  immunology: 'Explore the body’s defense systems.',
  biostatistics: 'Read the evidence with confidence.',
  haematology: 'Follow the blood and what goes wrong in it.',
  hematology: 'Follow the blood and what goes wrong in it.',
  'haematology & oncology': 'Blood disorders and the cancers behind them.',
  'hematology & oncology': 'Blood disorders and the cancers behind them.',
  'heme onc': 'Blood disorders and the cancers behind them.',
  oncology: 'How cancers start, spread and are treated.',
  renal: 'Filtration, fluids and the kidneys that manage them.',
  nephrology: 'Filtration, fluids and the kidneys that manage them.',
  respiratory: 'Air in, gas exchanged, carbon dioxide out.',
  gastrointestinal: 'From the first bite to the last absorption.',
  endocrine: 'The hormones that keep everything in balance.',
  reproductive: 'Development, pregnancy and the systems behind them.',
  musculoskeletal: 'Bones, muscles and the tissue holding them together.',
  'musculoskeletal, skin & connective tissue': 'Bones, muscles, skin and connective tissue.',
  cardiovascular: 'The heart and every vessel it feeds.',
  'public health sciences': 'Evidence, populations and the numbers behind them.',
  'neurology & special senses': 'The nervous system and the senses it serves.',
  genetics: 'Trace the code we inherit.',
  cardiology: 'Follow the heart and its circulation.',
  neurology: 'Map the nervous system, nerve by nerve.',
  psychiatry: 'Recognise the patterns behind the presentation.',
};
const subjectBlurb = (name) =>
  SUBJECT_BLURBS[String(name || '').trim().toLowerCase()] || `Work through ${name} question by question.`;

// Artwork for a subject with no picture of its own: a calm tint derived from
// the name, so each card is distinct and stable rather than randomly coloured
// on every render.
// The same subject colours First Aid Journey uses, matched by id or name so a
// subject looks like itself wherever it appears. Anything with no match falls
// back to a hue derived from its name, so a new subject is still distinct.
const JOURNEY_RGB = new Map();
for (const s of JOURNEY_SUBJECTS) {
  JOURNEY_RGB.set(s.id, s.rgb);
  JOURNEY_RGB.set(s.label.toLowerCase(), s.rgb);
}
// Names the two lists spell differently.
const SUBJECT_RGB_ALIASES = {
  anatomy: '161, 136, 127',
  physiology: '38, 198, 218',
  'behavioral science': '92, 107, 192',
  'behavioural science': '92, 107, 192',
  biostatistics: '255, 202, 40',
  genetics: '124, 179, 66',
  cardiology: '239, 83, 80',
  neurology: '126, 87, 194',
  nephrology: '41, 182, 246',
};
function subjectRgb(s) {
  const id = String(s.id || '').toLowerCase();
  const name = String(s.name || '').toLowerCase();
  const hit = JOURNEY_RGB.get(id) || JOURNEY_RGB.get(name)
    || SUBJECT_RGB_ALIASES[id] || SUBJECT_RGB_ALIASES[name];
  if (hit) return hit;
  let h = 0;
  for (const ch of (id || name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return hslToRgbTriple(h, 62, 58);
}
function hslToRgbTriple(h, sPct, lPct) {
  const sat = sPct / 100, light = lPct / 100;
  const k = n => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = n => Math.round(255 * (light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `${f(0)}, ${f(8)}, ${f(4)}`;
}
function subjectArt(s) {
  return { '--uwa-art-rgb': subjectRgb(s) };
}

export default function UWorldAdventure({ mode = DEFAULT_QUESTION_BANK_MODE }) {
  // Which bank this page is working through. Everything below is the same
  // machine — only the tag it filters on, the pace it plans and the colours
  // it wears change.
  const MODE = mode.id;
  const PACE_SCOPE = mode.paceScope;
  const [user, setUser] = useState(getCachedUser);
  // Which system's option menu is open (subject id), or null. Opening it is
  // what clicking a subject does.
  const [systemModal, setSystemModal] = useState(null);
  const [subjects, setSubjects] = useState([]);
  // Subjects switched off for this bank: shown darkened as "Under development"
  // rather than hidden. Never selectable, never counted in the pace maths.
  const [devSubjects, setDevSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState(false);
  const [selected, setSelected] = useState(null);       // subject id
  // Hero backdrop, admin-set via the landing-images slot 'uwa_hero'.
  const [heroUrl, setHeroUrl] = useState(() => cachedImageMap('landing').uwa_hero || null);
  useStudyActivity(mode?.label || 'Question Bank',
    selected ? (subjects.find(s => s.id === selected)?.name || null) : null,
    mode?.id || 'question_bank');
  const [progress, setProgress] = useState(null);       // selected subject: { total, seen, unseen }
  // Every subject's counts, so the grid can show what is left without being
  // clicked. { [subjectId]: { total, seen, unseen } }
  const [subjectCounts, setSubjectCounts] = useState({});
  const [overall, setOverall]   = useState(null);       // every subject, same shape
  const [pace, setPace] = useState(PACE_DEFAULT);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  // Which way round the player is planning: set a daily pace and be told the
  // finish date, or name a finish date and be told the daily pace. Both write to
  // the SAME `pace` state — the deadline input just solves for it — so the two
  // views can never drift apart or disagree about when you finish.
  const [planBy, setPlanBy] = useState('pace');   // 'pace' | 'date'
  const [deadlineWarning, setDeadlineWarning] = useState('');
  // The date the player actually picked. Kept separately from the projection so
  // the field does not snap under them: whole questions per day rarely divide a
  // pool evenly (177 in 31 days is 6/day, which really finishes in 30), so the
  // honest finish date can land a day or two EARLY. That truth belongs in the
  // projection row below, not in the box they just typed in.
  const [pickedDate, setPickedDate] = useState(null);

  // Question order for a block: 'random' (the long-standing behaviour, kept as
  // the default) or 'sequential' — /api/questions/unseen's own deterministic
  // pagination order. Stored per-user in localStorage like Journey's own order
  // toggle, so it sticks between visits.
  const [questionOrder, setQuestionOrder] = useState(() => {
    try { return localStorage.getItem('mr_uwa_q_order') === 'sequential' ? 'sequential' : 'random'; }
    catch { return 'random'; }
  });
  function chooseQuestionOrder(v) {
    setQuestionOrder(v);
    try { localStorage.setItem('mr_uwa_q_order', v); } catch {}
  }

  // The live session. Held in state and set ONCE per start so the array
  // reference stays stable — SoloGame's fetch effect depends on it.
  const [sessionQuestions, setSessionQuestions] = useState(null);
  // Set alongside sessionQuestions when the current session came from a
  // rating-group pile rather than "Start Today's Questions" — tells SoloGame
  // to skip seen-tracking (uwaReview) and changes the level label / End
  // Block copy so a review reads as one, not a fresh daily block.
  const [reviewSession, setReviewSession] = useState(false);
  const [reviewLabel,   setReviewLabel]   = useState('');
  const [reviewLoading, setReviewLoading] = useState(null); // pile key currently loading, or null
  const [reviewError,   setReviewError]   = useState('');
  // { total, unrated, knowledge_gap, careless_miss, lucky_guess, somewhat_know,
  // fully_understood } — counts for the "Review Rated Questions" pile list.
  const [ratingCounts, setRatingCounts] = useState(null);

  const saveTimerRef = useRef(null);
  const paceLoadedRef = useRef(false); // guards the save-on-change effect

  // Same own-identity guard the other authed pages use.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => { if (me) setUser(me); });
  }, []);

  // Live subject list — never hardcoded, so a newly enabled subject shows up on
  // its own. Which subjects appear is chosen PER BANK in that mode's admin tab
  // (gameSettings.questionBankSubjects); a bank with no list of its own falls
  // back to the global active flag, which is what every bank did before.
  //
  // Both requests are needed and are fetched together: one for the subjects,
  // one for this bank's list. Applying the filter here matches the rule the
  // progress endpoints apply server-side, so the grid and the pace maths can
  // never describe different sets of subjects.
  useEffect(() => {
    authFetch('/api/landing-images')
      .then(r => r.json())
      .then(d => { rememberImageMap('landing', d.images); setHeroUrl(d.images?.uwa_hero || null); })
      .catch(() => {}); // no backdrop → the page's own gradient
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      authFetch('/api/subjects').then(r => r.json()),
      authFetch('/api/game-settings').then(r => r.json()).catch(() => ({})),
    ])
      .then(([data, settings]) => {
        if (cancelled) return;
        const configured = settings?.questionBankSubjects?.[MODE];
        const allow = Array.isArray(configured) && configured.length ? new Set(configured) : null;
        const active = (data.subjects || []).filter(s => (allow ? allow.has(s.id) : s.active));
        setSubjects(active);
        setDevSubjects((data.subjects || []).filter(s => !(allow ? allow.has(s.id) : s.active)));
        // Open on the first subject so the pace card is populated on arrival,
        // the way the mockup shows it — an empty card above a subject grid
        // reads as broken. Picking another subject just re-points it.
        setSelected(prev => prev || (active[0]?.id ?? null));
      })
      .catch(() => { if (!cancelled) setSubjectsError(true); });
    return () => { cancelled = true; };
  }, [MODE]);

  const loadProgress = useCallback(async (subjectId) => {
    if (!user?.id) return null;
    const res = await authFetch(`/api/users/${user.id}/question-bank-progress?subject=${encodeURIComponent(subjectId)}&mode=${MODE}`);
    return res.json();
  }, [user?.id]);

  // Whole-adventure progress: the same endpoint with NO subject sums every
  // active subject. The pace card plans against this, not the open subject —
  // "when do I finish UWorld Adventure" is a question about all of it. Also
  // carries the client's own local date + zone offset, so `done_today` (how
  // much of today's pace is already spent) is bucketed by the player's own
  // calendar day rather than server UTC — same convention AnKing's daily new-
  // card allowance uses.
  const loadOverall = useCallback(async () => {
    if (!user?.id) return null;
    const now = new Date();
    const params = new URLSearchParams({
      local_date: now.toLocaleDateString('en-CA'),
      tz_offset:  String(now.getTimezoneOffset()),
    });
    const res = await authFetch(`/api/users/${user.id}/question-bank-progress?${params}&mode=${MODE}`);
    return res.json();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadOverall()
      .then(o => { if (!cancelled && o) setOverall(o); })
      .catch(() => {});
    // Per-subject counts for the grid. One request for every subject — the
    // page used to know only the SELECTED subject's remaining count, so the
    // number appeared on a card only after you clicked it.
    authFetch(`/api/question-bank-progress/by-subject?mode=${MODE}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d && typeof d.subjects === 'object') setSubjectCounts(d.subjects); })
      .catch(() => {});   // the grid is still usable without counts
    return () => { cancelled = true; };
  }, [user?.id, loadOverall, MODE]);

  // Rating-pile counts for "Review Rated Questions" — scoped to the OPEN
  // SUBJECT. Revision is per system: a pile mixing biochemistry with
  // pulmonology is not a session anyone would choose to sit. (The pace above
  // stays adventure-wide; that one genuinely is a whole-adventure number.)
  const loadRatingCounts = useCallback(async (subjectId) => {
    if (!user?.id || !subjectId) return null;
    const res = await authFetch(`/api/uworld-questions/rating-counts?subject=${encodeURIComponent(subjectId)}&mode=${MODE}`);
    return res.json();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selected) { setRatingCounts(null); return; }
    let cancelled = false;
    // Clear FIRST. Without this the counts linger from the previously opened
    // system until the new fetch lands, so tapping a system with one question
    // right after a system with forty-four showed "44 questions" — the piles
    // are disabled while null, so this also stops anyone launching a pile
    // against another system's numbers.
    setRatingCounts(null);
    loadRatingCounts(selected)
      .then(c => { if (!cancelled && c) setRatingCounts(c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, selected, loadRatingCounts]);

  // The pace is loaded ONCE per visit, not per subject — it belongs to the
  // adventure, so switching subjects must leave the slider exactly where the
  // player put it.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    authFetch(`/api/users/${user.id}/prep-pace?subject=${encodeURIComponent(PACE_SCOPE)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const saved = Number(data?.daily_target);
        if (Number.isFinite(saved) && saved > 0) {
          setPace(Math.min(PACE_SAVE_MAX, Math.max(PACE_MIN, saved)));
        }
        paceLoadedRef.current = true;
      })
      .catch(() => { if (!cancelled) paceLoadedRef.current = true; });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Selecting a subject pulls its real counts. The pace is untouched here.
  useEffect(() => {
    if (!selected || !user?.id) return;
    let cancelled = false;
    setLoadingSubject(true);

    loadProgress(selected)
      .then(prog => { if (!cancelled) setProgress(prog || { total: 0, seen: 0, unseen: 0 }); })
      .catch(() => { if (!cancelled) setProgress({ total: 0, seen: 0, unseen: 0 }); })
      .finally(() => { if (!cancelled) setLoadingSubject(false); });

    return () => { cancelled = true; };
  }, [selected, user?.id, loadProgress]);

  // Persist the pace, debounced — a slider drag fires this once at rest, not per
  // pixel. Skipped until the saved pace has loaded, so the fetched value is
  // never immediately overwritten by its own arrival.
  useEffect(() => {
    if (!paceLoadedRef.current) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      authFetch('/api/prep-pace', {
        method: 'POST',
        body: JSON.stringify({ subject: PACE_SCOPE, daily_target: pace }),
      }).catch(() => {}); // a lost preference must never interrupt the page
    }, PACE_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [pace]);

  // Adventure-wide, not per-subject — the pace itself is adventure-wide (see
  // PACE_SCOPE), so finishing 20 of an 80/day goal in Anatomy this morning must
  // leave only 60 owed this afternoon, in Pharmacology or anywhere else. Once
  // the day's goal is met, a block reverts to serving a full `pace` again
  // rather than refusing to start — the goal is a target, not a lockout.
  const doneToday      = overall?.done_today ?? 0;
  const remainingToday = Math.max(0, pace - doneToday);
  const blockSize      = remainingToday > 0 ? remainingToday : pace;

  // Whole-adventure projection — computed here (not just below, alongside the
  // setup page) because the End Block confirm dialog needs it too, and that
  // dialog renders from the early `sessionQuestions` return below.
  // If the bank ever outgrows the target, the target stops mattering.
  // A bank with a KNOWN final size plans against it, because pacing against a
  // partial upload would promise a finish in a week. A bank with no published
  // total (Saudi MLE) plans against whatever is really there and grows as
  // questions are added — a fixed target it can never reach would put the
  // finish date permanently out of sight.
  const plannedTotal     = mode.targetTotal
    ? Math.max(mode.targetTotal, overall?.total ?? 0)
    : (overall?.total ?? 0);
  const plannedSeen      = Math.min(overall?.seen ?? 0, plannedTotal);
  const plannedRemaining = Math.max(0, plannedTotal - plannedSeen);
  const daysToFinish = plannedRemaining > 0 ? Math.ceil(plannedRemaining / pace) : 0;
  const completionDate = new Date();
  // Day 1 is TODAY, so a one-day plan finishes today — not tomorrow. This also
  // makes the deadline picker round-trip exactly: pick a date, get a pace, and
  // that pace projects back to the date you picked.
  completionDate.setDate(completionDate.getDate() + Math.max(0, daysToFinish - 1));

  async function startSession() {
    if (!selected || starting) return;
    setStarting(true);
    setStartError('');
    try {
      const res = await authFetch(`/api/questions/unseen?subject=${encodeURIComponent(selected)}&limit=${blockSize}&mode=${MODE}`);
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        setStartError('No unseen questions left for this subject — you have finished the bank.');
        setStarting(false);
        return;
      }
      setReviewSession(false);
      // set once: stable reference for SoloGame
      setSessionQuestions(questionOrder === 'random' ? shuffle(qs) : qs);
    } catch {
      setStartError('Could not load your questions. Check your connection and try again.');
    }
    setStarting(false);
  }

  // Rating-group review: pulls up to UWORLD_REVIEW_LIMIT questions from one
  // pile and plays them through the SAME exam skin, minus its consequences —
  // SoloGame's uwaReview prop skips postQuestionSeen entirely for this
  // session, so nothing here can move the 3,659-question total or the daily
  // pace either way, no matter how many times a pile is replayed.
  async function startReview(ratingKey, label) {
    if (reviewLoading) return;
    setReviewLoading(ratingKey);
    setReviewError('');
    try {
      // Always subject-scoped — the piles are per system, so the questions
      // pulled for one must be too.
      const res = await authFetch(
        `/api/uworld-questions/by-rating?rating=${encodeURIComponent(ratingKey)}` +
        `&subject=${encodeURIComponent(selected)}&limit=${UWORLD_REVIEW_LIMIT}&mode=${MODE}`
      );
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        setReviewError('No questions in this group yet.');
        setReviewLoading(null);
        return;
      }
      setSystemModal(null);   // the session replaces the view; don't leave it queued to reopen
      setReviewLabel(label);
      setReviewSession(true);
      setSessionQuestions(shuffle(qs)); // set once: stable reference for SoloGame
    } catch {
      setReviewError('Could not load these questions. Check your connection and try again.');
    }
    setReviewLoading(null);
  }

  // Game-over side effect. Mirrors handleTrainingComplete: fire-and-forget, and
  // the player's results screen never waits on it. Fires for review sessions
  // too (still worth an activity_sessions row so a review shows up in Daily
  // Activity) — it's only the SEEN-tracking that a review skips.
  function handleComplete({ pct, activeSeconds }) {
    authFetch('/api/question-bank-session', {
      method: 'POST',
      body: JSON.stringify({ subject: selected, pct, seconds: activeSeconds, mode: MODE }),
    }).catch(() => {});
  }

  // Leaving the session: back to setup with FRESH counts — the questions just
  // answered are now marked seen (unless this was a review), so the remaining
  // pool and the rating piles both visibly update.
  function endSession() {
    setSessionQuestions(null);
    setReviewSession(false);
    if (selected) {
      loadProgress(selected).then(p => { if (p) setProgress(p); }).catch(() => {});
    }
    // The adventure-wide count moved too, so the projection shortens visibly.
    loadOverall().then(o => { if (o) setOverall(o); }).catch(() => {});
    // ...and so did the grid's "N left" badges. Without this they would keep
    // showing the pre-session number until the page was reloaded.
    authFetch(`/api/question-bank-progress/by-subject?mode=${MODE}`)
      .then(r => r.json())
      .then(d => { if (d && typeof d.subjects === 'object') setSubjectCounts(d.subjects); })
      .catch(() => {});
    // Needs the subject now that piles are per system — called bare it just
    // returned null and the counts never refreshed after a session.
    if (selected) loadRatingCounts(selected).then(c => { if (c) setRatingCounts(c); }).catch(() => {});
  }

  // Esc closes the system menu, like any other dialog.
  //
  // MUST sit above the early return below. It was under it, so starting a
  // session — which sets sessionQuestions and takes that branch — skipped this
  // hook and React saw fewer hooks than the previous render (error #300), which
  // is why clicking a pile crashed the page.
  useEffect(() => {
    if (!systemModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setSystemModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [systemModal]);

  if (sessionQuestions) {
    return (
      <SoloGame
        subject={selected}
        username={user?.username}
        difficulty="easy"
        providedQuestions={sessionQuestions}
        uworldSkin
        examTheme={mode}
        uwaReview={reviewSession}
        onComplete={handleComplete}
        onBack={endSession}
        levelLabel={reviewSession ? `Review · ${reviewLabel}` : `Daily Set · ${subjects.find(s => s.id === selected)?.name || selected}`}
        // End Block's own confirm dialog needs to say "you'll have N left
        // today, to finish by <date>" — SoloGame has no idea about the
        // adventure-wide pace/projection, so it's handed down as of this
        // block's start. SoloGame subtracts its own live answered-count from
        // uwaRemainingToday to keep the number accurate as the block plays.
        // Ignored entirely when uwaReview is set (SoloGame shows a different
        // message there instead — a review never touches either number).
        uwaRemainingToday={remainingToday}
        uwaCompletionLabel={plannedRemaining > 0 ? formatDate(completionDate) : null}
      />
    );
  }

  const activeName = subjects.find(s => s.id === selected)?.name || '';

  // Two different numbers, deliberately kept apart:
  //   unseen  — what the OPEN SUBJECT can actually serve right now. Governs the
  //             Start button and the session. Always real.
  //   planned — the whole adventure at its finished size. Governs the pace
  //             projection and the deadline solver.
  const unseen = progress?.unseen ?? 0;
  const todaysCount = Math.min(blockSize, unseen);
  const goalMetToday = doneToday > 0 && remainingToday === 0;

  return (
    <div className={`uwa uwa--${MODE}`} style={{ '--uwa-accent-rgb': mode.accentRgb }}>
      {/* Ambient backdrop: three drifting blurred blobs + a scatter of twinkling
          stars. Purely decorative — inert to pointers, hidden from assistive
          tech, and clipped by its own layer so the oversized blobs never add a
          scrollbar. Animates transform/opacity only (compositor-friendly), and
          stops entirely under prefers-reduced-motion. */}
      <div className="uwa-decor" aria-hidden="true">
        <span className="uwa-blob uwa-blob--1" />
        <span className="uwa-blob uwa-blob--2" />
        <span className="uwa-blob uwa-blob--3" />
        {UWA_STARS.map((s, i) => (
          <span key={i} className="uwa-star" style={s} />
        ))}
      </div>

      {/* ── Top bar ──────────────────────────────────────────────────────
          Site nav rather than a lone wordmark: this page is a destination in
          its own right, so the way out (and the player's level) belong here. */}
      <nav className="uwa-nav">
        <a className="uwa-brand" href="/dashboard">
          <span className="uwa-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30">
              <circle cx="16" cy="16" r="15" fill="rgb(var(--uwa-accent-rgb))" opacity="0.12" />
              <path d="M16 5a11 11 0 1 0 11 11" fill="none" stroke="rgb(var(--uwa-accent-rgb))" strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="16" cy="16" r="4.2" fill="rgb(var(--uwa-accent-rgb))" />
            </svg>
          </span>
          <span className="uwa-brand-name">Medvale</span>
        </a>

        <span className="uwa-nav-spacer" />

        {/* Level chip: 500 XP a level, the same arithmetic the dashboard and
            stats page use, so the three never disagree. */}
        <a className="uwa-levelchip" href="/stats" title="Your progress">
          <span className="uwa-avatar">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
              : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
          </span>
          <span className="uwa-levelchip-text">
            <b>Level {Math.floor((user?.xp || 0) / 500) + 1}</b>
            <span className="uwa-xpbar">
              <span className="uwa-xpbar-fill" style={{ width: `${((user?.xp || 0) % 500) / 5}%` }} />
            </span>
            <small>{(user?.xp || 0) % 500} / 500 XP</small>
          </span>
        </a>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="uwa-hero">
        {/* Layered ridgelines behind the title: drawn rather than shipped as a
            photo so it stays crisp at any width and costs nothing. An admin
            image, when set, sits over the top of it. */}
        <div className="uwa-hero-art" aria-hidden="true" style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : undefined}>
          {!heroUrl && (
            <svg className="uwa-ridge" viewBox="0 0 1200 320" preserveAspectRatio="none">
              <defs>
                <linearGradient id="uwaSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12284f" />
                  <stop offset="100%" stopColor="#0a1730" />
                </linearGradient>
              </defs>
              <rect width="1200" height="320" fill="url(#uwaSky)" />
              <circle cx="960" cy="86" r="42" fill="#4d8bf0" opacity="0.18" />
              <circle cx="960" cy="86" r="22" fill="#9cc4ff" opacity="0.5" />
              <path d="M0 232 L170 150 L280 206 L420 116 L560 232 L700 168 L840 236 L1000 150 L1200 226 L1200 320 L0 320 Z" fill="#16305c" opacity="0.85" />
              <path d="M0 268 L150 210 L300 262 L470 190 L620 268 L780 216 L940 274 L1100 214 L1200 262 L1200 320 L0 320 Z" fill="#1d3f74" opacity="0.75" />
              <path d="M0 300 L200 262 L380 300 L560 258 L760 302 L960 262 L1200 298 L1200 320 L0 320 Z" fill="#274e8c" opacity="0.6" />
            </svg>
          )}
        </div>

        <button type="button" className="uwa-hero-back" onClick={() => { window.location.href = '/?story=1'; }}>
          ← Story Mode
        </button>

        <div className="uwa-hero-inner">
          <span className="uwa-hero-eyebrow">{mode.icon} Question bank</span>
          <h1 className="uwa-hero-title">
            {mode.label.split(' ').map((word, i, all) => (
              <span key={i} className={i === all.length - 1 ? 'uwa-hero-title-accent' : undefined}>
                {word}{i < all.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className="uwa-hero-sub">Choose your subject to begin your journey.</p>

          {/* Where the whole bank stands, so the page opens with the one number
              a returning student actually wants. */}
          {plannedTotal > 0 && (
            <div className="uwa-hero-stats">
              <div className="uwa-hstat-row">
                <span className="uwa-hstat">
                  <b>{plannedSeen.toLocaleString()}</b>
                  <small>Answered</small>
                </span>
                <span className="uwa-hstat-div" aria-hidden="true" />
                <span className="uwa-hstat">
                  <b>{plannedRemaining.toLocaleString()}</b>
                  <small>Remaining</small>
                </span>
                <span className="uwa-hstat-div" aria-hidden="true" />
                <span className="uwa-hstat">
                  <b>{plannedTotal.toLocaleString()}</b>
                  <small>In the bank</small>
                </span>
              </div>

              <div className="uwa-hero-progress">
                <span className="uwa-hero-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, Math.round((plannedSeen / plannedTotal) * 100))}%` }} />
                </span>
                <span className="uwa-hero-pct">
                  {Math.min(100, Math.round((plannedSeen / plannedTotal) * 100))}% of the bank answered
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="uwa-col">
        {/* ── Set your pace ───────────────────────────────────────────────
            The four common paces are one tap; everything else the planner can
            do (finish-by-a-date, the projection, question order) is a click
            further in rather than gone. */}
        <section className="uwa-pace">
          <div className="uwa-pace-lead">
            <span className="uwa-pace-icon" aria-hidden="true">🗓️</span>
            <div>
              <h2>Set Your Pace</h2>
              <p>Choose how many questions you&apos;d like to complete each day.</p>
            </div>
          </div>

          <div className="uwa-pace-right">
            <div className="uwa-pace-picks" role="group" aria-label="Questions per day">
              {PACE_PRESETS.map(n => (
                <button
                  key={n}
                  type="button"
                  className={`uwa-pace-pick${pace === n ? ' is-on' : ''}`}
                  aria-pressed={pace === n}
                  onClick={() => { setPlanBy('pace'); setPickedDate(null); setDeadlineWarning(''); setPace(n); }}
                >
                  {n}
                </button>
              ))}
              {!PACE_PRESETS.includes(pace) && (
                <span className="uwa-pace-pick is-on is-custom" title="Set under Fine-tune your plan">
                  {pace}
                  <small>custom</small>
                </span>
              )}
              <span className="uwa-pace-unit">questions per day</span>
            </div>
            <p className="uwa-pace-note">
              A consistent daily goal helps you build momentum and reach your target.
            </p>
          </div>
        </section>


        <details className="uwa-more">
          <summary>Fine-tune your plan</summary>
        {/* ── Set Your Pace ─────────────────────────────────────────────── */}
        <div className="uwa-card">
          <div className="uwa-card-title">Set Your Pace</div>
          <div className="uwa-card-sub">
            {planBy === 'pace'
              ? 'How many questions do you want to answer per day?'
              : 'When do you want to finish? We work out the daily pace.'}
          </div>

          <div className="uwa-planby" role="tablist" aria-label="Plan by">
            <button
              type="button" role="tab" aria-selected={planBy === 'pace'}
              className={`uwa-planby-btn ${planBy === 'pace' ? 'on' : ''}`}
              onClick={() => { setPlanBy('pace'); setDeadlineWarning(''); setPickedDate(null); }}
            >Questions per day</button>
            <button
              type="button" role="tab" aria-selected={planBy === 'date'}
              className={`uwa-planby-btn ${planBy === 'date' ? 'on' : ''}`}
              onClick={() => { setPlanBy('date'); setDeadlineWarning(''); setPickedDate(null); }}
            >Finish by a date</button>
          </div>

          {planBy === 'pace' ? (
            <div className="uwa-slider-row">
              <input
                className="uwa-slider"
                type="range"
                min={PACE_MIN}
                max={PACE_MAX}
                step={1}
                value={Math.min(pace, PACE_MAX)}
                onChange={e => { setPace(Number(e.target.value)); setDeadlineWarning(''); }}
                aria-label="Questions per day"
              />
              <div className="uwa-pace-chip">
                <span className="uwa-pace-num">{pace}</span>
                <span className="uwa-pace-unit">questions/day</span>
              </div>
            </div>
          ) : (
            <div className="uwa-slider-row">
              <input
                className="uwa-date"
                type="date"
                min={toInputDate(new Date())}
                value={pickedDate || toInputDate(completionDate)}
                disabled={plannedRemaining === 0}
                onChange={e => {
                  const days = daysUntil(e.target.value);
                  if (!days) return;
                  setPickedDate(e.target.value);
                  const needed = Math.ceil(plannedRemaining / days);
                  if (needed > PACE_SAVE_MAX) {
                    setDeadlineWarning(
                      `That would need ${needed} questions a day. The most you can set is ${PACE_SAVE_MAX}/day — pick a later date.`
                    );
                    setPace(PACE_SAVE_MAX);
                  } else {
                    setDeadlineWarning('');
                    // Floor at PACE_MIN: a very distant date solves to 1/day, and
                    // the projection row then honestly shows the earlier finish.
                    setPace(Math.max(PACE_MIN, needed));
                  }
                }}
                aria-label="Target completion date"
              />
              <div className="uwa-pace-chip">
                <span className="uwa-pace-num">{pace}</span>
                <span className="uwa-pace-unit">questions/day</span>
              </div>
            </div>
          )}
          {deadlineWarning && <p className="uwa-warn">{deadlineWarning}</p>}

          <div className="uwa-projection">
            <div>
              <span className="uwa-proj-label">DAYS TO FINISH</span>
              <span className="uwa-proj-val uwa-proj-val--blue">
                {plannedRemaining > 0 ? `${daysToFinish} ${daysToFinish === 1 ? 'day' : 'days'}` : '—'}
              </span>
            </div>
            <div>
              <span className="uwa-proj-label">ESTIMATED COMPLETION</span>
              <span className="uwa-proj-val">
                {plannedRemaining > 0 ? formatDate(completionDate) : 'Complete'}
              </span>
            </div>
          </div>

          {/* Whole-adventure progress. These MUST describe the same journey the
              projection above does — a "days to finish" computed from 3,659
              sitting over a total of 708 would just look broken. "Already
              answered" is your real count across every subject. */}
          {overall && (
            <>
              <div className="uwa-counts">
                <div>
                  <span className="uwa-proj-label">TOTAL QUESTIONS</span>
                  <span className="uwa-count-val">{plannedTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="uwa-proj-label">ALREADY ANSWERED</span>
                  <span className="uwa-count-val">{plannedSeen.toLocaleString()}</span>
                </div>
                <div>
                  <span className="uwa-proj-label">REMAINING</span>
                  <span className="uwa-count-val uwa-count-val--blue">{plannedRemaining.toLocaleString()}</span>
                </div>
              </div>
              <div
                className="uwa-bar"
                role="img"
                aria-label={`${plannedSeen} of ${plannedTotal} questions answered`}
              >
                <div
                  className="uwa-bar-fill"
                  style={{ width: `${plannedTotal ? (plannedSeen / plannedTotal) * 100 : 0}%` }}
                />
              </div>
              {/* Says plainly why the plan is bigger than what is playable today,
                  so the gap reads as "still uploading" rather than a bug. */}
              {mode.targetTotal && overall.total < plannedTotal && (
                <p className="uwa-note">
                  Planning against the full {plannedTotal.toLocaleString()}-question adventure.
                  {' '}{overall.total.toLocaleString()} are in the bank so far — the rest are still being added.
                </p>
              )}

              {/* Today's slice of the daily pace — resets at the player's own
                  midnight (see done_today on question-bank-progress). A block
                  started later today is capped at what's still owed, not a
                  fresh `pace`, so ending a block early and coming back finishes
                  the day rather than restarting it. */}
              <div className="uwa-counts" style={{ marginTop: 20 }}>
                <div>
                  <span className="uwa-proj-label">TODAY'S PROGRESS</span>
                  <span className="uwa-count-val">{Math.min(doneToday, pace)} / {pace}</span>
                </div>
              </div>
              <div
                className="uwa-bar"
                role="img"
                aria-label={`${doneToday} of ${pace} questions answered today`}
              >
                <div
                  className="uwa-bar-fill"
                  style={{ width: `${pace ? Math.min(100, (doneToday / pace) * 100) : 0}%` }}
                />
              </div>
              {goalMetToday && (
                <p className="uwa-note">🎉 Today's goal is complete — starting another block goes beyond it.</p>
              )}
            </>
          )}

          {/* Question order for the block about to start. 'Random' is the
              long-standing default; 'In order' plays the server's own stable
              pagination order, unshuffled. */}
          <div className="uwa-planby" role="tablist" aria-label="Question order" style={{ marginTop: 18 }}>
            <button
              type="button" role="tab" aria-selected={questionOrder === 'random'}
              className={`uwa-planby-btn ${questionOrder === 'random' ? 'on' : ''}`}
              onClick={() => chooseQuestionOrder('random')}
            >🎲 Random</button>
            <button
              type="button" role="tab" aria-selected={questionOrder === 'sequential'}
              className={`uwa-planby-btn ${questionOrder === 'sequential' ? 'on' : ''}`}
              onClick={() => chooseQuestionOrder('sequential')}
            >📖 In Order</button>
          </div>

          {startError && <p className="uwa-error">{startError}</p>}

          <button
            type="button"
            className="uwa-start"
            onClick={startSession}
            disabled={starting || loadingSubject || unseen === 0}
            style={{ marginTop: 22 }}
          >
            {/* The count in brackets is what will REALLY be served, which can be
                short of the pace while the bank is still filling — better a
                small honest number than a promise of 80 that delivers 1. */}
            {starting ? 'Loading…'
              : loadingSubject ? 'Loading…'
              : unseen === 0
                ? (overall && overall.total < plannedTotal
                    ? `No ${activeName || 'subject'} questions left yet`
                    : 'Subject Complete')
              : goalMetToday
                ? `🎉 Keep Going Beyond Today's Goal (${todaysCount})`
              : `Start Today's Questions (${todaysCount})`}
          </button>
        </div>
        </details>

        {/* ── Subjects ──────────────────────────────────────────────────── */}
        <h2 className="uwa-section-title">Subjects</h2>
        {subjectsError && <p className="uwa-empty">Couldn&apos;t load subjects — check your connection.</p>}
        {!subjectsError && subjects.length === 0 && <p className="uwa-empty">Loading subjects…</p>}
        <div className="uwa-subjects">
          {subjects.map(s => {
            const c = subjectCounts[s.id];
            // Done is answered-so-far: the bar reads the same way Journey's
            // does, as "how much of this is behind me".
            const total = c?.total || 0;
            const done  = total ? Math.max(0, total - (c?.unseen ?? total)) : 0;
            const pct   = total ? Math.round((done / total) * 100) : 0;
            return (
              <button
                key={s.id}
                type="button"
                className={`uwa-subject${selected === s.id ? ' uwa-subject--active' : ''}${pct === 100 && total ? ' uwa-subject--done' : ''}`}
                // Picking a subject changes only what TODAY draws from. The plan
                // spans the whole adventure, so the pace and any chosen deadline
                // deliberately survive the switch. Selecting also opens the
                // system's own menu: today's set, a full redo and the rating
                // piles are one decision about this system.
                onClick={() => { setSelected(s.id); setSystemModal(s.id); setReviewError(''); }}
                aria-pressed={selected === s.id}
                // The subject's own colour, fed to CSS once and used for the
                // rail, icon badge, bar and glow alike — as Journey does.
                style={subjectArt(s)}
              >
                <span className="uwa-subject-icon" aria-hidden="true">
                  {s.image_url
                    ? <img src={s.image_url} alt="" loading="lazy" />
                    : (s.icon || s.name[0])}
                </span>
                <span className="uwa-subject-name">{s.name}</span>
                <span className="uwa-subject-desc">{subjectBlurb(s.name)}</span>
                {c && (
                  <span className="uwa-subject-progress">
                    <span className="uwa-subject-bar" aria-hidden="true">
                      <span className="uwa-subject-bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="uwa-subject-prog-text">
                      {c.unseen === 0
                        ? '✓ Complete'
                        : `${done.toLocaleString()} / ${total.toLocaleString()} questions`}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
          {devSubjects.map(s => (
            <button
              key={s.id}
              type="button"
              className="uwa-subject uwa-subject--dev"
              disabled
              title={`${s.name} is under development`}
              style={subjectArt(s)}
            >
              <span className="uwa-subject-icon" aria-hidden="true">{s.icon || s.name[0]}</span>
              <span className="uwa-subject-name">{s.name}</span>
              <span className="uwa-subject-meta uwa-subject-meta--dev">🔒 Under development</span>
            </button>
          ))}
        </div>

        <p className="uwa-intro" style={{ marginTop: 10 }}>
          Pick a system to choose what to play — today&apos;s set, a full redo, or a
          group you&apos;ve already rated.
        </p>
      </div>

      {/* ── One system's options ─────────────────────────────────────────────
          Everything you can do with a system on one surface: today's set, a
          full redo, and the rating piles. Only the daily set advances the
          {plannedTotal}-question total and today's pace — every review route
          runs through SoloGame's uwaReview, which skips seen-tracking, so it
          can be replayed as often as it is useful. */}
      {/* PORTALLED TO <body>. position:fixed is resolved against the nearest
          ancestor with a transform/filter/backdrop-filter, not the viewport —
          this page has several — so rendered in place the dialog anchored to a
          tall ancestor and appeared far down the page instead of centred on
          screen. In <body> it is outside every such containing block. */}
      {systemModal && createPortal(
        <div
          className="uwa-modal-overlay"
          onClick={() => setSystemModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeName || 'System'} options`}
        >
          <div className="uwa-modal" onClick={e => e.stopPropagation()}>
            <div className="uwa-modal-head">
              <h3 className="uwa-modal-title">{activeName || 'System'}</h3>
              <button
                type="button"
                className="uwa-modal-close"
                onClick={() => setSystemModal(null)}
                aria-label="Close"
              >✕</button>
            </div>

            {reviewError && <p className="uwa-error">{reviewError}</p>}
            {startError && <p className="uwa-error">{startError}</p>}

            {/* Today's set — the only route that counts toward the plan, so it
                leads and is visually separated from the review routes. */}
            <button
              type="button"
              className="uwa-pile uwa-pile--today"
              onClick={() => { setSystemModal(null); startSession(); }}
              disabled={starting || loadingSubject || unseen === 0}
            >
              <span className="uwa-pile-name">▶ Today&apos;s Questions</span>
              <span className="uwa-pile-sub">
                {starting || loadingSubject ? 'Loading…'
                  : unseen === 0 ? 'System complete'
                  : `${todaysCount} question${todaysCount === 1 ? '' : 's'} · counts toward your plan`}
              </span>
            </button>

            <p className="uwa-modal-sub">
              Or revisit — none of these count toward the plan or today&apos;s pace:
            </p>

            {/* Empty rating piles have two very different causes — nothing rated
                yet, or ratings not being stored at all. Saying which is the
                whole point: the second one looks exactly like the first. */}
            {ratingCounts?.ratings_unavailable && (
              <p className="uwa-modal-warn" role="alert">
                ⚠ Ratings are not being saved — the <code>uworld_question_ratings</code> table
                is missing from the database, so the rating piles below stay empty.
                Redo Whole System and Study All still work.
              </p>
            )}

            <div className="uwa-pile-list">
              {/* Redo replays the ENTIRE system, seen or not, rather than
                  revisiting only what has already been answered. */}
              {(() => {
                const systemCount = ratingCounts?.system_total ?? 0;
                const loadingThis = reviewLoading === 'system';
                return (
                  <button
                    type="button"
                    className={`uwa-pile uwa-pile--redo${systemCount === 0 ? ' is-disabled' : ''}`}
                    disabled={!ratingCounts || systemCount === 0 || !!reviewLoading}
                    onClick={() => startReview('system', `Redo — ${activeName || 'System'}`)}
                  >
                    <span className="uwa-pile-name">🔄 Redo Whole System</span>
                    <span className="uwa-pile-sub">
                      {loadingThis ? 'Loading…' : `${systemCount} question${systemCount === 1 ? '' : 's'} · seen or not`}
                    </span>
                  </button>
                );
              })()}
              {UWORLD_RATING_PILES.map(p => {
                const count = ratingCounts ? (ratingCounts[p.key === 'all' ? 'total' : p.key] ?? 0) : 0;
                // An empty pile is not a choice — it is a dead row that reads as
                // broken. 'Not Yet Rated' is the usual one: the exam skin makes
                // you rate a question before it moves on, so it only fills when
                // a block is abandoned mid-question. Study All stays whatever
                // its count, since it is the entry point to reviewing at all.
                if (ratingCounts && count === 0 && p.key !== 'all') return null;
                const loadingThis = reviewLoading === p.key;
                const disabled = !ratingCounts || count === 0 || !!reviewLoading;
                return (
                  <button
                    key={p.key}
                    type="button"
                    className={`uwa-pile${count === 0 ? ' is-disabled' : ''}`}
                    disabled={disabled}
                    onClick={() => startReview(p.key, p.label)}
                  >
                    <span className="uwa-pile-name">{p.icon} {p.label}</span>
                    <span className="uwa-pile-sub">
                      {loadingThis ? 'Loading…'
                        : !ratingCounts ? 'Loading…'
                        : `${count} question${count === 1 ? '' : 's'}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
