/**
 * Normalise the shorthand an author types when pasting questions into the
 * importer onto the canonical markup parseRichText already renders:
 *
 *    *text*   ->  **text**   (bold)
 *    _text_   ->  __text__   (underline)
 *
 * WHY CONVERT AT IMPORT rather than teach the renderer the shorthand:
 * parseRichText already assigns *text* to ITALIC, and it is shared by every
 * surface (Solo, Journey, the admin previews). Redefining it there would
 * silently reformat questions written before the change. Converting on the way
 * in leaves existing content exactly as authored, and what gets stored is the
 * markup the whole app already understands.
 *
 * THE ASTERISK PROBLEM: `*` is not decoration in medical text, it is HLA
 * allele nomenclature — HLA-DQB1*0501, HLA-B*5701. Two alleles in one sentence
 * look exactly like an emphasis pair, and the live bank already contains
 * questions mangled this way ("*0501 allele is 0.3 and the frequency of the
 * DQB1*"). So a delimiter only counts when it sits at a word BOUNDARY:
 *
 *   - the opener must not follow an alphanumeric  (DQB1*0501 -> not an opener)
 *   - the opener must be followed by a non-space  (a * b     -> not an opener)
 *   - the closer must not precede an alphanumeric (B*5701    -> not a closer)
 *   - the closer must follow a non-space          (foo *     -> not a closer)
 *
 * Underscores get the same treatment: snake_case identifiers and table column
 * names are common in pasted content and must not become underlines.
 */

// Already-canonical spans are protected before anything else runs, so a
// **bold** never gets re-read as two single-star delimiters.
const PROTECTED = /(\*\*[\s\S]*?\*\*|__[\s\S]*?__)/g;

// One delimiter char, at a word boundary on both ends, with non-space content.
// [^\W\d_] style classes are avoided for clarity: \w covers letters/digits/_,
// which is exactly what must not sit against the delimiter.
const makeRule = (ch) => new RegExp(
  `(^|[^\\w${ch}])` +      // 1: start or a non-word, non-delimiter char before
  `\\${ch}` +              // the opening delimiter
  `(?![\\s${ch}])` +       // not followed by space or another delimiter
  `((?:[^${ch}\\n])*?)` +  // 2: content, no delimiter, single line
  `(?<![\\s${ch}])` +      // not preceded by space or another delimiter
  `\\${ch}` +              // the closing delimiter
  `(?![\\w${ch}])`,        // not followed by a word char or another delimiter
  'g'
);

const STAR_RULE  = makeRule('*');
const UNDER_RULE = makeRule('_');

/** Convert one string's shorthand. Returns it unchanged when there is none. */
export function normalisePastedMarkup(text) {
  if (typeof text !== 'string' || !text) return text;

  // Split on already-canonical spans and only transform the gaps between them.
  const segments = text.split(PROTECTED);
  return segments
    .map((seg, i) => {
      // Odd indices are the captured (already canonical) spans — leave alone.
      if (i % 2 === 1) return seg;
      return seg
        .replace(STAR_RULE,  (_m, pre, body) => `${pre}**${body}**`)
        .replace(UNDER_RULE, (_m, pre, body) => `${pre}__${body}__`);
    })
    .join('');
}

/** Apply to every free-text field of a parsed question, in place-safe fashion. */
export function normaliseQuestionMarkup(q) {
  if (!q) return q;
  return {
    ...q,
    question: normalisePastedMarkup(q.question),
    explanation: normalisePastedMarkup(q.explanation),
    why_others_wrong: normalisePastedMarkup(q.why_others_wrong),
    // Choices are "A. text" strings by this point; the letter prefix contains
    // no delimiters so it passes through untouched.
    choices: Array.isArray(q.choices) ? q.choices.map(normalisePastedMarkup) : q.choices,
  };
}

export default normalisePastedMarkup;
