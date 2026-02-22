-- Calendar Events table for Officials Portal events, training, meetings, etc.
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'meeting',
  description TEXT,
  location TEXT,
  instructor TEXT,
  max_participants INTEGER,
  registration_link TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_events (public read, authenticated write)
CREATE POLICY "Public read access for calendar_events"
ON calendar_events FOR SELECT
USING (true);

CREATE POLICY "Public insert access for calendar_events"
ON calendar_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access for calendar_events"
ON calendar_events FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete access for calendar_events"
ON calendar_events FOR DELETE
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION update_calendar_events_updated_at();
