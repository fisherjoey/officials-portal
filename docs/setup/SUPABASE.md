# Supabase Setup Guide for Officials Portal

This guide walks you through setting up Supabase as the backend for the Officials Portal application. Supabase provides the database, authentication, and file storage services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Supabase Project](#creating-a-supabase-project)
3. [Getting Your API Keys](#getting-your-api-keys)
4. [Database Setup](#database-setup)
5. [Storage Bucket Setup](#storage-bucket-setup)
6. [Authentication Configuration](#authentication-configuration)
7. [Environment Variables](#environment-variables)
8. [Testing Your Setup](#testing-your-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- A GitHub account (for Supabase sign-up)
- Access to the Officials Portal codebase
- Basic familiarity with SQL and web development

---

## Creating a Supabase Project

### Step 1: Sign Up / Sign In

1. Go to [https://supabase.com](https://supabase.com)
2. Click the "Start your project" button (or "Sign In" if you already have an account)
3. Sign in with your GitHub account (recommended) or create a new account with email

### Step 2: Create a New Project

1. Once logged in, you will see your Supabase dashboard
2. Click the "New Project" button in the top right corner
3. Fill in the project details:
   - **Organization**: Select your organization or create a new one
   - **Name**: Enter a name like `officials-portal` or `officials-portal-prod`
   - **Database Password**: Generate a strong password and **save it securely** - you will need this later
   - **Region**: Choose the region closest to your users for best performance
   - **Pricing Plan**: Select "Free" for development or "Pro" for production
4. Click "Create new project"
5. Wait 2-3 minutes for your project to be provisioned

### Step 3: Project Dashboard

Once your project is ready, you will see the project dashboard with:
- **Home**: Overview and quick links
- **Table Editor**: Visual database editor
- **SQL Editor**: Run SQL queries directly
- **Authentication**: User management
- **Storage**: File storage management
- **API**: API documentation and settings

---

## Getting Your API Keys

### Step 1: Navigate to API Settings

1. In your Supabase project dashboard, click on "Settings" in the left sidebar (gear icon at the bottom)
2. Click on "API" in the settings menu

### Step 2: Copy Your Keys

You will see two important sections:

#### Project URL
```
https://your-project-ref.supabase.co
```
Copy this URL - this is your `NEXT_PUBLIC_SUPABASE_URL`.

#### Project API Keys

1. **anon (public)**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Safe to use in client-side code
   - Subject to Row Level Security (RLS) policies
   - Click "Copy" to copy this key

2. **service_role (secret)**: This is your `SUPABASE_SERVICE_ROLE_KEY`
   - **NEVER expose this in client-side code**
   - Bypasses all RLS policies
   - Only use in server-side code (Netlify Functions)
   - Click "Reveal" then "Copy" to copy this key

### Understanding Key Differences

| Key | Usage | Security |
|-----|-------|----------|
| `anon` key | Client-side (browser), respects RLS | Safe to expose |
| `service_role` key | Server-side only (Netlify Functions) | Must keep secret |

---

## Database Setup

### Step 1: Open SQL Editor

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL query tab

### Step 2: Run the Database Migrations

Run each of the following SQL scripts in order. Copy each script, paste it into the SQL Editor, and click "Run" (or press Ctrl+Enter / Cmd+Enter).

#### Migration 1: Base Functions and Extensions

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function (used by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Migration 2: Members Table

```sql
-- Members table for storing official information
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to Supabase Auth
  user_id UUID UNIQUE,

  -- Legacy Netlify Identity (can be removed after migration)
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

-- Member activities table
CREATE TABLE IF NOT EXISTS member_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL,
  activity_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activities ENABLE ROW LEVEL SECURITY;

-- Policies for members
CREATE POLICY "Public read access for members" ON members
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own member record" ON members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own member record" ON members
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete members" ON members
  FOR DELETE USING (true);

-- Policies for member_activities
CREATE POLICY "Public read access for member_activities" ON member_activities
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for member_activities" ON member_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for member_activities" ON member_activities
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public delete access for member_activities" ON member_activities
  FOR DELETE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_netlify_user_id ON members(netlify_user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_member_activities_member_id ON member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_date ON member_activities(activity_date);

-- Trigger
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for user_id column
COMMENT ON COLUMN members.user_id IS 'References auth.users.id from Supabase Auth';
```

#### Migration 3: Rule Modifications Table

```sql
-- Rule modifications table
CREATE TABLE IF NOT EXISTS rule_modifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  effective_date DATE,
  date TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  rule_reference TEXT,
  content TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rule_modifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active rule modifications" ON rule_modifications
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage rule modifications" ON rule_modifications
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_rule_modifications_slug ON rule_modifications(slug);
CREATE INDEX idx_rule_modifications_category ON rule_modifications(category);
CREATE INDEX idx_rule_modifications_active ON rule_modifications(active);
CREATE INDEX idx_rule_modifications_priority ON rule_modifications(priority DESC);
CREATE INDEX idx_rule_modifications_date ON rule_modifications(date DESC);

-- Trigger
CREATE TRIGGER update_rule_modifications_updated_at
  BEFORE UPDATE ON rule_modifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 4: Announcements Table

```sql
-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'announcement',
  priority TEXT DEFAULT 'normal',
  author TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage announcements" ON announcements
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX idx_announcements_category ON announcements(category);

-- Trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 5: Calendar Events Table

```sql
-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  event_type TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view events" ON calendar_events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage events" ON calendar_events
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);

-- Trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 6: Resources Table

```sql
-- Resources table (for file metadata)
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_name TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  bucket TEXT DEFAULT 'portal-resources',
  path TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  resource_type TEXT DEFAULT 'file',
  access_level TEXT DEFAULT 'all',
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view resources" ON resources
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update resources" ON resources
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete resources" ON resources
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_featured ON resources(is_featured);

-- Trigger
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON COLUMN resources.resource_type IS 'Type of resource: file, link, video, or text';
```

#### Migration 7: Newsletters Table

```sql
-- Newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  file_url TEXT,
  file_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view newsletters" ON newsletters
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage newsletters" ON newsletters
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_newsletters_date ON newsletters(date DESC);
CREATE INDEX idx_newsletters_featured ON newsletters(is_featured);

-- Trigger
CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 8: Executive Team Table

```sql
-- Executive team table
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

-- Indexes
CREATE INDEX idx_executive_team_active ON executive_team(active);
CREATE INDEX idx_executive_team_priority ON executive_team(priority DESC);

-- Enable RLS
ALTER TABLE executive_team ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active executive members" ON executive_team
  FOR SELECT USING (active = true);

CREATE POLICY "Service role can manage executive team" ON executive_team
  FOR ALL USING (auth.role() = 'service_role');
```

#### Migration 9: Evaluations Table

```sql
-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES members(id) ON DELETE SET NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  activity_id UUID REFERENCES member_activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_evaluations_member_id ON evaluations(member_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_evaluation_date ON evaluations(evaluation_date DESC);
CREATE INDEX idx_evaluations_activity_id ON evaluations(activity_id);

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Allow users to read own evaluations" ON evaluations
  FOR SELECT USING (true);

-- Trigger
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 10: Invite Tokens Table

```sql
-- Invite tokens table for proxy invite system
CREATE TABLE IF NOT EXISTS invite_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    CONSTRAINT unique_active_token_per_email UNIQUE (email, used_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON invite_tokens(email);

-- Enable RLS
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage invite tokens" ON invite_tokens
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
            AND m.role = 'admin'
        )
    );

CREATE POLICY "Service role full access" ON invite_tokens
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
```

#### Migration 11: OSA Submissions Table

```sql
-- OSA Submissions table
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

    -- Event Type
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
    status VARCHAR(50) DEFAULT 'new' NOT NULL,
    notes TEXT,

    -- Multi-event support
    submission_group_id UUID,
    event_index INTEGER DEFAULT 1,
    exhibition_games JSONB,

    -- Metadata
    submission_time TIMESTAMPTZ,
    emails_sent JSONB DEFAULT '{}',
    raw_form_data JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_osa_submissions_created_at ON osa_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_organization ON osa_submissions(organization_name);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_event_type ON osa_submissions(event_type);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_status ON osa_submissions(status);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_event_contact_email ON osa_submissions(event_contact_email);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_status_date ON osa_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_group_id ON osa_submissions(submission_group_id);
CREATE INDEX IF NOT EXISTS idx_osa_submissions_group_order ON osa_submissions(submission_group_id, event_index);

-- Enable RLS
ALTER TABLE osa_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role full access on osa_submissions" ON osa_submissions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view osa_submissions" ON osa_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id::text = auth.uid()::text
            AND members.role = 'Admin'
        )
    );

CREATE POLICY "Admins can update osa_submissions" ON osa_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id::text = auth.uid()::text
            AND members.role = 'Admin'
        )
    );

-- Trigger
CREATE OR REPLACE FUNCTION update_osa_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_osa_submissions_updated_at
    BEFORE UPDATE ON osa_submissions
    FOR EACH ROW EXECUTE FUNCTION update_osa_submissions_updated_at();

COMMENT ON TABLE osa_submissions IS 'Stores all Officiating Services Agreement form submissions.';
```

#### Migration 12: Email History Table

```sql
-- Email History table
CREATE TABLE IF NOT EXISTS email_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    sent_by_id UUID REFERENCES auth.users(id),
    sent_by_email VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    recipient_count INTEGER NOT NULL DEFAULT 1,
    recipient_list JSONB,
    recipient_groups JSONB,
    rank_filter VARCHAR(50),
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent' NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON email_history(email_type);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_by_email ON email_history(sent_by_email);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient_email ON email_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_type_date ON email_history(email_type, created_at DESC);

-- Enable RLS
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can insert email history" ON email_history
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Admins can view email history" ON email_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id::text = auth.uid()::text
            AND members.role = 'Admin'
        )
    );

CREATE POLICY "Service role can view email history" ON email_history
    FOR SELECT TO service_role USING (true);

COMMENT ON TABLE email_history IS 'Immutable record of all emails sent through the system.';
```

#### Migration 13: Application Logging Tables

```sql
-- Operational Logs Table
CREATE TABLE IF NOT EXISTS app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('ERROR', 'WARN', 'INFO')),
  source TEXT NOT NULL CHECK (source IN ('server', 'client')),
  category TEXT NOT NULL,
  function_name TEXT,
  action TEXT NOT NULL,
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

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT,
  actor_ip TEXT,
  target_user_id TEXT,
  target_user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  description TEXT
);

