-- Create home_images table to store home page customization images
CREATE TABLE IF NOT EXISTS home_images (
  id SERIAL PRIMARY KEY,
  slot_name TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_home_images_slot ON home_images(slot_name);

-- Insert default empty slots
INSERT INTO home_images (slot_name, image_url, updated_at)
VALUES
  ('dashboard_bg', '', NOW()),
  ('footer_bg', '', NOW()),
  ('icon_home', '', NOW()),
  ('icon_leaderboards', '', NOW()),
  ('icon_clans', '', NOW()),
  ('icon_news', '', NOW()),
  ('icon_play', '', NOW()),
  ('icon_coins', '', NOW()),
  ('icon_gems', '', NOW())
ON CONFLICT (slot_name) DO NOTHING;

-- Create storage bucket for home-images (run this in Supabase dashboard)
-- Storage bucket name: home-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/*
