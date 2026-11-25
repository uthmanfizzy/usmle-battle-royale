-- ─────────────────────────────────────────────────────────────────────────
-- Daily Activity privacy
-- Run this once in the Supabase SQL editor. Safe to run again.
--
-- Who may see a player's Daily Activity timeline and study calendar:
--   everyone  anyone who opens their /activity page (the old behaviour, and
--             the default, so nothing changes until a player picks otherwise)
--   friends   only accepted friends (and the player)
--   private   only the player
-- The player always sees their own. Until this runs, everyone is treated as
-- "everyone" and the setting cannot be saved.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_visibility TEXT NOT NULL DEFAULT 'everyone';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_activity_visibility_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_activity_visibility_check
      CHECK (activity_visibility IN ('everyone', 'friends', 'private'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
