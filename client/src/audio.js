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

// ── "The Arena" — tournament theme ──────────────────────────────────────────
// The competitive modes used a bright quiz-show sequencer: triangle melody,
// sine bass, a polite hi-hat. Fine for a quiz, wrong for a tournament. This
// replaces it with something that sounds like an entrance: taiko-ish drums,
// a low brass swell, a driving string ostinato and a horn theme over a D
// minor progression.
//
// Everything is synthesised — there are no audio files in this project and a
// tournament theme is not worth a megabyte of download. The "orchestra" is:
//   brass    detuned sawtooth pair through a lowpass that opens on the note
//   strings  short sawtooth stabs, high-passed, played as an 8th-note engine
//   choir    sine + triangle stack with slow vibrato, swelling across a bar
//   taiko    pitch-dropping sine with a noise transient
//   cymbal   filtered noise swelling into the downbeat of a new section
//
// 16 bars at 140 BPM (~27s):
//   0–3   entrance   drums and bass only, cymbal swell into
//   4–7   theme      horns take the melody
//   8–11  turn       the progression lifts to Gm, strings double time
//   12–15 climax     full stack, long held A, cymbal into the loop
const ARENA_BPM = 140;
const ARENA_STEP = 60 / ARENA_BPM / 4;   // one 16th note, in seconds

// [bass root, chord tones] per bar: Dm Bb F C | Dm Bb F C | Gm Dm Bb C | Dm Bb F A
const ARENA_BARS = [
  [38, [50, 53, 57]], [34, [46, 50, 53]], [41, [45, 48, 53]], [36, [43, 48, 52]],
  [38, [50, 53, 57]], [34, [46, 50, 53]], [41, [45, 48, 53]], [36, [43, 48, 52]],
  [43, [43, 46, 50]], [38, [50, 53, 57]], [34, [46, 50, 53]], [36, [43, 48, 52]],
  [38, [50, 53, 57]], [34, [46, 50, 53]], [41, [45, 48, 53]], [33, [45, 49, 52]],
];

// Horn theme: bar -> [[step, midi, length in 16ths], ...]
const ARENA_HORNS = {
  4:  [[0, 62, 4], [4, 65, 4], [8, 69, 8]],
  5:  [[0, 67, 6], [6, 65, 2], [8, 62, 8]],
  6:  [[0, 65, 4], [4, 69, 4], [8, 72, 8]],
  7:  [[0, 69, 8], [8, 67, 4], [12, 65, 4]],
  8:  [[0, 70, 6], [6, 69, 2], [8, 67, 8]],
  9:  [[0, 69, 4], [4, 65, 4], [8, 62, 8]],
  10: [[0, 65, 6], [6, 69, 2], [8, 70, 8]],
  11: [[0, 72, 8], [8, 71, 8]],
  12: [[0, 69, 4], [4, 69, 2], [6, 67, 2], [8, 65, 4], [12, 64, 4]],
  13: [[0, 62, 8], [8, 65, 4], [12, 69, 4]],
  14: [[0, 72, 6], [6, 69, 2], [8, 67, 8]],
  15: [[0, 69, 16]],
};

// Where the 8th-note string engine runs, and where it doubles to 16ths.
const ARENA_STRINGS_FROM = 4;
const ARENA_STRINGS_DOUBLE = [8, 9, 10, 11, 14, 15];

let arenaSawWave = null;
let arenaSawCtx = null;
// A sawtooth with the top partials rolled off — closer to a bowed string than
// the raw 'sawtooth' type, which is harsh at these volumes.
function getArenaSaw(c) {
  if (arenaSawWave && arenaSawCtx === c) return arenaSawWave;
  const N = 24;
  const real = new Float32Array(N), imag = new Float32Array(N);
  for (let k = 1; k < N; k++) imag[k] = (1 / k) * (1 - (k - 1) / N);
  arenaSawWave = c.createPeriodicWave(real, imag);
  arenaSawCtx = c;
  return arenaSawWave;
}

