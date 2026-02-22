-- =============================================
-- Application Logging Tables
-- =============================================

-- Operational Logs Table (for debugging, errors, warnings)
CREATE TABLE IF NOT EXISTS app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('ERROR', 'WARN', 'INFO')),
  source TEXT NOT NULL CHECK (source IN ('server', 'client')),
  category TEXT NOT NULL,  -- 'auth', 'email', 'crud', 'api', 'file', 'system', 'admin'
  function_name TEXT,      -- Netlify function name or component
  action TEXT NOT NULL,    -- e.g., 'login', 'send_email', 'create_member'
  message TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  request_id TEXT,
  metadata JSONB DEFAULT '{}',
  error_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Audit Trail Table (immutable record of user actions for compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  action TEXT NOT NULL,      -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'INVITE', 'PASSWORD_RESET', 'EMAIL_SENT', 'ROLE_CHANGE'
  entity_type TEXT NOT NULL, -- 'member', 'user', 'calendar_event', 'newsletter', 'announcement', etc.
  entity_id TEXT,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT,
  actor_ip TEXT,
  target_user_id TEXT,       -- For user management actions
  target_user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  description TEXT
);

-- =============================================
-- Indexes for efficient querying
-- =============================================

-- App logs indexes
CREATE INDEX IF NOT EXISTS idx_app_logs_timestamp ON app_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_category ON app_logs(category);
CREATE INDEX IF NOT EXISTS idx_app_logs_source ON app_logs(source);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_email ON app_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_app_logs_function_name ON app_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_app_logs_action ON app_logs(action);
-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_app_logs_level_timestamp ON app_logs(level, timestamp DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_email ON audit_logs(target_user_email);
-- Composite index for entity history queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow log inserts" ON app_logs;
DROP POLICY IF EXISTS "Allow audit inserts" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view app logs" ON app_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

-- Allow inserts from any authenticated source (service role bypasses RLS anyway)
-- This allows client logs to be inserted via the client-logs function
CREATE POLICY "Allow log inserts" ON app_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow audit inserts" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Only admins can view app logs (with proper type casting)
CREATE POLICY "Admins can view app logs" ON app_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id::text = auth.uid()::text
      AND members.role = 'Admin'
    )
  );

-- Only admins can view audit logs (with proper type casting)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id::text = auth.uid()::text
      AND members.role = 'Admin'
    )
  );

-- No UPDATE or DELETE policies for audit_logs (immutable)
-- App logs can be deleted for cleanup but only by service role (no policy needed)

-- =============================================
-- Optional: Cleanup function for old logs
-- Run periodically via Supabase cron or external scheduler
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_old_logs(
  app_logs_days INTEGER DEFAULT 30,
  audit_logs_days INTEGER DEFAULT 365
)
RETURNS TABLE(app_logs_deleted BIGINT, audit_logs_deleted BIGINT) AS $$
DECLARE
  app_count BIGINT;
  audit_count BIGINT;
BEGIN
  -- Delete old app logs (keep 30 days by default)
  DELETE FROM app_logs
  WHERE timestamp < NOW() - (app_logs_days || ' days')::INTERVAL;
  GET DIAGNOSTICS app_count = ROW_COUNT;

  -- Delete old audit logs (keep 1 year by default)
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - (audit_logs_days || ' days')::INTERVAL;
  GET DIAGNOSTICS audit_count = ROW_COUNT;

  RETURN QUERY SELECT app_count, audit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION cleanup_old_logs FROM PUBLIC;

COMMENT ON TABLE app_logs IS 'Operational logs for debugging and monitoring. Auto-cleanup recommended after 30 days.';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance. Auto-cleanup recommended after 1 year.';
