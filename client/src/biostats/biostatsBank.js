import { shuffle } from './biostatsCore';

/**
 * Biostats Lab — the words.
 *
 * The concept questions: study designs, biases, errors and p-values, which
 * test to use, distributions. Each POOL is a set of answers with a one-line
 * definition; each item is a vignette naming one of them. The other options
 * are drawn from the same pool, and each wrong one carries its own
 * definition as the "why not" — so a wrong pick teaches what that answer
 * actually means rather than just "no".
 *
 * `exclude` keeps out an option that would ALSO be right — Berkson bias is a
 * kind of selection bias, so "Selection bias" is never a distractor for it.
 */

// ── Study designs ─────────────────────────────────────────────────────────
export const DESIGNS = {
  caseControl: { label: 'Case–control study', def: 'starts from OUTCOME — people with and without the disease — and looks BACK for exposure. Reports an odds ratio.' },
  prospCohort: { label: 'Prospective cohort study', def: 'starts from EXPOSURE and follows people FORWARD to see who develops the outcome. Reports a relative risk.' },
  retroCohort: { label: 'Retrospective cohort study', def: 'starts from EXPOSURE recorded in the PAST and uses existing records to see who has since developed the outcome. Reports a relative risk.' },
  crossSectional: { label: 'Cross-sectional study', def: 'measures exposure and disease at ONE point in time. Gives prevalence; shows association, not cause.' },
  ecological: { label: 'Ecological study', def: 'compares POPULATIONS, not individuals. Prone to the ecological fallacy.' },
  rct: { label: 'Randomised controlled trial', def: 'RANDOMLY assigns an intervention and compares outcomes — the best design for showing cause.' },
  crossover: { label: 'Crossover study', def: 'gives each subject BOTH treatments in sequence, with a washout between, so each is their own control.' },
  caseSeries: { label: 'Case series', def: 'describes a group of patients with the same condition — no comparison group.' },
  meta: { label: 'Meta-analysis', def: 'POOLS the results of several studies for more power — but cannot fix the biases of the studies it pools.' },
};
const DESIGN_ITEMS = [
  { a: 'caseControl', q: 'Patients with mesothelioma and age-matched controls without it are interviewed about past asbestos exposure.', why: 'Groups are chosen by OUTCOME (mesothelioma or not), then exposure is looked for in the past. The measure is the odds ratio.' },
  { a: 'caseControl', q: 'Forty children with Reye syndrome and 120 children without it are identified, and their parents are asked about aspirin use during recent viral illnesses.', why: 'Chosen by outcome, then asked about past exposure: case–control. Good for RARE diseases.' },
  { a: 'prospCohort', q: 'Five thousand nurses are grouped by whether they smoke and followed for 20 years to see who develops lung cancer.', why: 'Grouped by EXPOSURE (smoking) and followed FORWARD for the outcome: a prospective cohort. The measure is the relative risk.' },
  { a: 'retroCohort', q: 'Using 1990 employment records, workers exposed and unexposed to benzene are identified; their medical records are then searched for leukaemia diagnosed since.', why: 'Grouped by exposure, but both the exposure and the outcome have ALREADY happened and come from records: a retrospective cohort.' },
  { a: 'crossSectional', q: 'On a single day, 2,000 adults complete a survey asking whether they currently have asthma and whether they currently own a pet.', why: 'Exposure and outcome measured at the SAME moment: cross-sectional. It gives prevalence, and cannot say which came first.' },
  { a: 'crossSectional', q: 'Researchers want to know how many people in a city have hypertension right now, so they measure the blood pressure of a random sample of residents this month.', why: 'A snapshot of how common a disease is at one time — the job of a cross-sectional study.' },
  { a: 'ecological', q: 'Lung cancer rates in 30 countries are plotted against each country’s per-capita cigarette sales.', why: 'The unit of analysis is the COUNTRY, not the person: ecological. Concluding that individual smokers get cancer from this would be the ecological fallacy.' },
  { a: 'rct', q: 'Patients with heart failure are randomly assigned, double-blind, to a new drug or placebo and followed for hospital admissions.', why: 'Random assignment of an intervention with a comparison group: an RCT — the gold standard for causation.' },
  { a: 'crossover', q: 'Each patient takes drug A for 6 weeks, has a 2-week washout, then takes drug B for 6 weeks; the order is randomised.', why: 'Every subject receives both treatments in turn, acting as their own control: a crossover study.' },
  { a: 'caseSeries', q: 'A report describes five young men who presented to one hospital with an unusual pneumonia, and their clinical features.', why: 'A description of patients with the same condition and no comparison group: a case series. It generates hypotheses, it does not test them.' },
  { a: 'meta', q: 'Researchers combine the data from 14 published randomised trials of the same drug to estimate its effect more precisely.', why: 'Pooling several studies’ data: a meta-analysis — the top of the evidence pyramid, but only as good as the studies it pools.' },
];

