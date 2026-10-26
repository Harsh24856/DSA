import * as S from "../sim";
import { nums, text, type Topic } from "./types";

const order = (s?: string) => ((["pre", "in", "post", "level"] as const).find((o) => (s ?? "").toLowerCase().startsWith(o)) ?? "in");

export const TREE: Topic = {
  id: "binary-tree", name: "Binary trees",
  blurb: "Each node has at most two children. Most tree problems are one recursive function that asks both children something and combines their answers.",
  basics: ["Height h: O(log n) when balanced, O(n) when it degenerates into a line.", "Recursion depth = height, so space is O(h).", "Handle the null child first; it is the base case of almost every tree function."],
  patterns: [
    {
      n: 1, name: "Traversals (DFS and BFS)", summary: "Preorder, inorder and postorder are DFS with the visit at different moments; level order is BFS with a queue.",
      signals: ["return the nodes in some order", "inorder of a BST is sorted", "iterative traversal with a stack", "level by level output"],
      idea: ["Preorder visits the node before its children (copying, serialising). Inorder visits it between them (sorted order in a BST). Postorder visits it after (anything that needs the children's answers first).", "Iterative inorder: push left children until null, pop, visit, then move to the right child.", "Level order: a queue processes nodes in rings of depth; snapshot len(queue) to separate levels."],
      steps: ["Recursive: visit(node) = order of [node, visit(left), visit(right)]", "Iterative: simulate the call stack with an explicit stack", "BFS: pop from a queue, push children"],
      code: `def inorder(root):
    out, st, cur = [], [], root
    while cur or st:
        while cur:
            st.append(cur); cur = cur.left
        cur = st.pop()
        out.append(cur.val)
        cur = cur.right
    return out`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(h)", note: "Every node is visited once. BFS needs O(w) space, w = widest level. Morris traversal gets O(1) space." },
      traps: ["Mixing up when to visit in iterative pre/post order; postorder is easiest as reversed (node, right, left).", "Checking root is None first avoids most crashes.", "Recursion depth can hit Python's limit on a skewed tree of 10⁴ nodes."],
      viz: { make: (i) => S.treeTraversal(order(i)), input: "in", label: "pre, in, post or level" },
    },
    {
      n: 2, name: "Recursion on the tree (post-order)", summary: "Each call returns one fact about its subtree (height, sum, is it balanced). A global or extra return tracks the answer that passes through the node.",
      signals: ["maximum depth, balanced tree", "diameter of a tree", "maximum path sum", "count or check something in every subtree"],
      idea: ["Ask the left and right subtrees for their answer, then compute this node's answer from both. That is post-order.", "Often the value you return and the answer you want differ. Diameter: return height, but update best with left height + right height. Max path sum: return the best single downward path, update best with the bend through the node."],
      steps: ["if not node: return the base value", "l, r = f(node.left), f(node.right)", "update the global answer using l and r", "return what the PARENT needs"],
      code: `def diameter(root):
    best = 0
    def h(node):
        nonlocal best
        if not node: return 0
        l, r = h(node.left), h(node.right)
        best = max(best, l + r)       # path bending here
        return 1 + max(l, r)          # height for the parent
    h(root)
    return best`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(h)", note: "One visit per node; recursion depth is the height." },
      traps: ["Returning the global answer instead of what the parent needs.", "Max path sum: clamp negative child paths to 0 before using them.", "Balanced check: return -1 as 'unbalanced' to stop early instead of recomputing heights (O(n²))."],
      viz: { make: () => S.treeHeight() },
    },
    {
      n: 3, name: "Views and levels (BFS)", summary: "Process the tree one level at a time. The first or last node of each level gives the left or right view; level sizes give width.",
      signals: ["level order traversal", "right side view", "zigzag order", "average or max per level, maximum width"],
      idea: ["At the start of each level the queue holds exactly that level. Loop len(queue) times to consume it and enqueue the next one.", "Right side view = last node of each level. Width = right index - left index + 1, using heap indices (2i and 2i + 1) per node."],
      steps: ["q = deque([root])", "while q: size = len(q); level = []", "repeat size times: pop, record, push children", "use level (last element, reversed, average…)"],
      code: `from collections import deque
def right_view(root):
    if not root: return []
    q, out = deque([root]), []
    while q:
        for i in range(len(q)):
            n = q.popleft()
            if i == 0: out.append(n.val)     # right child pushed first
            if n.right: q.append(n.right)
            if n.left: q.append(n.left)
    return out`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(w)", note: "w = widest level, up to n / 2 for a complete tree." },
      traps: ["Reading len(q) inside the loop condition instead of before it mixes levels.", "Zigzag: reverse every other level, do not change push order.", "Width with heap indices can get huge; normalise by subtracting the level's first index."],
      viz: { make: () => S.treeTraversal("level") },
    },
    {
      n: 4, name: "Paths and LCA", summary: "Carry state down (the path so far, remaining sum) or bubble results up (found p? found q?).",
      signals: ["root-to-leaf paths, path sum I/II/III", "lowest common ancestor", "all nodes at distance k", "sum of root-to-leaf numbers"],
      idea: ["Top-down: pass the remaining target into each call; at a leaf check if it hit zero. Backtrack by popping the path after the recursive calls.", "LCA: a call returns the node if it is p or q, otherwise whatever its children found. If both children return something, this node is the LCA.", "Path Sum III (any start): prefix sums along the root-to-node path plus a counter, like subarray sum = k."],
      steps: ["Decide: pass info down, or return info up", "Base case at null (and leaf, for root-to-leaf)", "Combine the two children"],
      code: `def lca(root, p, q):
    if not root or root is p or root is q:
        return root
    l = lca(root.left, p, q)
    r = lca(root.right, p, q)
    if l and r: return root        # p and q split here
    return l or r`,
      complexity: { best: "O(h)", average: "O(n)", worst: "O(n)", space: "O(h)", note: "LCA in a BST is O(h): walk down until p and q are on different sides." },
      traps: ["Path sum must end at a LEAF, not just any node, unless the problem says otherwise.", "Copy the path when you record it (path[:]) before backtracking mutates it.", "Distance k: convert to a graph with parent pointers, then BFS from the target."],
      viz: { make: () => S.lca() },
    },
    {
      n: 5, name: "Construction and serialisation", summary: "Preorder tells you the root; inorder tells you which values go left and right of it. Recursion rebuilds the tree.",
      signals: ["build from preorder and inorder (or postorder)", "serialise / deserialise", "sorted array or list to a balanced BST", "flatten a tree to a list"],
      idea: ["The first preorder value is the root. Its position in inorder splits the remaining values into the left and right subtrees. A hash map of value → inorder index makes each split O(1).", "Serialise with preorder plus explicit null markers; deserialise by reading the same order back with an iterator.", "Sorted array to BST: the middle element is the root, recurse on both halves."],
      steps: ["index = {v: i for i, v in enumerate(inorder)}", "build(lo, hi): take the next preorder value as root", "root.left = build(lo, mid - 1); root.right = build(mid + 1, hi)"],
      code: `def build(preorder, inorder):
    idx = {v: i for i, v in enumerate(inorder)}
    it = iter(preorder)
    def go(lo, hi):
        if lo > hi: return None
        v = next(it)
        node = TreeNode(v)
        node.left = go(lo, idx[v] - 1)
        node.right = go(idx[v] + 1, hi)
        return node
    return go(0, len(inorder) - 1)`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Searching inorder linearly instead of a map makes it O(n²)." },
      traps: ["Build the LEFT subtree first when consuming preorder; with postorder, consume from the end and build RIGHT first.", "Without null markers, preorder alone cannot be deserialised.", "Duplicate values break the value → index map."],
      viz: { make: () => S.buildTree() },
    },
    {
      n: 6, name: "BST-specific", summary: "Left < node < right everywhere. That ordering gives O(h) search, sorted inorder and range checks with bounds.",
      signals: ["validate a BST", "kth smallest in a BST", "insert, delete, search", "LCA in a BST, BST iterator, trim"],
      idea: ["Validate by passing a (low, high) window down: the left child must be inside (low, node), the right inside (node, high). Checking only the direct children is wrong.", "Inorder of a BST is sorted, so kth smallest is the kth inorder visit.", "Search: compare and go one way; the other subtree is ruled out entirely."],
      steps: ["Use the ordering to discard half the tree, or", "Use inorder when you need sorted order"],
      code: `def is_bst(node, lo=float("-inf"), hi=float("inf")):
    if not node: return True
    if not (lo < node.val < hi): return False
    return (is_bst(node.left, lo, node.val) and
            is_bst(node.right, node.val, hi))`,
      complexity: { best: "O(1)", average: "O(log n)", worst: "O(n)", space: "O(h)", note: "Search/insert/delete: O(h), which is O(log n) when balanced and O(n) when skewed. Validation visits every node: O(n)." },
      traps: ["Comparing a node only with its children misses violations deeper down.", "Delete with two children: replace with the inorder successor (smallest in the right subtree), then delete that.", "Use exclusive bounds unless duplicates are allowed."],
      viz: { make: (i) => S.bstSearch(undefined, nums(i, [7])[0]), input: "7", label: "value to search (tree: 8, 3, 10, 1, 6, 14, 4, 7)" },
    },
  ],
};

