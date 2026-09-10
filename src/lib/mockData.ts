import {
  Lead,
  LeadList,
  UserProfile,
  UserPermissions,
  Brand,
  Account,
  Campaign,
  Meeting,
  LeadActivity,
  Reminder,
  InAppNotification,
  MailMergeBatch,
  EmailCopy,
  ImportantNote,
  TaskItem,
  CollectionKeywordSet,
  CollectionKeyword,
  CollectionLocation,
  CollectionBatch,
} from '../types';

export const INITIAL_LISTS: LeadList[] = [
  { id: 'list-1', name: 'UK Tech Outbound', description: 'Priority outreach for UK tech founders and directors', color: '#00C2FF', created_at: '2026-09-01T00:00:00Z' },
  { id: 'list-2', name: 'Enterprise August', description: 'Enterprise tier prospects for Q3 training contracts', color: '#00E5A0', created_at: '2026-09-01T00:00:00Z' },
  { id: 'list-3', name: 'High Priority Followups', description: 'Active prospects needing WhatsApp & call followups', color: '#F97316', created_at: '2026-09-02T00:00:00Z' },
];

export const MASTER_PERMISSIONS: UserPermissions = {
  can_view_leads: true,
  can_create_edit_leads: true,
  can_delete_leads: true,
  can_bulk_import: true,
  can_export_leads: true,
  can_view_reports: true,
  can_manage_settings: true,
  can_manage_email_copies: true,
  can_manage_lead_collections: true,
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-ruhit-owner',
    username: 'ruhit111',
    password: 'Babor@123',
    email: 'ruhit111@ros.com',
    full_name: 'Ruhit (Owner)',
    role: 'admin',
    avatar_color: '#00C2FF',
    permissions: MASTER_PERMISSIONS,
    created_at: '2026-09-01T00:00:00Z',
  },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'br-1', name: 'Training Express', website: 'https://trainingexpress.org.uk', status: 'active' },
  { id: 'br-2', name: 'John Academy', website: 'https://johnacademy.co.uk', status: 'active' },
  { id: 'br-3', name: 'One Education', website: 'https://oneeducation.org.uk', status: 'active' },
  { id: 'br-4', name: 'Thames College', website: 'https://thamescollege.org', status: 'active' },
  { id: 'br-5', name: 'Apex Learning', website: 'https://apexlearning.org.uk', status: 'active' },
  { id: 'br-6', name: 'Alpha Academy', website: 'https://alphaacademy.org', status: 'active' },
  { id: 'br-7', name: 'Janets', website: 'https://janets.org.uk', status: 'active' },
  { id: 'br-8', name: 'iStudy', website: 'https://istudy.org.uk', status: 'active' },
  { id: 'br-9', name: 'Cambridge Open Academy', website: 'https://cambridgeopenacademy.com', status: 'active' },
  { id: 'br-10', name: 'Skill Up', website: 'https://skillup.org.uk', status: 'active' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', account_name: 'Farzan TX', email_account: 'farzan@trainingexpress.org.uk', sender_name: 'Farzan Hussain', brand_id: 'br-1', brand_name: 'Training Express', status: 'active' },
  { id: 'acc-2', account_name: 'Collab JA', email_account: 'collaboration@johnacademy.co.uk', sender_name: 'Farzan Hussain', brand_id: 'br-2', brand_name: 'John Academy', status: 'active' },
  { id: 'acc-3', account_name: 'Business OE', email_account: 'business@oneeducation.org.uk', sender_name: 'Anisur Rahman', brand_id: 'br-3', brand_name: 'One Education', status: 'active' },
  { id: 'acc-4', account_name: 'Thames College', email_account: 'business@thamescollege.org', sender_name: 'Kamran Hussain', brand_id: 'br-4', brand_name: 'Thames College', status: 'active' },
  { id: 'acc-5', account_name: 'Corp JA', email_account: 'corporate@johnacademy.co.uk', sender_name: 'Farzan Hussain', brand_id: 'br-2', brand_name: 'John Academy', status: 'active' },
  { id: 'acc-6', account_name: 'Enterprise TX', email_account: 'enterprise@trainingexpress.org.uk', sender_name: 'Farzan Hussain', brand_id: 'br-1', brand_name: 'Training Express', status: 'active' },
  { id: 'acc-7', account_name: 'B2B TX', email_account: 'b2b@trainingexpress.org.uk', sender_name: 'Farzan Hussain', brand_id: 'br-1', brand_name: 'Training Express', status: 'active' },
  { id: 'acc-8', account_name: 'Anis OE', email_account: 'anis@oneeducation.org.uk', sender_name: 'Anisur Rahman', brand_id: 'br-3', brand_name: 'One Education', status: 'active' },
  { id: 'acc-9', account_name: 'Corp APX', email_account: 'corporate@apexlearning.org.uk', sender_name: 'Kamran Hussain', brand_id: 'br-5', brand_name: 'Apex Learning', status: 'active' },
  { id: 'acc-10', account_name: 'Partner ALP', email_account: 'partnership@alphaacademy.org', sender_name: 'Kamran Hussain', brand_id: 'br-6', brand_name: 'Alpha Academy', status: 'active' },
  { id: 'acc-11', account_name: 'Sagar JA', email_account: 'sagar@johnacademy.co.uk', sender_name: 'Sagar Ali', brand_id: 'br-2', brand_name: 'John Academy', status: 'active' },
  { id: 'acc-12', account_name: 'B2B JNTS', email_account: 'b2b@janets.org.uk', sender_name: 'Kamran Hussain', brand_id: 'br-7', brand_name: 'Janets', status: 'active' },
  { id: 'acc-13', account_name: 'iSutdyt', email_account: 'Muhammad@istudy.org.uk', sender_name: 'Kamran Hussain', brand_id: 'br-8', brand_name: 'iStudy', status: 'active' },
  { id: 'acc-14', account_name: 'Business CMB', email_account: 'business@cambridgeopenacademy.com', sender_name: 'Kamran Hussain', brand_id: 'br-9', brand_name: 'Cambridge Open Academy', status: 'active' },
  { id: 'acc-15', account_name: 'Business TX', email_account: 'business@trainingexpress.org.uk', sender_name: 'Kamran Hussain', brand_id: 'br-1', brand_name: 'Training Express', status: 'active' },
  { id: 'acc-16', account_name: 'Collab TX', email_account: 'collaboration@trainingexpress.org.uk', sender_name: 'Farzan Hussain', brand_id: 'br-1', brand_name: 'Training Express', status: 'active' },
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'cmp-1', name: 'Follow Up Email', brand_id: 'br-1', account_id: 'acc-1', status: 'Active' },
  { id: 'cmp-2', name: 'UNI Campaign', brand_id: 'br-4', account_id: 'acc-4', status: 'Active' },
  { id: 'cmp-3', name: 'Email Campaign', brand_id: 'br-3', account_id: 'acc-3', status: 'Active' },
  { id: 'cmp-4', name: 'B2B Outbound Q3', brand_id: 'br-1', account_id: 'acc-7', status: 'Active' },
  { id: 'cmp-5', name: 'Care Campaign UK', brand_id: 'br-2', account_id: 'acc-2', status: 'Active' },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    email: 'admin@languageinstituten.com',
    first_name: 'Solomon',
    last_name: 'Kariuki',
    company_name: 'Language Institute',
    alternative_phone: '+254712345678',
    list_ids: ['list-1'],
    country: 'Kenya',
    city: 'Nairobi',
    priority: 'High',
    campaign_id: 'cmp-1',
    campaign_name: 'Follow Up Email',
    brand_id: 'br-1',
    brand_name: 'Training Express',
    account_id: 'acc-1',
    account_name: 'Farzan TX',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    is_interested: true,
    interested_at: '2026-09-01T09:00:00.000Z',
    is_meeting_scheduled: true,
    meeting_scheduled_at: '2026-09-02T11:00:00.000Z',
    is_meeting_done: false,
    meeting_count_type: null,
    is_pending: false,
    meeting_date: '2026-09-08',
    meeting_time: '14:00',
    meeting_timezone: 'Asia/Dhaka',
    meeting_type: 'Google Meet',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    tags: ['Hot', 'Corporate'],
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-02T11:00:00.000Z'
  },
  {
    id: 'lead-2',
    email: 'info@workplacesafetygroup.co.uk',
    first_name: 'Paul',
    last_name: 'Henderson',
    company_name: 'Workplace Safety Group',
    whatsapp_number: '+443333208568',
    alternative_phone: '+442079460123',
    list_ids: ['list-1', 'list-2'],
    country: 'United Kingdom',
    city: 'London',
    priority: 'High',
    campaign_id: 'cmp-2',
    campaign_name: 'UNI Campaign',
    brand_id: 'br-2',
    brand_name: 'John Academy',
    account_id: 'acc-2',
    account_name: 'Collab JA',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    is_interested: true,
    interested_at: '2026-09-01T10:30:00.000Z',
    is_meeting_scheduled: true,
    meeting_scheduled_at: '2026-09-02T14:00:00.000Z',
    is_meeting_done: true,
    meeting_done_at: '2026-09-03T15:00:00.000Z',
    meeting_count_type: 'YES',
    meeting_count_at: '2026-09-03T15:30:00.000Z',
    is_pending: false,
    tags: ['Closed Won', 'High Priority'],
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-03T15:30:00.000Z'
  },
  {
    id: 'lead-3',
    email: 'info@simonmorrell.com',
    first_name: 'Simon',
    last_name: 'Morrell',
    company_name: 'Simon Morrell Coaching',
    whatsapp_number: '+447484331572',
    country: 'United Kingdom',
    city: 'Cardiff',
    priority: 'Medium',
    campaign_id: 'cmp-2',
    campaign_name: 'UNI Campaign',
    brand_id: 'br-4',
    brand_name: 'Thames College',
    account_id: 'acc-4',
    account_name: 'Thames College',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    is_interested: true,
    interested_at: '2026-09-02T08:00:00.000Z',
    is_meeting_scheduled: true,
    meeting_scheduled_at: '2026-09-03T10:00:00.000Z',
    is_meeting_done: true,
    meeting_done_at: '2026-09-04T12:00:00.000Z',
    meeting_count_type: 'NO', // Meeting Count = NO, but Meeting Done = YES!
    meeting_count_at: '2026-09-04T12:30:00.000Z',
    is_pending: true, // Independent pending follow up
    pending_at: '2026-09-04T12:35:00.000Z',
    notes: 'Meeting happened. Budget constraints for Q3. Pending follow up in 2 weeks.',
    tags: ['Follow-up'],
    created_at: '2026-09-02T08:00:00.000Z',
    updated_at: '2026-09-04T12:35:00.000Z'
  },
  {
    id: 'lead-4',
    email: 'info@swahilicourses.co.tz',
    first_name: 'Martin',
    last_name: 'Mtemi',
    company_name: 'Swahili Learning Co',
    whatsapp_number: '+255739621510',
    country: 'Tanzania',
    city: 'Dar es Salaam',
    priority: 'High',
    campaign_id: 'cmp-3',
    campaign_name: 'Email Campaign',
    brand_id: 'br-1',
    brand_name: 'Training Express',
    account_id: 'acc-1',
    account_name: 'Farzan TX',
    assigned_user_id: 'usr-nayeemur',
    assigned_user_name: 'Nayeemur',
    is_interested: true,
    interested_at: '2026-09-03T09:15:00.000Z',
    is_meeting_scheduled: true,
    meeting_scheduled_at: '2026-09-04T11:00:00.000Z',
    is_meeting_done: false,
    meeting_count_type: null,
    is_pending: false,
    meeting_date: '2026-09-05', // in the past -> Missed meeting!
    meeting_time: '15:00',
    tags: ['Hot'],
    created_at: '2026-09-03T09:00:00.000Z',
    updated_at: '2026-09-04T11:00:00.000Z'
  },
  {
    id: 'lead-5',
    email: 'info@digitaxbs.co.za',
    first_name: 'Nyasha',
    last_name: 'Chikwanha',
    company_name: 'DigiTax Business Solutions',
    whatsapp_number: '+27870309089',
    country: 'South Africa',
    city: 'Johannesburg',
    priority: 'Medium',
    campaign_id: 'cmp-3',
    campaign_name: 'Email Campaign',
    brand_id: 'br-10',
    brand_name: 'Skill Up',
    account_id: 'acc-3',
    account_name: 'Business OE',
    assigned_user_id: 'usr-nayeemur',
    assigned_user_name: 'Nayeemur',
    is_interested: true,
    interested_at: '2026-09-03T11:00:00.000Z',
    is_meeting_scheduled: true,
    meeting_scheduled_at: '2026-09-04T13:00:00.000Z',
    is_meeting_done: true,
    meeting_done_at: '2026-09-04T16:00:00.000Z',
    meeting_count_type: 'YES',
    meeting_count_at: '2026-09-04T16:15:00.000Z',
    is_pending: false,
    tags: ['Corporate'],
    created_at: '2026-09-03T10:00:00.000Z',
    updated_at: '2026-09-04T16:15:00.000Z'
  },
  {
    id: 'lead-6',
    email: 'r.steeles@securehealthcaresolutions.co.uk',
    first_name: 'Robbie',
    last_name: 'Steeles',
    company_name: 'Secure Healthcare Solutions',
    country: 'United Kingdom',
    city: 'Wolverhampton',
    priority: 'Medium',
    campaign_id: 'cmp-5',
    campaign_name: 'Care Campaign UK',
    brand_id: 'br-2',
    brand_name: 'John Academy',
    account_id: 'acc-2',
    account_name: 'Collab JA',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    is_interested: false,
    is_meeting_scheduled: false,
    is_meeting_done: false,
    meeting_count_type: null,
    is_pending: false,
    created_at: '2026-08-25T09:00:00.000Z',
    updated_at: '2026-08-25T09:00:00.000Z'
  },
  {
    id: 'lead-7',
    email: 'stephen.mander@serenitycaresolent.co.uk',
    first_name: 'Steve',
    last_name: 'Mander',
    company_name: 'Serenity Care Solent Limited',
    country: 'United Kingdom',
    city: 'Gosport',
    priority: 'Medium',
    campaign_id: 'cmp-5',
    campaign_name: 'Care Campaign UK',
    brand_id: 'br-2',
    brand_name: 'John Academy',
    account_id: 'acc-2',
    account_name: 'Collab JA',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    is_interested: false,
    is_meeting_scheduled: false,
    is_meeting_done: false,
    meeting_count_type: null,
    is_pending: false,
    created_at: '2026-08-25T09:15:00.000Z',
    updated_at: '2026-08-25T09:15:00.000Z'
  }
];

