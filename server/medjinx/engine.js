'use strict';

/**
 * MedJinx — answer matching and scoring.
 *
 * Pure functions, no sockets and no timers: everything here can be run from
 * a script (see check.js) against the bank without starting a server.
 *
 * The rule the whole file exists to keep: points are only ever paid for an
 * answer that a human wrote into the bank. Nothing here judges medicine. A
 * typed answer is normalised, then matched against the bank's accepted
 * answers and its known-wrong ones ("traps"); anything that matches neither
 * is `unknown`, scores nothing, and is logged for a person to review.
 */

// ── Tiers ────────────────────────────────────────────────────────────────────

const TIERS = [
  { tier: 1, key: 'common',     name: 'Common',     points: 1000 },
  { tier: 2, key: 'recognised', name: 'Recognised', points: 2000 },
  { tier: 3, key: 'specific',   name: 'Specific',   points: 4000 },
  { tier: 4, key: 'advanced',   name: 'Advanced',   points: 6000 },
  { tier: 5, key: 'rare',       name: 'Rare',       points: 8000 },
];
const TIER_POINTS = Object.fromEntries(TIERS.map(t => [t.tier, t.points]));

const CATEGORIES = {
  diagnosis: 'Diagnosis',
  clinical:  'Clinical manifestations',
  cause:     'Causes & risk factors',
  patho:     'Pathophysiology',
  histo:     'Histology',
  labs:      'Labs, biochemistry & imaging',
  genetics:  'Genetics',
  immuno:    'Immunology',
  pharm:     'Pharmacology',
  comp:      'Complications',
  assoc:     'Associations',
};

// ── Normalising ──────────────────────────────────────────────────────────────

// British → American, so "anaemia" and "anemia" are one answer. Applied to
// the whole string before it is split into words.
const SPELLING = [
  [/aemi/g, 'emi'], [/haem/g, 'hem'], [/oedem/g, 'edem'], [/oesophag/g, 'esophag'],
  [/oestr/g, 'estr'], [/foet/g, 'fet'], [/faec/g, 'fec'], [/paed/g, 'ped'],
  [/coeliac/g, 'celiac'], [/diarrhoea/g, 'diarrhea'], [/leuc/g, 'leuk'],
  [/tumour/g, 'tumor'], [/colour/g, 'color'], [/centre/g, 'center'],
  [/fibre/g, 'fiber'], [/litre/g, 'liter'], [/gynaec/g, 'gynec'],
  [/orrhoea/g, 'orrhea'], [/pnoea/g, 'pnea'], [/caecum/g, 'cecum'],
  [/ischaem/g, 'ischem'], [/isation/g, 'ization'],
  [/sulph/g, 'sulf'], [/aetiolog/g, 'etiolog'], [/anaesth/g, 'anesth'],
  [/glycaem/g, 'glycem'], [/kalaem/g, 'kalem'], [/natraem/g, 'natrem'],
  [/calcaem/g, 'calcem'], [/uraem/g, 'urem'], [/lipidaem/g, 'lipidem'],
];

// Plain-English phrases and common abbreviations, folded to the term the
// bank uses. Applied to both the bank and what is typed, so either form of
// an answer matches the other. Whole words only.
const PHRASES = [
  [/\bhigh blood pressure\b/g, 'hypertension'], [/\blow blood pressure\b/g, 'hypotension'],
  [/\bhigh blood sugar\b/g, 'hyperglycemia'], [/\blow blood sugar\b/g, 'hypoglycemia'],
  [/\b(fast|rapid) heart ?(rate|beat)\b/g, 'tachycardia'], [/\bslow heart ?(rate|beat)\b/g, 'bradycardia'],
  [/\bheart attack\b/g, 'myocardial infarction'], [/\bshortness of breath\b/g, 'dyspnea'],
  [/\bbreathlessness\b/g, 'dyspnea'], [/\btiredness\b/g, 'fatigue'], [/\bkidneys?\b/g, 'renal'],
];
const ABBREV = {
  htn: ['hypertension'], dm: ['diabetes', 'mellitus'], mi: ['myocardial', 'infarction'],
  chf: ['heart', 'failure'], hf: ['heart', 'failure'], ckd: ['chronic', 'renal', 'disease'],
  aki: ['acute', 'renal', 'injury'], afib: ['atrial', 'fibrillation'], copd: ['chronic', 'obstructive', 'pulmonary', 'disease'],
  dvt: ['deep', 'vein', 'thrombosis'], uti: ['urinary', 'tract', 'infection'], sob: ['dyspnea'],
  dka: ['diabetic', 'ketoacidosis'], gerd: ['gastroesophageal', 'reflux', 'disease'], ibd: ['inflammatory', 'bowel', 'disease'],
};

