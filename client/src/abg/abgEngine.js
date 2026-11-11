/**
 * ABG analysis — the method, as code.
 *
 * Every number the ABG Reader shows or marks comes from here, so the game
 * cannot disagree with itself:
 *
 *   - pH is never authored. It is COMPUTED from the bicarbonate and the
 *     PaCO₂ by Henderson–Hasselbalch, so every gas is internally consistent
 *     — a hand-typed pH that did not match its own HCO₃⁻/PaCO₂ would teach
 *     the ratio wrong.
 *   - Each step's correct answer is DERIVED by the same rules a reader uses:
 *     the side of 7.40, Winter's formula, the acute/chronic respiratory
 *     rules, the albumin-corrected anion gap, the delta ratio. Cases say what
 *     they are meant to be; a verification script checks the derivation
 *     lands there.
 *
 * Units: PaCO₂ and PaO₂ in mmHg (kPa = mmHg ÷ 7.5), electrolytes in
 * mmol/L (= mEq/L), albumin in g/dL.
 */

export const KPA_PER_MMHG = 1 / 7.5;

export const NORMALS = {
  pH: [7.35, 7.45],
  PaCO2: [35, 45],
  HCO3: [22, 26],
  PaO2: [80, 100],
  AG: 12,          // normal anion gap, ± 2
  AG_HIGH: 14,     // above this is high
};

const round = (x, dp = 0) => Math.round(x * 10 ** dp) / 10 ** dp;

/** Henderson–Hasselbalch: pH = 6.1 + log₁₀( HCO₃⁻ / (0.03 × PaCO₂) ). */
export function phFrom(hco3, paco2) {
  return 6.1 + Math.log10(hco3 / (0.03 * paco2));
}

// ── The answer sets, with the words the game uses for them ───────────────
export const PH_STATUS = {
  acidaemia: 'Acidaemia (pH < 7.35)',
  normal: 'Normal pH (7.35–7.45)',
  alkalaemia: 'Alkalaemia (pH > 7.45)',
};

export const PRIMARY = {
  'met-acidosis': 'Metabolic acidosis',
  'resp-acidosis': 'Respiratory acidosis',
  'met-alkalosis': 'Metabolic alkalosis',
  'resp-alkalosis': 'Respiratory alkalosis',
  mixed: 'Mixed — respiratory AND metabolic push the same way',
  none: 'No acid–base disorder',
};

// Compensation options differ by primary process.
export const COMP = {
  'met-acidosis': {
    appropriate: 'Appropriately compensated (Winter’s formula)',
    'resp-acidosis-added': 'PaCO₂ too HIGH — added respiratory acidosis',
    'resp-alkalosis-added': 'PaCO₂ too LOW — added respiratory alkalosis',
  },
  'met-alkalosis': {
    appropriate: 'Appropriately compensated',
    'resp-acidosis-added': 'PaCO₂ too HIGH — added respiratory acidosis',
    'resp-alkalosis-added': 'PaCO₂ too LOW — added respiratory alkalosis',
  },
  'resp-acidosis': {
    acute: 'Acute (HCO₃⁻ up ~1 per 10 mmHg)',
    chronic: 'Chronic (HCO₃⁻ up ~3.5 per 10 mmHg)',
    'acute-on-chronic': 'Acute-on-chronic (in between)',
  },
  'resp-alkalosis': {
    acute: 'Acute (HCO₃⁻ down ~2 per 10 mmHg)',
    chronic: 'Chronic (HCO₃⁻ down ~4–5 per 10 mmHg)',
    'met-acidosis-added': 'HCO₃⁻ too LOW for the timing — added metabolic acidosis',
  },
};

export const AG_CLASS = {
  normal: 'Normal anion gap',
  high: 'High anion gap',
};

export const DELTA_CLASS = {
  'hagma+nagma': 'HAGMA + normal-gap acidosis (ratio < 0.8)',
  pure: 'Pure HAGMA (ratio 0.8–2)',
  'hagma+met-alk': 'HAGMA + metabolic alkalosis (ratio > 2)',
};

// ── The analysis ─────────────────────────────────────────────────────────
/**
 * Everything the method produces for one case, with the working shown.
 * `timing` ('acute' | 'chronic') is the clinical history's say on how long a
 * respiratory disturbance has been going — the numbers alone cannot tell an
 * acute respiratory alkalosis with an added metabolic acidosis from a
 * chronic one, and the history is how a reader does.
 */
