-- Insert default values for hero background dimming settings
-- Run these in your Supabase SQL Editor

INSERT INTO game_settings (key, value) VALUES
('hero_bg_dim_enabled', 'true'),
('hero_bg_dim_opacity', '40')
ON CONFLICT (key) DO NOTHING;

-- Verify the insertion
SELECT * FROM game_settings WHERE key IN ('hero_bg_dim_enabled', 'hero_bg_dim_opacity');
