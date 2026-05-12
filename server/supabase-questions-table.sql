-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE QUESTIONS TABLE
-- Run this SQL in the Supabase Dashboard SQL Editor to create the questions table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create the questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct TEXT NOT NULL,
  explanation TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy',
  game_modes JSONB DEFAULT '["battle_royale","speed_race","trivia_pursuit"]'::jsonb,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  tower_floor INTEGER,
  image_url TEXT,
  question_type TEXT DEFAULT 'mcq',
  buzz_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_game_modes ON questions USING GIN(game_modes);
CREATE INDEX IF NOT EXISTS idx_questions_tower_floor ON questions(tower_floor);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for game clients)
CREATE POLICY "Allow public read access" ON questions
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update/delete (for admin panel)
-- Note: The server uses service_role key which bypasses RLS
CREATE POLICY "Allow service role full access" ON questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- After running this SQL, run the migration script:
--   cd server && node migrate-questions.js
-- ═══════════════════════════════════════════════════════════════════════════════
