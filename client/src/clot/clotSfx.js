import { sfxBus } from '../audio';
import { sfxEnabled } from '../minigameSfx';

/**
 * Clot Cascade's own sounds — a wet, enzymatic lab, not a game show.
 *
 * Synthesised with Web Audio (no files), routed through audio.js's bus so the
 * app's volume and mute govern them, and through the minigames' shared on/off
 * (SfxToggle) so one switch silences every study mode.
 *
 * Built only for this game: the enzyme "zap" whose pitch climbs one step per
 * level of the cascade (so finishing the cascade plays an ascending run), the
 * thrombin burst, the fibrin web crystallising, the drug shield clamp, the
 * blood drip, the heartbeat that speeds up as the patient bleeds, the
 * plasmin dissolve and the "clot sealed" chord.
 */

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

function osc(b, { at = 0, freq, to = null, dur = 0.2, peak = 0.08, type = 'sine', attack = 0.005, lp = null, q = 1 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + dur);
  const g = c.createGain();
  env(g, t, peak, attack, dur);
  let n = o;
  if (lp) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lp; f.Q.value = q;
    n = o.connect(f);
  }
  n.connect(g).connect(out);
  o.start(t); o.stop(t + attack + dur + 0.05);
}

function noise(b, { at = 0, dur = 0.1, peak = 0.05, type = 'bandpass', freq = 1500, to = null, q = 1, attack = 0.004 }) {
  const { c, out } = b;
  const t = c.currentTime + at;
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + attack + dur);
  const g = c.createGain();
  env(g, t, peak, attack, dur);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 0.8);
  s.stop(t + attack + dur + 0.05);
}

const play = (fn) => {
  if (!sfxEnabled()) return;
  const b = sfxBus();
  if (!b) return;
  try { fn(b); } catch { /* audio is a nicety */ }
};

// A pentatonic ladder the cascade climbs, one rung per activation.
const LADDER = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7];

