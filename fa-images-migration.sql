-- ─────────────────────────────────────────────────────────────────────────
-- First Aid Images: the figure bank
-- Run this once in the Supabase SQL editor. REQUIRED — FA Images has no
-- figures to show until this table exists and has rows in it.
--
-- One row per question. Admin → FA Images imports a pack (built from your
-- own copy of First Aid; never committed — this repository is public),
-- uploading each figure to the existing public `question-images` bucket.
--
--   system       the First Aid chapter id: biochem immuno micro path pharm
--                cardio endo gi heme_onc msk neuro psych renal repro resp
--   modality     Clinical photo | Histology | Imaging | Diagram | Graph | Other
--   answer       the correct option, shown as written
--   distractors  JSON array of wrong options (topped up from the chapter
--                when there are fewer than three)
--   prompt       the question line
--   explanation  shown after the answer is revealed
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fa_images (
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

CREATE INDEX IF NOT EXISTS fa_images_system_idx ON fa_images (system) WHERE active;

-- The server uses the service key; nothing reads this table from the browser.
ALTER TABLE fa_images ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
