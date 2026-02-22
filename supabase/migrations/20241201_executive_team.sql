-- Create executive_team table
CREATE TABLE IF NOT EXISTS executive_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  image_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_executive_team_active ON executive_team(active);
CREATE INDEX idx_executive_team_priority ON executive_team(priority DESC);

-- Enable RLS
ALTER TABLE executive_team ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (active members only)
CREATE POLICY "Anyone can view active executive members" ON executive_team
  FOR SELECT USING (active = true);

-- Policy for service role to manage all members
CREATE POLICY "Service role can manage executive team" ON executive_team
  FOR ALL USING (auth.role() = 'service_role');

-- Insert example executive team members (replace with your organization's team)
INSERT INTO executive_team (name, position, email, priority, active) VALUES
  ('Example President', 'President', 'president@example.com', 100, true),
  ('Example VP', 'Vice President', 'vicepresident@example.com', 95, true),
  ('Example Treasurer', 'Treasurer', 'treasurer@example.com', 85, true),
  ('Example Secretary', 'Secretary', 'secretary@example.com', 80, true);
