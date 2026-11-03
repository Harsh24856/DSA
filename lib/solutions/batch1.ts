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
      const arr = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5], target = 8, keys = [...new Set(arr)].sort((a, b) => a - b), cnt = keys.map((v) => arr.filter((x) => x === v).length), at = (v: number) => keys.indexOf(v);
      const frames: CellsFrame[] = [{ note: `Goal: count index triples i < j < k in [${arr.join(", ")}] that sum to ${target}. Only distinct values matter: ${keys.map((k, i) => `${k}×${cnt[i]}`).join(", ")}` }]; let ans = 0;
      keys.forEach((x, i) => keys.slice(i).forEach((y) => {
        const z = target - x - y; if (z < y) return;
        const mark = (...v: number[]): Record<string, Tone> => Object.fromEntries(v.flatMap((u) => [[`0:${at(u)}`, "active"], [`1:${at(u)}`, "window"]]));
        if (!keys.includes(z)) { frames.push({ note: `x = ${x}, y = ${y}: z would be ${z}, which is not in the array, so no triple`, tones: mark(x, y) }); return; }
        const [cx, cy, cz] = [cnt[at(x)], cnt[at(y)], cnt[at(z)]];
        const [ways, how] = x === y && y === z ? [(cx * (cx - 1) * (cx - 2)) / 6, `C(${cx}, 3)`] : x === y ? [((cx * (cx - 1)) / 2) * cz, `C(${cx}, 2) × ${cz}`] : y === z ? [(cx * cy * (cy - 1)) / 2, `${cx} × C(${cy}, 2)`] : [cx * cy * cz, `${cx} × ${cy} × ${cz}`];
        ans += ways;
        frames.push({ note: `${x} + ${y} + ${z} = ${target}: ${how} = ${ways} ways, total ${ans}`, tones: mark(x, y, z) });
      }));
      frames.push({ note: `No more value pairs left, so the answer is ${ans} (mod 10^9 + 7)`, tones: Object.fromEntries(keys.map((_, i) => [`1:${i}`, "found"])) });
      return cells(`threeSumMulti([${arr.join(",")}], ${target}) = ${ans}`, [keys, cnt], frames, ["value", "count"]);
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
      const score = [[10, 6, 9, 1], [7, 5, 11, 2], [4, 8, 3, 15], [12, 2, 14, 6], [9, 13, 1, 8]], k = 2, place: (number | null)[] = score.map(() => null);
      const grid = () => score.map((r, i) => [...r, place[i]]);
      const tones = (): Record<string, Tone> => Object.fromEntries(score.flatMap((_, i): [string, Tone][] => place[i] === null ? [[`${i}:${k}`, "window"]] : [[`${i}:${k}`, "found"], [`${i}:${score[0].length}`, "found"]])) as Record<string, Tone>;
      const frames: TableFrame[] = [{ note: `Goal: order the students by exam ${k} score, highest first. Exam ${k} scores are ${score.map((r) => r[k]).join(", ")}; the last column will hold each place`, cells: grid(), tones: tones() }];
      for (let p = 1; p <= score.length; p++) {
        const rest = score.map((_, i) => i).filter((i) => place[i] === null), r = rest.reduce((b, i) => (score[i][k] > score[b][k] ? i : b));
        place[r] = p; const others = rest.filter((i) => i !== r).map((i) => score[i][k]);
        frames.push({ note: `Place ${p}: ${score[r][k]} is the highest exam ${k} score ${others.length ? `among the rest (${others.join(", ")})` : "left, the only one remaining"}, so student ${r} goes ${p === 1 ? "first" : `in position ${p}`}`, cells: grid(), active: [r, k], tones: tones() });
      }
      const order = score.map((_, i) => i).sort((a, b) => place[a]! - place[b]!);
      frames.push({ note: `Every student has a place, so the sorted rows are students ${order.join(", ")} in that order`, cells: grid(), tones: tones() });
      return table(`Sort students by exam ${k}: ${order.join(", ")}`, score.map((_, i) => `student ${i}`), ["exam 0", "exam 1", "exam 2", "exam 3", "place"], frames);
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
      const n1 = [1, 2, 4], n2 = [1, 3, 6], k = 6, grid = n1.map((x) => n2.map((y) => x + y)), heap: [number, number, number][] = n1.slice(0, k).map((x, i) => [x + n2[0], i, 0]), taken: string[] = [], out: number[][] = [];
      const view = (): Record<string, Tone> => ({ ...Object.fromEntries(heap.map(([, i, j]) => [`${i}:${j}`, "window"])), ...Object.fromEntries(taken.map((t) => [t, "found"])) });
      const frames: TableFrame[] = [{ note: `Goal: the ${k} pairs (one from each list) with the smallest sums. The heap starts with the first column: ${heap.map(([s]) => s).join(", ")}`, cells: grid, tones: view() }];
      while (heap.length && out.length < k) {
        heap.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); const [s, i, j] = heap.shift()!; out.push([n1[i], n2[j]]); taken.push(`${i}:${j}`);
        if (j + 1 < n2.length) heap.push([n1[i] + n2[j + 1], i, j + 1]);
        frames.push({ note: `Pop the smallest, ${s} = ${n1[i]} + ${n2[j]}, as pair ${out.length}${j + 1 < n2.length ? `; push its right neighbour ${n1[i] + n2[j + 1]}` : "; it has no right neighbour"}. Heap holds ${heap.map(([h]) => h).sort((a, b) => a - b).join(", ") || "nothing"}`, cells: grid, active: [i, j], tones: view() });
      }
      frames.push({ note: `${k} pairs taken, so stop: ${out.map((p) => `[${p.join(", ")}]`).join(", ")}`, cells: grid, tones: view() });
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
      const A = [2, 4, 3, 6, 1], B = [1, 6, 7, 2, 5], pairs = A.map((a, i) => [a, B[i], a + B[i]]), ord = [...pairs].sort((x, y) => y[2] - x[2]), rows = [ord.map((p) => p[0]), ord.map((p) => p[1]), ord.map((p) => p[2])];
      const frames: CellsFrame[] = [{ note: `Goal: Alice moves first and both take the stone they like best; compare totals. Stone values to Alice [${A.join(", ")}] and to Bob [${B.join(", ")}]`, rows: [A, B, pairs.map((p) => p[2])] },
        { note: `Taking a stone is worth its Alice value plus its Bob value (it also denies the other player), so sort by that sum, largest first: ${rows[2].join(", ")}`, rows, tones: range(0, ord.length - 1, 2) }]; let alice = 0, bob = 0;
      ord.forEach(([a, b], t) => { if (t % 2 === 0) alice += a; else bob += b; frames.push({ note: `Turn ${t + 1}: ${t % 2 === 0 ? `Alice takes the stone worth ${a} to her (sum ${a + b})` : `Bob takes the stone worth ${b} to him (sum ${a + b})`}. Alice ${alice}, Bob ${bob}`, rows, tones: { [`${t % 2}:${t}`]: "active", [`2:${t}`]: "active" } }); });
      const res = Math.sign(alice - bob);
      frames.push({ note: `Alice ${alice} against Bob ${bob}: ${res > 0 ? "Alice wins, return 1" : res < 0 ? "Bob wins, return -1" : "a draw, return 0"}`, rows, tones: range(0, ord.length - 1, 2, "found") });
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
      const vals: V = [5, 3, 8, 1, 9, 2, 7, 4, 6, 10, 15, 11, 14, 12, 13], { nodes } = T(vals), labels: Record<number, string> = Object.fromEntries(vals.map((v, i) => [i, String(v)]));
      const frames: TreeFrame[] = [{ note: "Goal: reverse the values on every odd level. Level 0 is even, so the root 5 stays", tones: { 0: "done" }, labels: { ...labels } }];
      for (let d = 1, start = 1; d < 4; d++, start = 2 * start + 1) {
        const ids = Array.from({ length: 2 ** d }, (_, k) => start + k), lvl = Object.fromEntries(ids.map((i) => [i, "window"])) as Record<number, Tone>;
        if (d % 2 === 0) { frames.push({ note: `Level ${d} is even: leave ${ids.map((i) => labels[i]).join(", ")} where they are`, tones: lvl, labels: { ...labels } }); continue; }
        for (let k = 0; k < ids.length / 2; k++) {
          const [a, b] = [ids[k], ids[ids.length - 1 - k]], [x, y] = [labels[a], labels[b]]; labels[a] = y; labels[b] = x;
          frames.push({ note: `Level ${d} is odd: swap the ${k === 0 ? "outermost" : "next pair in"} values ${x} and ${y}${ids.length === 2 ? ", the whole level reversed" : ""}`, tones: { ...lvl, [a]: "active", [b]: "active" }, labels: { ...labels } });
        }
      }
      frames.push({ note: `Levels 1 and 3 are reversed and levels 0 and 2 untouched, so the tree reads ${vals.map((_, i) => labels[i]).join(", ")}`, tones: Object.fromEntries(vals.map((_, i) => [i, "found"])) as Record<number, Tone>, labels: { ...labels } });
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
      const arr = [3, 1, 2, 3, 3, 3, 3, 2, 0], start = 5, seen = new Set<number>(), stack = [start], frames: CellsFrame[] = [{ note: `Goal: from index ${start} jump left or right by arr[i] and reach any index holding 0. DFS stack starts as [${start}]`, tones: { [`0:${start}`]: "window" }, marks: [{ i: start, label: "start" }] }]; let ok = false;
      while (stack.length) {
        const i = stack.pop()!, done = Object.fromEntries([...seen].map((s) => [`0:${s}`, "done"])) as Record<string, Tone>;
        if (arr[i] === 0) { ok = true; frames.push({ note: `Pop ${i}: arr[${i}] is 0, so a zero is reachable`, tones: { ...done, [`0:${i}`]: "found" }, marks: [{ i, label: "i" }] }); break; }
        const again = seen.has(i); seen.add(i); const to = [i + arr[i], i - arr[i]], nx = to.filter((j) => j >= 0 && j < arr.length && !seen.has(j)); stack.push(...nx);
        frames.push({ note: `Pop ${i} (value ${arr[i]})${again ? ", already visited" : ""}: jumps reach ${to[0]} and ${to[1]}, ${nx.length ? `push ${nx.join(" and ")}` : "none are new and in range"}; stack is [${stack.join(", ")}]`, tones: { ...done, [`0:${i}`]: "active", ...Object.fromEntries(nx.map((j) => [`0:${j}`, "window"])) }, marks: [{ i, label: "i" }] });
      }
      return cells(`canReach(start = ${start}): ${ok}`, [arr], frames);
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
      const a = [1, 3, 5, 2, 4, 6, 8, 7], n = a.length, t = Array(n + 1).fill(0), zeros = Array(n).fill(0);
      const add = (i: number, d: number) => { for (; i <= n; i += i & -i) t[i] += d; };
      a.forEach((v, i) => add(i + 1, v));
      const rows = () => [a.slice(), t.slice(1)], frames: CellsFrame[] = [{ note: `Goal: update(2, 10), then sumRange(2, 6) on [${a.join(", ")}] using a Fenwick tree`, rows: [a.slice(), zeros] },
        { note: `Built: tree[i] holds the sum of the last (i & -i) values ending at position i, so tree[4] = ${t[4]} covers positions 1 to 4 and tree[8] = ${t[8]} covers all eight`, rows: rows() }];
      const d = 10 - a[2], upd: number[] = []; a[2] = 10;
      for (let i = 3; i <= n; i += i & -i) { t[i] += d; upd.push(i); frames.push({ note: `update(2, 10) adds ${d}: tree[${i}] becomes ${t[i]}, then i = ${i} + ${i & -i} = ${i + (i & -i)}${i + (i & -i) > n ? ", past the end, stop" : ""}`, rows: rows(), tones: { "0:2": "active", ...Object.fromEntries(upd.map((u) => [`1:${u - 1}`, u === i ? "active" : "found"])) } as Record<string, Tone> }); }
      const pre = (q: number, name: string) => { const used: number[] = []; let s = 0; for (let i = q; i; i -= i & -i) { s += t[i]; used.push(i); frames.push({ note: `${name}: add tree[${i}] = ${t[i]}, running total ${s}; then i = ${i} - ${i & -i} = ${i - (i & -i)}${i - (i & -i) ? "" : ", zero, stop"}`, rows: rows(), tones: Object.fromEntries(used.map((u) => [`1:${u - 1}`, u === i ? "active" : "window"])) as Record<string, Tone> }); } return s; };
      const r = pre(7, "prefix(7)"), l = pre(2, "prefix(2)");
      frames.push({ note: `sumRange(2, 6) = prefix(7) - prefix(2) = ${r} - ${l} = ${r - l}`, rows: rows(), tones: range(2, 6, 0, "found") });
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
      const items: [number, number][] = [[3, 4], [2, 3], [1, 2], [4, 6], [5, 5], [7, 9]], starts = items.map(([s], i) => [s, i]).sort((a, b) => a[0] - b[0]), out: number[] = [];
      const frames: IntervalsFrame[] = [{ note: `Goal: for each interval, find the one whose start is the smallest value at or after its end. Sorted starts: ${starts.map(([s, i]) => `${s} (#${i})`).join(", ")}` }];
      items.forEach(([, e], i) => {
        let lo = 0, hi = starts.length; const probes: string[] = [];
        while (lo < hi) { const mid = (lo + hi) >> 1; probes.push(`${starts[mid][0]}`); if (starts[mid][0] < e) lo = mid + 1; else hi = mid; }
        const hit = lo < starts.length ? starts[lo] : null; out.push(hit ? hit[1] : -1);
        frames.push({ note: `#${i} ends at ${e}: binary search probes starts ${probes.join(", ")} and lands on ${hit ? `start ${hit[0]} (#${hit[1]})${hit[1] === i ? ", its own start" : ""}` : `the end of the list, nothing starts at ${e} or later`}, so answer ${out[i]}`, line: e, tones: { [i]: "active", ...(hit ? { [hit[1]]: "found" } : {}) } });
      });
      frames.push({ note: `All ${items.length} intervals answered: [${out.join(", ")}]`, tones: Object.fromEntries(items.map((_, i) => [i, "found"])) as Record<number, Tone> });
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
      const a = [9, 3, 14, 6, 20], ops = 6, frames: CellsFrame[] = [{ note: `Goal: split bags with at most ${ops} operations so the biggest bag is as small as possible. Binary search the bag limit between 1 and ${Math.max(...a)}`, rows: [a, blank(a.length)] }]; let lo = 1, hi = Math.max(...a);
      while (lo < hi) { const mid = (lo + hi) >> 1, need = a.map((x) => Math.floor((x - 1) / mid)), tot = need.reduce((s, x) => s + x, 0), ok = tot <= ops; frames.push({ note: `Limit ${mid} (range ${lo}..${hi}): splits needed ${need.join(" + ")} = ${tot} ${ok ? `≤ ${ops}, so it works; try smaller (keep ${lo}..${mid})` : `> ${ops}, too many; the limit must be larger (keep ${mid + 1}..${hi})`}`, rows: [a, need], tones: Object.fromEntries(need.map((x, i) => [`1:${i}`, ok ? "found" : x ? "bad" : "muted"])) as Record<string, Tone> }); if (ok) hi = mid; else lo = mid + 1; }
      frames.push({ note: `The range has closed on ${lo}, so ${lo} is the smallest possible largest bag`, rows: [a, a.map((x) => Math.floor((x - 1) / lo))], tones: Object.fromEntries(a.map((_, i) => [`1:${i}`, "found"])) });
      return cells(`Smallest penalty with ${ops} operations: ${lo}`, [a, blank(a.length)], frames, ["bag", "splits"]);
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
      const W = 15, row = (s: string) => [...s].concat(Array(W - s.length).fill(null)), full = S.map(row), part = (m: number) => S.map((s, i) => (i < m ? row(s) : Array(W).fill(null))), frames: TableFrame[] = [{ note: "Goal: find the 11th bit of S4. S1 is 0 and each next string is the previous one, a 1, then the previous reversed with every bit flipped", cells: part(1) }];
      for (let i = 1; i < 4; i++) frames.push({ note: `Build S${i + 1}: S${i} = ${S[i - 1]}, then 1, then its reverse inverted gives ${S[i]}`, cells: part(i + 1), active: [i, S[i - 1].length] });
      let n = 4, k = 11, flip = 0, ans = "";
      while (true) {
        const mid = 1 << (n - 1);
        if (n === 1) { ans = String(flip); frames.push({ note: `S1 has a single bit, 0; flipped ${flip} time${flip === 1 ? "" : "s"} in total that makes ${ans}`, cells: full, active: [0, 0] }); break; }
        if (k === mid) { ans = String(1 ^ flip); frames.push({ note: `S${n}: k = ${k} is the middle, which is always 1; flipped ${flip} time${flip === 1 ? "" : "s"} that makes ${ans}`, cells: full, active: [n - 1, k - 1] }); break; }
        if (k > mid) { const nk = 2 * mid - k; frames.push({ note: `S${n}: k = ${k} is right of the middle ${mid}, so it mirrors position ${nk} of S${n - 1} with the bit flipped`, cells: full, active: [n - 1, k - 1], deps: [[n - 2, nk - 1]] }); k = nk; flip ^= 1; }
        else frames.push({ note: `S${n}: k = ${k} is left of the middle ${mid}, so it equals position ${k} of S${n - 1}`, cells: full, active: [n - 1, k - 1], deps: [[n - 2, k - 1]] });
        n--;
      }
      return table(`findKthBit(4, 11) = "${ans}"`, ["S1", "S2", "S3", "S4"], Array.from({ length: W }, (_, i) => String(i + 1)), frames);
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
      const a = [7, 4, 3, 9, 1, 8, 5, 2, 6, 10], k = 2, w = 2 * k + 1, out: number[] = a.map(() => -1), frames: CellsFrame[] = [{ note: `Goal: avg[i] is the mean of the ${w} values centred on i (k = ${k}), or -1 when the window would leave the array`, rows: [a, [...out]] }]; let s = 0;
      a.forEach((x, i) => {
        s += x; if (i >= w) s -= a[i - w];
        if (i >= w - 1) { out[i - k] = Math.floor(s / w); frames.push({ note: i === w - 1 ? `First full window [0..${i}] sums to ${s}: avg ${s} // ${w} = ${out[i - k]} at centre ${i - k}` : `Slide: add ${x}, drop ${a[i - w]}; sum ${s}, avg ${s} // ${w} = ${out[i - k]} at centre ${i - k}`, rows: [a, [...out]], tones: { ...range(i - w + 1, i), [`1:${i - k}`]: "found", [`0:${i - k}`]: "active" } }); }
      });
      frames.push({ note: `Centres 0..${k - 1} and ${a.length - k}..${a.length - 1} cannot fit a window and stay -1: [${out.join(", ")}]`, rows: [a, [...out]], tones: Object.fromEntries(out.map((v, i) => [`1:${i}`, v === -1 ? "muted" : "found"])) as Record<string, Tone> });
      return cells(`k = ${k} averages: [${out.join(", ")}]`, [a, a.map(() => -1)], frames, ["nums", "avg"]);
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
      const s = "daabcbaabcbc", part = "abc", m = part.length, st: string[] = [], frames: StackFrame[] = [{ note: `Goal: keep removing "${part}" from "${s}" by pushing letters on a stack and popping whenever the top ${m} spell "${part}"`, items: [] }];
      [...s].forEach((c, idx) => {
        st.push(c); const top = st.slice(-m).join("");
        if (st.length >= m && top === part) { const gone = st.splice(-m); frames.push({ note: `Read '${c}' (${idx + 1} of ${s.length}): the top ${m} spell "${part}", so pop them and the stack is "${st.join("")}"`, items: [...st], incoming: c, popped: gone }); }
        else frames.push({ note: `Read '${c}' (${idx + 1} of ${s.length}): stack is "${st.join("")}"${st.length >= m ? `, its top ${m} are "${top}", not "${part}"` : `, shorter than ${m}, nothing to compare`}`, items: [...st], incoming: c });
      });
      frames.push({ note: `The string is used up and the stack holds "${st.join("")}", the answer`, items: [...st] });
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
      const items: [number, number][] = [[1, 5], [1, 10], [2, 3], [5, 10], [6, 8], [7, 9], [9, 12]], ends: number[] = [], group: Record<number, Tone> = {};
      const frames: IntervalsFrame[] = [{ note: `Goal: split ${items.length} intervals into the fewest groups where no two in a group overlap. Go in order of start and keep each group's end time in a min-heap` }];
      items.forEach(([l, r], i) => {
        ends.sort((a, b) => a - b);
        if (ends.length && ends[0] < l) { const e = ends.shift()!; ends.push(r); group[i] = "found"; frames.push({ note: `[${l}, ${r}]: the earliest group ends at ${e}, before ${l}, so join it and its end becomes ${r}. Ends: ${[...ends].sort((a, b) => a - b).join(", ")}`, tones: { ...group, [i]: "active" }, line: l }); }
        else { frames.push({ note: ends.length ? `[${l}, ${r}]: the earliest group ends at ${ends[0]}, not before ${l}, so open group ${ends.length + 1} ending at ${r}. Ends: ${[...ends, r].sort((a, b) => a - b).join(", ")}` : `[${l}, ${r}]: no groups yet, so open the first one ending at ${r}`, tones: { ...group, [i]: "active" }, line: l }); ends.push(r); group[i] = "window"; }
      });
      frames.push({ note: `All intervals placed and the heap holds ${ends.length} ends, so ${ends.length} groups are needed`, tones: Object.fromEntries(items.map((_, i) => [i, "found"])) as Record<number, Tone> });
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
      const st = [0, 2, 5, 6, 7, 10, 11, 16], frames: CellsFrame[] = [{ note: `Goal: a frog goes to the last stone and back, using each stone once; minimise its longest jump. Stones at ${st.join(", ")}`, tones: {} }]; let best = st[1] - st[0];
      frames.push({ note: `Start with the first gap ${st[0]} → ${st[1]} = ${best} as the longest jump`, tones: range(0, 1, 0, "window") });
      for (let i = 2; i < st.length; i++) { const g = st[i] - st[i - 2], up = g > best; best = Math.max(best, g); frames.push({ note: `Jump ${st[i - 2]} → ${st[i]} skips stone ${st[i - 1]} and covers ${g}; ${up ? `that beats the old longest, so it is now ${best}` : `longest stays ${best}`}`, tones: { [`0:${i - 2}`]: "active", [`0:${i}`]: "active", [`0:${i - 1}`]: "muted" } }); }
      frames.push({ note: `Every stone checked: the frog's longest jump can be kept down to ${best}`, tones: range(0, st.length - 1, 0, "found") });
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
      const a = [8, 3, 12, 6, 20, 9, 2, 15], x = 2, seen: number[] = [], pad = () => [...seen, ...Array<string>(a.length - seen.length).fill("")];
      const frames: CellsFrame[] = [{ note: `Goal: smallest |nums[i] - nums[j]| with i and j at least ${x} apart. Walk i from ${x}, add nums[i - ${x}] to a sorted "seen" list, then look up the nearest value to nums[i]`, rows: [a, pad()] }]; let best: number | null = null;
      for (let i = x; i < a.length; i++) {
        const ins = a[i - x]; seen.push(ins); seen.sort((p, q) => p - q);
        let j = 0; while (j < seen.length && seen[j] < a[i]) j++;
        const succ = j < seen.length ? seen[j] : null, pred = j ? seen[j - 1] : null, gaps = [succ === null ? null : succ - a[i], pred === null ? null : a[i] - pred].filter((v): v is number => v !== null), local = Math.min(...gaps);
        best = best === null ? local : Math.min(best, local);
        frames.push({ note: `i = ${i}: add nums[${i - x}] = ${ins}, so seen is [${seen.join(", ")}]; ${a[i]} slots in at position ${j}, successor ${succ ?? "none"}, predecessor ${pred ?? "none"}, gap ${local}; best so far ${best}`, rows: [a, pad()], tones: { ...range(0, i - x), [`0:${i}`]: "active", ...(succ !== null ? { [`1:${j}`]: "found" } : {}), ...(pred !== null ? { [`1:${j - 1}`]: "found" } : {}) }, marks: [{ i, label: "i" }] });
      }
      frames.push({ note: `Every i has been checked; the smallest difference is ${best}`, rows: [a, pad()], tones: range(0, a.length - 1, 0, "found") });
      return cells(`x = ${x}: smallest difference ${best}`, [a, a.map(() => "")], frames, ["nums", "seen"]);
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
      const h = 8, w = 7, hc = [3, 1, 6], vc = [2, 5, 1], H = [0, ...[...hc].sort((a, b) => a - b), h], W = [0, ...[...vc].sort((a, b) => a - b), w], gh = H.slice(1).map((v, i) => v - H[i]), gw = W.slice(1).map((v, i) => v - W[i]);
      const grid = gh.map((a) => gw.map((b) => a * b)), cut = (v: number[], cur: number, best: number, row: boolean): Record<string, Tone> => Object.fromEntries(gh.flatMap((a, i) => gw.map((b, j) => { const k = row ? i : j; return [`${i}:${j}`, k === cur ? "active" : v[k] === best ? "window" : "muted"]; }))) as Record<string, Tone>;
      const frames: TableFrame[] = [{ note: `Goal: biggest piece of a ${h} by ${w} cake cut at rows ${hc.join(", ")} and columns ${vc.join(", ")}. Sorted, the horizontal strips are ${gh.join(", ")} tall and the vertical strips ${gw.join(", ")} wide; each cell is a piece's area`, cells: grid }];
      let bh = 0, bw = 0, bi = 0, bj = 0;
      gh.forEach((g, i) => { if (g > bh) { bh = g; bi = i; } frames.push({ note: `Horizontal strip ${i + 1} runs from ${H[i]} to ${H[i + 1]}, ${g} tall; ${g === bh && bi === i ? `new tallest, ${bh}` : `tallest stays ${bh}`}`, cells: grid, tones: cut(gh, i, bh, true) }); });
      gw.forEach((g, j) => { if (g > bw) { bw = g; bj = j; } frames.push({ note: `Vertical strip ${j + 1} runs from ${W[j]} to ${W[j + 1]}, ${g} wide; ${g === bw && bj === j ? `new widest, ${bw}` : `widest stays ${bw}`}`, cells: grid, tones: cut(gw, j, bw, false) }); });
      frames.push({ note: `The tallest strip ${bh} meets the widest strip ${bw}: biggest piece ${bh} × ${bw} = ${bh * bw}`, cells: grid, active: [bi, bj], tones: { [`${bi}:${bj}`]: "found" } });
      return table(`${h} × ${w} cake: biggest piece ${bh * bw}`, gh.map((g) => `h ${g}`), gw.map((g) => `w ${g}`), frames);
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
      const raw = [400, 50, 200, 100, 300], t = [...raw].sort((a, b) => a - b); let power = 200, lo = 0, hi = t.length - 1, score = 0, best = 0; const tones: Record<string, Tone> = {};
      const frames: CellsFrame[] = [{ note: `Goal: start with power ${power}; a token can be played face up (pay its value, gain 1 score) or face down (gain its value, lose 1 score). Maximise the score`, rows: [raw] }, { note: `Sort the tokens: cheap ones are best to buy, expensive ones best to sell. lo = 0 is ${t[0]}, hi = ${hi} is ${t[hi]}`, rows: [t], marks: [{ i: lo, label: "lo" }, { i: hi, label: "hi" }] }];
      while (lo <= hi) {
        if (power >= t[lo]) { power -= t[lo]; tones[`0:${lo}`] = "found"; lo++; score++; best = Math.max(best, score); frames.push({ note: `Power is enough for ${t[lo - 1]}: play it face up, power ${power}, score ${score}${score === best ? ` (best ${best})` : ""}`, rows: [t], tones: { ...tones }, marks: [{ i: Math.min(lo, t.length - 1), label: "lo" }, { i: hi, label: "hi" }] }); }
        else if (score) { power += t[hi]; tones[`0:${hi}`] = "bad"; hi--; score--; frames.push({ note: `${power - t[hi + 1]} power cannot buy ${t[lo]}: sell the biggest left, ${t[hi + 1]}, face down, power ${power}, score ${score}`, rows: [t], tones: { ...tones }, marks: [{ i: lo, label: "lo" }, { i: Math.max(hi, 0), label: "hi" }] }); }
        else { frames.push({ note: `Power ${power} cannot buy ${t[lo]} and there is no score to sell, so stop`, rows: [t], tones: { ...tones } }); break; }
      }
      frames.push({ note: `The pointers have met, so the best score ever reached is ${best}`, rows: [t], tones: { ...tones } });
      return cells(`Tokens [${raw.join(", ")}], power 200 → ${best}`, [raw], frames);
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
      const counts = [[2, 4], [3, 3], [5, 7], [7, 2], [9, 5]], vals = counts.map(([v]) => v), cnt = counts.map(([, c]) => c), ops = blank(vals.length), size = cnt.reduce((s, c) => s + c, 0), frames: CellsFrame[] = [{ note: `Goal: each operation deletes 2 or 3 equal numbers; empty the array of ${size} numbers. Count each value, then handle each value alone`, rows: [vals, cnt, [...ops]] }]; let total = 0;
      vals.forEach((v, i) => {
        const c = cnt[i], o = Math.ceil(c / 3); total += o; ops[i] = o; const parts = c % 3 === 0 ? `${c / 3} × 3` : c % 3 === 1 ? `${(c - 4) / 3} × 3 + 2 × 2` : `${(c - 2) / 3} × 3 + 1 × 2`;
        frames.push({ note: `${v} appears ${c} times = ${parts}, which is ${o} operations, ${total} so far`, rows: [vals, cnt, [...ops]], tones: { [`2:${i}`]: "found", [`1:${i}`]: "active" } });
      });
      frames.push({ note: `No value appears only once, so every group can be removed: ${ops.join(" + ")} = ${total} operations`, rows: [vals, cnt, [...ops]], tones: range(0, vals.length - 1, 2, "found") });
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
      const mat = [[11, 25, 66, 1, 69], [23, 55, 17, 45, 15], [75, 31, 36, 44, 58], [22, 27, 33, 25, 68]], m = 4, n = 5, cur = mat.map((r) => [...r]), frames: TableFrame[] = [{ note: "Goal: sort every top-left to bottom-right diagonal in increasing order. Cells on a diagonal share the same i - j", cells: mat.map((r) => [...r]) }];
      for (let key = m - 1; key > -n; key--) {
        const pos: [number, number][] = []; for (let i = 0; i < m; i++) { const j = i - key; if (j >= 0 && j < n) pos.push([i, j]); }
        if (pos.length < 2) continue;
        const before = pos.map(([i, j]) => cur[i][j]), after = [...before].sort((a, b) => a - b); pos.forEach(([i, j], k) => (cur[i][j] = after[k]));
        frames.push({ note: `Diagonal i - j = ${key}: [${before.join(", ")}] ${before.join() === after.join() ? "is already in order" : `sorts to [${after.join(", ")}]`}`, cells: cur.map((r) => [...r]), tones: Object.fromEntries(pos.map(([i, j]) => [`${i}:${j}`, "active"])) as Record<string, Tone> });
      }
      frames.push({ note: "Every diagonal with two or more cells is sorted, so the matrix is done", cells: cur.map((r) => [...r]), tones: Object.fromEntries(cur.flatMap((r, i) => r.map((_, j) => [`${i}:${j}`, "found"]))) as Record<string, Tone> });
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
      const edges: [number, number, number][] = [[0, 1, 2], [0, 2, 5], [1, 2, 1], [2, 4, 3], [4, 3, 1], [3, 5, 2], [1, 3, 4]], T = 5, nodes = [{ id: 0, label: "0", x: 8, y: 50 }, { id: 1, label: "1", x: 32, y: 14 }, { id: 2, label: "2", x: 32, y: 86 }, { id: 3, label: "3", x: 68, y: 14 }, { id: 4, label: "4", x: 68, y: 86 }, { id: 5, label: "5", x: 92, y: 50 }];
      const g: [number, number][][] = nodes.map(() => []); edges.forEach(([u, v, w]) => g[u].push([v, w]));
      const dist: Record<number, number> = { 0: 0 }, prev: Record<number, number> = {}, h: [number, number][] = [[0, 0]], done: Record<number, Tone> = {}, frames: GraphFrame[] = [{ note: `Goal: shortestPath(0, ${T}) after addEdge([1, 3, 4]) added the edge 1 → 3. Dijkstra starts with 0 at distance 0`, tones: { 0: "active" }, badges: { 0: "0" }, edgeTones: { [ek(1, 3)]: "window" } }]; let ans = -1;
      const badges = () => Object.fromEntries(Object.entries(dist).map(([k, v]) => [+k, String(v)]));
      while (h.length) {
        h.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const [d, u] = h.shift()!;
        if (d > dist[u]) { frames.push({ note: `Pop (${d}, node ${u}): dist[${u}] is already ${dist[u]}, so this entry is stale and is skipped`, tones: { ...done, [u]: "bad" }, badges: badges() }); continue; }
        done[u] = "done";
        if (u === T) { ans = d; const path = [T]; while (path[0] !== 0) path.unshift(prev[path[0]]); frames.push({ note: `Pop node ${T} at distance ${d}, the target, so the answer is ${d} via ${path.join(" → ")}`, tones: { ...done, ...Object.fromEntries(path.map((p) => [p, "found"])) } as Record<number, Tone>, badges: badges(), edgeTones: Object.fromEntries(path.slice(1).map((p, i) => [ek(path[i], p), "found"])) as Record<string, Tone> }); break; }
        const rel: string[] = [], et: Record<string, Tone> = {};
        for (const [v, w] of g[u]) if (d + w < (dist[v] ?? Infinity)) { rel.push(`${v} = ${d + w}`); dist[v] = d + w; prev[v] = u; h.push([d + w, v]); et[ek(u, v)] = "window"; }
        frames.push({ note: `Pop node ${u} at distance ${d}${rel.length ? `: improved ${rel.join(", ")} and pushed them` : ", nothing it reaches gets shorter"}`, tones: { ...done, [u]: "active" }, badges: badges(), edgeTones: et });
      }
      return { kind: "graph", title: `shortestPath(0, ${T}) = ${ans}`, nodes, edges: edges.map(([a, b, w]) => ({ a, b, w, directed: true })), frames };
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
      const s = "dcabgfe", pairs = [[0, 3], [1, 2], [3, 4], [5, 6]], out = s.split(""), nodes = out.map((c, i) => ({ id: i, label: `${i}:${c}`, x: 8 + i * 14, y: i % 2 ? 72 : 28 }));
      const parent = out.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), et: Record<string, Tone> = {};
      const frames: GraphFrame[] = [{ note: `Goal: the smallest string reachable by swapping letters at the index pairs ${pairs.map((p) => `[${p}]`).join(", ")} in "${s}". Indices in one connected group can be rearranged freely` }];
      pairs.forEach(([a, b]) => { const same = find(a) === find(b); parent[find(a)] = find(b); et[ek(a, b)] = "found"; frames.push({ note: `Union ${a} and ${b}: letters ${out[a]} and ${out[b]} can swap${same ? " (already connected)" : ""}`, tones: { [a]: "active", [b]: "active" }, edgeTones: { ...et } }); });
      const groups = new Map<number, number[]>(); out.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) || []), i]));
      const tone: Tone[] = ["found", "window", "done"]; let gi = 0; const tones: Record<number, Tone> = {}, badges: Record<number, string> = {};
      for (const idx of groups.values()) { const before = idx.map((i) => out[i]), sorted = [...before].sort(); idx.forEach((i, k) => { out[i] = sorted[k]; tones[i] = tone[gi % 3]; badges[i] = sorted[k]; }); frames.push({ note: `Group {${idx.join(", ")}} holds letters ${before.join(", ")}; sorted ${sorted.join(", ")} go back to indices ${idx.join(", ")}`, tones: { ...tones }, badges: { ...badges }, edgeTones: { ...et } }); gi++; }
      frames.push({ note: `Every group is sorted, so the string reads "${out.join("")}"`, tones: Object.fromEntries(out.map((_, i) => [i, "found"])) as Record<number, Tone>, badges: { ...badges }, edgeTones: { ...et } });
      return { kind: "graph", title: `"${s}" → "${out.join("")}"`, nodes, edges: pairs.map(([a, b]) => ({ a, b })), frames };
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
      const a = [1, 3, 2, 3, 3, 2, 3, 1], k = 2, mx = Math.max(...a), frames: CellsFrame[] = [{ note: `Goal: count subarrays of [${a.join(", ")}] where the maximum ${mx} appears at least ${k} times. For each right end r, every start before left works` }]; let ans = 0, left = 0, cnt = 0;
      a.forEach((x, r) => {
        const from = left; if (x === mx) cnt++; while (cnt >= k) { if (a[left] === mx) cnt--; left++; } ans += left;
        frames.push({ note: `r = ${r}, nums[r] = ${x}${x === mx ? ` is a max, so ${mx} appears ${cnt + (left > from ? 1 : 0)} time${cnt + (left > from ? 1 : 0) === 1 ? "" : "s"}` : ""}: ${left > from ? `move left from ${from} to ${left} until the window [${left}..${r}] holds ${cnt}, fewer than ${k}` : `window [${left}..${r}] holds ${cnt}, fewer than ${k}, left stays ${left}`}; ${left ? `starts 0..${left - 1} work` : "no start works yet"}, +${left} (total ${ans})`, tones: { ...(left ? range(0, left - 1, 0, "found") : {}), ...range(left, r, 0) }, marks: [{ i: Math.min(left, r), label: "L" }, { i: r, label: "R" }] });
      });
      frames.push({ note: `The right end has reached the last element, so ${ans} subarrays contain ${mx} at least ${k} times`, tones: range(0, a.length - 1, 0, "found") });
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
      const s = "aabbcdeefgg", k = 2, frames: CellsFrame[] = [{ note: `Goal: the longest substring of "${s}" where every letter appears at least ${k} times. Find a letter with fewer than ${k} copies, which can never be inside the answer, and split the string on it` }]; let bestLo = 0, bestLen = 0;
      const go = (lo: number, hi: number): number => {
        if (hi - lo < k) { if (hi > lo) frames.push({ note: `"${s.slice(lo, hi)}" is shorter than ${k}, so it cannot qualify: 0`, tones: range(lo, hi - 1, 0, "muted") }); return 0; }
        const part = s.slice(lo, hi), bad = [...new Set(part)].sort().find((c) => part.split(c).length - 1 < k);
        if (!bad) { frames.push({ note: `"${part}": every letter appears at least ${k} times, so it is valid with length ${hi - lo}`, tones: range(lo, hi - 1, 0, "found") }); if (hi - lo > bestLen) { bestLen = hi - lo; bestLo = lo; } return hi - lo; }
        frames.push({ note: `"${part}": '${bad}' appears only ${part.split(bad).length - 1} time${part.split(bad).length - 1 === 1 ? "" : "s"}, so split on it and solve each side`, tones: { ...range(lo, hi - 1), ...Object.fromEntries([...part].flatMap((c, i) => (c === bad ? [[`0:${lo + i}`, "bad"]] : []))) } });
        let best = 0, start = lo; for (let i = lo; i <= hi; i++) if (i === hi || s[i] === bad) { best = Math.max(best, go(start, i)); start = i + 1; }
        return best;
      };
      const ans = go(0, s.length);
      frames.push({ note: `The longest valid piece is "${s.slice(bestLo, bestLo + bestLen)}", length ${ans}`, tones: range(bestLo, bestLo + bestLen - 1, 0, "found") });
      return cells(`longestSubstring("${s}", ${k}) = ${ans}`, [s.split("")], frames);
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
      const pos = [1, 2, 3, 4, 5, 6], hp = [10, 5, 7, 3, 8, 6], dir = "RRLRLR", h = [...hp], st: number[] = [], lab = (i: number) => `#${i}:${h[i]}`;
      const frames: StackFrame[] = [{ note: `Goal: robots at ${pos.join(", ")} with health ${hp.join(", ")} move ${[...dir].join(" ")}. Go left to right; right-movers wait on a stack, a left-mover fights the top of it`, items: [] }];
      [...pos.keys()].sort((a, b) => pos[a] - pos[b]).forEach((i) => {
        if (dir[i] === "R") { st.push(i); frames.push({ note: `Robot ${i} at ${pos[i]} moves right with health ${h[i]}, so push it`, items: st.map(lab), incoming: lab(i) }); return; }
        while (st.length && h[i]) {
          const j = st[st.length - 1], hj = h[j], hi = h[i]; let gone: string[] = [], res: string;
          if (hj < hi) { st.pop(); gone = [`#${j}:${hj}`]; h[j] = 0; h[i]--; res = `robot ${j} (${hj}) dies and robot ${i} drops to ${h[i]}`; }
          else if (hj > hi) { h[j]--; h[i] = 0; res = `robot ${i} (${hi}) dies and robot ${j} drops to ${h[j]}`; }
          else { st.pop(); gone = [`#${j}:${hj}`]; h[j] = h[i] = 0; res = `both have ${hj} and both die`; }
          frames.push({ note: `Left-mover ${i} (health ${hi}) meets robot ${j} (health ${hj}): ${res}`, items: st.map(lab), incoming: h[i] ? lab(i) : undefined, popped: gone.length ? gone : undefined });
        }
      });
      const out = h.filter((x) => x);
      frames.push({ note: `All robots are processed; the survivors in input order have health ${out.join(", ")}`, items: st.map(lab) });
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
      const arr = [1, 1, 2, 2, -2, -4, 3, 6, 4, 8], c = new Map<number, number>(); arr.forEach((x) => c.set(x, (c.get(x) || 0) + 1));
      const keys = [...c.keys()].sort((a, b) => Math.abs(a) - Math.abs(b)), row = () => keys.map((k) => c.get(k) || 0), frames: CellsFrame[] = [{ note: `Goal: can [${arr.join(", ")}] be split into pairs (x, 2x)? Count each value and go by absolute value, smallest first`, rows: [keys, row()] }]; let ok = true;
      for (const x of keys) {
        const cx = c.get(x) || 0, i = keys.indexOf(x);
        if (!cx) { frames.push({ note: `${x} has no copies left, because they were already used as the double of a smaller number`, rows: [keys, row()], tones: { [`1:${i}`]: "muted" } }); continue; }
        const c2 = c.get(2 * x) || 0, j = keys.indexOf(2 * x);
        if (cx > c2) { ok = false; frames.push({ note: `${cx} × ${x} need ${cx} × ${2 * x}, but only ${c2} left, so the answer is false`, rows: [keys, row()], tones: { [`1:${i}`]: "bad" } }); break; }
        c.set(2 * x, c2 - cx); c.set(x, 0); frames.push({ note: `Pair ${cx} × ${x} with ${cx} × ${2 * x}, leaving ${c2 - cx} of ${2 * x}`, rows: [keys, row()], tones: { [`1:${i}`]: "active", [`1:${j}`]: "window" } });
      }
      if (ok) frames.push({ note: "Every value found its double, so the array can be reordered into pairs", rows: [keys, row()], tones: range(0, keys.length - 1, 1, "found") });
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
      const l1 = [10, 1, 13, 6, 9, 5, 7], l2 = [100, 101, 102], a = 2, b = 4, values = [...l1, ...l2], n = l1.length, last = values.length - 1, next = values.map((_, i) => (i === n - 1 || i === last ? -1 : i + 1)), cut = span(a, b, "bad");
      const frames: ListFrame[] = [{ note: `Goal: replace nodes ${a} to ${b} of list1 (${l1.slice(a, b + 1).join(", ")}) with all of list2. Both pointers start at the head`, next: [...next], ptrs: [{ i: 0, label: "before" }], tones: cut }];
      for (let p = 1; p <= a - 1; p++) frames.push({ note: `Move before forward ${p} of ${a - 1} to node ${p} (${l1[p]})${p === a - 1 ? ", the node just before the cut" : ""}`, next: [...next], ptrs: [{ i: p, label: "before" }], tones: cut });
      for (let p = a; p <= b + 1; p++) frames.push({ note: `Walk after forward to node ${p} (${l1[p]})${p === b + 1 ? `, the first node past the cut` : `, still inside the cut`}`, next: [...next], ptrs: [{ i: a - 1, label: "before" }, { i: p, label: "after" }], tones: cut });
      next[a - 1] = n; frames.push({ note: `Set before.next to list2's head, ${l2[0]}, so the cut nodes are bypassed`, next: [...next], ptrs: [{ i: a - 1, label: "before" }, { i: b + 1, label: "after" }, { i: n, label: "list2" }], tones: { ...span(a, b, "muted"), [n]: "found" } });
      for (let p = n + 1; p <= last; p++) frames.push({ note: `Walk list2 forward to node ${p} (${values[p]})${p === last ? ", its tail" : ""}`, next: [...next], ptrs: [{ i: p, label: "list2" }, { i: b + 1, label: "after" }], tones: { ...span(a, b, "muted"), ...span(n, p, "found") } });
      next[last] = b + 1; frames.push({ note: `Point the tail (${values[last]}) at ${l1[b + 1]}, which restores the rest of list1`, next: [...next], ptrs: [{ i: last, label: "tail" }, { i: b + 1, label: "after" }], tones: { ...span(a, b, "muted"), ...span(n, last, "found") } });
      frames.push({ note: `Result: ${[...l1.slice(0, a), ...l2, ...l1.slice(b + 1)].join(" → ")}`, next: [...next], ptrs: [], tones: { ...span(a, b, "muted"), ...span(n, last, "found") } });
      return { kind: "list", title: `Replace nodes ${a}..${b} with list2`, values, frames };
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
      const L = [[1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1], [1, 0, 0, 0, 0, 0], [1, 0, 1, 1, 0, 1]], m = 5, n = 6, out: number[][] = [], tones: Record<string, Tone> = {};
      const frames: TableFrame[] = [{ note: "Goal: list each rectangle of farmland (1s) as [top, left, bottom, right]. Scan row by row; a 1 with no 1 above and no 1 to its left is a rectangle's top-left corner", cells: L.map((r) => [...r]) }];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (L[i][j] && (i === 0 || !L[i - 1][j]) && (j === 0 || !L[i][j - 1])) {
        let r = i, c = j; while (r + 1 < m && L[r + 1][j]) r++; while (c + 1 < n && L[i][c + 1]) c++;
        frames.push({ note: `(${i}, ${j}) is farmland with none above or to the left, so it is a top-left corner of group ${out.length + 1}`, cells: L.map((x) => [...x]), active: [i, j], tones: { ...tones } });
        out.push([i, j, r, c]); for (let x = i; x <= r; x++) for (let y = j; y <= c; y++) tones[`${x}:${y}`] = "found";
        frames.push({ note: `Go down to row ${r} and right to column ${c} while the land continues: record [${i}, ${j}, ${r}, ${c}]`, cells: L.map((x) => [...x]), active: [r, c], tones: { ...tones } });
      }
      frames.push({ note: `The scan is done: ${out.length} groups found`, cells: L.map((x) => [...x]), tones: { ...tones } });
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
      const M = [[1, 5, 9, 14], [10, 11, 13, 16], [12, 13, 15, 18], [17, 19, 20, 24]], k = 10, n = 4, frames: TableFrame[] = [{ note: `Goal: the ${k}th smallest value in a matrix whose rows and columns are sorted. Binary search the value between ${M[0][0]} and ${M[n - 1][n - 1]}, counting how many cells are at most mid`, cells: M }]; let lo = M[0][0], hi = M[n - 1][n - 1];
      while (lo < hi) {
        const mid = (lo + hi) >> 1, t: Record<string, Tone> = {}; let c = 0; M.forEach((r, i) => r.forEach((v, j) => { if (v <= mid) { c++; t[`${i}:${j}`] = "window"; } })); const ok = c >= k;
        frames.push({ note: `mid = ${mid} (range ${lo}..${hi}): ${c} cells are at most ${mid}, ${ok ? `at least ${k}, so the answer is at most ${mid}; keep ${lo}..${mid}` : `fewer than ${k}, so the answer is above ${mid}; keep ${mid + 1}..${hi}`}`, cells: M, tones: t }); if (ok) hi = mid; else lo = mid + 1;
      }
      const at = M.flatMap((r, i) => r.map((v, j) => [i, j, v])).find((p) => p[2] === lo)!;
      frames.push({ note: `The range has closed on ${lo}, so the ${k}th smallest is ${lo}`, cells: M, active: [at[0], at[1]], tones: { [`${at[0]}:${at[1]}`]: "found" } });
      return table(`${k}th smallest: ${lo}`, nums(n), nums(n), frames);
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
      const a = [1, 2, 3, 2, 1], b = [3, 2, 1, 2, 3, 2], dp: (number | null)[][] = a.map(() => b.map(() => null)), snap = () => dp.map((r) => [...r]);
      const frames: TableFrame[] = [{ note: `Goal: the longest run that appears in both [${a.join(", ")}] and [${b.join(", ")}]. dp[i][j] is the length of the common run ending at nums1[i] and nums2[j]; unequal pairs are 0`, cells: snap() }]; let best = 0, bi = 0, bj = 0;
      a.forEach((x, i) => b.forEach((y, j) => {
        if (x !== y) { dp[i][j] = 0; return; }
        const prev = i && j ? (dp[i - 1][j - 1] as number) : 0; dp[i][j] = prev + 1; if (prev + 1 > best) { best = prev + 1; bi = i; bj = j; }
        frames.push({ note: `nums1[${i}] = nums2[${j}] = ${x}: the run before them is ${prev}, so this run is ${prev + 1}${best === prev + 1 && bi === i && bj === j ? `, a new best` : ` (best stays ${best})`}`, cells: snap(), active: [i, j], deps: i && j ? [[i - 1, j - 1]] : [] });
      }));
      frames.push({ note: `Every pair has been compared; the longest common run has length ${best}, ending at nums1[${bi}] and nums2[${bj}]`, cells: snap(), tones: Object.fromEntries(Array.from({ length: best }, (_, t) => [`${bi - t}:${bj - t}`, "found"])) as Record<string, Tone> });
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
      const W = 8, bits = (x: number) => x.toString(2).padStart(W, "0").split(""); let l = 162, r = 191, shift = 0; const L0 = l, R0 = r;
      const frames: CellsFrame[] = [{ note: `Goal: AND every number from ${l} to ${r}. Any bit that differs between the ends is 0 somewhere in the range, so only the common prefix survives; shift both ends right until they are equal`, rows: [bits(l), bits(r)] }];
      while (l !== r) {
        const lowest = W - 1 - shift;
        frames.push({ note: `${l} ≠ ${r}: they still differ, so drop the lowest bit of each (shift becomes ${shift + 1}) and compare ${l >> 1} with ${r >> 1}`, rows: [bits(l << shift), bits(r << shift)], tones: { ...range(lowest, lowest, 0, "bad"), ...range(lowest, lowest, 1, "bad"), ...(shift ? { ...range(lowest + 1, W - 1, 0, "muted"), ...range(lowest + 1, W - 1, 1, "muted") } : {}) } });
        l >>= 1; r >>= 1; shift++;
      }
      frames.push({ note: `Both ends are ${l} (${l.toString(2)}), so that is the common prefix; shift it back by ${shift} to get ${l << shift}`, rows: [bits(l << shift), bits(r << shift)], tones: { ...range(0, W - 1 - shift, 0, "found"), ...range(0, W - 1 - shift, 1, "found") } });
      return cells(`${L0} AND ... AND ${R0} = ${l << shift}`, [bits(L0), bits(R0)], frames, ["left", "right"]);
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
      const labels = [1, 3, 2, 4, 5, 6, 7, 8, 9, 10, 11], par = [null, 0, 0, 0, 1, 1, 2, 3, 3, 4, 7], nodes: TNode[] = labels.map((v, i) => ({ id: i, label: String(v), parent: par[i] }));
      const frames: TreeFrame[] = [{ note: "Goal: list the values level by level. Keep a list of the current level, record its values, then replace it with all its children", tones: {} }], out: string[][] = []; let level = [0];
      while (level.length) {
        out.push(level.map((i) => nodes[i].label));
        frames.push({ note: `Level ${out.length - 1} holds [${out[out.length - 1].join(", ")}], so record it`, tones: Object.fromEntries(level.map((i) => [i, "active"])) as Record<number, Tone> });
        const nxt = level.flatMap((i) => nodes.filter((c) => c.parent === i).map((c) => c.id));
        frames.push({ note: nxt.length ? `Collect the children of those nodes: [${nxt.map((i) => nodes[i].label).join(", ")}] becomes level ${out.length}` : "Those nodes have no children, so the next level is empty and the loop ends", tones: Object.fromEntries(nxt.map((i) => [i, "window"])) as Record<number, Tone> });
        level = nxt;
      }
      frames.push({ note: `Done: ${out.length} levels, [${out.map((l) => `[${l.join(", ")}]`).join(", ")}]`, tones: Object.fromEntries(nodes.map((n) => [n.id, "found"])) as Record<number, Tone> });
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
      const n1 = 148, n2 = 31, W = 8, bits = (v: number) => v.toString(2).padStart(W, "0").split(""); let need = n2.toString(2).split("").filter((c) => c === "1").length, x = 0; const frames: CellsFrame[] = [{ note: `Goal: find x with exactly as many set bits as num2 = ${n2} (${need}) that makes x XOR num1 as small as possible. Match num1's high bits first`, rows: [bits(n1), bits(x)] }];
      for (let b = W - 1; b >= 0; b--) if (need && (n1 >> b) & 1) { x |= 1 << b; need--; frames.push({ note: `num1 has bit ${b} set: set it in x too so it cancels in the XOR (${need} bit${need === 1 ? "" : "s"} still to place)`, rows: [bits(n1), bits(x)], tones: { [`0:${W - 1 - b}`]: "active", [`1:${W - 1 - b}`]: "found" } }); }
      for (let b = 0; b < W; b++) if (need && !((x >> b) & 1)) { x |= 1 << b; need--; frames.push({ note: `num1 has run out of set bits, so use the lowest free bit ${b} in x (${need} still to place)`, rows: [bits(n1), bits(x)], tones: { [`1:${W - 1 - b}`]: "window" } }); }
      frames.push({ note: `All ${n2.toString(2).split("1").length - 1} bits are placed: x = ${x}, and x XOR num1 = ${x ^ n1}`, rows: [bits(n1), bits(x)], tones: range(0, W - 1, 1, "found") });
      return cells(`minimizeXor(${n1}, ${n2}) = ${x}`, [bits(n1), bits(0)], frames, ["num1", "x"]);
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
      const req: [number, number][] = [[10, 20], [15, 25], [20, 30], [5, 10], [9, 11], [30, 35], [1, 6], [0, 5]], booked: [number, number][] = [], keep: Record<number, Tone> = {};
      const frames: IntervalsFrame[] = [{ note: "Goal: accept a booking [start, end) only if it overlaps no earlier one. Keep bookings sorted by start and check just the neighbour before and the neighbour after the new start" }];
      req.forEach(([s, e], k) => {
        let i = 0; while (i < booked.length && booked[i][0] <= s) i++;
        const prev = i ? booked[i - 1] : null, next = i < booked.length ? booked[i] : null; let why = "";
        if (prev && prev[1] > s) why = `the booking before it, [${prev[0]}, ${prev[1]}), ends at ${prev[1]}, after ${s}`;
        else if (next && next[0] < e) why = `the booking after it, [${next[0]}, ${next[1]}), starts at ${next[0]}, before ${e}`;
        const ok = !why; if (ok) { booked.splice(i, 0, [s, e]); keep[k] = "found"; }
        frames.push({ note: ok ? `book(${s}, ${e}): ${prev ? `previous ends at ${prev[1]}, not after ${s}` : "no booking before"}; ${next ? `next starts at ${next[0]}, not before ${e}` : "no booking after"}, so true` : `book(${s}, ${e}): ${why}, so they overlap and the answer is false`, tones: { ...keep, [k]: ok ? "active" : "bad" }, line: s });
        if (!ok) keep[k] = "muted";
      });
      frames.push({ note: `Accepted ${booked.length} of ${req.length} bookings: ${booked.map(([s, e]) => `[${s}, ${e})`).join(", ")}`, tones: keep });
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
      const eqs = ["a==b", "b==c", "d==e", "e==f", "a!=d", "c!=f", "b!=e"], L = ["a", "b", "c", "d", "e", "f"], nodes = [{ id: 0, label: "a", x: 8, y: 20 }, { id: 1, label: "b", x: 30, y: 50 }, { id: 2, label: "c", x: 8, y: 80 }, { id: 3, label: "d", x: 70, y: 20 }, { id: 4, label: "e", x: 92, y: 50 }, { id: 5, label: "f", x: 70, y: 80 }];
      const parent = L.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), et: Record<string, Tone> = {}, grp = (u: number) => L.filter((_, i) => find(i) === find(u)).join("");
      const frames: GraphFrame[] = [{ note: `Goal: can letters take values that satisfy all of ${eqs.join(", ")}? First join the letters of every == equation, then check every != pair lands in different groups` }]; let ok = true;
      for (const e of eqs.filter((q) => q[1] === "=")) { const u = L.indexOf(e[0]), v = L.indexOf(e[3]); parent[find(u)] = find(v); et[ek(u, v)] = "found"; frames.push({ note: `${e}: join ${e[0]} and ${e[3]}, group is now {${grp(u).split("").join(", ")}}`, tones: { [u]: "active", [v]: "active" }, edgeTones: { ...et } }); }
      for (const e of eqs.filter((q) => q[1] === "!")) { const u = L.indexOf(e[0]), v = L.indexOf(e[3]), same = find(u) === find(v); if (same) ok = false; frames.push({ note: `${e}: ${e[0]} is in {${grp(u).split("").join(", ")}} and ${e[3]} in {${grp(v).split("").join(", ")}}, ${same ? "the same group, a contradiction" : "different groups, so it holds"}`, tones: { [u]: same ? "bad" : "window", [v]: same ? "bad" : "window" }, edgeTones: { ...et } }); if (same) break; }
      frames.push({ note: ok ? "Every != pair sits in different groups, so the equations can all be satisfied: true" : "A != pair shares a group, so the equations cannot all hold: false", tones: Object.fromEntries(L.map((_, i) => [i, ok ? "found" : "bad"])) as Record<number, Tone>, edgeTones: { ...et } });
      return { kind: "graph", title: `[${eqs.join(", ")}] → ${ok}`, nodes, edges: [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 3, b: 4 }, { a: 4, b: 5 }], frames };
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
      const grid = [[2, 10, 6], [4, 14, 8]], x = 2, v = grid.flat().sort((a, b) => a - b), mi = v.length >> 1, mid = v[mi], ops = blank(v.length);
      const frames: CellsFrame[] = [{ note: `Goal: make every cell of ${JSON.stringify(grid)} equal by adding or subtracting ${x} per operation. Flatten and sort the values`, rows: [v, [...ops]] },
        { note: `Each value minus the smallest (${v[0]}) must be divisible by ${x}: ${v.map((y) => y - v[0]).join(", ")} all are, so a common target exists`, rows: [v, [...ops]], tones: range(0, v.length - 1) },
        { note: `The best target is the median, ${mid} (index ${mi} of ${v.length}), because it minimises total distance`, rows: [v, [...ops]], tones: { [`0:${mi}`]: "found" } }]; let total = 0;
      v.forEach((y, i) => { const o = Math.abs(y - mid) / x; total += o; ops[i] = o; frames.push({ note: `${y} → ${mid}: |${y} - ${mid}| / ${x} = ${o} operation${o === 1 ? "" : "s"}, ${total} so far`, rows: [v, [...ops]], tones: { [`1:${i}`]: "active", [`0:${mi}`]: "found" } }); });
      frames.push({ note: `Adding up every cell's operations gives ${total}`, rows: [v, [...ops]], tones: range(0, v.length - 1, 1, "found") });
      return cells(`${JSON.stringify(grid)}, x = ${x} → ${total}`, [v, blank(v.length)], frames, ["sorted", "ops"]);
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
      const a = [1, 1, 2, 1], b = [6, 5, 6, 6], gains = [...a.map((p) => 6 - p), ...b.map((q) => q - 1)].sort((p, q) => q - p), s1 = a.reduce((s, y) => s + y, 0), s2 = b.reduce((s, y) => s + y, 0), gap = blank(gains.length); let diff = s2 - s1, ops = 0;
      const frames: CellsFrame[] = [{ note: `Goal: change numbers to any value 1..6 until [${a.join(", ")}] and [${b.join(", ")}] have equal sums. They sum to ${s1} and ${s2}, a gap of ${diff}`, rows: [blank(gains.length), [...gap]] },
        { note: `Raising a number x in the smaller array gains 6 - x, lowering a number y in the larger gains y - 1. Largest gains first: ${gains.join(", ")}`, rows: [gains, [...gap]] }];
      for (const g of gains) { ops++; diff -= g; gap[ops - 1] = Math.max(diff, 0); frames.push({ note: `Operation ${ops}: take gain ${g}, so the gap goes ${diff + g} → ${Math.max(diff, 0)}${diff <= 0 ? ", closed" : ""}`, rows: [gains, [...gap]], tones: { ...range(0, ops - 1, 0, diff <= 0 ? "found" : "window"), [`1:${ops - 1}`]: "active" } }); if (diff <= 0) break; }
      frames.push({ note: `The gap is closed after ${ops} operations, the fewest possible because each took the largest gain left`, rows: [gains, [...gap]], tones: range(0, ops - 1, 0, "found") });
      return cells(`Operations: ${ops}`, [gains, blank(gains.length)], frames, ["gain", "gap left"]);
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
      const raw = [3, 9, 5, 1, 7, 2, 6], h = [...raw].sort((a, b) => b - a), k = 6, got = blank(h.length);
      const frames: CellsFrame[] = [{ note: `Goal: pick ${k} children one at a time; each pick lowers every unpicked child's happiness by 1 (never below 0). Maximise the total`, rows: [raw, blank(raw.length)] }, { note: `Pick the happiest first so each loses the fewest points: sorted ${h.join(", ")}`, rows: [h, [...got]] }]; let total = 0;
      for (let i = 0; i < k; i++) { const v = Math.max(h[i] - i, 0); total += v; got[i] = v; frames.push({ note: `Pick ${i + 1}: ${h[i]} has lost ${i}, leaving ${v}${h[i] - i < 0 ? " (floored at 0)" : ""}; total ${total}`, rows: [h, [...got]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found", ...range(i + 1, h.length - 1, 0, "muted") } }); }
      frames.push({ note: `${k} children picked for a total happiness of ${total}`, rows: [h, [...got]], tones: range(0, k - 1, 1, "found") });
      return cells(`k = ${k} → ${total}`, [h, blank(h.length)], frames, ["sorted", "gained"]);
    },
  },
};
