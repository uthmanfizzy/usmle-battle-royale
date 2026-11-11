/**
 * Biostats Lab — the numbers.
 *
 * Every number in the numerical questions is GENERATED and COMPUTED here,
 * never typed: a 2×2 table is built from a chosen sensitivity and
 * specificity so its cells are whole people, and every measure asked of it
 * is calculated from those cells by the First Aid formula. So a table is
 * always internally consistent, the answer is always the formula's, and the
 * questions never run out.
 *
 * Distractors are the classic confusions, computed from the SAME numbers —
 * the PPV offered as the sensitivity, the reciprocal of the LR, the
 * incidence with the existing cases left in the denominator — because
 * "which number goes on the bottom" is the mistake these questions test.
 *
 * Every generator returns one shape:
 *   { kind, prompt, options: [{ key, label, why? }], answer, formula?,
 *     why, ...whatever its picture needs }
 * `why` on a wrong option is the "why not" shown when it is picked.
 */

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const pct = (x) => `${(Math.round(x * 1000) / 10).toFixed(1)}%`;
const r2 = (x) => (Math.round(x * 100) / 100).toFixed(2);
// Percentages from sums of the empirical-rule bands: "2.5%", "84%", "99.7%".
const pctTrim = (x) => `${parseFloat((Math.round(x * 100) / 100).toFixed(2))}%`;

/** Fill `opts` to four with unique labels drawn from `candidates`. */
function pad(opts, labels, candidates, why) {
  for (const c of candidates) {
    if (opts.length >= 4) break;
    if (c == null || labels.has(c)) continue;
    labels.add(c);
    opts.push({ key: `x${opts.length}`, label: c, why });
  }
  return opts;
}

// ── 1. Screening: the 2×2 table ──────────────────────────────────────────
/**
 *            Disease+   Disease−
 *   Test+     TP (a)     FP (b)
 *   Test−     FN (c)     TN (d)
 * Diseased and healthy counts are multiples of 20 and sens/spec multiples
 * of 5%, so every cell is a whole person.
 */
