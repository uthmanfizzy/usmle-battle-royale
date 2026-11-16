/**
 * Murmurs — the bank.
 *
 * Each entry is one thing a student must recognise by ear. It carries:
 *   spec       what the engine synthesises AND what the diagram draws
 *              (murmurEngine.js) — the two can never disagree
 *   site       where it is loudest (a key into SITES)
 *   teaching   timing, shape, quality, radiation, manoeuvres, findings
 *   cases      every classic way it turns up in a question stem, so a
 *              student can be sure they have met all its presentations
 *   distractors  the sounds it is genuinely confused with — the wrong
 *              options a question offers. Must be ids in this file.
 *
 * Murmur segments: { phase: 'sys' | 'dia', from, to (fractions of that
 * phase), shape, quality, amp, peak? }.
 */

export const SITES = {
  aortic: { label: 'Right 2nd intercostal space (aortic area)', x: 0.4, y: 0.25 },
  pulmonic: { label: 'Left 2nd intercostal space (pulmonic area)', x: 0.6, y: 0.25 },
  erb: { label: "Left 3rd intercostal space (Erb's point)", x: 0.6, y: 0.37 },
  tricuspid: { label: 'Left lower sternal border, 4th–5th intercostal space', x: 0.56, y: 0.5 },
  mitral: { label: 'Apex, 5th intercostal space, midclavicular line', x: 0.7, y: 0.56 },
  lsb: { label: 'Left sternal border', x: 0.57, y: 0.42 },
  infraclavicular: { label: 'Left infraclavicular area (below the left clavicle)', x: 0.66, y: 0.17 },
};

export const CATEGORIES = {
  all: 'All',
  systolic: 'Systolic',
  diastolic: 'Diastolic',
  continuous: 'Continuous',
  sounds: 'Heart sounds & rubs',
};

