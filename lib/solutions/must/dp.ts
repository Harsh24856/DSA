// Solutions for the must-do "dp" questions that were new to the app (lib/patterns/overview/dp.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, TableFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

const nums2 = (n: number) => Array.from({ length: n }, (_, i) => String(i));

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "fibonacci-number": {
    approach: "Each Fibonacci number needs only the two before it, so walk up from f(0) and f(1) keeping two variables.",
    idea: ["The state is i, and f(i) = f(i - 1) + f(i - 2) is the transition.", "The base cases are f(0) = 0 and f(1) = 1.", "Plain recursion recomputes the same values exponentially often; filling from the bottom solves each state once.", "Only the last two values are ever read, so keep a = f(i) and b = f(i + 1) and shift them n times.", "After n shifts a holds f(n)."],
    code: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 7, idx = Array.from({ length: n + 1 }, (_, i) => i), vals: (string | number)[] = idx.map(() => ""), frames: CellsFrame[] = [];
      let a = 0, b = 1; vals[0] = 0; vals[1] = 1;
      frames.push({ note: `Base cases f(0) = 0 and f(1) = 1. Keep a = f(i) and b = f(i + 1)`, rows: [idx, [...vals]], tones: { "1:0": "found", "1:1": "found" }, marks: [{ i: 0, label: "a", row: 1 }, { i: 1, label: "b", row: 1 }] });
      for (let i = 1; i <= n; i++) {
        [a, b] = [b, a + b];
        if (i + 1 <= n) vals[i + 1] = b;
        frames.push({ note: `Shift ${i}: a = f(${i}) = ${a}${i + 1 <= n ? `, b = f(${i}) + f(${i - 1}) = ${b}` : ""}. Only two numbers are kept`, rows: [idx, [...vals]], tones: { [`1:${i}`]: "active", ...(i + 1 <= n ? { [`1:${i + 1}`]: "found" } : {}), [`1:${i - 1}`]: "window" }, marks: [{ i, label: "a", row: 1 }, ...(i + 1 <= n ? [{ i: i + 1, label: "b", row: 1 }] : [])] });
      }
      frames.push({ note: `After ${n} shifts a = f(${n}) = ${a}: ${n} steps instead of the exponential recursion`, rows: [idx, [...vals]], tones: { [`1:${n}`]: "found" } });
      return { kind: "cells", title: `fib(${n}) = ${a}`, rowLabels: ["i", "f(i)"], rows: [idx, vals], frames };
    },
  },

  "delete-and-earn": {
    approach: "Taking value v earns v times its count but forbids v - 1 and v + 1: total the points per value, then run house robber over the values.",
    idea: ["Once you take one copy of v, the copies of v - 1 and v + 1 are gone, but the other copies of v are still free to take. So taking v always means taking all of them: points[v] = v times count(v).", "Now the values 0, 1, 2, ... form a row of houses where adjacent ones cannot both be robbed.", "Keep take = best total if this value is taken and skip = best total if it is not.", "Taking v needs v - 1 skipped: take = skip + points[v]; skipping v allows anything: skip = max(take, skip).", "The answer is the larger of the two after the last value."],
    code: `def deleteAndEarn(nums):
    points = [0] * (max(nums) + 1)
    for x in nums:
        points[x] += x
    take = skip = 0
    for p in points:
        take, skip = skip + p, max(take, skip)
    return max(take, skip)`,
    lang: "python", time: "O(n + max)", space: "O(max)",
    viz: () => {
      const arr = [2, 2, 3, 3, 3, 4], top = Math.max(...arr), points = Array(top + 1).fill(0), frames: CellsFrame[] = [];
      arr.forEach((x) => { points[x] += x; });
      const vals = points.map((_, v) => v), take: (string | number)[] = points.map(() => ""), skip: (string | number)[] = points.map(() => "");
      frames.push({ note: `nums = [${arr.join(", ")}]. Points per value: ${points.map((p, v) => (p ? `${v} earns ${p}` : "")).filter(Boolean).join(", ")}. Neighbouring values cannot both be taken`, rows: [vals, points, [...take], [...skip]], tones: Object.fromEntries(points.map((p, v) => [`1:${v}`, (p ? "window" : "muted") as Tone])) });
      let t = 0, s = 0;
      points.forEach((p, v) => {
        const nt = s + p, ns = Math.max(t, s);
        frames.push({ note: `Value ${v}: take it = skip before (${s}) + ${p} = ${nt}; skip it = max(${t}, ${s}) = ${ns}`, rows: [vals, points, take.map((x, k) => (k === v ? nt : x)), skip.map((x, k) => (k === v ? ns : x))], tones: { [`1:${v}`]: "active", [`2:${v}`]: nt >= ns ? "found" : "window", [`3:${v}`]: ns > nt ? "found" : "window" }, marks: [{ i: v, label: "v" }] });
        t = nt; s = ns; take[v] = nt; skip[v] = ns;
      });
      frames.push({ note: `Best total = max(${t}, ${s}) = ${Math.max(t, s)}`, rows: [vals, points, take, skip], tones: { [`2:${top}`]: t >= s ? "found" : "muted", [`3:${top}`]: s > t ? "found" : "muted" } });
      return { kind: "cells", title: `deleteAndEarn = ${Math.max(t, s)}`, rowLabels: ["value", "points", "take", "skip"], rows: [vals, points, take, skip], frames };
    },
  },

  "minimum-falling-path-sum": {
    approach: "Grid DP row by row: each cell adds the smallest of the three cells above it (up-left, up, up-right); one previous row is enough.",
    idea: ["The state is a cell (r, c): the cheapest falling path that ends there.", "A path reaches (r, c) only from (r - 1, c - 1), (r - 1, c) or (r - 1, c + 1), so add the smallest of those that exist.", "Row 0 is the base case: a path that starts there costs the cell itself.", "Each row reads only the row above, so keep one previous row and build the next.", "The answer is the smallest value in the last row."],
    code: `def minFallingPathSum(matrix):
    n = len(matrix)
    prev = matrix[0][:]
    for r in range(1, n):
        cur = [0] * n
        for c in range(n):
            best = prev[c]
            if c > 0:
                best = min(best, prev[c - 1])
            if c < n - 1:
                best = min(best, prev[c + 1])
            cur[c] = matrix[r][c] + best
        prev = cur
    return min(prev)`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const m = [[2, 1, 3], [6, 5, 4], [7, 8, 9]], n = m.length, dp: (number | null)[][] = m.map((row, r) => row.map((x) => (r === 0 ? x : null))), frames: TableFrame[] = [];
      frames.push({ note: `Row 0 is the base case: a path starting there costs the cell itself: ${m[0].join(", ")}`, cells: dp.map((r) => [...r]), tones: Object.fromEntries(m[0].map((_, c) => [`0:${c}`, "done" as Tone])) });
      for (let r = 1; r < n; r++) for (let c = 0; c < n; c++) {
        const from = [c - 1, c, c + 1].filter((k) => k >= 0 && k < n), best = from.reduce((b, k) => ((dp[r - 1][k] as number) < (dp[r - 1][b] as number) ? k : b), from[0]);
        dp[r][c] = m[r][c] + (dp[r - 1][best] as number);
        frames.push({ note: `(${r}, ${c}): cell ${m[r][c]} + smallest above among ${from.map((k) => dp[r - 1][k]).join(", ")} (${dp[r - 1][best]}) = ${dp[r][c]}`, cells: dp.map((x) => [...x]), active: [r, c], deps: from.map((k) => [r - 1, k] as [number, number]) });
      }
      const last = dp[n - 1] as number[], ans = Math.min(...last);
      frames.push({ note: `Smallest value in the last row: ${ans}`, cells: dp.map((x) => [...x]), tones: { [`${n - 1}:${last.indexOf(ans)}`]: "found" } });
      return { kind: "table", title: `minFallingPathSum = ${ans}`, rowHead: nums2(n), colHead: nums2(n), frames };
    },
  },

  "ones-and-zeroes": {
    approach: "0/1 knapsack with two capacities: dp[i][j] = most strings using at most i zeros and j ones, updated per string with both loops going down.",
    idea: ["Each string is an item with two weights, its zeros and its ones, and a value of 1.", "dp[i][j] is the largest subset that fits in i zeros and j ones; it starts at 0 everywhere.", "For a string with z zeros and o ones: dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1), skip it or take it.", "Loop i and j downward so dp[i - z][j - o] still holds the value from before this string, which means each string is used once.", "The answer is dp[m][n]."],
    code: `def findMaxForm(strs, m, n):
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for s in strs:
        zeros, ones = s.count("0"), s.count("1")
        for i in range(m, zeros - 1, -1):
            for j in range(n, ones - 1, -1):
                dp[i][j] = max(dp[i][j], dp[i - zeros][j - ones] + 1)
    return dp[m][n]`,
    lang: "python", time: "O(L × m × n)", space: "O(m × n)",
    viz: () => {
      const strs = ["10", "0001", "111001", "1", "0"], m = 5, n = 3, dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)), frames: TableFrame[] = [];
      frames.push({ note: `dp[i][j] = most strings that fit in i zeros (rows) and j ones (columns). Nothing taken yet, so all 0`, cells: dp.map((r) => [...r]) });
      for (const s of strs) {
        const z = [...s].filter((ch) => ch === "0").length, o = s.length - z, tones: Record<string, Tone> = {};
        let changed = 0;
        for (let i = m; i >= z; i--) for (let j = n; j >= o; j--) if (dp[i - z][j - o] + 1 > dp[i][j]) { dp[i][j] = dp[i - z][j - o] + 1; tones[`${i}:${j}`] = "found"; changed++; }
        frames.push({ note: `"${s}" has ${z} zero${z === 1 ? "" : "s"} and ${o} one${o === 1 ? "" : "s"}. Going down, dp[i][j] = max(itself, dp[i - ${z}][j - ${o}] + 1): ${changed} cell${changed === 1 ? "" : "s"} improved`, cells: dp.map((r) => [...r]), tones });
      }
      frames.push({ note: `The answer is dp[${m}][${n}] = ${dp[m][n]}`, cells: dp.map((r) => [...r]), active: [m, n] });
      return { kind: "table", title: `findMaxForm(m = ${m}, n = ${n}) = ${dp[m][n]}`, rowHead: Array.from({ length: m + 1 }, (_, i) => `${i} zeros`), colHead: Array.from({ length: n + 1 }, (_, j) => `${j} ones`), frames };
    },
  },

  "longest-increasing-path-in-a-matrix": {
    approach: "DFS from every cell with a memo: the longest path from a cell is 1 plus the longest from any bigger neighbour. Strictly increasing moves cannot cycle, so the memo is safe.",
    idea: ["The state is a cell: memo[r][c] is the longest increasing path that starts at (r, c).", "From a cell you may step to any of the four neighbours holding a bigger value, so memo = 1 + max over those neighbours.", "Values strictly increase along a path, so the dependencies form a DAG: no cycle, no visited set needed.", "Each cell is solved once and checks four neighbours, so the whole grid costs O(R × C).", "The answer is the largest memo value over all start cells."],
    code: `def longestIncreasingPath(matrix):
    R, C = len(matrix), len(matrix[0])
    memo = [[0] * C for _ in range(R)]
    def dfs(r, c):
        if memo[r][c]:
            return memo[r][c]
        best = 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and matrix[nr][nc] > matrix[r][c]:
                best = max(best, 1 + dfs(nr, nc))
        memo[r][c] = best
        return best
    return max(dfs(r, c) for r in range(R) for c in range(C))`,
    lang: "python", time: "O(R × C)", space: "O(R × C)",
    viz: () => {
      const g = [[9, 9, 4], [6, 6, 8], [2, 1, 1]], R = 3, C = 3, memo = g.map((r) => r.map(() => 0)), frames: TableFrame[] = [];
      const view = () => memo.map((r) => r.map((x) => (x ? x : null)));
      frames.push({ note: `memo[r][c] = longest increasing path that starts at (r, c). Values: ${g.map((r) => r.join(" ")).join(" / ")}`, cells: view() });
      const dfs = (r: number, c: number): number => {
        if (memo[r][c]) return memo[r][c];
        let best = 1; const deps: [number, number][] = [];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < R && nc >= 0 && nc < C && g[nr][nc] > g[r][c]) { deps.push([nr, nc]); best = Math.max(best, 1 + dfs(nr, nc)); }
        }
        memo[r][c] = best;
        frames.push({ note: deps.length ? `(${r}, ${c}) holds ${g[r][c]}: bigger neighbours ${deps.map(([a, b]) => `${g[a][b]} (path ${memo[a][b]})`).join(", ")}, so 1 + ${best - 1} = ${best}` : `(${r}, ${c}) holds ${g[r][c]}: no bigger neighbour, so the path is just this cell: 1`, cells: view(), active: [r, c], deps });
        return best;
      };
      let ans = 0, at: [number, number] = [0, 0];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const v = dfs(r, c); if (v > ans) { ans = v; at = [r, c]; } }
      frames.push({ note: `Every cell was solved once. The longest path starts at (${at[0]}, ${at[1]}) with length ${ans}`, cells: view(), tones: { [`${at[0]}:${at[1]}`]: "found" } });
      return { kind: "table", title: `longestIncreasingPath = ${ans}`, rowHead: nums2(R), colHead: nums2(C), frames };
    },
  },
};
