/**
 * Biostats Lab rules — one card per KIND of question, laid out to be read:
 * an optional formula, then a table or IF → THEN rows, then one short note.
 * The same structure as the ABG Reader's rule cards, so the minigames teach
 * in one voice. `tone` colours a row: good (green), bad (rose), look (amber),
 * info (blue).
 */

export const RULES = {
  screening: {
    lead: 'Columns are the truth, rows are the test.',
    table: {
      cols: [{ label: 'Down a column', sub: 'property of the TEST', tone: 'info' }, { label: 'Across a row', sub: 'depends on PREVALENCE', tone: 'look' }],
      rows: [
        { label: 'Positive', cells: ['Sensitivity  TP ÷ (TP + FN)', 'PPV  TP ÷ (TP + FP)'] },
        { label: 'Negative', cells: ['Specificity  TN ÷ (TN + FP)', 'NPV  TN ÷ (TN + FN)'] },
      ],
    },
    rows: [
      { when: 'LR+', then: 'sens ÷ (1 − spec)', tone: 'info' },
      { when: 'LR−', then: '(1 − sens) ÷ spec', tone: 'info' },
      { when: 'Accuracy', then: '(TP + TN) ÷ total', tone: 'good' },
    ],
    note: 'SN-N-OUT: sensitive test, Negative result, rules OUT. SP-P-IN: specific test, Positive result, rules IN.',
  },
  cutoff: {
    lead: 'Where the cutoff sits decides who is called positive.',
    table: {
      cols: [{ label: 'Cutoff LOWER ←', sub: 'more positives', tone: 'info' }, { label: 'Cutoff HIGHER →', sub: 'fewer positives', tone: 'look' }],
      rows: [
        { label: 'Sens · NPV', cells: ['↑  rise', '↓  fall'] },
        { label: 'Spec · PPV', cells: ['↓  fall', '↑  rise'] },
        { label: 'False +', cells: ['↑  more', '↓  fewer'] },
        { label: 'False −', cells: ['↓  fewer', '↑  more'] },
      ],
    },
    rows: [{ when: 'Prevalence ↑', then: 'PPV ↑ · NPV ↓ · sens & spec unchanged', tone: 'look' }],
    note: 'Sensitivity and specificity belong to the test; predictive values belong to the test AND the population.',
  },
  risk: {
    lead: 'Event rate on treatment (EER) vs on control (CER):',
    rows: [
      { when: 'RR', then: 'EER ÷ CER', tone: 'info' },
      { when: 'ARR', then: 'CER − EER', tone: 'good' },
      { when: 'RRR', then: '(CER − EER) ÷ CER  =  1 − RR', tone: 'good' },
      { when: 'NNT', then: '1 ÷ ARR', tone: 'good' },
      { when: 'AR (harm)', then: 'risk exposed − risk unexposed', tone: 'bad' },
      { when: 'NNH', then: '1 ÷ AR', tone: 'bad' },
      { when: 'OR', then: 'ad ÷ bc', tone: 'look' },
    ],
    note: 'Cohort → relative risk. Case–control → odds ratio. Vaccine efficacy is the RRR.',
  },
  normal: {
    lead: 'The 68–95–99.7 rule:',
    rows: [
      { when: 'μ ± 1σ', then: '68%  (34% each side)', tone: 'info' },
      { when: 'μ ± 2σ', then: '95%  (2.5% in each tail)', tone: 'info' },
      { when: 'μ ± 3σ', then: '99.7%  (0.15% in each tail)', tone: 'info' },
      { when: 'Above μ + 1σ', then: '16%', tone: 'look' },
    ],
    note: 'The curve is symmetric: half of everyone is above the mean.',
  },
  rates: {
    rows: [
      { when: 'Incidence', then: 'NEW cases ÷ people AT RISK, over a period', tone: 'info' },
      { when: 'Prevalence', then: 'ALL cases ÷ total population, at a point in time', tone: 'look' },
      { when: 'Prevalence ≈', then: 'incidence × duration', tone: 'good' },
    ],
    note: 'People who already have the disease are not at risk of getting it — they leave the incidence denominator.',
  },
  ci: {
    lead: 'Does the 95% CI cross the line of no effect?',
    table: {
      cols: [{ label: 'Ratio', sub: 'RR, OR, HR', tone: 'info' }, { label: 'Difference', sub: 'of means', tone: 'look' }],
      rows: [
        { label: 'Null value', cells: ['1', '0'] },
        { label: 'Crosses it', cells: ['NOT significant', 'NOT significant'] },
        { label: 'Excludes it', cells: ['Significant  p < 0.05', 'Significant  p < 0.05'] },
      ],
    },
    note: 'CI = mean ± Z × SEM (Z = 1.96 for 95%, 2.58 for 99%).',
  },
  power: {
    rows: [
      { when: 'Power', then: '1 − β', tone: 'good' },
      { when: 'Raised by', then: '↑ sample size · ↑ effect size · ↑ α · ↓ variability', tone: 'good' },
    ],
    note: 'β is the type II error rate — the chance of missing a real effect.',
  },
  error: {
    lead: 'What the study concluded vs the truth:',
    table: {
      cols: [{ label: 'H₀ really TRUE', sub: 'no effect', tone: 'info' }, { label: 'H₀ really FALSE', sub: 'real effect', tone: 'look' }],
      rows: [
        { label: 'Rejected H₀', cells: ['Type I error  α · false +', 'Correct  power, 1 − β'] },
        { label: 'Kept H₀', cells: ['Correct  1 − α', 'Type II error  β · false −'] },
      ],
    },
    note: 'α is set by the investigator (usually 0.05). Multiple comparisons inflate type I error.',
  },
  pvalue: {
    rows: [
      { when: 'p-value', then: 'P(a result this extreme | H₀ true)', tone: 'info' },
      { when: 'p < α', then: 'reject H₀ — statistically significant', tone: 'good' },
      { when: 'SEM', then: 'σ ÷ √n', tone: 'look' },
      { when: 'α ↓', then: 'β ↑ (at a fixed sample size)', tone: 'bad' },
    ],
    note: 'Significant is not the same as important — always look at the size of the effect.',
  },
  corr: {
    rows: [
      { when: 'r', then: '−1 to +1: sign = direction, size = strength', tone: 'info' },
      { when: 'R²', then: 'r² = share of variance explained', tone: 'good' },
    ],
    note: 'Correlation does not imply causation.',
  },
  test: {
    lead: 'What is being compared, and in how many groups?',
    table: {
      cols: [{ label: 'Means', sub: 'continuous outcome', tone: 'info' }, { label: 'Proportions', sub: 'categorical outcome', tone: 'look' }],
      rows: [
        { label: '2 groups', cells: ['t-test  paired if same subjects', 'Chi-square  Fisher if small'] },
        { label: '3+ groups', cells: ['ANOVA', 'Chi-square'] },
      ],
    },
    rows: [{ when: 'Two continuous variables', then: 'Pearson correlation (r)', tone: 'good' }],
    note: 'Chi-square → “chi-tegorical”. ANOVA → analysis of variance across 3 or more.',
  },
  design: {
    lead: 'Where does the study START?',
    rows: [
      { when: 'Starts from the OUTCOME', then: 'Case–control → odds ratio', tone: 'look' },
      { when: 'Starts from the EXPOSURE', then: 'Cohort (prospective or retrospective) → RR', tone: 'info' },
      { when: 'One moment in time', then: 'Cross-sectional → prevalence', tone: 'info' },
      { when: 'Populations, not people', then: 'Ecological', tone: 'look' },
      { when: 'Investigator assigns it', then: 'RCT (or crossover)', tone: 'good' },
      { when: 'Pools several studies', then: 'Meta-analysis', tone: 'good' },
    ],
    note: 'Retrospective cohort: the exposure AND the outcome already happened — but you still group by exposure.',
  },
  phase: {
    rows: [
      { when: 'Phase I', then: 'healthy volunteers — is it SAFE?', tone: 'info' },
      { when: 'Phase II', then: 'small number of patients — does it WORK?', tone: 'info' },
      { when: 'Phase III', then: 'large RCT — is it BETTER than current care?', tone: 'good' },
      { when: 'Phase IV', then: 'after approval — can it STAY? (rare/long-term harm)', tone: 'look' },
    ],
  },
  bias: {
    rows: [
      { when: 'Who got IN', then: 'selection · Berkson · healthy worker · non-response', tone: 'look' },
      { when: 'Who dropped OUT', then: 'attrition (→ intention-to-treat)', tone: 'look' },
      { when: 'What they REMEMBER', then: 'recall bias', tone: 'bad' },
      { when: 'Being WATCHED', then: 'Hawthorne (subjects) · Pygmalion (researcher)', tone: 'bad' },
      { when: 'TREATED differently', then: 'procedure bias', tone: 'bad' },
      { when: 'Screening TIME', then: 'lead-time · length-time', tone: 'info' },
      { when: 'A THIRD factor', then: 'confounding — vs effect modification (real)', tone: 'info' },
    ],
    note: 'Randomisation fixes allocation and confounding; blinding fixes observer and procedure bias.',
  },
  shape: {
    rows: [
      { when: 'Positive (right) skew', then: 'mean > median > mode', tone: 'look' },
      { when: 'Negative (left) skew', then: 'mean < median < mode', tone: 'info' },
      { when: 'Normal', then: 'mean = median = mode', tone: 'good' },
    ],
    note: 'The mean chases the tail. The median resists outliers.',
  },
  measure: {
    rows: [
      { when: 'Precision', then: 'reliability — readings agree; ↓ by RANDOM error', tone: 'info' },
      { when: 'Accuracy', then: 'validity — readings near the truth; ↓ by SYSTEMATIC error', tone: 'good' },
      { when: 'Prevalence ≈', then: 'incidence × duration', tone: 'look' },
    ],
  },
};