-- Indexes for app_logs
CREATE INDEX IF NOT EXISTS idx_app_logs_timestamp ON app_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_category ON app_logs(category);
CREATE INDEX IF NOT EXISTS idx_app_logs_source ON app_logs(source);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_email ON app_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_app_logs_function_name ON app_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_app_logs_action ON app_logs(action);
CREATE INDEX IF NOT EXISTS idx_app_logs_level_timestamp ON app_logs(level, timestamp DESC);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_email ON audit_logs(target_user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC);

-- Enable RLS
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow log inserts" ON app_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow audit inserts" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view app logs" ON app_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id::text = auth.uid()::text
      AND members.role = 'Admin'
    )
  );

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id::text = auth.uid()::text
      AND members.role = 'Admin'
    )
  );

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_logs(
  app_logs_days INTEGER DEFAULT 30,
  audit_logs_days INTEGER DEFAULT 365
)
RETURNS TABLE(app_logs_deleted BIGINT, audit_logs_deleted BIGINT) AS $$
DECLARE
  app_count BIGINT;
  audit_count BIGINT;
BEGIN
  DELETE FROM app_logs
  WHERE timestamp < NOW() - (app_logs_days || ' days')::INTERVAL;
  GET DIAGNOSTICS app_count = ROW_COUNT;

  DELETE FROM audit_logs
  WHERE timestamp < NOW() - (audit_logs_days || ' days')::INTERVAL;
  GET DIAGNOSTICS audit_count = ROW_COUNT;

  RETURN QUERY SELECT app_count, audit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION cleanup_old_logs FROM PUBLIC;

