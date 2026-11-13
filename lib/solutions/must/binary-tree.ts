// Solutions for the must-do "binary-tree" questions that were new to the app (lib/patterns/overview/binary-tree.problems.ts). See ../arrays.ts for the style.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import { levelTree } from "../../sim.ts";
import type { Solution } from "../types";

/** Tree from a heap-indexed level array (children of i at 2i + 1 and 2i + 2), with each node's value. */
const treeOf = (vals: (number | null)[]) => ({ ...levelTree(vals), v: (i: number) => vals[i]! });
const tree = (title: string, nodes: ReturnType<typeof levelTree>["nodes"], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "count-good-nodes-in-binary-tree": {
    approach: "Preorder DFS that carries the largest value on the path from the root; a node is good when it is at least that value.",
    idea: ["A node is good when no node on the path from the root to it is larger, so the only thing it needs to know is the maximum so far on that path.", "That information flows down, so pass it as a parameter: preorder.", "At each node, count it if its value is at least the maximum, then call both children with max(maximum, value).", "The root is always good, since its path has only itself.", "Every node is visited once."],
    code: `def goodNodes(root):
    def dfs(node, best):
        if not node:
            return 0
        good = 1 if node.val >= best else 0
        best = max(best, node.val)
        return good + dfs(node.left, best) + dfs(node.right, best)
    return dfs(root, root.val)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [3, 1, 4, 3, null, 1, 5], { nodes, kids, v } = treeOf(vals), frames: TreeFrame[] = [], tones: Record<number, Tone> = {}, badges: Record<number, string> = {};
      let count = 0;
      const dfs = (i: number | null, best: number) => {
        if (i == null) return;
        const good = v(i) >= best; if (good) count++;
        tones[i] = good ? "found" : "bad"; badges[i] = `max ${best}`;
        frames.push({ note: `Node ${v(i)}: the largest value above it is ${best}. ${good ? `${v(i)} >= ${best}, so it is good` : `${v(i)} < ${best}, so it is not good`}. Good so far: ${count}. Pass max ${Math.max(best, v(i))} down`, tones: { ...tones, [i]: good ? "found" : "bad" }, badges: { ...badges } });
        dfs(kids[i][0], Math.max(best, v(i))); dfs(kids[i][1], Math.max(best, v(i)));
      };
      dfs(0, v(0));
      frames.push({ note: `Every node visited once: ${count} good nodes`, tones: { ...tones }, badges: { ...badges } });
      return tree(`goodNodes = ${count}`, nodes, frames);
    },
  },

  "sum-root-to-leaf-numbers": {
    approach: "Preorder DFS carrying the number built so far: number * 10 + digit; add it to the total at each leaf.",
    idea: ["Each root-to-leaf path spells a number, read from the root down.", "Moving one level down appends a digit, which is number * 10 + node.val.", "Pass that number to the children (it flows down, so preorder).", "At a leaf the number is complete: return it. An internal node returns the sum from its two children.", "A missing child returns 0, so nodes with one child work without a special case."],
    code: `def sumNumbers(root):
    def dfs(node, num):
        if not node:
            return 0
        num = num * 10 + node.val
        if not node.left and not node.right:
            return num
        return dfs(node.left, num) + dfs(node.right, num)
    return dfs(root, 0)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [4, 9, 0, 5, 1], { nodes, kids, v } = treeOf(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}, done: Record<number, Tone> = {};
      let total = 0;
      const dfs = (i: number | null, num: number) => {
        if (i == null) return;
        num = num * 10 + v(i); badges[i] = String(num);
        const leaf = kids[i][0] == null && kids[i][1] == null;
        if (leaf) total += num;
        frames.push({ note: leaf ? `Leaf ${v(i)}: the path spells ${num}. Add it: total = ${total}` : `Node ${v(i)}: ${i === 0 ? `the number starts as ${num}` : `number so far = ${(num - v(i)) / 10} * 10 + ${v(i)} = ${num}`}. Pass it to the children`, tones: { ...done, [i]: leaf ? "found" : "active" }, badges: { ...badges } });
        done[i] = leaf ? "found" : "done";
        dfs(kids[i][0], num); dfs(kids[i][1], num);
      };
      dfs(0, 0);
      frames.push({ note: `All leaves reached. Sum of the path numbers = ${total}`, tones: { ...done }, badges: { ...badges } });
      return tree(`sumNumbers = ${total}`, nodes, frames);
    },
  },

  "check-completeness-of-a-binary-tree": {
    approach: "BFS that also queues the missing children; after the first gap, any real node means the tree is not complete.",
    idea: ["In a complete tree, level order lists every node before the first missing spot, and nothing after it.", "So run BFS but push both children even when they are null.", "Once you pop a null, remember that a gap was seen.", "If you then pop a real node, there is a node after a gap: not complete.", "If the queue empties without that happening, the tree is complete."],
    code: `from collections import deque
def isCompleteTree(root):
    q = deque([root])
    gap = False
    while q:
        node = q.popleft()
        if not node:
            gap = True
        elif gap:
            return False
        else:
            q.append(node.left)
            q.append(node.right)
    return True`,
    lang: "python", time: "O(n)", space: "O(w)",
    viz: () => {
      const vals = [1, 2, 3, 4, 5, null, 7], { nodes, kids, v } = treeOf(vals), frames: TreeFrame[] = [], tones: Record<number, Tone> = {};
      const q: (number | null)[] = [0]; let gap = false, ans = true, slot = 0;
      while (q.length) {
        const i = q.shift()!; slot++;
        if (i == null) { gap = true; frames.push({ note: `Slot ${slot} in level order is empty: a gap. Every later slot must also be empty`, tones: { ...tones } }); continue; }
        if (gap) { ans = false; tones[i] = "bad"; frames.push({ note: `Slot ${slot} holds ${v(i)}, but a gap came before it, so the tree is not complete`, tones: { ...tones } }); break; }
        tones[i] = "found"; q.push(kids[i][0], kids[i][1]);
        frames.push({ note: `Slot ${slot} holds ${v(i)}, no gap yet. Queue both children, missing ones included`, tones: { ...tones, [i]: "active" } });
      }
      return tree(`isCompleteTree = ${ans}`, nodes, frames);
    },
  },

  "range-sum-of-bst": {
    approach: "DFS that uses the BST order to skip subtrees: below low go right only, above high go left only.",
    idea: ["If a node is smaller than low, it and its whole left subtree are out of range, so only its right subtree can help.", "If a node is larger than high, only its left subtree can help.", "Otherwise the node counts, and both subtrees may hold more keys in range.", "This visits only the nodes on the two boundary paths plus the ones in range: O(h + k) instead of O(n)."],
    code: `def rangeSumBST(root, low, high):
    if not root:
        return 0
    if root.val < low:
        return rangeSumBST(root.right, low, high)
    if root.val > high:
        return rangeSumBST(root.left, low, high)
    return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals = [10, 5, 15, 3, 7, null, 18], lo = 7, hi = 15, { nodes, kids, v } = treeOf(vals), frames: TreeFrame[] = [], tones: Record<number, Tone> = {};
      let sum = 0;
      const go = (i: number | null) => {
        if (i == null) return;
        if (v(i) < lo) { tones[i] = "bad"; frames.push({ note: `${v(i)} < ${lo}: it and everything on its left are too small. Skip them, go right only`, tones: { ...tones } }); return go(kids[i][1]); }
        if (v(i) > hi) { tones[i] = "bad"; frames.push({ note: `${v(i)} > ${hi}: it and everything on its right are too big. Skip them, go left only`, tones: { ...tones } }); return go(kids[i][0]); }
        sum += v(i); tones[i] = "found";
        frames.push({ note: `${v(i)} is in [${lo}, ${hi}]: add it, sum = ${sum}. Both sides may hold more`, tones: { ...tones } });
        go(kids[i][0]); go(kids[i][1]);
      };
      go(0);
      const skipped = nodes.filter((n) => !(n.id in tones)).map((n) => vals[n.id]);
      frames.push({ note: `Sum = ${sum}. Never visited: ${skipped.join(", ") || "none"}, cut off by the BST order`, tones: { ...Object.fromEntries(nodes.filter((n) => !(n.id in tones)).map((n) => [n.id, "muted" as Tone])), ...tones } });
      return tree(`rangeSumBST(${lo}, ${hi}) = ${sum}`, nodes, frames);
    },
  },
};