/** Brass/strings: two detuned saws through a lowpass that opens on attack. */
function arenaBrass(c, dest, { freq, t, dur, vol, detune = 7, open = 2600, attack = 0.05 }) {
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(Math.max(220, freq * 1.4), t);
  filter.frequency.linearRampToValueAtTime(open, t + Math.min(0.18, dur * 0.5));
  filter.frequency.linearRampToValueAtTime(Math.max(300, freq * 2), t + dur);

  const gn = c.createGain();
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + attack);
  gn.gain.setValueAtTime(vol, t + Math.max(attack, dur * 0.72));
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  for (const cents of [-detune, detune]) {
    const osc = c.createOscillator();
    osc.setPeriodicWave(getArenaSaw(c));
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(filter);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  filter.connect(gn); gn.connect(dest);
}

/** Choir-ish pad: a sine/triangle stack that swells and fades across a bar. */
function arenaPad(c, dest, { freq, t, dur, vol }) {
  const gn = c.createGain();
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  for (const [mult, type, g] of [[1, 'sine', 1], [2, 'triangle', 0.32], [3, 'sine', 0.16]]) {
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    osc.detune.value = (mult === 1 ? 0 : 5);
    og.gain.value = g;
    osc.connect(og); og.connect(gn);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  gn.connect(dest);
}

/** Taiko: a short pitch drop with a noise transient on top. */
function arenaTaiko(c, dest, { t, vol, from = 160, to = 48, dur = 0.42 }) {
  const osc = c.createOscillator();
  const gn = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.4);
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gn); gn.connect(dest);
  osc.start(t); osc.stop(t + dur + 0.02);
  schedNoise(c, dest, vol * 0.28, t, 0.045, 1200);
}

/** Cymbal swell into the next section. */
function arenaSwell(c, dest, t, dur, vol) {
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gn = c.createGain();
  src.buffer = getNoiseBuf(c);
  src.loop = true;
  filter.type = 'bandpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(900, t);
  filter.frequency.exponentialRampToValueAtTime(7000, t + dur);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + dur * 0.9);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
  src.connect(filter); filter.connect(gn); gn.connect(dest);
  src.start(t); src.stop(t + dur + 0.3);
}

/**
 * Schedule the whole theme on a 16th-note clock.
 *
 * `lobby` mode is the same music with the drums and the string engine pulled
 * out and the tempo left alone — the waiting room sounds like the arena next
 * door rather than a different building.
 */
