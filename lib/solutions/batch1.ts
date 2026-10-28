// Hand-written solutions for the slugs listed under "batch1" in batches.json. See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, IntervalsFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { levelTree, range, type TNode } from "../sim.ts";
import type { Solution } from "./types";

type V = (number | null)[];
const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const blank = (n: number) => Array<string | number>(n).fill("");
const table = (title: string, rowHead: string[], colHead: string[], frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead, colHead, frames });
const nums = (n: number) => Array.from({ length: n }, (_, i) => String(i));
/** Tones for list or graph nodes a..b. */
const span = (a: number, b: number, tone: Tone) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, k) => [a + k, tone])) as Record<number, Tone>;
const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
/** Tree helpers over level-order arrays: node id = level-order index. */
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

export const BATCH1: Record<string, Solution> = {
  "3sum-with-multiplicity": {
    approach: "Count each value, then loop over value triples x ≤ y ≤ z with x + y + z = target and multiply counts (using combinations when values repeat).",
    idea: ["Only the distinct values matter, and there are at most 101 of them.", "Pick x ≤ y, then z = target - x - y must be ≥ y and present.", "Ways: all three equal → C(c, 3); two equal → C(c, 2) times the other count; all different → product of counts."],
    code: `from collections import Counter
def threeSumMulti(arr, target):
    c = Counter(arr)
    keys = sorted(c)
    ans = 0
    for i, x in enumerate(keys):
        for y in keys[i:]:
            z = target - x - y
            if z < y or z not in c:
                continue
            if x == y == z:
                ans += c[x] * (c[x] - 1) * (c[x] - 2) // 6
            elif x == y:
                ans += c[x] * (c[x] - 1) // 2 * c[z]
            elif y == z:
                ans += c[x] * c[y] * (c[y] - 1) // 2
            else:
                ans += c[x] * c[y] * c[z]
    return ans % (10**9 + 7)`,
    lang: "python", time: "O(n + m²) for m distinct values", space: "O(m)",
    viz: () => {
      const arr = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], target = 8, keys = [...new Set(arr)].sort((a, b) => a - b), cnt = keys.map((v) => arr.filter((x) => x === v).length), at = (v: number) => keys.indexOf(v);
      const frames: CellsFrame[] = [{ note: `Count each value: ${keys.map((k, i) => `${k}×${cnt[i]}`).join(", ")}` }]; let ans = 0;
      keys.forEach((x, i) => keys.slice(i).forEach((y) => {
        const z = target - x - y; if (z < y || !keys.includes(z)) return;
        const [cx, cy, cz] = [cnt[at(x)], cnt[at(y)], cnt[at(z)]];
        const [ways, how] = x === y && y === z ? [(cx * (cx - 1) * (cx - 2)) / 6, `C(${cx}, 3)`] : x === y ? [((cx * (cx - 1)) / 2) * cz, `C(${cx}, 2) × ${cz}`] : y === z ? [(cx * cy * (cy - 1)) / 2, `${cx} × C(${cy}, 2)`] : [cx * cy * cz, `${cx} × ${cy} × ${cz}`];
        ans += ways as number;
        frames.push({ note: `${x} + ${y} + ${z} = ${target}: ${how} = ${ways} ways (total ${ans})`, tones: { [`0:${at(x)}`]: "active", [`0:${at(y)}`]: "active", [`0:${at(z)}`]: "active", [`1:${at(x)}`]: "window", [`1:${at(y)}`]: "window", [`1:${at(z)}`]: "window" } });
      }));
      return cells(`threeSumMulti([1,1,2,2,3,3,4,4,5,5], 8) = ${ans}`, [keys, cnt], frames, ["value", "count"]);
    },
  },

  "minimum-domino-rotations-for-equal-row": {
    approach: "The shared value must be tops[0] or bottoms[0]; for each candidate count the rotations needed to fill the top row and the bottom row.",
    idea: ["If a row ends up all v, then domino 0 has v on one side, so only two candidates exist.", "For a candidate, a domino with v on neither side makes it impossible.", "Otherwise count dominoes whose top is not v (rotations for the top row) and whose bottom is not v; take the smaller."],
    code: `def minDominoRotations(tops, bottoms):
    best = float("inf")
    for v in (tops[0], bottoms[0]):
        rot_top = rot_bottom = 0
        for t, b in zip(tops, bottoms):
            if t != v and b != v:
                break
            if t != v: rot_top += 1
            if b != v: rot_bottom += 1
        else:
            best = min(best, rot_top, rot_bottom)
    return -1 if best == float("inf") else best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const tops = [2, 1, 2, 4, 2, 2], bots = [5, 2, 6, 2, 3, 2], frames: CellsFrame[] = []; let best = Infinity;
      for (const v of [tops[0], bots[0]]) {
        let rt = 0, rb = 0, ok = true; const tones: Record<string, Tone> = {};
        for (let i = 0; i < tops.length; i++) {
          if (tops[i] !== v && bots[i] !== v) { ok = false; tones[`0:${i}`] = "bad"; tones[`1:${i}`] = "bad"; frames.push({ note: `Try ${v}: domino ${i} is ${tops[i]}/${bots[i]}, no ${v} on either side → ${v} is impossible`, tones: { ...tones } }); break; }
          if (tops[i] !== v) rt++; if (bots[i] !== v) rb++;
          tones[`0:${i}`] = tops[i] === v ? "found" : "muted"; tones[`1:${i}`] = bots[i] === v ? "found" : "muted";
          frames.push({ note: `Try ${v}: domino ${i} is ${tops[i]}/${bots[i]} → rotations for top row ${rt}, for bottom row ${rb}`, tones: { ...tones }, marks: [{ i, label: "i" }] });
        }
        if (ok) { best = Math.min(best, rt, rb); frames.push({ note: `${v} works: min(${rt}, ${rb}) = ${Math.min(rt, rb)} rotations`, tones: { ...tones } }); }
      }
      return cells(`Fewest rotations: ${Number.isFinite(best) ? best : -1}`, [tops, bots], frames, ["tops", "bottoms"]);
    },
  },

  "sort-the-students-by-their-kth-score": {
    approach: "Sort the rows by column k in descending order; the scores are distinct, so no tie-breaking is needed.",
    idea: ["Each row is one student; only the kth exam decides the order.", "A stable sort on the key -row[k] gives highest first."],
    code: `def sortTheStudents(score, k):
    return sorted(score, key=lambda row: -row[k])`,
    lang: "python", time: "O(m log m)", space: "O(m)",
    viz: () => {
      const score = [[10, 6, 9, 1], [7, 5, 11, 2], [4, 8, 3, 15]], k = 2, out = [...score].sort((a, b) => b[k] - a[k]);
      const col = (rows: number[][]): Record<string, Tone> => Object.fromEntries(rows.map((_, r) => [`${r}:${k}`, "window"]));
      const frames: TableFrame[] = [{ note: `Exam ${k} scores: ${score.map((r) => r[k]).join(", ")}`, cells: score, tones: col(score) }];
      out.forEach((row, r) => frames.push({ note: `Place ${r + 1}: the student with ${row[k]} (${r === 0 ? "highest" : `next highest`} in exam ${k})`, cells: [...out.slice(0, r + 1), ...Array.from({ length: out.length - r - 1 }, () => [null, null, null, null])], active: [r, k], tones: { ...Object.fromEntries(out.slice(0, r + 1).map((_, i) => [`${i}:${k}`, "found"])) } as Record<string, Tone> }));
      return table("Sort students by exam 2", ["1st", "2nd", "3rd"], ["exam 0", "exam 1", "exam 2", "exam 3"], frames);
    },
  },

  "minimum-absolute-sum-difference": {
    approach: "Total the differences, then for each position binary-search a sorted copy of nums1 for the value closest to nums2[i]; keep the largest saving.",
    idea: ["Only one element of nums1 may be replaced, with any other element of nums1.", "At position i the best replacement is the nums1 value closest to nums2[i]; it saves |a - b| minus that closest distance.", "Answer = total - biggest saving."],
    code: `from bisect import bisect_left
def minAbsoluteSumDiff(nums1, nums2):
    s = sorted(nums1)
    total = gain = 0
    for a, b in zip(nums1, nums2):
        d = abs(a - b)
        total += d
        j = bisect_left(s, b)
        best = d
        if j < len(s): best = min(best, s[j] - b)
        if j > 0: best = min(best, b - s[j - 1])
        gain = max(gain, d - best)
    return (total - gain) % (10**9 + 7)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [1, 10, 4, 4, 2, 7], b = [9, 3, 5, 1, 7, 4], s = [...a].sort((x, y) => x - y), diff = blank(a.length), close = blank(a.length), frames: CellsFrame[] = []; let total = 0, gain = 0, at = 0;
      a.forEach((x, i) => {
        const d = Math.abs(x - b[i]); total += d; diff[i] = d;
        const c = s.reduce((p, v) => (Math.abs(v - b[i]) < Math.abs(p - b[i]) ? v : p), s[0]); close[i] = c; const save = d - Math.abs(c - b[i]);
        if (save > gain) { gain = save; at = i; }
        frames.push({ note: `i=${i}: |${x} - ${b[i]}| = ${d}; closest nums1 value to ${b[i]} is ${c} (distance ${Math.abs(c - b[i])}) → saves ${save}. Best saving ${gain}`, rows: [a, b, [...diff], [...close]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "active", [`3:${i}`]: save === gain && save > 0 ? "found" : "window" } });
      });
      frames.push({ note: `Total ${total} - best saving ${gain} (replace nums1[${at}]) = ${total - gain}`, rows: [a, b, diff, close], tones: { [`0:${at}`]: "found", [`3:${at}`]: "found" } });
      return cells(`Minimum absolute sum difference: ${total - gain}`, [a, b, blank(a.length), blank(a.length)], frames, ["nums1", "nums2", "|diff|", "closest"]);
    },
  },

  "find-k-pairs-with-smallest-sums": {
    approach: "Seed a min-heap with (nums1[i], nums2[0]) for each i; pop the smallest and push its neighbour (i, j + 1), k times.",
    idea: ["Picture a grid where cell (i, j) holds nums1[i] + nums2[j]; rows and columns are sorted.", "The next smallest pair is always the right-hand neighbour of one already taken, or a first-column cell.", "So a heap holding one frontier cell per row finds the k smallest without building the grid."],
    code: `import heapq
def kSmallestPairs(nums1, nums2, k):
    h = [(nums1[i] + nums2[0], i, 0) for i in range(min(k, len(nums1)))]
    heapq.heapify(h)
    out = []
    while h and len(out) < k:
        _, i, j = heapq.heappop(h)
        out.append([nums1[i], nums2[j]])
        if j + 1 < len(nums2):
            heapq.heappush(h, (nums1[i] + nums2[j + 1], i, j + 1))
    return out`,
    lang: "python", time: "O(k log k)", space: "O(k)",
    viz: () => {
      const n1 = [1, 7, 11], n2 = [2, 4, 6], k = 4, grid = n1.map((x) => n2.map((y) => x + y)), heap: [number, number, number][] = n1.slice(0, k).map((x, i) => [x + n2[0], i, 0]), taken: string[] = [], out: number[][] = [];
      const view = (): Record<string, Tone> => ({ ...Object.fromEntries(heap.map(([, i, j]) => [`${i}:${j}`, "window"])), ...Object.fromEntries(taken.map((t) => [t, "found"])) });
      const frames: TableFrame[] = [{ note: `Heap starts with the first column: ${heap.map(([s]) => s).join(", ")}`, cells: grid, tones: view() }];
      while (heap.length && out.length < k) {
        heap.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const [s, i, j] = heap.shift()!; out.push([n1[i], n2[j]]); taken.push(`${i}:${j}`);
        if (j + 1 < n2.length) heap.push([n1[i] + n2[j + 1], i, j + 1]);
        frames.push({ note: `Pop ${s} = ${n1[i]} + ${n2[j]} → pair ${out.length}${j + 1 < n2.length ? `; push its right neighbour ${n1[i] + n2[j + 1]}` : ""}`, cells: grid, active: [i, j], tones: view() });
      }
      return table(`${k} smallest pairs: ${out.map((p) => `[${p.join(", ")}]`).join(", ")}`, n1.map((x) => `nums1 ${x}`), n2.map((y) => `nums2 ${y}`), frames);
    },
  },

  "stone-game-vi": {
    approach: "Taking a stone gains your value and denies the opponent theirs, so both players grab stones in order of aliceValue + bobValue.",
    idea: ["Picking stone i swings the score by a[i] + b[i] compared with the opponent picking it.", "So both play greedily on a[i] + b[i], largest first; Alice takes turns 0, 2, 4, ...", "Compare the totals."],
    code: `def stoneGameVI(aliceValues, bobValues):
    order = sorted(zip(aliceValues, bobValues), key=lambda p: -(p[0] + p[1]))
    diff = 0
    for turn, (a, b) in enumerate(order):
        diff += a if turn % 2 == 0 else -b
    return (diff > 0) - (diff < 0)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const A = [2, 4, 3], B = [1, 6, 7], ord = A.map((a, i) => [a, B[i]]).sort((x, y) => y[0] + y[1] - (x[0] + x[1])), rows = [ord.map((p) => p[0]), ord.map((p) => p[1]), ord.map((p) => p[0] + p[1])];
      const frames: CellsFrame[] = [{ note: "Sort stones by Alice's value + Bob's value, largest first", rows, tones: range(0, ord.length - 1, 2) }]; let alice = 0, bob = 0;
      ord.forEach(([a, b], t) => { if (t % 2 === 0) alice += a; else bob += b; frames.push({ note: `Turn ${t}: ${t % 2 === 0 ? `Alice takes it (+${a})` : `Bob takes it (+${b})`}. Alice ${alice}, Bob ${bob}`, rows, tones: { [`${t % 2}:${t}`]: "found", [`2:${t}`]: "active" } }); });
      const res = Math.sign(alice - bob);
      return cells(`Alice ${alice} vs Bob ${bob} → ${res}`, rows, frames, ["alice", "bob", "sum"]);
    },
  },

  "minimum-increment-to-make-array-unique": {
    approach: "Sort, then give each number the larger of its own value and one more than the previous assigned value; add up the raises.",
    idea: ["After sorting, each value only needs to clear the value given to the one before it.", "Track need = smallest value still free. Each x becomes max(x, need), costing that minus x.", "Then need moves one past it."],
    code: `def minIncrementForUnique(nums):
    nums.sort()
    moves = need = 0
    for x in nums:
        need = max(need, x)
        moves += need - x
        need += 1
    return moves`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const a = [3, 2, 1, 2, 1, 7].sort((x, y) => x - y), got = blank(a.length), frames: CellsFrame[] = []; let need = 0, moves = 0;
      a.forEach((x, i) => { need = Math.max(need, x); moves += need - x; got[i] = need; frames.push({ note: `${x} → ${need} (cost ${need - x}, total ${moves}); next free value is ${need + 1}`, rows: [a, [...got]], tones: { [`0:${i}`]: "active", [`1:${i}`]: need > x ? "window" : "found" } }); need++; });
      return cells(`Moves to make [3, 2, 1, 2, 1, 7] unique: ${moves}`, [a, blank(a.length)], frames, ["sorted", "becomes"]);
    },
  },

  "reverse-odd-levels-of-binary-tree": {
    approach: "Walk the perfect tree level by level; on every odd level, reverse the list of values and write them back.",
    idea: ["The tree is perfect, so each level is a full list of nodes from left to right.", "Reversing a level only means reversing its values; the links stay.", "Go down one level at a time and flip the odd ones."],
    code: `def reverseOddLevels(root):
    level, depth = [root], 0
    while level[0].left:
        level = [c for n in level for c in (n.left, n.right)]
        depth += 1
        if depth % 2:
            vals = [n.val for n in level]
            for n, v in zip(level, reversed(vals)):
                n.val = v
    return root`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals: V = Array.from({ length: 15 }, (_, i) => i + 1), { nodes } = T(vals), labels: Record<number, string> = Object.fromEntries(vals.map((v, i) => [i, String(v)]));
      const frames: TreeFrame[] = [{ note: "Level 0 is even: leave it", tones: { 0: "done" }, labels: { ...labels } }];
      for (let d = 1, start = 1; d < 4; d++, start = 2 * start + 1) {
        const ids = Array.from({ length: 2 ** d }, (_, k) => start + k), tones = Object.fromEntries(ids.map((i) => [i, "active"])) as Record<number, Tone>;
        if (d % 2) { const before = ids.map((i) => labels[i]), after = [...before].reverse(); ids.forEach((i, k) => (labels[i] = after[k])); frames.push({ note: `Level ${d} is odd: [${before.join(", ")}] → [${after.join(", ")}]`, tones, labels: { ...labels } }); }
        else frames.push({ note: `Level ${d} is even: leave it`, tones, labels: { ...labels } });
      }
      return tree("Reverse odd levels of a perfect tree", nodes, trail(frames));
    },
  },

  "jump-game-iii": {
    approach: "Explore indices reachable from start (each i jumps to i + arr[i] or i - arr[i]) with DFS, marking visited; stop at any zero.",
    idea: ["The jumps form a graph on indices; the question is whether a zero is reachable.", "Visit each index at most once, so the search is linear."],
    code: `def canReach(arr, start):
    seen, stack = set(), [start]
    while stack:
        i = stack.pop()
        if arr[i] == 0:
            return True
        seen.add(i)
        for j in (i + arr[i], i - arr[i]):
            if 0 <= j < len(arr) and j not in seen:
                stack.append(j)
    return False`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const arr = [4, 2, 3, 0, 3, 1, 2], seen = new Set<number>(), stack = [5], frames: CellsFrame[] = []; let ok = false;
      while (stack.length) {
        const i = stack.pop()!; const done = Object.fromEntries([...seen].map((s) => [`0:${s}`, "done"])) as Record<string, Tone>;
        if (arr[i] === 0) { ok = true; frames.push({ note: `Reached index ${i} with value 0 → true`, tones: { ...done, [`0:${i}`]: "found" }, marks: [{ i, label: "i" }] }); break; }
        seen.add(i); const nx = [i + arr[i], i - arr[i]].filter((j) => j >= 0 && j < arr.length && !seen.has(j)); stack.push(...nx);
        frames.push({ note: `At ${i} (value ${arr[i]}): jumps to ${i + arr[i]} and ${i - arr[i]}; new ones pushed: [${nx.join(", ")}]`, tones: { ...done, [`0:${i}`]: "active", ...Object.fromEntries(nx.map((j) => [`0:${j}`, "window"])) }, marks: [{ i, label: "i" }] });
      }
      return cells(`canReach(start = 5): ${ok}`, [arr], frames);
    },
  },

  "maximum-split-of-positive-even-integers": {
    approach: "Take 2, 4, 6, ... while the next one still fits, then add whatever is left over to the last number.",
    idea: ["An odd sum cannot be split into even numbers.", "To use as many numbers as possible, use the smallest distinct evens.", "When the next even no longer fits, the leftover is smaller than it, so adding it to the last number keeps everything distinct."],
    code: `def maximumEvenSplit(finalSum):
    if finalSum % 2:
        return []
    out, x = [], 2
    while finalSum >= x:
        out.append(x)
        finalSum -= x
        x += 2
    out[-1] += finalSum
    return out`,
    lang: "python", time: "O(√n)", space: "O(√n)",
    viz: () => {
      let left = 28, x = 2; const out: number[] = [], frames: StackFrame[] = [];
      while (left >= x) { out.push(x); left -= x; frames.push({ note: `Take ${x}; ${left} left`, items: [...out], incoming: x }); x += 2; }
      frames.push({ note: `${x} > ${left} left, so stop and add ${left} to the last number`, items: [...out], side: `left ${left}` });
      out[out.length - 1] += left; frames.push({ note: `Split: [${out.join(", ")}] (${out.length} numbers)`, items: [...out] });
      return { kind: "stack", title: `28 → [${out.join(", ")}]`, frames };
    },
  },

  "range-sum-query-mutable": {
    approach: "A Fenwick (binary indexed) tree: an update walks up by adding the lowest set bit, a prefix sum walks down by removing it.",
    idea: ["tree[i] stores the sum of the last (i & -i) elements ending at position i.", "update adds the change to every tree slot that covers the index: i += i & -i.", "prefix(i) adds slots while stripping the lowest bit: i -= i & -i. A range is prefix(r + 1) - prefix(l)."],
    code: `class NumArray:
    def __init__(self, nums):
        self.n = len(nums)
        self.a = nums[:]
        self.t = [0] * (self.n + 1)
        for i, v in enumerate(nums):
            self._add(i + 1, v)

    def _add(self, i, d):
        while i <= self.n:
            self.t[i] += d
            i += i & -i

    def _prefix(self, i):
        s = 0
        while i:
            s += self.t[i]
            i -= i & -i
        return s

    def update(self, index, val):
        self._add(index + 1, val - self.a[index])
        self.a[index] = val

    def sumRange(self, left, right):
        return self._prefix(right + 1) - self._prefix(left)`,
    lang: "python", time: "O(log n) per call", space: "O(n)",
    viz: () => {
      const a = [1, 3, 5, 2, 4, 6, 8, 7], n = a.length, t = Array(n + 1).fill(0);
      const add = (i: number, d: number) => { const hit: number[] = []; for (; i <= n; i += i & -i) { t[i] += d; hit.push(i); } return hit; };
      a.forEach((v, i) => add(i + 1, v));
      const rows = () => [a.slice(), t.slice(1)], frames: CellsFrame[] = [{ note: `Built: tree[i] covers the last (i & -i) values ending at position i. tree = [${t.slice(1).join(", ")}]`, rows: rows() }];
      const hit = add(3, 10 - a[2]); a[2] = 10;
      frames.push({ note: `update(2, 10): add +5 at positions ${hit.join(" → ")} (i += i & -i)`, rows: rows(), tones: { "0:2": "active", ...Object.fromEntries(hit.map((h) => [`1:${h - 1}`, "found"])) } });
      const pre = (i: number) => { const used: number[] = []; let s = 0; for (; i; i -= i & -i) { s += t[i]; used.push(i); } return { s, used }; };
      const r = pre(7), l = pre(2);
      frames.push({ note: `prefix(7) = ${r.used.map((u) => `tree[${u}]`).join(" + ")} = ${r.s}`, rows: rows(), tones: { ...range(0, 6, 0), ...Object.fromEntries(r.used.map((u) => [`1:${u - 1}`, "active"])) } });
      frames.push({ note: `prefix(2) = ${l.used.map((u) => `tree[${u}]`).join(" + ")} = ${l.s}; sumRange(2, 6) = ${r.s} - ${l.s} = ${r.s - l.s}`, rows: rows(), tones: { ...range(2, 6, 0, "found"), ...Object.fromEntries(l.used.map((u) => [`1:${u - 1}`, "bad"])) } });
      return cells("Fenwick tree: update and range sum", [a, t.slice(1)], frames, ["nums", "tree[1..8]"]);
    },
  },

  "find-right-interval": {
    approach: "Sort the start points with their indices; for each interval binary-search the first start ≥ its end.",
    idea: ["The right interval of [s, e] is the one with the smallest start that is ≥ e.", "Sorting starts once lets every query be a binary search."],
    code: `from bisect import bisect_left
def findRightInterval(intervals):
    starts = sorted((s, i) for i, (s, _) in enumerate(intervals))
    out = []
    for _, e in intervals:
        j = bisect_left(starts, (e,))
        out.append(starts[j][1] if j < len(starts) else -1)
    return out`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const items: [number, number][] = [[3, 4], [2, 3], [1, 2], [4, 6]], starts = items.map(([s], i) => [s, i]).sort((a, b) => a[0] - b[0]), out: number[] = [];
      const frames: IntervalsFrame[] = [{ note: `Sorted starts: ${starts.map(([s, i]) => `${s} (#${i})`).join(", ")}` }];
      items.forEach(([, e], i) => { const hit = starts.find(([s]) => s >= e); out.push(hit ? hit[1] : -1); frames.push({ note: `#${i} ends at ${e}: first start ≥ ${e} is ${hit ? `${hit[0]} (#${hit[1]})` : "none"} → ${out[i]}`, line: e, tones: { [i]: "active", ...(hit ? { [hit[1]]: "found" } : {}) } }); });
      return { kind: "intervals", title: `Right intervals: [${out.join(", ")}]`, items, frames };
    },
  },

  "minimum-limit-of-balls-in-a-bag": {
    approach: "Binary search the answer: a bag of x balls needs (x - 1) // limit splits to get every part ≤ limit; find the smallest limit within maxOperations.",
    idea: ["If a limit works, any bigger limit also works, so the answer can be binary searched.", "Splitting x into parts of at most m takes ceil(x / m) - 1 = (x - 1) // m operations.", "Sum that over the bags and compare with maxOperations."],
    code: `def minimumSize(nums, maxOperations):
    lo, hi = 1, max(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((x - 1) // mid for x in nums) <= maxOperations:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log max)", space: "O(1)",
    viz: () => {
      const a = [2, 4, 8, 2], ops = 4, frames: CellsFrame[] = []; let lo = 1, hi = Math.max(...a);
      while (lo < hi) { const mid = (lo + hi) >> 1, need = a.map((x) => Math.floor((x - 1) / mid)), tot = need.reduce((s, x) => s + x, 0), ok = tot <= ops; frames.push({ note: `limit ${mid}: splits needed ${need.join(" + ")} = ${tot} ${ok ? `≤ ${ops} → works, try smaller` : `> ${ops} → too small`} (range ${ok ? `${lo}..${mid}` : `${mid + 1}..${hi}`})`, rows: [a, need], tones: Object.fromEntries(need.map((x, i) => [`1:${i}`, ok ? "found" : x ? "bad" : "muted"])) as Record<string, Tone> }); if (ok) hi = mid; else lo = mid + 1; }
      return cells(`Smallest penalty with 4 operations: ${lo}`, [a, blank(a.length)], frames, ["bag", "splits"]);
    },
  },

  "minimum-suffix-flips": {
    approach: "Scan left to right; every time the target bit differs from the current state, one suffix flip is needed.",
    idea: ["A flip at i changes everything from i to the end, so once bits left of i are right, they stay right.", "Starting from all zeros, the state only needs to change where target changes value.", "So the answer is the number of positions where the bit differs from the previous one (with a leading 0)."],
    code: `def minFlips(target):
    flips, cur = 0, "0"
    for c in target:
        if c != cur:
            flips += 1
            cur = c
    return flips`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const t = "10111".split(""), s = Array(t.length).fill("0"), frames: CellsFrame[] = [{ note: "Start from 00000", rows: [t, [...s]] }]; let cur = "0", flips = 0;
      t.forEach((c, i) => { if (c !== cur) { flips++; cur = c; for (let j = i; j < s.length; j++) s[j] = c; frames.push({ note: `Bit ${i} should be ${c} but is ${c === "1" ? "0" : "1"} → flip ${i}..end (flips ${flips})`, rows: [t, [...s]], tones: { ...range(i, s.length - 1, 1, "active"), [`0:${i}`]: "found" } }); } else frames.push({ note: `Bit ${i} already ${c}`, rows: [t, [...s]], tones: { [`1:${i}`]: "done" } }); });
      return cells(`minFlips("10111") = ${flips}`, [t, blank(t.length)], frames, ["target", "state"]);
    },
  },

  "find-kth-bit-in-nth-binary-string": {
    approach: "S(n) is S(n-1), then 1, then S(n-1) inverted and reversed; so the bit at k is the middle 1, or a bit of S(n-1) (mirrored and flipped if k is in the right half).",
    idea: ["S(n) has length 2^n - 1 and its middle position is 2^(n-1), which is always 1.", "Left of the middle, S(n) is exactly S(n-1).", "Right of the middle, position k mirrors position 2^n - k of S(n-1), inverted. Track the inversions while walking n down to 1 (S(1) = 0)."],
    code: `def findKthBit(n, k):
    flip = 0
    while n > 1:
        mid = 1 << (n - 1)
        if k == mid:
            return str(1 ^ flip)
        if k > mid:
            k = 2 * mid - k
            flip ^= 1
        n -= 1
    return str(flip)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const S = ["0"]; for (let i = 1; i < 4; i++) S.push(S[i - 1] + "1" + [...S[i - 1]].reverse().map((c) => (c === "0" ? "1" : "0")).join(""));
      const grid = S.map((s) => [...s].concat(Array(15 - s.length).fill(null))), frames: TableFrame[] = []; let n = 4, k = 11, flip = 0, ans = "";
      while (true) {
        const mid = 1 << (n - 1);
        if (n === 1) { ans = String(flip); frames.push({ note: `S1 = "0"; with ${flip} inversion${flip ? "" : "s"} the answer is ${ans}`, cells: grid, active: [0, 0] }); break; }
        if (k === mid) { ans = String(1 ^ flip); frames.push({ note: `k = ${k} is the middle of S${n}, a 1; inverted ${flip} times → ${ans}`, cells: grid, active: [n - 1, k - 1] }); break; }
        if (k > mid) { const nk = 2 * mid - k; frames.push({ note: `S${n}: k = ${k} is right of the middle ${mid} → mirror to ${nk} in S${n - 1} and invert`, cells: grid, active: [n - 1, k - 1], deps: [[n - 2, nk - 1]] }); k = nk; flip ^= 1; }
        else frames.push({ note: `S${n}: k = ${k} is left of the middle ${mid} → same bit as S${n - 1}[${k}]`, cells: grid, active: [n - 1, k - 1], deps: [[n - 2, k - 1]] });
        n--;
      }
      return table(`findKthBit(4, 11) = "${ans}"`, ["S1", "S2", "S3", "S4"], Array.from({ length: 15 }, (_, i) => String(i + 1)), frames);
    },
  },

  "maximum-subarray-sum-with-length-divisible-by-k": {
    approach: "A subarray (i, j] has length divisible by k when prefix indices i and j have the same remainder mod k; keep the smallest prefix sum for each remainder.",
    idea: ["sum(i..j] = P[j] - P[i], and its length j - i is divisible by k exactly when i % k == j % k.", "To maximise, subtract the smallest earlier prefix with the same remainder.", "Store one minimum per remainder; start with P[0] = 0 at remainder 0."],
    code: `def maxSubarraySum(nums, k):
    low = [float("inf")] * k
    low[0] = 0
    s, best = 0, float("-inf")
    for j, x in enumerate(nums, 1):
        s += x
        r = j % k
        best = max(best, s - low[r])
        low[r] = min(low[r], s)
    return best`,
    lang: "python", time: "O(n)", space: "O(k)",
    viz: () => {
      const a = [-5, 1, 2, -3, 4], k = 2, low: number[] = [0, Infinity], P = blank(a.length), frames: CellsFrame[] = [{ note: "Prefix 0 has remainder 0 and sum 0", rows: [a, blank(a.length), blank(a.length)] }]; let s = 0, best = -Infinity; const R = blank(a.length);
      a.forEach((x, i) => { const j = i + 1, r = j % k; s += x; P[i] = s; R[i] = r; const cand = s - low[r], had = Number.isFinite(low[r]); if (had && cand > best) best = cand; frames.push({ note: `prefix ${j} = ${s}, remainder ${r}: ${had ? `best earlier prefix ${low[r]} → subarray sum ${cand}` : "no earlier prefix with this remainder"}. Best ${Number.isFinite(best) ? best : "none yet"}`, rows: [a, [...P], [...R]], tones: { [`1:${i}`]: "active", ...Object.fromEntries(R.map((v, q) => [`2:${q}`, v === r && q <= i ? "window" : "muted"])) } }); low[r] = Math.min(low[r], s); });
      return cells(`Best sum with length divisible by 2: ${best}`, [a, blank(a.length), blank(a.length)], frames, ["nums", "prefix", "len % k"]);
    },
  },

  "count-servers-that-communicate": {
    approach: "Count servers per row and per column; a server communicates if its row or its column holds more than one.",
    idea: ["Two servers talk if they share a row or a column.", "So a server is counted when rowCount > 1 or colCount > 1.", "Two passes: one to count, one to test each server."],
    code: `def countServers(grid):
    rows = [sum(r) for r in grid]
    cols = [sum(c) for c in zip(*grid)]
    return sum(1 for i, r in enumerate(grid)
                 for j, v in enumerate(r)
                 if v and (rows[i] > 1 or cols[j] > 1))`,
    lang: "python", time: "O(mn)", space: "O(m + n)",
    viz: () => {
      const g = [[1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 0, 1]], rows = g.map((r) => r.reduce((a, b) => a + b, 0)), cols = g[0].map((_, j) => g.reduce((a, r) => a + r[j], 0));
      const frames: TableFrame[] = [{ note: `Row counts [${rows.join(", ")}], column counts [${cols.join(", ")}]`, cells: g }]; let n = 0; const tones: Record<string, Tone> = {};
      g.forEach((r, i) => r.forEach((v, j) => { if (!v) return; const ok = rows[i] > 1 || cols[j] > 1; if (ok) n++; tones[`${i}:${j}`] = ok ? "found" : "bad"; frames.push({ note: `Server (${i}, ${j}): row has ${rows[i]}, column has ${cols[j]} → ${ok ? `communicates (count ${n})` : "alone"}`, cells: g, active: [i, j], tones: { ...tones } }); }));
      return table(`Servers that communicate: ${n}`, rows.map((c, i) => `row ${i} (${c})`), cols.map((c, j) => `col ${j} (${c})`), frames);
    },
  },

  "sum-of-beauty-of-all-substrings": {
    approach: "Fix each start, extend the end one letter at a time with a running count of 26 letters, and add max count - min nonzero count.",
    idea: ["Beauty = most frequent count - least frequent count among letters present.", "Extending a substring by one letter only bumps one count, so keep the counts while j grows.", "That gives O(26 n²) instead of recounting every substring."],
    code: `def beautySum(s):
    total = 0
    for i in range(len(s)):
        cnt = [0] * 26
        for j in range(i, len(s)):
            cnt[ord(s[j]) - 97] += 1
            total += max(cnt) - min(c for c in cnt if c)
    return total`,
    lang: "python", time: "O(26 n²)", space: "O(26)",
    viz: () => {
      const s = "aabcb", frames: CellsFrame[] = []; let total = 0;
      for (let i = 0; i < s.length; i++) { const cnt: Record<string, number> = {}; for (let j = i; j < s.length; j++) { cnt[s[j]] = (cnt[s[j]] || 0) + 1; const v = Object.values(cnt), b = Math.max(...v) - Math.min(...v); total += b; frames.push({ note: `"${s.slice(i, j + 1)}": counts ${Object.entries(cnt).map(([c, x]) => `${c}${x}`).join(" ")} → beauty ${b} (total ${total})`, tones: range(i, j, 0, b ? "found" : "window") }); } }
      return cells(`beautySum("aabcb") = ${total}`, [s.split("")], frames);
    },
  },

  "k-radius-subarray-averages": {
    approach: "Slide a window of 2k + 1 elements, keeping its sum; write sum // (2k + 1) at the window's centre.",
    idea: ["Centres closer than k to either end have no full window, so they stay -1.", "Add the new element, drop the one that left, and the centre of the window is i - k."],
    code: `def getAverages(nums, k):
    w = 2 * k + 1
    out = [-1] * len(nums)
    s = 0
    for i, x in enumerate(nums):
        s += x
        if i >= w:
            s -= nums[i - w]
        if i >= w - 1:
            out[i - k] = s // w
    return out`,
    lang: "python", time: "O(n)", space: "O(1) extra",
    viz: () => {
      const a = [7, 4, 3, 9, 1, 8, 5, 2, 6], k = 3, w = 2 * k + 1, out: (string | number)[] = a.map(() => -1), frames: CellsFrame[] = []; let s = 0;
      a.forEach((x, i) => { s += x; if (i >= w) s -= a[i - w]; if (i >= w - 1) { out[i - k] = Math.floor(s / w); frames.push({ note: `Window [${i - w + 1}..${i}] sums to ${s} → avg ${s} // ${w} = ${out[i - k]} at centre ${i - k}`, rows: [a, [...out]], tones: { ...range(i - w + 1, i), [`1:${i - k}`]: "found", [`0:${i - k}`]: "active" } }); } });
      return cells(`k = 3 averages: [${out.join(", ")}]`, [a, a.map(() => -1)], frames, ["nums", "avg"]);
    },
  },

  "minimum-cost-to-convert-string-i": {
    approach: "Treat letters as 26 nodes with the given change costs as directed edges, run Floyd-Warshall, then add the cheapest cost for each position.",
    idea: ["A letter can change through a chain of rules, so the cost of x → y is a shortest path.", "With only 26 nodes, all-pairs Floyd-Warshall is cheap: try every middle letter k.", "Sum dist[source[i]][target[i]]; any unreachable pair means -1."],
    code: `def minimumCost(source, target, original, changed, cost):
    INF = float("inf")
    d = [[0 if i == j else INF for j in range(26)] for i in range(26)]
    for a, b, c in zip(original, changed, cost):
        u, v = ord(a) - 97, ord(b) - 97
        d[u][v] = min(d[u][v], c)
    for k in range(26):
        for i in range(26):
            for j in range(26):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    total = 0
    for s, t in zip(source, target):
        c = d[ord(s) - 97][ord(t) - 97]
        if c == INF:
            return -1
        total += c
    return total`,
    lang: "python", time: "O(26³ + n)", space: "O(26²)",
    viz: () => {
      const L = ["a", "b", "c", "d", "e"], rules: [string, string, number][] = [["a", "b", 2], ["b", "c", 5], ["c", "b", 5], ["c", "e", 1], ["e", "b", 2], ["d", "e", 20]];
      const d = L.map((_, i) => L.map((_, j) => (i === j ? 0 : Infinity))); rules.forEach(([a, b, c]) => { const u = L.indexOf(a), v = L.indexOf(b); d[u][v] = Math.min(d[u][v], c); });
      const show = () => d.map((r) => r.map((x) => (Number.isFinite(x) ? x : "∞"))), frames: TableFrame[] = [{ note: "Direct rules only (∞ = no rule yet)", cells: show() }];
      L.forEach((m, k) => { const imp: [number, number][] = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (d[i][k] + d[k][j] < d[i][j]) { d[i][j] = d[i][k] + d[k][j]; imp.push([i, j]); } frames.push({ note: imp.length ? `Through '${m}': ${imp.map(([i, j]) => `${L[i]}→${L[j]} = ${d[i][j]}`).join(", ")}` : `Through '${m}': nothing gets cheaper`, cells: show(), tones: Object.fromEntries(imp.map(([i, j]) => [`${i}:${j}`, "found"])) as Record<string, Tone> }); });
      const src = "abcd", tgt = "acbe"; let total = 0; const pick: Record<string, Tone> = {};
      [...src].forEach((c, i) => { const u = L.indexOf(c), v = L.indexOf(tgt[i]); total += d[u][v]; pick[`${u}:${v}`] = "found"; frames.push({ note: `Position ${i}: ${c} → ${tgt[i]} costs ${d[u][v]} (total ${total})`, cells: show(), active: [u, v], tones: { ...pick } }); });
      return table(`"abcd" → "acbe" costs ${total}`, L.map((c) => `from ${c}`), L.map((c) => `to ${c}`), frames);
    },
  },

  "maximum-number-of-integers-to-choose-from-a-range-i": {
    approach: "Greedy: take 1, 2, 3, ... skipping banned numbers, until the next one would push the sum past maxSum.",
    idea: ["To pick as many numbers as possible under a sum cap, pick the smallest allowed ones.", "Put banned in a set for O(1) checks."],
    code: `def maxCount(banned, n, maxSum):
    ban = set(banned)
    count = total = 0
    for x in range(1, n + 1):
        if x in ban:
            continue
        if total + x > maxSum:
            break
        total += x
        count += 1
    return count`,
    lang: "python", time: "O(n + b)", space: "O(b)",
    viz: () => {
      const n = 7, ban = new Set([2, 5]), maxSum = 12, xs = Array.from({ length: n }, (_, i) => i + 1), frames: CellsFrame[] = [], tones: Record<string, Tone> = {}; let total = 0, count = 0;
      for (const x of xs) { const i = x - 1; if (ban.has(x)) { tones[`0:${i}`] = "bad"; frames.push({ note: `${x} is banned, skip`, tones: { ...tones } }); continue; } if (total + x > maxSum) { frames.push({ note: `${total} + ${x} > ${maxSum} → stop with ${count} numbers`, tones: { ...tones, [`0:${i}`]: "muted" } }); break; } total += x; count++; tones[`0:${i}`] = "found"; frames.push({ note: `Take ${x}: sum ${total}, count ${count}`, tones: { ...tones } }); }
      return cells(`n = 7, banned {2, 5}, maxSum 12 → ${count}`, [xs], frames);
    },
  },

  "find-elements-in-a-contaminated-binary-tree": {
    approach: "Recover the tree once (root 0, left 2v + 1, right 2v + 2) into a set; each find is a set lookup.",
    idea: ["The values follow the same rule as heap indices, so each node's value is fixed by its position.", "Fill them in with one DFS from the root and store every value in a set.", "find(target) is then O(1)."],
    code: `class FindElements:
    def __init__(self, root):
        self.seen = set()
        stack = [(root, 0)]
        while stack:
            node, v = stack.pop()
            if not node:
                continue
            node.val = v
            self.seen.add(v)
            stack.append((node.left, 2 * v + 1))
            stack.append((node.right, 2 * v + 2))

    def find(self, target):
        return target in self.seen`,
    lang: "python", time: "O(n) build, O(1) find", space: "O(n)",
    viz: () => {
      const vals: V = [-1, -1, -1, null, -1, -1, null], { nodes, kids } = T(vals), labels: Record<number, string> = Object.fromEntries(nodes.map((n) => [n.id, "-1"])), frames: TreeFrame[] = [], seen: number[] = [];
      const go = (i: number | null, v: number) => { if (i == null) return; labels[i] = String(v); seen.push(v); frames.push({ note: `${i === 0 ? "Root gets 0" : `Child gets ${v}`}; children will be ${2 * v + 1} and ${2 * v + 2}. Set {${seen.join(", ")}}`, tones: { [i]: "active" }, labels: { ...labels } }); go(kids[i][0], 2 * v + 1); go(kids[i][1], 2 * v + 2); };
      go(0, 0);
      frames.push({ note: `find(4): ${seen.includes(4)}; find(3): ${seen.includes(3)}`, tones: { 4: "found" }, labels: { ...labels } });
      return tree("Recover a contaminated tree", nodes, trail(frames));
    },
  },

  "find-the-longest-substring-containing-vowels-in-even-counts": {
    approach: "Keep a 5-bit mask of vowel parities; two prefixes with the same mask bound a substring where every vowel count is even. Store each mask's first index.",
    idea: ["Bit v of the mask is the parity of that vowel so far.", "If prefixes i and j have equal masks, s[i+1..j] has every vowel an even number of times.", "So for each j, look up the first index with the same mask (mask 0 starts at -1)."],
    code: `def findTheLongestSubstring(s):
    bit = {c: 1 << i for i, c in enumerate("aeiou")}
    first = {0: -1}
    mask = best = 0
    for i, c in enumerate(s):
        mask ^= bit.get(c, 0)
        if mask in first:
            best = max(best, i - first[mask])
        else:
            first[mask] = i
    return best`,
    lang: "python", time: "O(n)", space: "O(32)",
    viz: () => {
      const s = "leetcodeisgreat", bit: Record<string, number> = { a: 1, e: 2, i: 4, o: 8, u: 16 }, first = new Map([[0, -1]]), masks = blank(s.length), frames: CellsFrame[] = []; let mask = 0, best = 0;
      [...s].forEach((c, i) => { mask ^= bit[c] || 0; masks[i] = mask.toString(2).padStart(5, "0"); let note = `'${c}' → mask ${masks[i]}`; let tones: Record<string, Tone> = { [`1:${i}`]: "active" }; if (first.has(mask)) { const f = first.get(mask)!; if (i - f > best) best = i - f; note += `, first seen at ${f} → length ${i - f} (best ${best})`; tones = { ...tones, ...range(f + 1, i, 0) }; } else { first.set(mask, i); note += ", new mask"; } frames.push({ note, rows: [s.split(""), [...masks]], tones }); });
      return cells(`Longest even-vowel substring of "${s}": ${best}`, [s.split(""), blank(s.length)], frames, ["s", "uoiea"]);
    },
  },

  "minimum-number-of-operations-to-make-all-array-elements-equal-to-1": {
    approach: "If 1s exist, each other element needs one step. Otherwise find the shortest subarray with gcd 1: making the first 1 costs its length - 1, then n - 1 more steps spread it.",
    idea: ["Once there is a 1, gcd(1, x) = 1 turns a neighbour into 1 per operation: n - (number of 1s) steps.", "With no 1, you must create one: a subarray of length L with gcd 1 needs L - 1 operations.", "So the answer is (shortest such L) - 1 + n - 1, or -1 if the whole array's gcd is above 1."],
    code: `from math import gcd
def minOperations(nums):
    n, ones = len(nums), nums.count(1)
    if ones:
        return n - ones
    best = float("inf")
    for i in range(n):
        g = nums[i]
        for j in range(i + 1, n):
            g = gcd(g, nums[j])
            if g == 1:
                best = min(best, j - i)
                break
    return -1 if best == float("inf") else best + n - 1`,
    lang: "python", time: "O(n² log m)", space: "O(1)",
    viz: () => {
      const a = [2, 6, 3, 4], n = a.length, frames: CellsFrame[] = [], gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x); let best = Infinity, at = 0;
      for (let i = 0; i < n; i++) { let g = a[i]; for (let j = i + 1; j < n; j++) { g = gcd(g, a[j]); frames.push({ note: `gcd(nums[${i}..${j}]) = ${g}${g === 1 ? ` → a 1 can be made in ${j - i} operations` : ""}`, tones: range(i, j, 0, g === 1 ? "found" : "window") }); if (g === 1) { if (j - i < best) { best = j - i; at = i; } break; } } }
      frames.push({ note: `Shortest: ${best} operations from index ${at}, then ${n - 1} more to spread the 1 → ${best + n - 1}`, tones: range(at, at + best, 0, "found") });
      return cells(`[2, 6, 3, 4] → ${best + n - 1} operations`, [a], frames);
    },
  },

  "binary-tree-coloring-game": {
    approach: "Red's node x splits the tree into three parts: its left subtree, its right subtree, and everything above. Blue wins by taking the root of a part with more than n / 2 nodes.",
    idea: ["Blue's best first move is a neighbour of x: that blocks red from one whole region.", "The three regions have sizes left(x), right(x) and n - 1 - left - right.", "Blue wins if any region holds more than half the nodes."],
    code: `def btreeGameWinningMove(root, n, x):
    sizes = []
    def count(node):
        if not node:
            return 0
        l, r = count(node.left), count(node.right)
        if node.val == x:
            sizes.extend([l, r])
        return l + r + 1
    count(root)
    l, r = sizes
    return max(l, r, n - 1 - l - r) > n // 2`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = Array.from({ length: 11 }, (_, i) => i + 1), { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}, x = 3, n = 11; let l = 0, r = 0, xi = 0;
      const count = (i: number | null): number => { if (i == null) return 0; const a = count(kids[i][0]), b = count(kids[i][1]); badges[i] = String(a + b + 1); if (val(i) === x) { l = a; r = b; xi = i; } frames.push({ note: `Subtree at ${val(i)} has ${a + b + 1} nodes`, tones: { [i]: "active" }, badges: { ...badges } }); return a + b + 1; };
      count(0); const up = n - 1 - l - r, best = Math.max(l, r, up);
      const sub = (i: number | null, t: Tone, out: Record<number, Tone>) => { if (i == null) return; out[i] = t; sub(kids[i][0], t, out); sub(kids[i][1], t, out); };
      const tones: Record<number, Tone> = Object.fromEntries(nodes.map((nd) => [nd.id, "window"])) as Record<number, Tone>; sub(xi, "muted", tones); sub(kids[xi][0], "muted", tones); sub(kids[xi][1], "muted", tones); tones[xi] = "bad";
      frames.push({ note: `Red at ${x}: left ${l}, right ${r}, above ${up}. Blue takes the parent side and gets ${best} > ${n} / 2 → ${best > n >> 1}`, tones, badges: { ...badges } });
      return tree("Coloring game, n = 11, red picks 3", nodes, frames);
    },
  },

  "remove-all-occurrences-of-a-substring": {
    approach: "Push characters onto a stack; whenever the top of the stack ends with part, pop it off.",
    idea: ["Removing an occurrence can join two halves into a new occurrence, so checks must happen right after each push.", "Comparing the last len(part) stack characters after every push catches every new occurrence at once."],
    code: `def removeOccurrences(s, part):
    st, m = [], len(part)
    for c in s:
        st.append(c)
        if len(st) >= m and "".join(st[-m:]) == part:
            del st[-m:]
    return "".join(st)`,
    lang: "python", time: "O(n·m)", space: "O(n)",
    viz: () => {
      const s = "daabcbaabcbc", part = "abc", st: string[] = [], frames: StackFrame[] = [];
      for (const c of s) { st.push(c); if (st.length >= part.length && st.slice(-part.length).join("") === part) { const gone = st.splice(-part.length); frames.push({ note: `Push '${c}': top spells "${part}" → remove it`, items: [...st], incoming: c, popped: gone }); } else frames.push({ note: `Push '${c}'`, items: [...st], incoming: c }); }
      return { kind: "stack", title: `"${s}" without "${part}" → "${st.join("")}"`, input: s.split(""), frames };
    },
  },

  "divide-intervals-into-minimum-number-of-groups": {
    approach: "Sort by start and keep a min-heap of each group's last end; reuse the group that frees earliest if it ended before this start, else open a new one.",
    idea: ["The answer is the largest number of intervals overlapping at any point (ends are inclusive).", "Sweeping by start, the group whose last interval ends earliest is the best to reuse.", "The heap size at the end is the number of groups."],
    code: `import heapq
def minGroups(intervals):
    ends = []
    for l, r in sorted(intervals):
        if ends and ends[0] < l:
            heapq.heapreplace(ends, r)
        else:
            heapq.heappush(ends, r)
    return len(ends)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const items: [number, number][] = [[1, 5], [1, 10], [2, 3], [5, 10], [6, 8]], ends: number[] = [], frames: IntervalsFrame[] = [], group: Record<number, Tone> = {};
      items.forEach(([l, r], i) => { ends.sort((a, b) => a - b); if (ends.length && ends[0] < l) { const e = ends.shift()!; ends.push(r); group[i] = "found"; frames.push({ note: `[${l}, ${r}]: a group ended at ${e} < ${l} → reuse it. Group ends {${[...ends].sort((a, b) => a - b).join(", ")}}`, tones: { ...group, [i]: "active" }, line: l }); } else { ends.push(r); group[i] = "window"; frames.push({ note: `[${l}, ${r}]: ${ends.length > 1 ? `earliest end ${Math.min(...ends.slice(0, -1))} ≥ ${l}, overlaps` : "first interval"} → new group (${ends.length})`, tones: { ...group, [i]: "active" }, line: l }); } });
      return { kind: "intervals", title: `Groups needed: ${ends.length}`, items, frames };
    },
  },

  "frog-jump-ii": {
    approach: "Go out on every even stone and back on every odd one; the answer is the largest gap stones[i] - stones[i - 2].",
    idea: ["Using a stone on both trips wastes it, so the two trips split the middle stones.", "Alternating stones is optimal: any jump then skips exactly one stone.", "So the cost is max(stones[i] - stones[i - 2]), and also stones[1] - stones[0] when there are only two."],
    code: `def maxJump(stones):
    best = stones[1] - stones[0]
    for i in range(2, len(stones)):
        best = max(best, stones[i] - stones[i - 2])
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const st = [0, 2, 5, 6, 7], frames: CellsFrame[] = []; let best = st[1] - st[0];
      frames.push({ note: `Start with the first gap ${best}`, tones: range(0, 1, 0, "window") });
      for (let i = 2; i < st.length; i++) { const g = st[i] - st[i - 2]; best = Math.max(best, g); frames.push({ note: `Jump ${st[i - 2]} → ${st[i]} skips stone ${st[i - 1]}: ${g} (max ${best})`, tones: { [`0:${i - 2}`]: "active", [`0:${i}`]: "active", [`0:${i - 1}`]: "muted" } }); }
      return cells(`Smallest possible longest jump: ${best}`, [st], frames);
    },
  },

  "minimum-absolute-difference-between-elements-with-constraint": {
    approach: "Walk i from x; add nums[i - x] to a sorted list, then binary-search it for the values nearest nums[i].",
    idea: ["Any j with j ≤ i - x is a legal partner for i, and that set only grows as i moves right.", "Keep those values sorted; the closest one to nums[i] is at the insertion point or just before it."],
    code: `from bisect import bisect_left, insort
def minAbsoluteDifference(nums, x):
    seen, best = [], float("inf")
    for i in range(x, len(nums)):
        insort(seen, nums[i - x])
        j = bisect_left(seen, nums[i])
        if j < len(seen):
            best = min(best, seen[j] - nums[i])
        if j:
            best = min(best, nums[i] - seen[j - 1])
    return best`,
    lang: "python", time: "O(n log n) searches (list inserts O(n) each)", space: "O(n)",
    viz: () => {
      const a = [5, 3, 2, 10, 15], x = 1, seen: number[] = [], frames: CellsFrame[] = []; let best = Infinity;
      for (let i = x; i < a.length; i++) { seen.push(a[i - x]); seen.sort((p, q) => p - q); const near = seen.reduce((p, v) => (Math.abs(v - a[i]) < Math.abs(p - a[i]) ? v : p)); best = Math.min(best, Math.abs(near - a[i])); frames.push({ note: `i=${i}: allowed partners sorted [${seen.join(", ")}]; nearest to ${a[i]} is ${near} → ${Math.abs(near - a[i])} (best ${best})`, tones: { ...range(0, i - x, 0), [`0:${i}`]: "active", [`0:${a.indexOf(near)}`]: "found" } }); }
      return cells(`x = 1: smallest difference ${best}`, [a], frames);
    },
  },

  "maximum-area-of-a-piece-of-cake-after-horizontal-and-vertical-cuts": {
    approach: "The biggest piece uses the biggest gap between horizontal cuts and the biggest gap between vertical cuts; multiply them.",
    idea: ["Every piece is one horizontal strip crossed with one vertical strip.", "Sort each cut list, add the edges 0 and h (or w), and take the largest consecutive gap.", "The product of the two largest gaps is the answer, mod 1e9 + 7."],
    code: `def maxArea(h, w, horizontalCuts, verticalCuts):
    def widest(cuts, size):
        cuts = sorted(cuts)
        return max(b - a for a, b in zip([0] + cuts, cuts + [size]))
    return widest(horizontalCuts, h) * widest(verticalCuts, w) % (10**9 + 7)`,
    lang: "python", time: "O(n log n + m log m)", space: "O(n + m)",
    viz: () => {
      const h = 5, w = 4, H = [0, 1, 2, 4, h], W = [0, 1, 3, w], gh = H.slice(1).map((v, i) => v - H[i]), gw = W.slice(1).map((v, i) => v - W[i]), bh = Math.max(...gh), bw = Math.max(...gw);
      const grid = gh.map((a) => gw.map((b) => a * b)), frames: TableFrame[] = [{ note: `Horizontal strips (rows) are ${gh.join(", ")} tall; vertical strips (columns) are ${gw.join(", ")} wide`, cells: grid }];
      frames.push({ note: `Tallest strip ${bh}`, cells: grid, tones: Object.fromEntries(gh.flatMap((g, i) => (g === bh ? gw.map((_, j) => [`${i}:${j}`, "window"]) : []))) as Record<string, Tone> });
      const i = gh.indexOf(bh), j = gw.indexOf(bw);
      frames.push({ note: `Widest strip ${bw} → biggest piece ${bh} × ${bw} = ${bh * bw}`, cells: grid, active: [i, j], tones: { [`${i}:${j}`]: "found" } });
      return table(`5 × 4 cake: biggest piece ${bh * bw}`, gh.map((g) => `h ${g}`), gw.map((g) => `w ${g}`), frames);
    },
  },

  "bag-of-tokens": {
    approach: "Sort; buy score with the cheapest token while you can afford it, otherwise sell one score for the most expensive token. Track the best score seen.",
    idea: ["Face up costs power and gains 1 score, so spend on the cheapest token.", "Face down gains power and costs 1 score, so cash in the most expensive token.", "Two pointers over the sorted tokens; the best score can occur mid-way, so remember the maximum."],
    code: `def bagOfTokensScore(tokens, power):
    tokens.sort()
    lo, hi = 0, len(tokens) - 1
    score = best = 0
    while lo <= hi:
        if power >= tokens[lo]:
            power -= tokens[lo]
            lo += 1
            score += 1
            best = max(best, score)
        elif score:
            power += tokens[hi]
            hi -= 1
            score -= 1
        else:
            break
    return best`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const t = [100, 200, 300, 400]; let power = 200, lo = 0, hi = t.length - 1, score = 0, best = 0; const frames: CellsFrame[] = [], tones: Record<string, Tone> = {};
      while (lo <= hi) {
        if (power >= t[lo]) { power -= t[lo]; tones[`0:${lo}`] = "found"; lo++; score++; best = Math.max(best, score); frames.push({ note: `Play ${t[lo - 1]} face up: power ${power}, score ${score} (best ${best})`, tones: { ...tones }, marks: [{ i: Math.min(lo, t.length - 1), label: "lo" }, { i: hi, label: "hi" }] }); }
        else if (score) { power += t[hi]; tones[`0:${hi}`] = "bad"; hi--; score--; frames.push({ note: `Can't afford ${t[lo]}: play ${t[hi + 1]} face down: power ${power}, score ${score}`, tones: { ...tones }, marks: [{ i: lo, label: "lo" }, { i: Math.max(hi, 0), label: "hi" }] }); }
        else break;
      }
      return cells(`Tokens [100, 200, 300, 400], power 200 → ${best}`, [t], frames);
    },
  },

  "find-players-with-zero-or-one-losses": {
    approach: "Count losses for every player who appears; list those with 0 losses and those with exactly 1, sorted.",
    idea: ["Only players who played at least once count, so collect everyone from the matches.", "A Counter of losers gives each player's loss count (0 if absent)."],
    code: `from collections import Counter
def findWinners(matches):
    losses = Counter(loser for _, loser in matches)
    players = {p for m in matches for p in m}
    return [sorted(p for p in players if losses[p] == 0),
            sorted(p for p in players if losses[p] == 1)]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const m = [[1, 3], [2, 3], [3, 6], [5, 6], [5, 7], [4, 5], [4, 8], [4, 9], [10, 4], [10, 9]], ps = [...new Set(m.flat())].sort((a, b) => a - b), loss = ps.map(() => 0), frames: CellsFrame[] = [];
      m.forEach(([w, l]) => { loss[ps.indexOf(l)]++; frames.push({ note: `${w} beats ${l}: ${l} now has ${loss[ps.indexOf(l)]} loss${loss[ps.indexOf(l)] > 1 ? "es" : ""}`, rows: [ps, [...loss]], tones: { [`1:${ps.indexOf(l)}`]: "active", [`0:${ps.indexOf(w)}`]: "window" } }); });
      const zero = ps.filter((_, i) => !loss[i]), one = ps.filter((_, i) => loss[i] === 1);
      frames.push({ note: `No losses: [${zero.join(", ")}]; one loss: [${one.join(", ")}]`, rows: [ps, loss], tones: Object.fromEntries(loss.map((c, i) => [`1:${i}`, c === 0 ? "found" : c === 1 ? "window" : "muted"])) as Record<string, Tone> });
      return cells(`[[${zero.join(", ")}], [${one.join(", ")}]]`, [ps, ps.map(() => 0)], frames, ["player", "losses"]);
    },
  },

  "minimum-number-of-operations-to-make-array-empty": {
    approach: "Count each value; a count of 1 is impossible, otherwise remove in threes and it takes ceil(count / 3) operations.",
    idea: ["Each value is handled on its own: remove 2 or 3 copies at a time.", "Any count ≥ 2 can be written with 3s and at most two 2s, using ceil(c / 3) operations.", "A single copy can never be removed, so return -1."],
    code: `from collections import Counter
def minOperations(nums):
    ops = 0
    for c in Counter(nums).values():
        if c == 1:
            return -1
        ops += (c + 2) // 3
    return ops`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [2, 3, 3, 2, 2, 4, 2, 3, 4], vals = [...new Set(a)], cnt = vals.map((v) => a.filter((x) => x === v).length), ops = blank(vals.length), frames: CellsFrame[] = []; let total = 0;
      vals.forEach((v, i) => { const o = Math.ceil(cnt[i] / 3); total += o; ops[i] = o; const parts = cnt[i] % 3 === 0 ? `${cnt[i] / 3} × 3` : cnt[i] % 3 === 1 ? `${(cnt[i] - 4) / 3} × 3 + 2 × 2` : `${(cnt[i] - 2) / 3} × 3 + 1 × 2`; frames.push({ note: `${v} appears ${cnt[i]} times = ${parts} → ${o} operations (total ${total})`, rows: [vals, cnt, [...ops]], tones: { [`2:${i}`]: "found", [`1:${i}`]: "active" } }); });
      return cells(`Operations to empty the array: ${total}`, [vals, cnt, blank(vals.length)], frames, ["value", "count", "ops"]);
    },
  },

  "queue-reconstruction-by-height": {
    approach: "Sort tallest first (ties by k ascending) and insert each person at index k; shorter people inserted later never change a taller person's count.",
    idea: ["A person's k counts only people at least as tall in front.", "If everyone already placed is at least as tall, inserting at position k makes exactly k of them in front.", "People placed later are shorter, so they do not affect the counts of those already placed."],
    code: `def reconstructQueue(people):
    out = []
    for p in sorted(people, key=lambda p: (-p[0], p[1])):
        out.insert(p[1], p)
    return out`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const people = [[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]], ord = [...people].sort((a, b) => b[0] - a[0] || a[1] - b[1]), out: number[][] = [], frames: CellsFrame[] = [], lab = (p: number[]) => `${p[0]},${p[1]}`;
      const row = () => [...out.map(lab), ...blank(people.length - out.length)];
      frames.push({ note: `Sorted tallest first: ${ord.map((p) => `[${lab(p)}]`).join(" ")}`, rows: [ord.map(lab), blank(people.length)] });
      ord.forEach((p, i) => { out.splice(p[1], 0, p); frames.push({ note: `Insert [${lab(p)}] at index ${p[1]}: exactly ${p[1]} taller or equal people in front`, rows: [ord.map(lab), row()], tones: { [`0:${i}`]: "active", [`1:${p[1]}`]: "found" } }); });
      return cells("Reconstruct the queue", [ord.map(lab), blank(people.length)], frames, ["order", "queue"]);
    },
  },

  "sort-the-matrix-diagonally": {
    approach: "Cells on one diagonal share i - j; bucket values by i - j, sort each bucket, and write them back top-left to bottom-right.",
    idea: ["i - j is constant along a top-left to bottom-right diagonal.", "Group by that key, sort each group, then refill in row-major order, which visits each diagonal from its top."],
    code: `from collections import defaultdict
def diagonalSort(mat):
    d = defaultdict(list)
    for i, row in enumerate(mat):
        for j, v in enumerate(row):
            d[i - j].append(v)
    for key in d:
        d[key].sort(reverse=True)   # pop() gives the smallest
    for i, row in enumerate(mat):
        for j in range(len(row)):
            row[j] = d[i - j].pop()
    return mat`,
    lang: "python", time: "O(mn log min(m, n))", space: "O(mn)",
    viz: () => {
      const mat = [[3, 3, 1, 1], [2, 2, 1, 2], [1, 1, 1, 2]], m = 3, n = 4, cur = mat.map((r) => [...r]), frames: TableFrame[] = [{ note: "Each diagonal has a fixed i - j", cells: mat.map((r) => [...r]) }];
      for (let key = m - 1; key > -n; key--) { const pos: [number, number][] = []; for (let i = 0; i < m; i++) { const j = i - key; if (j >= 0 && j < n) pos.push([i, j]); } if (pos.length < 2) continue; const before = pos.map(([i, j]) => cur[i][j]), after = [...before].sort((a, b) => a - b); pos.forEach(([i, j], k) => (cur[i][j] = after[k])); frames.push({ note: `i - j = ${key}: [${before.join(", ")}] → [${after.join(", ")}]`, cells: cur.map((r) => [...r]), tones: Object.fromEntries(pos.map(([i, j]) => [`${i}:${j}`, "found"])) as Record<string, Tone> }); }
      return table("Sort each diagonal", nums(m), nums(n), frames);
    },
  },

  "minimum-number-of-pushes-to-type-word-ii": {
    approach: "Sort letter frequencies high to low; the 8 most frequent letters cost 1 push each, the next 8 cost 2, and so on.",
    idea: ["There are 8 keys, so 8 letters can sit in first position, 8 in second, and so on.", "Give first positions to the most frequent letters.", "Letter i in sorted order costs freq × (i // 8 + 1)."],
    code: `from collections import Counter
def minimumPushes(word):
    freq = sorted(Counter(word).values(), reverse=True)
    return sum(f * (i // 8 + 1) for i, f in enumerate(freq))`,
    lang: "python", time: "O(n)", space: "O(26)",
    viz: () => {
      const w = "aabbccddeeffgghhiiiiii", cnt = new Map<string, number>(); [...w].forEach((c) => cnt.set(c, (cnt.get(c) || 0) + 1));
      const ent = [...cnt].sort((a, b) => b[1] - a[1]), letters = ent.map(([c]) => c), freq = ent.map(([, f]) => f), cost = blank(ent.length), frames: CellsFrame[] = []; let total = 0;
      ent.forEach(([c, f], i) => { const p = Math.floor(i / 8) + 1; total += f * p; cost[i] = f * p; frames.push({ note: `'${c}' (${f} times) gets slot ${p} on key ${(i % 8) + 2}: ${f} × ${p} = ${f * p} (total ${total})`, rows: [letters, freq, [...cost]], tones: { [`2:${i}`]: p === 1 ? "found" : "window" } }); });
      return cells(`minimumPushes = ${total}`, [letters, freq, blank(ent.length)], frames, ["letter", "freq", "pushes"]);
    },
  },

  "design-graph-with-shortest-path-calculator": {
    approach: "Store an adjacency list; addEdge appends, and shortestPath runs Dijkstra from node1, stopping when node2 is popped.",
    idea: ["Weights are positive, so Dijkstra gives exact shortest paths.", "New edges just extend the list; each query recomputes from scratch.", "Return -1 if node2 is never reached."],
    code: `import heapq
class Graph:
    def __init__(self, n, edges):
        self.g = [[] for _ in range(n)]
        for e in edges:
            self.addEdge(e)

    def addEdge(self, edge):
        u, v, w = edge
        self.g[u].append((v, w))

    def shortestPath(self, node1, node2):
        dist = {node1: 0}
        h = [(0, node1)]
        while h:
            d, u = heapq.heappop(h)
            if u == node2:
                return d
            if d > dist[u]:
                continue
            for v, w in self.g[u]:
                if d + w < dist.get(v, float("inf")):
                    dist[v] = d + w
                    heapq.heappush(h, (d + w, v))
        return -1`,
    lang: "python", time: "O(E log V) per query", space: "O(V + E)",
    viz: () => {
      const edges: [number, number, number][] = [[0, 2, 5], [0, 1, 2], [1, 2, 1], [3, 0, 3], [1, 3, 4]], nodes = [{ id: 0, label: "0", x: 10, y: 50 }, { id: 1, label: "1", x: 50, y: 12 }, { id: 2, label: "2", x: 50, y: 88 }, { id: 3, label: "3", x: 90, y: 50 }];
      const g: [number, number][][] = [[], [], [], []]; edges.forEach(([u, v, w]) => g[u].push([v, w]));
      const dist: Record<number, number> = { 0: 0 }, h: [number, number][] = [[0, 0]], done: Record<number, Tone> = {}, et: Record<string, Tone> = {}, frames: GraphFrame[] = [{ note: "addEdge([1, 3, 4]) added the edge 1 → 3. Now shortestPath(0, 3): start at 0", tones: { 0: "active" }, badges: { 0: "0" }, edgeTones: { [ek(1, 3)]: "window" } }]; let ans = -1;
      const badges = () => Object.fromEntries(Object.entries(dist).map(([k, v]) => [+k, String(v)]));
      while (h.length) { h.sort((a, b) => a[0] - b[0]); const [d, u] = h.shift()!; if (d > dist[u]) continue; done[u] = "done"; if (u === 3) { ans = d; frames.push({ note: `Pop node 3 at distance ${d} → answer ${d}`, tones: { ...done, 3: "found" }, badges: badges(), edgeTones: { ...et } }); break; } const rel: string[] = []; for (const [v, w] of g[u]) if (d + w < (dist[v] ?? Infinity)) { dist[v] = d + w; h.push([d + w, v]); et[ek(u, v)] = "found"; rel.push(`${v} = ${d + w}`); } frames.push({ note: `Pop ${u} (distance ${d})${rel.length ? `; relax ${rel.join(", ")}` : "; nothing improves"}`, tones: { ...done, [u]: "active" }, badges: badges(), edgeTones: { ...et } }); }
      return { kind: "graph", title: `shortestPath(0, 3) = ${ans}`, nodes, edges: edges.map(([a, b, w]) => ({ a, b, w, directed: true })), frames };
    },
  },

  "smallest-string-with-swaps": {
    approach: "Swaps chain together, so indices in one connected component can be rearranged freely; union-find the pairs and sort each component's letters into its sorted indices.",
    idea: ["If a-b and b-c can swap, any order of the letters at a, b, c is reachable.", "Union-find groups indices into components.", "Within a component, put the smallest letters at the smallest indices."],
    code: `from collections import defaultdict
def smallestStringWithSwaps(s, pairs):
    parent = list(range(len(s)))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in pairs:
        parent[find(a)] = find(b)
    groups = defaultdict(list)
    for i in range(len(s)):
        groups[find(i)].append(i)
    out = list(s)
    for idx in groups.values():
        for i, c in zip(idx, sorted(out[i] for i in idx)):
            out[i] = c
    return "".join(out)`,
    lang: "python", time: "O(n log n + p α(n))", space: "O(n)",
    viz: () => {
      const s = "dcab", pairs = [[0, 3], [1, 2]], out = s.split(""), nodes = [{ id: 0, label: "0:d", x: 10, y: 50 }, { id: 1, label: "1:c", x: 37, y: 50 }, { id: 2, label: "2:a", x: 63, y: 50 }, { id: 3, label: "3:b", x: 90, y: 50 }];
      const parent = [0, 1, 2, 3], find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), frames: GraphFrame[] = [], et: Record<string, Tone> = {};
      pairs.forEach(([a, b]) => { parent[find(a)] = find(b); et[ek(a, b)] = "found"; frames.push({ note: `Union ${a} and ${b}: their letters can be swapped`, tones: { [a]: "active", [b]: "active" }, edgeTones: { ...et } }); });
      const groups = new Map<number, number[]>(); out.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) || []), i]));
      const tone: Tone[] = ["found", "window"]; let gi = 0; const tones: Record<number, Tone> = {}, badges: Record<number, string> = {};
      for (const idx of groups.values()) { const sorted = idx.map((i) => out[i]).sort(); idx.forEach((i, k) => { out[i] = sorted[k]; tones[i] = tone[gi % 2]; badges[i] = sorted[k]; }); frames.push({ note: `Component {${idx.join(", ")}}: sorted letters ${sorted.join(", ")} go to indices ${idx.join(", ")}`, tones: { ...tones }, badges: { ...badges }, edgeTones: { ...et } }); gi++; }
      return { kind: "graph", title: `"${s}" → "${out.join("")}"`, nodes, edges: [{ a: 0, b: 3 }, { a: 1, b: 2 }], frames };
    },
  },

  "matrix-block-sum": {
    approach: "Build a 2D prefix sum once; each block sum is then four lookups, with the block clipped to the matrix.",
    idea: ["P[i][j] = sum of the rectangle above and left of (i, j).", "Any rectangle sum = P[r2][c2] - P[r1][c2] - P[r2][c1] + P[r1][c1].", "For each cell the block is rows i-k..i+k and columns j-k..j+k, clipped to the edges."],
    code: `def matrixBlockSum(mat, k):
    m, n = len(mat), len(mat[0])
    P = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            P[i + 1][j + 1] = mat[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]
    out = [[0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            r1, c1 = max(0, i - k), max(0, j - k)
            r2, c2 = min(m, i + k + 1), min(n, j + k + 1)
            out[i][j] = P[r2][c2] - P[r1][c2] - P[r2][c1] + P[r1][c1]
    return out`,
    lang: "python", time: "O(mn)", space: "O(mn)",
    viz: () => {
      const mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], k = 1, m = 3, n = 3, P = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) P[i + 1][j + 1] = mat[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
      const out: (number | null)[][] = mat.map((r) => r.map(() => null)), frames: TableFrame[] = [];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { const r1 = Math.max(0, i - k), c1 = Math.max(0, j - k), r2 = Math.min(m, i + k + 1), c2 = Math.min(n, j + k + 1); out[i][j] = P[r2][c2] - P[r1][c2] - P[r2][c1] + P[r1][c1]; const t: Record<string, Tone> = {}; for (let a = r1; a < r2; a++) for (let b = c1; b < c2; b++) t[`${a}:${b}`] = "window"; frames.push({ note: `(${i}, ${j}): block rows ${r1}..${r2 - 1}, cols ${c1}..${c2 - 1} = ${P[r2][c2]} - ${P[r1][c2]} - ${P[r2][c1]} + ${P[r1][c1]} = ${out[i][j]}`, cells: mat.map((r, a) => r.map((v, b) => (a === i && b === j ? out[i][j] : v))), active: [i, j], tones: t }); }
      frames.push({ note: `Answer: ${out.map((r) => `[${r.join(", ")}]`).join(" ")}`, cells: out, tones: Object.fromEntries(out.flatMap((r, a) => r.map((_, b) => [`${a}:${b}`, "found"]))) as Record<string, Tone> });
      return table("Block sums with k = 1", nums(m), nums(n), frames);
    },
  },

  "filling-bookcase-shelves": {
    approach: "dp[i] = least height for the first i books; the last shelf holds books j..i, so try every j that fits the width and add that shelf's tallest book.",
    idea: ["Books keep their order, so the last shelf is always a suffix of the books placed so far.", "dp[i] = min over valid j of dp[j - 1] + max height of books j..i.", "Walk j backwards from i while the shelf width still fits."],
    code: `def minHeightShelves(books, shelfWidth):
    n = len(books)
    dp = [0] + [float("inf")] * n
    for i in range(1, n + 1):
        w = h = 0
        for j in range(i, 0, -1):
            w += books[j - 1][0]
            if w > shelfWidth:
                break
            h = max(h, books[j - 1][1])
            dp[i] = min(dp[i], dp[j - 1] + h)
    return dp[n]`,
    lang: "python", time: "O(n · width)", space: "O(n)",
    viz: () => {
      const books = [[1, 1], [2, 3], [2, 3], [1, 1], [1, 1], [1, 1], [1, 2]], W = 4, n = books.length, dp: number[] = [0, ...Array(n).fill(Infinity)], row = () => dp.map((x) => (Number.isFinite(x) ? x : "")), frames: CellsFrame[] = [];
      const wRow = ["", ...books.map((b) => b[0])], hRow = ["", ...books.map((b) => b[1])];
      for (let i = 1; i <= n; i++) { let w = 0, h = 0, from = i; for (let j = i; j > 0; j--) { w += books[j - 1][0]; if (w > W) break; h = Math.max(h, books[j - 1][1]); if (dp[j - 1] + h < dp[i]) { dp[i] = dp[j - 1] + h; from = j; } } frames.push({ note: `dp[${i}] = ${dp[i]}: last shelf holds books ${from}..${i} on top of dp[${from - 1}] = ${dp[from - 1]}`, rows: [wRow, hRow, row()], tones: { ...range(from, i, 0, "window"), ...range(from, i, 1, "window"), [`2:${i}`]: "found", [`2:${from - 1}`]: "active" } }); }
      return cells(`Shelf width 4 → height ${dp[n]}`, [wRow, hRow, row()], frames, ["width", "height", "dp"]);
    },
  },

  "populating-next-right-pointers-in-each-node-ii": {
    approach: "Use the next pointers of the current level as a linked list to walk it, and stitch the next level's children together with a dummy head.",
    idea: ["Once a level is linked, you can walk it left to right with next, no queue needed.", "While walking, append each child to a tail pointer; that links the level below.", "Move down to dummy.next and repeat. O(1) extra space."],
    code: `def connect(root):
    head = root
    while head:
        dummy = tail = Node(0)
        node = head
        while node:
            for child in (node.left, node.right):
                if child:
                    tail.next = child
                    tail = child
            node = node.next
        head = dummy.next
    return root`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, null, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = { 0: "→ #" };
      let level = [0]; frames.push({ note: "The root's level is just the root: next = null", tones: { 0: "done" }, badges: { ...badges } });
      while (level.length) { const below: number[] = []; for (const u of level) for (const c of kids[u]) if (c != null) { if (below.length) badges[below[below.length - 1]] = `→ ${val(c)}`; below.push(c); badges[c] = "→ #"; frames.push({ note: `Walking ${val(u)}'s level: append ${val(c)} to the tail of the level below`, tones: { [u]: "active", [c]: "found" }, badges: { ...badges } }); } level = below; }
      return tree("Link each level with next", nodes, trail(frames));
    },
  },

  "number-of-submatrices-that-sum-to-target": {
    approach: "Fix a top and bottom row, squash the rows between them into column sums, and count subarrays of that 1D array summing to target with a prefix-sum hashmap.",
    idea: ["Every submatrix is a pair of rows plus a range of columns.", "For fixed rows, the column sums turn the problem into 'subarrays with sum target'.", "Prefix sums and a counter of earlier prefixes count those in O(n)."],
    code: `from collections import Counter
def numSubmatrixSumTarget(matrix, target):
    m, n = len(matrix), len(matrix[0])
    ans = 0
    for top in range(m):
        col = [0] * n
        for bot in range(top, m):
            for j in range(n):
                col[j] += matrix[bot][j]
            seen, s = Counter({0: 1}), 0
            for x in col:
                s += x
                ans += seen[s - target]
                seen[s] += 1
    return ans`,
    lang: "python", time: "O(m² n)", space: "O(n)",
    viz: () => {
      const M = [[0, 1, 0], [1, 1, 1], [0, 1, 0]], m = 3, n = 3, frames: TableFrame[] = []; let ans = 0;
      for (let top = 0; top < m; top++) { const col = Array(n).fill(0); for (let bot = top; bot < m; bot++) { for (let j = 0; j < n; j++) col[j] += M[bot][j]; const seen = new Map([[0, 1]]); let s = 0, here = 0; for (const x of col) { s += x; here += seen.get(s) || 0; seen.set(s, (seen.get(s) || 0) + 1); } ans += here; const t: Record<string, Tone> = {}; for (let r = top; r <= bot; r++) for (let j = 0; j < n; j++) t[`${r}:${j}`] = here ? "found" : "window"; frames.push({ note: `Rows ${top}..${bot}: column sums [${col.join(", ")}] → ${here} column range${here === 1 ? "" : "s"} summing to 0 (total ${ans})`, cells: M, tones: t }); } }
      return table(`Submatrices summing to 0: ${ans}`, nums(m), nums(n), frames);
    },
  },

  "count-subarrays-where-max-element-appears-at-least-k-times": {
    approach: "Slide a window that keeps fewer than k copies of the maximum; every start before the window's left edge gives a valid subarray ending here, so add left.",
    idea: ["Only the global maximum matters; count its copies inside the window.", "When the window reaches k copies, shrink from the left until it drops below k.", "Then each start 0..left-1 with this end has at least k copies: add left."],
    code: `def countSubarrays(nums, k):
    mx = max(nums)
    ans = left = cnt = 0
    for x in nums:
        if x == mx:
            cnt += 1
        while cnt >= k:
            if nums[left] == mx:
                cnt -= 1
            left += 1
        ans += left
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 3, 2, 3, 3], k = 2, mx = Math.max(...a), frames: CellsFrame[] = []; let ans = 0, left = 0, cnt = 0;
      a.forEach((x, r) => { if (x === mx) cnt++; while (cnt >= k) { if (a[left] === mx) cnt--; left++; } ans += left; frames.push({ note: `End ${r}: window [${left}..${r}] has ${cnt} copies of ${mx}; starts 0..${left - 1} work → +${left} (total ${ans})`, tones: { ...(left ? range(0, left - 1, 0, "found") : {}), ...range(left, r, 0) }, marks: [{ i: Math.min(left, r), label: "L" }, { i: r, label: "R" }] }); });
      return cells(`Subarrays with max ${mx} at least ${k} times: ${ans}`, [a], frames);
    },
  },

  "longest-substring-with-at-least-k-repeating-characters": {
    approach: "Divide and conquer: a letter that appears fewer than k times can never be inside the answer, so split the string on it and solve each piece.",
    idea: ["If every letter in s appears at least k times, all of s is valid.", "Otherwise pick a letter with count < k; no valid substring contains it.", "Split on it and return the best result among the pieces."],
    code: `def longestSubstring(s, k):
    if len(s) < k:
        return 0
    for c in set(s):
        if s.count(c) < k:
            return max(longestSubstring(part, k) for part in s.split(c))
    return len(s)`,
    lang: "python", time: "O(26 n)", space: "O(26 n) worst",
    viz: () => {
      const s = "aaabbcbbbb", k = 3, frames: CellsFrame[] = [];
      const go = (lo: number, hi: number): number => {
        if (hi - lo < k) { if (hi > lo) frames.push({ note: `"${s.slice(lo, hi)}" is shorter than ${k} → 0`, tones: range(lo, hi - 1, 0, "muted") }); return 0; }
        const part = s.slice(lo, hi), bad = [...new Set(part)].sort().find((c) => part.split(c).length - 1 < k);
        if (!bad) { frames.push({ note: `"${part}": every letter appears ≥ ${k} times → ${hi - lo}`, tones: range(lo, hi - 1, 0, "found") }); return hi - lo; }
        frames.push({ note: `"${part}": '${bad}' appears only ${part.split(bad).length - 1} times → split on it`, tones: { ...range(lo, hi - 1), ...Object.fromEntries([...part].flatMap((c, i) => (c === bad ? [[`0:${lo + i}`, "bad"]] : []))) } });
        let best = 0, start = lo; for (let i = lo; i <= hi; i++) if (i === hi || s[i] === bad) { best = Math.max(best, go(start, i)); start = i + 1; }
        return best;
      };
      const ans = go(0, s.length);
      return cells(`longestSubstring("${s}", 3) = ${ans}`, [s.split("")], frames);
    },
  },

  "contiguous-array": {
    approach: "Count 1 as +1 and 0 as -1; equal zeros and ones means a zero-sum subarray, so remember the first index of each running sum.",
    idea: ["With ±1 scores, a balanced subarray has sum 0.", "Prefix sums that repeat bound a zero-sum subarray.", "Keep only the first index of each prefix value (sum 0 at index -1) to get the longest."],
    code: `def findMaxLength(nums):
    first = {0: -1}
    s = best = 0
    for i, x in enumerate(nums):
        s += 1 if x else -1
        if s in first:
            best = max(best, i - first[s])
        else:
            first[s] = i
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [0, 1, 1, 1, 1, 1, 0, 0, 0], pre = blank(a.length), first = new Map([[0, -1]]), frames: CellsFrame[] = []; let s = 0, best = 0;
      a.forEach((x, i) => { s += x ? 1 : -1; pre[i] = s; let note = `sum ${s}`; let tones: Record<string, Tone> = { [`1:${i}`]: "active" }; if (first.has(s)) { const f = first.get(s)!; best = Math.max(best, i - f); note += `, first seen at ${f} → [${f + 1}..${i}] balanced, length ${i - f} (best ${best})`; tones = { ...tones, ...range(f + 1, i) }; } else { first.set(s, i); note += ", first time"; } frames.push({ note, rows: [a, [...pre]], tones }); });
      return cells(`Longest balanced subarray: ${best}`, [a, blank(a.length)], frames, ["nums", "sum"]);
    },
  },

  "minimum-number-of-operations-to-make-array-continuous": {
    approach: "Keep as many numbers as possible: sort the distinct values and slide a window [lo, lo + n - 1]; the most values inside one window stay, the rest change.",
    idea: ["The final array is n consecutive numbers starting at some value lo.", "It is enough to try lo = each distinct value; the numbers already inside [lo, lo + n - 1] can stay.", "Two pointers over the sorted distinct values find the best window; answer = n - kept."],
    code: `def minOperations(nums):
    n = len(nums)
    a = sorted(set(nums))
    best = j = 0
    for i, lo in enumerate(a):
        while j < len(a) and a[j] < lo + n:
            j += 1
        best = max(best, j - i)
    return n - best`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const v = [1, 2, 3, 5, 6, 10], n = v.length, a = [...new Set(v)].sort((x, y) => x - y), frames: CellsFrame[] = []; let best = 0, j = 0;
      a.forEach((lo, i) => { while (j < a.length && a[j] < lo + n) j++; best = Math.max(best, j - i); frames.push({ note: `Target ${lo}..${lo + n - 1}: values ${a.slice(i, j).join(", ")} already fit → keep ${j - i} (best ${best})`, tones: range(i, j - 1), marks: [{ i, label: "i" }, { i: j - 1, label: "j" }] }); });
      return cells(`[${v.join(", ")}] → ${n - best} operations`, [a], frames);
    },
  },

  "robot-collisions": {
    approach: "Process robots by position with a stack of right-movers; each left-mover fights the stack top until one side is gone.",
    idea: ["Only an R robot to the left of an L robot can meet it, and the nearest R meets it first: a stack.", "The weaker robot dies and the winner loses 1 health; equal health kills both.", "Survivors keep their original order in the output."],
    code: `def survivedRobotsHealths(positions, healths, directions):
    h = healths[:]
    st = []
    for i in sorted(range(len(positions)), key=lambda i: positions[i]):
        if directions[i] == "R":
            st.append(i)
            continue
        while st and h[i]:
            j = st[-1]
            if h[j] < h[i]:
                st.pop(); h[j] = 0; h[i] -= 1
            elif h[j] > h[i]:
                h[j] -= 1; h[i] = 0
            else:
                st.pop(); h[j] = h[i] = 0
    return [x for x in h if x]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const pos = [3, 5, 2, 6], hp = [10, 10, 15, 12], dir = "RLRL", h = [...hp], st: number[] = [], frames: StackFrame[] = [], lab = (i: number) => `#${i}:${h[i]}`;
      [...pos.keys()].sort((a, b) => pos[a] - pos[b]).forEach((i) => {
        if (dir[i] === "R") { st.push(i); frames.push({ note: `Robot ${i} at ${pos[i]} moves right → push`, items: st.map(lab), incoming: lab(i) }); return; }
        while (st.length && h[i]) { const j = st[st.length - 1], before = `${h[j]} vs ${h[i]}`; let gone: string[] = []; if (h[j] < h[i]) { st.pop(); gone = [`#${j}`]; h[j] = 0; h[i]--; } else if (h[j] > h[i]) { h[j]--; h[i] = 0; } else { st.pop(); gone = [`#${j}`]; h[j] = h[i] = 0; } frames.push({ note: `Robot ${i} (left) meets robot ${j}: ${before} → ${h[i] ? `robot ${i} wins with ${h[i]}` : h[j] ? `robot ${j} wins with ${h[j]}` : "both destroyed"}`, items: st.map(lab), incoming: `#${i}`, popped: gone }); }
        if (h[i]) frames.push({ note: `Robot ${i} survives with ${h[i]}, nothing left to hit`, items: st.map(lab) });
      });
      const out = h.filter((x) => x);
      return { kind: "stack", title: `Survivors: [${out.join(", ")}]`, frames };
    },
  },

  "array-of-doubled-pairs": {
    approach: "Count values and process them by absolute value, smallest first; each x must be matched with a 2x, so 2x needs at least count[x] copies left.",
    idea: ["The value with the smallest |x| cannot be the double of anything still unmatched, so it must pair with 2x.", "Greedily match all copies of x with copies of 2x and subtract.", "If 2x runs short, it is impossible."],
    code: `from collections import Counter
def canReorderDoubled(arr):
    c = Counter(arr)
    for x in sorted(c, key=abs):
        if c[x] > c[2 * x]:
            return False
        c[2 * x] -= c[x]
    return True`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const arr = [4, -2, 2, -4, 1, 8], c = new Map<number, number>(); arr.forEach((x) => c.set(x, (c.get(x) || 0) + 1));
      const keys = [...c.keys()].sort((a, b) => Math.abs(a) - Math.abs(b)), row = () => keys.map((k) => c.get(k) || 0), frames: CellsFrame[] = [{ note: "Counts, sorted by absolute value", rows: [keys, row()] }]; let ok = true;
      for (const x of keys) { const cx = c.get(x) || 0; if (!cx) continue; const c2 = c.get(2 * x) || 0, i = keys.indexOf(x), j = keys.indexOf(2 * x); if (cx > c2) { ok = false; frames.push({ note: `${cx} × ${x} need ${2 * x}, only ${c2} left → false`, rows: [keys, row()], tones: { [`1:${i}`]: "bad" } }); break; } c.set(2 * x, c2 - cx); c.set(x, 0); frames.push({ note: `Pair ${cx} × ${x} with ${2 * x}`, rows: [keys, row()], tones: { [`0:${i}`]: "active", ...(j >= 0 ? { [`0:${j}`]: "found" } : {}) } }); }
      return cells(`[${arr.join(", ")}] → ${ok}`, [keys, keys.map(() => 0)], frames, ["value", "left"]);
    },
  },

  "merge-in-between-linked-lists": {
    approach: "Find node a - 1 and node b + 1 in list1, point the first at list2's head and list2's tail at the second.",
    idea: ["Walk a - 1 steps to the node just before the cut.", "Walk b - a + 2 more steps from there to the node just after the cut.", "Rewire two pointers; the removed nodes simply drop out."],
    code: `def mergeInBetween(list1, a, b, list2):
    before = list1
    for _ in range(a - 1):
        before = before.next
    after = before
    for _ in range(b - a + 2):
        after = after.next
    before.next = list2
    while list2.next:
        list2 = list2.next
    list2.next = after
    return list1`,
    lang: "python", time: "O(n + m)", space: "O(1)",
    viz: () => {
      const l1 = [10, 1, 13, 6, 9, 5], l2 = [100, 101, 102], a = 3, b = 4, values = [...l1, ...l2], n = l1.length, next = values.map((_, i) => (i === n - 1 || i === values.length - 1 ? -1 : i + 1)), frames: ListFrame[] = [];
      frames.push({ note: `Walk ${a - 1} steps to node ${a - 1} (${l1[a - 1]}), the node before the cut`, next: [...next], ptrs: [{ i: a - 1, label: "before" }], tones: span(a, b, "bad") });
      frames.push({ note: `Walk ${b - a + 2} more to node ${b + 1} (${l1[b + 1]}), the node after the cut`, next: [...next], ptrs: [{ i: a - 1, label: "before" }, { i: b + 1, label: "after" }], tones: span(a, b, "bad") });
      next[a - 1] = n; frames.push({ note: `before.next = list2 head (${l2[0]})`, next: [...next], ptrs: [{ i: a - 1, label: "before" }, { i: n, label: "list2" }], tones: { ...span(a, b, "muted"), [n]: "found" } });
      next[values.length - 1] = b + 1; frames.push({ note: `Walk to list2's tail (${l2[l2.length - 1]}) and point it at ${l1[b + 1]}: ${[...l1.slice(0, a), ...l2, ...l1.slice(b + 1)].join(" → ")}`, next: [...next], ptrs: [{ i: values.length - 1, label: "tail" }, { i: b + 1, label: "after" }], tones: { ...span(a, b, "muted"), ...span(n, values.length - 1, "found") } });
      return { kind: "list", title: "Replace nodes 3..4 with list2", values, frames };
    },
  },

  "find-all-groups-of-farmland": {
    approach: "A rectangle's top-left cell has no farmland above or to its left; from each such corner walk down and right to find the opposite corner.",
    idea: ["Groups are rectangles that never touch, so each has exactly one top-left corner.", "A cell is a corner if it is 1 and the cells above and to the left are 0 (or off the grid).", "Extend down the column and along the row to read off the bottom-right corner."],
    code: `def findFarmland(land):
    m, n = len(land), len(land[0])
    out = []
    for i in range(m):
        for j in range(n):
            if land[i][j] and (i == 0 or not land[i - 1][j]) and (j == 0 or not land[i][j - 1]):
                r, c = i, j
                while r + 1 < m and land[r + 1][j]:
                    r += 1
                while c + 1 < n and land[i][c + 1]:
                    c += 1
                out.append([i, j, r, c])
    return out`,
    lang: "python", time: "O(mn)", space: "O(1) extra",
    viz: () => {
      const L = [[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 0], [1, 0, 0, 1]], m = 4, n = 4, out: number[][] = [], frames: TableFrame[] = [], tones: Record<string, Tone> = {};
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (L[i][j] && (i === 0 || !L[i - 1][j]) && (j === 0 || !L[i][j - 1])) { let r = i, c = j; while (r + 1 < m && L[r + 1][j]) r++; while (c + 1 < n && L[i][c + 1]) c++; out.push([i, j, r, c]); for (let x = i; x <= r; x++) for (let y = j; y <= c; y++) tones[`${x}:${y}`] = "found"; frames.push({ note: `(${i}, ${j}) has no farmland above or left → corner; extends to (${r}, ${c})`, cells: L, active: [i, j], tones: { ...tones } }); }
      return table(`${out.length} groups: ${out.map((g) => `[${g.join(", ")}]`).join(" ")}`, nums(m), nums(n), frames);
    },
  },

  "number-of-substrings-containing-all-three-characters": {
    approach: "For each end i, remember the last index of a, b and c; every start up to the smallest of those three works, giving min(last) + 1 substrings.",
    idea: ["A substring ending at i contains all three letters iff it starts at or before the earliest of their last positions.", "So add min(last a, last b, last c) + 1 (0 while one letter is still unseen at -1)."],
    code: `def numberOfSubstrings(s):
    last = {"a": -1, "b": -1, "c": -1}
    ans = 0
    for i, ch in enumerate(s):
        last[ch] = i
        ans += min(last.values()) + 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "abcabc", last: Record<string, number> = { a: -1, b: -1, c: -1 }, frames: CellsFrame[] = []; let ans = 0;
      [...s].forEach((ch, i) => { last[ch] = i; const lo = Math.min(...Object.values(last)); ans += lo + 1; frames.push({ note: `End ${i}: last a ${last.a}, b ${last.b}, c ${last.c} → starts 0..${lo} work, +${lo + 1} (total ${ans})`, tones: { ...(lo >= 0 ? range(0, lo, 0, "found") : {}), [`0:${i}`]: "active" } }); });
      return cells(`numberOfSubstrings("${s}") = ${ans}`, [s.split("")], frames);
    },
  },

  "minimum-number-of-operations-to-move-all-balls-to-each-box": {
    approach: "Two sweeps: going right, the cost to reach box i grows by the number of balls seen so far; do the same from the right and add.",
    idea: ["Moving every ball on the left one step closer costs one move per ball.", "So left-to-right: moves += balls after each box. That is the cost from the left side.", "Repeat right-to-left and sum both."],
    code: `def minOperations(boxes):
    n = len(boxes)
    out = [0] * n
    for order in (range(n), range(n - 1, -1, -1)):
        balls = moves = 0
        for i in order:
            out[i] += moves
            balls += boxes[i] == "1"
            moves += balls
    return out`,
    lang: "python", time: "O(n)", space: "O(1) extra",
    viz: () => {
      const b = "001011".split(""), n = b.length, L = blank(n), R = blank(n), frames: CellsFrame[] = [];
      let balls = 0, moves = 0; for (let i = 0; i < n; i++) { L[i] = moves; frames.push({ note: `From the left: ${balls} balls, ${moves} moves to bring them to box ${i}`, rows: [b, [...L], [...R]], tones: { [`1:${i}`]: "active" } }); balls += +b[i]; moves += balls; }
      balls = 0; moves = 0; for (let i = n - 1; i >= 0; i--) { R[i] = moves; frames.push({ note: `From the right: ${moves} moves to box ${i}; total ${+L[i] + moves}`, rows: [b, L, [...R]], tones: { [`2:${i}`]: "active" } }); balls += +b[i]; moves += balls; }
      const out = L.map((x, i) => +x + +R[i]);
      return cells(`Answer: [${out.join(", ")}]`, [b, blank(n), blank(n)], frames, ["boxes", "from left", "from right"]);
    },
  },

  "kth-smallest-element-in-a-sorted-matrix": {
    approach: "Binary search on the value: count entries ≤ mid with a staircase walk from the top-right; the smallest mid with count ≥ k is the answer.",
    idea: ["The answer lies between matrix[0][0] and matrix[-1][-1].", "Rows and columns are sorted, so the cells ≤ x form a staircase you can count in O(n).", "If count(mid) ≥ k the answer is ≤ mid, else it is above."],
    code: `def kthSmallest(matrix, k):
    n = len(matrix)
    def count(x):
        c, j = 0, n - 1
        for row in matrix:
            while j >= 0 and row[j] > x:
                j -= 1
            c += j + 1
        return c
    lo, hi = matrix[0][0], matrix[-1][-1]
    while lo < hi:
        mid = (lo + hi) // 2
        if count(mid) >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log(max - min))", space: "O(1)",
    viz: () => {
      const M = [[1, 5, 9], [10, 11, 13], [12, 13, 15]], k = 8, frames: TableFrame[] = []; let lo = 1, hi = 15;
      while (lo < hi) { const mid = (lo + hi) >> 1, t: Record<string, Tone> = {}; let c = 0; M.forEach((r, i) => r.forEach((v, j) => { if (v <= mid) { c++; t[`${i}:${j}`] = "window"; } })); const ok = c >= k; frames.push({ note: `mid ${mid}: ${c} values ≤ ${mid} ${ok ? `≥ ${k} → answer ≤ ${mid}` : `< ${k} → answer > ${mid}`}`, cells: M, tones: t }); if (ok) hi = mid; else lo = mid + 1; }
      return table(`8th smallest: ${lo}`, nums(3), nums(3), frames);
    },
  },

  "maximum-length-of-repeated-subarray": {
    approach: "dp[i][j] = length of the common run ending at nums1[i - 1] and nums2[j - 1]; it extends the diagonal when the values match.",
    idea: ["A common subarray ending at (i, j) continues one ending at (i - 1, j - 1).", "So dp[i][j] = dp[i - 1][j - 1] + 1 if the values match, else 0.", "The answer is the largest cell."],
    code: `def findLength(nums1, nums2):
    m, n = len(nums1), len(nums2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    best = 0
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if nums1[i - 1] == nums2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                best = max(best, dp[i][j])
    return best`,
    lang: "python", time: "O(mn)", space: "O(mn)",
    viz: () => {
      const a = [1, 2, 3, 2, 1], b = [3, 2, 1, 4, 7], dp: (number | null)[][] = a.map(() => b.map(() => null)), frames: TableFrame[] = []; let best = 0;
      a.forEach((x, i) => b.forEach((y, j) => { if (x !== y) { dp[i][j] = 0; return; } const prev = i && j ? (dp[i - 1][j - 1] as number) : 0; dp[i][j] = prev + 1; best = Math.max(best, dp[i][j] as number); frames.push({ note: `${x} = ${y}: extend the diagonal ${prev} → ${dp[i][j]} (best ${best})`, cells: dp.map((r) => [...r]), active: [i, j], deps: i && j ? [[i - 1, j - 1]] : [] }); }));
      return table(`Longest common subarray: ${best}`, a.map((x, i) => `${i}:${x}`), b.map((y, j) => `${j}:${y}`), frames);
    },
  },

  "jump-game-iv": {
    approach: "BFS over indices where neighbours are i - 1, i + 1 and every index with the same value; clear each value's list after using it once.",
    idea: ["Fewest jumps on an unweighted graph is BFS.", "Same-value jumps can make the graph dense, but after one index of a value is expanded, all its twins are already queued.", "So delete the value's list after its first use; total work stays O(n)."],
    code: `from collections import defaultdict, deque
def minJumps(arr):
    n = len(arr)
    same = defaultdict(list)
    for i, v in enumerate(arr):
        same[v].append(i)
    dist = [-1] * n
    dist[0] = 0
    q = deque([0])
    while q:
        i = q.popleft()
        if i == n - 1:
            return dist[i]
        for j in same.pop(arr[i], []) + [i - 1, i + 1]:
            if 0 <= j < n and dist[j] < 0:
                dist[j] = dist[i] + 1
                q.append(j)
    return -1`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [100, -23, -23, 404, 100, 23, 23, 23, 3, 404], n = a.length, same = new Map<number, number[]>(); a.forEach((v, i) => same.set(v, [...(same.get(v) || []), i]));
      const dist = Array(n).fill(-1), q = [0], frames: CellsFrame[] = []; dist[0] = 0; const row = () => dist.map((d) => (d < 0 ? "" : d));
      while (q.length) { const i = q.shift()!; if (i === n - 1) { frames.push({ note: `Reached the last index in ${dist[i]} jumps`, rows: [a, row()], tones: { [`0:${i}`]: "found" } }); break; } const cand = [...(same.get(a[i]) || []), i - 1, i + 1]; same.delete(a[i]); const added = cand.filter((j) => j >= 0 && j < n && dist[j] < 0); added.forEach((j) => { dist[j] = dist[i] + 1; q.push(j); }); frames.push({ note: `Expand ${i} (value ${a[i]}, ${dist[i]} jumps): new indices [${added.join(", ")}]`, rows: [a, row()], tones: { [`0:${i}`]: "active", ...Object.fromEntries(added.map((j) => [`1:${j}`, "window"])) } }); }
      return cells(`minJumps = ${dist[n - 1]}`, [a, blank(n)], frames, ["arr", "jumps"]);
    },
  },

  "bitwise-and-of-numbers-range": {
    approach: "The AND of a range keeps only the common binary prefix of left and right; shift both right until they match, then shift back.",
    idea: ["Any bit below the first place where left and right differ flips somewhere in the range, so it ANDs to 0.", "Shifting both right until equal strips those bits and counts them.", "Shift the common prefix back into place."],
    code: `def rangeBitwiseAnd(left, right):
    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const bits = (x: number) => x.toString(2).padStart(5, "0").split(""); let l = 9, r = 14, shift = 0; const frames: CellsFrame[] = [];
      while (l !== r) { frames.push({ note: `${l} ≠ ${r}: drop the lowest bit (shift ${shift + 1})`, rows: [bits(l << shift), bits(r << shift)], tones: { ...range(5 - shift - 1, 4 - shift, 0, "bad"), ...range(5 - shift - 1, 4 - shift, 1, "bad"), ...(shift ? { ...range(5 - shift, 4, 0, "muted"), ...range(5 - shift, 4, 1, "muted") } : {}) } }); l >>= 1; r >>= 1; shift++; }
      frames.push({ note: `Common prefix ${l.toString(2)} shifted back by ${shift} → ${l << shift}`, rows: [bits(l << shift), bits(r << shift)], tones: { ...range(0, 4 - shift, 0, "found"), ...range(0, 4 - shift, 1, "found") } });
      return cells(`9 AND ... AND 14 = ${l << shift}`, [bits(9), bits(14)], frames, ["left", "right"]);
    },
  },

  "replace-words": {
    approach: "Put the roots in a trie; for each word walk the trie and stop at the first node that ends a root.",
    idea: ["The shortest root that prefixes a word is the first word end met while walking its letters.", "If the walk falls off the trie first, keep the word.", "Each word costs at most its length."],
    code: `def replaceWords(dictionary, sentence):
    trie = {}
    for w in dictionary:
        node = trie
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = True
    def root(word):
        node = trie
        for i, c in enumerate(word):
            if c not in node:
                return word
            node = node[c]
            if "$" in node:
                return word[:i + 1]
        return word
    return " ".join(root(w) for w in sentence.split())`,
    lang: "python", time: "O(total length)", space: "O(dictionary size)",
    viz: () => {
      const dict = ["cat", "bat", "rat"], words = ["the", "cattle", "was", "rattled", "by", "the", "battery"], nodes: TNode[] = [{ id: 0, label: "•", parent: null }], child: Record<string, number> = {}, end = new Set<number>();
      for (const w of dict) { for (let k = 1; k <= w.length; k++) { const p = w.slice(0, k); if (!(p in child)) { child[p] = nodes.length; nodes.push({ id: nodes.length, label: w[k - 1], parent: k === 1 ? 0 : child[w.slice(0, k - 1)] }); } } end.add(child[w]); }
      const badges = Object.fromEntries([...end].map((x) => [x, "end"])), frames: TreeFrame[] = [], out: string[] = [];
      for (const w of words) { const path = [0]; let res = w; for (let i = 0; i < w.length; i++) { const id = child[w.slice(0, i + 1)]; if (id == null) break; path.push(id); if (end.has(id)) { res = w.slice(0, i + 1); break; } } out.push(res); frames.push({ note: `"${w}" → "${res}"${res === w ? (path.length > 1 ? " (walk falls off before a root ends)" : " (no root starts with its first letter)") : " (hit a root end)"}`, tones: Object.fromEntries(path.map((p, k) => [p, k === path.length - 1 && res !== w ? "found" : "active"])) as Record<number, Tone>, badges }); }
      return tree(`"${out.join(" ")}"`, nodes, frames);
    },
  },

  "game-of-life": {
    approach: "Update in place with two bits per cell: bit 0 is the current state, bit 1 the next state; count neighbours using bit 0 only, then shift every cell right.",
    idea: ["All cells must change at once, so the new state cannot overwrite the old one mid-pass.", "Store the next state in bit 1; neighbours still read the old state from bit 0.", "A cell lives next round if it has 3 live neighbours, or 2 and is alive now. Finally shift each cell right by 1."],
    code: `def gameOfLife(board):
    m, n = len(board), len(board[0])
    for i in range(m):
        for j in range(n):
            live = sum(board[x][y] & 1
                       for x in range(max(0, i - 1), min(m, i + 2))
                       for y in range(max(0, j - 1), min(n, j + 2))) - (board[i][j] & 1)
            if live == 3 or (live == 2 and board[i][j] & 1):
                board[i][j] |= 2
    for row in board:
        for j in range(len(row)):
            row[j] >>= 1`,
    lang: "python", time: "O(mn)", space: "O(1)",
    viz: () => {
      const b = [[0, 1, 0], [0, 0, 1], [1, 1, 1], [0, 0, 0]], m = 4, n = 3, frames: TableFrame[] = [];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { let live = -(b[i][j] & 1); for (let x = Math.max(0, i - 1); x < Math.min(m, i + 2); x++) for (let y = Math.max(0, j - 1); y < Math.min(n, j + 2); y++) live += b[x][y] & 1; const alive = b[i][j] & 1, next = live === 3 || (live === 2 && alive) ? 1 : 0; if (next) b[i][j] |= 2; frames.push({ note: `(${i}, ${j}) ${alive ? "alive" : "dead"} with ${live} live neighbours → ${next ? "alive" : "dead"} next (stored as ${b[i][j]})`, cells: b.map((r) => [...r]), active: [i, j], tones: next ? { [`${i}:${j}`]: "found" } : alive ? { [`${i}:${j}`]: "bad" } : {} }); }
      const fin = b.map((r) => r.map((v) => v >> 1));
      frames.push({ note: "Shift every cell right by 1: bit 1 becomes the new state", cells: fin, tones: Object.fromEntries(fin.flatMap((r, i) => r.map((v, j) => [`${i}:${j}`, v ? "found" : "muted"]))) as Record<string, Tone> });
      return table("Game of Life, one step in place", nums(m), nums(n), frames);
    },
  },

  "n-ary-tree-level-order-traversal": {
    approach: "BFS one level at a time: record the values of the current level, then the next level is all of their children in order.",
    idea: ["Children lists are already ordered left to right.", "Building the next level from the current one keeps levels separate without a depth counter."],
    code: `def levelOrder(root):
    out, level = [], [root] if root else []
    while level:
        out.append([n.val for n in level])
        level = [c for n in level for c in n.children]
    return out`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const nodes: TNode[] = [{ id: 0, label: "1", parent: null }, { id: 1, label: "3", parent: 0 }, { id: 2, label: "2", parent: 0 }, { id: 3, label: "4", parent: 0 }, { id: 4, label: "5", parent: 1 }, { id: 5, label: "6", parent: 1 }];
      const frames: TreeFrame[] = [], out: string[][] = []; let level = [0];
      while (level.length) { out.push(level.map((i) => nodes[i].label)); frames.push({ note: `Level ${out.length - 1}: [${out[out.length - 1].join(", ")}]`, tones: Object.fromEntries(level.map((i) => [i, "active"])) as Record<number, Tone> }); level = level.flatMap((i) => nodes.filter((c) => c.parent === i).map((c) => c.id)); }
      return tree(`[${out.map((l) => `[${l.join(", ")}]`).join(", ")}]`, nodes, trail(frames));
    },
  },

  "smallest-subtree-with-all-the-deepest-nodes": {
    approach: "Post-order: each call returns (depth, answer). If both sides are equally deep, this node is the answer; otherwise pass up the deeper side's answer.",
    idea: ["The answer is the lowest common ancestor of all deepest leaves.", "If the left subtree is deeper, all deepest nodes are on the left, so its answer stands.", "Equal depths mean deepest nodes on both sides: the current node joins them."],
    code: `def subtreeWithAllDeepest(root):
    def go(node):              # returns (depth, answer)
        if not node:
            return 0, None
        ld, ln = go(node.left)
        rd, rn = go(node.right)
        if ld > rd: return ld + 1, ln
        if rd > ld: return rd + 1, rn
        return ld + 1, node
    return go(root)[1]`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {};
      const go = (i: number | null): [number, number | null] => { if (i == null) return [0, null]; const [ld, ln] = go(kids[i][0]), [rd, rn] = go(kids[i][1]); const res: [number, number | null] = ld > rd ? [ld + 1, ln] : rd > ld ? [rd + 1, rn] : [ld + 1, i]; badges[i] = `h${res[0]}`; frames.push({ note: `${val(i)}: left depth ${ld}, right depth ${rd} → ${ld === rd ? `equal, so ${val(i)} is the answer here` : `pass up ${val(res[1]!)} from the deeper side`}`, tones: { [i]: "active", [res[1]!]: "found" }, badges: { ...badges } }); return res; };
      const [, ans] = go(0);
      frames.push({ note: `Answer: the subtree rooted at ${val(ans!)}`, tones: { [ans!]: "found" }, badges: { ...badges } });
      return tree(`Smallest subtree with all deepest nodes: ${val(ans!)}`, nodes, frames);
    },
  },

  "count-nodes-equal-to-average-of-subtree": {
    approach: "Post-order returns (sum, count) for each subtree; compare sum // count with the node's value.",
    idea: ["A subtree's sum and size come from its children's sums and sizes plus the node itself.", "One post-order pass computes both and checks the rounded-down average."],
    code: `def averageOfSubtree(root):
    ans = 0
    def go(node):
        nonlocal ans
        if not node:
            return 0, 0
        ls, lc = go(node.left)
        rs, rc = go(node.right)
        s, c = ls + rs + node.val, lc + rc + 1
        if s // c == node.val:
            ans += 1
        return s, c
    go(root)
    return ans`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [4, 8, 5, 0, 1, null, 6], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}; let ans = 0;
      const go = (i: number | null): [number, number] => { if (i == null) return [0, 0]; const [ls, lc] = go(kids[i][0]), [rs, rc] = go(kids[i][1]), s = ls + rs + val(i), c = lc + rc + 1, ok = Math.floor(s / c) === val(i); if (ok) ans++; badges[i] = `${s}/${c}`; frames.push({ note: `${val(i)}: sum ${s}, count ${c}, average ${Math.floor(s / c)} ${ok ? `= ${val(i)} → count it (${ans})` : `≠ ${val(i)}`}`, tones: { [i]: ok ? "found" : "active" }, badges: { ...badges } }); return [s, c]; };
      go(0);
      return tree(`Nodes equal to their subtree average: ${ans}`, nodes, trail(frames));
    },
  },

  "single-number-iii": {
    approach: "XOR everything to get a ^ b; any set bit of it (take the lowest) separates a from b, so XOR each group separately.",
    idea: ["Pairs cancel, so the total XOR is a ^ b, which is nonzero.", "A set bit in a ^ b is set in exactly one of a and b.", "Split the numbers by that bit; each group's XOR leaves one of the two singles."],
    code: `def singleNumber(nums):
    x = 0
    for v in nums:
        x ^= v
    low = x & -x
    a = 0
    for v in nums:
        if v & low:
            a ^= v
    return [a, x ^ a]`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 1, 3, 2, 5], bits = (v: number) => v.toString(2).padStart(3, "0"); let x = 0; a.forEach((v) => (x ^= v)); const low = x & -x;
      const frames: CellsFrame[] = [{ note: `XOR of all = ${x} (${bits(x)}) = a ^ b`, rows: [a, a.map(bits)] }, { note: `Lowest set bit: ${bits(low)}. Numbers with it go to group 1`, rows: [a, a.map(bits)], tones: Object.fromEntries(a.map((v, i) => [`0:${i}`, v & low ? "active" : "window"])) as Record<string, Tone> }];
      let g = 0; a.forEach((v, i) => { if (v & low) { g ^= v; frames.push({ note: `Group 1 XOR ^= ${v} → ${g}`, rows: [a, a.map(bits)], tones: { [`0:${i}`]: "active" } }); } });
      frames.push({ note: `Singles: ${g} and ${x} ^ ${g} = ${x ^ g}`, rows: [a, a.map(bits)], tones: Object.fromEntries(a.map((v, i) => [`0:${i}`, v === g || v === (x ^ g) ? "found" : "muted"])) as Record<string, Tone> });
      return cells(`Two singles: [${g}, ${x ^ g}]`, [a, a.map(bits)], frames, ["nums", "binary"]);
    },
  },

  "minimize-xor": {
    approach: "x needs as many set bits as num2; spend them on num1's highest set bits first (cancelling them), then fill num1's lowest zero bits.",
    idea: ["Each bit x shares with num1 clears that bit in x ^ num1, and high bits matter most.", "If bits remain after covering num1's set bits, putting them in the lowest free positions adds the least."],
    code: `def minimizeXor(num1, num2):
    need = bin(num2).count("1")
    x = 0
    for b in range(31, -1, -1):
        if need and num1 >> b & 1:
            x |= 1 << b
            need -= 1
    for b in range(32):
        if need and not x >> b & 1:
            x |= 1 << b
            need -= 1
    return x`,
    lang: "python", time: "O(32)", space: "O(1)",
    viz: () => {
      const n1 = 1, n2 = 12, W = 5, bits = (v: number) => v.toString(2).padStart(W, "0").split(""); let need = n2.toString(2).split("").filter((c) => c === "1").length, x = 0; const frames: CellsFrame[] = [{ note: `num2 = ${n2} has ${need} set bits, so x needs ${need}`, rows: [bits(n1), bits(x)] }];
      for (let b = W - 1; b >= 0; b--) if (need && (n1 >> b) & 1) { x |= 1 << b; need--; frames.push({ note: `num1 has bit ${b}: set it in x to cancel it (${need} left)`, rows: [bits(n1), bits(x)], tones: { [`0:${W - 1 - b}`]: "active", [`1:${W - 1 - b}`]: "found" } }); }
      for (let b = 0; b < W; b++) if (need && !((x >> b) & 1)) { x |= 1 << b; need--; frames.push({ note: `Still need bits: use the lowest free bit ${b} (${need} left)`, rows: [bits(n1), bits(x)], tones: { [`1:${W - 1 - b}`]: "window" } }); }
      frames.push({ note: `x = ${x}, x XOR num1 = ${x ^ n1}`, rows: [bits(n1), bits(x)] });
      return cells(`minimizeXor(1, 12) = ${x}`, [bits(n1), bits(0)], frames, ["num1", "x"]);
    },
  },

  "my-calendar-i": {
    approach: "Keep bookings sorted by start; a new [start, end) fits if the booking before it ends by start and the booking after it starts at or after end.",
    idea: ["Bookings never overlap, so in start order their ends are also sorted.", "Binary search where the new start would go; only the two neighbours can clash.", "Insert if both checks pass."],
    code: `from bisect import bisect_right
class MyCalendar:
    def __init__(self):
        self.starts, self.ends = [], []

    def book(self, start, end):
        i = bisect_right(self.starts, start)
        if i and self.ends[i - 1] > start:
            return False
        if i < len(self.starts) and self.starts[i] < end:
            return False
        self.starts.insert(i, start)
        self.ends.insert(i, end)
        return True`,
    lang: "python", time: "O(n) per book (list insert)", space: "O(n)",
    viz: () => {
      const req: [number, number][] = [[10, 20], [15, 25], [20, 30], [5, 10], [9, 11]], booked: [number, number][] = [], frames: IntervalsFrame[] = [], keep: Record<number, Tone> = {};
      req.forEach(([s, e], k) => { const clash = booked.find(([a, b]) => a < e && s < b), ok = !clash; if (ok) { booked.push([s, e]); keep[k] = "found"; } frames.push({ note: `book(${s}, ${e}): ${ok ? "no neighbour overlaps → true" : `overlaps [${clash![0]}, ${clash![1]}) → false`}`, tones: { ...keep, [k]: ok ? "found" : "bad" }, line: s }); if (!ok) keep[k] = "muted"; });
      return { kind: "intervals", title: "MyCalendar bookings", items: req, frames };
    },
  },

  "distant-barcodes": {
    approach: "List the codes grouped by frequency, most frequent first, and fill positions 0, 2, 4, ... then 1, 3, 5, ...",
    idea: ["A valid answer exists, so the most frequent code fits in the even slots ((n + 1) / 2 of them).", "Filling evens first, then odds, keeps equal codes two apart; a group that wraps from evens to odds is not the largest, so it cannot touch itself."],
    code: `from collections import Counter
def rearrangeBarcodes(barcodes):
    n = len(barcodes)
    order = [v for v, c in Counter(barcodes).most_common() for _ in range(c)]
    out = [0] * n
    half = (n + 1) // 2
    out[::2], out[1::2] = order[:half], order[half:]
    return out`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const bc = [1, 1, 1, 1, 2, 2, 3, 3], n = bc.length, cnt = new Map<number, number>(); bc.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
      const order = [...cnt].sort((a, b) => b[1] - a[1]).flatMap(([v, c]) => Array(c).fill(v)), out = blank(n), frames: CellsFrame[] = [{ note: `Most frequent first: [${order.join(", ")}]`, rows: [order, [...out]] }];
      order.forEach((v, k) => { const pos = k < Math.ceil(n / 2) ? 2 * k : 2 * (k - Math.ceil(n / 2)) + 1; out[pos] = v; frames.push({ note: `Put ${v} at ${pos} (${pos % 2 ? "odd" : "even"} slots)`, rows: [order, [...out]], tones: { [`0:${k}`]: "active", [`1:${pos}`]: "found" } }); });
      return cells(`[${out.join(", ")}]`, [order, blank(n)], frames, ["order", "result"]);
    },
  },

  "remove-duplicate-letters": {
    approach: "Monotonic stack: before pushing a letter, pop larger letters from the top if they appear again later; skip letters already in the stack.",
    idea: ["Each letter must appear once, and the result should be smallest in dictionary order.", "If the top letter is larger than the current one and comes again later, removing it now and using it later is better.", "Letters already placed are skipped; their spot is already the best one."],
    code: `def removeDuplicateLetters(s):
    last = {c: i for i, c in enumerate(s)}
    st, used = [], set()
    for i, c in enumerate(s):
        if c in used:
            continue
        while st and c < st[-1] and last[st[-1]] > i:
            used.discard(st.pop())
        st.append(c)
        used.add(c)
    return "".join(st)`,
    lang: "python", time: "O(n)", space: "O(26)",
    viz: () => {
      const s = "cbacdcbc", last: Record<string, number> = {}; [...s].forEach((c, i) => (last[c] = i)); const st: string[] = [], frames: StackFrame[] = [];
      [...s].forEach((c, i) => { if (st.includes(c)) { frames.push({ note: `'${c}' is already in the stack, skip`, items: [...st] }); return; } const popped: string[] = []; while (st.length && c < st[st.length - 1] && last[st[st.length - 1]] > i) popped.push(st.pop()!); st.push(c); frames.push({ note: popped.length ? `'${c}': pop ${popped.map((p) => `'${p}'`).join(", ")} (larger, and comes again later), push '${c}'` : `push '${c}'`, items: [...st], incoming: c, popped }); });
      return { kind: "stack", title: `"${s}" → "${st.join("")}"`, input: s.split(""), frames };
    },
  },

  "satisfiability-of-equality-equations": {
    approach: "Union the two sides of every == equation, then check that no != equation has both sides in the same group.",
    idea: ["Equality is transitive, so == equations join letters into groups.", "Process all == first so the groups are complete.", "A != between two letters in one group is a contradiction."],
    code: `def equationsPossible(equations):
    parent = list(range(26))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for e in equations:
        if e[1] == "=":
            parent[find(ord(e[0]) - 97)] = find(ord(e[3]) - 97)
    return all(find(ord(e[0]) - 97) != find(ord(e[3]) - 97)
               for e in equations if e[1] == "!")`,
    lang: "python", time: "O(n α(26))", space: "O(26)",
    viz: () => {
      const eqs = ["a==b", "b==c", "d==e", "a!=d", "a!=c"], L = ["a", "b", "c", "d", "e"], nodes = [{ id: 0, label: "a", x: 10, y: 30 }, { id: 1, label: "b", x: 35, y: 10 }, { id: 2, label: "c", x: 35, y: 60 }, { id: 3, label: "d", x: 75, y: 30 }, { id: 4, label: "e", x: 90, y: 80 }];
      const parent = [0, 1, 2, 3, 4], find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), frames: GraphFrame[] = [], et: Record<string, Tone> = {}; let ok = true;
      for (const e of eqs.filter((q) => q[1] === "=")) { const u = L.indexOf(e[0]), v = L.indexOf(e[3]); parent[find(u)] = find(v); et[ek(u, v)] = "found"; frames.push({ note: `${e}: join ${e[0]} and ${e[3]}`, tones: { [u]: "active", [v]: "active" }, edgeTones: { ...et } }); }
      for (const e of eqs.filter((q) => q[1] === "!")) { const u = L.indexOf(e[0]), v = L.indexOf(e[3]), same = find(u) === find(v); if (same) ok = false; frames.push({ note: `${e}: ${same ? "same group → contradiction" : "different groups, fine"}`, tones: { [u]: same ? "bad" : "window", [v]: same ? "bad" : "window" }, edgeTones: { ...et, [ek(u, v)]: same ? "bad" : "muted" } }); if (same) break; }
      return { kind: "graph", title: `[${eqs.join(", ")}] → ${ok}`, nodes, edges: [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 3, b: 4 }, { a: 0, b: 3 }, { a: 0, b: 2 }], frames };
    },
  },

  "minimum-operations-to-make-a-uni-value-grid": {
    approach: "All values must share the same remainder mod x; then move everything to the median, costing |v - median| / x each.",
    idea: ["Adding or subtracting x never changes v mod x, so different remainders make it impossible.", "The sum of distances to a target is smallest at the median.", "Divide each distance by x to count operations."],
    code: `def minOperations(grid, x):
    vals = sorted(v for row in grid for v in row)
    if any((v - vals[0]) % x for v in vals):
        return -1
    mid = vals[len(vals) // 2]
    return sum(abs(v - mid) // x for v in vals)`,
    lang: "python", time: "O(mn log mn)", space: "O(mn)",
    viz: () => {
      const v = [1, 5, 2, 3].sort((a, b) => a - b), x = 1, mid = v[v.length >> 1], ops = blank(v.length), frames: CellsFrame[] = [{ note: `All values have the same remainder mod ${x}; median = ${mid}`, rows: [v, [...ops]], tones: { [`0:${v.length >> 1}`]: "found" } }]; let total = 0;
      v.forEach((y, i) => { const o = Math.abs(y - mid) / x; total += o; ops[i] = o; frames.push({ note: `${y} → ${mid}: ${o} operations (total ${total})`, rows: [v, [...ops]], tones: { [`1:${i}`]: "active", [`0:${v.length >> 1}`]: "found" } }); });
      return cells(`[[1, 5], [2, 3]], x = 1 → ${total}`, [v, blank(v.length)], frames, ["sorted", "ops"]);
    },
  },

  "equal-sum-arrays-with-minimum-number-of-operations": {
    approach: "Make nums1 the smaller-sum array; each operation can raise a nums1 value to 6 or drop a nums2 value to 1. Use the biggest gains first until the gap closes.",
    idea: ["Raising x in the smaller array gains up to 6 - x; lowering y in the larger array gains up to y - 1.", "Greedy: take the largest possible gains first.", "If all gains together cannot close the gap, return -1."],
    code: `def minOperations(nums1, nums2):
    s1, s2 = sum(nums1), sum(nums2)
    if s1 > s2:
        nums1, nums2, s1, s2 = nums2, nums1, s2, s1
    diff = s2 - s1
    if diff == 0:
        return 0
    gains = sorted([6 - x for x in nums1] + [x - 1 for x in nums2], reverse=True)
    for ops, g in enumerate(gains, 1):
        diff -= g
        if diff <= 0:
            return ops
    return -1`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [1, 1, 2, 2, 2, 2], b = [1, 2, 3, 4, 5, 6], gains = [...a.map((x) => 6 - x), ...b.map((y) => y - 1)].sort((p, q) => q - p); let diff = b.reduce((s, y) => s + y, 0) - a.reduce((s, y) => s + y, 0), ops = 0; const frames: CellsFrame[] = [{ note: `Gap ${diff}. Possible gains sorted: [${gains.join(", ")}]`, rows: [gains] }];
      for (const g of gains) { ops++; diff -= g; frames.push({ note: `Use gain ${g}: gap ${Math.max(diff, 0)} (${ops} operations)`, rows: [gains], tones: range(0, ops - 1, 0, diff <= 0 ? "found" : "window") }); if (diff <= 0) break; }
      return cells(`Operations: ${ops}`, [gains], frames, ["gain"]);
    },
  },

  "best-time-to-buy-and-sell-stock-iii": {
    approach: "Track four states through the days: best cash after the first buy, first sell, second buy and second sell; each builds on the previous one.",
    idea: ["buy1 = max(buy1, -p): cheapest first purchase.", "sell1 = max(sell1, buy1 + p); buy2 = max(buy2, sell1 - p) reinvests the first profit.", "sell2 = max(sell2, buy2 + p) is the answer; same-day buy and sell adds nothing, so updating in place is safe."],
    code: `def maxProfit(prices):
    buy1 = buy2 = float("-inf")
    sell1 = sell2 = 0
    for p in prices:
        buy1 = max(buy1, -p)
        sell1 = max(sell1, buy1 + p)
        buy2 = max(buy2, sell1 - p)
        sell2 = max(sell2, buy2 + p)
    return sell2`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const p = [3, 3, 5, 0, 0, 3, 1, 4], n = p.length, R = [blank(n), blank(n), blank(n), blank(n)], frames: CellsFrame[] = []; let b1 = -Infinity, s1 = 0, b2 = -Infinity, s2 = 0;
      p.forEach((x, i) => { b1 = Math.max(b1, -x); s1 = Math.max(s1, b1 + x); b2 = Math.max(b2, s1 - x); s2 = Math.max(s2, b2 + x); [b1, s1, b2, s2].forEach((v, r) => (R[r][i] = v)); frames.push({ note: `Day ${i} price ${x}: buy1 ${b1}, sell1 ${s1}, buy2 ${b2}, sell2 ${s2}`, rows: [p, ...R.map((r) => [...r])], tones: { [`0:${i}`]: "active", [`4:${i}`]: "found" } }); });
      return cells(`Two transactions: profit ${s2}`, [p, blank(n), blank(n), blank(n), blank(n)], frames, ["price", "buy1", "sell1", "buy2", "sell2"]);
    },
  },

  "maximize-happiness-of-selected-children": {
    approach: "Pick the k happiest children, largest first; the ith pick has lost i points (never below 0).",
    idea: ["Every unpicked child loses 1 per turn, so the order of picks only matters through that decay.", "Taking the largest first wastes the least; the ith pick contributes max(h - i, 0)."],
    code: `def maximumHappinessSum(happiness, k):
    happiness.sort(reverse=True)
    return sum(max(h - i, 0) for i, h in enumerate(happiness[:k]))`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const h = [2, 3, 4, 5, 1].sort((a, b) => b - a), k = 3, got = blank(h.length), frames: CellsFrame[] = []; let total = 0;
      for (let i = 0; i < k; i++) { const v = Math.max(h[i] - i, 0); total += v; got[i] = v; frames.push({ note: `Pick ${i + 1}: ${h[i]} has lost ${i} → ${v} (total ${total})`, rows: [h, [...got]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found", ...range(i + 1, h.length - 1, 0, "muted") } }); }
      return cells(`k = 3 → ${total}`, [h, blank(h.length)], frames, ["sorted", "gained"]);
    },
  },
};
