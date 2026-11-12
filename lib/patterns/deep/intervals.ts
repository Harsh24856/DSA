// Deeper theory for the "intervals" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { Diagram, IntervalsFrame, Tone } from "../../diagram";
import type { Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "After sorting by start, the merged output can be built left to right with one 'last' block. If the next interval starts at or before last.end, it overlaps the block and extends it. If it starts after, there is a gap, and since every later interval starts even further right, nothing can ever bridge that gap, so the block is final.",
    "The extension uses max(last.end, end) because a later interval may be contained in the block. Writing last.end = end is the single most common bug in this problem and fails on [[1, 10], [2, 3]].",
    "Insert Interval on a list that is already sorted and disjoint needs no sort: copy the intervals that end before the new one starts, merge the new one with every interval that overlaps it (new start = min of starts, new end = max of ends), then copy the rest. One pass, O(n).",
    "Recognise merging by any question that unions ranges: total covered length (merge, then sum the lengths), employee free time (merge all busy times, then read the gaps), summary ranges (merge consecutive integers), or 'can a person attend all meetings' (sort, then check neighbours).",
    "Complexity: O(n log n) to sort and O(n) to sweep, with O(n) output. If the input arrives sorted, the whole thing is linear.",
    "Decide the touching rule first. Closed intervals that share an endpoint usually merge ([1, 2] and [2, 3] become [1, 3]); half-open time slots usually do not. The test is <= in the first case and < in the second, and getting it backwards changes the answer on exactly the boundary cases interviewers like to test.",
  ],
  2: [
    "The sweep line turns intervals into events: +1 at each start and -1 at each end. At any time t, the running sum of all events up to t equals the number of intervals that contain t. So the maximum of the running sum over the sorted events is the largest overlap, which is the number of rooms Meeting Rooms II needs.",
    "Ties decide the boundary rule. For half-open meetings [s, e), a meeting ending at 10 frees its room for one starting at 10, so the -1 must be processed before the +1 at the same time. Sorting (time, delta) pairs does that automatically because -1 < +1. For closed intervals, where touching counts as overlap, process starts first.",
    "An equivalent view uses a min-heap of end times: sort by start, and for each meeting pop the earliest end if it is at or before the new start, then push the new end. The heap size at the end is the room count. That version is covered as its own pattern below, because it also tells you which room each meeting gets.",
    "When times are small integers, a difference array replaces sorting: diff[s] += 1, diff[e] -= 1, then a prefix sum, O(n + T). When times are huge but sparse, use a sorted map of time to delta; My Calendar III is exactly that, and Car Pooling adds passenger counts instead of 1.",
    "Point queries need a different shape. Number of Flowers in Full Bloom asks, for each person's time t, how many intervals contain t: that is (number of starts <= t) - (number of ends < t), two binary searches on separately sorted start and end arrays, O((n + q) log n).",
    "Complexity: O(n log n) for the sort, O(n) for the sweep. The Skyline Problem is a sweep where the state is a max-heap (or multiset) of active heights instead of a counter, and the output is every point where the maximum changes.",
  ],
  3: [
    "Choosing the most non-overlapping intervals is the activity selection problem, and the greedy rule is: always keep the interval that ends first among those compatible with what you kept. The exchange argument proves it. Take any optimal solution and its first interval. Replace it with the earliest-ending interval overall. That one ends no later, so it conflicts with nothing the old one did not conflict with, and the solution stays valid and just as large. Repeat for the rest.",
    "So the algorithm sorts by end, keeps a variable for the last kept end, and accepts each interval whose start is at or after it. Minimum removals to make the rest non-overlapping is n minus the number kept.",
    "Sorting by START is the classic mistake. A very long interval that starts first would be kept and block many short ones. Sorting by end prevents that because a long interval ends late and is considered late.",
    "Minimum Arrows to Burst Balloons is the same greedy: each arrow is placed at the end of the earliest-ending balloon, which bursts everything that starts at or before that point. The difference is the boundary: balloons that touch are burst by one arrow, so a new arrow is needed only when start > the last arrow position.",
    "Maximum Length of Pair Chain is activity selection with a strict comparison (b < c). Remove Covered Intervals is a different sort: by start ascending and end descending, then count intervals whose end exceeds the maximum end seen so far.",
    "Complexity: O(n log n) for the sort and O(n) for the pass, O(1) extra space. A DP over intervals sorted by end (like weighted interval scheduling) is needed only when intervals have weights; without weights the greedy is optimal.",
  ],
  4: [
    "With two sorted lists of disjoint intervals, the overlap of A[i] and B[j] is [max of starts, min of ends], non-empty when that start is at most that end. After recording it, advance the interval that ends first. That is safe because the interval that ends first cannot overlap anything later in the other list: every later interval there starts after the current one, which already reaches past this end.",
    "That argument also proves the scan finds every intersection. Any overlapping pair (A[i], B[j]) is examined, because the pointers only skip an interval once it can no longer overlap anything ahead.",
    "Recognise the pattern by two schedules that must be combined: common free time for two people (intersect the free lists, keep slots at least the required duration long), Meeting Scheduler, or 'merge two sorted interval sets'. For more than two lists, either intersect them pairwise or sweep all events together and look for times when every list is active.",
    "Employee Free Time is the complement view: merge everyone's busy intervals (sort by start, or a k-way merge since each list is sorted), then the gaps between merged blocks are the common free time.",
    "Complexity: O(n + m) time with two pointers, and output size at most n + m. If the lists are not sorted, sort them first, O(n log n + m log m).",
    "Edge cases: one list empty, intervals that touch at a single point (with closed intervals [5, 5] is a valid intersection), and equal ends, where advancing either pointer is correct. Advancing by start instead of end is the typical bug and skips overlaps.",
  ],
  5: [
    "Online booking keeps the accepted intervals sorted by start and pairwise disjoint. A new booking [s, e) can only clash with its neighbours in that order: the booking with the largest start below s (if it ends after s) and the booking with the smallest start at or after s (if it starts before e). Every other booking is further away on one side. So a check is two comparisons after one binary search.",
    "In Python, bisect on a list finds the spot in O(log n), but inserting into a list shifts elements, O(n). A balanced tree (TreeMap in Java, std::map in C++, SortedList in Python's sortedcontainers) makes the insert O(log n) as well.",
    "My Calendar II allows double bookings but not triple. Keep two lists: all bookings and the overlaps between them. A new booking is rejected if it overlaps any stored overlap; otherwise add its overlaps with existing bookings to the second list. That is O(n) per booking, which fits the limits.",
    "My Calendar III asks for the maximum number of simultaneous bookings after each call. A sorted map of time to delta (+1 at start, -1 at end) and a sweep over its keys gives O(n) per call. A segment tree with lazy propagation over compressed or dynamic coordinates gives O(log n).",
    "Range Module (add, remove and query ranges) keeps a sorted list of disjoint intervals and edits it in place. Adding merges every interval that touches the new range; removing splits intervals at the boundaries. Getting the half-open boundaries right is the whole difficulty.",
    "Edge cases: bookings that touch ([10, 20) and [20, 30) do not clash), an empty calendar, and a booking that falls inside an existing one. Always state whether intervals are open, closed or half-open before writing any comparison.",
  ],
};

