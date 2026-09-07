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

// `rgb` is the subject's own colour as an "r, g, b" triple. The picker feeds
// it to CSS as --jm-subject-rgb, which builds both the solid accent and the
// tinted washes from that one value — rgba(var(--x), .14) rather than
// color-mix(), which older browsers drop entirely.
export const JOURNEY_SUBJECTS = [
  { id: 'biochemistry',     label: 'Biochemistry',                              section: 'general', icon: '⚗️', rgb: '124, 179, 66' },
  { id: 'immunology',       label: 'Immunology',                                section: 'general', icon: '🛡️', rgb: '66, 165, 245' },
  { id: 'microbiology',     label: 'Microbiology',                              section: 'general', icon: '🦠', rgb: '38, 166, 154' },
  { id: 'pathology',        label: 'Pathology',                                 section: 'general', icon: '🔬', rgb: '171, 71, 188' },
  { id: 'pharmacology',     label: 'Pharmacology',                              section: 'general', icon: '💊', rgb: '255, 112, 67' },
  { id: 'public_health',    label: 'Public Health Sciences',                    section: 'general', icon: '📊', rgb: '255, 202, 40' },
  { id: 'cardiovascular',   label: 'Cardiovascular',                            section: 'systems', icon: '❤️', rgb: '239, 83, 80' },
  { id: 'endocrine',        label: 'Endocrine',                                 section: 'systems', icon: '🦋', rgb: '186, 104, 200' },
  { id: 'gastrointestinal', label: 'Gastrointestinal',                          section: 'systems', icon: '🫃', rgb: '255, 167, 38' },
  { id: 'heme_onc',         label: 'Hematology & Oncology',                     section: 'systems', icon: '🩸', rgb: '194, 24, 91' },
  { id: 'msk_skin',         label: 'Musculoskeletal, Skin & Connective Tissue', section: 'systems', icon: '🦴', rgb: '161, 136, 127' },
  { id: 'neuro_special',    label: 'Neurology & Special Senses',                section: 'systems', icon: '🧠', rgb: '126, 87, 194' },
  { id: 'psychiatry',       label: 'Psychiatry',                                section: 'systems', icon: '🧩', rgb: '92, 107, 192' },
  { id: 'renal',            label: 'Renal',                                     section: 'systems', icon: '💧', rgb: '41, 182, 246' },
  { id: 'reproductive',     label: 'Reproductive',                              section: 'systems', icon: '👶', rgb: '240, 98, 146' },
  { id: 'respiratory',      label: 'Respiratory',                               section: 'systems', icon: '🫁', rgb: '77, 208, 225' },
];
