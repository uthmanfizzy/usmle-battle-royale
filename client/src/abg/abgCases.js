/**
 * The ABG Reader's cases.
 *
 * Each is a short clinical vignette and the measured values — NOT the pH,
 * which abgEngine computes from HCO₃⁻ and PaCO₂ so the gas is internally
 * consistent. `intended` says what the gas is meant to show; the
 * verification check derives every step with abgEngine and fails if the
 * derivation lands anywhere else, or within reach of a threshold (a case
 * that hangs on ± 0.5 of a cut-off is a coin toss, not a question).
 *
 * `timing` is the history's verdict on how long a respiratory disturbance
 * has run — the one thing the numbers cannot tell you on their own.
 *
 * Cause options are curated like the ECG Reader's distractors: the
 * alternatives worth ruling out, each with the reason it does not fit.
 */
export const ABG_CASES = [
  // ── Single disorders ───────────────────────────────────────────────────
  {
    id: 'dka',
    level: 'single',
    title: 'Sighing breaths',
    vignette: 'A 19-year-old with type 1 diabetes has vomited for a day and has abdominal pain. She is breathing deeply and quickly. Glucose 540 mg/dL, urine ketones 3+.',
    values: { PaCO2: 20, HCO3: 8, PaO2: 104, Na: 134, Cl: 98 },
    extra: [{ label: 'Glucose', value: '540 mg/dL', flag: 'H' }, { label: 'K⁺', value: '5.6 mmol/L', flag: 'H' }, { label: 'Ketones', value: '3+', flag: 'H' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Diabetic ketoacidosis',
      options: ['Diabetic ketoacidosis', 'Lactic acidosis', 'Salicylate poisoning', 'Diarrhoea'],
      why: 'Hyperglycaemia and ketonuria with a high-gap acidosis. The deep, rapid (Kussmaul) breathing is the respiratory compensation you just checked with Winter’s formula.',
      not: {
        'Lactic acidosis': 'There is no shock or hypoperfusion, and the ketones and glucose explain the gap.',
        'Salicylate poisoning': 'Salicylates cause an added respiratory alkalosis — here the PaCO₂ is exactly what Winter’s predicts.',
        'Diarrhoea': 'Diarrhoea loses bicarbonate and gives a NORMAL anion gap. This gap is 28.',
      },
    },
  },
  {
    id: 'lactic',
    level: 'single',
    title: 'Warm and hypotensive',
    vignette: 'A 68-year-old with pneumonia is confused, febrile and hypotensive (78/40) despite fluids. Lactate 6.8 mmol/L.',
    values: { PaCO2: 29, HCO3: 14, PaO2: 62, Na: 140, Cl: 104 },
    extra: [{ label: 'Lactate', value: '6.8 mmol/L', flag: 'H' }, { label: 'Glucose', value: '142 mg/dL' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Lactic acidosis (septic shock)',
      options: ['Lactic acidosis (septic shock)', 'Diabetic ketoacidosis', 'Ethylene glycol poisoning', 'Uraemia'],
      why: 'Tissue hypoperfusion drives anaerobic metabolism; the lactate accounts for the gap. Treat the shock — fluids, vasopressors, antibiotics.',
      not: {
        'Diabetic ketoacidosis': 'The glucose is only mildly raised and there is no ketosis.',
        'Ethylene glycol poisoning': 'No history of ingestion, and the lactate already explains the gap.',
        'Uraemia': 'There is no renal failure here, and uraemia rarely produces a gap this large on its own.',
      },
    },
  },
  {
    id: 'diarrhoea',
    level: 'single',
    title: 'A week of diarrhoea',
    vignette: 'A 34-year-old returned from travel with a week of profuse watery diarrhoea. Dry mucous membranes; BP 104/66.',
    values: { PaCO2: 30, HCO3: 15, PaO2: 98, Na: 138, Cl: 113 },
    extra: [{ label: 'K⁺', value: '3.1 mmol/L', flag: 'L' }, { label: 'Urine AG', value: 'negative' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'normal' },
    cause: {
      answer: 'Diarrhoea (GI bicarbonate loss)',
      options: ['Diarrhoea (GI bicarbonate loss)', 'Distal (type 1) RTA', 'Diabetic ketoacidosis', 'Vomiting'],
      why: 'Stool is rich in bicarbonate; losing it leaves a hyperchloraemic, normal-gap acidosis. The negative urine anion gap shows the kidney is excreting acid normally.',
      not: {
        'Distal (type 1) RTA': 'In distal RTA the kidney cannot excrete acid — the urine anion gap is positive, not negative.',
        'Diabetic ketoacidosis': 'DKA gives a HIGH anion gap. This one is 10.',
        'Vomiting': 'Vomiting loses acid, causing a metabolic ALKALOSIS.',
      },
    },
  },
  {
    id: 'rta1',
    level: 'single',
    title: 'Stones and weakness',
    vignette: 'A 41-year-old with Sjögren syndrome has recurrent kidney stones and muscle weakness. Urine pH 6.5 despite the acidaemia.',
    values: { PaCO2: 32, HCO3: 16, PaO2: 96, Na: 139, Cl: 112 },
    extra: [{ label: 'K⁺', value: '2.8 mmol/L', flag: 'L' }, { label: 'Urine pH', value: '6.5', flag: 'H' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'normal' },
    cause: {
      answer: 'Distal (type 1) RTA',
      options: ['Distal (type 1) RTA', 'Proximal (type 2) RTA', 'Type 4 RTA (hypoaldosteronism)', 'Diarrhoea (GI bicarbonate loss)'],
      why: 'The collecting duct cannot secrete H⁺, so the urine stays alkaline (pH > 5.5) even in acidaemia. Hypokalaemia, stones and nephrocalcinosis follow; Sjögren is a classic cause.',
      not: {
        'Proximal (type 2) RTA': 'Proximal RTA can still acidify the urine once the bicarbonate is low — urine pH falls below 5.5. And stones are not a feature.',
        'Type 4 RTA (hypoaldosteronism)': 'Type 4 causes HYPERkalaemia. The potassium here is low.',
        'Diarrhoea (GI bicarbonate loss)': 'With diarrhoea the kidney acidifies the urine appropriately. A urine pH of 6.5 in acidaemia is renal.',
      },
    },
  },
  {
    id: 'vomiting',
    level: 'single',
    title: 'Pyloric obstruction',
    vignette: 'A 58-year-old with a gastric outlet obstruction has vomited repeatedly for four days.',
    values: { PaCO2: 46, HCO3: 36, PaO2: 88, Na: 138, Cl: 90 },
    extra: [{ label: 'K⁺', value: '2.9 mmol/L', flag: 'L' }, { label: 'Urine Cl⁻', value: '8 mmol/L', flag: 'L' }],
    intended: { phStatus: 'alkalaemia', primary: 'met-alkalosis', comp: 'appropriate', agClass: 'normal' },
    cause: {
      answer: 'Vomiting (loss of gastric acid)',
      options: ['Vomiting (loss of gastric acid)', 'Primary hyperaldosteronism', 'Loop diuretic use', 'Milk-alkali syndrome'],
      why: 'Losing HCl generates bicarbonate, and volume depletion keeps the kidney from excreting it. A LOW urine chloride marks it saline-responsive — it corrects with IV saline and potassium.',
      not: {
        'Primary hyperaldosteronism': 'That alkalosis is saline-resistant with a HIGH urine chloride and hypertension.',
        'Loop diuretic use': 'Diuretics push chloride into the urine — urine Cl⁻ would be high while they are acting.',
        'Milk-alkali syndrome': 'That needs calcium and alkali ingestion, with hypercalcaemia.',
      },
    },
  },
  {
    id: 'conn',
    level: 'single',
    title: 'Resistant hypertension',
    vignette: 'A 45-year-old has hypertension resistant to three drugs, and cramps. BP 172/104. No vomiting, no diuretics.',
    values: { PaCO2: 43, HCO3: 31, PaO2: 92, Na: 144, Cl: 101 },
    extra: [{ label: 'K⁺', value: '2.7 mmol/L', flag: 'L' }, { label: 'Urine Cl⁻', value: '45 mmol/L', flag: 'H' }],
    intended: { phStatus: 'alkalaemia', primary: 'met-alkalosis', comp: 'appropriate', agClass: 'normal' },
    cause: {
      answer: 'Primary hyperaldosteronism',
      options: ['Primary hyperaldosteronism', 'Vomiting (loss of gastric acid)', 'Loop diuretic use', 'Bartter syndrome'],
      why: 'Aldosterone drives Na⁺ retention and H⁺/K⁺ loss in the collecting duct: hypertension, hypokalaemia, and a saline-RESISTANT alkalosis (urine Cl⁻ high). Check the aldosterone-to-renin ratio.',
      not: {
        'Vomiting (loss of gastric acid)': 'Vomiting gives a LOW urine chloride and no hypertension.',
        'Loop diuretic use': 'Excluded by the history — and diuretics would not cause hypertension.',
        'Bartter syndrome': 'Bartter is a salt-wasting tubulopathy with NORMAL or low blood pressure.',
      },
    },
  },
  {
    id: 'opioid',
    level: 'single',
    title: 'Found unresponsive',
    vignette: 'A 27-year-old is found unresponsive. Respiratory rate 6, pinpoint pupils. Last seen well an hour ago.',
    timing: 'acute',
    values: { PaCO2: 70, HCO3: 27, PaO2: 58, Na: 140, Cl: 103 },
    extra: [{ label: 'Resp. rate', value: '6/min', flag: 'L' }],
    intended: { phStatus: 'acidaemia', primary: 'resp-acidosis', comp: 'acute', agClass: 'normal' },
    cause: {
      answer: 'Opioid overdose',
      options: ['Opioid overdose', 'COPD (chronic CO₂ retention)', 'Panic attack', 'Salicylate poisoning'],
      why: 'Respiratory depression: CO₂ climbs within minutes, and the kidney has had no time to retain bicarbonate — so HCO₃⁻ has risen only ~1 per 10 mmHg. Give naloxone and support ventilation.',
      not: {
        'COPD (chronic CO₂ retention)': 'Chronic retention would have pushed the bicarbonate up ~3.5 per 10 mmHg, to about 35.',
        'Panic attack': 'Panic causes hyperventilation — a LOW PaCO₂.',
        'Salicylate poisoning': 'Salicylates stimulate breathing; they lower the PaCO₂.',
      },
    },
  },
  {
    id: 'copd',
    level: 'single',
    title: 'Clinic review',
    vignette: 'A 70-year-old with severe COPD (FEV₁ 30%) is reviewed in clinic. He is at his usual baseline — no new symptoms.',
    timing: 'chronic',
    values: { PaCO2: 60, HCO3: 31, PaO2: 58, Na: 139, Cl: 96 },
    extra: [{ label: 'SpO₂', value: '89%', flag: 'L' }],
    intended: { phStatus: 'acidaemia', primary: 'resp-acidosis', comp: 'chronic', agClass: 'normal' },
    cause: {
      answer: 'COPD (chronic CO₂ retention)',
      options: ['COPD (chronic CO₂ retention)', 'Opioid overdose', 'Acute asthma attack', 'Pulmonary embolism'],
      why: 'Long-standing hypoventilation: over days the kidney retains bicarbonate (~3.5 per 10 mmHg), pulling the pH back towards normal. Careful with oxygen — target 88–92%.',
      not: {
        'Opioid overdose': 'Acute — the bicarbonate would barely have moved.',
        'Acute asthma attack': 'Early asthma causes hyperventilation and a LOW PaCO₂; a rising one is a sign of exhaustion, not chronicity.',
        'Pulmonary embolism': 'PE typically causes hyperventilation and respiratory ALKALOSIS.',
      },
    },
  },
  {
    id: 'panic',
    level: 'single',
    title: 'Tingling fingers',
    vignette: 'A 24-year-old in the emergency department is anxious and breathing fast, with tingling around the mouth and carpopedal spasm. Symptoms began 20 minutes ago.',
    timing: 'acute',
    values: { PaCO2: 25, HCO3: 21, PaO2: 112, Na: 140, Cl: 107 },
    extra: [{ label: 'Resp. rate', value: '32/min', flag: 'H' }],
    intended: { phStatus: 'alkalaemia', primary: 'resp-alkalosis', comp: 'acute', agClass: 'normal' },
    cause: {
      answer: 'Panic attack (hyperventilation)',
      options: ['Panic attack (hyperventilation)', 'Pulmonary embolism', 'Salicylate poisoning', 'High altitude'],
      why: 'Blowing off CO₂ raises the pH; alkalaemia lowers ionised calcium, hence the paraesthesia and spasm. The bicarbonate has fallen only ~2 per 10 mmHg — it is acute.',
      not: {
        'Pulmonary embolism': 'PE also causes hyperventilation, but here the PaO₂ is HIGH (112) — a PE would widen the A–a gradient and lower it.',
        'Salicylate poisoning': 'Salicylates add a HIGH-gap metabolic acidosis. This gap is normal.',
        'High altitude': 'At altitude the PaO₂ is low and the change is chronic.',
      },
    },
  },
  {
    id: 'altitude',
    level: 'single',
    title: 'Three weeks at base camp',
    vignette: 'A 31-year-old climber has spent three weeks at 5,300 m. Gas taken at base camp.',
    timing: 'chronic',
    values: { PaCO2: 25, HCO3: 18, PaO2: 48, Na: 139, Cl: 109 },
    extra: [{ label: 'Haemoglobin', value: '17.8 g/dL', flag: 'H' }],
    intended: { phStatus: 'alkalaemia', primary: 'resp-alkalosis', comp: 'chronic', agClass: 'normal' },
    cause: {
      answer: 'High altitude',
      options: ['High altitude', 'Panic attack (hyperventilation)', 'Salicylate poisoning', 'Vomiting (loss of gastric acid)'],
      why: 'Hypoxia drives sustained hyperventilation. Over days the kidney excretes bicarbonate (~4–5 per 10 mmHg), pulling the pH back towards normal — acetazolamide speeds this.',
      not: {
        'Panic attack (hyperventilation)': 'Acute — the bicarbonate would only have fallen to ~21. Weeks of compensation got it to 18.',
        'Salicylate poisoning': 'No ingestion and a normal anion gap.',
        'Vomiting (loss of gastric acid)': 'Vomiting RAISES bicarbonate. Here it is low.',
      },
    },
  },
  {
    id: 'ethylene-glycol',
    level: 'single',
    title: 'Garage drink',
    vignette: 'A 52-year-old is drowsy after drinking from a bottle in his garage. Calcium oxalate crystals in the urine; measured osmolality 324 vs calculated 291.',
    values: { PaCO2: 21, HCO3: 9, PaO2: 98, Na: 141, Cl: 104 },
    extra: [{ label: 'Osmolar gap', value: '33 mOsm/kg', flag: 'H' }, { label: 'Creatinine', value: '2.4 mg/dL', flag: 'H' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Ethylene glycol poisoning',
      options: ['Ethylene glycol poisoning', 'Methanol poisoning', 'Diabetic ketoacidosis', 'Lactic acidosis (septic shock)'],
      why: 'A high anion gap AND a high osmolar gap means a toxic alcohol. Oxalate crystals and acute kidney injury point to ethylene glycol (antifreeze). Fomepizole; dialysis if severe.',
      not: {
        'Methanol poisoning': 'Methanol also raises both gaps, but causes visual loss ("snowstorm") rather than oxalate crystals and renal failure.',
        'Diabetic ketoacidosis': 'No hyperglycaemia, and DKA does not raise the osmolar gap this much.',
        'Lactic acidosis (septic shock)': 'No shock — and lactate does not explain an osmolar gap.',
      },
    },
  },
  {
    id: 'uraemia',
    level: 'single',
    title: 'Missed dialysis',
    vignette: 'A 63-year-old on haemodialysis has missed a week of sessions. Nauseated and itchy. Urea markedly raised; creatinine 9.1 mg/dL.',
    values: { PaCO2: 32, HCO3: 16, PaO2: 90, Na: 138, Cl: 102 },
    extra: [{ label: 'Creatinine', value: '9.1 mg/dL', flag: 'H' }, { label: 'K⁺', value: '6.1 mmol/L', flag: 'H' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Uraemia (renal failure)',
      options: ['Uraemia (renal failure)', 'Diabetic ketoacidosis', 'Lactic acidosis (septic shock)', 'Distal (type 1) RTA'],
      why: 'Failing kidneys retain sulphate, phosphate and organic anions — the unmeasured anions that open the gap.',
      not: {
        'Diabetic ketoacidosis': 'No hyperglycaemia or ketosis described.',
        'Lactic acidosis (septic shock)': 'No shock or hypoperfusion.',
        'Distal (type 1) RTA': 'RTA gives a NORMAL anion gap, with hypokalaemia. Here the gap is high and the potassium raised.',
      },
    },
  },
  {
    id: 'normal',
    level: 'single',
    title: 'Pre-operative gas',
    vignette: 'A healthy 30-year-old has an arterial gas drawn before elective surgery. No symptoms.',
    values: { PaCO2: 40, HCO3: 24, PaO2: 96, Na: 140, Cl: 104 },
    extra: [],
    intended: { phStatus: 'normal', primary: 'none', agClass: 'normal' },
  },

  // ── Mixed and hidden disorders ─────────────────────────────────────────
  {
    id: 'salicylate',
    level: 'mixed',
    title: 'Two hours after the pills',
    vignette: 'A 16-year-old took a large number of aspirin tablets two hours ago. She has tinnitus and is breathing fast.',
    timing: 'acute',
    values: { PaCO2: 18, HCO3: 14, PaO2: 110, Na: 140, Cl: 102 },
    extra: [{ label: 'Salicylate', value: '68 mg/dL', flag: 'H' }],
    intended: { phStatus: 'alkalaemia', primary: 'resp-alkalosis', comp: 'met-acidosis-added', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Salicylate poisoning',
      options: ['Salicylate poisoning', 'Panic attack (hyperventilation)', 'Diabetic ketoacidosis', 'Ethylene glycol poisoning'],
      why: 'The classic mixed picture: salicylate stimulates the respiratory centre (respiratory alkalosis) AND uncouples oxidative phosphorylation (high-gap metabolic acidosis). Two hours is far too short for a bicarbonate of 14 to be compensation. Alkalinise the urine; dialyse if severe.',
      not: {
        'Panic attack (hyperventilation)': 'Panic does not open the anion gap.',
        'Diabetic ketoacidosis': 'DKA gives an acidaemia with appropriate compensation, not a primary respiratory alkalosis.',
        'Ethylene glycol poisoning': 'No osmolar gap or crystals — and the tinnitus and hyperventilation point to salicylate.',
      },
    },
  },
  {
    id: 'arrest',
    level: 'mixed',
    title: 'During CPR',
    vignette: 'A gas is drawn ten minutes into a cardiac arrest. Ventilation through a bag-valve mask has been difficult.',
    values: { PaCO2: 52, HCO3: 16, PaO2: 64, Na: 138, Cl: 100 },
    extra: [{ label: 'Lactate', value: '7.9 mmol/L', flag: 'H' }],
    intended: { phStatus: 'acidaemia', primary: 'mixed', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Cardiac arrest (lactate + inadequate ventilation)',
      options: ['Cardiac arrest (lactate + inadequate ventilation)', 'Opioid overdose', 'COPD (chronic CO₂ retention)', 'Diabetic ketoacidosis'],
      why: 'No circulation means lactate (metabolic acidosis), and no effective breathing means CO₂ retention (respiratory acidosis) — both push the pH down. That is why it is so low.',
      not: {
        'Opioid overdose': 'A pure respiratory acidosis would leave the bicarbonate normal or high, not 16 with a gap of 22.',
        'COPD (chronic CO₂ retention)': 'Chronic retention RAISES the bicarbonate.',
        'Diabetic ketoacidosis': 'DKA drives hyperventilation — PaCO₂ low, not high.',
      },
    },
  },
  {
    id: 'dka-vomiting',
    level: 'mixed',
    title: 'A deceptively normal pH',
    vignette: 'A 22-year-old with type 1 diabetes has vomited for three days and is now ketotic. Glucose 480 mg/dL.',
    values: { PaCO2: 37, HCO3: 20, PaO2: 100, Na: 137, Cl: 91 },
    extra: [{ label: 'Glucose', value: '480 mg/dL', flag: 'H' }, { label: 'Ketones', value: '3+', flag: 'H' }],
    intended: { phStatus: 'normal', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'hagma+met-alk' },
    cause: {
      answer: 'DKA with vomiting',
      options: ['DKA with vomiting', 'DKA alone', 'Vomiting alone', 'Diarrhoea (GI bicarbonate loss)'],
      why: 'The gap rose by 14 but the bicarbonate fell by only 4: something has been ADDING bicarbonate — three days of vomiting. Two opposite disorders nearly cancel, which is why the pH looks almost normal.',
      not: {
        'DKA alone': 'DKA alone would drop the bicarbonate roughly as much as the gap rose. The delta ratio of 3.5 says otherwise.',
        'Vomiting alone': 'Vomiting alone would not open the anion gap to 26.',
        'Diarrhoea (GI bicarbonate loss)': 'Diarrhoea gives a normal-gap acidosis.',
      },
    },
  },
  {
    id: 'hagma-nagma',
    level: 'mixed',
    title: 'Cholera in shock',
    vignette: 'A 40-year-old has had profuse rice-water diarrhoea for two days and is now hypotensive and cold. Lactate 5.1 mmol/L.',
    values: { PaCO2: 23, HCO3: 10, PaO2: 96, Na: 140, Cl: 110 },
    extra: [{ label: 'Lactate', value: '5.1 mmol/L', flag: 'H' }, { label: 'K⁺', value: '3.0 mmol/L', flag: 'L' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'hagma+nagma' },
    cause: {
      answer: 'Diarrhoea plus lactic acidosis (shock)',
      options: ['Diarrhoea plus lactic acidosis (shock)', 'Diarrhoea (GI bicarbonate loss)', 'Diabetic ketoacidosis', 'Ethylene glycol poisoning'],
      why: 'The bicarbonate fell by 14 but the gap rose by only 8: more bicarbonate has gone than the lactate explains. The rest went in the stool — a high-gap and a normal-gap acidosis at once.',
      not: {
        'Diarrhoea (GI bicarbonate loss)': 'Diarrhoea alone would not open the gap to 20. The lactate from shock does.',
        'Diabetic ketoacidosis': 'No hyperglycaemia or ketosis.',
        'Ethylene glycol poisoning': 'No ingestion or osmolar gap; the shock explains the lactate.',
      },
    },
  },
  {
    id: 'albumin',
    level: 'mixed',
    title: 'A gap that hides',
    vignette: 'A 55-year-old with cirrhosis is admitted with spontaneous bacterial peritonitis and low blood pressure. Albumin 1.2 g/dL; lactate 4.9 mmol/L.',
    values: { PaCO2: 33, HCO3: 17, PaO2: 88, Na: 136, Cl: 107, albumin: 1.2 },
    extra: [{ label: 'Albumin', value: '1.2 g/dL', flag: 'L' }, { label: 'Lactate', value: '4.9 mmol/L', flag: 'H' }],
    intended: { phStatus: 'acidaemia', primary: 'met-acidosis', comp: 'appropriate', agClass: 'high', deltaClass: 'pure' },
    cause: {
      answer: 'Lactic acidosis masked by low albumin',
      options: ['Lactic acidosis masked by low albumin', 'Diarrhoea (GI bicarbonate loss)', 'Distal (type 1) RTA', 'Diabetic ketoacidosis'],
      why: 'Albumin is the biggest unmeasured anion. At 1.2 g/dL it has taken about 7 mmol/L out of the gap (2.5 for every 1 g/dL below 4), so a measured gap of 12 is really 19. Always correct the gap for albumin in sick, malnourished or cirrhotic patients.',
      not: {
        'Diarrhoea (GI bicarbonate loss)': 'The UNcorrected gap of 12 looks normal-gap — which is exactly the trap.',
        'Distal (type 1) RTA': 'Same trap: a normal-looking gap that is high once albumin is accounted for.',
        'Diabetic ketoacidosis': 'No hyperglycaemia; the lactate and the sepsis explain the gap.',
      },
    },
  },
  {
    id: 'copd-exacerbation',
    level: 'mixed',
    title: 'Worse for two days',
    vignette: 'A 74-year-old with severe COPD and known CO₂ retention has been increasingly breathless and drowsy for two days with a chest infection.',
    timing: 'chronic',
    values: { PaCO2: 75, HCO3: 32, PaO2: 49, Na: 138, Cl: 94 },
    extra: [{ label: 'SpO₂', value: '82%', flag: 'L' }],
    intended: { phStatus: 'acidaemia', primary: 'resp-acidosis', comp: 'acute-on-chronic', agClass: 'normal' },
    cause: {
      answer: 'COPD exacerbation (acute-on-chronic)',
      options: ['COPD exacerbation (acute-on-chronic)', 'Opioid overdose', 'COPD (chronic CO₂ retention)', 'Acute asthma attack'],
      why: 'The bicarbonate (32) is above an acute response (~27.5) but below a fully chronic one (~36): a chronically compensated patient whose CO₂ has climbed further, faster than the kidney can follow. Consider non-invasive ventilation.',
      not: {
        'Opioid overdose': 'Purely acute: the bicarbonate would be ~27.5.',
        'COPD (chronic CO₂ retention)': 'At a stable baseline the bicarbonate would have caught up, to ~36, with a near-normal pH.',
        'Acute asthma attack': 'There is a long history of CO₂ retention, and the raised bicarbonate shows it.',
      },
    },
  },
];

export const LEVEL_LABELS = {
  all: 'Everything',
  single: 'Single disorders',
  mixed: 'Mixed & hidden',
};