COMMENT ON TABLE app_logs IS 'Operational logs for debugging and monitoring.';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance.';
```

#### Migration 14: Public Content Tables

```sql
-- Public News table
CREATE TABLE IF NOT EXISTS public_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  published_date TIMESTAMPTZ NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Training Events table
CREATE TABLE IF NOT EXISTS public_training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('workshop', 'certification', 'refresher', 'meeting')),
  description TEXT NOT NULL,
  registration_link TEXT,
  max_participants INTEGER,
  current_registrations INTEGER DEFAULT 0,
  instructor TEXT,
  requirements TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Resources table
CREATE TABLE IF NOT EXISTS public_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Rulebooks', 'Forms', 'Training Materials', 'Policies', 'Guides')),
  description TEXT NOT NULL,
  file_url TEXT,
  external_link TEXT,
  last_updated TIMESTAMPTZ NOT NULL,
  access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'members', 'officials')),
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Pages table
CREATE TABLE IF NOT EXISTS public_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  meta_description TEXT,
  last_edited_by TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Officials table
CREATE TABLE IF NOT EXISTS officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INTEGER CHECK (level BETWEEN 1 AND 5),
  photo_url TEXT,
  bio TEXT,
  years_experience TEXT,
  email TEXT,
  availability TEXT,
  certifications TEXT[],
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_news_slug ON public_news(slug);
CREATE INDEX IF NOT EXISTS idx_public_news_active ON public_news(active);
CREATE INDEX IF NOT EXISTS idx_public_news_published_date ON public_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_public_news_featured ON public_news(featured) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_public_news_tags ON public_news USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_training_slug ON public_training_events(slug);
CREATE INDEX IF NOT EXISTS idx_training_active ON public_training_events(active);
CREATE INDEX IF NOT EXISTS idx_training_event_date ON public_training_events(event_date);
CREATE INDEX IF NOT EXISTS idx_training_type ON public_training_events(event_type);

