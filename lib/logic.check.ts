// Run: npm run check. Asserts the rolling-window schedule.
import assert from "node:assert";
import { afterRevisit, diffDays, mockPick, normQuota, pace, parse, phases, revisitsDue, TAG_TOPIC, todayPlan, upcoming, weakTopics, windowInfo, ymd, type State } from "./logic.ts";
import { P } from "./problems.ts";
import { clock, drillRound, hasPuzzle, mockLeft, nextStepOptions, patternOptions, puzzleLines, puzzleRight, puzzleSolved, puzzleTiles } from "./practice.ts";

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

// 9. Revisits: hint gaps from the solve date, solo once at +21, needing help restarts the gaps from today.
s = fresh();
s.done[0] = { d: "2026-11-01", h: "h", r: 0 };
s.done[1] = { d: "2026-11-01", h: "s", r: 0 };
const on = (d: string) => revisitsDue(s, parse(d)).map((x) => x.i);
assert.deepEqual(on("2026-11-03"), [], "nothing due early");
assert.deepEqual(on("2026-11-04"), [0], "hint due at +3");
assert.deepEqual(on("2026-11-22"), [0, 1], "solo due at +21");
s.done[1] = afterRevisit(s.done[1], true, "2026-11-22");
assert.deepEqual(on("2027-03-01"), [0], "solo comes back only once");
s.done[0] = afterRevisit(s.done[0], true, "2026-11-04");
assert.deepEqual(on("2026-11-07"), [], "solved moves to +7 from the solve date");
assert.deepEqual(on("2026-11-08"), [0]);
s.done[0] = afterRevisit(s.done[0], false, "2026-11-08");
assert.deepEqual([s.done[0].r, s.done[0].b], [0, "2026-11-08"]);
assert.deepEqual(on("2026-11-10"), [], "needing help restarts the gap");
assert.deepEqual(on("2026-11-11"), [0]);
s.done[1] = { d: "2026-11-01", h: "s", r: 0 };
s.done[1] = afterRevisit(s.done[1], false, "2026-11-22");
assert.deepEqual([s.done[1].h, on("2026-11-25")], ["h", [0, 1]], "a failed solo becomes a hint, due at +3");
s.done[1] = { d: "2026-11-01", h: "e", r: 2 };
assert.equal(afterRevisit(s.done[1], false, "2026-11-22").h, "e", "Editorial stays Editorial");

// 10. Weak spots: lowest solo rate first, at least 3 solves, every plan tag links to a real topic.
s = fresh();
const rows = (tag: string, not: string) => P.flatMap((p, i) => { const t = p[5].split(", "); return p[0] === "L" && t.includes(tag) && !t.includes(not) ? [i] : []; });
rows("Tree", "Greedy").slice(0, 3).forEach((i) => { s.done[i] = { d: "2026-11-01", h: "h" }; });
rows("Greedy", "Tree").slice(0, 4).forEach((i, k) => { s.done[i] = { d: "2026-11-01", h: k ? "s" : "e" }; });
rows("Trie", "Tree").slice(0, 1).forEach((i) => { s.done[i] = { d: "2026-11-01", h: "h" }; });
const weak = weakTopics(s, 3, 50);
assert.deepEqual(weak.find((w) => w.tag === "Tree")?.rate, 0);
assert.deepEqual(weak.find((w) => w.tag === "Greedy")?.solo, 3);
assert.ok(weak.every((w, k) => !k || weak[k - 1].rate <= w.rate), "weakest first");
assert.ok(!weak.some((w) => w.tag === "Trie"), "under 3 solves is not judged");
const TOPIC_IDS = ["array", "string", "linkedlist", "stack", "heap", "intervals", "binary-tree", "trie", "graph", "recursion-backtracking", "dp", "greedy", "bit-and-math", "logic-to-code"];
for (const p of P) if (p[0] === "L") for (const tag of p[5].split(", ")) assert.ok(TOPIC_IDS.includes(TAG_TOPIC[tag]), `tag ${tag} has no topic`);

// 11. Practice helpers, on a fixed random stream.
const stream = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const QP = (key: string, name: string, topic: string) => ({ key, name, topic, signals: [`signal of ${name}`] });
const ALL = [QP("a:1", "Sliding window", "a"), QP("a:2", "Prefix sum", "a"), QP("b:1", "Sliding window", "b"), QP("b:2", "KMP", "b"), QP("c:1", "BFS", "c"), QP("c:2", "DFS", "c"), QP("d:1", "Heap", "d"), QP("d:2", "Tries", "d"), QP("e:1", "Greedy", "e"), QP("e:2", "Knapsack", "e")];
const opts = patternOptions(ALL[0], ALL, ["BFS"], 4, stream());
assert.equal(opts.length, 4);
assert.equal(new Set(opts).size, 4, "no repeated names, even across topics");
assert.equal(opts.filter((o) => o === "Sliding window").length, 1, "the right name is there once");
assert.ok(!opts.includes("BFS"), "a name that would also be right is left out");
const POOL = ALL.flatMap((p) => [0, 1, 2].map((k) => ({ slug: `${p.key}-${k}`, title: `Problem ${p.key} ${k}`, key: p.key, also: [] })));
const round = drillRound(POOL, ALL, new Set(["e:2-1"]), 10, stream(7));
assert.equal(round.length, 10);
assert.ok(round.some((q) => q.kind === "signal") && round.some((q) => q.kind === "title"), "both kinds of question");
assert.ok(round.some((q) => q.slug === "e:2-1"), "a missed problem comes back");
assert.ok(round.every((q) => q.options.includes(q.answer.name) && q.options.length === 4));
const count = new Map<string, number>(); round.forEach((q) => count.set(q.answer.topic, (count.get(q.answer.topic) || 0) + 1));
assert.ok([...count.values()].every((c) => c <= 2), "topics are mixed");

const notes = ["a", "b", "c", "d", "e", "f"];
const nx = nextStepOptions(notes, 1, stream())!;
assert.equal(nx.answer, "c");
assert.equal(nx.options.length, 3);
assert.ok(nx.options.includes("c") && !nx.options.includes("b"), "never offers the step on screen");
assert.deepEqual([...new Set(nextStepOptions(notes, 4, stream())!.options)].length, 3, "the last step falls back to earlier notes");
assert.equal(nextStepOptions(notes, 5), null, "nothing after the last step");
assert.equal(nextStepOptions(["a", "b", "a", "b"], 0), null, "too few different notes");

const code = "def f(a):\n    # note\n    out = []\n\n    for x in a:\n        out.append(x)\n        out.append(x)\n    return out";
assert.deepEqual(puzzleLines(code), ["def f(a):", "    out = []", "    for x in a:", "        out.append(x)", "        out.append(x)", "    return out"]);
assert.ok(hasPuzzle(code) && !hasPuzzle("a\nb"), "only at a useful size");
assert.ok(!puzzleSolved(code, puzzleTiles(code, stream())), "tiles start out of order");
assert.ok(puzzleSolved(code, puzzleLines(code)));
assert.equal(puzzleRight(code, ["def f(a):", "    out = []", "    return out"]), 2);

s = fresh();
const mock = mockPick(s, todayPlan(s, MON).main, 3, 60, stream(3));
assert.equal(new Set(mock).size, 3);
assert.ok(mock.every((i) => P[i][0] === "L" && !s.done[i] && !todayPlan(s, MON).main.includes(i)));
assert.deepEqual([clock(mockLeft(0, 0)), clock(mockLeft(0, 90 * 60000 + 5)), clock(1)], ["90:00", "0:00", "0:01"]);

console.log("logic checks pass");
