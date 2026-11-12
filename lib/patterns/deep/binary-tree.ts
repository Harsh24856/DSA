// Deeper theory for the "binary-tree" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import { levelTree, type TNode } from "../../sim";
import type { Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "All three depth-first orders walk the same path around the tree. Picture a pencil tracing the outline of the tree, starting left of the root. It passes every node three times: on the way down, between the two children, and on the way back up. Preorder records the first pass, inorder the second, postorder the third. That is why one recursive function with the visit moved to a different line produces all three.",
    "The iterative inorder loop keeps one invariant: the stack holds exactly the ancestors of `cur` whose left subtree is still being explored and who have not been output yet. Pushing the whole left spine, popping one node, then moving to its right child preserves this. When both `cur` and the stack are empty, every node has been output once, so the loop is complete and correct.",
    "Each node is pushed once and popped once, and each edge is followed once, so the time is O(n) for every order. Space is the stack depth, which is the height h: O(log n) for a balanced tree and O(n) for a chain. BFS keeps a whole level in the queue, so it uses O(w), where w is the widest level; a complete tree has about n / 2 nodes on its last level.",
    "Pick the order by what the visit needs. If a node needs information from its parent (depth, a path so far, a copy being built), use preorder. If it needs sorted order in a BST, use inorder. If it needs results from its children (height, size, deleting a tree safely), use postorder. If the question mentions levels, distance from the root or the first node seen from a side, use BFS.",
    "Common bugs: in iterative preorder, push the right child before the left so the left is popped first. Iterative postorder is easiest as a preorder of (node, right, left) reversed at the end. Do not mark nodes as visited in a tree traversal; a tree has no cycles, so a visited set only wastes memory. When the input can be a skewed tree of 10⁵ nodes, prefer the iterative form to avoid stack overflow.",
    "The traversals are the base of the rest of this topic. Post-order recursion is postorder with a return value. Views and levels are BFS with a level snapshot. Construction reverses a traversal. Morris traversal is inorder with the stack replaced by temporary links inside the tree.",
  ],
  2: [
    "A post-order function defines a fact about a subtree and computes it from the same fact about the two child subtrees. Correctness is an induction on height. A null subtree has a known base value. If the function returns the right value for both children, the combine step gives the right value for the node. So it is right for every node, including the root.",
    "The key design question is what to return. Often the answer to the problem is not something the parent can use. The diameter is a path that may bend at a node, but a parent can only extend a straight downward path. So the function returns the height (a straight path) and updates a separate best value with the bent path `left + right`. Maximum path sum follows the same split, with negative child paths clamped to 0.",
    "The cost is O(n) because each node does constant work after its two calls return. A common slow solution calls a height function from inside another recursive function, as in a naive balanced check. Each node then recomputes heights of its whole subtree, which is O(n²) on a chain. Returning the height and a flag together (or -1 for unbalanced) fixes it in one pass.",
    "Recognise it when the question asks about every subtree, or about a path that can pass through any node. Words like height, depth, balanced, diameter, sum of a subtree, count of good nodes or tilt are strong signals. If the answer needs several facts per node (sum and count for an average, min and max for a BST check), return a tuple.",
    "Edge cases: an empty tree, a single node, and all-negative values for max path sum, where the answer is the largest single node, not 0. Keep the global best as a nonlocal variable or a one-element list in Python; rebinding a plain local inside the inner function silently creates a new variable.",
    "This is the tree version of dynamic programming. When a node's answer depends on choosing states for itself and its children (rob or skip, camera or no camera), it becomes tree DP, and when every node must be treated as the root, it becomes rerooting. Both are later patterns.",
  ],
  3: [
    "BFS with a queue processes nodes in order of depth. The invariant is that at the start of each round the queue holds exactly one full level, in left to right order. Reading `len(queue)` before the round fixes how many pops belong to this level; every child pushed during the round belongs to the next one.",
    "Views follow from this invariant. The right view is the last node popped in each level (or the first, if you push the right child first). The left view is the first. Zigzag order is ordinary BFS where every other level's list is reversed before it is stored. Averages, maximums and sums per level are a fold over each round.",
    "Width needs positions, not just nodes. Give the root index 0 and children `2i + 1` and `2i + 2`, as in an array heap. The width of a level is the last index minus the first plus one. On a deep skewed tree these indices double each level and overflow 64-bit numbers, so subtract the first index of the level from every index before computing children.",
    "Time is O(n), each node entering and leaving the queue once. Space is the largest level, which is at most about n / 2. A DFS that carries the depth can also build level lists (append to `levels[depth]`); it uses O(h) stack instead of O(w) queue, which is better for wide, shallow trees.",
    "Typical mistakes: using a Python list with `pop(0)`, which is O(n) per pop; checking `len(q)` inside the inner loop, which mixes levels; and pushing None children, which then need extra checks. Vertical order needs both a column and a row per node, then a sort, because BFS order alone does not break ties correctly.",
    "Level-order BFS on a tree is the same algorithm as BFS on a graph without the visited set. Connecting next pointers, finding the minimum depth (stop at the first leaf), and serialising by levels are all small changes to the same loop.",
  ],
  4: [
    "Tree path questions split into two directions. Top-down problems pass state from the root toward the leaves: the remaining target, the path so far, the maximum seen on the path. Bottom-up problems return results toward the root: whether p or q was found below, or the best path ending here. Decide which direction the information flows before writing code.",
    "The recursive LCA works because of what each call returns. A call returns p or q if its subtree contains exactly that one, the LCA if it contains both, and null if it contains neither. At a node where the left call and the right call are both non-null, p and q lie in different subtrees, so this node is the lowest one that contains both. If only one side is non-null, the answer is on that side or is the found node itself.",
    "The function assumes both p and q are in the tree. If one might be missing, the shortcut that returns a node as soon as it equals p is wrong, because it never checks whether q is below. In that case count how many targets each subtree contains and accept the node only when the count reaches 2.",
    "For path sums that may start and end anywhere on a downward path, keep prefix sums along the current root-to-node path in a counter, exactly as in the array problem of subarrays that sum to k. Add the current prefix before recursing and remove it after, so the counter only describes the current path. This turns an O(n²) double recursion into O(n).",
    "Cost: every node is visited once, so O(n) time and O(h) stack. Recording all root-to-leaf paths costs O(n · h) in the worst case because each path is copied. In a BST, the LCA needs no search of both sides: walk down from the root while both values are on the same side; the first split point is the LCA, in O(h).",
    "When the question needs distances in every direction (all nodes at distance k from a target), the tree is really an undirected graph. Record each node's parent with one traversal, then run BFS from the target. For many LCA queries on a fixed tree, binary lifting answers each in O(log n) after O(n log n) preprocessing.",
  ],
  5: [
    "Preorder lists a root before everything in its subtree; inorder lists the left subtree, then the root, then the right subtree. So the first preorder value is the root, and finding that value in inorder splits the inorder list into the exact sets of left and right values. Both parts have known sizes, so the preorder list splits at the same sizes. Induction on size shows the recursion rebuilds the unique tree, as long as values are distinct.",
    "Consuming preorder with a single moving index (or an iterator) works because the recursion builds nodes in preorder: root, then all of the left subtree, then all of the right subtree. That is why the left call must come before the right call. With postorder the root is the last value, so read from the end and build the right subtree first.",
    "Preorder and postorder alone do not define a unique binary tree: a node with one child could have it on either side. Any traversal plus inorder does, because inorder separates left from right. A BST is special: its inorder is the sorted values, so preorder alone is enough, and it can be rebuilt in O(n) with an upper bound passed down.",
    "Serialisation needs null markers so that the shape is recorded, not just the values. Preorder with markers writes 2n + 1 tokens and reads back with the same recursion. Level order with markers matches the LeetCode format. Either way the decoder must read tokens in exactly the order the encoder wrote them.",
    "Complexity is O(n) with a value to index map. Scanning the inorder list for each root instead is O(n²) on a skewed tree. Slicing lists in Python at each call also costs O(n) per level, giving O(n²) in the worst case; pass index bounds instead.",
    "Related constructions use the same split idea. A sorted array becomes a height-balanced BST by taking the middle as root. A maximum binary tree takes the largest value as root, and a monotonic stack builds it in O(n). Flattening a tree to a linked list in preorder is the reverse direction: it destroys structure in the same order construction creates it.",
  ],
  6: [
    "The BST property is global: every value in the left subtree is smaller than the node and every value in the right subtree is larger. Checking only direct children misses a grandchild on the wrong side of the root. Passing an allowed open interval (low, high) down the recursion encodes every ancestor's constraint at once: going left tightens high, going right tightens low.",
    "Inorder traversal of a BST yields the values in sorted order. Proof by induction: the left subtree's values are all smaller and come out first in sorted order, then the node, then the larger right subtree in sorted order. This turns many BST questions into array questions: kth smallest, validating (each value must exceed the previous), the minimum difference between nodes, or two-sum with two iterators.",
    "Search, insert and delete each follow one root-to-leaf path, so they cost O(h). Delete has three cases. A leaf is removed. A node with one child is replaced by that child. A node with two children takes the value of its inorder successor (the leftmost node of its right subtree), and that successor, which has no left child, is then deleted from the right subtree.",
    "The height is the risk. Inserting sorted values builds a chain with h = n, so every operation becomes O(n). Balanced trees (AVL, red-black) keep h = O(log n) with rotations; in C++ `std::set` and `std::map` are red-black trees, and in Python you would use a sorted container or bisect on a list.",
    "Edge cases: duplicates (decide whether they go left, right or are rejected, and make the bounds match), values at the integer limits (use null bounds or 64-bit sentinels instead of INT_MIN and INT_MAX), and an empty tree. For the BST iterator, keep a stack of the left spine; `next` is amortised O(1) because each node is pushed and popped once.",
    "A BST is binary search stored as a tree. Lower bound, floor and ceiling queries walk down while remembering the best candidate seen, exactly like binary search on an array. LCA in a BST and range sums use the ordering to skip whole subtrees.",
  ],
};

