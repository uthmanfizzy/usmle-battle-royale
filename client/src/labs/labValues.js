/**
 * Lab values a USMLE candidate is expected to know cold.
 *
 * Ranges follow the NBME / USMLE laboratory values sheet where it gives one;
 * a few ubiquitous cut-offs it does not list (HbA1c, triglycerides) use the
 * standard clinical threshold. Textbooks differ by a unit or two, which is
 * why grading uses a tolerance (see gradeBound) rather than exact equality.
 *
 *   kind: 'range' — the player gives a low and a high bound
 *         'max'   — normal is "below X": one box, the upper limit
 *         'min'   — normal is "at least X": one box, the lower limit
 *   tol:   absolute tolerance per bound. Omit to use the default
 *          (15 % of the range width, never less than 3 % of the value).
 *   scale: an alternative scale also accepted (WBC 4.5 for 4,500 when
 *          the player thinks in ×10³).
 */

export const CATEGORIES = {
  chem:  { name: 'Serum chemistry', icon: '🧪', accent: '46, 170, 120' },
  liver: { name: 'Liver & enzymes', icon: '🫀', accent: '226, 158, 32' },
  endo:  { name: 'Endocrine & iron', icon: '🦋', accent: '150, 106, 232' },
  heme:  { name: 'Hematology', icon: '🩸', accent: '214, 54, 60' },
  abg:   { name: 'Arterial blood gas', icon: '🫁', accent: '42, 160, 196' },
  csf:   { name: 'CSF', icon: '🧠', accent: '211, 83, 158' },
  urine: { name: 'Urine & other', icon: '💧', accent: '232, 196, 60' },
};

