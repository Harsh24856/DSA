// Deeper theory for the "array" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram, Tone, TreeFrame } from "../../diagram";
import * as S from "../../sim";
import { nums, type Pattern } from "../types";

const { range } = S;
const tones = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "Why it works: P[r + 1] and P[l] share the first l terms, so their difference is exactly a[l] + ... + a[r]. Nothing about the values matters. Negatives, zeros and huge numbers all cancel the same way.",
    "The counting version rests on one rewrite. sum(l..r) = k is the same statement as P[l] = P[r + 1] - k. So for each right end you only ask how many earlier prefixes equal a known number, and a hash map answers that in O(1). The map must hold only prefixes strictly before the current end, which is why the code queries before it inserts.",
    "Recognise it when a question asks about many ranges of a fixed array, or about subarrays with a sum, count or remainder condition. Variants change the operation, not the idea: XOR prefixes (x ^ x = 0 cancels the shared part), remainders for 'divisible by k' (two prefixes with the same remainder bound a divisible subarray), counts of a property for 'exactly k odd numbers', and 2D prefixes for rectangle sums with inclusion and exclusion.",
    "Complexity: the build is one pass, O(n) time and O(n) space, and each range query is O(1). The hash map version is O(n) on average. A 2D table costs O(R x C) to build and O(1) per rectangle: S[r2+1][c2+1] - S[r1][c2+1] - S[r2+1][c1] + S[r1][c1].",
    "Edge cases: the empty prefix (P[0] = 0, or seen = {0: 1}) is what counts subarrays that start at index 0. For 'longest subarray with sum k' store the FIRST index of each prefix and never overwrite it. In fixed-width languages keep the running sum in 64 bits.",
    "The usual wrong approach is a sliding window. It breaks as soon as values can be negative, because growing the window no longer only increases the sum. Prefix sums need no monotonic rule. They are also the inverse of the difference array: prefix sums answer range queries on a fixed array, a difference array applies range updates and reads once at the end, and a Fenwick tree does both while the data changes.",
  ],
  2: [
    "Why the opposite-ends version is correct: on a sorted array, if a[L] + a[R] is too small, then a[L] plus anything at or left of R is also too small, so index L can never be part of an answer and is safely dropped. The mirror argument drops R when the sum is too big. Each step removes one candidate for good, so after at most n steps every pair has been either checked or ruled out.",
    "Picture the n x n grid of pairs (L, R). The search starts at the top right corner and every move deletes a whole row or column of the grid. That is why one pass of O(n) covers what a double loop needs O(n²) for.",
    "Recognise it by a sorted (or sortable) array plus a question about pairs, a target sum, or the best pair by some score that is monotonic in each pointer. Container With Most Water uses a different argument: the shorter wall limits every container that uses it, so moving the taller wall can only shrink the width without raising the height. The same-direction version (read and write pointers) is for in-place filtering such as removing duplicates.",
    "3Sum is two pointers inside a loop: fix a[i], then search the rest for -a[i]. That is O(n²) total after an O(n log n) sort, and the sort is also what makes duplicate skipping easy, because equal values sit next to each other. 4Sum adds one more loop, O(n³).",
    "Edge cases: arrays of length 0 or 1, all values equal, and overflow when two large numbers are added. When the input is not sorted and you need original indices (Two Sum), sorting destroys them; a hash map in O(n) is the right tool there.",
    "Wrong approaches to avoid: moving both pointers after a non-match (skips pairs), and using two pointers on unsorted data. The pattern sits between binary search (one pointer, halving) and sliding window (two pointers moving the same way, with state in between).",
  ],
  3: [
    "The invariant: the window [L, R] is always the longest valid window that ends at R, or at least it contains every valid window ending at R. When R advances you restore validity by moving L right only. This works because validity is monotonic: if a window is invalid, every larger window that contains it is also invalid, so L never has to move back.",
    "That monotonic rule is the test for whether the pattern applies. 'At most k distinct characters' qualifies, since adding characters can only add distinct ones. 'Sum at most k with positive numbers' qualifies. 'Sum exactly k with negatives' does not, and needs prefix sums. 'Exactly k' problems are often solved as atMost(k) - atMost(k - 1).",
    "Complexity: L and R each move at most n times in total, so the inner while loop costs O(n) over the whole run, not per step. This amortised argument is the same one used for monotonic stacks. The space is whatever the window state needs: a counter of characters, a set, or a deque.",
    "Fixed-size windows are simpler: add a[R], remove a[R - k], update the answer once R >= k - 1. Variable windows come in two flavours: for the longest window, shrink while invalid and record after; for the shortest window, shrink while valid and record inside the loop.",
    "Edge cases: empty input, k larger than n, and a window state that must be fully undone when L moves (decrement a count and delete the key at zero, or 'distinct' stays wrong). The jump trick in the template (L = last[ch] + 1) needs the guard last[ch] >= L, or a stale copy from before the window drags L backwards.",
    "Window maximum or minimum cannot be kept with a single variable, because the extreme may leave the window. A monotonic deque fixes that and is its own pattern below. Sliding window also combines with hashing (anagram windows) and with binary search on the answer (the longest window length that works).",
  ],
  4: [
    "Kadane is dynamic programming with one state. Let run[i] be the best sum of a subarray that ends exactly at i. Such a subarray is either a[i] alone or a[i] appended to the best subarray ending at i - 1, so run[i] = max(a[i], run[i - 1] + a[i]). Every subarray ends somewhere, so the answer is the maximum of run over all i.",
    "An equivalent view: keep the running prefix sum and subtract the smallest prefix seen so far. The best subarray ending at i is P[i + 1] - min(P[0..i]). That is exactly Best Time to Buy and Sell Stock on prefix sums, which is why the two problems feel the same.",
    "Recognise it by 'maximum (or minimum) over contiguous subarrays' of a quantity that adds up. For products, keep both the largest and the smallest product ending here, because multiplying by a negative swaps their roles. For the circular version, the best wrap-around subarray equals the total minus the minimum subarray, unless every value is negative, in which case the plain answer stands.",
    "Complexity is O(n) time and O(1) space: one pass, two numbers. To also return the subarray, remember the index where the current run started and copy it when best improves.",
    "Edge cases: an all-negative array (start from a[0], not 0), a single element, and overflow on long inputs. The common wrong approach is resetting run to 0 whenever it goes negative and starting best at 0, which returns 0 for an all-negative array.",
    "Kadane generalises to 2D (fix two rows, collapse the columns into one array, run Kadane: O(R² x C)) and to 'maximum subarray with at most one deletion', which keeps two states: best ending here with no deletion and with one deletion. That is the first step toward state machine DP.",
  ],
  5: [
    "In-place rearrangement is about invariants on regions of the array. In the Dutch flag, [0, lo) holds 0s, [lo, mid) holds 1s, (hi, n) holds 2s and [mid, hi] is still unknown. Each step looks at a[mid] and shrinks the unknown part by one while keeping all three regions correct. When the unknown part is empty, the array is sorted.",
    "That is also the proof that it terminates: every iteration either advances mid or decreases hi, so the unknown region loses one element per step, and the loop runs at most n times. A swap with hi does not advance mid because the value that arrives from hi has not been examined yet.",
    "Recognise the family by 'in place' or 'O(1) extra space' together with a small set of categories (zero or not, three colours, even or odd) or with values tied to positions (1..n). Move Zeroes is a two-region version with a write pointer. Partition around a pivot is the same two-region idea and is the heart of quicksort and quickselect.",
    "Rotation by reversal works because reversing the whole array puts the last k elements first but backwards, and reversing each part separately restores the order inside each part. Three reversals, each O(n), and no extra array.",
    "Complexity is O(n) time and O(1) space for all of these. A stable partition (keep the relative order inside each group) is harder in place; if the problem needs stability and allows O(n) space, a second array is simpler and less error-prone.",
    "Typical bugs: advancing the scan pointer after a swap that brought in an unchecked value, off-by-one at the region borders (is hi inclusive?), and forgetting k %= n before rotating. Write the region meanings as a comment first; the code then follows from them.",
  ],
  6: [
    "Sorting by start is what makes one pass enough. After sorting, if interval j does not overlap the current merged block, no later interval can overlap that block either, because every later interval starts even further right. So the block is final the moment a gap appears.",
    "The merge test only compares the next start with the block's end. Two intervals [a, b] and [c, d] with a <= c overlap exactly when c <= b. The new end is max(b, d), not d, because a later interval can sit completely inside the block.",
    "Recognise the pattern by any question that unions ranges: merge, insert, covered length, free time, summary ranges. Insert Interval on sorted input needs no sort: copy the intervals that end before the new one, merge all that overlap it, then copy the rest, O(n).",
    "Complexity: O(n log n) for the sort and O(n) for the sweep. If the intervals arrive already sorted, the whole thing is linear. The output can be as large as the input, so O(n) space.",
    "Decide the boundary rule before coding. Closed intervals [1, 2] and [2, 3] touch and usually merge; half-open bookings [1, 2) and [2, 3) do not overlap. The comparison is <= in the first case and < in the second.",
    "Merging is one of three interval moves. Counting how many overlap at once is a sweep line, and choosing the most non-overlapping ones is greedy by end time. Using the wrong sort key for the job (start for selection, end for merging) is the most common interval bug.",
  ],
  7: [
    "Binary search keeps an interval that must contain the answer and halves it every step. The real content is the predicate: a yes/no question ok(x) that is false for every x below some point and true for every x from that point on. Binary search then finds the first true in O(log R) checks, where R is the size of the range.",
    "The lo < hi template is easy to prove. If ok(mid) is true, the first true is at mid or to its left, so hi = mid keeps it. If ok(mid) is false, it is strictly right of mid, so lo = mid + 1 keeps it. Because mid rounds down, mid < hi, so the interval shrinks every time and the loop ends with lo == hi pointing at the answer.",
    "Recognise 'search on the answer' by wording like 'minimum capacity', 'smallest maximum', 'least number of days such that' together with a check you can do greedily in O(n). If a speed works, every faster speed works too: that is the monotonic property. Rotated sorted arrays and peak finding are binary searches where the predicate compares with an end value or with a neighbour.",
    "Complexity: O(log n) on an array, O(log R x cost of ok) on the answer. For real numbers, run a fixed number of iterations (60 or so) instead of comparing floats for equality.",
    "Edge cases: an empty range, an answer that does not exist (the loop returns hi, so check it), duplicates (first or last occurrence needs the matching predicate: a[i] >= x or a[i] > x), and overflow in (lo + hi) / 2 in fixed-width languages.",
    "Most binary search bugs come from mixing templates: lo <= hi with hi = mid, or lo < hi with hi = mid - 1, which either loops forever or skips the answer. Pick one template, always phrase the problem as 'first true', and the rest is the predicate. Binary search also pairs with prefix sums (search a cumulative array) and with greedy checks.",
  ],
  8: [
    "A comparison sort only needs a rule that says which of two items goes first, and the rule must be consistent: if a goes before b and b before c, then a goes before c. Largest Number works because 'a + b > b + a as strings' is such a rule. A rule that is not transitive gives undefined results in C++ and wrong answers elsewhere.",
    "Quickselect partitions around a pivot exactly like quicksort, then keeps only the side that holds the wanted index. With a random pivot the expected work is n + n/2 + n/4 + ... which is at most 2n, so O(n) on average. A bad pivot every time gives n + (n - 1) + ... = O(n²), which is why the pivot is random.",
    "Comparison sorts cannot beat O(n log n) in the worst case: there are n! possible orders and each comparison at best halves the possibilities, so about log2(n!) = O(n log n) comparisons are needed. Counting sort and bucket sort escape this bound by not comparing; they use the values themselves as indices, so they cost O(n + range).",
    "Recognise each tool by its constraint. Custom order: comparator. Only the kth element, or the top k in any order: quickselect or a heap. Small value range: counting sort. Stable multi-key order: sort by the secondary key first, then by the primary key with a stable sort. Sorting a linked list or counting inversions: merge sort.",
    "Edge cases: many equal values make Lomuto partitioning slow (every element equals the pivot); a three-way partition fixes it. Python's sort is stable and accepts a key, which is often clearer than a comparator. C++ std::sort is not stable; use stable_sort when order of equals matters.",
    "Sorting is often a preprocessing step that unlocks another pattern: two pointers, binary search, interval sweeps and greedy choices all assume sorted input. When an O(n log n) bound is acceptable, sorting first is usually the simplest correct start.",
  ],
  9: [
    "A difference array d stores how much each value changes from its left neighbour: d[i] = a[i] - a[i - 1]. Adding v to every value in [l, r] raises the step into l by v and lowers the step out of r by v, and leaves every other step untouched. So a range update is two writes.",
    "Rebuilding is a prefix sum over d, because a[i] = d[0] + d[1] + ... + d[i]. That is the precise sense in which the difference array is the inverse of prefix sums: one turns values into steps, the other turns steps back into values.",
    "Recognise it by many range updates followed by reads only at the end: flight bookings, car pooling capacity checks, coverage counts, shifting letters by ranges. When the coordinates are huge or sparse, store the deltas in a sorted map instead of an array and sweep the keys in order; that is the sweep line written another way.",
    "Complexity: O(1) per update and one O(n) pass, so O(n + q) instead of O(n x q). The 2D version adds v at (r1, c1), subtracts at (r1, c2 + 1) and (r2 + 1, c1), adds back at (r2 + 1, c2 + 1), then takes 2D prefix sums.",
    "Edge cases: allocate n + 1 slots so r + 1 is always valid, and read the problem's boundary rule. Car pooling drops passengers at the end stop, so the update range is [from, to - 1].",
    "The limitation is ordering: you cannot read a value in the middle of the updates without paying O(n). If queries and updates interleave, switch to a Fenwick tree (range update with point query is a Fenwick over the difference array) or a segment tree with lazy propagation.",
  ],
};

