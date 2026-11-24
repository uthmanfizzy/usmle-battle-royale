import PART1 from './cases1';
import PART2 from './cases2';

/**
 * Kaplan → 100 HY Ethics — "The Ethics Tribunal".
 *
 * Twelve dockets (topics) holding 102 cases, one per practice question in the
 * user's Kaplan "USMLE Medical Ethics: The 100 Cases" book. Every case is an
 * original scenario teaching the same rule (see cases1.js for the format).
 * Run `node tools/kaplan-ethics-check.mjs` after editing.
 */

export const DOCKETS = [
  { id: 'capacity',        name: 'Autonomy & Capacity',   icon: '🗽', hue: '167, 139, 250', blurb: 'Capable refusals, delirium, depression and suicide.' },
  { id: 'consent',         name: 'Informed Consent',      icon: '✍️', hue: '129, 140, 248', blurb: 'Alternatives, refusal, phone consent, emergencies.' },
  { id: 'surrogates',      name: 'Proxies & Surrogates',  icon: '🗝️', hue: '192, 132, 252', blurb: 'Substituted judgment, living wills, split families.' },
  { id: 'minors',          name: 'Minors',                icon: '🧸', hue: '244, 114, 182', blurb: 'Parents, exceptions, emancipation, emergencies.' },
  { id: 'confidentiality', name: 'Confidentiality',       icon: '🔒', hue: '96, 165, 250',  blurb: 'Who may know, warrants, genetics, Tarasoff.' },
  { id: 'records',         name: 'Records & Malpractice', icon: '📁', hue: '45, 212, 191',  blurb: 'Access, corrections, errors and liability.' },
  { id: 'reporting',       name: 'Reporting',             icon: '📣', hue: '251, 146, 60',  blurb: 'Abuse, drivers, reportable disease, TB, torture.' },
  { id: 'hiv',             name: 'HIV & Infection',       icon: '🧬', hue: '248, 113, 113', blurb: 'Testing, partners, colleagues who refuse.' },
  { id: 'reproduction',    name: 'Reproduction & Donation', icon: '🌱', hue: '74, 222, 128', blurb: 'Abortion, sterilization, gametes and organs.' },
  { id: 'endoflife',       name: 'End of Life',           icon: '🕯️', hue: '250, 204, 21',  blurb: 'DNR, brain death, withdrawal, double effect.' },
  { id: 'professionalism', name: 'Professionalism',       icon: '🎓', hue: '232, 176, 75',  blurb: 'Gifts, impaired colleagues, gag rules, romance.' },
  { id: 'research',        name: 'Research & Society',    icon: '🔬', hue: '148, 163, 184', blurb: 'IRBs, consent, prisoners, executions, torture.' },
];

export const CASES = [...PART1, ...PART2];
export const CASES_BY_DOCKET = Object.fromEntries(DOCKETS.map(d => [d.id, CASES.filter(c => c.docket === d.id)]));
export const docketOf = (c) => DOCKETS.find(d => d.id === c.docket) || DOCKETS[0];
