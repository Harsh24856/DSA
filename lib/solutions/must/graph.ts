// Solutions for the must-do "graph" questions that were new to the app (lib/patterns/overview/graph.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, TableFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "find-the-town-judge": {
    approach: "Give every person a score of in-degree minus out-degree; the judge is the one person whose score is n - 1.",
    idea: ["Read each trust pair a -> b as a directed edge.", "The judge trusts nobody (out-degree 0) and is trusted by everyone else (in-degree n - 1).", "Keep one number per person: +1 for each edge in, -1 for each edge out.", "Only the judge can reach n - 1, because that needs n - 1 edges in and none out.", "Return that person, or -1 if nobody gets there."],
    code: `def findJudge(n, trust):
    score = [0] * (n + 1)
    for a, b in trust:
        score[a] -= 1          # a trusts someone: cannot be the judge
        score[b] += 1
    for i in range(1, n + 1):
        if score[i] == n - 1:
            return i
    return -1`,
    lang: "python", time: "O(n + e)", space: "O(n)",
    viz: () => {
      const n = 4, trust = [[1, 3], [1, 4], [2, 3], [2, 4], [4, 3]];
      const nodes = [{ id: 0, label: "1", x: 15, y: 20 }, { id: 1, label: "2", x: 15, y: 80 }, { id: 2, label: "3", x: 85, y: 50 }, { id: 3, label: "4", x: 50, y: 50 }];
      const score = Array(n + 1).fill(0), frames: GraphFrame[] = [], edgeTones: Record<string, Tone> = {};
      const badges = () => Object.fromEntries(nodes.map((nd) => [nd.id, String(score[nd.id + 1])]));
      frames.push({ note: `${n} people, ${trust.length} trust edges. Every score starts at 0; the judge needs n - 1 = ${n - 1}`, badges: badges() });
      for (const [a, b] of trust) {
        score[a]--; score[b]++; edgeTones[ek(a - 1, b - 1)] = "found";
        frames.push({ note: `${a} trusts ${b}: score[${a}] drops to ${score[a]}, score[${b}] rises to ${score[b]}`, tones: { [a - 1]: "bad", [b - 1]: "active" }, edgeTones: { ...edgeTones }, badges: badges() });
      }
      let judge = -1;
      for (let i = 1; i <= n; i++) if (score[i] === n - 1) judge = i;
      frames.push({ note: judge > 0 ? `Person ${judge} has score ${n - 1}: trusted by all, trusts nobody. The judge is ${judge}` : "Nobody reached n - 1, so -1", tones: judge > 0 ? { [judge - 1]: "found" } : {}, edgeTones: { ...edgeTones }, badges: badges() });
      return { kind: "graph", title: `findJudge = ${judge}`, nodes, edges: trust.map(([a, b]) => ({ a: a - 1, b: b - 1, directed: true })), frames };
    },
  },

  "open-the-lock": {
    approach: "BFS over the 10,000 lock states; each state has 8 neighbours (one wheel up or down) and dead ends are walls.",
    idea: ["Each 4-digit string is a node; turning one wheel by one slot is an edge, so every node has 8 neighbours.", "Every turn costs the same, so the fewest turns is a BFS distance from 0000.", "Dead ends are nodes you may not enter; if 0000 is one of them the answer is -1 at once.", "Mark a state seen when it is pushed, so no state enters the queue twice.", "The first time the target is popped, its level is the answer; an empty queue means it cannot be reached."],
    code: `from collections import deque
def openLock(deadends, target):
    dead = set(deadends)
    if "0000" in dead:
        return -1
    seen = {"0000"}
    q = deque([("0000", 0)])
    while q:
        s, d = q.popleft()
        if s == target:
            return d
        for i in range(4):
            c = int(s[i])
            for nd in ((c + 1) % 10, (c - 1) % 10):
                t = s[:i] + str(nd) + s[i + 1:]
                if t not in seen and t not in dead:
                    seen.add(t)
                    q.append((t, d + 1))
    return -1`,
    lang: "python", time: "O(10^4 x 8)", space: "O(10^4)",
    viz: () => {
      const dead = new Set(["0201", "0101", "0102", "1212", "2002"]), target = "0202", frames: CellsFrame[] = [];
      const seen = new Set(["0000"]); let level = ["0000"], d = 0, ans = -1;
      const show = (xs: string[]) => (xs.length ? xs.slice(0, 8) : [""]);
      frames.push({ note: `Start at 0000. Dead ends: ${[...dead].join(", ")}. Target ${target}`, rows: [show(level)], tones: { "0:0": "active" } });
      while (level.length) {
        const hit = level.indexOf(target);
        if (hit >= 0) { ans = d; frames.push({ note: `Level ${d} contains ${target}: it is ${d} turns away, and BFS reaches every state in its fewest turns`, rows: [show(level)], tones: hit < 8 ? { [`0:${hit}`]: "found" } : {} }); break; }
        const next: string[] = []; let blocked = 0;
        for (const s of level) for (let i = 0; i < 4; i++) for (const step of [1, 9]) {
          const t = s.slice(0, i) + String((+s[i] + step) % 10) + s.slice(i + 1);
          if (dead.has(t)) { blocked++; continue; }
          if (!seen.has(t)) { seen.add(t); next.push(t); }
        }
        d++; level = next;
        frames.push({ note: `Level ${d}: ${next.length} new states (showing up to 8)${blocked ? `, ${blocked} moves hit a dead end` : ""}. Seen so far: ${seen.size}`, rows: [show(level)], tones: Object.fromEntries(show(level).map((_, j) => [`0:${j}`, "window"])) as Record<string, Tone> });
      }
      return { kind: "cells", title: `openLock(target ${target}) = ${ans}`, rowLabels: ["level"], rows: [["0000"]], frames };
    },
  },

  "shortest-bridge": {
    approach: "Flood one island to collect its cells, then multi-source BFS outward from all of them; the first time BFS touches the other island, the level is the answer.",
    idea: ["Find any land cell and flood its island, marking every cell (here with 2) and putting all of them in the queue.", "Those cells are all at distance 0, so a BFS from them at once grows the island one ring of water at a time.", "Each ring is one more cell to flip; mark water cells as you push them.", "When a neighbour is land that is still 1, it belongs to the other island: the current ring count is the number of flips.", "Use an explicit stack for the flood so a 100 x 100 island cannot overflow the call stack."],
    code: `from collections import deque
def shortestBridge(grid):
    n = len(grid)
    r0, c0 = next((r, c) for r in range(n) for c in range(n) if grid[r][c])
    q, stack = deque(), [(r0, c0)]
    grid[r0][c0] = 2
    while stack:                       # flood the first island
        r, c = stack.pop()
        q.append((r, c))
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                stack.append((nr, nc))
    steps = 0
    while q:                           # grow it one ring at a time
        for _ in range(len(q)):
            r, c = q.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < n and 0 <= nc < n:
                    if grid[nr][nc] == 1:
                        return steps
                    if grid[nr][nc] == 0:
                        grid[nr][nc] = 2
                        q.append((nr, nc))
        steps += 1
    return -1`,
    lang: "python", time: "O(n^2)", space: "O(n^2)",
    viz: () => {
      const g = [[1, 1, 0, 0, 0], [1, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 1, 1], [0, 0, 0, 1, 1]], n = g.length, frames: TableFrame[] = [];
      const lab: (string | number | null)[][] = g.map((r) => r.map((v) => (v ? "B" : "")));
      const snap = () => lab.map((r) => [...r]);
      frames.push({ note: "Two islands. Pick the first land cell and flood its island", cells: snap() });
      const q: [number, number][] = [], st: [number, number][] = [[0, 0]]; g[0][0] = 2;
      while (st.length) { const [r, c] = st.pop()!; q.push([r, c]); lab[r][c] = "A"; for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (g[nr]?.[nc] === 1) { g[nr][nc] = 2; st.push([nr, nc]); } }
      frames.push({ note: `Island A has ${q.length} cells, all pushed at distance 0. Island B is still marked 1`, cells: snap(), active: [0, 0] });
      let steps = 0, ans = -1, cur = q;
      while (cur.length && ans < 0) {
        const next: [number, number][] = [];
        for (const [r, c] of cur) for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
          if (g[nr][nc] === 1 && ans < 0) { ans = steps; frames.push({ note: `From (${r},${c}) the neighbour (${nr},${nc}) is island B. Ring ${steps} reached it, so ${steps} flips build the bridge`, cells: snap(), active: [nr, nc] }); }
          if (g[nr][nc] === 0) { g[nr][nc] = 2; lab[nr][nc] = steps + 1; next.push([nr, nc]); }
        }
        if (ans >= 0) break;
        steps++; cur = next;
        frames.push({ note: `Ring ${steps}: ${next.length} water cells are ${steps} flip${steps > 1 ? "s" : ""} from A (numbers show the ring)`, cells: snap() });
      }
      return { kind: "table", title: `shortestBridge = ${ans}`, rowHead: ["0", "1", "2", "3", "4"], colHead: ["0", "1", "2", "3", "4"], frames };
    },
  },

  "reorder-routes-to-make-all-paths-lead-to-the-city-zero": {
    approach: "Walk the tree from city 0 ignoring direction; every road you walk along its own direction points away from 0 and must be flipped.",
    idea: ["The roads form a tree, so each city has exactly one path to 0.", "Store each road twice: a -> b with cost 1 (walking it as given goes away from 0) and b -> a with cost 0.", "Start a DFS (or BFS) from 0 over this undirected view.", "When you step from u to an unseen v, the road between them must point v -> u; if it points u -> v you pay 1.", "The sum of those costs is the answer, and each road is looked at twice."],
    code: `def minReorder(n, connections):
    adj = [[] for _ in range(n)]
    for a, b in connections:
        adj[a].append((b, 1))      # road points away from a: flip it if we walk a -> b
        adj[b].append((a, 0))
    seen = [False] * n
    seen[0] = True
    stack, flips = [0], 0
    while stack:
        u = stack.pop()
        for v, cost in adj[u]:
            if not seen[v]:
                seen[v] = True
                flips += cost
                stack.append(v)
    return flips`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 6, conns = [[0, 1], [1, 3], [2, 3], [4, 0], [4, 5]];
      const nodes = [{ id: 0, label: "0", x: 50, y: 50 }, { id: 1, label: "1", x: 25, y: 25 }, { id: 2, label: "2", x: 10, y: 85 }, { id: 3, label: "3", x: 10, y: 45 }, { id: 4, label: "4", x: 75, y: 25 }, { id: 5, label: "5", x: 90, y: 75 }];
      const adj: [number, number][][] = Array.from({ length: n }, () => []);
      for (const [a, b] of conns) { adj[a].push([b, 1]); adj[b].push([a, 0]); }
      const seen = Array(n).fill(false), frames: GraphFrame[] = [], tones: Record<number, Tone> = { 0: "found" }, edgeTones: Record<string, Tone> = {};
      seen[0] = true; const stack = [0]; let flips = 0;
      frames.push({ note: "Start at city 0 and walk outward, ignoring the arrows", tones: { ...tones } });
      while (stack.length) {
        const u = stack.pop()!;
        for (const [v, cost] of adj[u]) if (!seen[v]) {
          seen[v] = true; flips += cost; stack.push(v); tones[v] = "done";
          edgeTones[ek(u, v)] = cost ? "bad" : "found";
          frames.push({ note: cost ? `${u} to ${v}: the road points ${u} -> ${v}, away from 0, so flip it. Flips ${flips}` : `${u} to ${v}: the road already points ${v} -> ${u}, toward 0. Flips ${flips}`, tones: { ...tones, [v]: "active" }, edgeTones: { ...edgeTones } });
        }
      }
      frames.push({ note: `Every city is reached. Red roads are the ${flips} that must be reversed`, tones: { ...tones }, edgeTones: { ...edgeTones } });
      return { kind: "graph", title: `minReorder = ${flips}`, nodes, edges: conns.map(([a, b]) => ({ a, b, directed: true })), frames };
    },
  },
};
