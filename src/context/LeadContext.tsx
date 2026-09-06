import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Lead,
  LeadList,
  Meeting,
  LeadActivity,
  Reminder,
  InAppNotification,
  Brand,
  Account,
  Campaign,
  MailMergeBatch,
  AuditLog,
  Priority,
  MeetingCountType,
  EmailCopy,
  ImportantNote,
  TaskItem,
} from '../types';
import {
  INITIAL_LEADS,
  INITIAL_LISTS,
  INITIAL_MEETINGS,
  INITIAL_ACTIVITIES,
  INITIAL_REMINDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BRANDS,
  INITIAL_ACCOUNTS,
  INITIAL_CAMPAIGNS,
  INITIAL_BATCHES,
  INITIAL_EMAIL_COPIES,
  INITIAL_IMPORTANT_NOTES,
  INITIAL_TODO_TASKS,
} from '../lib/mockData';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';
import { showDesktopNotification } from '../lib/notifications';
import { useAuth } from './AuthContext';

export interface LeadContextType {
  leads: Lead[];
  meetings: Meeting[];
  activities: LeadActivity[];
  reminders: Reminder[];
  notifications: InAppNotification[];
  brands: Brand[];
  accounts: Account[];
  campaigns: Campaign[];
  batches: MailMergeBatch[];
  auditLogs: AuditLog[];
  cloudStatus: 'connected' | 'demo' | 'error' | 'syncing';
  lastSyncTime: Date | null;
  errorMessage: string | null;

  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>, reason?: string) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  bulkImportLeads: (newLeads: Partial<Lead>[]) => Promise<{ imported: number; duplicates: number }>;

  markInterested: (leadId: string, note?: string) => Promise<void>;
  scheduleMeeting: (leadId: string, data: {
    scheduled_at: string;
    meeting_date: string;
    meeting_time: string;
    duration_minutes?: number;
    meeting_link?: string;
    meeting_type?: string;
    notes?: string;
  }) => Promise<void>;
  markMeetingDone: (leadId: string, outcome?: 'YES' | 'NO' | null, note?: string) => Promise<void>;
  setMeetingCount: (leadId: string, type: 'YES' | 'NO', note?: string) => Promise<void>;
  togglePending: (leadId: string, isPending: boolean, note?: string) => Promise<void>;

  recordWhatsAppSent: (leadId: string, note?: string) => Promise<void>;
  recordCallDone: (leadId: string, note?: string) => Promise<void>;
  addNote: (leadId: string, content: string) => Promise<void>;

  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => Promise<void>;
  rescheduleMeeting: (meetingId: string, newScheduledAt: string, reason?: string) => Promise<void>;

  addReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  completeReminder: (reminderId: string) => Promise<void>;
  snoozeReminder: (reminderId: string, days: number) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;

  createMailMergeBatch: (params: {
    campaignId?: string;
    brandId?: string;
    accountId?: string;
    senderName?: string;
    leadIds: string[];
  }) => Promise<MailMergeBatch>;

  lists: LeadList[];
  addList: (name: string, description?: string, color?: string) => Promise<LeadList>;
  deleteList: (id: string) => Promise<void>;
  updateList: (id: string, updates: Partial<LeadList>) => Promise<void>;
  addLeadsToList: (listId: string, leadIds: string[]) => Promise<void>;
  removeLeadsFromList: (listId: string, leadIds: string[]) => Promise<void>;

  bulkUpdateLeads: (ids: string[], updates: Partial<Lead>, reason?: string) => Promise<void>;
  bulkDeleteLeads: (ids: string[]) => Promise<void>;

  addAccount: (account: Omit<Account, 'id' | 'created_at'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addBrand: (brand: Omit<Brand, 'id' | 'created_at'>) => Promise<void>;
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'created_at'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  emailCopies: EmailCopy[];
  addEmailCopy: (copy: Omit<EmailCopy, 'id' | 'created_at' | 'updated_at'>) => Promise<EmailCopy>;
  updateEmailCopy: (id: string, updates: Partial<EmailCopy>) => Promise<void>;
  deleteEmailCopy: (id: string) => Promise<void>;

  importantNotes: ImportantNote[];
  addImportantNote: (note: Omit<ImportantNote, 'id' | 'created_at' | 'updated_at'>) => Promise<ImportantNote>;
  updateImportantNote: (id: string, updates: Partial<ImportantNote>) => Promise<void>;
  deleteImportantNote: (id: string) => Promise<void>;

  todoTasks: TaskItem[];
  addTodoTask: (task: Omit<TaskItem, 'id' | 'created_at'>) => Promise<TaskItem>;
  toggleTodoTask: (id: string) => Promise<void>;
  updateTodoTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTodoTask: (id: string) => Promise<void>;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshDataFromCloud: () => Promise<void>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('ruhit_local_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('ruhit_local_meetings');
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  const [activities, setActivities] = useState<LeadActivity[]>(() => {
    const saved = localStorage.getItem('ruhit_local_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('ruhit_local_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('ruhit_local_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('ruhit_local_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ruhit_local_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('ruhit_local_campaigns');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [batches, setBatches] = useState<MailMergeBatch[]>(() => {
    const saved = localStorage.getItem('ruhit_local_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [lists, setLists] = useState<LeadList[]>(() => {
    const saved = localStorage.getItem('ruhit_local_lead_lists');
    return saved ? JSON.parse(saved) : INITIAL_LISTS;
  });

  const [emailCopies, setEmailCopies] = useState<EmailCopy[]>(() => {
    const saved = localStorage.getItem('ruhit_local_email_copies');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_COPIES;
  });

  const [importantNotes, setImportantNotes] = useState<ImportantNote[]>(() => {
    const saved = localStorage.getItem('ruhit_local_important_notes');
    return saved ? JSON.parse(saved) : INITIAL_IMPORTANT_NOTES;
  });

  const [todoTasks, setTodoTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('ruhit_local_todo_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TODO_TASKS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'demo' | 'error' | 'syncing'>('demo');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('ruhit_local_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('ruhit_local_meetings', JSON.stringify(meetings)); }, [meetings]);
  useEffect(() => { localStorage.setItem('ruhit_local_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('ruhit_local_reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('ruhit_local_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('ruhit_local_brands', JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem('ruhit_local_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('ruhit_local_campaigns', JSON.stringify(campaigns)); }, [campaigns]);
  useEffect(() => { localStorage.setItem('ruhit_local_batches', JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem('ruhit_local_lead_lists', JSON.stringify(lists)); }, [lists]);
  useEffect(() => { localStorage.setItem('ruhit_local_email_copies', JSON.stringify(emailCopies)); }, [emailCopies]);
  useEffect(() => { localStorage.setItem('ruhit_local_important_notes', JSON.stringify(importantNotes)); }, [importantNotes]);
  useEffect(() => { localStorage.setItem('ruhit_local_todo_tasks', JSON.stringify(todoTasks)); }, [todoTasks]);

  const refreshDataFromCloud = useCallback(async () => {
    const supabase = getSupabase();
    const config = getSupabaseConfig();
    if (!config.isConfigured || !supabase) {
      setCloudStatus('demo');
      return;
    }
    setCloudStatus('syncing');
    try {
      const { data: cLeads, error: lErr } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (lErr) throw lErr;
      if (cLeads && cLeads.length > 0) setLeads(cLeads);

      const { data: cMtgs } = await supabase.from('meetings').select('*').order('scheduled_at', { ascending: true });
      if (cMtgs) setMeetings(cMtgs);

      const { data: cActs } = await supabase.from('lead_activities').select('*').order('created_at', { ascending: false });
      if (cActs) setActivities(cActs);

      const { data: cAccs } = await supabase.from('accounts').select('*');
      if (cAccs && cAccs.length > 0) setAccounts(cAccs);

      const { data: cBrands } = await supabase.from('brands').select('*');
      if (cBrands && cBrands.length > 0) setBrands(cBrands);

      const { data: cCmps } = await supabase.from('campaigns').select('*');
      if (cCmps && cCmps.length > 0) setCampaigns(cCmps);

      const { data: cReminders } = await supabase.from('reminders').select('*');
      if (cReminders) setReminders(cReminders);

      const { data: cBatches } = await supabase.from('mail_merge_batches').select('*');
      if (cBatches) setBatches(cBatches);

      setCloudStatus('connected');
      setLastSyncTime(new Date());
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      setCloudStatus('error');
      setErrorMessage(err.message || 'Failed to sync with Supabase cloud.');
    }
  }, []);

  useEffect(() => {
    refreshDataFromCloud();
    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase
        .channel('lead-portal-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => refreshDataFromCloud())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => refreshDataFromCloud())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [refreshDataFromCloud]);

  const recordActivityInternal = async (
    leadId: string,
    type: LeadActivity['activity_type'],
    description?: string,
    metadata?: Record<string, any>
  ) => {
    const newAct: LeadActivity = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      lead_id: leadId,
      activity_type: type,
      description,
      metadata,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('lead_activities').insert([
        { lead_id: leadId, activity_type: type, description, metadata: metadata || {}, user_id: currentUser.id },
      ]);
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> => {
    const newLead: Lead = {
      ...leadData,
      id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    await recordActivityInternal(newLead.id, 'Lead Created', 'Added lead: ' + newLead.first_name + ' ' + newLead.last_name + ' (' + newLead.company_name + ')');
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('leads').insert([newLead]);
      } catch (err) {
        console.error('Supabase lead insert error:', err);
      }
    }
    return newLead;
  };

  const updateLead = async (id: string, updates: Partial<Lead>, reason?: string): Promise<void> => {
    const currentLead = leads.find((l) => l.id === id);
    const updatedLead = { ...currentLead, ...updates, updated_at: new Date().toISOString() } as Lead;
    setLeads((prev) => prev.map((l) => (l.id === id ? updatedLead : l)));
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('leads').update(updates).eq('id', id);
    }
  };

  const deleteLead = async (id: string): Promise<void> => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setMeetings((prev) => prev.filter((m) => m.lead_id !== id));
    setActivities((prev) => prev.filter((a) => a.lead_id !== id));
    setReminders((prev) => prev.filter((r) => r.lead_id !== id));
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('leads').delete().eq('id', id);
    }
  };

  const bulkUpdateLeads = async (ids: string[], updates: Partial<Lead>, reason?: string): Promise<void> => {
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) => (idSet.has(l.id) ? ({ ...l, ...updates, updated_at: now } as Lead) : l))
    );
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('leads').update(updates).in('id', ids);
      } catch (err) {
        console.error('Supabase bulk lead update error:', err);
      }
    }
  };

  const bulkDeleteLeads = async (ids: string[]): Promise<void> => {
    const idSet = new Set(ids);
    setLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
    setMeetings((prev) => prev.filter((m) => !idSet.has(m.lead_id)));
    setActivities((prev) => prev.filter((a) => !idSet.has(a.lead_id)));
    setReminders((prev) => prev.filter((r) => !idSet.has(r.lead_id)));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('leads').delete().in('id', ids);
      } catch (err) {
        console.error('Supabase bulk lead delete error:', err);
      }
    }
  };

  const bulkImportLeads = async (newLeads: Partial<Lead>[]): Promise<{ imported: number; duplicates: number }> => {
    const existingEmails = new Set(leads.map((l) => l.email.toLowerCase().trim()));
    let imported = 0;
    let duplicates = 0;
    const leadsToInsert: Lead[] = [];

    for (const item of newLeads) {
      if (!item.email) continue;
      const cleanEmail = item.email.toLowerCase().trim();
      if (existingEmails.has(cleanEmail)) {
        duplicates++;
        continue;
      }
      existingEmails.add(cleanEmail);
      const l: Lead = {
        id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        email: cleanEmail,
        first_name: item.first_name || '',
        last_name: item.last_name || '',
        company_name: item.company_name || '',
        whatsapp_number: item.whatsapp_number || '',
        alternative_phone: item.alternative_phone || '',
        list_ids: item.list_ids || [],
        country: item.country || '',
        city: item.city || '',
        priority: item.priority || 'Medium',
        campaign_id: item.campaign_id,
        campaign_name: item.campaign_name,
        brand_id: item.brand_id,
        brand_name: item.brand_name,
        account_id: item.account_id,
        account_name: item.account_name,
        assigned_user_id: item.assigned_user_id || currentUser.id,
        assigned_user_name: item.assigned_user_name || currentUser.full_name,
        email_1: item.email_1,
        email_2: item.email_2,
        email_3: item.email_3,
        email_1_date: item.email_1_date || null,
        email_2_date: item.email_2_date || null,
        email_3_date: item.email_3_date || null,
        whatsapp_followup_stage: item.whatsapp_followup_stage || null,
        interested_email_followup_stage: item.interested_email_followup_stage || null,
        meeting_date: item.meeting_date || null,
        meeting_time: item.meeting_time || null,
        is_interested: item.is_interested ?? false,
        interested_at: item.interested_at || (item.is_interested ? item.created_at || new Date().toISOString() : null),
        is_meeting_scheduled: item.is_meeting_scheduled ?? false,
        meeting_scheduled_at: item.meeting_scheduled_at || (item.is_meeting_scheduled ? item.created_at || new Date().toISOString() : null),
        is_meeting_done: item.is_meeting_done ?? false,
        meeting_done_at: item.meeting_done_at || (item.is_meeting_done ? item.created_at || new Date().toISOString() : null),
        meeting_count_type: item.meeting_count_type ?? null,
        meeting_count_at: item.meeting_count_at || (item.meeting_count_type ? item.created_at || new Date().toISOString() : null),
        is_pending: item.is_pending ?? false,
        pending_at: item.pending_at || null,
        source: item.source || 'Bulk Import',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || item.created_at || new Date().toISOString(),
      };
      leadsToInsert.push(l);
      imported++;
    }

    if (leadsToInsert.length > 0) {
      setLeads((prev) => [...leadsToInsert, ...prev]);
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('leads').insert(leadsToInsert);
      }
    }
    return { imported, duplicates };
  };

  const markInterested = async (leadId: string, note?: string): Promise<void> => {
    const now = new Date().toISOString();
    await updateLead(leadId, { is_interested: true, interested_at: now }, 'Marked Interested');
    await recordActivityInternal(leadId, 'Interested', note || 'Lead expressed interest');
  };

  const scheduleMeeting = async (
    leadId: string,
    data: {
      scheduled_at: string;
      meeting_date: string;
      meeting_time: string;
      duration_minutes?: number;
      meeting_link?: string;
      meeting_type?: string;
      notes?: string;
    }
  ): Promise<void> => {
    const now = new Date().toISOString();
    const lead = leads.find((l) => l.id === leadId);

    await updateLead(leadId, {
      is_meeting_scheduled: true,
      meeting_scheduled_at: now,
      meeting_date: data.meeting_date,
      meeting_time: data.meeting_time,
      meeting_link: data.meeting_link,
      meeting_type: data.meeting_type || 'Google Meet',
    }, 'Scheduled Meeting');

    const newMeeting: Meeting = {
      id: 'mtg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      lead_id: leadId,
      lead_name: (lead?.first_name || lead?.last_name ? (lead?.first_name || '') + ' ' + (lead?.last_name || '') : lead?.company_name) || 'Prospect',
      lead_company: lead?.company_name,
      lead_email: lead?.email,
      lead_whatsapp: lead?.whatsapp_number,
      campaign_name: lead?.campaign_name,
      brand_name: lead?.brand_name,
      account_name: lead?.account_name,
      scheduled_at: data.scheduled_at,
      duration_minutes: data.duration_minutes || 30,
      status: 'scheduled',
      meeting_link: data.meeting_link,
      meeting_type: data.meeting_type || 'Google Meet',
      notes: data.notes,
      assigned_user_id: lead?.assigned_user_id || currentUser.id,
      assigned_user_name: lead?.assigned_user_name || currentUser.full_name,
      created_at: now,
      updated_at: now,
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('meetings').insert([newMeeting]);
    }

    await recordActivityInternal(
      leadId,
      'Meeting Scheduled',
      'Meeting scheduled for ' + data.meeting_date + ' at ' + data.meeting_time + ' (' + (data.meeting_type || 'Google Meet') + ')'
    );
  };

  const markMeetingDone = async (leadId: string, outcome?: 'YES' | 'NO' | null, note?: string): Promise<void> => {
    const now = new Date().toISOString();
    const updates: Partial<Lead> = {
      is_meeting_done: true,
      meeting_done_at: now,
    };
    if (outcome) {
      updates.meeting_count_type = outcome;
      updates.meeting_count_at = now;
    }
    await updateLead(leadId, updates, 'Meeting Done (Outcome: ' + (outcome || 'Pending Count') + ')');

    setMeetings((prev) =>
      prev.map((m) =>
        m.lead_id === leadId
          ? {
              ...m,
              status: 'done' as const,
              outcome: outcome === 'YES' ? 'meeting_count_yes' : outcome === 'NO' ? 'meeting_count_no' : 'pending',
              notes: note ? (m.notes ? m.notes + '\n' + note : note) : m.notes,
              updated_at: now,
            }
          : m
      )
    );

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('meetings').update({
        status: 'done',
        outcome: outcome === 'YES' ? 'meeting_count_yes' : outcome === 'NO' ? 'meeting_count_no' : 'pending',
        updated_at: now,
      }).eq('lead_id', leadId);
    }

    await recordActivityInternal(leadId, 'Meeting Done', note || 'Meeting completed successfully');
    if (outcome === 'YES') {
      await recordActivityInternal(leadId, 'Meeting Count YES', 'Meeting qualified and counted toward target');
    } else if (outcome === 'NO') {
      await recordActivityInternal(leadId, 'Meeting Count NO', 'Meeting completed; not counted toward target');
    }
  };

  const setMeetingCount = async (leadId: string, type: 'YES' | 'NO', note?: string): Promise<void> => {
    const now = new Date().toISOString();
    const lead = leads.find((l) => l.id === leadId);

    const updates: Partial<Lead> = {
      is_meeting_done: true,
      meeting_done_at: lead?.meeting_done_at || now,
      meeting_count_type: type,
      meeting_count_at: now,
    };
    // Rule: Count NO is NEVER pending
    if (type === 'NO') {
      updates.is_pending = false;
      updates.pending_at = null;
    }

    await updateLead(leadId, updates, 'Meeting Count set to ' + type);

    setMeetings((prev) =>
      prev.map((m) =>
        m.lead_id === leadId
          ? {
              ...m,
              status: 'done' as const,
              outcome: type === 'YES' ? 'meeting_count_yes' : 'meeting_count_no',
              updated_at: now,
            }
          : m
      )
    );

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('meetings').update({
        status: 'done',
        outcome: type === 'YES' ? 'meeting_count_yes' : 'meeting_count_no',
        updated_at: now,
      }).eq('lead_id', leadId);
    }

    if (type === 'YES') {
      await recordActivityInternal(leadId, 'Meeting Count YES', note || 'Qualified meeting confirmed for target');
    } else {
      await recordActivityInternal(leadId, 'Meeting Count NO', note || 'Meeting completed; not counted toward target');
    }
  };

  const togglePending = async (leadId: string, isPending: boolean, note?: string): Promise<void> => {
    const lead = leads.find((l) => l.id === leadId);
    // Rule: Count NO leads can NEVER be pending
    if (isPending && lead?.meeting_count_type === 'NO') {
      return;
    }

    const now = new Date().toISOString();
    const updates: Partial<Lead> = {
      is_pending: isPending,
      pending_at: isPending ? now : null,
      pending_completed_at: isPending ? null : now,
    };

    await updateLead(leadId, updates, isPending ? 'Marked Pending YES' : 'Pending Completed');

    if (isPending) {
      await recordActivityInternal(leadId, 'Pending YES', note || 'Follow-up pending state active');
    } else {
      await recordActivityInternal(leadId, 'Pending Completed', note || 'Pending action completed');
    }
  };

  const recordWhatsAppSent = async (leadId: string, note?: string): Promise<void> => {
    const now = new Date().toISOString();
    await updateLead(leadId, { last_contact_date: now }, 'WhatsApp message sent');
    await recordActivityInternal(leadId, 'WhatsApp Sent', note || 'Outreach sent via WhatsApp');
  };

  const recordCallDone = async (leadId: string, note?: string): Promise<void> => {
    const now = new Date().toISOString();
    await updateLead(leadId, { last_contact_date: now }, 'Phone call completed');
    await recordActivityInternal(leadId, 'Call Done', note || 'Phone conversation completed');
  };

  const addNote = async (leadId: string, content: string): Promise<void> => {
    const lead = leads.find((l) => l.id === leadId);
    const updatedNotes = lead?.notes ? lead.notes + '\n[' + new Date().toLocaleDateString() + ']: ' + content : content;
    await updateLead(leadId, { notes: updatedNotes });
    await recordActivityInternal(leadId, 'Note Added', content);
  };

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>): Promise<void> => {
    setMeetings((prev) => prev.map((m) => (m.id === meetingId ? { ...m, ...updates, updated_at: new Date().toISOString() } : m)));
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('meetings').update(updates).eq('id', meetingId);
    }
  };

  const rescheduleMeeting = async (meetingId: string, newScheduledAt: string, reason?: string): Promise<void> => {
    const oldMeeting = meetings.find((m) => m.id === meetingId);
    if (!oldMeeting) return;

    await updateMeeting(meetingId, {
      status: 'rescheduled',
      notes: ((oldMeeting.notes || '') + '\nRescheduled: ' + (reason || 'Prospect requested')).trim(),
    });

    const newMeeting: Meeting = {
      ...oldMeeting,
      id: 'mtg-' + Date.now(),
      scheduled_at: newScheduledAt,
      status: 'scheduled',
      outcome: undefined,
      notes: reason ? 'Rescheduled: ' + reason : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('meetings').insert([newMeeting]);
    }

    await recordActivityInternal(
      oldMeeting.lead_id,
      'Meeting Rescheduled',
      'Meeting rescheduled to ' + new Date(newScheduledAt).toLocaleString() + ' (' + (reason || 'Rescheduled') + ')'
    );
  };

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'created_at'>): Promise<void> => {
    const newRem: Reminder = {
      ...reminderData,
      id: 'rem-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('reminders').insert([newRem]);
    }
    await recordActivityInternal(
      reminderData.lead_id,
      'Follow-up Scheduled',
      'Reminder for ' + reminderData.reminder_date + ' at ' + reminderData.reminder_time + ': ' + (reminderData.note || '')
    );
  };

  const completeReminder = async (reminderId: string): Promise<void> => {
    const now = new Date().toISOString();
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, is_completed: true, completed_at: now } : r))
    );
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('reminders').update({ is_completed: true, completed_at: now }).eq('id', reminderId);
    }
  };

  const snoozeReminder = async (reminderId: string, days: number): Promise<void> => {
    const snoozedDate = new Date();
    snoozedDate.setDate(snoozedDate.getDate() + days);
    const dateStr = snoozedDate.toISOString().split('T')[0];
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, reminder_date: dateStr, snoozed_until: snoozedDate.toISOString() } : r))
    );
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('reminders').update({ reminder_date: dateStr, snoozed_until: snoozedDate.toISOString() }).eq('id', reminderId);
    }
  };

  const deleteReminder = async (reminderId: string): Promise<void> => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('reminders').delete().eq('id', reminderId);
    }
  };

  const createMailMergeBatch = async (params: {
    campaignId?: string;
    brandId?: string;
    accountId?: string;
    senderName?: string;
    leadIds: string[];
  }): Promise<MailMergeBatch> => {
    const now = new Date().toISOString();
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    const brand = brands.find((b) => b.id === params.brandId);
    const account = accounts.find((a) => a.id === params.accountId);

    const batchCount = batches.length + 1;
    const batchNumber = 'ROS-MM-' + String(batchCount).padStart(3, '0');

    const newBatch: MailMergeBatch = {
      id: 'batch-' + Date.now(),
      batch_number: batchNumber,
      campaign_id: params.campaignId,
      campaign_name: campaign?.name,
      brand_id: params.brandId,
      brand_name: brand?.name,
      account_id: params.accountId,
      account_name: account?.account_name,
      sender_name: params.senderName || account?.sender_name || currentUser.full_name,
      lead_count: params.leadIds.length,
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      created_at: now,
    };

    setBatches((prev) => [newBatch, ...prev]);

    const selectedSet = new Set(params.leadIds);
    setLeads((prev) =>
      prev.map((l) =>
        selectedSet.has(l.id)
          ? { ...l, mail_merge_prepared: true, last_mail_merge_date: now, updated_at: now }
          : l
      )
    );

    for (const id of params.leadIds) {
      await recordActivityInternal(id, 'Mail Merge Prepared', 'Included in Mail Merge Batch ' + batchNumber);
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('mail_merge_batches').insert([newBatch]);
      const linkRows = params.leadIds.map((leadId) => ({ batch_id: newBatch.id, lead_id: leadId }));
      await supabase.from('mail_merge_batch_leads').insert(linkRows);
    }

    return newBatch;
  };

  const addAccount = async (accData: Omit<Account, 'id' | 'created_at'>): Promise<void> => {
    const newAcc: Account = { ...accData, id: 'acc-' + Date.now(), created_at: new Date().toISOString() };
    setAccounts((prev) => [...prev, newAcc]);
    const supabase = getSupabase();
    if (supabase) await supabase.from('accounts').insert([newAcc]);
  };

  const updateAccount = async (id: string, updates: Partial<Account>): Promise<void> => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    const supabase = getSupabase();
    if (supabase) await supabase.from('accounts').update(updates).eq('id', id);
  };

  const addBrand = async (brandData: Omit<Brand, 'id' | 'created_at'>): Promise<void> => {
    const newBrand: Brand = { ...brandData, id: 'br-' + Date.now(), created_at: new Date().toISOString() };
    setBrands((prev) => [...prev, newBrand]);
    const supabase = getSupabase();
    if (supabase) await supabase.from('brands').insert([newBrand]);
  };

  const updateBrand = async (id: string, updates: Partial<Brand>): Promise<void> => {
    setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    const supabase = getSupabase();
    if (supabase) await supabase.from('brands').update(updates).eq('id', id);
  };

  const addCampaign = async (campaignData: Omit<Campaign, 'id' | 'created_at'>): Promise<void> => {
    const newCmp: Campaign = { ...campaignData, id: 'cmp-' + Date.now(), created_at: new Date().toISOString() };
    setCampaigns((prev) => [...prev, newCmp]);
    const supabase = getSupabase();
    if (supabase) await supabase.from('campaigns').insert([newCmp]);
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>): Promise<void> => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const supabase = getSupabase();
    if (supabase) await supabase.from('campaigns').update(updates).eq('id', id);
  };

  const deleteAccount = async (id: string): Promise<void> => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('accounts').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete account error:', err);
      }
    }
  };

  const deleteBrand = async (id: string): Promise<void> => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('brands').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete brand error:', err);
      }
    }
  };

  const deleteCampaign = async (id: string): Promise<void> => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('campaigns').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete campaign error:', err);
      }
    }
  };

  const addList = async (name: string, description?: string, color?: string): Promise<LeadList> => {
    const newList: LeadList = {
      id: 'list-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      description: description?.trim(),
      color: color || '#00C2FF',
      created_at: new Date().toISOString(),
    };
    setLists((prev) => [...prev, newList]);
    return newList;
  };

  const deleteList = async (id: string): Promise<void> => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setLeads((prev) =>
      prev.map((l) => ({
        ...l,
        list_ids: l.list_ids ? l.list_ids.filter((lid) => lid !== id) : [],
      }))
    );
  };

  const updateList = async (id: string, updates: Partial<LeadList>): Promise<void> => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const addLeadsToList = async (listId: string, leadIds: string[]): Promise<void> => {
    const idSet = new Set(leadIds);
    setLeads((prev) =>
      prev.map((l) => {
        if (!idSet.has(l.id)) return l;
        const currentLists = l.list_ids || [];
        if (currentLists.includes(listId)) return l;
        return { ...l, list_ids: [...currentLists, listId] };
      })
    );
  };

  const removeLeadsFromList = async (listId: string, leadIds: string[]): Promise<void> => {
    const idSet = new Set(leadIds);
    setLeads((prev) =>
      prev.map((l) => {
        if (!idSet.has(l.id)) return l;
        return {
          ...l,
          list_ids: (l.list_ids || []).filter((lid) => lid !== listId),
        };
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const addEmailCopy = async (copyData: Omit<EmailCopy, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCopy> => {
    const newCopy: EmailCopy = {
      ...copyData,
      id: 'copy-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEmailCopies((prev) => [newCopy, ...prev]);
    return newCopy;
  };

  const updateEmailCopy = async (id: string, updates: Partial<EmailCopy>): Promise<void> => {
    setEmailCopies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
  };

  const deleteEmailCopy = async (id: string): Promise<void> => {
    setEmailCopies((prev) => prev.filter((c) => c.id !== id));
  };

  const addImportantNote = async (noteData: Omit<ImportantNote, 'id' | 'created_at' | 'updated_at'>): Promise<ImportantNote> => {
    const newNote: ImportantNote = {
      ...noteData,
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setImportantNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const updateImportantNote = async (id: string, updates: Partial<ImportantNote>): Promise<void> => {
    setImportantNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
    );
  };

  const deleteImportantNote = async (id: string): Promise<void> => {
    setImportantNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const addTodoTask = async (taskData: Omit<TaskItem, 'id' | 'created_at'>): Promise<TaskItem> => {
    const newTask: TaskItem = {
      ...taskData,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };
    setTodoTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const toggleTodoTask = async (id: string): Promise<void> => {
    setTodoTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isComp = !t.is_completed;
          return {
            ...t,
            is_completed: isComp,
            completed_at: isComp ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const updateTodoTask = async (id: string, updates: Partial<TaskItem>): Promise<void> => {
    setTodoTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTodoTask = async (id: string): Promise<void> => {
    setTodoTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <LeadContext.Provider
      value={{
        leads,
        meetings,
        activities,
        reminders,
        notifications,
        brands,
        accounts,
        campaigns,
        batches,
        auditLogs,
        cloudStatus,
        lastSyncTime,
        errorMessage,

        lists,
        addList,
        deleteList,
        updateList,
        addLeadsToList,
        removeLeadsFromList,

        addLead,
        updateLead,
        deleteLead,
        bulkUpdateLeads,
        bulkDeleteLeads,
        bulkImportLeads,

        markInterested,
        scheduleMeeting,
        markMeetingDone,
        setMeetingCount,
        togglePending,

        recordWhatsAppSent,
        recordCallDone,
        addNote,

        updateMeeting,
        rescheduleMeeting,

        addReminder,
        completeReminder,
        snoozeReminder,
        deleteReminder,

        createMailMergeBatch,

        addAccount,
        updateAccount,
        deleteAccount,
        addBrand,
        updateBrand,
        deleteBrand,
        addCampaign,
        updateCampaign,
        deleteCampaign,

        emailCopies,
        addEmailCopy,
        updateEmailCopy,
        deleteEmailCopy,

        importantNotes,
        addImportantNote,
        updateImportantNote,
        deleteImportantNote,

        todoTasks,
        addTodoTask,
        toggleTodoTask,
        updateTodoTask,
        deleteTodoTask,

        markNotificationRead,
        markAllNotificationsRead,
        refreshDataFromCloud,
      }}
    >
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = (): LeadContextType => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