export function analyse(caseDef) {
  const v = caseDef.values;
  const pHexact = phFrom(v.HCO3, v.PaCO2);
  const pH = round(pHexact, 2);
  const out = { pH, pHexact };

  // 1. pH
  out.phStatus = pH < 7.35 ? 'acidaemia' : pH > 7.45 ? 'alkalaemia' : 'normal';

  // 2. Primary process: which value explains the side of 7.40 the pH sits
  //    on. With a normal pH the side still points the way.
  const side = pH < 7.40 ? 'acid' : pH > 7.40 ? 'alk' : 'neutral';
  const hiCO2 = v.PaCO2 > 45, loCO2 = v.PaCO2 < 35;
  const loHCO3 = v.HCO3 < 22, hiHCO3 = v.HCO3 > 26;
  if (side === 'acid') out.primary = hiCO2 && loHCO3 ? 'mixed' : hiCO2 ? 'resp-acidosis' : loHCO3 ? 'met-acidosis' : 'none';
  else if (side === 'alk') out.primary = loCO2 && hiHCO3 ? 'mixed' : loCO2 ? 'resp-alkalosis' : hiHCO3 ? 'met-alkalosis' : 'none';
  else out.primary = 'none';
  out.side = side;

  // 3. Compensation — only for a single primary process.
  out.comp = compensation(out.primary, v, caseDef.timing);

  // 4. Anion gap, corrected for albumin when it is given: every 1 g/dL of
  //    albumin below 4 hides about 2.5 mmol/L of gap.
  const ag = v.Na - (v.Cl + v.HCO3);
  const agCorr = v.albumin != null ? ag + 2.5 * (4 - v.albumin) : ag;
  out.ag = { measured: ag, corrected: round(agCorr, 1), albuminCorrected: v.albumin != null, high: agCorr > NORMALS.AG_HIGH };
  out.agClass = out.ag.high ? 'high' : 'normal';

  // 5. Delta ratio — only for a high gap. ΔAG ÷ ΔHCO₃⁻.
  if (out.ag.high) {
    const dAG = agCorr - NORMALS.AG;
    const dHCO3 = 24 - v.HCO3;
    const ratio = dHCO3 > 0 ? dAG / dHCO3 : Infinity;
    out.delta = { dAG: round(dAG, 1), dHCO3, ratio: round(ratio, 2) };
    out.deltaClass = ratio < 0.8 ? 'hagma+nagma' : ratio <= 2 ? 'pure' : 'hagma+met-alk';
  }
  return out;
}

function compensation(primary, v, timing) {
  if (primary === 'met-acidosis') {
    const exp = 1.5 * v.HCO3 + 8;                 // Winter's formula
    return metComp(exp, v.PaCO2, `1.5 × ${v.HCO3} + 8`, 'Winter’s formula');
  }
  if (primary === 'met-alkalosis') {
    const exp = 0.7 * v.HCO3 + 21;
    return metComp(exp, v.PaCO2, `0.7 × ${v.HCO3} + 21`, 'Expected PaCO₂');
  }
  if (primary === 'resp-acidosis') {
    const d = (v.PaCO2 - 40) / 10;
    const acute = 24 + 1 * d, chronic = 24 + 3.5 * d;
    let verdict;
    if (Math.abs(v.HCO3 - acute) <= 1.5) verdict = 'acute';
    else if (Math.abs(v.HCO3 - chronic) <= 1.5) verdict = 'chronic';
    else if (v.HCO3 > acute && v.HCO3 < chronic) verdict = 'acute-on-chronic';
    else verdict = v.HCO3 < acute ? 'met-acidosis-added' : 'met-alkalosis-added';
    return {
      verdict, variable: 'HCO3', actual: v.HCO3,
      acute: round(acute, 1), chronic: round(chronic, 1),
      lo: round(Math.min(acute, chronic) - 1.5, 1), hi: round(Math.max(acute, chronic) + 1.5, 1),
      working: `ΔPaCO₂ = ${v.PaCO2} − 40 = ${v.PaCO2 - 40} mmHg. Acute: 24 + 1 × ${round(d, 1)} = ${round(acute, 1)}. Chronic: 24 + 3.5 × ${round(d, 1)} = ${round(chronic, 1)}.`,
    };
  }
  if (primary === 'resp-alkalosis') {
    const d = (40 - v.PaCO2) / 10;
    const acute = 24 - 2 * d;
    const chronicHi = 24 - 4 * d, chronicLo = 24 - 5 * d;
    let verdict;
    if (timing === 'chronic' && v.HCO3 >= chronicLo - 1 && v.HCO3 <= chronicHi + 1) verdict = 'chronic';
    else if (Math.abs(v.HCO3 - acute) <= 1.5) verdict = 'acute';
    else verdict = v.HCO3 < acute ? 'met-acidosis-added' : 'met-alkalosis-added';
    return {
      verdict, variable: 'HCO3', actual: v.HCO3,
      acute: round(acute, 1), chronic: round((chronicHi + chronicLo) / 2, 1),
      chronicRange: [round(chronicLo, 1), round(chronicHi, 1)],
      lo: round(chronicLo - 1.5, 1), hi: round(acute + 1.5, 1),
      working: `ΔPaCO₂ = 40 − ${v.PaCO2} = ${round(40 - v.PaCO2, 1)} mmHg. Acute: 24 − 2 × ${round(d, 1)} = ${round(acute, 1)}. Chronic: 24 − (4 to 5) × ${round(d, 1)} = ${round(chronicLo, 1)}–${round(chronicHi, 1)}.`,
    };
  }
  return null;
}