function startArena(gainNode, { lobby = false } = {}) {
  const c = getCtx();
  let step = 0;

  const tick = () => {
    if (!gainNode) return;
    const t = c.currentTime + 0.02;
    const bar = Math.floor(step / 16) % 16;
    const s = step % 16;
    const [root, pad] = ARENA_BARS[bar];
    const section = Math.floor(bar / 4);        // 0 entrance, 1 theme, 2 turn, 3 climax

    // Pad: once a bar, swelling under everything.
    if (s === 0) {
      for (const n of pad) {
        arenaPad(c, gainNode, {
          freq: midi(n), t, dur: ARENA_STEP * 16,
          vol: (lobby ? 0.1 : 0.075) * (section === 0 ? 0.7 : 1),
        });
      }
    }

    // Bass: root on 1, octave pickup on the and-of-3 — the push that makes it
    // feel like it is going somewhere.
    if (s === 0) arenaBrass(c, gainNode, { freq: midi(root - 12), t, dur: ARENA_STEP * 9, vol: 0.3, open: 900, attack: 0.02 });
    if (s === 10) arenaBrass(c, gainNode, { freq: midi(root - 12), t, dur: ARENA_STEP * 5, vol: 0.22, open: 800, attack: 0.02 });

    // Strings: the engine. 8ths from bar 4, 16ths where the arrangement lifts.
    if (!lobby && bar >= ARENA_STRINGS_FROM) {
      const double = ARENA_STRINGS_DOUBLE.includes(bar);
      if (double || s % 2 === 0) {
        const tone = pad[(s / (double ? 1 : 2)) % pad.length];
        arenaBrass(c, gainNode, {
          freq: midi(tone + 12), t, dur: ARENA_STEP * (double ? 0.8 : 1.5),
          vol: 0.085, open: 3400, attack: 0.012, detune: 10,
        });
      }
    }

    // Horns: the theme itself.
    const phrase = ARENA_HORNS[bar];
    if (phrase && !lobby) {
      for (const [at, note, len] of phrase) {
        if (at !== s) continue;
        arenaBrass(c, gainNode, {
          freq: midi(note), t, dur: ARENA_STEP * len * 0.96,
          vol: 0.2, open: 3000, attack: 0.055, detune: 9,
        });
        // Octave below, quieter — one horn sounds thin, two sound like a section.
        arenaBrass(c, gainNode, {
          freq: midi(note - 12), t, dur: ARENA_STEP * len * 0.96,
          vol: 0.09, open: 1800, attack: 0.06, detune: 6,
        });
      }
    }

    if (!lobby) {
      // Taiko: 1 and the and-of-3, with doubles once the theme is running.
      if (s === 0) arenaTaiko(c, gainNode, { t, vol: 0.85 });
      if (s === 6) arenaTaiko(c, gainNode, { t, vol: 0.5, from: 150 });
      if (s === 10 && bar >= 4) arenaTaiko(c, gainNode, { t, vol: 0.6 });
      if (s === 14 && section >= 2) arenaTaiko(c, gainNode, { t, vol: 0.4, from: 140 });

      // Backbeat from the theme on, and a tambourine-ish 8th for drive.
      if (bar >= 4 && (s === 4 || s === 12)) schedNoise(c, gainNode, 0.3, t, 0.12, 1400);
      if (bar >= 8 && s % 2 === 0) schedNoise(c, gainNode, 0.07, t, 0.03, 8000);

      // Fill across the last half-bar of each section.
      if (s >= 12 && bar % 4 === 3 && section >= 1) {
        arenaTaiko(c, gainNode, { t, vol: 0.35 + (s - 12) * 0.08, from: 120 + (s - 12) * 30, dur: 0.2 });
      }
    }

    // Cymbal swell into every new section.
    if (s === 8 && bar % 4 === 3) {
      arenaSwell(c, gainNode, t, ARENA_STEP * 8, lobby ? 0.05 : 0.11);
    }

    step++;
  };

  tick();
  return setInterval(tick, ARENA_STEP * 1000);
}

let bgInterval = null;

export function startBgMusic() {
  stopGameMusic();
  stopBgMusic();
  if (muted) return;
  const c = getCtx();
  bgGain = c.createGain();
  bgGain.gain.value = 0.07; // quieter for lobby
  bgGain.connect(c.destination);
  // Same theme as the match, with the drums and the string engine out: the
  // waiting room sounds like the arena next door.
  bgInterval = startArena(bgGain, { lobby: true });
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
  gameGain.gain.value = 0.09625; // full energy
  gameGain.connect(c.destination);
  gameNodes = [{ interval: startArena(gameGain) }];
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

// A brass fanfare in the arena theme's own key (D minor, landing on the
// major chord): horns, a taiko hit under each note and a cymbal on the last
// one. The old triangle-beep version belonged to the quiz-show music that is
// no longer there.
export function playVictory() {
  if (muted) return;
  const c = getCtx();
  // [midi, length in seconds]
  const line = [[69, 0.16], [69, 0.16], [69, 0.16], [72, 0.5], [71, 0.22], [72, 0.22], [74, 0.95]];
  let t = c.currentTime + 0.05;
  line.forEach(([note, dur], i) => {
    arenaBrass(c, c.destination, { freq: midi(note), t, dur, vol: 0.15, open: 3400, attack: 0.035 });
    arenaBrass(c, c.destination, { freq: midi(note - 12), t, dur, vol: 0.075, open: 1900, attack: 0.04 });
    if (i === line.length - 1) {
      // Final chord: the fifth and the third above the held note.
      arenaBrass(c, c.destination, { freq: midi(note + 4), t, dur, vol: 0.07, open: 3000, attack: 0.05 });
      arenaBrass(c, c.destination, { freq: midi(note + 7), t, dur, vol: 0.06, open: 3000, attack: 0.05 });
      arenaSwell(c, c.destination, t, 0.3, 0.06);
    }
    arenaTaiko(c, c.destination, { t, vol: i === line.length - 1 ? 0.45 : 0.22 });
    t += dur;
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
