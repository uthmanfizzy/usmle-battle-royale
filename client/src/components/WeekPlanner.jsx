import { useMemo, useState } from 'react';
import {
  PLANNER_MODES, DAYS, ALL_DAYS, EMPTY_PLAN, STATUS_LABEL,
  modeInfo, weekOf, addWeeks, weekDates, todayIn, newId, fmtMinutes, goalStatus, secPerQ, useWeekPlan,
} from '../planner/plan';
import './WeekPlanner.css';

/**
 * Week Planner (/planner) — set this week's study goals, see whether you are
 * on pace to hit them and roughly how long they will take.
 *
 * Goals are measured against what was actually played (activity_sessions),
 * so a goal moves on its own as sessions finish. Each goal is spread across
 * the days it is scheduled on; whatever is left is rebalanced over the days
 * still to come, and each day's load is checked against the hours you say
 * you have that day.
 */

const GROUPS = [...new Set(PLANNER_MODES.map(m => m.group))];
const fmtDay = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function DayChips({ days, onChange }) {
  return (
    <div className="wp-daychips" role="group" aria-label="Days">
      {DAYS.map((d, i) => {
        const on = days.includes(i);
        return (
          <button key={d} type="button" className={`wp-daychip${on ? ' is-on' : ''}`} aria-pressed={on}
            onClick={() => {
              const next = on ? days.filter(x => x !== i) : [...days, i].sort();
              if (next.length) onChange(next);
            }}>{d[0]}<span className="wp-sr">{d.slice(1)}</span></button>
        );
      })}
    </div>
  );
}

