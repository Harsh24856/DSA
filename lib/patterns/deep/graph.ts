// Deeper theory for the "graph" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { Diagram, GraphFrame, TableFrame, Tone } from "../../diagram";
import type { Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "DFS explores as far as it can along one path, then backs up to the most recent node that still has an unexplored edge. Marking a node when it is first entered guarantees each node is entered once and each edge is examined once from each end. That gives O(V + E) time with an adjacency list, and O(V) memory for the visited marks and the recursion stack.",
    "Why DFS finds connected components: starting from s, it reaches exactly the nodes that have a path from s. Induction on the path length shows every such node is reached, and DFS only moves along edges, so it reaches nothing else. Each outer call on an unvisited node therefore discovers one whole new component.",
    "In a directed graph, colour nodes white (unvisited), grey (on the current path) and black (finished). An edge to a grey node goes back to an ancestor on the current path, so it closes a cycle. An edge to a black node is not a cycle: that node's exploration already finished without coming back. A graph has a directed cycle exactly when DFS finds an edge to a grey node. In an undirected graph, any edge to a visited node other than the parent closes a cycle.",
    "Finish order carries information. The order in which nodes turn black, reversed, is a topological order of a DAG. The entry and exit times (tin and tout) nest like parentheses: v is in u's DFS subtree exactly when tin[u] < tin[v] and tout[v] < tout[u]. Tarjan's bridges and strongly connected components both use these times.",
    "Pitfalls: recursion depth equals the longest path DFS follows, which can be V; Python's default limit is 1000 frames, so use an explicit stack for large inputs. With an explicit stack, mark nodes when they are pushed, or check the mark again when popped, otherwise one node can be processed twice. Cloning a graph needs the old to new map filled before recursing, or cycles create duplicate copies.",
    "Choose DFS when you need reachability, components, cycle detection, paths that must be explored completely (all paths, backtracking), or entry and exit times. When you need the fewest edges to a target, use BFS instead: DFS finds a path, not the shortest one.",
  ],
  2: [
    "BFS keeps one invariant: the queue holds nodes in non-decreasing order of distance, and it never holds distances that differ by more than one. Every node at distance d is discovered while some node at distance d - 1 is being processed. So when v is first discovered from u, dist[v] = dist[u] + 1 is the true shortest distance, and no later discovery could be shorter.",
    "Proof sketch by induction on distance. Distance 0 is the source. Suppose all nodes at distance d have correct labels and are dequeued before any node at distance d + 1. A node at distance d + 1 has a neighbour at distance d, so it is discovered when that neighbour is dequeued, with label d + 1, and not earlier, because an earlier discovery would come from a node at distance less than d, giving a shorter path than d + 1.",
    "The cost is O(V + E) because each node is enqueued once (when first discovered) and each edge is examined once from each end. Mark nodes when they are pushed, not when they are popped; marking on pop lets the same node be pushed by several neighbours, which still gives correct distances but can blow up the queue to O(E).",
    "State-space BFS treats each configuration as a node: a lock combination, a word in a word ladder, a board position. The graph is implicit, so generate neighbours on demand. Bidirectional BFS grows one frontier from the start and one from the goal and stops when they meet; with branching factor b and distance d it explores about 2 · b^(d/2) states instead of b^d.",
    "When edges have weights, plain BFS is wrong. If every weight is 0 or 1, use 0-1 BFS (pattern 13). For general non-negative weights use Dijkstra, which is BFS with a priority queue.",
    "Typical signals: minimum number of moves, steps, swaps or transformations; shortest path in an unweighted grid; the first time something reaches everything. Many sources at once (all rotten oranges, all gates) is multi-source BFS, which starts with every source in the queue at distance 0.",
  ],
  3: [
    "A topological order exists exactly when the directed graph has no cycle. If there is a cycle, no node on it can come first, because each one has a predecessor on the cycle. If there is no cycle, some node has in-degree 0 (otherwise walking backwards along incoming edges forever would revisit a node and form a cycle). Place it first, remove it, and the rest is still acyclic, so induction finishes the order.",
    "Kahn's algorithm is that proof turned into code. It keeps in-degrees of the remaining graph and a queue of nodes whose in-degree is 0. Removing a node decrements its neighbours, and any that reach 0 join the queue. Every edge is processed once, so it runs in O(V + E). If the output has fewer than V nodes, the leftover nodes all have in-degree at least 1 inside the leftover graph, which means a cycle.",
    "The DFS version outputs nodes in reverse order of finishing. Correctness: for any edge u to v in a DAG, v finishes before u. If DFS enters v first, it finishes v before ever reaching u (u is not reachable from v without a cycle). If it enters u first, it explores v inside u's call, so v finishes first. Reversing finish order therefore puts u before v for every edge.",
    "Variants. A min-heap instead of a queue gives the lexicographically smallest order. Counting the BFS rounds of Kahn's algorithm gives the minimum number of semesters when any number of courses can be taken per round. Longest path in a DAG is DP over a topological order. 'Is the order unique' is true exactly when the queue never holds more than one node.",
    "Common errors: reversing the edge direction for prerequisite pairs ([course, prereq] means prereq to course), forgetting nodes that have no edges at all, and in alien dictionary problems, adding constraints from more than the first differing letter of each adjacent pair, or missing the invalid case where a word is followed by its own prefix.",
    "Topological sort is DFS or BFS with the extra rule that a node waits for all of its prerequisites. It underlies DP on DAGs, build systems and scheduling, and cycle detection in directed graphs. Find eventual safe states is Kahn's algorithm on the reversed graph.",
  ],
  4: [
    "Union-Find represents each set as a rooted tree of parent pointers; the root names the set. Two elements are in the same set exactly when find returns the same root for both. Union links one root under the other, which merges the sets in O(1) once the roots are known. The data structure can only merge, never split, which is why it fits problems where connections only appear.",
    "Two optimisations make it fast. Union by size (or rank) always hangs the smaller tree under the larger, so a node's depth grows by one only when its set at least doubles; depth stays at most log n. Path compression (or path halving) points the nodes on a find path closer to the root, flattening the tree for later calls. With both, any sequence of m operations costs O(m · α(n)), where α is the inverse Ackermann function, at most 4 for any realistic n.",
    "Cycle detection in an undirected graph follows directly: process edges one by one; an edge whose endpoints already have the same root closes a cycle, because a path between them already exists. The number of components is n minus the number of successful unions. Kruskal's MST is this loop over edges sorted by weight.",
    "Problems often hide the elements. In accounts merge, the elements are emails and each account unions its emails together. In 'most stones removed', stones in the same row or column are connected, so union a row id with a column id (offset the column ids so they do not collide). In equation satisfiability, first union all equalities, then check that no inequality joins two nodes with the same root.",
    "Weighted Union-Find stores on each node its relation to the parent (a ratio, a parity, an offset) and combines the relations along the path during find. It answers 'evaluate division' and 'is this graph bipartite' with unions. Keep the find and the weight update together, since path compression must also compress the weights.",
    "Common mistakes: union of the original nodes instead of their roots, forgetting to initialise parent[i] = i, and recursion in find on long chains before compression (use the iterative form). When the problem also needs to delete edges, process the edges in reverse (offline) so that deletions become additions.",
  ],
  5: [
    "Dijkstra grows a set of finished nodes whose distances are final. Each round it finishes the unfinished node with the smallest tentative distance and relaxes its outgoing edges. The invariant: every finished node has its true shortest distance, and every unfinished node's tentative distance is the shortest path that uses only finished nodes before the last edge.",
    "Why the smallest tentative distance is final. Suppose u has the smallest tentative distance d among unfinished nodes, but a shorter path to u exists. That path must leave the finished set at some first unfinished node x. Its length up to x is at least x's tentative distance, which is at least d, and the remaining edges are non-negative, so the path is at least d. Contradiction. This is exactly where negative edges break the proof.",
    "With a binary heap and lazy deletion (push a new entry when a distance improves and skip stale entries when popped), the heap holds at most E entries, each push and pop costs O(log E) = O(log V), and the total is O((V + E) log V). On dense graphs, the O(V²) version that scans an array for the minimum avoids the log factor and can be faster.",
    "Variants change the combine rule but keep the order rule. Maximum probability uses multiplication and a max-heap (probabilities are at most 1, so paths never improve by getting longer). Minimum effort or 'swim in rising water' uses the maximum edge on the path instead of the sum. Any combine that never makes a path better by extending it works with the same proof.",
    "When the state needs more than the node (stops used, fuel left, keys held), run Dijkstra over pairs (node, extra state). Cheapest flights with at most k stops is the classic trap: plain Dijkstra on nodes alone can finalise a node by a cheap path with too many stops and discard the more expensive path that would have stayed within k.",
    "Dijkstra is BFS with a priority queue. With 0/1 weights a deque suffices (0-1 BFS). With negative edges use Bellman-Ford. A* adds an admissible heuristic to the key to search toward a target, and remains correct as long as the heuristic never overestimates.",
  ],
  6: [
    "Bellman-Ford relies on a simple fact: if there is no negative cycle, some shortest path to every node is simple and has at most V - 1 edges. After round i of relaxing every edge, dist[v] is at most the length of the best path to v with at most i edges. By induction, after V - 1 rounds every distance is final. Each round costs O(E), so the total is O(V · E).",
    "Negative cycles. If a V-th round still improves some distance, a path with V edges beats every shorter path, so it repeats a node and contains a negative cycle. Nodes reachable from that cycle have no shortest distance at all, since going around the cycle again always lowers the cost.",
    "Limiting the number of edges. To find the cheapest path with at most k edges, run exactly k rounds and relax from a copy of the previous round's distances. Without the copy, one round can chain several relaxations together (update v, then use the new v to update w in the same round), and paths with too many edges sneak in. This is how 'cheapest flights within k stops' is solved with k + 1 rounds.",
    "Floyd-Warshall computes all-pairs distances with dp over allowed intermediate nodes: after step k, dist[i][j] is the best path that only passes through nodes 0..k inside. Adding node k either is not used (keep dist[i][j]) or is used once (dist[i][k] + dist[k][j]). That is why k must be the outer loop. It costs O(V³) time and O(V²) memory, good for V up to about 400.",
    "Practical notes. Stop Bellman-Ford early when a round changes nothing. Represent infinity with a value that cannot overflow when added (or skip relaxations from infinite distances). In Floyd-Warshall, a negative value on the diagonal dist[i][i] after the run means node i is on a negative cycle. For graphs with no negative weights and one source, Dijkstra is much faster.",
    "Evaluate division is an all-pairs problem on a small graph with multiplicative weights; Floyd-Warshall or a BFS per query both work. The 'city with the fewest reachable neighbours within a threshold' is the textbook use of Floyd-Warshall.",
  ],
  7: [
    "A minimum spanning tree connects all V nodes with V - 1 edges of least total weight. Both classic algorithms rely on the cut property: for any split of the nodes into two groups, a lightest edge crossing the split belongs to some MST. Proof by exchange: take an MST without that edge, add it, which creates a cycle that must cross the split a second time through another edge at least as heavy; remove that one and the tree is no heavier.",
    "Kruskal sorts the edges by weight and adds each one that joins two different components, using Union-Find to test that. Each accepted edge is a lightest edge across the cut between its component and the rest, so the cut property says it is safe. Sorting dominates: O(E log E). Union-Find makes each test near O(1).",
    "Prim grows one tree from any start node and repeatedly adds the lightest edge leaving the tree, with a heap of candidate edges: O(E log V). On a complete graph of points (V² edges), the array version of Prim, which keeps the best connection cost for every node outside the tree and scans it, is O(V²) and never builds the edge list.",
    "The cycle property is the mirror image: the heaviest edge on any cycle is not needed (unless ties). It explains 'critical and pseudo-critical edges': an edge is critical if forcing it out raises the MST weight, and pseudo-critical if forcing it in does not raise it. Both are checked by rerunning Kruskal with the edge excluded or pre-added.",
    "Edge cases: a disconnected graph has no spanning tree, only a forest; check that V - 1 edges were accepted. Ties between equal weights can give several MSTs with the same total. Maximum spanning tree is the same algorithm with the order reversed. The 'minimax path' (the path whose largest edge is smallest) between two nodes lies along the MST.",
    "MST is a greedy algorithm with a proof by exchange, like interval scheduling, and Kruskal is a direct application of Union-Find. Problems that add a virtual node (water supply: a well is an edge from a virtual source with the well's cost) turn node costs into edges so the standard MST applies.",
  ],
  8: [
    "A grid is a graph whose nodes are cells and whose edges join cells sharing a side (4 directions) or a corner (8 directions). Nothing is stored explicitly: neighbours are computed from (r, c) with a direction list and a bounds check. With R · C cells and at most 4 edges each, every BFS or DFS over the grid runs in O(R · C).",
    "Flood fill counts regions: scan the cells, and from each unvisited land cell run a DFS or BFS that marks the whole region. Each fill finds one complete connected component (by the reachability argument for DFS), and since marked cells are skipped, the number of fills equals the number of islands. Area, perimeter (count sides facing water or the border) and shape signatures are computed during the fill.",
    "Reverse thinking often simplifies grid problems. Surrounded regions: instead of testing each region for touching the border, flood from every border 'O' and mark those safe; everything else gets captured. Pacific Atlantic: instead of flowing water from every cell, flood uphill from each ocean's border and intersect the two reachable sets. Both turn O((R · C)²) into O(R · C).",
    "Multi-source BFS puts every source cell in the queue at distance 0 before starting. The queue then expands all sources in lockstep, so each cell is labelled with the distance to its nearest source. Rotting oranges and 'distance to nearest 0' are both one BFS, not one BFS per source.",
    "Pitfalls: check bounds before indexing, mark cells visited when pushing (not popping), and remember that a recursive fill on a 300 by 300 grid of land can hit the recursion limit in Python. Modifying the input to mark visits is fine when allowed; otherwise keep a separate visited grid. For shortest paths with obstacles you can remove, the state must include the number of removals left.",
    "Grid problems are graph problems in disguise, so every graph pattern applies: DFS for components, BFS for fewest steps, Dijkstra when moving between cells has a cost (minimum effort path), Union-Find when land appears over time (number of islands II), and DP when movement is only right and down.",
  ],
  9: [
    "A graph is bipartite when its nodes split into two sides with every edge crossing between them. The key theorem: a graph is bipartite exactly when it has no cycle of odd length. A walk along a cycle alternates sides at every edge, so it returns to its starting side only after an even number of edges; an odd cycle is impossible. Conversely, BFS colouring by distance parity succeeds whenever no odd cycle exists.",
    "The algorithm colours a start node 0 and gives each newly discovered neighbour the opposite colour of the node that found it. If an edge ever joins two nodes of the same colour, the two BFS paths from the start to those nodes plus that edge form a closed walk of odd length, which contains an odd cycle, so the graph is not bipartite. If no conflict appears, the colouring is a valid split.",
    "Run the colouring from every uncoloured node, because the graph may be disconnected and each component is coloured independently. The cost is O(V + E). DFS works equally well. Union-Find also works: for each node, union all of its neighbours together, and fail if the node ends up in the same set as any neighbour.",
    "Signals: split people into two groups where certain pairs must be apart (possible bipartition), assign two kinds of labels with constraints, check whether a graph can be 2-coloured, or detect odd cycles. Matching problems (assigning workers to jobs) are defined on bipartite graphs, though finding a maximum matching needs a different algorithm.",
    "Pitfalls: self-loops make a graph non-bipartite at once; edges in 'dislikes' lists must be added in both directions; and the input format of 'is graph bipartite' already gives an adjacency list, so do not add the edges again. Colouring with three or more colours is NP-hard in general, so do not try to generalise the BFS; flower planting with no adjacent works only because each node has at most 3 neighbours and 4 colours are available, so a greedy choice always succeeds.",
    "Bipartite checking is BFS with a parity label, the same idea as BFS with distances. The alternating-colours shortest path problem is BFS over (node, colour of the last edge) states, a close relative.",
  ],
};

