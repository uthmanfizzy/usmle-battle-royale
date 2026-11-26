/**
 * HY Diseases: a case as a plain question-bank vignette, for the "Qbank"
 * style (no animation, no chat bubbles). Built from the same case data as the
 * animated clinic, so every case works in both styles with nothing extra to
 * write.
 *
 *   opening    "A 3-month-old boy is brought to the clinic."
 *   history    third-person lines become reported speech ("His mother says
 *              he is floppy..."); first-person lines are quoted; staff
 *              observations are kept as they are
 *   exam       one "On examination: ..." line
 *   labs       the case's tests, plus the lab-readout close-ups written out
 *              (the animated view shows those as gauges, so "Lactate" alone
 *              would say nothing here)
 */

// Close-ups that are lab readouts: what the gauge says, in words.
const LAB_READING = {
  lowGlucose: ['low', 'with no ketones'],
  lowGlucoseKetones: ['low', 'with ketones'],
  highAmmonia: 'high',
  highLactate: 'high (lactic acidosis)',
  highUrate: 'high',
  highLDL: 'very high',
  highTG: 'very high',
  highCK: 'very high',
  ckFlat: 'lactate does not rise after exercise',
  highPhe: 'high',
  highHcy: 'high',
  highMMA: 'high',
  lowLymph: 'no thymic shadow',
  sweatTest: 'sweat chloride high',
  ptLong: 'prolonged; corrects with vitamin K',
  lowCopper: 'copper and ceruloplasmin low',
  vlcfa: 'very-long-chain fatty acids high',
  phytanic: 'phytanic acid high',
  lowAlbumin: 'low',
  hematuria: '',
  oroticUrine: '',
  reducingSugar: '',
  hemolysis: 'LDH high, haptoglobin low',
  galactose: 'high in blood and urine',
};
// A reading is "value" or [value, extra]: the value is skipped when the
// finding already says it ("Low blood sugar after feeds"); the extra is not.
const SAYS_VALUE = /\b(low|high|raised|rise|rises|positive|prolonged|hypoglyc\w*|very few|blood in)\b/i;
function reading(text, r) {
  const [value, extra] = Array.isArray(r) ? r : [r, ''];
  let out = stripStop(text);
  if (value && !SAYS_VALUE.test(out)) out += `: ${value}`;
  if (extra) out += `, ${extra}`;
  return out;
}

// Picture close-ups whose caption needs the picture's point added.
const PICTURE_ADD = {
  milkyPlasma: 'a creamy layer forms on top',
};

const STAFF = /doctor|nurse|midwife|paramedic|dermatologist/i;
const FIRST_PERSON = /\b(I|I'm|I've)\b|\b(my|me|we|we've|our|us)\b/i;
const RELATION = { mum: 'mother', mom: 'mother', mother: 'mother', dad: 'father', father: 'father', wife: 'wife', husband: 'husband', daughter: 'daughter', son: 'son', aunt: 'aunt', uncle: 'uncle', grandma: 'grandmother', grandad: 'grandfather' };

// Lower-case a sentence's first letter, but not an acronym's (LDL, PT/INR, CGG).
const lowerFirst = (s) => (s.length > 1 && /[a-z]/.test(s[1]) ? s[0].toLowerCase() + s.slice(1) : s);
const stripStop = (s) => s.replace(/[.\s]+$/, '');

function opening(c) {
  const male = c.look?.sex !== 'f';
  const ageClass = c.look?.age || 'adult';
  const rest = (c.who.split(',').slice(1).join(',') || '').trim();
  let age = '';
  const m = rest.match(/(\d+)[ -](day|week|month|year)s?[ -]old/i);
  if (m) age = `${m[1]}-${m[2].toLowerCase()}-old`;
  else if (/newborn/i.test(rest)) age = 'newborn';
  let noun = (rest.match(/\b(boy|girl|man|woman)\b/i) || [])[1];
  if (!noun) {
    const young = /infant|baby|child|toddler|teen/i.test(ageClass) || /day|week|month/.test(age) || age === 'newborn';
    noun = young ? (male ? 'boy' : 'girl') : (male ? 'man' : 'woman');
  }
  noun = noun.toLowerCase();
  const child = noun === 'boy' || noun === 'girl';
  const article = /^[aeiou8]|^1[18]-/.test(age) ? 'An' : 'A';
  const who = age ? `${article} ${age} ${noun}` : `A ${noun}`;
  return { who, rest: ` ${child ? 'is brought to the clinic' : 'comes to the clinic'}.` };
}

function history(c) {
  const male = c.look?.sex !== 'f';
  const pos = male ? 'His' : 'Her';
  const sub = male ? 'He' : 'She';
  const first = c.who.split(',')[0].replace(/^Baby /, '').trim().toLowerCase();
  const out = [];
  // Consecutive lines from the same speaker read as one report.
  const groups = [];
  for (const [who, line] of c.history) {
    const g = groups[groups.length - 1];
    if (g && g.who === who) g.lines.push(line); else groups.push({ who, lines: [line] });
  }
  for (const { who, lines } of groups) {
    const key = who.toLowerCase();
    if (STAFF.test(who)) { out.push(lines.join(' ')); continue; }
    const isPatient = key === first || key.endsWith(` ${first}`) || first.endsWith(key.replace(/^(mr|mrs|ms|dr) /, ''));
    const speaker = isPatient ? sub : RELATION[key] ? `${pos} ${RELATION[key]}` : `${pos} ${key}`;
    const text = lines.join(' ');
    if (!isPatient && !FIRST_PERSON.test(text) && /^(He|She|His|Her)\b/.test(text)) {
      out.push(`${speaker} says ${lowerFirst(text)}`);
    } else {
      out.push(`${speaker} says, “${text}”`);
    }
  }
  return out.join(' ');
}

// "Serum retinol: low" -> { name: 'Serum retinol', value: 'low' }, so the
// result can be shown in bold. A line with no "name:" is all value.
function splitLab(text) {
  const i = text.indexOf(': ');
  if (i < 1 || i > 60) return { name: '', value: text };
  return { name: text.slice(0, i), value: text.slice(i + 2) };
}

/**
 * The vignette's parts, kept apart so the page can bold the clues:
 * { opening: { who, rest }, history, findings[], labs[{ name, value }] }.
 * `stem` is the whole thing as one plain string.
 */
export function textCase(c) {
  const findings = [];
  const labs = [];
  for (const [text, kind] of c.exam) {
    if (kind && kind in LAB_READING) {
      labs.push(reading(text, LAB_READING[kind]));
    } else if (kind && PICTURE_ADD[kind]) {
      findings.push(`${lowerFirst(stripStop(text))}: ${PICTURE_ADD[kind]}`);
    } else {
      findings.push(lowerFirst(stripStop(text)));
    }
  }
  labs.push(...(c.labs || []));
  const open = opening(c);
  const hist = history(c);
  // "On examination:" rather than "Examination shows", since some findings
  // are fragments ("otherwise well and growing").
  const exam = findings.length ? `On examination: ${findings.join('; ')}.` : '';
  return {
    opening: open,
    history: hist,
    findings,
    labs: labs.map(splitLab),
    stem: [open.who + open.rest, hist, exam].filter(Boolean).join(' '),
  };
}
