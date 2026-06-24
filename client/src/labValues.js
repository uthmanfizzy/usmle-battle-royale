// Standard reference ranges - REVIEW for accuracy before relying on; ranges vary by source.
//
// Structured reference lab values for the in-game Lab Values panel.
// Shape:  { USMLE: [ { category, name, value, units } ... ], PLAB: [ ... ] }
//   - USMLE: conventional US units, based on the standard USMLE Step lab values sheet.
//   - PLAB:  UK / SI units, based on typical UK (PLAB / NICE / hospital) reference ranges.
//
// Designed to be easy to edit by hand and to layer admin editing on top later:
// each entry is a flat object, grouped only by its `category` string. To add a value,
// drop another { category, name, value, units } object into the relevant array.

const labValues = {
  // ─────────────────────────────────────────────────────────────────────────
  // USMLE — conventional (US) units, standard Step 1/2/3 lab values sheet
  // ─────────────────────────────────────────────────────────────────────────
  USMLE: [
    // Serum (electrolytes & chemistry)
    { category: 'Serum', name: 'Sodium (Na⁺)', value: '136–145', units: 'mEq/L' },
    { category: 'Serum', name: 'Potassium (K⁺)', value: '3.5–5.0', units: 'mEq/L' },
    { category: 'Serum', name: 'Chloride (Cl⁻)', value: '95–105', units: 'mEq/L' },
    { category: 'Serum', name: 'Bicarbonate (HCO₃⁻)', value: '22–28', units: 'mEq/L' },
    { category: 'Serum', name: 'Urea nitrogen (BUN)', value: '7–18', units: 'mg/dL' },
    { category: 'Serum', name: 'Creatinine', value: '0.6–1.2', units: 'mg/dL' },
    { category: 'Serum', name: 'Glucose (fasting)', value: '70–100', units: 'mg/dL' },
    { category: 'Serum', name: 'Calcium (total)', value: '8.4–10.2', units: 'mg/dL' },
    { category: 'Serum', name: 'Magnesium (Mg²⁺)', value: '1.5–2.0', units: 'mEq/L' },
    { category: 'Serum', name: 'Phosphate (PO₄³⁻)', value: '3.0–4.5', units: 'mg/dL' },
    { category: 'Serum', name: 'Osmolality', value: '275–295', units: 'mOsm/kg' },
    { category: 'Serum', name: 'Uric acid', value: '3.0–8.2', units: 'mg/dL' },
    { category: 'Serum', name: 'Total protein', value: '6.0–7.8', units: 'g/dL' },
    { category: 'Serum', name: 'Amylase', value: '25–125', units: 'U/L' },
    { category: 'Serum', name: 'Lipase', value: '14–280', units: 'U/L' },
    { category: 'Serum', name: 'CK (creatine kinase), male', value: '25–90', units: 'U/L' },
    { category: 'Serum', name: 'Troponin I', value: '0–0.04', units: 'ng/mL' },
    { category: 'Serum', name: 'Ferritin, male', value: '20–250', units: 'ng/mL' },
    { category: 'Serum', name: 'Ferritin, female', value: '10–120', units: 'ng/mL' },
    { category: 'Serum', name: 'Iron, male', value: '65–175', units: 'µg/dL' },
    { category: 'Serum', name: 'TIBC', value: '250–400', units: 'µg/dL' },

    // Lipids
    { category: 'Lipids', name: 'Cholesterol, total (desirable)', value: '< 200', units: 'mg/dL' },
    { category: 'Lipids', name: 'Triglycerides (normal)', value: '< 150', units: 'mg/dL' },
    { category: 'Lipids', name: 'HDL (low risk)', value: '> 60', units: 'mg/dL' },
    { category: 'Lipids', name: 'LDL (optimal)', value: '< 100', units: 'mg/dL' },

    // Liver function
    { category: 'Liver', name: 'AST (SGOT)', value: '8–40', units: 'U/L' },
    { category: 'Liver', name: 'ALT (SGPT)', value: '8–40', units: 'U/L' },
    { category: 'Liver', name: 'Alkaline phosphatase (ALP)', value: '25–100', units: 'U/L' },
    { category: 'Liver', name: 'Bilirubin, total', value: '0.1–1.0', units: 'mg/dL' },
    { category: 'Liver', name: 'Bilirubin, direct', value: '0.0–0.3', units: 'mg/dL' },
    { category: 'Liver', name: 'Albumin', value: '3.5–5.5', units: 'g/dL' },
    { category: 'Liver', name: 'γ-glutamyltransferase (GGT)', value: '8–61', units: 'U/L' },

    // Hematologic
    { category: 'Hematologic', name: 'Hemoglobin, male', value: '13.5–17.5', units: 'g/dL' },
    { category: 'Hematologic', name: 'Hemoglobin, female', value: '12.0–16.0', units: 'g/dL' },
    { category: 'Hematologic', name: 'Hematocrit, male', value: '41–53', units: '%' },
    { category: 'Hematologic', name: 'Hematocrit, female', value: '36–46', units: '%' },
    { category: 'Hematologic', name: 'WBC count', value: '4,500–11,000', units: '/mm³' },
    { category: 'Hematologic', name: 'Platelet count', value: '150,000–400,000', units: '/mm³' },
    { category: 'Hematologic', name: 'MCV', value: '80–100', units: 'fL' },
    { category: 'Hematologic', name: 'MCH', value: '27–31', units: 'pg/cell' },
    { category: 'Hematologic', name: 'MCHC', value: '32–36', units: 'g/dL' },
    { category: 'Hematologic', name: 'RDW', value: '11.5–14.5', units: '%' },
    { category: 'Hematologic', name: 'Reticulocyte count', value: '0.5–1.5', units: '%' },
    { category: 'Hematologic', name: 'ESR, male', value: '0–15', units: 'mm/hr' },
    { category: 'Hematologic', name: 'ESR, female', value: '0–20', units: 'mm/hr' },
    { category: 'Hematologic', name: 'PT (prothrombin time)', value: '11–15', units: 'sec' },
    { category: 'Hematologic', name: 'PTT (activated)', value: '25–40', units: 'sec' },
    { category: 'Hematologic', name: 'INR (normal)', value: '0.8–1.1', units: '' },
    { category: 'Hematologic', name: 'D-dimer', value: '< 0.5', units: 'µg/mL FEU' },

    // Endocrine
    { category: 'Endocrine', name: 'TSH', value: '0.4–4.0', units: 'µU/mL' },
    { category: 'Endocrine', name: 'Free T4', value: '0.9–1.7', units: 'ng/dL' },
    { category: 'Endocrine', name: 'Total T4', value: '5–12', units: 'µg/dL' },
    { category: 'Endocrine', name: 'Total T3', value: '100–200', units: 'ng/dL' },
    { category: 'Endocrine', name: 'HbA1c (normal)', value: '< 5.7', units: '%' },
    { category: 'Endocrine', name: 'Cortisol (AM, 8 a.m.)', value: '5–23', units: 'µg/dL' },
    { category: 'Endocrine', name: 'Cortisol (PM, 4 p.m.)', value: '3–15', units: 'µg/dL' },
    { category: 'Endocrine', name: '25-hydroxy vitamin D', value: '20–100', units: 'ng/mL' },
    { category: 'Endocrine', name: 'PTH (intact)', value: '10–60', units: 'pg/mL' },
    { category: 'Endocrine', name: 'Prolactin, female', value: '< 20', units: 'ng/mL' },

    // Arterial blood gas (ABG, room air)
    { category: 'ABG / Blood Gas', name: 'pH', value: '7.35–7.45', units: '' },
    { category: 'ABG / Blood Gas', name: 'PaO₂', value: '75–105', units: 'mmHg' },
    { category: 'ABG / Blood Gas', name: 'PaCO₂', value: '33–45', units: 'mmHg' },
    { category: 'ABG / Blood Gas', name: 'Bicarbonate (HCO₃⁻)', value: '22–28', units: 'mEq/L' },
    { category: 'ABG / Blood Gas', name: 'O₂ saturation', value: '95–100', units: '%' },
    { category: 'ABG / Blood Gas', name: 'Base excess', value: '−2 to +2', units: 'mEq/L' },

    // CSF
    { category: 'CSF', name: 'Opening pressure', value: '70–180', units: 'mmH₂O' },
    { category: 'CSF', name: 'Glucose', value: '40–70', units: 'mg/dL' },
    { category: 'CSF', name: 'Protein', value: '15–45', units: 'mg/dL' },
    { category: 'CSF', name: 'Cell count (WBC)', value: '0–5', units: 'cells/mm³' },
    { category: 'CSF', name: 'Chloride', value: '118–132', units: 'mEq/L' },

    // Urine
    { category: 'Urine', name: 'Specific gravity', value: '1.002–1.030', units: '' },
    { category: 'Urine', name: 'pH', value: '4.5–8.0', units: '' },
    { category: 'Urine', name: 'Osmolality', value: '50–1200', units: 'mOsm/kg' },
    { category: 'Urine', name: 'Protein (24 hr)', value: '< 150', units: 'mg/24h' },
    { category: 'Urine', name: 'Creatinine clearance, male', value: '97–137', units: 'mL/min' },
    { category: 'Urine', name: 'Creatinine clearance, female', value: '88–128', units: 'mL/min' },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // PLAB — UK / SI units, typical UK hospital reference ranges
  // ─────────────────────────────────────────────────────────────────────────
  PLAB: [
    // Serum (electrolytes & chemistry)
    { category: 'Serum', name: 'Sodium (Na⁺)', value: '135–145', units: 'mmol/L' },
    { category: 'Serum', name: 'Potassium (K⁺)', value: '3.5–5.0', units: 'mmol/L' },
    { category: 'Serum', name: 'Chloride (Cl⁻)', value: '95–105', units: 'mmol/L' },
    { category: 'Serum', name: 'Bicarbonate (HCO₃⁻)', value: '22–29', units: 'mmol/L' },
    { category: 'Serum', name: 'Urea', value: '2.5–7.8', units: 'mmol/L' },
    { category: 'Serum', name: 'Creatinine', value: '60–120', units: 'µmol/L' },
    { category: 'Serum', name: 'Glucose (fasting)', value: '3.9–5.6', units: 'mmol/L' },
    { category: 'Serum', name: 'Calcium (total, corrected)', value: '2.20–2.60', units: 'mmol/L' },
    { category: 'Serum', name: 'Magnesium (Mg²⁺)', value: '0.7–1.0', units: 'mmol/L' },
    { category: 'Serum', name: 'Phosphate (PO₄³⁻)', value: '0.8–1.5', units: 'mmol/L' },
    { category: 'Serum', name: 'Osmolality', value: '275–295', units: 'mOsm/kg' },
    { category: 'Serum', name: 'Urate (uric acid)', value: '0.18–0.48', units: 'mmol/L' },
    { category: 'Serum', name: 'Total protein', value: '60–80', units: 'g/L' },
    { category: 'Serum', name: 'Amylase', value: '25–125', units: 'U/L' },
    { category: 'Serum', name: 'CRP', value: '< 5', units: 'mg/L' },
    { category: 'Serum', name: 'CK (creatine kinase), male', value: '25–195', units: 'U/L' },
    { category: 'Serum', name: 'Troponin T (hs)', value: '< 14', units: 'ng/L' },
    { category: 'Serum', name: 'Ferritin, male', value: '20–250', units: 'µg/L' },
    { category: 'Serum', name: 'Ferritin, female', value: '10–120', units: 'µg/L' },
    { category: 'Serum', name: 'Iron', value: '12–30', units: 'µmol/L' },
    { category: 'Serum', name: 'TIBC', value: '45–80', units: 'µmol/L' },

    // Lipids
    { category: 'Lipids', name: 'Cholesterol, total (target)', value: '< 5.0', units: 'mmol/L' },
    { category: 'Lipids', name: 'Triglycerides (fasting)', value: '< 1.7', units: 'mmol/L' },
    { category: 'Lipids', name: 'HDL cholesterol (male)', value: '> 1.0', units: 'mmol/L' },
    { category: 'Lipids', name: 'LDL cholesterol (target)', value: '< 3.0', units: 'mmol/L' },

    // Liver function
    { category: 'Liver', name: 'AST', value: '10–40', units: 'U/L' },
    { category: 'Liver', name: 'ALT', value: '10–45', units: 'U/L' },
    { category: 'Liver', name: 'Alkaline phosphatase (ALP)', value: '30–130', units: 'U/L' },
    { category: 'Liver', name: 'Bilirubin, total', value: '3–17', units: 'µmol/L' },
    { category: 'Liver', name: 'Albumin', value: '35–50', units: 'g/L' },
    { category: 'Liver', name: 'γ-glutamyltransferase (GGT)', value: '10–55', units: 'U/L' },

    // Hematologic
    { category: 'Hematologic', name: 'Haemoglobin, male', value: '135–175', units: 'g/L' },
    { category: 'Hematologic', name: 'Haemoglobin, female', value: '115–160', units: 'g/L' },
    { category: 'Hematologic', name: 'Haematocrit, male', value: '0.40–0.54', units: 'L/L' },
    { category: 'Hematologic', name: 'Haematocrit, female', value: '0.37–0.47', units: 'L/L' },
    { category: 'Hematologic', name: 'White cell count', value: '4.0–11.0', units: '×10⁹/L' },
    { category: 'Hematologic', name: 'Platelet count', value: '150–400', units: '×10⁹/L' },
    { category: 'Hematologic', name: 'MCV', value: '80–100', units: 'fL' },
    { category: 'Hematologic', name: 'MCH', value: '27–32', units: 'pg' },
    { category: 'Hematologic', name: 'MCHC', value: '320–360', units: 'g/L' },
    { category: 'Hematologic', name: 'Neutrophils', value: '2.0–7.5', units: '×10⁹/L' },
    { category: 'Hematologic', name: 'Lymphocytes', value: '1.0–4.0', units: '×10⁹/L' },
    { category: 'Hematologic', name: 'Reticulocytes', value: '0.5–2.5', units: '%' },
    { category: 'Hematologic', name: 'ESR (age/2, approx.)', value: '0–20', units: 'mm/hr' },
    { category: 'Hematologic', name: 'PT (prothrombin time)', value: '11–14', units: 'sec' },
    { category: 'Hematologic', name: 'APTT', value: '25–38', units: 'sec' },
    { category: 'Hematologic', name: 'INR (normal)', value: '0.8–1.1', units: '' },
    { category: 'Hematologic', name: 'Fibrinogen', value: '1.5–4.0', units: 'g/L' },
    { category: 'Hematologic', name: 'D-dimer', value: '< 500', units: 'ng/mL' },

    // Endocrine
    { category: 'Endocrine', name: 'TSH', value: '0.4–4.0', units: 'mU/L' },
    { category: 'Endocrine', name: 'Free T4', value: '9–25', units: 'pmol/L' },
    { category: 'Endocrine', name: 'Free T3', value: '3.5–7.8', units: 'pmol/L' },
    { category: 'Endocrine', name: 'HbA1c (normal)', value: '< 42 (< 6.0%)', units: 'mmol/mol' },
    { category: 'Endocrine', name: 'Cortisol (9 a.m.)', value: '140–700', units: 'nmol/L' },
    { category: 'Endocrine', name: 'Vitamin D (25-OH)', value: '> 50', units: 'nmol/L' },
    { category: 'Endocrine', name: 'PTH (intact)', value: '1.6–6.9', units: 'pmol/L' },
    { category: 'Endocrine', name: 'Prolactin, female', value: '< 500', units: 'mU/L' },

    // Arterial blood gas (ABG, room air)
    { category: 'ABG / Blood Gas', name: 'pH', value: '7.35–7.45', units: '' },
    { category: 'ABG / Blood Gas', name: 'PaO₂', value: '11–13', units: 'kPa' },
    { category: 'ABG / Blood Gas', name: 'PaCO₂', value: '4.7–6.0', units: 'kPa' },
    { category: 'ABG / Blood Gas', name: 'Bicarbonate (HCO₃⁻)', value: '22–26', units: 'mmol/L' },
    { category: 'ABG / Blood Gas', name: 'O₂ saturation', value: '95–100', units: '%' },
    { category: 'ABG / Blood Gas', name: 'Base excess', value: '−2 to +2', units: 'mmol/L' },

    // CSF
    { category: 'CSF', name: 'Opening pressure', value: '7–18', units: 'cmH₂O' },
    { category: 'CSF', name: 'Glucose', value: '2.2–3.9', units: 'mmol/L' },
    { category: 'CSF', name: 'Protein', value: '0.15–0.45', units: 'g/L' },
    { category: 'CSF', name: 'Cell count (WBC)', value: '0–5', units: 'cells/mm³' },

    // Urine
    { category: 'Urine', name: 'Specific gravity', value: '1.002–1.030', units: '' },
    { category: 'Urine', name: 'pH', value: '4.5–8.0', units: '' },
    { category: 'Urine', name: 'Osmolality', value: '50–1200', units: 'mOsm/kg' },
    { category: 'Urine', name: 'Protein (24 hr)', value: '< 0.15', units: 'g/24h' },
    { category: 'Urine', name: 'Albumin:creatinine ratio (ACR)', value: '< 3.0', units: 'mg/mmol' },
    { category: 'Urine', name: 'eGFR (normal)', value: '> 90', units: 'mL/min/1.73m²' },
  ],
};

export default labValues;