export function makeTable() {
  const D = rnd([40, 60, 80, 100, 120, 200]);
  const H = rnd([300, 400, 480, 600, 800, 900, 940]);
  const sens = rnd([0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
  const spec = rnd([0.75, 0.8, 0.85, 0.9, 0.95]);
  const TP = Math.round(D * sens), FN = D - TP;
  const TN = Math.round(H * spec), FP = H - TN;
  return { TP, FP, FN, TN };
}

const sensOf = t => t.TP / (t.TP + t.FN);
const specOf = t => t.TN / (t.TN + t.FP);

export const MEASURES = {
  sens: { name: 'Sensitivity', fmt: pct, calc: sensOf, formula: 'TP ÷ (TP + FN)', num: ['TP'], den: ['TP', 'FN'],
    why: 'Of everyone WITH the disease, the share the test catches — read DOWN the disease column. SN-N-OUT: a very sensitive test, when negative, rules the disease out.' },
  spec: { name: 'Specificity', fmt: pct, calc: specOf, formula: 'TN ÷ (TN + FP)', num: ['TN'], den: ['FP', 'TN'],
    why: 'Of everyone WITHOUT the disease, the share the test correctly clears — read DOWN the healthy column. SP-P-IN: a very specific test, when positive, rules the disease in.' },
  ppv: { name: 'Positive predictive value', fmt: pct, calc: t => t.TP / (t.TP + t.FP), formula: 'TP ÷ (TP + FP)', num: ['TP'], den: ['TP', 'FP'],
    why: 'Of everyone who tests POSITIVE, the share who really have it — read ACROSS the test-positive row. Rises with prevalence.' },
  npv: { name: 'Negative predictive value', fmt: pct, calc: t => t.TN / (t.TN + t.FN), formula: 'TN ÷ (TN + FN)', num: ['TN'], den: ['FN', 'TN'],
    why: 'Of everyone who tests NEGATIVE, the share who are truly free of it — read ACROSS the test-negative row. Falls as prevalence rises.' },
  lrPos: { name: 'Positive likelihood ratio (LR+)', fmt: r2, calc: t => sensOf(t) / (1 - specOf(t)), formula: 'sensitivity ÷ (1 − specificity)', num: ['TP'], den: ['FP'],
    why: 'How many times more likely a positive result is in someone with the disease than without it. Above 10 is a strong rule-in.' },
  lrNeg: { name: 'Negative likelihood ratio (LR−)', fmt: r2, calc: t => (1 - sensOf(t)) / specOf(t), formula: '(1 − sensitivity) ÷ specificity', num: ['FN'], den: ['TN'],
    why: 'How likely a negative result is in someone with the disease relative to someone without. Below 0.1 is a strong rule-out.' },
  acc: { name: 'Accuracy', fmt: pct, calc: t => (t.TP + t.TN) / (t.TP + t.FP + t.FN + t.TN), formula: '(TP + TN) ÷ total', num: ['TP', 'TN'], den: ['TP', 'FP', 'FN', 'TN'],
    why: 'The share of ALL results that are right — the diagonal over everyone. Accuracy is validity: closeness to the truth.' },
  prev: { name: 'Prevalence', fmt: pct, calc: t => (t.TP + t.FN) / (t.TP + t.FP + t.FN + t.TN), formula: '(TP + FN) ÷ total', num: ['TP', 'FN'], den: ['TP', 'FP', 'FN', 'TN'],
    why: 'The share of the whole population who have the disease — the disease column over everyone.' },
};

// The confusion each wrong answer represents, by measure asked.
const CONFUSIONS = {
  sens: ['ppv', 'spec', 'npv'], spec: ['npv', 'sens', 'ppv'], ppv: ['sens', 'npv', 'spec'], npv: ['spec', 'ppv', 'sens'],
  lrPos: ['lrNeg'], lrNeg: ['lrPos'], acc: ['sens', 'prev', 'spec'], prev: ['acc', 'ppv', 'sens'],
};

export function screeningQuestion() {
  const t = makeTable();
  const key = rnd(Object.keys(MEASURES));
  const M = MEASURES[key];
  const val = M.calc(t);
  const answer = M.fmt(val);
  const labels = new Set([answer]);
  const opts = [{ key: 'ans', label: answer }];
  for (const k of CONFUSIONS[key]) {
    const v = MEASURES[k].fmt(MEASURES[k].calc(t));
    if (labels.has(v)) continue;
    labels.add(v);
    opts.push({ key: k, label: v, why: `That is the ${lc(MEASURES[k].name)} — ${MEASURES[k].formula}.` });
  }
  const se = sensOf(t), sp = specOf(t);
  if (M.fmt === r2) {
    // The classic slips with likelihood ratios.
    const slips = key === 'lrPos'
      ? [[r2(se / sp), 'Sensitivity ÷ specificity — the "1 −" was left off the bottom.'],
         [r2((1 - sp) / se), 'Upside down — that is (1 − specificity) ÷ sensitivity.']]
      : [[r2((1 - se) / (1 - sp)), 'The bottom should be specificity itself, not 1 − specificity.'],
         [r2(sp / (1 - se)), 'Upside down — that is specificity ÷ (1 − sensitivity).']];
    for (const [v, why] of slips) if (!labels.has(v) && opts.length < 4) { labels.add(v); opts.push({ key: `s${opts.length}`, label: v, why }); }
    pad(opts, labels, [r2(val * 2), r2(val / 2), r2(val + 1), r2(val * 3)], 'Not what the formula gives.');
  } else {
    pad(opts, labels, [0.05, -0.05, 0.1, -0.1, 0.15, -0.15, 0.025, -0.025, 0.2, -0.2].map(d => val + d).filter(v => v > 0 && v < 1).map(pct), 'Close, but not what the cells give.');
  }
  return {
    kind: 'screening', table: t, measure: key,
    prompt: `What is the ${lc(M.name)} of this test?`,
    options: shuffle(opts), answer: 'ans',
    formula: workingFor(key, t),
    why: M.why,
  };
}

function workingFor(key, t) {
  const tot = t.TP + t.FP + t.FN + t.TN;
  const se = sensOf(t), sp = specOf(t);
  switch (key) {
    case 'sens': return `TP ÷ (TP + FN) = ${t.TP} ÷ (${t.TP} + ${t.FN}) = ${pct(se)}`;
    case 'spec': return `TN ÷ (TN + FP) = ${t.TN} ÷ (${t.TN} + ${t.FP}) = ${pct(sp)}`;
    case 'ppv': return `TP ÷ (TP + FP) = ${t.TP} ÷ (${t.TP} + ${t.FP}) = ${pct(t.TP / (t.TP + t.FP))}`;
    case 'npv': return `TN ÷ (TN + FN) = ${t.TN} ÷ (${t.TN} + ${t.FN}) = ${pct(t.TN / (t.TN + t.FN))}`;
    case 'lrPos': return `Sensitivity ${t.TP}/${t.TP + t.FN} = ${pct(se)}, specificity ${t.TN}/${t.TN + t.FP} = ${pct(sp)} → ${pct(se)} ÷ ${pct(1 - sp)} = ${r2(se / (1 - sp))}`;
    case 'lrNeg': return `Sensitivity ${t.TP}/${t.TP + t.FN} = ${pct(se)}, specificity ${t.TN}/${t.TN + t.FP} = ${pct(sp)} → ${pct(1 - se)} ÷ ${pct(sp)} = ${r2((1 - se) / sp)}`;
    case 'acc': return `(TP + TN) ÷ total = (${t.TP} + ${t.TN}) ÷ ${tot} = ${pct((t.TP + t.TN) / tot)}`;
    case 'prev': return `(TP + FN) ÷ total = (${t.TP} + ${t.FN}) ÷ ${tot} = ${pct((t.TP + t.FN) / tot)}`;
    default: return '';
  }
}

// ── 2. Moving the cutoff, and prevalence ─────────────────────────────────
/**
 * Two overlapping distributions — healthy on the left, diseased on the
 * right — and a cutoff above which the test is positive. Moving the cutoff
 * LEFT (lower) calls more people positive: sensitivity and NPV rise, false
 * negatives fall; specificity and PPV fall, false positives rise. Moving it
 * RIGHT does the opposite. Prevalence changes PPV and NPV but never
 * sensitivity or specificity — those belong to the test.
 */
const CUTOFF_EFFECT = {
  lower: { sens: 'up', spec: 'down', ppv: 'down', npv: 'up', fp: 'up', fn: 'down' },
  higher: { sens: 'down', spec: 'up', ppv: 'up', npv: 'down', fp: 'down', fn: 'up' },
};
const PREV_EFFECT = { sens: 'same', spec: 'same', ppv: 'up', npv: 'down' };
const CUT_LABEL = { sens: 'sensitivity', spec: 'specificity', ppv: 'positive predictive value', npv: 'negative predictive value', fp: 'number of false positives', fn: 'number of false negatives' };
const DIR = { up: 'Increases', down: 'Decreases', same: 'Does not change' };
const dirOpts = () => shuffle(['up', 'down', 'same'].map(k => ({ key: k, label: DIR[k] })));

export function cutoffQuestion() {
  if (Math.random() < 0.3) {
    const what = rnd(Object.keys(PREV_EFFECT));
    const base = PREV_EFFECT[what];
    const more = Math.random() < 0.6;
    const flip = { up: 'down', down: 'up', same: 'same' };
    return {
      kind: 'cutoff', mode: 'prevalence', more, what,
      prompt: `The same test is used in a population where the disease is far ${more ? 'MORE' : 'LESS'} common. What happens to its ${CUT_LABEL[what]}?`,
      options: dirOpts(), answer: more ? base : flip[base],
      why: base === 'same'
        ? 'Sensitivity and specificity are properties of the TEST, measured within the diseased and the healthy separately — prevalence does not touch them.'
        : more
          ? 'Predictive values depend on prevalence: as the disease becomes more common, a positive is more likely to be real (PPV ↑) and a negative less likely to be (NPV ↓).'
          : 'Predictive values depend on prevalence: as the disease becomes rarer, more positives are false (PPV ↓) and a negative is even more reassuring (NPV ↑).',
      formula: 'Prevalence ↑ → PPV ↑, NPV ↓ · sensitivity and specificity unchanged',
    };
  }
  const dir = rnd(['lower', 'higher']);
  const what = rnd(Object.keys(CUTOFF_EFFECT.lower));
  return {
    kind: 'cutoff', mode: 'cutoff', dir, what,
    prompt: `The positive cutoff is moved ${dir === 'lower' ? 'LOWER (to the left)' : 'HIGHER (to the right)'}. What happens to the ${CUT_LABEL[what]}?`,
    options: dirOpts(), answer: CUTOFF_EFFECT[dir][what],
    why: dir === 'lower'
      ? 'A lower cutoff calls MORE people positive: more of the diseased are caught (sensitivity ↑, false negatives ↓, NPV ↑) but more of the healthy are wrongly flagged (specificity ↓, false positives ↑, PPV ↓).'
      : 'A higher cutoff calls FEWER people positive: fewer healthy people are wrongly flagged (specificity ↑, false positives ↓, PPV ↑) but more of the diseased are missed (sensitivity ↓, false negatives ↑, NPV ↓).',
    formula: dir === 'lower' ? 'Cutoff ↓ → sens ↑ · NPV ↑ · FN ↓ · spec ↓ · PPV ↓ · FP ↑' : 'Cutoff ↑ → spec ↑ · PPV ↑ · FP ↓ · sens ↓ · NPV ↓ · FN ↑',
  };
}

// ── 3. Risk, treatment and harm ──────────────────────────────────────────
/**
 * A trial or cohort with clean rates, chosen so the absolute difference
 * gives a whole-number NNT / NNH.
 *                        Event   No event
 *   Treated / exposed      a        b
 *   Control / unexposed    c        d
 */
// Lower-case a measure name but keep its acronym: "number needed to treat (NNT)".
const lc = (nm) => nm.replace(/^[^(]*/, (x) => x.toLowerCase());
const fmtX = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : r2(x));
const EXPOSURES = [
  ['Factory workers exposed to a solvent', 'unexposed office staff', 'bladder cancer'],
  ['Smokers', 'non-smokers', 'peripheral vascular disease'],
  ['Night-shift nurses', 'day-shift nurses', 'type 2 diabetes'],
  ['Children living near a main road', 'children in quieter streets', 'asthma'],
];
const TRIALS = [
  ['a new statin', 'placebo', 'heart attacks'],
  ['a new anticoagulant', 'aspirin', 'strokes'],
  ['an influenza vaccine', 'placebo', 'cases of influenza'],
  ['a new antihypertensive', 'standard care', 'heart failure admissions'],
];

export function riskQuestion() {
  const harm = Math.random() < 0.3;
  const n = 100 * rnd([1, 2, 5]);
  const pairs = harm
    ? [[0.1, 0.2], [0.05, 0.15], [0.1, 0.3], [0.2, 0.25]]                         // [unexposed, exposed]
    : [[0.3, 0.2], [0.4, 0.2], [0.25, 0.15], [0.5, 0.25], [0.2, 0.1], [0.3, 0.1]]; // [control, treated]
  const [cer, eer] = rnd(pairs);
  const a = Math.round(eer * n), b = n - a, c = Math.round(cer * n), d = n - c;
  const RR = eer / cer;
  const diff = Math.abs(cer - eer);
  const nnx = Math.round(1 / diff);
  const OR = (a / b) / (c / d);
  const [g1, g2, outcome] = harm ? rnd(EXPOSURES) : rnd(TRIALS);
  const vaccine = !harm && g1.includes('vaccine');
  const asks = harm
    ? [['rr', 'Relative risk (RR)', fmtX(RR), `RR = risk exposed ÷ risk unexposed = ${pct(eer)} ÷ ${pct(cer)} = ${fmtX(RR)}`, 'Risk in the exposed ÷ risk in the unexposed — the measure a cohort study reports. Above 1 means the exposure raises the risk.'],
       ['ar', 'Attributable risk (AR)', pct(diff), `AR = risk exposed − risk unexposed = ${pct(eer)} − ${pct(cer)} = ${pct(diff)}`, 'The excess risk explained by the exposure: the DIFFERENCE in rates.'],
       ['nnh', 'Number needed to harm (NNH)', String(nnx), `NNH = 1 ÷ AR = 1 ÷ ${diff.toFixed(2)} = ${nnx}`, 'How many people must be exposed for one extra person to be harmed.'],
       ['or', 'Odds ratio (OR)', r2(OR), `OR = ad ÷ bc = (${a} × ${d}) ÷ (${b} × ${c}) = ${r2(OR)}`, 'The odds of the outcome in the exposed over the odds in the unexposed — what a case–control study reports. Close to the RR only when the outcome is rare.']]
    : [['rr', 'Relative risk (RR)', fmtX(RR), `RR = EER ÷ CER = ${pct(eer)} ÷ ${pct(cer)} = ${fmtX(RR)}`, 'Event rate on treatment ÷ event rate on control. Below 1 means the treatment lowers the risk.'],
       ['rrr', vaccine ? 'Vaccine efficacy' : 'Relative risk reduction (RRR)', pct(1 - RR), `${vaccine ? 'Efficacy' : 'RRR'} = (CER − EER) ÷ CER = 1 − RR = 1 − ${fmtX(RR)} = ${pct(1 - RR)}`, vaccine ? 'Vaccine efficacy IS the relative risk reduction: the share of the unvaccinated risk that the vaccine removes.' : 'The PROPORTION of the control risk removed by treatment. It always sounds bigger than the absolute figure.'],
       ['arr', 'Absolute risk reduction (ARR)', pct(diff), `ARR = CER − EER = ${pct(cer)} − ${pct(eer)} = ${pct(diff)}`, 'The actual difference in event rates — what a patient really gains.'],
       ['nnt', 'Number needed to treat (NNT)', String(nnx), `NNT = 1 ÷ ARR = 1 ÷ ${diff.toFixed(2)} = ${nnx}`, 'How many people must be treated for one to benefit. Smaller is better.'],
       ['or', 'Odds ratio (OR)', r2(OR), `OR = ad ÷ bc = (${a} × ${d}) ÷ (${b} × ${c}) = ${r2(OR)}`, 'The odds of the event on treatment over the odds on control. Close to the RR only when the event is rare.']];
  const [, name, answer, working, why] = rnd(asks);
  const labels = new Set([answer]);
  const opts = [{ key: 'ans', label: answer }];
  for (const [k, nm, v] of shuffle(asks)) {
    if (nm === name || labels.has(v) || opts.length >= 4) continue;
    labels.add(v);
    opts.push({ key: k, label: v, why: `That is the ${lc(nm)}.` });
  }
  pad(opts, labels, [String(nnx * 2), pct(diff / 2), r2(1 / RR), pct(RR)], 'A common slip — check which rate goes on top.');
  return {
    kind: 'risk', harm, n, a, b, c, d, cer, eer, g1, g2, outcome,
    prompt: harm
      ? `${g1} and ${g2} (${n} in each group) are followed for 10 years for ${outcome}. What is the ${lc(name)}?`
      : `A randomised trial gives ${g1} or ${g2} to ${n} patients each and counts the ${outcome} over 2 years. What is the ${lc(name)}?`,
    options: shuffle(opts), answer: 'ans', formula: working, why,
  };
}

// ── 4. The normal curve ──────────────────────────────────────────────────
/**
 * The 68–95–99.7 rule, summed from its bands so every answer is derived:
 *   −∞ … −3σ … −2σ … −σ … μ … +σ … +2σ … +3σ … +∞
 *     0.15  2.35  13.5   34   34   13.5  2.35  0.15   (%)
 * Band edges are indexed −4…4, with ±4 standing for ±∞.
 */
export const BANDS = [0.15, 2.35, 13.5, 34, 34, 13.5, 2.35, 0.15];
const massBetween = (lo, hi) => BANDS.slice(lo + 4, hi + 4).reduce((s, x) => s + x, 0);
const SCALES = [
  ['Serum cholesterol', 'mg/dL', 200, 20], ['Systolic blood pressure', 'mmHg', 120, 10],
  ['IQ', '', 100, 15], ['Fasting glucose', 'mg/dL', 90, 8], ['Birth weight', 'g', 3400, 400],
];
export function normalQuestion() {
  const [what, unit, mu, sd] = rnd(SCALES);
  const shapes = [[-1, 1], [-2, 2], [-3, 3], [1, 4], [2, 4], [3, 4], [-4, -1], [-4, -2], [-4, 1], [-4, 2], [0, 4], [-1, 2], [-2, 1], [0, 1], [1, 2], [0, 2], [-1, 0]];
  const [lo, hi] = rnd(shapes);
  const ans = pctTrim(massBetween(lo, hi));
  const at = (k) => `${mu + k * sd}${unit ? ` ${unit}` : ''}`;
  const range = lo === -4 ? `below ${at(hi)}` : hi === 4 ? `above ${at(lo)}` : `between ${at(lo)} and ${at(hi)}`;
  const labels = new Set([ans]);
  const opts = [{ key: 'ans', label: ans }];
  pad(opts, labels, shuffle(['68%', '95%', '99.7%', '16%', '2.5%', '34%', '47.5%', '13.5%', '50%', '84%', '97.5%', '0.15%', '81.5%']), 'Count the bands under the curve again.');
  const sdOf = (k) => (k === -4 ? '−∞' : k === 4 ? '+∞' : k === 0 ? 'μ' : `μ ${k > 0 ? '+' : '−'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}σ`);
  return {
    kind: 'normal', lo, hi, mu, sd, unit,
    prompt: `${what} is normally distributed with a mean of ${mu}${unit ? ` ${unit}` : ''} and a standard deviation of ${sd}. What share of people are ${range}?`,
    options: shuffle(opts), answer: 'ans',
    formula: `${sdOf(lo)} to ${sdOf(hi)}: ${BANDS.slice(lo + 4, hi + 4).join(' + ')} = ${ans}`,
    why: '68% of values lie within 1 SD of the mean, 95% within 2 and 99.7% within 3 — and the curve is symmetric, so each half holds 50%.',
  };
}

// ── 5. Incidence and prevalence ──────────────────────────────────────────
export function ratesQuestion() {
  const N = rnd([1000, 2000, 5000]);
  const P = N * rnd([0.05, 0.1, 0.2]);               // cases already present at the start
  const atRisk = N - P;
  const I = Math.round(atRisk * rnd([0.02, 0.04, 0.05, 0.1]));   // new cases over the year
  const ask = rnd(['inc', 'inc', 'prevStart', 'prevEnd']);
  const vals = { inc: pct(I / atRisk), prevStart: pct(P / N), prevEnd: pct((P + I) / N), naive: pct(I / N) };
  const names = { inc: 'one-year incidence', prevStart: 'prevalence on 1 January', prevEnd: 'prevalence on 31 December' };
  const working = {
    inc: `Incidence = new cases ÷ population AT RISK = ${I} ÷ (${N} − ${P}) = ${I} ÷ ${atRisk} = ${vals.inc}`,
    prevStart: `Prevalence = existing cases ÷ total population = ${P} ÷ ${N} = ${vals.prevStart}`,
    prevEnd: `Prevalence = all cases now ÷ total population = (${P} + ${I}) ÷ ${N} = ${vals.prevEnd}`,
  }[ask];
  const ans = vals[ask];
  const labels = new Set([ans]);
  const opts = [{ key: 'ans', label: ans }];
  const whyNot = {
    inc: 'That is the incidence — new cases among those at risk.', prevStart: 'That is the prevalence on 1 January — existing cases only.',
    prevEnd: 'That is the prevalence on 31 December — old and new cases together.',
    naive: 'New cases over the WHOLE population — but people who already have the disease cannot develop it again, so they come out of the denominator.',
  };
  for (const k of ['naive', 'inc', 'prevStart', 'prevEnd']) {
    if (k === ask || labels.has(vals[k]) || opts.length >= 4) continue;
    labels.add(vals[k]); opts.push({ key: k, label: vals[k], why: whyNot[k] });
  }
  pad(opts, labels, [pct(P / atRisk), pct(I / P)], 'Check what goes on the bottom.');
  return {
    kind: 'rates', N, P, I,
    prompt: `A town of ${N.toLocaleString('en-US')} is screened on 1 January: ${P} already have the disease. Over the year, ${I} new cases are diagnosed (no one dies, recovers or moves). What is the ${names[ask]}?`,
    options: shuffle(opts), answer: 'ans', formula: working,
    why: 'Incidence counts NEW cases among those AT RISK over a period; prevalence counts ALL cases at a point in time. Prevalence ≈ incidence × average duration of disease.',
  };
}

// ── 6. Confidence intervals ──────────────────────────────────────────────
export function ciQuestion() {
  const ratio = Math.random() < 0.6;
  const sig = Math.random() < 0.55;
  let lo, hi, label;
  if (ratio) {
    label = rnd(['relative risk', 'odds ratio', 'hazard ratio']);
    if (sig) [lo, hi] = rnd([[0.42, 0.88], [0.55, 0.93], [0.3, 0.71], [1.15, 2.4], [1.3, 3.8], [1.05, 1.9]]);
    else [lo, hi] = rnd([[0.68, 1.35], [0.82, 1.6], [0.45, 1.12], [0.9, 2.7]]);
  } else {
    label = rnd(['difference in mean systolic BP (mmHg)', 'difference in mean HbA1c (%)', 'difference in mean LDL (mg/dL)']);
    if (sig) [lo, hi] = rnd([[-9.2, -2.1], [1.4, 6.8], [-4.5, -0.6], [0.3, 2.2]]);
    else [lo, hi] = rnd([[-3.1, 4.6], [-1.2, 0.8], [-6.5, 1.4], [-0.4, 2.9]]);
  }
  const nul = ratio ? 1 : 0;
  // A ratio's point estimate is the geometric mean of its CI limits.
  const point = ratio ? Math.round(Math.sqrt(lo * hi) * 100) / 100 : Math.round(((lo + hi) / 2) * 100) / 100;
  const answer = sig ? 'sig' : 'ns';
  const why = ratio
    ? `For a RATIO the line of no effect is 1 — equal risk in both groups. ${sig ? `${lo} to ${hi} does not cross 1, so p < 0.05.` : `${lo} to ${hi} crosses 1, so the result is compatible with no effect (p > 0.05).`}`
    : `For a DIFFERENCE the line of no effect is 0. ${sig ? `${lo} to ${hi} does not cross 0, so p < 0.05.` : `${lo} to ${hi} crosses 0, so the result is compatible with no difference (p > 0.05).`}`;
  // The trap reads the interval against the WRONG null; it is only offered
  // when that reading reaches the wrong verdict (otherwise it would be right).
  const wrongNul = ratio ? 0 : 1;
  const trapSig = !(lo <= wrongNul && wrongNul <= hi);
  const opts = [
    { key: 'sig', label: `Significant — the interval excludes ${nul}` },
    { key: 'ns', label: `Not significant — the interval includes ${nul}` },
  ];
  if (trapSig !== sig) {
    opts.push({
      key: 'trap',
      label: trapSig ? `Significant — the interval excludes ${wrongNul}` : `Not significant — the interval includes ${wrongNul}`,
      why: ratio ? 'Zero is the null for a DIFFERENCE. For a ratio the null is 1.' : 'One is the null for a RATIO. For a difference the null is 0.',
    });
  }
  opts.push({ key: 'p', label: 'Cannot tell without the p-value', why: 'The 95% CI already tells you: if it excludes the null value, p < 0.05.' });
  return {
    kind: 'ci', lo, hi, nul, point, ratio,
    prompt: `A study reports a ${label} of ${point} (95% CI ${lo} to ${hi}). Is the result statistically significant at α = 0.05?`,
    options: shuffle(opts.map(o => (o.key === 'sig' || o.key === 'ns') && o.key !== answer ? { ...o, why } : o)),
    answer, formula: `Null value for a ${ratio ? 'ratio' : 'difference'}: ${nul} · 95% CI ${lo} to ${hi}`, why,
  };
}

// ── 7. Power and correlation ─────────────────────────────────────────────
export function powerQuestion() {
  const beta = rnd([0.1, 0.15, 0.2, 0.25, 0.3]);
  const alpha = rnd([0.05, 0.01]);
  const ans = pct(1 - beta);
  const labels = new Set([ans]);
  const opts = [{ key: 'ans', label: ans }];
  pad(opts, labels, [pct(beta), pct(1 - alpha), pct(alpha), pct(1 - beta - alpha)], 'Power is 1 − β; α plays no part in this number.');
  return {
    kind: 'power', beta, alpha,
    prompt: `A trial is designed with α = ${alpha} and a ${pct(beta)} chance of missing a real effect (β = ${beta}). What is its power?`,
    options: shuffle(opts), answer: 'ans', formula: `Power = 1 − β = 1 − ${beta} = ${ans}`,
    why: 'Power is the probability of finding a difference when one truly exists — 1 minus the type II error rate. It rises with sample size, effect size and a larger α.',
  };
}

export function correlationQuestion() {
  const r = rnd([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) * (Math.random() < 0.45 ? -1 : 1);
  const r2v = Math.round(r * r * 100);
  const ans = `${r2v}%`;
  const labels = new Set([ans]);
  const opts = [{ key: 'ans', label: ans }];
  pad(opts, labels, [`${Math.round(Math.abs(r) * 100)}%`, `${100 - r2v}%`, `${Math.round((1 - Math.abs(r)) * 100)}%`, `${Math.min(99, r2v * 2)}%`, `${r2v + 10}%`, `${Math.max(1, r2v - 10)}%`], 'R² is r squared — the share of the variation in one variable explained by the other.');
  // A scatter with roughly this r, seeded so the picture is steady per question.
  let seed = Math.round(Math.abs(r) * 1000) + 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rand(); return (s - 3) / 0.7071; };
  const pts = Array.from({ length: 40 }, () => { const x = gauss(); const y = r * x + Math.sqrt(1 - r * r) * gauss(); return [x, y]; });
  return {
    kind: 'corr', r, pts,
    prompt: `${r < 0 ? 'Weekly exercise hours and resting heart rate' : 'Body weight and systolic blood pressure'} have a correlation coefficient of r = ${r.toFixed(1)}. What share of the variation in one is explained by the other?`,
    options: shuffle(opts), answer: 'ans', formula: `R² = r² = (${r.toFixed(1)})² = ${(r * r).toFixed(2)} → ${ans}`,
    why: `r runs from −1 to +1: its SIGN is the direction (${r < 0 ? 'negative — one rises as the other falls' : 'positive — they rise together'}), its SIZE the strength. Squaring removes the sign. Correlation is never causation.`,
  };
}
