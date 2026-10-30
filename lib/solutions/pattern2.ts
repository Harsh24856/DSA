// Hand-written solutions for the slugs listed under "pattern2" in batches.json (questions from the pattern practice lists). See arrays.ts for the style.
import type { CellsFrame, Diagram, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { bin, levelTree, range, type TNode } from "../sim.ts";
import type { Solution } from "./types";

type V = (number | null)[];
/** Tree helpers over heap-indexed arrays: node id = index, children at 2i+1 and 2i+2. */
function T(vals: V) {
  const { nodes, kids } = levelTree(vals);
  const val = (i: number) => vals[i] as number;
  return { nodes, kids, val };
}
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const table = (title: string, rowHead: string[], colHead: string[], frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead, colHead, frames });
const all = (keys: (string | number)[], t: Tone) => Object.fromEntries(keys.map((k) => [k, t])) as Record<string, Tone>;
const nums = (n: number) => Array.from({ length: n }, (_, i) => String(i));
/** Accumulate tones across frames so visited nodes stay marked. */
function trail(frames: TreeFrame[], keep: Tone = "done"): TreeFrame[] {
  const seen: Record<number, Tone> = {};
  return frames.map((f) => { const out = { ...f, tones: { ...seen, ...f.tones } }; Object.keys(f.tones || {}).forEach((k) => { if (f.tones![+k] !== "muted") seen[+k] = f.tones![+k] === "found" ? "found" : keep; }); return out; });
}
/** Show only the cells already filled (row by row up to (r, c)). */
const upto = <X,>(dp: X[][], r: number, c: number) => dp.map((row, i) => row.map((v, j) => (i < r || (i === r && j <= c) ? v : null)));