export const PHASES = {
  p1: { label: 'Phase I', def: 'a small number of HEALTHY volunteers — is it safe? Toxicity, pharmacokinetics and pharmacodynamics.' },
  p2: { label: 'Phase II', def: 'a small number of PATIENTS with the disease — does it work? Efficacy, dosing and adverse effects.' },
  p3: { label: 'Phase III', def: 'a LARGE number of patients, randomised against standard care or placebo — is it better than what we have?' },
  p4: { label: 'Phase IV', def: 'POST-MARKETING surveillance after approval — rare and long-term adverse effects.' },
};
const PHASE_ITEMS = [
  { a: 'p1', q: 'A new molecule is given to 30 healthy volunteers in rising doses to find its half-life and maximum tolerated dose.', why: 'Healthy volunteers, safety and pharmacokinetics: Phase I.' },
  { a: 'p2', q: 'A new drug is given to 150 patients with rheumatoid arthritis to see whether it reduces joint swelling and which dose works best.', why: 'Patients with the disease, efficacy and dose-finding: Phase II.' },
  { a: 'p3', q: 'Four thousand patients with type 2 diabetes are randomised to a new drug or the current standard of care.', why: 'Large, randomised, compared with current treatment: Phase III. Success here leads to approval.' },
  { a: 'p4', q: 'Two years after approval, reports of a rare liver injury in patients taking a new drug are collected and analysed.', why: 'After approval, looking for rare or long-term effects: Phase IV — post-marketing surveillance.' },
];

