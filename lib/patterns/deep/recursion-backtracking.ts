// Deeper theory for the "recursion-backtracking" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram } from "../../diagram";
import { nums, type Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "A recursive function is proved correct the same way it is written: by induction. Show the base case returns the right answer. Then assume the call on the smaller input returns the right answer and show that the current call builds a correct answer from it. If both hold, the function is correct for every input size. This is what 'trust the call' means: you never trace the whole stack in your head.",
    "Termination needs a measure that strictly decreases on every call and cannot go below the base case: n for factorial, the list length for reversing a list, the number of digits for digit sums. If some path of calls does not shrink the measure, or skips past the base case (n jumping from 1 to -1), the recursion never stops.",
    "Cost comes from a recurrence. T(n) = T(n - 1) + O(1) gives O(n) time. T(n) = T(n - 1) + O(n), which happens when each call copies or slices its input, gives O(n²). Space is the maximum depth times the frame size, so linear recursion uses O(n) stack even when the loop version needs O(1).",
    "Where the work happens matters. Work before the call runs on the way down (it sees elements first to last). Work after the call runs on the way back up (last to first). Reversing a linked list recursively relies on the second: when the call returns, the rest of the list is already reversed and the current node only needs to be attached at the end.",
    "Tail recursion, where the recursive call is the last action, can be turned into a loop by the compiler in some languages, but not in Python or Java, and C++ compilers do it only with optimisation on. For deep inputs (10⁴ or more in Python), write the loop yourself. The k-th symbol in grammar shows how recursion can also skip work: row n depends only on one position in row n - 1, so the recursion is O(n), not O(2ⁿ).",
    "Linear recursion is the simplest form of the call stack. Two calls per level give divide and conquer or a recursion tree, which memoisation and backtracking build on.",
  ],
  2: [
    "Recursion on two bounds carries a range (l, r) as the state. The invariant is that everything outside the range is already handled: for reversing, positions before l and after r already hold their final values. Each call handles the two ends and recurses on (l + 1, r - 1), so the range shrinks by 2 each time and the invariant holds by induction.",
    "The base case `l >= r` covers both parities at once. For an odd length the bounds meet on the middle element, which needs nothing. For an even length they cross. Using `l == r` alone misses the even case and runs past the middle.",
    "Cost: n / 2 calls, each O(1), so O(n) time and O(n) stack. Slicing (`s[1:-1]`) instead of passing indices copies the string every call, which makes the total O(n²) and is the most common way to turn a linear algorithm quadratic without noticing.",
    "Variants. A recursive palindrome check returns False at the first mismatch and short-circuits. 'Valid palindrome II' (one deletion allowed) branches once at the first mismatch into (l + 1, r) and (l, r - 1), each checked without further deletions, so it stays O(n). Swapping pairs in a linked list is the same idea on (node, node.next).",
    "Two-bound recursion is the shape of many bigger algorithms. Binary search recurses on half of [l, r]. Divide and conquer splits [l, r] at the middle. Interval DP solves every [l, r] and reuses the answers. Learning to reason about a range with an invariant here carries over directly.",
  ],
  3: [
    "Divide and conquer splits a problem into independent subproblems of the same kind, solves them recursively, and combines the results. It is correct when the subproblems really are independent and the combine step produces the right answer from correct sub-answers; the proof is induction on size, with the base case usually size 0 or 1.",
    "The Master theorem gives the cost of T(n) = a · T(n / b) + f(n). Compare f(n) with n^(log_b a). If f is smaller, the leaves dominate and T = O(n^(log_b a)). If they are equal, every level costs the same and T = O(f(n) · log n). If f is larger, the top dominates and T = O(f(n)). Merge sort (a = 2, b = 2, f = n) is O(n log n); binary search and fast power (a = 1, b = 2, f = 1) are O(log n).",
    "Merge sort's combine step is the merge, linear in the total length. Counting inversions piggybacks on it: when an element of the right half is placed before the remaining left elements, it forms an inversion with each of them, so add `len(L) - i`. Any 'count pairs (i < j) with a condition' over two sorted halves can be counted during the merge.",
    "Quicksort and quickselect divide unevenly. A good pivot splits near the middle, giving O(n log n) and O(n). A bad pivot (the smallest every time) gives n levels: O(n²). A random pivot makes the expected cost O(n log n) for sorting and O(n) for selection on every input.",
    "When the subproblems overlap, divide and conquer recomputes them, and memoisation turns it into DP. 'Different ways to add parentheses' splits at every operator and recurses on both sides; caching results by the substring removes the repeated work. 'Unique binary search trees II' builds all trees for a range by choosing each root.",
    "Divide and conquer sits between recursion and DP. It also underlies segment trees (each node is the combine of its two halves), the closest pair of points, and the D&C version of maximum subarray, where the answer either lies in one half or crosses the middle.",
  ],
  4: [
    "Memoisation is correct when the recursive function is pure: its result depends only on its arguments, not on anything that changes during the search. Then the first time a state is solved, the answer can be stored and returned for every later call with the same arguments. If the function reads or writes outside state (a path list, a global counter), caching gives wrong results.",
    "The cost becomes the number of distinct states times the work per state, plus the stack. Fibonacci has n states with O(1) work: O(n) instead of O(2ⁿ). Word break has n start positions, each trying up to n end positions: O(n²) (times the substring cost). Write the state count down before coding; it tells you if the approach fits the limits.",
    "Pick the state as the smallest set of arguments that determines the answer. Values that never change do not belong in the key. Lists cannot be dictionary keys; pass an index instead, or a tuple, or a bitmask for a set of small size. In C++ use a vector filled with a sentinel, and pick a sentinel that is not a valid answer (-1 fails when -1 can be an answer).",
    "Top-down and bottom-up compute the same table. Top-down only visits states reachable from the start, which can be far fewer, and the order of evaluation comes for free. Bottom-up needs an explicit order (smaller states first) but has no recursion limit and often lets you keep only the last row or two of the table.",
    "Pitfalls: Python's recursion limit (about 1000 by default), a cache shared across test cases when it lives on a class or module, and forgetting that `functools.cache` holds every result in memory. In LeetCode classes, define the memoised helper inside the method so each call gets a fresh cache.",
    "Memoisation is the bridge from recursion to dynamic programming. Every DP pattern can be written as a memoised recursion first, which is often the easiest way to get the transitions right before turning it into a table.",
  ],
  5: [
    "Backtracking is a depth-first search over partial solutions. Each node of the search tree is a partial candidate; each edge adds one choice. The shared path list always equals the choices on the way from the root to the current node, because every append is undone by a matching pop after the recursive call. That invariant is what lets one list serve the whole search.",
    "Correctness has two parts: every valid answer must correspond to some leaf (completeness), and each leaf must be reached once (no duplicates). Subsets by include or exclude at each index meet both: each subset is one sequence of n decisions. Combinations use a start index so that each set is generated in one order only. Permutations use a used array so each element appears once per path.",
    "Counting the leaves gives the cost. Subsets: 2ⁿ leaves, each copied in O(n). Combinations of k from n: C(n, k). Permutations: n!. N-Queens: at most n! placements, pruned heavily. These are exponential by nature; the only question is how much pruning cuts the real tree.",
    "Pruning removes subtrees that cannot contain an answer. Sort candidates so that once one is too big, every later one is too (break, not continue). Keep constraint sets for O(1) checks: in N-Queens, columns, `r + c` diagonals and `r - c` anti-diagonals. Check the constraint before recursing, not at the leaf, so invalid partial paths stop early.",
    "Duplicates in the input create identical subtrees. Sort first, then at each level skip a value equal to the previous sibling (`i > start and a[i] == a[i - 1]`). The same value at the same depth would rebuild the same set of results, so skipping it removes exact duplicates and nothing else. For permutations with duplicates, skip a value when its equal predecessor is not currently used.",
    "If the question asks only for a count or a best value, not the list of solutions, backtracking often repeats states, and memoisation (DP) is the better tool. If n is around 40 and you must pick a subset, meet in the middle (pattern 6) splits the search into two halves of 2^(n/2).",
  ],
};

