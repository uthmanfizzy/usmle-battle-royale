/**
 * Murmurs — the sound engine.
 *
 * Every heart sound is synthesised from a small spec (murmurData.js), not
 * played from a recording. That is what lets the diagram and the audio agree
 * exactly: both are drawn from the same events and the same envelopes, so
 * the "hill" a student sees between S1 and S2 is the very loudness curve they
 * are hearing.
 *
 * One cycle is laid out like this (seconds from S1):
 *
 *   S1 ──── systole (SYS) ──── S2 ──────── diastole ──────── next S1
 *
 * A buffer holds RESP_BEATS beats — one breath in, one breath out — so that
 * the things that change with breathing can be heard changing: physiological
 * splitting of S2 opens on inspiration, a fixed split (ASD) does not, and a
 * right-sided murmur (tricuspid regurgitation) swells on inspiration.
 *
 * Laptop and phone speakers barely reproduce anything under ~80 Hz, so the
 * thumps carry a harmonic an octave up and the mitral rumble sits a little
 * higher than it would through a real bell. Played through headphones it
 * sounds closer to the ward.
 */

export const HR = 66;                      // beats per minute
export const BEAT = 60 / HR;               // ≈ 0.91 s
export const SYS = 0.33;                   // S1 → A2, seconds
export const DIA = BEAT - SYS;
export const RESP_BEATS = 4;               // beats per breath: 2 in, 2 out
const INSPIRATION = (beat) => (beat % RESP_BEATS) < RESP_BEATS / 2;

// ── Timing of every event in one beat ───────────────────────────────────
/**
 * Where each sound falls in a beat, in seconds from S1. Shared by the audio
 * and the diagram. `insp` picks the inspiratory or expiratory version of
 * anything that moves with breathing.
 */
export function beatEvents(spec, insp = true) {
  const ev = [];
  const s1 = spec.s1 ?? 1;
  if (s1 > 0) ev.push({ kind: 'S1', t: 0, amp: s1, label: 'S1' });

  // S2: A2 then P2. Physiological splitting widens on inspiration (more
  // venous return to the right heart delays P2); fixed splitting (ASD) is
  // wide in both phases; wide splitting (pulmonic stenosis, RBBB) is wide
  // and widens further.
  const split = {
    physiologic: insp ? 0.045 : 0.012,
    fixed: 0.06,
    wide: insp ? 0.075 : 0.05,
    single: 0,
  }[spec.split || 'physiologic'];
  const a2 = spec.a2 ?? 0.85;
  const p2 = spec.p2 ?? 0.55;
  if (a2 > 0) ev.push({ kind: 'A2', t: SYS, amp: a2, label: split > 0.02 ? 'A2' : 'S2' });
  if (p2 > 0 && split > 0) ev.push({ kind: 'P2', t: SYS + split, amp: p2, label: split > 0.02 ? 'P2' : '' });
  else if (p2 > 0 && a2 <= 0) ev.push({ kind: 'P2', t: SYS, amp: p2, label: 'S2' });

  if (spec.click) {
    // An ejection click sits just after S1; a mid-systolic click (MVP) is
    // later. Pulmonic ejection clicks soften on inspiration.
    const amp = spec.click.amp ?? 0.7;
    const softer = spec.click.softOnInspiration && insp ? 0.45 : 1;
    ev.push({ kind: 'click', t: SYS * spec.click.at, amp: amp * softer, label: spec.click.label || 'Click' });
  }
  if (spec.os) ev.push({ kind: 'OS', t: SYS + (spec.os.after ?? 0.08), amp: spec.os.amp ?? 0.7, label: 'OS' });
  if (spec.s3) ev.push({ kind: 'S3', t: SYS + DIA * 0.24, amp: spec.s3, label: 'S3' });
  if (spec.s4) ev.push({ kind: 'S4', t: BEAT - 0.1, amp: spec.s4, label: 'S4' });
  return ev;
}

// ── Murmur envelopes ────────────────────────────────────────────────────
const smooth = (x) => x * x * (3 - 2 * x);

/** Loudness 0..1 at position x (0..1) through a murmur segment. */
export function envelope(shape, x, peak = 0.5) {
  if (x < 0 || x > 1) return 0;
  const edge = (v, w = 0.04) => Math.min(1, v / w);           // soft on/off, no clicks
  switch (shape) {
    case 'diamond': {                                          // crescendo–decrescendo
      const v = x < peak ? x / peak : (1 - x) / (1 - peak);
      return smooth(Math.max(0, v)) * 0.95 + 0.05 * edge(Math.min(x, 1 - x));
    }
    case 'plateau':                                            // holosystolic
      return edge(x, 0.03) * edge(1 - x, 0.03) * (0.92 + 0.08 * Math.sin(x * Math.PI));
    case 'decrescendo':
      return edge(x, 0.03) * Math.pow(1 - x, 1.25);
    case 'crescendo':
      return Math.pow(x, 1.1) * edge(1 - x, 0.04);
    case 'rumble':                                             // MS: fades, then presystolic swell
      return edge(x, 0.03) * edge(1 - x, 0.02) * Math.max(
        0.55 * Math.pow(Math.max(0, 1 - x / 0.62), 1.2) + 0.3,   // early rumble, fading
        Math.pow(Math.max(0, (x - 0.7) / 0.3), 1.4),             // presystolic accentuation
      );
    case 'burst':                                              // friction-rub scratch
      return Math.sin(Math.PI * x) ** 2;
    default:
      return 0;
  }
}

/**
 * A murmur segment's start and end in seconds from S1. `from`/`to` are
 * fractions of the phase it sits in ('sys' runs S1→S2, 'dia' runs S2→S1).
 */
