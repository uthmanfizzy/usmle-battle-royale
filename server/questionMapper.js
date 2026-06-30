/**
 * questionMapper — single source of truth for question shape transforms.
 *
 * Shapes:
 *   DB row (Supabase `questions` table): { question_id, category, choices, correct, ... }
 *   Internal (questionBank entries):     { id, subject, options, correct, ... }
 *   Public (sent to clients pre-answer): { id, question, options } — NEVER includes
 *     `correct`, `explanation`, or `why_others_wrong`.
 *
 * WIRE CONTRACT — intentionally overloaded, do not unify:
 *   - `result.correct` is a BOOLEAN: did this player answer correctly.
 *   - `question.correct` (internal) and `result.correctAnswer` are a LETTER (A–H):
 *     the answer key.
 *   These coexist in every answer-result payload. Renaming either is a breaking
 *   wire-format change across all game-mode clients.
 */

/**
 * DB row -> internal question. Verbatim lift of the loadQuestions() mapping.
 */
function fromDb(row) {
  return {
    id: row.question_id,
    subject: row.category,
    difficulty: row.difficulty || 'easy',
    question: row.question,
    options: row.choices,
    correct: row.correct,
    explanation: row.explanation || '',
    why_others_wrong: row.why_others_wrong || undefined,
    explanation_image_url: row.explanation_image_url || undefined,
    game_modes: row.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
    image_url: row.image_url || undefined,
    tower_floor: row.tower_floor || undefined,
    topic_id: row.topic_id || undefined,
    buzz_type: row.buzz_type || undefined,
    question_type: row.question_type || 'mcq',
    _supabase_id: row.id, // Keep Supabase UUID for updates
  };
}

/**
 * Internal question -> Supabase update record. Verbatim lift of the admin
 * update endpoint's record. NOTE: matches current behavior exactly — it does
 * NOT write `question_type` (admin edits to question type do not persist
 * today; fix separately, not in a pure refactor) and does not write
 * `question_id` (the row key is matched by `id`/`question_id` at the call
 * site, not rewritten).
 */
