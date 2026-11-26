import { useEffect, useState } from 'react';
import { SERVER_URL } from '../../serverUrl';
import { authHeaders } from '../../auth';
import { HiddenActivity } from '../ActivityPrivacyNote';
import { modeMeta, subjectLabel } from '../ActivityPage';
import './CelestialDailyActivity.css';

/**
 * The Profile design's "Daily activity": the last seven days, each as a
 * 24-hour track with the study sessions laid on it and one chip per session.
 *
 * Days are the player's local dates; the tz sent with each request makes the
 * server window them by local midnight too. Bars sit at the local clock time.
 * Each day links through to the full Daily Activity page.
 */

const DAYS = 7;
// Local calendar dates, so "today" here is the same day the study calendar
// above marks as today.
const ymd = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function dur(secs) {
  const m = Math.round((secs || 0) / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${h}h`;
}
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const dayFrac = (ms) => { const d = new Date(ms); return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400; };

function title(s) {
  if (s.game_mode === 'journey' && s.journey_chapter_name) return s.journey_chapter_name;
  const subj = s.subject && s.subject !== 'all' ? subjectLabel(s.subject) : null;
  return subj || modeMeta(s.game_mode).label;
}

function shape(sessions) {
  return (sessions || []).map(s => {
    const end = Date.parse(s.ended_at);
    if (!Number.isFinite(end)) return null;
    const secs = Number(s.duration_seconds) || 0;
    const st = s.started_at ? Date.parse(s.started_at) : NaN;
    const start = Number.isFinite(st) ? st : end - secs * 1000;
    return { id: s.id || `${start}`, start, end: Math.max(start, end), secs, title: title(s), icon: modeMeta(s.game_mode).icon };
  }).filter(Boolean).sort((a, b) => a.start - b.start);
}

export default function CelestialDailyActivity({ userId, anchorId }) {
  const [days, setDays] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    let off = false;
    const now = Date.now();
    const dates = Array.from({ length: DAYS }, (_, i) => ymd(now - i * 86400000));
    Promise.all(dates.map(date =>
      fetch(`${SERVER_URL}/api/users/${userId}/activity-sessions?date=${date}&tz=${new Date().getTimezoneOffset()}`, { headers: authHeaders() })
        .then(r => (r.ok ? r.json() : { sessions: [] }))
        .then(d => ({ date, sessions: shape(d.sessions), hidden: d.hidden ? (d.visibility || 'private') : null }))
        .catch(() => ({ date, sessions: [] })),
    )).then(list => { if (!off) setDays(list); });
    return () => { off = true; };
  }, [userId]);

  const today = ymd(Date.now());
  const last = days?.[0]?.date || today;
  const label = new Date(`${last}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <section className="cda" id={anchorId} aria-labelledby="cda-title">
      <div className="cda-head">
        <div className="cda-title"><span className="cda-diamond" aria-hidden="true" /><h2 id="cda-title">Daily activity</h2></div>
        <span className="cda-range">{DAYS} days ending {label}</span>
      </div>

      {days === null && <div className="cda-day cda-day--loading">Loading activity…</div>}
      {days?.[0]?.hidden && <HiddenActivity visibility={days[0].hidden} what="daily activity" />}

      {days && !days[0]?.hidden && days.map(({ date, sessions }) => {
        const total = sessions.reduce((n, s) => n + s.secs, 0);
        const d = new Date(`${date}T12:00:00Z`);
        const dayName = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
        return (
          <a key={date} className="cda-day" href={`/activity/${userId}?date=${date}`} title="Open this day's full activity">
            <div className="cda-sum">
              <div className="cda-date">{dayName}{date === today && <span className="cda-today">TODAY</span>}</div>
              <div className="cda-total">{dur(total).toUpperCase()}</div>
              <div className="cda-count">{sessions.length} session{sessions.length === 1 ? '' : 's'}</div>
            </div>
            <div className="cda-main">
              <div className="cda-track" aria-hidden="true">
                {sessions.map(s => {
                  const a = dayFrac(s.start);
                  let b = dayFrac(s.end);
                  if (b < a) b = 1;   // ran past midnight
                  return <span key={s.id} className="cda-bar" style={{ left: `${a * 100}%`, width: `max(10px, ${(b - a) * 100}%)` }} />;
                })}
              </div>
              <div className="cda-hours" aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
              {sessions.length ? (
                <div className="cda-chips">
                  {sessions.map(s => (
                    <span key={s.id} className="cda-chip">
                      <b>{s.title}</b> {hhmm(s.start)}–{hhmm(s.end)} <em>· {dur(s.secs)}</em>
                    </span>
                  ))}
                </div>
              ) : <p className="cda-none">No study logged</p>}
            </div>
          </a>
        );
      })}
    </section>
  );
}
