/**
 * ECG synthesis — a strip built from physiology rather than drawn.
 *
 * WHY SYNTHESISE: most of what a strip teaches is TIMING, not shape. A
 * Wenckebach is not a picture; it is a PR interval that grows beat by beat
 * until a P wave is not conducted. Complete heart block is P waves and QRS
 * complexes keeping two separate clocks. A still image can show one cycle of
 * that; a simulated rhythm shows it happening, indefinitely, and never repeats
 * a frame exactly. So the rhythm and the morphology are modelled separately:
 *
 *   - The RHYTHM decides when things happen: a schedule of P-wave onsets and
 *     QRS onsets, generated from a seeded RNG so a case is reproducible.
 *   - The MORPHOLOGY decides what each event looks like in each lead: P, QRS
 *     and T as sums of Gaussian kernels (the approach of McSharry's ECGSYN),
 *     plus ST deviation, PR-segment deviation, delta and U waves where a
 *     pathology needs them.
 *   - CONTINUOUS activity that has no discrete beats — fibrillatory waves,
 *     flutter waves, VF, torsades — is a function of time added on top.
 *
 * Units throughout: time in SECONDS, amplitude in MILLIVOLTS. The renderer
 * owns the paper scale (25 mm/s, 10 mm/mV) so nothing here knows about pixels.
 *
 * Intervals are textbook and are checked by measuring the generated signal
 * (see the verification note in ecgCases.js): normal PR 0.12–0.20 s, QRS
 * < 0.12 s, QT corrected by Bazett (QT = QTc · √RR).
 */

// ── Small maths ──────────────────────────────────────────────────────────
const gauss = (t, c, s, a) => a * Math.exp(-((t - c) * (t - c)) / (2 * s * s));
// A T wave rises more slowly than it falls; one sigma each side.
const agauss = (t, c, s1, s2, a) => {
  const s = t < c ? s1 : s2;
  return a * Math.exp(-((t - c) * (t - c)) / (2 * s * s));
};
const smooth = (e0, e1, x) => {
  const u = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return u * u * (3 - 2 * u);
};

