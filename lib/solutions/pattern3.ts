// Hand-written solutions for the slugs listed under "pattern3" in batches.json (questions from the pattern practice lists). See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, IntervalsFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { levelTree, range, stateMachine, type TNode } from "../sim.ts";
import type { Solution } from "./types";

type Cell = string | number | null;
const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const table = (title: string, rowHead: string[], colHead: string[], frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead, colHead, frames });
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
const heads = (n: number, p = "") => Array.from({ length: n }, (_, i) => p + i);
const tn = (keys: Iterable<number | string>, t: Tone) => Object.fromEntries([...keys].map((k) => [k, t])) as Record<string, Tone>;
const copy = <T,>(g: T[][]) => g.map((r) => [...r]);
const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
/** Tiny min-heap stand-in for the visualisers: pop the smallest tuple (compared element by element). */
function popMin<T extends number[]>(h: T[]): T { let b = 0; h.forEach((x, i) => { const y = h[b]; for (let k = 0; k < x.length; k++) { if (x[k] !== y[k]) { if (x[k] < y[k]) b = i; break; } } }); return h.splice(b, 1)[0]; }
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** Interval DP over the points c (dp[i][j] for the open span between c[i] and c[j]); best(i, j, k) returns the value of choosing k. */
function intervalTable(c: number[], best: (dp: number[][], i: number, j: number, k: number) => number, pick: "min" | "max", say: (dp: number[][], i: number, j: number, k: number, v: number) => string, title: (v: number) => string, head: (i: number) => string): Diagram {
  const m = c.length, dp = Array.from({ length: m }, () => Array(m).fill(0)), shown: Cell[][] = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (j === i || j === i + 1 ? 0 : null)));
  const frames: TableFrame[] = [{ note: "spans with no point strictly inside cost nothing (0); fill wider spans from shorter ones", cells: copy(shown) }];
  for (let gap = 2; gap < m; gap++) for (let i = 0; i + gap < m; i++) {
    const j = i + gap; let bk = i + 1, bv = best(dp, i, j, i + 1);
    for (let k = i + 2; k < j; k++) { const v = best(dp, i, j, k); if (pick === "min" ? v < bv : v > bv) { bv = v; bk = k; } }
    dp[i][j] = bv; shown[i][j] = bv;
    frames.push({ note: say(dp, i, j, bk, bv), cells: copy(shown), active: [i, j], deps: [[i, bk], [bk, j]] });
  }
  frames.push({ note: `answer dp[0][${m - 1}] = ${dp[0][m - 1]}`, cells: copy(shown), tones: { [`0:${m - 1}`]: "found" } });
  return table(title(dp[0][m - 1]), c.map((_, i) => head(i)), c.map((_, j) => head(j)), frames);
}

