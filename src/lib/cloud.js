import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://qilncthqoemugozmilbg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2bl7GhwbDqmYb2fJA_o95Q_01f3cxHg";

export const cloud = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function loadCloudData(userId) {
  const { data, error } = await cloud
    .from("kovo_user_data")
    .select("data,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveCloudData(userId, data) {
  const { error } = await cloud.from("kovo_user_data").upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