/* ---------- visualisers for the new patterns ---------- */

function cyclicViz(arr: number[]): Diagram {
  const a = [...arr], n = a.length, frames: CellsFrame[] = [];
  frames.push({ note: `Value v belongs at index v - 1. Values outside 1..${n} have no home and stay wherever they land.`, rows: [[...a]] });
  for (let i = 0; i < n; i++) {
    let moved = false;
    while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] !== a[i]) {
      const j = a[i] - 1;
      [a[i], a[j]] = [a[j], a[i]];
      moved = true;
      frames.push({ note: `i = ${i}: swap ${a[j]} into its home, index ${j}. Index ${i} now holds ${a[i]}, so check it again.`, rows: [[...a]], tones: { [`0:${i}`]: "active", [`0:${j}`]: "found" }, marks: [{ i, label: "i" }] });
    }
    if (!moved) {
      const why = a[i] === i + 1 ? "is already home" : a[i] < 1 || a[i] > n ? `is outside 1..${n}, leave it` : `is a duplicate: index ${a[i] - 1} already holds ${a[i]}`;
      frames.push({ note: `i = ${i}: ${a[i]} ${why}. Move on.`, rows: [[...a]], tones: { [`0:${i}`]: a[i] === i + 1 ? "done" : "muted" }, marks: [{ i, label: "i" }] });
    }
  }
  const miss = a.findIndex((v, i) => v !== i + 1);
  frames.push(miss < 0
    ? { note: `Every index i holds i + 1, so the first missing positive is n + 1 = ${n + 1}.`, rows: [[...a]], tones: range(0, n - 1, 0, "done") }
    : { note: `Scan: index ${miss} should hold ${miss + 1} but holds ${a[miss]}. First missing positive = ${miss + 1}.`, rows: [[...a]], tones: { ...range(0, miss - 1, 0, "done"), [`0:${miss}`]: "bad" } });
  return { kind: "cells", title: "Cyclic sort: swap every value to index value - 1", rows: [arr], frames };
}

