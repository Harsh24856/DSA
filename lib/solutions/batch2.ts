// Hand-written solutions for the slugs listed under "batch2" in batches.json. See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, IntervalsFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { levelTree, range, type TNode } from "../sim.ts";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const blank = (n: number) => Array<string | number>(n).fill("");
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const tones = (ids: number[], t: Tone) => Object.fromEntries(ids.map((i) => [i, t])) as Record<number, Tone>;
const keys = (ks: string[], t: Tone) => Object.fromEntries(ks.map((k) => [k, t])) as Record<string, Tone>;
/** Tree helpers over level-order (heap index) arrays: node id = index. */
function T(vals: (number | null)[]) {
  const { nodes, kids } = levelTree(vals);
  return { nodes, kids, val: (i: number) => vals[i] as number };
}
/** Accumulate tones across frames so visited nodes stay marked. */
function trail(frames: TreeFrame[], keep: Tone = "done"): TreeFrame[] {
  const seen: Record<number, Tone> = {};
  return frames.map((f) => { const out = { ...f, tones: { ...seen, ...f.tones } }; Object.keys(f.tones || {}).forEach((k) => { const t = f.tones![+k]; if (t !== "muted") seen[+k] = t === "found" || t === "bad" ? t : keep; }); return out; });
}
const grid = (m: number[][]) => m.map((r) => [...r]) as (string | number | null)[][];
const heads = (n: number, p = "") => Array.from({ length: n }, (_, i) => p + i);

