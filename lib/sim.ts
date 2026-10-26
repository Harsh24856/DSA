// Simulators: run each algorithm on a tiny input and record frames for the diagram player.
import type { CellsFrame, Diagram, GraphFrame, IntervalsFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "./diagram";

const range = (a: number, b: number, row = 0, tone: Tone = "window") => Object.fromEntries(Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => [`${row}:${a + k}`, tone])) as Record<string, Tone>;

/* ================= arrays ================= */

export function prefixSum(arr = [3, 1, 4, 1, 5, 9], l = 1, r = 4): Diagram {
  r = Math.min(r, arr.length - 1); l = Math.min(l, r);
  const P = [0]; arr.forEach((x) => P.push(P[P.length - 1] + x));
  const frames: CellsFrame[] = [];
  const pre: (string | number)[] = ["0", ...arr.map(() => "")];
  frames.push({ note: "P[0] = 0 is the empty prefix. P[i] = sum of the first i numbers.", rows: [arr, [...pre]], tones: { "1:0": "found" } });
  for (let i = 1; i <= arr.length; i++) {
    pre[i] = P[i];
    frames.push({ note: `P[${i}] = P[${i - 1}] + nums[${i - 1}] = ${P[i - 1]} + ${arr[i - 1]} = ${P[i]}`, rows: [arr, [...pre]], tones: { [`0:${i - 1}`]: "active", [`1:${i}`]: "found", [`1:${i - 1}`]: "done" } });
  }
  frames.push({ note: `sum(nums[${l}..${r}]) = P[${r + 1}] - P[${l}] = ${P[r + 1]} - ${P[l]} = ${P[r + 1] - P[l]}. One subtraction, O(1).`, rows: [arr, [...pre]], tones: { ...range(l, r, 0), [`1:${r + 1}`]: "found", [`1:${l}`]: "bad" } });
  return { kind: "cells", title: "Prefix sums: build once, answer any range in O(1)", rowLabels: ["nums", "P"], rows: [arr, ["0", ...arr.map(() => "")]], frames };
}