// ── Biases ────────────────────────────────────────────────────────────────
export const BIASES = {
  selection: { label: 'Selection bias', def: 'non-random sampling or treatment allocation, so the groups differ from the start. Reduced by randomisation.' },
  berkson: { label: 'Berkson bias', def: 'controls taken from HOSPITALISED patients, who differ from the general population.' },
  healthyWorker: { label: 'Healthy worker effect', def: 'working populations are healthier than the general population they are compared with.' },
  nonresponse: { label: 'Non-response bias', def: 'people who do not take part differ from those who do.' },
  attrition: { label: 'Attrition bias', def: 'losses to follow-up differ between the groups. Reduced by intention-to-treat analysis.' },
  recall: { label: 'Recall bias', def: 'people with the outcome remember (and report) past exposures differently. Common in case–control studies.' },
  hawthorne: { label: 'Hawthorne effect', def: 'subjects CHANGE their behaviour because they know they are being studied.' },
  pygmalion: { label: 'Observer-expectancy (Pygmalion) bias', def: 'the RESEARCHER’S belief in the result influences how outcomes are judged. Reduced by blinding.' },
  procedure: { label: 'Procedure bias', def: 'the groups are not TREATED alike apart from the intervention. Reduced by blinding and placebo.' },
  leadTime: { label: 'Lead-time bias', def: 'earlier DIAGNOSIS makes survival look longer although death comes no later. Measure mortality, not survival from diagnosis.' },
  lengthTime: { label: 'Length-time bias', def: 'screening picks up SLOW-growing disease more often, which carries a better prognosis anyway.' },
  confounding: { label: 'Confounding', def: 'a THIRD factor linked to both the exposure and the outcome explains the association. Reduced by randomisation, matching, stratification.' },
  effectMod: { label: 'Effect modification', def: 'the exposure’s effect GENUINELY differs between subgroups — a real finding, not a bias to remove.' },
};
const SELECTION_KIDS = ['berkson', 'healthyWorker', 'nonresponse', 'attrition'];
const BIAS_ITEMS = [
  { a: 'berkson', q: 'A case–control study of pancreatic cancer and coffee uses patients admitted to the same hospital for other conditions as its controls.', why: 'Hospital controls are not like the general population — many have illnesses linked to the exposure. Berkson bias, a form of selection bias.', exclude: ['selection'] },
  { a: 'recall', q: 'Mothers of babies born with a heart defect report more medication use in early pregnancy than mothers of healthy babies, though prescription records show no difference.', why: 'Having an affected child makes a mother search her memory harder: recall bias. Checking records instead of memory reduces it.' },
  { a: 'healthyWorker', q: 'An occupational study finds that miners have LOWER all-cause mortality than the general population.', why: 'People ill enough not to work are not in the workforce — workers start healthier. The healthy worker effect, a form of selection bias.', exclude: ['selection'] },
  { a: 'hawthorne', q: 'Clinic staff wash their hands far more often during the two weeks an infection-control team is visibly observing them.', why: 'The SUBJECTS change because they are watched: the Hawthorne effect.' },
  { a: 'pygmalion', q: 'An unblinded investigator who developed a new antidepressant rates patients on it as more improved than patients on placebo.', why: 'The RESEARCHER’S expectation colours the measurement: observer-expectancy (Pygmalion) bias. Blinding the assessor prevents it.' },
  { a: 'leadTime', q: 'A new screening test detects lung cancer 2 years earlier. Five-year survival from diagnosis rises, but the age at death is unchanged.', why: 'Diagnosis moved earlier, death did not — the extra “survival” is only lead time. Compare mortality rates instead.' },
  { a: 'lengthTime', q: 'Cancers found by annual screening have a better prognosis than those found between screens, because slow-growing tumours spend longer in the detectable window.', why: 'Screening preferentially catches indolent disease: length-time bias.' },
  { a: 'attrition', q: 'In a weight-loss trial, 40% of the drug arm drop out because of side effects, and only those who completed the trial are analysed.', why: 'Differential loss to follow-up distorts the groups: attrition bias. Intention-to-treat analysis guards against it.', exclude: ['selection'] },
  { a: 'nonresponse', q: 'A postal survey on alcohol use gets replies from 30% of those sent it; heavy drinkers were least likely to reply.', why: 'Those who did not respond differ from those who did: non-response bias.', exclude: ['selection'] },
  { a: 'confounding', q: 'Coffee drinkers are found to have more lung cancer — but coffee drinkers in the study are also far more likely to smoke.', why: 'Smoking is linked to both coffee drinking and lung cancer: a confounder. Stratifying by smoking would make the association disappear.' },
  { a: 'effectMod', q: 'A drug lowers stroke risk by 40% in men but has no effect in women, and the difference holds up in repeated analyses.', why: 'The effect itself differs by sex — effect modification. Unlike confounding, stratifying REVEALS it rather than removing it.' },
  { a: 'procedure', q: 'Patients in the surgical arm of a trial are seen weekly in a specialist clinic with extra physiotherapy; the medical arm gets routine follow-up.', why: 'The groups were treated differently beyond the intervention itself: procedure bias.' },
  { a: 'selection', q: 'In a non-randomised study, surgeons choose which patients get a new operation — and they pick the fittest.', why: 'Allocation was not random, so the groups differed before treatment: selection bias. Randomisation prevents it.', exclude: SELECTION_KIDS },
];

// ── Errors, p-values and power ────────────────────────────────────────────
export const ERRORS = {
  t1: { label: 'Type I error (α)', def: 'a FALSE POSITIVE — concluding there is an effect when there is none.' },
  t2: { label: 'Type II error (β)', def: 'a FALSE NEGATIVE — missing an effect that really exists.' },
  power: { label: 'Power (1 − β)', def: 'the probability of finding an effect when one truly exists.' },
  correct: { label: 'No error — a correct conclusion', def: 'the study’s conclusion matches the truth.' },
};
const ERROR_ITEMS = [
  { a: 't1', q: 'A trial concludes that a new drug lowers blood pressure (p = 0.04). Larger later trials show it has no effect at all.', why: 'Rejecting a null hypothesis that was true — a false positive: type I error. Its probability is α.' },
  { a: 't2', q: 'A small trial of 20 patients finds no difference between drug and placebo (p = 0.30). A later trial of 5,000 shows the drug clearly works.', why: 'Failing to reject a null hypothesis that was false — a false negative: type II error. Small samples make it likely.' },
  { a: 'power', q: 'Before a trial begins, the statistician calculates the probability that the trial will detect a 10 mmHg difference if it truly exists.', why: 'The chance of detecting a real effect is power, 1 − β.' },
  { a: 't1', q: 'A study tests 20 different outcomes, each at α = 0.05, and reports the one that reached p = 0.04.', why: 'With 20 tests at α = 0.05, one “significant” result is expected by chance alone: multiple comparisons inflate type I error.' },
  { a: 'correct', q: 'A trial of an inert sugar pill finds no difference from placebo (p = 0.62).', why: 'The null hypothesis was true and was not rejected — the right conclusion. No error.' },
];