export const PATTERN3: Record<string, Solution> = {
  "minimum-path-sum": {
    approach: "dp[i][j] = grid[i][j] + min(dp from above, dp from the left); you can only arrive from those two cells.",
    idea: ["Moves go only right or down, so a cell is entered from the cell above or the cell to its left.", "The cheapest way to reach it is its own cost plus the cheaper of those two.", "Fill row by row; one row of dp is enough because each cell needs only the row above and its left neighbour."],
    code: `def minPathSum(grid):
    R, C = len(grid), len(grid[0])
    dp = [float("inf")] * C
    dp[0] = 0
    for i in range(R):
        dp[0] += grid[i][0]
        for j in range(1, C):
            dp[j] = grid[i][j] + min(dp[j], dp[j - 1])
    return dp[-1]`,
    lang: "python", time: "O(R · C)", space: "O(C)",
    viz: () => {
      const g = [[1, 3, 1], [1, 5, 1], [4, 2, 1]], R = 3, C = 3, dp: Cell[][] = g.map((r) => r.map(() => null)), frames: TableFrame[] = [];
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        const from: [number, number][] = []; if (i) from.push([i - 1, j]); if (j) from.push([i, j - 1]);
        const best = from.length ? Math.min(...from.map(([a, b]) => dp[a][b] as number)) : 0;
        dp[i][j] = g[i][j] + best;
        frames.push({ note: from.length ? `cell (${i}, ${j}) costs ${g[i][j]}; cheapest way in: ${from.map(([a, b]) => `${a === i ? "left" : "above"} ${dp[a][b]}`).join(" vs ")} → ${g[i][j]} + ${best} = ${dp[i][j]}` : `start (0, 0): the path already pays ${g[0][0]}`, cells: copy(dp), active: [i, j], deps: from });
      }
      const path: [number, number][] = [[R - 1, C - 1]]; let i = R - 1, j = C - 1;
      while (i || j) { if (!j || (i && (dp[i - 1][j] as number) <= (dp[i][j - 1] as number))) i--; else j--; path.push([i, j]); }
      path.reverse();
      frames.push({ note: `minimum path sum ${dp[R - 1][C - 1]} = ${path.map(([a, b]) => g[a][b]).join(" + ")}`, cells: copy(dp), tones: tn(path.map(([a, b]) => `${a}:${b}`), "found") });
      return table(`Grid [[1,3,1],[1,5,1],[4,2,1]]: ${dp[R - 1][C - 1]}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "unique-paths-ii": {
    approach: "Ways into a cell = ways from above + ways from the left, and a rock cell has 0 ways.",
    idea: ["Every path into (i, j) comes from (i - 1, j) or (i, j - 1), so the counts add.", "A rock blocks every path through it, so its count is 0.", "Keep one row: dp[j] already holds the count from above, and dp[j - 1] is the count from the left."],
    code: `def uniquePathsWithObstacles(obstacleGrid):
    C = len(obstacleGrid[0])
    dp = [0] * C
    dp[0] = 1
    for row in obstacleGrid:
        for j in range(C):
            if row[j]:
                dp[j] = 0
            elif j:
                dp[j] += dp[j - 1]
    return dp[-1]`,
    lang: "python", time: "O(R · C)", space: "O(C)",
    viz: () => {
      const g = [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 0]], R = 4, C = 4, dp: Cell[][] = g.map((r) => r.map(() => null)), frames: TableFrame[] = [];
      const rocks = tn(g.flatMap((r, i) => r.flatMap((v, j) => (v ? [`${i}:${j}`] : []))), "bad");
      frames.push({ note: "red cells are rocks; count the ways to reach every cell", cells: copy(dp), tones: rocks });
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        if (g[i][j]) { dp[i][j] = 0; frames.push({ note: `(${i}, ${j}) is a rock: no path passes through it → 0`, cells: copy(dp), active: [i, j], tones: rocks }); continue; }
        if (!i && !j) { dp[0][0] = 1; frames.push({ note: "start: 1 way to stand on (0, 0)", cells: copy(dp), active: [0, 0], tones: rocks }); continue; }
        const up = i ? (dp[i - 1][j] as number) : 0, left = j ? (dp[i][j - 1] as number) : 0; dp[i][j] = up + left;
        frames.push({ note: `(${i}, ${j}): ${up} from above + ${left} from the left = ${dp[i][j]}`, cells: copy(dp), active: [i, j], deps: [...(i ? [[i - 1, j] as [number, number]] : []), ...(j ? [[i, j - 1] as [number, number]] : [])], tones: rocks });
      }
      frames.push({ note: `${dp[R - 1][C - 1]} paths reach the bottom-right corner`, cells: copy(dp), tones: { ...rocks, [`${R - 1}:${C - 1}`]: "found" } });
      return table(`Paths around the rocks: ${dp[R - 1][C - 1]}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "maximal-square": {
    approach: "dp[i][j] = side of the largest all-1 square whose bottom-right corner is (i, j) = 1 + min(above, left, diagonal).",
    idea: ["A square of side s ends at (i, j) only if squares of side s - 1 end above, to the left and diagonally up-left.", "So the side is 1 + the smallest of those three; a '0' cell is 0.", "Track the biggest side and return its square."],
    code: `def maximalSquare(matrix):
    R, C = len(matrix), len(matrix[0])
    dp = [[0] * (C + 1) for _ in range(R + 1)]
    best = 0
    for i in range(R):
        for j in range(C):
            if matrix[i][j] == "1":
                dp[i + 1][j + 1] = 1 + min(dp[i][j], dp[i][j + 1], dp[i + 1][j])
                best = max(best, dp[i + 1][j + 1])
    return best * best`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const M = ["10100", "10111", "11111", "10010"].map((r) => r.split("").map(Number)), R = 4, C = 5, dp: Cell[][] = M.map((r) => r.map((v) => (v ? null : 0))), frames: TableFrame[] = [];
      let best = 0, at = [0, 0];
      frames.push({ note: "'0' cells start no square (0); fill the '1' cells left to right, top to bottom", cells: copy(dp) });
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        if (!M[i][j]) continue;
        const nb: [number, number][] = [[i - 1, j - 1], [i - 1, j], [i, j - 1]], inside = nb.every(([a, b]) => a >= 0 && b >= 0);
        const m = inside ? Math.min(...nb.map(([a, b]) => dp[a][b] as number)) : 0; dp[i][j] = 1 + m;
        if ((dp[i][j] as number) > best) { best = dp[i][j] as number; at = [i, j]; }
        frames.push({ note: inside ? `(${i}, ${j}): 1 + min(diagonal ${dp[i - 1][j - 1]}, above ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]} (best side ${best})` : `(${i}, ${j}) is on the edge → side 1 (best side ${best})`, cells: copy(dp), active: [i, j], deps: inside ? nb : [] });
      }
      const sq: string[] = []; for (let a = at[0] - best + 1; a <= at[0]; a++) for (let b = at[1] - best + 1; b <= at[1]; b++) sq.push(`${a}:${b}`);
      frames.push({ note: `largest side ${best} ends at (${at[0]}, ${at[1]}) → area ${best * best}`, cells: copy(dp), tones: tn(sq, "found") });
      return table(`Maximal square area: ${best * best}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "triangle": {
    approach: "Work bottom-up: the best path from a cell is its value plus the better of the two cells below it.",
    idea: ["From row i, position j you can step to (i + 1, j) or (i + 1, j + 1).", "Starting from the bottom row, replace each cell by value + min(two children); that is the cheapest path from it to the bottom.", "After the top row, dp[0] is the answer. One array of the bottom row's length is enough."],
    code: `def minimumTotal(triangle):
    dp = triangle[-1][:]
    for row in reversed(triangle[:-1]):
        for j, x in enumerate(row):
            dp[j] = x + min(dp[j], dp[j + 1])
    return dp[0]`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const t = [[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]], n = 4, grid: Cell[][] = t.map((r) => [...r, ...Array(n - r.length).fill(null)]), done = new Set<string>(t[n - 1].map((_, j) => `${n - 1}:${j}`)), frames: TableFrame[] = [];
      frames.push({ note: "bottom row: the cheapest path from a bottom cell is the cell itself", cells: copy(grid), tones: tn(done, "done") });
      const dp = [...t[n - 1]];
      for (let i = n - 2; i >= 0; i--) for (let j = 0; j <= i; j++) {
        const a = dp[j], b = dp[j + 1]; dp[j] = t[i][j] + Math.min(a, b); grid[i][j] = dp[j];
        frames.push({ note: `row ${i}, value ${t[i][j]}: + min(${a}, ${b}) below = ${dp[j]} to reach the bottom`, cells: copy(grid), active: [i, j], deps: [[i + 1, j], [i + 1, j + 1]], tones: tn(done, "done") });
        done.add(`${i}:${j}`);
      }
      const path: number[] = []; let j = 0;
      for (let i = 0; i < n; i++) { if (i && (grid[i][j + 1] as number) < (grid[i][j] as number)) j++; path.push(j); }
      frames.push({ note: `minimum total ${dp[0]} = ${path.map((c, i) => t[i][c]).join(" + ")}`, cells: copy(grid), tones: tn(path.map((c, i) => `${i}:${c}`), "found") });
      return table(`Triangle minimum total: ${dp[0]}`, heads(n, "row "), heads(n), frames);
    },
  },

  "dungeon-game": {
    approach: "Go backwards from the princess: need[i][j] = max(1, min(need right, need below) - dungeon[i][j]).",
    idea: ["Forward DP fails because the best path depends on both health lost so far and health still needed.", "Backwards, the only question is: with what HP must I enter this room so I can still finish?", "Leaving a room you need min(need of the room to the right, room below); entering, subtract the room's value, and never drop below 1."],
    code: `def calculateMinimumHP(dungeon):
    R, C = len(dungeon), len(dungeon[0])
    INF = float("inf")
    dp = [[INF] * (C + 1) for _ in range(R + 1)]
    dp[R][C - 1] = dp[R - 1][C] = 1
    for i in range(R - 1, -1, -1):
        for j in range(C - 1, -1, -1):
            need = min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]
            dp[i][j] = max(1, need)
    return dp[0][0]`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const d = [[-2, -3, 3], [-5, -10, 1], [10, 30, -5]], R = 3, C = 3, dp: Cell[][] = d.map((r) => r.map(() => null)), frames: TableFrame[] = [];
      frames.push({ note: `rooms: [${d.map((r) => r.join(", ")).join(" | ")}]. Fill from the princess (bottom-right) backwards`, cells: copy(dp) });
      for (let i = R - 1; i >= 0; i--) for (let j = C - 1; j >= 0; j--) {
        const nb: [number, number][] = []; if (i + 1 < R) nb.push([i + 1, j]); if (j + 1 < C) nb.push([i, j + 1]);
        const next = nb.length ? Math.min(...nb.map(([a, b]) => dp[a][b] as number)) : 1; dp[i][j] = Math.max(1, next - d[i][j]);
        frames.push({ note: `room (${i}, ${j}) = ${d[i][j]}: must leave with ${next}${nb.length ? "" : " (alive at the princess)"} → enter with max(1, ${next} - ${d[i][j] < 0 ? `(${d[i][j]})` : d[i][j]}) = ${dp[i][j]}`, cells: copy(dp), active: [i, j], deps: nb });
      }
      frames.push({ note: `the knight needs ${dp[0][0]} HP at the start`, cells: copy(dp), tones: { "0:0": "found" } });
      return table(`Minimum starting HP: ${dp[0][0]}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "longest-palindromic-substring": {
    approach: "Expand around every centre (each letter and each gap between letters) and keep the longest palindrome found.",
    idea: ["Every palindrome is symmetric around a centre: one letter for odd length, a gap for even length.", "From each of the 2n - 1 centres, grow outward while the two ends match.", "Each expansion is O(n), so O(n²) total with O(1) extra space."],
    code: `def longestPalindrome(s):
    best = ""
    for c in range(len(s)):
        for l, r in ((c, c), (c, c + 1)):
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l -= 1
                r += 1
            if r - l - 1 > len(best):
                best = s[l + 1:r]
    return best`,
    lang: "python", time: "O(n²)", space: "O(1)",
    viz: () => {
      const s = "cabbad", n = s.length, frames: CellsFrame[] = []; let best = [0, -1];
      for (let c = 0; c < n; c++) for (const [l0, r0] of [[c, c], [c, c + 1]]) {
        if (r0 >= n) continue;
        let l = l0, r = r0; while (l >= 0 && r < n && s[l] === s[r]) { l--; r++; }
        const len = r - l - 1, better = len > best[1] - best[0] + 1, where = l0 === r0 ? `centre '${s[c]}' at ${c}` : `gap between ${c} and ${c + 1}`;
        if (better) best = [l + 1, r - 1];
        frames.push(len ? { note: `${where}: grows to "${s.slice(l + 1, r)}"${better ? ", new best" : `, best stays "${s.slice(best[0], best[1] + 1)}"`}`, tones: range(l + 1, r - 1, 0, better ? "found" : "window"), marks: [{ i: l + 1, label: "L" }, { i: r - 1, label: "R" }] } : { note: `${where}: '${s[c]}' and '${s[c + 1]}' differ, nothing here`, tones: { [`0:${c}`]: "bad", [`0:${c + 1}`]: "bad" } });
      }
      frames.push({ note: `longest palindrome "${s.slice(best[0], best[1] + 1)}"`, tones: range(best[0], best[1], 0, "found") });
      return cells(`"${s}" → "${s.slice(best[0], best[1] + 1)}"`, [s.split("")], frames);
    },
  },

  "minimum-cost-to-cut-a-stick": {
    approach: "Interval DP over the sorted cut points: cost(i, j) = length of the piece + min over the first cut k of cost(i, k) + cost(k, j).",
    idea: ["Add the stick ends 0 and n to the sorted cuts; a piece is the span between two of these points.", "Cutting a piece costs its length, then the two halves are cut independently.", "dp[i][j] = c[j] - c[i] + min(dp[i][k] + dp[k][j]) for every cut k strictly inside; fill short spans first."],
    code: `def minCost(n, cuts):
    c = [0] + sorted(cuts) + [n]
    m = len(c)
    dp = [[0] * m for _ in range(m)]
    for gap in range(2, m):
        for i in range(m - gap):
            j = i + gap
            dp[i][j] = c[j] - c[i] + min(dp[i][k] + dp[k][j] for k in range(i + 1, j))
    return dp[0][m - 1]`,
    lang: "python", time: "O(m³)", space: "O(m²)",
    viz: () => {
      const c = [0, 1, 3, 4, 5, 7];
      return intervalTable(c, (dp, i, j, k) => c[j] - c[i] + dp[i][k] + dp[k][j], "min",
        (dp, i, j, k, v) => `piece ${c[i]}..${c[j]} (length ${c[j] - c[i]}): best first cut at ${c[k]} → ${c[j] - c[i]} + ${dp[i][k]} + ${dp[k][j]} = ${v}`,
        (v) => `Stick 7, cuts [1,3,4,5]: ${v}`, (i) => `at ${c[i]}`);
    },
  },

  "burst-balloons": {
    approach: "Pick the balloon burst LAST inside each open span: dp[i][j] = max over k of dp[i][k] + a[i]·a[k]·a[j] + dp[k][j].",
    idea: ["Pad with 1 on both ends. Choosing the first balloon to burst changes neighbours unpredictably, but the last one does not.", "If k is the last balloon burst strictly between i and j, its neighbours at that moment are exactly i and j.", "The two sides are then independent subproblems, so fill spans from short to long."],
    code: `def maxCoins(nums):
    a = [1] + nums + [1]
    n = len(a)
    dp = [[0] * n for _ in range(n)]
    for gap in range(2, n):
        for i in range(n - gap):
            j = i + gap
            dp[i][j] = max(dp[i][k] + a[i] * a[k] * a[j] + dp[k][j] for k in range(i + 1, j))
    return dp[0][n - 1]`,
    lang: "python", time: "O(n³)", space: "O(n²)",
    viz: () => {
      const a = [1, 3, 1, 5, 8, 1];
      return intervalTable(a, (dp, i, j, k) => dp[i][k] + a[i] * a[k] * a[j] + dp[k][j], "max",
        (dp, i, j, k, v) => `between index ${i} and ${j}: burst ${a[k]} (index ${k}) last → ${dp[i][k]} + ${a[i]}×${a[k]}×${a[j]} + ${dp[k][j]} = ${v}`,
        (v) => `Balloons [3,1,5,8]: ${v} coins`, (i) => `${i}:${a[i]}`);
    },
  },

  "palindrome-partitioning-ii": {
    approach: "cut[i] = fewest cuts for the prefix of length i; every palindrome s[l..r] found by expanding a centre offers cut[l] + 1 for cut[r + 1].",
    idea: ["If s[l..r] is a palindrome, the prefix ending at r can be the best split of s[:l] plus one more piece.", "Expanding around each centre lists every palindrome in O(n²) without a separate table.", "Start with cut[i] = i - 1 (all single letters) and cut[0] = -1 so a whole-prefix palindrome costs 0 cuts."],
    code: `def minCut(s):
    n = len(s)
    cut = list(range(-1, n))
    for c in range(n):
        for l, r in ((c, c), (c, c + 1)):
            while l >= 0 and r < n and s[l] == s[r]:
                cut[r + 1] = min(cut[r + 1], cut[l] + 1)
                l -= 1
                r += 1
    return cut[n]`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const s = "aabcb", n = s.length, cut = Array.from({ length: n + 1 }, (_, i) => i - 1), frames: CellsFrame[] = [];
      const rows = () => [s.split(""), cut.slice(1)];
      frames.push({ note: "row 2 = fewest cuts for the prefix ending here; start with every letter as its own piece", rows: rows() });
      for (let c = 0; c < n; c++) for (const [l0, r0] of [[c, c], [c, c + 1]]) {
        let l = l0, r = r0;
        while (l >= 0 && r < n && s[l] === s[r]) {
          const old = cut[r + 1]; cut[r + 1] = Math.min(cut[r + 1], cut[l] + 1);
          frames.push({ note: l === 0 ? `"${s.slice(l, r + 1)}" is a palindrome from the start → prefix to ${r} needs 0 cuts${old ? ` (was ${old})` : ""}` : `"${s.slice(l, r + 1)}" is a palindrome: ${cut[l]} cut${cut[l] === 1 ? "" : "s"} before index ${l}, + 1 → ${cut[l] + 1}; prefix to ${r} ${cut[r + 1] < old ? `drops from ${old} to` : "stays at"} ${cut[r + 1]}`, rows: rows(), tones: { ...range(l, r), [`1:${r}`]: "active" } });
          l--; r++;
        }
      }
      frames.push({ note: `fewest cuts for "${s}": ${cut[n]}`, rows: rows(), tones: { [`1:${n - 1}`]: "found" } });
      return cells(`"${s}" needs ${cut[n]} cut${cut[n] === 1 ? "" : "s"}`, rows(), frames, ["s", "cuts"]);
    },
  },

  "longest-palindromic-subsequence": {
    approach: "dp[i][j] = longest palindromic subsequence of s[i..j]: matching ends add 2 to the inside, otherwise drop one end.",
    idea: ["A single letter is a palindrome of length 1.", "If s[i] == s[j], both ends wrap the best answer inside: dp[i + 1][j - 1] + 2.", "Otherwise one end is unused: max(dp[i + 1][j], dp[i][j - 1]). Fill i from the end so the inside is ready."],
    code: `def longestPalindromeSubseq(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        dp[i][i] = 1
        for j in range(i + 1, n):
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1]`,
    lang: "python", time: "O(n²)", space: "O(n²)",
    viz: () => {
      const s = "bbbab", n = s.length, dp: Cell[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : null))), frames: TableFrame[] = [];
      frames.push({ note: "every single letter is a palindrome of length 1", cells: copy(dp) });
      for (let i = n - 2; i >= 0; i--) for (let j = i + 1; j < n; j++) {
        const v = (r: number, c: number) => (r <= c ? (dp[r][c] as number) : 0);
        if (s[i] === s[j]) { dp[i][j] = v(i + 1, j - 1) + 2; frames.push({ note: `s[${i}] = s[${j}] = '${s[i]}': wrap the inside ${v(i + 1, j - 1)} + 2 = ${dp[i][j]}`, cells: copy(dp), active: [i, j], deps: i + 1 <= j - 1 ? [[i + 1, j - 1]] : [] }); }
        else { dp[i][j] = Math.max(v(i + 1, j), v(i, j - 1)); frames.push({ note: `'${s[i]}' ≠ '${s[j]}': drop one end, max(${v(i + 1, j)}, ${v(i, j - 1)}) = ${dp[i][j]}`, cells: copy(dp), active: [i, j], deps: [[i + 1, j], [i, j - 1]] }); }
      }
      frames.push({ note: `whole string s[0..${n - 1}]: ${dp[0][n - 1]}`, cells: copy(dp), tones: { [`0:${n - 1}`]: "found" } });
      return table(`"${s}": longest palindromic subsequence ${dp[0][n - 1]}`, s.split("").map((c, i) => `${i} ${c}`), s.split("").map((c, i) => `${i} ${c}`), frames);
    },
  },
  "unique-binary-search-trees": {
    approach: "G[n] = sum over each root r of G[r - 1] · G[n - r]: the keys smaller than r form the left subtree and the larger ones the right.",
    idea: ["Pick root r among 1..n. Keys 1..r-1 must go left and r+1..n must go right.", "The number of shapes depends only on how many keys a side has, so left and right shapes multiply.", "Build G from 0 and 1 (one empty or single tree) upward. These are the Catalan numbers."],
    code: `def numTrees(n):
    G = [1, 1] + [0] * (n - 1)
    for m in range(2, n + 1):
        for root in range(1, m + 1):
            G[m] += G[root - 1] * G[m - root]
    return G[n]`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const n = 4, G: (string | number)[] = [1, 1, "", "", ""], frames: CellsFrame[] = [{ note: "G[0] = 1 (empty tree) and G[1] = 1 (one node)", rows: [heads(n + 1), [...G]], tones: { "1:0": "found", "1:1": "found" } }];
      for (let m = 2; m <= n; m++) { let sum = 0; for (let root = 1; root <= m; root++) { const L = G[root - 1] as number, R = G[m - root] as number; sum += L * R; G[m] = sum; frames.push({ note: `${m} keys, root ${root}: ${root - 1} key${root === 2 ? "" : "s"} left (${L} shape${L === 1 ? "" : "s"}) × ${m - root} right (${R}) = ${L * R}; G[${m}] so far ${sum}`, rows: [heads(n + 1), [...G]], tones: { [`1:${m}`]: "active", [`1:${root - 1}`]: "window", [`1:${m - root}`]: "window" } }); } }
      frames.push({ note: `${G[n]} different BSTs hold the keys 1..${n}`, rows: [heads(n + 1), [...G]], tones: { [`1:${n}`]: "found" } });
      return cells(`Unique BSTs with ${n} keys: ${G[n]}`, [heads(n + 1), [...G]], frames, ["keys", "G"]);
    },
  },

  "super-egg-drop": {
    approach: "Flip the question: f[m][e] = how many floors m moves and e eggs can settle = f[m-1][e-1] + f[m-1][e] + 1; find the first m that reaches n.",
    idea: ["One drop splits the building: if the egg breaks you check the floors below with e - 1 eggs, if not the floors above with e eggs, both with m - 1 moves left.", "So the floors you can cover is (below) + (above) + the floor you dropped from.", "Grow m until f[m][k] ≥ n. Only one row is needed, updated from the right."],
    code: `def superEggDrop(k, n):
    dp = [0] * (k + 1)
    m = 0
    while dp[k] < n:
        m += 1
        for e in range(k, 0, -1):
            dp[e] = dp[e - 1] + dp[e] + 1
    return m`,
    lang: "python", time: "O(k · answer)", space: "O(k)",
    viz: () => {
      const k = 2, n = 10, f: number[][] = [[0, 0, 0]], shown: Cell[][] = [], frames: TableFrame[] = [];
      for (let m = 1; f[m - 1][k] < n; m++) {
        f.push([0, 0, 0]); shown.push([null, null]);
        for (let e = 1; e <= k; e++) {
          f[m][e] = f[m - 1][e - 1] + f[m - 1][e] + 1; shown[m - 1][e - 1] = f[m][e];
          frames.push({ note: `${m} move${m === 1 ? "" : "s"}, ${e} egg${e === 1 ? "" : "s"}: breaks → ${f[m - 1][e - 1]} floor${f[m - 1][e - 1] === 1 ? "" : "s"} below, survives → ${f[m - 1][e]} above, + this floor = ${f[m][e]}`, cells: copy(shown), active: [m - 1, e - 1], deps: [...(m > 1 && e > 1 ? [[m - 2, e - 2] as [number, number]] : []), ...(m > 1 ? [[m - 2, e - 1] as [number, number]] : [])] });
        }
      }
      const M = f.length - 1;
      frames.push({ note: `${M} moves with ${k} eggs settle ${f[M][k]} ≥ ${n} floors, and ${M - 1} moves settle only ${f[M - 1][k]} → answer ${M}`, cells: copy(shown), tones: { [`${M - 1}:${k - 1}`]: "found" } });
      return table(`${k} eggs, ${n} floors: ${M} moves`, heads(M + 1, "m=").slice(1), ["1 egg", "2 eggs"], frames);
    },
  },

  "word-break": {
    approach: "dp[i] = the first i letters split into words; dp[i] is true when some dp[j] is true and s[j:i] is a word.",
    idea: ["The empty prefix is splittable: dp[0] = True.", "A prefix of length i splits if it ends with a dictionary word s[j:i] and the part before it, s[:j], splits.", "Check every j for every i; a set makes each word lookup O(length)."],
    code: `def wordBreak(s, wordDict):
    words = set(wordDict)
    dp = [True] + [False] * len(s)
    for i in range(1, len(s) + 1):
        dp[i] = any(dp[j] and s[j:i] in words for j in range(i))
    return dp[-1]`,
    lang: "python", time: "O(n³)", space: "O(n)",
    viz: () => {
      const s = "catsanddog", words = ["cat", "cats", "and", "sand", "dog"], n = s.length, dp = [true, ...Array(n).fill(false)], ok: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [];
      frames.push({ note: `dictionary [${words.join(", ")}]; row 2 marks prefixes ending at that letter that split into words`, rows: [s.split(""), [...ok]] });
      for (let i = 1; i <= n; i++) {
        let from = -1; for (let j = 0; j < i; j++) if (dp[j] && words.includes(s.slice(j, i))) { from = j; break; }
        dp[i] = from >= 0; ok[i - 1] = dp[i] ? "T" : "F";
        frames.push(dp[i] ? { note: `"${s.slice(0, i)}": ${from ? `"${s.slice(0, from)}" splits and ` : ""}"${s.slice(from, i)}" is a word → T`, rows: [s.split(""), [...ok]], tones: { ...range(from, i - 1, 0, "found"), [`1:${i - 1}`]: "found" } } : { note: `"${s.slice(0, i)}": no word ends here after a good split → F`, rows: [s.split(""), [...ok]], tones: { [`0:${i - 1}`]: "active", [`1:${i - 1}`]: "bad" } });
      }
      return cells(`"${s}" splits: ${dp[n] ? "true" : "false"}`, [s.split(""), Array(n).fill("")], frames, ["s", "split?"]);
    },
  },

  "best-time-to-buy-and-sell-stock-with-cooldown": {
    approach: "Three states per day: hold a share, just sold (cooldown next), or rest with no share; each day's states come from yesterday's.",
    idea: ["hold = max(keep holding, buy today from rest); you cannot buy straight after selling.", "sold = hold + price: sell the share you held yesterday.", "rest = max(rest, sold yesterday). The answer is the best of sold and rest on the last day."],
    code: `def maxProfit(prices):
    hold, sold, rest = float("-inf"), 0, 0
    for p in prices:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => stateMachine([1, 2, 3, 0, 2]),
  },

  "best-time-to-buy-and-sell-stock-iv": {
    approach: "Keep buy[t] and sell[t] for the t-th transaction: buy[t] = max(buy[t], sell[t-1] - p), sell[t] = max(sell[t], buy[t] + p).",
    idea: ["buy[t] is the best cash after buying for the t-th time; sell[t] after selling the t-th time.", "Each day, buying for transaction t spends today's price from the cash left after t - 1 sales, and selling adds it.", "Update t from 1 to k each day; sell[k] is the answer (unused transactions are allowed)."],
    code: `def maxProfit(k, prices):
    buy = [float("-inf")] * (k + 1)
    sell = [0] * (k + 1)
    for p in prices:
        for t in range(1, k + 1):
            buy[t] = max(buy[t], sell[t - 1] - p)
            sell[t] = max(sell[t], buy[t] + p)
    return sell[k]`,
    lang: "python", time: "O(n · k)", space: "O(k)",
    viz: () => {
      const k = 2, prices = [3, 2, 6, 5, 0, 3], buy = [0, -1e9, -1e9], sell = [0, 0, 0], rows: Cell[][] = [], frames: TableFrame[] = [];
      prices.forEach((p, d) => {
        for (let t = 1; t <= k; t++) { buy[t] = Math.max(buy[t], sell[t - 1] - p); sell[t] = Math.max(sell[t], buy[t] + p); }
        rows.push([p, buy[1], sell[1], buy[2], sell[2]]);
        frames.push({ note: `day ${d}, price ${p}: buy1 = ${buy[1]}, sell1 = ${sell[1]}, buy2 = max(keep, sell1 - ${p}) = ${buy[2]}, sell2 = max(keep, buy2 + ${p}) = ${sell[2]}`, cells: copy(rows), active: [d, 4], deps: [[d, 1], [d, 2], [d, 3]] });
      });
      frames.push({ note: `best with at most ${k} transactions: ${sell[k]} (buy 2 sell 6, buy 0 sell 3)`, cells: copy(rows), tones: { [`${prices.length - 1}:4`]: "found" } });
      return table(`k = ${k}, prices [${prices.join(",")}]: ${sell[k]}`, heads(prices.length, "day "), ["price", "buy1", "sell1", "buy2", "sell2"], frames);
    },
  },

  "regular-expression-matching": {
    approach: "dp[i][j] = s[:i] matches p[:j]; a 'x*' either matches nothing (look two back in p) or eats one more matching letter of s (look one up in s).",
    idea: ["A plain letter or '.' must match s[i-1], then the rest is dp[i-1][j-1].", "For 'x*': use it zero times → dp[i][j-2]; or, if x matches s[i-1], use it once more → dp[i-1][j] (the star stays available).", "Row 0 handles patterns like 'a*b*' matching the empty string."],
    code: `def isMatch(s, p):
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(2, n + 1):
        dp[0][j] = p[j - 1] == "*" and dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2] or (p[j - 2] in (s[i - 1], ".") and dp[i - 1][j])
            else:
                dp[i][j] = p[j - 1] in (s[i - 1], ".") and dp[i - 1][j - 1]
    return dp[m][n]`,
    lang: "python", time: "O(m · n)", space: "O(m · n)",
    viz: () => {
      const s = "aab", p = "c*a*b", m = s.length, n = p.length, dp: boolean[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false)), frames: TableFrame[] = [];
      const show = (upto: number) => dp.map((r, i) => r.map((v, j) => (i < upto || (i === upto && j <= n) ? (v ? "T" : "F") : null)) as Cell[]);
      dp[0][0] = true; for (let j = 2; j <= n; j++) dp[0][j] = p[j - 1] === "*" && dp[0][j - 2];
      frames.push({ note: `row 0: the empty string matches "" and any prefix made only of 'x*' pairs, like "${p.slice(0, 2)}"`, cells: show(0), tones: tn(dp[0].flatMap((v, j) => (v ? [`0:${j}`] : [])), "found") });
      const cur = (i: number, j: number) => dp.map((r, a) => r.map((v, b) => (a < i || (a === i && b <= j) ? (v ? "T" : "F") : null)) as Cell[]);
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        if (p[j - 1] === "*") {
          const zero = dp[i][j - 2], fits = p[j - 2] === s[i - 1] || p[j - 2] === ".", more = fits && dp[i - 1][j]; dp[i][j] = zero || more;
          frames.push({ note: `"${s.slice(0, i)}" vs "${p.slice(0, j)}": drop "${p[j - 2]}*" → ${zero ? "T" : "F"}${fits ? `; or '${s[i - 1]}' fits '${p[j - 2]}' so use the star once more → ${dp[i - 1][j] ? "T" : "F"}` : `; '${s[i - 1]}' does not fit '${p[j - 2]}'`} → ${dp[i][j] ? "T" : "F"}`, cells: cur(i, j), active: [i, j], deps: [[i, j - 2], ...(fits ? [[i - 1, j] as [number, number]] : [])] });
        } else {
          const fits = p[j - 1] === s[i - 1] || p[j - 1] === "."; dp[i][j] = fits && dp[i - 1][j - 1];
          frames.push({ note: `"${s.slice(0, i)}" vs "${p.slice(0, j)}": '${s[i - 1]}' ${fits ? `matches '${p[j - 1]}', take the diagonal ${dp[i - 1][j - 1] ? "T" : "F"}` : `does not match '${p[j - 1]}'`} → ${dp[i][j] ? "T" : "F"}`, cells: cur(i, j), active: [i, j], deps: fits ? [[i - 1, j - 1]] : [] });
        }
      }
      frames.push({ note: `"${s}" ${dp[m][n] ? "matches" : "does not match"} "${p}"`, cells: cur(m, n), tones: { [`${m}:${n}`]: dp[m][n] ? "found" : "bad" } });
      return table(`"${s}" vs "${p}": ${dp[m][n]}`, ["''", ...s], ["''", ...p], frames);
    },
  },

  "best-time-to-buy-and-sell-stock-ii": {
    approach: "With unlimited transactions, take every rise: add max(0, tomorrow - today) for each day.",
    idea: ["Any profitable buy-low-sell-high stretch equals the sum of its day-to-day rises.", "Falling days add nothing, so skip them.", "Summing every positive difference is therefore the maximum."],
    code: `def maxProfit(prices):
    return sum(max(0, b - a) for a, b in zip(prices, prices[1:]))`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const p = [7, 1, 5, 3, 6, 4], gain: (string | number)[] = Array(p.length).fill(""), frames: CellsFrame[] = []; let total = 0;
      for (let i = 1; i < p.length; i++) { const g = Math.max(0, p[i] - p[i - 1]); total += g; gain[i] = g; frames.push({ note: g ? `${p[i - 1]} → ${p[i]} rises by ${g}: buy yesterday, sell today. Total ${total}` : `${p[i - 1]} → ${p[i]} falls: do nothing. Total ${total}`, rows: [p, [...gain]], tones: { [`0:${i - 1}`]: g ? "found" : "muted", [`0:${i}`]: g ? "found" : "bad", [`1:${i}`]: g ? "found" : "muted" } }); }
      frames.push({ note: `profit = sum of the rises = ${total}`, rows: [p, [...gain]] });
      return cells(`Unlimited trades on [${p.join(",")}]: ${total}`, [p, Array(p.length).fill("")], frames, ["price", "gain"]);
    },
  },

  "best-time-to-buy-and-sell-stock-with-transaction-fee": {
    approach: "Two states: cash (no share) and hold (one share); cash = max(cash, hold + p - fee), hold = max(hold, cash - p).",
    idea: ["cash is the best profit with no share in hand, hold the best with one share.", "Selling moves hold to cash and pays the fee; buying moves cash to hold.", "Each day keep the better of staying put or switching; the final cash is the answer."],
    code: `def maxProfit(prices, fee):
    cash, hold = 0, -prices[0]
    for p in prices[1:]:
        cash, hold = max(cash, hold + p - fee), max(hold, cash - p)
    return cash`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const p = [1, 3, 2, 8, 4, 9], fee = 2, c: (string | number)[] = Array(p.length).fill(""), h: (string | number)[] = Array(p.length).fill(""), frames: CellsFrame[] = [];
      let cash = 0, hold = -p[0]; c[0] = cash; h[0] = hold;
      frames.push({ note: `day 0: cash 0, or buy at ${p[0]} → hold ${hold}`, rows: [p, [...c], [...h]], tones: { "0:0": "active" } });
      for (let i = 1; i < p.length; i++) { const sold = hold + p[i] - fee, bought = cash - p[i]; const nc = Math.max(cash, sold), nh = Math.max(hold, bought); frames.push({ note: `day ${i}, price ${p[i]}: cash = max(${cash}, sell ${hold} + ${p[i]} - ${fee} = ${sold}) = ${nc}; hold = max(${hold}, buy ${cash} - ${p[i]} = ${bought}) = ${nh}`, rows: [p, (c[i] = nc, [...c]), (h[i] = nh, [...h])], tones: { [`0:${i}`]: "active", [`1:${i}`]: nc > cash ? "found" : "window", [`2:${i}`]: nh > hold ? "found" : "window" } }); cash = nc; hold = nh; }
      frames.push({ note: `final cash ${cash} is the best profit with fee ${fee}`, rows: [p, [...c], [...h]], tones: { [`1:${p.length - 1}`]: "found" } });
      return cells(`Fee ${fee}: profit ${cash}`, [p, Array(p.length).fill(""), Array(p.length).fill("")], frames, ["price", "cash", "hold"]);
    },
  },

  "house-robber-iii": {
    approach: "Post-order DFS returns two numbers per node: best if this node is robbed, and best if it is skipped.",
    idea: ["Robbing a node forbids its children, so take = val + skip(left) + skip(right).", "Skipping a node leaves each child free: skip = max(left) + max(right).", "Each node is visited once; the answer is the better of the root's two numbers."],
    code: `def rob(root):
    def go(node):
        if not node:
            return 0, 0
        l, r = go(node.left), go(node.right)
        take = node.val + l[1] + r[1]
        skip = max(l) + max(r)
        return take, skip
    return max(go(root))`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [3, 4, 5, 1, 3, null, 1], { nodes, kids } = levelTree(vals), res: Record<number, [number, number]> = {}, frames: TreeFrame[] = [], badges: Record<number, string> = {};
      const go = (i: number | null): [number, number] => {
        if (i == null) return [0, 0];
        const [a, b] = kids[i], l = go(a), r = go(b), v = vals[i] as number, take = v + l[1] + r[1], skip = Math.max(...l) + Math.max(...r);
        res[i] = [take, skip]; badges[i] = `${take}/${skip}`;
        frames.push({ note: `node ${v}: rob it → ${v} + children skipped (${l[1]} + ${r[1]}) = ${take}; skip it → best of each child (${Math.max(...l)} + ${Math.max(...r)}) = ${skip}`, tones: { [i]: "active" }, badges: { ...badges } });
        return [take, skip];
      };
      const [t, sk] = go(0), robbed: number[] = [];
      const pick = (i: number | null, can: boolean) => { if (i == null) return; const take = can && res[i][0] >= res[i][1]; if (take) robbed.push(i); pick(kids[i][0], !take); pick(kids[i][1], !take); };
      pick(0, true);
      frames.push({ note: `badges are rob/skip. Best ${Math.max(t, sk)}: rob ${robbed.map((i) => vals[i]).join(" + ")}`, tones: tn(robbed, "found"), badges: { ...badges } });
      return tree(`House robber III: ${Math.max(t, sk)}`, nodes, frames);
    },
  },

  "beautiful-arrangement": {
    approach: "Backtrack position by position, placing only unused numbers x where x % pos == 0 or pos % x == 0, and count full placements.",
    idea: ["Fill positions 1..n in order; at each one try every unused number.", "The divisibility rule prunes most branches early.", "Reaching position n + 1 means one complete beautiful arrangement."],
    code: `def countArrangement(n):
    used = [False] * (n + 1)
    def place(pos):
        if pos > n:
            return 1
        total = 0
        for x in range(1, n + 1):
            if not used[x] and (x % pos == 0 or pos % x == 0):
                used[x] = True
                total += place(pos + 1)
                used[x] = False
        return total
    return place(1)`,
    lang: "python", time: "O(k) for k valid partial placements", space: "O(n)",
    viz: () => {
      const n = 3, used = Array(n + 1).fill(false), st: number[] = [], frames: StackFrame[] = []; let count = 0;
      const place = (pos: number) => {
        if (pos > n) { count++; frames.push({ note: `all ${n} positions filled: [${st.join(", ")}] is beautiful (count ${count})`, items: [...st], side: `count ${count}` }); return; }
        for (let x = 1; x <= n; x++) {
          if (used[x]) continue;
          if (x % pos && pos % x) { frames.push({ note: `position ${pos}: ${x} fails (neither divides the other)`, items: [...st], incoming: x, side: `count ${count}` }); continue; }
          used[x] = true; st.push(x); frames.push({ note: `position ${pos}: place ${x}`, items: [...st], side: `count ${count}` });
          place(pos + 1); st.pop(); used[x] = false;
        }
      };
      place(1);
      frames.push({ note: `${count} beautiful arrangements of 1..${n}`, items: [], side: `count ${count}` });
      return { kind: "stack", title: `Beautiful arrangements of 1..${n}: ${count}`, frames };
    },
  },
  "shortest-path-visiting-all-nodes": {
    approach: "BFS over states (current node, set of visited nodes as a bitmask), starting from every node at once; the first state whose mask is full gives the answer.",
    idea: ["Revisiting nodes is allowed, so the node alone is not a state; the visited set matters too.", "Each move costs 1, so BFS reaches every (node, mask) state at its shortest distance.", "Start from all n nodes together (distance 0) and stop at the first state with all bits set."],
    code: `from collections import deque
