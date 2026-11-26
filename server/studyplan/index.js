'use strict';

/**
 * Week Planner — a player's study goals for one week ("40 UWorld Adventure
 * questions, 80 Buzz Fun questions, 3 h of ECG Reader") and how far along
 * they are.
 *
 * Progress is never self-reported: it is read from activity_sessions, the
 * same rows Daily Activity shows, so a goal moves when the work is done in
 * the app. The plan itself lives in study_plans (study-plans-migration.sql,
 * a manual Supabase run). Until that table exists the client keeps the plan
 * in the browser and this endpoint still answers with the progress.
 *
 * Plan shape (validated by cleanPlan):
 *   goals: [{ id, mode, unit: 'questions'|'minutes', target, days: [0..6] }]
 *          mode is an activity_sessions.game_mode, or '_all' for any mode;
 *          days are Mon = 0 … Sun = 6, the days the goal is worked on.
 *   tasks: [{ id, day, text, done }]  free-form to-dos for a day
 *   hours: [7 × hours available, or null]
 */

const DAY_MS = 86400000;
const PACE_DAYS = 28;

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
  && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

const clampInt = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
};

function cleanPlan(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const goals = (Array.isArray(p.goals) ? p.goals : []).slice(0, 30).map(g => {
    const mode = String(g?.mode || '');
    const target = clampInt(g?.target, 1, 5000);
    if (!/^[a-z0-9_]{1,60}$/.test(mode) || !target) return null;
    const days = [...new Set((Array.isArray(g.days) ? g.days : []).map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    return {
      id: String(g.id || '').slice(0, 40) || Math.random().toString(36).slice(2, 10),
      mode, unit: g.unit === 'minutes' ? 'minutes' : 'questions', target,
      days: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
    };
  }).filter(Boolean);
  const tasks = (Array.isArray(p.tasks) ? p.tasks : []).slice(0, 100).map(t => {
    const text = String(t?.text || '').trim().slice(0, 140);
    const day = Number(t?.day);
    if (!text || !Number.isInteger(day) || day < 0 || day > 6) return null;
    return { id: String(t.id || '').slice(0, 40) || Math.random().toString(36).slice(2, 10), day, text, done: !!t.done };
  }).filter(Boolean);
  const hours = Array.from({ length: 7 }, (_, i) => {
    const h = Array.isArray(p.hours) ? Number(p.hours[i]) : NaN;
    return Number.isFinite(h) && h >= 0 && h <= 24 ? Math.round(h * 4) / 4 : null;
  });
  return { goals, tasks, hours };
}

/** Reads activity_sessions, dropping questions_answered if that column is not there. */
async function readSessions(supabase, userId, fromIso, toIso, { limit = 1000, desc = false } = {}) {
  const q = (cols) => supabase.from('activity_sessions').select(cols)
    .eq('user_id', userId).gte('ended_at', fromIso).lt('ended_at', toIso)
    .order('ended_at', { ascending: !desc }).limit(limit);
  let { data, error } = await q('game_mode, duration_seconds, questions_answered, ended_at');
  if (error && /questions_answered/i.test(`${error.message} ${error.details || ''}`)) {
    ({ data, error } = await q('game_mode, duration_seconds, ended_at'));
  }
  if (error) throw error;
  return data || [];
}

function mount(app, { supabase, requireAuth, rateLimit, isMissingTable }) {
  app.get('/api/study-plan', requireAuth, rateLimit(60, 60000), async (req, res) => {
    const week = String(req.query.week || '');
    if (!isDate(week)) return res.status(400).json({ error: 'week must be YYYY-MM-DD (a Monday).' });
    // getTimezoneOffset(): minutes to ADD to local time to reach UTC.
    const tz = clampInt(req.query.tz, -840, 840) ?? 0;
    const start = Date.parse(`${week}T00:00:00Z`) + tz * 60000;
    const out = { week, plan: null, stored: false, lastPlan: null, progress: {}, pace: {} };
    if (!supabase) return res.json(out);

    try {
      const rows = await readSessions(supabase, req.userId, new Date(start).toISOString(), new Date(start + 7 * DAY_MS).toISOString());
      for (const r of rows) {
        const day = Math.floor((Date.parse(r.ended_at) - start) / DAY_MS);
        if (day < 0 || day > 6) continue;
        for (const mode of [r.game_mode, '_all']) {
          const m = out.progress[mode] || (out.progress[mode] = { questions: 0, seconds: 0, days: Array.from({ length: 7 }, () => ({ q: 0, s: 0 })) });
          const qn = Number(r.questions_answered) || 0;
          const s = Number(r.duration_seconds) || 0;
          m.questions += qn; m.seconds += s;
          m.days[day].q += qn; m.days[day].s += s;
        }
      }
    } catch (err) {
      console.warn('[study-plan] progress read failed —', err.message);
    }

    // The player's own pace: seconds per question per mode over recent weeks.
    try {
      const now = Date.now();
      const rows = await readSessions(supabase, req.userId, new Date(now - PACE_DAYS * DAY_MS).toISOString(), new Date(now + DAY_MS).toISOString(), { desc: true });
      const sums = {};
      for (const r of rows) {
        const qn = Number(r.questions_answered) || 0;
        const s = Number(r.duration_seconds) || 0;
        if (qn <= 0 || s <= 0) continue;
        const m = sums[r.game_mode] || (sums[r.game_mode] = { q: 0, s: 0 });
        m.q += qn; m.s += s;
      }
      for (const [mode, m] of Object.entries(sums)) {
        // Too few questions makes for a noisy average; the client has defaults.
        if (m.q >= 15) out.pace[mode] = { secPerQ: Math.round(m.s / m.q), questions: m.q };
      }
    } catch (err) {
      console.warn('[study-plan] pace read failed —', err.message);
    }

    try {
      const { data, error } = await supabase.from('study_plans').select('week_start, plan')
        .eq('user_id', req.userId).lte('week_start', week)
        .order('week_start', { ascending: false }).limit(2);
      if (error) {
        if (isMissingTable(error, 'study_plans')) out.missingTable = true;
        else console.warn('[study-plan] plan read failed —', error.message);
      } else {
        const mine = (data || []).find(r => r.week_start === week);
        if (mine) { out.plan = cleanPlan(mine.plan); out.stored = true; }
        const prev = (data || []).find(r => r.week_start !== week);
        if (prev) out.lastPlan = { week: prev.week_start, plan: cleanPlan(prev.plan) };
      }
    } catch (err) {
      console.warn('[study-plan] plan read threw —', err.message);
    }
    res.json(out);
  });

  app.put('/api/study-plan', requireAuth, rateLimit(60, 60000), async (req, res) => {
    const week = String(req.body?.week || '');
    if (!isDate(week)) return res.status(400).json({ error: 'week must be YYYY-MM-DD.' });
    if (!supabase) return res.json({ ok: false });
    const plan = cleanPlan(req.body?.plan);
    try {
      const { error } = await supabase.from('study_plans').upsert(
        { user_id: req.userId, week_start: week, plan, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,week_start' });
      if (error) {
        if (isMissingTable(error, 'study_plans')) return res.json({ ok: false, missingTable: true });
        console.error('[study-plan] save failed —', error.message);
        return res.json({ ok: false });
      }
      res.json({ ok: true, plan });
    } catch (err) {
      console.error('[study-plan] save threw —', err.message);
      res.json({ ok: false });
    }
  });
}

module.exports = { mount, cleanPlan };
