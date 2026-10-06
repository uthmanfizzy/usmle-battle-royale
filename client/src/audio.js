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
  if (bgGain) bgGain.gain.value = val ? 0 : 0.07;
  if (gameGain) gameGain.gain.value = val ? 0 : 0.09625;
  if (studyGain) studyGain.gain.value = val ? 0 : STUDY_VOL;
}

// ── HY Flashcards study music — "Quest Log" ─────────────────────────────────
// A cozy lo-fi chiptune loop in the spirit of an RPG overworld / save-room
// theme: game-flavoured, but slow (84 BPM), swung, soft and low-passed so it
// sits under reading instead of pulling focus. Deliberately unlike the bright
// quiz-show sequencer used by the competitive modes.
//
// 16-bar form (~46s) so it doesn't feel like a short nagging loop:
//   bars 0–3   intro      — warm pad, echoing arpeggio, bass, soft beat
//   bars 4–7   theme A    — pulse-wave lead joins
//   bars 8–11  theme B    — answering phrase, a little higher
//   bars 12–15 bridge     — new chords, sparse counter-line, and a quiet
//                            "level-up" chime on the turnaround back to bar 0
const STUDY_VOL = 0.12; // rendered RMS ≈ the old pad track's — quiet, under reading
const STUDY_BPM = 84;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// [bass root, chord tones] per bar. C major: Fmaj7 G6 Em7 Am7 ×3, then
// Dm7 G7 Cmaj7 Am7 for the bridge.
const QL_MAIN = [
  [41, [53, 57, 60, 64]], [43, [55, 59, 62, 64]], [40, [52, 55, 59, 62]], [45, [57, 60, 64, 67]],
];
const QL_BRIDGE = [
  [38, [50, 53, 57, 60]], [43, [55, 59, 62, 65]], [36, [48, 52, 55, 59]], [45, [57, 60, 64, 67]],
];
const QL_CHORDS = [...QL_MAIN, ...QL_MAIN, ...QL_MAIN, ...QL_BRIDGE];

// Lead phrases: [16th-note step, midi note, length in steps]
const QL_LEAD = {
  4:  [[0, 72, 3], [4, 69, 2], [6, 72, 2], [8, 76, 4], [14, 74, 2]],
  5:  [[0, 74, 3], [4, 71, 2], [6, 74, 2], [8, 79, 6]],
  6:  [[0, 76, 2], [2, 74, 2], [4, 71, 4], [10, 74, 2], [12, 76, 4]],
  7:  [[0, 72, 6], [8, 69, 2], [10, 72, 2], [12, 76, 4]],
  8:  [[0, 77, 4], [6, 76, 2], [8, 72, 4], [12, 69, 4]],
  9:  [[0, 71, 2], [2, 74, 2], [4, 79, 4], [10, 76, 2], [12, 74, 4]],
  10: [[0, 71, 6], [8, 67, 2], [10, 71, 2], [12, 74, 4]],
  11: [[0, 76, 8], [10, 72, 2], [12, 69, 4]],
  13: [[8, 74, 2], [10, 77, 2], [12, 79, 4]],
};
// Level-up chime on the last half-bar of the loop.
const QL_CHIME = [[8, 84], [10, 88], [12, 91], [14, 96]];
const QL_ARP = [0, 1, 2, 3, 2, 1, 2, 3];

let studyGain = null;
let studyInterval = null;
let pulseWave = null;
let pulseWaveCtx = null;

// 25% duty pulse — the classic handheld-console lead timbre.
function getPulseWave(c) {
  if (pulseWave && pulseWaveCtx === c) return pulseWave;
  const N = 32, duty = 0.25;
  const real = new Float32Array(N), imag = new Float32Array(N);
  for (let k = 1; k < N; k++) {
    real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  }
  pulseWave = c.createPeriodicWave(real, imag);
  pulseWaveCtx = c;
  return pulseWave;
}

function qlVoice(c, dest, { freq, t, dur, vol, wave, attack = 0.01, release = 0.08, vibrato = 0 }) {
  const osc = c.createOscillator();
  const gn = c.createGain();
  if (wave === 'pulse') osc.setPeriodicWave(getPulseWave(c));
  else osc.type = wave;
  osc.frequency.value = freq;
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + attack);
  gn.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gn); gn.connect(dest);
  let lfo = null;
  if (vibrato) {
    // Delayed vibrato, like a chiptune lead holding a long note.
    lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 5.2;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(freq * vibrato, t + Math.min(0.35, dur));
    lfo.connect(depth); depth.connect(osc.frequency);
    lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  osc.start(t); osc.stop(t + dur + 0.05);
}

