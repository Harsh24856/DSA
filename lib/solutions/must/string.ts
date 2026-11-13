// Solutions for the must-do "string" questions that were new to the app (lib/patterns/overview/string.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import type { Solution } from "../types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const tonesOf = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "integer-to-roman": {
    approach: "Greedy over the 13 symbol values from 1000 down to 1, including the six subtractive pairs (900, 400, 90, 40, 9, 4): take the largest value that still fits, as often as it fits.",
    idea: ["Roman numerals write each decimal place with the largest symbols first.", "The subtractive forms CM, CD, XC, XL, IX and IV are just extra symbols with values 900, 400, 90, 40, 9 and 4. Adding them to the table means the rule is always the same.", "Walk the table from the largest value. While the number is at least that value, append its symbol and subtract it.", "Greedy is safe here because each value in the table is chosen so that no smaller symbols can write it shorter."],
    code: `def intToRoman(num):
    table = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"),
             (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
    out = []
    for value, sym in table:
        while num >= value:
            out.append(sym)
            num -= value
    return "".join(out)`,
    lang: "python", time: "O(1) (at most 15 symbols for num <= 3999)", space: "O(1)",
    viz: () => {
      const table: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      const start = 1994, frames: CellsFrame[] = [], out: string[] = [];
      let num = start;
      const rows = () => [table.map(([, s]) => s), table.map(([v]) => v), out.length ? [...out] : [""]];
      frames.push({ note: `Write ${start} in Roman numerals. The table holds the 7 symbols plus the 6 subtractive pairs, largest first`, rows: rows() });
      table.forEach(([v, s], k) => {
        if (num < v) return;
        let times = 0;
        while (num >= v) { out.push(s); num -= v; times++; }
        frames.push({ note: `${v} (${s}) fits ${times} time${times === 1 ? "" : "s"}: append ${s.repeat(times)}, ${num} left`, rows: rows(), tones: tonesOf([[`0:${k}`, "found"], [`1:${k}`, "found"], ...out.map((_, j) => [`2:${j}`, j >= out.length - times ? "active" : "done"] as [string, Tone])]) });
      });
      frames.push({ note: `Nothing is left: ${start} = ${out.join("")}. Each subtractive pair (CM, XC, IV) was picked whole, so the greedy never writes DCCCC or VIIII`, rows: rows(), tones: tonesOf(out.map((_, j) => [`2:${j}`, "found"] as [string, Tone])) });
      return cells(`intToRoman(${start}) = ${out.join("")}`, rows(), frames, ["symbol", "value", "out"]);
    },
  },

  "zigzag-conversion": {
    approach: "Walk the string once, dropping each character into the current row and bouncing the row index between 0 and numRows - 1; then join the rows.",
    idea: ["Writing in a zigzag means the row goes 0, 1, ..., numRows - 1 and back up to 0, over and over.", "Keep one builder per row and a step of +1 or -1. Append the character to its row, then flip the step at the top and bottom rows.", "Reading the zigzag line by line is just the rows joined in order.", "With one row (or more rows than characters) the string does not change, so return it first: the step would never flip."],
    code: `def convert(s, numRows):
    if numRows == 1 or numRows >= len(s):
        return s
    rows = [[] for _ in range(numRows)]
    r, step = 0, 1
    for ch in s:
        rows[r].append(ch)
        if r == 0:
            step = 1
        elif r == numRows - 1:
            step = -1
        r += step
    return "".join("".join(row) for row in rows)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "PAYPALISHIRING", R = 3, frames: CellsFrame[] = [], rows: string[][] = Array.from({ length: R }, () => []);
      const show = () => rows.map((r) => (r.length ? [...r] : [""]));
      frames.push({ note: `Write "${s}" in a zigzag over ${R} rows: down 0, 1, 2, then back up, one row per character`, rows: show() });
      let r = 0, step = 1;
      for (let i = 0; i < s.length; i += 2) {
        const placed: [number, number][] = [];
        for (const ch of s.slice(i, i + 2)) {
          rows[r].push(ch); placed.push([r, rows[r].length - 1]);
          if (r === 0) step = 1; else if (r === R - 1) step = -1;
          r += step;
        }
        frames.push({ note: `"${s.slice(i, i + 2)}" go to row${placed.length > 1 && placed[0][0] !== placed[1][0] ? "s" : ""} ${[...new Set(placed.map(([a]) => a))].join(" and ")}. Next row ${r}, moving ${step > 0 ? "down" : "up"}`, rows: show(), tones: tonesOf(placed.map(([a, b]) => [`${a}:${b}`, "found"] as [string, Tone])) });
      }
      const ans = rows.map((x) => x.join("")).join("");
      frames.push({ note: `Read row by row: ${rows.map((x) => `"${x.join("")}"`).join(" + ")} = "${ans}"`, rows: show(), tones: tonesOf(rows.flatMap((x, a) => x.map((_, b) => [`${a}:${b}`, "done"] as [string, Tone]))) });
      return cells(`convert(${R} rows) = ${ans}`, show(), frames, ["row 0", "row 1", "row 2"]);
    },
  },

  "string-compression": {
    approach: "Read runs with one pointer and write with another: each run becomes its character plus its length's digits, written over the front of the same array.",
    idea: ["A group is a run of equal characters. It compresses to the character, followed by the count's digits only if the count is above 1.", "The compressed form of any prefix is never longer than the prefix itself, so writing into the same array never overtakes the reading pointer.", "Let i find the end j of the current run. Write chars[i] at w, then the digits of j - i if it is more than 1, and jump i to j.", "Return w, the new length. Counts of 10 or more take several characters, one per digit."],
    code: `def compress(chars):
    w = i = 0
    while i < len(chars):
        j = i
        while j < len(chars) and chars[j] == chars[i]:
            j += 1
        chars[w] = chars[i]
        w += 1
        if j - i > 1:
            for d in str(j - i):
                chars[w] = d
                w += 1
        i = j
    return w`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = ["a", "a", "b", "b", "b", "b", "b", "b", "b", "b", "b", "b", "b", "c"], frames: CellsFrame[] = [];
      let w = 0, i = 0;
      frames.push({ note: "Compress in place: i reads runs from the left, w writes the compressed form over the front of the same array", rows: [[...a]], marks: [{ i: 0, label: "i,w" }] });
      while (i < a.length) {
        let j = i; while (j < a.length && a[j] === a[i]) j++;
        frames.push({ note: `A run of ${j - i} '${a[i]}' from index ${i} to ${j - 1}`, rows: [[...a]], tones: tonesOf([...Array(j - i)].map((_, k) => [`0:${i + k}`, "window"] as [string, Tone])), marks: [{ i, label: "i" }, { i: Math.min(w, a.length - 1), label: "w" }] });
        const ch = a[i], wrote = [ch, ...(j - i > 1 ? String(j - i).split("") : [])], from = w;
        for (const c of wrote) a[w++] = c;
        frames.push({ note: `Write "${wrote.join("")}" at index ${from}${j - i > 1 ? ` (the count ${j - i} takes ${String(j - i).length} slot${String(j - i).length === 1 ? "" : "s"})` : " (a count of 1 is left out)"}. w = ${w}, never past i`, rows: [[...a]], tones: tonesOf([...Array(w)].map((_, k) => [`0:${k}`, k >= from ? "found" : "done"] as [string, Tone])), marks: [{ i: Math.min(j, a.length - 1), label: "next i" }, { i: Math.min(w, a.length - 1), label: "w" }] });
        i = j;
      }
      frames.push({ note: `Return ${w}: the first ${w} characters "${a.slice(0, w).join("")}" are the answer, the rest is ignored`, rows: [[...a]], tones: tonesOf([...Array(a.length)].map((_, k) => [`0:${k}`, k < w ? "found" : "muted"] as [string, Tone])) });
      return cells(`compress = ${w}`, [a], frames);
    },
  },

  "is-subsequence": {
    approach: "Two pointers: walk t once and move the pointer in s each time the current letter of t matches it; s is a subsequence when that pointer reaches the end.",
    idea: ["A subsequence keeps the order of s but may skip letters of t.", "Matching each letter of s with its earliest possible place in t is always safe: an earlier match leaves more of t for the remaining letters.", "So scan t from left to right, and whenever t[j] equals s[i], advance i.", "If i reaches len(s), every letter was matched in order. For many queries against one t, store each letter's positions in t and binary search instead."],
    code: `def isSubsequence(s, t):
    i = 0
    for ch in t:
        if i < len(s) and s[i] == ch:
            i += 1
    return i == len(s)`,
    lang: "python", time: "O(len(t))", space: "O(1)",
    viz: () => {
      const s = "ace", t = "abcde", frames: CellsFrame[] = [];
      let i = 0;
      frames.push({ note: `Is "${s}" a subsequence of "${t}"? i points into s, j walks t`, rows: [s.split(""), t.split("")], marks: [{ i: 0, label: "i" }, { i: 0, label: "j", row: 1 }] });
      for (let j = 0; j < t.length; j++) {
        const hit = i < s.length && s[i] === t[j];
        if (hit) i++;
        frames.push({ note: hit ? `t[${j}] = '${t[j]}' matches s[${i - 1}], so advance i to ${i}` : i < s.length ? `t[${j}] = '${t[j]}' is not '${s[i]}', skip it` : `t[${j}] = '${t[j]}': all of s is matched already`, rows: [s.split(""), t.split("")], tones: tonesOf([...[...Array(i)].map((_, k) => [`0:${k}`, "found"] as [string, Tone]), [`1:${j}`, hit ? "found" : "muted"]]), marks: [{ i: Math.min(i, s.length - 1), label: "i" }, { i: j, label: "j", row: 1 }] });
      }
      frames.push({ note: `i = ${i} = len(s), so every letter of "${s}" was found in order: true`, rows: [s.split(""), t.split("")], tones: tonesOf(s.split("").map((_, k) => [`0:${k}`, "found"] as [string, Tone])) });
      return cells(`isSubsequence("${s}", "${t}") = ${i === s.length}`, [s.split(""), t.split("")], frames, ["s", "t"]);
    },
  },
};
