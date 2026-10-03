// Which reference values a question is actually about.
//
// The panel holds ~200 ranges; a question mentions three or four. Scanning the
// stem for the ones it names turns "find LDH in a long table while the clock
// runs" into "open the panel, read the two rows that matter".
//
// Matching is deliberately conservative: a false positive is worse than a miss,
// because a row that has nothing to do with the question is noise in exactly
// the place a student is trying to think.

// Abbreviations the data's own names do not carry. Keyed by a distinctive
// fragment of the row name (lower case, matched as a substring), each holding
// the extra terms that should find that row.
const EXTRA_TERMS = [
  ['lactate dehydrogenase', ['ldh']],
  ['alanine', ['alt', 'sgpt']],
  ['aspartate', ['ast', 'sgot']],
  ['alkaline phosphatase', ['alp', 'alk phos']],
  ['bilirubin', ['tbili', 'bili']],
  ['urea nitrogen', ['bun', 'urea']],
  ['creatinine', ['cr']],
  ['hemoglobin', ['hb', 'hgb', 'haemoglobin']],
  ['hematocrit', ['hct', 'haematocrit', 'packed cell volume', 'pcv']],
  ['leukocyte', ['wbc', 'white cell', 'white blood cell', 'white count']],
  ['erythrocyte count', ['rbc', 'red cell count', 'red blood cell count']],
  ['platelet', ['plt', 'thrombocyte']],
  ['mean corpuscular volume', ['mcv']],
  ['mean corpuscular hemoglobin', ['mch', 'mchc']],
  ['prothrombin', ['pt', 'inr']],
  ['partial thromboplastin', ['ptt', 'aptt']],
  ['erythrocyte sedimentation', ['esr', 'sed rate']],
  ['c-reactive protein', ['crp']],
  ['thyroid-stimulating', ['tsh']],
  ['thyroxine', ['t4']],
  ['triiodothyronine', ['t3']],
  ['brain natriuretic', ['bnp', 'nt-probnp', 'probnp']],
  ['troponin', ['trop']],
  ['creatine kinase', ['ck', 'ck-mb', 'cpk']],
  ['glycated', ['hba1c', 'a1c', 'hemoglobin a1c']],
  ['ferritin', []],
  ['transferrin', ['tibc']],
  ['amylase', []],
  ['lipase', []],
  ['albumin', []],
  ['sodium', ['na']],
  ['potassium', ['k']],
  ['chloride', ['cl']],
  ['bicarbonate', ['hco3']],
  ['calcium', ['ca']],
  ['magnesium', ['mg']],
  ['phosphate', ['po4', 'phosphorus']],
  ['glucose', ['sugar', 'bm']],
  ['osmolality', ['osmolarity']],
  ['uric acid', ['urate']],
  ['cholesterol', []],
  ['triglyceride', ['tg']],
  ['parathyroid', ['pth']],
  ['cortisol', []],
  ['lactate', ['lactic acid']],
  ['ammonia', ['nh3']],
  ['white blood cells (csf)', ['csf wbc']],
];

// Short terms are only accepted as whole words: "k" must not match "weak", and
// "pt" must not match "patient". Longer names can match inside a word so
// "hypernatremia" still finds sodium only when the full name appears.
const normalise = (text) => String(text || '')
  .toLowerCase()
  // Subscripts/superscripts the data uses (Na⁺, HCO₃⁻) are not typed by anyone.
  .replace(/[⁰-₟±²³¹⁺⁻]/g, '')
  .replace(/[^a-z0-9%\s.+-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function termsFor(row) {
  const name = String(row.name || '');
  const terms = new Set();
  // "Urea nitrogen (BUN)" → "urea nitrogen" and "bun".
  const inParens = [...name.matchAll(/\(([^)]+)\)/g)].map(m => m[1]);
  const bare = name.replace(/\([^)]*\)/g, ' ');
  // Only the part before the first comma is the lab's name. What follows is a
  // qualifier — "Cholesterol, total" is not a lab called "total", and matching
  // on it pulled cholesterol into any stem mentioning "total bilirubin".
  const head = normalise(bare.split(',')[0]);
  if (head.length >= 3) terms.add(head);
  for (const p of inParens) {
    // Only abbreviations count: "(LDH)", "(BUN)", "(Na⁺)". A bracket holding
    // ordinary words is a qualifier — "Calcium (total)" is not a lab called
    // "total", and matching on it pulled calcium into any stem with a total
    // bilirubin in it.
    if (/[a-z]/.test(p.replace(/[⁰-₟]/g, ''))) continue;
    const t = normalise(p);
    if (t) terms.add(t);
  }
  const lower = name.toLowerCase();
  for (const [fragment, extras] of EXTRA_TERMS) {
    if (lower.includes(fragment)) extras.forEach(e => terms.add(normalise(e)));
  }
  return [...terms].filter(Boolean);
}

function mentions(haystack, term, original) {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Three letters or fewer is an abbreviation, and lower case it is usually a
  // word or a unit: "mg/dL" is not magnesium, "a PT on the ward" is not a
  // prothrombin time, "weak" is not potassium. Those are only accepted when
  // the stem writes them as an abbreviation — in capitals.
  if (term.length <= 3) {
    return new RegExp(`(^|[^A-Za-z0-9])${escaped.toUpperCase()}($|[^A-Za-z0-9])`).test(original);
  }
  // Whole-word for the rest of the short ones; substring for real words, so
  // "hyponatremia" does not drag sodium in but "serum sodium" does.
  const pattern = term.length <= 5
    ? new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`)
    : new RegExp(`(^|[^a-z0-9])${escaped}`);
  return pattern.test(haystack);
}

/**
 * The rows `text` mentions, in the panel's own order.
 * @param {string} text   the question stem (and anything else worth scanning)
 * @param {Array}  rows   labValues[exam]
 */
export function labsMentionedIn(text, rows) {
  const original = String(text || '');
  const haystack = normalise(original);
  if (!haystack || !Array.isArray(rows)) return [];
  return rows.filter(row => termsFor(row).some(term => mentions(haystack, term, original)));
}
