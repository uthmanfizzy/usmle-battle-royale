import { sfxBus } from './audio';
import { sfxEnabled } from './minigameSfx';

/**
 * HY Diseases Qbank sounds. Synthesised (no files), routed through audio.js's
 * bus, and governed by the shared minigame sound switch (SfxToggle).
 *
 * The signature is a heart monitor: a right answer is a bright monitor
 * "beep-beep" that climbs into a chime (bigger with a streak); a wrong one is
 * a low flatline-ish tone with a thud.
 */

function env(g, t, peak, attack, release) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

function tone({ c, out }, { at = 0, freq, dur = 0.2, peak = 0.1, type = 'sine', glide = 0 }) {
  const t = c.currentTime + at;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t + dur);
  const g = c.createGain(); env(g, t, peak, 0.006, dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + 0.05);
}

function bell(bus, { at = 0, freq, dur = 0.5, peak = 0.08 }) {
  for (const [m, a] of [[1, 1], [2, 0.3], [3.01, 0.1]]) tone(bus, { at, freq: freq * m, dur, peak: peak * a });
}

function noise({ c, out }, { at = 0, dur = 0.25, freq = 1200, peak = 0.08, type = 'bandpass' }) {
  const t = c.currentTime + at;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
  f.frequency.exponentialRampToValueAtTime(freq * 3, t + dur);
  const g = c.createGain(); env(g, t, peak, 0.02, dur);
  s.connect(f).connect(g).connect(out);
  s.start(t); s.stop(t + dur + 0.05);
}

const play = (fn) => (...args) => {
  if (!sfxEnabled()) return;
  const bus = sfxBus();
  if (!bus) return;
  try { fn(bus, ...args); } catch { /* audio is a nicety */ }
};

export const hydSfx = {
  /** A new question slides in: a soft whoosh and a monitor blip. */
  card: play((bus) => {
    noise(bus, { dur: 0.22, freq: 600, peak: 0.035 });
    tone(bus, { at: 0.12, freq: 1046.5, dur: 0.07, peak: 0.04 });
  }),
  /** Hover/tap tick on an option. */
  tap: play((bus) => { tone(bus, { freq: 880, dur: 0.04, peak: 0.035, type: 'triangle' }); }),
  /** Right: monitor beep-beep, then a rising chime. Bigger with a streak. */
  correct: play((bus, streak = 1) => {
    tone(bus, { freq: 1318.5, dur: 0.08, peak: 0.07, type: 'square' });
    tone(bus, { at: 0.12, freq: 1318.5, dur: 0.08, peak: 0.07, type: 'square' });
    const base = 523.25;
    [1, 1.25, 1.5, 2].forEach((m, i) => bell(bus, { at: 0.26 + i * 0.065, freq: base * m, dur: 0.5, peak: 0.07 }));
    if (streak >= 3) bell(bus, { at: 0.55, freq: base * 2.5, dur: 0.8, peak: 0.06 });
    if (streak >= 5) bell(bus, { at: 0.66, freq: base * 3, dur: 0.9, peak: 0.05 });
  }),
  /** Wrong: a drooping monitor tone and a dull thud. */
  wrong: play((bus) => {
    tone(bus, { freq: 330, dur: 0.45, peak: 0.08, type: 'sawtooth', glide: -170 });
    tone(bus, { at: 0.02, freq: 110, dur: 0.22, peak: 0.16, glide: -50 });
  }),
  /** Streak milestone: a quick sparkle run. */
  streak: play((bus) => {
    [1568, 1760, 2093, 2637].forEach((f, i) => tone(bus, { at: 0.75 + i * 0.05, freq: f, dur: 0.18, peak: 0.035 }));
  }),
  /** Last seconds on the clock: a monitor tick, higher on the final one. */
  tick: play((bus, secondsLeft = 5) => {
    tone(bus, { freq: secondsLeft <= 1 ? 1568 : 1175, dur: 0.05, peak: 0.05, type: 'square' });
  }),
  /** Clock ran out: a flat alarm. */
  timeUp: play((bus) => {
    tone(bus, { freq: 440, dur: 0.18, peak: 0.07, type: 'square' });
    tone(bus, { at: 0.2, freq: 440, dur: 0.18, peak: 0.07, type: 'square' });
    tone(bus, { at: 0.4, freq: 330, dur: 0.4, peak: 0.07, type: 'square' });
  }),
  /** Next question. */
  next: play((bus) => { tone(bus, { freq: 660, dur: 0.06, peak: 0.05, type: 'triangle' }); tone(bus, { at: 0.06, freq: 990, dur: 0.08, peak: 0.05, type: 'triangle' }); }),
  /** Block started. */
  start: play((bus) => {
    noise(bus, { dur: 0.4, freq: 400, peak: 0.04 });
    [392, 523.25, 659.25].forEach((f, i) => bell(bus, { at: 0.1 + i * 0.1, freq: f, dur: 0.45, peak: 0.07 }));
  }),
  /** Block finished: a little fanfare. */
  complete: play((bus) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(bus, { at: i * 0.12, freq: f, dur: 0.6, peak: 0.08 }));
    bell(bus, { at: 0.55, freq: 1318.5, dur: 1.1, peak: 0.07 });
  }),
};
