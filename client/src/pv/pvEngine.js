/**
 * Pressure–volume loop engine.
 *
 * A loop is built from a handful of physiological numbers — end-diastolic
 * and end-systolic volume, the pressure at which the aortic valve opens, the
 * peak and end-systolic pressures, and the passive filling curve (EDPVR) —
 * so every loop on the page, normal or diseased, is drawn by the same rules
 * and always has the four textbook phases in the right places.
 *
 * Loops run COUNTER-CLOCKWISE: filling along the bottom (left → right),
 * isovolumetric contraction up the right side, ejection across the top
 * (right → left), isovolumetric relaxation down the left side.
 *
 * Regurgitant valves are the exception the shape has to show: in MR the LV
 * loses volume before the aortic valve opens and after it closes (both
 * vertical sides lean LEFT); in AR it gains volume from the aorta while it
 * relaxes (the left side leans RIGHT). `dvC` / `dvR` carry that.
 */

export const V0_ES = 5;          // ESPVR volume intercept (mL)

/** Passive filling curve: P = a·(e^{b(V − v0)} − 1). */
export function edpvr(v, s) {
  return Math.max(0, s.a * (Math.exp(s.b * (v - s.v0)) - 1));
}
/** Inverse of edpvr: the volume at which the passive curve reaches p. */
export function edpvrInverse(p, s) {
  return s.v0 + Math.log(p / s.a + 1) / s.b;
}

export const NORMAL_STIFF = { a: 0.9, b: 0.0249, v0: 20 };

// Share of the cycle each phase takes, for the moving dot.
export const PHASE_SHARE = { ivc: 0.07, ej: 0.33, ivr: 0.1, fill: 0.5 };
export const PHASE_ORDER = ['ivc', 'ej', 'ivr', 'fill'];

export const PHASES = {
  ivc:  { name: 'Isovolumetric contraction', short: 'Iso. contraction', mitral: false, aortic: false },
  ej:   { name: 'Ejection', short: 'Ejection', mitral: false, aortic: true },
  ivr:  { name: 'Isovolumetric relaxation', short: 'Iso. relaxation', mitral: false, aortic: false },
  fill: { name: 'Ventricular filling', short: 'Filling', mitral: true, aortic: false },
};

const ease = (s) => s * s * (3 - 2 * s);

/**
 * Build the loop's points. Each point: { v, p, phase, t } where t is the
 * fraction of the cardiac cycle (0 = mitral valve closes).
 */
export function buildLoop(L) {
  const N = 48;
  const pts = [];
  const stiff = L.stiff || NORMAL_STIFF;
  const edp = L.edp ?? edpvr(L.edv, stiff);
  const dvC = L.dvC || 0;
  const dvR = L.dvR || 0;
  let t0 = 0;
  const push = (phase, i, n, v, p) => pts.push({ v, p, phase, t: t0 + PHASE_SHARE[phase] * (i / n) });

  // 1. Isovolumetric contraction: EDV, EDP → aortic opening.
  const vOpen = L.edv - dvC;
  for (let i = 0; i < N / 4; i++) {
    const s = i / (N / 4);
    push('ivc', i, N / 4, L.edv - dvC * s, edp + (L.pOpen - edp) * ease(s));
  }
  t0 += PHASE_SHARE.ivc;

  // 2. Ejection: pressure climbs to the peak, then falls to end-systole.
  //    The bump height is solved so the curve's maximum is exactly pPeak.
  const shape = (s, H) => L.pOpen + (L.pEs - L.pOpen) * s + H * Math.sin(Math.PI * Math.pow(s, 0.85));
  let lo = 0, hi = 300;
  for (let k = 0; k < 40; k++) {
    const H = (lo + hi) / 2;
    let m = -Infinity;
    for (let j = 0; j <= 60; j++) m = Math.max(m, shape(j / 60, H));
    if (m > L.pPeak) hi = H; else lo = H;
  }
  const H = lo;
  for (let i = 0; i < N; i++) {
    const s = i / N;
    // Volume leaves fastest early in ejection.
    const sv = 1 - Math.pow(1 - s, 1.6);
    push('ej', i, N, vOpen - (vOpen - L.esv) * sv, shape(s, H));
  }
  t0 += PHASE_SHARE.ej;

  // 3. Isovolumetric relaxation: end-systole → mitral opening.
  const vMo = L.esv + dvR;
  for (let i = 0; i < N / 4; i++) {
    const s = i / (N / 4);
    push('ivr', i, N / 4, L.esv + dvR * s, L.pEs + (L.pMo - L.pEs) * ease(s));
  }
  t0 += PHASE_SHARE.ivr;

  // 4. Filling: dips onto the passive curve, then rides it up to EDV.
  const lift = L.pMo - edpvr(vMo, stiff);
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const v = vMo + (L.edv - vMo) * s;
    push('fill', i, N, v, edpvr(v, stiff) + lift * Math.pow(1 - s, 4));
  }
  return pts;
}

