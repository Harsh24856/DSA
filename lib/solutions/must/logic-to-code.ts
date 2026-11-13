// Solutions for the must-do "logic-to-code" questions that were new to the app (lib/patterns/overview/logic-to-code.problems.ts). See ../arrays.ts for the style.
import type { Diagram, TableFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

const heads = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const table = (title: string, R: number, C: number, frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead: heads(R), colHead: heads(C), frames });
const tonesOf = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "valid-sudoku": {
    approach: "One pass over the 81 cells with a set per row, per column and per 3 x 3 box; box index = (r // 3) * 3 + c // 3. A digit already in any of its three sets means invalid.",
    idea: ["Only the filled cells matter, and the board is valid when no row, column or box repeats a digit. Solvability is not asked.", "Give every row, column and box its own set of digits seen so far.", "Cell (r, c) belongs to box (r // 3) * 3 + c // 3: integer division by 3 picks the band of rows and the band of columns.", "For each digit, check its three sets first, then add it. Every check is O(1), and the board is fixed at 9 x 9."],
    code: `def isValidSudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    for r in range(9):
        for c in range(9):
            d = board[r][c]
            if d == ".":
                continue
            b = (r // 3) * 3 + c // 3
            if d in rows[r] or d in cols[c] or d in boxes[b]:
                return False
            rows[r].add(d)
            cols[c].add(d)
            boxes[b].add(d)
    return True`,
    lang: "python", time: "O(81) = O(1)", space: "O(81) = O(1)",
    viz: () => {
      const board = [["5", "3", ".", ".", "7", ".", ".", ".", "."], ["6", ".", ".", "1", "9", "5", ".", ".", "."], [".", "9", "8", ".", ".", ".", ".", "6", "."], ["8", ".", ".", ".", "6", ".", ".", ".", "3"], ["4", ".", ".", "8", ".", "3", ".", ".", "1"], ["7", ".", ".", ".", "2", ".", ".", ".", "6"], [".", "6", ".", ".", ".", ".", "2", "8", "."], [".", ".", ".", "4", "1", "9", ".", ".", "5"], [".", ".", ".", ".", "8", ".", ".", "7", "9"]];
      board[2][0] = "3";   // a repeat inside the top-left box
      const rows = board.map(() => new Set<string>()), cols = board.map(() => new Set<string>()), boxes = board.map(() => new Set<string>()), frames: TableFrame[] = [];
      const cells = board.map((r) => r.map((x) => (x === "." ? "" : x)));
      frames.push({ note: "Check every filled cell against a set for its row, its column and its box. Box = (r // 3) * 3 + c // 3", cells });
      let checked = 0;
      outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const d = board[r][c]; if (d === ".") continue;
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3), clash = rows[r].has(d) ? "row" : cols[c].has(d) ? "column" : boxes[b].has(d) ? "box" : "";
        checked++;
        const inBox = tonesOf(board.flatMap((row, i) => row.map((_, j) => [`${i}:${j}`, (Math.floor(i / 3) * 3 + Math.floor(j / 3) === b ? "window" : "muted")] as [string, Tone])).filter(([, t]) => t === "window"));
        if (clash) {
          const other = board.flatMap((row, i) => row.map((x, j) => [i, j, x] as const)).find(([i, j, x]) => x === d && (i !== r || j !== c) && (clash === "row" ? i === r : clash === "column" ? j === c : Math.floor(i / 3) * 3 + Math.floor(j / 3) === b))!;
          frames.push({ note: `(${r}, ${c}) = ${d}, box ${b}: ${d} is already in this ${clash}, at (${other[0]}, ${other[1]}). Return false`, cells, active: [r, c], tones: { ...inBox, [`${r}:${c}`]: "bad", [`${other[0]}:${other[1]}`]: "bad" } });
          break outer;
        }
        rows[r].add(d); cols[c].add(d); boxes[b].add(d);
        if (checked <= 4 || r === 2) frames.push({ note: `(${r}, ${c}) = ${d} goes to box (${r} // 3) * 3 + ${c} // 3 = ${b}. Not in row ${r}, column ${c} or box ${b} yet, so add it to all three`, cells, active: [r, c], tones: { ...inBox, [`${r}:${c}`]: "found" } });
      }
      frames.push({ note: `${checked} cells were checked before the repeat showed up. Each check is three set lookups, so the whole board is 81 steps at most`, cells });
      return table("isValidSudoku = false", 9, 9, frames);
    },
  },

  "spiral-matrix-ii": {
    approach: "Fill 1 to n² while walking the spiral with four bounds: top row left to right, right column down, bottom row right to left, left column up, then pull each bound in.",
    idea: ["The walk is the same as Spiral Matrix, but it writes a counter instead of reading values.", "Keep top, bottom, left and right as inclusive bounds. After filling a side, move that bound one step inward.", "A square grid never leaves a single row or column that both inner loops would fill twice, but the same checks as Spiral Matrix keep the code safe for any shape.", "Each cell is written exactly once, so the counter ends at n²."],
    code: `def generateMatrix(n):
    g = [[0] * n for _ in range(n)]
    top, bottom, left, right = 0, n - 1, 0, n - 1
    k = 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            g[top][c] = k
            k += 1
        top += 1
        for r in range(top, bottom + 1):
            g[r][right] = k
            k += 1
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                g[bottom][c] = k
                k += 1
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                g[r][left] = k
                k += 1
            left += 1
    return g`,
    lang: "python", time: "O(n²)", space: "O(1) besides the output",
    viz: () => {
      const n = 4, g: (number | string)[][] = Array.from({ length: n }, () => Array(n).fill("")), frames: TableFrame[] = [];
      let top = 0, bottom = n - 1, left = 0, right = n - 1, k = 1;
      const side = (cs: [number, number][], what: string) => {
        if (!cs.length) return;
        for (const [r, c] of cs) g[r][c] = k++;
        frames.push({ note: `${what}: write ${k - cs.length} to ${k - 1}. Bounds top ${top}, bottom ${bottom}, left ${left}, right ${right}`, cells: g.map((r) => [...r]), active: cs[cs.length - 1], tones: tonesOf(cs.map(([r, c]) => [`${r}:${c}`, "found"] as [string, Tone])) });
      };
      frames.push({ note: `An empty ${n} x ${n} grid. Write 1 to ${n * n} along the spiral, shrinking four bounds as each side is filled`, cells: g.map((r) => [...r]) });
      while (top <= bottom && left <= right) {
        const a: [number, number][] = []; for (let c = left; c <= right; c++) a.push([top, c]); top++; side(a, "Top row, left to right");
        const b: [number, number][] = []; for (let r = top; r <= bottom; r++) b.push([r, right]); right--; side(b, "Right column, downward");
        if (top <= bottom) { const x: [number, number][] = []; for (let c = right; c >= left; c--) x.push([bottom, c]); bottom--; side(x, "Bottom row, right to left"); }
        if (left <= right) { const y: [number, number][] = []; for (let r = bottom; r >= top; r--) y.push([r, left]); left++; side(y, "Left column, upward"); }
      }
      frames.push({ note: `The bounds crossed after writing ${k - 1} = ${n}² cells, each once`, cells: g.map((r) => [...r]), tones: tonesOf(g.flatMap((row, r) => row.map((_, c) => [`${r}:${c}`, "done"] as [string, Tone]))) });
      return table(`generateMatrix(${n})`, n, n, frames);
    },
  },

  "robot-bounded-in-circle": {
    approach: "Run the instructions once: the robot stays in a circle exactly when it is back at the origin or no longer faces north.",
    idea: ["Simulate one pass with a direction index into (north, east, south, west): G adds that direction, L and R change the index.", "If the robot ends at the origin, repeating the pass keeps it there forever.", "If it ends elsewhere but faces a new direction, each later pass is the same displacement rotated by that turn. After 2 passes (a half turn) or 4 passes (a quarter turn) the rotated displacements cancel, so it comes back.", "Only when it ends away from the origin and still faces north does every pass push it the same way, so it leaves any circle."],
    code: `def isRobotBounded(instructions):
    dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    x = y = d = 0
    for ch in instructions:
        if ch == "G":
            x, y = x + dirs[d][0], y + dirs[d][1]
        elif ch == "L":
            d = (d + 3) % 4
        else:
            d = (d + 1) % 4
    return (x, y) == (0, 0) or d != 0`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const ins = "GGL", N = 5, o = 2, DX = [0, 1, 0, -1], DY = [1, 0, -1, 0], ARROW = ["^", ">", "v", "<"], frames: TableFrame[] = [], trail = new Set<string>();
      let x = 0, y = 0, d = 0;
      const cell = (): [number, number] => [o - y, o + x];
      const grid = () => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (r === o - y && c === o + x ? ARROW[d] : r === o && c === o ? "O" : "")));
      const tones = () => ({ ...tonesOf([...trail].map((k) => [k, "done"] as [string, Tone])), [`${o}:${o}`]: "window" as Tone, [`${o - y}:${o + x}`]: "active" as Tone });
      trail.add(`${o}:${o}`);
      frames.push({ note: `Instructions "${ins}". The robot starts at the origin O facing north. Run them once, then look at where it ends and which way it faces`, cells: grid(), tones: tones(), active: cell() });
      for (let pass = 1; pass <= 4; pass++) {
        for (const ch of ins) {
          if (ch === "G") { x += DX[d]; y += DY[d]; trail.add(`${o - y}:${o + x}`); } else d = ch === "L" ? (d + 3) % 4 : (d + 1) % 4;
        }
        const note = pass === 1
          ? `After one pass: at (${x}, ${y}) facing ${["north", "east", "south", "west"][d]}. ${x || y ? "Not at the origin" : "At the origin"}, ${d ? "but it turned, so the answer is already true" : "and still facing north"}. The next passes show why`
          : `Pass ${pass}: the same moves, rotated by the turn. Now at (${x}, ${y}) facing ${["north", "east", "south", "west"][d]}${x === 0 && y === 0 ? ": back at the origin" : ""}`;
        frames.push({ note, cells: grid(), tones: tones(), active: cell() });
      }
      frames.push({ note: "After 4 passes a robot that turned is always home, so it never leaves a circle around the origin: isRobotBounded = true", cells: grid(), tones: tones(), active: cell() });
      return table(`isRobotBounded("${ins}") = true`, N, N, frames);
    },
  },

  "walking-robot-simulation": {
    approach: "Simulate unit steps with a direction index; obstacles go in a hash set so each step checks the next cell in O(1), and track the largest x² + y² seen.",
    idea: ["The robot starts at (0, 0) facing north. -2 turns left, -1 turns right, and k moves k unit steps.", "A move must be done one unit at a time, because an obstacle can stop it partway. Before each unit step, check whether the next cell is an obstacle; if so, stop this command.", "Store obstacles as a set of (x, y) pairs, so the check is O(1).", "The answer is the largest squared distance at any moment, not the final one, so update it after every command."],
    code: `def robotSim(commands, obstacles):
    blocked = set(map(tuple, obstacles))
    dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    x = y = d = best = 0
    for cmd in commands:
        if cmd == -2:
            d = (d + 3) % 4
        elif cmd == -1:
            d = (d + 1) % 4
        else:
            dx, dy = dirs[d]
            for _ in range(cmd):
                if (x + dx, y + dy) in blocked:
                    break
                x, y = x + dx, y + dy
            best = max(best, x * x + y * y)
    return best`,
    lang: "python", time: "O(n + total steps), at most 9 steps per command", space: "O(number of obstacles)",
    viz: () => {
      const commands = [4, -1, 4, -2, 4], blocked = new Set(["2,4"]), N = 9, W = 4, DX = [0, 1, 0, -1], DY = [1, 0, -1, 0], ARROW = ["^", ">", "v", "<"], frames: TableFrame[] = [], trail = new Set<string>();
      let x = 0, y = 0, d = 0, best = 0;
      const key = (a: number, b: number) => `${N - 1 - b}:${a}`;   // y grows upward on screen
      const grid = () => Array.from({ length: N }, (_, r) => Array.from({ length: W }, (_, c) => (N - 1 - r === y && c === x ? ARROW[d] : blocked.has(`${c},${N - 1 - r}`) ? "#" : "")));
      const tones = () => ({ ...tonesOf([...trail].map((k) => [k, "done"] as [string, Tone])), [key(2, 4)]: "bad" as Tone, [key(x, y)]: "active" as Tone });
      trail.add(key(0, 0));
      frames.push({ note: "Start at (0, 0), bottom left, facing north. # is the obstacle at (2, 4). Commands [4, -1, 4, -2, 4]", cells: grid(), tones: tones(), active: [N - 1 - y, x] });
      for (const cmd of commands) {
        if (cmd < 0) { d = cmd === -2 ? (d + 3) % 4 : (d + 1) % 4; frames.push({ note: `${cmd}: turn ${cmd === -2 ? "left" : "right"}, now facing ${["north", "east", "south", "west"][d]}`, cells: grid(), tones: tones(), active: [N - 1 - y, x] }); continue; }
        let moved = 0, stop = false;
        for (let s = 0; s < cmd; s++) { if (blocked.has(`${x + DX[d]},${y + DY[d]}`)) { stop = true; break; } x += DX[d]; y += DY[d]; trail.add(key(x, y)); moved++; }
        best = Math.max(best, x * x + y * y);
        frames.push({ note: `${cmd}: ${stop ? `moved ${moved}, then the next cell (${x + DX[d]}, ${y + DY[d]}) is an obstacle, so stop` : `moved ${moved} steps`}. At (${x}, ${y}), distance² ${x * x + y * y}, best ${best}`, cells: grid(), tones: { ...tones(), ...(stop ? { [key(x + DX[d], y + DY[d])]: "bad" as Tone } : {}) }, active: [N - 1 - y, x] });
      }
      frames.push({ note: `All commands done. The largest squared distance reached was ${best}`, cells: grid(), tones: tones(), active: [N - 1 - y, x] });
      return { kind: "table", title: `robotSim = ${best}`, rowHead: Array.from({ length: N }, (_, r) => `y=${N - 1 - r}`), colHead: Array.from({ length: W }, (_, c) => `x=${c}`), frames };
    },
  },
};
