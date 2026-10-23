// Scheduling rules, kept free of React and the DOM so they can be tested with `npm test`.
import { P, type Track } from "./problems.ts";

export type How = "s" | "h" | "e";
export type Done = { d: string; h?: How; r?: number; n?: string; t?: number };
// L/S = per weekday, wL/wS = per weekend day, C = Codeforces per week (weekend only)
export type Quota = { L: number; S: number; wL: number; wS: number; C: number };
export type State = { done: Record<string, Done>; quota: Quota; seen: Record<string, string> };
export type Plan = { main: number[]; groups: Record<Track, number[]>; extraDone: number[]; cfNeed: number; cfDone: number };

export const PLACEMENT = new Date(2027, 4, 1);
export const REV = [3, 7, 21];
export const DEFAULT_QUOTA: Quota = { L: 2, S: 1, wL: 3, wS: 2, C: 2 };
export const QUOTA_KEYS = Object.keys(DEFAULT_QUOTA) as (keyof Quota)[];
export const TRACK: Record<Track, string> = { L: "LeetCode", S: "SQL", C: "Codeforces" };
export const GROUP: Record<Track, string> = { L: "DSA", S: "SQL", C: "Codeforces" };
export const PHASES: Record<number, string> = {
  1: "Phase 1 · Unseen Mediums (to Dec 27)",
  2: "Phase 2 · Medium–Hard (to Feb 28)",
  3: "Phase 3 · OA simulation (to Apr 15)",
  4: "Phase 4 · Revision (to May 1)",
};

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const diffDays = (a: Date, b: Date) => Math.round((parse(ymd(a)).getTime() - parse(ymd(b)).getTime()) / 864e5);
export const weekStart = (d: Date) => addDays(parse(ymd(d)), -((d.getDay() + 6) % 7)); // Monday
export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
export const quotaFor = (q: Quota, d: Date, tr: "L" | "S") => (isWeekend(d) ? q[tr === "L" ? "wL" : "wS"] : q[tr]) || 0;
export const problemUrl = (i: number) => P[i][0] === "C" ? P[i][2] : "https://leetcode.com/problems/" + P[i][2] + "/";
export const displayTitle = (i: number) => P[i][0] === "C" ? "Top unsolved problem · rating " + P[i][3].replace("CF ", "") : P[i][1];
export const emptyState = (): State => ({ done: {}, quota: { ...DEFAULT_QUOTA }, seen: {} });

// Accepts anything read from storage or a backup file; fills missing quota keys (old saves only had L/S/C).
export function normalize(raw: unknown): State {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<State>;
  const quota = { ...DEFAULT_QUOTA };
  for (const k of QUOTA_KEYS) {
    const v = parseInt(String(s.quota?.[k]), 10);
    if (!isNaN(v)) quota[k] = Math.max(0, Math.min(10, v));
  }
  const obj = <T,>(v: T | undefined) => (v && typeof v === "object" ? v : {}) as T;
  return { done: obj(s.done), quota, seen: obj(s.seen) };
}

export function queue(s: State, track: Track) {
  const q: number[] = [];
  P.forEach((p, i) => { if (p[0] === track && !s.done[i]) q.push(i); });
  return q;
}

export function doneOn(s: State, track: Track, from: string, to: string) { // ids done in [from,to] (ymd strings)
  return Object.keys(s.done).map(Number)
    .filter(i => P[i] && P[i][0] === track && s.done[i].d >= from && s.done[i].d <= to)
    .sort((a, b) => (s.done[a].t || 0) - (s.done[b].t || 0) || a - b);
}