/** Numbers a learner reads off a loop. */
export function metrics(L, pts = buildLoop(L)) {
  const vs = pts.map(x => x.v);
  const ps = pts.map(x => x.p);
  const minV = Math.min(...vs);
  const maxV = Math.max(...vs);
  const sv = maxV - minV;
  // Shoelace area = stroke work (mmHg·mL).
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.v * q.p - q.v * p.p;
  }
  return {
    edv: maxV,
    esv: minV,
    sv,
    ef: sv / maxV,
    edp: L.edp ?? edpvr(L.edv, L.stiff || NORMAL_STIFF),
    peak: Math.max(...ps),
    pOpen: L.pOpen,
    sw: Math.abs(a) / 2,
  };
}

/** End-systolic elastance (ESPVR slope) implied by a loop's end-systolic point. */
export const eesOf = (L) => L.pEs / (L.esv - V0_ES);

/**
 * The coupling model behind the Lab's sliders and the interventions:
 * filling pressure sets EDV along the EDPVR; ESV is where the ventricle's
 * ESPVR (Ees) meets the arterial load (Ea = Pes / SV).
 */
export function coupledLoop({ fill = 10, ea = 1.43, ees = 2.22, stiffMul = 1 }) {
  const stiff = { ...NORMAL_STIFF, b: NORMAL_STIFF.b * stiffMul };
  const edv = edpvrInverse(fill, stiff);
  const esv = (ea * edv + ees * V0_ES) / (ees + ea);
  const pEs = ees * (esv - V0_ES);
  return {
    edv, esv, stiff, edp: fill,
    pOpen: 0.8 * pEs,
    pPeak: 1.2 * pEs,
    pEs,
    pMo: Math.max(edpvr(esv, stiff) + 7, fill * 0.5 + 3),
    ees,
  };
}

export const NORMAL_INPUTS = { fill: 10, ea: 1.43, ees: 2.22, stiffMul: 1 };
export const NORMAL_LOOP = coupledLoop(NORMAL_INPUTS);

/** The corner points (valve events) of a loop. */
export function corners(pts) {
  const first = (ph) => pts.find(x => x.phase === ph);
  return {
    mc: first('ivc'),          // mitral closes
    ao: first('ej'),           // aortic opens
    ac: first('ivr'),          // aortic closes
    mo: first('fill'),         // mitral opens
  };
}

/** The point on the loop at cycle fraction t (0–1). */
export function pointAt(pts, t) {
  const tt = ((t % 1) + 1) % 1;
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i + 1].t >= tt) {
      const a = pts[i], b = pts[i + 1];
      const f = b.t === a.t ? 0 : (tt - a.t) / (b.t - a.t);
      return { v: a.v + (b.v - a.v) * f, p: a.p + (b.p - a.p) * f, phase: a.phase };
    }
  }
  const last = pts[pts.length - 1];
  return { v: last.v, p: last.p, phase: last.phase };
}
