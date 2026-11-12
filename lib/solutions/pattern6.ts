// Hand-written solutions for questions added to the newer pattern lists (lib/patterns/deep/*.problems.ts). See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, StackFrame, TableFrame, Tone } from "../diagram";
import type { Solution } from "./types";

const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const node = (id: number, label: string, x: number, y: number) => ({ id, label, x, y });
const all = (keys: (string | number)[], t: Tone) => Object.fromEntries(keys.map((k) => [k, t])) as Record<string, Tone>;

export const PATTERN6: Record<string, Solution> = {
  "kth-ancestor-of-a-tree-node": {
    approach: "Binary lifting: up[j][v] is the 2^j-th ancestor of v, built as two jumps of 2^(j-1); a query jumps once per set bit of k.",
    idea: ["Row 0 of the table is the parent array.", "The 2^j-th ancestor is the 2^(j-1)-th ancestor of the 2^(j-1)-th ancestor, so each row comes from the row above in one pass (-1 stays -1).", "k is a sum of powers of two, so walk its bits from low to high and jump by up[j] for every set bit j.", "Falling off the root (-1) at any point means the node has fewer than k ancestors."],
    code: `class TreeAncestor:
    def __init__(self, n, parent):
        self.up = [parent[:]]
        for _ in range(n.bit_length() - 1):
            prev = self.up[-1]
            self.up.append([-1 if p == -1 else prev[p] for p in prev])

    def getKthAncestor(self, node, k):
        j = 0
        while k and node != -1:
            if k & 1:
                node = self.up[j][node]
            k >>= 1
            j += 1
        return node`,
    lang: "python", time: "O(n log n) to build, O(log k) per query", space: "O(n log n)",
    viz: () => {
      const parent = [-1, 0, 0, 1, 3, 4, 5, 6, 2], n = parent.length, L = n.toString(2).length, up: number[][] = [parent.slice()];
      for (let j = 1; j < L; j++) up.push(up[j - 1].map((p) => (p === -1 ? -1 : up[j - 1][p])));
      const shown = (rows: number) => up.map((r, j) => (j < rows ? r.slice() : r.map(() => null)));
      const frames: TableFrame[] = [{ note: `parent = [${parent.join(", ")}]. Row up[0] is the parent array; row j will hold the 2^j-th ancestor of every node`, cells: shown(1), tones: all(parent.map((_, v) => `0:${v}`), "window") }];
      for (let j = 1; j < L; j++) {
        const v = 7, mid = up[j - 1][v];
        frames.push({ note: `Row ${j} = jump ${2 ** (j - 1)} twice. For node ${v}: up[${j - 1}][${v}] = ${mid}${mid === -1 ? ", already past the root, so -1" : `, then up[${j - 1}][${mid}] = ${up[j][v]}`}`, cells: shown(j + 1), active: [j, v], deps: mid === -1 ? [[j - 1, v]] : [[j - 1, v], [j - 1, mid]] });
      }
      const res: number[] = [];
      for (const [start, k0] of [[7, 5], [8, 3]]) {
        let v = start, k = k0, j = 0;
        frames.push({ note: `getKthAncestor(${start}, ${k0}): ${k0} is ${k0.toString(2)} in binary, so jump once for each set bit, starting from node ${start}`, cells: shown(L) });
        while (k && v !== -1) {
          if (k & 1) { const to = up[j][v]; frames.push({ note: `Bit ${j} is set: up[${j}][${v}] = ${to}, a jump of ${2 ** j}${to === -1 ? ", which leaves the tree" : ""}`, cells: shown(L), active: [j, v], tones: to === -1 ? { [`${j}:${v}`]: "bad" } : undefined }); v = to; }
          else frames.push({ note: `Bit ${j} is 0: no jump of ${2 ** j}, stay on node ${v}`, cells: shown(L) });
          k >>= 1; j++;
        }
        res.push(v);
        frames.push({ note: v === -1 ? `Node ${start} has fewer than ${k0} ancestors, so the answer is -1` : `All bits used: the ${k0}th ancestor of ${start} is ${v}`, cells: shown(L), tones: v === -1 ? undefined : { [`0:${v}`]: "found" } });
      }
      return { kind: "table", title: `Ancestors: (7, 5) → ${res[0]}, (8, 3) → ${res[1]}`, rowHead: up.map((_, j) => `up[${j}]`), colHead: parent.map((_, v) => String(v)), frames };
    },
  },

  "minimum-edge-weight-equilibrium-queries-in-a-tree": {
    approach: "Root the tree, keep per-node counts of each weight on the path from the root, and use binary lifting LCA: path counts are cnt[a] + cnt[b] - 2 cnt[lca].",
    idea: ["Weights are 1 to 26, so every node stores 26 counts: how often each weight appears from the root down to it.", "Binary lifting gives the lowest common ancestor of a and b in O(log n): lift the deeper one to the same depth, then lift both while their ancestors differ.", "The a to b path uses the counts cnt[a] + cnt[b] - 2 cnt[lca] for each weight.", "Keep the most common weight and change the rest: answer = path length - the largest count."],
    code: `def minOperationsQueries(n, edges, queries):
    g = [[] for _ in range(n)]
    for u, v, w in edges:
        g[u].append((v, w))
        g[v].append((u, w))
    LOG = max(1, n.bit_length())
    up = [[0] * n for _ in range(LOG)]
    depth = [0] * n
    cnt = [[0] * 27 for _ in range(n)]
    seen = [False] * n
    seen[0] = True
    stack = [0]
    while stack:
        u = stack.pop()
        for v, w in g[u]:
            if not seen[v]:
                seen[v] = True
                up[0][v], depth[v] = u, depth[u] + 1
                cnt[v] = cnt[u][:]
                cnt[v][w] += 1
                stack.append(v)
    for j in range(1, LOG):
        for v in range(n):
            up[j][v] = up[j - 1][up[j - 1][v]]

    def lca(a, b):
        if depth[a] < depth[b]:
            a, b = b, a
        d = depth[a] - depth[b]
        for j in range(LOG):
            if d >> j & 1:
                a = up[j][a]
        if a == b:
            return a
        for j in range(LOG - 1, -1, -1):
            if up[j][a] != up[j][b]:
                a, b = up[j][a], up[j][b]
        return up[0][a]

    out = []
    for a, b in queries:
        l = lca(a, b)
        c = [cnt[a][w] + cnt[b][w] - 2 * cnt[l][w] for w in range(27)]
        out.append(sum(c) - max(c))
    return out`,
    lang: "python", time: "O((n + q) (log n + 26))", space: "O(n (log n + 26))",
    viz: () => {
      const n = 8, E: [number, number, number][] = [[1, 2, 6], [1, 3, 4], [2, 4, 6], [2, 5, 3], [3, 6, 6], [3, 0, 8], [7, 0, 2]], Q = [[4, 6], [0, 4], [6, 5], [7, 4]];
      const nodes = [[50, 8], [25, 50], [25, 71], [40, 29], [12, 92], [38, 92], [55, 50], [75, 29]].map(([x, y], id) => node(id, String(id), x, y));
      const g: [number, number][][] = nodes.map(() => []); E.forEach(([u, v, w]) => { g[u].push([v, w]); g[v].push([u, w]); });
      const LOG = n.toString(2).length, up = Array.from({ length: LOG }, () => Array(n).fill(0)), depth = Array(n).fill(0), cnt = nodes.map(() => Array(27).fill(0)), seen = Array(n).fill(false), frames: GraphFrame[] = [];
      const fmt = (c: number[]) => c.map((x, w) => (x ? `w${w}:${x}` : "")).filter(Boolean).join(" ") || "none";
      const done: Record<number, Tone> = {}, badges: Record<number, string> = {};
      seen[0] = true; const stack = [0];
      while (stack.length) {
        const u = stack.pop()!; done[u] = "done"; badges[u] = `d${depth[u]}`;
        for (const [v, w] of g[u]) if (!seen[v]) { seen[v] = true; up[0][v] = u; depth[v] = depth[u] + 1; cnt[v] = cnt[u].slice(); cnt[v][w]++; stack.push(v); }
        frames.push({ note: `Root at 0. Visit ${u} at depth ${depth[u]}: weights on the path from 0 are ${fmt(cnt[u])}`, tones: { ...done, [u]: "active" }, badges: { ...badges } });
      }
      for (let j = 1; j < LOG; j++) for (let v = 0; v < n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
      const lca = (a: number, b: number) => {
        if (depth[a] < depth[b]) [a, b] = [b, a];
        const d = depth[a] - depth[b]; for (let j = 0; j < LOG; j++) if ((d >> j) & 1) a = up[j][a];
        if (a === b) return a;
        for (let j = LOG - 1; j >= 0; j--) if (up[j][a] !== up[j][b]) { a = up[j][a]; b = up[j][b]; }
        return up[0][a];
      };
      frames.push({ note: `Build up[j][v] = up[j - 1][up[j - 1][v]] for ${LOG} levels, so any ancestor is a few jumps away`, tones: { ...done }, badges: { ...badges } });
      const res: number[] = [];
      for (const [a, b] of Q) {
        const l = lca(a, b), c = cnt[a].map((x, w) => x + cnt[b][w] - 2 * cnt[l][w]), len = c.reduce((s, x) => s + x, 0), top = Math.max(...c), best = c.indexOf(top), et: Record<string, Tone> = {};
        for (const s of [a, b]) for (let x = s; x !== l; x = up[0][x]) et[ek(x, up[0][x])] = "window";
        res.push(len - top);
        frames.push({ note: `Query (${a}, ${b}): LCA is ${l}. Path weights ${fmt(c)} over ${len} edges; keep w${best} (${top} times) and change ${len - top}`, tones: { [a]: "active", [b]: "active", [l]: "found" }, edgeTones: et, badges: { ...badges } });
      }
      return { kind: "graph", title: `Queries → [${res.join(", ")}]`, nodes, edges: E.map(([a, b, w]) => ({ a, b, w })), frames };
    },
  },

  "minimum-number-of-days-to-disconnect-island": {
    approach: "The answer is at most 2 (cut off a corner cell); it is 0 if the grid is not one island, and 1 if one island has an articulation point (Tarjan) or a single cell.",
    idea: ["Any island of 2 or more cells has a corner cell with at most 2 land neighbours, so removing those 2 neighbours always works: the answer is never above 2.", "Run one DFS from any land cell. If it misses some land, there are already 2 islands: 0 days.", "During that DFS keep disc (visit time) and low (earliest visit time reachable through one back edge). A non-root cell u is a cut point when a child v has low[v] >= disc[u]; the root is one when it has 2 or more DFS children.", "A cut point, or a single land cell, means 1 day. Otherwise 2."],
    code: `import sys
def minDays(grid):
    sys.setrecursionlimit(10000)
    m, n = len(grid), len(grid[0])
    land = [(r, c) for r in range(m) for c in range(n) if grid[r][c]]
    if not land:
        return 0
    disc, low = {}, {}
    cut = False

    def dfs(u, parent):
        nonlocal cut
        disc[u] = low[u] = len(disc)
        children = 0
        r, c = u
        for v in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= v[0] < m and 0 <= v[1] < n and grid[v[0]][v[1]]:
                if v not in disc:
                    children += 1
                    dfs(v, u)
                    low[u] = min(low[u], low[v])
                    if parent is not None and low[v] >= disc[u]:
                        cut = True
                elif v != parent:
                    low[u] = min(low[u], disc[v])
        if parent is None and children > 1:
            cut = True

    dfs(land[0], None)
    if len(disc) < len(land):
        return 0
    if len(land) == 1 or cut:
        return 1
    return 2`,
    lang: "python", time: "O(m n)", space: "O(m n)",
    viz: () => {
      const G = [[1, 1, 0, 0], [1, 1, 1, 1], [0, 0, 1, 1]], m = G.length, n = G[0].length, frames: CellsFrame[] = [], disc = new Map<string, number>(), low = new Map<string, number>(), cuts = new Set<string>();
      const K = (r: number, c: number) => `${r}:${c}`;
      const view = () => G.map((row, r) => row.map((x, c) => (!x ? "" : disc.has(K(r, c)) ? `${disc.get(K(r, c))}/${low.get(K(r, c))}` : "1")));
      const tones = (extra: Record<string, Tone> = {}) => { const t: Record<string, Tone> = {}; G.forEach((row, r) => row.forEach((x, c) => { if (!x) t[K(r, c)] = "muted"; else if (cuts.has(K(r, c))) t[K(r, c)] = "bad"; else if (disc.has(K(r, c))) t[K(r, c)] = "done"; })); return { ...t, ...extra }; };
      const land = G.flatMap((row, r) => row.map((x, c) => (x ? [r, c] : null)).filter((p): p is number[] => !!p));
      frames.push({ note: `${land.length} land cells. One DFS records disc/low in each cell: disc is the visit time, low the earliest time reachable with one back edge`, rows: view(), tones: tones() });
      const dfs = (r: number, c: number, pr: number, pc: number) => {
        const u = K(r, c); disc.set(u, disc.size); low.set(u, disc.get(u)!); let children = 0;
        frames.push({ note: `Visit (${r}, ${c}) at time ${disc.get(u)}`, rows: view(), tones: tones({ [u]: "active" }) });
        for (const [vr, vc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
          if (vr < 0 || vr >= m || vc < 0 || vc >= n || !G[vr][vc]) continue;
          const v = K(vr, vc);
          if (!disc.has(v)) {
            children++; dfs(vr, vc, r, c); low.set(u, Math.min(low.get(u)!, low.get(v)!));
            if (pr >= 0 && low.get(v)! >= disc.get(u)!) { cuts.add(u); frames.push({ note: `Back at (${r}, ${c}): child (${vr}, ${vc}) has low ${low.get(v)} >= disc ${disc.get(u)}, so nothing below it reaches above (${r}, ${c}). It is a cut cell`, rows: view(), tones: tones({ [v]: "window" }) }); }
          } else if (vr !== pr || vc !== pc) {
            const before = low.get(u)!; low.set(u, Math.min(before, disc.get(v)!));
            if (low.get(u)! < before) frames.push({ note: `(${r}, ${c}) sees (${vr}, ${vc}), visited at time ${disc.get(v)}, through a back edge: low becomes ${low.get(u)}`, rows: view(), tones: tones({ [u]: "active", [v]: "window" }) });
          }
        }
        if (pr < 0 && children > 1) cuts.add(u);
      };
      dfs(land[0][0], land[0][1], -1, -1);
      const ans = disc.size < land.length ? 0 : land.length === 1 || cuts.size ? 1 : 2;
      frames.push({ note: `The DFS reached all ${land.length} cells, so it is one island. ${cuts.size ? `Cut cells ${[...cuts].map((k) => `(${k.replace(":", ", ")})`).join(" and ")} exist, so removing one of them takes 1 day` : "No cut cell, so 2 days"}`, rows: view(), tones: tones() });
      return cells(`minDays = ${ans}`, G, frames);
    },
  },

  "maximum-employees-to-be-invited-to-a-meeting": {
    approach: "favorite is a functional graph: peel off the trees with Kahn's algorithm (recording the longest chain into each node), then the leftover nodes are cycles.",
    idea: ["Each person points to one favourite, so every component is one cycle with trees hanging into it.", "Repeatedly remove people nobody (left) likes, as in topological sort; while doing so, chain[v] = the longest line of people that ends at v.", "What remains are the cycles. A cycle of 3 or more must sit at the table alone, in its own order: it seats its length.", "A pair that like each other (cycle of 2) can each bring their longest chain, and all such pairs fit at one table together: they seat the sum of 2 + chain[a] + chain[b].", "Answer = max(largest long cycle, total over all pairs)."],
    code: `from collections import deque
def maximumInvitations(favorite):
    n = len(favorite)
    indeg = [0] * n
    for f in favorite:
        indeg[f] += 1
    chain = [0] * n
    q = deque(i for i in range(n) if indeg[i] == 0)
    while q:
        u = q.popleft()
        v = favorite[u]
        chain[v] = max(chain[v], chain[u] + 1)
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)
    big = pairs = 0
    for i in range(n):
        if indeg[i]:
            length, j = 0, i
            while indeg[j]:
                indeg[j] = 0
                length += 1
                j = favorite[j]
            if length == 2:
                pairs += 2 + chain[i] + chain[favorite[i]]
            else:
                big = max(big, length)
    return max(big, pairs)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const fav = [1, 0, 0, 2, 1, 6, 7, 5, 3], n = fav.length;
      const nodes = [[35, 40], [55, 40], [22, 58], [12, 76], [45, 75], [80, 12], [95, 45], [78, 70], [5, 95]].map(([x, y], id) => node(id, String(id), x, y));
      const indeg = Array(n).fill(0); fav.forEach((f) => indeg[f]++);
      const chain = Array(n).fill(0), gone: Record<number, Tone> = {}, frames: GraphFrame[] = [];
      const bd = () => Object.fromEntries(chain.map((c, i) => [i, `c${c}`])) as Record<number, string>;
      const q = indeg.map((d, i) => (d === 0 ? i : -1)).filter((i) => i >= 0);
      frames.push({ note: `Each person points to their favourite. Nobody likes ${q.join(", ")}, so they start the peel; badge c = longest chain ending here`, tones: all(q, "window"), badges: bd() });
      while (q.length) {
        const u = q.shift()!, v = fav[u]; chain[v] = Math.max(chain[v], chain[u] + 1); indeg[v]--; gone[u] = "done";
        if (indeg[v] === 0) q.push(v);
        frames.push({ note: `Peel ${u}: chain[${v}] = ${chain[v]}${indeg[v] === 0 ? `, and now nobody left likes ${v}, so it joins the queue` : ""}`, tones: { ...gone, [u]: "active", [v]: "window" }, edgeTones: { [ek(u, v)]: "done" }, badges: bd() });
      }
      let big = 0, pairs = 0;
      for (let i = 0; i < n; i++) {
        if (!indeg[i]) continue;
        const cyc: number[] = []; let j = i; while (indeg[j]) { indeg[j] = 0; cyc.push(j); j = fav[j]; }
        const et = Object.fromEntries(cyc.map((x) => [ek(x, fav[x]), "found"])) as Record<string, Tone>;
        if (cyc.length === 2) { const add = 2 + chain[i] + chain[fav[i]]; pairs += add; frames.push({ note: `Cycle ${cyc.join(" ↔ ")} is a pair: they sit together with their chains, 2 + ${chain[i]} + ${chain[fav[i]]} = ${add} people`, tones: { ...gone, ...all(cyc, "found") }, edgeTones: et, badges: bd() }); }
        else { big = Math.max(big, cyc.length); frames.push({ note: `Cycle ${cyc.join(" → ")} has length ${cyc.length}: it fills a table alone, with no room for chains`, tones: { ...gone, ...all(cyc, "found") }, edgeTones: et, badges: bd() }); }
      }
      const ans = Math.max(big, pairs);
      frames.push({ note: `Pairs seat ${pairs}, the longest cycle seats ${big}: invite ${ans}`, tones: gone, badges: bd() });
      return { kind: "graph", title: `maximumInvitations = ${ans}`, nodes, edges: fav.map((b, a) => ({ a, b, directed: true })), frames };
    },
  },

  "minimum-cost-to-make-at-least-one-valid-path-in-a-grid": {
    approach: "0-1 BFS: moving the way a cell's arrow points costs 0, any other way costs 1, so push 0-cost moves to the front of a deque and 1-cost moves to the back.",
    idea: ["Treat every cell as a node with 4 edges: weight 0 along its arrow, weight 1 for the other three (changing the sign once).", "With only weights 0 and 1, a deque replaces Dijkstra's heap: a 0 edge keeps the same distance, so it goes to the front; a 1 edge goes to the back.", "The deque then always pops cells in order of distance, so the first time the bottom-right cell is popped its cost is final.", "Skip a popped entry whose distance is already worse than the best known (it is a stale copy)."],
    code: `from collections import deque
def minCost(grid):
    m, n = len(grid), len(grid[0])
    dirs = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    dist = [[float("inf")] * n for _ in range(m)]
    dist[0][0] = 0
    dq = deque([(0, 0, 0)])
    while dq:
        d, r, c = dq.popleft()
        if d > dist[r][c]:
            continue
        if (r, c) == (m - 1, n - 1):
            return d
        for k, (dr, dc) in enumerate(dirs):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n:
                w = 0 if grid[r][c] == k + 1 else 1
                if d + w < dist[nr][nc]:
                    dist[nr][nc] = d + w
                    if w:
                        dq.append((d + 1, nr, nc))
                    else:
                        dq.appendleft((d, nr, nc))
    return dist[m - 1][n - 1]`,
    lang: "python", time: "O(m n)", space: "O(m n)",
    viz: () => {
      const G = [[1, 1, 1, 1], [2, 2, 2, 2], [1, 1, 1, 1]], m = G.length, n = G[0].length, arrow = ["", "→", "←", "↓", "↑"], dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const dist = G.map((row) => row.map(() => Infinity)), frames: CellsFrame[] = [], settled = new Set<string>();
      const view = () => G.map((row, r) => row.map((a, c) => (dist[r][c] === Infinity ? arrow[a] : `${arrow[a]}${dist[r][c]}`)));
      const tones = (extra: Record<string, Tone> = {}) => ({ ...all([...settled], "done"), ...extra });
      dist[0][0] = 0; const dq: [number, number, number][] = [[0, 0, 0]]; let ans = -1;
      frames.push({ note: "Each cell shows its arrow and, once known, its best cost. Following an arrow is free, any other move costs 1. Start at (0, 0) with cost 0", rows: view(), tones: { "0:0": "active" } });
      while (dq.length) {
        const [d, r, c] = dq.shift()!;
        if (d > dist[r][c]) continue;
        settled.add(`${r}:${c}`);
        if (r === m - 1 && c === n - 1) { ans = d; frames.push({ note: `Pop the target (${r}, ${c}) with cost ${d}: the deque pops in cost order, so ${d} is the minimum`, rows: view(), tones: tones({ [`${r}:${c}`]: "found" }) }); break; }
        const front: string[] = [], back: string[] = [], hl: Record<string, Tone> = {};
        dirs.forEach(([dr, dc], k) => {
          const nr = r + dr, nc = c + dc; if (nr < 0 || nr >= m || nc < 0 || nc >= n) return;
          const w = G[r][c] === k + 1 ? 0 : 1;
          if (d + w < dist[nr][nc]) { dist[nr][nc] = d + w; if (w) { dq.push([d + 1, nr, nc]); back.push(`(${nr}, ${nc})`); } else { dq.unshift([d, nr, nc]); front.push(`(${nr}, ${nc})`); } hl[`${nr}:${nc}`] = w ? "window" : "active"; }
        });
        frames.push({ note: `Pop (${r}, ${c}) at cost ${d}.${front.length ? ` Along its arrow: ${front.join(", ")} at cost ${d} to the front.` : ""}${back.length ? ` Other ways: ${back.join(", ")} at cost ${d + 1} to the back.` : ""}${!front.length && !back.length ? " No neighbour improves" : ""}`, rows: view(), tones: tones({ ...hl, [`${r}:${c}`]: "found" }) });
      }
      return cells(`minCost = ${ans}`, view(), frames);
    },
  },

  "reconstruct-itinerary": {
    approach: "Hierholzer's algorithm: follow the smallest unused ticket until stuck, add the stuck airport to the route, back up, and reverse the route at the end.",
    idea: ["Using every ticket once is an Eulerian path that starts at JFK.", "Sort each airport's destinations so the smallest one is taken first (pop from a reverse-sorted list).", "Walk with a stack. When the top airport has no tickets left it must be the last stop of what is still unvisited, so pop it onto the route.", "A dead end taken too early is simply placed at the end: the rest of the trip is spliced in before it when the stack backs up. Reverse the route to read it forwards."],
    code: `from collections import defaultdict
def findItinerary(tickets):
    g = defaultdict(list)
    for a, b in sorted(tickets, reverse=True):
        g[a].append(b)
    route, stack = [], ["JFK"]
    while stack:
        while g[stack[-1]]:
            stack.append(g[stack[-1]].pop())
        route.append(stack.pop())
    return route[::-1]`,
    lang: "python", time: "O(E log E)", space: "O(E)",
    viz: () => {
      const tickets: [string, string][] = [["JFK", "AAA"], ["JFK", "BBB"], ["BBB", "CCC"], ["CCC", "JFK"], ["AAA", "DDD"]], names = ["JFK", "AAA", "BBB", "CCC", "DDD"], id = (s: string) => names.indexOf(s);
      const nodes = [node(0, "JFK", 50, 50), node(1, "AAA", 85, 25), node(2, "BBB", 15, 20), node(3, "CCC", 15, 80), node(4, "DDD", 85, 80)];
      const g = new Map<string, string[]>(); [...tickets].sort().reverse().forEach(([a, b]) => { if (!g.has(a)) g.set(a, []); g.get(a)!.push(b); });
      const route: string[] = [], stack = ["JFK"], used: Record<string, Tone> = {}, frames: GraphFrame[] = [];
      const st = () => `stack [${stack.join(", ")}], route [${route.join(", ")}]`;
      const fixed = () => Object.fromEntries(route.map((s) => [id(s), "done"])) as Record<number, Tone>;
      frames.push({ note: `Start at JFK. Its tickets in order: ${[...(g.get("JFK") ?? [])].reverse().join(", ")}; always take the smallest first`, tones: { 0: "active" } });
      while (stack.length) {
        while ((g.get(stack[stack.length - 1]) ?? []).length) {
          const a = stack[stack.length - 1], b = g.get(a)!.pop()!; stack.push(b); used[ek(id(a), id(b))] = "window";
          frames.push({ note: `Use ticket ${a} → ${b}. ${st()}`, tones: { ...fixed(), [id(b)]: "active" }, edgeTones: { ...used } });
        }
        const x = stack.pop()!; route.push(x);
        frames.push({ note: `${x} has no tickets left, so it is the last stop of the remaining trip: move it to the route. ${st()}`, tones: { ...fixed(), [id(x)]: "found" }, edgeTones: { ...used } });
      }
      const ans = route.reverse();
      frames.push({ note: `Reverse the route: ${ans.join(" → ")} uses all ${tickets.length} tickets`, tones: all(names.map((_, i) => i), "found"), edgeTones: all(tickets.map(([a, b]) => ek(id(a), id(b))), "found") });
      return { kind: "graph", title: ans.join(" → "), nodes, edges: tickets.map(([a, b]) => ({ a: id(a), b: id(b), directed: true })), frames };
    },
  },

  "valid-arrangement-of-pairs": {
    approach: "Each pair is a directed edge, so a valid arrangement is an Eulerian path: start at the node with one more out-edge than in-edges (or anywhere) and run Hierholzer's algorithm.",
    idea: ["Pair [a, b] is an edge a → b, and the arrangement walks every edge once.", "Balance = out-degree - in-degree. A path must start at the node with balance +1; if every balance is 0 the edges form a closed circuit and any start works.", "Walk with a stack, always taking an unused edge from the top node; when the top has none left, pop it onto the path.", "Reversing the popped order gives the node sequence, and consecutive nodes are the pairs."],
    code: `from collections import defaultdict
def validArrangement(pairs):
    g = defaultdict(list)
    bal = defaultdict(int)
    for a, b in pairs:
        g[a].append(b)
        bal[a] += 1
        bal[b] -= 1
    start = next((x for x in bal if bal[x] == 1), pairs[0][0])
    path, stack = [], [start]
    while stack:
        u = stack[-1]
        if g[u]:
            stack.append(g[u].pop())
        else:
            path.append(stack.pop())
    path.reverse()
    return [[path[i], path[i + 1]] for i in range(len(path) - 1)]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const pairs = [[1, 2], [2, 3], [3, 1], [1, 4], [4, 5]], vals = [1, 2, 3, 4, 5], id = (v: number) => vals.indexOf(v);
      const nodes = [node(0, "1", 45, 50), node(1, "2", 15, 15), node(2, "3", 15, 85), node(3, "4", 72, 50), node(4, "5", 95, 50)];
      const g = new Map<number, number[]>(), bal = new Map<number, number>();
      for (const [a, b] of pairs) { if (!g.has(a)) g.set(a, []); g.get(a)!.push(b); bal.set(a, (bal.get(a) ?? 0) + 1); bal.set(b, (bal.get(b) ?? 0) - 1); }
      const bb = Object.fromEntries(vals.map((v) => [id(v), `${(bal.get(v) ?? 0) > 0 ? "+" : ""}${bal.get(v) ?? 0}`])) as Record<number, string>;
      const start = [...bal.keys()].find((x) => bal.get(x) === 1) ?? pairs[0][0];
      const frames: GraphFrame[] = [{ note: `Badges show out-degree - in-degree. Node ${start} has +1, so the path must start there`, tones: { [id(start)]: "active" }, badges: bb }];
      const path: number[] = [], stack = [start], used: Record<string, Tone> = {};
      const st = () => `stack [${stack.join(", ")}], popped [${path.join(", ")}]`;
      const fixed = () => Object.fromEntries(path.map((v) => [id(v), "done"])) as Record<number, Tone>;
      while (stack.length) {
        const u = stack[stack.length - 1], out = g.get(u) ?? [];
        if (out.length) { const v = out.pop()!; stack.push(v); used[ek(id(u), id(v))] = "window"; frames.push({ note: `Take edge ${u} → ${v}. ${st()}`, tones: { ...fixed(), [id(v)]: "active" }, edgeTones: { ...used }, badges: bb }); }
        else { path.push(stack.pop()!); frames.push({ note: `${u} has no unused edge: pop it. ${st()}`, tones: { ...fixed(), [id(u)]: "found" }, edgeTones: { ...used }, badges: bb }); }
      }
      path.reverse(); const ans = path.slice(1).map((v, i) => `[${path[i]},${v}]`);
      frames.push({ note: `Reverse the popped nodes: ${path.join(" → ")}, so the pairs are ${ans.join(" ")}`, tones: all(vals.map(id), "found"), edgeTones: all(pairs.map(([a, b]) => ek(id(a), id(b))), "found"), badges: bb });
      return { kind: "graph", title: ans.join(" "), nodes, edges: pairs.map(([a, b]) => ({ a: id(a), b: id(b), directed: true })), frames };
    },
  },

  "cracking-the-safe": {
    approach: "De Bruijn sequence: nodes are the last n - 1 digits, each of the k digits is an edge, and an Eulerian circuit (Hierholzer) uses every n-digit code exactly once.",
    idea: ["A string of length k^n + n - 1 that contains every n-digit code is the shortest possible: each code starts at a different position.", "Make a node for every (n - 1)-digit string; typing digit d from node s moves to (s + d) without its first digit, and that move is the code s + d.", "Every node has k edges in and k edges out, so an Eulerian circuit exists and walks every code once.", "Hierholzer with a stack: from the top node take its next unused digit; when a node has none left, pop it and record the digit that led there. The reversed digits, after the start node, are the answer."],
    code: `def crackSafe(n, k):
    start = "0" * (n - 1)
    left = {}
    stack, out = [(start, "")], []
    while stack:
        node, digit = stack[-1]
        left.setdefault(node, k)
        if left[node]:
            left[node] -= 1
            d = str(left[node])
            stack.append(((node + d)[1:], d))
        else:
            stack.pop()
            out.append(digit)
    return start + "".join(reversed(out))`,
    lang: "python", time: "O(n k^n)", space: "O(n k^n)",
    viz: () => {
      const n = 2, k = 2, start = "0".repeat(n - 1), left = new Map<string, number>(), stack: [string, string][] = [[start, ""]], out: string[] = [], frames: StackFrame[] = [];
      const items = () => stack.map(([s, d]) => (d ? `${d}→${s}` : s));
      frames.push({ note: `n = ${n}, k = ${k}: nodes are the last ${n - 1} digit${n > 2 ? "s" : ""}, typing a digit is an edge. Start at node "${start}"`, items: items(), side: "answer: (empty)" });
      while (stack.length) {
        const [s] = stack[stack.length - 1]; if (!left.has(s)) left.set(s, k);
        if (left.get(s)!) {
          left.set(s, left.get(s)! - 1); const d = String(left.get(s)), to = (s + d).slice(1); stack.push([to, d]);
          frames.push({ note: `From "${s}" type ${d}: code "${s + d}" is used, move to "${to}" (${left.get(s)} digit${left.get(s) === 1 ? "" : "s"} left there)`, items: items(), incoming: `${d}→${to}`, side: `digits popped: ${out.join("") || "(none)"}` });
        } else {
          const [, d] = stack.pop()!; out.push(d);
          frames.push({ note: `"${s}" has no unused digit: pop it${d ? ` and record ${d}` : " (the start, nothing to record)"}`, items: items(), popped: [d || s], side: `digits popped: ${out.join("") || "(none)"}` });
        }
      }
      const ans = start + out.reverse().join("");
      frames.push({ note: `Start "${start}" plus the popped digits reversed gives "${ans}": length ${ans.length} = ${k}^${n} + ${n - 1}, and every ${n}-digit code appears once`, items: [], side: `answer: ${ans}` });
      return { kind: "stack", title: `crackSafe(${n}, ${k}) = "${ans}"`, frames };
    },
  },
};

function cells(title: string, rows: (string | number)[][], frames: CellsFrame[]): Diagram { return { kind: "cells", title, rows, frames }; }
