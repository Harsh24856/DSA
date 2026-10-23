import { test } from "node:test";
import assert from "node:assert/strict";
import { P } from "./problems.ts";
import { emptyState, parse, queue, type State } from "./schedule.ts";
import { bestStreak, difficultyMix, heatmap, helpMix, journey, level, pace, topicStats } from "./stats.ts";

const tickOn = (s: State, ids: number[], d: string, h: "s" | "h" | "e" = "s"): State =>
  ({ ...s, done: { ...s.done, ...Object.fromEntries(ids.map(i => [i, { d, h, r: 0 }])) } });
const L = queue(emptyState(), "L"), S = queue(emptyState(), "S");

test("heatmap levels compare each day with its own minimum", () => {
  assert.deepEqual([level(0, 3), level(1, 3), level(2, 3), level(3, 3), level(5, 3)], [0, 1, 2, 3, 4]);
  const s = tickOn(emptyState(), L.slice(0, 3), "2026-10-31"); // Saturday, goal 5
  const grid = heatmap(s, parse("2026-11-01"), parse("2026-10-07"), 4); // weeks of 5, 12, 19, 26 Oct
  assert.equal(grid.length, 4);
  assert.ok(grid.every(w => w.length === 7));
  const sat = grid[3][5];
  assert.equal(sat.key, "2026-10-31");
  assert.deepEqual([sat.count, sat.goal, sat.level], [3, 5, 2]);
  assert.equal(grid[3][6].future, false);
  assert.equal(grid[0][0].key, "2026-10-05");
});

test("the journey runs from the first week of practice to placement week", () => {
  const j = journey(emptyState(), parse("2026-10-27"));
  assert.equal(j.start.getTime(), parse("2026-10-26").getTime());
  assert.equal(j.current, 0);
  assert.equal(j.total, 27); // 26 Oct 2026 .. week of 1 May 2027 (Mon 26 Apr)
  const early = journey(tickOn(emptyState(), [L[0]], "2026-10-08"), parse("2026-10-27"));
  assert.equal(early.current, 3);
});

test("pace counts DSA + SQL against the plan, from Phase 1 start", () => {
  // Mon 26 Oct: 3 solved (goal 3). Tue: 1 solved (goal 3).
  let s = tickOn(emptyState(), [...L.slice(0, 2), S[0]], "2026-10-26");
  s = tickOn(s, [L[2]], "2026-10-27");
  const p = pace(s, parse("2026-10-27"));
  assert.equal(p.points[0].key, "2026-10-26");
  assert.equal(p.points.length, 14, "at least two weeks wide");
  assert.deepEqual([p.actual, p.plan, p.diff, p.onlyToday], [4, 6, -2, true]);
  assert.equal(pace(s, parse("2026-10-28")).onlyToday, false, "Tuesday's miss counts once Wednesday starts");
  assert.equal(p.points[2].actual, null, "no actual line in the future");
  assert.equal(p.points[5].plan, 3 * 5 + 5, "Sat 31 Oct adds the weekend minimum");
});

test("pace starts on the first solve when it is before Phase 1", () => {
  const s = tickOn(emptyState(), [L[0]], "2026-10-23");
  const p = pace(s, parse("2026-10-23"));
  assert.equal(p.points[0].key, "2026-10-23");
  assert.deepEqual([p.actual, p.plan], [1, 3]);
});

test("pace ignores Codeforces", () => {
  const cf = P.findIndex(p => p[0] === "C");
  const p = pace(tickOn(emptyState(), [cf], "2026-10-26"), parse("2026-10-26"));
  assert.equal(p.actual, 0);
});

test("help mix, difficulty and topics", () => {
  let s = tickOn(emptyState(), [L[0], L[1]], "2026-10-26");
  s = tickOn(s, [L[2]], "2026-10-26", "h");
  s = tickOn(s, [S[0]], "2026-10-26", "e");
  assert.deepEqual(helpMix(s), { s: 2, h: 1, e: 1 });
  const d = difficultyMix(s);
  assert.equal(d.Medium.done + d.Easy.done + d.Hard.done, 4);
  assert.equal(d.Medium.total + d.Easy.total + d.Hard.total, P.filter(p => ["Easy", "Medium", "Hard"].includes(p[3])).length);
  const topics = topicStats(s);
  const tagged = (t: string) => [L[0], L[1], L[2]].filter(i => P[i][5].split(", ").includes(t)).length;
  for (const t of topics) assert.equal(t.solved, tagged(t.topic));
  assert.ok(topics.every((t, k) => k === 0 || topics[k - 1].solved >= t.solved), "most practised first");
});

test("best streak finds the longest run of consecutive days", () => {
  let s = emptyState();
  for (const [k, d] of ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-25", "2026-10-26"].entries()) s = tickOn(s, [L[k]], d);
  assert.equal(bestStreak(s), 3);
  assert.equal(bestStreak(emptyState()), 0);
});
