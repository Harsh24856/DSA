// Deeper theory for the "logic-to-code" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import * as S from "../../sim";
import { nums, type Pattern } from "../types";

const { range } = S;

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "Matrix traversal is correct when you can state, at the top of every loop, exactly which cells are already done. For the spiral: rows above top, below bot, columns left of left and right of right are finished; the rectangle [top..bot] x [left..right] is not. Each side walk prints one edge of that rectangle and shrinks it by one. The loop ends when the rectangle is empty, so every cell is printed exactly once.",
    "The two extra checks before the bottom and left sides exist because the rectangle can collapse in the middle of a lap. After printing the top row and right column, a rectangle that had one row left is now empty in height, and printing the bottom row would repeat the top row. Checking top <= bot (and left <= right) after each shrink prevents that.",
    "Other traversals have their own invariant. Cells on one diagonal share r - c, cells on one anti-diagonal share r + c, so Diagonal Traverse walks d = r + c from 0 to R + C - 2 and alternates direction. Pascal's triangle builds row k from row k - 1: row[j] = prev[j - 1] + prev[j], with 1 at both ends.",
    "In-place updates need a two-phase plan. Set Matrix Zeroes must not zero cells while it is still reading, or the new zeros spread. First record which rows and columns to clear (in O(1) space, in the first row and column, with one flag for whether the first column itself had a zero), then clear, and handle the first row and column last.",
    "Complexity: every cell is visited a constant number of times, so O(R x C) time; the output does not count toward space. Recognise these problems by the absence of a clever idea: the challenge is to translate a clear rule into code without boundary errors.",
    "A reliable routine: write the invariant as a comment, trace a 1 x 1, a 1 x n, an n x 1 and a 2 x 3 case by hand, then code. Most wrong answers on spiral problems come from single rows or single columns, and most on in-place problems from reading a value that was already overwritten.",
  ],
};

/* ---------- visualisers for the new patterns ---------- */

function rotateViz(n: number): Diagram {
  const m = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1)), frames: CellsFrame[] = [];
  const snap = () => m.map((row) => [...row]);
  frames.push({ note: `Rotate ${n} x ${n} clockwise in place: transpose across the main diagonal, then reverse each row.`, rows: snap(), tones: Object.fromEntries(Array.from({ length: n }, (_, i) => [`${i}:${i}`, "muted" as Tone])) });
  for (let i = 0; i < n; i++) {
    const swaps: string[] = [], t: Record<string, Tone> = {};
    for (let j = i + 1; j < n; j++) { [m[i][j], m[j][i]] = [m[j][i], m[i][j]]; swaps.push(`(${i},${j}) with (${j},${i})`); t[`${i}:${j}`] = "active"; t[`${j}:${i}`] = "found"; }
    if (swaps.length) frames.push({ note: `Transpose row ${i}: swap ${swaps.join(", ")}. Only j > i, so each pair swaps once.`, rows: snap(), tones: t });
  }
  frames.push({ note: "Transposed: row r is now the old column r. Reading each row backwards gives the rotated picture.", rows: snap() });
  for (let r = 0; r < n; r++) {
    m[r].reverse();
    frames.push({ note: `Reverse row ${r}: [${m[r].join(", ")}].`, rows: snap(), tones: range(0, n - 1, r, "found") });
  }
  frames.push({ note: `Done: the old first column, read bottom to top, is the new first row. Every cell moved once per phase: O(n²) time, O(1) space.`, rows: snap(), tones: range(0, n - 1, 0, "done") });
  return { kind: "cells", title: "Rotate a matrix 90 degrees: transpose, then reverse rows", rows: snap(), frames };
}

