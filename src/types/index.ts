export type UserRole = 'admin' | 'manager' | 'team_member';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_color?: string;
  created_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Account {
  id: string;
  account_name: string;
  email_account: string;
  sender_name: string;
  brand_id?: string;
  brand_name?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Campaign {
  id: string;
  name: string;
  brand_id?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Archived';
  notes?: string;
  created_at?: string;
}

export type Priority = 'Low' | 'Medium' | 'High' | 'DNC';
export type MeetingCountType = 'YES' | 'NO' | null;

export type WhatsAppFollowUpStage = 'WA1 Sent' | 'WA2 Follow Up Sent' | 'WA3 Follow Up Sent' | null;
export type InterestedEmailFollowUpStage = 'FW1 Sent' | 'FW2 Sent' | 'FW3 Sent' | null;

export interface LeadList {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  whatsapp_number?: string;
  alternative_phone?: string;
  list_ids?: string[];
  country?: string;
  city?: string;
  notes?: string;
  source?: string;
  priority: Priority;
  
  campaign_id?: string;
  campaign_name?: string;
  email_1?: string;
  email_2?: string;
  email_3?: string;
  email_1_date?: string | null;
  email_2_date?: string | null;
  email_3_date?: string | null;
  whatsapp_followup_stage?: WhatsAppFollowUpStage;
  interested_email_followup_stage?: InterestedEmailFollowUpStage;
  brand_id?: string;
  brand_name?: string;
  account_id?: string;
  account_name?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;

  // Cumulative lifecycle milestones
  is_interested: boolean;
  interested_at?: string | null;

  is_meeting_scheduled: boolean;
  meeting_scheduled_at?: string | null;

  is_meeting_done: boolean;
  meeting_done_at?: string | null;

  meeting_count_type: MeetingCountType;
  meeting_count_at?: string | null;

  is_pending: boolean;
  pending_at?: string | null;
  pending_completed_at?: string | null;

  // Scheduled Meeting info
  meeting_date?: string | null;
  meeting_time?: string | null;
  meeting_timezone?: string;
  meeting_type?: string;
  meeting_link?: string;

  // Follow-up
  last_contact_date?: string | null;
  next_follow_up_date?: string | null;
  tags?: string[];

  // Mail merge info
  mail_merge_prepared?: boolean;
  last_mail_merge_date?: string | null;

  created_at: string;
  updated_at: string;
}

export type ActivityType =
  | 'Interested'
  | 'WhatsApp Sent'
  | 'Call Done'
  | 'Meeting Scheduled'
  | 'Meeting Rescheduled'
  | 'Meeting Done'
  | 'Meeting Missed'
  | 'Meeting Count YES'
  | 'Meeting Count NO'
  | 'Pending YES'
  | 'Pending Completed'
  | 'Follow-up Scheduled'
  | 'Note Added'
  | 'Mail Merge Prepared'
  | 'Lead Created'
  | 'Lead Updated';

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  description?: string;
  metadata?: Record<string, any>;
  user_id?: string;
  user_name?: string;
  created_at: string;
}

export type MeetingStatus = 'scheduled' | 'missed' | 'done' | 'rescheduled' | 'cancelled';
export type MeetingOutcome = 'meeting_count_yes' | 'meeting_count_no' | 'pending' | 'rescheduled' | 'no_show' | null;

export interface Meeting {
  id: string;
  lead_id: string;
  lead_name?: string;
  lead_company?: string;
  lead_email?: string;
  lead_whatsapp?: string;
  campaign_name?: string;
  brand_name?: string;
  account_name?: string;
  scheduled_at: string; // ISO string
  duration_minutes: number;
  status: MeetingStatus;
  outcome?: MeetingOutcome;
  meeting_link?: string;
  location?: string;
  meeting_type?: string;
  notes?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  lead_id: string;
  user_id?: string;
  user_name?: string;
  content: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  lead_id: string;
  lead_name?: string;
  lead_company?: string;
  reminder_type: string;
  reminder_date: string; // YYYY-MM-DD
  reminder_time: string; // HH:mm
  note?: string;
  user_id?: string;
  is_completed: boolean;
  completed_at?: string | null;
  snoozed_until?: string | null;
  created_at: string;
}

export interface MailMergeBatch {
  id: string;
  batch_number: string;
  campaign_id?: string;
  campaign_name?: string;
  brand_id?: string;
  brand_name?: string;
  account_id?: string;
  account_name?: string;
  sender_name?: string;
  lead_count: number;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  leads?: Lead[];
}

export interface InAppNotification {
  id: string;
  user_id?: string;
  lead_id?: string;
  title: string;
  message: string;
  type: 'meeting_upcoming' | 'meeting_missed' | 'follow_up_due' | 'reminder' | 'system';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  lead_id?: string;
  lead_name?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface MetricsSummary {
  totalInterested: number;
  totalMeetingScheduled: number;
  totalMeetingDone: number;
  totalMeetingCount: number;
  meetingCountYes: number;
  meetingCountNo: number;
  pendingYes: number;
  whatsappSent: number;
  callsDone: number;
  missedMeetings: number;
}

export interface TeamReportRow {
  userId: string;
  name: string;
  interested: number;
  meetingScheduled: number;
  meetingDone: number;
  meetingCount: number; // Only YES counts
  meetingCountYes: number;
  meetingCountNo: number;
  pending: number;
  whatsapp: number;
  calls: number;
}

export interface DayReportRow {
  date: string; // YYYY-MM-DD or MM/DD/YY
  meetingScheduled: number;
  meetingDone: number;
  meetingCount: number;
  pendingYes: number;
  whatsapp: number;
  calls: number;
}
