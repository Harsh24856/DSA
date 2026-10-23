"use client";
// Supabase access for sync. Without NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY the site runs
// browser-only, exactly as before. Tables and security rules: supabase/migrations/0001_progress.sql.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { batches, eventFor, type Op, type SettingsRow, type SolveRow } from "@/lib/sync.ts";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
export function supabase() {
  if (!cloudEnabled) return null;
  // Implicit flow: the magic link works even when opened in a different browser from the one that asked for it.
  client ??= createClient(URL!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } });
  return client;
}

/* ---------- outbox: changes waiting to reach Supabase, kept per account so nothing is lost offline ---------- */
const outboxKey = (uid: string) => "dsa-daily-outbox:" + uid;
const syncedKey = (uid: string) => "dsa-daily-synced:" + uid;

export function readOutbox(uid: string): Op[] {
  try { return JSON.parse(localStorage.getItem(outboxKey(uid)) || "[]"); } catch { return []; }
}
function writeOutbox(uid: string, ops: Op[]) {
  try { localStorage.setItem(outboxKey(uid), JSON.stringify(ops)); } catch {}
}
export function queue(uid: string, ops: Op[]) { if (ops.length) writeOutbox(uid, [...readOutbox(uid), ...ops]); }
function remove(uid: string, ids: string[]) { const gone = new Set(ids); writeOutbox(uid, readOutbox(uid).filter(o => !gone.has(o.id))); }

const OWNER_KEY = "dsa-daily-owner"; // the account this browser's progress belongs to, once synced

// Only import this browser's progress into an account the first time that account syncs here,
// and never into a different account than the one it already belongs to.
export function shouldImport(uid: string) {
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    return !localStorage.getItem(syncedKey(uid)) && (!owner || owner === uid);
  } catch { return false; }
}
export function markSynced(uid: string) {
  try { localStorage.setItem(syncedKey(uid), new Date().toISOString()); localStorage.setItem(OWNER_KEY, uid); } catch {}
}

async function send(sb: SupabaseClient, uid: string, batch: Op[]) {
  const first = batch[0];
  if (first.kind === "upsert") {
    const { error } = await sb.from("solves").upsert(batch.map(o => ({ user_id: uid, ...(o as Extract<Op, { kind: "upsert" }>).row })));
    if (error) throw error;
  } else if (first.kind === "delete") {
    const { error } = await sb.from("solves").delete().eq("user_id", uid).in("problem_index", batch.map(o => (o as Extract<Op, { kind: "delete" }>).i));
    if (error) throw error;
  } else {
    const { error } = await sb.from("settings").upsert({ user_id: uid, ...first.settings });
    if (error) throw error;
  }
  const events = batch.map(eventFor).filter(e => e !== null).map(e => ({ user_id: uid, ...e }));
  if (events.length) {
    const { error } = await sb.from("solve_events").insert(events);
    if (error) throw error;
  }
}

// Sends queued changes in order; stops at the first failure so the rest retry later.
export async function push(sb: SupabaseClient, uid: string) {
  for (const batch of batches(readOutbox(uid))) {
    await send(sb, uid, batch);
    remove(uid, batch.map(o => o.id));
  }
}

export async function pull(sb: SupabaseClient): Promise<{ rows: SolveRow[]; settings: SettingsRow | null }> {
  const [solves, settings] = await Promise.all([
    sb.from("solves").select("problem_index, solved_on, how, revisits, note, solved_at"),
    sb.from("settings").select("quota, seen").maybeSingle(),
  ]);
  if (solves.error) throw solves.error;
  if (settings.error) throw settings.error;
  return { rows: (solves.data || []) as SolveRow[], settings: settings.data as SettingsRow | null };
}
