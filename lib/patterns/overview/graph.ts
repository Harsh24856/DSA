// Overview of the "graph" topic: the data structure or technique itself. Shown on /patterns/graph before the patterns.
import type { Diagram, GraphFrame, TableFrame, Tone } from "../../diagram";
import type { TopicOverview } from "../types";

const NODES = [{ id: 0, label: "A", x: 10, y: 50 }, { id: 1, label: "B", x: 35, y: 15 }, { id: 2, label: "C", x: 35, y: 85 }, { id: 3, label: "D", x: 65, y: 15 }, { id: 4, label: "E", x: 65, y: 85 }, { id: 5, label: "F", x: 90, y: 50 }];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 4]];
const L = (i: number) => NODES[i].label;
const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const adjOf = () => { const adj: number[][] = NODES.map(() => []); for (const [a, b] of EDGES) { adj[a].push(b); adj[b].push(a); } adj.forEach((l) => l.sort((x, y) => x - y)); return adj; };

/** Adding edges one by one to an adjacency matrix, with the adjacency list in the note. */
function buildBoth(): Diagram {
  const n = NODES.length, mat = NODES.map(() => NODES.map(() => 0 as number)), adj: number[][] = NODES.map(() => []), frames: TableFrame[] = [];
  frames.push({ note: `${n} vertices, no edges. The matrix already takes ${n} x ${n} = ${n * n} cells; the list holds ${n} empty lists`, cells: mat.map((r) => [...r]) });
  for (const [a, b] of EDGES) {
    mat[a][b] = mat[b][a] = 1; adj[a].push(b); adj[b].push(a);
    const filled = adj.reduce((s, l) => s + l.length, 0);
    frames.push({ note: `add_edge(${L(a)}, ${L(b)}): matrix sets cells [${L(a)}][${L(b)}] and [${L(b)}][${L(a)}]; lists become ${L(a)}: [${adj[a].map(L).join(", ")}], ${L(b)}: [${adj[b].map(L).join(", ")}]. List entries ${filled}, matrix cells still ${n * n}`, cells: mat.map((r) => [...r]), active: [a, b], tones: { [`${b}:${a}`]: "found" } });
  }
  frames.push({ note: `Done: ${EDGES.length} edges. The list stores 2E = ${2 * EDGES.length} entries; the matrix stores V^2 = ${n * n} cells, most of them 0. The matrix answers "is there an edge?" in O(1) by reading one cell`, cells: mat.map((r) => [...r]) });
  return { kind: "table", title: "Adjacency matrix vs adjacency list", rowHead: NODES.map((x) => x.label), colHead: NODES.map((x) => x.label), frames };
}

