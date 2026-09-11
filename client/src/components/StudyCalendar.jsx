import { useState, useEffect } from 'react';
import { formatStudyTime } from './ProfileModal';
import './StudyCalendar.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

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
export default function StudyCalendar({ userId }) {
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
