"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { emptyState, normalize, ymd, type State } from "@/lib/schedule.ts";

// Progress lives in localStorage under this key: {done:{<row>:{d,h,r,n,t}}, quota:{L,S,wL,wS,C}, seen:{<row>:"YYYY-MM-DD"}}
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

export function ProgressProvider({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [save, setSave] = useState("Loading…");
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const touched = useRef(false);
  const now = useToday();

  useEffect(() => {
    let s = emptyState();
    try { const raw = JSON.parse(localStorage.getItem(LS_KEY) || "null"); if (raw && raw.done) s = normalize(raw); } catch {}
    setState(s);
    setSave(Object.keys(s.done).length ? "Saved in this browser" : "Tick a problem to start. Progress saves in this browser.");
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      if (touched.current) setSave("Saved in this browser");
    } catch {
      setSave("Couldn’t save in this browser. Private mode or blocked storage can cause this.");
    }
  }, [state]);

  const update = useCallback((fn: (s: State) => State, opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) touched.current = true;
    setState(s => (s ? fn(s) : s));
  }, []);
  const replace = useCallback((s: State) => { touched.current = true; setState(s); }, []);
  const reveal = useCallback((i: number) => setRevealed(r => new Set(r).add(i)), []);

  if (!state || !now) return <>{fallback}</>;
  return (
    <SaveContext.Provider value={save}>
      <ProgressContext.Provider value={{ state, update, replace, t: ymd(now), now, revealed, reveal }}>
        {children}
      </ProgressContext.Provider>
    </SaveContext.Provider>
  );
}
