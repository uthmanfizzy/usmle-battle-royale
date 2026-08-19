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

-- journey_levels also carries a `video_url TEXT` column (added directly in
-- Supabase, not tracked here) — superseded by journey_level_videos below.

-- ── journey_level_videos ──────────────────────────────────────────────────────
-- Recommended videos shown on a level's confirm screen before the player starts
-- it — multiple per level. Platform (YouTube / YouTube Shorts / TikTok /
-- Instagram Reels) is parsed from the raw url at render time via the shared
-- shortEmbeds parser (same source of truth as the Reels feed), so only the
-- url is stored here.

CREATE TABLE IF NOT EXISTS journey_level_videos (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id   UUID        NOT NULL REFERENCES journey_levels(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  title      TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_level_videos_level ON journey_level_videos(level_id);

ALTER TABLE journey_level_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_journey_level_videos" ON journey_level_videos;
CREATE POLICY "server_full_access_journey_level_videos"
  ON journey_level_videos FOR ALL USING (true) WITH CHECK (true);

-- One-time migration from the old single-video column, run once after the
-- table above exists, then drop the now-unused column:
--   INSERT INTO journey_level_videos (level_id, url, sort_order)
--     SELECT id, video_url, 0 FROM journey_levels
--     WHERE video_url IS NOT NULL AND video_url <> '';
--   ALTER TABLE journey_levels DROP COLUMN IF EXISTS video_url;

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

-- ── study_time_daily (DOCUMENTATION ONLY — already live in Supabase) ───────────
-- The table and RPCs below were created directly in the Supabase SQL editor and
-- exist in production. This block documents them so schema.sql stays in sync;
-- do NOT re-run it.
--
-- study_time_daily: one row per user per day, active study seconds
-- CREATE TABLE IF NOT EXISTS study_time_daily (
--   user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   study_date  DATE        NOT NULL,
--   seconds     INTEGER     NOT NULL DEFAULT 0 CHECK (seconds >= 0 AND seconds <= 57600),
--   updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (user_id, study_date)
-- );
-- RLS enabled, no public policies (service-role key on server bypasses RLS).
-- RPCs: add_study_time(p_user_id, p_date, p_seconds), get_study_stats(p_user_id)
-- returning (total_seconds, today_seconds, week_seconds, streak_days).

-- ── guide_sections (DOCUMENTATION ONLY — already live in Supabase) ─────────────
-- Admin-authored sections for the public /guide page. Created directly in the
-- Supabase SQL editor; this block documents the live shape — do NOT re-run it.
--
-- CREATE TABLE IF NOT EXISTS guide_sections (
--   id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   title          TEXT        NOT NULL,
--   content        TEXT,
--   video_type     TEXT,                 -- 'youtube' | 'vimeo' | NULL (parsed server-side)
--   video_embed_id TEXT,                 -- 11-char YouTube id or 6-12 digit Vimeo id
--   video_url      TEXT,                 -- raw admin-pasted URL, kept even if unparseable
--   sort_order     INT         NOT NULL DEFAULT 0,
--   created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- Ordered by sort_order (journey_chapters convention). RLS enabled, server-only
-- access. CRUD: GET /api/guide-sections (public) + POST/PUT/DELETE
-- /admin/guide-sections (adminAuth).

-- ── gear_items / user_gear / purchase_gear_item (DOCUMENTATION ONLY) ───────────
-- Already live in Supabase — created manually in the Supabase SQL editor.
-- This block documents the live shape so schema.sql stays in sync; do NOT
-- re-run it.
--
-- gear_items: the shop's virtual-currency (gems) gear catalog
-- CREATE TABLE IF NOT EXISTS gear_items (
--   id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   name        TEXT        NOT NULL,
--   description TEXT,
--   price_gems  INTEGER     NOT NULL DEFAULT 0 CHECK (price_gems >= 0),
--   sort_order  INT         NOT NULL DEFAULT 0,
--   active      BOOLEAN     NOT NULL DEFAULT true,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- user_gear: ownership rows (collection only — equipping has no gameplay
-- or visual effect anywhere, per locked decision)
-- CREATE TABLE IF NOT EXISTS user_gear (
--   user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   gear_item_id UUID        NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
--   purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (user_id, gear_item_id)
-- );
--
-- RPC: purchase_gear_item(p_user_id UUID, p_gear_item_id UUID)
--   RETURNS TABLE(success BOOLEAN, message TEXT, new_gems INTEGER)
-- The ONLY spend path for users.gems — the Node endpoint just relays it.
-- Atomic inside one transaction: SELECT users.gems FOR UPDATE (row lock, so
-- two near-simultaneous purchases serialize and can't double-spend), verifies
-- the item exists + active ('Item not found'), not already owned ('Already
-- owned'), gems >= price_gems ('Not enough gems'), then decrements gems and
-- inserts the user_gear row. RLS enabled, server-only access (service key).

-- ── game_history.damage_dealt (DOCUMENTATION ONLY) ─────────────────────────────
-- Added directly in the Supabase SQL editor (same drift precedent as
-- game_history.game_mode, which the code inserts but this file predates).
-- Documents the live shape — do NOT re-run:
-- ALTER TABLE game_history ADD COLUMN IF NOT EXISTS damage_dealt INTEGER NOT NULL DEFAULT 0;
-- Written by awardXP for every mode; only pvp_duel produces non-zero values
-- (PVP_DUEL_DAMAGE_PER_HIT per first-correct answer landed).

-- ── journey/boss question-count RPCs (DOCUMENTATION ONLY) ──────────────────────
-- Already live in Supabase — created manually in the Supabase SQL editor.
-- This block documents the live shape so schema.sql stays in sync; do NOT
-- re-run it.
--
-- WHY THESE EXIST: counting questions per level by reading rows in Node
-- (.select('level_id').in('level_id', [...]) then tallying) is silently wrong at
-- scale — PostgREST caps every response at max-rows (1000 on this project) and
-- these scans carry no ORDER BY, so once a subject's question total crossed 1000
-- the surplus rows were dropped arbitrarily and whole levels reported
-- question_count 0. A level showing 0 renders as unplayable on the player path
-- even though its questions were saved correctly. Aggregating inside Postgres
-- returns one row per level instead of one row per question, so the cap is
-- unreachable. Never count these tables by scanning rows again.
--
-- get_journey_question_counts(p_level_ids UUID[])
--   RETURNS TABLE(level_id UUID, question_count BIGINT)
--   SELECT level_id, COUNT(*) FROM journey_questions
--   WHERE level_id = ANY(p_level_ids) GROUP BY level_id;
--   Levels with zero questions are ABSENT from the result (GROUP BY yields no
--   row for them) — callers must apply a `|| 0` fallback.
--
-- get_boss_question_counts(p_boss_keys TEXT[])
--   RETURNS TABLE(boss_key TEXT, question_count BIGINT)
--   SELECT boss_key, COUNT(*) FROM boss_questions
--   WHERE boss_key = ANY(p_boss_keys) GROUP BY boss_key;
--   NOTE: keyed on boss_key ONLY, with no subject parameter. 'chapter:{uuid}'
--   keys are globally unique so that is exact, but the 'ultimate' key REPEATS
--   across subjects — passing 'ultimate' here would sum every subject's ultimate
--   boss. Callers therefore pass only chapter keys to this RPC and count
--   'ultimate' separately with a subject-scoped exact head count.
--
-- Consumed by buildJourneyPath (player path) and GET /admin/journey-counts.

-- ── activity_sessions (DOCUMENTATION ONLY — already live in Supabase) ──────────
-- Created directly in the Supabase SQL editor and exists in production. This
-- block documents the live shape so schema.sql stays in sync; do NOT re-run it.
--
-- One row per player per finished session — the per-session record that neither
-- game_history (multiplayer only, no duration) nor study_time_daily (one bare
-- integer per user per day) can express.
--
-- CREATE TABLE IF NOT EXISTS activity_sessions (
--   id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   game_mode            TEXT        NOT NULL,
--   subject              TEXT,
--   journey_chapter_name TEXT,       -- Journey only; NULL for multiplayer
--   journey_level_name   TEXT,       -- Journey only; NULL for multiplayer
--   outcome_type         TEXT        NOT NULL,  -- 'win_loss' | 'score_pct'
--   is_win               BOOLEAN,    -- set when outcome_type = 'win_loss'
--   score_pct            INT,        -- set when outcome_type = 'score_pct'
--   duration_seconds     INT,
--   started_at           TIMESTAMPTZ,
--   ended_at             TIMESTAMPTZ,
--   created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- WRITERS (Phase 1 — multiplayer only): awardXP in server/index.js writes one
-- row per authenticated player for all six multiplayer modes (battle_royale,
-- scan_master, buzz_fun via endGame; speed_race, trivia_pursuit, pvp_duel via
-- their own end functions — all four end paths call awardXP). Guests are
-- skipped by awardXP's existing `if (!sock?.userId) continue` guard, so they
-- never produce a row. outcome_type is always 'win_loss' here and is_win reuses
-- awardXP's `placement === 1 && player.alive`, the same value that drives
-- users.games_won. Timing comes from lobby.sessionStartedAt, stamped at the top
-- of startGame (the single dispatcher for every mode).
-- The insert is additive and fail-soft: it is wrapped in its own try/catch and
-- checks the returned error, so a failure logs and never disturbs the
-- game_history / XP / mastery / quest writes that precede it.
--
-- NOT YET WIRED: Journey, Training Grounds, plain Solo and AnKing (later
-- phases — none of them has per-attempt tracking today).

-- ── user_question_seen (DOCUMENTATION ONLY — already live in Supabase) ─────────
-- Created directly in the Supabase SQL editor and exists in production. This
-- block documents the live shape so schema.sql stays in sync; do NOT re-run it.
--
-- One row per (user, main-bank question): the "have I met this question before"
-- memory the game never had. Every mode picks questions by shuffling the whole
-- in-memory questionBank, so before this table nothing anywhere recorded that a
-- specific user had already been served a specific question.
--
-- CREATE TABLE IF NOT EXISTS user_question_seen (
--   user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
--   question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
--   answered    BOOLEAN     NOT NULL DEFAULT true,
--   correct     BOOLEAN     NOT NULL DEFAULT false,
--   seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (user_id, question_id)
-- );
--
-- KEY SHAPE TRAP: question_id references questions.id (the UUID surrogate key),
-- NOT questions.question_id (the 'BS-011' business key). The internal question
-- shape INVERTS those names — questionMapper.fromDb maps row.question_id -> `id`
-- and row.id -> `_supabase_id` — so server and client code must write
-- `_supabase_id`. Writing `q.id` fails with 'invalid input syntax for type uuid'.
--
-- The questions FK is also the boundary that keeps other banks out:
-- journey_questions and anking_cards rows are absent from `questions`, so their
-- ids are rejected by Postgres. Both already track themselves (journey_progress,
-- anking_review_state / anking_review_log).
--
-- The composite PK is the upsert conflict target ('user_id,question_id'):
-- re-answering a question overwrites its row with the latest verdict rather than
-- accumulating duplicates. `answered` separates a real submission from a
-- timeout/skip — the player saw the question either way, which is what "seen"
-- means, but only one of those is an attempt.
--
-- WRITERS (all additive, fail-soft, never awaited by game code):
--   - Multiplayer, server-side, at each mode's own grading point so the recorded
--     verdict is the same value the game scored: processAnswers (battle_royale,
--     scan_master), processBuzzFunAnswers, processPvpDuelAnswers,
--     processTriviaAnswer, advanceSpeedPlayer. All route through
--     trackPlayerAnswer, whose io.sockets.sockets.get(id)?.userId lookup drops
--     bots (no socket) and guests (socket, no userId).
--   - Solo / Training Grounds, via POST /api/questions/seen. Those modes grade
--     entirely on the CLIENT, so the server cannot observe individual questions
--     on its own; SoloGame posts one row per answer. The endpoint validates every
--     id against `questions` before writing, so a client cannot record a
--     foreign-bank id and one bad id cannot fail the batch.
--
-- READERS: GET /api/users/:userId/question-bank-progress (head+exact counts —
-- never row scans, per the 1000-row cap lesson above) and GET
-- /api/questions/unseen (page-scan anti-join, same pattern as ankingScanNewCards
-- since PostgREST has no NOT EXISTS).
--
-- CONSUMED BY: the UWorld Adventure page (/uworld-adventure) — see
-- user_prep_pace below.

-- ── user_prep_pace (DOCUMENTATION ONLY — already live in Supabase) ─────────────
-- Created directly in the Supabase SQL editor and exists in production. This
-- block documents the live shape so schema.sql stays in sync; do NOT re-run it.
--
-- One row per (user, subject): how many questions per day that user has
-- committed to for the UWorld Adventure pacing page. A personal preference, not
-- a stat — nothing else reads it and nothing is derived from it server-side.
--
-- CREATE TABLE IF NOT EXISTS user_prep_pace (
--   user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   subject      TEXT        NOT NULL,
--   daily_target INTEGER     NOT NULL,
--   created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (user_id, subject)
-- );
--
-- The composite PK is the upsert conflict target ('user_id,subject'). NOTE:
-- updated_at has NO trigger on this table — POST /api/prep-pace stamps it
-- explicitly, or it would report the row's creation time forever.
--
-- `subject` is a plain subjects.id string with no FK, matching subject_mastery
-- and activity_sessions. Range (1-200) is enforced in the endpoint, not by a
-- CHECK constraint.
--
-- READ  by GET  /api/users/:userId/prep-pace?subject= (own data only — 403 on a
--       mismatched :userId, unlike the public study-stats/mastery endpoints,
--       because a pace is a personal setting rather than a shown-off stat).
-- WRITE by POST /api/prep-pace, debounced client-side so a slider drag saves
--       once at rest. Fail-soft: a lost write returns { ok: false } and the page
--       keeps working with the value already on screen.
--
-- The UWorld Adventure page pairs this with the user_question_seen readers above
-- (question-bank-progress for real total/seen/unseen, /api/questions/unseen for
-- the day's set) and writes one activity_sessions row per finished run via POST
-- /api/question-bank-session (game_mode 'question_bank_practice'). It shows the
-- four ACTIVE subjects only, fetched live from /api/subjects, and deliberately
-- has no "Systems" facet — no real data backs one.

-- ── uworld_question_ratings ─────────────────────────────────────────────────
-- Self-assessment rating shown below the explanation on every UWorld Adventure
-- question (Knowledge Gap / Careless Miss / Lucky Guess / Somewhat Know /
-- Fully Understood), whether the question was just answered fresh or is being
-- reviewed again from the "Review Rated Questions" pile picker. Deliberately
-- the exact same shape and rating strings as hy_flashcard_ratings: one row
-- per (user, question), upserted — a rating always reflects the student's
-- MOST RECENT judgement, there is no history, and re-rating on a later pass
-- just moves the question between piles.
--
-- Reviewing a rated question does NOT create a new user_question_seen row
-- (SoloGame skips that POST entirely when uwaReview is set) — since a
-- question can only ever have a rating after it has already been served
-- once through the normal unseen flow, review sessions can never move the
-- 3,659-question completion total either way.

CREATE TABLE IF NOT EXISTS uworld_question_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rating      TEXT        NOT NULL CHECK (rating IN ('knowledge_gap', 'careless_miss', 'lucky_guess', 'somewhat_know', 'fully_understood')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uworld_question_ratings_user_q ON uworld_question_ratings(user_id, question_id);
-- Powers the rating-group filters (rating-counts, by-rating) without a table scan.
CREATE INDEX IF NOT EXISTS idx_uworld_question_ratings_user_rating ON uworld_question_ratings(user_id, rating);

ALTER TABLE uworld_question_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_full_access_uworld_question_ratings" ON uworld_question_ratings;
CREATE POLICY "server_full_access_uworld_question_ratings"
  ON uworld_question_ratings FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- MODERATOR PERMISSIONS + QUESTION RETIREMENT (doc-only — run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE users     ADD COLUMN IF NOT EXISTS is_admin       BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS retired_at     TIMESTAMPTZ;
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS retired_by     UUID REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS retired_reason TEXT;
-- CREATE INDEX IF NOT EXISTS idx_questions_retired ON questions(retired_at);
--
-- users.is_admin is the MODERATOR flag. It buys exactly two powers, both
-- re-checked server-side by moderatorFrom(req):
--   1. authoring/removing OFFICIAL highlights (previously admin-password only)
--   2. POST /api/questions/:questionId/retire — pulling a bad question mid-game
-- Everything else in /admin stays behind adminAuth (the owner password), so a
-- moderator cannot edit content, change settings, or hand out the flag.
-- moderatorFrom FAILS CLOSED: an unreadable users row means no permission, so a
-- missing is_admin column degrades to "nobody is a moderator" rather than
-- "everybody is".
--
-- retired_at is a SOFT retire, not a delete: this is tapped during a live game,
-- so a mis-tap must cost nothing. loadQuestionsFromDB() filters `.is('retired_at',
-- null)`, which is the single choke point feeding questionBank — every
-- multiplayer mode plus Solo/Training Grounds. The two endpoints that query
-- `questions` directly rather than through the bank (/api/questions/unseen and
-- question-bank-progress) carry the same filter explicitly, on BOTH the total and
-- the seen count, or progress would exceed a total that no longer includes it.
--
-- READ  by GET  /admin/retired-questions (owner only; joins users for the name).
-- WRITE by POST /api/questions/:questionId/retire (moderator or owner) and
--       POST /admin/retired-questions/:id/restore (owner; clears all three
--       columns and force-refreshes the bank).
-- Note the retire route keys on questions.question_id (the TEXT business key)
-- because that is the id the client holds mid-game — `id` is the UUID.

-- ─────────────────────────────────────────────────────────────────────────────
-- JOURNEY/BOSS QUESTION RETIREMENT (doc-only — run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE journey_questions ADD COLUMN IF NOT EXISTS retired_at     TIMESTAMPTZ;
-- ALTER TABLE journey_questions ADD COLUMN IF NOT EXISTS retired_by     UUID REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE journey_questions ADD COLUMN IF NOT EXISTS retired_reason TEXT;
-- ALTER TABLE boss_questions    ADD COLUMN IF NOT EXISTS retired_at     TIMESTAMPTZ;
-- ALTER TABLE boss_questions    ADD COLUMN IF NOT EXISTS retired_by     UUID REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE boss_questions    ADD COLUMN IF NOT EXISTS retired_reason TEXT;
--
-- The main-bank retire feature above (users.is_admin / moderatorFrom) shipped
-- first and only covered the `questions` table. A moderator flagging a bad
-- question while playing First Aid Journey got a hard 404 — journey_questions
-- and boss_questions are SEPARATE tables with their own UUID id space, and the
-- client was correctly sending that UUID, but the retire route only ever
-- matched against `questions.question_id`, which the id was never a member of.
--
-- Fix: journey_questions and boss_questions get their own retired_at/by/reason
-- columns and their own retire routes, keyed on `id` directly (these tables
-- have no separate business-key column) —
--   POST /api/journey-questions/:id/retire
--   POST /api/boss-questions/:id/retire
-- both moderatorFrom-gated exactly like the main route. GET /api/journey-
-- questions and GET /api/boss-questions filter `.is('retired_at', null)`,
-- guarded by hasJourneyRetirement/hasBossRetirement — the same deploy-order
-- safety as the main bank's hasRetirement: an unknown column would otherwise
-- fail the WHOLE select and silently empty a live level before this migration
-- runs, so a missing-column error flips the flag off and retries unfiltered.
--
-- GET /admin/retired-questions now unions all three tables (tagged `source`:
-- 'main' | 'journey' | 'boss') into ONE review queue — a moderator can pull
-- from any of them, so the owner needs one place to see and undo all of it.
-- POST /admin/retired-questions/:id/restore takes ?source= to route the update
-- to the right table; only 'main' triggers forceRefreshQuestions() afterward,
-- since journey/boss questions are read live per-request and were never cached.

-- ─────────────────────────────────────────────────────────────────────────────
-- FIRST AID JOURNEY BONUS QUESTIONS (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE journey_questions ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN NOT NULL DEFAULT false;
--
-- CREATE OR REPLACE FUNCTION get_journey_bonus_counts(p_level_ids UUID[])
-- RETURNS TABLE(level_id UUID, question_count BIGINT)
-- LANGUAGE sql STABLE
-- AS $$
--   SELECT level_id, COUNT(*) AS question_count
--   FROM journey_questions
--   WHERE level_id = ANY(p_level_ids) AND is_bonus = true
--   GROUP BY level_id;
-- $$;
--
-- Mirrors get_journey_question_counts exactly (see the block above) and exists
-- for the SAME reason: counting by scanning rows in Node is capped at
-- PostgREST's max-rows (1000) and silently under-reports past it. Levels with
-- no bonus questions are ABSENT from the result — buildJourneyPath applies the
-- same `|| 0` fallback it already uses for the main count.
--
-- WHY BONUS QUESTIONS: an admin-curated reward round per level. A question is
-- marked is_bonus from the Journey admin (a toggle per question in
-- JourneyPanel/JourneyEditor, PUT /admin/journey-questions/:id). Bonus is an
-- EXCLUSIVE pool, never mixed into normal play: GET /api/journey-questions
-- filters `is_bonus = false` by default and `is_bonus = true` only when the
-- request explicitly asks with ?bonus=1. A level's bonus round unlocks once
-- the player's best_score_pct on THAT level exceeds JOURNEY_BONUS_THRESHOLD_PCT
-- (80, server constant — "more than 80%" per the original ask, strictly
-- greater-than and deliberately separate from the admin-configurable PASS
-- threshold used for progression).
--
-- Bonus rounds do NOT write journey_progress and do not affect the unlock
-- chain, mastery, or stars — they are a side pool for a player who already
-- passed, not a second progression track. The client marks a bonus run with
-- isBonus in journeyContext/journeyReentry, and JourneyMode's reentry effect
-- short-circuits before the /api/journey/complete POST when it sees that flag,
-- showing its own lightweight "Bonus Round Complete" card instead of the
-- normal pass/fail interstitial.
--
-- Deploy-order safety, same shape as the retirement columns: an unknown
-- is_bonus column would otherwise fail the WHOLE journey-questions select and
-- silently empty a live level. hasJourneyBonus tracks whether the column has
-- been proven to exist; a normal (non-bonus) request that hits the missing
-- column falls back to unfiltered (today's behaviour), while a bonus request
-- returns an honest empty list rather than leaking the whole level into what
-- is supposed to be an exclusive pool. Once the flag flips false, EVERY later
-- bonus request short-circuits to empty before querying at all — falling
-- through to "query without the filter" for a bonus request would serve the
-- level's normal questions as if they were the bonus set.

-- ─────────────────────────────────────────────────────────────────────────────
-- HY FLASHCARDS (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS hy_flashcards (
--   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   subject    TEXT        NOT NULL,
--   topic_id   UUID        REFERENCES hy_flashcard_topics(id) ON DELETE SET NULL,  -- SUPERSEDED, see below
--   front      TEXT        NOT NULL,
--   back       TEXT        NOT NULL,
--   sort_order INT         NOT NULL DEFAULT 0,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_hy_flashcards_subject ON hy_flashcards(subject);
-- CREATE INDEX IF NOT EXISTS idx_hy_flashcards_topic   ON hy_flashcards(topic_id);
-- ALTER TABLE hy_flashcards ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "server_full_access_hy_flashcards" ON hy_flashcards;
-- CREATE POLICY "server_full_access_hy_flashcards"
--   ON hy_flashcards FOR ALL USING (true) WITH CHECK (true);
--
-- CREATE OR REPLACE FUNCTION get_hy_flashcard_counts()
-- RETURNS TABLE(subject TEXT, topic_id UUID, card_count BIGINT)
-- LANGUAGE sql STABLE
-- AS $$
--   SELECT subject, topic_id, COUNT(*) AS card_count
--   FROM hy_flashcards
--   GROUP BY subject, topic_id;
-- $$;
--
-- WHY NOT anking_cards: that table carries AnKing's whole spaced-repetition
-- apparatus (cloze ordinals, anki_note_id, per-user review state) for a
-- feature that just needs an admin to type or paste front/back pairs and a
-- student to browse them in order. hy_flashcards is deliberately its own small
-- table rather than bolting a second, unrelated content type onto AnKing's.
--
-- topic_id originally reused the SAME topics table Training Grounds has — see
-- the SUPERSEDED note below for why that changed. topic_id NULL = "General"
-- (subject-wide, no specific topic).
--
-- get_hy_flashcard_counts exists for the same reason the Journey counts RPCs
-- do: counting by scanning rows in Node is capped at PostgREST's max-rows
-- (1000) and silently under-reports past it. GET /api/hy-flashcards/menu is
-- the ONE place that needs a global count and is the only caller.
--
-- Endpoints:
--   Admin (adminAuth): GET/POST/PUT/DELETE /admin/hy-flashcards[/:id],
--     POST .../bulk-delete { ids }, POST .../bulk-import { subject, topic_id,
--     cards: [{front,back}] } — one insert for the whole paste, not N POSTs,
--     since a front/back pair has nothing to validate beyond "both non-empty".
--   Student (public): GET /api/hy-flashcards/menu (subject/topic picker data),
--     GET /api/hy-flashcards?subject=&topic_id= (topic_id ABSENT means every
--     card in the subject — the broad "study it all" option — present narrows
--     to that topic; the admin GET defaults the opposite way on purpose, since
--     it is always editing one specific bucket).
--   POST /api/hy-flashcards/session-complete (requireAuth): mirrors
--     /api/anking/session-complete exactly — one activity_sessions row plus an
--     add_study_time credit, so flashcard study counts toward Study Time too.

-- ─────────────────────────────────────────────────────────────────────────────
-- HY FLASHCARD TOPICS — dedicated topic list (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS hy_flashcard_topics (
--   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   subject    TEXT        NOT NULL,
--   name       TEXT        NOT NULL,
--   sort_order INT         NOT NULL DEFAULT 0,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_hy_flashcard_topics_subject ON hy_flashcard_topics(subject);
-- ALTER TABLE hy_flashcard_topics ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "server_full_access_hy_flashcard_topics" ON hy_flashcard_topics;
-- CREATE POLICY "server_full_access_hy_flashcard_topics"
--   ON hy_flashcard_topics FOR ALL USING (true) WITH CHECK (true);
--
-- -- Repoint hy_flashcards.topic_id at the new table instead of `topics`. Ran
-- -- while hy_flashcards held zero rows, so no backfill/cleanup was needed —
-- -- if you are running this later with real cards already tagged onto a
-- -- Training Grounds topic, null those out FIRST (they will not resolve to
-- -- anything in hy_flashcard_topics):
-- --   UPDATE hy_flashcards SET topic_id = NULL;
-- ALTER TABLE hy_flashcards DROP CONSTRAINT IF EXISTS hy_flashcards_topic_id_fkey;
-- ALTER TABLE hy_flashcards ADD CONSTRAINT hy_flashcards_topic_id_fkey
--   FOREIGN KEY (topic_id) REFERENCES hy_flashcard_topics(id) ON DELETE SET NULL;
--
-- WHY: hy_flashcards.topic_id originally pointed at the shared `topics` table
-- (Training Grounds/Solo's topic list), on the assumption that "a topic" was
-- one thing across the app. In practice that meant the HY Flashcards topic
-- picker showed every OTHER game mode's topics too — an admin curating HY
-- Flashcards had to wade through Training Grounds' whole topic tree to find
-- (or realise they needed to make) a topic of their own. hy_flashcard_topics
-- is a topic list OWNED BY this feature: one flat list per subject, authored
-- from the HY Flashcards admin tab itself (GET/POST/PUT/DELETE
-- /admin/hy-flashcard-topics), never shown to or shared with any other mode.
-- Deleting a topic does not delete its cards — ON DELETE SET NULL drops them
-- back to General.
--
-- get_hy_flashcard_counts and GET /api/hy-flashcards/menu are UNCHANGED by
-- this — they only ever stored/looked up a topic_id and a count, never cared
-- which table that id belonged to. The menu's topic-name lookup now reads
-- hy_flashcard_topics instead of topics; that is the only touched query.

-- ─────────────────────────────────────────────────────────────────────────────
-- HY FLASHCARD CHAPTERS — chapters now sit above topics (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS hy_flashcard_chapters (
--   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   subject    TEXT        NOT NULL,
--   name       TEXT        NOT NULL,
--   sort_order INT         NOT NULL DEFAULT 0,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_hy_flashcard_chapters_subject ON hy_flashcard_chapters(subject);
-- ALTER TABLE hy_flashcard_chapters ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "server_full_access_hy_flashcard_chapters" ON hy_flashcard_chapters;
-- CREATE POLICY "server_full_access_hy_flashcard_chapters"
--   ON hy_flashcard_chapters FOR ALL USING (true) WITH CHECK (true);
--
-- -- hy_flashcard_topics REPOINTED: a topic now belongs to a chapter, not
-- -- directly to a subject (subject is derived by joining through the
-- -- chapter). Ran while hy_flashcard_topics held zero rows (this table
-- -- shipped the session before and nothing had been created into it yet), so
-- -- there was nothing to migrate — the old `subject` column is simply
-- -- dropped. If you are ever running this against a database that ALREADY
-- -- has real topics in it, back them up first; there is no automatic mapping
-- -- from "a topic with a subject" to "a topic inside some chapter".
-- ALTER TABLE hy_flashcard_topics DROP COLUMN IF EXISTS subject;
-- ALTER TABLE hy_flashcard_topics ADD COLUMN IF NOT EXISTS chapter_id UUID;
-- ALTER TABLE hy_flashcard_topics
--   ADD CONSTRAINT hy_flashcard_topics_chapter_id_fkey
--   FOREIGN KEY (chapter_id) REFERENCES hy_flashcard_chapters(id) ON DELETE CASCADE;
-- ALTER TABLE hy_flashcard_topics ALTER COLUMN chapter_id SET NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_hy_flashcard_topics_chapter ON hy_flashcard_topics(chapter_id);
--
-- WHY: "allow me to create chapters and then within the chapter I can create
-- topics" — mirrors First Aid Journey's own chapter -> level shape
-- (journey_chapters -> journey_levels), just with a topic holding many
-- flashcards instead of a level holding questions directly. General
-- (hy_flashcards.topic_id IS NULL) is UNCHANGED — it stays a subject-wide
-- catch-all that sits ALONGSIDE chapters, not nested inside one; there is no
-- "chapter with no topic" bucket.
--
-- Deleting a chapter CASCADEs to its topics, which in turn drop their cards
-- back to General via hy_flashcards.topic_id's existing ON DELETE SET NULL —
-- a chapter delete removes organisation, never content.
--
-- GET /api/hy-flashcards/menu now returns, per subject: general_count, and
-- chapters: [{ id, name, topics: [{ id, name, count }] }] — a chapter with no
-- topic that has a card is simply absent, same "if there is a topic made"
-- rule the topic level already followed. get_hy_flashcard_counts is
-- UNCHANGED (still just subject/topic_id/count); the menu now does one extra
-- join (topic -> its chapter) to build the nesting.

-- ─────────────────────────────────────────────────────────────────────────────
-- HY FLASHCARD EXPLANATIONS (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE hy_flashcards ADD COLUMN IF NOT EXISTS explanation TEXT;
--
-- Optional third field alongside front (question) and back (answer) — a brief
-- "why" shown under the answer once a card is flipped. Nullable: existing and
-- future cards with no explanation behave exactly as before, the section
-- simply does not render.
--
-- Bulk import gains a third pipe/tab-separated field: "Front | Back |
-- Explanation" (or the Anki-export tab equivalent). The explanation segment
-- is optional — a two-field line still imports exactly as before.

-- ─────────────────────────────────────────────────────────────────────────────
-- HY FLASHCARD SELF-RATINGS (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS hy_flashcard_ratings (
--   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   card_id    UUID        NOT NULL REFERENCES hy_flashcards(id) ON DELETE CASCADE,
--   rating     TEXT        NOT NULL CHECK (rating IN ('knowledge_gap','careless_miss','lucky_guess','somewhat_know','fully_understood')),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_hy_flashcard_ratings_user_card ON hy_flashcard_ratings(user_id, card_id);
-- ALTER TABLE hy_flashcard_ratings ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "server_full_access_hy_flashcard_ratings" ON hy_flashcard_ratings;
-- CREATE POLICY "server_full_access_hy_flashcard_ratings"
--   ON hy_flashcard_ratings FOR ALL USING (true) WITH CHECK (true);
--
-- Table already live? Widen the existing CHECK constraint instead of
-- recreating the table (run in the SQL editor):
--   ALTER TABLE hy_flashcard_ratings DROP CONSTRAINT hy_flashcard_ratings_rating_check;
--   ALTER TABLE hy_flashcard_ratings ADD CONSTRAINT hy_flashcard_ratings_rating_check
--     CHECK (rating IN ('knowledge_gap','careless_miss','lucky_guess','somewhat_know','fully_understood'));
--
-- WHY: after flipping a card, the student judges their OWN recall — not a
-- right/wrong grade, since flashcards aren't scored — into one of four
-- buckets: Knowledge Gap, Careless Miss, Lucky Guess, Fully Understood. One
-- row per (user, card): a rating always reflects the student's MOST RECENT
-- judgement of that card, there is no history — re-rating on a later study
-- pass just moves the card between piles via the UNIQUE(user_id, card_id)
-- upsert (onConflict: 'user_id,card_id').
--
-- Restudying a topic offers a pile picker built from these ratings — "Study
-- All", one option per rating, plus "Not Yet Rated" — so a student can focus
-- specifically on, say, their Careless Miss pile instead of the whole topic.
--
-- WRITE by POST /api/hy-flashcards/:cardId/rate { rating } (requireAuth).
-- READ  by GET  /api/hy-flashcards/ratings?subject=&topic_id= (requireAuth) —
-- same subject/topic_id scoping as the public GET /api/hy-flashcards, so the
-- pile picker computes counts from cards it already fetched, no per-pile
-- round trip. Deleting a card or a user cascades its ratings away; deleting a
-- topic/chapter does NOT touch ratings (cards move to General, keep their
-- ratings — a rating belongs to the card, not to wherever it's currently
-- organised).

-- ─────────────────────────────────────────────────────────────────────────────
-- DAILY ACTIVITY GAP NOTES (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS activity_gap_notes (
--   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   gap_start  TIMESTAMPTZ NOT NULL,
--   note       TEXT        NOT NULL,
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_gap_notes_user_gap ON activity_gap_notes(user_id, gap_start);
-- ALTER TABLE activity_gap_notes ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "server_full_access_activity_gap_notes" ON activity_gap_notes;
-- CREATE POLICY "server_full_access_activity_gap_notes"
--   ON activity_gap_notes FOR ALL USING (true) WITH CHECK (true);
--
-- WHY: the Daily Activity page renders a vertical timeline of one day's
-- activity_sessions, with a "break" block wherever two consecutive sessions are
-- more than 10 minutes apart. This table lets the OWNER annotate a break with
-- why it happened ("work shift", "sick", "revised on paper") so the day reads
-- as a story rather than a set of unexplained holes.
--
-- KEYED BY gap_start: the instant the gap begins, which is the end of the
-- session before it. Not by (date, index) — an index would shift the moment a
-- backfilled session lands earlier in the day, silently re-pointing every note.
-- If a gap later SPLITS because a session lands inside it, the first half keeps
-- the same start instant, so the note stays with it.
--
-- PRIVACY: /activity/:userId is a public page, but "why I didn't study" is
-- personal. Both endpoints are requireAuth and scoped to req.userId — notes are
-- never returned for anyone but their author, and the client only renders the
-- editor when you are viewing your own timeline.

-- ─────────────────────────────────────────────────────────────────────────────
-- HY FLASHCARDS — CARDS DIRECTLY IN A CHAPTER (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE hy_flashcards ADD COLUMN IF NOT EXISTS chapter_id UUID
--   REFERENCES hy_flashcard_chapters(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_hy_flashcards_chapter ON hy_flashcards(chapter_id);
--
-- -- The counts RPC gains chapter_id. DROP first: CREATE OR REPLACE cannot
-- -- change a function's return type, it errors with "cannot change return type
-- -- of existing function".
-- DROP FUNCTION IF EXISTS get_hy_flashcard_counts();
-- CREATE FUNCTION get_hy_flashcard_counts()
-- RETURNS TABLE(subject TEXT, topic_id UUID, chapter_id UUID, card_count BIGINT)
-- LANGUAGE sql STABLE
-- AS $$
--   SELECT subject, topic_id, chapter_id, COUNT(*) AS card_count
--   FROM hy_flashcards
--   GROUP BY subject, topic_id, chapter_id;
-- $$;
--
-- WHY: "allow me to put questions within a chapter and not necessarily in a
-- topic section". Until now a card was either in a topic or in General (the
-- subject-wide catch-all) — there was no way to say "this belongs to this
-- chapter" without first inventing a topic to hold it.
--
-- THREE BUCKETS, resolved in this order:
--   topic_id set                 -> that topic
--   topic_id NULL, chapter_id set -> the chapter's OWN cards
--   both NULL                     -> General
--
-- chapter_id is only ever meaningful when topic_id IS NULL. A card inside a
-- topic already knows its chapter THROUGH that topic, so storing it a second
-- time on the card would be two sources of truth that can disagree; the write
-- endpoints force chapter_id to NULL whenever topic_id is set.
--
-- ON DELETE SET NULL, matching topic_id: deleting a chapter drops its own
-- cards to General rather than destroying them. (Its topics still CASCADE
-- away, and their cards likewise fall back to General.) A chapter delete
-- removes organisation, never content — unchanged.
--
-- DEPLOY ORDER: the server treats the column as optional (hasHyChapterId,
-- same ratchet as hy_flashcards.explanation). Before this migration runs the
-- chapter bucket simply does not exist: General still means "no topic", the
-- admin tree reports needs_migration for a chapter bucket instead of silently
-- showing General's cards, and the menu returns no direct_count. Nothing
-- breaks, the feature just isn't there yet.

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGHLIGHTS ON JOURNEY / BOSS QUESTIONS (run in the SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE explanation_highlights
--   DROP CONSTRAINT IF EXISTS explanation_highlights_question_id_fkey;
--
-- WHY: explanation_highlights.question_id carried a foreign key into the main
-- `questions` table, so highlighting was silently impossible on First Aid
-- Journey levels and bosses — those live in journey_questions / boss_questions
-- with their own UUID id space, so every insert was rejected:
--
--   insert or update on table "explanation_highlights" violates foreign key
--   constraint "explanation_highlights_question_id_fkey"  (SQLSTATE 23503)
--
-- The client creates the highlight optimistically and rolls it back when the
-- POST fails, so the only symptom was the highlight appearing for a moment and
-- then vanishing, with nothing on screen to say why.
--
-- question_id becomes a plain id spanning all three question tables. That is
-- already how the rest of the app treats these ids — activity_sessions and the
-- retirement queue both work across main/journey/boss the same way, and the
-- POST route resolves nothing through the FK, it only inserts the id it was
-- given.
--
-- TRADE-OFF: dropping the FK also drops its ON DELETE cascade, so deleting a
-- main-bank question now leaves its highlight rows behind. They are inert —
-- every read filters by question_id, so orphans are never served — but they do
-- accumulate. To clear them out later:
--   DELETE FROM explanation_highlights h
--    WHERE NOT EXISTS (SELECT 1 FROM questions        q WHERE q.question_id = h.question_id)
--      AND NOT EXISTS (SELECT 1 FROM journey_questions j WHERE j.id::text   = h.question_id)
--      AND NOT EXISTS (SELECT 1 FROM boss_questions    b WHERE b.id::text   = h.question_id);
