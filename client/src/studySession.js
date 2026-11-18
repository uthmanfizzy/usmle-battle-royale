import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getToken } from './auth';
import { SERVER_URL } from './serverUrl';

/**
 * Study time for the self-paced study modes that have no server session of
 * their own (FA Images, FA HY Qs): ACTIVE seconds, counted the way every
 * study mode counts them — deliberately under rather than over.
 *
 *   • only while `active` (a run is on screen and not paused),
 *   • only while the tab is visible,
 *   • never more than 5 s per tick (a laptop that slept does not count),
 *   • and not after IDLE_MS without an answer or a page turn (AFK).
 *
 * One POST per run — on the results page, or when the page is left — to
 * /api/fa-study-session, which writes the Daily Activity row and the Study Time
 * credit. Guests (no token) send nothing.
 */
const IDLE_MS = 120000;

export function useStudySession({ mode, active, subject = null }) {
  const st = useRef({ seconds: 0, items: 0, correct: 0, lastTouch: Date.now() });
  const activeRef = useRef(active);
  activeRef.current = active;
  const subjectRef = useRef(subject);
  subjectRef.current = subject;

  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const gap = Math.min(now - last, 5000);
      last = now;
      const s = st.current;
      if (activeRef.current && !document.hidden && now - s.lastTouch < IDLE_MS) s.seconds += gap / 1000;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /** The student did something (answered, turned a page, resumed). */
  const touch = useCallback(() => { st.current.lastTouch = Date.now(); }, []);

  /** One question answered. */
  const count = useCallback((right) => {
    const s = st.current;
    s.items += 1;
    if (right) s.correct += 1;
    s.lastTouch = Date.now();
  }, []);

  /** Send what has been studied since the last flush, then start afresh. */
  const flush = useCallback((keepalive = false) => {
    const s = st.current;
    const body = {
      mode,
      subject: subjectRef.current || null,
      items: s.items,
      correct: s.correct,
      duration_seconds: Math.round(s.seconds),
      date: new Date().toLocaleDateString('en-CA'),
    };
    st.current = { seconds: 0, items: 0, correct: 0, lastTouch: Date.now() };
    if (!body.items || body.duration_seconds <= 0) return;
    const token = getToken();
    if (!token) return;
    fetch(`${SERVER_URL}/api/fa-study-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      ...(keepalive ? { keepalive: true } : {}),
    }).catch(() => {});
  }, [mode]);

  // Leaving mid-run still counts: 'pagehide' for a hard navigation, unmount
  // for a soft one.
  useEffect(() => {
    const onHide = () => flush(true);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      flush(true);
    };
  }, [flush]);

  return useMemo(() => ({ touch, count, flush }), [touch, count, flush]);
}
