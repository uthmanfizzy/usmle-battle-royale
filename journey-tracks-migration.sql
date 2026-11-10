-- ─────────────────────────────────────────────────────────────────────────
-- First Aid Journey: two ways through
-- Run this in the Supabase SQL editor.
--
-- 'full'  = the Journey as it has always been. Every question that already
--           exists belongs to it, which is what the DEFAULT below does: the
--           long approach keeps all of its content, untouched.
-- 'rapid' = the shorter, more concise set, written from here on.
--
-- Chapters, levels, videos, memory aids, pictures and confidence ratings are
-- all SHARED — only the questions differ. Progress is kept apart by the
-- server, under a 'rapid:' prefix on journey_progress.level_key, so clearing
-- a level the quick way does not mark it cleared the long way.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE journey_questions
  ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'full';

-- Belt and braces: anything already there is the long approach.
UPDATE journey_questions SET track = 'full' WHERE track IS NULL;

-- Only the two the server will serve.
ALTER TABLE journey_questions DROP CONSTRAINT IF EXISTS journey_questions_track_check;
ALTER TABLE journey_questions
  ADD CONSTRAINT journey_questions_track_check CHECK (track IN ('full', 'rapid'));

-- Every read is "this level, this track".
CREATE INDEX IF NOT EXISTS idx_journey_questions_level_track
  ON journey_questions(level_id, track);
