// Public project settings. The publishable key is meant for browsers; row-level security and the
// signed-in-only RPCs in supabase/schema.sql are what protect the data.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dmiiflynxamcooowyhps.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_wMRDwIm-ju-tXe8XvOoxJg_AnHYcIyd";
