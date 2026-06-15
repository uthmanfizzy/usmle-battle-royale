-- ── USMLE Battle Royale — Supabase Schema ─────────────────────────────────────
-- Run this in the Supabase SQL Editor to create all tables.
-- Tables with circular FK references (users ↔ clans) are handled with deferred
-- ALTER TABLE statements.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── clans (created first; users.clan_id will reference it) ─────────────────────

CREATE TABLE IF NOT EXISTS clans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        UNIQUE NOT NULL,
  tag         TEXT        UNIQUE NOT NULL CHECK (char_length(tag) BETWEEN 2 AND 4),
  created_by  UUID,       -- FK to users added after users table is created
  total_xp    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── users ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id             TEXT        UNIQUE NOT NULL,
  email                 TEXT,
  username              TEXT,
  avatar_url            TEXT,
  xp                    INTEGER     NOT NULL DEFAULT 0,
  level                 INTEGER     NOT NULL DEFAULT 1,
  games_played          INTEGER     NOT NULL DEFAULT 0,
  games_won             INTEGER     NOT NULL DEFAULT 0,
  coins                 INTEGER     NOT NULL DEFAULT 0,
  gems                  INTEGER     NOT NULL DEFAULT 0,
  best_streak           INTEGER     NOT NULL DEFAULT 0,
  clan_id               UUID        REFERENCES clans(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_username_change  TIMESTAMPTZ,
  study_mode            BOOLEAN     NOT NULL DEFAULT false,
  theme_pref            TEXT        DEFAULT 'default',
  color_pref            TEXT        DEFAULT 'purple'
);

-- Migration: add last_username_change if the table already exists without it
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMPTZ;

-- Migration: UI preference columns (theme axis + accent colour + study mode)
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_pref TEXT DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS color_pref TEXT DEFAULT 'purple';

-- Add FK from clans.created_by → users now that users exists
ALTER TABLE clans
  ADD CONSTRAINT IF NOT EXISTS clans_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ── subject_mastery ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subject_mastery (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject             TEXT    NOT NULL,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct   INTEGER NOT NULL DEFAULT 0,
  mastery_percent     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, subject)
);

-- ── clan_members ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clan_members (
  clan_id    UUID        NOT NULL REFERENCES clans(id)  ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clan_id, user_id)
);

-- ── game_history ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS game_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lobby_id         TEXT        NOT NULL,
  subject          TEXT        NOT NULL,
  placement        INTEGER     NOT NULL,
  xp_earned        INTEGER     NOT NULL DEFAULT 0,
  correct_answers  INTEGER     NOT NULL DEFAULT 0,
  total_questions  INTEGER     NOT NULL DEFAULT 0,
  played_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── announcements ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  category   TEXT        NOT NULL DEFAULT 'Update' CHECK (category IN ('Update', 'News', 'Maintenance', 'Event')),
  pinned     BOOLEAN     NOT NULL DEFAULT false,
  urgent     BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── subjects ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  icon          TEXT        NOT NULL DEFAULT '📚',
  active        BOOLEAN     NOT NULL DEFAULT false,
  min_questions INTEGER     NOT NULL DEFAULT 5,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "server_full_access_subjects"
  ON subjects FOR ALL USING (true) WITH CHECK (true);

