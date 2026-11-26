-- ─────────────────────────────────────────────────────────────────────────
-- Week Planner: one study plan per player per week
-- Run this in the Supabase SQL editor. Safe to run more than once.
-- Until it runs, plans are kept in the player's browser only.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_plans (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE        NOT NULL,              -- the Monday of the week, local
  plan       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, week_start)
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server_full_access_study_plans" ON study_plans;
CREATE POLICY "server_full_access_study_plans"
  ON study_plans FOR ALL USING (true) WITH CHECK (true);
