// Deeper theory for the "dp" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram, TableFrame, Tone, TreeFrame } from "../../diagram";
import { levelTree } from "../../sim";
import { nums, type Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "Dynamic programming works when two things hold. Optimal substructure: the best answer for a prefix is built from best answers of shorter prefixes. Overlapping subproblems: the same smaller prefixes are needed again and again, so computing each once pays off. A 1D DP is the simplest case, with one state per index.",
    "To find the transition, look at the last decision. For house robber, the last house is either robbed (then the house before it is not, and the rest is dp[i - 2]) or skipped (the rest is dp[i - 1]). These cases cover every valid plan, so taking the best of them is correct. For counting problems such as climbing stairs and decode ways, the cases must also be disjoint, or some plans are counted twice.",
    "Cost is the number of states times the work per state. Climbing stairs and house robber do O(1) work per index, so O(n) time. Word break tries every split point j before i, so O(n²) checks (times the substring lookup). When dp[i] only reads a fixed number of earlier entries, keep that many variables and the space drops to O(1).",
    "Write down what dp[i] means in one sentence before anything else: 'the best total for houses 0..i' or 'the number of ways to decode the first i characters'. Most off-by-one errors come from mixing 'first i items' (with dp[0] the empty prefix) and 'up to index i'. The first convention usually gives cleaner base cases.",
    "Variants. Decode ways adds validity checks: a single digit is valid unless it is 0, a pair is valid from 10 to 26. House robber II on a circle cannot take both the first and last house, so run the linear version twice, once without each end. Delete and earn becomes house robber after grouping equal values into buckets by value. Perfect squares is an unbounded knapsack where the items are the square numbers.",
    "1D DP is the starting point for the rest of the topic. Knapsack adds a capacity dimension, LCS uses two prefixes, state machines add a small state per index, and interval DP uses ranges instead of prefixes.",
  ],
  2: [
    "The 0/1 knapsack state is dp[i][c], the best value using only the first i items with capacity c. Item i is either left out (dp[i - 1][c]) or taken (dp[i - 1][c - w] + v, if it fits). Every selection falls into one of the two cases, so the maximum of the two is the best, by induction on i.",
    "The 1D version keeps only one row and updates it in place, and the loop direction decides what dp[c - w] means at the moment it is read. Going downward over c, dp[c - w] has not been updated yet for this item, so it still holds row i - 1: each item is used at most once. Going upward, dp[c - w] may already include item i, so the item can be taken again: that is the unbounded knapsack.",
    "Counting ways has one more subtlety. In coin change II, looping over coins on the outside and amounts on the inside counts each combination once, because coins are added in a fixed order. Swapping the loops counts ordered sequences instead, which is a different problem (combination sum IV). Decide whether order matters before choosing the loop nesting.",
    "Many problems are knapsack after a small reduction. Partition equal subset sum: is there a subset with sum total / 2. Target sum: with P the sum of plus signs and N of minus signs, P - N = target and P + N = total, so P = (target + total) / 2, a subset count. Last stone weight II: split into two groups with sums as close as possible, so find the reachable subset sum closest to total / 2. Ones and zeroes is a knapsack with two capacities.",
    "Complexity is O(n · C) time and O(C) space. That is pseudo-polynomial: it is fast when C is small (up to around 10⁵ or 10⁶ cells in total), but C is a value, not an input length, and knapsack in general is NP-hard. If C is huge but n is about 40, meet in the middle is the alternative.",
    "Initial values encode the question. For 'maximum value with capacity at most c', start every dp[c] at 0. For 'exactly c', start with dp[0] = 0 and everything else at minus infinity. For 'fewest coins', start at infinity with dp[0] = 0. For 'number of ways', dp[0] = 1 and the rest 0.",
  ],
  3: [
    "The O(n²) DP defines dp[i] as the length of the longest increasing subsequence that ends at index i. Any such subsequence of length above one has a previous element j < i with a[j] < a[i], so dp[i] = 1 + max(dp[j]) over those j. The answer is the maximum dp[i]. It is simple and also counts or reconstructs subsequences easily.",
    "The O(n log n) method keeps tails, where tails[k] is the smallest possible last value of an increasing subsequence of length k + 1 seen so far. The list is strictly increasing: a subsequence of length k + 2 contains one of length k + 1 with a smaller last value. When x arrives, it extends exactly the subsequences whose last value is below x; the longest of these has length i = bisect_left(tails, x). So x creates a subsequence of length i + 1 ending in x, which is at most the old tails[i]. Setting tails[i] = x (or appending) restores the invariant.",
    "Because the invariant holds after every element, the length of tails at the end is the LIS length. The values inside tails are not necessarily a real subsequence of the input; to rebuild one, store for each element the index it extended (the element at tails[i - 1] at that moment) and follow those links back from the last one.",
    "Strictly increasing uses bisect_left; non-decreasing allows equal values and uses bisect_right. Russian doll envelopes sorts by width ascending and, for equal widths, height descending; then the LIS on heights cannot pick two envelopes of the same width, because their heights appear in decreasing order.",
    "Variants. Number of LIS keeps a count next to each dp[i] in the O(n²) version and adds counts whenever a tie for the best length appears. Largest divisible subset sorts the numbers so divisibility behaves like 'increasing', then runs the O(n²) DP with `a[i] % a[j] == 0`. The longest chain of pairs and the minimum number of increasing sequences to cover an array are close relatives.",
    "LIS links DP with binary search: the tails list is a sorted structure updated by lower bound. The same 'keep the best end for each length' idea appears in patience sorting and in Dilworth's theorem.",
  ],
  4: [
    "Two-string DP uses prefixes: dp[i][j] is the answer for the first i characters of a and the first j of b. The transition looks at the last characters. For LCS, if a[i - 1] == b[j - 1], some longest common subsequence uses both (an exchange argument swaps them in), so dp[i][j] = dp[i - 1][j - 1] + 1. If they differ, at least one of them is unused, so dp[i][j] is the better of dropping one from a or from b.",
    "Edit distance has three operations, which map to three neighbours: delete from a (dp[i - 1][j]), insert into a (dp[i][j - 1]) and replace (dp[i - 1][j - 1]), each costing 1, plus a free diagonal move when the characters match. The base cases are the cost to turn a prefix into the empty string: dp[i][0] = i and dp[0][j] = j.",
    "The table has (m + 1) · (n + 1) cells, each filled in O(1), so O(m · n) time. Row i reads only rows i and i - 1, so two rows of length n + 1 are enough, or one row plus a saved diagonal value. Rebuilding the actual sequence needs the full table (walk back from dp[m][n] following the choice made), or Hirschberg's divide and conquer for linear space.",
    "Many problems are small changes to these two. Minimum deletions to make two strings equal is m + n - 2 · LCS. Shortest common supersequence has length m + n - LCS and is rebuilt by walking the LCS table. Distinct subsequences counts: dp[i][j] = dp[i - 1][j] plus dp[i - 1][j - 1] when the characters match. Longest common substring resets to 0 on a mismatch and takes the maximum anywhere.",
    "Pattern matching (wildcard and regular expressions) uses the same table with special rules: '*' in wildcard matching can match nothing (dp[i][j - 1]) or one more character (dp[i - 1][j]). Interleaving string uses dp[i][j] = 'the first i of a and first j of b can form the first i + j of c'.",
    "Common bugs: indexing the strings with i and j instead of i - 1 and j - 1 inside a 1-based table, base cases left at 0 for edit distance, and the wrong order when rolling rows (the diagonal must be saved before it is overwritten).",
  ],
  5: [
    "When moves only go right or down, the cells form a directed acyclic graph, and row-major order is a topological order: every cell's predecessors (above and left) come earlier. DP over a DAG in topological order is always correct, so dp[r][c] can safely combine dp[r - 1][c] and dp[r][c - 1].",
    "The combine depends on the question: sum for counting paths, min for the cheapest path, and 0 (or infinity) for blocked cells. The first row and column have only one predecessor, which is why they are the base cases. An obstacle in the first row blocks every cell after it in that row, which the general rule handles if you do not hard-code the edges to 1.",
    "Some grids must be filled backwards. In the dungeon game, the health you need at a cell depends on what comes after it, not before, so dp[r][c] = max(1, min(dp[r + 1][c], dp[r][c + 1]) - cell[r][c]), filled from the bottom-right corner. Triangle minimum path sum is also easiest bottom-up: each cell adds the smaller of its two children below, and the top ends with the answer.",
    "Maximal square: dp[r][c] is the side of the largest all-ones square whose bottom-right corner is (r, c). It is 1 + min(up, left, up-left) because a square of side k at (r, c) needs squares of side k - 1 at all three neighbours, and the smallest of the three limits it. The area is the square of the largest side.",
    "Space drops to one row: dp[c] holds the value for the current row once updated and for the previous row until then, so dp[c] += dp[c - 1] reads 'above' and 'left' at the right moments. Unique paths also has a closed form, C(R + C - 2, R - 1), the number of ways to choose which of the moves are downward.",
    "If moves can go in all four directions, the grid has cycles and is not a DAG; then use BFS (fewest steps) or Dijkstra (weighted). Two walkers at once (cherry pickup) use a 3D state (step, r1, r2), since each walker's column follows from step minus row.",
  ],
  6: [
    "Interval DP solves a problem for every contiguous range [i, j]. The answer for a range is built from answers for strictly smaller ranges, usually by choosing a split point k. Filling the table in order of increasing length guarantees every smaller range is ready, which is why the outer loop is the length, not i.",
    "The art is choosing what k means so that the two sides are independent. In matrix chain multiplication, k is the last multiplication performed, which splits the chain into two independent products. In burst balloons, k is the LAST balloon burst inside (i, j): while the others are bursting, k is still there, so the two sides never interact, and when k finally bursts its neighbours are exactly i and j. Choosing k as the first balloon burst would leave the sides dependent.",
    "Cost: there are O(n²) ranges and up to O(n) split points each, so O(n³) time and O(n²) space. Problems where each range has O(1) transitions, such as the longest palindromic subsequence (match the ends, or drop one end), run in O(n²).",
    "Variants. Minimum cost to cut a stick sorts the cut positions and adds 0 and n as boundaries, then dp[i][j] = cost of cutting between cut i and cut j. Unique binary search trees counts trees on a range by choosing the root, which gives the Catalan numbers. Super egg drop is usually solved by flipping the state: the number of floors you can cover with m moves and k eggs, f(m, k) = f(m - 1, k - 1) + f(m - 1, k) + 1.",
    "Pitfalls: wrong fill order, missing padding (burst balloons pads both ends with 1), and confusing substring with subsequence. Palindrome partitioning II looks like interval DP but is really 1D partition DP over prefixes, using an interval table only to know which substrings are palindromes.",
    "Interval DP is divide and conquer with memoisation over ranges. When a problem says 'merge adjacent', 'remove from the middle' or 'parenthesise', it is usually interval DP.",
  ],
  7: [
    "A state-machine DP models each step as a move between a few named states, like an automaton. dp[i][s] is the best value after step i ending in state s, and each state's value comes from the states that have an arrow into it. Correctness is ordinary DP over the pair (step, state): every valid sequence of actions is a path through the automaton, and the recurrence considers every last arrow.",
    "Stock with cooldown has three states. hold: owning a share (keep holding, or buy from rest). sold: just sold today (from hold plus the price). rest: not holding and free to buy (from rest or from yesterday's sold). The cooldown is encoded by the missing arrow from sold straight to hold. Drawing the arrows first makes the code a direct copy.",
    "All states must update from the previous step's values at the same time. In Python a tuple assignment does this; in other languages save the old values in temporaries. Updating hold first and then using the new hold for sold lets a share be bought and sold on the same day.",
    "With at most k transactions, use 2k states: after the j-th buy and after the j-th sell. That is O(n · k) time and O(k) space. The transaction fee version subtracts the fee on one side of each trade only. Best time III is the k = 2 case written with four variables.",
    "Other problems fit the same shape: paint house (the state is the colour of the last house), regular expression and word break (the state is a position in the pattern or the dictionary), and house robber III (the state of each tree node is robbed or not, which is DP on trees). Any time the rules say 'after doing X you cannot do Y next', a state machine is a clean model.",
  ],
  8: [
    "Bitmask DP uses a set as the state, stored as an integer whose bit j says whether item j is in the set. There are 2ⁿ sets, about a million for n = 20, which is the practical limit. Transitions usually add one item to the set, and mask | (1 << j) is always larger than mask, so iterating masks in increasing order processes every set before any set that extends it.",
    "In the assignment problem, the next person to assign is determined by how many jobs are already taken: popcount(mask). So dp[mask] alone is a complete state, giving O(2ⁿ · n) time. When the order of visiting matters, as in the travelling salesman problem or the shortest path visiting all nodes, the state also needs the last node: dp[mask][last], O(2ⁿ · n²).",
    "Shortest path visiting all nodes in an unweighted graph is BFS over states (node, mask), starting from every node with its own bit set. The first time a state with the full mask is popped, its distance is the answer. Partition to k equal subsets can use dp[mask] = how full the current bucket is after placing the items in mask, which is reachable only if the items can be arranged into whole buckets plus a partial one.",
    "Problems that split the items into groups (minimum number of work sessions, stickers to spell a word) enumerate submasks: dp[mask] = min over submasks s of mask that form one valid group of dp[mask ^ s] + 1. Summed over all masks, enumerating submasks costs O(3ⁿ), which is fine for n up to about 15 or 16.",
    "Pitfalls: operator precedence (`mask & 1 << j` means `mask & (1 << j)` in Python, but write the parentheses anyway), forgetting that dp must start with infinity except dp[0], and choosing bitmask DP when n is 30 or more, where 2ⁿ is far too large. Beautiful arrangement is a clean first problem: dp[mask] counts ways to place the numbers in mask into the first popcount(mask) positions.",
  ],
};

