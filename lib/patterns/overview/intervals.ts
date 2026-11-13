// Overview of the "intervals" topic: the data structure or technique itself. Shown on /patterns/intervals before the patterns.
import type { Diagram, IntervalsFrame, Tone } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

type Iv = [number, number];
const fmt = (a: Iv) => `[${a[0]},${a[1]}]`;

function overlapViz(): Diagram {
  const A: Iv = [4, 9], others: Iv[] = [[1, 3], [2, 5], [5, 7], [9, 12], [10, 13], [3, 10]], items: Iv[] = [A, ...others], frames: IntervalsFrame[] = [];
  frames.push({ note: `A = ${fmt(A)}. Two closed intervals overlap exactly when the later start is not past the earlier end: max(start) <= min(end)`, tones: { 0: "active" } });
  others.forEach((b, k) => {
    const s = Math.max(A[0], b[0]), e = Math.min(A[1], b[1]), hit = s <= e;
    frames.push({ note: `${fmt(A)} vs ${fmt(b)}: max(${A[0]}, ${b[0]}) = ${s} ${hit ? "<=" : ">"} min(${A[1]}, ${b[1]}) = ${e}, so ${hit ? `they overlap on ${fmt([s, e])}${s === e ? ", a single point (with half-open [s, e) they would not)" : ""}${b[0] <= A[0] && b[1] >= A[1] ? `; ${fmt(b)} contains A` : ""}` : "they are apart"}`, tones: { 0: "active", [k + 1]: hit ? "found" : "bad" }, result: hit ? [[s, e]] : [] });
  });
  return { kind: "intervals", title: "Overlap test: max(start) <= min(end)", items, frames };
}

