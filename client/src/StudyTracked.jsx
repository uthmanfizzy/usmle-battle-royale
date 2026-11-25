import { useCallback, useEffect, useRef } from 'react';
import { getToken } from './auth';
import { SERVER_URL } from './serverUrl';
import { useStudyActivity } from './studyPresence';

/**
 * Study time for the minigames (ECG Reader, Murmurs, Clot Cascade, ...).
 * main.jsx wraps each minigame route in <StudyTracked mode label>, so a
 * minigame needs no tracking code of its own, and a new one only needs its
 * route wrapped and its mode added to the server's FA_STUDY_MODES list
 * (and a label in ActivityPage's MODE_META).
 *
 * It counts ACTIVE seconds the way useStudySession does: only while the tab
 * is visible, never more than 5 s per tick, and not after 2 minutes without a
 * click, tap, key or scroll. One POST per visit to /api/fa-study-session, when
 * the page is left (unmount or pagehide), which writes the Daily Activity row
 * and the Study Time credit. Visits under 20 active seconds are not logged.
 * Guests send nothing.
 */
const IDLE_MS = 120000;
const MIN_SECONDS = 20;

export const MINIGAME_LABELS = {
  ecg_reader: 'ECG Reader',
  abg_reader: 'ABG Reader',
  muscle_mapper: 'Muscle Mapper',
  biostats_lab: 'Biostats Lab',
  spot_the_diagnosis: 'Spot the Diagnosis',
  genetics_roulette: 'Genetics Roulette',
  drug_match: 'Drug Mechanism Match',
  lab_range: 'Lab Range',
  murmurs: 'Murmurs',
  pv_loops: 'PV Loop Lab',
  clot_cascade: 'Clot Cascade',
  vitamin_vault: 'Vitamin Vault',
  pathway_navigator: 'Pathway Navigator',
};

export function useTimeStudy(mode) {
  const st = useRef({ seconds: 0, lastTouch: Date.now() });

  useEffect(() => {
    const touch = () => { st.current.lastTouch = Date.now(); };
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    evs.forEach(e => window.addEventListener(e, touch, { capture: true, passive: true }));
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const gap = Math.min(now - last, 5000);
      last = now;
      if (!document.hidden && now - st.current.lastTouch < IDLE_MS) st.current.seconds += gap / 1000;
    }, 1000);
    return () => {
      clearInterval(id);
      evs.forEach(e => window.removeEventListener(e, touch, { capture: true }));
    };
  }, []);

  const flush = useCallback(() => {
    const seconds = Math.round(st.current.seconds);
    st.current = { seconds: 0, lastTouch: Date.now() };
    if (seconds < MIN_SECONDS) return;
    const token = getToken();
    if (!token) return;
    fetch(`${SERVER_URL}/api/fa-study-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        mode,
        items: Math.ceil(seconds / 60), // active minutes: the server caps the credit at 60 s each
        duration_seconds: seconds,
        date: new Date().toLocaleDateString('en-CA'),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [mode]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);
}

export default function StudyTracked({ mode, children }) {
  useTimeStudy(mode);
  useStudyActivity(MINIGAME_LABELS[mode] || 'Minigame', null, mode);
  return children;
}
