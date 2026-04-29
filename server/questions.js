const questions = [
  // ── BUZZ FUN ─────────────────────────────────────────────────────────────────
  {
    id: 'BF-001', subject: 'pathology',
    difficulty: 'easy',
    buzz_type: 'BUZZWORD',
    game_modes: ['buzz_fun'],
    question: 'Kimmelstiel-Wilson nodules',
    options: ['Diabetic nephropathy', 'IgA nephropathy', 'Minimal change disease', 'FSGS'],
    correct: 'A',
    explanation: 'Kimmelstiel-Wilson nodules are pathognomonic of diabetic nephropathy — nodular glomerulosclerosis from mesangial matrix expansion due to chronic hyperglycaemia.'
  },
  {
    id: 'BF-002', subject: 'neurology',
    difficulty: 'easy',
    buzz_type: 'TRIAD',
    game_modes: ['buzz_fun'],
    question: 'Fever + Neck stiffness + Photophobia',
    options: ['Bacterial meningitis', 'Subarachnoid haemorrhage', 'Viral encephalitis', 'Migraine with aura'],
    correct: 'A',
    explanation: 'The classic triad of bacterial meningitis is fever, neck stiffness (meningismus), and photophobia. Kernig and Brudzinski signs may also be present.'
  },
  {
    id: 'BF-003', subject: 'cardiology',
    difficulty: 'easy',
    buzz_type: 'ASSOCIATION',
    game_modes: ['buzz_fun'],
    question: 'Carey Coombs murmur',
    options: ['Acute rheumatic fever', 'Mitral valve prolapse', 'Aortic stenosis', 'Atrial septal defect'],
    correct: 'A',
    explanation: 'The Carey Coombs murmur is a short mid-diastolic rumble in acute rheumatic fever, caused by inflammation of the mitral valve leaflets (mitral valvulitis).'
  },
  {
    id: 'BF-004', subject: 'pharmacology',
    difficulty: 'easy',
    buzz_type: 'SIDE_EFFECT',
    game_modes: ['buzz_fun'],
    question: 'Cinchonism: tinnitus, vertigo, headache',
    options: ['Quinine / Quinidine', 'Chloroquine', 'Mefloquine', 'Doxycycline'],
    correct: 'A',
    explanation: 'Cinchonism — tinnitus, vertigo, headache, visual disturbances — is the classic toxicity of quinine and quinidine (cinchona alkaloids). High doses cause cardiac arrhythmias.'
  },
  {
    id: 'BF-005', subject: 'microbiology',
    difficulty: 'easy',
    buzz_type: 'ASSOCIATION',
    game_modes: ['buzz_fun'],
    question: '"Ghon complex" on chest X-ray',
    options: ['Primary TB (Mycobacterium tuberculosis)', 'Histoplasma capsulatum', 'Sarcoidosis', 'Lung adenocarcinoma'],
    correct: 'A',
    explanation: 'The Ghon complex — calcified subpleural parenchymal focus + calcified hilar lymph node — is the radiological hallmark of healed primary TB infection.'
  },

  // ── BIOSTATISTICS ────────────────────────────────────────────────────────────
  {
    id: 'BS-001', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A new rapid strep test is evaluated in 200 patients. The test correctly identifies 90 of 100 patients who actually have Group A Streptococcus pharyngitis, and correctly rules out the infection in 80 of 100 patients who do not have it. What are the sensitivity and specificity of this test, respectively?",
    options: [
      "Sensitivity 80%, Specificity 90%",
      "Sensitivity 90%, Specificity 80%",
      "Sensitivity 90%, Specificity 90%",
      "Sensitivity 80%, Specificity 80%"
    ],
    correct: "B",
    explanation: "Sensitivity = TP/(TP+FN) = 90/100 = 90%. It answers: 'If you have the disease, how likely is the test positive?' Specificity = TN/(TN+FP) = 80/100 = 80%. It answers: 'If you don't have the disease, how likely is the test negative?' A highly sensitive test minimises false negatives and is used to rule OUT disease (SnNout). A highly specific test minimises false positives and is used to rule IN disease (SpPin)."
  },
  {
    id: 'BS-002', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A cancer screening test has sensitivity 80% and specificity 95%. Applied in Population A (prevalence 1%) and Population B (prevalence 10%), the positive predictive value (PPV) differs significantly between the two populations. Which statement best explains why PPV is higher in Population B?",
    options: [
      "Specificity increases in high-prevalence populations, reducing false positives",
      "More true positives exist relative to false positives in a higher-prevalence population",
      "Sensitivity increases in high-prevalence populations, increasing true positives",
      "PPV is a fixed property of the test and does not change with prevalence"
    ],
    correct: "B",
    explanation: "PPV = TP/(TP+FP). Sensitivity and specificity are intrinsic properties of the test and do not change with prevalence. However, in a higher-prevalence population there are more true positives relative to false positives, so the fraction of positive tests that are truly positive (PPV) rises. Conversely, NPV falls as prevalence rises (more true positives means more missed if the test is negative). This is why even a specific test performs poorly as a screening tool in low-prevalence populations — most positives are false positives."
  },
  {
    id: 'BS-003', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A 20-year cohort study follows 500 smokers and 500 non-smokers. By study end, 100 smokers and 20 non-smokers have developed lung cancer. What is the relative risk (RR) of lung cancer in smokers compared to non-smokers?",
    options: [
      "RR = 5",
      "RR = 0.2",
      "RR = 8",
      "RR = 3"
    ],
    correct: "A",
    explanation: "Relative Risk (RR) = [incidence in exposed] / [incidence in unexposed]. Incidence in smokers = 100/500 = 0.20 (20%). Incidence in non-smokers = 20/500 = 0.04 (4%). RR = 0.20 / 0.04 = 5. Smokers have 5 times the risk of developing lung cancer compared to non-smokers. RR is calculated from cohort studies (prospective exposure → outcome design) where true incidence rates can be measured. An RR of 1.0 means no association; RR > 1 indicates increased risk in the exposed group."
  },
  {
    id: 'BS-004', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A case-control study investigates alcohol use and esophageal cancer. Of 100 cases (esophageal cancer), 70 report regular alcohol use. Of 100 healthy controls, 30 report regular alcohol use. What is the odds ratio (OR) for esophageal cancer associated with alcohol use?",
    options: [
      "OR = 2.3",
      "OR = 5.4",
      "OR = 3.5",
      "OR = 7.0"
    ],
    correct: "B",
    explanation: "OR = (a × d) / (b × c), where a = cases exposed (70), b = cases unexposed (30), c = controls exposed (30), d = controls unexposed (70). OR = (70 × 70)/(30 × 30) = 4900/900 ≈ 5.4. Odds of alcohol use among cases = 70/30; odds among controls = 30/70. The OR is the preferred measure in case-control studies because true incidence cannot be determined (study starts with known outcomes). When disease prevalence is low, OR approximates RR."
  },
  {
    id: 'BS-005', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A cohort study reports that the incidence of myocardial infarction is 12 per 1,000 person-years in hypertensive patients and 4 per 1,000 person-years in normotensive patients. What is the attributable risk (risk difference) of hypertension for myocardial infarction?",
    options: [
      "3 per 1,000 person-years",
      "8 per 1,000 person-years",
      "16 per 1,000 person-years",
      "48 per 1,000 person-years"
    ],
    correct: "B",
    explanation: "Attributable Risk (AR) = Incidence in exposed − Incidence in unexposed = 12 − 4 = 8 per 1,000 person-years. This represents the excess risk of MI attributable to hypertension above the background rate. It is distinct from the Relative Risk (RR = 12/4 = 3), which measures the strength of association. AR is the most useful measure for public health: it quantifies how much disease would be prevented if the exposure were eliminated. Option A is the reciprocal of RR; Option D is the product of the two rates."
  },
  {
    id: 'BS-006', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A clinical trial of 30 patients finds no statistically significant difference in blood pressure reduction between a new drug and placebo (p = 0.12). The researchers conclude the drug is ineffective. Which error is most likely occurring, and how does sample size relate to it?",
    options: [
      "Type I error (α); increased by small sample size",
      "Type II error (β); increased by small sample size",
      "Type I error (α); unaffected by sample size",
      "Type II error (β); decreased by small sample size"
    ],
    correct: "B",
    explanation: "A Type II error (β) is failing to reject a false null hypothesis — concluding no effect exists when one truly does. Small sample sizes reduce statistical power (Power = 1 − β), making Type II errors more likely. This study likely lacked adequate power to detect a true antihypertensive effect. Type I error (α) = incorrectly rejecting a true null hypothesis (false positive), conventionally set at 0.05. Increasing sample size increases power, reducing the risk of Type II error without inflating Type I error, provided α is held constant."
  },
  {
    id: 'BS-007', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A randomized controlled trial comparing two antibiotics for pneumonia reports a p-value of 0.03 for the primary outcome. Which of the following is the most accurate interpretation of this p-value?",
    options: [
      "There is a 3% probability that the null hypothesis is true",
      "There is a 3% probability of obtaining a difference this large or larger by chance alone, assuming the null hypothesis is true",
      "There is a 97% probability that the new antibiotic is superior",
      "The treatment difference is clinically meaningful"
    ],
    correct: "B",
    explanation: "A p-value is the probability of obtaining results at least as extreme as those observed, assuming the null hypothesis (no true difference) is true. P = 0.03 means that if both antibiotics were equally effective, there would be only a 3% chance of observing this large a difference by random chance. It does NOT mean: the probability the null is true (A), the probability the alternative is true (C), or that the effect is clinically significant (D). A very large study can yield p < 0.05 for a trivially small and clinically irrelevant difference — always assess effect size alongside p-values."
  },
  {
    id: 'BS-008', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A trial reports that a new statin reduces LDL by a mean of 18 mg/dL (95% CI: 10–26 mg/dL) compared to placebo. Which statement about this confidence interval is most accurate?",
    options: [
      "There is a 95% probability that the true LDL reduction lies between 10 and 26 mg/dL",
      "If the experiment were repeated 100 times, approximately 95 of the resulting confidence intervals would contain the true mean difference",
      "The p-value for this result is exactly 0.05",
      "The drug reduces LDL by exactly 18 mg/dL in all patients"
    ],
    correct: "B",
    explanation: "A 95% CI means: if this study were repeated many times and a CI constructed from each sample, 95% of those intervals would contain the true population parameter — not that this specific interval has a 95% chance of containing it (the true value either is or is not within any given interval). Since the CI (10–26) does not include 0, the result is statistically significant (p < 0.05), but not necessarily exactly 0.05 (C). Option D confuses the sample estimate with a fixed population truth. Wider CIs reflect greater uncertainty (smaller samples); narrower CIs reflect greater precision (larger samples)."
  },
  {
    id: 'BS-009', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A researcher randomly assigns 1,000 participants to receive either a new vaccine or a placebo and follows them for 6 months to compare COVID-19 infection rates. Which study design is this, and what is its greatest methodological advantage?",
    options: [
      "Prospective cohort study; ability to calculate relative risk directly",
      "Randomized controlled trial; randomization distributes known and unknown confounders equally between groups",
      "Case-control study; efficiency for studying rare outcomes",
      "Cross-sectional study; simultaneous measurement of exposure and outcome"
    ],
    correct: "B",
    explanation: "This is a randomized controlled trial (RCT), the gold standard for establishing causation. Random assignment ensures that both known and unknown confounders are equally distributed between groups, so any outcome difference can be attributed to the intervention. Cohort studies follow exposure → outcome prospectively and can calculate RR, but without randomization, confounding by indication persists. Case-control studies start from outcomes and look backward — ideal for rare diseases but cannot establish causality. Cross-sectional studies capture a single snapshot; they cannot establish temporal sequence between exposure and disease."
  },
  {
    id: 'BS-010', subject: 'biostatistics',
    difficulty: 'easy',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit'],
    question: "A case-control study finds an association between cell phone use and glioblastoma. Patients with glioblastoma reported significantly more historical cell phone use than matched controls. Critics note that patients with brain tumors may have searched their memories more thoroughly for a possible cause of their illness. Which bias most threatens the validity of this finding?",
    options: [
      "Selection bias — cases and controls were recruited from different populations",
      "Lead-time bias — early tumour detection makes survival appear prolonged",
      "Recall bias — cases are more motivated than controls to remember past exposures",
      "Hawthorne effect — participants change behaviour because they know they are being studied"
    ],
    correct: "C",
    explanation: "Recall bias occurs when cases and controls differ systematically in their ability or motivation to remember prior exposures. Cases (with disease) are more likely to scrutinise their past for possible causes, over-reporting exposures compared to controls. This is a fundamental limitation of retrospective case-control studies. Selection bias (A) involves non-random differences in who is enrolled in each group. Lead-time bias (B) occurs in screening studies where earlier detection inflates apparent survival time without actually delaying death. The Hawthorne effect (D) describes behaviour change due to observation, not differential recall."
  },

  // ── CARDIOLOGY ──────────────────────────────────────────────────────────────
  // Zone 5: Floors 41-50
  {
    id: 'CA-001', subject: 'cardiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 41,
    question: "A 45-year-old man presents with crushing substernal chest pain radiating to the left arm, diaphoresis, and nausea for 2 hours. ECG shows ST-segment elevation in leads II, III, and aVF. Which vessel is most likely occluded?",
    options: ["Left anterior descending artery", "Left circumflex artery", "Right coronary artery", "Left main coronary artery"],
    correct: "C",
    explanation: "ST elevation in II, III, aVF indicates inferior wall MI. The RCA supplies the inferior wall in ~80% of people (right-dominant circulation)."
  },
  {
    id: 'CA-002', subject: 'cardiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 42,
    question: "A 5-year-old boy has had fever for 7 days, bilateral conjunctival injection, strawberry tongue, erythema of the palms and soles, cervical lymphadenopathy, and a maculopapular rash. Which complication is the most feared?",
    options: ["Mitral valve regurgitation", "Coronary artery aneurysms", "Glomerulonephritis", "Pericardial effusion"],
    correct: "B",
    explanation: "Kawasaki disease causes coronary artery aneurysms in ~25% of untreated cases. IVIG + aspirin reduces this risk dramatically. The vasculitis primarily targets medium-sized vessels, especially coronary arteries."
  },
  {
    id: 'CA-003', subject: 'cardiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 43,
    question: "A 58-year-old man with anterior STEMI undergoes successful PCI. On day 3, he develops new-onset fever, pleuritic chest pain, and a friction rub. ECG shows diffuse saddle-shaped ST elevation. What is the most likely diagnosis?",
    options: ["Reinfarction with re-occlusion of the LAD stent", "Dressler syndrome (post-MI pericarditis)", "Left ventricular free wall rupture", "Pulmonary embolism"],
    correct: "B",
    explanation: "Dressler syndrome is an autoimmune pericarditis occurring 2–10 weeks after MI. It presents with fever, pleuritic chest pain, friction rub, and diffuse saddle-shaped ST elevation caused by immune complex deposition against myocardial antigens released during infarction."
  },

  // ── PATHOLOGY ────────────────────────────────────────────────────────────────
  // Zone 10: Floors 91-100 (All Subjects)
  {
    id: 'PT-001', subject: 'pathology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 91,
    question: "A 28-year-old woman with a history of recurrent UTIs presents with flank pain and hematuria. Imaging reveals bilateral enlarged kidneys with multiple cysts. Her father had similar findings. Which gene is most likely mutated?",
    options: ["VHL", "PKD1", "WT1", "NF1"],
    correct: "B",
    explanation: "Autosomal dominant polycystic kidney disease (ADPKD) is most commonly caused by mutations in PKD1 (85% of cases), encoding polycystin-1, a membrane protein involved in tubular cell differentiation."
  },
  {
    id: 'PT-002', subject: 'pathology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 92,
    question: "A patient with type 1 diabetes mellitus undergoes annual renal screening. Which finding is the earliest detectable sign of diabetic nephropathy?",
    options: ["Increased serum creatinine", "Decreased GFR on CKD-EPI equation", "Microalbuminuria (30–300 mg/day)", "Gross proteinuria (>3.5 g/day)"],
    correct: "C",
    explanation: "Microalbuminuria (30–300 mg albumin/day) is the earliest clinical marker of diabetic nephropathy. It reflects loss of glomerular basement membrane charge selectivity caused by non-enzymatic glycation and increased glomerular capillary pressure."
  },
  {
    id: 'PT-003', subject: 'pathology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 93,
    question: "A 55-year-old woman presents with fatigue, weight gain, constipation, dry skin, and a TSH of 18 mIU/L with free T4 of 0.4 ng/dL. Which antibody is most commonly responsible for this condition?",
    options: ["Anti-thyroid peroxidase (anti-TPO) antibodies", "TSH receptor-stimulating antibodies", "Anti-thyroglobulin antibodies only", "Anti-microsomal antibodies only"],
    correct: "A",
    explanation: "Hashimoto thyroiditis (autoimmune hypothyroidism) is the most common cause of hypothyroidism in iodine-sufficient regions. Anti-TPO antibodies are present in >95% of cases and drive lymphocytic infiltration and follicular destruction."
  },
  {
    id: 'PT-004', subject: 'pathology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 94,
    question: "A 55-year-old woman undergoes biopsy of a 1.8 cm breast mass. Pathology shows malignant cells arranged in a glandular pattern with necrotic debris in the center of the ducts, confined to the ductal system without basement membrane invasion. What is the diagnosis?",
    options: ["Invasive ductal carcinoma (IDC)", "Invasive lobular carcinoma", "Ductal carcinoma in situ (DCIS), comedo type", "Fibroadenoma with atypical ductal hyperplasia"],
    correct: "C",
    explanation: "Ductal carcinoma in situ (DCIS) is a non-invasive malignancy confined within the basement membrane. The comedo subtype has high-grade nuclei with central necrosis (comedonecrosis) and dystrophic calcifications visible on mammography."
  },
  {
    id: 'PT-005', subject: 'pathology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 95,
    question: "Autopsy of a 75-year-old man reveals bilateral hippocampal atrophy. Microscopic examination shows neurofibrillary tangles (paired helical filaments of hyperphosphorylated tau) and neuritic plaques (amyloid-beta core with dystrophic neurites). These findings are most characteristic of which condition?",
    options: ["Normal aging changes of the hippocampus", "Lewy body disease with hippocampal extension", "Alzheimer's disease neuropathology", "Frontotemporal lobar degeneration (FTLD-tau)"],
    correct: "C",
    explanation: "The neuropathological hallmarks of Alzheimer's disease are: (1) neurofibrillary tangles — intraneuronal aggregates of hyperphosphorylated tau; and (2) senile (neuritic) plaques — extracellular amyloid-beta (Aβ42) deposits with surrounding dystrophic neurites."
  },

  // ── MICROBIOLOGY ─────────────────────────────────────────────────────────────
  // Zone 2: Floors 11-20
  {
    id: 'MI-001', subject: 'microbiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 11,
    question: "A 22-year-old college student presents with fever, severe headache, neck stiffness, and a petechial rash. CSF shows: WBC 1200 (90% neutrophils), protein 180 mg/dL, glucose 30 mg/dL (serum glucose 90). What is the most likely causative organism?",
    options: ["Streptococcus pneumoniae", "Neisseria meningitidis", "Listeria monocytogenes", "Haemophilus influenzae"],
    correct: "B",
    explanation: "Neisseria meningitidis is the leading cause of bacterial meningitis in young adults (15–24 yo) and classically causes petechial/purpuric rash due to endotoxin-mediated DIC. CSF findings are consistent with bacterial meningitis."
  },
  {
    id: 'MI-002', subject: 'microbiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 12,
    question: "A 4-year-old unvaccinated child presents with a barking cough, inspiratory stridor, and a low-grade fever. Neck X-ray shows a 'steeple sign' (subglottic narrowing). What is the most likely causative organism?",
    options: ["Haemophilus influenzae type b", "Parainfluenza virus type 1", "Respiratory syncytial virus (RSV)", "Staphylococcus aureus"],
    correct: "B",
    explanation: "Croup (laryngotracheobronchitis) is most commonly caused by Parainfluenza virus type 1. It affects children 6 months to 3 years, causing barking cough, stridor, and the steeple sign on AP neck X-ray due to subglottic edema."
  },
  {
    id: 'MI-003', subject: 'microbiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 13,
    question: "A 45-year-old spelunker from Ohio presents with fever, cough, and hilar adenopathy. His job involves cleaning bat droppings. Lung biopsy shows macrophages filled with small oval yeast forms (2–4 µm). What is the diagnosis?",
    options: ["Coccidioidomycosis", "Histoplasmosis", "Blastomycosis", "Cryptococcosis"],
    correct: "B",
    explanation: "Histoplasma capsulatum is endemic to the Ohio/Mississippi River valley and found in bat and bird droppings. Biopsy shows small intracellular yeast within macrophages. Hilar adenopathy mimicking sarcoidosis or TB is characteristic."
  },
  {
    id: 'MI-004', subject: 'microbiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 14,
    question: "A 3-day-old neonate develops purulent conjunctivitis. Gram stain shows gram-negative intracellular diplococci. The mother had untreated gonorrhea during pregnancy. Which agent is used as prophylaxis in all newborns at birth to prevent this condition?",
    options: ["Topical erythromycin 0.5% ointment", "Topical silver nitrate 1% drops", "IM ceftriaxone prophylaxis", "Topical gentamicin drops"],
    correct: "A",
    explanation: "Ophthalmia neonatorum caused by Neisseria gonorrhoeae presents within 1–4 days of birth. Erythromycin 0.5% ophthalmic ointment is the standard prophylaxis given to all newborns at birth in the US, acting via inhibition of bacterial protein synthesis."
  },
  {
    id: 'MI-005', subject: 'microbiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 15,
    question: "A 28-year-old man presents with a painless penile ulcer (chancre) with a clean base and indurated edges, and non-tender inguinal lymphadenopathy. Dark-field microscopy shows motile spirochetes. RPR and FTA-ABS are positive. What is the drug of choice?",
    options: ["Doxycycline 100 mg BID x 14 days", "Benzathine penicillin G 2.4 million units IM once", "Ceftriaxone 1 g IV daily x 10 days", "Azithromycin 2 g orally once"],
    correct: "B",
    explanation: "Primary syphilis (Treponema pallidum) presents with a painless chancre. Benzathine penicillin G is the drug of choice for all stages of syphilis — it achieves sustained treponemicidal levels due to slow release from the IM depot."
  },
  {
    id: 'MI-006', subject: 'microbiology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 16,
    question: "A 50-year-old man returns from sub-Saharan Africa with cyclic fevers every 48 hours, headache, and splenomegaly. Blood smear shows ring-form trophozoites with Schüffner dots in enlarged RBCs. Which Plasmodium species is responsible?",
    options: ["Plasmodium falciparum", "Plasmodium vivax or Plasmodium ovale", "Plasmodium malariae", "Plasmodium knowlesi"],
    correct: "B",
    explanation: "Schüffner dots (stippling) in enlarged RBCs with 48-hour (tertian) fever cycles are characteristic of P. vivax or P. ovale. P. falciparum has irregular fever cycles, banana-shaped gametocytes, and does not produce Schüffner dots."
  },

  // ── PHARMACOLOGY ─────────────────────────────────────────────────────────────
  // Zone 3: Floors 21-30
  {
    id: 'PH-001', subject: 'pharmacology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 21,
    question: "A 32-year-old woman ingests an unknown quantity of acetaminophen 8 hours ago. She is currently asymptomatic. Which antidote should be administered and why?",
    options: ["Flumazenil — reverses CNS depression", "Naloxone — reverses opioid receptor effects", "N-acetylcysteine — replenishes glutathione to neutralize NAPQI", "Activated charcoal alone — sufficient if within 1 hour of ingestion"],
    correct: "C",
    explanation: "Acetaminophen is metabolized by CYP2E1 to the toxic metabolite NAPQI, which is normally conjugated with glutathione. Overdose depletes glutathione → NAPQI causes hepatocellular necrosis. N-acetylcysteine replenishes glutathione and is the antidote."
  },
  {
    id: 'PH-002', subject: 'pharmacology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 22,
    question: "A loop diuretic is prescribed for a patient with heart failure. Which is the primary mechanism of action of furosemide?",
    options: ["Inhibits carbonic anhydrase in the proximal tubule", "Blocks the Na-K-2Cl cotransporter in the thick ascending limb of Henle", "Antagonizes aldosterone receptors in the collecting duct", "Blocks epithelial sodium channels in the distal convoluted tubule"],
    correct: "B",
    explanation: "Furosemide inhibits the Na-K-2Cl cotransporter (NKCC2) in the thick ascending limb of the loop of Henle, preventing concentration of the medullary interstitium and reducing water reabsorption. This is the most potent class of diuretics."
  },
  {
    id: 'PH-003', subject: 'pharmacology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 23,
    question: "A 28-year-old woman on oral contraceptive pills (OCPs) starts rifampin for latent TB treatment. She uses OCPs as her sole contraception. What is the mechanism of the drug interaction she must be counseled about?",
    options: ["Rifampin inhibits CYP450, increasing OCP hormone levels and causing toxicity", "Rifampin induces CYP3A4, increasing OCP metabolism and reducing contraceptive efficacy", "Rifampin has no interaction with OCPs at standard doses", "Rifampin competes with estrogen for plasma protein binding"],
    correct: "B",
    explanation: "Rifampin is a potent inducer of CYP3A4, which metabolizes estrogen and progestin in OCPs. Increased metabolism reduces plasma hormone levels, potentially leading to contraceptive failure. Patients should use an additional barrier method."
  },
  {
    id: 'PH-004', subject: 'pharmacology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 24,
    question: "A 55-year-old man with hypertension and diabetes develops a dry, persistent cough after starting a new antihypertensive. He is switched to an ARB. What is the mechanism of the dry cough caused by the original drug?",
    options: ["Beta-1 blockade causing bronchospasm", "Accumulation of bradykinin due to ACE inhibition", "Calcium channel blockade causing mucus hypersecretion", "Sodium retention causing post-nasal drip"],
    correct: "B",
    explanation: "ACE inhibitors (e.g., lisinopril) cause dry cough in 10–15% of patients by blocking ACE, which normally degrades bradykinin. Bradykinin accumulation stimulates cough receptors in the airways. ARBs do not block bradykinin degradation and do not cause this side effect."
  },
  {
    id: 'PH-005', subject: 'pharmacology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 25,
    question: "A 28-year-old woman with bipolar disorder takes valproic acid. She becomes pregnant. Which specific fetal risk is most directly attributable to valproic acid?",
    options: ["Ebstein anomaly (tricuspid valve displacement)", "Neural tube defects (spina bifida, anencephaly)", "Cleft palate and micrognathia", "Digit hypoplasia and nail dysplasia"],
    correct: "B",
    explanation: "Valproic acid is a potent teratogen that inhibits folate metabolism, causing neural tube defects (spina bifida in ~1–2%). Folic acid supplementation is critical but does not fully eliminate the risk. Ebstein anomaly is classically associated with lithium."
  },
  {
    id: 'PH-006', subject: 'pharmacology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 26,
    question: "A 30-year-old man with schizophrenia develops high fever (40°C), lead-pipe muscle rigidity, diaphoresis, altered consciousness, and autonomic instability after his haloperidol dose is doubled. CK is 12,000 U/L. What is the pathophysiological mechanism?",
    options: ["Serotonin syndrome from dopamine-serotonin imbalance", "Dopamine receptor blockade in the hypothalamus causing disinhibited thermogenesis and rigidity", "Malignant hyperthermia from ryanodine receptor mutation triggered by antipsychotics", "Anticholinergic toxidrome causing central hyperthermia"],
    correct: "B",
    explanation: "Neuroleptic malignant syndrome (NMS) results from sudden dopamine receptor blockade → hypothalamic thermoregulatory failure (hyperthermia) and rigidity from nigrostriatal dopamine loss. Markedly elevated CK reflects rhabdomyolysis from sustained rigidity. Treatment: stop antipsychotic, dantrolene, bromocriptine."
  },

  // ── NEUROLOGY ────────────────────────────────────────────────────────────────
  // Zone 4: Floors 31-40
  {
    id: 'NE-001', subject: 'neurology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 31,
    question: "A 72-year-old man presents with a 6-month history of resting 'pill-rolling' tremor in his right hand, cogwheel rigidity, bradykinesia, and shuffling gait with reduced arm swing. What is the primary pathological finding in this disease?",
    options: ["Neurofibrillary tangles in the hippocampus", "Loss of dopaminergic neurons in the substantia nigra pars compacta with Lewy body formation", "Huntingtin protein aggregation in the striatum", "TDP-43 inclusions in the motor cortex"],
    correct: "B",
    explanation: "Parkinson disease is characterized by degeneration of dopaminergic neurons in the substantia nigra pars compacta, leading to striatal dopamine deficiency. Lewy bodies (alpha-synuclein aggregates) are the pathological hallmark."
  },
  {
    id: 'NE-002', subject: 'neurology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 32,
    question: "A 45-year-old woman presents with severe unilateral headache behind the right eye, ptosis, and a dilated, unreactive pupil. MRI shows a 7 mm posterior communicating artery aneurysm. Which structure is being compressed?",
    options: ["Optic nerve (CN II)", "Oculomotor nerve (CN III)", "Trochlear nerve (CN IV)", "Abducens nerve (CN VI)"],
    correct: "B",
    explanation: "A posterior communicating artery aneurysm classically compresses CN III, causing a 'surgical' CN III palsy: ptosis, ophthalmoplegia, AND a blown pupil (dilated, unreactive) due to compression of the parasympathetic fibers that run on the outer surface of the nerve."
  },
  {
    id: 'NE-003', subject: 'neurology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 33,
    question: "An 80-year-old man develops fluctuating confusion over weeks, vivid visual hallucinations, and Parkinsonian features. After a small dose of haloperidol for agitation, he develops severe extrapyramidal rigidity. What is the most likely diagnosis?",
    options: ["Vascular dementia with superimposed delirium", "Lewy body dementia", "Frontotemporal dementia", "Normal pressure hydrocephalus"],
    correct: "B",
    explanation: "Lewy body dementia is characterized by the triad of fluctuating cognition, vivid visual hallucinations, and Parkinsonism. Severe neuroleptic sensitivity (antipsychotics can be fatal due to worsening Parkinsonism) is a core feature. Cortical Lewy bodies contain alpha-synuclein."
  },
  {
    id: 'NE-004', subject: 'neurology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 34,
    question: "A 55-year-old man presents with episodic, excruciating unilateral facial pain in the right cheek and jaw triggered by chewing and light touch, lasting seconds to 2 minutes. Neurological exam is completely normal. What is the first-line pharmacological treatment?",
    options: ["Gabapentin 300 mg TID", "Carbamazepine 200 mg BID", "Sumatriptan 6 mg SC", "Indomethacin 25 mg TID"],
    correct: "B",
    explanation: "Trigeminal neuralgia (tic douloureux) presents with brief, lancinating pain in the CN V distribution triggered by light stimuli (eating, touch). Carbamazepine — a voltage-gated sodium channel blocker — is the first-line treatment and is often considered diagnostic."
  },
  {
    id: 'NE-005', subject: 'neurology',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 35,
    question: "A 62-year-old hypertensive man presents with sudden severe 'thunderclap' headache ('worst headache of my life'), vomiting, and neck stiffness. CT head is negative for blood. Lumbar puncture shows xanthochromia and RBCs in all 4 tubes. What is the most likely source of bleeding?",
    options: ["Hypertensive hemorrhage in the basal ganglia", "Ruptured arteriovenous malformation in the cortex", "Ruptured saccular (berry) aneurysm at the circle of Willis", "Subdural hematoma from bridging vein rupture"],
    correct: "C",
    explanation: "Thunderclap headache + xanthochromia (bilirubin from lysed RBCs after 2–4 hours) = subarachnoid hemorrhage. The most common cause is rupture of a saccular (berry) aneurysm, most often at the anterior communicating artery or MCA bifurcation."
  },

  // ── BIOCHEMISTRY ─────────────────────────────────────────────────────────────
  // Zone 1: Floors 1-10
  {
    id: 'BC-001', subject: 'biochemistry',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 1,
    question: "A newborn screens positive for phenylketonuria (PKU). The deficient enzyme converts phenylalanine to tyrosine using tetrahydrobiopterin (BH4) as a cofactor. Which enzyme is deficient in classic PKU?",
    options: ["Tyrosine hydroxylase", "Phenylalanine hydroxylase", "Homogentisate oxidase", "Fumarylacetoacetate hydrolase"],
    correct: "B",
    explanation: "Classic PKU is caused by deficiency of phenylalanine hydroxylase (PAH), which converts phenylalanine → tyrosine using BH4. Phenylalanine accumulates and is transaminated to phenylpyruvate (musty odor), causing intellectual disability from impaired myelination."
  },
  {
    id: 'BC-002', subject: 'biochemistry',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 2,
    question: "A 6-month-old boy presents with severe hypoglycemia, hepatomegaly, and lactic acidosis after fasting. Liver biopsy shows massive glycogen accumulation. Enzyme analysis reveals absent glucose-6-phosphatase activity. What is the diagnosis?",
    options: ["Pompe disease (GSD type II)", "McArdle disease (GSD type V)", "Von Gierke disease (GSD type Ia)", "Cori disease (GSD type III)"],
    correct: "C",
    explanation: "Von Gierke disease (GSD type Ia) is caused by glucose-6-phosphatase deficiency. Without this enzyme, the liver cannot release free glucose from glycogenolysis or gluconeogenesis → severe fasting hypoglycemia, hepatomegaly, lactic acidosis (pyruvate → lactate), hyperlipidemia, and hyperuricemia."
  },
  {
    id: 'BC-003', subject: 'biochemistry',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 3,
    question: "A 2-year-old boy presents with intellectual disability, compulsive self-mutilation (lip and finger biting), hyperuricemia, gout, and choreoathetosis. Which enzyme is deficient?",
    options: ["Adenosine deaminase (ADA)", "Hypoxanthine-guanine phosphoribosyltransferase (HGPRT)", "Purine nucleoside phosphorylase (PNP)", "Xanthine oxidase"],
    correct: "B",
    explanation: "Lesch-Nyhan syndrome is X-linked recessive and caused by HGPRT deficiency. HGPRT salvages hypoxanthine and guanine back to IMP/GMP. Without it, purines are degraded to uric acid → gout. The characteristic self-mutilation and neurological features (choreoathetosis, spasticity) result from dopamine pathway dysfunction."
  },
  {
    id: 'BC-004', subject: 'biochemistry',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 4,
    question: "A 6-month-old girl of Ashkenazi Jewish descent presents with progressive neurodegeneration, a cherry-red spot on the macula, hyperreflexia, and no organomegaly. Enzyme analysis reveals absent hexosaminidase A activity. What substrate accumulates in neurons?",
    options: ["Glucocerebroside", "GM2 ganglioside", "Sphingomyelin", "Ceramide trihexoside"],
    correct: "B",
    explanation: "Tay-Sachs disease is caused by hexosaminidase A deficiency → GM2 ganglioside accumulates in neuronal lysosomes → neurodegeneration. The cherry-red spot appears because the fovea (lacking ganglion cells) appears red against the pale, ganglioside-laden surrounding retina. No organomegaly distinguishes it from Niemann-Pick."
  },
  {
    id: 'BC-005', subject: 'biochemistry',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 5,
    question: "A 1-week-old neonate presents with lethargy, poor feeding, and urine with a sweet, maple syrup odor. Plasma amino acids show elevated leucine, isoleucine, and valine. Which enzyme is deficient?",
    options: ["Propionyl-CoA carboxylase", "Branched-chain alpha-ketoacid dehydrogenase (BCKDH)", "Methylmalonyl-CoA mutase", "Isovaleryl-CoA dehydrogenase"],
    correct: "B",
    explanation: "Maple syrup urine disease (MSUD) is caused by deficiency of branched-chain alpha-ketoacid dehydrogenase (BCKDH), which oxidatively decarboxylates the alpha-ketoacid derivatives of leucine, isoleucine, and valine. Leucine accumulation is primarily neurotoxic, causing encephalopathy and cerebral edema."
  },
  {
    id: 'BC-006', subject: 'biochemistry',
    game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'tower'],
    tower_floor: 6,
    question: "A 25-year-old man presents with dark urine that turns black on standing, arthritis of large joints, and bluish-black discoloration of his ear cartilage (ochronosis). Urine homogentisic acid is markedly elevated. Which enzyme is deficient?",
    options: ["Phenylalanine hydroxylase", "Tyrosinase", "Homogentisate oxidase", "Fumarylacetoacetase"],
    correct: "C",
    explanation: "Alkaptonuria is caused by homogentisate oxidase deficiency in the tyrosine degradation pathway. Homogentisic acid accumulates, is excreted in urine (turns dark/black upon oxidation), and deposits as a black pigment (ochronosis) in connective tissue, cartilage, and sclera, causing degenerative arthritis."
  }
];

module.exports = questions;
