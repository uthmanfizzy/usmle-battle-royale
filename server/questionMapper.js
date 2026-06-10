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
 * This is the exact common core of all five question-emit sites:
 * `{ id, question, options }`. Mode-specific extras (round, timeLimit,
 * image_url, buzz_type, suddenDeath, trivia context, ...) differ per site and
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
  return { id: q.id, question: q.question, options: q.options };
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

module.exports = { fromDb, toDb, toPublicQuestion, answerResultPayload };