/* ---------- visualisers for the new patterns (real runs, one frame per step) ---------- */

const keep = (ids: number[], t: Tone) => Object.fromEntries(ids.map((x) => [x, t])) as Record<number, Tone>;

function rerootViz(): Diagram {
  const n = 6, edges = [[0, 1], [0, 2], [2, 3], [2, 4], [2, 5]];
  const adj: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const parent = Array(n).fill(-1), order = [0];
  for (let k = 0; k < order.length; k++) { const u = order[k]; for (const v of adj[u]) if (v !== parent[u]) { parent[v] = u; order.push(v); } }
  const nodes: TNode[] = order.map((u) => ({ id: u, label: String(u), parent: parent[u] < 0 ? null : parent[u] }));
  const size = Array(n).fill(1), down = Array(n).fill(0), ans = Array(n).fill(0), frames: TreeFrame[] = [], done: number[] = [];
  const badges: Record<number, string> = {};
  for (const u of [...order].reverse()) {
    for (const v of adj[u]) if (v !== parent[u]) { size[u] += size[v]; down[u] += down[v] + size[v]; }
    badges[u] = `s${size[u]} d${down[u]}`;
    frames.push({ note: `Pass 1, node ${u}: size ${size[u]}, sum of distances to its own subtree ${down[u]} (each child adds its sum plus its size, one edge per node)`, tones: { ...keep(done, "done"), [u]: "active" }, badges: { ...badges } });
    done.push(u);
  }
  const fixed: number[] = [];
  for (const u of order) {
    ans[u] = parent[u] < 0 ? down[u] : ans[parent[u]] - size[u] + (n - size[u]);
    badges[u] = `ans ${ans[u]}`;
    frames.push({ note: parent[u] < 0 ? `Pass 2, root ${u}: its answer is its subtree sum, ${ans[u]}` : `Pass 2, move the root from ${parent[u]} to ${u}: ${size[u]} node${size[u] === 1 ? "" : "s"} get 1 closer, ${n - size[u]} get 1 farther: ${ans[parent[u]]} - ${size[u]} + ${n - size[u]} = ${ans[u]}`, tones: { ...keep(fixed, "found"), [u]: "active" }, badges: { ...badges } });
    fixed.push(u);
  }
  return { kind: "tree", title: "Rerooting: sum of distances from every node", nodes, frames };
}

