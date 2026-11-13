// Overview of the "logic-to-code" topic: the data structure or technique itself. Shown on /patterns/logic-to-code before the patterns.
import type { Diagram, TableFrame, Tone } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

const tonesOf = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;
const heads = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const table = (title: string, R: number, C: number, frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead: heads(R), colHead: heads(C), frames });

/** Spiral order with four shrinking bounds; every cell is visited exactly once. */
function spiralViz(R: number, C: number): Diagram {
  const g = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => r * C + c + 1));
  const frames: TableFrame[] = [], seen: [number, number][] = [];
  const done = () => tonesOf(seen.map(([r, c]) => [`${r}:${c}`, "done"] as [string, Tone]));
  let top = 0, bottom = R - 1, left = 0, right = C - 1;
  frames.push({ note: `A ${R} x ${C} grid. Keep four bounds: top ${top}, bottom ${bottom}, left ${left}, right ${right}. Walk the outer ring clockwise, then pull the bounds in`, cells: g });
  const side = (cellsOf: [number, number][], what: string) => {
    if (!cellsOf.length) return;
    seen.push(...cellsOf);
    frames.push({ note: `${what}: ${cellsOf.map(([r, c]) => g[r][c]).join(", ")}. Bounds now top ${top}, bottom ${bottom}, left ${left}, right ${right}`, cells: g, tones: { ...done(), ...tonesOf(cellsOf.map(([r, c]) => [`${r}:${c}`, "found"] as [string, Tone])) }, active: cellsOf[cellsOf.length - 1] });
  };
  while (top <= bottom && left <= right) {
    const a: [number, number][] = []; for (let c = left; c <= right; c++) a.push([top, c]); top++;
    side(a, `Row ${top - 1}, left to right, then top moves down`);
    const b: [number, number][] = []; for (let r = top; r <= bottom; r++) b.push([r, right]); right--;
    side(b, `Column ${right + 1}, top to bottom, then right moves left`);
    if (top <= bottom) { const x: [number, number][] = []; for (let c = right; c >= left; c--) x.push([bottom, c]); bottom--; side(x, `Row ${bottom + 1}, right to left (only because top <= bottom still), then bottom moves up`); }
    if (left <= right) { const y: [number, number][] = []; for (let r = bottom; r >= top; r--) y.push([r, left]); left++; side(y, `Column ${left - 1}, bottom to top (only because left <= right still), then left moves right`); }
  }
  frames.push({ note: `The bounds crossed, so every one of the ${R * C} cells was taken exactly once. The two checks inside the loop are what stop a single middle row or column being read twice`, cells: g, tones: done() });
  return table(`spiral order of ${R} x ${C}`, R, C, frames);
}

/** A robot on a grid driven by a direction index into DIRS4; turning is index arithmetic, a step adds the direction. */
function robotViz(cmds: string, N = 5): Diagram {
  const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1], ARROW = ["^", ">", "v", "<"], NAME = ["up", "right", "down", "left"];
  const frames: TableFrame[] = [], seen = new Set<string>();
  let r = N - 1, c = 0, d = 0;
  const grid = () => Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === r && j === c ? ARROW[d] : "")));
  const tones = () => ({ ...tonesOf([...seen].map((k) => [k, "done"] as [string, Tone])), [`${r}:${c}`]: "active" as Tone });
  seen.add(`${r}:${c}`);
  frames.push({ note: `Start at (${r}, ${c}) facing up, d = 0. DIRS4 = up, right, down, left, so a step adds (DR[d], DC[d]) and a turn only changes d`, cells: grid(), tones: tones(), active: [r, c] });
  for (const k of cmds) {
    if (k === "L" || k === "R") {
      const old = d; d = k === "R" ? (d + 1) % 4 : (d + 3) % 4;
      frames.push({ note: `'${k}': d = (${old} ${k === "R" ? "+ 1" : "+ 3"}) mod 4 = ${d}, now facing ${NAME[d]}${k === "L" ? ". Adding 3 instead of subtracting 1 keeps the index from going negative" : ""}`, cells: grid(), tones: tones(), active: [r, c] });
    } else {
      const nr = r + DR[d], nc = c + DC[d];
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) { frames.push({ note: `'G': (${nr}, ${nc}) is off the ${N} x ${N} grid, so the bounds check keeps the robot where it is`, cells: grid(), tones: { ...tones(), [`${r}:${c}`]: "bad" }, active: [r, c] }); continue; }
      r = nr; c = nc; seen.add(`${r}:${c}`);
      frames.push({ note: `'G': (${r - DR[d]}, ${c - DC[d]}) + (${DR[d]}, ${DC[d]}) = (${r}, ${c})`, cells: grid(), tones: tones(), active: [r, c] });
    }
  }
  frames.push({ note: `Done: the robot is at (${r}, ${c}) facing ${NAME[d]}, after visiting ${seen.size} cells. No if-chain for the four directions was needed`, cells: grid(), tones: tones(), active: [r, c] });
  return table(`robot "${cmds}"`, N, N, frames);
}

