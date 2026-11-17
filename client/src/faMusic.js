import { sfxBus } from './audio';

/**
 * FA Images' study music: a quiet lo-fi "reading room" loop, made live with
 * Web Audio — electric-piano chords, a round bass, a brushed hat on the
 * offbeats, vinyl crackle and rain against the window. Nothing to download.
 *
 * Routed through audio.js's output bus, so the app's volume and mute govern
 * it; it has its own on/off too, remembered per device (someone in a library
 * may want the effects but not the music).
 */

const KEY = 'mv_fa_music';
export const musicPref = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
export const setMusicPref = (on) => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* not remembered */ } };

const BPM = 74;
const BEAT = 60 / BPM;
// Fmaj9 → Em7 → Dm9 → Cmaj7(add9), two bars each — a slow, warm turnaround.
const PROG = [
  { bass: 41, notes: [57, 60, 64, 67] },   // F: A C E G
  { bass: 40, notes: [55, 59, 62, 67] },   // Em7: G B D G
  { bass: 38, notes: [57, 60, 64, 65] },   // Dm9: A C E F
  { bass: 36, notes: [55, 59, 62, 64] },   // Cmaj7add9: G B D E
];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function noiseBuffer(c, seconds) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function createFaMusic() {
  let bus = null, master = null, timer = null, nextT = 0, step = 0, beds = [];

  function keys(t, midi, vel, len) {
    const { c } = bus;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.02);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    g.connect(lp); lp.connect(master);
    // A sine plus a quiet bell partial: the electric-piano colour.
    [[1, 1], [2, 0.18], [3.01, 0.05]].forEach(([mul, amt]) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz(midi) * mul;
      const og = c.createGain(); og.gain.value = amt;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + len + 0.05);
    });
  }

  function bass(t, midi, len) {
    const { c } = bus;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(midi);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    o.connect(g); g.connect(lp); lp.connect(master);
    o.start(t); o.stop(t + len + 0.05);
  }

  function hat(t, vel) {
    const { c } = bus;
    const s = c.createBufferSource(); s.buffer = bus.short;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500;
    const g = c.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(hp); hp.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.1);
  }

  function kick(t) {
    const { c } = bus;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = c.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
  }

  // One eighth-note step: chords on bar starts (with a soft re-voice on beat
  // 3), bass on 1 and the "and" of 2, hats on the offbeats, a quiet kick.
  function schedule(t) {
    const bar = Math.floor(step / 8), within = step % 8;
    const ch = PROG[Math.floor(bar / 2) % PROG.length];
    if (within === 0) {
      ch.notes.forEach((n, i) => keys(t + i * 0.025, n, 0.055, BEAT * 4.2));   // a gentle strum
    }
    if (within === 4 && bar % 2 === 1) ch.notes.slice(1).forEach((n, i) => keys(t + i * 0.03, n + 12, 0.022, BEAT * 2));
    if (within === 0) bass(t, ch.bass, BEAT * 1.6);
    if (within === 3) bass(t, ch.bass + 7, BEAT * 0.9);
    if (within === 0 || within === 5) kick(t);
    if (within % 2 === 1) hat(t, within === 7 ? 0.05 : 0.03);
    step++;
  }

  function tick() {
    const { c } = bus;
    while (nextT < c.currentTime + 0.25) { schedule(nextT); nextT += BEAT / 2; }
  }

  // The beds that run under it all: vinyl crackle and rain.
  function startBeds() {
    const { c } = bus;
    const rain = c.createBufferSource(); rain.buffer = noiseBuffer(c, 4); rain.loop = true;
    const rf = c.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 1300; rf.Q.value = 0.5;
    const rg = c.createGain(); rg.gain.value = 0.035;
    rain.connect(rf); rf.connect(rg); rg.connect(master); rain.start();

    const crackle = c.createBufferSource();
    const b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0;
    crackle.buffer = b; crackle.loop = true;
    const cg = c.createGain(); cg.gain.value = 0.16;
    const chp = c.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 1800;
    crackle.connect(chp); chp.connect(cg); cg.connect(master); crackle.start();
    beds = [rain, crackle];
  }

  return {
    get playing() { return !!timer; },
    start() {
      if (timer) return;
      bus = sfxBus();
      if (!bus) return;                       // the app is muted
      const { c, out } = bus;
      if (c.state === 'suspended') c.resume().catch(() => {});
      bus.short = noiseBuffer(c, 0.2);
      master = c.createGain();
      master.gain.setValueAtTime(0.0001, c.currentTime);
      master.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 2.5);   // fade in
      master.connect(out);
      startBeds();
      nextT = c.currentTime + 0.1; step = 0;
      timer = setInterval(tick, 90);
      tick();
    },
    stop() {
      if (!timer) return;
      clearInterval(timer); timer = null;
      const m = master, c = bus?.c, old = beds;
      beds = [];
      if (m && c) {
        m.gain.cancelScheduledValues(c.currentTime);
        m.gain.setValueAtTime(Math.max(0.0001, m.gain.value), c.currentTime);
        m.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);   // fade out
        setTimeout(() => { old.forEach(s => { try { s.stop(); } catch { /* already */ } }); try { m.disconnect(); } catch { /* gone */ } }, 700);
      }
    },
  };
}
