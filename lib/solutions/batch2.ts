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
  "count-sorted-vowel-strings": {
    approach: "dp[v] = strings of the current length that start with vowel v; one letter longer, a string starting with v is v followed by a string starting with v or any later vowel.",
    idea: ["Sorted strings never go back to an earlier vowel, so only the first letter matters for what can follow.", "New dp[v] = sum of old dp[w] for w ≥ v, a suffix sum.", "Updating from 'o' down to 'a' in place builds the suffix sums in one pass per length."],
    code: `def countVowelStrings(n):
    dp = [1] * 5   # dp[v]: strings that start with vowel v
    for _ in range(n - 1):
        for v in range(3, -1, -1):
            dp[v] += dp[v + 1]
    return sum(dp)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 3, rows: (number | null)[][] = [[1, 1, 1, 1, 1], ...Array.from({ length: n - 1 }, () => [null, null, null, null, null] as (number | null)[])], dp = [1, 1, 1, 1, 1], V = "aeiou", frames: TableFrame[] = [{ note: "length 1: one string per vowel", cells: rows.map((r) => [...r]), tones: keys([0, 1, 2, 3, 4].map((c) => `0:${c}`), "found") }];
      for (let L = 1; L < n; L++) { rows[L][4] = 1; for (let v = 3; v >= 0; v--) { dp[v] += dp[v + 1]; rows[L][v] = dp[v]; frames.push({ note: `length ${L + 1} starting with '${V[v]}': '${V[v]}' + any length-${L} string starting at '${V[v]}' or later = ${dp[v]}`, cells: rows.map((r) => [...r]), active: [L, v], deps: Array.from({ length: 5 - v }, (_, k) => [L - 1, v + k] as [number, number]) }); } }
      const total = dp.reduce((a, b) => a + b, 0);
      frames.push({ note: `sum of the last row = ${total}`, cells: rows, tones: keys([0, 1, 2, 3, 4].map((c) => `${n - 1}:${c}`), "found") });
      return { kind: "table", title: `Sorted vowel strings of length ${n}: ${total}`, rowHead: Array.from({ length: n }, (_, i) => `n=${i + 1}`), colHead: [...V], frames };
    },
  },

  "binary-tree-cameras": {
    approach: "Post-order greedy: put a camera on the parent of any uncovered leaf; each node reports 'needs cover', 'has camera' or 'covered'.",
    idea: ["A camera on a leaf covers less than one on its parent, so never place cameras on leaves.", "Bottom up: if a child needs cover, this node takes a camera. If a child has a camera, this node is covered. Otherwise it needs cover from its parent.", "If the root still needs cover at the end, add one more camera."],
    code: `def minCameraCover(root):
    cams = 0
    def dfs(node):   # 0 = needs cover, 1 = has camera, 2 = covered
        nonlocal cams
        if not node:
            return 2
        l, r = dfs(node.left), dfs(node.right)
        if l == 0 or r == 0:
            cams += 1
            return 1
        return 2 if l == 1 or r == 1 else 0
    root_state = dfs(root)
    return cams + (root_state == 0)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [0, 0, null, 0, 0, null, null, 0], { nodes, kids } = T(vals), frames: TreeFrame[] = [], tn: Record<number, Tone> = {}, badges: Record<number, string> = {}, name = ["needs cover", "camera", "covered"]; let cams = 0;
      const dfs = (i: number | null): number => { if (i == null) return 2; const l = dfs(kids[i][0]), r = dfs(kids[i][1]); let st: number; if (l === 0 || r === 0) { cams++; st = 1; } else st = l === 1 || r === 1 ? 2 : 0; tn[i] = st === 1 ? "found" : st === 2 ? "done" : "bad"; badges[i] = name[st]; frames.push({ note: `node ${i}: children report ${name[l]} / ${name[r]} → ${st === 1 ? `place a camera (total ${cams})` : name[st]}`, tones: { ...tn, [i]: st === 1 ? "found" : "active" }, badges: { ...badges } }); return st; };
      if (dfs(0) === 0) { cams++; tn[0] = "found"; badges[0] = "camera"; frames.push({ note: `root still needs cover: one more camera (total ${cams})`, tones: { ...tn }, badges: { ...badges } }); }
      return tree(`Cameras needed: ${cams}`, nodes, frames);
    },
  },

  "basic-calculator": {
    approach: "Scan once keeping a running result and the current sign; '(' saves (result, sign) on a stack and starts fresh, ')' folds the inner result back in.",
    idea: ["Without parentheses the value is just a signed sum: add sign × number whenever a number ends.", "At '(' push the result so far and the sign in front of the bracket, then reset.", "At ')' finish the inner sum, pop, and set result = saved + savedSign × inner."],
    code: `def calculate(s):
    res, num, sign, st = 0, 0, 1, []
    for c in s:
        if c.isdigit():
            num = num * 10 + int(c)
        elif c in "+-":
            res += sign * num
            num, sign = 0, 1 if c == "+" else -1
        elif c == "(":
            st.append((res, sign))
            res, sign = 0, 1
        elif c == ")":
            res += sign * num
            num = 0
            prev, psign = st.pop()
            res = prev + psign * res
    return res + sign * num`,
    lang: "python", time: "O(n)", space: "O(depth)",
    viz: () => {
      const s = "2-(4+5-(1+2))", st: [number, number][] = [], frames: StackFrame[] = []; let res = 0, num = 0, sign = 1;
      const show = () => st.map(([r, g]) => `${r}, ${g > 0 ? "+" : "-"}`), side = () => `res ${res}, num ${num}, sign ${sign > 0 ? "+" : "-"}`;
      for (const c of s) {
        let note: string, popped: string[] | undefined;
        if (/\d/.test(c)) { num = num * 10 + +c; note = `digit ${c}: number so far ${num}`; }
        else if (c === "+" || c === "-") { res += sign * num; num = 0; sign = c === "+" ? 1 : -1; note = `'${c}': add the finished number, result ${res}, next sign ${c}`; }
        else if (c === "(") { st.push([res, sign]); note = `'(': save result ${res} and sign ${sign > 0 ? "+" : "-"}, start fresh`; res = 0; sign = 1; }
        else { res += sign * num; num = 0; const [p, g] = st.pop()!; popped = [`${p}, ${g > 0 ? "+" : "-"}`]; note = `')': inner sum ${res}, so ${p} ${g > 0 ? "+" : "-"} ${res} = ${p + g * res}`; res = p + g * res; }
        frames.push({ note, items: show(), incoming: c, popped, side: side() });
      }
      const ans = res + sign * num; frames.push({ note: `end: add the last number → ${ans}`, items: [], side: `answer ${ans}` });
      return { kind: "stack", title: `${s} = ${ans}`, input: [...s], frames };
    },
  },

  "lexicographical-numbers": {
    approach: "Walk the numbers in dictionary order without sorting: go one level deeper (×10) when possible, otherwise step to the next sibling, climbing up past 9s and numbers above n.",
    idea: ["Dictionary order is a preorder walk of the digit tree 1..9, each with children x0..x9.", "If x × 10 ≤ n, the next number is x × 10.", "Otherwise drop trailing 9s and anything that would exceed n by dividing by 10, then add 1."],
    code: `def lexicalOrder(n):
    out, x = [], 1
    for _ in range(n):
        out.append(x)
        if x * 10 <= n:
            x *= 10
        else:
            while x % 10 == 9 or x + 1 > n:
                x //= 10
            x += 1
    return out`,
    lang: "python", time: "O(n)", space: "O(1) extra",
    viz: () => {
      const n = 13, out: (string | number)[] = blank(n), frames: CellsFrame[] = []; let x = 1;
      for (let k = 0; k < n; k++) { out[k] = x; let why: string; if (x * 10 <= n) { why = `${x} × 10 = ${x * 10} ≤ ${n}: go deeper`; x *= 10; } else { const from = x; while (x % 10 === 9 || x + 1 > n) x = Math.floor(x / 10); x += 1; why = k === n - 1 ? "done" : `${from} cannot go deeper: next sibling is ${x}`; } frames.push({ note: `output ${out[k]}; ${why}`, rows: [[...out]], tones: { ...range(0, k - 1, 0, "done"), [`0:${k}`]: "found" } }); }
      return cells(`Lexicographical 1..${n}`, [blank(n)], frames);
    },
  },

  "max-number-of-k-sum-pairs": {
    approach: "Sort, then two pointers from both ends: a pair summing to k is removed; a smaller sum moves the left pointer, a bigger one the right.",
    idea: ["After sorting, if nums[i] + nums[j] < k the smallest value cannot pair with anything left, so drop it; symmetric for > k.", "On an exact match take the pair; taking it never blocks a better answer.", "A Counter works too in O(n)."],
    code: `def maxOperations(nums, k):
    nums.sort()
    i, j, ops = 0, len(nums) - 1, 0
    while i < j:
        s = nums[i] + nums[j]
        if s == k:
            ops += 1
            i += 1
            j -= 1
        elif s < k:
            i += 1
        else:
            j -= 1
    return ops`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const a = [3, 1, 3, 4, 3, 2, 5].sort((p, q) => p - q), k = 6, frames: CellsFrame[] = [], tn: Record<string, Tone> = {}; let i = 0, j = a.length - 1, ops = 0;
      while (i < j) { const s = a[i] + a[j]; if (s === k) { ops++; tn[`0:${i}`] = tn[`0:${j}`] = "found"; } frames.push({ note: `${a[i]} + ${a[j]} = ${s} ${s === k ? `= ${k}: pair ${ops}` : s < k ? `< ${k}: move left` : `> ${k}: move right`}`, tones: { ...tn, [`0:${i}`]: s === k ? "found" : "active", [`0:${j}`]: s === k ? "found" : "active" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] }); if (s === k) { i++; j--; } else if (s < k) i++; else j--; }
      return cells(`Pairs summing to ${k}: ${ops}`, [a], frames);
    },
  },

  "append-characters-to-string-to-make-subsequence": {
    approach: "Greedily match t's characters inside s from left to right; whatever part of t is left unmatched must be appended.",
    idea: ["Matching each character of t at its earliest possible position in s matches the longest prefix of t.", "The unmatched suffix of t has to be added at the end.", "Answer = len(t) - matched."],
    code: `def appendCharacters(s, t):
    j = 0
    for c in s:
        if j < len(t) and c == t[j]:
            j += 1
    return len(t) - j`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "coaching", t = "coding", W = Math.max(s.length, t.length), frames: CellsFrame[] = [], tn: Record<string, Tone> = {}; let j = 0;
      const rows = [[...s, ...blank(W - s.length)], [...t, ...blank(W - t.length)]];
      [...s].forEach((c, i) => { const hit = j < t.length && c === t[j]; if (hit) { tn[`0:${i}`] = "found"; tn[`1:${j}`] = "found"; j++; } frames.push({ note: `s[${i}] = '${c}' ${hit ? `matches t[${j - 1}]` : `is not '${t[j] ?? ""}'`}; matched ${j}`, rows, tones: { ...tn, [`0:${i}`]: hit ? "found" : "active" }, marks: [{ i, label: "i" }, { i: Math.min(j, t.length - 1), label: "j", row: 1 }] }); });
      frames.push({ note: `matched ${j} of ${t.length}: append "${t.slice(j)}" → ${t.length - j}`, rows, tones: { ...tn, ...range(j, t.length - 1, 1, "bad") } });
      return cells(`Characters to append: ${t.length - j}`, rows, frames, ["s", "t"]);
    },
  },

  "minimum-operations-to-make-a-subsequence": {
    approach: "Map arr to positions in target (dropping values not in target); the longest common subsequence becomes a longest increasing subsequence, found with patience sorting.",
    idea: ["target has distinct values, so a common subsequence is a set of arr values whose target positions increase.", "Compute the LIS of those positions in O(n log n): tails[k] = smallest ending position of an increasing run of length k + 1.", "Insertions needed = len(target) - LIS."],
    code: `from bisect import bisect_left
def minOperations(target, arr):
    pos = {x: i for i, x in enumerate(target)}
    tails = []
    for x in arr:
        if x in pos:
            k = bisect_left(tails, pos[x])
            if k == len(tails):
                tails.append(pos[x])
            else:
                tails[k] = pos[x]
    return len(target) - len(tails)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const target = [6, 4, 8, 1, 3, 2], arr = [4, 7, 6, 2, 3, 8, 6, 1], pos = new Map(target.map((x, i) => [x, i])), tails: number[] = [], frames: CellsFrame[] = [], mapped: (string | number)[] = arr.map((x) => (pos.has(x) ? pos.get(x)! : "-"));
      arr.forEach((x, i) => { if (!pos.has(x)) { frames.push({ note: `${x} is not in target: skip`, rows: [arr, mapped, [...tails, ...blank(arr.length - tails.length)]], tones: { [`0:${i}`]: "muted" } }); return; } const p = pos.get(x)!; let k = 0; while (k < tails.length && tails[k] < p) k++; const ext = k === tails.length; tails[k] = p; frames.push({ note: `${x} sits at target position ${p}: ${ext ? `extends the run to length ${tails.length}` : `replaces tails[${k}] (a smaller ending)`}`, rows: [arr, mapped, [...tails, ...blank(arr.length - tails.length)]], tones: { [`0:${i}`]: "active", [`2:${k}`]: "found" } }); });
      frames.push({ note: `LIS = ${tails.length}, so insert ${target.length} - ${tails.length} = ${target.length - tails.length}`, rows: [arr, mapped, [...tails, ...blank(arr.length - tails.length)]], tones: range(0, tails.length - 1, 2, "found") });
      return cells(`Insertions needed: ${target.length - tails.length}`, [arr, mapped, blank(arr.length)], frames, ["arr", "target pos", "tails"]);
    },
  },

  "longest-duplicate-substring": {
    approach: "Binary search the length: if some substring of length L repeats, so does one of length L - 1. Check a length with a rolling hash over all windows.",
    idea: ["Repeats are monotone in length, so binary search for the largest L that has a duplicate.", "For a fixed L, a Rabin-Karp hash slides across s in O(n); equal hashes are confirmed by comparing the actual substrings.", "Keep the substring found at the largest working L."],
    code: `def longestDupSubstring(s):
    n, MOD, B = len(s), (1 << 61) - 1, 131
    def dup(L):
        h, p, seen = 0, pow(B, L, MOD), {}
        for i, c in enumerate(s):
            h = (h * B + ord(c)) % MOD
            if i >= L:
                h = (h - ord(s[i - L]) * p) % MOD
            if i >= L - 1:
                st = i - L + 1
                for j in seen.get(h, []):
                    if s[j:j + L] == s[st:st + L]:
                        return st
                seen.setdefault(h, []).append(st)
        return -1
    lo, hi, best = 1, n - 1, ""
    while lo <= hi:
        mid = (lo + hi) // 2
        st = dup(mid)
        if st >= 0:
            best, lo = s[st:st + mid], mid + 1
        else:
            hi = mid - 1
    return best`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const s = "banana", frames: CellsFrame[] = []; let lo = 1, hi = s.length - 1, best = "";
      const dup = (L: number) => { const seen = new Map<string, number>(); for (let i = 0; i + L <= s.length; i++) { const w = s.slice(i, i + L); if (seen.has(w)) return [seen.get(w)!, i]; seen.set(w, i); } return null; };
      while (lo <= hi) { const mid = (lo + hi) >> 1, d = dup(mid); if (d) { best = s.slice(d[1], d[1] + mid); frames.push({ note: `length ${mid}: "${best}" appears at ${d[0]} and ${d[1]} → try longer (lo = ${mid + 1})`, tones: { ...range(d[0], d[0] + mid - 1), ...range(d[1], d[1] + mid - 1, 0, "found") } }); lo = mid + 1; } else { frames.push({ note: `length ${mid}: every window is unique → try shorter (hi = ${mid - 1})`, tones: range(0, s.length - 1, 0, "muted") }); hi = mid - 1; } }
      return cells(`Longest repeat in "${s}": "${best}"`, [[...s]], frames);
    },
  },

  "critical-connections-in-a-network": {
    approach: "Tarjan's bridge finding: DFS records discovery time and the lowest time reachable through back edges; edge (u, v) is a bridge when low[v] > tin[u].",
    idea: ["Removing u-v disconnects the graph exactly when nothing under v can reach u or above without that edge.", "low[v] = smallest discovery time reachable from v's subtree using one back edge.", "If low[v] > tin[u], v's subtree is stuck below the edge, so it is critical."],
    code: `import sys
def criticalConnections(n, connections):
    sys.setrecursionlimit(1 << 20)
    g = [[] for _ in range(n)]
    for a, b in connections:
        g[a].append(b)
        g[b].append(a)
    tin, low, out, t = [-1] * n, [0] * n, [], [0]
    def dfs(u, parent):
        tin[u] = low[u] = t[0]
        t[0] += 1
        for v in g[u]:
            if v == parent:
                continue
            if tin[v] == -1:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > tin[u]:
                    out.append([u, v])
            else:
                low[u] = min(low[u], tin[v])
    dfs(0, -1)
    return out`,
    lang: "python", time: "O(V + E)", space: "O(V + E)",
    viz: () => {
      const n = 6, E = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 5], [5, 3]], nodes = [{ id: 0, label: "0", x: 5, y: 20 }, { id: 1, label: "1", x: 35, y: 50 }, { id: 2, label: "2", x: 5, y: 80 }, { id: 3, label: "3", x: 65, y: 50 }, { id: 4, label: "4", x: 95, y: 20 }, { id: 5, label: "5", x: 95, y: 80 }];
      const g: number[][] = Array.from({ length: n }, () => []); E.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const tin = Array(n).fill(-1), low = Array(n).fill(0), frames: GraphFrame[] = [], et: Record<string, Tone> = {}, out: string[] = []; let t = 0;
      const badges = () => Object.fromEntries(tin.map((x, i) => [i, x < 0 ? "" : `${x}/${low[i]}`]).filter(([, b]) => b)) as Record<number, string>;
      const dfs = (u: number, p: number) => { tin[u] = low[u] = t++; frames.push({ note: `visit ${u}: time ${tin[u]} (badge = time/low)`, tones: tones(tin.map((x, i) => (x >= 0 ? i : -1)).filter((i) => i >= 0), "done"), edgeTones: { ...et }, badges: badges() }); for (const v of g[u]) { if (v === p) continue; if (tin[v] === -1) { et[ek(u, v)] = "window"; dfs(v, u); low[u] = Math.min(low[u], low[v]); const bridge = low[v] > tin[u]; if (bridge) { out.push(`${u}-${v}`); et[ek(u, v)] = "bad"; } frames.push({ note: `back at ${u} from ${v}: low[${v}] = ${low[v]} ${bridge ? `> time ${tin[u]}, so ${u}-${v} is critical` : `≤ time ${tin[u]}, a cycle protects ${u}-${v}`}`, tones: { [u]: "active" }, edgeTones: { ...et }, badges: badges() }); } else if (tin[v] < low[u]) { low[u] = tin[v]; frames.push({ note: `${u} sees ${v} again (back edge): low[${u}] = ${low[u]}`, tones: { [u]: "active", [v]: "window" }, edgeTones: { ...et, [ek(u, v)]: "found" }, badges: badges() }); } } };
      dfs(0, -1);
      return { kind: "graph", title: `Critical: ${out.join(", ")}`, nodes, edges: E.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "create-binary-tree-from-descriptions": {
    approach: "Create or reuse a node for every value, link child to parent on the given side, and the root is the only parent that never appears as a child.",
    idea: ["A dictionary from value to node lets each description link two nodes in O(1).", "Remember every child value.", "The root is the one node that is never a child."],
    code: `def createBinaryTree(descriptions):
    nodes, kids = {}, set()
    for p, c, left in descriptions:
        a = nodes.setdefault(p, TreeNode(p))
        b = nodes.setdefault(c, TreeNode(c))
        if left:
            a.left = b
        else:
            a.right = b
        kids.add(c)
    return next(nodes[p] for p, _, _ in descriptions if p not in kids)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const D = [[20, 15, 1], [20, 17, 0], [50, 20, 1], [50, 80, 0], [80, 19, 1]], vals = [...new Set(D.flatMap(([p, c]) => [p, c]))], id = (v: number) => vals.indexOf(v);
      const nodes: TNode[] = vals.map((v) => { const d = D.find(([, c]) => c === v); return { id: id(v), label: String(v), parent: d ? id(d[0]) : null, side: d ? (d[2] ? "L" : "R") : undefined }; });
      const made = new Set<number>(), kids = new Set<number>(), frames: TreeFrame[] = [];
      D.forEach(([p, c, l]) => { made.add(p); made.add(c); kids.add(c); frames.push({ note: `${c} becomes the ${l ? "left" : "right"} child of ${p}`, tones: { ...tones(vals.filter((v) => !made.has(v)).map(id), "muted"), ...tones([...made].map(id), "done"), [id(c)]: "active" } }); });
      const root = vals.find((v) => !kids.has(v))!;
      frames.push({ note: `${root} is never a child → it is the root`, tones: { ...tones(vals.map(id), "done"), [id(root)]: "found" } });
      return tree(`Root: ${root}`, nodes, frames);
    },
  },

  "smallest-subsequence-of-distinct-characters": {
    approach: "Monotonic stack: before pushing c, pop larger letters from the top if they appear again later; skip letters already in the stack.",
    idea: ["Each letter must appear once, so a letter on the stack is kept unless a smaller letter can go before it.", "A larger top can be popped only if its last occurrence is later, so it can be added again.", "Letters already in the result are skipped; their position is already the best one."],
    code: `def smallestSubsequence(s):
    last = {c: i for i, c in enumerate(s)}
    st, inside = [], set()
    for i, c in enumerate(s):
        if c in inside:
            continue
        while st and st[-1] > c and last[st[-1]] > i:
            inside.remove(st.pop())
        st.append(c)
        inside.add(c)
    return "".join(st)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "cbacdcbc", last = new Map([...s].map((c, i) => [c, i])), st: string[] = [], frames: StackFrame[] = [];
      [...s].forEach((c, i) => { if (st.includes(c)) { frames.push({ note: `'${c}' is already in the answer: skip`, items: [...st], side: `"${st.join("")}"` }); return; } const popped: string[] = []; while (st.length && st[st.length - 1] > c && last.get(st[st.length - 1])! > i) popped.push(st.pop()!); st.push(c); frames.push({ note: `'${c}'${popped.length ? `: pop ${popped.join(", ")} (bigger, and they appear again later)` : ""}; push it`, items: [...st], incoming: c, popped, side: `"${st.join("")}"` }); });
      return { kind: "stack", title: `"${s}" → "${st.join("")}"`, input: [...s], frames };
    },
  },

  "total-hamming-distance": {
    approach: "Count bit by bit: if k numbers have bit b set, that bit contributes k × (n - k) differing pairs.",
    idea: ["The total Hamming distance is the sum over bits of the number of pairs that differ there.", "At one bit, a pair differs exactly when one number has a 1 and the other a 0: ones × zeros pairs.", "32 bits × n numbers instead of n² pairs."],
    code: `def totalHammingDistance(nums):
    n, total = len(nums), 0
    for b in range(32):
        ones = sum(x >> b & 1 for x in nums)
        total += ones * (n - ones)
    return total`,
    lang: "python", time: "O(32 n)", space: "O(1)",
    viz: () => {
      const a = [4, 14, 2], W = 4, bits = a.map((x) => x.toString(2).padStart(W, "0").split("").map(Number)), frames: TableFrame[] = []; let total = 0;
      for (let b = 0; b < W; b++) { const c = W - 1 - b, ones = a.filter((x) => (x >> b) & 1).length; total += ones * (a.length - ones); frames.push({ note: `bit ${b}: ${ones} one${ones === 1 ? "" : "s"}, ${a.length - ones} zero${a.length - ones === 1 ? "" : "s"} → ${ones} × ${a.length - ones} = ${ones * (a.length - ones)} (total ${total})`, cells: bits, tones: keys(a.map((_, r) => `${r}:${c}`), "window") }); }
      return { kind: "table", title: `Total Hamming distance of [${a.join(", ")}]: ${total}`, rowHead: a.map(String), colHead: Array.from({ length: W }, (_, i) => `bit ${W - 1 - i}`), frames };
    },
  },
  "find-largest-value-in-each-tree-row": {
    approach: "BFS one level at a time and keep the maximum of each level.",
    idea: ["The queue size at the start of a round is exactly the number of nodes on that level.", "Pop that many nodes, track their maximum, push their children.", "Append the maximum per level."],
    code: `from collections import deque
def largestValues(root):
    out, q = [], deque([root] if root else [])
    while q:
        best = float("-inf")
        for _ in range(len(q)):
            node = q.popleft()
            best = max(best, node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(best)
    return out`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals = [1, 3, 2, 5, 3, null, 9], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], out: number[] = [], won: number[] = []; let q = [0], lv = 0;
      while (q.length) { const best = Math.max(...q.map(val)), bi = q.find((i) => val(i) === best)!; out.push(best); won.push(bi); frames.push({ note: `level ${lv}: [${q.map(val).join(", ")}] → max ${best}; answer [${out.join(", ")}]`, tones: { ...tones(q, "window"), ...tones(won, "found") } }); q = q.flatMap((i) => kids[i].filter((c): c is number => c != null)); lv++; }
      return tree(`Row maxima: [${out.join(", ")}]`, nodes, trail(frames));
    },
  },

  "linked-list-cycle-ii": {
    approach: "Floyd: slow and fast pointers meet inside the cycle; then a pointer from the head and one from the meeting point, both moving one step, meet at the cycle start.",
    idea: ["If there is a cycle, fast (2 steps) catches slow (1 step) inside it.", "Let the head be a steps from the cycle start and the meeting point b steps past it. Slow walked a + b, fast 2(a + b), so a + b is a multiple of the cycle length.", "So walking a more steps from the meeting point lands on the start, the same as walking a steps from the head."],
    code: `def detectCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            slow = head
            while slow is not fast:
                slow, fast = slow.next, fast.next
            return slow
    return None`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = [3, 2, 0, -4, 7], next = [1, 2, 3, 4, 1], frames: ListFrame[] = []; let s = 0, f = 0;
      frames.push({ note: "slow and fast start at the head", next, ptrs: [{ i: 0, label: "slow, fast" }] });
      do { s = next[s]; f = next[next[f]]; frames.push({ note: s === f ? `they meet at ${vals[s]}: there is a cycle` : `slow → ${vals[s]}, fast → ${vals[f]}`, next, ptrs: s === f ? [{ i: s, label: "meet" }] : [{ i: s, label: "slow" }, { i: f, label: "fast" }], tones: s === f ? { [s]: "active" } : {} }); } while (s !== f);
      s = 0; frames.push({ note: "move one pointer back to the head; both now step once at a time", next, ptrs: [{ i: s, label: "p" }, { i: f, label: "q" }] });
      while (s !== f) { s = next[s]; f = next[f]; frames.push({ note: s === f ? `they meet at ${vals[s]}: the cycle starts here (index ${s})` : `p → ${vals[s]}, q → ${vals[f]}`, next, ptrs: s === f ? [{ i: s, label: "start" }] : [{ i: s, label: "p" }, { i: f, label: "q" }], tones: s === f ? { [s]: "found" } : {} }); }
      return { kind: "list", title: `Cycle starts at index ${s}`, values: vals, frames };
    },
  },

  "delete-nodes-and-return-forest": {
    approach: "One DFS: a node becomes a new root when its parent was deleted and it survives; deleted nodes return None so their parent's link is cut.",
    idea: ["Pass down whether the parent is gone (the root counts as having a deleted parent).", "A surviving node with a deleted parent starts a new tree: add it to the answer.", "Children are processed first, then the node returns None if it is deleted, which detaches it from its parent."],
    code: `def delNodes(root, to_delete):
    kill, out = set(to_delete), []
    def dfs(node, parent_gone):
        if not node:
            return None
        gone = node.val in kill
        if parent_gone and not gone:
            out.append(node)
        node.left = dfs(node.left, gone)
        node.right = dfs(node.right, gone)
        return None if gone else node
    dfs(root, True)
    return out`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals = [1, 2, 3, 4, 5, 6, 7], kill = new Set([3, 5]), { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], roots: number[] = [];
      const dfs = (i: number | null, pg: boolean) => { if (i == null) return; const gone = kill.has(val(i)); if (pg && !gone) roots.push(val(i)); frames.push({ note: gone ? `${val(i)} is deleted: its children lose their parent` : pg ? `${val(i)} survives and its parent is gone → new root (roots ${roots.join(", ")})` : `${val(i)} stays in its parent's tree`, tones: { [i]: gone ? "bad" : pg ? "found" : "active" } }); dfs(kids[i][0], gone); dfs(kids[i][1], gone); };
      dfs(0, true);
      return tree(`Forest roots: ${roots.join(", ")}`, nodes, trail(frames));
    },
  },

  "number-of-ways-to-arrive-at-destination": {
    approach: "Dijkstra that also counts shortest paths: a strictly shorter route replaces the count, an equally short one adds to it.",
    idea: ["Nodes leave the heap in order of final shortest distance, so their path counts are final when popped.", "Relaxing u → v: if d + t < dist[v], set dist[v] and ways[v] = ways[u]; if equal, ways[v] += ways[u].", "Answer ways[n - 1] mod 1e9 + 7."],
    code: `import heapq
def countPaths(n, roads):
    MOD = 10**9 + 7
    g = [[] for _ in range(n)]
    for u, v, t in roads:
        g[u].append((v, t))
        g[v].append((u, t))
    dist, ways = [float("inf")] * n, [0] * n
    dist[0], ways[0] = 0, 1
    pq = [(0, 0)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, t in g[u]:
            nd = d + t
            if nd < dist[v]:
                dist[v], ways[v] = nd, ways[u]
                heapq.heappush(pq, (nd, v))
            elif nd == dist[v]:
                ways[v] = (ways[v] + ways[u]) % MOD
    return ways[n - 1]`,
    lang: "python", time: "O(E log V)", space: "O(V + E)",
    viz: () => {
      const n = 5, R = [[0, 1, 1], [0, 2, 2], [1, 2, 1], [1, 3, 2], [2, 3, 1], [3, 4, 1]], nodes = [{ id: 0, label: "0", x: 5, y: 50 }, { id: 1, label: "1", x: 35, y: 15 }, { id: 2, label: "2", x: 35, y: 85 }, { id: 3, label: "3", x: 65, y: 50 }, { id: 4, label: "4", x: 95, y: 50 }];
      const g: [number, number][][] = Array.from({ length: n }, () => []); R.forEach(([u, v, t]) => { g[u].push([v, t]); g[v].push([u, t]); });
      const dist = Array(n).fill(-1), ways = Array(n).fill(0), done: number[] = [], frames: GraphFrame[] = []; dist[0] = 0; ways[0] = 1; let pq: [number, number][] = [[0, 0]];
      const badges = () => Object.fromEntries(dist.map((d, i) => [i, d < 0 ? "?" : `d${d} ×${ways[i]}`])) as Record<number, string>;
      while (pq.length) { pq.sort((a, b) => a[0] - b[0]); const [d, u] = pq.shift()!; if (d > dist[u]) continue; done.push(u); const notes: string[] = []; for (const [v, t] of g[u]) { const nd = d + t; if (dist[v] < 0 || nd < dist[v]) { dist[v] = nd; ways[v] = ways[u]; pq.push([nd, v]); notes.push(`${v}: shorter (${nd}), ways = ${ways[v]}`); } else if (nd === dist[v]) { ways[v] += ways[u]; notes.push(`${v}: tie at ${nd}, ways += ${ways[u]} → ${ways[v]}`); } } frames.push({ note: `pop ${u} (distance ${d}). ${notes.join("; ") || "nothing improves"}`, tones: { ...tones(done, "done"), [u]: "active" }, badges: badges() }); }
      return { kind: "graph", title: `Shortest ways to ${n - 1}: ${ways[n - 1]}`, nodes, edges: R.map(([a, b, w]) => ({ a, b, w })), frames };
    },
  },

  "unique-paths-iii": {
    approach: "Backtracking DFS from the start, marking cells as visited; a path counts only if it reaches the end after stepping on every empty cell.",
    idea: ["Count the cells that must be walked: every 0 plus the end square.", "DFS in four directions, marking the cell used and unmarking on the way back.", "Reaching the end with zero cells left to cover is one valid path."],
    code: `def uniquePathsIII(grid):
    R, C = len(grid), len(grid[0])
    need = sum(row.count(0) for row in grid) + 1
    sr, sc = next((r, c) for r in range(R) for c in range(C) if grid[r][c] == 1)
    def dfs(r, c, left):
        if not (0 <= r < R and 0 <= c < C) or grid[r][c] < 0:
            return 0
        if grid[r][c] == 2:
            return int(left == 0)
        grid[r][c] = -1
        total = sum(dfs(r + dr, c + dc, left - 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        grid[r][c] = 0
        return total
    return dfs(sr, sc, need)`,
    lang: "python", time: "O(3^cells)", space: "O(cells)",
    viz: () => {
      const g = [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 2, -1]], R = 3, C = 4, need = g.flat().filter((x) => x === 0).length + 1, path: [number, number][] = [], frames: TableFrame[] = []; let count = 0, dead = 0;
      const base = g.map((r) => r.map((x) => (x === 1 ? "S" : x === 2 ? "E" : x < 0 ? "#" : ""))) as (string | number | null)[][];
      const dfs = (r: number, c: number, left: number) => { if (r < 0 || r >= R || c < 0 || c >= C || g[r][c] < 0) return; if (g[r][c] === 2) { const show = base.map((x) => [...x]); path.forEach(([pr, pc], k) => { if (k) show[pr][pc] = k; }); if (left === 0) { count++; frames.push({ note: `reached the end after covering every cell: path ${count}`, cells: show, tones: keys([...path.map(([a, b]) => `${a}:${b}`), `${r}:${c}`], "found") }); } else if (dead++ < 2) frames.push({ note: `reached the end with ${left} cell${left > 1 ? "s" : ""} still unvisited: not counted`, cells: show, tones: { ...keys(path.map(([a, b]) => `${a}:${b}`), "window"), [`${r}:${c}`]: "bad" } }); return; } const keep = g[r][c]; g[r][c] = -1; path.push([r, c]); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) dfs(r + dr, c + dc, left - 1); path.pop(); g[r][c] = keep; };
      dfs(0, 0, need);
      frames.push({ note: `${count} paths walk over every empty square exactly once`, cells: base });
      return { kind: "table", title: `Unique paths III: ${count}`, rowHead: heads(R, "r"), colHead: heads(C, "c"), frames };
    },
  },

  "maximum-number-of-events-that-can-be-attended": {
    approach: "Go day by day; add events that have started to a min-heap of end days, drop expired ones, and attend the one ending soonest.",
    idea: ["On any day, among the events you could attend, the one that ends first is the most urgent; the others can wait.", "Sort by start; each day push newly started events' ends and pop ends that are already past.", "If the heap empties, jump straight to the next start day."],
    code: `import heapq
def maxEvents(events):
    events.sort()
    heap, i, n, day, ans = [], 0, len(events), 0, 0
    while i < n or heap:
        if not heap:
            day = max(day, events[i][0])
        while i < n and events[i][0] <= day:
            heapq.heappush(heap, events[i][1])
            i += 1
        heapq.heappop(heap)
        ans += 1
        day += 1
        while heap and heap[0] < day:
            heapq.heappop(heap)
    return ans`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const items = ([[1, 2], [1, 2], [2, 3], [3, 4], [1, 1]] as [number, number][]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), frames: IntervalsFrame[] = [], tn: Record<number, Tone> = {}; let heap: number[] = [], i = 0, day = 0, ans = 0;
      while (i < items.length || heap.length) { if (!heap.length) day = Math.max(day, items[i][0]); while (i < items.length && items[i][0] <= day) heap.push(i++); heap.sort((a, b) => items[a][1] - items[b][1]); const e = heap.shift()!; ans++; tn[e] = "found"; const missed = heap.filter((x) => items[x][1] < day + 1); missed.forEach((x) => (tn[x] = "bad")); heap = heap.filter((x) => items[x][1] >= day + 1); frames.push({ note: `day ${day}: attend [${items[e].join(", ")}] (ends soonest), total ${ans}${missed.length ? `; ${missed.length} event${missed.length > 1 ? "s" : ""} expired` : ""}`, tones: { ...tones(heap, "window"), ...tn, [e]: "active" }, line: day }); day++; }
      return { kind: "intervals", title: `Events attended: ${ans}`, items, frames };
    },
  },

  "minimum-time-to-complete-trips": {
    approach: "Binary search the time T: the trips done by T is sum(T // t), which only grows with T.",
    idea: ["Feasibility is monotone: if T is enough, any larger T is too.", "Search between 1 and min(time) × totalTrips (the fastest bus alone gets there).", "Take the smallest T whose trip count reaches the goal."],
    code: `def minimumTime(time, totalTrips):
    lo, hi = 1, min(time) * totalTrips
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(mid // t for t in time) >= totalTrips:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log(min·trips))", space: "O(1)",
    viz: () => {
      const time = [1, 2, 3], goal = 5, frames: CellsFrame[] = []; let lo = 1, hi = Math.min(...time) * goal;
      while (lo < hi) { const mid = (lo + hi) >> 1, per = time.map((t) => Math.floor(mid / t)), s = per.reduce((a, b) => a + b, 0); frames.push({ note: `T = ${mid}: trips [${per.join(", ")}] = ${s} ${s >= goal ? `≥ ${goal}, try smaller (hi = ${mid})` : `< ${goal}, need more (lo = ${mid + 1})`}`, rows: [time, per], tones: range(0, time.length - 1, 1, s >= goal ? "found" : "bad") }); if (s >= goal) hi = mid; else lo = mid + 1; }
      frames.push({ note: `lo = hi = ${lo}: the least time`, rows: [time, time.map((t) => Math.floor(lo / t))], tones: range(0, time.length - 1, 1, "found") });
      return cells(`Least time for ${goal} trips: ${lo}`, [time, blank(time.length)], frames, ["bus time", "trips by T"]);
    },
  },

  "score-after-flipping-matrix": {
    approach: "Flip every row that starts with 0 (the leading bit outweighs all others), then flip each column if it has more 0s than 1s.",
    idea: ["The first column's bit is worth more than all later bits together, so every row should start with 1.", "After that, each column independently contributes max(ones, zeros) × its place value.", "With rows flipped to lead with 1, a cell ends up 1 exactly when it equals its row's first cell."],
    code: `def matrixScore(grid):
    R, C = len(grid), len(grid[0])
    total = 0
    for c in range(C):
        ones = sum(grid[r][c] == grid[r][0] for r in range(R))
        total += max(ones, R - ones) << (C - 1 - c)
    return total`,
    lang: "python", time: "O(R·C)", space: "O(1)",
    viz: () => {
      const g = [[0, 0, 1, 1], [1, 0, 1, 0], [1, 1, 0, 0]], R = 3, C = 4, m = g.map((r) => (r[0] ? [...r] : r.map((x) => 1 - x))), frames: TableFrame[] = [{ note: "flip rows that start with 0", cells: grid(m), tones: keys(g.flatMap((r, i) => (r[0] ? [] : Array.from({ length: C }, (_, c) => `${i}:${c}`))), "window") }]; let total = 0;
      for (let c = 0; c < C; c++) { const ones = m.filter((r) => r[c]).length, flip = ones * 2 < R; if (flip) m.forEach((r) => (r[c] = 1 - r[c])); const v = Math.max(ones, R - ones) << (C - 1 - c); total += v; frames.push({ note: `column ${c}: ${ones} one${ones === 1 ? "" : "s"}${flip ? ", flip it" : ""} → ${Math.max(ones, R - ones)} × ${1 << (C - 1 - c)} = ${v} (total ${total})`, cells: grid(m), tones: keys(m.map((_, r) => `${r}:${c}`), flip ? "active" : "found") }); }
      return { kind: "table", title: `Max score: ${total}`, rowHead: heads(R, "r"), colHead: heads(C, "c"), frames };
    },
  },

  "reduction-operations-to-make-the-array-elements-equal": {
    approach: "Sort ascending; each element needs as many operations as there are distinct smaller values, so add the running count of value changes.",
    idea: ["The largest value steps down to the next largest, then again, until it reaches the minimum.", "A value with k distinct values below it is reduced k times.", "After sorting, k is the number of times the value has changed so far."],
    code: `def reductionOperations(nums):
    nums.sort()
    ops = steps = 0
    for i in range(1, len(nums)):
        if nums[i] != nums[i - 1]:
            steps += 1
        ops += steps
    return ops`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const a = [1, 1, 2, 2, 3, 5].sort((p, q) => p - q), st: (string | number)[] = blank(a.length), frames: CellsFrame[] = []; let ops = 0, steps = 0; st[0] = 0;
      for (let i = 1; i < a.length; i++) { if (a[i] !== a[i - 1]) steps++; ops += steps; st[i] = steps; frames.push({ note: `${a[i]} has ${steps} distinct smaller value${steps === 1 ? "" : "s"} → ${steps} operation${steps === 1 ? "" : "s"} (total ${ops})`, rows: [a, [...st]], tones: { [`1:${i}`]: "active", [`0:${i}`]: "active" } }); }
      return cells(`Operations: ${ops}`, [a, blank(a.length)], frames, ["sorted", "ops"]);
    },
  },

  "cherry-pickup": {
    approach: "Turn the round trip into two people walking from the top-left to the bottom-right at the same time; DP over the step and both rows.",
    idea: ["The way back is just another path forward, so send two walkers together.", "After t steps a walker in row r is in column t - r, so (t, r1, r2) describes both. A shared cell is counted once.", "dp[r1][r2] at step t = cherries here + best of the four ways both could have arrived."],
    code: `def cherryPickup(grid):
    n, NEG = len(grid), float("-inf")
    dp = [[NEG] * n for _ in range(n)]
    dp[0][0] = grid[0][0]
    for t in range(1, 2 * n - 1):
        nxt = [[NEG] * n for _ in range(n)]
        for r1 in range(max(0, t - n + 1), min(n, t + 1)):
            for r2 in range(max(0, t - n + 1), min(n, t + 1)):
                c1, c2 = t - r1, t - r2
                if grid[r1][c1] < 0 or grid[r2][c2] < 0:
                    continue
                best = max(dp[a][b] for a in (r1 - 1, r1) for b in (r2 - 1, r2) if a >= 0 and b >= 0)
                gain = grid[r1][c1] + (grid[r2][c2] if r1 != r2 else 0)
                nxt[r1][r2] = best + gain
        dp = nxt
    return max(0, dp[n - 1][n - 1])`,
    lang: "python", time: "O(n³)", space: "O(n²)",
    viz: () => {
      const g = [[0, 1, -1], [1, 0, -1], [1, 1, 1]], n = 3, NEG = -1e9, frames: TableFrame[] = []; let dp = Array.from({ length: n }, () => Array(n).fill(NEG)); dp[0][0] = g[0][0];
      const show = grid(g).map((r) => r.map((x) => (x === -1 ? "#" : x)));
      for (let t = 1; t < 2 * n - 1; t++) { const nx = Array.from({ length: n }, () => Array(n).fill(NEG)); let bv = NEG, b1 = 0, b2 = 0; for (let r1 = Math.max(0, t - n + 1); r1 < Math.min(n, t + 1); r1++) for (let r2 = Math.max(0, t - n + 1); r2 < Math.min(n, t + 1); r2++) { const c1 = t - r1, c2 = t - r2; if (g[r1][c1] < 0 || g[r2][c2] < 0) continue; let best = NEG; for (const a of [r1 - 1, r1]) for (const b of [r2 - 1, r2]) if (a >= 0 && b >= 0) best = Math.max(best, dp[a][b]); if (best <= NEG / 2) continue; nx[r1][r2] = best + g[r1][c1] + (r1 !== r2 ? g[r2][c2] : 0); if (nx[r1][r2] > bv) { bv = nx[r1][r2]; b1 = r1; b2 = r2; } } dp = nx; const diag = Array.from({ length: n }, (_, r) => r).filter((r) => t - r >= 0 && t - r < n).map((r) => `${r}:${t - r}`); frames.push({ note: `step ${t}: best so far ${bv} with walkers at (${b1},${t - b1}) and (${b2},${t - b2})`, cells: show, tones: { ...keys(diag, "window"), ...keys([`${b1}:${t - b1}`, `${b2}:${t - b2}`], "found") } }); }
      const ans = Math.max(0, dp[n - 1][n - 1]);
      return { kind: "table", title: `Cherries collected: ${ans}`, rowHead: heads(n, "r"), colHead: heads(n, "c"), frames };
    },
  },

  "3sum-closest": {
    approach: "Sort; fix the first number and move two pointers inward, keeping the sum closest to the target.",
    idea: ["For fixed i, a sum below the target can only get closer by moving the left pointer right; above it, by moving the right pointer left.", "Track the best sum by distance to the target.", "An exact hit can return immediately."],
    code: `def threeSumClosest(nums, target):
    nums.sort()
    best = nums[0] + nums[1] + nums[2]
    for i in range(len(nums) - 2):
        j, k = i + 1, len(nums) - 1
        while j < k:
            s = nums[i] + nums[j] + nums[k]
            if abs(s - target) < abs(best - target):
                best = s
            if s < target:
                j += 1
            elif s > target:
                k -= 1
            else:
                return s
    return best`,
    lang: "python", time: "O(n²)", space: "O(1)",
    viz: () => {
      const a = [-1, 2, 1, -4, 3].sort((p, q) => p - q), target = 1, frames: CellsFrame[] = []; let best = a[0] + a[1] + a[2];
      outer: for (let i = 0; i < a.length - 2; i++) { let j = i + 1, k = a.length - 1; while (j < k) { const s = a[i] + a[j] + a[k]; if (Math.abs(s - target) < Math.abs(best - target)) best = s; frames.push({ note: `${a[i]} + ${a[j]} + ${a[k]} = ${s} (best ${best})${s < target ? ", too small: j++" : s > target ? ", too big: k--" : ", exact"}`, tones: { [`0:${i}`]: "found", [`0:${j}`]: "active", [`0:${k}`]: "active" }, marks: [{ i, label: "i" }, { i: j, label: "j" }, { i: k, label: "k" }] }); if (s < target) j++; else if (s > target) k--; else break outer; } }
      return cells(`Closest to ${target}: ${best}`, [a], frames);
    },
  },

  "palindrome-pairs": {
    approach: "Store every reversed word in a map; split each word into prefix + suffix, and when one part is a palindrome, look up the reverse of the other part.",
    idea: ["If prefix is a palindrome and some word equals reverse(suffix), that word + this word reads the same both ways.", "If suffix is a palindrome and some word equals reverse(prefix), this word + that word is a palindrome.", "Skip the empty split on the second check so a pair is not found twice."],
    code: `def palindromePairs(words):
    idx = {w[::-1]: i for i, w in enumerate(words)}
    out = []
    for i, w in enumerate(words):
        for k in range(len(w) + 1):
            pre, suf = w[:k], w[k:]
            if pre == pre[::-1] and suf in idx and idx[suf] != i:
                out.append([idx[suf], i])
            if k != len(w) and suf == suf[::-1] and pre in idx and idx[pre] != i:
                out.append([i, idx[pre]])
    return out`,
    lang: "python", time: "O(n · L²)", space: "O(n · L)",
    viz: () => {
      const words = ["abcd", "dcba", "lls", "s", "sssll"], idx = new Map(words.map((w, i) => [[...w].reverse().join(""), i])), pal = (x: string) => x === [...x].reverse().join(""), frames: TableFrame[] = [], out: number[][] = [];
      words.forEach((w, i) => { for (let k = 0; k <= w.length; k++) { const pre = w.slice(0, k), suf = w.slice(k); if (pal(pre) && idx.has(suf) && idx.get(suf) !== i) { const j = idx.get(suf)!; out.push([j, i]); frames.push({ note: `"${w}": prefix "${pre}" is a palindrome and "${words[j]}" reverses the rest → "${words[j]}${w}"`, cells: [words], tones: { ["0:" + j]: "active", ["0:" + i]: "found" } }); } if (k !== w.length && pal(suf) && idx.has(pre) && idx.get(pre) !== i) { const j = idx.get(pre)!; out.push([i, j]); frames.push({ note: `"${w}": suffix "${suf}" is a palindrome and "${words[j]}" reverses "${pre}" → "${w}${words[j]}"`, cells: [words], tones: { ["0:" + i]: "found", ["0:" + j]: "active" } }); } } });
      return { kind: "table", title: `Pairs: ${out.map((p) => `[${p.join(",")}]`).join(" ")}`, rowHead: ["words"], colHead: heads(words.length), frames };
    },
  },
  "find-the-original-array-of-prefix-xor": {
    approach: "XOR undoes itself, so arr[i] = pref[i] ^ pref[i - 1].",
    idea: ["pref[i] = pref[i - 1] ^ arr[i].", "XOR both sides with pref[i - 1]: arr[i] = pref[i] ^ pref[i - 1].", "arr[0] = pref[0]."],
    code: `def findArray(pref):
    return [pref[0]] + [pref[i] ^ pref[i - 1] for i in range(1, len(pref))]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const p = [5, 2, 0, 3, 1], out: (string | number)[] = blank(p.length), frames: CellsFrame[] = [];
      p.forEach((x, i) => { out[i] = i ? x ^ p[i - 1] : x; frames.push({ note: i ? `arr[${i}] = ${x} ^ ${p[i - 1]} = ${out[i]}` : `arr[0] = pref[0] = ${x}`, rows: [p, [...out]], tones: { [`0:${i}`]: "active", ...(i ? { [`0:${i - 1}`]: "window" as Tone } : {}), [`1:${i}`]: "found" } }); });
      return cells(`Original: [${out.join(", ")}]`, [p, blank(p.length)], frames, ["pref", "arr"]);
    },
  },

  "remove-invalid-parentheses": {
    approach: "BFS over strings, removing one parenthesis per level; the first level that contains valid strings has the fewest removals, so return all of them.",
    idea: ["Level d holds every string reachable by d removals (a set removes duplicates).", "Check each string with a balance counter: never below 0, ending at 0.", "The first level with any valid string is the answer; stop there."],
    code: `def removeInvalidParentheses(s):
    def valid(t):
        bal = 0
        for c in t:
            if c == "(":
                bal += 1
            elif c == ")":
                bal -= 1
                if bal < 0:
                    return False
        return bal == 0
    level = {s}
    while True:
        good = [t for t in level if valid(t)]
        if good:
            return good
        level = {t[:i] + t[i + 1:] for t in level for i in range(len(t)) if t[i] in "()"}`,
    lang: "python", time: "O(n · 2ⁿ) worst case", space: "O(2ⁿ)",
    viz: () => {
      const s = "()())()", valid = (t: string) => { let b = 0; for (const c of t) { if (c === "(") b++; else if (c === ")" && --b < 0) return false; } return b === 0; }, frames: TableFrame[] = [], rows: string[][] = [];
      let level = [s]; const W = 6;
      for (let d = 0; ; d++) { const good = level.filter(valid); rows.push(level.slice(0, W)); const cellsNow = rows.map((r) => [...r, ...Array(W - r.length).fill(null)]); frames.push({ note: good.length ? `level ${d}: valid strings ${good.map((g) => `"${g}"`).join(", ")} → stop` : `level ${d}: ${level.length} string${level.length > 1 ? "s" : ""}, none valid → remove one more bracket`, cells: cellsNow, tones: keys(level.slice(0, W).map((t, j) => (valid(t) ? `${d}:${j}` : "")).filter(Boolean), "found") }); if (good.length) break; level = [...new Set(level.flatMap((t) => [...t].map((c, i) => (c === "(" || c === ")" ? t.slice(0, i) + t.slice(i + 1) : "")).filter((x, i) => "()".includes(t[i]))))]; }
      return { kind: "table", title: `Fewest removals from "${s}"`, rowHead: rows.map((_, d) => `${d} removed`), colHead: heads(W), frames };
    },
  },

  "minimum-average-difference": {
    approach: "One pass with a running prefix sum: the left average is prefix // (i + 1) and the right average uses total - prefix.",
    idea: ["Precompute the total so the right side's sum is total - prefix.", "The right side is empty at the last index; its average counts as 0.", "Keep the first index with the smallest absolute difference."],
    code: `def minimumAverageDifference(nums):
    n, total, pre = len(nums), sum(nums), 0
    best, ans = float("inf"), 0
    for i, x in enumerate(nums):
        pre += x
        left = pre // (i + 1)
        right = (total - pre) // (n - i - 1) if i < n - 1 else 0
        if abs(left - right) < best:
            best, ans = abs(left - right), i
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 5, 3, 9, 5, 3], n = a.length, total = a.reduce((x, y) => x + y, 0), diff: (string | number)[] = blank(n), frames: CellsFrame[] = []; let pre = 0, best = -1, ans = 0;
      a.forEach((x, i) => { pre += x; const l = Math.floor(pre / (i + 1)), r = i < n - 1 ? Math.floor((total - pre) / (n - i - 1)) : 0, d = Math.abs(l - r); if (best < 0 || d < best) { best = d; ans = i; } diff[i] = d; frames.push({ note: `i = ${i}: left ${pre} / ${i + 1} → ${l}, right ${i < n - 1 ? `${total - pre} / ${n - i - 1} → ${r}` : "empty → 0"}; difference ${d} (best index ${ans})`, rows: [a, [...diff]], tones: { ...range(0, i), ...range(i + 1, n - 1, 0, "muted"), [`1:${ans}`]: "found" } }); });
      return cells(`Minimum average difference at index ${ans}`, [a, blank(n)], frames, ["nums", "|diff|"]);
    },
  },

  "find-longest-special-substring-that-occurs-thrice-i": {
    approach: "Only runs of one letter matter. For each letter take its three longest runs a ≥ b ≥ c; the best length occurring three times is max(a - 2, min(a - 1, b), c).",
    idea: ["A special substring of length L inside a run of length r appears r - L + 1 times.", "Three copies come from: one run (a - 2), the top two runs together (min(a - 1, b)), or three different runs (c).", "Take the best over all letters; 0 means none, so return -1."],
    code: `from collections import defaultdict
from itertools import groupby
def maximumLength(s):
    runs = defaultdict(list)
    for ch, g in groupby(s):
        runs[ch].append(len(list(g)))
    best = -1
    for lens in runs.values():
        a, b, c = (sorted(lens, reverse=True) + [0, 0])[:3]
        best = max(best, a - 2, min(a - 1, b), c)
    return best if best > 0 else -1`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const s = "aaabaacaa", runs = new Map<string, number[]>(), frames: TableFrame[] = []; let best = -1;
      for (let i = 0; i < s.length;) { let j = i; while (j < s.length && s[j] === s[i]) j++; runs.set(s[i], [...(runs.get(s[i]) || []), j - i]); i = j; }
      const letters = [...runs.keys()], rows: (string | number | null)[][] = letters.map(() => [null, null, null, null]);
      letters.forEach((ch, r) => { const [a, b, c] = [...runs.get(ch)!.sort((x, y) => y - x), 0, 0].slice(0, 3), v = Math.max(a - 2, Math.min(a - 1, b), c); best = Math.max(best, v); rows[r] = [a, b, c, v]; frames.push({ note: `'${ch}' runs ${a}, ${b}, ${c}: max(${a} - 2, min(${a - 1}, ${b}), ${c}) = ${v} (best ${best})`, cells: rows.map((x) => [...x]), active: [r, 3] }); });
      const ans = best > 0 ? best : -1;
      return { kind: "table", title: `"${s}": ${ans}`, rowHead: letters, colHead: ["a", "b", "c", "length"], frames };
    },
  },

  "shortest-palindrome": {
    approach: "Find the longest palindromic prefix with KMP on s + '#' + reverse(s); reverse what is left after it and put it in front.",
    idea: ["Adding characters only in front means s must keep its longest palindromic prefix and mirror the rest.", "A prefix of s is a palindrome when it equals a suffix of reverse(s); the KMP failure value at the end of s + '#' + rev gives the longest such match.", "The '#' stops matches from running past the middle."],
    code: `def shortestPalindrome(s):
    t = s + "#" + s[::-1]
    lps = [0] * len(t)
    for i in range(1, len(t)):
        k = lps[i - 1]
        while k and t[i] != t[k]:
            k = lps[k - 1]
        if t[i] == t[k]:
            k += 1
        lps[i] = k
    return s[lps[-1]:][::-1] + s`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "aabba", t = s + "#" + [...s].reverse().join(""), lps = Array(t.length).fill(0), shown: (string | number)[] = blank(t.length), frames: CellsFrame[] = []; shown[0] = 0;
      for (let i = 1; i < t.length; i++) { let k = lps[i - 1]; while (k && t[i] !== t[k]) k = lps[k - 1]; if (t[i] === t[k]) k++; lps[i] = k; shown[i] = k; frames.push({ note: `lps[${i}] = ${k}: longest prefix that also ends at position ${i} has length ${k}`, rows: [[...t], [...shown]], tones: { [`1:${i}`]: "active", ...(k ? range(i - k + 1, i) : {}) } }); }
      const L = lps[t.length - 1], ans = [...s.slice(L)].reverse().join("") + s;
      frames.push({ note: `palindromic prefix "${s.slice(0, L)}" (length ${L}); put "${[...s.slice(L)].reverse().join("")}" in front → "${ans}"`, rows: [[...t], lps], tones: { ...range(0, L - 1, 0, "found"), [`1:${t.length - 1}`]: "found" } });
      return cells(`"${s}" → "${ans}"`, [[...t], blank(t.length)], frames, ["s#rev", "lps"]);
    },
  },

  "minimum-number-of-days-to-make-m-bouquets": {
    approach: "Binary search the day: by day d, count bouquets made from runs of k adjacent bloomed flowers, which only grows with d.",
    idea: ["If m·k exceeds the number of flowers, it is impossible.", "For a day d, scan once: extend the run on bloomed flowers, reset on others, and cut a bouquet when the run reaches k.", "The smallest d with at least m bouquets is the answer."],
    code: `def minDays(bloomDay, m, k):
    if m * k > len(bloomDay):
        return -1
    def ok(d):
        made = run = 0
        for b in bloomDay:
            run = run + 1 if b <= d else 0
            if run == k:
                made += 1
                run = 0
        return made >= m
    lo, hi = min(bloomDay), max(bloomDay)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log max)", space: "O(1)",
    viz: () => {
      const b = [7, 7, 7, 7, 12, 7, 7], m = 2, k = 3, frames: CellsFrame[] = []; let lo = Math.min(...b), hi = Math.max(...b);
      const test = (d: number) => { let made = 0, run = 0; const tn: Record<string, Tone> = {}; b.forEach((x, i) => { run = x <= d ? run + 1 : 0; tn[`0:${i}`] = x <= d ? "window" : "muted"; if (run === k) { made++; run = 0; for (let j = i - k + 1; j <= i; j++) tn[`0:${j}`] = "found"; } }); return { made, tn }; };
      while (lo < hi) { const mid = (lo + hi) >> 1, { made, tn } = test(mid); frames.push({ note: `day ${mid}: ${made} bouquet${made === 1 ? "" : "s"} ${made >= m ? `≥ ${m}, try earlier (hi = ${mid})` : `< ${m}, wait longer (lo = ${mid + 1})`}`, tones: tn }); if (made >= m) hi = mid; else lo = mid + 1; }
      frames.push({ note: `answer: day ${lo}`, tones: test(lo).tn });
      return cells(`${m} bouquets of ${k}: day ${lo}`, [b], frames);
    },
  },

  "shortest-path-in-a-grid-with-obstacles-elimination": {
    approach: "BFS over states (row, col, eliminations left); revisit a cell only when arriving with more eliminations left than any earlier visit.",
    idea: ["BFS by layers gives the fewest steps, but the same cell can matter with different numbers of eliminations left.", "Stepping onto a 1 costs one elimination; drop moves that would go below 0.", "Earlier visits had fewer steps, so a later visit only helps if it has more eliminations left. If k ≥ R + C - 2 the straight path works."],
    code: `from collections import deque
def shortestPath(grid, k):
    R, C = len(grid), len(grid[0])
    if k >= R + C - 2:
        return R + C - 2
    best = [[-1] * C for _ in range(R)]
    best[0][0] = k
    q, steps = deque([(0, 0, k)]), 0
    while q:
        for _ in range(len(q)):
            r, c, left = q.popleft()
            if (r, c) == (R - 1, C - 1):
                return steps
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < R and 0 <= nc < C:
                    nl = left - grid[nr][nc]
                    if nl > best[nr][nc]:
                        best[nr][nc] = nl
                        q.append((nr, nc, nl))
        steps += 1
    return -1`,
    lang: "python", time: "O(R·C·k)", space: "O(R·C)",
    viz: () => {
      const g = [[0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 0]], k = 1, R = 5, C = 3, best = g.map((r) => r.map(() => -1)), show = g.map((r) => r.map((x) => (x ? "#" : ""))) as (string | number | null)[][], frames: TableFrame[] = []; best[0][0] = k; show[0][0] = 0;
      let q: [number, number, number][] = [[0, 0, k]], steps = 0, ans = -1;
      while (q.length) { if (q.some(([r, c]) => r === R - 1 && c === C - 1)) { ans = steps; break; } const nx: [number, number, number][] = []; for (const [r, c, left] of q) for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (nr >= 0 && nr < R && nc >= 0 && nc < C) { const nl = left - g[nr][nc]; if (nl > best[nr][nc]) { best[nr][nc] = nl; nx.push([nr, nc, nl]); if (show[nr][nc] === "" || show[nr][nc] === "#") show[nr][nc] = g[nr][nc] ? `${steps + 1}*` : steps + 1; } } steps++; q = nx; frames.push({ note: `step ${steps}: ${nx.length} new state${nx.length === 1 ? "" : "s"}${nx.some(([r, c]) => g[r][c]) ? " (* = reached by breaking a wall)" : ""}`, cells: show.map((r) => [...r]), tones: keys(nx.map(([r, c]) => `${r}:${c}`), "window") }); }
      frames.push({ note: ans >= 0 ? `bottom-right reached in ${ans} steps` : "unreachable", cells: show.map((r) => [...r]), active: [R - 1, C - 1] });
      return { kind: "table", title: `Shortest path with k = ${k}: ${ans}`, rowHead: heads(R, "r"), colHead: heads(C, "c"), frames };
    },
  },

  "letter-case-permutation": {
    approach: "Build the strings left to right: each letter doubles the list (lower and upper), each digit just extends it.",
    idea: ["Every letter is an independent two-way choice; digits have one.", "Keep all partial strings and extend each with the options for the next character.", "There are 2^(letters) results."],
    code: `def letterCasePermutation(s):
    out = [""]
    for c in s:
        opts = (c.lower(), c.upper()) if c.isalpha() else (c,)
        out = [p + x for p in out for x in opts]
    return out`,
    lang: "python", time: "O(2ⁿ · n)", space: "O(2ⁿ · n)",
    viz: () => {
      const s = "a1b2", frames: TableFrame[] = [], rows: string[][] = []; let out = [""];
      for (const c of s) { const opts = /[a-z]/i.test(c) ? [c.toLowerCase(), c.toUpperCase()] : [c]; out = out.flatMap((p) => opts.map((x) => p + x)); rows.push([...out]); frames.push({ note: `'${c}': ${opts.length > 1 ? "letter, every string splits in two" : "digit, append it"} → ${out.length} string${out.length > 1 ? "s" : ""}`, cells: rows.map((r) => [...r, ...Array(4 - r.length).fill(null)]), tones: keys(out.map((_, j) => `${rows.length - 1}:${j}`), "found") }); }
      return { kind: "table", title: `"${s}": ${out.join(", ")}`, rowHead: [...s].map((c) => `after ${c}`), colHead: heads(4), frames };
    },
  },

  "range-sum-of-sorted-subarray-sums": {
    approach: "List every subarray sum with a running total from each start (n ≤ 1000, so about 500k sums), sort, and add up positions left..right.",
    idea: ["From start i, extending one element at a time gives each sum in O(1).", "Sort the n(n + 1)/2 sums.", "Sum the slice [left - 1, right) and take it mod 1e9 + 7. A heap or binary search on the value avoids storing all sums if n were larger."],
    code: `def rangeSum(nums, n, left, right):
    sums = []
    for i in range(n):
        s = 0
        for j in range(i, n):
            s += nums[j]
            sums.append(s)
    sums.sort()
    return sum(sums[left - 1:right]) % (10**9 + 7)`,
    lang: "python", time: "O(n² log n)", space: "O(n²)",
    viz: () => {
      const a = [1, 2, 3, 4], n = 4, L = 1, Rt = 5, M: (number | null)[][] = a.map(() => Array(n).fill(null)), frames: TableFrame[] = [], sums: number[] = [];
      for (let i = 0; i < n; i++) { let s = 0; for (let j = i; j < n; j++) { s += a[j]; M[i][j] = s; sums.push(s); } frames.push({ note: `start ${i}: running sums ${M[i].filter((x) => x != null).join(", ")}`, cells: M.map((r) => [...r]), tones: keys(Array.from({ length: n - i }, (_, d) => `${i}:${i + d}`), "window") }); }
      const sorted = [...sums].sort((p, q) => p - q), pick = sorted.slice(L - 1, Rt), tot = pick.reduce((p, q) => p + q, 0);
      frames.push({ note: `sorted: [${sorted.join(", ")}]; positions ${L}..${Rt} are [${pick.join(", ")}] → ${tot}`, cells: M, tones: keys(M.flatMap((r, i) => r.map((v, j) => (v != null && pick.includes(v) ? `${i}:${j}` : ""))).filter(Boolean), "found") });
      return { kind: "table", title: `Sum of sorted positions ${L}..${Rt}: ${tot}`, rowHead: heads(n, "from "), colHead: heads(n, "to "), frames };
    },
  },

  "maximum-running-time-of-n-computers": {
    approach: "Binary search the running time T: it is achievable when the batteries can supply n·T minutes, counting each battery for at most T.",
    idea: ["A battery can power at most one computer at a time, so over T minutes it contributes at most min(b, T).", "If the capped total is at least n·T, swapping batteries freely makes it work.", "Feasibility shrinks as T grows, so find the largest feasible T (upper bound sum // n)."],
    code: `def maxRunTime(n, batteries):
    lo, hi = 0, sum(batteries) // n
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if sum(min(b, mid) for b in batteries) >= n * mid:
            lo = mid
        else:
            hi = mid - 1
    return lo`,
    lang: "python", time: "O(m log(sum/n))", space: "O(1)",
    viz: () => {
      const n = 2, bat = [3, 3, 3], frames: CellsFrame[] = []; let lo = 0, hi = Math.floor(bat.reduce((a, b) => a + b, 0) / n);
      while (lo < hi) { const mid = (lo + hi + 1) >> 1, cap = bat.map((b) => Math.min(b, mid)), s = cap.reduce((a, b) => a + b, 0), ok = s >= n * mid; frames.push({ note: `T = ${mid}: capped supply ${cap.join(" + ")} = ${s} ${ok ? `≥ ${n} × ${mid}, works (lo = ${mid})` : `< ${n} × ${mid}, too long (hi = ${mid - 1})`}`, rows: [bat, cap], tones: range(0, bat.length - 1, 1, ok ? "found" : "bad") }); if (ok) lo = mid; else hi = mid - 1; }
      return cells(`${n} computers run for ${lo} minutes`, [bat, blank(bat.length)], frames, ["battery", "min(b, T)"]);
    },
  },

  "minimum-height-trees": {
    approach: "Peel leaves layer by layer, like burning the tree from the outside; the one or two nodes left at the end are the centres.",
    idea: ["The best roots are the middle of the longest path, so they are the last nodes reached when trimming from every leaf at once.", "Remove all current leaves, lower their neighbours' degrees, and collect the new leaves.", "Stop when at most two nodes remain."],
    code: `def findMinHeightTrees(n, edges):
    if n == 1:
        return [0]
    g = [set() for _ in range(n)]
    for a, b in edges:
        g[a].add(b)
        g[b].add(a)
    leaves = [i for i in range(n) if len(g[i]) == 1]
    left = n
    while left > 2:
        left -= len(leaves)
        nxt = []
        for x in leaves:
            y = g[x].pop()
            g[y].remove(x)
            if len(g[y]) == 1:
                nxt.append(y)
        leaves = nxt
    return leaves`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 6, E = [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]], nodes = [{ id: 0, label: "0", x: 10, y: 15 }, { id: 1, label: "1", x: 10, y: 50 }, { id: 2, label: "2", x: 10, y: 85 }, { id: 3, label: "3", x: 40, y: 50 }, { id: 4, label: "4", x: 70, y: 50 }, { id: 5, label: "5", x: 95, y: 50 }];
      const g = Array.from({ length: n }, () => new Set<number>()); E.forEach(([a, b]) => { g[a].add(b); g[b].add(a); });
      let leaves = [...g.keys()].filter((i) => g[i].size === 1), left = n; const gone: number[] = [], et: Record<string, Tone> = {}, frames: GraphFrame[] = [];
      while (left > 2) { frames.push({ note: `trim leaves ${leaves.join(", ")}`, tones: { ...tones(gone, "muted"), ...tones(leaves, "bad") }, edgeTones: { ...et } }); left -= leaves.length; const nx: number[] = []; for (const x of leaves) { const y = [...g[x]][0]; g[x].delete(y); g[y].delete(x); et[ek(x, y)] = "muted"; gone.push(x); if (g[y].size === 1) nx.push(y); } leaves = nx; }
      frames.push({ note: `${left} node${left > 1 ? "s" : ""} left: [${leaves.join(", ")}] are the roots of minimum height`, tones: { ...tones(gone, "muted"), ...tones(leaves, "found") }, edgeTones: { ...et } });
      return { kind: "graph", title: `Minimum height roots: [${leaves.join(", ")}]`, nodes, edges: E.map(([a, b]) => ({ a, b })), frames };
    },
  },
};
