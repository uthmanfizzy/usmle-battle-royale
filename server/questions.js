const questions = [
  // ── MIXED / ORIGINAL ────────────────────────────────────────────────────────
  {
    id: 1, subject: 'cardiology', difficulty: 'easy',
    question: "A 45-year-old man presents with crushing substernal chest pain radiating to the left arm, diaphoresis, and nausea for 2 hours. ECG shows ST-segment elevation in leads II, III, and aVF. Which vessel is most likely occluded?",
    options: ["Left anterior descending artery","Left circumflex artery","Right coronary artery","Left main coronary artery"],
    correct: "C",
    explanation: "ST elevation in II, III, aVF indicates inferior wall MI. The RCA supplies the inferior wall in ~80% of people (right-dominant circulation)."
  },
  {
    id: 2, subject: 'pathology', difficulty: 'easy',
    question: "A 28-year-old woman with a history of recurrent UTIs presents with flank pain and hematuria. Imaging reveals bilateral enlarged kidneys with multiple cysts. Her father had similar findings. Which gene is most likely mutated?",
    options: ["VHL","PKD1","WT1","NF1"],
    correct: "B",
    explanation: "Autosomal dominant polycystic kidney disease (ADPKD) is most commonly caused by mutations in PKD1 (85% of cases), encoding polycystin-1."
  },
  {
    id: 3, subject: 'microbiology', difficulty: 'easy',
    question: "A 22-year-old college student presents with fever, severe headache, neck stiffness, and a petechial rash. CSF shows: WBC 1200 (90% neutrophils), protein 180 mg/dL, glucose 30 mg/dL (serum glucose 90). What is the most likely causative organism?",
    options: ["Streptococcus pneumoniae","Neisseria meningitidis","Listeria monocytogenes","Haemophilus influenzae"],
    correct: "B",
    explanation: "Neisseria meningitidis is the leading cause of bacterial meningitis in young adults (15-24 yo) and classically causes petechial/purpuric rash due to endotoxin-mediated DIC."
  },
  {
    id: 4, subject: 'cardiology', difficulty: 'hard',
    question: "A patient with hypertrophic obstructive cardiomyopathy (HOCM) has a systolic murmur. Which maneuver would cause the murmur to INCREASE in intensity?",
    options: ["Squatting","Passive leg elevation","Valsalva maneuver (straining phase)","Hand grip"],
    correct: "C",
    explanation: "Valsalva (straining phase) decreases venous return → decreases LV volume → dynamic LVOT obstruction worsens → HOCM murmur intensifies. Increased preload (squatting, leg raise) decreases the murmur."
  },
  {
    id: 5, subject: 'pharmacology', difficulty: 'easy',
    question: "A 32-year-old woman ingests an unknown quantity of acetaminophen 8 hours ago. She is currently asymptomatic. Which antidote should be administered?",
    options: ["Flumazenil","Naloxone","N-acetylcysteine","Activated charcoal alone"],
    correct: "C",
    explanation: "N-acetylcysteine replenishes glutathione stores, neutralizing NAPQI (the toxic acetaminophen metabolite). It is most effective within 8 hours but should be given up to 24h post-ingestion."
  },
  {
    id: 6, subject: 'pharmacology', difficulty: 'easy',
    question: "A loop diuretic is prescribed for a patient with heart failure. Which is the primary mechanism of action of furosemide?",
    options: ["Inhibits carbonic anhydrase in the proximal tubule","Blocks Na-K-2Cl cotransporter in the thick ascending limb of Henle","Antagonizes aldosterone receptors in the collecting duct","Blocks sodium channels in the distal convoluted tubule"],
    correct: "B",
    explanation: "Furosemide inhibits the Na-K-2Cl cotransporter (NKCC2) in the thick ascending limb of the loop of Henle, preventing concentration of the medullary interstitium and reducing water reabsorption."
  },
  {
    id: 7, subject: 'microbiology', difficulty: 'hard',
    question: "A 14-year-old boy with a history of measles infection 10 years ago now presents with progressive personality changes, myoclonic jerks, and cognitive decline. MRI shows diffuse cortical atrophy. CSF shows elevated measles antibody titers. What is the diagnosis?",
    options: ["Creutzfeldt-Jakob disease","Subacute sclerosing panencephalitis (SSPE)","Progressive multifocal leukoencephalopathy","Herpes simplex encephalitis"],
    correct: "B",
    explanation: "SSPE is a late, fatal complication of measles (rubeola) infection appearing 7-10 years later. It causes progressive neurodegeneration, myoclonic jerks, and dementia with characteristic EEG changes (Radermecker complexes)."
  },
  {
    id: 8, subject: 'cardiology', difficulty: 'easy',
    question: "A 5-year-old boy has had fever for 7 days, bilateral conjunctival injection, strawberry tongue, erythema of the palms/soles, cervical lymphadenopathy, and a maculopapular rash. Which complication is the most feared?",
    options: ["Mitral valve regurgitation","Coronary artery aneurysms","Glomerulonephritis","Pericardial effusion"],
    correct: "B",
    explanation: "Kawasaki disease causes coronary artery aneurysms in ~25% of untreated cases (the most feared complication). IVIG + aspirin reduces this risk dramatically."
  },
  {
    id: 9, subject: 'pathology', difficulty: 'hard',
    question: "A 55-year-old woman on long-term prednisone for rheumatoid arthritis undergoes workup for Cushing syndrome. What is the most common overall cause of Cushing syndrome?",
    options: ["ACTH-secreting pituitary adenoma (Cushing disease)","Adrenal adenoma","Ectopic ACTH secretion (small cell lung cancer)","Exogenous glucocorticoid administration"],
    correct: "D",
    explanation: "Exogenous corticosteroid use (iatrogenic) is the most common cause of Cushing syndrome overall. Cushing disease (pituitary adenoma) is the most common endogenous cause."
  },
  {
    id: 10, subject: 'pharmacology', difficulty: 'easy',
    question: "A 42-year-old man presents with episodic hypertension, headaches, diaphoresis, and palpitations. Urine dipstick is unremarkable. What is the best initial test to evaluate for pheochromocytoma?",
    options: ["24-hour urine catecholamines","Plasma free metanephrines","CT abdomen with contrast","Clonidine suppression test"],
    correct: "B",
    explanation: "Plasma free metanephrines (normetanephrine + metanephrine) is the most sensitive test for pheochromocytoma (97% sensitivity) and is preferred as initial screening. 24h urine metanephrines is a good alternative."
  },
  {
    id: 11, subject: 'pathology', difficulty: 'easy',
    question: "A patient with type 1 diabetes mellitus undergoes annual renal screening. Which finding is the earliest detectable sign of diabetic nephropathy?",
    options: ["Increased serum creatinine","Decreased GFR on CKD-EPI equation","Microalbuminuria (30-300 mg/day)","Gross proteinuria (>3.5 g/day)"],
    correct: "C",
    explanation: "Microalbuminuria (30-300 mg albumin/day, or ACR 30-300 mg/g) is the earliest clinical marker of diabetic nephropathy. It reflects loss of glomerular basement membrane charge selectivity."
  },
  {
    id: 12, subject: 'cardiology', difficulty: 'hard',
    question: "A newborn presents with cyanosis unresponsive to 100% O2 (hyperoxia test negative). Echo shows the aorta arising from the right ventricle and pulmonary artery from the left ventricle. What is the embryological cause?",
    options: ["Failure of endocardial cushion formation","Abnormal neural crest cell migration to truncus arteriosus","Failure of the aorticopulmonary septum to spiral","Premature closure of the ductus arteriosus"],
    correct: "C",
    explanation: "Transposition of the great arteries results from failure of the aorticopulmonary septum to rotate/spiral during development, leaving the aorta connected to the RV and pulmonary artery to the LV."
  },
  {
    id: 13, subject: 'pathology', difficulty: 'hard',
    question: "A patient with a 40-pack-year smoking history presents with hemoptysis, weight loss, and hypercalcemia. Chest X-ray shows a central hilar mass. Which cell type is most likely?",
    options: ["Adenocarcinoma","Small cell carcinoma","Squamous cell carcinoma","Large cell carcinoma"],
    correct: "C",
    explanation: "Squamous cell carcinoma is centrally located, strongly associated with smoking, and causes hypercalcemia via PTHrP secretion. It also causes Pancoast tumors and cavitary lesions."
  },
  {
    id: 14, subject: 'pharmacology', difficulty: 'hard',
    question: "A 70-year-old woman on warfarin for AFib presents with an INR of 8.5 and minor gum bleeding. She is hemodynamically stable. What is the most appropriate management?",
    options: ["Hold warfarin and administer Vitamin K 10 mg IV","Hold warfarin, give fresh frozen plasma (FFP)","Hold warfarin and give oral Vitamin K 1-2.5 mg","Continue warfarin and recheck INR in 24 hours"],
    correct: "C",
    explanation: "For supratherapeutic INR (4-10) with minor/no bleeding: hold warfarin and give low-dose oral Vitamin K (1-2.5 mg). High-dose IV Vitamin K risks rebound hypercoagulability. FFP is for life-threatening bleeding."
  },
  {
    id: 15, subject: 'microbiology', difficulty: 'easy',
    question: "A 25-year-old man presents with urethral discharge and dysuria. Gram stain shows gram-negative intracellular diplococci. NAAT is positive for both Neisseria gonorrhoeae and Chlamydia trachomatis. What is the first-line treatment?",
    options: ["Ceftriaxone 500 mg IM once","Azithromycin 1g orally once","Ceftriaxone 500 mg IM + Doxycycline 100 mg BID x 7 days","Ciprofloxacin 500 mg orally once"],
    correct: "C",
    explanation: "CDC recommends ceftriaxone 500 mg IM for gonorrhea PLUS doxycycline 100 mg BID x 7 days to cover Chlamydia co-infection. Fluoroquinolones are no longer recommended due to resistance."
  },
  {
    id: 16, subject: 'pharmacology', difficulty: 'hard',
    question: "A 30-year-old woman has acute respiratory distress. ABG shows pH 7.52, PaCO2 28 mmHg, HCO3 22 mEq/L. What is the primary acid-base disturbance?",
    options: ["Metabolic alkalosis","Respiratory alkalosis","Mixed respiratory alkalosis and metabolic alkalosis","Respiratory alkalosis with metabolic compensation"],
    correct: "B",
    explanation: "pH 7.52 (alkalosis) + low PaCO2 (28) = primary respiratory alkalosis (hyperventilation). HCO3 22 is near-normal, consistent with acute respiratory alkalosis where compensation hasn't had time to occur."
  },
  {
    id: 17, subject: 'pathology', difficulty: 'easy',
    question: "A 55-year-old woman presents with fatigue, weight gain, constipation, dry skin, and a TSH of 18 mIU/L with free T4 of 0.4 ng/dL. Which antibody is most commonly responsible for this condition?",
    options: ["Anti-thyroid peroxidase (anti-TPO) antibodies","TSH receptor-stimulating antibodies","Anti-thyroglobulin antibodies only","Anti-microsomal antibodies only"],
    correct: "A",
    explanation: "Hashimoto thyroiditis (autoimmune hypothyroidism) is the most common cause of hypothyroidism in iodine-sufficient regions. Anti-TPO antibodies are present in >95% of cases and are the most sensitive marker."
  },
  {
    id: 18, subject: 'cardiology', difficulty: 'hard',
    question: "During cardiac auscultation, you hear a mid-systolic click followed by a late systolic murmur at the apex. The click moves EARLIER with standing. What is the most likely diagnosis?",
    options: ["Aortic stenosis","Mitral stenosis","Mitral valve prolapse (MVP)","Tricuspid regurgitation"],
    correct: "C",
    explanation: "MVP produces a midsystolic click + late systolic murmur. Standing decreases preload → smaller LV → leaflets prolapse earlier → click moves toward S1. Squatting does the opposite (click moves later)."
  },
  {
    id: 19, subject: 'pathology', difficulty: 'hard',
    question: "A 45-year-old alcoholic presents with acute severe epigastric pain radiating to the back, nausea, and vomiting. Serum lipase is 850 U/L. Which Ranson criterion is assessed at ADMISSION (not at 48 hours)?",
    options: ["Hematocrit fall > 10%","BUN rise > 5 mg/dL","Age > 55 years","PaO2 < 60 mmHg"],
    correct: "C",
    explanation: "Ranson criteria at admission include: Age >55, WBC >16K, glucose >200, LDH >350, AST >250. The other choices (Hct drop, BUN rise, PaO2, fluid sequestration, calcium) are 48-hour criteria."
  },
  {
    id: 20, subject: 'pharmacology', difficulty: 'easy',
    question: "A hospitalized patient develops hyponatremia (Na 124), euvolemia, concentrated urine (urine osm 520), urine sodium 42 mEq/L. Thyroid and adrenal function are normal. What is the most appropriate initial treatment?",
    options: ["Normal saline (0.9% NaCl) infusion","Hypertonic saline (3% NaCl) IV","Free water restriction to 800-1000 mL/day","Furosemide administration"],
    correct: "C",
    explanation: "This is classic SIADH (euvolemic hyponatremia, concentrated urine, high urine Na, no adrenal/thyroid disease). First-line treatment is fluid restriction. Hypertonic saline is reserved for severe symptomatic hyponatremia."
  },

  // ── CARDIOLOGY ──────────────────────────────────────────────────────────────
  {
    id: 21, subject: 'cardiology', difficulty: 'easy',
    question: "A 68-year-old man with hypertension presents with sudden-onset severe tearing chest pain radiating to the back. BP is 180/100 in the right arm and 140/85 in the left arm. CXR shows widened mediastinum. What is the most appropriate next step?",
    options: ["IV heparin and urgent echocardiogram","CT angiography of the chest","Emergent cardiac catheterization","Thrombolytics and ICU admission"],
    correct: "B",
    explanation: "Aortic dissection (Type A) presents with tearing pain, BP differential between arms, and widened mediastinum. CT angiography is the diagnostic test of choice. Heparin and thrombolytics are contraindicated."
  },
  {
    id: 22, subject: 'cardiology', difficulty: 'hard',
    question: "A 72-year-old woman with severe aortic stenosis is being evaluated. Which physical exam finding is most consistent with critical aortic stenosis?",
    options: ["Loud harsh systolic murmur with late peaking","Wide pulse pressure with bounding pulses","Soft murmur with diminished S2, pulsus parvus et tardus","Diastolic rumble loudest at the apex"],
    correct: "C",
    explanation: "Severe AS is characterized by a soft murmur (reduced flow), absent or paradoxically split S2 (delayed LV emptying), and pulsus parvus et tardus (weak, late-peaking carotid pulse). A loud murmur paradoxically suggests less severe disease."
  },
  {
    id: 23, subject: 'cardiology', difficulty: 'hard',
    question: "A 55-year-old man with dilated cardiomyopathy (EF 25%) is started on carvedilol. What is the primary mechanism by which beta-blockers improve mortality in HFrEF?",
    options: ["Increase cardiac output acutely by positive inotropy","Reduce afterload via peripheral vasodilation","Reverse pathological cardiac remodeling over weeks to months","Directly inhibit the renin-angiotensin-aldosterone system"],
    correct: "C",
    explanation: "Chronic sympathetic activation in HFrEF drives maladaptive remodeling (hypertrophy, fibrosis, apoptosis). Beta-blockers reverse this over weeks to months, improving EF and reducing mortality by 34%."
  },
  {
    id: 24, subject: 'cardiology', difficulty: 'easy',
    question: "A patient in the ICU develops new-onset atrial fibrillation with rapid ventricular response (HR 148, BP 88/60). She is diaphoretic and confused. What is the most appropriate immediate management?",
    options: ["IV metoprolol 5 mg to control rate","IV amiodarone infusion over 24 hours","Synchronized DC cardioversion","Oral digoxin loading"],
    correct: "C",
    explanation: "Hemodynamically unstable AF (hypotension, altered mental status) requires immediate synchronized DC cardioversion. Rate-control and antiarrhythmic drugs are appropriate only in hemodynamically stable patients."
  },
  {
    id: 25, subject: 'cardiology', difficulty: 'easy',
    question: "A 48-year-old man with stable CAD and 75% LAD stenosis asks about reducing future MI risk. Which medication has the strongest evidence for reducing MI and mortality in stable coronary artery disease?",
    options: ["Long-acting nitrates (isosorbide mononitrate)","Calcium channel blockers (amlodipine)","Aspirin + high-intensity statin therapy","Beta-blockers as monotherapy"],
    correct: "C",
    explanation: "Aspirin (antiplatelet) plus high-intensity statin (plaque stabilization, LDL reduction) form the cornerstone of secondary prevention in CAD with the strongest mortality benefit."
  },
  {
    id: 26, subject: 'cardiology', difficulty: 'easy',
    question: "A 35-year-old marathon runner is resuscitated from ventricular fibrillation. Echo shows asymmetric septal hypertrophy. Genetic testing reveals a MYH7 mutation. What is the most important recommendation to prevent sudden cardiac death?",
    options: ["Implantable cardioverter-defibrillator (ICD) placement","Disopyramide therapy alone","Surgical myectomy immediately","Restriction from all competitive athletics only"],
    correct: "A",
    explanation: "This patient with HOCM and aborted SCD (resuscitated VF) has a class I indication for ICD implantation as secondary prevention. ICD is the only intervention proven to prevent sudden cardiac death in high-risk HOCM."
  },
  {
    id: 27, subject: 'cardiology', difficulty: 'hard',
    question: "A 60-year-old man with longstanding hypertension presents with dyspnea on exertion. Echo shows EF of 60% with impaired relaxation (E/A ratio 0.7, E/e' ratio 15). What is the most likely diagnosis?",
    options: ["Heart failure with reduced ejection fraction (HFrEF)","Hypertrophic obstructive cardiomyopathy","Heart failure with preserved ejection fraction (HFpEF)","Restrictive cardiomyopathy due to amyloidosis"],
    correct: "C",
    explanation: "HFpEF (diastolic heart failure) presents with classic heart failure symptoms but preserved EF (≥50%). Impaired relaxation pattern (E/A <1, elevated E/e') confirms diastolic dysfunction. Hypertension is the most common cause."
  },
  {
    id: 28, subject: 'cardiology', difficulty: 'hard',
    question: "A patient is found to have a prolonged QT interval (QTc 520 ms) on routine ECG. Which drug combination is most likely responsible?",
    options: ["Metformin + lisinopril","Haloperidol + azithromycin","Atorvastatin + amlodipine","Metoprolol + hydrochlorothiazide"],
    correct: "B",
    explanation: "Haloperidol (antipsychotic) and azithromycin (macrolide antibiotic) both independently prolong the QT interval by blocking cardiac hERG (IKr) potassium channels. Their combination significantly increases risk of Torsades de Pointes."
  },
  {
    id: 29, subject: 'cardiology', difficulty: 'easy',
    question: "A 58-year-old man with anterior STEMI undergoes successful PCI. On day 3, he develops new-onset fever, pleuritic chest pain, and a friction rub. ECG shows diffuse saddle-shaped ST elevation. What is the most likely diagnosis?",
    options: ["Reinfarction with re-occlusion of the LAD stent","Dressler syndrome (post-MI pericarditis)","Left ventricular free wall rupture","Pulmonary embolism"],
    correct: "B",
    explanation: "Dressler syndrome is an autoimmune pericarditis occurring 2-10 weeks after MI. It presents with fever, pleuritic chest pain, friction rub, and diffuse saddle-shaped ST elevation. Treatment is NSAIDs + colchicine."
  },
  {
    id: 30, subject: 'cardiology', difficulty: 'hard',
    question: "A 44-year-old woman with mitral stenosis from rheumatic heart disease develops increasing dyspnea and hemoptysis. She is in atrial fibrillation. Which hemodynamic change is responsible for hemoptysis in mitral stenosis?",
    options: ["Decreased pulmonary venous pressure causing alveolar hemorrhage","Increased left ventricular end-diastolic pressure","Elevated left atrial pressure transmitted to pulmonary vasculature causing pulmonary hypertension","Right heart failure causing systemic venous hypertension"],
    correct: "C",
    explanation: "Mitral stenosis obstructs LA outflow → elevated LA pressure → elevated pulmonary venous pressure → pulmonary hypertension → rupture of dilated pulmonary veins (pulmonary apoplexy)."
  },

  // ── NEUROLOGY ───────────────────────────────────────────────────────────────
  {
    id: 31, subject: 'neurology', difficulty: 'easy',
    question: "A 67-year-old man with atrial fibrillation presents with sudden-onset left-sided weakness and facial droop that completely resolved within 45 minutes. MRI DWI shows no acute infarct. What is the most important next step to prevent stroke?",
    options: ["Start aspirin 81 mg daily","Start anticoagulation (warfarin or DOAC)","Carotid endarterectomy","CT head without contrast to rule out hemorrhage"],
    correct: "B",
    explanation: "This is a TIA in a patient with AF. AF-related TIA/stroke is cardioembolic and requires anticoagulation (not antiplatelet therapy). DOACs (apixaban, rivaroxaban) or warfarin significantly reduce stroke risk."
  },
  {
    id: 32, subject: 'neurology', difficulty: 'easy',
    question: "A 72-year-old man presents with a 6-month history of resting tremor in his right hand, cogwheel rigidity, bradykinesia, and shuffling gait. What is the primary pathological finding in Parkinson disease?",
    options: ["Neurofibrillary tangles in the hippocampus","Loss of dopaminergic neurons in the substantia nigra pars compacta with Lewy body formation","Huntingtin protein aggregation in the striatum","TDP-43 inclusions in the motor cortex"],
    correct: "B",
    explanation: "Parkinson disease is characterized by degeneration of dopaminergic neurons in the substantia nigra pars compacta, leading to striatal dopamine deficiency. Lewy bodies (alpha-synuclein aggregates) are the pathological hallmark."
  },
  {
    id: 33, subject: 'neurology', difficulty: 'hard',
    question: "A 25-year-old woman presents with optic neuritis 2 years ago and now right arm weakness. MRI shows periventricular white matter lesions with gadolinium enhancement. CSF shows oligoclonal IgG bands. What is the most likely diagnosis?",
    options: ["Neuromyelitis optica (NMO)","CNS vasculitis","Multiple sclerosis (MS)","Acute disseminated encephalomyelitis (ADEM)"],
    correct: "C",
    explanation: "MS presents with relapsing-remitting neurological episodes, periventricular demyelinating plaques on MRI (Dawson fingers), and CSF oligoclonal bands. The dissemination in space and time meets McDonald criteria."
  },
  {
    id: 34, subject: 'neurology', difficulty: 'easy',
    question: "A 45-year-old woman presents with severe unilateral headache behind the right eye, ptosis, and dilated pupil. MRI shows a 7 mm posterior communicating artery aneurysm. Which structure is being compressed?",
    options: ["Optic nerve (CN II)","Oculomotor nerve (CN III)","Trochlear nerve (CN IV)","Abducens nerve (CN VI)"],
    correct: "B",
    explanation: "A posterior communicating artery aneurysm classically compresses CN III, causing a 'surgical' CN III palsy: ptosis, ophthalmoplegia, AND a blown pupil (dilated, unreactive) due to compression of parasympathetic fibers."
  },
  {
    id: 35, subject: 'neurology', difficulty: 'easy',
    question: "An 80-year-old man develops fluctuating confusion, vivid visual hallucinations, and Parkinsonian features. He is very sensitive to haloperidol (developed severe rigidity with a small dose). What is the most likely diagnosis?",
    options: ["Vascular dementia with delirium superimposed","Lewy body dementia","Frontotemporal dementia","Normal pressure hydrocephalus"],
    correct: "B",
    explanation: "Lewy body dementia is characterized by fluctuating cognition, vivid visual hallucinations, Parkinsonism, and severe neuroleptic sensitivity (antipsychotics can be fatal). Alpha-synuclein Lewy bodies are found cortically."
  },
  {
    id: 36, subject: 'neurology', difficulty: 'hard',
    question: "A 35-year-old woman presents with ascending weakness over 3 days, absent DTRs, and mild sensory loss. She had a GI illness 3 weeks ago. CSF shows elevated protein with normal cell count (albuminocytologic dissociation). What is the pathophysiology?",
    options: ["Autoimmune demyelination of peripheral nerves via molecular mimicry","Direct invasion of anterior horn cells by enterovirus","Compression of the cauda equina by a herniated disc","Paraneoplastic antibody attack on the neuromuscular junction"],
    correct: "A",
    explanation: "Guillain-Barré syndrome (GBS) follows GI/URI infection (Campylobacter jejuni most common). Molecular mimicry causes autoimmune attack on peripheral nerve myelin. CSF shows albuminocytologic dissociation (high protein, normal WBC)."
  },
  {
    id: 37, subject: 'neurology', difficulty: 'easy',
    question: "A 55-year-old man presents with episodic, excruciating unilateral facial pain triggered by chewing and light touch, lasting seconds to 2 minutes. Neurological exam is completely normal. What is the most appropriate first-line treatment?",
    options: ["Gabapentin 300 mg TID","Carbamazepine 200 mg BID","Sumatriptan 6 mg SC","Indomethacin 25 mg TID"],
    correct: "B",
    explanation: "Trigeminal neuralgia (tic douloureux) presents with brief, lancinating pain in CN V distribution triggered by light stimuli. Carbamazepine (sodium channel blocker) is the first-line treatment with the best evidence and is often diagnostic."
  },
  {
    id: 38, subject: 'neurology', difficulty: 'hard',
    question: "A 19-year-old woman has her first generalized tonic-clonic seizure. She reports jerking of her arms every morning for the past year, especially on awakening. EEG shows 3-4 Hz polyspike-and-wave discharges. What is the most appropriate treatment?",
    options: ["Phenytoin 300 mg daily","Carbamazepine 400 mg BID","Valproic acid 500 mg BID","Levetiracetam 500 mg BID as first choice over valproate"],
    correct: "C",
    explanation: "Juvenile myoclonic epilepsy (JME) features morning myoclonic jerks, GTC seizures, and 4-6 Hz polyspike-wave on EEG. Valproic acid is most effective. Levetiracetam is a reasonable alternative in women of childbearing age. Carbamazepine and phenytoin can worsen JME."
  },
  {
    id: 39, subject: 'neurology', difficulty: 'easy',
    question: "A 62-year-old hypertensive man presents with sudden severe headache, vomiting, and neck stiffness. CT head is negative for blood. Lumbar puncture shows xanthochromia and RBCs in all 4 tubes. What is the most likely source of bleeding?",
    options: ["Hypertensive hemorrhage in the basal ganglia","Ruptured arteriovenous malformation in the cortex","Ruptured saccular (berry) aneurysm at the circle of Willis","Subdural hematoma from bridging vein rupture"],
    correct: "C",
    explanation: "Thunderclap headache + xanthochromia (bilirubin from lysed RBCs) = subarachnoid hemorrhage. The most common cause is rupture of a saccular (berry) aneurysm at the circle of Willis, most often at the anterior communicating artery."
  },
  {
    id: 40, subject: 'neurology', difficulty: 'hard',
    question: "A 50-year-old woman with small cell lung cancer develops confusion, hyponatremia, and ataxia. Anti-Hu antibodies are detected in her CSF. Which paraneoplastic syndrome best explains her neurological findings?",
    options: ["Lambert-Eaton myasthenic syndrome","Paraneoplastic limbic encephalitis and cerebellar degeneration","Opsoclonus-myoclonus syndrome","Stiff-person syndrome"],
    correct: "B",
    explanation: "Anti-Hu (ANNA-1) antibodies are associated with small cell lung cancer and cause paraneoplastic encephalomyelitis including limbic encephalitis (confusion) and cerebellar degeneration (ataxia). SIADH (hyponatremia) is also a common paraneoplastic effect of SCLC."
  },

  // ── PHARMACOLOGY ────────────────────────────────────────────────────────────
  {
    id: 41, subject: 'pharmacology', difficulty: 'hard',
    question: "A 40-year-old man with gout is started on allopurinol. He also takes azathioprine for inflammatory bowel disease. Why is this combination dangerous?",
    options: ["Allopurinol induces CYP3A4, rapidly metabolizing azathioprine to toxic levels","Allopurinol inhibits xanthine oxidase, blocking azathioprine metabolism and causing toxic accumulation of 6-mercaptopurine","Both drugs compete for renal tubular secretion, causing allopurinol toxicity","Azathioprine inhibits HGPRT, synergistically increasing uric acid with allopurinol"],
    correct: "B",
    explanation: "Azathioprine is converted to 6-mercaptopurine (6-MP), which is inactivated by xanthine oxidase. Allopurinol inhibits xanthine oxidase → 6-MP accumulates → severe myelosuppression. The dose of azathioprine must be reduced by 75%."
  },
  {
    id: 42, subject: 'pharmacology', difficulty: 'easy',
    question: "A 28-year-old woman on oral contraceptive pills (OCPs) starts rifampin for latent TB treatment. She uses OCPs as her sole contraception. What should she be counseled about?",
    options: ["Rifampin has no interaction with OCPs","Rifampin inhibits CYP450, increasing OCP hormone levels and causing toxicity","Rifampin induces CYP3A4, increasing OCP metabolism and reducing contraceptive efficacy","She should stop rifampin and use an alternative TB treatment"],
    correct: "C",
    explanation: "Rifampin is a potent inducer of CYP3A4, which metabolizes estrogen and progestin in OCPs. Increased metabolism reduces plasma hormone levels, potentially leading to contraceptive failure."
  },
  {
    id: 43, subject: 'pharmacology', difficulty: 'easy',
    question: "A 55-year-old man with hypertension and diabetes develops a dry, persistent cough after starting a new antihypertensive. He is switched to a drug in the same class that does not cause this side effect. What is the mechanism of the original drug's cough?",
    options: ["Beta-1 blockade causing bronchospasm","Accumulation of bradykinin due to ACE inhibition","Calcium channel blockade causing mucus hypersecretion","Sodium retention causing post-nasal drip"],
    correct: "B",
    explanation: "ACE inhibitors (e.g., lisinopril) cause dry cough in 10-15% of patients by blocking ACE, which normally degrades bradykinin. Bradykinin accumulation stimulates cough receptors. ARBs (e.g., losartan) are the preferred alternative."
  },
  {
    id: 44, subject: 'pharmacology', difficulty: 'easy',
    question: "A 62-year-old woman with type 2 diabetes and an eGFR of 38 mL/min/1.73m² is on metformin. An urgent CT scan with IV contrast is planned. What is the most appropriate action regarding her metformin?",
    options: ["Continue metformin without interruption; no risk at this eGFR","Hold metformin before and for 48 hours after contrast; reassess renal function before restarting","Permanently discontinue metformin and switch to insulin","Administer IV bicarbonate infusion prophylactically and continue metformin"],
    correct: "B",
    explanation: "IV contrast can cause contrast-induced nephropathy, reducing GFR further. Metformin accumulates in renal impairment and carries risk of lactic acidosis. Guidelines recommend holding metformin at time of contrast and for 48 hours afterward."
  },
  {
    id: 45, subject: 'pharmacology', difficulty: 'hard',
    question: "A patient on lithium therapy presents with coarse tremor, polyuria, vomiting, diarrhea, and confusion. Serum lithium level is 2.8 mEq/L (therapeutic range 0.6-1.2). Which intervention is most critical?",
    options: ["Increase oral fluid intake and add amiloride for nephrogenic DI","Immediate hemodialysis","IV sodium bicarbonate to alkalinize urine","Activated charcoal administration"],
    correct: "B",
    explanation: "Severe lithium toxicity (>2.5 mEq/L) with neurotoxicity (confusion, tremor, vomiting) requires hemodialysis. Lithium is not protein-bound and is dialyzable. IV fluids alone are insufficient at this level."
  },
  {
    id: 46, subject: 'pharmacology', difficulty: 'hard',
    question: "A 35-year-old HIV-positive man on antiretroviral therapy develops central fat accumulation (buffalo hump, truncal obesity), peripheral fat wasting, hyperlipidemia, and insulin resistance. Which class of antiretroviral is most associated with this lipodystrophy syndrome?",
    options: ["NRTIs (nucleoside reverse transcriptase inhibitors) like tenofovir","Protease inhibitors (PIs) like lopinavir/ritonavir","Integrase inhibitors like raltegravir","CCR5 antagonists like maraviroc"],
    correct: "B",
    explanation: "HIV-associated lipodystrophy syndrome with central adiposity, peripheral lipoatrophy, dyslipidemia, and insulin resistance is most strongly associated with protease inhibitors. PIs inhibit lipid metabolism enzymes and glucose transporters."
  },
  {
    id: 47, subject: 'pharmacology', difficulty: 'hard',
    question: "A patient taking warfarin for atrial fibrillation starts fluconazole for a vaginal yeast infection. INR rises from 2.5 to 5.8 within 5 days. What is the mechanism of this interaction?",
    options: ["Fluconazole displaces warfarin from albumin binding sites","Fluconazole inhibits CYP2C9, reducing warfarin (S-enantiomer) metabolism","Fluconazole induces vitamin K epoxide reductase","Fluconazole increases gut flora that synthesize vitamin K"],
    correct: "B",
    explanation: "Fluconazole is a potent inhibitor of CYP2C9, the primary enzyme metabolizing S-warfarin (the more potent enantiomer). Reduced metabolism → elevated warfarin levels → supratherapeutic INR."
  },
  {
    id: 48, subject: 'pharmacology', difficulty: 'hard',
    question: "A 70-year-old man with Alzheimer's disease is started on donepezil. He also has urge urinary incontinence. Which drug used for his incontinence would be pharmacologically antagonistic to donepezil?",
    options: ["Mirabegron (beta-3 adrenergic agonist)","Oxybutynin (muscarinic antagonist)","Tamsulosin (alpha-1 blocker)","Finasteride (5-alpha reductase inhibitor)"],
    correct: "B",
    explanation: "Donepezil is an acetylcholinesterase inhibitor that increases ACh at muscarinic receptors. Oxybutynin is a muscarinic antagonist for OAB. These drugs have opposing mechanisms and oxybutynin's anticholinergic effects also worsen cognition — mirabegron is preferred."
  },
  {
    id: 49, subject: 'pharmacology', difficulty: 'easy',
    question: "A 28-year-old woman with bipolar disorder takes valproic acid. She becomes pregnant. Which fetal risk must she be counseled about most specifically?",
    options: ["Ebstein anomaly (tricuspid valve displacement)","Neural tube defects (spina bifida, anencephaly)","Cleft palate and micrognathia","Digit hypoplasia and nail dysplasia"],
    correct: "B",
    explanation: "Valproic acid is a potent teratogen that inhibits folate metabolism, causing neural tube defects (spina bifida in ~1-2%). Folic acid supplementation is critical but doesn't fully prevent this risk. Ebstein anomaly is associated with lithium."
  },
  {
    id: 50, subject: 'pharmacology', difficulty: 'easy',
    question: "A 30-year-old man with schizophrenia develops high fever (40°C), muscle rigidity, diaphoresis, altered consciousness, and autonomic instability after his haloperidol dose is doubled. CK is 12,000 U/L. What is the treatment of choice?",
    options: ["Benztropine and diphenhydramine IV","Bromocriptine and dantrolene","Cyproheptadine and benzodiazepines","Cooling blankets and acetaminophen only"],
    correct: "B",
    explanation: "Neuroleptic malignant syndrome (NMS) is caused by dopamine receptor blockade → hyperthermia, rigidity, altered consciousness, autonomic instability, and markedly elevated CK. Treatment: stop the antipsychotic, dantrolene (muscle relaxant), and bromocriptine (dopamine agonist)."
  },

  // ── MICROBIOLOGY ────────────────────────────────────────────────────────────
  {
    id: 51, subject: 'microbiology', difficulty: 'easy',
    question: "A 4-year-old unvaccinated child presents with a barking cough, inspiratory stridor, and a low-grade fever. Neck X-ray shows a 'steeple sign' (subglottic narrowing). What is the most likely causative organism?",
    options: ["Haemophilus influenzae type b","Parainfluenza virus type 1","Respiratory syncytial virus (RSV)","Staphylococcus aureus"],
    correct: "B",
    explanation: "Croup (laryngotracheobronchitis) is most commonly caused by Parainfluenza virus type 1. It affects children 6 months to 3 years, causing barking cough, stridor, and the steeple sign on AP neck X-ray due to subglottic edema."
  },
  {
    id: 52, subject: 'microbiology', difficulty: 'easy',
    question: "A 22-year-old sexually active woman presents with lower abdominal pain, cervical motion tenderness, adnexal tenderness, and mucopurulent cervical discharge. What is the most appropriate antibiotic regimen for outpatient treatment of PID?",
    options: ["Azithromycin 1g orally once","Ceftriaxone 500 mg IM + doxycycline 100 mg BID + metronidazole 500 mg BID x 14 days","Ciprofloxacin 500 mg BID x 7 days","Amoxicillin-clavulanate 875/125 mg BID x 10 days"],
    correct: "B",
    explanation: "CDC guidelines for outpatient PID: ceftriaxone IM (covers gonorrhea) + doxycycline (covers chlamydia and anaerobes) + metronidazole (covers BV-associated anaerobes) for 14 days."
  },
  {
    id: 53, subject: 'microbiology', difficulty: 'easy',
    question: "A 45-year-old spelunker from Ohio presents with fever, cough, and hilar adenopathy. His job involves cleaning bat droppings. Lung biopsy shows macrophages filled with small oval yeast forms (2-4 µm). What is the diagnosis?",
    options: ["Coccidioidomycosis","Histoplasmosis","Blastomycosis","Cryptococcosis"],
    correct: "B",
    explanation: "Histoplasma capsulatum is endemic to the Ohio/Mississippi River valley and found in bat/bird droppings. Biopsy shows small intracellular yeast within macrophages. Hilar adenopathy (mimicking sarcoidosis or TB) is characteristic."
  },
  {
    id: 54, subject: 'microbiology', difficulty: 'easy',
    question: "A 3-day-old neonate develops purulent conjunctivitis. Gram stain shows gram-negative intracellular diplococci. The mother had untreated gonorrhea during pregnancy. Which antibiotic is used to prevent this condition in all newborns at birth?",
    options: ["Topical erythromycin 0.5% ointment","Topical silver nitrate 1% drops","IM ceftriaxone prophylaxis","Topical gentamicin drops"],
    correct: "A",
    explanation: "Ophthalmia neonatorum caused by Neisseria gonorrhoeae presents within 1-4 days of birth. Erythromycin 0.5% ophthalmic ointment is the standard prophylaxis given to all newborns at birth in the US."
  },
  {
    id: 55, subject: 'microbiology', difficulty: 'easy',
    question: "A 28-year-old man presents with painless penile ulcer (chancre) with a clean base and indurated edges, and non-tender inguinal lymphadenopathy. Dark-field microscopy shows motile spirochetes. RPR and FTA-ABS are positive. What is the treatment of choice?",
    options: ["Doxycycline 100 mg BID x 14 days","Benzathine penicillin G 2.4 million units IM once","Ceftriaxone 1 g IV daily x 10 days","Azithromycin 2 g orally once"],
    correct: "B",
    explanation: "Primary syphilis (Treponema pallidum) presents with painless chancre. Treatment is benzathine penicillin G 2.4 million units IM as a single dose — the drug of choice for all stages of syphilis."
  },
  {
    id: 56, subject: 'microbiology', difficulty: 'hard',
    question: "A 35-year-old HIV-positive man (CD4 count 45 cells/µL) develops headache, fever, and confusion. India ink stain of CSF shows encapsulated yeast, and latex agglutination for capsular polysaccharide is positive. What is the treatment of choice?",
    options: ["Fluconazole 400 mg daily alone","Voriconazole IV for 6 weeks","Amphotericin B deoxycholate + flucytosine for 2 weeks, then fluconazole","Micafungin (echinocandin) IV for 4 weeks"],
    correct: "C",
    explanation: "Cryptococcal meningitis (Cryptococcus neoformans) in AIDS is treated with induction: amphotericin B liposomal + flucytosine for ≥2 weeks, followed by consolidation with fluconazole for 8 weeks, then suppressive fluconazole. Echinocandins have no activity against Cryptococcus."
  },
  {
    id: 57, subject: 'microbiology', difficulty: 'hard',
    question: "A 6-year-old child develops a honey-crusted, weeping lesion around the nose and mouth after a minor abrasion. Gram stain shows gram-positive cocci in clusters. What is the mechanism of the toxin responsible for bullous impetigo?",
    options: ["Group A Streptococcus; streptolysin O causes direct cell lysis","Staphylococcus aureus; exfoliative toxin (ET-A/ET-B) cleaves desmoglein-1 in the superficial epidermis","Staphylococcus epidermidis; biofilm formation disrupts the skin barrier","Streptococcus pyogenes; M protein inhibits phagocytosis causing local invasion"],
    correct: "B",
    explanation: "Bullous impetigo is caused by S. aureus phage group II producing exfoliative toxins (ET-A and ET-B), serine proteases that cleave desmoglein-1 in the stratum granulosum → intraepidermal blistering."
  },
  {
    id: 58, subject: 'microbiology', difficulty: 'easy',
    question: "A 50-year-old man returns from sub-Saharan Africa with cyclic fevers every 48 hours, headache, and splenomegaly. Blood smear shows ring-form trophozoites with Schüffner dots in enlarged RBCs. Which Plasmodium species is responsible?",
    options: ["Plasmodium falciparum","Plasmodium vivax or Plasmodium ovale","Plasmodium malariae","Plasmodium knowlesi"],
    correct: "B",
    explanation: "Schüffner dots (stippling) in enlarged RBCs with 48-hour (tertian) fever cycles are characteristic of P. vivax or P. ovale. P. falciparum has irregular fever cycles and banana-shaped gametocytes without Schüffner dots."
  },
  {
    id: 59, subject: 'microbiology', difficulty: 'hard',
    question: "A healthcare worker sustains a needlestick injury from a HBsAg-positive patient. The healthcare worker was vaccinated against hepatitis B but her anti-HBs titer was undetectable at her last check. What is the most appropriate post-exposure management?",
    options: ["Hepatitis B immunoglobulin (HBIG) alone immediately","Repeat hepatitis B vaccine series only","HBIG immediately + hepatitis B vaccine (first dose) at a different site","Check anti-HBc; if positive, no treatment needed"],
    correct: "C",
    explanation: "For a non-immune exposed individual (undetectable anti-HBs): give HBIG (immediate passive immunity) AND initiate/repeat HBV vaccine series (active immunity). Both must be given within 24 hours of exposure."
  },
  {
    id: 60, subject: 'microbiology', difficulty: 'hard',
    question: "A 25-year-old woman presents with profuse, watery, rice-water diarrhea after eating raw shellfish in Southeast Asia. Stool culture grows curved gram-negative rods that are oxidase-positive and grow on TCBS agar. What is the virulence mechanism of this organism?",
    options: ["Shiga toxin inhibiting 60S ribosome protein synthesis","Cholera toxin permanently activating Gs protein → constitutive cAMP elevation → massive Cl- and water secretion","Heat-stable enterotoxin activating guanylate cyclase","Invasion of intestinal epithelial cells causing bloody diarrhea"],
    correct: "B",
    explanation: "Vibrio cholerae produces cholera toxin (CT): an AB toxin that ADP-ribosylates Gs-alpha protein (locks it in active state) → constitutive adenylate cyclase activation → elevated cAMP → CFTR Cl- channel activation → massive isotonic secretory diarrhea."
  },

  // ── PATHOLOGY ───────────────────────────────────────────────────────────────
  {
    id: 61, subject: 'pathology', difficulty: 'easy',
    question: "A 55-year-old woman undergoes biopsy of a 1.8 cm breast mass. Pathology shows malignant cells arranged in a glandular pattern with necrotic debris in the center of the ducts, confined to the ductal system without basement membrane invasion. What is the diagnosis?",
    options: ["Invasive ductal carcinoma (IDC)","Invasive lobular carcinoma","Ductal carcinoma in situ (DCIS), comedo type","Fibroadenoma with atypical ductal hyperplasia"],
    correct: "C",
    explanation: "Ductal carcinoma in situ (DCIS) is a non-invasive malignancy confined within the basement membrane. The comedo subtype has high-grade nuclei with central necrosis (comedonecrosis) and dystrophic calcifications on mammography."
  },
  {
    id: 62, subject: 'pathology', difficulty: 'hard',
    question: "A 45-year-old man with sickle cell disease has Howell-Jolly bodies on peripheral smear. Hemoglobin electrophoresis shows HbS 92%, HbA2 4%, HbF 4%. What is the explanation for the Howell-Jolly bodies?",
    options: ["Iron deficiency leading to impaired hemoglobin synthesis","Functional asplenia due to repeated sickling infarcts of the spleen","Vitamin B12 deficiency causing ineffective erythropoiesis","Intravascular hemolysis releasing nuclear remnants into circulation"],
    correct: "B",
    explanation: "In sickle cell disease, repeated vascular occlusion causes splenic infarcts → autosplenectomy (functional asplenia) by early adulthood. The spleen normally removes nuclear remnants (Howell-Jolly bodies) from RBCs; without splenic function these persist in circulation."
  },
  {
    id: 63, subject: 'pathology', difficulty: 'hard',
    question: "A 70-year-old man presents with worsening back pain and fatigue. Labs show Ca²⁺ 12.2 mg/dL, creatinine 2.8, total protein 10.1 g/dL. Serum protein electrophoresis shows a monoclonal spike. Urine shows Bence-Jones proteinuria. Bone marrow biopsy shows 35% plasma cells. What is the diagnosis?",
    options: ["Waldenstrom macroglobulinemia","MGUS (monoclonal gammopathy of undetermined significance)","Multiple myeloma","Chronic lymphocytic leukemia with plasmacytic differentiation"],
    correct: "C",
    explanation: "Multiple myeloma diagnostic criteria: ≥10% clonal plasma cells on bone marrow biopsy PLUS one or more CRAB features: Calcium elevation, Renal failure, Anemia, Bone lesions. Bence-Jones proteins are free light chains causing cast nephropathy."
  },
  {
    id: 64, subject: 'pathology', difficulty: 'hard',
    question: "A 35-year-old woman presents with a painless neck mass. Biopsy shows large binucleate cells with prominent 'owl-eye' nucleoli surrounded by a clear halo, mixed with lymphocytes, eosinophils, and plasma cells. What is the cell of origin of the malignant cells?",
    options: ["T lymphocytes","Reed-Sternberg cells derived from germinal center B cells","Follicular dendritic cells","NK cells"],
    correct: "B",
    explanation: "Classical Hodgkin lymphoma is characterized by Reed-Sternberg (RS) cells — large binucleate/bilobed cells with owl-eye nucleoli. RS cells are clonal germinal center B cells that are CD20-negative, CD15+, CD30+."
  },
  {
    id: 65, subject: 'pathology', difficulty: 'hard',
    question: "A 28-year-old man presents with progressive dysphagia to solids and liquids, regurgitation of undigested food, and weight loss for 2 years. Barium swallow shows a 'bird-beak' tapering at the GEJ. Manometry shows absent peristalsis and failure of LES relaxation. What is the pathological mechanism?",
    options: ["Barrett metaplasia with dysplastic stricture formation","Loss of inhibitory neurons (VIP/NO-producing) in the myenteric plexus of the esophagus","Esophageal squamous cell carcinoma infiltrating the muscular wall","Diffuse esophageal spasm from calcium channel dysregulation"],
    correct: "B",
    explanation: "Achalasia results from autoimmune destruction of inhibitory ganglion cells (VIP/NO-producing neurons) in Auerbach's myenteric plexus → failure of LES relaxation and absent esophageal peristalsis. The 'bird-beak' deformity on barium swallow is pathognomonic."
  },
  {
    id: 66, subject: 'pathology', difficulty: 'hard',
    question: "A 60-year-old male smoker presents with new-onset hypertension and hematuria. CT shows a 6-cm renal mass with venous invasion. Pathology reveals clear cells arranged in nests with rich vascularity. Which genetic alteration is most commonly associated with this tumor?",
    options: ["WT1 tumor suppressor gene deletion","VHL (von Hippel-Lindau) gene inactivation on chromosome 3p","MET proto-oncogene mutation","PTEN deletion on chromosome 10q"],
    correct: "B",
    explanation: "Clear cell renal cell carcinoma (most common RCC type, 75%) is strongly associated with inactivation of the VHL tumor suppressor gene on chromosome 3p. VHL loss → HIF stabilization → VEGF overexpression → rich vascularity."
  },
  {
    id: 67, subject: 'pathology', difficulty: 'hard',
    question: "A 55-year-old man with alcoholic cirrhosis develops worsening ascites and confusion. Alpha-fetoprotein is 1,200 ng/mL. CT shows a 4 cm arterially enhancing hepatic mass with venous washout. Which pathological sequence led to this malignancy?",
    options: ["Normal liver → steatohepatitis → fibrosis → cirrhosis → hepatocellular carcinoma","Normal liver → cholestasis → bile duct hamartoma → cholangiocarcinoma","Chronic viral hepatitis → bridging fibrosis → lymphoma transformation","Normal liver → regenerative nodule → adenoma → adenocarcinoma"],
    correct: "A",
    explanation: "Hepatocellular carcinoma (HCC) classically arises in the setting of cirrhosis through: hepatocyte injury → inflammation → fibrosis → cirrhosis → dysplastic nodule → HCC. Arterial enhancement + venous washout on CT is pathognomonic for HCC (LI-RADS 5)."
  },
  {
    id: 68, subject: 'pathology', difficulty: 'hard',
    question: "A 40-year-old woman undergoes colectomy for familial adenomatous polyposis (FAP). Pathology shows hundreds of adenomatous polyps. Which gene mutation is responsible and what is its normal function?",
    options: ["KRAS mutation; normally activates RAS-MAPK growth signaling","APC gene mutation (chromosome 5q); normally promotes β-catenin degradation","MLH1 methylation; normally participates in DNA mismatch repair","TP53 mutation; normally triggers apoptosis in response to DNA damage"],
    correct: "B",
    explanation: "FAP is caused by germline mutations in APC (adenomatous polyposis coli) tumor suppressor gene on chromosome 5q. APC normally promotes proteasomal degradation of β-catenin. Loss of APC → β-catenin accumulates → Wnt signaling activation → proliferation."
  },
  {
    id: 69, subject: 'pathology', difficulty: 'hard',
    question: "A 25-year-old woman presents with severe episodic headaches, flushing, and diarrhea. 24-hour urine shows markedly elevated 5-HIAA. CT abdomen shows a 1.5 cm mass in the ileum with multiple liver metastases. What is the pathological origin of this tumor?",
    options: ["Goblet cells of the small intestinal mucosa","Enterochromaffin (Kulchitsky) cells of the APUD system","Chief cells of the gastric mucosa","Smooth muscle cells of the muscularis propria"],
    correct: "B",
    explanation: "Carcinoid tumors arise from enterochromaffin (Kulchitsky) cells — neuroendocrine cells of the APUD system. They produce serotonin. Carcinoid syndrome (flushing, diarrhea, wheezing, right-sided valvular disease) occurs when liver metastases allow serotonin to bypass first-pass hepatic metabolism."
  },
  {
    id: 70, subject: 'pathology', difficulty: 'easy',
    question: "Autopsy of a 75-year-old man reveals bilateral hippocampal atrophy and microscopic examination shows neurofibrillary tangles (paired helical filaments of hyperphosphorylated tau) and neuritic plaques (amyloid-beta core with dystrophic neurites). These findings are most characteristic of which process?",
    options: ["Normal aging changes of the hippocampus","Lewy body disease with hippocampal extension","Alzheimer's disease neuropathology","Frontotemporal lobar degeneration (FTLD-tau)"],
    correct: "C",
    explanation: "The neuropathological hallmarks of Alzheimer's disease are: (1) neurofibrillary tangles — intraneuronal aggregates of hyperphosphorylated tau; and (2) senile (neuritic) plaques — extracellular amyloid-beta (Aβ42) deposits with surrounding dystrophic neurites."
  },

  // ── BIOCHEMISTRY ────────────────────────────────────────────────────────────
  {
    id: 71, subject: 'biochemistry', difficulty: 'easy',
    question: "A newborn screens positive for phenylketonuria (PKU). The mother is counseled that if she becomes pregnant again, she must maintain a low-phenylalanine diet throughout pregnancy to protect the fetus. What is the deficient enzyme in classic PKU?",
    options: ["Tyrosine hydroxylase","Phenylalanine hydroxylase","Homogentisate oxidase","Fumarylacetoacetate hydrolase"],
    correct: "B",
    explanation: "Classic PKU is caused by deficiency of phenylalanine hydroxylase (PAH), which converts phenylalanine to tyrosine. Phenylalanine accumulates → transaminated to phenylpyruvate (musty odor), causing intellectual disability. Tetrahydrobiopterin (BH4) is a required cofactor."
  },
  {
    id: 72, subject: 'biochemistry', difficulty: 'easy',
    question: "A 6-month-old boy presents with severe hypoglycemia, hepatomegaly, and lactic acidosis after fasting. Liver biopsy shows massive glycogen accumulation. Enzyme analysis reveals absent glucose-6-phosphatase activity. What is the diagnosis?",
    options: ["Pompe disease (GSD type II)","McArdle disease (GSD type V)","Von Gierke disease (GSD type Ia)","Cori disease (GSD type III)"],
    correct: "C",
    explanation: "Von Gierke disease (GSD type I) is caused by glucose-6-phosphatase deficiency → inability to release free glucose from the liver → severe fasting hypoglycemia, hepatomegaly, lactic acidosis, hyperlipidemia, and hyperuricemia. Treatment is frequent cornstarch feeds."
  },
  {
    id: 73, subject: 'biochemistry', difficulty: 'easy',
    question: "A 2-year-old boy presents with intellectual disability, self-mutilation (lip and finger biting), hyperuricemia, and choreoathetosis. Serum uric acid is markedly elevated. Which enzyme is deficient?",
    options: ["Adenosine deaminase (ADA)","Hypoxanthine-guanine phosphoribosyltransferase (HGPRT)","Purine nucleoside phosphorylase (PNP)","Xanthine oxidase"],
    correct: "B",
    explanation: "Lesch-Nyhan syndrome is an X-linked recessive disorder caused by HGPRT deficiency. HGPRT salvages hypoxanthine and guanine back to IMP/GMP. Without it, purines are degraded to uric acid → gout, nephrolithiasis. The self-mutilation and neurological features are characteristic."
  },
  {
    id: 74, subject: 'biochemistry', difficulty: 'hard',
    question: "A 3-week-old infant develops vomiting, poor feeding, jaundice, and cataracts after starting breast feeding. Reducing substances are found in urine but glucose oxidase test is negative. What is the pathophysiology?",
    options: ["Galactose-1-phosphate uridylyltransferase deficiency → galactose-1-phosphate accumulation → hepatotoxicity and cataract formation","Aldolase B deficiency → fructose-1-phosphate accumulation → hepatocellular damage","Glucose-6-phosphatase deficiency → fasting hypoglycemia → failure to thrive","Branched-chain alpha-ketoacid dehydrogenase deficiency → toxic metabolite accumulation"],
    correct: "A",
    explanation: "Classic galactosemia is caused by galactose-1-phosphate uridylyltransferase deficiency. Galactose-1-phosphate accumulates in the liver (cirrhosis), brain (intellectual disability), and lens (cataracts). Urine shows galactosuria (reducing substance, but glucose oxidase-negative since it's not glucose)."
  },
  {
    id: 75, subject: 'biochemistry', difficulty: 'easy',
    question: "A 6-month-old girl of Ashkenazi Jewish descent presents with progressive neurodegeneration, cherry-red spot on macula, hyperreflexia, and no organomegaly. Enzyme analysis reveals absent hexosaminidase A activity. What accumulates in neurons?",
    options: ["Glucocerebroside","GM2 ganglioside","Sphingomyelin","Ceramide trihexoside"],
    correct: "B",
    explanation: "Tay-Sachs disease is caused by hexosaminidase A deficiency → GM2 ganglioside accumulates in neurons (lysosomes) → neurodegeneration. The cherry-red spot appears because the macula lacks ganglion cells (appears red against the pale surrounding retina). Absent organomegaly distinguishes it from Niemann-Pick."
  },
  {
    id: 76, subject: 'biochemistry', difficulty: 'easy',
    question: "A 1-week-old neonate presents with lethargy, poor feeding, and a urine with a sweet, maple syrup odor. Plasma amino acids show elevated leucine, isoleucine, and valine. Which enzyme is deficient?",
    options: ["Propionyl-CoA carboxylase","Branched-chain alpha-ketoacid dehydrogenase (BCKDH)","Methylmalonyl-CoA mutase","Isovaleryl-CoA dehydrogenase"],
    correct: "B",
    explanation: "Maple syrup urine disease (MSUD) is caused by deficiency of branched-chain alpha-ketoacid dehydrogenase (BCKDH), which oxidatively decarboxylates the alpha-ketoacid derivatives of leucine, isoleucine, and valine. Accumulation causes encephalopathy and the characteristic maple syrup odor."
  },
  {
    id: 77, subject: 'biochemistry', difficulty: 'hard',
    question: "A 35-year-old man presents with premature atherosclerosis, ectopia lentis (lens dislocation), intellectual disability, and elevated homocysteine. What is the most common enzymatic defect in homocystinuria?",
    options: ["Cystathionine beta-synthase deficiency","Methionine synthase deficiency","MTHFR (methylenetetrahydrofolate reductase) deficiency","Transcobalamin II deficiency"],
    correct: "A",
    explanation: "Classic homocystinuria (elevated homocysteine + methionine) is most commonly caused by cystathionine beta-synthase deficiency. This enzyme converts homocysteine + serine → cystathionine. Treatment includes B6 supplementation (cofactor), methionine restriction, and folate. Marfanoid features but downward lens dislocation (vs upward in Marfan)."
  },
  {
    id: 78, subject: 'biochemistry', difficulty: 'hard',
    question: "A 30-year-old man presents with progressive neurological symptoms, liver disease (cirrhosis), and a golden-brown ring at the corneal periphery (Kayser-Fleischer rings). Serum ceruloplasmin is low. What is the mechanism of copper accumulation in Wilson disease?",
    options: ["Excess dietary copper absorption with normal excretion","Deficiency of ATP7B (copper-transporting ATPase) → impaired biliary copper excretion and ceruloplasmin incorporation","Deficiency of ceruloplasmin synthesis causing copper deposition","Excess copper chaperone (ATOX1) activity → intracellular copper overload"],
    correct: "B",
    explanation: "Wilson disease is caused by mutations in ATP7B, a copper-transporting ATPase in hepatocytes. ATP7B normally exports copper into bile and incorporates it into ceruloplasmin. Without functional ATP7B, copper accumulates in the liver, brain, cornea (Kayser-Fleischer rings), and kidneys. Treatment: D-penicillamine or zinc."
  },
  {
    id: 79, subject: 'biochemistry', difficulty: 'easy',
    question: "A 25-year-old man presents with dark urine (turns black on standing), arthritis of large joints, and bluish-black discoloration of his ears (ochronosis). Urine homogentisic acid is markedly elevated. Which enzyme is deficient?",
    options: ["Phenylalanine hydroxylase","Tyrosinase","Homogentisate oxidase","Fumarylacetoacetase"],
    correct: "C",
    explanation: "Alkaptonuria is caused by homogentisate oxidase deficiency, an enzyme in the tyrosine degradation pathway. Homogentisic acid accumulates, is excreted in urine (turns dark/black on oxidation), and deposits in connective tissue (ochronosis) causing arthritis. It is autosomal recessive and generally benign until adulthood."
  },
  {
    id: 80, subject: 'biochemistry', difficulty: 'hard',
    question: "A neonate has elevated ammonia (NH3 1,200 µmol/L), respiratory alkalosis, and encephalopathy. Plasma amino acids show elevated glutamine and citrulline, with absent argininosuccinate. Urine orotic acid is elevated. Which urea cycle enzyme is most likely deficient?",
    options: ["Carbamoyl phosphate synthetase I (CPS1)","Ornithine transcarbamylase (OTC)","Argininosuccinate synthetase (citrullinemia type I)","Arginase (argininemia)"],
    correct: "B",
    explanation: "OTC deficiency is the most common urea cycle disorder (X-linked). OTC converts carbamoyl phosphate + ornithine → citrulline. Without OTC, carbamoyl phosphate accumulates → spills into pyrimidine synthesis → elevated orotic acid (distinguishes from CPS1 deficiency). Citrulline is low/absent (not elevated as in citrullinemia)."
  }
];

module.exports = questions;