export function startStudyMusic() {
  stopBgMusic();
  stopGameMusic();
  stopStudyMusic();
  if (muted) return;
  const c = getCtx();

  // Bus: voices -> warm low-pass -> master gain -> out. Arp and lead also feed
  // a soft dotted-8th echo for space.
  studyGain = c.createGain();
  studyGain.gain.value = STUDY_VOL;
  studyGain.connect(c.destination);
  const tone = c.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;
  tone.Q.value = 0.5;
  tone.connect(studyGain);

  const STEP = 60 / STUDY_BPM / 4;
  const echo = c.createDelay(2);
  echo.delayTime.value = STEP * 3;
  const fb = c.createGain();
  fb.gain.value = 0.32;
  const echoOut = c.createGain();
  echoOut.gain.value = 0.35;
  echo.connect(fb); fb.connect(echo);
  echo.connect(echoOut); echoOut.connect(tone);
  const wet = c.createGain();
  wet.gain.value = 1;
  wet.connect(tone); wet.connect(echo);

  let step = 0;
  let nextTime = c.currentTime + 0.1;

  const scheduleStep = (s, t) => {
    const bar = Math.floor(s / 16) % 16;
    const i = s % 16;
    const [root, chord] = QL_CHORDS[bar];

    // Pad: soft triangle chord, swelling over the bar.
    if (i === 0) {
      chord.forEach(n => qlVoice(c, tone, {
        freq: midi(n), t, dur: STEP * 16, vol: 0.13, wave: 'triangle', attack: 0.6, release: 0.9,
      }));
    }

    // Arpeggio: chord an octave up on 8ths; the intro bars run it at half density.
    if (i % 2 === 0 && (bar >= 4 || i % 4 === 0)) {
      const n = chord[QL_ARP[i / 2]] + 12;
      qlVoice(c, wet, { freq: midi(n), t, dur: STEP * 1.6, vol: 0.07, wave: 'pulse', release: 0.12 });
    }

    // Bass: root, octave bounce, fifth.
    const bassHits = { 0: root, 6: root + 12, 10: root + 7 };
    if (bassHits[i] !== undefined) {
      qlVoice(c, tone, { freq: midi(bassHits[i]), t, dur: STEP * 2.6, vol: 0.34, wave: 'triangle', release: 0.15 });
    }

    // Lead.
    const phrase = QL_LEAD[bar];
    if (phrase) {
      for (const [st, n, len] of phrase) {
        if (st === i) {
          qlVoice(c, wet, {
            freq: midi(n), t, dur: STEP * len * 0.95, vol: 0.1, wave: 'pulse',
            attack: 0.015, release: 0.1, vibrato: len >= 4 ? 0.006 : 0,
          });
        }
      }
    }

    // Level-up chime on the loop turnaround.
    if (bar === 15) {
      for (const [st, n] of QL_CHIME) {
        if (st === i) qlVoice(c, wet, { freq: midi(n), t, dur: STEP * 1.4, vol: 0.05, wave: 'square', release: 0.1 });
      }
    }

    // Soft lo-fi beat — absent for the first two bars so it eases in.
    if (s >= 32) {
      if (i === 0 || i === 10) {
        const k = c.createOscillator();
        const kg = c.createGain();
        k.type = 'sine';
        k.frequency.setValueAtTime(110, t);
        k.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        kg.gain.setValueAtTime(0.5, t);
        kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        k.connect(kg); kg.connect(tone);
        k.start(t); k.stop(t + 0.2);
      }
      if (i === 8) schedNoise(c, tone, 0.12, t, 0.09, 1800);
      if (i % 2 === 0) schedNoise(c, tone, i % 4 === 2 ? 0.035 : 0.02, t, 0.03, 6500);
    }
  };

  // Look-ahead scheduler: timing comes from the audio clock, not setInterval,
  // so the groove doesn't drift or stutter when the tab is busy.
  const pump = () => {
    if (!studyGain) return;
    while (nextTime < c.currentTime + 0.15) {
      // Gentle swing on the off-16ths.
      const swing = step % 2 === 1 ? STEP * 0.12 : 0;
      scheduleStep(step, nextTime + swing);
      nextTime += STEP;
      step++;
    }
  };
  pump();
  studyInterval = setInterval(pump, 30);
}

export function stopStudyMusic() {
  if (studyInterval) { clearInterval(studyInterval); studyInterval = null; }
  if (studyGain) { studyGain.disconnect(); studyGain = null; }
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
  bgGain.gain.value = 0.07; // quieter for lobby (+40%)
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
  gameGain.gain.value = 0.09625; // full energy (+40%)
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