// Words that say which way a value went. All of one direction collapse to a
// single token, so "raised TSH", "elevated TSH", "↑TSH" and "high TSH" match.
const UP = new Set(['high', 'higher', 'elevated', 'elevation', 'increased', 'increase',
  'increases', 'raised', 'rise', 'rising', 'excess', 'excessive']);
// ("down" is not one of them: Down syndrome.)
const DOWN = new Set(['low', 'lower', 'decreased', 'decrease', 'decreases', 'reduced',
  'reduction', 'reduce', 'diminished', 'depressed', 'deficient']);

// Words that carry no meaning in an association list.
// ("a" is not one of them: vitamin A, hepatitis A and haemophilia A are answers.)
const STOP = new Set(['the', 'an', 'of', 'in', 'on', 'to', 'and', 'with', 'for', 'by',
  'level', 'serum', 'blood', 'plasma', 'is', 'are', 'due', 'from', 'at',
  'positive', 'present', 'presence', 'caused', 'causing', 'associated', 'seen', 'which', 'that', 'very']);

// Generic words a player may add or leave off without changing the answer
// ("Cushing syndrome" / "Cushing"; "Graves disease" / "Graves"). Dropped only
// for a second, looser lookup, never from the exact one.
const SOFT = new Set(['syndrome', 'disease', 'disorder', 'condition']);

// The only words allowed around a bank answer (step 4 of matchAnswer):
// fillers that carry no medical meaning. Anything else ("low", "non", "C4")
// can change what the answer means, so it blocks the match.
const FILLER = new Set(['lab', 'labs', 'test', 'tests', 'add', 'use', 'using', 'give', 'given',
  'may', 'can', 'often', 'usually', 'typical', 'typically', 'classic', 'classically', 'common',
  'commonly', 'also', 'both', 'rx', 'tx', 'drug', 'see', 'show', 'shows', 'showing', 'like']);

// A typed answer that negates something is never matched loosely onto an
// entry that does not ("no fever" is not "fever").
const NEG = new Set(['no', 'not', 'without', 'absent', 'absence', 'never', 'negative', 'normal', 'lack', 'none']);

