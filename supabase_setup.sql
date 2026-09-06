-- ==============================================================================
-- RUHIT LEAD TRACKING SYSTEM - COMPLETE SUPABASE CLOUD SETUP SCRIPT
-- Run this in your Supabase project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. APP USERS (Authentication & Role/Usage Power Control)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team_member',
  avatar_color TEXT DEFAULT '#00C2FF',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Master Account (ruhit111 / Babor@123)
INSERT INTO app_users (id, username, email, password, full_name, role, avatar_color, permissions)
VALUES (
  'usr-ruhit-owner',
  'ruhit111',
  'ruhit111@ros.com',
  'Babor@123',
  'Ruhit (Owner)',
  'admin',
  '#00C2FF',
  '{"can_view_leads": true, "can_create_edit_leads": true, "can_delete_leads": true, "can_bulk_import": true, "can_export_leads": true, "can_view_reports": true, "can_manage_settings": true, "can_manage_email_copies": true}'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- 3. BRANDS
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  website TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO brands (id, name, website, description) VALUES
  ('br-1', 'Training Express', 'https://trainingexpress.org.uk', 'Professional accredited courses'),
  ('br-2', 'John Academy', 'https://johnacademy.co.uk', 'Online learning platform'),
  ('br-3', 'One Education', 'https://oneeducation.org.uk', 'Career training certifications'),
  ('br-4', 'Thames College', 'https://thamescollege.org', 'Higher education academy'),
  ('br-5', 'Apex Learning', 'https://apexlearning.org.uk', 'Accredited skill training'),
  ('br-6', 'Alpha Academy', 'https://alphaacademy.org', 'Vocational qualifications'),
  ('br-7', 'Janets', 'https://janets.org.uk', 'Course marketplace'),
  ('br-8', 'iStudy', 'https://istudy.org.uk', 'CPD learning solutions'),
  ('br-9', 'Cambridge Open Academy', 'https://cambridgeopenacademy.com', 'Distance learning academy'),
  ('br-10', 'Skill Up', 'https://skillup.org.uk', 'Skills upskilling')
ON CONFLICT (id) DO NOTHING;

-- 4. ACCOUNTS (16 Outbound Accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  account_name TEXT UNIQUE NOT NULL,
  email_account TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  brand_id TEXT,
  brand_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO accounts (id, account_name, email_account, sender_name, brand_id, brand_name) VALUES
  ('acc-1', 'Farzan TX', 'farzan@trainingexpress.org.uk', 'Farzan Hussain', 'br-1', 'Training Express'),
  ('acc-2', 'Collab JA', 'collaboration@johnacademy.co.uk', 'Farzan Hussain', 'br-2', 'John Academy'),
  ('acc-3', 'Business OE', 'business@oneeducation.org.uk', 'Anisur Rahman', 'br-3', 'One Education'),
  ('acc-4', 'Thames College', 'business@thamescollege.org', 'Kamran Hussain', 'br-4', 'Thames College'),
  ('acc-5', 'Corp JA', 'corporate@johnacademy.co.uk', 'Farzan Hussain', 'br-2', 'John Academy'),
  ('acc-6', 'Enterprise TX', 'enterprise@trainingexpress.org.uk', 'Farzan Hussain', 'br-1', 'Training Express'),
  ('acc-7', 'B2B TX', 'b2b@trainingexpress.org.uk', 'Farzan Hussain', 'br-1', 'Training Express'),
  ('acc-8', 'Anis OE', 'anis@oneeducation.org.uk', 'Anisur Rahman', 'br-3', 'One Education'),
  ('acc-9', 'Corp APX', 'corporate@apexlearning.org.uk', 'Kamran Hussain', 'br-5', 'Apex Learning'),
  ('acc-10', 'Partner ALP', 'partnership@alphaacademy.org', 'Kamran Hussain', 'br-6', 'Alpha Academy'),
  ('acc-11', 'Sagar JA', 'sagar@johnacademy.co.uk', 'Sagar Ali', 'br-2', 'John Academy'),
  ('acc-12', 'B2B JNTS', 'b2b@janets.org.uk', 'Kamran Hussain', 'br-7', 'Janets'),
  ('acc-13', 'iSutdyt', 'Muhammad@istudy.org.uk', 'Kamran Hussain', 'br-8', 'iStudy'),
  ('acc-14', 'Business CMB', 'business@cambridgeopenacademy.com', 'Kamran Hussain', 'br-9', 'Cambridge Open Academy'),
  ('acc-15', 'Business TX', 'business@trainingexpress.org.uk', 'Kamran Hussain', 'br-1', 'Training Express'),
  ('acc-16', 'Collab TX', 'collaboration@trainingexpress.org.uk', 'Farzan Hussain', 'br-1', 'Training Express')
ON CONFLICT (id) DO NOTHING;

-- 5. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  brand_id TEXT,
  account_id TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO campaigns (id, name, status, notes) VALUES
  ('cmp-1', 'Follow Up Email', 'Active', 'Re-engagement sequence for responsive prospects'),
  ('cmp-2', 'UNI Campaign', 'Active', 'University and academic outreach drive'),
  ('cmp-3', 'Email Campaign', 'Active', 'General outbound corporate email campaign'),
  ('cmp-4', 'B2B Outbound Q3', 'Active', 'Targeting UK & international enterprises'),
  ('cmp-5', 'Care Campaign UK', 'Active', 'Health and social care providers outreach')
ON CONFLICT (id) DO NOTHING;

-- 6. LEAD LISTS
CREATE TABLE IF NOT EXISTS lead_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#00C2FF',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO lead_lists (id, name, description, color) VALUES
  ('list-1', 'UK Tech Outbound', 'Priority outreach for UK tech founders and directors', '#00C2FF'),
  ('list-2', 'Enterprise August', 'Enterprise tier prospects for Q3 training contracts', '#00E5A0'),
  ('list-3', 'High Priority Followups', 'Active prospects needing WhatsApp & call followups', '#F97316')
ON CONFLICT (id) DO NOTHING;

-- 7. CENTRAL LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  whatsapp_number TEXT,
  alternative_phone TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  source TEXT DEFAULT 'Manual / Import',
  priority TEXT DEFAULT 'Medium',
  list_ids TEXT[] DEFAULT '{}',
  
  -- Campaign & Account metadata
  campaign_id TEXT,
  campaign_name TEXT,
  brand_id TEXT,
  brand_name TEXT,
  account_id TEXT,
  account_name TEXT,
  assigned_user_id TEXT,
  assigned_user_name TEXT,
  
  -- Dispatches & Dates
  email_1 TEXT,
  email_2 TEXT,
  email_3 TEXT,
  email_1_date TEXT,
  email_2_date TEXT,
  email_3_date TEXT,
  whatsapp_followup_stage TEXT,
  interested_email_followup_stage TEXT,
  
  -- Cumulative Lifecycle Milestones
  is_interested BOOLEAN DEFAULT false,
  interested_at TIMESTAMPTZ,
  is_meeting_scheduled BOOLEAN DEFAULT false,
  meeting_scheduled_at TIMESTAMPTZ,
  is_meeting_done BOOLEAN DEFAULT false,
  meeting_done_at TIMESTAMPTZ,
  meeting_count_type TEXT DEFAULT NULL,
  meeting_count_at TIMESTAMPTZ,
  is_pending BOOLEAN DEFAULT false,
  pending_at TIMESTAMPTZ,
  
  -- Meeting Info
  meeting_date TEXT,
  meeting_time TEXT,
  meeting_timezone TEXT DEFAULT 'Asia/Dhaka',
  meeting_type TEXT DEFAULT 'Google Meet',
  meeting_link TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast Indexes for Leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_is_interested ON leads(is_interested);
CREATE INDEX IF NOT EXISTS idx_leads_meeting_count ON leads(meeting_count_type);

-- 8. MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  lead_email TEXT,
  lead_whatsapp TEXT,
  campaign_name TEXT,
  brand_name TEXT,
  account_name TEXT,
  assigned_user_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  meeting_type TEXT DEFAULT 'Google Meet',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. LEAD ACTIVITIES / AUDIT TRAIL
CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. EMAIL COPIES (A/B testing, Multiple Subjects, Sequences)
CREATE TABLE IF NOT EXISTS email_copies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  step_number INTEGER DEFAULT 1,
  subject_line_1 TEXT NOT NULL,
  subject_line_2 TEXT,
  body_preview TEXT,
  full_body TEXT,
  brand_id TEXT,
  brand_name TEXT,
  account_id TEXT,
  account_name TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. IMPORTANT NOTES
CREATE TABLE IF NOT EXISTS important_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. TODO TASKS
CREATE TABLE IF NOT EXISTS todo_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'Medium',
  due_date TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. DISABLE ROW LEVEL SECURITY (RLS) FOR DIRECT ACCESS VIA ANON KEY
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_copies DISABLE ROW LEVEL SECURITY;
ALTER TABLE important_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE todo_tasks DISABLE ROW LEVEL SECURITY;

-- 15. ENABLE REALTIME PUBLICATION
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
