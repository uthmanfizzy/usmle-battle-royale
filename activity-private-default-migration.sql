-- ─────────────────────────────────────────────────────────────────────────
-- Daily Activity: private by default
-- Run this once in the Supabase SQL editor. Safe to run again.
--
-- 1) Makes sure the column exists (same as activity-privacy-migration.sql).
-- 2) New accounts start on 'private'.
-- 3) Every existing account on 'everyone' is moved to 'private'. Accounts set
--    to 'friends' keep that. Anyone can share again in Settings → Privacy.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_visibility TEXT NOT NULL DEFAULT 'private';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_activity_visibility_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_activity_visibility_check
      CHECK (activity_visibility IN ('everyone', 'friends', 'private'));
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN activity_visibility SET DEFAULT 'private';

UPDATE users SET activity_visibility = 'private'
WHERE activity_visibility IS NULL OR activity_visibility = 'everyone';

NOTIFY pgrst, 'reload schema';