def shortestPathLength(graph):
    n = len(graph)
    full = (1 << n) - 1
    q = deque((i, 1 << i, 0) for i in range(n))
    seen = {(i, 1 << i) for i in range(n)}
    while q:
        u, mask, d = q.popleft()
        if mask == full:
            return d
        for v in graph[u]:
            state = (v, mask | 1 << v)
            if state not in seen:
                seen.add(state)
                q.append((v, state[1], d + 1))`,
    lang: "python", time: "O(2ⁿ · n²)", space: "O(2ⁿ · n)",
    viz: () => {
      const adj = [[1, 2, 3], [0], [0], [0]], n = 4, full = (1 << n) - 1, nodes = [{ id: 0, label: "0", x: 50, y: 55 }, { id: 1, label: "1", x: 15, y: 15 }, { id: 2, label: "2", x: 85, y: 15 }, { id: 3, label: "3", x: 50, y: 98 }];
      const edges = [{ a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 }], bits = (m: number) => adj.map((_, i) => i).filter((i) => (m >> i) & 1), key = (u: number, m: number) => u * 64 + m;
      const parent = new Map<number, number>(), frames: GraphFrame[] = [];
      let level = adj.map((_, i) => [i, 1 << i]), d = 0, goal: number[] | null = null;
      level.forEach(([u, m]) => parent.set(key(u, m), -1));
      frames.push({ note: `distance 0: start at every node, ${n} states (node, visited {node})`, tones: tn(adj.map((_, i) => i), "window") });
      while (!goal) {
        const next: number[][] = [];
        for (const [u, m] of level) for (const v of adj[u]) { const m2 = m | (1 << v), k = key(v, m2); if (!parent.has(k)) { parent.set(k, key(u, m)); next.push([v, m2]); if (m2 === full && !goal) goal = [v, m2]; } }
        d++; level = next;
        const best = next.reduce((a, b) => (bits(b[1]).length > bits(a[1]).length ? b : a));
        frames.push({ note: `distance ${d}: ${next.length} new states; widest one is at node ${best[0]} having visited {${bits(best[1]).join(", ")}}${goal ? " → every node covered" : ""}`, tones: { ...tn(bits(best[1]), "found"), [best[0]]: "active" } });
      }
      const path: number[][] = []; for (let k = key(goal[0], goal[1]); k !== -1; k = parent.get(k)!) path.push([Math.floor(k / 64), k % 64]);
      path.reverse(); const et: Record<string, Tone> = {};
      path.forEach(([u, m], i) => { if (i) et[ek(path[i - 1][0], u)] = "found"; frames.push({ note: i ? `step ${i}: walk to ${u}, visited {${bits(m).join(", ")}}` : `the winning walk starts at ${u}`, tones: { ...tn(bits(m), "found"), [u]: "active" }, edgeTones: { ...et } }); });
      frames.push({ note: `walk ${path.map((x) => x[0]).join(" → ")} visits all ${n} nodes in ${d} moves`, tones: tn(adj.map((_, i) => i), "found"), edgeTones: { ...et } });
      return { kind: "graph", title: `Star graph: ${d} moves`, nodes, edges, frames };
    },
  },

  "minimum-number-of-work-sessions-to-finish-the-tasks": {
    approach: "Bitmask DP: dp[mask] = (fewest sessions, smallest load in the open session) after finishing the tasks in mask.",
    idea: ["With at most 14 tasks, every subset fits in a bitmask.", "Adding task i either fits in the open session (load + t ≤ sessionTime) or opens a new one with load t.", "Comparing (sessions, load) as a pair keeps the state that leaves the most room; dp[all tasks] holds the answer."],
    code: `def minSessions(tasks, sessionTime):
    n = len(tasks)
    dp = [(n + 1, 0)] * (1 << n)
    dp[0] = (1, 0)
    for mask in range(1 << n):
        s, used = dp[mask]
        for i in range(n):
            if not mask >> i & 1:
                t = tasks[i]
                nxt = (s, used + t) if used + t <= sessionTime else (s + 1, t)
                m2 = mask | 1 << i
                if nxt < dp[m2]:
                    dp[m2] = nxt
    return dp[-1][0]`,
    lang: "python", time: "O(2ⁿ · n)", space: "O(2ⁿ)",
    viz: () => {
      const tasks = [1, 2, 3], T = 3, n = 3, N = 1 << n, dp: [number, number][] = Array.from({ length: N }, () => [n + 1, 0]), shown: Cell[][] = Array.from({ length: N }, () => [null, null]), frames: TableFrame[] = [];
      const set = (m: number) => tasks.filter((_, i) => (m >> i) & 1).join(", ") || "none";
      dp[0] = [1, 0]; shown[0] = [1, 0];
      frames.push({ note: `tasks [${tasks.join(", ")}], session length ${T}: no tasks done, 1 empty session open`, cells: copy(shown), active: [0, 0] });
      for (let m = 0; m < N; m++) {
        const [s, used] = dp[m];
        for (let i = 0; i < n; i++) {
          if ((m >> i) & 1) continue;
          const t = tasks[i], fits = used + t <= T, nx: [number, number] = fits ? [s, used + t] : [s + 1, t], m2 = m | (1 << i);
          if (nx[0] < dp[m2][0] || (nx[0] === dp[m2][0] && nx[1] < dp[m2][1])) {
            dp[m2] = nx; shown[m2] = [...nx];
            frames.push({ note: `done {${set(m)}}, add task ${t}: ${fits ? `fits (${used} + ${t} ≤ ${T})` : `${used} + ${t} > ${T}, open a new session`} → {${set(m2)}} in ${nx[0]} session${nx[0] === 1 ? "" : "s"}, load ${nx[1]}`, cells: copy(shown), active: [m2, 0], deps: [[m, 0]] });
          }
        }
      }
      frames.push({ note: `all tasks done in ${dp[N - 1][0]} sessions`, cells: copy(shown), tones: { [`${N - 1}:0`]: "found" } });
      return table(`Tasks [1,2,3], length 3: ${dp[N - 1][0]} sessions`, Array.from({ length: N }, (_, m) => `{${set(m)}}`), ["sessions", "open load"], frames);
    },
  },

  "stickers-to-spell-word": {
    approach: "Memoised search on the letters still needed (as a sorted string); always cover the first needed letter, trying only stickers that contain it.",
    idea: ["The order of letters does not matter, so the state is the multiset of letters still needed.", "Some sticker must supply the first needed letter, so only those stickers are worth trying at each state; this cuts the branching.", "solve(need) = 1 + min solve(need minus the sticker's letters); cache results by state."],
    code: `from collections import Counter
