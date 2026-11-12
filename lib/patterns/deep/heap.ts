// Deeper theory for the "heap" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram } from "../../diagram";
import * as S from "../../sim";
import { nums, type Pattern } from "../types";

const { range } = S;

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "The invariant: after processing a prefix of the input, the heap holds the k largest values of that prefix, and its top is the smallest of them. A new value x either beats the top (then the old top drops out of the top k and x joins) or it does not (then x is not in the top k). Pushing x and popping the minimum when the size passes k implements both cases at once.",
    "Why a MIN-heap for the largest values: the only element you ever need to compare against or remove is the weakest member of the current top k. A min-heap keeps exactly that element at the top. A max-heap of all n values also works, but it costs O(n) memory and O(n + k log n) time.",
    "Complexity: each of n values costs one push and possibly one pop on a heap of size at most k + 1, so O(n log k) time and O(k) space. That is better than sorting (O(n log n)) when k is small, and it works on a stream where you never see all the data at once, as in Kth Largest Element in a Stream.",
    "Alternatives worth naming: quickselect finds the kth element in O(n) average time but needs all data in memory and modifies it; heapify all n values and pop k times is O(n + k log n); bucket or counting sort applies when values are small integers.",
    "K Closest Points to Origin is the same pattern with a computed key: keep a max-heap of size k on distance (push negative distances in Python), so the farthest of the current k sits on top and is evicted first. Compare squared distances to avoid square roots.",
    "Edge cases: k equal to n (the answer is the minimum), duplicates (they count separately), and ties when the heap holds tuples. In Python, add a tie-breaker field so objects that cannot be compared never get compared.",
  ],
  2: [
    "This pattern is Top-K applied to a derived score. First turn the input into (score, item) pairs, usually counts from a hash map, then keep the k best pairs with a min-heap of size k. The two phases are independent, so each can be reasoned about on its own.",
    "Complexity: counting is O(n). The heap phase is O(m log k) for m distinct items. Bucket sort avoids the log: a count can only be between 1 and n, so put each item into bucket[count] and read buckets from n down until k items are collected, O(n) total.",
    "Tie-breaking rules change the key. Top K Frequent Words wants higher counts first and, among equal counts, alphabetical order. With a min-heap that evicts the worst item, the worst is the lower count or, on a tie, the alphabetically LATER word, so the key needs a reversed comparison on the word. In Python that is easiest with a small wrapper class or by using heapq.nsmallest(k, items, key=lambda w: (-count[w], w)).",
    "Sort Characters by Frequency and Reorganize String start the same way: count, then process characters by count. Sorting the m distinct characters directly is fine when m is small (26 letters), which makes the heap optional.",
    "Recognise it by 'most frequent', 'top k by score', 'rank by computed value'. If the problem needs all items in order, sort; if it needs only k of them, a heap or bucket sort is the better fit; if it needs the kth only, quickselect on the counts.",
    "Edge cases: k equal to the number of distinct values, many ties, and pushing every element instead of every distinct value (which makes the heap phase O(n log k) and duplicates items).",
  ],
  3: [
    "K-way merge works because the next smallest element overall must be the current head of one of the k lists: every other element of a list is at least that list's head. So a min-heap of the k current heads always has the next output on top. After popping a head, only its own list can supply a new candidate, so push that list's next element.",
    "Complexity: the heap never holds more than k entries, so each of the N output elements costs O(log k), giving O(N log k) time and O(k) extra space. Merging the lists one by one costs O(N x k), and pairwise merging like merge sort levels gives the same O(N log k) without a heap.",
    "Many problems are k-way merges in disguise. Kth Smallest Element in a Sorted Matrix treats each row as a sorted list; pop k times. Find K Pairs with Smallest Sums treats 'pairs that start with a[i]' as list i. Smallest Range Covering Elements from K Lists keeps one element per list in the heap plus the current maximum; the range [heap top, max] covers all lists, and you advance the list that holds the top.",
    "For the sorted matrix there is also a binary search on the value: count how many entries are at most mid by walking a staircase from the bottom left, O(n) per count, O(n log(range)) total. That is better when k is close to n².",
    "In Python, heap entries must be comparable. Use (value, list index, node) so ties on value compare the index instead of the nodes. In C++, give priority_queue a comparator on the value.",
    "Edge cases: empty lists inside the input, all lists empty, very uneven lengths, and duplicates across lists. Forgetting to push the successor after a pop silently drops the rest of that list.",
  ],
  4: [
    "Two heaps split the numbers into a lower half and an upper half. The invariant has two parts: every value in 'low' is at most every value in 'high', and len(low) is len(high) or one more. Under that invariant the median is low's top (odd count) or the average of both tops (even count), readable in O(1).",
    "The insert routine keeps the invariant with a fixed dance: push into low, move low's top to high, and if high is now bigger, move high's top back to low. Passing through both heaps guarantees the ordering part, because whatever lands in high is the largest of low plus the new value. The final check fixes the sizes.",
    "Complexity: O(log n) per insert (a constant number of pushes and pops) and O(1) per median query, with O(n) space. A sorted list with binary insertion gives O(n) per insert because of shifting; an order-statistics tree gives O(log n) with more code.",
    "IPO (maximize capital) uses two heaps differently: a min-heap of projects by required capital and a max-heap of affordable profits. Each round moves every newly affordable project from the first heap to the second, then takes the best profit. The common idea is that each heap exposes the best element of one group.",
    "Sliding Window Median adds removals of arbitrary values, which a heap cannot do directly. The standard fix is lazy deletion: record the value as dead and only remove it when it reaches a heap top. That is its own pattern below.",
    "Edge cases: an even count with tops whose sum overflows 32 bits (convert to a wider type or double first), negative values, and the negation trick for Python max-heaps (negate on push and on read).",
  ],
  5: [
    "Greedy with a heap fits problems where the best move is always 'take the current extreme' and every move changes the set of candidates. The heap makes each 'find the extreme' O(log n) instead of O(n), so a simulation of n steps costs O(n log n).",
    "The correctness comes from the greedy argument, not from the heap. For Minimum Cost to Connect Sticks, combining the two smallest first is optimal because every stick's length is paid once for each merge it takes part in, so the smallest sticks should sit deepest, exactly as in Huffman coding. The heap only makes that rule fast.",
    "Task Scheduler and Reorganize String use a max-heap of counts with a cooldown. Each step takes the most frequent available item and holds it out of the heap until its cooldown passes (one step for Reorganize String, n steps for Task Scheduler, often with a queue of waiting items). Taking the most frequent first is right because it is the item most likely to force idle time later.",
    "Meeting Rooms II and Single-Threaded CPU are event simulations: sort by start time, keep a min-heap of end times (rooms) or of available tasks by processing time, and advance time to the next event. The heap holds 'what is active right now'.",
    "Complexity: O(n) to heapify, then O(log n) per step. Watch the number of steps: in Last Stone Weight each step removes at least one stone, so there are fewer than n steps.",
    "Edge cases: an empty heap at the end, impossible arrangements (Reorganize String fails when the top count exceeds (n + 1) / 2), and Python's min-heap requiring negation for max behaviour, which must be undone on every read.",
  ],
};