export const INITIAL_ACTIVITIES: LeadActivity[] = [
  {
    id: 'act-1',
    lead_id: 'lead-1',
    activity_type: 'Interested',
    description: 'Lead responded expressing interest in corporate training package',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-01T09:00:00.000Z'
  },
  {
    id: 'act-2',
    lead_id: 'lead-1',
    activity_type: 'WhatsApp Sent',
    description: 'Shared introductory brochure via WhatsApp',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'act-3',
    lead_id: 'lead-1',
    activity_type: 'Meeting Scheduled',
    description: 'Scheduled discovery call for Sep 08, 14:00 (Asia/Dhaka)',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-02T11:00:00.000Z'
  },
  {
    id: 'act-4',
    lead_id: 'lead-2',
    activity_type: 'Meeting Done',
    description: 'Discovery session completed successfully with Managing Director',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-03T15:00:00.000Z'
  },
  {
    id: 'act-5',
    lead_id: 'lead-2',
    activity_type: 'Meeting Count YES',
    description: 'Qualified meeting confirmed towards Monthly Meeting Count',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-03T15:30:00.000Z'
  },
  {
    id: 'act-6',
    lead_id: 'lead-3',
    activity_type: 'Meeting Done',
    description: 'Meeting held with Simon Morrell',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-04T12:00:00.000Z'
  },
  {
    id: 'act-7',
    lead_id: 'lead-3',
    activity_type: 'Meeting Count NO',
    description: 'Meeting completed but disqualified for count (budget constraints)',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-04T12:30:00.000Z'
  },
  {
    id: 'act-8',
    lead_id: 'lead-3',
    activity_type: 'Pending YES',
    description: 'Marked Pending YES for mid-September follow up',
    user_id: 'usr-ruhit',
    user_name: 'Ruhit',
    created_at: '2026-09-04T12:35:00.000Z'
  },
  {
    id: 'act-9',
    lead_id: 'lead-4',
    activity_type: 'Meeting Missed',
    description: 'Prospect did not attend scheduled call on Sep 05 at 15:00',
    user_id: 'usr-nayeemur',
    user_name: 'Nayeemur',
    created_at: '2026-09-05T15:30:00.000Z'
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'mtg-1',
    lead_id: 'lead-1',
    lead_name: 'Solomon Kariuki',
    lead_company: 'Language Institute',
    lead_email: 'admin@languageinstituten.com',
    campaign_name: 'Follow Up Email',
    brand_name: 'Training Express',
    account_name: 'Farzan TX',
    scheduled_at: '2026-09-08T08:00:00.000Z',
    duration_minutes: 30,
    status: 'scheduled',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    created_at: '2026-09-02T11:00:00.000Z',
    updated_at: '2026-09-02T11:00:00.000Z'
  },
  {
    id: 'mtg-2',
    lead_id: 'lead-4',
    lead_name: 'Martin Mtemi',
    lead_company: 'Swahili Learning Co',
    lead_email: 'info@swahilicourses.co.tz',
    campaign_name: 'Email Campaign',
    brand_name: 'Training Express',
    account_name: 'Farzan TX',
    scheduled_at: '2026-09-05T09:00:00.000Z', // past
    duration_minutes: 45,
    status: 'missed',
    notes: 'Did not join call. Sent follow up email & WhatsApp.',
    assigned_user_id: 'usr-nayeemur',
    assigned_user_name: 'Nayeemur',
    created_at: '2026-09-04T11:00:00.000Z',
    updated_at: '2026-09-05T15:30:00.000Z'
  },
  {
    id: 'mtg-3',
    lead_id: 'lead-2',
    lead_name: 'Paul Henderson',
    lead_company: 'Workplace Safety Group',
    lead_email: 'info@workplacesafetygroup.co.uk',
    campaign_name: 'UNI Campaign',
    brand_name: 'John Academy',
    account_name: 'Collab JA',
    scheduled_at: '2026-09-03T09:00:00.000Z',
    duration_minutes: 30,
    status: 'done',
    outcome: 'meeting_count_yes',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-03T15:30:00.000Z'
  },
  {
    id: 'mtg-4',
    lead_id: 'lead-3',
    lead_name: 'Simon Morrell',
    lead_company: 'Simon Morrell Coaching',
    lead_email: 'info@simonmorrell.com',
    campaign_name: 'UNI Campaign',
    brand_name: 'Thames College',
    account_name: 'Thames College',
    scheduled_at: '2026-09-04T06:00:00.000Z',
    duration_minutes: 30,
    status: 'done',
    outcome: 'meeting_count_no',
    assigned_user_id: 'usr-ruhit',
    assigned_user_name: 'Ruhit',
    created_at: '2026-09-03T10:00:00.000Z',
    updated_at: '2026-09-04T12:30:00.000Z'
  }
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    lead_id: 'lead-3',
    lead_name: 'Simon Morrell',
    lead_company: 'Simon Morrell Coaching',
    reminder_type: 'Follow-up Call',
    reminder_date: '2026-09-10',
    reminder_time: '14:00',
    note: 'Call Simon to check if revised Q4 training budget is confirmed',
    user_id: 'usr-ruhit',
    is_completed: false,
    created_at: '2026-09-04T12:40:00.000Z'
  },
  {
    id: 'rem-2',
    lead_id: 'lead-4',
    lead_name: 'Martin Mtemi',
    lead_company: 'Swahili Learning Co',
    reminder_type: 'Reschedule Outreach',
    reminder_date: '2026-09-07',
    reminder_time: '11:00',
    note: 'Send WhatsApp reminder for missed meeting rescheduling',
    user_id: 'usr-nayeemur',
    is_completed: false,
    created_at: '2026-09-05T16:00:00.000Z'
  }
];

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    title: 'Missed Meeting Alert',
    message: 'Martin Mtemi (Swahili Learning Co) did not attend scheduled call on Sep 05.',
    type: 'meeting_missed',
    is_read: false,
    created_at: '2026-09-05T15:30:00.000Z'
  },
  {
    id: 'notif-2',
    title: 'Upcoming Meeting in 2 Days',
    message: 'Discovery session with Solomon Kariuki (Language Institute) scheduled for Sep 08 at 14:00.',
    type: 'meeting_upcoming',
    is_read: false,
    created_at: '2026-09-06T09:00:00.000Z'
  }
];