export function segmentSpan(seg) {
  const base = seg.phase === 'dia' ? SYS : 0;
  const len = seg.phase === 'dia' ? DIA : SYS;
  return [base + seg.from * len, base + seg.to * len];
}

// ── Synthesis ───────────────────────────────────────────────────────────
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

/** RBJ band-pass biquad, run in place. */
function bandpass(buf, sr, fc, q) {
  const w = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0, b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    buf[i] = y;
  }
}

function lowpass(buf, sr, fc) {
  const k = 1 - Math.exp((-2 * Math.PI * fc) / sr);
  let y = 0;
  for (let i = 0; i < buf.length; i++) { y += k * (buf[i] - y); buf[i] = y; }
}

// Tone of each kind of discrete sound: [fundamental Hz, decay s, length s, gain].
const THUMP = {
  S1: [62, 0.03, 0.11, 1],
  A2: [78, 0.022, 0.08, 0.9],
  P2: [72, 0.022, 0.08, 0.9],
  click: [150, 0.008, 0.035, 0.75],
  OS: [110, 0.012, 0.05, 0.8],
  S3: [42, 0.035, 0.12, 0.85],
  S4: [44, 0.03, 0.1, 0.8],
};

function addThump(out, sr, t0, kind, amp, rand) {
  const [f, decay, len, gain] = THUMP[kind];
  const start = Math.floor(t0 * sr);
  const n = Math.floor(len * sr);
  for (let i = 0; i < n && start + i < out.length; i++) {
    if (start + i < 0) continue;
    const t = i / sr;
    const env = Math.exp(-t / decay) * Math.min(1, t / 0.004);
    const tone = Math.sin(2 * Math.PI * f * t) + 0.7 * Math.sin(2 * Math.PI * 2 * f * t + 0.6) + 0.25 * Math.sin(2 * Math.PI * 3.1 * f * t);
    const grit = rand() * 0.18 * Math.exp(-t / (decay * 0.5));
    out[start + i] += amp * gain * env * (tone * 0.55 + grit);
  }
}

// Quality → filter. Harsh murmurs are broad and rough; blowing ones are
// higher and smoother; a rumble is low and grainy.
const QUALITY = {
  harsh: { fc: 230, q: 0.8, rough: 0.55, roughHz: 38, gain: 1.15 },
  blowing: { fc: 420, q: 1.1, rough: 0.12, roughHz: 22, gain: 1.0 },
  soft: { fc: 300, q: 1.0, rough: 0.15, roughHz: 20, gain: 0.7 },
  rumble: { fc: 95, q: 1.6, rough: 0.6, roughHz: 14, gain: 2.1 },
  machine: { fc: 210, q: 0.9, rough: 0.7, roughHz: 26, gain: 1.15 },
  scratch: { fc: 650, q: 0.9, rough: 0.8, roughHz: 55, gain: 1.0 },
};

function addMurmur(out, sr, beatStart, seg, loud, rand, seed) {
  const q = QUALITY[seg.quality || 'blowing'];
  const [a, b] = segmentSpan(seg);
  const s = Math.floor((beatStart + a) * sr);
  const n = Math.max(1, Math.floor((b - a) * sr));
  const noise = new Float32Array(n);
  for (let i = 0; i < n; i++) noise[i] = rand();
  bandpass(noise, sr, seg.fc ?? q.fc, q.q);
  bandpass(noise, sr, seg.fc ?? q.fc, q.q);                    // twice: a clearer pitch
  const phase = (seed % 100) / 17;
  for (let i = 0; i < n && s + i < out.length; i++) {
    const x = i / n;
    const env = envelope(seg.shape, x, seg.peak);
    const t = i / sr;
    const rough = 1 - q.rough * 0.5 * (1 + Math.sin(2 * Math.PI * q.roughHz * t + phase + 0.8 * Math.sin(2 * Math.PI * 3 * t)));
    out[s + i] += noise[i] * env * rough * (seg.amp ?? 0.8) * q.gain * loud * 6;
  }
}

/**
 * Render RESP_BEATS beats of a murmur spec to mono samples.
 * @returns {{ samples: Float32Array, sampleRate: number, beat: number, beats: number }}
 */
export function renderMurmur(spec, sampleRate = 22050, seed = 1) {
  const sr = sampleRate;
  const total = Math.ceil(BEAT * RESP_BEATS * sr);
  const out = new Float32Array(total);
  const rand = rng(seed * 7919 + 13);
  for (let beat = 0; beat < RESP_BEATS; beat++) {
    const insp = INSPIRATION(beat);
    const t0 = beat * BEAT;
    for (const e of beatEvents(spec, insp)) addThump(out, sr, t0 + e.t, e.kind, e.amp, rand);
    // Right-sided murmurs swell on inspiration (more blood to the right
    // heart); left-sided ones are a little louder on expiration.
    const resp = spec.side === 'right' ? (insp ? 1.35 : 0.8) : spec.side === 'left' ? (insp ? 0.92 : 1.06) : 1;
    for (const seg of spec.segments || []) addMurmur(out, sr, t0, seg, resp, rand, seed + beat);
  }
  lowpass(out, sr, 1400);
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const k = peak > 0 ? 0.85 / peak : 1;
  for (let i = 0; i < out.length; i++) out[i] *= k;
  return { samples: out, sampleRate: sr, beat: BEAT, beats: RESP_BEATS };
}

/** Which beat of the breath a playback time falls in, and whether it is inspiration. */
export function breathAt(seconds) {
  const beat = Math.floor(seconds / BEAT) % RESP_BEATS;
  return { beat, inspiration: INSPIRATION(beat), inBeat: (seconds % BEAT) / BEAT };
}
