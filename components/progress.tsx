"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { emptyState, normalize, ymd, type State } from "@/lib/schedule.ts";
import { diff, merge } from "@/lib/sync.ts";
import { cloudEnabled, markSynced, pull, push, queue, readOutbox, shouldImport, supabase } from "./cloud";

// Progress lives in localStorage under this key: {done:{<row>:{d,h,r,n,t}}, quota:{L,S,wL,wS,C}, seen:{<row>:"YYYY-MM-DD"}}
// When signed in, the same data is kept in Supabase and this copy becomes a cache that works offline.
export const LS_KEY = "dsa-daily-v1";

type Ctx = {
  state: State;
  update: (fn: (s: State) => State, opts?: { quiet?: boolean }) => void; // quiet: bookkeeping, not a user change
  replace: (s: State) => void;
  t: string; // today as YYYY-MM-DD
  now: Date;
  revealed: Set<number>;
  reveal: (i: number) => void;
};
const ProgressContext = createContext<Ctx | null>(null);

export function useProgress() {
  const c = useContext(ProgressContext);
  if (!c) throw new Error("useProgress needs <ProgressProvider>");
  return c;
}

export type SyncStatus = "off" | "signed-out" | "syncing" | "synced" | "offline" | "error";
export type Cloud = {
  enabled: boolean;
  email: string | null;
  status: SyncStatus;
  error: string;
  lastSync: number | null;
  signIn: (email: string) => Promise<string | null>; // returns an error message, or null when the email was sent
  signOut: () => Promise<void>;
  syncNow: () => void;
};
const CloudContext = createContext<Cloud | null>(null);
export function useCloud() {
  const c = useContext(CloudContext);
  if (!c) throw new Error("useCloud needs <ProgressProvider>");
  return c;
}

// Re-renders when the calendar day changes, so the list rolls over at midnight without a reload.
function useToday() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(prev => (prev && ymd(prev) === ymd(new Date()) ? prev : new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useSaveStatus() {
  return useContext(SaveContext);
}
const SaveContext = createContext("");

const errorText = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e));

export function ProgressProvider({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [save, setSave] = useState("Loading…");
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>(cloudEnabled ? "signed-out" : "off");
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const touched = useRef(false);
  const stateRef = useRef<State | null>(null);
  const prevRef = useRef<State | null>(null); // last state already queued for the cloud
  const fromCloud = useRef(false); // the next state change came from Supabase, so don't send it back
  const running = useRef(false), again = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const now = useToday();

  useEffect(() => {
    let s = emptyState();
    try { const raw = JSON.parse(localStorage.getItem(LS_KEY) || "null"); if (raw && raw.done) s = normalize(raw); } catch {}
    setState(s);
    setSave(Object.keys(s.done).length ? "Saved in this browser" : "Tick a problem to start. Progress saves in this browser.");
  }, []);

  // Push queued changes, then (when asked) pull the cloud copy. One run at a time; a request
  // that arrives mid-run is folded into one more run afterwards.
  const sync = useCallback(async (full: boolean) => {
    const sb = supabase(), u = user;
    if (!sb || !u) return;
    if (running.current) { again.current = again.current || full; return; }
    running.current = true;
    setStatus("syncing");
    try {
      await push(sb, u.id);
      if (full) {
        const { rows, settings } = await pull(sb);
        const local = stateRef.current || emptyState();
        const { state: merged, upload } = merge(local, rows, settings, shouldImport(u.id));
        if (readOutbox(u.id).length === 0) { // nothing new was ticked while we were pulling
          fromCloud.current = true;
          setState(merged);
          queue(u.id, upload);
          await push(sb, u.id);
          markSynced(u.id);
        } else again.current = true;
      }
      setError("");
      if (!again.current) { setStatus("synced"); setLastSync(Date.now()); } // otherwise the follow-up run reports
    } catch (e) {
      setError(errorText(e));
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    } finally {
      running.current = false;
      if (again.current) { const f = again.current; again.current = false; setTimeout(() => sync(f), 0); }
    }
  }, [user]);

  // Sign-in state from Supabase (also picks up the session from a magic link in the URL).
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setUser(prev => (prev?.id === session?.user.id ? prev : session?.user ?? null)));
    return () => data.subscription.unsubscribe();
  }, []);

  const loaded = state !== null;
  useEffect(() => {
    if (!cloudEnabled) return;
    if (!user) { setStatus("signed-out"); return; }
    if (loaded) sync(true);
  }, [user, sync, loaded]);

  // Save locally on every change; when signed in, queue what changed and push it shortly after.
  useEffect(() => {
    if (!state) return;
    stateRef.current = state;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      if (touched.current && !user) setSave("Saved in this browser");
    } catch {
      setSave("Couldn’t save in this browser. Private mode or blocked storage can cause this.");
    }
    if (user && prevRef.current && !fromCloud.current) {
      queue(user.id, diff(prevRef.current, state));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => sync(false), 600);
    }
    fromCloud.current = false;
    prevRef.current = state;
  }, [state, user, sync]);

  // Catch up when the connection returns or the tab comes back into view (another device may have changed things).
  useEffect(() => {
    if (!user) return;
    const online = () => sync(true);
    const visible = () => { if (document.visibilityState === "visible") sync(true); };
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", visible);
    const retry = setInterval(() => { if (readOutbox(user.id).length) sync(false); }, 60_000);
    return () => { window.removeEventListener("online", online); document.removeEventListener("visibilitychange", visible); clearInterval(retry); };
  }, [user, sync]);

  const update = useCallback((fn: (s: State) => State, opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) touched.current = true;
    setState(s => (s ? fn(s) : s));
  }, []);
  const replace = useCallback((s: State) => { touched.current = true; setState(s); }, []);
  const reveal = useCallback((i: number) => setRevealed(r => new Set(r).add(i)), []);

  const signIn = useCallback(async (email: string) => {
    const sb = supabase();
    if (!sb) return "Cloud sync isn’t set up on this site.";
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
    return error ? error.message : null;
  }, []);
  const signOut = useCallback(async () => {
    await supabase()?.auth.signOut();
    setUser(null);
    setSave("Saved in this browser. Sign in again to sync.");
  }, []);
  const syncNow = useCallback(() => { sync(true); }, [sync]);

  const cloudSave = user && ({
    syncing: "Saving to your account…",
    synced: "Saved to your account",
    offline: "Offline. Your changes are saved here and will sync when you’re back online.",
    error: "Couldn’t reach your account. Changes are saved here and will retry.",
  } as Partial<Record<SyncStatus, string>>)[status];

  if (!state || !now) return <>{fallback}</>;
  return (
    <CloudContext.Provider value={{ enabled: cloudEnabled, email: user?.email ?? null, status, error, lastSync, signIn, signOut, syncNow }}>
      <SaveContext.Provider value={cloudSave || save}>
        <ProgressContext.Provider value={{ state, update, replace, t: ymd(now), now, revealed, reveal }}>
          {children}
        </ProgressContext.Provider>
      </SaveContext.Provider>
    </CloudContext.Provider>
  );
}