export const INITIAL_BATCHES: MailMergeBatch[] = [
  {
    id: 'batch-001',
    batch_number: 'ROS-MM-001',
    campaign_id: 'cmp-5',
    campaign_name: 'Care Campaign UK',
    brand_id: 'br-2',
    brand_name: 'John Academy',
    account_id: 'acc-2',
    account_name: 'Collab JA',
    sender_name: 'Farzan Hussain',
    lead_count: 2,
    created_by: 'usr-ruhit',
    created_by_name: 'Ruhit',
    created_at: '2026-08-25T10:00:00.000Z'
  }
];

export const INITIAL_EMAIL_COPIES: EmailCopy[] = [
  {
    id: 'copy-1',
    title: 'Executive Skills & Compliance Pitch',
    brand_id: 'br-1',
    brand_name: 'Training Express',
    account_id: 'acc-1',
    account_name: 'Farzan TX',
    campaign_id: 'cmp-1',
    campaign_name: 'Follow Up Email',
    sequence_step: 'Sequence 1 (Email 1 - Initial Pitch)',
    subject_line_1: 'Quick question regarding {{company_name}}\'s staff training',
    subject_line_2: 'Mandatory compliance & upskilling for {{company_name}} team',
    subject_lines_extra: ['Partnering with {{company_name}} on CPD accredited certifications'],
    body_text: `Hi {{first_name}},

I noticed that {{company_name}} has been expanding operations recently. When scaling teams, keeping up with mandatory compliance and specialized upskilling often becomes a logistical hurdle.

At Training Express, we partner with over 4,000 UK organizations to deliver accredited, on-demand compliance & professional certifications with measurable employee completion tracking.

Would you be open to a brief 10-minute discovery call this Thursday or Friday to explore if our tailored corporate portal could save {{company_name}} 35%+ on training overheads?

Best regards,
{{sender_name}}
Corporate Partnerships | Training Express`,
    notes: 'High conversion variant for Operations Directors & HR Leads. Uses compliance urgency angle.',
    status: 'active',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-05T14:30:00Z'
  },
  {
    id: 'copy-2',
    title: 'Follow Up 1: Case Study & Proof',
    brand_id: 'br-1',
    brand_name: 'Training Express',
    account_id: 'acc-1',
    account_name: 'Farzan TX',
    campaign_id: 'cmp-1',
    campaign_name: 'Follow Up Email',
    sequence_step: 'Sequence 2 (Email 2 - Follow Up)',
    subject_line_1: 'Case study: How similar teams reduced training costs by 40%',
    subject_line_2: 'Following up regarding {{company_name}} - quick thought',
    subject_lines_extra: ['{{first_name}}, sharing a quick benchmark for {{company_name}}'],
    body_text: `Hi {{first_name}},

Following up on my previous note. I wanted to quickly share how we recently assisted a mid-market workforce comparable to {{company_name}} in standardizing their CPD and workplace safety accreditations across 120+ staff in under 3 weeks.

Our corporate dashboard enabled their managers to:
1. Assign role-based modules in 1 click
2. Monitor real-time completion & downloadable audit records
3. Reduce overall cost per certification by 42%

Do you have 5 minutes next Tuesday at 11:00 AM UK time for a quick screen share?

Kind regards,
{{sender_name}}
Training Express`,
    notes: 'Send 3-4 business days after Sequence 1. Focuses on social proof and clear ROI metrics.',
    status: 'active',
    created_at: '2026-09-02T10:00:00Z',
    updated_at: '2026-09-05T14:30:00Z'
  },
  {
    id: 'copy-3',
    title: 'Care & Healthcare Sector Staff Upskilling',
    brand_id: 'br-2',
    brand_name: 'John Academy',
    account_id: 'acc-2',
    account_name: 'Collab JA',
    campaign_id: 'cmp-5',
    campaign_name: 'Care Campaign UK',
    sequence_step: 'Sequence 1 (Email 1 - Initial Pitch)',
    subject_line_1: 'Care Certificate & CPD training for {{company_name}}',
    subject_line_2: 'Supporting care staff compliance at {{company_name}}',
    body_text: `Hi {{first_name}},

Ensuring your care and nursing staff remain 100% CQC-compliant while maintaining high retention is one of the biggest challenges in the sector today.

At John Academy, we provide customized Care Certificate, Safeguarding, and Healthcare CPD bundles specifically structured for care home operators and domiciliary agencies like {{company_name}}.

Are you available for a brief chat this week to review our group licensing rates?

Warm regards,
{{sender_name}}
John Academy Business Team`,
    notes: 'Strictly for Care Home and Healthcare sector targets.',
    status: 'active',
    created_at: '2026-09-03T11:00:00Z'
  },
  {
    id: 'copy-4',
    title: 'Breakup / Final Attempt Permission Call',
    brand_id: 'br-3',
    brand_name: 'One Education',
    account_id: 'acc-3',
    account_name: 'Business OE',
    campaign_id: 'cmp-3',
    campaign_name: 'Email Campaign',
    sequence_step: 'Sequence 3 (Email 3 - Final Break-up)',
    subject_line_1: 'Permission to close your file, {{first_name}}?',
    subject_line_2: 'Should I pause outreach to {{company_name}}?',
    body_text: `Hi {{first_name}},

I haven't heard back from you, so I assume staff training and workforce development isn't a priority for {{company_name}} at this moment.

I will stop reaching out so I don't clutter your inbox. If things change in Q4 and you'd like to benchmark your corporate training pricing, please feel free to drop me a note anytime.

Wishing you and {{company_name}} all the best,
{{sender_name}}
One Education`,
    notes: 'Final sequence email. Yields 15-20% last-ditch response rate from busy executives.',
    status: 'active',
    created_at: '2026-09-04T12:00:00Z'
  }
];