/* ---------- visualisers for the new patterns (real runs, one frame per step) ---------- */

function multiSourceViz(): Diagram {
  const mat = [[1, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 1, 0, 1, 1], [1, 1, 1, 1, 1]];
  const R = mat.length, C = mat[0].length, dist: number[][] = mat.map((r) => r.map((v) => (v === 0 ? 0 : -1)));
  let q: [number, number][] = []; mat.forEach((r, i) => r.forEach((v, j) => v === 0 && q.push([i, j])));
  const show = () => dist.map((r) => r.map((d) => (d < 0 ? "?" : d)));
  const frames: TableFrame[] = [{ note: `Push every source (each 0) at distance 0: ${q.map(([r, c]) => `(${r},${c})`).join(", ")}. They spread together`, cells: show() }];
  for (let d = 1; q.length; d++) {
    const next: [number, number][] = [];
    for (const [r, c] of q) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < R && nc >= 0 && nc < C && dist[nr][nc] < 0) { dist[nr][nc] = d; next.push([nr, nc]); } }
    if (next.length) frames.push({ note: `Ring ${d}: ${next.length} cell${next.length === 1 ? "" : "s"} first reached now get distance ${d}. Each cell is labelled once, by its nearest source`, cells: show(), active: next[0], tones: Object.fromEntries(next.map(([r, c]) => [`${r}:${c}`, "active" as Tone])) });
    q = next;
  }
  frames.push({ note: "Queue empty. One BFS gave every cell its distance to the nearest 0: O(R · C), not one BFS per source", cells: show() });
  return { kind: "table", title: "Multi-source BFS: distance to the nearest 0", rowHead: ["0", "1", "2", "3"], colHead: ["0", "1", "2", "3", "4"], frames };
}