from functools import cache
def minStickers(stickers, target):
    packs = [Counter(s) for s in stickers]
    @cache
    def solve(left):
        if not left:
            return 0
        need = Counter(left)
        best = float("inf")
        for p in packs:
            if p[left[0]] == 0:
                continue
            rest = "".join(ch * max(0, cnt - p[ch]) for ch, cnt in sorted(need.items()))
            best = min(best, 1 + solve(rest))
        return best
    ans = solve("".join(sorted(target)))
    return -1 if ans == float("inf") else ans`,
    lang: "python", time: "O(2ᵀ · S · T)", space: "O(2ᵀ)",
    viz: () => {
      const stickers = ["with", "example", "science"], target = "that", NONE = 99, frames: TableFrame[] = [], states: string[] = [], rows: Cell[][] = [], memo = new Map<string, number>();
      const count = (w: string) => { const c: Record<string, number> = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return c; };
      const solve = (left: string): number => {
        if (!left) return 0;
        if (memo.has(left)) return memo.get(left)!;
        const r = states.length; states.push(`"${left}"`); rows.push([null, null]);
        frames.push({ note: `need "${left}": try stickers that have '${left[0]}': ${stickers.filter((w) => w.includes(left[0])).join(", ") || "none"}`, cells: copy(rows), active: [r, 0] });
        let best = NONE, via = "";
        for (const w of stickers) {
          if (!w.includes(left[0])) continue;
          const need = count(left), p = count(w), rest = Object.keys(need).sort().map((ch) => ch.repeat(Math.max(0, need[ch] - (p[ch] || 0)))).join("");
          const sub = solve(rest); if (1 + sub < best) { best = 1 + sub; via = w; }
        }
        memo.set(left, best); rows[r] = [via || "none", best >= NONE ? "none" : best];
        frames.push({ note: best >= NONE ? `need "${left}": no sticker has '${left[0]}' → impossible` : `need "${left}": best is "${via}" then ${best - 1} more → ${best}`, cells: copy(rows), active: [r, 1] });
        return best;
      };
      const ans = solve([...target].sort().join(""));
      frames.push({ note: `"${target}" needs ${ans} stickers`, cells: copy(rows), tones: { "0:1": "found" } });
      return table(`Spell "${target}" from [${stickers.join(", ")}]: ${ans}`, states, ["first pick", "stickers"], frames.map((f) => ({ ...f, cells: [...f.cells, ...Array.from({ length: states.length - f.cells.length }, () => [null, null] as Cell[])] })));
    },
  },

  "flood-fill": {
    approach: "DFS from the starting pixel, recolouring every 4-connected pixel that has the original colour.",
    idea: ["Remember the starting colour old; if it already equals the new colour, nothing changes (and DFS would loop).", "Recolour a pixel, then visit its four neighbours that still have colour old.", "Recolouring doubles as the visited mark."],
    code: `def floodFill(image, sr, sc, color):
    old = image[sr][sc]
    if old == color:
        return image
    R, C = len(image), len(image[0])
    def fill(r, c):
        if 0 <= r < R and 0 <= c < C and image[r][c] == old:
            image[r][c] = color
            fill(r + 1, c)
            fill(r - 1, c)
            fill(r, c + 1)
            fill(r, c - 1)
    fill(sr, sc)
    return image`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const img = [[1, 1, 1], [1, 1, 0], [1, 0, 1]], color = 2, old = img[1][1], frames: TableFrame[] = [], filled: string[] = [];
      frames.push({ note: `start at (1, 1) with colour ${old}; repaint its region with ${color}`, cells: copy(img), active: [1, 1] });
      const fill = (r: number, c: number) => { if (r < 0 || c < 0 || r >= 3 || c >= 3 || img[r][c] !== old) return; img[r][c] = color; filled.push(`${r}:${c}`); frames.push({ note: `(${r}, ${c}) had colour ${old} → paint ${color}, then try down, up, right, left`, cells: copy(img), active: [r, c], tones: tn(filled, "found") }); fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1); };
      fill(1, 1);
      frames.push({ note: `${filled.length} pixels repainted; (2, 2) has colour 1 but touches the region only diagonally`, cells: copy(img), tones: { ...tn(filled, "found"), "2:2": "muted" } });
      return table("Flood fill from (1, 1) with 2", heads(3, "r"), heads(3, "c"), frames);
    },
  },

  "number-of-islands": {
    approach: "Scan the grid; each unvisited '1' starts a new island, and a DFS sinks the whole island so it is not counted again.",
    idea: ["An island is a 4-connected group of '1' cells.", "When the scan hits a '1', count it and flood the whole group to '0'.", "Every cell is sunk at most once, so the scan is linear."],
    code: `def numIslands(grid):
    R, C = len(grid), len(grid[0])
    def sink(r, c):
        if 0 <= r < R and 0 <= c < C and grid[r][c] == "1":
            grid[r][c] = "0"
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                sink(r + dr, c + dc)
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const g = ["11000", "11000", "00100", "00011"].map((r) => r.split("").map(Number)), R = 4, C = 5, shown: Cell[][] = copy(g), frames: TableFrame[] = [], island: Record<string, number> = {};
      let count = 0;
      const tones = () => Object.fromEntries(Object.entries(island).map(([k, v]) => [k, v === count ? "found" : "done"])) as Record<string, Tone>;
      frames.push({ note: "scan left to right, top to bottom; an unseen 1 starts a new island", cells: copy(shown) });
      const sink = (r: number, c: number) => { if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] !== 1) return; g[r][c] = 0; island[`${r}:${c}`] = count; shown[r][c] = `#${count}`; frames.push({ note: `sink (${r}, ${c}) into island ${count}`, cells: copy(shown), active: [r, c], tones: tones() }); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) sink(r + dr, c + dc); };
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === 1) { count++; sink(r, c); }
      frames.push({ note: `${count} islands`, cells: copy(shown), tones: tn(Object.keys(island), "found") });
      return table(`Islands: ${count}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "max-area-of-island": {
    approach: "DFS from every unvisited land cell returns the size of its island; keep the largest.",
    idea: ["The area of an island is 1 for the cell plus the areas reached from its four neighbours.", "Set each visited cell to 0 so it is counted once.", "Take the maximum over all DFS starts (0 if there is no land)."],
    code: `def maxAreaOfIsland(grid):
    R, C = len(grid), len(grid[0])
    def area(r, c):
        if not (0 <= r < R and 0 <= c < C and grid[r][c] == 1):
            return 0
        grid[r][c] = 0
        return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1)
    return max(area(r, c) for r in range(R) for c in range(C))`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const g = [[0, 0, 1, 0, 0], [1, 1, 1, 0, 0], [0, 0, 0, 1, 1], [1, 0, 0, 1, 0]], R = 4, C = 5, shown: Cell[][] = copy(g), frames: TableFrame[] = [], mine: string[] = [], old: string[] = [];
      let best = 0, cur = 0;
      const area = (r: number, c: number): number => { if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] !== 1) return 0; g[r][c] = 0; cur++; mine.push(`${r}:${c}`); shown[r][c] = cur; frames.push({ note: `(${r}, ${c}) is land: island size so far ${cur} (best ${best})`, cells: copy(shown), active: [r, c], tones: { ...tn(old, "done"), ...tn(mine, "found") } }); return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1); };
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === 1) { cur = 0; const a = area(r, c); best = Math.max(best, a); frames.push({ note: `island from (${r}, ${c}) has area ${a} → best ${best}`, cells: copy(shown), tones: { ...tn(old, "done"), ...tn(mine, "found") } }); old.push(...mine); mine.length = 0; }
      frames.push({ note: `largest island area ${best}`, cells: copy(shown), tones: tn(old, "done") });
      return table(`Max island area: ${best}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "surrounded-regions": {
    approach: "Flip the question: mark every 'O' reachable from the border as safe, then turn all other 'O' into 'X'.",
    idea: ["A region is captured exactly when none of its cells touches the border.", "DFS from each border 'O' and mark its region '#' (safe).", "Final pass: '#' back to 'O', every remaining 'O' to 'X'."],
    code: `def solve(board):
    R, C = len(board), len(board[0])
    def keep(r, c):
        if 0 <= r < R and 0 <= c < C and board[r][c] == "O":
            board[r][c] = "#"
            keep(r + 1, c)
            keep(r - 1, c)
            keep(r, c + 1)
            keep(r, c - 1)
    for r in range(R):
        keep(r, 0)
        keep(r, C - 1)
    for c in range(C):
        keep(0, c)
        keep(R - 1, c)
    for r in range(R):
        for c in range(C):
            board[r][c] = "O" if board[r][c] == "#" else "X"`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const b = [["X", "X", "X", "X"], ["X", "O", "O", "X"], ["X", "X", "O", "X"], ["X", "O", "X", "X"]], R = 4, C = 4, frames: TableFrame[] = [], safe: string[] = [];
      frames.push({ note: "walk the border looking for 'O'; anything it reaches can never be surrounded", cells: copy(b) });
      const keep = (r: number, c: number) => { if (r < 0 || c < 0 || r >= R || c >= C || b[r][c] !== "O") return; b[r][c] = "#"; safe.push(`${r}:${c}`); frames.push({ note: `(${r}, ${c}) is an 'O' joined to the border → mark safe '#'`, cells: copy(b), active: [r, c], tones: tn(safe, "found") }); keep(r + 1, c); keep(r - 1, c); keep(r, c + 1); keep(r, c - 1); };
      for (let r = 0; r < R; r++) { keep(r, 0); keep(r, C - 1); }
      for (let c = 0; c < C; c++) { keep(0, c); keep(R - 1, c); }
      const captured: string[] = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (b[r][c] === "O") { b[r][c] = "X"; captured.push(`${r}:${c}`); frames.push({ note: `(${r}, ${c}) is an 'O' cut off from the border → captured, becomes 'X'`, cells: copy(b), active: [r, c], tones: { ...tn(safe, "found"), ...tn(captured, "bad") } }); }
      safe.forEach((k) => { const [r, c] = k.split(":").map(Number); b[r][c] = "O"; });
      frames.push({ note: `restore the safe cells to 'O': ${captured.length} cells captured`, cells: copy(b), tones: { ...tn(safe, "found"), ...tn(captured, "bad") } });
      return table(`Captured ${captured.length} cells`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "clone-graph": {
    approach: "Walk the graph with a stack and a map from each original node to its copy; create a copy the first time a node is seen and wire every edge on the copies.",
    idea: ["The map doubles as the visited set, so cycles do not loop forever.", "When a node is popped, each neighbour gets a copy if it has none yet (and is pushed).", "Then append the neighbour's copy to the popped node's copy, so every edge is wired from both ends."],
    code: `def cloneGraph(node):
    if not node:
        return None
    copies = {node: Node(node.val)}
    stack = [node]
    while stack:
        u = stack.pop()
        for v in u.neighbors:
            if v not in copies:
                copies[v] = Node(v.val)
                stack.append(v)
            copies[u].neighbors.append(copies[v])
    return copies[node]`,
    lang: "python", time: "O(V + E)", space: "O(V)",
    viz: () => {
      const adj = [[1, 3], [0, 2], [1, 3], [0, 2]], pos = [[10, 20], [40, 20], [40, 85], [10, 85]];
      const nodes = [...pos.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), ...pos.map(([x, y], i) => ({ id: 4 + i, label: `${i + 1}'`, x: x + 55, y }))];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 0]].flatMap(([a, b]) => [{ a, b }, { a: a + 4, b: b + 4 }]);
      const made = new Set([0]), wired = new Map<string, number>(), stack = [0], frames: GraphFrame[] = [];
      const view = (u: number | null, note: string): GraphFrame => ({ note, tones: { ...tn([0, 1, 2, 3].map((i) => i + 4).filter((i) => !made.has(i - 4)), "muted"), ...tn([...made].map((i) => i + 4), "found"), ...(u == null ? {} : { [u]: "active" }) }, edgeTones: Object.fromEntries([...wired].map(([k, c]) => [k, c === 2 ? "found" : "window"])) as Record<string, Tone> });
      frames.push(view(0, "copy node 1 as 1' and push it; copies on the right appear as they are made"));
      while (stack.length) {
        const u = stack.pop()!, did: string[] = [];
        for (const v of adj[u]) { if (!made.has(v)) { made.add(v); stack.push(v); did.push(`make ${v + 1}'`); } const k = ek(u + 4, v + 4); wired.set(k, (wired.get(k) || 0) + 1); did.push(`${u + 1}' → ${v + 1}'`); }
        frames.push(view(u, `pop ${u + 1}: ${did.join(", ")}; stack [${stack.map((x) => x + 1).join(", ")}]`));
      }
      frames.push(view(null, "every copy exists and every edge is wired both ways; return 1'"));
      return { kind: "graph", title: "Clone a 4-cycle", nodes, edges, frames };
    },
  },

  "find-if-path-exists-in-graph": {
    approach: "BFS from source over the undirected edges; the answer is whether destination is ever reached.",
    idea: ["Build an adjacency list with both directions of each edge.", "BFS marks every node reachable from source.", "Return True as soon as destination is popped, False if the queue empties first."],
    code: `from collections import defaultdict, deque
def validPath(n, edges, source, destination):
    adj = defaultdict(list)
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen, q = {source}, deque([source])
    while q:
        u = q.popleft()
        if u == destination:
            return True
        for v in adj[u]:
            if v not in seen:
                seen.add(v)
                q.append(v)
    return False`,
    lang: "python", time: "O(n + E)", space: "O(n + E)",
    viz: () => {
      const E = [[0, 1], [0, 2], [3, 5], [5, 4], [4, 3]], src = 0, dst = 5, adj: number[][] = Array.from({ length: 6 }, () => []);
      E.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
      const nodes = [{ id: 0, label: "0", x: 10, y: 50 }, { id: 1, label: "1", x: 35, y: 15 }, { id: 2, label: "2", x: 35, y: 85 }, { id: 3, label: "3", x: 65, y: 50 }, { id: 4, label: "4", x: 90, y: 15 }, { id: 5, label: "5", x: 90, y: 85 }];
      const seen = new Set([src]), q = [src], frames: GraphFrame[] = [], et: Record<string, Tone> = {};
      frames.push({ note: `BFS from ${src}, looking for ${dst}`, tones: { [src]: "active", [dst]: "window" } });
      while (q.length) { const u = q.shift()!; const got: number[] = []; for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); q.push(v); got.push(v); et[ek(u, v)] = "found"; } frames.push({ note: `pop ${u}: ${got.length ? `new neighbours ${got.join(", ")}` : "nothing new"}; queue [${q.join(", ")}]`, tones: { ...tn([...seen], "found"), [u]: "active", [dst]: "window" }, edgeTones: { ...et } }); }
      frames.push({ note: `queue empty and ${dst} was never reached → false (it sits in another component)`, tones: { ...tn([...seen], "found"), [dst]: "bad" }, edgeTones: { ...et } });
      return { kind: "graph", title: `Path ${src} to ${dst}: false`, nodes, edges: E.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "rotting-oranges": {
    approach: "Multi-source BFS from every rotten orange at once; each BFS layer is one minute.",
    idea: ["All rotten oranges spread at the same time, so they all start in the queue at minute 0.", "Each layer rots the fresh oranges next to the previous layer.", "When the queue empties, any fresh orange left is unreachable (-1); otherwise the number of layers is the time."],
    code: `from collections import deque
def orangesRotting(grid):
    R, C = len(grid), len(grid[0])
    q = deque((r, c) for r in range(R) for c in range(C) if grid[r][c] == 2)
    fresh = sum(row.count(1) for row in grid)
    minutes = 0
    while q and fresh:
        minutes += 1
        for _ in range(len(q)):
            r, c = q.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
    return -1 if fresh else minutes`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const g = [[2, 1, 1], [1, 1, 0], [0, 1, 1]], R = 3, C = 3, shown: Cell[][] = g.map((r) => r.map((v) => (v === 0 ? null : v === 2 ? 0 : "F"))), frames: TableFrame[] = [];
      let q: number[][] = [[0, 0]], fresh = 6, minutes = 0; const rot = ["0:0"];
      frames.push({ note: "F = fresh, number = minute it rotted; the rotten orange at (0, 0) starts the clock", cells: copy(shown), tones: tn(rot, "bad") });
      while (q.length && fresh) {
        minutes++; const next: number[][] = [];
        for (const [r, c] of q) for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (nr >= 0 && nc >= 0 && nr < R && nc < C && g[nr][nc] === 1) { g[nr][nc] = 2; fresh--; next.push([nr, nc]); shown[nr][nc] = minutes; }
        frames.push({ note: `minute ${minutes}: ${next.map(([r, c]) => `(${r}, ${c})`).join(", ")} rot; ${fresh} fresh left`, cells: copy(shown), tones: { ...tn(rot, "bad"), ...tn(next.map(([r, c]) => `${r}:${c}`), "active") } });
        rot.push(...next.map(([r, c]) => `${r}:${c}`)); q = next;
      }
      frames.push({ note: fresh ? `${fresh} oranges can never rot → -1` : `all oranges rotten after ${minutes} minutes`, cells: copy(shown), tones: tn(rot, "bad") });
      return table(`Rotting oranges: ${fresh ? -1 : minutes}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },
  "word-ladder": {
    approach: "BFS from beginWord where neighbours differ in one letter and are in the word list; the BFS depth at endWord is the ladder length.",
    idea: ["Words are nodes; an edge joins two words that differ in exactly one position.", "BFS finds the fewest transformations; count words, so start at length 1.", "Generate neighbours by trying all 26 letters in each position and looking them up in a set."],
    code: `from collections import deque
def ladderLength(beginWord, endWord, wordList):
    words = set(wordList)
    if endWord not in words:
        return 0
    q, seen = deque([(beginWord, 1)]), {beginWord}
    while q:
        w, d = q.popleft()
        if w == endWord:
            return d
        for i in range(len(w)):
            for ch in "abcdefghijklmnopqrstuvwxyz":
                n = w[:i] + ch + w[i + 1:]
                if n in words and n not in seen:
                    seen.add(n)
                    q.append((n, d + 1))
    return 0`,
    lang: "python", time: "O(N · L · 26)", space: "O(N)",
    viz: () => {
      const W = ["hit", "hot", "dot", "lot", "dog", "log", "cog"], xy = [[5, 50], [25, 50], [50, 15], [50, 85], [75, 15], [75, 85], [95, 50]], diff = (a: string, b: string) => [...a].filter((c, i) => c !== b[i]).length;
      const nodes = W.map((w, i) => ({ id: i, label: w, x: xy[i][0], y: xy[i][1] })), edges: { a: number; b: number }[] = [];
      W.forEach((a, i) => W.forEach((b, j) => { if (i < j && diff(a, b) === 1) edges.push({ a: i, b: j }); }));
      const dist: Record<number, number> = { 0: 1 }, q = [0], frames: GraphFrame[] = [], et: Record<string, Tone> = {}, badge = () => Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, String(v)]));
      frames.push({ note: `start at "hit" (length 1); the target is "cog"`, tones: { 0: "active", 6: "window" }, badges: badge() });
      while (q.length) {
        const u = q.shift()!;
        if (u === 6) { frames.push({ note: `popped "cog" → ladder of ${dist[6]} words`, tones: { ...tn(Object.keys(dist), "done"), 6: "found" }, edgeTones: { ...et }, badges: badge() }); break; }
        const got: string[] = [];
        W.forEach((w, v) => { if (dist[v] == null && diff(W[u], w) === 1) { dist[v] = dist[u] + 1; q.push(v); got.push(w); et[ek(u, v)] = "found"; } });
        frames.push({ note: `"${W[u]}" (length ${dist[u]}): ${got.length ? `one letter away: ${got.join(", ")}` : "no new words"}`, tones: { ...tn(Object.keys(dist), "done"), [u]: "active" }, edgeTones: { ...et }, badges: badge() });
      }
      return { kind: "graph", title: `hit → cog: ${dist[6]} words`, nodes, edges, frames };
    },
  },

  "01-matrix": {
    approach: "Multi-source BFS from every 0 at once; the first time BFS reaches a cell, that layer number is its distance to the nearest 0.",
    idea: ["Searching from each 1 separately repeats work; instead start from all zeros together.", "BFS layers grow outward one step at a time, so a cell is first reached from its nearest zero.", "Mark unvisited cells with -1 and fill them as they are reached."],
    code: `from collections import deque
def updateMatrix(mat):
    R, C = len(mat), len(mat[0])
    dist = [[0 if v == 0 else -1 for v in row] for row in mat]
    q = deque((r, c) for r in range(R) for c in range(C) if mat[r][c] == 0)
    while q:
        r, c = q.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const m = [[0, 1, 1, 1], [1, 1, 1, 1], [1, 1, 0, 1], [1, 1, 1, 1]], R = 4, C = 4, dist: Cell[][] = m.map((r) => r.map((v) => (v ? null : 0))), frames: TableFrame[] = [];
      let layer = [[0, 0], [2, 2]], d = 0; const seen = ["0:0", "2:2"];
      frames.push({ note: "both zeros start the BFS at distance 0", cells: copy(dist), tones: tn(seen, "found") });
      while (layer.length) {
        d++; const next: number[][] = [];
        for (const [r, c] of layer) for (const [dr, dc] of D4) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < R && nc < C && dist[nr][nc] == null) { dist[nr][nc] = d; next.push([nr, nc]); } }
        if (!next.length) break;
        frames.push({ note: `layer ${d}: ${next.length} cells are ${d} step${d === 1 ? "" : "s"} from the nearest 0`, cells: copy(dist), tones: { ...tn(seen, "done"), ...tn(next.map(([r, c]) => `${r}:${c}`), "active") } });
        seen.push(...next.map(([r, c]) => `${r}:${c}`)); layer = next;
      }
      frames.push({ note: "every cell now holds its distance to the nearest 0", cells: copy(dist), tones: tn(seen, "found") });
      return table("Distance to nearest 0", heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "course-schedule": {
    approach: "Kahn's algorithm: repeatedly take a course with no unmet prerequisites; if some course is never freed, there is a cycle.",
    idea: ["Edge b → a for each [a, b]; indegree counts the unmet prerequisites of each course.", "Queue every course with indegree 0, take it, and lower its dependants' indegrees.", "All courses get taken exactly when the graph has no cycle."],
    code: `from collections import deque
def canFinish(numCourses, prerequisites):
    adj = [[] for _ in range(numCourses)]
    indeg = [0] * numCourses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(numCourses) if indeg[i] == 0)
    taken = 0
    while q:
        u = q.popleft()
        taken += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return taken == numCourses`,
    lang: "python", time: "O(V + E)", space: "O(V + E)",
    viz: () => {
      const n = 5, pre = [[1, 0], [2, 1], [3, 2], [1, 3], [4, 0]], nodes = [{ id: 0, label: "0", x: 8, y: 50 }, { id: 1, label: "1", x: 40, y: 20 }, { id: 2, label: "2", x: 75, y: 20 }, { id: 3, label: "3", x: 58, y: 80 }, { id: 4, label: "4", x: 30, y: 90 }];
      const adj: number[][] = Array.from({ length: n }, () => []), indeg = Array(n).fill(0); pre.forEach(([a, b]) => { adj[b].push(a); indeg[a]++; });
      const q = indeg.flatMap((d, i) => (d ? [] : [i])), taken: number[] = [], frames: GraphFrame[] = [], badge = () => Object.fromEntries(indeg.map((d, i) => [i, `in ${d}`]));
      frames.push({ note: `badges = unmet prerequisites; free to take now: [${q.join(", ")}]`, tones: tn(q, "window"), badges: badge() });
      while (q.length) { const u = q.shift()!; taken.push(u); const freed: number[] = []; for (const v of adj[u]) if (--indeg[v] === 0) { q.push(v); freed.push(v); } frames.push({ note: `take course ${u}${freed.length ? `; course ${freed.join(", ")} now free` : ""}; queue [${q.join(", ")}]`, tones: { ...tn(taken, "found"), ...tn(q, "window"), [u]: "active" }, badges: badge() }); }
      const stuck = indeg.flatMap((d, i) => (d ? [i] : []));
      frames.push({ note: `${taken.length} of ${n} taken; courses ${stuck.join(", ")} wait on each other in a cycle → false`, tones: { ...tn(taken, "found"), ...tn(stuck, "bad") }, badges: badge() });
      return { kind: "graph", title: `Can finish: ${taken.length === n}`, nodes, edges: pre.map(([a, b]) => ({ a: b, b: a, directed: true })), frames };
    },
  },

  "course-schedule-ii": {
    approach: "Kahn's algorithm again, but record the order courses leave the queue; return [] if any course is left over.",
    idea: ["Courses with no unmet prerequisites can be taken first.", "Taking one lowers its dependants' indegrees; any that reach 0 join the queue.", "The removal order is a valid topological order; fewer than n courses means a cycle."],
    code: `from collections import deque
def findOrder(numCourses, prerequisites):
    adj = [[] for _ in range(numCourses)]
    indeg = [0] * numCourses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(numCourses) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == numCourses else []`,
    lang: "python", time: "O(V + E)", space: "O(V + E)",
    viz: () => {
      const n = 4, pre = [[1, 0], [2, 0], [3, 1], [3, 2]], nodes = [{ id: 0, label: "0", x: 10, y: 50 }, { id: 1, label: "1", x: 50, y: 15 }, { id: 2, label: "2", x: 50, y: 85 }, { id: 3, label: "3", x: 90, y: 50 }];
      const adj: number[][] = Array.from({ length: n }, () => []), indeg = Array(n).fill(0); pre.forEach(([a, b]) => { adj[b].push(a); indeg[a]++; });
      const q = indeg.flatMap((d, i) => (d ? [] : [i])), order: number[] = [], frames: GraphFrame[] = [], badge = () => Object.fromEntries(indeg.map((d, i) => [i, order.includes(i) ? `#${order.indexOf(i) + 1}` : `in ${d}`]));
      frames.push({ note: `indegrees shown; course 0 has none, so it goes first`, tones: tn(q, "window"), badges: badge() });
      while (q.length) { const u = q.shift()!; order.push(u); const freed: number[] = []; for (const v of adj[u]) if (--indeg[v] === 0) { q.push(v); freed.push(v); } frames.push({ note: `take ${u} → order [${order.join(", ")}]${freed.length ? `; ${freed.join(", ")} freed` : ""}`, tones: { ...tn(order, "found"), ...tn(q, "window"), [u]: "active" }, badges: badge() }); }
      frames.push({ note: `all ${n} courses ordered: [${order.join(", ")}]`, tones: tn(order, "found"), badges: badge() });
      return { kind: "graph", title: `Order: [${order.join(", ")}]`, nodes, edges: pre.map(([a, b]) => ({ a: b, b: a, directed: true })), frames };
    },
  },

  "find-eventual-safe-states": {
    approach: "DFS with three colours: a node is safe when every edge leads to a safe node; meeting a node still on the current path means a cycle.",
    idea: ["State 0 = unseen, 1 = on the current DFS path (or proven unsafe), 2 = safe.", "Mark a node 1, check all its successors; if all are safe, upgrade it to 2.", "Reaching a node in state 1 means a cycle, so that path is unsafe and the 1 stays."],
    code: `def eventualSafeNodes(graph):
    state = [0] * len(graph)
    def safe(u):
        if state[u]:
            return state[u] == 2
        state[u] = 1
        if all(safe(v) for v in graph[u]):
            state[u] = 2
        return state[u] == 2
    return [u for u in range(len(graph)) if safe(u)]`,
    lang: "python", time: "O(V + E)", space: "O(V)",
    viz: () => {
      const g = [[1, 2], [2, 3], [5], [0], [5], [], []], xy = [[10, 25], [40, 10], [40, 60], [10, 85], [70, 90], [70, 40], [95, 70]];
      const nodes = g.map((_, i) => ({ id: i, label: String(i), x: xy[i][0], y: xy[i][1] })), edges = g.flatMap((vs, u) => vs.map((v) => ({ a: u, b: v, directed: true })));
      const state = Array(g.length).fill(0), frames: GraphFrame[] = [], view = (u: number, note: string) => frames.push({ note, tones: { ...Object.fromEntries(state.map((s, i) => [i, s === 2 ? "found" : s === 1 ? "bad" : "muted"]).filter(([, t]) => t !== "muted")), [u]: "active" } as Record<number, Tone> });
      const safe = (u: number): boolean => {
        if (state[u]) { view(u, `${u} is ${state[u] === 2 ? "already safe" : "on the current path (or unsafe) → cycle"}`); return state[u] === 2; }
        state[u] = 1; view(u, `enter ${u}: check ${g[u].length ? g[u].join(", ") : "nothing (terminal)"}`);
        let ok = true; for (const v of g[u]) if (!safe(v)) { ok = false; break; }
        if (ok) state[u] = 2; view(u, ok ? `every edge from ${u} ends safely → safe` : `${u} can reach a cycle → unsafe`);
        return ok;
      };
      g.forEach((_, u) => safe(u));
      const out = state.flatMap((s, i) => (s === 2 ? [i] : []));
      frames.push({ note: `safe nodes [${out.join(", ")}]`, tones: Object.fromEntries(state.map((s, i) => [i, s === 2 ? "found" : "bad"])) as Record<number, Tone> });
      return { kind: "graph", title: `Safe: [${out.join(", ")}]`, nodes, edges, frames };
    },
  },

  "redundant-connection": {
    approach: "Union-find over the edges in order; the first edge whose ends already share a root closes a cycle and is the answer.",
    idea: ["A tree plus one edge has exactly one cycle.", "Add edges one by one with union-find; joining two nodes already connected creates the cycle.", "Scanning in input order returns the last such edge LeetCode asks for, since it is the only cycle-closing edge."],
    code: `def findRedundantConnection(edges):
    parent = list(range(len(edges) + 1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return [a, b]
        parent[ra] = rb`,
    lang: "python", time: "O(n · α(n))", space: "O(n)",
    viz: () => {
      const E = [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]], xy = [[15, 20], [50, 10], [85, 40], [50, 90], [10, 85]];
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), parent = [0, 1, 2, 3, 4, 5], frames: GraphFrame[] = [], et: Record<string, Tone> = {};
      const find = (x: number): number => (parent[x] === x ? x : find(parent[x])), badges = () => Object.fromEntries([1, 2, 3, 4, 5].map((v) => [v - 1, `root ${find(v)}`]));
      let ans: number[] = [];
      for (const [a, b] of E) {
        const ra = find(a), rb = find(b);
        if (ra === rb) { et[ek(a - 1, b - 1)] = "bad"; ans = [a, b]; frames.push({ note: `edge ${a}-${b}: both already have root ${ra} → this edge closes a cycle, answer [${a}, ${b}]`, tones: { [a - 1]: "bad", [b - 1]: "bad" }, edgeTones: { ...et }, badges: badges() }); break; }
        parent[ra] = rb; et[ek(a - 1, b - 1)] = "found";
        frames.push({ note: `edge ${a}-${b}: roots ${ra} and ${rb} differ → union`, tones: { [a - 1]: "active", [b - 1]: "active" }, edgeTones: { ...et }, badges: badges() });
      }
      return { kind: "graph", title: `Redundant edge [${ans.join(", ")}]`, nodes, edges: E.map(([a, b]) => ({ a: a - 1, b: b - 1 })), frames };
    },
  },

  "accounts-merge": {
    approach: "Union-find over emails: join every email of an account with its first email, then group emails by root.",
    idea: ["Two accounts belong to one person exactly when they share an email, possibly through a chain.", "Union each email with the first email of its account; shared emails link the accounts.", "Group by root, sort each group, and put the owner's name in front."],
    code: `def accountsMerge(accounts):
    parent, owner = {}, {}
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for name, *emails in accounts:
        for e in emails:
            parent.setdefault(e, e)
            owner[e] = name
            parent[find(e)] = find(emails[0])
    groups = {}
    for e in parent:
        groups.setdefault(find(e), []).append(e)
    return [[owner[r]] + sorted(es) for r, es in groups.items()]`,
    lang: "python", time: "O(E log E)", space: "O(E)",
    viz: () => {
      const acc = [["John", "j1", "j2"], ["John", "j1", "j3"], ["Mary", "m1"], ["John", "j4"]], emails = ["j1", "j2", "j3", "m1", "j4"], xy = [[30, 50], [10, 15], [10, 85], [70, 50], [95, 50]];
      const nodes = emails.map((e, i) => ({ id: i, label: e, x: xy[i][0], y: xy[i][1] })), id = (e: string) => emails.indexOf(e), parent = emails.map((_, i) => i), frames: GraphFrame[] = [], et: Record<string, Tone> = {};
      const find = (x: number): number => (parent[x] === x ? x : find(parent[x])), badges = () => Object.fromEntries(emails.map((_, i) => [i, `root ${emails[find(i)]}`]));
      acc.forEach(([name, ...es], k) => { const first = id(es[0]); es.forEach((e) => { const r = find(id(e)), f = find(first); if (r !== f) { parent[r] = f; et[ek(id(e), first)] = "found"; } }); frames.push({ note: `account ${k} (${name}: ${es.join(", ")}): union every email with ${es[0]}`, tones: tn(es.map(id), "active"), edgeTones: { ...et }, badges: badges() }); });
      const groups = new Map<number, string[]>(); emails.forEach((e, i) => groups.set(find(i), [...(groups.get(find(i)) || []), e]));
      frames.push({ note: `${groups.size} people: ${[...groups.values()].map((g) => `[${g.sort().join(", ")}]`).join(", ")}`, tones: tn(emails.map((_, i) => i), "found"), edgeTones: { ...et }, badges: badges() });
      return { kind: "graph", title: `Merged into ${groups.size} accounts`, nodes, edges: [{ a: 0, b: 1 }, { a: 0, b: 2 }], frames };
    },
  },

  "network-delay-time": {
    approach: "Dijkstra from k; the signal reaches everyone at the largest shortest distance, or never if some node is unreachable.",
    idea: ["Each node hears the signal at its shortest travel time from k.", "Dijkstra pops nodes in order of that time; the first pop of a node is final.", "If every node was popped, the answer is the last (largest) time; otherwise -1."],
    code: `import heapq
def networkDelayTime(times, n, k):
    adj = [[] for _ in range(n + 1)]
    for u, v, w in times:
        adj[u].append((v, w))
    dist = {}
    heap = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in dist:
            continue
        dist[u] = d
        for v, w in adj[u]:
            if v not in dist:
                heapq.heappush(heap, (d + w, v))
    return max(dist.values()) if len(dist) == n else -1`,
    lang: "python", time: "O(E log E)", space: "O(n + E)",
    viz: () => {
      const T = [[1, 2, 4], [1, 3, 1], [3, 2, 2], [2, 4, 1], [3, 4, 5]], n = 4, k = 1, xy = [[10, 50], [50, 10], [50, 90], [90, 50]];
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), dist: Record<number, number> = {}, heap: number[][] = [[0, k]], frames: GraphFrame[] = [];
      while (heap.length) {
        const [d, u] = popMin(heap);
        if (dist[u] != null) { frames.push({ note: `pop (${d}, ${u}): ${u} already settled at ${dist[u]}, skip`, tones: tn(Object.keys(dist).map((x) => +x - 1), "found"), badges: Object.fromEntries(Object.entries(dist).map(([x, v]) => [+x - 1, `t=${v}`])) }); continue; }
        dist[u] = d; const pushed: string[] = [];
        for (const [a, b, w] of T) if (a === u && dist[b] == null) { heap.push([d + w, b]); pushed.push(`${b} at ${d + w}`); }
        frames.push({ note: `pop (${d}, ${u}): node ${u} hears the signal at ${d}${pushed.length ? `; push ${pushed.join(", ")}` : ""}`, tones: { ...tn(Object.keys(dist).map((x) => +x - 1), "found"), [u - 1]: "active" }, badges: Object.fromEntries(Object.entries(dist).map(([x, v]) => [+x - 1, `t=${v}`])) });
      }
      const ans = Object.keys(dist).length === n ? Math.max(...Object.values(dist)) : -1;
      frames.push({ note: `every node reached; the last one hears it at ${ans}`, tones: tn([0, 1, 2, 3], "found"), badges: Object.fromEntries(Object.entries(dist).map(([x, v]) => [+x - 1, `t=${v}`])) });
      return { kind: "graph", title: `Network delay: ${ans}`, nodes, edges: T.map(([a, b, w]) => ({ a: a - 1, b: b - 1, w, directed: true })), frames };
    },
  },

  "path-with-minimum-effort": {
    approach: "Dijkstra where a path's cost is its largest single step |height difference| instead of a sum.",
    idea: ["The effort of a path is the max over its steps, and extending a path never lowers that max.", "So Dijkstra still works: always expand the cell with the smallest effort so far.", "The first time the bottom-right cell is popped, its effort is the minimum."],
    code: `import heapq
def minimumEffortPath(heights):
    R, C = len(heights), len(heights[0])
    best = [[float("inf")] * C for _ in range(R)]
    best[0][0] = 0
    heap = [(0, 0, 0)]
    while heap:
        e, r, c = heapq.heappop(heap)
        if (r, c) == (R - 1, C - 1):
            return e
        if e > best[r][c]:
            continue
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C:
                ne = max(e, abs(heights[nr][nc] - heights[r][c]))
                if ne < best[nr][nc]:
                    best[nr][nc] = ne
                    heapq.heappush(heap, (ne, nr, nc))`,
    lang: "python", time: "O(R · C · log(R · C))", space: "O(R · C)",
    viz: () => {
      const h = [[1, 2, 2], [3, 8, 2], [5, 3, 5]], R = 3, C = 3, best: Cell[][] = h.map((r) => r.map(() => null)), heap: number[][] = [[0, 0, 0]], done: string[] = [], frames: TableFrame[] = [];
      best[0][0] = 0; let ans = 0;
      frames.push({ note: `heights [${h.map((r) => r.join(", ")).join(" | ")}]; cells show the smallest effort found so far`, cells: copy(best), active: [0, 0] });
      while (heap.length) {
        const [e, r, c] = popMin(heap);
        if (r === R - 1 && c === C - 1) { ans = e; frames.push({ note: `pop the corner with effort ${e} → answer`, cells: copy(best), tones: { ...tn(done, "done"), [`${r}:${c}`]: "found" } }); break; }
        if (e > (best[r][c] as number)) continue;
        done.push(`${r}:${c}`); const upd: string[] = [];
        for (const [dr, dc] of D4) { const nr = r + dr, nc = c + dc; if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue; const ne = Math.max(e, Math.abs(h[nr][nc] - h[r][c])); if (best[nr][nc] == null || ne < (best[nr][nc] as number)) { best[nr][nc] = ne; heap.push([ne, nr, nc]); upd.push(`(${nr}, ${nc}) → ${ne}`); } }
        frames.push({ note: `pop (${r}, ${c}) height ${h[r][c]}, effort ${e}${upd.length ? `; improve ${upd.join(", ")}` : "; nothing improves"}`, cells: copy(best), active: [r, c], tones: tn(done, "done") });
      }
      return table(`Minimum effort: ${ans}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "swim-in-rising-water": {
    approach: "Dijkstra on the time you must wait: moving into a cell needs the water at least that cell's height, so the cost is the max height on the path.",
    idea: ["You can swim along a path once the water level reaches the highest cell on it.", "So minimise the maximum height over paths from the top-left to the bottom-right.", "Pop cells by that max with a heap; the first pop of the corner is the answer."],
    code: `import heapq
def swimInWater(grid):
    n = len(grid)
    heap, seen = [(grid[0][0], 0, 0)], {(0, 0)}
    while heap:
        t, r, c = heapq.heappop(heap)
        if (r, c) == (n - 1, n - 1):
            return t
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in seen:
                seen.add((nr, nc))
                heapq.heappush(heap, (max(t, grid[nr][nc]), nr, nc))`,
    lang: "python", time: "O(n² log n)", space: "O(n²)",
    viz: () => {
      const g = [[0, 2, 4, 3], [7, 1, 9, 5], [8, 6, 10, 11], [12, 13, 14, 6]], n = 4, heap: number[][] = [[0, 0, 0]], seen = new Set(["0:0"]), popped: string[] = [], frames: TableFrame[] = [];
      let ans = 0;
      frames.push({ note: "cells are heights; the water must reach the tallest cell on your path", cells: copy(g), active: [0, 0] });
      while (heap.length) {
        const [t, r, c] = popMin(heap); popped.push(`${r}:${c}`);
        if (r === n - 1 && c === n - 1) { ans = t; frames.push({ note: `reach the corner when the water is at ${t}`, cells: copy(g), tones: { ...tn(popped, "done"), [`${r}:${c}`]: "found" } }); break; }
        const push: string[] = [];
        for (const [dr, dc] of D4) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < n && nc < n && !seen.has(`${nr}:${nc}`)) { seen.add(`${nr}:${nc}`); heap.push([Math.max(t, g[nr][nc]), nr, nc]); push.push(String(g[nr][nc])); } }
        frames.push({ note: `swim to height ${g[r][c]} at (${r}, ${c}) with water ${t}${push.length ? `; neighbours ${push.join(", ")} join the heap` : ""}`, cells: copy(g), active: [r, c], tones: { ...tn([...seen], "window"), ...tn(popped, "done") } });
      }
      return table(`Swim time: ${ans}`, heads(n, "r"), heads(n, "c"), frames);
    },
  },
  "path-with-maximum-probability": {
    approach: "Dijkstra with a max-heap on probability: multiplying by a number ≤ 1 never increases it, so the first pop of the end node is the best.",
    idea: ["A path's success chance is the product of its edge chances.", "Every factor is at most 1, so longer paths never beat their prefixes, which is what Dijkstra needs.", "Pop the most likely node, relax neighbours with p · q, and stop when the end node pops (0 if never)."],
    code: `import heapq
def maxProbability(n, edges, succProb, start_node, end_node):
    adj = [[] for _ in range(n)]
    for (a, b), p in zip(edges, succProb):
        adj[a].append((b, p))
        adj[b].append((a, p))
    best = [0.0] * n
    best[start_node] = 1.0
    heap = [(-1.0, start_node)]
    while heap:
        p, u = heapq.heappop(heap)
        p = -p
        if u == end_node:
            return p
        if p < best[u]:
            continue
        for v, q in adj[u]:
            if p * q > best[v]:
                best[v] = p * q
                heapq.heappush(heap, (-best[v], v))
    return 0.0`,
    lang: "python", time: "O(E log V)", space: "O(V + E)",
    viz: () => {
      const E: [number, number, number][] = [[0, 1, 0.5], [0, 2, 0.9], [1, 2, 0.6], [1, 3, 0.8], [2, 3, 0.4]], xy = [[10, 50], [50, 10], [50, 90], [90, 50]], end = 3;
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i), x, y })), best = [1, 0, 0, 0], heap: number[][] = [[-1, 0]], done: number[] = [], frames: GraphFrame[] = [];
      const r3 = (x: number) => String(Math.round(x * 1000) / 1000), badges = () => Object.fromEntries(best.map((b, i) => [i, b ? r3(b) : "0"]));
      let ans = 0;
      while (heap.length) {
        const [np, u] = popMin(heap), p = -np;
        if (u === end) { ans = p; frames.push({ note: `pop node ${end} with chance ${r3(p)} → best path found`, tones: { ...tn(done, "done"), [u]: "found" }, badges: badges() }); break; }
        if (p < best[u]) continue;
        done.push(u); const up: string[] = [];
        for (const [a, b, q] of E) { const v = a === u ? b : b === u ? a : -1; if (v >= 0 && p * q > best[v]) { best[v] = p * q; heap.push([-best[v], v]); up.push(`${v} → ${r3(p)} × ${q} = ${r3(best[v])}`); } }
        frames.push({ note: `pop node ${u} (chance ${r3(p)})${up.length ? `; improve ${up.join(", ")}` : "; nothing improves"}`, tones: { ...tn(done, "done"), [u]: "active" }, badges: badges() });
      }
      return { kind: "graph", title: `Best chance 0 to ${end}: ${r3(ans)}`, nodes, edges: E.map(([a, b, w]) => ({ a, b, w })), frames };
    },
  },

  "cheapest-flights-within-k-stops": {
    approach: "Bellman-Ford limited to k + 1 rounds: round r finds the cheapest price using at most r flights.",
    idea: ["At most k stops means at most k + 1 flights.", "Each round relaxes every flight once, reading only last round's prices (a copy), so a round adds exactly one flight.", "After k + 1 rounds, cost[dst] is the cheapest within the limit."],
    code: `def findCheapestPrice(n, flights, src, dst, k):
    cost = [float("inf")] * n
    cost[src] = 0
    for _ in range(k + 1):
        nxt = cost[:]
        for u, v, w in flights:
            if cost[u] + w < nxt[v]:
                nxt[v] = cost[u] + w
        cost = nxt
    return -1 if cost[dst] == float("inf") else cost[dst]`,
    lang: "python", time: "O(k · E)", space: "O(n)",
    viz: () => {
      const F = [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], n = 4, src = 0, dst = 3, k = 1, rows: Cell[][] = [[0, null, null, null]], frames: TableFrame[] = [];
      frames.push({ note: `round 0: only city ${src} is reachable, for free`, cells: copy(rows), active: [0, 0] });
      for (let r = 1; r <= k + 1; r++) {
        const prev = rows[r - 1], cur = [...prev]; rows.push(cur);
        for (const [u, v, w] of F) if (prev[u] != null && (cur[v] == null || (prev[u] as number) + w < (cur[v] as number))) { cur[v] = (prev[u] as number) + w; frames.push({ note: `round ${r}: fly ${u} → ${v} for ${w}: ${prev[u]} + ${w} = ${cur[v]}`, cells: copy(rows), active: [r, v], deps: [[r - 1, u]] }); }
      }
      frames.push({ note: `cheapest to ${dst} with at most ${k} stop${k === 1 ? "" : "s"}: ${rows[k + 1][dst]} (0 → 1 → 3; 0 → 1 → 2 → 3 is cheaper but needs 2 stops)`, cells: copy(rows), tones: { [`${k + 1}:${dst}`]: "found" } });
      return table(`k = ${k}: ${rows[k + 1][dst]}`, heads(k + 2, "round "), heads(n, "city "), frames);
    },
  },

  "evaluate-division": {
    approach: "Treat each equation a / b = v as edges a → b (weight v) and b → a (weight 1 / v); a query is the product of weights along any path.",
    idea: ["If a / b = 2 and b / c = 3 then a / c = 2 · 3: ratios multiply along a path.", "DFS from the numerator to the denominator, multiplying weights; a seen set avoids loops.", "Unknown variables or no path give -1.0; x / x is 1.0 only if x appears in an equation."],
    code: `from collections import defaultdict
def calcEquation(equations, values, queries):
    g = defaultdict(dict)
    for (a, b), v in zip(equations, values):
        g[a][b] = v
        g[b][a] = 1 / v
    def ratio(x, y, seen):
        if x == y:
            return 1.0
        seen.add(x)
        for z, v in g[x].items():
            if z not in seen:
                r = ratio(z, y, seen)
                if r != -1.0:
                    return v * r
        return -1.0
    return [ratio(a, b, set()) if a in g and b in g else -1.0 for a, b in queries]`,
    lang: "python", time: "O(Q · (V + E))", space: "O(V + E)",
    viz: () => {
      const names = ["a", "b", "c", "d"], eq: [number, number, number][] = [[0, 1, 2], [1, 2, 3], [2, 3, 0.5]], g: Record<number, [number, number][]> = { 0: [], 1: [], 2: [], 3: [] };
      eq.forEach(([a, b, v]) => { g[a].push([b, v]); g[b].push([a, 1 / v]); });
      const nodes = names.map((l, i) => ({ id: i, label: l, x: 10 + i * 27, y: i % 2 ? 80 : 20 })), frames: GraphFrame[] = [], fmt = (x: number) => String(Math.round(x * 1000) / 1000);
      const out: string[] = [];
      for (const [x, y] of [[0, 2], [3, 0]]) {
        const path: number[] = [], et: Record<string, Tone> = {};
        const go = (u: number, seen: Set<number>, acc: number): number => { path.push(u); frames.push({ note: `${names[x]} / ${names[y]}: at ${names[u]}, product so far ${fmt(acc)}`, tones: { ...tn(path, "window"), [u]: "active", [y]: u === y ? "found" : "window" }, edgeTones: { ...et }, badges: { [u]: fmt(acc) } }); if (u === y) return acc; seen.add(u); for (const [v, w] of g[u]) if (!seen.has(v)) { et[ek(u, v)] = "found"; const r = go(v, seen, acc * w); if (r >= 0) return r; delete et[ek(u, v)]; } path.pop(); return -1; };
        const r = go(x, new Set(), 1); out.push(fmt(r));
        frames.push({ note: `${names[x]} / ${names[y]} = ${fmt(r)}`, tones: { ...tn(path, "found") }, edgeTones: { ...et } });
      }
      return { kind: "graph", title: `a/b = 2, b/c = 3, c/d = 0.5 → a/c = ${out[0]}, d/a = ${out[1]}`, nodes, edges: eq.map(([a, b, w]) => ({ a, b, w, directed: true })), frames };
    },
  },

  "min-cost-to-connect-all-points": {
    approach: "Prim's algorithm on the complete graph: repeatedly add the point closest (Manhattan distance) to the tree built so far.",
    idea: ["Connecting all points as cheaply as possible is a minimum spanning tree.", "Keep dist[v] = cheapest edge from the tree to v; pick the smallest, add it, then update dist from the new point.", "The dense O(n²) Prim beats sorting all n² edges."],
    code: `def minCostConnectPoints(points):
    n = len(points)
    dist = [float("inf")] * n
    dist[0] = 0
    used = [False] * n
    total = 0
    for _ in range(n):
        u = min((d, i) for i, d in enumerate(dist) if not used[i])[1]
        used[u] = True
        total += dist[u]
        for v in range(n):
            if not used[v]:
                d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])
                if d < dist[v]:
                    dist[v] = d
    return total`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const P = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]], n = 5, nodes = P.map(([x, y], i) => ({ id: i, label: `${x},${y}`, x: 8 + x * 12, y: 95 - y * 9 }));
      const dist = [0, 1e9, 1e9, 1e9, 1e9], from = Array(n).fill(-1), used = Array(n).fill(false), frames: GraphFrame[] = [], et: Record<string, Tone> = {}, links: { a: number; b: number; w: number }[] = [];
      let total = 0;
      for (let step = 0; step < n; step++) {
        let u = -1; for (let i = 0; i < n; i++) if (!used[i] && (u < 0 || dist[i] < dist[u])) u = i;
        used[u] = true; total += dist[u]; if (from[u] >= 0) { links.push({ a: from[u], b: u, w: dist[u] }); et[ek(from[u], u)] = "found"; }
        for (let v = 0; v < n; v++) if (!used[v]) { const d = Math.abs(P[u][0] - P[v][0]) + Math.abs(P[u][1] - P[v][1]); if (d < dist[v]) { dist[v] = d; from[v] = u; } }
        frames.push({ note: step ? `add (${P[u].join(", ")}) by an edge of cost ${dist[u]} → total ${total}` : `start the tree at (${P[0].join(", ")})`, tones: { ...tn(used.flatMap((x, i) => (x ? [i] : [])), "found"), [u]: "active" }, edgeTones: { ...et }, badges: Object.fromEntries(dist.map((d, i) => [i, used[i] ? "in" : `+${d}`])) });
      }
      frames.push({ note: `all points connected for ${total}`, tones: tn(nodes.map((x) => x.id), "found"), edgeTones: { ...et } });
      return { kind: "graph", title: `Connect all points: ${total}`, nodes, edges: links, frames };
    },
  },

  "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree": {
    approach: "Build the MST weight once with Kruskal; an edge is critical if leaving it out raises that weight, pseudo-critical if forcing it in keeps the weight.",
    idea: ["Kruskal (sort edges, union-find) gives the minimum weight W.", "Skip edge i: if the MST gets heavier or the graph falls apart, every MST needs it, so it is critical.", "Otherwise force edge i in first: if the total is still W, some MST uses it, so it is pseudo-critical."],
    code: `def findCriticalAndPseudoCriticalEdges(n, edges):
    order = sorted(range(len(edges)), key=lambda i: edges[i][2])
    def mst(skip=-1, force=-1):
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        total = joined = 0
        if force >= 0:
            a, b, w = edges[force]
            parent[find(a)] = find(b)
            total, joined = w, 1
        for i in order:
            if i == skip:
                continue
            a, b, w = edges[i]
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
                total += w
                joined += 1
        return total if joined == n - 1 else float("inf")
    base = mst()
    critical, pseudo = [], []
    for i in range(len(edges)):
        if mst(skip=i) > base:
            critical.append(i)
        elif mst(force=i) == base:
            pseudo.append(i)
    return [critical, pseudo]`,
    lang: "python", time: "O(E² · α(n))", space: "O(n)",
    viz: () => {
      const n = 5, E = [[0, 1, 1], [1, 2, 1], [2, 3, 2], [0, 3, 2], [0, 4, 3], [3, 4, 3], [1, 4, 6]], xy = [[15, 20], [50, 5], [85, 30], [50, 60], [15, 95]];
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i), x, y })), order = E.map((_, i) => i).sort((a, b) => E[a][2] - E[b][2]);
      const mst = (skip = -1, force = -1) => { const p = Array.from({ length: n }, (_, i) => i), f = (x: number): number => (p[x] === x ? x : f(p[x])), used: number[] = []; let t = 0;
        if (force >= 0) { p[f(E[force][0])] = f(E[force][1]); t = E[force][2]; used.push(force); }
        for (const i of order) { if (i === skip) continue; const ra = f(E[i][0]), rb = f(E[i][1]); if (ra !== rb) { p[ra] = rb; t += E[i][2]; used.push(i); } }
        return { t: used.length === n - 1 ? t : -1, used }; };
      const base = mst(), frames: GraphFrame[] = [], kind: Record<string, Tone> = {}, crit: number[] = [], pseudo: number[] = [];
      const key = (i: number) => ek(E[i][0], E[i][1]);
      frames.push({ note: `Kruskal: MST weight ${base.t} using edges ${base.used.join(", ")}`, edgeTones: tn(base.used.map(key), "found") });
      E.forEach((e, i) => {
        const skip = mst(i), heavier = skip.t < 0 || skip.t > base.t; let note: string;
        if (heavier) { crit.push(i); kind[key(i)] = "found"; note = `edge ${i} (${e[0]}-${e[1]}, w ${e[2]}): without it ${skip.t < 0 ? "the graph splits" : `the MST weighs ${skip.t}`} → critical`; }
        else { const forced = mst(-1, i); if (forced.t === base.t) { pseudo.push(i); kind[key(i)] = "window"; note = `edge ${i} (${e[0]}-${e[1]}, w ${e[2]}): skipping still gives ${base.t}, forcing it also gives ${forced.t} → pseudo-critical`; } else { kind[key(i)] = "muted"; note = `edge ${i} (${e[0]}-${e[1]}, w ${e[2]}): forcing it gives ${forced.t} > ${base.t} → in no MST`; } }
        frames.push({ note, edgeTones: { ...kind, [key(i)]: heavier ? "found" : kind[key(i)] }, tones: { [e[0]]: "active", [e[1]]: "active" } });
      });
      frames.push({ note: `critical [${crit.join(", ")}] (green), pseudo-critical [${pseudo.join(", ")}] (blue)`, edgeTones: { ...kind } });
      return { kind: "graph", title: `Critical [${crit.join(",")}], pseudo [${pseudo.join(",")}]`, nodes, edges: E.map(([a, b, w]) => ({ a, b, w })), frames };
    },
  },

  "remove-max-number-of-edges-to-keep-graph-fully-traversable": {
    approach: "Greedy with two union-finds: add shared (type 3) edges first, then Alice-only and Bob-only edges; every edge that joins nothing new is removable.",
    idea: ["A type 3 edge helps both people at once, so it should always be preferred.", "Union type 3 edges into both Alice's and Bob's structures, then type 1 into Alice's and type 2 into Bob's.", "If both end with n - 1 joins the graph is traversable; the answer is the edges that joined nothing. Otherwise -1."],
    code: `def maxNumEdgesToRemove(n, edges):
    def find(p, x):
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x
    def union(p, a, b):
        ra, rb = find(p, a), find(p, b)
        if ra == rb:
            return 0
        p[ra] = rb
        return 1
    alice, bob = list(range(n + 1)), list(range(n + 1))
    used = ja = jb = 0
    for t, u, v in sorted(edges, reverse=True):
        if t == 3:
            got = union(alice, u, v)
            union(bob, u, v)
            used += got
            ja += got
            jb += got
        elif t == 1:
            got = union(alice, u, v)
            used += got
            ja += got
        else:
            got = union(bob, u, v)
            used += got
            jb += got
    return len(edges) - used if ja == jb == n - 1 else -1`,
    lang: "python", time: "O(E log E)", space: "O(n)",
    viz: () => {
      const n = 4, E = [[3, 1, 2], [3, 2, 3], [1, 1, 3], [1, 2, 4], [1, 1, 2], [2, 3, 4]].sort((a, b) => b[0] - a[0] || a[1] - b[1] || a[2] - b[2]);
      const A = Array.from({ length: n + 1 }, (_, i) => i), B = [...A], f = (p: number[], x: number): number => (p[x] === x ? x : f(p, p[x])), u = (p: number[], a: number, b: number) => { const ra = f(p, a), rb = f(p, b); if (ra === rb) return 0; p[ra] = rb; return 1; };
      const rows: Cell[][] = E.map(([t, a, b]) => [t === 3 ? "both" : t === 1 ? "Alice" : "Bob", `${a}-${b}`, null]), frames: TableFrame[] = [];
      let used = 0, ja = 0, jb = 0;
      frames.push({ note: "shared edges first (type 3), then Alice's (1) and Bob's (2)", cells: copy(rows) });
      E.forEach(([t, a, b], i) => {
        let got: number;
        if (t === 3) { got = u(A, a, b); u(B, a, b); ja += got; jb += got; } else if (t === 1) { got = u(A, a, b); ja += got; } else { got = u(B, a, b); jb += got; }
        used += got; rows[i][2] = got ? "keep" : "remove";
        frames.push({ note: `${rows[i][0]} edge ${a}-${b}: ${got ? "joins two separate groups → keep" : "both ends already connected → remove"} (Alice ${ja}/${n - 1}, Bob ${jb}/${n - 1})`, cells: copy(rows), active: [i, 2] });
      });
      const ans = ja === n - 1 && jb === n - 1 ? E.length - used : -1;
      frames.push({ note: `both fully connected; ${E.length} - ${used} kept = ${ans} edges removable`, cells: copy(rows), tones: tn(rows.flatMap((r, i) => (r[2] === "remove" ? [`${i}:2`] : [])), "found") });
      return table(`Removable edges: ${ans}`, heads(E.length, "e"), ["type", "edge", "result"], frames);
    },
  },

  "island-perimeter": {
    approach: "Each land cell adds 4 edges; every shared side with a land neighbour above or to the left removes 2.",
    idea: ["A lone land cell has perimeter 4.", "When two land cells touch, the shared side disappears from both, so subtract 2.", "Checking only the top and left neighbours counts each shared side once."],
    code: `def islandPerimeter(grid):
    total = 0
    for r, row in enumerate(grid):
        for c, v in enumerate(row):
            if v:
                total += 4
                if r and grid[r - 1][c]:
                    total -= 2
                if c and row[c - 1]:
                    total -= 2
    return total`,
    lang: "python", time: "O(R · C)", space: "O(1)",
    viz: () => {
      const g = [[0, 1, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]], frames: TableFrame[] = [], seen: string[] = []; let total = 0;
      frames.push({ note: "1 = land; count edges cell by cell", cells: copy(g) });
      g.forEach((row, r) => row.forEach((v, c) => { if (!v) return; const up = r > 0 && g[r - 1][c] === 1, left = c > 0 && row[c - 1] === 1; total += 4 - (up ? 2 : 0) - (left ? 2 : 0); frames.push({ note: `land (${r}, ${c}): +4${up ? ", shares top side -2" : ""}${left ? ", shares left side -2" : ""} → ${total}`, cells: copy(g), active: [r, c], deps: [...(up ? [[r - 1, c] as [number, number]] : []), ...(left ? [[r, c - 1] as [number, number]] : [])], tones: tn(seen, "done") }); seen.push(`${r}:${c}`); }));
      frames.push({ note: `perimeter ${total}`, cells: copy(g), tones: tn(seen, "found") });
      return table(`Island perimeter: ${total}`, heads(4, "r"), heads(4, "c"), frames);
    },
  },

  "word-search": {
    approach: "Backtracking DFS from every cell: match the next letter, mark the cell used, try the four neighbours, then unmark.",
    idea: ["Start from each cell that equals word[0].", "Step to a neighbour only if it matches the next letter and is not already on the path (temporarily replaced by '#').", "Restore the cell when backing out so other paths can use it."],
    code: `def exist(board, word):
    R, C = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < R and 0 <= c < C and board[r][c] == word[i]):
            return False
        board[r][c] = "#"
        found = any(dfs(r + dr, c + dc, i + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        board[r][c] = word[i]
        return found
    return any(dfs(r, c, 0) for r in range(R) for c in range(C))`,
    lang: "python", time: "O(R · C · 3ᴸ)", space: "O(L)",
    viz: () => {
      const b = [["A", "B", "C", "E"], ["S", "F", "E", "S"], ["A", "D", "E", "E"]], word = "ABCESEEEF", R = 3, C = 4, path: string[] = [], frames: TableFrame[] = [], dead: string[] = [];
      const dfs = (r: number, c: number, i: number): boolean => {
        if (i === word.length) return true;
        if (r < 0 || c < 0 || r >= R || c >= C || b[r][c] !== word[i]) return false;
        path.push(`${r}:${c}`); b[r][c] = "#";
        frames.push({ note: `'${word[i]}' at (${r}, ${c}) matches letter ${i + 1} of ${word.length}`, cells: copy(b), active: [r, c], tones: { ...tn(dead, "bad"), ...tn(path, "window") } });
        const ok = D4.some(([dr, dc]) => dfs(r + dr, c + dc, i + 1));
        b[r][c] = word[i]; if (!ok) { path.pop(); dead.push(`${r}:${c}`); frames.push({ note: `dead end at (${r}, ${c}): no unused neighbour continues with '${word[i + 1]}', back up`, cells: copy(b), tones: { ...tn(dead, "bad"), ...tn(path, "window") } }); dead.pop(); }
        return ok;
      };
      let found = false;
      for (let r = 0; r < R && !found; r++) for (let c = 0; c < C && !found; c++) found = dfs(r, c, 0);
      frames.push({ note: found ? `"${word}" found` : `"${word}" not found`, cells: copy(b), tones: tn(path, "found") });
      return table(`Search "${word}": ${found}`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "pacific-atlantic-water-flow": {
    approach: "Search uphill from each ocean's border cells; the cells reached from both oceans can drain into both.",
    idea: ["Water flows to a neighbour with height ≤ current, so reverse it: from the ocean, climb to neighbours with height ≥ current.", "One DFS from all Pacific border cells (top row, left column) and one from all Atlantic border cells (bottom row, right column).", "Answer = cells in both reached sets."],
    code: `def pacificAtlantic(heights):
    R, C = len(heights), len(heights[0])
    def climb(starts):
        seen = set(starts)
        stack = list(starts)
        while stack:
            r, c = stack.pop()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < R and 0 <= nc < C and (nr, nc) not in seen and heights[nr][nc] >= heights[r][c]:
                    seen.add((nr, nc))
                    stack.append((nr, nc))
        return seen
    pac = climb([(r, 0) for r in range(R)] + [(0, c) for c in range(C)])
    atl = climb([(r, C - 1) for r in range(R)] + [(R - 1, c) for c in range(C)])
    return [[r, c] for r in range(R) for c in range(C) if (r, c) in pac and (r, c) in atl]`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const h = [[1, 2, 2, 3], [3, 2, 3, 4], [2, 4, 5, 3], [6, 7, 1, 4]], R = 4, C = 4, frames: TableFrame[] = [];
      const climb = (name: string, starts: number[][], tone: Tone, other: Set<string>) => {
        const seen = new Set(starts.map(([r, c]) => `${r}:${c}`)), stack = [...starts];
        frames.push({ note: `${name}: its border cells drain into it directly`, cells: copy(h), tones: { ...tn(other, "done"), ...tn(seen, tone) } });
        while (stack.length) { const [r, c] = stack.pop()!; const got: string[] = []; for (const [dr, dc] of D4) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < R && nc < C && !seen.has(`${nr}:${nc}`) && h[nr][nc] >= h[r][c]) { seen.add(`${nr}:${nc}`); stack.push([nr, nc]); got.push(`(${nr}, ${nc})`); } } if (got.length) frames.push({ note: `${name}: from (${r}, ${c}) height ${h[r][c]} climb to ${got.join(", ")}`, cells: copy(h), active: [r, c], tones: { ...tn(other, "done"), ...tn(seen, tone) } }); }
        return seen;
      };
      const pac = climb("Pacific", [...Array.from({ length: R }, (_, r) => [r, 0]), ...Array.from({ length: C - 1 }, (_, c) => [0, c + 1])], "window", new Set());
      const atl = climb("Atlantic", [...Array.from({ length: R }, (_, r) => [r, C - 1]), ...Array.from({ length: C - 1 }, (_, c) => [R - 1, c])], "active", new Set());
      const both = [...pac].filter((k) => atl.has(k)).sort((x, y) => { const [a, b] = x.split(":").map(Number), [c, d] = y.split(":").map(Number); return a - c || b - d; });
      frames.push({ note: `${both.length} cells reach both oceans: ${both.map((k) => `(${k.replace(":", ", ")})`).join(" ")}`, cells: copy(h), tones: tn(both, "found") });
      return table(`Both oceans: ${both.length} cells`, heads(R, "r"), heads(C, "c"), frames);
    },
  },

  "shortest-path-in-binary-matrix": {
    approach: "BFS from the top-left over 0 cells with 8-directional moves; the BFS layer at the bottom-right is the path length.",
    idea: ["All moves cost 1, so BFS gives shortest paths.", "Count cells, not moves: the start alone has length 1.", "Mark cells visited when they are queued (set them to 1) so each is enqueued once."],
    code: `from collections import deque
def shortestPathBinaryMatrix(grid):
    n = len(grid)
    if grid[0][0] or grid[n - 1][n - 1]:
        return -1
    q = deque([(0, 0, 1)])
    grid[0][0] = 1
    while q:
        r, c, d = q.popleft()
        if (r, c) == (n - 1, n - 1):
            return d
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0:
                    grid[nr][nc] = 1
                    q.append((nr, nc, d + 1))
    return -1`,
    lang: "python", time: "O(n²)", space: "O(n²)",
    viz: () => {
      const g = [[0, 1, 0, 0], [0, 1, 0, 1], [0, 0, 1, 0], [1, 1, 0, 0]], n = 4, shown: Cell[][] = g.map((r) => r.map((v) => (v ? "#" : null))), walls = tn(g.flatMap((r, i) => r.flatMap((v, j) => (v ? [`${i}:${j}`] : []))), "muted"), frames: TableFrame[] = [];
      let layer = [[0, 0]], d = 1; shown[0][0] = 1; g[0][0] = 1; const seen = ["0:0"];
      frames.push({ note: "# = blocked; start at (0, 0), path length 1", cells: copy(shown), tones: { ...walls, "0:0": "active" } });
      while (layer.length && shown[n - 1][n - 1] == null) {
        d++; const next: number[][] = [];
        for (const [r, c] of layer) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < n && nc < n && g[nr][nc] === 0) { g[nr][nc] = 1; shown[nr][nc] = d; next.push([nr, nc]); } }
        frames.push({ note: `length ${d}: reach ${next.map(([r, c]) => `(${r}, ${c})`).join(", ")} (diagonals allowed)`, cells: copy(shown), tones: { ...walls, ...tn(seen, "done"), ...tn(next.map(([r, c]) => `${r}:${c}`), "active") } });
        seen.push(...next.map(([r, c]) => `${r}:${c}`)); layer = next;
      }
      frames.push({ note: `bottom-right reached with path length ${shown[n - 1][n - 1]}`, cells: copy(shown), tones: { ...walls, [`${n - 1}:${n - 1}`]: "found" } });
      return table(`Shortest clear path: ${shown[n - 1][n - 1]}`, heads(n, "r"), heads(n, "c"), frames);
    },
  },
  "is-graph-bipartite": {
    approach: "Two-colour each component by DFS: every neighbour gets the opposite colour, and a neighbour already holding the same colour proves an odd cycle.",
    idea: ["A graph is bipartite exactly when it can be coloured with two colours so every edge joins different colours.", "Start an uncoloured node with colour 0 and push it; give each uncoloured neighbour the other colour.", "If an edge ever joins two nodes of the same colour, return False. Repeat for every component."],
    code: `def isBipartite(graph):
    color = [-1] * len(graph)
    for s in range(len(graph)):
        if color[s] != -1:
            continue
        color[s] = 0
        stack = [s]
        while stack:
            u = stack.pop()
            for v in graph[u]:
                if color[v] == -1:
                    color[v] = color[u] ^ 1
                    stack.append(v)
                elif color[v] == color[u]:
                    return False
    return True`,
    lang: "python", time: "O(V + E)", space: "O(V)",
    viz: () => {
      const g = [[1, 3], [0, 2, 4], [1, 3, 5], [0, 2, 4], [1, 3, 5], [2, 4]], xy = [[10, 20], [50, 20], [90, 20], [10, 80], [50, 80], [90, 80]];
      const g2 = g.map((vs) => [...vs]); g2[0].push(4); g2[4].push(0);
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i), x, y })), edges = g2.flatMap((vs, u) => vs.filter((v) => u < v).map((v) => ({ a: u, b: v })));
      const color = Array(6).fill(-1), frames: GraphFrame[] = [], view = (note: string, extra: Record<number, Tone> = {}, et: Record<string, Tone> = {}) => frames.push({ note, tones: { ...Object.fromEntries(color.map((c, i) => [i, c === 0 ? "window" : c === 1 ? "found" : "muted"]).filter(([, t]) => t !== "muted")), ...extra } as Record<number, Tone>, badges: Object.fromEntries(color.map((c, i) => [i, c < 0 ? "" : c ? "B" : "A"])), edgeTones: et });
      color[0] = 0; const stack = [0]; let ok = true;
      view("colour node 0 with A; every neighbour must get B", { 0: "active" });
      while (stack.length && ok) {
        const u = stack.pop()!, got: number[] = [];
        for (const v of g2[u]) { if (color[v] < 0) { color[v] = color[u] ^ 1; stack.push(v); got.push(v); } else if (color[v] === color[u]) { ok = false; view(`edge ${u}-${v} joins two ${color[u] ? "B" : "A"} nodes → odd cycle, not bipartite`, { [u]: "bad", [v]: "bad" }, { [ek(u, v)]: "bad" }); break; } }
        if (ok) view(`pop ${u} (${color[u] ? "B" : "A"}): ${got.length ? `colour ${got.join(", ")} with ${color[u] ? "A" : "B"}` : "neighbours already fine"}`, { [u]: "active" });
      }
      return { kind: "graph", title: `Grid plus edge 0-4: bipartite ${ok}`, nodes, edges, frames };
    },
  },

  "flower-planting-with-no-adjacent": {
    approach: "Each garden has at most 3 neighbours, so among 4 flower types one is always free: give each garden the smallest type no neighbour uses.",
    idea: ["Degree ≤ 3 means at most 3 types are blocked for any garden.", "Go through gardens in order and pick the first type not used by an already-planted neighbour.", "No backtracking is ever needed."],
    code: `def gardenNoAdj(n, paths):
    adj = [[] for _ in range(n)]
    for a, b in paths:
        adj[a - 1].append(b - 1)
        adj[b - 1].append(a - 1)
    ans = [0] * n
    for u in range(n):
        taken = {ans[v] for v in adj[u]}
        ans[u] = next(c for c in range(1, 5) if c not in taken)
    return ans`,
    lang: "python", time: "O(n + paths)", space: "O(n + paths)",
    viz: () => {
      const n = 5, P = [[1, 2], [2, 3], [3, 1], [1, 4], [4, 5], [5, 2], [3, 4]], xy = [[50, 10], [15, 50], [85, 50], [70, 95], [30, 95]];
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i + 1), x, y })), adj: number[][] = Array.from({ length: n }, () => []); P.forEach(([a, b]) => { adj[a - 1].push(b - 1); adj[b - 1].push(a - 1); });
      const ans = Array(n).fill(0), frames: GraphFrame[] = [];
      for (let u = 0; u < n; u++) {
        const taken = new Set(adj[u].map((v) => ans[v]).filter(Boolean)); ans[u] = [1, 2, 3, 4].find((c) => !taken.has(c))!;
        frames.push({ note: `garden ${u + 1}: neighbours use [${[...taken].sort().join(", ") || "nothing"}] → plant type ${ans[u]}`, tones: { ...tn(ans.flatMap((a, i) => (a ? [i] : [])), "found"), [u]: "active", ...tn(adj[u].filter((v) => ans[v]), "window") }, badges: Object.fromEntries(ans.map((a, i) => [i, a ? `type ${a}` : ""])) });
      }
      frames.push({ note: `answer [${ans.join(", ")}]`, tones: tn(nodes.map((x) => x.id), "found"), badges: Object.fromEntries(ans.map((a, i) => [i, `type ${a}`])) });
      return { kind: "graph", title: `Flowers [${ans.join(", ")}]`, nodes, edges: P.map(([a, b]) => ({ a: a - 1, b: b - 1 })), frames };
    },
  },

  "shortest-path-with-alternating-colors": {
    approach: "BFS over states (node, colour of the last edge); from a state you may only take edges of the other colour.",
    idea: ["The colour of the edge you arrived by decides which edges you may take next, so it is part of the state.", "Start from node 0 in both states (as if the last edge were red, and as if it were blue).", "BFS gives the shortest alternating distance; the first time a node is popped in either state is its answer."],
    code: `from collections import deque
def shortestAlternatingPaths(n, redEdges, blueEdges):
    adj = [[[] for _ in range(n)] for _ in range(2)]
    for a, b in redEdges:
        adj[0][a].append(b)
    for a, b in blueEdges:
        adj[1][a].append(b)
    ans = [-1] * n
    seen = {(0, 0), (0, 1)}
    q = deque([(0, 0, 0), (0, 1, 0)])
    while q:
        u, c, d = q.popleft()
        if ans[u] == -1:
            ans[u] = d
        for v in adj[1 - c][u]:
            if (v, 1 - c) not in seen:
                seen.add((v, 1 - c))
                q.append((v, 1 - c, d + 1))
    return ans`,
    lang: "python", time: "O(n + E)", space: "O(n + E)",
    viz: () => {
      const n = 4, red = [[0, 1], [2, 3], [1, 3]], blue = [[1, 2], [0, 2]], xy = [[10, 50], [45, 10], [45, 90], [90, 50]], adj = [red, blue].map((es) => Array.from({ length: n }, (_, u) => es.filter(([a]) => a === u).map(([, b]) => b)));
      const nodes = xy.map(([x, y], i) => ({ id: i, label: String(i), x, y })), base: Record<string, Tone> = { ...tn(red.map(([a, b]) => ek(a, b)), "bad"), ...tn(blue.map(([a, b]) => ek(a, b)), "window") };
      const ans = Array(n).fill(-1), seen = new Set(["0:0", "0:1"]), q: number[][] = [[0, 0, 0], [0, 1, 0]], frames: GraphFrame[] = [], name = ["red", "blue"];
      frames.push({ note: "red edges dashed, blue edges solid; start at 0 allowed to take either colour", tones: { 0: "active" }, edgeTones: base, badges: { 0: "0" } });
      while (q.length) {
        const [u, c, d] = q.shift()!; const first = ans[u] < 0; if (first) ans[u] = d; const go: number[] = [];
        for (const v of adj[1 - c][u]) if (!seen.has(`${v}:${1 - c}`)) { seen.add(`${v}:${1 - c}`); q.push([v, 1 - c, d + 1]); go.push(v); }
        frames.push({ note: `pop node ${u} at distance ${d}${d ? ` (arrived by ${name[c]})` : ""}${first ? ` → answer[${u}] = ${d}` : ""}; next must be ${name[1 - c]}${go.length ? `: queue ${go.join(", ")}` : ", none"}`, tones: { ...tn(ans.flatMap((a, i) => (a >= 0 ? [i] : [])), "found"), [u]: "active" }, edgeTones: { ...base, ...tn(go.map((v) => ek(u, v)), "found") }, badges: Object.fromEntries(ans.map((a, i) => [i, a >= 0 ? String(a) : ""])) });
      }
      frames.push({ note: `answer [${ans.join(", ")}]`, tones: tn(ans.flatMap((a, i) => (a >= 0 ? [i] : [])), "found"), edgeTones: base, badges: Object.fromEntries(ans.map((a, i) => [i, String(a)])) });
      return { kind: "graph", title: `Alternating distances [${ans.join(", ")}]`, nodes, edges: [...red, ...blue].map(([a, b]) => ({ a, b, directed: true })), frames };
    },
  },

  "maximum-length-of-pair-chain": {
    approach: "Greedy by end: sort pairs by their second number and take each pair that starts after the last chosen end.",
    idea: ["Like activity selection: finishing as early as possible leaves the most room for later pairs.", "Sort by b, keep the end of the last chosen pair.", "Take a pair when its a is strictly greater than that end."],
    code: `def findLongestChain(pairs):
    end, count = float("-inf"), 0
    for a, b in sorted(pairs, key=lambda p: p[1]):
        if a > end:
            end, count = b, count + 1
    return count`,
    lang: "python", time: "O(n log n)", space: "O(1) extra",
    viz: () => {
      const items: [number, number][] = [[1, 2], [7, 8], [4, 5], [2, 3], [3, 6], [5, 9]].sort((x, y) => x[1] - y[1]) as [number, number][], frames: IntervalsFrame[] = [], tones: Record<number, Tone> = {};
      let end = -1, count = 0;
      items.forEach(([a, b], i) => { const take = a > end; tones[i] = take ? "found" : "bad"; if (take) { end = b; count++; } frames.push({ note: `[${a}, ${b}]: ${take ? `starts after ${count > 1 ? "the chain end" : "nothing"}, take it → chain ${count}, end ${b}` : `starts at ${a}, not after the chain end ${end} → skip`}`, tones: { ...tones }, line: end }); });
      frames.push({ note: `longest chain ${count}`, tones: { ...tones } });
      return { kind: "intervals", title: `Pair chain length: ${count}`, items, frames };
    },
  },

  "remove-covered-intervals": {
    approach: "Sort by start, and for equal starts by longer first; an interval is covered exactly when its end does not pass the furthest end seen so far.",
    idea: ["After sorting by start, every earlier interval starts no later than the current one.", "Putting longer intervals first on ties makes the cover check only about ends.", "Keep the furthest right end; a new interval with end ≤ that is covered, otherwise it survives and pushes the end."],
    code: `def removeCoveredIntervals(intervals):
    count = right = 0
    for a, b in sorted(intervals, key=lambda x: (x[0], -x[1])):
        if b > right:
            count += 1
            right = b
    return count`,
    lang: "python", time: "O(n log n)", space: "O(1) extra",
    viz: () => {
      const items = ([[1, 4], [3, 6], [2, 8], [3, 5], [9, 10], [2, 4]] as [number, number][]).sort((x, y) => x[0] - y[0] || y[1] - x[1]), frames: IntervalsFrame[] = [], tones: Record<number, Tone> = {};
      let right = 0, count = 0;
      items.forEach(([a, b], i) => { const keep = b > right; tones[i] = keep ? "found" : "muted"; const was = right; if (keep) { count++; right = b; } frames.push({ note: keep ? `[${a}, ${b}] ends past ${was} → not covered, keep (${count})` : `[${a}, ${b}] ends by ${was} → covered by an earlier interval`, tones: { ...tones }, line: right }); });
      frames.push({ note: `${count} intervals remain`, tones: { ...tones } });
      return { kind: "intervals", title: `Remaining intervals: ${count}`, items, frames };
    },
  },

  "jump-game": {
    approach: "Track the furthest index reachable so far; if you ever stand past it, you are stuck.",
    idea: ["From index i you can reach anything up to i + nums[i].", "Scan left to right keeping reach = max of those.", "If i > reach, index i can never be reached, so neither can the end."],
    code: `def canJump(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [3, 2, 1, 0, 4], frames: CellsFrame[] = []; let reach = 0, ok = true;
      for (let i = 0; i < a.length; i++) {
        if (i > reach) { ok = false; frames.push({ note: `index ${i} is past the furthest reach ${reach} → stuck, false`, tones: { ...range(0, reach, 0, "done"), [`0:${i}`]: "bad" }, marks: [{ i: reach, label: "reach" }] }); break; }
        const was = reach; reach = Math.max(reach, i + a[i]);
        frames.push({ note: `index ${i}: can jump to ${i + a[i]}; reach ${reach > was ? `grows to ${reach}` : `stays ${reach}`}`, tones: { ...range(0, Math.min(reach, a.length - 1), 0, "window"), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }, { i: Math.min(reach, a.length - 1), label: "reach" }] });
      }
      if (ok) frames.push({ note: "the last index is reachable → true", tones: range(0, a.length - 1, 0, "found") });
      return cells(`[${a.join(",")}]: ${ok}`, [a], frames);
    },
  },

  "jump-game-ii": {
    approach: "BFS in layers on the array: the current jump covers indices up to end; while scanning it, track the furthest next reach, and jump when you hit end.",
    idea: ["With j jumps you can reach a contiguous block of indices.", "Scanning that block, far = max(i + nums[i]) is where j + 1 jumps can reach.", "When i reaches the block's end, take a jump and the new block ends at far."],
    code: `def jump(nums):
    jumps = end = far = 0
    for i in range(len(nums) - 1):
        far = max(far, i + nums[i])
        if i == end:
            jumps += 1
            end = far
    return jumps`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 3, 1, 1, 2, 1, 3], frames: CellsFrame[] = []; let jumps = 0, end = 0, far = 0, start = 0;
      for (let i = 0; i < a.length - 1; i++) {
        far = Math.max(far, i + a[i]);
        const hit = i === end;
        frames.push({ note: `index ${i}: furthest next reach ${far}${hit ? `; block of ${jumps} jump${jumps === 1 ? "" : "s"} ends here → jump ${jumps + 1}, next block up to ${far}` : ""}`, tones: { ...range(start, end, 0, "window"), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }, { i: end, label: "end" }] });
        if (hit) { jumps++; start = end + 1; end = far; }
      }
      frames.push({ note: `${jumps} jumps reach the last index`, tones: range(0, a.length - 1, 0, "found") });
      return cells(`[${a.join(",")}]: ${jumps} jumps`, [a], frames);
    },
  },

  "gas-station": {
    approach: "If total gas covers total cost a start exists; whenever the running tank goes negative, no station up to here can be the start, so restart after it.",
    idea: ["sum(gas) < sum(cost) means no start works.", "If you start at s and run dry at i, every station between s and i also runs dry by i (it starts with less fuel), so try i + 1.", "With enough total gas, the last restart point completes the circle."],
    code: `def canCompleteCircuit(gas, cost):
    if sum(gas) < sum(cost):
        return -1
    start = tank = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:
            start, tank = i + 1, 0
    return start`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2], tank: (string | number)[] = Array(5).fill(""), frames: CellsFrame[] = []; let start = 0, t = 0;
      frames.push({ note: `total gas ${gas.reduce((x, y) => x + y)} ≥ total cost ${cost.reduce((x, y) => x + y)}, so some start works`, rows: [gas, cost, [...tank]] });
      for (let i = 0; i < 5; i++) {
        t += gas[i] - cost[i]; tank[i] = t;
        if (t < 0) { frames.push({ note: `station ${i}: tank ${t} < 0, so no start in ${start}..${i} works → try ${i + 1}`, rows: [gas, cost, [...tank]], tones: { ...range(start, i, 2, "bad") }, marks: [{ i: Math.min(i + 1, 4), label: "start" }] }); start = i + 1; t = 0; }
        else frames.push({ note: `station ${i}: +${gas[i]} - ${cost[i]} → tank ${t}`, rows: [gas, cost, [...tank]], tones: { ...range(start, i, 2, "found") }, marks: [{ i: start, label: "start" }] });
      }
      frames.push({ note: `start at station ${start}`, rows: [gas, cost, [...tank]], tones: { [`0:${start}`]: "found" }, marks: [{ i: start, label: "start" }] });
      return cells(`Start at station ${start}`, [gas, cost, tank], frames, ["gas", "cost", "tank"]);
    },
  },

  "minimum-number-of-taps-to-open-to-water-a-garden": {
    approach: "Turn taps into intervals, store for each left end the furthest right end, then jump greedily as in Jump Game II.",
    idea: ["Tap i waters [i - r, i + r]; only the furthest right end per left end matters.", "Scan 0..n-1 keeping the furthest point any tap starting so far can reach.", "When you reach the end of the watered stretch, open one more tap to extend it to far; if far does not move past i, there is a gap → -1."],
    code: `def minTaps(n, ranges):
    reach = [0] * (n + 1)
    for i, r in enumerate(ranges):
        lo = max(0, i - r)
        reach[lo] = max(reach[lo], i + r)
    taps = end = far = 0
    for i in range(n):
        far = max(far, reach[i])
        if i == end:
            if far <= i:
                return -1
            taps += 1
            end = far
    return taps`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 7, ranges = [1, 2, 1, 0, 2, 1, 0, 1], items = ranges.map((r, i) => [Math.max(0, i - r), Math.min(n, i + r)] as [number, number]), frames: IntervalsFrame[] = [], open: number[] = [];
      const reach = Array(n + 1).fill(0), who = Array(n + 1).fill(-1); items.forEach(([lo, hi], i) => { if (hi > reach[lo] || who[lo] < 0) { reach[lo] = Math.max(reach[lo], hi); who[lo] = i; } });
      let taps = 0, end = 0, far = 0, farTap = -1;
      frames.push({ note: `each bar is the stretch a tap waters; cover 0..${n}`, tones: {} });
      for (let i = 0; i < n; i++) {
        if (reach[i] > far) { far = reach[i]; farTap = who[i]; }
        if (i === end) {
          if (far <= i) { frames.push({ note: `nothing reaches past ${i} → -1`, tones: tn(open, "found"), line: i }); break; }
          taps++; end = far; open.push(farTap);
          frames.push({ note: `at ${i} the watered part ends; open tap ${farTap} (covers [${items[farTap].join(", ")}]) → watered up to ${end}, ${taps} tap${taps === 1 ? "" : "s"}`, tones: { ...tn(open, "found"), [farTap]: "active" }, line: end });
        }
      }
      frames.push({ note: `${taps} taps water the whole garden`, tones: tn(open, "found") });
      return { kind: "intervals", title: `Garden of ${n}: ${taps} taps`, items, frames };
    },
  },

  "wiggle-subsequence": {
    approach: "Keep up = longest wiggle ending with a rise, down = longest ending with a fall; a rise extends a fall and a fall extends a rise.",
    idea: ["When nums rises, the best wiggle ending in a rise is the best ending in a fall plus this step: up = down + 1.", "When it falls, down = up + 1. Equal neighbours change nothing.", "The answer is max(up, down); this is the same as counting direction changes."],
    code: `def wiggleMaxLength(nums):
    up = down = 1
    for a, b in zip(nums, nums[1:]):
        if b > a:
            up = down + 1
        elif b < a:
            down = up + 1
    return max(up, down)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 17, 5, 10, 13, 15, 10, 5, 16, 8], U: (string | number)[] = [1, ...Array(a.length - 1).fill("")], D: (string | number)[] = [1, ...Array(a.length - 1).fill("")], frames: CellsFrame[] = []; let up = 1, down = 1;
      frames.push({ note: "one number alone is a wiggle of length 1", rows: [a, [...U], [...D]], tones: { "0:0": "active" } });
      for (let i = 1; i < a.length; i++) {
        const dir = a[i] > a[i - 1] ? "rise" : a[i] < a[i - 1] ? "fall" : "flat";
        if (dir === "rise") up = down + 1; else if (dir === "fall") down = up + 1;
        U[i] = up; D[i] = down;
        frames.push({ note: `${a[i - 1]} → ${a[i]} is a ${dir}: ${dir === "rise" ? `up = down + 1 = ${up}` : dir === "fall" ? `down = up + 1 = ${down}` : "nothing changes"}`, rows: [a, [...U], [...D]], tones: { [`0:${i}`]: "active", [`0:${i - 1}`]: "window", [`${dir === "rise" ? 1 : 2}:${i}`]: "found" } });
      }
      frames.push({ note: `longest wiggle ${Math.max(up, down)}`, rows: [a, [...U], [...D]] });
      return cells(`Wiggle length: ${Math.max(up, down)}`, [a, U.map(() => ""), D.map(() => "")], frames, ["nums", "up", "down"]);
    },
  },
  "partition-labels": {
    approach: "Record each letter's last index; extend the current part to the furthest last index of letters inside it, and cut when the scan reaches that point.",
    idea: ["A letter forces its part to reach its last occurrence.", "Scan left to right with end = max(last[ch]) over letters seen in this part.", "When i == end nothing inside reaches further, so cut there; this gives the most parts."],
    code: `def partitionLabels(s):
    last = {ch: i for i, ch in enumerate(s)}
    out, start, end = [], 0, 0
    for i, ch in enumerate(s):
        end = max(end, last[ch])
        if i == end:
            out.append(end - start + 1)
            start = i + 1
    return out`,
    lang: "python", time: "O(n)", space: "O(1) (26 letters)",
    viz: () => {
      const s = "ababcdcdef", last: Record<string, number> = {}; [...s].forEach((c, i) => (last[c] = i));
      const frames: CellsFrame[] = [], out: number[] = [], doneT: Record<string, Tone> = {}; let start = 0, end = 0;
      [...s].forEach((ch, i) => {
        const was = end; end = Math.max(end, last[ch]); const cut = i === end;
        frames.push({ note: `'${ch}' last appears at ${last[ch]}; part must reach ${end}${end > was ? "" : " (unchanged)"}${cut ? ` → cut, part of size ${end - start + 1}` : ""}`, tones: { ...doneT, ...range(start, end, 0, cut ? "found" : "window"), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }, { i: end, label: "end" }] });
        if (cut) { out.push(end - start + 1); Object.assign(doneT, range(start, end, 0, "done")); start = i + 1; }
      });
      frames.push({ note: `part sizes [${out.join(", ")}]`, tones: doneT });
      return cells(`"${s}" → [${out.join(", ")}]`, [s.split("")], frames);
    },
  },

  "maximum-swap": {
    approach: "For each digit from the left, look for a bigger digit whose last occurrence is further right; swap with that last occurrence once.",
    idea: ["The first position that can be improved is the one to change, since leftmost digits matter most.", "Swap it with the largest digit to its right, taking the rightmost copy so the smaller digit lands as far right as possible.", "Store each digit's last index and try 9 down to the current digit."],
    code: `def maximumSwap(num):
    d = list(str(num))
    last = {x: i for i, x in enumerate(d)}
    for i, x in enumerate(d):
        for big in "9876543210":
            if big <= x:
                break
            if last.get(big, -1) > i:
                j = last[big]
                d[i], d[j] = d[j], d[i]
                return int("".join(d))
    return num`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const d = "98368".split(""), last: Record<string, number> = {}; d.forEach((x, i) => (last[x] = i));
      const frames: CellsFrame[] = [{ note: `last index of each digit: ${Object.entries(last).sort().map(([k, v]) => `${k}→${v}`).join(", ")}`, rows: [[...d]] }];
      let done = false;
      for (let i = 0; i < d.length && !done; i++) {
        let j = -1; for (let big = 9; big > +d[i]; big--) if ((last[big] ?? -1) > i) { j = last[big]; break; }
        if (j < 0) { frames.push({ note: `position ${i} ('${d[i]}'): no bigger digit to its right, keep it`, rows: [[...d]], tones: { [`0:${i}`]: "done" }, marks: [{ i, label: "i" }] }); continue; }
        frames.push({ note: `position ${i} ('${d[i]}'): bigger digit '${d[j]}' last appears at ${j} → swap`, rows: [[...d]], tones: { [`0:${i}`]: "active", [`0:${j}`]: "active" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
        [d[i], d[j]] = [d[j], d[i]]; done = true;
        frames.push({ note: `answer ${d.join("")}`, rows: [[...d]], tones: { [`0:${i}`]: "found", [`0:${j}`]: "found" } });
      }
      return cells(`98368 → ${d.join("")}`, [d], frames);
    },
  },

  "candy": {
    approach: "Two passes: left to right gives each child more than a lower-rated left neighbour, right to left fixes the right neighbours while keeping the larger count.",
    idea: ["Everyone starts with 1 candy.", "Left pass: if ratings[i] > ratings[i - 1], give c[i - 1] + 1.", "Right pass: if ratings[i] > ratings[i + 1], take max(c[i], c[i + 1] + 1), so both rules hold with the fewest candies."],
    code: `def candy(ratings):
    n = len(ratings)
    c = [1] * n
    for i in range(1, n):
        if ratings[i] > ratings[i - 1]:
            c[i] = c[i - 1] + 1
    for i in range(n - 2, -1, -1):
        if ratings[i] > ratings[i + 1]:
            c[i] = max(c[i], c[i + 1] + 1)
    return sum(c)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const r = [1, 0, 2, 3, 2, 1], n = r.length, c = Array(n).fill(1), frames: CellsFrame[] = [{ note: "everyone starts with 1 candy", rows: [r, [...c]] }];
      for (let i = 1; i < n; i++) if (r[i] > r[i - 1]) { c[i] = c[i - 1] + 1; frames.push({ note: `left pass: rating ${r[i]} > left ${r[i - 1]} → ${c[i]} candies`, rows: [r, [...c]], tones: { [`1:${i}`]: "active", [`1:${i - 1}`]: "window" } }); }
      for (let i = n - 2; i >= 0; i--) if (r[i] > r[i + 1]) { const was = c[i]; c[i] = Math.max(c[i], c[i + 1] + 1); frames.push({ note: `right pass: rating ${r[i]} > right ${r[i + 1]} → max(${was}, ${c[i + 1]} + 1) = ${c[i]}`, rows: [r, [...c]], tones: { [`1:${i}`]: "active", [`1:${i + 1}`]: "window" } }); }
      const total = c.reduce((a, b) => a + b);
      frames.push({ note: `total ${c.join(" + ")} = ${total}`, rows: [r, [...c]], tones: range(0, n - 1, 1, "found") });
      return cells(`Candy: ${total}`, [r, Array(n).fill(1)], frames, ["rating", "candy"]);
    },
  },

  "task-scheduler": {
    approach: "The most frequent task sets the frame: (top - 1) blocks of n + 1 slots plus one slot per task tied for top; if tasks overflow that, no idle is needed and the answer is len(tasks).",
    idea: ["Copies of the most frequent task must be n + 1 apart, giving top - 1 full blocks and a final short block.", "The final block holds one slot for each task that also has the top count.", "Other tasks fill idle slots; if there are more than enough, every slot is busy and the length is just len(tasks)."],
    code: `from collections import Counter
def leastInterval(tasks, n):
    counts = Counter(tasks).values()
    top = max(counts)
    ties = sum(1 for c in counts if c == top)
    return max(len(tasks), (top - 1) * (n + 1) + ties)`,
    lang: "python", time: "O(len(tasks))", space: "O(1) (26 letters)",
    viz: () => {
      const tasks = "AAABBBC".split(""), n = 2, cnt: Record<string, number> = {}; tasks.forEach((t) => (cnt[t] = (cnt[t] || 0) + 1));
      const order = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]), top = cnt[order[0]], ties = order.filter((t) => cnt[t] === top).length;
      const grid: Cell[][] = Array.from({ length: top }, () => Array(n + 1).fill(null)), frames: TableFrame[] = [];
      frames.push({ note: `top count ${top} (task ${order[0]}): ${top - 1} blocks of ${n + 1} slots, then a last block`, cells: copy(grid) });
      let col = 0; const free: [number, number][] = [];
      for (const t of order) {
        if (cnt[t] === top) { for (let r = 0; r < top; r++) grid[r][col] = t; col++; frames.push({ note: `${t} appears ${top} times: one per block, column ${col - 1}`, cells: copy(grid), tones: tn(Array.from({ length: top }, (_, r) => `${r}:${col - 1}`), "active") }); continue; }
        if (!free.length) for (let c = col; c <= n; c++) for (let r = 0; r < top - 1; r++) free.push([r, c]);
        const used = free.splice(0, cnt[t]); used.forEach(([r, c]) => (grid[r][c] = t));
        frames.push({ note: `${t} (${cnt[t]}) fills idle slots`, cells: copy(grid), tones: tn(used.map(([r, c]) => `${r}:${c}`), "active") });
      }
      const idle: string[] = []; for (let r = 0; r < top - 1; r++) for (let c = 0; c <= n; c++) if (grid[r][c] == null) { grid[r][c] = "idle"; idle.push(`${r}:${c}`); }
      const ans = Math.max(tasks.length, (top - 1) * (n + 1) + ties);
      frames.push({ note: `(${top} - 1) × ${n + 1} + ${ties} tied = ${(top - 1) * (n + 1) + ties}, vs ${tasks.length} tasks → ${ans} slots`, cells: copy(grid), tones: tn(idle, "muted") });
      return table(`Tasks AAABBBC, n = ${n}: ${ans}`, heads(top, "block "), heads(n + 1, "slot "), frames);
    },
  },

  "reorganize-string": {
    approach: "Impossible if a letter needs more than half the slots; otherwise lay letters out by frequency, filling even positions first and then odd ones.",
    idea: ["A letter with count > ceil(n / 2) must touch itself somewhere, so return \"\".", "List letters from most to least frequent and write them into positions 0, 2, 4, ... then 1, 3, 5, ...", "The top letter fits entirely in even slots; any letter that wraps from evens to odds starts at slot 1, far from its last even slot."],
    code: `from collections import Counter
def reorganizeString(s):
    cnt = Counter(s)
    order = sorted(cnt, key=lambda ch: -cnt[ch])
    half = (len(s) + 1) // 2
    if cnt[order[0]] > half:
        return ""
    chars = [ch for ch in order for _ in range(cnt[ch])]
    out = [""] * len(s)
    out[::2], out[1::2] = chars[:half], chars[half:]
    return "".join(out)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const s = "aaabbc", n = s.length, cnt: Record<string, number> = {}; [...s].forEach((c) => (cnt[c] = (cnt[c] || 0) + 1));
      const chars = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).flatMap((c) => Array(cnt[c]).fill(c) as string[]), half = Math.ceil(n / 2), out: string[] = Array(n).fill(""), frames: CellsFrame[] = [];
      frames.push({ note: `most frequent '${chars[0]}' appears ${cnt[chars[0]]} ≤ ${half} times, so it is possible; letters by frequency: ${chars.join("")}`, rows: [[...out]] });
      chars.forEach((ch, k) => { const pos = k < half ? 2 * k : 2 * (k - half) + 1; out[pos] = ch; frames.push({ note: `'${ch}' → slot ${pos} (${k < half ? "even" : "odd"} slots)`, rows: [[...out]], tones: { [`0:${pos}`]: "active" } }); });
      frames.push({ note: `"${out.join("")}": no two neighbours match`, rows: [[...out]], tones: range(0, n - 1, 0, "found") });
      return cells(`"${s}" → "${out.join("")}"`, [out.map(() => "")], frames);
    },
  },

  "hand-of-straights": {
    approach: "Count cards; the smallest remaining card must start a group, so take k groups from it at once and subtract k from each of the next groupSize values.",
    idea: ["The smallest card x cannot be in the middle of a group, so it starts cnt[x] groups x, x + 1, ..., x + groupSize - 1.", "Each of those values must have at least cnt[x] cards left, or the answer is False.", "Process values in sorted order until all counts are used."],
    code: `from collections import Counter
def isNStraightHand(hand, groupSize):
    cnt = Counter(hand)
    for x in sorted(cnt):
        k = cnt[x]
        if k:
            for y in range(x, x + groupSize):
                if cnt[y] < k:
                    return False
                cnt[y] -= k
    return True`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const hand = [1, 2, 3, 6, 2, 3, 4, 7, 8], W = 3, vals = [...new Set(hand)].sort((a, b) => a - b), cnt = vals.map((v) => hand.filter((h) => h === v).length), frames: TableFrame[] = [];
      frames.push({ note: `counts of each card; groups of ${W} consecutive values`, cells: [[...cnt]] });
      let ok = true;
      for (let i = 0; i < vals.length && ok; i++) {
        const k = cnt[i]; if (!k) continue;
        const span = Array.from({ length: W }, (_, d) => vals.indexOf(vals[i] + d));
        if (span.some((j) => j < 0 || cnt[j] < k)) { ok = false; frames.push({ note: `${vals[i]} starts ${k} group${k === 1 ? "" : "s"}, but some value up to ${vals[i] + W - 1} has fewer than ${k} cards → false`, cells: [[...cnt]], tones: tn(span.filter((j) => j >= 0).map((j) => `0:${j}`), "bad") }); break; }
        span.forEach((j) => (cnt[j] -= k));
        frames.push({ note: `smallest card ${vals[i]} starts ${k} group${k === 1 ? "" : "s"} ${vals[i]}..${vals[i] + W - 1}; subtract ${k} from each`, cells: [[...cnt]], tones: tn(span.map((j) => `0:${j}`), "active") });
      }
      if (ok) frames.push({ note: "every card used in a straight → true", cells: [[...cnt]], tones: tn(vals.map((_, j) => `0:${j}`), "found") });
      return table(`Hand into groups of ${W}: ${ok}`, ["left"], vals.map(String), frames);
    },
  },

  "longest-mountain-in-array": {
    approach: "One pass counting the current uphill and downhill run lengths; reset when a flat step or a new climb after a descent starts.",
    idea: ["A mountain is a strict climb followed by a strict descent, each at least one step.", "up counts climbing steps, down counts descending steps of the current mountain.", "A climb after a descent or a flat step starts over; whenever both are positive, up + down + 1 is a mountain length."],
    code: `def longestMountain(arr):
    best = up = down = 0
    for i in range(1, len(arr)):
        if (down and arr[i] > arr[i - 1]) or arr[i] == arr[i - 1]:
            up = down = 0
        if arr[i] > arr[i - 1]:
            up += 1
        elif arr[i] < arr[i - 1]:
            down += 1
        if up and down:
            best = max(best, up + down + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 1, 4, 7, 3, 2, 5, 5, 6, 1], frames: CellsFrame[] = []; let best = 0, up = 0, down = 0, bestAt = [0, -1];
      for (let i = 1; i < a.length; i++) {
        let reset = ""; if ((down && a[i] > a[i - 1]) || a[i] === a[i - 1]) { up = down = 0; reset = a[i] === a[i - 1] ? "flat step, start over; " : "climbing again after a descent, start over; "; }
        if (a[i] > a[i - 1]) up++; else if (a[i] < a[i - 1]) down++;
        if (up && down && up + down + 1 > best) { best = up + down + 1; bestAt = [i - up - down, i]; }
        const s0 = i - up - down;
        frames.push({ note: `${a[i - 1]} → ${a[i]}: ${reset}up ${up}, down ${down}${up && down ? ` → mountain of ${up + down + 1}` : ""} (best ${best})`, tones: { ...(up || down ? range(s0, i, 0, up && down ? "found" : "window") : {}), [`0:${i}`]: "active" } });
      }
      frames.push({ note: `longest mountain ${best}`, tones: range(bestAt[0], bestAt[1], 0, "found") });
      return cells(`Longest mountain: ${best}`, [a], frames);
    },
  },

  "assign-cookies": {
    approach: "Sort both lists and give each cookie, smallest first, to the least greedy child it can satisfy.",
    idea: ["A small cookie is best spent on the least greedy child it satisfies; a bigger cookie would be wasted there.", "Sort greed g and sizes s.", "Walk the cookies; when a cookie meets the current child's greed, that child is content and the next child is up."],
    code: `def findContentChildren(g, s):
    g.sort()
    s.sort()
    child = 0
    for cookie in s:
        if child < len(g) and cookie >= g[child]:
            child += 1
    return child`,
    lang: "python", time: "O(n log n + m log m)", space: "O(1) extra",
    viz: () => {
      const g = [1, 2, 3, 4], s = [1, 1, 3, 5], frames: CellsFrame[] = [], happy: Record<string, Tone> = {}; let child = 0;
      s.forEach((c, j) => {
        const ok = child < g.length && c >= g[child];
        frames.push({ note: ok ? `cookie ${c} ≥ greed ${g[child]} → child ${child} is content` : `cookie ${c} < greed ${g[child]} → too small for anyone left, skip`, rows: [g, s], tones: { ...happy, [`1:${j}`]: ok ? "found" : "bad", ...(child < g.length ? { [`0:${child}`]: "active" } : {}) }, marks: [{ i: Math.min(child, g.length - 1), label: "child", row: 0 }, { i: j, label: "cookie", row: 1 }] });
        if (ok) { happy[`0:${child}`] = "found"; happy[`1:${j}`] = "done"; child++; }
      });
      frames.push({ note: `${child} content children`, rows: [g, s], tones: happy });
      return cells(`Content children: ${child}`, [g, s], frames, ["greed", "cookie"]);
    },
  },

  "two-city-scheduling": {
    approach: "Sort people by how much cheaper city A is than city B (aCost - bCost); send the first half to A and the rest to B.",
    idea: ["Imagine everyone flies to B, then n of them switch to A; switching person i changes the total by a - b.", "Pick the n most negative differences.", "So sort by a - b and send the first n to A."],
    code: `def twoCitySchedCost(costs):
    costs.sort(key=lambda c: c[0] - c[1])
    n = len(costs) // 2
    return sum(a for a, _ in costs[:n]) + sum(b for _, b in costs[n:])`,
    lang: "python", time: "O(n log n)", space: "O(1) extra",
    viz: () => {
      const costs = [[10, 20], [30, 200], [400, 50], [30, 20]].sort((x, y) => x[0] - x[1] - (y[0] - y[1])), n = costs.length / 2, rows: Cell[][] = costs.map(([a, b]) => [a, b, a - b, null]), frames: TableFrame[] = [];
      frames.push({ note: "sorted by A - B: the most negative gain the most from going to A", cells: copy(rows) });
      let total = 0;
      costs.forEach(([a, b], i) => { const A = i < n; total += A ? a : b; rows[i][3] = A ? "A" : "B"; frames.push({ note: `person ${i}: ${A ? `one of the ${n} best for A, pays ${a}` : `goes to B, pays ${b}`} → total ${total}`, cells: copy(rows), active: [i, A ? 0 : 1] }); });
      frames.push({ note: `minimum total ${total}`, cells: copy(rows), tones: tn(rows.map((r, i) => `${i}:${r[3] === "A" ? 0 : 1}`), "found") });
      return table(`Two cities: ${total}`, heads(costs.length, "p"), ["A", "B", "A - B", "city"], frames);
    },
  },

  "boats-to-save-people": {
    approach: "Sort, then pair the heaviest remaining person with the lightest if they fit; the heaviest always takes a boat.",
    idea: ["The heaviest person needs a boat no matter what.", "If the lightest person fits with them, pairing them is never worse; anyone else lighter would also fit but is heavier than the lightest.", "Two pointers from both ends, one boat per step."],
    code: `def numRescueBoats(people, limit):
    people.sort()
    i, j, boats = 0, len(people) - 1, 0
    while i <= j:
        if people[i] + people[j] <= limit:
            i += 1
        j -= 1
        boats += 1
    return boats`,
    lang: "python", time: "O(n log n)", space: "O(1) extra",
    viz: () => {
      const p = [3, 5, 3, 4, 1, 2].sort((a, b) => a - b), limit = 5, frames: CellsFrame[] = [], gone: Record<string, Tone> = {}; let i = 0, j = p.length - 1, boats = 0;
      while (i <= j) {
        const pair = i < j && p[i] + p[j] <= limit; boats++;
        frames.push({ note: i === j ? `${p[j]} is the last one → boat ${boats}` : pair ? `${p[i]} + ${p[j]} = ${p[i] + p[j]} ≤ ${limit} → share boat ${boats}` : `${p[i]} + ${p[j]} = ${p[i] + p[j]} > ${limit} → ${p[j]} goes alone in boat ${boats}`, tones: { ...gone, [`0:${j}`]: "active", ...(pair ? { [`0:${i}`]: "active" } : {}) }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
        gone[`0:${j}`] = "done"; if (pair) { gone[`0:${i}`] = "done"; i++; } j--;
      }
      frames.push({ note: `${boats} boats`, tones: gone });
      return cells(`Limit ${limit}: ${boats} boats`, [p], frames);
    },
  },
};
