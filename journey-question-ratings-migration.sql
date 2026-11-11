-- ─────────────────────────────────────────────────────────────────────────
-- First Aid Journey: per-question recall ratings
-- Run this once in the Supabase SQL editor.
--
-- The same six self-assessment ratings UWorld Adventure uses (Knowledge Gap,
-- Careless Miss, Lucky Guess, Somewhat Know, Fully Understood, Long-term
-- Memory), picked under the explanation of every Journey question.
--
-- Journey and boss questions live in their own tables (journey_questions,
-- boss_questions), so their ids cannot go in uworld_question_ratings, whose
-- foreign key points at `questions`. `source` says which table an id is from.
-- One row per (user, question): re-rating overwrites, the latest judgement
-- wins — exactly like uworld_question_ratings.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_question_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'journey' CHECK (source IN ('journey', 'boss')),
  rating      TEXT        NOT NULL CHECK (rating IN ('knowledge_gap', 'careless_miss', 'lucky_guess', 'somewhat_know', 'fully_understood', 'long_term_memory')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_question_ratings_user_q ON journey_question_ratings(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_journey_question_ratings_user_rating ON journey_question_ratings(user_id, rating);

ALTER TABLE journey_question_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_journey_question_ratings" ON journey_question_ratings;
CREATE POLICY "server_full_access_journey_question_ratings"
  ON journey_question_ratings FOR ALL USING (true) WITH CHECK (true);