const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

function tarjanViz(): Diagram {
  const nodes = [{ id: 0, label: "0", x: 8, y: 20 }, { id: 1, label: "1", x: 32, y: 50 }, { id: 2, label: "2", x: 8, y: 80 }, { id: 3, label: "3", x: 58, y: 50 }, { id: 4, label: "4", x: 88, y: 18 }, { id: 5, label: "5", x: 88, y: 82 }, { id: 6, label: "6", x: 60, y: 90 }];
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 5], [5, 3], [5, 6]];
  const adj: [number, number][][] = nodes.map(() => []); edges.forEach(([a, b], i) => { adj[a].push([b, i]); adj[b].push([a, i]); });
  const tin = nodes.map(() => -1), low = nodes.map(() => 0), frames: GraphFrame[] = [], tones: Record<number, Tone> = {}, edgeTones: Record<string, Tone> = {}; let timer = 0;
  const badges = () => Object.fromEntries(nodes.filter((nd) => tin[nd.id] >= 0).map((nd) => [nd.id, `${tin[nd.id]}/${low[nd.id]}`]));
  const snap = (note: string, at?: number) => frames.push({ note, tones: { ...tones, ...(at === undefined ? {} : { [at]: "active" as Tone }) }, edgeTones: { ...edgeTones }, badges: badges() });
  const dfs = (u: number, via: number) => {
    tin[u] = low[u] = timer++; tones[u] = "window";
    snap(`Enter ${u}: tin = low = ${tin[u]} (badge tin/low)`, u);
    let kids = 0;
    for (const [v, i] of adj[u]) {
      if (i === via) continue;
      if (tin[v] >= 0) { if (tin[v] < low[u]) { low[u] = tin[v]; snap(`Back edge ${u}-${v}: ${u} can reach time ${tin[v]}, so low[${u}] = ${low[u]}`, u); } continue; }
      edgeTones[ek(u, v)] = "window"; kids++;
      dfs(v, i);
      low[u] = Math.min(low[u], low[v]);
      if (low[v] > tin[u]) { edgeTones[ek(u, v)] = "bad"; snap(`Back at ${u}: low[${v}] = ${low[v]} > tin[${u}] = ${tin[u]}. Nothing below ${v} climbs above it, so ${u}-${v} is a bridge`, u); }
      else snap(`Back at ${u}: low[${v}] = ${low[v]} ≤ tin[${u}] = ${tin[u]}, so the subtree of ${v} has another way up: ${u}-${v} is not a bridge`, u);
      if (via >= 0 && low[v] >= tin[u] && tones[u] !== "bad") { tones[u] = "bad"; snap(`low[${v}] ≥ tin[${u}]: removing ${u} cuts ${v}'s subtree off, so ${u} is an articulation point`, u); }
    }
    if (via < 0 && kids > 1) tones[u] = "bad";
    if (tones[u] !== "bad") tones[u] = "done";
  };
  dfs(0, -1);
  snap(`Done in one DFS, O(V + E). Red edges are bridges, red nodes are articulation points`);
  return { kind: "graph", title: "Tarjan: bridges and articulation points from low-links", nodes, edges: edges.map(([a, b]) => ({ a, b })), frames };
}

