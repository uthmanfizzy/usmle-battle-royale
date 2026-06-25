import React from 'react';

// A "lab value" line looks like  Name: value [units] [(reference/note)]  — a short
// label, a colon, then a number (optionally a comparator). The label cap (<= ~41
// chars before the colon) keeps ordinary prose that happens to contain a colon
// followed by a number from matching, and requiring a NUMBER right after the colon
// rules out "Which of the following:" style sentence colons.
export const LAB_LINE_RE = /^[A-Za-z][A-Za-z0-9 ,.\/()%+\-']{0,40}:\s*[<>~]?\s*[.\d]/;

export function isLabLine(line) {
  return LAB_LINE_RE.test((line || '').trim());
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
                <span className="lab-name">{name}</span>
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
