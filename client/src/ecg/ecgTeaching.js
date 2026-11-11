/**
 * What the ECG Reader says AFTER you answer.
 *
 * Kept apart from ecgCases.js, which is the signal: this is the teaching.
 *
 *   WHY_NOT  — for every case, why each of its wrong options is wrong, written
 *              against THIS strip. "Mobitz II has a fixed PR" is a fact; "the
 *              PR here grows before the drop, so it is not Mobitz II" is the
 *              thing that settles the question in front of you.
 *   LABELS   — which features to mark on the strip after answering. Each is a
 *              rule (mark the PR intervals, the dropped P, the ST level…); the
 *              positions and the numbers are measured off the strip itself by
 *              ecgAnnotate.js, so what is written is true of what is drawn.
 *   NORMAL   — a normal complex for every lead the bank uses, so a strip can
 *              be shown above a normal one IN THE SAME LEADS. A normal lead II
 *              under an abnormal V1 compares nothing.
 */
import { ECG_CASES } from './ecgCases';

// ── Why each wrong answer is wrong, case by case ─────────────────────────
export const WHY_NOT = {
  nsr: {
    'Sinus bradycardia': 'The rate is about 75 — four large squares between R waves. Bradycardia needs more than five (under 60).',
    'Sinus tachycardia': 'Tachycardia needs a rate over 100, under three large squares between beats. This is about 75.',
    'First-degree AV block': 'The PR is about 0.16 s — four small squares. First-degree block needs more than one large square (0.20 s).',
    'Sinus arrhythmia': 'The RR intervals here are essentially constant. In sinus arrhythmia they swell and shrink with each breath.',
  },
  'sinus-brady': {
    'Normal sinus rhythm': 'Everything is sinus, but the rate is about 46 — more than six large squares between R waves. Normal is 60–100.',
    'Complete (third-degree) heart block': 'Every P wave is followed by a QRS at the same PR. In complete block the P waves and QRS complexes ignore each other.',
    'Mobitz II (second-degree, type II)': 'No P wave is left without a QRS. Mobitz II drops beats — this one never does.',
    'Junctional rhythm': 'The P waves are upright in lead II with a normal PR. A junctional rhythm has inverted P waves, or none, and a short PR.',
  },
  'sinus-tachy': {
    'Supraventricular tachycardia (AVNRT)': 'Distinct P waves sit in front of every QRS and the rate wavers slightly. AVNRT buries the P waves and is rigidly regular, usually faster.',
    'Atrial flutter with 2:1 block': 'There is a flat baseline between beats, with a normal P wave. Flutter replaces the baseline with a 300/min sawtooth.',
    'Atrial fibrillation': 'The rhythm is regular and every QRS has a P wave. AF is irregularly irregular with no P waves.',
    'Normal sinus rhythm': 'All sinus — but the rate is over 100, under three large squares per beat.',
  },
  af: {
    'Atrial flutter with variable block': 'The baseline is a fine chaotic wobble, not an organised 300/min sawtooth, and the RR intervals follow no multiple of anything.',
    'Multifocal atrial tachycardia': 'There are no P waves at all here. MAT has a P before every QRS, in three or more shapes.',
    'Sinus arrhythmia': 'There are no P waves, and the irregularity has no pattern. Sinus arrhythmia keeps a normal P before every beat and varies smoothly with breathing.',
    'Sinus tachycardia with PACs': 'Nothing here is an early beat interrupting a regular rhythm — there is no underlying regular rhythm at all, and no P waves.',
  },
  flutter: {
    'Sinus tachycardia': 'There are no true P waves — the baseline is a continuous sawtooth, two flutter waves per QRS. And the rate sits at exactly 150.',
    'Supraventricular tachycardia (AVNRT)': 'Look between the beats: a sawtooth at 300/min. AVNRT has a flat baseline with the P waves hidden in the QRS.',
    'Atrial fibrillation': 'The ventricular rhythm is perfectly regular and the atrial waves are organised. AF is irregular over a chaotic baseline.',
    'Ventricular tachycardia': 'The QRS complexes are narrow. VT is broad-complex.',
  },
  svt: {
    'Sinus tachycardia': 'No P waves are visible, and the rate is rigidly fixed at about 180. Sinus tachycardia shows P waves and varies a little beat to beat.',
    'Atrial flutter with 2:1 block': 'The baseline between beats is flat — no sawtooth — and the rate is 180, not the 150 of 2:1 flutter.',
    'Ventricular tachycardia': 'The QRS is narrow (under three small squares). VT is broad.',
    'Atrial fibrillation': 'The rhythm is perfectly regular. AF is irregularly irregular.',
  },
  avb1: {
    'Mobitz I (Wenckebach)': 'The PR is long but the SAME on every beat, and no beat is dropped. In Wenckebach it grows until one is.',
    'Normal sinus rhythm': 'The PR is about 0.30 s — a large square and a half. Normal is up to 0.20 s.',
    'Mobitz II (second-degree, type II)': 'Every P wave is conducted. Mobitz II drops beats.',
    'Wolff–Parkinson–White': 'The PR is LONG here. WPW makes it short, with a delta wave.',
  },
  wenckebach: {
    'Mobitz II (second-degree, type II)': 'The PR lengthens beat by beat before the dropped P. In Mobitz II the PR is fixed until the drop comes without warning.',
    'First-degree AV block': 'Here a P wave is left without a QRS. First-degree block conducts every P wave.',
    'Complete (third-degree) heart block': 'The PR follows a pattern — it lengthens, then resets. In complete block P waves and QRS complexes are unrelated.',
    'Sinus arrhythmia': 'The pause here comes from a P wave that was not conducted. In sinus arrhythmia every P is conducted at the same PR.',
  },
  mobitz2: {
    'Mobitz I (Wenckebach)': 'The PR is identical on every conducted beat — it never lengthens before the drop. That fixed PR is Mobitz II.',
    'Complete (third-degree) heart block': 'Most P waves are conducted, at a constant PR. In complete block none are.',
    'First-degree AV block': 'A P wave is dropped here, and the PR is normal. First-degree block has a long PR and drops nothing.',
    'Sinus bradycardia': 'The slow ventricular rate comes from blocked P waves — look for the P with no QRS after it. In sinus bradycardia every P conducts.',
  },
  chb: {
    'Mobitz II (second-degree, type II)': 'No P wave conducts consistently — the PR is different every time. Mobitz II has a fixed PR on the beats that do conduct.',
    'Mobitz I (Wenckebach)': 'There is no lengthen-then-reset pattern. The P waves and QRS complexes run on separate clocks.',
    'Sinus bradycardia': 'There are far more P waves than QRS complexes, and they bear no relation to each other. Sinus bradycardia has one P per QRS.',
    'Ventricular tachycardia': 'The complexes are broad, but the rate is about 36 — an escape rhythm, not a tachycardia.',
  },
  vt: {
    'Supraventricular tachycardia (AVNRT)': 'The QRS complexes are broad — four or five small squares. SVT is narrow unless there is aberrancy, and a broad regular tachycardia is VT until proven otherwise.',
    'Ventricular fibrillation': 'Every complex is the same shape at a regular rate. VF has no recognisable complexes at all.',
    'Torsades de pointes': 'The complexes are uniform — monomorphic. Torsades twists, with the amplitude swelling and shrinking.',
    'Atrial flutter with 2:1 block': 'The complexes are broad, with no sawtooth between them. Flutter conducts through the normal pathway, so its QRS is narrow.',
  },
  vf: {
    'Ventricular tachycardia': 'There are no repeating complexes here — the amplitude and rhythm change constantly. VT is regular and uniform.',
    'Torsades de pointes': 'There is no organised twisting envelope, no spindles that swell and shrink in turn. This is chaotic throughout.',
    'Asystole': 'There is plenty of electrical activity — just no organised activity. Asystole is a flat line.',
    'Atrial fibrillation': 'There are no QRS complexes. In AF the ventricles still produce clear, narrow complexes, just irregularly.',
  },
  torsades: {
    'Ventricular fibrillation': 'There is order in it: the complexes swell and shrink in spindles and flip direction around the baseline. VF has no such pattern.',
    'Ventricular tachycardia': 'The amplitude and axis change continuously — polymorphic. Monomorphic VT keeps one shape.',
    'Atrial fibrillation': 'There are no narrow QRS complexes. This is a broad polymorphic ventricular rhythm.',
    'Atrial flutter with 2:1 block': 'There are no narrow complexes and no regular sawtooth. The whole trace is the ventricles.',
  },
  bigeminy: {
    'Atrial fibrillation': 'The irregularity is perfectly regular in pairs, and the sinus beats have P waves. AF has no P waves and no pattern.',
    'Mobitz I (Wenckebach)': 'Nothing is dropped. The extra beat is an early, broad ectopic, not a pause.',
    'Ventricular tachycardia': 'The ectopics come singly, each followed by a sinus beat. VT is a run of consecutive ventricular beats.',
    'Atrial bigeminy (PACs)': 'The early beats are BROAD with no P wave and a discordant T. A PAC has its own P wave and a narrow QRS.',
  },
  asystole: {
    'Ventricular fibrillation': 'There is no chaotic activity — only a gently wandering baseline. (Before calling asystole, check the gain and a second lead: fine VF can hide.)',
    'Complete (third-degree) heart block': 'There are no P waves and no QRS complexes at all. Complete block still shows both, just unrelated.',
    'Sinus bradycardia': 'There are no complexes to count. Bradycardia is slow, not absent.',
    'Torsades de pointes': 'Torsades is a fast, large-amplitude rhythm. This is flat.',
  },
  wpw: {
    'First-degree AV block': 'The PR is SHORT — under three small squares. First-degree block is a long PR.',
    'Left bundle branch block': 'The QRS widening comes from a slurred START — the delta wave — after a short PR. LBBB has a normal PR and a broad notched complex in V6.',
    'Normal sinus rhythm': 'The PR is under 0.12 s and the upstroke of the QRS is slurred. Neither is normal.',
    'Hyperkalaemia': 'The T waves are ordinary. Hyperkalaemia peaks the T waves and flattens the P waves; WPW shortens the PR.',
  },
  hyperk: {
    'Hypokalaemia': 'The T waves are TALL and peaked here. Low potassium flattens the T and brings out a U wave.',
    'Anterior STEMI (left anterior descending)': 'The T waves are narrow and tented on an isoelectric ST segment. A STEMI raises the ST segment itself, and its hyperacute T waves are broad.',
    'Long QT syndrome': 'The T wave is narrow and comes early. Long QT pushes a broad T wave far from the QRS.',
    'Wolff–Parkinson–White': 'The PR is long here, not short, and there is no delta wave.',
  },
  hypok: {
    'Hyperkalaemia': 'The T waves are FLAT with a U wave after them. Hyperkalaemia makes them tall and peaked.',
    'Long QT syndrome': 'What looks like a long QT is really a QU interval — the T is small and the hump after it is a U wave.',
    'Digoxin effect': 'There is a prominent U wave here. Digoxin gives scooped ST depression and a SHORT QT, without a big U wave.',
    'Acute pericarditis': 'The ST segment is depressed, not elevated.',
  },
  'long-qt': {
    'Hypokalaemia': 'The T wave itself is late and broad, with no separate U wave after it.',
    'Hyperkalaemia': 'The T wave is broad and late. Hyperkalaemia gives a narrow, peaked, early T.',
    'First-degree AV block': 'The PR is normal. The long interval here is from the QRS to the end of the T.',
    'Normal sinus rhythm': 'The T wave ends more than halfway to the next QRS — QTc about 0.60 s, far over the 0.47 s limit.',
  },
  'inferior-stemi': {
    'Anterior STEMI (left anterior descending)': 'The elevation is in II, III and aVF — the inferior leads — not V2–V4.',
    'Acute pericarditis': 'There is reciprocal ST depression in aVL, and the elevation is confined to one territory. Pericarditis is widespread, without reciprocal change.',
    'Hyperkalaemia': 'The ST segment itself is raised. Hyperkalaemia peaks the T wave over a flat ST segment.',
    'Left bundle branch block': 'The QRS is narrow. LBBB is broad, and its ST changes follow the QRS.',
  },
  'anterior-stemi': {
    'Inferior STEMI (right coronary artery)': 'The elevation is in V2–V4, the anterior chest leads — not in II, III and aVF.',
    'Acute pericarditis': 'The elevation is convex and confined to the LAD territory. Pericarditis is concave, widespread, with PR depression.',
    'Hyperkalaemia': 'The ST segment is elevated, and the T waves are broad. Hyperkalaemia keeps the ST flat under narrow peaked T waves.',
    'Left bundle branch block': 'The QRS is narrow. In LBBB a broad QRS would explain ST changes in V1–V3.',
  },
  pericarditis: {
    'Inferior STEMI (right coronary artery)': 'The elevation is not confined to the inferior leads, there is no reciprocal depression, and the PR segments are depressed.',
    'Anterior STEMI (left anterior descending)': 'The elevation is concave and widespread, with PR depression — and aVR shows the mirror image. That is pericarditis, not a territory.',
    'Hyperkalaemia': 'The ST segments are raised and the PR segments depressed. Hyperkalaemia changes the T wave, not the ST.',
    'Early repolarisation': 'PR depression, a faster rate and widespread change in limb and chest leads point to pericarditis. Early repolarisation has none of these and a J-point notch.',
  },
  rbbb: {
    'Left bundle branch block': 'V1 shows rSR′ — an "M" — and V6 a broad S. LBBB is the opposite: deep broad S in V1 and a notched R in V6.',
    'Wolff–Parkinson–White': 'The PR is normal and there is no delta wave. The widening is at the END of the QRS — the R′.',
    'Ventricular tachycardia': 'This is sinus rhythm at a normal rate, with a P before every QRS. VT is a fast broad tachycardia.',
    'Anterior STEMI (left anterior descending)': 'The ST segments are not elevated. The T inversion in V1 is the expected secondary change of RBBB.',
  },
  lbbb: {
    'Right bundle branch block': 'V1 has a deep broad S (a "W"), not an rSR′, and V6 has a notched R with no S. That is left, not right.',
    'Anterior STEMI (left anterior descending)': 'The QRS is broad and the ST changes are discordant — opposite to the QRS — as LBBB always causes. Sgarbossa criteria are needed to see an infarct through it.',
    'Ventricular tachycardia': 'This is sinus rhythm at 70, with a P wave before every complex.',
    'Wolff–Parkinson–White': 'The PR is normal and there is no delta wave.',
  },
  'sinus-arrhythmia': {
    'Normal sinus rhythm': 'The RR intervals change gradually and noticeably over each breath. Strictly that is sinus arrhythmia — though it is normal physiology.',
    'Atrial fibrillation': 'Every beat has the same upright P wave, and the irregularity rises and falls smoothly. AF has no P waves and no pattern.',
    'Mobitz I (Wenckebach)': 'No P wave is ever dropped, and the PR never changes. The rate itself is what varies.',
    'Atrial bigeminy (PACs)': 'No beat comes early with a different P wave. Every beat is the same sinus beat; only the spacing drifts.',
  },
  junctional: {
    'Sinus bradycardia': 'The P waves are INVERTED in lead II with a short PR. Sinus P waves are upright in II with a normal PR.',
    'Complete (third-degree) heart block': 'Every QRS has its own inverted P at a fixed short interval. In complete block the P waves are upright and unrelated to the QRS.',
    'First-degree AV block': 'The PR is short, not long.',
    'Wolff–Parkinson–White': 'The PR is short, but the P wave is inverted and there is no delta wave. A short PR with a slurred upstroke is WPW.',
  },
  'flutter-variable': {
    'Atrial fibrillation': 'Look at the baseline: a regular sawtooth at 300/min, not chaos. And each RR is a whole number of flutter cycles.',
    'Atrial flutter with 2:1 block': 'The ventricular rhythm is irregular — 2:1, 3:1 and 4:1 in turn. Pure 2:1 flutter is regular at 150.',
    'Multifocal atrial tachycardia': 'There are no discrete P waves of differing shapes — only identical flutter waves at a fixed rate.',
    'Sinus tachycardia with PACs': 'There is no sinus P wave, and no early beat — just varying numbers of flutter waves between beats.',
  },
  mat: {
    'Atrial fibrillation': 'Every QRS has a P wave in front of it. In AF there are none.',
    'Sinus tachycardia with PACs': 'The P waves keep changing — three or more shapes, not one sinus shape with the odd ectopic.',
    'Atrial flutter with variable block': 'There is a flat baseline between discrete P waves, not a continuous sawtooth.',
    'Sinus tachycardia': 'Sinus tachycardia has one P-wave shape and is nearly regular. This changes shape and rhythm constantly.',
  },
  pacs: {
    'Atrial fibrillation': 'There is an underlying regular sinus rhythm with P waves, interrupted only occasionally.',
    'Multifocal atrial tachycardia': 'Most beats share one sinus P wave; only the occasional early beat differs. MAT changes P wave constantly.',
    'Atrial bigeminy (PACs)': 'Only every fourth beat is premature. Bigeminy is every second one.',
    'Ventricular bigeminy (PVCs)': 'The early beats have a P wave and a NARROW QRS. A PVC is broad, with no P.',
  },
  'atrial-bigeminy': {
    'Ventricular bigeminy (PVCs)': 'The early beats have their own P wave and a narrow QRS. PVCs are broad, with no P and a discordant T.',
    'Mobitz I (Wenckebach)': 'Nothing is dropped — the pauses follow beats that came EARLY. Look for the early P wave.',
    'Sinus arrhythmia': 'The early beats have a different P wave and arrive abruptly, not by gradual drift.',
    'Mobitz II (second-degree, type II)': 'Every P wave is followed by a QRS. The grouping is made by early beats, not blocked ones.',
  },
  digoxin: {
    'Hypokalaemia': 'There is no big U wave, and the QT is SHORT. Hypokalaemia gives a prominent U wave and an apparently long QT.',
    'Long QT syndrome': 'The QT is short here, not long.',
    'Hyperkalaemia': 'The T waves are flat, not tall and peaked.',
    'Acute pericarditis': 'The ST segment is depressed, not elevated.',
  },
  'early-repol': {
    'Anterior STEMI (left anterior descending)': 'The elevation is modest and concave, with a notched J point and a slow rate. A STEMI is convex, bigger, and evolves.',
    'Acute pericarditis': 'There is no PR depression and no tachycardia, and there is a J-point notch. Pericarditis is diffuse with PR depression.',
    'Hyperkalaemia': 'The ST segment is raised, and the T waves are broad-based, not narrow and tented.',
    'Left bundle branch block': 'The QRS is narrow.',
  },
};

