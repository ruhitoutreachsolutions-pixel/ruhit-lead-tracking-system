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