function inversionViz(arr: number[]): Diagram {
  const a = [...arr], frames: CellsFrame[] = [];
  let total = 0;
  frames.push({ note: "Split into halves down to single values, then merge back. A right value that jumps ahead of k waiting left values closes k inversions at once.", rows: [[...a]] });
  const sort = (lo: number, hi: number) => {
    if (hi - lo < 2) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid); sort(mid, hi);
    const left = a.slice(lo, mid), right = a.slice(mid, hi), out: number[] = [], jumps: string[] = [];
    let i = 0, j = 0, inv = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) out.push(left[i++]);
      else { inv += left.length - i; jumps.push(`${right[j]} passes ${left.length - i}`); out.push(right[j++]); }
    }
    out.push(...left.slice(i), ...right.slice(j));
    a.splice(lo, out.length, ...out);
    total += inv;
    frames.push({ note: `Merge [${left.join(", ")}] and [${right.join(", ")}]: ${inv ? `${jumps.join(", ")}, so +${inv}` : "no right value jumps ahead, +0"}. Total ${total}.`, rows: [[...a]], tones: range(lo, hi - 1, 0, inv ? "active" : "window") });
  };
  sort(0, a.length);
  frames.push({ note: `Sorted, with ${total} inversions counted in O(n log n) instead of checking all ${(a.length * (a.length - 1)) / 2} pairs.`, rows: [[...a]], tones: range(0, a.length - 1, 0, "done") });
  return { kind: "cells", title: "Merge sort counts inversions while it merges", rows: [arr], frames };
}