/** BFS with the queue shown, and DFS with the stack shown, on the same graph. */
function traverse(mode: "bfs" | "dfs"): Diagram {
  const adj = adjOf(), frames: GraphFrame[] = [], tones: Record<number, Tone> = {}, edgeTones: Record<string, Tone> = {}, badges: Record<number, string> = {};
  if (mode === "bfs") {
    const dist = NODES.map(() => -1), q = [0]; dist[0] = 0; badges[0] = "d0"; tones[0] = "window";
    frames.push({ note: "Push A with distance 0 and mark it seen at once. Queue [A]", tones: { ...tones }, badges: { ...badges } });
    while (q.length) {
      const u = q.shift()!, added: number[] = [];
      for (const v of adj[u]) if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); added.push(v); tones[v] = "window"; badges[v] = `d${dist[v]}`; edgeTones[ek(u, v)] = "found"; }
      tones[u] = "done";
      frames.push({ note: `Pop ${L(u)} (front of the queue). ${added.length ? `Unseen neighbours ${added.map(L).join(", ")} get distance ${dist[u] + 1} and join the back` : "No unseen neighbours"}. Queue [${q.map(L).join(", ")}]`, tones: { ...tones, [u]: "active" }, edgeTones: { ...edgeTones }, badges: { ...badges } });
    }
    frames.push({ note: "The queue is empty. Vertices left in rings of distance, and the green edges form a shortest-path tree from A", tones: { ...tones }, edgeTones: { ...edgeTones }, badges: { ...badges } });
    return { kind: "graph", title: "BFS: a queue visits in rings of distance", nodes: NODES, edges: EDGES.map(([a, b]) => ({ a, b })), frames };
  }
  const seen = NODES.map(() => false), st: [number, number][] = [[0, -1]]; let k = 0;
  frames.push({ note: "Push A on the stack. A vertex is visited when it is popped", tones: { 0: "window" } });
  while (st.length) {
    const [u, from] = st.pop()!;
    if (seen[u]) { frames.push({ note: `Pop ${L(u)}: already visited through another path, skip it. Stack [${st.map(([x]) => L(x)).join(", ")}]`, tones: { ...tones }, edgeTones: { ...edgeTones }, badges: { ...badges } }); continue; }
    seen[u] = true; badges[u] = String(++k); tones[u] = "done"; if (from >= 0) edgeTones[ek(from, u)] = "found";
    const push = adj[u].filter((v) => !seen[v]).reverse();
    for (const v of push) st.push([v, u]);
    frames.push({ note: `Pop ${L(u)}, visit it as number ${k}. ${push.length ? `Push unseen neighbours ${push.map(L).join(", ")} so the smallest is on top` : "Nothing new to push"}. Stack [${st.map(([x]) => L(x)).join(", ")}]`, tones: { ...tones, [u]: "active" }, edgeTones: { ...edgeTones }, badges: { ...badges } });
  }
  frames.push({ note: "Stack empty. DFS ran down one long path first, and its green edges form a DFS tree", tones: { ...tones }, edgeTones: { ...edgeTones }, badges: { ...badges } });
  return { kind: "graph", title: "DFS: a stack goes deep before it goes wide", nodes: NODES, edges: EDGES.map(([a, b]) => ({ a, b })), frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A graph is a set of **vertices** (nodes) joined by **edges**. It models anything with pairwise links: roads between cities, friendships, prerequisites between courses, moves between game states. V is the number of vertices and E the number of edges, and every cost on this page is written in those two numbers.",
    "Edges can be **directed** (a one-way arrow u -> v, like 'u is a prerequisite of v') or **undirected** (a two-way link). They can be **weighted** (each edge has a cost or length) or unweighted (every edge counts as 1). The **degree** of a vertex is how many edges touch it; in a directed graph it splits into **in-degree** (arrows in) and **out-degree** (arrows out).",
    "A **path** is a walk along edges without repeating a vertex, and a **cycle** is a path that returns to its start. A graph with no cycle is **acyclic**. A directed acyclic graph is a **DAG**, the shape of every dependency or ordering problem. An undirected graph is **connected** when every vertex can reach every other; otherwise it splits into **connected components**. A connected acyclic undirected graph is a **tree**, with exactly V - 1 edges. A graph is **sparse** when E is close to V and **dense** when E is close to V^2.",
    "There are three common ways to store one. An **adjacency list** keeps, for each vertex, the list of its neighbours: memory O(V + E), and looping over a vertex's neighbours costs exactly its degree. An **adjacency matrix** is a V x V table where cell [u][v] holds 1 or the weight: memory O(V^2), and testing one edge is a single read, but listing neighbours scans a whole row. An **edge list** is just the array of (u, v, w) triples: compact and easy to sort, which is all Kruskal needs, but finding the neighbours of one vertex means scanning everything.",
    "Many interview graphs are never given as a graph. A grid is a graph whose cells are vertices with up to 4 (or 8) neighbours. A word ladder is a graph whose vertices are words and whose edges join words one letter apart. A lock, a puzzle board or a bitmask of visited cities is a vertex in a **state graph**. These are **implicit graphs**: you generate the neighbours on the fly instead of storing them, so the memory is only what the search keeps in its queue and its seen set.",
    "Almost every graph algorithm is built on one of two traversals. **BFS** (breadth-first search) uses a queue and visits vertices in order of distance from the start, so it finds shortest paths when every edge costs the same. **DFS** (depth-first search) uses a stack (or recursion) and follows one path as far as it goes before backing up, which exposes structure: components, cycles, topological order, bridges. Both visit each vertex once and each edge once or twice, O(V + E) with an adjacency list.",
  ],
  build: [
    "The usual adjacency list is an array of lists indexed by vertex id: `adj = [[] for _ in range(n)]`. Adding an undirected edge appends to both ends; a directed one appends to the source only. For weights, store pairs (v, w). If you need fast edge tests or edge removal, make each entry a hash map from neighbour to weight instead of a list, which is what the code below does.",
    "When vertices are not numbered 0 to n - 1 (words, coordinates, names), either map each to an id first with a dictionary, or use a dictionary of lists directly (`defaultdict(list)`). Mapping to ids is faster in C++ and lets you use plain vectors for `dist`, `seen` and `parent`.",
    "BFS keeps one invariant: the queue holds vertices in order of non-decreasing distance, and a vertex is marked seen the moment it is pushed. Marking at push time, not at pop time, is what stops a vertex from entering the queue many times. Distances are set as `dist[v] = dist[u] + 1` when v is first discovered from u, and storing `parent[v] = u` lets you rebuild the path backwards.",
    "DFS keeps a seen array and either recurses or uses an explicit stack. The recursive form gives you the moment a vertex is finished (post-order), which topological sort, cycle detection with three colours (unvisited, on the stack, done) and Tarjan's bridges all need. The iterative form avoids stack overflow on long paths, such as a 10^5 vertex chain or a big grid. Python's default recursion limit is 1000, so iterative or `sys.setrecursionlimit` is required there.",
    "Shortest paths with weights keep a `dist` array that only ever decreases. **Relaxing** an edge u -> v means `dist[v] = min(dist[v], dist[u] + w)`. Dijkstra relaxes the edges of the closest unfinished vertex, taken from a min-heap, and skips stale heap entries whose distance is larger than the stored one. Bellman-Ford relaxes every edge V - 1 times, which also works with negative weights. A Union-Find (parent array with path compression and union by size) answers 'are these two in the same component?' while edges arrive one at a time.",
  ],
  code: `from collections import deque
import heapq

class Graph:
    """Adjacency list: adj[u] maps each neighbour v to the edge weight."""
    def __init__(self, n, directed=False):
        self.n, self.directed = n, directed
        self.adj = [dict() for _ in range(n)]
        self.m = 0                                  # number of edges

    def add_vertex(self):
        self.adj.append({})
        self.n += 1
        return self.n - 1

    def add_edge(self, u, v, w=1):
        if v not in self.adj[u]:
            self.m += 1
        self.adj[u][v] = w
        if not self.directed:
            self.adj[v][u] = w                      # undirected: store both directions

    def remove_edge(self, u, v):
        if self.adj[u].pop(v, None) is not None:
            self.m -= 1
            if not self.directed:
                self.adj[v].pop(u, None)

    def has_edge(self, u, v):
        return v in self.adj[u]                     # O(1) with a hash map per vertex

    def neighbours(self, u):
        return list(self.adj[u])

    def degree(self, u):
        return len(self.adj[u])                     # out-degree when directed

    def bfs(self, s):
        """Fewest edges from s to every vertex (-1 if unreachable)."""
        dist = [-1] * self.n
        dist[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in self.adj[u]:
                if dist[v] == -1:                   # mark when pushed, not when popped
                    dist[v] = dist[u] + 1
                    q.append(v)
        return dist

    def dfs(self, s):
        """Vertices in the order an iterative DFS first visits them."""
        order, seen, stack = [], [False] * self.n, [s]
        while stack:
            u = stack.pop()
            if seen[u]:
                continue
            seen[u] = True
            order.append(u)
            for v in sorted(self.adj[u], reverse=True):   # smallest neighbour on top
                if not seen[v]:
                    stack.append(v)
        return order

    def components(self):
        comp, k = [-1] * self.n, 0
        for s in range(self.n):
            if comp[s] == -1:
                for u in self.dfs(s):
                    comp[u] = k
                k += 1
        return k, comp

    def topo_order(self):
        """Kahn's algorithm on a directed graph; None if there is a cycle."""
        indeg = [0] * self.n
        for u in range(self.n):
            for v in self.adj[u]:
                indeg[v] += 1
        q = deque(u for u in range(self.n) if indeg[u] == 0)
        order = []
        while q:
            u = q.popleft()
            order.append(u)
            for v in self.adj[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        return order if len(order) == self.n else None

    def dijkstra(self, s):
        """Cheapest path cost from s with non-negative weights."""
        dist = [float("inf")] * self.n
        dist[s] = 0
        heap = [(0, s)]
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue                            # stale entry
            for v, w in self.adj[u].items():
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(heap, (dist[v], v))
        return dist


def matrix_of(g):
    """The same graph as an adjacency matrix: O(V^2) memory, O(1) edge test."""
    mat = [[0] * g.n for _ in range(g.n)]
    for u in range(g.n):
        for v, w in g.adj[u].items():
            mat[u][v] = w
    return mat


if __name__ == "__main__":
    g = Graph(6)
    for u, v in [(0, 1), (0, 2), (1, 3), (2, 4), (3, 5), (4, 5), (1, 4)]:
        g.add_edge(u, v)
    assert g.m == 7 and g.has_edge(4, 1) and g.degree(1) == 3
    assert g.bfs(0) == [0, 1, 1, 2, 2, 3]
    assert g.dfs(0) == [0, 1, 3, 5, 4, 2]
    g.remove_edge(1, 4)
    assert not g.has_edge(1, 4) and g.m == 6
    x = g.add_vertex()
    assert g.components() == (2, [0, 0, 0, 0, 0, 0, 1]) and x == 6
    assert matrix_of(g)[0] == [0, 1, 1, 0, 0, 0, 0]
    d = Graph(5, directed=True)
    for u, v in [(0, 1), (0, 2), (1, 4), (2, 3), (3, 4)]:
        d.add_edge(u, v)
    assert d.topo_order() == [0, 1, 2, 3, 4]
    d.add_edge(4, 0)
    assert d.topo_order() is None
    w = Graph(4)
    for u, v, c in [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1)]:
        w.add_edge(u, v, c)
    assert w.dijkstra(0) == [0, 3, 1, 4]
    print("ok")`,
  ops: [
    {
      title: "Adjacency list (V vertices, E edges, deg(u) neighbours of u)",
      rows: [
        ["Memory", "O(V + E)", "O(V + E)", "One entry per edge end; the cheapest storage for sparse graphs"],
        ["Build from an edge list", "O(V + E)", "O(V + E)", "One append per edge end"],
        ["Add a vertex", "O(1)", "O(1) amortised", "Append an empty list to the array"],
        ["Add an edge", "O(1)", "O(1) amortised", "Append to one list (directed) or two (undirected)"],
        ["Test edge u - v (lists)", "O(deg(u))", "O(V)", "Scan u's list; a hash set per vertex makes it O(1) on average"],
        ["Remove an edge (lists)", "O(deg(u))", "O(V)", "Find it in the list, then delete; O(1) on average with hash maps"],
        ["Remove a vertex", "O(V + E)", "O(V + E)", "Its own list goes, and every other list must drop it"],
        ["List the neighbours of u", "O(deg(u))", "O(V)", "Exactly the length of its list, the reason traversals cost O(V + E)"],
        ["Degree of u", "O(1)", "O(1)", "Length of the list; in-degree of a directed graph needs one O(V + E) pass"],
        ["Reverse every edge", "O(V + E)", "O(V + E)", "Rebuild the lists with each arrow flipped (Kosaraju needs it)"],
      ],
    },
    {
      title: "Adjacency matrix and edge list",
      rows: [
        ["Matrix memory", "O(V^2)", "O(V^2)", "Every pair has a cell, even with no edge; fine up to a few thousand vertices"],
        ["Matrix: test or set edge u - v", "O(1)", "O(1)", "Read or write cell [u][v] (and [v][u] if undirected)"],
        ["Matrix: neighbours of u", "O(V)", "O(V)", "Scans the whole row, so a traversal costs O(V^2) whatever E is"],
        ["Matrix: add a vertex", "O(V^2)", "O(V^2)", "The table has to be reallocated one size bigger"],
        ["Edge list memory", "O(E)", "O(E)", "Just the triples (u, v, w)"],
        ["Edge list: add an edge", "O(1)", "O(1) amortised", "Append a triple"],
        ["Edge list: neighbours of u or test an edge", "O(E)", "O(E)", "No index, so every edge is checked"],
        ["Edge list: sort by weight", "O(E log E)", "O(E log E)", "The first step of Kruskal"],
      ],
    },
    {
      title: "Which algorithm answers which question",
      rows: [
        ["Traverse everything (BFS or DFS)", "O(V + E)", "O(V + E)", "Each vertex is pushed once and each edge is looked at once per end"],
        ["Connected components, flood fill", "O(V + E)", "O(V + E)", "Start a DFS or BFS from every unvisited vertex; grids cost O(rows x cols)"],
        ["Shortest path, unweighted", "O(V + E)", "O(V + E)", "BFS; the first time a vertex is reached is with the fewest edges"],
        ["Shortest path, weights 0 or 1", "O(V + E)", "O(V + E)", "0-1 BFS: a deque, weight-0 edges go to the front"],
        ["Shortest path, non-negative weights", "O((V + E) log V)", "O((V + E) log V)", "Dijkstra with a binary heap"],
        ["Shortest path, negative weights", "O(V x E)", "O(V x E)", "Bellman-Ford; one more round that still improves means a negative cycle"],
        ["All-pairs shortest paths", "O(V^3)", "O(V^3)", "Floyd-Warshall on a matrix; for V up to about 400"],
        ["Shortest path in a DAG", "O(V + E)", "O(V + E)", "Relax edges in topological order, negative weights allowed"],
        ["Topological order, cycle in a directed graph", "O(V + E)", "O(V + E)", "Kahn (in-degrees and a queue) or DFS post-order"],
        ["Cycle in an undirected graph", "O(V + E)", "O(V + E)", "DFS that meets a seen vertex other than its parent, or Union-Find"],
        ["Bipartite check", "O(V + E)", "O(V + E)", "2-colour with BFS; a same-colour edge means an odd cycle"],
        ["Union-Find, per operation", "O(α(V))", "O(log V)", "Near constant with path compression and union by size; O(log V) with only one of them"],
        ["Minimum spanning tree", "O(E log E)", "O(E log E)", "Kruskal (sort plus Union-Find) or Prim with a heap"],
        ["Bridges, articulation points, SCCs", "O(V + E)", "O(V + E)", "One or two DFS passes (Tarjan, Kosaraju)"],
        ["Eulerian path", "O(V + E)", "O(V + E)", "Hierholzer, after checking the degree conditions"],
      ],
    },
  ],
  builtins: [
    ["Adjacency list", "`vector<vector<int>> adj(n)`, or `vector<vector<pair<int,int>>>` with weights", "`[[] for _ in range(n)]` or `defaultdict(list)`"],
    ["Adjacency matrix", "`vector<vector<int>> m(n, vector<int>(n))`", "`[[0] * n for _ in range(n)]`"],
    ["BFS queue", "`queue<int>`", "`collections.deque` with `popleft()` (never `list.pop(0)`, which is O(n))"],
    ["0-1 BFS deque", "`deque<int>` with `push_front` and `push_back`", "`deque` with `appendleft` and `append`"],
    ["DFS stack", "`vector<int>` with `push_back` and `pop_back`, or recursion", "a list with `append` and `pop`, or recursion with `sys.setrecursionlimit`"],
    ["Dijkstra heap", "`priority_queue<pair<long long,int>, vector<...>, greater<>>`", "`heapq` with `(dist, node)` tuples"],
    ["Seen set for implicit graphs", "`unordered_set<string>` or a `vector<bool>` over state ids", "`set()`"],
    ["Union-Find", "none: write the 10-line parent array", "none: write it; `scipy.sparse.csgraph` exists but is not available in interviews"],
  ],
  when: [
    "Things are linked in pairs (friends, flights, roads, dependencies), even if the word graph never appears.",
    "'Minimum number of steps, moves or transformations' with every step costing the same: BFS on the state graph.",
    "'Prerequisites', 'order of tasks', 'can all courses be finished': topological sort on a directed graph.",
    "'Number of islands, regions, groups, provinces': connected components with DFS, BFS or Union-Find.",
    "'Cheapest or fastest route' with weights: Dijkstra, or Bellman-Ford if weights can be negative or the number of edges is limited.",
    "A grid with blocked cells, or a puzzle whose positions you can enumerate: an implicit graph.",
    "'Connect everything at minimum total cost': a minimum spanning tree.",
  ],
  avoid: [
    "The structure is a tree given as a root with children: plain tree recursion is simpler than a general graph search with a seen set.",
    "The 'graph' is a DAG of overlapping subproblems with a small index (positions in a string, grid cells moving only right and down): DP over that order is shorter than an explicit search.",
    "You only need to know whether pairs are connected while edges keep arriving: Union-Find beats running BFS again after each edge.",
    "V is large and the graph is sparse: never build an adjacency matrix; V = 10^5 gives 10^10 cells.",
    "Shortest path with weights: plain BFS is wrong as soon as edges have different costs; use Dijkstra or 0-1 BFS.",
  ],
  tips: [
    "Ask first: directed or undirected, weighted or not, can there be cycles, self-loops or repeated edges, is it connected? The answers choose the algorithm.",
    "Mark a vertex seen when you push it, not when you pop it. Marking late lets the same vertex enter the queue many times and can blow the time limit.",
    "A graph may have several components: loop over every vertex and start a search from each unvisited one, or you will miss parts of it.",
    "Undirected cycle detection must ignore the edge back to the parent; directed cycle detection needs three states (unvisited, on the current path, finished), not a plain seen flag.",
    "Dijkstra fails with negative edges, and its heap can hold stale entries: skip a popped entry whose distance is larger than `dist[u]`.",
    "Recursive DFS overflows on a 10^5 chain or a 1000 x 1000 grid. Use an explicit stack, or BFS, when the input can be deep.",
    "State the cost as O(V + E) and say what V and E are for this input; for a grid that is rows x cols vertices and about 4 x rows x cols edges.",
    "In grid problems, write the four directions once as a list of (dr, dc) pairs and check bounds before reading the cell.",
  ],
  viz: [
    { name: "Adjacency matrix vs adjacency list", make: buildBoth, label: "Add each edge to both structures and compare their size" },
    { name: "BFS with its queue", make: () => traverse("bfs"), label: "Visit in rings of distance from A" },
    { name: "DFS with its stack", make: () => traverse("dfs"), label: "Go deep first, then back up" },
  ],
};