/* ---------- visualisers for the new patterns ---------- */

function groupsViz(raw: [number, number][]): Diagram {
  const items = [...raw].sort((a, b) => a[0] - b[0] || a[1] - b[1]), frames: IntervalsFrame[] = [], ends: number[] = [], tones: Record<number, Tone> = {};
  frames.push({ note: "Sorted by start. The min-heap holds the end of the last interval in each group (room). Closed intervals: a group is free only if it ended strictly before the new start.", tones: Object.fromEntries(items.map((_, i) => [i, "muted" as Tone])) });
  items.forEach(([s, e], i) => {
    const min = ends.length ? Math.min(...ends) : undefined, reuse = min !== undefined && min < s;
    if (reuse) ends.splice(ends.indexOf(min!), 1);
    ends.push(e);
    tones[i] = reuse ? "done" : "active";
    frames.push({ note: `[${s}, ${e}]: ${reuse ? `the earliest group ends at ${min} < ${s}, so reuse it` : min === undefined ? "no group yet, open one" : `the earliest group ends at ${min}, not before ${s}, so open a new one`}. Heap of ends: [${[...ends].sort((a, b) => a - b).join(", ")}], ${ends.length} group${ends.length > 1 ? "s" : ""}.`, line: s, tones: { ...Object.fromEntries(items.map((_, j) => [j, j > i ? "muted" : "done"] as [number, Tone])), [i]: reuse ? "found" : "active" } });
  });
  frames.push({ note: `${ends.length} groups are needed: that is the largest number of intervals that overlap at one moment.`, tones: { ...tones } });
  return { kind: "intervals", title: "Fewest groups: a min-heap of end times", items, frames };
}

