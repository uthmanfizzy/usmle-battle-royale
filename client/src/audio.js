let ctx = null;
let muted = false;
let bgGain = null;
let bgNodes = [];

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }

export function setMuted(val) {
  muted = val;
  if (bgGain) bgGain.gain.value = val ? 0 : 0.04;
}

export function startBgMusic() {
  stopBgMusic();
  if (muted) return;
  const c = getCtx();
  bgGain = c.createGain();
  bgGain.gain.value = 0.04;
  bgGain.connect(c.destination);

  // Ambient drone: A minor chord (A3, C4, E4, A4) with slow LFO
  const freqs = [220, 261.6, 329.6, 440];
  bgNodes = freqs.map((freq, i) => {
    const osc = c.createOscillator();
    const gn  = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gn.gain.value = 0.5 / (i + 1);
    osc.connect(gn);
    gn.connect(bgGain);
    osc.start();

    const lfo = c.createOscillator();
    const lg  = c.createGain();
    lfo.frequency.value = 0.2 + i * 0.07;
    lg.gain.value = 2;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start();

    return { osc, lfo };
  });
}

export function stopBgMusic() {
  bgNodes.forEach(({ osc, lfo }) => {
    try { osc.stop(); } catch (_) {}
    try { lfo.stop(); } catch (_) {}
  });
  bgNodes = [];
  if (bgGain) { bgGain.disconnect(); bgGain = null; }
}

export function playCorrect() {
  if (muted) return;
  const c = getCtx();
  [523.3, 659.3, 783.9, 1046.5].forEach((freq, i) => {
    const t = c.currentTime + i * 0.1;
    const osc = c.createOscillator();
    const gn  = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gn.gain.setValueAtTime(0.25, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gn);
    gn.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

export function playWrong() {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gn  = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.5);
  gn.gain.setValueAtTime(0.3, c.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
  osc.connect(gn);
  gn.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.5);
}

export function playTick() {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gn  = c.createGain();
  osc.type = 'square';
  osc.frequency.value = 1200;
  gn.gain.setValueAtTime(0.12, c.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  osc.connect(gn);
  gn.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.06);
}

export function playVictory() {
  if (muted) return;
  const c = getCtx();
  const notes = [523.3, 523.3, 523.3, 415.3, 523.3, 622.3, 783.9];
  const durs  = [0.12,  0.12,  0.12,  0.09,  0.12,  0.12,  0.55];
  let t = c.currentTime + 0.05;
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gn  = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gn.gain.setValueAtTime(0.3, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + durs[i]);
    osc.connect(gn);
    gn.connect(c.destination);
    osc.start(t);
    osc.stop(t + durs[i]);
    t += durs[i];
  });
}

export function playEliminated() {
  if (muted) return;
  const c = getCtx();
  const notes = [392, 370, 349, 294];
  let t = c.currentTime + 0.05;
  notes.forEach(freq => {
    const osc = c.createOscillator();
    const gn  = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gn.gain.setValueAtTime(0.22, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(gn);
    gn.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.38);
    t += 0.32;
  });
}
