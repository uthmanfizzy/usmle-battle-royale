import { CONDITIONS, PATTERNS } from './geneticsData';

/**
 * Genetics Roulette — the questions, and the arithmetic behind the risks.
 *
 * Every risk answer is COUNTED from a Punnett square of the two parents'
 * genotypes, never typed. A scenario names the parents (who is affected,
 * who is a carrier), the square is built from their gametes, each of the
 * four children is classified by the inheritance pattern, and the question
 * — "a child", "a son", "a daughter", "an unaffected child" — picks which
 * squares count. So the number on screen and the squares drawn under it can
 * never disagree.
 *
 * Alleles: 'D' disease, 'n' normal. X-linked parents are written with their
 * X alleles and the father's 'Y'.
 */

const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ── Classifying a child ───────────────────────────────────────────────────
/** A child is two alleles: [from mother, from father]. 'Y' marks a son. */
export function classify(pattern, child) {
  const [m, f] = child;
  const son = f === 'Y';
  const d = (son ? [m] : [m, f]).filter(a => a === 'D').length;
  switch (pattern) {
    case 'AD': return { son: null, status: d >= 1 ? 'affected' : 'unaffected', homo: d === 2 };
    case 'AR': return { son: null, status: d === 2 ? 'affected' : d === 1 ? 'carrier' : 'unaffected' };
    case 'XLR': return { son, status: son ? (d ? 'affected' : 'unaffected') : d === 2 ? 'affected' : d === 1 ? 'carrier' : 'unaffected' };
    case 'XLD': return { son, status: d >= 1 ? 'affected' : 'unaffected' };
    default: return { son: null, status: 'unaffected' };
  }
}

// ── Family scenarios, per pattern ────────────────────────────────────────
// mother / father are allele pairs; `who` describes them in words and draws
// them in the pedigree (status: affected | carrier | unaffected).
const SCENARIOS = {
  AD: [
    { mother: ['D', 'n'], father: ['n', 'n'], words: 'An affected (heterozygous) mother and an unaffected father', m: 'affected', f: 'unaffected' },
    { mother: ['n', 'n'], father: ['D', 'n'], words: 'An unaffected mother and an affected (heterozygous) father', m: 'unaffected', f: 'affected' },
    { mother: ['D', 'n'], father: ['D', 'n'], words: 'Two affected (heterozygous) parents', m: 'affected', f: 'affected', homo: true },
  ],
  AR: [
    { mother: ['D', 'n'], father: ['D', 'n'], words: 'Two unaffected carrier parents', m: 'carrier', f: 'carrier' },
    { mother: ['D', 'D'], father: ['D', 'n'], words: 'An affected mother and a carrier father', m: 'affected', f: 'carrier' },
    { mother: ['n', 'n'], father: ['D', 'D'], words: 'A non-carrier mother and an affected father', m: 'unaffected', f: 'affected' },
  ],
  XLR: [
    { mother: ['D', 'n'], father: ['n', 'Y'], words: 'A carrier mother and an unaffected father', m: 'carrier', f: 'unaffected' },
    { mother: ['n', 'n'], father: ['D', 'Y'], words: 'A non-carrier mother and an affected father', m: 'unaffected', f: 'affected' },
  ],
  XLD: [
    { mother: ['n', 'n'], father: ['D', 'Y'], words: 'An unaffected mother and an affected father', m: 'unaffected', f: 'affected' },
    { mother: ['D', 'n'], father: ['n', 'Y'], words: 'An affected (heterozygous) mother and an unaffected father', m: 'affected', f: 'unaffected' },
  ],
};

// What can be asked: which children count, and what about them.
const ASKS = {
  AD: [{ group: 'all', outcome: 'affected', q: 'their next child is affected' }],
  AR: [
    { group: 'all', outcome: 'affected', q: 'their next child is affected' },
    { group: 'all', outcome: 'carrier', q: 'their next child is an unaffected carrier' },
    { group: 'unaffected', outcome: 'carrier', q: 'an UNAFFECTED child of theirs is a carrier', needs: 'carrier' },
  ],
  XLR: [
    { group: 'all', outcome: 'affected', q: 'their next child is affected' },
    { group: 'son', outcome: 'affected', q: 'their next SON is affected' },
    { group: 'daughter', outcome: 'carrier', q: 'their next DAUGHTER is a carrier' },
    { group: 'daughter', outcome: 'affected', q: 'their next DAUGHTER is affected' },
  ],
  XLD: [
    { group: 'daughter', outcome: 'affected', q: 'their next DAUGHTER is affected' },
    { group: 'son', outcome: 'affected', q: 'their next SON is affected' },
    { group: 'all', outcome: 'affected', q: 'their next child is affected' },
  ],
};

const fmtPct = (x) => (Math.abs(x * 3 - 2) < 1e-9 ? '67%' : Math.abs(x * 3 - 1) < 1e-9 ? '33%' : `${Math.round(x * 100)}%`);
const POOL = ['0%', '25%', '33%', '50%', '67%', '75%', '100%'];

