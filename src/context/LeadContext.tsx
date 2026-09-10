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
  CollectionKeywordSet,
  CollectionKeyword,
  CollectionLocation,
  CollectionBatch,
  CollectionBatchLocation,
  CollectionBatchStatus,
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
  INITIAL_COLLECTION_KEYWORD_SETS,
  INITIAL_COLLECTION_KEYWORDS,
  INITIAL_COLLECTION_LOCATIONS,
  INITIAL_COLLECTION_BATCHES,
} from '../lib/mockData';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';
import { showDesktopNotification } from '../lib/notifications';
import { useAuth } from './AuthContext';
import { saveCollection, loadCollection, clearAllStores, STORES } from '../lib/indexedDb';

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

  // Lead List Collection / Command Center
  keywordSets: CollectionKeywordSet[];
  keywords: CollectionKeyword[];
  locations: CollectionLocation[];
  collectionBatches: CollectionBatch[];
  batchLocations: CollectionBatchLocation[];
  addKeywordSet: (name: string, description?: string, initialKeywords?: string[]) => Promise<CollectionKeywordSet>;
  updateKeywordSet: (id: string, updates: Partial<CollectionKeywordSet>) => Promise<void>;
  deleteKeywordSet: (id: string) => Promise<{ success: boolean; message?: string }>;
  addKeywordsToSet: (setId: string, rawKeywords: string[]) => Promise<{ addedCount: number; duplicatesCount: number }>;
  deleteKeyword: (id: string) => Promise<void>;
  bulkImportLocations: (rawList: string[], defaultCountry?: string) => Promise<{ importedCount: number; duplicatesCount: number }>;
  addSingleLocation: (data: { city: string; region?: string; country: string }) => Promise<CollectionLocation>;
  updateLocation: (id: string, updates: Partial<CollectionLocation>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  getNextAvailableLocations: (country: string, keywordSetId?: string, count?: number) => CollectionLocation[];
  checkLocationOverlap: (locationIds: string[]) => { overlapping: CollectionLocation[]; activeBatch?: CollectionBatch };
  createCollectionBatch: (params: { name?: string; keywordSetId: string; country: string; locationIds: string[]; notes?: string; bypassOverlap?: boolean }) => Promise<{ success: boolean; batch?: CollectionBatch; error?: string }>;
  startCollectionBatch: (batchId: string) => Promise<void>;
  completeCollectionBatch: (batchId: string, leadsCollected: number, notes?: string, isPartial?: boolean, completedLocationIds?: string[]) => Promise<void>;
  cancelCollectionBatch: (batchId: string, reason?: string) => Promise<void>;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshDataFromCloud: () => Promise<void>;
  clearAllDemoData: () => Promise<void>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || 'usr-ruhit-owner';
  const currentUserName = currentUser?.full_name || 'Ruhit (Owner)';

  const isDbInit = typeof window !== 'undefined' && localStorage.getItem('ruhit_db_initialized') === 'true';

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('ruhit_local_leads');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_LEADS;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('ruhit_local_meetings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_MEETINGS;
  });

  const [activities, setActivities] = useState<LeadActivity[]>(() => {
    const saved = localStorage.getItem('ruhit_local_activities');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_ACTIVITIES;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('ruhit_local_reminders');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_REMINDERS;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('ruhit_local_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_NOTIFICATIONS;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('ruhit_local_brands');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_BRANDS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ruhit_local_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_ACCOUNTS;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('ruhit_local_campaigns');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_CAMPAIGNS;
  });

  const [batches, setBatches] = useState<MailMergeBatch[]>(() => {
    const saved = localStorage.getItem('ruhit_local_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_BATCHES;
  });

  const [lists, setLists] = useState<LeadList[]>(() => {
    const saved = localStorage.getItem('ruhit_local_lead_lists');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_LISTS;
  });

  const [emailCopies, setEmailCopies] = useState<EmailCopy[]>(() => {
    const saved = localStorage.getItem('ruhit_local_email_copies');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_EMAIL_COPIES;
  });

  const [importantNotes, setImportantNotes] = useState<ImportantNote[]>(() => {
    const saved = localStorage.getItem('ruhit_local_important_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_IMPORTANT_NOTES;
  });

  const [todoTasks, setTodoTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('ruhit_local_todo_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_TODO_TASKS;
  });

  // Lead Collection State Hooks
  const [keywordSets, setKeywordSets] = useState<CollectionKeywordSet[]>(() => {
    const saved = localStorage.getItem('ruhit_local_keyword_sets');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_COLLECTION_KEYWORD_SETS;
  });

  const [keywords, setKeywords] = useState<CollectionKeyword[]>(() => {
    const saved = localStorage.getItem('ruhit_local_keywords');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_COLLECTION_KEYWORDS;
  });

  const [locations, setLocations] = useState<CollectionLocation[]>(() => {
    const saved = localStorage.getItem('ruhit_local_locations');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_COLLECTION_LOCATIONS;
  });

  const [collectionBatches, setCollectionBatches] = useState<CollectionBatch[]>(() => {
    const saved = localStorage.getItem('ruhit_local_collection_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return isDbInit ? [] : INITIAL_COLLECTION_BATCHES;
  });

  const [batchLocations, setBatchLocations] = useState<CollectionBatchLocation[]>(() => {
    const saved = localStorage.getItem('ruhit_local_batch_locations');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'demo' | 'error' | 'syncing'>('demo');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Synchronize collections with IndexedDB and localStorage (only after hydration completes)
  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.LEADS, leads);
    try {
      localStorage.setItem('ruhit_local_leads', JSON.stringify(leads));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [leads, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.MEETINGS, meetings);
    try {
      localStorage.setItem('ruhit_local_meetings', JSON.stringify(meetings));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [meetings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.ACTIVITIES, activities);
    try {
      localStorage.setItem('ruhit_local_activities', JSON.stringify(activities));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [activities, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.REMINDERS, reminders);
    try {
      localStorage.setItem('ruhit_local_reminders', JSON.stringify(reminders));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [reminders, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.NOTIFICATIONS, notifications);
    try {
      localStorage.setItem('ruhit_local_notifications', JSON.stringify(notifications));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [notifications, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.BRANDS, brands);
    try {
      localStorage.setItem('ruhit_local_brands', JSON.stringify(brands));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [brands, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.ACCOUNTS, accounts);
    try {
      localStorage.setItem('ruhit_local_accounts', JSON.stringify(accounts));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [accounts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.CAMPAIGNS, campaigns);
    try {
      localStorage.setItem('ruhit_local_campaigns', JSON.stringify(campaigns));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [campaigns, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.LISTS, lists);
    try {
      localStorage.setItem('ruhit_local_lead_lists', JSON.stringify(lists));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [lists, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.EMAIL_COPIES, emailCopies);
    try {
      localStorage.setItem('ruhit_local_email_copies', JSON.stringify(emailCopies));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [emailCopies, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.NOTES, importantNotes);
    try {
      localStorage.setItem('ruhit_local_important_notes', JSON.stringify(importantNotes));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [importantNotes, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.TASKS, todoTasks);
    try {
      localStorage.setItem('ruhit_local_todo_tasks', JSON.stringify(todoTasks));
    } catch {}
    localStorage.setItem('ruhit_db_initialized', 'true');
  }, [todoTasks, isHydrated]);

  // Lead Collection Persistence Effects
  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.COLLECTION_KEYWORD_SETS, keywordSets);
    try {
      localStorage.setItem('ruhit_local_keyword_sets', JSON.stringify(keywordSets));
    } catch {}
  }, [keywordSets, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.COLLECTION_KEYWORDS, keywords);
    try {
      localStorage.setItem('ruhit_local_keywords', JSON.stringify(keywords));
    } catch {}
  }, [keywords, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.COLLECTION_LOCATIONS, locations);
    try {
      localStorage.setItem('ruhit_local_locations', JSON.stringify(locations));
    } catch {}
  }, [locations, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.COLLECTION_BATCHES, collectionBatches);
    try {
      localStorage.setItem('ruhit_local_collection_batches', JSON.stringify(collectionBatches));
    } catch {}
  }, [collectionBatches, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveCollection(STORES.COLLECTION_BATCH_LOCATIONS, batchLocations);
    try {
      localStorage.setItem('ruhit_local_batch_locations', JSON.stringify(batchLocations));
    } catch {}
  }, [batchLocations, isHydrated]);

  // Hydrate from IndexedDB on startup
  useEffect(() => {
    const hydrateLocalCache = async () => {
      try {
        const isInit = localStorage.getItem('ruhit_db_initialized') === 'true';

        const cachedLeads = await loadCollection<Lead>(STORES.LEADS);
        const cachedMtgs = await loadCollection<Meeting>(STORES.MEETINGS);
        const cachedActs = await loadCollection<LeadActivity>(STORES.ACTIVITIES);
        const cachedReminders = await loadCollection<Reminder>(STORES.REMINDERS);
        const cachedNotifs = await loadCollection<InAppNotification>(STORES.NOTIFICATIONS);
        const cachedBrands = await loadCollection<Brand>(STORES.BRANDS);
        const cachedAccounts = await loadCollection<Account>(STORES.ACCOUNTS);
        const cachedCampaigns = await loadCollection<Campaign>(STORES.CAMPAIGNS);
        const cachedLists = await loadCollection<LeadList>(STORES.LISTS);
        const cachedCopies = await loadCollection<EmailCopy>(STORES.EMAIL_COPIES);
        const cachedNotes = await loadCollection<ImportantNote>(STORES.NOTES);
        const cachedTasks = await loadCollection<TaskItem>(STORES.TASKS);
        const cachedSets = await loadCollection<CollectionKeywordSet>(STORES.COLLECTION_KEYWORD_SETS);
        const cachedKeywords = await loadCollection<CollectionKeyword>(STORES.COLLECTION_KEYWORDS);
        const cachedLocs = await loadCollection<CollectionLocation>(STORES.COLLECTION_LOCATIONS);
        const cachedBatches = await loadCollection<CollectionBatch>(STORES.COLLECTION_BATCHES);
        const cachedBatchLocs = await loadCollection<CollectionBatchLocation>(STORES.COLLECTION_BATCH_LOCATIONS);

        if (isInit) {
          // If already initialized by user, respect cached data completely (even empty array [] if deleted!)
          if (cachedLeads !== undefined) setLeads(cachedLeads);
          if (cachedMtgs !== undefined) setMeetings(cachedMtgs);
          if (cachedActs !== undefined) setActivities(cachedActs);
          if (cachedReminders !== undefined) setReminders(cachedReminders);
          if (cachedNotifs !== undefined) setNotifications(cachedNotifs);
          if (cachedBrands !== undefined) setBrands(cachedBrands);
          if (cachedAccounts !== undefined) setAccounts(cachedAccounts);
          if (cachedCampaigns !== undefined) setCampaigns(cachedCampaigns);
          if (cachedLists !== undefined) setLists(cachedLists);
          if (cachedCopies !== undefined) setEmailCopies(cachedCopies);
          if (cachedNotes !== undefined) setImportantNotes(cachedNotes);
          if (cachedTasks !== undefined) setTodoTasks(cachedTasks);
          if (cachedSets !== undefined && cachedSets.length > 0) setKeywordSets(cachedSets);
          if (cachedKeywords !== undefined && cachedKeywords.length > 0) setKeywords(cachedKeywords);
          if (cachedLocs !== undefined && cachedLocs.length > 0) setLocations(cachedLocs);
          if (cachedBatches !== undefined && cachedBatches.length > 0) setCollectionBatches(cachedBatches);
          if (cachedBatchLocs !== undefined) setBatchLocations(cachedBatchLocs);
        } else {
          // First time system setup: seed defaults if empty, then mark initialized
          if (cachedLeads && cachedLeads.length > 0) setLeads(cachedLeads);
          if (cachedMtgs && cachedMtgs.length > 0) setMeetings(cachedMtgs);
          if (cachedBrands && cachedBrands.length > 0) setBrands(cachedBrands);
          if (cachedAccounts && cachedAccounts.length > 0) setAccounts(cachedAccounts);
          if (cachedCampaigns && cachedCampaigns.length > 0) setCampaigns(cachedCampaigns);
          if (cachedLists && cachedLists.length > 0) setLists(cachedLists);
          if (cachedCopies && cachedCopies.length > 0) setEmailCopies(cachedCopies);
          if (cachedNotes && cachedNotes.length > 0) setImportantNotes(cachedNotes);
          if (cachedTasks && cachedTasks.length > 0) setTodoTasks(cachedTasks);
          if (cachedSets && cachedSets.length > 0) setKeywordSets(cachedSets);
          if (cachedKeywords && cachedKeywords.length > 0) setKeywords(cachedKeywords);
          if (cachedLocs && cachedLocs.length > 0) setLocations(cachedLocs);
          if (cachedBatches && cachedBatches.length > 0) setCollectionBatches(cachedBatches);

          localStorage.setItem('ruhit_db_initialized', 'true');
        }
      } catch (err) {
        console.warn('IndexedDB hydration notice:', err);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrateLocalCache();
  }, []);

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

      // Fetch Collection Command Center data
      const { data: cSets } = await supabase.from('collection_keyword_sets').select('*');
      if (cSets && cSets.length > 0) setKeywordSets(cSets);

      const { data: cKws } = await supabase.from('collection_keywords').select('*');
      if (cKws && cKws.length > 0) setKeywords(cKws);

      const { data: cLocs } = await supabase.from('collection_locations').select('*');
      if (cLocs && cLocs.length > 0) setLocations(cLocs);

      const { data: cColBatches } = await supabase.from('collection_batches').select('*').order('created_at', { ascending: false });
      if (cColBatches) setCollectionBatches(cColBatches);

      const { data: cBatchLocs } = await supabase.from('collection_batch_locations').select('*');
      if (cBatchLocs) setBatchLocations(cBatchLocs);

      setCloudStatus('connected');
      setLastSyncTime(new Date());
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      setCloudStatus('error');
      setErrorMessage(err.message || 'Failed to sync with Supabase cloud.');
    }
  }, []);

  // Auto-sync engine: runs automatically every 15 seconds to sync data with cloud
  useEffect(() => {
    refreshDataFromCloud();

    const intervalTimer = setInterval(() => {
      refreshDataFromCloud();
    }, 15000); // 15s background auto-sync

    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase
        .channel('lead-portal-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => refreshDataFromCloud())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => refreshDataFromCloud())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_batches' }, () => refreshDataFromCloud())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_locations' }, () => refreshDataFromCloud())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_keyword_sets' }, () => refreshDataFromCloud())
        .subscribe();
      return () => {
        clearInterval(intervalTimer);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(intervalTimer);
  }, [refreshDataFromCloud]);

  // Realtime Desktop & In-App Notification Engine: alerts when To-Do tasks or lead follow-ups reach their scheduled date and time
  useEffect(() => {
    const checkScheduledAlerts = () => {
      const now = new Date();
      const nowMs = now.getTime();

      // Track alerted IDs in session to prevent repeat alerts
      const sessionKey = 'ruhit_alerted_tasks_reminders';
      let alertedIds = new Set<string>();
      try {
        const cached = sessionStorage.getItem(sessionKey);
        if (cached) alertedIds = new Set(JSON.parse(cached));
      } catch {}

      let hasNewAlerts = false;

      // 1. Check Operations To-Do Tasks
      todoTasks.forEach((task) => {
        if (task.is_completed || task.alerted || alertedIds.has(task.id)) return;
        if (!task.due_date) return;

        const timeStr = task.due_time || '09:00';
        const taskDateTime = new Date(`${task.due_date}T${timeStr}:00`);
        if (isNaN(taskDateTime.getTime())) return;

        const diffMs = nowMs - taskDateTime.getTime();
        // Fire if due time has arrived (within a 3-hour window)
        if (diffMs >= 0 && diffMs <= 3 * 60 * 60 * 1000) {
          showDesktopNotification(`Task Due: ${task.title}`, {
            body: `Priority: ${task.priority} (${task.category})\nScheduled for ${task.due_date} at ${timeStr}.`,
            tag: `task-${task.id}`,
            requireInteraction: true,
          });

          // Also insert into in-app notifications
          const newNotif: InAppNotification = {
            id: 'notif-task-' + task.id + '-' + Date.now(),
            title: `To-Do Task Due: ${task.title}`,
            message: `Priority: ${task.priority} (${task.category}) scheduled for ${task.due_date} at ${timeStr}.`,
            type: 'reminder',
            is_read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications((prev) => [newNotif, ...prev]);

          alertedIds.add(task.id);
          hasNewAlerts = true;

          setTodoTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, alerted: true } : t))
          );
        }
      });

      // 2. Check Lead Follow-up Reminders
      reminders.forEach((rem) => {
        if (rem.is_completed || alertedIds.has(rem.id)) return;
        if (!rem.reminder_date || !rem.reminder_time) return;

        const remDateTime = new Date(`${rem.reminder_date}T${rem.reminder_time}:00`);
        if (isNaN(remDateTime.getTime())) return;

        const diffMs = nowMs - remDateTime.getTime();
        // Fire if reminder time has arrived (within a 3-hour window)
        if (diffMs >= 0 && diffMs <= 3 * 60 * 60 * 1000) {
          const leadName = rem.lead_name || rem.lead_company || 'Prospect';
          showDesktopNotification(`Follow-Up Due: ${leadName}`, {
            body: `${rem.reminder_type}: ${rem.note || 'Follow-up is due now.'}\nTime: ${rem.reminder_date} at ${rem.reminder_time}`,
            tag: `rem-${rem.id}`,
            requireInteraction: true,
          });

          const newNotif: InAppNotification = {
            id: 'notif-rem-' + rem.id + '-' + Date.now(),
            lead_id: rem.lead_id,
            title: `Follow-Up Due: ${leadName}`,
            message: `${rem.reminder_type} scheduled for ${rem.reminder_date} at ${rem.reminder_time}. ${rem.note || ''}`,
            type: 'follow_up_due',
            is_read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications((prev) => [newNotif, ...prev]);

          alertedIds.add(rem.id);
          hasNewAlerts = true;
        }
      });

      if (hasNewAlerts) {
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(Array.from(alertedIds)));
        } catch {}
      }
    };

    checkScheduledAlerts();
    const alertInterval = setInterval(checkScheduledAlerts, 10000); // Check every 10s
    return () => clearInterval(alertInterval);
  }, [todoTasks, reminders]);

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
      user_id: currentUserId,
      user_name: currentUserName,
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('lead_activities').insert([
        { lead_id: leadId, activity_type: type, description, metadata: metadata || {}, user_id: currentUserId },
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
        assigned_user_id: item.assigned_user_id || currentUserId,
        assigned_user_name: item.assigned_user_name || currentUserName,
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
      assigned_user_id: lead?.assigned_user_id || currentUserId,
      assigned_user_name: lead?.assigned_user_name || currentUserName,
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
      sender_name: params.senderName || account?.sender_name || currentUserName,
      lead_count: params.leadIds.length,
      created_by: currentUserId,
      created_by_name: currentUserName,
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

  // ==============================================================================
  // LEAD LIST COLLECTION / COMMAND CENTER METHODS
  // ==============================================================================

  const addKeywordSet = async (
    name: string,
    description?: string,
    initialKeywords: string[] = []
  ): Promise<CollectionKeywordSet> => {
    const setId = 'ks-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const now = new Date().toISOString();
    const newSet: CollectionKeywordSet = {
      id: setId,
      name: name.trim(),
      description: description?.trim(),
      status: 'active',
      created_by: currentUserId,
      created_by_name: currentUserName,
      created_at: now,
      updated_at: now,
    };

    const newKws: CollectionKeyword[] = initialKeywords
      .map((k) => k.trim())
      .filter(Boolean)
      .map((keyword, idx) => ({
        id: `kw-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        keyword_set_id: setId,
        keyword,
        created_at: now,
      }));

    setKeywordSets((prev) => [newSet, ...prev]);
    if (newKws.length > 0) {
      setKeywords((prev) => [...prev, ...newKws]);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_keyword_sets').insert([newSet]);
        if (newKws.length > 0) {
          await supabase.from('collection_keywords').insert(newKws);
        }
      } catch (err) {
        console.warn('Supabase addKeywordSet notice:', err);
      }
    }

    return newSet;
  };

  const updateKeywordSet = async (id: string, updates: Partial<CollectionKeywordSet>): Promise<void> => {
    const now = new Date().toISOString();
    setKeywordSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updated_at: now } : s))
    );
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_keyword_sets').update({ ...updates, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateKeywordSet notice:', err);
      }
    }
  };

  const deleteKeywordSet = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const hasBatches = collectionBatches.some((b) => b.keyword_set_id === id);
    if (hasBatches) {
      await updateKeywordSet(id, { status: 'archived' });
      return {
        success: true,
        message: 'Keyword set has historical collection batches. It has been archived to protect batch history.',
      };
    }

    setKeywordSets((prev) => prev.filter((s) => s.id !== id));
    setKeywords((prev) => prev.filter((k) => k.keyword_set_id !== id));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_keyword_sets').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteKeywordSet notice:', err);
      }
    }
    return { success: true };
  };

  const addKeywordsToSet = async (
    setId: string,
    rawKeywords: string[]
  ): Promise<{ addedCount: number; duplicatesCount: number }> => {
    const existingKws = new Set(
      keywords
        .filter((k) => k.keyword_set_id === setId)
        .map((k) => k.keyword.toLowerCase().trim())
    );

    let addedCount = 0;
    let duplicatesCount = 0;
    const toInsert: CollectionKeyword[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rawKeywords.length; i++) {
      const clean = rawKeywords[i].trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (existingKws.has(lower)) {
        duplicatesCount++;
      } else {
        existingKws.add(lower);
        toInsert.push({
          id: `kw-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          keyword_set_id: setId,
          keyword: clean,
          created_at: now,
        });
        addedCount++;
      }
    }

    if (toInsert.length > 0) {
      setKeywords((prev) => [...prev, ...toInsert]);
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('collection_keywords').insert(toInsert);
        } catch (err) {
          console.warn('Supabase addKeywordsToSet notice:', err);
        }
      }
    }

    return { addedCount, duplicatesCount };
  };

  const deleteKeyword = async (id: string): Promise<void> => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_keywords').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteKeyword notice:', err);
      }
    }
  };

  const bulkImportLocations = async (
    rawList: string[],
    defaultCountry: string = 'Ireland'
  ): Promise<{ importedCount: number; duplicatesCount: number }> => {
    const existingNorm = new Set(locations.map((l) => l.normalized_name.toLowerCase().trim()));
    let importedCount = 0;
    let duplicatesCount = 0;
    const toInsert: CollectionLocation[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rawList.length; i++) {
      const line = rawList[i].trim();
      if (!line) continue;

      let city = line;
      let country = defaultCountry.trim();
      let region = '';

      if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length === 2) {
          city = parts[0];
          country = parts[1];
        } else if (parts.length >= 3) {
          city = parts[0];
          region = parts[1];
          country = parts[2];
        }
      }

      const normalized = `${city.toLowerCase()}, ${country.toLowerCase()}`;
      if (existingNorm.has(normalized)) {
        duplicatesCount++;
      } else {
        existingNorm.add(normalized);
        toInsert.push({
          id: `loc-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          city,
          region: region || undefined,
          country,
          normalized_name: normalized,
          status: 'available',
          created_at: now,
        });
        importedCount++;
      }
    }

    if (toInsert.length > 0) {
      setLocations((prev) => [...prev, ...toInsert]);
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('collection_locations').insert(toInsert);
        } catch (err) {
          console.warn('Supabase bulkImportLocations notice:', err);
        }
      }
    }

    return { importedCount, duplicatesCount };
  };

  const addSingleLocation = async (data: {
    city: string;
    region?: string;
    country: string;
  }): Promise<CollectionLocation> => {
    const city = data.city.trim();
    const country = data.country.trim();
    const region = data.region?.trim();
    const normalized = `${city.toLowerCase()}, ${country.toLowerCase()}`;
    const newLoc: CollectionLocation = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      city,
      region: region || undefined,
      country,
      normalized_name: normalized,
      status: 'available',
      created_at: new Date().toISOString(),
    };

    setLocations((prev) => [...prev, newLoc]);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_locations').insert([newLoc]);
      } catch (err) {
        console.warn('Supabase addSingleLocation notice:', err);
      }
    }
    return newLoc;
  };

  const updateLocation = async (id: string, updates: Partial<CollectionLocation>): Promise<void> => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_locations').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateLocation notice:', err);
      }
    }
  };

  const deleteLocation = async (id: string): Promise<void> => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_locations').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteLocation notice:', err);
      }
    }
  };

  const getNextAvailableLocations = (
    country: string,
    keywordSetId?: string,
    count: number = 20
  ): CollectionLocation[] => {
    const targetCountry = country.trim().toLowerCase();

    // 1. Gather location IDs in any currently ACTIVE batch (ready or in_progress)
    const activeLocationIds = new Set<string>();
    collectionBatches.forEach((b) => {
      if (b.status === 'ready' || b.status === 'in_progress') {
        b.locations?.forEach((bl) => activeLocationIds.add(bl.location_id));
      }
    });

    // 2. If keywordSetId specified, gather location IDs in COMPLETED batches for THIS specific keyword set
    const completedForSetIds = new Set<string>();
    if (keywordSetId) {
      collectionBatches.forEach((b) => {
        if (b.status === 'completed' && b.keyword_set_id === keywordSetId) {
          b.locations?.forEach((bl) => {
            if (bl.status === 'completed' || bl.status === 'pending') {
              completedForSetIds.add(bl.location_id);
            }
          });
        }
      });
    }

    // 3. Filter candidates
    return locations
      .filter((loc) => {
        if (loc.country.trim().toLowerCase() !== targetCountry) return false;
        if (loc.status === 'claimed' || loc.status === 'in_progress') return false;
        if (activeLocationIds.has(loc.id)) return false;
        if (completedForSetIds.has(loc.id)) return false;
        return true;
      })
      .slice(0, count);
  };

  const checkLocationOverlap = (
    locationIds: string[]
  ): { overlapping: CollectionLocation[]; activeBatch?: CollectionBatch } => {
    const locSet = new Set(locationIds);
    let activeBatch: CollectionBatch | undefined;

    const activeBatchMap = new Map<string, CollectionBatch>();
    collectionBatches.forEach((b) => {
      if (b.status === 'ready' || b.status === 'in_progress') {
        b.locations?.forEach((bl) => {
          activeBatchMap.set(bl.location_id, b);
        });
      }
    });

    const overlapping: CollectionLocation[] = [];
    locations.forEach((loc) => {
      if (locSet.has(loc.id)) {
        if (activeBatchMap.has(loc.id)) {
          overlapping.push(loc);
          if (!activeBatch) activeBatch = activeBatchMap.get(loc.id);
        } else if (loc.status === 'claimed' || loc.status === 'in_progress') {
          overlapping.push(loc);
        }
      }
    });

    return { overlapping, activeBatch };
  };

  const createCollectionBatch = async (params: {
    name?: string;
    keywordSetId: string;
    country: string;
    locationIds: string[];
    notes?: string;
    bypassOverlap?: boolean;
  }): Promise<{ success: boolean; batch?: CollectionBatch; error?: string }> => {
    const { keywordSetId, country, locationIds, notes, bypassOverlap } = params;

    if (!locationIds || locationIds.length === 0) {
      return { success: false, error: 'Please select at least one location for this collection batch.' };
    }

    // Check overlap
    if (!bypassOverlap) {
      const { overlapping, activeBatch } = checkLocationOverlap(locationIds);
      if (overlapping.length > 0) {
        return {
          success: false,
          error: `${overlapping.length} location(s) are already claimed in active ${activeBatch?.batch_number || 'batch'}. Please choose available locations or request Admin override.`,
        };
      }
    }

    const kwSet = keywordSets.find((s) => s.id === keywordSetId);
    const setKeywords = keywords.filter((k) => k.keyword_set_id === keywordSetId).map((k) => k.keyword);
    const kwCount = setKeywords.length || 1;
    const locCount = locationIds.length;
    const combCount = kwCount * locCount;

    const batchId = 'batch-col-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const batchNumber = `BATCH-${1000 + collectionBatches.length + 1}`;
    const setName = kwSet?.name || 'Custom Keyword Set';
    const batchName = params.name?.trim() || `${setName} — ${country} — ${locCount} Locations`;

    const selectedLocs = locations.filter((l) => locationIds.includes(l.id));

    const batchLocationsToCreate: CollectionBatchLocation[] = selectedLocs.map((loc) => ({
      id: `cbl-${Date.now()}-${loc.id}`,
      batch_id: batchId,
      location_id: loc.id,
      city: loc.city,
      country: loc.country,
      status: 'pending',
    }));

    const now = new Date().toISOString();
    const newBatch: CollectionBatch = {
      id: batchId,
      batch_number: batchNumber,
      batch_name: batchName,
      keyword_set_id: keywordSetId,
      keyword_set_name: setName,
      country,
      status: 'ready',
      keyword_count: kwCount,
      location_count: locCount,
      combination_count: combCount,
      leads_collected: 0,
      notes: notes?.trim() || '',
      created_by: currentUserId,
      created_by_name: currentUserName,
      keywords: setKeywords,
      locations: batchLocationsToCreate,
      created_at: now,
      updated_at: now,
    };

    // Mark selected locations as 'claimed'
    setLocations((prev) =>
      prev.map((l) => (locationIds.includes(l.id) ? { ...l, status: 'claimed' } : l))
    );

    setCollectionBatches((prev) => [newBatch, ...prev]);
    setBatchLocations((prev) => [...prev, ...batchLocationsToCreate]);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('collection_batches').insert([
          {
            id: newBatch.id,
            batch_number: newBatch.batch_number,
            batch_name: newBatch.batch_name,
            keyword_set_id: newBatch.keyword_set_id,
            keyword_set_name: newBatch.keyword_set_name,
            country: newBatch.country,
            status: newBatch.status,
            keyword_count: newBatch.keyword_count,
            location_count: newBatch.location_count,
            combination_count: newBatch.combination_count,
            leads_collected: newBatch.leads_collected,
            notes: newBatch.notes,
            created_by: newBatch.created_by,
            created_by_name: newBatch.created_by_name,
            created_at: newBatch.created_at,
            updated_at: newBatch.updated_at,
          },
        ]);

        await supabase.from('collection_batch_locations').insert(batchLocationsToCreate);
        await supabase.from('collection_locations').update({ status: 'claimed' }).in('id', locationIds);
      } catch (err) {
        console.warn('Supabase createCollectionBatch notice:', err);
      }
    }

    return { success: true, batch: newBatch };
  };

  const startCollectionBatch = async (batchId: string): Promise<void> => {
    const target = collectionBatches.find((b) => b.id === batchId);
    if (!target) return;

    const now = new Date().toISOString();
    const locIds = target.locations?.map((l) => l.location_id) || [];

    setCollectionBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: 'in_progress',
              started_at: now,
              started_by: currentUserId,
              started_by_name: currentUserName,
              updated_at: now,
            }
          : b
      )
    );

    setLocations((prev) =>
      prev.map((l) => (locIds.includes(l.id) ? { ...l, status: 'in_progress' } : l))
    );

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('collection_batches')
          .update({
            status: 'in_progress',
            started_at: now,
            started_by: currentUserId,
            started_by_name: currentUserName,
            updated_at: now,
          })
          .eq('id', batchId);

        if (locIds.length > 0) {
          await supabase.from('collection_locations').update({ status: 'in_progress' }).in('id', locIds);
        }
      } catch (err) {
        console.warn('Supabase startCollectionBatch notice:', err);
      }
    }
  };

  const completeCollectionBatch = async (
    batchId: string,
    leadsCollected: number,
    notes?: string,
    isPartial: boolean = false,
    completedLocationIds?: string[]
  ): Promise<void> => {
    const target = collectionBatches.find((b) => b.id === batchId);
    if (!target) return;

    const now = new Date().toISOString();
    const finalStatus: CollectionBatchStatus = isPartial ? 'partial' : 'completed';

    const allLocIds = target.locations?.map((l) => l.location_id) || [];
    const completedSet = completedLocationIds
      ? new Set(completedLocationIds)
      : new Set(allLocIds);

    // Update batch
    setCollectionBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: finalStatus,
              leads_collected: leadsCollected,
              notes: notes !== undefined ? notes : b.notes,
              completed_at: now,
              completed_by: currentUserId,
              completed_by_name: currentUserName,
              updated_at: now,
            }
          : b
      )
    );

    // Update locations
    setLocations((prev) =>
      prev.map((l) => {
        if (!allLocIds.includes(l.id)) return l;
        const isDone = completedSet.has(l.id);
        return {
          ...l,
          status: isDone ? 'completed' : 'available',
          last_used_date: isDone ? now : l.last_used_date,
          last_used_batch_id: isDone ? batchId : l.last_used_batch_id,
          last_used_keyword_set_id: isDone ? target.keyword_set_id : l.last_used_keyword_set_id,
          last_used_by_name: isDone ? currentUserName : l.last_used_by_name,
        };
      })
    );

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('collection_batches')
          .update({
            status: finalStatus,
            leads_collected: leadsCollected,
            notes: notes !== undefined ? notes : target.notes,
            completed_at: now,
            completed_by: currentUserId,
            completed_by_name: currentUserName,
            updated_at: now,
          })
          .eq('id', batchId);

        // Update completed locations
        const doneList = Array.from(completedSet);
        if (doneList.length > 0) {
          await supabase
            .from('collection_locations')
            .update({
              status: 'completed',
              last_used_date: now,
              last_used_batch_id: batchId,
              last_used_keyword_set_id: target.keyword_set_id,
              last_used_by_name: currentUserName,
            })
            .in('id', doneList);
        }

        // Release skipped locations back to available
        const skippedList = allLocIds.filter((id) => !completedSet.has(id));
        if (skippedList.length > 0) {
          await supabase
            .from('collection_locations')
            .update({ status: 'available' })
            .in('id', skippedList);
        }
      } catch (err) {
        console.warn('Supabase completeCollectionBatch notice:', err);
      }
    }
  };

  const cancelCollectionBatch = async (batchId: string, reason?: string): Promise<void> => {
    const target = collectionBatches.find((b) => b.id === batchId);
    if (!target) return;

    const now = new Date().toISOString();
    const locIds = target.locations?.map((l) => l.location_id) || [];

    setCollectionBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: 'cancelled',
              notes: reason ? `${b.notes || ''} [Cancelled: ${reason}]`.trim() : b.notes,
              updated_at: now,
            }
          : b
      )
    );

    // Release claimed locations back to 'available'
    setLocations((prev) =>
      prev.map((l) => (locIds.includes(l.id) ? { ...l, status: 'available' } : l))
    );

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('collection_batches')
          .update({
            status: 'cancelled',
            updated_at: now,
          })
          .eq('id', batchId);

        if (locIds.length > 0) {
          await supabase.from('collection_locations').update({ status: 'available' }).in('id', locIds);
        }
      } catch (err) {
        console.warn('Supabase cancelCollectionBatch notice:', err);
      }
    }
  };

  const clearAllDemoData = useCallback(async () => {
    setLeads([]);
    setMeetings([]);
    setActivities([]);
    setReminders([]);
    setNotifications([]);
    setBrands([]);
    setAccounts([]);
    setCampaigns([]);
    setLists([]);
    setEmailCopies([]);
    setImportantNotes([]);
    setTodoTasks([]);
    setKeywordSets([]);
    setKeywords([]);
    setLocations([]);
    setCollectionBatches([]);
    setBatchLocations([]);

    localStorage.setItem('ruhit_local_leads', JSON.stringify([]));
    localStorage.setItem('ruhit_local_meetings', JSON.stringify([]));
    localStorage.setItem('ruhit_local_activities', JSON.stringify([]));
    localStorage.setItem('ruhit_local_reminders', JSON.stringify([]));
    localStorage.setItem('ruhit_local_notifications', JSON.stringify([]));
    localStorage.setItem('ruhit_local_brands', JSON.stringify([]));
    localStorage.setItem('ruhit_local_accounts', JSON.stringify([]));
    localStorage.setItem('ruhit_local_campaigns', JSON.stringify([]));
    localStorage.setItem('ruhit_local_lead_lists', JSON.stringify([]));
    localStorage.setItem('ruhit_local_email_copies', JSON.stringify([]));
    localStorage.setItem('ruhit_local_important_notes', JSON.stringify([]));
    localStorage.setItem('ruhit_local_todo_tasks', JSON.stringify([]));
    localStorage.setItem('ruhit_local_keyword_sets', JSON.stringify([]));
    localStorage.setItem('ruhit_local_keywords', JSON.stringify([]));
    localStorage.setItem('ruhit_local_locations', JSON.stringify([]));
    localStorage.setItem('ruhit_local_collection_batches', JSON.stringify([]));
    localStorage.setItem('ruhit_local_batch_locations', JSON.stringify([]));
    localStorage.setItem('ruhit_db_initialized', 'true');

    await clearAllStores();
  }, []);

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

        // Lead Collection / Command Center
        keywordSets,
        keywords,
        locations,
        collectionBatches,
        batchLocations,
        addKeywordSet,
        updateKeywordSet,
        deleteKeywordSet,
        addKeywordsToSet,
        deleteKeyword,
        bulkImportLocations,
        addSingleLocation,
        updateLocation,
        deleteLocation,
        getNextAvailableLocations,
        checkLocationOverlap,
        createCollectionBatch,
        startCollectionBatch,
        completeCollectionBatch,
        cancelCollectionBatch,

        markNotificationRead,
        markAllNotificationsRead,
        refreshDataFromCloud,
        clearAllDemoData,
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