export const TRIE: Topic = {
  id: "trie", name: "Tries",
  blurb: "A tree where each edge is one character, so words that share a prefix share a path. Lookups cost the word's length, not the number of words.",
  basics: ["insert / search / startsWith: O(L) for a word of length L.", "Memory is the weak point: up to 26 children per node.", "A dict of children is simpler; a 26-array is faster."],
  patterns: [
    {
      n: 1, name: "Trie fundamentals", summary: "Walk the word character by character, creating children as needed, and mark the final node as a word end.",
      signals: ["implement a trie", "prefix search / autocomplete", "longest common prefix", "replace words with their shortest root"],
      idea: ["A node stores its children and whether a word ends here. search(w) needs the end flag; startsWith(p) only needs the path to exist.", "Autocomplete: walk to the prefix node, then DFS below it."],
      steps: ["node = root", "for ch in word: node = node.children.setdefault(ch, Node())", "node.end = True"],
      code: `class Trie:
    def __init__(self): self.kids, self.end = {}, False
    def insert(self, w):
        n = self
        for c in w: n = n.kids.setdefault(c, Trie())
        n.end = True
    def _walk(self, w):
        n = self
        for c in w:
            if c not in n.kids: return None
            n = n.kids[c]
        return n
    def search(self, w): n = self._walk(w); return bool(n and n.end)
    def startsWith(self, p): return self._walk(p) is not None`,
      complexity: { best: "O(L)", average: "O(L)", worst: "O(L)", space: "O(total characters)", note: "L = word length. Compare with a hash set: O(L) to hash, but no prefix queries." },
      traps: ["search must check the end flag, otherwise 'app' matches after inserting 'apple'.", "Store the full word at the end node when you need to output it later.", "Recursion is fine, but an iterative walk avoids stack depth issues."],
      viz: { make: (i) => S.trieBuild(text(i, "car cat cart dog", 40).split(/[\s,]+/).filter(Boolean).slice(0, 6).map((w) => w.slice(0, 6))), input: "car cat cart dog", label: "words separated by spaces" },
    },
    {
      n: 2, name: "Wildcard search", summary: "A '.' matches any character, so at that position try every child with DFS; normal characters still follow one edge.",
      signals: ["add and search words with '.'", "match a pattern against a dictionary", "map sum pairs, prefix scores", "search suggestions system"],
      idea: ["The trie turns most of the pattern into a single path; only wildcard positions branch.", "Prefix scores: store a counter on every node of how many words pass through it."],
      steps: ["dfs(node, i): if i == len(pattern) return node.end", "ch == '.' → try every child", "else → follow ch if it exists"],
      code: `def search(node, word, i=0):
    if i == len(word): return node.end
    c = word[i]
    if c == ".":
        return any(search(k, word, i + 1) for k in node.kids.values())
    return c in node.kids and search(node.kids[c], word, i + 1)`,
      complexity: { best: "O(L)", average: "O(L)", worst: "O(26^d · L)", space: "O(L)", note: "d = number of wildcards. Without wildcards it is a plain O(L) walk." },
      traps: ["Return as soon as one branch matches; any() short-circuits.", "Group words by length first if the dictionary is huge and patterns are mostly dots.", "Search suggestions: sort the dictionary first, then keep the top 3 words at each node."],
      viz: { make: () => S.trieWildcard() },
    },
    {
      n: 3, name: "Word Search II (trie + grid DFS)", summary: "Put every target word in a trie, then DFS the grid while walking the trie. A missing child prunes the search at once.",
      signals: ["find all dictionary words in a board", "boggle", "concatenated words", "stream of characters"],
      idea: ["Searching each word separately repeats the same grid walks. One trie lets a single DFS from each cell check all words together.", "Prune aggressively: remove a word from the trie once found, and delete empty leaf nodes so later searches skip them."],
      steps: ["Insert all words into a trie", "DFS from every cell with the trie root", "step only into a child matching the cell; record words at end nodes", "mark visited cells, restore on backtrack"],
      code: `def find_words(board, words):
    root = {}
    for w in words:
        n = root
        for c in w: n = n.setdefault(c, {})
        n["$"] = w
    R, C, out = len(board), len(board[0]), []
    def dfs(r, c, parent):
        ch = board[r][c]; node = parent[ch]
        if "$" in node: out.append(node.pop("$"))
        board[r][c] = "#"
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and board[nr][nc] in node:
                dfs(nr, nc, node)
        board[r][c] = ch
        if not node: parent.pop(ch)      # prune dead branch
    for r in range(R):
        for c in range(C):
            if board[r][c] in root: dfs(r, c, root)
    return out`,
      complexity: { best: "O(R · C)", average: "O(R · C · 3^L)", worst: "O(R · C · 4 · 3^(L-1))", space: "O(total word length)", note: "L = longest word. Pruning makes the real cost far lower." },
      traps: ["Forgetting to restore the cell after DFS breaks later searches.", "Pop the found word so it is reported once.", "Check the child exists before recursing, not after."],
      viz: { make: () => S.wordSearchGrid() },
    },
    {
      n: 4, name: "Bitwise trie (max XOR)", summary: "Store numbers bit by bit from the most significant bit. To maximise XOR with x, prefer the opposite bit at every level.",
      signals: ["maximum XOR of two numbers", "maximum XOR with an element from the array (with limits)", "count pairs with XOR in a range", "closest XOR"],
      idea: ["XOR is maximised by making the highest bits differ. At each level take the child holding the opposite bit if it exists; otherwise you are forced to take the same bit.", "Offline queries with a limit: sort queries and numbers, insert numbers up to each query's limit before answering it."],
      steps: ["Insert every number over a fixed width (31 bits)", "For each x: walk from the top bit, prefer the opposite branch", "Build the XOR value as you go"],
      code: `def find_max_xor(nums, W=31):
    root = {}
    for x in nums:
        n = root
        for b in range(W, -1, -1):
            n = n.setdefault((x >> b) & 1, {})
    best = 0
    for x in nums:
        n, cur = root, 0
        for b in range(W, -1, -1):
            bit = (x >> b) & 1
            if 1 - bit in n: cur |= 1 << b; n = n[1 - bit]
            else: n = n[bit]
        best = max(best, cur)
    return best`,
      complexity: { best: "O(n · W)", average: "O(n · W)", worst: "O(n · W)", space: "O(n · W)", note: "W = bit width (about 32). Compare with O(n²) for checking every pair." },
      traps: ["Use the same fixed width for every number, or short numbers end up on the wrong levels.", "Negative numbers need two's complement handling or an offset.", "Insert before querying the same number, or the first query has no partner."],
      viz: { make: (i) => S.xorTrie(undefined, Math.max(0, Math.min(31, Math.round(nums(i, [5])[0])))), input: "5", label: "number x (0 to 31) to pair against 3, 10, 5, 25, 2, 8" },
    },
  ],
};

