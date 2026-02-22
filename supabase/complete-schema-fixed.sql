-- Complete Supabase Schema for Officials Portal (Fixed for Netlify Identity)
-- Run this in your Supabase SQL editor to create all necessary tables and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RULE MODIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rule_modifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  effective_date DATE,
  date TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  rule_reference TEXT,
  content TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule Modifications RLS
ALTER TABLE rule_modifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active rules
CREATE POLICY "Public can view active rule modifications"
ON rule_modifications
FOR SELECT
USING (active = true);

-- Allow all operations for now (we'll control access via API/Netlify Functions)
CREATE POLICY "Allow all modifications"
ON rule_modifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_rule_modifications_category ON rule_modifications(category);
CREATE INDEX idx_rule_modifications_active ON rule_modifications(active);
CREATE INDEX idx_rule_modifications_priority ON rule_modifications(priority DESC);
CREATE INDEX idx_rule_modifications_date ON rule_modifications(date DESC);

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'announcement',
  priority TEXT DEFAULT 'normal',
  author TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view announcements"
ON announcements
FOR SELECT
USING (true);

-- Allow all modifications (controlled via Netlify Functions)
CREATE POLICY "Allow all announcement modifications"
ON announcements
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX idx_announcements_category ON announcements(category);

-- ============================================================================
-- CALENDAR EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  event_type TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view events"
ON calendar_events
FOR SELECT
USING (true);

-- Allow all modifications (controlled via Netlify Functions)
CREATE POLICY "Allow all event modifications"
ON calendar_events
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);

-- ============================================================================
-- RESOURCES TABLE (for file metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_name TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  bucket TEXT DEFAULT 'portal-resources',
  path TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  access_level TEXT DEFAULT 'all',
  is_featured BOOLEAN DEFAULT false,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view resources"
ON resources
FOR SELECT
USING (true);

-- Allow all modifications (controlled via Netlify Functions)
CREATE POLICY "Allow all resource modifications"
ON resources
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_featured ON resources(is_featured);

-- ============================================================================
-- NEWSLETTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  file_url TEXT,
  file_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletters RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view newsletters"
ON newsletters
FOR SELECT
USING (true);

-- Allow all modifications (controlled via Netlify Functions)
CREATE POLICY "Allow all newsletter modifications"
ON newsletters
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_newsletters_date ON newsletters(date DESC);
CREATE INDEX idx_newsletters_featured ON newsletters(is_featured);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
-- Automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_rule_modifications_updated_at
  BEFORE UPDATE ON rule_modifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - rule_modifications';
  RAISE NOTICE '  - announcements';
  RAISE NOTICE '  - calendar_events';
  RAISE NOTICE '  - resources';
  RAISE NOTICE '  - newsletters';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage buckets in Dashboard (Storage section)';
  RAISE NOTICE '2. Add test data (see SUPABASE_FRESH_START.md)';
  RAISE NOTICE '3. Run: npm run test:supabase';
END $$;

-- ============================================================================
-- NOTES ON SECURITY
-- ============================================================================
-- RLS is enabled but policies allow all operations for now
-- This is because we're using Netlify Identity (not Supabase Auth)
-- Access control is handled by:
--   1. Netlify Identity widget (frontend authentication)
--   2. Netlify Functions (server-side authorization)
--   3. Application-level role checking (Official/Executive/Admin)
--
-- If you want stricter database-level security, you can:
--   1. Use Supabase Auth in addition to Netlify Identity
--   2. Create service role functions that validate Netlify tokens
--   3. Implement API keys for write operations
-- ============================================================================