function kosarajuViz(): Diagram {
  const nodes = [{ id: 0, label: "0", x: 10, y: 22 }, { id: 1, label: "1", x: 36, y: 22 }, { id: 2, label: "2", x: 23, y: 80 }, { id: 3, label: "3", x: 64, y: 22 }, { id: 4, label: "4", x: 90, y: 22 }, { id: 5, label: "5", x: 77, y: 80 }];
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 5], [5, 3]];
  const adj = nodes.map(() => [] as number[]), radj = nodes.map(() => [] as number[]); edges.forEach(([a, b]) => { adj[a].push(b); radj[b].push(a); });
  const seen = nodes.map(() => false), order: number[] = [], frames: GraphFrame[] = [], badges: Record<number, string> = {};
  const dfs1 = (u: number) => { seen[u] = true; for (const v of adj[u]) if (!seen[v]) dfs1(v); order.push(u); badges[u] = `f${order.length}`; frames.push({ note: `Pass 1 (original edges): ${u} finishes, number ${order.length}. Finish order so far ${order.join(", ")}`, tones: Object.fromEntries(order.map((x) => [x, x === u ? "active" : "done"])), badges: { ...badges } }); };
  for (let u = 0; u < nodes.length; u++) if (!seen[u]) dfs1(u);
  const comp = nodes.map(() => -1), pal: Tone[] = ["found", "window", "active", "bad"]; let c = 0;
  const tones = () => Object.fromEntries(comp.map((k, i) => [i, k < 0 ? "muted" : pal[k % pal.length]])) as Record<number, Tone>;
  for (const u of [...order].reverse()) {
    if (comp[u] >= 0) continue;
    const st = [u], members: number[] = []; comp[u] = c;
    while (st.length) { const x = st.pop()!; members.push(x); for (const v of radj[x]) if (comp[v] < 0) { comp[v] = c; st.push(v); } }
    frames.push({ note: `Pass 2 (reversed edges), latest finisher left is ${u}: everything it reaches backwards and is not yet taken is one SCC {${members.sort((a, b) => a - b).join(", ")}}`, tones: tones(), badges: { ...badges } });
    c++;
  }
  frames.push({ note: `${c} strongly connected components. Two DFS passes: O(V + E). Shrinking each to one node leaves a DAG`, tones: tones(), badges: { ...badges } });
  return { kind: "graph", title: "Kosaraju: finish order, then DFS on reversed edges", nodes, edges: edges.map(([a, b]) => ({ a, b, directed: true })), frames };
}

function zeroOneViz(): Diagram {
  const nodes = [{ id: 0, label: "0", x: 8, y: 50 }, { id: 1, label: "1", x: 36, y: 20 }, { id: 2, label: "2", x: 36, y: 80 }, { id: 3, label: "3", x: 64, y: 20 }, { id: 4, label: "4", x: 64, y: 80 }, { id: 5, label: "5", x: 92, y: 50 }];
  const edges: [number, number, number][] = [[0, 1, 1], [0, 2, 0], [2, 1, 0], [1, 3, 1], [2, 4, 1], [3, 5, 0], [4, 3, 0], [4, 5, 1]];
  const adj = nodes.map(() => [] as [number, number][]); edges.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });
  const dist = nodes.map(() => Infinity), par = nodes.map(() => -1), popped = new Set<number>(), frames: GraphFrame[] = []; dist[0] = 0;
  const dq = [0];
  const snap = (note: string, at?: number) => frames.push({
    note: `${note}. Deque: [${dq.join(", ")}]`,
    tones: { ...Object.fromEntries([...popped].map((x) => [x, "done" as Tone])), ...Object.fromEntries(dq.map((x) => [x, "window" as Tone])), ...(at === undefined ? {} : { [at]: "active" as Tone }) },
    edgeTones: Object.fromEntries(par.flatMap((p, v) => (p < 0 ? [] : [[ek(p, v), "found" as Tone]]))),
    badges: Object.fromEntries(dist.map((d, i) => [i, d === Infinity ? "∞" : String(d)])),
  });
  snap("dist[0] = 0, the rest ∞. The deque starts with the source");
  while (dq.length) {
    const u = dq.shift()!, moves: string[] = [];
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) {
      const was = dist[v]; dist[v] = dist[u] + w; par[v] = u;
      if (w === 0) dq.unshift(v); else dq.push(v);
      moves.push(`${v}: ${was === Infinity ? "∞" : was} to ${dist[v]}, ${w === 0 ? "front (weight 0)" : "back (weight 1)"}`);
    }
    const again = popped.has(u); popped.add(u);
    snap(`Pop ${u} (dist ${dist[u]}). ${moves.length ? moves.join("; ") : again ? `${u} was already handled with this distance, so nothing improves` : "No neighbour improves"}`, u);
  }
  snap(`Deque empty. Distances ${dist.join(", ")}, each node popped at most twice: O(V + E)`);
  return { kind: "graph", title: "0-1 BFS: weight 0 to the front, weight 1 to the back", nodes, edges: edges.map(([a, b, w]) => ({ a, b, w })), frames };
}