export const INITIAL_IMPORTANT_NOTES: ImportantNote[] = [
  {
    id: 'note-1',
    title: 'Cold Email Deliverability SOP (16 Outbound Mailboxes)',
    category: 'Deliverability',
    content: `1. Daily Sending Cap: Maximum 35-40 outbound emails per day per individual mailbox (including follow-ups).
2. Spacing: Automated dispatcher must enforce 45 to 90-second random delays between outgoing messages.
3. DNS Records: Verify SPF, DKIM, DMARC, and Custom Tracking Domain are valid before launching any new campaign.
4. Warmup: Any replacement or newly registered Google Workspace account must undergo minimum 14-day automated warmup before bulk dispatch.`,
    is_pinned: true,
    color: '#00C2FF',
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'note-2',
    title: 'WhatsApp Follow-Up Cadence & Message Guidelines',
    category: 'Outreach SOP',
    content: `• WA1 Sent: Triggered within 30-60 minutes after a lead replies positively or asks for course syllabus. Send friendly introduction with contact card.
• WA2 Follow Up Sent: Sent 24-36 hours later if no calendar invite was confirmed. Offer 2 exact time slots (e.g. "Tomorrow at 2 PM or 4 PM?").
• WA3 Follow Up Sent: Final WhatsApp touch 48 hours later. Include a direct PDF or meeting link.
• Always keep messages under 4 sentences; avoid links in WA1 to prevent spam flags.`,
    is_pinned: true,
    color: '#00E5A0',
    created_at: '2026-09-02T10:00:00Z'
  },
  {
    id: 'note-3',
    title: 'Cumulative Pipeline Counting Rules & Milestone Integrity',
    category: 'Operations',
    content: `CRITICAL RULE:
1. Meeting Count = NO can NEVER be marked pending.
2. Cumulative progression: A meeting marked as Done retains its Scheduled status.
3. Count YES represents qualified completed meetings that count toward monthly client quotas.
4. DNC contacts must never be added to mail merge queues.`,
    is_pinned: false,
    color: '#F97316',
    created_at: '2026-09-03T11:00:00Z'
  }
];

