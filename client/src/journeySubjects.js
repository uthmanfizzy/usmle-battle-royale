// First Aid Journey subject system — the single source of truth.
// Imported by BOTH the player (JourneyMode) and the admin (AdminApp JourneyPanel)
// so chapter authoring and the player pathway always share the same subject ids.
// These are journey-only and independent of the app's other subject lists
// (SubjectSelect SUBJECTS / AdminApp FOLDERS).
//
// journey_chapters.subject stores these ids as text — renaming an id orphans
// any content authored under the old one.

export const JOURNEY_SECTIONS = [
  { id: 'general', label: 'High-Yield General Principles' },
  { id: 'systems', label: 'High-Yield Organ Systems' },
];

export const JOURNEY_SUBJECTS = [
  { id: 'biochemistry',     label: 'Biochemistry',                              section: 'general', icon: '⚗️' },
  { id: 'immunology',       label: 'Immunology',                                section: 'general', icon: '🛡️' },
  { id: 'microbiology',     label: 'Microbiology',                              section: 'general', icon: '🦠' },
  { id: 'pathology',        label: 'Pathology',                                 section: 'general', icon: '🔬' },
  { id: 'pharmacology',     label: 'Pharmacology',                              section: 'general', icon: '💊' },
  { id: 'public_health',    label: 'Public Health Sciences',                    section: 'general', icon: '📊' },
  { id: 'cardiovascular',   label: 'Cardiovascular',                            section: 'systems', icon: '❤️' },
  { id: 'endocrine',        label: 'Endocrine',                                 section: 'systems', icon: '🦋' },
  { id: 'gastrointestinal', label: 'Gastrointestinal',                          section: 'systems', icon: '🫃' },
  { id: 'heme_onc',         label: 'Hematology & Oncology',                     section: 'systems', icon: '🩸' },
  { id: 'msk_skin',         label: 'Musculoskeletal, Skin & Connective Tissue', section: 'systems', icon: '🦴' },
  { id: 'neuro_special',    label: 'Neurology & Special Senses',                section: 'systems', icon: '🧠' },
  { id: 'psychiatry',       label: 'Psychiatry',                                section: 'systems', icon: '🧩' },
  { id: 'renal',            label: 'Renal',                                     section: 'systems', icon: '💧' },
  { id: 'reproductive',     label: 'Reproductive',                              section: 'systems', icon: '👶' },
  { id: 'respiratory',      label: 'Respiratory',                               section: 'systems', icon: '🫁' },
];