// ── What to mark on each strip ───────────────────────────────────────────
// Rules, measured off the strip by ecgAnnotate.js. `lead` is an index into
// the case's leads (default 0).
export const LABELS = {
  nsr: [{ type: 'p' }, { type: 'pr', count: 1 }, { type: 'qrs' }, { type: 't' }, { type: 'rate' }],
  'sinus-brady': [{ type: 'p' }, { type: 'rr', count: 2 }, { type: 'rate' }],
  'sinus-tachy': [{ type: 'p', label: 'P before every QRS' }, { type: 'rr', count: 2 }, { type: 'rate' }],
  af: [{ type: 'rr', count: 4 }, { type: 'fwaves' }, { type: 'note', text: 'No P waves anywhere — only a chaotic fibrillatory baseline.' }],
  flutter: [{ type: 'flutter' }, { type: 'rate' }, { type: 'note', text: 'Two flutter waves per QRS: one is easy to see, the other hides under the QRS or T.' }],
  svt: [{ type: 'rr', count: 2 }, { type: 'rate' }, { type: 'qrs' }, { type: 'note', text: 'No visible P waves — in AVNRT they are buried in the QRS.' }],
  avb1: [{ type: 'pr', count: 3 }, { type: 'note', text: 'Long but CONSTANT PR, and every P wave conducts.' }],
  wenckebach: [{ type: 'pr', count: 3 }, { type: 'dropped' }, { type: 'note', text: 'PR grows 0.16 → 0.26 → 0.32 s, then a P wave is not conducted and the cycle resets.' }],
  mobitz2: [{ type: 'pr', count: 2 }, { type: 'dropped' }, { type: 'note', text: 'Same PR every time — then a P wave is blocked without warning.' }],
  chb: [{ type: 'allP' }, { type: 'escape' }, { type: 'note', text: 'P waves (regular, faster) and QRS complexes (regular, slow, broad) keep separate clocks.' }],
  vt: [{ type: 'qrs', label: 'Broad QRS' }, { type: 'rate' }, { type: 'note', text: 'Broad, regular, monomorphic, no P waves.' }],
  vf: [{ type: 'note', text: 'Chaotic — no P waves, no QRS complexes, no T waves. Shock.' }],
  // The envelope is sin(2πt / 2.6): spindles peak at 0.65 + 1.3k s, and the
  // twist — where the amplitude passes through zero and the axis flips — is
  // at 1.3k s. See CONTINUOUS.torsades in ecgEngine.js.
  torsades: [
    { type: 'times', every: 1.3, offset: 0.65, label: 'Spindle — amplitude swells' },
    { type: 'times', every: 1.3, offset: 0, label: 'Twist — axis flips', alert: true },
    { type: 'note', text: 'Spindles swell and shrink, and the complexes flip direction around the baseline from one spindle to the next.' },
  ],
  bigeminy: [{ type: 'pvc' }, { type: 'compensatory' }],
  asystole: [{ type: 'note', text: 'A flat, gently wandering baseline — no P waves, no QRS. Confirm in a second lead and check the gain.' }],
  wpw: [{ type: 'pr', count: 1, label: 'Short PR' }, { type: 'kernel', k: 0, label: 'Delta wave' }, { type: 'qrs' }],
  hyperk: [{ type: 't', label: 'Tall, peaked T' }, { type: 'p', label: 'Flattened P' }, { type: 'qrs', label: 'Widening QRS' }],
  hypok: [{ type: 't', label: 'Flat T' }, { type: 'u' }, { type: 'st' }],
  'long-qt': [{ type: 'qt' }, { type: 'rr', count: 1 }],
  'inferior-stemi': [{ type: 'st', lead: 0 }, { type: 'st', lead: 1 }, { type: 'st', lead: 2 }, { type: 'st', lead: 3, label: 'Reciprocal' }],
  'anterior-stemi': [{ type: 'st', lead: 0 }, { type: 'st', lead: 1 }, { type: 'st', lead: 2 }, { type: 't', lead: 1, label: 'Hyperacute T' }],
  pericarditis: [{ type: 'st', lead: 0 }, { type: 'prseg', lead: 0, label: 'PR depression' }, { type: 'st', lead: 1 }, { type: 'prseg', lead: 1, label: 'PR elevation' }, { type: 'st', lead: 2 }],
  rbbb: [{ type: 'kernel', lead: 0, k: 2, label: 'R′ — the rSR′ "M"' }, { type: 'qrs', lead: 0 }, { type: 'kernel', lead: 1, k: 2, label: 'Broad slurred S' }],
  lbbb: [{ type: 'kernel', lead: 0, k: 1, label: 'Deep broad S' }, { type: 'qrs', lead: 0 }, { type: 'kernel', lead: 1, k: 1, label: 'Notched R' }, { type: 't', lead: 1, label: 'Discordant T' }],
  'sinus-arrhythmia': [{ type: 'rr', count: 4 }, { type: 'p' }],
  junctional: [{ type: 'p', label: 'Inverted P' }, { type: 'pr', count: 1, label: 'Short PR' }, { type: 'rate' }],
  'flutter-variable': [{ type: 'flutter' }, { type: 'rr', count: 3 }],
  mat: [{ type: 'allP' }, { type: 'pr', count: 3 }, { type: 'note', text: 'Three P-wave shapes, a PR that changes with them, an irregular rhythm.' }],
  pacs: [{ type: 'pac' }, { type: 'rr', count: 3 }],
  'atrial-bigeminy': [{ type: 'pac' }, { type: 'rr', count: 3 }],
  digoxin: [{ type: 'st', label: 'Scooped ST' }, { type: 'qt' }],
  'early-repol': [{ type: 'kernel', lead: 0, k: 2, label: 'J-point notch' }, { type: 'st', lead: 0 }, { type: 'st', lead: 1 }],
};