export const GRAPH: Topic = {
  id: "graph", name: "Graphs",
  blurb: "Nodes and edges. Grids, dependencies, networks and state spaces are all graphs. Choose the traversal by what 'best' means: fewest edges, smallest weight, or any order that respects dependencies.",
  basics: ["Adjacency list: O(V + E) memory, the default. Adjacency matrix: O(V²), only for dense graphs.", "Always track visited nodes, or cycles loop forever.", "V = vertices, E = edges in every complexity below."],
  patterns: [
    {
      n: 1, name: "DFS", summary: "Go as deep as possible before backtracking. Finds connected components, paths, and cycles.",
      signals: ["number of connected components / provinces", "clone a graph", "detect a cycle", "all paths from source to target"],
      idea: ["Mark a node when you first reach it, then recurse into every unmarked neighbour. Each node and edge is handled once.", "Cycle in a directed graph: keep a 'on the current path' set (three colours: unvisited, visiting, done). Reaching a 'visiting' node means a back edge, which is a cycle."],
      steps: ["seen = set()", "for each node not seen: dfs(node) → one component", "dfs marks, then recurses into unseen neighbours"],
      code: `def count_components(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b); adj[b].append(a)
    seen = [False] * n
    def dfs(u):
        seen[u] = True
        for v in adj[u]:
            if not seen[v]: dfs(v)
    comps = 0
    for u in range(n):
        if not seen[u]: dfs(u); comps += 1
    return comps`,
      complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)", note: "Recursion depth can reach V; use an explicit stack for large graphs." },
      traps: ["Mark when you push/enter, not when you pop, or nodes are processed twice.", "Undirected cycle detection must ignore the edge back to the parent.", "Clone graph: map old node → new node before recursing, so cycles reuse the copy."],
      viz: { make: () => S.graphSearch("dfs") },
    },
    {
      n: 2, name: "BFS (shortest path, unweighted)", summary: "Explore in rings: all nodes at distance 1, then 2, and so on. The first time you reach a node is by the fewest edges.",
      signals: ["minimum steps / moves / transformations", "word ladder", "shortest path in an unweighted graph or grid", "open the lock"],
      idea: ["A queue processes nodes in order of distance, so dist[v] = dist[u] + 1 the first time v is discovered, and it never improves later.", "Many puzzles are BFS over states: each state is a node, each legal move is an edge."],
      steps: ["q = deque([src]); dist[src] = 0", "pop u; for each unseen neighbour v: dist[v] = dist[u] + 1, push v", "return dist[target] when it is first set"],
      code: `from collections import deque
def shortest(adj, src, dst):
    dist = {src: 0}
    q = deque([src])
    while q:
        u = q.popleft()
        if u == dst: return dist[u]
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return -1`,
      complexity: { best: "O(1)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)", note: "Best case: the source is the target. Bidirectional BFS shrinks the explored area a lot on big state spaces." },
      traps: ["Mark visited when pushing, not when popping, or the queue fills with duplicates.", "BFS is only shortest when every edge costs the same; weights need Dijkstra (or 0-1 BFS for 0/1 weights).", "Word ladder: generate neighbours by changing one letter (26·L) instead of comparing all word pairs."],
      viz: { make: () => S.graphSearch("bfs") },
    },
    {
      n: 3, name: "Topological sort", summary: "Order the nodes of a directed acyclic graph so every edge points forward. Kahn's algorithm repeatedly takes nodes with no remaining prerequisites.",
      signals: ["course schedule", "build / task order with dependencies", "alien dictionary", "detect a cycle in a directed graph"],
      idea: ["A node with in-degree 0 has no unmet prerequisites, so it can go next. Removing it lowers its neighbours' in-degrees; any that reach 0 join the queue.", "If fewer than V nodes come out, the rest are stuck in a cycle."],
      steps: ["compute in-degrees", "queue all nodes with in-degree 0", "pop u, append to order, decrement neighbours, enqueue new zeros", "len(order) == V ↔ no cycle"],
      code: `from collections import deque
def topo(n, edges):
    adj, indeg = [[] for _ in range(n)], [0] * n
    for a, b in edges:
        adj[a].append(b); indeg[b] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return order if len(order) == n else []`,
      complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V + E)", note: "The DFS version (reverse postorder) has the same cost." },
      traps: ["Edge direction: [course, prereq] means prereq → course.", "Alien dictionary: the only info is the first differing letter of adjacent words; 'abc' before 'ab' is invalid.", "Multiple valid orders exist; tests usually accept any."],
      viz: { make: () => S.topoSort() },
    },
    {
      n: 4, name: "Union-Find (DSU)", summary: "Keep disjoint sets with a parent pointer per node. find returns a set's root; union links two roots. Near O(1) per operation.",
      signals: ["number of connected components with edges arriving over time", "redundant connection / cycle in an undirected graph", "accounts merge", "smallest string with swaps, equations possible"],
      idea: ["Two nodes are connected iff they have the same root. union(a, b) points one root at the other.", "Path compression (point nodes straight at the root while finding) plus union by rank/size keeps trees nearly flat: amortised O(α(n)), effectively constant."],
      steps: ["parent[i] = i", "find(x): follow parents to the root, compressing the path", "union(a, b): ra, rb = find(a), find(b); if same → already connected (cycle); else link"],
      code: `class DSU:
    def __init__(self, n):
        self.p, self.size = list(range(n)), [1] * n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]   # path halving
            x = self.p[x]
        return x
    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b: return False
        if self.size[a] < self.size[b]: a, b = b, a
        self.p[b] = a; self.size[a] += self.size[b]
        return True`,
      complexity: { best: "O(1)", average: "O(α(n))", worst: "O(log n)", space: "O(n)", note: "α is the inverse Ackermann function (at most 4 in practice). Without both optimisations a single find can be O(n)." },
      traps: ["union must link the ROOTS, not the original nodes.", "Track a component counter: decrement it on every successful union.", "DSU cannot split sets; it fits only problems that merge."],
      viz: { make: () => S.unionFind() },
    },
    {
      n: 5, name: "Dijkstra (non-negative weights)", summary: "Always finalise the unfinished node with the smallest known distance, using a min-heap, then relax its edges.",
      signals: ["network delay time", "cheapest path with non-negative weights", "path with maximum probability (max-heap)", "minimum effort path in a grid"],
      idea: ["With non-negative weights, the closest unfinished node cannot be improved later, because any other route would pass through a node at least as far away.", "Lazy deletion: push a new (dist, node) whenever it improves, and skip popped entries that are stale."],
      steps: ["dist[src] = 0; heap = [(0, src)]", "pop (d, u); if d > dist[u]: skip (stale)", "for (v, w): if d + w < dist[v]: update and push"],
      code: `import heapq
def dijkstra(adj, src, n):
    dist = [float("inf")] * n
    dist[src] = 0
    h = [(0, src)]
    while h:
        d, u = heapq.heappop(h)
        if d > dist[u]: continue           # stale entry
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(h, (dist[v], v))
    return dist`,
      complexity: { best: "O((V + E) log V)", average: "O((V + E) log V)", worst: "O((V + E) log V)", space: "O(V + E)", note: "With a binary heap. Dense graphs: the O(V²) array version can be faster." },
      traps: ["Negative edges break it silently; use Bellman-Ford.", "Without the stale check the algorithm is still correct but slower.", "Cheapest flights within k stops is NOT plain Dijkstra: the state must include stops used (or use Bellman-Ford for k rounds)."],
      viz: { make: () => S.dijkstra() },
    },
    {
      n: 6, name: "Bellman-Ford and Floyd-Warshall", summary: "Bellman-Ford relaxes every edge V-1 times and handles negative weights. Floyd-Warshall finds all-pairs shortest paths with a triple loop.",
      signals: ["negative edge weights", "cheapest flights within k stops", "detect a negative cycle", "all-pairs distances on a small graph (V ≤ ~400)"],
      idea: ["A shortest path uses at most V - 1 edges. After round i of relaxing all edges, every path of up to i edges is correct. A further improvement in round V means a negative cycle.", "Limiting rounds to k + 1 (relaxing from a copy of last round's distances) answers 'at most k stops'.", "Floyd-Warshall: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) for every intermediate k."],
      steps: ["dist[src] = 0", "repeat V - 1 times: for each edge (u, v, w): relax", "one more pass: any relaxation → negative cycle"],
      code: `def bellman_ford(n, edges, src, k=None):
    dist = [float("inf")] * n
    dist[src] = 0
    for _ in range(n - 1 if k is None else k + 1):
        prev = dist[:]                       # use last round only
        for u, v, w in edges:
            if prev[u] + w < dist[v]:
                dist[v] = prev[u] + w
    return dist`,
      complexity: { best: "O(E)", average: "O(V · E)", worst: "O(V · E)", space: "O(V)", note: "Best case: stop early when a round changes nothing. Floyd-Warshall: O(V³) time, O(V²) space." },
      traps: ["For 'k stops' you must relax from the previous round's copy, or paths with more edges sneak in.", "Floyd-Warshall: k must be the OUTER loop.", "Initialise unreachable distances to infinity, not a large int that can overflow when added."],
      viz: { make: () => S.bellmanFord() },
    },
    {
      n: 7, name: "Minimum spanning tree", summary: "Connect all nodes with the least total edge weight. Kruskal adds the cheapest edge that joins two components; Prim grows one tree with a heap.",
      signals: ["min cost to connect all points", "connecting cities with minimum cost", "optimise water distribution", "critical and pseudo-critical edges"],
      idea: ["Cut property: the cheapest edge crossing any split of the nodes is safe to include. Kruskal applies it by sorting edges and using Union-Find to skip edges inside one component.", "Prim: start anywhere, keep a heap of edges leaving the tree, always add the cheapest one that reaches a new node."],
      steps: ["sort edges by weight", "for (w, a, b): if union(a, b): total += w", "stop after V - 1 edges"],
      code: `def kruskal(n, edges):
    dsu = DSU(n)
    total = used = 0
    for w, a, b in sorted(edges):
        if dsu.union(a, b):
            total += w; used += 1
            if used == n - 1: break
    return total if used == n - 1 else -1`,
      complexity: { best: "O(E log E)", average: "O(E log E)", worst: "O(E log E)", space: "O(V)", note: "Prim with a heap: O(E log V). For complete graphs of points, O(V²) Prim without a heap is simplest." },
      traps: ["An MST only exists for connected graphs; check you used V - 1 edges.", "Points problems have V² edges; Prim's O(V²) array version avoids building them all.", "Critical edges: an edge is critical if removing it raises the MST weight."],
      viz: { make: () => S.kruskal() },
    },
    {
      n: 8, name: "Grid as a graph", summary: "Each cell is a node with 4 (or 8) neighbours. Flood fill counts regions; multi-source BFS spreads from many starts at once.",
      signals: ["number of islands, max area of island", "rotting oranges, walls and gates (multi-source BFS)", "surrounded regions, Pacific Atlantic", "shortest path in a binary matrix"],
      idea: ["Flood fill: from each unvisited land cell, DFS/BFS marks the whole island. The number of fills is the number of islands.", "Multi-source BFS: put every starting cell in the queue at distance 0. The BFS then computes the distance to the nearest source for every cell in one pass.", "Reverse thinking: for Pacific Atlantic, flood inward from each ocean and intersect."],
      steps: ["for each cell: if land and unvisited → flood it, count += 1", "neighbours via dirs = [(1,0),(-1,0),(0,1),(0,-1)]", "bounds check before reading the grid"],
      code: `def num_islands(g):
    R, C, count = len(g), len(g[0]), 0
    def fill(r, c):
        if not (0 <= r < R and 0 <= c < C) or g[r][c] != "1": return
        g[r][c] = "0"                    # mark visited
        fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1)
    for r in range(R):
        for c in range(C):
            if g[r][c] == "1":
                fill(r, c); count += 1
    return count`,
      complexity: { best: "O(R · C)", average: "O(R · C)", worst: "O(R · C)", space: "O(R · C)", note: "Every cell is visited a constant number of times. Recursive fill can hit the stack limit on a 300×300 all-land grid; use BFS there." },
      traps: ["Check bounds before indexing.", "Rotting oranges: count fresh oranges up front; if any remain at the end, return -1.", "Mutating the grid to mark visited is fine if allowed; otherwise use a seen set."],
      viz: { make: () => S.gridFlood() },
    },
    {
      n: 9, name: "Bipartite check", summary: "Try to 2-colour the graph so every edge joins different colours. It works exactly when there is no odd-length cycle.",
      signals: ["is graph bipartite", "possible bipartition (dislikes)", "split into two groups with no conflicts", "odd cycle detection"],
      idea: ["BFS or DFS from each uncoloured node, giving neighbours the opposite colour. Meeting a neighbour that already has the SAME colour proves an odd cycle."],
      steps: ["color = {}", "for each uncoloured node: colour it 0 and BFS", "neighbour uncoloured → opposite colour; same colour → not bipartite"],
      code: `from collections import deque
def is_bipartite(adj):
    color = {}
    for s in range(len(adj)):
        if s in color: continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if v not in color:
                    color[v] = 1 - color[u]; q.append(v)
                elif color[v] == color[u]:
                    return False
    return True`,
      complexity: { best: "O(1)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)", note: "Best case: a conflict on the first edge. Union-Find also works: union each node's neighbours together and check the node is never in their set." },
      traps: ["Graphs can be disconnected: start a BFS from every uncoloured node.", "Self-loops make a graph non-bipartite.", "Dislikes edges are undirected; add both directions."],
      viz: { make: () => S.bipartite() },
    },
  ],
};