export const INITIAL_TODO_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Verify SPF / DKIM alignment on all 16 mailboxes',
    description: 'Ensure Training Express, John Academy, and One Education sender domains pass DMARC.',
    category: 'Deliverability',
    priority: 'High',
    is_completed: false,
    due_date: '2026-09-10',
    assigned_to: 'Ruhit',
    created_at: '2026-09-05T09:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Write A/B testing subject lines for Care Home Campaign',
    description: 'Create 2 distinct subject lines for Email 2 and Email 3 in Collab JA sequence.',
    category: 'Outreach',
    priority: 'High',
    is_completed: true,
    due_date: '2026-09-06',
    assigned_to: 'Farzan Hussain',
    created_at: '2026-09-04T10:00:00Z',
    completed_at: '2026-09-06T15:00:00Z'
  },
  {
    id: 'task-3',
    title: 'Review weekly Meeting Count YES tally for Skill Up',
    description: 'Confirm all logged YES meetings have matching Google Meet recordings or notes.',
    category: 'Account Setup',
    priority: 'Medium',
    is_completed: false,
    due_date: '2026-09-08',
    assigned_to: 'Kamran Hussain',
    created_at: '2026-09-06T11:00:00Z'
  },
  {
    id: 'task-4',
    title: 'Clean bounced emails from Enterprise August list',
    description: 'Filter leads with deliverability errors and mark them DNC or review alternative emails.',
    category: 'Lead Gen',
    priority: 'Low',
    is_completed: false,
    due_date: '2026-09-12',
    assigned_to: 'Nayeemur',
    created_at: '2026-09-06T12:00:00Z'
  }
];

