-- Supabase Schema for Officials Portal
-- Run this in your Supabase SQL editor to create the necessary tables and buckets

-- Create resources table for file metadata
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
  resource_type TEXT DEFAULT 'file',
  access_level TEXT DEFAULT 'all',
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view resources" ON resources
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can upload resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update resources
CREATE POLICY "Users can update resources" ON resources
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete resources
CREATE POLICY "Users can delete resources" ON resources
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  file_url TEXT,
  file_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for newsletters
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view newsletters" ON newsletters
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage newsletters" ON newsletters
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'announcement',
  priority TEXT DEFAULT 'normal',
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage announcements" ON announcements
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  event_type TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for calendar events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view events" ON calendar_events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage events" ON calendar_events
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_newsletters_date ON newsletters(date DESC);
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);

-- Storage Buckets (create these in Supabase Dashboard)
-- 1. portal-resources - for general resource files
-- 2. newsletters - for newsletter PDFs
-- 3. training-materials - for training documents
-- 4. internal-docs - for internal documents (restricted access)