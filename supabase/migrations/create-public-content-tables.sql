-- Migration: Create Public Content Management Tables
-- Description: Creates tables for managing all public website content (news, training, resources, pages, officials)
-- Author: Claude Code
-- Date: 2025-01-13

-- ============================================================================
-- Table: public_news
-- Description: News articles for the public website
-- ============================================================================
CREATE TABLE IF NOT EXISTS public_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  published_date TIMESTAMPTZ NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,  -- Rich HTML from TinyMCE
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for public_news
CREATE INDEX IF NOT EXISTS idx_public_news_slug ON public_news(slug);
CREATE INDEX IF NOT EXISTS idx_public_news_active ON public_news(active);
CREATE INDEX IF NOT EXISTS idx_public_news_published_date ON public_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_public_news_featured ON public_news(featured) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_public_news_tags ON public_news USING GIN(tags);

-- ============================================================================
-- Table: public_training_events
-- Description: Training events and workshops for the public website
-- ============================================================================
CREATE TABLE IF NOT EXISTS public_training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('workshop', 'certification', 'refresher', 'meeting')),
  description TEXT NOT NULL,  -- Rich HTML
  registration_link TEXT,
  max_participants INTEGER,
  current_registrations INTEGER DEFAULT 0,
  instructor TEXT,
  requirements TEXT,  -- Rich HTML
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for public_training_events
CREATE INDEX IF NOT EXISTS idx_training_slug ON public_training_events(slug);
CREATE INDEX IF NOT EXISTS idx_training_active ON public_training_events(active);
CREATE INDEX IF NOT EXISTS idx_training_event_date ON public_training_events(event_date);
CREATE INDEX IF NOT EXISTS idx_training_type ON public_training_events(event_type);

-- ============================================================================
-- Table: public_resources
-- Description: Public resources (rulebooks, forms, guides, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Rulebooks', 'Forms', 'Training Materials', 'Policies', 'Guides')),
  description TEXT NOT NULL,  -- Rich HTML
  file_url TEXT,
  external_link TEXT,
  last_updated TIMESTAMPTZ NOT NULL,
  access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'members', 'officials')),
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for public_resources
CREATE INDEX IF NOT EXISTS idx_resources_slug ON public_resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_active ON public_resources(active);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public_resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON public_resources(featured) WHERE active = true;

-- ============================================================================
-- Table: public_pages
-- Description: Editable static pages (home, about, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT UNIQUE NOT NULL,  -- 'home', 'about', etc.
  title TEXT NOT NULL,
  content JSONB NOT NULL,  -- Flexible structure per page type
  meta_description TEXT,
  last_edited_by TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for public_pages
CREATE INDEX IF NOT EXISTS idx_pages_name ON public_pages(page_name);
CREATE INDEX IF NOT EXISTS idx_pages_active ON public_pages(active);

-- ============================================================================
-- Table: officials
-- Description: Basketball officials profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INTEGER CHECK (level BETWEEN 1 AND 5),
  photo_url TEXT,
  bio TEXT,  -- Rich HTML
  years_experience TEXT,
  email TEXT,
  availability TEXT,
  certifications TEXT[],
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for officials
CREATE INDEX IF NOT EXISTS idx_officials_active ON officials(active);
CREATE INDEX IF NOT EXISTS idx_officials_level ON officials(level);
CREATE INDEX IF NOT EXISTS idx_officials_name ON officials(name);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;

-- Public can view active content
CREATE POLICY "Public can view active news" ON public_news
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view active training" ON public_training_events
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view public resources" ON public_resources
  FOR SELECT USING (active = true AND access_level = 'public');

CREATE POLICY "Public can view active pages" ON public_pages
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view active officials" ON officials
  FOR SELECT USING (active = true);

-- Authenticated users can manage all content
CREATE POLICY "Authenticated can manage news" ON public_news
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage training" ON public_training_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage resources" ON public_resources
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage pages" ON public_pages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage officials" ON officials
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- Triggers for automatic updated_at timestamp
-- ============================================================================

-- Assumes update_updated_at_column() function already exists in the database
-- If not, create it:
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_public_news_updated_at
  BEFORE UPDATE ON public_news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_training_events_updated_at
  BEFORE UPDATE ON public_training_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_resources_updated_at
  BEFORE UPDATE ON public_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_pages_updated_at
  BEFORE UPDATE ON public_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_officials_updated_at
  BEFORE UPDATE ON officials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data: Create default pages
-- ============================================================================

INSERT INTO public_pages (page_name, title, content, active)
VALUES
  (
    'home',
    'Your Officials Association',
    '{
      "heroTitle": "Your Officials Association",
      "heroSubtitle": "Dedicated to excellence in sports officiating",
      "heroImage": "/images/hero/basketball-game.jpg",
      "stats": [
        {"label": "Active Officials", "value": "100+"},
        {"label": "Games Per Season", "value": "1,000+"},
        {"label": "Years of Service", "value": "10+"}
      ],
      "aboutSection": "<h1>Welcome</h1><p>Your Officials Association has been serving the community with professional officiating services.</p>"
    }'::jsonb,
    true
  ),
  (
    'about',
    'About Us',
    '{
      "body": "<h1>About Your Officials Association</h1><p>Your Officials Association is dedicated to providing qualified, professional officials for all levels of play in your area.</p>"
    }'::jsonb,
    true
  )
ON CONFLICT (page_name) DO NOTHING;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE public_news IS 'News articles for the public website';
COMMENT ON TABLE public_training_events IS 'Training events and workshops';
COMMENT ON TABLE public_resources IS 'Public resources (rulebooks, forms, guides)';
COMMENT ON TABLE public_pages IS 'Editable static pages (home, about)';
COMMENT ON TABLE officials IS 'Basketball officials profiles';

COMMENT ON COLUMN public_news.body IS 'Rich HTML content from TinyMCE editor';
COMMENT ON COLUMN public_training_events.description IS 'Rich HTML content';
COMMENT ON COLUMN public_resources.description IS 'Rich HTML content';
COMMENT ON COLUMN public_pages.content IS 'JSONB structure varies by page type';
COMMENT ON COLUMN officials.bio IS 'Rich HTML content';