// ==============================================================================
// LEAD COLLECTION / COMMAND CENTER INITIAL SEED DATA
// ==============================================================================

export const INITIAL_COLLECTION_KEYWORD_SETS: CollectionKeywordSet[] = [
  {
    id: 'ks-care-1',
    name: 'Care Services',
    description: 'Homecare, domiciliary care, and elderly assistance providers',
    status: 'active',
    created_by: 'usr-ruhit-owner',
    created_by_name: 'Ruhit (Owner)',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'ks-train-2',
    name: 'Training',
    description: 'Corporate workforce training and professional development providers',
    status: 'active',
    created_by: 'usr-ruhit-owner',
    created_by_name: 'Ruhit (Owner)',
    created_at: '2026-09-02T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
  },
];

export const INITIAL_COLLECTION_KEYWORDS: CollectionKeyword[] = [
  // Care Services Keywords
  { id: 'kw-1', keyword_set_id: 'ks-care-1', keyword: 'homecare agency', created_at: '2026-09-01T00:00:00Z' },
  { id: 'kw-2', keyword_set_id: 'ks-care-1', keyword: 'domiciliary care agency', created_at: '2026-09-01T00:00:00Z' },
  { id: 'kw-3', keyword_set_id: 'ks-care-1', keyword: 'home care services', created_at: '2026-09-01T00:00:00Z' },
  { id: 'kw-4', keyword_set_id: 'ks-care-1', keyword: 'live-in care agency', created_at: '2026-09-01T00:00:00Z' },
  { id: 'kw-5', keyword_set_id: 'ks-care-1', keyword: 'care at home provider', created_at: '2026-09-01T00:00:00Z' },
  { id: 'kw-6', keyword_set_id: 'ks-care-1', keyword: 'elderly care agency', created_at: '2026-09-01T00:00:00Z' },

  // Training Keywords
  { id: 'kw-7', keyword_set_id: 'ks-train-2', keyword: 'training provider', created_at: '2026-09-02T00:00:00Z' },
  { id: 'kw-8', keyword_set_id: 'ks-train-2', keyword: 'corporate training', created_at: '2026-09-02T00:00:00Z' },
  { id: 'kw-9', keyword_set_id: 'ks-train-2', keyword: 'leadership training', created_at: '2026-09-02T00:00:00Z' },
  { id: 'kw-10', keyword_set_id: 'ks-train-2', keyword: 'professional training', created_at: '2026-09-02T00:00:00Z' },
];

