/**
 * HY Diseases · Haematology & Oncology — Qbank-only cases (no animated
 * Clinic), following the First Aid heme/onc chapter. Ids start hm_. Case
 * format: see hyd/immuno/immunoCases.js. Run tools/hyd-check.mjs after edits.
 */
import redCellsAndClotting from './redCellsAndClotting.js';
import neoplasms from './neoplasms.js';

export const HEME_CHAPTERS = [
  { id: 'micro', name: 'Microcytic & haem synthesis', icon: '🔻', blurb: 'Iron, thalassaemia, lead, porphyrias', tint: '244, 114, 182' },
  { id: 'hemolytic', name: 'Haemolysis & marrow failure', icon: '🩸', blurb: 'Sickle, spherocytosis, AIHA, aplastic', tint: '248, 113, 113' },
  { id: 'bleed', name: 'Bleeding & clotting', icon: '🩹', blurb: 'Platelets, factors, TTP/HUS, thrombophilias', tint: '251, 191, 36' },
  { id: 'lymph', name: 'Lymphomas & plasma cells', icon: '🧫', blurb: 'Hodgkin, NHL, myeloma', tint: '167, 139, 250' },
  { id: 'leuk', name: 'Leukaemias & myeloid', icon: '🧬', blurb: 'ALL, CLL, AML, CML, MPNs', tint: '45, 212, 191' },
];

export const HEME_CASES = [...redCellsAndClotting, ...neoplasms];
export const HEME_BY_ID = Object.fromEntries(HEME_CASES.map(c => [c.id, c]));