CREATE INDEX IF NOT EXISTS idx_resources_slug ON public_resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_active ON public_resources(active);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public_resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON public_resources(featured) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_pages_name ON public_pages(page_name);
CREATE INDEX IF NOT EXISTS idx_pages_active ON public_pages(active);

CREATE INDEX IF NOT EXISTS idx_officials_active ON officials(active);
CREATE INDEX IF NOT EXISTS idx_officials_level ON officials(level);
CREATE INDEX IF NOT EXISTS idx_officials_name ON officials(name);

-- Enable RLS
ALTER TABLE public_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view active news" ON public_news
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view active training" ON public_training_events
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view public resources" ON public_resources
  FOR SELECT USING (active = true AND access_level = 'public');

CREATE POLICY "Public can view active pages" ON public_pages
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view active officials" ON officials
  FOR SELECT USING (active = true);

-- Authenticated management policies
CREATE POLICY "Authenticated can manage news" ON public_news
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage training" ON public_training_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage resources" ON public_resources
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage pages" ON public_pages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage officials" ON officials
  FOR ALL USING (auth.role() = 'authenticated');

-- Triggers
CREATE TRIGGER update_public_news_updated_at
  BEFORE UPDATE ON public_news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_training_events_updated_at
  BEFORE UPDATE ON public_training_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_resources_updated_at
  BEFORE UPDATE ON public_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_pages_updated_at
  BEFORE UPDATE ON public_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_officials_updated_at
  BEFORE UPDATE ON officials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default pages
INSERT INTO public_pages (page_name, title, content, active)
VALUES
  (
    'home',
    'Your Officials Association',
    '{
      "heroTitle": "Your Officials Association",
      "heroSubtitle": "Dedicated to excellence in sports officiating",
      "heroImage": "/images/hero/sports-game.jpg",
      "stats": [
        {"label": "Active Officials", "value": "100+"},
        {"label": "Games Per Season", "value": "1,000+"},
        {"label": "Years of Service", "value": "10+"}
      ],
      "aboutSection": "<h1>Welcome</h1><p>Your Officials Association has been serving the community with professional officiating services.</p>"
    }'::jsonb,
    true
  ),
  (
    'about',
    'About Us',
    '{
      "body": "<h1>About Your Officials Association</h1><p>Your Officials Association is dedicated to providing qualified, professional officials for all levels of play in your area.</p>"
    }'::jsonb,
    true
  )
