-- ==============================================================================
-- RUHIT LEAD TRACKING SYSTEM - DATABASE ARCHITECTURE & SCHEMA
-- Production PostgreSQL Schema for Supabase Cloud
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & USER ACCOUNTS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'team_member')) DEFAULT 'team_member',
  avatar_color TEXT DEFAULT '#00C2FF',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-seed core users
INSERT INTO profiles (email, full_name, role, avatar_color) VALUES
  ('ruhit@ros.com', 'Ruhit', 'admin', '#00C2FF'),
  ('nayeemur@ros.com', 'Nayeemur', 'team_member', '#00E5A0'),
  ('farzan@ros.com', 'Farzan Hussain', 'manager', '#3B82F6'),
  ('kamran@ros.com', 'Kamran Hussain', 'manager', '#8B5CF6'),
  ('sagar@ros.com', 'Sagar Ali', 'team_member', '#F97316'),
  ('anis@ros.com', 'Anisur Rahman', 'team_member', '#EC4899')
ON CONFLICT (email) DO NOTHING;

-- 2. BRANDS
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO brands (name, website, description) VALUES
  ('Training Express', 'https://trainingexpress.org.uk', 'Professional accredited training courses in the UK'),
  ('John Academy', 'https://johnacademy.co.uk', 'Leading online learning platform in UK'),
  ('One Education', 'https://oneeducation.org.uk', 'Comprehensive career training and certifications'),
  ('Thames College', 'https://thamescollege.org', 'Higher and vocational education academy'),
  ('Apex Learning', 'https://apexlearning.org.uk', 'Accredited skill training provider'),
  ('Alpha Academy', 'https://alphaacademy.org', 'Vocational online qualification institution'),
  ('Janets', 'https://janets.org.uk', 'Career development and course marketplace'),
  ('iStudy', 'https://istudy.org.uk', 'Fast-track CPD certified learning solutions'),
  ('Cambridge Open Academy', 'https://cambridgeopenacademy.com', 'Global open distance learning academy'),
  ('Skill Up', 'https://skillup.org.uk', 'Skills upskilling and professional growth')
ON CONFLICT (name) DO NOTHING;

-- 3. ACCOUNTS (16 Core Outbound Accounts from Requirement 22)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT UNIQUE NOT NULL,
  email_account TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed all 16 designated accounts
INSERT INTO accounts (account_name, email_account, sender_name) VALUES
  ('Farzan TX', 'farzan@trainingexpress.org.uk', 'Farzan Hussain'),
  ('Collab JA', 'collaboration@johnacademy.co.uk', 'Farzan Hussain'),
  ('Business OE', 'business@oneeducation.org.uk', 'Anisur Rahman'),
  ('Thames College', 'business@thamescollege.org', 'Kamran Hussain'),
  ('Corp JA', 'corporate@johnacademy.co.uk', 'Farzan Hussain'),
  ('Enterprise TX', 'enterprise@trainingexpress.org.uk', 'Farzan Hussain'),
  ('B2B TX', 'b2b@trainingexpress.org.uk', 'Farzan Hussain'),
  ('Anis OE', 'anis@oneeducation.org.uk', 'Anisur Rahman'),
  ('Corp APX', 'corporate@apexlearning.org.uk', 'Kamran Hussain'),
  ('Partner ALP', 'partnership@alphaacademy.org', 'Kamran Hussain'),
  ('Sagar JA', 'sagar@johnacademy.co.uk', 'Sagar Ali'),
  ('B2B JNTS', 'b2b@janets.org.uk', 'Kamran Hussain'),
  ('iSutdyt', 'Muhammad@istudy.org.uk', 'Kamran Hussain'),
  ('Business CMB', 'business@cambridgeopenacademy.com', 'Kamran Hussain'),
  ('Business TX', 'business@trainingexpress.org.uk', 'Kamran Hussain'),
  ('Collab TX', 'collaboration@trainingexpress.org.uk', 'Farzan Hussain')
ON CONFLICT (account_name) DO NOTHING;

-- 4. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Paused', 'Completed', 'Archived')) DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO campaigns (name, status, notes) VALUES
  ('Follow Up Email', 'Active', 'Re-engagement sequence for responsive prospects'),
  ('UNI Campaign', 'Active', 'University and academic outreach drive'),
  ('Email Campaign', 'Active', 'General outbound corporate email campaign'),
  ('B2B Outbound Q3', 'Active', 'Targeting UK & international enterprises'),
  ('Care Campaign UK', 'Active', 'Health and social care providers outreach')
ON CONFLICT (name) DO NOTHING;

