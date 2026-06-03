-- Subjects table for managing active/inactive medical subjects

CREATE TABLE IF NOT EXISTS subjects (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  icon          TEXT        NOT NULL DEFAULT '📚',
  active        BOOLEAN     NOT NULL DEFAULT false,
  min_questions INTEGER     NOT NULL DEFAULT 5,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
INSERT INTO subjects (id, name, icon, active, min_questions)
VALUES
  ('cardiology',       'Cardiology',                  '❤️',  true,  5),
  ('neurology',        'Neurology',                   '🧠', true,  5),
  ('pharmacology',     'Pharmacology',                '💊', true,  5),
  ('microbiology',     'Microbiology',                '🦠', true,  5),
  ('biochemistry',     'Biochemistry',                '⚗️', true,  5),
  ('biostatistics',    'Biostatistics',               '📊', true,  5),
  ('pathology',        'Pathology',                   '🔬', false, 5),
  ('pulmonology',      'Pulmonology',                 '🫁', false, 5),
  ('nephrology',       'Nephrology',                  '💧', false, 5),
  ('gastroenterology', 'Gastroenterology',            '🫃', false, 5),
  ('endocrinology',    'Endocrinology',               '🦋', false, 5),
  ('haematology',      'Haematology',                 '🩸', false, 5),
  ('immunology',       'Immunology',                  '🛡️', false, 5),
  ('musculoskeletal',  'Musculoskeletal',             '🦴', false, 5),
  ('dermatology',      'Dermatology',                 '🩹', false, 5),
  ('reproductive',     'Reproductive & Obstetrics',   '👶', false, 5),
  ('psychiatry',       'Psychiatry & Behav. Science', '🧠', false, 5),
  ('ophthalmology',    'Ophthalmology',               '👁️', false, 5),
  ('ent',              'ENT',                         '👂', false, 5),
  ('genetics',         'Genetics & Embryology',       '🧬', false, 5),
  ('anatomy',          'Anatomy',                     '🫀', false, 5)
ON CONFLICT (id) DO NOTHING;
