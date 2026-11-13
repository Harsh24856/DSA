// Overview of the "binary-tree" topic: the data structure or technique itself. Shown on /patterns/binary-tree before the patterns.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import type { TNode } from "../../sim";
import { nums, type TopicOverview } from "../types.ts";

/** A BST stored as arrays indexed by node id (ids in insertion order), so frames can refer to fixed nodes. */
type Bst = { val: number[]; L: (number | null)[]; R: (number | null)[]; nodes: TNode[] };
function bstOf(keys: number[]): { t: Bst; paths: number[][] } {
  const t: Bst = { val: [], L: [], R: [], nodes: [] }, paths: number[][] = [];
  for (const k of keys) {
    const path: number[] = []; let cur: number | null = t.val.length ? 0 : null, side: "L" | "R" | undefined;
    while (cur != null) { path.push(cur); side = k < t.val[cur] ? "L" : "R"; cur = side === "L" ? t.L[cur] : t.R[cur]; }
    const id = t.val.length, parent = path.length ? path[path.length - 1] : null;
    t.val.push(k); t.L.push(null); t.R.push(null); t.nodes.push({ id, label: String(k), parent, side: parent == null ? undefined : side });
    if (parent != null) { if (side === "L") t.L[parent] = id; else t.R[parent] = id; }
    paths.push(path);
  }
  return { t, paths };
}
const heightOf = (t: Bst, i: number | null): number => (i == null ? -1 : 1 + Math.max(heightOf(t, t.L[i]), heightOf(t, t.R[i])));
const inorderOf = (t: Bst, i: number | null, out: number[] = []): number[] => { if (i != null) { inorderOf(t, t.L[i], out); out.push(t.val[i]); inorderOf(t, t.R[i], out); } return out; };

function bstInsertViz(input?: string): Diagram {
  const keys = [...new Set(nums(input, [50, 30, 70, 20, 40, 60, 80, 35], 15))];
  const { t, paths } = bstOf(keys), frames: TreeFrame[] = [];
  keys.forEach((k, id) => {
    const path = paths[id];
    const steps = path.map((p) => `${k} ${k < t.val[p] ? "<" : ">"} ${t.val[p]} go ${k < t.val[p] ? "left" : "right"}`);
    const sub: Bst = { ...t, L: t.L.map((x) => (x != null && x <= id ? x : null)), R: t.R.map((x) => (x != null && x <= id ? x : null)) };
    const tones: Record<number, Tone> = { ...Object.fromEntries(keys.map((_, j) => [j, (j > id ? "muted" : "done") as Tone])), ...Object.fromEntries(path.map((p) => [p, "active" as Tone])), [id]: "found" };
    frames.push({ note: id === 0 ? `insert ${k}: the tree is empty, so ${k} becomes the root` : `insert ${k}: ${steps.join(", ")}, then the link is empty, so ${k} hangs there as a new leaf (${path.length} comparison${path.length > 1 ? "s" : ""}). Height now ${heightOf(sub, 0)}`, tones });
  });
  const h = heightOf(t, 0), best = Math.floor(Math.log2(keys.length));
  frames.push({ note: `Done: ${keys.length} keys, height ${h} edges. The best possible height for ${keys.length} keys is ${best}${h === best ? ", so this order happened to give a balanced tree" : `, so this order cost ${h - best} extra levels`}. Inorder reads the keys back sorted: [${inorderOf(t, 0).join(", ")}]`, tones: Object.fromEntries(keys.map((_, j) => [j, "done" as Tone])) });
  return { kind: "tree", title: "BST insert: walk down, add a leaf", nodes: t.nodes, frames };
}

