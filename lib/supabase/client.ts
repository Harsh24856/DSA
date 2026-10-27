"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// One browser client. @supabase/ssr keeps the session in cookies (sb-<ref>-auth-token),
// so the browser stays signed in between visits and the proxy can refresh it.
let client: SupabaseClient | undefined;
export const supabase = (): SupabaseClient => (client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY));