/** Build the square and answer the question by counting it. */
export function solveRisk(pattern, sc, ask) {
  const cells = [];
  for (const m of sc.mother) for (const f of sc.father) cells.push({ alleles: [m, f], ...classify(pattern, [m, f]) });
  const inGroup = (c) => ask.group === 'all' ? true
    : ask.group === 'son' ? c.son === true
    : ask.group === 'daughter' ? c.son === false
    : ask.group === 'unaffected' ? c.status !== 'affected'
    : true;
  const group = cells.filter(inGroup);
  const hits = group.filter(c => c.status === ask.outcome);
  return { cells, group, hits, p: group.length ? hits.length / group.length : 0, frac: `${hits.length} of ${group.length}` };
}

function riskStep(cond) {
  const p = cond.pattern;
  if (p === 'MITO') {
    const fromMother = Math.random() < 0.6;
    return {
      id: 'risk', kind: 'mito', fromMother,
      prompt: fromMother
        ? `A woman with ${cond.name} has children. What share of them inherit the mutation?`
        : `A man with ${cond.name} has children with an unaffected woman. What share of them inherit the mutation?`,
      options: shuffle(['0%', '25%', '50%', '100%']), answer: fromMother ? '100%' : '0%',
      working: fromMother
        ? 'Every mitochondrion in a child comes from the EGG, so every child inherits the mother’s mitochondrial DNA. How severely each is affected varies with heteroplasmy.'
        : 'Sperm contribute no mitochondria to the embryo, so a father never passes on mitochondrial DNA.',
      pedigree: { m: fromMother ? 'affected' : 'unaffected', f: fromMother ? 'unaffected' : 'affected' },
    };
  }
  const scs = SCENARIOS[p].filter(s => !(s.homo && cond.noHomozygote));
  let sc = pick(scs);
  let ask = pick(ASKS[p].filter(a => !a.needs || (sc.m === a.needs && sc.f === a.needs)));
  const sol = solveRisk(p, sc, ask);
  const answer = fmtPct(sol.p);
  const others = shuffle(POOL.filter(x => x !== answer));
  // Prefer the classic wrong answers first, then fill.
  const classic = [answer === '67%' ? '50%' : null, answer === '25%' ? '50%' : null, answer === '50%' ? '25%' : null, answer === '100%' ? '50%' : null, answer === '0%' ? '50%' : null].filter(Boolean);
  const opts = [answer];
  for (const o of [...classic, ...others]) { if (opts.length >= 4) break; if (!opts.includes(o)) opts.push(o); }
  return {
    id: 'risk', kind: 'punnett', pattern: p, scenario: sc, ask, sol,
    prompt: `${sc.words}. What is the chance ${ask.q}?`,
    options: shuffle(opts), answer,
    working: `${sol.hits.length} of the ${sol.group.length} ${ask.group === 'son' ? 'sons' : ask.group === 'daughter' ? 'daughters' : ask.group === 'unaffected' ? 'unaffected children' : 'children'} in the square ${ask.outcome === 'carrier' ? (sol.hits.length === 1 ? 'is a carrier' : 'are carriers') : (sol.hits.length === 1 ? 'is affected' : 'are affected')} → ${answer}.`,
    pedigree: { m: sc.m, f: sc.f },
  };
}

function mechStep(cond) {
  const m = cond.mech;
  return {
    id: 'risk', kind: 'mech',
    prompt: `What is the usual mechanism behind ${cond.name}?`,
    options: shuffle([m.answer, ...m.others.map(o => o[0])]), answer: m.answer,
    whyNot: Object.fromEntries(m.others),
    working: m.why,
  };
}

/** The three steps for a condition: pattern, gene, then risk or mechanism. */
export function buildRound(cond) {
  const patternKeys = cond.pattern === 'IMPRINT' || cond.pattern === 'CHROM'
    ? ['CHROM', 'IMPRINT', 'AD', 'AR']
    : shuffle(['AD', 'AR', 'XLR', 'XLD', 'MITO'].filter(k => k !== cond.pattern)).slice(0, 3).concat(cond.pattern);
  const pattern = {
    id: 'pattern', prompt: `How is ${cond.name} inherited?`,
    options: shuffle([...new Set(patternKeys)].map(k => PATTERNS[k].label)), answer: PATTERNS[cond.pattern].label,
  };
  // Gene distractors: others from the SAME pattern first (the hard ones),
  // then anything else.
  const same = shuffle(CONDITIONS.filter(c => c.id !== cond.id && c.pattern === cond.pattern).map(c => c.gene));
  const rest = shuffle(CONDITIONS.filter(c => c.id !== cond.id && c.pattern !== cond.pattern).map(c => c.gene));
  const geneOpts = [cond.gene];
  for (const g of [...same.slice(0, 2), ...rest]) { if (geneOpts.length >= 4) break; if (!geneOpts.includes(g)) geneOpts.push(g); }
  const gene = { id: 'gene', prompt: `Which gene or chromosome is behind ${cond.name}?`, options: shuffle(geneOpts), answer: cond.gene };
  const third = cond.mech ? mechStep(cond) : riskStep(cond);
  return [pattern, gene, third];
}

export const geneOwner = (gene) => CONDITIONS.find(c => c.gene === gene);
