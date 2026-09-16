import { useEffect, useRef } from 'react';
import { getToken } from './auth';

// "Online, and studying what" — shown to friends on the Friends page.
//
// Every signed-in tab sends a small heartbeat to the server every 30s saying
// which study mode (if any) is on screen. Study pages declare themselves with
// useStudyActivity(); when several are mounted at once (UWorld's subject page
// with its game on top) the most recently mounted one wins, and unmounting
// falls back to the one underneath.

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
const BEAT_MS = 30000;

const stack = [];            // [{ key, activity }]
let nextKey = 1;
let timer = null;

const current = () => (stack.length ? stack[stack.length - 1].activity : null);

function beat() {
  const token = getToken();
  if (!token) return;
  fetch(`${SERVER_URL}/api/presence/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ activity: current() }),
    keepalive: true,
  }).catch(() => {});
}

// A change of activity goes out straight away (debounced a moment, so a page
// that mounts and immediately refines its detail sends once).
let soon = null;
function beatSoon() {
  clearTimeout(soon);
  soon = setTimeout(() => beat(), 400);
}

export function startPresenceHeartbeat() {
  if (timer) return () => {};
  beat();
  timer = setInterval(() => beat(), BEAT_MS);
  const onVisible = () => { if (!document.hidden) beat(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    clearInterval(timer);
    timer = null;
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/**
 * Declare what this screen is studying while it is mounted.
 * `label` is the mode ("UWorld Adventure"), `detail` the subject/deck/level.
 * Pass a null label to declare nothing.
 */
export function useStudyActivity(label, detail = null, mode = null) {
  // One stack slot for the component's whole life, updated in place, so a
  // page underneath refining its detail never jumps above the game on top.
  const keyRef = useRef(0);
  if (!keyRef.current) keyRef.current = nextKey++;
  useEffect(() => {
    const key = keyRef.current;
    return () => {
      const i = stack.findIndex(e => e.key === key);
      if (i !== -1) { stack.splice(i, 1); beatSoon(); }
    };
  }, []);
  useEffect(() => {
    const key = keyRef.current;
    const i = stack.findIndex(e => e.key === key);
    if (!label) {
      if (i !== -1) { stack.splice(i, 1); beatSoon(); }
      return;
    }
    const activity = { mode: mode || null, label, detail: detail || null };
    if (i === -1) stack.push({ key, activity });
    else stack[i] = { key, activity };
    beatSoon();
  }, [label, detail, mode]);
}
