// Overview of the "recursion-backtracking" topic: the data structure or technique itself. Shown on /patterns/recursion-backtracking before the patterns.
import type { Diagram, StackFrame, Tone, TreeFrame } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

type Node = { id: number; label: string; parent: number | null; side?: "L" | "R"; edge?: string };
const clampInt = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(x)));

/** Mark every node seen in an earlier frame as done and every node not reached yet as muted. */
const reveal = (nodes: Node[], raw: TreeFrame[]): TreeFrame[] => {
  const seen = new Set<number>();
  return raw.map((f) => {
    const base: Record<number, Tone> = {};
    nodes.forEach((nd) => { base[nd.id] = seen.has(nd.id) ? "done" : "muted"; });
    Object.keys(f.tones ?? {}).forEach((x) => seen.add(+x));
    return { ...f, tones: { ...base, ...f.tones } };
  });
};

/** Fast power on the call stack: each frame waits for the half-size call, then squares its result. */
function powerStack(x: number, n: number): Diagram {
  const frames: StackFrame[] = [], st: string[] = [];
  const go = (k: number): number => {
    st.push(`pow(${x}, ${k})`);
    if (k === 0) { frames.push({ note: `pow(${x}, 0) = 1: base case. The stack is ${st.length} frames deep, about log₂ ${n} + 2`, items: [...st] }); st.pop(); frames.push({ note: "Return 1 and pop the frame", items: [...st], popped: ["pow = 1"] }); return 1; }
    frames.push({ note: `pow(${x}, ${k}) needs pow(${x}, ${Math.floor(k / 2)}) first: push a new frame and pause this one`, items: [...st] });
    const half = go(Math.floor(k / 2)), v = half * half * (k % 2 ? x : 1);
    st.pop();
    frames.push({ note: `Back in pow(${x}, ${k}): ${half} × ${half}${k % 2 ? ` × ${x}` : ""} = ${v}. Pop the frame`, items: [...st], popped: [`pow(${x}, ${k}) = ${v}`] });
    return v;
  };
  const v = go(n);
  frames.push({ note: `pow(${x}, ${n}) = ${v}. T(n) = T(n / 2) + O(1): O(log n) calls and O(log n) stack, against n frames for the linear x × pow(x, n - 1)`, items: [] });
  return { kind: "stack", title: `Call stack: pow(${x}, ${n}) by halving`, frames };
}

/** Merge sort's recursion tree: split top-down, merge bottom-up, then read the cost level by level. */
function mergeTree(arr: number[]): Diagram {
  const nodes: Node[] = [], raw: TreeFrame[] = [], depthOf: number[] = [], labels: Record<number, string> = {};
  const build = (a: number[], parent: number | null, side: "L" | "R" | undefined, depth: number): number => {
    const id = nodes.length; nodes.push({ id, label: a.join(" "), parent, side }); depthOf[id] = depth;
    if (a.length > 1) { const m = a.length >> 1; build(a.slice(0, m), id, "L", depth + 1); build(a.slice(m), id, "R", depth + 1); }
    return id;
  };
  build(arr, null, undefined, 0);
  const kids = (id: number) => nodes.filter((nd) => nd.parent === id).map((nd) => nd.id);
  const sort = (id: number): number[] => {
    const a = nodes[id].label.split(" ").map(Number);
    if (a.length <= 1) { raw.push({ note: `[${a.join(", ")}] has one element: base case, already sorted`, tones: { [id]: "done" }, labels: { ...labels } }); return a; }
    raw.push({ note: `Split [${a.join(", ")}] into two halves and sort each one first`, tones: { [id]: "active" }, labels: { ...labels } });
    const [l, r] = kids(id), L = sort(l), R = sort(r), out: number[] = [];
    let i = 0, j = 0;
    while (i < L.length && j < R.length) out.push(L[i] <= R[j] ? L[i++] : R[j++]);
    out.push(...L.slice(i), ...R.slice(j));
    labels[id] = out.join(" ");
    raw.push({ note: `Merge [${L.join(", ")}] and [${R.join(", ")}] into [${out.join(", ")}]: ${out.length} steps of work at this node`, tones: { [id]: "found" }, labels: { ...labels } });
    return out;
  };
  const sorted = sort(0), levels = Math.max(...depthOf) + 1;
  for (let d = 0; d < levels; d++) {
    const at = nodes.filter((nd) => depthOf[nd.id] === d), size = at.reduce((s, nd) => s + nd.label.split(" ").length, 0);
    raw.push({ note: `Level ${d}: ${at.length} call${at.length > 1 ? "s" : ""} holding ${size} elements in all, so O(n) work on this level`, tones: Object.fromEntries(at.map((nd) => [nd.id, "window" as Tone])), labels: { ...labels } });
  }
  raw.push({ note: `${levels} levels × O(n) each = O(n log n), result [${sorted.join(", ")}]. The stack is only ${levels} frames deep at once`, tones: { 0: "found" }, labels: { ...labels } });
  return { kind: "tree", title: "Recursion tree of merge sort: T(n) = 2T(n / 2) + n", nodes, frames: reveal(nodes, raw) };
}

