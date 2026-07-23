import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://nkxsqhkxgwpjdcmcetav.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_N62oQfMBES5KX1YK8VKV8w_gbC7lmHv';

const getEnv = (key: string): string => {
  const candidates: string[] = [];

  if (typeof window !== 'undefined') {
    const runtimeEnv = (window as any).ENV || {};
    if (runtimeEnv[key]) candidates.push(runtimeEnv[key]);

    const altConfig = (window as any).__SUPABASE_CONFIG__ || {};
    if (altConfig[key]) candidates.push(altConfig[key]);
  }

  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const value = (import.meta as any).env[key];
    if (value) candidates.push(value);
  }

  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    candidates.push(process.env[key]);
  }

  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

