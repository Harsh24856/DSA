// Overview of the "dp" topic: the data structure or technique itself. Shown on /patterns/dp before the patterns.
import type { CellsFrame, Diagram, TableFrame, Tone, TreeFrame } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

const clampInt = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(x)));
const show = (x: number) => (x >= 1e9 ? "inf" : x);

/** Bottom-up coin change: fill dp[0..amount] left to right, then walk the stored choices back. */
function coinTable(coins: number[], amount: number): Diagram {
  const BIG = 1e9, dp = Array(amount + 1).fill(BIG), pick = Array(amount + 1).fill(0), frames: CellsFrame[] = [];
  const idx = Array.from({ length: amount + 1 }, (_, a) => a);
  const row = (upto: number) => dp.map((v, a) => (a <= upto ? show(v) : ""));
  dp[0] = 0;
  frames.push({ note: `State: dp[a] is the fewest coins that make a. Base case dp[0] = 0. Coins ${coins.join(", ")}`, rows: [idx, row(0)], tones: { "1:0": "found" } });
  for (let a = 1; a <= amount; a++) {
    const tries: string[] = [], tones: Record<string, Tone> = {};
    for (const c of coins) {
      if (c > a) continue;
      tries.push(`dp[${a - c}] + 1 = ${show(dp[a - c] + 1)}`); tones[`1:${a - c}`] = "window";
      if (dp[a - c] + 1 < dp[a]) { dp[a] = dp[a - c] + 1; pick[a] = c; }
    }
    tones[`1:${a}`] = "found";
    frames.push({ note: `dp[${a}] = min(${tries.join(", ")}) = ${show(dp[a])}${dp[a] < BIG ? `, last coin ${pick[a]}` : ""}. ${tries.length} transition${tries.length > 1 ? "s" : ""} for this state`, rows: [idx, row(a)], tones, marks: [{ i: a, label: "a", row: 1 }] });
  }
  if (dp[amount] >= BIG) frames.push({ note: `dp[${amount}] stayed inf: no mix of coins makes ${amount}, so the answer is -1`, rows: [idx, row(amount)] });
  else {
    const used: number[] = [], tones: Record<string, Tone> = {};
    for (let a = amount; a > 0; a -= pick[a]) { used.push(pick[a]); tones[`1:${a}`] = "active"; }
    tones["1:0"] = "active";
    frames.push({ note: `Rebuild the answer: from ${amount}, follow the stored last coin each time: ${used.join(" + ")} = ${amount}, ${used.length} coins`, rows: [idx, row(amount)], tones });
  }
  frames.push({ note: `${amount + 1} states × ${coins.length} coins = O(amount × coins) time, O(amount) space`, rows: [idx, row(amount)], tones: { [`1:${amount}`]: "found" } });
  return { kind: "cells", title: `Bottom-up: coin change for ${amount} with coins ${coins.join(", ")}`, rowLabels: ["a", "dp"], rows: [idx, row(amount)], frames };
}

/** Top-down Fibonacci with a memo: the call tree that actually runs, compared with the plain recursion. */
function memoTree(n: number): Diagram {
  const nodes: { id: number; label: string; parent: number | null; side?: "L" | "R" }[] = [], raw: TreeFrame[] = [], memo = new Map<number, number>();
  const plainCalls = (k: number): number => (k < 2 ? 1 : 1 + plainCalls(k - 1) + plainCalls(k - 2));
  const go = (k: number, parent: number | null, side?: "L" | "R"): number => {
    const id = nodes.length; nodes.push({ id, label: `f(${k})`, parent, side });
    if (memo.has(k)) { raw.push({ note: `f(${k}) is already in the memo: return ${memo.get(k)} at once, no subtree below it`, tones: { [id]: "found" } }); return memo.get(k)!; }
    if (k < 2) { raw.push({ note: `f(${k}) = ${k}: base case, store it`, tones: { [id]: "done" } }); memo.set(k, k); return k; }
    raw.push({ note: `Call f(${k}): not in the memo, so recurse on f(${k - 1}) first`, tones: { [id]: "active" } });
    const v = go(k - 1, id, "L") + go(k - 2, id, "R"); memo.set(k, v);
    raw.push({ note: `f(${k}) = f(${k - 1}) + f(${k - 2}) = ${v}, written to the memo`, tones: { [id]: "active" } });
    return v;
  };
  const ans = go(n, null);
  raw.push({ note: `Done: f(${n}) = ${ans} with ${nodes.length} calls. Without the memo the same recursion makes ${plainCalls(n)} calls, and that gap grows exponentially`, tones: {} });
  const seen = new Set<number>(), frames = raw.map((f) => {
    Object.keys(f.tones ?? {}).forEach((x) => seen.add(+x));
    const tones: Record<number, Tone> = {};
    nodes.forEach((nd) => { tones[nd.id] = seen.has(nd.id) ? "done" : "muted"; });
    return { ...f, tones: { ...tones, ...f.tones } };
  });
  return { kind: "tree", title: `Top-down: memoised f(${n}) solves each state once`, nodes, frames };
}