export function twoPointerSum(arr = [1, 2, 4, 6, 8, 11, 15], target = 14): Diagram {
  const frames: CellsFrame[] = [];
  let l = 0, r = arr.length - 1;
  while (l < r) {
    const s = arr[l] + arr[r];
    if (s === target) { frames.push({ note: `${arr[l]} + ${arr[r]} = ${s}. Found the pair.`, tones: { [`0:${l}`]: "found", [`0:${r}`]: "found" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); break; }
    frames.push({ note: `${arr[l]} + ${arr[r]} = ${s} ${s < target ? "< target, so move L right (need bigger)" : "> target, so move R left (need smaller)"}`, tones: { [`0:${l}`]: "active", [`0:${r}`]: "active", ...range(0, l - 1, 0, "muted"), ...range(r + 1, arr.length - 1, 0, "muted") }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
    if (s < target) l++; else r--;
  }
  return { kind: "cells", title: `Two pointers on a sorted array: pair that sums to ${target}`, rows: [arr], frames };
}

export function fixedWindow(arr = [2, 1, 5, 1, 3, 2, 7], k = 3): Diagram {
  const frames: CellsFrame[] = [];
  let sum = arr.slice(0, k).reduce((a, b) => a + b, 0), best = sum;
  frames.push({ note: `First window [0..${k - 1}] sum = ${sum}`, tones: range(0, k - 1), marks: [{ i: 0, label: "L" }, { i: k - 1, label: "R" }] });
  for (let r = k; r < arr.length; r++) {
    sum += arr[r] - arr[r - k]; best = Math.max(best, sum);
    frames.push({ note: `Slide: add ${arr[r]}, drop ${arr[r - k]} → sum = ${sum} (best ${best})`, tones: { ...range(r - k + 1, r), [`0:${r - k}`]: "bad" }, marks: [{ i: r - k + 1, label: "L" }, { i: r, label: "R" }] });
  }
  return { kind: "cells", title: `Fixed window of size ${k}: max sum, each step O(1)`, rows: [arr], frames };
}

export function variableWindow(s = "abcabcbb"): Diagram {
  const arr = s.split(""), frames: CellsFrame[] = [];
  const last = new Map<string, number>(); let l = 0, best = 0;
  arr.forEach((ch, r) => {
    const moved = last.has(ch) && last.get(ch)! >= l;
    if (moved) l = last.get(ch)! + 1;
    last.set(ch, r); best = Math.max(best, r - l + 1);
    frames.push({ note: moved ? `'${ch}' repeats → shrink: L jumps past its last copy. Window "${s.slice(l, r + 1)}"` : `Grow: add '${ch}'. Window "${s.slice(l, r + 1)}", best = ${best}`, tones: { ...range(l, r), [`0:${r}`]: moved ? "bad" : "active" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
  });
  return { kind: "cells", title: "Variable window: longest substring without repeats", rows: [arr], frames };
}

export function monoDeque(arr = [1, 3, -1, -3, 5, 3, 6, 7], k = 3): Diagram {
  const frames: CellsFrame[] = []; const dq: number[] = [];
  arr.forEach((x, i) => {
    while (dq.length && dq[0] <= i - k) dq.shift();
    while (dq.length && arr[dq[dq.length - 1]] <= x) dq.pop();
    dq.push(i);
    const tones: Record<string, Tone> = { ...range(Math.max(0, i - k + 1), i) };
    dq.forEach((j) => (tones[`0:${j}`] = "active"));
    if (i >= k - 1) tones[`0:${dq[0]}`] = "found";
    frames.push({ note: `Deque (indices, values falling): [${dq.map((j) => arr[j]).join(", ")}]` + (i >= k - 1 ? `. Window max = ${arr[dq[0]]}` : ""), tones });
  });
  return { kind: "cells", title: `Monotonic deque: sliding window max (k=${k}) in O(n)`, rows: [arr], frames };
}

export function kadane(arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]): Diagram {
  const frames: CellsFrame[] = []; const cur: (string | number)[] = arr.map(() => "");
  let run = 0, best = -Infinity, bs = 0, be = 0, s = 0;
  arr.forEach((x, i) => {
    if (run + x < x) { run = x; s = i; } else run += x;
    if (run > best) { best = run; bs = s; be = i; }
    cur[i] = run;
    frames.push({ note: run === x && i === s ? `Restart at ${x}: carrying the old sum would only hurt. best = ${best}` : `Extend: run = ${run}. best = ${best} on [${bs}..${be}]`, rows: [arr, [...cur]], tones: { ...range(s, i), ...range(bs, be, 1, "found") } });
  });
  return { kind: "cells", title: "Kadane: extend or restart at every index", rowLabels: ["nums", "run"], rows: [arr, arr.map(() => "")], frames };
}

export function dutchFlag(arr = [2, 0, 2, 1, 1, 0]): Diagram {
  const a = [...arr], frames: CellsFrame[] = [];
  let lo = 0, mid = 0, hi = a.length - 1;
  const snap = (note: string) => frames.push({ note, rows: [[...a]], tones: { ...range(0, lo - 1, 0, "found"), ...range(hi + 1, a.length - 1, 0, "done"), [`0:${mid}`]: "active" }, marks: [{ i: lo, label: "lo" }, { i: Math.min(mid, a.length - 1), label: "mid" }, { i: Math.max(hi, 0), label: "hi" }] });
  snap("0s go left of lo, 2s right of hi, mid scans the unknown middle");
  while (mid <= hi) {
    if (a[mid] === 0) { [a[lo], a[mid]] = [a[mid], a[lo]]; lo++; mid++; snap("0 → swap to lo, advance lo and mid"); }
    else if (a[mid] === 1) { mid++; snap("1 → already in the middle, advance mid"); }
    else { [a[mid], a[hi]] = [a[hi], a[mid]]; hi--; snap("2 → swap to hi, shrink hi (do not advance mid: the swapped-in value is unchecked)"); }
  }
  return { kind: "cells", title: "Dutch national flag: sort 0/1/2 in one pass, O(1) space", rows: [arr], frames };
}

export function binarySearch(arr = [1, 3, 5, 7, 9, 11, 13, 15, 17], target = 13): Diagram {
  const frames: CellsFrame[] = []; let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const tones = { ...range(lo, hi), ...range(0, lo - 1, 0, "muted"), ...range(hi + 1, arr.length - 1, 0, "muted"), [`0:${mid}`]: arr[mid] === target ? "found" : "active" } as Record<string, Tone>;
    if (arr[mid] === target) { frames.push({ note: `nums[${mid}] = ${target}. Found in ${frames.length + 1} steps (log₂ ${arr.length} ≈ ${Math.ceil(Math.log2(arr.length))}).`, tones, marks: [{ i: mid, label: "mid" }] }); break; }
    frames.push({ note: `mid = ${mid}, nums[mid] = ${arr[mid]} ${arr[mid] < target ? "< " + target + " → discard left half" : "> " + target + " → discard right half"}`, tones, marks: [{ i: lo, label: "lo" }, { i: mid, label: "mid" }, { i: hi, label: "hi" }] });
    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return { kind: "cells", title: "Binary search: halve the search space each step", rows: [arr], frames };
}

export function answerSearch(piles = [3, 6, 7, 11], h = 8): Diagram {
  const speeds = Array.from({ length: 11 }, (_, i) => i + 1), hours = (v: number) => piles.reduce((a, p) => a + Math.ceil(p / v), 0);
  const frames: CellsFrame[] = []; let lo = 1, hi = speeds.length;
  const ok = speeds.map((v) => (hours(v) <= h ? "yes" : "no"));
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    frames.push({ note: `speed ${mid}: ${hours(mid)} hours ${hours(mid) <= h ? `≤ ${h} → feasible, try slower (hi = mid)` : `> ${h} → too slow, go faster (lo = mid + 1)`}`, tones: { ...range(lo - 1, hi - 1), [`0:${mid - 1}`]: "active", [`1:${mid - 1}`]: hours(mid) <= h ? "found" : "bad" }, marks: [{ i: mid - 1, label: "mid" }] });
    if (hours(mid) <= h) hi = mid; else lo = mid + 1;
  }
  frames.push({ note: `Smallest feasible speed = ${lo}. The yes/no row is monotonic, which is what makes binary search valid.`, tones: { [`0:${lo - 1}`]: "found", [`1:${lo - 1}`]: "found" } });
  return { kind: "cells", title: `Binary search on the answer (Koko: piles ${piles.join(",")}, h=${h})`, rowLabels: ["speed", "fits?"], rows: [speeds, ok], frames };
}

export function diffArray(n = 7, updates: [number, number, number][] = [[1, 3, 2], [2, 5, 3], [0, 1, 1]]): Diagram {
  const d = Array(n + 1).fill(0), frames: CellsFrame[] = [];
  updates.forEach(([l, r, v]) => { d[l] += v; d[r + 1] -= v; frames.push({ note: `add ${v} on [${l}..${r}]: diff[${l}] += ${v}, diff[${r + 1}] -= ${v}. Two writes, not ${r - l + 1}.`, rows: [[...d], Array(n + 1).fill("")], tones: { [`0:${l}`]: "found", [`0:${r + 1}`]: "bad" } }); });
  const out: (string | number)[] = Array(n + 1).fill(""); let run = 0;
  for (let i = 0; i < n; i++) { run += d[i]; out[i] = run; frames.push({ note: `Prefix-sum the diff to materialise: final[${i}] = ${run}`, rows: [[...d], [...out]], tones: { ...range(0, i, 0, "done"), [`1:${i}`]: "found" } }); }
  return { kind: "cells", title: "Difference array: O(1) per range update, one pass at the end", rowLabels: ["diff", "final"], rows: [d, Array(n + 1).fill("")], frames };
}

export function cyclicSort(arr = [3, 4, -1, 1]): Diagram {
  const a = [...arr], frames: CellsFrame[] = [];
  frames.push({ note: "Goal: put value v at index v-1. Ignore values out of [1, n].", rows: [[...a]] });
  for (let i = 0; i < a.length; i++) {
    while (a[i] > 0 && a[i] <= a.length && a[a[i] - 1] !== a[i]) { const j = a[i] - 1; [a[i], a[j]] = [a[j], a[i]]; frames.push({ note: `Swap ${a[j]} into its home index ${j}`, rows: [[...a]], tones: { [`0:${i}`]: "active", [`0:${j}`]: "found" } }); }
  }
  const miss = a.findIndex((v, i) => v !== i + 1);
  frames.push({ note: `First index i where nums[i] ≠ i+1 is ${miss} → first missing positive = ${miss + 1}`, rows: [[...a]], tones: { [`0:${miss}`]: "bad" } });
  return { kind: "cells", title: "In-place cyclic placement (First Missing Positive)", rows: [arr], frames };
}

/* ================= strings ================= */

export function palindromeExpand(s = "babad"): Diagram {
  const arr = s.split(""), frames: CellsFrame[] = []; let best = [0, 0];
  for (let c = 0; c < s.length; c++) {
    let l = c, r = c;
    while (l >= 0 && r < s.length && s[l] === s[r]) { if (r - l > best[1] - best[0]) best = [l, r]; frames.push({ note: `Centre ${c}: "${s.slice(l, r + 1)}" is a palindrome, expand outward`, tones: { ...range(l, r), [`0:${c}`]: "active" } }); l--; r++; }
  }
  frames.push({ note: `Longest = "${s.slice(best[0], best[1] + 1)}". 2n-1 centres × O(n) expansion = O(n²), O(1) space.`, tones: range(best[0], best[1], 0, "found") });
  return { kind: "cells", title: "Expand around centre", rows: [arr], frames };
}

export function anagramCount(s = "cbaebabacd", p = "abc"): Diagram {
  const arr = s.split(""), frames: CellsFrame[] = [], k = p.length;
  const key = (t: string) => [...t].sort().join("");
  for (let i = 0; i + k <= s.length; i++) {
    const hit = key(s.slice(i, i + k)) === key(p);
    frames.push({ note: `Window "${s.slice(i, i + k)}" ${hit ? `has the same letter counts as "${p}" → anagram at ${i}` : "counts differ"}`, tones: range(i, i + k - 1, 0, hit ? "found" : "window") });
  }
  return { kind: "cells", title: `Frequency window: find anagrams of "${p}"`, rows: [arr], frames };
}

export function kmpTable(p = "aabaaab"): Diagram {
  const lps = Array(p.length).fill(0), frames: TableFrame[] = [];
  const row = (): (string | number | null)[][] => [p.split(""), lps.map((v, i) => (i <= cur ? v : null))];
  let len = 0, i = 1, cur = 0;
  frames.push({ note: "lps[i] = length of the longest proper prefix of p[0..i] that is also its suffix. lps[0] = 0.", cells: row(), active: [1, 0] });
  while (i < p.length) {
    if (p[i] === p[len]) { lps[i] = ++len; cur = i; frames.push({ note: `p[${i}] = p[${len - 1}] ('${p[i]}') → extend: lps[${i}] = ${len}`, cells: row(), active: [1, i], deps: [[0, len - 1]] }); i++; }
    else if (len) { frames.push({ note: `Mismatch at ${i}: fall back len = lps[${len - 1}] = ${lps[len - 1]} (reuse what already matched)`, cells: row(), active: [1, i], deps: [[1, len - 1]] }); len = lps[len - 1]; }
    else { lps[i] = 0; cur = i; frames.push({ note: `Mismatch with len 0 → lps[${i}] = 0`, cells: row(), active: [1, i] }); i++; }
  }
  return { kind: "table", title: "KMP failure table: never re-scan matched characters", rowHead: ["p", "lps"], colHead: p.split("").map((_, i) => String(i)), frames };
}

/* ================= stack ================= */

export function nextGreater(arr = [2, 1, 2, 4, 3]): Diagram {
  const frames: StackFrame[] = [], st: number[] = [], ans: (string | number)[] = arr.map(() => "-1");
  arr.forEach((x, i) => {
    const popped: number[] = [];
    while (st.length && arr[st[st.length - 1]] < x) { const j = st.pop()!; ans[j] = x; popped.push(arr[j]); }
    frames.push({ note: popped.length ? `${x} is the next greater for ${popped.join(", ")} → pop them, then push ${x}` : `Push ${x}. Stack stays decreasing (bottom to top).`, items: [...st.map((j) => arr[j]), x], incoming: x, popped, side: `answer: [${ans.join(", ")}]` });
    st.push(i);
  });
  return { kind: "stack", title: "Monotonic stack: next greater element", input: arr, frames };
}

export function brackets(s = "{[()]}("): Diagram {
  const frames: StackFrame[] = [], st: string[] = [], pair: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  for (const ch of s) {
    if (pair[ch]) {
      const ok = st[st.length - 1] === pair[ch];
      if (ok) { st.pop(); frames.push({ note: `'${ch}' matches top '${pair[ch]}' → pop`, items: [...st], incoming: ch, popped: [pair[ch]] }); }
      else { frames.push({ note: `'${ch}' does not match → invalid`, items: [...st], incoming: ch }); return { kind: "stack", title: "Bracket matching", input: s.split(""), frames }; }
    } else { st.push(ch); frames.push({ note: `Opener '${ch}' → push`, items: [...st], incoming: ch }); }
  }
  frames.push({ note: st.length ? `Input ended with ${st.length} unmatched opener → invalid` : "Stack empty → valid", items: [...st] });
  return { kind: "stack", title: "Bracket matching: last opened, first closed", input: s.split(""), frames };
}

export function rpn(tokens = ["2", "1", "+", "3", "*"]): Diagram {
  const frames: StackFrame[] = [], st: number[] = [];
  for (const t of tokens) {
    if ("+-*/".includes(t)) { const b = st.pop()!, a = st.pop()!; const v = t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : Math.trunc(a / b); st.push(v); frames.push({ note: `Operator ${t}: pop ${b} and ${a}, push ${a} ${t} ${b} = ${v}`, items: [...st], incoming: t, popped: [a, b] }); }
    else { st.push(+t); frames.push({ note: `Number ${t} → push`, items: [...st], incoming: t }); }
  }
  return { kind: "stack", title: "Expression evaluation (Reverse Polish Notation)", input: tokens, frames };
}

export function histogram(h = [2, 1, 5, 6, 2, 3]): Diagram {
  const frames: CellsFrame[] = [], st: number[] = []; let best = 0, bestR: [number, number] = [0, 0];
  for (let i = 0; i <= h.length; i++) {
    const cur = i === h.length ? 0 : h[i];
    while (st.length && h[st[st.length - 1]] > cur) {
      const top = st.pop()!, left = st.length ? st[st.length - 1] + 1 : 0, area = h[top] * (i - left);
      if (area > best) { best = area; bestR = [left, i - 1]; }
      frames.push({ note: `Bar ${h[top]} stops at ${i} (shorter bar): width ${i - left} → area ${area}. best = ${best}`, tones: { ...range(left, i - 1), [`0:${top}`]: "active", ...(i < h.length ? { [`0:${i}`]: "bad" } : {}) } });
    }
    st.push(i);
  }
  frames.push({ note: `Largest rectangle = ${best}`, tones: range(bestR[0], bestR[1], 0, "found") });
  return { kind: "cells", title: "Largest rectangle in histogram (monotonic stack on heights)", rows: [h], frames };
}

export function minStack(): Diagram {
  const ops: [string, number?][] = [["push", 5], ["push", 3], ["push", 7], ["push", 2], ["pop"], ["pop"]];
  const st: [number, number][] = [], frames: StackFrame[] = [];
  for (const [op, v] of ops) {
    if (op === "push") { const m = st.length ? Math.min(v!, st[st.length - 1][1]) : v!; st.push([v!, m]); frames.push({ note: `push ${v}: store (value, min so far) = (${v}, ${m})`, items: st.map(([a, b]) => `${a} | min ${b}`), incoming: v }); }
    else { const [a] = st.pop()!; frames.push({ note: `pop ${a}: the min below is already stored → getMin() = ${st[st.length - 1][1]} in O(1)`, items: st.map(([x, y]) => `${x} | min ${y}`), popped: [a] }); }
  }
  return { kind: "stack", title: "Augmented stack: O(1) getMin", frames };
}

/* ================= linked list ================= */

export function reverseList(vals = [1, 2, 3, 4, 5]): Diagram {
  const n = vals.length, next = vals.map((_, i) => (i + 1 < n ? i + 1 : -1)), frames: ListFrame[] = [];
  let prev = -1, curr = 0;
  frames.push({ note: "prev = null, curr = head", next: [...next], ptrs: [{ i: curr, label: "curr" }] });
  while (curr !== -1) {
    const nxt = next[curr]; next[curr] = prev;
    frames.push({ note: `Save nxt, flip curr.next to prev, then step: prev = ${vals[curr]}, curr = ${nxt === -1 ? "null" : vals[nxt]}`, next: [...next], ptrs: [...(nxt !== -1 ? [{ i: nxt, label: "curr" }] : []), { i: curr, label: "prev" }], tones: { [curr]: "found" } });
    prev = curr; curr = nxt;
  }
  frames.push({ note: "curr is null → prev is the new head. O(n) time, O(1) space.", next: [...next], ptrs: [{ i: prev, label: "head" }], tones: Object.fromEntries(vals.map((_, i) => [i, "done"])) });
  return { kind: "list", title: "Reverse a linked list in place", values: vals, frames };
}

export function fastSlow(vals = [1, 2, 3, 4, 5, 6, 7]): Diagram {
  const next = vals.map((_, i) => (i + 1 < vals.length ? i + 1 : -1)), frames: ListFrame[] = [];
  let s = 0, f = 0;
  frames.push({ note: "slow and fast both start at head", next, ptrs: [{ i: 0, label: "slow fast" }] });
  while (f !== -1 && next[f] !== -1) {
    s = next[s]; f = next[next[f]];
    frames.push({ note: `slow +1, fast +2${f === -1 || next[f] === -1 ? ` → fast hit the end, slow is the middle (${vals[s]})` : ""}`, next, ptrs: [{ i: s, label: "slow" }, ...(f !== -1 ? [{ i: f, label: "fast" }] : [])], tones: { [s]: f === -1 || next[f] === -1 ? "found" : "active" } });
  }
  return { kind: "list", title: "Fast and slow pointers: find the middle", values: vals, frames };
}

export function mergeLists(a = [1, 3, 5], b = [2, 4, 6]): Diagram {
  const merged: number[] = [], frames: CellsFrame[] = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    const takeA = j >= b.length || (i < a.length && a[i] <= b[j]);
    merged.push(takeA ? a[i] : b[j]);
    frames.push({ note: `Take the smaller head: ${takeA ? a[i] : b[j]} from ${takeA ? "A" : "B"}`, rows: [a, b, [...merged, ...Array(a.length + b.length - merged.length).fill("")]], tones: { ...(takeA ? { [`0:${i}`]: "active" } : { [`1:${j}`]: "active" }), ...range(0, i - 1, 0, "done"), ...range(0, j - 1, 1, "done"), [`2:${merged.length - 1}`]: "found" } });
    if (takeA) i++; else j++;
  }
  return { kind: "cells", title: "Merge two sorted lists with a dummy head", rowLabels: ["A", "B", "out"], rows: [a, b, Array(a.length + b.length).fill("")], frames };
}

/* ================= intervals ================= */

export function mergeIntervals(items: [number, number][] = [[1, 3], [2, 6], [8, 10], [9, 12], [15, 18]]): Diagram {
  const frames: IntervalsFrame[] = [], res: [number, number][] = [];
  items.forEach(([s, e], i) => {
    if (res.length && s <= res[res.length - 1][1]) { res[res.length - 1][1] = Math.max(res[res.length - 1][1], e); frames.push({ note: `[${s},${e}] starts before ${res[res.length - 1][1] === e ? "the last one ends" : "last end"} → extend to [${res[res.length - 1].join(",")}]`, tones: { [i]: "active" }, result: res.map((x) => [...x] as [number, number]) }); }
    else { res.push([s, e]); frames.push({ note: `[${s},${e}] does not overlap → start a new merged interval`, tones: { [i]: "found" }, result: res.map((x) => [...x] as [number, number]) }); }
  });
  return { kind: "intervals", title: "Merge intervals: sort by start, then one sweep", items, frames };
}

export function sweepLine(items: [number, number][] = [[0, 30], [5, 10], [15, 20], [25, 35]]): Diagram {
  const ev = items.flatMap(([s, e]) => [[s, 1], [e, -1]] as [number, number][]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const frames: IntervalsFrame[] = []; let cur = 0, best = 0;
  for (const [t, d] of ev) { cur += d; best = Math.max(best, cur); frames.push({ note: `t=${t}: ${d > 0 ? "a meeting starts" : "a meeting ends"} → ${cur} rooms in use (max ${best})`, line: t, tones: Object.fromEntries(items.map(([s, e], i) => [i, s <= t && t < e ? "active" : t >= e ? "done" : "muted"])) }); }
  return { kind: "intervals", title: "Sweep line: +1 at each start, -1 at each end", items, frames };
}

export function activitySelect(items: [number, number][] = [[1, 2], [2, 3], [3, 4], [1, 3], [4, 6], [5, 7]]): Diagram {
  const sorted = [...items].sort((a, b) => a[1] - b[1]), frames: IntervalsFrame[] = [], tones: Record<number, Tone> = {}; let end = -Infinity;
  sorted.forEach(([s, e], i) => { if (s >= end) { end = e; tones[i] = "found"; frames.push({ note: `[${s},${e}] starts after ${end === e ? "the last kept end" : end} → keep it (earliest finish leaves the most room)`, tones: { ...tones } }); } else { tones[i] = "bad"; frames.push({ note: `[${s},${e}] overlaps the last kept → drop it`, tones: { ...tones } }); } });
  return { kind: "intervals", title: "Greedy: sort by end, keep what fits", items: sorted, frames };
}

/* ================= trees ================= */

type TNode = { id: number; label: string; parent: number | null; side?: "L" | "R"; edge?: string };
function levelTree(vals: (number | null)[]): { nodes: TNode[]; kids: Record<number, [number | null, number | null]> } {
  const nodes: TNode[] = [], kids: Record<number, [number | null, number | null]> = {};
  vals.forEach((v, i) => { if (v == null) return; const p = i ? Math.floor((i - 1) / 2) : null; nodes.push({ id: i, label: String(v), parent: p, side: i % 2 ? "L" : "R" }); kids[i] = [vals[2 * i + 1] != null ? 2 * i + 1 : null, vals[2 * i + 2] != null ? 2 * i + 2 : null]; });
  return { nodes, kids };
}

export function treeTraversal(order: "pre" | "in" | "post" | "level", vals: (number | null)[] = [1, 2, 3, 4, 5, null, 6]): Diagram {
  const { nodes, kids } = levelTree(vals), seq: number[] = [];
  const dfs = (i: number | null) => { if (i == null) return; if (order === "pre") seq.push(i); dfs(kids[i][0]); if (order === "in") seq.push(i); dfs(kids[i][1]); if (order === "post") seq.push(i); };
  if (order === "level") { const q = [0]; while (q.length) { const i = q.shift()!; seq.push(i); kids[i].forEach((k) => k != null && q.push(k)); } } else dfs(0);
  const frames: TreeFrame[] = []; const badges: Record<number, string> = {};
  seq.forEach((id, k) => { badges[id] = String(k + 1); frames.push({ note: `Visit ${vals[id]} → output [${seq.slice(0, k + 1).map((x) => vals[x]).join(", ")}]`, tones: { ...Object.fromEntries(seq.slice(0, k).map((x) => [x, "done"])), [id]: "active" }, badges: { ...badges } }); });
  const name = { pre: "Preorder (node, left, right)", in: "Inorder (left, node, right)", post: "Postorder (left, right, node)", level: "Level order (BFS by depth)" }[order];
  return { kind: "tree", title: name, nodes, frames };
}

export function treeHeight(vals: (number | null)[] = [1, 2, 3, 4, 5, null, null, 8]): Diagram {
  const { nodes, kids } = levelTree(vals), frames: TreeFrame[] = [], labels: Record<number, string> = {}; let best = 0;
  const h = (i: number | null): number => { if (i == null) return 0; const a = h(kids[i][0]), b = h(kids[i][1]); best = Math.max(best, a + b); labels[i] = `h=${1 + Math.max(a, b)}`; frames.push({ note: `Node ${vals[i]}: left ${a}, right ${b} → returns height ${1 + Math.max(a, b)}; path through it = ${a + b} edges (diameter so far ${best})`, tones: { [i]: "active", ...Object.fromEntries(Object.keys(labels).filter((k) => +k !== i).map((k) => [+k, "done"])) }, badges: { ...labels } }); return 1 + Math.max(a, b); };
  h(0);
  return { kind: "tree", title: "Post-order recursion: children report up (height + diameter)", nodes, frames };
}

export function bstSearch(vals: (number | null)[] = [8, 3, 10, 1, 6, null, 14, null, null, 4, 7], target = 7): Diagram {
  const { nodes, kids } = levelTree(vals), frames: TreeFrame[] = []; let i: number | null = 0; const path: number[] = [];
  while (i != null) { path.push(i); const v: number = vals[i]!; if (v === target) { frames.push({ note: `${v} = ${target}. Found after ${path.length} nodes: O(height)`, tones: { ...Object.fromEntries(path.map((x) => [x, "done"])), [i]: "found" } }); break; } frames.push({ note: `${target} ${target < v ? "<" : ">"} ${v} → go ${target < v ? "left" : "right"}; the other subtree is ruled out`, tones: { ...Object.fromEntries(path.map((x) => [x, "done"])), [i]: "active" } }); i = kids[i][target < v ? 0 : 1]; }
  return { kind: "tree", title: "BST search: left < node < right", nodes, frames };
}

export function lca(vals: (number | null)[] = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 7, q = 4): Diagram {
  const { nodes, kids } = levelTree(vals), frames: TreeFrame[] = [], tones: Record<number, Tone> = {};
  const go = (i: number | null): boolean => { if (i == null) return false; const self = vals[i] === p || vals[i] === q; const l = go(kids[i][0]), r = go(kids[i][1]); const hit = self || l || r; if ((l && r) || (self && (l || r))) { tones[i] = "found"; frames.push({ note: `Both ${p} and ${q} are found under ${vals[i]} → it is the LCA`, tones: { ...tones } }); } else if (hit) { tones[i] = "active"; frames.push({ note: `${vals[i]} reports "found one" upward`, tones: { ...tones } }); } return hit; };
  go(0);
  return { kind: "tree", title: `Lowest common ancestor of ${p} and ${q}`, nodes, frames };
}

export function heapOps(): Diagram {
  const h: number[] = [], frames: TreeFrame[] = [], snaps: number[][] = [];
  const nodesOf = (a: number[]): TNode[] => a.map((v, i) => ({ id: i, label: String(v), parent: i ? Math.floor((i - 1) / 2) : null, side: i % 2 ? "L" : "R" }));
  for (const x of [5, 3, 8, 1, 4, 2]) {
    h.push(x); let i = h.length - 1;
    while (i && h[(i - 1) >> 1] > h[i]) { const p = (i - 1) >> 1; [h[p], h[i]] = [h[i], h[p]]; i = p; }
    snaps.push([...h]); frames.push({ note: `push ${x}: add at the bottom, sift up while smaller than parent → O(log n). min = ${h[0]}`, tones: { [i]: "active", 0: "found" }, labels: Object.fromEntries(h.map((v, k) => [k, String(v)])) });
  }
  const full = nodesOf([...h]);
  return { kind: "tree", title: "Min-heap: smallest always on top", nodes: full, frames: frames.map((f, k) => ({ ...f, tones: { ...f.tones, ...Object.fromEntries(full.filter((n) => n.id >= snaps[k].length).map((n) => [n.id, "muted"])) } })) };
}

export function trieBuild(words = ["car", "cat", "cart", "dog"]): Diagram {
  const nodes: TNode[] = [{ id: 0, label: "•", parent: null }], child: Record<string, number> = {}, end = new Set<number>(), frames: TreeFrame[] = [];
  for (const w of words) for (let k = 1; k <= w.length; k++) { const pre = w.slice(0, k); if (!(pre in child)) { const id = nodes.length; child[pre] = id; nodes.push({ id, label: w[k - 1], parent: k === 1 ? 0 : child[w.slice(0, k - 1)] }); } }
  for (const w of words) {
    const path = [0, ...Array.from({ length: w.length }, (_, k) => child[w.slice(0, k + 1)])]; end.add(path[path.length - 1]);
    frames.push({ note: `insert "${w}": walk shared prefix, create missing nodes, mark the last one as a word end. O(length)`, tones: { ...Object.fromEntries([...end].map((x) => [x, "found"])), ...Object.fromEntries(path.slice(0, -1).map((x) => [x, "active"])), [path[path.length - 1]]: "found" }, badges: Object.fromEntries([...end].map((x) => [x, "end"])) });
  }
  const shown = new Set<number>();
  return { kind: "tree", title: `Trie of ${words.map((w) => `"${w}"`).join(", ")}`, nodes, frames: frames.map((f, k) => { words.slice(0, k + 1).forEach((w) => { shown.add(0); for (let j = 1; j <= w.length; j++) shown.add(child[w.slice(0, j)]); }); const seen = new Set(shown); return { ...f, tones: { ...Object.fromEntries(nodes.filter((n) => !seen.has(n.id)).map((n) => [n.id, "muted"])), ...f.tones } }; }) };
}

export function recursionTree(kind: "fib" | "subsets" = "fib"): Diagram {
  const nodes: TNode[] = [], frames: TreeFrame[] = [], memo = new Map<number, number>();
  if (kind === "fib") {
    const go = (n: number, parent: number | null, side?: "L" | "R"): number => {
      const id = nodes.length; nodes.push({ id, label: `f(${n})`, parent, side });
      if (memo.has(n)) { frames.push({ note: `f(${n}) already computed → memo hit, no recursion`, tones: { [id]: "found" } }); return memo.get(n)!; }
      if (n < 2) { frames.push({ note: `f(${n}) = ${n} (base case)`, tones: { [id]: "done" } }); return n; }
      const v = go(n - 1, id, "L") + go(n - 2, id, "R"); memo.set(n, v);
      frames.push({ note: `f(${n}) = ${v}, stored in memo`, tones: { [id]: "active" } }); return v;
    };
    go(5, null);
    return { kind: "tree", title: "Memoised recursion: each state solved once (Fibonacci)", nodes, frames: frames.map((f, k) => ({ ...f, tones: { ...Object.fromEntries(frames.slice(0, k).flatMap((g) => Object.keys(g.tones || {}).map((x) => [+x, "done" as Tone]))), ...f.tones } })) };
  }
  const items = ["a", "b", "c"];
  const go = (i: number, cur: string, parent: number | null, side?: "L" | "R", edge?: string) => {
    const id = nodes.length; nodes.push({ id, label: cur ? `{${cur}}` : "{}", parent, side, edge });
    if (i === items.length) { frames.push({ note: `Leaf → record subset {${cur.split("").join(",")}}`, tones: { [id]: "found" } }); return; }
    frames.push({ note: `Index ${i}: choose to skip or take '${items[i]}'`, tones: { [id]: "active" } });
    go(i + 1, cur, id, "L", `skip ${items[i]}`); go(i + 1, cur + items[i], id, "R", `take ${items[i]}`);
  };
  go(0, "", null);
  return { kind: "tree", title: "Backtracking decision tree: 2ⁿ subsets", nodes, frames: frames.map((f, k) => ({ ...f, tones: { ...Object.fromEntries(frames.slice(0, k).flatMap((g) => Object.keys(g.tones || {}).map((x) => [+x, "done" as Tone]))), ...f.tones } })) };
}

/* ================= graphs ================= */

const G_NODES = [{ id: 0, label: "A", x: 10, y: 50 }, { id: 1, label: "B", x: 32, y: 18 }, { id: 2, label: "C", x: 32, y: 82 }, { id: 3, label: "D", x: 58, y: 18 }, { id: 4, label: "E", x: 58, y: 82 }, { id: 5, label: "F", x: 86, y: 50 }];
const G_EDGES = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 4]] as const;

export function graphSearch(mode: "bfs" | "dfs"): Diagram {
  const adj = G_NODES.map(() => [] as number[]); G_EDGES.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); }); adj.forEach((l) => l.sort());
  const frames: GraphFrame[] = [], seen = new Set([0]), tones: Record<number, Tone> = {}, edgeTones: Record<string, Tone> = {}, badges: Record<number, string> = { 0: mode === "bfs" ? "d0" : "1" };
  if (mode === "bfs") {
    const q = [0], dist: Record<number, number> = { 0: 0 };
    frames.push({ note: "Push the source, mark it seen", tones: { 0: "active" }, badges: { ...badges } });
    while (q.length) { const u = q.shift()!; tones[u] = "done"; for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); dist[v] = dist[u] + 1; q.push(v); tones[v] = "window"; edgeTones[`${Math.min(u, v)}-${Math.max(u, v)}`] = "found"; badges[v] = `d${dist[v]}`; } frames.push({ note: `Pop ${G_NODES[u].label}, push unseen neighbours. Queue: [${q.map((x) => G_NODES[x].label).join(", ")}]`, tones: { ...tones, [u]: "active" }, edgeTones: { ...edgeTones }, badges: { ...badges } }); }
    frames.push({ note: "Every node got the fewest-edges distance from A: BFS = shortest path on unweighted graphs", tones: Object.fromEntries(G_NODES.map((n) => [n.id, "done"])), edgeTones: { ...edgeTones }, badges: { ...badges } });
  } else {
    let k = 1;
    const go = (u: number) => { tones[u] = "active"; frames.push({ note: `Enter ${G_NODES[u].label}, go deep into its first unseen neighbour`, tones: { ...tones }, edgeTones: { ...edgeTones }, badges: { ...badges } }); for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); badges[v] = String(++k); edgeTones[`${Math.min(u, v)}-${Math.max(u, v)}`] = "found"; go(v); } tones[u] = "done"; frames.push({ note: `${G_NODES[u].label} has no unseen neighbours → backtrack`, tones: { ...tones }, edgeTones: { ...edgeTones }, badges: { ...badges } }); };
    go(0);
  }
  return { kind: "graph", title: mode === "bfs" ? "BFS: explore in rings of distance" : "DFS: go deep, then backtrack", nodes: G_NODES, edges: G_EDGES.map(([a, b]) => ({ a, b })), frames };
}