/** Rotate a square grid 90 degrees clockwise in place: transpose (swap across the diagonal), then reverse each row. */
function rotateViz(n: number): Diagram {
  const g = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1)), frames: TableFrame[] = [];
  const snap = () => g.map((row) => [...row]);
  frames.push({ note: `Rotate this ${n} x ${n} grid clockwise in place. Cell (r, c) must end at (c, ${n - 1} - r): do it as a transpose, then a mirror`, cells: snap() });
  for (let i = 0; i < n; i++) {
    const pairs: [number, number][] = [];
    for (let j = i + 1; j < n; j++) { [g[i][j], g[j][i]] = [g[j][i], g[i][j]]; pairs.push([i, j]); }
    if (pairs.length) frames.push({ note: `Transpose row ${i}: swap (${i}, j) with (j, ${i}) for j > ${i}. Only cells above the diagonal start a swap, or each pair would swap back`, cells: snap(), tones: tonesOf(pairs.flatMap(([a, b]) => [[`${a}:${b}`, "found"], [`${b}:${a}`, "active"]] as [string, Tone][]).concat([...Array(n)].map((_, k) => [`${k}:${k}`, "muted"] as [string, Tone]))) });
  }
  frames.push({ note: "The transpose is done: rows became columns. The diagonal never moved", cells: snap(), tones: tonesOf([...Array(n)].map((_, k) => [`${k}:${k}`, "muted"] as [string, Tone])) });
  for (let i = 0; i < n; i++) {
    g[i].reverse();
    frames.push({ note: `Reverse row ${i} with two pointers`, cells: snap(), tones: tonesOf(g[i].map((_, c) => [`${i}:${c}`, "found"] as [string, Tone])), active: [i, 0] });
  }
  frames.push({ note: `Rotated. The old top row 1 to ${n} is now the right column, read top to bottom. O(n²) time and O(1) extra space`, cells: snap(), tones: tonesOf(g.map((_, r) => [`${r}:${n - 1}`, "window"] as [string, Tone])) });
  return table(`rotate ${n} x ${n} clockwise`, n, n, frames);
}