/** LCS table filled row by row, then the walk back that rebuilds one LCS. */
function lcsWalk(a: string, b: string): Diagram {
  const m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)), frames: TableFrame[] = [];
  const view = (r: number, c: number) => dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 || i < r || (i === r && j <= c) ? v : null)));
  frames.push({ note: `State dp[i][j] = LCS length of the first i letters of "${a}" and the first j of "${b}". Row 0 and column 0 are empty prefixes: 0`, cells: view(1, 0) });
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const same = a[i - 1] === b[j - 1];
    dp[i][j] = same ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    frames.push({ note: same ? `'${a[i - 1]}' = '${b[j - 1]}': diagonal + 1 = ${dp[i][j]}` : `'${a[i - 1]}' differs from '${b[j - 1]}': max(up ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]}${i > 1 && j === n ? `. Row ${i} read only row ${i - 1}: two rows would do for the length` : ""}`, cells: view(i, j), active: [i, j], deps: same ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]] });
  }
  let i = m, j = n; const out: string[] = [], tones: Record<string, Tone> = {};
  while (i && j) {
    tones[`${i}:${j}`] = "found";
    if (a[i - 1] === b[j - 1]) {
      out.unshift(a[i - 1]);
      frames.push({ note: `Walk back from (${i}, ${j}): letters match, so '${a[i - 1]}' is in the LCS; go diagonal. So far "${out.join("")}"`, cells: view(m, n), active: [i, j], tones: { ...tones } });
      i--; j--;
    } else {
      const up = dp[i - 1][j] >= dp[i][j - 1];
      frames.push({ note: `At (${i}, ${j}) the letters differ: move ${up ? "up" : "left"} to the neighbour that gave ${dp[i][j]}`, cells: view(m, n), active: [i, j], tones: { ...tones } });
      if (up) i--; else j--;
    }
  }
  frames.push({ note: `Reached an empty prefix. One LCS is "${out.join("")}", length ${dp[m][n]}. Rebuilding needs the full table, so it costs O(m × n) space`, cells: view(m, n), tones: { ...tones } });
  return { kind: "table", title: `LCS of "${a}" and "${b}": fill, then walk back`, rowHead: ["", ...a.split("")], colHead: ["", ...b.split("")], frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "**Dynamic programming** is recursion with a memory. It applies when a problem's answer can be built from answers to smaller versions of the same problem (**optimal substructure**) and those smaller versions come up again and again (**overlapping subproblems**). Solving each smaller version once and storing it turns an exponential search into a polynomial one.",
    "Every DP has four parts. The **state** is the smallest set of values that describes a subproblem, such as `dp[i]` = best answer for the first `i` items. The **transition** (recurrence) says how a state is built from smaller ones, usually by trying each possible last decision. The **base case** answers the smallest states directly. The **answer** is the state (or the min, max or sum over states) the question asks for.",
    "In memory a DP is a table. When states are small integers the table is an array (`dp[i]`, `dp[i][j]`, `dp[mask][i]`) and a lookup is one index calculation. When states are sparse or awkward, such as tuples or large values, it is a hash map keyed by the state. Time is **number of states × cost of one transition**; space is the number of states kept at the same moment.",
    "There are two ways to fill the table. **Top-down** (memoisation) keeps the natural recursion and caches each result, so it only visits states that are reachable, but it pays for function calls and recursion depth. **Bottom-up** (tabulation) uses loops in an **order** where every state a cell reads is already filled: left to right for prefixes, by increasing length for intervals, by increasing mask for subsets. It has no stack and allows space reduction.",
    "DP problems come in families that differ only in the state: linear (`dp[i]`), two sequences (`dp[i][j]` over prefixes), grids (`dp[r][c]`), knapsack (item and capacity), intervals (`dp[l][r]`), bitmasks (`dp[mask]`), trees (a tuple per node), digits (position, tight flag, extra) and state machines (day and holding or not). The combine step also varies: **min or max** for optimisation, **sum** for counting, **or** for feasibility.",
    "Two extras show up in interviews. **Space reduction**: if row `i` reads only row `i - 1`, keep two rows (**rolling rows**), or one row when the loop direction keeps the old values you still need. **Reconstruction**: to output the actual choice (the path, the subsequence, the coins), keep the full table or a parent pointer per state and walk back from the answer. The two pull against each other, since rebuilding needs the rows you threw away.",
  ],
  build: [
    "Start from a brute-force recursion that tries every choice. Write it as a function of the values that change between calls: those parameters are the state. Remove any parameter that can be computed from the others, because each extra dimension multiplies the table size.",
    "Write the transition by looking at the **last** (or first) decision. For a prefix, ask what happens to item `i`: take it or skip it, end a piece here or not, match these two letters or drop one. Each option leads to a strictly smaller state, and the options are combined with `min`, `max`, `+` or `or`.",
    "Choose base cases and identity values with care: `0` for a sum, `inf` for a minimum, `-inf` for a maximum, `False` for feasibility, and `1` for the number of ways to build an empty thing. Many bugs are a base case that should be `1` but is `0`, or an `inf` that overflows when you add 1 to it.",
    "To go top-down, add a cache to the recursion and check it on entry. To go bottom-up, allocate the table with the base cases set, then loop so that dependencies are filled first. In one-row knapsack the direction matters: capacity **downward** means each item is used at most once, **upward** means it can be reused.",
    "Count the cost before coding: states times transition gives time, and the table size gives space. If that is too slow, look for a smaller state, a faster transition (prefix sums, a monotonic deque, binary search) or a greedy insight. Finally, if the question wants the choice itself, store which option won at each state and walk back from the answer.",
  ],
  code: `INF = float("inf")

def memoize(fn):
    """Top-down DP from scratch: remember each state's answer the first time it is computed."""
    cache = {}
    def wrapper(*state):
        if state not in cache:
            cache[state] = fn(*state)
        return cache[state]
    wrapper.cache = cache
    return wrapper

def coin_change_top_down(coins, amount):
    @memoize
    def best(a):                       # state: fewest coins that make a
        if a == 0:
            return 0                   # base case
        if a < 0:
            return INF
        return min(best(a - c) + 1 for c in coins)   # transition: the last coin
    ans = best(amount)
    return -1 if ans == INF else ans

def coin_change_bottom_up(coins, amount):
    dp = [0] + [INF] * amount          # dp[a] for every a, smaller amounts first
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == INF else dp[amount]

def lcs_table(a, b):
    """dp[i][j] = LCS length of a[:i] and b[:j]; row 0 and column 0 are the empty-prefix base cases."""
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp

def lcs_string(a, b):
    """Reconstruct one LCS by walking back from dp[m][n] along the choices that made each cell."""
    dp, i, j, out = lcs_table(a, b), len(a), len(b), []
    while i and j:
        if a[i - 1] == b[j - 1]:
            out.append(a[i - 1]); i -= 1; j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(out))

def lcs_length_two_rows(a, b):
    """Row i reads only row i - 1, so two rows of len(b) + 1 are enough."""
    prev = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            cur[j] = prev[j - 1] + 1 if a[i - 1] == b[j - 1] else max(prev[j], cur[j - 1])
        prev = cur
    return prev[-1]

def knapsack_01(weights, values, cap):
    """One row; capacity loops downward so each item is used at most once."""
    dp = [0] * (cap + 1)
    for w, v in zip(weights, values):
        for c in range(cap, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[cap]

def count_ways(coins, amount):
    """Counting DP: coins in the outer loop count combinations, not orderings."""
    dp = [1] + [0] * amount            # one way to make 0: take nothing
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]

if __name__ == "__main__":
    for coins, amount, exp in [([1, 2, 5], 11, 3), ([2], 3, -1), ([1], 0, 0), ([1, 3, 4], 6, 2)]:
        assert coin_change_top_down(coins, amount) == exp == coin_change_bottom_up(coins, amount)
    assert lcs_table("abcde", "ace")[5][3] == 3 and lcs_string("abcde", "ace") == "ace"
    assert lcs_length_two_rows("abcde", "ace") == 3 and lcs_length_two_rows("abc", "def") == 0
    assert lcs_string("", "abc") == ""
    assert knapsack_01([1, 3, 4], [15, 20, 30], 4) == 35
    assert count_ways([1, 2, 5], 5) == 4 and count_ways([2], 3) == 0
    print("ok")`,
  ops: [
    {
      title: "Classic DP families (a DP does the same work on every input of a size, so average and worst match: states × transition)",
      rows: [
        ["Fibonacci, climbing stairs, house robber", "O(n)", "O(n)", "n states, each reads the two before it in O(1); two variables replace the table, so O(1) space"],
        ["Coin change, unbounded knapsack", "O(A × k)", "O(A × k)", "A + 1 amounts, each tries all k coins; O(A) space"],
        ["0/1 knapsack, subset sum, partition", "O(n × W)", "O(n × W)", "n × (W + 1) states, take or skip in O(1); one row of W + 1 with capacity looping down. Pseudo-polynomial: W is a value, not an input length"],
        ["Longest increasing subsequence, quadratic", "O(n²)", "O(n²)", "n states, each scans every j < i; O(n) space"],
        ["Longest increasing subsequence, tails array", "O(n log n)", "O(n log n)", "keeps the smallest tail of each length and binary searches it; not a table DP"],
        ["LCS, edit distance, two-string DP", "O(m × n)", "O(m × n)", "(m + 1)(n + 1) states, three neighbours each; O(min(m, n)) space with two rows"],
        ["Grid paths, minimum path sum", "O(R × C)", "O(R × C)", "each cell reads the cell above and the cell to the left; one row of C is enough"],
        ["Word break", "O(n²)", "O(n²)", "n prefixes, each tries every split point; each dictionary check also costs the word length"],
        ["Palindromic subsequence, interval DP with O(1) transitions", "O(n²)", "O(n²)", "n² ranges, filled by increasing length"],
        ["Interval DP with a split point (burst balloons, matrix chain)", "O(n³)", "O(n³)", "n² ranges, each tries up to n split points"],
        ["Bitmask DP (assignment, travelling salesman)", "O(2ⁿ × n²)", "O(2ⁿ × n²)", "2ⁿ × n states, n transitions each; workable for n up to about 20"],
        ["Tree DP (house robber III, diameter)", "O(n)", "O(n)", "one small tuple per node, each child combined once; stack depth is the tree height"],
        ["Digit DP (count numbers up to N)", "O(D × S × 10)", "O(D × S × 10)", "D digits × S extra states × 10 digit choices, plus a tight flag"],
        ["Stock trading with k transactions", "O(n × k)", "O(n × k)", "n days × k transactions × 2 holding states, O(1) each"],
      ],
    },
    {
      title: "Implementation choices",
      rows: [
        ["Memo lookup in an array", "O(1)", "O(1)", "index arithmetic; best when states are small integers"],
        ["Memo lookup in a hash map or @cache", "O(1)", "O(n)", "hashing a tuple key costs its length, and collisions can degrade; a slower constant than an array"],
        ["Top-down recursion stack", "O(depth)", "O(states)", "a chain of n dependent states needs n frames; Python stops at about 1000 by default"],
        ["Bottom-up fill", "O(states × transition)", "O(states × transition)", "no stack, but it computes every state, even unreachable ones"],
        ["Rolling rows (two rows)", "O(row) space", "O(row) space", "valid when row i reads only rows i and i - 1"],
        ["One row in place", "O(row) space", "O(row) space", "the loop direction decides whether a cell still holds the old value or already the new one"],
        ["Rebuild the chosen answer", "O(answer length)", "O(m + n)", "walk back from the answer state using the full table or stored parent choices"],
        ["Counting modulo 1e9 + 7", "O(1) per step", "O(1) per step", "take the remainder after every addition or multiplication, never only at the end"],
      ],
    },
  ],
  builtins: [
    ["Memoise a function", "no decorator: a `vector` filled with -1, or an `unordered_map`", "`@functools.cache` or `@lru_cache(None)`"],
    ["2D table", "`vector<vector<int>> dp(n, vector<int>(m, 0))`", "`[[0] * m for _ in range(n)]` (never `[[0] * m] * n`, which shares one row)"],
    ["Infinity for min or max", "`INT_MAX / 2`, `LLONG_MAX`, `numeric_limits<long long>::max()`", "`float('inf')` or `math.inf`"],
    ["Binary search for LIS tails", "`lower_bound`", "`bisect.bisect_left`"],
    ["Prefix sums for range costs", "`partial_sum`", "`itertools.accumulate`"],
    ["Bitset for subset sum", "`bitset<N>` with `b |= b << x`", "a big `int` as a bitset: `b |= b << x`"],
    ["Binomial coefficient", "none: build Pascal's triangle", "`math.comb`"],
    ["Deeper recursion", "no portable setting: go bottom-up", "`sys.setrecursionlimit`, still limited by the C stack"],
  ],
  when: [
    "The question asks for a count (\"number of ways\"), a minimum or maximum, or whether something is possible, over choices made in sequence.",
    "A brute-force recursion works but repeats the same arguments: draw two levels of its call tree and look for duplicates.",
    "Words like \"subsequence\", \"partition\", \"split into\", \"choose items with a limit\", \"edit\" or \"transform one string into another\".",
    "Constraints around n ≤ 1000 to 5000 (O(n²)), n × m ≤ 10⁷, or a sum or capacity ≤ 10⁴ next to n ≤ 100.",
    "n ≤ 20 with \"visit all\" or \"assign each\": bitmask DP over subsets.",
    "Counting with a modulus such as 1e9 + 7: almost always counting DP or combinatorics.",
    "Each decision only depends on a small summary of the past, such as the last index, holding or not, or the remaining budget.",
  ],
  avoid: [
    "A provable greedy choice exists (interval scheduling, jump game reachability): greedy is O(n) or O(n log n) with no table.",
    "You must list every solution, not count or optimise them: the output itself is exponential, so use backtracking.",
    "The state needs the whole history, such as an arbitrary set of visited cells on a big grid: the table would be exponential, so search with pruning instead.",
    "Shortest path in a graph with cycles: the dependencies are not acyclic, so use BFS or Dijkstra rather than a fill order.",
    "Range queries with updates: a segment tree or Fenwick tree, not a recomputed table.",
  ],
  tips: [
    "Say the state in words before writing code: \"dp[i][j] is the edit distance between the first i letters of a and the first j letters of b\". Most wrong DPs have a vague state.",
    "Write the recurrence and base cases on the board, then the complexity as states × transition, before any code.",
    "Start top-down if you are unsure of the fill order; convert to bottom-up only if asked or if recursion depth is a risk.",
    "Off-by-one with prefixes: sizing tables `n + 1` so that `dp[0]` is the empty prefix removes most edge cases.",
    "In one-row knapsack, the loop direction is the whole difference between 0/1 and unbounded. In counting coin change, coins in the outer loop count combinations; amounts in the outer loop count orderings.",
    "Do not add 1 to `INT_MAX`: use `INT_MAX / 2` or check for infinity first.",
    "Python: `@cache` on a nested function is clean, but deep chains need `sys.setrecursionlimit` or a bottom-up rewrite; also clear the cache between test cases when it is global.",
    "When asked for space optimisation, check which earlier rows a cell reads; when asked to print the answer too, keep parent choices instead of the full table if memory matters.",
  ],
  viz: [
    { name: "Bottom-up table: coin change", label: "Amount (4 to 12)", input: "6", make: (s) => coinTable([1, 3, 4], clampInt(nums(s, [6])[0], 4, 12)) },
    { name: "Top-down memoisation: the call tree", label: "n (3 to 6)", input: "5", make: (s) => memoTree(clampInt(nums(s, [5])[0], 3, 6)) },
    { name: "2D table and rebuilding the answer: LCS", make: () => lcsWalk("abcbd", "acbd") },
  ],
};
