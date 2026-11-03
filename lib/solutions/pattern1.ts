// Hand-written solutions for the slugs listed under "pattern1" in batches.json (questions from the pattern practice lists). See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, IntervalsFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { diffArray, kadane, levelTree, topK, treeTraversal, monoDeque, range, variableWindow, type TNode } from "../sim.ts";
import type { Solution } from "./types";

type V = (number | null)[];
const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const blank = (n: number) => Array<string | number>(n).fill("");
const table = (title: string, rowHead: string[], colHead: string[], frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead, colHead, frames });
const nums = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const tones = (keys: string[], tone: Tone) => Object.fromEntries(keys.map((k) => [k, tone])) as Record<string, Tone>;
/** Lower-bound binary search (first index with a[i] >= t), recording each halving. */
function lowerBound(a: number[], t: number, frames: CellsFrame[], what = `first index with value ≥ ${t}`) {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1, right = a[mid] < t;
    frames.push({ note: `Looking for the ${what}: mid ${mid} holds ${a[mid]} ${right ? `< ${t} → lo = ${mid + 1}` : `≥ ${t} → hi = ${mid}`}`, tones: { ...range(lo, hi - 1, 0), ...range(0, lo - 1, 0, "muted"), ...range(hi, a.length - 1, 0, "muted"), [`0:${mid}`]: "active" }, marks: [{ i: lo, label: "lo" }, { i: mid, label: "mid" }] });
    if (right) lo = mid + 1; else hi = mid;
  }
  return lo;
}
/** Binary-search view: [lo, hi] stays in play, everything else is muted, mid is highlighted. */
const span = (lo: number, hi: number, n: number, mid: number, tone: Tone = "active"): Record<string, Tone> => ({ ...range(lo, hi, 0), ...range(0, lo - 1, 0, "muted"), ...range(hi + 1, n - 1, 0, "muted"), [`0:${mid}`]: tone });
const lmh = (lo: number, mid: number, hi: number) => [{ i: lo, label: "lo" }, { i: mid, label: "mid" }, { i: hi, label: "hi" }];
/** Tree helpers over heap-indexed arrays: node id = index, children at 2i+1 and 2i+2. */
function T(vals: V) {
  const { nodes, kids } = levelTree(vals);
  const val = (i: number) => vals[i] as number;
  return { nodes, kids, val };
}
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
/** Accumulate tones across frames so visited nodes stay marked. */
function trail(frames: TreeFrame[], keep: Tone = "done"): TreeFrame[] {
  const seen: Record<number, Tone> = {};
  return frames.map((f) => { const out = { ...f, tones: { ...seen, ...f.tones } }; Object.keys(f.tones || {}).forEach((k) => { if (f.tones![+k] !== "muted") seen[+k] = f.tones![+k] === "found" ? "found" : keep; }); return out; });
}