function metComp(exp, actual, sum, name) {
  const lo = exp - 2, hi = exp + 2;
  const verdict = actual < lo ? 'resp-alkalosis-added' : actual > hi ? 'resp-acidosis-added' : 'appropriate';
  return {
    verdict, variable: 'PaCO2', actual,
    expected: round(exp, 1), lo: round(lo, 1), hi: round(hi, 1),
    working: `${name}: ${sum} = ${round(exp, 1)} ± 2 → expected PaCO₂ ${round(lo, 1)}–${round(hi, 1)} mmHg.`,
  };
}

// ── The steps a case is read in ──────────────────────────────────────────
/**
 * The ordered questions for one case. Steps that do not apply are skipped
 * AND said to be skipped (compensation has no meaning for a mixed or normal
 * gas; a delta ratio has none without a high gap) — so the player learns
 * when each step is used, not just how.
 */
export function buildSteps(caseDef) {
  const a = analyse(caseDef);
  const steps = [];
  steps.push({ id: 'ph', options: PH_STATUS, answer: a.phStatus });
  steps.push({ id: 'primary', options: PRIMARY, answer: a.primary });
  if (a.comp) steps.push({ id: 'comp', options: COMP[a.primary], answer: a.comp.verdict });
  else steps.push({ id: 'comp', skipped: a.primary === 'mixed' ? 'mixed' : 'none' });
  steps.push({ id: 'ag', options: AG_CLASS, answer: a.agClass });
  if (a.ag.high) steps.push({ id: 'delta', options: DELTA_CLASS, answer: a.deltaClass });
  else steps.push({ id: 'delta', skipped: 'normal-ag' });
  if (caseDef.cause) {
    const opts = {};
    for (const o of caseDef.cause.options) opts[o] = o;
    steps.push({ id: 'cause', options: opts, answer: caseDef.cause.answer });
  }
  return { analysis: a, steps };
}

/** One plain sentence that says what the gas shows, built from the analysis. */
export function interpretation(caseDef, a) {
  const parts = [];
  const status = { acidaemia: 'Acidaemia', alkalaemia: 'Alkalaemia', normal: 'A normal pH' }[a.phStatus];
  if (a.primary === 'none') {
    parts.push(a.ag.high
      ? `${status}, but a high anion gap (${a.ag.corrected}) — a metabolic acidosis is present.`
      : 'A normal blood gas: pH, PaCO₂, HCO₃⁻ and anion gap all in range.');
  } else if (a.primary === 'mixed') {
    parts.push(`${status} from a MIXED disorder: a metabolic and a respiratory process pushing the pH the same way.`);
  } else {
    const prim = PRIMARY[a.primary].toLowerCase();
    const comp = a.comp?.verdict;
    const compText = {
      appropriate: 'appropriately compensated',
      acute: 'acute',
      chronic: 'chronic',
      'acute-on-chronic': 'acute-on-chronic',
      'resp-acidosis-added': 'with an added respiratory acidosis',
      'resp-alkalosis-added': 'with an added respiratory alkalosis',
      'met-acidosis-added': 'with an added metabolic acidosis',
      'met-alkalosis-added': 'with an added metabolic alkalosis',
    }[comp] || '';
    parts.push(`${status} from a primary ${prim}${compText ? ', ' + compText : ''}.`);
  }
  if (a.ag.high && a.primary !== 'none') {
    const dc = { pure: 'a pure high-anion-gap acidosis', 'hagma+nagma': 'a high-gap AND a normal-gap acidosis together', 'hagma+met-alk': 'a high-gap acidosis with a metabolic alkalosis hidden underneath' }[a.deltaClass];
    parts.push(`Anion gap ${a.ag.corrected}${a.ag.albuminCorrected ? ' (albumin-corrected)' : ''}; delta ratio ${a.delta.ratio} — ${dc}.`);
  } else if (!a.ag.high && (a.primary === 'met-acidosis')) {
    parts.push(`Anion gap ${a.ag.corrected} — a normal-gap (hyperchloraemic) acidosis.`);
  }
  if (caseDef.cause) parts.push(`Most likely: ${caseDef.cause.answer}.`);
  return parts.join(' ');
}

export const toKpa = (mmhg) => round(mmhg * KPA_PER_MMHG, 1);
