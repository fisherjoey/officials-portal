-- Migration: Add Supabase Auth user_id to members table
-- This replaces the Netlify Identity integration with Supabase Auth

-- Add user_id column for Supabase Auth
ALTER TABLE members
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- Add comment to clarify column purpose
COMMENT ON COLUMN members.user_id IS 'References auth.users.id from Supabase Auth';
COMMENT ON COLUMN members.netlify_user_id IS 'DEPRECATED: Legacy Netlify Identity user ID - to be removed after migration';

-- Note: We keep netlify_user_id for backward compatibility during migration
-- It can be removed once all users are migrated to Supabase Auth
