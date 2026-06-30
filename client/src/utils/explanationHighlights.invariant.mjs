// Invariant test for explanation highlighting (run with: node explanationHighlights.invariant.mjs)
//
// THE INVARIANT: toVisibleText(explanation) must equal the live container's
// textContent — i.e. exactly the text the original ExplanationText + parseRichText
// renderer puts on screen. If they diverge, capture (selection -> offsets) and
// apply (offsets -> marks) anchor against different strings and highlights land on
// the wrong text.
//
// Since there's no DOM in Node, we compute the reference textContent with an
// INDEPENDENT reimplementation of the ORIGINAL renderer's text output (a faithful
// copy of ExplanationText's sentence-split + parseRichText's markup-strip, emitting
// only text). toVisibleText must match it byte-for-byte.

import { toVisibleText } from './explanationHighlights.js';

const COLORS = {
  red: 1, blue: 1, green: 1, yellow: 1, orange: 1,
  purple: 1, gold: 1, pink: 1, cyan: 1, white: 1,
};

// ── Reference: ORIGINAL renderer's visible text (parseRichText, text only) ──────
function refParseInline(text) {
  let out = '';
  let remaining = text;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
    if (boldMatch) { out += boldMatch[1]; remaining = remaining.slice(boldMatch[0].length); continue; }
    const italicMatch = remaining.match(/^\*([\s\S]*?)\*/);
    if (italicMatch) { out += italicMatch[1]; remaining = remaining.slice(italicMatch[0].length); continue; }
    let plainEnd = 0;
    while (plainEnd < remaining.length) {
      const next = remaining.slice(plainEnd);
      if (next.match(/^\*\*/) || next.match(/^\*[^*]/)) break;
      plainEnd++;
    }
    if (plainEnd === 0) plainEnd = 1;
    out += remaining.slice(0, plainEnd);
    remaining = remaining.slice(plainEnd);
  }
  return out;
}

function refParseRichText(text) {
  // mirrors parseRichText: split by \n, parse markup, <br> contributes no text
  return text.split('\n').map((line) => {
    let out = '';
    let remaining = line;
    while (remaining.length > 0) {
      const colorMatch = remaining.match(/^\[(\w+)\]([\s\S]*?)\[\/\1\]/);
      if (colorMatch && COLORS[colorMatch[1]]) {
        out += refParseInline(colorMatch[2]);
        remaining = remaining.slice(colorMatch[0].length);
        continue;
      }
      const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
      if (boldMatch) { out += boldMatch[1]; remaining = remaining.slice(boldMatch[0].length); continue; }
      const italicMatch = remaining.match(/^\*([\s\S]*?)\*/);
      if (italicMatch) { out += italicMatch[1]; remaining = remaining.slice(italicMatch[0].length); continue; }
      const underlineMatch = remaining.match(/^__([\s\S]*?)__/);
      if (underlineMatch) { out += underlineMatch[1]; remaining = remaining.slice(underlineMatch[0].length); continue; }
      let plainEnd = 0;
      while (plainEnd < remaining.length) {
        const next = remaining.slice(plainEnd);
        if (next.match(/^\*\*/) || next.match(/^\*[^*]/) || next.match(/^__/) || next.match(/^\[\w+\]/)) break;
        plainEnd++;
      }
      if (plainEnd === 0) plainEnd = 1;
      out += remaining.slice(0, plainEnd);
      remaining = remaining.slice(plainEnd);
    }
    return out;
  }).join(''); // <br> = no text between lines
}

// mirrors ExplanationText: sentence-split + trim + filter, <p> per sentence, no
// separator between adjacent <p> elements -> textContent is the bare concatenation.
function refTextContent(explanation) {
  if (!explanation) return '';
  return explanation
    .split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])$/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(refParseRichText)
    .join('');
}

const SAMPLES = [
  'The patient has anemia. This is **important** for the diagnosis.',
  'Iron deficiency is common. *Microcytic* cells are seen. Treat with __iron__.',
  '[red]Hemolysis[/red] occurs here. The **[blue]reticulocyte[/blue]** count rises.',
  'Line one of finding.\nLine two of finding.\nThird line here. A new sentence follows!',
  'Multi **bold with *nested* star** edge. Then [green]green *italic* text[/green] ends.',
  'Short.',
  'No trailing punctuation here and no split happens because lowercase',
  'A value: 7.8 g/dL was noted. Why? Because of bleeding! Done.',
  '',
  '   Leading and trailing spaces around a sentence.   Another one.   ',
  'Edge **unclosed bold and *italic that closes* fine. End.',
  'Colon usage: like this: but not a split. Capital After Period. lower after period.',
];

let pass = 0;
let fail = 0;
const failures = [];
for (const sample of SAMPLES) {
  const a = toVisibleText(sample);
  const b = refTextContent(sample);
  if (a === b) {
    pass++;
  } else {
    fail++;
    failures.push({ sample, toVisibleText: a, reference: b });
  }
}

console.log(`INVARIANT TEST: toVisibleText === reference textContent`);
console.log(`  PASS: ${pass}/${SAMPLES.length}`);
if (fail > 0) {
  console.log(`  FAIL: ${fail}`);
  for (const f of failures) {
    console.log('  ── mismatch ──');
    console.log('    sample   :', JSON.stringify(f.sample));
    console.log('    toVisible:', JSON.stringify(f.toVisibleText));
    console.log('    reference:', JSON.stringify(f.reference));
  }
  process.exit(1);
} else {
  console.log('  ✅ INVARIANT HOLDS — capture & apply anchor against the same string.');
  process.exit(0);
}
