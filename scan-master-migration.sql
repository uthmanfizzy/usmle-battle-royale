-- ─────────────────────────────────────────────────────────────────────────
-- Scan Master: the image bank
-- Run this once in the Supabase SQL editor. REQUIRED — Scan Master has no
-- pictures to show until this table exists and has rows in it.
--
-- One row per picture. The admin panel (Admin → Scan Master) uploads the
-- image to the existing public `question-images` storage bucket and writes
-- the row; the game reads only rows with active = true.
--
--   system       one of: cardio pulm renal gi neuro msk derm heme_onc ophtho
--                immuno endo repro micro multisystem
--   answer       the correct option, shown to the player as written
--   distractors  JSON array of wrong options; when there are fewer than
--                three, the game tops them up from other answers in the
--                same system
--   prompt       optional question line (default "What does this image show?")
--   explanation  shown after the answer is revealed
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_master_images (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  system      TEXT        NOT NULL,
  modality    TEXT,
  image_url   TEXT        NOT NULL,
  prompt      TEXT,
  answer      TEXT        NOT NULL,
  distractors JSONB       NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scan_master_images_system_idx ON scan_master_images (system) WHERE active;

-- The server uses the service key; nothing reads this table from the browser.
ALTER TABLE scan_master_images ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