export const PATTERN2: Record<string, Solution> = {
  "maximum-width-of-binary-tree": {
    approach: "BFS that numbers each node like a heap (left child 2i, right child 2i + 1); a level's width is last index - first index + 1.",
    idea: ["Give the root position 0. A node at position i has children at 2i and 2i + 1, so missing nodes still take up space.", "Process the tree level by level.", "The width of a level is the position of its last node minus the first, plus one. Keep the largest."],
    code: `def widthOfBinaryTree(root):
    best, level = 0, [(root, 0)]
    while level:
        best = max(best, level[-1][1] - level[0][1] + 1)
        nxt = []
        for node, i in level:
            if node.left:
                nxt.append((node.left, 2 * i))
            if node.right:
                nxt.append((node.right, 2 * i + 1))
        level = nxt
    return best`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [1, 3, 2, 5, null, null, 9, 6, null, null, null, null, null, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [];
      let level: [number, number][] = [[0, 0]], best = 0, d = 0; const badges: Record<number, string> = {};
      while (level.length) {
        const w = level[level.length - 1][1] - level[0][1] + 1; best = Math.max(best, w);
        level.forEach(([i, p]) => (badges[i] = `#${p}`));
        frames.push({ note: `depth ${d}: [${level.map(([i]) => val(i)).join(", ")}] at positions ${level.map(([, p]) => p).join(", ")} → width ${level[level.length - 1][1]} - ${level[0][1]} + 1 = ${w} (best ${best})`, tones: all(level.map(([i]) => i), w === best ? "found" : "active"), badges: { ...badges } });
        level = level.flatMap(([i, p]) => [kids[i][0] != null ? [kids[i][0]!, 2 * p] : null, kids[i][1] != null ? [kids[i][1]!, 2 * p + 1] : null].filter((x): x is [number, number] => x != null)); d++;
      }
      return tree(`Maximum width: ${best}`, nodes, trail(frames));
    },
  },

  "average-of-levels-in-binary-tree": {
    approach: "BFS one level at a time and append the mean of each level.",
    idea: ["A queue processes nodes in depth order.", "Take exactly the nodes of the current level, sum them and divide by the count.", "Their children form the next level."],
    code: `def averageOfLevels(root):
    out, level = [], [root]
    while level:
        out.append(sum(n.val for n in level) / len(level))
        level = [c for n in level for c in (n.left, n.right) if c]
    return out`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [3, 9, 20, null, null, 15, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], out: number[] = [];
      let level = [0];
      while (level.length) {
        const s = level.reduce((x, i) => x + val(i), 0); out.push(s / level.length);
        frames.push({ note: `level [${level.map(val).join(", ")}]: sum ${s} / ${level.length} = ${s / level.length} → [${out.join(", ")}]`, tones: all(level, "active") });
        level = level.flatMap((i) => kids[i].filter((c): c is number => c != null));
      }
      return tree(`Level averages: [${out.join(", ")}]`, nodes, trail(frames));
    },
  },

  "populating-next-right-pointers-in-each-node": {
    approach: "Walk each level through the next pointers already set on it, and wire the level below: left.next = right, right.next = next.left.",
    idea: ["The tree is perfect, so every node with children has both.", "Inside one parent: left child's next is the right child.", "Across parents: the right child's next is the left child of the parent's next.", "Level k is linked before level k + 1 is wired, so no queue is needed: O(1) extra space."],
    code: `def connect(root):
    leftmost = root
    while leftmost and leftmost.left:
        node = leftmost
        while node:
            node.left.next = node.right
            if node.next:
                node.right.next = node.next.left
            node = node.next
        leftmost = leftmost.left
    return root`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], next: Record<number, number | null> = { 0: null }, badges: Record<number, string> = { 0: "→ #" };
      let leftmost: number | null = 0;
      while (leftmost != null && kids[leftmost][0] != null) {
        let node: number | null = leftmost;
        while (node != null) {
          const [l, r] = kids[node] as [number, number]; next[l] = r; badges[l] = `→ ${val(r)}`;
          const nx: number | null = next[node]; next[r] = nx != null ? kids[nx][0] : null; badges[r] = next[r] != null ? `→ ${val(next[r]!)}` : "→ #";
          frames.push({ note: `at ${val(node)}: ${val(l)}.next = ${val(r)}; ${val(r)}.next = ${nx != null ? `${val(nx)}.left = ${val(kids[nx][0]!)}` : "null (no node to the right)"}`, tones: { [node]: "active", [l]: "found", [r]: "found" }, badges: { ...badges } });
          node = nx;
        }
        leftmost = kids[leftmost][0];
      }
      frames.push({ note: "Every level is now a linked list read left to right: 1 # 2 3 # 4 5 6 7 #", tones: all(nodes.map((n) => n.id), "done"), badges: { ...badges } });
      return tree("Next right pointers, no queue", nodes, trail(frames));
    },
  },

  "vertical-order-traversal-of-a-binary-tree": {
    approach: "Record (column, row, value) for every node, sort, and group by column.",
    idea: ["Root is at (row 0, column 0); a left child goes to column - 1, a right child to column + 1.", "Sorting the triples orders by column first, then top to bottom, then by value for ties in the same cell.", "Consecutive triples with the same column form one output list."],
    code: `def verticalTraversal(root):
    cells = []
    def dfs(node, r, c):
        if node:
            cells.append((c, r, node.val))
            dfs(node.left, r + 1, c - 1)
            dfs(node.right, r + 1, c + 1)
    dfs(root, 0, 0)
    cells.sort()
    out, prev = [], None
    for c, r, v in cells:
        if c != prev:
            out.append([])
            prev = c
        out[-1].append(v)
    return out`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 6, 5, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], trip: [number, number, number, number][] = [], badges: Record<number, string> = {};
      const dfs = (i: number | null, r: number, c: number) => { if (i == null) return; trip.push([c, r, val(i), i]); badges[i] = `c${c}`; frames.push({ note: `${val(i)} at row ${r}, column ${c}`, tones: { [i]: "active" }, badges: { ...badges } }); dfs(kids[i][0], r + 1, c - 1); dfs(kids[i][1], r + 1, c + 1); };
      dfs(0, 0, 0);
      trip.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      const groups = new Map<number, number[]>(); trip.forEach(([c, , v]) => groups.set(c, [...(groups.get(c) || []), v]));
      groups.forEach((vs, c) => frames.push({ note: `column ${c}: [${vs.join(", ")}]${c === 0 ? " (6 and 5 share row 2, column 0, so the smaller value comes first)" : ""}`, tones: all(trip.filter((t) => t[0] === c).map((t) => t[3]), "found"), badges: { ...badges } }));
      return tree(`Vertical order: ${JSON.stringify([...groups.values()])}`, nodes, frames);
    },
  },

  "binary-tree-paths": {
    approach: "DFS carrying the path so far; at a leaf, join it with \"->\" and record it.",
    idea: ["Every answer starts at the root and ends at a leaf.", "Pass the path string down; each node appends its value.", "A node with no children closes one path."],
    code: `def binaryTreePaths(root):
    out = []
    def dfs(node, path):
        path += str(node.val)
        if not node.left and not node.right:
            out.append(path)
            return
        if node.left:
            dfs(node.left, path + "->")
        if node.right:
            dfs(node.right, path + "->")
    dfs(root, "")
    return out`,
    lang: "python", time: "O(n·h)", space: "O(h)",
    viz: () => {
      const vals: V = [1, 2, 3, null, 5, 6, null], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], out: string[] = [], path: number[] = [];
      const dfs = (i: number) => { path.push(i); const leaf = kids[i][0] == null && kids[i][1] == null, s = path.map(val).join("->"); if (leaf) out.push(s); frames.push({ note: leaf ? `leaf ${val(i)}: record "${s}"` : `at ${val(i)}: path so far "${s}"`, tones: all(path, leaf ? "found" : "active") }); kids[i].forEach((k) => k != null && dfs(k)); path.pop(); };
      dfs(0);
      frames.push({ note: `All root-to-leaf paths: ${out.map((s) => `"${s}"`).join(", ")}`, tones: all(nodes.map((n) => n.id), "done") });
      return tree("Root-to-leaf paths", nodes, frames);
    },
  },

  "path-sum": {
    approach: "Subtract each node's value on the way down; a leaf with exactly 0 left means a path exists.",
    idea: ["Pass the remaining target to the children.", "At a leaf, check if the remaining value equals the leaf's value.", "Return true as soon as either subtree finds one."],
    code: `def hasPathSum(root, targetSum):
    if not root:
        return False
    if not root.left and not root.right:
        return root.val == targetSum
    rem = targetSum - root.val
    return hasPathSum(root.left, rem) or hasPathSum(root.right, rem)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, null, null, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], path: number[] = [];
      const go = (i: number | null, t: number): boolean => {
        if (i == null) return false; path.push(i); const leaf = kids[i][0] == null && kids[i][1] == null, hit = leaf && val(i) === t;
        frames.push({ note: leaf ? `leaf ${val(i)}: need ${t} → ${hit ? "match, path found" : "no match, back up"}` : `at ${val(i)}: need ${t}, pass ${t - val(i)} down`, tones: all(path, hit ? "found" : leaf ? "bad" : "active"), badges: { [i]: String(t) } });
        const ok = hit || (!leaf && (go(kids[i][0], t - val(i)) || go(kids[i][1], t - val(i)))); path.pop(); return ok;
      };
      const ok = go(0, 22);
      return tree(`Has a root-to-leaf path summing to 22: ${ok}`, nodes, frames);
    },
  },

  "construct-binary-tree-from-preorder-and-inorder-traversal": {
    approach: "The next preorder value is the root; its index in inorder splits the remaining values into the left and right subtrees.",
    idea: ["Preorder lists a root before its subtrees, so reading it left to right gives roots in creation order.", "In inorder, everything left of the root is its left subtree and everything right is its right subtree.", "A dictionary from value to inorder index makes each split O(1)."],
    code: `def buildTree(preorder, inorder):
    at = {v: i for i, v in enumerate(inorder)}
    it = iter(preorder)
    def go(lo, hi):
        if lo > hi:
            return None
        v = next(it)
        node = TreeNode(v)
        node.left = go(lo, at[v] - 1)
        node.right = go(at[v] + 1, hi)
        return node
    return go(0, len(inorder) - 1)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const pre = [3, 9, 20, 15, 7], ino = [9, 3, 15, 20, 7], nodes: TNode[] = [], frames: TreeFrame[] = []; let p = 0;
      const go = (lo: number, hi: number, parent: number | null, side?: "L" | "R"): void => {
        if (lo > hi) return; const v = pre[p++], m = ino.indexOf(v), id = nodes.length; nodes.push({ id, label: String(v), parent, side });
        frames.push({ note: `preorder[${p - 1}] = ${v} is the root of inorder [${ino.slice(lo, hi + 1).join(", ")}]: left [${ino.slice(lo, m).join(", ")}], right [${ino.slice(m + 1, hi + 1).join(", ")}]`, tones: { [id]: "active" } });
        go(lo, m - 1, id, "L"); go(m + 1, hi, id, "R");
      };
      go(0, ino.length - 1, null);
      return tree("Tree from preorder + inorder", nodes, frames.map((f, k) => ({ ...f, tones: { ...all(nodes.slice(0, k).map((n) => n.id), "done"), ...all(nodes.slice(k + 1).map((n) => n.id), "muted"), ...f.tones } })));
    },
  },

  "construct-binary-tree-from-inorder-and-postorder-traversal": {
    approach: "Read postorder from the end: each value is a root; build its right subtree first, then its left, splitting by its inorder index.",
    idea: ["Postorder ends with the root, so reading it backwards gives root, right subtree, left subtree.", "The root's inorder index splits the values into left and right parts.", "Because we read backwards, recurse into the right part before the left."],
    code: `def buildTree(inorder, postorder):
    at = {v: i for i, v in enumerate(inorder)}
    def go(lo, hi):
        if lo > hi:
            return None
        v = postorder.pop()
        node = TreeNode(v)
        node.right = go(at[v] + 1, hi)
        node.left = go(lo, at[v] - 1)
        return node
    return go(0, len(inorder) - 1)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const ino = [9, 3, 15, 20, 7], post = [9, 15, 7, 20, 3], stack = [...post], nodes: TNode[] = [], frames: TreeFrame[] = [];
      const go = (lo: number, hi: number, parent: number | null, side?: "L" | "R"): void => {
        if (lo > hi) return; const v = stack.pop()!, m = ino.indexOf(v), id = nodes.length; nodes.push({ id, label: String(v), parent, side });
        frames.push({ note: `pop ${v} from the end of postorder: root of [${ino.slice(lo, hi + 1).join(", ")}]; build right [${ino.slice(m + 1, hi + 1).join(", ")}] first, then left [${ino.slice(lo, m).join(", ")}]`, tones: { [id]: "active" } });
        go(m + 1, hi, id, "R"); go(lo, m - 1, id, "L");
      };
      go(0, ino.length - 1, null);
      return tree("Tree from inorder + postorder", nodes, frames.map((f, k) => ({ ...f, tones: { ...all(nodes.slice(0, k).map((n) => n.id), "done"), ...all(nodes.slice(k + 1).map((n) => n.id), "muted"), ...f.tones } })));
    },
  },

  "serialize-and-deserialize-binary-tree": {
    approach: "Preorder with a \"#\" for every missing child; reading the tokens back in the same order rebuilds the tree.",
    idea: ["Marking empty children makes preorder unambiguous: each subtree's tokens end exactly when its last \"#\" is read.", "serialize: visit node, then left, then right, writing \"#\" for None.", "deserialize: read one token; \"#\" means None, otherwise make a node and rebuild its left then right child from the following tokens."],
    code: `class Codec:
    def serialize(self, root):
        out = []
        def go(node):
            if not node:
                out.append("#")
                return
            out.append(str(node.val))
            go(node.left)
            go(node.right)
        go(root)
        return ",".join(out)

    def deserialize(self, data):
        it = iter(data.split(","))
        def go():
            v = next(it)
            if v == "#":
                return None
            node = TreeNode(int(v))
            node.left = go()
            node.right = go()
            return node
        return go()`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals: V = [1, 2, 3, null, null, 4, 5], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], out: string[] = [];
      const go = (i: number | null, from: number) => { if (i == null) { out.push("#"); frames.push({ note: `empty child under ${val(from)} → "#": ${out.join(",")}`, tones: { [from]: "window" } }); return; } out.push(String(val(i))); frames.push({ note: `visit ${val(i)} → ${out.join(",")}`, tones: { [i]: "active" } }); go(kids[i][0], i); go(kids[i][1], i); };
      go(0, 0);
      frames.push({ note: `serialize gives "${out.join(",")}". deserialize reads the same tokens in the same preorder: each number makes a node, each "#" ends a branch.`, tones: all(nodes.map((n) => n.id), "found") });
      return tree(`Preorder with markers: ${out.join(",")}`, nodes, trail(frames));
    },
  },

  "convert-sorted-array-to-binary-search-tree": {
    approach: "Pick the middle element as the root, then build the left half and right half the same way.",
    idea: ["In a sorted array, every value left of the middle is smaller and every value right is larger, so the BST order holds.", "Taking the middle keeps both halves the same size (within one), so the tree stays height-balanced.", "Recurse on each half."],
    code: `def sortedArrayToBST(nums):
    def go(lo, hi):
        if lo > hi:
            return None
        mid = (lo + hi) // 2
        node = TreeNode(nums[mid])
        node.left = go(lo, mid - 1)
        node.right = go(mid + 1, hi)
        return node
    return go(0, len(nums) - 1)`,
    lang: "python", time: "O(n)", space: "O(log n)",
    viz: () => {
      const a = [-10, -3, 0, 5, 9, 12, 20], nodes: TNode[] = [], frames: TreeFrame[] = [];
      const go = (lo: number, hi: number, parent: number | null, side?: "L" | "R") => { if (lo > hi) return; const mid = (lo + hi) >> 1, id = nodes.length; nodes.push({ id, label: String(a[mid]), parent, side }); frames.push({ note: `range [${a.slice(lo, hi + 1).join(", ")}]: middle ${a[mid]} becomes the ${parent == null ? "root" : `${side === "L" ? "left" : "right"} child of ${nodes[parent].label}`}`, tones: { [id]: "active" } }); go(lo, mid - 1, id, "L"); go(mid + 1, hi, id, "R"); };
      go(0, a.length - 1, null);
      return tree("Balanced BST from a sorted array", nodes, frames.map((f, k) => ({ ...f, tones: { ...all(nodes.slice(0, k).map((n) => n.id), "done"), ...all(nodes.slice(k + 1).map((n) => n.id), "muted"), ...f.tones } })));
    },
  },
  "validate-binary-search-tree": {
    approach: "Pass an open range (low, high) down the tree; every node must lie strictly inside its range.",
    idea: ["Checking only a node against its children misses cases like a small value deep in the right subtree.", "Going left tightens the upper bound to the node's value; going right tightens the lower bound.", "Fail as soon as one node falls outside its range."],
    code: `def isValidBST(root):
    def ok(node, lo, hi):
        if not node:
            return True
        if not lo < node.val < hi:
            return False
        return ok(node.left, lo, node.val) and ok(node.right, node.val, hi)
    return ok(root, float("-inf"), float("inf"))`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [5, 4, 6, null, null, 3, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], f = (x: number | null, neg: boolean) => (x == null ? (neg ? "-∞" : "∞") : String(x));
      const ok = (i: number | null, lo: number | null, hi: number | null): boolean => {
        if (i == null) return true; const v = val(i), good = (lo == null || lo < v) && (hi == null || v < hi);
        frames.push({ note: `${v} must be in (${f(lo, true)}, ${f(hi, false)}) → ${good ? "ok" : `fails: it sits in the right subtree of ${lo} but is smaller`}`, tones: { [i]: good ? "active" : "bad" }, badges: { [i]: `(${f(lo, true)}, ${f(hi, false)})` } });
        return good && ok(kids[i][0], lo, v) && ok(kids[i][1], v, hi);
      };
      const res = ok(0, null, null);
      return tree(`Valid BST: ${res}`, nodes, trail(frames));
    },
  },

  "kth-smallest-element-in-a-bst": {
    approach: "Inorder traversal visits a BST in sorted order; stop at the k-th visited node.",
    idea: ["Left subtree, node, right subtree gives values in increasing order.", "Do it iteratively with a stack: push the left spine, pop a node, count it, then move into its right subtree.", "The k-th pop is the answer, so the rest of the tree is never touched."],
    code: `def kthSmallest(root, k):
    stack, node = [], root
    while True:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right`,
    lang: "python", time: "O(h + k)", space: "O(h)",
    viz: () => {
      const vals: V = [5, 3, 6, 2, 4, null, null, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], K = 3, stack: number[] = [], badges: Record<number, string> = {};
      let node: number | null = 0, k = K, ans = 0;
      while (true) {
        while (node != null) { stack.push(node); node = kids[node][0]; }
        const top = stack.pop()!; k--; badges[top] = `#${K - k}`;
        frames.push({ note: `pop ${val(top)}: it is number ${K - k} in sorted order${k === 0 ? ` → the ${K}rd smallest is ${val(top)}` : `; stack now [${stack.map(val).join(", ")}]`}`, tones: { ...all(stack, "window"), [top]: k === 0 ? "found" : "active" }, badges: { ...badges } });
        if (k === 0) { ans = val(top); break; }
        node = kids[top][1];
      }
      return tree(`${K}rd smallest: ${ans}`, nodes, trail(frames));
    },
  },

  "lowest-common-ancestor-of-a-binary-search-tree": {
    approach: "From the root, go left while both values are smaller, right while both are larger; the first node that splits them is the LCA.",
    idea: ["If p and q are both smaller than the node, they are both in its left subtree, so the LCA is there too.", "Same for both larger and the right subtree.", "Otherwise the node lies between them (or equals one), so it is the lowest node above both."],
    code: `def lowestCommonAncestor(root, p, q):
    node = root
    while node:
        if p.val < node.val and q.val < node.val:
            node = node.left
        elif p.val > node.val and q.val > node.val:
            node = node.right
        else:
            return node`,
    lang: "python", time: "O(h)", space: "O(1)",
    viz: () => {
      const vals: V = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], p = 3, q = 5, pq = nodes.filter((n) => +n.label === p || +n.label === q).map((n) => n.id);
      let i: number | null = 0, ans = 0;
      while (i != null) {
        const v = val(i);
        if (p < v && q < v) { frames.push({ note: `${p} and ${q} are both below ${v} → go left`, tones: { ...all(pq, "window"), [i]: "active" } }); i = kids[i][0]; }
        else if (p > v && q > v) { frames.push({ note: `${p} and ${q} are both above ${v} → go right`, tones: { ...all(pq, "window"), [i]: "active" } }); i = kids[i][1]; }
        else { ans = v; frames.push({ note: `${p} < ${v} < ${q}: they split here, so ${v} is the LCA`, tones: { ...all(pq, "window"), [i]: "found" } }); break; }
      }
      return tree(`LCA of ${p} and ${q}: ${ans}`, nodes, trail(frames));
    },
  },

  "insert-into-a-binary-search-tree": {
    approach: "Walk down as if searching for the value; attach a new leaf at the empty spot where the search ends.",
    idea: ["Smaller values go left, larger go right, exactly like a search.", "The search for a missing value always ends at an empty child.", "Put the new node there; nothing else moves, so the BST order still holds."],
    code: `def insertIntoBST(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insertIntoBST(root.left, val)
    else:
        root.right = insertIntoBST(root.right, val)
    return root`,
    lang: "python", time: "O(h)", space: "O(h)",
    viz: () => {
      const vals: V = [4, 2, 7, 1, 3], { nodes, kids, val } = T(vals), x = 5, frames: TreeFrame[] = []; let i: number | null = 0, parent = 0, side: "L" | "R" = "L", id = 0;
      while (i != null) { const go: number = x < val(i) ? 0 : 1; frames.push({ note: `${x} ${go ? ">" : "<"} ${val(i)} → go ${go ? "right" : "left"}${kids[i][go] == null ? " (empty)" : ""}`, tones: { [i]: "active" } }); parent = i; side = go ? "R" : "L"; id = 2 * i + 1 + go; i = kids[i][go]; }
      const all2 = [...nodes, { id, label: String(x), parent, side }];
      frames.push({ note: `attach ${x} as the ${side === "L" ? "left" : "right"} child of ${val(parent)}`, tones: { [id]: "found" } });
      return tree(`Insert ${x}`, all2, trail(frames).map((f, k) => (k < frames.length - 1 ? { ...f, tones: { ...f.tones, [id]: "muted" } } : f)));
    },
  },

  "delete-node-in-a-bst": {
    approach: "Find the node; with one child, replace it by that child; with two, copy in the smallest value of its right subtree and delete that one instead.",
    idea: ["Search by comparing with each node, as in a lookup.", "No left child: the right child takes its place (and the other way round).", "Two children: the in-order successor (leftmost node of the right subtree) is the only value that can sit there and keep the order. Copy it up, then delete it from the right subtree, where it has no left child."],
    code: `def deleteNode(root, key):
    if not root:
        return None
    if key < root.val:
        root.left = deleteNode(root.left, key)
    elif key > root.val:
        root.right = deleteNode(root.right, key)
    else:
        if not root.left:
            return root.right
        if not root.right:
            return root.left
        s = root.right
        while s.left:
            s = s.left
        root.val = s.val
        root.right = deleteNode(root.right, s.val)
    return root`,
    lang: "python", time: "O(h)", space: "O(h)",
    viz: () => {
      const vals: V = [5, 3, 6, 2, 4, null, 7], { nodes, kids, val } = T(vals), key = 3, frames: TreeFrame[] = [];
      let i: number = 0;
      while (val(i) !== key) { const go = key < val(i) ? 0 : 1; frames.push({ note: `${key} ${go ? ">" : "<"} ${val(i)} → go ${go ? "right" : "left"}`, tones: { [i]: "active" } }); i = kids[i][go]!; }
      frames.push({ note: `found ${key}: it has two children, so look for its successor`, tones: { [i]: "bad" } });
      let s = kids[i][1]!; while (kids[s][0] != null) s = kids[s][0]!;
      frames.push({ note: `successor = leftmost of the right subtree = ${val(s)}`, tones: { [i]: "bad", [s]: "window" } });
      frames.push({ note: `copy ${val(s)} into the node, then delete the old ${val(s)} leaf from the right subtree`, tones: { [i]: "found", [s]: "muted" }, labels: { [i]: String(val(s)) } });
      frames.push({ note: `result [5, 4, 6, 2, null, null, 7]: still a valid BST`, tones: { [i]: "found", [s]: "muted" }, labels: { [i]: String(val(s)), [s]: "" } });
      return tree(`Delete ${key}`, nodes, frames);
    },
  },

  "binary-search-tree-iterator": {
    approach: "Keep a stack holding the path of left children; next() pops the top and pushes the left spine of its right child.",
    idea: ["The smallest value is at the end of the left spine, so start by pushing it.", "Popping gives the next value in sorted order.", "Before returning, push the left spine of the popped node's right subtree. Each node is pushed and popped once, so next() is O(1) on average and memory is O(h)."],
    code: `class BSTIterator:
    def __init__(self, root):
        self.stack = []
        self._push(root)

    def _push(self, node):
        while node:
            self.stack.append(node)
            node = node.left

    def next(self):
        node = self.stack.pop()
        self._push(node.right)
        return node.val

    def hasNext(self):
        return bool(self.stack)`,
    lang: "python", time: "O(1) average per call", space: "O(h)",
    viz: () => {
      const vals: V = [7, 3, 15, null, null, 9, 20], { kids, val } = T(vals), st: number[] = [], frames: StackFrame[] = [];
      const push = (i: number | null) => { while (i != null) { st.push(i); i = kids[i][0]; } };
      push(0); frames.push({ note: "constructor: push the left spine 7, 3", items: st.map(val) });
      const calls = ["next", "next", "hasNext", "next", "hasNext", "next", "hasNext", "next", "hasNext"];
      for (const c of calls) {
        if (c === "hasNext") { frames.push({ note: `hasNext() → ${st.length > 0} (stack ${st.length ? "not empty" : "empty"})`, items: st.map(val), side: String(st.length > 0) }); continue; }
        const top = st.pop()!; push(kids[top][1]);
        frames.push({ note: `next() pops ${val(top)}${kids[top][1] != null ? `, then pushes the left spine of its right child ${val(kids[top][1]!)}` : ""} → returns ${val(top)}`, items: st.map(val), popped: [val(top)], side: String(val(top)) });
      }
      return { kind: "stack", title: "BST iterator: stack of left spines", frames };
    },
  },

  "trim-a-binary-search-tree": {
    approach: "If a node is below low, its whole left side is too, so return the trimmed right subtree; symmetric for above high; otherwise trim both children.",
    idea: ["A node smaller than low has only smaller values on its left, so drop the node and its left subtree.", "A node larger than high: drop it and its right subtree.", "A node inside [low, high] stays; trim its two subtrees recursively and reattach them."],
    code: `def trimBST(root, low, high):
    if not root:
        return None
    if root.val < low:
        return trimBST(root.right, low, high)
    if root.val > high:
        return trimBST(root.left, low, high)
    root.left = trimBST(root.left, low, high)
    root.right = trimBST(root.right, low, high)
    return root`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [3, 0, 4, null, 2, null, null, null, null, 1], { nodes, kids, val } = T(vals), lo = 1, hi = 3, frames: TreeFrame[] = [];
      const go = (i: number | null): void => {
        if (i == null) return; const v = val(i);
        if (v < lo) { frames.push({ note: `${v} < ${lo}: drop it and its left side, keep trimming its right child`, tones: { [i]: "bad" } }); return go(kids[i][1]); }
        if (v > hi) { frames.push({ note: `${v} > ${hi}: drop it and its right side, keep trimming its left child`, tones: { [i]: "bad" } }); return go(kids[i][0]); }
        frames.push({ note: `${v} is in [${lo}, ${hi}]: keep it, trim both children`, tones: { [i]: "found" } }); go(kids[i][0]); go(kids[i][1]);
      };
      go(0);
      frames.push({ note: "Kept nodes form [3, 2, null, 1]: 2 replaced 0 as the left child of 3", tones: {} });
      const seen: Record<number, Tone> = {};
      return tree(`Trim to [${lo}, ${hi}]`, nodes, frames.map((f) => { Object.assign(seen, f.tones); return { ...f, tones: { ...seen } }; }));
    },
  },

  "convert-bst-to-greater-tree": {
    approach: "Reverse inorder (right, node, left) visits values from largest to smallest; keep a running sum and write it into each node.",
    idea: ["Each node must become itself plus every larger value.", "Right subtree first means all larger values are visited before the node.", "A running total of visited values is exactly the new value."],
    code: `def convertBST(root):
    total = 0
    def go(node):
        nonlocal total
        if node:
            go(node.right)
            total += node.val
            node.val = total
            go(node.left)
    go(root)
    return root`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [4, 1, 6, 0, 2, 5, 7, null, null, null, 3, null, null, null, 8], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], labels: Record<number, string> = {}; let total = 0;
      const go = (i: number | null) => { if (i == null) return; go(kids[i][1]); total += val(i); labels[i] = String(total); frames.push({ note: `${val(i)} + larger values = ${total}`, tones: { [i]: "active" }, labels: { ...labels } }); go(kids[i][0]); };
      go(0);
      return tree("Greater sum tree (reverse inorder)", nodes, trail(frames));
    },
  },

  "two-sum-iv-input-is-a-bst": {
    approach: "DFS with a set of seen values; stop when k - value is already in the set.",
    idea: ["Two values a + b = k: when the second one is visited, the first is already in the set.", "Any traversal order works.", "O(n) time and space; the BST order is not even needed."],
    code: `def findTarget(root, k):
    seen = set()
    def dfs(node):
        if not node:
            return False
        if k - node.val in seen:
            return True
        seen.add(node.val)
        return dfs(node.left) or dfs(node.right)
    return dfs(root)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals: V = [5, 3, 6, 2, 4, null, 7], { nodes, kids, val } = T(vals), k = 9, seen: number[] = [], frames: TreeFrame[] = [];
      const dfs = (i: number | null): boolean => { if (i == null) return false; const need = k - val(i), hit = seen.includes(need); frames.push({ note: hit ? `${val(i)}: need ${need}, already seen → ${need} + ${val(i)} = ${k}` : `${val(i)}: need ${need}, not seen yet; add ${val(i)} → {${[...seen, val(i)].join(", ")}}`, tones: hit ? { [i]: "found", [nodes.find((n) => +n.label === need)!.id]: "found" } : { [i]: "active" } }); if (hit) return true; seen.push(val(i)); return dfs(kids[i][0]) || dfs(kids[i][1]); };
      const ok = dfs(0);
      return tree(`Two values summing to ${k}: ${ok}`, nodes, trail(frames));
    },
  },
  "number-of-1-bits": {
    approach: "n & (n - 1) clears the lowest set bit; count how many times you can do it before n is 0.",
    idea: ["Subtracting 1 flips the lowest set bit to 0 and every bit below it to 1.", "ANDing with n wipes exactly that lowest set bit.", "The loop runs once per set bit, not once per bit position."],
    code: `def hammingWeight(n):
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count`,
    lang: "python", time: "O(set bits)", space: "O(1)",
    viz: () => {
      let n = 11, c = 0; const frames: CellsFrame[] = [{ note: `n = ${n} = ${bin(n).join("")}`, rows: [bin(n)] }];
      while (n) { const low = n & -n, m = n & (n - 1); c++; frames.push({ note: `${n} & ${n - 1} = ${m}: clears the bit worth ${low} → count ${c}`, rows: [bin(m)], tones: { [`0:${7 - Math.log2(low)}`]: "bad", ...all(bin(m).map((b, i) => (b === "1" ? `0:${i}` : "")).filter(Boolean), "found") } }); n = m; }
      frames.push({ note: `n is 0 after ${c} steps → 11 has ${c} set bits`, rows: [bin(0)] });
      return cells(`Set bits in 11: ${c}`, [bin(11)], frames, ["n"]);
    },
  },

  "counting-bits": {
    approach: "ans[i] = ans[i >> 1] + (i & 1): dropping the last bit gives a smaller number already solved.",
    idea: ["i >> 1 is i without its last bit, and it is smaller than i, so its count is known.", "Add 1 back if the dropped bit was a 1.", "One pass from 0 to n."],
    code: `def countBits(n):
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 8, idx = Array.from({ length: n + 1 }, (_, i) => i), bits = idx.map((i) => i.toString(2)), ans: (string | number)[] = idx.map(() => ""), frames: CellsFrame[] = [];
      ans[0] = 0; frames.push({ note: "ans[0] = 0", rows: [idx, bits, [...ans]], tones: { "2:0": "found" } });
      for (let i = 1; i <= n; i++) { ans[i] = +ans[i >> 1] + (i & 1); frames.push({ note: `${i} = ${bits[i]}: ans[${i} >> 1 = ${i >> 1}] = ${ans[i >> 1]}, plus last bit ${i & 1} → ${ans[i]}`, rows: [idx, bits, [...ans]], tones: { [`0:${i}`]: "active", [`2:${i >> 1}`]: "window", [`2:${i}`]: "found" } }); }
      return cells(`Bit counts 0..${n}: [${ans.join(", ")}]`, [idx, bits, idx.map(() => "")], frames, ["i", "binary", "ans"]);
    },
  },

  "add-binary": {
    approach: "Add column by column from the right with a carry, like adding on paper.",
    idea: ["Walk both strings from their last character.", "Column sum = bit of a + bit of b + carry; write sum % 2 and carry sum // 2.", "If a carry is left at the end, write one more 1. Reverse the collected bits."],
    code: `def addBinary(a, b):
    i, j, carry, out = len(a) - 1, len(b) - 1, 0, []
    while i >= 0 or j >= 0 or carry:
        s = carry
        if i >= 0:
            s += int(a[i])
            i -= 1
        if j >= 0:
            s += int(b[j])
            j -= 1
        out.append(str(s % 2))
        carry = s // 2
    return "".join(reversed(out))`,
    lang: "python", time: "O(max(m, n))", space: "O(max(m, n))",
    viz: () => {
      const a = "1010", b = "1011", W = Math.max(a.length, b.length) + 1, A = a.padStart(W, " ").split(""), B = b.padStart(W, " ").split(""), S: string[] = Array(W).fill(""), frames: CellsFrame[] = [];
      let carry = 0;
      for (let c = W - 1; c >= 0; c--) {
        const x = A[c] === " " ? 0 : +A[c], y = B[c] === " " ? 0 : +B[c], s = x + y + carry; if (c === 0 && s === 0) break;
        S[c] = String(s % 2); frames.push({ note: `column ${W - 1 - c}: ${x} + ${y} + carry ${carry} = ${s} → write ${s % 2}, carry ${s >> 1}`, rows: [A, B, [...S]], tones: { [`0:${c}`]: "active", [`1:${c}`]: "active", [`2:${c}`]: "found" } }); carry = s >> 1;
      }
      frames.push({ note: `${a} + ${b} = ${S.join("")}`, rows: [A, B, [...S]], tones: range(0, W - 1, 2, "found") });
      return cells(`"${a}" + "${b}" = "${S.join("")}"`, [A, B, S], frames, ["a", "b", "sum"]);
    },
  },

  "hamming-distance": {
    approach: "x ^ y has a 1 exactly where the bits differ; count those 1s.",
    idea: ["XOR gives 1 for different bits and 0 for equal ones.", "The Hamming distance is the number of set bits in x ^ y."],
    code: `def hammingDistance(x, y):
    return bin(x ^ y).count("1")`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const x = 1, y = 4, z = x ^ y, frames: CellsFrame[] = [];
      frames.push({ note: `x = ${x}, y = ${y}`, rows: [bin(x, 4), bin(y, 4), bin(0, 4)] });
      frames.push({ note: `x ^ y = ${z}: 1 where the bits differ`, rows: [bin(x, 4), bin(y, 4), bin(z, 4)], tones: all(bin(z, 4).map((b, i) => (b === "1" ? i : -1)).filter((i) => i >= 0).flatMap((i) => [`0:${i}`, `1:${i}`, `2:${i}`]), "found") });
      frames.push({ note: `two set bits in ${z} → distance 2`, rows: [bin(x, 4), bin(y, 4), bin(z, 4)], tones: { "2:1": "found", "2:3": "found" } });
      return cells(`Hamming distance of ${x} and ${y}: 2`, [bin(x, 4), bin(y, 4), bin(0, 4)], frames, ["x", "y", "x ^ y"]);
    },
  },

  "reverse-bits": {
    approach: "32 times: shift the result left and move n's lowest bit into it, then shift n right.",
    idea: ["n & 1 reads the lowest bit of n.", "(out << 1) | bit appends it to the result, so the first bit read ends up highest.", "After 32 rounds every bit has moved to its mirrored position."],
    code: `def reverseBits(n):
    out = 0
    for _ in range(32):
        out = (out << 1) | (n & 1)
        n >>= 1
    return out`,
    lang: "python", time: "O(32)", space: "O(1)",
    viz: () => {
      const W = 8; let n = 0b00101101, out = 0; const frames: CellsFrame[] = [{ note: "Same loop shown on 8 bits instead of 32: n = 00101101", rows: [bin(n, W), bin(out, W)] }];
      for (let k = 0; k < W; k++) { const b = n & 1; out = (out << 1) | b; n >>= 1; frames.push({ note: `round ${k + 1}: take low bit ${b}, out = (out << 1) | ${b} = ${bin(out, W).join("")}`, rows: [bin(n, W), bin(out, W)], tones: { [`1:${W - 1}`]: "found" } }); }
      frames.push({ note: `00101101 reversed is ${bin(out, W).join("")}`, rows: [bin(n, W), bin(out, W)], tones: range(0, W - 1, 1, "found") });
      return cells("Reverse bits (8-bit demo)", [bin(0b00101101, W), bin(0, W)], frames, ["n", "out"]);
    },
  },

  "single-number": {
    approach: "XOR every number: pairs cancel to 0 and the single one is left.",
    idea: ["a ^ a = 0 and a ^ 0 = a.", "XOR is commutative, so the order of the pairs does not matter.", "One pass, no extra memory."],
    code: `def singleNumber(nums):
    x = 0
    for v in nums:
        x ^= v
    return x`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [4, 1, 2, 1, 2], frames: CellsFrame[] = []; let acc = 0;
      a.forEach((x, i) => { acc ^= x; frames.push({ note: `acc ^= ${x} → ${acc} (${bin(acc, 4).join("")})`, rows: [a, bin(acc, 4)], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" } }); });
      frames.push({ note: `1 and 2 each appeared twice and cancelled → ${acc}`, rows: [a, bin(acc, 4)], tones: { "0:0": "found" } });
      return cells(`Single number: ${acc}`, [a, bin(0, 4)], frames, ["nums", "acc bits"]);
    },
  },

  "missing-number": {
    approach: "XOR all indices 0..n with all values: every present number cancels with its index, leaving the missing one.",
    idea: ["Start with n, then XOR in each index i and each value nums[i].", "Every number in 0..n appears twice (once as index or n, once as value) except the missing one.", "Pairs cancel, so the result is the missing number."],
    code: `def missingNumber(nums):
    x = len(nums)
    for i, v in enumerate(nums):
        x ^= i ^ v
    return x`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [3, 0, 1], idx = a.map((_, i) => i), frames: CellsFrame[] = []; let x = a.length;
      frames.push({ note: `start with n = ${x}`, rows: [idx, a] });
      a.forEach((v, i) => { x ^= i ^ v; frames.push({ note: `x ^= index ${i} ^ value ${v} → ${x}`, rows: [idx, a], tones: { [`0:${i}`]: "active", [`1:${i}`]: "active" } }); });
      frames.push({ note: `0, 1, 3 cancelled in pairs → missing ${x}`, rows: [idx, a], tones: all(idx.map((i) => `1:${i}`), "done") });
      return cells(`Missing number: ${x}`, [idx, a], frames, ["index", "nums"]);
    },
  },

  "find-the-difference": {
    approach: "XOR the character codes of both strings; every shared letter cancels and the added letter remains.",
    idea: ["t is s shuffled plus one letter.", "Each letter of s appears once in s and once in t, so its code cancels.", "The leftover code is the added letter."],
    code: `def findTheDifference(s, t):
    x = 0
    for ch in s + t:
        x ^= ord(ch)
    return chr(x)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "abcd", t = "abcde", both = [...(s + t)], frames: CellsFrame[] = []; let x = 0;
      both.forEach((ch, i) => { x ^= ch.charCodeAt(0); frames.push({ note: `x ^= ord('${ch}') = ${ch.charCodeAt(0)} → ${x}`, rows: [both], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" } }); });
      frames.push({ note: `a, b, c, d cancelled → ${x} = '${String.fromCharCode(x)}'`, rows: [both], tones: { [`0:${both.length - 1}`]: "found" } });
      return cells(`Added letter: '${String.fromCharCode(x)}'`, [both], frames, ["s + t"]);
    },
  },

  "subsets": {
    approach: "Start from [[]]; for each number, add a copy of every existing subset with that number appended.",
    idea: ["Every subset either leaves out the new number or includes it.", "The ones that leave it out already exist; the ones that include it are the existing ones plus the number.", "Each number doubles the list, giving 2^n subsets."],
    code: `def subsets(nums):
    out = [[]]
    for x in nums:
        out += [s + [x] for s in out]
    return out`,
    lang: "python", time: "O(n · 2^n)", space: "O(n · 2^n)",
    viz: () => {
      const a = [1, 2, 3], out: number[][] = [[]], frames: TableFrame[] = [], view = () => out.map((s, i) => [`[${s.join(", ")}]`, i === 0 ? "start" : `+ ${s[s.length - 1]}`]);
      frames.push({ note: "start with the empty subset", cells: view() });
      for (const x of a) { const n = out.length; out.push(...out.map((s) => [...s, x])); frames.push({ note: `add ${x} to each of the ${n} subsets → ${out.length} subsets`, cells: view(), tones: Object.fromEntries(Array.from({ length: n }, (_, k) => [`${n + k}:0`, "found"])) as Record<string, Tone> }); }
      return table(`All ${out.length} subsets of [1, 2, 3]`, nums(8), ["subset", "made by"], frames.map((f) => ({ ...f, cells: [...f.cells, ...Array(8 - f.cells.length).fill([null, null])] })));
    },
  },

  "partition-to-k-equal-sum-subsets": {
    approach: "Each bucket must sum to total / k; sort descending and backtrack, placing each number into a bucket with room.",
    idea: ["If total is not divisible by k, or one number exceeds the target, it is impossible.", "Big numbers first fail fast, because they have the fewest places to go.", "Try each bucket with room; undo on failure. If an empty bucket failed, every other empty bucket fails the same way, so stop there."],
    code: `def canPartitionKSubsets(nums, k):
    total = sum(nums)
    if total % k:
        return False
    target = total // k
    nums.sort(reverse=True)
    if nums[0] > target:
        return False
    buckets = [0] * k
    def place(i):
        if i == len(nums):
            return True
        for b in range(k):
            if buckets[b] + nums[i] <= target:
                buckets[b] += nums[i]
                if place(i + 1):
                    return True
                buckets[b] -= nums[i]
            if buckets[b] == 0:
                break
        return False
    return place(0)`,
    lang: "python", time: "O(k^n) worst, fast with pruning", space: "O(n)",
    viz: () => {
      const a = [4, 3, 2, 3, 5, 2, 1].sort((x, y) => y - x), k = 4, target = a.reduce((x, y) => x + y, 0) / k, B: number[][] = Array.from({ length: k }, () => []), frames: TableFrame[] = [];
      const view = () => B.map((b) => [b.join(" + ") || "empty", b.reduce((x, y) => x + y, 0)]);
      frames.push({ note: `total ${target * k} / ${k} = target ${target}; sorted descending [${a.join(", ")}]`, cells: view() });
      const place = (i: number): boolean => {
        if (i === a.length) return true;
        for (let b = 0; b < k; b++) {
          const sum = B[b].reduce((x, y) => x + y, 0);
          if (sum + a[i] <= target) { B[b].push(a[i]); frames.push({ note: `put ${a[i]} in bucket ${b} → ${sum + a[i]}${sum + a[i] === target ? " (full)" : ""}`, cells: view(), active: [b, 0] }); if (place(i + 1)) return true; B[b].pop(); frames.push({ note: `undo ${a[i]} from bucket ${b}`, cells: view(), active: [b, 0] }); }
          else if (sum) frames.push({ note: `${a[i]} does not fit in bucket ${b} (${sum} + ${a[i]} > ${target})`, cells: view(), active: [b, 1] });
          if (!B[b].length) break;
        }
        return false;
      };
      const ok = place(0);
      frames.push({ note: ok ? `every number placed, each bucket sums to ${target} → true` : "no placement works → false", cells: view(), tones: all(nums(k).map((r) => `${r}:1`), ok ? "found" : "bad") });
      return table(`Split into ${k} equal-sum subsets: ${ok}`, nums(k).map((r) => `bucket ${r}`), ["items", "sum"], frames);
    },
  },
};
