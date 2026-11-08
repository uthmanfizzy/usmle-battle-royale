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
//
// `questionSeconds` / `explanationSeconds` are this bank's own clocks. Absent
// means "whatever the exam skin gives everyone" (70 and 75, plus UWorld's own
// +10). These are the DEFAULTS: an admin can override either per bank from
// the Games tab, and that override wins — see questionBankTimers in
// server/index.js.

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
    // Same bargain as rapid fire: a question you cannot answer is better
    // passed over than guessed at. A guess marks it as met and scores it
    // wrong; a skip leaves it in the bank for a later set and is not graded.
    allowSkip: true,
    // The game_mode written to activity_sessions. Kept as the original value so
    // every row already logged keeps its label.
    activityMode: 'question_bank_practice',
    // Subjects this bank does not carry. An admin's own list in
    // questionBankHiddenSubjects overrides it (including an empty one, which
    // means "show everything"); this is only what ships.
    //
    // Haematology & Oncology is a DIFFERENT subject and is deliberately NOT
    // here — it stays in the bank.
    hiddenSubjects: ['anatomy', 'genetics', 'haematology'],
    // The finished size of the bank, for PLANNING. The upload is still in
    // progress, so pacing against today's partial bank would promise a finish
    // in a week. null means "no known final size — plan against whatever is
    // actually there", which is what a bank still being built needs.
    targetTotal: 3659,
  },
  {
    id: 'saudi_mle',
    label: 'Saudi MLE',
    icon: '📗',
    route: '/saudi-mle',
    tagline: 'Work the Saudi Medical Licensing Exam bank down, at your own pace.',
    paceScope: '__saudi_mle__',
    accentRgb: '22, 137, 90',    // Saudi green
    activityMode: 'saudi_mle_practice',
    // No published total for this bank yet, so the plan tracks the live count
    // and grows as questions are added.
    targetTotal: null,
  },
  {
    id: 'ore_lds',
    label: 'ORE / LDS',
    icon: '🦷',
    route: '/ore-lds',
    tagline: 'Work the ORE and LDS dental bank down, at your own pace.',
    paceScope: '__ore_lds__',
    accentRgb: '0, 150, 170',    // dental teal
    activityMode: 'ore_lds_practice',
    // No published total yet: the plan tracks the live count and grows as
    // questions are added, the way Saudi MLE started.
    targetTotal: null,
  },
  {
    id: 'mehlman_rapid_fire',
    label: 'Mehlman Rapid Fire',
    icon: '⚡',
    route: '/mehlman-rapid-fire',
    tagline: 'Mehlman\u2019s high-yield facts, fired at you one after another.',
    paceScope: '__mehlman_rapid_fire__',
    accentRgb: '226, 170, 32',   // rapid-fire yellow
    // Rapid fire means rapid: 30 seconds a question instead of the exam skin's
    // 70, and 30 on the explanation instead of 75. The name is a promise about
    // the pace, and Mehlman's facts are short enough both ways — a minute and
    // a half either side would make it the same mode in a different colour.
    questionSeconds: 30,
    explanationSeconds: 30,
    // Rapid fire is the one bank where being stuck on a question is the
    // wrong outcome: the pace IS the exercise, and the alternatives were
    // guessing — which marks a fact you have never met as seen and scores it
    // wrong — or sitting out thirty seconds you came here not to spend.
    // Skipping passes it over without answering, so it is neither scored nor
    // counted as met and comes round again in a later set.
    allowSkip: true,
    activityMode: 'mehlman_rapid_fire_practice',
    // No published total: the plan tracks the live count and grows as questions
    // are added, the way Saudi MLE and ORE / LDS started.
    targetTotal: null,
  },
  {
    id: 'clinical',
    label: 'Clinical',
    icon: '🩺',
    route: '/clinical',
    tagline: 'The procedures a doctor is expected to be able to do, one at a time.',
    paceScope: '__clinical__',
    // Clinical white. Every hue Story Mode had was already spoken for — red,
    // amber, blue, green, teal, yellow, violet, magenta — so this one is told
    // apart by SATURATION rather than hue, which was the only axis left. It
    // suits the subject, and the test below compares it against every other
    // card rather than trusting my eye.
    accentRgb: '201, 214, 226',
    activityMode: 'clinical_practice',
    // Same bargain as the other banks: a procedure you cannot recall is
    // better passed over than guessed at.
    allowSkip: true,
    // No published total: the plan tracks the live count and grows as
    // procedures are added, the way every bank after UWorld started.
    targetTotal: null,
  },
  {
    id: 'oet',
    label: 'OET',
    icon: '\u{1f1ec}\u{1f1e7}',
    route: '/oet',
    tagline: 'The Occupational English Test, worked through at your own pace.',
    paceScope: '__oet__',
    accentRgb: '214, 72, 142',    // OET magenta
    activityMode: 'oet_practice',
    // No published total: the plan tracks the live count and grows as
    // questions are added, the way every bank after UWorld started.
    targetTotal: null,
  },
];

export const DEFAULT_QUESTION_BANK_MODE = QUESTION_BANK_MODES[0];

export const questionBankMode = (id) =>
  QUESTION_BANK_MODES.find(m => m.id === id) || DEFAULT_QUESTION_BANK_MODE;

export const QUESTION_BANK_MODE_IDS = QUESTION_BANK_MODES.map(m => m.id);