export const P_ITEMS = [
  { q: 'A trial reports p = 0.03 for the difference between drug and placebo. What does this mean?',
    answer: 'If there were truly no difference, a result this extreme would occur 3% of the time by chance',
    others: [
      ['There is a 3% chance that the null hypothesis is true', 'The p-value assumes the null is true — it cannot give the probability that it IS true.'],
      ['There is a 97% chance the drug works', 'A p-value is not the probability that the treatment works.'],
      ['The drug’s effect is clinically important', 'Statistical significance says nothing about the SIZE of the effect.'],
    ],
    why: 'The p-value is the probability of a result at least this extreme IF the null hypothesis were true.' },
  { q: 'Which change INCREASES the power of a study?',
    answer: 'Enrolling more patients',
    others: [
      ['Lowering α from 0.05 to 0.01', 'A stricter α makes it harder to reject the null, so power FALLS (β rises).'],
      ['Looking for a smaller difference between groups', 'Smaller effects are harder to detect — power falls.'],
      ['Using a less precise measurement', 'More variability (noise) hides real differences — power falls.'],
    ],
    why: 'Power rises with sample size, effect size and α, and falls with measurement variability. Sample size is the one the investigator controls.' },
  { q: 'The investigators lower α from 0.05 to 0.01. What happens to the chance of a type II error?',
    answer: 'It increases',
    others: [
      ['It decreases', 'Lowering α makes a false positive less likely but a false negative MORE likely.'],
      ['It does not change', 'α and β trade off: tightening one loosens the other at a fixed sample size.'],
      ['It becomes 0.99', 'β is not 1 − α; it depends on sample size, effect size and variability.'],
    ],
    why: 'At a fixed sample size, α and β move in opposite directions. Only a bigger sample lowers both.' },
  { q: 'Two groups’ mean cholesterol levels have 95% confidence intervals that do NOT overlap. What can be concluded?',
    answer: 'The difference between the means is statistically significant',
    others: [
      ['The difference is not significant', 'Non-overlapping 95% CIs mean the difference IS significant at p < 0.05.'],
      ['Nothing without the p-value', 'Non-overlapping CIs are enough to call the difference significant.'],
      ['The difference is clinically important', 'Significance is not the same as clinical importance.'],
    ],
    why: 'If two 95% CIs do not overlap, the means differ significantly. (If they DO overlap, the difference may or may not be significant.)' },
  { q: 'Which change makes a 95% confidence interval NARROWER?',
    answer: 'A larger sample size',
    others: [
      ['Raising the confidence level to 99%', 'More confidence needs a WIDER interval (Z of 2.58 instead of 1.96).'],
      ['A larger standard deviation', 'More spread widens the interval.'],
      ['A smaller sample size', 'Fewer subjects means a larger standard error and a wider interval.'],
    ],
    why: 'CI = mean ± Z × SEM, and SEM = σ ÷ √n. A bigger n shrinks the SEM and the interval.' },
  { q: 'A study enrols 25 patients; the standard deviation of their blood pressure is 10 mmHg. What is the standard error of the mean?',
    answer: '2 mmHg',
    others: [
      ['10 mmHg', 'That is the standard deviation — the spread of individuals, not the precision of the mean.'],
      ['0.4 mmHg', 'That divides by n, not √n.'],
      ['50 mmHg', 'The SEM is the SD DIVIDED by √n, not multiplied.'],
    ],
    why: 'SEM = σ ÷ √n = 10 ÷ √25 = 10 ÷ 5 = 2 mmHg. It shrinks as the sample grows.' },
];

