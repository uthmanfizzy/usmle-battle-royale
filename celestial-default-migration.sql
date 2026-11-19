-- Make the Celestial appearance the default for everyone.
-- 1) New accounts start on Celestial.
ALTER TABLE users ALTER COLUMN theme_pref SET DEFAULT 'celestial';
-- 2) Move every existing account that is on Default (or never chose) to Celestial.
--    Anyone can switch back in Settings → Appearance afterwards.
UPDATE users SET theme_pref = 'celestial' WHERE theme_pref IS NULL OR theme_pref = 'default';
