-- Run this in your Neon SQL Editor or via neon CLI
-- neon sql < schema.sql

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date VARCHAR(255) NOT NULL,
  venue VARCHAR(500) NOT NULL,
  video VARCHAR(500) NOT NULL,
  kicker VARCHAR(500) NOT NULL,
  closing_note VARCHAR(500) NOT NULL,
  hero_image VARCHAR(500),
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug VARCHAR(255) NOT NULL REFERENCES events(slug) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  invite_code VARCHAR(32) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_slug, phone)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_slug ON rsvps(event_slug);

-- Enable realtime for live RSVP updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE rsvps;

-- Insert the single event
INSERT INTO events (slug, name, date, venue, video, kicker, closing_note, theme)
VALUES (
  'ajzboogie-2026',
  'AJZ 2026',
  'To be announced',
  'To be announced',
  '/videos/hero.mp4',
  'Reunited in brotherhood - Premium e-invite experience by Àfárà Digital Solutions',
  'Your presence completes the frequency',
  'dark'
) ON CONFLICT (slug) DO NOTHING;