function bstDeleteViz(): Diagram {
  const keys = [50, 30, 70, 20, 40, 60, 80, 35, 45, 65], { t } = bstOf(keys), frames: TreeFrame[] = [], gone = new Set<number>();
  let root: number | null = 0;
  const snap = (tones: Record<number, Tone> = {}) => ({ tones: { ...Object.fromEntries([...gone].map((g) => [g, "muted" as Tone])), ...tones }, labels: Object.fromEntries(t.val.map((v, i) => [i, String(v)])) });
  frames.push({ note: `The tree before any delete. Inorder: [${inorderOf(t, root).join(", ")}]`, ...snap() });
  // the real recursive delete; returns the new root of this subtree and records a frame at each decision
  const del = (i: number | null, key: number, path: number[], quiet = false): number | null => {
    if (i == null) return null;
    if (key !== t.val[i]) { const left = key < t.val[i]; if (left) t.L[i] = del(t.L[i], key, [...path, i], quiet); else t.R[i] = del(t.R[i], key, [...path, i], quiet); return i; }
    const at = Object.fromEntries([...path, i].map((p) => [p, "active" as Tone]));
    if (t.L[i] == null || t.R[i] == null) {
      const child = t.L[i] ?? t.R[i];
      if (!quiet) frames.push({ note: child == null ? `delete ${key}: search ${[...path, i].map((p) => t.val[p]).join(" to ")}. It has no children (case 1), so its parent's link simply becomes empty` : `delete ${key}: search ${[...path, i].map((p) => t.val[p]).join(" to ")}. It has one child, ${t.val[child]} (case 2), so the parent links straight to that child and the whole subtree moves up one level`, ...snap({ ...at, [i]: "bad", ...(child != null ? { [child]: "found" } : {}) }) });
      gone.add(i); return child;
    }
    let s = t.R[i]!; const walk = [s]; while (t.L[s] != null) { s = t.L[s]!; walk.push(s); }
    frames.push({ note: `delete ${key}: it has two children (case 3). Its inorder successor is the smallest key on its right: go right once, then left to the end: ${walk.map((w) => t.val[w]).join(" to ")}`, ...snap({ ...at, [i]: "bad", ...Object.fromEntries(walk.map((w) => [w, "window" as Tone])), [s]: "found" }) });
    const sv = t.val[s]; t.val[i] = sv;
    frames.push({ note: `Copy ${sv} into the node that held ${key}. Every key on the left is still smaller and every key on the right still larger, so the order holds. Now delete the old ${sv} below it, which has no left child, so it is case 1 or 2`, ...snap({ [i]: "found", [s]: "bad" }) });
    t.R[i] = del(t.R[i], sv, [], true);
    return i;
  };
  for (const k of [20, 60, 50]) { root = del(root, k, []); frames.push({ note: `After deleting ${k}: inorder is still sorted: [${inorderOf(t, root).join(", ")}]. Height ${heightOf(t, root)}`, ...snap() }); }
  return { kind: "tree", title: "BST delete: the three cases", nodes: t.nodes, frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **binary tree** is a set of nodes where each node holds a value and at most two links, `left` and `right`. One node, the **root**, has no parent. Every other node has exactly one parent, so there are n - 1 edges and no cycles. A node with no children is a **leaf**; the others are internal nodes.",
    "Vocabulary an interviewer will use: the **depth** of a node is the number of edges from the root down to it. The **height** of a node is the number of edges on the longest path from it down to a leaf, and the height of the tree is the height of the root (some books count nodes instead of edges, so say which one you mean). A **level** is the set of nodes at one depth. The **subtree** of a node is that node and everything below it.",
    "Shapes have names. A **full** tree: every node has 0 or 2 children. A **complete** tree: every level is full except maybe the last, which is filled from the left (this is the shape of a heap). A **perfect** tree: every internal node has 2 children and all leaves are on the same level, so it has 2^(h+1) - 1 nodes. A **balanced** tree: for every node, the heights of its two subtrees differ by at most 1, which keeps the height at O(log n). A **degenerate** tree is a chain: each node has one child, and height is n - 1.",
    "In memory a tree is usually a set of separate node objects joined by pointers, scattered across the heap. That makes inserting or cutting a subtree O(1) once you hold the node, but there is no index: to reach a node you walk from the root, one link per level. A complete tree can instead live in a plain array with no pointers at all: the children of index i sit at `2i + 1` and `2i + 2`, and its parent at `(i - 1) / 2`. LeetCode gives trees in level order with `null` for missing children, which is exactly this array with gaps.",
    "A **binary search tree (BST)** adds one rule: every key in a node's left subtree is smaller than the node, and every key in its right subtree is larger. That rule turns each step down into a decision that throws away a whole subtree, so search, insert and delete cost O(h). An inorder traversal of a BST visits the keys in sorted order, which is the fact most BST questions rest on.",
    "The catch is h. Insert keys in random order and h is about 2 ln n, so close to log n. Insert them sorted and every key goes right, giving a chain with h = n - 1, and the BST is now a slow linked list. **Self-balancing** BSTs fix this by repairing the shape after each change with **rotations**, small pointer swaps that keep the inorder order. An **AVL tree** keeps the two subtree heights of every node within 1, so h is at most about 1.44 log2 n. A **red-black tree** colours nodes and keeps every root-to-leaf path with the same number of black nodes and no two reds in a row, so the longest path is at most twice the shortest and h is at most 2 log2(n + 1). AVL is stricter and faster to search; red-black does fewer rotations on updates, which is why C++ `std::map` and Java `TreeMap` use it.",
  ],
  build: [
    "A node is three fields: `val`, `left`, `right`. Some problems add `parent`, a subtree `size` (for k-th smallest and rank queries) or a `height` (for AVL). The tree object only needs the `root` pointer, plus a count if you want `size()` in O(1).",
    "**Traversals.** Depth-first orders differ only in when you record the node: before both children (preorder), between them (inorder) or after both (postorder). Recursion uses the call stack, so it costs O(h) space; the iterative versions use an explicit stack: for inorder, push the whole left spine, pop one node, record it, then move to its right child. Breadth-first (level order) uses a queue; reading `len(queue)` at the start of each round separates the levels.",
    "**BST search and insert.** Start at the root and compare: smaller goes left, larger goes right. Search stops when it finds the key or falls off the tree. Insert walks the same path and, where the walk falls off, hangs a new leaf. New keys always become leaves, so the old structure never moves. Decide up front what to do with duplicates: refuse them, keep a count in the node, or always send equal keys to one side.",
    "**BST delete** has three cases. Case 1, the node is a leaf: unlink it. Case 2, it has one child: link its parent straight to that child. Case 3, it has two children: find its **inorder successor** (go right once, then left until you cannot), copy the successor's key into the node, then delete the successor from the right subtree. The successor has no left child, so that second delete is always case 1 or 2. The predecessor (left once, then right to the end) works just as well.",
    "**Keeping balance.** An AVL tree stores a height in every node. After an insert or delete it walks back up the path; wherever the two child heights differ by 2 it does a single rotation (the heavy side is on the outside: left-left or right-right) or a double rotation (the heavy side bends inward: left-right or right-left). A rotation moves one child up, the parent down, and hands one subtree across, all in O(1), and it never changes the inorder order. Red-black trees do the same with recolouring plus at most 2 rotations per insert and 3 per delete. In an interview you are almost never asked to code these; know what they guarantee and use the library.",
    "**Building.** From a sorted array, take the middle as the root and build both halves the same way: O(n) and perfectly balanced. From preorder plus inorder, the first preorder value is the root and its position in the inorder list splits the left and right subtrees; a hash map of inorder positions makes it O(n).",
  ],
  code: `from collections import deque

class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

class BST:
    """Binary search tree: every key in the left subtree < node.val < every key in the right subtree."""
    def __init__(self):
        self.root = None
        self.size = 0

    def search(self, key):              # O(h): one comparison per level
        node = self.root
        while node and node.val != key:
            node = node.left if key < node.val else node.right
        return node is not None

    def insert(self, key):              # O(h): walk down, hang the new leaf where the walk falls off
        if self.root is None:
            self.root = Node(key); self.size = 1; return True
        node = self.root
        while True:
            if key == node.val:
                return False            # no duplicates
            side = "left" if key < node.val else "right"
            nxt = getattr(node, side)
            if nxt is None:
                setattr(node, side, Node(key)); self.size += 1; return True
            node = nxt

    def delete(self, key):              # O(h)
        def go(node, key):
            if node is None:
                return None, False
            if key < node.val:
                node.left, done = go(node.left, key); return node, done
            if key > node.val:
                node.right, done = go(node.right, key); return node, done
            if node.left is None:       # case 1 and 2: no child or one child, lift the other side
                return node.right, True
            if node.right is None:
                return node.left, True
            succ = node.right           # case 3: two children, copy the inorder successor
            while succ.left:
                succ = succ.left
            node.val = succ.val
            node.right, _ = go(node.right, succ.val)
            return node, True
        self.root, done = go(self.root, key)
        self.size -= done
        return done

    def min(self):                      # leftmost node
        node = self.root
        while node and node.left:
            node = node.left
        return node.val if node else None

    def height(self, node="root"):      # edges on the longest root-to-leaf path; empty tree = -1
        node = self.root if node == "root" else node
        return -1 if node is None else 1 + max(self.height(node.left), self.height(node.right))

    def preorder(self):                 # node, left, right (iterative, explicit stack)
        out, stack = [], [self.root] if self.root else []
        while stack:
            node = stack.pop(); out.append(node.val)
            if node.right: stack.append(node.right)
            if node.left: stack.append(node.left)
        return out

    def inorder(self):                  # left, node, right: sorted order in a BST
        out, stack, node = [], [], self.root
        while stack or node:
            while node:
                stack.append(node); node = node.left
            node = stack.pop(); out.append(node.val); node = node.right
        return out

    def postorder(self):                # left, right, node: reverse of (node, right, left)
        out, stack = [], [self.root] if self.root else []
        while stack:
            node = stack.pop(); out.append(node.val)
            if node.left: stack.append(node.left)
            if node.right: stack.append(node.right)
        return out[::-1]

    def level_order(self):              # BFS, one list per depth
        out, q = [], deque([self.root] if self.root else [])
        while q:
            out.append([])
            for _ in range(len(q)):
                node = q.popleft(); out[-1].append(node.val)
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
        return out`,
  ops: [
    { title: "Any binary tree (no ordering rule); h = height, w = widest level", rows: [
      ["Find a value", "O(n)", "O(n)", "no order to follow, so every node may need a look"],
      ["Preorder, inorder, postorder", "O(n)", "O(n)", "each node visited once; O(h) stack space"],
      ["Level order (BFS)", "O(n)", "O(n)", "each node queued once; O(w) queue space, up to n / 2 for the last level"],
      ["Height, size, sum, max", "O(n)", "O(n)", "postorder: each node combines its two children's answers"],
      ["Insert a child under a node you hold", "O(1)", "O(1)", "set one pointer"],
      ["Remove a subtree you hold", "O(1)", "O(1)", "unlink it from its parent (freeing it is O(size) in C++)"],
      ["Lowest common ancestor", "O(n)", "O(n)", "one postorder pass that reports which targets were found below"],
      ["Serialize or deserialize", "O(n)", "O(n)", "preorder or level order with null markers"],
      ["Build from preorder + inorder", "O(n)", "O(n)", "hash map of inorder positions; O(n^2) without it"],
      ["Array-stored complete tree: parent or child of index i", "O(1)", "O(1)", "children 2i + 1 and 2i + 2, parent (i - 1) / 2"],
    ] },
    { title: "Plain binary search tree (average: random insert order; worst: a chain)", rows: [
      ["Search", "O(log n)", "O(n)", "one comparison per level drops a whole subtree"],
      ["Insert", "O(log n)", "O(n)", "walk down to an empty link and hang a leaf"],
      ["Delete a leaf", "O(log n)", "O(n)", "the cost is finding it; unlinking is O(1)"],
      ["Delete a node with one child", "O(log n)", "O(n)", "parent links straight to the child"],
      ["Delete a node with two children", "O(log n)", "O(n)", "find the successor (still one path down), copy it, delete it"],
      ["Min or max", "O(log n)", "O(n)", "follow left (or right) links to the end"],
      ["Successor or predecessor", "O(log n)", "O(n)", "leftmost of the right subtree, else the nearest ancestor you went left from"],
      ["Floor or ceiling of x", "O(log n)", "O(n)", "search for x and remember the last node on the correct side"],
      ["K-th smallest", "O(h + k)", "O(n)", "inorder and stop at k; O(h) if every node stores its subtree size"],
      ["Range query [lo, hi]", "O(h + k)", "O(n)", "skip subtrees that lie outside the range; k = keys reported"],
      ["Sorted output", "O(n)", "O(n)", "inorder traversal"],
      ["Validate the BST rule", "O(n)", "O(n)", "pass a (low, high) window down, or check inorder is increasing"],
      ["Build by n inserts", "O(n log n)", "O(n^2)", "sorted input is the worst case"],
      ["Build from a sorted array", "O(n)", "O(n)", "middle as root, recurse on halves: perfectly balanced"],
    ] },
    { title: "Self-balancing BST (AVL, red-black): h is O(log n) always", rows: [
      ["Search, min, max, floor, ceiling", "O(log n)", "O(log n)", "AVL height at most about 1.44 log2 n, red-black at most 2 log2(n + 1)"],
      ["Insert", "O(log n)", "O(log n)", "at most 2 rotations in both kinds, plus recolouring or height updates up the path"],
      ["Delete", "O(log n)", "O(log n)", "red-black: at most 3 rotations; AVL: up to O(log n) rotations"],
      ["One rotation", "O(1)", "O(1)", "three pointer changes; inorder order is unchanged"],
      ["Iterate in sorted order", "O(n)", "O(n)", "amortised O(1) per step of the iterator"],
    ] },
  ],
  builtins: [
    ["Tree node type", "none: write `struct TreeNode` (LeetCode supplies one)", "none: a small class (LeetCode supplies `TreeNode`)"],
    ["Ordered set (balanced BST)", "`std::set<int>`, `std::multiset<int>`", "no stdlib one; `sortedcontainers.SortedList` (available on LeetCode)"],
    ["Ordered map", "`std::map<K, V>` (red-black tree)", "`sortedcontainers.SortedDict`; `dict` keeps insertion order, not key order"],
    ["Floor and ceiling", "`s.lower_bound(x)`, `s.upper_bound(x)`, then `prev(it)` for floor", "`bisect_left` / `bisect_right` on a sorted list or `SortedList`"],
    ["K-th smallest, rank", "`__gnu_pbds::tree` with `find_by_order` / `order_of_key` (GCC only)", "`SortedList[k]`, `SortedList.bisect_left(x)`"],
    ["Complete tree in an array (heap)", "`std::priority_queue`, `std::make_heap`", "`heapq`"],
    ["Queue for level order", "`std::queue<TreeNode*>`", "`collections.deque` with `popleft()`"],
  ],
  when: [
    "The input is a `TreeNode* root`: decide first whether the answer flows down (preorder, pass it as a parameter) or up (postorder, return it).",
    "\"Level by level\", \"right side view\", \"minimum depth\", \"zigzag\": BFS with a queue, one round per level.",
    "The tree is a BST and the task mentions sorted order, k-th smallest, or neighbours of a value: inorder traversal.",
    "You need a sorted collection that changes while you query floor, ceiling or the next larger key: a balanced BST (`std::set`, `SortedList`).",
    "\"Any path\", \"diameter\", \"maximum path sum\": postorder where each node returns its best downward path and updates a global answer through it.",
    "Two traversal orders are given and you must rebuild the tree: preorder or postorder gives the root, inorder splits the rest.",
    "Hierarchies (folders, org charts, expression trees, decision trees) are trees, even when the word does not appear.",
  ],
  avoid: [
    "You only need membership or counts with no order: a hash set or hash map is O(1) on average and simpler.",
    "You only ever need the smallest or largest item: a heap is lighter than a balanced BST and has a cache-friendly array layout.",
    "Keys are small integers in a known range and you need range sums: a Fenwick tree or segment tree over an array.",
    "The data is fixed once built and queries are by value: a sorted array with binary search beats a pointer tree on memory and speed.",
    "Prefix questions on strings: a trie, not a BST of whole strings.",
  ],
  tips: [
    "Say whether height counts edges or nodes, and handle the empty tree (`root == null`) on the first line.",
    "Checking only `left.val < node.val < right.val` does not validate a BST: a key deep in the left subtree can still be larger than the root. Pass a (low, high) window down instead.",
    "Recursion depth equals the height: a 10^5 node chain overflows Python's default limit of 1000. Use an explicit stack, or raise the limit when the tree may be skewed.",
    "Never say BST operations are O(log n) without the word balanced. A plain BST is O(h), and h can be n.",
    "For path questions, separate what a node returns to its parent (a single downward path) from what it records in the global answer (a path that bends through it).",
    "In level order, read `len(queue)` before the inner loop; the queue grows while you process the level.",
    "When deleting from a BST, return the new subtree root from the recursive call and assign it to `node.left` or `node.right`; forgetting the assignment leaves the old link in place.",
    "LeetCode level-order input skips the children of null nodes, so it is not the same as the full heap array; use the queue-based builder.",
  ],
  viz: [
    { name: "BST insert", make: bstInsertViz, input: "50, 30, 70, 20, 40, 60, 80, 35", label: "keys to insert in order, comma separated" },
    { name: "BST delete (3 cases)", make: () => bstDeleteViz() },
    { name: "Sorted inserts make a chain", make: bstInsertViz, input: "10, 20, 30, 40, 50, 60, 70", label: "keys to insert in order, comma separated" },
  ],
};
