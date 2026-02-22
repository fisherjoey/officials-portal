-- Create rule_modifications table
CREATE TABLE IF NOT EXISTS rule_modifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  approved_by TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_rule_modifications_slug ON rule_modifications(slug);
CREATE INDEX idx_rule_modifications_category ON rule_modifications(category);
CREATE INDEX idx_rule_modifications_date ON rule_modifications(date DESC);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success')) DEFAULT 'info',
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for announcements
CREATE INDEX idx_announcements_date ON announcements(date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
CREATE TRIGGER update_rule_modifications_updated_at BEFORE UPDATE
  ON rule_modifications FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE
  ON announcements FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE rule_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON rule_modifications
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON announcements
  FOR SELECT USING (true);

-- Create policies for authenticated write access (optional)
-- Uncomment if you want to restrict write access to authenticated users
-- CREATE POLICY "Allow authenticated insert" ON rule_modifications
--   FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Allow authenticated update" ON rule_modifications
--   FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow authenticated delete" ON rule_modifications
--   FOR DELETE TO authenticated USING (true);