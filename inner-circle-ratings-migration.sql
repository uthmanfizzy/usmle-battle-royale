-- ─────────────────────────────────────────────────────────────────────────
-- Inner Circle Qbank: recall ratings  (self-contained — run this one file)
-- Paste the whole file into the Supabase SQL editor and press Run. It is safe
-- to run more than once.
--
-- The Inner Circle Qbank (Story Mode → Step 2 CK → Inner Circle) saves its six
-- recall ratings (Knowledge Gap … Long-term Memory) in fa_question_ratings
-- under mode 'inner_circle' (question_id = ic_<system>-<hash>, eg
-- ic_renal-1a2b3c4d5e). Ratings were not saving because either the table did
-- not exist yet or its mode CHECK did not allow 'inner_circle'. This script:
--   1. creates fa_question_ratings if it is missing (same shape as
--      fa-question-ratings-migration.sql), with the unique key the server's
--      upsert needs and the server-access policy;
--   2. drops whatever CHECK constraint currently limits `mode` (whatever it is
--      called) and adds one that allows every mode the server uses.
-- After running it, rate a question in Inner Circle and reload: the rating
-- should still be there and "Study by your rating" should count it.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fa_question_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode        TEXT        NOT NULL,
  question_id TEXT        NOT NULL,
  rating      TEXT        NOT NULL CHECK (rating IN ('knowledge_gap', 'careless_miss', 'lucky_guess', 'somewhat_know', 'fully_understood', 'long_term_memory')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The server upserts ON CONFLICT (user_id, mode, question_id): this index must exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fa_question_ratings_user_mode_q ON fa_question_ratings(user_id, mode, question_id);
CREATE INDEX IF NOT EXISTS idx_fa_question_ratings_user_rating ON fa_question_ratings(user_id, mode, rating);

ALTER TABLE fa_question_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server_full_access_fa_question_ratings" ON fa_question_ratings;
CREATE POLICY "server_full_access_fa_question_ratings"
  ON fa_question_ratings FOR ALL USING (true) WITH CHECK (true);

-- Drop every CHECK constraint that mentions the mode column, whatever its name
-- (an inline CHECK gets an auto-generated name, so dropping by one name can miss it).
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'fa_question_ratings'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%mode%'
  LOOP
    EXECUTE format('ALTER TABLE fa_question_ratings DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE fa_question_ratings
  ADD CONSTRAINT fa_question_ratings_mode_check
  CHECK (mode IN ('fa_images', 'fa_hy_qs', 'amboss_200', 'inner_circle'));

-- Make PostgREST pick up the change straight away.
NOTIFY pgrst, 'reload schema';
