// Question-bank modes — the "pick a subject, commit to a daily pace, work the
// bank down" family. UWorld Adventure was the first; Saudi MLE is the same
// machine pointed at a differently-tagged pool of questions.
//
// Single source of truth, imported by the player page, SoloGame's exam skin,
// the router and the admin panel, so a new mode is one entry here rather than a
// copy of an 845-line component. The tag IS the id: questions belong to a mode
// by carrying it in game_modes, exactly as uworld_adventure already worked.
//
// `accentRgb` is an "r, g, b" triple rather than a hex because the exam skin
// builds both solid colours and tinted washes from it — rgba(var(--x), .14)
// works everywhere, while color-mix() ships broken to older browsers.

export const QUESTION_BANK_MODES = [
  {
    id: 'uworld_adventure',
    label: 'UWorld Adventure',
    icon: '🌍',
    route: '/uworld-adventure',
    tagline: 'A high-yield board-review expedition through the wards of Medvale.',
    // Each mode plans its own daily pace. Sharing one scope would let a target
    // set for UWorld silently govern Saudi MLE and double-count today's work.
    paceScope: '__adventure__',
    accentRgb: '47, 111, 201',   // the exam blue this mode already used
  },
  {
    id: 'saudi_mle',
    label: 'Saudi MLE',
    icon: '🇸🇦',
    route: '/saudi-mle',
    tagline: 'Work the Saudi Medical Licensing Exam bank down, at your own pace.',
    paceScope: '__saudi_mle__',
    accentRgb: '22, 137, 90',    // Saudi green
  },
];

export const DEFAULT_QUESTION_BANK_MODE = QUESTION_BANK_MODES[0];

export const questionBankMode = (id) =>
  QUESTION_BANK_MODES.find(m => m.id === id) || DEFAULT_QUESTION_BANK_MODE;

export const QUESTION_BANK_MODE_IDS = QUESTION_BANK_MODES.map(m => m.id);
