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
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id     TEXT        UNIQUE NOT NULL,
  email         TEXT,
  username      TEXT,
  avatar_url    TEXT,
  xp            INTEGER     NOT NULL DEFAULT 0,
  level         INTEGER     NOT NULL DEFAULT 1,
  games_played  INTEGER     NOT NULL DEFAULT 0,
  games_won     INTEGER     NOT NULL DEFAULT 0,
  clan_id       UUID        REFERENCES clans(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_google_id     ON users(google_id);
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
