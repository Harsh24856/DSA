// Hand-written solutions for the slugs listed under "batch4" in batches.json. See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { bin, levelTree, range, type TNode } from "../sim.ts";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const nums = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const grid = (title: string, R: number, C: number, frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead: nums(R), colHead: nums(C), frames });
const all = (keys: (string | number)[], t: Tone) => Object.fromEntries(keys.map((k) => [k, t])) as Record<string, Tone>;
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });

export const BATCH4: Record<string, Solution> = {
  "equal-row-and-column-pairs": {
    approach: "Count every row as a tuple, then look each column up in that counter.",
    idea: ["A row and a column are equal when their values match in order, so a tuple works as a dictionary key.", "Count how often each row tuple appears.", "For each column tuple, add the number of rows equal to it."],
    code: `from collections import Counter
def equalPairs(grid):
    rows = Counter(tuple(r) for r in grid)
    return sum(rows[col] for col in zip(*grid))`,
    lang: "python", time: "O(n²)", space: "O(n²)",
    viz: () => {
      const g = [[3, 1, 2, 2], [1, 4, 4, 5], [2, 4, 2, 2], [2, 4, 2, 2]], key = (a: number[]) => a.join(","), rows = new Map<string, number>();
      g.forEach((r) => rows.set(key(r), (rows.get(key(r)) || 0) + 1));
      const frames: TableFrame[] = [{ note: `Count rows: ${[...rows].map(([k, c]) => `(${k}) x${c}`).join(", ")}`, cells: g }]; let ans = 0;
      for (let j = 0; j < 4; j++) {
        const col = g.map((r) => r[j]), c = rows.get(key(col)) || 0, t: Record<string, Tone> = {}; ans += c;
        g.forEach((r, i) => { t[`${i}:${j}`] = "window"; if (key(r) === key(col)) r.forEach((_, k) => (t[`${i}:${k}`] = "found")); });
        frames.push({ note: `column ${j} = (${col.join(",")}) equals ${c} row${c === 1 ? "" : "s"} (total ${ans})`, cells: g, tones: t });
      }
      return grid(`Equal row and column pairs: ${ans}`, 4, 4, frames);
    },
  },

  "minimum-obstacle-removal-to-reach-corner": {
    approach: "0-1 BFS: stepping onto an empty cell costs 0 (push front), onto an obstacle costs 1 (push back).",
    idea: ["The answer is the cheapest path where each obstacle on it costs 1.", "With edge weights only 0 or 1, a deque replaces Dijkstra's heap: 0-cost moves go to the front, 1-cost moves to the back.", "Cells leave the deque in order of distance, so the corner's distance is final."],
    code: `from collections import deque
def minimumObstacles(grid):
    m, n = len(grid), len(grid[0])
    dist = [[float("inf")] * n for _ in range(m)]
    dist[0][0] = 0
    dq = deque([(0, 0)])
    while dq:
        r, c = dq.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < m and 0 <= nc < n:
                nd = dist[r][c] + grid[nr][nc]
                if nd < dist[nr][nc]:
                    dist[nr][nc] = nd
                    if grid[nr][nc]:
                        dq.append((nr, nc))
                    else:
                        dq.appendleft((nr, nc))
    return dist[m - 1][n - 1]`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const g = [[0, 1, 1], [1, 1, 0], [1, 1, 0]], m = 3, n = 3, dist = g.map((r) => r.map(() => -1)); dist[0][0] = 0;
      const dq: [number, number][] = [[0, 0]], frames: TableFrame[] = [], view = () => dist.map((r, i) => r.map((d, j) => (d < 0 ? (g[i][j] ? "#" : "") : d)));
      const wall = () => { const t: Record<string, Tone> = {}; g.forEach((r, i) => r.forEach((v, j) => { if (v) t[`${i}:${j}`] = "bad"; })); return t; };
      while (dq.length) {
        const [r, c] = dq.shift()!; const pushed: string[] = [];
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue; const nd = dist[r][c] + g[nr][nc];
          if (dist[nr][nc] < 0 || nd < dist[nr][nc]) { dist[nr][nc] = nd; if (g[nr][nc]) dq.push([nr, nc]); else dq.unshift([nr, nc]); pushed.push(`(${nr},${nc})=${nd}${g[nr][nc] ? " back" : " front"}`); }
        }
        frames.push({ note: `pop (${r},${c}) at distance ${dist[r][c]}${pushed.length ? `; improve ${pushed.join(", ")}` : "; nothing improves"}`, cells: view(), active: [r, c], tones: wall() });
      }
      frames.push({ note: `Bottom-right reached with ${dist[2][2]} obstacles removed`, cells: view(), active: [2, 2], tones: wall() });
      return grid(`Fewest obstacles to remove: ${dist[2][2]}`, 3, 3, frames);
    },
  },

  "the-kth-factor-of-n": {
    approach: "Divisors come in pairs (i, n / i) with i ≤ √n: collect the small ones in order, the large ones in reverse.",
    idea: ["Every divisor i ≤ √n has a partner n / i ≥ √n.", "Walking i up to √n gives the small divisors in increasing order and the large ones in decreasing order.", "Join small + reversed large and pick index k - 1."],
    code: `def kthFactor(n, k):
    small, large = [], []
    i = 1
    while i * i <= n:
        if n % i == 0:
            small.append(i)
            if i != n // i:
                large.append(n // i)
        i += 1
    factors = small + large[::-1]
    return factors[k - 1] if k <= len(factors) else -1`,
    lang: "python", time: "O(√n)", space: "O(√n)",
    viz: () => {
      const n = 12, k = 3, row = Array.from({ length: n }, (_, i) => i + 1), small: number[] = [], large: number[] = [], frames: CellsFrame[] = [];
      for (let i = 1; i * i <= n; i++) { const ok = n % i === 0; if (ok) { small.push(i); if (i !== n / i) large.push(n / i); } frames.push({ note: ok ? `${i} divides ${n}: small ${i}, partner ${n / i}` : `${i} does not divide ${n}`, tones: { ...all([...small, ...large].map((v) => `0:${v - 1}`), "found"), [`0:${i - 1}`]: "active" } }); }
      const f = [...small, ...large.reverse()];
      frames.push({ note: `Factors in order: [${f.join(", ")}] → k = ${k} gives ${f[k - 1]}`, tones: { ...all(f.map((v) => `0:${v - 1}`), "done"), [`0:${f[k - 1] - 1}`]: "found" } });
      return cells(`Factor ${k} of ${n} is ${f[k - 1]}`, [row], frames);
    },
  },

  "my-calendar-iii": {
    approach: "Keep +1 at each start and -1 at each end; after a booking, sweep the sorted times and track the highest running sum.",
    idea: ["The number of events covering a time is the running sum of the +1/-1 marks before it.", "Each booking adds two marks.", "Sweeping the marks in time order, the largest running sum is the answer."],
    code: `from collections import defaultdict
class MyCalendarThree:
    def __init__(self):
        self.delta = defaultdict(int)

    def book(self, startTime, endTime):
        self.delta[startTime] += 1
        self.delta[endTime] -= 1
        best = cur = 0
        for t in sorted(self.delta):
            cur += self.delta[t]
            best = max(best, cur)
        return best`,
    lang: "python", time: "O(n log n) per booking", space: "O(n)",
    viz: () => {
      const items: [number, number][] = [[10, 20], [50, 60], [10, 40], [5, 15], [5, 10], [25, 55]], delta = new Map<number, number>(), frames: { note: string; tones: Record<number, Tone>; line: number }[] = [];
      items.forEach(([s, e], b) => {
        delta.set(s, (delta.get(s) || 0) + 1); delta.set(e, (delta.get(e) || 0) - 1);
        let cur = 0, best = 0, at = s; for (const t of [...delta.keys()].sort((x, y) => x - y)) { cur += delta.get(t)!; if (cur > best) { best = cur; at = t; } }
        frames.push({ note: `book(${s}, ${e}): sweep gives the most overlap ${best}, first reached at time ${at}`, tones: Object.fromEntries(items.map((_, i) => [i, i === b ? "active" : i < b ? (items[i][0] <= at && at < items[i][1] ? "found" : "done") : "muted"])) as Record<number, Tone>, line: at });
      });
      return { kind: "intervals", title: "MyCalendarThree: most overlapping bookings", items, frames };
    },
  },

  "number-of-valid-words-for-each-puzzle": {
    approach: "Turn each word into a 26-bit letter mask and count masks; for each puzzle, enumerate submasks of its letters that include the first letter.",
    idea: ["A word is valid when its letter set is a subset of the puzzle's and contains the puzzle's first letter. Repeats do not matter, so a bitmask is enough.", "A puzzle has 7 letters, so it has at most 2^6 = 64 subsets that include the first letter.", "Sum the word counts of those subsets."],
    code: `from collections import Counter
def findNumOfValidWords(words, puzzles):
    def mask(w):
        m = 0
        for ch in w:
            m |= 1 << (ord(ch) - 97)
        return m
    count = Counter(mask(w) for w in words)
    out = []
    for p in puzzles:
        first, rest = 1 << (ord(p[0]) - 97), mask(p[1:])
        sub, total = rest, 0
        while True:
            total += count[sub | first]
            if sub == 0:
                break
            sub = (sub - 1) & rest
        out.append(total)
    return out`,
    lang: "python", time: "O(W·L + P·64)", space: "O(W)",
    viz: () => {
      const words = ["aaaa", "asas", "able", "ability", "actt", "actor", "access"], p = "abslute", m = (w: string) => [...w].reduce((a, ch) => a | (1 << (ch.charCodeAt(0) - 97)), 0);
      const letters = (x: number) => [...Array(26)].map((_, i) => (x >> i) & 1 ? String.fromCharCode(97 + i) : "").join("");
      const count = new Map<number, number>(); words.forEach((w) => count.set(m(w), (count.get(m(w)) || 0) + 1));
      const keys = [...count.keys()], row1 = keys.map(letters), row2 = keys.map((k) => count.get(k)!);
      const frames: CellsFrame[] = [{ note: `Word masks counted: ${keys.map((k, i) => `{${row1[i]}} x${row2[i]}`).join(", ")}` }];
      const first = m(p[0]), rest = m(p.slice(1)); let sub = rest, total = 0, tried = 0; const hit: string[] = [];
      for (;;) { tried++; const c = count.get(sub | first) || 0; if (c) { total += c; const i = keys.indexOf(sub | first); hit.push(`0:${i}`); frames.push({ note: `submask {${letters(sub | first)}} has ${c} word${c > 1 ? "s" : ""} → total ${total}`, tones: { ...all(hit, "done"), [`0:${i}`]: "found" } }); } if (sub === 0) break; sub = (sub - 1) & rest; }
      frames.push({ note: `"${p}": ${tried} submasks tried, ${total} valid words`, tones: all(hit, "found") });
      return cells(`Puzzle "${p}" → ${total}`, [row1, row2], frames, ["letters", "words"]);
    },
  },

  "minimum-rounds-to-complete-all-tasks": {
    approach: "Count each difficulty; a count of 1 is impossible, otherwise it needs ceil(count / 3) rounds.",
    idea: ["Rounds take 2 or 3 tasks of the same difficulty, so each difficulty is independent.", "A single task can never be done.", "Any count c ≥ 2 can be split into 3s and at most two 2s, which takes ceil(c / 3) rounds."],
    code: `from collections import Counter
def minimumRounds(tasks):
    ans = 0
    for c in Counter(tasks).values():
        if c == 1:
            return -1
        ans += (c + 2) // 3
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const tasks = [2, 2, 3, 3, 2, 4, 4, 4, 4, 4], cnt = new Map<number, number>(); tasks.forEach((t) => cnt.set(t, (cnt.get(t) || 0) + 1));
      const ks = [...cnt.keys()], c = ks.map((k) => cnt.get(k)!), r: (number | null)[] = ks.map(() => null), frames: TableFrame[] = []; let ans = 0;
      ks.forEach((k, i) => { r[i] = Math.ceil(c[i] / 3); ans += r[i]!; frames.push({ note: `difficulty ${k}: ${c[i]} tasks → ceil(${c[i]} / 3) = ${r[i]} round${r[i] === 1 ? "" : "s"} (total ${ans})`, cells: [c, [...r]], active: [1, i] }); });
      return { kind: "table", title: `Minimum rounds: ${ans}`, rowHead: ["count", "rounds"], colHead: ks.map(String), frames };
    },
  },

  "minimum-cost-of-a-path-with-special-roads": {
    approach: "Dijkstra over only the start and the road endpoints; walking between any two points costs their Manhattan distance.",
    idea: ["Walking is always allowed, so the only useful stops are the start of some special road.", "From a point, take a road by walking to its start and paying its cost; you land on its end.", "Each time a point is settled, the answer can be its distance plus the walk to the target."],
    code: `import heapq
def minimumCost(start, target, specialRoads):
    tx, ty = target
    dist = {tuple(start): 0}
    pq = [(0, start[0], start[1])]
    best = abs(tx - start[0]) + abs(ty - start[1])
    done = set()
    while pq:
        d, x, y = heapq.heappop(pq)
        if (x, y) in done:
            continue
        done.add((x, y))
        best = min(best, d + abs(tx - x) + abs(ty - y))
        for x1, y1, x2, y2, c in specialRoads:
            nd = d + abs(x1 - x) + abs(y1 - y) + c
            if nd < dist.get((x2, y2), float("inf")):
                dist[(x2, y2)] = nd
                heapq.heappush(pq, (nd, x2, y2))
    return best`,
    lang: "python", time: "O(r² log r)", space: "O(r)",
    viz: () => {
      const start = [1, 1], target = [4, 5], roads = [[1, 2, 3, 3, 2], [3, 4, 4, 5, 1]];
      const pts = [start, [roads[0][0], roads[0][1]], [roads[0][2], roads[0][3]], [roads[1][0], roads[1][1]], target];
      const id = (x: number, y: number) => pts.findIndex((p) => p[0] === x && p[1] === y), md = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
      const nodes = pts.map((p, i) => ({ id: i, label: i === 0 ? "S" : i === 4 ? "T" : `${p[0]},${p[1]}`, x: 10 + (p[0] - 1) * 27, y: 90 - (p[1] - 1) * 20 }));
      const dist = new Map<number, number>([[0, 0]]), done = new Set<number>(), pq: [number, number][] = [[0, 0]], frames: GraphFrame[] = []; let best = md(start, target);
      const badges = () => Object.fromEntries([...dist].map(([k, d]) => [k, `d=${d}`]));
      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]); const [d, u] = pq.shift()!; if (done.has(u)) continue; done.add(u);
        const walk = d + md(pts[u], target); best = Math.min(best, walk); const et: Record<string, Tone> = {};
        roads.forEach(([x1, y1, x2, y2, c]) => { const v = id(x2, y2), nd = d + md(pts[u], [x1, y1]) + c; if (nd < (dist.get(v) ?? 1e9)) { dist.set(v, nd); pq.push([nd, v]); et[`${id(x1, y1)}-${v}`] = "found"; } });
        frames.push({ note: `settle ${nodes[u].label} at ${d}; walking to T from here costs ${walk} (best ${best})`, tones: { ...Object.fromEntries([...done].map((k) => [k, "done"])), [u]: "active" }, edgeTones: et, badges: badges() });
      }
      frames.push({ note: `Cheapest cost to reach (4,5): ${best}`, tones: { 0: "found", 1: "found", 2: "found", 3: "found", 4: "found" }, badges: badges() });
      return { kind: "graph", title: `Start (1,1) to target (4,5): ${best}`, nodes, edges: roads.map(([x1, y1, x2, y2, c]) => ({ a: id(x1, y1), b: id(x2, y2), w: c, directed: true })), frames };
    },
  },

  "minimum-cost-homecoming-of-a-robot-in-a-grid": {
    approach: "Every path must enter each row and column between start and home exactly once, so just sum those costs.",
    idea: ["Moving into row r costs rowCosts[r]; detours only add more rows, never fewer.", "So any shortest path pays for each row strictly between start and home plus home's row, and the same for columns.", "Sum them; the order of moves does not matter."],
    code: `def minCost(startPos, homePos, rowCosts, colCosts):
    (r0, c0), (r1, c1) = startPos, homePos
    rows = range(r0 + 1, r1 + 1) if r1 >= r0 else range(r1, r0)
    cols = range(c0 + 1, c1 + 1) if c1 >= c0 else range(c1, c0)
    return sum(rowCosts[r] for r in rows) + sum(colCosts[c] for c in cols)`,
    lang: "python", time: "O(m + n)", space: "O(1)",
    viz: () => {
      const rc = [5, 4, 3], cc = [8, 2, 6, 7], frames: CellsFrame[] = [], rowsIn = [2], colsIn = [1, 2, 3]; let total = 0;
      frames.push({ note: "Start (1,0), home (2,3): the robot must enter row 2 and columns 1, 2, 3", tones: { "0:1": "active", "1:0": "active" } });
      const seen: string[] = [];
      rowsIn.forEach((r) => { total += rc[r]; seen.push(`0:${r}`); frames.push({ note: `enter row ${r}: +${rc[r]} (total ${total})`, tones: { ...all(seen, "found"), [`0:${r}`]: "active" } }); });
      colsIn.forEach((c) => { total += cc[c]; seen.push(`1:${c}`); frames.push({ note: `enter column ${c}: +${cc[c]} (total ${total})`, tones: { ...all(seen, "found"), [`1:${c}`]: "active" } }); });
      return cells(`Homecoming cost: ${total}`, [[...rc, ""], cc], frames, ["rowCosts", "colCosts"]);
    },
  },

  "k-similar-strings": {
    approach: "BFS over strings: at each level, fix the first mismatched position by swapping in a character that belongs there.",
    idea: ["Each level of the BFS is one more swap, so the first time s2 appears is the answer.", "Only fix the first position i where s differs from s2; swap it with a later j that holds s2[i] and is itself wrong.", "That pruning keeps the branching small and never loses the optimum."],
    code: `from collections import deque
def kSimilarity(s1, s2):
    q, seen, steps = deque([s1]), {s1}, 0
    while q:
        for _ in range(len(q)):
            s = q.popleft()
            if s == s2:
                return steps
            i = 0
            while s[i] == s2[i]:
                i += 1
            for j in range(i + 1, len(s)):
                if s[j] == s2[i] and s[j] != s2[j]:
                    t = s[:i] + s[j] + s[i + 1:j] + s[i] + s[j + 1:]
                    if t not in seen:
                        seen.add(t)
                        q.append(t)
        steps += 1`,
    lang: "python", time: "O(n² · states)", space: "O(states)",
    viz: () => {
      const s1 = "abcd", s2 = "badc", frames: StackFrame[] = []; let q = [s1]; const seen = new Set([s1]); let steps = 0, ans = -1;
      while (q.length && ans < 0) {
        frames.push({ note: `level ${steps}: queue holds ${q.length} string${q.length > 1 ? "s" : ""}`, items: [...q], side: `swaps so far: ${steps}` });
        const nq: string[] = [];
        for (const s of q) {
          if (s === s2) { ans = steps; frames.push({ note: `"${s}" equals s2 → ${steps} swaps`, items: [...q], incoming: s, side: `answer ${steps}` }); break; }
          let i = 0; while (s[i] === s2[i]) i++;
          for (let j = i + 1; j < s.length; j++) if (s[j] === s2[i] && s[j] !== s2[j]) { const t = s.slice(0, i) + s[j] + s.slice(i + 1, j) + s[i] + s.slice(j + 1); if (!seen.has(t)) { seen.add(t); nq.push(t); frames.push({ note: `"${s}": first mismatch at ${i}, swap with ${j} → "${t}"`, items: [...nq], incoming: t, side: `next level` }); } }
        }
        q = nq; steps++;
      }
      return { kind: "stack", title: `kSimilarity("${s1}", "${s2}") = ${ans}`, input: [...s2], frames };
    },
  },

  "sum-of-total-strength-of-wizards": {
    approach: "Each wizard is the minimum of the subarrays between its previous smaller and next smaller-or-equal; sum those subarrays' sums with a prefix of prefix sums.",
    idea: ["Find, with a monotonic stack, the span (L, R) where strength[i] is the minimum (strict on one side so ties are counted once).", "Sum of all subarray sums inside that span that contain i is (i - L)·(PP[R+1] - PP[i+1]) - (R - i)·(PP[i+1] - PP[L+1]), where PP is the prefix sum of prefix sums.", "Add strength[i] times that, modulo 10^9 + 7."],
    code: `def totalStrength(strength):
    MOD = 10**9 + 7
    n = len(strength)
    left, right, st = [-1] * n, [n] * n, []
    for i, x in enumerate(strength):
        while st and strength[st[-1]] >= x:
            right[st.pop()] = i
        left[i] = st[-1] if st else -1
        st.append(i)
    P = [0]
    for x in strength:
        P.append(P[-1] + x)
    PP = [0]
    for p in P:
        PP.append(PP[-1] + p)
    ans = 0
    for i, x in enumerate(strength):
        L, R = left[i], right[i]
        total = (i - L) * (PP[R + 1] - PP[i + 1]) - (R - i) * (PP[i + 1] - PP[L + 1])
        ans = (ans + x * total) % MOD
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = [1, 3, 1, 2], n = 4, left = Array(n).fill(-1), right = Array(n).fill(n), st: number[] = [];
      s.forEach((x, i) => { while (st.length && s[st[st.length - 1]] >= x) right[st.pop()!] = i; left[i] = st.length ? st[st.length - 1] : -1; st.push(i); });
      const P = [0]; s.forEach((x) => P.push(P[P.length - 1] + x)); const PP = [0]; P.forEach((p) => PP.push(PP[PP.length - 1] + p));
      const frames: CellsFrame[] = [{ note: `Spans from the monotonic stack: previous smaller [${left.join(", ")}], next smaller-or-equal [${right.join(", ")}]`, rows: [s, left, right] }]; let ans = 0;
      s.forEach((x, i) => { const L = left[i], R = right[i], tot = (i - L) * (PP[R + 1] - PP[i + 1]) - (R - i) * (PP[i + 1] - PP[L + 1]); ans += x * tot; frames.push({ note: `${x} at ${i} is the minimum of subarrays inside (${L}, ${R}); their sums add to ${tot} → +${x} x ${tot} = ${x * tot} (total ${ans})`, rows: [s, left, right], tones: { ...range(L + 1, R - 1), [`0:${i}`]: "active" } }); });
      return cells(`Total strength of [1, 3, 1, 2] = ${ans}`, [s, left, right], frames, ["strength", "left", "right"]);
    },
  },

  "delete-the-middle-node-of-a-linked-list": {
    approach: "Start fast two nodes ahead; when it runs out, slow sits just before the middle, so unlink slow.next.",
    idea: ["The middle is index n // 2. A one-node list just becomes empty.", "Slow moves 1 step and fast 2, with fast starting at index 2, so slow stops at index n // 2 - 1.", "Skip over the middle with slow.next = slow.next.next."],
    code: `def deleteMiddle(head):
    if not head.next:
        return None
    slow, fast = head, head.next.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    slow.next = slow.next.next
    return head`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const v = [1, 3, 4, 7, 1, 2, 6], n = v.length, next = v.map((_, i) => (i + 1 < n ? i + 1 : -1)), frames: ListFrame[] = []; let slow = 0, fast = 2;
      const ptrs = () => [{ i: slow, label: "slow" }, ...(fast < n ? [{ i: fast, label: "fast" }] : [])];
      frames.push({ note: "slow at the head, fast two nodes ahead", next: [...next], ptrs: ptrs() });
      while (fast < n && fast + 1 < n) { slow++; fast += 2; frames.push({ note: `slow → ${slow}, fast → ${fast < n ? fast : "null"}`, next: [...next], ptrs: ptrs(), tones: { [slow]: "active" } }); }
      const mid = slow + 1; next[slow] = next[mid]; next[mid] = -1;
      frames.push({ note: `fast is done: middle is index ${mid} (value ${v[mid]}); point slow past it`, next: [...next], ptrs: [{ i: slow, label: "slow" }], tones: { [mid]: "bad", [slow]: "found" } });
      return { kind: "list", title: "Delete the middle of 1 → 3 → 4 → 7 → 1 → 2 → 6", values: v, frames };
    },
  },

  "cousins-in-binary-tree-ii": {
    approach: "Go level by level: each child's new value is the next level's total minus the sum of its own parent's children.",
    idea: ["Cousins are nodes on the same level with a different parent.", "For one level, the cousin sum of a child is (sum of the whole level) minus (its sibling pair's sum).", "Process each parent on the current level to rewrite its children; the root and its children always become 0."],
    code: `def replaceValueInTree(root):
    root.val = 0
    level = [root]
    while level:
        nxt = [c for n in level for c in (n.left, n.right) if c]
        total = sum(c.val for c in nxt)
        for n in level:
            kids = (n.left.val if n.left else 0) + (n.right.val if n.right else 0)
            for c in (n.left, n.right):
                if c:
                    c.val = total - kids
        level = nxt
    return root`,
    lang: "python", time: "O(n)", space: "O(w)",
    viz: () => {
      const vals = [5, 4, 9, 1, 10, null, 7], { nodes, kids } = levelTree(vals), labels: Record<number, string> = { 0: "0" }, frames: TreeFrame[] = [{ note: "Root has no cousins → 0", tones: { 0: "found" }, labels: { ...labels } }];
      let level = [0];
      while (level.length) {
        const nxt = level.flatMap((p) => kids[p].filter((c): c is number => c != null)), total = nxt.reduce((a, c) => a + (vals[c] as number), 0);
        if (!nxt.length) break;
        level.forEach((p) => { const ks = kids[p].filter((c): c is number => c != null); if (!ks.length) return; const sib = ks.reduce((a, c) => a + (vals[c] as number), 0); ks.forEach((c) => (labels[c] = String(total - sib))); frames.push({ note: `level total ${total}; children of ${vals[p]} sum to ${sib} → each becomes ${total} - ${sib} = ${total - sib}`, tones: { ...all(nxt, "window"), ...all(ks, "found"), [p]: "active" }, labels: { ...labels } }); });
        level = nxt;
      }
      return tree("Replace each value with its cousins' sum", nodes, frames);
    },
  },

  "evaluate-the-bracket-pairs-of-a-string": {
    approach: "Put knowledge in a dictionary and scan once, swapping each (key) for its value or ?.",
    idea: ["Brackets are never nested, so each ( has its ) right after the key.", "Copy plain characters as they are.", "On (, read up to ), look the key up (default ?), and jump past the )."],
    code: `def evaluate(s, knowledge):
    k = dict(knowledge)
    out, i = [], 0
    while i < len(s):
        if s[i] == "(":
            j = s.index(")", i)
            out.append(k.get(s[i + 1:j], "?"))
            i = j + 1
        else:
            out.append(s[i])
            i += 1
    return "".join(out)`,
    lang: "python", time: "O(n + K)", space: "O(n + K)",
    viz: () => {
      const s = "(name)is(age)", k: Record<string, string> = { name: "bob" }, frames: CellsFrame[] = [], out: string[] = []; let i = 0;
      while (i < s.length) {
        if (s[i] === "(") { const j = s.indexOf(")", i), key = s.slice(i + 1, j), v = k[key] ?? "?"; out.push(v); frames.push({ note: `(${key}) → ${key in k ? `"${v}"` : "unknown, ?"}; output "${out.join("")}"`, tones: { ...range(i, j), [`0:${i}`]: "active", [`0:${j}`]: "active" } }); i = j + 1; }
        else { out.push(s[i]); frames.push({ note: `copy '${s[i]}'; output "${out.join("")}"`, tones: { [`0:${i}`]: "done" } }); i++; }
      }
      return cells(`"${s}" with name=bob → "${out.join("")}"`, [[...s]], frames);
    },
  },

  "find-triangular-sum-of-an-array": {
    approach: "Repeatedly replace the array with the sums of neighbours mod 10 until one number is left.",
    idea: ["Each round makes the array one shorter: new[i] = (a[i] + a[i+1]) % 10.", "n ≤ 1000, so the O(n²) simulation is fast enough.", "The last number standing is the answer."],
    code: `def triangularSum(nums):
    while len(nums) > 1:
        nums = [(a + b) % 10 for a, b in zip(nums, nums[1:])]
    return nums[0]`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      let a = [1, 2, 3, 4, 5]; const rows: (number | null)[][] = [[...a]], frames: TableFrame[] = [], pad = (r: number[]) => [...r, ...Array(5 - r.length).fill(null)];
      frames.push({ note: "Start with [1, 2, 3, 4, 5]", cells: [pad(a), ...Array(4).fill(Array(5).fill(null))] });
      while (a.length > 1) { const prev = a; a = a.slice(1).map((x, i) => (prev[i] + x) % 10); rows.push([...a]); frames.push({ note: `row ${rows.length - 1}: [${a.join(", ")}] (each = left + right of the row above, mod 10)`, cells: [...rows.map((r) => pad(r as number[])), ...Array(5 - rows.length).fill(Array(5).fill(null))], active: [rows.length - 1, 0], deps: [[rows.length - 2, 0], [rows.length - 2, 1]] }); }
      return { kind: "table", title: `Triangular sum: ${a[0]}`, rowHead: ["0", "1", "2", "3", "4"], colHead: nums(5), frames };
    },
  },

  "maximum-score-from-removing-substrings": {
    approach: "Greedy: remove every copy of the higher-scoring pair first with a stack, then remove the other pair from what is left.",
    idea: ["Removing one pair can create or destroy the other, but taking the more valuable pair as often as possible never hurts.", "A stack removes a pair the moment its second letter arrives, catching pairs formed by earlier removals.", "Run the stack twice: high pair first, then low pair on the leftovers."],
    code: `def maximumGain(s, x, y):
    def strip(s, a, b, pts):
        st, got = [], 0
        for ch in s:
            if st and st[-1] == a and ch == b:
                st.pop()
                got += pts
            else:
                st.append(ch)
        return "".join(st), got
    if x >= y:
        s, g1 = strip(s, "a", "b", x)
        s, g2 = strip(s, "b", "a", y)
    else:
        s, g1 = strip(s, "b", "a", y)
        s, g2 = strip(s, "a", "b", x)
    return g1 + g2`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s0 = "cdbcbbaaabab", x = 4, y = 5, frames: StackFrame[] = []; let total = 0;
      const strip = (s: string, a: string, b: string, pts: number) => { const st: string[] = []; for (const ch of s) { if (st.length && st[st.length - 1] === a && ch === b) { st.pop(); total += pts; frames.push({ note: `'${a}${b}' formed → remove for ${pts} (score ${total})`, items: [...st], incoming: ch, popped: [a + b], side: `pass "${a}${b}"` }); } else { st.push(ch); frames.push({ note: `push '${ch}'`, items: [...st], incoming: ch, side: `pass "${a}${b}"` }); } } return st.join(""); };
      const left = strip(s0, "b", "a", y); frames.push({ note: `First pass ("ba" worth ${y}) leaves "${left}"`, items: [...left], side: `score ${total}` });
      strip(left, "a", "b", x);
      return { kind: "stack", title: `"${s0}", x=${x}, y=${y}: ${total}`, input: [...s0], frames };
    },
  },

  "longest-valid-parentheses": {
    approach: "Keep a stack of indices with the last unmatched ) at the bottom; each match measures back to the new top.",
    idea: ["Seed the stack with -1 as the boundary before the string.", "( pushes its index. ) pops; if the stack is empty, this ) is the new boundary, else i - top is a valid run.", "The largest run seen is the answer."],
    code: `def longestValidParentheses(s):
    st, best = [-1], 0
    for i, ch in enumerate(s):
        if ch == "(":
            st.append(i)
        else:
            st.pop()
            if not st:
                st.append(i)
            else:
                best = max(best, i - st[-1])
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = ")()())", st = [-1], frames: StackFrame[] = []; let best = 0;
      [...s].forEach((ch, i) => {
        if (ch === "(") { st.push(i); frames.push({ note: `'(' at ${i}: push its index`, items: [...st], incoming: ch, side: `best ${best}` }); return; }
        const p = st.pop()!;
        if (!st.length) { st.push(i); frames.push({ note: `')' at ${i} has no partner: it becomes the new boundary`, items: [...st], incoming: ch, popped: [p], side: `best ${best}` }); }
        else { best = Math.max(best, i - st[st.length - 1]); frames.push({ note: `')' at ${i} matches ${p}; valid run back to ${st[st.length - 1]} has length ${i - st[st.length - 1]}`, items: [...st], incoming: ch, popped: [p], side: `best ${best}` }); }
      });
      return { kind: "stack", title: `Longest valid run in "${s}": ${best}`, input: [...s], frames };
    },
  },

  "sliding-window-median": {
    approach: "Keep the window as a sorted list: remove the outgoing value and insert the incoming one with binary search, then read the middle.",
    idea: ["The median of a sorted window is its middle element, or the mean of the middle two when k is even.", "bisect finds where to remove nums[i - k] and where to insert nums[i].", "List inserts shift elements, so each step is O(k); two heaps would make it O(log k) at the cost of lazy deletion."],
    code: `from bisect import bisect_left, insort
def medianSlidingWindow(nums, k):
    win, out = sorted(nums[:k]), []
    for i in range(k, len(nums) + 1):
        if k % 2:
            out.append(float(win[k // 2]))
        else:
            out.append((win[k // 2 - 1] + win[k // 2]) / 2)
        if i == len(nums):
            break
        win.pop(bisect_left(win, nums[i - k]))
        insort(win, nums[i])
    return out`,
    lang: "python", time: "O(n·k)", space: "O(k)",
    viz: () => {
      const a = [1, 3, -1, -3, 5, 3, 6, 7], k = 3, out: number[] = [], frames: CellsFrame[] = []; const win = a.slice(0, k).sort((x, y) => x - y);
      for (let i = k; i <= a.length; i++) {
        out.push(win[1]); frames.push({ note: `window [${i - k}..${i - 1}] sorted [${win.join(", ")}] → median ${win[1]}; out [${out.join(", ")}]`, tones: { ...range(i - k, i - 1), [`0:${i - k + a.slice(i - k, i).indexOf(win[1])}`]: "found" } });
        if (i === a.length) break; win.splice(win.indexOf(a[i - k]), 1); let p = 0; while (p < win.length && win[p] < a[i]) p++; win.splice(p, 0, a[i]);
      }
      return cells(`Medians with k = ${k}: [${out.join(", ")}]`, [a], frames);
    },
  },

  "minimum-flips-to-make-a-or-b-equal-to-c": {
    approach: "Check bit by bit: if c's bit is 0, flip every 1 in a and b; if it is 1, flip one bit only when both are 0.",
    idea: ["Bits are independent under OR.", "c bit 0: both a and b bits must be 0, costing a_bit + b_bit flips.", "c bit 1: at least one must be 1, costing 1 only if both are 0."],
    code: `def minFlips(a, b, c):
    ans = 0
    while a or b or c:
        x, y, z = a & 1, b & 1, c & 1
        ans += (x + y) if z == 0 else 1 - (x | y)
        a, b, c = a >> 1, b >> 1, c >> 1
    return ans`,
    lang: "python", time: "O(log max)", space: "O(1)",
    viz: () => {
      const a = 2, b = 6, c = 5, w = 3, rows = [bin(a, w), bin(b, w), bin(c, w)], frames: CellsFrame[] = []; let ans = 0;
      for (let k = 0; k < w; k++) {
        const x = (a >> k) & 1, y = (b >> k) & 1, z = (c >> k) & 1, cost = z === 0 ? x + y : 1 - (x | y), col = w - 1 - k; ans += cost;
        frames.push({ note: `bit ${k}: a=${x}, b=${y}, c=${z} → ${z === 0 ? `both must be 0: ${cost} flip${cost === 1 ? "" : "s"}` : x | y ? "already has a 1: 0 flips" : "both 0: flip one, 1 flip"} (total ${ans})`, tones: { [`0:${col}`]: cost ? "bad" : "found", [`1:${col}`]: cost ? "bad" : "found", [`2:${col}`]: "active" } });
      }
      return cells(`a=2, b=6, c=5: ${ans} flips`, rows, frames, ["a", "b", "c"]);
    },
  },

  "reachable-nodes-with-restrictions": {
    approach: "Mark restricted nodes as already seen, then count what a DFS from 0 reaches.",
    idea: ["The edges form a tree, and you may never step onto a restricted node.", "Seeding the visited set with the restricted nodes makes the search treat them as walls.", "Every node popped from the stack is reachable; count them."],
    code: `def reachableNodes(n, edges, restricted):
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b)
        g[b].append(a)
    seen = set(restricted) | {0}
    stack, count = [0], 0
    while stack:
        u = stack.pop()
        count += 1
        for v in g[u]:
            if v not in seen:
                seen.add(v)
                stack.append(v)
    return count`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 7, edges = [[0, 1], [1, 2], [3, 1], [4, 0], [0, 5], [5, 6]], restricted = [4, 5], pos = [[50, 12], [25, 45], [10, 85], [40, 85], [50, 45], [75, 45], [80, 85]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const seen = new Set([...restricted, 0]), st = [0], got: number[] = [], frames: GraphFrame[] = [{ note: "Restricted nodes 4 and 5 start out as walls", tones: all([4, 5], "bad") }];
      while (st.length) { const u = st.pop()!; got.push(u); const add = g[u].filter((v) => !seen.has(v)); add.forEach((v) => { seen.add(v); st.push(v); }); frames.push({ note: `visit ${u} (count ${got.length})${add.length ? `; push ${add.join(", ")}` : ""}${g[u].some((v) => restricted.includes(v)) ? "; restricted neighbour skipped" : ""}`, tones: { ...all([4, 5], "bad"), ...all(got, "found"), [u]: "active" } }); }
      return { kind: "graph", title: `Reachable from 0: ${got.length}`, nodes, edges: edges.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "all-ancestors-of-a-node-in-a-directed-acyclic-graph": {
    approach: "DFS forward from every node s in increasing order; s is an ancestor of everything it reaches, so lists come out sorted.",
    idea: ["Node s is an ancestor of v exactly when v is reachable from s.", "Search from each s with a fresh visited set and append s to every node reached.", "Because s goes 0, 1, 2, ..., each list is already in sorted order."],
    code: `def getAncestors(n, edges):
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b)
    anc = [[] for _ in range(n)]
    for s in range(n):
        stack, seen = [s], {s}
        while stack:
            u = stack.pop()
            for v in g[u]:
                if v not in seen:
                    seen.add(v)
                    anc[v].append(s)
                    stack.append(v)
    return anc`,
    lang: "python", time: "O(n · (n + e))", space: "O(n²)",
    viz: () => {
      const n = 8, edges = [[0, 3], [0, 4], [1, 3], [2, 4], [2, 7], [3, 5], [3, 6], [3, 7], [4, 6]], pos = [[20, 10], [50, 10], [80, 10], [35, 48], [70, 48], [20, 88], [50, 88], [80, 88]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => g[a].push(b));
      const anc: number[][] = Array.from({ length: n }, () => []), frames: GraphFrame[] = [];
      for (let s = 0; s < n; s++) {
        const st = [s], seen = new Set([s]); while (st.length) { const u = st.pop()!; for (const v of g[u]) if (!seen.has(v)) { seen.add(v); anc[v].push(s); st.push(v); } }
        if (seen.size > 1) frames.push({ note: `from ${s} reach ${[...seen].filter((v) => v !== s).sort().join(", ")}: add ${s} to their ancestor lists`, tones: { ...all([...seen], "found"), [s]: "active" }, badges: Object.fromEntries(anc.map((a, i) => [i, a.join(",")]).filter(([, b]) => b)) });
      }
      return { kind: "graph", title: "Ancestors of every node", nodes, edges: edges.map(([a, b]) => ({ a, b, directed: true })), frames };
    },
  },

  "minimum-sum-of-squared-difference": {
    approach: "k1 and k2 are interchangeable, so spend k = k1 + k2 units shaving the largest differences down level by level.",
    idea: ["Changing nums1 or nums2 by 1 both shrink |a - b| by 1, so only the total k = k1 + k2 matters.", "Squares reward cutting the biggest difference first. Sort differences descending and lower the top group to the next value while k lasts.", "When k cannot reach the next level, lower the top group evenly: some end at level - q - 1, the rest at level - q."],
    code: `def minSumSquareDiff(nums1, nums2, k1, k2):
    d = sorted((abs(a - b) for a, b in zip(nums1, nums2)), reverse=True)
    k = k1 + k2
    if sum(d) <= k:
        return 0
    d.append(0)
    i = 0                      # d[0..i] are all levelled to d[i]
    while (i + 1) * (d[i] - d[i + 1]) <= k:
        k -= (i + 1) * (d[i] - d[i + 1])
        i += 1
    q, r = divmod(k, i + 1)
    level = d[i] - q
    return r * (level - 1) ** 2 + (i + 1 - r) * level ** 2 + sum(x * x for x in d[i + 1:])`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [0, 0, 0, 0], b = [9, 7, 4, 2], d = a.map((x, i) => Math.abs(x - b[i])).sort((x, y) => y - x); let k = 6; const frames: CellsFrame[] = [];
      frames.push({ note: `Differences sorted high to low: [${d.join(", ")}], k = k1 + k2 = 4 + 2 = ${k}`, rows: [[...d]] });
      d.push(0); let i = 0;
      while ((i + 1) * (d[i] - d[i + 1]) <= k) { const c = (i + 1) * (d[i] - d[i + 1]); k -= c; frames.push({ note: `lower the top ${i + 1} from ${d[i]} to ${d[i + 1]}: costs ${c}, k left ${k}`, rows: [[...d.slice(0, i + 1).map(() => d[i + 1]), ...d.slice(i + 1, -1)]], tones: range(0, i + 1) }); i++; }
      const q = Math.floor(k / (i + 1)), r = k % (i + 1), level = d[i] - q, fin = [...Array(r).fill(level - 1), ...Array(i + 1 - r).fill(level), ...d.slice(i + 1, -1)], ans = fin.reduce((s, x) => s + x * x, 0);
      frames.push({ note: `next level costs ${(i + 1) * (d[i] - d[i + 1])} > ${k}: spread ${k} over the top ${i + 1} → ${r ? `${r} at ${level - 1}, ` : ""}${i + 1 - r} at ${level}; sum of squares ${ans}`, rows: [fin], tones: range(0, i, 0, "found") });
      return cells(`Minimum sum of squared difference: ${ans}`, [d.slice(0, -1)], frames, ["|a - b|"]);
    },
  },

  "count-the-number-of-complete-components": {
    approach: "Find each component with DFS; it is complete when every node in it has degree (size - 1).",
    idea: ["A complete component of v nodes has an edge between every pair.", "Equivalently, each of its nodes is connected to all v - 1 others.", "Collect each component, check the degrees, and count the ones that pass."],
    code: `def countCompleteComponents(n, edges):
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b)
        g[b].append(a)
    seen, ans = [False] * n, 0
    for s in range(n):
        if seen[s]:
            continue
        seen[s] = True
        comp, stack = [], [s]
        while stack:
            u = stack.pop()
            comp.append(u)
            for v in g[u]:
                if not seen[v]:
                    seen[v] = True
                    stack.append(v)
        if all(len(g[u]) == len(comp) - 1 for u in comp):
            ans += 1
    return ans`,
    lang: "python", time: "O(n + e)", space: "O(n + e)",
    viz: () => {
      const n = 6, edges = [[0, 1], [0, 2], [1, 2], [3, 4], [3, 5]], pos = [[20, 15], [8, 80], [38, 80], [72, 15], [58, 80], [88, 80]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const seen = Array(n).fill(false), frames: GraphFrame[] = [], tones: Record<number, Tone> = {}; let ans = 0;
      for (let s = 0; s < n; s++) {
        if (seen[s]) continue; seen[s] = true; const comp: number[] = [], st = [s];
        while (st.length) { const u = st.pop()!; comp.push(u); for (const v of g[u]) if (!seen[v]) { seen[v] = true; st.push(v); } }
        const bad = comp.filter((u) => g[u].length !== comp.length - 1), ok = !bad.length; if (ok) ans++; comp.forEach((u) => (tones[u] = ok ? "found" : "bad"));
        frames.push({ note: `component {${comp.sort().join(", ")}}: ${ok ? `every node has degree ${comp.length - 1}, complete` : `node ${bad[0]} has degree ${g[bad[0]].length}, not ${comp.length - 1}`} (count ${ans})`, tones: { ...tones }, badges: Object.fromEntries(comp.map((u) => [u, `deg ${g[u].length}`])) });
      }
      return { kind: "graph", title: `Complete components: ${ans}`, nodes, edges: edges.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "insert-greatest-common-divisors-in-linked-list": {
    approach: "Walk the list and splice a new node holding gcd(a, b) between every adjacent pair.",
    idea: ["For each node with a next node, create gcd(node.val, next.val) and link it in between.", "Jump two nodes ahead so the new node is not paired again.", "math.gcd does the Euclid step for you."],
    code: `from math import gcd
def insertGreatestCommonDivisors(head):
    node = head
    while node.next:
        node.next = ListNode(gcd(node.val, node.next.val), node.next)
        node = node.next.next
    return head`,
    lang: "python", time: "O(n log max)", space: "O(1) extra",
    viz: () => {
      const orig = [18, 6, 10, 3], g = (a: number, b: number): number => (b ? g(b, a % b) : a), values: (string | number)[] = [], next: number[] = [], frames: ListFrame[] = [];
      orig.forEach((v, i) => { values.push(v); if (i < orig.length - 1) values.push(""); }); values.forEach((_, i) => next.push(i % 2 === 0 && i + 2 < values.length ? i + 2 : -1));
      frames.push({ note: "Original list 18 → 6 → 10 → 3", next: [...next], values: [...values], ptrs: [{ i: 0, label: "node" }], tones: { 1: "muted", 3: "muted", 5: "muted" } });
      for (let i = 0; i + 2 < values.length; i += 2) { const x = g(orig[i / 2], orig[i / 2 + 1]); values[i + 1] = x; next[i] = i + 1; next[i + 1] = i + 2; frames.push({ note: `gcd(${orig[i / 2]}, ${orig[i / 2 + 1]}) = ${x}: link it between them, then jump to ${orig[i / 2 + 1]}`, next: [...next], values: [...values], ptrs: [{ i: i + 2, label: "node" }], tones: { [i + 1]: "found", ...Object.fromEntries([1, 3, 5].filter((k) => k > i + 1).map((k) => [k, "muted"])) } }); }
      return { kind: "list", title: "18 → 6 → 10 → 3 with GCDs inserted", values: orig.flatMap((v, i) => (i < orig.length - 1 ? [v, ""] : [v])), frames };
    },
  },

  "24-game": {
    approach: "Backtrack: pick any two numbers, replace them with one result of + - × ÷, and recurse until one number is left.",
    idea: ["With 4 cards, every expression is built by repeatedly combining two numbers into one.", "Try every ordered pair and every operation (skip division by zero), recurse on the shorter list.", "Use floats and compare to 24 with a small tolerance, since 8 / (3 - 8 / 3) is not an integer midway."],
    code: `def judgePoint24(cards):
    def solve(nums):
        if len(nums) == 1:
            return abs(nums[0] - 24) < 1e-6
        for i in range(len(nums)):
            for j in range(len(nums)):
                if i == j:
                    continue
                rest = [nums[k] for k in range(len(nums)) if k != i and k != j]
                a, b = nums[i], nums[j]
                options = [a + b, a - b, a * b]
                if abs(b) > 1e-6:
                    options.append(a / b)
                for x in options:
                    if solve(rest + [x]):
                        return True
        return False
    return solve([float(c) for c in cards])`,
    lang: "python", time: "O(1) (fixed 4 cards)", space: "O(1)",
    viz: () => {
      const fmt = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2)); let tried = 0;
      const path: { nums: number[]; op: string }[] = [];
      const solve = (ns: number[]): boolean => {
        tried++; if (ns.length === 1) return Math.abs(ns[0] - 24) < 1e-6;
        for (let i = 0; i < ns.length; i++) for (let j = 0; j < ns.length; j++) {
          if (i === j) continue; const rest = ns.filter((_, k) => k !== i && k !== j), a = ns[i], b = ns[j];
          const ops: [string, number][] = [[`${fmt(a)} + ${fmt(b)}`, a + b], [`${fmt(a)} - ${fmt(b)}`, a - b], [`${fmt(a)} x ${fmt(b)}`, a * b]]; if (Math.abs(b) > 1e-6) ops.push([`${fmt(a)} / ${fmt(b)}`, a / b]);
          for (const [op, x] of ops) { const nx = [...rest, x]; path.push({ nums: nx, op }); if (solve(nx)) return true; path.pop(); }
        }
        return false;
      };
      const ok = solve([4, 1, 8, 7]);
      const frames: StackFrame[] = [{ note: "Start with the four cards", items: [4, 1, 8, 7], side: `${tried} states searched in total` }, ...path.map((p) => ({ note: `combine ${p.op} = ${fmt(p.nums[p.nums.length - 1])}`, items: p.nums.map(fmt), incoming: fmt(p.nums[p.nums.length - 1]), side: p.nums.length === 1 ? (ok ? "24 reached" : "") : `${p.nums.length} numbers left` }))];
      return { kind: "stack", title: `[4, 1, 8, 7] can make 24: ${ok}`, frames };
    },
  },

  "russian-doll-envelopes": {
    approach: "Sort by width ascending and height descending, then take the longest strictly increasing subsequence of heights.",
    idea: ["After sorting by width, nesting is an increasing run of heights.", "Equal widths cannot nest, so sort their heights descending; then two of them can never both be in an increasing run.", "LIS with patience tails and binary search is O(n log n)."],
    code: `from bisect import bisect_left
def maxEnvelopes(envelopes):
    envelopes.sort(key=lambda e: (e[0], -e[1]))
    tails = []
    for _, h in envelopes:
        i = bisect_left(tails, h)
        if i == len(tails):
            tails.append(h)
        else:
            tails[i] = h
    return len(tails)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const env = [[5, 4], [6, 4], [6, 7], [2, 3], [7, 5]].sort((x, y) => x[0] - y[0] || y[1] - x[1]), row = env.map(([w, h]) => `${w},${h}`), tails: number[] = [], frames: CellsFrame[] = [];
      env.forEach(([, h], k) => { let i = 0; while (i < tails.length && tails[i] < h) i++; const grow = i === tails.length; if (grow) tails.push(h); else tails[i] = h; frames.push({ note: `height ${h}: ${grow ? `larger than every tail → append, length ${tails.length}` : `replace tails[${i}] to keep the smallest possible end`}`, rows: [row, [...tails, ...Array(env.length - tails.length).fill("")]], tones: { [`0:${k}`]: "active", [`1:${i}`]: "found" } }); });
      return cells(`Most nested envelopes: ${tails.length}`, [row, Array(env.length).fill("")], frames, ["sorted", "tails"]);
    },
  },

  "race-car": {
    approach: "DP on distance: either overshoot with k A's and come back, or stop short at 2^(k-1) - 1, back up j steps, and continue.",
    idea: ["k A's from rest reach 2^k - 1. If t equals that, the answer is k.", "Option 1: drive k A's past t, reverse, and solve the remaining distance 2^k - 1 - t: k + 1 + dp[2^k - 1 - t].", "Option 2: drive k - 1 A's, reverse, back up j A's, reverse again, and solve t - (2^(k-1) - 1) + (2^j - 1): cost k - 1 + j + 2 + dp[...]."],
    code: `def racecar(target):
    dp = [0] + [float("inf")] * target
    for t in range(1, target + 1):
        k = t.bit_length()
        if t == 2**k - 1:
            dp[t] = k
            continue
        dp[t] = k + 1 + dp[2**k - 1 - t]
        for j in range(k - 1):
            dp[t] = min(dp[t], k - 1 + j + 2 + dp[t - 2**(k - 1) + 2**j])
    return dp[target]`,
    lang: "python", time: "O(t log t)", space: "O(t)",
    viz: () => {
      const T = 6, dp: (number | null)[] = [0, ...Array(T).fill(null)], frames: TableFrame[] = [];
      for (let t = 1; t <= T; t++) {
        const k = t.toString(2).length; let note: string, deps: [number, number][] = [];
        if (t === 2 ** k - 1) { dp[t] = k; note = `${t} = 2^${k} - 1: ${k} A's reach it exactly`; }
        else { const back = 2 ** k - 1 - t; let best = k + 1 + (dp[back] as number), how = `overshoot to ${2 ** k - 1}, reverse, then dp[${back}]`; deps = [[0, back]]; for (let j = 0; j < k - 1; j++) { const rem = t - 2 ** (k - 1) + 2 ** j, c = k - 1 + j + 2 + (dp[rem] as number); if (c < best) { best = c; how = `${k - 1} A's, R, ${j} A's back, R, then dp[${rem}]`; deps = [[0, rem]]; } } dp[t] = best; note = `t = ${t}: best is ${how} = ${best}`; }
        frames.push({ note, cells: [[...dp]], active: [0, t], deps });
      }
      return { kind: "table", title: `racecar(${T}) = ${dp[T]}`, rowHead: ["dp"], colHead: nums(T + 1), frames };
    },
  },

  "maximum-bags-with-full-capacity-of-rocks": {
    approach: "Sort the bags by how many rocks they are missing and fill the cheapest ones first.",
    idea: ["Each bag needs capacity - rocks more rocks to be full.", "To maximise the count, always fill the bag with the smallest gap next.", "Stop when the next gap is more than the rocks left."],
    code: `def maximumBags(capacity, rocks, additionalRocks):
    full = 0
    for gap in sorted(c - r for c, r in zip(capacity, rocks)):
        if gap > additionalRocks:
            break
        additionalRocks -= gap
        full += 1
    return full`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const cap = [2, 3, 4, 5], rocks = [1, 2, 4, 4], gaps = cap.map((c, i) => c - rocks[i]).sort((x, y) => x - y), frames: CellsFrame[] = []; let left = 2, full = 0;
      for (let i = 0; i < gaps.length; i++) { if (gaps[i] > left) { frames.push({ note: `gap ${gaps[i]} > ${left} rocks left: stop`, tones: { ...range(0, i - 1, 0, "found"), [`0:${i}`]: "bad" } }); break; } left -= gaps[i]; full++; frames.push({ note: `fill a bag missing ${gaps[i]}: ${left} rocks left, ${full} full`, tones: { ...range(0, i, 0, "found"), [`0:${i}`]: "active" } }); }
      return cells(`Full bags: ${full}`, [gaps], frames, ["gap"]);
    },
  },

  "palindrome-partitioning-iii": {
    approach: "Precompute cost[i][j] = changes to make s[i..j] a palindrome, then dp[i][p] = best split of the first i characters into p parts.",
    idea: ["cost[i][j] = cost[i+1][j-1] + (s[i] != s[j]), built by increasing length.", "dp[i][p] = min over j of dp[j][p-1] + cost[j][i-1]: the last part is s[j..i-1].", "The answer is dp[n][k]."],
    code: `def palindromePartition(s, k):
    n = len(s)
    cost = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            cost[i][j] = cost[i + 1][j - 1] + (s[i] != s[j])
    INF = float("inf")
    dp = [[INF] * (k + 1) for _ in range(n + 1)]
    dp[0][0] = 0
    for i in range(1, n + 1):
        for p in range(1, min(k, i) + 1):
            dp[i][p] = min(dp[j][p - 1] + cost[j][i - 1] for j in range(p - 1, i))
    return dp[n][k]`,
    lang: "python", time: "O(n²·k)", space: "O(n²)",
    viz: () => {
      const s = "abcb", k = 2, n = s.length, cost = Array.from({ length: n }, () => Array(n).fill(0));
      for (let L = 2; L <= n; L++) for (let i = 0; i + L - 1 < n; i++) { const j = i + L - 1; cost[i][j] = cost[i + 1][j - 1] + (s[i] !== s[j] ? 1 : 0); }
      const dp: (number | null)[][] = Array.from({ length: n + 1 }, () => Array(k + 1).fill(null)); dp[0][0] = 0; const frames: TableFrame[] = [];
      for (let i = 1; i <= n; i++) for (let p = 1; p <= Math.min(k, i); p++) {
        let best = 1e9, bj = 0; for (let j = p - 1; j < i; j++) { const prev = dp[j][p - 1]; if (prev == null) continue; const c = prev + cost[j][i - 1]; if (c < best) { best = c; bj = j; } }
        dp[i][p] = best; frames.push({ note: `first ${i} chars in ${p} part${p > 1 ? "s" : ""}: last part "${s.slice(bj, i)}" costs ${cost[bj][i - 1]} + dp[${bj}][${p - 1}] = ${best}`, cells: dp.map((r) => [...r]), active: [i, p], deps: [[bj, p - 1]] });
      }
      return { kind: "table", title: `"${s}" into ${k} palindromes: ${dp[n][k]} changes`, rowHead: Array.from({ length: n + 1 }, (_, i) => `${i} "${s.slice(0, i)}"`), colHead: nums(k + 1).map((x) => `p=${x}`), frames };
    },
  },

  "last-day-where-you-can-still-cross": {
    approach: "Go backwards in time turning water back into land, and union-find the land; the first day top and bottom connect is the answer.",
    idea: ["Undoing floods in reverse only ever adds land, which union-find handles well (it cannot split sets).", "Join each new land cell to its land neighbours, to a virtual TOP if in row 0, and to a virtual BOTTOM if in the last row.", "When TOP and BOTTOM share a root, the cells still flooded are exactly days 1..d, so d is the answer."],
    code: `def latestDayToCross(row, col, cells):
    n = row * col
    parent = list(range(n + 2))
    TOP, BOT = n, n + 1
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    land = [[False] * col for _ in range(row)]
    for d in range(len(cells) - 1, -1, -1):
        r, c = cells[d][0] - 1, cells[d][1] - 1
        land[r][c] = True
        u = r * col + c
        if r == 0:
            parent[find(u)] = find(TOP)
        if r == row - 1:
            parent[find(u)] = find(BOT)
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < row and 0 <= nc < col and land[nr][nc]:
                parent[find(u)] = find(nr * col + nc)
        if find(TOP) == find(BOT):
            return d
    return 0`,
    lang: "python", time: "O(R·C·α)", space: "O(R·C)",
    viz: () => {
      const R = 3, C = 3, cl = [[1, 2], [2, 1], [3, 3], [2, 2], [1, 1], [1, 3], [2, 3], [3, 2], [3, 1]], n = R * C, parent = Array.from({ length: n + 2 }, (_, i) => i), TOP = n, BOT = n + 1;
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), land = Array.from({ length: R }, () => Array(C).fill(false)), day = Array.from({ length: R }, () => Array(C).fill(0));
      cl.forEach(([r, c], d) => (day[r - 1][c - 1] = d + 1)); const frames: TableFrame[] = []; let ans = 0;
      const view = () => ({ cells: day.map((r) => [...r]), tones: Object.fromEntries(day.flatMap((r, i) => r.map((_, j) => [`${i}:${j}`, land[i][j] ? "found" : "muted"]))) as Record<string, Tone> });
      for (let d = cl.length - 1; d >= 0; d--) {
        const r = cl[d][0] - 1, c = cl[d][1] - 1, u = r * C + c; land[r][c] = true; if (r === 0) parent[find(u)] = find(TOP); if (r === R - 1) parent[find(u)] = find(BOT);
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (nr >= 0 && nr < R && nc >= 0 && nc < C && land[nr][nc]) parent[find(u)] = find(nr * C + nc);
        const hit = find(TOP) === find(BOT); frames.push({ note: `undo day ${d + 1}: (${r},${c}) is land again${hit ? `; top and bottom connect, so day ${d} is the last crossable day` : ""}`, ...view(), active: [r, c] });
        if (hit) { ans = d; break; }
      }
      return { kind: "table", title: `Last day to cross: ${ans} (cells show the day each floods)`, rowHead: nums(R), colHead: nums(C), frames };
    },
  },

  "trapping-rain-water-ii": {
    approach: "Grow inward from the border with a min-heap: the lowest wall on the current boundary decides how high its neighbour can fill.",
    idea: ["Water over a cell is limited by the lowest point of the wall around it.", "Start with every border cell in a min-heap. Pop the lowest; each unvisited neighbour holds max(0, wall - height) water.", "Push the neighbour with height max(wall, its height): it becomes part of the new boundary."],
    code: `import heapq
def trapRainWater(heightMap):
    m, n = len(heightMap), len(heightMap[0])
    seen = [[False] * n for _ in range(m)]
    pq = []
    for r in range(m):
        for c in range(n):
            if r in (0, m - 1) or c in (0, n - 1):
                heapq.heappush(pq, (heightMap[r][c], r, c))
                seen[r][c] = True
    water = 0
    while pq:
        h, r, c = heapq.heappop(pq)
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < m and 0 <= nc < n and not seen[nr][nc]:
                seen[nr][nc] = True
                water += max(0, h - heightMap[nr][nc])
                heapq.heappush(pq, (max(h, heightMap[nr][nc]), nr, nc))
    return water`,
    lang: "python", time: "O(m·n log(m·n))", space: "O(m·n)",
    viz: () => {
      const H = [[1, 4, 3, 1, 3, 2], [3, 2, 1, 3, 2, 4], [2, 3, 3, 2, 3, 1]], m = 3, n = 6, seen = H.map((r) => r.map(() => false)), pq: [number, number, number][] = [], frames: TableFrame[] = [], tones: Record<string, Tone> = {}; let water = 0;
      H.forEach((row, r) => row.forEach((h, c) => { if (r === 0 || r === m - 1 || c === 0 || c === n - 1) { pq.push([h, r, c]); seen[r][c] = true; tones[`${r}:${c}`] = "done"; } }));
      frames.push({ note: "All border cells go into the min-heap", cells: H, tones: { ...tones } });
      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); const [h, r, c] = pq.shift()!; const got: string[] = [];
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (nr >= 0 && nr < m && nc >= 0 && nc < n && !seen[nr][nc]) { seen[nr][nc] = true; const w = Math.max(0, h - H[nr][nc]); water += w; tones[`${nr}:${nc}`] = w ? "found" : "window"; got.push(`(${nr},${nc}) height ${H[nr][nc]} holds ${w}`); pq.push([Math.max(h, H[nr][nc]), nr, nc]); }
        if (got.length) frames.push({ note: `lowest wall ${h} at (${r},${c}): ${got.join("; ")} (water ${water})`, cells: H, active: [r, c], tones: { ...tones } });
      }
      return grid(`Trapped water: ${water}`, m, n, frames);
    },
  },

  "largest-divisible-subset": {
    approach: "Sort, then it is a longest-chain DP: size[i] = 1 + best size[j] over j < i with nums[j] dividing nums[i]; follow parent links back.",
    idea: ["After sorting, a divisible subset is a chain where each number divides the next (divisibility is transitive).", "size[i] is the longest chain ending at nums[i]; prev[i] remembers the element before it.", "Start from the largest size and walk prev to rebuild the subset."],
    code: `def largestDivisibleSubset(nums):
    nums.sort()
    n = len(nums)
    size, prev = [1] * n, [-1] * n
    for i in range(n):
        for j in range(i):
            if nums[i] % nums[j] == 0 and size[j] + 1 > size[i]:
                size[i], prev[i] = size[j] + 1, j
    i = max(range(n), key=size.__getitem__)
    out = []
    while i != -1:
        out.append(nums[i])
        i = prev[i]
    return out[::-1]`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 3, 8, 9, 72], n = a.length, size = Array(n).fill(1), prev = Array(n).fill(-1), frames: CellsFrame[] = [];
      for (let i = 0; i < n; i++) { for (let j = 0; j < i; j++) if (a[i] % a[j] === 0 && size[j] + 1 > size[i]) { size[i] = size[j] + 1; prev[i] = j; } frames.push({ note: prev[i] < 0 ? `${a[i]}: nothing smaller divides it, size 1` : `${a[i]}: longest chain comes through ${a[prev[i]]} → size ${size[i]}`, rows: [a, [...size.slice(0, i + 1), ...Array(n - i - 1).fill("")]], tones: { [`0:${i}`]: "active", ...(prev[i] >= 0 ? { [`0:${prev[i]}`]: "window" } : {}) } }); }
      let i = size.indexOf(Math.max(...size)); const out: number[] = [], keys: string[] = []; while (i !== -1) { out.unshift(a[i]); keys.push(`0:${i}`); i = prev[i]; }
      frames.push({ note: `Follow prev links from the biggest size: [${out.join(", ")}]`, rows: [a, size], tones: all(keys, "found") });
      return cells(`Largest divisible subset: [${out.join(", ")}]`, [a, Array(n).fill("")], frames, ["nums", "size"]);
    },
  },

  "contains-duplicate-iii": {
    approach: "Bucket values by width valueDiff + 1 over a sliding window of indexDiff items; a match can only be in the same or a neighbouring bucket.",
    idea: ["Two values in the same bucket of width valueDiff + 1 always differ by at most valueDiff.", "Values in adjacent buckets might, so check those directly. Buckets further away never can.", "Keep only the last indexDiff values in the buckets, so index distance is handled by the window."],
    code: `def containsNearbyAlmostDuplicate(nums, indexDiff, valueDiff):
    w = valueDiff + 1
    buckets = {}
    for i, x in enumerate(nums):
        b = x // w
        if b in buckets:
            return True
        if b - 1 in buckets and x - buckets[b - 1] <= valueDiff:
            return True
        if b + 1 in buckets and buckets[b + 1] - x <= valueDiff:
            return True
        buckets[b] = x
        if i >= indexDiff:
            del buckets[nums[i - indexDiff] // w]
    return False`,
    lang: "python", time: "O(n)", space: "O(indexDiff)",
    viz: () => {
      const a = [1, 5, 9, 1, 5, 9], k = 2, t = 3, w = t + 1, buckets = new Map<number, number>(), frames: CellsFrame[] = [], bk = a.map((x) => Math.floor(x / w)); let ans = false;
      for (let i = 0; i < a.length && !ans; i++) {
        const b = bk[i], hit = buckets.has(b) || (buckets.has(b - 1) && a[i] - buckets.get(b - 1)! <= t) || (buckets.has(b + 1) && buckets.get(b + 1)! - a[i] <= t);
        if (hit) { ans = true; frames.push({ note: `${a[i]} in bucket ${b} finds a close value nearby → true`, tones: { [`0:${i}`]: "found" } }); break; }
        buckets.set(b, a[i]); if (i >= k) buckets.delete(bk[i - k]);
        frames.push({ note: `${a[i]} → bucket ${b}; no value within ${t} in buckets ${b - 1}..${b + 1}. Window buckets: {${[...buckets].map(([x, v]) => `${x}:${v}`).join(", ")}}`, tones: { ...range(Math.max(0, i - k + 1), i), [`0:${i}`]: "active", [`1:${i}`]: "active" } });
      }
      return cells(`indexDiff ${k}, valueDiff ${t}: ${ans}`, [a, bk], frames, ["nums", "bucket"]);
    },
  },

  "number-of-ways-to-split-a-string": {
    approach: "Each part needs ones / 3 ones; the cuts can go anywhere in the zero gaps after the 1/3 and 2/3 marks, so multiply the gap sizes.",
    idea: ["If the count of ones is not divisible by 3, there is no way.", "With no ones at all, choose any 2 of the n - 1 cut positions: (n-1)(n-2)/2.", "Otherwise the first cut can sit anywhere between the t-th and (t+1)-th one, the second between the 2t-th and (2t+1)-th one."],
    code: `def numWays(s):
    MOD = 10**9 + 7
    n, ones = len(s), s.count("1")
    if ones % 3:
        return 0
    if ones == 0:
        return (n - 1) * (n - 2) // 2 % MOD
    t = ones // 3
    pos = [i for i, ch in enumerate(s) if ch == "1"]
    return (pos[t] - pos[t - 1]) * (pos[2 * t] - pos[2 * t - 1]) % MOD`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "10100100101001", pos = [...s].map((c, i) => (c === "1" ? i : -1)).filter((i) => i >= 0), t = pos.length / 3, g1 = pos[t] - pos[t - 1], g2 = pos[2 * t] - pos[2 * t - 1], frames: CellsFrame[] = [];
      frames.push({ note: `${pos.length} ones → each part gets ${t}`, tones: all(pos.map((p) => `0:${p}`), "found") });
      frames.push({ note: `first cut goes after index ${pos[t - 1]} and up to ${pos[t] - 1}: ${g1} choices`, tones: { ...all(pos.map((p) => `0:${p}`), "found"), ...range(pos[t - 1] + 1, pos[t] - 1, 0, "active") } });
      frames.push({ note: `second cut goes after index ${pos[2 * t - 1]} and up to ${pos[2 * t] - 1}: ${g2} choices → ${g1} x ${g2} = ${g1 * g2}`, tones: { ...all(pos.map((p) => `0:${p}`), "found"), ...range(pos[2 * t - 1] + 1, pos[2 * t] - 1, 0, "active") } });
      return cells(`"${s}": ${g1 * g2} ways`, [[...s]], frames);
    },
  },

  "minimum-number-of-k-consecutive-bit-flips": {
    approach: "Greedy left to right: a 0 at i (after earlier flips) must be the start of a flip; track active flips with a parity bit and a record of where flips started.",
    idea: ["The leftmost 0 can only be fixed by a flip starting exactly there.", "Instead of flipping k bits, keep cur = parity of flips covering i; a flip started at i - k stops covering when you reach i.", "If a flip is needed but i + k > n, it cannot fit: return -1."],
    code: `def minKBitFlips(nums, k):
    n = len(nums)
    started = [0] * n
    cur = ans = 0
    for i in range(n):
        if i >= k:
            cur ^= started[i - k]
        if nums[i] ^ cur == 0:
            if i + k > n:
                return -1
            started[i] = 1
            cur ^= 1
            ans += 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [0, 0, 0, 1, 0, 1, 1, 0], k = 3, n = a.length, started = Array(n).fill(0), eff: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = []; let cur = 0, ans = 0;
      for (let i = 0; i < n; i++) {
        if (i >= k) cur ^= started[i - k]; const bit = a[i] ^ cur;
        if (bit === 0) { const par = cur; started[i] = 1; cur ^= 1; ans++; eff[i] = 1; frames.push({ note: `index ${i} reads 0 (${a[i]} under ${par ? "an odd" : "an even"} number of active flips) → start a flip of [${i}..${i + k - 1}] (flips ${ans})`, rows: [a, [...eff], [...started]], tones: { ...range(i, i + k - 1, 1), [`2:${i}`]: "found" } }); }
        else { eff[i] = 1; frames.push({ note: `index ${i} already reads 1, no flip`, rows: [a, [...eff], [...started]], tones: { [`1:${i}`]: "done" } }); }
      }
      return cells(`Fewest ${k}-bit flips: ${ans}`, [a, Array(n).fill(""), Array(n).fill(0)], frames, ["nums", "now", "flip at"]);
    },
  },

  "number-of-smooth-descent-periods-of-a-stock": {
    approach: "Track the length of the current run where each day is exactly 1 lower; a run of length L ending today adds L periods.",
    idea: ["Every smooth period ending on day i is a suffix of the current descent run.", "If prices[i-1] - prices[i] == 1 the run grows by 1, otherwise it restarts at 1.", "Add the run length each day."],
    code: `def getDescentPeriods(prices):
    ans = run = 0
    for i, p in enumerate(prices):
        run = run + 1 if i and prices[i - 1] - p == 1 else 1
        ans += run
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const p = [3, 2, 1, 4], frames: CellsFrame[] = [], runs: (string | number)[] = Array(p.length).fill(""); let ans = 0, run = 0;
      p.forEach((x, i) => { run = i && p[i - 1] - x === 1 ? run + 1 : 1; ans += run; runs[i] = run; frames.push({ note: `${x}: ${run > 1 ? `exactly 1 below ${p[i - 1]}, run grows to ${run}` : "run restarts at 1"} → +${run} (total ${ans})`, rows: [p, [...runs]], tones: range(i - run + 1, i) }); });
      return cells(`Smooth descent periods: ${ans}`, [p, Array(p.length).fill("")], frames, ["price", "run"]);
    },
  },

  "smallest-number-in-infinite-set": {
    approach: "Everything from next upward is still in the set; numbers added back below next live in a min-heap (plus a set to avoid duplicates).",
    idea: ["Track next = the smallest number never popped. All numbers ≥ next are present.", "addBack(x) only matters if x < next and x is not already back: push it on the heap.", "popSmallest takes the heap's minimum if any (it is always < next), otherwise next++."],
    code: `import heapq
class SmallestInfiniteSet:
    def __init__(self):
        self.next = 1
        self.heap = []
        self.back = set()

    def popSmallest(self):
        if self.heap:
            x = heapq.heappop(self.heap)
            self.back.remove(x)
            return x
        self.next += 1
        return self.next - 1

    def addBack(self, num):
        if num < self.next and num not in self.back:
            self.back.add(num)
            heapq.heappush(self.heap, num)`,
    lang: "python", time: "O(log n) per call", space: "O(n)",
    viz: () => {
      const calls: [string, number?][] = [["addBack", 2], ["pop"], ["pop"], ["pop"], ["addBack", 1], ["pop"], ["pop"], ["pop"]], heap: number[] = [], frames: StackFrame[] = []; let next = 1;
      for (const [op, x] of calls) {
        if (op === "addBack") { const ok = x! < next && !heap.includes(x!); if (ok) { heap.push(x!); heap.sort((a, b) => b - a); } frames.push({ note: `addBack(${x}): ${ok ? "below next, push on the heap" : `${x} ≥ next ${next}, still in the set, ignore`}`, items: [...heap], incoming: x, side: `next = ${next}` }); }
        else if (heap.length) { const v = heap.pop()!; frames.push({ note: `popSmallest() → ${v} from the heap`, items: [...heap], popped: [v], side: `next = ${next}` }); }
        else { next++; frames.push({ note: `popSmallest() → ${next - 1}, heap empty so take next`, items: [...heap], popped: [next - 1], side: `next = ${next}` }); }
      }
      return { kind: "stack", title: "SmallestInfiniteSet: heap of added-back numbers", frames };
    },
  },

  "maximum-number-of-k-divisible-components": {
    approach: "Post-order DFS returns each subtree's sum; whenever a subtree sum is divisible by k, cut it off and count a component.",
    idea: ["The total is divisible by k, so cutting off a divisible subtree leaves a divisible remainder.", "Return the subtree sum to the parent; if it is divisible by k, count one and return 0 instead (the edge is cut).", "Greedily cutting every such subtree gives the most components."],
    code: `import sys
def maxKDivisibleComponents(n, edges, values, k):
    sys.setrecursionlimit(10**5 + 10)
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b)
        g[b].append(a)
    count = 0
    def dfs(u, parent):
        nonlocal count
        s = values[u]
        for v in g[u]:
            if v != parent:
                s += dfs(v, u)
        if s % k == 0:
            count += 1
            return 0
        return s
    dfs(0, -1)
    return count`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 5, edges = [[0, 2], [1, 2], [1, 3], [2, 4]], values = [1, 8, 1, 4, 4], k = 6, pos = [[20, 15], [55, 50], [40, 15], [80, 85], [25, 70]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(values[i]), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const frames: GraphFrame[] = [], tones: Record<number, Tone> = {}, badges: Record<number, string> = {}; let count = 0;
      const dfs = (u: number, p: number): number => { let s = values[u]; for (const v of g[u]) if (v !== p) s += dfs(v, u); const cut = s % k === 0; if (cut) count++; tones[u] = cut ? "found" : "done"; badges[u] = `sum ${s}`; frames.push({ note: `node ${u}: subtree sum ${s}${cut ? ` divisible by ${k} → cut here (components ${count})` : `, pass ${s} up`}`, tones: { ...tones, [u]: cut ? "found" : "active" }, badges: { ...badges } }); return cut ? 0 : s; };
      dfs(0, -1);
      return { kind: "graph", title: `k = ${k}: ${count} components`, nodes, edges: edges.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "word-ladder-ii": {
    approach: "BFS level by level from beginWord, recording every parent that reaches a word at its shortest distance; then backtrack from endWord.",
    idea: ["BFS finds the shortest length. Remove a whole level's words from the dictionary only after the level ends, so several parents can share a child.", "Store parents[child] = all words one level up that lead to it.", "Stop after the level containing endWord, then build all paths by walking parents backwards."],
    code: `from collections import defaultdict
def findLadders(beginWord, endWord, wordList):
    words = set(wordList)
    if endWord not in words:
        return []
    parents = defaultdict(list)
    level, found = {beginWord}, False
    words.discard(beginWord)
    while level and not found:
        nxt = defaultdict(list)
        for w in level:
            for i in range(len(w)):
                for ch in "abcdefghijklmnopqrstuvwxyz":
                    t = w[:i] + ch + w[i + 1:]
                    if t in words:
                        nxt[t].append(w)
        words -= set(nxt)
        for t, ps in nxt.items():
            parents[t] += ps
        found = endWord in nxt
        level = set(nxt)
    out = []
    def build(w, path):
        if w == beginWord:
            out.append(path[::-1])
            return
        for p in parents[w]:
            build(p, path + [p])
    if found:
        build(endWord, [endWord])
    return out`,
    lang: "python", time: "O(N·L·26 + paths)", space: "O(N·L)",
    viz: () => {
      const begin = "hit", end = "cog", list = ["hot", "dot", "dog", "lot", "log", "cog"], all6 = [begin, ...list], pos = [[8, 50], [30, 50], [52, 20], [74, 20], [52, 80], [74, 80], [94, 50]];
      const nodes = all6.map((w, i) => ({ id: i, label: w, x: pos[i][0], y: pos[i][1] })), id = (w: string) => all6.indexOf(w), diff1 = (a: string, b: string) => [...a].filter((c, i) => c !== b[i]).length === 1;
      const edges: { a: number; b: number }[] = []; all6.forEach((a, i) => all6.forEach((b, j) => { if (i < j && diff1(a, b)) edges.push({ a: i, b: j }); }));
      const words = new Set(list), parents = new Map<string, string[]>(), frames: GraphFrame[] = [], tones: Record<number, Tone> = { 0: "done" }; let level = [begin], found = false, d = 0;
      while (level.length && !found) {
        const nxt = new Map<string, string[]>(), et: Record<string, Tone> = {}; d++;
        for (const w of level) for (const t of words) if (diff1(w, t)) { nxt.set(t, [...(nxt.get(t) || []), w]); et[`${Math.min(id(w), id(t))}-${Math.max(id(w), id(t))}`] = "found"; }
        nxt.forEach((ps, t) => { words.delete(t); parents.set(t, ps); tones[id(t)] = "done"; });
        found = nxt.has(end); level = [...nxt.keys()];
        frames.push({ note: `level ${d}: ${[...nxt].map(([t, ps]) => `${t} (from ${ps.join(", ")})`).join("; ")}`, tones: { ...tones, ...Object.fromEntries(level.map((w) => [id(w), "active"])) }, edgeTones: et });
      }
      const out: string[][] = []; const build = (w: string, path: string[]) => { if (w === begin) { out.push([...path].reverse()); return; } for (const p of parents.get(w) || []) build(p, [...path, p]); }; build(end, [end]);
      out.forEach((p) => frames.push({ note: `path: ${p.join(" → ")}`, tones: Object.fromEntries(p.map((w) => [id(w), "found"])), edgeTones: Object.fromEntries(p.slice(1).map((w, i) => [`${Math.min(id(w), id(p[i]))}-${Math.max(id(w), id(p[i]))}`, "found"])) }));
      return { kind: "graph", title: `${out.length} shortest ladders from hit to cog`, nodes, edges, frames };
    },
  },

  "maximize-the-confusion-of-an-exam": {
    approach: "Sliding window: grow right, and shrink left while the window has more than k of the less frequent answer.",
    idea: ["A window can be made all T or all F if the minority answer appears at most k times in it.", "Track counts of T and F; when min(T, F) > k, drop the left end.", "The widest valid window is the answer."],
    code: `def maxConsecutiveAnswers(answerKey, k):
    count = {"T": 0, "F": 0}
    left = best = 0
    for right, ch in enumerate(answerKey):
        count[ch] += 1
        while min(count["T"], count["F"]) > k:
            count[answerKey[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "TTFTTFTT", k = 1, c: Record<string, number> = { T: 0, F: 0 }, frames: CellsFrame[] = []; let l = 0, best = 0;
      [...s].forEach((ch, r) => { c[ch]++; while (Math.min(c.T, c.F) > k) { c[s[l]]--; l++; } best = Math.max(best, r - l + 1); frames.push({ note: `window [${l}..${r}]: ${c.T} T, ${c.F} F → change ${Math.min(c.T, c.F)} ≤ ${k}, length ${r - l + 1} (best ${best})`, tones: range(l, r), marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); });
      return cells(`"${s}", k = ${k}: ${best}`, [[...s]], frames);
    },
  },

  "stream-of-characters": {
    approach: "Store every word reversed in a trie; after each letter, walk the trie over the stream from newest to oldest.",
    idea: ["A query asks whether some word is a suffix of the stream so far.", "Reversed, a suffix becomes a prefix, which a trie checks letter by letter.", "Only walk back as far as the longest word, and stop as soon as a word end is hit."],
    code: `class StreamChecker:
    def __init__(self, words):
        self.root = {}
        self.longest = max(map(len, words))
        for w in words:
            node = self.root
            for ch in reversed(w):
                node = node.setdefault(ch, {})
            node["$"] = True
        self.stream = []

    def query(self, letter):
        self.stream.append(letter)
        node = self.root
        for ch in reversed(self.stream[-self.longest:]):
            if ch not in node:
                return False
            node = node[ch]
            if "$" in node:
                return True
        return False`,
    lang: "python", time: "O(L) per query", space: "O(total letters)",
    viz: () => {
      const words = ["cd", "f", "kl"], tnodes: TNode[] = [{ id: 0, label: "•", parent: null }], kid = new Map<string, number>(), end = new Set<number>();
      words.forEach((w) => { let cur = 0; for (const ch of [...w].reverse()) { const key = `${cur}:${ch}`; if (!kid.has(key)) { kid.set(key, tnodes.length); tnodes.push({ id: tnodes.length, label: ch, parent: cur }); } cur = kid.get(key)!; } end.add(cur); });
      const stream: string[] = [], frames: TreeFrame[] = [], badges = Object.fromEntries([...end].map((e) => [e, "end"]));
      for (const q of "abcdefkl") {
        stream.push(q); let cur = 0; const path = [0]; let ok = false;
        for (const ch of stream.slice(-2).reverse()) { const nx = kid.get(`${cur}:${ch}`); if (nx == null) break; cur = nx; path.push(cur); if (end.has(cur)) { ok = true; break; } }
        frames.push({ note: `query('${q}'): stream "${stream.join("")}", read backwards "${stream.slice(-2).reverse().join("")}" → ${ok ? "word end reached, true" : "no word ends here, false"}`, tones: { ...Object.fromEntries(path.map((p) => [p, "active"])), ...(ok ? { [cur]: "found" } : {}) }, badges });
      }
      return tree(`Reversed trie of ${words.map((w) => `"${w}"`).join(", ")}`, tnodes, frames);
    },
  },

  "sort-items-by-groups-respecting-dependencies": {
    approach: "Two topological sorts: one over groups, one over items; then list items group by group in the group order.",
    idea: ["Give every ungrouped item its own new group so each item has a group.", "An edge b → a between different groups becomes a group edge; inside one group it is an item edge.", "Topologically sort items and groups (Kahn's algorithm); a cycle in either means no answer. Bucket sorted items by group and emit in group order."],
    code: `from collections import defaultdict, deque
def sortItems(n, m, group, beforeItems):
    for i in range(n):
        if group[i] == -1:
            group[i] = m
            m += 1
    def topo(nodes, edges):
        indeg = {x: 0 for x in nodes}
        for a in edges:
            for b in edges[a]:
                indeg[b] += 1
        q = deque(x for x in nodes if indeg[x] == 0)
        out = []
        while q:
            x = q.popleft()
            out.append(x)
            for y in edges[x]:
                indeg[y] -= 1
                if indeg[y] == 0:
                    q.append(y)
        return out if len(out) == len(nodes) else None
    item_edges, group_edges = defaultdict(list), defaultdict(list)
    for a in range(n):
        for b in beforeItems[a]:
            item_edges[b].append(a)
            if group[a] != group[b]:
                group_edges[group[b]].append(group[a])
    items = topo(range(n), item_edges)
    groups = topo(range(m), group_edges)
    if items is None or groups is None:
        return []
    by_group = defaultdict(list)
    for x in items:
        by_group[group[x]].append(x)
    return [x for gr in groups for x in by_group[gr]]`,
    lang: "python", time: "O(n + m + e)", space: "O(n + m + e)",
    viz: () => {
      const n = 8, group = [-1, -1, 1, 0, 0, 1, 0, -1], before = [[], [6], [5], [6], [3, 6], [], [], []]; let m = 2;
      for (let i = 0; i < n; i++) if (group[i] === -1) group[i] = m++;
      const pos = [[10, 85], [30, 85], [55, 15], [75, 50], [95, 50], [35, 15], [75, 15], [10, 15]], nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), edges: { a: number; b: number; directed: boolean }[] = [];
      const ie: number[][] = Array.from({ length: n }, () => []), ge: number[][] = Array.from({ length: m }, () => []);
      before.forEach((bs, a) => bs.forEach((b) => { ie[b].push(a); edges.push({ a: b, b: a, directed: true }); if (group[a] !== group[b]) ge[group[b]].push(group[a]); }));
      const topo = (cnt: number, e: number[][]) => { const indeg = Array(cnt).fill(0); e.forEach((ys) => ys.forEach((y) => indeg[y]++)); const q = [...Array(cnt).keys()].filter((x) => !indeg[x]), out: number[] = []; while (q.length) { const x = q.shift()!; out.push(x); for (const y of e[x]) if (!--indeg[y]) q.push(y); } return out; };
      const items = topo(n, ie), groups = topo(m, ge), frames: GraphFrame[] = [], badges = Object.fromEntries(group.map((g, i) => [i, `g${g}`]));
      frames.push({ note: `Ungrouped items get new groups; item order [${items.join(", ")}], group order [${groups.join(", ")}]`, badges });
      const out: number[] = []; groups.forEach((gr) => { const xs = items.filter((x) => group[x] === gr); if (!xs.length) return; out.push(...xs); frames.push({ note: `group ${gr}: emit ${xs.join(", ")} → [${out.join(", ")}]`, tones: { ...all(out, "done"), ...all(xs, "found") }, badges }); });
      return { kind: "graph", title: `Order: [${out.join(", ")}]`, nodes, edges, frames };
    },
  },

  "count-the-number-of-fair-pairs": {
    approach: "Sort, then fair pairs = pairs with sum ≤ upper minus pairs with sum ≤ lower - 1, each counted with two pointers.",
    idea: ["Order of i, j does not matter for the count, so sorting is allowed.", "count(x) = pairs with sum ≤ x: with L at the start and R at the end, if a[L] + a[R] ≤ x then all R - L pairs with that L work.", "Answer = count(upper) - count(lower - 1)."],
    code: `def countFairPairs(nums, lower, upper):
    nums.sort()
    def count(x):
        L, R, c = 0, len(nums) - 1, 0
        while L < R:
            if nums[L] + nums[R] <= x:
                c += R - L
                L += 1
            else:
                R -= 1
        return c
    return count(upper) - count(lower - 1)`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const a = [0, 1, 4, 4, 5, 7], lo = 3, hi = 6, frames: CellsFrame[] = [];
      const count = (x: number) => { let L = 0, R = a.length - 1, c = 0; while (L < R) { const ok = a[L] + a[R] <= x; if (ok) c += R - L; frames.push({ note: `sum ≤ ${x}: ${a[L]} + ${a[R]} ${ok ? `≤ ${x} → ${R - L} pairs with L (count ${c}); L++` : `> ${x} → R--`}`, tones: { [`0:${L}`]: "active", [`0:${R}`]: "active", ...(ok ? range(L + 1, R - 1) : {}) }, marks: [{ i: L, label: "L" }, { i: R, label: "R" }] }); if (ok) L++; else R--; } return c; };
      const u = count(hi), l = count(lo - 1);
      frames.push({ note: `fair pairs = ${u} - ${l} = ${u - l}` });
      return cells(`Pairs with sum in [${lo}, ${hi}]: ${u - l}`, [a], frames);
    },
  },

  "rank-teams-by-votes": {
    approach: "Count how many times each team got each position, then sort by that count vector (descending) and break ties alphabetically.",
    idea: ["Team A beats B if it has more first places; if tied, more second places; and so on.", "So the key is the list of position counts compared lexicographically, larger first.", "Sort with key (negated counts, letter)."],
    code: `def rankTeams(votes):
    n = len(votes[0])
    count = {t: [0] * n for t in votes[0]}
    for v in votes:
        for i, t in enumerate(v):
            count[t][i] += 1
    return "".join(sorted(votes[0], key=lambda t: ([-c for c in count[t]], t)))`,
    lang: "python", time: "O(V·n + n² log n)", space: "O(n²)",
    viz: () => {
      const votes = ["ABC", "ACB", "ABC", "ACB", "ACB"], teams = [...votes[0]], cnt = teams.map(() => [0, 0, 0]), frames: TableFrame[] = [];
      votes.forEach((v) => { [...v].forEach((t, i) => cnt[teams.indexOf(t)][i]++); frames.push({ note: `vote "${v}": add one to each team's position count`, cells: cnt.map((r) => [...r]) }); });
      const order = [...teams].sort((x, y) => { const a = cnt[teams.indexOf(x)], b = cnt[teams.indexOf(y)]; for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i] - a[i]; return x < y ? -1 : 1; });
      frames.push({ note: `Compare rows left to right (more is better): order ${order.join("")}`, cells: cnt.map((r) => [...r]), tones: { [`${teams.indexOf(order[0])}:0`]: "found", [`${teams.indexOf(order[1])}:1`]: "found", [`${teams.indexOf(order[2])}:1`]: "window" } });
      return { kind: "table", title: `Ranking: "${order.join("")}"`, rowHead: teams, colHead: ["1st", "2nd", "3rd"], frames };
    },
  },

  "smallest-string-with-a-given-numeric-value": {
    approach: "Fill from the right: each position takes the biggest letter possible while leaving at least 1 (an 'a') for every position before it.",
    idea: ["Small letters should sit at the front, so put the large values at the back.", "Going from the last position, take min(26, k - (positions left before this one)).", "That leaves exactly enough for all remaining positions to be at least 'a'."],
    code: `def getSmallestString(n, k):
    out = []
    for i in range(n, 0, -1):
        v = min(26, k - (i - 1))
        out.append(chr(96 + v))
        k -= v
    return "".join(reversed(out))`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 5, k0 = 73; let k = k0; const row: string[] = Array(n).fill(""), frames: CellsFrame[] = [];
      for (let i = n; i >= 1; i--) { const v = Math.min(26, k - (i - 1)); row[i - 1] = String.fromCharCode(96 + v); frames.push({ note: `position ${i - 1}: keep ${i - 1} for the earlier letters → min(26, ${k} - ${i - 1}) = ${v} = '${row[i - 1]}'`, rows: [[...row]], tones: { [`0:${i - 1}`]: "active", ...range(i, n - 1, 0, "done") } }); k -= v; }
      return cells(`n = ${n}, k = ${k0}: "${row.join("")}"`, [row.map(() => "")], frames);
    },
  },

  "sum-of-even-numbers-after-queries": {
    approach: "Keep the running sum of even values; before each update remove the old value if even, after it add the new value if even.",
    idea: ["Recomputing the even sum each time is O(n) per query.", "Only one element changes, so adjust the sum for that element alone.", "Record the sum after every query."],
    code: `def sumEvenAfterQueries(nums, queries):
    even = sum(x for x in nums if x % 2 == 0)
    out = []
    for val, i in queries:
        if nums[i] % 2 == 0:
            even -= nums[i]
        nums[i] += val
        if nums[i] % 2 == 0:
            even += nums[i]
        out.append(even)
    return out`,
    lang: "python", time: "O(n + q)", space: "O(1) extra",
    viz: () => {
      const a = [1, 2, 3, 4], qs = [[1, 0], [-3, 1], [-4, 0], [2, 3]], frames: CellsFrame[] = []; let even = a.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0);
      frames.push({ note: `Even sum at the start: ${even}`, rows: [[...a]] });
      qs.forEach(([v, i]) => { const old = a[i]; if (old % 2 === 0) even -= old; a[i] += v; if (a[i] % 2 === 0) even += a[i]; frames.push({ note: `nums[${i}] ${old} → ${a[i]}: ${old % 2 === 0 ? `remove ${old}` : "old was odd"}, ${a[i] % 2 === 0 ? `add ${a[i]}` : "new is odd"} → even sum ${even}`, rows: [[...a]], tones: { [`0:${i}`]: a[i] % 2 === 0 ? "found" : "active" } }); });
      return cells("Even sum after each query: 8, 6, 2, 4", [[1, 2, 3, 4]], frames);
    },
  },

  "queens-that-can-attack-the-king": {
    approach: "Walk from the king in all 8 directions; the first queen met in each direction is the one that attacks.",
    idea: ["A queen attacks the king only if nothing stands between them on a line.", "From the king, step outward in each of 8 directions until leaving the board.", "The first queen in each direction is an attacker; queens behind it are blocked."],
    code: `def queensAttacktheKing(queens, king):
    qs = set(map(tuple, queens))
    out = []
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == dc == 0:
                continue
            r, c = king[0] + dr, king[1] + dc
            while 0 <= r < 8 and 0 <= c < 8:
                if (r, c) in qs:
                    out.append([r, c])
                    break
                r, c = r + dr, c + dc
    return out`,
    lang: "python", time: "O(1) (8 × 8 board)", space: "O(q)",
    viz: () => {
      const queens = [[0, 1], [1, 0], [4, 0], [0, 4], [3, 3], [2, 4]], king = [0, 0], N = 5, board = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (r === king[0] && c === king[1] ? "K" : queens.some(([a, b]) => a === r && b === c) ? "Q" : "")));
      const frames: TableFrame[] = [], found: string[] = [];
      for (const dr of [-1, 0, 1]) for (const dc of [-1, 0, 1]) {
        if (!dr && !dc) continue; let r = king[0] + dr, c = king[1] + dc; const ray: string[] = []; let hit = "";
        while (r >= 0 && r < 8 && c >= 0 && c < 8) { if (queens.some(([a, b]) => a === r && b === c)) { hit = `${r}:${c}`; found.push(hit); break; } if (r < N && c < N) ray.push(`${r}:${c}`); r += dr; c += dc; }
        if (ray.length || hit) frames.push({ note: `direction (${dr},${dc}): ${hit ? `first queen at (${hit.replace(":", ",")}) attacks` : "no queen"}`, cells: board, tones: { ...all(found, "found"), ...all(ray, "window"), [`${king[0]}:${king[1]}`]: "active" } });
      }
      return grid(`${found.length} queens attack the king (top-left 5 x 5 of the board)`, N, N, frames);
    },
  },

  "count-vowel-strings-in-ranges": {
    approach: "Prefix count of words that start and end with a vowel; each query is a difference of two prefix values.",
    idea: ["Mark each word 1 if its first and last letters are vowels, else 0.", "pre[i] = number of marked words among the first i.", "Query [l, r] = pre[r + 1] - pre[l]."],
    code: `def vowelStrings(words, queries):
    pre = [0]
    for w in words:
        pre.append(pre[-1] + (w[0] in "aeiou" and w[-1] in "aeiou"))
    return [pre[r + 1] - pre[l] for l, r in queries]`,
    lang: "python", time: "O(n + q)", space: "O(n)",
    viz: () => {
      const words = ["aba", "bcb", "ece", "aa", "e"], qs = [[0, 2], [1, 4], [1, 1]], V = "aeiou", mark = words.map((w) => (V.includes(w[0]) && V.includes(w[w.length - 1]) ? 1 : 0)), pre = [0]; mark.forEach((x) => pre.push(pre[pre.length - 1] + x));
      const frames: CellsFrame[] = [{ note: `Marks [${mark.join(", ")}], prefix [${pre.join(", ")}]`, tones: all(mark.map((x, i) => (x ? `0:${i}` : "")).filter(Boolean), "found") }];
      qs.forEach(([l, r]) => frames.push({ note: `query [${l}, ${r}]: pre[${r + 1}] - pre[${l}] = ${pre[r + 1]} - ${pre[l]} = ${pre[r + 1] - pre[l]}`, tones: { ...range(l, r), ...range(l, r, 1) } }));
      return cells("Vowel strings in ranges: [2, 3, 0]", [words, mark], frames, ["word", "vowel ends"]);
    },
  },

  "maximum-candies-allocated-to-k-children": {
    approach: "Binary search the answer x: x candies each is possible when the piles split into at least k piles of size x.",
    idea: ["If every child can get x, they can also get any smaller amount, so feasibility is monotonic.", "A pile of c gives c // x children their share.", "Find the largest x with sum(c // x) ≥ k; 0 if even 1 is impossible."],
    code: `def maximumCandies(candies, k):
    lo, hi = 0, max(candies)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if sum(c // mid for c in candies) >= k:
            lo = mid
        else:
            hi = mid - 1
    return lo`,
    lang: "python", time: "O(n log max)", space: "O(1)",
    viz: () => {
      const c = [5, 8, 6], k = 3, frames: CellsFrame[] = []; let lo = 0, hi = Math.max(...c);
      while (lo < hi) { const mid = Math.floor((lo + hi + 1) / 2), shares = c.map((x) => Math.floor(x / mid)), tot = shares.reduce((a, b) => a + b, 0), ok = tot >= k; frames.push({ note: `try ${mid} each: piles give [${shares.join(", ")}] = ${tot} children ${ok ? `≥ ${k}, works → lo = ${mid}` : `< ${k}, too many → hi = ${mid - 1}`}`, rows: [c, shares], tones: all(c.map((_, i) => `1:${i}`), ok ? "found" : "bad") }); if (ok) lo = mid; else hi = mid - 1; }
      return cells(`Most candies each for ${k} children: ${lo}`, [c, c.map(() => "")], frames, ["pile", "shares"]);
    },
  },

  "array-nesting": {
    approach: "nums is a permutation, so it splits into disjoint cycles; walk each cycle once, marking visited, and keep the longest.",
    idea: ["Following k → nums[k] from any start loops back to that start: it is a cycle.", "Every index belongs to exactly one cycle, so once visited it never needs to be walked again.", "The answer is the longest cycle length."],
    code: `def arrayNesting(nums):
    seen = [False] * len(nums)
    best = 0
    for i in range(len(nums)):
        length = 0
        while not seen[i]:
            seen[i] = True
            i = nums[i]
            length += 1
        best = max(best, length)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [5, 4, 0, 3, 1, 6, 2], seen = Array(a.length).fill(false), frames: CellsFrame[] = []; let best = 0;
      for (let s = 0; s < a.length; s++) { if (seen[s]) continue; const cyc: number[] = []; let i = s; while (!seen[i]) { seen[i] = true; cyc.push(i); i = a[i]; } best = Math.max(best, cyc.length); frames.push({ note: `from ${s}: ${cyc.map((x) => a[x]).join(" → ")} back to ${a[s]}, length ${cyc.length} (best ${best})`, tones: { ...all(seen.map((v, k) => (v ? `0:${k}` : "")).filter(Boolean), "done"), ...all(cyc.map((x) => `0:${x}`), "found") } }); }
      return cells(`Longest nesting: ${best}`, [a], frames);
    },
  },

  "minimum-sideway-jumps": {
    approach: "DP over the 3 lanes point by point: move forward for free, then let each open lane be reached by one side jump from the best lane.",
    idea: ["dp[lane] = fewest jumps to stand at this point in that lane.", "At a point with an obstacle in lane o, dp[o] becomes unreachable.", "Then each open lane can be min(itself, best open lane + 1)."],
    code: `def minSideJumps(obstacles):
    INF = float("inf")
    dp = [1, 0, 1]
    for o in obstacles[1:]:
        if o:
            dp[o - 1] = INF
        best = min(dp)
        for lane in range(3):
            if lane != o - 1:
                dp[lane] = min(dp[lane], best + 1)
    return min(dp)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const obs = [0, 1, 2, 3, 0], dp: (number | null)[] = [1, 0, 1], rows: (number | null)[][] = [[], [], []], frames: TableFrame[] = [];
      obs.forEach((o, p) => {
        if (p > 0) { if (o) dp[o - 1] = null; const best = Math.min(...dp.filter((x): x is number => x != null)); for (let l = 0; l < 3; l++) if (l !== o - 1) dp[l] = Math.min(dp[l] ?? 1e9, best + 1); }
        dp.forEach((v, l) => (rows[l][p] = v)); const full = rows.map((r) => [...r, ...Array(obs.length - r.length).fill(null)]);
        frames.push({ note: p === 0 ? "Start in lane 2 (middle) at point 0: lanes 1 and 3 cost one jump" : `point ${p}${o ? `: rock in lane ${o}` : ": no rock"} → jumps per lane [${dp.map((x) => (x == null ? "blocked" : x)).join(", ")}]`, cells: full, tones: o ? { [`${o - 1}:${p}`]: "bad" } : {}, active: [dp.indexOf(Math.min(...dp.filter((x): x is number => x != null))), p] });
      });
      return { kind: "table", title: `Fewest side jumps: ${Math.min(...dp.filter((x): x is number => x != null))}`, rowHead: ["lane 1", "lane 2", "lane 3"], colHead: nums(obs.length), frames };
    },
  },

  "decoded-string-at-index": {
    approach: "Compute the decoded length without building it, then walk backwards: digits divide the length (k %= size), letters peel off one.",
    idea: ["The decoded tape can be astronomically long, but its length is easy to track.", "Going backwards, a digit d means the tape is d copies of a shorter tape, so k can be taken modulo that shorter size.", "When k % size == 0 at a letter, that letter is the answer."],
    code: `def decodeAtIndex(s, k):
    size = 0
    for ch in s:
        size = size * int(ch) if ch.isdigit() else size + 1
    for ch in reversed(s):
        k %= size
        if k == 0 and ch.isalpha():
            return ch
        size = size // int(ch) if ch.isdigit() else size - 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "leet2code3", k0 = 10, sizes: number[] = []; let size = 0; for (const ch of s) { size = /\d/.test(ch) ? size * +ch : size + 1; sizes.push(size); }
      const frames: CellsFrame[] = [{ note: `Decoded length after each character; the full tape has ${size} letters`, rows: [[...s], sizes] }]; let k = k0, ans = "";
      for (let i = s.length - 1; i >= 0; i--) { const ch = s[i]; k %= size; const hit = k === 0 && /[a-z]/.test(ch); frames.push({ note: `'${ch}': k = k mod ${size} = ${k}${hit ? ` → '${ch}' is the answer` : /\d/.test(ch) ? `; undo x${ch}, size ${size / +ch}` : `; drop '${ch}', size ${size - 1}`}`, rows: [[...s], sizes], tones: { [`0:${i}`]: hit ? "found" : "active", [`1:${i}`]: "window" } }); if (hit) { ans = ch; break; } size = /\d/.test(ch) ? size / +ch : size - 1; }
      return cells(`decodeAtIndex("${s}", ${k0}) = '${ans}'`, [[...s], sizes], frames, ["s", "size"]);
    },
  },

  "binary-tree-level-order-traversal-ii": {
    approach: "Ordinary BFS collecting one list per level, then reverse the list of levels.",
    idea: ["BFS with a queue visits the tree level by level, top first.", "Collect each level's values in a list.", "Bottom-up order is just that list reversed."],
    code: `from collections import deque
def levelOrderBottom(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            n = q.popleft()
            level.append(n.val)
            if n.left:
                q.append(n.left)
            if n.right:
                q.append(n.right)
        out.append(level)
    return out[::-1]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals = [3, 9, 20, null, null, 15, 7], { nodes, kids } = levelTree(vals), frames: TreeFrame[] = [], out: number[][] = []; let q = [0]; const done: number[] = [];
      while (q.length) { out.push(q.map((i) => vals[i] as number)); done.push(...q); frames.push({ note: `level ${out.length - 1}: [${out[out.length - 1].join(", ")}]`, tones: { ...all(done, "done"), ...all(q, "active") } }); q = q.flatMap((i) => kids[i].filter((c): c is number => c != null)); }
      frames.push({ note: `Reverse the levels: ${JSON.stringify([...out].reverse())}`, tones: all(done, "found") });
      return tree("Level order, bottom up", nodes, frames);
    },
  },

  "rotating-the-box": {
    approach: "In each row, slide stones right with a write pointer that resets at every obstacle; then rotate the matrix clockwise.",
    idea: ["Rotating clockwise makes gravity point to the right side of each original row.", "Scan a row from the right keeping the lowest empty slot; a stone moves there, an obstacle resets the slot to just left of it.", "The rotated box has result[j][m - 1 - i] = box[i][j]."],
    code: `def rotateTheBox(boxGrid):
    m, n = len(boxGrid), len(boxGrid[0])
    for row in boxGrid:
        empty = n - 1
        for j in range(n - 1, -1, -1):
            if row[j] == "*":
                empty = j - 1
            elif row[j] == "#":
                row[j], row[empty] = ".", "#"
                empty -= 1
    return [[boxGrid[m - 1 - i][j] for i in range(m)] for j in range(n)]`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const b = [["#", "#", "*", ".", "*", "."], ["#", "#", "#", "*", ".", "."], ["#", "#", "#", ".", "#", "."]], m = 3, n = 6, frames: TableFrame[] = [], pad = (g: string[][]) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => g[i]?.[j] ?? null));
      b.forEach((row, i) => { let empty = n - 1; for (let j = n - 1; j >= 0; j--) { if (row[j] === "*") empty = j - 1; else if (row[j] === "#") { row[j] = "."; row[empty] = "#"; empty--; } } frames.push({ note: `row ${i}: stones slide right until the wall or an obstacle → ${row.join("")}`, cells: pad(b), tones: Object.fromEntries(row.map((_, j) => [`${i}:${j}`, "window"])) as Record<string, Tone> }); });
      const rot = Array.from({ length: n }, (_, j) => Array.from({ length: m }, (_, i) => b[m - 1 - i][j]));
      frames.push({ note: `Rotate clockwise: result[j][${m - 1} - i] = box[i][j], giving ${n} rows of ${m}`, cells: pad(rot), tones: Object.fromEntries(rot.flatMap((r, i) => r.map((v, j) => [`${i}:${j}`, v === "#" ? "found" : v === "*" ? "bad" : "muted"]))) as Record<string, Tone> });
      return grid("Rotate the box", n, n, frames);
    },
  },

  "the-number-of-weak-characters-in-the-game": {
    approach: "Sort by attack descending and, for equal attack, defense ascending; a character is weak if its defense is below the max defense seen so far.",
    idea: ["Everyone seen earlier has attack ≥ the current one.", "Ascending defense within one attack means equal-attack characters cannot make each other weak.", "So any earlier defense strictly greater than the current proves it weak."],
    code: `def numberOfWeakCharacters(properties):
    properties.sort(key=lambda p: (-p[0], p[1]))
    best = weak = 0
    for _, d in properties:
        if d < best:
            weak += 1
        best = max(best, d)
    return weak`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const p = [[1, 5], [10, 4], [4, 3], [4, 1], [2, 6]].sort((a, b) => b[0] - a[0] || a[1] - b[1]), row = p.map(([a, d]) => `${a},${d}`), frames: CellsFrame[] = []; let best = 0, weak = 0;
      p.forEach(([, d], i) => { const w = d < best; if (w) weak++; frames.push({ note: `${row[i]}: defense ${d} ${w ? `< ${best} seen with higher attack → weak (${weak})` : `≥ ${best}, not weak`}`, tones: { [`0:${i}`]: w ? "bad" : "found" } }); best = Math.max(best, d); });
      return cells(`Weak characters: ${weak}`, [row], frames, ["atk,def"]);
    },
  },

  "path-sum-iii": {
    approach: "DFS with a counter of prefix sums on the current root path; paths ending here = count[running - target].",
    idea: ["A downward path from u to v sums to target when prefix(v) - prefix(parent of u) == target.", "Keep how many times each prefix sum appears on the path from the root (start with {0: 1}).", "Add the node's prefix before visiting children and remove it after, so only ancestors are counted."],
    code: `from collections import defaultdict
def pathSum(root, targetSum):
    seen = defaultdict(int)
    seen[0] = 1
    def dfs(node, run):
        if not node:
            return 0
        run += node.val
        count = seen[run - targetSum]
        seen[run] += 1
        count += dfs(node.left, run) + dfs(node.right, run)
        seen[run] -= 1
        return count
    return dfs(root, 0)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1], { nodes, kids } = levelTree(vals), target = 8, seen = new Map<number, number>([[0, 1]]), frames: TreeFrame[] = [], badges: Record<number, string> = {}; let total = 0;
      const dfs = (i: number | null, run: number) => { if (i == null) return; run += vals[i] as number; const c = seen.get(run - target) || 0; total += c; badges[i] = String(run); frames.push({ note: `${vals[i]}: prefix ${run}; prefix ${run - target} seen ${c} time${c === 1 ? "" : "s"} on the path → ${c} path${c === 1 ? "" : "s"} end here (total ${total})`, tones: { [i]: c ? "found" : "active" }, badges: { ...badges } }); seen.set(run, (seen.get(run) || 0) + 1); dfs(kids[i][0], run); dfs(kids[i][1], run); seen.set(run, seen.get(run)! - 1); };
      dfs(0, 0);
      const seenT: Record<number, Tone> = {};
      return tree(`Paths summing to ${target}: ${total}`, nodes, frames.map((f) => { const out = { ...f, tones: { ...seenT, ...f.tones } }; Object.entries(f.tones || {}).forEach(([k, t]) => (seenT[+k] = t === "found" ? "found" : "done")); return out; }));
    },
  },

  "different-ways-to-add-parentheses": {
    approach: "Divide and conquer: split at every operator, combine every result of the left side with every result of the right side, memoised by substring.",
    idea: ["The last operator applied splits the expression into a left and a right part.", "Recursively get all values of each part, then combine every pair with that operator.", "A plain number is its own only value. Memoising on the substring avoids recomputing shared parts."],
    code: `from functools import lru_cache
def diffWaysToCompute(expression):
    @lru_cache(None)
    def ways(s):
        if s.isdigit():
            return [int(s)]
        out = []
        for i, ch in enumerate(s):
            if ch in "+-*":
                for a in ways(s[:i]):
                    for b in ways(s[i + 1:]):
                        out.append(a + b if ch == "+" else a - b if ch == "-" else a * b)
        return out
    return ways(expression)`,
    lang: "python", time: "O(Catalan(n))", space: "O(Catalan(n))",
    viz: () => {
      const expr = "2*3-4*5", memo = new Map<string, number[]>(), frames: StackFrame[] = [], stack: string[] = [];
      const ways = (s: string): number[] => {
        if (memo.has(s)) return memo.get(s)!; if (/^\d+$/.test(s)) { memo.set(s, [+s]); return [+s]; }
        stack.push(s); const out: number[] = [];
        [...s].forEach((ch, i) => { if (!"+-*".includes(ch)) return; const L = ways(s.slice(0, i)), R = ways(s.slice(i + 1)); L.forEach((a) => R.forEach((b) => out.push(ch === "+" ? a + b : ch === "-" ? a - b : a * b))); frames.push({ note: `"${s}" split at '${ch}': [${L.join(", ")}] ${ch} [${R.join(", ")}] → so far [${out.join(", ")}]`, items: [...stack], side: `memo holds ${memo.size} parts` }); });
        stack.pop(); memo.set(s, out); return out;
      };
      const res = ways(expr);
      return { kind: "stack", title: `"${expr}" → [${res.join(", ")}]`, input: [...expr], frames };
    },
  },

  "maximum-total-damage-with-spell-casting": {
    approach: "Group equal damages, sort the distinct values, and run a house-robber DP where taking value v rules out v-2..v+2.",
    idea: ["Casting one spell of damage v lets you cast every spell of damage v, so use total = v * count.", "Over sorted distinct values, dp[i] = max(dp[i-1], total[i] + dp[j]) where j is the last value below v - 2.", "A pointer finds j as i grows, since values are sorted."],
    code: `from collections import Counter
def maximumTotalDamage(power):
    cnt = Counter(power)
    vals = sorted(cnt)
    dp = [0] * (len(vals) + 1)       # dp[i] = best using the first i values
    j = 0
    for i, v in enumerate(vals):
        while vals[j] < v - 2:
            j += 1
        dp[i + 1] = max(dp[i], dp[j] + v * cnt[v])
    return dp[-1]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const power = [7, 1, 6, 6], cnt = new Map<number, number>(); power.forEach((p) => cnt.set(p, (cnt.get(p) || 0) + 1));
      const vals = [...cnt.keys()].sort((a, b) => a - b), dp = Array(vals.length + 1).fill(0), frames: CellsFrame[] = []; let j = 0;
      vals.forEach((v, i) => { while (vals[j] < v - 2) j++; const take = dp[j] + v * cnt.get(v)!; dp[i + 1] = Math.max(dp[i], take); frames.push({ note: `${v} x${cnt.get(v)}: take = ${v * cnt.get(v)!} + best below ${v - 2} (${dp[j]}) = ${take}, skip = ${dp[i]} → ${dp[i + 1]}`, rows: [vals, vals.map((x) => x * cnt.get(x)!), dp.slice(1)], tones: { [`0:${i}`]: "active", [`2:${i}`]: "found", ...(j > 0 ? { [`2:${j - 1}`]: "window" } : {}) } }); });
      return cells(`Maximum total damage: ${dp[vals.length]}`, [vals, vals.map((x) => x * cnt.get(x)!), Array(vals.length).fill(0)], frames, ["value", "total", "best"]);
    },
  },

  "most-profit-assigning-work": {
    approach: "Sort jobs by difficulty and workers by ability; sweep with a pointer keeping the best profit among jobs each worker can do.",
    idea: ["A worker should take the most profitable job with difficulty ≤ their ability.", "As ability increases, the set of doable jobs only grows, so one pointer over sorted jobs suffices.", "Add the running best profit for every worker."],
    code: `def maxProfitAssignment(difficulty, profit, worker):
    jobs = sorted(zip(difficulty, profit))
    best = total = i = 0
    for w in sorted(worker):
        while i < len(jobs) and jobs[i][0] <= w:
            best = max(best, jobs[i][1])
            i += 1
        total += best
    return total`,
    lang: "python", time: "O(n log n + m log m)", space: "O(n)",
    viz: () => {
      const jobs = [[2, 10], [4, 20], [6, 30], [8, 40], [10, 50]], workers = [4, 5, 6, 7], frames: CellsFrame[] = []; let best = 0, total = 0, i = 0;
      workers.forEach((w, k) => { while (i < jobs.length && jobs[i][0] <= w) { best = Math.max(best, jobs[i][1]); i++; } total += best; frames.push({ note: `worker ${w}: jobs up to difficulty ${w} are open, best profit ${best} (total ${total})`, rows: [jobs.map(([d, p]) => `${d}:${p}`), [...workers, ""]], tones: { ...range(0, i - 1, 0, "done"), [`1:${k}`]: "active" } }); });
      return cells(`Total profit: ${total}`, [jobs.map(([d, p]) => `${d}:${p}`), [...workers, ""]], frames, ["job d:p", "worker"]);
    },
  },

  "vowels-of-all-substrings": {
    approach: "A vowel at index i appears in (i + 1) · (n - i) substrings, so add that for every vowel.",
    idea: ["A substring containing index i starts at one of i + 1 places and ends at one of n - i places.", "So each vowel is counted (i + 1)(n - i) times in total.", "Sum over vowels; no substring is built."],
    code: `def countVowels(word):
    n = len(word)
    return sum((i + 1) * (n - i) for i, ch in enumerate(word) if ch in "aeiou")`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const w = "aba", n = w.length, frames: CellsFrame[] = []; let total = 0;
      [...w].forEach((ch, i) => { const v = "aeiou".includes(ch), c = (i + 1) * (n - i); if (v) total += c; frames.push({ note: v ? `'${ch}' at ${i}: ${i + 1} starts x ${n - i} ends = ${c} substrings (total ${total})` : `'${ch}' is not a vowel`, tones: v ? { ...range(0, n - 1, 0, "window"), [`0:${i}`]: "found" } : { [`0:${i}`]: "muted" } }); });
      return cells(`Vowels over all substrings of "${w}": ${total}`, [[...w]], frames);
    },
  },

  "maximum-non-negative-product-in-a-matrix": {
    approach: "DP keeping both the largest and the smallest product to each cell, because a negative times the smallest can become the largest.",
    idea: ["Paths only move right or down, so each cell comes from above or the left.", "Keep hi and lo products for every cell; with a negative value, hi and lo swap roles.", "If the final hi is negative the answer is -1, otherwise hi mod 10^9 + 7."],
    code: `def maxProductPath(grid):
    m, n = len(grid), len(grid[0])
    hi = [[0] * n for _ in range(m)]
    lo = [[0] * n for _ in range(m)]
    for r in range(m):
        for c in range(n):
            v = grid[r][c]
            if r == 0 and c == 0:
                hi[r][c] = lo[r][c] = v
                continue
            prev = []
            if r:
                prev += [hi[r - 1][c], lo[r - 1][c]]
            if c:
                prev += [hi[r][c - 1], lo[r][c - 1]]
            cand = [p * v for p in prev]
            hi[r][c], lo[r][c] = max(cand), min(cand)
    best = hi[m - 1][n - 1]
    return best % (10**9 + 7) if best >= 0 else -1`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const g = [[1, -2, 1], [1, -2, 1], [3, -4, 1]], m = 3, n = 3, hi = g.map((r) => r.map(() => 0)), lo = g.map((r) => r.map(() => 0)), shown: (string | null)[][] = g.map((r) => r.map(() => null)), frames: TableFrame[] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        const v = g[r][c]; if (!r && !c) hi[0][0] = lo[0][0] = v; else { const prev: number[] = []; if (r) prev.push(hi[r - 1][c], lo[r - 1][c]); if (c) prev.push(hi[r][c - 1], lo[r][c - 1]); const cand = prev.map((p) => p * v); hi[r][c] = Math.max(...cand); lo[r][c] = Math.min(...cand); }
        shown[r][c] = `${hi[r][c]}/${lo[r][c]}`;
        frames.push({ note: `(${r},${c}) value ${v}: max ${hi[r][c]}, min ${lo[r][c]}${v < 0 ? " (negative: the old min times it gives the new max)" : ""}`, cells: shown.map((x) => [...x]), active: [r, c], deps: [...(r ? [[r - 1, c] as [number, number]] : []), ...(c ? [[r, c - 1] as [number, number]] : [])] });
      }
      return grid(`Max non-negative product: ${hi[2][2] >= 0 ? hi[2][2] : -1} (cells show max/min)`, m, n, frames);
    },
  },

  "minimum-operations-to-make-array-equal": {
    approach: "The array 1, 3, 5, ... averages to n, so move each element below n up to n: the total is n² // 4.",
    idea: ["Each operation moves 1 from one element to another, so the sum stays n² and every element must become n.", "Pair the i-th smallest with the i-th largest: each pair needs n - (2i + 1) operations.", "Summing those gives n² // 4."],
    code: `def minOperations(n):
    return n * n // 4`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const n = 6, a = Array.from({ length: n }, (_, i) => 2 * i + 1), frames: CellsFrame[] = []; let total = 0;
      for (let i = 0; i < n / 2; i++) { const need = n - a[i]; total += need; frames.push({ note: `pair ${a[i]} with ${a[n - 1 - i]}: ${need} moves bring both to ${n} (total ${total})`, tones: { [`0:${i}`]: "active", [`0:${n - 1 - i}`]: "active", ...range(0, i - 1, 0, "done"), ...range(n - i, n - 1, 0, "done") } }); }
      frames.push({ note: `n² // 4 = ${n * n} // 4 = ${(n * n) >> 2}`, tones: range(0, n - 1, 0, "found") });
      return cells(`n = ${n}: ${total} operations`, [a], frames);
    },
  },

  "smallest-subarrays-with-maximum-bitwise-or": {
    approach: "Scan from the right remembering the nearest index holding each bit; the subarray from i must reach the farthest of those.",
    idea: ["The maximum OR from i is the OR of everything from i to the end.", "To get every bit, the subarray must reach the nearest index ≥ i that has that bit.", "Keep last[b] for 32 bits while scanning right to left; the answer is max(last) - i + 1 (at least 1)."],
    code: `def smallestSubarrays(nums):
    n = len(nums)
    last = [0] * 32
    out = [1] * n
    for i in range(n - 1, -1, -1):
        for b in range(32):
            if nums[i] >> b & 1:
                last[b] = i
        out[i] = max(1, max(last) - i + 1)
    return out`,
    lang: "python", time: "O(32·n)", space: "O(1) extra",
    viz: () => {
      const a = [1, 0, 2, 1, 3], n = a.length, last = [0, 0], out: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [];
      for (let i = n - 1; i >= 0; i--) { for (let b = 0; b < 2; b++) if ((a[i] >> b) & 1) last[b] = i; const far = Math.max(...last); out[i] = Math.max(1, far - i + 1); frames.push({ note: `i = ${i}: nearest bit 0 at ${last[0]}, bit 1 at ${last[1]} → reach ${Math.max(i, far)}, length ${out[i]}`, rows: [a, [...out]], tones: { ...range(i, Math.max(i, far)), [`0:${i}`]: "active" } }); }
      return cells(`Smallest max-OR subarrays: [${out.join(", ")}]`, [a, Array(n).fill("")], frames, ["nums", "answer"]);
    },
  },

  "count-unreachable-pairs-of-nodes-in-an-undirected-graph": {
    approach: "Find component sizes; each component of size s pairs with every node outside the components counted so far.",
    idea: ["Two nodes are unreachable exactly when they are in different components.", "Process components one by one, keeping seen = nodes in earlier components.", "A component of size s adds s · seen pairs; then seen += s."],
    code: `def countPairs(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        parent[find(a)] = find(b)
    size = {}
    for x in range(n):
        r = find(x)
        size[r] = size.get(r, 0) + 1
    ans = seen = 0
    for s in size.values():
        ans += s * seen
        seen += s
    return ans`,
    lang: "python", time: "O((n + e) α(n))", space: "O(n)",
    viz: () => {
      const n = 7, edges = [[0, 2], [0, 5], [2, 4], [1, 6], [5, 4]], pos = [[15, 15], [65, 15], [40, 15], [90, 50], [40, 80], [15, 80], [90, 15]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), parent = Array.from({ length: n }, (_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      edges.forEach(([a, b]) => (parent[find(a)] = find(b))); const comps = new Map<number, number[]>(); for (let x = 0; x < n; x++) comps.set(find(x), [...(comps.get(find(x)) || []), x]);
      const frames: GraphFrame[] = [], done: number[] = []; let ans = 0, seen = 0;
      comps.forEach((xs) => { ans += xs.length * seen; frames.push({ note: `component {${xs.join(", ")}} of size ${xs.length} pairs with ${seen} earlier nodes: +${xs.length * seen} (total ${ans})`, tones: { ...all(done, "done"), ...all(xs, "found") } }); seen += xs.length; done.push(...xs); });
      return { kind: "graph", title: `Unreachable pairs: ${ans}`, nodes, edges: edges.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "iterator-for-combination": {
    approach: "itertools.combinations already yields combinations in lexicographic order; keep one item of lookahead to answer hasNext.",
    idea: ["The characters are sorted and distinct, so combinations come out in lexicographic order.", "Store the next combination ahead of time; None means the iterator is finished.", "next() returns it and fetches the following one."],
    code: `from itertools import combinations
class CombinationIterator:
    def __init__(self, characters, combinationLength):
        self.it = combinations(characters, combinationLength)
        self.peek = next(self.it, None)

    def next(self):
        out = "".join(self.peek)
        self.peek = next(self.it, None)
        return out

    def hasNext(self):
        return self.peek is not None`,
    lang: "python", time: "O(k) per call", space: "O(k)",
    viz: () => {
      const s = "abcd", k = 2, combos: number[][] = [], frames: CellsFrame[] = [];
      const go = (start: number, cur: number[]) => { if (cur.length === k) { combos.push([...cur]); return; } for (let i = start; i < s.length; i++) { cur.push(i); go(i + 1, cur); cur.pop(); } }; go(0, []);
      combos.forEach((c, i) => frames.push({ note: `next() → "${c.map((x) => s[x]).join("")}"; hasNext() → ${i + 1 < combos.length}`, tones: all(c.map((x) => `0:${x}`), "found") }));
      return cells(`Combinations of "${s}" of length ${k}`, [[...s]], frames);
    },
  },

  "separate-black-and-white-balls": {
    approach: "Each white ball (0) must pass every black ball (1) to its left; add the count of 1s seen so far at each 0.",
    idea: ["Each swap moves one 0 past one 1.", "So the minimum is the number of (1, 0) pairs with the 1 on the left.", "Count 1s while scanning and add that count at each 0."],
    code: `def minimumSteps(s):
    ones = steps = 0
    for ch in s:
        if ch == "1":
            ones += 1
        else:
            steps += ones
    return steps`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "10101", frames: CellsFrame[] = []; let ones = 0, steps = 0;
      [...s].forEach((ch, i) => { if (ch === "1") { ones++; frames.push({ note: `black ball at ${i}: ${ones} black so far`, tones: { [`0:${i}`]: "active" } }); } else { steps += ones; frames.push({ note: `white ball at ${i} must pass ${ones} black ball${ones === 1 ? "" : "s"} → ${steps} steps`, tones: { [`0:${i}`]: "found", ...all([...s].map((c, k) => (c === "1" && k < i ? `0:${k}` : "")).filter(Boolean), "window") } }); } });
      return cells(`"${s}": ${steps} swaps`, [[...s]], frames);
    },
  },

  "number-of-good-ways-to-split-a-string": {
    approach: "Count distinct letters in every prefix and every suffix, then count cut points where they match.",
    idea: ["A cut after index i is good when distinct(s[:i+1]) == distinct(s[i+1:]).", "One pass left to right with a set gives prefix counts; one pass right to left gives suffix counts.", "Compare them at each cut."],
    code: `def numSplits(s):
    n = len(s)
    left, seen = [0] * n, set()
    for i, ch in enumerate(s):
        seen.add(ch)
        left[i] = len(seen)
    right, seen = [0] * (n + 1), set()
    for i in range(n - 1, -1, -1):
        seen.add(s[i])
        right[i] = len(seen)
    return sum(left[i] == right[i + 1] for i in range(n - 1))`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "aacaba", n = s.length, left: number[] = [], right = Array(n + 1).fill(0), seen = new Set<string>(), frames: CellsFrame[] = [];
      [...s].forEach((ch) => { seen.add(ch); left.push(seen.size); }); seen.clear(); for (let i = n - 1; i >= 0; i--) { seen.add(s[i]); right[i] = seen.size; }
      let good = 0; for (let i = 0; i < n - 1; i++) { const ok = left[i] === right[i + 1]; if (ok) good++; frames.push({ note: `cut after ${i}: "${s.slice(0, i + 1)}" has ${left[i]} distinct, "${s.slice(i + 1)}" has ${right[i + 1]} → ${ok ? "good" : "no"} (good ${good})`, tones: { ...range(0, i, 0, ok ? "found" : "window"), [`1:${i}`]: "active", [`2:${i + 1}`]: "active" } }); }
      return cells(`Good splits of "${s}": ${good}`, [[...s], left, right.slice(0, n)], frames, ["s", "left", "right"]);
    },
  },

  "length-of-longest-subarray-with-at-most-k-frequency": {
    approach: "Sliding window with a counter; when the new value's count passes k, move left until it drops back to k.",
    idea: ["Only the value just added can break the rule, so check it alone.", "Shrink from the left, decrementing counts, until that value appears k times.", "Track the longest window."],
    code: `from collections import defaultdict
def maxSubarrayLength(nums, k):
    count = defaultdict(int)
    left = best = 0
    for right, x in enumerate(nums):
        count[x] += 1
        while count[x] > k:
            count[nums[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 3, 1, 2, 3, 1, 2], k = 2, c = new Map<number, number>(), frames: CellsFrame[] = []; let l = 0, best = 0;
      a.forEach((x, r) => { c.set(x, (c.get(x) || 0) + 1); let moved = 0; while (c.get(x)! > k) { c.set(a[l], c.get(a[l])! - 1); l++; moved++; } best = Math.max(best, r - l + 1); frames.push({ note: `add ${x}${moved ? `: ${x} appeared ${k + 1} times, move L right ${moved}` : ""} → window [${l}..${r}] length ${r - l + 1} (best ${best})`, tones: { ...range(l, r), [`0:${r}`]: "active" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] }); });
      return cells(`Longest with each value at most ${k} times: ${best}`, [a], frames);
    },
  },

  "adding-spaces-to-a-string": {
    approach: "Walk the string with a pointer into the sorted spaces list and emit a space right before each marked index.",
    idea: ["spaces is strictly increasing, so a single pointer moves through it once.", "Before copying s[i], if i is the next space index, emit a space and advance the pointer.", "Join the pieces once at the end."],
    code: `def addSpaces(s, spaces):
    out, j = [], 0
    for i, ch in enumerate(s):
        if j < len(spaces) and spaces[j] == i:
            out.append(" ")
            j += 1
        out.append(ch)
    return "".join(out)`,
    lang: "python", time: "O(n + m)", space: "O(n + m)",
    viz: () => {
      const s = "icodeinpython", sp = [1, 5, 7, 9], frames: CellsFrame[] = [], out: string[] = []; let j = 0;
      [...s].forEach((ch, i) => { const add = j < sp.length && sp[j] === i; if (add) { out.push(" "); j++; } out.push(ch); if (add) frames.push({ note: `index ${i} is in spaces: emit a space before '${ch}' → "${out.join("")}"`, tones: { [`0:${i}`]: "found", ...range(0, i - 1, 0, "done") } }); });
      frames.push({ note: `Result: "${out.join("")}"`, tones: all(sp.map((x) => `0:${x}`), "found") });
      return cells(`"${s}" with spaces`, [[...s]], frames);
    },
  },

  "minimum-difference-between-largest-and-smallest-value-in-three-moves": {
    approach: "Sort; three moves can remove any mix of the smallest and largest values, so try the 4 ways and keep the tightest range.",
    idea: ["Changing a value is as good as deleting it (set it equal to something inside the range).", "With up to 4 values the answer is 0.", "Otherwise remove i smallest and 3 - i largest for i = 0..3: range = a[n - 4 + i] - a[i]."],
    code: `def minDifference(nums):
    if len(nums) <= 4:
        return 0
    nums.sort()
    return min(nums[len(nums) - 4 + i] - nums[i] for i in range(4))`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const a = [1, 5, 0, 10, 14].sort((x, y) => x - y), n = a.length, frames: CellsFrame[] = []; let best = 1e9;
      for (let i = 0; i < 4; i++) { const d = a[n - 4 + i] - a[i]; best = Math.min(best, d); frames.push({ note: `drop ${i} smallest and ${3 - i} largest: keep [${i}..${n - 4 + i}], range ${a[n - 4 + i]} - ${a[i]} = ${d} (best ${best})`, tones: { ...range(i, n - 4 + i, 0, "found"), ...range(0, i - 1, 0, "muted"), ...range(n - 3 + i, n - 1, 0, "muted") } }); }
      return cells(`Smallest range after 3 moves: ${best}`, [a], frames);
    },
  },

  "stock-price-fluctuation": {
    approach: "A dict holds the true price per timestamp; two heaps give max and min, discarding stale entries when they surface.",
    idea: ["update may correct an old timestamp, so the latest price per timestamp lives in a dict and the latest time in a variable.", "Push (price, time) into a max-heap and a min-heap on every update.", "When asked for the max or min, pop tops whose price no longer matches the dict (lazy deletion)."],
    code: `import heapq
class StockPrice:
    def __init__(self):
        self.price = {}
        self.latest = 0
        self.hi, self.lo = [], []

    def update(self, timestamp, price):
        self.price[timestamp] = price
        self.latest = max(self.latest, timestamp)
        heapq.heappush(self.hi, (-price, timestamp))
        heapq.heappush(self.lo, (price, timestamp))

    def current(self):
        return self.price[self.latest]

    def maximum(self):
        while self.price[self.hi[0][1]] != -self.hi[0][0]:
            heapq.heappop(self.hi)
        return -self.hi[0][0]

    def minimum(self):
        while self.price[self.lo[0][1]] != self.lo[0][0]:
            heapq.heappop(self.lo)
        return self.lo[0][0]`,
    lang: "python", time: "O(log n) amortised", space: "O(n)",
    viz: () => {
      const price = new Map<number, number>(), hi: [number, number][] = [], frames: StackFrame[] = []; let latest = 0;
      const show = () => [...hi].sort((a, b) => a[0] - b[0]).map(([p, t]) => `${p} @t${t}`);
      const ops: [string, number?, number?][] = [["update", 1, 10], ["update", 2, 5], ["current"], ["maximum"], ["update", 1, 3], ["maximum"], ["update", 4, 2], ["minimum"]], lo: [number, number][] = [];
      for (const [op, t, p] of ops) {
        if (op === "update") { price.set(t!, p!); latest = Math.max(latest, t!); hi.push([p!, t!]); lo.push([p!, t!]); frames.push({ note: `update(${t}, ${p}): record it and push on both heaps`, items: show(), incoming: `${p} @t${t}`, side: `latest t${latest}` }); }
        else if (op === "current") frames.push({ note: `current() → price at latest t${latest} = ${price.get(latest)}`, items: show(), side: `latest t${latest}` });
        else if (op === "maximum") { const popped: string[] = []; hi.sort((a, b) => a[0] - b[0]); while (price.get(hi[hi.length - 1][1]) !== hi[hi.length - 1][0]) { const [pp, tt] = hi.pop()!; popped.push(`${pp} @t${tt}`); } frames.push({ note: `maximum() → ${hi[hi.length - 1][0]}${popped.length ? ` after dropping stale ${popped.join(", ")}` : ""}`, items: show(), popped, side: "max-heap shown" }); }
        else { lo.sort((a, b) => b[0] - a[0]); const popped: string[] = []; while (price.get(lo[lo.length - 1][1]) !== lo[lo.length - 1][0]) { const [pp, tt] = lo.pop()!; popped.push(`${pp} @t${tt}`); } frames.push({ note: `minimum() → ${lo[lo.length - 1][0]}${popped.length ? ` after dropping stale ${popped.join(", ")} from the min-heap` : ""}`, items: show(), popped, side: "max-heap shown" }); }
      }
      return { kind: "stack", title: "StockPrice with lazy-deletion heaps", frames };
    },
  },

  "number-of-subarrays-with-bounded-maximum": {
    approach: "For each right end, count starts after the last value > right and up to the last value in [left, right].",
    idea: ["A valid subarray cannot contain anything above right and must contain something in [left, right].", "Track bad = last index with nums > right and good = last index with nums in range.", "Subarrays ending at i that work start in (bad, good], which is good - bad of them when good > bad."],
    code: `def numSubarrayBoundedMax(nums, left, right):
    bad = good = -1
    ans = 0
    for i, x in enumerate(nums):
        if x > right:
            bad = i
        if left <= x <= right:
            good = i
        ans += max(0, good - bad)
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 1, 4, 3], L = 2, R = 3, frames: CellsFrame[] = []; let bad = -1, good = -1, ans = 0;
      a.forEach((x, i) => { if (x > R) bad = i; if (x >= L && x <= R) good = i; const add = Math.max(0, good - bad); ans += add; frames.push({ note: `end ${i} (${x}): last too-big ${bad}, last in-range ${good} → +${add} (total ${ans})`, tones: { ...(add ? range(bad + 1, good) : {}), [`0:${i}`]: x > R ? "bad" : "active" } }); });
      return cells(`Subarrays with max in [${L}, ${R}]: ${ans}`, [a], frames);
    },
  },
};