-- 5. LEADS (CENTRAL DATABASE WITH CUMULATIVE LIFECYCLE MILESTONES)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  whatsapp_number TEXT,
  country TEXT,
  city TEXT,
  notes TEXT,
  source TEXT DEFAULT 'Manual / Import',
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'DNC')) DEFAULT 'Medium',
  
  -- Foreign Relations
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Cumulative Lifecycle Milestones & Timestamps
  is_interested BOOLEAN DEFAULT false,
  interested_at TIMESTAMPTZ,
  
  is_meeting_scheduled BOOLEAN DEFAULT false,
  meeting_scheduled_at TIMESTAMPTZ,
  
  is_meeting_done BOOLEAN DEFAULT false,
  meeting_done_at TIMESTAMPTZ,
  
  meeting_count_type TEXT CHECK (meeting_count_type IN ('YES', 'NO', NULL)) DEFAULT NULL,
  meeting_count_at TIMESTAMPTZ,
  
  is_pending BOOLEAN DEFAULT false,
  pending_at TIMESTAMPTZ,
  pending_completed_at TIMESTAMPTZ,
  
  -- Meeting Booking Information
  meeting_date DATE,
  meeting_time TIME,
  meeting_timezone TEXT DEFAULT 'Asia/Dhaka',
  meeting_type TEXT,
  meeting_link TEXT,
  
  -- Follow-up & Contact Tracking
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_brand ON leads(brand_id);
CREATE INDEX IF NOT EXISTS idx_leads_account ON leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_interested ON leads(is_interested);
CREATE INDEX IF NOT EXISTS idx_leads_meeting_sched ON leads(is_meeting_scheduled);
CREATE INDEX IF NOT EXISTS idx_leads_meeting_done ON leads(is_meeting_done);
CREATE INDEX IF NOT EXISTS idx_leads_meeting_count ON leads(meeting_count_type);
CREATE INDEX IF NOT EXISTS idx_leads_pending ON leads(is_pending);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- 6. LEAD ACTIVITIES (CHRONOLOGICAL TIMELINE)
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);

-- 7. MEETINGS (SYNCHRONIZED WITH LEADS & KANBAN)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'missed', 'done', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',
  outcome TEXT CHECK (outcome IN ('meeting_count_yes', 'meeting_count_no', 'pending', 'rescheduled', 'no_show', NULL)),
  meeting_link TEXT,
  location TEXT,
  meeting_type TEXT DEFAULT 'Google Meet',
  notes TEXT,
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_lead ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- 8. NOTES
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_lead ON notes(lead_id);

-- 9. REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  reminder_type TEXT DEFAULT 'Follow-up',
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  note TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_lead ON reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);

-- 10. GOOGLE MAIL MERGE BATCHES
CREATE TABLE IF NOT EXISTS mail_merge_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  sender_name TEXT,
  lead_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mail_merge_batch_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES mail_merge_batches(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(batch_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_leads_batch ON mail_merge_batch_leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_leads_lead ON mail_merge_batch_leads(lead_id);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meeting_upcoming', 'meeting_missed', 'follow_up_due', 'reminder', 'system')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_lead ON audit_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 13. DAILY REPORT OVERRIDES
CREATE TABLE IF NOT EXISTS daily_report_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  manual_value INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_date, user_id, metric_key)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_merge_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_merge_batch_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_overrides ENABLE ROW LEVEL SECURITY;

-- Transparent standard policies for CRM team access
DO 
BEGIN
  CREATE POLICY "Allow team read profiles" ON profiles FOR SELECT USING (true);
  CREATE POLICY "Allow team write profiles" ON profiles FOR ALL USING (true);
  
  CREATE POLICY "Allow team read brands" ON brands FOR SELECT USING (true);
  CREATE POLICY "Allow team write brands" ON brands FOR ALL USING (true);
  
  CREATE POLICY "Allow team read accounts" ON accounts FOR SELECT USING (true);
  CREATE POLICY "Allow team write accounts" ON accounts FOR ALL USING (true);
  
  CREATE POLICY "Allow team read campaigns" ON campaigns FOR SELECT USING (true);
  CREATE POLICY "Allow team write campaigns" ON campaigns FOR ALL USING (true);
  
  CREATE POLICY "Allow team read leads" ON leads FOR SELECT USING (true);
  CREATE POLICY "Allow team write leads" ON leads FOR ALL USING (true);
  
  CREATE POLICY "Allow team read activities" ON lead_activities FOR SELECT USING (true);
  CREATE POLICY "Allow team write activities" ON lead_activities FOR ALL USING (true);
  
  CREATE POLICY "Allow team read meetings" ON meetings FOR SELECT USING (true);
  CREATE POLICY "Allow team write meetings" ON meetings FOR ALL USING (true);
  
  CREATE POLICY "Allow team read notes" ON notes FOR SELECT USING (true);
  CREATE POLICY "Allow team write notes" ON notes FOR ALL USING (true);
  
  CREATE POLICY "Allow team read reminders" ON reminders FOR SELECT USING (true);
  CREATE POLICY "Allow team write reminders" ON reminders FOR ALL USING (true);
  
  CREATE POLICY "Allow team read mail_merge_batches" ON mail_merge_batches FOR SELECT USING (true);
  CREATE POLICY "Allow team write mail_merge_batches" ON mail_merge_batches FOR ALL USING (true);
  
  CREATE POLICY "Allow team read mail_merge_batch_leads" ON mail_merge_batch_leads FOR SELECT USING (true);
  CREATE POLICY "Allow team write mail_merge_batch_leads" ON mail_merge_batch_leads FOR ALL USING (true);
  
  CREATE POLICY "Allow team read notifications" ON notifications FOR SELECT USING (true);
  CREATE POLICY "Allow team write notifications" ON notifications FOR ALL USING (true);
  
  CREATE POLICY "Allow team read audit_logs" ON audit_logs FOR SELECT USING (true);
  CREATE POLICY "Allow team write audit_logs" ON audit_logs FOR ALL USING (true);

  CREATE POLICY "Allow team read daily_report_overrides" ON daily_report_overrides FOR SELECT USING (true);
  CREATE POLICY "Allow team write daily_report_overrides" ON daily_report_overrides FOR ALL USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END ;

-- Enable Realtime publication for instant cloud broadcast across devices
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