export const LABS = [
  // ── Serum chemistry ───────────────────────────────────────────────────
  { id: 'na', cat: 'chem', name: 'Sodium (Na⁺)', unit: 'mEq/L', kind: 'range', low: 136, high: 146,
    note: 'Hyponatremia below 136 — SIADH, thiazides, psychogenic polydipsia. Correct slowly (osmotic demyelination).' },
  { id: 'k', cat: 'chem', name: 'Potassium (K⁺)', unit: 'mEq/L', kind: 'range', low: 3.5, high: 5.0,
    note: 'Hyperkalemia → peaked T waves; first give calcium gluconate to stabilise the membrane.' },
  { id: 'cl', cat: 'chem', name: 'Chloride (Cl⁻)', unit: 'mEq/L', kind: 'range', low: 95, high: 105,
    note: 'Needed for the anion gap: Na⁺ − (Cl⁻ + HCO₃⁻).' },
  { id: 'hco3', cat: 'chem', name: 'Bicarbonate (HCO₃⁻)', unit: 'mEq/L', kind: 'range', low: 22, high: 28,
    note: 'Low HCO₃⁻ = metabolic acidosis (or compensation for respiratory alkalosis).' },
  { id: 'bun', cat: 'chem', name: 'Blood urea nitrogen (BUN)', unit: 'mg/dL', kind: 'range', low: 7, high: 18,
    note: 'BUN:Cr > 20 suggests prerenal azotemia; also rises with upper GI bleeding.' },
  { id: 'cr', cat: 'chem', name: 'Creatinine', unit: 'mg/dL', kind: 'range', low: 0.6, high: 1.2, tol: 0.1,
    note: 'Depends on muscle mass — a "normal" creatinine can hide low GFR in the elderly.' },
  { id: 'glu', cat: 'chem', name: 'Glucose (fasting)', unit: 'mg/dL', kind: 'range', low: 70, high: 100,
    note: 'Fasting ≥ 126 on two occasions = diabetes; 100–125 = impaired fasting glucose.' },
  { id: 'ca', cat: 'chem', name: 'Calcium (total)', unit: 'mg/dL', kind: 'range', low: 8.4, high: 10.2, tol: 0.3,
    note: 'Correct for albumin: add 0.8 mg/dL for every 1 g/dL albumin below 4.' },
  { id: 'mg', cat: 'chem', name: 'Magnesium', unit: 'mg/dL', kind: 'range', low: 1.5, high: 2.0, tol: 0.2,
    note: 'Hypomagnesemia causes refractory hypokalemia and hypocalcemia (↓ PTH release).' },
  { id: 'phos', cat: 'chem', name: 'Phosphorus', unit: 'mg/dL', kind: 'range', low: 3.0, high: 4.5, tol: 0.3,
    note: 'High in CKD and hypoparathyroidism; low in refeeding syndrome.' },
  { id: 'osm', cat: 'chem', name: 'Serum osmolality', unit: 'mOsm/kg H₂O', kind: 'range', low: 275, high: 295,
    note: '2·Na⁺ + glucose/18 + BUN/2.8. Osmolal gap > 10 → toxic alcohol.' },
  { id: 'urate', cat: 'chem', name: 'Uric acid', unit: 'mg/dL', kind: 'range', low: 3.0, high: 8.2, tol: 0.5,
    note: 'Can be normal during an acute gout flare — diagnose with crystals, not the level.' },
  { id: 'alb', cat: 'chem', name: 'Albumin', unit: 'g/dL', kind: 'range', low: 3.5, high: 5.5, tol: 0.3,
    note: 'Half-life ~20 days, so it reflects chronic, not acute, liver synthetic function.' },
  { id: 'tp', cat: 'chem', name: 'Total protein', unit: 'g/dL', kind: 'range', low: 6.0, high: 7.8, tol: 0.3,
    note: 'Protein–albumin gap > 4 → think multiple myeloma.' },
  { id: 'a1c', cat: 'chem', name: 'Hemoglobin A1c', unit: '%', kind: 'max', high: 5.7, tol: 0.3,
    note: '5.7–6.4 % = prediabetes; ≥ 6.5 % = diabetes.' },
  { id: 'chol', cat: 'chem', name: 'Total cholesterol', unit: 'mg/dL', kind: 'max', high: 200,
    note: 'Desirable < 200 mg/dL.' },
  { id: 'tg', cat: 'chem', name: 'Triglycerides (fasting)', unit: 'mg/dL', kind: 'max', high: 150,
    note: 'TG > 1000 mg/dL risks acute pancreatitis.' },
  { id: 'hdl', cat: 'chem', name: 'HDL cholesterol', unit: 'mg/dL', kind: 'min', low: 40,
    note: 'HDL < 40 is a cardiovascular risk factor; ≥ 60 is protective.' },

  // ── Liver & enzymes ──────────────────────────────────────────────────
  { id: 'alt', cat: 'liver', name: 'ALT', unit: 'U/L', kind: 'range', low: 10, high: 40,
    note: 'More liver-specific than AST. AST:ALT > 2 suggests alcoholic liver disease.' },
  { id: 'ast', cat: 'liver', name: 'AST', unit: 'U/L', kind: 'range', low: 12, high: 38,
    note: 'Also found in muscle and RBCs — rises in rhabdomyolysis and hemolysis.' },
  { id: 'alp', cat: 'liver', name: 'Alkaline phosphatase', unit: 'U/L', kind: 'range', low: 25, high: 100,
    note: 'High with ↑ GGT = biliary; high with normal GGT = bone (Paget, osteoblastic mets).' },
  { id: 'tbili', cat: 'liver', name: 'Bilirubin, total', unit: 'mg/dL', kind: 'range', low: 0.1, high: 1.0, tol: 0.15,
    note: 'Jaundice is visible at ~2.5–3 mg/dL; scleral icterus first.' },
  { id: 'dbili', cat: 'liver', name: 'Bilirubin, direct', unit: 'mg/dL', kind: 'range', low: 0.0, high: 0.3, tol: 0.1,
    note: 'Conjugated hyperbilirubinemia → urine bilirubin positive (Dubin–Johnson, obstruction).' },
  { id: 'amy', cat: 'liver', name: 'Amylase', unit: 'U/L', kind: 'range', low: 25, high: 125,
    note: 'Lipase is more specific for pancreatitis; > 3× ULN supports the diagnosis.' },
  { id: 'ldh', cat: 'liver', name: 'Lactate dehydrogenase (LDH)', unit: 'U/L', kind: 'range', low: 45, high: 200,
    note: 'Elevated in hemolysis, tumour lysis and Pneumocystis pneumonia.' },
  { id: 'ckm', cat: 'liver', name: 'Creatine kinase (male)', unit: 'U/L', kind: 'range', low: 25, high: 90,
    note: 'Massive rise in rhabdomyolysis; CK-MB for myocardial reinfarction.' },
  { id: 'ckf', cat: 'liver', name: 'Creatine kinase (female)', unit: 'U/L', kind: 'range', low: 10, high: 70,
    note: 'Statin myopathy: check CK if muscle pain develops.' },

  // ── Endocrine & iron ─────────────────────────────────────────────────
  { id: 'tsh', cat: 'endo', name: 'TSH', unit: 'μU/mL', kind: 'range', low: 0.4, high: 4.0, tol: 0.3,
    note: 'Best single screening test for primary thyroid disease.' },
  { id: 'ft4', cat: 'endo', name: 'Free T₄', unit: 'ng/dL', kind: 'range', low: 0.9, high: 1.7, tol: 0.15,
    note: 'Low TSH + low free T₄ → central (secondary) hypothyroidism.' },
  { id: 'cort', cat: 'endo', name: 'Cortisol (0800 h)', unit: 'μg/dL', kind: 'range', low: 5, high: 23, tol: 2,
    note: 'Diurnal: highest in the morning. Screen Cushing with late-night salivary cortisol or 1 mg dex suppression.' },
  { id: 'pth', cat: 'endo', name: 'Parathyroid hormone (PTH)', unit: 'pg/mL', kind: 'range', low: 10, high: 65, tol: 5,
    note: 'High Ca²⁺ with an inappropriately normal/high PTH = primary hyperparathyroidism.' },
  { id: 'fe', cat: 'endo', name: 'Iron (serum)', unit: 'μg/dL', kind: 'range', low: 50, high: 170, tol: 15,
    note: 'Iron deficiency: ↓ iron, ↑ TIBC, ↓ ferritin. Chronic disease: ↓ iron, ↓ TIBC, ↑ ferritin.' },
  { id: 'tibc', cat: 'endo', name: 'Total iron-binding capacity (TIBC)', unit: 'μg/dL', kind: 'range', low: 250, high: 400, tol: 25,
    note: 'Rises when iron stores are low (more transferrin made).' },
  { id: 'ferm', cat: 'endo', name: 'Ferritin (male)', unit: 'ng/mL', kind: 'range', low: 20, high: 250, tol: 15,
    note: 'Acute-phase reactant — can be falsely normal with inflammation.' },
  { id: 'ferf', cat: 'endo', name: 'Ferritin (female)', unit: 'ng/mL', kind: 'range', low: 10, high: 120, tol: 10,
    note: 'Ferritin < 15 ng/mL is essentially diagnostic of iron deficiency.' },
  { id: 'b12', cat: 'endo', name: 'Vitamin B₁₂', unit: 'pg/mL', kind: 'range', low: 200, high: 800, tol: 50,
    note: 'Borderline B₁₂? Check methylmalonic acid — raised in B₁₂ but not folate deficiency.' },

  // ── Hematology ───────────────────────────────────────────────────────
  { id: 'hbm', cat: 'heme', name: 'Hemoglobin (male)', unit: 'g/dL', kind: 'range', low: 13.5, high: 17.5, tol: 0.5,
    note: 'Anemia below 13.5 g/dL in men.' },
  { id: 'hbf', cat: 'heme', name: 'Hemoglobin (female)', unit: 'g/dL', kind: 'range', low: 12.0, high: 16.0, tol: 0.5,
    note: 'Physiologic dilutional drop in pregnancy.' },
  { id: 'hctm', cat: 'heme', name: 'Hematocrit (male)', unit: '%', kind: 'range', low: 41, high: 53, tol: 2,
    note: 'Roughly 3 × hemoglobin.' },
  { id: 'hctf', cat: 'heme', name: 'Hematocrit (female)', unit: '%', kind: 'range', low: 36, high: 46, tol: 2,
    note: 'Polycythemia vera: high Hct with low EPO and JAK2 V617F.' },
  { id: 'wbc', cat: 'heme', name: 'Leukocyte count (WBC)', unit: '/mm³', kind: 'range', low: 4500, high: 11000, tol: 500, scale: 1000,
    note: 'Leukemoid reaction > 50,000 with high LAP score (vs. low LAP in CML).' },
  { id: 'plt', cat: 'heme', name: 'Platelet count', unit: '/mm³', kind: 'range', low: 150000, high: 400000, tol: 20000, scale: 1000,
    note: 'Spontaneous bleeding risk below ~20,000; petechiae typical of platelet problems.' },
  { id: 'mcv', cat: 'heme', name: 'Mean corpuscular volume (MCV)', unit: 'fL', kind: 'range', low: 80, high: 100, tol: 3,
    note: 'Microcytic < 80: iron deficiency, thalassemia, chronic disease, sideroblastic, lead.' },
  { id: 'mchc', cat: 'heme', name: 'MCHC', unit: '% Hb/cell', kind: 'range', low: 31, high: 36, tol: 1,
    note: 'Raised MCHC → hereditary spherocytosis.' },
  { id: 'rdw', cat: 'heme', name: 'Red cell distribution width (RDW)', unit: '%', kind: 'max', high: 14.5, tol: 0.7,
    note: 'High RDW in iron deficiency; normal RDW in thalassemia trait.' },
  { id: 'retic', cat: 'heme', name: 'Reticulocyte count', unit: '% of RBCs', kind: 'range', low: 0.5, high: 1.5, tol: 0.2,
    note: 'Correct for anemia: retic × Hct/45. Index < 2 = hypoproliferative.' },
  { id: 'neut', cat: 'heme', name: 'Neutrophils (segmented)', unit: '% of WBC', kind: 'range', low: 54, high: 62, tol: 3,
    note: 'Absolute neutrophil count < 500 = severe neutropenia (febrile neutropenia risk).' },
  { id: 'lymph', cat: 'heme', name: 'Lymphocytes', unit: '% of WBC', kind: 'range', low: 25, high: 33, tol: 3,
    note: 'Atypical lymphocytes → EBV mononucleosis.' },
  { id: 'eos', cat: 'heme', name: 'Eosinophils', unit: '% of WBC', kind: 'range', low: 1, high: 3, tol: 1,
    note: 'Eosinophilia: NAACP — neoplasia, asthma, allergy, Addison (adrenal insufficiency), collagen vascular, parasites.' },
  { id: 'cd4', cat: 'heme', name: 'CD4⁺ T-cell count', unit: 'cells/mm³', kind: 'min', low: 500, tol: 50,
    note: '< 200 defines AIDS → start PCP prophylaxis (TMP-SMX).' },
  { id: 'pt', cat: 'heme', name: 'Prothrombin time (PT)', unit: 'seconds', kind: 'range', low: 11, high: 15, tol: 1,
    note: 'Extrinsic pathway (factor VII) — warfarin, vitamin K deficiency, liver disease.' },
  { id: 'ptt', cat: 'heme', name: 'Partial thromboplastin time (aPTT)', unit: 'seconds', kind: 'range', low: 25, high: 40, tol: 3,
    note: 'Intrinsic pathway — heparin, hemophilia A/B, von Willebrand, antiphospholipid.' },
  { id: 'bt', cat: 'heme', name: 'Bleeding time', unit: 'minutes', kind: 'range', low: 2, high: 7, tol: 1,
    note: 'Prolonged with platelet dysfunction (vWD, Bernard–Soulier, Glanzmann, aspirin, uremia).' },
  { id: 'fib', cat: 'heme', name: 'Fibrinogen', unit: 'mg/dL', kind: 'range', low: 200, high: 400, tol: 25,
    note: 'Falls in DIC (consumed) along with platelets, while PT/aPTT/D-dimer rise.' },
  { id: 'esrm', cat: 'heme', name: 'ESR (male, Westergren)', unit: 'mm/h', kind: 'max', high: 15, tol: 2,
    note: 'Very high (> 100) in giant cell arteritis, multiple myeloma, osteomyelitis.' },
  { id: 'esrf', cat: 'heme', name: 'ESR (female, Westergren)', unit: 'mm/h', kind: 'max', high: 20, tol: 2,
    note: 'Low ESR in sickle cell disease and polycythemia.' },

  // ── Arterial blood gas ──────────────────────────────────────────────
  { id: 'ph', cat: 'abg', name: 'pH (arterial)', unit: '', kind: 'range', low: 7.35, high: 7.45, tol: 0.02,
    note: 'Below 7.35 = acidemia; above 7.45 = alkalemia.' },
  { id: 'pco2', cat: 'abg', name: 'PaCO₂', unit: 'mm Hg', kind: 'range', low: 33, high: 45, tol: 3,
    note: 'Winter formula: expected PaCO₂ = 1.5·HCO₃⁻ + 8 ± 2 in metabolic acidosis.' },
  { id: 'po2', cat: 'abg', name: 'PaO₂', unit: 'mm Hg', kind: 'range', low: 75, high: 105, tol: 5,
    note: 'A–a gradient ≈ age/4 + 4. Normal gradient + hypoxemia → hypoventilation or altitude.' },
  { id: 'abghco3', cat: 'abg', name: 'HCO₃⁻ (arterial)', unit: 'mEq/L', kind: 'range', low: 22, high: 28, tol: 1,
    note: 'Renal compensation takes days — an acute respiratory change barely moves it.' },

  // ── CSF ─────────────────────────────────────────────────────────────
  { id: 'csfglu', cat: 'csf', name: 'CSF glucose', unit: 'mg/dL', kind: 'range', low: 40, high: 70, tol: 5,
    note: 'Low in bacterial, fungal and TB meningitis; normal in viral.' },
  { id: 'csfprot', cat: 'csf', name: 'CSF protein', unit: 'mg/dL', kind: 'max', high: 40, tol: 5,
    note: 'Albuminocytologic dissociation (↑ protein, normal cells) → Guillain–Barré.' },
  { id: 'csfcell', cat: 'csf', name: 'CSF cell count', unit: 'cells/mm³', kind: 'max', high: 5, tol: 1,
    note: 'Neutrophils = bacterial; lymphocytes = viral, fungal or TB.' },
  { id: 'csfop', cat: 'csf', name: 'CSF opening pressure', unit: 'mm H₂O', kind: 'range', low: 70, high: 180, tol: 15,
    note: 'Raised in idiopathic intracranial hypertension (obese young woman, papilledema).' },

  // ── Urine & other ───────────────────────────────────────────────────
  { id: 'uprot', cat: 'urine', name: 'Urine protein (24 h)', unit: 'mg/24 h', kind: 'max', high: 150, tol: 20,
    note: 'Nephrotic range > 3.5 g/24 h.' },
  { id: 'crclm', cat: 'urine', name: 'Creatinine clearance (male)', unit: 'mL/min', kind: 'range', low: 97, high: 137, tol: 8,
    note: 'Overestimates GFR slightly because creatinine is also secreted.' },
  { id: 'crclf', cat: 'urine', name: 'Creatinine clearance (female)', unit: 'mL/min', kind: 'range', low: 88, high: 128, tol: 8,
    note: 'GFR rises ~50 % in pregnancy.' },
  { id: 'uosm', cat: 'urine', name: 'Urine osmolality', unit: 'mOsm/kg H₂O', kind: 'range', low: 50, high: 1200, tol: 100,
    note: 'Fails to concentrate after water deprivation → diabetes insipidus; then desmopressin to tell central from nephrogenic.' },
  { id: 'sweat', cat: 'urine', name: 'Sweat chloride', unit: 'mmol/L', kind: 'max', high: 60, tol: 5,
    note: '≥ 60 mmol/L on two occasions supports cystic fibrosis.' },
];

