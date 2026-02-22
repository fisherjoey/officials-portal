-- Newsletters table for The Bounce newsletter system
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Policies for newsletters (public read, authenticated write)
CREATE POLICY "Public read access for newsletters"
ON newsletters FOR SELECT
USING (true);

CREATE POLICY "Public insert access for newsletters"
ON newsletters FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access for newsletters"
ON newsletters FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete access for newsletters"
ON newsletters FOR DELETE
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_newsletters_updated_at
BEFORE UPDATE ON newsletters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
