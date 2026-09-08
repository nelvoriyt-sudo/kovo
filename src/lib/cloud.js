import { createClient } from '@supabase/supabase-js';
import { serializeBackup, parseBackup } from './backup.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloudConfigured = Boolean(url && anonKey);
export const cloud = cloudConfigured ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export async function loadCloudData() {
  if (!cloud) throw new Error('Cloud sync is not configured. Your local data is unchanged.');
  const { data: { user }, error: authError } = await cloud.auth.getUser();
  if (authError || !user) throw new Error('Sign in before loading cloud data.');
  const { data, error } = await cloud.from('user_data').select('payload,revision,updated_at').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, payload: parseBackup(JSON.stringify(data.payload)) } : null;
}

export async function saveCloudData(payload, expectedRevision = 0) {
  if (!cloud) throw new Error('Cloud sync is not configured. Your local data is unchanged.');
  const { data: { user }, error: authError } = await cloud.auth.getUser();
  if (authError || !user) throw new Error('Sign in before saving cloud data.');
  const validated = parseBackup(serializeBackup(payload));
  const { data, error } = await cloud.rpc('save_user_data', { p_payload: validated, p_expected_revision: expectedRevision });
  if (error) throw error;
  if (!data?.saved) throw new Error('The cloud copy changed on another device. Reload and reconcile before saving.');
  return data.revision;
}