export const OVERVIEW: TopicOverview = {
  what: [
    "**Logic to code** is the skill of turning a described process into a program. The statement tells you exactly what happens: a robot moves, a game is played, an image is rotated, a matrix is printed in a spiral. There is usually no clever trick. What is tested is whether you can model the process precisely and write it without off-by-one errors.",
    "Every simulation has a **state** and a **step**. The state is everything that describes the world at one moment: a position and a facing, a grid, a queue of players, a clock. The step is the rule that turns one state into the next. Write the state down as variables before any code, then write one function or loop body that applies a single step, and repeat it until the stop condition holds.",
    "Most of these problems live on a **grid**, a 2D array. `grid[r][c]` is row `r` counted from the top and column `c` counted from the left; `R = len(grid)` and `C = len(grid[0])`. In memory the rows are laid out one after another (**row-major**), so cell `(r, c)` is index `r * C + c` of the flat array, and index `i` is cell `(i // C, i % C)`. Mixing up `(x, y)` with `(r, c)` is the classic bug: x is the column, y is the row.",
    "Positions along the same **diagonal** share `r - c`; along the same **anti-diagonal** they share `r + c`. A ring or **layer** of a square grid is the set of cells at the same distance from the border, `min(r, c, n - 1 - r, n - 1 - c)`. Rotating by 90 degrees sends `(r, c)` to `(c, n - 1 - r)`, which is the same as a **transpose** followed by reversing every row.",
    "A **direction array** replaces a chain of four if-statements. Keep `DR = [-1, 0, 1, 0]` and `DC = [0, 1, 0, -1]` in clockwise order (up, right, down, left); then a step is `r += DR[d], c += DC[d]`, turning right is `d = (d + 1) % 4`, turning left is `(d + 3) % 4`, and turning around is `(d + 2) % 4`. Eight entries cover king moves, and a table of eight `(±1, ±2)` pairs covers knight moves.",
    "Two traps decide most of these problems. **Off-by-one**: choose inclusive bounds (`top..bottom`) or half-open ranges (`[l, r)`) and keep them, and test the shapes 1 x 1, 1 x n and n x 1. **Simultaneous updates**: when every cell's next value depends on the current values of its neighbours (Game of Life), writing into the same grid lets later cells read already updated neighbours. Build the next state in a new grid, or encode old and new in the same cell.",
    "Vocabulary: **state**, **step**, **simulation**, **row-major**, **in place**, **bounds**, **direction vector**, **transpose**, **layer** (ring), **period** (a state that repeats), **invariant** (what stays true after every step).",
  ],
  build: [
    "Start from the state. Name each variable and what it means, for example `r, c` the robot's cell, `d` its facing index into `DIRS4`, `blocked` a set of obstacle cells. Then write the rules from the statement one by one as code that changes those variables, and keep the loop that drives them separate from the rules.",
    "Keep boundaries in variables, not in your head. A helper `in_bounds(r, c)` keeps every neighbour check short. For a spiral, keep `top, bottom, left, right`; after reading one side, move that bound in by one. The bottom row and the left column must only be read if `top <= bottom` and `left <= right` still hold, or a single remaining row or column is read twice.",
    "Use a direction index plus arrays for movement. Obstacles go in a hash set of `(r, c)` pairs (or `r * C + c` keys) so each check is O(1). A move of k steps is k single steps when obstacles can stop it partway.",
    "For transformations of the whole grid, prefer a composition of simple passes that are easy to get right: rotate clockwise = transpose, then reverse each row; rotate counter-clockwise = transpose, then reverse each column (or reverse the rows first). Each pass is a short double loop, and each one is easy to check on a 3 x 3 example.",
    "When the number of steps is huge (10^9 rounds), do not simulate them all. Look for a repeated state: store each state in a hash map with the step at which it was seen, and when one repeats, skip ahead by whole periods with `steps % period`. Robot Bounded In Circle uses the same idea in its simplest form: after four passes the robot is either back at the start or gone for good.",
  ],
  code: String.raw`# A grid toolkit: the small pieces most "simulate this process" problems are built from.
DIRS4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]           # up, right, down, left: clockwise order
DIRS8 = DIRS4 + [(-1, -1), (-1, 1), (1, 1), (1, -1)]  # plus the four diagonals


def make_grid(R, C, fill=0):
    return [[fill] * C for _ in range(R)]             # never [[fill] * C] * R: that shares one row


def in_bounds(r, c, R, C):
    return 0 <= r < R and 0 <= c < C


def neighbours(r, c, R, C, dirs=DIRS4):
    for dr, dc in dirs:
        nr, nc = r + dr, c + dc
        if in_bounds(nr, nc, R, C):
            yield nr, nc


def to_index(r, c, C):
    return r * C + c                                  # row-major: row r starts at r * C


def from_index(i, C):
    return divmod(i, C)                               # (row, column)


def spiral_order(grid):
    """Peel the outer ring clockwise, then shrink the four bounds."""
    out = []
    top, bottom, left, right = 0, len(grid) - 1, 0, len(grid[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(grid[top][c])
        top += 1
        for r in range(top, bottom + 1):
            out.append(grid[r][right])
        right -= 1
        if top <= bottom:                             # a row is still left
            for c in range(right, left - 1, -1):
                out.append(grid[bottom][c])
            bottom -= 1
        if left <= right:                             # a column is still left
            for r in range(bottom, top - 1, -1):
                out.append(grid[r][left])
            left += 1
    return out


def rotate_clockwise(grid):
    """In place for a square grid: transpose, then reverse every row."""
    n = len(grid)
    for i in range(n):
        for j in range(i + 1, n):
            grid[i][j], grid[j][i] = grid[j][i], grid[i][j]
    for row in grid:
        row.reverse()
    return grid


def walk(commands, start=(0, 0), facing=0):
    """A robot on a plane: 'L' and 'R' turn by moving the direction index, 'G' steps once."""
    r, c, d = start[0], start[1], facing
    for cmd in commands:
        if cmd == "L":
            d = (d + 3) % 4                           # one step counter-clockwise in DIRS4
        elif cmd == "R":
            d = (d + 1) % 4
        else:
            r, c = r + DIRS4[d][0], c + DIRS4[d][1]
    return r, c, d


def step(grid, rule):
    """One round of a simulation: every new cell is computed from the OLD grid only."""
    R, C = len(grid), len(grid[0])
    new = make_grid(R, C)
    for r in range(R):
        for c in range(C):
            live = sum(grid[nr][nc] for nr, nc in neighbours(r, c, R, C, DIRS8))
            new[r][c] = rule(grid[r][c], live)
    return new`,
  ops: [
    {
      title: "Grid and matrix (R rows, C columns)",
      rows: [
        ["Read or write grid[r][c]", "O(1)", "O(1)", "a 2D array index"],
        ["Bounds check", "O(1)", "O(1)", "0 <= r < R and 0 <= c < C"],
        ["Visit the 4 or 8 neighbours of a cell", "O(1)", "O(1)", "a fixed number of directions"],
        ["Flat index to (r, c) and back", "O(1)", "O(1)", "r * C + c, and divmod(i, C)"],
        ["Traverse every cell", "O(R C)", "O(R C)", "row by row is the cache-friendly order"],
        ["Spiral, diagonal or zigzag order", "O(R C)", "O(R C)", "each cell is visited exactly once"],
        ["Transpose", "O(R C)", "O(R C)", "in place only for a square grid; otherwise build C x R"],
        ["Rotate 90 degrees (n x n)", "O(n²)", "O(n²)", "transpose then reverse rows, O(1) extra space"],
        ["Flip left-right or top-bottom", "O(R C)", "O(R C)", "reverse each row, or reverse the row order"],
        ["Copy the grid", "O(R C)", "O(R C)", "needed when the next state reads the old one"],
        ["Mark rows and columns (Set Matrix Zeroes)", "O(R C)", "O(R C)", "O(1) extra if row 0 and column 0 hold the marks"],
        ["Sort every diagonal", "O(R C log min(R, C))", "O(R C log min(R, C))", "group by r - c, sort each group"],
        ["One step of Game of Life", "O(R C)", "O(R C)", "8 neighbours per cell"],
        ["Flood fill or BFS from one cell", "O(R C)", "O(R C)", "each cell enters the queue at most once"],
        ["2D prefix sums", "O(R C) build", "O(1) per rectangle", "inclusion and exclusion of four corners"],
      ],
    },
    {
      title: "Simulation",
      rows: [
        ["One step over n items", "O(n)", "O(n)", "apply the rule to each item"],
        ["T steps", "O(T n)", "O(T n)", "fine for small T; for huge T find a period or a formula"],
        ["Robot with k commands", "O(k)", "O(k)", "a turn is index arithmetic, a step is one addition"],
        ["Robot with obstacles, k unit moves", "O(k)", "O(k)", "obstacles in a hash set: O(1) per check"],
        ["Find a repeated state", "O(steps)", "O(steps)", "hash each state; the first repeat gives the period"],
        ["Circular index (i + k) mod n", "O(1)", "O(1)", "in C++ add n before the mod when k can be negative"],
        ["Round robin with a queue (n players, k skips)", "O(n k)", "O(n k)", "the Josephus formula answers it in O(n)"],
        ["Events processed in time order", "O(n log n)", "O(n log n)", "sort the events, or keep them in a heap"],
      ],
    },
  ],
  builtins: [
    ["2D grid", "`vector<vector<int>> g(R, vector<int>(C, 0))`", "`[[0] * C for _ in range(R)]`"],
    ["Direction arrays", "`int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};`", "`DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]`"],
    ["Transpose", "nested loops with `swap(g[i][j], g[j][i])`", "`[list(r) for r in zip(*g)]`"],
    ["Rotate clockwise", "transpose, then `reverse(row.begin(), row.end())`", "`[list(r) for r in zip(*g[::-1])]`"],
    ["Reverse a row or the row order", "`reverse(row.begin(), row.end())`, `reverse(g.begin(), g.end())`", "`row.reverse()`, `g.reverse()`"],
    ["Copy a grid", "`auto copy = g;` (a deep copy)", "`[row[:] for row in g]`"],
    ["Flat index", "`r * C + c`, `i / C`, `i % C`", "`r * C + c`, `divmod(i, C)`"],
    ["Wrap-around index", "`((i % n) + n) % n`", "`i % n` (never negative in Python)"],
    ["Set of visited cells", "`set<pair<int, int>>` or `unordered_set<long long>` of `r * C + c`", "`set()` of `(r, c)` tuples"],
    ["Group cells by diagonal", "`map<int, vector<int>>` keyed by `r - c`", "`defaultdict(list)` keyed by `r - c`"],
    ["Queue for a process", "`queue<int>`, `deque<int>`", "`collections.deque`"],
    ["Grid given as strings", "`vector<string>` is already mutable", "`[list(row) for row in rows]`, since str is immutable"],
  ],
  when: [
    "The statement describes a process step by step (\"each turn\", \"the robot moves\", \"repeat until\"): simulate it with an explicit state.",
    "\"Matrix\", \"board\", \"image\", \"grid\": a 2D array with `grid[r][c]`, bounds checks and direction arrays.",
    "\"Spiral\", \"diagonal\", \"zigzag\", \"layer by layer\": an index pattern; write the bounds or the r - c / r + c rule first.",
    "\"Rotate\", \"transpose\", \"flip\", \"in place\": compose transpose and reverse passes.",
    "\"North, south, east, west\", \"turn left\", \"turn right\": a direction index with `(d + 1) % 4` and `(d + 3) % 4`.",
    "\"All cells change at the same time\", \"based on the current state\": compute into a new grid or encode two states per cell.",
    "Small constraints (n up to 100, few rounds) with lots of rules: a direct simulation is the intended solution.",
  ],
  avoid: [
    "Fewest moves or steps from a start to a goal on a grid: BFS, not a hand-written simulation of every path.",
    "The process makes choices (pick the best move each time): it is greedy or DP; prove the choice or search all of them.",
    "Billions of rounds: find the period of the state or a closed formula; plain simulation will time out.",
    "Connected regions of a grid (islands, groups): DFS, BFS or union-find, which visit each cell once.",
  ],
  tips: [
    "Restate the rules in your own words and run them by hand on the example before coding. Most bugs here come from a misread rule, not from code.",
    "Name the state variables out loud and keep them few. A position, a facing and a grid are usually all you need.",
    "Pick inclusive or half-open bounds once and say which. Test 1 x 1, 1 x n and n x 1 grids, and the empty input.",
    "`(x, y)` is (column, row). Convert to `(r, c)` at the start and never mix them again.",
    "In C++, `-1 % 4` is -1. Turn left with `(d + 3) % 4`, not `(d - 1) % 4`.",
    "Never update a grid in place when the rule reads neighbours from the same round; use a copy or encode old and new in the bits of one cell.",
    "In Python, `[[0] * C] * R` repeats one row R times; changing one cell changes the whole column.",
    "If the step count is huge, say up front that you will look for a cycle, and store the step when each state was first seen.",
  ],
  viz: [
    { name: "Spiral order with four bounds", make: (i) => { const [a, b] = nums(i, [4, 5], 2).map((x) => Math.max(3, Math.min(6, Math.round(x)))); return spiralViz(a, b ?? a); }, input: "4, 5", label: "rows, columns (3 to 6)" },
    { name: "Robot with a direction array", make: (i) => { const s = (i ?? "").toUpperCase().replace(/[^LRG]/g, "").slice(0, 14); return robotViz(s.length >= 5 ? s : "GGRGGRGLLGGG"); }, input: "GGRGGRGLLGGG", label: "commands: G step, L left, R right" },
    { name: "Rotate by transpose and reverse", make: (i) => rotateViz(Math.max(3, Math.min(5, Math.round(nums(i, [4], 1)[0])))), input: "4", label: "grid size (3 to 5)" },
  ],
};
