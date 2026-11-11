/**
 * The ECG Reader's cases.
 *
 * Each case is a rhythm (when things happen), one or more leads (what each
 * event looks like there), the answer, the distractors worth confusing it
 * with, and what to look for. The leads are the ones you would actually read
 * the diagnosis from: rhythms on a lead II strip, bundle branch blocks in V1
 * and V6, an infarct in the leads of its territory with the reciprocal change
 * where it shows. A pattern that only declares itself in V1 is not fairly
 * tested on lead II.
 *
 * DISTRACTORS ARE CHOSEN, NOT RANDOM. A Wenckebach is offered next to Mobitz
 * II, first-degree block and complete heart block, because telling those
 * apart is the skill. Three are picked from each case's list per question.
 *
 * Amplitudes in mV, times in seconds. Morphology fields are documented in
 * ecgEngine.js (complexValue).
 *
 * VERIFIED by measuring the generated signals, not by eye: rate, regularity,
 * PR and QRS width for every case land inside the ranges their diagnosis
 * requires (see the check run when this was built — e.g. 1st-degree PR
 * 0.30 s, Wenckebach PR 0.16 → 0.26 → 0.32 then a dropped beat, LBBB/RBBB QRS
 * ≥ 0.12 s, WPW PR < 0.12 s, complete heart block with P and QRS on unrelated
 * clocks).
 */

// ── Reusable lead II morphologies ────────────────────────────────────────
const P_NORMAL = { a: 0.15, s: 0.02 };

const II_NORMAL = {
  p: P_NORMAL,
  qrs: [
    { c: 0.012, s: 0.006, a: -0.08 },   // small septal q
    { c: 0.040, s: 0.0095, a: 1.25 },   // R
    { c: 0.068, s: 0.009, a: -0.25 },   // S
  ],
  j: 0.09,
  t: { a: 0.32, rise: 0.065, fall: 0.045 },
  qtc: 0.40,
};

// A premature ventricular beat: no P, broad (≥ 0.12 s) and bizarre, with the
// T wave pointing the opposite way to the QRS (discordant).
const II_PVC = {
  qrs: [{ c: 0.045, s: 0.028, a: 1.5 }, { c: 0.108, s: 0.02, a: -0.32 }],
  j: 0.15,
  t: { a: -0.5, rise: 0.07, fall: 0.06 },
  qt: 0.40,
};

// Ventricular escape in complete heart block: broad and slow.
const II_ESCAPE = {
  qrs: [{ c: 0.05, s: 0.03, a: 0.95 }, { c: 0.112, s: 0.024, a: -0.35 }],
  j: 0.15,
  t: { a: -0.35, rise: 0.08, fall: 0.06 },
  qt: 0.46,
};

// Monomorphic VT complex, sized for ~175/min: the T crowds the next QRS.
const II_VT = {
  qrs: [{ c: 0.05, s: 0.03, a: 1.35 }, { c: 0.122, s: 0.025, a: -0.45 }],
  j: 0.16,
  t: { a: -0.42, rise: 0.05, fall: 0.045 },
  qt: 0.32,
};

const lead = (name, morph, extra = {}) => ({
  name,
  morph: { normal: morph, ...extra.kinds, ...(extra.pAlt ? { pAlt: extra.pAlt } : {}) },
  contScale: extra.contScale,
});

