// Which reference values a question is actually about.
//
// The sheet holds ~80 ranges per exam; a question mentions three or four.
// Finding those automatically turns "hunt for LDH in a long table while the
// clock runs" into "open the panel, read the rows that matter".
//
// Two kinds of term are matched, and they behave differently:
//
//   NAMES ("lactate dehydrogenase", "haptoglobin") — case-insensitive. Long
//   enough that a chance match is not a real risk.
//
//   ABBREVIATIONS ("LDH", "Na", "pH") — matched with their own capitalisation,
//   as whole words. This is what keeps `mg/dL` from being magnesium, "weak"
//   from being potassium and "a PT on the ward" from being a prothrombin time.
//   Stems write labs the way a chart does, so the capitals are reliable.

// Abbreviations and spellings the row names do not carry, keyed by a fragment
// of the row name (lower case, matched as a substring). Written with the exact
// capitalisation a stem would use.
const EXTRA_TERMS = {
  // ── Serum chemistry ──
  'sodium':                  ['Na', 'Na+', 'hyponatr', 'hypernatr'],
  'potassium':               ['K+', 'hypokal', 'hyperkal'],
  'chloride':                ['Cl-'],
  'bicarbonate':             ['HCO3', 'HCO3-', 'bicarb'],
  'urea nitrogen':           ['BUN', 'urea'],
  'urea':                    ['BUN'],
  'creatinine':              ['Cr', 'serum creatinine'],
  'glucose':                 ['BM', 'blood sugar', 'blood glucose', 'hypoglycaem', 'hyperglycaem', 'hypoglycem', 'hyperglycem'],
  'calcium':                 ['Ca2+', 'hypercalc', 'hypocalc'],
  'magnesium':               ['Mg', 'Mg2+', 'hypomagnes'],
  'phosphate':               ['PO4', 'phosphorus', 'hypophosphat'],
  'osmolality':              ['osmolarity', 'osmolar gap'],
  'uric acid':               ['urate', 'hyperuric'],
  'urate':                   ['uric acid', 'hyperuric'],
  'amylase':                 [],
  'lipase':                  [],
  'ck':                      ['CK', 'CPK', 'CK-MB', 'creatine kinase'],
  'troponin i':              ['trop', 'troponin'],
  'troponin t':              ['trop', 'troponin'],
  'lactate dehydrogenase':   ['LDH'],
  'haptoglobin':             [],
  'lactate':                 ['lactic acid'],
  'ferritin':                [],
  'iron':                    ['serum iron'],
  'tibc':                    ['TIBC', 'total iron binding capacity', 'transferrin'],
  'crp':                     ['CRP', 'c-reactive protein'],

  // ── Lipids ──
  'cholesterol':             ['hypercholesterol'],
  'triglycerides':           ['TG', 'trigs', 'hypertriglycerid'],
  'hdl':                     ['HDL', 'high density lipoprotein'],
  'hdl cholesterol':         ['HDL', 'high density lipoprotein'],
  'ldl':                     ['LDL', 'low density lipoprotein'],
  'ldl cholesterol':         ['LDL', 'low density lipoprotein'],

  // ── Liver ──
  'ast':                     ['AST', 'SGOT', 'aspartate'],
  'alt':                     ['ALT', 'SGPT', 'alanine', 'transaminase'],
  'alkaline phosphatase':    ['ALP', 'alk phos'],
  'bilirubin':               ['bili', 'hyperbilirubin', 'jaundice'],
  'albumin':                 ['hypoalbumin'],
  'glutamyltransferase':     ['GGT', 'gamma gt', 'gamma-glutamyl'],

  // ── Haematology ──
  'hemoglobin':              ['Hb', 'Hgb', 'haemoglobin', 'anaemia', 'anemia'],
  'haemoglobin':             ['Hb', 'Hgb', 'hemoglobin', 'anaemia', 'anemia'],
  'hematocrit':              ['Hct', 'PCV', 'haematocrit', 'packed cell volume'],
  'haematocrit':             ['Hct', 'PCV', 'hematocrit', 'packed cell volume'],
  'wbc count':               ['WBC', 'WCC', 'white cell', 'white blood cell', 'leukocyt', 'leucocyt'],
  'white cell count':        ['WBC', 'WCC', 'white blood cell', 'leukocyt', 'leucocyt'],
  'platelet count':          ['PLT', 'platelet', 'thrombocyt'],
  'mcv':                     ['MCV', 'mean corpuscular volume', 'mean cell volume', 'microcytic', 'macrocytic'],
  'mch':                     ['MCH', 'mean corpuscular hemoglobin', 'mean cell haemoglobin'],
  'mchc':                    ['MCHC'],
  'rdw':                     ['RDW', 'red cell distribution width'],
  'reticulocyte count':      ['retic', 'reticulocyt'],
  'reticulocytes':           ['retic', 'reticulocyt'],
  'esr':                     ['ESR', 'sed rate', 'erythrocyte sedimentation'],
  'neutrophils':             ['neuts', 'ANC', 'neutropen', 'neutrophilia'],
  'lymphocytes':             ['lymphs', 'lymphopen', 'lymphocytosis'],
  'pt':                      ['PT', 'prothrombin'],
  'ptt':                     ['PTT', 'APTT', 'aPTT', 'partial thromboplastin'],
  'aptt':                    ['APTT', 'aPTT', 'PTT', 'partial thromboplastin'],
  'inr':                     ['INR'],
  'fibrinogen':              [],
  'd-dimer':                 ['D dimer', 'ddimer'],

  // ── Endocrine ──
  'tsh':                     ['TSH', 'thyroid stimulating hormone', 'thyrotropin'],
  'free t4':                 ['fT4', 'T4', 'free thyroxine', 'thyroxine'],
  'total t4':                ['T4', 'thyroxine'],
  'free t3':                 ['fT3', 'T3', 'triiodothyronine'],
  'total t3':                ['T3', 'triiodothyronine'],
  'hba1c':                   ['HbA1c', 'A1c', 'glycated', 'glycosylated'],
  'cortisol':                ['cortisol'],
  '25-hydroxy vitamin d':    ['vitamin d', '25-OH', 'calcidiol'],
  'vitamin d':               ['vitamin d', '25-OH', 'calcidiol'],
  'pth':                     ['PTH', 'parathyroid hormone'],
  'prolactin':               ['PRL', 'hyperprolactin'],

  // ── Blood gas ──
  'ph':                      ['pH', 'acidosis', 'alkalosis', 'acidaemia', 'alkalaemia', 'acidemia', 'alkalemia'],
  'pao2':                    ['PaO2', 'pO2', 'partial pressure of oxygen', 'hypoxaem', 'hypoxem'],
  'paco2':                   ['PaCO2', 'pCO2', 'hypercapnia', 'hypercarbia'],
  'o2 saturation':           ['SpO2', 'SaO2', 'O2 sat', 'oxygen saturation', 'sats'],
  'base excess':             ['base deficit'],

  // ── CSF ──
  'opening pressure':        ['CSF pressure', 'lumbar puncture'],
  'cell count':              ['CSF white cell', 'pleocytosis'],

  // ── Urine ──
  'specific gravity':        [],
  'protein':                 ['proteinuria'],
  'total protein':           [],
  'creatinine clearance':    ['CrCl'],
  'albumin:creatinine ratio': ['ACR', 'albumin creatinine ratio', 'microalbumin'],
  'egfr':                    ['eGFR', 'GFR', 'glomerular filtration rate'],
};