function toDb(question) {
  return {
    question: question.question,
    choices: question.options,
    correct: question.correct,
    explanation: question.explanation,
    why_others_wrong: question.why_others_wrong || null,
    explanation_image_url: question.explanation_image_url || null,
    category: question.subject,
    difficulty: question.difficulty || 'easy',
    game_modes: question.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
    image_url: question.image_url || null,
    tower_floor: question.tower_floor || null,
    topic_id: question.topic_id || null,
    buzz_type: question.buzz_type || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Internal question -> the safe pre-answer shape sent to clients.
 *
 * This is the common core of all five question-emit sites:
 * `{ id, question, options, image_url }`. Mode-specific extras (round,
 * timeLimit, buzz_type, suddenDeath, trivia context, ...) differ per site and
 * stay at the call site, spread alongside this:
 *
 *   io.to(lobby.id).emit('new_question', {
 *     ...toPublicQuestion(q),
 *     round, timeLimit, alivePlayers,
 *   });
 *
 * Guarantee: `correct` / `explanation` / `why_others_wrong` can never leak
 * pre-answer through this function.
 */
function toPublicQuestion(q) {
  return { id: q.id, question: q.question, options: q.options, image_url: q.image_url || null };
}

/**
 * Build an answer-result payload. The one place where boolean `correct` and
 * letter `correctAnswer` legitimately coexist (see wire contract above).
 *
 * `explanation` is intentionally NOT defaulted from `q` because every site
 * has its own policy (hard-mode hiding, trivia sends it raw, speed race omits
 * it entirely) — pass it via `extras` where the mode sends one.
 */
function answerResultPayload({ isCorrect, q, extras = {} }) {
  return {
    correct: isCorrect,
    correctAnswer: q.correct,
    ...extras,
  };
}

/**
 * Raw imported question (admin bulk import / Question Parser) -> internal
 * shape. Collapses the alias swamp in one place:
 *   options:  raw.options || raw.choices   (with "A." / "b)" prefix stripping)
 *   correct:  raw.correct || raw.answer || raw.correct_letter
 *             - single letter A–H: kept as the letter if within options range
 *             - answer text: converted to its letter if it matches an option
 *             - anything unresolvable defaults to 'A' (current behavior)
 *   subject:  raw.category || raw.subject || defaultCategory || 'general'
 *
 * Verbatim lift of the bulk-import normalization. Caller is responsible for:
 * skipping rows with no question text, generating question_id, and resolving
 * topic_id (async DB lookup).
 *
 * NOTE (bug-compatible): text-form correct answers are uppercased before
 * being compared to options, so text matching only succeeds for options
 * stored in uppercase. Preserved as-is; fix separately if ever.
 */
function normalizeImport(raw, { defaultCategory, defaultDifficulty } = {}) {
  // Normalize category - use provided, fall back to passed default, or use 'general'
  let subject = raw.category || raw.subject || defaultCategory || 'general';
  if (subject) subject = subject.toLowerCase().trim();

  // Get options from either field name, accept any array length
  const rawOptions = raw.options || raw.choices || [];
  const options = Array.isArray(rawOptions) && rawOptions.length > 0
    ? rawOptions.map(o => String(o).replace(/^[A-Za-z][.)]\s*/, '').trim())
    : ['Option A', 'Option B', 'Option C', 'Option D']; // Default if no options

  // Use provided difficulty or default; only 'easy' | 'hard' allowed
  let difficulty = raw.difficulty || defaultDifficulty || 'easy';
  difficulty = difficulty.toLowerCase().trim();
  if (difficulty !== 'hard') difficulty = 'easy';

  // Handle correct answer - resolve aliases, store as LETTER
  const rawCorrect = String(raw.correct || raw.answer || raw.correct_letter || '').trim().toUpperCase();
  let correct;
  if (!rawCorrect) {
    correct = 'A';
  } else if (rawCorrect.length === 1 && rawCorrect >= 'A' && rawCorrect <= 'H') {
    const letterIndex = rawCorrect.charCodeAt(0) - 65; // A=0, B=1, C=2, ...
    correct = (letterIndex >= 0 && letterIndex < options.length) ? rawCorrect : 'A';
  } else {
    // Text format - convert to letter by finding which option matches
    const matchIndex = options.findIndex(opt => opt === rawCorrect);
    correct = matchIndex >= 0 ? String.fromCharCode(65 + matchIndex) : 'A';
  }

  const game_modes = Array.isArray(raw.game_modes) && raw.game_modes.length > 0
    ? raw.game_modes
    : ['battle_royale', 'speed_race', 'trivia_pursuit'];

  return {
    question: raw.question.trim(),
    subject,
    options,
    correct,
    difficulty,
    explanation: raw.explanation || raw.rationale || '',
    why_others_wrong: raw.why_others_wrong || raw.whyOthersWrong || raw.why_wrong || '',
    game_modes,
    image_url: raw.image_url || null,
    tower_floor: (raw.tower_floor != null && !isNaN(parseInt(raw.tower_floor))) ? parseInt(raw.tower_floor) : null,
    buzz_type: (raw.buzz_type && game_modes.includes('buzz_fun')) ? raw.buzz_type : null,
  };
}

/**
 * Anti-memorization option shuffle. PURE: returns a NEW options array in a fresh
 * random order plus the REMAPPED correct letter that points at the SAME option
 * which was correct before. Never mutates the input array.
 *
 *   shuffleQuestionOptions(['a','b','c','d'], 'B')
 *     -> { options: ['c','b','a','d'], correct: 'B' }   // 'B' still indexes 'b'
 *
 * SCORING CONTRACT: the returned `correct` letter ALWAYS indexes the same option
 * text that `correctLetter` indexed in the input. Callers MUST check answers
 * against the returned `correct`, never against the pre-shuffle letter — checking
 * against the stale letter silently scores the wrong option.
 *
 * The client keeps an identical copy at client/src/utils/shuffleOptions.js — keep
 * the two in sync.
 */
function shuffleQuestionOptions(options, correctLetter) {
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
  // Out-of-range original index falls back to 'A' (matches normalizeImport's
  // default-to-A behavior); never emit a letter past the options length.
  const correct = String.fromCharCode(65 + (newCorrectPos >= 0 ? newCorrectPos : 0));
  return { options: newOptions, correct };
}

/**
 * Clone a question with its options shuffled and `correct` remapped. Returns a
 * NEW object — the canonical questionBank entry is never mutated. Use this once
 * per serve/appearance so every appearance gets a fresh order while the stored
 * question keeps its canonical pre-shuffle letter.
 */
function withShuffledOptions(q) {
  if (!q) return q;
  const { options, correct } = shuffleQuestionOptions(q.options || [], q.correct);
  return { ...q, options, correct };
}

module.exports = { fromDb, toDb, toPublicQuestion, answerResultPayload, normalizeImport, shuffleQuestionOptions, withShuffledOptions };