// ── Choosing the statistical test ─────────────────────────────────────────
export const TESTS = {
  tTest: { label: 'Two-sample t-test', def: 'compares the MEANS of TWO independent groups.' },
  paired: { label: 'Paired t-test', def: 'compares two means in the SAME subjects (before/after) or matched pairs.' },
  anova: { label: 'ANOVA', def: 'compares the MEANS of THREE or more groups.' },
  chi: { label: 'Chi-square (χ²) test', def: 'compares PROPORTIONS of categorical outcomes between groups.' },
  fisher: { label: 'Fisher exact test', def: 'compares proportions when the sample is SMALL (expected counts < 5).' },
  pearson: { label: 'Pearson correlation', def: 'measures the linear association between TWO CONTINUOUS variables (r, −1 to +1).' },
};
const TEST_ITEMS = [
  { a: 'tTest', q: 'Mean HbA1c is compared between 200 patients on a new drug and 200 on placebo.', why: 'A continuous outcome (a mean) in TWO independent groups: two-sample t-test.' },
  { a: 'tTest', q: 'Mean height is compared between men and women in a sample of medical students.', why: 'Two independent groups, one continuous outcome: t-test.' },
  { a: 'paired', q: 'Systolic blood pressure is measured in the same 40 patients before and after 8 weeks of a new drug.', why: 'Same subjects measured twice: paired t-test.' },
  { a: 'anova', q: 'Mean LDL cholesterol is compared across four groups on four different diets.', why: 'Means in THREE or more groups: ANOVA (analysis of variance).' },
  { a: 'anova', q: 'Mean pain scores are compared between patients given drug A, drug B or placebo.', why: 'Three groups’ means: ANOVA. Running repeated t-tests instead would inflate the type I error.' },
  { a: 'chi', q: 'The proportion of smokers and non-smokers who develop COPD (yes or no) is compared in a cohort of 3,000.', why: 'A categorical outcome (yes/no) compared between groups, with a large sample: chi-square.' },
  { a: 'chi', q: 'Researchers compare the distribution of blood groups (A, B, AB, O) between patients with and without gastric cancer.', why: 'Categories compared between groups: chi-square.' },
  { a: 'fisher', q: 'Twelve patients receive a drug or placebo and the number who recover (yes or no) is compared; some cells have only 1 or 2 patients.', why: 'Categorical outcome with a SMALL sample (expected counts < 5): Fisher exact test.' },
  { a: 'pearson', q: 'Researchers measure BMI and systolic blood pressure in 500 adults and ask how closely the two move together.', why: 'Two CONTINUOUS variables in the same people: Pearson correlation.' },
];

