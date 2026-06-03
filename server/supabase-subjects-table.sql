-- Subjects table for managing active/inactive medical subjects
-- Drop existing table if it has wrong structure (UUID instead of TEXT)
DROP TABLE IF EXISTS subjects CASCADE;

CREATE TABLE subjects (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  icon          TEXT,
  active        BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY IF NOT EXISTS "public_read_subjects"
  ON subjects FOR SELECT
  USING (true);

-- Allow server/admin full access
CREATE POLICY IF NOT EXISTS "server_full_access_subjects"
  ON subjects FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default subjects if table is empty
INSERT INTO subjects (id, name, icon, active)
VALUES
  ('cardiology',       'Cardiology',                  '❤️',  true),
  ('neurology',        'Neurology',                   '🧠', true),
  ('pharmacology',     'Pharmacology',                '💊', true),
  ('microbiology',     'Microbiology',                '🦠', true),
  ('biochemistry',     'Biochemistry',                '⚗️', true),
  ('biostatistics',    'Biostatistics',               '📊', true),
  ('pathology',        'Pathology',                   '🔬', false),
  ('pulmonology',      'Pulmonology',                 '🫁', false),
  ('nephrology',       'Nephrology',                  '💧', false),
  ('gastroenterology', 'Gastroenterology',            '🫃', false),
  ('endocrinology',    'Endocrinology',               '🦋', false),
  ('haematology',      'Haematology',                 '🩸', false),
  ('immunology',       'Immunology',                  '🛡️', false),
  ('musculoskeletal',  'Musculoskeletal',             '🦴', false),
  ('dermatology',      'Dermatology',                 '🩹', false),
  ('reproductive',     'Reproductive & Obstetrics',   '👶', false),
  ('psychiatry',       'Psychiatry & Behav. Science', '🧠', false),
  ('ophthalmology',    'Ophthalmology',               '👁️', false),
  ('ent',              'ENT',                         '👂', false),
  ('genetics',         'Genetics & Embryology',       '🧬', false),
  ('anatomy',          'Anatomy',                     '🫀', false)
ON CONFLICT (id) DO NOTHING;
