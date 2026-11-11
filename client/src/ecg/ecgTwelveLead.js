/**
 * The full 12-lead for any ECG Reader case.
 *
 * A case declares only the leads its diagnosis is read from (a rhythm on
 * lead II, a bundle branch block in V1 and V6). This builds the other leads
 * so the whole tracing can be shown — without contradicting what the case
 * declared, and without the limb leads contradicting each other.
 *
 * LIMB LEADS ARE DERIVED, NOT DRAWN. Leads I and II are settled first; the
 * other four follow from Einthoven's law and the Goldberger equations:
 *     III = II − I        aVR = −(I + II) / 2
 *     aVL = I − II / 2    aVF = II − I / 2
 * The engine's morphology is a sum of kernels whose amplitudes enter
 * linearly (QRS kernels, P, T, ST, PR segment, U), so a weighted sum of two
 * leads' morphologies IS the weighted sum of their voltages. Every derived
 * limb lead is therefore exactly consistent with I and II — an inferior STEMI
 * built from its declared II and III gives reciprocal depression in I and
 * aVR automatically, because that is what the arithmetic says.
 *
 * Where a case declares two limb leads, I and II are solved from them
 * (inferior STEMI: I = II − III; pericarditis: I = −2·aVR − II). Where it
 * declares only II, lead I comes from the normal template with the case's
 * own changes applied (rate-related timing, P wave, T wave, ST, U, QRS
 * width). A case's declared leads are always shown exactly as declared.
 *
 * CHEST LEADS come from textbook templates — R-wave progression from rS in
 * V1 to qR in V6, transition around V3–V4 — with the same changes applied,
 * or with explicit per-case leads where the pattern lives there (bundle
 * branch blocks, anterior STEMI, pericarditis, early repolarisation).
 */

const P_NORMAL = { a: 0.15, s: 0.02 };
const T_TIMING = { rise: 0.065, fall: 0.045 };
const II_T = 0.32;   // lead II's normal T amplitude — the reference for scaling

const mk = (p, qrs, tA, extra = {}) => ({
  p: p == null ? null : { a: p, s: 0.02 },
  qrs: qrs.map(([c, s, a]) => ({ c, s, a })),
  j: 0.09,
  t: { a: tA, ...T_TIMING },
  qtc: 0.40,
  ...extra,
});

// ── Normal templates (sinus, axis about +60°) ────────────────────────────
const TEMPLATE = {
  I: mk(0.10, [[0.012, 0.006, -0.05], [0.040, 0.0095, 0.75], [0.068, 0.009, -0.12]], 0.22),
  II: mk(0.15, [[0.012, 0.006, -0.08], [0.040, 0.0095, 1.25], [0.068, 0.009, -0.25]], II_T),
  V1: mk(0.06, [[0.022, 0.008, 0.25], [0.055, 0.011, -0.95]], -0.08),
  V2: mk(0.08, [[0.024, 0.009, 0.42], [0.058, 0.012, -1.35]], 0.55),
  V3: mk(0.09, [[0.03, 0.0095, 0.8], [0.062, 0.011, -0.8]], 0.5),
  V4: mk(0.10, [[0.012, 0.006, -0.04], [0.04, 0.0095, 1.4], [0.068, 0.009, -0.45]], 0.45),
  V5: mk(0.10, [[0.012, 0.006, -0.08], [0.04, 0.0095, 1.5], [0.068, 0.009, -0.2]], 0.38),
  V6: mk(0.10, [[0.012, 0.006, -0.08], [0.04, 0.0095, 1.15], [0.068, 0.009, -0.1]], 0.3),
};
const CHEST = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
export const LEAD_ORDER = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', ...CHEST];

// Ectopic ventricular beats (PVC, VT, escape) in the other leads: the
// declared lead II complex, scaled. A left-bundle-like ectopic with an
// inferior axis — negative in V1, positive across to V6 — the commonest
// outflow-tract morphology.
const ECTOPIC_I = -0.45;
const ECTOPIC_V = { V1: -0.75, V2: -0.9, V3: -0.35, V4: 0.5, V5: 0.85, V6: 0.95 };

// How continuous atrial or ventricular activity shows in lead I and the chest
// (the other limb leads follow from Einthoven). Flutter waves are largest in
// the inferior leads and appear as positive deflections in V1.
const CONT_I = { af: 0.45, flutter: 0.15, vf: -0.6, torsades: 0.55 };
const CONT_V = {
  af: { V1: 1.35, V2: 1.0, V3: 0.7, V4: 0.5, V5: 0.45, V6: 0.4 },
  flutter: { V1: -0.8, V2: -0.5, V3: 0.2, V4: 0.3, V5: 0.3, V6: 0.3 },
  vf: { V1: 1.1, V2: -0.9, V3: 1.2, V4: -0.7, V5: 0.9, V6: 0.6 },
  torsades: { V1: -0.8, V2: -1.0, V3: 0.6, V4: 1.0, V5: 0.9, V6: 0.8 },
};

