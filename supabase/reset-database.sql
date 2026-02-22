-- ============================================================================
-- RESET SUPABASE DATABASE - CLEAN SLATE
-- ============================================================================
-- WARNING: This will delete ALL data and tables!
-- Only run this if you're sure you want to start fresh.
--
-- Usage:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy/paste this entire file
-- 3. Click "Run"
-- 4. Then run complete-schema.sql
-- ============================================================================

-- Drop all existing policies first (to avoid dependency issues)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Drop all triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_object_table
              FROM information_schema.triggers
              WHERE trigger_schema = 'public'
              AND trigger_name LIKE '%update%')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON ' || r.event_object_table || ' CASCADE';
    END LOOP;
END $$;

-- Drop all tables (if they exist)
DROP TABLE IF EXISTS rule_modifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clear out any remaining indexes (cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || r.indexname || ' CASCADE';
    END LOOP;
END $$;

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
-- Note: You may need to delete storage buckets manually from the Dashboard
-- Storage → Select bucket → Settings → Delete bucket
--
-- Buckets to delete (if they exist):
-- - portal-resources
-- - newsletters
-- - training-materials
-- - Any other custom buckets you created
-- ============================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database reset complete!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Delete storage buckets manually in Supabase Dashboard (Storage section)';
    RAISE NOTICE '2. Run complete-schema.sql to create fresh tables';
    RAISE NOTICE '3. Create new storage buckets (see SUPABASE_QUICKSTART.md)';
END $$;