export function RuleCard({ rule }) {
  if (!rule) return null;
  return (
    <div className="bsl-rule">
      <span className="bsl-rule-tag">Rule</span>
      <div className="bsl-rule-body">
        {rule.lead && <p className="bsl-rule-lead">{rule.lead}</p>}
        {rule.formula && <p className="bsl-rule-formula">{rule.formula}</p>}
        {rule.table && (
          <table className="bsl-rule-table">
            <thead>
              <tr>
                <th aria-hidden="true" />
                {rule.table.cols.map(c => (
                  <th key={c.label} className={`tone-${c.tone}`}>{c.label}<small>{c.sub}</small></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rule.table.rows.map(r => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {r.cells.map((cell, i) => {
                    const [what, cond] = cell.split('  ');
                    return <td key={i}><b>{what}</b>{cond && <span>{cond}</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rule.rows && (
          <ul className="bsl-rule-rows">
            {rule.rows.map(r => (
              <li key={r.when + r.then} className={`tone-${r.tone || 'look'}`}>
                <span className="bsl-rule-when">{r.when}</span>
                <span className="bsl-rule-arrow" aria-hidden="true">→</span>
                <span className="bsl-rule-then">{r.then}</span>
              </li>
            ))}
          </ul>
        )}
        {rule.note && <p className="bsl-rule-note">{rule.note}</p>}
      </div>
    </div>
  );
}