// ── Morphology arithmetic ────────────────────────────────────────────────
const clamp = (x, m) => Math.max(-m, Math.min(m, x));
const scaleP = (p, k) => (p ? { a: p.a * k, s: p.s } : null);

function scaleMorph(m, k) {
  return {
    ...m,
    p: scaleP(m.p, k),
    qrs: m.qrs.map(q => ({ ...q, a: q.a * k })),
    t: { ...m.t, a: m.t.a * k },
    st: (m.st || 0) * k,
    prSeg: (m.prSeg || 0) * k,
    u: m.u ? { ...m.u, a: m.u.a * k } : null,
  };
}

/** a·A + b·B, kernel by kernel. Timing (T, QT, J) follows the larger term. */
function combine(A, a, B, b) {
  const main = Math.abs(b) >= Math.abs(a) ? B : A;
  let p = null;
  if (A.p || B.p) {
    const pa = (A.p ? A.p.a * a : 0) + (B.p ? B.p.a * b : 0);
    p = { a: pa, s: (A.p || B.p).s };
  }
  const u = (A.u || B.u)
    ? { a: (A.u ? A.u.a * a : 0) + (B.u ? B.u.a * b : 0), s: (A.u || B.u).s }
    : null;
  return {
    p,
    qrs: [...A.qrs.map(q => ({ ...q, a: q.a * a })), ...B.qrs.map(q => ({ ...q, a: q.a * b }))].filter(q => Math.abs(q.a) > 0.004),
    j: Math.max(A.j, B.j),
    t: { ...main.t, a: A.t.a * a + B.t.a * b },
    ...(main.qt != null ? { qt: main.qt } : { qtc: main.qtc }),
    st: (A.st || 0) * a + (B.st || 0) * b,
    prSeg: (A.prSeg || 0) * a + (B.prSeg || 0) * b,
    u,
  };
}

/** A whole lead (every kind of complex, the alternate P shapes, the
 *  continuous-activity scale) combined the same way. */
function combineLead(name, A, a, B, b) {
  const kinds = new Set([...Object.keys(A.morph), ...Object.keys(B.morph)].filter(k => k !== 'pAlt'));
  const morph = {};
  for (const k of kinds) morph[k] = combine(A.morph[k] || A.morph.normal, a, B.morph[k] || B.morph.normal, b);
  if (A.morph.pAlt || B.morph.pAlt) {
    const n = Math.max(A.morph.pAlt?.length || 0, B.morph.pAlt?.length || 0);
    morph.pAlt = Array.from({ length: n }, (_, i) => {
      const pa = A.morph.pAlt?.[i], pb = B.morph.pAlt?.[i];
      if (!pa && !pb) return null;
      return { a: (pa ? pa.a * a : 0) + (pb ? pb.a * b : 0), s: (pa || pb).s };
    });
  }
  return { name, morph, contScale: (A.contScale ?? 1) * a + (B.contScale ?? 1) * b };
}

const lead = (name, normal, kinds = {}, contScale) => ({ name, morph: { normal, ...kinds }, contScale });

/**
 * A template lead given the case's own changes, read off its declared lead
 * II against the normal one: P size and shape, T size and timing, QT, ST,
 * U wave, QRS width, a delta wave. ST and U follow the T wave's direction —
 * repolarisation changes move with repolarisation — so a diffuse ST
 * depression becomes ST elevation in aVR, as it does on paper.
 */
function adapt(template, caseII, { delta = false } = {}) {
  const tRatio = template.t.a / II_T;
  const out = { ...template, qrs: template.qrs.map(q => ({ ...q })) };
  out.p = caseII.p ? { a: template.p.a * (caseII.p.a / P_NORMAL.a), s: caseII.p.s } : null;
  out.t = { a: clamp(template.t.a * (caseII.t.a / II_T), 1.5), rise: caseII.t.rise, fall: caseII.t.fall };
  if (caseII.qt != null) { out.qt = caseII.qt; delete out.qtc; } else out.qtc = caseII.qtc;
  out.st = (caseII.st || 0) * tRatio;
  out.u = caseII.u ? { a: caseII.u.a * tRatio, s: caseII.u.s } : null;
  if (delta) {
    // Pre-excitation: the slurred upstroke, in the direction of the main
    // deflection, and everything after it pushed later.
    const main = template.qrs.reduce((m, q) => (Math.abs(q.a) > Math.abs(m.a) ? q : m), template.qrs[0]);
    out.qrs = [{ c: 0.032, s: 0.022, a: 0.34 * main.a / 1.25 }, ...out.qrs.map(q => ({ ...q, c: q.c + 0.032 }))];
    out.j = caseII.j;
  } else if (caseII.j > 0.1) {
    // A wider QRS (hyperkalaemia): stretch the complex in time.
    const k = caseII.j / 0.09;
    out.qrs = out.qrs.map(q => ({ ...q, c: q.c * k, s: q.s * k }));
    out.j = caseII.j;
  }
  return out;
}