function countSayViz(n: number): Diagram {
  let s = "1";
  const frames: CellsFrame[] = [], width = 8;
  const pad = (x: string) => [...x.split(""), ...Array(Math.max(0, width - x.length)).fill("")].slice(0, width);
  frames.push({ note: `Start from "1". Each step reads the current string as runs of equal digits and writes count + digit for each run.`, rows: [pad(s), pad("")] });
  for (let step = 1; step < n; step++) {
    let next = "";
    for (let i = 0; i < s.length; ) {
      let j = i;
      while (j < s.length && s[j] === s[i]) j++;
      next += String(j - i) + s[i];
      frames.push({ note: `Step ${step}: "${s}" has a run of ${j - i} '${s[i]}' at ${i}..${j - 1}, so write "${j - i}${s[i]}". Next so far: "${next}".`, rows: [pad(s), pad(next)], tones: { ...range(i, j - 1, 0, "active"), ...range(next.length - 2, next.length - 1, 1, "found") } });
      i = j;
    }
    s = next;
  }
  frames.push({ note: `Term ${n} is "${s}". The next state was built in a new string, never by editing the one being read.`, rows: [pad(s), pad("")], tones: range(0, Math.min(width, s.length) - 1, 0, "done") });
  return { kind: "cells", title: `Count and say, up to term ${n}`, rowLabels: ["current", "next"], rows: [pad("1"), pad("")], frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 2, name: "Rotation by transpose and reversal", summary: "Rotations and shifts in place become a few reversals: a matrix turns 90 degrees as transpose plus row reversal, and an array rotates right by k as three reversals.",
    signals: ["rotate an image 90 degrees in place", "rotate an array right or left by k", "is one string a rotation of another", "reverse the words of a sentence in place"],
    idea: ["Clockwise rotation sends (r, c) to (c, n - 1 - r). Transposing sends (r, c) to (c, r); reversing each row then sends (c, r) to (c, n - 1 - r). Two simple in-place passes, the same result.", "Rotating an array right by k: reverse everything (the last k come first, but backwards), then reverse the first k and the remaining n - k to restore order inside each part."],
    steps: ["matrix: swap m[i][j] and m[j][i] for j > i", "then reverse every row", "array: k %= n; reverse all, reverse [0, k), reverse [k, n)", "anticlockwise: transpose, then reverse every column (or reverse each row, then transpose)"],
    code: `def rotate_matrix(m):                 # 90 degrees clockwise, in place
    n = len(m)
    for i in range(n):
        for j in range(i + 1, n):     # j > i: each pair swaps once
            m[i][j], m[j][i] = m[j][i], m[i][j]
    for row in m:
        row.reverse()

def rotate_array(a, k):               # right by k, in place
    if not a:
        return
    def rev(i, j):
        while i < j:
            a[i], a[j] = a[j], a[i]; i += 1; j -= 1
    n = len(a); k %= n
    rev(0, n - 1); rev(0, k - 1); rev(k, n - 1)`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "n = number of cells (n² for an n x n matrix). Each cell is moved a constant number of times." },
    traps: ["Transposing with j over the whole row swaps every pair twice and undoes itself.", "Reduce k with k %= n first; k can be far larger than the array.", "Transpose works in place only for square matrices; a rectangular one needs a new matrix."],
    viz: { make: (i) => { const [n] = nums(i, [3], 1); return rotateViz(Math.max(2, Math.min(5, Math.round(n)))); }, input: "3", label: "size n (2 to 5)" },
    theory: [
      "Rotations are compositions of reflections. A 90 degree clockwise turn equals a reflection across the main diagonal (transpose) followed by a reflection across the vertical middle line (reverse each row). Reflections are easy to do in place because they pair up cells and swap each pair once, which is why the composition avoids the four-way cycle juggling of the direct approach.",
      "The direct approach also works: rotate layer by layer, moving four cells at a time in a cycle (top to right to bottom to left). It is a single pass but has more index arithmetic, so the two-reflection version is the safer interview answer. Choose the reflections by the direction: anticlockwise is transpose then reverse each column, and 180 degrees is reverse rows then reverse each row.",
      "The three-reversal rotation of an array is the same trick in one dimension. Write the array as A B, where B is the last k elements. Reversing all gives rev(B) rev(A); reversing each part gives B A, which is the rotated array. Reverse Words in a String uses it on characters: reverse the whole string, then reverse each word.",
      "Rotate String asks whether b is a rotation of a. Every rotation of a appears as a substring of a + a, so the test is len(a) == len(b) and b in a + a, which with KMP or the Z-function is O(n).",
      "Complexity: O(n) time over all cells and O(1) extra space for the in-place versions. Using a copy (new[c][n - 1 - r] = old[r][c]) is O(n) space and acceptable when in place is not required; say which one you are doing.",
      "Edge cases: a 1 x 1 matrix, k = 0 or k a multiple of n, an empty array (k %= 0 would fail), and rectangular matrices, where a rotation changes the shape and cannot be in place.",
    ],
  },
  {
    n: 3, name: "State simulation (build the next state)", summary: "Some problems are a rule applied step by step: count and say, Pascal's triangle, text justification, summary ranges. Hold the current state, build the next one separately, and repeat.",
    signals: ["generate the nth term from the previous one", "group consecutive equal values or runs", "lay out text line by line", "apply a rule to every cell at once (game of life style)"],
    idea: ["Write the transition first: what is the next state, given only the current one? For count and say, each run of equal digits becomes its length followed by the digit.", "Build the next state in new memory (or encode both states in place), never by editing the state that is still being read."],
    steps: ["state = initial value", "repeat: scan the state in runs or cells", "write each piece of the next state into a new buffer", "state = next; stop after n steps or when nothing changes"],
    code: `def count_and_say(n):
    s = "1"
    for _ in range(n - 1):
        out, i = [], 0
        while i < len(s):
            j = i
            while j < len(s) and s[j] == s[i]:
                j += 1                # s[i..j-1] is one run
            out.append(str(j - i) + s[i])
            i = j
        s = "".join(out)              # build the next state; never edit the one being read
    return s`,
    complexity: { best: "O(total output)", average: "O(total output)", worst: "O(total output)", space: "O(length of one term)", note: "Each step is linear in its input. Count and say terms grow by about 30% per step." },
    traps: ["Editing the state in place while reading it mixes old and new values (the classic game of life bug).", "Run grouping: the inner loop must stop at the end of the string, and i jumps to j, not i + 1.", "Text justification: extra spaces go to the leftmost gaps, and the last line is left-justified."],
    viz: { make: (i) => { const [n] = nums(i, [5], 1); return countSayViz(Math.max(2, Math.min(6, Math.round(n)))); }, input: "5", label: "term n (2 to 6)" },
    theory: [
      "A simulation is correct when its transition is correct and is applied to a consistent state. 'Consistent' means every cell of the next state is computed from the same snapshot of the current state. Writing into a fresh buffer guarantees that; writing into the current buffer does not, because cells read later would see values from the next step.",
      "When memory must stay O(1), encode both states in each cell. Game of Life stores the new value in a second bit (or uses codes like 2 for 'was alive, now dead'), computes every cell from the old bits, then shifts all cells to the new bits in a final pass. The two-phase shape is the same as Set Matrix Zeroes.",
      "Run grouping is the core of many of these: count and say, string compression, summary ranges (consecutive integers become 'a->b'), and run-length encoding. The two-pointer loop (i at the run start, j scanning to its end, then i = j) visits each element once, so a pass is O(n).",
      "Pascal's triangle builds each row from the one above. Doing it in a single array is possible if you update from right to left (row[j] += row[j - 1] for j from k down to 1), because then every read sees an old value. Iterating left to right would read values already updated, which is the in-place trap in its simplest form.",
      "Text Justification is a greedy simulation: put as many words as fit on a line (word lengths plus one space between each), then spread the leftover spaces, giving the remainder to the leftmost gaps; a single-word line and the last line are left-justified and padded on the right. The difficulty is only the bookkeeping, so write helper functions for 'fill a line' and 'justify a line'.",
      "Complexity is the sum of the work per step, usually linear in the size of each state. Recognise the pattern by statements that describe a process ('each term is generated by', 'then repeat') rather than a property. Trace two or three steps by hand before coding to confirm you have read the rule right.",
    ],
  },
];