/** Tolerance for one bound of a lab. */
export function tolFor(lab, truth) {
  if (lab.tol != null) return lab.tol;
  const width = lab.kind === 'range' ? lab.high - lab.low : Math.abs(truth);
  return Math.max(width * 0.15, Math.abs(truth) * 0.03);
}

/** Parse what the player typed: "150,000", "150 000", "4.5k" → number or NaN. */
export function parseNum(s) {
  if (s == null) return NaN;
  let t = String(s).trim().toLowerCase().replace(/[,\s]/g, '');
  let mult = 1;
  if (t.endsWith('k')) { mult = 1000; t = t.slice(0, -1); }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Number(t) * mult;
}

/**
 * Grade one bound: 'exact' within tolerance, 'close' within 3× tolerance,
 * otherwise 'miss'. A lab with `scale` also accepts the guess × scale, so
 * "4.5" counts for a WBC of 4,500.
 */
export function gradeBound(lab, guess, truth) {
  if (!Number.isFinite(guess)) return 'miss';
  const tol = tolFor(lab, truth);
  const tries = [guess];
  if (lab.scale) tries.push(guess * lab.scale);
  let best = Infinity;
  for (const g of tries) best = Math.min(best, Math.abs(g - truth));
  if (best <= tol + 1e-9) return 'exact';
  if (best <= tol * 3 + 1e-9) return 'close';
  return 'miss';
}

/** Format a reference value the way the sheet prints it. */
export function fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-US');
  return String(n);
}

export function rangeText(lab) {
  const u = lab.unit ? ` ${lab.unit}` : '';
  if (lab.kind === 'max') return `< ${fmt(lab.high)}${u}`;
  if (lab.kind === 'min') return `≥ ${fmt(lab.low)}${u}`;
  return `${fmt(lab.low)}–${fmt(lab.high)}${u}`;
}