function singular(w) {
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (/(ss|us|is|as|os)$/.test(w)) return w;
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

function tokens(raw) {
  let s = String(raw || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')   // Hürthle → Hurthle
    .toLowerCase()
    .replace(/[↑⬆]/g, ' high ')                 // ↑
    .replace(/[↓⬇]/g, ' low ')                  // ↓
    .replace(/α/g, ' alpha ').replace(/β/g, ' beta ')
    .replace(/γ/g, ' gamma ').replace(/δ/g, ' delta ')
    .replace(/[‘’']s\b/g, '')                   // Graves' / Crohn's
    .replace(/[‘’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    // "T 4", "IL 6", "HLA DR 3" → "t4", "il6", "hla dr3"
    .replace(/\b([a-z]{1,3}) (\d{1,2})\b/g, '$1$2')
    .trim();
  for (const [re, to] of SPELLING) s = s.replace(re, to);
  for (const [re, to] of PHRASES) s = s.replace(re, to);

  let out = s.split(/\s+/).filter(Boolean).flatMap(w => ABBREV[w] || [w]).map((w) => {
    if (UP.has(w)) return 'high';
    if (DOWN.has(w)) return 'low';
    if (w === 'abs' || w === 'ab' || w === 'autoantibody' || w === 'autoantibodies') return 'antibody';
    return singular(w);
  }).filter(w => !STOP.has(w));

  // One spelling for an antibody, however it was typed: "anti-TPO",
  // "antiTPO antibodies" and "TPO antibodies" all become [anti, tpo].
  out = out.flatMap(w => (
    w.startsWith('anti') && w.length > 6 && w !== 'antibody' && w !== 'antigen'
      ? ['anti', w.slice(4)]
      : [w]
  ));
  if (out.includes('antibody') && out.length > 1) {
    out = out.filter(w => w !== 'antibody');
    if (!out.includes('anti')) out.unshift('anti');
  }
  return out;
}

/** The two forms an answer is indexed under: as typed, and order-free. */
function keysOf(raw) {
  const t = tokens(raw);
  if (!t.length) return null;
  const soft = t.filter(w => !SOFT.has(w));
  return {
    plain: t.join(' '), sorted: [...t].sort().join(' '), toks: t,
    loose: soft.length && soft.length < t.length ? [...soft].sort().join(' ') : null,
  };
}

// ── Fuzzy matching ───────────────────────────────────────────────────────────

// Optimal string alignment distance (Levenshtein + adjacent transposition),
// abandoned early once it cannot come in under `max`.
function distance(a, b, max) {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev2 = null;
  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[lb];
}

function allowance(len) {
  if (len <= 4) return 0;
  if (len <= 7) return 1;
  if (len <= 14) return 2;
  return 3;
}

/**
 * The parts of an answer a typo must never be allowed to change.
 *
 * "hypothyroidism" and "hyperthyroidism" are two edits apart, and so are
 * "T3" and "T4" — close enough for a spelling tolerance to call them the
 * same word, and opposite in meaning. Two strings may only fuzzy-match when
 * these signatures are identical.
 */
const GUARD = /\d+|hyper|hypo|high|low|anti|non|brady|tachy|macro|micro|intra|inter|extra|pre|post|alpha|beta|gamma|delta|poly|olig|acid|alkal|ase\b|osis\b|itis\b|oma\b|emia\b|uria\b/g;
function guard(s) {
  return (s.match(GUARD) || []).sort().join('|');
}

// Per word, the guard splits in two. The PREFIX part (hyper/hypo, high/low,
// numbers...) must always agree. The SUFFIX part (-itis/-osis/-emia...) must
// agree only when both words still have a recognisable ending: a misspelt
// "hypokalimia" has lost its "-emia" and should still be read as
// hypokalemia, while "nephritis" and "nephrosis" stay two different words.
// Read on the folded spelling (see fold), so "bradicardia" still says brady-.
const PREFIX_GUARD = /\d+|hiper|hipo|high|low|anti|non|bradi|tachi|macro|micro|intra|inter|extra|pre|post|alfa|beta|gama|delta|poli|olig|acid|alkal/g;
const SUFFIX_GUARD = /(ase|osis|itis|oma|emia|uria)$/;
const prefixGuard = (w) => (fold(w).match(PREFIX_GUARD) || []).join('|');

// Spellings that sound the same: ph/f, ae/oe/e, y/i, doubled letters.
function fold(w) {
  return w.replace(/ph/g, 'f').replace(/ae|oe/g, 'e').replace(/(?!^)y/g, 'i').replace(/(.)\1+/g, '$1');
}

// Every word the bank uses anywhere. A typed word that IS one of these is a
// real word the player meant, never a misspelling of a different one:
// "infection" is not a typo of "infarction", nor "hemolytic" of "hepatic".
let VOCAB = null;
function vocabulary() {
  if (VOCAB) return VOCAB;
  VOCAB = new Set();
  try {
    const { TOPICS } = require('./bank');
    const add = (t) => tokens(t).forEach(w => VOCAB.add(w));
    for (const tp of TOPICS) {
      add(tp.title); (tp.dx || []).forEach(add);
      for (const a of tp.answers) { add(a.label); (a.syn || []).forEach(add); }
      for (const tr of tp.traps || []) tr.terms.forEach(add);
    }
  } catch { /* no bank: typo tolerance still works, just without this check */ }
  return VOCAB;
}

// Typo allowance for one word: none for short words, one edit up to nine
// letters, two beyond.
const wordAllowance = (len) => (len <= 5 ? 0 : len <= 9 ? 1 : 2);

/** How far apart two words are as a typo, or Infinity if they are different words. */
function wordDistance(a, b) {
  if (a === b) return 0;
  if (prefixGuard(a) !== prefixGuard(b)) return Infinity;
  const sa = (a.match(SUFFIX_GUARD) || [])[1], sb = (b.match(SUFFIX_GUARD) || [])[1];
  if (sa && sb && sa !== sb) return Infinity;
  const fa = fold(a), fb = fold(b);
  if (fa === fb && Math.min(a.length, b.length) >= 4) return 0.5;
  // A real bank word is a different word, not a typo ("anemia" is not
  // "anomia", "myosin" is not "miosis") — unless it only adds or drops a
  // final s (hashimotos / hashimoto).
  if (vocabulary().has(a)) return Math.min(a.length, b.length) >= 4 && (a === b + 's' || b === a + 's') ? 0.5 : Infinity;
  const max = wordAllowance(b.length);   // sized on the word aimed at
  if (!max || Math.min(a.length, b.length) <= 5) return Infinity;
  if (fa[0] !== fb[0]) return Infinity;                // typos rarely move the first letter
  // Folding can also move a word away ("troponn" folds to "tropon"), so take
  // whichever spelling is closer.
  const d = Math.min(distance(fa, fb, max), distance(a, b, max));
  return d <= max ? d : Infinity;
}

/**
 * Pair each word of `need` with a different word of `have`. Returns the
 * total typo distance, or null if some word has no partner. The lists are
 * short, so a greedy pass in order of closest pair is enough.
 */
function cover(need, have) {
  const pairs = [];
  need.forEach((n, i) => have.forEach((h, j) => {
    const d = wordDistance(h, n);
    if (d !== Infinity) pairs.push([d, i, j]);
  }));
  pairs.sort((x, y) => x[0] - y[0]);
  const usedN = new Set(), usedH = new Set();
  let total = 0;
  for (const [d, i, j] of pairs) {
    if (usedN.has(i) || usedH.has(j)) continue;
    usedN.add(i); usedH.add(j); total += d;
  }
  return usedN.size === need.length ? total : null;
}

// ── Compiling a topic ────────────────────────────────────────────────────────

/**
 * Turn a bank topic into lookup tables.
 *
 * `variant` matters for exactly one thing: the name of the condition. In an
 * open round the name is on the screen, so typing it back is not an answer;
 * in a clinical round working it out from the vignette is the first thing
 * worth points.
 */
function compileTopic(topic, variant = 'open') {
  const answers = [];
  const exact = new Map();     // key → { kind, ref }
  const fuzzy = [];            // { key, kind, ref, g, toks }
  const loose = new Map();     // soft-word-free key -> { kind, ref } | null (ambiguous)
  const problems = [];

  function index(raw, kind, ref) {
    const k = keysOf(raw);
    if (!k) { problems.push(`${topic.id}: "${raw}" normalises to nothing`); return; }
    for (const key of new Set([k.plain, k.sorted])) {
      const had = exact.get(key);
      if (had && (had.kind !== kind || had.ref !== ref)) {
        problems.push(`${topic.id}: "${raw}" collides with ${had.kind} "${had.ref.label || had.ref.terms?.[0]}"`);
        continue;
      }
      if (!had) {
        exact.set(key, { kind, ref });
        if (key === k.plain) fuzzy.push({ key, kind, ref, g: guard(key), toks: k.toks.filter(w => !SOFT.has(w)) });
      }
    }
    if (k.loose) {
      const had = loose.get(k.loose);
      if (had === undefined) loose.set(k.loose, { kind, ref });
      else if (had && had.ref !== ref) loose.set(k.loose, null);
    }
  }

  const dxTerms = [topic.title, ...(topic.dx || [])];
  if (variant === 'clinical') {
    const dx = {
      id: `${topic.id}#dx`, label: topic.title, tier: topic.dxTier || 2, category: 'diagnosis',
      why: topic.dxWhy || `The vignette describes ${topic.title}.`,
    };
    answers.push(dx);
    for (const t of dxTerms) index(t, 'answer', dx);
  } else {
    const self = { terms: dxTerms, self: true, why: 'That is the topic itself — name what goes with it.' };
    for (const t of dxTerms) index(t, 'trap', self);
  }

  topic.answers.forEach((a, i) => {
    const ans = { id: `${topic.id}#${i}`, label: a.label, tier: a.tier, category: a.category, why: a.why };
    answers.push(ans);
    index(a.label, 'answer', ans);
    for (const s of a.syn || []) index(s, 'answer', ans);
  });

  for (const tr of topic.traps || []) {
    const trap = { terms: tr.terms, why: tr.why };
    for (const t of tr.terms) index(t, 'trap', trap);
  }

  // A loose key that is also some entry's exact key belongs to that entry.
  for (const key of [...loose.keys()]) if (exact.has(key)) loose.delete(key);
  return { topic, variant, answers, exact, fuzzy, loose, problems };
}

/**
 * What a typed answer is.
 *   { status: 'accepted', answer }   in the bank
 *   { status: 'trap', why, self }    known to be wrong (or the topic itself)
 *   { status: 'unknown' }            in neither list — no points, logged
 *   { status: 'empty' }
 */
function matchAnswer(compiled, raw) {
  const k = keysOf(raw);
  if (!k) return { status: 'empty' };

  // 1. Exactly as written in the bank (any word order).
  const hit = compiled.exact.get(k.plain) || compiled.exact.get(k.sorted);
  if (hit) return resolve(hit);

  const typed = k.toks.filter(w => !SOFT.has(w));
  if (!typed.length) return { status: 'unknown' };
  const negated = typed.some(w => NEG.has(w));
  const sortedSoft = [...typed].sort().join(' ');

  // 2. The same words once generic ones ("syndrome", "disease") are dropped.
  const lh = compiled.loose.get(sortedSoft) || compiled.exact.get(sortedSoft);
  if (lh) return resolve(lh);

  // 3. The same words, each allowed its own typo. One entry must be clearly
  //    closest: two different entries equally near is no match at all.
  let best = null, bestD = Infinity, tie = false;
  for (const e of compiled.fuzzy) {
    if (e.toks.length !== typed.length || !e.toks.length) continue;
    if (negated !== e.toks.some(w => NEG.has(w))) continue;
    const d = cover(e.toks, typed);
    if (d === null) continue;
    if (d < bestD) { best = e; bestD = d; tie = false; }
    else if (d === bestD && best && e.ref !== best.ref) tie = true;
  }
  if (best && !tie) return resolve(best);
  if (tie) return { status: 'unknown' };

  // 4. A bank answer of two or more words said with one short filler word
  //    around it ("raised TSH on labs"). Kept narrow on purpose: one shared
  //    medical word must never pull in a different condition ("hemolytic
  //    anemia" is not "iron deficiency anemia"), so single-word entries,
  //    long extra words and typos are all excluded here.
  if (!negated) {
    let top = null, topN = 0, topD = Infinity, draw = false;
    for (const e of compiled.fuzzy) {
      const n = e.toks.length;
      if (n < 2 || n >= typed.length || typed.length - n > 1) continue;
      const d = cover(e.toks, typed);
      if (d === null || d > 0.5 * n) continue;           // spelled as in the bank
      const used = new Set(e.toks);
      if (typed.some(w => !used.has(w) && !FILLER.has(w))) continue;
      if (d === null) continue;
      if (n > topN || (n === topN && d < topD)) { top = e; topN = n; topD = d; draw = false; }
      else if (n === topN && d === topD && top && e.ref !== top.ref) draw = true;
    }
    if (top && !draw) return resolve(top);
  }
  return { status: 'unknown' };

  function resolve(e) {
    if (e.kind === 'answer') return { status: 'accepted', answer: e.ref };
    return { status: 'trap', why: e.ref.why, self: Boolean(e.ref.self) };
  }
}

// ── Scoring a round ──────────────────────────────────────────────────────────

const EVENTS = {
  double:  { id: 'double',  name: 'Double Points',   blurb: 'Every accepted answer is worth double.' },
  rare:    { id: 'rare',    name: 'Rare Knowledge',  blurb: 'Only Advanced and Rare answers score.' },
  rapid:   { id: 'rapid',   name: 'Rapid Recall',    blurb: 'Fifteen seconds. Go.' },
  reverse: { id: 'reverse', name: 'Reverse Jinx',    blurb: 'The tiers are flipped: the obvious answers pay the most.' },
  boss:    { id: 'boss',    name: 'Boss Case',       blurb: 'A hard vignette, and everything on it pays one and a half times.' },
  streak:  { id: 'streak',  name: 'Streak Round',    blurb: 'Your multiplier grows with every round in a row you found a Specific-or-better answer.' },
};

/** What one accepted answer is worth this round, before it is shared out. */
function answerValue(tier, eventId) {
  if (eventId === 'reverse') return TIER_POINTS[6 - tier];
  if (eventId === 'rare') return tier >= 4 ? TIER_POINTS[tier] : 0;
  let v = TIER_POINTS[tier];
  if (eventId === 'double') v *= 2;
  if (eventId === 'boss') v = Math.round(v * 1.5);
  return v;
}

/**
 * Score a finished round.
 *
 * found:   Map(playerId → Map(answerId → typed text))
 * streaks: Map(playerId → rounds in a row with a tier ≥3 find) — read only
 *          for the Streak Round, where it becomes a multiplier.
 *
 * An answer's value is split evenly between everyone who found it: that is
 * the jinx. Returns per-answer finders and per-player totals.
 */
function scoreRound(compiled, found, eventId = null, streaks = new Map()) {
  const finders = new Map(compiled.answers.map(a => [a.id, []]));
  for (const [pid, mine] of found) {
    for (const id of mine.keys()) finders.get(id)?.push(pid);
  }

  const players = new Map();
  for (const pid of found.keys()) {
    players.set(pid, { points: 0, accepted: 0, unique: 0, bestTier: 0, rarest: null, multiplier: 1 });
  }

  const perAnswer = compiled.answers.map((a) => {
    const who = finders.get(a.id);
    const value = answerValue(a.tier, eventId);
    const each = who.length ? Math.round(value / who.length) : 0;
    for (const pid of who) {
      const p = players.get(pid);
      p.accepted += 1;
      if (who.length === 1) p.unique += 1;
      if (a.tier > p.bestTier) { p.bestTier = a.tier; p.rarest = a.label; }
      p.points += each;
    }
    return { ...a, value, each, finders: who };
  });

  if (eventId === 'streak') {
    for (const [pid, p] of players) {
      p.multiplier = Math.min(2, 1 + 0.25 * (streaks.get(pid) || 0));
      p.points = Math.round(p.points * p.multiplier);
    }
  }

  return { perAnswer, players };
}

module.exports = {
  TIERS, TIER_POINTS, CATEGORIES, EVENTS,
  tokens, keysOf, distance, guard,
  compileTopic, matchAnswer, answerValue, scoreRound,
};
