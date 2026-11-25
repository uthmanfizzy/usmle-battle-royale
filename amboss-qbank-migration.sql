-- ─────────────────────────────────────────────────────────────────────────
-- Amboss Quest → Qbank
-- Run this once in the Supabase SQL editor. REQUIRED: the Qbank has nothing
-- to show until this table exists and a pack has been imported into it.
--
-- One row per question. Admin → Amboss Qbank imports a pack (built on the
-- admin's computer by tools/amboss-qbank from their own AMBOSS export; the
-- pack is never committed, because this repository is public). Each figure is
-- uploaded to the existing public `question-images` bucket first, so the rows
-- only hold URLs.
--
--   id           AQB-<SYS>-B<block>-Q<nn>, e.g. AQB-RESP-B1-Q01
--   system       app subject id of the AMBOSS section (pulmonology, ...)
--   block, num   the AMBOSS block and the question's place in it
--   stem         vignette; "a | b" rows render as a table
--   stem_images  JSON array of image URLs shown with the vignette
--   hint         AMBOSS's hint, shown only when the student asks for it
--   choices      JSON array of
--                  { letter, text, explanation: [ {type:'why'|'but', text}
--                                               | {type:'images', images:[url]} ] }
--   correct      the correct letter
--
-- amboss_qbank_answers keeps each student's latest answer per question, which
-- is what the block picker's progress and "unused / incorrect" filters read.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS amboss_qbank (
  id          TEXT        PRIMARY KEY,
  system      TEXT        NOT NULL,
  block       INT         NOT NULL,
  num         INT         NOT NULL,
  stem        TEXT        NOT NULL,
  stem_images JSONB       NOT NULL DEFAULT '[]'::jsonb,
  hint        TEXT,
  choices     JSONB       NOT NULL,
  correct     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS amboss_qbank_block_idx ON amboss_qbank (system, block, num);

CREATE TABLE IF NOT EXISTS amboss_qbank_answers (
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT        NOT NULL REFERENCES amboss_qbank(id) ON DELETE CASCADE,
  choice      TEXT        NOT NULL,
  correct     BOOLEAN     NOT NULL,
  used_hint   BOOLEAN     NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- The server uses the service key; nothing reads these tables from the browser.
ALTER TABLE amboss_qbank ENABLE ROW LEVEL SECURITY;
ALTER TABLE amboss_qbank_answers ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
