import { sfxBus } from './audio';

/**
 * Clue Ladder's own sounds — a paper case file on a clinic desk.
 *
 * Synthesised with Web Audio (no files) and routed through audio.js's bus, so
 * the app's volume and mute govern them. The palette is stationery: a
 * typewriter clatter when a clue prints, a rubber stamp when a guess is
 * wrong, a ticket tear for "Next clue", a desk bell and a rising ladder of
 * notes when you solve it, a soft clock tick in the last ten seconds.
 *
 * Kept short and quiet — they fire many times a match.
 */

function env(g, t, peak, attack, release) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

let noiseBuf = null;
function noise(c) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.5);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** A burst of filtered noise — key strikes, paper, stamps. */
function hiss(bus, { at = 0, dur = 0.04, peak = 0.12, type = 'bandpass', freq = 3000, q = 1.2, sweepTo = 0 }) {
  const { c, out } = bus;
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = c.createGain();
  env(g, t, peak, 0.002, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
}

/** A pitched blip — sine or triangle with a quick decay. */
function tone(bus, { at = 0, freq = 660, dur = 0.18, peak = 0.1, type = 'sine', glide = 0 }) {
  const { c, out } = bus;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t + dur);
  const g = c.createGain();
  env(g, t, peak, 0.004, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** A desk bell: inharmonic partials with a long ring. */
function bell(bus, { at = 0, freq = 1320, peak = 0.09, dur = 0.9 }) {
  for (const [m, a] of [[1, 1], [2.76, 0.4], [5.4, 0.18]]) tone(bus, { at, freq: freq * m, peak: peak * a, dur: dur / m ** 0.3 });
}

const play = (fn) => (...args) => { const bus = sfxBus(); if (bus) { try { fn(bus, ...args); } catch { /* audio is a nicety */ } } };

export const clueSfx = {
  /** A new case: a printer feeds the ticket, then a little three-note ladder. */
  intro: play((bus) => {
    for (let i = 0; i < 7; i++) hiss(bus, { at: i * 0.045, dur: 0.03, peak: 0.05, freq: 2200 + (i % 2) * 900 });
    [523, 659, 784].forEach((f, i) => tone(bus, { at: 0.38 + i * 0.09, freq: f, peak: 0.07, type: 'triangle', dur: 0.16 }));
  }),

  /** The case opens: a firm bell tap. */
  open: play((bus) => bell(bus, { freq: 1046, peak: 0.07, dur: 0.6 })),

  /** A clue prints: typewriter keys and a carriage ding. */
  clue: play((bus) => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const at = i * 0.055 + Math.random() * 0.015;
      hiss(bus, { at, dur: 0.025, peak: 0.09, freq: 1800 + Math.random() * 1400, q: 2 });
      tone(bus, { at, freq: 160 + Math.random() * 40, dur: 0.03, peak: 0.05, type: 'square' });
    }
    tone(bus, { at: n * 0.055 + 0.05, freq: 2093, dur: 0.25, peak: 0.035 });
  }),

  /** A key press in the guess box — very soft. */
  key: play((bus) => hiss(bus, { dur: 0.018, peak: 0.025, freq: 2600 + Math.random() * 800, q: 3 })),

  /** Wrong: a rubber stamp hits the desk. */
  wrong: play((bus) => {
    tone(bus, { freq: 120, glide: -60, dur: 0.16, peak: 0.2, type: 'sine' });
    hiss(bus, { dur: 0.08, peak: 0.12, type: 'lowpass', freq: 900, q: 0.7 });
    tone(bus, { at: 0.05, freq: 196, dur: 0.18, peak: 0.05, type: 'square', glide: -40 });
  }),

  /** Next clue: a ticket stub torn off. */
  pass: play((bus) => {
    hiss(bus, { dur: 0.22, peak: 0.08, type: 'bandpass', freq: 1200, sweepTo: 5200, q: 0.9 });
    tone(bus, { at: 0.2, freq: 740, dur: 0.08, peak: 0.04, type: 'triangle' });
  }),

  /** Solved: a climb up the ladder, then a desk bell. Earlier = more rungs. */
  correct: play((bus, attempts = 3) => {
    const steps = Math.max(2, 8 - attempts);
    const scale = [523, 587, 659, 784, 880, 1046, 1175];
    for (let i = 0; i < steps; i++) tone(bus, { at: i * 0.06, freq: scale[i % scale.length], dur: 0.14, peak: 0.07, type: 'triangle' });
    bell(bus, { at: steps * 0.06 + 0.02, freq: 1568, peak: 0.08, dur: 1.1 });
  }),

  /** Out of clues: a descending, muffled two-note. */
  out: play((bus) => {
    tone(bus, { freq: 330, dur: 0.22, peak: 0.08, type: 'triangle' });
    tone(bus, { at: 0.18, freq: 247, dur: 0.4, peak: 0.08, type: 'triangle', glide: -30 });
  }),

  /** Someone else solved it: a small far-off bell. */
  other: play((bus) => tone(bus, { freq: 1760, dur: 0.3, peak: 0.025 })),

  /** Last ten seconds: a clock tick (higher on the even seconds). */
  tick: play((bus, even = false) => {
    hiss(bus, { dur: 0.015, peak: 0.07, freq: even ? 4200 : 3200, q: 6 });
    tone(bus, { freq: even ? 1400 : 1100, dur: 0.03, peak: 0.03, type: 'square' });
  }),

  /** The answer is revealed: a page turned and a stamp of approval. */
  reveal: play((bus) => {
    hiss(bus, { dur: 0.3, peak: 0.05, type: 'highpass', freq: 1800, sweepTo: 600, q: 0.6 });
    tone(bus, { at: 0.28, freq: 98, dur: 0.14, peak: 0.16, glide: -30 });
    hiss(bus, { at: 0.28, dur: 0.06, peak: 0.08, type: 'lowpass', freq: 1100 });
  }),

  /** Final results: a short brass-ish fanfare, brighter if you won. */
  fanfare: play((bus, won = false) => {
    const notes = won ? [523, 659, 784, 1046, 1318] : [392, 494, 587, 784];
    notes.forEach((f, i) => {
      tone(bus, { at: i * 0.11, freq: f, dur: 0.3, peak: 0.06, type: 'sawtooth' });
      tone(bus, { at: i * 0.11, freq: f * 2, dur: 0.3, peak: 0.02 });
    });
    bell(bus, { at: notes.length * 0.11, freq: won ? 2093 : 1568, peak: 0.07, dur: 1.3 });
  }),

  /** UI click on chips and buttons. */
  tap: play((bus) => {
    hiss(bus, { dur: 0.02, peak: 0.05, freq: 2400, q: 2 });
    tone(bus, { freq: 880, dur: 0.04, peak: 0.03, type: 'triangle' });
  }),
};

export default clueSfx;