export const BATCH2: Record<string, Solution> = {
  "count-square-submatrices-with-all-ones": {
    approach: "dp[i][j] = side of the largest all-ones square ending at (i, j) = 1 + min(up, left, diagonal); that number is also how many squares end there.",
    idea: ["A square of side s ends at (i, j) only if squares of side s - 1 end at the cell above, to the left and diagonally up-left.", "So the biggest side is 1 + the smallest of those three.", "A cell with biggest side s is the corner of exactly s squares (sides 1..s), so add dp[i][j] to the total."],
    code: `def countSquares(matrix):
    R, C = len(matrix), len(matrix[0])
    dp = [[0] * (C + 1) for _ in range(R + 1)]
    total = 0
    for i in range(R):
        for j in range(C):
            if matrix[i][j]:
                dp[i + 1][j + 1] = 1 + min(dp[i][j + 1], dp[i + 1][j], dp[i][j])
                total += dp[i + 1][j + 1]
    return total`,
    lang: "python", time: "O(R·C)", space: "O(R·C)",
    viz: () => {
      const m = [[0, 1, 1, 1], [1, 1, 1, 1], [0, 1, 1, 1]], R = 3, C = 4, dp: (number | null)[][] = m.map((r) => r.map(() => null)), frames: TableFrame[] = []; let total = 0;
      const at = (i: number, j: number) => (i < 0 || j < 0 ? 0 : (dp[i][j] as number));
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        if (!m[i][j]) { dp[i][j] = 0; frames.push({ note: `(${i},${j}) is 0: no square ends here`, cells: dp.map((r) => [...r]), active: [i, j] }); continue; }
        const u = at(i - 1, j), l = at(i, j - 1), d = at(i - 1, j - 1), v = 1 + Math.min(u, l, d); dp[i][j] = v; total += v;
        frames.push({ note: `(${i},${j}): 1 + min(up ${u}, left ${l}, diag ${d}) = ${v}, so ${v} square${v > 1 ? "s end" : " ends"} here (total ${total})`, cells: dp.map((r) => [...r]), active: [i, j], deps: ([[i - 1, j], [i, j - 1], [i - 1, j - 1]] as [number, number][]).filter(([a, b]) => a >= 0 && b >= 0) });
      }
      return { kind: "table", title: `All-ones squares: ${total}`, rowHead: heads(R, "r"), colHead: heads(C, "c"), frames };
    },
  },

  "count-subarrays-with-fixed-bounds": {
    approach: "Track the last out-of-range index and the last positions of minK and maxK; every subarray ending at i may start anywhere after the bad index up to min(lastMin, lastMax).",
    idea: ["A valid subarray holds no value outside [minK, maxK] and contains both minK and maxK.", "For the right end i, the start must be after the last bad index and at or before both the last minK and the last maxK.", "That gives max(0, min(lo, hi) - bad) starts; add them up."],
    code: `def countSubarrays(nums, minK, maxK):
    bad = lo = hi = -1
    ans = 0
    for i, x in enumerate(nums):
        if x < minK or x > maxK:
            bad = i
        if x == minK:
            lo = i
        if x == maxK:
            hi = i
        ans += max(0, min(lo, hi) - bad)
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 3, 5, 2, 7, 5], mn = 1, mx = 5, frames: CellsFrame[] = []; let bad = -1, lo = -1, hi = -1, ans = 0;
      a.forEach((x, i) => {
        if (x < mn || x > mx) bad = i; if (x === mn) lo = i; if (x === mx) hi = i;
        const add = Math.max(0, Math.min(lo, hi) - bad); ans += add;
        const marks = [{ i, label: "i" }, ...(bad >= 0 ? [{ i: bad, label: "bad" }] : []), ...(lo >= 0 ? [{ i: lo, label: "min" }] : []), ...(hi >= 0 ? [{ i: hi, label: "max" }] : [])];
        frames.push({ note: add ? `end at ${i} (${x}): starts ${bad + 1}..${Math.min(lo, hi)} hold both bounds → +${add} (total ${ans})` : `end at ${i} (${x}): ${bad === i ? "out of range, resets the window" : "minK and maxK not both seen since the last bad value"} → +0 (total ${ans})`, tones: { ...(add ? range(bad + 1, Math.min(lo, hi)) : {}), [`0:${i}`]: "active", ...(bad >= 0 ? { [`0:${bad}`]: "bad" as Tone } : {}) }, marks });
      });
      return cells(`Fixed-bound subarrays (minK ${mn}, maxK ${mx}): ${ans}`, [a], frames);
    },
  },

  "maximize-distance-to-closest-person": {
    approach: "The best seat is either at an end next to a run of empty seats (distance = run length) or in the middle of an inner gap (distance = gap // 2).",
    idea: ["Walk left to right remembering the previous occupied seat.", "The first person gives the leading run: sitting at seat 0 is i away.", "Between two people at p and i, the middle seat is (i - p) // 2 away; after the last person, the trailing run counts in full."],
    code: `def maxDistToClosest(seats):
    prev, best = -1, 0
    for i, s in enumerate(seats):
        if s:
            best = i if prev < 0 else max(best, (i - prev) // 2)
            prev = i
    return max(best, len(seats) - 1 - prev)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0], frames: CellsFrame[] = []; let prev = -1, best = 0;
      s.forEach((x, i) => { if (!x) return; const d = prev < 0 ? i : Math.floor((i - prev) / 2); best = Math.max(best, d); frames.push({ note: prev < 0 ? `first person at ${i}: sit at seat 0, distance ${i} (best ${best})` : `gap between ${prev} and ${i}: middle seat ${prev + d} is ${d} away (best ${best})`, tones: { ...(prev < 0 ? range(0, i - 1) : range(prev + 1, i - 1)), [`0:${i}`]: "active", [`0:${prev < 0 ? 0 : prev + d}`]: "found" } }); prev = i; });
      const tail = s.length - 1 - prev; best = Math.max(best, tail);
      frames.push({ note: `last person at ${prev}: seat ${s.length - 1} is ${tail} away → answer ${best}`, tones: { ...range(prev + 1, s.length - 1), [`0:${s.length - 1}`]: "found" } });
      return cells(`Farthest seat from everyone: ${best}`, [s], frames);
    },
  },

  "subarray-sums-divisible-by-k": {
    approach: "Two prefix sums with the same remainder mod k bound a subarray divisible by k; count remainders as you go.",
    idea: ["sum(i..j) = P[j+1] - P[i], which is divisible by k exactly when P[j+1] % k == P[i] % k.", "Keep a count of each remainder seen so far (starting with remainder 0 once, for the empty prefix).", "At each step add the count of the current remainder, then record it. Python's % already gives a non-negative remainder."],
    code: `def subarraysDivByK(nums, k):
    count = {0: 1}
    s = ans = 0
    for x in nums:
        s = (s + x) % k
        ans += count.get(s, 0)
        count[s] = count.get(s, 0) + 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(k)",
    viz: () => {
      const a = [4, 5, 0, -2, -3, 1], k = 5, mods: (string | number)[] = blank(a.length), count = new Map([[0, 1]]), frames: CellsFrame[] = []; let s = 0, ans = 0;
      a.forEach((x, i) => { s = (((s + x) % k) + k) % k; const c = count.get(s) || 0; ans += c; count.set(s, c + 1); mods[i] = s; frames.push({ note: `prefix % ${k} = ${s}, seen ${c} time${c === 1 ? "" : "s"} before → +${c} (total ${ans}); counts {${[...count].map(([r, n]) => `${r}: ${n}`).join(", ")}}`, rows: [a, [...mods]], tones: { [`1:${i}`]: "active", ...Object.fromEntries(mods.slice(0, i).map((m, j) => [`1:${j}`, m === s ? "found" : "muted"])) } }); });
      return cells(`Subarrays divisible by ${k}: ${ans}`, [a, blank(a.length)], frames, ["nums", "prefix % k"]);
    },
  },

  "find-and-replace-pattern": {
    approach: "Rewrite every word as the order in which its letters first appear (abb → 0 1 1); a word matches when its shape equals the pattern's shape.",
    idea: ["A letter permutation exists exactly when the two strings have the same pattern of repeats.", "Number letters by first appearance: the first new letter is 0, the next new one 1, and so on.", "Compare the shape lists; this checks both directions of the mapping at once."],
    code: `def findAndReplacePattern(words, pattern):
    def shape(w):
        first = {}
        return [first.setdefault(c, len(first)) for c in w]
    p = shape(pattern)
    return [w for w in words if shape(w) == p]`,
    lang: "python", time: "O(n·L)", space: "O(L)",
    viz: () => {
      const words = ["abc", "deq", "mee", "aqq", "dkd", "ccc"], pattern = "abb";
      const shape = (w: string) => { const f = new Map<string, number>(); return [...w].map((c) => { if (!f.has(c)) f.set(c, f.size); return f.get(c)!; }); };
      const p = shape(pattern), rows: (string | number | null)[][] = [p, ...words.map(() => [null, null, null])], frames: TableFrame[] = [{ note: `pattern "${pattern}" has shape [${p.join(", ")}]`, cells: rows.map((r) => [...r]), tones: keys(["0:0", "0:1", "0:2"], "found") }], out: string[] = [], tn: Record<string, Tone> = keys(["0:0", "0:1", "0:2"], "found");
      words.forEach((w, i) => { const sh = shape(w), ok = sh.join() === p.join(); rows[i + 1] = sh; if (ok) out.push(w); [0, 1, 2].forEach((c) => (tn[`${i + 1}:${c}`] = ok ? "found" : "bad")); frames.push({ note: `"${w}" → [${sh.join(", ")}]: ${ok ? "same shape, keep it" : "different shape"}`, cells: rows.map((r) => [...r]), tones: { ...tn } }); });
      return { kind: "table", title: `Matches for "${pattern}": ${out.join(", ")}`, rowHead: [pattern, ...words], colHead: ["0", "1", "2"], frames };
    },
  },

  "apply-operations-to-maximize-score": {
    approach: "For each element count the subarrays where it is the chosen one (monotonic stack on prime scores), then spend k on the largest values first with fast power.",
    idea: ["Element i is chosen in a subarray when it has the highest prime score there, leftmost on ties: the start goes back to the previous score ≥ s[i], the end up to the next score > s[i].", "So it can be picked (i - left) × (right - i) times.", "Greedy: multiply by the biggest number as many times as allowed, then the next, until k operations are used."],
    code: `def maximumScore(nums, k):
    MOD = 10**9 + 7
    def primes(x):
        c, d = 0, 2
        while d * d <= x:
            if x % d == 0:
                c += 1
                while x % d == 0:
                    x //= d
            d += 1
        return c + (x > 1)
    s = [primes(x) for x in nums]
    n = len(nums)
    left, right, st = [-1] * n, [n] * n, []
    for i in range(n):
        while st and s[st[-1]] < s[i]:
            right[st.pop()] = i
        left[i] = st[-1] if st else -1
        st.append(i)
    ans = 1
    for i in sorted(range(n), key=lambda i: -nums[i]):
        take = min(k, (i - left[i]) * (right[i] - i))
        ans = ans * pow(nums[i], take, MOD) % MOD
        k -= take
        if k == 0:
            break
    return ans`,
    lang: "python", time: "O(n·√max + n log n)", space: "O(n)",
    viz: () => {
      const a = [19, 12, 14, 6, 10, 18]; let k = 3; const n = a.length;
      const primes = (x: number) => { let c = 0; for (let d = 2; d * d <= x; d++) if (x % d === 0) { c++; while (x % d === 0) x /= d; } return c + (x > 1 ? 1 : 0); };
      const s = a.map(primes), left = Array(n).fill(-1), right = Array(n).fill(n), st: number[] = [];
      for (let i = 0; i < n; i++) { while (st.length && s[st[st.length - 1]] < s[i]) right[st.pop()!] = i; left[i] = st.length ? st[st.length - 1] : -1; st.push(i); }
      const cnt = a.map((_, i) => (i - left[i]) * (right[i] - i)), shown: (string | number)[] = blank(n), frames: CellsFrame[] = [{ note: `prime scores: [${s.join(", ")}]`, rows: [a, s, blank(n)], tones: range(0, n - 1, 1, "window") }];
      a.forEach((_, i) => { shown[i] = cnt[i]; frames.push({ note: `${a[i]} wins in subarrays starting after ${left[i]} and ending before ${right[i]}: ${i - left[i]} × ${right[i] - i} = ${cnt[i]}`, rows: [a, s, [...shown]], tones: { ...range(left[i] + 1, right[i] - 1), [`0:${i}`]: "active", [`2:${i}`]: "active" } }); });
      let ans = 1;
      for (const i of [...a.keys()].sort((x, y) => a[y] - a[x])) { const take = Math.min(k, cnt[i]); for (let t = 0; t < take; t++) ans = (ans * a[i]) % 1000000007; k -= take; frames.push({ note: `largest left: ${a[i]}, use it ${take} time${take > 1 ? "s" : ""} → score ${ans}, ${k} operation${k === 1 ? "" : "s"} left`, rows: [a, s, cnt], tones: { [`0:${i}`]: "found", [`2:${i}`]: "found" } }); if (!k) break; }
      return cells(`Max score with k = 3: ${ans}`, [a, s, blank(n)], frames, ["nums", "prime score", "times"]);
    },
  },

  "all-elements-in-two-binary-search-trees": {
    approach: "An inorder walk of a BST is sorted, so walk both trees and merge the two sorted lists.",
    idea: ["Inorder (left, node, right) lists each tree's values in increasing order.", "Merge the two lists with two pointers, always taking the smaller head.", "Total work is linear in the number of nodes."],
    code: `def getAllElements(root1, root2):
    def inorder(node, out):
        if node:
            inorder(node.left, out)
            out.append(node.val)
            inorder(node.right, out)
        return out
    a, b = inorder(root1, []), inorder(root2, [])
    out, i, j = [], 0, 0
    while i < len(a) or j < len(b):
        if j == len(b) or (i < len(a) and a[i] <= b[j]):
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    return out`,
    lang: "python", time: "O(n + m)", space: "O(n + m)",
    viz: () => {
      const A = T([2, 1, 4]), B = T([1, 0, 3]), off = 10;
      const nodes: TNode[] = [...A.nodes, ...B.nodes.map((nd) => ({ ...nd, id: nd.id + off, parent: nd.parent == null ? null : nd.parent + off }))];
      const ino = (t: ReturnType<typeof T>, i: number | null, o: number, out: number[]) => { if (i == null) return out; ino(t, t.kids[i][0], o, out); out.push(i + o); ino(t, t.kids[i][1], o, out); return out; };
      const a = ino(A, 0, 0, []), b = ino(B, 0, off, []), lab = (id: number) => (id >= off ? B.val(id - off) : A.val(id));
      const frames: TreeFrame[] = [{ note: `inorder: tree 1 → [${a.map(lab).join(", ")}], tree 2 → [${b.map(lab).join(", ")}]`, tones: {} }], out: number[] = []; let i = 0, j = 0;
      while (i < a.length || j < b.length) { const takeA = j === b.length || (i < a.length && lab(a[i]) <= lab(b[j])); const id = takeA ? a[i++] : b[j++]; out.push(lab(id)); frames.push({ note: `take ${lab(id)} from tree ${takeA ? 1 : 2} → [${out.join(", ")}]`, tones: { [id]: "active" }, badges: { [id]: String(out.length) } }); }
      const badges: Record<number, string> = {}; return tree(`Merged: [${out.join(", ")}]`, nodes, trail(frames).map((f) => { Object.assign(badges, f.badges); return { ...f, badges: { ...badges } }; }));
    },
  },

  "keys-and-rooms": {
    approach: "DFS from room 0 following the keys you pick up; every room is reachable exactly when the DFS visits all of them.",
    idea: ["Rooms are nodes and each key is a directed edge to that room.", "Start at room 0, and from each newly opened room push its keys.", "Compare the number of visited rooms with the total."],
    code: `def canVisitAllRooms(rooms):
    seen, stack = {0}, [0]
    while stack:
        for key in rooms[stack.pop()]:
            if key not in seen:
                seen.add(key)
                stack.append(key)
    return len(seen) == len(rooms)`,
    lang: "python", time: "O(rooms + keys)", space: "O(rooms)",
    viz: () => {
      const rooms = [[1, 2], [3], [], [], [0]], nodes = [{ id: 0, label: "0", x: 30, y: 50 }, { id: 1, label: "1", x: 60, y: 20 }, { id: 2, label: "2", x: 60, y: 80 }, { id: 3, label: "3", x: 90, y: 20 }, { id: 4, label: "4", x: 5, y: 50 }];
      const edges = rooms.flatMap((ks, u) => ks.map((v) => ({ a: u, b: v, directed: true }))), seen = new Set([0]), stack = [0], frames: GraphFrame[] = [{ note: "room 0 is open; its keys go on the stack", tones: { 0: "found" } }], et: Record<string, Tone> = {};
      while (stack.length) { const u = stack.pop()!; const got: number[] = []; for (const v of rooms[u]) if (!seen.has(v)) { seen.add(v); stack.push(v); got.push(v); et[ek(u, v)] = "found"; } frames.push({ note: `open room ${u}: ${rooms[u].length ? `keys [${rooms[u].join(", ")}]` : "no keys"}${got.length ? `, new rooms ${got.join(", ")}` : ""}; stack [${stack.join(", ")}]`, tones: { ...tones([...seen], "found"), [u]: "active" }, edgeTones: { ...et } }); }
      const ok = seen.size === rooms.length;
      frames.push({ note: ok ? "every room was opened → true" : `room ${[...rooms.keys()].filter((r) => !seen.has(r)).join(", ")} never opened (nobody holds its key) → false`, tones: { ...tones([...seen], "found"), ...tones([...rooms.keys()].filter((r) => !seen.has(r)), "bad") }, edgeTones: { ...et } });
      return { kind: "graph", title: `Can visit all rooms: ${ok}`, nodes, edges, frames };
    },
  },

  "top-k-frequent-words": {
    approach: "Count words, then sort by (higher count first, then alphabetical) and take the first k.",
    idea: ["A Counter gives each word's frequency in one pass.", "Sort key (-count, word) puts frequent words first and breaks ties alphabetically.", "heapq.nsmallest with the same key does it in O(n log k)."],
    code: `from collections import Counter
import heapq
def topKFrequent(words, k):
    cnt = Counter(words)
    return heapq.nsmallest(k, cnt, key=lambda w: (-cnt[w], w))`,
    lang: "python", time: "O(n log k)", space: "O(n)",
    viz: () => {
      const words = ["the", "day", "is", "sunny", "the", "the", "the", "sunny", "is", "is"], k = 4, distinct = [...new Set(words)], cnt = new Map<string, number>(), frames: TableFrame[] = [];
      const cellsOf = (rank: Map<string, number>) => distinct.map((w) => [cnt.get(w) ?? 0, rank.get(w) ?? null]);
      words.forEach((w) => { cnt.set(w, (cnt.get(w) || 0) + 1); frames.push({ note: `"${w}" seen ${cnt.get(w)} time${cnt.get(w) === 1 ? "" : "s"}`, cells: cellsOf(new Map()), active: [distinct.indexOf(w), 0] }); });
      const order = [...distinct].sort((a, b) => cnt.get(b)! - cnt.get(a)! || (a < b ? -1 : 1)), rank = new Map<string, number>();
      order.slice(0, k).forEach((w, i) => { rank.set(w, i + 1); frames.push({ note: `rank ${i + 1}: "${w}" (${cnt.get(w)})${i && cnt.get(w) === cnt.get(order[i - 1]) ? ", tie broken alphabetically" : ""}`, cells: cellsOf(rank), active: [distinct.indexOf(w), 1], tones: keys(order.slice(0, i).map((x) => `${distinct.indexOf(x)}:1`), "found") }); });
      return { kind: "table", title: `Top ${k}: ${order.slice(0, k).join(", ")}`, rowHead: distinct, colHead: ["count", "rank"], frames };
    },
  },

  "number-of-flowers-in-full-bloom": {
    approach: "Sort start days and end days separately; at time t, blooming = (starts ≤ t) - (ends < t), each found by binary search.",
    idea: ["A flower blooms at t when start ≤ t ≤ end.", "Flowers that started by t: bisect_right(starts, t). Of those, the ones already over: bisect_left(ends, t) (end strictly before t).", "The difference is the answer for each person, in O(log n)."],
    code: `from bisect import bisect_left, bisect_right
def fullBloomFlowers(flowers, people):
    starts = sorted(s for s, _ in flowers)
    ends = sorted(e for _, e in flowers)
    return [bisect_right(starts, t) - bisect_left(ends, t) for t in people]`,
    lang: "python", time: "O((n + m) log n)", space: "O(n)",
    viz: () => {
      const fl: [number, number][] = [[1, 6], [3, 7], [9, 12], [4, 13]], people = [2, 3, 7, 11], st = fl.map((f) => f[0]).sort((a, b) => a - b), en = fl.map((f) => f[1]).sort((a, b) => a - b), frames: IntervalsFrame[] = [], out: number[] = [];
      for (const t of people) { const started = st.filter((s) => s <= t).length, over = en.filter((e) => e < t).length; out.push(started - over); frames.push({ note: `t = ${t}: ${started} started, ${over} already ended → ${started - over} blooming`, line: t, tones: Object.fromEntries(fl.map(([s, e], i) => [i, s <= t && t <= e ? "found" : s > t ? "muted" : "done"])) as Record<number, Tone> }); }
      return { kind: "intervals", title: `Blooming counts: [${out.join(", ")}]`, items: fl, frames };
    },
  },

  "number-of-provinces": {
    approach: "Each DFS from an unvisited city marks its whole connected group; the number of DFS starts is the number of provinces.",
    idea: ["isConnected is an adjacency matrix of an undirected graph.", "Loop over cities; when one is unvisited, it starts a new province, and DFS marks everything reachable.", "Count the starts."],
    code: `def findCircleNum(isConnected):
    n = len(isConnected)
    seen = [False] * n
    def dfs(u):
        seen[u] = True
        for v in range(n):
            if isConnected[u][v] and not seen[v]:
                dfs(v)
    provinces = 0
    for u in range(n):
        if not seen[u]:
            provinces += 1
            dfs(u)
    return provinces`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const n = 6, pairs = [[0, 1], [1, 2], [3, 4]], M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j || pairs.some(([a, b]) => (a === i && b === j) || (a === j && b === i)) ? 1 : 0)));
      const nodes = [{ id: 0, label: "0", x: 10, y: 25 }, { id: 1, label: "1", x: 30, y: 75 }, { id: 2, label: "2", x: 45, y: 20 }, { id: 3, label: "3", x: 65, y: 70 }, { id: 4, label: "4", x: 85, y: 25 }, { id: 5, label: "5", x: 95, y: 80 }];
      const seen = Array(n).fill(false), frames: GraphFrame[] = [], tn: Record<number, Tone> = {}, et: Record<string, Tone> = {}; let prov = 0;
      const dfs = (u: number) => { seen[u] = true; tn[u] = "found"; frames.push({ note: `province ${prov}: visit city ${u}`, tones: { ...tn, [u]: "active" }, edgeTones: { ...et }, badges: { [u]: `P${prov}` } }); for (let v = 0; v < n; v++) if (M[u][v] && !seen[v]) { et[ek(u, v)] = "found"; dfs(v); } };
      for (let u = 0; u < n; u++) if (!seen[u]) { prov++; dfs(u); }
      frames.push({ note: `${prov} DFS starts → ${prov} provinces`, tones: { ...tn }, edgeTones: { ...et } });
      return { kind: "graph", title: `Provinces: ${prov}`, nodes, edges: pairs.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "maximum-xor-of-two-numbers-in-an-array": {
    approach: "Build the answer bit by bit from the top: keep a bit set if some two numbers' prefixes XOR to the answer-so-far with that bit on.",
    idea: ["Greedy from the highest bit: a 1 there beats anything in the lower bits.", "Put every number's top bits (x >> b) in a set. The candidate ans | 1 is reachable when some prefix p has p ^ candidate also in the set (because a ^ b = c ⇔ a ^ c = b).", "Keep the bit if reachable, then move to the next bit."],
    code: `def findMaximumXOR(nums):
    ans = 0
    for b in range(max(nums).bit_length() - 1, -1, -1):
        ans <<= 1
        prefixes = {x >> b for x in nums}
        cand = ans | 1
        if any(cand ^ p in prefixes for p in prefixes):
            ans = cand
    return ans`,
    lang: "python", time: "O(n · bits)", space: "O(n)",
    viz: () => {
      const a = [3, 10, 5, 25, 2, 8], top = Math.max(...a).toString(2).length, rows: (string | number | null)[][] = [], frames: TableFrame[] = []; let ans = 0;
      for (let b = top - 1; b >= 0; b--) {
        ans <<= 1; const pre = a.map((x) => x >> b), set = new Set(pre), cand = ans | 1, hit = pre.find((p) => set.has(cand ^ p)); if (hit != null) ans = cand;
        rows.push(pre.map((p) => p.toString(2))); const r = rows.length - 1, j1 = hit == null ? -1 : pre.indexOf(hit), j2 = hit == null ? -1 : pre.indexOf(hit ^ cand);
        frames.push({ note: `bit ${b}: want ${cand.toString(2)}. ${hit != null ? `${hit.toString(2)} ^ ${(hit ^ cand).toString(2)} = ${cand.toString(2)} (${a[j1]} and ${a[j2]}), keep the 1` : "no pair gives it, this bit is 0"} → answer so far ${ans.toString(2)}`, cells: [...rows.map((x) => [...x]), ...Array.from({ length: top - rows.length }, () => a.map(() => null))], tones: hit != null ? keys([`${r}:${j1}`, `${r}:${j2}`], "found") : keys(a.map((_, j) => `${r}:${j}`), "muted") });
      }
      return { kind: "table", title: `Max XOR of [${a.join(", ")}] = ${ans}`, rowHead: Array.from({ length: top }, (_, i) => `bit ${top - 1 - i}`), colHead: a.map(String), frames };
    },
  },
  "minimum-number-of-refueling-stops": {
    approach: "Drive as far as the fuel allows, remembering every station passed in a max-heap; when stuck, refuel (after the fact) from the biggest one.",
    idea: ["Stopping at a station can be decided later: once you pass it, it is an option you can cash in.", "Whenever the fuel cannot reach the next point, the best stop to have made is the passed station with the most fuel.", "If no passed station is left, the target is out of reach."],
    code: `import heapq
def minRefuelStops(target, startFuel, stations):
    heap, fuel, stops, i = [], startFuel, 0, 0
    while fuel < target:
        while i < len(stations) and stations[i][0] <= fuel:
            heapq.heappush(heap, -stations[i][1])
            i += 1
        if not heap:
            return -1
        fuel -= heapq.heappop(heap)
        stops += 1
    return stops`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const target = 100, st = [[10, 60], [20, 30], [30, 30], [60, 40]], heap: number[] = [], frames: StackFrame[] = []; let fuel = 10, stops = 0, i = 0;
      const show = () => [...heap].sort((a, b) => a - b).map((f) => `${f} fuel`);
      while (fuel < target) {
        const passed: number[] = []; while (i < st.length && st[i][0] <= fuel) { heap.push(st[i][1]); passed.push(st[i][0]); i++; }
        if (passed.length) frames.push({ note: `fuel reaches mile ${fuel}: pass station${passed.length > 1 ? "s" : ""} at ${passed.join(", ")} and remember ${passed.length > 1 ? "them" : "it"}`, items: show(), side: `stops: ${stops}` });
        if (!heap.length) { frames.push({ note: "stuck and no station left to use → -1", items: [], side: `stops: ${stops}` }); break; }
        heap.sort((a, b) => a - b); const best = heap.pop()!; fuel += best; stops++;
        frames.push({ note: `cannot reach ${target}: use the biggest passed station (+${best}) → can reach mile ${fuel}`, items: show(), popped: [best], side: `stops: ${stops}` });
      }
      return { kind: "stack", title: `Target ${target} from 10 fuel: ${stops} stops`, frames };
    },
  },

  "the-skyline-problem": {
    approach: "Sweep x from left to right over building starts and ends, keeping live heights in a max-heap; record a point whenever the tallest live height changes.",
    idea: ["Events: each building starts at its left edge and stops counting at its right edge.", "At each x, push the buildings that start there and lazily drop heap tops whose right edge is ≤ x.", "The skyline height is the heap top (0 if empty). Output [x, height] only when it differs from the last height."],
    code: `import heapq
def getSkyline(buildings):
    events = sorted([(l, -h, r) for l, r, h in buildings] + [(r, 0, 0) for _, r, _ in buildings])
    res, heap = [[0, 0]], [(0, float("inf"))]
    for x, negH, r in events:
        while heap[0][1] <= x:
            heapq.heappop(heap)
        if negH:
            heapq.heappush(heap, (negH, r))
        if res[-1][1] != -heap[0][0]:
            res.append([x, -heap[0][0]])
    return res[1:]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const b = [[2, 9, 10], [3, 7, 15], [5, 12, 12], [15, 20, 10], [19, 24, 8]], items = b.map(([l, r]) => [l, r] as [number, number]);
      const ev = [...b.map(([l, r, h], i) => [l, -h, r, i]), ...b.map(([, r]) => [r, 0, 0, -1])].sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
      let heap: [number, number, number][] = [], last = 0; const res: number[][] = [], frames: IntervalsFrame[] = [];
      for (const [x, nh, r, i] of ev) {
        heap = heap.filter((e) => e[1] > x); if (nh) heap.push([-nh, r, i]); heap.sort((p, q) => q[0] - p[0]);
        const h = heap.length ? heap[0][0] : 0, changed = h !== last; if (changed) { res.push([x, h]); last = h; }
        frames.push({ note: `x = ${x}: ${nh ? `building of height ${-nh} starts` : "a building ends"}; tallest live height ${h}${changed ? ` → key point [${x}, ${h}]` : ", no change"}`, line: x, tones: { ...tones(heap.map((e) => e[2]), "window"), ...(heap.length ? { [heap[0][2]]: "found" as Tone } : {}) } });
      }
      return { kind: "intervals", title: `Skyline: ${res.map((p) => `[${p.join(",")}]`).join(" ")}`, items, frames };
    },
  },

  "my-calendar-ii": {
    approach: "Keep every booking and every double-booked overlap; a new event fails if it hits an overlap, otherwise its overlaps with bookings become new double-booked spans.",
    idea: ["A triple booking happens exactly when the new event intersects a span that is already double-booked.", "Two half-open ranges [a, b) and [c, d) intersect when a < d and c < b; the shared part is [max(a, c), min(b, d)).", "If the event is accepted, add its intersections with earlier bookings to the overlap list."],
    code: `class MyCalendarTwo:
    def __init__(self):
        self.booked, self.overlaps = [], []

    def book(self, start, end):
        for s, e in self.overlaps:
            if start < e and s < end:
                return False
        for s, e in self.booked:
            if start < e and s < end:
                self.overlaps.append((max(s, start), min(e, end)))
        self.booked.append((start, end))
        return True`,
    lang: "python", time: "O(n) per booking", space: "O(n)",
    viz: () => {
      const items: [number, number][] = [[10, 20], [50, 60], [10, 40], [5, 15], [5, 10], [25, 55]], booked: number[] = [], over: [number, number][] = [], frames: IntervalsFrame[] = [];
      items.forEach(([s, e], i) => {
        const hit = over.find(([a, b]) => s < b && a < e);
        if (hit) { frames.push({ note: `book(${s}, ${e}) hits double-booked [${hit[0]}, ${hit[1]}) → false`, tones: { ...tones(booked, "done"), [i]: "bad" }, result: [...over] }); return; }
        const added: string[] = []; for (const j of booked) { const [a, b] = items[j]; if (s < b && a < e) { over.push([Math.max(a, s), Math.min(b, e)]); added.push(`[${Math.max(a, s)}, ${Math.min(b, e)})`); } }
        booked.push(i); frames.push({ note: `book(${s}, ${e}) → true${added.length ? `; now double-booked: ${added.join(", ")}` : ""}`, tones: { ...tones(booked, "done"), [i]: "found" }, result: [...over] });
      });
      return { kind: "intervals", title: "MyCalendarTwo: out row = double-booked spans", items, frames };
    },
  },

  "reverse-pairs": {
    approach: "Merge sort; before merging two sorted halves, count pairs left > 2 · right with a pointer that only moves forward.",
    idea: ["Every pair (i < j) ends up split across the two halves at exactly one merge step.", "Both halves are sorted, so for increasing left values the number of right values with v > 2·r only grows: one forward pointer counts them.", "Then merge as usual so the parent level gets a sorted list."],
    code: `def reversePairs(nums):
    def sort(a):
        if len(a) <= 1:
            return a, 0
        m = len(a) // 2
        L, x = sort(a[:m])
        R, y = sort(a[m:])
        cnt, j = x + y, 0
        for v in L:
            while j < len(R) and v > 2 * R[j]:
                j += 1
            cnt += j
        merged, i, k = [], 0, 0
        while i < len(L) or k < len(R):
            if k == len(R) or (i < len(L) and L[i] <= R[k]):
                merged.append(L[i]); i += 1
            else:
                merged.append(R[k]); k += 1
        return merged, cnt
    return sort(nums)[1]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [2, 4, 3, 5, 1], cur = [...a], frames: CellsFrame[] = []; let total = 0;
      const sort = (lo: number, hi: number) => { if (hi - lo <= 1) return; const m = (lo + hi) >> 1; sort(lo, m); sort(m, hi); const L = cur.slice(lo, m), R = cur.slice(m, hi); let j = 0, c = 0; const pairs: string[] = []; for (const v of L) { while (j < R.length && v > 2 * R[j]) j++; c += j; R.slice(0, j).forEach((r) => pairs.push(`${v} > 2·${r}`)); } total += c; cur.splice(lo, hi - lo, ...[...L, ...R].sort((p, q) => p - q)); frames.push({ note: `merge [${L.join(", ")}] + [${R.join(", ")}]: ${c ? pairs.join(", ") : "no pairs"} → +${c} (total ${total})`, rows: [[...cur]], tones: { ...range(lo, m - 1), ...range(m, hi - 1, 0, "active") } }); };
      sort(0, a.length);
      return cells(`Reverse pairs in [${a.join(", ")}]: ${total}`, [a], frames);
    },
  },

  "sort-the-jumbled-numbers": {
    approach: "Sort by each number's mapped value; Python's sort is stable, so equal mapped values keep their input order.",
    idea: ["Map every digit through mapping and read the result as an integer (leading zeros vanish).", "Use that as the sort key.", "Stability handles ties, which the problem requires."],
    code: `def sortJumbled(mapping, nums):
    def key(x):
        return int("".join(str(mapping[int(d)]) for d in str(x)))
    return sorted(nums, key=key)`,
    lang: "python", time: "O(n log n · digits)", space: "O(n)",
    viz: () => {
      const map = [8, 9, 4, 0, 2, 1, 3, 5, 7, 6], nums = [991, 338, 38, 10], key = (x: number) => Number([...String(x)].map((d) => map[+d]).join("")), frames: TableFrame[] = [], rows: (string | number | null)[][] = nums.map(() => [null, null]);
      nums.forEach((x, i) => { rows[i][0] = key(x); frames.push({ note: `${x}: digits ${[...String(x)].map((d) => `${d}→${map[+d]}`).join(", ")} → ${key(x)}`, cells: rows.map((r) => [...r]), active: [i, 0] }); });
      const order = [...nums.keys()].sort((p, q) => key(nums[p]) - key(nums[q]));
      order.forEach((i, r) => { rows[i][1] = r + 1; frames.push({ note: `position ${r + 1}: ${nums[i]} (key ${key(nums[i])})${r && key(nums[order[r - 1]]) === key(nums[i]) ? ", tie kept in input order" : ""}`, cells: rows.map((x) => [...x]), active: [i, 1] }); });
      return { kind: "table", title: `Sorted: [${order.map((i) => nums[i]).join(", ")}]`, rowHead: nums.map(String), colHead: ["mapped", "order"], frames };
    },
  },

  "maximum-width-ramp": {
    approach: "Keep a stack of indices with strictly decreasing values (the only useful left ends), then scan j from the right and pop every left end with value ≤ nums[j].",
    idea: ["A left end i is only worth using if no earlier index has a smaller or equal value, so the candidates form a decreasing sequence.", "Scanning j from the right, if nums[top] ≤ nums[j], (top, j) is a ramp, and no later (smaller) j could do better for that top, so pop it.", "Each index is pushed and popped once."],
    code: `def maxWidthRamp(nums):
    st = []
    for i, x in enumerate(nums):
        if not st or nums[st[-1]] > x:
            st.append(i)
    best = 0
    for j in range(len(nums) - 1, -1, -1):
        while st and nums[st[-1]] <= nums[j]:
            best = max(best, j - st.pop())
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [6, 0, 8, 2, 1, 5], st: number[] = [], frames: CellsFrame[] = []; let best = 0;
      a.forEach((x, i) => { if (!st.length || a[st[st.length - 1]] > x) st.push(i); });
      frames.push({ note: `left-end candidates (decreasing values): indices [${st.join(", ")}]`, tones: keys(st.map((i) => `0:${i}`), "window") });
      for (let j = a.length - 1; j >= 0; j--) { const got: string[] = []; while (st.length && a[st[st.length - 1]] <= a[j]) { const i = st.pop()!; best = Math.max(best, j - i); got.push(`(${i}, ${j}) width ${j - i}`); } frames.push({ note: `j = ${j} (${a[j]}): ${got.length ? `ramps ${got.join(", ")}` : "no candidate ≤ it"} → best ${best}`, tones: { ...keys(st.map((i) => `0:${i}`), "window"), [`0:${j}`]: "active" }, marks: [{ i: j, label: "j" }] }); if (!st.length) break; }
      return cells(`Max width ramp: ${best}`, [a], frames);
    },
  },

  "even-odd-tree": {
    approach: "BFS level by level: even levels need odd values strictly increasing, odd levels need even values strictly decreasing.",
    idea: ["Process one level at a time using the queue size.", "Track the previous value on the level and check both the parity and the order.", "Fail at the first violation."],
    code: `from collections import deque
def isEvenOddTree(root):
    q, level = deque([root]), 0
    while q:
        prev = None
        for _ in range(len(q)):
            node = q.popleft()
            v = node.val
            if level % 2 == 0:
                if v % 2 == 0 or (prev is not None and v <= prev):
                    return False
            else:
                if v % 2 == 1 or (prev is not None and v >= prev):
                    return False
            prev = v
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        level += 1
    return True`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals = [1, 10, 4, 3, null, 7, 9, 12, 8, null, null, 6, null, null, 2], { nodes, kids, val } = T(vals), frames: TreeFrame[] = []; let q = [0], lv = 0, ok = true;
      while (q.length && ok) { let prev: number | null = null; const nxt: number[] = []; for (const i of q) { const v = val(i), good = lv % 2 === 0 ? v % 2 === 1 && (prev == null || v > prev) : v % 2 === 0 && (prev == null || v < prev); frames.push({ note: `level ${lv} (${lv % 2 ? "even values, decreasing" : "odd values, increasing"}): ${v}${prev != null ? ` after ${prev}` : ""} ${good ? "fits" : "breaks the rule"}`, tones: { [i]: good ? "active" : "bad" } }); if (!good) { ok = false; break; } prev = v; kids[i].forEach((c) => c != null && nxt.push(c)); } q = nxt; lv++; }
      return tree(`Even-odd tree: ${ok}`, nodes, trail(frames));
    },
  },

  "subarrays-with-k-different-integers": {
    approach: "exactly(k) = atMost(k) - atMost(k - 1), and atMost is a sliding window that counts every subarray ending at each right end.",
    idea: ["Counting 'exactly k distinct' directly is awkward, but 'at most k' is a standard shrinking window.", "For each right end, after shrinking until at most k distinct remain, all right - left + 1 starts are valid.", "Subtract the at-most-(k-1) count to keep only subarrays with exactly k."],
    code: `def subarraysWithKDistinct(nums, k):
    def atMost(k):
        cnt, left, res = {}, 0, 0
        for right, x in enumerate(nums):
            cnt[x] = cnt.get(x, 0) + 1
            while len(cnt) > k:
                y = nums[left]
                cnt[y] -= 1
                if cnt[y] == 0:
                    del cnt[y]
                left += 1
            res += right - left + 1
        return res
    return atMost(k) - atMost(k - 1)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 1, 2, 3], k = 2, frames: CellsFrame[] = [];
      const atMost = (kk: number) => { const cnt = new Map<number, number>(); let left = 0, res = 0; a.forEach((x, r) => { cnt.set(x, (cnt.get(x) || 0) + 1); while (cnt.size > kk) { const y = a[left]; cnt.set(y, cnt.get(y)! - 1); if (!cnt.get(y)) cnt.delete(y); left++; } res += r - left + 1; frames.push({ note: `at most ${kk}: window [${left}..${r}] has ${cnt.size} distinct → +${r - left + 1} (sum ${res})`, tones: { ...range(left, r), [`0:${r}`]: "active" }, marks: [{ i: left, label: "L" }, { i: r, label: "R" }] }); }); return res; };
      const x = atMost(k), y = atMost(k - 1);
      frames.push({ note: `exactly ${k} = ${x} - ${y} = ${x - y}`, tones: range(0, a.length - 1, 0, "found") });
      return cells(`Subarrays with exactly ${k} distinct: ${x - y}`, [a], frames);
    },
  },

  "diagonal-traverse-ii": {
    approach: "Every cell on one anti-diagonal shares i + j; bucket cells by i + j, reading rows from the bottom up so each bucket is already in output order.",
    idea: ["The required order visits diagonals d = 0, 1, 2, … and within each goes from bottom-left to top-right.", "Visiting rows from last to first and appending to bucket i + j produces exactly that inner order.", "Only real cells are touched, which matters because rows can be very ragged."],
    code: `def findDiagonalOrder(nums):
    groups = {}
    for i in range(len(nums) - 1, -1, -1):
        for j, x in enumerate(nums[i]):
            groups.setdefault(i + j, []).append(x)
    return [x for d in sorted(groups) for x in groups[d]]`,
    lang: "python", time: "O(cells)", space: "O(cells)",
    viz: () => {
      const m = [[1, 2, 3, 4, 5], [6, 7], [8], [9, 10, 11]], W = 5, frames: TableFrame[] = [], out: number[] = [], done: string[] = [];
      const shown = m.map((r) => [...r, ...Array(W - r.length).fill(null)] as (number | null)[]), groups = new Map<number, [number, number][]>();
      for (let i = m.length - 1; i >= 0; i--) m[i].forEach((_, j) => groups.set(i + j, [...(groups.get(i + j) || []), [i, j]]));
      [...groups.keys()].sort((p, q) => p - q).forEach((d) => { const g = groups.get(d)!; g.forEach(([i, j]) => out.push(m[i][j])); frames.push({ note: `diagonal i + j = ${d}: ${g.map(([i, j]) => m[i][j]).join(", ")} → [${out.join(", ")}]`, cells: shown, tones: { ...keys(done, "done"), ...keys(g.map(([i, j]) => `${i}:${j}`), "found") } }); done.push(...g.map(([i, j]) => `${i}:${j}`)); });
      return { kind: "table", title: `Diagonal order: [${out.join(", ")}]`, rowHead: heads(m.length, "r"), colHead: heads(W), frames };
    },
  },

  "flatten-binary-tree-to-linked-list": {
    approach: "At each node with a left child, hang the right subtree off the rightmost node of the left subtree, move the left subtree to the right, then step right.",
    idea: ["In preorder, the right subtree comes right after the last node of the left subtree, which is the left subtree's rightmost node.", "So link that node's right to node.right, set node.right = node.left and clear node.left.", "Repeat at the next node to the right. O(1) extra space, every edge walked a constant number of times."],
    code: `def flatten(root):
    node = root
    while node:
        if node.left:
            pre = node.left
            while pre.right:
                pre = pre.right
            pre.right = node.right
            node.right = node.left
            node.left = None
        node = node.right`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      // tree [1,2,5,3,4,null,6]; ids are preorder positions, so value v sits at id v - 1
      const left = [1, 2, -1, -1, -1, -1], right = [4, 3, -1, -1, 5, -1], frames: ListFrame[] = [];
      const lefts = () => left.map((l, i) => (l >= 0 ? `${i + 1}.left = ${l + 1}` : "")).filter(Boolean).join(", ") || "none";
      frames.push({ note: `right pointers drawn; left children: ${lefts()}`, next: [...right], ptrs: [{ i: 0, label: "node" }] });
      let node = 0;
      while (node >= 0) { if (left[node] >= 0) { let pre = left[node]; while (right[pre] >= 0) pre = right[pre]; right[pre] = right[node]; right[node] = left[node]; left[node] = -1; frames.push({ note: `node ${node + 1}: rightmost of its left subtree is ${pre + 1}; ${pre + 1}.right = old right, ${node + 1}.right = its left child; left children now: ${lefts()}`, next: [...right], ptrs: [{ i: node, label: "node" }, { i: pre, label: "pre" }], tones: { [node]: "active", [pre]: "window" } }); } node = right[node]; }
      frames.push({ note: "every node now has only a right pointer, in preorder", next: [...right], ptrs: [], tones: tones([0, 1, 2, 3, 4, 5], "found") });
      return { kind: "list", title: "Flatten [1,2,5,3,4,null,6] in place", values: [1, 2, 3, 4, 5, 6], frames };
    },
  },

  "count-number-of-bad-pairs": {
    approach: "A pair is good when nums[i] - i == nums[j] - j; count good pairs with a hash map and subtract them from all n·(n-1)/2 pairs.",
    idea: ["j - i == nums[j] - nums[i] rearranges to nums[i] - i == nums[j] - j.", "While scanning, each earlier index with the same key forms a good pair.", "Bad pairs = total pairs - good pairs."],
    code: `def countBadPairs(nums):
    seen, good = {}, 0
    for i, x in enumerate(nums):
        good += seen.get(x - i, 0)
        seen[x - i] = seen.get(x - i, 0) + 1
    n = len(nums)
    return n * (n - 1) // 2 - good`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [4, 1, 3, 3, 5], d = a.map((x, i) => x - i), shown: (string | number)[] = blank(a.length), seen = new Map<number, number>(), frames: CellsFrame[] = []; let good = 0;
      a.forEach((_, i) => { const c = seen.get(d[i]) || 0; good += c; seen.set(d[i], c + 1); shown[i] = d[i]; frames.push({ note: `nums[${i}] - ${i} = ${d[i]}, matches ${c} earlier → good pairs ${good}`, rows: [a, [...shown]], tones: { [`1:${i}`]: "active", ...keys(d.slice(0, i).map((v, j) => (v === d[i] ? `1:${j}` : "")).filter(Boolean), "found") } }); });
      const n = a.length, bad = (n * (n - 1)) / 2 - good;
      frames.push({ note: `${n} · ${n - 1} / 2 = ${(n * (n - 1)) / 2} pairs, ${good} good → ${bad} bad`, rows: [a, d] });
      return cells(`Bad pairs: ${bad}`, [a, blank(n)], frames, ["nums", "nums[i] - i"]);
    },
  },

  "minimum-number-of-arrows-to-burst-balloons": {
    approach: "Sort balloons by end; shoot at the end of the first unburst balloon, which also bursts every balloon that starts by then.",
    idea: ["The balloon that ends first must be hit somewhere in its range, and its end point is the choice that reaches furthest right.", "Every following balloon that starts at or before that point is burst by the same arrow.", "The first balloon starting after it needs a new arrow at its own end."],
    code: `def findMinArrowShots(points):
    points.sort(key=lambda p: p[1])
    arrows, x = 0, float("-inf")
    for s, e in points:
        if s > x:
            arrows += 1
            x = e
    return arrows`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const items = ([[10, 16], [2, 8], [1, 6], [7, 12]] as [number, number][]).sort((p, q) => p[1] - q[1]), frames: IntervalsFrame[] = [], tn: Record<number, Tone> = {}; let arrows = 0, x = -1;
      items.forEach(([s, e], i) => { if (s > x || arrows === 0) { arrows++; x = e; tn[i] = "found"; frames.push({ note: `[${s}, ${e}] starts after the last arrow: arrow ${arrows} at x = ${e}`, tones: { ...tn, [i]: "active" }, line: x }); } else { tn[i] = "done"; frames.push({ note: `[${s}, ${e}] starts at ${s} ≤ ${x}: already burst by arrow ${arrows}`, tones: { ...tn }, line: x }); } });
      return { kind: "intervals", title: `Arrows needed: ${arrows}`, items, frames };
    },
  },
  "next-greater-element-ii": {
    approach: "Monotonic stack of indices waiting for a bigger value, walking the array twice so the search wraps around.",
    idea: ["Keep indices whose next greater value is still unknown; their values decrease from bottom to top.", "When a bigger value arrives, it is the answer for every smaller value on top: pop them.", "A second lap (i from n to 2n - 1, using i % n) lets values near the end find answers at the start. Only push during the first lap."],
    code: `def nextGreaterElements(nums):
    n = len(nums)
    res, st = [-1] * n, []
    for i in range(2 * n):
        x = nums[i % n]
        while st and nums[st[-1]] < x:
            res[st.pop()] = x
        if i < n:
            st.append(i)
    return res`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 3, 4, 3], n = a.length, res = Array(n).fill(-1), st: number[] = [], frames: StackFrame[] = [];
      for (let i = 0; i < 2 * n; i++) { const x = a[i % n], popped: number[] = []; while (st.length && a[st[st.length - 1]] < x) { const j = st.pop()!; res[j] = x; popped.push(a[j]); } if (i < n) st.push(i); frames.push({ note: `${i < n ? "" : "lap 2, "}i = ${i % n} (${x}): ${popped.length ? `answer ${x} for ${popped.join(", ")}` : "nothing smaller waiting"}; res = [${res.join(", ")}]`, items: st.map((j) => a[j]), incoming: i < n ? x : undefined, popped, side: `res [${res.join(", ")}]` }); }
      return { kind: "stack", title: `Next greater (circular): [${res.join(", ")}]`, input: a, frames };
    },
  },

  "sum-of-nodes-with-even-valued-grandparent": {
    approach: "DFS passing down the parent's and grandparent's values; add a node when its grandparent's value is even.",
    idea: ["A node cannot see its grandparent, but the grandparent can be passed down two levels.", "Call dfs(child, node.val, parent) so the roles shift by one each level.", "Start with odd placeholders (1, 1) so the root and its children never count."],
    code: `def sumEvenGrandparent(root):
    def dfs(node, parent, grand):
        if not node:
            return 0
        here = node.val if grand % 2 == 0 else 0
        return here + dfs(node.left, node.val, parent) + dfs(node.right, node.val, parent)
    return dfs(root, 1, 1)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [6, 7, 8, 2, 7, 1, 3, 9, null, 1, 4, null, null, null, 5], { nodes, kids, val } = T(vals), frames: TreeFrame[] = []; let total = 0;
      const dfs = (i: number | null, p: number | null, g: number | null) => { if (i == null) return; const hit = g != null && g % 2 === 0; if (hit) total += val(i); frames.push({ note: g == null ? `${val(i)}: no grandparent yet` : `${val(i)}: grandparent ${g} ${hit ? `is even → add, total ${total}` : "is odd"}`, tones: { [i]: hit ? "found" : "active" }, badges: hit ? { [i]: "+" + val(i) } : {} }); dfs(kids[i][0], val(i), p); dfs(kids[i][1], val(i), p); };
      dfs(0, null, null);
      const badges: Record<number, string> = {};
      return tree(`Sum with even grandparent: ${total}`, nodes, trail(frames, "muted").map((f) => { Object.assign(badges, f.badges); return { ...f, badges: { ...badges } }; }));
    },
  },

  "redundant-connection-ii": {
    approach: "Find a node with two parents (two candidate edges); then union-find without the later candidate. A cycle means the earlier candidate (or the cycle edge) is the extra one.",
    idea: ["The extra edge either gives some node two parents, makes a cycle, or both.", "If a node has two parents, skip the second edge and union the rest: if no cycle appears, the second edge was extra; if a cycle appears, the first one was.", "If no node has two parents, the edge that closes a cycle is the answer."],
    code: `def findRedundantDirectedConnection(edges):
    n = len(edges)
    parent = [0] * (n + 1)
    cand1 = cand2 = None
    for u, v in edges:
        if parent[v]:
            cand1, cand2 = [parent[v], v], [u, v]
        else:
            parent[v] = u
    uf = list(range(n + 1))
    def find(x):
        while uf[x] != x:
            uf[x] = uf[uf[x]]
            x = uf[x]
        return x
    for u, v in edges:
        if [u, v] == cand2:
            continue
        ru, rv = find(u), find(v)
        if ru == rv:
            return cand1 if cand1 else [u, v]
        uf[rv] = ru
    return cand2`,
    lang: "python", time: "O(n α(n))", space: "O(n)",
    viz: () => {
      const E = [[2, 1], [3, 1], [4, 2], [1, 4]], nodes = [{ id: 1, label: "1", x: 50, y: 50 }, { id: 2, label: "2", x: 20, y: 15 }, { id: 3, label: "3", x: 85, y: 20 }, { id: 4, label: "4", x: 20, y: 85 }].map((nd) => ({ ...nd, id: nd.id - 1 }));
      const par = Array(5).fill(0), frames: GraphFrame[] = []; let c1: number[] | null = null, c2: number[] | null = null;
      for (const [u, v] of E) { if (par[v]) { c1 = [par[v], v]; c2 = [u, v]; frames.push({ note: `${v} already has parent ${par[v]}, now ${u} too: candidates [${c1.join(",")}] and [${c2.join(",")}]`, tones: { [v - 1]: "bad" }, edgeTones: { [ek(c1[0] - 1, v - 1)]: "bad", [ek(u - 1, v - 1)]: "bad" } }); } else par[v] = u; }
      const uf = [0, 1, 2, 3, 4], find = (x: number): number => (uf[x] === x ? x : (uf[x] = find(uf[x]))), et: Record<string, Tone> = {}; let ans: number[] = c2!;
      for (const [u, v] of E) { if (c2 && u === c2[0] && v === c2[1]) { frames.push({ note: `skip candidate [${u},${v}] for now`, edgeTones: { ...et, [ek(u - 1, v - 1)]: "muted" } }); continue; } const ru = find(u), rv = find(v); if (ru === rv) { ans = c1 ?? [u, v]; frames.push({ note: `${u} → ${v} closes a cycle with [${c2!.join(",")}] left out, so the earlier candidate [${ans.join(",")}] must go`, edgeTones: { ...et, [ek(u - 1, v - 1)]: "active", [ek(ans[0] - 1, ans[1] - 1)]: "bad" } }); break; } uf[rv] = ru; et[ek(u - 1, v - 1)] = "found"; frames.push({ note: `${u} → ${v}: different groups, join them`, edgeTones: { ...et } }); }
      return { kind: "graph", title: `Remove [${ans.join(", ")}]`, nodes, edges: E.map(([a, b]) => ({ a: a - 1, b: b - 1, directed: true })), frames };
    },
  },

  "find-all-people-with-secret": {
    approach: "Process meetings grouped by time with union-find: join everyone meeting at that time, then undo the joins for people who did not end up connected to person 0.",
    idea: ["Within one time, the secret spreads through any chain of meetings, so union all pairs at that time.", "After the group, someone not connected to 0 learned nothing; reset them so a later meeting does not use a stale link.", "At the end, everyone connected to 0 knows the secret."],
    code: `def findAllPeople(n, meetings, firstPerson):
    p = list(range(n))
    def find(x):
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x
    p[firstPerson] = 0
    meetings.sort(key=lambda m: m[2])
    i = 0
    while i < len(meetings):
        j = i
        while j < len(meetings) and meetings[j][2] == meetings[i][2]:
            j += 1
        for x, y, _ in meetings[i:j]:
            p[find(x)] = find(y)
        for x, y, _ in meetings[i:j]:
            for z in (x, y):
                if find(z) != find(0):
                    p[z] = z
        i = j
    return [k for k in range(n) if find(k) == find(0)]`,
    lang: "python", time: "O(m log m + m α(n))", space: "O(n)",
    viz: () => {
      const n = 6, M = [[1, 2, 5], [2, 3, 8], [1, 5, 10], [4, 5, 2]].sort((a, b) => a[2] - b[2]);
      const nodes = [{ id: 0, label: "0", x: 10, y: 50 }, { id: 1, label: "1", x: 35, y: 15 }, { id: 2, label: "2", x: 65, y: 15 }, { id: 3, label: "3", x: 90, y: 50 }, { id: 4, label: "4", x: 35, y: 85 }, { id: 5, label: "5", x: 65, y: 85 }];
      const p = [...Array(n).keys()], find = (x: number): number => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }, know = () => [...Array(n).keys()].filter((k) => find(k) === find(0));
      p[1] = 0; const frames: GraphFrame[] = [{ note: "person 0 tells person 1 at time 0", tones: tones(know(), "found") }], et: Record<string, Tone> = {};
      for (let i = 0; i < M.length;) { let j = i; while (j < M.length && M[j][2] === M[i][2]) j++; const g = M.slice(i, j); g.forEach(([x, y]) => (p[find(x)] = find(y))); g.forEach(([x, y]) => [x, y].forEach((z) => { if (find(z) !== find(0)) p[z] = z; })); g.forEach(([x, y]) => (et[ek(x, y)] = find(x) === find(0) ? "found" : "muted")); frames.push({ note: `time ${M[i][2]}: ${g.map(([x, y]) => `${x} meets ${y}`).join(", ")} → ${g.some(([x]) => find(x) === find(0)) ? "secret shared" : "neither knows, reset them"}; knowers {${know().join(", ")}}`, tones: { ...tones(know(), "found"), ...tones(g.flatMap(([x, y]) => [x, y]).filter((z) => find(z) === find(0)), "active") }, edgeTones: { ...et } }); i = j; }
      return { kind: "graph", title: `Know the secret: [${know().join(", ")}]`, nodes, edges: M.map(([a, b, t]) => ({ a, b, w: t })), frames };
    },
  },

  "construct-k-palindrome-strings": {
    approach: "Each palindrome can hold at most one letter with an odd count, so it works exactly when (#odd-count letters) ≤ k ≤ len(s).",
    idea: ["Letters with even counts can be split into mirrored pairs anywhere.", "Every letter with an odd count needs its own palindrome centre, so you need at least that many strings.", "You also cannot make more non-empty strings than there are characters."],
    code: `from collections import Counter
def canConstruct(s, k):
    odd = sum(v % 2 for v in Counter(s).values())
    return odd <= k <= len(s)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "annabelle", k = 2, letters = [...new Set(s)], cnt = letters.map((c) => [...s].filter((x) => x === c).length), frames: TableFrame[] = []; let odd = 0;
      letters.forEach((c, i) => { odd += cnt[i] % 2; frames.push({ note: `'${c}' appears ${cnt[i]} time${cnt[i] > 1 ? "s" : ""}${cnt[i] % 2 ? ", odd: needs its own centre" : ", even: pairs up"} (odd so far ${odd})`, cells: [cnt, cnt.map((v, j) => (j <= i ? v % 2 : null))], active: [1, i] }); });
      const ok = odd <= k && k <= s.length;
      frames.push({ note: `${odd} odd ≤ k = ${k} ≤ ${s.length} letters → ${ok}`, cells: [cnt, cnt.map((v) => v % 2)], tones: keys(letters.map((_, j) => `1:${j}`), ok ? "found" : "bad") });
      return { kind: "table", title: `"${s}" into ${k} palindromes: ${ok}`, rowHead: ["count", "odd?"], colHead: letters, frames };
    },
  },

  "find-all-lonely-numbers-in-the-array": {
    approach: "Count every value; x is lonely when its count is 1 and neither x - 1 nor x + 1 appears.",
    idea: ["A Counter answers 'how many x' and 'is x present' in O(1).", "Check the three conditions for each number."],
    code: `from collections import Counter
def findLonely(nums):
    cnt = Counter(nums)
    return [x for x in nums if cnt[x] == 1 and x - 1 not in cnt and x + 1 not in cnt]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [10, 6, 5, 8, 3], cnt = new Map<number, number>(), frames: CellsFrame[] = [], out: number[] = [], tn: Record<string, Tone> = {};
      a.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
      a.forEach((x, i) => { const why = cnt.get(x)! > 1 ? "appears twice" : cnt.has(x - 1) ? `${x - 1} is present` : cnt.has(x + 1) ? `${x + 1} is present` : ""; if (!why) out.push(x); tn[`0:${i}`] = why ? "bad" : "found"; frames.push({ note: `${x}: ${why || "single, no neighbour value"} → ${why ? "not lonely" : "lonely"}`, tones: { ...tn } }); });
      return cells(`Lonely: [${out.join(", ")}]`, [a], frames);
    },
  },

  "sort-vowels-in-a-string": {
    approach: "Pull the vowels out, sort them by character code, and write them back into the vowel positions in order.",
    idea: ["Consonants never move, so only the vowel slots change.", "Sorting the vowels by ASCII puts uppercase before lowercase, as required.", "Walk the string again and fill each vowel slot with the next sorted vowel."],
    code: `def sortVowels(s):
    vowels = sorted(c for c in s if c in "aeiouAEIOU")
    it = iter(vowels)
    return "".join(next(it) if c in "aeiouAEIOU" else c for c in s)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const s = [..."lEetcOde"], isV = (c: string) => "aeiouAEIOU".includes(c), vs = s.filter(isV).sort(), out = [...s], frames: CellsFrame[] = [];
      frames.push({ note: `vowels [${s.filter(isV).join(", ")}] sorted by code → [${vs.join(", ")}]`, rows: [s, [...out]], tones: keys(s.map((c, i) => (isV(c) ? `0:${i}` : "")).filter(Boolean), "window") });
      let k = 0; s.forEach((c, i) => { if (!isV(c)) return; out[i] = vs[k++]; frames.push({ note: `slot ${i}: put ${out[i]}`, rows: [s, [...out]], tones: { [`0:${i}`]: "window", [`1:${i}`]: "found" } }); });
      return cells(`"${s.join("")}" → "${out.join("")}"`, [s, s], frames, ["input", "output"]);
    },
  },

  "maximum-erasure-value": {
    approach: "Sliding window with a set: grow right, shrink from the left while the new value is a duplicate, and track the window sum.",
    idea: ["The best subarray has all distinct values, so keep a window that never contains a duplicate.", "When x is already inside, drop values from the left until it is gone.", "Maintain the sum incrementally and keep the maximum."],
    code: `def maximumUniqueSubarray(nums):
    seen, left, cur, best = set(), 0, 0, 0
    for x in nums:
        while x in seen:
            seen.remove(nums[left])
            cur -= nums[left]
            left += 1
        seen.add(x)
        cur += x
        best = max(best, cur)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [4, 2, 4, 5, 6], seen = new Set<number>(), frames: CellsFrame[] = []; let left = 0, cur = 0, best = 0;
      a.forEach((x, r) => { const drop: number[] = []; while (seen.has(x)) { seen.delete(a[left]); cur -= a[left]; drop.push(a[left]); left++; } seen.add(x); cur += x; best = Math.max(best, cur); frames.push({ note: `add ${x}${drop.length ? ` after dropping ${drop.join(", ")}` : ""}: window [${left}..${r}] sums to ${cur} (best ${best})`, tones: { ...range(left, r), [`0:${r}`]: "active" }, marks: [{ i: left, label: "L" }, { i: r, label: "R" }] }); });
      return cells(`Max erasure value: ${best}`, [a], frames);
    },
  },

  "add-two-numbers-ii": {
    approach: "Push both lists' digits onto stacks so you can add from the least significant end, building the result by prepending nodes.",
    idea: ["The lists store the most significant digit first, but addition starts at the last digit.", "Two stacks give the digits in reverse order without reversing the input.", "Each new digit becomes the new head, so the output comes out in the right order; continue while digits or a carry remain."],
    code: `def addTwoNumbers(l1, l2):
    a, b = [], []
    while l1:
        a.append(l1.val); l1 = l1.next
    while l2:
        b.append(l2.val); l2 = l2.next
    head, carry = None, 0
    while a or b or carry:
        s = carry + (a.pop() if a else 0) + (b.pop() if b else 0)
        carry, d = divmod(s, 10)
        head = ListNode(d, head)
    return head`,
    lang: "python", time: "O(n + m)", space: "O(n + m)",
    viz: () => {
      const A = [7, 2, 4, 3], B = [5, 6, 4], W = 5, pad = (x: number[]) => [...blank(W - x.length), ...x], out: (string | number)[] = blank(W), frames: CellsFrame[] = []; let carry = 0;
      const a = [...A], b = [...B];
      for (let col = W - 1; a.length || b.length || carry; col--) { const x = a.pop() ?? 0, y = b.pop() ?? 0, s = carry + x + y; out[col] = s % 10; frames.push({ note: `${x} + ${y}${carry ? " + carry 1" : ""} = ${s} → digit ${s % 10}${s >= 10 ? ", carry 1" : ""}; prepend it`, rows: [pad(A), pad(B), [...out]], tones: { [`0:${col}`]: "active", [`1:${col}`]: "active", [`2:${col}`]: "found" } }); carry = s >= 10 ? 1 : 0; }
      return cells("7243 + 564 = 7807", [pad(A), pad(B), blank(W)], frames, ["l1", "l2", "sum"]);
    },
  },

  "max-sum-of-a-pair-with-equal-sum-of-digits": {
    approach: "Group by digit sum, remembering only the largest number seen for each; every new number pairs with that largest one.",
    idea: ["Two numbers can pair only if their digit sums match.", "For a fixed digit sum, the best partner for a new number is the biggest earlier number with that sum.", "Update the answer, then keep the bigger of the two as the group's best."],
    code: `def maximumSum(nums):
    best, ans = {}, -1
    for x in nums:
        d = sum(map(int, str(x)))
        if d in best:
            ans = max(ans, best[d] + x)
            best[d] = max(best[d], x)
        else:
            best[d] = x
    return ans`,
    lang: "python", time: "O(n · digits)", space: "O(n)",
    viz: () => {
      const a = [18, 43, 36, 13, 7], ds = a.map((x) => [...String(x)].reduce((s, c) => s + +c, 0)), best = new Map<number, number>(), shown: (string | number)[] = blank(a.length), frames: CellsFrame[] = []; let ans = -1;
      a.forEach((x, i) => { const d = ds[i]; shown[i] = d; let note: string; if (best.has(d)) { const b = best.get(d)!; ans = Math.max(ans, b + x); note = `${x} has digit sum ${d}, pairs with ${b}: ${b + x} (best ${ans})`; best.set(d, Math.max(b, x)); } else { best.set(d, x); note = `${x} has digit sum ${d}, first in its group`; } frames.push({ note, rows: [a, [...shown]], tones: { [`0:${i}`]: "active", ...keys(ds.slice(0, i).map((v, j) => (v === d ? `0:${j}` : "")).filter(Boolean), "window") } }); });
      return cells(`Best pair sum: ${ans}`, [a, blank(a.length)], frames, ["nums", "digit sum"]);
    },
  },

  "map-sum-pairs": {
    approach: "A trie whose nodes store the total value of all keys passing through them; an insert adds only the change (new value minus old) along its path.",
    idea: ["sum(prefix) is the score stored at the node where the prefix ends.", "Re-inserting a key replaces its value, so add delta = val - old to every node on its path.", "Insert and sum both take O(length of the word)."],
    code: `class MapSum:
    def __init__(self):
        self.root, self.vals = {}, {}

    def insert(self, key, val):
        delta = val - self.vals.get(key, 0)
        self.vals[key] = val
        node = self.root
        for c in key:
            node = node.setdefault(c, {"#": 0})
            node["#"] += delta

    def sum(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node:
                return 0
            node = node[c]
        return node["#"]`,
    lang: "python", time: "O(L) per call", space: "O(total key length)",
    viz: () => {
      const ops: [string, string, number?][] = [["insert", "apple", 3], ["sum", "ap"], ["insert", "app", 2], ["insert", "ant", 4], ["sum", "ap"], ["insert", "apple", 1], ["sum", "a"]];
      const nodes: TNode[] = [{ id: 0, label: "·", parent: null }], child = new Map<string, number>(), score = new Map<number, number>([[0, 0]]), vals = new Map<string, number>(), frames: TreeFrame[] = [];
      for (const [, w] of ops) { let cur = 0; for (const c of w) { const k = `${cur}:${c}`; if (!child.has(k)) { child.set(k, nodes.length); nodes.push({ id: nodes.length, label: c, parent: cur }); } cur = child.get(k)!; } }
      const live = new Set([0]), badges = () => Object.fromEntries([...live].filter((i) => i).map((i) => [i, String(score.get(i) ?? 0)]));
      const muted = () => tones(nodes.map((nd) => nd.id).filter((i) => !live.has(i)), "muted");
      for (const [op, w, v] of ops) {
        const path: number[] = []; let cur = 0; for (const c of w) { cur = child.get(`${cur}:${c}`)!; path.push(cur); }
        if (op === "insert") { const delta = v! - (vals.get(w) ?? 0); vals.set(w, v!); path.forEach((i) => { live.add(i); score.set(i, (score.get(i) ?? 0) + delta); }); frames.push({ note: `insert("${w}", ${v}): delta ${delta >= 0 ? "+" : ""}${delta} added along ${w.split("").join(" → ")}`, tones: { ...muted(), ...tones(path, "active") }, badges: badges() }); }
        else frames.push({ note: `sum("${w}") = score at the last node = ${score.get(path[path.length - 1])}`, tones: { ...muted(), ...tones(path.slice(0, -1), "window"), [path[path.length - 1]]: "found" }, badges: badges() });
      }
      return tree("MapSum trie (badge = total value through the node)", nodes, frames);
    },
  },

  "count-of-smaller-numbers-after-self": {
    approach: "Walk from the right, inserting each value into a Fenwick tree over value ranks; the count of smaller values already inserted is a prefix sum.",
    idea: ["Everything to the right of i has already been inserted when you reach i.", "Compress values to ranks 1..m, then 'how many seen values are smaller' is the prefix sum up to rank - 1.", "A Fenwick tree does both the prefix sum and the insert in O(log m)."],
    code: `def countSmaller(nums):
    ranks = {v: i + 1 for i, v in enumerate(sorted(set(nums)))}
    bit = [0] * (len(ranks) + 1)
    out = []
    for x in reversed(nums):
        r, s = ranks[x] - 1, 0
        while r > 0:
            s += bit[r]
            r -= r & -r
        out.append(s)
        r = ranks[x]
        while r < len(bit):
            bit[r] += 1
            r += r & -r
    return out[::-1]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [5, 2, 6, 1, 2], vals = [...new Set(a)].sort((p, q) => p - q), seen = vals.map(() => 0), res = Array<number | null>(a.length).fill(null), frames: TableFrame[] = [];
      for (let i = a.length - 1; i >= 0; i--) { const r = vals.indexOf(a[i]), s = seen.slice(0, r).reduce((p, q) => p + q, 0); res[i] = s; seen[r]++; frames.push({ note: `nums[${i}] = ${a[i]}: seen values smaller than it = ${s} (prefix sum below rank ${r + 1}); then insert it`, cells: [[...seen], vals.map((_, j) => (j < r ? "<" : null))], active: [0, r], deps: vals.map((_, j) => [0, j] as [number, number]).filter(([, j]) => j < r) }); }
      frames.push({ note: `counts = [${res.join(", ")}]`, cells: [[...seen], vals.map(() => null)] });
      return { kind: "table", title: `Smaller after self: [${res.join(", ")}]`, rowHead: ["seen", ""], colHead: vals.map(String), frames };
    },
  },
  // @more
};
