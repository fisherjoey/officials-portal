-- =============================================
-- Multi-Event Support for OSA Submissions
-- Allows multiple events to be submitted together
-- and links them via submission_group_id
-- =============================================

-- Add submission_group_id to link events from the same form submission
ALTER TABLE osa_submissions
ADD COLUMN IF NOT EXISTS submission_group_id UUID;

-- Add event_index to track order within a submission group (1, 2, 3...)
ALTER TABLE osa_submissions
ADD COLUMN IF NOT EXISTS event_index INTEGER DEFAULT 1;

-- Add index for efficient querying by submission group
CREATE INDEX IF NOT EXISTS idx_osa_submissions_group_id ON osa_submissions(submission_group_id);

-- Add composite index for querying events within a group in order
CREATE INDEX IF NOT EXISTS idx_osa_submissions_group_order ON osa_submissions(submission_group_id, event_index);

-- Add exhibition_games column to store multiple game date/times as JSONB
-- Format: [{ "date": "2024-01-15", "time": "14:00", "games": 2 }, ...]
ALTER TABLE osa_submissions
ADD COLUMN IF NOT EXISTS exhibition_games JSONB;

COMMENT ON COLUMN osa_submissions.submission_group_id IS 'Links multiple events submitted together in one form. NULL for single-event submissions.';
COMMENT ON COLUMN osa_submissions.event_index IS 'Order of event within a multi-event submission (1, 2, 3...). Always 1 for single-event submissions.';
COMMENT ON COLUMN osa_submissions.exhibition_games IS 'For Exhibition events with multiple games: array of {date, time, games} objects.';
