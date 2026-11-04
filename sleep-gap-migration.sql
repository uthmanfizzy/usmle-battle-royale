-- ─────────────────────────────────────────────────────────────────────────
-- Daily Activity: marking a gap as sleep
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────

-- If activity_gap_notes does NOT exist yet, this creates it with everything:
CREATE TABLE IF NOT EXISTS activity_gap_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gap_start  TIMESTAMPTZ NOT NULL,
  note       TEXT        NOT NULL DEFAULT '',
  kind       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If it already existed, these bring it up to date. Safe to run either way.
ALTER TABLE activity_gap_notes ADD COLUMN IF NOT EXISTS kind TEXT;
ALTER TABLE activity_gap_notes ALTER COLUMN note SET DEFAULT '';
ALTER TABLE activity_gap_notes ALTER COLUMN note DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_gap_notes_user_gap
  ON activity_gap_notes(user_id, gap_start);

ALTER TABLE activity_gap_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server_full_access_activity_gap_notes" ON activity_gap_notes;
CREATE POLICY "server_full_access_activity_gap_notes"
  ON activity_gap_notes FOR ALL USING (true) WITH CHECK (true);
