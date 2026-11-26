/**
 * Clinical: practise a patient from the first question to the last order.
 * Admin-only while it is being built (see useAdminAccess).
 *
 * A specialty is open when it has cases. A case is plain data (see
 * paeds/bronchiolitis.js for the shape) run by components/ClinicalCase.jsx,
 * so a new case is a new data file added to its specialty here.
 */
import bronchiolitis from './paeds/bronchiolitis';

export const SPECIALTIES = [
  { id: 'paediatrics', name: 'Paediatrics', icon: '🧸', blurb: 'Babies and children, where the history often comes from a parent and the numbers change with age.', cases: [bronchiolitis] },
  { id: 'medicine', name: 'Internal Medicine', icon: '🫀', blurb: 'The acute medical take.', cases: [] },
  { id: 'surgery', name: 'Surgery', icon: '🔪', blurb: 'The acute abdomen and beyond.', cases: [] },
  { id: 'obgyn', name: 'Obstetrics & Gynaecology', icon: '🤰', blurb: 'Labour ward and the gynae emergency.', cases: [] },
  { id: 'emergency', name: 'Emergency Medicine', icon: '🚑', blurb: 'Resus, majors and minors.', cases: [] },
  { id: 'psychiatry', name: 'Psychiatry', icon: '🧠', blurb: 'Assessment, risk and safety.', cases: [] },
];

export const specialtyById = (id) => SPECIALTIES.find(s => s.id === id) || null;
export const caseById = (spec, id) => specialtyById(spec)?.cases.find(c => c.id === id) || null;

const KEY = 'mv_clinical_best_v1';
export function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export function saveBest(caseId, score) {
  const all = loadBest();
  if ((all[caseId] ?? -1) >= score) return;
  all[caseId] = score;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* not remembered */ }
}
