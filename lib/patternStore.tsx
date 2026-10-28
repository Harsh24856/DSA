"use client";
// Ticks for pattern-practice problems, keyed by LeetCode number, and Gen AI modules done, keyed "genai:<id>". Stored in dsa-patterns-v1 and the
// Supabase `patterns` column, never in the daily-plan state, so Today and Analytics stay unaffected.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ymd } from "./logic";
import { pushPatterns, type PTick } from "./sync";
import { supabase } from "./supabase/client";
import { claimLocal } from "./owner";

const LS = "dsa-patterns-v1", BASE = (email: string) => `dsa-patterns-base:${email}`;
type Done = Record<string, PTick>;
type Ctx = { ready: boolean; done: Done; toggle(key: number | string, on: boolean): void };
const C = createContext<Ctx | null>(null);
export const usePatterns = () => { const c = useContext(C); if (!c) throw new Error("usePatterns outside PatternProvider"); return c; };

const read = (k: string): Done | null => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const write = (k: string, v: Done) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function PatternProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState<Done>({});
  const cur = useRef<Done>({}), base = useRef<Done | null>(null), baseFor = useRef<string | null>(null), busy = useRef(false), again = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sync = useCallback(async () => {
    const key = (await supabase().auth.getSession()).data.session?.user.email?.toLowerCase();
    if (!key) return;
    if (baseFor.current !== key) {
      if (claimLocal(LS, key)) { cur.current = {}; setDone({}); }   // a different account used this browser before
      base.current = read(BASE(key)); baseFor.current = key;
    }
    if (busy.current) { again.current = true; return; }
    busy.current = true;
    const sent = { ...cur.current }, b = base.current;
    const set: Done = {}, del: string[] = [];
    for (const [k, v] of Object.entries(sent)) if (!b || JSON.stringify(b[k]) !== JSON.stringify(v)) set[k] = v;
    if (b) for (const k of Object.keys(b)) if (!(k in sent)) del.push(k);
    try {
      const server = await pushPatterns(set, del);
      base.current = server; write(BASE(key), server);
      // keep ticks made while the request was in flight
      const next = { ...server };
      for (const [k, v] of Object.entries(cur.current)) if (JSON.stringify(sent[k]) !== JSON.stringify(v)) next[k] = v;
      for (const k of Object.keys(sent)) if (!(k in cur.current)) delete next[k];
      cur.current = next; setDone(next); write(LS, next);
      if (JSON.stringify(next) !== JSON.stringify(server)) again.current = true;
    } catch { /* offline or no row yet: local copy stays, retried later */ }
    finally { busy.current = false; if (again.current) { again.current = false; void sync(); } }
  }, []);

  useEffect(() => {
    const d = read(LS) || {}; cur.current = d; setDone(d); setReady(true); void sync();
    const { data: sub } = supabase().auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") void sync(); });
    const onVis = () => { if (!document.hidden) void sync(); };
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(onVis, 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(t); sub.subscription.unsubscribe(); };
  }, [sync]);

  const value = useMemo<Ctx>(() => ({
    ready, done,
    toggle: (key, on) => {
      const next = { ...cur.current };
      if (on) next[key] = { d: ymd(new Date()) }; else delete next[key];
      cur.current = next; setDone(next); write(LS, next);
      clearTimeout(timer.current); timer.current = setTimeout(() => void sync(), 300);
    },
  }), [ready, done, sync]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
