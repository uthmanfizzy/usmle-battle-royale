-- ─────────────────────────────────────────────────────────────────────────
-- Inner Circle Qbank: recall ratings
-- Run this once in the Supabase SQL editor (after fa-question-ratings-migration.sql
-- and amboss200-ratings-migration.sql).
--
-- The Inner Circle Qbank (Story Mode → Step 2 CK → Inner Circle) saves its six
-- recall ratings (Knowledge Gap … Long-term Memory) in fa_question_ratings
-- under mode 'inner_circle' (question_id = ic_<system>-<hash>). Widen the CHECK
-- so the mode is allowed. Until this runs, ratings answer reason
-- 'missing_mode' and the page says they are not saving.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE fa_question_ratings DROP CONSTRAINT IF EXISTS fa_question_ratings_mode_check;
ALTER TABLE fa_question_ratings
  ADD CONSTRAINT fa_question_ratings_mode_check
  CHECK (mode IN ('fa_images', 'fa_hy_qs', 'amboss_200', 'inner_circle'));