// Subscripts, superscripts and punctuation the data uses (Na⁺, HCO₃⁻, PaO₂)
// are not what anyone types.
const flattenDigits = (t) => t
  .replace(/[₀-₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)))
  .replace(/[⁰¹²³⁴-⁹]/g, (d) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)));

const normalise = (text) => flattenDigits(String(text || ''))
  .replace(/[⁺⁻±]/g, '')     // ⁺ ⁻ ±
  .toLowerCase()
  .replace(/[^a-z0-9\s+:.-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Same, but keeping case — abbreviations are matched against this.
const normaliseKeepCase = (text) => flattenDigits(String(text || ''))
  .replace(/[⁺⁻±]/g, '')
  .replace(/[^A-Za-z0-9\s+:.-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// An abbreviation is short and has no spaces; those are the ones that collide
// with ordinary words, so they carry their capitalisation into the match.
const isAbbrev = (term) => term.length <= 4 && !/\s/.test(term);

function termsFor(row) {
  const name = String(row.name || '');
  const names = new Set();     // case-insensitive
  const abbrevs = new Set();   // case-sensitive, whole word

  // "Urea nitrogen (BUN)" → name "urea nitrogen", abbreviation "BUN".
  // A bracket holding ordinary words is a qualifier, not a name: "Calcium
  // (total)" is not a lab called "total".
  for (const m of name.matchAll(/\(([^)]+)\)/g)) {
    const inner = m[1].trim();
    if (/^[^a-z]+$/.test(flattenDigits(inner).replace(/[⁺⁻]/g, ''))) {
      const t = normaliseKeepCase(inner);
      if (t) (isAbbrev(t) ? abbrevs : names).add(isAbbrev(t) ? t : t.toLowerCase());
    }
  }

  // Only the part before the first comma is the lab's own name; what follows
  // ("male", "total", "fasting") is a qualifier.
  const head = name.replace(/\([^)]*\)/g, ' ').split(',')[0];
  const headKeep = normaliseKeepCase(head);
  if (headKeep) {
    if (isAbbrev(headKeep)) abbrevs.add(headKeep);
    else if (normalise(head).length >= 3) names.add(normalise(head));
  }

  // Exact key, so "Glucose (fasting)" cannot pick up the aliases of a lab
  // whose letters it happens to contain.
  const key = normalise(head);
  for (const extra of (EXTRA_TERMS[key] || [])) {
    const keep = normaliseKeepCase(extra);
    if (!keep) continue;
    if (isAbbrev(keep)) abbrevs.add(keep);
    else names.add(keep.toLowerCase());
  }

  return { names: [...names], abbrevs: [...abbrevs] };
}

/**
 * The rows `text` mentions, in the sheet's own order.
 * @param {string} text  the question stem (and anything else worth scanning)
 * @param {Array}  rows  labValues[exam]
 */
export function labsMentionedIn(text, rows) {
  const original = normaliseKeepCase(text);
  const haystack = original.toLowerCase();
  if (!haystack || !Array.isArray(rows)) return [];

  return rows.filter((row) => {
    const { names, abbrevs } = termsFor(row);
    // A name only has to appear; "hyponatraemia" finding sodium is wanted, and
    // these are long enough not to collide by accident.
    for (const n of names) {
      if (new RegExp(`(^|[^a-z0-9])${escapeRe(n)}`).test(haystack)) return true;
    }
    for (const a of abbrevs) {
      if (new RegExp(`(^|[^A-Za-z0-9])${escapeRe(a)}($|[^A-Za-z0-9])`).test(original)) return true;
    }
    return false;
  });
}