/* ---------- visualisers for the new patterns (real runs, one frame per step) ---------- */

function digitDpViz(N = 31415, target = 10): Diagram {
  const d = String(N).split("").map(Number), L = d.length;
  const free = (len: number, s: number): number => { let ways = Array(s + 1).fill(0); ways[0] = 1; for (let k = 0; k < len; k++) { const nx = Array(s + 1).fill(0); for (let t = 0; t <= s; t++) if (ways[t]) for (let x = 0; x <= 9 && t + x <= s; x++) nx[t + x] += ways[t]; ways = nx; } return s >= 0 ? ways[s] : 0; };
  const added: (string | number)[] = d.map(() => ""), running: (string | number)[] = d.map(() => ""), frames: CellsFrame[] = [];
  frames.push({ note: `Count x in [0, ${N}] with digit sum ${target}. Walk the digits of ${N} while staying tight (equal to its prefix)`, rows: [d, added, running] });
  let total = 0, pre = 0;
  for (let i = 0; i < L; i++) {
    let here = 0; for (let x = 0; x < d[i]; x++) if (target - pre - x >= 0) here += free(L - i - 1, target - pre - x);
    total += here; added[i] = here; running[i] = total;
    frames.push({ note: `Position ${i}: a digit below ${d[i]} makes x smaller than ${N} for sure, so the remaining ${L - i - 1} digit${L - i - 1 === 1 ? " is" : "s are"} free. Those free states add ${here}. Stay tight with ${d[i]} (prefix sum ${pre + d[i]})`, rows: [d, [...added], [...running]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found", ...Object.fromEntries(Array.from({ length: i }, (_, k) => [`0:${k}`, "done" as Tone])) } });
    pre += d[i];
  }
  const self = pre === target ? 1 : 0; total += self;
  frames.push({ note: `End of the tight path: ${N} itself has digit sum ${pre}${self ? `, which counts (+1)` : ", which does not count"}. Total ${total}. States: position × sum × tight, each tried with 10 digits`, rows: [d, [...added], [...running]], tones: Object.fromEntries(d.map((_, k) => [`0:${k}`, "done" as Tone])) });
  return { kind: "cells", title: "Digit DP: count numbers up to N by their digits", rowLabels: [`digits of ${N}`, "ways added", "running total"], rows: [d, added, running], frames };
}

function treeRobViz(vals: (number | null)[] = [3, 4, 5, 1, 3, null, 1]): Diagram {
  const { nodes, kids } = levelTree(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}, done: number[] = [];
  const go = (i: number | null): [number, number] => {
    if (i == null) return [0, 0];
    const l = go(kids[i][0]), r = go(kids[i][1]), take = (vals[i] as number) + l[1] + r[1], skip = Math.max(...l) + Math.max(...r);
    badges[i] = `t${take} s${skip}`;
    frames.push({ note: `Node ${vals[i]}: take = ${vals[i]} + children skipped (${l[1]} + ${r[1]}) = ${take}; skip = best of each child (${Math.max(...l)} + ${Math.max(...r)}) = ${skip}`, tones: { ...Object.fromEntries(done.map((x) => [x, "done" as Tone])), [i]: "active" }, badges: { ...badges } });
    done.push(i);
    return [take, skip];
  };
  const [t, s] = go(0);
  frames.push({ note: `Answer = max(take root ${t}, skip root ${s}) = ${Math.max(t, s)}. Two numbers per node, one post-order pass: O(n)`, tones: { 0: "found" }, badges: { ...badges } });
  return { kind: "tree", title: "DP on trees: (take, skip) for every subtree", nodes, frames };
}

function splitViz(a = [7, 2, 5, 10, 8], k = 3): Diagram {
  const n = a.length, pre = [0]; a.forEach((x) => pre.push(pre[pre.length - 1] + x));
  const dp: (number | null)[][] = Array.from({ length: k + 1 }, () => Array(n + 1).fill(null)); dp[0][0] = 0;
  const frames: TableFrame[] = [{ note: `dp[p][i] = smallest possible largest part when a[0..i) is split into p parts. dp[0][0] = 0`, cells: dp.map((r) => r.map((v) => v)) }];
  for (let p = 1; p <= k; p++) for (let i = p; i <= n; i++) {
    let best = Infinity, at = -1;
    for (let j = p - 1; j < i; j++) { const prev = dp[p - 1][j]; if (prev == null) continue; const v = Math.max(prev, pre[i] - pre[j]); if (v < best) { best = v; at = j; } }
    dp[p][i] = best;
    frames.push({ note: `p = ${p}, first ${i}: try every start j of the last part. Best j = ${at}: max(dp[${p - 1}][${at}] = ${dp[p - 1][at]}, sum of [${a.slice(at, i).join(", ")}] = ${pre[i] - pre[at]}) = ${best}`, cells: dp.map((r) => r.map((v) => v)), active: [p, i], deps: [[p - 1, at]] });
  }
  frames.push({ note: `Answer dp[${k}][${n}] = ${dp[k][n]}. O(k · n²) time; binary search on the answer also works for this objective`, cells: dp.map((r) => r.map((v) => v)), active: [k, n] });
  return { kind: "table", title: `Partition DP: split [${a.join(", ")}] into ${k} parts`, rowHead: Array.from({ length: k + 1 }, (_, p) => `${p} parts`), colHead: Array.from({ length: n + 1 }, (_, i) => `first ${i}`), frames };
}

function pascalViz(n = 6): Diagram {
  const C: (number | null)[][] = Array.from({ length: n + 1 }, () => Array(n + 1).fill(null)), frames: TableFrame[] = [];
  for (let i = 0; i <= n; i++) {
    C[i][0] = 1;
    for (let j = 1; j <= i; j++) C[i][j] = (C[i - 1][j - 1] ?? 0) + (j <= i - 1 ? C[i - 1][j]! : 0);
    frames.push({ note: i === 0 ? "C(0, 0) = 1: one way to choose nothing" : `Row ${i}: C(${i}, j) = C(${i - 1}, j - 1) (item ${i} chosen) + C(${i - 1}, j) (not chosen). Row sum ${2 ** i}`, cells: C.map((r) => [...r]), active: [i, Math.min(i, 2)], deps: i >= 1 ? [[i - 1, Math.min(i, 2) - 1], [i - 1, Math.min(i, 2)]] : [] });
  }
  const r = Math.floor(n / 2);
  frames.push({ note: `C(${n}, ${r}) = ${C[n][r]}: also the number of right/down paths through a ${n - r + 1} × ${r + 1} grid (choose which ${r} of ${n} moves go right)`, cells: C.map((x) => [...x]), active: [n, r] });
  return { kind: "table", title: "Pascal's triangle: counting with C(n, k)", rowHead: Array.from({ length: n + 1 }, (_, i) => `n=${i}`), colHead: Array.from({ length: n + 1 }, (_, j) => `k=${j}`), frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 9, name: "Digit DP", summary: "Count numbers up to N with a digit property by building them digit by digit. The state is (position, what the property needs so far, tight), where tight means the prefix still equals N's prefix.",
    signals: ["count integers in [L, R] whose digits satisfy a rule", "numbers with digit sum k, no repeated digits, no two adjacent equal digits", "count numbers whose binary form has a property (set bits prime, no consecutive ones)", "N up to 10¹⁸, far too many to loop over"],
    idea: ["Write N as digits. Choose the digits of x from left to right. While x's prefix equals N's prefix (tight), the next digit can go up to N's digit; otherwise any digit 0..9 is allowed.", "Once a digit is below N's digit, x is already smaller than N, and the rest is free: those free states are shared and memoised.", "Count in a range with f(R) - f(L - 1)."],
    steps: ["d = digits of N", "go(i, state, tight): if i == len(d) → 1 if state is good", "hi = d[i] if tight else 9; sum go(i + 1, next(state, x), tight and x == hi) for x in 0..hi", "answer: go(0, start, True)"],
    code: `from functools import cache
def count_digit_sum(n, target):
    d = list(map(int, str(n)))
    @cache
    def go(i, total, tight):
        if total > target: return 0              # prune: sums only grow
        if i == len(d): return int(total == target)
        hi = d[i] if tight else 9
        return sum(go(i + 1, total + x, tight and x == hi)
                   for x in range(hi + 1))
    return go(0, 0, True)                       # counts x in [0, n]

def count_in_range(lo, hi, target):
    return count_digit_sum(hi, target) - (count_digit_sum(lo - 1, target) if lo > 0 else 0)`,
    complexity: { best: "O(D · S · 10)", average: "O(D · S · 10)", worst: "O(D · S · 10)", space: "O(D · S)", note: "D = number of digits, S = number of values of the property state (here the digit sum). Tight states are only one path, so they add O(D · 10)." },
    traps: ["Leading zeros: if the property cares about them (no repeated digits, adjacent digits), add a 'started' flag to the state so 007 is treated as 7.", "Memoise on the full state including tight, or reset the cache between calls with different N.", "Range counts need f(R) - f(L - 1); remember that f counts 0 as well."],
    viz: { make: (i) => { const [N, s] = nums(i, [31415, 10], 2); return digitDpViz(Math.max(1, Math.min(999999, Math.round(N || 31415))), Math.max(0, Math.min(54, Math.round(s ?? 10)))); }, input: "31415, 10", label: "N, digit sum" },
    theory: [
      "Digit DP turns 'count the numbers up to N with property P' into a walk over the digits. Every x from 0 to N, written with the same number of digits as N (padded with leading zeros), has a first position where it differs from N, and at that position its digit is smaller. Before it, x copies N; after it, any digits are allowed. Grouping numbers by that position gives disjoint groups that cover everything, which is exactly what the tight flag tracks.",
      "The state must hold just enough to finish the check: the position, the part of the property computed so far (sum so far, last digit, a mask of used digits, the remainder modulo m), and tight. When tight is false the remaining digits are unrestricted, so the count depends only on (position, property state); those values are shared by many prefixes and memoising them is what makes the method fast.",
      "Cost: the number of states times 10 choices of digit. For the digit sum, D positions times up to 9 · D sums, about 18 · 162 · 10 for N near 10¹⁸, which is tiny. For 'no repeated digits' the property state is a 10-bit mask of used digits, so 18 · 1024 · 10 operations.",
      "Variants change only the state. Binary digit DP (set bits prime, no two consecutive ones) uses the bits of N and a choice of 0 or 1. 'Divisible by m' keeps the remainder. Counting numbers with at most k nonzero digits keeps the count of nonzero digits. Problems that ask for the k-th such number combine the counts with a greedy walk: at each position, try digits in order and skip whole blocks whose count is less than what is left.",
      "Leading zeros are the classic bug. A number shorter than N is padded with zeros, and for properties like 'all digits distinct' those zeros must not count as used digits. Add a started flag: while it is false, placing a 0 keeps it false and changes nothing else. Another bug is reusing a cache built for one N when computing f(L - 1) for a different bound; include tight in the key and clear the cache, or build the cache inside the function.",
      "Digit DP is memoised recursion (recursion pattern 4) over a cleverly chosen state, and the tight flag is the same 'still equal to the bound' idea used in lexicographic counting problems.",
    ],
  },
  {
    n: 10, name: "DP on trees", summary: "Each node returns a small tuple of answers for its subtree, one per state of the node (taken or not, covered or not), computed from its children's tuples in post-order.",
    signals: ["house robber on a tree (no two adjacent nodes chosen)", "maximum independent set or minimum vertex cover of a tree", "cameras or guards to cover every node", "best value of a subtree under a parent-child rule"],
    idea: ["Pick states for a node, for example take and skip. Write each state's best value using the children's states.", "House robber III: take = val + skip(left) + skip(right); skip = max(left) + max(right).", "Answer at the root: the best of its states. Every node is processed once after its children."],
    steps: ["define the states of a node", "go(node) returns a tuple, (0, 0) for null", "combine the children's tuples by the rules", "return max over the root's states"],
    code: `def rob(root):
    def go(node):                 # (best if node is taken, best if not)
        if not node: return (0, 0)
        l, r = go(node.left), go(node.right)
        take = node.val + l[1] + r[1]       # children must be skipped
        skip = max(l) + max(r)              # children are free
        return (take, skip)
    return max(go(root))`,
    complexity: { best: "O(n)", average: "O(n · s)", worst: "O(n · s)", space: "O(h)", note: "s = work to combine states per node (constant here). The naive recursion that tries grandchildren directly is exponential without memoisation." },
    traps: ["Returning only one number loses the information the parent needs; return one value per state.", "The plain recursion 'rob this node and its grandchildren, or its children' recomputes subtrees exponentially; the tuple version is O(n).", "On general trees given as edges, pass the parent to avoid walking back up the edge you came from."],
    viz: { make: () => treeRobViz() },
    theory: [
      "A tree has no cycles, so once a node's state is fixed, its subtrees are independent of each other. That makes the subtree a natural DP state: the best value for the subtree of v, given the state of v. Post-order computes each subtree's tuple after its children's, and the root's tuple contains the answer.",
      "Correctness for house robber III. If v is taken, neither child may be taken, so the best is v's value plus the best of each child's subtree with that child skipped. If v is skipped, each child may be taken or skipped freely, so take the better of each. Every valid choice of nodes falls into one of the two cases at v, and the two subtrees can be optimised separately, so by induction the tuple is correct for every node.",
      "Cost is O(n) when each node does constant work per state, plus O(h) stack. A common slow version computes 'rob v plus the four grandchildren' recursively without caching; it visits nodes many times and is exponential on deep trees. Returning both states at once is the fix, and it is the same idea as house robber's two variables, moved onto a tree.",
      "More states handle richer rules. Binary tree cameras uses three states per node: has a camera, covered by a child's camera, not covered yet (the parent must cover it). Minimum vertex cover uses take and skip with 'skip requires both children taken'. Tree knapsack (choose k nodes, connected to the root) merges children's arrays of size k, which costs O(n · k) with careful merging.",
      "On general trees given as an edge list, build an adjacency list and pass the parent into the recursion, or compute a BFS order and process it in reverse to avoid deep recursion. When the question asks for the answer with every node as the root, run this DP once and then reroot (binary tree pattern 7).",
      "DP on trees combines post-order recursion (binary tree pattern 2) with state-machine thinking (DP pattern 7): the node's state is the 'machine state', and the children are the previous steps.",
    ],
  },
  {
    n: 11, name: "Partition DP (split into parts)", summary: "Split a sequence into contiguous pieces. dp over prefixes: the last piece is a[j..i), so dp[i] (or dp[p][i] with p pieces) tries every start j and adds the cost of that last piece.",
    signals: ["split an array into k subarrays minimising the largest sum or total cost", "palindrome partitioning II: fewest cuts", "word break: can the string be split into dictionary words", "decode ways: split a digit string into valid letters"],
    idea: ["The last piece of any split of a[0..i) is a[j..i) for some j. Whatever comes before it is a split of a[0..j), which is a smaller subproblem.", "With a fixed number of pieces: dp[p][i] = best over j of combine(dp[p - 1][j], cost(j, i)).", "With any number of pieces: dp[i] = best over j of dp[j] + cost(j, i), for example + 1 per piece when s[j..i) is a palindrome."],
    steps: ["prefix sums (or a palindrome table) so cost(j, i) is O(1)", "dp[0][0] = 0, everything else infinity", "for p, for i, for j < i: relax dp[p][i]", "answer dp[k][n] (or dp[n])"],
    code: `def split_k(a, k):              # k non-empty contiguous parts, minimise the largest sum
    n = len(a)
    pre = [0]
    for x in a: pre.append(pre[-1] + x)
    INF = float("inf")
    dp = [[INF] * (n + 1) for _ in range(k + 1)]
    dp[0][0] = 0
    for p in range(1, k + 1):
        for i in range(p, n + 1):
            for j in range(p - 1, i):           # last part is a[j:i]
                dp[p][i] = min(dp[p][i], max(dp[p - 1][j], pre[i] - pre[j]))
    return dp[k][n]

def min_palindrome_cuts(s):
    n = len(s)
    pal = [[False] * n for _ in range(n)]
    dp = [-1] + [n] * n                         # dp[i] = fewest cuts for s[:i]
    for r in range(n):
        for l in range(r, -1, -1):
            if s[l] == s[r] and (r - l < 2 or pal[l + 1][r - 1]):
                pal[l][r] = True
                dp[r + 1] = min(dp[r + 1], dp[l] + 1)
    return dp[n]`,
    complexity: { best: "O(k · n²)", average: "O(k · n²)", worst: "O(k · n²)", space: "O(k · n)", note: "Without a fixed k: O(n²) states and transitions. Palindrome cuts: O(n²) with the table." },
    traps: ["Computing each piece's cost from scratch (summing, or checking a palindrome by scanning) adds a factor of n; precompute prefix sums or the palindrome table.", "Parts must be non-empty: j runs from p - 1, so each earlier part has at least one element.", "dp[0] = -1 for cuts (one piece needs zero cuts); counting pieces instead starts at 0 and subtracts 1 at the end."],
    viz: { make: (i) => { const v = nums(i, [7, 2, 5, 10, 8, 3], 7); const k = v.length > 2 ? Math.max(1, Math.min(4, Math.round(v[v.length - 1]))) : 3; return splitViz(v.length > 2 ? v.slice(0, -1).map((x) => Math.abs(Math.round(x))) : [7, 2, 5, 10, 8], Math.min(k, Math.max(1, v.length - 1))); }, input: "7, 2, 5, 10, 8, 3", label: "numbers, then the number of parts last" },
    theory: [
      "Every way to split a sequence into contiguous pieces has a last piece. Fixing where it starts (j) leaves a split of the prefix before j, which is the same problem on a shorter input. So the best split of a[0..i) is the best over j of 'best split of a[0..j)' combined with the cost of a[j..i). These options cover every split exactly once, so the recurrence is correct for optimisation and for counting.",
      "With a fixed number of pieces, the state needs the count: dp[p][i] is the best split of the first i elements into p pieces. With any number of pieces the count is not needed, which saves a dimension. In both cases precompute what makes cost(j, i) O(1): prefix sums for sums, a palindrome table for palindromes, a hash set lookup (or a trie walk) for dictionary words.",
      "Cost. There are k · n states and up to n choices of j, so O(k · n²) for the fixed-k version, O(n²) without k. For minimising the largest sum, binary search on the answer with a greedy check is O(n log S) and usually faster; the DP version matters when the cost of a piece is not monotone, or when you must report the split.",
      "Many familiar problems are partition DP. Word break: dp[i] is true if some dictionary word ends at i and dp[j] is true at its start. Decode ways: the last piece is one digit or two. Palindrome partitioning II: the last piece must be a palindrome and each piece adds a cut. Minimum cost to split into pieces with a per-piece penalty, and the 'number of work sessions' style problems, follow the same template.",
      "When the cost function has special structure (for example, cost(a, d) + cost(b, c) ≤ cost(a, c) + cost(b, d)), the best j moves monotonically with i, and divide and conquer or Knuth's optimisation reduces O(k · n²) to O(k · n log n) or O(n²). In interviews, knowing that these exist is usually enough.",
      "Partition DP differs from interval DP in that only the prefix matters: the last piece is cut from the end, so states are prefixes, not arbitrary ranges. If the cost of a piece depends on what is around it (like burst balloons), you need interval DP instead.",
    ],
  },
  {
    n: 12, name: "Counting paths and combinatorics (nCr mod p)", summary: "Count arrangements with Pascal's rule C(n, k) = C(n - 1, k - 1) + C(n - 1, k), or count lattice paths with the same additive DP, taking the answer modulo 10⁹ + 7.",
    signals: ["number of paths in a grid (with obstacles)", "number of ways, return it modulo 10⁹ + 7", "choose k of n, Pascal's triangle", "Catalan-style counts: unique BSTs, balanced parentheses"],
    idea: ["Pascal's rule: the subsets of size k of n items either contain item n (choose k - 1 from the other n - 1) or do not (choose k from n - 1).", "Grid paths with right and down moves follow the same rule: paths into a cell = paths into the cell above + paths into the cell to the left. Obstacles force 0.", "Without obstacles, paths through an R × C grid = C(R + C - 2, R - 1): choose which moves go down."],
    steps: ["C[i][0] = 1; C[i][j] = (C[i - 1][j - 1] + C[i - 1][j]) % MOD", "grid: row[c] = 0 at an obstacle, else row[c] + row[c - 1]", "take % MOD after every addition", "for single large C(n, k) use factorials and modular inverses"],
    code: `MOD = 10**9 + 7
def pascal(n):                    # C[i][j] = i choose j, modulo MOD
    C = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        C[i][0] = 1
        for j in range(1, i + 1):
            C[i][j] = (C[i - 1][j - 1] + C[i - 1][j]) % MOD
    return C

def paths_with_obstacles(grid):   # 1 = blocked; moves right or down
    row = [1] + [0] * (len(grid[0]) - 1)
    for r in grid:
        for c in range(len(r)):
            if r[c]: row[c] = 0
            elif c: row[c] = (row[c] + row[c - 1]) % MOD
    return row[-1]`,
    complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(n²)", note: "The full triangle up to n. Grid paths: O(R · C) time and O(C) space. A single C(n, k) for large n: O(n) precomputation, O(1) per query with factorials." },
    traps: ["Apply % MOD after each addition; in fixed-width languages a sum of two values below MOD fits in 32 bits, but a product does not.", "Do not divide under a modulus: C(n, k) = n! / (k! (n - k)!) needs modular inverses, not integer division of reduced values.", "An obstacle on the start cell means 0 paths; the row initialisation handles it only if the first cell is checked too."],
    viz: { make: (i) => pascalViz(Math.max(2, Math.min(8, Math.round(nums(i, [6])[0])))), input: "6", label: "rows of Pascal's triangle (2 to 8)" },
    theory: [
      "Pascal's rule is a counting argument, not just a formula. Split the k-subsets of {1..n} by whether they contain n. Those that do correspond to (k - 1)-subsets of the first n - 1 items; those that do not are k-subsets of the first n - 1. The two groups are disjoint and cover everything, so C(n, k) = C(n - 1, k - 1) + C(n - 1, k). This is a DP whose table is Pascal's triangle.",
      "Grid paths are the same count in disguise. A path from the top-left to the bottom-right of an R × C grid using right and down moves has R - 1 downs and C - 1 rights in some order, and choosing the positions of the downs determines it: C(R + C - 2, R - 1). The additive grid DP computes the same number, and unlike the formula it still works when some cells are blocked.",
      "Modular arithmetic keeps the numbers small. Addition and multiplication can be reduced at every step, (a + b) mod p = ((a mod p) + (b mod p)) mod p, so the DP never needs big integers. Division is the exception: to compute n! / (k! (n - k)!) mod p you multiply by modular inverses, which exist when p is prime and does not divide the denominator (the bits and maths topic covers this).",
      "Other classic counts. The Catalan numbers count binary search trees on n keys, balanced parenthesis strings, and monotone paths that never cross the diagonal: C_n = C(2n, n) / (n + 1), or the DP C_n = sum of C_i · C_(n-1-i), choosing the root. Stars and bars counts ways to put n identical items into k boxes: C(n + k - 1, k - 1). Inclusion and exclusion counts paths avoiding a few forbidden cells by subtracting paths through them.",
      "Complexity choices. A full Pascal table up to n costs O(n²) and answers any C(i, j) with i ≤ n in O(1); it is the safest option for n up to a few thousand and needs no inverses (so it works for any modulus). For n up to 10⁶ or more, precompute factorials and inverse factorials in O(n) and answer each query in O(1).",
      "Counting DP needs disjoint cases, while optimisation DP only needs covering cases; double counting is the typical bug. When the answer is 'number of ways modulo 10⁹ + 7', the problem is almost always this kind of additive DP or a closed-form count.",
    ],
  },
];
