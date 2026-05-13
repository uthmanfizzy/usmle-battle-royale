-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE DAILY QUESTS TABLES
-- Run this SQL in the Supabase Dashboard SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add coins and gems columns to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- Quest definitions (the pool of available quests)
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎮',
  quest_type TEXT NOT NULL,
  target INTEGER NOT NULL DEFAULT 1,
  coin_reward INTEGER DEFAULT 0,
  gem_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'easy',
  active BOOLEAN DEFAULT true,
  pinned_day INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily quest selections (which 3 quests are active each day)
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  quest_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player progress on quests
CREATE TABLE IF NOT EXISTS player_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  rewards_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(active);
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests(difficulty);
CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(date);
CREATE INDEX IF NOT EXISTS idx_player_quest_progress_user ON player_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_player_quest_progress_date ON player_quest_progress(date);
CREATE INDEX IF NOT EXISTS idx_player_quest_progress_user_date ON player_quest_progress(user_id, date);

-- Enable RLS
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_quest_progress ENABLE ROW LEVEL SECURITY;

-- Policies for quests table (read-only for players, full access for service role)
CREATE POLICY "Allow public read access to quests" ON quests
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to quests" ON quests
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for daily_quests table
CREATE POLICY "Allow public read access to daily_quests" ON daily_quests
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to daily_quests" ON daily_quests
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for player_quest_progress table
CREATE POLICY "Allow users to read own progress" ON player_quest_progress
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to player_quest_progress" ON player_quest_progress
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_quests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_quests_updated_at ON quests;
CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_quests_updated_at();

DROP TRIGGER IF EXISTS update_player_quest_progress_updated_at ON player_quest_progress;
CREATE TRIGGER update_player_quest_progress_updated_at
  BEFORE UPDATE ON player_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_quests_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- Insert some default quests
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO quests (name, description, icon, quest_type, target, coin_reward, xp_reward, difficulty) VALUES
  ('Play 2 Games', 'Complete any 2 game matches', '🎮', 'play_games', 2, 100, 50, 'easy'),
  ('Play 3 Games', 'Complete any 3 game matches', '🎮', 'play_games', 3, 150, 75, 'easy'),
  ('Answer 10 Correctly', 'Get 10 questions right', '❓', 'correct_answers', 10, 150, 100, 'easy'),
  ('Answer 25 Correctly', 'Get 25 questions right', '❓', 'correct_answers', 25, 300, 200, 'medium'),
  ('Win a Battle Royale', 'Come in 1st place in Battle Royale', '⚔️', 'win_battle_royale', 1, 300, 150, 'medium'),
  ('Win 2 Battle Royales', 'Win 2 Battle Royale matches', '⚔️', 'win_battle_royale', 2, 500, 250, 'hard'),
  ('Win a Speed Race', 'Come in 1st place in Speed Race', '⚡', 'win_speed_race', 1, 250, 125, 'medium'),
  ('Complete 5 Tower Floors', 'Clear 5 floors in The Tower', '🏰', 'tower_floors', 5, 200, 100, 'easy'),
  ('Complete 10 Tower Floors', 'Clear 10 floors in The Tower', '🏰', 'tower_floors', 10, 400, 200, 'medium'),
  ('Get 5 Streak', 'Answer 5 questions correct in a row', '🔥', 'streak', 5, 200, 100, 'medium'),
  ('Get 10 Streak', 'Answer 10 questions correct in a row', '🔥', 'streak', 10, 400, 200, 'hard'),
  ('Play 2 Different Modes', 'Try 2 different game modes today', '📚', 'different_modes', 2, 150, 75, 'easy'),
  ('Play All 3 Modes', 'Play Battle Royale, Speed Race, and Tower', '🏆', 'different_modes', 3, 300, 150, 'medium')
ON CONFLICT DO NOTHING;