export const clotSfx = {
  /** Tapping a factor tile: a soft gel "blip". */
  pick: () => play(b => {
    osc(b, { freq: 520, to: 780, dur: 0.07, peak: 0.06, type: 'sine', attack: 0.003 });
    noise(b, { dur: 0.04, peak: 0.02, freq: 3000, q: 4 });
  }),

  /** A factor activates: a zappy enzyme spark whose pitch climbs with `step`. */
  activate: (step = 0) => play(b => {
    const f = LADDER[Math.min(step, LADDER.length - 1)];
    osc(b, { freq: f * 2, to: f, dur: 0.09, peak: 0.05, type: 'square', lp: 2600, attack: 0.002 });
    osc(b, { at: 0.03, freq: f, dur: 0.32, peak: 0.07, type: 'triangle', attack: 0.004 });
    osc(b, { at: 0.03, freq: f * 1.5, dur: 0.25, peak: 0.025, type: 'sine' });
    noise(b, { dur: 0.08, peak: 0.03, type: 'highpass', freq: 5000, q: 0.6 });
  }),

  /** Thrombin is made: a deep burst with a rising shimmer. */
  thrombin: () => play(b => {
    osc(b, { freq: 120, to: 55, dur: 0.45, peak: 0.16, type: 'sine', attack: 0.004 });
    noise(b, { dur: 0.35, peak: 0.05, type: 'lowpass', freq: 600, to: 200 });
    [784, 987.8, 1174.7, 1568].forEach((f, i) =>
      osc(b, { at: 0.08 + i * 0.05, freq: f, dur: 0.4, peak: 0.03, type: 'triangle' }));
  }),

  /** The fibrin web crystallising: a glassy upward arpeggio with sparkle. */
  fibrin: () => play(b => {
    [1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => {
      osc(b, { at: i * 0.06, freq: f, dur: 0.5, peak: 0.035, type: 'sine', attack: 0.002 });
      osc(b, { at: i * 0.06, freq: f * 2.01, dur: 0.2, peak: 0.01, type: 'sine', attack: 0.002 });
    });
    noise(b, { at: 0.05, dur: 0.5, peak: 0.02, type: 'highpass', freq: 8000, q: 0.5 });
  }),

  /** Clot sealed / round won: a warm chord with a heartbeat settling. */
  sealed: () => play(b => {
    [261.6, 329.6, 392, 523.3].forEach(f => osc(b, { freq: f, dur: 1.1, peak: 0.04, type: 'triangle', attack: 0.04 }));
    osc(b, { at: 0.15, freq: 1046.5, to: 1568, dur: 0.5, peak: 0.025, type: 'sine' });
    for (const at of [0.5, 0.68]) osc(b, { at, freq: 70, to: 45, dur: 0.14, peak: 0.14, type: 'sine', attack: 0.004 });
  }),

  /** Wrong: a blood drip — a pitched droplet "plip" falling into a pool. */
  drip: () => play(b => {
    osc(b, { freq: 1400, to: 380, dur: 0.11, peak: 0.09, type: 'sine', attack: 0.002 });
    osc(b, { at: 0.13, freq: 900, to: 1700, dur: 0.08, peak: 0.05, type: 'sine', attack: 0.002 });
    noise(b, { at: 0.12, dur: 0.12, peak: 0.03, freq: 900, q: 2 });
    osc(b, { at: 0.02, freq: 180, to: 90, dur: 0.18, peak: 0.07, type: 'sawtooth', lp: 500 });
  }),

  /** A drug clamps onto its target: a magnetic "shield" clunk with a hum. */
  shield: () => play(b => {
    osc(b, { freq: 200, to: 90, dur: 0.12, peak: 0.12, type: 'square', lp: 900, attack: 0.002 });
    noise(b, { dur: 0.06, peak: 0.06, freq: 2400, q: 3 });
    osc(b, { at: 0.06, freq: 330, dur: 0.45, peak: 0.03, type: 'sawtooth', lp: 1400 });
    osc(b, { at: 0.06, freq: 333, dur: 0.45, peak: 0.03, type: 'sawtooth', lp: 1400 });
  }),

  /** Plasmin dissolving a clot (tPA): a falling, fizzing wash. */
  dissolve: () => play(b => {
    noise(b, { dur: 0.7, peak: 0.05, freq: 4000, to: 400, q: 1.5, attack: 0.05 });
    [1568, 1318.5, 1046.5, 784].forEach((f, i) => osc(b, { at: i * 0.09, freq: f, dur: 0.25, peak: 0.025, type: 'sine' }));
  }),

  /** One heartbeat (lub-dub). Faster/louder as the patient bleeds. */
  beat: (urgency = 0) => play(b => {
    const p = 0.07 + urgency * 0.08;
    osc(b, { freq: 64, to: 42, dur: 0.11, peak: p, type: 'sine', attack: 0.004 });
    osc(b, { at: 0.16, freq: 78, to: 50, dur: 0.09, peak: p * 0.7, type: 'sine', attack: 0.004 });
  }),

  /** Streak / combo: bubbling platelet pops. */
  combo: (n = 3) => play(b => {
    for (let i = 0; i < Math.min(n, 6); i++) {
      osc(b, { at: i * 0.05, freq: 500 + i * 140, to: 900 + i * 200, dur: 0.05, peak: 0.05, type: 'sine', attack: 0.002 });
    }
  }),

  /** Patient crashed / time out: a long flatline tone. */
  flatline: () => play(b => {
    osc(b, { freq: 880, dur: 1.2, peak: 0.04, type: 'sine', attack: 0.02 });
    osc(b, { freq: 110, to: 55, dur: 0.9, peak: 0.08, type: 'sine', attack: 0.01 });
  }),

  /** Flipping a pearl card: a paper whisk. */
  flip: () => play(b => noise(b, { dur: 0.09, peak: 0.04, freq: 2500, to: 5000, q: 0.8 })),
};