export const PATTERN1: Record<string, Solution> = {
  "pascals-triangle": {
    approach: "Build row by row: each row starts and ends with 1, and every inner number is the sum of the two numbers above it.",
    idea: ["Row 0 is [1].", "Row r has r + 1 numbers; the ends are 1.", "Inner entry c of row r is row[r-1][c-1] + row[r-1][c], so pairing the previous row with itself shifted by one gives all inner values."],
    code: `def generate(numRows):
    rows = [[1]]
    for _ in range(numRows - 1):
        prev = rows[-1]
        rows.append([1] + [a + b for a, b in zip(prev, prev[1:])] + [1])
    return rows`,
    lang: "python", time: "O(n²)", space: "O(n²) for the output",
    viz: () => {
      const n = 5, g: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null)), frames: TableFrame[] = [], snap = () => g.map((r) => [...r]);
      for (let r = 0; r < n; r++) {
        g[r][0] = g[r][r] = 1;
        frames.push({ note: r === 0 ? "Row 0 is [1]" : `Row ${r}: both ends are 1`, cells: snap(), tones: { [`${r}:0`]: "found", [`${r}:${r}`]: "found" } });
        for (let c = 1; c < r; c++) {
          g[r][c] = g[r - 1][c - 1]! + g[r - 1][c]!;
          frames.push({ note: `Row ${r}, position ${c} = ${g[r - 1][c - 1]} + ${g[r - 1][c]} = ${g[r][c]} (the two numbers above)`, cells: snap(), active: [r, c], deps: [[r - 1, c - 1], [r - 1, c]] });
        }
      }
      return table(`generate(5): last row [${g[n - 1].join(", ")}]`, nums(n), nums(n), frames);
    },
  },

  "diagonal-traverse": {
    approach: "Cells on one anti-diagonal share i + j; walk d = 0 .. m + n - 2 and read each diagonal upward on even d, downward on odd d.",
    idea: ["Every cell (i, j) belongs to diagonal d = i + j.", "For a fixed d, i runs from max(0, d - n + 1) to min(d, m - 1).", "Even diagonals go up-right (largest i first), odd ones go down-left (smallest i first)."],
    code: `def findDiagonalOrder(mat):
    m, n = len(mat), len(mat[0])
    out = []
    for d in range(m + n - 1):
        diag = [mat[i][d - i] for i in range(max(0, d - n + 1), min(d, m - 1) + 1)]
        out += diag[::-1] if d % 2 == 0 else diag
    return out`,
    lang: "python", time: "O(m·n)", space: "O(1) besides the output",
    viz: () => {
      const m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], R = 3, C = 3, out: number[] = [], seen: Record<string, Tone> = {}, frames: TableFrame[] = [];
      for (let d = 0; d < R + C - 1; d++) {
        const cs: [number, number][] = [];
        for (let i = Math.max(0, d - C + 1); i <= Math.min(d, R - 1); i++) cs.push([i, d - i]);
        if (d % 2 === 0) cs.reverse();
        cs.forEach(([i, j]) => { out.push(m[i][j]); frames.push({ note: `Diagonal ${d} (i + j = ${d}) goes ${d % 2 ? "down-left" : "up-right"}: take ${m[i][j]} → [${out.join(", ")}]`, cells: m, active: [i, j], tones: { ...seen } }); seen[`${i}:${j}`] = "done"; });
      }
      return table(`Diagonal order: [${out.join(", ")}]`, nums(R), nums(C), frames);
    },
  },

  "set-matrix-zeroes": {
    approach: "Use row 0 and column 0 as marker storage: first remember whether they hold a zero themselves, then mark, then fill.",
    idea: ["Check once whether row 0 and column 0 contain a zero; save those two flags.", "For every inner zero at (i, j), set matrix[i][0] and matrix[0][j] to 0 as markers.", "Zero every inner cell whose row marker or column marker is 0.", "Finally zero row 0 and column 0 if their flags were set. O(1) extra space."],
    code: `def setZeroes(matrix):
    m, n = len(matrix), len(matrix[0])
    first_row = any(v == 0 for v in matrix[0])
    first_col = any(matrix[i][0] == 0 for i in range(m))
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][j] == 0:
                matrix[i][0] = matrix[0][j] = 0
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][0] == 0 or matrix[0][j] == 0:
                matrix[i][j] = 0
    if first_row:
        for j in range(n):
            matrix[0][j] = 0
    if first_col:
        for i in range(m):
            matrix[i][0] = 0`,
    lang: "python", time: "O(m·n)", space: "O(1)",
    viz: () => {
      const g = [[1, 2, 3, 4], [0, 5, 6, 7], [8, 9, 0, 10], [11, 12, 13, 14]], R = 4, C = 4, frames: TableFrame[] = [], snap = () => g.map((r) => [...r]);
      const fr = g[0].includes(0), fc = g.some((r) => r[0] === 0), row0 = nums(C).map((j) => `0:${j}`), col0 = nums(R).map((i) => `${i}:0`);
      frames.push({ note: "Goal: every 0 zeroes its whole row and column with no extra matrix. Row 0 and column 0 will hold the markers", cells: snap() });
      frames.push({ note: `Check row 0 first: it ${fr ? "contains a zero" : "has no zero"}, so first_row = ${fr ? "True" : "False"}`, cells: snap(), tones: tones(row0, fr ? "bad" : "window") });
      frames.push({ note: `Check column 0 next: ${fc ? `row ${g.findIndex((r) => r[0] === 0)} has a zero in it` : "no zero found"}, so first_col = ${fc ? "True" : "False"}`, cells: snap(), tones: tones(col0, fc ? "bad" : "window") });
      for (let i = 1; i < R; i++) {
        const zs: number[] = []; for (let j = 1; j < C; j++) if (g[i][j] === 0) zs.push(j);
        zs.forEach((j) => { g[i][0] = 0; g[0][j] = 0; });
        frames.push({ note: zs.length ? `Scan row ${i}: inner zero at column ${zs.join(", ")}, so write 0 into (${i}, 0) and (0, ${zs.join("), (0, ")})` : `Scan row ${i}: no inner zero, nothing to mark`, cells: snap(), tones: zs.length ? { ...tones(zs.map((j) => `${i}:${j}`), "active"), [`${i}:0`]: "bad", ...tones(zs.map((j) => `0:${j}`), "bad") } : { [`${i}:0`]: "muted" } });
      }
      for (let i = 1; i < R; i++) {
        const cols = nums(C).slice(1).filter((j) => g[0][+j] === 0), rowMark = g[i][0] === 0, hit: string[] = [];
        for (let j = 1; j < C; j++) if (rowMark || g[0][j] === 0) { g[i][j] = 0; hit.push(`${i}:${j}`); }
        frames.push({ note: rowMark ? `Fill row ${i}: its marker (${i}, 0) is 0, so all ${C - 1} inner cells become 0` : cols.length ? `Fill row ${i}: its own marker is not 0, but column marker${cols.length > 1 ? "s" : ""} ${cols.join(", ")} in row 0 ${cols.length > 1 ? "are" : "is"} 0, so zero ${hit.length} cell${hit.length > 1 ? "s" : ""}` : `Fill row ${i}: no marker applies, the row stays`, cells: snap(), tones: { ...tones(hit, "bad"), [`${i}:0`]: "window" } });
      }
      if (fr) { for (let j = 0; j < C; j++) g[0][j] = 0; frames.push({ note: "first_row is True, so zero all of row 0", cells: snap(), tones: tones(row0, "bad") }); }
      if (fc) { for (let i = 0; i < R; i++) g[i][0] = 0; frames.push({ note: "first_col is True, so zero all of column 0", cells: snap(), tones: tones(col0, "bad") }); }
      const zeros = g.flatMap((r, i) => r.map((v, j) => (v === 0 ? `${i}:${j}` : ""))).filter(Boolean);
      frames.push({ note: `Done: ${zeros.length} cells are 0, the full rows and columns of the original zeros`, cells: snap(), tones: tones(zeros, "found") });
      return table("Set matrix zeroes with O(1) extra space", nums(R), nums(C), frames);
    },
  },

  "next-greater-element-i": {
    approach: "Scan nums2 with a decreasing stack; when a bigger value arrives, it is the next greater element of everything it pops. Then look up nums1.",
    idea: ["The stack holds values still waiting for something bigger, in decreasing order.", "A new value x pops every smaller value on top: x is their answer.", "Values never popped have no greater element to their right, so they map to -1."],
    code: `def nextGreaterElement(nums1, nums2):
    nxt, stack = {}, []
    for x in nums2:
        while stack and stack[-1] < x:
            nxt[stack.pop()] = x
        stack.append(x)
    return [nxt.get(x, -1) for x in nums1]`,
    lang: "python", time: "O(n + m)", space: "O(m)",
    viz: () => {
      const n1 = [3, 1, 5, 2], n2 = [2, 4, 1, 3, 5], st: number[] = [], nxt: Record<number, number> = {}, frames: StackFrame[] = [];
      const side = () => `next greater: ${Object.entries(nxt).map(([k, v]) => `${k}→${v}`).join(", ") || "none yet"}`;
      frames.push({ note: `Goal: for each of [${n1.join(", ")}] find the next bigger value to its right inside [${n2.join(", ")}]. The stack holds values still waiting for a bigger one`, items: [], side: side() });
      n2.forEach((x) => {
        while (st.length && st[st.length - 1] < x) { const y = st.pop()!; nxt[y] = x; frames.push({ note: `${x} is bigger than the top ${y}: pop ${y}, its next greater element is ${x}`, items: [...st], incoming: x, popped: [y], side: side() }); }
        const top = st[st.length - 1]; st.push(x);
        frames.push({ note: top === undefined ? `The stack is empty, so push ${x}` : `The top ${top} is not smaller than ${x}, so push ${x}`, items: [...st], incoming: x, side: side() });
      });
      const out = n1.map((x) => nxt[x] ?? -1);
      frames.push({ note: `Still on the stack (${st.join(", ")}): nothing bigger to the right, so -1. Answer for [${n1.join(", ")}] is [${out.join(", ")}]`, items: [...st], side: side() });
      return { kind: "stack", title: `nextGreaterElement([${n1}], [${n2}]) = [${out.join(", ")}]`, input: n2, frames };
    },
  },

  "spiral-matrix": {
    approach: "Keep four walls (top, bottom, left, right); peel the top row, right column, bottom row and left column, moving each wall inward.",
    idea: ["Walk the top row left to right, then move top down.", "Walk the right column top to bottom, then move right in.", "If rows remain, walk the bottom row right to left; if columns remain, walk the left column bottom to top.", "Repeat until the walls cross."],
    code: `def spiralOrder(matrix):
    out = []
    top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for j in range(left, right + 1):
            out.append(matrix[top][j])
        top += 1
        for i in range(top, bottom + 1):
            out.append(matrix[i][right])
        right -= 1
        if top <= bottom:
            for j in range(right, left - 1, -1):
                out.append(matrix[bottom][j])
            bottom -= 1
        if left <= right:
            for i in range(bottom, top - 1, -1):
                out.append(matrix[i][left])
            left += 1
    return out`,
    lang: "python", time: "O(m·n)", space: "O(1) besides the output",
    viz: () => {
      const R = 5, C = 4, m = Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => i * C + j + 1)), out: number[] = [], seen: Record<string, Tone> = {}, frames: TableFrame[] = [{ note: `Goal: read the ${R} by ${C} matrix in a spiral. Four walls (top, bottom, left, right) close in after each side`, cells: m }];
      let top = 0, bottom = R - 1, left = 0, right = C - 1;
      const side = (name: string, cs: [number, number][]) => {
        if (!cs.length) return;
        cs.forEach(([i, j]) => out.push(m[i][j]));
        frames.push({ note: `${name}: ${cs.map(([i, j]) => m[i][j]).join(", ")} → walls top ${top}, bottom ${bottom}, left ${left}, right ${right}`, cells: m, tones: { ...seen, ...tones(cs.map(([i, j]) => `${i}:${j}`), "active") } });
        cs.forEach(([i, j]) => (seen[`${i}:${j}`] = "done"));
      };
      while (top <= bottom && left <= right) {
        let cs: [number, number][] = [];
        for (let j = left; j <= right; j++) cs.push([top, j]);
        top++; side(`Top row (row ${top - 1}) left to right`, cs); cs = [];
        for (let i = top; i <= bottom; i++) cs.push([i, right]);
        right--; side(`Right column (column ${right + 1}) downward`, cs); cs = [];
        if (top <= bottom) { for (let j = right; j >= left; j--) cs.push([bottom, j]); bottom--; side(`Bottom row (row ${bottom + 1}) right to left`, cs); cs = []; }
        if (left <= right) { for (let i = bottom; i >= top; i--) cs.push([i, left]); left++; side(`Left column (column ${left - 1}) upward`, cs); }
      }
      frames.push({ note: `The walls crossed, so every cell is read: [${out.join(", ")}]`, cells: m, tones: tones(m.flatMap((r, i) => r.map((_, j) => `${i}:${j}`)), "found") });
      return table(`Spiral order of a ${R} by ${C} matrix`, nums(R), nums(C), frames);
    },
  },

  "rotate-image": {
    approach: "Rotate 90° clockwise in place: transpose (swap across the main diagonal), then reverse every row.",
    idea: ["Transposing moves (i, j) to (j, i).", "Reversing a row then moves (j, i) to (j, n - 1 - i), which is exactly where a clockwise turn sends (i, j).", "Both steps swap in place, so no second matrix is needed."],
    code: `def rotate(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()`,
    lang: "python", time: "O(n²)", space: "O(1)",
    viz: () => {
      const g = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], n = 3, frames: TableFrame[] = [], snap = () => g.map((r) => [...r]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        [g[i][j], g[j][i]] = [g[j][i], g[i][j]];
        frames.push({ note: `Transpose: swap (${i}, ${j}) with (${j}, ${i}) → ${g[i][j]} and ${g[j][i]} trade places`, cells: snap(), tones: { [`${i}:${j}`]: "active", [`${j}:${i}`]: "active" } });
      }
      g.forEach((row, i) => { row.reverse(); frames.push({ note: `Reverse row ${i} → [${row.join(", ")}]`, cells: snap(), tones: tones(nums(n).map((j) => `${i}:${j}`), "found") }); });
      return table("Rotate 90° clockwise: transpose, then reverse rows", nums(n), nums(n), frames);
    },
  },

  "roman-to-integer": {
    approach: "Add each symbol's value, except subtract it when the next symbol is larger (IV, IX, XL, XC, CD, CM).",
    idea: ["Roman numerals are written largest to smallest.", "A smaller symbol before a larger one means subtraction, so it counts as negative.", "One left-to-right pass with a one-symbol look-ahead is enough."],
    code: `def romanToInt(s):
    val = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, ch in enumerate(s):
        if i + 1 < len(s) and val[ch] < val[s[i + 1]]:
            total -= val[ch]
        else:
            total += val[ch]
    return total`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "MCMXCIV", V: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }, ch = s.split(""), vals = ch.map((c) => V[c]), run = blank(ch.length), frames: CellsFrame[] = []; let total = 0;
      ch.forEach((c, i) => {
        const sub = i + 1 < ch.length && vals[i] < vals[i + 1];
        total += sub ? -vals[i] : vals[i]; run[i] = total;
        frames.push({ note: sub ? `${c} (${vals[i]}) is before the larger ${ch[i + 1]} (${vals[i + 1]}) → subtract: total ${total}` : `${c} (${vals[i]}) → add: total ${total}`, rows: [ch, vals, [...run]], tones: { [`0:${i}`]: "active", [`1:${i}`]: sub ? "bad" : "found", ...(sub ? { [`0:${i + 1}`]: "window" } : {}) } });
      });
      return cells(`romanToInt("${s}") = ${total}`, [ch, vals, blank(ch.length)], frames, ["symbol", "value", "total"]);
    },
  },

  "count-and-say": {
    approach: "Start from \"1\" and apply run-length encoding n - 1 times: each run of equal digits becomes its length followed by the digit.",
    idea: ["Term 1 is \"1\".", "To get the next term, read the current one aloud: split it into runs of the same digit.", "Each run of k copies of d becomes the text k then d."],
    code: `def countAndSay(n):
    s = "1"
    for _ in range(n - 1):
        out, i = [], 0
        while i < len(s):
            j = i
            while j < len(s) and s[j] == s[i]:
                j += 1
            out.append(str(j - i) + s[i])
            i = j
        s = "".join(out)
    return s`,
    lang: "python", time: "O(total length of all terms)", space: "O(length of the term)",
    viz: () => {
      const n = 6, frames: CellsFrame[] = []; let s = "1";
      for (let k = 1; k < n; k++) {
        const runs: [string, number, number][] = []; let i = 0;
        while (i < s.length) { let j = i; while (j < s.length && s[j] === s[i]) j++; runs.push([s[i], i, j - i]); i = j; }
        const next = runs.map(([d, , c]) => `${c}${d}`).join(""), t: Record<string, Tone> = {};
        runs.forEach(([, at, c], r) => { for (let x = at; x < at + c; x++) t[`0:${x}`] = r % 2 ? "found" : "window"; });
        frames.push({ note: `Term ${k} "${s}" reads as ${runs.map(([d, , c]) => `${c} × ${d}`).join(", ")} → term ${k + 1} = "${next}"`, rows: [s.split("")], tones: t });
        s = next;
      }
      frames.push({ note: `countAndSay(${n}) = "${s}"`, rows: [s.split("")], tones: range(0, s.length - 1, 0, "done") });
      return cells(`countAndSay(${n}) = "${s}"`, [["1"]], frames);
    },
  },

  "reverse-words-in-a-string": {
    approach: "Split on whitespace (which drops the extra spaces), reverse the word list, and join with single spaces.",
    idea: ["str.split() with no argument splits on runs of spaces and ignores leading and trailing ones.", "Reversing the list of words reverses the word order, not the letters.", "Joining with one space gives the cleaned result. (In place, the same thing is two-pointer swaps of words.)"],
    code: `def reverseWords(s):
    return " ".join(reversed(s.split()))`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = " the  sky is blue ", tok = s.split(" "), shown = tok.map((t) => t || "∅"), N = tok.length, words: string[] = [], frames: CellsFrame[] = [];
      const rows = () => [shown, [...words, ...Array<string>(N - words.length).fill("")]];
      frames.push({ note: `Input "${s}" has extra spaces. Goal: the words in reverse order, joined by single spaces`, rows: rows() });
      frames.push({ note: `Split on spaces: ${N} pieces, and ∅ marks an empty piece left by a leading, doubled or trailing space`, rows: rows(), tones: tones(tok.map((t, i) => (t ? "" : `0:${i}`)).filter(Boolean), "bad") });
      tok.forEach((t, i) => {
        if (t) words.push(t);
        frames.push({ note: t ? `Piece ${i} is "${t}", a real word: keep it (${words.length} kept)` : `Piece ${i} is empty (extra space): drop it`, rows: rows(), tones: { [`0:${i}`]: t ? "found" : "muted", ...(t ? { [`1:${words.length - 1}`]: "found" } : {}) } });
      });
      for (let l = 0, r = words.length - 1; l < r; l++, r--) { [words[l], words[r]] = [words[r], words[l]]; frames.push({ note: `Swap word ${l} and word ${r} → [${words.join(", ")}]`, rows: rows(), tones: { [`1:${l}`]: "active", [`1:${r}`]: "active" }, marks: [{ i: l, label: "L", row: 1 }, { i: r, label: "R", row: 1 }] }); }
      frames.push({ note: `Join with single spaces → "${words.join(" ")}"`, rows: rows(), tones: range(0, words.length - 1, 1, "found") });
      return cells(`reverseWords("${s}") = "${words.join(" ")}"`, [shown, blank(N)], frames, ["pieces", "words"]);
    },
  },

  "range-sum-query-immutable": {
    approach: "Precompute prefix sums once; each sumRange(l, r) is pre[r + 1] - pre[l] in O(1).",
    idea: ["pre[i] is the sum of the first i numbers, with pre[0] = 0.", "The sum of nums[l..r] is everything up to r minus everything before l.", "The array never changes, so the O(n) build pays off over many queries."],
    code: `class NumArray:
    def __init__(self, nums):
        self.pre = [0]
        for x in nums:
            self.pre.append(self.pre[-1] + x)

    def sumRange(self, left, right):
        return self.pre[right + 1] - self.pre[left]`,
    lang: "python", time: "O(n) build, O(1) per query", space: "O(n)",
    viz: () => {
      const a = [-2, 0, 3, -5, 2, -1], P = [0], pre: (string | number)[] = [0, ...blank(a.length)], frames: CellsFrame[] = [];
      a.forEach((x, i) => { P.push(P[i] + x); pre[i + 1] = P[i + 1]; frames.push({ note: `pre[${i + 1}] = pre[${i}] + nums[${i}] = ${P[i]} + ${x} = ${P[i + 1]}`, rows: [a, [...pre]], tones: { [`0:${i}`]: "active", [`1:${i + 1}`]: "found" } }); });
      for (const [l, r] of [[0, 2], [2, 5], [0, 5]]) frames.push({ note: `sumRange(${l}, ${r}) = pre[${r + 1}] - pre[${l}] = ${P[r + 1]} - ${P[l]} = ${P[r + 1] - P[l]}`, rows: [a, pre], tones: { ...range(l, r, 0), [`1:${r + 1}`]: "found", [`1:${l}`]: "bad" } });
      return cells("NumArray([-2,0,3,-5,2,-1]): prefix sums", [a, [0, ...blank(a.length)]], frames, ["nums", "pre"]);
    },
  },
  "subarray-sum-equals-k": {
    approach: "Running prefix sum plus a hash map of how often each prefix appeared; a subarray ending here sums to k when prefix - k was seen before.",
    idea: ["sum(nums[i..j]) = pre[j + 1] - pre[i], so it equals k exactly when an earlier prefix equals run - k.", "Count prefixes in a dictionary, starting with {0: 1} for the empty prefix.", "At each element add the count of run - k, then record run. Negative numbers are fine, unlike a sliding window."],
    code: `from collections import defaultdict
def subarraySum(nums, k):
    seen = defaultdict(int)
    seen[0] = 1
    run = count = 0
    for x in nums:
        run += x
        count += seen[run - k]
        seen[run] += 1
    return count`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 4, 7, 2, -3, 1, 4, 2], k = 7, pre = blank(a.length), seen = new Map<number, number>([[0, 1]]), frames: CellsFrame[] = [{ note: `Goal: count subarrays of [${a.join(", ")}] that sum to ${k}. Keep a running prefix sum and a map of prefixes seen so far, starting with {0: 1}`, rows: [a, [...pre]] }]; let run = 0, count = 0;
      a.forEach((x, i) => {
        run += x; pre[i] = run; const hit = seen.get(run - k) ?? 0; count += hit; seen.set(run, (seen.get(run) ?? 0) + 1);
        frames.push({ note: `Add ${x}: prefix is ${run}. An earlier prefix of ${run} - ${k} = ${run - k} was seen ${hit} time${hit === 1 ? "" : "s"}, so count ${hit ? `grows to ${count}` : `stays ${count}`}. Map {${[...seen].map(([p, c]) => `${p}: ${c}`).join(", ")}}`, rows: [a, [...pre]], tones: { [`0:${i}`]: "active", [`1:${i}`]: hit ? "found" : "window" } });
      });
      frames.push({ note: `All elements read: ${count} subarrays sum to ${k}`, rows: [a, [...pre]], tones: range(0, a.length - 1, 1, "found") });
      return cells(`subarraySum([${a.join(",")}], ${k}) = ${count}`, [a, blank(a.length)], frames, ["nums", "prefix"]);
    },
  },

  "product-of-array-except-self": {
    approach: "Two passes without division: first store the product of everything to the left, then multiply in the product of everything to the right.",
    idea: ["answer[i] = (product of nums[0..i-1]) × (product of nums[i+1..]).", "Left to right, write the running left product into answer[i] before including nums[i].", "Right to left, multiply answer[i] by the running right product. The output array is the only extra storage."],
    code: `def productExceptSelf(nums):
    n = len(nums)
    out = [1] * n
    left = 1
    for i in range(n):
        out[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= nums[i]
    return out`,
    lang: "python", time: "O(n)", space: "O(1) besides the output",
    viz: () => {
      const a = [1, 2, 3, 4], n = a.length, out = Array(n).fill(1), frames: CellsFrame[] = []; let left = 1, right = 1;
      for (let i = 0; i < n; i++) { out[i] = left; frames.push({ note: `Left pass i=${i}: product of everything left of it = ${left}`, rows: [a, [...out]], tones: { ...range(0, i - 1, 0), [`1:${i}`]: "active" } }); left *= a[i]; }
      for (let i = n - 1; i >= 0; i--) { out[i] *= right; frames.push({ note: `Right pass i=${i}: multiply by product right of it (${right}) → ${out[i]}`, rows: [a, [...out]], tones: { ...range(i + 1, n - 1, 0), [`1:${i}`]: "found" } }); right *= a[i]; }
      return cells(`productExceptSelf([1,2,3,4]) = [${out.join(", ")}]`, [a, Array(n).fill(1)], frames, ["nums", "answer"]);
    },
  },

  "continuous-subarray-sum": {
    approach: "Track prefix sums mod k and the first index each remainder appeared; the same remainder twice, at least two apart, means a multiple of k between them.",
    idea: ["If pre[j] % k == pre[i] % k, then nums[i+1..j] sums to a multiple of k.", "Store only the first index for each remainder (start with {0: -1}) to get the longest gap.", "Return True as soon as a repeat is at least 2 positions away."],
    code: `def checkSubarraySum(nums, k):
    first = {0: -1}
    run = 0
    for i, x in enumerate(nums):
        run = (run + x) % k
        if run in first:
            if i - first[run] >= 2:
                return True
        else:
            first[run] = i
    return False`,
    lang: "python", time: "O(n)", space: "O(min(n, k))",
    viz: () => {
      const a = [4, 6, 3, 8, 5, 1], k = 6, mod = blank(a.length), first = new Map<number, number>([[0, -1]]), frames: CellsFrame[] = [{ note: `Goal: is there a subarray of length 2 or more whose sum is a multiple of ${k}? Track prefix sum mod ${k} and the first index of each remainder`, rows: [a, [...mod]] }]; let run = 0, ans = false;
      for (let i = 0; i < a.length && !ans; i++) {
        run = (run + a[i]) % k; mod[i] = run;
        const at = first.get(run);
        if (at === undefined) { first.set(run, i); frames.push({ note: `i = ${i}: prefix mod ${k} = ${run}, a new remainder, so remember index ${i}`, rows: [a, [...mod]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "window" } }); }
        else if (i - at >= 2) { ans = true; const seg = a.slice(at + 1, i + 1); frames.push({ note: `i = ${i}: remainder ${run} was first seen at index ${at}, so nums[${at + 1}..${i}] = ${seg.join(" + ")} = ${seg.reduce((x, y) => x + y, 0)}, a multiple of ${k}. Return True`, rows: [a, [...mod]], tones: { ...range(at + 1, i, 0, "found"), [`1:${i}`]: "found", ...(at >= 0 ? { [`1:${at}`]: "found" } : {}) } }); }
        else frames.push({ note: `i = ${i}: remainder ${run} was seen at index ${at}, but the gap is only 1 element, which is too short. Keep the older index`, rows: [a, [...mod]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "bad", [`1:${at}`]: "bad" } });
      }
      return cells(`checkSubarraySum([${a.join(",")}], ${k}) = ${ans ? "True" : "False"}`, [a, blank(a.length)], frames, ["nums", "pre % k"]);
    },
  },

  "find-pivot-index": {
    approach: "Keep the left sum while scanning; the right sum is total - left - nums[i], so the first index where they match is the pivot.",
    idea: ["Compute the total once.", "At index i, left is the sum before it and right = total - left - nums[i].", "Return the first i with left == right, else -1."],
    code: `def pivotIndex(nums):
    total, left = sum(nums), 0
    for i, x in enumerate(nums):
        if left == total - left - x:
            return i
        left += x
    return -1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [3, 1, 5, 2, 2, 4, 6, 1], total = a.reduce((x, y) => x + y, 0), L = blank(a.length), Rt = blank(a.length), frames: CellsFrame[] = [{ note: `Goal: an index where the sum on its left equals the sum on its right. The total of all numbers is ${total}`, rows: [a, [...L], [...Rt]] }]; let left = 0, ans = -1;
      for (let i = 0; i < a.length; i++) {
        const right = total - left - a[i], ok = left === right; L[i] = left; Rt[i] = right;
        frames.push({ note: `i = ${i}: left = ${left}, right = ${total} - ${left} - ${a[i]} = ${right}${ok ? `. They are equal, so ${i} is the pivot` : left < right ? ", the left side is lighter, keep going" : ", the left side is already heavier"}`, rows: [a, [...L], [...Rt]], tones: { ...range(0, i - 1, 0), ...range(i + 1, a.length - 1, 0, "muted"), [`0:${i}`]: ok ? "found" : "active", [`1:${i}`]: ok ? "found" : "window", [`2:${i}`]: ok ? "found" : "window" }, marks: [{ i, label: "i" }] });
        if (ok) { ans = i; break; }
        left += a[i];
      }
      return cells(`pivotIndex([${a.join(",")}]) = ${ans}`, [a, blank(a.length), blank(a.length)], frames, ["nums", "left", "right"]);
    },
  },

  "range-sum-query-2d-immutable": {
    approach: "Build a 2D prefix table P where P[i][j] is the sum of the top-left i × j block; any rectangle is then four lookups.",
    idea: ["P[i+1][j+1] = matrix[i][j] + P[i][j+1] + P[i+1][j] - P[i][j] (the top-left overlap was added twice).", "A query rectangle = P[bottom-right] - P[above it] - P[left of it] + P[the corner removed twice].", "Build is O(m·n) once, every query O(1)."],
    code: `class NumMatrix:
    def __init__(self, matrix):
        m, n = len(matrix), len(matrix[0])
        self.P = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m):
            for j in range(n):
                self.P[i + 1][j + 1] = matrix[i][j] + self.P[i][j + 1] + self.P[i + 1][j] - self.P[i][j]

    def sumRegion(self, row1, col1, row2, col2):
        P = self.P
        return P[row2 + 1][col2 + 1] - P[row1][col2 + 1] - P[row2 + 1][col1] + P[row1][col1]`,
    lang: "python", time: "O(m·n) build, O(1) per query", space: "O(m·n)",
    viz: () => {
      const m = [[3, 0, 1], [5, 6, 3], [1, 2, 0]], R = 3, C = 3, P: (number | null)[][] = Array.from({ length: R + 1 }, (_, i) => Array.from({ length: C + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null))), frames: TableFrame[] = [], snap = () => P.map((r) => [...r]);
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        P[i + 1][j + 1] = m[i][j] + P[i][j + 1]! + P[i + 1][j]! - P[i][j]!;
        frames.push({ note: `P[${i + 1}][${j + 1}] = matrix ${m[i][j]} + up ${P[i][j + 1]} + left ${P[i + 1][j]} - corner ${P[i][j]} = ${P[i + 1][j + 1]}`, cells: snap(), active: [i + 1, j + 1], deps: [[i, j + 1], [i + 1, j], [i, j]] });
      }
      const [r1, c1, r2, c2] = [1, 1, 2, 2], ans = P[r2 + 1][c2 + 1]! - P[r1][c2 + 1]! - P[r2 + 1][c1]! + P[r1][c1]!;
      frames.push({ note: `sumRegion(1, 1, 2, 2) = P[3][3] ${P[3][3]} - P[1][3] ${P[1][3]} - P[3][1] ${P[3][1]} + P[1][1] ${P[1][1]} = ${ans} (6 + 3 + 2 + 0)`, cells: snap(), tones: { [`${r2 + 1}:${c2 + 1}`]: "found", [`${r1}:${c2 + 1}`]: "bad", [`${r2 + 1}:${c1}`]: "bad", [`${r1}:${c1}`]: "window" } });
      return table("NumMatrix: 2D prefix sums (row/col 0 are the empty border)", nums(R + 1), nums(C + 1), frames);
    },
  },

  "majority-element": {
    approach: "Boyer-Moore voting: keep one candidate and a counter; matching values add a vote, others cancel one, and a zero counter picks a new candidate.",
    idea: ["Pair each majority element with a different element and cancel both; since it appears more than n/2 times, some copies survive.", "count == 0 means everything so far cancelled out, so take the current value as the new candidate.", "The candidate left at the end is the majority (guaranteed to exist)."],
    code: `def majorityElement(nums):
    cand, count = None, 0
    for x in nums:
        if count == 0:
            cand = x
        count += 1 if x == cand else -1
    return cand`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 2, 1, 1, 1, 2, 2], cand = blank(a.length), cnt = blank(a.length), frames: CellsFrame[] = []; let c = 0, count = 0;
      a.forEach((x, i) => {
        const fresh = count === 0; if (fresh) c = x; count += x === c ? 1 : -1; cand[i] = c; cnt[i] = count;
        frames.push({ note: `${fresh ? `Counter was 0 → new candidate ${x}. ` : ""}${x} ${x === c ? "matches, +1" : `differs from ${c}, -1`} → count ${count}`, rows: [a, [...cand], [...cnt]], tones: { [`0:${i}`]: "active", [`1:${i}`]: fresh ? "found" : "window" } });
      });
      return cells(`Majority element: ${c}`, [a, blank(a.length), blank(a.length)], frames, ["nums", "cand", "count"]);
    },
  },

  "contains-duplicate": {
    approach: "Scan with a hash set; the first value already in the set is a duplicate.",
    idea: ["A set answers 'seen before?' in O(1) on average.", "Return True at the first repeat; reaching the end means all values are distinct."],
    code: `def containsDuplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [4, 9, 1, 7, 3, 8, 9, 2], seen = new Set<number>(), frames: CellsFrame[] = [{ note: `Goal: does [${a.join(", ")}] repeat a value? Scan left to right with a set of values seen so far`, tones: {} }]; let ans = false;
      for (let i = 0; i < a.length; i++) {
        if (seen.has(a[i])) { ans = true; frames.push({ note: `${a[i]} is already in the set {${[...seen].join(", ")}}, first seen at index ${a.indexOf(a[i])}. Return True`, tones: { [`0:${i}`]: "found", [`0:${a.indexOf(a[i])}`]: "found" }, marks: [{ i, label: "i" }] }); break; }
        seen.add(a[i]); frames.push({ note: `${a[i]} is not in the set, so add it: {${[...seen].join(", ")}}`, tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }] });
      }
      return cells(`containsDuplicate([${a.join(",")}]) = ${ans ? "True" : "False"}`, [a], frames);
    },
  },

  "longest-consecutive-sequence": {
    approach: "Put everything in a set and only start counting from values whose predecessor is missing; each run is walked once.",
    idea: ["x starts a run exactly when x - 1 is not in the set.", "From a start, step x + 1, x + 2, ... while present.", "Every value is visited by at most one run walk, so the total work is O(n)."],
    code: `def longestConsecutive(nums):
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:
            y = x
            while y + 1 in s:
                y += 1
            best = max(best, y - x + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [100, 4, 200, 1, 3, 2], s = new Set(a), frames: CellsFrame[] = []; let best = 0;
      a.forEach((x, i) => {
        if (s.has(x - 1)) { frames.push({ note: `${x}: ${x - 1} is present, so ${x} is not a run start; skip`, tones: { [`0:${i}`]: "muted" } }); return; }
        let y = x; while (s.has(y + 1)) y++; best = Math.max(best, y - x + 1);
        const run = a.map((v, j) => [v, j] as const).filter(([v]) => v >= x && v <= y).map(([, j]) => `0:${j}`);
        frames.push({ note: `${x}: no ${x - 1}, so start a run: ${Array.from({ length: y - x + 1 }, (_, k) => x + k).join(", ")} (length ${y - x + 1}, best ${best})`, tones: { ...tones(run, "window"), [`0:${i}`]: "found" } });
      });
      return cells(`longestConsecutive = ${best}`, [a], frames);
    },
  },

  "two-sum": {
    approach: "One pass with a dictionary from value to index; for each x check whether target - x was already seen.",
    idea: ["The partner of x is target - x.", "Look it up before storing x, so an element is never paired with itself.", "The first hit gives the two indices."],
    code: `def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 8, 5, 11, 2, 7], target = 9, seen = new Map<number, number>(), frames: CellsFrame[] = []; let ans: number[] = [];
      for (let i = 0; i < a.length; i++) {
        const need = target - a[i];
        if (seen.has(need)) { ans = [seen.get(need)!, i]; frames.push({ note: `${a[i]} needs ${need}, seen at index ${seen.get(need)} → [${ans.join(", ")}]`, tones: { [`0:${ans[0]}`]: "found", [`0:${i}`]: "found" }, marks: [{ i, label: "i" }] }); break; }
        seen.set(a[i], i); frames.push({ note: `${a[i]} needs ${need}: not seen yet. Store ${a[i]} → ${i}`, tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }] });
      }
      return cells(`twoSum([3,8,5,11,2,7], 9) = [${ans.join(", ")}]`, [a], frames);
    },
  },

  "container-with-most-water": {
    approach: "Two pointers at both ends; record the area, then move the shorter wall inward, since keeping it can never give a bigger area.",
    idea: ["Area = width × the shorter of the two walls.", "Moving the taller wall inward shrinks width and the shorter wall still caps the height, so it can only lose.", "So always move the shorter side; every pair that could win is still checked."],
    code: `def maxArea(height):
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const h = [1, 8, 6, 2, 5, 4, 8, 3, 7], frames: CellsFrame[] = []; let l = 0, r = h.length - 1, best = 0;
      while (l < r) {
        const area = (r - l) * Math.min(h[l], h[r]); best = Math.max(best, area);
        frames.push({ note: `width ${r - l} × min(${h[l]}, ${h[r]}) = ${area} (best ${best}); move the ${h[l] < h[r] ? "left" : "right"} wall, it is shorter`, tones: { ...range(l, r, 0), [`0:${l}`]: "active", [`0:${r}`]: "active", ...(area === best ? { [`0:${l}`]: "found", [`0:${r}`]: "found" } : {}) }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
        if (h[l] < h[r]) l++; else r--;
      }
      return cells(`maxArea = ${best}`, [h], frames);
    },
  },
  "3sum": {
    approach: "Sort, fix the first number, and find the other two with a two-pointer sweep; skip equal neighbours to avoid duplicate triples.",
    idea: ["After sorting, for a fixed nums[i] the pair problem on the right part is two-sum on a sorted array.", "Sum too small → move L right; too big → move R left; zero → record and move both.", "Skipping a value equal to the previous one (for i and for L after a hit) keeps every triple unique."],
    code: `def threeSum(nums):
    nums.sort()
    out = []
    for i in range(len(nums) - 2):
        if i and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                out.append([nums[i], nums[l], nums[r]])
                l += 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
                r -= 1
    return out`,
    lang: "python", time: "O(n²)", space: "O(1) besides sorting",
    viz: () => {
      const a = [-1, 0, 1, 2, -1, -4].sort((x, y) => x - y), n = a.length, out: number[][] = [], frames: CellsFrame[] = [{ note: `Sort: [${a.join(", ")}]` }];
      for (let i = 0; i < n - 2; i++) {
        if (i && a[i] === a[i - 1]) { frames.push({ note: `i=${i}: ${a[i]} equals the previous first number → skip (same triples)`, tones: { [`0:${i}`]: "muted" }, marks: [{ i, label: "i" }] }); continue; }
        let l = i + 1, r = n - 1;
        while (l < r) {
          const sum = a[i] + a[l] + a[r], m = [{ i, label: "i" }, { i: l, label: "L" }, { i: r, label: "R" }];
          if (sum === 0) out.push([a[i], a[l], a[r]]);
          frames.push({ note: `${a[i]} + ${a[l]} + ${a[r]} = ${sum}${sum < 0 ? " < 0 → L right" : sum > 0 ? " > 0 → R left" : ` → triple found (${out.length} so far)`}`, tones: { [`0:${i}`]: "active", [`0:${l}`]: sum === 0 ? "found" : "window", [`0:${r}`]: sum === 0 ? "found" : "window" }, marks: m });
          if (sum < 0) l++; else if (sum > 0) r--; else { l++; while (l < r && a[l] === a[l - 1]) l++; r--; }
        }
      }
      return cells(`threeSum = [${out.map((t) => `[${t.join(",")}]`).join(", ")}]`, [a], frames);
    },
  },

  "trapping-rain-water": {
    approach: "Two pointers with running left and right maxima; the side with the lower wall is bounded by its own max, so settle that cell and move inward.",
    idea: ["Water at i = min(max to the left, max to the right) - height[i].", "If height[l] < height[r], the right side already has a wall at least as tall, so the left max alone decides cell l.", "Mirror for the right side. Each cell is settled once."],
    code: `def trap(height):
    l, r = 0, len(height) - 1
    lmax = rmax = water = 0
    while l < r:
        if height[l] < height[r]:
            lmax = max(lmax, height[l])
            water += lmax - height[l]
            l += 1
        else:
            rmax = max(rmax, height[r])
            water += rmax - height[r]
            r -= 1
    return water`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const h = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1], n = h.length, w: (string | number)[] = blank(n), frames: CellsFrame[] = [{ note: `Goal: how much rain stays between the bars? Two pointers move inward from both ends, always settling the lower side`, rows: [h, [...w]], tones: range(0, n - 1, 0), marks: [{ i: 0, label: "L" }, { i: n - 1, label: "R" }] }];
      let l = 0, r = n - 1, lmax = 0, rmax = 0, water = 0;
      while (l < r) {
        const left = h[l] < h[r], i = left ? l : r;
        if (left) lmax = Math.max(lmax, h[l]); else rmax = Math.max(rmax, h[r]);
        const mx = left ? lmax : rmax, add = mx - h[i]; water += add; w[i] = add;
        frames.push({ note: `h[${l}] = ${h[l]} is ${left ? "below" : "not below"} h[${r}] = ${h[r]}, so settle the ${left ? "left" : "right"} cell ${i}: ${left ? "leftMax" : "rightMax"} ${mx} - ${h[i]} = ${add}${add ? ` of water (total ${water})` : ", no water"}`, rows: [h, [...w]], tones: { ...range(l, r, 0), [`0:${i}`]: "active", [`1:${i}`]: add ? "found" : "muted" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
        if (left) l++; else r--;
      }
      frames.push({ note: `The pointers met: ${water} units of water are trapped`, rows: [h, [...w]], tones: tones(w.map((v, i) => (v ? `1:${i}` : "")).filter(Boolean), "found") });
      return cells(`trap([${h.join(",")}]) = ${water}`, [h, blank(n)], frames, ["height", "water"]);
    },
  },

  "valid-palindrome": {
    approach: "Two pointers from both ends, skipping characters that are not letters or digits and comparing the rest case-insensitively.",
    idea: ["Only alphanumeric characters count, and case is ignored.", "Move L or R past anything else.", "A mismatch means False; the pointers meeting means True. No cleaned copy is needed."],
    code: `def isPalindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if not s[l].isalnum():
            l += 1
        elif not s[r].isalnum():
            r -= 1
        elif s[l].lower() != s[r].lower():
            return False
        else:
            l += 1
            r -= 1
    return True`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "?Race car!", a = s.split(""), ok = (c: string) => /[a-z0-9]/i.test(c), frames: CellsFrame[] = [{ note: `Goal: is "${s}" a palindrome if we ignore case and anything that is not a letter or digit? Two pointers start at the ends`, tones: {}, marks: [{ i: 0, label: "L" }, { i: a.length - 1, label: "R" }] }]; let l = 0, r = a.length - 1, ans = true;
      while (l < r) {
        const m = [{ i: l, label: "L" }, { i: r, label: "R" }];
        if (!ok(a[l])) { frames.push({ note: `'${a[l]}' at index ${l} is not a letter or digit, so move L right`, tones: { [`0:${l}`]: "muted" }, marks: m }); l++; }
        else if (!ok(a[r])) { frames.push({ note: `'${a[r]}' at index ${r} is not a letter or digit, so move R left`, tones: { [`0:${r}`]: "muted" }, marks: m }); r--; }
        else { const same = a[l].toLowerCase() === a[r].toLowerCase(); frames.push({ note: `'${a[l]}' and '${a[r]}' ${same ? "match ignoring case, so move both inward" : "differ, so it is not a palindrome"}`, tones: { [`0:${l}`]: same ? "found" : "bad", [`0:${r}`]: same ? "found" : "bad" }, marks: m }); if (!same) { ans = false; break; } l++; r--; }
      }
      frames.push({ note: ans ? "The pointers met without a mismatch, so it is a palindrome" : "A mismatch ends the check: not a palindrome", tones: range(0, a.length - 1, 0, ans ? "found" : "bad") });
      return cells(`isPalindrome("${s}") = ${ans ? "True" : "False"}`, [a], frames);
    },
  },

  "next-permutation": {
    approach: "From the right, find the first i with nums[i] < nums[i + 1]; swap it with the smallest larger value to its right, then reverse the suffix.",
    idea: ["The longest non-increasing suffix is already at its largest order, so it cannot grow by itself.", "nums[i] just before it must increase by the least possible amount: swap it with the rightmost value bigger than it.", "The suffix is still non-increasing; reversing it makes it the smallest order. No pivot means the whole array was the last permutation, so it just reverses."],
    code: `def nextPermutation(nums):
    i = len(nums) - 2
    while i >= 0 and nums[i] >= nums[i + 1]:
        i -= 1
    if i >= 0:
        j = len(nums) - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    nums[i + 1:] = reversed(nums[i + 1:])`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 4, 7, 6, 3, 1], n = a.length, frames: CellsFrame[] = []; let i = n - 2;
      while (i >= 0 && a[i] >= a[i + 1]) { frames.push({ note: `${a[i]} ≥ ${a[i + 1]}: still inside the non-increasing suffix, keep going left`, rows: [[...a]], tones: range(i, n - 1, 0), marks: [{ i, label: "i" }] }); i--; }
      if (i >= 0) {
        frames.push({ note: `${a[i]} < ${a[i + 1]}: pivot at index ${i}`, rows: [[...a]], tones: { ...range(i + 1, n - 1, 0), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }] });
        let j = n - 1; while (a[j] <= a[i]) j--;
        frames.push({ note: `Rightmost value bigger than ${a[i]} is ${a[j]} at index ${j}`, rows: [[...a]], tones: { [`0:${i}`]: "active", [`0:${j}`]: "found" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
        [a[i], a[j]] = [a[j], a[i]];
        frames.push({ note: `Swap → [${a.join(", ")}]; the suffix is still non-increasing`, rows: [[...a]], tones: { [`0:${i}`]: "found", ...range(i + 1, n - 1, 0) }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
      }
      const suf = a.splice(i + 1).reverse(); a.push(...suf);
      frames.push({ note: `Reverse the suffix after index ${i} → [${a.join(", ")}], the next permutation`, rows: [[...a]], tones: range(i + 1, n - 1, 0, "found") });
      return cells(`next permutation of [2,4,7,6,3,1] = [${a.join(", ")}]`, [[2, 4, 7, 6, 3, 1]], frames);
    },
  },

  "maximum-average-subarray-i": {
    approach: "Slide a window of exactly k: add the new element, drop the oldest, track the best sum, divide by k at the end.",
    idea: ["The best average of length k is the best sum of length k divided by k.", "Moving the window one step changes the sum by nums[i] - nums[i - k], O(1) per step."],
    code: `def findMaxAverage(nums, k):
    s = best = sum(nums[:k])
    for i in range(k, len(nums)):
        s += nums[i] - nums[i - k]
        best = max(best, s)
    return best / k`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 12, -5, -6, 50, 3, -2, 7, 9], k = 4; let s = a.slice(0, k).reduce((x, y) => x + y, 0), best = s, bi = 0;
      const frames: CellsFrame[] = [{ note: `Goal: the highest average of any ${k} consecutive numbers, which is the highest sum of ${k}`, tones: {} }, { note: `First window [${a.slice(0, k).join(", ")}] sums to ${s}`, tones: range(0, k - 1, 0), marks: [{ i: 0, label: "L" }, { i: k - 1, label: "R" }] }];
      for (let i = k; i < a.length; i++) {
        const prev = s; s += a[i] - a[i - k]; const up = s > best; if (up) { best = s; bi = i - k + 1; }
        frames.push({ note: `Add ${a[i]}, drop ${a[i - k]}: the sum goes from ${prev} to ${s}${up ? ", a new best" : `, best stays ${best}`}`, tones: { ...range(i - k + 1, i, 0, up ? "found" : "window"), [`0:${i - k}`]: "bad", [`0:${i}`]: "active" }, marks: [{ i: i - k + 1, label: "L" }, { i, label: "R" }] });
      }
      frames.push({ note: `Best window is indices ${bi}..${bi + k - 1} with sum ${best}, so the maximum average is ${best} / ${k} = ${best / k}`, tones: range(bi, bi + k - 1, 0, "found") });
      return cells(`findMaxAverage([${a.join(",")}], ${k}) = ${best / k}`, [a], frames);
    },
  },

  "minimum-size-subarray-sum": {
    approach: "Variable window: grow R, and while the sum reaches target record the length and shrink from L.",
    idea: ["All numbers are positive, so shrinking always lowers the sum and growing always raises it.", "Once the window sum is ≥ target, the shortest window ending at R is found by shrinking L as far as possible.", "Each index enters and leaves once."],
    code: `def minSubArrayLen(target, nums):
    l = s = 0
    best = len(nums) + 1
    for r, x in enumerate(nums):
        s += x
        while s >= target:
            best = min(best, r - l + 1)
            s -= nums[l]
            l += 1
    return best if best <= len(nums) else 0`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 3, 1, 2, 4, 3], target = 7, frames: CellsFrame[] = []; let l = 0, s = 0, best = a.length + 1;
      a.forEach((x, r) => {
        s += x; frames.push({ note: `Add ${x} → sum ${s}${s >= target ? ` ≥ ${target}` : ` < ${target}`}`, tones: { ...range(l, r, 0), [`0:${r}`]: "active" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
        while (s >= target) { best = Math.min(best, r - l + 1); frames.push({ note: `Window [${l}..${r}] length ${r - l + 1} works (best ${best}); drop ${a[l]} → sum ${s - a[l]}`, tones: { ...range(l, r, 0, "found"), [`0:${l}`]: "bad" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); s -= a[l]; l++; }
      });
      return cells(`minSubArrayLen(7) = ${best <= a.length ? best : 0}`, [a], frames);
    },
  },

  "longest-substring-without-repeating-characters": {
    approach: "Sliding window with each character's last index; when a character repeats inside the window, jump L just past its previous copy.",
    idea: ["The window [L, R] always holds distinct characters.", "If s[R] was last seen at index ≥ L, move L to that index + 1.", "Record s[R]'s index and update the best length."],
    code: `def lengthOfLongestSubstring(s):
    last = {}
    l = best = 0
    for r, ch in enumerate(s):
        if last.get(ch, -1) >= l:
            l = last[ch] + 1
        last[ch] = r
        best = max(best, r - l + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(alphabet)",
    viz: () => variableWindow("abcabcbb"),
  },

  "sliding-window-maximum": {
    approach: "Monotonic deque of indices with decreasing values: the front is the window's max; drop the front when it leaves and pop smaller values from the back.",
    idea: ["A value with a bigger value to its right inside the window can never be a max again, so pop it.", "The deque stays decreasing, so its front is the current max.", "Remove the front once its index falls out of the window. Each index is pushed and popped once."],
    code: `from collections import deque
def maxSlidingWindow(nums, k):
    dq, out = deque(), []
    for i, x in enumerate(nums):
        if dq and dq[0] <= i - k:
            dq.popleft()
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out`,
    lang: "python", time: "O(n)", space: "O(k)",
    viz: () => monoDeque([1, 3, -1, -3, 5, 3, 6, 7], 3),
  },

  "fruit-into-baskets": {
    approach: "Longest window with at most two distinct values: count fruits in the window and shrink from the left while there are three types.",
    idea: ["Two baskets = at most two distinct fruit types in a contiguous run.", "Add fruits[R] to a counter; while the counter has 3 keys, remove fruits[L] and advance L.", "The longest valid window is the answer."],
    code: `from collections import defaultdict
def totalFruit(fruits):
    count = defaultdict(int)
    l = best = 0
    for r, f in enumerate(fruits):
        count[f] += 1
        while len(count) > 2:
            count[fruits[l]] -= 1
            if count[fruits[l]] == 0:
                del count[fruits[l]]
            l += 1
        best = max(best, r - l + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 3, 2, 2, 3, 1], count = new Map<number, number>(), frames: CellsFrame[] = []; let l = 0, best = 0;
      a.forEach((f, r) => {
        count.set(f, (count.get(f) ?? 0) + 1); const shrunk = count.size > 2;
        while (count.size > 2) { const g = a[l]; count.set(g, count.get(g)! - 1); if (!count.get(g)) count.delete(g); l++; }
        best = Math.max(best, r - l + 1);
        frames.push({ note: `${shrunk ? `Fruit ${f} makes 3 types → shrink L to ${l}. ` : `Add fruit ${f}. `}Baskets {${[...count].map(([k, c]) => `${k}: ${c}`).join(", ")}}, window ${r - l + 1}, best ${best}`, tones: { ...range(l, r, 0), [`0:${r}`]: shrunk ? "bad" : "active" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
      });
      return cells(`totalFruit = ${best}`, [a], frames);
    },
  },

  "best-time-to-buy-and-sell-stock": {
    approach: "Scan once, keeping the cheapest price so far; selling today earns price - cheapest, and the best of those is the answer.",
    idea: ["The best sale on day i buys at the minimum price before day i.", "Track that minimum as you go and compare today's profit with the best seen.", "If prices only fall, the profit stays 0."],
    code: `def maxProfit(prices):
    low, best = float("inf"), 0
    for p in prices:
        low = min(low, p)
        best = max(best, p - low)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const p = [7, 1, 5, 3, 6, 4], frames: CellsFrame[] = []; let low = p[0], li = 0, best = 0, bi = 0, bj = 0;
      p.forEach((x, i) => {
        if (x < low) { low = x; li = i; }
        if (x - low > best) { best = x - low; bi = li; bj = i; }
        frames.push({ note: `Day ${i} price ${x}: cheapest so far ${low} (day ${li}); selling now earns ${x - low}, best ${best}`, tones: { [`0:${li}`]: "window", [`0:${i}`]: "active", ...(best ? { [`0:${bi}`]: "found", [`0:${bj}`]: "found" } : {}) }, marks: [{ i: li, label: "min" }, { i, label: "day" }] });
      });
      return cells(`maxProfit = ${best} (buy day ${bi}, sell day ${bj})`, [p], frames);
    },
  },
  "maximum-subarray": {
    approach: "Kadane: at each index either extend the running sum or restart at the current element, whichever is larger; keep the best.",
    idea: ["The best subarray ending at i is nums[i] alone or nums[i] plus the best one ending at i - 1.", "A negative running sum only hurts what follows, so restart.", "The answer is the largest running sum seen."],
    code: `def maxSubArray(nums):
    run = best = nums[0]
    for x in nums[1:]:
        run = max(x, run + x)
        best = max(best, run)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]),
  },

  "maximum-product-subarray": {
    approach: "Track both the largest and the smallest product ending here; a negative number swaps them, because a big negative times a negative becomes big.",
    idea: ["hi = largest product of a subarray ending at i, lo = smallest.", "Multiplying by a negative flips the order, so swap hi and lo first.", "Then hi = max(x, hi·x), lo = min(x, lo·x); taking x alone restarts after a zero."],
    code: `def maxProduct(nums):
    hi = lo = best = nums[0]
    for x in nums[1:]:
        if x < 0:
            hi, lo = lo, hi
        hi = max(x, hi * x)
        lo = min(x, lo * x)
        best = max(best, hi)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 3, -2, 4, -1, 2, 0, 3], H = blank(a.length), L = blank(a.length); let hi = a[0], lo = a[0], best = a[0]; H[0] = hi; L[0] = lo;
      const frames: CellsFrame[] = [{ note: `Goal: the largest product of a subarray of [${a.join(", ")}]. Track the largest (hi) and smallest (lo) product ending at each index, since a negative flips them`, rows: [a, blank(a.length), blank(a.length)] }, { note: `Start: hi = lo = best = ${a[0]}`, rows: [a, [...H], [...L]], tones: { "0:0": "active", "1:0": "window", "2:0": "window" } }];
      for (let i = 1; i < a.length; i++) {
        const x = a[i], flip = x < 0; if (flip) [hi, lo] = [lo, hi];
        hi = Math.max(x, hi * x); lo = Math.min(x, lo * x); const up = hi > best; best = Math.max(best, hi); H[i] = hi; L[i] = lo;
        frames.push({ note: `${x}${flip ? " is negative: swap hi and lo, then" : x === 0 ? " is zero: both products collapse to 0, then" : ":"} hi = ${hi}, lo = ${lo}, best ${up ? `rises to ${best}` : `stays ${best}`}`, rows: [a, [...H], [...L]], tones: { [`0:${i}`]: "active", [`1:${i}`]: up ? "found" : "window", [`2:${i}`]: flip ? "bad" : "window" } });
      }
      frames.push({ note: `The best product over every subarray is ${best}`, rows: [a, [...H], [...L]], tones: tones(H.map((v, i) => (v === best ? `1:${i}` : "")).filter(Boolean), "found") });
      return cells(`maxProduct([${a.join(",")}]) = ${best}`, [a, blank(a.length), blank(a.length)], frames, ["nums", "hi", "lo"]);
    },
  },

  "maximum-sum-circular-subarray": {
    approach: "The best circular subarray either does not wrap (plain Kadane max) or wraps, which equals total minus the minimum subarray; take the larger.",
    idea: ["A wrapping subarray leaves out one contiguous middle part, so its sum is total - (that middle part).", "To maximise it, remove the minimum subarray (Kadane for the minimum).", "If every number is negative, the min subarray is the whole array and total - min = 0 is an empty pick, so return the plain max."],
    code: `def maxSubarraySumCircular(nums):
    cur_max = cur_min = 0
    best_max, best_min, total = nums[0], nums[0], 0
    for x in nums:
        cur_max = max(x, cur_max + x)
        best_max = max(best_max, cur_max)
        cur_min = min(x, cur_min + x)
        best_min = min(best_min, cur_min)
        total += x
    return best_max if best_max < 0 else max(best_max, total - best_min)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [5, -3, -2, 6, -1], MX = blank(a.length), MN = blank(a.length), frames: CellsFrame[] = []; let cmx = 0, cmn = 0, bmx = a[0], bmn = a[0], total = 0;
      a.forEach((x, i) => {
        cmx = Math.max(x, cmx + x); bmx = Math.max(bmx, cmx); cmn = Math.min(x, cmn + x); bmn = Math.min(bmn, cmn); total += x; MX[i] = cmx; MN[i] = cmn;
        frames.push({ note: `x = ${x}: max ending here ${cmx} (best ${bmx}), min ending here ${cmn} (lowest ${bmn}), total ${total}`, rows: [a, [...MX], [...MN]], tones: { [`0:${i}`]: "active" } });
      });
      const ans = bmx < 0 ? bmx : Math.max(bmx, total - bmn);
      frames.push({ note: `No wrap: ${bmx}. Wrap: total ${total} - min subarray ${bmn} = ${total - bmn} (keeps 6, -1, 5 around the end). Answer ${ans}`, rows: [a, MX, MN], tones: { "0:0": "found", "0:3": "found", "0:4": "found", "0:1": "bad", "0:2": "bad" } });
      return cells(`maxSubarraySumCircular = ${ans}`, [a, blank(a.length), blank(a.length)], frames, ["nums", "max end", "min end"]);
    },
  },

  "move-zeroes": {
    approach: "A write pointer marks where the next non-zero belongs; swap each non-zero there, which pushes zeros to the back in order.",
    idea: ["Everything before w is the non-zero values in their original order.", "When nums[r] is non-zero, swap it with nums[w] and advance w.", "Zeros drift right without any extra array."],
    code: `def moveZeroes(nums):
    w = 0
    for r in range(len(nums)):
        if nums[r] != 0:
            nums[w], nums[r] = nums[r], nums[w]
            w += 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [0, 1, 0, 3, 0, 12, 5, 0], frames: CellsFrame[] = [{ note: `Goal: push every 0 to the end of [${a.join(", ")}] and keep the other numbers in order. w marks the next slot for a non-zero`, rows: [[...a]], marks: [{ i: 0, label: "w" }] }]; let w = 0;
      for (let r = 0; r < a.length; r++) {
        if (a[r] !== 0) {
          const same = w === r, v = a[r]; [a[w], a[r]] = [a[r], a[w]];
          frames.push({ note: same ? `nums[${r}] = ${v} is non-zero and already in slot ${w}, so w moves on` : `nums[${r}] = ${v} is non-zero: swap it into slot ${w}, which held 0`, rows: [[...a]], tones: { ...range(0, w, 0, "found"), [`0:${r}`]: "active" }, marks: [{ i: w, label: "w" }, { i: r, label: "r" }] }); w++;
        } else frames.push({ note: `nums[${r}] is 0: skip it, w stays at ${w}`, rows: [[...a]], tones: { ...range(0, w - 1, 0, "found"), [`0:${r}`]: "muted" }, marks: [{ i: w, label: "w" }, { i: r, label: "r" }] });
      }
      frames.push({ note: `Done: [${a.join(", ")}], non-zero numbers in their original order and the zeros at the back`, rows: [[...a]], tones: range(0, w - 1, 0, "found") });
      return cells(`moveZeroes → [${a.join(", ")}]`, [[0, 1, 0, 3, 0, 12, 5, 0]], frames);
    },
  },

  "sort-colors": {
    approach: "Dutch national flag: lo, mid, hi pointers; 0s swap to lo, 2s swap to hi, 1s stay, all in one pass.",
    idea: ["[0, lo) holds 0s, [lo, mid) holds 1s, (hi, end] holds 2s, and [mid, hi] is unchecked.", "A 0 at mid swaps to lo (both advance); a 1 just advances mid.", "A 2 swaps to hi and hi shrinks, but mid stays, because the swapped-in value is unchecked."],
    code: `def sortColors(nums):
    lo = mid = 0
    hi = len(nums) - 1
    while mid <= hi:
        if nums[mid] == 0:
            nums[lo], nums[mid] = nums[mid], nums[lo]
            lo += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[hi] = nums[hi], nums[mid]
            hi -= 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 0, 2, 1, 1, 0], n = a.length; let lo = 0, mid = 0, hi = n - 1;
      const shot = (note: string, tone: Tone = "active"): CellsFrame => ({ note, rows: [[...a]], tones: { ...range(0, lo - 1, 0, "found"), ...range(lo, mid - 1, 0), ...range(hi + 1, n - 1, 0, "done"), ...(mid <= hi ? { [`0:${mid}`]: tone } : {}) }, marks: [{ i: lo, label: "lo" }, { i: Math.min(mid, n - 1), label: "mid" }, { i: Math.max(hi, 0), label: "hi" }] });
      const frames: CellsFrame[] = [shot("Goal: sort 0s, 1s and 2s in one pass. 0s collect left of lo, 2s right of hi, and mid scans the unknown middle")];
      while (mid <= hi) {
        const v = a[mid], m0 = mid, l0 = lo, h0 = hi;
        if (v === 0) { [a[lo], a[mid]] = [a[mid], a[lo]]; lo++; mid++; frames.push(shot(`nums[${m0}] = 0: swap it with nums[lo = ${l0}] → [${a.join(", ")}], then lo = ${lo} and mid = ${mid}`)); }
        else if (v === 1) { mid++; frames.push(shot(`nums[${m0}] = 1 already belongs in the middle band, so mid = ${mid}`)); }
        else { [a[mid], a[hi]] = [a[hi], a[mid]]; hi--; frames.push(shot(`nums[${m0}] = 2: swap it with nums[hi = ${h0}] → [${a.join(", ")}], then hi = ${hi}; mid stays because the swapped-in value is unchecked`)); }
      }
      frames.push({ note: `mid passed hi, so the array is sorted: [${a.join(", ")}]`, rows: [[...a]], tones: range(0, n - 1, 0, "found") });
      return cells(`sortColors([2,0,2,1,1,0]) → [${a.join(", ")}]`, [[2, 0, 2, 1, 1, 0]], frames);
    },
  },

  "rotate-array": {
    approach: "Rotating right by k equals: reverse the whole array, then reverse the first k and the last n - k separately.",
    idea: ["Take k %= n, since rotating by n changes nothing.", "Reversing everything puts the last k values in front, but backwards.", "Reversing each of the two parts restores their internal order. O(1) extra space."],
    code: `def rotate(nums, k):
    n = len(nums)
    k %= n
    def rev(i, j):
        while i < j:
            nums[i], nums[j] = nums[j], nums[i]
            i += 1
            j -= 1
    rev(0, n - 1)
    rev(0, k - 1)
    rev(k, n - 1)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 3, 4, 5, 6, 7], n = a.length, k = 3, frames: CellsFrame[] = [{ note: `Goal: rotate right by k = ${k}, so the last ${k} values move to the front. Three reversals do it in place`, rows: [[...a]], tones: range(n - k, n - 1, 0) }];
      const rev = (i: number, j: number, why: string) => { const lo = i, hi = j; while (i < j) { [a[i], a[j]] = [a[j], a[i]]; frames.push({ note: `${why}: swap nums[${i}] and nums[${j}] → [${a.join(", ")}]`, rows: [[...a]], tones: { ...range(lo, hi, 0), [`0:${i}`]: "active", [`0:${j}`]: "active" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] }); i++; j--; } };
      rev(0, n - 1, "Reverse all"); rev(0, k - 1, `Reverse the first ${k}`); rev(k, n - 1, `Reverse the last ${n - k}`);
      frames.push({ note: `All three reversals done: [${a.join(", ")}] is the array rotated right by ${k}`, rows: [[...a]], tones: range(0, n - 1, 0, "found") });
      return cells(`rotate([1..7], ${k}) → [${a.join(", ")}]`, [[1, 2, 3, 4, 5, 6, 7]], frames);
    },
  },

  "find-the-duplicate-number": {
    approach: "Treat i → nums[i] as a linked list; the duplicate value is where two arrows enter one node, i.e. the start of a cycle. Find it with Floyd's tortoise and hare.",
    idea: ["Values are in 1..n and there are n + 1 indices, so following i → nums[i] from 0 must loop, and the loop entrance is the repeated value.", "Phase 1: slow moves one step, fast two, until they meet inside the cycle.", "Phase 2: restart slow from the beginning; moving both one step at a time, they meet at the cycle entrance.", "No array changes and O(1) space."],
    code: `def findDuplicate(nums):
    slow = fast = nums[0]
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 3, 4, 2, 2], next = [...a], values = a.map((_, i) => `i${i}`), frames: ListFrame[] = []; let slow = a[0], fast = a[0];
      frames.push({ note: `Each index i points to nums[i]: ${a.map((v, i) => `${i}→${v}`).join(", ")}. Both start at nums[0] = ${slow}`, next, ptrs: [{ i: slow, label: "slow, fast" }] });
      do { slow = a[slow]; fast = a[a[fast]]; frames.push({ note: `slow one step → ${slow}, fast two steps → ${fast}${slow === fast ? ": they meet inside the cycle" : ""}`, next, ptrs: slow === fast ? [{ i: slow, label: "slow, fast" }] : [{ i: slow, label: "slow" }, { i: fast, label: "fast" }], tones: { [slow]: "active", [fast]: slow === fast ? "found" : "window" } }); } while (slow !== fast);
      slow = a[0]; frames.push({ note: `Phase 2: slow restarts at ${slow}, fast stays at ${fast}; both now move one step`, next, ptrs: [{ i: slow, label: "slow" }, { i: fast, label: "fast" }], tones: { [slow]: "active", [fast]: "window" } });
      while (slow !== fast) { slow = a[slow]; fast = a[fast]; frames.push({ note: slow === fast ? `Both reach ${slow}: the cycle entrance, so ${slow} is the duplicate` : `slow → ${slow}, fast → ${fast}`, next, ptrs: slow === fast ? [{ i: slow, label: "slow, fast" }] : [{ i: slow, label: "slow" }, { i: fast, label: "fast" }], tones: slow === fast ? { [slow]: "found" } : { [slow]: "active", [fast]: "window" } }); }
      return { kind: "list", title: `findDuplicate([1,3,4,2,2]) = ${slow}`, values, frames };
    },
  },

  "first-missing-positive": {
    approach: "Cyclic placement: swap every value v in 1..n to index v - 1; afterwards the first index i holding something other than i + 1 gives the answer.",
    idea: ["The answer is in 1..n + 1, so only those values matter.", "Swap nums[i] to its home until the value there is out of range or already correct; each swap fixes one value for good.", "Scan for the first index that is not home; if all are, the answer is n + 1."],
    code: `def firstMissingPositive(nums):
    n = len(nums)
    for i in range(n):
        while 0 < nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    return n + 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [3, 4, 1, 2, -1, 7], n = a.length, frames: CellsFrame[] = [{ note: `Goal: the smallest missing positive. Put each value v from 1 to ${n} into slot v - 1 and ignore everything else`, rows: [[...a]] }];
      for (let i = 0; i < n; i++) {
        let moved = false;
        while (a[i] > 0 && a[i] <= n && a[a[i] - 1] !== a[i]) { const v = a[i], j = v - 1; [a[i], a[j]] = [a[j], a[i]]; moved = true; frames.push({ note: `i = ${i}: value ${v} belongs in slot ${j}, so swap them → [${a.join(", ")}]`, rows: [[...a]], tones: { [`0:${i}`]: "active", [`0:${j}`]: "found" }, marks: [{ i, label: "i" }] }); }
        if (!moved) frames.push({ note: `i = ${i}: ${a[i]} ${a[i] <= 0 ? "is not positive" : a[i] > n ? `is bigger than ${n}` : "is already in its own slot"}, so leave it`, rows: [[...a]], tones: { [`0:${i}`]: "muted" }, marks: [{ i, label: "i" }] });
      }
      let ans = n + 1;
      for (let i = 0; i < n; i++) {
        if (a[i] !== i + 1) { ans = i + 1; frames.push({ note: `Scan: slot ${i} holds ${a[i]} instead of ${i + 1}, so ${i + 1} is the smallest missing positive`, rows: [[...a]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "found" }, marks: [{ i, label: "ans" }] }); break; }
        frames.push({ note: `Scan: slot ${i} holds ${i + 1}, as it should`, rows: [[...a]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" }, marks: [{ i, label: "i" }] });
      }
      return cells(`firstMissingPositive([3,4,1,2,-1,7]) = ${ans}`, [[3, 4, 1, 2, -1, 7]], frames);
    },
  },

  "find-all-numbers-disappeared-in-an-array": {
    approach: "Use the array as its own seen-set: for each value v, make nums[v - 1] negative; indices that stay positive are the missing numbers.",
    idea: ["Values are in 1..n, so each value names an index.", "Flip the sign at that index (using abs so a value read after flipping still works).", "Any index i still positive means i + 1 never appeared."],
    code: `def findDisappearedNumbers(nums):
    for x in nums:
        i = abs(x) - 1
        nums[i] = -abs(nums[i])
    return [i + 1 for i, x in enumerate(nums) if x > 0]`,
    lang: "python", time: "O(n)", space: "O(1) besides the output",
    viz: () => {
      const a = [4, 3, 2, 7, 8, 2, 3, 1], frames: CellsFrame[] = [];
      for (let k = 0; k < a.length; k++) { const v = Math.abs(a[k]), i = v - 1; a[i] = -Math.abs(a[i]); frames.push({ note: `Value ${v} seen → mark index ${i} negative`, rows: [[...a]], tones: { [`0:${k}`]: "active", [`0:${i}`]: "done" }, marks: [{ i: k, label: "read" }] }); }
      const miss = a.map((x, i) => (x > 0 ? i + 1 : 0)).filter(Boolean);
      frames.push({ note: `Still positive at indices ${miss.map((m) => m - 1).join(", ")} → missing numbers [${miss.join(", ")}]`, rows: [[...a]], tones: tones(miss.map((m) => `0:${m - 1}`), "found") });
      return cells(`Disappeared: [${miss.join(", ")}]`, [[4, 3, 2, 7, 8, 2, 3, 1]], frames);
    },
  },

  "plus-one": {
    approach: "Walk from the last digit: a digit below 9 just increments and we stop; a 9 becomes 0 and the carry moves left; if every digit was 9, prepend 1.",
    idea: ["Adding one only changes the trailing run of 9s and the digit before it.", "Each 9 turns into 0 and passes the carry on.", "A carry past the first digit means the number was all 9s, so the result is 1 followed by zeros."],
    code: `def plusOne(digits):
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1] + digits`,
    lang: "python", time: "O(n)", space: "O(1) unless all digits are 9",
    viz: () => {
      const d = [4, 3, 9, 9, 9], frames: CellsFrame[] = [{ note: `Goal: add 1 to the number ${d.join("")}, stored one digit per slot. Start at the last digit`, rows: [[...d]], marks: [{ i: d.length - 1, label: "i" }] }];
      for (let i = d.length - 1; i >= 0; i--) {
        if (d[i] < 9) { d[i]++; frames.push({ note: `Index ${i} holds ${d[i] - 1}, below 9: it becomes ${d[i]} and the carry stops`, rows: [[...d]], tones: { [`0:${i}`]: "found" }, marks: [{ i, label: "i" }] }); break; }
        d[i] = 0; frames.push({ note: `Index ${i} holds 9: 9 + 1 = 10, so write 0 and carry 1 to index ${i - 1}`, rows: [[...d]], tones: { [`0:${i}`]: "bad" }, marks: [{ i, label: "i" }] });
      }
      frames.push({ note: `Result: 43999 + 1 = ${d.join("")}`, rows: [[...d]], tones: range(0, d.length - 1, 0, "found") });
      return cells(`plusOne([4,3,9,9,9]) = [${d.join(", ")}]`, [[4, 3, 9, 9, 9]], frames);
    },
  },
  "summary-ranges": {
    approach: "Walk the sorted array; extend a run while the next number is exactly one more, then emit \"a\" or \"a->b\" and start the next run.",
    idea: ["The numbers are sorted and unique, so a range is a maximal run of consecutive values.", "From index i, push j forward while nums[j + 1] == nums[j] + 1.", "A one-element run prints as the number; longer ones as start->end."],
    code: `def summaryRanges(nums):
    out, i = [], 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:
            j += 1
        out.append(str(nums[i]) if i == j else f"{nums[i]}->{nums[j]}")
        i = j + 1
    return out`,
    lang: "python", time: "O(n)", space: "O(1) besides the output",
    viz: () => {
      const a = [0, 1, 2, 4, 5, 7, 8, 9, 11], out: string[] = [], done: Record<string, Tone> = {}, frames: CellsFrame[] = [{ note: `Goal: group the sorted numbers [${a.join(", ")}] into ranges of consecutive values`, tones: {} }]; let i = 0;
      while (i < a.length) {
        let j = i;
        while (j + 1 < a.length && a[j + 1] === a[j] + 1) { j++; frames.push({ note: `${a[j]} is ${a[j - 1]} + 1, so the run starting at ${a[i]} grows to ${a[i]}..${a[j]}`, tones: { ...done, ...range(i, j, 0) }, marks: [{ i, label: "i" }, { i: j, label: "j" }] }); }
        out.push(i === j ? `${a[i]}` : `${a[i]}->${a[j]}`);
        frames.push({ note: `${j + 1 < a.length ? `The next number ${a[j + 1]} is not ${a[j] + 1}` : "No numbers are left"}, so the run ${i === j ? `${a[i]}` : `${a[i]}..${a[j]}`} closes as "${out[out.length - 1]}"`, tones: { ...done, ...range(i, j, 0, "found") }, marks: [{ i, label: "i" }, ...(j > i ? [{ i: j, label: "j" }] : [])] });
        Object.assign(done, range(i, j, 0, "done")); i = j + 1;
      }
      frames.push({ note: `Every number is in a range: [${out.map((x) => `"${x}"`).join(", ")}]`, tones: range(0, a.length - 1, 0, "found") });
      return cells(`summaryRanges([${a.join(",")}]) = [${out.map((x) => `"${x}"`).join(", ")}]`, [a], frames);
    },
  },

  "merge-intervals": {
    approach: "Sort by start; each interval either overlaps the last merged one (extend its end) or starts a new merged interval.",
    idea: ["After sorting by start, any interval that overlaps earlier ones overlaps the most recent merged interval.", "Overlap test: start ≤ last end. Then last end = max(last end, end).", "Otherwise append it as a new interval."],
    code: `def merge(intervals):
    intervals.sort()
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const items: [number, number][] = [[1, 3], [2, 6], [8, 10], [9, 11], [15, 18], [17, 20]], res: [number, number][] = [], snap = () => res.map((x) => [...x] as [number, number]), done: Record<number, Tone> = {};
      const frames: IntervalsFrame[] = [{ note: "Sorted by start. Each interval either overlaps the last merged one, so it extends it, or starts a new merged interval", result: [] }];
      items.forEach(([s, e], i) => {
        const last = res[res.length - 1];
        if (last && s <= last[1]) { const oe = last[1]; last[1] = Math.max(oe, e); frames.push({ note: `[${s},${e}] starts at ${s}, not after the last end ${oe}: overlap, so the end becomes max(${oe}, ${e}) = ${last[1]}`, tones: { ...done, [i]: "active" }, result: snap() }); }
        else { res.push([s, e]); frames.push({ note: last ? `[${s},${e}] starts at ${s}, after the last end ${last[1]}: no overlap, start a new interval` : `[${s},${e}] is the first interval, so it starts the result`, tones: { ...done, [i]: "found" }, result: snap() }); }
        done[i] = "done";
      });
      frames.push({ note: `${res.length} merged intervals: ${res.map((x) => `[${x}]`).join(", ")}`, tones: Object.fromEntries(items.map((_, i) => [i, "found" as Tone])), result: snap() });
      return { kind: "intervals", title: `merge → ${res.map((x) => `[${x}]`).join(", ")}`, items, frames };
    },
  },

  "insert-interval": {
    approach: "Three phases over the sorted list: copy intervals that end before the new one, absorb every interval that overlaps it, copy the rest.",
    idea: ["Intervals ending before newInterval starts are untouched.", "While an interval starts at or before the new end, it overlaps: widen the new interval to cover it.", "Append the widened interval, then everything after it. One pass, no sort needed."],
    code: `def insert(intervals, newInterval):
    out, i, n = [], 0, len(intervals)
    s, e = newInterval
    while i < n and intervals[i][1] < s:
        out.append(intervals[i])
        i += 1
    while i < n and intervals[i][0] <= e:
        s, e = min(s, intervals[i][0]), max(e, intervals[i][1])
        i += 1
    out.append([s, e])
    out += intervals[i:]
    return out`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const iv: [number, number][] = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], nw: [number, number] = [4, 8], items = [...iv, nw], N = iv.length, out: [number, number][] = [], frames: IntervalsFrame[] = [];
      let [s, e] = nw, i = 0; const snap = (extra?: [number, number]) => [...out.map((x) => [...x] as [number, number]), ...(extra ? [extra] : [])];
      frames.push({ note: `New interval [${s},${e}] (bottom row) must go into the sorted list`, tones: { [N]: "active" } });
      while (i < N && iv[i][1] < s) { out.push(iv[i]); frames.push({ note: `[${iv[i]}] ends before ${s} → copy it unchanged`, tones: { [i]: "done", [N]: "active" }, result: snap() }); i++; }
      while (i < N && iv[i][0] <= e) { const pe = e; [s, e] = [Math.min(s, iv[i][0]), Math.max(e, iv[i][1])]; frames.push({ note: `[${iv[i]}] starts at or before ${pe} → overlaps, widen to [${s},${e}]`, tones: { [i]: "bad", [N]: "active" }, result: snap([s, e]) }); i++; }
      out.push([s, e]);
      for (; i < N; i++) { out.push(iv[i]); frames.push({ note: `[${iv[i]}] starts after ${e} → copy the rest`, tones: { [i]: "done" }, result: snap() }); }
      frames.push({ note: `Result: ${out.map((x) => `[${x}]`).join(", ")}`, tones: { [N]: "found" }, result: snap() });
      return { kind: "intervals", title: "Insert [4,8] into a sorted interval list", items, frames };
    },
  },

  "non-overlapping-intervals": {
    approach: "Keep as many intervals as possible: sort by end and greedily keep each interval that starts at or after the last kept end; the rest are removed.",
    idea: ["Removing the fewest = keeping the most non-overlapping intervals.", "Among intervals that fit, the one that ends earliest leaves the most room, so sort by end.", "Count the intervals that overlap the last kept one; that count is the answer."],
    code: `def eraseOverlapIntervals(intervals):
    intervals.sort(key=lambda x: x[1])
    end, removed = float("-inf"), 0
    for s, e in intervals:
        if s >= end:
            end = e
        else:
            removed += 1
    return removed`,
    lang: "python", time: "O(n log n)", space: "O(1) besides sorting",
    viz: () => {
      const items = ([[1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [4, 6], [5, 7]] as [number, number][]).sort((a, b) => a[1] - b[1]), kept: [number, number][] = [], tn: Record<number, Tone> = {};
      const frames: IntervalsFrame[] = [{ note: "Sorted by end. Greedy: keep an interval when it starts at or after the last kept end, otherwise remove it", result: [] }]; let end: number | null = null, removed = 0;
      items.forEach(([s, e], i) => {
        if (end === null || s >= end) { frames.push({ note: `[${s},${e}]: ${end === null ? "nothing is kept yet" : `${s} is not before the last kept end ${end}`}, so keep it and the last end becomes ${e}`, tones: { ...tn, [i]: "found" }, result: [...kept, [s, e] as [number, number]] }); kept.push([s, e]); tn[i] = "found"; end = e; }
        else { removed++; tn[i] = "bad"; frames.push({ note: `[${s},${e}]: ${s} is before the last kept end ${end}, so it overlaps: remove it (${removed} removed)`, tones: { ...tn }, result: kept.map((x) => [...x] as [number, number]) }); }
      });
      frames.push({ note: `Kept ${kept.length} intervals and removed ${removed}, so the answer is ${removed}`, tones: { ...tn }, result: kept });
      return { kind: "intervals", title: `eraseOverlapIntervals = ${removed}`, items, frames };
    },
  },

  "search-insert-position": {
    approach: "Lower-bound binary search: find the first index whose value is ≥ target; that is both where target is and where it would be inserted.",
    idea: ["Keep the answer inside [lo, hi), with hi starting at len(nums) because inserting at the end is allowed.", "If nums[mid] < target the answer is right of mid; otherwise mid itself might be it, so hi = mid.", "When lo meets hi, that index is the answer."],
    code: `def searchInsert(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const a = [1, 3, 5, 6, 8, 10, 12, 15, 18, 20], t = 2, frames: CellsFrame[] = [{ note: `Goal: the index of ${t}, or where it would be inserted. Search [lo, hi) with hi = ${a.length}, because inserting at the end is allowed`, tones: range(0, a.length - 1, 0), marks: [{ i: 0, label: "lo" }, { i: a.length - 1, label: "hi-1" }] }], at = lowerBound(a, t, frames, "insert spot");
      frames.push({ note: `lo = hi = ${at}: ${t} is not present and belongs at index ${at}, just before ${a[at]}`, tones: { [`0:${at}`]: "found" }, marks: [{ i: at, label: "ans" }] });
      return cells(`searchInsert(…, ${t}) = ${at}`, [a], frames);
    },
  },

  "binary-search": {
    approach: "Classic binary search on [lo, hi]: compare the middle with the target and throw away the half that cannot contain it.",
    idea: ["The array is sorted, so nums[mid] < target means everything left of mid is too small.", "Likewise nums[mid] > target rules out the right half.", "Stop when found or when lo passes hi."],
    code: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const a = [-1, 0, 3, 5, 9, 12, 15, 20, 24, 31], t = 31, n = a.length, frames: CellsFrame[] = [{ note: `Goal: find ${t} in a sorted array of ${n} numbers by halving the range [lo, hi] on every probe`, tones: range(0, n - 1, 0), marks: [{ i: 0, label: "lo" }, { i: n - 1, label: "hi" }] }]; let lo = 0, hi = n - 1, ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1, v = a[mid];
        if (v === t) { ans = mid; frames.push({ note: `mid = ${mid}, nums[${mid}] = ${v} equals the target ${t}`, tones: span(lo, hi, n, mid, "found"), marks: lmh(lo, mid, hi) }); break; }
        frames.push({ note: `mid = ${mid}, nums[${mid}] = ${v} is ${v < t ? `below the target ${t}, so drop the left half (lo = ${mid + 1})` : `above the target ${t}, so drop the right half (hi = ${mid - 1})`}`, tones: span(lo, hi, n, mid), marks: lmh(lo, mid, hi) });
        if (v < t) lo = mid + 1; else hi = mid - 1;
      }
      frames.push({ note: `Return ${ans}: ${t} sits at index ${ans}, found after ${frames.length - 1} probes of a ${n}-number array`, tones: { [`0:${ans}`]: "found" }, marks: [{ i: ans, label: "ans" }] });
      return cells(`search(nums, ${t}) = ${ans}`, [a], frames);
    },
  },

  "find-first-and-last-position-of-element-in-sorted-array": {
    approach: "Two lower-bound searches: the first index ≥ target is the start, and the first index ≥ target + 1, minus one, is the end.",
    idea: ["Lower bound finds the leftmost spot where target could go.", "If that spot does not hold target, it is absent.", "The leftmost spot for target + 1 is just past the last copy of target (integers only)."],
    code: `from bisect import bisect_left
def searchRange(nums, target):
    lo = bisect_left(nums, target)
    if lo == len(nums) or nums[lo] != target:
        return [-1, -1]
    return [lo, bisect_left(nums, target + 1) - 1]`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const a = [5, 7, 7, 8, 8, 8, 10], t = 8, frames: CellsFrame[] = [];
      const first = lowerBound(a, t, frames, `first ${t}`);
      frames.push({ note: `First index with value ≥ ${t} is ${first}, and it holds ${t}: start = ${first}`, tones: { [`0:${first}`]: "found" }, marks: [{ i: first, label: "first" }] });
      const last = lowerBound(a, t + 1, frames, `first value ≥ ${t + 1}`) - 1;
      frames.push({ note: `First index with value ≥ ${t + 1} is ${last + 1}, so the last ${t} is at ${last} → [${first}, ${last}]`, tones: range(first, last, 0, "found"), marks: [{ i: first, label: "first" }, { i: last, label: "last" }] });
      return cells(`searchRange(…, ${t}) = [${first}, ${last}]`, [a], frames);
    },
  },

  "search-in-rotated-sorted-array": {
    approach: "Binary search where one half around mid is always sorted: check whether the target lies in that sorted half, and keep the half that can hold it.",
    idea: ["If nums[lo] ≤ nums[mid], the left half is sorted; otherwise the right half is.", "For the sorted half, a simple range check tells whether target is inside it.", "Keep that half if so, else the other half. Still O(log n)."],
    code: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const a = [6, 7, 8, 9, 10, 1, 2, 3, 4, 5], t = 5, n = a.length, frames: CellsFrame[] = [{ note: `Goal: find ${t} in a sorted array that was rotated at an unknown point. One side of mid is always sorted`, tones: range(0, n - 1, 0), marks: [{ i: 0, label: "lo" }, { i: n - 1, label: "hi" }] }]; let lo = 0, hi = n - 1, ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1, m = lmh(lo, mid, hi);
        if (a[mid] === t) { ans = mid; frames.push({ note: `nums[${mid}] = ${a[mid]} equals the target ${t}, so return ${mid}`, tones: span(lo, hi, n, mid, "found"), marks: m }); break; }
        const leftSorted = a[lo] <= a[mid], inside = leftSorted ? a[lo] <= t && t < a[mid] : a[mid] < t && t <= a[hi], goLeft = leftSorted === inside;
        frames.push({ note: `mid = ${mid}, nums[${mid}] = ${a[mid]}: the ${leftSorted ? `left part ${a[lo]}..${a[mid]}` : `right part ${a[mid]}..${a[hi]}`} is sorted and ${t} is ${inside ? "inside" : "outside"} it, so keep the ${goLeft ? "left" : "right"} half`, tones: { ...span(lo, hi, n, mid), ...(leftSorted ? range(lo, mid - 1, 0, "done") : range(mid + 1, hi, 0, "done")) }, marks: m });
        if (goLeft) hi = mid - 1; else lo = mid + 1;
      }
      frames.push({ note: `${t} is at index ${ans}, found after ${frames.length - 1} probes`, tones: { [`0:${ans}`]: "found" }, marks: [{ i: ans, label: "ans" }] });
      return cells(`search rotated for ${t} = ${ans}`, [a], frames);
    },
  },

  "find-minimum-in-rotated-sorted-array": {
    approach: "Binary search against the right end: if nums[mid] > nums[hi] the drop is right of mid, otherwise the minimum is at mid or to its left.",
    idea: ["The minimum is where the rotation drop happens.", "nums[mid] > nums[hi] means the right part contains the drop, so lo = mid + 1.", "Otherwise mid to hi is sorted and mid could be the minimum, so hi = mid. lo == hi is the answer."],
    code: `def findMin(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const a = [6, 7, 8, 9, 10, 1, 2, 3, 4, 5], n = a.length, frames: CellsFrame[] = [{ note: "Goal: find the smallest value, which sits right after the rotation drop. Compare nums[mid] with nums[hi] to see which side holds the drop", tones: range(0, n - 1, 0), marks: [{ i: 0, label: "lo" }, { i: n - 1, label: "hi" }] }]; let lo = 0, hi = n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1, right = a[mid] > a[hi];
        frames.push({ note: `mid = ${mid}, nums[${mid}] = ${a[mid]} is ${right ? `above nums[hi] = ${a[hi]}, so the drop is right of mid: lo = ${mid + 1}` : `not above nums[hi] = ${a[hi]}, so mid..hi is sorted and the minimum is at mid or left of it: hi = ${mid}`}`, tones: span(lo, hi, n, mid), marks: lmh(lo, mid, hi) });
        if (right) lo = mid + 1; else hi = mid;
      }
      frames.push({ note: `lo = hi = ${lo}, so the minimum is nums[${lo}] = ${a[lo]}`, tones: { [`0:${lo}`]: "found" }, marks: [{ i: lo, label: "min" }] });
      return cells(`findMin = ${a[lo]}`, [a], frames);
    },
  },

  "koko-eating-bananas": {
    approach: "Binary search on the speed k from 1 to max(piles): the hours needed only go down as k grows, so find the smallest k that fits in h.",
    idea: ["At speed k a pile p takes ceil(p / k) hours.", "If speed k works, every faster speed works too: the yes/no answers are monotonic.", "So binary search for the first speed that works."],
    code: `def minEatingSpeed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((p + mid - 1) // mid for p in piles) <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log max)", space: "O(1)",
    viz: () => {
      const piles = [3, 6, 7, 11], h = 8, sp = Array.from({ length: 11 }, (_, i) => i + 1), hrs = (v: number) => piles.reduce((s, p) => s + Math.ceil(p / v), 0), need = blank(11), fits = blank(11);
      const frames: CellsFrame[] = [{ note: `Goal: the slowest speed that finishes piles [${piles.join(", ")}] within ${h} hours. Hours only fall as speed rises, so binary search the speed`, rows: [sp, [...need], [...fits]], tones: range(0, 10, 0), marks: [{ i: 0, label: "lo" }, { i: 10, label: "hi" }] }]; let lo = 1, hi = 11;
      while (lo < hi) {
        const mid = (lo + hi) >> 1, t = hrs(mid), ok = t <= h; need[mid - 1] = t; fits[mid - 1] = ok ? "yes" : "no";
        frames.push({ note: `Speed ${mid}: ${piles.map((p) => `ceil(${p}/${mid})`).join(" + ")} = ${t} hours ${ok ? `≤ ${h}, it works, so try slower (hi = ${mid})` : `> ${h}, too slow, so go faster (lo = ${mid + 1})`}`, rows: [sp, [...need], [...fits]], tones: { ...range(lo - 1, hi - 1, 0), [`0:${mid - 1}`]: "active", [`2:${mid - 1}`]: ok ? "found" : "bad" }, marks: [{ i: lo - 1, label: "lo" }, { i: mid - 1, label: "mid" }, { i: hi - 1, label: "hi" }] });
        if (ok) hi = mid; else lo = mid + 1;
      }
      frames.push({ note: `lo = hi = ${lo}: the smallest speed that works is ${lo} bananas an hour`, rows: [sp, [...need], [...fits]], tones: { [`0:${lo - 1}`]: "found", [`2:${lo - 1}`]: "found" }, marks: [{ i: lo - 1, label: "ans" }] });
      return cells(`minEatingSpeed([${piles}], ${h}) = ${lo}`, [sp, blank(11), blank(11)], frames, ["speed", "hours", "≤ 8?"]);
    },
  },
  "find-peak-element": {
    approach: "Binary search on the slope: if nums[mid] < nums[mid + 1] a peak lies to the right, otherwise at mid or to its left.",
    idea: ["Outside the array counts as -∞, so walking uphill always ends at a peak.", "Rising at mid means some peak is right of mid; falling means mid or something left of it is a peak.", "Halving keeps a peak inside [lo, hi] until one index remains."],
    code: `def findPeakElement(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 1, 3, 5, 6, 4, 2, 1, 0], n = a.length, frames: CellsFrame[] = [{ note: "Goal: find any index bigger than both neighbours (outside the array counts as minus infinity). Follow the slope uphill", tones: range(0, n - 1, 0), marks: [{ i: 0, label: "lo" }, { i: n - 1, label: "hi" }] }]; let lo = 0, hi = n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1, up = a[mid] < a[mid + 1];
        frames.push({ note: `mid = ${mid}: ${a[mid]} ${up ? "<" : ">"} ${a[mid + 1]}, ${up ? `rising, so a peak lies to the right: lo = ${mid + 1}` : `falling, so mid or something left of it is a peak: hi = ${mid}`}`, tones: { ...span(lo, hi, n, mid), [`0:${mid + 1}`]: "window" }, marks: lmh(lo, mid, hi) });
        if (up) lo = mid + 1; else hi = mid;
      }
      frames.push({ note: `lo = hi = ${lo}: ${a[lo]} is bigger than ${lo ? `${a[lo - 1]} on its left and ` : ""}${a[lo + 1]} on its right, so it is a peak`, tones: { [`0:${lo}`]: "found" }, marks: [{ i: lo, label: "peak" }] });
      return cells(`findPeakElement([${a.join(",")}]) = ${lo}`, [a], frames);
    },
  },

  "find-k-closest-elements": {
    approach: "Binary search the left edge of the k-wide window: compare the distance to arr[mid] with the distance to arr[mid + k] and slide toward the closer side.",
    idea: ["The answer is a contiguous window arr[i .. i + k - 1], with i in 0 .. n - k.", "If x - arr[mid] > arr[mid + k] - x, the element just right of the window is closer than its leftmost one, so the window must start later.", "Otherwise starting at mid (or earlier) is at least as good. Ties prefer the smaller element, which this keeps."],
    code: `def findClosestElements(arr, k, x):
    lo, hi = 0, len(arr) - k
    while lo < hi:
        mid = (lo + hi) // 2
        if x - arr[mid] > arr[mid + k] - x:
            lo = mid + 1
        else:
            hi = mid
    return arr[lo:lo + k]`,
    lang: "python", time: "O(log(n - k) + k)", space: "O(1) besides the output",
    viz: () => {
      const a = [1, 3, 4, 6, 7, 9, 12, 13, 15, 18], k = 2, x = 4, n = a.length, frames: CellsFrame[] = [{ note: `Goal: the ${k} numbers closest to x = ${x}. They form a window starting at some index in 0..${n - k}, so binary search that start`, tones: range(0, n - 1, 0), marks: [{ i: 0, label: "lo" }, { i: n - k, label: "hi" }] }]; let lo = 0, hi = n - k;
      while (lo < hi) {
        const mid = (lo + hi) >> 1, dl = x - a[mid], dr = a[mid + k] - x, later = dl > dr;
        frames.push({ note: `Window at ${mid} is [${a.slice(mid, mid + k).join(", ")}]: left edge ${a[mid]} is ${dl} from ${x}, the next number ${a[mid + k]} is ${dr} away → ${later ? `${a[mid + k]} is closer, so the window starts later (lo = ${mid + 1})` : `the left edge is at least as close, so the start is at ${mid} or earlier (hi = ${mid})`}`, tones: { ...range(mid, mid + k - 1, 0), [`0:${mid}`]: "active", [`0:${mid + k}`]: later ? "found" : "bad" }, marks: lmh(lo, mid, hi) });
        if (later) lo = mid + 1; else hi = mid;
      }
      frames.push({ note: `Start = ${lo}, so the ${k} closest numbers are [${a.slice(lo, lo + k).join(", ")}]`, tones: range(lo, lo + k - 1, 0, "found"), marks: [{ i: lo, label: "start" }] });
      return cells(`findClosestElements(k=${k}, x=${x}) = [${a.slice(lo, lo + k).join(", ")}]`, [a], frames);
    },
  },

  "sort-integers-by-the-number-of-1-bits": {
    approach: "Sort with the key (number of 1 bits, value): fewer set bits first, ties broken by the value itself.",
    idea: ["bin(x).count(\"1\") (or x.bit_count()) gives the set-bit count.", "A tuple key sorts by the first field, then the second.", "Python's sort is O(n log n) and stable."],
    code: `def sortByBits(arr):
    return sorted(arr, key=lambda x: (bin(x).count("1"), x))`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [7, 0, 3, 5, 8, 1, 6, 4, 2], bits = (x: number) => x.toString(2).split("").filter((c) => c === "1").length, b = a.map(bits), bin = a.map((x) => x.toString(2)), out: (string | number)[] = blank(a.length), frames: CellsFrame[] = [];
      const R = () => [a, bin, b, [...out]];
      frames.push({ note: `Goal: sort [${a.join(", ")}] by the count of 1 bits, and by value when counts tie`, rows: R() });
      frames.push({ note: "Key for each value: write it in binary and count the 1s", rows: R(), tones: range(0, a.length - 1, 2) });
      let at = 0;
      for (const c of [...new Set(b)].sort((x, y) => x - y)) {
        const grp = a.filter((x) => bits(x) === c).sort((x, y) => x - y); grp.forEach((x) => (out[at++] = x));
        frames.push({ note: `${c} set bit${c === 1 ? "" : "s"}: ${grp.length > 1 ? `[${grp.join(", ")}] tie, so they go in value order` : `only ${grp[0]}`}, placed next`, rows: R(), tones: { ...tones(a.map((x, i) => (bits(x) === c ? `2:${i}` : "")).filter(Boolean), "active"), ...range(at - grp.length, at - 1, 3, "found") } });
      }
      frames.push({ note: `Sorted by (1 bits, value): [${out.join(", ")}]`, rows: R(), tones: range(0, a.length - 1, 3, "found") });
      return cells(`sortByBits = [${out.join(", ")}]`, [a, bin, b, blank(a.length)], frames, ["value", "binary", "1 bits", "sorted"]);
    },
  },

  "largest-number": {
    approach: "Sort the numbers as strings with the rule \"a before b when a + b > b + a\", then join; an all-zero result collapses to \"0\".",
    idea: ["For two pieces, the better order is whichever concatenation is larger, e.g. 9 + 34 = \"934\" beats \"349\".", "This comparison is transitive, so sorting by it gives the best order for all pieces.", "If the biggest piece is \"0\", every piece is zero, so return \"0\" instead of \"000\"."],
    code: `from functools import cmp_to_key
def largestNumber(nums):
    s = sorted(map(str, nums), key=cmp_to_key(lambda a, b: (a + b < b + a) - (a + b > b + a)))
    return "0" if s[0] == "0" else "".join(s)`,
    lang: "python", time: "O(n log n · d) for d digits", space: "O(n·d)",
    viz: () => {
      const a = ["3", "30", "34", "5", "9"], frames: CellsFrame[] = [];
      for (let i = 1; i < a.length; i++) for (let j = i; j > 0; j--) {
        const x = a[j - 1], y = a[j], swap = y + x > x + y;
        frames.push({ note: `"${x}" vs "${y}": "${x + y}" ${swap ? "<" : ">"} "${y + x}" → ${swap ? `"${y}" goes first, swap` : "already in order"}`, rows: [[...(swap ? ((a[j - 1] = y), (a[j] = x), a) : a)]], tones: { [`0:${j - 1}`]: swap ? "found" : "done", [`0:${j}`]: "active" } });
        if (!swap) break;
      }
      frames.push({ note: `Join → "${a.join("")}"`, rows: [[...a]], tones: range(0, a.length - 1, 0, "found") });
      return cells(`largestNumber = "${a.join("")}"`, [["3", "30", "34", "5", "9"]], frames);
    },
  },

  "reorder-data-in-log-files": {
    approach: "Sort with a key: letter-logs get (0, content, identifier) so they sort by content then id; digit-logs get (1,) so they go last and, with a stable sort, keep their order.",
    idea: ["Split each log once into identifier and the rest; the first character of the rest tells letter-log from digit-log.", "Letter-logs order by content, ties by identifier.", "All digit-logs share the same key, and Python's sort is stable, so their original order survives."],
    code: `def reorderLogFiles(logs):
    def key(log):
        ident, rest = log.split(" ", 1)
        return (0, rest, ident) if rest[0].isalpha() else (1,)
    return sorted(logs, key=key)`,
    lang: "python", time: "O(n log n · L)", space: "O(n·L)",
    viz: () => {
      const logs = ["dig1 8 1 5 1", "let1 art can", "dig2 3 6", "let2 own kit dig", "let3 art zero"], parts = logs.map((l) => { const i = l.indexOf(" "); return [l.slice(0, i), l.slice(i + 1)]; }), kind = parts.map(([, r]) => (/[a-z]/i.test(r[0]) ? "letter" : "digit"));
      const rows = (order: number[]) => order.map((i) => [parts[i][0], parts[i][1], kind[i]] as (string | number | null)[]), idx = logs.map((_, i) => i), frames: TableFrame[] = [];
      idx.forEach((i) => frames.push({ note: `"${logs[i]}": content starts with '${parts[i][1][0]}' → ${kind[i]}-log, key ${kind[i] === "letter" ? `(0, "${parts[i][1]}", "${parts[i][0]}")` : "(1,)"}`, cells: rows(idx), active: [i, 2] }));
      const sorted = [...idx].sort((x, y) => (kind[x] !== kind[y] ? (kind[x] === "letter" ? -1 : 1) : kind[x] === "digit" ? 0 : parts[x][1] < parts[y][1] ? -1 : parts[x][1] > parts[y][1] ? 1 : parts[x][0] < parts[y][0] ? -1 : 1));
      frames.push({ note: "Sorted: letter-logs by content (\"art can\" < \"art zero\" < \"own kit dig\"), then digit-logs in their original order", cells: rows(sorted), tones: { ...tones(sorted.map((i, r) => (kind[i] === "letter" ? `${r}:1` : "")).filter(Boolean), "found"), ...tones(sorted.map((i, r) => (kind[i] === "digit" ? `${r}:0` : "")).filter(Boolean), "done") } });
      return table("Reorder log files", logs.map((_, i) => String(i)), ["id", "content", "type"], frames);
    },
  },

  "top-k-frequent-elements": {
    approach: "Count with a Counter, then keep the k most frequent values with a size-k min-heap on count (heapq.nlargest does exactly that).",
    idea: ["Counting takes one pass.", "A min-heap of size k holds the k best counts so far; a bigger count evicts the smallest.", "O(n log k), which beats sorting all distinct values when k is small. (Bucket sort by count gives O(n).)"],
    code: `import heapq
from collections import Counter
def topKFrequent(nums, k):
    cnt = Counter(nums)
    return heapq.nlargest(k, cnt, key=cnt.get)`,
    lang: "python", time: "O(n log k)", space: "O(n)",
    viz: () => {
      const nums = [1, 1, 1, 2, 2, 3, 3, 3, 3, 4, 5, 5], k = 2, cnt = new Map<number, number>(), h: [number, number][] = []; nums.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
      const frames: StackFrame[] = [{ note: `Goal: the ${k} most frequent values in [${nums.join(", ")}]. Count first, then keep a min-heap of size ${k} ordered by count`, items: [] }, { note: `Counts: ${[...cnt].map(([v, c]) => `${v} ×${c}`).join(", ")}`, items: [] }];
      for (const [v, c] of cnt) {
        h.push([c, v]); h.sort((x, y) => x[0] - y[0]); const ev = h.length > k ? h.shift()! : null;
        frames.push({ note: ev ? `Push ${v} (×${c}): the heap is over ${k}, so pop the least frequent, ${ev[1] === v ? `${v} itself` : `${ev[1]} (×${ev[0]})`}` : `Push ${v} (×${c}): the heap holds ${h.length} of ${k}, nothing to pop yet`, items: h.map(([c2, v2]) => `${v2} (×${c2})`).reverse(), incoming: `${v}×${c}`, popped: ev ? [`${ev[1]}×${ev[0]}`] : [] });
      }
      const res = [...h].sort((x, y) => y[0] - x[0]).map(([, v]) => v);
      frames.push({ note: `The heap keeps the ${k} highest counts, so the answer is [${res.join(", ")}]`, items: h.map(([c2, v2]) => `${v2} (×${c2})`).reverse() });
      return { kind: "stack", title: `topKFrequent(…, ${k}) = [${res.join(", ")}]`, frames };
    },
  },

  "sort-list": {
    approach: "Merge sort on the list: split at the middle with slow/fast pointers, sort both halves, and merge them by relinking nodes.",
    idea: ["Slow moves one step and fast two; when fast ends, slow is at the middle. Cut the list there.", "Sort each half recursively.", "Merge two sorted lists by always linking the smaller head. O(n log n) time and only the recursion stack as extra space."],
    code: `def sortList(head):
    if not head or not head.next:
        return head
    slow, fast = head, head.next
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    mid, slow.next = slow.next, None
    a, b = sortList(head), sortList(mid)
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`,
    lang: "python", time: "O(n log n)", space: "O(log n) recursion",
    viz: () => {
      const values = [4, 2, 1, 3], next = values.map((_, i) => (i + 1 < values.length ? i + 1 : -1)), frames: ListFrame[] = [], show = (ids: number[]) => ids.map((i) => values[i]).join(" → ");
      const link = (ids: number[]) => ids.forEach((id, k) => (next[id] = k + 1 < ids.length ? ids[k + 1] : -1));
      const sort = (ids: number[]): number[] => {
        if (ids.length < 2) return ids;
        const m = Math.ceil(ids.length / 2), L = ids.slice(0, m), R = ids.slice(m); next[L[L.length - 1]] = -1;
        frames.push({ note: `Split ${show(ids)} at the middle → ${show(L)} | ${show(R)}`, next: [...next], ptrs: [{ i: L[0], label: "head" }, { i: R[0], label: "mid" }], tones: { ...Object.fromEntries(L.map((i) => [i, "window"])), ...Object.fromEntries(R.map((i) => [i, "active"])) } });
        const a = sort(L), b = sort(R), out: number[] = []; let i = 0, j = 0;
        while (i < a.length && j < b.length) out.push(values[a[i]] <= values[b[j]] ? a[i++] : b[j++]);
        out.push(...a.slice(i), ...b.slice(j)); link(out);
        frames.push({ note: `Merge ${show(a)} with ${show(b)}, giving ${show(out)}`, next: [...next], ptrs: [{ i: out[0], label: "head" }], tones: Object.fromEntries(out.map((i) => [i, out.length === values.length ? "found" : "done"])) });
        return out;
      };
      const res = sort(values.map((_, i) => i));
      return { kind: "list", title: `sortList: ${show(res)}`, values, frames };
    },
  },

  "sort-an-array": {
    approach: "Merge sort: split in half, sort each half recursively, merge the two sorted halves. O(n log n) in every case.",
    idea: ["A list of 0 or 1 items is sorted.", "Merging two sorted lists takes linear time by repeatedly taking the smaller front.", "log n levels of splitting × O(n) merging per level = O(n log n), with no bad inputs (unlike quicksort's worst case)."],
    code: `def sortArray(nums):
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    a, b = sortArray(nums[:mid]), sortArray(nums[mid:])
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    return out + a[i:] + b[j:]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a0 = [5, 1, 1, 2, 0, 0], a = [...a0], n = a.length, frames: CellsFrame[] = [{ note: "Goal: sort by splitting into halves until single numbers remain, then merging sorted halves back together", rows: [[...a]] }];
      const go = (lo: number, hi: number) => {
        if (hi <= lo) return;
        const m = (lo + hi) >> 1;
        frames.push({ note: `Split [${lo}..${hi}] = [${a.slice(lo, hi + 1).join(", ")}] into [${lo}..${m}] and [${m + 1}..${hi}]`, rows: [[...a]], tones: { ...range(lo, m, 0), ...range(m + 1, hi, 0, "active") } });
        go(lo, m); go(m + 1, hi);
        const L = a.slice(lo, m + 1), R = a.slice(m + 1, hi + 1), out: number[] = []; let i = 0, j = 0;
        while (i < L.length && j < R.length) out.push(L[i] <= R[j] ? L[i++] : R[j++]);
        out.push(...L.slice(i), ...R.slice(j)); out.forEach((v, q) => (a[lo + q] = v));
        const all = hi - lo + 1 === n;
        frames.push({ note: all ? `Merge the last two sorted halves [${L.join(", ")}] and [${R.join(", ")}]: the whole array is sorted, [${out.join(", ")}]` : `Merge sorted [${L.join(", ")}] and [${R.join(", ")}] at [${lo}..${hi}] into [${out.join(", ")}]`, rows: [[...a]], tones: range(lo, hi, 0, all ? "found" : "done") });
      };
      go(0, n - 1);
      return cells(`sortArray([${a0.join(",")}]) = [${a.join(", ")}]`, [a0], frames);
    },
  },

  "kth-largest-element-in-an-array": {
    approach: "Keep a min-heap of the k largest values seen; push each number and pop the smallest whenever the heap grows past k. The heap top is the answer.",
    idea: ["The kth largest is the smallest of the top k.", "A size-k min-heap keeps exactly the top k, with that smallest one on top.", "O(n log k) time, O(k) space. (Quickselect averages O(n).)"],
    code: `import heapq
def findKthLargest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]`,
    lang: "python", time: "O(n log k)", space: "O(k)",
    viz: () => topK([3, 2, 1, 5, 6, 4], 2),
  },

  "k-closest-points-to-origin": {
    approach: "Keep a max-heap of size k on squared distance (store negatives in heapq); a closer point evicts the farthest kept one.",
    idea: ["Compare x² + y²; the square root is not needed.", "The heap holds the k closest so far with the farthest on top, ready to be evicted.", "After all points, the heap is the answer, in any order."],
    code: `import heapq
def kClosest(points, k):
    h = []
    for x, y in points:
        heapq.heappush(h, (-(x * x + y * y), x, y))
        if len(h) > k:
            heapq.heappop(h)
    return [[x, y] for _, x, y in h]`,
    lang: "python", time: "O(n log k)", space: "O(k)",
    viz: () => {
      const pts: [number, number][] = [[3, 3], [5, -1], [-2, 4], [1, 1], [0, -2]], k = 2, d = (i: number) => pts[i][0] ** 2 + pts[i][1] ** 2;
      const nodes = [{ id: 0, label: "O", x: 30, y: 50 }, ...pts.map(([x, y], i) => ({ id: i + 1, label: `${x},${y}`, x: 30 + x * 12, y: 50 - y * 11 }))];
      const heap: number[] = [], gone: number[] = [], frames: GraphFrame[] = [];
      const tn = (cur?: number) => ({ 0: "muted" as Tone, ...Object.fromEntries(heap.map((i) => [i + 1, "window"])), ...Object.fromEntries(gone.map((i) => [i + 1, "muted"])), ...(cur != null ? { [cur + 1]: (heap.includes(cur) ? "active" : "bad") as Tone } : {}) });
      const badges = () => Object.fromEntries(pts.map((_, i) => [i + 1, `d²=${d(i)}`]));
      pts.forEach((_, i) => {
        heap.push(i); heap.sort((a, b) => d(b) - d(a)); let ev = -1;
        if (heap.length > k) { ev = heap.shift()!; gone.push(ev); }
        frames.push({ note: `(${pts[i]}) has d² = ${d(i)}${ev >= 0 ? `; heap over ${k} → evict the farthest (${pts[ev]}, d² = ${d(ev)})` : ""}. Kept: ${heap.map((j) => `(${pts[j]})`).join(", ")}`, tones: tn(i), badges: badges() });
      });
      frames.push({ note: `Answer: ${heap.map((j) => `[${pts[j]}]`).join(", ")}`, tones: { 0: "muted", ...Object.fromEntries(heap.map((i) => [i + 1, "found"])), ...Object.fromEntries(gone.map((i) => [i + 1, "muted"])) }, badges: badges() });
      return { kind: "graph", title: `${k} closest points to the origin`, nodes, edges: [], frames };
    },
  },
  "check-if-all-the-integers-in-a-range-are-covered": {
    approach: "Difference array: +1 where each range starts, -1 just after it ends; a running sum gives how many ranges cover each x, and any 0 inside [left, right] fails.",
    idea: ["Values are at most 50, so a small array is enough.", "diff[a] += 1 and diff[b + 1] -= 1 for each range.", "Prefix-summing diff gives the cover count at every x; check each x in [left, right]."],
    code: `def isCovered(ranges, left, right):
    diff = [0] * 52
    for a, b in ranges:
        diff[a] += 1
        diff[b + 1] -= 1
    cover = 0
    for x in range(1, right + 1):
        cover += diff[x]
        if x >= left and cover == 0:
            return False
    return True`,
    lang: "python", time: "O(n + 50)", space: "O(50)",
    viz: () => {
      const ranges = [[1, 2], [3, 4], [5, 6]], left = 2, right = 5, xs = [1, 2, 3, 4, 5, 6, 7], diff = Array(8).fill(0), cov = blank(7), frames: CellsFrame[] = [];
      ranges.forEach(([a, b]) => { diff[a] += 1; diff[b + 1] -= 1; frames.push({ note: `Range [${a}, ${b}]: diff[${a}] += 1, diff[${b + 1}] -= 1`, rows: [xs, diff.slice(1), [...cov]], tones: { [`1:${a - 1}`]: "found", [`1:${b}`]: "bad" } }); });
      let c = 0, ok = true;
      for (let x = 1; x <= right; x++) {
        c += diff[x]; cov[x - 1] = c; const need = x >= left;
        frames.push({ note: `x = ${x}: covered by ${c} range${c === 1 ? "" : "s"}${need ? (c ? " ✓" : " → gap inside [2, 5], False") : " (left of the query, ignored)"}`, rows: [xs, diff.slice(1), [...cov]], tones: { ...range(left - 1, right - 1, 0), [`2:${x - 1}`]: need ? (c ? "found" : "bad") : "muted" } });
        if (need && !c) { ok = false; break; }
      }
      return cells(`isCovered([[1,2],[3,4],[5,6]], 2, 5) = ${ok ? "True" : "False"}`, [xs, diff.slice(1), blank(7)], frames, ["x", "diff", "cover"]);
    },
  },

  "corporate-flight-bookings": {
    approach: "Difference array: each booking adds seats at its first flight and subtracts them after its last; one prefix sum gives every flight's total.",
    idea: ["A booking [first, last, seats] touches a whole range, but only its two ends change the difference array.", "diff[first - 1] += seats, diff[last] -= seats (0-indexed).", "The running sum of diff is the seat count per flight. O(n + bookings)."],
    code: `from itertools import accumulate
def corpFlightBookings(bookings, n):
    diff = [0] * (n + 1)
    for first, last, seats in bookings:
        diff[first - 1] += seats
        diff[last] -= seats
    return list(accumulate(diff[:n]))`,
    lang: "python", time: "O(n + b)", space: "O(n)",
    viz: () => diffArray(5, [[0, 1, 10], [1, 2, 20], [1, 4, 25]]),
  },

  "car-pooling": {
    approach: "Difference array over the stops: passengers get on at from (+p) and off at to (-p); sweep the running load and fail if it ever exceeds capacity.",
    idea: ["Passengers leave at stop to, so the seat frees up exactly there: add -p at to, not to + 1.", "The prefix sum at each stop is how many people are in the car.", "Any prefix above capacity means the trips cannot all be served."],
    code: `def carPooling(trips, capacity):
    diff = [0] * 1001
    for p, a, b in trips:
        diff[a] += p
        diff[b] -= p
    load = 0
    for d in diff:
        load += d
        if load > capacity:
            return False
    return True`,
    lang: "python", time: "O(n + stops)", space: "O(stops)",
    viz: () => {
      const trips = [[2, 1, 5], [3, 3, 7]], cap = 4, stops = [0, 1, 2, 3, 4, 5, 6, 7], diff = Array(8).fill(0), load = blank(8), frames: CellsFrame[] = [];
      trips.forEach(([p, a, b]) => { diff[a] += p; diff[b] -= p; frames.push({ note: `${p} passengers ride ${a} → ${b}: diff[${a}] += ${p}, diff[${b}] -= ${p}`, rows: [stops, [...diff], [...load]], tones: { [`1:${a}`]: "found", [`1:${b}`]: "bad" } }); });
      let run = 0, ok = true;
      for (let x = 0; x < 8; x++) {
        run += diff[x]; load[x] = run; const over = run > cap;
        frames.push({ note: `Stop ${x}: ${run} in the car${over ? ` > capacity ${cap} → False` : ` ≤ ${cap}`}`, rows: [stops, [...diff], [...load]], tones: { [`2:${x}`]: over ? "bad" : "found", [`0:${x}`]: "active" } });
        if (over) { ok = false; break; }
      }
      return cells(`carPooling(capacity 4) = ${ok ? "True" : "False"}`, [stops, Array(8).fill(0), blank(8)], frames, ["stop", "diff", "load"]);
    },
  },

  "shifting-letters-ii": {
    approach: "Turn each shift into ±1 on a difference array, prefix-sum it to get the net shift per position, and rotate each letter by that amount mod 26.",
    idea: ["A forward shift over [a, b] is +1 there; backward is -1.", "diff[a] += v and diff[b + 1] -= v, then a running sum gives the total shift at each index.", "New letter = (old + shift) mod 26; Python's % keeps negatives in range."],
    code: `def shiftingLetters(s, shifts):
    diff = [0] * (len(s) + 1)
    for a, b, d in shifts:
        v = 1 if d else -1
        diff[a] += v
        diff[b + 1] -= v
    out, run = [], 0
    for i, ch in enumerate(s):
        run += diff[i]
        out.append(chr((ord(ch) - 97 + run) % 26 + 97))
    return "".join(out)`,
    lang: "python", time: "O(n + q)", space: "O(n)",
    viz: () => {
      const s = "abc".split(""), shifts = [[0, 1, 0], [1, 2, 1], [0, 2, 1]], diff = Array(s.length + 1).fill(0), sh = blank(s.length), out = blank(s.length), frames: CellsFrame[] = [];
      shifts.forEach(([a, b, d]) => { const v = d ? 1 : -1; diff[a] += v; diff[b + 1] -= v; frames.push({ note: `Shift [${a}, ${b}] ${d ? "forward (+1)" : "backward (-1)"}: diff[${a}] ${d ? "+" : "-"}= 1, diff[${b + 1}] ${d ? "-" : "+"}= 1`, rows: [s, diff.slice(0, s.length), [...sh], [...out]], tones: { [`1:${a}`]: "found", ...(b + 1 < s.length ? { [`1:${b + 1}`]: "bad" } : {}) } }); });
      let run = 0;
      s.forEach((ch, i) => { run += diff[i]; sh[i] = run; out[i] = String.fromCharCode(((ch.charCodeAt(0) - 97 + run) % 26 + 26) % 26 + 97); frames.push({ note: `Index ${i}: net shift ${run}, '${ch}' becomes '${out[i]}'`, rows: [s, diff.slice(0, s.length), [...sh], [...out]], tones: { [`2:${i}`]: "active", [`3:${i}`]: "found" } }); });
      return cells(`shiftingLetters("abc") = "${out.join("")}"`, [s, diff.slice(0, s.length), blank(s.length), blank(s.length)], frames, ["s", "diff", "shift", "result"]);
    },
  },

  "binary-tree-preorder-traversal": {
    approach: "Iterative preorder with a stack: pop a node, output it, push its right child then its left child so the left comes out first.",
    idea: ["Preorder is node, then left subtree, then right subtree.", "A stack is last-in-first-out, so pushing right before left makes left the next pop.", "Each node is pushed and popped once."],
    code: `def preorderTraversal(root):
    out, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return out`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => treeTraversal("pre", [1, 2, 3, 4, 5, null, 6]),
  },

  "binary-tree-inorder-traversal": {
    approach: "Iterative inorder: slide left pushing nodes on a stack; pop one, output it, then move to its right child and repeat.",
    idea: ["Inorder is left subtree, node, right subtree.", "Going left as far as possible stacks the path; the top is the next node to output.", "After outputting a node its right subtree comes next, handled by the same loop."],
    code: `def inorderTraversal(root):
    out, stack, node = [], [], root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        out.append(node.val)
        node = node.right
    return out`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => treeTraversal("in", [1, 2, 3, 4, 5, null, 6]),
  },

  "binary-tree-level-order-traversal": {
    approach: "BFS with a queue, one level at a time: the queue's size at the start of a round is exactly the number of nodes on that level.",
    idea: ["Start the queue with the root.", "Pop len(queue) nodes into one level list, pushing their children for the next round.", "Repeat until the queue is empty."],
    code: `from collections import deque
def levelOrder(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level)
    return out`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, null, 6], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: list the nodes level by level. The queue starts with the root", tones: { 0: "window" } }], out: number[][] = [], done: Record<number, Tone> = {}, badges: Record<number, string> = {}; let q = [0], lv = 1;
      while (q.length) {
        const size = q.length, level: number[] = [];
        for (let k = 0; k < size; k++) {
          const i = q.shift()!, ch = kids[i].filter((c): c is number => c != null); level.push(val(i)); q.push(...ch); badges[i] = `L${lv}`;
          frames.push({ note: `Level ${lv}, ${k + 1} of ${size}: pop ${val(i)}${ch.length ? ` and queue ${ch.length > 1 ? "its children" : "its child"} ${ch.map(val).join(" and ")}` : ", it has no children"}${k === size - 1 ? `. Level ${lv} is complete: [${level.join(", ")}]` : ""}`, tones: { ...done, ...Object.fromEntries(q.map((c) => [c, "window" as Tone])), [i]: "active" }, badges: { ...badges } });
          done[i] = "done";
        }
        out.push(level); lv++;
      }
      frames.push({ note: `The queue is empty: ${JSON.stringify(out)}`, tones: Object.fromEntries(Object.keys(done).map((k) => [+k, "found" as Tone])), badges: { ...badges } });
      return tree(`levelOrder = ${JSON.stringify(out)}`, nodes, frames);
    },
  },

  "invert-binary-tree": {
    approach: "Recursively invert both subtrees, then swap them; every node ends up with its children mirrored.",
    idea: ["Mirroring a tree = mirroring each subtree and exchanging left and right.", "The empty tree is its own mirror.", "Each node is visited once."],
    code: `def invertTree(root):
    if root:
        root.left, root.right = invertTree(root.right), invertTree(root.left)
    return root`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const v = [4, 2, 7, 1, 3, 6, 9], { nodes } = T(v), frames: TreeFrame[] = [{ note: "Goal: mirror the tree. Invert both subtrees (right one first, as in the code), then swap them at every node", labels: Object.fromEntries(v.map((x, i) => [i, String(x)])) }], n = v.length, done: Record<number, Tone> = {};
      const sub = (i: number): number[] => (i >= n ? [] : [i, ...sub(2 * i + 1), ...sub(2 * i + 2)]);
      const lab = () => Object.fromEntries(v.map((x, i) => [i, String(x)]));
      const go = (i: number) => {
        if (2 * i + 1 >= n) { frames.push({ note: `${v[i]} is a leaf: both children are empty, nothing to swap`, tones: { ...done, [i]: "active" }, labels: lab() }); done[i] = "done"; return; }
        frames.push({ note: `At ${v[i]}: first invert the right subtree (root ${v[2 * i + 2]}), then the left (root ${v[2 * i + 1]})`, tones: { ...done, [i]: "active" }, labels: lab() });
        go(2 * i + 2); go(2 * i + 1);
        const a = v[2 * i + 1], b = v[2 * i + 2], L = sub(2 * i + 1), R = sub(2 * i + 2), lv = L.map((k) => v[k]); L.forEach((k, j) => (v[k] = v[R[j]])); R.forEach((k, j) => (v[k] = lv[j]));
        done[i] = "done"; frames.push({ note: `Both subtrees of ${v[i]} are inverted: swap its children, so ${a} and ${b} trade sides`, tones: { ...done, [i]: "active", ...Object.fromEntries([...L, ...R].map((k) => [k, "window" as Tone])) }, labels: lab() });
      };
      go(0);
      frames.push({ note: `Mirrored: level order is now [${v.join(", ")}]`, tones: Object.fromEntries(v.map((_, i) => [i, "found" as Tone])), labels: lab() });
      return tree("Invert [4,2,7,1,3,6,9]", nodes, frames);
    },
  },

  "minimum-depth-of-binary-tree": {
    approach: "BFS level by level and return the depth of the first leaf reached; it is the closest leaf to the root.",
    idea: ["Minimum depth counts nodes down to the nearest leaf (a node with no children).", "BFS visits nodes in order of depth, so the first leaf seen is the nearest.", "A node with only one child is not a leaf, which is the usual trap for a recursive min()."],
    code: `from collections import deque
def minDepth(root):
    if not root:
        return 0
    q = deque([(root, 1)])
    while q:
        node, d = q.popleft()
        if not node.left and not node.right:
            return d
        if node.left:
            q.append((node.left, d + 1))
        if node.right:
            q.append((node.right, d + 1))`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6, null, 7, 8, 9, null, 10, null], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: depth of the nearest leaf. BFS pops nodes in order of depth, so the first leaf popped is the answer", tones: { 0: "window" } }], q: [number, number][] = [[0, 1]], done: Record<number, Tone> = {}, badges: Record<number, string> = {}; let ans = 0;
      while (q.length) {
        const [i, d] = q.shift()!, ch = kids[i].filter((c): c is number => c != null); badges[i] = `d${d}`;
        if (!ch.length) { ans = d; frames.push({ note: `Pop ${val(i)} at depth ${d}: it has no children, so it is the first leaf. Answer ${d}`, tones: { ...done, [i]: "found" }, badges: { ...badges } }); break; }
        ch.forEach((c) => q.push([c, d + 1]));
        frames.push({ note: `Pop ${val(i)} at depth ${d}: ${ch.length === 1 ? "it has only one child, so it is not a leaf" : "it has two children"}; queue ${ch.map(val).join(" and ")}`, tones: { ...done, ...Object.fromEntries(q.map(([c]) => [c, "window" as Tone])), [i]: "active" }, badges: { ...badges } });
        done[i] = "done";
      }
      return tree(`minDepth = ${ans}`, nodes, frames);
    },
  },

  "maximum-depth-of-binary-tree": {
    approach: "Post-order recursion: a node's depth is 1 + the larger depth of its two subtrees; an empty tree has depth 0.",
    idea: ["The deepest path goes through whichever child subtree is deeper.", "Leaves report 1, so each parent adds one level on top of its deeper child.", "The root's answer is the maximum depth."],
    code: `def maxDepth(root):
    if not root:
        return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [3, 9, 20, 1, null, 15, 7, 2, null, null, null, 5, null], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: the number of levels. Each node reports 1 + the deeper of its two subtrees, children before parents", tones: {} }], badges: Record<number, string> = {}, done: Record<number, Tone> = {};
      const go = (i: number | null): number => { if (i == null) return 0; const a = go(kids[i][0]), b = go(kids[i][1]), d = 1 + Math.max(a, b); badges[i] = `${d}`; frames.push({ note: `${val(i)}: left depth ${a}, right depth ${b} → 1 + ${Math.max(a, b)} = ${d}${a + b === 0 ? " (a leaf)" : ""}`, tones: { ...done, [i]: "active" }, badges: { ...badges } }); done[i] = "done"; return d; };
      const ans = go(0);
      frames.push({ note: `The root reports ${ans}, so the tree has ${ans} levels`, tones: Object.fromEntries(Object.keys(done).map((k) => [+k, "found" as Tone])), badges: { ...badges } });
      return tree(`maxDepth = ${ans}`, nodes, frames);
    },
  },
  "diameter-of-binary-tree": {
    approach: "Post-order heights: at every node the longest path through it is left height + right height edges; track the maximum while returning heights.",
    idea: ["The longest path bends at some highest node, going down into both of its subtrees.", "Its length in edges is height(left) + height(right).", "One recursion returns heights upward and updates the best diameter on the way."],
    code: `def diameterOfBinaryTree(root):
    best = 0
    def height(node):
        nonlocal best
        if not node:
            return 0
        a, b = height(node.left), height(node.right)
        best = max(best, a + b)
        return 1 + max(a, b)
    height(root)
    return best`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [1, 2, null, 4, 5, null, null, 6, null, null, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: the longest path between any two nodes, counted in edges. It bends at one node: left height + right height", tones: {} }], badges: Record<number, string> = {}, done: Record<number, Tone> = {}; let best = 0, at = -1;
      const go = (i: number | null): number => {
        if (i == null) return 0; const a = go(kids[i][0]), b = go(kids[i][1]), up = a + b > best; if (up) { best = a + b; at = i; } badges[i] = `h${1 + Math.max(a, b)}`;
        frames.push({ note: `${val(i)}: left height ${a}, right height ${b} → a path through it has ${a + b} edge${a + b === 1 ? "" : "s"}${up ? `, a new best` : `, best stays ${best}`}; it reports height ${1 + Math.max(a, b)}`, tones: { ...done, ...(at >= 0 ? { [at]: "found" as Tone } : {}), [i]: i === at ? "found" : "active" }, badges: { ...badges } });
        done[i] = "done"; return 1 + Math.max(a, b);
      };
      go(0);
      frames.push({ note: `The longest path bends at ${val(at)} and has ${best} edges`, tones: { [at]: "found" }, badges: { ...badges } });
      return tree(`diameter = ${best}`, nodes, frames);
    },
  },

  "balanced-binary-tree": {
    approach: "One post-order pass that returns each subtree's height, or -1 as soon as any subtree is unbalanced, so nothing is computed twice.",
    idea: ["A tree is balanced when, at every node, the two subtree heights differ by at most 1.", "Return -1 upward the moment a node breaks the rule; parents pass it on.", "Otherwise return 1 + max(heights). O(n) instead of O(n²)."],
    code: `def isBalanced(root):
    def height(node):
        if not node:
            return 0
        a, b = height(node.left), height(node.right)
        if a < 0 or b < 0 or abs(a - b) > 1:
            return -1
        return 1 + max(a, b)
    return height(root) >= 0`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [1, 2, 2, 3, 3, null, null, 4, 4], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {};
      const go = (i: number | null): number => {
        if (i == null) return 0; const a = go(kids[i][0]), b = go(kids[i][1]), bad = a < 0 || b < 0 || Math.abs(a - b) > 1, h = bad ? -1 : 1 + Math.max(a, b); badges[i] = bad ? "✗" : `h${h}`;
        frames.push({ note: a < 0 || b < 0 ? `${val(i)}: a child already reported unbalanced → pass -1 up` : `${val(i)}: heights ${a} and ${b} differ by ${Math.abs(a - b)}${bad ? " > 1 → unbalanced, return -1" : ` → height ${h}`}`, tones: { [i]: bad ? "bad" : "active" }, badges: { ...badges } });
        return h;
      };
      const ok = go(0) >= 0;
      return tree(`isBalanced = ${ok ? "True" : "False"}`, nodes, trail(frames));
    },
  },

  "same-tree": {
    approach: "Recursively: two trees are the same when both are empty, or both roots have equal values and their left subtrees and right subtrees are the same.",
    idea: ["If one side is empty, they match only when both are.", "Compare the root values, then recurse into left with left and right with right.", "The first difference stops the whole check (short-circuit and)."],
    code: `def isSameTree(p, q):
    if not p or not q:
        return p is q
    return p.val == q.val and isSameTree(p.left, q.left) and isSameTree(p.right, q.right)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const p: V = [1, 2, 3, 4, 5, 6, 7], q: V = [1, 2, 3, 4, 9, 6, 7], { nodes, kids } = T(p), labels: Record<number, string> = Object.fromEntries(p.map((v, i) => [i, `${v}/${q[i] ?? "∅"}`])), frames: TreeFrame[] = [{ note: "Goal: are p and q identical? Compare node by node (labels show p/q), left subtree before right, and stop at the first difference", tones: { 0: "window" }, labels }], seen: Record<number, Tone> = {};
      const go = (i: number | null): boolean => {
        if (i == null) return true; const eq = p[i] === (q[i] ?? null);
        frames.push({ note: `Compare p ${p[i]} with q ${q[i] ?? "none"}: ${eq ? "equal, so check the left subtrees, then the right" : "different, so return False and stop"}`, tones: { ...seen, [i]: eq ? "active" : "bad" }, labels });
        seen[i] = eq ? "done" : "bad"; return eq && go(kids[i][0]) && go(kids[i][1]);
      };
      const ok = go(0), skipped = nodes.filter((nd) => seen[nd.id] === undefined).map((nd) => nd.id);
      frames.push({ note: `isSameTree is ${ok ? "True" : "False"}: the first difference stops the check${skipped.length ? `, so nodes ${skipped.map((k) => p[k]).join(", ")} were never compared` : ""}`, tones: { ...seen, ...Object.fromEntries(skipped.map((k) => [k, "muted" as Tone])), ...(ok ? Object.fromEntries(nodes.map((nd) => [nd.id, "found" as Tone])) : { [Object.keys(seen).map(Number).find((k) => seen[k] === "bad")!]: "found" as Tone }) }, labels });
      return tree(`isSameTree = ${ok ? "True" : "False"} (labels are p/q)`, nodes, frames);
    },
  },

  "subtree-of-another-tree": {
    approach: "Walk every node of root and run a same-tree check against subRoot from there; any match means True.",
    idea: ["subRoot is a subtree when some node of root, together with all its descendants, equals subRoot.", "same(a, b) compares two trees node by node.", "Try it at each node in a traversal; worst case O(m·n)."],
    code: `def isSubtree(root, subRoot):
    def same(a, b):
        if not a or not b:
            return a is b
        return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)
    def walk(node):
        return bool(node) and (same(node, subRoot) or walk(node.left) or walk(node.right))
    return walk(root)`,
    lang: "python", time: "O(m·n)", space: "O(h)",
    viz: () => {
      const vals: V = [3, 4, 5, 1, 2, null, null, null, null, 0], sub: V = [4, 1, 2], { nodes, kids, val } = T(vals), frames: TreeFrame[] = []; let found = -1;
      const same = (i: number | null, j: number, path: number[]): boolean => { const sj = j < sub.length ? sub[j] : null; if (i == null || sj == null) return i == null && sj == null; path.push(i); return val(i) === sj && same(kids[i][0], 2 * j + 1, path) && same(kids[i][1], 2 * j + 2, path); };
      const walk = (i: number | null): boolean => {
        if (i == null) return false; const path: number[] = [], ok = same(i, 0, path);
        frames.push({ note: ok ? `Start at ${val(i)}: every node matches subRoot [${sub.join(", ")}] → True` : `Start at ${val(i)}: compare with subRoot [${sub.join(", ")}], mismatch at node ${val(path[path.length - 1])} → keep walking`, tones: { ...Object.fromEntries(path.map((k) => [k, ok ? "found" : "window"])), [i]: ok ? "found" : "bad" } });
        if (ok) found = i; return ok || walk(kids[i][0]) || walk(kids[i][1]);
      };
      const ok = walk(0);
      return tree(`isSubtree(root, [4,1,2]) = ${ok ? "True" : "False"}${found >= 0 ? `, at node ${val(found)}` : ""}`, nodes, frames);
    },
  },

  "symmetric-tree": {
    approach: "Compare the tree with its mirror: two subtrees mirror each other when their roots match, the outer pair mirrors, and the inner pair mirrors.",
    idea: ["The tree is symmetric when root.left mirrors root.right.", "mirror(a, b): both empty, or equal values with mirror(a.left, b.right) and mirror(a.right, b.left).", "Stop at the first mismatch."],
    code: `def isSymmetric(root):
    def mirror(a, b):
        if not a or not b:
            return a is b
        return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)
    return mirror(root.left, root.right)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [1, 2, 2, 3, 4, 4, 3, 5, null, null, 6, 6, null, null, 5], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: is the tree a mirror of itself? Pair the left subtree with the right subtree: outer children first, then inner children", tones: { 1: "window", 2: "window" } }]; let pairs = 0;
      const mirror = (a: number | null, b: number | null): boolean => {
        if (a == null || b == null) return a === b; const eq = val(a) === val(b); pairs++;
        frames.push({ note: `Pair ${val(a)} (left side) with ${val(b)} (right side): ${eq ? "equal, so check the outer pair, then the inner pair" : "different, so not symmetric"}`, tones: { [a]: eq ? "active" : "bad", [b]: eq ? "active" : "bad" } });
        return eq && mirror(kids[a][0], kids[b][1]) && mirror(kids[a][1], kids[b][0]);
      };
      const ok = mirror(kids[0][0], kids[0][1]);
      frames.push({ note: `All ${pairs} pairs of mirrored nodes match, so the tree is ${ok ? "symmetric" : "not symmetric"}`, tones: Object.fromEntries(nodes.map((nd) => [nd.id, "found" as Tone])) });
      return tree(`isSymmetric = ${ok ? "True" : "False"}`, nodes, trail(frames, "done"));
    },
  },

  "binary-tree-maximum-path-sum": {
    approach: "Post-order gains: each node returns its value plus the better non-negative child gain; the best path through a node uses both child gains.",
    idea: ["A path bends at one top node and goes down at most one way on each side.", "gain(node) = node.val + max(0, left gain, right gain): the best downward path a parent can extend; negative gains are dropped.", "At each node, node.val + max(0, left) + max(0, right) is a candidate for the answer."],
    code: `def maxPathSum(root):
    best = float("-inf")
    def gain(node):
        nonlocal best
        if not node:
            return 0
        a = max(gain(node.left), 0)
        b = max(gain(node.right), 0)
        best = max(best, node.val + a + b)
        return node.val + max(a, b)
    gain(root)
    return best`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [-10, 9, 20, 3, -4, 15, 7, null, null, null, null, -2, 6], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: the best path sum. A path bends at one top node; each side adds only a positive downward gain, otherwise 0", tones: {} }], badges: Record<number, string> = {}, done: Record<number, Tone> = {}, g: Record<number, number> = {}; let best = Number.NEGATIVE_INFINITY, at = -1;
      const gain = (i: number | null): number => {
        if (i == null) return 0; const a = Math.max(gain(kids[i][0]), 0), b = Math.max(gain(kids[i][1]), 0), through = val(i) + a + b, up = through > best; if (up) { best = through; at = i; } g[i] = val(i) + Math.max(a, b); badges[i] = `g${g[i]}`;
        frames.push({ note: `${val(i)}: child gains ${a} and ${b}, so a path bending here sums to ${through}${up ? ", a new best" : `, best stays ${best}`}; it returns gain ${g[i]}`, tones: { ...done, [at]: "found", [i]: i === at ? "found" : "active" }, badges: { ...badges } });
        done[i] = "done"; return g[i];
      };
      gain(0);
      const down = (i: number): number[] => { const [l, r] = kids[i], c = [l, r].filter((k): k is number => k != null && g[k] > 0).sort((x, y) => g[y] - g[x])[0]; return c === undefined ? [i] : [i, ...down(c)]; };
      const path = [at, ...kids[at].filter((k): k is number => k != null && g[k] > 0).flatMap(down)];
      frames.push({ note: `The best path bends at ${val(at)} and sums to ${best}: ${path.map(val).join(" + ")}`, tones: Object.fromEntries(path.map((k) => [k, "found" as Tone])), badges: { ...badges } });
      return tree(`maxPathSum = ${best}`, nodes, frames);
    },
  },

  "binary-tree-right-side-view": {
    approach: "BFS level by level and keep the last node of each level; that is the one visible from the right.",
    idea: ["Looking from the right, you see exactly one node per depth: the rightmost one.", "Build each level left to right from the previous one.", "Its last element goes into the answer."],
    code: `def rightSideView(root):
    out, level = [], [root] if root else []
    while level:
        out.append(level[-1].val)
        level = [c for n in level for c in (n.left, n.right) if c]
    return out`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, null, 6, 7, null, null, null, null, null, 8], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: what you see from the right side: the last node of every level, left to right", tones: { 0: "window" } }], out: number[] = [], tn: Record<number, Tone> = {}; let lvl = [0], L = 1;
      while (lvl.length) {
        const last = lvl[lvl.length - 1];
        lvl.forEach((i, k) => {
          const isLast = i === last; if (isLast) out.push(val(i));
          frames.push({ note: isLast ? `Level ${L}, ${k + 1} of ${lvl.length}: ${val(i)} is the last one, so you see it from the right. View [${out.join(", ")}]` : `Level ${L}, ${k + 1} of ${lvl.length}: ${val(i)} is hidden behind ${val(last)}, which is further right`, tones: { ...tn, ...Object.fromEntries(lvl.slice(k + 1).map((c) => [c, "window" as Tone])), [i]: isLast ? "found" : "active" } });
          tn[i] = isLast ? "found" : "muted";
        });
        lvl = lvl.flatMap((i) => kids[i].filter((c): c is number => c != null)); L++;
      }
      frames.push({ note: `Every level has been read: the right side view is [${out.join(", ")}]`, tones: { ...tn } });
      return tree(`rightSideView = [${out.join(", ")}]`, nodes, frames);
    },
  },

  "binary-tree-zigzag-level-order-traversal": {
    approach: "Level-order BFS, reversing every other level's values before adding them to the answer.",
    idea: ["Collect each level left to right, exactly as in level order.", "Flip a flag after each level; when it is set, append the level reversed.", "Children are always gathered left to right, so only the output order changes."],
    code: `def zigzagLevelOrder(root):
    out, level, flip = [], [root] if root else [], False
    while level:
        vals = [n.val for n in level]
        out.append(vals[::-1] if flip else vals)
        flip = not flip
        level = [c for n in level for c in (n.left, n.right) if c]
    return out`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6, 7, 8, 9], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [{ note: "Goal: level order, but every second level is read right to left. Children are always gathered left to right", tones: { 0: "window" } }], out: number[][] = [], badges: Record<number, string> = {}; let lvl = [0], flip = false, L = 1;
      while (lvl.length) {
        const v = lvl.map(val); lvl.forEach((i) => (badges[i] = flip ? "←" : "→"));
        frames.push({ note: `Level ${L} gathered left to right: [${v.join(", ")}]`, tones: Object.fromEntries(lvl.map((i) => [i, "active" as Tone])), badges: { ...badges } });
        const row = flip ? [...v].reverse() : v; out.push(row);
        if (flip) frames.push({ note: `The flag is set for level ${L}, so reverse it → [${row.join(", ")}]`, tones: Object.fromEntries(lvl.map((i) => [i, "found" as Tone])), badges: { ...badges } });
        flip = !flip; lvl = lvl.flatMap((i) => kids[i].filter((c): c is number => c != null)); L++;
      }
      frames.push({ note: `Zigzag order: ${JSON.stringify(out)}`, tones: Object.fromEntries(nodes.map((nd) => [nd.id, "found" as Tone])), badges: { ...badges } });
      return tree(`zigzag = ${JSON.stringify(out)}`, nodes, trail(frames, "done"));
    },
  },
};