function hierholzerViz(): Diagram {
  const nodes = [{ id: 0, label: "0", x: 8, y: 50 }, { id: 1, label: "1", x: 36, y: 50 }, { id: 2, label: "2", x: 64, y: 16 }, { id: 3, label: "3", x: 64, y: 84 }, { id: 4, label: "4", x: 92, y: 50 }];
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 1], [1, 4]];
  const adj = nodes.map(() => [] as number[]), bal = nodes.map(() => 0); edges.forEach(([a, b]) => { adj[a].push(b); bal[a]++; bal[b]--; });
  const start = bal.findIndex((b) => b === 1), stack = [start], path: number[] = [], used: Record<string, Tone> = {}, frames: GraphFrame[] = [];
  const snap = (note: string) => frames.push({
    note: `${note}. Stack [${stack.join(", ")}], written [${path.join(", ")}]`,
    tones: { ...Object.fromEntries(path.map((x) => [x, "done" as Tone])), ...(stack.length ? { [stack[stack.length - 1]]: "active" as Tone } : {}) },
    edgeTones: { ...used }, badges: Object.fromEntries(adj.map((a, i) => [i, `${a.length} left`])),
  });
  snap(`out - in: ${bal.map((b, i) => `${i}: ${b > 0 ? "+" : ""}${b}`).join(", ")}. Exactly one node has +1, so start at ${start}; the path must end at the -1 node`);
  while (stack.length) {
    const u = stack[stack.length - 1];
    if (adj[u].length) { const v = adj[u].pop()!; used[ek(u, v)] = "found"; stack.push(v); snap(`At ${u}, take an unused edge ${u} to ${v} and push ${v}`); }
    else { path.push(stack.pop()!); snap(`${u} has no unused edge: write ${u}. It comes after everything still on the stack`); }
  }
  path.reverse();
  frames.push({ note: `Reverse the written order: ${path.join(", ")}. All ${edges.length} edges used once; the dead end at 4 ended up last and the 1, 2, 3 loop was spliced in`, tones: Object.fromEntries(path.map((x) => [x, "done" as Tone])), edgeTones: { ...used } });
  return { kind: "graph", title: "Hierholzer: write a node when it is stuck, then reverse", nodes, edges: edges.map(([a, b]) => ({ a, b, directed: true })), frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 10, name: "Multi-source BFS", summary: "Start BFS from every source at once, all at distance 0. One pass gives each node its distance to the nearest source.",
    signals: ["distance from every cell to the nearest 0 / gate / exit", "rotting oranges: minutes until everything is reached", "as far from land as possible", "flood from all border cells at once"],
    idea: ["Push every source into the queue with distance 0 before the loop starts, then run ordinary BFS.", "This is the same as BFS from one virtual super-source joined to every real source by an edge of length 0.", "Each cell is labelled the first time it is reached, which is by its nearest source."],
    steps: ["dist = -1 everywhere; every source: dist 0, push", "pop (r, c); for each in-bounds neighbour with dist -1", "dist = dist[r][c] + 1, push", "answer: the dist grid (or its maximum, or -1 if something was never reached)"],
    code: `from collections import deque
def nearest_zero(mat):
    R, C = len(mat), len(mat[0])
    dist = [[-1] * C for _ in range(R)]
    q = deque()
    for r in range(R):
        for c in range(C):
            if mat[r][c] == 0:
                dist[r][c] = 0; q.append((r, c))   # every source at once
    while q:
        r, c = q.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C and dist[nr][nc] < 0:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist`,
    complexity: { best: "O(R · C)", average: "O(R · C)", worst: "O(R · C)", space: "O(R · C)", note: "Running a BFS from each source separately would be O(sources · R · C)." },
    traps: ["Starting from the cells that need an answer (each 1) instead of from the sources gives one BFS per cell: far too slow.", "Rotting oranges: count fresh oranges first; if some stay fresh, return -1. With no fresh oranges at all, the answer is 0.", "Mark cells when you push them, so a cell reached by two sources at the same time is queued once."],
    viz: { make: () => multiSourceViz() },
    theory: [
      "Multi-source BFS answers 'how far is each node from the nearest source' in a single pass. The proof is a reduction: add an imaginary node S joined to every source by an edge, and run BFS from S. Every distance in that graph is one more than the distance to the nearest real source. Pushing all sources at distance 0 is exactly the state of that BFS after S is processed, so the same invariant holds and every label is a true shortest distance.",
      "The queue keeps the BFS order property: all cells at distance d leave the queue before any cell at distance d + 1. So the wave fronts from different sources expand in lockstep, and wherever two fronts meet, the cell keeps the label of whichever reached it first, which is the nearer source.",
      "Recognise it when the question is about the nearest of many starting points, or about time for something to spread from many places at once. Rotting oranges asks for the last time any cell is reached, which is the maximum label. 'As far from land as possible' asks for the maximum distance to the nearest land. Walls and gates asks for every room's distance to the nearest gate.",
      "Reverse the direction when the targets are few and the starts are many. Asking, for every cell, the distance to the nearest 0 is the same as spreading from all the zeros. Pacific Atlantic and surrounded regions use the same idea without distances: flood from all border cells at once.",
      "The cost is O(V + E): every node enters the queue once. On a grid that is O(R · C). Variants with weights 0 and 1 use a deque (0-1 BFS) with all sources at the front; with general weights, Dijkstra with all sources in the heap at distance 0 computes the same nearest-source distances.",
      "Edge cases: no source at all (everything stays at -1, or the answer is -1), sources that are also obstacles in some problems, and grids where some cells are unreachable. Count what still needs to be reached before the loop, so the final check is one comparison.",
    ],
  },
  {
    n: 11, name: "Bridges and articulation points (Tarjan)", summary: "One DFS records each node's entry time and the earliest time its subtree can reach by a back edge (low). A tree edge u-v is a bridge when low[v] > tin[u].",
    signals: ["critical connections in a network", "which single edge or node failure disconnects the graph", "edges that lie on no cycle", "2-edge-connected or biconnected components"],
    idea: ["tin[u] = the time DFS first enters u. low[u] = the smallest tin reachable from u's DFS subtree using tree edges down and at most one back edge up.", "For a tree edge u to child v: if low[v] > tin[u], nothing in v's subtree reaches u or above without that edge, so it is a bridge.", "u (not the root) is an articulation point if some child v has low[v] ≥ tin[u]. The root is one if it has two or more DFS children."],
    steps: ["dfs(u, edge used to enter): tin[u] = low[u] = timer++", "visited neighbour (not via the entry edge): low[u] = min(low[u], tin[v])", "new neighbour v: dfs(v); low[u] = min(low[u], low[v]); test bridge and cut vertex", "root: articulation point iff it has more than one DFS child"],
    code: `def bridges_and_points(n, edges):
    adj = [[] for _ in range(n)]
    for i, (a, b) in enumerate(edges):
        adj[a].append((b, i)); adj[b].append((a, i))
    tin, low = [-1] * n, [0] * n
    timer, bridges, points = 0, [], set()
    def dfs(u, via):                          # via = id of the entry edge
        nonlocal timer
        tin[u] = low[u] = timer; timer += 1
        kids = 0
        for v, i in adj[u]:
            if i == via: continue
            if tin[v] >= 0:
                low[u] = min(low[u], tin[v])  # back edge
            else:
                dfs(v, i); kids += 1
                low[u] = min(low[u], low[v])
                if low[v] > tin[u]: bridges.append(edges[i])
                if via >= 0 and low[v] >= tin[u]: points.add(u)
        if via < 0 and kids > 1: points.add(u)
    for s in range(n):
        if tin[s] < 0: dfs(s, -1)
    return bridges, sorted(points)`,
    complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V + E)", note: "One DFS. Removing each edge and re-checking connectivity would be O(E · (V + E))." },
    traps: ["Skip the entry EDGE (by id), not the parent node, or parallel edges between the same two nodes are wrongly reported as bridges.", "The root rule is different: it is a cut vertex only with two or more DFS children.", "Recursion depth can reach V; raise the limit in Python or convert to an explicit stack for 10⁵ nodes."],
    viz: { make: () => tarjanViz() },
    theory: [
      "Removing an edge disconnects an undirected graph exactly when the edge lies on no cycle. DFS turns this into a local test. In an undirected DFS every non-tree edge joins a node to one of its ancestors (a back edge); there are no cross edges. So the only ways out of a DFS subtree are the tree edge to its parent and back edges from inside the subtree to ancestors.",
      "low[v] is the earliest entry time reachable from v's subtree using one back edge. If low[v] > tin[u] for the tree edge u-v, every back edge from the subtree lands inside the subtree itself, so cutting u-v leaves the subtree with no connection to the rest: it is a bridge. If low[v] ≤ tin[u], some back edge reaches u or above, which closes a cycle through u-v, so it is not a bridge.",
      "Articulation points use the same numbers with ≥ instead of >. A non-root u is a cut vertex if some child v has low[v] ≥ tin[u]: the subtree of v cannot reach above u, so removing u separates it. The root has no ancestors, so the test fails there; instead the root is a cut vertex exactly when it has at least two DFS children, because separate DFS children of the root cannot be joined by any edge (there are no cross edges).",
      "Each node and edge is handled once, so the whole computation is O(V + E). Low-link values also yield the 2-edge-connected components (remove the bridges, then take components) and the biconnected components (keep a stack of edges and pop a component whenever the cut-vertex condition fires).",
      "Common bugs: comparing with the parent node instead of the entry edge id, which breaks on multi-edges; updating low[u] with low[v] for a back edge (it must use tin[v], the target's entry time); and forgetting to start a DFS in every component. The critical connections problem is exactly the bridge list.",
      "Tarjan's method builds on DFS entry times and the parenthesis structure of DFS. A close cousin for directed graphs finds strongly connected components with the same tin and low idea; Kosaraju's two-pass method, the next pattern, is an easier alternative to remember.",
    ],
  },
  {
    n: 12, name: "Strongly connected components (Kosaraju)", summary: "In a directed graph, an SCC is a maximal set where every node reaches every other. Run DFS to get finish order, then DFS on the reversed graph in reverse finish order; each search collects one SCC.",
    signals: ["groups of nodes that can all reach each other", "condense a directed graph into a DAG", "which nodes lie on or can reach a cycle", "2-SAT, minimum edges to make a graph strongly connected"],
    idea: ["Pass 1: DFS on the original graph, appending each node to order when it finishes.", "Pass 2: on the reversed graph, take nodes from the end of order (latest finish first). Each unassigned node starts a DFS that collects exactly one SCC.", "The latest finisher is always in a source SCC of the condensed DAG; reversing the edges turns it into a sink, so the second DFS cannot leak into other components."],
    steps: ["build adj and reversed radj", "dfs1 over all nodes, push u to order on finish", "for u in reversed(order): if unassigned, dfs2 on radj with a new component id", "component count = number of dfs2 starts"],
    code: `def scc(n, edges):
    adj, radj = [[] for _ in range(n)], [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b); radj[b].append(a)
    seen, order = [False] * n, []
    def dfs1(u):
        seen[u] = True
        for v in adj[u]:
            if not seen[v]: dfs1(v)
        order.append(u)                       # u is finished
    for u in range(n):
        if not seen[u]: dfs1(u)
    comp, c = [-1] * n, 0
    def dfs2(u):
        comp[u] = c
        for v in radj[u]:
            if comp[v] < 0: dfs2(v)
    for u in reversed(order):                 # latest finish first
        if comp[u] < 0:
            dfs2(u); c += 1
    return comp, c`,
    complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V + E)", note: "Two DFS passes plus the reversed adjacency list. Tarjan's SCC does it in one pass with low-links." },
    traps: ["Pass 2 must use the REVERSED edges and the REVERSED finish order; either mistake merges components.", "Order by finish time, not by discovery time.", "Both passes are recursive; on 10⁵ nodes use iterative DFS or raise the recursion limit."],
    viz: { make: () => kosarajuViz() },
    theory: [
      "Mutual reachability is an equivalence relation, so the nodes of a directed graph split into strongly connected components. Shrinking each SCC to one node gives the condensation, which is always a DAG: if two components could reach each other, they would be one component. Many directed-graph questions become easy on this DAG.",
      "Why Kosaraju works. Let C and D be two components with an edge from C to D. In the first DFS, the largest finish time in C is greater than the largest in D, whichever is entered first: if DFS enters C first, it reaches all of D before finishing the entry node of C; if it enters D first, it finishes all of D without reaching C (no path back), and C is finished later. So the node with the latest finish lies in a source component of the condensation.",
      "Reversing every edge keeps the same components but turns source components into sink components. A DFS on the reversed graph from the latest finisher therefore reaches its own component and nothing else, because no reversed edge leaves a sink. Removing that component, the next latest unassigned finisher is again in a source of what remains, and the argument repeats.",
      "Uses. A directed graph is acyclic exactly when every SCC has one node and no self-loop. Nodes that can reach a cycle (the complement of eventual safe states) are those that reach a component of size above one. The minimum number of edges to make a graph strongly connected is max(number of source components, number of sink components), unless there is already only one component. 2-SAT is satisfiable when no variable is in the same SCC as its negation.",
      "Cost: two passes over all nodes and edges, O(V + E), plus O(V + E) to store the reversed graph. Tarjan's algorithm finds the same components in one pass using tin and low values and a stack, which saves the reversed graph but is harder to get right under pressure.",
      "SCCs connect DFS finish order (also used by topological sort: the reverse finish order of a DAG is a topological order) with cycle detection and DP on DAGs. A common plan is: compute SCCs, build the condensed DAG, then run topological DP on it.",
    ],
  },
  {
    n: 13, name: "0-1 BFS", summary: "Shortest paths when every edge costs 0 or 1. A deque replaces the queue: a weight-0 neighbour goes to the front, a weight-1 neighbour to the back. O(V + E), no heap.",
    signals: ["minimum number of obstacles to remove, walls to break or cells to flip", "some moves are free and others cost one", "minimum changes to make a valid path in a grid of arrows", "minimum side jumps, lane changes or direction changes"],
    idea: ["Plain BFS works because its queue holds at most two distances, d and d + 1, in order. 0-1 BFS keeps the same shape in a deque.", "A weight-0 edge gives the neighbour the same distance as the node just popped, so it belongs at the front. A weight-1 edge gives one more, so it goes to the back.", "The front is then always a node with the smallest distance, just like the top of Dijkstra's heap, but each push and pop is O(1)."],
    steps: ["dist = ∞ everywhere; dist[src] = 0; deque = [src]", "pop u from the front", "for each edge (u, v, w): if dist[u] + w < dist[v], set dist[v]", "w = 0: push v to the front; w = 1: push v to the back", "when the deque is empty, dist holds every shortest distance"],
    code: `from collections import deque
def zero_one_bfs(n, edges, src):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:                     # directed; add (v, u, w) too if undirected
        adj[u].append((v, w))
    dist = [float("inf")] * n
    dist[src] = 0
    dq = deque([src])
    while dq:
        u = dq.popleft()                      # always a smallest distance
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                if w == 0: dq.appendleft(v)   # same distance: front
                else: dq.append(v)            # one more: back
    return dist`,
    complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V + E)", note: "A node is pushed at most twice (its label can only drop from d + 1 to d). Dijkstra on the same graph costs O((V + E) log V)." },
    traps: ["Only relax when the distance really improves; pushing without the check turns the deque into a list of every path.", "Do not mark a node finished when it is pushed, as plain BFS does. A node pushed at d + 1 can still be improved to d by a later weight-0 edge.", "Weights other than 0 and 1 break it. With weights 0 to k, use Dijkstra (or a bucket queue); with all weights equal, plain BFS is enough.", "On a grid, the cost usually belongs to the cell you enter (an obstacle) or to the move (going against an arrow). Read which one before writing w."],
    viz: { make: () => zeroOneViz() },
    theory: [
      "0-1 BFS is Dijkstra with a cheaper priority queue. Dijkstra only needs one thing from its heap: the next node it removes has the smallest tentative distance. In a graph whose weights are 0 and 1, the deque gives that for free. Invariant: the deque, read front to back, is sorted by dist, and its first and last values differ by at most 1. Popping u from the front takes a smallest value d. A weight-0 neighbour gets d and goes in front of every other entry, which are all at least d. A weight-1 neighbour gets d + 1 and goes at the back, behind entries that are at most d + 1. The invariant holds after every step, so nodes leave the deque in non-decreasing order of distance, and Dijkstra's proof applies unchanged.",
      "Recognise it when the moves have two kinds of cost and one of them is free. Removing obstacles: stepping on an empty cell costs 0 and on an obstacle costs 1, and the answer is the cheapest path. The arrow grid: following the arrow in a cell costs 0, changing it to any other direction costs 1. Side jumps: moving forward in the same lane costs 0, switching lane costs 1. Whenever the question asks for the minimum number of some special move while ordinary moves are free, build that graph and run 0-1 BFS.",
      "Cost: every node is pushed at most twice, because its first label is d or d + 1 and the only improvement possible is from d + 1 to d. Every edge is relaxed at most twice, so the total is O(V + E), the same as BFS. On a grid that is O(R · C). Dijkstra with a binary heap would give the same answer in O((V + E) log V), which is also accepted on most judges, so 0-1 BFS is a speed and simplicity gain, not a different answer.",
      "Edge cases: a node can be popped twice, once stale; the relax check makes the second visit harmless. Unreachable nodes keep ∞, so test for it before returning. The source may itself be an obstacle; decide from the statement whether its cost counts (in obstacle removal the corners are always empty). Undirected graphs need both directions of every edge in the adjacency list.",
      "Wrong approaches. Plain BFS that counts edges ignores the free moves and overcounts. Plain BFS with a visited mark set on push misses improvements, because the first time a node is reached may be through a weight-1 edge. DFS with memo on a grid with cycles does not terminate correctly. Trying every subset of obstacles to remove is exponential.",
      "Neighbours: BFS (pattern 2) is the special case where every weight is 1. Dijkstra (pattern 5) handles any non-negative weights, and 0-1 BFS is what it collapses to when the weights are 0 and 1. Multi-source 0-1 BFS starts with every source in the deque at distance 0. Grid problems (pattern 8) are where it shows up most.",
    ],
  },
  {
    n: 14, name: "Eulerian path (Hierholzer)", summary: "Use every edge exactly once. Check the degree conditions, pick the start, then walk unused edges with a stack; a node is written when it has no unused edge left, and the reversed list is the path.",
    signals: ["use every ticket, domino, pair or edge exactly once", "reconstruct an itinerary from flights", "chain pairs so the end of one is the start of the next", "the shortest string that contains every code of length n (de Bruijn)"],
    idea: ["An Eulerian path uses each edge once; a circuit also ends where it started. Whether one exists depends only on degrees and connectivity.", "Directed: a circuit needs in = out at every node. A path needs exactly one node with out - in = 1 (the start) and one with in - out = 1 (the end). Undirected: a circuit needs every degree even; a path needs exactly two odd nodes, and it starts at one of them.", "Hierholzer walks unused edges until it is stuck. Being stuck can only happen at the end of the path, so that node is written first. Backing up and walking again splices each missed loop in at the right place. Reversing the written list gives the path."],
    steps: ["count out - in (directed) or degree (undirected); reject if the counts do not fit", "start = the +1 node (or an odd node); for a circuit, any node with an edge", "stack = [start]; while stack: u = top", "u has an unused edge (u, v): mark it used, push v", "else pop u and append it to path", "reverse path; if it has fewer than E + 1 nodes, the edges were not connected"],
    code: `from collections import defaultdict
def euler_directed(edges):                    # edges (u, v); nodes can be any hashable
    if not edges: return []
    adj, bal = defaultdict(list), defaultdict(int)
    for u, v in edges:
        adj[u].append(v); bal[u] += 1; bal[v] -= 1   # bal = out - in
    for u in adj: adj[u].sort(reverse=True)  # pop() then takes the smallest (lexical order)
    if any(abs(b) > 1 for b in bal.values()) or sum(b == 1 for b in bal.values()) > 1: return []
    start = next((u for u, b in bal.items() if b == 1), min(adj))
    stack, path = [start], []
    while stack:
        u = stack[-1]
        if adj[u]: stack.append(adj[u].pop())       # walk an unused edge
        else: path.append(stack.pop())              # stuck: u is final here
    path.reverse()
    return path if len(path) == len(edges) + 1 else []   # else not connected

def euler_undirected(n, edges):               # nodes 0..n-1, edge i = (u, v)
    if not edges: return []
    adj, deg = [[] for _ in range(n)], [0] * n
    for i, (u, v) in enumerate(edges):
        adj[u].append((v, i)); adj[v].append((u, i)); deg[u] += 1; deg[v] += 1
    odd = [u for u in range(n) if deg[u] % 2]
    if len(odd) not in (0, 2): return []
    start = odd[0] if odd else edges[0][0]
    used, stack, path = [False] * len(edges), [start], []
    while stack:
        u = stack[-1]
        while adj[u] and used[adj[u][-1][1]]: adj[u].pop()   # drop edges used from the other end
        if adj[u]:
            v, i = adj[u].pop(); used[i] = True; stack.append(v)
        else: path.append(stack.pop())
    path.reverse()
    return path if len(path) == len(edges) + 1 else []`,
    complexity: { best: "O(V + E)", average: "O(E log E)", worst: "O(E log E)", space: "O(V + E)", note: "The walk itself is O(V + E): every edge is pushed and popped once. Sorting the neighbours for the smallest lexical answer adds the log factor." },
    traps: ["Greedy DFS that takes the smallest next node and never backs up gets stuck in dead ends (Reconstruct Itinerary: JFK to KUL first leaves the NRT ticket unused). Write nodes on the way back, not on the way down.", "Undirected edges sit in two lists. Mark them used by edge id and skip used ones, or each edge is walked twice.", "The degree test is necessary but not enough; edges in two separate parts pass it. Check that the path has E + 1 nodes.", "When the problem fixes the start (JFK), use it; otherwise the start must be the node with out - in = 1, or any node with an edge for a circuit.", "Recursive Hierholzer is short but goes E deep; with 10⁵ edges use the explicit stack."],
    viz: { make: () => hierholzerViz() },
    theory: [
      "Why the degree conditions are right. Every time a walk passes through a node it uses one edge in and one edge out, so in a circuit every node has in = out (directed) or even degree (undirected). A path adds one extra out at the start and one extra in at the end, so exactly those two nodes are unbalanced by one. Conversely, if the degrees fit and all edges are connected, Hierholzer's algorithm below builds the path, which proves it exists.",
      "Why Hierholzer is correct. Start at the right node and keep taking unused edges. Because every node other than the end is balanced, a walk that enters such a node can always leave it again, so the first time the walk gets stuck it is at the end node. That node is the last node of the path, so write it first. Now back up along the stack. If a node on the stack still has unused edges, they form closed loops (every remaining node is balanced again), so walking from there returns to the same node, and those loops are written in the right place inside the path. Each node is written only once it has no unused edges, which means everything after it in the path is already written. Reversing the written list therefore gives a valid order, and every edge appears once because each is used exactly once.",
      "Recognise it when the objects to arrange are edges, not nodes. Tickets are edges between airports; pairs [a, b] are edges from a to b; in Cracking the Safe, each node is a string of n - 1 digits and each of the k^n codes is an edge that appends one digit, so a circuit through all edges is the shortest string that contains every code. If the question asks to visit every node once instead, that is a Hamiltonian path, which is NP-hard and needs backtracking or bitmask DP.",
      "Cost: the stack walk pushes and pops every edge once, O(V + E). Reconstruct Itinerary wants the lexically smallest itinerary, so sort each adjacency list (largest first, so that pop takes the smallest), which adds O(E log E). Popping from the end of a list is O(1); taking from the front of a Python list is O(n) and makes the whole run quadratic.",
      "Edge cases: an empty edge list (return nothing or the single start, as the problem wants), self-loops (out and in both rise, so they never change the balance, and Cracking the Safe with n = 1 is all self-loops), repeated edges between the same nodes (keep them as separate entries), and a disconnected edge set that passes the degree test, caught by the E + 1 length check. For an undirected graph, each node's list holds edge ids, and used edges are skipped lazily when they reach the end of the list.",
      "Wrong approaches. Plain DFS that writes nodes on the way down produces the walk order, which breaks as soon as there is a dead end. Backtracking over all edge orders is correct but exponential; Hierholzer never needs to undo a choice. Fleury's algorithm (never cross a bridge unless forced) works but needs a bridge test at every step, O(E²).",
      "Neighbours: Hierholzer is DFS (pattern 1) with the output taken in post-order, the same trick that gives topological order (pattern 3) from finish times. The degree balance is the same in and out counting used by Kahn's algorithm. Connectivity of the edge set can also be checked with Union-Find (pattern 4).",
    ],
  },
];
