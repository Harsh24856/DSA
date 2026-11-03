// Hand-written solutions for the slugs listed under "batch4" in batches.json. See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { bin, levelTree, range, type TNode } from "../sim.ts";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const nums = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const grid = (title: string, R: number, C: number, frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead: nums(R), colHead: nums(C), frames });
const all = (keys: (string | number)[], t: Tone) => Object.fromEntries(keys.map((k) => [k, t])) as Record<string, Tone>;
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
const pad = (a: (string | number)[], n: number) => [...a, ...Array(n - a.length).fill("")];

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
      const g = [[3, 1, 2, 2], [1, 4, 4, 5], [2, 4, 2, 2], [2, 4, 2, 2]], key = (a: number[]) => a.join(","), rows = new Map<string, number>(), hit: Record<string, Tone> = {}; let ans = 0;
      const frames: TableFrame[] = [{ note: "Count every row as a tuple, then look each column up in that counter", cells: g }];
      g.forEach((r, i) => { const c = (rows.get(key(r)) || 0) + 1; rows.set(key(r), c); frames.push({ note: `row ${i} = (${key(r)}) is counted, now x${c}`, cells: g, tones: all(r.map((_, k) => `${i}:${k}`), c > 1 ? "found" : "active") }); });
      for (let j = 0; j < 4; j++) {
        const col = g.map((r) => r[j]), c = rows.get(key(col)) || 0, t: Record<string, Tone> = {}; ans += c;
        g.forEach((r, i) => { t[`${i}:${j}`] = "window"; if (key(r) === key(col)) r.forEach((_, k) => (t[`${i}:${k}`] = hit[`${i}:${k}`] = "found")); });
        frames.push({ note: `column ${j} = (${col.join(",")}) ${c ? `equals ${c} row${c === 1 ? "" : "s"}` : "equals no row"}, total ${ans}`, cells: g, tones: t });
      }
      frames.push({ note: `All four columns are looked up: ${ans} equal row and column pairs`, cells: g, tones: hit });
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
      const n = 36, k = 7, small: number[] = [], large: number[] = [], bot: (string | number)[] = [], cand = Array.from({ length: Math.floor(Math.sqrt(n)) }, (_, i) => i + 1);
      const frames: CellsFrame[] = [{ note: `Find the ${k}th smallest factor of ${n}: test i from 1 to the square root, ${cand.length}`, rows: [pad(cand, 9), pad([], 9)] }];
      for (const i of cand) { const ok = n % i === 0; bot.push(ok ? n / i : "-"); if (ok) { small.push(i); if (i !== n / i) large.push(n / i); } frames.push({ note: ok ? `${i} divides ${n}: small list gets ${i}${i !== n / i ? ` and large list gets ${n / i}` : ", its partner is itself so it is added once"}` : `${n} mod ${i} = ${n % i}, so ${i} is not a factor`, rows: [pad(cand, 9), pad(bot, 9)], tones: { [`0:${i - 1}`]: "active", [`1:${i - 1}`]: ok ? "found" : "bad" } }); }
      const back = [...large].reverse(), f = [...small, ...back], rows = [pad(f, 9), pad(f.map((_, c) => c + 1), 9)];
      frames.push({ note: `Small factors [${small.join(", ")}] then the large ones backwards [${back.join(", ")}] give [${f.join(", ")}]`, rows, tones: all(f.map((_, c) => `0:${c}`), "done") });
      frames.push({ note: `Factor number ${k} in that list is ${f[k - 1]}`, rows, tones: { ...all(f.map((_, c) => `0:${c}`), "done"), [`0:${k - 1}`]: "found", [`1:${k - 1}`]: "found" } });
      return cells(`Factor ${k} of ${n} is ${f[k - 1]}`, [pad(cand, 9), pad([], 9)], frames, ["i or factor", "n/i or rank"]);
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
      const letters = (x: number) => [...Array(26)].map((_, i) => ((x >> i) & 1 ? String.fromCharCode(97 + i) : "")).join(""), count = new Map<number, number>(), sets: string[] = words.map(() => "");
      const frames: CellsFrame[] = [{ note: `Turn each word into a letter-set mask and count them, then count the masks allowed by puzzle "${p}"`, rows: [words, [...sets]] }];
      words.forEach((w, k) => { count.set(m(w), (count.get(m(w)) || 0) + 1); sets[k] = letters(m(w)); frames.push({ note: `"${w}" has letter set {${sets[k]}}, so that mask is counted ${count.get(m(w))}`, rows: [words, [...sets]], tones: { ...range(0, k - 1, 0, "done"), [`0:${k}`]: "active" } }); });
      const first = m(p[0]), rest = m(p.slice(1)), rows = [words, sets]; let sub = rest, total = 0, tried = 0; const hit: string[] = [];
      frames.push({ note: `Puzzle "${p}": '${p[0]}' is in every subset, the other letters {${letters(rest)}} give ${2 ** letters(rest).length} submasks to try`, rows });
      for (;;) {
        tried++; const c = count.get(sub | first) || 0;
        if (c) { total += c; const cols = words.map((_, i) => i).filter((i) => m(words[i]) === (sub | first)); hit.push(...cols.map((i) => `0:${i}`)); frames.push({ note: `submask {${letters(sub | first)}} matches ${cols.map((i) => `"${words[i]}"`).join(", ")}, total ${total}`, rows, tones: { ...all(hit, "done"), ...all(cols.map((i) => `0:${i}`), "found") } }); }
        if (sub === 0) break; sub = (sub - 1) & rest;
      }
      frames.push({ note: `All ${tried} submasks are tried: ${total} words are valid for "${p}"`, rows, tones: all(hit, "found") });
      return cells(`Puzzle "${p}" → ${total}`, [words, words.map(() => "")], frames, ["word", "letters"]);
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
      const spec: [number, number][] = [[2, 2], [3, 3], [4, 7], [5, 4], [6, 11]], tasks = spec.flatMap(([d, c]) => Array(c).fill(d) as number[]), cnt = new Map<number, number>(); tasks.forEach((t) => cnt.set(t, (cnt.get(t) || 0) + 1));
      const ks = [...cnt.keys()], c = ks.map((k) => cnt.get(k)!), parts = (x: number) => { const twos = [0, 2, 1][x % 3]; return [...Array((x - 2 * twos) / 3).fill(3), ...Array(twos).fill(2)].join("+"); };
      const split: (string | null)[] = ks.map(() => null), r: (number | null)[] = ks.map(() => null), frames: TableFrame[] = [{ note: `Count the ${tasks.length} tasks by difficulty: ${ks.map((k, i) => `${c[i]} of level ${k}`).join(", ")}`, cells: [c, [...split], [...r]] }]; let ans = 0;
      ks.forEach((k, i) => { split[i] = parts(c[i]); r[i] = Math.ceil(c[i] / 3); ans += r[i]!; frames.push({ note: `level ${k}: ${c[i]} tasks split as ${split[i]}, which is ceil(${c[i]} / 3) = ${r[i]} round${r[i] === 1 ? "" : "s"} (total ${ans})`, cells: [c, [...split], [...r]], active: [2, i] }); });
      frames.push({ note: `No level has a single task, so all are possible: ${ans} rounds in total`, cells: [c, [...split], [...r]], tones: all(ks.map((_, i) => `2:${i}`), "found") });
      return { kind: "table", title: `Minimum rounds: ${ans}`, rowHead: ["tasks", "split", "rounds"], colHead: ks.map((k) => `level ${k}`), frames };
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
      const start = [1, 1], target = [5, 5], roads = [[1, 2, 3, 3, 2], [3, 4, 5, 5, 1], [1, 1, 4, 2, 5], [2, 2, 5, 4, 1]], pts: number[][] = [];
      const id = (x: number, y: number) => { let k = pts.findIndex((p) => p[0] === x && p[1] === y); if (k < 0) { pts.push([x, y]); k = pts.length - 1; } return k; };
      id(start[0], start[1]); roads.forEach(([a, b, c, d]) => { id(a, b); id(c, d); }); const T = id(target[0], target[1]), md = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]), ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
      const nodes = pts.map((p, i) => ({ id: i, label: i === 0 ? "S" : i === T ? "T" : `${p[0]},${p[1]}`, x: 10 + (p[0] - 1) * 20, y: 90 - (p[1] - 1) * 18 }));
      const dist = new Map<number, number>([[0, 0]]), prev = new Map<number, [number, string]>(), done = new Set<number>(), pq: [number, number][] = [[0, 0]], badges = () => Object.fromEntries([...dist].map(([k, d]) => [k, `d=${d}`])); let best = md(start, target), bestNode = 0;
      const frames: GraphFrame[] = [{ note: `Walking from S (1,1) to T (5,5) costs ${best}; Dijkstra over the road ends looks for something cheaper`, badges: badges() }];
      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]); const [d, u] = pq.shift()!; if (done.has(u)) continue; done.add(u);
        const walk = d + md(pts[u], target); if (walk < best) { best = walk; bestNode = u; } const et: Record<string, Tone> = {}, took: string[] = [];
        roads.forEach(([x1, y1, x2, y2, c]) => { const v = id(x2, y2), nd = d + md(pts[u], [x1, y1]) + c; if (nd < (dist.get(v) ?? 1e9)) { dist.set(v, nd); pq.push([nd, v]); prev.set(v, [u, ek(id(x1, y1), v)]); et[ek(id(x1, y1), v)] = "found"; took.push(`road (${x1},${y1}) to (${x2},${y2}) reaches ${nodes[v].label} at ${nd}`); } });
        frames.push({ note: `settle ${nodes[u].label} at ${d}; walking on to T would total ${walk} (best ${best})${took.length ? `; ${took.join("; ")}` : "; no road improves"}`, tones: { ...Object.fromEntries([...done].map((k) => [k, "done"])), [u]: "active" }, edgeTones: et, badges: badges() });
      }
      const pathN: number[] = [T], pathE: Record<string, Tone> = {}; for (let x: number | undefined = bestNode; x !== undefined; x = prev.get(x)?.[0]) { pathN.push(x); const e = prev.get(x); if (e) pathE[e[1]] = "found"; }
      frames.push({ note: `Cheapest cost from S to T: ${best}`, tones: all(pathN, "found"), edgeTones: pathE, badges: badges() });
      return { kind: "graph", title: `Start (1,1) to target (5,5): ${best}`, nodes, edges: roads.map(([x1, y1, x2, y2, c]) => ({ a: id(x1, y1), b: id(x2, y2), w: c, directed: true })), frames };
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
      const rc = [5, 4, 3, 6, 2], cc = [8, 2, 6, 7, 4, 3], [r0, c0] = [3, 1], [r1, c1] = [0, 4], seq = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
      const rows = r1 >= r0 ? seq(r0 + 1, r1) : seq(r1, r0 - 1), cols = c1 >= c0 ? seq(c0 + 1, c1) : seq(c1, c0 - 1), top = pad(rc, 6), marks = [{ i: r0, label: "start", row: 0 }, { i: r1, label: "home", row: 0 }, { i: c0, label: "start", row: 1 }, { i: c1, label: "home", row: 1 }];
      const seen: string[] = [], frames: CellsFrame[] = [{ note: `Robot at (${r0},${c0}) goes home to (${r1},${c1}): it pays rowCosts for rows ${rows.join(", ")} and colCosts for columns ${cols.join(", ")}`, rows: [top, cc], marks }]; let total = 0;
      rows.forEach((r) => { total += rc[r]; seen.push(`0:${r}`); frames.push({ note: `row ${r} lies between start and home: add rowCosts[${r}] = ${rc[r]} (total ${total})`, rows: [top, cc], tones: { ...all(seen, "found"), [`0:${r}`]: "active" }, marks }); });
      cols.forEach((c) => { total += cc[c]; seen.push(`1:${c}`); frames.push({ note: `column ${c} lies between start and home: add colCosts[${c}] = ${cc[c]} (total ${total})`, rows: [top, cc], tones: { ...all(seen, "found"), [`1:${c}`]: "active" }, marks }); });
      frames.push({ note: `Every row and column on the way is paid once: the robot needs ${total} to get home`, rows: [top, cc], tones: all(seen, "found"), marks });
      return cells(`Homecoming cost: ${total}`, [top, cc], frames, ["rowCosts", "colCosts"]);
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
      const s = [1, 3, 1, 2], n = s.length, MOD = 10 ** 9 + 7, left: (number | string)[] = Array(n).fill(""), right: (number | string)[] = Array(n).fill(""), st: number[] = [], rows = () => [s, [...left], [...right]];
      const frames: CellsFrame[] = [{ note: `Strengths [${s.join(", ")}]: find the span where each wizard is the minimum, then add up the subarray sums inside it`, rows: rows() }];
      s.forEach((x, i) => { const out: number[] = []; while (st.length && s[st[st.length - 1]] >= x) { const t = st.pop()!; right[t] = i; out.push(t); } left[i] = st.length ? st[st.length - 1] : -1; st.push(i); frames.push({ note: `index ${i} (${x}): ${out.length ? `pops index ${out.join(" and ")} because ${out.length > 1 ? "they are" : "it is"} >= ${x}, so their right edge is ${i}` : "nothing on the stack is >= it"}; previous smaller is ${left[i]}`, rows: rows(), tones: { [`0:${i}`]: "active", ...all(out.map((t) => `2:${t}`), "found") } }); });
      const rest = [...st]; rest.forEach((t) => (right[t] = n)); if (rest.length) frames.push({ note: `Indices ${rest.join(", ")} stay on the stack, so nothing smaller follows them: their right edge is ${n}`, rows: rows(), tones: all(rest.map((t) => `2:${t}`), "found") });
      const P = [0]; s.forEach((x) => P.push(P[P.length - 1] + x)); const PP = [0]; P.forEach((p) => PP.push(PP[PP.length - 1] + p));
      frames.push({ note: `Prefix sums P = [${P.join(", ")}] and their prefix sums PP = [${PP.join(", ")}] give any block of subarray sums in O(1)`, rows: rows() }); let ans = 0;
      s.forEach((x, i) => { const L = left[i] as number, R = right[i] as number, tot = (i - L) * (PP[R + 1] - PP[i + 1]) - (R - i) * (PP[i + 1] - PP[L + 1]); ans += x * tot; frames.push({ note: `${x} at ${i} is the minimum of subarrays inside (${L}, ${R}); their sums add to ${tot}, so it adds ${x} x ${tot} = ${x * tot} (total ${ans})`, rows: rows(), tones: { ...range(L + 1, R - 1), [`0:${i}`]: "active" } }); });
      frames.push({ note: `Sum of all wizards' total strengths is ${ans % MOD} (mod ${MOD})`, rows: rows(), tones: range(0, n - 1, 0, "found") });
      return cells(`Total strength of [${s.join(", ")}] = ${ans % MOD}`, [s, Array(n).fill(""), Array(n).fill("")], frames, ["strength", "prev smaller", "next smaller"]);
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
      const v = [1, 3, 4, 7, 1, 2, 6, 5, 8], n = v.length, next = v.map((_, i) => (i + 1 < n ? i + 1 : -1)), frames: ListFrame[] = []; let slow = 0, fast = 2;
      const ptrs = () => [{ i: slow, label: "slow" }, ...(fast < n ? [{ i: fast, label: "fast" }] : [])];
      frames.push({ note: `Delete the middle of ${n} nodes: slow starts at the head and fast two nodes ahead`, next: [...next], ptrs: ptrs() });
      while (fast < n && fast + 1 < n) { slow++; fast += 2; frames.push({ note: `fast has a next node, so slow moves to index ${slow} and fast jumps to ${fast < n ? `index ${fast}` : "null"}`, next: [...next], ptrs: ptrs(), tones: { [slow]: "active" } }); }
      const mid = slow + 1; frames.push({ note: `fast (index ${fast}) has no next node, so the loop stops; slow.next, index ${mid} with value ${v[mid]}, is the middle`, next: [...next], ptrs: ptrs(), tones: { [slow]: "active", [mid]: "bad" } });
      next[slow] = next[mid]; next[mid] = -1; frames.push({ note: `Set slow.next to the node after the middle, so ${v[mid]} is skipped`, next: [...next], ptrs: [{ i: slow, label: "slow" }], tones: { [slow]: "found", [mid]: "bad" } });
      const kept: number[] = []; for (let x = 0; x !== -1; x = next[x]) kept.push(x);
      frames.push({ note: `List after the deletion: ${kept.map((x) => v[x]).join(" → ")}`, next: [...next], ptrs: [{ i: 0, label: "head" }], tones: all(kept, "found") });
      return { kind: "list", title: `Delete the middle of ${v.join(" → ")}`, values: v, frames };
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
      const vals = [5, 4, 9, 1, 10, null, 7, 2, 3, 6, null, null, null, 8], { nodes, kids } = levelTree(vals), labels: Record<number, string> = { 0: "0" }, frames: TreeFrame[] = [{ note: "Replace every value with the sum of its cousins, one level at a time" }];
      const val = (c: number) => vals[c] as number; frames.push({ note: "The root has no cousins, so it becomes 0", tones: { 0: "found" }, labels: { ...labels } });
      let level = [0];
      while (level.length) {
        const nxt = level.flatMap((p) => kids[p].filter((c): c is number => c != null)), total = nxt.reduce((a, c) => a + val(c), 0); if (!nxt.length) break;
        level.forEach((p) => { const ks = kids[p].filter((c): c is number => c != null); if (!ks.length) return; const sib = ks.reduce((a, c) => a + val(c), 0); ks.forEach((c) => (labels[c] = String(total - sib))); frames.push({ note: `next level totals ${total}; the children of ${val(p)} sum to ${sib}, so each becomes ${total} - ${sib} = ${total - sib}`, tones: { ...all(nxt, "window"), ...all(ks, "found"), [p]: "active" }, labels: { ...labels } }); });
        level = nxt;
      }
      frames.push({ note: "Every node now holds the sum of its cousins", tones: all(nodes.map((x) => x.id), "found"), labels: { ...labels } });
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
      const s = "(x)+(y)=(z)", k: Record<string, string> = { x: "2", y: "3" }, W = s.length, out: string[] = [], row = [...s]; let i = 0;
      const frames: CellsFrame[] = [{ note: `Replace each (key) in "${s}" with its value from knowledge (x = 2, y = 3), or ? when the key is unknown`, rows: [row, pad([], W)] }];
      while (i < s.length) {
        if (s[i] === "(") { const j = s.indexOf(")", i), key = s.slice(i + 1, j), known = key in k, v = known ? k[key] : "?"; out.push(v); frames.push({ note: `"(${key})" spans ${i} to ${j}: ${known ? `knowledge says ${key} is ${v}` : `${key} is not in knowledge, so write ?`}, output "${out.join("")}"`, rows: [row, pad([...out.join("")], W)], tones: { ...range(i, j, 0, known ? "found" : "bad"), [`1:${out.join("").length - 1}`]: known ? "found" : "bad" } }); i = j + 1; }
        else { out.push(s[i]); frames.push({ note: `'${s[i]}' at ${i} is not a bracket, copy it: output "${out.join("")}"`, rows: [row, pad([...out.join("")], W)], tones: { [`0:${i}`]: "done", [`1:${out.join("").length - 1}`]: "done" } }); i++; }
      }
      frames.push({ note: `Scan finished: "${s}" becomes "${out.join("")}"`, rows: [row, pad([...out.join("")], W)], tones: range(0, out.join("").length - 1, 1, "found") });
      return cells(`"${s}" → "${out.join("")}"`, [row, pad([], W)], frames, ["s", "output"]);
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
      let a = [1, 3, 5, 7, 9, 2]; const N = a.length, rows: number[][] = [[...a]], pn = (r: number[]) => [...r, ...Array(N - r.length).fill(null)], view = () => [...rows.map(pn), ...Array.from({ length: N - rows.length }, () => Array(N).fill(null))];
      const frames: TableFrame[] = [{ note: `Start with [${a.join(", ")}]: replace it by neighbour sums mod 10 until one number is left`, cells: view(), tones: range(0, N - 1, 0, "active") }];
      while (a.length > 1) { const prev = a; a = prev.slice(1).map((x, i) => (prev[i] + x) % 10); rows.push([...a]); frames.push({ note: `row ${rows.length - 1}: ${prev.slice(1).map((x, i) => `${prev[i]}+${x}=${a[i]}`).join(", ")} (sums mod 10)`, cells: view(), active: [rows.length - 1, 0], deps: [[rows.length - 2, 0], [rows.length - 2, 1]] }); }
      frames.push({ note: `One number is left, ${a[0]}: that is the triangular sum`, cells: view(), tones: { [`${N - 1}:0`]: "found" } });
      return { kind: "table", title: `Triangular sum: ${a[0]}`, rowHead: nums(N), colHead: nums(N), frames };
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
      const s0 = "abbaabba", x = 4, y = 5, frames: StackFrame[] = []; let total = 0;
      const strip = (s: string, a: string, b: string, pts: number) => { const st: string[] = []; [...s].forEach((ch, i) => { if (st.length && st[st.length - 1] === a && ch === b) { st.pop(); total += pts; frames.push({ note: `index ${i}: '${ch}' lands on '${a}', so remove "${a}${b}" for ${pts} (score ${total}, stack "${st.join("")}")`, items: [...st], incoming: ch, popped: [a + b], side: `pass "${a}${b}"` }); } else { st.push(ch); frames.push({ note: `index ${i}: push '${ch}' (stack "${st.join("")}")`, items: [...st], incoming: ch, side: `pass "${a}${b}"` }); } }); return st.join(""); };
      const [a1, b1, p1] = x >= y ? ["a", "b", x] as const : ["b", "a", y] as const, [a2, b2, p2] = x >= y ? ["b", "a", y] as const : ["a", "b", x] as const;
      const left = strip(s0, a1, b1, p1); frames.push({ note: `The ${p1}-point pair "${a1}${b1}" is done first and leaves "${left}", now remove "${a2}${b2}" worth ${p2}`, items: [...left], side: `score ${total}` });
      const rest = strip(left, a2, b2, p2); frames.push({ note: `Nothing more can be removed from "${rest}": the maximum score is ${total}`, items: [...rest], side: `score ${total}` });
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
      const a = 13, b = 22, c = 57, w = 8, rows = [bin(a, w), bin(b, w), bin(c, w)], frames: CellsFrame[] = [{ note: `Flip the fewest bits so that a OR b equals c (a = ${a}, b = ${b}, c = ${c}); each bit is independent, so go from the right`, rows }]; let ans = 0;
      for (let k = 0; (a >> k) | (b >> k) | (c >> k); k++) {
        const x = (a >> k) & 1, y = (b >> k) & 1, z = (c >> k) & 1, cost = z === 0 ? x + y : 1 - (x | y), col = w - 1 - k; ans += cost;
        const why = z === 0 ? (cost ? `c wants 0, so flip ${x && y ? "both 1s" : "the 1"}: ${cost} flip${cost === 1 ? "" : "s"}` : "c wants 0 and both are 0: no flip") : x | y ? "c wants 1 and one side already has it: no flip" : "c wants 1 but both are 0: flip one, 1 flip";
        frames.push({ note: `bit ${k}: a=${x}, b=${y}, c=${z}, ${why} (total ${ans})`, rows, tones: { [`2:${col}`]: "active", ...(cost ? { [`0:${col}`]: x ? "bad" : "window", [`1:${col}`]: y ? "bad" : "window" } : { [`0:${col}`]: "found", [`1:${col}`]: "found" }) } });
      }
      frames.push({ note: `All set bits are checked: ${ans} flips make a OR b equal c`, rows, tones: range(0, w - 1, 2, "found") });
      return cells(`a=${a}, b=${b}, c=${c}: ${ans} flips`, rows, frames, ["a", "b", "c"]);
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
      const n = 10, edges = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [3, 7], [7, 8], [7, 9]], restricted = [2, 7], pos = [[50, 10], [20, 35], [50, 35], [80, 35], [8, 62], [32, 62], [50, 62], [80, 62], [68, 90], [92, 90]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const seen = new Set([...restricted, 0]), st = [0], got: number[] = [], wall = all(restricted, "bad"), frames: GraphFrame[] = [{ note: `Restricted nodes ${restricted.join(" and ")} start out as walls, then a DFS runs from node 0`, tones: wall }];
      while (st.length) { const u = st.pop()!; got.push(u); const add = g[u].filter((v) => !seen.has(v)), blocked = g[u].filter((v) => restricted.includes(v)); add.forEach((v) => { seen.add(v); st.push(v); }); frames.push({ note: `pop ${u}, count ${got.length}${add.length ? `; push ${add.join(", ")}` : "; no new neighbours"}${blocked.length ? `; restricted ${blocked.join(", ")} skipped` : ""}`, tones: { ...wall, ...all(got, "found"), [u]: "active" } }); }
      frames.push({ note: `The stack is empty: ${got.length} nodes are reachable (${[...got].sort((p, q) => p - q).join(", ")})`, tones: { ...wall, ...all(got, "found") } });
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
      const anc: number[][] = Array.from({ length: n }, () => []), bd = () => Object.fromEntries(anc.map((a, i) => [i, a.join(",")]).filter(([, b]) => b)), frames: GraphFrame[] = [{ note: "Search forward from every node in order 0, 1, 2, ...; each node reached gets the start added to its ancestor list" }];
      for (let s = 0; s < n; s++) {
        const st = [s], seen = new Set([s]); while (st.length) { const u = st.pop()!; for (const v of g[u]) if (!seen.has(v)) { seen.add(v); anc[v].push(s); st.push(v); } }
        const reach = [...seen].filter((v) => v !== s).sort((p, q) => p - q);
        frames.push({ note: reach.length ? `DFS from ${s} reaches ${reach.join(", ")}, so ${s} joins each of their ancestor lists` : `DFS from ${s} reaches nothing, so no list changes`, tones: { ...all(reach, "found"), [s]: "active" }, badges: bd() });
      }
      frames.push({ note: `All ${n} searches are done and every list is already sorted: ${anc.map((a, i) => `${i}:[${a.join(",")}]`).join(" ")}`, tones: all(nodes.map((x) => x.id), "found"), badges: bd() });
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
      const n1 = [0, 0, 0, 0, 0, 0], n2 = [4, 9, 1, 7, 2, 8], k1 = 9, k2 = 5, raw = n1.map((x, i) => Math.abs(x - n2[i])), d = [...raw].sort((x, y) => y - x); let k = k1 + k2; const frames: CellsFrame[] = [{ note: `Differences |a - b| are [${raw.join(", ")}]; k1 + k2 = ${k1} + ${k2} = ${k} units can shave them`, rows: [raw] }];
      frames.push({ note: `Sorted high to low: [${d.join(", ")}], because shaving the biggest differences cuts the sum of squares most`, rows: [[...d]] });
      frames.push({ note: `The sum of differences is ${d.reduce((a, b) => a + b, 0)}, more than ${k}, so they cannot all reach 0`, rows: [[...d]] });
      d.push(0); let i = 0;
      while ((i + 1) * (d[i] - d[i + 1]) <= k) { const c = (i + 1) * (d[i] - d[i + 1]); k -= c; frames.push({ note: `lower the top ${i + 1} from ${d[i]} to ${d[i + 1]}: costs ${i + 1} x ${d[i] - d[i + 1]} = ${c}, k left ${k}`, rows: [[...d.slice(0, i + 1).map(() => d[i + 1]), ...d.slice(i + 1, -1)]], tones: range(0, i) }); i++; }
      const q = Math.floor(k / (i + 1)), r = k % (i + 1), level = d[i] - q, fin = [...Array(r).fill(level - 1), ...Array(i + 1 - r).fill(level), ...d.slice(i + 1, -1)], ans = fin.reduce((s, x) => s + x * x, 0);
      frames.push({ note: `next level costs ${(i + 1) * (d[i] - d[i + 1])}, more than ${k} left: spread ${k} over the top ${i + 1}, so ${r} end at ${level - 1} and ${i + 1 - r} at ${level}`, rows: [fin], tones: range(0, i, 0, "found") });
      frames.push({ note: `Sum of squares: ${fin.map((x) => `${x}²`).join(" + ")} = ${ans}`, rows: [fin], tones: range(0, fin.length - 1, 0, "found") });
      return cells(`Minimum sum of squared difference: ${ans}`, [raw], frames, ["|a - b|"]);
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
      const n = 9, edges = [[0, 1], [0, 2], [1, 2], [3, 4], [3, 5], [3, 6], [4, 5], [7, 8]], pos = [[15, 12], [5, 48], [28, 48], [65, 12], [50, 48], [80, 48], [92, 12], [15, 82], [40, 82]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const seen = Array(n).fill(false), frames: GraphFrame[] = [{ note: "A component is complete when every node has degree size - 1; find each component with DFS and check" }], tones: Record<number, Tone> = {}; let ans = 0;
      for (let s = 0; s < n; s++) {
        if (seen[s]) continue; seen[s] = true; const comp: number[] = [], st = [s];
        while (st.length) { const u = st.pop()!; comp.push(u); for (const v of g[u]) if (!seen[v]) { seen[v] = true; st.push(v); } }
        comp.sort((p, q) => p - q); frames.push({ note: `DFS from ${s} collects the component {${comp.join(", ")}} of size ${comp.length}, so each node needs degree ${comp.length - 1}`, tones: { ...tones, ...all(comp, "window") }, badges: Object.fromEntries(comp.map((u) => [u, `deg ${g[u].length}`])) });
        const bad = comp.filter((u) => g[u].length !== comp.length - 1), ok = !bad.length; if (ok) ans++; comp.forEach((u) => (tones[u] = ok ? "found" : "bad"));
        frames.push({ note: ok ? `every node of {${comp.join(", ")}} has degree ${comp.length - 1}, so it is complete (count ${ans})` : `node ${bad[0]} has degree ${g[bad[0]].length}, not ${comp.length - 1}, so {${comp.join(", ")}} is not complete (count ${ans})`, tones: { ...tones }, badges: Object.fromEntries(comp.map((u) => [u, `deg ${g[u].length}`])) });
      }
      frames.push({ note: `All nodes are visited: ${ans} of the components are complete`, tones: { ...tones } });
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
      const orig = [24, 36, 10, 15, 25], euclid = (a: number, b: number) => { const s: string[] = []; while (b) { s.push(`${a} mod ${b} = ${a % b}`); [a, b] = [b, a % b]; } return { s, g: a }; };
      const values: (string | number)[] = [], next: number[] = [], frames: ListFrame[] = [];
      orig.forEach((v, i) => { values.push(v); if (i < orig.length - 1) values.push(""); }); values.forEach((_, i) => next.push(i % 2 === 0 && i + 2 < values.length ? i + 2 : -1));
      const muted = (from: number) => Object.fromEntries(values.map((_, k) => k).filter((k) => k % 2 && k > from).map((k) => [k, "muted"])) as Record<number, Tone>;
      frames.push({ note: `Original list ${orig.join(" → ")}: put the gcd of each neighbouring pair between them`, next: [...next], values: [...values], ptrs: [{ i: 0, label: "node" }], tones: muted(-1) });
      for (let i = 0; i + 2 < values.length; i += 2) { const a = orig[i / 2], b = orig[i / 2 + 1], { s, g } = euclid(a, b); values[i + 1] = g; next[i] = i + 1; next[i + 1] = i + 2; frames.push({ note: `gcd(${a}, ${b}): ${s.join(", ")} gives ${g}; link ${g} between them and jump to ${b}`, next: [...next], values: [...values], ptrs: [{ i: i + 2, label: "node" }], tones: { [i + 1]: "found", ...muted(i + 1) } }); }
      frames.push({ note: `node.next is null after ${orig[orig.length - 1]}, so the walk ends with ${orig.length - 1} gcd nodes inserted`, next: [...next], values: [...values], ptrs: [{ i: values.length - 1, label: "node" }], tones: all(values.map((_, k) => k).filter((k) => k % 2), "found") });
      return { kind: "list", title: `${orig.join(" → ")} with GCDs inserted`, values: orig.flatMap((v, i) => (i < orig.length - 1 ? [v, ""] : [v])), frames };
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
      const cards = [1, 1, 3, 9], fmt = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2)), frames: StackFrame[] = [{ note: `Combine two of ${cards.join(", ")} at a time with + - x /, trying to finish on 24`, items: [...cards], side: "4 numbers" }], path: string[] = [];
      const solve = (ns: number[]): boolean => {
        if (ns.length === 1) return Math.abs(ns[0] - 24) < 1e-6;
        for (let i = 0; i < ns.length; i++) for (let j = 0; j < ns.length; j++) {
          if (i === j) continue; const rest = ns.filter((_, k) => k !== i && k !== j), a = ns[i], b = ns[j], ops: [string, number][] = [["+", a + b], ["-", a - b], ["x", a * b]]; if (Math.abs(b) > 1e-6) ops.push(["/", a / b]);
          for (const [o, x] of ops) { const nx = [...rest, x], e = `${fmt(a)} ${o} ${fmt(b)} = ${fmt(x)}`, leaf = nx.length === 1, hit = leaf && Math.abs(x - 24) < 1e-6; frames.push({ note: leaf ? `${e}: ${hit ? "that is 24" : "not 24, back up and try the next option"}` : `${e}, ${nx.length} numbers left`, items: nx.map(fmt), incoming: fmt(x), side: leaf ? (hit ? "24 reached" : "dead end") : `${nx.length} numbers left` }); if (solve(nx)) { path.unshift(e); return true; } }
        }
        return false;
      };
      const ok = solve(cards); frames.push({ note: `Steps that reach 24: ${path.join(", ")}`, items: [24], side: "24 reached" });
      return { kind: "stack", title: `[${cards.join(", ")}] can make 24: ${ok}`, frames };
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
      const sorted = [[5, 4], [6, 4], [6, 7], [2, 3], [7, 5], [3, 5], [4, 6], [8, 9]].sort((x, y) => x[0] - y[0] || y[1] - x[1]), row = sorted.map(([w, h]) => `${w},${h}`), n = sorted.length, tails: number[] = [];
      const frames: CellsFrame[] = [{ note: `Sort ${n} envelopes by width, taller first when widths tie, then find the longest strictly increasing run of heights`, rows: [row, pad([], n)] }];
      sorted.forEach(([, h], k) => { let lo = 0, hi = tails.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < h) lo = mid + 1; else hi = mid; } const grow = lo === tails.length, old = tails[lo]; if (grow) tails.push(h); else tails[lo] = h; frames.push({ note: `envelope ${row[k]}: height ${h} lands at position ${lo} of the tails, ${grow ? `past the end so append, length ${tails.length}` : `replacing ${old} with ${h} keeps the ends small`}`, rows: [row, pad(tails, n)], tones: { [`0:${k}`]: "active", [`1:${lo}`]: "found" } }); });
      frames.push({ note: `The tails hold ${tails.length} heights: at most ${tails.length} envelopes nest`, rows: [row, pad(tails, n)], tones: range(0, tails.length - 1, 1, "found") });
      return cells(`Most nested envelopes: ${tails.length}`, [row, pad([], n)], frames, ["sorted", "tails"]);
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
      const cap = [2, 3, 4, 5, 6, 7], rocks = [1, 2, 4, 4, 2, 6], gap = cap.map((c, i) => c - rocks[i]), ord = cap.map((_, i) => i).sort((x, y) => gap[x] - gap[y] || x - y), rows = [ord.map((i) => cap[i]), ord.map((i) => rocks[i]), ord.map((i) => gap[i])]; let left = 3, full = 0;
      const frames: CellsFrame[] = [{ note: `Each bag is missing capacity - rocks (${gap.join(", ")}); with ${left} extra rocks, fill the smallest gaps first`, rows: [cap, rocks, gap] }];
      frames.push({ note: `Sort the bags by gap: ${rows[2].join(", ")}`, rows });
      for (let i = 0; i < ord.length; i++) {
        if (gap[ord[i]] > left) { frames.push({ note: `gap ${gap[ord[i]]} is more than the ${left} rocks left, so stop`, rows, tones: { ...range(0, i - 1, 2, "found"), [`2:${i}`]: "bad" } }); break; }
        left -= gap[ord[i]]; full++; frames.push({ note: `fill the bag missing ${gap[ord[i]]}: ${left} rocks left, ${full} bag${full === 1 ? "" : "s"} full`, rows, tones: { ...range(0, i - 1, 2, "found"), [`2:${i}`]: "active" } });
      }
      frames.push({ note: `${full} bags can be filled to capacity`, rows, tones: range(0, full - 1, 2, "found") });
      return cells(`Full bags: ${full}`, [cap, rocks, gap], frames, ["capacity", "rocks", "gap"]);
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
      const H = [[1, 4, 3, 1, 3], [3, 2, 1, 3, 2], [2, 3, 3, 2, 3], [3, 1, 4, 2, 1]], m = 4, n = 5, seen = H.map((r) => r.map(() => false)), pq: [number, number, number][] = [], tones: Record<string, Tone> = {}, show: (string | number)[][] = H.map((r) => [...r]), frames: TableFrame[] = []; let water = 0;
      H.forEach((row, r) => row.forEach((h, c) => { if (r === 0 || r === m - 1 || c === 0 || c === n - 1) { pq.push([h, r, c]); seen[r][c] = true; tones[`${r}:${c}`] = "done"; } }));
      frames.push({ note: "Every border cell goes into the min-heap: water inside can only rise to the lowest wall around it", cells: show.map((r) => [...r]), tones: { ...tones } });
      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); const [h, r, c] = pq.shift()!;
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (nr >= 0 && nr < m && nc >= 0 && nc < n && !seen[nr][nc]) { seen[nr][nc] = true; const w = Math.max(0, h - H[nr][nc]); water += w; tones[`${nr}:${nc}`] = w ? "found" : "window"; if (w) show[nr][nc] = `${H[nr][nc]}+${w}`; pq.push([Math.max(h, H[nr][nc]), nr, nc]); frames.push({ note: `pop wall ${h} at (${r},${c}): neighbour (${nr},${nc}) has height ${H[nr][nc]} and holds ${w}, so it joins the heap at ${Math.max(h, H[nr][nc])} (water ${water})`, cells: show.map((x) => [...x]), active: [nr, nc], tones: { ...tones } }); }
      }
      frames.push({ note: `Every inner cell is processed: ${water} units of water are trapped`, cells: show.map((x) => [...x]), tones: { ...tones } });
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
      const s = "1101100101", pos = [...s].map((c, i) => (c === "1" ? i : -1)).filter((i) => i >= 0), t = pos.length / 3, g1 = pos[t] - pos[t - 1], g2 = pos[2 * t] - pos[2 * t - 1], ones = all(pos.map((p) => `0:${p}`), "found"), frames: CellsFrame[] = [];
      const cut = (a: number, b: number) => { const parts = [s.slice(0, a + 1), s.slice(a + 1, b + 1), s.slice(b + 1)]; return { text: parts.join(" | "), tones: { ...ones, ...range(0, a, 0, "done"), ...range(a + 1, b, 0, "window"), ...range(b + 1, s.length - 1, 0, "active") } as Record<string, Tone> }; };
      frames.push({ note: `Cut "${s}" into 3 parts holding the same number of ones; it has ${pos.length} ones at ${pos.join(", ")}`, tones: ones });
      frames.push({ note: `${pos.length} is divisible by 3, so every part must hold ${t} ones`, tones: ones });
      frames.push({ note: `The first cut sits after the ${t}th one (index ${pos[t - 1]}) and before the next one (index ${pos[t]}): ${g1} choices`, tones: { ...ones, ...range(pos[t - 1] + 1, pos[t] - 1, 0, "active") } });
      frames.push({ note: `The second cut sits after the ${2 * t}th one (index ${pos[2 * t - 1]}) and before the next one (index ${pos[2 * t]}): ${g2} choices`, tones: { ...ones, ...range(pos[2 * t - 1] + 1, pos[2 * t] - 1, 0, "active") } });
      const e = cut(pos[t - 1], pos[2 * t - 1]), l = cut(pos[t] - 1, pos[2 * t] - 1);
      frames.push({ note: `Earliest cuts give ${e.text}, each part has ${t} ones`, tones: e.tones });
      frames.push({ note: `Latest cuts give ${l.text}, still ${t} ones per part`, tones: l.tones });
      frames.push({ note: `The two cuts are independent: ${g1} x ${g2} = ${g1 * g2} ways`, tones: { ...ones, ...range(pos[t - 1] + 1, pos[t] - 1, 0, "found"), ...range(pos[2 * t - 1] + 1, pos[2 * t] - 1, 0, "found") } });
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
      const p = [5, 4, 3, 2, 6, 5, 4, 8], frames: CellsFrame[] = [{ note: `Count periods where each day is exactly 1 lower than the day before, in prices [${p.join(", ")}]`, rows: [p, pad([], p.length)] }], runs: (string | number)[] = Array(p.length).fill(""); let ans = 0, run = 0;
      p.forEach((x, i) => { run = i && p[i - 1] - x === 1 ? run + 1 : 1; ans += run; runs[i] = run; frames.push({ note: `day ${i} (${x}): ${run > 1 ? `exactly 1 below ${p[i - 1]}, so the run grows to ${run}` : i ? `${p[i - 1]} to ${x} is not a drop of 1, so the run restarts at 1` : "the first day starts a run of 1"}; ${run} period${run === 1 ? "" : "s"} end here (total ${ans})`, rows: [p, [...runs]], tones: range(i - run + 1, i) }); });
      frames.push({ note: `Every day is counted: ${ans} smooth descent periods`, rows: [p, [...runs]], tones: range(0, p.length - 1, 0, "found") });
      return cells(`Smooth descent periods: ${ans}`, [p, pad([], p.length)], frames, ["price", "run ending here"]);
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
      const n = 8, edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [6, 7]], values = [1, 4, 3, 6, 2, 2, 5, 13], k = 6, pos = [[50, 8], [25, 34], [75, 34], [10, 62], [38, 62], [62, 62], [90, 62], [90, 90]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(values[i]), x, y })), g: number[][] = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const frames: GraphFrame[] = [{ note: `Node labels are values; they total ${values.reduce((a, b) => a + b, 0)}, divisible by ${k}. Walk post-order and cut off any subtree whose sum is divisible by ${k}` }], tones: Record<number, Tone> = {}, badges: Record<number, string> = {}; let count = 0;
      const dfs = (u: number, p: number): number => { let s = values[u]; for (const v of g[u]) if (v !== p) s += dfs(v, u); const cut = s % k === 0; if (cut) count++; tones[u] = cut ? "found" : "done"; badges[u] = `sum ${s}`; frames.push({ note: `node ${u}: subtree sum ${s}${cut ? `, ${s} mod ${k} = 0, so cut it off and pass 0 up (components ${count})` : `, ${s} mod ${k} = ${s % k}, so pass ${s} up to the parent`}`, tones: { ...tones, [u]: "active" }, badges: { ...badges } }); return cut ? 0 : s; };
      dfs(0, -1); frames.push({ note: `The root is processed: ${count} components, each with a sum divisible by ${k}`, tones: { ...tones }, badges: { ...badges } });
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
      const votes = ["ABCD", "ACBD", "ABDC", "ACDB", "ADCB"], teams = [...votes[0]], n = teams.length, P = ["1st", "2nd", "3rd", "4th"], cnt = teams.map(() => Array(n).fill(0) as number[]), snap = () => cnt.map((r) => [...r]);
      const frames: TableFrame[] = [{ note: `Count how often each team gets each position over ${votes.length} votes, then rank by those counts`, cells: snap() }];
      votes.forEach((v, k) => { [...v].forEach((t, i) => cnt[teams.indexOf(t)][i]++); frames.push({ note: `vote ${k + 1} "${v}": ${[...v].map((t, i) => `${t} gets ${P[i]}`).join(", ")}`, cells: snap(), tones: Object.fromEntries([...v].map((t, i) => [`${teams.indexOf(t)}:${i}`, "active"])) as Record<string, Tone> }); });
      const cmp = (x: string, y: string) => { const a = cnt[teams.indexOf(x)], b = cnt[teams.indexOf(y)]; for (let i = 0; i < n; i++) if (a[i] !== b[i]) return { win: a[i] > b[i] ? x : y, why: `${i ? `tied on ${P.slice(0, i).join(", ")}; ` : ""}${P[i]}: ${x} has ${a[i]}, ${y} has ${b[i]}` }; return { win: x < y ? x : y, why: "tied everywhere, so alphabetical" }; };
      const order = [...teams];
      for (let i = 1; i < n; i++) for (let j = i; j > 0; j--) { const x = order[j - 1], y = order[j], { win, why } = cmp(x, y), swap = win === y; frames.push({ note: `compare ${x} and ${y}: ${why}, so ${win} ranks higher${swap ? ` and moves ahead of ${x}` : ""}`, cells: snap(), tones: { ...all(cnt[0].map((_, c) => `${teams.indexOf(x)}:${c}`), "window"), ...all(cnt[0].map((_, c) => `${teams.indexOf(y)}:${c}`), "active") } }); if (!swap) break; order[j - 1] = y; order[j] = x; }
      frames.push({ note: `Ranking by votes: ${order.join(", ")}`, cells: snap(), tones: { ...all(cnt[0].map((_, c) => `${teams.indexOf(order[0])}:${c}`), "found"), ...all(order.slice(1).flatMap((t) => cnt[0].map((_, c) => `${teams.indexOf(t)}:${c}`)), "done") } });
      return { kind: "table", title: `Ranking: "${order.join("")}"`, rowHead: teams, colHead: P, frames };
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
      const n = 5, k0 = 73; let k = k0; const row: string[] = Array(n).fill(""), frames: CellsFrame[] = [{ note: `Build a string of length ${n} with letter values adding to ${k0} that is smallest alphabetically; fill from the right`, rows: [pad([], n)] }];
      for (let i = n; i >= 1; i--) { const v = Math.min(26, k - (i - 1)); row[i - 1] = String.fromCharCode(96 + v); frames.push({ note: `position ${i - 1}: keep ${i - 1} for the earlier letters, so it takes min(26, ${k} - ${i - 1}) = ${v}, the letter '${row[i - 1]}' (${k - v} left)`, rows: [[...row]], tones: { [`0:${i - 1}`]: "active", ...range(i, n - 1, 0, "done") } }); k -= v; }
      frames.push({ note: `Every position is filled, reading left to right gives "${row.join("")}"`, rows: [[...row]], tones: range(0, n - 1, 0, "found") });
      return cells(`n = ${n}, k = ${k0}: "${row.join("")}"`, [pad([], n)], frames);
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
      const a = [1, 2, 3, 4, 6], qs = [[1, 0], [-3, 1], [-4, 0], [2, 3], [3, 4], [-2, 2]], out: number[] = []; let even = a.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0);
      const frames: CellsFrame[] = [{ note: `Keep the sum of the even values; at the start, ${a.filter((x) => x % 2 === 0).join(" + ")} = ${even}`, rows: [[...a]], tones: all(a.map((x, i) => (x % 2 === 0 ? `0:${i}` : "")).filter(Boolean), "found") }];
      qs.forEach(([v, i], q) => { const old = a[i]; if (old % 2 === 0) even -= old; a[i] += v; if (a[i] % 2 === 0) even += a[i]; out.push(even); frames.push({ note: `query ${q + 1}: nums[${i}] ${old} ${v < 0 ? "-" : "+"} ${Math.abs(v)} = ${a[i]}; ${old % 2 === 0 ? `remove old ${old}` : "old value was odd"}, ${a[i] % 2 === 0 ? `add new ${a[i]}` : "new value is odd"}, even sum ${even}`, rows: [[...a]], tones: { [`0:${i}`]: a[i] % 2 === 0 ? "found" : "active" } }); });
      frames.push({ note: `All ${qs.length} queries answered: [${out.join(", ")}]`, rows: [[...a]], tones: all(a.map((x, i) => (x % 2 === 0 ? `0:${i}` : "")).filter(Boolean), "found") });
      return cells(`Even sum after each query: ${out.join(", ")}`, [[1, 2, 3, 4, 6]], frames);
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
      const queens = [[0, 0], [1, 1], [2, 2], [3, 4], [3, 5], [4, 4], [4, 5]], king = [3, 3], N = 8, isQ = (r: number, c: number) => queens.some(([a, b]) => a === r && b === c), board = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (r === king[0] && c === king[1] ? "K" : isQ(r, c) ? "Q" : "")));
      const frames: TableFrame[] = [{ note: `King at (${king[0]},${king[1]}) with ${queens.length} queens: look outward in 8 directions, only the first queen met in each can attack`, cells: board, tones: { [`${king[0]}:${king[1]}`]: "active" } }], found: string[] = [];
      for (const dr of [-1, 0, 1]) for (const dc of [-1, 0, 1]) {
        if (!dr && !dc) continue; let r = king[0] + dr, c = king[1] + dc; const ray: string[] = []; let hit = "";
        while (r >= 0 && r < N && c >= 0 && c < N) { if (isQ(r, c)) { hit = `${r}:${c}`; found.push(hit); break; } ray.push(`${r}:${c}`); r += dr; c += dc; }
        frames.push({ note: `direction (${dr},${dc}): ${hit ? `${ray.length ? `${ray.length} empty square${ray.length === 1 ? "" : "s"}, then` : "right next to the king,"} a queen at (${hit.replace(":", ",")}) attacks` : ray.length ? `${ray.length} empty square${ray.length === 1 ? "" : "s"} to the edge, no queen` : "the edge is next to the king, no queen"}`, cells: board, tones: { ...all(found, "found"), ...all(ray, "window"), [`${king[0]}:${king[1]}`]: "active" } });
      }
      frames.push({ note: `All 8 directions are checked: ${found.length} queens attack the king`, cells: board, tones: { ...all(found, "found"), [`${king[0]}:${king[1]}`]: "active" } });
      return grid(`${found.length} queens attack the king`, N, N, frames);
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
      const words = ["aba", "bcb", "ece", "aa", "e", "xyz", "ibi", "ou"], qs = [[0, 2], [1, 4], [3, 7]], V = "aeiou", mark = words.map((w) => (V.includes(w[0]) && V.includes(w[w.length - 1]) ? 1 : 0)), pre = [0], n = words.length, out: number[] = [], shown: (string | number)[] = Array(n).fill("");
      const frames: CellsFrame[] = [{ note: `Mark words that start and end with a vowel, build prefix counts, then answer ${qs.length} range queries by subtraction`, rows: [words, pad([], n), [...shown]] }];
      words.forEach((w, i) => { pre.push(pre[i] + mark[i]); shown[i] = pre[i + 1]; frames.push({ note: `"${w}" ${mark[i] ? "starts and ends with a vowel" : "does not start and end with a vowel"}, so pre[${i + 1}] = pre[${i}] ${mark[i] ? "+ 1" : "+ 0"} = ${pre[i + 1]}`, rows: [words, mark.map((m, k) => (k <= i ? m : "")), [...shown]], tones: { [`0:${i}`]: mark[i] ? "found" : "muted", [`2:${i}`]: "active" } }); });
      const rows = [words, mark, [...shown]];
      qs.forEach(([l, r]) => { out.push(pre[r + 1] - pre[l]); frames.push({ note: `query [${l}, ${r}]: pre[${r + 1}] - pre[${l}] = ${pre[r + 1]} - ${pre[l]} = ${pre[r + 1] - pre[l]}`, rows, tones: { ...range(l, r), ...range(l, r, 2) } }); });
      frames.push({ note: `All queries answered: [${out.join(", ")}]`, rows, tones: all(mark.map((m, i) => (m ? `1:${i}` : "")).filter(Boolean), "found") });
      return cells(`Vowel strings in ranges: [${out.join(", ")}]`, [words, mark, pad([], n)], frames, ["word", "both ends vowel", "pre[i + 1]"]);
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
      const c = [26, 4, 17, 12, 30, 9], k = 12, frames: CellsFrame[] = []; let lo = 0, hi = Math.max(...c);
      frames.push({ note: `Give ${k} children the same number of candies from piles [${c.join(", ")}]; binary search the amount between ${lo} and ${hi}`, rows: [c, pad([], c.length)] });
      while (lo < hi) { const mid = Math.floor((lo + hi + 1) / 2), shares = c.map((x) => Math.floor(x / mid)), tot = shares.reduce((a, b) => a + b, 0), ok = tot >= k; frames.push({ note: `lo = ${lo}, hi = ${hi}, mid = ${mid}: piles give [${shares.join(", ")}] = ${tot} children ${ok ? `>= ${k}, enough, so lo = ${mid}` : `< ${k}, too few, so hi = ${mid - 1}`}`, rows: [c, shares], tones: all(c.map((_, i) => `1:${i}`), ok ? "found" : "bad") }); if (ok) lo = mid; else hi = mid - 1; }
      const fin = c.map((x) => (lo ? Math.floor(x / lo) : 0)); frames.push({ note: `lo = hi = ${lo}: ${lo} candies each is the most that works`, rows: [c, fin], tones: all(c.map((_, i) => `1:${i}`), "found") });
      return cells(`Most candies each for ${k} children: ${lo}`, [c, pad([], c.length)], frames, ["pile", "children fed"]);
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
      const a = [5, 4, 0, 3, 1, 6, 2, 8, 7], seen = Array(a.length).fill(false), frames: CellsFrame[] = [{ note: `Follow k to nums[k] from each unvisited index; ${a.length} indices form disjoint cycles, find the longest`, tones: {} }]; let best = 0;
      const dn = () => all(seen.map((v, k) => (v ? `0:${k}` : "")).filter(Boolean), "done");
      for (let s = 0; s < a.length; s++) {
        if (seen[s]) continue; let i = s, len = 0; const cyc: number[] = [];
        while (!seen[i]) { seen[i] = true; cyc.push(i); len++; const nx = a[i]; if (seen[nx]) best = Math.max(best, len); frames.push({ note: `start ${s}, step ${len}: mark index ${i} seen and jump to nums[${i}] = ${nx}${seen[nx] ? `, which is already seen, so the cycle has length ${len} (best ${best})` : ""}`, tones: { ...dn(), ...all(cyc.map((x) => `0:${x}`), "window"), [`0:${i}`]: "active" }, marks: [{ i: nx, label: "next" }] }); i = nx; }
      }
      frames.push({ note: `Every index belongs to one cycle: the longest has length ${best}`, tones: all(a.map((_, k) => `0:${k}`), "found") });
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
      const obs = [0, 1, 2, 3, 0, 3, 1, 0], dp: (number | null)[] = [1, 0, 1], rows: (number | null)[][] = [[], [], []], vals = () => dp.filter((x): x is number => x != null), frames: TableFrame[] = [];
      obs.forEach((o, p) => {
        const before = [...dp]; if (p > 0) { if (o) dp[o - 1] = null; const best = Math.min(...vals()); for (let l = 0; l < 3; l++) if (l !== o - 1) dp[l] = Math.min(dp[l] ?? 1e9, best + 1); }
        dp.forEach((v, l) => (rows[l][p] = v)); const full = rows.map((r) => [...r, ...Array(obs.length - r.length).fill(null)]), cheap = dp.indexOf(Math.min(...vals()));
        frames.push({ note: p === 0 ? "Start in lane 2 at point 0: lane 2 costs 0 jumps, lanes 1 and 3 cost one side jump each" : `point ${p}${o ? `: a rock blocks lane ${o}` : ": no rock"}; lanes cost [${dp.map((x) => (x == null ? "blocked" : x)).join(", ")}], ${before.some((x, l) => x !== dp[l]) ? "after allowing one side jump from the cheapest lane" : "no lane changes"}`, cells: full, tones: o ? { [`${o - 1}:${p}`]: "bad" } : {}, active: [cheap, p] });
      });
      const ans = Math.min(...vals()); frames.push({ note: `At the last point the cheapest lane needs ${ans} side jumps`, cells: rows.map((r) => [...r]), tones: { [`${dp.indexOf(ans)}:${obs.length - 1}`]: "found" } });
      return { kind: "table", title: `Fewest side jumps: ${ans}`, rowHead: ["lane 1", "lane 2", "lane 3"], colHead: nums(obs.length), frames };
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
      const s = "abc2d3", k0 = 10, sizes: number[] = [], frames: CellsFrame[] = [{ note: `Find letter ${k0} of the decoded form of "${s}" without building it: first measure the decoded length, then walk back`, rows: [[...s], pad([], s.length)] }]; let size = 0;
      [...s].forEach((ch, i) => { const prev = size; size = /\d/.test(ch) ? size * +ch : size + 1; sizes.push(size); frames.push({ note: `'${ch}' ${/\d/.test(ch) ? `repeats everything ${ch} times: ${prev} x ${ch} = ${size}` : `adds one letter: ${prev} + 1 = ${size}`}`, rows: [[...s], pad(sizes, s.length)], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" } }); });
      let k = k0, ans = "";
      for (let i = s.length - 1; i >= 0; i--) { const ch = s[i], was = k; k %= size; const hit = k === 0 && /[a-z]/.test(ch); frames.push({ note: `'${ch}' at ${i}: k = ${was} mod ${size} = ${k}${hit ? `, a letter with k = 0, so the answer is '${ch}'` : /\d/.test(ch) ? `; undo the x${ch}, size ${size} / ${ch} = ${size / +ch}` : `; drop the letter, size ${size} - 1 = ${size - 1}`}`, rows: [[...s], sizes], tones: { [`0:${i}`]: hit ? "found" : "active", [`1:${i}`]: "window" } }); if (hit) { ans = ch; break; } size = /\d/.test(ch) ? size / +ch : size - 1; }
      return cells(`decodeAtIndex("${s}", ${k0}) = '${ans}'`, [[...s], pad([], s.length)], frames, ["s", "size so far"]);
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
      const vals = [3, 9, 20, 4, 5, 15, 7, null, null, 8, null, null, null, null, 11], { nodes, kids } = levelTree(vals), frames: TreeFrame[] = [{ note: "Visit the tree level by level with a queue, then reverse the list of levels", tones: { 0: "window" } }], out: number[][] = [], done: number[] = [];
      let q = [0];
      while (q.length) {
        const level: number[] = [], cur = [...q]; q = [];
        cur.forEach((i, t) => { level.push(vals[i] as number); done.push(i); const ks = kids[i].filter((c): c is number => c != null); q.push(...ks); frames.push({ note: `level ${out.length}: pop ${vals[i]}${ks.length ? ` and queue its ${ks.length > 1 ? "children" : "child"} ${ks.map((c) => vals[c]).join(", ")}` : ", a leaf, nothing to queue"}${t === cur.length - 1 ? `; level ends as [${level.join(", ")}]` : ""}`, tones: { ...all(done, "done"), ...all(cur.slice(t + 1), "window"), ...all(q, "window"), [i]: "active" } }); });
        out.push(level);
      }
      frames.push({ note: `Reverse the ${out.length} levels, bottom first: ${JSON.stringify([...out].reverse())}`, tones: all(done, "found") });
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
      const b = [["#", ".", "#", ".", "*"], ["#", "#", "*", ".", "#"], ["#", ".", "#", ".", "."]], m = 3, n = 5, frames: TableFrame[] = [], pn = (g: string[][]) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => g[i]?.[j] ?? null)), snap = () => pn(b.map((r) => [...r]));
      frames.push({ note: "Slide the stones in each row to the right until an obstacle or the wall, then rotate the box clockwise", cells: snap() });
      b.forEach((row, i) => { let empty = n - 1; for (let j = n - 1; j >= 0; j--) { if (row[j] === "*") { empty = j - 1; frames.push({ note: `row ${i}, column ${j}: an obstacle, so stones to its left can only fall as far as column ${empty}`, cells: snap(), active: [i, j], tones: { [`${i}:${j}`]: "bad" } }); } else if (row[j] === "#") { const to = empty; row[j] = "."; row[to] = "#"; empty--; frames.push({ note: to === j ? `row ${i}, column ${j}: the stone is already against the right side, it stays` : `row ${i}, column ${j}: the stone slides right to column ${to}`, cells: snap(), active: [i, to], tones: { [`${i}:${to}`]: "found" } }); } } });
      const rot = Array.from({ length: n }, (_, j) => Array.from({ length: m }, (_, i) => b[m - 1 - i][j]));
      frames.push({ note: `Rotate clockwise: result[j][${m - 1} - i] = box[i][j], giving ${n} rows of ${m}`, cells: pn(rot), tones: Object.fromEntries(rot.flatMap((r, i) => r.map((v, j) => [`${i}:${j}`, v === "#" ? "found" : v === "*" ? "bad" : "muted"]))) as Record<string, Tone> });
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
      const p = [[1, 5], [10, 4], [4, 3], [4, 1], [2, 6], [7, 7], [7, 2], [3, 8]].sort((a, b) => b[0] - a[0] || a[1] - b[1]), row = p.map(([a, d]) => `${a},${d}`), frames: CellsFrame[] = [{ note: `Sort by attack high to low and defense low to high within a tie; anyone with defense below the best seen so far is weak`, tones: {} }]; let best = 0, weak = 0;
      p.forEach(([a, d], i) => { const w = d < best; if (w) weak++; frames.push({ note: `(${a},${d}): defense ${d} ${w ? `is below ${best}, held by someone with higher attack, so weak (${weak})` : `is not below ${best}, so not weak`}${d > best ? `; best defense becomes ${d}` : ""}`, tones: { ...all(row.slice(0, i).map((_, k) => `0:${k}`), "done"), [`0:${i}`]: w ? "bad" : "found" } }); best = Math.max(best, d); });
      frames.push({ note: `Everyone is checked: ${weak} weak characters`, tones: all(row.map((_, k) => `0:${k}`), "found") });
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
      const power = [1, 1, 3, 4, 5, 5, 6, 8, 9, 9], cnt = new Map<number, number>(); power.forEach((p) => cnt.set(p, (cnt.get(p) || 0) + 1));
      const vals = [...cnt.keys()].sort((a, b) => a - b), tot = vals.map((x) => x * cnt.get(x)!), n = vals.length, dp = Array(n + 1).fill(0), shown: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [{ note: `Spells [${power.join(", ")}]: casting damage v blocks v-2 to v+2, so group equal values and run a house-robber DP over the distinct ones`, rows: [vals, tot, [...shown]] }]; let j = 0;
      vals.forEach((v, i) => { while (vals[j] < v - 2) j++; const take = dp[j] + tot[i]; dp[i + 1] = Math.max(dp[i], take); shown[i] = dp[i + 1]; frames.push({ note: `damage ${v} (x${cnt.get(v)} = ${tot[i]}): take = ${tot[i]} + best below ${v - 2} (${dp[j]}) = ${take}, skip = ${dp[i]}, so best ${dp[i + 1]}`, rows: [vals, tot, [...shown]], tones: { [`0:${i}`]: "active", [`2:${i}`]: take > dp[i] ? "found" : "window", ...(j > 0 ? { [`2:${j - 1}`]: "done" } : {}) } }); });
      frames.push({ note: `All ${n} distinct damages are decided: the maximum total damage is ${dp[n]}`, rows: [vals, tot, [...shown]], tones: { [`2:${n - 1}`]: "found" } });
      return cells(`Maximum total damage: ${dp[n]}`, [vals, tot, pad([], n)], frames, ["damage", "value x count", "best so far"]);
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
      const jobs = [[5, 30], [2, 10], [8, 20], [4, 40], [10, 50]].sort((a, b) => a[0] - b[0]), workers = [9, 3, 6, 4, 10].sort((a, b) => a - b), jr = jobs.map(([d, p]) => `${d}:${p}`), n = jobs.length;
      const frames: CellsFrame[] = [{ note: "Sort jobs by difficulty and workers by ability; each worker takes the best profit among jobs they can do", rows: [jr, workers] }]; let best = 0, total = 0, i = 0;
      workers.forEach((w, k) => {
        while (i < n && jobs[i][0] <= w) { const was = best; best = Math.max(best, jobs[i][1]); frames.push({ note: `worker ${w} can do difficulty ${jobs[i][0]}: profit ${jobs[i][1]}, best ${best === was ? `stays ${best}` : `rises to ${best}`}`, rows: [jr, workers], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active", [`1:${k}`]: "window" } }); i++; }
        total += best; frames.push({ note: `worker ${w} earns the best profit ${best} (total ${total})`, rows: [jr, workers], tones: { ...range(0, i - 1, 0, "done"), [`1:${k}`]: "found" } });
      });
      frames.push({ note: `All ${workers.length} workers are assigned: total profit ${total}`, rows: [jr, workers], tones: range(0, workers.length - 1, 1, "found") });
      return cells(`Total profit: ${total}`, [jr, workers], frames, ["job d:p", "worker"]);
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
      const w = "education", n = w.length, cnt: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [{ note: `Count vowels over every substring of "${w}": a vowel at index i sits in (i + 1) x (n - i) substrings`, rows: [[...w], [...cnt]] }]; let total = 0;
      [...w].forEach((ch, i) => { const v = "aeiou".includes(ch), c = (i + 1) * (n - i); if (v) { total += c; cnt[i] = c; } frames.push({ note: v ? `'${ch}' at ${i} is a vowel: ${i + 1} starts x ${n - i} ends = ${c} substrings (total ${total})` : `'${ch}' at ${i} is not a vowel, adds nothing (total ${total})`, rows: [[...w], [...cnt]], tones: v ? { ...range(0, n - 1, 0, "window"), [`0:${i}`]: "found", [`1:${i}`]: "found" } : { [`0:${i}`]: "muted" } }); });
      frames.push({ note: `Every letter is checked: ${total} vowels across all substrings`, rows: [[...w], [...cnt]], tones: all([...w].map((ch, i) => ("aeiou".includes(ch) ? `1:${i}` : "")).filter(Boolean), "found") });
      return cells(`Vowels over all substrings of "${w}": ${total}`, [[...w], pad([], n)], frames, ["letter", "substrings with it"]);
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
      const n = 10, a = Array.from({ length: n }, (_, i) => 2 * i + 1), frames: CellsFrame[] = [{ note: `The array [${a.join(", ")}] sums to ${a.reduce((s, x) => s + x, 0)}, so every element must become ${n}; pair smallest with largest` }]; let total = 0;
      for (let i = 0; i < n / 2; i++) { const need = n - a[i]; total += need; frames.push({ note: `pair ${a[i]} with ${a[n - 1 - i]}: ${a[i]} needs ${need} more and ${a[n - 1 - i]} gives away ${a[n - 1 - i] - n}, so ${need} moves (total ${total})`, tones: { [`0:${i}`]: "active", [`0:${n - 1 - i}`]: "active", ...range(0, i - 1, 0, "done"), ...range(n - i, n - 1, 0, "done") } }); }
      frames.push({ note: `n² // 4 = ${n * n} // 4 = ${Math.floor((n * n) / 4)}, the same ${total}`, tones: range(0, n - 1, 0, "found") });
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
      const a = [1, 2, 0, 4, 1, 3, 0, 1], n = a.length, B = 3, last = Array(B).fill(0), out: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [{ note: `For each start, the shortest subarray reaching every bit that appears at or after it; scan from the right keeping the nearest index of each of ${B} bits`, rows: [a, [...out]] }];
      for (let i = n - 1; i >= 0; i--) { const set: number[] = []; for (let b = 0; b < B; b++) if ((a[i] >> b) & 1) { last[b] = i; set.push(b); } const far = Math.max(...last); out[i] = Math.max(1, far - i + 1); frames.push({ note: `i = ${i} (${a[i]}): ${set.length ? `bits ${set.join(", ")} move to index ${i}` : "no bits set here"}; nearest indices are [${last.join(", ")}], so reach ${Math.max(i, far)} and the length is ${out[i]}`, rows: [a, [...out]], tones: { ...range(i, Math.max(i, far)), [`0:${i}`]: "active", [`1:${i}`]: "found" } }); }
      frames.push({ note: `Every start is answered: [${out.join(", ")}]`, rows: [a, [...out]], tones: range(0, n - 1, 1, "found") });
      return cells(`Smallest max-OR subarrays: [${out.join(", ")}]`, [a, pad([], n)], frames, ["nums", "shortest length"]);
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
      const n = 10, edges = [[0, 2], [0, 5], [2, 4], [1, 6], [5, 4], [3, 8], [8, 9]], pos = [[12, 10], [70, 10], [38, 10], [10, 68], [38, 38], [12, 38], [92, 10], [88, 68], [36, 68], [62, 68]];
      const nodes = pos.map(([x, y], i) => ({ id: i, label: String(i), x, y })), parent = Array.from({ length: n }, (_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
      const frames: GraphFrame[] = [{ note: `Union the ${edges.length} edges, then count pairs between different components: a component of size s adds s x (nodes seen before)` }], et: Record<string, Tone> = {};
      edges.forEach(([a, b]) => { const same = find(a) === find(b); parent[find(a)] = find(b); et[ek(a, b)] = same ? "muted" : "found"; frames.push({ note: same ? `edge ${a}-${b}: ${a} and ${b} are already in the same set, nothing to merge` : `edge ${a}-${b}: different sets, so merge them`, tones: { [a]: "active", [b]: "active" }, edgeTones: { ...et } }); });
      const comps = new Map<number, number[]>(); for (let x = 0; x < n; x++) comps.set(find(x), [...(comps.get(find(x)) || []), x]);
      const done: number[] = []; let ans = 0, seen = 0;
      comps.forEach((xs) => { ans += xs.length * seen; frames.push({ note: `component {${xs.join(", ")}} of size ${xs.length} pairs with the ${seen} nodes before it: +${xs.length * seen} (total ${ans})`, tones: { ...all(done, "done"), ...all(xs, "found") }, edgeTones: { ...et } }); seen += xs.length; done.push(...xs); });
      frames.push({ note: `${comps.size} components, and ${ans} pairs of nodes cannot reach each other`, tones: all(done, "found"), edgeTones: { ...et } });
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
      const s = "10100110", frames: CellsFrame[] = [{ note: `Move every 0 to the left of every 1 with adjacent swaps; each 0 must pass all the 1s on its left`, tones: {} }]; let ones = 0, steps = 0;
      [...s].forEach((ch, i) => { if (ch === "1") { ones++; frames.push({ note: `index ${i} is a black ball (1): ${ones} black ${ones === 1 ? "ball" : "balls"} seen so far`, tones: { ...all([...s].map((c, k) => (c === "1" && k < i ? `0:${k}` : "")).filter(Boolean), "window"), [`0:${i}`]: "active" } }); } else { steps += ones; frames.push({ note: `index ${i} is a white ball (0): it passes ${ones} black ball${ones === 1 ? "" : "s"}, steps = ${steps}`, tones: { [`0:${i}`]: "found", ...all([...s].map((c, k) => (c === "1" && k < i ? `0:${k}` : "")).filter(Boolean), "bad") } }); } });
      frames.push({ note: `The scan ends: ${steps} swaps in total`, tones: range(0, s.length - 1, 0, "found") });
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
      const s = "ababa", n = s.length, left: (number | string)[] = Array(n).fill(""), right: (number | string)[] = Array(n).fill(""), seen = new Set<string>(), frames: CellsFrame[] = [], rows = () => [[...s], [...left], [...right]];
      const first = (i: number) => (i === 0 ? `Count distinct letters in every prefix, every suffix, then the cuts where they match. ` : "");
      [...s].forEach((ch, i) => { seen.add(ch); left[i] = seen.size; frames.push({ note: `${first(i)}prefix "${s.slice(0, i + 1)}" has ${seen.size} distinct letter${seen.size === 1 ? "" : "s"}`, rows: rows(), tones: { ...range(0, i), [`1:${i}`]: "active" } }); });
      seen.clear(); for (let i = n - 1; i >= 0; i--) { seen.add(s[i]); right[i] = seen.size; frames.push({ note: `suffix "${s.slice(i)}" has ${seen.size} distinct letter${seen.size === 1 ? "" : "s"}`, rows: rows(), tones: { ...range(i, n - 1), [`2:${i}`]: "active" } }); }
      let good = 0; const hit: string[] = [];
      for (let i = 0; i < n - 1; i++) { const ok = left[i] === right[i + 1]; if (ok) { good++; hit.push(`0:${i}`); } frames.push({ note: `cut after ${i}: "${s.slice(0, i + 1)}" has ${left[i]}, "${s.slice(i + 1)}" has ${right[i + 1]}, ${ok ? "equal, a good split" : "not equal"} (good ${good})`, rows: rows(), tones: { ...range(0, i, 0, ok ? "found" : "window"), [`1:${i}`]: "active", [`2:${i + 1}`]: "active" } }); }
      frames.push({ note: `All ${n - 1} cuts are compared: ${good} good split${good === 1 ? "" : "s"}`, rows: rows(), tones: all(hit, "found") });
      return cells(`Good splits of "${s}": ${good}`, [[...s], pad([], n), pad([], n)], frames, ["s", "distinct in prefix", "distinct in suffix"]);
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
      const s = "codeishere", sp = [4, 6], frames: CellsFrame[] = [{ note: `Insert a space before each index in ${JSON.stringify(sp)} of "${s}" using one pointer into the list`, tones: {} }], out: string[] = []; let j = 0;
      [...s].forEach((ch, i) => { const add = j < sp.length && sp[j] === i; if (add) { out.push(" "); j++; } out.push(ch); frames.push({ note: add ? `index ${i} equals spaces[${j - 1}] = ${i}: emit a space, then '${ch}' → "${out.join("")}"` : `index ${i}: ${j < sp.length ? `next space is at ${sp[j]}, not ${i}` : "no spaces are left"}, copy '${ch}' → "${out.join("")}"`, tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: add ? "found" : "active" } }); });
      frames.push({ note: `The whole string is copied: "${out.join("")}"`, tones: { ...range(0, s.length - 1, 0, "done"), ...all(sp.map((x) => `0:${x}`), "found") } });
      return cells(`"${s}" → "${out.join("")}"`, [[...s]], frames);
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
      const raw = [60, 7, 5, 80, 6, 9, 70, 8], a = [...raw].sort((x, y) => x - y), n = a.length, frames: CellsFrame[] = [{ note: `With 3 moves you can set any 3 values equal to others, so keep the tightest ${n - 3} values; more than 4 numbers, so sort first`, rows: [raw] }]; let best = 1e9;
      frames.push({ note: `Sorted: [${a.join(", ")}]; dropping i smallest and 3 - i largest leaves a window from a[i] to a[${n - 4} + i]`, rows: [a] });
      for (let i = 0; i < 4; i++) { const d = a[n - 4 + i] - a[i]; best = Math.min(best, d); frames.push({ note: `drop ${i} smallest and ${3 - i} largest: keep [${i}..${n - 4 + i}], range ${a[n - 4 + i]} - ${a[i]} = ${d} (best ${best})`, rows: [a], tones: { ...range(i, n - 4 + i, 0, "found"), ...range(0, i - 1, 0, "muted"), ...range(n - 3 + i, n - 1, 0, "muted") } }); }
      frames.push({ note: `The four options are compared: the smallest range after 3 moves is ${best}`, rows: [a], tones: range(0, n - 1, 0, "found") });
      return cells(`Smallest range after 3 moves: ${best}`, [raw], frames);
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
      const a = [2, 1, 4, 2, 3, 1, 5, 3], L = 2, R = 3, frames: CellsFrame[] = [{ note: `Count subarrays of [${a.join(", ")}] whose maximum is in [${L}, ${R}]: track the last value above ${R} and the last value in range`, tones: {} }]; let bad = -1, good = -1, ans = 0;
      a.forEach((x, i) => { if (x > R) bad = i; if (x >= L && x <= R) good = i; const add = Math.max(0, good - bad); ans += add; frames.push({ note: `end ${i} (${x}): last too-big index ${bad}, last in-range index ${good}, so ${add ? `${add} start${add === 1 ? "" : "s"} work` : "no start works"} (total ${ans})`, tones: { ...(add ? range(bad + 1, good, 0, "window") : {}), [`0:${i}`]: x > R ? "bad" : "active" } }); });
      frames.push({ note: `Every right end is counted: ${ans} subarrays have a maximum in [${L}, ${R}]`, tones: range(0, a.length - 1, 0, "found") });
      return cells(`Subarrays with max in [${L}, ${R}]: ${ans}`, [a], frames);
    },
  },
};
