import { sfxBus } from './audio';
import { sfxEnabled } from './minigameSfx';

/**
 * FA Trivia's own sounds — a game-show stage, not a study room.
 *
 * Synthesised with Web Audio (no files), routed through audio.js's bus so the
 * app's volume and mute govern them, and through the minigames' shared on/off
 * (SfxToggle) so one switch silences every study mode.
 *
 * Nothing here is borrowed from another mode: the wheel ratchet, cowbell,
 * snare drumroll, brass stab, cash register, sad trombone, air horn,
 * woodblock clock, game-show buzzer, slide whistle, ice glissando and crowd
 * applause are all built only for this stage.
 */

let noiseBuf = null;
function noiseBuffer(c) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 1.5);
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

/** A filtered noise burst — claps, snares, ratchet teeth, cash-drawer rattle. */
function hiss(b, { at = 0, dur = 0.05, peak = 0.1, type = 'bandpass', freq = 2000, q = 1, attack = 0.002 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  env(g, t, peak, attack, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 1.2);
  src.stop(t + attack + dur + 0.05);
}

/** One oscillator note with optional glide, vibrato and low-pass (for brass). */
function note(b, { at = 0, freq, dur = 0.2, peak = 0.1, type = 'sine', glideTo = null, vibrato = 0, vibRate = 6, lp = null, attack = 0.01 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  let lfo = null;
  if (vibrato) {
    lfo = c.createOscillator();
    lfo.frequency.value = vibRate;
    const lg = c.createGain();
    lg.gain.value = vibrato;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t); lfo.stop(t + attack + dur + 0.1);
  }
  const g = c.createGain();
  env(g, t, peak, attack, dur);
  let node = o;
  if (lp) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t); f.Q.value = 1.5;
    f.frequency.exponentialRampToValueAtTime(Math.max(200, lp * 0.5), t + dur);
    node = o.connect(f);
  }
  node.connect(g).connect(out);
  o.start(t); o.stop(t + attack + dur + 0.1);
}

/** A brass chord: detuned sawtooths through a closing low-pass. */
function brass(b, { at = 0, freqs, dur = 0.3, peak = 0.05 }) {
  for (const f of freqs) {
    note(b, { at, freq: f, dur, peak, type: 'sawtooth', lp: 2600, attack: 0.02 });
    note(b, { at, freq: f * 1.006, dur, peak: peak * 0.6, type: 'sawtooth', lp: 2200, attack: 0.025 });
  }
}