const withSt = (m, st, extra = {}) => ({ ...m, st, ...extra });

// ── Cases whose pattern lives in leads they do not declare ───────────────
const SPECIAL = {
  // Inferior STEMI: the chest leads are not in the territory. Mild reciprocal
  // ST depression in V1–V3 is common (and posterior extension deepens it).
  'inferior-stemi': () => ({
    V1: withSt(TEMPLATE.V1, -0.06),
    V2: withSt(TEMPLATE.V2, -0.09, { t: { ...TEMPLATE.V2.t, a: 0.4 } }),
    V3: withSt(TEMPLATE.V3, -0.05),
  }),
  'anterior-stemi': () => ({
    I: withSt(TEMPLATE.I, 0.06, { t: { ...TEMPLATE.I.t, a: 0.3 } }),
    II: withSt(TEMPLATE.II, -0.04),
    V1: withSt(TEMPLATE.V1, 0.18, { t: { ...TEMPLATE.V1.t, a: 0.35 } }),
    V5: withSt(TEMPLATE.V5, 0.16, { t: { ...TEMPLATE.V5.t, a: 0.6 } }),
    V6: withSt(TEMPLATE.V6, 0.07, { t: { ...TEMPLATE.V6.t, a: 0.36 } }),
  }),
  pericarditis: () => {
    const peri = (m, st, pr, tA) => ({ ...m, st, prSeg: pr, t: { ...m.t, a: tA } });
    return {
      V1: peri(TEMPLATE.V1, 0.02, 0.02, 0.05),
      V2: peri(TEMPLATE.V2, 0.14, -0.05, 0.62),
      V3: peri(TEMPLATE.V3, 0.16, -0.06, 0.58),
      V4: peri(TEMPLATE.V4, 0.18, -0.06, 0.52),
      V6: peri(TEMPLATE.V6, 0.14, -0.05, 0.38),
    };
  },
  'early-repol': () => {
    const notch = (m, a) => [...m.qrs, { c: 0.088, s: 0.006, a }];
    return {
      I: { ...TEMPLATE.I, st: 0.04 },
      II: { ...TEMPLATE.II, st: 0.06, qrs: notch(TEMPLATE.II, 0.08), j: 0.095 },
      V5: { ...TEMPLATE.V5, st: 0.12, qrs: notch(TEMPLATE.V5, 0.12), j: 0.095, t: { ...TEMPLATE.V5.t, a: 0.5 } },
      V6: { ...TEMPLATE.V6, st: 0.06, qrs: notch(TEMPLATE.V6, 0.08), j: 0.095 },
    };
  },
  // RBBB: late, slow right-ventricular activation — an R′ in V1–V2 and aVR,
  // a broad slurred S in I, aVL, V5 and V6. T waves in V1–V3 inverted
  // (secondary change).
  rbbb: () => {
    const x = { j: 0.13, qtc: 0.42 };
    return {
      I: mk(0.10, [[0.012, 0.006, -0.06], [0.038, 0.0105, 0.7], [0.088, 0.022, -0.3]], 0.2, x),
      II: mk(0.15, [[0.012, 0.006, -0.08], [0.038, 0.0105, 1.1], [0.088, 0.022, -0.22]], 0.3, x),
      V2: mk(0.08, [[0.02, 0.008, 0.32], [0.048, 0.01, -0.62], [0.09, 0.016, 0.62]], -0.18, x),
      V3: mk(0.09, [[0.028, 0.009, 0.6], [0.056, 0.011, -0.55], [0.094, 0.016, 0.28]], -0.06, x),
      V4: mk(0.10, [[0.012, 0.006, -0.05], [0.038, 0.0105, 1.25], [0.088, 0.022, -0.42]], 0.32, x),
      V5: mk(0.10, [[0.012, 0.006, -0.08], [0.038, 0.0105, 1.3], [0.088, 0.022, -0.38]], 0.32, x),
    };
  },
  // LBBB: slow right-to-left activation — broad QS/rS in V1–V3 with
  // discordant ST elevation, broad notched R in I, aVL, V5 and V6 with no
  // septal q and discordant ST depression / T inversion.
  lbbb: () => {
    const x = { j: 0.14, qtc: 0.44 };
    return {
      I: mk(0.10, [[0.046, 0.02, 0.75], [0.098, 0.02, 0.8]], -0.26, { ...x, st: -0.08 }),
      II: mk(0.15, [[0.046, 0.02, 0.45], [0.098, 0.02, 0.4]], -0.08, { ...x, st: -0.03 }),
      V2: mk(0.08, [[0.014, 0.006, 0.1], [0.074, 0.03, -1.8]], 0.5, { ...x, st: 0.18 }),
      V3: mk(0.09, [[0.016, 0.007, 0.14], [0.076, 0.03, -1.35]], 0.42, { ...x, st: 0.14 }),
      V4: mk(0.10, [[0.03, 0.016, 0.42], [0.086, 0.026, -0.8]], 0.2, { ...x, st: 0.05 }),
      V5: mk(0.10, [[0.046, 0.02, 0.9], [0.098, 0.02, 1.0]], -0.28, { ...x, st: -0.08 }),
    };
  },
};