const IRELAND_CITIES = [
  'Longford',
  'Dungarvan',
  'Nenagh',
  'Trim',
  'New Ross',
  'Kilkenny',
  'Athlone',
  'Mullingar',
  'Enniscorthy',
  'Gorey',
  'Shannon',
  'Portlaoise',
  'Ballina',
  'Sligo',
  'Westport',
  'Letterkenny',
  'Killarney',
  'Tullamore',
  'Navan',
  'Carlow',
  'Castlebar',
  'Tralee',
  'Wexford',
  'Clonmel',
  'Drogheda',
  'Dundalk',
  'Bray',
  'Swords',
  'Cobh',
  'Mallow',
];

const ENGLAND_CITIES = [
  'Manchester',
  'Birmingham',
  'Leeds',
  'Sheffield',
  'Bristol',
  'Newcastle',
  'Nottingham',
  'Liverpool',
  'Southampton',
  'Leicester',
  'Coventry',
  'Bradford',
  'Stoke-on-Trent',
  'Wolverhampton',
  'Plymouth',
  'Derby',
  'Reading',
  'Norwich',
  'Exeter',
  'Gloucester',
];

const WALES_CITIES = [
  'Cardiff',
  'Swansea',
  'Newport',
  'Wrexham',
  'Barry',
  'Neath',
  'Cwmbran',
  'Llanelli',
  'Bridgend',
  'Port Talbot',
];

export const INITIAL_COLLECTION_LOCATIONS: CollectionLocation[] = [
  ...IRELAND_CITIES.map((city, idx) => ({
    id: `loc-ie-${idx + 1}`,
    city,
    country: 'Ireland',
    normalized_name: `${city.toLowerCase()}, ireland`,
    status: 'available' as const,
    created_at: '2026-09-01T00:00:00Z',
  })),
  ...ENGLAND_CITIES.map((city, idx) => ({
    id: `loc-eng-${idx + 1}`,
    city,
    country: 'England',
    normalized_name: `${city.toLowerCase()}, england`,
    status: 'available' as const,
    created_at: '2026-09-01T00:00:00Z',
  })),
  ...WALES_CITIES.map((city, idx) => ({
    id: `loc-wal-${idx + 1}`,
    city,
    country: 'Wales',
    normalized_name: `${city.toLowerCase()}, wales`,
    status: 'available' as const,
    created_at: '2026-09-01T00:00:00Z',
  })),
];

export const INITIAL_COLLECTION_BATCHES: CollectionBatch[] = [];

