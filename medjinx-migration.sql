-- ─────────────────────────────────────────────────────────────────────────
-- MedJinx: answers the bank did not recognise
-- Run this once in the Supabase SQL editor. OPTIONAL — MedJinx plays
-- without it.
--
-- MedJinx only pays points for answers a person has written into the bank
-- (server/medjinx/bank). Anything a player types that is in neither a
-- topic's accepted answers nor its known-wrong ones scores nothing and is
-- recorded here, so somebody can decide whether it is a correct association
-- the bank is missing or a wrong one worth adding as a trap.
--
-- One row per unrecognised answer, per round it was typed in. `norm` is the
-- matcher's normalised form, so the same answer spelled three ways groups
-- together:
--
--   SELECT topic_id, norm, MIN(answer) AS example, COUNT(*) AS times
--   FROM medjinx_unmatched
--   GROUP BY topic_id, norm
--   ORDER BY times DESC;
--
-- Without this table the same list is still kept in memory since the last
-- server restart, at GET /admin/medjinx/review.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medjinx_unmatched (
  id         BIGSERIAL   PRIMARY KEY,
  topic_id   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  norm       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medjinx_unmatched_topic_norm ON medjinx_unmatched(topic_id, norm);

ALTER TABLE medjinx_unmatched ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_medjinx_unmatched" ON medjinx_unmatched;
CREATE POLICY "server_full_access_medjinx_unmatched"
  ON medjinx_unmatched FOR ALL USING (true) WITH CHECK (true);
