// Numbers behind the Stats tab. Pure functions of the saved state, tested in stats.test.ts.
import { P } from "./problems.ts";
import { addDays, diffDays, parse, PLACEMENT, quotaFor, weekStart, ymd, type State } from "./schedule.ts";

export const PLAN_START = "2026-10-26"; // Phase 1 starts here (see the roadmap)

const isMain = (i: number) => P[i] && P[i][0] !== "C"; // DSA + SQL; Codeforces is a separate weekly goal
const dayGoal = (s: State, d: Date) => quotaFor(s.quota, d, "L") + quotaFor(s.quota, d, "S");

export function dailyCounts(s: State, mainOnly = false) {
  const m = new Map<string, number>();
  for (const [k, v] of Object.entries(s.done)) {
    if (!P[+k] || (mainOnly && !isMain(+k))) continue;
    m.set(v.d, (m.get(v.d) || 0) + 1);
  }
  return m;
}

// 0 nothing, 1 started (< half), 2 more than half, 3 minimum met, 4 half again over the minimum
export function level(count: number, goal: number) {
  if (!count) return 0;
  if (!goal) return 3;
  const r = count / goal;
  return r >= 1.5 ? 4 : r >= 1 ? 3 : r >= 0.5 ? 2 : 1;
}

export type Cell = { key: string; date: Date; count: number; goal: number; level: number; future: boolean };

// The whole run as weeks: from the week of the first solve (or Phase 1 start) to placement week.
export function journey(s: State, now: Date) {
  const firstDone = [...dailyCounts(s, true).keys()].sort()[0];
  const start = weekStart(parse([firstDone, PLAN_START, ymd(now)].filter(Boolean).sort()[0] as string));
  const total = Math.max(1, Math.round(diffDays(weekStart(PLACEMENT), start) / 7) + 1);
  return { start, total, current: Math.round(diffDays(weekStart(now), start) / 7) };
}

// `weeks` columns, Monday to Sunday, starting with the week of `from`.
export function heatmap(s: State, now: Date, from: Date, weeks: number): Cell[][] {
  const counts = dailyCounts(s, true), t = ymd(now), first = weekStart(from);
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const date = addDays(first, w * 7 + d), key = ymd(date), count = counts.get(key) || 0, goal = dayGoal(s, date);
    return { key, date, count, goal, level: level(count, goal), future: key > t };
  }));
}

export type PacePoint = { key: string; date: Date; actual: number | null; plan: number };

// Cumulative DSA + SQL solved against the cumulative daily minimum. The plan starts on the first
// day of practice (or the Phase 1 start), and runs at least two weeks so a new start still has a shape.
export function pace(s: State, now: Date) {
  const t = ymd(now), counts = dailyCounts(s, true);
  const firstDone = [...counts.keys()].sort()[0];
  let start = [firstDone, PLAN_START, t].filter(Boolean).sort()[0] as string;
  if (!firstDone && t >= PLAN_START) start = PLAN_START;
  const startDate = parse(start), days = Math.max(diffDays(now, startDate) + 1, 14);
  let actual = 0, plan = 0;
  const points: PacePoint[] = [];
  for (let k = 0; k < days; k++) {
    const date = addDays(startDate, k), key = ymd(date);
    plan += dayGoal(s, date);
    if (key <= t) actual += counts.get(key) || 0;
    points.push({ key, date, actual: key <= t ? actual : null, plan });
  }
  const today = points.find(p => p.key === t)!, actualToday = today.actual ?? 0;
  const planBefore = today.plan - dayGoal(s, now); // plan up to the end of yesterday
  return { points, actual: actualToday, plan: today.plan, diff: actualToday - today.plan, onlyToday: actualToday >= planBefore };
}

export function helpMix(s: State) {
  const m = { s: 0, h: 0, e: 0 };
  for (const [k, v] of Object.entries(s.done)) if (P[+k]) m[v.h === "h" || v.h === "e" ? v.h : "s"]++;
  return m;
}

export function difficultyMix(s: State) {
  const m: Record<"Easy" | "Medium" | "Hard", { done: number; total: number }> = {
    Easy: { done: 0, total: 0 }, Medium: { done: 0, total: 0 }, Hard: { done: 0, total: 0 },
  };
  P.forEach((p, i) => {
    const lv = p[3] as keyof typeof m;
    if (!m[lv]) return;
    m[lv].total++;
    if (s.done[i]) m[lv].done++;
  });
  return m;
}

// Topics of solved LeetCode problems, most practised first, with how many needed a hint or editorial.
export function topicStats(s: State, limit = 8) {
  const m = new Map<string, { solved: number; help: number }>();
  for (const [k, v] of Object.entries(s.done)) {
    const p = P[+k];
    if (!p || p[0] !== "L") continue;
    for (const topic of p[5].split(",").map(x => x.trim()).filter(Boolean)) {
      const e = m.get(topic) || { solved: 0, help: 0 };
      e.solved++;
      if (v.h === "h" || v.h === "e") e.help++;
      m.set(topic, e);
    }
  }
  return [...m].map(([topic, e]) => ({ topic, ...e }))
    .sort((a, b) => b.solved - a.solved || b.help - a.help || a.topic.localeCompare(b.topic)).slice(0, limit);
}

export function bestStreak(s: State) {
  const days = [...new Set(Object.values(s.done).map(v => v.d))].sort();
  let best = 0, run = 0, prev = "";
  for (const d of days) {
    run = prev && diffDays(parse(d), parse(prev)) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