/** Cowbell: two square waves at an inharmonic ratio, band-passed. */
function cowbell(b, { at = 0, peak = 0.08 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const f = c.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 2;
  const g = c.createGain();
  env(g, t, peak, 0.002, 0.35);
  f.connect(g).connect(out);
  for (const fr of [540, 800]) {
    const o = c.createOscillator();
    o.type = 'square'; o.frequency.value = fr;
    o.connect(f); o.start(t); o.stop(t + 0.45);
  }
}

/** Woodblock: a very short, hollow band-passed click. */
function woodblock(b, { at = 0, freq = 1200, peak = 0.12 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.6, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.012);
  const f = c.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 8;
  const g = c.createGain();
  env(g, t, peak, 0.001, 0.045);
  o.connect(f).connect(g).connect(out);
  o.start(t); o.stop(t + 0.08);
}

const play = (fn) => {
  if (!sfxEnabled()) return;
  const b = sfxBus();
  if (!b) return;
  try { fn(b); } catch { /* audio is a nicety */ }
};

export const triviaSfx = {
  /** Curtain up: a brass fanfare over a snare hit. */
  intro: () => play(b => {
    hiss(b, { dur: 0.12, peak: 0.08, freq: 1800, q: 0.7 });
    brass(b, { at: 0, freqs: [392, 493.9], dur: 0.12, peak: 0.04 });
    brass(b, { at: 0.13, freqs: [523.3, 659.3], dur: 0.12, peak: 0.04 });
    brass(b, { at: 0.26, freqs: [523.3, 659.3, 784], dur: 0.5, peak: 0.045 });
    hiss(b, { at: 0.26, dur: 0.4, peak: 0.04, type: 'highpass', freq: 6000, q: 0.5 });
  }),

  /** A press on a stage button: a quick cowbell. */
  press: () => play(b => cowbell(b, { peak: 0.05 })),

  /** One tooth of the category wheel's ratchet. `speed` 0..1 brightens it. */
  ratchet: (speed = 1) => play(b => {
    hiss(b, { dur: 0.018, peak: 0.07, freq: 2600 + speed * 1800, q: 6 });
    woodblock(b, { freq: 1800 + speed * 600, peak: 0.03 });
  }),

  /** The wheel lands: a cowbell and a low tom thump. */
  land: () => play(b => {
    cowbell(b, { peak: 0.09 });
    note(b, { freq: 160, glideTo: 80, dur: 0.18, peak: 0.16, type: 'sine', attack: 0.003 });
  }),

  /** A short snare drumroll before the reveal. */
  drumroll: (dur = 0.7) => play(b => {
    const hits = Math.floor(dur / 0.028);
    for (let i = 0; i < hits; i++) {
      const p = 0.02 + (i / hits) * 0.06;
      hiss(b, { at: i * 0.028, dur: 0.03, peak: p, freq: 1700, q: 0.8 });
    }
    hiss(b, { at: dur, dur: 0.18, peak: 0.1, freq: 1500, q: 0.6 });
    hiss(b, { at: dur, dur: 0.5, peak: 0.05, type: 'highpass', freq: 7000, q: 0.4 });
  }),

  /** Right answer: a major brass stab and a slide whistle up. */
  correct: () => play(b => {
    brass(b, { freqs: [523.3, 659.3, 784, 1046.5], dur: 0.32, peak: 0.035 });
    note(b, { at: 0.05, freq: 700, glideTo: 2100, dur: 0.32, peak: 0.07, type: 'sine', vibrato: 14, vibRate: 9 });
  }),

  /** Points banked: a cash register "ka-ching". */
  kaching: () => play(b => {
    hiss(b, { dur: 0.06, peak: 0.07, freq: 3500, q: 3 });           // the drawer lever
    hiss(b, { at: 0.03, dur: 0.12, peak: 0.05, freq: 900, q: 1 });  // the drawer
    for (const [f, a] of [[2637, 0.07], [3520, 0.05], [5274, 0.03]]) {
      note(b, { at: 0.09, freq: f, dur: 0.55, peak: a, type: 'triangle', attack: 0.002 });
    }
  }),

  /** Wrong answer: sad trombone — three steps down and a wobbling last note. */
  wrong: () => play(b => {
    const steps = [311.1, 293.7, 277.2];
    steps.forEach((f, i) => note(b, { at: i * 0.26, freq: f, dur: 0.22, peak: 0.07, type: 'sawtooth', lp: 1100, attack: 0.03 }));
    note(b, { at: 0.8, freq: 261.6, glideTo: 233.1, dur: 0.75, peak: 0.075, type: 'sawtooth', lp: 1000, attack: 0.03, vibrato: 7, vibRate: 5 });
  }),

  /** Time's up: the game-show buzzer. */
  buzzer: () => play(b => {
    note(b, { freq: 110, dur: 0.6, peak: 0.08, type: 'square', lp: 900, attack: 0.005 });
    note(b, { freq: 116.5, dur: 0.6, peak: 0.06, type: 'sawtooth', lp: 900, attack: 0.005 });
  }),

  /** The clock in the last seconds: tick and tock on two woodblocks. */
  tick: (tock = false) => play(b => woodblock(b, { freq: tock ? 820 : 1250, peak: 0.1 })),

  /** Streak milestone: an air horn blast. */
  airhorn: () => play(b => {
    for (const [at, d] of [[0, 0.16], [0.2, 0.45]]) {
      for (const f of [466.2, 587.3, 698.5]) {
        note(b, { at, freq: f, dur: d, peak: 0.03, type: 'sawtooth', lp: 3200, attack: 0.01 });
        note(b, { at, freq: f * 1.012, dur: d, peak: 0.02, type: 'square', lp: 2800, attack: 0.01 });
      }
    }
  }),

  /** 50:50 lifeline: a whoosh down and two pops as options vanish. */
  fifty: () => play(b => {
    hiss(b, { dur: 0.3, peak: 0.06, type: 'bandpass', freq: 3000, q: 1.2, attack: 0.05 });
    note(b, { at: 0.2, freq: 900, glideTo: 220, dur: 0.07, peak: 0.1, type: 'sine', attack: 0.002 });
    note(b, { at: 0.33, freq: 900, glideTo: 220, dur: 0.07, peak: 0.1, type: 'sine', attack: 0.002 });
  }),

  /** Freeze lifeline: an icy glissando of glassy plinks. */
  freeze: () => play(b => {
    [2093, 2637, 3136, 3951, 4699, 3951, 3136].forEach((f, i) => {
      note(b, { at: i * 0.045, freq: f, dur: 0.4, peak: 0.035, type: 'sine', attack: 0.002 });
      note(b, { at: i * 0.045, freq: f * 2.76, dur: 0.15, peak: 0.01, type: 'sine', attack: 0.002 });
    });
  }),

  /** End of the show: crowd applause and a final brass chord. */
  applause: (big = true) => play(b => {
    const claps = big ? 90 : 45;
    for (let i = 0; i < claps; i++) {
      const at = Math.random() * (big ? 2.4 : 1.4);
      hiss(b, { at, dur: 0.03 + Math.random() * 0.02, peak: 0.02 + Math.random() * 0.03, freq: 900 + Math.random() * 1800, q: 1.4 });
    }
    brass(b, { at: 0.05, freqs: big ? [392, 523.3, 659.3, 784] : [392, 466.2, 587.3], dur: 0.7, peak: 0.03 });
  }),
};
