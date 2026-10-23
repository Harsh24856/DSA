import { test } from "node:test";
import assert from "node:assert/strict";
import { P } from "./problems.ts";
import { carriedFrom, emptyState, markSeen, normalize, parse, queue, todayPlan, upcoming, weekDays, type State } from "./schedule.ts";

// 2026-10-26 is a Monday, 2026-10-30 a Friday, 2026-10-31 a Saturday.
const MON = parse("2026-10-26"), TUE = parse("2026-10-27"), FRI = parse("2026-10-30"), SAT = parse("2026-10-31"), SUN = parse("2026-11-01");
const tick = (s: State, ids: number[], d: string): State =>
  ({ ...s, done: { ...s.done, ...Object.fromEntries(ids.map((i, k) => [i, { d, h: "s" as const, r: 0, t: k }])) } });
const L = (s: State) => queue(s, "L"), S = (s: State) => queue(s, "S");

test("weekday minimum is 2 DSA + 1 SQL, no Codeforces", () => {
  const p = todayPlan(emptyState(), MON);
  assert.equal(p.groups.L.length, 2);
  assert.equal(p.groups.S.length, 1);
  assert.equal(p.groups.C.length, 0);
  assert.equal(p.main.length, 3);
});

test("weekend minimum is 3 DSA + 2 SQL, plus the weekly Codeforces goal", () => {
  for (const day of [SAT, SUN]) {
    const p = todayPlan(emptyState(), day);
    assert.equal(p.groups.L.length, 3);
    assert.equal(p.groups.S.length, 2);
    assert.equal(p.groups.L.length + p.groups.S.length, 5);
  }
  assert.equal(todayPlan(emptyState(), SAT).groups.C.length, 2);
});

test("problems not done come back the next day", () => {
  const s = emptyState();
  const mon = todayPlan(s, MON), tue = todayPlan(s, TUE);
  assert.deepEqual(tue.groups.L, mon.groups.L);
  assert.deepEqual(tue.groups.S, mon.groups.S);
});

test("a partly done day carries only the missed problem, topped up to the minimum", () => {
  const mon = todayPlan(emptyState(), MON);
  const [a, b] = mon.groups.L;
  const s = tick(emptyState(), [a], "2026-10-26");
  const tue = todayPlan(s, TUE);
  assert.equal(tue.groups.L.length, 2);
  assert.equal(tue.groups.L[0], b, "missed problem is first");
  assert.ok(!tue.groups.L.includes(a));
});

test("solving extra keeps the next day at the full minimum with new problems", () => {
  const s0 = emptyState();
  const extra = L(s0).slice(0, 4), sql = S(s0).slice(0, 2);
  const s = tick(s0, [...extra, ...sql], "2026-10-26");
  const mon = todayPlan(s, MON);
  assert.deepEqual(mon.groups.L, extra.slice(0, 2), "today's list keeps its planned slots");
  assert.deepEqual(mon.extraDone.sort((x, y) => x - y), [extra[2], extra[3], sql[1]].sort((x, y) => x - y));
  const tue = todayPlan(s, TUE);
  assert.equal(tue.groups.L.length, 2);
  assert.equal(tue.groups.S.length, 1);
  assert.deepEqual(tue.groups.L, L(s).slice(0, 2));
  assert.ok(tue.groups.L.every(i => !s.done[i]), "only unsolved problems");
});

test("ticking during the day doesn't reshuffle today's list", () => {
  const before = todayPlan(emptyState(), MON);
  const after = todayPlan(tick(emptyState(), [before.groups.L[1]], "2026-10-26"), MON);
  assert.deepEqual(after.main, before.main);
});

test("Friday misses roll into the weekend list", () => {
  const fri = todayPlan(emptyState(), FRI);
  const sat = todayPlan(emptyState(), SAT);
  assert.deepEqual(sat.groups.L.slice(0, 2), fri.groups.L);
  assert.equal(sat.groups.L.length, 3);
});

test("old saves without weekend quota get the 3 + 2 default", () => {
  const s = normalize({ done: { 0: { d: "2026-10-20" } }, quota: { L: 2, S: 1, C: 2 } });
  assert.deepEqual(s.quota, { L: 2, S: 1, wL: 3, wS: 2, C: 2 });
  assert.deepEqual(s.seen, {});
  assert.deepEqual(normalize(null).quota, { L: 2, S: 1, wL: 3, wS: 2, C: 2 });
  assert.equal(normalize({ quota: { L: 99 } }).quota.L, 10);
});

test("a missed problem remembers the day it first appeared", () => {
  const mon = todayPlan(emptyState(), MON);
  const s = markSeen(emptyState(), mon.main, "2026-10-26");
  assert.equal(markSeen(s, mon.main, "2026-10-27"), s, "no change when already seen");
  assert.equal(carriedFrom(s, mon.main[0], "2026-10-27"), "2026-10-26");
  assert.equal(carriedFrom(s, mon.main[0], "2026-10-26"), null, "not carried on its own day");
  assert.equal(carriedFrom(tick(s, [mon.main[0]], "2026-10-27"), mon.main[0], "2026-10-27"), null);
});

test("coming up uses each day's own minimum", () => {
  const s = emptyState();
  const days = upcoming(s, FRI, todayPlan(s, FRI));
  const counts = days.map(d => d.items.filter(i => P[i][0] !== "C").length);
  assert.deepEqual(counts, [5, 5, 3, 3, 3, 3, 3]); // Sat, Sun, Mon..Thu
  assert.equal(days[0].items.filter(i => P[i][0] === "C").length, 2);
});

test("week strip goals are 3 on weekdays and 5 on weekends", () => {
  const w = weekDays(emptyState(), MON);
  assert.deepEqual(w.map(d => d.goal), [3, 3, 3, 3, 3, 5, 5]);
});
