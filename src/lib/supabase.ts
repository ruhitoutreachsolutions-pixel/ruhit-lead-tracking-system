import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'ruhit_supabase_url';
const STORAGE_ANON_KEY = 'ruhit_supabase_anon_key';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const storedKey = localStorage.getItem(STORAGE_ANON_KEY) || '';

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project-ref') &&
    url.startsWith('https://')
  );

  return { url, anonKey, isConfigured };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  clientInstance = null; // force re-init
  initSupabase();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_ANON_KEY);
  clientInstance = null;
}

export function initSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (isConfigured) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return clientInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      clientInstance = null;
    }
  }
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!clientInstance) {
    return initSupabase();
  }
  return clientInstance;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; missingTables?: string[] }> {
  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    
    // Check if connected and if tables exist
    const { error: leadsErr } = await testClient.from('leads').select('id').limit(1);

    if (leadsErr) {
      if (leadsErr.message?.includes('does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase project! Note: Schema tables are not yet created. Please run the SQL migration script.',
          missingTables: ['leads'],
        };
      }
      return { success: false, message: leadsErr.message };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase! All tables verified.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error while attempting to connect to Supabase.',
    };
  }
}

/**
 * Strip client-only or non-existent schema properties before sending to Supabase
 * to prevent PostgREST 400 Bad Request errors (such as missing 'tags' column).
 */
export function sanitizeLeadForSupabase(lead: Record<string, any>): Record<string, any> {
  const allowedKeys = new Set([
    'id', 'email', 'first_name', 'last_name', 'company_name',
    'whatsapp_number', 'alternative_phone', 'city', 'country', 'notes',
    'source', 'priority', 'list_ids', 'campaign_id', 'campaign_name',
    'brand_id', 'brand_name', 'account_id', 'account_name',
    'assigned_user_id', 'assigned_user_name',
    'email_1', 'email_2', 'email_3',
    'email_1_date', 'email_2_date', 'email_3_date',
    'whatsapp_followup_stage', 'interested_email_followup_stage',
    'is_interested', 'interested_at',
    'is_meeting_scheduled', 'meeting_scheduled_at',
    'is_meeting_done', 'meeting_done_at',
    'meeting_count_type', 'meeting_count_at',
    'is_pending', 'pending_at',
    'meeting_date', 'meeting_time', 'meeting_timezone', 'meeting_type', 'meeting_link',
    'created_at', 'updated_at'
  ]);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(lead)) {
    if (allowedKeys.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Strip client-only or non-existent schema properties before sending to Supabase
 * to prevent PostgREST 400 Bad Request errors for meetings.
 */
export function sanitizeMeetingForSupabase(meeting: Record<string, any>): Record<string, any> {
  const allowedKeys = new Set([
    'id', 'lead_id', 'lead_name', 'lead_company', 'lead_email', 'lead_whatsapp',
    'campaign_name', 'brand_name', 'account_name', 'assigned_user_name',
    'scheduled_at', 'duration_minutes', 'status', 'meeting_type', 'meeting_link',
    'notes', 'created_at'
  ]);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(meeting)) {
    if (allowedKeys.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