function majorityViz(arr: number[]): Diagram {
  const frames: CellsFrame[] = [], cands: (string | number)[] = arr.map(() => ""), counts: (string | number)[] = arr.map(() => "");
  let cand = arr[0], count = 0;
  arr.forEach((x, i) => {
    const fresh = count === 0;
    if (fresh) cand = x;
    count += x === cand ? 1 : -1;
    cands[i] = cand; counts[i] = count;
    const note = fresh ? `count is 0, so ${x} becomes the candidate. count = 1.` : x === cand ? `${x} matches the candidate: count rises to ${count}.` : `${x} differs: it cancels one vote for ${cand}. count = ${count}.`;
    frames.push({ note, rows: [arr, [...cands], [...counts]], tones: { [`0:${i}`]: x === cand ? "found" : "bad", [`2:${i}`]: "active" } });
  });
  const c = arr.filter((x) => x === cand).length, ok = 2 * c > arr.length;
  frames.push({ note: `Survivor: ${cand}. A second pass counts it: ${c} of ${arr.length}, ${ok ? "more than half, so it is the majority." : "not more than half, so there is no majority."}`, rows: [arr, [...cands], [...counts]], tones: tones(arr.map((x, i) => [`0:${i}`, x === cand ? "found" : "muted"])) });
  return { kind: "cells", title: "Boyer-Moore vote: different values cancel in pairs", rowLabels: ["nums", "cand", "count"], rows: [arr, arr.map(() => ""), arr.map(() => "")], frames };
}

function fenwickViz(arr: number[]): Diagram {
  const n = arr.length, t: number[] = Array(n + 1).fill(0), frames: CellsFrame[] = [];
  const idx = Array.from({ length: n }, (_, i) => i + 1);
  const rows = () => [idx, arr, t.slice(1)];
  arr.forEach((v, i0) => {
    const touched: number[] = [];
    for (let i = i0 + 1; i <= n; i += i & -i) { t[i] += v; touched.push(i); }
    frames.push({ note: `add(${i0}, ${v}): write t at ${touched.join(", ")} (each step adds the lowest set bit). ${touched.length} writes, about log n.`, rows: rows(), tones: { [`1:${i0}`]: "active", ...tones(touched.map((i) => [`2:${i - 1}`, "found"])) } });
  });
  const prefix = (i: number) => { const seen: number[] = []; let s = 0; for (; i > 0; i -= i & -i) { s += t[i]; seen.push(i); } return { s, seen }; };
  const l = n >= 4 ? 1 : 0, r = n >= 4 ? n - 2 : n - 1, A = prefix(r + 1), B = prefix(l);
  frames.push({ note: `prefix(${r + 1}) = sum of a[0..${r}]: read t at ${A.seen.join(", ")} (each step drops the lowest set bit) = ${A.s}.`, rows: rows(), tones: tones(A.seen.map((i) => [`2:${i - 1}`, "window"])) });
  frames.push({ note: B.seen.length ? `prefix(${l}) = sum of a[0..${l - 1}]: read t at ${B.seen.join(", ")} = ${B.s}.` : "prefix(0) is the empty sum, 0.", rows: rows(), tones: tones(B.seen.map((i) => [`2:${i - 1}`, "bad"])) });
  frames.push({ note: `rangeSum(${l}, ${r}) = ${A.s} - ${B.s} = ${A.s - B.s}. Queries and updates are both O(log n).`, rows: rows(), tones: range(l, r, 1, "found") });
  return { kind: "cells", title: "Fenwick tree: prefix sums that survive updates", rowLabels: ["index", "a", "t"], rows: [idx, arr, Array(n).fill(0)], frames };
}

function segViz(arr: number[]): Diagram {
  const n = arr.length, nodes: { id: number; label: string; parent: number | null; side?: "L" | "R" }[] = [];
  const span: Record<number, [number, number]> = {}, sum: Record<number, number> = {}, order: number[] = [];
  const make = (node: number, lo: number, hi: number, parent: number | null, side?: "L" | "R") => {
    span[node] = [lo, hi];
    nodes.push({ id: node, label: lo === hi ? `${lo}` : `${lo}-${hi}`, parent, side });
    if (lo === hi) { sum[node] = arr[lo]; return; }
    const mid = (lo + hi) >> 1;
    make(2 * node, lo, mid, node, "L");
    make(2 * node + 1, mid + 1, hi, node, "R");
    sum[node] = sum[2 * node] + sum[2 * node + 1];
    order.push(node);
  };
  make(1, 0, n - 1, null);
  const frames: TreeFrame[] = [], known: Record<number, string> = {};
  const leaves = nodes.filter((x) => span[x.id][0] === span[x.id][1]).map((x) => x.id);
  leaves.forEach((id) => (known[id] = String(sum[id])));
  frames.push({ note: `Each leaf holds one value: [${arr.join(", ")}]. Labels show the index range a node covers.`, badges: { ...known }, tones: Object.fromEntries(leaves.map((id) => [id, "done" as Tone])) });
  for (const id of order) {
    known[id] = String(sum[id]);
    frames.push({ note: `Node ${span[id][0]}-${span[id][1]} = left ${sum[2 * id]} + right ${sum[2 * id + 1]} = ${sum[id]}.`, badges: { ...known }, tones: { [id]: "active", [2 * id]: "done", [2 * id + 1]: "done" } });
  }
  const l = n > 2 ? 1 : 0, r = n > 2 ? n - 2 : n - 1, seen: Record<number, Tone> = {}, used: number[] = [];
  const query = (id: number): void => {
    const [lo, hi] = span[id];
    if (r < lo || hi < l) { seen[id] = "muted"; frames.push({ note: `${lo}-${hi} is outside [${l}, ${r}]: contributes 0, stop here.`, badges: { ...known }, tones: { ...seen } }); return; }
    if (l <= lo && hi <= r) { seen[id] = "found"; used.push(id); frames.push({ note: `${lo}-${hi} lies inside [${l}, ${r}]: take its stored sum ${sum[id]} without going deeper.`, badges: { ...known }, tones: { ...seen } }); return; }
    seen[id] = "active";
    frames.push({ note: `${lo}-${hi} overlaps [${l}, ${r}] only partly: ask both children.`, badges: { ...known }, tones: { ...seen } });
    query(2 * id); query(2 * id + 1);
  };
  query(1);
  const total = used.reduce((s, id) => s + sum[id], 0);
  frames.push({ note: `query(${l}, ${r}) = ${used.map((id) => sum[id]).join(" + ")} = ${total}. At most about 4 log n nodes are visited.`, badges: { ...known }, tones: Object.fromEntries(used.map((id) => [id, "found" as Tone])) });
  return { kind: "tree", title: `Segment tree: build, then sum of a[${l}..${r}]`, nodes, frames };
}