// Seeded PRNG, so the same case and seed always produce the same strip.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic value noise in [0, 1]. Deterministic in t matters: the strip
// is redrawn every frame from absolute time, so noise that changed between
// frames would shimmer instead of looking like a recorded trace.
function hash01(n) {
  let x = (n | 0) ^ 0x9E3779B9;
  x = Math.imul(x ^ (x >>> 16), 0x85EBCA6B);
  x = Math.imul(x ^ (x >>> 13), 0xC2B2AE35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
function smoothNoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash01(i) * (1 - u) + hash01(i + 1) * u;
}

// ── One complex, in one lead ─────────────────────────────────────────────
/**
 * The voltage contributed by one QRS complex (with its ST segment, T and U
 * waves, and the PR segment before it) at time `t` relative to QRS onset.
 *
 * morph = {
 *   qrs:  [{ c, s, a }]        Gaussian kernels, c relative to QRS onset
 *   j:    0.09                 J point — end of QRS (s)
 *   t:    { a, rise, fall }    T wave
 *   qtc:  0.40  | qt: 0.36     corrected QT (Bazett) or a fixed QT
 *   st:   0                    ST deviation (mV), J point to T
 *   prSeg: 0                   PR-segment deviation (mV), e.g. pericarditis
 *   u:    { a, s } | null      U wave
 * }
 */
function complexValue(morph, t, qt, pr) {
  let v = 0;
  for (const k of morph.qrs) v += gauss(t, k.c, k.s, k.a);

  const tEnd = qt;
  // The T peak sits ~2.6 falling-sigmas before T end (where it is ~3% of its
  // height). Held clear of the J point, so at fast rates the T still follows
  // the QRS rather than overlapping it.
  let tPeak = tEnd - 2.6 * morph.t.fall;
  if (tPeak < morph.j + 0.06) tPeak = morph.j + 0.06;
  v += agauss(t, tPeak, morph.t.rise, morph.t.fall, morph.t.a);

  if (morph.st) {
    // A plateau from the J point that rolls into the T wave — elevation that
    // "coves" up into the T, the way an injury current looks.
    v += morph.st * smooth(morph.j - 0.01, morph.j + 0.025, t)
                  * (1 - smooth(tPeak - 0.01, tEnd - 0.02, t));
  }
  if (morph.u) {
    v += gauss(t, tEnd + 0.085, morph.u.s, morph.u.a);
  }
  if (morph.prSeg && pr) {
    // From the end of the P wave (P lasts ~0.10 s) to QRS onset.
    const pEnd = -pr + 0.10;
    v += morph.prSeg * smooth(pEnd - 0.005, pEnd + 0.015, t)
                     * (1 - smooth(-0.015, 0, t));
  }
  return v;
}

// ── Rhythms: when things happen ──────────────────────────────────────────
/**
 * Every rhythm returns { pWaves: [onset], complexes: [{ at, kind, pr }] },
 * both sorted by time, out to `horizon` seconds. `kind` selects which of a
 * lead's morphologies draws the complex ('normal', 'pvc', 'escape', 'vt').
 * `pr` is carried only where a P wave conducted, for the PR segment.
 */
const RHYTHMS = {
  // Sinus at a given rate, with the small beat-to-beat variability a real
  // sinus node has — perfectly metronomic looks machine-made.
  sinus({ rate = 72, pr = 0.16, variability = 0.025 }, rng, horizon) {
    const pWaves = [], complexes = [];
    const rr0 = 60 / rate;
    for (let t = 0.6; t < horizon;) {
      pWaves.push(t - pr);
      complexes.push({ at: t, kind: 'normal', pr });
      t += rr0 * (1 + variability * (rng() * 2 - 1));
    }
    return { pWaves, complexes };
  },

  // Irregularly irregular, no P waves. RR intervals are drawn independently,
  // which is exactly what "irregularly irregular" means: no pattern to find.
  af({ rate = 105 }, rng, horizon) {
    const complexes = [];
    const mean = 60 / rate;
    for (let t = 0.5; t < horizon;) {
      complexes.push({ at: t, kind: 'normal' });
      // Spread of ±45% around the mean, never shorter than a refractory gap.
      t += Math.max(0.36, mean * (0.55 + rng() * 0.9));
    }
    return { pWaves: [], complexes };
  },

  // Atrial cycle 0.20 s (300/min). Ventricles follow every Nth flutter wave
  // through the AV node, at a fixed point in the flutter cycle.
  flutter({ ratios = [2] }, rng, horizon) {
    const complexes = [];
    const cycle = 0.2;
    let i = 0;
    for (let t = 0.6; t < horizon;) {
      complexes.push({ at: t, kind: 'normal' });
      t += cycle * ratios[i % ratios.length];
      i++;
    }
    return { pWaves: [], complexes };
  },

  // Re-entrant SVT: fast, rigidly regular, narrow, P waves buried in the QRS.
  svt({ rate = 180 }, rng, horizon) {
    const complexes = [];
    for (let t = 0.5; t < horizon; t += 60 / rate) complexes.push({ at: t, kind: 'normal' });
    return { pWaves: [], complexes };
  },

  // Mobitz I. P waves march regularly; the PR grows each beat until one P is
  // not conducted, then it resets. A 4:3 cycle by default.
  wenckebach({ atrialRate = 80, prs = [0.16, 0.26, 0.32] }, rng, horizon) {
    const pWaves = [], complexes = [];
    const pp = 60 / atrialRate;
    let n = 0;
    for (let p = 0.4; p < horizon; p += pp, n++) {
      pWaves.push(p);
      const k = n % (prs.length + 1);
      if (k < prs.length) complexes.push({ at: p + prs[k], kind: 'normal', pr: prs[k] });
      // k === prs.length: the dropped beat — a P wave with nothing after it.
    }
    return { pWaves, complexes };
  },

  // Mobitz II. Constant PR, then suddenly a P wave with no QRS. 3:2 here.
  mobitz2({ atrialRate = 85, pr = 0.18, pattern = [1, 1, 0] }, rng, horizon) {
    const pWaves = [], complexes = [];
    const pp = 60 / atrialRate;
    let n = 0;
    for (let p = 0.4; p < horizon; p += pp, n++) {
      pWaves.push(p);
      if (pattern[n % pattern.length]) complexes.push({ at: p + pr, kind: 'normal', pr });
    }
    return { pWaves, complexes };
  },

  // Complete heart block. Two independent clocks: P waves at the sinus rate,
  // broad escape complexes far slower, and no fixed relationship between
  // them — the P waves march straight through the QRS complexes and T waves.
  chb({ atrialRate = 84, ventRate = 36 }, rng, horizon) {
    const pWaves = [], complexes = [];
    const offset = 0.15 + rng() * 0.4;
    for (let p = 0.3; p < horizon; p += 60 / atrialRate) pWaves.push(p);
    for (let q = 0.3 + offset; q < horizon; q += 60 / ventRate) complexes.push({ at: q, kind: 'escape' });
    return { pWaves, complexes };
  },

  // Monomorphic VT: broad, regular, fast, no organised atrial activity seen.
  vt({ rate = 175 }, rng, horizon) {
    const complexes = [];
    for (let t = 0.4; t < horizon; t += 60 / rate) complexes.push({ at: t, kind: 'vt' });
    return { pWaves: [], complexes };
  },

  // Ventricular bigeminy: every sinus beat followed by a PVC at a fixed
  // coupling interval, then a full compensatory pause — the next sinus beat
  // lands exactly two sinus cycles after the last one, because the sinus node
  // was never reset.
  bigeminy({ rate = 72, pr = 0.16, coupling = 0.44 }, rng, horizon) {
    const pWaves = [], complexes = [];
    const rr = 60 / rate;
    for (let t = 0.6; t < horizon; t += 2 * rr) {
      pWaves.push(t - pr);
      complexes.push({ at: t, kind: 'normal', pr });
      complexes.push({ at: t + coupling, kind: 'pvc' });
    }
    return { pWaves, complexes };
  },

  // Nothing organised at all: VF, torsades and asystole are continuous.
  none() {
    return { pWaves: [], complexes: [] };
  },
};

// ── Continuous activity ──────────────────────────────────────────────────
const CONTINUOUS = {
  // Fine fibrillatory waves, 350–600/min, never the same twice.
  af(t) {
    const env = 0.7 + 0.6 * smoothNoise(t * 0.8 + 3.1);
    return env * (0.045 * Math.sin(2 * Math.PI * 6.2 * t)
                + 0.030 * Math.sin(2 * Math.PI * 7.7 * t + 1.3)
                + 0.025 * Math.sin(2 * Math.PI * 5.1 * t + 2.1));
  },
  // The sawtooth at 300/min. In the inferior leads the flutter waves are
  // NEGATIVE: a slow descent then a sharp return, which is what makes the
  // "sawtooth" — so the default here is the inferior-lead shape.
  flutter(t) {
    const x = ((t / 0.2) % 1 + 1) % 1;
    const saw = x < 0.78 ? -x / 0.78 : -(1 - x) / 0.22;
    return 0.2 * saw + 0.04;
  },
  // Coarse VF: several competing frequencies with wandering amplitudes. No
  // two seconds alike, no complex identifiable.
  vf(t) {
    const fs = [4.6, 5.9, 7.1, 3.8];
    let v = 0;
    for (let i = 0; i < fs.length; i++) {
      const a = 0.24 * (0.35 + smoothNoise(t * 0.9 + i * 17.3));
      v += a * Math.sin(2 * Math.PI * fs[i] * t + i * 1.7);
    }
    return v;
  },
  // Torsades: a rapid broad oscillation (~250/min) whose amplitude swells and
  // shrinks and whose axis twists through zero — the spindle, then the flip.
  torsades(t) {
    const env = Math.sin(2 * Math.PI * t / 2.6);
    return 1.05 * env * Math.sin(2 * Math.PI * 4.15 * t)
         + 0.14 * Math.abs(env) * Math.sin(2 * Math.PI * 8.3 * t + 0.5);
  },
};

// ── Assembling a signal ──────────────────────────────────────────────────
function lowerBound(arr, x, key) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((key ? arr[mid][key] : arr[mid]) < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/**
 * Build a playable signal for one case.
 *
 * Returns { leads: [{ name }], value(leadIndex, t), lastQrsBefore(t),
 *           complexes, pWaves } where value() is the voltage in mV.
 */
export function buildSignal(caseDef, seed = 1, horizon = 900) {
  const rng = mulberry32(seed);
  const rhythmFn = RHYTHMS[caseDef.rhythm.type];
  if (!rhythmFn) throw new Error(`Unknown rhythm: ${caseDef.rhythm.type}`);
  const { pWaves, complexes } = rhythmFn(caseDef.rhythm, rng, horizon);

  // Each complex's QT is fixed once, from the RR interval before it, so a
  // beat does not change shape while you watch it.
  for (let i = 0; i < complexes.length; i++) {
    const rr = i > 0 ? complexes[i].at - complexes[i - 1].at : 60 / (caseDef.rhythm.rate || 72);
    complexes[i].rr = Math.min(2.0, Math.max(0.3, rr));
  }

  const cont = caseDef.continuous ? CONTINUOUS[caseDef.continuous] : null;
  const leads = caseDef.leads;

  const qtFor = (morph, c) => (morph.qt != null ? morph.qt : morph.qtc * Math.sqrt(c.rr));

  function value(li, t) {
    const lead = leads[li];
    let v = 0;

    // Complexes whose QRS, ST, T or U could reach t. T can end ~0.7 s after
    // QRS onset in a long QT, and the PR segment begins ~0.2 s before it.
    const lo = lowerBound(complexes, t - 1.0, 'at');
    for (let i = lo; i < complexes.length; i++) {
      const c = complexes[i];
      if (c.at > t + 0.3) break;
      const morph = lead.morph[c.kind] || lead.morph.normal;
      v += complexValue(morph, t - c.at, qtFor(morph, c), c.pr);
    }

    // P waves are their own events: in a block they exist with no QRS.
    const p = lead.morph.normal.p;
    if (p) {
      const plo = lowerBound(pWaves, t - 0.2);
      for (let i = plo; i < pWaves.length; i++) {
        const onset = pWaves[i];
        if (onset > t + 0.05) break;
        v += gauss(t, onset + 0.05, p.s, p.a);
      }
    }

    if (cont) v += (lead.contScale ?? 1) * cont(t);

    // A recorded trace is never a pure mathematical line: slow respiratory
    // baseline wander and a little high-frequency noise.
    v += 0.028 * Math.sin(2 * Math.PI * 0.21 * t) + 0.012 * Math.sin(2 * Math.PI * 0.07 * t + 1.1);
    v += 0.012 * (smoothNoise(t * 180) - 0.5);
    return v;
  }

  function lastQrsBefore(t) {
    const i = lowerBound(complexes, t, 'at') - 1;
    return i >= 0 ? complexes[i].at : null;
  }

  return { leads: leads.map(l => ({ name: l.name })), value, lastQrsBefore, complexes, pWaves };
}
