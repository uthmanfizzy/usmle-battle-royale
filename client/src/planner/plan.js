import { useCallback, useEffect, useRef, useState } from 'react';
import { authFetch, getCachedUser, getToken } from '../auth';

/**
 * Week Planner logic, shared by the /planner page and the home page's
 * "Today's goals" panel.
 *
 * A goal is "N questions (or minutes) of <mode> this week, on these days".
 * Progress comes from the server (activity_sessions, the same rows Daily
 * Activity shows), so nothing here is self-reported except free-form tasks.
 */

// mode = activity_sessions.game_mode. secPerQ = a starting estimate of study
// time per question; the player's own recent pace replaces it once the server
// has 15+ questions of history for that mode. time = minutes-only minigames.
const Q = (mode, label, icon, secPerQ, group) => ({ mode, label, icon, secPerQ, unit: 'questions', group });
const T = (mode, label, icon) => ({ mode, label, icon, unit: 'minutes', timeOnly: true, group: 'Minigames' });

export const PLANNER_MODES = [
  { mode: '_all', label: 'Any mode', icon: '📚', secPerQ: 60, unit: 'minutes', group: 'Overall' },
  Q('question_bank_practice', 'UWorld Adventure', '📚', 90, 'Question banks'),
  Q('amboss_qbank', 'Amboss Qbank', '🗂️', 120, 'Question banks'),
  Q('amboss_200_concepts_practice', 'Amboss 200 Concepts', '🧭', 120, 'Question banks'),
  Q('mehlman_rapid_fire_practice', 'Mehlman Rapid Fire', '⚡', 30, 'Question banks'),
  Q('saudi_mle_practice', 'Saudi MLE', '📗', 90, 'Question banks'),
  Q('ore_lds_practice', 'ORE / LDS', '🦷', 90, 'Question banks'),
  Q('clinical_practice', 'Clinical', '🩺', 90, 'Question banks'),
  Q('oet_practice', 'OET', '🇬🇧', 90, 'Question banks'),
  Q('journey', 'First Aid Journey', '🚑', 60, 'First Aid'),
  Q('fa_hy_qs', 'FA HY Qs', '🎯', 90, 'First Aid'),
  Q('inner_circle', 'Inner Circle', '⭕', 90, 'Question banks'),
  Q('fa_images', 'FA Images', '🖼️', 35, 'First Aid'),
  Q('fa_trivia', 'FA Trivia', '🎪', 25, 'First Aid'),
  Q('hy_arrows', 'HY Arrows', '↕️', 60, 'First Aid'),
  Q('buzz_fun', 'Buzz Fun', '🔔', 25, 'Online'),
  Q('battle_royale', 'Battle Royale', '⚔️', 30, 'Online'),
  Q('speed_race', 'Speed Race', '⚡', 20, 'Online'),
  Q('trivia_pursuit', 'Trivia Pursuit', '🎯', 30, 'Online'),
  Q('medathon', 'Medathon', '🏁', 60, 'Online'),
  Q('medjinx', 'MedJinx', '🧪', 45, 'Online'),
  Q('pvp_duel', 'PvP Duel', '🤺', 20, 'Online'),
  Q('scan_master', 'Scan Master', '🔬', 30, 'Online'),
  Q('solo', 'Solo Practice', '🧠', 60, 'Practice'),
  Q('training_grounds', 'Training Grounds', '🎯', 60, 'Practice'),
  Q('tower', 'Tower', '🏰', 75, 'Practice'),
  Q('anking', 'AnKing Flashcards', '🃏', 15, 'Practice'),
  Q('hy_flashcards', 'HY Flashcards', '⭐', 15, 'Practice'),
  Q('amboss_hy_ethics', 'Amboss HY Ethics', '⚖️', 60, 'Practice'),
  Q('kaplan_hy_ethics', 'Kaplan HY Ethics', '🎓', 60, 'Practice'),
  T('ecg_reader', 'ECG Reader', '💓'), T('abg_reader', 'ABG Reader', '🧪'),
  T('muscle_mapper', 'Muscle Mapper', '💪'), T('biostats_lab', 'Biostats Lab', '📊'),
  T('spot_the_diagnosis', 'Spot the Diagnosis', '🗣️'), T('genetics_roulette', 'Genetics Roulette', '🧬'),
  T('drug_match', 'Drug Mechanism Match', '💊'), T('lab_range', 'Lab Range', '🧫'),
  T('murmurs', 'Murmurs', '🩺'), T('pv_loops', 'PV Loop Lab', '🫀'),
  T('clot_cascade', 'Clot Cascade', '🩸'), T('vitamin_vault', 'Vitamin Vault', '🍊'),
  T('pathway_navigator', 'Pathway Navigator', '🧭'), T('onco_atlas', 'Onco Atlas', '🎗️'),
  T('hy_diseases', 'HY Diseases', '🩺'),
];
const BY_MODE = Object.fromEntries(PLANNER_MODES.map(m => [m.mode, m]));
export const modeInfo = (mode) => BY_MODE[mode] || { mode, label: mode.replace(/_/g, ' '), icon: '🎮', secPerQ: 60, unit: 'questions' };

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const EMPTY_PLAN = { goals: [], tasks: [], hours: [null, null, null, null, null, null, null] };