/* ---------- visualiser for the new pattern ---------- */

function medianViz(a: number[], k: number): Diagram {
  const lo: number[] = [], hi: number[] = [], dead = new Map<number, number>(), frames: CellsFrame[] = [];
  const top = (h: number[], max: boolean) => (max ? Math.max(...h) : Math.min(...h));
  const take = (h: number[], v: number) => h.splice(h.indexOf(v), 1);
  const prune = (h: number[], max: boolean) => { const out: number[] = []; while (h.length && (dead.get(top(h, max)) ?? 0) > 0) { const v = top(h, max); dead.set(v, dead.get(v)! - 1); take(h, v); out.push(v); } return out; };
  const rows = () => [a, [...lo].sort((x, y) => y - x), [...hi].sort((x, y) => x - y)];
  const median = () => (k % 2 ? top(lo, true) : (top(lo, true) + top(hi, false)) / 2);
  const deadText = () => { const d = [...dead].filter(([, c]) => c > 0).map(([v, c]) => (c > 1 ? `${v} x${c}` : `${v}`)); return d.length ? ` Dead, still inside: ${d.join(", ")}.` : ""; };
  for (const x of a.slice(0, k)) lo.push(x);
  for (let j = 0; j < k >> 1; j++) { const v = top(lo, true); take(lo, v); hi.push(v); }
  frames.push({ note: `First window: the smaller half goes in lo (max on top), the larger half in hi (min on top). Median = ${median()}.`, rows: rows(), tones: { ...range(0, k - 1, 0), "1:0": "found", ...(k > 1 ? { "2:0": "found" } : {}) } });
  for (let i = k; i < a.length; i++) {
    const x = a[i], y = a[i - k];
    let bal = 0;
    const into = x <= top(lo, true) ? "lo" : "hi";
    if (into === "lo") { lo.push(x); bal++; } else { hi.push(x); bal--; }
    dead.set(y, (dead.get(y) ?? 0) + 1);
    const from = y <= top(lo, true) ? "lo" : "hi";
    bal += from === "lo" ? -1 : 1;
    let moved = "";
    if (bal > 0) { const v = top(lo, true); take(lo, v); hi.push(v); moved = ` Rebalance: move ${v} from lo to hi.`; }
    if (bal < 0) { const v = top(hi, false); take(hi, v); lo.push(v); moved = ` Rebalance: move ${v} from hi to lo.`; }
    const gone = [...prune(lo, true), ...prune(hi, false)];
    frames.push({ note: `${x} enters (into ${into}); ${y} leaves: mark it dead instead of searching for it (it counted in ${from}).${moved}${gone.length ? ` Pop dead ${gone.join(", ")} now that ${gone.length > 1 ? "they sit" : "it sits"} on top.` : ""}${deadText()} Median = ${median()}.`, rows: rows(), tones: { ...range(i - k + 1, i, 0), [`0:${i}`]: "active", [`0:${i - k}`]: "bad", "1:0": "found", ...(k > 1 ? { "2:0": "found" } : {}) } });
  }
  frames.push({ note: "Each value is pushed once and popped at most once, so the whole run is O(n log n), even though dead values linger until they surface.", rows: rows() });
  return { kind: "cells", title: `Sliding window median (k=${k}) with lazy deletion`, rowLabels: ["nums", "lo (max)", "hi (min)"], rows: [a, [], []], frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 6, name: "Lazy deletion (sliding window median)", summary: "A heap cannot remove an arbitrary element cheaply. Instead, mark it dead in a counter and throw it away only when it reaches the top. Only the tops have to be valid.",
    signals: ["sliding window median", "remove arbitrary elements from a heap", "heap entries that expire (left the window, already used)", "skyline, events whose end time has passed"],
    idea: ["Keep a map dead[value] = how many copies are stale. When a value should leave, increment its count. Before reading a top, pop while the top is dead.", "For the window median, track the balance of VALID elements between the two halves yourself, because the heap sizes now include dead entries. After each step move at most one element across, then prune both tops."],
    steps: ["build the first window: lo holds the smaller half, hi the larger", "for each step: push x into the right half; mark y = a[i - k] dead and note which half it counted in", "move one top across if the valid sizes are off by two", "prune the dead tops of lo and hi, then read the median"],
    code: `import heapq
from collections import Counter

def median_window(a, k):
    lo, hi = [], []                   # lo: max-heap of the smaller half (negated), hi: min-heap of the larger half
    dead = Counter()                  # value -> stale copies still inside a heap
    def prune(h, sign):               # pop dead values sitting on top of h
        while h and dead[sign * h[0]]:
            dead[sign * h[0]] -= 1
            heapq.heappop(h)
    for x in a[:k]:
        heapq.heappush(lo, -x)
    for _ in range(k // 2):
        heapq.heappush(hi, -heapq.heappop(lo))
    median = lambda: float(-lo[0]) if k % 2 else (-lo[0] + hi[0]) / 2
    out = [median()]
    for i in range(k, len(a)):
        x, y = a[i], a[i - k]         # x enters, y leaves
        bal = 0                       # change in (valid in lo) - (valid in hi)
        if x <= -lo[0]:
            heapq.heappush(lo, -x); bal += 1
        else:
            heapq.heappush(hi, x); bal -= 1
        dead[y] += 1                  # do not search for y: mark it and move on
        bal += -1 if y <= -lo[0] else 1
        if bal > 0:
            heapq.heappush(hi, -heapq.heappop(lo))
        elif bal < 0:
            heapq.heappush(lo, -heapq.heappop(hi))
        prune(lo, -1)                 # only the tops have to be valid
        prune(hi, 1)
        out.append(median())
    return out`,
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "Each value is pushed once and popped at most once; dead entries can make a heap hold up to O(n) items." },
    traps: ["len(heap) is no longer the number of valid items; keep your own balance count.", "Prune lo before hi, and prune after rebalancing, so both tops are valid when you read them.", "A simpler lazy pattern stores (value, index) and drops a top whose index has left the window; that is enough for a window MAXIMUM, not for a median."],
    viz: { make: (i) => { const v = nums(i, [1, 3, -1, -3, 5, 3, 6, 7, 3], 11); const ok = v.length >= 7; const a = ok ? v.slice(0, -1) : [1, 3, -1, -3, 5, 3, 6, 7]; const k = ok ? Math.max(1, Math.min(a.length - 4, Math.round(v[v.length - 1]))) : 3; return medianViz(a, k); }, input: "1, 3, -1, -3, 5, 3, 6, 7, 3", label: "numbers, last value = k (at least 6 numbers)" },
    theory: [
      "Why lazy deletion is safe: a heap only promises anything about its top. Dead entries buried below the top never affect a read, as long as every read first pops dead entries off the top. So it is enough to keep the counter of dead values and prune at the moment a top is about to be used.",
      "For the median, the two heaps must still split the VALID values correctly. The code tracks bal, the change in (valid in lo) minus (valid in hi) during one step: +1 or -1 for the value that enters, and -1 or +1 for the value that leaves, depending on which half it counted in. The result is -2, 0 or 2, and moving one top across fixes it. Deciding the half of the leaving value by comparing with lo's top is correct because lo's top was valid at the start of the step, and every value at or below it belongs to the lower half.",
      "Duplicates are the subtle part. dead counts values, not positions, so pruning may remove a different copy of the same value than the one that left. That is harmless: equal values are interchangeable for a median, and pruning lo first means a copy equal to lo's top is taken from lo, matching the bookkeeping.",
      "Complexity: every value is pushed once and popped at most once (by a rebalance or by pruning), so the total is O(n log n). The heaps can hold dead entries, up to O(n) in the worst case, so space is O(n). A balanced tree or C++ multiset gives the same time with real deletions and simpler bookkeeping.",
      "The same idea solves other 'expired entries' problems. The Skyline Problem keeps a max-heap of active building heights and discards a top whose building has already ended. Minimum Interval to Include Each Query keeps a min-heap of interval sizes and drops tops that end before the query. Sliding Window Maximum can be done with a heap of (value, index) and dropping stale tops, though the monotonic deque is O(n).",
      "Edge cases: k = 1 (hi stays empty), even k with sums that overflow 32 bits, all values equal, and windows where the leaving value equals the entering value. A brute force that sorts every window costs O(n x k log k) and is a good test oracle.",
    ],
  },
];
