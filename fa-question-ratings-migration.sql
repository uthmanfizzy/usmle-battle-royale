-- ─────────────────────────────────────────────────────────────────────────
-- FA Images + FA HY Qs: per-question recall ratings
-- Run this once in the Supabase SQL editor.
--
-- The same six self-assessment ratings as UWorld Adventure and the First Aid
-- Journey (Knowledge Gap, Careless Miss, Lucky Guess, Somewhat Know, Fully
-- Understood, Long-term Memory), picked under each explanation.
--
-- question_id is TEXT because the two modes key questions differently:
-- FA Images uses fa_images.id (a UUID), FA HY Qs uses its code bank's stable
-- id (eg 'endo-bbebd401f1'). One row per (user, mode, question); re-rating
-- overwrites — the latest judgement wins.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fa_question_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode        TEXT        NOT NULL CHECK (mode IN ('fa_images', 'fa_hy_qs', 'amboss_200')),
  question_id TEXT        NOT NULL,
  rating      TEXT        NOT NULL CHECK (rating IN ('knowledge_gap', 'careless_miss', 'lucky_guess', 'somewhat_know', 'fully_understood', 'long_term_memory')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fa_question_ratings_user_mode_q ON fa_question_ratings(user_id, mode, question_id);
CREATE INDEX IF NOT EXISTS idx_fa_question_ratings_user_rating ON fa_question_ratings(user_id, mode, rating);

ALTER TABLE fa_question_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_fa_question_ratings" ON fa_question_ratings;
CREATE POLICY "server_full_access_fa_question_ratings"
  ON fa_question_ratings FOR ALL USING (true) WITH CHECK (true);