// ── Normal complexes, lead by lead ───────────────────────────────────────
const P = (a) => ({ a, s: 0.02 });
const T = (a) => ({ a, rise: 0.065, fall: 0.045 });
const m = (p, qrs, t) => ({ p: P(p), qrs, j: 0.09, t: T(t), qtc: 0.40 });
const K = (c, s, a) => ({ c, s, a });

export const NORMAL_LEADS = {
  I:   m(0.1,  [K(0.012, 0.006, -0.06), K(0.04, 0.0095, 0.8),  K(0.068, 0.009, -0.15)], 0.22),
  II:  m(0.15, [K(0.012, 0.006, -0.08), K(0.04, 0.0095, 1.25), K(0.068, 0.009, -0.25)], 0.32),
  III: m(0.08, [K(0.012, 0.006, -0.05), K(0.04, 0.0095, 0.6),  K(0.066, 0.009, -0.15)], 0.18),
  aVR: m(-0.11, [K(0.04, 0.0095, -0.85), K(0.066, 0.009, 0.14)], -0.26),
  aVL: m(0.05, [K(0.012, 0.006, -0.05), K(0.038, 0.0095, 0.5), K(0.064, 0.009, -0.2)], 0.14),
  aVF: m(0.11, [K(0.012, 0.006, -0.06), K(0.04, 0.0095, 0.85), K(0.066, 0.009, -0.15)], 0.24),
  V1:  m(0.08, [K(0.025, 0.008, 0.25), K(0.055, 0.011, -1.0)], 0.08),
  V2:  m(0.07, [K(0.03, 0.009, 0.35), K(0.06, 0.011, -1.0)], 0.45),
  V3:  m(0.08, [K(0.034, 0.01, 0.75), K(0.063, 0.011, -0.7)], 0.5),
  V4:  m(0.1,  [K(0.012, 0.006, -0.05), K(0.04, 0.0095, 1.2), K(0.068, 0.009, -0.4)], 0.45),
  V5:  m(0.1,  [K(0.012, 0.006, -0.08), K(0.04, 0.0095, 1.35), K(0.068, 0.009, -0.2)], 0.4),
  V6:  m(0.1,  [K(0.012, 0.006, -0.1), K(0.038, 0.0095, 1.1), K(0.066, 0.009, -0.1)], 0.3),
};