export function topoSort(): Diagram {
  const nodes = [{ id: 0, label: "math", x: 10, y: 25 }, { id: 1, label: "dsa", x: 40, y: 25 }, { id: 2, label: "os", x: 40, y: 78 }, { id: 3, label: "dbms", x: 68, y: 78 }, { id: 4, label: "sde", x: 90, y: 45 }];
  const edges = [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4]] as const;
  const indeg = nodes.map(() => 0); edges.forEach(([, b]) => indeg[b]++);
  const frames: GraphFrame[] = [], tones: Record<number, Tone> = {}, badges: Record<number, string> = Object.fromEntries(indeg.map((d, i) => [i, `in ${d}`])), order: string[] = [];
  const q = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
  frames.push({ note: "Count in-degrees. Nodes with 0 prerequisites go in the queue.", tones: Object.fromEntries(q.map((x) => [x, "window"])), badges: { ...badges } });
  while (q.length) { const u = q.shift()!; order.push(nodes[u].label); tones[u] = "done"; for (const [a, b] of edges) if (a === u && --indeg[b] === 0) { q.push(b); tones[b] = "window"; } Object.assign(badges, Object.fromEntries(indeg.map((d, i) => [i, tones[i] === "done" ? `#${order.indexOf(nodes[i].label) + 1}` : `in ${d}`]))); frames.push({ note: `Take ${nodes[u].label}, remove its edges, enqueue anything that hit in-degree 0. Order: ${order.join(" → ")}`, tones: { ...tones, [u]: "active" }, badges: { ...badges } }); }
  frames.push({ note: order.length === nodes.length ? "All nodes placed → valid order (no cycle). If some never reach 0, there is a cycle." : "Cycle detected", tones: { ...tones }, badges: { ...badges } });
  return { kind: "graph", title: "Topological sort (Kahn's algorithm)", nodes, edges: edges.map(([a, b]) => ({ a, b, directed: true })), frames };
}