export const MURMURS = [
  // ── Reference ─────────────────────────────────────────────────────────
  {
    id: 'normal',
    answer: 'Normal heart sounds',
    category: 'sounds',
    spec: { split: 'physiologic', segments: [] },
    site: 'erb',
    timing: 'No murmur',
    shape: 'S1 … S2, silent systole and diastole',
    quality: 'Two crisp sounds: “lub … dub”',
    radiation: '—',
    summary: 'just S1 and S2 with a silent systole and diastole, S2 splitting a little on inspiration',
    louder: [],
    softer: [],
    findings: [
      'S1 = mitral + tricuspid closure, loudest at the apex',
      'S2 = aortic (A2) then pulmonic (P2) closure, loudest at the base',
      'Physiological splitting: A2–P2 widen on inspiration and come together on expiration',
    ],
    tell: 'Nothing between the two sounds, and the S2 split comes and goes with breathing.',
    distractors: ['asd', 's3', 's4', 'mvp'],
    cases: [
      { title: 'Healthy adult', story: 'A 24-year-old has a pre-employment physical. Heart sounds are crisp with no added sounds.', clues: ['S2 splits on inspiration and is single on expiration', 'Normal JVP and pulses'] },
      { title: 'Physiological splitting', story: 'A medical student listens to a friend at the pulmonic area while she breathes slowly in and out.', clues: ['Inspiration ↓ intrathoracic pressure → ↑ venous return to the right heart → P2 later', 'Expiration: the split closes'] },
    ],
  },

  // ── Systolic ──────────────────────────────────────────────────────────
  {
    id: 'as',
    answer: 'Aortic stenosis',
    category: 'systolic',
    spec: {
      split: 'single', a2: 0.4, p2: 0, s4: 0.45, side: 'left',
      segments: [{ phase: 'sys', from: 0.1, to: 0.9, shape: 'diamond', peak: 0.55, quality: 'harsh', amp: 0.95 }],
    },
    site: 'aortic',
    timing: 'Systolic ejection (mid-systolic)',
    shape: 'Crescendo–decrescendo; peaks later as stenosis worsens',
    quality: 'Harsh',
    radiation: 'Carotids',
    summary: 'a harsh crescendo–decrescendo systolic ejection murmur at the right upper sternal border, radiating to the carotids, with a soft single S2',
    louder: ['Squatting', 'Passive leg raise (↑ preload)'],
    softer: ['Valsalva strain', 'Standing (↓ preload)', 'Handgrip (↑ afterload)'],
    findings: [
      'Pulsus parvus et tardus — weak, delayed carotid upstroke',
      'Soft or absent A2; may be paradoxically split',
      'S4 from a stiff, hypertrophied left ventricle',
      'Ejection click if the valve is bicuspid',
      'Narrow pulse pressure',
      'Symptoms SAD: Syncope, Angina, Dyspnoea (heart failure) — all on exertion',
    ],
    tell: 'Ejection murmur at the right 2nd intercostal space that radiates to the neck, gets louder with squatting and softer with Valsalva.',
    distractors: ['hcm', 'ps', 'mr', 'vsd'],
    cases: [
      { title: 'Age-related calcific degeneration (most common)', story: 'A 78-year-old man has had three episodes of light-headedness climbing stairs and chest tightness on exertion.', clues: ['Exertional syncope, angina, dyspnoea', 'Weak, delayed carotid pulse', 'Soft S2, S4', 'Calcified valve on echo; LVH'] },
      { title: 'Bicuspid aortic valve', story: 'A 45-year-old man has a murmur first found at a check-up; an early systolic sound comes just before it.', clues: ['Presents earlier (40s–50s) than calcific AS', 'Ejection click', 'Associated with coarctation and aortic root dilation', 'Common in Turner syndrome'] },
      { title: 'Turner syndrome', story: 'A 14-year-old girl with short stature, a webbed neck, widely spaced nipples and primary amenorrhoea has a systolic murmur.', clues: ['45,X', 'Bicuspid aortic valve (with or without coarctation)', 'Streak ovaries'] },
      { title: 'Rheumatic heart disease', story: 'A 40-year-old woman who emigrated from a low-income country, with rheumatic fever in childhood, has a systolic murmur at the right upper sternal border.', clues: ['Almost always with mitral valve disease (MS)', 'Commissural fusion'] },
      { title: 'Heyde syndrome', story: 'An 80-year-old with an ejection murmur has recurrent painless lower GI bleeding and iron-deficiency anaemia.', clues: ['Angiodysplasia of the colon', 'Acquired von Willebrand deficiency from shear stress', 'Improves after valve replacement'] },
      { title: 'Microangiopathic haemolytic anaemia', story: 'An elderly man with a crescendo–decrescendo murmur has anaemia with schistocytes on the smear.', clues: ['Red cells sheared across the narrowed valve', '↑ LDH, ↓ haptoglobin'] },
      { title: 'Williams syndrome (supravalvular AS)', story: 'A 6-year-old with elfin facies, an unusually friendly personality and hypercalcaemia has a systolic ejection murmur.', clues: ['7q11.23 microdeletion (elastin gene)', 'Supravalvular aortic stenosis'] },
    ],
  },
  {
    id: 'hcm',
    answer: 'Hypertrophic obstructive cardiomyopathy',
    category: 'systolic',
    spec: {
      s4: 0.6, side: 'left',
      segments: [{ phase: 'sys', from: 0.14, to: 0.88, shape: 'diamond', peak: 0.52, quality: 'harsh', amp: 0.8, fc: 200 }],
    },
    site: 'tricuspid',
    timing: 'Systolic ejection (mid-systolic)',
    shape: 'Crescendo–decrescendo',
    quality: 'Harsh',
    radiation: 'Usually does not radiate to the carotids',
    summary: 'a harsh crescendo–decrescendo systolic murmur at the left lower sternal border that gets LOUDER with Valsalva and standing',
    louder: ['Valsalva strain', 'Standing up suddenly', 'Nitrates / amyl nitrite (↓ preload)'],
    softer: ['Squatting', 'Passive leg raise', 'Handgrip (↑ afterload)'],
    findings: [
      'S4',
      'Bisferiens (double-peaked) carotid pulse',
      'Double or triple apical impulse',
      'Asymmetric septal hypertrophy; systolic anterior motion of the mitral leaflet',
      'Often with mitral regurgitation from SAM',
    ],
    tell: 'Anything that makes the left ventricle smaller (Valsalva, standing) makes it louder — the opposite of aortic stenosis.',
    distractors: ['as', 'mvp', 'vsd', 'mr'],
    cases: [
      { title: 'Sudden death in a young athlete', story: 'A 17-year-old basketball player collapses during a game; his uncle died suddenly at 30.', clues: ['Most common cause of sudden cardiac death in young athletes', 'Ventricular arrhythmia', 'Autosomal dominant'] },
      { title: 'Exertional syncope with a family history', story: 'A 22-year-old woman faints while running. Her murmur gets louder when she strains.', clues: ['Murmur ↑ with Valsalva, ↓ with squatting', 'S4', 'Bisferiens pulse'] },
      { title: 'Sarcomere gene mutation', story: 'Genetic testing in a family with early sudden deaths shows a mutation in β-myosin heavy chain.', clues: ['β-myosin heavy chain (MYH7) or myosin-binding protein C (MYBPC3)', 'Autosomal dominant', 'Myofibre disarray on histology'] },
      { title: 'Friedreich ataxia', story: 'A 15-year-old with progressive gait ataxia, pes cavus and absent ankle reflexes has a systolic murmur.', clues: ['GAA repeat in frataxin', 'Hypertrophic cardiomyopathy is the usual cause of death'] },
      { title: 'Worse after a vasodilator or diuretic', story: 'A man with a murmur is started on a diuretic for hypertension and now faints on standing.', clues: ['↓ preload → more outflow obstruction', 'Treat with β-blockers or non-dihydropyridine CCBs; avoid diuretics and vasodilators'] },
    ],
  },
  {
    id: 'mr',
    answer: 'Mitral regurgitation',
    category: 'systolic',
    spec: {
      s1: 0.55, a2: 0.65, p2: 0.4, s3: 0.4, side: 'left',
      segments: [{ phase: 'sys', from: 0.02, to: 1, shape: 'plateau', quality: 'blowing', amp: 0.75 }],
    },
    site: 'mitral',
    timing: 'Holosystolic (pansystolic)',
    shape: 'Plateau — same loudness S1 to S2',
    quality: 'High-pitched, blowing',
    radiation: 'Left axilla',
    summary: 'a high-pitched, blowing holosystolic murmur at the apex radiating to the axilla',
    louder: ['Handgrip (↑ afterload)', 'Squatting'],
    softer: ['Valsalva strain', 'Standing', 'Amyl nitrite (↓ afterload)'],
    findings: [
      'Soft S1 (may be buried in the murmur)',
      'S3 in severe chronic MR (volume overload)',
      'Displaced, hyperdynamic apex beat',
      'Atrial fibrillation from left atrial enlargement',
    ],
    tell: 'Flat from S1 all the way to S2, best at the apex, and it goes to the axilla.',
    distractors: ['tr', 'vsd', 'mvp', 'as'],
    cases: [
      { title: 'Papillary muscle rupture after MI', story: 'Four days after an inferior STEMI a 65-year-old man suddenly develops pulmonary oedema and a new apical holosystolic murmur.', clues: ['Usually days 2–7 after MI', 'Posteromedial papillary muscle (single supply, often the RCA/PDA)', 'Acute flash pulmonary oedema; murmur may be soft'] },
      { title: 'Ischaemic or dilated cardiomyopathy (functional MR)', story: 'A man with heart failure and an ejection fraction of 25% has an apical holosystolic murmur and an S3.', clues: ['Annular dilation stops the leaflets meeting', 'S3, displaced apex'] },
      { title: 'Mitral valve prolapse progressing', story: 'A woman known to have a mid-systolic click for years now has a murmur filling the whole of systole.', clues: ['Myxomatous degeneration', 'Chordae can rupture'] },
      { title: 'Infective endocarditis', story: 'A febrile man with a recent dental procedure has a new apical blowing murmur, splinter haemorrhages and Janeway lesions.', clues: ['Viridans streptococci after dental work', 'Leaflet perforation', 'Positive blood cultures'] },
      { title: 'Rheumatic heart disease', story: 'A 30-year-old who had rheumatic fever as a child has an apical holosystolic murmur radiating to the axilla.', clues: ['Mitral valve is the one most often involved', 'Acute rheumatic fever → MR; chronic → MS'] },
      { title: 'Connective tissue disease', story: 'A tall man with long fingers, lens dislocation and an aortic root aneurysm has an apical murmur.', clues: ['Marfan syndrome (fibrillin-1)', 'MVP → MR; also Ehlers–Danlos'] },
    ],
  },
  {
    id: 'mvp',
    answer: 'Mitral valve prolapse',
    category: 'systolic',
    spec: {
      side: 'left',
      click: { at: 0.46, amp: 0.85, label: 'Mid-systolic click' },
      segments: [{ phase: 'sys', from: 0.5, to: 1, shape: 'crescendo', quality: 'blowing', amp: 0.7 }],
    },
    site: 'mitral',
    timing: 'Mid-systolic click, then late systolic murmur',
    shape: 'Click, then a crescendo up to S2',
    quality: 'High-pitched, blowing',
    radiation: 'Left axilla',
    summary: 'a mid-systolic click followed by a late systolic crescendo murmur at the apex',
    louder: ['Valsalva / standing: click comes EARLIER and the murmur is LONGER (↓ preload)'],
    softer: ['Squatting / handgrip: click comes LATER and the murmur is SHORTER (↑ preload / afterload)'],
    findings: [
      'The click is the leaflet snapping back as the chordae tense',
      'Most common valvular lesion in the USA',
      'Usually benign; can progress to MR, rarely endocarditis or arrhythmia',
    ],
    tell: 'A click in the middle of systole with the murmur only after it. Smaller ventricle = earlier click.',
    distractors: ['mr', 'hcm', 'as', 'normal'],
    cases: [
      { title: 'Young woman with palpitations', story: 'A thin 26-year-old woman has palpitations, atypical chest pain and anxiety. There is a click in mid-systole.', clues: ['Often found incidentally', 'Myxomatous degeneration of the leaflets'] },
      { title: 'Marfan syndrome', story: 'A tall 19-year-old with arachnodactyly, pectus excavatum and upward lens dislocation has a mid-systolic click.', clues: ['Fibrillin-1 (FBN1), autosomal dominant', 'Also aortic root dilation → AR, dissection'] },
      { title: 'Ehlers–Danlos syndrome', story: 'A woman with hypermobile joints and stretchy, easily bruised skin has a click and late systolic murmur.', clues: ['Collagen defect', 'MVP and aortic root dilation'] },
      { title: 'Autosomal dominant polycystic kidney disease', story: 'A man with bilateral flank masses, hypertension and haematuria has a mid-systolic click.', clues: ['PKD1/PKD2', 'Berry aneurysms, hepatic cysts, MVP'] },
      { title: 'Manoeuvre question', story: 'A patient with a mid-systolic click is asked to stand from squatting. What happens?', clues: ['Standing ↓ preload → smaller LV → click earlier, murmur longer'] },
    ],
  },
  {
    id: 'tr',
    answer: 'Tricuspid regurgitation',
    category: 'systolic',
    spec: {
      side: 'right',
      segments: [{ phase: 'sys', from: 0.02, to: 1, shape: 'plateau', quality: 'blowing', amp: 0.6, fc: 330 }],
    },
    site: 'tricuspid',
    timing: 'Holosystolic',
    shape: 'Plateau',
    quality: 'Blowing',
    radiation: 'Right sternal border',
    summary: 'a blowing holosystolic murmur at the left lower sternal border that gets LOUDER on inspiration (Carvallo sign)',
    louder: ['Inspiration (Carvallo sign — ↑ venous return to the right heart)', 'Passive leg raise'],
    softer: ['Expiration', 'Valsalva strain'],
    findings: [
      'Prominent v waves in the JVP',
      'Pulsatile liver, hepatomegaly',
      'Peripheral oedema, ascites',
      'Parasternal heave if pulmonary hypertension drives it',
    ],
    tell: 'Holosystolic like MR, but at the lower sternal border and it swells as the patient breathes in — listen to the breaths in this clip.',
    distractors: ['mr', 'vsd', 'asd', 'ps'],
    cases: [
      { title: 'Infective endocarditis in a person who injects drugs', story: 'A 30-year-old who injects heroin has fever, a new murmur at the left lower sternal border and multiple cavitating lung nodules.', clues: ['Staphylococcus aureus', 'Septic pulmonary emboli', 'Murmur ↑ on inspiration'] },
      { title: 'Carcinoid heart disease', story: 'A man with flushing, watery diarrhoea and wheeze has liver metastases from a small-bowel tumour and a right-sided murmur.', clues: ['↑ urinary 5-HIAA', 'Serotonin → fibrosis of right-sided valves', 'TIPS: Tricuspid Insufficiency, Pulmonic Stenosis'] },
      { title: 'Secondary to pulmonary hypertension', story: 'A woman with COPD (or with left heart failure) develops raised JVP with v waves, ankle oedema and a holosystolic murmur.', clues: ['RV dilation stretches the annulus', 'Loud P2', 'Cor pulmonale'] },
      { title: 'Ebstein anomaly', story: 'A newborn whose mother took lithium for bipolar disorder in pregnancy is cyanosed and has a holosystolic murmur.', clues: ['Apical displacement of the tricuspid leaflets ("atrialisation" of the RV)', 'Associated with WPW', 'Lithium exposure'] },
      { title: 'Rheumatic heart disease', story: 'Long-standing rheumatic mitral disease; the patient now has a right-sided holosystolic murmur.', clues: ['Usually secondary to pulmonary hypertension from mitral disease'] },
    ],
  },
  {
    id: 'vsd',
    answer: 'Ventricular septal defect',
    category: 'systolic',
    spec: {
      segments: [{ phase: 'sys', from: 0.02, to: 1, shape: 'plateau', quality: 'harsh', amp: 0.95, fc: 260 }],
    },
    site: 'tricuspid',
    timing: 'Holosystolic',
    shape: 'Plateau',
    quality: 'Harsh',
    radiation: 'Across the precordium',
    summary: 'a harsh holosystolic murmur at the left lower sternal border — the smaller the defect, the louder the murmur',
    louder: ['Handgrip (↑ afterload → more left-to-right flow)'],
    softer: ['Amyl nitrite', 'Valsalva strain'],
    findings: [
      'Often a palpable thrill',
      'Small (restrictive) defects are the loudest',
      'Large defects: heart failure in infancy, then pulmonary hypertension',
    ],
    tell: 'Holosystolic and HARSH at the left lower sternal border, without the inspiratory swell of TR or the axillary radiation of MR.',
    distractors: ['mr', 'tr', 'hcm', 'asd'],
    cases: [
      { title: 'Most common congenital heart defect', story: 'A 6-week-old has a loud harsh holosystolic murmur at the left lower sternal border and is feeding well.', clues: ['Most VSDs are small and close on their own', 'Left → right shunt (acyanotic)'] },
      { title: 'Large VSD with heart failure', story: 'A 3-month-old sweats during feeds, breathes fast and is failing to thrive.', clues: ['Pulmonary overcirculation', 'Surgical repair before pulmonary vascular damage'] },
      { title: 'Eisenmenger syndrome', story: 'A 25-year-old with an unrepaired VSD now has cyanosis, clubbing, a loud P2 and a murmur that has become softer.', clues: ['Pulmonary hypertension reverses the shunt (right → left)', 'Polycythaemia'] },
      { title: 'Ventricular septal rupture after MI', story: 'Five days after an anterior MI a man becomes hypotensive with a new harsh holosystolic murmur; there is an O₂ step-up from right atrium to right ventricle.', clues: ['Days 3–5 after MI (macrophage-mediated softening)', 'Thrill at the left sternal border'] },
      { title: 'Syndromes', story: 'A child with Down syndrome, fetal alcohol syndrome or cri-du-chat syndrome has a holosystolic murmur.', clues: ['Down syndrome: AVSD most typical; VSD also common', 'Cri-du-chat: 5p deletion, cat-like cry, VSD', 'Also part of tetralogy of Fallot'] },
    ],
  },
  {
    id: 'asd',
    answer: 'Atrial septal defect',
    category: 'systolic',
    spec: {
      split: 'fixed', p2: 0.65,
      segments: [
        { phase: 'sys', from: 0.15, to: 0.8, shape: 'diamond', peak: 0.45, quality: 'soft', amp: 0.55 },
        { phase: 'dia', from: 0.12, to: 0.42, shape: 'diamond', peak: 0.4, quality: 'rumble', amp: 0.25 },
      ],
    },
    site: 'pulmonic',
    timing: 'Systolic ejection (flow murmur) + fixed split S2',
    shape: 'Soft crescendo–decrescendo, with a wide S2 split that never closes',
    quality: 'Soft',
    radiation: '—',
    summary: 'a soft systolic ejection murmur at the pulmonic area with a WIDE, FIXED split S2 (it does not change with breathing)',
    louder: ['The murmur barely changes; the point is the split S2'],
    softer: [],
    findings: [
      'Wide, fixed splitting of S2 — the hallmark',
      'The murmur is extra flow across a normal pulmonic valve, not the defect itself',
      'Large shunts add a mid-diastolic tricuspid flow rumble',
      'RV and RA enlargement',
    ],
    tell: 'Listen to S2 through a breath in and out: it stays split the whole time.',
    distractors: ['ps', 'normal', 'vsd', 'tr'],
    cases: [
      { title: 'Ostium secundum ASD in a young adult', story: 'A 28-year-old woman has fatigue and exertional dyspnoea; S2 is split on both inspiration and expiration.', clues: ['Most common ASD type', 'Wide fixed split S2', 'Often missed until adulthood'] },
      { title: 'Paradoxical embolism', story: 'A 35-year-old has a stroke after a long-haul flight; a DVT is found in her calf.', clues: ['Venous clot crosses the septum (ASD or patent foramen ovale) to the systemic circulation'] },
      { title: 'Down syndrome (ostium primum / AVSD)', story: 'An infant with Down syndrome has a murmur and a fixed split S2.', clues: ['Endocardial cushion defect', 'Primum ASD; atrioventricular septal defect'] },
      { title: 'Holt–Oram syndrome', story: 'A child with absent thumbs and a fixed split S2.', clues: ['TBX5, autosomal dominant', 'Upper limb defects + ASD'] },
      { title: 'Eisenmenger syndrome late in life', story: 'An unrepaired ASD in a 50-year-old now with cyanosis and clubbing.', clues: ['Shunt reversal with pulmonary hypertension'] },
    ],
  },
  {
    id: 'ps',
    answer: 'Pulmonic stenosis',
    category: 'systolic',
    spec: {
      split: 'wide', a2: 0.8, p2: 0.3, side: 'right',
      click: { at: 0.14, amp: 0.75, label: 'Ejection click', softOnInspiration: true },
      segments: [{ phase: 'sys', from: 0.18, to: 0.95, shape: 'diamond', peak: 0.55, quality: 'harsh', amp: 0.85, fc: 250 }],
    },
    site: 'pulmonic',
    timing: 'Systolic ejection',
    shape: 'Crescendo–decrescendo, with an early ejection click',
    quality: 'Harsh',
    radiation: 'Left shoulder / back',
    summary: 'a harsh crescendo–decrescendo murmur at the LEFT upper sternal border with an ejection click that softens on inspiration, and a widely split S2',
    louder: ['Inspiration (the murmur)'],
    softer: ['Expiration (the murmur)', 'The ejection click is SOFTER on inspiration — the only right-sided sound that does this'],
    findings: [
      'Wide splitting of S2 with a soft, late P2',
      'Right ventricular heave',
      'Prominent a waves in the JVP',
    ],
    tell: 'Like aortic stenosis but at the LEFT 2nd space, with a widely split S2 and a click that fades as the patient breathes in.',
    distractors: ['as', 'asd', 'hcm', 'vsd'],
    cases: [
      { title: 'Noonan syndrome', story: 'A short boy with a webbed neck, ptosis, hypertelorism and pectus excavatum has a murmur at the left upper sternal border.', clues: ['PTPN11 (RAS–MAPK pathway), autosomal dominant', 'Pulmonic stenosis (dysplastic valve); also HCM', 'Normal karyotype (unlike Turner)'] },
      { title: 'Congenital rubella', story: 'An infant with cataracts, sensorineural deafness and a "blueberry muffin" rash has a heart murmur.', clues: ['PDA and pulmonary artery / valve stenosis'] },
      { title: 'Tetralogy of Fallot', story: 'A 2-year-old has cyanotic spells relieved by squatting; the chest x-ray shows a boot-shaped heart.', clues: ['RV outflow obstruction (pulmonic stenosis) is the murmur heard', 'VSD, overriding aorta, RVH', 'Squatting ↑ SVR → less right-to-left shunt'] },
      { title: 'Carcinoid syndrome', story: 'Flushing and diarrhoea with liver metastases; both a tricuspid and a pulmonic murmur.', clues: ['TIPS: Tricuspid Insufficiency, Pulmonic Stenosis'] },
      { title: 'Alagille syndrome', story: 'A child with cholestatic jaundice from bile duct paucity, butterfly vertebrae and a systolic murmur.', clues: ['JAG1 (Notch pathway)', 'Peripheral pulmonary artery stenosis'] },
    ],
  },

  // ── Diastolic ─────────────────────────────────────────────────────────
  {
    id: 'ar',
    answer: 'Aortic regurgitation',
    category: 'diastolic',
    spec: {
      a2: 0.7, side: 'left',
      segments: [{ phase: 'dia', from: 0.01, to: 0.68, shape: 'decrescendo', quality: 'blowing', amp: 0.75, fc: 520 }],
    },
    site: 'erb',
    timing: 'Early diastolic',
    shape: 'Decrescendo, starting right at S2',
    quality: 'High-pitched, blowing',
    radiation: 'Down the left sternal border',
    summary: 'a high-pitched early diastolic decrescendo murmur starting right after S2, at the left sternal border (Erb’s point)',
    louder: ['Sitting up, leaning forward, breath held in full expiration', 'Handgrip (↑ afterload)'],
    softer: ['Amyl nitrite', 'Valsalva strain'],
    findings: [
      'Wide pulse pressure; bounding "water-hammer" (Corrigan) pulse',
      'Head bobbing (de Musset), nail-bed pulsation (Quincke), femoral bruit (Duroziez), pistol-shot femorals (Traube)',
      'Displaced, hyperdynamic apex (LV volume overload)',
      'Austin Flint murmur — a mid-diastolic rumble at the apex from the jet hitting the mitral leaflet',
    ],
    tell: 'The sound is in DIASTOLE and begins the moment S2 ends, then fades away.',
    distractors: ['ms', 'pda', 's3', 'mr'],
    cases: [
      { title: 'Aortic root dilation', story: 'A 50-year-old with long-standing poorly controlled hypertension has a wide pulse pressure and an early diastolic murmur.', clues: ['Root dilation stretches the cusps apart'] },
      { title: 'Marfan syndrome', story: 'A tall 22-year-old with arachnodactyly has a diastolic murmur and a dilated aortic root.', clues: ['Cystic medial degeneration', 'Risk of type A dissection'] },
      { title: 'Bicuspid aortic valve', story: 'A 35-year-old with a known bicuspid valve develops bounding pulses and a new diastolic murmur.', clues: ['Bicuspid valves can be stenotic, regurgitant or both'] },
      { title: 'Acute AR: endocarditis', story: 'A febrile patient with S. aureus bacteraemia suddenly develops pulmonary oedema and a diastolic murmur.', clues: ['Cusp perforation', 'Acute AR: short, soft murmur; no time for LV dilation'] },
      { title: 'Acute AR: type A aortic dissection', story: 'A man with tearing chest pain radiating to the back, unequal arm blood pressures and a new diastolic murmur.', clues: ['Widened mediastinum', 'Dissection into the aortic root'] },
      { title: 'Tertiary syphilis', story: 'An older man with Argyll Robertson pupils and tabes dorsalis has a diastolic murmur and "tree-bark" aorta.', clues: ['Obliterative endarteritis of the vasa vasorum', 'Ascending aortic aneurysm'] },
      { title: 'Ankylosing spondylitis', story: 'A young man with morning back stiffness, reduced lumbar flexion and uveitis has an early diastolic murmur.', clues: ['HLA-B27', 'Aortitis → AR'] },
      { title: 'Rheumatic heart disease', story: 'Rheumatic mitral stenosis plus an early diastolic murmur at the left sternal border.', clues: ['Aortic valve second most commonly involved'] },
    ],
  },
  {
    id: 'ms',
    answer: 'Mitral stenosis',
    category: 'diastolic',
    spec: {
      s1: 1.35, side: 'left',
      os: { after: 0.075, amp: 0.85 },
      segments: [{ phase: 'dia', from: 0.17, to: 1, shape: 'rumble', quality: 'rumble', amp: 0.9 }],
    },
    site: 'mitral',
    timing: 'Mid-diastolic, after an opening snap',
    shape: 'Opening snap → decrescendo rumble → presystolic accentuation (if in sinus rhythm)',
    quality: 'Low-pitched rumble — use the bell',
    radiation: 'None',
    summary: 'a loud S1, an opening snap after S2, then a low-pitched mid-diastolic rumble at the apex that swells again just before S1',
    louder: ['Left lateral decubitus, bell at the apex', 'Exercise / ↑ heart rate', 'Expiration'],
    softer: ['Valsalva strain', 'Standing'],
    findings: [
      'Loud S1',
      'Opening snap — the shorter the S2-to-OS interval, the more severe the stenosis',
      'Presystolic accentuation disappears in atrial fibrillation',
      'Left atrial enlargement → AF, mural thrombus, stroke',
    ],
    tell: 'A snap shortly after S2, then a low rumble through diastole: “lub-dub-ta … rrrr-LUB”.',
    distractors: ['ar', 's3', 'pda', 'asd'],
    cases: [
      { title: 'Rheumatic heart disease (the cause, almost always)', story: 'A 35-year-old woman who emigrated from South Asia, with "joint pains and a sore throat" as a child, now has dyspnoea and haemoptysis.', clues: ['Years after acute rheumatic fever (group A strep, molecular mimicry)', 'Fish-mouth valve, commissural fusion'] },
      { title: 'Unmasked by pregnancy', story: 'A 26-year-old in her second trimester develops breathlessness and pulmonary oedema; she had a murmur as a teenager.', clues: ['↑ blood volume and heart rate shorten diastolic filling time'] },
      { title: 'Atrial fibrillation and stroke', story: 'A woman with an irregularly irregular pulse has a sudden right hemiparesis; echo shows a huge left atrium with thrombus.', clues: ['Left atrial enlargement → AF', 'Anticoagulate'] },
      { title: 'Hoarseness (Ortner syndrome)', story: 'A woman with a diastolic rumble has a hoarse voice from left vocal cord paralysis.', clues: ['Enlarged left atrium compresses the left recurrent laryngeal nerve'] },
      { title: 'Dysphagia', story: 'Barium swallow shows the oesophagus indented by an enlarged left atrium in a patient with an opening snap.', clues: ['Left atrium is the most posterior chamber'] },
      { title: 'Mitral annular calcification', story: 'An 85-year-old on dialysis has a diastolic rumble without a history of rheumatic fever.', clues: ['Degenerative calcification in the elderly / ESRD'] },
    ],
  },

  // ── Continuous ────────────────────────────────────────────────────────
  {
    id: 'pda',
    answer: 'Patent ductus arteriosus',
    category: 'continuous',
    spec: {
      a2: 0.45, p2: 0.4,
      segments: [
        { phase: 'sys', from: 0.04, to: 1, shape: 'crescendo', quality: 'machine', amp: 0.8 },
        { phase: 'dia', from: 0, to: 0.9, shape: 'decrescendo', quality: 'machine', amp: 0.8 },
      ],
    },
    site: 'infraclavicular',
    timing: 'Continuous — through systole AND diastole',
    shape: 'Rises to a peak at S2, fades through diastole',
    quality: '“Machine-like”',
    radiation: 'Back',
    summary: 'a continuous machine-like murmur below the left clavicle that peaks at S2 and runs on through diastole',
    louder: ['Little change with manoeuvres'],
    softer: [],
    findings: [
      'Bounding pulses and wide pulse pressure',
      'Kept open by prostaglandin E; closed by indomethacin / ibuprofen (or acetaminophen)',
      'Late: Eisenmenger with differential cyanosis — blue, clubbed toes but pink fingers',
    ],
    tell: 'It never stops: the sound carries straight over S2 instead of starting or ending at it.',
    distractors: ['ar', 'vsd', 'ms', 'rub'],
    cases: [
      { title: 'Premature infant', story: 'A baby born at 28 weeks has bounding pulses and a continuous murmur below the left clavicle.', clues: ['Prematurity is the biggest risk factor', 'Close with indomethacin or ibuprofen'] },
      { title: 'Congenital rubella', story: 'An infant with cataracts, deafness and a continuous machine-like murmur.', clues: ['Classic triad: PDA (or pulmonary stenosis), cataracts, deafness'] },
      { title: 'Born at high altitude', story: 'An infant born in a high-altitude town has a continuous murmur.', clues: ['Lower oxygen tension keeps the ductus open'] },
      { title: 'Differential cyanosis (Eisenmenger)', story: 'A 20-year-old with an untreated PDA has cyanosis and clubbing of the toes but not the fingers.', clues: ['Reversed shunt enters the aorta after the arch vessels'] },
      { title: 'Keeping it open on purpose', story: 'A cyanotic newborn with transposition of the great arteries is started on an infusion to keep the ductus open.', clues: ['Alprostadil (PGE₁)', 'Ductal-dependent lesions: TGA, hypoplastic left heart, severe coarctation'] },
    ],
  },

  // ── Heart sounds & rubs ───────────────────────────────────────────────
  {
    id: 's3',
    answer: 'S3 (ventricular gallop)',
    category: 'sounds',
    spec: { s3: 0.95, segments: [] },
    site: 'mitral',
    timing: 'Early diastole, just after S2',
    shape: 'A low thud early in diastole: “Ken-TUC-ky”',
    quality: 'Low-pitched — use the bell',
    radiation: '—',
    summary: 'a low-pitched extra sound EARLY in diastole, shortly after S2 (“Ken-TUC-ky”)',
    louder: ['Left lateral decubitus, bell at the apex, end-expiration'],
    softer: [],
    findings: [
      'Rapid filling of a volume-overloaded, dilated ventricle',
      'Normal in children, young adults, pregnancy and athletes',
      'Pathological over ~40: heart failure (often the earliest sign), MR, AR, high-output states',
    ],
    tell: 'The extra sound comes soon AFTER S2. An S4 comes just BEFORE S1.',
    distractors: ['s4', 'ms', 'normal', 'ar'],
    cases: [
      { title: 'Dilated cardiomyopathy / systolic heart failure', story: 'A 60-year-old with orthopnoea, an ejection fraction of 25% and a displaced apex has an extra early diastolic sound.', clues: ['Volume overload', 'Raised filling pressures'] },
      { title: 'Severe mitral or aortic regurgitation', story: 'A patient with an apical holosystolic murmur also has an early diastolic thud.', clues: ['Large regurgitant volume floods the LV in early diastole'] },
      { title: 'High-output states', story: 'A woman with thyrotoxicosis (or severe anaemia, or an AV fistula) has a hyperdynamic circulation and an S3.', clues: ['↑ flow across the AV valves'] },
      { title: 'Physiological S3', story: 'A healthy 18-year-old athlete or a woman in her third trimester has an S3.', clues: ['Normal under ~40 and in pregnancy'] },
      { title: 'Alcohol, doxorubicin, Chagas, peripartum', story: 'Causes of dilated cardiomyopathy that present with an S3 and heart failure.', clues: ['ABCCCD: Alcohol, Beriberi, Coxsackie B, Cocaine, Chagas, Doxorubicin', 'Peripartum, haemochromatosis'] },
    ],
  },
  {
    id: 's4',
    answer: 'S4 (atrial gallop)',
    category: 'sounds',
    spec: { s4: 0.95, segments: [] },
    site: 'mitral',
    timing: 'Late diastole, just before S1',
    shape: 'A low thud just before S1: “TEN-nes-see”',
    quality: 'Low-pitched — use the bell',
    radiation: '—',
    summary: 'a low-pitched extra sound in LATE diastole, just before S1 (“TEN-nes-see”)',
    louder: ['Left lateral decubitus, bell at the apex'],
    softer: [],
    findings: [
      'The atrium kicking blood into a stiff, non-compliant ventricle',
      'Always pathological in adults',
      'Cannot occur in atrial fibrillation (no atrial kick)',
      'Palpable presystolic impulse at the apex',
    ],
    tell: 'The extra sound sits right in front of S1 — atrial contraction into a stiff ventricle.',
    distractors: ['s3', 'normal', 'ms', 'mvp'],
    cases: [
      { title: 'Hypertensive heart disease', story: 'A 65-year-old with years of poorly controlled hypertension and LVH on ECG has an extra sound just before S1.', clues: ['Concentric LVH → diastolic dysfunction', 'Heart failure with preserved ejection fraction'] },
      { title: 'Aortic stenosis', story: 'An elderly man with a crescendo–decrescendo murmur and a slow-rising pulse also has an S4.', clues: ['Pressure overload → LVH'] },
      { title: 'Hypertrophic cardiomyopathy', story: 'A young athlete with a murmur that gets louder with Valsalva has an S4.', clues: ['Thick, stiff ventricle'] },
      { title: 'Acute myocardial infarction', story: 'A man with crushing chest pain and ST elevation has a new S4.', clues: ['Ischaemic myocardium relaxes poorly'] },
      { title: 'Restrictive cardiomyopathy', story: 'A patient with amyloidosis (or sarcoidosis, or haemochromatosis) has a stiff heart and an S4.', clues: ['Low-voltage ECG with thick walls on echo in amyloid'] },
    ],
  },
  {
    id: 'rub',
    answer: 'Pericardial friction rub',
    category: 'sounds',
    spec: {
      segments: [
        { phase: 'sys', from: 0.25, to: 0.62, shape: 'burst', quality: 'scratch', amp: 0.65 },
        { phase: 'dia', from: 0.08, to: 0.34, shape: 'burst', quality: 'scratch', amp: 0.5 },
        { phase: 'dia', from: 0.76, to: 0.97, shape: 'burst', quality: 'scratch', amp: 0.5 },
      ],
    },
    site: 'lsb',
    timing: 'Up to three components: atrial systole, ventricular systole, ventricular diastole',
    shape: 'Scratchy bursts in systole and diastole',
    quality: 'High-pitched, scratchy, “sandpaper” or “creaking leather”',
    radiation: '—',
    summary: 'scratchy, leathery sounds in both systole and diastole at the left sternal border, best sitting forward',
    louder: ['Sitting up and leaning forward', 'Full expiration'],
    softer: ['Persists when the breath is held (a pleural rub does not)'],
    findings: [
      'Sharp pleuritic chest pain, better leaning forward',
      'Diffuse ST elevation with PR depression on ECG',
      'Can fade as an effusion builds up',
    ],
    tell: 'Scratchy, not blowing — and it is in BOTH systole and diastole, in up to three pieces per beat.',
    distractors: ['pda', 'vsd', 'ar', 'mr'],
    cases: [
      { title: 'Acute viral pericarditis', story: 'A 25-year-old with a recent cold has sharp chest pain that eases when he sits forward, with diffuse ST elevation.', clues: ['Coxsackie B most common', 'PR depression; treat with NSAIDs + colchicine'] },
      { title: 'Early post-MI pericarditis', story: 'Two days after a large transmural MI the patient has pleuritic chest pain and a scratchy sound.', clues: ['1–3 days after MI, over the infarct'] },
      { title: 'Dressler syndrome', story: 'Three weeks after an MI the patient has fever, pleuritic chest pain and a friction rub.', clues: ['Autoimmune, weeks after MI or cardiac surgery'] },
      { title: 'Uraemic pericarditis', story: 'A man with untreated end-stage renal disease (BUN very high) has chest pain and a rub.', clues: ['Indication for urgent dialysis', 'Usually no ECG changes'] },
      { title: 'Autoimmune disease', story: 'A young woman with a malar rash, arthritis and anti-dsDNA antibodies has a pericardial rub.', clues: ['SLE (serositis); also rheumatoid arthritis'] },
      { title: 'Others to remember', story: 'Tuberculosis in an endemic area, malignancy (lung, breast, lymphoma) or chest radiation.', clues: ['TB → constrictive pericarditis', 'Malignant effusion → tamponade (Beck triad)'] },
    ],
  },
];

