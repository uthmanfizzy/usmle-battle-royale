/**
 * HY Diseases · Reproductive — Qbank-only cases (no animated Clinic),
 * following the First Aid reproductive chapter. Ids start rp_. Case format:
 * see hyd/immuno/immunoCases.js. Run tools/hyd-check.mjs after edits.
 */
import developmentPregnancy from './developmentPregnancy.js';
import gynecology from './gynecology.js';
import breastMale from './breastMale.js';

export const REPRO_CHAPTERS = [
  { id: 'sexdev', name: 'Sex development & puberty', icon: '🧬', blurb: 'Klinefelter, Turner, AIS, Kallmann', tint: '167, 139, 250' },
  { id: 'preg', name: 'Pregnancy & placenta', icon: '🤰', blurb: 'Previa, abruption, moles, preeclampsia', tint: '244, 114, 182' },
  { id: 'uterus', name: 'Uterus, cervix & vulva', icon: '🌸', blurb: 'Fibroids, endometriosis, cancers', tint: '251, 146, 60' },
  { id: 'ovary', name: 'Ovary & cycle', icon: '🥚', blurb: 'PCOS, amenorrhoea, ovarian tumours', tint: '251, 191, 36' },
  { id: 'breast', name: 'Breast', icon: '🎗️', blurb: 'Benign lumps to invasive cancer', tint: '96, 165, 250' },
  { id: 'male', name: 'Male reproductive', icon: '♂️', blurb: 'Scrotum, testis, penis, prostate', tint: '45, 212, 191' },
];

export const REPRO_CASES = [...developmentPregnancy, ...gynecology, ...breastMale];
export const REPRO_BY_ID = Object.fromEntries(REPRO_CASES.map(c => [c.id, c]));
