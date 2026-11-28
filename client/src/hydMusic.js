import { sfxBus } from './audio';

/**
 * HY Diseases Qbank background music: "Night Shift", an upbeat synth loop
 * made live with Web Audio (nothing to download). A plucked arpeggio over
 * Am → F → C → G, a round bass that thumps like a heartbeat (lub-dub), a soft
 * kick and a shaker. Bright enough to keep a block moving, quiet enough to
 * read over.
 *
 * Routed through audio.js's output bus, so the app's volume and mute govern
 * it. Its own on/off is remembered per device.
 */

const KEY = 'mv_hyd_music';
export const hydMusicPref = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
export const setHydMusicPref = (on) => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* not remembered */ } };

const BPM = 104;
const SIX = 60 / BPM / 4;              // a sixteenth note
// Two bars per chord, 8 bars per loop.
const PROG = [
  { root: 45, notes: [57, 60, 64, 69] },   // Am: A C E A
  { root: 41, notes: [57, 60, 65, 69] },   // F:  A C F A
  { root: 48, notes: [55, 60, 64, 67] },   // C:  G C E G
  { root: 43, notes: [55, 59, 62, 67] },   // G:  G B D G
];
// Arpeggio order across a bar of sixteenths (indexes into notes, +12 = octave up).
const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 3, 15, 3, 2, 1, 2];
// A short hook on top every other bar, as [sixteenth, midi].
const HOOK = [[0, 76], [3, 74], [6, 72], [10, 74], [12, 76]];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function noiseBuffer(c, seconds) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function createHydMusic() {
  let bus = null, master = null, timer = null, nextT = 0, step = 0;

  function pluck(t, midi, vel, len = 0.22, type = 'triangle') {
    const { c } = bus;
    const o = c.createOscillator(); o.type = type; o.frequency.value = hz(midi);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    o.connect(g); g.connect(lp); lp.connect(master);
    o.start(t); o.stop(t + len + 0.05);
  }

  function bass(t, midi, vel, len) {
    const { c } = bus;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz(midi);
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz(midi);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    o.connect(g); o2.connect(g); g.connect(lp); lp.connect(master);
    o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
  }

  function kick(t, vel = 0.24) {
    const { c } = bus;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    const g = c.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
  }

  function shaker(t, vel) {
    const { c } = bus;
    const s = c.createBufferSource(); s.buffer = bus.short;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = c.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(hp); hp.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.08);
  }

  function pad(t, notes, len) {
    const { c } = bus;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.018, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
    g.connect(lp); lp.connect(master);
    notes.forEach((n) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = (Math.random() - 0.5) * 14;
      o.connect(g); o.start(t); o.stop(t + len + 0.05);
    });
  }

  function schedule(t) {
    const s = step % 128;                    // 8 bars of 16
    const bar = Math.floor(s / 16), inBar = s % 16;
    const ch = PROG[Math.floor(bar / 2)];
    // Arpeggio
    const idx = ARP[inBar];
    const note = idx >= 12 ? ch.notes[idx - 12] + 12 : ch.notes[idx];
    pluck(t, note, inBar % 4 === 0 ? 0.05 : 0.032, 0.2);
    // Pad on each chord change
    if (inBar === 0 && bar % 2 === 0) pad(t, ch.notes.slice(0, 3), SIX * 32);
    // Heartbeat bass: lub (1), dub (the "a" of 1), again on beat 3
    if (inBar === 0 || inBar === 8) bass(t, ch.root - 12, 0.2, 0.28);
    if (inBar === 3 || inBar === 11) bass(t, ch.root - 12, 0.12, 0.2);
    // Drums
    if (inBar === 0 || inBar === 8) kick(t);
    if (inBar === 4 || inBar === 12) kick(t, 0.08);
    if (inBar % 2 === 1) shaker(t, inBar % 4 === 3 ? 0.05 : 0.028);
    // Hook every other bar, half the loop
    if (bar % 2 === 1 && bar >= 4) {
      for (const [at, m] of HOOK) if (at === inBar) pluck(t, m, 0.045, 0.32, 'sine');
    }
    step++;
  }

  function tick() {
    const { c } = bus;
    while (nextT < c.currentTime + 0.2) { schedule(nextT); nextT += SIX; }
  }

  return {
    get playing() { return !!timer; },
    start() {
      if (timer) return;
      bus = sfxBus();
      if (!bus) return;                       // the app is muted
      const { c, out } = bus;
      if (c.state === 'suspended') c.resume().catch(() => {});
      bus.short = noiseBuffer(c, 0.1);
      master = c.createGain();
      master.gain.setValueAtTime(0.0001, c.currentTime);
      master.gain.exponentialRampToValueAtTime(0.45, c.currentTime + 2);   // fade in
      master.connect(out);
      nextT = c.currentTime + 0.1; step = 0;
      timer = setInterval(tick, 50);
      tick();
    },
    stop() {
      if (!timer) return;
      clearInterval(timer); timer = null;
      const m = master, c = bus?.c;
      if (m && c) {
        m.gain.cancelScheduledValues(c.currentTime);
        m.gain.setValueAtTime(Math.max(0.0001, m.gain.value), c.currentTime);
        m.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
        setTimeout(() => { try { m.disconnect(); } catch { /* gone */ } }, 600);
      }
    },
  };
}