export function dijkstra(): Diagram {
  const edges = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 4, 5], [3, 5, 3], [4, 5, 1]] as const;
  const adj = G_NODES.map(() => [] as [number, number][]); edges.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });
  const dist = G_NODES.map(() => Infinity), done = new Set<number>(), frames: GraphFrame[] = [], edgeTones: Record<string, Tone> = {}; dist[0] = 0;
  const badge = () => Object.fromEntries(dist.map((d, i) => [i, d === Infinity ? "∞" : String(d)]));
  frames.push({ note: "dist[A] = 0, everything else ∞. Min-heap holds (dist, node).", tones: { 0: "active" }, badges: badge() });
  while (done.size < G_NODES.length) {
    let u = -1; dist.forEach((d, i) => { if (!done.has(i) && (u === -1 || d < dist[u])) u = i; });
    done.add(u); const relaxed: string[] = [];
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; relaxed.push(`${G_NODES[v].label}=${dist[v]}`); edgeTones[`${Math.min(u, v)}-${Math.max(u, v)}`] = "found"; }
    frames.push({ note: `Pop closest unfinished: ${G_NODES[u].label} (${dist[u]}). It is final. ${relaxed.length ? "Relax: " + relaxed.join(", ") : "No improvements."}`, tones: { ...Object.fromEntries([...done].map((x) => [x, "done"])), [u]: "active" }, edgeTones: { ...edgeTones }, badges: badge() });
  }
  return { kind: "graph", title: "Dijkstra: greedily finalise the closest node", nodes: G_NODES, edges: edges.map(([a, b, w]) => ({ a, b, w })), frames };
}

export function unionFind(): Diagram {
  const parent = G_NODES.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const ops = [[0, 1], [2, 4], [1, 3], [3, 5], [4, 5]] as const, frames: GraphFrame[] = [], edgeTones: Record<string, Tone> = {};
  const tonesOf = (): Record<number, Tone> => { const roots = [...new Set(G_NODES.map((n) => find(n.id)))]; const pal: Tone[] = ["active", "found", "window", "bad", "done", "muted"]; return Object.fromEntries(G_NODES.map((n) => [n.id, pal[roots.indexOf(find(n.id))]])); };
  frames.push({ note: "Every node starts as its own set (its own colour)", tones: tonesOf(), badges: Object.fromEntries(G_NODES.map((n) => [n.id, "root"])) });
  for (const [a, b] of ops) { const ra = find(a), rb = find(b), cyc = ra === rb; if (!cyc) parent[rb] = ra; edgeTones[`${Math.min(a, b)}-${Math.max(a, b)}`] = cyc ? "bad" : "found"; frames.push({ note: cyc ? `${G_NODES[a].label} and ${G_NODES[b].label} already share a root → this edge makes a cycle` : `union(${G_NODES[a].label}, ${G_NODES[b].label}): point one root at the other. Sets: ${new Set(G_NODES.map((n) => find(n.id))).size}`, tones: tonesOf(), edgeTones: { ...edgeTones }, badges: Object.fromEntries(G_NODES.map((n) => [n.id, find(n.id) === n.id ? "root" : "→" + G_NODES[find(n.id)].label])) }); }
  return { kind: "graph", title: "Union-Find: merge sets, detect cycles in near O(1)", nodes: G_NODES, edges: ops.map(([a, b]) => ({ a, b })), frames };
}

export function kruskal(): Diagram {
  const edges = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 5], [2, 4, 8], [3, 5, 3], [4, 5, 2], [1, 4, 6]] as const;
  const parent = G_NODES.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const frames: GraphFrame[] = [], edgeTones: Record<string, Tone> = {}; let total = 0;
  for (const [a, b, w] of [...edges].sort((x, y) => x[2] - y[2])) { const k = `${Math.min(a, b)}-${Math.max(a, b)}`, ra = find(a), rb = find(b); if (ra !== rb) { parent[rb] = ra; total += w; edgeTones[k] = "found"; frames.push({ note: `Cheapest left: ${G_NODES[a].label}-${G_NODES[b].label} (${w}) joins two components → take it. Total ${total}`, edgeTones: { ...edgeTones } }); } else { edgeTones[k] = "bad"; frames.push({ note: `${G_NODES[a].label}-${G_NODES[b].label} (${w}) would form a cycle → skip`, edgeTones: { ...edgeTones } }); } }
  return { kind: "graph", title: "Kruskal MST: sort edges, add if no cycle", nodes: G_NODES, edges: edges.map(([a, b, w]) => ({ a, b, w })), frames };
}

export function bipartite(): Diagram {
  const adj = G_NODES.map(() => [] as number[]); const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]] as const; edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const col: Record<number, number> = { 0: 0 }, q = [0], frames: GraphFrame[] = [];
  const tones = () => Object.fromEntries(Object.entries(col).map(([k, c]) => [+k, c ? "found" : "active"])) as Record<number, Tone>;
  frames.push({ note: "Colour the start node side 0", tones: tones() });
  while (q.length) { const u = q.shift()!; for (const v of adj[u]) if (!(v in col)) { col[v] = 1 - col[u]; q.push(v); } frames.push({ note: `Neighbours of ${G_NODES[u].label} get the opposite side. A neighbour with the SAME side would mean an odd cycle → not bipartite`, tones: tones() }); }
  return { kind: "graph", title: "Bipartite check: 2-colour with BFS", nodes: G_NODES, edges: edges.map(([a, b]) => ({ a, b })), frames };
}

