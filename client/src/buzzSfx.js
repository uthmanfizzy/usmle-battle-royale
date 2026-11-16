import { sfxBus } from './audio';

/**
 * Buzz Fun's own sounds — a hive, not a quiz show.
 *
 * Synthesised with Web Audio (no files) and routed through audio.js's bus, so
 * the app's volume and mute govern them like every other game sound. A bee is
 * a sawtooth around 200 Hz with a fast wobble, so most of these are built
 * from that: a flutter when a card lands, a "bzzt" when you lock in, a sting
 * when you are wrong. Right answers are the one sweet thing — a honey chime.
 *
 * Kept short and soft: they fire on every card of a 30-card match.
 */

function env(g, c, t, peak, attack, release) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

/** A bee: sawtooth through a band-pass, with a wing-beat wobble on pitch. */
function buzz(bus, { at = 0, freq = 210, dur = 0.25, peak = 0.12, wobble = 28, glide = 0, q = 4 }) {
  const { c, out } = bus;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + glide), t + dur);
  const lfo = c.createOscillator();
  lfo.frequency.value = wobble;
  const lfoGain = c.createGain();
  lfoGain.gain.value = freq * 0.06;
  lfo.connect(lfoGain).connect(o.frequency);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * 2.2;
  bp.Q.value = q;
  const g = c.createGain();
  env(g, c, t, peak, 0.015, dur);
  o.connect(bp).connect(g).connect(out);
  o.start(t); lfo.start(t);
  o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}

/** A bell-ish tone: sine plus a quiet octave, quick attack, long tail. */
function bell(bus, { at = 0, freq = 880, dur = 0.5, peak = 0.12 }) {
  const { c, out } = bus;
  const t = c.currentTime + at;
  for (const [mult, amp] of [[1, 1], [2, 0.35], [3.01, 0.12]]) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    const g = c.createGain();
    env(g, c, t, peak * amp, 0.006, dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

/** A short wooden knock. */
function knock(bus, { at = 0, freq = 900, peak = 0.12 }) {
  const { c, out } = bus;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.06);
  const g = c.createGain();
  env(g, c, t, peak, 0.002, 0.07);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.12);
}

const play = (fn) => () => { const bus = sfxBus(); if (bus) { try { fn(bus); } catch { /* audio is a nicety */ } } };

export const buzzSfx = {
  /** A card lands: a bee flies past. */
  card: play((bus) => {
    buzz(bus, { freq: 180, dur: 0.32, peak: 0.07, glide: 120, wobble: 32 });
  }),
  /** Locked in: a short, satisfied bzzt. */
  lock: play((bus) => {
    buzz(bus, { freq: 240, dur: 0.11, peak: 0.1, wobble: 45, q: 3 });
    knock(bus, { at: 0.02, freq: 1300, peak: 0.06 });
  }),
  /** Right: a honey chime, rising. Brighter with a streak. */
  correct: (streak = 1) => play((bus) => {
    const base = 659.25; // E5
    const steps = [1, 1.25, 1.5, 2];        // major arpeggio
    steps.forEach((m, i) => bell(bus, { at: i * 0.07, freq: base * m, dur: 0.45, peak: 0.09 }));
    if (streak >= 3) bell(bus, { at: 0.3, freq: base * 2.5, dur: 0.7, peak: 0.07 });
  })(),
  /** Wrong: stung — a buzz that dives, and a dull thump. */
  wrong: play((bus) => {
    buzz(bus, { freq: 320, dur: 0.38, peak: 0.12, glide: -230, wobble: 60, q: 2.5 });
    knock(bus, { at: 0.04, freq: 160, peak: 0.14 });
  }),
  /** Clock running out: hive ticks, the last one higher. */
  tick: (secondsLeft) => play((bus) => {
    knock(bus, { freq: secondsLeft <= 1 ? 1500 : 1100, peak: 0.09 });
  })(),
  /** Time up, nothing locked: a flat, low buzzer. */
  timeUp: play((bus) => {
    buzz(bus, { freq: 130, dur: 0.45, peak: 0.1, wobble: 20, q: 2 });
  }),
  /** Combo grows: a quick rising swarm. */
  combo: play((bus) => {
    buzz(bus, { freq: 220, dur: 0.28, peak: 0.06, glide: 260, wobble: 38 });
    buzz(bus, { at: 0.05, freq: 330, dur: 0.24, peak: 0.05, glide: 300, wobble: 41 });
  }),
  /** A new topic section: a little three-note fanfare over a passing swarm. */
  section: play((bus) => {
    buzz(bus, { freq: 200, dur: 0.5, peak: 0.05, glide: 160, wobble: 30 });
    [523.25, 659.25, 783.99].forEach((f, i) => bell(bus, { at: 0.12 + i * 0.12, freq: f, dur: 0.5, peak: 0.08 }));
  }),
  /** Next card / vote to skip. */
  skip: play((bus) => { knock(bus, { freq: 700, peak: 0.08 }); knock(bus, { at: 0.07, freq: 1050, peak: 0.08 }); }),
  /** Pause and resume. */
  pause: play((bus) => { bell(bus, { freq: 523.25, dur: 0.25, peak: 0.07 }); bell(bus, { at: 0.1, freq: 392, dur: 0.35, peak: 0.07 }); }),
  resume: play((bus) => { bell(bus, { freq: 392, dur: 0.2, peak: 0.07 }); bell(bus, { at: 0.09, freq: 523.25, dur: 0.3, peak: 0.07 }); }),
};
