-- Invite tokens table for proxy invite system
-- These tokens never expire - when clicked, we generate a fresh Supabase magic link

CREATE TABLE IF NOT EXISTS invite_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    -- Token is valid until used or member is deleted
    -- No expiration - that's the whole point!
    CONSTRAINT unique_active_token_per_email UNIQUE (email, used_at)
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON invite_tokens(email);

-- RLS policies
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage invite tokens
CREATE POLICY "Admins can manage invite tokens" ON invite_tokens
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
            AND m.role = 'admin'
        )
    );

-- Service role can do everything (for Netlify functions)
CREATE POLICY "Service role full access" ON invite_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