/**
 * The 12-lead version of a case: the same case, with `leads` holding all
 * twelve in standard order. Pass the result to buildSignal().
 */
export function twelveLeadCase(caseDef) {
  const declared = Object.fromEntries(caseDef.leads.map(l => [l.name, l]));
  const special = SPECIAL[caseDef.id]?.() || {};
  // Lead II's changes are carried into other leads only when they are GLOBAL
  // — rate, electrolytes, drugs, conduction. A case that declares a second
  // limb lead is a territorial one (an infarct, pericarditis), and its lead II
  // ST elevation must not leak into leads outside the territory.
  const territorial = !!(declared.III || declared.aVR);
  const caseII = (!territorial && declared.II?.morph.normal) || TEMPLATE.II;
  const wpw = caseDef.id === 'wpw';
  const cont = caseDef.continuous;

  // Extra complex kinds (pvc, vt, escape) and alternate P shapes declared on
  // lead II, carried into another lead at a given scale.
  const iiLead = declared.II;
  const kindsFor = (k) => {
    if (!iiLead) return {};
    const out = {};
    for (const [name, m] of Object.entries(iiLead.morph)) {
      if (name === 'normal') continue;
      out[name] = name === 'pAlt' ? m.map(p => scaleP(p, k)) : scaleMorph(m, k);
    }
    return out;
  };
  const pRatio = (tpl) => tpl.p.a / P_NORMAL.a;

  // Leads I and II first.
  let I, II;
  if (declared.II && declared.III) {
    II = declared.II;
    I = combineLead('I', declared.II, 1, declared.III, -1);
  } else if (declared.II && declared.aVR) {
    II = declared.II;
    I = combineLead('I', declared.aVR, -2, declared.II, -1);
  } else {
    II = declared.II || lead('II', special.II || adapt(TEMPLATE.II, caseII, { delta: wpw }));
    let iMorph = special.I || adapt(TEMPLATE.I, caseII, { delta: wpw });
    // A retrograde (junctional) P points up and to the left: inverted in the
    // inferior leads, upright in aVR, near-flat in I.
    if (!special.I && caseII.p && caseII.p.a < 0) iMorph = { ...iMorph, p: { a: 0.02, s: caseII.p.s } };
    const iKinds = kindsFor(ECTOPIC_I);
    if (iiLead?.morph.pAlt) iKinds.pAlt = iiLead.morph.pAlt.map(p => scaleP(p, pRatio(TEMPLATE.I)));
    I = lead('I', iMorph, iKinds, cont ? CONT_I[cont] ?? 0.5 : undefined);
  }
  if (cont && II.contScale == null) II = { ...II, contScale: 1 };

  const limbs = {
    I, II,
    III: combineLead('III', II, 1, I, -1),
    aVR: combineLead('aVR', I, -0.5, II, -0.5),
    aVL: combineLead('aVL', I, 1, II, -0.5),
    aVF: combineLead('aVF', II, 1, I, -0.5),
  };

  const chest = {};
  for (const v of CHEST) {
    if (declared[v]) { chest[v] = declared[v]; continue; }
    const normal = special[v] || adapt(TEMPLATE[v], caseII, { delta: wpw });
    const kinds = kindsFor(ECTOPIC_V[v]);
    if (iiLead?.morph.pAlt) kinds.pAlt = iiLead.morph.pAlt.map(p => scaleP(p, pRatio(TEMPLATE[v])));
    chest[v] = lead(v, normal, kinds, cont ? CONT_V[cont]?.[v] ?? 0.5 : undefined);
  }

  const all = { ...limbs, ...chest };
  // Declared limb leads are shown exactly as the case wrote them.
  for (const name of ['III', 'aVR', 'aVL', 'aVF']) if (declared[name]) all[name] = declared[name];
  return { ...caseDef, leads: LEAD_ORDER.map(n => ({ ...all[n], name: n })) };
}
