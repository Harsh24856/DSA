"use client";
// One client store for progress, cloud sync and theme. Progress lives in localStorage key dsa-daily-v1
// (same keys as the old static site, so existing ticks carry over) and syncs to the signed-in user's row.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { normQuota, validDates, ymd, type Count, type How, type State } from "./logic";
import { applyDiff, diff, pushDiff, same } from "./sync";
import { supabase } from "./supabase/client";
import { claimLocal, clearLocal } from "./owner";
import { lookById } from "./looks";

const LS_KEY = "dsa-daily-v1";
// last server-confirmed state, per account; a fresh account/device starts by adding local ticks
const baseKey = (email: string) => `dsa-daily-base:${email}`;
export const PALETTES = {
  midnight: ["Midnight", "#1D4ED8", "#5B9BFF"], galaxy: ["Galaxy", "#4A4E8F", "#A3A7F2"], ocean: ["Ocean", "#0F766E", "#4FD1C5"],
  forest: ["Forest", "#3F6B3A", "#8CC77F"], sunset: ["Sunset", "#C2410C", "#FB923C"], rose: ["Rose", "#BE185D", "#F472B6"], mono: ["Mono", "#111111", "#F2F2F2"],
} as const;
export type Palette = keyof typeof PALETTES;
export type Mode = "auto" | "light" | "dark";

const read = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v == null ? fallback : (JSON.parse(v) as T); } catch { return fallback; } };
const write = (k: string, v: unknown) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {} };

type Ctx = {
  ready: boolean; state: State; now: Date; status: string; synced: boolean; connected: boolean; email: string | null; authChecked: boolean; signOut(): Promise<void>;
  toggle(i: number, on: boolean): void; setHow(i: number, h: How): void; setNote(i: number, n: string): void;
  revisitDone(i: number): void; setQuota(k: Count, v: number): void; setDate(k: "start" | "placement", v: string): void; importState(s: State): void;
  palette: Palette; mode: Mode; look: string; setPalette(p: Palette): void; setMode(m: Mode): void; setLook(l: string): void; toast: string | null; say(msg: string): void;
};
const Store = createContext<Ctx | null>(null);
export const useStore = () => { const c = useContext(Store); if (!c) throw new Error("useStore outside StoreProvider"); return c; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>({ done: {}, quota: normQuota() });
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState("Loading…");
  const [synced, setSynced] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [palette, setPaletteRaw] = useState<Palette>("midnight");
  const [mode, setModeRaw] = useState<Mode>("auto");
  const [look, setLookRaw] = useState("classic");
  const [toast, setToast] = useState<string | null>(null);

  const cur = useRef(state), base = useRef<State | null>(null), key = useRef<string | null>(null); // key = signed-in email
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
      const server = await pushDiff(d);
      base.current = server;
      const merged = applyDiff(server, diff(sent, cur.current)); // keep edits made during the request
      const next = { ...merged, quota: normQuota(merged.quota) }; // old-format quota upgrades, then syncs back
      if (!same(next, cur.current)) { cur.current = next; setState(next); }
      write(LS_KEY, next); write(baseKey(key.current!), server);
      if (!same(next, server)) again.current = true;
      setSynced(true);
      setStatus("Synced " + new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSynced(false);
      if (/not signed in|JWT/.test(msg)) setStatus("Signed out, saved on this device");
      else setStatus("Offline, saved on this device");
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
    try {
      const p = localStorage.getItem("dsa-daily-palette") as Palette | null, m = localStorage.getItem("dsa-daily-theme") as Mode | null;
      if (p && p in PALETTES) setPaletteRaw(p);
      if (m === "light" || m === "dark") setModeRaw(m);
      setLookRaw(lookById(localStorage.getItem("dsa-daily-look") ?? "classic").id);
    } catch {}
    setStatus("Syncing…");
    setReady(true);
    // the session lives in cookies; follow sign-in, token refresh and sign-out
    const follow = (mail: string | null) => {
      if (mail === key.current) return;
      if (mail && claimLocal(LS_KEY, mail)) { const empty = { done: {}, quota: normQuota() }; cur.current = empty; setState(empty); }
      key.current = mail; setEmail(mail);
      base.current = mail ? read<State | null>(baseKey(mail), null) : null;
      if (mail) void sync(); else setStatus("Saved on this device");
    };
    void supabase().auth.getSession().then(({ data }) => { follow(data.session?.user.email?.toLowerCase() ?? null); setAuthChecked(true); });
    const { data: sub } = supabase().auth.onAuthStateChange((_e, session) => follow(session?.user.email?.toLowerCase() ?? null));
    const onVis = () => { if (!document.hidden) void sync(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onVis);
    const poll = setInterval(() => { setNow((n) => (ymd(n) === ymd(new Date()) ? n : new Date())); if (!document.hidden) void sync(); }, 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", onVis); clearInterval(poll); sub.subscription.unsubscribe(); };
  }, [sync]);

  // theme attributes on <html>; the inline script in layout sets them before paint
  useEffect(() => {
    if (!ready) return;
    const r = document.documentElement;
    if (palette === "midnight") r.removeAttribute("data-palette"); else r.dataset.palette = palette;
    if (mode === "auto") r.removeAttribute("data-theme"); else r.dataset.theme = mode;
    const L = lookById(look);
    if (L.id === "classic") { delete r.dataset.look; delete r.dataset.kind; } else { r.dataset.look = L.id; r.dataset.kind = L.photo ? "photo" : "drawn"; }
    write("dsa-daily-palette", palette); write("dsa-daily-theme", mode); write("dsa-daily-look", L.id);
  }, [palette, mode, look, ready]);

  const value = useMemo<Ctx>(() => ({
    ready, state, now, status, synced, connected: !!email, email, authChecked, palette, mode, toast, say,
    signOut: async () => { await supabase().auth.signOut(); clearLocal(LS_KEY, "dsa-patterns-v1"); location.href = "/"; },
    look, setPalette: setPaletteRaw, setMode: setModeRaw, setLook: setLookRaw,
    toggle: (i, on) => commit((s) => {
      const done = { ...s.done };
      if (on) done[i] = { d: ymd(new Date()), h: "s", r: 0, t: Date.now() }; else delete done[i];
      return { ...s, done };
    }),
    setHow: (i, h) => commit((s) => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], h, r: 0 } } })),
    setNote: (i, n) => commit((s) => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], n: n.slice(0, 200) } } })),
    revisitDone: (i) => commit((s) => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], r: (s.done[i].r || 0) + 1 } } })),
    setQuota: (k, v) => commit((s) => ({ ...s, quota: { ...s.quota, [k]: Math.max(0, Math.min(10, v || 0)) } })),
    setDate: (k, v) => { const q = { ...cur.current.quota, [k]: v }; if (validDates(q.start, q.placement)) commit((s) => ({ ...s, quota: q })); },
    importState: (imp) => commit(() => ({ done: imp.done, quota: normQuota(imp.quota) })),
  }), [ready, state, now, status, synced, email, authChecked, palette, mode, look, toast, say, commit, sync]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}