function liftViz(): Diagram {
  const parent = [-1, 0, 0, 1, 1, 2, 3, 3, 6, 8], n = parent.length, LOG = n.toString(2).length;
  const nodes: TNode[] = parent.map((p, v) => ({ id: v, label: String(v), parent: p < 0 ? null : p }));
  const up: number[][] = [parent.slice()];
  for (let j = 1; j < LOG; j++) up.push(up[j - 1].map((p) => (p < 0 ? -1 : up[j - 1][p])));
  const depth = Array(n).fill(0); for (let v = 1; v < n; v++) depth[v] = depth[parent[v]] + 1;
  const frames: TreeFrame[] = up.map((row, j) => ({ note: j === 0 ? `up[0][v] is the parent. The badge shows it (- for none).` : `up[${j}][v] = up[${j - 1}][up[${j - 1}][v]]: two jumps of ${2 ** (j - 1)} make one jump of ${2 ** j}`, badges: Object.fromEntries(row.map((p, v) => [v, `${2 ** j}↑${p < 0 ? "-" : p}`])) }));
  let a = 9, b = 5; const path: number[] = [a, b];
  const diff = depth[a] - depth[b];
  frames.push({ note: `LCA(${a}, ${b}): depths ${depth[a]} and ${depth[b]}. Lift ${a} by ${diff} = binary ${diff.toString(2)}`, tones: { [a]: "active", [b]: "active" } });
  for (let j = 0; j < LOG; j++) if ((diff >> j) & 1) { const to = up[j][a]; frames.push({ note: `Bit ${j} of ${diff} is set: jump ${a} up ${2 ** j} to ${to}`, tones: { ...keep(path, "done"), [to]: "active", [b]: "active" } }); a = to; path.push(a); }
  for (let j = LOG - 1; j >= 0 && a !== b; j--) {
    const pa = up[j][a], pb = up[j][b];
    if (pa !== pb) { frames.push({ note: `up[${j}]: ${a} goes to ${pa}, ${b} goes to ${pb}. Different, so both jump`, tones: { ...keep(path, "done"), [pa]: "active", [pb]: "active" } }); a = pa; b = pb; path.push(a, b); }
    else frames.push({ note: `up[${j}]: both would land on ${pa < 0 ? "nothing" : pa}. That is at or above the LCA, so do not jump`, tones: { ...keep(path, "done"), [a]: "active", [b]: "active" } });
  }
  const l = a === b ? a : up[0][a];
  frames.push({ note: `Now ${a} and ${b} are just below the meeting point, so the LCA is their parent ${l}. O(log n) per query`, tones: { ...keep(path, "done"), [l]: "found" } });
  return { kind: "tree", title: "Binary lifting: jump by powers of two", nodes, frames };
}