export function todayPlan(s: State, now: Date): Plan {
  const t = ymd(now);
  const groups: Record<Track, number[]> = { L: [], S: [], C: [] };
  for (const tr of ["L", "S"] as const) {
    // Today's slots = lowest-index problems among (done today + still undone). A problem missed on an earlier day
    // keeps its low index, so it stays on the list until ticked; extras never shrink tomorrow's minimum.
    const n = quotaFor(s.quota, now, tr);
    groups[tr] = [...doneOn(s, tr, t, t), ...queue(s, tr).slice(0, n)].sort((a, b) => a - b).slice(0, n);
  }
  const ws = weekStart(now);
  const cfDone = doneOn(s, "C", ymd(ws), ymd(addDays(ws, 6)));
  const cfNeed = Math.max(0, (s.quota.C || 0) - cfDone.length);
  groups.C = isWeekend(now) ? [...cfDone.filter(i => s.done[i].d === t), ...queue(s, "C").slice(0, cfNeed)] : [];
  const main = [...groups.L, ...groups.S, ...groups.C];
  const extraDone = Object.keys(s.done).map(Number).filter(i => P[i] && s.done[i].d === t && !main.includes(i));
  return { main, groups, extraDone, cfNeed, cfDone: cfDone.length };
}

// Records the first day each undone problem was on the list, so a missed one can show where it came from.
// Returns the same object when nothing changed.
export function markSeen(s: State, ids: number[], t: string): State {
  const add = ids.filter(i => !s.done[i] && !s.seen[i]);
  if (!add.length) return s;
  const seen = { ...s.seen };
  for (const i of add) seen[i] = t;
  return { ...s, seen };
}

export function carriedFrom(s: State, i: number, t: string) {
  const seen = s.seen[i];
  return !s.done[i] && seen && seen < t ? seen : null;
}

export function revisitsDue(s: State, now: Date) {
  const out: { i: number; r: number; due: Date }[] = [];
  for (const [k, v] of Object.entries(s.done)) {
    if (!v.h || v.h === "s") continue;
    const r = v.r || 0;
    if (r >= REV.length) continue;
    const due = addDays(parse(v.d), REV[r]);
    if (diffDays(now, due) >= 0) out.push({ i: +k, r, due });
  }
  return out.sort((a, b) => a.due.getTime() - b.due.getTime());
}

// Mon..Sun of this week, each against its own minimum (DSA + SQL; Codeforces is a weekly goal).
export function weekDays(s: State, now: Date) {
  const ws = weekStart(now), t = ymd(now);
  return Array.from({ length: 7 }, (_, k) => {
    const d = addDays(ws, k), key = ymd(d);
    const count = Object.keys(s.done).filter(i => P[+i] && s.done[i].d === key && P[+i][0] !== "C").length;
    const goal = quotaFor(s.quota, d, "L") + quotaFor(s.quota, d, "S");
    return { date: d, key, count, goal, met: goal > 0 && count >= goal, isToday: key === t, future: key > t };
  });
}

export function streak(s: State, now: Date) {
  const days = new Set(Object.values(s.done).map(v => v.d)), t = ymd(now);
  let n = 0;
  for (let d = new Date(now); n <= 400; d = addDays(d, -1)) {
    const key = ymd(d);
    if (days.has(key)) n++; else if (key !== t) break;
  }
  return n;
}

// The next 7 days, assuming today's list gets finished.
export function upcoming(s: State, now: Date, plan: Plan) {
  const notToday = (i: number) => !plan.main.includes(i);
  const qL = queue(s, "L").filter(notToday), qS = queue(s, "S").filter(notToday), qC = queue(s, "C").filter(notToday);
  const cfLeftThisWeek = isWeekend(now) ? 0 : plan.cfNeed;
  return Array.from({ length: 7 }, (_, k) => {
    const d = addDays(now, k + 1);
    const items = [...qL.splice(0, quotaFor(s.quota, d, "L")), ...qS.splice(0, quotaFor(s.quota, d, "S"))];
    if (d.getDay() === 6) items.push(...qC.splice(0, diffDays(weekStart(d), weekStart(now)) === 0 ? cfLeftThisWeek : s.quota.C));
    return { date: d, items };
  });
}

export const currentPhase = (plan: Plan) => plan.main.length ? P[plan.main[0]][4] : 4;
