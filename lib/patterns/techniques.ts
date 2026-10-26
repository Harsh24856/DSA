import * as S from "../sim";
import { nums, text, type Topic } from "./types";

export const DP: Topic = {
  id: "dp", name: "Dynamic programming",
  blurb: "Recursion where the same subproblems repeat. Define a state, write how it depends on smaller states, and compute each state once.",
  basics: ["Four questions: what is the state, what is the transition, what are the base cases, where is the answer?", "Time = number of states × work per state.", "Top-down (memo) is easier to write; bottom-up (table) is easier to shrink to O(1) or O(n) space."],
  patterns: [
    {
      n: 1, name: "1D linear DP", summary: "dp[i] depends on a few earlier entries: climbing stairs, house robber, decode ways, coin-change style counts.",
      signals: ["number of ways to reach step n", "max money without taking neighbours", "decode ways, word break", "min cost climbing stairs"],
      idea: ["Ask: what is the last decision at index i? For house robber it is 'rob house i' (then i - 1 is off limits) or 'skip it'. So dp[i] = max(dp[i-1], dp[i-2] + a[i]).", "When dp[i] only needs the last two values, keep two variables instead of the array."],
      steps: ["State: dp[i] = best answer for the prefix ending at i", "Transition from dp[i-1], dp[i-2]…", "Base cases for the first one or two indices", "Answer: dp[n-1]"],
      code: `def rob(a):
    prev2 = prev1 = 0
    for x in a:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "O(n) with the full table. Word break is O(n²) (each end tries every start)." },
      traps: ["Off-by-one between 'first i items' and 'up to index i'; pick one meaning and stick to it.", "Decode ways: '0' cannot stand alone, and '30' is not a valid pair.", "House robber II (circle): run twice, excluding the first house, then the last."],
      viz: { make: (i) => S.houseRobber(nums(i, [2, 7, 9, 3, 1], 9)), input: "2, 7, 9, 3, 1", label: "house values" },
    },
    {
      n: 2, name: "Knapsack family", summary: "Choose items under a capacity. 0/1: each item once (loop capacity downward). Unbounded: reuse items (loop upward).",
      signals: ["partition equal subset sum, target sum", "coin change (min coins / number of ways)", "ones and zeroes", "last stone weight II"],
      idea: ["dp[c] = best value with capacity c. For each item, dp[c] = max(dp[c], dp[c - w] + v).", "Going DOWN over c in the inner loop means dp[c - w] still holds the value from before this item, so each item is used at most once. Going UP lets the item be reused (unbounded).", "Counting ways (coin change II): loop coins outside and amounts inside to count combinations, not permutations."],
      steps: ["dp = [0] + [base] * C", "for each item (w, v):", "  for c in range(C, w - 1, -1)  (0/1)  or  range(w, C + 1)  (unbounded)", "    dp[c] = best(dp[c], dp[c - w] + v)"],
      code: `def can_partition(nums):
    total = sum(nums)
    if total % 2: return False
    T = total // 2
    dp = [True] + [False] * T
    for x in nums:
        for c in range(T, x - 1, -1):     # downward: each number once
            dp[c] = dp[c] or dp[c - x]
    return dp[T]`,
      complexity: { best: "O(n · C)", average: "O(n · C)", worst: "O(n · C)", space: "O(C)", note: "C = capacity or target. This is pseudo-polynomial: it grows with the value of C, not its digit count." },
      traps: ["Wrong loop direction turns 0/1 into unbounded (or the reverse).", "Coin change min coins: initialise with infinity, not 0, and dp[0] = 0.", "Target sum reduces to subset sum: P = (target + total) / 2 must be a non-negative integer."],
      viz: { make: () => S.knapsackTable() },
    },
    {
      n: 3, name: "LIS (longest increasing subsequence)", summary: "O(n²): dp[i] = 1 + max dp[j] for j < i with a[j] < a[i]. O(n log n): keep the smallest possible tail for every length.",
      signals: ["longest increasing subsequence", "russian doll envelopes", "number of LIS", "largest divisible subset, longest chain"],
      idea: ["tails[k] = the smallest ending value of any increasing subsequence of length k + 1. For each x, binary search the first tail >= x and replace it (or append if x beats every tail). The length of tails is the LIS length.", "Replacing never shortens anything; a smaller tail just leaves more room for future elements."],
      steps: ["tails = []", "for x: i = bisect_left(tails, x)", "i == len(tails) → append, else tails[i] = x", "return len(tails)"],
      code: `import bisect
def lis(a):
    tails = []
    for x in a:
        i = bisect.bisect_left(tails, x)
        if i == len(tails): tails.append(x)
        else: tails[i] = x
    return len(tails)`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "The simple DP is O(n²). tails is not itself an increasing subsequence of the input; it only has the right length." },
      traps: ["Strictly increasing uses bisect_left; non-decreasing uses bisect_right.", "Russian dolls: sort by width ascending and height DESCENDING, then LIS on heights.", "To rebuild the sequence, store each element's predecessor index."],
      viz: { make: (i) => S.lisTails(nums(i, [10, 9, 2, 5, 3, 7, 101, 18], 10)), input: "10, 9, 2, 5, 3, 7, 101, 18", label: "numbers" },
    },
    {
      n: 4, name: "LCS and edit distance", summary: "Two strings, a 2D table. dp[i][j] looks at the last characters: match moves diagonally, otherwise take the best of dropping one character.",
      signals: ["longest common subsequence", "edit distance", "delete operations for two strings", "distinct subsequences, interleaving string"],
      idea: ["dp[i][j] = answer for the first i characters of a and the first j of b.", "LCS: equal last characters → dp[i-1][j-1] + 1, else max(dp[i-1][j], dp[i][j-1]). Edit distance: equal → dp[i-1][j-1], else 1 + min(insert, delete, replace).", "Row i only reads rows i and i - 1, so two rows (or one with a saved diagonal) suffice."],
      steps: ["(m+1) × (n+1) table, row/column 0 = empty string base cases", "fill row by row", "answer at dp[m][n]"],
      code: `def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]`,
      complexity: { best: "O(m · n)", average: "O(m · n)", worst: "O(m · n)", space: "O(m · n)", note: "Space drops to O(min(m, n)) with rolling rows." },
      traps: ["Edit distance base cases: dp[i][0] = i and dp[0][j] = j, not 0.", "Index the strings with i - 1 and j - 1 inside a 1-indexed table.", "Subsequence (skips allowed) vs substring (contiguous): substring resets to 0 on mismatch."],
      viz: { make: (i) => { const [a, b] = text(i, "abcde ace", 20).split(/\s+/); return S.lcsTable((a || "abcde").slice(0, 7), (b || "ace").slice(0, 6)); }, input: "abcde ace", label: "two strings separated by a space" },
    },
    {
      n: 5, name: "Grid DP", summary: "dp[r][c] comes from the cell above and the cell to the left: unique paths, minimum path sum, obstacles, maximal square.",
      signals: ["unique paths (with obstacles)", "minimum path sum", "maximal square of 1s", "dungeon game, cherry pickup"],
      idea: ["If you can only move right or down, every path into (r, c) comes from (r-1, c) or (r, c-1). Combine those two.", "Maximal square: dp[r][c] = 1 + min(up, left, up-left) when the cell is 1, the side of the largest square ending there.", "Dungeon game runs backward from the goal, because the needed health depends on what comes later."],
      steps: ["first row and column have one way in", "dp[r][c] = combine(dp[r-1][c], dp[r][c-1])", "obstacle → 0 (or infinity for min problems)"],
      code: `def unique_paths(R, C):
    row = [1] * C
    for _ in range(1, R):
        for c in range(1, C):
            row[c] += row[c - 1]        # above + left
    return row[-1]`,
      complexity: { best: "O(R · C)", average: "O(R · C)", worst: "O(R · C)", space: "O(C)", note: "One row is enough. Unique paths also has a closed form: C(R + C - 2, R - 1)." },
      traps: ["An obstacle in the first row blocks every cell to its right, not just itself.", "Maximal square returns the area: side².", "Cherry pickup needs two walkers moving together, a 3D state."],
      viz: { make: () => S.gridPaths() },
    },
    {
      n: 6, name: "Interval DP", summary: "dp[i][j] is the best answer for the range i..j, built from smaller ranges by trying every split point k.",
      signals: ["burst balloons", "matrix chain multiplication", "minimum cost to cut a stick", "palindrome partitioning II, longest palindromic subsequence"],
      idea: ["Fill the table by increasing range length so every smaller range is ready. dp[i][j] = best over k of combine(dp[i][k], dp[k+1][j]) + cost of this split.", "Burst balloons: think of k as the LAST balloon burst in (i, j); then its neighbours at that moment are i and j, which makes the subproblems independent."],
      steps: ["for length in 2..n:", "  for i: j = i + length - 1", "    dp[i][j] = min/max over k in [i, j) of dp[i][k] + dp[k+1][j] + cost(i, k, j)"],
      code: `def matrix_chain(d):            # matrices d[i] x d[i+1]
    n = len(d) - 1
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = min(dp[i][k] + dp[k + 1][j] + d[i] * d[k + 1] * d[j + 1]
                           for k in range(i, j))
    return dp[0][n - 1]`,
      complexity: { best: "O(n³)", average: "O(n³)", worst: "O(n³)", space: "O(n²)", note: "n² ranges, up to n split points each. Longest palindromic subsequence has O(1) transitions, so it is O(n²)." },
      traps: ["Filling row by row from the top reads ranges that are not ready yet; go by length.", "Burst balloons: pad the array with 1 at both ends.", "Cut a stick: sort the cut positions and add 0 and n as boundaries."],
      viz: { make: () => S.intervalDp() },
    },
    {
      n: 7, name: "State-machine DP", summary: "At each step you are in one of a few states (holding, sold, cooldown). Each state's best value comes from the allowed previous states.",
      signals: ["best time to buy and sell stock (cooldown, fee, k transactions)", "paint house, paint fence", "delete and earn", "number of subsequences with a property"],
      idea: ["Write the states and arrows first. For stock with cooldown: hold → (keep holding) or rest → buy; sold = hold + sell today; rest = previous rest or previous sold.", "Each day's values only use yesterday's, so keep one variable per state."],
      steps: ["List states and the moves between them", "Initialise day 0", "Update all states together each step (use the old values)", "Answer: best of the allowed final states"],
      code: `def max_profit_cooldown(prices):
    hold, sold, rest = float("-inf"), 0, 0
    for p in prices:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)`,
      complexity: { best: "O(n)", average: "O(n · s)", worst: "O(n · s)", space: "O(s)", note: "s = number of states. With k transactions, states = 2k, so O(n · k)." },
      traps: ["Updating one state and then reading it for another in the same step; assign all at once (tuple assignment).", "Transaction fee: subtract it once per transaction (on sell OR buy, not both).", "k ≥ n / 2 transactions is just 'unlimited'; use the uptick greedy."],
      viz: { make: (i) => S.stateMachine(nums(i, [1, 2, 3, 0, 2], 8)), input: "1, 2, 3, 0, 2", label: "prices" },
    },
    {
      n: 8, name: "Bitmask DP", summary: "When n ≤ about 20, a bitmask can record which items are used. dp[mask] is the best result for exactly that set.",
      signals: ["assign n people to n jobs at minimum cost", "travelling salesman (visit all nodes)", "partition into k equal subsets", "shortest path visiting all nodes"],
      idea: ["There are 2ⁿ subsets; for n = 20 that is about a million states, which is fine. From each mask, try adding one unused item.", "TSP-like problems need dp[mask][last]: the set visited and where you ended."],
      steps: ["dp[0] = 0, everything else infinity", "for mask in increasing order: for each item not in mask: relax dp[mask | 1 << j]", "answer: dp[(1 << n) - 1]"],
      code: `def min_assign(cost):
    n = len(cost)
    dp = [float("inf")] * (1 << n)
    dp[0] = 0
    for mask in range(1 << n):
        i = bin(mask).count("1")          # next person to assign
        if i == n: continue
        for j in range(n):
            if not mask & (1 << j):
                dp[mask | 1 << j] = min(dp[mask | 1 << j], dp[mask] + cost[i][j])
    return dp[-1]`,
      complexity: { best: "O(2ⁿ · n)", average: "O(2ⁿ · n)", worst: "O(2ⁿ · n)", space: "O(2ⁿ)", note: "With a 'last node' dimension (TSP): O(2ⁿ · n²) time, O(2ⁿ · n) space." },
      traps: ["Only feasible for small n; check the constraint first.", "Operator precedence: write mask | (1 << j) with parentheses in most languages.", "Process masks in increasing order so every subset is final before it is extended."],
      viz: { make: () => S.bitmaskDp() },
    },
  ],
};

export const RECURSION: Topic = {
  id: "recursion-backtracking", name: "Recursion and backtracking",
  blurb: "A function that solves a problem by calling itself on a smaller version. Backtracking adds choose, explore, un-choose to search every option.",
  basics: ["Every recursion needs a base case that stops it and a step that makes the input smaller.", "Space = maximum depth of the call stack.", "Branching factor b and depth d give b^d calls; that is why memo or pruning matters."],
  patterns: [
    {
      n: 1, name: "Linear recursion", summary: "One recursive call per level: factorial, reverse a list, power set by index, print 1..n.",
      signals: ["solve for n using the answer for n - 1", "reverse a linked list recursively", "sum or count over a list", "recursive versions of simple loops"],
      idea: ["Trust the call: assume f(n - 1) is correct, and only write how to turn it into f(n).", "The call stack holds one frame per level, so depth n means O(n) space even when the loop version is O(1)."],
      steps: ["Base case first", "Make the problem smaller by one", "Combine the smaller answer with the current element"],
      code: `def reverse_list(head):
    if not head or not head.next:
        return head
    new_head = reverse_list(head.next)
    head.next.next = head      # the next node points back at me
    head.next = None
    return new_head`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Space is the stack depth. Tail calls are NOT optimised in Python or Java." },
      traps: ["A missing or unreachable base case means infinite recursion.", "Python's default limit is 1000 frames; sys.setrecursionlimit only goes so far.", "Do work before or after the call deliberately: that is the difference between pre- and post-order."],
      viz: { make: (i) => S.callStack(Math.max(1, Math.min(7, Math.round(nums(i, [4])[0])))), input: "4", label: "n for factorial (1 to 7)" },
    },
    {
      n: 2, name: "Recursion on two bounds", summary: "Pass a pair of indices (l, r) and shrink both: reverse a string, check a palindrome, two-pointer logic written recursively.",
      signals: ["reverse string recursively", "is s a palindrome (recursive)", "swap pairs", "process from both ends"],
      idea: ["Handle the outer pair, then recurse on (l + 1, r - 1). The base case is l >= r.", "It is the recursive twin of two pointers; interviewers use it to check you can carry state through parameters."],
      steps: ["if l >= r: return", "work on s[l] and s[r]", "recurse(l + 1, r - 1)"],
      code: `def reverse(s, l=0, r=None):
    if r is None: r = len(s) - 1
    if l >= r: return
    s[l], s[r] = s[r], s[l]
    reverse(s, l + 1, r - 1)`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "n / 2 calls deep." },
      traps: ["Use l >= r, not l == r, or even lengths skip the stop.", "Pass indices rather than slicing; slicing copies and makes it O(n²).", "The iterative two-pointer version is usually better in production code."],
      viz: { make: (i) => S.reverseString(text(i, "hello", 12)), input: "hello", label: "string" },
    },
    {
      n: 3, name: "Divide and conquer", summary: "Split into independent halves, solve each, combine. Merge sort, quickselect, fast power, building balanced trees.",
      signals: ["sort an array in O(n log n)", "pow(x, n), count inversions", "maximum subarray (D&C version)", "different ways to add parentheses"],
      idea: ["The Master theorem gives the cost: T(n) = 2T(n/2) + O(n) is O(n log n) (merge sort); T(n) = T(n/2) + O(1) is O(log n) (binary search, fast power).", "Fast power: x^n = (x^(n/2))² times x if n is odd, so log n multiplications."],
      steps: ["Base case for size 0 or 1", "Split into halves", "Recurse on each", "Combine the results"],
      code: `def merge_sort(a):
    if len(a) <= 1: return a
    m = len(a) // 2
    L, R = merge_sort(a[:m]), merge_sort(a[m:])
    out, i, j = [], 0, 0
    while i < len(L) and j < len(R):
        if L[i] <= R[j]: out.append(L[i]); i += 1
        else: out.append(R[j]); j += 1
    return out + L[i:] + R[j:]`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "Merge sort is O(n log n) in every case. Quicksort: O(n log n) average, O(n²) worst." },
      traps: ["Count inversions: add len(L) - i whenever an element is taken from R.", "pow(x, n) with negative n: compute pow(1/x, -n).", "Different ways to add parentheses: memoise on the substring to avoid repeated work."],
      viz: { make: (i) => S.mergeSort(nums(i, [5, 2, 4, 6, 1, 3, 2, 6], 10)), input: "5, 2, 4, 6, 1, 3, 2, 6", label: "numbers" },
    },
    {
      n: 4, name: "Memoisation (top-down DP)", summary: "Write the plain recursion, then cache each state's answer. Exponential trees collapse to one call per state.",
      signals: ["the recursion tree repeats the same arguments", "climbing stairs, house robber, unique paths", "word break, decode ways", "any DP you find easier to write recursively"],
      idea: ["Fibonacci's recursion tree has about 2ⁿ calls but only n distinct arguments. Caching the result of each argument makes every later call O(1).", "Time = number of distinct states × work per state. The cache key is exactly the set of arguments that change."],
      steps: ["Write the brute-force recursion", "Identify the changing arguments: that is the state", "Add @cache (or a dict) on those arguments", "Optionally convert to a bottom-up table"],
      code: `from functools import cache
def climb(n):
    @cache
    def f(i):
        if i <= 1: return 1
        return f(i - 1) + f(i - 2)
    return f(n)`,
      complexity: { best: "O(n)", average: "O(states × work)", worst: "O(states × work)", space: "O(states + depth)", note: "Without the memo, Fibonacci-style recursion is O(2ⁿ)." },
      traps: ["Mutable arguments (lists) cannot be cache keys; pass indices.", "Do not include values that never change in the key.", "Deep recursion can still overflow; switch to bottom-up if n is large."],
      viz: { make: () => S.recursionTree("fib") },
    },
    {
      n: 5, name: "Backtracking", summary: "Build a candidate one choice at a time: choose, explore, un-choose. Prune branches that cannot lead to a valid answer.",
      signals: ["all subsets / permutations / combinations", "combination sum", "N-Queens, sudoku", "word search, palindrome partitioning"],
      idea: ["The search is a decision tree. A recursive call explores one branch; undoing the choice afterwards lets the same list be reused for the next branch.", "Pruning cuts whole subtrees: stop when the running sum exceeds the target, or when a queen is already attacked.", "Duplicates: sort first and skip a value equal to the previous one at the same tree level."],
      steps: ["def bt(start, path):", "  if path is complete: record a copy", "  for each choice: if valid → add, bt(next, path), remove"],
      code: `def subsets(nums):
    out, path = [], []
    def bt(i):
        if i == len(nums):
            out.append(path[:]); return
        bt(i + 1)                 # skip nums[i]
        path.append(nums[i])      # take nums[i]
        bt(i + 1)
        path.pop()                # undo
    bt(0)
    return out`,
      complexity: { best: "O(2ⁿ · n)", average: "O(2ⁿ · n)", worst: "O(n! · n)", space: "O(n)", note: "Subsets: 2ⁿ results × O(n) to copy each. Permutations: n! results. Pruning lowers the real cost but not the worst-case bound." },
      traps: ["Append path[:] (a copy), not path, or every result ends up the same empty list.", "Combinations reuse: pass i (reuse allowed) or i + 1 (each once) to the next call.", "Skip duplicates with 'if i > start and nums[i] == nums[i - 1]: continue' after sorting."],
      viz: { make: () => S.recursionTree("subsets") },
    },
  ],
};

export const GREEDY: Topic = {
  id: "greedy", name: "Greedy",
  blurb: "Make the locally best choice and never undo it. It only works when you can argue that the greedy choice can always be swapped into some optimal answer.",
  basics: ["Prove it with an exchange argument, or find a counter-example in under a minute.", "Most greedy solutions are 'sort by the right key, then one pass'.", "If greedy fails on a small example, the problem is probably DP."],
  patterns: [
    {
      n: 1, name: "Interval scheduling", summary: "Sort by end time and keep every interval that starts after the last kept one ends.",
      signals: ["maximum non-overlapping intervals", "minimum arrows to burst balloons", "minimum removals to make intervals disjoint", "maximum length of pair chain"],
      idea: ["Choosing the interval that ends first leaves the most time for everything else. Any optimal schedule can swap its first interval for this one without losing anything."],
      steps: ["sort by end", "end = -inf", "start >= end → take it, end = its end"],
      code: `def max_non_overlap(iv):
    iv.sort(key=lambda x: x[1])
    end, count = float("-inf"), 0
    for s, e in iv:
        if s >= end:
            count += 1; end = e
    return count`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)", note: "Sort, then one pass." },
      traps: ["Sorting by start or by length gives wrong answers.", "Balloons: touching counts as overlapping, so use > for a new arrow.", "Meeting rooms II (count rooms) is a sweep or heap problem, not this one."],
      viz: { make: () => S.activitySelect() },
    },
    {
      n: 2, name: "Jump game / reachability", summary: "Track the farthest index you can reach. If you ever stand beyond it, you are stuck.",
      signals: ["can you reach the last index", "minimum jumps", "gas station", "video stitching"],
      idea: ["Scanning left to right, reach = max(reach, i + a[i]). If i > reach at any point, index i is unreachable.", "Minimum jumps is BFS in disguise: the current window [start, end] is one jump; the farthest reach from it is the next window.", "Gas station: if total gas >= total cost an answer exists, and it is just after the point where the running tank last went negative."],
      steps: ["reach = 0", "for i: if i > reach → False; reach = max(reach, i + a[i])", "True"],
      code: `def jump(a):
    jumps = end = far = 0
    for i in range(len(a) - 1):
        far = max(far, i + a[i])
        if i == end:              # finished one jump's window
            jumps += 1; end = far
    return jumps`,
      complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Best case: the first element already reaches the end." },
      traps: ["Jump II: loop to n - 2, not n - 1, or you count an extra jump.", "Gas station: reset the start when the running tank drops below zero.", "Do not try to simulate every jump length; that is O(n²) or worse."],
      viz: { make: (i) => S.jumpGame(nums(i, [2, 3, 1, 1, 4], 10)), input: "2, 3, 1, 1, 4", label: "jump lengths" },
    },
    {
      n: 3, name: "Stock buy and sell (upticks)", summary: "With unlimited transactions, profit is the sum of every positive day-to-day change.",
      signals: ["best time to buy and sell stock II", "maximum profit with unlimited trades", "sum of increases", "(one trade only: track the minimum so far)"],
      idea: ["Any buy at day i and sell at day j earns p[j] - p[i], which equals the sum of the daily changes between them. Taking only the positive changes is therefore never worse.", "One transaction (stock I) is a different problem: keep the lowest price so far and the best p - low."],
      steps: ["profit = 0", "for i in 1..n-1: profit += max(0, p[i] - p[i-1])"],
      code: `def max_profit(p):
    return sum(max(0, p[i] - p[i - 1]) for i in range(1, len(p)))`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Cooldown or fees break this; use state-machine DP." },
      traps: ["This greedy needs unlimited transactions; with k limits use DP.", "Stock I: the buy must come before the sell, so update the minimum after computing profit… or before, consistently.", "Fees: greedy-by-uptick overpays the fee; use the hold/cash DP."],
      viz: { make: (i) => S.stockGreedy(nums(i, [7, 1, 5, 3, 6, 4], 10)), input: "7, 1, 5, 3, 6, 4", label: "prices" },
    },
    {
      n: 4, name: "Partition labels / last occurrence", summary: "Record where each character last appears. A part must stretch at least to the last occurrence of every character inside it.",
      signals: ["partition labels", "remove duplicate letters / smallest subsequence", "merge triplets", "minimum number of segments"],
      idea: ["Walk the string extending end = max(end, last[c]). When i reaches end, nothing inside the part appears later, so cut there.", "Remove duplicate letters adds a monotonic stack: pop a bigger letter if it appears again later."],
      steps: ["last[c] = final index of c", "start = end = 0", "for i, c: end = max(end, last[c]); if i == end: cut [start, end], start = i + 1"],
      code: `def partition_labels(s):
    last = {c: i for i, c in enumerate(s)}
    out, start, end = [], 0, 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            out.append(end - start + 1); start = i + 1
    return out`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(alphabet)", note: "Two passes over the string." },
      traps: ["Build last[] in a full first pass; you cannot know it on the fly.", "Return sizes or substrings, whichever the problem asks.", "Smallest subsequence needs 'seen' to avoid pushing a letter twice."],
      viz: { make: (i) => S.partitionLabels(text(i, "ababcbacadefegde", 18)), input: "ababcbacadefegde", label: "string" },
    },
    {
      n: 5, name: "Heap-driven greedy", summary: "The best choice changes after every move, so keep candidates in a heap: task scheduling, connecting ropes, IPO, course schedule III.",
      signals: ["task scheduler", "minimum cost to connect sticks", "IPO (max capital)", "course schedule III, furthest building"],
      idea: ["Repeatedly take the current best candidate in O(log n). Often a second ordering (by deadline, by capital) decides which candidates are even available.", "Course schedule III: take courses by deadline; if the total time overflows, drop the longest course taken so far (a max-heap)."],
      steps: ["Sort by the availability key", "Push newly available candidates into a heap", "Pop the best one and act", "Repeat"],
      code: `import heapq
def connect_sticks(sticks):
    heapq.heapify(sticks)
    cost = 0
    while len(sticks) > 1:
        a, b = heapq.heappop(sticks), heapq.heappop(sticks)
        cost += a + b
        heapq.heappush(sticks, a + b)
    return cost`,
      complexity: { best: "O(n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "heapify is O(n); each combine is O(log n)." },
      traps: ["Combining the two smallest each time is the Huffman argument; combining largest is wrong here.", "IPO: push every project you can afford before popping the most profitable.", "Furthest building: use ladders on the k largest climbs (min-heap of size k)."],
      viz: { make: () => S.heapGreedy() },
    },
    {
      n: 6, name: "Trapping water / two-pointer greedy", summary: "Move the pointer on the lower side: its water level is already decided by its own side's maximum.",
      signals: ["trapping rain water", "container with most water", "boats to save people", "two-sided greedy on a sorted array"],
      idea: ["Water above i = min(maxLeft, maxRight) - h[i]. If the left wall is lower, the left max is the binding one no matter what lies further right, so the left cell's water is final and L can move.", "Container: the shorter line limits the area, so moving the taller one can never help. Move the shorter."],
      steps: ["L, R at the ends; leftMax = rightMax = 0", "if h[L] < h[R]: update leftMax, add leftMax - h[L], L += 1", "else: mirror on the right"],
      code: `def trap(h):
    L, R, lm, rm, water = 0, len(h) - 1, 0, 0, 0
    while L < R:
        if h[L] < h[R]:
            lm = max(lm, h[L]); water += lm - h[L]; L += 1
        else:
            rm = max(rm, h[R]); water += rm - h[R]; R -= 1
    return water`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "The prefix-max/suffix-max version is also O(n) but uses O(n) memory." },
      traps: ["Update the max before subtracting, so water is never negative.", "Container: area uses (R - L) × min(h[L], h[R]).", "Boats: sort, pair the heaviest with the lightest when they fit."],
      viz: { make: (i) => S.trapWater(nums(i, [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], 12)), input: "0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1", label: "heights" },
    },
    {
      n: 7, name: "Sort by delta / gain", summary: "Sort by the difference between options (how much you save by choosing A over B), then decide in that order.",
      signals: ["two city scheduling", "assign cookies, boats", "minimum cost of buying candies", "reduce array size to half, maximum units on a truck"],
      idea: ["When everyone must pick one of two options with a quota, what matters is the relative cost a - b. People who save the most by going to A should go to A.", "Many 'maximise total' problems reduce to sorting by value per unit and taking the best first (fractional knapsack logic)."],
      steps: ["Compute the key (a - b, value per unit, …)", "Sort by it", "Assign greedily respecting quotas"],
      code: `def two_city(costs):
    costs.sort(key=lambda c: c[0] - c[1])
    n = len(costs) // 2
    return sum(c[0] for c in costs[:n]) + sum(c[1] for c in costs[n:])`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)", note: "Sorting dominates." },
      traps: ["Sorting by absolute cost instead of the difference is the common bug.", "0/1 knapsack is NOT greedy by value per weight; only the fractional version is.", "Check the quota constraint (exactly n each)."],
      viz: { make: () => S.twoCity() },
    },
  ],
};

export const BITS: Topic = {
  id: "bit-and-math", name: "Bits and maths",
  blurb: "Bit tricks replace loops with single operations; a little number theory (GCD, primes, modular power) unlocks a whole class of problems.",
  basics: ["x & 1 tests odd; x >> 1 halves; 1 << k is 2^k.", "x & (x - 1) clears the lowest set bit; x & -x isolates it.", "Work modulo 10⁹ + 7 at every step when answers can be huge."],
  patterns: [
    {
      n: 1, name: "Basic bit operations", summary: "Set, clear, toggle and test single bits with masks; count set bits with Kernighan's trick.",
      signals: ["number of 1 bits", "counting bits for 0..n", "reverse bits", "hamming distance"],
      idea: ["Bit i is (x >> i) & 1. Set: x | (1 << i). Clear: x & ~(1 << i). Toggle: x ^ (1 << i).", "x & (x - 1) removes the lowest 1, so looping it counts the 1s in as many steps as there are 1s.", "Counting bits for all numbers: bits[i] = bits[i >> 1] + (i & 1)."],
      steps: ["Build the mask with 1 << i", "Combine with &, |, ^", "Shift to read or write positions"],
      code: `def count_bits(n):
    out = [0] * (n + 1)
    for i in range(1, n + 1):
        out[i] = out[i >> 1] + (i & 1)
    return out

def popcount(x):
    c = 0
    while x:
        x &= x - 1; c += 1
    return c`,
      complexity: { best: "O(1)", average: "O(set bits)", worst: "O(word size)", space: "O(1)", note: "Kernighan's loop runs once per set bit. Counting bits 0..n is O(n)." },
      traps: ["Python ints are unbounded; mask with & 0xFFFFFFFF for 32-bit behaviour.", "Precedence: & binds weaker than == in many languages; use parentheses.", "Reverse bits must loop exactly 32 times, including leading zeros."],
      viz: { make: (i) => S.bitOps(Math.max(1, Math.min(255, Math.round(nums(i, [44])[0])))), input: "44", label: "number from 1 to 255" },
    },
    {
      n: 2, name: "XOR tricks", summary: "a ^ a = 0 and a ^ 0 = a, so XOR-ing everything cancels pairs and leaves what is unpaired.",
      signals: ["single number (every other element twice)", "missing number", "two single numbers", "find the difference between two strings"],
      idea: ["XOR is commutative and associative, so order does not matter: pairs cancel to 0.", "Two lonely numbers a and b: XOR of all = a ^ b. Any set bit of it differs between a and b; split the numbers by that bit and XOR each group.", "Single number II (others appear three times): count each bit's ones modulo 3."],
      steps: ["acc = 0", "for x: acc ^= x", "acc is the unpaired value"],
      code: `def single_number(nums):
    acc = 0
    for x in nums: acc ^= x
    return acc

def missing_number(nums):
    acc = len(nums)
    for i, x in enumerate(nums): acc ^= i ^ x
    return acc`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "One pass, one variable. A hash set also works but uses O(n) memory." },
      traps: ["XOR only cancels exact pairs; three copies leave one behind.", "Lowest set bit for splitting: diff & -diff.", "Missing number: include n itself, which is why acc starts at len(nums)."],
      viz: { make: (i) => S.xorSingle(nums(i, [4, 1, 2, 1, 2], 9)), input: "4, 1, 2, 1, 2", label: "numbers (every value twice except one)" },
    },
    {
      n: 3, name: "Bitmask enumeration", summary: "Each integer from 0 to 2ⁿ - 1 is a subset: bit i set means item i is included.",
      signals: ["generate all subsets", "maximum product of word lengths (letter masks)", "count states for small n", "check all combinations of n ≤ 20 items"],
      idea: ["Looping mask from 0 to 2ⁿ - 1 visits every subset exactly once, with no recursion.", "Represent a word's letters as a 26-bit mask; two words share no letters iff mask1 & mask2 == 0.", "Submasks of a mask: s = mask; while s: …; s = (s - 1) & mask."],
      steps: ["for mask in range(1 << n):", "  subset = [items[i] for i in range(n) if mask >> i & 1]"],
      code: `def subsets(nums):
    n = len(nums)
    return [[nums[i] for i in range(n) if mask >> i & 1]
            for mask in range(1 << n)]`,
      complexity: { best: "O(2ⁿ · n)", average: "O(2ⁿ · n)", worst: "O(2ⁿ · n)", space: "O(2ⁿ · n)", note: "Output size dominates. Enumerating all submasks of all masks is O(3ⁿ)." },
      traps: ["Only practical for n up to about 20.", "Bit order maps to item order; be consistent.", "1 << n overflows 32-bit ints at n = 31."],
      viz: { make: () => S.bitmaskSubsets() },
    },
    {
      n: 4, name: "Power of two and arithmetic without +", summary: "A power of two has exactly one set bit, so n & (n - 1) == 0. Addition is XOR for the sum and AND-shift for the carry.",
      signals: ["power of two / four", "sum of two integers without + or -", "divide two integers without / (doubling)", "is a number a power of something"],
      idea: ["n - 1 flips the single set bit and every bit below it, so ANDing them leaves 0 only for powers of two.", "a + b = (a ^ b) + ((a & b) << 1): XOR adds without carrying, AND-shift computes the carry. Repeat until the carry is 0.", "Division without /: subtract the largest doubled divisor that fits, repeatedly."],
      steps: ["power of two: n > 0 and n & (n - 1) == 0", "power of four: also n & 0x55555555 != 0 (the bit is in an even position)"],
      code: `def is_power_of_two(n):
    return n > 0 and n & (n - 1) == 0

def get_sum(a, b):
    M = 0xFFFFFFFF
    while b & M:
        a, b = (a ^ b), (a & b) << 1
    return a & M if b > M else a`,
      complexity: { best: "O(1)", average: "O(1)", worst: "O(word size)", space: "O(1)", note: "The add loop runs at most 32 times for 32-bit numbers." },
      traps: ["0 is not a power of two: check n > 0.", "Python's unbounded ints make the add loop spin on negatives without the 32-bit mask.", "Divide: handle the overflow case (-2³¹ / -1)."],
      viz: { make: (i) => S.powerOfTwo(nums(i, [16, 18, 32, 7], 5).map((x) => Math.max(1, Math.min(255, Math.round(x))))), input: "16, 18, 32, 7", label: "numbers from 1 to 255" },
    },
    {
      n: 5, name: "Prefix XOR and range bit tricks", summary: "Prefix XOR answers range XOR queries in O(1); the AND of a range is the common high-bit prefix of its ends.",
      signals: ["XOR queries of a subarray", "count triplets with equal XOR", "bitwise AND of a numbers range", "subarrays with XOR equal to k"],
      idea: ["X[i] = a[0] ^ … ^ a[i-1]. Then xor(l..r) = X[r+1] ^ X[l], because the shared prefix XORs itself away.", "xor(i..k) == 0 exactly when X[i] == X[k+1]; counting equal prefix values counts those subarrays.", "Range AND [m, n]: any bit that changes between m and n is 0 in the AND, so shift both right until equal, then shift back."],
      steps: ["Build X with X[0] = 0", "Answer queries as X[r+1] ^ X[l]", "Use a hash map on X values for counting problems"],
      code: `def xor_queries(arr, queries):
    X = [0]
    for x in arr: X.append(X[-1] ^ x)
    return [X[r + 1] ^ X[l] for l, r in queries]

def range_and(m, n):
    shift = 0
    while m < n:
        m >>= 1; n >>= 1; shift += 1
    return m << shift`,
      complexity: { best: "O(n + q)", average: "O(n + q)", worst: "O(n + q)", space: "O(n)", note: "Range AND is O(log n) by itself." },
      traps: ["Seed X with 0, just like prefix sums.", "Triplets with equal XOR: each matching (i, k) pair contributes k - i triplets.", "Range AND: m == n returns m directly."],
      viz: { make: () => S.xorPrefix() },
    },
    {
      n: 6, name: "GCD and LCM", summary: "gcd(a, b) = gcd(b, a mod b), shrinking fast. lcm(a, b) = a / gcd(a, b) × b.",
      signals: ["greatest common divisor of strings or arrays", "simplify a fraction", "water jug problem", "LCM of a range / nth magical number"],
      idea: ["Any divisor of a and b also divides a mod b, so the GCD never changes while the numbers shrink. The remainder at least halves every two steps.", "Water jug: the measurable amounts are exactly the multiples of gcd(x, y) up to x + y.", "GCD of strings: if s + t == t + s, the answer is the prefix of length gcd(len(s), len(t))."],
      steps: ["while b: a, b = b, a % b", "return a", "lcm = a // gcd(a, b) * b (divide first to avoid overflow)"],
      code: `def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def lcm(a, b):
    return a // gcd(a, b) * b`,
      complexity: { best: "O(1)", average: "O(log min(a, b))", worst: "O(log min(a, b))", space: "O(1)", note: "Worst case is consecutive Fibonacci numbers." },
      traps: ["Multiply after dividing in lcm, or it overflows in fixed-width languages.", "gcd(0, x) = x.", "For arrays, fold: g = gcd(g, x) over all elements."],
      viz: { make: (i) => { const [a, b] = nums(i, [252, 105], 2); return S.gcdSteps(Math.abs(Math.round(a || 252)), Math.abs(Math.round(b || 105))); }, input: "252, 105", label: "two numbers" },
    },
    {
      n: 7, name: "Primes (sieve)", summary: "The Sieve of Eratosthenes crosses out multiples of each prime starting from p², marking every number up to n in near-linear time.",
      signals: ["count primes less than n", "prime factorisation", "ugly numbers (only 2, 3, 5)", "closest primes in a range"],
      idea: ["Every composite number has a prime factor at most its square root, so crossing out multiples of primes up to √n is enough.", "Start at p² because smaller multiples of p were already crossed out by smaller primes.", "Single checks use trial division up to √n."],
      steps: ["is_prime = [True] * n; mark 0 and 1 false", "for p in 2..√n: if prime, cross out p², p² + p, …", "count or list the survivors"],
      code: `def count_primes(n):
    if n < 3: return 0
    is_p = [True] * n
    is_p[0] = is_p[1] = False
    p = 2
    while p * p < n:
        if is_p[p]:
            is_p[p * p::p] = [False] * len(range(p * p, n, p))
        p += 1
    return sum(is_p)`,
      complexity: { best: "O(n log log n)", average: "O(n log log n)", worst: "O(n log log n)", space: "O(n)", note: "Trial division for one number: O(√n)." },
      traps: ["'Less than n' versus 'up to n': off-by-one in the array size.", "Starting the crossing at 2p wastes work; start at p².", "Ugly number II: three pointers into the output list, not a sieve."],
      viz: { make: (i) => S.sieve(Math.max(10, Math.min(40, Math.round(nums(i, [30])[0])))), input: "30", label: "n from 10 to 40" },
    },
    {
      n: 8, name: "Fast exponentiation", summary: "Compute aⁿ by squaring: use the binary digits of n, so only O(log n) multiplications are needed.",
      signals: ["pow(x, n)", "super pow, modular exponentiation", "count good numbers", "matrix power for linear recurrences"],
      idea: ["a^13 = a^8 · a^4 · a^1 because 13 = 1101 in binary. Square the base each step and multiply it into the result when the current bit is 1.", "Under a modulus, take mod after every multiplication so numbers stay small."],
      steps: ["res = 1", "while n: if n & 1: res *= a; a *= a; n >>= 1", "negative n: invert at the end"],
      code: `def my_pow(x, n):
    if n < 0: x, n = 1 / x, -n
    res = 1.0
    while n:
        if n & 1: res *= x
        x *= x
        n >>= 1
    return res`,
      complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(1)", note: "Naive repeated multiplication is O(n)." },
      traps: ["n = -2³¹ overflows when negated in 32-bit languages; use a long.", "Python has pow(a, n, mod) built in.", "Floating point errors grow with n; problems usually accept small error."],
      viz: { make: (i) => { const [a, n] = nums(i, [3, 13], 2); return S.fastPow(Math.round(a || 3), Math.max(1, Math.min(63, Math.round(n || 13)))); }, input: "3, 13", label: "base, exponent (exponent up to 63)" },
    },
    {
      n: 9, name: "Digit and integer arithmetic", summary: "Peel digits with % 10 and // 10, build numbers with × 10 +, and check overflow before it happens.",
      signals: ["reverse integer, palindrome number", "add digits, plus one", "excel sheet column number / title", "integer to roman, multiply strings"],
      idea: ["x % 10 is the last digit; x // 10 drops it. Rebuilding: rev = rev × 10 + digit.", "Column titles are base 26 without a zero, so subtract 1 before each % 26.", "Palindrome number: reverse only half the digits and compare, which also avoids overflow."],
      steps: ["while x: d = x % 10; x //= 10; use d", "before rev × 10 + d, check it fits in 32 bits"],
      code: `def reverse(x):
    sign, x, rev = (-1 if x < 0 else 1), abs(x), 0
    while x:
        rev = rev * 10 + x % 10
        x //= 10
    rev *= sign
    return rev if -2**31 <= rev < 2**31 else 0`,
      complexity: { best: "O(1)", average: "O(digits)", worst: "O(digits)", space: "O(1)", note: "Digits = log₁₀(x)." },
      traps: ["Negative modulo differs between languages (Python's -7 % 10 is 3).", "Plus one: carry can create a new leading digit (999 → 1000).", "Column title: n - 1 before taking % 26, or 'Z' comes out wrong."],
      viz: { make: (i) => S.reverseInt(Math.max(1, Math.min(99999999, Math.abs(Math.round(nums(i, [1234])[0]))))), input: "1234", label: "positive integer" },
    },
    {
      n: 10, name: "Cycles and number properties", summary: "Repeatedly applying f(x) must eventually repeat a value. Floyd's slow/fast pointers detect that cycle with O(1) memory.",
      signals: ["happy number", "find the duplicate number (array as a linked list)", "ugly number", "self-dividing / perfect numbers"],
      idea: ["Treat x → f(x) as a linked list. If it never reaches the target, it must loop, because the values are bounded.", "Find the duplicate: indices point to nums[i]; the duplicate value is the entry of the cycle, found with Floyd exactly as in linked lists."],
      steps: ["slow = f(x), fast = f(f(x))", "while slow != fast: step them", "check whether the meeting value is the target (1 for happy numbers)"],
      code: `def is_happy(n):
    f = lambda x: sum(int(d) ** 2 for d in str(x))
    slow, fast = n, f(n)
    while fast != 1 and slow != fast:
        slow, fast = f(slow), f(f(fast))
    return fast == 1`,
      complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)", note: "For happy numbers, values drop below 243 quickly, so each step is cheap. A seen set works too with O(cycle) memory." },
      traps: ["Find the duplicate: start both pointers at index 0, and the second phase moves both one step.", "Ugly numbers: dividing out 2, 3, 5 repeatedly, and 0 is not ugly.", "Do not modify the array in find-the-duplicate; the problem forbids it."],
      viz: { make: (i) => S.cycleNumber(Math.max(1, Math.min(999, Math.round(nums(i, [2])[0])))), input: "2", label: "starting number" },
    },
  ],
};
