// Imported by other.check.ts: the simulators behind the chapter labs added with one-chapter-per-page, checked
// against textbook results (and SQLite for NULL logic).
import assert from "node:assert";
import { DatabaseSync } from "node:sqlite";
import { clockAngle, diskSchedule, downtimeMinutes, estimate, human, inParallel, inSeries, quorum, rerenders, triAnd, triEq, triNot, triOr, weekday, type Tri } from "./sim.ts";

// disk scheduling: the standard queue, head at 53, cylinders 0 to 199
export const DISK = [98, 183, 37, 122, 14, 124, 65, 67];
const mv = (a: Parameters<typeof diskSchedule>[2], up = true) => diskSchedule(DISK, 53, a, 200, up).moved;
assert.equal(mv("fcfs"), 640);
assert.equal(mv("sstf"), 236);
assert.equal(mv("scan", false), 236);
assert.equal(mv("scan"), 331);
assert.equal(mv("cscan"), 382);
assert.equal(mv("look"), 299);
assert.equal(mv("clook"), 322);
for (const a of ["fcfs", "sstf", "scan", "cscan", "look", "clook"] as const) for (const up of [true, false]) {
  const p = diskSchedule(DISK, 53, a, 200, up).path;
  assert.deepEqual([...new Set(p.filter((x) => DISK.includes(x)))].sort(), [...DISK].sort(), `${a}: serves every request once`);
}

// three-valued logic: every combination against SQLite
{
  const db = new DatabaseSync(":memory:");
  const lit = (v: Tri) => (v === "NULL" ? "NULL" : v === "TRUE" ? "1" : "0");
  const sq = (e: string): Tri => { const r = (db.prepare(`SELECT ${e} AS v`).get() as { v: number | null }).v; return r === null ? "NULL" : r ? "TRUE" : "FALSE"; };
  const V: Tri[] = ["TRUE", "FALSE", "NULL"];
  for (const a of V) {
    assert.equal(triNot(a), sq(`NOT ${lit(a)}`), `NOT ${a}`);
    for (const b of V) {
      assert.equal(triAnd(a, b), sq(`${lit(a)} AND ${lit(b)}`), `${a} AND ${b}`);
      assert.equal(triOr(a, b), sq(`${lit(a)} OR ${lit(b)}`), `${a} OR ${b}`);
    }
  }
  for (const [x, y] of [[1, 1], [1, 2], [null, 1], [null, null]] as const) assert.equal(triEq(x, y), sq(`${x ?? "NULL"} = ${y ?? "NULL"}`), `${x} = ${y}`);
}

// quorums
assert.ok(quorum(3, 2, 2).strong && quorum(3, 2, 2).writeSurvives === 1);
assert.ok(!quorum(3, 1, 1).strong && quorum(3, 1, 3).strong && quorum(5, 3, 3).overlap === 1);

// estimates: 1 M writes a day is about 12 a second
assert.equal(Math.round(estimate(1e6, 1, 0, 100).writeQps), 12);
assert.equal(estimate(1e8, 2, 20, 1000).storagePerYear, 1e8 * 2 * 1000 * 365);
assert.equal(human(73e12, "B"), "73 TB"); assert.equal(human(11574), "12 K"); assert.equal(human(2.5e6), "2.5 M");

// availability: two 99.9% parts in series, two 99% copies in parallel, and three nines of downtime
assert.equal(+inSeries([0.999, 0.999]).toFixed(6), 0.998001);
assert.equal(+inParallel(0.99, 2).toFixed(6), 0.9999);
assert.equal(Math.round(downtimeMinutes(0.999)), 526);

// React re-renders
export const RTREE = [{ id: "App" }, { id: "Header", parent: "App" }, { id: "List", parent: "App", memo: true }, { id: "Item", parent: "List", reads: true }, { id: "Footer", parent: "App" }];
assert.deepEqual(rerenders(RTREE, "App"), ["App", "Header", "Footer"]);
assert.deepEqual(rerenders(RTREE, "List"), ["List", "Item"]);
assert.deepEqual(rerenders(RTREE, null, true), ["Item"]);

// clocks and calendars
assert.equal(clockAngle(3, 15), 7.5); assert.equal(clockAngle(9, 0), 90); assert.equal(clockAngle(12, 30), 165);
assert.equal(weekday(101, 1, 1).oddYears, 5); assert.equal(weekday(201, 1, 1).oddYears, 3); assert.equal(weekday(401, 1, 1).oddYears, 0);
for (const [y, m, d] of [[2026, 11, 6], [2000, 2, 29], [1947, 8, 15], [2027, 5, 1]]) assert.equal(weekday(y, m, d).day, new Date(Date.UTC(y, m - 1, d)).getUTCDay(), `${y}-${m}-${d}`);

console.log("chapter lab simulators ok");
