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
/** BST built by inserting `vals` in order: node id = index in `vals`, so deeper trees need no null padding. */
function B(vals: number[]) {
  const nodes: TNode[] = [], kids: Record<number, [number | null, number | null]> = {};
  vals.forEach((v, id) => { kids[id] = [null, null]; let p = 0, go = 0; if (id) for (;;) { go = v < vals[p] ? 0 : 1; const c = kids[p][go]; if (c == null) break; p = c; } if (id) kids[p][go] = id; nodes.push({ id, label: String(v), parent: id ? p : null, side: id ? (go ? "R" : "L") : undefined }); });
  return { nodes, kids, val: (i: number) => vals[i] };
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
      const vals: V = [1, 3, 2, 5, null, null, 9, 6, null, null, null, null, null, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = { 0: "#0" };
      let level: [number, number][] = [[0, 0]], best = 0, bestD = 0, bestIds: number[] = [], d = 0;
      frames.push({ note: "Find the widest level, counting the empty slots between nodes. The root is position 0; a node at position p gives its left child 2p and its right child 2p + 1", tones: { 0: "active" }, badges: { ...badges } });
      while (level.length) {
        const ids = level.map(([i]) => i), lo = level[0][1], hi = level[level.length - 1][1], w = hi - lo + 1, better = w > best;
        if (better) { best = w; bestD = d; bestIds = ids; }
        frames.push({ note: `depth ${d}: positions ${level.map(([, p]) => p).join(", ")}, so width = ${hi} - ${lo} + 1 = ${w}${better ? ", a new best" : `, not above the best ${best}`}`, tones: all(ids, "active"), badges: { ...badges } });
        const nxt: [number, number][] = [], says: string[] = [];
        for (const [i, p] of level) kids[i].forEach((c, s) => { if (c != null) { nxt.push([c, 2 * p + s]); badges[c] = `#${2 * p + s}`; says.push(`${val(c)} gets ${2 * p + s}`); } });
        if (nxt.length) frames.push({ note: `children of depth ${d}: ${says.join(", ")} (2p for a left child, 2p + 1 for a right one)`, tones: { ...all(ids, "done"), ...all(nxt.map(([c]) => c), "window") }, badges: { ...badges } });
        level = nxt; d++;
      }
      frames.push({ note: `no more levels: the widest was depth ${bestD} with width ${best}, so return ${best}`, tones: all(bestIds, "found"), badges: { ...badges } });
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
      const vals: V = [3, 9, 20, 4, 8, 15, 7, null, 6, null, null, 2, null, null, 13], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], out: number[] = [], badges: Record<number, string> = {};
      frames.push({ note: "Average each level from the top. The queue holds exactly one level at a time, starting with the root", tones: { 0: "active" } });
      let level = [0], d = 0;
      while (level.length) {
        const vs = level.map(val), s = vs.reduce((x, y) => x + y, 0), avg = s / level.length;
        frames.push({ note: `level ${d} holds [${vs.join(", ")}]: sum = ${vs.length > 1 ? `${vs.join(" + ")} = ` : ""}${s}`, tones: all(level, "active"), badges: { ...badges } });
        out.push(avg); level.forEach((i) => (badges[i] = `avg ${avg}`));
        frames.push({ note: `${s} / ${level.length} nodes = ${avg}, so the answer so far is [${out.join(", ")}]`, tones: all(level, "found"), badges: { ...badges } });
        level = level.flatMap((i) => kids[i].filter((c): c is number => c != null)); d++;
      }
      frames.push({ note: `the queue is empty after ${d} levels: averages [${out.join(", ")}]`, tones: all(nodes.map((n) => n.id), "found"), badges: { ...badges } });
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
      const vals: V = [1, 2, 3, 4, 5, 6, 7], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], next: Record<number, number | null> = {}, badges: Record<number, string> = {};
      nodes.forEach((n) => { next[n.id] = null; badges[n.id] = "→ #"; });
      const snap = (note: string, tones: Record<number, Tone>) => frames.push({ note, tones, badges: { ...badges } });
      snap("Every next pointer starts as null (#). Link each level left to right using the pointers of the level above, with no queue", { 0: "active" });
      let leftmost: number | null = 0;
      while (leftmost != null && kids[leftmost][0] != null) {
        let node: number | null = leftmost;
        while (node != null) {
          const [l, r] = kids[node] as [number, number], nx: number | null = next[node];
          next[l] = r; badges[l] = `→ ${val(r)}`;
          snap(`at ${val(node)}: ${val(l)}.next = ${val(r)}, its sibling under the same parent`, { [node]: "active", [l]: "found", [r]: "window" });
          if (nx != null) { const nl = kids[nx][0] as number; next[r] = nl; badges[r] = `→ ${val(nl)}`; snap(`${val(node)}.next is ${val(nx)}, so ${val(r)}.next = ${val(nx)}.left = ${val(nl)}, crossing over to the next parent`, { [node]: "active", [nx]: "window", [r]: "found", [nl]: "window" }); }
          else snap(`${val(node)}.next is null, so ${val(r)}.next stays null: nothing lies to its right`, { [node]: "active", [r]: "found" });
          node = nx;
        }
        const down = kids[leftmost][0] as number;
        snap(`the level starting at ${val(leftmost)} is wired; leftmost moves down to ${val(down)}${kids[down][0] == null ? ", which has no children, so the loop ends" : ""}`, { [leftmost]: "done", [down]: "active" });
        leftmost = down;
      }
      const chain = (h: number | null) => { const o: number[] = []; for (let c = h; c != null; c = next[c]) o.push(val(c)); return [...o, "#"].join(" "); };
      frames.push({ note: `every level is now a linked list read left to right: ${[0, 1, 3].map(chain).join(" | ")}`, tones: all(nodes.map((n) => n.id), "found"), badges: { ...badges } });
      return tree("Next right pointers, no queue", nodes, frames);
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
      const vals: V = [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, null, null, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], path: number[] = [], goal = 18;
      frames.push({ note: `Is there a root-to-leaf path summing to ${goal}? Carry the remaining target down and compare it with each leaf`, tones: {}, badges: { 0: String(goal) } });
      const go = (i: number | null, t: number): boolean => {
        if (i == null) return false; path.push(i); const leaf = kids[i][0] == null && kids[i][1] == null, hit = leaf && val(i) === t;
        frames.push({ note: leaf ? `leaf ${val(i)}: ${t} remains, ${hit ? `which equals ${val(i)}, so this path sums to ${goal}` : `which is not ${val(i)}, so no match here; back up`}` : `at ${val(i)}: ${t} remains, pass ${t} - ${val(i)} = ${t - val(i)} to the children`, tones: all(path, hit ? "found" : leaf ? "bad" : "active"), badges: { [i]: String(t) } });
        const ok = hit || (!leaf && (go(kids[i][0], t - val(i)) || go(kids[i][1], t - val(i)))); path.pop(); return ok;
      };
      const ok = go(0, goal);
      return tree(`Has a root-to-leaf path summing to ${goal}: ${ok}`, nodes, frames);
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
      const pre = [1, 2, 4, 5, 3, 6, 7], ino = [4, 2, 5, 1, 6, 3, 7], nodes: TNode[] = [], frames: TreeFrame[] = []; let p = 0;
      const go = (lo: number, hi: number, parent: number | null, side?: "L" | "R"): void => {
        if (lo > hi) return; const v = pre[p++], m = ino.indexOf(v), id = nodes.length; nodes.push({ id, label: String(v), parent, side });
        frames.push({ note: `preorder[${p - 1}] = ${v} is the root of inorder [${ino.slice(lo, hi + 1).join(", ")}]: left part [${ino.slice(lo, m).join(", ")}], right part [${ino.slice(m + 1, hi + 1).join(", ")}]`, tones: { [id]: "active" } });
        go(lo, m - 1, id, "L"); go(m + 1, hi, id, "R");
      };
      go(0, ino.length - 1, null);
      const ids = nodes.map((n) => n.id);
      return tree("Tree from preorder + inorder", nodes, [
        { note: `Rebuild a tree from preorder [${pre.join(", ")}] and inorder [${ino.join(", ")}]: preorder hands out roots, inorder says what lies left and right of each`, tones: all(ids, "muted") },
        ...frames.map((f, k) => ({ ...f, tones: { ...all(ids.slice(0, k), "done"), ...all(ids.slice(k + 1), "muted"), ...f.tones } })),
        { note: `preorder is used up and every range is empty: all ${ids.length} nodes are placed`, tones: all(ids, "found") },
      ]);
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
      const ino = [4, 2, 5, 1, 6, 3, 7], post = [4, 5, 2, 6, 7, 3, 1], stack = [...post], nodes: TNode[] = [], frames: TreeFrame[] = [];
      const go = (lo: number, hi: number, parent: number | null, side?: "L" | "R"): void => {
        if (lo > hi) return; const v = stack.pop()!, m = ino.indexOf(v), id = nodes.length; nodes.push({ id, label: String(v), parent, side });
        frames.push({ note: `pop ${v} from the end of postorder: it is the root of [${ino.slice(lo, hi + 1).join(", ")}]${hi > lo ? `; build the right part [${ino.slice(m + 1, hi + 1).join(", ")}] first, then the left part [${ino.slice(lo, m).join(", ")}]` : ", a single value with no children"}`, tones: { [id]: "active" } });
        go(m + 1, hi, id, "R"); go(lo, m - 1, id, "L");
      };
      go(0, ino.length - 1, null);
      const ids = nodes.map((n) => n.id);
      return tree("Tree from inorder + postorder", nodes, [
        { note: `Rebuild a tree from inorder [${ino.join(", ")}] and postorder [${post.join(", ")}]: the last postorder value is a root, and reading backwards gives root, right part, left part`, tones: all(ids, "muted") },
        ...frames.map((f, k) => ({ ...f, tones: { ...all(ids.slice(0, k), "done"), ...all(ids.slice(k + 1), "muted"), ...f.tones } })),
        { note: `postorder is empty and every range is used: all ${ids.length} nodes are placed`, tones: all(ids, "found") },
      ]);
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
      const vals: V = [10, 5, 15, 3, 7, 12, 20, null, null, null, null, 9], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], f = (x: number | null, neg: boolean) => (x == null ? (neg ? "-∞" : "∞") : String(x)), good: number[] = [], ranges: Record<number, string> = { 0: "(-∞, ∞)" };
      let bad = -1;
      frames.push({ note: "Check that every node lies strictly inside the open range its ancestors allow, starting with (-∞, ∞) at the root", tones: {}, badges: { ...ranges } });
      const ok = (i: number | null, lo: number | null, hi: number | null): boolean => {
        if (i == null) return true; const v = val(i), pass = (lo == null || lo < v) && (hi == null || v < hi); ranges[i] = `(${f(lo, true)}, ${f(hi, false)})`;
        if (pass) good.push(i); else bad = i;
        frames.push({ note: pass ? `${v} must be inside ${ranges[i]} and is: going left the upper bound becomes ${v}, going right the lower bound becomes ${v}` : `${v} must be inside ${ranges[i]} but is not ${lo != null && v <= lo ? `above ${lo}` : `below ${hi}`}, so the tree is invalid`, tones: { ...all(good, "done"), [i]: pass ? "active" : "bad" }, badges: { ...ranges } });
        return pass && ok(kids[i][0], lo, v) && ok(kids[i][1], v, hi);
      };
      const res = ok(0, null, null), par = nodes[nodes.findIndex((n) => n.id === bad)].parent as number;
      frames.push({ note: `return False: ${val(bad)} is smaller than its parent ${val(par)}, which is fine for a left child, yet an ancestor's bound rules it out`, tones: { ...all(good, "found"), [bad]: "bad" }, badges: { ...ranges } });
      return tree(`Valid BST: ${res}`, nodes, frames);
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
      const vals: V = [5, 3, 6, 2, 4, null, null, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], K = 4, stack: number[] = [], badges: Record<number, string> = {}, ord = `${K}th`;
      frames.push({ note: `Find the ${ord} smallest value. Inorder visits a BST in increasing order, so count pops and stop at ${K}`, tones: {} });
      let node: number | null = 0, k = K, ans = 0;
      while (true) {
        if (node != null) { const pushed: number[] = []; while (node != null) { stack.push(node); pushed.push(node); node = kids[node][0]; } frames.push({ note: `go left as far as possible, pushing ${pushed.map(val).join(", ")}: stack is [${stack.map(val).join(", ")}]`, tones: { ...all(stack, "window"), [pushed[pushed.length - 1]]: "active" }, badges: { ...badges } }); }
        const top = stack.pop()!, rt = kids[top][1]; k--; badges[top] = `#${K - k}`;
        frames.push({ note: `pop ${val(top)}: it is number ${K - k} in sorted order, ${k} more to go${k === 0 ? `, so the ${ord} smallest is ${val(top)}` : rt != null ? `; now visit its right child ${val(rt)}` : "; it has no right child, so pop the next one"}`, tones: { ...all(stack, "window"), [top]: k === 0 ? "found" : "active" }, badges: { ...badges } });
        if (k === 0) { ans = val(top); break; }
        node = rt;
      }
      return tree(`${ord} smallest: ${ans}`, nodes, trail(frames));
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
      const { nodes, kids, val } = B([50, 30, 70, 20, 40, 25, 23, 22, 24]), frames: TreeFrame[] = [], p = 22, q = 24, pq = nodes.filter((n) => +n.label === p || +n.label === q).map((n) => n.id);
      frames.push({ note: `Find the lowest common ancestor of ${p} and ${q}: from the root, go left while both are smaller, right while both are larger`, tones: all(pq, "window") });
      let i: number | null = 0, ans = 0;
      while (i != null) {
        const v = val(i);
        if (p < v && q < v) { frames.push({ note: `${p} and ${q} are both below ${v}, so they are both in its left subtree: go left`, tones: { ...all(pq, "window"), [i]: "active" } }); i = kids[i][0]; }
        else if (p > v && q > v) { frames.push({ note: `${p} and ${q} are both above ${v}, so they are both in its right subtree: go right`, tones: { ...all(pq, "window"), [i]: "active" } }); i = kids[i][1]; }
        else { ans = v; frames.push({ note: `${p} is below ${v} and ${q} is above it, so the two split here and ${v} is the lowest common ancestor`, tones: { ...all(pq, "window"), [i]: "found" } }); break; }
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
      const base = [40, 20, 60, 10, 30, 50, 70, 45, 55], { nodes, kids, val } = B(base), x = 47, nid = base.length, ghost: Record<number, Tone> = { [nid]: "muted" }, frames: TreeFrame[] = [];
      frames.push({ note: `Insert ${x}. Search for it like a lookup; the search ends at an empty child, and that empty spot is where the new node goes`, tones: { ...ghost } });
      let i: number | null = 0, parent = 0, side: "L" | "R" = "L";
      while (i != null) { const go: number = x < val(i) ? 0 : 1; frames.push({ note: `${x} ${go ? ">" : "<"} ${val(i)}, so go ${go ? "right" : "left"}${kids[i][go] == null ? ": that child is empty, so stop here" : ""}`, tones: { ...ghost, [i]: "active" } }); parent = i; side = go ? "R" : "L"; i = kids[i][go]; }
      nodes.push({ id: nid, label: String(x), parent, side });
      frames.push({ note: `attach ${x} as the ${side === "L" ? "left" : "right"} child of ${val(parent)}; no other node moves, so the BST order still holds`, tones: { [nid]: "found", [parent]: "active" } });
      return tree(`Insert ${x}`, nodes, trail(frames));
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
      const { nodes, kids, val } = B([50, 30, 70, 20, 40, 35, 45, 60, 80]), key = 30, frames: TreeFrame[] = [];
      frames.push({ note: `Delete ${key}. Find it first; a node with two children is replaced by its in-order successor, the smallest value to its right`, tones: {} });
      let i = 0;
      while (val(i) !== key) { const go = key < val(i) ? 0 : 1; frames.push({ note: `${key} ${go ? ">" : "<"} ${val(i)}, so go ${go ? "right" : "left"}`, tones: { [i]: "active" } }); i = kids[i][go] as number; }
      const [l, r] = kids[i] as [number, number];
      frames.push({ note: `found ${key}: it has two children (${val(l)} and ${val(r)}), so it cannot simply be cut out`, tones: { [i]: "bad" } });
      let s = r;
      for (;;) { const sl = kids[s][0]; frames.push({ note: sl != null ? `${val(s)} has a left child ${val(sl)}, so keep going left` : `${val(s)} has no left child: it is the smallest value in the right subtree, the successor`, tones: { [i]: "bad", [s]: sl != null ? "window" : "found" } }); if (sl == null) break; s = sl; }
      frames.push({ note: `copy ${val(s)} into the node that held ${key}`, tones: { [i]: "found", [s]: "window" }, labels: { [i]: String(val(s)) } });
      for (let t = r; t !== s; t = kids[t][0] as number) frames.push({ note: `now delete ${val(s)} from the right subtree: ${val(s)} < ${val(t)}, so go left`, tones: { [i]: "found", [t]: "active", [s]: "window" }, labels: { [i]: String(val(s)) } });
      frames.push({ note: `${val(s)} has no left child, so it is replaced by its right child, which is empty: the old leaf disappears`, tones: { [i]: "found", [s]: "muted" }, labels: { [i]: String(val(s)), [s]: "" } });
      frames.push({ note: `done: ${val(s)} now sits where ${key} was, ${val(r)} keeps only its right child ${val(kids[r][1] as number)}, and every value is still on the correct side`, tones: { [i]: "found", [s]: "muted", [r]: "done" }, labels: { [i]: String(val(s)), [s]: "" } });
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
      const vals: V = [5, 3, 6, 2, 4, null, 7], { nodes, kids, val } = T(vals), k = 13, seen: number[] = [], frames: TreeFrame[] = [], idOf = (v: number) => nodes.find((n) => +n.label === v)!.id;
      frames.push({ note: `Do two values add up to ${k}? Visit nodes in preorder, keep the values seen in a set, and stop when ${k} - value is already in it`, tones: {} });
      const dfs = (i: number | null): boolean => {
        if (i == null) return false; const v = val(i), need = k - v, hit = seen.includes(need);
        frames.push({ note: hit ? `${v}: need ${need}, which is in the set {${seen.join(", ")}}, so ${need} + ${v} = ${k}` : `${v}: need ${need}, which is not in the set {${seen.join(", ")}}; add ${v} to the set`, tones: hit ? { [i]: "found", [idOf(need)]: "found" } : { ...all(seen.map(idOf), "done"), [i]: "active" } });
        if (hit) return true; seen.push(v); return dfs(kids[i][0]) || dfs(kids[i][1]);
      };
      const ok = dfs(0);
      return tree(`Two values summing to ${k}: ${ok}`, nodes, frames);
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
      const n0 = 0b10110101, blank = Array(8).fill(""), frames: CellsFrame[] = [{ note: `Count the set bits of ${n0} = ${bin(n0).join("")}. Each n & (n - 1) clears the lowest 1, so count the rounds until n reaches 0`, rows: [bin(n0), blank, blank] }];
      let n = n0, c = 0;
      while (n) { const low = n & -n, m = n & (n - 1), col = 7 - Math.log2(low); c++; frames.push({ note: `n = ${n}: n - 1 = ${n - 1} turns the lowest 1 (worth ${low}) into 0 and the zeros below it into 1s, so n & (n - 1) = ${m}; count = ${c}`, rows: [bin(n), bin(n - 1), bin(m)], tones: { ...range(col, 7, 1, "window"), [`0:${col}`]: "bad", [`2:${col}`]: "found" } }); n = m; }
      frames.push({ note: `n is 0 after ${c} rounds, so ${n0} has ${c} set bits`, rows: [bin(0), blank, blank], tones: range(0, 7, 0, "found") });
      return cells(`Set bits in ${n0}: ${c}`, [bin(n0), blank, blank], frames, ["n", "n - 1", "n & (n - 1)"]);
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
      const x = 93, y = 47, z = x ^ y, W = 8, blank = Array(W).fill(""), frames: CellsFrame[] = [], ones = bin(z, W).map((b, i) => (b === "1" ? i : -1)).filter((i) => i >= 0), rows = [bin(x, W), bin(y, W), bin(z, W)];
      frames.push({ note: `x = ${x} and y = ${y}: count the bit positions where they differ`, rows: [bin(x, W), bin(y, W), blank] });
      frames.push({ note: `x ^ y = ${z}: XOR is 1 exactly where the two bits differ, and ${ones.length} of the ${W} columns do`, rows, tones: all(ones.map((i) => `2:${i}`), "window") });
      ones.forEach((i, k) => frames.push({ note: `bit ${W - 1 - i}: x has ${rows[0][i]} and y has ${rows[1][i]}, so they differ; count = ${k + 1}`, rows, tones: { ...all(ones.slice(0, k).map((j) => `2:${j}`), "done"), [`0:${i}`]: "active", [`1:${i}`]: "active", [`2:${i}`]: "found" } }));
      frames.push({ note: `${ones.length} set bits in ${z}, so the Hamming distance of ${x} and ${y} is ${ones.length}`, rows, tones: all(ones.map((j) => `2:${j}`), "found") });
      return cells(`Hamming distance of ${x} and ${y}: ${ones.length}`, [bin(x, W), bin(y, W), blank], frames, ["x", "y", "x ^ y"]);
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
      const a = [5, 0, 3, 1, 4], idx = a.map((_, i) => i), frames: CellsFrame[] = []; let x = a.length;
      const rows = () => [idx, a, bin(x, 3)];
      frames.push({ note: `nums holds the numbers 0..${a.length} with one missing. Start with x = n = ${x}, then XOR in every index and every value`, rows: rows() });
      a.forEach((v, i) => { const prev = x; x ^= i ^ v; frames.push({ note: `index ${i}, value ${v}: x = ${prev} ^ ${i} ^ ${v} = ${x}`, rows: rows(), tones: { [`0:${i}`]: "active", [`1:${i}`]: "active", ...range(0, 2, 2, "window") } }); });
      frames.push({ note: `every number from 0 to ${a.length} except one met itself once as an index (or n) and once as a value, so they cancelled: ${x} is missing`, rows: rows(), tones: range(0, 2, 2, "found") });
      return cells(`Missing number: ${x}`, [idx, a, bin(a.length, 3)], frames, ["index", "nums", "x in binary"]);
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
      const a = [1, 2, 3], out: number[][] = [[]], by: string[] = ["start"], frames: TableFrame[] = [], view = () => Array.from({ length: 8 }, (_, i) => (i < out.length ? [`[${out[i].join(", ")}]`, by[i]] : [null, null]));
      frames.push({ note: "Start with one subset, the empty one. For each number, copy every existing subset and append the number to the copy", cells: view() });
      for (const x of a) { const n = out.length; for (let k = 0; k < n; k++) { const s = [...out[k], x]; out.push(s); by.push(`[${out[k].join(", ")}] + ${x}`); frames.push({ note: `x = ${x}: copy [${out[k].join(", ")}] and append ${x} to get [${s.join(", ")}] (${out.length} subsets so far)`, cells: view(), tones: { [`${out.length - 1}:0`]: "found" } }); } }
      frames.push({ note: `each of the ${a.length} numbers doubled the list, so ${out.length} subsets in total`, cells: view(), tones: all(out.map((_, i) => `${i}:0`), "found") });
      return table(`All ${out.length} subsets of [1, 2, 3]`, nums(8), ["subset", "made by"], frames);
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
  "repeated-dna-sequences": {
    approach: "Slide a 10-letter window over the string, counting each window in a dictionary; report a window the moment its count reaches 2.",
    idea: ["Every 10-letter substring is one window start, so there are n - 9 of them.", "Count them in a hash map.", "Record a sequence exactly once, when it is seen for the second time."],
    code: `def findRepeatedDnaSequences(s):
    seen, out = {}, []
    for i in range(len(s) - 9):
        w = s[i:i + 10]
        seen[w] = seen.get(w, 0) + 1
        if seen[w] == 2:
            out.append(w)
    return out`,
    lang: "python", time: "O(n · 10)", space: "O(n)",
    viz: () => {
      const s = "ACGTACGTAC", L = 4, seen = new Map<string, number>(), out: string[] = [], frames: CellsFrame[] = [];
      for (let i = 0; i + L <= s.length; i++) { const w = s.slice(i, i + L), c = (seen.get(w) || 0) + 1; seen.set(w, c); if (c === 2) out.push(w); frames.push({ note: `window ${i}: "${w}" seen ${c} time${c === 1 ? "" : "s"}${c === 2 ? " → repeated, record it" : ""}`, tones: range(i, i + L - 1, 0, c >= 2 ? "found" : "window") }); }
      frames.push({ note: `repeated: ${out.map((w) => `"${w}"`).join(", ")}. The real problem uses windows of 10; 4 keeps the demo short.`, tones: {} });
      return cells(`Repeated windows of length ${L}`, [[...s]], frames);
    },
  },

  "maximum-length-of-a-concatenated-string-with-unique-characters": {
    approach: "Turn each word into a 26-bit letter mask (skip words with repeats); grow a list of reachable masks, adding a word only when it shares no letter.",
    idea: ["A word with a repeated letter can never be used.", "Two masks can be combined when mask1 & mask2 == 0 (no shared letter).", "Like building subsets: for each word, extend every compatible combination found so far. The longest one is the answer."],
    code: `def maxLength(arr):
    combos = [(0, 0)]
    for w in arr:
        m = 0
        for ch in w:
            b = 1 << (ord(ch) - 97)
            if m & b:
                break
            m |= b
        else:
            combos += [(c | m, n + len(w)) for c, n in combos if not c & m]
    return max(n for _, n in combos)`,
    lang: "python", time: "O(2^n)", space: "O(2^n)",
    viz: () => {
      const arr = ["un", "aa", "iq", "ue"], combos: string[] = [""], frames: TableFrame[] = [], view = () => Array.from({ length: 6 }, (_, i) => (i < combos.length ? [combos[i] || "(empty)", combos[i].length] : [null, null]));
      frames.push({ note: `Words ${arr.map((w) => `"${w}"`).join(", ")}: grow a list of valid combinations, starting with the empty one`, cells: view() });
      for (const w of arr) {
        if (new Set(w).size < w.length) { frames.push({ note: `"${w}" repeats a letter, so it can never be used: skip it`, cells: view() }); continue; }
        const n = combos.length;
        for (let k = 0; k < n; k++) {
          const c = combos[k], share = [...w].find((ch) => c.includes(ch));
          if (share) frames.push({ note: `"${w}" with "${c}": both contain "${share}", so skip`, cells: view(), tones: { [`${k}:0`]: "bad" } });
          else { combos.push(c + w); frames.push({ note: `"${w}" with ${c ? `"${c}"` : "the empty combination"}: no shared letter, so add "${c + w}" (length ${c.length + w.length})`, cells: view(), tones: { [`${k}:0`]: "active", [`${combos.length - 1}:0`]: "found" } }); }
        }
      }
      const best = Math.max(...combos.map((c) => c.length)), top = combos.filter((c) => c.length === best);
      frames.push({ note: `the longest combinations have ${best} letters (${top.map((c) => `"${c}"`).join(", ")}), so return ${best}`, cells: view(), tones: Object.fromEntries(combos.map((c, i) => [`${i}:1`, c.length === best ? "found" : "muted"])) as Record<string, Tone> });
      return table(`Longest unique concatenation: ${best}`, nums(6), ["combination", "length"], frames);
    },
  },

  "power-of-two": {
    approach: "A power of two has exactly one set bit, so n > 0 and n & (n - 1) == 0.",
    idea: ["n - 1 turns the lowest set bit off and every bit below it on.", "If that was the only set bit, n & (n - 1) is 0.", "Zero and negatives are never powers of two."],
    code: `def isPowerOfTwo(n):
    return n > 0 and n & (n - 1) == 0`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const xs = [64, 0, 12], blank = Array(8).fill(""), b8 = (v: number) => bin(v & 255), frames: CellsFrame[] = [{ note: "A power of two has exactly one set bit. Check n > 0 first, then n & (n - 1) == 0, which clears the lowest set bit", rows: [bin(64), blank, blank] }], good: number[] = [];
      for (const x of xs) {
        if (x <= 0) { frames.push({ note: `${x} is not above 0, so the guard rejects it (without the guard, 0 & -1 = 0 would wrongly pass)`, rows: [bin(x), b8(x - 1), bin(x & (x - 1))], tones: range(0, 7, 0, "bad") }); continue; }
        const ok = (x & (x - 1)) === 0; if (ok) good.push(x);
        frames.push({ note: `${x} > 0 passes the guard; now clear its lowest set bit with ${x} & ${x - 1}`, rows: [bin(x), b8(x - 1), blank], tones: range(0, 7, 1, "window") });
        frames.push({ note: `${x} & ${x - 1} = ${x & (x - 1)}: ${ok ? "nothing is left, so exactly one bit was set and it is a power of two" : "bits remain, so more than one was set and it is not a power of two"}`, rows: [bin(x), b8(x - 1), bin(x & (x - 1))], tones: range(0, 7, 2, ok ? "found" : "bad") });
      }
      frames.push({ note: `among ${xs.join(", ")} only ${good.join(", ")} ${good.length === 1 ? "is a power of two" : "are powers of two"}`, rows: [bin(good[0]), b8(good[0] - 1), bin(0)], tones: range(0, 7, 2, "found") });
      return cells("n & (n - 1) clears the only set bit", [bin(64), blank, blank], frames, ["n", "n - 1", "n & (n - 1)"]);
    },
  },

  "power-of-four": {
    approach: "Power of two (one set bit) whose set bit sits at an even position: n & 0x55555555 keeps only those positions.",
    idea: ["Powers of four are 1, 4, 16, 64: one set bit at position 0, 2, 4, 6.", "n > 0 and n & (n - 1) == 0 checks there is exactly one set bit.", "0x55555555 is 0101...01, so n & mask is non-zero only if that bit is at an even position."],
    code: `def isPowerOfFour(n):
    return n > 0 and n & (n - 1) == 0 and n & 0x55555555 != 0`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const mask = 0x55, xs = [16, 8, 5], blank = Array(8).fill(""), frames: CellsFrame[] = [{ note: "A power of four has one set bit, at an even position. Test n & (n - 1) == 0 for one bit, then n & mask for the position (an 8-bit mask 0x55 here, 0x55555555 in the real code)", rows: [bin(16), blank, blank] }], good: number[] = [];
      for (const x of xs) {
        const one = (x & (x - 1)) === 0, even = (x & mask) !== 0;
        frames.push({ note: one ? `${x} & ${x - 1} = 0, so ${x} has exactly one set bit; next check where that bit sits` : `${x} & ${x - 1} = ${x & (x - 1)}, which is not 0, so ${x} has more than one set bit and cannot be a power of four`, rows: [bin(x), bin(x - 1), bin(x & (x - 1))], tones: range(0, 7, 2, one ? "window" : "bad") });
        if (!one) continue;
        if (even) good.push(x);
        frames.push({ note: `${x} & 0x55 = ${x & mask}: ${even ? "the set bit is at an even position, so the mask keeps it and it is a power of four" : "the set bit is at an odd position, so the mask wipes it out and it is not a power of four"}`, rows: [bin(x), bin(mask), bin(x & mask)], tones: range(0, 7, 2, even ? "found" : "bad") });
      }
      frames.push({ note: `among ${xs.join(", ")} only ${good.join(", ")} ${good.length === 1 ? "is a power of four" : "are powers of four"}`, rows: [bin(good[0]), bin(mask), bin(good[0] & mask)], tones: range(0, 7, 2, "found") });
      return cells("Power of four: one bit, at an even position", [bin(16), blank, blank], frames, ["n", "n - 1 or mask", "AND"]);
    },
  },

  "sum-of-two-integers": {
    approach: "a ^ b adds without carries and (a & b) << 1 is the carry; repeat until the carry is 0, masking to 32 bits in Python.",
    idea: ["XOR adds each column but drops the carry.", "AND finds the columns where both bits are 1; shifting left moves each carry to the next column.", "Add the carry the same way until nothing carries. Python integers are unbounded, so mask to 32 bits and convert back for negative results."],
    code: `def getSum(a, b):
    mask = 0xFFFFFFFF
    while b & mask:
        a, b = a ^ b, (a & b) << 1
    return a & mask if b > 0 else a`,
    lang: "python", time: "O(32)", space: "O(1)",
    viz: () => {
      let a = 11, b = 5; const frames: CellsFrame[] = [{ note: `a = ${a}, b = ${b}`, rows: [bin(a), bin(b)] }];
      while (b) { const x = a ^ b, c = (a & b) << 1; frames.push({ note: `sum without carry a ^ b = ${x}; carry (a & b) << 1 = ${c}`, rows: [bin(x), bin(c)], tones: all(bin(c).map((v, i) => (v === "1" ? `1:${i}` : "")).filter(Boolean), "active") }); a = x; b = c; }
      frames.push({ note: `carry is 0 → 11 + 5 = ${a}`, rows: [bin(a), bin(0)], tones: range(0, 7, 0, "found") });
      return cells(`11 + 5 without + : ${a}`, [bin(11), bin(5)], frames, ["a", "b (carry)"]);
    },
  },

  "power-of-three": {
    approach: "Divide by 3 while it divides evenly; a power of three ends at exactly 1.",
    idea: ["3^k divided by 3 k times is 1.", "Any other prime factor stays behind, so the loop stops at something other than 1.", "Numbers below 1 are never powers of three."],
    code: `def isPowerOfThree(n):
    if n < 1:
        return False
    while n % 3 == 0:
        n //= 3
    return n == 1`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const rows: (string | number)[][] = [], frames: TableFrame[] = [];
      for (const start of [27, 45]) { let n = start; while (n % 3 === 0) { rows.push([start, n, n / 3]); frames.push({ note: `${n} % 3 = 0 → ${n} / 3 = ${n / 3}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); n /= 3; } rows.push([start, n, n === 1 ? "yes" : "no"]); frames.push({ note: `${n} is not divisible by 3: ${start} ${n === 1 ? "ended at 1 → power of three" : `left ${n} → not a power of three`}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2], tones: { [`${rows.length - 1}:2`]: n === 1 ? "found" : "bad" } }); }
      return table("Divide out every 3", nums(rows.length), ["start", "n", "n / 3"], frames.map((f) => ({ ...f, cells: [...f.cells, ...Array(rows.length - f.cells.length).fill([null, null, null])] })));
    },
  },

  "divide-two-integers": {
    approach: "Subtract the largest doubled copy of the divisor (b, 2b, 4b, ...) that still fits, adding the matching power of two to the quotient.",
    idea: ["Work with absolute values and fix the sign at the end.", "Double the divisor with shifts until the next doubling would exceed what is left.", "Subtract it and add its multiple to the quotient; repeat. Each round is O(log n), so the whole thing is O(log² n).", "The only overflow is -2^31 / -1, which is clamped to 2^31 - 1."],
    code: `def divide(dividend, divisor):
    if dividend == -2**31 and divisor == -1:
        return 2**31 - 1
    neg = (dividend < 0) != (divisor < 0)
    a, b, q = abs(dividend), abs(divisor), 0
    while a >= b:
        t, m = b, 1
        while a >= t << 1:
            t <<= 1
            m <<= 1
        a -= t
        q += m
    return -q if neg else q`,
    lang: "python", time: "O(log² n)", space: "O(1)",
    viz: () => {
      const dividend = -29, divisor = 3, neg = (dividend < 0) !== (divisor < 0), b = Math.abs(divisor), rows: (string | number)[][] = [], heads: string[] = [], frames: TableFrame[] = [];
      let a = Math.abs(dividend), q = 0, round = 0;
      const push = (h: string, r: (string | number)[], note: string, tones?: Record<string, Tone>) => { heads.push(h); rows.push(r); frames.push({ note, cells: rows.map((x) => [...x]), active: [rows.length - 1, 3], tones }); };
      while (a >= b) {
        let t = b, m = 1; round++;
        push(round === 1 ? "start" : `round ${round}`, [a, t, m, q], round === 1 ? `${dividend} / ${divisor}: the signs differ, so work on ${a} / ${b} and negate at the end; t = ${t} is 1 x ${b}` : `${a} is still at least ${b}, so another round restarts from t = ${t}, m = 1`);
        while (a >= t << 1) { t <<= 1; m <<= 1; push("double", [a, t, m, q], `${t / 2} doubled is ${t}, which still fits in ${a}, so t = ${t} = ${m} x ${b}`); }
        const before = a; a -= t; q += m;
        push("subtract", [a, t, m, q], `doubling again would give ${t << 1}, more than ${before}, so keep t = ${t}: ${before} - ${t} = ${a}, and add ${m} to the quotient → ${q}`);
      }
      frames.push({ note: `${a} is less than ${b}, so stop: the quotient ${q} gets its sign back, giving ${neg ? -q : q}`, cells: rows.map((x) => [...x]), tones: { [`${rows.length - 1}:3`]: "found" } });
      return table(`${dividend} / ${divisor} = ${neg ? -q : q} with shifts`, heads, ["left", "t", "m", "quotient"], frames);
    },
  },

  "xor-queries-of-a-subarray": {
    approach: "Prefix XOR X[i] = arr[0] ^ ... ^ arr[i - 1]; the XOR of arr[l..r] is X[r + 1] ^ X[l].",
    idea: ["XOR is its own inverse: x ^ x = 0.", "X[r + 1] covers arr[0..r] and X[l] covers arr[0..l - 1]; XORing them cancels the shared prefix.", "Build X once in O(n), then answer each query in O(1)."],
    code: `def xorQueries(arr, queries):
    X = [0]
    for v in arr:
        X.append(X[-1] ^ v)
    return [X[r + 1] ^ X[l] for l, r in queries]`,
    lang: "python", time: "O(n + q)", space: "O(n)",
    viz: () => {
      const a = [1, 3, 4, 8], Q = [[0, 1], [1, 2], [0, 3], [3, 3]], X: (string | number)[] = [0], frames: CellsFrame[] = [], pad = (r: (string | number)[]) => [...r, ...Array(a.length + 1 - r.length).fill("")], out: number[] = [];
      frames.push({ note: `arr = [${a.join(", ")}], queries ${Q.map(([l, r]) => `[${l}, ${r}]`).join(", ")}. Build the prefix XOR X once, starting with X[0] = 0`, rows: [pad(a), pad(X)] });
      a.forEach((v, i) => { X.push(+X[i] ^ v); frames.push({ note: `X[${i + 1}] = X[${i}] ^ arr[${i}] = ${X[i]} ^ ${v} = ${X[i + 1]}`, rows: [pad(a), pad(X)], tones: { [`0:${i}`]: "active", [`1:${i}`]: "window", [`1:${i + 1}`]: "found" } }); });
      for (const [l, r] of Q) { out.push(+X[r + 1] ^ +X[l]); frames.push({ note: `query [${l}, ${r}]: X[${r + 1}] ^ X[${l}] = ${X[r + 1]} ^ ${X[l]} = ${out[out.length - 1]}, because the shared prefix cancels`, rows: [pad(a), pad(X)], tones: { ...range(l, r, 0), [`1:${r + 1}`]: "found", [`1:${l}`]: "bad" } }); }
      frames.push({ note: `every query took one XOR of two prefix values: answers [${out.join(", ")}]`, rows: [pad(a), pad(X)], tones: range(0, a.length, 1, "found") });
      return cells(`Answers: [${out.join(", ")}]`, [pad(a), pad(X)], frames, ["arr", "X"]);
    },
  },

  "decode-xored-permutation": {
    approach: "XOR of 1..n is the XOR of the whole permutation; XOR of encoded[1], encoded[3], ... is the XOR of every element except perm[0], so perm[0] falls out.",
    idea: ["perm is a permutation of 1..n with n odd, so XOR(1..n) = XOR of all of perm.", "encoded[1] ^ encoded[3] ^ ... = perm[1] ^ perm[2] ^ ... ^ perm[n - 1].", "XOR those two to get perm[0], then perm[i + 1] = perm[i] ^ encoded[i]."],
    code: `def decode(encoded):
    n = len(encoded) + 1
    total = 0
    for i in range(1, n + 1):
        total ^= i
    rest = 0
    for i in range(1, n - 1, 2):
        rest ^= encoded[i]
    perm = [total ^ rest]
    for e in encoded:
        perm.append(perm[-1] ^ e)
    return perm`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const enc = [6, 5, 4, 6], n = enc.length + 1, frames: CellsFrame[] = []; let total = 0, rest = 0;
      for (let i = 1; i <= n; i++) total ^= i;
      const perm: (string | number)[] = Array(n).fill(""), E = [...enc, ""];
      frames.push({ note: `XOR of 1..${n} = ${total}: the XOR of the whole permutation`, rows: [E, [...perm]] });
      for (let i = 1; i < n - 1; i += 2) rest ^= enc[i];
      frames.push({ note: `encoded[1] ^ encoded[3] = ${enc[1]} ^ ${enc[3]} = ${rest}: that is perm[1] ^ ... ^ perm[4]`, rows: [E, [...perm]], tones: { "0:1": "active", "0:3": "active" } });
      perm[0] = total ^ rest; frames.push({ note: `perm[0] = ${total} ^ ${rest} = ${perm[0]}`, rows: [E, [...perm]], tones: { "1:0": "found" } });
      for (let i = 0; i < enc.length; i++) { perm[i + 1] = +perm[i] ^ enc[i]; frames.push({ note: `perm[${i + 1}] = perm[${i}] ^ encoded[${i}] = ${perm[i]} ^ ${enc[i]} = ${perm[i + 1]}`, rows: [E, [...perm]], tones: { [`0:${i}`]: "active", [`1:${i + 1}`]: "found" } }); }
      return cells(`Decoded: [${perm.join(", ")}]`, [E, perm.map(() => "")], frames, ["encoded", "perm"]);
    },
  },

  "find-greatest-common-divisor-of-array": {
    approach: "Find the smallest and largest numbers and return their gcd with Euclid's algorithm.",
    idea: ["Only min and max matter, so one pass finds them.", "gcd(a, b) = gcd(b, a mod b) until the remainder is 0."],
    code: `def findGCD(nums):
    a, b = max(nums), min(nums)
    while b:
        a, b = b, a % b
    return a`,
    lang: "python", time: "O(n + log m)", space: "O(1)",
    viz: () => {
      const arr = [24, 30, 39, 27, 33], hi = Math.max(...arr), lo = Math.min(...arr), rows: (string | number)[][] = [], frames: TableFrame[] = [];
      frames.push({ note: `nums = [${arr.join(", ")}]: only the smallest and largest numbers matter, so find them and then run Euclid's algorithm`, cells: [] });
      frames.push({ note: `one pass finds the largest ${hi} and the smallest ${lo}`, cells: [] });
      let a = hi, b = lo;
      while (b) { rows.push([a, b, a % b]); frames.push({ note: `${a} mod ${b} = ${a % b}, so gcd(${a}, ${b}) becomes gcd(${b}, ${a % b})`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); [a, b] = [b, a % b]; }
      frames.push({ note: `the remainder is 0, so the gcd of ${lo} and ${hi} is ${a}`, cells: rows.map((r) => [...r]), tones: { [`${rows.length - 1}:1`]: "found" } });
      return table(`gcd(${lo}, ${hi}) = ${a}`, rows.map((_, i) => `step ${i + 1}`), ["a", "b", "a mod b"], frames.map((f) => ({ ...f, cells: [...f.cells, ...Array(rows.length - f.cells.length).fill([null, null, null])] })));
    },
  },
  "x-of-a-kind-in-a-deck-of-cards": {
    approach: "Count each value; a group size X works for every value only if it divides every count, so check gcd(counts) ≥ 2.",
    idea: ["Each value's cards must split into groups of exactly X, so X divides its count.", "X must divide all counts at once, so the largest choice is their gcd.", "Any gcd of 2 or more works."],
    code: `from collections import Counter
from math import gcd
from functools import reduce
def hasGroupsSizeX(deck):
    return reduce(gcd, Counter(deck).values()) >= 2`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const counts = [6, 9, 12, 18], gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x), gs: number[] = [], frames: TableFrame[] = [];
      let g = 0; counts.forEach((c) => { g = gcd(g, c); gs.push(g); });
      const view = (nc: number, ng: number) => counts.map((c, i) => [i + 1, i < nc ? c : null, i < ng ? gs[i] : null]);
      frames.push({ note: `A deck of ${counts.reduce((x, y) => x + y, 0)} cards has ${counts.length} different values. Can every value be split into groups of the same size X, with X at least 2?`, cells: view(0, 0) });
      frames.push({ note: `count each value: ${counts.map((c, i) => `${i + 1} appears ${c} times`).join(", ")}; X must divide every count`, cells: view(counts.length, 0) });
      counts.forEach((c, i) => frames.push({ note: `reduce with gcd: gcd(${i ? gs[i - 1] : 0}, ${c}) = ${gs[i]}${i ? "" : " (gcd with 0 is the other number)"}`, cells: view(counts.length, i + 1), active: [i, 2] }));
      frames.push({ note: `the gcd of all counts is ${g}, at least 2, so every value splits into groups of ${g}: return True`, cells: view(counts.length, counts.length), tones: { [`${counts.length - 1}:2`]: "found" } });
      return table(`Groups of size ${g}: true`, counts.map((_, i) => `value ${i + 1}`), ["value", "count", "gcd so far"], frames);
    },
  },

  "greatest-common-divisor-of-strings": {
    approach: "A common divisor exists only if s1 + s2 == s2 + s1; then the answer is the prefix of length gcd(len1, len2).",
    idea: ["If both strings are repeats of some t, joining them in either order gives the same string.", "If the two joins differ, no common divisor exists.", "When they match, the longest divisor has length gcd of the two lengths."],
    code: `from math import gcd
def gcdOfStrings(str1, str2):
    if str1 + str2 != str2 + str1:
        return ""
    return str1[:gcd(len(str1), len(str2))]`,
    lang: "python", time: "O(m + n)", space: "O(m + n)",
    viz: () => {
      const a = "ABABAB", b = "ABAB", x = [...(a + b)], y = [...(b + a)], blank = x.map(() => ""), frames: CellsFrame[] = [];
      frames.push({ note: `str1 = "${a}", str2 = "${b}": a common divisor block exists only if joining them in either order gives the same string`, rows: [blank, blank] });
      frames.push({ note: `str1 + str2 = "${a + b}"`, rows: [x, blank], tones: { ...range(0, a.length - 1, 0, "window"), ...range(a.length, x.length - 1, 0, "active") } });
      frames.push({ note: `str2 + str1 = "${b + a}"`, rows: [x, y], tones: { ...range(0, a.length - 1, 0, "window"), ...range(a.length, x.length - 1, 0, "active"), ...range(0, b.length - 1, 1, "active"), ...range(b.length, y.length - 1, 1, "window") } });
      frames.push({ note: `the two strings match at all ${x.length} positions, so both are repeats of one block`, rows: [x, y], tones: { ...range(0, x.length - 1, 0, "done"), ...range(0, y.length - 1, 1, "done") } });
      let p = a.length, r = b.length;
      while (r) { frames.push({ note: `block length is the gcd of the lengths: ${p} mod ${r} = ${p % r}, so gcd(${p}, ${r}) becomes gcd(${r}, ${p % r})`, rows: [x, y], tones: { ...range(0, x.length - 1, 0, "done"), ...range(0, y.length - 1, 1, "done") } }); [p, r] = [r, p % r]; }
      frames.push({ note: `gcd is ${p}, so the answer is the first ${p} characters, "${a.slice(0, p)}"`, rows: [x, y], tones: { ...range(0, p - 1, 0, "found"), ...range(0, p - 1, 1, "found") } });
      return cells(`gcd("${a}", "${b}") = "${a.slice(0, p)}"`, [blank, blank], frames, ["s1 + s2", "s2 + s1"]);
    },
  },

  "count-primes": {
    approach: "Sieve of Eratosthenes: for each prime p, cross out p², p² + p, ... up to n; count what stays.",
    idea: ["Start with every number from 2 to n - 1 marked prime.", "For each p still marked, its multiples are composite. Start at p², since smaller multiples were crossed out by smaller primes.", "Stop once p² ≥ n. The marks left are the primes."],
    code: `def countPrimes(n):
    if n < 3:
        return 0
    is_p = [True] * n
    is_p[0] = is_p[1] = False
    for p in range(2, int(n ** 0.5) + 1):
        if is_p[p]:
            is_p[p * p::p] = [False] * len(range(p * p, n, p))
    return sum(is_p)`,
    lang: "python", time: "O(n log log n)", space: "O(n)",
    viz: () => {
      const n = 16, row = Array.from({ length: n - 2 }, (_, i) => i + 2), comp = new Set<number>(), frames: CellsFrame[] = [];
      const tn = (p: number, fresh: number[] = []) => Object.fromEntries(row.map((x, i) => [`0:${i}`, x === p ? "active" : fresh.includes(x) ? "bad" : comp.has(x) ? "muted" : "window"])) as Record<string, Tone>;
      frames.push({ note: `Count the primes below ${n} with a sieve: every number starts marked prime, and each prime p crosses out its multiples from p² on`, tones: {} });
      for (let p = 2; p * p <= n; p++) {
        if (comp.has(p)) { frames.push({ note: `${p} is already crossed out (a multiple of a smaller prime), so skip it: its multiples are gone too`, tones: tn(p) }); continue; }
        frames.push({ note: `${p} is still marked prime; its multiples start at ${p}² = ${p * p}, since smaller ones were crossed by smaller primes`, tones: tn(p) });
        const cross: number[] = [], fresh: number[] = []; for (let m = p * p; m < n; m += p) { cross.push(m); if (!comp.has(m)) { comp.add(m); fresh.push(m); } }
        frames.push({ note: `cross out ${cross.join(", ")}${cross.length > fresh.length ? ` (${cross.filter((m) => !fresh.includes(m)).join(", ")} already gone)` : ""}`, tones: tn(p, fresh) });
      }
      const pr = row.filter((x) => !comp.has(x));
      frames.push({ note: `the next prime squared is at least ${n}, so stop: the marks left are ${pr.join(", ")}, which is ${pr.length} primes`, tones: Object.fromEntries(row.map((x, i) => [`0:${i}`, comp.has(x) ? "muted" : "found"])) as Record<string, Tone> });
      return cells(`Primes below ${n}: ${pr.length}`, [row], frames);
    },
  },

  "prime-arrangements": {
    approach: "Count the primes p in 1..n; primes can be permuted among the p prime positions and the rest among the others: p! · (n - p)!.",
    idea: ["Prime values must sit on prime indices, so they only swap among themselves: p! ways.", "The other n - p values fill the other positions: (n - p)! ways.", "Multiply and take mod 10^9 + 7."],
    code: `def numPrimeArrangements(n):
    MOD = 10**9 + 7
    p = sum(all(k % d for d in range(2, int(k ** 0.5) + 1)) for k in range(2, n + 1))
    ans = 1
    for k in range(2, p + 1):
        ans = ans * k % MOD
    for k in range(2, n - p + 1):
        ans = ans * k % MOD
    return ans`,
    lang: "python", time: "O(n√n)", space: "O(1)",
    viz: () => {
      const n = 7, MOD = 1000000007, row = Array.from({ length: n }, (_, i) => i + 1), isP = (k: number) => k > 1 && Array.from({ length: Math.floor(Math.sqrt(k)) - 1 }, (_, i) => i + 2).every((d) => k % d), primes = row.filter(isP), p = primes.length, frames: CellsFrame[] = [];
      frames.push({ note: `Arrange the numbers 1..${n} so every prime sits on a prime position (1-indexed). Count the primes p, then multiply p! by (n - p)!`, tones: {} });
      frames.push({ note: `the primes up to ${n} are ${primes.join(", ")}, so p = ${p}; the other ${n - p} numbers are not prime`, tones: Object.fromEntries(row.map((k, i) => [`0:${i}`, isP(k) ? "found" : "muted"])) as Record<string, Tone> });
      let ans = 1;
      for (let k = 2; k <= p; k++) { const prev = ans; ans = (ans * k) % MOD; frames.push({ note: `k = ${k}: ans = ${prev} x ${k} = ${ans}${k === p ? `, which is ${p}! ways to order the primes among prime positions` : ""}`, tones: all(primes.map((v) => `0:${v - 1}`), "active") }); }
      for (let k = 2; k <= n - p; k++) { const prev = ans; ans = (ans * k) % MOD; frames.push({ note: `k = ${k}: ans = ${prev} x ${k} = ${ans}${k === n - p ? `, which multiplies in ${n - p}! ways for the other numbers` : ""}`, tones: all(row.filter((v) => !isP(v)).map((v) => `0:${v - 1}`), "window") }); }
      frames.push({ note: `${p}! x ${n - p}! = ${ans} arrangements (mod ${MOD})`, tones: range(0, n - 1, 0, "found") });
      return cells(`n = ${n}: ${ans} arrangements`, [row], frames, ["value / index"]);
    },
  },

  "prime-number-of-set-bits-in-binary-representation": {
    approach: "For each number in the range, count its set bits and check that count against the small set of primes up to 20.",
    idea: ["Numbers are below 2^20, so a bit count is at most 20.", "The primes up to 20 are 2, 3, 5, 7, 11, 13, 17, 19: a fixed set.", "Count numbers whose bit count is in that set."],
    code: `def countPrimeSetBits(left, right):
    primes = {2, 3, 5, 7, 11, 13, 17, 19}
    return sum(bin(x).count("1") in primes for x in range(left, right + 1))`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const L = 6, R = 12, P = new Set([2, 3, 5, 7, 11, 13, 17, 19]), rows: (string | number)[][] = [], frames: TableFrame[] = []; let c = 0;
      frames.push({ note: `Count the numbers in [${L}, ${R}] whose binary form has a prime number of 1 bits (the possible counts are small: the primes 2, 3, 5, 7, ...)`, cells: [] });
      for (let x = L; x <= R; x++) { const b = x.toString(2), k = [...b].filter((d) => d === "1").length, ok = P.has(k); if (ok) c++; rows.push([x, b, k, ok ? "yes" : "no"]); frames.push({ note: `${x} = ${b} has ${k} set bit${k === 1 ? "" : "s"}; ${k === 1 ? "1 is not prime" : ok ? `${k} is prime` : `${k} is not prime`}, count = ${c}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2], tones: { [`${rows.length - 1}:3`]: ok ? "found" : "bad" } }); }
      frames.push({ note: `${c} of the ${R - L + 1} numbers in [${L}, ${R}] have a prime number of set bits`, cells: rows.map((r) => [...r]), tones: Object.fromEntries(rows.map((r, i) => [`${i}:3`, r[3] === "yes" ? "found" : "muted"])) as Record<string, Tone> });
      return table(`[${L}, ${R}]: ${c} numbers`, rows.map((r) => String(r[0])), ["n", "binary", "bits", "prime?"], frames.map((f) => ({ ...f, cells: [...f.cells, ...Array(R - L + 1 - f.cells.length).fill([null, null, null, null])] })));
    },
  },

  "powx-n": {
    approach: "Fast exponentiation: square the base for every bit of n and multiply it into the result when that bit is 1; for negative n use 1/x.",
    idea: ["x^n with n = 1010 in binary is x^8 · x^2.", "Walk the bits of n from the low end: square the base each step and multiply it in when the bit is 1.", "If n < 0, compute (1/x)^(-n). O(log n) multiplications."],
    code: `def myPow(x, n):
    if n < 0:
        x, n = 1 / x, -n
    res = 1.0
    while n:
        if n & 1:
            res *= x
        x *= x
        n >>= 1
    return res`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const x0 = 2, n0 = 21, bits = n0.toString(2).split(""), L = bits.length, xr: (string | number)[] = bits.map(() => ""), rr: (string | number)[] = bits.map(() => ""), frames: CellsFrame[] = [];
      let res = 1, x = x0, n = n0, k = 0;
      frames.push({ note: `${x0}^${n0}: n = ${n0} is ${bits.join("")} in binary. Read the bits from the lowest: multiply the base into res on a 1, and square the base every round (n is not negative, so no 1/x flip)`, rows: [bits, [...xr], [...rr]] });
      while (n) {
        const b = n & 1, col = L - 1 - k, prev = res; xr[col] = x; if (b) res *= x; rr[col] = res;
        frames.push({ note: `bit ${k} is ${b}: ${b ? `res = ${prev} x ${x} = ${res}` : `skip, res stays ${res}`}; then the base becomes ${x}² = ${x * x}`, rows: [bits, [...xr], [...rr]], tones: { [`0:${col}`]: b ? "found" : "muted", [`1:${col}`]: "active", [`2:${col}`]: "window" } });
        x *= x; n >>= 1; k++;
      }
      frames.push({ note: `n is 0 after ${k} rounds, so ${x0}^${n0} = ${res}`, rows: [bits, [...xr], [...rr]], tones: { [`2:0`]: "found" } });
      return cells(`myPow(${x0}, ${n0}) = ${res}`, [bits, bits.map(() => ""), bits.map(() => "")], frames, [`n = ${bits.join("")}`, "base x", "res"]);
    },
  },

  "super-pow": {
    approach: "Process the digits of b left to right: a^(10·B + d) = (a^B)^10 · a^d, all mod 1337.",
    idea: ["b is a huge number given as digits, so it can not be used as an exponent directly.", "Appending a digit d to B turns the exponent into 10·B + d.", "So result = result^10 · a^d (mod 1337) for each digit."],
    code: `def superPow(a, b):
    res = 1
    a %= 1337
    for d in b:
        res = pow(res, 10, 1337) * pow(a, d, 1337) % 1337
    return res`,
    lang: "python", time: "O(len(b))", space: "O(1)",
    viz: () => {
      const a = 2, b = [1, 0, 2], M = 1337, rows: (string | number | null)[][] = b.map(() => [null, null, null, null]), frames: TableFrame[] = [], snap = () => rows.map((r) => [...r]);
      const pw = (x: number, e: number) => { let r = 1; for (let i = 0; i < e; i++) r = (r * x) % M; return r; };
      frames.push({ note: `Compute ${a}^${b.join("")} mod ${M}, where the exponent is given digit by digit: appending a digit d turns the exponent B into 10B + d`, cells: snap() });
      let res = 1;
      b.forEach((d, i) => {
        const r10 = pw(res, 10), ad = pw(a, d), nr = (r10 * ad) % M;
        rows[i] = [d, r10, null, null]; frames.push({ note: `digit ${d}: the exponent becomes ${b.slice(0, i + 1).join("")}, so first raise the old res to the 10th power: ${res}^10 mod ${M} = ${r10}`, cells: snap(), active: [i, 1] });
        rows[i] = [d, r10, ad, nr]; frames.push({ note: `then multiply by ${a}^${d} = ${ad}: ${r10} x ${ad} mod ${M} = ${nr}`, cells: snap(), active: [i, 3] }); res = nr;
      });
      frames.push({ note: `all digits used: ${a}^${b.join("")} mod ${M} = ${res}`, cells: snap(), tones: { [`${b.length - 1}:3`]: "found" } });
      return table(`superPow(${a}, [${b.join(", ")}]) = ${res}`, b.map((_, i) => `digit ${i}`), ["d", "res^10", "a^d", "res"], frames);
    },
  },

  "xor-operation-in-an-array": {
    approach: "Generate start + 2i for each i and XOR them together.",
    idea: ["nums[i] = start + 2·i.", "XOR all n values into one accumulator."],
    code: `def xorOperation(n, start):
    x = 0
    for i in range(n):
        x ^= start + 2 * i
    return x`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 6, start = 3, a = Array.from({ length: n }, (_, i) => start + 2 * i), blank = a.map(() => ""), acc: (string | number)[] = [...blank], frames: CellsFrame[] = []; let x = 0;
      frames.push({ note: `nums[i] = ${start} + 2·i gives [${a.join(", ")}]. XOR them all into x, starting from x = 0`, rows: [a, [...acc]] });
      a.forEach((v, i) => { const prev = x; x ^= v; acc[i] = x; frames.push({ note: `nums[${i}] = ${start} + 2·${i} = ${v}; x = ${prev} ^ ${v} = ${x}`, rows: [a, [...acc]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found" } }); });
      frames.push({ note: `all ${n} values are folded in, so the answer is ${x}`, rows: [a, [...acc]], tones: { [`1:${n - 1}`]: "found" } });
      return cells(`XOR of [${a.join(", ")}] = ${x}`, [a, blank], frames, ["nums", "x so far"]);
    },
  },

  "count-good-numbers": {
    approach: "Even positions take one of 5 even digits, odd positions one of 4 primes: 5^ceil(n/2) · 4^floor(n/2) with fast modular power.",
    idea: ["Positions 0, 2, 4, ... must hold 0, 2, 4, 6 or 8: 5 choices each.", "Positions 1, 3, 5, ... must hold 2, 3, 5 or 7: 4 choices each.", "Choices multiply; n can be 10^15, so use pow(base, exp, mod), which is O(log n)."],
    code: `def countGoodNumbers(n):
    MOD = 10**9 + 7
    return pow(5, (n + 1) // 2, MOD) * pow(4, n // 2, MOD) % MOD`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const n = 7, MOD = 1000000007, pos = Array.from({ length: n }, (_, i) => i), ch = pos.map((i) => (i % 2 ? 4 : 5)), ev = pos.filter((i) => i % 2 === 0), od = pos.filter((i) => i % 2), frames: CellsFrame[] = [];
      const fast = (base: number, e0: number, tones: Record<string, Tone>) => { let r = 1, b = base, e = e0, k = 0; while (e) { const bit = e & 1, prev = r; if (bit) r = (r * b) % MOD; frames.push({ note: `${base}^${e0}, exponent bit ${k} is ${bit}: ${bit ? `res = ${prev} x ${b} = ${r}` : "skip"}; the base becomes ${b}² = ${(b * b) % MOD}`, rows: [pos, ch], tones }); b = (b * b) % MOD; e >>= 1; k++; } return r; };
      frames.push({ note: `n = ${n} digits. Even positions take 0, 2, 4, 6 or 8 (5 choices); odd positions take 2, 3, 5 or 7 (4 choices). That is 5^${ev.length} x 4^${od.length}`, rows: [pos, ch], tones: { ...all(ev.map((i) => `1:${i}`), "active"), ...all(od.map((i) => `1:${i}`), "window") } });
      const r5 = fast(5, ev.length, all(ev.map((i) => `1:${i}`), "active")), r4 = fast(4, od.length, all(od.map((i) => `1:${i}`), "window")), ans = (r5 * r4) % MOD;
      frames.push({ note: `${r5} x ${r4} = ${ans} (mod ${MOD}), the number of good digit strings of length ${n}`, rows: [pos, ch], tones: range(0, n - 1, 1, "found") });
      return cells(`n = ${n}: ${ans} good numbers`, [pos, ch], frames, ["position", "choices"]);
    },
  },

  "palindrome-number": {
    approach: "Reverse only the back half of the digits and compare it with the front half.",
    idea: ["Negatives and numbers ending in 0 (except 0) are never palindromes.", "Pop digits from x onto rev until rev ≥ x: then each holds half the digits.", "Even length: x == rev. Odd length: the middle digit is in rev, so compare x == rev // 10."],
    code: `def isPalindrome(x):
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    rev = 0
    while x > rev:
        rev = rev * 10 + x % 10
        x //= 10
    return x == rev or x == rev // 10`,
    lang: "python", time: "O(log x)", space: "O(1)",
    viz: () => {
      const x0 = 1234321; let x = x0, rev = 0; const rows: (string | number)[][] = [], frames: TableFrame[] = [];
      frames.push({ note: `Is ${x0} a palindrome? Move the last half of its digits onto rev, then compare rev with what is left of x`, cells: [] });
      frames.push({ note: `${x0} is not negative and does not end in 0, so it can be a palindrome: start with x = ${x}, rev = 0`, cells: [] });
      while (x > rev) { const d = x % 10; rev = rev * 10 + d; x = Math.floor(x / 10); rows.push([d, x, rev]); frames.push({ note: `move digit ${d} from x to rev: x = ${x}, rev = ${rev}${x > rev ? ", x is still bigger, so continue" : ", rev has caught up with x, so stop"}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); }
      const ok = x === rev || x === Math.floor(rev / 10);
      frames.push({ note: `x = ${x}, rev = ${rev}: ${x === rev ? "they are equal" : `an odd length puts the middle digit in rev, so compare x with rev // 10 = ${Math.floor(rev / 10)}`} → ${ok ? "palindrome" : "not a palindrome"}`, cells: rows.map((r) => [...r]), tones: { [`${rows.length - 1}:1`]: ok ? "found" : "bad", [`${rows.length - 1}:2`]: ok ? "found" : "bad" } });
      return table(`Is ${x0} a palindrome? ${ok}`, rows.map((_, i) => `step ${i + 1}`), ["digit", "x", "rev"], frames);
    },
  },
  "reverse-integer": {
    approach: "Pop the last digit with % 10 and push it onto the result with * 10; restore the sign and return 0 if it leaves the 32-bit range.",
    idea: ["Work on |x| and remember the sign.", "rev = rev * 10 + x % 10, then x //= 10, until x is 0.", "If the reversed value is outside [-2^31, 2^31 - 1], return 0."],
    code: `def reverse(x):
    sign, x, rev = (-1 if x < 0 else 1), abs(x), 0
    while x:
        rev = rev * 10 + x % 10
        x //= 10
    rev *= sign
    return rev if -2**31 <= rev < 2**31 else 0`,
    lang: "python", time: "O(log x)", space: "O(1)",
    viz: () => {
      const x0 = -1230, rows: (string | number)[][] = [], frames: TableFrame[] = []; let x = Math.abs(x0), rev = 0;
      frames.push({ note: `reverse(${x0}): remember the sign (-) and reverse the digits of ${x}`, cells: [] });
      while (x) { const d = x % 10, prev = rev; rev = rev * 10 + d; x = Math.floor(x / 10); rows.push([d, x, rev]); frames.push({ note: `pop ${d}: rev = ${prev} * 10 + ${d} = ${rev}, ${x} left in x${d === 0 && !prev ? " (a trailing 0 becomes a leading 0 and vanishes)" : ""}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); }
      frames.push({ note: `x is 0, so apply the sign: ${-rev}`, cells: rows.map((r) => [...r]), tones: { [`${rows.length - 1}:2`]: "window" } });
      frames.push({ note: `${-rev} is inside [-2^31, 2^31 - 1], so it fits in 32 bits and ${-rev} is returned`, cells: rows.map((r) => [...r]), tones: { [`${rows.length - 1}:2`]: "found" } });
      return table(`reverse(${x0}) = ${-rev}`, rows.map((_, i) => `step ${i + 1}`), ["digit", "x left", "rev"], frames);
    },
  },

  "excel-sheet-column-title": {
    approach: "Base 26 with digits 1..26 instead of 0..25: subtract 1 before taking n % 26 for each letter, from the right.",
    idea: ["A..Z stand for 1..26, so there is no zero digit.", "Subtracting 1 shifts to 0..25: the last letter is chr(65 + (n - 1) % 26).", "Then n = (n - 1) // 26 and repeat; reverse the letters at the end."],
    code: `def convertToTitle(columnNumber):
    n, out = columnNumber, []
    while n:
        n -= 1
        out.append(chr(65 + n % 26))
        n //= 26
    return "".join(reversed(out))`,
    lang: "python", time: "O(log n)", space: "O(log n)",
    viz: () => {
      const n0 = 2147483647; let n = n0; const rows: (string | number)[][] = [], frames: TableFrame[] = [], out: string[] = [];
      frames.push({ note: `Column ${n0} as a title: letters are base 26 with A = 1 ... Z = 26, so subtract 1 before taking each letter from the right`, cells: [] });
      while (n) { const m = n - 1, ch = String.fromCharCode(65 + (m % 26)); out.unshift(ch); rows.push([n, m % 26, ch, Math.floor(m / 26)]); frames.push({ note: `n = ${n}: (n - 1) % 26 = ${m % 26} gives '${ch}', and n becomes (n - 1) // 26 = ${Math.floor(m / 26)}; title so far "${out.join("")}"`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); n = Math.floor(m / 26); }
      frames.push({ note: `n is 0, so stop: the letters came out from the right, which gives "${out.join("")}"`, cells: rows.map((r) => [...r]), tones: all(rows.map((_, i) => `${i}:2`), "found") });
      return table(`${n0} → "${out.join("")}"`, rows.map((_, i) => `step ${i + 1}`), ["n", "(n-1) % 26", "letter", "next n"], frames);
    },
  },

  "excel-sheet-column-number": {
    approach: "Read the title as a base-26 number with A = 1 ... Z = 26: result = result * 26 + value.",
    idea: ["Each letter shifts the previous value one base-26 place left.", "Add the letter's value ord(ch) - 64."],
    code: `def titleToNumber(columnTitle):
    n = 0
    for ch in columnTitle:
        n = n * 26 + ord(ch) - 64
    return n`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const t = "FXSHRXW", L = [...t], vals = L.map((c) => c.charCodeAt(0) - 64), blank = L.map(() => ""), frames: CellsFrame[] = []; let n = 0;
      const vr: (string | number)[] = [...blank], nr: (string | number)[] = [...blank];
      frames.push({ note: `Read "${t}" as a base-26 number with A = 1 ... Z = 26: for each letter, n = n * 26 + value`, rows: [L, [...vr], [...nr]] });
      L.forEach((ch, i) => { const prev = n; n = n * 26 + vals[i]; vr[i] = vals[i]; nr[i] = n; frames.push({ note: `'${ch}' = ${vals[i]}: ${prev} * 26 + ${vals[i]} = ${n}`, rows: [L, [...vr], [...nr]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "window", [`2:${i}`]: "found" } }); });
      frames.push({ note: `all ${L.length} letters are read, so column "${t}" is number ${n}`, rows: [L, [...vr], [...nr]], tones: { [`2:${L.length - 1}`]: "found" } });
      return cells(`"${t}" = ${n}`, [L, blank, blank], frames, ["letter", "value", "n so far"]);
    },
  },

  "string-to-integer-atoi": {
    approach: "Skip leading spaces, read an optional sign, read digits until the first non-digit, then clamp to 32 bits.",
    idea: ["Leading spaces are ignored.", "One '+' or '-' may follow.", "Digits are read until something else appears; everything after is ignored.", "Clamp the result to [-2^31, 2^31 - 1]."],
    code: `def myAtoi(s):
    i, n = 0, len(s)
    while i < n and s[i] == " ":
        i += 1
    sign = 1
    if i < n and s[i] in "+-":
        sign = -1 if s[i] == "-" else 1
        i += 1
    num = 0
    while i < n and s[i].isdigit():
        num = num * 10 + int(s[i])
        i += 1
    return max(-2**31, min(2**31 - 1, sign * num))`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "  -042a7", ch = [...s].map((c) => (c === " " ? "␣" : c)), frames: CellsFrame[] = []; let i = 0, sign = 1, num = 0;
      while (s[i] === " ") { frames.push({ note: `index ${i}: space, skip`, rows: [ch], tones: { [`0:${i}`]: "muted" } }); i++; }
      if (s[i] === "+" || s[i] === "-") { sign = s[i] === "-" ? -1 : 1; frames.push({ note: `index ${i}: sign '${s[i]}'`, rows: [ch], tones: { [`0:${i}`]: "active" } }); i++; }
      while (i < s.length && /\d/.test(s[i])) { num = num * 10 + +s[i]; frames.push({ note: `index ${i}: digit ${s[i]} → num = ${num}`, rows: [ch], tones: { [`0:${i}`]: "found" } }); i++; }
      frames.push({ note: `index ${i}: '${s[i]}' is not a digit, stop. Result ${sign * num} (inside 32-bit range)`, rows: [ch], tones: { [`0:${i}`]: "bad" } });
      return cells(`myAtoi("${s}") = ${sign * num}`, [ch], frames);
    },
  },

  "add-strings": {
    approach: "Add digit by digit from the right with a carry, as on paper, without converting the whole strings to integers.",
    idea: ["Two indices start at the last digit of each string.", "Column sum = digit + digit + carry; write sum % 10, carry sum // 10.", "Keep going while either string has digits or a carry is left; reverse at the end."],
    code: `def addStrings(num1, num2):
    i, j, carry, out = len(num1) - 1, len(num2) - 1, 0, []
    while i >= 0 or j >= 0 or carry:
        s = carry
        if i >= 0:
            s += ord(num1[i]) - 48
            i -= 1
        if j >= 0:
            s += ord(num2[j]) - 48
            j -= 1
        out.append(str(s % 10))
        carry = s // 10
    return "".join(reversed(out))`,
    lang: "python", time: "O(max(m, n))", space: "O(max(m, n))",
    viz: () => {
      const a = "9875", b = "546", W = Math.max(a.length, b.length) + 1, A = a.padStart(W, " ").split(""), B2 = b.padStart(W, " ").split(""), S: string[] = Array(W).fill(""), frames: CellsFrame[] = [];
      let i = a.length - 1, j = b.length - 1, carry = 0, c = W - 1;
      frames.push({ note: `Add "${a}" and "${b}" column by column from the right with a carry, as on paper, without turning them into integers`, rows: [A, B2, [...S]] });
      while (i >= 0 || j >= 0 || carry) {
        const done = i < 0 && j < 0, x = i >= 0 ? +a[i--] : 0, y = j >= 0 ? +b[j--] : 0, s = x + y + carry;
        S[c] = String(s % 10); frames.push({ note: `${x} + ${y} + carry ${carry} = ${s}: write ${s % 10}, carry ${Math.floor(s / 10)}${done ? " (both numbers are used up but the carry remains)" : ""}`, rows: [A, B2, [...S]], tones: { [`0:${c}`]: "active", [`1:${c}`]: "active", [`2:${c}`]: "found" } }); carry = Math.floor(s / 10); c--;
      }
      const r = S.join("").trim();
      frames.push({ note: `no digits and no carry are left, so "${a}" + "${b}" = "${r}"`, rows: [A, B2, [...S]], tones: range(W - r.length, W - 1, 2, "found") });
      return cells(`"${a}" + "${b}" = "${r}"`, [A, B2, S], frames, ["num1", "num2", "sum"]);
    },
  },

  "happy-number": {
    approach: "Keep replacing n by the sum of the squares of its digits; stop at 1 (happy) or when a value repeats (a cycle that never reaches 1).",
    idea: ["The sequence either reaches 1 or falls into a loop, because the values quickly drop below a few hundred.", "Remember every value seen in a set.", "A repeat means a cycle without 1, so n is not happy."],
    code: `def isHappy(n):
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d) ** 2 for d in str(n))
    return n == 1`,
    lang: "python", time: "O(log n) per step", space: "O(number of steps)",
    viz: () => {
      const f = (x: number) => String(x).split("").reduce((s, d) => s + (+d) ** 2, 0), seq: number[] = [7], seen: number[] = [];
      let n = 7; while (n !== 1 && !seen.includes(n)) { seen.push(n); n = f(n); seq.push(n); }
      const row = (k: number) => seq.map((v, i) => (i < k ? v : "")), frames: CellsFrame[] = [{ note: `Is 7 happy? Replace n by the sum of the squares of its digits; stop at 1, or when a value repeats (a loop that never reaches 1)`, rows: [row(1)], tones: { "0:0": "active" } }];
      seq.slice(0, -1).forEach((v, i) => frames.push({ note: `${v} → ${String(v).split("").map((d) => `${d}²`).join(" + ")} = ${seq[i + 1]}; seen so far {${seq.slice(0, i + 1).join(", ")}}${seq[i + 1] === 1 ? ", and 1 is not a repeat but the goal" : `, and ${seq[i + 1]} is new`}`, rows: [row(i + 2)], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "window", [`0:${i + 1}`]: "active" } }));
      frames.push({ note: `the sequence reached 1, so 7 is a happy number`, rows: [row(seq.length)], tones: { ...range(0, seq.length - 2, 0, "done"), [`0:${seq.length - 1}`]: "found" } });
      return cells("7 is happy", [row(seq.length)], frames);
    },
  },

  "ugly-number": {
    approach: "Divide out every factor 2, 3 and 5; the number is ugly exactly when 1 is left.",
    idea: ["Ugly numbers have no prime factors other than 2, 3 and 5.", "Remove each of those as many times as it divides.", "Anything other than 1 left over is another prime factor. n ≤ 0 is never ugly."],
    code: `def isUgly(n):
    if n <= 0:
        return False
    for p in (2, 3, 5):
        while n % p == 0:
            n //= p
    return n == 1`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const rows: (string | number)[][] = [], frames: TableFrame[] = [];
      for (const start of [60, 14]) { let n = start; for (const p of [2, 3, 5]) while (n % p === 0) { rows.push([start, p, n / p]); frames.push({ note: `${n} / ${p} = ${n / p}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 2] }); n /= p; } rows.push([start, "left", n]); frames.push({ note: `${start}: ${n === 1 ? "1 left → ugly" : `${n} left, a prime other than 2, 3, 5 → not ugly`}`, cells: rows.map((r) => [...r]), tones: { [`${rows.length - 1}:2`]: n === 1 ? "found" : "bad" } }); }
      return table("Ugly check for 60 and 14", nums(rows.length), ["n", "divide by", "result"], frames.map((f) => ({ ...f, cells: [...f.cells, ...Array(rows.length - f.cells.length).fill([null, null, null])] })));
    },
  },

  "ugly-number-ii": {
    approach: "Build ugly numbers in order with three pointers: the next one is the smallest of ugly[i2]·2, ugly[i3]·3, ugly[i5]·5.",
    idea: ["Every ugly number after 1 is a smaller ugly number times 2, 3 or 5.", "Each pointer marks the smallest ugly number not yet multiplied by its factor.", "Take the minimum candidate and advance every pointer that produced it, so duplicates like 6 = 2·3 = 3·2 appear once."],
    code: `def nthUglyNumber(n):
    ugly = [1]
    i2 = i3 = i5 = 0
    while len(ugly) < n:
        a, b, c = ugly[i2] * 2, ugly[i3] * 3, ugly[i5] * 5
        nxt = min(a, b, c)
        ugly.append(nxt)
        if nxt == a:
            i2 += 1
        if nxt == b:
            i3 += 1
        if nxt == c:
            i5 += 1
    return ugly[-1]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 10, ugly = [1], frames: CellsFrame[] = [], pad = () => [...ugly, ...Array(n - ugly.length).fill("")]; let i2 = 0, i3 = 0, i5 = 0;
      while (ugly.length < n) {
        const a = ugly[i2] * 2, b = ugly[i3] * 3, c = ugly[i5] * 5, nx = Math.min(a, b, c); ugly.push(nx);
        frames.push({ note: `candidates ${a}, ${b}, ${c} → next ${nx}`, rows: [pad()], tones: { [`0:${ugly.length - 1}`]: "found" }, marks: [{ i: i2, label: "x2" }, { i: i3, label: "x3" }, { i: i5, label: "x5" }] });
        if (nx === a) i2++; if (nx === b) i3++; if (nx === c) i5++;
      }
      return cells(`10th ugly number: ${ugly[n - 1]}`, [pad()], frames);
    },
  },

  "add-digits": {
    approach: "The repeated digit sum is the digital root: 0 for 0, otherwise 1 + (n - 1) % 9.",
    idea: ["10 ≡ 1 (mod 9), so a number and its digit sum leave the same remainder mod 9.", "Repeating the sum keeps that remainder until one digit is left.", "That digit is n % 9, except a multiple of 9 gives 9: written as 1 + (n - 1) % 9."],
    code: `def addDigits(num):
    return 0 if num == 0 else 1 + (num - 1) % 9`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const ds = (n: number) => [...String(n)].reduce((s, d) => s + +d, 0), nums0 = [38, 45, 0], W = 3, chains = nums0.map((n) => { const c = [n]; while (c[c.length - 1] >= 10) c.push(ds(c[c.length - 1])); return c; });
      const rows = (ks: number[]) => chains.map((c, r) => Array.from({ length: W }, (_, i) => (i < ks[r] ? c[i] : ""))), fm = (n: number) => 1 + ((n - 1) % 9), frames: CellsFrame[] = [];
      frames.push({ note: "Add the digits of a number until one digit is left (38 → 11 → 2), then replace that loop by a formula using mod 9", rows: rows([1, 0, 0]), tones: { "0:0": "active" } });
      frames.push({ note: `38 → 3 + 8 = 11; 38 % 9 = ${38 % 9} and 11 % 9 = ${11 % 9}, so adding digits keeps the remainder mod 9`, rows: rows([2, 0, 0]), tones: { "0:0": "window", "0:1": "active" } });
      frames.push({ note: `11 → 1 + 1 = 2; 2 % 9 = 2 again, and 2 is a single digit, so the answer for 38 is 2`, rows: rows([3, 0, 0]), tones: { "0:1": "window", "0:2": "found" } });
      frames.push({ note: `shortcut for 38: 1 + (38 - 1) % 9 = 1 + ${37 % 9} = ${fm(38)}, the same digit with no loop`, rows: rows([3, 0, 0]), tones: { "0:2": "found" } });
      frames.push({ note: `45 → 4 + 5 = 9, yet 45 % 9 = 0: a plain n % 9 gives 0 for multiples of 9, which is wrong`, rows: rows([3, 2, 0]), tones: { "1:0": "window", "1:1": "bad" } });
      frames.push({ note: `1 + (45 - 1) % 9 = 1 + ${44 % 9} = ${fm(45)} fixes it: shifting by 1 maps the remainders onto 1..9`, rows: rows([3, 2, 0]), tones: { "1:1": "found" } });
      frames.push({ note: "0 is special: in Python 1 + (0 - 1) % 9 would give 9, so the code returns 0 first", rows: rows([3, 2, 1]), tones: { "2:0": "found" } });
      frames.push({ note: `answers: 38 → ${fm(38)}, 45 → ${fm(45)}, 0 → 0, all without looping over digits`, rows: rows([3, 2, 1]), tones: { "0:2": "found", "1:1": "found", "2:0": "found" } });
      return cells(`Digital root of 38: ${fm(38)}`, rows([3, 2, 1]), frames, ["num 38", "num 45", "num 0"]);
    },
  },

  "climbing-stairs": {
    approach: "ways(n) = ways(n - 1) + ways(n - 2): the last move was either 1 step or 2 steps.",
    idea: ["To stand on step i you came from step i - 1 or step i - 2.", "So the counts add, which is the Fibonacci recurrence.", "Keep only the last two values."],
    code: `def climbStairs(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 6, idx = Array.from({ length: n + 1 }, (_, i) => i), dp: (string | number)[] = idx.map(() => ""), frames: CellsFrame[] = [];
      dp[0] = 1; dp[1] = 1; frames.push({ note: "ways(0) = 1 (stand still), ways(1) = 1", rows: [idx, [...dp]], tones: { "1:0": "found", "1:1": "found" } });
      for (let i = 2; i <= n; i++) { dp[i] = +dp[i - 1] + +dp[i - 2]; frames.push({ note: `ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`, rows: [idx, [...dp]], tones: { [`1:${i - 1}`]: "window", [`1:${i - 2}`]: "window", [`1:${i}`]: "found" } }); }
      return cells(`Ways to climb ${n} stairs: ${dp[n]}`, [idx, idx.map(() => "")], frames, ["step", "ways"]);
    },
  },
  "house-robber": {
    approach: "dp[i] = max(dp[i - 1], dp[i - 2] + nums[i]): either skip house i or rob it on top of the best up to i - 2.",
    idea: ["Robbing house i rules out house i - 1, so it adds to the best total up to i - 2.", "Skipping house i keeps the best total up to i - 1.", "Only the last two values are needed."],
    code: `def rob(nums):
    prev, cur = 0, 0
    for x in nums:
        prev, cur = cur, max(cur, prev + x)
    return cur`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [5, 3, 4, 11, 2, 7, 1], dp: (string | number)[] = a.map(() => ""), frames: CellsFrame[] = [{ note: `Houses hold [${a.join(", ")}] and no two neighbours can be robbed. dp[i] is the best total using houses 0..i: rob house i on top of dp[i - 2], or skip it and keep dp[i - 1]`, rows: [a, [...dp]] }];
      a.forEach((x, i) => { const take = x + (i >= 2 ? +dp[i - 2] : 0), skip = i >= 1 ? +dp[i - 1] : 0; dp[i] = Math.max(take, skip); frames.push({ note: `house ${i}: rob ${x} + ${i >= 2 ? dp[i - 2] : 0} = ${take} versus skip ${skip}, so dp[${i}] = ${dp[i]} (${take > skip ? "rob" : "skip"})`, rows: [a, [...dp]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found", ...(i >= 1 ? { [`1:${i - 1}`]: "window" } : {}), ...(i >= 2 ? { [`1:${i - 2}`]: "window" } : {}) } }); });
      frames.push({ note: `the last house is decided, so the most money is dp[${a.length - 1}] = ${dp[a.length - 1]}`, rows: [a, [...dp]], tones: { [`1:${a.length - 1}`]: "found" } });
      return cells(`Most money: ${dp[a.length - 1]}`, [a, a.map(() => "")], frames, ["money", "best"]);
    },
  },

  "house-robber-ii": {
    approach: "The first and last houses touch, so run the straight-line robber twice: once without the last house and once without the first.",
    idea: ["In a circle, house 0 and house n - 1 can not both be robbed.", "So one of them is always skipped: solve houses 0..n-2 and houses 1..n-1 separately.", "Each is the plain house robber; take the better result. A single house is its own answer."],
    code: `def rob(nums):
    def line(a):
        prev, cur = 0, 0
        for x in a:
            prev, cur = cur, max(cur, prev + x)
        return cur
    if len(nums) == 1:
        return nums[0]
    return max(line(nums[:-1]), line(nums[1:]))`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 7, 9, 3, 1], n = a.length, r1: (string | number)[] = a.map(() => ""), r2: (string | number)[] = a.map(() => ""), frames: CellsFrame[] = [];
      const run = (row: (string | number)[], lo: number, hi: number, label: string) => { let prev = 0, cur = 0; for (let i = lo; i <= hi; i++) { const nc = Math.max(cur, prev + a[i]); row[i] = nc; frames.push({ note: `${label}, house ${i}: max(skip ${cur}, rob ${prev} + ${a[i]}) = ${nc}`, rows: [a, [...r1], [...r2]], tones: { [`0:${i}`]: "active", [`${row === r1 ? 1 : 2}:${i}`]: "found" } }); prev = cur; cur = nc; } return cur; };
      const x = run(r1, 0, n - 2, "without the last house"), y = run(r2, 1, n - 1, "without the first house");
      frames.push({ note: `max(${x}, ${y}) = ${Math.max(x, y)}`, rows: [a, r1, r2], tones: x >= y ? { [`1:${n - 2}`]: "found" } : { [`2:${n - 1}`]: "found" } });
      return cells(`Circle of houses: ${Math.max(x, y)}`, [a, a.map(() => ""), a.map(() => "")], frames, ["money", "no last", "no first"]);
    },
  },

  "min-cost-climbing-stairs": {
    approach: "dp[i] = cost[i] + min(dp[i - 1], dp[i - 2]) is the cheapest way to stand on step i; the top is reached from either of the last two steps.",
    idea: ["You may start on step 0 or step 1, so dp[0] = cost[0], dp[1] = cost[1].", "To stand on step i you paid for it and came from i - 1 or i - 2.", "The top is one step past the end, so answer min(dp[n - 1], dp[n - 2])."],
    code: `def minCostClimbingStairs(cost):
    a, b = cost[0], cost[1]
    for c in cost[2:]:
        a, b = b, c + min(a, b)
    return min(a, b)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const c = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1], n = c.length, dp: (string | number)[] = c.map(() => ""), frames: CellsFrame[] = [];
      dp[0] = c[0]; dp[1] = c[1]; frames.push({ note: `start on step 0 or 1: dp = ${c[0]}, ${c[1]}`, rows: [c, [...dp]], tones: { "1:0": "found", "1:1": "found" } });
      for (let i = 2; i < n; i++) { dp[i] = c[i] + Math.min(+dp[i - 1], +dp[i - 2]); frames.push({ note: `step ${i}: ${c[i]} + min(${dp[i - 1]}, ${dp[i - 2]}) = ${dp[i]}`, rows: [c, [...dp]], tones: { [`1:${i}`]: "found", [`1:${+dp[i - 1] <= +dp[i - 2] ? i - 1 : i - 2}`]: "window" } }); }
      const ans = Math.min(+dp[n - 1], +dp[n - 2]);
      frames.push({ note: `top = min(${dp[n - 1]}, ${dp[n - 2]}) = ${ans}`, rows: [c, dp], tones: { [`1:${n - 1}`]: "active", [`1:${n - 2}`]: "active" } });
      return cells(`Cheapest climb: ${ans}`, [c, c.map(() => "")], frames, ["cost", "dp"]);
    },
  },

  "decode-ways": {
    approach: "dp[i] = ways to decode the first i digits: add dp[i - 1] if digit i is 1..9, and dp[i - 2] if the last two digits form 10..26.",
    idea: ["The last letter used either one digit or two.", "One digit is valid if it is not 0.", "Two digits are valid if they read 10 to 26.", "Sum the two cases; dp[0] = 1 for the empty prefix."],
    code: `def numDecodings(s):
    prev, cur = 1, int(s[0] != "0")
    for i in range(1, len(s)):
        nxt = 0
        if s[i] != "0":
            nxt += cur
        if 10 <= int(s[i - 1:i + 1]) <= 26:
            nxt += prev
        prev, cur = cur, nxt
    return cur`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "226102", n = s.length, head = ["", ...s], dp: (string | number)[] = Array(n + 1).fill(""), frames: CellsFrame[] = [];
      frames.push({ note: `Count the ways to read "${s}" as letters (1 = A ... 26 = Z). dp[i] is the number of ways for the first i digits; the last letter uses one digit or two`, rows: [head, [...dp]] });
      dp[0] = 1; dp[1] = s[0] !== "0" ? 1 : 0; frames.push({ note: `the empty prefix has 1 way and "${s[0]}" alone has ${dp[1]} way`, rows: [head, [...dp]], tones: { "1:0": "found", "1:1": "found" } });
      for (let i = 2; i <= n; i++) { const one = s[i - 1] !== "0", two = +s.slice(i - 2, i) >= 10 && +s.slice(i - 2, i) <= 26; dp[i] = (one ? +dp[i - 1] : 0) + (two ? +dp[i - 2] : 0); frames.push({ note: `"${s[i - 1]}" alone ${one ? `is valid (+${dp[i - 1]} from dp[${i - 1}])` : "is invalid"}, "${s.slice(i - 2, i)}" ${two ? `is valid (+${dp[i - 2]} from dp[${i - 2}])` : "is invalid"}, so dp[${i}] = ${dp[i]}`, rows: [head, [...dp]], tones: { [`1:${i}`]: "found", ...(one ? { [`1:${i - 1}`]: "window" } : {}), ...(two ? { [`1:${i - 2}`]: "window" } : {}) } }); }
      frames.push({ note: `all ${n} digits are used, so "${s}" can be decoded in dp[${n}] = ${dp[n]} ways`, rows: [head, [...dp]], tones: { [`1:${n}`]: "found" } });
      return cells(`"${s}" decodes ${dp[n]} ways`, [head, Array(n + 1).fill("")], frames, ["digit", "ways"]);
    },
  },

  "last-stone-weight-ii": {
    approach: "Smashing splits the stones into two piles with signs + and -; find the reachable subset sum closest to total / 2.",
    idea: ["Every smash result is some stones added and the rest subtracted, so the answer is |pile A - pile B|.", "To minimise it, make one pile as close to total / 2 as possible without going over.", "Track reachable subset sums up to total / 2 (0/1 knapsack); answer total - 2 · best."],
    code: `def lastStoneWeightII(stones):
    total = sum(stones)
    reach = {0}
    for x in stones:
        reach |= {s + x for s in reach if s + x <= total // 2}
    return total - 2 * max(reach)`,
    lang: "python", time: "O(n · total)", space: "O(total)",
    viz: () => {
      const st = [2, 7, 4, 1, 8, 1], total = st.reduce((a, b) => a + b, 0), H = Math.floor(total / 2), sums = Array.from({ length: H + 1 }, (_, i) => i), reach = new Set([0]), frames: CellsFrame[] = [];
      const tones = (fresh: number[]) => Object.fromEntries(sums.map((v) => [`0:${v}`, fresh.includes(v) ? "found" : reach.has(v) ? "done" : "muted"])) as Record<string, Tone>;
      frames.push({ note: `total ${total}, aim for a pile of at most ${H}`, tones: tones([0]) });
      for (const x of st) { const fresh = [...reach].map((v) => v + x).filter((v) => v <= H && !reach.has(v)); fresh.forEach((v) => reach.add(v)); frames.push({ note: `stone ${x}: new sums ${fresh.join(", ") || "none"}`, tones: tones(fresh) }); }
      const best = Math.max(...reach);
      frames.push({ note: `best pile ${best} → ${total} - 2 x ${best} = ${total - 2 * best}`, tones: { ...tones([]), [`0:${best}`]: "found" } });
      return cells(`Smallest last stone: ${total - 2 * best}`, [sums], frames, ["sum"]);
    },
  },

  "coin-change": {
    approach: "dp[a] = fewest coins for amount a = 1 + min(dp[a - c]) over coins c ≤ a.",
    idea: ["The last coin used is some c, leaving amount a - c to make optimally.", "Fill dp from 0 up so every smaller amount is ready.", "Unreachable amounts stay infinite; answer -1 if dp[amount] is still infinite."],
    code: `def coinChange(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] <= amount else -1`,
    lang: "python", time: "O(amount · coins)", space: "O(amount)",
    viz: () => {
      const coins = [1, 2, 5], A = 11, idx = Array.from({ length: A + 1 }, (_, i) => i), dp: (string | number)[] = idx.map(() => ""), frames: CellsFrame[] = [];
      dp[0] = 0; frames.push({ note: "amount 0 needs 0 coins", rows: [idx, [...dp]], tones: { "1:0": "found" } });
      for (let a = 1; a <= A; a++) { let best = Infinity, from = 0; for (const c of coins) if (c <= a && +dp[a - c] + 1 < best) { best = +dp[a - c] + 1; from = c; } dp[a] = best; frames.push({ note: `amount ${a}: best last coin ${from}, 1 + dp[${a - from}] = ${best}`, rows: [idx, [...dp]], tones: { [`1:${a}`]: "found", [`1:${a - from}`]: "window" } }); }
      return cells(`Fewest coins for ${A}: ${dp[A]}`, [idx, idx.map(() => "")], frames, ["amount", "coins"]);
    },
  },

  "partition-equal-subset-sum": {
    approach: "Look for a subset summing to total / 2 with a boolean knapsack, updating sums from high to low so each number is used once.",
    idea: ["Two equal halves exist exactly when some subset sums to total / 2 (so total must be even).", "can[s] says whether some subset of the numbers seen so far sums to s.", "For each number x, can[s] |= can[s - x], going downward so x is not reused in the same round."],
    code: `def canPartition(nums):
    total = sum(nums)
    if total % 2:
        return False
    half = total // 2
    can = [True] + [False] * half
    for x in nums:
        for s in range(half, x - 1, -1):
            can[s] = can[s] or can[s - x]
    return can[half]`,
    lang: "python", time: "O(n · total)", space: "O(total)",
    viz: () => {
      const a = [2, 3, 4, 5, 6], H = a.reduce((x, y) => x + y, 0) / 2, idx = Array.from({ length: H + 1 }, (_, i) => i), can = idx.map((i) => i === 0), frames: CellsFrame[] = [];
      const row = () => can.map((c) => (c ? "T" : "")), tones = (fresh: number[]) => ({ ...all(idx.filter((i) => can[i]).map((i) => `1:${i}`), "done"), ...all(fresh.map((i) => `1:${i}`), "found") });
      frames.push({ note: `Can [${a.join(", ")}] be split into two equal halves? The total is ${H * 2}, so look for a subset summing to ${H}; can[s] marks the sums reachable so far`, rows: [idx, row()], tones: tones([0]) });
      for (const x of a) { const fresh: number[] = []; for (let s = H; s >= x; s--) if (!can[s] && can[s - x]) { can[s] = true; fresh.push(s); } fresh.sort((p, q) => p - q); frames.push({ note: `number ${x}: ${fresh.length ? `sums ${fresh.join(", ")} become reachable (an old reachable sum plus ${x})` : "no new sum becomes reachable"}${can[H] ? `; ${H} is reachable` : ""}`, rows: [idx, row()], tones: tones(fresh) }); }
      frames.push({ note: `can[${H}] is ${can[H] ? "True" : "False"}, so the numbers ${can[H] ? "can" : "cannot"} be split into two equal halves`, rows: [idx, row()], tones: { [`1:${H}`]: can[H] ? "found" : "bad" } });
      return cells(`Equal halves: ${can[H]}`, [idx, idx.map(() => "")], frames, ["sum", "reachable"]);
    },
  },

  "target-sum": {
    approach: "Choosing signs splits nums into P (plus) and N (minus) with P - N = target, so count subsets that sum to (total + target) / 2.",
    idea: ["P + N = total and P - N = target give P = (total + target) / 2.", "If that is not a whole number, or |target| > total, the answer is 0.", "Count subsets with sum P using dp[s] += dp[s - x], iterating s downward so each number is used once."],
    code: `def findTargetSumWays(nums, target):
    total = sum(nums)
    if abs(target) > total or (total + target) % 2:
        return 0
    P = (total + target) // 2
    dp = [1] + [0] * P
    for x in nums:
        for s in range(P, x - 1, -1):
            dp[s] += dp[s - x]
    return dp[P]`,
    lang: "python", time: "O(n · P)", space: "O(P)",
    viz: () => {
      const a = [1, 1, 1, 1, 1], target = 3, P = (5 + target) / 2, idx = Array.from({ length: P + 1 }, (_, i) => i), dp = idx.map((i) => (i ? 0 : 1)), frames: CellsFrame[] = [];
      frames.push({ note: `P = (5 + ${target}) / 2 = ${P}: count subsets summing to ${P}`, rows: [idx, [...dp]], tones: { "1:0": "found" } });
      a.forEach((x, k) => { for (let s = P; s >= x; s--) dp[s] += dp[s - x]; frames.push({ note: `number ${k + 1} (${x}): dp = [${dp.join(", ")}]`, rows: [idx, [...dp]], tones: { [`1:${P}`]: "found" } }); });
      return cells(`Sign choices hitting ${target}: ${dp[P]}`, [idx, idx.map(() => "")], frames, ["sum", "ways"]);
    },
  },

  "coin-change-ii": {
    approach: "Unbounded knapsack counting: loop coins on the outside and amounts upward inside, dp[a] += dp[a - c].",
    idea: ["dp[a] = number of combinations making a with the coins seen so far.", "Coins in the outer loop count each combination once (no orderings), because coins are always added in the same order.", "Amounts go upward so the same coin can be used again."],
    code: `def change(amount, coins):
    dp = [1] + [0] * amount
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    lang: "python", time: "O(amount · coins)", space: "O(amount)",
    viz: () => {
      const coins = [1, 2, 5], A = 5, dp = Array.from({ length: A + 1 }, (_, i) => (i ? 0 : 1)), grid: (number | null)[][] = coins.map(() => Array(A + 1).fill(null)), frames: TableFrame[] = [];
      coins.forEach((c, r) => { for (let a = 0; a <= A; a++) { if (a >= c) dp[a] += dp[a - c]; grid[r][a] = dp[a]; frames.push({ note: a >= c ? `coin ${c}, amount ${a}: ${dp[a] - dp[a - c]} without + ${dp[a - c]} using one more ${c} = ${dp[a]}` : `coin ${c} is bigger than ${a}: keep ${dp[a]}`, cells: grid.map((g) => [...g]), active: [r, a], deps: a >= c ? [[r, a - c], ...(r ? [[r - 1, a] as [number, number]] : [])] : [] }); } });
      return table(`Ways to make ${A}: ${dp[A]}`, coins.map((c) => `+ coin ${c}`), Array.from({ length: A + 1 }, (_, i) => String(i)), frames);
    },
  },

  "perfect-squares": {
    approach: "dp[i] = 1 + min(dp[i - s]) over perfect squares s ≤ i.",
    idea: ["The last square used is some j², leaving i - j² to build optimally.", "Fill dp from 0 upward.", "At most √i squares to try per i."],
    code: `def numSquares(n):
    dp = [0] + [n] * n
    for i in range(1, n + 1):
        j = 1
        while j * j <= i:
            dp[i] = min(dp[i], dp[i - j * j] + 1)
            j += 1
    return dp[n]`,
    lang: "python", time: "O(n√n)", space: "O(n)",
    viz: () => {
      const n = 12, idx = Array.from({ length: n + 1 }, (_, i) => i), dp: (string | number)[] = idx.map(() => ""), frames: CellsFrame[] = [];
      dp[0] = 0;
      for (let i = 1; i <= n; i++) { let best = i + 1, sq = 1; for (let j = 1; j * j <= i; j++) if (+dp[i - j * j] + 1 < best) { best = +dp[i - j * j] + 1; sq = j * j; } dp[i] = best; frames.push({ note: `${i}: last square ${sq}, 1 + dp[${i - sq}] = ${best}`, rows: [idx, [...dp]], tones: { [`1:${i}`]: "found", [`1:${i - sq}`]: "window" } }); }
      return cells(`${n} = 4 + 4 + 4: ${dp[n]} squares`, [idx, idx.map(() => "")], frames, ["n", "squares"]);
    },
  },
  "longest-increasing-subsequence": {
    approach: "Keep tails[k] = smallest possible last value of an increasing subsequence of length k + 1; binary-search each number into it.",
    idea: ["tails is always sorted, so bisect finds where a number fits.", "A number larger than every tail extends the longest subsequence.", "Otherwise it replaces the first tail ≥ it: same length, smaller ending, more room later.", "The length of tails is the answer (tails itself need not be a real subsequence)."],
    code: `from bisect import bisect_left
def lengthOfLIS(nums):
    tails = []
    for x in nums:
        k = bisect_left(tails, x)
        if k == len(tails):
            tails.append(x)
        else:
            tails[k] = x
    return len(tails)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [10, 9, 2, 5, 3, 7, 101, 18], tails: number[] = [], frames: CellsFrame[] = [], pad = () => [...tails, ...Array(a.length - tails.length).fill("")];
      a.forEach((x, i) => { let lo = 0, hi = tails.length; while (lo < hi) { const m = (lo + hi) >> 1; if (tails[m] < x) lo = m + 1; else hi = m; } const grew = lo === tails.length, old = tails[lo]; tails[lo] = x; frames.push({ note: grew ? `${x} is above every tail → append, length ${tails.length}` : `${x} replaces tail ${old} at slot ${lo}: a length-${lo + 1} run can now end lower`, rows: [a, pad()], tones: { [`0:${i}`]: "active", [`1:${lo}`]: grew ? "found" : "window" } }); });
      return cells(`LIS length: ${tails.length}`, [a, a.map(() => "")], frames, ["nums", "tails"]);
    },
  },

  "number-of-longest-increasing-subsequence": {
    approach: "For each i keep len[i] (longest increasing run ending at i) and cnt[i] (how many such runs); combine from every smaller earlier value.",
    idea: ["For j < i with nums[j] < nums[i], a run ending at j extends to i.", "If it gives a longer length, take len[j] + 1 and copy cnt[j]; if it ties, add cnt[j].", "Sum cnt[i] over every i whose len[i] equals the overall maximum."],
    code: `def findNumberOfLIS(nums):
    n = len(nums)
    length, count = [1] * n, [1] * n
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i]:
                if length[j] + 1 > length[i]:
                    length[i], count[i] = length[j] + 1, count[j]
                elif length[j] + 1 == length[i]:
                    count[i] += count[j]
    best = max(length)
    return sum(c for l, c in zip(length, count) if l == best)`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const a = [1, 3, 5, 4, 7], n = a.length, L = a.map(() => 1), C = a.map(() => 1), frames: CellsFrame[] = [];
      for (let i = 0; i < n; i++) { const from: number[] = []; for (let j = 0; j < i; j++) if (a[j] < a[i]) { if (L[j] + 1 > L[i]) { L[i] = L[j] + 1; C[i] = C[j]; } else if (L[j] + 1 === L[i]) C[i] += C[j]; from.push(j); } frames.push({ note: from.length ? `${a[i]}: extends runs ending at ${from.map((j) => a[j]).join(", ")} → length ${L[i]}, ${C[i]} way${C[i] === 1 ? "" : "s"}` : `${a[i]}: nothing smaller before it, length 1`, rows: [a, [...L], [...C]], tones: { [`0:${i}`]: "active", ...all(from.map((j) => `0:${j}`), "window"), [`1:${i}`]: "found", [`2:${i}`]: "found" } }); }
      const best = Math.max(...L), ans = C.filter((_, i) => L[i] === best).reduce((x, y) => x + y, 0);
      frames.push({ note: `longest length ${best}; add counts where length is ${best}: ${ans}`, rows: [a, L, C], tones: all(L.map((l, i) => (l === best ? `2:${i}` : "")).filter(Boolean), "found") });
      return cells(`Longest increasing subsequences: ${ans}`, [a, a.map(() => ""), a.map(() => "")], frames, ["nums", "length", "count"]);
    },
  },

  "delete-operation-for-two-strings": {
    approach: "Keep the longest common subsequence and delete everything else: m + n - 2 · LCS.",
    idea: ["Whatever survives in both words must be a common subsequence.", "Keeping the longest one deletes the fewest characters.", "Compute LCS with the usual table: match → diagonal + 1, else max(up, left)."],
    code: `def minDistance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            if word1[i] == word2[j]:
                dp[i + 1][j + 1] = dp[i][j] + 1
            else:
                dp[i + 1][j + 1] = max(dp[i][j + 1], dp[i + 1][j])
    return m + n - 2 * dp[m][n]`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const a = "sea", b = "eat", m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)), frames: TableFrame[] = [];
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) { const eq = a[i - 1] === b[j - 1]; dp[i][j] = eq ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); frames.push({ note: eq ? `'${a[i - 1]}' = '${b[j - 1]}' → diagonal + 1 = ${dp[i][j]}` : `'${a[i - 1]}' ≠ '${b[j - 1]}' → max(up, left) = ${dp[i][j]}`, cells: upto(dp, i, j), active: [i, j], deps: eq ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]] }); }
      frames.push({ note: `LCS = ${dp[m][n]} ("ea") → delete ${m} + ${n} - 2 x ${dp[m][n]} = ${m + n - 2 * dp[m][n]}`, cells: dp, active: [m, n] });
      return table(`Deletions: ${m + n - 2 * dp[m][n]}`, ["", ...a], ["", ...b], frames);
    },
  },

  "longest-common-subsequence": {
    approach: "dp[i][j] = LCS of the first i letters of text1 and first j of text2: diagonal + 1 on a match, else the better of dropping one letter.",
    idea: ["If the last letters match, they can both be used: dp[i - 1][j - 1] + 1.", "Otherwise one of them is unused: max(dp[i - 1][j], dp[i][j - 1]).", "Row 0 and column 0 are 0 (an empty string)."],
    code: `def longestCommonSubsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            if text1[i] == text2[j]:
                dp[i + 1][j + 1] = dp[i][j] + 1
            else:
                dp[i + 1][j + 1] = max(dp[i][j + 1], dp[i + 1][j])
    return dp[m][n]`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const a = "ace", b = "abcde", m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)), frames: TableFrame[] = [];
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) { const eq = a[i - 1] === b[j - 1]; dp[i][j] = eq ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); frames.push({ note: eq ? `'${a[i - 1]}' = '${b[j - 1]}' → diagonal + 1 = ${dp[i][j]}` : `'${a[i - 1]}' ≠ '${b[j - 1]}' → max(up, left) = ${dp[i][j]}`, cells: upto(dp, i, j), active: [i, j], deps: eq ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]] }); }
      return table(`LCS("${b}", "${a}") = ${dp[m][n]}`, ["", ...a], ["", ...b], frames);
    },
  },

  "edit-distance": {
    approach: "dp[i][j] = edits to turn the first i letters of word1 into the first j of word2; equal letters cost nothing, otherwise 1 + the best of insert, delete, replace.",
    idea: ["Row 0 and column 0: turning a prefix into an empty string (or back) takes that many inserts or deletes.", "Equal last letters: dp[i - 1][j - 1].", "Otherwise 1 + min(delete dp[i - 1][j], insert dp[i][j - 1], replace dp[i - 1][j - 1])."],
    code: `def minDistance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const a = "horse", b = "ros", m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))), frames: TableFrame[] = [];
      const show = (r: number, c: number) => dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 || i < r || (i === r && j <= c) ? v : null)));
      frames.push({ note: "edges: i deletes to reach the empty string, j inserts to build from it", cells: show(0, n) });
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const eq = a[i - 1] === b[j - 1], del = dp[i - 1][j], ins = dp[i][j - 1], rep = dp[i - 1][j - 1]; dp[i][j] = eq ? rep : 1 + Math.min(del, ins, rep);
        const op = eq ? "" : rep <= del && rep <= ins ? "replace" : del <= ins ? "delete" : "insert";
        frames.push({ note: eq ? `'${a[i - 1]}' = '${b[j - 1]}' → free, copy diagonal ${dp[i][j]}` : `'${a[i - 1]}' vs '${b[j - 1]}': 1 + min(delete ${del}, insert ${ins}, replace ${rep}) = ${dp[i][j]} (${op})`, cells: show(i, j), active: [i, j], deps: eq ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1], [i - 1, j - 1]] });
      }
      return table(`"${a}" → "${b}": ${dp[m][n]} edits`, ["", ...a], ["", ...b], frames);
    },
  },

  "distinct-subsequences": {
    approach: "dp[i][j] = ways t[:i] appears as a subsequence of s[:j]: always dp[i][j - 1], plus dp[i - 1][j - 1] when t[i - 1] == s[j - 1].",
    idea: ["Ignoring s's last letter keeps every way already counted: dp[i][j - 1].", "If that letter equals t's last letter, it can also finish a match: add dp[i - 1][j - 1].", "The empty t appears once in any prefix, so row 0 is all 1. A 1D array updated right to left does the same work."],
    code: `def numDistinct(s, t):
    dp = [1] + [0] * len(t)
    for ch in s:
        for i in range(len(t), 0, -1):
            if t[i - 1] == ch:
                dp[i] += dp[i - 1]
    return dp[len(t)]`,
    lang: "python", time: "O(m·n)", space: "O(n)",
    viz: () => {
      const s = "babgbag", t = "bag", m = t.length, n = s.length, dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(i ? 0 : 1)), frames: TableFrame[] = [];
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) { const eq = t[i - 1] === s[j - 1]; dp[i][j] = dp[i][j - 1] + (eq ? dp[i - 1][j - 1] : 0); frames.push({ note: eq ? `'${t[i - 1]}' matches s[${j - 1}]: left ${dp[i][j - 1]} + diagonal ${dp[i - 1][j - 1]} = ${dp[i][j]}` : `'${t[i - 1]}' ≠ '${s[j - 1]}': copy left ${dp[i][j]}`, cells: dp.map((r, a) => r.map((v, b) => (a === 0 || a < i || (a === i && b <= j) ? v : null))), active: [i, j], deps: eq ? [[i, j - 1], [i - 1, j - 1]] : [[i, j - 1]] }); }
      return table(`"${t}" in "${s}": ${dp[m][n]} ways`, ["", ...t], ["", ...s], frames);
    },
  },

  "interleaving-string": {
    approach: "dp[i][j] is true when s3[:i + j] interleaves s1[:i] and s2[:j]; it comes from the cell above if s1[i - 1] matches, or from the left if s2[j - 1] matches.",
    idea: ["The lengths must add up.", "The last character of s3[:i + j] came from either s1 or s2.", "From s1: needs s1[i - 1] == s3[i + j - 1] and dp[i - 1][j]. From s2: needs s2[j - 1] == s3[i + j - 1] and dp[i][j - 1]."],
    code: `def isInterleave(s1, s2, s3):
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for i in range(m + 1):
        for j in range(n + 1):
            if i and s1[i - 1] == s3[i + j - 1] and dp[i - 1][j]:
                dp[i][j] = True
            if j and s2[j - 1] == s3[i + j - 1] and dp[i][j - 1]:
                dp[i][j] = True
    return dp[m][n]`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const s1 = "ab", s2 = "cab", s3 = "cabab", m = s1.length, n = s2.length, dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false)), frames: TableFrame[] = [], tf = (b: boolean) => (b ? "T" : "F");
      dp[0][0] = true;
      for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
        if (!i && !j) { frames.push({ note: "two empty prefixes interleave to the empty string", cells: upto(dp.map((r) => r.map(tf)), 0, 0), active: [0, 0] }); continue; }
        const up = i > 0 && s1[i - 1] === s3[i + j - 1] && dp[i - 1][j], left = j > 0 && s2[j - 1] === s3[i + j - 1] && dp[i][j - 1]; dp[i][j] = up || left;
        frames.push({ note: `s3[${i + j - 1}] = '${s3[i + j - 1]}': ${up ? `from s1 ('${s1[i - 1]}', above is T)` : left ? `from s2 ('${s2[j - 1]}', left is T)` : "neither s1 nor s2 can supply it here"} → ${tf(dp[i][j])}`, cells: upto(dp.map((r) => r.map(tf)), i, j), active: [i, j], deps: up ? [[i - 1, j]] : left ? [[i, j - 1]] : [], tones: { [`${i}:${j}`]: dp[i][j] ? "found" : "bad" } });
      }
      return table(`"${s3}" interleaves "${s1}" and "${s2}": ${dp[m][n]}`, ["", ...s1], ["", ...s2], frames);
    },
  },

  "shortest-common-supersequence": {
    approach: "Build the LCS table, then walk back from the corner: a shared letter is written once, otherwise write the letter of the side the walk leaves.",
    idea: ["The shortest string containing both is m + n - LCS long: every LCS letter is shared.", "Walking back from dp[m][n]: equal letters go in once and move diagonally.", "Otherwise move toward the larger neighbour, writing the letter being dropped from that word.", "When one word runs out, copy the rest of the other. Reverse at the end."],
    code: `def shortestCommonSupersequence(str1, str2):
    m, n = len(str1), len(str2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            if str1[i] == str2[j]:
                dp[i + 1][j + 1] = dp[i][j] + 1
            else:
                dp[i + 1][j + 1] = max(dp[i][j + 1], dp[i + 1][j])
    out, i, j = [], m, n
    while i and j:
        if str1[i - 1] == str2[j - 1]:
            out.append(str1[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            out.append(str1[i - 1])
            i -= 1
        else:
            out.append(str2[j - 1])
            j -= 1
    out += str1[:i][::-1] + str2[:j][::-1]
    return "".join(reversed(out))`,
    lang: "python", time: "O(m·n)", space: "O(m·n)",
    viz: () => {
      const a = "abac", b = "cab", m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)), frames: TableFrame[] = [];
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      frames.push({ note: `LCS table filled: LCS = ${dp[m][n]}, so the answer has ${m} + ${n} - ${dp[m][n]} = ${m + n - dp[m][n]} letters`, cells: dp, active: [m, n] });
      const out: string[] = [], path: string[] = []; let i = m, j = n;
      while (i && j) {
        path.push(`${i}:${j}`); let what: string;
        if (a[i - 1] === b[j - 1]) { out.push(a[i - 1]); what = `'${a[i - 1]}' in both: write once, go diagonal`; i--; j--; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) { out.push(a[i - 1]); what = `write '${a[i - 1]}' from str1, go up`; i--; }
        else { out.push(b[j - 1]); what = `write '${b[j - 1]}' from str2, go left`; j--; }
        frames.push({ note: `${what} → "${[...out].reverse().join("")}"`, cells: dp, active: [i, j], tones: all(path, "found") });
      }
      const rest = a.slice(0, i) + b.slice(0, j); out.push(...[...rest].reverse());
      const res = [...out].reverse().join("");
      frames.push({ note: `${rest ? `copy the rest "${rest}" → ` : ""}"${res}"`, cells: dp, tones: all(path, "found") });
      return table(`Shortest supersequence: "${res}"`, ["", ...a], ["", ...b], frames);
    },
  },

  "unique-paths": {
    approach: "paths[r][c] = paths[r - 1][c] + paths[r][c - 1]: you enter a cell from above or from the left.",
    idea: ["The top row and left column have exactly one path each.", "Every other cell adds the counts of its two entry cells.", "One row of memory is enough: row[c] += row[c - 1]."],
    code: `def uniquePaths(m, n):
    row = [1] * n
    for _ in range(m - 1):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[-1]`,
    lang: "python", time: "O(m·n)", space: "O(n)",
    viz: () => {
      const R = 3, C = 5, dp = Array.from({ length: R }, () => Array(C).fill(0)), frames: TableFrame[] = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { dp[r][c] = r === 0 || c === 0 ? 1 : dp[r - 1][c] + dp[r][c - 1]; if (r && c) frames.push({ note: `(${r}, ${c}): from above ${dp[r - 1][c]} + from left ${dp[r][c - 1]} = ${dp[r][c]}`, cells: dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 || i < r || (i === r && j <= c) ? v : null))), active: [r, c], deps: [[r - 1, c], [r, c - 1]] }); }
      frames.unshift({ note: "edge cells: only one way in (all right, or all down)", cells: dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 ? v : null))) });
      return table(`${R} x ${C} grid: ${dp[R - 1][C - 1]} paths`, nums(R), nums(C), frames);
    },
  },
};
