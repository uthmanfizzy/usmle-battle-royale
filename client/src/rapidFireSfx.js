import { sfxBus } from './audio';
import { sfxEnabled } from './minigameSfx';

/**
 * Mehlman Rapid Fire's own sounds — an electric arcade, to match the neon
 * storm skin (RapidFire.css).
 *
 * Synthesised with Web Audio (no files), routed through audio.js's bus so the
 * app's volume and mute govern them, and through the minigames' shared on/off
 * (SfxToggle) so one switch silences every study mode.
 *
 * Kept short and rounded: these fire on every question of a block, so each is
 * a quick, filtered tone rather than anything with a harsh edge. The correct
 * chime climbs a semitone per streak step (capped) so a run is audible.
 */

function bus() {
  if (!sfxEnabled()) return null;
  return sfxBus();
}

let noiseBuf = null;
function noiseBuffer(c) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 1.2);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function env(g, t, peak, attack, release) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

/** One tone: optional glide and a low-pass that closes over the note. */
function tone(b, { at = 0, freq, dur = 0.15, peak = 0.08, type = 'square', glideTo = null, lp = 3200, attack = 0.005, detune = 0 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.detune.value = detune;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + attack + dur);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(lp, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(300, lp * 0.35), t + attack + dur);
  const g = c.createGain();
  env(g, t, peak, attack, dur);
  o.connect(f).connect(g).connect(out);
  o.start(t);
  o.stop(t + attack + dur + 0.05);
}

/** A filtered noise sweep — whooshes, zaps, the crackle of a spark. */
function sweep(b, { at = 0, dur = 0.25, peak = 0.06, from = 600, to = 4000, q = 2, type = 'bandpass', attack = 0.01 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + attack + dur);
  const g = c.createGain();
  env(g, t, peak, attack, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.8);
  src.stop(t + attack + dur + 0.05);
}

const semi = (base, n) => base * Math.pow(2, n / 12);

export const rapidSfx = {
  /** Pointer over a subject tile: a tiny glassy tick. */
  hover() {
    const b = bus(); if (!b) return;
    tone(b, { freq: 1760, dur: 0.035, peak: 0.018, type: 'triangle', lp: 6000 });
  },

  /** A subject chosen / a button pressed: a bright electric zap. */
  select() {
    const b = bus(); if (!b) return;
    tone(b, { freq: 520, glideTo: 1560, dur: 0.09, peak: 0.05, type: 'square', lp: 4200 });
    sweep(b, { dur: 0.08, peak: 0.03, from: 2500, to: 7000, q: 4 });
  },

  /** The system menu opening: a soft power-up shimmer. */
  open() {
    const b = bus(); if (!b) return;
    [0, 4, 7, 12].forEach((n, i) => tone(b, { at: i * 0.035, freq: semi(660, n), dur: 0.12, peak: 0.032, type: 'triangle', lp: 5000 }));
    sweep(b, { dur: 0.3, peak: 0.025, from: 800, to: 5000, q: 1.5 });
  },

  /** Starting a block: a charge-up riser that lands on a punchy hit. */
  start() {
    const b = bus(); if (!b) return;
    tone(b, { freq: 110, glideTo: 880, dur: 0.45, peak: 0.045, type: 'sawtooth', lp: 2400 });
    tone(b, { freq: 112, glideTo: 890, dur: 0.45, peak: 0.03, type: 'sawtooth', lp: 2400, detune: 12 });
    sweep(b, { dur: 0.45, peak: 0.04, from: 300, to: 6000, q: 1.2 });
    tone(b, { at: 0.47, freq: 160, glideTo: 45, dur: 0.28, peak: 0.16, type: 'sine', lp: 900 });
    [0, 7, 12].forEach(n => tone(b, { at: 0.47, freq: semi(440, n), dur: 0.35, peak: 0.035, type: 'square', lp: 2600 }));
  },

  /** Clicking an answer, before the verdict: a laser blip. */
  pick() {
    const b = bus(); if (!b) return;
    tone(b, { freq: 1400, glideTo: 700, dur: 0.06, peak: 0.035, type: 'square', lp: 3800 });
  },

  /** Right answer: a rising arpeggio that climbs with the streak, plus sparkle. */
  correct(streak = 1) {
    const b = bus(); if (!b) return;
    const lift = Math.min(Math.max(streak - 1, 0), 9);
    const root = semi(523.25, lift);
    [0, 4, 7, 12].forEach((n, i) => tone(b, { at: i * 0.055, freq: semi(root, n), dur: 0.16, peak: 0.05, type: 'square', lp: 4600 }));
    tone(b, { at: 0.22, freq: semi(root, 24), dur: 0.3, peak: 0.022, type: 'triangle', lp: 9000 });
    sweep(b, { at: 0.18, dur: 0.22, peak: 0.02, from: 6000, to: 11000, q: 6 });
  },

  /** A streak milestone (3, 5, 10…): a short triumphant power chord. */
  combo() {
    const b = bus(); if (!b) return;
    [0, 7, 12, 16].forEach(n => {
      tone(b, { at: 0.28, freq: semi(392, n), dur: 0.38, peak: 0.03, type: 'sawtooth', lp: 3000 });
    });
    sweep(b, { at: 0.24, dur: 0.4, peak: 0.03, from: 1200, to: 9000, q: 1 });
  },

  /** Wrong answer: a detuned descending buzz, short so it does not sting. */
  wrong() {
    const b = bus(); if (!b) return;
    tone(b, { freq: 220, glideTo: 92, dur: 0.32, peak: 0.07, type: 'sawtooth', lp: 1100 });
    tone(b, { freq: 233, glideTo: 98, dur: 0.32, peak: 0.05, type: 'sawtooth', lp: 1100, detune: -20 });
  },

  /** Time ran out on a question: a falling power-down. */
  timeout() {
    const b = bus(); if (!b) return;
    tone(b, { freq: 660, glideTo: 70, dur: 0.6, peak: 0.06, type: 'square', lp: 1800 });
  },

  /** The last five seconds: a tight electronic tick, higher as time runs out. */
  tick(secondsLeft = 5) {
    const b = bus(); if (!b) return;
    const f = 900 + (5 - Math.max(1, Math.min(5, secondsLeft))) * 140;
    tone(b, { freq: f, dur: 0.04, peak: 0.04, type: 'square', lp: 5000 });
    tone(b, { at: 0.005, freq: f * 2, dur: 0.02, peak: 0.012, type: 'triangle', lp: 8000 });
  },

  /** Skip / next question: a quick air whoosh. */
  whoosh() {
    const b = bus(); if (!b) return;
    sweep(b, { dur: 0.22, peak: 0.05, from: 500, to: 5000, q: 1.4 });
  },

  /** Block complete: a bright little fanfare. */
  fanfare() {
    const b = bus(); if (!b) return;
    const seq = [[0, 0], [4, 0.1], [7, 0.2], [12, 0.3], [7, 0.42], [12, 0.52]];
    seq.forEach(([n, at]) => tone(b, { at, freq: semi(523.25, n), dur: 0.16, peak: 0.05, type: 'square', lp: 4200 }));
    [0, 4, 7, 12].forEach(n => tone(b, { at: 0.66, freq: semi(523.25, n), dur: 0.7, peak: 0.03, type: 'sawtooth', lp: 3400 }));
    sweep(b, { at: 0.64, dur: 0.6, peak: 0.03, from: 3000, to: 10000, q: 1 });
  },
};
