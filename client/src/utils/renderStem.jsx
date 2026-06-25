import React from 'react';

// A "lab value" line looks like  Name: value [units] [(reference/note)]  — a short
// test-name label (cap <= ~41 chars so ordinary prose with a mid-sentence colon
// doesn't match), a colon, then a recognisable VALUE. The value qualifies if it is:
//   • a number, optionally with a comparator   (7.8, <5, ~3)
//   • a known qualitative result word          (negative, normal, elevated, …)
//   • a single short term, maybe parenthesised  (echinocytes (spiculated red cells))
// A non-empty value is required, so "Laboratory studies show:" (nothing after the
// colon) is never a lab line. The 2+ consecutive-run guard in groupStem/assembleStem
// is the final backstop against a stray prose colon being boxed.
const LAB_LABEL_RE  = /^([A-Za-z][A-Za-z0-9 ,.\/()%+\-']{0,40}):\s*(\S.*)$/;
const NUM_VALUE_RE  = /^[<>~]?\s*[.\d]/;
// one word (letters, optional hyphen/slash), optionally followed by a parenthetical
const SINGLE_TERM_RE = /^[A-Za-z][A-Za-z\-/]{1,29}\.?(\s*\([^)]*\))?$/;
const QUAL_WORDS = new Set([
  'positive', 'negative', 'normal', 'elevated', 'decreased', 'increased',
  'low', 'high', 'abnormal', 'reactive', 'nonreactive', 'non-reactive',
  'absent', 'present', 'trace', 'raised', 'reduced', 'unremarkable',
  'detected', 'undetected', 'positive/negative',
]);

export function isLabLine(line) {
  const m = LAB_LABEL_RE.exec((line || '').trim());
  if (!m) return false;
  const value = m[2].trim();
  if (NUM_VALUE_RE.test(value)) return true;
  const firstWord = (value.toLowerCase().match(/^[a-z][a-z\-/]*/) || [''])[0];
  if (QUAL_WORDS.has(firstWord)) return true;
  if (SINGLE_TERM_RE.test(value)) return true;
  return false;
}

// Group consecutive lines of a stem into prose paragraphs and lab-value boxes.
// Only a RUN of 2+ consecutive lab-pattern lines becomes a box (conservative —
// a lone "Day 1: 2 mg" mid-sentence stays prose). Returns an array of
// { type: 'prose' | 'labs', lines: string[] }.
export function groupStem(text) {
  const lines = String(text).split('\n');
  const n = lines.length;
  const inLab = new Array(n).fill(false);
  for (let i = 0; i < n; ) {
    if (isLabLine(lines[i])) {
      let j = i;
      while (j < n && isLabLine(lines[j])) j++;
      if (j - i >= 2) { for (let k = i; k < j; k++) inLab[k] = true; i = j; continue; }
    }
    i++;
  }
  const blocks = [];
  for (let k = 0; k < n; k++) {
    const type = inLab[k] ? 'labs' : 'prose';
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) last.lines.push(lines[k]);
    else blocks.push({ type, lines: [lines[k]] });
  }
  return blocks;
}

// Render a question stem. Prose flows as paragraphs; a detected lab-values block
// renders as a styled, line-separated lab panel (name left, value right). Reads
// theme variables so it's correct in both normal (dark) and study (light) modes.
// A single-line stem (the overwhelming majority of existing questions) takes the
// fast path and renders exactly as before.
export function renderStem(text) {
  if (!text) return null;
  if (text.indexOf('\n') === -1) return <p className="question-text">{text}</p>;

  return groupStem(text).map((b, idx) => {
    if (b.type === 'labs') {
      return (
        <div className="lab-values-box" key={idx}>
          {b.lines.map((ln, li) => {
            const ci = ln.indexOf(':');
            const name = ci >= 0 ? ln.slice(0, ci).trim() : ln.trim();
            const val  = ci >= 0 ? ln.slice(ci + 1).trim() : '';
            return (
              <div className="lab-row" key={li}>
                <span className="lab-name">{val ? `${name}:` : name}</span>
                {val && <span className="lab-value">{val}</span>}
              </div>
            );
          })}
        </div>
      );
    }
    const prose = b.lines.join('\n').trim();
    if (!prose) return null;
    const proseLines = prose.split('\n');
    return (
      <p className="question-text" key={idx}>
        {proseLines.map((ln, li) => (
          <React.Fragment key={li}>
            {ln}
            {li < proseLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export default renderStem;
