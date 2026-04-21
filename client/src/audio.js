let ctx = null;
let muted = false;
let bgGain = null;
let bgNodes = [];
let gameGain = null;
let gameNodes = [];

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }

export function setMuted(val) {
  muted = val;
  if (bgGain) bgGain.gain.value = val ? 0 : 0.04;
  if (gameGain) gameGain.gain.value = val ? 0 : 0.05;
}

export function playClick() {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gn = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.02);
  gn.gain.setValueAtTime(0.15, c.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.02);
  osc.connect(gn);
  gn.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.02);
}

// ── Quiz-show step sequencer ───────────────────────────────────────────────────

// Shared noise buffer (generated once, reused for all percussion)
let noiseBuffer = null;
function getNoiseBuf(c) {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 0.5);
  noiseBuffer = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function schedNote(c, dest, freq, type, vol, t, dur) {
  const osc = c.createOscillator();
  const gn = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gn); gn.connect(dest);
  osc.start(t); osc.stop(t + dur + 0.01);
}

function schedNoise(c, dest, vol, t, dur, hpFreq) {
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gn = c.createGain();
  filter.type = 'highpass';
  filter.frequency.value = hpFreq;
  src.buffer = getNoiseBuf(c);
  src.start(t); src.stop(t + dur);
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter); filter.connect(gn); gn.connect(dest);
}

// Quiz-show melody & bass patterns (16 steps = 2 bars of 8th notes)
// Key: C major   BPM: game=132, lobby=98
const MELODY_FREQS = [
  523.25, null, 659.25, null, 783.99, 659.25, 523.25, null,
  587.33, null, 698.46, null, 880.00, 783.99, 659.25, null,
];
const BASS_FREQS = [
  130.81, 164.81, 98.00, 123.47,
  130.81, null,   98.00, 123.47,
  110.00, 164.81, 110.00, 146.83,
  87.31,  110.00, 130.81, null,
];

function startSequencer(gainNode, bpm, withDrums) {
  const c = getCtx();
  const STEP = 60 / bpm / 2; // 8th-note duration in seconds
  let step = 0;

  const interval = setInterval(() => {
    if (!gainNode) return;
    const t = c.currentTime + 0.01; // small lookahead
    const s = step % 16;

    // Melody (triangle — bright, quiz-show feel)
    const mf = MELODY_FREQS[s];
    if (mf) schedNote(c, gainNode, mf, 'triangle', 0.28, t, STEP * 0.9);

    // Bass (sine — bouncy)
    const bf = BASS_FREQS[s];
    if (bf) schedNote(c, gainNode, bf, 'sine', 0.55, t, STEP * 0.8);

    if (withDrums) {
      // Kick on beats 1 & 3 (steps 0, 8)
      if (s === 0 || s === 8) {
        const ok = c.createOscillator();
        const gk = c.createGain();
        ok.type = 'sine';
        ok.frequency.setValueAtTime(130, t);
        ok.frequency.exponentialRampToValueAtTime(42, t + 0.1);
        gk.gain.setValueAtTime(0.9, t);
        gk.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        ok.connect(gk); gk.connect(gainNode);
        ok.start(t); ok.stop(t + 0.14);
      }

      // Snare on beats 2 & 4 (steps 4, 12)
      if (s === 4 || s === 12) {
        schedNoise(c, gainNode, 0.45, t, 0.1, 800);
      }

      // Hi-hat every 8th note (all steps), very quiet
      schedNoise(c, gainNode, 0.1, t, 0.035, 7000);
    }

    step++;
  }, STEP * 1000);

  return interval;
}

let bgInterval = null;

export function startBgMusic() {
  stopGameMusic();
  stopBgMusic();
  if (muted) return;
  const c = getCtx();
  bgGain = c.createGain();
  bgGain.gain.value = 0.04; // quieter for lobby
  bgGain.connect(c.destination);
  bgInterval = startSequencer(bgGain, 98, false); // slow, no drums
}

export function stopBgMusic() {
  if (bgInterval) { clearInterval(bgInterval); bgInterval = null; }
  bgNodes.forEach(({ osc, lfo }) => {
    try { osc.stop(); } catch (_) {}
    try { lfo.stop(); } catch (_) {}
  });
  bgNodes = [];
  if (bgGain) { bgGain.disconnect(); bgGain = null; }
}

export function startGameMusic() {
  stopBgMusic();
  stopGameMusic();
  if (muted) return;
  const c = getCtx();
  gameGain = c.createGain();
  gameGain.gain.value = 0.055; // full energy
  gameGain.connect(c.destination);
  gameNodes = [{ interval: startSequencer(gameGain, 132, true) }];
}

export function stopGameMusic() {
  gameNodes.forEach(({ interval, osc, lfo }) => {
    if (interval) clearInterval(interval);
    try { if (osc) osc.stop(); } catch (_) {}
    try { if (lfo) lfo.stop(); } catch (_) {}
  });
  gameNodes = [];
  if (gameGain) { gameGain.disconnect(); gameGain = null; }
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
