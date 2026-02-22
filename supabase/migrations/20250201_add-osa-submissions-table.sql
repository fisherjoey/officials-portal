-- =============================================
-- OSA Submissions Table
-- Track all Officiating Services Agreement form submissions
-- =============================================

CREATE TABLE IF NOT EXISTS osa_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Organization Information
    organization_name VARCHAR(500) NOT NULL,

    -- Billing Information
    billing_contact_name VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    billing_phone VARCHAR(50),
    billing_address VARCHAR(500),
    billing_city VARCHAR(100),
    billing_province VARCHAR(50),
    billing_postal_code VARCHAR(20),

    -- Event Contact
    event_contact_name VARCHAR(255) NOT NULL,
    event_contact_email VARCHAR(255) NOT NULL,
    event_contact_phone VARCHAR(50),

    -- Event Type: 'Exhibition Game(s)', 'League', 'Tournament'
    event_type VARCHAR(50) NOT NULL,

    -- League-specific fields
    league_name VARCHAR(255),
    league_start_date DATE,
    league_end_date DATE,
    league_days_of_week VARCHAR(100),
    league_player_gender VARCHAR(50),
    league_level_of_play VARCHAR(100),

    -- Exhibition-specific fields
    exhibition_game_location VARCHAR(255),
    exhibition_number_of_games INTEGER,
    exhibition_game_date DATE,
    exhibition_start_time VARCHAR(20),
    exhibition_player_gender VARCHAR(50),
    exhibition_level_of_play VARCHAR(100),

    -- Tournament-specific fields
    tournament_name VARCHAR(255),
    tournament_start_date DATE,
    tournament_end_date DATE,
    tournament_number_of_games INTEGER,
    tournament_player_gender VARCHAR(50),
    tournament_level_of_play VARCHAR(100),

    -- Common fields
    discipline_policy VARCHAR(500),
    agreement VARCHAR(100),

    -- Status tracking
    status VARCHAR(50) DEFAULT 'new' NOT NULL, -- 'new', 'contacted', 'scheduled', 'completed', 'cancelled'
    notes TEXT,

    -- Metadata
    submission_time TIMESTAMPTZ,
    emails_sent JSONB DEFAULT '{}', -- { client: true, scheduler: true, treasurer: true, president: false }
    raw_form_data JSONB -- Store original form data for reference
);

-- =============================================
-- Indexes for efficient querying
-- =============================================

CREATE INDEX IF NOT EXISTS idx_osa_submissions_created_at ON osa_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_organization ON osa_submissions(organization_name);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_event_type ON osa_submissions(event_type);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_status ON osa_submissions(status);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_event_contact_email ON osa_submissions(event_contact_email);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_osa_submissions_status_date ON osa_submissions(status, created_at DESC);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE osa_submissions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (Netlify functions)
CREATE POLICY "Service role full access on osa_submissions" ON osa_submissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Only admins can view OSA submissions
CREATE POLICY "Admins can view osa_submissions" ON osa_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id::text = auth.uid()::text
            AND members.role = 'Admin'
        )
    );

-- Only admins can update OSA submissions (status, notes)
CREATE POLICY "Admins can update osa_submissions" ON osa_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id::text = auth.uid()::text
            AND members.role = 'Admin'
        )
    );

-- =============================================
-- Updated at trigger
-- =============================================

CREATE OR REPLACE FUNCTION update_osa_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_osa_submissions_updated_at
    BEFORE UPDATE ON osa_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_osa_submissions_updated_at();

COMMENT ON TABLE osa_submissions IS 'Stores all Officiating Services Agreement form submissions from clients requesting officials.';