export function gridFlood(): Diagram {
  const g = ["11000", "11010", "00100", "00011"].map((r) => r.split(""));
  const lab: (string | number | null)[][] = g.map((r) => r.map((c) => (c === "1" ? "1" : "0"))), frames: TableFrame[] = []; let id = 0;
  for (let r = 0; r < g.length; r++) for (let c = 0; c < g[0].length; c++) if (g[r][c] === "1") {
    id++; const st = [[r, c]]; g[r][c] = "#";
    while (st.length) { const [y, x] = st.pop()!; lab[y][x] = `#${id}`; for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ny = y + dy, nx = x + dx; if (g[ny]?.[nx] === "1") { g[ny][nx] = "#"; st.push([ny, nx]); } } }
    frames.push({ note: `Land at (${r},${c}) not yet visited → island #${id}. Flood its 4-neighbours so we never count them again.`, cells: lab.map((x) => [...x]), active: [r, c] });
  }
  frames.push({ note: `${id} islands. Each cell visited once: O(rows × cols).`, cells: lab.map((x) => [...x]) });
  return { kind: "table", title: "Grid as a graph: count islands with flood fill", rowHead: ["0", "1", "2", "3"], colHead: ["0", "1", "2", "3", "4"], frames };
}

/* ================= DP tables ================= */

export function lcsTable(a = "abcde", b = "ace"): Diagram {
  const dp = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0)), frames: TableFrame[] = [];
  const show = (r: number, c: number) => dp.map((row, i) => row.map((v, j) => (i < r || (i === r && j <= c) ? v : null)));
  for (let i = 1; i <= b.length; i++) for (let j = 1; j <= a.length; j++) {
    const m = b[i - 1] === a[j - 1]; dp[i][j] = m ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    frames.push({ note: m ? `'${a[j - 1]}' = '${b[i - 1]}' → diagonal + 1 = ${dp[i][j]}` : `'${a[j - 1]}' ≠ '${b[i - 1]}' → max(up, left) = ${dp[i][j]}`, cells: show(i, j), active: [i, j], deps: m ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]] });
  }
  return { kind: "table", title: `LCS of "${a}" and "${b}": dp[i][j] from 3 neighbours`, rowHead: ["", ...b.split("")], colHead: ["", ...a.split("")], frames };
}

export function knapsackTable(w = [1, 3, 4], v = [15, 20, 30], W = 4): Diagram {
  const dp = Array.from({ length: w.length + 1 }, () => Array(W + 1).fill(0)), frames: TableFrame[] = [];
  const show = (r: number, c: number) => dp.map((row, i) => row.map((x, j) => (i < r || (i === r && j <= c) ? x : null)));
  for (let i = 1; i <= w.length; i++) for (let c = 0; c <= W; c++) {
    const skip = dp[i - 1][c], take = c >= w[i - 1] ? dp[i - 1][c - w[i - 1]] + v[i - 1] : -1; dp[i][c] = Math.max(skip, take);
    frames.push({ note: `item ${i} (w=${w[i - 1]}, v=${v[i - 1]}), cap ${c}: skip = ${skip}${take >= 0 ? `, take = ${take}` : ", too heavy"} → ${dp[i][c]}`, cells: show(i, c), active: [i, c], deps: take >= 0 ? [[i - 1, c], [i - 1, c - w[i - 1]]] : [[i - 1, c]] });
  }
  return { kind: "table", title: "0/1 knapsack: take it or leave it", rowHead: ["none", ...w.map((x, i) => `#${i + 1} w${x}`)], colHead: Array.from({ length: W + 1 }, (_, c) => `cap ${c}`), frames };
}

export function gridPaths(R = 3, C = 4): Diagram {
  const dp = Array.from({ length: R }, () => Array(C).fill(0)), frames: TableFrame[] = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    dp[r][c] = r === 0 || c === 0 ? 1 : dp[r - 1][c] + dp[r][c - 1];
    frames.push({ note: r === 0 || c === 0 ? `Edge cell: only one way in → 1` : `paths = from above (${dp[r - 1][c]}) + from left (${dp[r][c - 1]}) = ${dp[r][c]}`, cells: dp.map((row, i) => row.map((x, j) => (i < r || (i === r && j <= c) ? x : null))), active: [r, c], deps: r && c ? [[r - 1, c], [r, c - 1]] : [] });
  }
  return { kind: "table", title: "Grid DP: unique paths moving right/down", rowHead: Array.from({ length: R }, (_, i) => String(i)), colHead: Array.from({ length: C }, (_, i) => String(i)), frames };
}

