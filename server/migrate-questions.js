/**
 * Migration Script: Migrate questions from questions.js to Supabase
 *
 * Run this ONCE with: node migrate-questions.js
 *
 * This script will:
 * 1. Create the questions table in Supabase (if it doesn't exist)
 * 2. Read all questions from questions.js
 * 3. Insert them into the Supabase questions table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const questions = require('./questions');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('Creating questions table...');

  // Note: This SQL should be run in Supabase Dashboard SQL Editor if RLS or permissions block it
  const createTableSQL = `
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

    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
    CREATE INDEX IF NOT EXISTS idx_questions_game_modes ON questions USING GIN(game_modes);
  `;

  try {
    // Try to check if table exists first
    const { data, error } = await supabase.from('questions').select('id').limit(1);
    if (!error) {
      console.log('Questions table already exists');
      return true;
    }

    console.log('Table does not exist. Please run this SQL in Supabase Dashboard SQL Editor:');
    console.log('='.repeat(80));
    console.log(createTableSQL);
    console.log('='.repeat(80));
    console.log('\nAfter creating the table, run this script again to migrate questions.');
    return false;
  } catch (err) {
    console.error('Error checking table:', err.message);
    return false;
  }
}

async function migrateQuestions() {
  console.log(`\nMigrating ${questions.length} questions to Supabase...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);

    const records = batch.map(q => ({
      question_id: q.id,
      question: q.question,
      choices: q.options,
      correct: q.correct,
      explanation: q.explanation || '',
      category: q.subject,
      difficulty: q.difficulty || 'easy',
      game_modes: q.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
      topic_id: q.topic_id || null,
      tower_floor: q.tower_floor || null,
      image_url: q.image_url || null,
      question_type: q.question_type || 'mcq',
      buzz_type: q.buzz_type || null,
    }));

    const { data, error } = await supabase
      .from('questions')
      .upsert(records, { onConflict: 'question_id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += (data?.length || 0);
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Inserted/Updated ${data?.length || 0} questions`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Migration Complete!');
  console.log(`  Inserted/Updated: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log('='.repeat(50));
}

async function verifyMigration() {
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error verifying migration:', error.message);
    return;
  }

  console.log(`\nVerification: ${count} questions now in Supabase`);
  console.log(`Original questions.js had: ${questions.length} questions`);

  if (count === questions.length) {
    console.log('✓ All questions migrated successfully!');
  } else if (count > questions.length) {
    console.log('✓ Supabase has more questions (some may have been added via admin panel)');
  } else {
    console.log('⚠ Some questions may not have been migrated. Check for errors above.');
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Questions Migration to Supabase');
  console.log('='.repeat(50));

  const tableReady = await createTable();
  if (!tableReady) {
    return;
  }

  await migrateQuestions();
  await verifyMigration();
}

main().catch(console.error);
