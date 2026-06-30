-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: bold/italic (format) spans don't save
-- ═══════════════════════════════════════════════════════════════════════════════
-- Root cause: format spans store color = NULL (a row is a colour highlight XOR a
-- bold/italic format span). For that to work, the `color` column must be NULLABLE
-- with no default. The earlier migration added the `format` column + the
-- color-XOR-format constraint, but `ALTER COLUMN color DROP NOT NULL` was not
-- applied — so inserting a format row (color = NULL) violates the lingering NOT NULL
-- and Postgres rejects the insert (the server then 500s). This is why colour
-- highlights (color = 'yellow') save but B/I format spans do not.
--
-- Run this in the Supabase SQL editor. It is idempotent (safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) The actual fix: allow color = NULL (and drop the 'yellow' default so omitted
--    colour never sneaks back in for a format row).
ALTER TABLE explanation_highlights ALTER COLUMN color DROP NOT NULL;
ALTER TABLE explanation_highlights ALTER COLUMN color DROP DEFAULT;

-- 2) Ensure the format column + its CHECK exist (no-ops if already present).
ALTER TABLE explanation_highlights ADD COLUMN IF NOT EXISTS format TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'explanation_highlights_format_check') THEN
    ALTER TABLE explanation_highlights
      ADD CONSTRAINT explanation_highlights_format_check
      CHECK (format IS NULL OR format IN ('bold', 'italic'));
  END IF;
END $$;

-- 3) Ensure the color-XOR-format constraint exists (a row is colour OR format).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'explanation_highlights_color_xor_format') THEN
    ALTER TABLE explanation_highlights
      ADD CONSTRAINT explanation_highlights_color_xor_format
      CHECK (
        (color IS NOT NULL AND format IS NULL) OR
        (color IS NULL AND format IS NOT NULL)
      );
  END IF;
END $$;

-- 4) Tell PostgREST to reload its schema cache, so the API sees the `format` column
--    immediately (otherwise inserts/selects referencing it can fail until reload).
NOTIFY pgrst, 'reload schema';
