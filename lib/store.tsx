"use client";
// One client store for progress, cloud sync and theme. Progress lives in localStorage key dsa-daily-v1
// (same keys as the old static site, so existing ticks carry over) and syncs to Supabase when a key is set.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { normQuota, ymd, type How, type Quota, type State } from "./logic";
import { applyDiff, diff, pushDiff, same } from "./sync";

const LS_KEY = "dsa-daily-v1", SYNC_KEY = "dsa-daily-sync-key", BASE_KEY = "dsa-daily-base";
export const PALETTES = {
  midnight: ["Midnight", "#1D4ED8", "#5B9BFF"], galaxy: ["Galaxy", "#4A4E8F", "#A3A7F2"], ocean: ["Ocean", "#0F766E", "#4FD1C5"],
  forest: ["Forest", "#3F6B3A", "#8CC77F"], sunset: ["Sunset", "#C2410C", "#FB923C"], rose: ["Rose", "#BE185D", "#F472B6"], mono: ["Mono", "#111111", "#F2F2F2"],
} as const;
export type Palette = keyof typeof PALETTES;
export type Mode = "auto" | "light" | "dark";

const read = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v == null ? fallback : (JSON.parse(v) as T); } catch { return fallback; } };
const write = (k: string, v: unknown) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {} };

type Ctx = {
  ready: boolean; state: State; now: Date; status: string; synced: boolean; connected: boolean;
  toggle(i: number, on: boolean): void; setHow(i: number, h: How): void; setNote(i: number, n: string): void;
  revisitDone(i: number): void; setQuota(k: keyof Quota, v: number): void; importState(s: State): void; connect(key: string): void;
  palette: Palette; mode: Mode; setPalette(p: Palette): void; setMode(m: Mode): void; toast: string | null; say(msg: string): void;
};
const Store = createContext<Ctx | null>(null);
export const useStore = () => { const c = useContext(Store); if (!c) throw new Error("useStore outside StoreProvider"); return c; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>({ done: {}, quota: normQuota() });
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState("Loading…");
  const [synced, setSynced] = useState(false);
  const [connected, setConnected] = useState(false);
  const [palette, setPaletteRaw] = useState<Palette>("midnight");
  const [mode, setModeRaw] = useState<Mode>("auto");
  const [toast, setToast] = useState<string | null>(null);

  const cur = useRef(state), base = useRef<State | null>(null), key = useRef<string | null>(null);
  const busy = useRef(false), again = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast((t) => (t === msg ? null : t)), 2800); }, []);

  const sync = useCallback(async () => {
    if (!key.current) return;
    if (busy.current) { again.current = true; return; }
    busy.current = true;
    const sent = structuredClone(cur.current);
    // first connect on this device: add local ticks to the cloud, never delete cloud ones
    const d = base.current ? diff(base.current, sent) : { set: sent.done, del: [], quota: null };
    try {
      const server = await pushDiff(key.current, d);
      base.current = server;
      const merged = applyDiff(server, diff(sent, cur.current)); // keep edits made during the request
      const next = { ...merged, quota: normQuota(merged.quota) }; // old-format quota upgrades, then syncs back
      if (!same(next, cur.current)) { cur.current = next; setState(next); }
      write(LS_KEY, next); write(BASE_KEY, server);
      if (!same(next, server)) again.current = true;
      setSynced(true);
      setStatus("Synced " + new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSynced(false);
      if (/sync key/.test(msg)) {
        key.current = null; base.current = null; write(SYNC_KEY, null); write(BASE_KEY, null); setConnected(false);
        say(msg === "wrong sync key" ? "Wrong sync key. Enter the key you used on your first device." : msg);
        setStatus("Cloud sync off");
      } else setStatus("Offline, saved on this device");
    } finally {
      busy.current = false;
      if (again.current) { again.current = false; void sync(); }
    }
  }, [say]);

  const commit = useCallback((f: (s: State) => State) => {
    const next = f(cur.current);
    cur.current = next; setState(next); write(LS_KEY, next);
    if (!key.current) setStatus("Saved on this device");
    clearTimeout(timer.current); timer.current = setTimeout(() => void sync(), 300);
  }, [sync]);

  // boot: load local state, then sync
  useEffect(() => {
    const s = read<Partial<State> | null>(LS_KEY, null);
    if (s && s.done) { const loaded = { done: s.done, quota: normQuota(s.quota) }; cur.current = loaded; setState(loaded); }
    base.current = read<State | null>(BASE_KEY, null);
    try { key.current = localStorage.getItem(SYNC_KEY); } catch {}
    try {
      const p = localStorage.getItem("dsa-daily-palette") as Palette | null, m = localStorage.getItem("dsa-daily-theme") as Mode | null;
      if (p && p in PALETTES) setPaletteRaw(p);
      if (m === "light" || m === "dark") setModeRaw(m);
    } catch {}
    setConnected(!!key.current);
    setStatus(key.current ? "Syncing…" : "Saved on this device");
    setReady(true);
    void sync();
    const onVis = () => { if (!document.hidden) void sync(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onVis);
    const poll = setInterval(() => { setNow((n) => (ymd(n) === ymd(new Date()) ? n : new Date())); if (!document.hidden) void sync(); }, 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", onVis); clearInterval(poll); };
  }, [sync]);

  // theme attributes on <html>; the inline script in layout sets them before paint
  useEffect(() => {
    if (!ready) return;
    const r = document.documentElement;
    if (palette === "midnight") r.removeAttribute("data-palette"); else r.dataset.palette = palette;
    if (mode === "auto") r.removeAttribute("data-theme"); else r.dataset.theme = mode;
    write("dsa-daily-palette", palette); write("dsa-daily-theme", mode);
  }, [palette, mode, ready]);

  const value = useMemo<Ctx>(() => ({
    ready, state, now, status, synced, connected, palette, mode, toast, say,
    setPalette: setPaletteRaw, setMode: setModeRaw,
    toggle: (i, on) => commit((s) => {
      const done = { ...s.done };
      if (on) done[i] = { d: ymd(new Date()), h: "s", r: 0, t: Date.now() }; else delete done[i];
      return { ...s, done };
    }),
    setHow: (i, h) => commit((s) => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], h, r: 0 } } })),
    setNote: (i, n) => commit((s) => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], n: n.slice(0, 200) } } })),
    revisitDone: (i) => commit((s) => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], r: (s.done[i].r || 0) + 1 } } })),
    setQuota: (k, v) => commit((s) => ({ ...s, quota: { ...s.quota, [k]: Math.max(0, Math.min(10, v || 0)) } })),
    importState: (imp) => commit(() => ({ done: imp.done, quota: normQuota(imp.quota) })),
    connect: (k) => {
      key.current = k; base.current = null; write(SYNC_KEY, k); write(BASE_KEY, null);
      setConnected(true); setStatus("Syncing…"); void sync();
    },
  }), [ready, state, now, status, synced, connected, palette, mode, toast, say, commit, sync]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}