export function houseRobber(arr = [2, 7, 9, 3, 1]): Diagram {
  const dp: (string | number)[] = arr.map(() => ""), frames: CellsFrame[] = [];
  arr.forEach((x, i) => { const take = x + (i >= 2 ? +dp[i - 2] : 0), skip = i >= 1 ? +dp[i - 1] : 0; dp[i] = Math.max(take, skip); frames.push({ note: `House ${i}: rob (${x} + dp[i-2] = ${take}) vs skip (dp[i-1] = ${skip}) → ${dp[i]}`, rows: [arr, [...dp]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found", ...(i >= 2 ? { [`1:${i - 2}`]: "window" } : {}), ...(i >= 1 ? { [`1:${i - 1}`]: "window" } : {}) } }); });
  return { kind: "cells", title: "1D DP: each index decides from the last two", rowLabels: ["money", "dp"], rows: [arr, arr.map(() => "")], frames };
}

export function lisTails(arr = [10, 9, 2, 5, 3, 7, 101, 18]): Diagram {
  const tails: number[] = [], frames: CellsFrame[] = [];
  arr.forEach((x, i) => { let lo = 0, hi = tails.length; while (lo < hi) { const m = (lo + hi) >> 1; if (tails[m] < x) lo = m + 1; else hi = m; } const grew = lo === tails.length; tails[lo] = x; frames.push({ note: grew ? `${x} is bigger than every tail → append. LIS length ${tails.length}` : `${x} replaces tails[${lo}] (binary search): a smaller tail keeps more options open`, rows: [arr, [...tails, ...Array(arr.length - tails.length).fill("")]], tones: { [`0:${i}`]: "active", [`1:${lo}`]: grew ? "found" : "window" } }); });
  return { kind: "cells", title: "LIS in O(n log n): patience tails", rowLabels: ["nums", "tails"], rows: [arr, arr.map(() => "")], frames };
}

export function intervalDp(): Diagram {
  // matrix chain on dims [10, 30, 5, 60]
  const d = [10, 30, 5, 60], n = d.length - 1, dp = Array.from({ length: n }, () => Array(n).fill(null as number | null)), frames: TableFrame[] = [];
  for (let i = 0; i < n; i++) dp[i][i] = 0;
  frames.push({ note: "Length-1 ranges cost 0. Fill by increasing range length.", cells: dp.map((r) => [...r]) });
  for (let len = 2; len <= n; len++) for (let i = 0; i + len - 1 < n; i++) { const j = i + len - 1; let best = Infinity, at = i; for (let k = i; k < j; k++) { const c = dp[i][k]! + dp[k + 1][j]! + d[i] * d[k + 1] * d[j + 1]; if (c < best) { best = c; at = k; } } dp[i][j] = best; frames.push({ note: `range [${i}..${j}]: try every split k, best k = ${at} → ${best}`, cells: dp.map((r) => [...r]), active: [i, j], deps: [[i, at], [at + 1, j]] }); }
  return { kind: "table", title: "Interval DP: best split of every range (matrix chain)", rowHead: ["M0", "M1", "M2"], colHead: ["M0", "M1", "M2"], frames };
}

export function stateMachine(prices = [1, 2, 3, 0, 2]): Diagram {
  const rows: (string | number)[][] = [prices, prices.map(() => ""), prices.map(() => ""), prices.map(() => "")], frames: CellsFrame[] = [];
  let hold = -Infinity, sold = 0, rest = 0;
  const f = (x: number) => (Number.isFinite(x) ? String(x) : "none");
  prices.forEach((p, i) => { const h = Math.max(hold, rest - p), s = hold + p, r = Math.max(rest, sold); hold = h; sold = s; rest = r; rows[1][i] = f(hold); rows[2][i] = f(sold); rows[3][i] = f(rest); frames.push({ note: `Day ${i} (price ${p}): hold = max(keep, buy from rest) = ${f(hold)}; sold = hold + price = ${f(sold)}; rest = max(rest, cooldown) = ${f(rest)}`, rows: rows.map((r) => [...r]), tones: { [`0:${i}`]: "active", [`1:${i}`]: "window", [`2:${i}`]: "window", [`3:${i}`]: "window" } }); });
  return { kind: "cells", title: "State-machine DP: stock with cooldown", rowLabels: ["price", "hold", "sold", "rest"], rows, frames };
}

/* ================= bits & math ================= */

const bin = (x: number, w = 8) => (x >>> 0).toString(2).padStart(w, "0").split("");

export function bitOps(x = 44, i = 2): Diagram {
  const frames: CellsFrame[] = [];
  const row = (v: number) => bin(v);
  const col = 7 - i;
  frames.push({ note: `x = ${x}. Bit i counts from the right, starting at 0.`, rows: [row(x), row(0)], tones: { [`0:${col}`]: "active" } });
  frames.push({ note: `Test: (x >> ${i}) & 1 = ${(x >> i) & 1}`, rows: [row(x), row(1 << i)], tones: { [`0:${col}`]: "found", [`1:${col}`]: "found" } });
  frames.push({ note: `Toggle: x ^ (1 << ${i}) = ${x ^ (1 << i)}`, rows: [row(x ^ (1 << i)), row(1 << i)], tones: { [`0:${col}`]: "active", [`1:${col}`]: "active" } });
  frames.push({ note: `Lowest set bit: x & -x = ${x & -x}`, rows: [row(x), row(x & -x)], tones: { [`1:${7 - Math.log2(x & -x)}`]: "found" } });
  frames.push({ note: `Clear lowest set bit: x & (x - 1) = ${x & (x - 1)}. Loop it to count set bits (Kernighan).`, rows: [row(x), row(x & (x - 1))], tones: { [`0:${7 - Math.log2(x & -x)}`]: "bad" } });
  return { kind: "cells", title: "Bit tricks on one byte", rowLabels: ["x", "mask"], rows: [row(x), row(0)], frames };
}

export function xorSingle(arr = [4, 1, 2, 1, 2]): Diagram {
  const frames: CellsFrame[] = []; let acc = 0;
  arr.forEach((x, i) => { acc ^= x; frames.push({ note: `acc ^= ${x} → ${acc}. Pairs cancel because a ^ a = 0 and a ^ 0 = a.`, rows: [arr, bin(acc, 4)], tones: { [`0:${i}`]: "active", ...range(0, i - 1, 0, "done") } }); });
  frames.push({ note: `Everything paired cancelled out → the lone number is ${acc}`, rows: [arr, bin(acc, 4)], tones: { [`0:${arr.indexOf(acc)}`]: "found" } });
  return { kind: "cells", title: "XOR cancels pairs: single number", rowLabels: ["nums", "acc (bits)"], rows: [arr, bin(0, 4)], frames };
}

export function sieve(n = 30): Diagram {
  const nums = Array.from({ length: n - 1 }, (_, i) => i + 2), comp = new Set<number>(), frames: CellsFrame[] = [];
  for (let p = 2; p * p <= n; p++) { if (comp.has(p)) continue; const crossed: number[] = []; for (let m = p * p; m <= n; m += p) if (!comp.has(m)) { comp.add(m); crossed.push(m); } frames.push({ note: `${p} is prime → cross out multiples from ${p}² = ${p * p}: ${crossed.join(", ")}`, tones: Object.fromEntries(nums.map((x, i) => [`0:${i}`, x === p ? "active" : comp.has(x) ? "muted" : x < p ? "found" : "window"])) as Record<string, Tone> }); }
  frames.push({ note: `Stop once p² > ${n}. Remaining are prime. O(n log log n).`, tones: Object.fromEntries(nums.map((x, i) => [`0:${i}`, comp.has(x) ? "muted" : "found"])) as Record<string, Tone> });
  return { kind: "cells", title: `Sieve of Eratosthenes up to ${n}`, rows: [nums], frames };
}

export function fastPow(a = 3, n = 13): Diagram {
  const frames: CellsFrame[] = []; let res = 1, base = a, e = n; const bits = n.toString(2).split("");
  let step = 0;
  while (e) { const bit = e & 1; if (bit) res *= base; frames.push({ note: `bit ${step} of ${n} is ${bit}: ${bit ? `result *= ${a}^${2 ** step} → ${res}` : "skip"}; square base → ${a}^${2 ** (step + 1)}`, rows: [bits], tones: { [`0:${bits.length - 1 - step}`]: bit ? "found" : "muted" } }); base *= base; e >>= 1; step++; }
  frames.push({ note: `${a}^${n} = ${res} in ${step} squarings instead of ${n - 1} multiplications: O(log n)`, rows: [bits], tones: range(0, bits.length - 1, 0, "done") });
  return { kind: "cells", title: `Fast power: ${a}^${n} via the bits of ${n} (${n.toString(2)})`, rowLabels: ["n bits"], rows: [bits], frames };
}

export function gcdSteps(a = 252, b = 105): Diagram {
  const rows: (string | number)[][] = [], frames: TableFrame[] = [];
  while (b) { rows.push([a, b, a % b]); frames.push({ note: `gcd(${a}, ${b}) = gcd(${b}, ${a} mod ${b} = ${a % b})`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); [a, b] = [b, a % b]; }
  frames.push({ note: `Remainder hit 0 → gcd = ${a}. O(log min(a, b)). lcm = a·b / gcd.`, cells: rows.map((r) => [...r]) });
  return { kind: "table", title: "Euclid's GCD", rowHead: rows.map((_, i) => `step ${i + 1}`), colHead: ["a", "b", "a mod b"], frames };
}

export function cycleNumber(n = 2): Diagram {
  const seq: number[] = [], f = (x: number) => String(x).split("").reduce((s, d) => s + (+d) ** 2, 0); let x = n;
  while (!seq.includes(x) && seq.length < 12) { seq.push(x); x = f(x); }
  const at = seq.indexOf(x), frames: CellsFrame[] = seq.map((v, i) => ({ note: `step ${i}: ${v} → sum of squared digits → ${f(v)}`, tones: { [`0:${i}`]: "active", ...range(0, i - 1, 0, "done") } }));
  frames.push({ note: x === 1 ? "Reached 1 → happy" : `Value ${x} repeats → a cycle that never reaches 1, so ${n} is not happy. Floyd's slow/fast detects this with O(1) memory.`, tones: { ...range(at, seq.length - 1, 0, "bad") } });
  return { kind: "cells", title: `Numbers as a linked list: happy number check for ${n}`, rows: [seq], frames };
}

export function bitmaskSubsets(items = ["a", "b", "c"]): Diagram {
  const n = items.length, frames: TableFrame[] = [], rows: (string | number | null)[][] = [];
  for (let m = 0; m < 1 << n; m++) { rows.push([m, bin(m, n).join(""), "{" + items.filter((_, i) => m & (1 << i)).join(",") + "}"]); frames.push({ note: `mask ${m} = ${bin(m, n).join("")}: bit i set ⇒ take items[i]`, cells: rows.map((r) => [...r]), active: [m, 2] }); }
  return { kind: "table", title: "Bitmask enumeration: 2ⁿ masks = all subsets", rowHead: rows.map((_, i) => String(i)), colHead: ["mask", "binary", "subset"], frames };
}

export function jumpGame(arr = [2, 3, 1, 1, 4]): Diagram {
  const frames: CellsFrame[] = []; let reach = 0;
  for (let i = 0; i < arr.length && i <= reach; i++) { reach = Math.max(reach, i + arr[i]); frames.push({ note: `At ${i} (jump ${arr[i]}): farthest reach = ${reach}${reach >= arr.length - 1 ? " → can reach the end" : ""}`, tones: { ...range(i, Math.min(reach, arr.length - 1)), [`0:${i}`]: "active" } }); if (reach >= arr.length - 1) break; }
  return { kind: "cells", title: "Jump game: track the farthest reachable index", rows: [arr], frames };
}

export function trapWater(h = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]): Diagram {
  let l = 0, r = h.length - 1, lm = 0, rm = 0, total = 0; const w: (string | number)[] = h.map(() => ""), frames: CellsFrame[] = [];
  while (l < r) { if (h[l] < h[r]) { lm = Math.max(lm, h[l]); w[l] = lm - h[l]; total += lm - h[l]; frames.push({ note: `Left side is lower → water at ${l} = leftMax ${lm} - ${h[l]} = ${lm - h[l]} (total ${total})`, rows: [h, [...w]], tones: { [`0:${l}`]: "active", [`1:${l}`]: "found" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); l++; } else { rm = Math.max(rm, h[r]); w[r] = rm - h[r]; total += rm - h[r]; frames.push({ note: `Right side is lower → water at ${r} = rightMax ${rm} - ${h[r]} = ${rm - h[r]} (total ${total})`, rows: [h, [...w]], tones: { [`0:${r}`]: "active", [`1:${r}`]: "found" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); r--; } }
  return { kind: "cells", title: "Trapping rain water with two pointers", rowLabels: ["height", "water"], rows: [h, h.map(() => "")], frames };
}

export function partitionLabels(s = "ababcbacadefegdehijhklij"): Diagram {
  const last: Record<string, number> = {}; [...s].forEach((c, i) => (last[c] = i));
  const frames: CellsFrame[] = []; let start = 0, end = 0; const done: Record<string, Tone> = {};
  [...s].forEach((c, i) => { end = Math.max(end, last[c]); if (i === end) { Object.assign(done, range(start, end, 0, "found")); frames.push({ note: `i reached the farthest last-occurrence (${end}) → cut a part of size ${end - start + 1}`, tones: { ...done } }); start = i + 1; } else if (i % 3 === 0) frames.push({ note: `'${c}' last appears at ${last[c]} → part must extend to at least ${end}`, tones: { ...done, ...range(start, end), [`0:${i}`]: "active" } }); });
  return { kind: "cells", title: "Partition labels: extend to each letter's last occurrence", rows: [s.split("")], frames };
}

export function heapGreedy(): Diagram {
  const frames: StackFrame[] = []; let h = [8, 7, 4, 2, 1, 1];
  while (h.length > 1) { h.sort((a, b) => b - a); const [a, b] = h; h = h.slice(2); if (a !== b) h.push(a - b); frames.push({ note: `Smash the two heaviest (${a}, ${b}) → ${a === b ? "both gone" : `${a - b} goes back`}`, items: [...h].sort((x, y) => x - y), popped: [a, b] }); }
  frames.push({ note: `Last stone: ${h[0] ?? 0}. Max-heap gives the two heaviest in O(log n) each.`, items: h });
  return { kind: "stack", title: "Heap-driven greedy: always act on the current best (Last Stone Weight)", frames };
}

export function topK(arr = [3, 2, 1, 5, 6, 4], k = 2): Diagram {
  const frames: StackFrame[] = [], h: number[] = [];
  for (const x of arr) { h.push(x); h.sort((a, b) => a - b); let popped: number[] = []; if (h.length > k) popped = [h.shift()!]; frames.push({ note: `push ${x}${popped.length ? `, size > ${k} → pop the smallest (${popped[0]})` : ""}. Heap top = ${h[0]} = current ${h.length === k ? `${k}th largest` : "candidate"}`, items: [...h].reverse(), incoming: x, popped }); }
  return { kind: "stack", title: `Top-K with a size-${k} min-heap: kth largest`, frames };
}

export function twoHeaps(stream = [5, 15, 1, 3, 8]): Diagram {
  const lo: number[] = [], hi: number[] = [], frames: TableFrame[] = [];
  for (const x of stream) { lo.push(x); lo.sort((a, b) => b - a); hi.push(lo.shift()!); hi.sort((a, b) => a - b); if (hi.length > lo.length) { lo.push(hi.shift()!); lo.sort((a, b) => b - a); } const med = lo.length > hi.length ? lo[0] : (lo[0] + hi[0]) / 2; frames.push({ note: `add ${x}: rebalance so |low| = |high| or one more. median = ${med}`, cells: [[lo.join(", ") || "-"], [hi.join(", ") || "-"], [med]] }); }
  return { kind: "table", title: "Two heaps: running median", rowHead: ["low (max-heap)", "high (min-heap)", "median"], colHead: ["contents"], frames };
}

export function kWayMerge(): Diagram {
  const lists = [[1, 4, 7], [2, 5, 8], [3, 6, 9]], idx = [0, 0, 0], out: number[] = [], frames: CellsFrame[] = [];
  while (out.length < 9) { let b = -1; lists.forEach((l, i) => { if (idx[i] < l.length && (b === -1 || l[idx[i]] < lists[b][idx[b]])) b = i; }); out.push(lists[b][idx[b]]); frames.push({ note: `Heap of list heads gives min ${lists[b][idx[b]]} from list ${b + 1}; push that list's next element. O(N log k)`, rows: [...lists, [...out, ...Array(9 - out.length).fill("")]], tones: { [`${b}:${idx[b]}`]: "active", [`3:${out.length - 1}`]: "found", ...Object.assign({}, ...lists.map((_, i) => range(0, idx[i] - 1, i, "done"))) } }); idx[b]++; }
  return { kind: "cells", title: "K-way merge with a min-heap of heads", rowLabels: ["L1", "L2", "L3", "out"], rows: [...lists, Array(9).fill("")], frames };
}

/* ================= more simulators (one visualiser per pattern) ================= */

export function quickselect(arr = [7, 2, 9, 4, 1, 8, 3], k = 3): Diagram {
  const a = [...arr], frames: CellsFrame[] = []; let lo = 0, hi = a.length - 1; const want = a.length - k;
  while (lo <= hi) {
    const pivot = a[hi]; let i = lo;
    for (let j = lo; j < hi; j++) if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
    [a[i], a[hi]] = [a[hi], a[i]];
    frames.push({ note: `Partition [${lo}..${hi}] around pivot ${pivot}: smaller to the left, pivot lands at ${i}. ${i === want ? "That is index n-k → done" : i < want ? "Target is right of it → recurse right only" : "Target is left of it → recurse left only"}`, rows: [[...a]], tones: { ...range(lo, hi), [`0:${i}`]: i === want ? "found" : "active", ...range(0, lo - 1, 0, "muted"), ...range(hi + 1, a.length - 1, 0, "muted") } });
    if (i === want) break; if (i < want) lo = i + 1; else hi = i - 1;
  }
  return { kind: "cells", title: `Quickselect: ${k}rd largest in average O(n)`, rows: [arr], frames };
}

export function buildTree(pre = [3, 9, 20, 15, 7], ino = [9, 3, 15, 20, 7]): Diagram {
  const nodes: TNode[] = [], frames: TreeFrame[] = []; let p = 0;
  const go = (lo: number, hi: number, parent: number | null, side?: "L" | "R"): void => {
    if (lo > hi) return; const v = pre[p++], m = ino.indexOf(v), id = nodes.length;
    nodes.push({ id, label: String(v), parent, side });
    frames.push({ note: `Next preorder value ${v} is the root of inorder[${lo}..${hi}]. Left of it in inorder: [${ino.slice(lo, m).join(", ")}], right: [${ino.slice(m + 1, hi + 1).join(", ")}]`, tones: { [id]: "active" } });
    go(lo, m - 1, id, "L"); go(m + 1, hi, id, "R");
  };
  go(0, ino.length - 1, null);
  return { kind: "tree", title: "Build a tree from preorder + inorder", nodes, frames: frames.map((f, k) => ({ ...f, tones: { ...Object.fromEntries(nodes.slice(0, k).map((n) => [n.id, "done" as Tone])), ...Object.fromEntries(nodes.slice(k + 1).map((n) => [n.id, "muted" as Tone])), ...f.tones } })) };
}

export function powerOfTwo(xs = [16, 18, 32, 7]): Diagram {
  const frames: CellsFrame[] = xs.map((x) => ({ note: `${x} & ${x - 1} = ${x & (x - 1)} → ${x > 0 && (x & (x - 1)) === 0 ? "a single set bit: power of two" : "more than one set bit: not a power of two"}`, rows: [bin(x), bin(x - 1), bin(x & (x - 1))], tones: (x & (x - 1)) === 0 ? range(0, 7, 2, "found") : range(0, 7, 2, "bad") }));
  return { kind: "cells", title: "Power of two: n & (n - 1) clears the only set bit", rowLabels: ["n", "n - 1", "n & (n-1)"], rows: [bin(xs[0]), bin(xs[0] - 1), bin(0)], frames };
}

export function xorPrefix(arr = [1, 3, 4, 8], q: [number, number] = [1, 2]): Diagram {
  const P = [0]; arr.forEach((x) => P.push(P[P.length - 1] ^ x)); const frames: CellsFrame[] = [];
  for (let i = 1; i <= arr.length; i++) frames.push({ note: `X[${i}] = X[${i - 1}] ^ ${arr[i - 1]} = ${P[i]}`, rows: [arr, P.slice(0, i + 1).concat(Array(arr.length - i).fill(""))], tones: { [`1:${i}`]: "found", [`0:${i - 1}`]: "active" } });
  frames.push({ note: `xor(arr[${q[0]}..${q[1]}]) = X[${q[1] + 1}] ^ X[${q[0]}] = ${P[q[1] + 1] ^ P[q[0]]}: XOR is its own inverse, so it works like prefix sums`, rows: [arr, P], tones: { ...range(q[0], q[1]), [`1:${q[1] + 1}`]: "found", [`1:${q[0]}`]: "bad" } });
  return { kind: "cells", title: "Prefix XOR: range XOR in O(1)", rowLabels: ["arr", "X"], rows: [arr, ["0", ...arr.map(() => "")]], frames };
}

export function reverseInt(x = 1234): Diagram {
  const frames: TableFrame[] = [], rows: (string | number | null)[][] = []; let n = x, r = 0;
  while (n) { const d = n % 10; r = r * 10 + d; n = Math.trunc(n / 10); rows.push([d, n, r]); frames.push({ note: `pop digit ${d} = n % 10, push it: rev = rev*10 + ${d} = ${r}. Check overflow BEFORE multiplying in 32-bit languages.`, cells: rows.map((y) => [...y]), active: [rows.length - 1, 2] }); }
  return { kind: "table", title: `Digit math: reverse ${x}`, rowHead: rows.map((_, i) => `step ${i + 1}`), colHead: ["digit", "n left", "rev"], frames };
}

export function bitmaskDp(cost = [[9, 2, 7], [6, 4, 3], [5, 8, 1]]): Diagram {
  const n = cost.length, dp = Array(1 << n).fill(Infinity), frames: TableFrame[] = []; dp[0] = 0;
  const rows = () => dp.map((v, m) => [bin(m, n).join(""), Number.isFinite(v) ? v : "∞"]);
  for (let m = 0; m < 1 << n; m++) { if (!Number.isFinite(dp[m])) continue; const person = bin(m, 32).filter((b) => b === "1").length; if (person === n) continue; for (let j = 0; j < n; j++) if (!(m & (1 << j))) { const nm = m | (1 << j); if (dp[m] + cost[person][j] < dp[nm]) dp[nm] = dp[m] + cost[person][j]; } frames.push({ note: `From mask ${bin(m, n).join("")} (person ${person} next): try every free job j, dp[mask | 1<<j] = min(.., dp[mask] + cost[${person}][j])`, cells: rows(), active: [m, 1] }); }
  frames.push({ note: `dp[${bin((1 << n) - 1, n).join("")}] = ${dp[(1 << n) - 1]}: min cost to assign all jobs. States 2ⁿ, each tries n moves → O(2ⁿ · n)`, cells: rows(), active: [(1 << n) - 1, 1] });
  return { kind: "table", title: "Bitmask DP: the set of used jobs is the state", rowHead: dp.map((_, m) => String(m)), colHead: ["mask (jobs used)", "min cost"], frames };
}

export function bellmanFord(): Diagram {
  const nodes = [{ id: 0, label: "S", x: 10, y: 50 }, { id: 1, label: "A", x: 40, y: 18 }, { id: 2, label: "B", x: 40, y: 82 }, { id: 3, label: "C", x: 75, y: 18 }, { id: 4, label: "T", x: 90, y: 70 }];
  const edges = [[0, 1, 4], [0, 2, 5], [2, 1, -3], [1, 3, 2], [3, 4, 1], [2, 4, 6]] as const;
  const dist = nodes.map(() => Infinity), frames: GraphFrame[] = []; dist[0] = 0;
  const badges = () => Object.fromEntries(dist.map((d, i) => [i, Number.isFinite(d) ? String(d) : "∞"]));
  frames.push({ note: "dist[S] = 0. Relax EVERY edge, V-1 times. Works with negative edges.", tones: { 0: "active" }, badges: badges() });
  for (let it = 1; it < nodes.length; it++) { const ch: string[] = []; for (const [a, b, w] of edges) if (dist[a] + w < dist[b]) { dist[b] = dist[a] + w; ch.push(`${nodes[b].label}=${dist[b]}`); } frames.push({ note: `Round ${it}: ${ch.length ? "improved " + ch.join(", ") : "nothing changed → can stop early"}`, tones: Object.fromEntries(nodes.map((n) => [n.id, Number.isFinite(dist[n.id]) ? "done" : "muted"])), badges: badges() }); if (!ch.length) break; }
  frames.push({ note: "One more round that still improves something = a negative cycle. O(V·E).", tones: Object.fromEntries(nodes.map((n) => [n.id, "found"])), badges: badges() });
  return { kind: "graph", title: "Bellman-Ford: relax all edges V-1 times", nodes, edges: edges.map(([a, b, w]) => ({ a, b, w, directed: true })), frames };
}

export function stockGreedy(p = [7, 1, 5, 3, 6, 4]): Diagram {
  const frames: CellsFrame[] = []; let profit = 0;
  for (let i = 1; i < p.length; i++) { const up = p[i] - p[i - 1]; if (up > 0) profit += up; frames.push({ note: up > 0 ? `${p[i - 1]} → ${p[i]} is an uptick: take +${up} (profit ${profit})` : `${p[i - 1]} → ${p[i]} goes down: skip`, tones: { [`0:${i - 1}`]: up > 0 ? "found" : "muted", [`0:${i}`]: up > 0 ? "found" : "bad" } }); }
  frames.push({ note: `Total ${profit}: any profitable buy-sell span equals the sum of its daily upticks`, tones: range(0, p.length - 1, 0, "done") });
  return { kind: "cells", title: "Stock II: capture every uptick", rows: [p], frames };
}

export function twoCity(costs = [[10, 20], [30, 200], [400, 50], [30, 20]]): Diagram {
  const s = costs.map((c, i) => ({ i, a: c[0], b: c[1], d: c[0] - c[1] })).sort((x, y) => x.d - y.d), frames: TableFrame[] = [];
  const cells = (k: number) => s.map((x, j) => [x.a, x.b, x.d, j < k ? (j < s.length / 2 ? "A" : "B") : null]);
  frames.push({ note: "Key = costA - costB: how much cheaper A is for this person. Sort by it.", cells: cells(0) });
  for (let k = 1; k <= s.length; k++) frames.push({ note: `${k <= s.length / 2 ? "First half (A is relatively cheapest)" : "Second half"} → send to ${k <= s.length / 2 ? "A" : "B"}`, cells: cells(k), active: [k - 1, 3] });
  return { kind: "table", title: "Sort by delta: two city scheduling", rowHead: s.map((x) => `p${x.i}`), colHead: ["costA", "costB", "A - B", "send"], frames };
}

export function topKFreq(nums = [1, 1, 1, 2, 2, 3, 3, 3, 3, 4], k = 2): Diagram {
  const cnt = new Map<number, number>(); nums.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
  const frames: StackFrame[] = [], h: [number, number][] = [];
  frames.push({ note: `Count first: ${[...cnt].map(([v, c]) => `${v}×${c}`).join(", ")}`, items: [] });
  for (const [v, c] of cnt) { h.push([c, v]); h.sort((a, b) => a[0] - b[0]); const popped = h.length > k ? [h.shift()!] : []; frames.push({ note: `push (${c}, ${v})${popped.length ? `; size > ${k} → evict the least frequent (${popped[0][1]})` : ""}`, items: h.map(([c2, v2]) => `${v2} (×${c2})`).reverse(), incoming: `${v}×${c}`, popped: popped.map(([c2, v2]) => `${v2}×${c2}`) }); }
  return { kind: "stack", title: `Top ${k} frequent: counter + size-${k} min-heap on count`, frames };
}

export function intervalIntersect(A: [number, number][] = [[0, 2], [5, 10], [13, 23]], B: [number, number][] = [[1, 5], [8, 12], [15, 24]]): Diagram {
  const items = [...A, ...B], frames: IntervalsFrame[] = [], res: [number, number][] = []; let i = 0, j = 0;
  while (i < A.length && j < B.length) { const lo = Math.max(A[i][0], B[j][0]), hi = Math.min(A[i][1], B[j][1]); if (lo <= hi) res.push([lo, hi]); frames.push({ note: `${lo <= hi ? `Overlap [${lo},${hi}]` : "No overlap"}. Advance whichever ends first (${A[i][1] < B[j][1] ? "A" : "B"}): it cannot meet anything else`, tones: { [i]: "active", [A.length + j]: "active" }, result: res.map((x) => [...x] as [number, number]) }); if (A[i][1] < B[j][1]) i++; else j++; }
  return { kind: "intervals", title: "Intersection of two sorted interval lists", items, frames };
}

export function calendar(req: [number, number][] = [[10, 20], [15, 25], [20, 30], [5, 10]]): Diagram {
  const booked: [number, number][] = [], frames: IntervalsFrame[] = [], tones: Record<number, Tone> = {};
  req.forEach(([s, e], i) => { const clash = booked.find(([a, b]) => s < b && a < e); if (clash) { tones[i] = "bad"; frames.push({ note: `book(${s}, ${e}) overlaps [${clash.join(",")}] (s < end and start < e) → reject`, tones: { ...tones } }); } else { booked.push([s, e]); tones[i] = "found"; frames.push({ note: `book(${s}, ${e}) fits → accept. A sorted map makes this check O(log n)`, tones: { ...tones }, result: [...booked].sort((a, b) => a[0] - b[0]) }); } });
  return { kind: "intervals", title: "Online booking: accept only non-overlapping", items: req, frames };
}

export function reorderList(vals = [1, 2, 3, 4, 5, 6]): Diagram {
  const n = vals.length, half = Math.ceil(n / 2), frames: ListFrame[] = [];
  const chain = (order: number[]) => { const nx = vals.map(() => -1); order.forEach((x, k) => (nx[x] = k + 1 < order.length ? order[k + 1] : -1)); return nx; };
  frames.push({ note: "Step 1: fast/slow finds the middle", next: chain(vals.map((_, i) => i)), ptrs: [{ i: half - 1, label: "mid" }] });
  const second = vals.map((_, i) => i).slice(half).reverse(); const nx = chain(vals.map((_, i) => i).slice(0, half)); second.forEach((x, k) => (nx[x] = k + 1 < second.length ? second[k + 1] : -1));
  frames.push({ note: `Step 2: reverse the second half → ${second.map((i) => vals[i]).join(" → ")}`, next: nx, ptrs: [{ i: second[0], label: "head2" }], tones: Object.fromEntries(second.map((i) => [i, "window"])) });
  const order: number[] = []; for (let k = 0; k < half; k++) { order.push(k); if (k < second.length) order.push(second[k]); }
  frames.push({ note: `Step 3: weave the halves → ${order.map((i) => vals[i]).join(" → ")}. Three small patterns, O(n) time, O(1) space.`, next: chain(order), ptrs: [{ i: 0, label: "head" }], tones: Object.fromEntries(order.map((i) => [i, "done"])) });
  return { kind: "list", title: "Reorder list = middle + reverse + merge", values: vals, frames };
}

export function removeDups(vals = [1, 1, 2, 3, 3, 3, 4]): Diagram {
  const next = vals.map((_, i) => (i + 1 < vals.length ? i + 1 : -1)), frames: ListFrame[] = []; let c = 0;
  while (c !== -1 && next[c] !== -1) { if (vals[next[c]] === vals[c]) { const gone = next[c]; next[c] = next[gone]; next[gone] = -1; frames.push({ note: `next has the same value ${vals[c]} → splice it out: curr.next = curr.next.next`, next: [...next], ptrs: [{ i: c, label: "curr" }], tones: { [gone]: "muted" } }); } else { c = next[c]; frames.push({ note: `Different value → advance curr to ${vals[c]}`, next: [...next], ptrs: [{ i: c, label: "curr" }] }); } }
  return { kind: "list", title: "Traverse and modify: remove duplicates from a sorted list", values: vals, frames };
}

export function callStack(n = 4): Diagram {
  const frames: StackFrame[] = [], st: string[] = [];
  for (let k = n; k >= 1; k--) { st.push(`fact(${k})`); frames.push({ note: k === 1 ? "fact(1) = 1: base case, start returning" : `fact(${k}) needs fact(${k - 1}) → push a new frame`, items: [...st] }); }
  let v = 1; for (let k = 1; k <= n; k++) { v *= k; st.pop(); frames.push({ note: `fact(${k}) returns ${v}${k < n ? ` to fact(${k + 1})` : ""}. Depth ${n} frames → O(n) stack space`, items: [...st], popped: [`fact(${k}) = ${v}`] }); }
  return { kind: "stack", title: "Linear recursion: one call per level on the call stack", frames };
}

export function reverseString(s = "hello"): Diagram {
  const a = s.split(""), frames: CellsFrame[] = []; let l = 0, r = a.length - 1;
  while (l < r) { [a[l], a[r]] = [a[r], a[l]]; frames.push({ note: `swap s[${l}] and s[${r}], recurse on (${l + 1}, ${r - 1})`, rows: [[...a]], tones: { [`0:${l}`]: "found", [`0:${r}`]: "found", ...range(l + 1, r - 1) }, marks: [{ i: l, label: "l" }, { i: r, label: "r" }] }); l++; r--; }
  frames.push({ note: "l ≥ r: base case. n/2 calls.", rows: [[...a]], tones: range(0, a.length - 1, 0, "done") });
  return { kind: "cells", title: "Recursion on two bounds: reverse(s, l, r)", rows: [s.split("")], frames };
}

export function mergeSort(arr = [5, 2, 4, 6, 1, 3, 2, 6]): Diagram {
  const a = [...arr], frames: CellsFrame[] = [];
  const go = (lo: number, hi: number) => { if (hi - lo < 1) return; const m = (lo + hi) >> 1; go(lo, m); go(m + 1, hi); const merged = [...a.slice(lo, m + 1), ...a.slice(m + 1, hi + 1)].sort((x, y) => x - y); merged.forEach((v, k) => (a[lo + k] = v)); frames.push({ note: `Merge sorted halves [${lo}..${m}] and [${m + 1}..${hi}] → [${merged.join(", ")}]`, rows: [[...a]], tones: range(lo, hi, 0, hi - lo + 1 === a.length ? "found" : "window") }); };
  go(0, a.length - 1);
  return { kind: "cells", title: "Divide and conquer: merge sort, O(n log n) every case", rows: [arr], frames };
}

export function validPalindrome(s = "A man, a plan"): Diagram {
  const a = s.split(""), frames: CellsFrame[] = [], ok = (c: string) => /[a-z0-9]/i.test(c); let l = 0, r = a.length - 1;
  while (l < r) { if (!ok(a[l])) { frames.push({ note: `'${a[l]}' is not a letter/digit → skip`, tones: { [`0:${l}`]: "muted" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); l++; continue; } if (!ok(a[r])) { frames.push({ note: `'${a[r]}' is not a letter/digit → skip`, tones: { [`0:${r}`]: "muted" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); r--; continue; } const same = a[l].toLowerCase() === a[r].toLowerCase(); frames.push({ note: `'${a[l]}' vs '${a[r]}' → ${same ? "match, move both in" : "mismatch → not a palindrome"}`, tones: { [`0:${l}`]: same ? "found" : "bad", [`0:${r}`]: same ? "found" : "bad" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); if (!same) break; l++; r--; }
  return { kind: "cells", title: "Two pointers on a string: valid palindrome", rows: [a], frames };
}

export function atoi(s = "   -42abc"): Diagram {
  const a = s.split("").map((c) => (c === " " ? "␣" : c)), frames: CellsFrame[] = []; let i = 0, sign = 1, n = 0;
  while (s[i] === " ") { frames.push({ note: "skip leading space", tones: { [`0:${i}`]: "muted" } }); i++; }
  if (s[i] === "-" || s[i] === "+") { sign = s[i] === "-" ? -1 : 1; frames.push({ note: `sign '${s[i]}'`, tones: { [`0:${i}`]: "active" } }); i++; }
  while (i < s.length && /\d/.test(s[i])) { n = n * 10 + +s[i]; frames.push({ note: `digit ${s[i]} → n = n*10 + ${s[i]} = ${n} (clamp to 32-bit before overflow)`, tones: { [`0:${i}`]: "found" } }); i++; }
  frames.push({ note: `first non-digit ${i < s.length ? `'${s[i]}'` : "(end)"} → stop. Result ${sign * n}`, tones: { ...(i < s.length ? { [`0:${i}`]: "bad" } : {}) } });
  return { kind: "cells", title: "Parsing: string to integer as a small state machine", rows: [a], frames };
}

export function trieWildcard(words = ["bad", "dad", "mad"], q = ".ad"): Diagram {
  const base = trieBuild(words); if (base.kind !== "tree") return base;
  const nodes = base.nodes, kids = (id: number) => nodes.filter((n) => n.parent === id), frames: TreeFrame[] = [], seen: Record<number, Tone> = {};
  const go = (id: number, k: number): boolean => { seen[id] = "active"; if (k === q.length) { seen[id] = "found"; frames.push({ note: "Reached the end of the pattern at a word end → match", tones: { ...seen } }); return true; } const c = q[k], next = kids(id).filter((n) => c === "." || n.label === c); frames.push({ note: c === "." ? `'.' matches any child → try all ${next.length} branches (DFS)` : `'${c}' → follow that one child${next.length ? "" : " (missing → dead end)"}`, tones: { ...seen } }); for (const n of next) if (go(n.id, k + 1)) return true; seen[id] = "bad"; return false; };
  go(0, 0);
  return { kind: "tree", title: `Wildcard search "${q}" in a trie`, nodes, frames };
}

export function wordSearchGrid(): Diagram {
  const g = [["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], path = [[0, 0], [1, 0], [1, 1], [1, 2]] as const, word = "oath", frames: TableFrame[] = [];
  const cells = () => g.map((r) => [...r]);
  path.forEach(([r, c], k) => frames.push({ note: `'${g[r][c]}' is a child of the current trie node → step in (prefix "${word.slice(0, k + 1)}")${k === path.length - 1 ? " → word end: found \"oath\"" : ""}. A prefix missing from the trie prunes the DFS instantly.`, cells: cells(), active: [r, c], deps: path.slice(0, k).map(([y, x]) => [y, x] as [number, number]) }));
  return { kind: "table", title: "Word Search II: walk the grid and the trie together", rowHead: ["0", "1", "2", "3"], colHead: ["0", "1", "2", "3"], frames };
}

export function xorTrie(nums = [3, 10, 5, 25, 2, 8], x = 5, w = 5): Diagram {
  const nodes: TNode[] = [{ id: 0, label: "•", parent: null }], kid: Record<string, number> = {};
  for (const v of nums) { let p = 0, pre = ""; for (const b of bin(v, w)) { pre += b; if (!(pre in kid)) { kid[pre] = nodes.length; nodes.push({ id: nodes.length, label: b, parent: p, side: b === "0" ? "L" : "R" }); } p = kid[pre]; } }
  const frames: TreeFrame[] = [], path: number[] = [0]; let pre = "", val = 0; const xb = bin(x, w);
  xb.forEach((b, k) => { const want = b === "0" ? "1" : "0", has = kid[pre + want] != null; pre += has ? want : b; path.push(kid[pre]); val = val * 2 + (has ? 1 : 0); frames.push({ note: `bit ${w - 1 - k} of ${x} is ${b}: ${has ? `take the opposite branch ${want} → XOR bit 1` : `no ${want} branch → forced ${b}, XOR bit 0`}. XOR so far ${val.toString(2)}`, tones: Object.fromEntries(path.map((i, j) => [i, j === path.length - 1 ? "active" : "found"])) }); });
  frames[frames.length - 1].note += ` → max XOR with ${x} = ${val}`;
  return { kind: "tree", title: `Bitwise trie (${w} bits): best XOR partner for ${x}`, nodes, frames };
}

export function spiral(R = 4, C = 4): Diagram {
  const cells: (string | number | null)[][] = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => r * C + c + 1));
  const frames: TableFrame[] = [], order: [number, number][] = []; let top = 0, bot = R - 1, left = 0, right = C - 1;
  const push = (r: number, c: number, side: string) => { order.push([r, c]); frames.push({ note: `${side}: take ${cells[r][c]}. Boundaries top ${top}, bottom ${bot}, left ${left}, right ${right}`, cells, active: [r, c], deps: order.slice(0, -1) }); };
  while (top <= bot && left <= right) {
    for (let c = left; c <= right; c++) push(top, c, "Top row →"); top++;
    for (let r = top; r <= bot; r++) push(r, right, "Right column ↓"); right--;
    if (top <= bot) { for (let c = right; c >= left; c--) push(bot, c, "Bottom row ←"); bot--; }
    if (left <= right) { for (let r = bot; r >= top; r--) push(r, left, "Left column ↑"); left++; }
  }
  return { kind: "table", title: "Spiral order: four boundaries that shrink after each side", rowHead: Array.from({ length: R }, (_, i) => String(i)), colHead: Array.from({ length: C }, (_, i) => String(i)), frames };
}