const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Mon = 0 … Sun = 6 */
export const dayIndex = (d = new Date()) => (d.getDay() + 6) % 7;
/** The local Monday of the week containing `d`, as YYYY-MM-DD. */
export function weekOf(d = new Date()) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayIndex(d));
  return ymd(m);
}
export function addWeeks(week, n) {
  const [y, mo, da] = week.split('-').map(Number);
  return ymd(new Date(y, mo - 1, da + n * 7));
}
export function weekDates(week) {
  const [y, mo, da] = week.split('-').map(Number);
  return ALL_DAYS.map(i => new Date(y, mo - 1, da + i));
}
/** Which day of `week` today is: 0–6, -1 if the week is over, 7 if it has not begun. */
export function todayIn(week) {
  const now = weekOf();
  if (week === now) return dayIndex();
  return week < now ? -1 : 7;
}

export const newId = () => Math.random().toString(36).slice(2, 10);

export function fmtMinutes(min) {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/** Seconds per question for a mode: the player's own pace if known, else the default. */
export function secPerQ(mode, pace) {
  if (mode === '_all') {
    const all = Object.values(pace || {});
    const q = all.reduce((n, p) => n + p.questions, 0);
    return q ? Math.round(all.reduce((n, p) => n + p.secPerQ * p.questions, 0) / q) : 60;
  }
  return pace?.[mode]?.secPerQ || modeInfo(mode).secPerQ || 60;
}

/**
 * How much of a goal's mode was done on each day of the week, counting only
 * the goal's own days and only sessions that ended after the goal started
 * (goal.since). `data` = { week, progress, sessions } from the server; an
 * older server without `sessions` falls back to the per-day totals.
 */
function goalDays(goal, data) {
  const isQ = goal.unit === 'questions';
  const days = goal.days?.length ? goal.days : ALL_DAYS;
  const out = Array(7).fill(0);
  const since = goal.since ? Date.parse(goal.since) : 0;
  if (Array.isArray(data?.sessions)) {
    const bounds = weekDates(data.week).map(d => d.getTime());
    bounds.push(weekDates(addWeeks(data.week, 1))[0].getTime());
    for (const x of data.sessions) {
      if (goal.mode !== '_all' && x.m !== goal.mode) continue;
      if (x.t < since) continue;
      let d = -1;
      for (let i = 0; i < 7; i++) if (x.t >= bounds[i] && x.t < bounds[i + 1]) { d = i; break; }
      if (d < 0 || !days.includes(d)) continue;
      out[d] += isQ ? x.q : x.s / 60;
    }
    return out;
  }
  const p = data?.progress?.[goal.mode];
  if (p) days.forEach(d => { out[d] = isQ ? p.days[d].q : p.days[d].s / 60; });
  return out;
}

/** The day of `week` a goal began counting on: 0 if it began before the week (or has no start), 7 if after. */
function sinceDay(goal, week) {
  if (!goal.since) return 0;
  const t = Date.parse(goal.since);
  const dates = weekDates(week);
  if (t < dates[0].getTime()) return 0;
  for (let i = 6; i >= 0; i--) if (t >= dates[i].getTime()) return i;
  return 7;
}

/**
 * Everything the planner shows about one goal this week.
 * data: { week, progress, sessions } from the server.
 * today: 0–6 inside the week, -1 if the week is over, 7 if it is still ahead.
 *
 * period 'week': the target is for the whole week, spread over the goal's days
 * (what's left is rebalanced over the days still to come).
 * period 'day': the target is for EACH of the goal's days.
 * Either way only the goal's own days count, and only from when it was added.
 */
export function goalStatus(goal, data, pace, today) {
  const isQ = goal.unit === 'questions';
  const per = isQ ? secPerQ(goal.mode, pace) : 60; // seconds per unit
  const amt = goalDays(goal, data);
  const start = data?.week ? sinceDay(goal, data.week) : 0;
  // The goal's days that fall on or after the day it was added.
  const days = (goal.days?.length ? goal.days : ALL_DAYS).filter(d => d >= start);
  const t = Math.min(Math.max(today, -1), 7);
  const todayDone = t >= 0 && t <= 6 ? amt[t] : 0;
  const scheduledToday = t >= 0 && t <= 6 && days.includes(t);
  const daysLeft = t === 7 ? days.length : t < 0 ? 0 : days.filter(d => d >= t).length;
  const load = Array(7).fill(0); // minutes still to do, per day
  const from = t === 7 ? 0 : t;

  if (goal.period === 'day') {
    const target = goal.target;
    const past = days.filter(d => d < t && t !== 7);
    const missed = past.filter(d => amt[d] < target).length;
    const met = days.filter(d => (d < t || d === t) && amt[d] >= target).length;
    if (t >= 0) days.filter(d => d >= from).forEach(d => { load[d] = Math.max(0, target - (d === t ? todayDone : 0)) * per / 60; });
    let status;
    if (t === 7) status = 'upcoming';
    else if (t === -1) status = days.length && missed === 0 ? 'done' : 'missed';
    else if (scheduledToday && todayDone >= target) status = 'done-today';
    else if (!scheduledToday) status = missed ? 'behind' : 'rest';
    else status = missed ? 'behind' : 'on-track';
    const left = scheduledToday ? Math.max(0, target - todayDone) : 0;
    return {
      period: 'day', isQ, per,
      done: Math.round(scheduledToday ? todayDone : 0), target, left: Math.round(left),
      pct: scheduledToday ? Math.min(100, (todayDone / target) * 100) : 0,
      todayTarget: scheduledToday ? target : 0, todayDone: Math.round(todayDone), scheduledToday,
      daysMet: met, daysTotal: days.length, daysLeft, perDayNeed: target,
      estTotalMin: (target * days.length * per) / 60,
      estLeftMin: load.reduce((a, b) => a + b, 0),
      status, load,
    };
  }

  const done = amt.reduce((a, b) => a + b, 0);
  const before = amt.reduce((n, v, d) => (d < t ? n + v : n), 0);
  const left = Math.max(0, goal.target - done);
  const todayTarget = scheduledToday ? Math.ceil(Math.max(0, goal.target - before) / Math.max(1, daysLeft)) : 0;
  const expected = days.length ? goal.target * (days.filter(d => d < t).length / days.length) : goal.target;

  let status;
  if (done >= goal.target) status = 'done';
  else if (t === 7) status = 'upcoming';
  else if (daysLeft === 0) status = 'missed';
  else if (done + 0.001 >= expected) status = 'on-track';
  else status = 'behind';

  if (t >= 0 && daysLeft > 0) {
    const share = Math.max(0, goal.target - before) / daysLeft;
    days.filter(d => d >= from).forEach(d => {
      const owe = d === t ? Math.max(0, share - todayDone) : share;
      load[d] = (owe * per) / 60;
    });
  }
  return {
    period: 'week', isQ, per, done: Math.round(done), target: goal.target, left: Math.round(left),
    pct: Math.min(100, (done / goal.target) * 100),
    todayTarget, todayDone: Math.round(todayDone), scheduledToday,
    perDayNeed: daysLeft ? Math.ceil(left / daysLeft) : left, daysLeft,
    estTotalMin: (goal.target * per) / 60, estLeftMin: (left * per) / 60,
    status, load,
  };
}

export const STATUS_LABEL = {
  done: 'Done', 'done-today': 'Done today', 'on-track': 'On track', behind: 'Behind', missed: 'Missed', upcoming: 'Not started', rest: 'Rest day',
};

// ── Loading and saving ────────────────────────────────────────────────────
const localKey = (week) => `mv_study_plan_${getCachedUser()?.id || 'me'}_${week}`;
function readLocal(week) {
  try { const s = localStorage.getItem(localKey(week)); return s ? JSON.parse(s) : null; } catch { return null; }
}
function writeLocal(week, plan) {
  try { localStorage.setItem(localKey(week), JSON.stringify(plan)); } catch { /* not remembered */ }
}

/**
 * The plan and progress for one week. `save` updates at once and writes to
 * the server shortly after (and to this browser, which is the only copy if
 * the study_plans table has not been created yet).
 */
// The last server reply per week, kept in memory and in this browser, so the
// planner and the home panel draw at once from it while a fresh copy loads.
const memCache = new Map();
const snapKey = (week) => `mv_study_plan_snap_${getCachedUser()?.id || 'me'}_${week}`;
function readSnap(week) {
  const k = snapKey(week);
  if (memCache.has(k)) return memCache.get(k);
  try { const s = localStorage.getItem(k); const v = s ? JSON.parse(s) : null; if (v) memCache.set(k, v); return v; } catch { return null; }
}
function writeSnap(week, snap) {
  const k = snapKey(week);
  memCache.set(k, snap);
  try { localStorage.setItem(k, JSON.stringify(snap)); } catch { /* memory only */ }
}
function initialState(week) {
  const base = { loading: true, plan: null, progress: {}, pace: {}, sessions: null, lastPlan: null, localOnly: false, error: '' };
  if (!getToken()) return { ...base, loading: false, error: 'signin' };
  const snap = readSnap(week);
  if (snap) return { ...base, ...snap, plan: readLocal(week) || snap.plan, loading: false };
  const local = readLocal(week);
  return local ? { ...base, plan: local, loading: false } : base;
}

export function useWeekPlan(week) {
  const [state, setState] = useState(() => initialState(week));
  const timer = useRef(0);
  const pending = useRef(null);

  const load = useCallback(async () => {
    if (!getToken()) { setState(s => ({ ...s, loading: false, error: 'signin' })); return; }
    try {
      const r = await authFetch(`/api/study-plan?week=${week}&tz=${new Date().getTimezoneOffset()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const local = readLocal(week);
      const snap = {
        plan: d.plan || local || null,
        progress: d.progress || {}, pace: d.pace || {},
        sessions: Array.isArray(d.sessions) ? d.sessions : null,
        lastPlan: d.lastPlan || null,
        localOnly: !!d.missingTable,
      };
      writeSnap(week, snap);
      // An edit made while this was loading wins over the server's copy.
      setState(s => ({ ...snap, plan: pending.current || snap.plan, loading: false, error: '' }));
    } catch {
      setState(s => ({ ...s, loading: false, plan: s.plan || readLocal(week), error: 'offline' }));
    }
  }, [week]);

  const first = useRef(true);
  useEffect(() => {
    // The first render already shows the cached copy; a week change swaps to that week's.
    if (!first.current) setState(initialState(week));
    first.current = false;
    load();
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const plan = pending.current;
    if (!plan) return;
    pending.current = null;
    try {
      const r = await authFetch('/api/study-plan', { method: 'PUT', body: JSON.stringify({ week, plan }) });
      const d = await r.json();
      if (d.missingTable) setState(s => ({ ...s, localOnly: true }));
    } catch { /* kept in this browser */ }
  }, [week]);

  useEffect(() => () => { flush(); }, [flush]);

  const save = useCallback((plan) => {
    writeLocal(week, plan);
    setState(s => ({ ...s, plan }));
    pending.current = plan;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  }, [week, flush]);

  return { ...state, week, save, reload: load };
}

/**
 * Today's goals and tasks, for the home page panel: each goal scheduled today
 * with today's share, then today's free-form tasks.
 */
export function useTodayGoals() {
  const week = weekOf();
  const wp = useWeekPlan(week);
  const today = dayIndex();
  const plan = wp.plan || EMPTY_PLAN;
  const items = [];
  for (const g of plan.goals) {
    const st = goalStatus(g, wp, wp.pace, today);
    if (!st.scheduledToday || st.todayTarget <= 0) continue;
    const info = modeInfo(g.mode);
    items.push({
      key: g.id, kind: 'goal', icon: info.icon, label: info.label,
      done: Math.min(st.todayDone, st.todayTarget), target: st.todayTarget,
      unit: g.unit === 'questions' ? 'Qs' : 'min',
      complete: st.todayDone >= st.todayTarget,
      estMin: Math.max(0, st.todayTarget - st.todayDone) * st.per / 60,
    });
  }
  for (const t of plan.tasks.filter(x => x.day === today)) {
    items.push({ key: t.id, kind: 'task', icon: '📝', label: t.text, complete: t.done });
  }
  const toggleTask = (id) => wp.save({ ...plan, tasks: plan.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)) });
  const leftMin = items.reduce((n, i) => n + (i.estMin || 0), 0);
  return { loading: wp.loading, signedOut: wp.error === 'signin', hasPlan: plan.goals.length + plan.tasks.length > 0, items, leftMin, toggleTask };
}
