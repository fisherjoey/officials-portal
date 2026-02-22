-- =============================================
-- Email History Table
-- Track all emails sent through the system
-- =============================================

CREATE TABLE IF NOT EXISTS email_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Email type categorization
    email_type VARCHAR(50) NOT NULL, -- 'bulk', 'invite', 'password_reset', 'welcome'

    -- Sender info
    sent_by_id UUID REFERENCES auth.users(id),
    sent_by_email VARCHAR(255),

    -- Email content
    subject VARCHAR(500) NOT NULL,
    html_content TEXT, -- Full HTML content of the email
    recipient_count INTEGER NOT NULL DEFAULT 1,
    recipient_list JSONB, -- Array of recipient emails for bulk sends

    -- For bulk emails
    recipient_groups JSONB, -- ['officials', 'executives', etc.]
    rank_filter VARCHAR(50), -- '150+' etc.

    -- For individual emails (invites, password resets)
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'sent' NOT NULL, -- 'sent', 'failed', 'partial'
    error_message TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- Indexes for efficient querying
-- =============================================

CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON email_history(email_type);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_by_email ON email_history(sent_by_email);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient_email ON email_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_email_history_type_date ON email_history(email_type, created_at DESC);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Allow inserts from service role (Netlify functions use service role key)
CREATE POLICY "Service role can insert email history" ON email_history
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Only admins can view email history
CREATE POLICY "Admins can view email history" ON email_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id::text = auth.uid()::text
            AND members.role = 'Admin'
        )
    );

-- Service role can view all (for API endpoints)
CREATE POLICY "Service role can view email history" ON email_history
    FOR SELECT
    TO service_role
    USING (true);

-- No UPDATE or DELETE - email history is immutable for audit purposes

COMMENT ON TABLE email_history IS 'Immutable record of all emails sent through the system for audit and tracking purposes.';
