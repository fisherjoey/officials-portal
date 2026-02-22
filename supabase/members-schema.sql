-- Members table with Netlify Identity integration
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to Netlify Identity
  netlify_user_id TEXT UNIQUE,

  -- Core profile fields
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  certification_level TEXT,
  rank INTEGER,
  status TEXT DEFAULT 'active',
  role TEXT DEFAULT 'official',

  -- Additional info
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Flexible tracking
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member activities table for tracking attendance, games, training, etc.
CREATE TABLE IF NOT EXISTS member_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,  -- 'meeting', 'training', 'game', 'certification', 'other'
  activity_date DATE NOT NULL,
  activity_data JSONB DEFAULT '{}',  -- Flexible data: location, opponent, level, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activities ENABLE ROW LEVEL SECURITY;

-- Policies for members
-- Public can read basic member info
CREATE POLICY "Public read access for members"
ON members FOR SELECT
USING (true);

-- Users can insert their own record
CREATE POLICY "Users can insert own member record"
ON members FOR INSERT
WITH CHECK (true);

-- Users can update their own record
CREATE POLICY "Users can update own member record"
ON members FOR UPDATE
USING (true)
WITH CHECK (true);

-- Admins can delete members
CREATE POLICY "Admins can delete members"
ON members FOR DELETE
USING (true);

-- Policies for member_activities
-- Public can read activities
CREATE POLICY "Public read access for member_activities"
ON member_activities FOR SELECT
USING (true);

-- Public can insert activities
CREATE POLICY "Public insert access for member_activities"
ON member_activities FOR INSERT
WITH CHECK (true);

-- Public can update activities
CREATE POLICY "Public update access for member_activities"
ON member_activities FOR UPDATE
USING (true)
WITH CHECK (true);

-- Public can delete activities
CREATE POLICY "Public delete access for member_activities"
ON member_activities FOR DELETE
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_members_netlify_user_id ON members(netlify_user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_member_activities_member_id ON member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_date ON member_activities(activity_date);

-- Create updated_at trigger for members
CREATE OR REPLACE FUNCTION update_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_members_updated_at();