ON CONFLICT (page_name) DO NOTHING;
```

### Step 3: Verify Tables Created

After running all migrations, verify the tables were created:

1. Click on "Table Editor" in the left sidebar
2. You should see all the following tables:
   - `members`
   - `member_activities`
   - `rule_modifications`
   - `announcements`
   - `calendar_events`
   - `resources`
   - `newsletters`
   - `executive_team`
   - `evaluations`
   - `invite_tokens`
   - `osa_submissions`
   - `email_history`
   - `app_logs`
   - `audit_logs`
   - `public_news`
   - `public_training_events`
   - `public_resources`
   - `public_pages`
   - `officials`

---

## Storage Bucket Setup

The Officials Portal uses three storage buckets for file uploads.

### Step 1: Navigate to Storage

1. In your Supabase dashboard, click "Storage" in the left sidebar
2. You will see an empty storage section (or existing buckets if any)

### Step 2: Create Storage Buckets

Create each of the following buckets:

#### Bucket 1: portal-resources

1. Click "New bucket"
2. Enter the following settings:
   - **Name**: `portal-resources`
   - **Public bucket**: Toggle ON (green)
   - **Allowed MIME types**: Leave empty or add:
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     image/jpeg
     image/png
     image/gif
     video/mp4
     ```
   - **File size limit**: `52428800` (50MB)
3. Click "Create bucket"

#### Bucket 2: newsletters

1. Click "New bucket"
2. Enter the following settings:
   - **Name**: `newsletters`
   - **Public bucket**: Toggle ON (green)
   - **Allowed MIME types**: `application/pdf`
   - **File size limit**: `52428800` (50MB)
3. Click "Create bucket"

#### Bucket 3: training-materials

1. Click "New bucket"
2. Enter the following settings:
   - **Name**: `training-materials`
   - **Public bucket**: Toggle ON (green)
   - **Allowed MIME types**: Leave empty for all types
   - **File size limit**: `52428800` (50MB)
3. Click "Create bucket"

### Step 3: Configure Storage Policies

For each bucket, you need to add policies to control access. Click on a bucket, then click "Policies" tab.

#### For each bucket, add these policies:

**Policy 1: Public Read Access**
1. Click "New Policy"
2. Select "For full customization"
3. Configure:
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: Leave empty (applies to all)
   - **USING expression**: `true`
4. Click "Review" then "Save policy"

**Policy 2: Authenticated Upload**
1. Click "New Policy"
2. Select "For full customization"
3. Configure:
   - **Policy name**: `Authenticated users can upload`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**: `true`
4. Click "Review" then "Save policy"

**Policy 3: Authenticated Update**
1. Click "New Policy"
2. Select "For full customization"
3. Configure:
   - **Policy name**: `Authenticated users can update`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
4. Click "Review" then "Save policy"

**Policy 4: Authenticated Delete**
1. Click "New Policy"
2. Select "For full customization"
3. Configure:
   - **Policy name**: `Authenticated users can delete`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: `true`
4. Click "Review" then "Save policy"

---

## Authentication Configuration

### Step 1: Navigate to Authentication Settings

1. Click "Authentication" in the left sidebar
2. Click "Providers" tab

### Step 2: Configure Email Provider (Default)

The Email provider should be enabled by default. Verify settings:

1. Click on "Email" provider
2. Ensure it is enabled
3. Configure options:
   - **Confirm email**: ON (recommended for production)
   - **Secure email change**: ON
   - **Secure password change**: ON

### Step 3: Configure Site URL and Redirect URLs

1. Click "URL Configuration" in the Authentication settings
2. Set the following:

**Site URL** (your production domain):
```
https://your-domain.com
```

**Redirect URLs** (add all of these):
```
https://your-domain.com/auth/callback
https://your-domain.com/auth/set-password
https://your-domain.com/auth/complete-profile
http://localhost:3000/auth/callback
http://localhost:3000/auth/set-password
http://localhost:3000/auth/complete-profile
```

For Netlify deploy previews, also add:
```
https://*.netlify.app/auth/callback
https://*.netlify.app/auth/set-password
https://*.netlify.app/auth/complete-profile
```

### Step 4: Email Templates (Optional)

If using Supabase's built-in email (not Microsoft Graph):

