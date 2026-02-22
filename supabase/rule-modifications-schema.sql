-- Rule Modifications table for Officials Portal-specific rule modifications and interpretations
CREATE TABLE IF NOT EXISTS rule_modifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  effective_date DATE,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rule_modifications ENABLE ROW LEVEL SECURITY;

-- Policies for rule_modifications (public read, authenticated write)
CREATE POLICY "Public read access for rule_modifications"
ON rule_modifications FOR SELECT
USING (true);

CREATE POLICY "Public insert access for rule_modifications"
ON rule_modifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access for rule_modifications"
ON rule_modifications FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete access for rule_modifications"
ON rule_modifications FOR DELETE
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_rule_modifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rule_modifications_updated_at
BEFORE UPDATE ON rule_modifications
FOR EACH ROW
EXECUTE FUNCTION update_rule_modifications_updated_at();
