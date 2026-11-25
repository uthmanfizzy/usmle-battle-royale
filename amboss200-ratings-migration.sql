-- ─────────────────────────────────────────────────────────────────────────
-- Amboss 200 Concepts: recall ratings
-- Run this once in the Supabase SQL editor (after fa-question-ratings-migration.sql).
--
-- Amboss 200 Concepts saves its six recall ratings in fa_question_ratings
-- under mode 'amboss_200' (question_id = AMB200-###). The table's CHECK only
-- allowed the two FA modes, so widen it.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE fa_question_ratings DROP CONSTRAINT IF EXISTS fa_question_ratings_mode_check;
ALTER TABLE fa_question_ratings
  ADD CONSTRAINT fa_question_ratings_mode_check
  CHECK (mode IN ('fa_images', 'fa_hy_qs', 'amboss_200'));