/** Combination sum with pruning: choose a candidate, explore, un-choose; stop a loop once the sum is too big. */
function comboTree(cands: number[], target: number): Diagram {
  const c = [...cands].sort((a, b) => a - b), nodes: Node[] = [{ id: 0, label: "[]", parent: null }], raw: TreeFrame[] = [], path: number[] = [];
  let found = 0, pruned = 0;
  raw.push({ note: `Find every multiset of ${c.join(", ")} (reuse allowed) that sums to ${target}. Sorted first, so a loop can stop early`, tones: { 0: "active" } });
  const go = (start: number, left: number, parent: number) => {
    for (let k = start; k < c.length; k++) {
      const id = nodes.length; path.push(c[k]);
      nodes.push({ id, label: String(c[k]), parent, edge: `+${c[k]}` });
      if (c[k] > left) {
        pruned++;
        raw.push({ note: `Choose ${c[k]}: [${path.join(", ")}] sums past ${target}. Prune, and skip the rest of this loop, since later candidates are bigger`, tones: { [id]: "bad" } });
        path.pop(); break;
      }
      if (c[k] === left) {
        found++;
        raw.push({ note: `Choose ${c[k]}: [${path.join(", ")}] sums to ${target}. Record a copy of the path`, tones: { [id]: "found" } });
      } else {
        raw.push({ note: `Choose ${c[k]}: path [${path.join(", ")}], ${left - c[k]} still to go. Explore from index ${k} so ${c[k]} can repeat`, tones: { [id]: "active" } });
        go(k, left - c[k], id);
      }
      path.pop();
      if (k + 1 < c.length) raw.push({ note: `Un-choose ${c[k]}: path back to [${path.join(", ")}], try the next candidate`, tones: { [parent]: "active" } });
    }
  };
  go(0, target, 0);
  raw.push({ note: `Done: ${found} answer${found === 1 ? "" : "s"}, ${nodes.length - 1} nodes visited, ${pruned} branches cut by pruning. Depth is at most ${target} / ${c[0]}, rounded down: ${Math.floor(target / c[0])}`, tones: {} });
  return { kind: "tree", title: `Backtracking: combination sum to ${target}`, nodes, frames: reveal(nodes, raw) };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **recursive** function solves a problem by calling itself on a smaller version of the same problem. It needs a **base case**, an input small enough to answer directly, and a **recursive case** that moves strictly closer to the base case. Without both, the calls never stop.",
    "Each call gets a **stack frame** on the **call stack**: its arguments, local variables and the place to resume in the caller. A call pushes a frame; a return pops it and hands the value back. The frames still waiting at the deepest point are the **recursion depth**, and that depth is the extra space a recursion uses, even when it allocates nothing else.",
    "Drawing every call as a node gives the **recursion tree**. Its shape gives the cost: total time is the work summed over all nodes, and space is the height. One call per level is a chain (depth n), two calls on n - 1 doubles at every level (about 2ⁿ nodes), and two calls on n / 2 gives log n levels of n total work each (n log n).",
    "Divide and conquer recursions follow `T(n) = a·T(n / b) + O(n^d)`. The **master theorem** compares `a` with `b^d`: if `a < b^d` the top level dominates and `T(n) = O(n^d)`; if they are equal every level costs the same and `T(n) = O(n^d log n)`; if `a > b^d` the leaves dominate and `T(n) = O(n^(log_b a))`.",
    "A call is a **tail call** when nothing is left to do after it returns, as in `return go(n - 1, acc * n)`. Some compilers reuse the frame for it, but Python never does, Java does not, and C++ only may at higher optimisation. So in an interview treat depth as real: Python stops at about 1000 frames by default, and a C++ stack of a few MB holds roughly 10⁵ small frames. Deep chains should become a loop or an explicit stack.",
    "**Backtracking** is recursion that builds a candidate one choice at a time: **choose** an option, **explore** the rest recursively, **un-choose** it to restore the state, then try the next option. Its recursion tree is the decision tree of all partial candidates. **Pruning** cuts a branch as soon as it cannot lead to a valid or better answer, which is what makes subsets, permutations, N-Queens and Sudoku fast in practice.",
  ],
  build: [
    "Write the function's contract first in one sentence: what it returns for which arguments, for example \"`go(i)` returns every subset of `nums[i:]`\". Then the base case is the smallest argument, and the recursive case uses the contract on a smaller argument as if it already worked.",
    "Make the input shrink every time: `n - 1`, `n / 2`, an index moving right, a range getting shorter. Pass indices (`lo`, `hi`, `i`) rather than slices or copies, since slicing costs O(n) per call and hides an extra factor.",
    "For backtracking, keep one mutable `path` (plus `used` flags or sets) shared by every call. Each choice is a matched pair: append then pop, mark then unmark, place then remove. At a leaf, record a **copy** (`path[:]`), because the same list keeps changing.",
    "Add pruning where you can prove a branch is hopeless: sort the input and `break` when a candidate is too big, skip equal neighbours to avoid duplicates (`i > start and nums[i] == nums[i - 1]`), and keep O(1) lookups for constraints such as used columns and diagonals.",
    "Estimate the cost from the tree: branching factor `b` and depth `d` give at most `b^d` nodes, times the work per node (often O(n) to copy a leaf). If calls repeat the same arguments, add a memo and it becomes DP. If depth may pass about 10⁴, rewrite with an explicit stack.",
  ],
  code: `def factorial(n):
    if n <= 1:                         # base case: stops the recursion
        return 1
    return n * factorial(n - 1)        # recursive case: a smaller input, one frame per level

def factorial_tail(n, acc=1):
    """Tail form: nothing is left to do after the call, so it turns into a loop by hand."""
    while n > 1:                       # Python never removes tail calls, so write the loop
        n, acc = n - 1, acc * n
    return acc

def power(x, n):
    """Divide and conquer: T(n) = T(n / 2) + O(1), so O(log n) time and stack depth."""
    if n == 0:
        return 1
    half = power(x, n // 2)
    return half * half * (x if n % 2 else 1)

def merge_sort(a):
    """T(n) = 2T(n / 2) + O(n): log n levels, O(n) merge work per level."""
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    return out + left[i:] + right[j:]

def subsets(nums):
    """Backtracking: choose, explore, un-choose. 2^n leaves, depth n."""
    out, path = [], []
    def go(i):
        if i == len(nums):
            out.append(path[:])        # copy: path keeps changing
            return
        go(i + 1)                      # skip nums[i]
        path.append(nums[i])           # choose
        go(i + 1)                      # explore
        path.pop()                     # un-choose
    go(0)
    return out

def permutations(nums):
    out, path, used = [], [], [False] * len(nums)
    def go():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True; path.append(x)
            go()
            path.pop(); used[i] = False
    go()
    return out

def combination_sum(cands, target):
    """Reuse allowed. Sorting lets the loop stop at the first candidate that is too big (pruning)."""
    cands, out, path = sorted(cands), [], []
    def go(start, left):
        if left == 0:
            out.append(path[:])
            return
        for k in range(start, len(cands)):
            if cands[k] > left:
                break                  # prune: every later candidate is bigger still
            path.append(cands[k])
            go(k, left - cands[k])     # k, not k + 1: the same number may be reused
            path.pop()
    go(0, target)
    return out

def n_queens(n):
    """Count placements; sets make the column and diagonal checks O(1)."""
    cols, d1, d2 = set(), set(), set()
    def go(r):
        if r == n:
            return 1
        count = 0
        for c in range(n):
            if c in cols or r - c in d1 or r + c in d2:
                continue               # prune: attacked square
            cols.add(c); d1.add(r - c); d2.add(r + c)
            count += go(r + 1)
            cols.remove(c); d1.remove(r - c); d2.remove(r + c)
        return count
    return go(0)

def subsets_iterative(nums):
    """The same search with an explicit stack: no recursion depth limit."""
    out, stack = [], [(0, [])]
    while stack:
        i, path = stack.pop()
        if i == len(nums):
            out.append(path)
            continue
        stack.append((i + 1, path + [nums[i]]))
        stack.append((i + 1, path))
    return out

if __name__ == "__main__":
    assert factorial(5) == 120 == factorial_tail(5) and factorial(0) == 1
    assert power(2, 10) == 1024 and power(3, 0) == 1 and power(5, 3) == 125
    assert merge_sort([5, 2, 4, 7, 1, 3, 2, 6]) == [1, 2, 2, 3, 4, 5, 6, 7] and merge_sort([]) == []
    assert subsets([1, 2, 3]) == [[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]]
    assert subsets_iterative([1, 2, 3]) == subsets([1, 2, 3])
    assert permutations([1, 2, 3]) == [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
    assert combination_sum([2, 3, 6, 7], 7) == [[2, 2, 3], [7]] and combination_sum([2], 1) == []
    assert [n_queens(n) for n in range(1, 9)] == [1, 0, 0, 2, 10, 4, 40, 92]
    print("ok")`,
  ops: [
    {
      title: "Standard recursive shapes (time, and the stack depth in the note)",
      rows: [
        ["Linear: factorial, sum of a list, reverse a linked list", "O(n)", "O(n)", "one call per level; depth n, so O(n) stack"],
        ["Two bounds: reverse a string (l, r), palindrome check", "O(n)", "O(n)", "both ends move inwards; depth n / 2"],
        ["Binary on n - 1 without memo: naive Fibonacci", "O(1.618ⁿ)", "O(2ⁿ)", "each call makes two more; depth n. A memo makes it O(n)"],
        ["Halving: fast power, recursive binary search", "O(log n)", "O(log n)", "one call on n / 2; depth log n"],
        ["Divide and conquer: merge sort", "O(n log n)", "O(n log n)", "log n levels of O(n) merging; depth log n plus an O(n) buffer"],
        ["Divide and conquer: quicksort", "O(n log n)", "O(n²)", "a bad pivot splits n into n - 1 and 0; depth log n on average, n at worst unless you recurse on the smaller side first"],
        ["Tree traversal (pre, in, post order)", "O(n)", "O(n)", "every node once; depth is the height: log n balanced, n skewed"],
        ["Subsets (take or skip)", "O(n × 2ⁿ)", "O(n × 2ⁿ)", "2ⁿ leaves, O(n) to copy each; depth n"],
        ["Permutations (used flags)", "O(n × n!)", "O(n × n!)", "n! leaves, O(n) to copy each; depth n"],
        ["Combinations: choose k of n", "O(k × C(n, k))", "O(k × C(n, k))", "start index only moves right; depth k"],
        ["Combination sum with reuse", "exponential", "O(n^(T / m))", "T = target, m = smallest candidate; depth T / m; sorting plus break prunes most branches"],
        ["N-Queens", "far below n!", "O(n!)", "one queen per row; column and diagonal sets prune; depth n"],
        ["Grid word search", "O(R × C × 3^L)", "O(R × C × 3^L)", "every start cell, then 3 new directions per letter of a word of length L; depth L"],
        ["Memoised recursion (top-down DP)", "O(states × transition)", "O(states × transition)", "each state solved once; depth up to the number of states"],
      ],
    },
    {
      title: "Master theorem: T(n) = a·T(n / b) + O(n^d)",
      rows: [
        ["Binary search: a = 1, b = 2, d = 0", "O(log n)", "O(log n)", "a = b^d: every level costs O(1), log n levels"],
        ["Tree traversal by halves: a = 2, b = 2, d = 0", "O(n)", "O(n)", "a > b^d: leaves dominate, n^(log₂ 2) = n"],
        ["Merge sort: a = 2, b = 2, d = 1", "O(n log n)", "O(n log n)", "a = b^d: n work on each of log n levels"],
        ["Quickselect, good pivots: a = 1, b = 2, d = 1", "O(n)", "O(n²)", "a < b^d: the top level dominates, n + n/2 + n/4 ... = 2n; bad pivots break the halving"],
        ["Karatsuba multiplication: a = 3, b = 2, d = 1", "O(n^1.585)", "O(n^1.585)", "a > b^d: n^(log₂ 3)"],
        ["Strassen matrix multiplication: a = 7, b = 2, d = 2", "O(n^2.807)", "O(n^2.807)", "a > b^d: n^(log₂ 7)"],
        ["Not covered: T(n) = T(n - 1) + O(1) or 2T(n - 1) + O(1)", "O(n) / O(2ⁿ)", "O(n) / O(2ⁿ)", "the input shrinks by subtraction, not division: unroll the recursion instead"],
      ],
    },
    {
      title: "The call stack",
      rows: [
        ["Push a frame (make a call)", "O(1)", "O(1)", "arguments, locals and the return address; slower than a loop step by a constant"],
        ["Pop a frame (return)", "O(1)", "O(1)", "the caller resumes where it paused"],
        ["Space of a recursion", "O(depth)", "O(depth)", "only frames on the current path are alive, not the whole tree"],
        ["Depth limit in Python", "about 1000", "about 1000", "`RecursionError`; `sys.setrecursionlimit` raises it but the C stack can still overflow"],
        ["Depth limit in C++", "about 10⁵ frames", "stack overflow", "a few MB of stack; big local arrays in a frame use it up much faster"],
        ["Tail call", "O(1) stack if optimised", "O(depth)", "not guaranteed in C++ and never done in Python or Java"],
        ["Explicit stack instead of recursion", "O(depth) heap", "O(depth) heap", "the same order of visits, limited only by memory"],
      ],
    },
  ],
  builtins: [
    ["All permutations", "`next_permutation` on a sorted vector (handles duplicates)", "`itertools.permutations`"],
    ["All combinations of size k", "none: backtracking, or `prev_permutation` on a 0/1 mask", "`itertools.combinations`"],
    ["All subsets", "loop a bitmask from 0 to 2ⁿ - 1", "`itertools.chain` over `combinations(a, r)` for every r"],
    ["Cartesian product (each slot from a set)", "nested backtracking", "`itertools.product`"],
    ["Memoise a recursive function", "a `vector` or `unordered_map` cache", "`@functools.cache`"],
    ["Raise the depth limit", "no portable call: use an explicit stack", "`sys.setrecursionlimit(10**6)`"],
    ["Recursive lambda", "`function<int(int)> go = [&](int x) { ... };` or a C++23 `this auto` lambda", "a nested `def`"],
  ],
  when: [
    "The input is itself recursive: a tree, nested lists, an expression with brackets, a directory structure.",
    "\"Generate all\", \"list every\", \"return all possible\": subsets, permutations, combinations, partitions, valid strings.",
    "Small limits such as n ≤ 10 to 20 with \"all\" or \"any\" arrangement: exponential search with pruning is intended.",
    "Placement puzzles with constraints: N-Queens, Sudoku, word search in a grid, filling a pattern.",
    "The problem splits into independent halves whose answers combine: sorting, counting inversions, closest pair, building a balanced tree.",
    "A decision at each step (take or skip, which branch) and the plain recursion is the clearest first answer before adding a memo.",
  ],
  avoid: [
    "Only a count or a best value is needed and the recursion repeats arguments: add a memo or write a DP table instead of enumerating.",
    "Depth can reach 10⁵ or more (a long linked list, a path-shaped tree, a big grid flood fill): use a loop, an explicit stack or BFS.",
    "A loop is just as clear, such as summing an array or walking a list: recursion adds stack cost for nothing.",
    "A greedy choice is provably safe: exploring every option is wasted work.",
    "The search space is huge with no pruning (n = 50 subsets): rethink the problem, often with DP, meet in the middle or maths.",
  ],
  tips: [
    "Say the base case first, out loud, and test the function on it before anything else.",
    "Record `path[:]` (Python) or `out.push_back(path)` by value at a leaf; appending the shared list itself gives a list of empty lists.",
    "Every choose needs its un-choose on every path out of the call, including after an early `continue`; keep them adjacent so none is missed.",
    "Duplicates in the input: sort, then skip `nums[i] == nums[i - 1]` when `i > start` (combinations) or when the equal neighbour is unused (permutations).",
    "State the complexity from the tree: branching factor to the power of depth, times the work per node, plus the depth as the stack space.",
    "Pass indices, not slices: `go(i + 1)` is O(1), `go(nums[1:])` copies the list at every level.",
    "If the interviewer asks about very deep input, offer the explicit-stack version or point out Python's limit of about 1000 frames.",
    "Mutable default arguments (`def go(path=[])`) are shared across calls in Python; create the list once outside instead.",
  ],
  viz: [
    { name: "Call stack: fast power by halving", label: "Exponent n (4 to 40)", input: "10", make: (s) => powerStack(2, clampInt(nums(s, [10])[0], 4, 40)) },
    { name: "Recursion tree and its cost: merge sort", label: "Up to 8 numbers", input: "5, 2, 4, 7, 1, 3, 2, 6", make: (s) => { const a = nums(s, [5, 2, 4, 7, 1, 3, 2, 6], 8); return mergeTree(a.length >= 3 ? a : [5, 2, 4, 7, 1, 3, 2, 6]); } },
    { name: "Backtracking with pruning: combination sum", make: () => comboTree([2, 3, 6, 7], 7) },
  ],
};
