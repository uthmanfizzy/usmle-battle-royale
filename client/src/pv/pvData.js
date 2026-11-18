import { coupledLoop, NORMAL_INPUTS, NORMAL_LOOP, edpvr } from './pvEngine';

/**
 * Every loop the game shows other than normal, with what to look for.
 *
 *   kind       'disease' or 'change' (an acute change in one determinant)
 *   loop       the loop's numbers (see pvEngine.buildLoop)
 *   signature  the one thing on the loop that gives it away
 *   changes    what moves vs normal, as [label, arrow] — arrows ↑ ↓ ↑↑ ↓↓ ↔
 *   why        the physiology, short lines
 *   clues      how it turns up in a vignette
 *   confusers  ids it is easiest to mistake for (used as quiz distractors)
 */

const stiff = (b, v0 = 20, a = 0.9) => ({ a, b, v0 });
const loopWith = (L) => ({ ...L, edp: L.edp ?? edpvr(L.edv, L.stiff) });

export const NORMAL = {
  id: 'normal',
  name: 'Normal',
  loop: NORMAL_LOOP,
};

export const PV_CASES = [
  // ── Valve disease ──────────────────────────────────────────────────────
  {
    id: 'as', kind: 'disease', name: 'Aortic stenosis', short: 'AS', icon: '🔒',
    loop: loopWith({ edv: 125, esv: 60, stiff: stiff(0.028), pOpen: 90, pPeak: 192, pEs: 150, pMo: 12 }),
    signature: 'A very TALL loop — the LV generates ~190 mmHg to push blood through the narrow valve.',
    changes: [['Peak LV pressure', '↑↑'], ['Stroke volume', '↓'], ['ESV', '↑'], ['EDP', '↑'], ['EDV', '↔']],
    why: [
      'The stenotic valve is a fixed afterload: LV pressure must rise far above aortic pressure to eject.',
      'Less blood leaves each beat, so ESV rises and SV falls.',
      'Concentric hypertrophy stiffens the LV → steeper EDPVR → higher EDP.',
    ],
    clues: 'Elderly patient with syncope, angina or dyspnoea on exertion; crescendo–decrescendo systolic murmur radiating to the carotids; pulsus parvus et tardus.',
    confusers: ['afterload_up', 'hcm', 'hfpef'],
  },
  {
    id: 'ar', kind: 'disease', name: 'Aortic regurgitation', short: 'AR', icon: '↩️',
    loop: loopWith({ edv: 210, esv: 80, stiff: stiff(0.0145), pOpen: 50, pPeak: 150, pEs: 115, pMo: 10, dvC: -6, dvR: 26 }),
    signature: 'Huge and WIDE, shifted right — and NO true isovolumetric relaxation: the left side leans right as blood pours back in from the aorta.',
    changes: [['EDV', '↑↑'], ['Total stroke volume', '↑↑'], ['Peak LV pressure', '↑'], ['Aortic diastolic pressure', '↓'], ['Isovolumetric relaxation', 'absent']],
    why: [
      'Blood leaks back from the aorta as soon as the aortic valve "closes", so the LV gains volume while its pressure is still falling.',
      'The LV fills from both the LA and the aorta → EDV very high; eccentric hypertrophy keeps it compliant.',
      'A big total SV raises systolic pressure; the runoff back into the LV drops diastolic pressure, so the aortic valve opens at a low pressure (wide pulse pressure).',
    ],
    clues: 'Wide pulse pressure, bounding (water-hammer) pulses, head bobbing; early diastolic decrescendo murmur; Marfan syndrome, bicuspid valve, aortic root dilation, endocarditis.',
    confusers: ['mr', 'hfref', 'preload_up'],
  },
  {
    id: 'mr', kind: 'disease', name: 'Mitral regurgitation', short: 'MR', icon: '🔙',
    loop: loopWith({ edv: 160, esv: 50, stiff: stiff(0.02), pOpen: 70, pPeak: 110, pEs: 90, pMo: 9, dvC: 16, dvR: -8 }),
    signature: 'NO true isovolumetric phases — both vertical sides lean LEFT, because blood escapes back into the LA whenever the LV contracts or relaxes.',
    changes: [['EDV', '↑'], ['ESV', '↓'], ['Total stroke volume / EF', '↑'], ['Forward stroke volume', '↓'], ['Isovolumetric contraction & relaxation', 'absent']],
    why: [
      'The leaky mitral valve gives the LV a low-pressure exit into the LA: volume falls before the aortic valve opens and keeps falling after it closes.',
      'That easy outlet lowers afterload, so the LV empties more (ESV ↓, EF looks high) — but much of the "stroke volume" goes backwards.',
      'The returning regurgitant volume fills the LV in diastole → EDV ↑.',
    ],
    clues: 'Holosystolic murmur at the apex radiating to the axilla; MVP, post-MI papillary muscle rupture, rheumatic disease, dilated LV.',
    confusers: ['ar', 'preload_up', 'afterload_down'],
  },
  {
    id: 'ms', kind: 'disease', name: 'Mitral stenosis', short: 'MS', icon: '🚪',
    loop: loopWith({ edv: 85, esv: 40, stiff: stiff(0.0249), pOpen: 72, pPeak: 102, pEs: 86, pMo: 7 }),
    signature: 'A SMALL loop shifted LEFT — the LV never fills properly, so EDV, EDP and SV are all low.',
    changes: [['EDV', '↓'], ['EDP', '↓'], ['Stroke volume', '↓'], ['Peak LV pressure', '↓'], ['LA pressure (not on this loop)', '↑↑']],
    why: [
      'The narrow mitral valve limits filling: the LV is under-filled, so EDV and EDP fall.',
      'Less filling = less preload → smaller stroke volume (Frank–Starling).',
      'The pressure builds UPSTREAM — in the LA and pulmonary veins — not in the LV.',
    ],
    clues: 'Rheumatic heart disease, opening snap then diastolic rumble, AF, LA enlargement, dysphagia or hoarseness, haemoptysis.',
    confusers: ['preload_down', 'hcm', 'hfpef'],
  },
  // ── Heart failure / cardiomyopathy ─────────────────────────────────────
  {
    id: 'hfref', kind: 'disease', name: 'Systolic heart failure (HFrEF, dilated cardiomyopathy)', short: 'HFrEF', icon: '💔',
    loop: loopWith({ edv: 210, esv: 150, stiff: stiff(0.0155), pOpen: 70, pPeak: 100, pEs: 90, pMo: 12 }),
    signature: 'A loop sitting FAR RIGHT and NARROW — huge volumes, little ejected, with a flat ESPVR (low contractility).',
    changes: [['Contractility (ESPVR slope)', '↓↓'], ['ESV', '↑↑'], ['EDV', '↑'], ['EF', '↓↓'], ['EDP', '↑']],
    why: [
      'Weak contraction flattens the ESPVR: the LV stops ejecting at a much larger volume.',
      'The LV dilates to keep SV up via Frank–Starling — EDV ↑ — but EF falls (< 40%).',
      'Higher EDP backs up into the lungs (pulmonary congestion).',
    ],
    clues: 'Ischaemic heart disease, alcohol, doxorubicin, Chagas, peripartum; S3 gallop, displaced apex, EF < 40%.',
    confusers: ['contractility_down', 'ar', 'preload_up'],
  },
  {
    id: 'hfpef', kind: 'disease', name: 'Diastolic heart failure (HFpEF, restrictive / stiff LV)', short: 'HFpEF', icon: '🧱',
    loop: loopWith({ edv: 100, esv: 40, stiff: stiff(0.04), pOpen: 85, pPeak: 135, pEs: 115, pMo: 12 }),
    signature: 'The bottom (filling) curve shoots UP steeply — a stiff ventricle: high EDP for a normal or small EDV, with a normal EF.',
    changes: [['Compliance (EDPVR)', '↓ (steeper)'], ['EDP', '↑↑'], ['EDV', '↓/↔'], ['EF', '↔'], ['Stroke volume', '↓/↔']],
    why: [
      'A thick or infiltrated wall resists filling, so every mL costs much more pressure.',
      'Contraction is fine (normal ESPVR, normal EF), but EDV is limited.',
      'The high filling pressure transmits back to the lungs → dyspnoea despite a normal EF.',
    ],
    clues: 'Elderly, hypertensive, often female; LVH, amyloidosis or sarcoidosis (restrictive); S4 gallop; EF ≥ 50%.',
    confusers: ['hcm', 'as', 'ms'],
  },
  {
    id: 'hcm', kind: 'disease', name: 'Hypertrophic cardiomyopathy (obstructive)', short: 'HCM', icon: '💪',
    loop: loopWith({ edv: 90, esv: 25, stiff: stiff(0.045), pOpen: 80, pPeak: 170, pEs: 120, pMo: 13 }),
    signature: 'SMALL cavity (low EDV), a steep filling curve, a TALL systolic peak from outflow obstruction — and a very high EF.',
    changes: [['EDV', '↓'], ['EDP', '↑'], ['ESV', '↓↓'], ['EF', '↑'], ['Peak LV pressure', '↑ (LVOT gradient)']],
    why: [
      'A thick, stiff septum and wall make a small, poorly compliant cavity (diastolic dysfunction).',
      'The hyperdynamic LV empties almost completely — ESV very small, EF high.',
      'Septal hypertrophy and systolic anterior motion of the mitral leaflet obstruct the outflow tract, so systolic LV pressure rises.',
    ],
    clues: 'Young athlete with syncope or sudden death; family history (sarcomere mutations, AD); systolic murmur louder with Valsalva or standing; S4.',
    confusers: ['as', 'hfpef', 'contractility_up'],
  },
  // ── Acute changes in one determinant ───────────────────────────────────
  {
    id: 'preload_up', kind: 'change', name: 'Increased preload', short: '↑ Preload', icon: '💧',
    loop: coupledLoop({ ...NORMAL_INPUTS, fill: 18 }),
    signature: 'The loop gets WIDER to the RIGHT along the same filling curve — EDV ↑ and SV ↑, ESV barely moves.',
    changes: [['EDV', '↑'], ['Stroke volume', '↑'], ['ESV', '↔/slight ↑'], ['EDP', '↑']],
    why: [
      'More venous return stretches the LV further along the same EDPVR.',
      'Frank–Starling: more stretch → more forceful contraction → bigger stroke volume.',
      'Contractility is unchanged, so the end-systolic point stays on the same ESPVR.',
    ],
    clues: 'IV fluids, transfusion, leg raising, lying down, volume overload.',
    confusers: ['contractility_up', 'ar', 'afterload_down'],
  },
  {
    id: 'preload_down', kind: 'change', name: 'Decreased preload', short: '↓ Preload', icon: '🩸',
    loop: coupledLoop({ ...NORMAL_INPUTS, fill: 5 }),
    signature: 'The loop gets NARROWER from the RIGHT — EDV ↓ and SV ↓, sliding down the same filling curve.',
    changes: [['EDV', '↓'], ['Stroke volume', '↓'], ['EDP', '↓'], ['Peak pressure', '↓']],
    why: [
      'Less venous return means less stretch at end-diastole.',
      'Frank–Starling in reverse: less stretch → smaller stroke volume.',
    ],
    clues: 'Haemorrhage, dehydration, diuretics, venodilators (nitrates), standing up, tension pneumothorax or tamponade.',
    confusers: ['ms', 'contractility_down', 'afterload_up'],
  },
  {
    id: 'afterload_up', kind: 'change', name: 'Increased afterload', short: '↑ Afterload', icon: '🧗',
    loop: coupledLoop({ ...NORMAL_INPUTS, ea: 2.4 }),
    signature: 'TALLER and NARROWER — the aortic valve opens at a higher pressure, and ejection stops early (ESV ↑).',
    changes: [['Aortic opening & peak pressure', '↑'], ['ESV', '↑'], ['Stroke volume', '↓'], ['EDV', '↔ (acutely)']],
    why: [
      'Higher arterial pressure means the LV must reach a higher pressure before the aortic valve opens.',
      'Ejection stops where the end-systolic point meets the (unchanged) ESPVR — at a higher pressure, so a larger volume.',
    ],
    clues: 'Hypertension, vasoconstrictors (phenylephrine), aortic coarctation.',
    confusers: ['as', 'contractility_down', 'preload_down'],
  },
  {
    id: 'afterload_down', kind: 'change', name: 'Decreased afterload', short: '↓ Afterload', icon: '🛝',
    loop: coupledLoop({ ...NORMAL_INPUTS, ea: 0.95 }),
    signature: 'SHORTER and WIDER — the aortic valve opens earlier and the LV empties further (ESV ↓, SV ↑).',
    changes: [['Aortic opening & peak pressure', '↓'], ['ESV', '↓'], ['Stroke volume', '↑']],
    why: [
      'Lower arterial resistance lets the ventricle eject sooner and more completely.',
      'The end-systolic point slides DOWN the same ESPVR to a smaller volume.',
    ],
    clues: 'Arteriolar vasodilators (hydralazine, ACE inhibitors), sepsis, exercise in muscle beds.',
    confusers: ['contractility_up', 'preload_up', 'mr'],
  },
  {
    id: 'contractility_up', kind: 'change', name: 'Increased contractility', short: '↑ Contractility', icon: '⚡',
    loop: coupledLoop({ ...NORMAL_INPUTS, ees: 3.5 }),
    signature: 'The ESPVR line gets STEEPER and the loop extends LEFT — ESV ↓, SV ↑, EF ↑, same EDV.',
    changes: [['ESPVR slope', '↑'], ['ESV', '↓'], ['Stroke volume & EF', '↑'], ['EDV', '↔']],
    why: [
      'More calcium cycling in the myocyte → more force at any volume → a steeper ESPVR.',
      'The ventricle ejects down to a smaller end-systolic volume.',
    ],
    clues: 'Sympathetic stimulation, catecholamines, dobutamine, digoxin, ↑ extracellular Ca²⁺.',
    confusers: ['afterload_down', 'preload_up', 'hcm'],
  },
  {
    id: 'contractility_down', kind: 'change', name: 'Decreased contractility', short: '↓ Contractility', icon: '🐢',
    loop: coupledLoop({ ...NORMAL_INPUTS, ees: 1.2 }),
    signature: 'The ESPVR line FLATTENS and the loop shrinks from the LEFT — ESV ↑, SV ↓, EF ↓.',
    changes: [['ESPVR slope', '↓'], ['ESV', '↑'], ['Stroke volume & EF', '↓'], ['EDV', '↔ (acutely)']],
    why: [
      'Weaker contraction at every volume flattens the ESPVR.',
      'Ejection ends at a larger volume. Over time the LV dilates (EDV ↑) — that is chronic systolic heart failure.',
    ],
    clues: 'β-blockers, non-dihydropyridine Ca²⁺ channel blockers, myocardial infarction, acidosis, hypoxia.',
    confusers: ['hfref', 'afterload_up', 'preload_down'],
  },
];