const round = (v: number[]) => v.map((x) => Math.round(x));

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 10, name: "Cyclic sort", summary: "When the values are 1..n (or 0..n), each value has a home index. Swap values home in one pass, and the array itself answers 'what is missing or repeated'.",
    signals: ["values in the range 1..n or 0..n", "first missing positive in O(1) extra space", "find all missing or duplicated numbers", "do not use extra memory, may modify the input"],
    idea: ["Value v belongs at index v - 1. Look at a[i]: if it is in range and its home does not already hold v, swap it home. The value that arrives at i is new, so check i again before moving on.", "After the pass, every value that could be placed is at its home. Scanning for the first index i with a[i] != i + 1 gives the first missing positive, and the value sitting there is a duplicate or an out-of-range value."],
    steps: ["for i in range(n):", "  while 1 <= a[i] <= n and a[a[i] - 1] != a[i]: swap a[i] home", "scan: the first i with a[i] != i + 1 is the answer i + 1", "if none, the answer is n + 1"],
    code: `def first_missing_positive(a):
    n = len(a)
    for i in range(n):
        while 1 <= a[i] <= n and a[a[i] - 1] != a[i]:
            j = a[i] - 1                  # take the target index first
            a[i], a[j] = a[j], a[i]
    for i in range(n):
        if a[i] != i + 1:
            return i + 1
    return n + 1`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "The while loop looks quadratic, but every swap puts one value in its final place, so there are at most n swaps in total." },
    traps: ["In Python, a[i], a[a[i] - 1] = a[a[i] - 1], a[i] assigns a[i] first and then uses the NEW a[i] as the index. Save j = a[i] - 1 before swapping.", "Without the a[a[i] - 1] != a[i] guard, a duplicate swaps with its twin forever.", "Values can be 0, negative or larger than n; skip them, do not index with them."],
    viz: { make: (i) => cyclicViz(round(nums(i, [4, 3, -1, 1, 7, 2], 10))), input: "4, 3, -1, 1, 7, 2", label: "numbers" },
    theory: [
      "Why it is linear: a swap only happens when a value is not at home and its home holds something else. After the swap that value is at home for good and is never moved again. There are at most n values that can be placed, so at most n swaps happen over the whole run, plus n visits by the outer loop. The total is O(n) even though there is a loop inside a loop.",
      "The array becomes its own hash set. Index v - 1 answers 'is v present?' once the pass is done, which is the trick that removes the O(n) set a simpler solution would use. The price is that the input is modified; say so in an interview, and restore it if the caller needs it.",
      "Recognise it by values tied to the range of indices: 1..n, 0..n, or 'n + 1 numbers in 1..n'. Variants read the result differently: the first wrong slot gives the first missing positive; every wrong slot gives all missing numbers (and the values found there are the duplicates); Missing Number on 0..n is the same with home index v.",
      "A cousin technique marks presence by sign: for each v, make a[abs(v) - 1] negative. It also uses O(1) extra space and avoids swaps, but only works when all values are positive to begin with. Find the Duplicate Number forbids modifying the array, and there the values are read as next pointers and Floyd's cycle detection finds the repeat.",
      "Edge cases: an empty array (answer 1), all values present (answer n + 1), duplicates, and values far outside the range. The most common bug is the Python swap order described in the traps; the second is advancing i after a swap, which leaves the newly arrived value unplaced.",
      "If the values are not tied to positions, cyclic sort does not apply, and sorting (O(n log n)) or a hash set (O(n) space) is the honest answer. Knowing when the range condition holds is the whole recognition step.",
    ],
  },
  {
    n: 11, name: "Monotonic deque", summary: "Keep window indices in a deque whose values only fall from front to back. The front is the window's maximum; new values evict smaller ones from the back, old indices leave from the front.",
    signals: ["maximum or minimum of every window of size k", "longest subarray where max - min <= limit", "shortest subarray with sum at least k (with negatives)", "DP where dp[i] needs the best of the last k states"],
    idea: ["When a new value x arrives, every older value that is <= x can never be a window maximum again: x is larger and will stay in the window longer. Pop them from the back, then push x.", "The deque therefore holds candidates in decreasing value order, so the front is the maximum. When the front index falls out of the window, pop it from the front."],
    steps: ["for i, x in enumerate(a):", "  pop the front if it is i - k or older", "  pop the back while a[back] <= x, then push i", "  once i >= k - 1, record a[front]"],
    code: `from collections import deque
def max_sliding_window(a, k):
    dq, out = deque(), []             # indices; their values fall from front to back
    for i, x in enumerate(a):
        if dq and dq[0] <= i - k:
            dq.popleft()              # the front slid out of the window
        while dq and a[dq[-1]] <= x:
            dq.pop()                  # beaten by a newer, larger value
        dq.append(i)
        if i >= k - 1:
            out.append(a[dq[0]])
    return out`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(k)", note: "Each index is pushed once and popped at most once, from one end or the other." },
    traps: ["Store indices, not values: you need them to tell when the front has left the window.", "Use <= when popping for a maximum so equal values do not pile up; either works, but be consistent.", "For a minimum, flip the comparison. For max - min problems, keep two deques at once."],
    viz: { make: (i) => { const v = nums(i, [1, 3, -1, -3, 5, 3, 6, 7, 3], 12); const ok = v.length >= 7; const a = ok ? v.slice(0, -1) : [1, 3, -1, -3, 5, 3, 6, 7]; const k = ok ? Math.max(1, Math.min(a.length, Math.round(v[v.length - 1]))) : 3; return S.monoDeque(a, k); }, input: "1, 3, -1, -3, 5, 3, 6, 7, 3", label: "numbers, last value = k (at least 6 numbers)" },
    theory: [
      "The invariant has two parts. The deque holds indices in increasing order (older at the front), and their values are strictly decreasing from front to back. Together they mean the front is the oldest surviving candidate and also the largest, so it is the window maximum.",
      "Why popping is safe: if j < i and a[j] <= a[i], then in every future window that contains j, i is also there (it is newer) and is at least as large. So j can never be the answer again and can be thrown away. This 'dominated element' argument is the same one behind the monotonic stack; the deque only adds the ability to expire old items from the other end.",
      "Complexity: each index enters once and leaves once, so the total number of deque operations is at most 2n, giving O(n) time. A heap would give O(n log n) with lazy deletion, and recomputing each window gives O(n x k).",
      "Recognise it by 'best value over a sliding range' where the range moves forward. Beyond window max and min, it powers DP transitions of the form dp[i] = a[i] + max(dp[i - k..i - 1]) (Jump Game VI, Constrained Subsequence Sum), and 'shortest subarray with sum at least k' with negative numbers, where the deque holds increasing prefix sums.",
      "Maximum Sum Circular Subarray fits too: with prefix sums over the doubled array, the best subarray ending at i of length at most n is P[i] minus the smallest prefix in the last n positions, which a deque of increasing prefixes keeps in O(1) amortised per step.",
      "Edge cases: k = 1 (every value is its own max), k = n (one window), and equal values. The usual wrong approach keeps one 'current max' variable, which breaks the moment that max slides out. Another is popping from the front before checking for expiry by index, which compares values when it should compare positions.",
    ],
  },
  {
    n: 12, name: "Merge sort counting (inversions)", summary: "Merge sort does more than sort: while merging two sorted halves, each time a right value is taken first it is smaller than every left value still waiting, which counts cross pairs in bulk.",
    signals: ["count pairs i < j with a[i] > a[j] (inversions)", "count of smaller numbers after self, reverse pairs", "sort a linked list or a huge array stably", "count range sums within [lower, upper]"],
    idea: ["Every inversion is either inside the left half, inside the right half, or crosses the middle. The first two are counted by the recursive calls. The crossing ones are counted during the merge.", "When right[j] is placed before left[i], it is also smaller than left[i + 1], left[i + 2], and so on, because the left half is sorted. So it closes len(left) - i inversions in one step."],
    steps: ["split in half and recurse on both halves (each returns its sorted list and count)", "merge with two pointers; take left on ties", "when right[j] goes first, add len(left) - i", "return the merged list and the sum of the three counts"],
    code: `def count_inversions(a):
    if len(a) <= 1:
        return a, 0
    mid = len(a) // 2
    left, x = count_inversions(a[:mid])
    right, y = count_inversions(a[mid:])
    out, i, j, inv = [], 0, 0, x + y
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
            inv += len(left) - i      # right[j] is smaller than every left value still waiting
    out += left[i:] + right[j:]
    return out, inv`,
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "log n levels of merging, O(n) work per level. Counting adds O(1) per step of the merge." },
    traps: ["Take the left value on ties (<=), or equal values are counted as inversions.", "The count can reach n(n-1)/2, about 5 x 10^9 for n = 10^5: use 64-bit integers.", "For Reverse Pairs (a[i] > 2 a[j]), count with a separate pointer pass BEFORE merging; the merge condition and the count condition differ."],
    viz: { make: (i) => inversionViz(nums(i, [5, 2, 4, 6, 1, 3, 2], 10)), input: "5, 2, 4, 6, 1, 3, 2", label: "numbers" },
    theory: [
      "Correctness is a counting argument. Split the pairs (i, j) with i < j into three groups: both in the left half, both in the right half, or i on the left and j on the right. The recursive calls count the first two groups. The third group does not depend on the order inside each half, so the halves may be sorted first without changing it, and sorted halves make the count easy.",
      "During the merge, suppose right[j] is placed while left[i..] are still waiting. Since the left half is sorted, left[i] <= left[i + 1] <= ..., and since right[j] < left[i], it is smaller than all of them. That is len(left) - i crossing inversions found with one comparison. Every crossing pair is counted exactly once: when its right element is placed.",
      "Complexity follows the merge sort recurrence T(n) = 2T(n/2) + O(n), which solves to O(n log n). There are log n levels and each level merges n elements in total. The counting adds constant work per merge step, so it is free.",
      "Recognise it by any question about pairs with i < j and an order condition between their values: inversions, count of smaller numbers after self (track original indices through the sort), reverse pairs (a[i] > 2 a[j]) and count of range sums (merge sort over prefix sums, counting pairs whose difference lies in a range). A Fenwick tree over compressed values is the other standard solution to the same family.",
      "Merge sort is also the right sort when stability matters or when there is no random access. Sort List on a linked list is merge sort with fast and slow pointers to split and the two-list merge to combine, O(n log n) time and O(log n) stack.",
      "Typical mistakes: counting during the merge with < instead of <= on ties, overflow in 32-bit counters, and for reverse pairs mixing the counting condition into the merge comparison. Do the counting in its own pass over the two sorted halves, then merge normally.",
    ],
  },
  {
    n: 13, name: "Boyer-Moore majority vote", summary: "Find a value that fills more than half the array in O(n) time and O(1) space: pair off different values so they cancel, and the majority is the only one that can survive.",
    signals: ["element that appears more than n / 2 times", "elements that appear more than n / 3 times (two candidates)", "O(1) extra space required for a frequency question", "a stream where you cannot store counts"],
    idea: ["Keep one candidate and a count. A matching value adds a vote, a different value removes one. When the count hits 0, the next value becomes the new candidate.", "Each decrement cancels one candidate vote against one different value. A value with more than half the elements cannot be cancelled completely, so it is the candidate at the end."],
    steps: ["cand = None, count = 0", "for x: if count == 0: cand = x", "count += 1 if x == cand else -1", "return cand (verify with a second pass if a majority is not guaranteed)"],
    code: `def majority(a):
    cand, count = None, 0
    for x in a:
        if count == 0:
            cand = x                  # all earlier votes cancelled out
        count += 1 if x == cand else -1
    return cand                       # verify with a.count(cand) * 2 > len(a) if a majority is not promised`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "One pass to find the candidate, an optional second pass to verify it." },
    traps: ["Without a guaranteed majority the survivor can be any value; always verify in that case.", "The n / 3 version keeps two candidates and two counts, and must check 'matches a candidate' before 'a count is zero'.", "A hash map count also works in O(n) time, but it costs O(n) memory; the question usually asks for O(1)."],
    viz: { make: (i) => majorityViz(round(nums(i, [2, 2, 1, 1, 1, 2, 2], 11))), input: "2, 2, 1, 1, 1, 2, 2", label: "numbers" },
    theory: [
      "Proof by cancellation. Think of each decrement as deleting a pair of two different values from the array. Deleting such a pair keeps the majority a majority: the pair contains at most one copy of it, so it loses at most one of its m votes while the array loses two of its n elements, and m - 1 > (n - 2) / 2 still holds. When the scan ends, the remaining uncancelled values are all equal to the candidate, and the majority must be among them.",
      "The proof also shows why verification is needed without a guarantee. If no value has more than half, the cancellation still leaves some survivor, but that survivor need not be frequent at all. A second pass that counts the candidate costs O(n) and settles it.",
      "The generalisation: a value that appears more than n / k times survives if you keep k - 1 candidates. Whenever a new value matches none of them and all counts are positive, decrement every count, which cancels k different values at once. For k = 3 that is Majority Element II with two candidates, followed by a verification pass for both.",
      "Recognise it by 'more than half' or 'more than a third' together with a space limit, or by a stream that is too large to count. Single Number and Single Number II use the same cancellation idea with bits: pairs cancel under XOR, and per-bit counts modulo 3 cancel triples. Majority Element II, in the practice list, runs two candidates at once for the more-than-a-third case.",
      "Complexity is O(n) time, O(1) space. Sorting and taking the middle element also finds a guaranteed majority in O(n log n), and a hash map in O(n) time and space; both are fine fallbacks to mention.",
      "Edge cases: a single element, the majority appearing only in the second half (the candidate changes several times, which is fine), and negative or zero values (do not use 0 as 'no candidate' if 0 can be a value; use the count instead).",
    ],
  },
  {
    n: 14, name: "Fenwick tree (range sums with updates)", summary: "A binary indexed tree keeps partial sums in an array so both 'add v at i' and 'sum of the first i values' cost O(log n). Use it when updates and range queries interleave.",
    signals: ["range sum queries mixed with point updates", "count of smaller elements before i (over ranks)", "prefix sums on data that keeps changing", "range updates with point queries (a Fenwick over differences)"],
    idea: ["Index i (1-based) stores the sum of the last lowbit(i) values ending at i, where lowbit(i) = i & -i. So t[8] holds a[1..8], t[6] holds a[5..6] and t[7] holds a[7] alone.", "A prefix sum walks down by removing the lowest set bit: 7 → 6 → 4 → 0, reading t[7] + t[6] + t[4]. An update walks up by adding it: 5 → 6 → 8, writing to every node whose range covers position 5."],
    steps: ["t = [0] * (n + 1)", "add(i, v): i += 1; while i <= n: t[i] += v; i += i & -i", "prefix(i): s = 0; while i > 0: s += t[i]; i -= i & -i", "range(l, r) = prefix(r + 1) - prefix(l)"],
    code: `class Fenwick:
    def __init__(self, n):
        self.t = [0] * (n + 1)        # t[i] = sum of a over (i - lowbit(i), i], 1-based
    def add(self, i, v):              # a[i] += v, i is 0-based
        i += 1
        while i < len(self.t):
            self.t[i] += v
            i += i & -i               # next node whose range covers i
    def prefix(self, i):              # sum of a[0..i-1]
        s = 0
        while i > 0:
            s += self.t[i]
            i -= i & -i               # drop the lowest set bit
        return s
    def range_sum(self, l, r):        # a[l..r]
        return self.prefix(r + 1) - self.prefix(l)`,
    complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(n)", note: "Per add or prefix. Building by n adds is O(n log n); a linear build exists (push each t[i] into its parent i + lowbit(i))." },
    traps: ["The tree is 1-based; index 0 would loop forever because 0 & -0 is 0.", "add takes a DELTA. To set a[i] = v, add v - a[i] and keep a copy of a.", "Fenwick handles sums (and other invertible operations); for range min or max use a segment tree."],
    viz: { make: (i) => fenwickViz(round(nums(i, [5, 2, 9, -3, 5, 20, 10, -7], 8))), input: "5, 2, 9, -3, 5, 20, 10, -7", label: "numbers (up to 8)" },
    theory: [
      "Every positive integer splits into distinct powers of two, and so does every prefix. The prefix a[1..13] with 13 = 8 + 4 + 1 is a[1..8] + a[9..12] + a[13..13], and those three blocks are exactly what t[8], t[12] and t[13] store. Removing the lowest set bit (13 → 12 → 8 → 0) visits them in turn. That is why a prefix query reads at most log2(n) + 1 cells.",
      "Updates go the other way. Position p is covered by t[i] exactly when i - lowbit(i) < p <= i. Starting at i = p and repeatedly adding lowbit(i) visits all such i: each step jumps to the next larger index whose block reaches back past p. Again at most about log2(n) steps.",
      "The trick i & -i isolates the lowest set bit because two's complement negation flips every bit above it and keeps it. That one expression is all the bit manipulation the structure needs.",
      "Recognise it by interleaved updates and prefix or range queries on sums or counts. Common uses: Range Sum Query Mutable; counting inversions or 'smaller numbers after self' by scanning and asking how many seen values are below the current rank; and range updates with point queries by storing a difference array inside the Fenwick tree, so add(l, v), add(r + 1, -v) and prefix(i) reads a[i].",
      "Fenwick or segment tree? A Fenwick tree is shorter and has smaller constants, but it needs an invertible operation, because a range sum is a difference of two prefixes. Range minimum, maximum, or 'assign a range' need a segment tree. If values are large or sparse, compress them to ranks first.",
      "Edge cases: off-by-one between the 0-based array and the 1-based tree (convert in exactly one place), 64-bit sums, and set versus add semantics. When there are no updates at all, plain prefix sums are simpler and faster.",
    ],
  },
  {
    n: 15, name: "Segment tree", summary: "A binary tree over index ranges: each node stores the answer (sum, min, max, count) for its range. Any range splits into O(log n) stored nodes, so queries and updates are both O(log n).",
    signals: ["range min / max / sum queries with updates", "the operation is not invertible (min, max, gcd)", "range updates with range queries (lazy propagation)", "bookings or coverage counts over large coordinate ranges"],
    idea: ["The root covers [0, n - 1]; a node covering [lo, hi] has children [lo, mid] and [mid + 1, hi]. Store the combined answer in each node, built bottom-up.", "To query [l, r]: a node fully inside returns its stored value, a node outside returns the neutral value (0 for sums), and a node that overlaps partly asks both children. To update one index, change the leaf and recompute its ancestors."],
    steps: ["build(node, lo, hi): leaf = a[lo]; else build both halves and combine", "query: disjoint → 0, inside → t[node], partial → left + right", "update: walk to the leaf, set it, recombine on the way back", "use 4n slots for the tree array"],
    code: `class SegTree:
    def __init__(self, a):
        self.n = len(a)
        self.t = [0] * (4 * max(1, self.n))   # t[node] = sum of its range; children 2node, 2node + 1
        if self.n:
            self._build(a, 1, 0, self.n - 1)
    def _build(self, a, node, lo, hi):
        if lo == hi:
            self.t[node] = a[lo]; return
        mid = (lo + hi) // 2
        self._build(a, 2 * node, lo, mid)
        self._build(a, 2 * node + 1, mid + 1, hi)
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]
    def update(self, i, v, node=1, lo=0, hi=None):    # a[i] = v
        if hi is None: hi = self.n - 1
        if lo == hi:
            self.t[node] = v; return
        mid = (lo + hi) // 2
        if i <= mid: self.update(i, v, 2 * node, lo, mid)
        else: self.update(i, v, 2 * node + 1, mid + 1, hi)
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]
    def query(self, l, r, node=1, lo=0, hi=None):     # sum of a[l..r]
        if hi is None: hi = self.n - 1
        if r < lo or hi < l: return 0                 # disjoint
        if l <= lo and hi <= r: return self.t[node]   # fully inside
        mid = (lo + hi) // 2
        return self.query(l, r, 2 * node, lo, mid) + self.query(l, r, 2 * node + 1, mid + 1, hi)`,
    complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(n)", note: "Per query or update; the build is O(n). Lazy propagation keeps range updates at O(log n) too." },
    traps: ["Allocate 4n, not 2n: with n not a power of two the recursive layout needs more than 2n slots.", "Return the operation's neutral value for disjoint nodes: 0 for sum, +infinity for min, -infinity for max.", "With lazy propagation, push pending updates down before visiting children, in both query and update."],
    viz: { make: (i) => segViz(round(nums(i, [5, 2, 9, -3, 5, 20], 8))), input: "5, 2, 9, -3, 5, 20", label: "numbers (up to 8); the query is a[1..n-2]" },
    theory: [
      "Why a query touches only O(log n) nodes: at each depth of the tree, at most two nodes partly overlap [l, r], one at each end of the range. Every other node at that depth is either fully inside (and returns at once) or fully outside (and returns at once). With about log n depths, the walk visits at most about 4 log n nodes.",
      "Correctness: the recursion splits [lo, hi] into [lo, mid] and [mid + 1, hi], which cover it exactly with no overlap, so the answer for any range is the combination of the answers for the stored pieces that tile it. This only needs the operation to be associative (sum, min, max, gcd, count, matrix product), not invertible. That is the main advantage over a Fenwick tree.",
      "Lazy propagation handles range updates. A node that is fully covered by an update records the change in a 'pending' tag instead of passing it to all its descendants. Before any later visit goes below that node, the tag is pushed to the two children. Each range update then also touches O(log n) nodes. My Calendar III (range add, global max) is the textbook case.",
      "Recognise it by range queries plus updates where prefix sums break down, or where the operation is min or max. For huge coordinates (times up to 10^9) either compress the coordinates first or build the tree dynamically, creating children only when a range is first split.",
      "Complexity: O(n) to build, because each of the about 2n nodes is combined once; O(log n) per query and per update; O(n) memory with the 4n array. An iterative bottom-up version uses exactly 2n slots and is faster, but the recursive one is easier to extend with lazy tags.",
      "Edge cases: an empty array, a query with l > r, and the neutral value for disjoint nodes. The common wrong approach for 'range add, range sum' is updating every leaf in the range, which is O(n) per update and defeats the structure.",
    ],
  },
];