// ── Distributions and measurement ─────────────────────────────────────────
export const SHAPE_ITEMS = [
  { q: 'Household income in a city has a long tail to the RIGHT. Which is the correct order?',
    answer: 'Mean > median > mode',
    others: [['Mode > median > mean', 'That order belongs to a NEGATIVE (left) skew.'], ['Mean = median = mode', 'Only in a symmetric (normal) distribution.'], ['Median > mean > mode', 'The median always sits between the mean and the mode.']],
    why: 'Positive (right) skew: the tail drags the MEAN furthest toward it. Mean > median > mode — the mean chases the tail.', skew: 1 },
  { q: 'Age at death in a wealthy country has a long tail to the LEFT. Which is the correct order?',
    answer: 'Mean < median < mode',
    others: [['Mean > median > mode', 'That order belongs to a POSITIVE (right) skew.'], ['Mean = median = mode', 'Only in a symmetric (normal) distribution.'], ['Median < mean < mode', 'The median always sits between the mean and the mode.']],
    why: 'Negative (left) skew: the tail pulls the mean down. Mean < median < mode — the mean chases the tail.', skew: -1 },
  { q: 'In a normal distribution, how do the mean, median and mode relate?',
    answer: 'They are all equal',
    others: [['Mean > median > mode', 'That is a right-skewed distribution.'], ['Mean < median < mode', 'That is a left-skewed distribution.'], ['Only the mean and median are equal', 'In a normal curve the peak (mode) sits there too.']],
    why: 'A normal curve is symmetric and has one peak, so mean = median = mode.', skew: 0 },
  { q: 'Which measure of central tendency is LEAST affected by an extreme outlier?',
    answer: 'The median',
    others: [['The mean', 'The mean is pulled toward outliers.'], ['The standard deviation', 'That is a measure of spread, not of central tendency — and outliers inflate it.'], ['The range', 'The range is a measure of spread, and depends entirely on the extremes.']],
    why: 'The median is the middle value; changing the largest value to something enormous does not move it.', skew: 1 },
];
export const MEASURE_ITEMS = [
  { q: 'A scale gives readings of 70.1, 70.2 and 70.1 kg for a patient who truly weighs 75 kg. The scale is…',
    answer: 'Precise but not accurate',
    others: [['Accurate but not precise', 'The readings agree closely (precise) but are far from the true value.'], ['Both precise and accurate', 'Precise yes — but 5 kg from the truth is not accurate.'], ['Neither precise nor accurate', 'The readings are tightly clustered, so it is precise.']],
    why: 'Precision = reliability: repeated readings agree. Accuracy = validity: readings are close to the truth. Random error reduces precision; systematic error reduces accuracy.', target: 'precise' },
  { q: 'Repeated blood glucose readings of 82, 101 and 96 mg/dL in a patient whose true value is 93 mg/dL average out close to the truth. The meter is…',
    answer: 'Accurate but not precise',
    others: [['Precise but not accurate', 'The readings scatter widely, so it is not precise.'], ['Both precise and accurate', 'The scatter means it is not precise.'], ['Neither precise nor accurate', 'On average it hits the true value — that is accuracy.']],
    why: 'Centred on the truth (accurate) but scattered (imprecise). Random error reduces precision.', target: 'accurate' },
  { q: 'A new treatment keeps patients with a chronic disease alive longer but does not cure them. What happens to the PREVALENCE of the disease?',
    answer: 'It increases',
    others: [['It decreases', 'Fewer people leave the pool of cases, so prevalence goes up.'], ['It does not change', 'Prevalence ≈ incidence × duration: longer duration means more prevalence.'], ['The incidence increases instead', 'Incidence counts NEW cases; a treatment does not create new cases.']],
    why: 'Prevalence ≈ incidence × duration. Longer survival lengthens the duration, so prevalence rises while incidence stays the same.' },
  { q: 'A vaccine programme sharply reduces the number of NEW cases of a disease. What happens to the incidence?',
    answer: 'It decreases',
    others: [['It increases', 'Fewer new cases means a lower incidence.'], ['It does not change', 'Incidence is exactly the rate of new cases.'], ['Only the prevalence changes', 'Prevalence falls too in time, but incidence falls first and directly.']],
    why: 'Incidence is the rate of NEW cases. Prevention lowers incidence; prevalence follows as existing cases resolve.' },
];

// ── Building a question from a pool ───────────────────────────────────────
function fromPool(pool, item, kind, extra = {}) {
  const exclude = new Set([item.a, ...(item.exclude || [])]);
  const others = shuffle(Object.keys(pool).filter(k => !exclude.has(k))).slice(0, 3);
  const options = shuffle([
    { key: item.a, label: pool[item.a].label },
    ...others.map(k => ({ key: k, label: pool[k].label, why: `${pool[k].label} ${pool[k].def}` })),
  ]);
  return { kind, prompt: item.q, options, answer: item.a, why: item.why, formula: `${pool[item.a].label}: ${pool[item.a].def}`, ...extra };
}
function fromList(item, kind, extra = {}) {
  const options = shuffle([
    { key: 'ans', label: item.answer },
    ...item.others.map(([label, why], i) => ({ key: `o${i}`, label, why })),
  ]);
  return { kind, prompt: item.q, options, answer: 'ans', why: item.why, ...extra };
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const designQuestion = () => (Math.random() < 0.25
  ? fromPool(PHASES, pick(PHASE_ITEMS), 'phase')
  : fromPool(DESIGNS, pick(DESIGN_ITEMS), 'design'));
export const biasQuestion = () => fromPool(BIASES, pick(BIAS_ITEMS), 'bias');
export const errorConceptQuestion = () => (Math.random() < 0.5
  ? fromPool(ERRORS, pick(ERROR_ITEMS), 'error')
  : fromList(pick(P_ITEMS), 'pvalue'));
export const testQuestion = () => fromPool(TESTS, pick(TEST_ITEMS), 'test');
export const shapeQuestion = () => { const it = pick(SHAPE_ITEMS); return fromList(it, 'shape', { skew: it.skew }); };
export const measureQuestion = () => { const it = pick(MEASURE_ITEMS); return fromList(it, 'measure', { target: it.target }); };

// Exported for the verification script.
export const ALL_ITEMS = { DESIGN_ITEMS, PHASE_ITEMS, BIAS_ITEMS, ERROR_ITEMS, TEST_ITEMS };