-- ── topics ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS topics (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  category   TEXT        NOT NULL,
  difficulty TEXT        NOT NULL DEFAULT 'easy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add difficulty to existing topics tables (safe to run on existing databases)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'easy';
UPDATE topics SET difficulty = 'easy' WHERE difficulty IS NULL;

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "server_full_access_topics"
  ON topics FOR ALL USING (true) WITH CHECK (true);

-- ── topic_groups ──────────────────────────────────────────────────────────────
-- One-level grouping of topics. topics.group_id NULL = ungrouped (legacy behavior).

CREATE TABLE IF NOT EXISTS topic_groups (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  category   TEXT        NOT NULL,
  difficulty TEXT        NOT NULL DEFAULT 'easy',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add group_id to existing topics tables (safe to run on existing databases)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES topic_groups(id) ON DELETE SET NULL;

ALTER TABLE topic_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "server_full_access_topic_groups"
  ON topic_groups FOR ALL USING (true) WITH CHECK (true);

-- ── videos ────────────────────────────────────────────────────────────────────
-- Training Grounds videos (YouTube/Vimeo). Attachment: topic video has topic_id
-- set; category video has category+difficulty set and topic_id NULL. Topic-attached
-- rows also carry category/difficulty (denormalized from the topic at write time)
-- so the public endpoint can filter both kinds with one query.

CREATE TABLE IF NOT EXISTS videos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'youtube',
  embed_id   TEXT NOT NULL,
  topic_id   UUID REFERENCES topics(id) ON DELETE CASCADE,
  category   TEXT,
  difficulty TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_videos" ON videos;
CREATE POLICY "server_full_access_videos"
  ON videos FOR ALL USING (true) WITH CHECK (true);

-- ── journey_chapters ──────────────────────────────────────────────────────────
-- First Aid Journey chapters: first-class journey entities authored in the
-- Journey admin (NOT derived from topic groups). Ordered by sort_order.

CREATE TABLE IF NOT EXISTS journey_chapters (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject    TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_chapters_subject ON journey_chapters(subject);

ALTER TABLE journey_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_journey_chapters" ON journey_chapters;
CREATE POLICY "server_full_access_journey_chapters"
  ON journey_chapters FOR ALL USING (true) WITH CHECK (true);

-- ── journey_levels ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journey_levels (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID        NOT NULL REFERENCES journey_chapters(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_levels_chapter ON journey_levels(chapter_id);

ALTER TABLE journey_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_journey_levels" ON journey_levels;
CREATE POLICY "server_full_access_journey_levels"
  ON journey_levels FOR ALL USING (true) WITH CHECK (true);

-- ── journey_questions ─────────────────────────────────────────────────────────
-- Per-level authored questions. Shape mirrors the solo wire format.

CREATE TABLE IF NOT EXISTS journey_questions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id         UUID        NOT NULL REFERENCES journey_levels(id) ON DELETE CASCADE,
  question         TEXT        NOT NULL,
  options          JSONB       NOT NULL,
  correct          TEXT        NOT NULL,
  explanation      TEXT,
  why_others_wrong JSONB,
  image_url        TEXT,
  explanation_image_url TEXT,
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_questions_level ON journey_questions(level_id);

ALTER TABLE journey_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_journey_questions" ON journey_questions;
CREATE POLICY "server_full_access_journey_questions"
  ON journey_questions FOR ALL USING (true) WITH CHECK (true);

-- ── journey_progress ──────────────────────────────────────────────────────────
-- First Aid Journey per-user level state. level_key is a journey_levels.id (as
-- text), 'boss:{chapter_id}' for chapter bosses, or 'boss:ultimate'.
-- Completion is derived from completed_at — status is never stored separately.
-- The UNIQUE constraint is added by name below (not inline) so fresh and
-- migrated databases end up with exactly one identical constraint.

CREATE TABLE IF NOT EXISTS journey_progress (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject        TEXT        NOT NULL,
  level_key      TEXT        NOT NULL,
  best_score_pct INT         NOT NULL DEFAULT 0,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- MIGRATION (no-difficulty revision — safe to re-run on any database)
ALTER TABLE journey_progress DROP COLUMN IF EXISTS difficulty;
ALTER TABLE journey_progress DROP CONSTRAINT IF EXISTS journey_progress_user_id_subject_difficulty_level_key_key;
ALTER TABLE journey_progress DROP CONSTRAINT IF EXISTS journey_progress_user_subject_level;
ALTER TABLE journey_progress ADD CONSTRAINT journey_progress_user_subject_level UNIQUE (user_id, subject, level_key);

CREATE INDEX IF NOT EXISTS idx_journey_progress_user_subject ON journey_progress(user_id, subject);

ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_journey_progress" ON journey_progress;
CREATE POLICY "server_full_access_journey_progress"
  ON journey_progress FOR ALL USING (true) WITH CHECK (true);

-- ── boss_questions ────────────────────────────────────────────────────────────
-- First Aid Journey boss questions. boss_key: 'chapter:{journey_chapter_id}'
-- | 'ultimate'. Shape mirrors the solo wire format.

CREATE TABLE IF NOT EXISTS boss_questions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT        NOT NULL,
  boss_key         TEXT        NOT NULL,
  question         TEXT        NOT NULL,
  options          JSONB       NOT NULL,
  correct          TEXT        NOT NULL,
  explanation      TEXT,
  why_others_wrong JSONB,
  image_url        TEXT,
  explanation_image_url TEXT,
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- MIGRATION (no-difficulty revision — safe to re-run on any database)
ALTER TABLE boss_questions DROP COLUMN IF EXISTS difficulty;
DROP INDEX IF EXISTS idx_boss_questions_key;
CREATE INDEX IF NOT EXISTS idx_boss_questions_key ON boss_questions(subject, boss_key);

ALTER TABLE boss_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_boss_questions" ON boss_questions;
CREATE POLICY "server_full_access_boss_questions"
  ON boss_questions FOR ALL USING (true) WITH CHECK (true);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_google_id     ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_topics_category     ON topics(category);
CREATE INDEX IF NOT EXISTS idx_subject_mastery_uid ON subject_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_uid    ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan   ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user   ON clan_members(user_id);

-- ── Row-Level Security ─────────────────────────────────────────────────────────
-- The server uses the service-role key (or anon key with these policies) to
-- read/write on behalf of users. Adjust to taste once auth is wired up.

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements  ENABLE ROW LEVEL SECURITY;

-- Allow the server (authenticated via anon key + service role) full access.
-- Replace with fine-grained policies when you add client-side Supabase calls.
CREATE POLICY IF NOT EXISTS "server_full_access_users"
  ON users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "server_full_access_mastery"
  ON subject_mastery FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "server_full_access_clans"
  ON clans FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "server_full_access_clan_members"
  ON clan_members FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "server_full_access_history"
  ON game_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "server_full_access_announcements"
  ON announcements FOR ALL USING (true) WITH CHECK (true);

-- ── game_settings (single-row JSONB — persists admin panel configuration) ──────

CREATE TABLE IF NOT EXISTS game_settings (
  id          TEXT        PRIMARY KEY DEFAULT 'default',
  settings    JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "server_full_access_game_settings"
  ON game_settings FOR ALL USING (true) WITH CHECK (true);
