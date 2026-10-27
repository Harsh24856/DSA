// Run: npm run check. Asserts the rolling-window schedule.
import assert from "node:assert";
import { diffDays, normQuota, pace, phases, todayPlan, upcoming, windowInfo, ymd, type State } from "./logic.ts";

const FRI = new Date(2026, 9, 23), SAT = new Date(2026, 9, 24), SUN = new Date(2026, 9, 25), MON = new Date(2026, 9, 26), TUE = new Date(2026, 9, 27);
const fresh = (): State => ({ done: {}, quota: normQuota() });
const tick = (s: State, ids: number[], d: Date) => { for (const i of ids) s.done[i] = { d: ymd(d), h: "s", r: 0, t: i }; };
const sizes = (s: State, d: Date) => { const p = todayPlan(s, d).byTrack; return [p.L.length, p.S.length, p.C.length]; };

// quotas: weekday 3+1+0, weekend 3+2+2; old and half-migrated saves reset
assert.deepEqual(sizes(fresh(), FRI), [3, 1, 0]);
assert.deepEqual(sizes(fresh(), SAT), [3, 2, 2]);
assert.deepEqual(sizes(fresh(), SUN), [3, 2, 2]);
assert.equal(normQuota({ L: 2, S: 1, C: 2, wL: 3, wS: 2, wC: 2 }).C, 0);

// 1. Solve the whole window: tomorrow's window slides to the next problems.
let s = fresh();
const satL = todayPlan(s, SAT).byTrack.L;
tick(s, satL, SAT);
const sunL = todayPlan(s, SUN).byTrack.L;
assert.equal(sunL.length, 3);
assert.ok(Math.min(...sunL) > Math.max(...satL), "window moves past solved problems");
assert.equal(windowInfo(s, SUN, "L", sunL).carried, 0);

// 2. Miss a day: the same problems stay at the front, the load does not double.
s = fresh();
const missed = todayPlan(s, SAT).byTrack.L;
assert.deepEqual(todayPlan(s, SUN).byTrack.L, missed, "missed problems roll over");
assert.equal(todayPlan(s, SUN).byTrack.L.length, 3, "no pile-up");
assert.equal(windowInfo(s, SUN, "L", missed).carried, 3);
assert.equal(windowInfo(s, MON, "L", missed).behind, 6, "two missed days = 6 behind");

// 3. Partial day: unsolved ones carry, the window fills from the next problems.
s = fresh();
const [a, b, c] = todayPlan(s, SAT).byTrack.L;
tick(s, [a], SAT);
const next = todayPlan(s, SUN).byTrack.L;
assert.deepEqual(next.slice(0, 2), [b, c], "unsolved stay first");
assert.equal(windowInfo(s, SUN, "L", next).carried, 2);

// 4. Extras pull the window ahead, and today's planned slots never move.
s = fresh();
const plan = todayPlan(s, MON).byTrack.L;
const extra = upcoming(s, MON, todayPlan(s, MON).main)[0].items.find((i) => i > Math.max(...plan))!;
tick(s, [...plan, extra], MON);
assert.deepEqual(todayPlan(s, MON).byTrack.L, plan, "today's slots stay put");
assert.deepEqual(todayPlan(s, MON).extraDone, [extra]);
assert.ok(!todayPlan(s, TUE).byTrack.L.includes(extra), "tomorrow skips the extra");

// 5. Unticking an old problem puts it back at the front of the window.
s = fresh();
tick(s, todayPlan(s, SAT).byTrack.L, SAT);
const first = Math.min(...Object.keys(s.done).map(Number));
delete s.done[first];
assert.equal(todayPlan(s, SUN).byTrack.L[0], first);

// 6. Codeforces only on weekends, SQL 1 on weekdays.
s = fresh();
assert.equal(upcoming(s, FRI, todayPlan(s, FRI).main).find((d) => d.date.getDay() === 2)!.items.length, 4);

// 7. Personal dates: old v2 saves get the original plan; a later start counts "behind" from that day.
assert.deepEqual([normQuota({ L: 3, S: 1, C: 0, wL: 3, wS: 2, wC: 2, v: 2 } as never).start, normQuota().placement], ["2026-10-24", "2027-05-01"]);
assert.equal(normQuota({ ...normQuota(), start: "2027-06-01" }).start, "2026-10-24", "start after placement is rejected");
assert.equal(normQuota({ ...normQuota(), placement: "" }).placement, "2027-05-01", "cleared date is rejected");
assert.equal(normQuota({ ...normQuota(), start: "0002-10-24" }).start, "2026-10-24", "half-typed year is rejected");
s = { done: {}, quota: normQuota({ ...normQuota(), start: "2026-10-26" }) };
assert.equal(windowInfo(s, MON, "L", todayPlan(s, MON).byTrack.L).behind, 0, "nothing planned before a custom start");
assert.equal(windowInfo(s, TUE, "L", todayPlan(s, TUE).byTrack.L).behind, 3, "one missed weekday = 3 behind");
assert.equal(pace(s, MON)[0].date, "2026-10-26");

// 8. Phases: the default dates reproduce the original plan, custom dates scale.
assert.deepEqual(phases(normQuota()).map((p) => [ymd(p.from), ymd(p.to)]), [
  ["2026-10-24", "2026-12-27"], ["2026-12-28", "2027-02-28"], ["2027-03-01", "2027-04-15"], ["2027-04-16", "2027-05-01"],
]);
const half = phases(normQuota({ ...normQuota(), start: "2027-01-01", placement: "2027-04-10" })); // 99 days
assert.equal(ymd(half[0].from), "2027-01-01");
assert.equal(ymd(half[3].to), "2027-04-10");
assert.ok(half.every((p, k) => p.from <= p.to && (!k || diffDays(p.from, half[k - 1].to) === 1)), "phases are contiguous");

console.log("logic checks pass");