function coverViz(raw: [number, number][], T: number): Diagram {
  const items = [...raw].sort((a, b) => a[0] - b[0] || a[1] - b[1]), frames: IntervalsFrame[] = [], tones: Record<number, Tone> = {};
  let reach = 0, i = 0, count = 0;
  frames.push({ note: `Cover [0, ${T}]. Sorted by start; [0, reach] is covered, starting with reach = 0.`, line: 0, tones: Object.fromEntries(items.map((_, j) => [j, "muted" as Tone])) });
  while (reach < T) {
    let best = reach, pick = -1;
    while (i < items.length && items[i][0] <= reach) {
      if (items[i][1] > best) { best = items[i][1]; pick = i; }
      tones[i] = "window";
      frames.push({ note: `[${items[i][0]}, ${items[i][1]}] starts inside the covered part (${items[i][0]} <= ${reach}): a candidate. Furthest end so far: ${best}.`, line: reach, tones: { ...tones, [i]: "active" } });
      i++;
    }
    if (pick < 0) { frames.push({ note: `Nothing that starts at or before ${reach} reaches further: there is a gap after ${reach}, so the answer is -1.`, line: reach, tones: { ...tones } }); break; }
    count++; reach = best;
    for (const k of Object.keys(tones)) if (tones[+k] === "window") tones[+k] = "done";
    tones[pick] = "found";
    frames.push({ note: `Take [${items[pick][0]}, ${items[pick][1]}], the candidate reaching furthest. reach = ${reach}, clips used = ${count}.`, line: reach, tones: { ...tones } });
  }
  if (reach >= T) frames.push({ note: `reach ${reach} >= ${T}: covered with ${count} clips. Each clip is looked at once after sorting.`, line: T, tones: { ...tones } });
  return { kind: "intervals", title: `Greedy cover of [0, ${T}]`, items, frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 6, name: "Min-heap of end times (fewest rooms or groups)", summary: "Sort by start and keep a min-heap of the end time of each open room. Reuse the room that frees up earliest if it is free in time, otherwise open a new room.",
    signals: ["minimum meeting rooms / platforms / groups", "divide intervals into the fewest non-overlapping groups", "assign each meeting to a room (which room?)", "attend the most events, one per day"],
    idea: ["Process intervals in start order. The room that becomes free earliest is the best one to reuse, because if even it is busy, every room is busy.", "The heap holds one end time per room. If its top ends before the new start, pop it (the room is reused); in both cases push the new end. The heap size is the room count."],
    steps: ["sort intervals by start", "for s, e: if heap and heap[0] < s: pop (reuse)", "push e", "answer = len(heap)"],
    code: `import heapq
def min_groups(iv):
    ends = []                         # end time of the last interval in each group
    for s, e in sorted(iv):
        if ends and ends[0] < s:      # the group that frees first is free before s
            heapq.heapreplace(ends, e)
        else:
            heapq.heappush(ends, e)
    return len(ends)`,
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "The sort plus one push (and maybe one pop) per interval." },
    traps: ["Closed intervals ([1, 5] and [5, 9] clash) need ends[0] < s; half-open meetings need ends[0] <= s.", "Sort by START here. Sorting by end is for choosing the most non-overlapping intervals, a different question.", "Popping every free room instead of one is fine for the count but loses which room was reused."],
    viz: { make: () => groupsViz([[5, 10], [6, 8], [1, 5], [2, 3], [1, 10], [11, 12]]) },
    theory: [
      "Why reusing the earliest-free room is optimal: when an interval starts, the only question is whether some open room is free. If the room with the smallest end is not free, no room is, so a new one is unavoidable. If it is free, reusing it is at least as good as reusing any other free room, because the rooms that stay open then have later ends, which can only help later intervals that start even later. Either way, the algorithm opens a new room only when it must.",
      "The count equals the maximum overlap. At the moment the algorithm opens its kth room, k intervals are active at that start time: the new one and one per busy room. So the answer is at most the maximum overlap, and no schedule can use fewer rooms than intervals that overlap at one time. That is why this pattern and the sweep line always agree.",
      "What the heap adds over the sweep line is assignment: it can say which room each interval goes to, if each heap entry stores (end, room id). Meeting Rooms III (count meetings per room, with delays) extends this with a second heap of free room ids.",
      "Recognise it by 'fewest rooms, machines, platforms or groups' and by simulations where you repeatedly need the resource that frees first. Car Pooling is the same shape with capacity instead of room count: pop every trip that has ended before adding the new passengers. Maximum Number of Events That Can Be Attended keeps a heap of end days of available events and each day attends the one ending soonest.",
      "Complexity: O(n log n) for the sort and O(log n) per heap operation. Space is O(n) in the worst case, when everything overlaps.",
      "Edge cases: the boundary rule (closed versus half-open), many intervals with the same start, and an empty input. If the problem says 'groups' of closed intervals (Divide Intervals Into Minimum Number of Groups), touching intervals cannot share a group.",
    ],
  },
  {
    n: 7, name: "Interval covering (greedy reach)", summary: "To cover [0, T] with the fewest intervals, repeatedly take, among the intervals that start inside the covered part, the one that reaches furthest. It is jump game on intervals.",
    signals: ["video stitching: fewest clips to cover [0, T]", "minimum taps to water a garden", "jump game II (minimum jumps)", "can a set of intervals cover a range at all"],
    idea: ["Keep reach: everything in [0, reach] is covered. Every interval that starts at or before reach can extend coverage; the best of them is the one with the largest end.", "Take it, set reach to its end, and repeat. If no candidate goes past reach, there is a gap that nothing covers."],
    steps: ["sort by start; reach = 0, count = 0", "while reach < T: best = max end over intervals with start <= reach", "if best == reach: return -1", "count += 1; reach = best"],
    code: `def min_cover(clips, T):
    clips.sort()
    count = i = reach = 0             # [0, reach] is covered
    while reach < T:
        best = reach
        while i < len(clips) and clips[i][0] <= reach:
            best = max(best, clips[i][1]); i += 1
        if best == reach:
            return -1                 # nothing starts inside the covered part and goes further
        count += 1
        reach = best
    return count`,
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)", note: "The sort dominates; the pointer i moves through the clips once." },
    traps: ["Check for the gap (best == reach) before counting, or a stuck loop runs forever.", "Minimum Taps: tap i covers [i - r, i + r]; convert taps to intervals first.", "If intervals can start after 0 only, the answer is -1 immediately; the gap check handles it."],
    viz: { make: () => coverViz([[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10) },
    theory: [
      "The greedy choice is safe by an exchange argument. Some optimal cover must use an interval that contains the point just after reach (otherwise that point is uncovered), and that interval starts at or before reach. Among all such intervals, the one reaching furthest covers at least as much as the optimal one's choice, so swapping it in keeps the cover valid without adding intervals.",
      "It is the same algorithm as Jump Game II. There, index i lets you jump to anything in [i, i + nums[i]], so each index is an interval. The 'current level' of the BFS is [0, reach], and the next level ends at the furthest jump from inside it. Counting levels counts jumps.",
      "Complexity: O(n log n) to sort the clips; the inner pointer moves forward only, so the greedy phase is O(n). Jump Game II needs no sort because the intervals are already indexed by start, which makes it O(n).",
      "Recognise it by 'fewest intervals to cover a range' or 'minimum number of steps where each step can reach any point up to some bound'. Minimum Number of Taps converts tap i with radius r into the interval [i - r, i + r] (clipped to the garden), then runs the same greedy; a faster variant stores, for each left end, the furthest right end in an array.",
      "Contrast with the other interval greedy. Selecting the most non-overlapping intervals sorts by END and picks the earliest finish. Covering a range sorts by START and picks the furthest reach. Mixing up which key and which choice applies is the classic mistake.",
      "Edge cases: T = 0 (zero intervals needed), no interval starting at 0, intervals that reach past T (fine, coverage only needs to reach T), and duplicate intervals. Without the gap check the outer loop never ends.",
    ],
  },
];