// ── The bank ─────────────────────────────────────────────────────────────
export const ECG_CASES = [
  // ── Rhythms ────────────────────────────────────────────────────────────
  {
    id: 'nsr',
    category: 'rhythm',
    answer: 'Normal sinus rhythm',
    distractors: ['Sinus bradycardia', 'Sinus tachycardia', 'First-degree AV block', 'Sinus arrhythmia'],
    rhythm: { type: 'sinus', rate: 74, pr: 0.16 },
    leads: [lead('II', II_NORMAL)],
    look: [
      'Rate 60–100 — about 4 large squares between R waves (300 ÷ 4 ≈ 75).',
      'Regular, with an upright P wave before every QRS in lead II.',
      'PR 0.12–0.20 s (3–5 small squares); QRS narrow, under 3 small squares.',
    ],
    why: 'Every box is ticked: sinus P waves, a normal PR, a narrow QRS and a normal rate. Learning what normal looks like at a glance is what makes every abnormal strip stand out.',
  },
  {
    id: 'sinus-brady',
    category: 'rhythm',
    answer: 'Sinus bradycardia',
    distractors: ['Normal sinus rhythm', 'Complete (third-degree) heart block', 'Mobitz II (second-degree, type II)', 'Junctional rhythm'],
    rhythm: { type: 'sinus', rate: 46, pr: 0.17 },
    leads: [lead('II', II_NORMAL)],
    look: [
      'Rate under 60 — six or more large squares between R waves.',
      'Every P wave is followed by a QRS, with the same PR each time.',
      'Nothing dropped and nothing dissociated: it is sinus, just slow.',
    ],
    why: 'Sinus rhythm below 60/min. Common and benign in athletes and in sleep; pathological with beta-blockers, hypothyroidism, raised intracranial pressure (Cushing reflex) or inferior MI.',
  },
  {
    id: 'sinus-tachy',
    category: 'rhythm',
    answer: 'Sinus tachycardia',
    distractors: ['Supraventricular tachycardia (AVNRT)', 'Atrial flutter with 2:1 block', 'Atrial fibrillation', 'Normal sinus rhythm'],
    rhythm: { type: 'sinus', rate: 124, pr: 0.14 },
    leads: [lead('II', II_NORMAL)],
    look: [
      'Rate over 100, but a distinct upright P wave still precedes every QRS.',
      'Regular, though with a little variation beat to beat — the sinus node is not a metronome.',
      'Contrast SVT, where the P waves vanish into the QRS and the rate is rigidly fixed.',
    ],
    why: 'A sinus node driven fast — by fever, pain, hypovolaemia, anaemia, PE, thyrotoxicosis. Treat the cause, not the rhythm.',
  },
  {
    id: 'af',
    category: 'rhythm',
    answer: 'Atrial fibrillation',
    distractors: ['Atrial flutter with variable block', 'Multifocal atrial tachycardia', 'Sinus arrhythmia', 'Sinus tachycardia with PACs'],
    rhythm: { type: 'af', rate: 104 },
    continuous: 'af',
    leads: [lead('II', { ...II_NORMAL, p: null })],
    look: [
      'Irregularly irregular — no two RR intervals the same, and no pattern to them.',
      'No P waves: the baseline is a fine, chaotic wobble (fibrillatory waves) instead.',
      'QRS narrow, because conduction below the AV node is normal.',
    ],
    why: 'Disorganised atrial activity at 350–600/min; the AV node lets through whatever it can, at random. Think rate or rhythm control, and anticoagulation guided by CHA₂DS₂-VASc.',
  },
  {
    id: 'flutter',
    category: 'rhythm',
    answer: 'Atrial flutter with 2:1 block',
    distractors: ['Sinus tachycardia', 'Supraventricular tachycardia (AVNRT)', 'Atrial fibrillation', 'Ventricular tachycardia'],
    rhythm: { type: 'flutter', ratios: [2] },
    continuous: 'flutter',
    leads: [lead('II', { ...II_NORMAL, p: null })],
    look: [
      'Regular narrow-complex tachycardia at almost exactly 150/min — a classic flutter rate.',
      'A sawtooth baseline at 300/min: one flutter wave every large square, best seen in II, III and aVF.',
      'Two flutter waves per QRS; one of them hides in the QRS or the T wave, which is why 2:1 flutter is so often missed.',
    ],
    why: 'A macro-re-entrant circuit in the right atrium (cavotricuspid isthmus) fires at ~300/min; the AV node conducts every second wave. A regular rate of 150 should always make you hunt for flutter waves.',
  },
  {
    id: 'svt',
    category: 'rhythm',
    answer: 'Supraventricular tachycardia (AVNRT)',
    distractors: ['Sinus tachycardia', 'Atrial flutter with 2:1 block', 'Ventricular tachycardia', 'Atrial fibrillation'],
    rhythm: { type: 'svt', rate: 182 },
    leads: [lead('II', { ...II_NORMAL, p: null, t: { a: 0.26, rise: 0.05, fall: 0.04 } })],
    look: [
      'Very fast (150–250) and rigidly regular — RR intervals identical.',
      'Narrow QRS: the impulse reaches the ventricles the normal way.',
      'No visible P waves; in AVNRT they fire at the same moment as the QRS and are buried in it.',
    ],
    why: 'Re-entry within the AV node. Vagal manoeuvres first, then adenosine — which also unmasks flutter waves if this was flutter all along.',
  },
  {
    id: 'avb1',
    category: 'rhythm',
    answer: 'First-degree AV block',
    distractors: ['Mobitz I (Wenckebach)', 'Normal sinus rhythm', 'Mobitz II (second-degree, type II)', 'Wolff–Parkinson–White'],
    rhythm: { type: 'sinus', rate: 70, pr: 0.30 },
    leads: [lead('II', II_NORMAL)],
    look: [
      'PR over 0.20 s (more than one large square) — here about 0.30 s.',
      'The PR is long but CONSTANT, and every P wave is conducted.',
      'Nothing is dropped. That is what separates it from second-degree block.',
    ],
    why: 'Slowed conduction through the AV node. Usually benign: athletes, the elderly, beta-blockers, digoxin, calcium-channel blockers, Lyme disease.',
  },
  {
    id: 'wenckebach',
    category: 'rhythm',
    answer: 'Mobitz I (Wenckebach)',
    distractors: ['Mobitz II (second-degree, type II)', 'First-degree AV block', 'Complete (third-degree) heart block', 'Sinus arrhythmia'],
    // Atrial 72, not faster: with the PR reaching 0.32 s, any quicker and the
    // next P lands on the preceding T wave — real, but it buries the very P
    // waves this strip exists to show.
    rhythm: { type: 'wenckebach', atrialRate: 72, prs: [0.16, 0.26, 0.32] },
    leads: [lead('II', II_NORMAL)],
    look: [
      'The PR interval lengthens with each beat…',
      '…until a P wave appears with no QRS after it — the dropped beat.',
      'Then the PR resets to its shortest and the cycle repeats. The P waves themselves march on regularly.',
    ],
    why: 'Progressive fatigue of the AV node, usually above the bundle of His. Typically benign — seen at night, in athletes, with inferior MI or AV-nodal drugs — and rarely needs a pacemaker.',
  },
  {
    id: 'mobitz2',
    category: 'rhythm',
    answer: 'Mobitz II (second-degree, type II)',
    distractors: ['Mobitz I (Wenckebach)', 'Complete (third-degree) heart block', 'First-degree AV block', 'Sinus bradycardia'],
    rhythm: { type: 'mobitz2', atrialRate: 85, pr: 0.18, pattern: [1, 1, 0] },
    leads: [lead('II', II_NORMAL)],
    look: [
      'The PR interval is CONSTANT on every conducted beat — it never lengthens.',
      'Then, without warning, a P wave is not followed by a QRS.',
      'Regular P waves throughout; here every third one is blocked (3:2).',
    ],
    why: 'Block below the AV node, in the His–Purkinje system. Unpredictable and liable to progress to complete heart block — an indication for a pacemaker.',
  },
  {
    id: 'chb',
    category: 'rhythm',
    answer: 'Complete (third-degree) heart block',
    distractors: ['Mobitz II (second-degree, type II)', 'Mobitz I (Wenckebach)', 'Sinus bradycardia', 'Ventricular tachycardia'],
    rhythm: { type: 'chb', atrialRate: 84, ventRate: 36 },
    leads: [lead('II', II_NORMAL, { kinds: { escape: II_ESCAPE } })],
    look: [
      'P waves regular at their own rate; QRS complexes regular at a much slower one.',
      'No relationship between them — the PR is different every beat, and P waves land on QRS complexes and T waves.',
      'Broad, slow QRS: a ventricular escape rhythm is keeping the patient alive.',
    ],
    why: 'No atrial impulse reaches the ventricles at all — AV dissociation. Needs pacing; consider inferior MI, drugs, Lyme disease and degenerative conduction disease.',
  },
  {
    id: 'vt',
    category: 'rhythm',
    answer: 'Ventricular tachycardia',
    distractors: ['Supraventricular tachycardia (AVNRT)', 'Ventricular fibrillation', 'Torsades de pointes', 'Atrial flutter with 2:1 block'],
    rhythm: { type: 'vt', rate: 175 },
    leads: [lead('II', { ...II_NORMAL, p: null }, { kinds: { vt: II_VT } })],
    look: [
      'Broad complexes (≥ 0.12 s — three or more small squares), fast and regular.',
      'Every complex looks the same: monomorphic.',
      'No P waves linked to the QRS. A broad regular tachycardia is VT until proven otherwise.',
    ],
    why: 'A re-entry circuit in the ventricles, classically around scar from an old infarct. Pulseless: defibrillate. With a pulse but unstable: synchronised cardioversion. Stable: amiodarone.',
  },
  {
    id: 'vf',
    category: 'rhythm',
    answer: 'Ventricular fibrillation',
    distractors: ['Ventricular tachycardia', 'Torsades de pointes', 'Asystole', 'Atrial fibrillation'],
    rhythm: { type: 'none' },
    continuous: 'vf',
    leads: [lead('II', { ...II_NORMAL, p: null })],
    look: [
      'Chaotic and irregular, with no identifiable P, QRS or T waves.',
      'The amplitude and frequency wander constantly — no two seconds alike.',
      'There is no cardiac output. Check the patient, not the monitor, then shock.',
    ],
    why: 'Disorganised ventricular activity — cardiac arrest. Immediate defibrillation and CPR; every minute without a shock costs survival.',
  },
  {
    id: 'torsades',
    category: 'rhythm',
    answer: 'Torsades de pointes',
    distractors: ['Ventricular fibrillation', 'Ventricular tachycardia', 'Atrial fibrillation', 'Atrial flutter with 2:1 block'],
    rhythm: { type: 'none' },
    continuous: 'torsades',
    leads: [lead('II', { ...II_NORMAL, p: null })],
    look: [
      'A rapid, broad polymorphic tachycardia…',
      '…whose amplitude swells and shrinks in spindles, twisting around the baseline.',
      'The axis flips — the points of the complexes change direction from one spindle to the next.',
    ],
    why: 'Polymorphic VT on a background of a long QT: hypokalaemia, hypomagnesaemia, and drugs (macrolides, antipsychotics, ondansetron, methadone). Treatment is IV magnesium sulfate.',
  },
  {
    id: 'bigeminy',
    category: 'rhythm',
    answer: 'Ventricular bigeminy (PVCs)',
    distractors: ['Atrial fibrillation', 'Mobitz I (Wenckebach)', 'Ventricular tachycardia', 'Atrial bigeminy (PACs)'],
    rhythm: { type: 'bigeminy', rate: 72, pr: 0.16, coupling: 0.44 },
    leads: [lead('II', II_NORMAL, { kinds: { pvc: II_PVC } })],
    look: [
      'Every normal beat is followed by an early, broad, bizarre complex with no P wave.',
      'The T wave of each ectopic points the opposite way to its QRS.',
      'A full compensatory pause after each one: the next sinus beat comes exactly two cycles after the last.',
    ],
    why: 'Premature ventricular complexes alternating with sinus beats. Often benign; look for electrolyte disturbance, ischaemia, stimulants and structural heart disease.',
  },
  {
    id: 'asystole',
    category: 'rhythm',
    answer: 'Asystole',
    distractors: ['Ventricular fibrillation', 'Complete (third-degree) heart block', 'Sinus bradycardia', 'Torsades de pointes'],
    rhythm: { type: 'none' },
    leads: [lead('II', { ...II_NORMAL, p: null })],
    look: [
      'No electrical activity — only a gently wandering baseline.',
      'Before you call it: check the leads are attached, the gain is up and a second lead agrees. "Fine VF" can masquerade.',
    ],
    why: 'Cardiac arrest with no shockable rhythm. CPR and adrenaline, and hunt for the reversible causes (the 4 Hs and 4 Ts).',
  },
  {
    id: 'wpw',
    category: 'rhythm',
    answer: 'Wolff–Parkinson–White',
    distractors: ['First-degree AV block', 'Left bundle branch block', 'Normal sinus rhythm', 'Hyperkalaemia'],
    rhythm: { type: 'sinus', rate: 76, pr: 0.10 },
    leads: [lead('II', {
      ...II_NORMAL,
      qrs: [
        { c: 0.032, s: 0.022, a: 0.42 },  // delta wave — the slurred upstroke
        { c: 0.072, s: 0.011, a: 1.15 },
        { c: 0.102, s: 0.010, a: -0.16 },
      ],
      j: 0.125,
      t: { a: 0.24, rise: 0.065, fall: 0.045 },
    })],
    look: [
      'Short PR — under 0.12 s (less than 3 small squares).',
      'A slurred, slow upstroke at the start of the QRS: the delta wave.',
      'The QRS is widened by that slur.',
    ],
    why: 'An accessory pathway (bundle of Kent) bypasses the AV node and pre-excites the ventricles. Risk of fast AF down the pathway — avoid AV-nodal blockers in pre-excited AF.',
  },

  // ── 12-lead patterns ───────────────────────────────────────────────────
  {
    id: 'hyperk',
    category: 'pattern',
    answer: 'Hyperkalaemia',
    distractors: ['Hypokalaemia', 'Anterior STEMI (left anterior descending)', 'Long QT syndrome', 'Wolff–Parkinson–White'],
    rhythm: { type: 'sinus', rate: 68, pr: 0.21 },
    leads: [lead('II', {
      p: { a: 0.06, s: 0.026 },         // flattening P
      qrs: [
        { c: 0.016, s: 0.008, a: -0.05 },
        { c: 0.052, s: 0.0145, a: 1.0 },
        { c: 0.094, s: 0.016, a: -0.36 },
      ],
      j: 0.125,
      t: { a: 0.95, rise: 0.034, fall: 0.03 },   // tall, narrow, tented
      qtc: 0.38,
    })],
    look: [
      'Tall, narrow, peaked ("tented") T waves — often taller than the R wave.',
      'Flattened P waves and a lengthening PR.',
      'A widening QRS. Left untreated it becomes a sine wave, then VF.',
    ],
    why: 'Raised potassium flattens the resting membrane potential. Calcium gluconate first to protect the myocardium, then insulin–dextrose and salbutamol to shift potassium into cells.',
  },
  {
    id: 'hypok',
    category: 'pattern',
    answer: 'Hypokalaemia',
    distractors: ['Hyperkalaemia', 'Long QT syndrome', 'Digoxin effect', 'Acute pericarditis'],
    rhythm: { type: 'sinus', rate: 76, pr: 0.17 },
    leads: [lead('II', {
      ...II_NORMAL,
      t: { a: 0.08, rise: 0.06, fall: 0.05 },
      st: -0.06,
      u: { a: 0.16, s: 0.038 },
      qtc: 0.42,
    })],
    look: [
      'Flattened T waves with a little ST depression.',
      'A prominent U wave after the T — here as big as or bigger than the T itself.',
      'What looks like a long QT is really a long QU interval.',
    ],
    why: 'Low potassium — diuretics, vomiting, diarrhoea, hyperaldosteronism. Predisposes to arrhythmias and to digoxin toxicity; replace magnesium as well.',
  },
  {
    id: 'long-qt',
    category: 'pattern',
    answer: 'Long QT syndrome',
    distractors: ['Hypokalaemia', 'Hyperkalaemia', 'First-degree AV block', 'Normal sinus rhythm'],
    rhythm: { type: 'sinus', rate: 66, pr: 0.16 },
    leads: [lead('II', { ...II_NORMAL, t: { a: 0.28, rise: 0.09, fall: 0.06 }, qtc: 0.60 })],
    look: [
      'The T wave ends far from its QRS: QT more than half the RR interval at this rate.',
      'Corrected QT (Bazett: QT ÷ √RR) well over 0.47 s — here about 0.60 s.',
      'The danger is the rhythm it leads to: torsades de pointes.',
    ],
    why: 'Congenital (Romano–Ward, Jervell–Lange-Nielsen) or acquired — hypokalaemia, hypomagnesaemia, hypocalcaemia and many drugs. Stop the culprit, correct the electrolytes.',
  },
  {
    id: 'inferior-stemi',
    category: 'pattern',
    answer: 'Inferior STEMI (right coronary artery)',
    distractors: ['Anterior STEMI (left anterior descending)', 'Acute pericarditis', 'Hyperkalaemia', 'Left bundle branch block'],
    rhythm: { type: 'sinus', rate: 78, pr: 0.17 },
    leads: [
      lead('II', { ...II_NORMAL, qrs: [{ c: 0.014, s: 0.007, a: -0.12 }, { c: 0.04, s: 0.0095, a: 1.0 }, { c: 0.066, s: 0.009, a: -0.12 }], st: 0.22, t: { a: 0.55, rise: 0.07, fall: 0.05 } }),
      lead('III', { ...II_NORMAL, p: { a: 0.08, s: 0.02 }, qrs: [{ c: 0.016, s: 0.008, a: -0.25 }, { c: 0.042, s: 0.01, a: 0.6 }, { c: 0.066, s: 0.009, a: -0.08 }], st: 0.32, t: { a: 0.62, rise: 0.07, fall: 0.05 } }),
      lead('aVF', { ...II_NORMAL, p: { a: 0.11, s: 0.02 }, qrs: [{ c: 0.015, s: 0.007, a: -0.18 }, { c: 0.041, s: 0.0095, a: 0.85 }, { c: 0.066, s: 0.009, a: -0.1 }], st: 0.27, t: { a: 0.58, rise: 0.07, fall: 0.05 } }),
      lead('aVL', { ...II_NORMAL, p: { a: 0.05, s: 0.02 }, qrs: [{ c: 0.035, s: 0.01, a: 0.5 }, { c: 0.064, s: 0.01, a: -0.3 }], st: -0.15, t: { a: -0.2, rise: 0.06, fall: 0.05 } }),
    ],
    look: [
      'ST elevation in II, III and aVF — the inferior leads.',
      'Elevation greater in III than in II points to the right coronary artery.',
      'Reciprocal ST depression in aVL confirms it is an infarct, not pericarditis.',
    ],
    why: 'Occlusion of the RCA (or a dominant circumflex). Watch for bradycardia and AV block, and check right-sided leads (V4R) for RV infarction — avoid nitrates if the RV is involved.',
  },
  {
    id: 'anterior-stemi',
    category: 'pattern',
    answer: 'Anterior STEMI (left anterior descending)',
    distractors: ['Inferior STEMI (right coronary artery)', 'Acute pericarditis', 'Hyperkalaemia', 'Left bundle branch block'],
    rhythm: { type: 'sinus', rate: 88, pr: 0.16 },
    leads: [
      lead('V2', { p: { a: 0.07, s: 0.02 }, qrs: [{ c: 0.03, s: 0.009, a: 0.22 }, { c: 0.062, s: 0.012, a: -1.0 }], j: 0.09, st: 0.36, t: { a: 0.78, rise: 0.07, fall: 0.05 }, qtc: 0.41 }),
      lead('V3', { p: { a: 0.08, s: 0.02 }, qrs: [{ c: 0.034, s: 0.01, a: 0.5 }, { c: 0.064, s: 0.011, a: -0.62 }], j: 0.09, st: 0.36, t: { a: 0.82, rise: 0.07, fall: 0.05 }, qtc: 0.41 }),
      lead('V4', { p: { a: 0.1, s: 0.02 }, qrs: [{ c: 0.012, s: 0.006, a: -0.06 }, { c: 0.04, s: 0.0095, a: 1.0 }, { c: 0.068, s: 0.009, a: -0.35 }], j: 0.09, st: 0.28, t: { a: 0.7, rise: 0.07, fall: 0.05 }, qtc: 0.41 }),
    ],
    look: [
      'ST elevation across V2–V4, the anterior leads.',
      'Tall, broad "hyperacute" T waves arising from the elevated ST segments.',
      'The territory of the left anterior descending artery.',
    ],
    why: 'LAD occlusion — the widow-maker. A large territory of left ventricle at risk; immediate reperfusion with primary PCI.',
  },
  {
    id: 'pericarditis',
    category: 'pattern',
    answer: 'Acute pericarditis',
    distractors: ['Inferior STEMI (right coronary artery)', 'Anterior STEMI (left anterior descending)', 'Hyperkalaemia', 'Early repolarisation'],
    rhythm: { type: 'sinus', rate: 96, pr: 0.16 },
    leads: [
      lead('II', { ...II_NORMAL, st: 0.16, prSeg: -0.07, t: { a: 0.38, rise: 0.07, fall: 0.05 } }),
      lead('aVR', { p: { a: -0.11, s: 0.02 }, qrs: [{ c: 0.04, s: 0.0095, a: -0.85 }, { c: 0.066, s: 0.009, a: 0.14 }], j: 0.09, st: -0.12, prSeg: 0.07, t: { a: -0.28, rise: 0.065, fall: 0.045 }, qtc: 0.40 }),
      lead('V5', { ...II_NORMAL, qrs: [{ c: 0.012, s: 0.006, a: -0.08 }, { c: 0.04, s: 0.0095, a: 1.35 }, { c: 0.068, s: 0.009, a: -0.2 }], st: 0.18, prSeg: -0.06, t: { a: 0.42, rise: 0.07, fall: 0.05 } }),
    ],
    look: [
      'Widespread, concave ("saddle-shaped") ST elevation — not confined to one territory.',
      'PR depression in most leads, with PR ELEVATION and ST depression in aVR.',
      'No reciprocal ST depression elsewhere, which is what separates it from a STEMI.',
    ],
    why: 'Inflammation of the pericardium — viral, post-MI (Dressler), uraemic, autoimmune. Pleuritic chest pain eased by sitting forward; NSAIDs and colchicine.',
  },
  {
    id: 'rbbb',
    category: 'pattern',
    answer: 'Right bundle branch block',
    distractors: ['Left bundle branch block', 'Wolff–Parkinson–White', 'Ventricular tachycardia', 'Anterior STEMI (left anterior descending)'],
    rhythm: { type: 'sinus', rate: 72, pr: 0.16 },
    leads: [
      lead('V1', { p: { a: 0.08, s: 0.02 }, qrs: [
        { c: 0.02, s: 0.008, a: 0.28 },   // r
        { c: 0.046, s: 0.01, a: -0.38 },  // S
        { c: 0.088, s: 0.016, a: 0.85 },  // R' — the "M"
      ], j: 0.13, t: { a: -0.22, rise: 0.065, fall: 0.05 }, qtc: 0.42 }),
      lead('V6', { p: { a: 0.1, s: 0.02 }, qrs: [
        { c: 0.012, s: 0.006, a: -0.1 },
        { c: 0.038, s: 0.0105, a: 1.1 },
        { c: 0.088, s: 0.022, a: -0.36 },  // broad, slurred S
      ], j: 0.13, t: { a: 0.3, rise: 0.065, fall: 0.045 }, qtc: 0.42 }),
    ],
    look: [
      'QRS 0.12 s or wider.',
      'V1: an rSR′ — the "M" or "rabbit ears" pattern.',
      'V6: a broad, slurred S wave — the "W".',
    ],
    why: 'The right ventricle depolarises late, through the muscle rather than the bundle. Can be a normal variant; also seen with PE, right ventricular strain, ASD and ischaemic heart disease.',
  },
  {
    id: 'lbbb',
    category: 'pattern',
    answer: 'Left bundle branch block',
    distractors: ['Right bundle branch block', 'Anterior STEMI (left anterior descending)', 'Ventricular tachycardia', 'Wolff–Parkinson–White'],
    rhythm: { type: 'sinus', rate: 70, pr: 0.17 },
    leads: [
      lead('V1', { p: { a: 0.08, s: 0.02 }, qrs: [
        { c: 0.014, s: 0.006, a: 0.08 },
        { c: 0.072, s: 0.03, a: -1.45 },   // deep, broad S
      ], j: 0.14, st: 0.12, t: { a: 0.38, rise: 0.07, fall: 0.05 }, qtc: 0.44 }),
      lead('V6', { p: { a: 0.1, s: 0.02 }, qrs: [
        { c: 0.046, s: 0.02, a: 0.95 },
        { c: 0.098, s: 0.02, a: 1.05 },    // notched, broad R — the "M"
      ], j: 0.14, st: -0.1, t: { a: -0.32, rise: 0.07, fall: 0.05 }, qtc: 0.44 }),
    ],
    look: [
      'QRS 0.12 s or wider.',
      'V1: a deep, broad S wave (the "W"); V6: a broad, notched R with no Q wave (the "M").',
      'ST segments and T waves point AWAY from the QRS (discordant) — expected, not ischaemia.',
    ],
    why: 'The left ventricle depolarises late, from right to left. Rarely benign — think hypertension, aortic stenosis, cardiomyopathy and ischaemia. A new LBBB with chest pain is managed as a STEMI equivalent.',
  },
  // ── Added so every distractor has a strip to compare against ───────────
  {
    id: 'sinus-arrhythmia',
    category: 'rhythm',
    answer: 'Sinus arrhythmia',
    distractors: ['Normal sinus rhythm', 'Atrial fibrillation', 'Mobitz I (Wenckebach)', 'Atrial bigeminy (PACs)'],
    // A 6 s breath (10/min, resting) gives ~7 beats per cycle, so the RR drifts
    // rather than jumps — the gradual quality that separates it from AF.
    rhythm: { type: 'sinusArrhythmia', rate: 68, pr: 0.16, depth: 0.17, breath: 6 },
    leads: [lead('II', II_NORMAL)],
    look: [
      'The RR interval lengthens and shortens smoothly and gradually, in a cycle of a few seconds — with breathing.',
      'Every beat is sinus: the same upright P wave, the same PR, before every QRS.',
      'Regularly irregular — there is a pattern to it, unlike atrial fibrillation.',
    ],
    why: 'The heart rate rises on inspiration and falls on expiration, through vagal tone. Normal and healthy, especially in the young; it fades with age and autonomic disease.',
  },
  {
    id: 'junctional',
    category: 'rhythm',
    answer: 'Junctional rhythm',
    distractors: ['Sinus bradycardia', 'Complete (third-degree) heart block', 'First-degree AV block', 'Wolff–Parkinson–White'],
    rhythm: { type: 'sinus', rate: 50, pr: 0.08, variability: 0.01 },
    leads: [lead('II', { ...II_NORMAL, p: { a: -0.11, s: 0.018 } })],
    look: [
      'Regular, narrow QRS at a junctional rate — 40 to 60.',
      'The P wave is INVERTED in lead II: the atria are being activated backwards, from below.',
      'The PR is short (under 0.12 s) — or the P is hidden in or just after the QRS.',
    ],
    why: 'The AV junction has taken over as pacemaker, because the sinus node has failed or slowed below it. Think sick sinus syndrome, digoxin, beta-blockers, inferior MI.',
  },
  {
    id: 'flutter-variable',
    category: 'rhythm',
    answer: 'Atrial flutter with variable block',
    distractors: ['Atrial fibrillation', 'Atrial flutter with 2:1 block', 'Multifocal atrial tachycardia', 'Sinus tachycardia with PACs'],
    rhythm: { type: 'flutter', ratios: [2, 4, 3, 4, 2, 3, 4] },
    continuous: 'flutter',
    leads: [lead('II', { ...II_NORMAL, p: null })],
    look: [
      'An irregular ventricular rhythm…',
      '…over a REGULAR sawtooth baseline at 300/min — the flutter waves never change pace.',
      'The RR intervals are always whole multiples of the flutter cycle (2:1, 3:1, 4:1).',
    ],
    why: 'The same right-atrial circuit as any flutter, with the AV node letting through a varying number of waves. Irregular, so easily called AF — the organised sawtooth is what gives it away.',
  },
  {
    id: 'mat',
    category: 'rhythm',
    answer: 'Multifocal atrial tachycardia',
    distractors: ['Atrial fibrillation', 'Sinus tachycardia with PACs', 'Atrial flutter with variable block', 'Sinus tachycardia'],
    rhythm: { type: 'mat', rate: 118 },
    leads: [lead('II', II_NORMAL, { pAlt: [P_NORMAL, { a: -0.1, s: 0.018 }, { a: 0.26, s: 0.014 }] })],
    look: [
      'An irregular tachycardia over 100…',
      '…with a P wave before every QRS — but at least three DIFFERENT P-wave shapes.',
      'The PR interval changes along with the P wave, because each comes from a different focus.',
    ],
    why: 'Several atrial foci firing in turn — classically in severe COPD, hypoxia, hypokalaemia and hypomagnesaemia. Treat the lung disease and the electrolytes; it does not respond to cardioversion.',
  },
  {
    id: 'pacs',
    category: 'rhythm',
    answer: 'Sinus tachycardia with PACs',
    distractors: ['Atrial fibrillation', 'Multifocal atrial tachycardia', 'Atrial bigeminy (PACs)', 'Ventricular bigeminy (PVCs)'],
    rhythm: { type: 'pacs', rate: 108, pr: 0.15, every: 4, coupling: 0.68 },
    leads: [lead('II', II_NORMAL, { pAlt: [P_NORMAL, { a: -0.09, s: 0.016 }] })],
    look: [
      'A sinus tachycardia, interrupted by an occasional EARLY beat.',
      'The early beat has a P wave of a different shape, then a normal narrow QRS.',
      'The pause after it is not compensatory: the PAC resets the sinus node.',
    ],
    why: 'Premature atrial complexes from an ectopic atrial focus. Common and usually benign — caffeine, alcohol, stress, stimulants, atrial stretch.',
  },
  {
    id: 'atrial-bigeminy',
    category: 'rhythm',
    answer: 'Atrial bigeminy (PACs)',
    distractors: ['Ventricular bigeminy (PVCs)', 'Mobitz I (Wenckebach)', 'Sinus arrhythmia', 'Mobitz II (second-degree, type II)'],
    rhythm: { type: 'pacs', rate: 76, pr: 0.16, every: 2, coupling: 0.62 },
    leads: [lead('II', II_NORMAL, { pAlt: [P_NORMAL, { a: -0.09, s: 0.016 }] })],
    look: [
      'Beats arrive in pairs: a sinus beat, then an early beat, then a pause.',
      'The early beat has its own, differently shaped P wave, and a NARROW QRS like the sinus beats.',
      'Every QRS has a P in front of it — none is dropped.',
    ],
    why: 'Every other beat is a premature atrial complex. Benign in most; the grouped rhythm is easily mistaken for second-degree AV block, so look for the early P wave.',
  },
  {
    id: 'digoxin',
    category: 'pattern',
    answer: 'Digoxin effect',
    distractors: ['Hypokalaemia', 'Long QT syndrome', 'Hyperkalaemia', 'Acute pericarditis'],
    rhythm: { type: 'sinus', rate: 64, pr: 0.2 },
    leads: [lead('II', { ...II_NORMAL, st: -0.14, t: { a: 0.06, rise: 0.06, fall: 0.04 }, qtc: 0.36 })],
    look: [
      'Sagging, scooped ST depression — the "reverse tick".',
      'Flattened or inverted T waves.',
      'A SHORT QT, and often a longish PR.',
    ],
    why: 'The expected effect of digoxin at therapeutic levels — not toxicity on its own. Toxicity shows as arrhythmias: PACs and PVCs, atrial tachycardia with block, bidirectional VT. Hypokalaemia makes it worse.',
  },
  {
    id: 'early-repol',
    category: 'pattern',
    answer: 'Early repolarisation',
    distractors: ['Anterior STEMI (left anterior descending)', 'Acute pericarditis', 'Hyperkalaemia', 'Left bundle branch block'],
    rhythm: { type: 'sinus', rate: 58, pr: 0.16 },
    leads: [
      lead('V2', { p: { a: 0.07, s: 0.02 }, qrs: [{ c: 0.03, s: 0.009, a: 0.35 }, { c: 0.058, s: 0.011, a: -0.9 }, { c: 0.086, s: 0.006, a: 0.12 }], j: 0.095, st: 0.16, t: { a: 0.62, rise: 0.08, fall: 0.05 }, qtc: 0.40 }),
      lead('V3', { p: { a: 0.08, s: 0.02 }, qrs: [{ c: 0.034, s: 0.01, a: 0.75 }, { c: 0.062, s: 0.011, a: -0.6 }, { c: 0.088, s: 0.006, a: 0.14 }], j: 0.095, st: 0.18, t: { a: 0.68, rise: 0.08, fall: 0.05 }, qtc: 0.40 }),
      lead('V4', { p: { a: 0.1, s: 0.02 }, qrs: [{ c: 0.012, s: 0.006, a: -0.06 }, { c: 0.04, s: 0.0095, a: 1.2 }, { c: 0.068, s: 0.009, a: -0.25 }, { c: 0.088, s: 0.006, a: 0.13 }], j: 0.095, st: 0.15, t: { a: 0.58, rise: 0.08, fall: 0.05 }, qtc: 0.40 }),
    ],
    look: [
      'Modest, CONCAVE ST elevation, usually in the precordial leads.',
      'A notch or slur at the J point, where the QRS ends.',
      'Tall T waves in proportion to the QRS, a slowish rate, and no reciprocal ST depression anywhere.',
    ],
    why: 'A benign variant, typical of young, fit men. The danger is calling it a STEMI — or the reverse. Infarct elevation is convex, evolves over time, and has reciprocal change.',
  },
];

// The answer set every distractor is drawn from — kept in sync with the cases
// so a distractor that names something the bank never shows is still a real
// diagnosis, not a typo.
export const CATEGORY_LABELS = {
  all: 'Everything',
  rhythm: 'Rhythms & blocks',
  pattern: '12-lead patterns',
};