function morrisViz(): Diagram {
  const vals = [4, 2, 6, 1, 3, 5, 7], { nodes, kids } = levelTree(vals);
  const left = (i: number) => kids[i][0], right: Record<number, number | null> = Object.fromEntries(nodes.map((nd) => [nd.id, kids[nd.id][1]]));
  const frames: TreeFrame[] = [], out: number[] = [], badges: Record<number, string> = {};
  let cur: number | null = 0;
  while (cur != null) {
    const c: number = cur;
    if (left(c) == null) { out.push(c); frames.push({ note: `${vals[c]} has no left child: visit it (out ${out.map((x) => vals[x]).join(" ")}), go right`, tones: { ...keep(out, "done"), [c]: "active" }, badges: { ...badges } }); cur = right[c]; continue; }
    let pre = left(c)!; while (right[pre] != null && right[pre] !== c) pre = right[pre]!;
    if (right[pre] == null) { right[pre] = c; badges[pre] = `→${vals[c]}`; frames.push({ note: `Predecessor of ${vals[c]} is ${vals[pre]}. Thread ${vals[pre]}.right to ${vals[c]} so we can come back, then go left`, tones: { ...keep(out, "done"), [c]: "active", [pre]: "window" }, badges: { ...badges } }); cur = left(c); }
    else { right[pre] = null; delete badges[pre]; out.push(c); frames.push({ note: `Back at ${vals[c]} through the thread: left side is done. Remove the thread, visit ${vals[c]}, go right`, tones: { ...keep(out, "done"), [c]: "found", [pre]: "window" }, badges: { ...badges } }); cur = right[c]; }
  }
  frames.push({ note: `Inorder ${out.map((x) => vals[x]).join(" ")} with O(1) extra memory. Every thread was removed, so the tree is unchanged`, tones: keep(out, "done") });
  return { kind: "tree", title: "Morris inorder: threads instead of a stack", nodes, frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 7, name: "Tree DP and rerooting", summary: "Compute a subtree answer for every node bottom-up, then push answers top-down so each node gets the value it would have as the root.",
    signals: ["sum of distances from every node", "the best root, minimum height trees", "an answer for every node that depends on the whole tree", "n up to 10⁵, so O(n²) running a DFS from each node is too slow"],
    idea: ["First pass (post-order from any root): for each node compute facts about its own subtree, such as size and the sum of distances to the nodes below it.", "Second pass (pre-order): when the root moves from a parent p to a child c, the size[c] nodes in c's subtree get one edge closer and the other n - size[c] nodes get one edge farther. So ans[c] = ans[p] - size[c] + (n - size[c]).", "In general, rerooting needs the parent's answer with the child's contribution removed, then combined as if the parent were one more child."],
    steps: ["Root the tree anywhere; record parent and a BFS order", "Pass 1 in reverse order: size[u], down[u] from children", "ans[root] = down[root]", "Pass 2 in order: ans[c] from ans[parent] with the move formula"],
    code: `def sum_of_distances(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b); adj[b].append(a)
    parent, order = [-1] * n, [0]
    for u in order:                       # BFS: parents before children
        for v in adj[u]:
            if v != parent[u]:
                parent[v] = u; order.append(v)
    size, ans = [1] * n, [0] * n
    for u in reversed(order):             # pass 1: subtree size and sum
        p = parent[u]
        if p >= 0:
            size[p] += size[u]
            ans[p] += ans[u] + size[u]
    for u in order[1:]:                   # pass 2: move the root to u
        ans[u] = ans[parent[u]] - size[u] + (n - size[u])
    return ans`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Two linear passes. Running a separate DFS from every node would be O(n²)." },
    traps: ["Pass 2 must go parent before child; pass 1 child before parent. A BFS order serves both, reversed for pass 1.", "Recursive DFS on a path of 10⁵ nodes overflows the stack in Python and can in C++; the iterative order avoids it.", "When the combine is max rather than sum, you cannot subtract a child's part; keep the best and second best child values, or prefix and suffix maxima over children."],
    viz: { make: () => rerootViz() },
    theory: [
      "Plain tree DP answers a question for one root. Rerooting answers it for every root in the same O(n). The trick is that the trees rooted at a parent and at its child differ in only one edge's direction, so the child's answer can be derived from the parent's in O(1) or O(degree).",
      "Proof of the sum of distances formula. Let p be the root with answer ans[p], and c a child. Cutting the edge p-c splits the nodes into c's subtree (size[c] nodes) and the rest (n - size[c] nodes). Moving the root across that edge shortens every path to the first group by one and lengthens every path to the second group by one. Nothing else changes, so ans[c] = ans[p] - size[c] + (n - size[c]).",
      "The general recipe has three parts. Define down[u], the answer for u's subtree alone. Define up[u], the contribution of everything outside u's subtree, seen from u. Then the full answer is combine(down[u], up[u]). up[c] is built from up[p] and the down values of c's siblings. With sums you subtract the child; with max or min you need the top two children, or prefix and suffix arrays over the child list, since max cannot be undone.",
      "Recognise it when the problem asks for a value at every node (or the best node) and the value depends on the whole tree: sum of distances, the farthest node from each node, the root that minimises height, or counting nodes reachable under some rule. If a single DFS per node would work but n is large, rerooting is the upgrade.",
      "Minimum height trees is the same idea with heights: the best roots are the centres of the longest path. You can find them by rerooting heights, or by peeling leaves layer by layer (a topological sort on an undirected tree) until one or two nodes remain.",
      "This builds on post-order recursion (pattern 2): pass 1 is exactly that. It also connects to DP on trees in the DP topic, where each node keeps several states, and to prefix sums: removing one child's share from the parent is the same move as removing one element from a total.",
    ],
  },
  {
    n: 8, name: "Binary lifting (k-th ancestor, LCA)", summary: "Store each node's ancestor 1, 2, 4, 8 … levels up. Any jump of k levels is a few of these, so k-th ancestor and LCA queries cost O(log n).",
    signals: ["k-th ancestor of a tree node", "many LCA queries on a fixed tree", "distance between two nodes, answered many times", "jump k steps along a functional graph (each node has one successor)"],
    idea: ["up[0][v] is the parent. up[j][v] = up[j-1][up[j-1][v]]: two jumps of 2^(j-1) make one jump of 2^j.", "k-th ancestor: write k in binary and jump 2^j for every set bit j.", "LCA(a, b): lift the deeper node to the other's depth. If they meet, done. Otherwise, from the largest j down, jump both when their 2^j ancestors differ. They end just below the LCA, so the answer is their parent."],
    steps: ["parent array and depth of every node", "LOG = bit length of n; build up[j] for j = 1..LOG-1", "kth(v, k): for each set bit j of k, v = up[j][v]", "lca: equalise depths, then jump both from high j to low"],
    code: `class Lifting:
    def __init__(self, parent):            # parent[root] = -1
        n = len(parent)
        self.LOG = max(1, n.bit_length())
        self.up = [parent[:]]
        for _ in range(1, self.LOG):
            p = self.up[-1]
            self.up.append([-1 if p[v] < 0 else p[p[v]] for v in range(n)])
        kids = [[] for _ in range(n)]
        for v, p in enumerate(parent):
            if p >= 0: kids[p].append(v)
        self.depth, order = [0] * n, [parent.index(-1)]
        for u in order:
            for v in kids[u]:
                self.depth[v] = self.depth[u] + 1; order.append(v)

    def kth(self, v, k):                   # -1 if there is no such ancestor
        if k >= len(self.depth): return -1
        for j in range(self.LOG):
            if k >> j & 1:
                v = self.up[j][v]
                if v < 0: return -1
        return v

    def lca(self, a, b):
        if self.depth[a] < self.depth[b]: a, b = b, a
        a = self.kth(a, self.depth[a] - self.depth[b])
        if a == b: return a
        for j in range(self.LOG - 1, -1, -1):
            if self.up[j][a] != self.up[j][b]:
                a, b = self.up[j][a], self.up[j][b]
        return self.up[0][a]`,
    complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(n log n)", note: "Per query, after O(n log n) preprocessing. One LCA query alone is cheaper with a single O(n) DFS." },
    traps: ["Jumping from a node that is already -1 (above the root) must stay -1, not index the array with -1 (Python would silently read the last element).", "In the LCA loop, jump only when the two ancestors DIFFER; jumping when they are equal can skip past the LCA.", "LOG must cover the largest depth: depth < n, so n.bit_length() levels are enough."],
    viz: { make: () => liftViz() },
    theory: [
      "Binary lifting is doubling applied to a tree. Every number k is a sum of distinct powers of two, so a walk of k steps up the tree is at most log k jumps, if you know where each power-of-two jump lands. The table up[j][v] stores exactly that, and each row is built from the row below it in O(n), giving O(n log n) for the whole table.",
      "Why the LCA loop is correct. After equalising depths, a and b are at the same depth and different. For any j, their 2^j ancestors are either equal (then the jump would land on or above the LCA) or different (then the LCA is still strictly above both). Going from the largest j down and jumping only on 'different' is a binary search on the distance to the LCA: it climbs as far as possible while staying below it. At the end a and b are distinct children of the LCA, so up[0][a] is the answer.",
      "Recognise it by repeated queries on a static tree: the k-th ancestor, LCA of many pairs, or the distance depth[a] + depth[b] - 2 · depth[lca]. The same table works on any graph where each node has one successor (a functional graph): 'where am I after k steps' is answered by the same bit decomposition, which is how jump pointers handle simulations of 10¹⁸ steps.",
      "Complexity: building is O(n log n) time and memory; each query is O(log n). For n = 10⁵, LOG is 17, so the table has 1.7 million entries, which is fine. If memory is tight or queries are offline, Tarjan's offline LCA with union-find answers all queries in near O(n + q). An Euler tour plus a sparse table gives O(1) per query after O(n log n).",
      "Pitfalls: building depths requires parents before children, so use a BFS order rather than assuming parent[v] < v. Keep -1 as a fixed point (the ancestor of 'none' is 'none'). For a single LCA query, the recursive LCA in pattern 4 is simpler and O(n).",
      "Binary lifting connects to fast exponentiation (the same bit decomposition of k), to sparse tables for range minimum queries (the same doubling table over an array), and to the paths and LCA pattern, which it speeds up when there are many queries.",
    ],
  },
  {
    n: 9, name: "Morris traversal (O(1) space)", summary: "Inorder or preorder without a stack or recursion: temporarily link each node's inorder predecessor back to it, use the link to return, then remove it.",
    signals: ["traversal in O(1) extra space", "follow-up: can you do it without recursion or a stack", "kth smallest in a BST with constant memory", "recover a BST with two swapped nodes in O(1) space"],
    idea: ["If cur has no left child, visit it and go right.", "Otherwise find its inorder predecessor: the rightmost node of cur's left subtree. If that node's right pointer is empty, point it at cur (a thread) and go left.", "If the predecessor already points at cur, we have come back after finishing the left subtree: remove the thread, visit cur, go right."],
    steps: ["cur = root", "no left child: visit, cur = cur.right", "find predecessor pre (rightmost in left subtree, stopping at cur)", "pre.right empty: thread it, go left; pre.right == cur: unthread, visit, go right"],
    code: `def morris_inorder(root):
    out, cur = [], root
    while cur:
        if not cur.left:
            out.append(cur.val)
            cur = cur.right
        else:
            pre = cur.left
            while pre.right and pre.right is not cur:
                pre = pre.right
            if not pre.right:
                pre.right = cur           # thread back to cur
                cur = cur.left
            else:
                pre.right = None          # second visit: unthread
                out.append(cur.val)
                cur = cur.right
    return out`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Each edge is walked at most a few times while finding predecessors, so the total stays linear. The output list is not counted as extra space." },
    traps: ["The predecessor search must stop at cur too, or it follows the thread back up and loops forever.", "Breaking out of the loop early (kth smallest) leaves threads in the tree; finish the walk or undo them if the tree must stay intact.", "For preorder, visit cur when you CREATE the thread, not when you remove it."],
    viz: { make: () => morrisViz() },
    theory: [
      "A recursive or stack-based inorder needs O(h) memory to remember where to return after finishing a left subtree. Morris traversal stores that return address inside the tree. In a binary tree with n nodes there are n + 1 null child pointers, and the right pointer of every node's inorder predecessor is one of them. That free pointer can hold a link back to the node.",
      "Correctness. When cur has a left subtree, its inorder predecessor pre is the last node of that subtree to be visited, and pre.right is null in the original tree. Threading pre.right to cur means that after the traversal finishes pre, following right leads back to cur at exactly the moment inorder wants to visit cur. On that second arrival the thread is found, removed and cur is visited. So every node is output exactly when the stack version would output it, and every thread is undone, restoring the tree.",
      "Why it is still O(n). Finding a predecessor walks down the right spine of a left subtree. Each node is on the right spine of at most one left subtree, and that spine is walked twice (once to thread, once to unthread). So the total walking is at most about 3n steps, even though a single iteration can take long.",
      "Variants. Morris preorder outputs cur when the thread is created (first arrival) instead of when it is removed. Reverse inorder (right, node, left, mirrored threads) gives descending order, which solves 'convert BST to greater tree' in O(1) space. Recovering a BST with two swapped nodes uses Morris inorder while tracking the previous value to spot the two inversions.",
      "When not to use it. The tree is modified during the walk, so it is unsafe if other threads read the tree concurrently, and stopping early leaves stray links. In interviews it is usually a follow-up question; the stack version is clearer and the expected default. Postorder with Morris exists but is fiddly (it reverses right spines), and rarely asked.",
      "Morris traversal shares an idea with linked list problems: reusing existing pointers as temporary storage and restoring them afterwards, like reversing half a list to check a palindrome and reversing it back.",
    ],
  },
];