function sweepViz(input?: string): Diagram {
  const flat = nums(input, [1, 4, 2, 5, 4, 7, 6, 8, 3, 6, 9, 10], 16), items: Iv[] = [];
  for (let k = 0; k + 1 < flat.length; k += 2) items.push([Math.min(flat[k], flat[k + 1]), Math.max(flat[k], flat[k + 1])]);
  if (!items.length) items.push([1, 4], [2, 5]);
  // half-open [s, e): at equal times the -1 sorts first, so a meeting may start the moment another ends
  const ev = items.flatMap(([s, e], i) => [[s, 1, i], [e, -1, i]] as [number, number, number][]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const frames: IntervalsFrame[] = [], live = new Set<number>(); let cur = 0, best = 0, bestAt = 0;
  frames.push({ note: `${items.length} intervals become ${ev.length} events: +1 at each start, -1 at each end. Sort by time; at a tie the end comes first`, tones: {} });
  for (const [t, d, i] of ev) {
    cur += d; if (d > 0) live.add(i); else live.delete(i);
    if (cur > best) { best = cur; bestAt = t; }
    frames.push({ note: `t = ${t}: ${fmt(items[i])} ${d > 0 ? "starts, +1" : "ends, -1"}. Active now: ${cur}, most so far: ${best}`, line: t, tones: Object.fromEntries(items.map((_, j) => [j, (live.has(j) ? "active" : j === i ? (d > 0 ? "active" : "done") : "muted") as Tone])) });
  }
  frames.push({ note: `At most ${best} intervals overlap (first reached at t = ${bestAt}), so ${best} rooms are enough. With small integer times a difference array gives the same counts: diff[s] += 1, diff[e] -= 1, then a prefix sum`, line: bestAt, tones: {} });
  return { kind: "intervals", title: "Sweep line over start and end events", items, frames };
}

function insertViz(): Diagram {
  const list: Iv[] = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], add: Iv = [4, 8], items: Iv[] = [...list, add], frames: IntervalsFrame[] = [], out: Iv[] = [];
  const N = list.length, tones: Record<number, Tone> = { [N]: "active" };
  let [s, e] = add, i = 0;
  frames.push({ note: `Insert ${fmt(add)} into a sorted, disjoint list. Three phases: copy what ends before it, absorb what overlaps it, copy what starts after it`, tones: { ...tones } });
  while (i < N && list[i][1] < s) { out.push(list[i]); tones[i] = "done"; frames.push({ note: `Phase 1: ${fmt(list[i])} ends at ${list[i][1]} < ${s}, before the new interval starts. Copy it unchanged`, tones: { ...tones }, result: [...out] }); i++; }
  while (i < N && list[i][0] <= e) { const was: Iv = [s, e]; s = Math.min(s, list[i][0]); e = Math.max(e, list[i][1]); tones[i] = "found"; frames.push({ note: `Phase 2: ${fmt(list[i])} starts at ${list[i][0]} <= ${was[1]}, so it overlaps ${fmt(was)}. Absorb it: the new interval ${s === was[0] && e === was[1] ? "already covers it and stays" : "grows to"} ${fmt([s, e])}`, tones: { ...tones }, result: [...out, [s, e]] }); i++; }
  out.push([s, e]);
  frames.push({ note: `Nothing else starts by ${e}: write the merged ${fmt([s, e])}`, tones: { ...tones }, result: [...out] });
  while (i < N) { out.push(list[i]); tones[i] = "done"; frames.push({ note: `Phase 3: ${fmt(list[i])} starts at ${list[i][0]} > ${e}. Copy it and every one after it`, tones: { ...tones }, result: [...out] }); i++; }
  frames.push({ note: `Result [${out.map(fmt).join(", ")}]: still sorted and disjoint, in one O(n) pass`, tones: { ...tones }, result: [...out] });
  return { kind: "intervals", title: `Insert ${fmt(add)} into a sorted disjoint list`, items, frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "An **interval** is a pair `[start, end]` that stands for every point between the two. Interval problems are not about a special data structure: they are lists of pairs plus a few techniques that come back again and again, almost all of which begin by **sorting**.",
    "First pin down the ends. A **closed** interval `[s, e]` includes both ends, so `[1, 3]` and `[3, 5]` touch and usually merge. A **half-open** interval `[s, e)` includes the start but not the end, which is the natural model for time: a meeting from 9 to 10 and one from 10 to 11 do not clash and can share a room. Most bugs in interval code are a `<` that should be `<=`, and the cause is not deciding this up front.",
    "The **overlap test** for two intervals a and b is one line: they overlap when `max(a.start, b.start) <= min(a.end, b.end)` (use `<` for half-open). Equivalently, they are apart when one ends before the other starts. When they overlap, that same max and min are the start and end of their **intersection**. One interval **contains** another when it starts no later and ends no earlier.",
    "**Sort by start** when you are building something up from the left: merging, inserting, finding gaps, or assigning rooms. After that sort, any interval that overlaps the current block must start before the block ends, so a single pass with one running block does the job. **Sort by end** when you are choosing as many intervals as possible, or stabbing all of them with as few points as possible: the interval that finishes first leaves the most room for the rest, which is the classic greedy exchange argument.",
    "The **sweep line** turns each interval into two events, +1 at its start and -1 at its end, sorts all 2n events by time and walks them while keeping a running count. The count at any moment is how many intervals are open, so its maximum answers \"how many rooms\", \"most overlapping\" or \"busiest time\". Ties matter: with half-open intervals put the -1 first so a room frees before it is reused.",
    "When the coordinates are small integers, the sweep becomes a **difference array**: `diff[s] += 1`, `diff[e + 1] -= 1` (closed) for each interval, and a prefix sum over `diff` gives the exact count at every point in O(n + range). For online versions (bookings arriving one by one, or a set of disjoint ranges that grows and shrinks), keep the intervals in a sorted container keyed by start (`std::map`, `SortedList`) so each query looks only at its neighbours.",
  ],
  build: [
    "Represent an interval as a two-element list or a `pair<int, int>`. Sorting a list of pairs sorts by start, then by end, with no key function; sort by end with `key=lambda x: x[1]` or a comparator.",
    "**Merge**: sort by start and keep an output list whose last element is the open block. For each interval, if its start is at most the block's end, extend the block's end to the larger of the two ends; otherwise start a new block. Invariant: the output is sorted and disjoint, and only its last block can still grow.",
    "**Insert into a sorted disjoint list**: three loops. Copy every interval that ends before the new one starts. Absorb every interval that starts before the new one ends, widening the new interval each time. Write it, then copy the rest. No sort is needed, so it is O(n), and binary search can find phase 2 in O(log n) when you only need to report.",
    "**Count overlaps**: either the event sweep above, or sort by start and keep a min-heap of end times: before placing an interval, pop the earliest end if it is at most this start (that room is free again), then push this end. The heap size at the end, and its maximum along the way, is the number of rooms. The heap version also tells you which room frees first, which matters when rooms are numbered.",
    "**Select the most non-overlapping**: sort by end, keep `last = -infinity`, and take each interval whose start is at least `last`, setting `last` to its end. The number taken is the maximum; n minus it is the fewest to remove. The same loop with `>` for closed intervals counts the fewest arrows to burst balloons.",
    "**Two sorted lists**: walk both with two pointers, record the intersection of the current pair if any, then advance whichever interval ends first, since it cannot meet anything later in the other list. **Point queries** (how many intervals contain x): sort all starts and all ends separately; the answer is (starts <= x) minus (ends < x), two binary searches.",
  ],
  code: `import heapq
from bisect import bisect_left, bisect_right
from itertools import accumulate

# An interval is a pair [start, end]. Closed [s, e] unless a function says half-open [s, e).

def overlaps(a, b):                     # closed: touching ends count as overlap
    return max(a[0], b[0]) <= min(a[1], b[1])

def intersect(a, b):                    # the common part, or None
    s, e = max(a[0], b[0]), min(a[1], b[1])
    return [s, e] if s <= e else None

def merge(intervals):                   # O(n log n): sort by start, extend or start a new block
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out

def insert(disjoint, new):              # list sorted and disjoint; O(n), three phases
    out, i, n = [], 0, len(disjoint)
    s, e = new
    while i < n and disjoint[i][1] < s:          # 1. ends before the new one starts
        out.append(disjoint[i]); i += 1
    while i < n and disjoint[i][0] <= e:         # 2. overlaps: absorb it
        s, e = min(s, disjoint[i][0]), max(e, disjoint[i][1]); i += 1
    out.append([s, e])
    return out + disjoint[i:]                    # 3. starts after the new one ends

def max_overlap(intervals):             # half-open: most intervals active at once (meeting rooms)
    events = sorted([(s, 1) for s, _ in intervals] + [(e, -1) for _, e in intervals])
    cur = best = 0                      # (t, -1) sorts before (t, 1): a room frees before it is reused
    for _, d in events:
        cur += d
        best = max(best, cur)
    return best

def min_rooms_heap(intervals):          # half-open: same answer with a min-heap of end times
    ends = []
    for s, e in sorted(intervals):
        if ends and ends[0] <= s:
            heapq.heapreplace(ends, e)  # reuse the room that frees first
        else:
            heapq.heappush(ends, e)
    return len(ends)

def max_non_overlapping(intervals):     # half-open: sort by END, keep whatever fits
    count, last = 0, float("-inf")
    for s, e in sorted(intervals, key=lambda x: x[1]):
        if s >= last:
            count, last = count + 1, e
    return count

def intersect_lists(A, B):              # two sorted disjoint lists, O(n + m)
    i = j = 0
    out = []
    while i < len(A) and j < len(B):
        part = intersect(A[i], B[j])
        if part:
            out.append(part)
        if A[i][1] < B[j][1]:           # the one that ends first cannot meet anything later
            i += 1
        else:
            j += 1
    return out

def coverage(intervals, size):          # closed, integer points 0..size-1: difference array
    diff = [0] * (size + 1)
    for s, e in intervals:
        diff[s] += 1
        diff[e + 1] -= 1
    return list(accumulate(diff[:size]))

def count_containing(intervals, x):     # closed: started by x minus ended before x, O(log n)
    starts = sorted(s for s, _ in intervals)
    ends = sorted(e for _, e in intervals)
    return bisect_right(starts, x) - bisect_left(ends, x)`,
  ops: [
    { title: "Standard interval tasks (n intervals; R = coordinate range)", rows: [
      ["Overlap test of two intervals", "O(1)", "O(1)", "max(starts) <= min(ends)"],
      ["Intersection of two intervals", "O(1)", "O(1)", "[max(starts), min(ends)] when it is not empty"],
      ["Sort by start or by end", "O(n log n)", "O(n log n)", "the first step of almost every interval solution"],
      ["Merge all overlapping intervals", "O(n log n)", "O(n log n)", "sort, then one pass; O(n) if already sorted"],
      ["Insert one into a sorted disjoint list", "O(n)", "O(n)", "three phases; rebuilding the list dominates"],
      ["Insert or remove in a sorted map of disjoint ranges", "O(log n + k)", "O(n)", "find the neighbours, merge or split the k ranges touched"],
      ["Gaps between intervals (free time)", "O(n log n)", "O(n log n)", "merge, then the gaps are between consecutive blocks"],
      ["Total length covered (union)", "O(n log n)", "O(n log n)", "merge, then add up block lengths"],
      ["Most overlapping at once (rooms needed)", "O(n log n)", "O(n log n)", "sweep 2n sorted events, or a min-heap of end times"],
      ["Count at every integer point", "O(n + R)", "O(n + R)", "difference array plus one prefix sum"],
      ["How many intervals contain x", "O(log n)", "O(log n)", "after sorting starts and ends: two binary searches"],
      ["Most non-overlapping intervals kept", "O(n log n)", "O(n log n)", "sort by end, greedy; fewest removals = n minus that"],
      ["Fewest points that stab every interval", "O(n log n)", "O(n log n)", "sort by end, shoot at the end of the first unstabbed one"],
      ["Fewest intervals to cover [0, T]", "O(n log n)", "O(n log n)", "sort by start, repeatedly take the farthest reach"],
      ["Intersection of two sorted lists", "O(n + m)", "O(n + m)", "two pointers, advance the one that ends first"],
      ["Remove intervals covered by another", "O(n log n)", "O(n log n)", "sort by start ascending, end descending, track the max end"],
      ["Online booking with no double booking", "O(log n)", "O(log n)", "sorted map: check only the predecessor and successor"],
      ["Online booking, plain sorted list", "O(log n) check", "O(n) insert", "binary search to check, list insert shifts"],
      ["Max total weight of non-overlapping intervals", "O(n log n)", "O(n log n)", "sort by end, DP plus binary search for the last compatible one"],
      ["Stabbing queries on a changing set", "O(log n + k)", "O(log n + k)", "interval tree or segment tree; k = intervals reported"],
    ] },
  ],
  builtins: [
    ["Sort by start, then end", "`sort(v.begin(), v.end())` on `pair` or `vector<int>`", "`intervals.sort()`"],
    ["Sort by end", "`sort(..., [](auto& a, auto& b) { return a[1] < b[1]; })`", "`intervals.sort(key=lambda x: x[1])`"],
    ["Min-heap of end times", "`priority_queue<int, vector<int>, greater<int>>`", "`heapq.heappush`, `heapq.heapreplace`"],
    ["Sorted container of disjoint ranges", "`std::map<int, int>` with `upper_bound` and `prev`", "`sortedcontainers.SortedList` (on LeetCode), or `bisect.insort` on a list"],
    ["Binary search over starts or ends", "`lower_bound`, `upper_bound`", "`bisect_left`, `bisect_right`"],
    ["Prefix sum of a difference array", "`partial_sum`", "`itertools.accumulate`"],
  ],
  when: [
    "The input is a list of `[start, end]` pairs, meetings, bookings, events, time ranges or segments on a line.",
    "\"Merge\", \"overlapping\", \"union\", \"free time\" or \"gaps\": sort by start and merge.",
    "\"Minimum number of rooms\", \"maximum concurrent\", \"busiest time\": sweep events or a heap of end times.",
    "\"Maximum number of non-overlapping\", \"minimum removals\", \"minimum arrows\": sort by end, greedy.",
    "Bookings arrive one at a time and each must be accepted or rejected: a sorted map keyed by start.",
    "Many range updates on small integer coordinates, then point reads: a difference array.",
    "Intervals carry a weight or profit and you pick a compatible subset: sort by end and DP with binary search.",
  ],
  avoid: [
    "Ranges over array indices with sums or minimums: prefix sums, a Fenwick tree or a segment tree, not pairwise interval logic.",
    "Comparing every pair for overlap is O(n^2); a sort plus one pass almost always does it in O(n log n).",
    "Coordinates up to 10^9: do not allocate a difference array over the range; sort events, or compress the coordinates first.",
    "Greedy by start for maximum selection fails (one long early interval blocks many short ones): use sort by end.",
  ],
  tips: [
    "Ask, or state, whether the ends are inclusive. It decides `<` versus `<=` in every comparison and the tie order in a sweep.",
    "When merging, set the end to `max(last.end, end)`, not `end`: a short interval inside a long one must not shrink the block.",
    "Sort a copy if the caller still needs the original order, and remember original indices when the answer is per interval (Find Right Interval).",
    "In a sweep, sort events as (time, delta) so ends (-1) come before starts (+1) at the same time for half-open intervals.",
    "Greedy proofs for interval selection use the exchange argument: any optimal answer can swap its first pick for the interval that ends earliest.",
    "Two sorted lists: always advance the interval that ends first; advancing by start skips intersections.",
    "Edge cases to test: an empty list, one interval, identical intervals, one interval inside another, and intervals that only touch.",
  ],
  viz: [
    { name: "Overlap test", make: () => overlapViz() },
    { name: "Sweep line", make: sweepViz, input: "1 4, 2 5, 4 7, 6 8, 3 6, 9 10", label: "start end pairs, for example 1 4, 2 5" },
    { name: "Insert into a sorted list", make: () => insertViz() },
  ],
};
