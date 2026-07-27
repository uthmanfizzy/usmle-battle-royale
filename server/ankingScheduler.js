'use strict';
/**
 * AnKing spaced-repetition scheduler — a pure function, no I/O, no database.
 *
 * computeNextReview(currentState, rating, now) => newState
 *
 * `currentState` is the user's anking_review_state row for a card, or null/
 * undefined if they have never rated it (a "new" card). `now` is injectable so
 * the whole thing is deterministic under test.
 *
 * NOTE ON SUB-DAY SCHEDULING: anking_review_state.due_date is a DATE column, so
 * the 1-minute and 10-minute learning steps cannot be persisted at minute
 * resolution — they all collapse to "due today". The returned state therefore
 * carries BOTH `due_date` (what gets stored) and `due_at` (the true timestamp).
 * Callers gate learning cards on last_reviewed_at + the current step's minutes
 * rather than on due_date alone; see isLearningCardDue().
 */

// ── Tuning constants ──────────────────────────────────────────────────────────
const LEARNING_STEPS_MINUTES = [1, 10]; // two steps before graduating
const GRADUATING_INTERVAL_DAYS = 1;
const EASY_GRADUATING_INTERVAL_DAYS = 4;
const STARTING_EASE = 2.5;
const MIN_EASE = 1.3;
const HARD_INTERVAL_MULTIPLIER = 1.2;
const HARD_EASE_PENALTY = 0.15;
const AGAIN_EASE_PENALTY = 0.2;
const EASY_INTERVAL_BONUS = 1.3;
const EASY_EASE_BONUS = 0.15;
const NEW_CARDS_PER_DAY = 20;

const RATINGS = ['again', 'hard', 'good', 'easy'];

// ── Small helpers ─────────────────────────────────────────────────────────────

/** UTC calendar date of a Date, as YYYY-MM-DD (the shape the DATE column takes). */
const toDateString = (d) => d.toISOString().slice(0, 10);

/** Midnight-anchored date arithmetic, so DST/clock time can never shift a day. */
function addDays(now, days) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const addMinutes = (now, minutes) => new Date(now.getTime() + minutes * 60000);

/** Ease is a numeric column; round to 2dp so repeated ±0.15 can't drift in float. */
const roundEase = (e) => Math.round(e * 100) / 100;

/** Intervals are whole days and never less than 1. */
const roundInterval = (i) => Math.max(1, Math.round(i));

const clampEase = (e) => roundEase(Math.max(MIN_EASE, e));

// ── The scheduler ─────────────────────────────────────────────────────────────

/**
 * @param {object|null} currentState  existing anking_review_state row, or null
 * @param {'again'|'hard'|'good'|'easy'} rating
 * @param {Date} [now]
 * @returns {object} new state + `previous_interval_days` and `due_at` for logging
 */
