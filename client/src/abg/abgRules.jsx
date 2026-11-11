/**
 * The ABG Reader's rules, laid out to be READ rather than parsed.
 *
 * They were paragraphs — "Acid side: PaCO₂ high (> 45) is respiratory,
 * HCO₃⁻ low (< 22) is metabolic. Alkaline side: …" — which is four
 * conditions and their answers run together in one sentence. Each rule is now
 * structure: an optional formula, then either a TABLE (when the answer
 * depends on two things, like which side of 7.40 and which value moved) or
 * IF → THEN rows (when it depends on one), then at most one short note.
 *
 * `tone` colours a row by meaning — acid warm, alkali cool, normal green,
 * "look further" amber — the same pairing the rest of the game uses.
 */

export const RULES = {
  ph: {
    lead: 'Read the pH against the normal range.',
    rows: [
      { when: 'pH < 7.35', then: 'Acidaemia', tone: 'acid' },
      { when: '7.35 – 7.45', then: 'Normal pH', tone: 'normal' },
      { when: 'pH > 7.45', then: 'Alkalaemia', tone: 'alk' },
    ],
    note: 'Even a normal pH sits on one side of 7.40 — that side still points to the primary process.',
  },

  primary: {
    lead: 'Which value moved the SAME way as the pH?',
    table: {
      corner: '',
      cols: [
        { label: 'pH on the acid side', sub: 'below 7.40', tone: 'acid' },
        { label: 'pH on the alkaline side', sub: 'above 7.40', tone: 'alk' },
      ],
      rows: [
        { label: 'Respiratory', cells: ['PaCO₂ HIGH  > 45', 'PaCO₂ LOW  < 35'] },
        { label: 'Metabolic', cells: ['HCO₃⁻ LOW  < 22', 'HCO₃⁻ HIGH  > 26'] },
      ],
    },
    note: 'Both values pushing the pH the same way → a mixed disorder.',
  },

  comp: {
    'met-acidosis': {
      lead: 'Winter’s formula predicts the PaCO₂:',
      formula: 'Expected PaCO₂ = 1.5 × HCO₃⁻ + 8  (± 2)',
      rows: [
        { when: 'Actual within the range', then: 'Appropriately compensated', tone: 'normal' },
        { when: 'Actual HIGHER', then: '+ respiratory acidosis', tone: 'acid' },
        { when: 'Actual LOWER', then: '+ respiratory alkalosis', tone: 'alk' },
      ],
    },
    'met-alkalosis': {
      lead: 'Predict the PaCO₂:',
      formula: 'Expected PaCO₂ = 0.7 × HCO₃⁻ + 21  (± 2)',
      rows: [
        { when: 'Actual within the range', then: 'Appropriately compensated', tone: 'normal' },
        { when: 'Actual HIGHER', then: '+ respiratory acidosis', tone: 'acid' },
        { when: 'Actual LOWER', then: '+ respiratory alkalosis', tone: 'alk' },
      ],
    },
    'resp-acidosis': {
      lead: 'For every 10 mmHg the PaCO₂ RISES, the HCO₃⁻ rises by:',
      rows: [
        { when: '~1', then: 'Acute — the kidneys have not responded yet', tone: 'look' },
        { when: '~3.5', then: 'Chronic — days of renal compensation', tone: 'normal' },
        { when: 'In between', then: 'Acute-on-chronic', tone: 'acid' },
      ],
    },
    'resp-alkalosis': {
      lead: 'For every 10 mmHg the PaCO₂ FALLS, the HCO₃⁻ falls by:',
      rows: [
        { when: '~2', then: 'Acute', tone: 'look' },
        { when: '~4 – 5', then: 'Chronic', tone: 'normal' },
        { when: 'More than the timing allows', then: '+ metabolic acidosis', tone: 'acid' },
      ],
      note: 'The history tells you the timing — hours or days.',
    },
  },

  ag: {
    lead: 'Calculate it every time — a high gap can hide behind a normal pH.',
    formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻)',
    rows: [
      { when: '12 ± 2', then: 'Normal gap', tone: 'normal' },
      { when: 'Above 14', then: 'HIGH gap — unmeasured acid present', tone: 'acid' },
    ],
    note: 'Low albumin? Add 2.5 for every 1 g/dL below 4.',
  },

  delta: {
    lead: 'Did the HCO₃⁻ fall as much as the gap rose?',
    formula: 'Δ ratio = (AG − 12) ÷ (24 − HCO₃⁻)',
    rows: [
      { when: 'Below 0.8', then: '+ a normal-gap acidosis too', tone: 'acid' },
      { when: '0.8 – 2', then: 'Pure high-gap acidosis', tone: 'normal' },
      { when: 'Above 2', then: '+ a metabolic alkalosis too', tone: 'alk' },
    ],
  },

  cause: {
    lead: 'Put the gas back in the patient:',
    rows: [
      { when: '1', then: 'The history — what happened, and over how long', tone: 'look' },
      { when: '2', then: 'The other results — glucose, lactate, K⁺, urine', tone: 'look' },
      { when: '3', then: 'The pattern you have just worked out', tone: 'look' },
    ],
  },
};

/** A rule, laid out. */
export function RuleCard({ rule }) {
  if (!rule) return null;
  return (
    <div className="abgr-rule">
      <span className="abgr-rule-tag">Rule</span>
      <div className="abgr-rule-body">
        {rule.lead && <p className="abgr-rule-lead">{rule.lead}</p>}
        {rule.formula && <p className="abgr-rule-formula">{rule.formula}</p>}

        {rule.table && (
          <table className="abgr-rule-table">
            <thead>
              <tr>
                <th aria-hidden="true" />
                {rule.table.cols.map(c => (
                  <th key={c.label} className={`tone-${c.tone}`}>
                    {c.label}<small>{c.sub}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rule.table.rows.map(r => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {r.cells.map((cell, i) => {
                    const [what, cond] = cell.split('  ');
                    return (
                      <td key={i}>
                        <b>{what}</b>{cond && <span>{cond}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rule.rows && (
          <ul className="abgr-rule-rows">
            {rule.rows.map(r => (
              <li key={r.when + r.then} className={`tone-${r.tone || 'look'}`}>
                <span className="abgr-rule-when">{r.when}</span>
                <span className="abgr-rule-arrow" aria-hidden="true">→</span>
                <span className="abgr-rule-then">{r.then}</span>
              </li>
            ))}
          </ul>
        )}

        {rule.note && <p className="abgr-rule-note">{rule.note}</p>}
      </div>
    </div>
  );
}
