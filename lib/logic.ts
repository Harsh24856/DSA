// Scheduling and stats. Pure functions over the progress state, ported from the original app.js.
import { P, type Track } from "./problems.ts";

export type How = "s" | "h" | "e";
export type Tick = { d: string; h?: How; r?: number; n?: string; t?: number };
/** Daily quota per track: L/S/C on weekdays, wL/wS/wC on Sat and Sun. */
export type Quota = { L: number; S: number; C: number; wL: number; wS: number; wC: number; v?: number };
export type State = { done: Record<string, Tick>; quota: Quota };

export const DEFAULT_QUOTA: Quota = { L: 3, S: 1, C: 0, wL: 3, wS: 2, wC: 2, v: 2 };
/** v2 = weekday/weekend quotas. Anything older (incl. a half-migrated {L:2,S:1,C:2,wL..}) resets to the defaults, then syncs back. */
export const normQuota = (q?: Partial<Quota> | null): Quota => (q && q.v === 2 ? { ...DEFAULT_QUOTA, ...q } : DEFAULT_QUOTA);
export const quotaFor = (q: Quota, d: Date): Record<Track, number> => (isWeekend(d) ? { L: q.wL, S: q.wS, C: q.wC } : { L: q.L, S: q.S, C: q.C });
export const PLACEMENT = new Date(2027, 4, 1);
export const START = new Date(2026, 9, 24); // plan starts Sat 24 Oct 2026
export const REV = [3, 7, 21];
export const TRACK: Record<Track, string> = { L: "LeetCode", S: "SQL", C: "Codeforces" };
export const HOW: Record<How, string> = { s: "Solo", h: "Hint", e: "Editorial" };
export const PHASES = [
  { n: 1, name: "Unseen Mediums", short: "to Dec 27", when: "24 Oct to 27 Dec 2026", points: ["3 new Mediums a day on the most-asked OA topics: arrays, strings, hashing, two pointers, sliding window, binary search, graphs, trees, heaps.", "Hide topic tags and work out the pattern yourself.", "1 SQL problem on weekdays and 2 on weekends, from the SQL 50 list."] },
  { n: 2, name: "Medium to Hard", short: "to Feb 28", when: "28 Dec 2026 to 28 Feb 2027", points: ["Timed Mediums plus one Hard every few days.", "Company-tagged sets and light DP (1D, knapsack, grids).", "2 Codeforces problems each weekend day at 1200 to 1500 rating."] },
  { n: 3, name: "OA simulation", short: "to Apr 15", when: "1 Mar to 15 Apr 2027", points: ["2 to 3 problems in 90 minutes, twice a week, like a real OA.", "LeetCode weekly contests and upsolving.", "Harder SQL: window functions and joins."] },
  { n: 4, name: "Revision", short: "to May 1", when: "16 Apr to 1 May 2027", points: ["Re-solve every problem you marked Hint or Editorial.", "Read your one-line insights daily.", "Light new practice only, to stay sharp."] },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const diffDays = (a: Date, b: Date) => Math.round((parse(ymd(a)).getTime() - parse(ymd(b)).getTime()) / 864e5);
export const weekStart = (d: Date) => addDays(parse(ymd(d)), -((d.getDay() + 6) % 7)); // Monday
export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
export const url = (i: number) => (P[i][0] === "C" ? P[i][2] : "https://leetcode.com/problems/" + P[i][2] + "/");
export const title = (i: number) => (P[i][0] === "C" ? "Top unsolved problem, rating " + P[i][3].replace("CF ", "") : P[i][1]);
export const level = (i: number) => (P[i][0] === "C" ? "CF" : P[i][3]);

export function queue(s: State, track: Track) {
  const q: number[] = [];
  P.forEach((p, i) => { if (p[0] === track && !s.done[i]) q.push(i); });
  return q;
}
function doneOn(s: State, track: Track, from: string, to: string) {
  return Object.keys(s.done).map(Number)
    .filter((i) => P[i] && P[i][0] === track && s.done[i].d >= from && s.done[i].d <= to)
    .sort((a, b) => (s.done[a].t || 0) - (s.done[b].t || 0) || a - b);
}

export const TRACKS = ["L", "S", "C"] as const;

/** Today's slots per track = lowest-index problems among (done today + still undone), so extras never push a planned one out. */
export function todayPlan(s: State, now: Date) {
  const t = ymd(now), q = quotaFor(s.quota, now);
  const byTrack = {} as Record<Track, number[]>;
  for (const tr of TRACKS) byTrack[tr] = [...doneOn(s, tr, t, t), ...queue(s, tr).slice(0, q[tr])].sort((a, b) => a - b).slice(0, q[tr]);
  const main = TRACKS.flatMap((tr) => byTrack[tr]);
  const extraDone = Object.keys(s.done).map(Number).filter((i) => s.done[i].d === t && !main.includes(i));
  return { main, byTrack, extraDone, quota: q };
}

/**
 * Where each track's window sits today. `from`/`to` are 1-based positions in that track's list.
 * `behind` = planned since START up to yesterday minus solved before today; those problems are
 * the ones still sitting at the front of the window, so `carried` (capped at today's quota) rolled over.
 */
export function windowInfo(s: State, now: Date, tr: Track, ids: number[]) {
  const pos = (i: number) => P.slice(0, i + 1).filter((p) => p[0] === tr).length;
  const total = P.filter((p) => p[0] === tr).length;
  const t = ymd(now);
  let planned = 0;
  for (let d = new Date(START); ymd(d) < t; d = addDays(d, 1)) planned += quotaFor(s.quota, d)[tr];
  const solvedBefore = Object.keys(s.done).filter((i) => P[+i]?.[0] === tr && s.done[i].d < t).length;
  const behind = Math.max(0, planned - solvedBefore);
  return { from: ids.length ? pos(Math.min(...ids)) : 0, to: ids.length ? pos(Math.max(...ids)) : 0, total, behind, carried: Math.min(behind, ids.length) };
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

export function upcoming(s: State, now: Date, mainToday: number[]) {
  const qs = Object.fromEntries(TRACKS.map((tr) => [tr, queue(s, tr).filter((i) => !mainToday.includes(i))])) as Record<Track, number[]>;
  const days: { date: Date; items: number[] }[] = [];
  for (let k = 1; k <= 7; k++) {
    const d = addDays(now, k), q = quotaFor(s.quota, d);
    days.push({ date: d, items: TRACKS.flatMap((tr) => qs[tr].splice(0, q[tr])) });
  }
  return days;
}

/* ---------- analytics ---------- */
export function perDay(s: State) {
  const m = new Map<string, number>();
  for (const v of Object.values(s.done)) m.set(v.d, (m.get(v.d) || 0) + 1);
  return m;
}

export function streak(s: State, now: Date) {
  const days = perDay(s), t = ymd(now);
  let n = 0;
  for (let d = new Date(now); n <= 400; d = addDays(d, -1)) {
    const key = ymd(d);
    if (days.has(key)) n++; else if (key !== t) break;
  }
  return n;
}

export function bestStreak(s: State) {
  const keys = [...perDay(s).keys()].sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const k of keys) {
    run = prev && diffDays(parse(k), parse(prev)) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = k;
  }
  return best;
}

export function trackTotals(s: State) {
  return (["L", "S", "C"] as const).map((tr) => ({
    tr, name: TRACK[tr],
    total: P.filter((p) => p[0] === tr).length,
    done: Object.keys(s.done).filter((i) => P[+i] && P[+i][0] === tr).length,
  }));
}

export function byLevel(s: State) {
  const out = { Easy: 0, Medium: 0, Hard: 0 };
  for (const k of Object.keys(s.done)) { const p = P[+k]; if (p && p[0] !== "C" && p[3] in out) out[p[3] as keyof typeof out]++; }
  return out;
}

export function byHow(s: State) {
  const out = { s: 0, h: 0, e: 0 };
  for (const v of Object.values(s.done)) out[v.h || "s"]++;
  return out;
}

export function topics(s: State, limit = 12) {
  const m = new Map<string, { total: number; done: number }>();
  P.forEach((p, i) => {
    if (p[0] !== "L") return;
    for (const tag of p[5].split(", ")) {
      const e = m.get(tag) || { total: 0, done: 0 };
      e.total++; if (s.done[i]) e.done++;
      m.set(tag, e);
    }
  });
  return [...m.entries()].map(([tag, v]) => ({ tag, ...v })).sort((a, b) => b.total - a.total).slice(0, limit);
}

/** Cumulative solved per day from the plan start, plus the straight-line pace that finishes every problem by placements. */
export function pace(s: State, now: Date) {
  const days = perDay(s);
  const first = [...days.keys()].sort()[0];
  const start = first && parse(first) < START ? parse(first) : START;
  const rows: { date: string; label: string; solved: number | null; target: number }[] = [];
  let sum = 0;
  for (let d = new Date(start); d <= PLACEMENT; d = addDays(d, 1)) {
    const key = ymd(d);
    sum += days.get(key) || 0;
    rows.push({
      date: key,
      label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      solved: d <= now ? sum : null,
      target: Math.max(0, Math.round((P.length * diffDays(d, START)) / Math.max(1, diffDays(PLACEMENT, START)))),
    });
  }
  return rows;
}