/* ---------- visualiser for the new pattern ---------- */

const sums = (a: number[]) => a.reduce((acc, x) => [...acc, ...acc.map((s) => s + x)], [0]);

function mitmViz(a = [3, 9, 7, 2, 5, 8], goal = 20): Diagram {
  const h = a.length >> 1, L = sums(a.slice(0, h)), R = [...new Set(sums(a.slice(h)))].sort((x, y) => x - y);
  const W = Math.max(L.length, R.length), pad = (v: number[]) => [...v, ...Array(W - v.length).fill("")];
  const rows = [pad(L), pad(R)], frames: CellsFrame[] = [];
  frames.push({ note: `Split [${a.join(", ")}] into [${a.slice(0, h).join(", ")}] and [${a.slice(h).join(", ")}]. Left half: all ${L.length} subset sums`, rows, tones: Object.fromEntries(L.map((_, i) => [`0:${i}`, "window"])) });
  frames.push({ note: `Right half: all subset sums, sorted (${R.length} distinct) so we can binary search them`, rows, tones: Object.fromEntries(R.map((_, i) => [`1:${i}`, "window"])) });
  let best = Math.abs(goal), bestAt: [number, number] = [0, 0];
  L.forEach((s, i) => {
    let lo = 0, hi = R.length; while (lo < hi) { const m = (lo + hi) >> 1; if (R[m] < goal - s) lo = m + 1; else hi = m; }
    const cand = [lo - 1, lo].filter((j) => j >= 0 && j < R.length), j = cand.reduce((b, k) => (Math.abs(s + R[k] - goal) < Math.abs(s + R[b] - goal) ? k : b), cand[0]);
    const d = Math.abs(s + R[j] - goal); if (d < best) { best = d; bestAt = [i, j]; }
    frames.push({ note: `Left sum ${s} needs ${goal - s}. Binary search lands next to ${R[j]}: total ${s + R[j]}, off by ${d}. Best so far ${best}`, rows, tones: { [`0:${i}`]: "active", [`1:${j}`]: d === 0 ? "found" : "active" } });
  });
  frames.push({ note: `Closest total to ${goal}: ${L[bestAt[0]]} + ${R[bestAt[1]]} (difference ${best}). 2 · 2^(n/2) sums instead of 2ⁿ subsets`, rows, tones: { [`0:${bestAt[0]}`]: "found", [`1:${bestAt[1]}`]: "found" } });
  return { kind: "cells", title: "Meet in the middle: two half-lists of subset sums", rowLabels: ["left sums", "right sorted"], rows, frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 6, name: "Meet in the middle", summary: "When 2ⁿ is too many but 2^(n/2) is fine (n up to about 40), enumerate each half separately, sort one side, and combine the halves with binary search or two pointers.",
    signals: ["n ≤ 40 and you must choose a subset", "closest subset sum to a goal", "split an array into two parts with sums as close as possible", "count subsets with sum at most a limit"],
    idea: ["Any subset of the whole array is a subset of the left half plus a subset of the right half.", "List all 2^(n/2) sums of each half. Sort the right list.", "For each left sum s, the best partner is the right sum closest to goal - s: binary search for it (or sweep two pointers over both sorted lists)."],
    steps: ["left = subset sums of a[:n/2]; right = sorted subset sums of a[n/2:]", "for s in left: i = bisect_left(right, goal - s)", "check right[i - 1] and right[i]", "keep the best |s + r - goal|"],
    code: `from bisect import bisect_left
def subset_sums(a):
    sums = [0]
    for x in a:
        sums += [s + x for s in sums]     # every old subset, with and without x
    return sums

def closest_subset_sum(nums, goal):
    half = len(nums) // 2
    left = subset_sums(nums[:half])
    right = sorted(subset_sums(nums[half:]))
    best = abs(goal)                      # the empty subset
    for s in left:
        i = bisect_left(right, goal - s)
        for j in (i - 1, i):
            if 0 <= j < len(right):
                best = min(best, abs(s + right[j] - goal))
    return best`,
    complexity: { best: "O(2^(n/2) · n)", average: "O(2^(n/2) · n)", worst: "O(2^(n/2) · n)", space: "O(2^(n/2))", note: "Sorting 2^(n/2) sums costs 2^(n/2) · n/2. For n = 40 that is about a million sums per side, compared with 10¹² subsets." },
    traps: ["Check BOTH neighbours of the binary search position; the closest value can be just below or just above.", "Building sums with recursion and string or list copies is far slower than the doubling loop.", "When the two parts must have equal sizes (partition into two arrays of n/2), group the half-sums by how many elements they use and only pair counts k and n/2 - k."],
    viz: { make: (i) => { const v = nums(i, [3, 9, 7, 2, 5, 8, 20], 9); const goal = v.length > 1 ? v[v.length - 1] : 20; return mitmViz(v.length > 1 ? v.slice(0, -1).slice(0, 8) : [3, 9, 7, 2, 5, 8], goal); }, input: "3, 9, 7, 2, 5, 8, 20", label: "numbers, then the goal last" },
    theory: [
      "Brute force over subsets is 2ⁿ, hopeless at n = 40 (about 10¹²). Meet in the middle cuts the exponent in half. Every subset of the whole array splits uniquely into a subset of the first half and a subset of the second half, and its sum is the sum of the two parts. So the question 'is there a subset with a sum near goal' becomes 'is there a pair (left sum, right sum) whose total is near goal', which is a two-list search problem.",
      "Why the search over pairs is correct. Fix a left sum s. Among all right sums r, |s + r - goal| is smallest when r is closest to goal - s. In a sorted list the closest values to a target are the two around its insertion point, so checking indices i - 1 and i is enough. Doing this for every s examines the best partner of every left sum, so the overall best pair is found.",
      "Complexity. Each half has 2^(n/2) subsets. Building their sums with the doubling loop is O(2^(n/2)). Sorting the right list costs O(2^(n/2) · n/2), and each binary search O(n/2). For n = 40 this is about 2 × 10⁶ sums and roughly 4 × 10⁷ steps: fast. Memory is O(2^(n/2)), which is the price of the speedup.",
      "Variants. Counting subsets with sum at most a limit uses `bisect_right(right, limit - s)` and adds the counts. Exact-sum questions can use a hash map of right sums. Two-pointer sweeps over two sorted lists replace the binary searches when both lists are sorted. Splitting into two equal-size groups with sums as close as possible stores, for each count k, the sorted sums of left subsets of size k, and pairs size k with size n/2 - k.",
      "Recognise it from the constraints: n between about 25 and 45 with a subset choice is the strongest hint, because 2ⁿ is too slow there but 2^(n/2) is easy. If the values are small (sums up to about 10⁵), knapsack DP over sums may be simpler; if n is small (under 20), plain bitmask enumeration is fine.",
      "Meet in the middle is the same idea as two-sum: instead of trying every pair, store one side so each element of the other side can find its partner fast. It also appears in bidirectional BFS, which grows searches from both ends so each only has to go half the depth.",
    ],
  },
];