function computeNextReview(currentState, rating, now = new Date()) {
  if (!RATINGS.includes(rating)) {
    throw new Error(`invalid rating "${rating}" — expected one of ${RATINGS.join(', ')}`);
  }

  // Defaults for a card the user has never rated.
  const prev = {
    ease_factor: Number(currentState?.ease_factor) || STARTING_EASE,
    interval_days: Number(currentState?.interval_days) || 0,
    learning_step: Number(currentState?.learning_step) || 0,
    review_count: Number(currentState?.review_count) || 0,
    lapse_count: Number(currentState?.lapse_count) || 0,
  };

  const previousIntervalDays = prev.interval_days;
  // "Graduated" is defined by having a real interval, per spec.
  const isReview = prev.interval_days > 0;

  let ease = prev.ease_factor;
  let intervalDays = prev.interval_days;
  let learningStep = prev.learning_step;
  let lapseCount = prev.lapse_count;
  let dueAt;

  if (!isReview) {
    // ── LEARNING (new card) ──────────────────────────────────────────────────
    switch (rating) {
      case 'again':
        // Restart at the first step.
        learningStep = 0;
        dueAt = addMinutes(now, LEARNING_STEPS_MINUTES[0]);
        break;

      case 'hard': {
        // Repeat the current step; step index is unchanged.
        const step = Math.min(learningStep, LEARNING_STEPS_MINUTES.length - 1);
        dueAt = addMinutes(now, LEARNING_STEPS_MINUTES[step]);
        break;
      }

      case 'good': {
        const nextStep = learningStep + 1;
        if (nextStep < LEARNING_STEPS_MINUTES.length) {
          // Still learning — advance to the next step.
          learningStep = nextStep;
          dueAt = addMinutes(now, LEARNING_STEPS_MINUTES[nextStep]);
        } else {
          // Was on the last step: graduate.
          learningStep = LEARNING_STEPS_MINUTES.length;
          intervalDays = GRADUATING_INTERVAL_DAYS;
          ease = STARTING_EASE;
          dueAt = addDays(now, intervalDays);
        }
        break;
      }

      case 'easy':
        // Graduate immediately, whatever step we were on.
        learningStep = LEARNING_STEPS_MINUTES.length;
        intervalDays = EASY_GRADUATING_INTERVAL_DAYS;
        ease = STARTING_EASE;
        dueAt = addDays(now, intervalDays);
        break;
    }
  } else {
    // ── REVIEW (already graduated) ───────────────────────────────────────────
    switch (rating) {
      case 'again':
        // A lapse, not a reset to brand-new: the card keeps its graduated
        // learning_step and drops to a short relearning interval.
        lapseCount += 1;
        ease = clampEase(ease - AGAIN_EASE_PENALTY);
        intervalDays = GRADUATING_INTERVAL_DAYS;
        break;

      case 'hard':
        intervalDays = roundInterval(intervalDays * HARD_INTERVAL_MULTIPLIER);
        ease = clampEase(ease - HARD_EASE_PENALTY);
        break;

      case 'good':
        intervalDays = roundInterval(intervalDays * ease);
        break;

      case 'easy':
        intervalDays = roundInterval(intervalDays * ease * EASY_INTERVAL_BONUS);
        ease = roundEase(ease + EASY_EASE_BONUS); // no ceiling, only a floor
        break;
    }
    dueAt = addDays(now, intervalDays);
  }

  return {
    ease_factor: roundEase(ease),
    interval_days: intervalDays,
    due_date: toDateString(dueAt),
    learning_step: learningStep,
    review_count: prev.review_count + 1, // every rating counts, whatever the outcome
    lapse_count: lapseCount,
    last_reviewed_at: now.toISOString(),
    // Not persisted on the state row — used for the log row and the API response.
    previous_interval_days: previousIntervalDays,
    due_at: dueAt.toISOString(),
    is_new: !isReview,
  };
}

/**
 * Is a still-learning card (interval_days === 0) actually due right now?
 *
 * due_date cannot express "in 10 minutes", so learning cards would otherwise be
 * offered back instantly. This reconstructs the real due moment from
 * last_reviewed_at plus the current step's minutes.
 */
function isLearningCardDue(state, now = new Date()) {
  if (!state || Number(state.interval_days) > 0) return true; // not a learning card
  if (!state.last_reviewed_at) return true;
  const step = Math.min(Number(state.learning_step) || 0, LEARNING_STEPS_MINUTES.length - 1);
  const dueAt = new Date(Date.parse(state.last_reviewed_at) + LEARNING_STEPS_MINUTES[step] * 60000);
  return now >= dueAt;
}

module.exports = {
  computeNextReview,
  isLearningCardDue,
  toDateString,
  addDays,
  RATINGS,
  LEARNING_STEPS_MINUTES,
  GRADUATING_INTERVAL_DAYS,
  EASY_GRADUATING_INTERVAL_DAYS,
  STARTING_EASE,
  MIN_EASE,
  HARD_INTERVAL_MULTIPLIER,
  HARD_EASE_PENALTY,
  AGAIN_EASE_PENALTY,
  EASY_INTERVAL_BONUS,
  EASY_EASE_BONUS,
  NEW_CARDS_PER_DAY,
};