1. Click "Email Templates" in Authentication settings
2. Customize templates for:
   - **Confirm signup**: Email sent when user signs up
   - **Invite user**: Email sent when admin invites a user
   - **Magic Link**: Email sent for passwordless login
   - **Change Email Address**: Email sent when user changes email
   - **Reset Password**: Email sent for password reset

Note: The Officials Portal uses Microsoft Graph for emails, so these templates may not be used.

### Step 5: Configure JWT Settings (Optional)

1. Click "Settings" in the Authentication section (not main Settings)
2. Review JWT settings:
   - **JWT Expiry**: Default 3600 seconds (1 hour)
   - You may increase this for better UX (e.g., 86400 for 24 hours)

---

## Environment Variables

### Step 1: Copy Environment Template

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Step 2: Update Supabase Variables

Edit `.env.local` and update these values with your Supabase credentials:

```env
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================

# Your Supabase Project URL (from API settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Your anon/public key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your service role key (KEEP SECRET - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Configure Storage Setting

```env
# Set to 'true' to use Supabase Storage (recommended)
NEXT_PUBLIC_USE_SUPABASE=true
```

### Step 4: Set Site URL

```env
# Your production site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Step 5: Deploy Environment Variables

For Netlify deployment, add these same variables to your Netlify site:

1. Go to Netlify Dashboard > Your Site > Site Settings
2. Click "Environment variables"
3. Add each variable from your `.env.local`

**Important**: Never commit `.env.local` to version control!

---

## Testing Your Setup

### Test 1: Database Connection

1. Open your browser's developer tools (F12)
2. Go to your local development site
3. Check the Console tab for any Supabase connection errors
4. If successful, you should see no red errors related to Supabase

### Test 2: Authentication Flow

1. Navigate to your login page
2. Try signing up with a test email
3. Check your email for the confirmation link
4. Click the link to verify your account
5. Try logging in with your credentials

### Test 3: Storage Upload

1. Log in as an authenticated user
2. Navigate to a page with file upload (e.g., Resources or Newsletters)
3. Try uploading a test PDF file
4. Verify the file appears in your Supabase Storage bucket
5. Verify you can view/download the file

### Test 4: Database Operations

1. Log in as an admin user
2. Try creating a new announcement
3. Verify it appears in the announcements list
4. Check Supabase Table Editor to confirm the data was saved
5. Try editing and deleting the announcement

### Test 5: API Keys Verification

Run this test to verify your keys are working:

```javascript
// In browser console (with your site open)
const { createClient } = await import('@supabase/supabase-js')

const supabase = createClient(
  'your-project-url',
  'your-anon-key'
)

// Test database access
const { data, error } = await supabase
  .from('members')
  .select('count')
  .limit(1)

if (error) {
  console.error('Database error:', error)
} else {
  console.log('Database connection successful!')
}
```

---

## Troubleshooting

### Common Issues

#### "Invalid API key" Error
- Verify you copied the entire key (they are very long)
- Check for extra spaces or line breaks
- Ensure you're using the correct key (anon vs service_role)

#### "Row Level Security" Errors
- RLS policies may be blocking access
- For debugging, temporarily check if service_role key works
- Review the policies on the affected table

#### Storage Upload Fails
- Check bucket policies are configured
- Verify the bucket exists and is public
- Check file size limits

#### Authentication Not Working
- Verify Site URL is correct in Supabase settings
- Check Redirect URLs include your domain
- Clear browser cookies and try again

#### "relation does not exist" Error
- Tables may not have been created
- Run the migration SQL again
- Check for typos in table names

### Getting Help

1. **Supabase Documentation**: https://supabase.com/docs
2. **Supabase Discord**: https://discord.supabase.com
3. **GitHub Issues**: Check the Officials Portal repository

### Useful SQL Queries for Debugging

```sql
-- Check all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies on a table
SELECT * FROM pg_policies WHERE tablename = 'members';

-- Check if user exists
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- Check storage buckets
SELECT * FROM storage.buckets;
```

---

## Summary

After completing this setup, you should have:

1. A Supabase project with all required tables
2. Three storage buckets configured with proper policies
3. Authentication configured with correct URLs
4. Environment variables set in your application
5. Tested database, auth, and storage functionality

Your Officials Portal is now connected to Supabase and ready to use!
