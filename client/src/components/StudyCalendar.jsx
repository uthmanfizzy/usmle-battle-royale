import { useState, useEffect } from 'react';
import { formatStudyTime } from './ProfileModal';
import './StudyCalendar.css';

import { SERVER_URL } from '../serverUrl';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
// Monday-first week (study-planner convention)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Heatmap tiers: 0 none · 1 under 30min · 2 30min–2h · 3 2h–3h ·
// 4 3h–4h (green, a genuinely strong day) · 5 over 4h (turquoise, the top tier)
function intensity(seconds) {
  if (!seconds || seconds <= 0) return 0;
  if (seconds < 30 * 60) return 1;
  if (seconds <= 2 * 3600) return 2;
  if (seconds <= 3 * 3600) return 3;
  if (seconds <= 4 * 3600) return 4;
  return 5;
}

// A duration short enough for a calendar tile. Minutes are dropped past the
// hour mark only when they are zero, so "3h" and "3h 5m" both read cleanly.
function compactTime(seconds) {
  const mins = Math.round((seconds || 0) / 60);
  if (mins <= 0) return '';
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? h + 'h ' + m + 'm' : h + 'h';
}

// From-scratch month-grid heatmap of study_time_daily (no calendar lib is
// installed). Month navigation re-fetches; future months are unreachable.
// variant="celestial" is the Celestial theme's Profile design: a titled panel
// with month totals, uppercase weekdays, a "Today" tile and a Less→More key.
// The data, navigation and day links are the same.
export default function StudyCalendar({ userId, variant, onSeeActivity }) {
  const celestial = variant === 'celestial';
  const today = new Date();
  const [year, setYear]         = useState(today.getFullYear());
  const [month, setMonth]       = useState(today.getMonth() + 1); // 1-12
  const [dayMap, setDayMap]     = useState({});                   // 'YYYY-MM-DD' -> seconds
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);                 // { date, day, seconds }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setSelected(null);
    fetch(`${SERVER_URL}/api/users/${userId}/study-time/calendar?year=${year}&month=${month}`)
      .then(r => (r.ok ? r.json() : { days: [] }))
      .then(d => {
        if (cancelled) return;
        const map = {};
        for (const row of d.days || []) map[row.date] = row.seconds || 0;
        setDayMap(map);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setDayMap({}); setLoading(false); } });
    return () => { cancelled = true; };
  }, [userId, year, month]);

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return; // never navigate into the future
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay(): 0=Sun..6=Sat → shift so Monday is column 0
  const leadBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const dateKey = d =>
    `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (celestial) {
    // Month totals: average and "days studied" count only the days that have
    // happened (all of them for a past month, up to today for this one).
    const elapsed = isCurrentMonth ? today.getDate() : daysInMonth;
    let total = 0; let studied = 0;
    for (let d = 1; d <= elapsed; d++) { const v = dayMap[dateKey(d)] || 0; total += v; if (v > 0) studied++; }
    const caps = (secs) => (formatStudyTime(secs) || '0m').toUpperCase();
    const todayNum = isCurrentMonth ? today.getDate() : null;
    const sel = selected || (todayNum ? { date: dateKey(todayNum), day: todayNum, seconds: dayMap[dateKey(todayNum)] || 0 } : null);
    const selDate = sel ? new Date(year, month - 1, sel.day) : null;
    return (
      <div className="sc--celestial">
        <div className="scc-head">
          <div className="scc-title"><span className="scc-diamond" aria-hidden="true" /><h2>Study time</h2></div>
          <div className="scc-nav">
            <button type="button" className="scc-arrow" onClick={prevMonth} aria-label="Previous month">
              <svg viewBox="0 0 10 17" aria-hidden="true"><path d="M8.5 1.5 1.5 8.5l7 7" /></svg>
            </button>
            <p className="scc-month" aria-live="polite"><span>{MONTHS[month - 1][0]}</span><span className="scc-sc">{MONTHS[month - 1].slice(1).toUpperCase()}</span> {year}</p>
            <button type="button" className="scc-arrow" onClick={nextMonth} disabled={isCurrentMonth} aria-label="Next month">
              <svg viewBox="0 0 10 17" aria-hidden="true"><path d="M1.5 1.5 8.5 8.5l-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="scc-stats">
          <div><span>{isCurrentMonth ? 'Total this month' : 'Total that month'}</span><b>{loading ? '…' : caps(total)}</b></div>
          <div><span>Daily average</span><b>{loading ? '…' : caps(elapsed ? total / elapsed : 0)}</b></div>
          <div><span>Days studied</span><b>{loading ? '…' : <>{studied} <span className="scc-sc">OF</span> {elapsed}</>}</b></div>
        </div>
        <div className="scc-grid">
          {WEEKDAYS.map(w => <div key={w} className="scc-wd">{w.toUpperCase()}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`blank-${i}`} className="scc-blank" />;
            const secs = dayMap[dateKey(d)] || 0;
            const lvl  = intensity(secs);
            const future = isCurrentMonth && d > today.getDate();
            const isToday = d === todayNum;
            return (
              <button
                key={d}
                type="button"
                className={`scc-day scc-lvl-${lvl}${isToday ? ' is-today' : ''}${future ? ' is-future' : ''}${selected?.day === d ? ' is-sel' : ''}`}
                disabled={future}
                onClick={() => {
                  setSelected({ date: dateKey(d), day: d, seconds: secs });
                  if (secs > 0 && userId) window.location.href = `/activity/${userId}?date=${dateKey(d)}`;
                }}
                title={secs > 0 ? `${formatStudyTime(secs)} studied — open this day's activity` : 'No study time recorded'}
              >
                <span className="scc-num">{d}</span>
                {isToday && <span className="scc-today">Today</span>}
                {secs > 0 && <span className="scc-time">{compactTime(secs)}</span>}
              </button>
            );
          })}
        </div>
        <div className="scc-foot">
          <p className="scc-detail">
            {sel && <><b>{selDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</b> · {sel.seconds > 0 ? formatStudyTime(sel.seconds) : 'no study time'}</>}
            {onSeeActivity && (
              <button type="button" className="scc-link" onClick={onSeeActivity}>
                See daily activity
                <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 1v13M1.5 9.5 6 14l4.5-4.5" /></svg>
              </button>
            )}
          </p>
          <span className="scc-legend" aria-hidden="true">
            Less <i className="scc-lvl-0" /><i className="scc-lvl-1" /><i className="scc-lvl-2" /><i className="scc-lvl-3" /><i className="scc-lvl-4" /> More
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="sc">
      <div className="sc-head">
        <button className="sc-arrow" onClick={prevMonth} title="Previous month">‹</button>
        <span className="sc-title">{MONTHS[month - 1]} {year}</span>
        <button
          className="sc-arrow"
          onClick={nextMonth}
          disabled={isCurrentMonth}
          title={isCurrentMonth ? 'Already at the current month' : 'Next month'}
        >›</button>
      </div>

      <div className="sc-grid">
        {WEEKDAYS.map(w => <div key={w} className="sc-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`blank-${i}`} className="sc-cell sc-blank" />;
          const secs = dayMap[dateKey(d)] || 0;
          const lvl  = intensity(secs);
          const sel  = selected?.day === d;
          return (
            <button
              key={d}
              className={`sc-cell sc-day sc-lvl-${lvl}${sel ? ' sc-day--sel' : ''}${secs > 0 ? ' sc-day--open' : ''}`}
              // A day with time opens its own activity log; a day without has
              // nothing to show, so it only selects and says so below rather
              // than sending you to an empty page.
              onClick={() => {
                setSelected({ date: dateKey(d), day: d, seconds: secs });
                if (secs > 0 && userId) {
                  window.location.href = `/activity/${userId}?date=${dateKey(d)}`;
                }
              }}
              title={secs > 0
                ? `${formatStudyTime(secs)} studied — open this day's activity`
                : 'No study time recorded'}
            >
              <span className="sc-day-num">{d}</span>
              {secs > 0 && <span className="sc-day-time">{compactTime(secs)}</span>}
            </button>
          );
        })}
      </div>

      <div className="sc-detail">
        {loading ? (
          <span className="sc-detail-muted">Loading…</span>
        ) : selected ? (
          selected.seconds > 0 ? (
            <span>
              <strong>{MONTHS[month - 1].slice(0, 3)} {selected.day}</strong> — {formatStudyTime(selected.seconds)} studied
            </span>
          ) : (
            <span className="sc-detail-muted">
              {MONTHS[month - 1].slice(0, 3)} {selected.day} — no study time
            </span>
          )
        ) : (
          <span className="sc-legend">
            <span className="sc-legend-swatch sc-lvl-0" /> none
            <span className="sc-legend-swatch sc-lvl-1" /> &lt;30m
            <span className="sc-legend-swatch sc-lvl-2" /> 30m–2h
            <span className="sc-legend-swatch sc-lvl-3" /> 2h–3h
            <span className="sc-legend-swatch sc-lvl-4" /> 3h+
            <span className="sc-legend-swatch sc-lvl-5" /> 4h+
          </span>
        )}
      </div>
    </div>
  );
}
