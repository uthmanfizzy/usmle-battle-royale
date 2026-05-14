-- Update hero background dimming to be OFF by default
-- Run these in your Supabase SQL Editor

-- Set dimming to OFF (false)
UPDATE game_settings SET value = 'false' WHERE key = 'hero_bg_dim_enabled';

-- Set default opacity (only used when enabled)
INSERT INTO game_settings (key, value) VALUES
('hero_bg_dim_opacity', '40')
ON CONFLICT (key) DO UPDATE SET value = '40';

-- Verify the settings
SELECT * FROM game_settings WHERE key IN ('hero_bg_dim_enabled', 'hero_bg_dim_opacity');