/**
 * A normal ECG in the same leads as `caseDef` — sinus at 72, normal PR, QRS
 * and QT — labelled with what normal looks like in the first lead.
 */
export function normalCaseFor(caseDef) {
  return {
    id: `normal-${caseDef.id}`,
    answer: 'Normal ECG',
    rhythm: { type: 'sinus', rate: 72, pr: 0.16 },
    leads: caseDef.leads.map(l => ({ name: l.name, morph: { normal: NORMAL_LEADS[l.name] || NORMAL_LEADS.II } })),
  };
}

// Spread over three beats — P and PR on the first, QRS on the second, ST and
// T on the third — so no label sits on top of another.
export const NORMAL_LABELS = [
  { type: 'p', beat: 0 }, { type: 'pr', count: 1, beat: 0 },
  { type: 'qrs', beat: 1 },
  { type: 'st', label: 'ST isoelectric', beat: 2 }, { type: 't', beat: 2 },
  { type: 'rate' },
];

/** The case a distractor names, for comparing strips side by side. */
const BY_ANSWER = new Map(ECG_CASES.map(c => [c.answer, c]));
export const caseByAnswer = (answer) => BY_ANSWER.get(answer) || null;

/** Why `option` is wrong for `caseDef`; falls back to the option's own key feature. */
export function whyNot(caseDef, option) {
  const specific = WHY_NOT[caseDef.id]?.[option];
  if (specific) return specific;
  const other = caseByAnswer(option);
  return other ? `${option}: ${other.look[0]}` : '';
}
