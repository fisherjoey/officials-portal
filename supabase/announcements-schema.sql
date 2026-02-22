-- Announcements table for news and important updates
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  author TEXT,
  audience TEXT[],
  date TIMESTAMPTZ DEFAULT NOW(),
  expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies for announcements (public read, authenticated write)
CREATE POLICY "Public read access for announcements"
ON announcements FOR SELECT
USING (true);

CREATE POLICY "Public insert access for announcements"
ON announcements FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access for announcements"
ON announcements FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete access for announcements"
ON announcements FOR DELETE
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_announcements_updated_at();