export const CASE_BY_ID = Object.fromEntries(PV_CASES.map(c => [c.id, c]));

/** Lab presets — slider positions that reproduce the acute changes. */
export const LAB_PRESETS = [
  { id: 'normal', label: 'Normal', icon: '❤️', inputs: NORMAL_INPUTS },
  { id: 'fluids', label: 'IV fluids', icon: '💧', inputs: { ...NORMAL_INPUTS, fill: 18 } },
  { id: 'bleed', label: 'Haemorrhage', icon: '🩸', inputs: { ...NORMAL_INPUTS, fill: 5 } },
  { id: 'pressor', label: 'Vasoconstrictor', icon: '🧗', inputs: { ...NORMAL_INPUTS, ea: 2.4 } },
  { id: 'dilator', label: 'Vasodilator', icon: '🛝', inputs: { ...NORMAL_INPUTS, ea: 0.95 } },
  { id: 'inotrope', label: 'Inotrope', icon: '⚡', inputs: { ...NORMAL_INPUTS, ees: 3.5 } },
  { id: 'bblock', label: 'β-blocker', icon: '🐢', inputs: { ...NORMAL_INPUTS, ees: 1.4 } },
  { id: 'stiff', label: 'Stiff LV', icon: '🧱', inputs: { ...NORMAL_INPUTS, stiffMul: 1.5 } },
];