function AddGoal({ onAdd }) {
  const [mode, setMode] = useState('question_bank_practice');
  const info = modeInfo(mode);
  const [unit, setUnit] = useState('questions');
  const [target, setTarget] = useState('40');
  const [days, setDays] = useState(ALL_DAYS);
  const u = info.timeOnly ? 'minutes' : unit;
  const canQuestions = !info.timeOnly;
  const submit = (e) => {
    e.preventDefault();
    const n = Math.round(Number(target));
    if (!n || n < 1 || n > 5000) return;
    onAdd({ id: newId(), mode, unit: u, target: n, days });
  };
  return (
    <form className="wp-add" onSubmit={submit}>
      <label className="wp-field wp-field--mode">
        <span>Mode</span>
        <select value={mode} onChange={e => {
          const m = e.target.value; setMode(m);
          const mi = modeInfo(m);
          if (mi.timeOnly || m === '_all') { setUnit('minutes'); setTarget('120'); } else { setUnit('questions'); setTarget('40'); }
        }}>
          {GROUPS.map(g => (
            <optgroup key={g} label={g}>
              {PLANNER_MODES.filter(m => m.group === g).map(m => <option key={m.mode} value={m.mode}>{m.icon} {m.label}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="wp-field wp-field--num">
        <span>Target</span>
        <input type="number" min="1" max="5000" inputMode="numeric" value={target} onChange={e => setTarget(e.target.value)} />
      </label>
      <label className="wp-field wp-field--unit">
        <span>Unit</span>
        <select value={u} onChange={e => setUnit(e.target.value)} disabled={!canQuestions}>
          {canQuestions && <option value="questions">questions</option>}
          <option value="minutes">minutes</option>
        </select>
      </label>
      <div className="wp-field wp-field--days">
        <span>Days</span>
        <DayChips days={days} onChange={setDays} />
      </div>
      <button type="submit" className="wp-btn wp-btn--gold">Add goal</button>
    </form>
  );
}

function GoalCard({ goal, st, onChange, onRemove, pace }) {
  const info = modeInfo(goal.mode);
  const unitWord = goal.unit === 'questions' ? 'Qs' : 'min';
  const [editing, setEditing] = useState(false);
  const own = goal.unit === 'questions' && goal.mode !== '_all' && pace?.[goal.mode];
  return (
    <li className={`wp-goal wp-goal--${st.status}`}>
      <div className="wp-goal-top">
        <span className="wp-goal-icon" aria-hidden="true">{info.icon}</span>
        <div className="wp-goal-name">
          <b>{info.label}</b>
          <small>
            {goal.days.length === 7 ? 'Every day' : goal.days.map(d => DAYS[d]).join(' · ')}
            {goal.unit === 'questions' && <> · ~{Math.round(st.per)} s per question{own ? ' (your pace)' : ''}</>}
          </small>
        </div>
        <span className={`wp-pill wp-pill--${st.status}`}>{STATUS_LABEL[st.status]}</span>
      </div>

      <div className="wp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={st.done}
        aria-label={`${info.label} progress`}>
        <i style={{ width: `${st.pct}%` }} />
      </div>

      <div className="wp-goal-nums">
        <span><b>{st.done.toLocaleString()}</b> / {goal.target.toLocaleString()} {unitWord}</span>
        <span>≈ {fmtMinutes(st.estTotalMin)} total{st.left > 0 ? ` · ${fmtMinutes(st.estLeftMin)} left` : ''}</span>
      </div>

      {st.status !== 'done' && st.daysLeft > 0 && st.status !== 'upcoming' && (
        <p className="wp-goal-need">
          {st.scheduledToday && st.todayDone >= st.todayTarget
            ? <>✓ Today's share done ({st.todayDone}/{st.todayTarget} {unitWord})</>
            : st.scheduledToday
            ? <>Today: <b>{st.todayTarget - st.todayDone}</b> more {unitWord} ({st.todayDone}/{st.todayTarget} done)</>
            : <>Next: ~<b>{st.perDayNeed}</b> {unitWord} a day over {st.daysLeft} day{st.daysLeft === 1 ? '' : 's'}</>}
        </p>
      )}
      {st.status === 'upcoming' && (
        <p className="wp-goal-need">~<b>{Math.ceil(goal.target / goal.days.length)}</b> {unitWord} on each of {goal.days.length} day{goal.days.length === 1 ? '' : 's'}</p>
      )}

      <div className="wp-goal-actions">
        <button type="button" className="wp-link" onClick={() => setEditing(e => !e)}>{editing ? 'Done' : 'Edit'}</button>
        <button type="button" className="wp-link wp-link--danger" onClick={onRemove}>Remove</button>
      </div>
      {editing && (
        <div className="wp-goal-edit">
          <label className="wp-field wp-field--num">
            <span>Target ({goal.unit})</span>
            <input type="number" min="1" max="5000" value={goal.target}
              onChange={e => { const n = Math.round(Number(e.target.value)); if (n >= 1 && n <= 5000) onChange({ ...goal, target: n }); }} />
          </label>
          <div className="wp-field">
            <span>Days</span>
            <DayChips days={goal.days} onChange={days => onChange({ ...goal, days })} />
          </div>
        </div>
      )}
    </li>
  );
}

export default function WeekPlanner() {
  const [week, setWeek] = useState(weekOf());
  const { loading, plan: saved, progress, pace, lastPlan, localOnly, error, save } = useWeekPlan(week);
  const plan = saved || EMPTY_PLAN;
  const today = todayIn(week);
  const dates = weekDates(week);
  const [taskDraft, setTaskDraft] = useState({});

  const stats = useMemo(() => plan.goals.map(g => goalStatus(g, progress, pace, today)), [plan.goals, progress, pace, today]);

  const update = (patch) => save({ ...plan, ...patch });
  const setGoal = (i, g) => update({ goals: plan.goals.map((x, j) => (j === i ? g : x)) });

  // Per-day load: minutes still to do (from today on) vs. hours available.
  const load = ALL_DAYS.map(d => stats.reduce((n, s) => n + s.load[d], 0));
  const studied = ALL_DAYS.map(d => (progress._all?.days[d].s || 0) / 60);
  const plannedTotal = stats.reduce((n, s) => n + s.estTotalMin, 0);
  const leftTotal = stats.reduce((n, s) => n + s.estLeftMin, 0);
  const studiedTotal = studied.reduce((a, b) => a + b, 0);
  const overDays = ALL_DAYS.filter(d => plan.hours[d] != null && load[d] > plan.hours[d] * 60 + 1);
  const counts = stats.reduce((c, s) => ({ ...c, [s.status]: (c[s.status] || 0) + 1 }), {});
  const scaleMax = Math.max(60, ...load, ...studied, ...plan.hours.map(h => (h || 0) * 60));

  let verdict;
  if (!plan.goals.length) verdict = { tone: 'idle', text: 'Add a goal to start planning this week.' };
  else if (counts.done === plan.goals.length) verdict = { tone: 'good', text: 'Every goal is done this week. 🎉' };
  else if (today === -1) verdict = { tone: 'bad', text: `This week is over: ${counts.done || 0} of ${plan.goals.length} goals done.` };
  else if (overDays.length) verdict = { tone: 'warn', text: `Too much for the time you have on ${overDays.map(d => DAYS[d]).join(', ')}. Spread those goals over more days, lower a target or add hours.` };
  else if (counts.behind || counts.missed) verdict = { tone: 'warn', text: `${(counts.behind || 0) + (counts.missed || 0)} goal${(counts.behind || 0) + (counts.missed || 0) === 1 ? ' is' : 's are'} behind pace. Your daily shares have gone up to catch up.` };
  else verdict = { tone: 'good', text: plan.hours.some(h => h != null) ? 'On pace, and the plan fits the hours you have.' : 'On pace to hit every goal.' };

  const addTask = (d) => {
    const text = (taskDraft[d] || '').trim();
    if (!text) return;
    update({ tasks: [...plan.tasks, { id: newId(), day: d, text, done: false }] });
    setTaskDraft(t => ({ ...t, [d]: '' }));
  };

  const isThisWeek = week === weekOf();
  return (
    <div className="wp">
      <div className="wp-wrap">
        <header className="wp-head">
          <button type="button" className="wp-back" onClick={() => { window.location.href = '/'; }}>← Home</button>
          <div className="wp-title">
            <p className="wp-kicker">STUDY PLAN</p>
            <h1>Week Planner</h1>
          </div>
          <div className="wp-weeknav">
            <button type="button" className="wp-btn" aria-label="Previous week" onClick={() => setWeek(w => addWeeks(w, -1))}>‹</button>
            <span className="wp-weeklabel">{fmtDay(dates[0])} – {fmtDay(dates[6])}{isThisWeek ? <small>This week</small> : null}</span>
            <button type="button" className="wp-btn" aria-label="Next week" onClick={() => setWeek(w => addWeeks(w, 1))}>›</button>
            {!isThisWeek && <button type="button" className="wp-btn" onClick={() => setWeek(weekOf())}>Today</button>}
          </div>
        </header>

        {error === 'signin' ? (
          <p className="wp-note">Sign in to plan your week.</p>
        ) : loading ? (
          <p className="wp-note">Loading your week…</p>
        ) : (
          <>
            {localOnly && <p className="wp-note wp-note--warn">Your plan is saved in this browser only for now (the planner's database table hasn't been set up yet). Progress still updates as normal.</p>}
            {error === 'offline' && <p className="wp-note wp-note--warn">Couldn't reach the server, so progress isn't shown. Showing the plan saved in this browser.</p>}

            <section className="wp-summary" aria-label="Week summary">
              <div className={`wp-verdict wp-verdict--${verdict.tone}`}>{verdict.text}</div>
              <div className="wp-stats">
                <span><b>{plan.goals.length ? `${counts.done || 0}/${plan.goals.length}` : '—'}</b><i>goals done</i></span>
                <span><b>{fmtMinutes(plannedTotal)}</b><i>planned (est.)</i></span>
                <span><b>{fmtMinutes(leftTotal)}</b><i>still to do</i></span>
                <span><b>{fmtMinutes(studiedTotal)}</b><i>studied this week</i></span>
              </div>
            </section>

            <section className="wp-days" aria-label="Days of the week">
              {ALL_DAYS.map(d => {
                const hrs = plan.hours[d];
                const over = overDays.includes(d);
                const past = today === -1 || d < today;
                const tasks = plan.tasks.filter(t => t.day === d);
                return (
                  <div key={d} className={`wp-day${d === today ? ' is-today' : ''}${past ? ' is-past' : ''}${over ? ' is-over' : ''}`}>
                    <div className="wp-day-head">
                      <b>{DAYS[d]}</b><small>{fmtDay(dates[d])}</small>
                    </div>
                    <div className="wp-day-chart" aria-hidden="true">
                      {hrs != null && <span className="wp-day-cap" style={{ bottom: `${Math.min(100, (hrs * 60 / scaleMax) * 100)}%` }} />}
                      <i className="wp-day-done" style={{ height: `${(studied[d] / scaleMax) * 100}%` }} />
                      {!past && <i className="wp-day-todo" style={{ height: `${(load[d] / scaleMax) * 100}%`, bottom: `${(d === today ? studied[d] / scaleMax : 0) * 100}%` }} />}
                    </div>
                    <p className="wp-day-figs">
                      {studied[d] > 0.5 && <span className="wp-c-done">{fmtMinutes(studied[d])} done</span>}
                      {!past && load[d] > 0.5 && <span className="wp-c-todo">{fmtMinutes(load[d])} to do</span>}
                      {studied[d] <= 0.5 && (past || load[d] <= 0.5) && <span className="wp-c-dim">—</span>}
                    </p>
                    <label className="wp-day-hours">
                      <span>Hours free</span>
                      <input type="number" min="0" max="24" step="0.5" placeholder="–" value={hrs ?? ''}
                        onChange={e => {
                          const v = e.target.value === '' ? null : Math.min(24, Math.max(0, Number(e.target.value)));
                          update({ hours: plan.hours.map((h, i) => (i === d ? v : h)) });
                        }} />
                    </label>
                    <ul className="wp-tasks">
                      {tasks.map(t => (
                        <li key={t.id} className={t.done ? 'is-done' : ''}>
                          <label>
                            <input type="checkbox" checked={t.done}
                              onChange={() => update({ tasks: plan.tasks.map(x => (x.id === t.id ? { ...x, done: !x.done } : x)) })} />
                            <span>{t.text}</span>
                          </label>
                          <button type="button" aria-label={`Remove ${t.text}`} onClick={() => update({ tasks: plan.tasks.filter(x => x.id !== t.id) })}>×</button>
                        </li>
                      ))}
                    </ul>
                    <form className="wp-task-add" onSubmit={e => { e.preventDefault(); addTask(d); }}>
                      <input type="text" maxLength={140} placeholder="+ Task" aria-label={`Add a task for ${DAYS[d]}`}
                        value={taskDraft[d] || ''} onChange={e => setTaskDraft(t => ({ ...t, [d]: e.target.value }))} />
                    </form>
                  </div>
                );
              })}
            </section>
            <p className="wp-legend">
              <span><i className="wp-sw wp-sw--done" /> studied</span>
              <span><i className="wp-sw wp-sw--todo" /> still to do (rebalanced daily)</span>
              <span><i className="wp-sw wp-sw--cap" /> hours free</span>
            </p>

            <section className="wp-goals" aria-label="Goals">
              <div className="wp-section-head">
                <h2>Goals</h2>
                {!plan.goals.length && lastPlan?.plan?.goals?.length > 0 && (
                  <button type="button" className="wp-btn" onClick={() => update({ goals: lastPlan.plan.goals.map(g => ({ ...g, id: newId() })), hours: lastPlan.plan.hours })}>
                    Copy goals from week of {lastPlan.week}
                  </button>
                )}
              </div>
              {plan.goals.length > 0 ? (
                <ul className="wp-goal-list">
                  {plan.goals.map((g, i) => (
                    <GoalCard key={g.id} goal={g} st={stats[i]} pace={pace}
                      onChange={ng => setGoal(i, ng)}
                      onRemove={() => update({ goals: plan.goals.filter((_, j) => j !== i) })} />
                  ))}
                </ul>
              ) : (
                <p className="wp-note">No goals yet. Add one below, e.g. 40 UWorld Adventure questions or 80 Buzz Fun questions.</p>
              )}
              <AddGoal onAdd={g => update({ goals: [...plan.goals, g] })} />
              <p className="wp-fine">
                Progress counts finished sessions in each mode (the same ones Daily Activity shows). Time estimates use your own
                average time per question over the last four weeks once you've done 15 or more in that mode
                {Object.keys(pace).length ? '' : ', and typical times until then'}. "Any mode" averages {Math.round(secPerQ('_all', pace))} s per question.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