/**
 * Question stems for "Sound + patient" mode. The case `story` above is written
 * for TEACHING and names the sound ("…and an S4"); these describe only the
 * patient, so the ear still has to do the work. Keyed by murmur id; `title`
 * must match one of that murmur's case titles (the reveal opens that case).
 * Never put the sound's own words in a stem: murmur, click, snap, rub,
 * gallop, S3/S4, split, systolic, diastolic, continuous.
 */
export const QUIZ_STEMS = {
  normal: [
    { title: 'Healthy adult', stem: 'A 24-year-old has a routine pre-employment examination. He has no symptoms, takes no medication and runs every day.' },
  ],
  as: [
    { title: 'Age-related calcific degeneration (most common)', stem: 'A 78-year-old man has had three episodes of light-headedness while climbing stairs and chest tightness on exertion. His carotid pulse is weak and slow to rise.' },
    { title: 'Bicuspid aortic valve', stem: 'A 45-year-old man is examined at a routine check-up. As a child he had a coarctation of the aorta repaired.' },
    { title: 'Heyde syndrome', stem: 'An 80-year-old man has recurrent painless rectal bleeding and iron-deficiency anaemia; colonoscopy shows angiodysplasia.' },
    { title: 'Williams syndrome (supravalvular AS)', stem: 'A 6-year-old with elfin facies, an unusually sociable personality and hypercalcaemia is seen for a heart check.' },
  ],
  hcm: [
    { title: 'Sudden death in a young athlete', stem: 'A 17-year-old basketball player collapsed during a game and was resuscitated. His uncle died suddenly at 30.' },
    { title: 'Friedreich ataxia', stem: 'A 15-year-old with progressive gait ataxia, pes cavus and absent ankle reflexes has palpitations.' },
    { title: 'Sarcomere gene mutation', stem: 'A 24-year-old whose father and grandfather died suddenly in their thirties has a double apical impulse.' },
  ],
  mr: [
    { title: 'Papillary muscle rupture after MI', stem: 'Four days after an inferior STEMI, a 65-year-old man suddenly becomes breathless with crackles to both lung apices and pink frothy sputum.' },
    { title: 'Infective endocarditis', stem: 'A febrile man who had a dental extraction a month ago has splinter haemorrhages and painless macules on his palms. You listen at the apex.' },
    { title: 'Ischaemic or dilated cardiomyopathy (functional MR)', stem: 'A man with heart failure and an ejection fraction of 25% has a displaced, diffuse apex beat.' },
  ],
  mvp: [
    { title: 'Young woman with palpitations', stem: 'A thin 26-year-old woman has palpitations, brief atypical chest pains and anxiety. ECG and troponin are normal.' },
    { title: 'Marfan syndrome', stem: 'A tall 19-year-old with long fingers, pectus excavatum and upward lens dislocation is seen for a cardiac review.' },
    { title: 'Autosomal dominant polycystic kidney disease', stem: 'A 40-year-old man with hypertension, haematuria and bilateral flank masses is examined.' },
  ],
  tr: [
    { title: 'Infective endocarditis in a person who injects drugs', stem: 'A 30-year-old who injects heroin has a fever of 39.4 °C; chest x-ray shows multiple cavitating nodules in both lungs.' },
    { title: 'Carcinoid heart disease', stem: 'A man with episodic flushing, watery diarrhoea and wheeze has liver metastases from a small-bowel tumour; urinary 5-HIAA is raised.' },
    { title: 'Ebstein anomaly', stem: 'A newborn whose mother took lithium throughout pregnancy is cyanosed; the ECG shows a delta wave.' },
  ],
  vsd: [
    { title: 'Most common congenital heart defect', stem: 'A 6-week-old is feeding well and growing normally; a thrill is felt at the left lower sternal border.' },
    { title: 'Ventricular septal rupture after MI', stem: 'Five days after an anterior MI a man becomes hypotensive; catheterisation shows an oxygen step-up from the right atrium to the right ventricle.' },
    { title: 'Syndromes', stem: 'A newborn with a high-pitched, cat-like cry, microcephaly and hypertelorism is examined.' },
  ],
  asd: [
    { title: 'Ostium secundum ASD in a young adult', stem: 'A 28-year-old woman has fatigue and breathlessness on exertion. Her ECG shows right axis deviation and incomplete right bundle branch block.' },
    { title: 'Paradoxical embolism', stem: 'A 35-year-old woman has a stroke after a long-haul flight; Doppler shows a DVT in her calf.' },
    { title: 'Holt–Oram syndrome', stem: 'A child born without thumbs is examined.' },
  ],
  ps: [
    { title: 'Noonan syndrome', stem: 'A short 8-year-old boy with a webbed neck, ptosis, hypertelorism and a normal karyotype is examined.' },
    { title: 'Alagille syndrome', stem: 'A child with cholestatic jaundice, butterfly vertebrae and a prominent forehead is examined.' },
  ],
  ar: [
    { title: 'Marfan syndrome', stem: 'A tall 22-year-old with arachnodactyly has a collapsing pulse, and his head nods with each heartbeat.' },
    { title: 'Tertiary syphilis', stem: 'An older man with Argyll Robertson pupils and loss of vibration sense in his legs has a dilated, calcified ascending aorta on chest x-ray.' },
    { title: 'Ankylosing spondylitis', stem: 'A 30-year-old man with morning back stiffness, reduced lumbar flexion and recurrent uveitis is examined.' },
    { title: 'Acute AR: type A aortic dissection', stem: 'A man with tearing chest pain radiating to his back has different blood pressures in each arm.' },
  ],
  ms: [
    { title: 'Rheumatic heart disease (the cause, almost always)', stem: 'A 35-year-old woman who emigrated from South Asia, with joint pains and fever as a child, now has breathlessness and coughs up blood.' },
    { title: 'Unmasked by pregnancy', stem: 'A 26-year-old in her second trimester, who was told as a teenager that "something was wrong with a valve", develops breathlessness and pulmonary oedema.' },
    { title: 'Hoarseness (Ortner syndrome)', stem: 'A woman with an irregularly irregular pulse has a hoarse voice; laryngoscopy shows a paralysed left vocal cord.' },
  ],
  pda: [
    { title: 'Premature infant', stem: 'A baby born at 28 weeks has bounding peripheral pulses and a wide pulse pressure.' },
    { title: 'Differential cyanosis (Eisenmenger)', stem: 'A 20-year-old has cyanosis and clubbing of the toes, but pink fingers.' },
    { title: 'Born at high altitude', stem: 'An infant born in a town high in the Andes is examined at 6 weeks.' },
  ],
  s3: [
    { title: 'Dilated cardiomyopathy / systolic heart failure', stem: 'A 60-year-old with orthopnoea, paroxysmal nocturnal dyspnoea and an ejection fraction of 25% is examined lying on his left side.' },
    { title: 'High-output states', stem: 'A woman with weight loss, tremor, heat intolerance and exophthalmos is examined.' },
    { title: 'Physiological S3', stem: 'A healthy 18-year-old endurance athlete has a pre-participation examination.' },
  ],
  s4: [
    { title: 'Hypertensive heart disease', stem: 'A 65-year-old with 20 years of poorly controlled hypertension has left ventricular hypertrophy on ECG and breathlessness with a preserved ejection fraction.' },
    { title: 'Acute myocardial infarction', stem: 'A man with crushing central chest pain has ST elevation in II, III and aVF.' },
    { title: 'Restrictive cardiomyopathy', stem: 'A patient with nephrotic syndrome, macroglossia and a low-voltage ECG has thick ventricular walls on echo.' },
  ],
  rub: [
    { title: 'Acute viral pericarditis', stem: 'A 25-year-old with a recent cold has sharp chest pain that eases when he sits forward; ECG shows widespread ST elevation with PR depression.' },
    { title: 'Dressler syndrome', stem: 'Three weeks after a myocardial infarction, a man has fever and pleuritic chest pain.' },
    { title: 'Uraemic pericarditis', stem: 'A man with untreated end-stage renal disease and a BUN of 140 mg/dL has chest pain.' },
  ],
};

export const murmurById = (id) => MURMURS.find((m) => m.id === id);
export const murmurByAnswer = (answer) => MURMURS.find((m) => m.answer === answer);

/** Why `other` is not the answer, written against `actual`. */
export function whyNot(actual, other) {
  return `${other.answer} would be ${other.summary}. This one is ${actual.summary}.`;
}
