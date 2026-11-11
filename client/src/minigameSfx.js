import { sfxBus } from './audio';

/**
 * Sound effects for the minigames (ECG Reader, ABG Reader, Muscle Mapper).
 *
 * Synthesised with Web Audio — no files to download, nothing to cache, and
 * every sound is built from the same small palette so the three games sound
 * like one family. All of it is routed through audio.js's output bus, so the
 * player's volume setting and the app-wide mute govern it.
 *
 * On top of that the minigames have their OWN on/off, remembered per device:
 * someone revising in a library wants the game silent without muting the
 * whole app the next time they play a match.
 *
 * Tuned to be soft. These play on every answer of a study session, so
 * anything with an edge to it would be wearing within five minutes: sine
 * and triangle tones, short envelopes, nothing louder than a gentle chime.
 */

const KEY = 'mv_minigame_sfx';
let enabled = (() => {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
})();
const listeners = new Set();

export const sfxEnabled = () => enabled;
export function setSfxEnabled(on) {
  enabled = !!on;
  try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* not remembered */ }
  listeners.forEach(fn => fn(enabled));
}
export function onSfxChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function bus() {
  if (!enabled) return null;
  return sfxBus();
}

// One enveloped tone.
function tone(b, { freq, type = 'sine', start = 0, dur = 0.18, gain = 0.16, slideTo = null, attack = 0.008 }) {
  const { c, out } = b;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// A short band of filtered noise — whooshes and snips.
function noise(b, { start = 0, dur = 0.25, gain = 0.08, from = 400, to = 2400, q = 0.9 }) {
  const { c, out } = b;
  const t = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const play = (fn) => { const b = bus(); if (b) { try { fn(b); } catch { /* audio is a nicety */ } } };

export const sfx = {
  /** A soft tap, for choosing an option. */
  select: () => play(b => tone(b, { freq: 740, type: 'triangle', dur: 0.07, gain: 0.08 })),

  /** Two rising bell notes. */
  correct: () => play(b => {
    tone(b, { freq: 659.3, type: 'sine', dur: 0.22, gain: 0.15 });
    tone(b, { freq: 987.8, type: 'sine', start: 0.09, dur: 0.32, gain: 0.15 });
    tone(b, { freq: 1975.5, type: 'sine', start: 0.09, dur: 0.18, gain: 0.03 });
  }),

  /** A low, gentle "not quite" — two soft falling notes, nothing harsh. */
  wrong: () => play(b => {
    tone(b, { freq: 246.9, type: 'triangle', dur: 0.18, gain: 0.14 });
    tone(b, { freq: 196, type: 'triangle', start: 0.11, dur: 0.3, gain: 0.13 });
  }),

  /** Moving on: a short airy whoosh. */
  next: () => play(b => noise(b, { dur: 0.22, gain: 0.05, from: 500, to: 3000 })),

  /** A case finished: a quick major arpeggio. */
  complete: () => play(b => {
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(b, { freq: f, type: 'sine', start: i * 0.075, dur: 0.3, gain: 0.12 }));
  }),

  /** A perfect case or a streak: a sparkle on top of the arpeggio. */
  sparkle: () => play(b => {
    [1568, 2093, 2637, 3136].forEach((f, i) => tone(b, { freq: f, type: 'sine', start: 0.12 + i * 0.05, dur: 0.18, gain: 0.04 }));
  }),

  /** End of a run. */
  fanfare: () => play(b => {
    [[523.3, 0], [659.3, 0.12], [784, 0.24], [1046.5, 0.38], [784, 0.52], [1046.5, 0.62]].forEach(([f, s]) =>
      tone(b, { freq: f, type: 'triangle', start: s, dur: 0.34, gain: 0.11 }));
  }),

  /** The cardiac monitor's beep, on each QRS. */
  beep: () => play(b => tone(b, { freq: 960, type: 'sine', dur: 0.075, gain: 0.07, attack: 0.004 })),

  /** A gas bubble popping — for the ABG Reader's reveals. */
  bubble: () => play(b => tone(b, { freq: 320, type: 'sine', dur: 0.09, gain: 0.1, slideTo: 980 })),

  /** A nerve signal travelling — for the Muscle Mapper's pathways. */
  zap: () => play(b => {
    tone(b, { freq: 220, type: 'sawtooth', dur: 0.16, gain: 0.035, slideTo: 1400 });
    noise(b, { dur: 0.16, gain: 0.03, from: 1500, to: 6000, q: 3 });
  }),

  /** A lesion: a snip, then a dull thud as the signal stops. */
  cut: () => play(b => {
    noise(b, { dur: 0.08, gain: 0.08, from: 3000, to: 6000, q: 2 });
    tone(b, { freq: 140, type: 'sine', start: 0.05, dur: 0.22, gain: 0.14, slideTo: 70 });
  }),
};
