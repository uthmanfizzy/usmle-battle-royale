/**
 * Anti-memorization option shuffle (client copy of the server helper in
 * server/questionMapper.js — keep the two in sync).
 *
 * PURE: returns a NEW options array in a fresh random order plus the REMAPPED
 * correct letter that points at the SAME option which was correct before. Never
 * mutates the input array.
 *
 *   shuffleQuestionOptions(['a','b','c','d'], 'B')
 *     -> { options: ['c','b','a','d'], correct: 'B' }   // 'B' still indexes 'b'
 *
 * SCORING CONTRACT: the returned `correct` letter ALWAYS indexes the same option
 * text that `correctLetter` indexed in the input. Check answers against the
 * returned `correct`, never against the pre-shuffle letter.
 */
export function shuffleQuestionOptions(options, correctLetter) {
  const opts = Array.isArray(options) ? options : [];
  // Fewer than 2 options: nothing meaningful to shuffle; return a copy unchanged.
  if (opts.length < 2) return { options: [...opts], correct: correctLetter };

  const correctIdx = String(correctLetter || 'A').trim().toUpperCase().charCodeAt(0) - 65;

  // Fisher-Yates over indices so we can track where the correct option lands.
  const order = opts.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const newOptions    = order.map(i => opts[i]);
  const newCorrectPos = order.indexOf(correctIdx);
  // Out-of-range original index falls back to 'A'; never emit a letter past the
  // options length.
  const correct = String.fromCharCode(65 + (newCorrectPos >= 0 ? newCorrectPos : 0));
  return { options: newOptions, correct };
}
