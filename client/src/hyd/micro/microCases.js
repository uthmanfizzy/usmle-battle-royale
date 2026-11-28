/**
 * HY Diseases · Microbiology — Qbank-only cases (no animated Clinic),
 * following the First Aid microbiology chapter. Ids start mb_. Case format:
 * see hyd/immuno/immunoCases.js. Run tools/hyd-check.mjs after edits.
 */
import gramPositive from './gramPositive.js';
import gramNegative from './gramNegative.js';
import atypicalZoonotic from './atypicalZoonotic.js';
import viruses from './viruses.js';
import fungi from './fungi.js';
import parasites from './parasites.js';

export const MICRO_CHAPTERS = [
  { id: 'gpos', name: 'Gram-positive', icon: '🟣', blurb: 'Staph, strep, clostridia, bacilli', tint: '167, 139, 250' },
  { id: 'gneg', name: 'Gram-negative', icon: '🔴', blurb: 'Neisseria, enterics, Pseudomonas, Vibrio', tint: '248, 113, 113' },
  { id: 'zoo', name: 'Mycobacteria, spirochaetes & zoonoses', icon: '🦠', blurb: 'TB, syphilis, Lyme, rickettsiae', tint: '45, 212, 191' },
  { id: 'virus', name: 'Viruses & prions', icon: '🧬', blurb: 'Herpes, hepatitis, childhood rashes', tint: '96, 165, 250' },
  { id: 'fungi', name: 'Fungi', icon: '🍄', blurb: 'Endemic mycoses and opportunists', tint: '251, 191, 36' },
  { id: 'parasite', name: 'Parasites', icon: '🪱', blurb: 'Protozoa, worms and mites', tint: '244, 114, 182' },
];

export const MICRO_CASES = [...gramPositive, ...gramNegative, ...atypicalZoonotic, ...viruses, ...fungi, ...parasites];
export const MICRO_BY_ID = Object.fromEntries(MICRO_CASES.map(c => [c.id, c]));
