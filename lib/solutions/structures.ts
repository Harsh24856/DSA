// Hand-written solutions (trees, linked lists, stacks, grids) for the first two weeks of the daily plan.
import type { Diagram, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { levelTree, type TNode } from "../sim.ts";
import type { Solution } from "./types";

type V = (number | null)[];
/** Tree helpers over level-order arrays: node id = level-order index. */
function T(vals: V) {
  const { nodes, kids } = levelTree(vals);
  const val = (i: number) => vals[i] as number;
  return { nodes, kids, val };
}
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
/** Accumulate tones across frames so visited nodes stay marked. */
function trail(frames: TreeFrame[], keep: Tone = "done"): TreeFrame[] {
  const seen: Record<number, Tone> = {};
  return frames.map((f) => { const out = { ...f, tones: { ...seen, ...f.tones } }; Object.keys(f.tones || {}).forEach((k) => { if (f.tones![+k] !== "muted") seen[+k] = f.tones![+k] === "found" ? "found" : keep; }); return out; });
}
/** Build a tree diagram from explicit (value, parent, side) creation steps. */
function grow(steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[]) {
  const nodes: TNode[] = steps.map((s, id) => ({ id, label: s.label, parent: s.parent, side: s.side }));
  const frames: TreeFrame[] = steps.map((s, k) => ({ note: s.note, tones: { ...Object.fromEntries(nodes.map((n) => [n.id, n.id < k ? "done" : n.id === k ? "active" : "muted"])) } as Record<number, Tone> }));
  return { nodes, frames };
}

export const STRUCT_SOLUTIONS: Record<string, Solution> = {
  "path-sum-ii": {
    approach: "DFS from the root carrying the remaining target and the current path; record a copy at leaves where the target reaches 0.",
    idea: ["Subtract each node's value as you go down.", "At a leaf with remaining 0, the path is an answer; copy it.", "Pop the node when returning so the same list is reused (backtracking)."],
    code: `def pathSum(root, targetSum):
    out, path = [], []
    def dfs(node, rem):
        if not node: return
        path.append(node.val)
        rem -= node.val
        if not node.left and not node.right and rem == 0:
            out.append(path[:])
        dfs(node.left, rem); dfs(node.right, rem)
        path.pop()
    dfs(root, targetSum)
    return out`,
    lang: "python", time: "O(n²) worst (copying paths)", space: "O(h)",
    viz: () => {
      const vals: V = [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, null, 5, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], path: number[] = [];
      const dfs = (i: number | null, rem: number) => { if (i == null) return; path.push(i); rem -= val(i); const leaf = kids[i][0] == null && kids[i][1] == null, hit = leaf && rem === 0; frames.push({ note: `${val(i)}: remaining ${rem}${leaf ? (hit ? ` → leaf with 0 left: path [${path.map(val).join(", ")}]` : " → leaf, not 0") : ""}`, tones: Object.fromEntries(path.map((p) => [p, hit ? "found" : "active"])) as Record<number, Tone>, badges: { [i]: String(rem) } }); dfs(kids[i][0], rem); dfs(kids[i][1], rem); path.pop(); };
      dfs(0, 22);
      return tree("Root-to-leaf paths summing to 22", nodes, frames);
    },
  },

  "construct-binary-search-tree-from-preorder-traversal": {
    approach: "Read preorder once, placing each value only if it fits the (low, high) bound passed down; otherwise it belongs to an ancestor.",
    idea: ["In preorder the root comes first, then all of its left subtree (smaller values), then the right subtree.", "Recurse with bounds: the left child must be below the parent, the right child above it.", "A shared index walks the array once, so it is O(n)."],
    code: `def bstFromPreorder(preorder):
    i = 0
    def build(hi):
        nonlocal i
        if i == len(preorder) or preorder[i] > hi:
            return None
        node = TreeNode(preorder[i]); i += 1
        node.left = build(node.val)
        node.right = build(hi)
        return node
    return build(float("inf"))`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const pre = [8, 5, 1, 7, 10, 12]; let i = 0; const steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[] = [];
      const build = (hi: number, parent: number | null, side?: "L" | "R") => { if (i === pre.length || pre[i] > hi) return; const v = pre[i++], id = steps.length; steps.push({ label: String(v), parent, side, note: `${v} < bound ${Number.isFinite(hi) ? hi : "∞"} → place it ${parent == null ? "as the root" : `as the ${side === "L" ? "left" : "right"} child of ${steps[parent].label}`}` }); build(v, id, "L"); build(hi, id, "R"); };
      build(Infinity, null);
      const g = grow(steps); return tree("BST from preorder [8, 5, 1, 7, 10, 12]", g.nodes, g.frames);
    },
  },

  "construct-binary-tree-from-preorder-and-postorder-traversal": {
    approach: "preorder[0] is the root and preorder[1] is the left child; its position in postorder tells how big the left subtree is.",
    idea: ["The left subtree's root (preorder[1]) is the LAST node of the left subtree in postorder.", "So everything in postorder up to it is the left subtree; the rest (minus the root) is the right subtree.", "Recurse on both parts. Use a map of value → postorder index."],
    code: `def constructFromPrePost(preorder, postorder):
    at = {v: i for i, v in enumerate(postorder)}
    def build(a, b, c):            # preorder[a..b], postorder starting at c
        if a > b: return None
        root = TreeNode(preorder[a])
        if a == b: return root
        size = at[preorder[a + 1]] - c + 1   # left subtree size
        root.left = build(a + 1, a + size, c)
        root.right = build(a + size + 1, b, c + size)
        return root
    return build(0, len(preorder) - 1, 0)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const pre = [1, 2, 4, 5, 3, 6, 7], post = [4, 5, 2, 6, 7, 3, 1], at = new Map(post.map((v, i) => [v, i])); const steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[] = [];
      const build = (a: number, b: number, c: number, parent: number | null, side?: "L" | "R") => { if (a > b) return; const id = steps.length; if (a === b) { steps.push({ label: String(pre[a]), parent, side, note: `${pre[a]} is a single node` }); return; } const size = at.get(pre[a + 1])! - c + 1; steps.push({ label: String(pre[a]), parent, side, note: `root ${pre[a]}; left child ${pre[a + 1]} ends postorder at ${at.get(pre[a + 1])} → left subtree has ${size} node${size > 1 ? "s" : ""}` }); build(a + 1, a + size, c, id, "L"); build(a + size + 1, b, c + size, id, "R"); };
      build(0, pre.length - 1, 0, null);
      const g = grow(steps); return tree("Tree from preorder + postorder", g.nodes, g.frames);
    },
  },

  "convert-sorted-list-to-binary-search-tree": {
    approach: "The middle element is the root (balanced split); build left from the left half and right from the right half.",
    idea: ["A sorted sequence's middle element has half the values on each side, which keeps the BST balanced.", "Copy the list values into an array for O(1) middle access (or use fast/slow pointers each level for O(n log n)).", "Recurse on both halves."],
    code: `def sortedListToBST(head):
    vals = []
    while head:
        vals.append(head.val); head = head.next
    def build(lo, hi):
        if lo > hi: return None
        mid = (lo + hi) // 2
        node = TreeNode(vals[mid])
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node
    return build(0, len(vals) - 1)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const v = [-10, -3, 0, 5, 9]; const steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[] = [];
      const build = (lo: number, hi: number, parent: number | null, side?: "L" | "R") => { if (lo > hi) return; const mid = (lo + hi) >> 1, id = steps.length; steps.push({ label: String(v[mid]), parent, side, note: `range [${v.slice(lo, hi + 1).join(", ")}] → middle ${v[mid]} becomes the ${parent == null ? "root" : `${side === "L" ? "left" : "right"} child`}` }); build(lo, mid - 1, id, "L"); build(mid + 1, hi, id, "R"); };
      build(0, v.length - 1, null);
      const g = grow(steps); return tree("Sorted list [-10, -3, 0, 5, 9] → balanced BST", g.nodes, g.frames);
    },
  },

  "all-nodes-distance-k-in-binary-tree": {
    approach: "Record each node's parent, then BFS outward from the target (children and parent are all neighbours) for k steps.",
    idea: ["A tree with parent links is just an undirected graph.", "BFS from the target; after k rings, the queue holds exactly the nodes at distance k.", "Mark visited so you don't walk back."],
    code: `from collections import deque
def distanceK(root, target, k):
    parent, stack = {root: None}, [root]
    while stack:
        n = stack.pop()
        for c in (n.left, n.right):
            if c: parent[c] = n; stack.append(c)
    q, seen = deque([target]), {target}
    for _ in range(k):
        for _ in range(len(q)):
            n = q.popleft()
            for m in (n.left, n.right, parent[n]):
                if m and m not in seen:
                    seen.add(m); q.append(m)
    return [n.val for n in q]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals: V = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], { nodes, kids, val } = T(vals), par = new Map<number, number>(); Object.entries(kids).forEach(([p, ch]) => ch.forEach((c) => c != null && par.set(c, +p)));
      const k = 2, target = 1; let q = [target]; const seen = new Set(q), dist: Record<number, string> = { [target]: "d0" }; const frames: TreeFrame[] = [{ note: `Start at target ${val(target)}`, tones: { [target]: "active" }, badges: { ...dist } }];
      for (let d = 1; d <= k; d++) { const nq: number[] = []; for (const n of q) for (const m of [kids[n][0], kids[n][1], par.get(n)]) if (m != null && !seen.has(m)) { seen.add(m); nq.push(m); dist[m] = "d" + d; } q = nq; frames.push({ note: `Ring ${d} (children and parent count): ${q.map(val).join(", ")}`, tones: Object.fromEntries([...seen].map((x) => [x, q.includes(x) ? (d === k ? "found" : "window") : "done"])) as Record<number, Tone>, badges: { ...dist } }); }
      return tree(`Nodes at distance ${k} from ${val(target)}: ${q.map(val).join(", ")}`, nodes, frames);
    },
  },

  "most-frequent-subtree-sum": {
    approach: "Post-order: each node's subtree sum is left + right + its value; count sums and return those with the top count.",
    idea: ["A subtree sum needs both children's sums first, so compute bottom-up.", "Count every sum in a hash map; answer all sums tied for the highest count."],
    code: `from collections import Counter
def findFrequentTreeSum(root):
    count = Counter()
    def s(node):
        if not node: return 0
        total = node.val + s(node.left) + s(node.right)
        count[total] += 1
        return total
    s(root)
    top = max(count.values())
    return [v for v, c in count.items() if c == top]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals: V = [5, 2, -5], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}, count = new Map<number, number>();
      const s = (i: number | null): number => { if (i == null) return 0; const t = val(i) + s(kids[i][0]) + s(kids[i][1]); badges[i] = "sum " + t; count.set(t, (count.get(t) || 0) + 1); frames.push({ note: `subtree at ${val(i)} sums to ${t}`, tones: { [i]: "active" }, badges: { ...badges } }); return t; };
      s(0); const top = Math.max(...count.values()), res = [...count].filter(([, c]) => c === top).map(([v]) => v);
      frames.push({ note: `Counts: ${[...count].map(([v, c]) => `${v}×${c}`).join(", ")} → most frequent: [${res.join(", ")}]`, tones: {}, badges: { ...badges } });
      return tree("Subtree sums", nodes, trail(frames));
    },
  },

  "double-a-number-represented-as-a-linked-list": {
    approach: "Each digit doubles, plus 1 if the NEXT digit is ≥ 5 (it will carry). One pass, plus a new head if the first digit ≥ 5.",
    idea: ["Doubling a digit d gives a carry into the digit before it exactly when the next digit is 5 or more.", "So walk left to right: new digit = (2d + (next ≥ 5)) mod 10.", "If the head digit is ≥ 5, a new leading 1 appears."],
    code: `def doubleIt(head):
    if head.val >= 5:
        head = ListNode(0, head)
    node = head
    while node:
        node.val = node.val * 2 % 10
        if node.next and node.next.val >= 5:
            node.val += 1
        node = node.next
    return head`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const orig = [1, 8, 9], vals: (string | number)[] = ["0", ...orig], next = vals.map((_, i) => (i + 1 < vals.length ? i + 1 : -1)), frames: ListFrame[] = [];
      frames.push({ note: "Head 1 < 5, so no new leading digit is needed (the 0 placeholder is dropped)", next, values: [...vals], ptrs: [{ i: 1, label: "node" }], tones: { 0: "muted" } });
      for (let i = 1; i < vals.length; i++) { const d = orig[i - 1], carry = i < orig.length && orig[i] >= 5 ? 1 : 0, nv = ((d * 2) % 10) + carry; vals[i] = nv; frames.push({ note: `${d} × 2 = ${d * 2} → keep ${(d * 2) % 10}${carry ? ` + 1 because the next digit ${orig[i]} ≥ 5 will carry` : ""} = ${nv}`, next, values: [...vals], ptrs: [{ i, label: "node" }], tones: { 0: "muted", ...Object.fromEntries(Array.from({ length: i }, (_, k) => [k + 1, "found"])) } }); }
      return { kind: "list", title: "Double 1 → 8 → 9 (189 × 2 = 378)", values: ["0", ...orig], frames };
    },
  },

  "where-will-the-ball-fall": {
    approach: "Simulate each ball row by row: a cell's slope sends it one column over, and it gets stuck at a wall or a V shape.",
    idea: ["A board cell 1 sends the ball right, -1 sends it left.", "The ball moves from column c to c + grid[r][c] only if that column is inside the box and slopes the same way; otherwise it is stuck.", "Each ball takes O(rows)."],
    code: `def findBall(grid):
    R, C = len(grid), len(grid[0])
    out = []
    for c in range(C):
        for r in range(R):
            d = grid[r][c]
            nc = c + d
            if nc < 0 or nc >= C or grid[r][nc] != d:
                c = -1; break
            c = nc
        out.append(c)
    return out`,
    lang: "python", time: "O(R · C)", space: "O(C)",
    viz: () => {
      const g = [[1, 1, 1, -1, -1], [1, 1, 1, -1, -1], [-1, -1, -1, 1, 1], [1, 1, 1, 1, -1], [-1, -1, -1, -1, -1]], show = g.map((r) => r.map((x) => (x === 1 ? "↘" : "↙")));
      const frames: TableFrame[] = []; let c = 0; const path: [number, number][] = [];
      for (let r = 0; r < g.length; r++) { const d = g[r][c], nc = c + d; path.push([r, c]); const stuck = nc < 0 || nc >= g[0].length || g[r][nc] !== d; frames.push({ note: stuck ? `row ${r}: slope ${d === 1 ? "right" : "left"} meets ${nc < 0 || nc >= g[0].length ? "the wall" : "an opposite slope (V)"} → ball 0 is stuck (-1)` : `row ${r}: slope ${d === 1 ? "right" : "left"} → column ${nc}`, cells: show, active: [r, c], deps: path.slice(0, -1) }); if (stuck) { c = -1; break; } c = nc; }
      const ball2: [number, number][] = []; let c2 = 1; for (let r = 0; r < g.length && c2 >= 0; r++) { const d = g[r][c2], nc = c2 + d; ball2.push([r, c2]); if (nc < 0 || nc >= g[0].length || g[r][nc] !== d) c2 = -1; else c2 = nc; }
      frames.push({ note: `Each ball is simulated the same way. Ball 1 ends at ${c2}.`, cells: show, deps: ball2 });
      return { kind: "table", title: "Where will the ball fall (ball 0)", rowHead: g.map((_, i) => String(i)), colHead: g[0].map((_, i) => String(i)), frames };
    },
  },

  "kth-largest-sum-in-a-binary-tree": {
    approach: "BFS level by level, sum each level, then return the kth largest sum (or -1 if there are fewer than k levels).",
    idea: ["Snapshot len(queue) to process exactly one level at a time.", "Sort the level sums descending (or keep a size-k min-heap)."],
    code: `from collections import deque
def kthLargestLevelSum(root, k):
    sums, q = [], deque([root])
    while q:
        s = 0
        for _ in range(len(q)):
            n = q.popleft(); s += n.val
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        sums.append(s)
    if len(sums) < k: return -1
    return sorted(sums, reverse=True)[k - 1]`,
    lang: "python", time: "O(n + L log L)", space: "O(w)",
    viz: () => {
      const vals: V = [5, 8, 9, 2, 1, 3, 7, 4, 6], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], sums: number[] = []; let q = [0];
      while (q.length) { const s = q.reduce((a, i) => a + val(i), 0); sums.push(s); frames.push({ note: `level ${sums.length}: ${q.map(val).join(" + ")} = ${s}`, tones: Object.fromEntries(q.map((i) => [i, "active"])) as Record<number, Tone>, badges: { [q[q.length - 1]]: "Σ " + s } }); q = q.flatMap((i) => kids[i].filter((c): c is number => c != null)); }
      const k = 2, sorted = [...sums].sort((a, b) => b - a);
      frames.push({ note: `Level sums [${sums.join(", ")}] sorted: [${sorted.join(", ")}] → ${k}nd largest = ${sorted[k - 1]}`, tones: {} });
      return tree("Kth largest level sum (k = 2)", nodes, trail(frames));
    },
  },

  "delete-leaves-with-a-given-value": {
    approach: "Post-order: fix the children first, then delete this node if it has become a leaf with the target value.",
    idea: ["Deleting a leaf can turn its parent into a target leaf, so children must be processed before the parent.", "Return None for a deleted node so the parent's pointer is cleared."],
    code: `def removeLeafNodes(root, target):
    if not root: return None
    root.left = removeLeafNodes(root.left, target)
    root.right = removeLeafNodes(root.right, target)
    if not root.left and not root.right and root.val == target:
        return None
    return root`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [1, 2, 3, 2, null, 2, 4], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], gone = new Set<number>();
      const go = (i: number | null): boolean => { if (i == null) return true; const l = go(kids[i][0]), r = go(kids[i][1]); const leaf = l && r; if (leaf && val(i) === 2) { gone.add(i); frames.push({ note: `${val(i)} is now a leaf equal to target 2 → delete`, tones: Object.fromEntries([...gone].map((g) => [g, g === i ? "bad" : "muted"])) as Record<number, Tone> }); return true; } frames.push({ note: `${val(i)} stays (${leaf ? "leaf but not 2" : "still has a child"})`, tones: { ...Object.fromEntries([...gone].map((g) => [g, "muted"])), [i]: "found" } as Record<number, Tone> }); return false; };
      go(0);
      return tree("Delete leaves with value 2 (repeatedly)", nodes, frames);
    },
  },

  "number-of-good-leaf-nodes-pairs": {
    approach: "Post-order: each node returns the distances to the leaves below it; pairs that meet here with total ≤ distance count.",
    idea: ["Two leaves' shortest path goes through their lowest common ancestor.", "At each node, combine every left-leaf distance with every right-leaf distance (each + 1 to reach this node).", "Return the list of distances + 1 upward, dropping those already above the limit."],
    code: `def countPairs(root, distance):
    ans = 0
    def dfs(node):
        nonlocal ans
        if not node: return []
        if not node.left and not node.right: return [1]
        L, R = dfs(node.left), dfs(node.right)
        ans += sum(1 for a in L for b in R if a + b <= distance)
        return [d + 1 for d in L + R if d + 1 < distance]
    dfs(root)
    return ans`,
    lang: "python", time: "O(n · d²)", space: "O(h · d)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6, 7], dist = 3, { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}; let ans = 0;
      const dfs = (i: number | null): number[] => { if (i == null) return []; if (kids[i][0] == null && kids[i][1] == null) { badges[i] = "[1]"; frames.push({ note: `leaf ${val(i)}: distance 1 to its parent`, tones: { [i]: "active" }, badges: { ...badges } }); return [1]; } const L = dfs(kids[i][0]), R = dfs(kids[i][1]); let add = 0; L.forEach((a) => R.forEach((b) => { if (a + b <= dist) add++; })); ans += add; const up = [...L, ...R].map((d) => d + 1).filter((d) => d < dist); badges[i] = `[${up.join(",")}]`; frames.push({ note: `${val(i)}: left ${JSON.stringify(L)} × right ${JSON.stringify(R)} → ${add} pair${add === 1 ? "" : "s"} with sum ≤ ${dist} (total ${ans})`, tones: { [i]: add ? "found" : "active" }, badges: { ...badges } }); return up; };
      dfs(0);
      return tree(`Good leaf pairs (distance ≤ ${dist}): ${ans}`, nodes, trail(frames));
    },
  },

  "score-of-parentheses": {
    approach: "Track depth; every '()' adds 2^depth (its depth inside the outer pairs), so no stack of scores is needed.",
    idea: ["Expanding the rules, the score is a sum over each innermost '()' of 2 to the power of how many pairs enclose it.", "So scan with a depth counter and, at each ')' that directly follows '(', add 1 << depth."],
    code: `def scoreOfParentheses(s):
    depth = score = 0
    for i, ch in enumerate(s):
        if ch == "(":
            depth += 1
        else:
            depth -= 1
            if s[i - 1] == "(":
                score += 1 << depth
    return score`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "(()(()))", frames: StackFrame[] = [], st: string[] = []; let score = 0;
      [...s].forEach((ch, i) => { if (ch === "(") { st.push("("); frames.push({ note: `'(' → depth ${st.length}`, items: [...st], incoming: ch, side: `score ${score}` }); } else { st.pop(); if (s[i - 1] === "(") { score += 1 << st.length; frames.push({ note: `'()' at depth ${st.length} → +2^${st.length} = ${1 << st.length}`, items: [...st], incoming: ch, popped: ["("], side: `score ${score}` }); } else frames.push({ note: "closing an outer pair: its value was already counted through the inner ()s", items: [...st], incoming: ch, popped: ["("], side: `score ${score}` }); } });
      return { kind: "stack", title: `score("(()(()))") = ${score}`, input: s.split(""), frames };
    },
  },

  "balance-a-binary-search-tree": {
    approach: "Inorder gives the sorted values; rebuild by always taking the middle value as the root.",
    idea: ["Any BST's inorder traversal is sorted.", "Building from a sorted array with the middle as root gives height ⌈log₂(n+1)⌉, which is balanced."],
    code: `def balanceBST(root):
    vals = []
    def inorder(n):
        if n: inorder(n.left); vals.append(n.val); inorder(n.right)
    inorder(root)
    def build(lo, hi):
        if lo > hi: return None
        mid = (lo + hi) // 2
        return TreeNode(vals[mid], build(lo, mid - 1), build(mid + 1, hi))
    return build(0, len(vals) - 1)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const v = [1, 2, 3, 4, 5, 6, 7]; const steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[] = [];
      const build = (lo: number, hi: number, parent: number | null, side?: "L" | "R") => { if (lo > hi) return; const mid = (lo + hi) >> 1, id = steps.length; steps.push({ label: String(v[mid]), parent, side, note: `${parent == null ? "A skewed BST 1 → 2 → … → 7 has inorder [1..7]. " : ""}slice [${v.slice(lo, hi + 1).join(", ")}] → middle ${v[mid]} is the ${parent == null ? "root" : `${side === "L" ? "left" : "right"} child`}` }); build(lo, mid - 1, id, "L"); build(mid + 1, hi, id, "R"); };
      build(0, v.length - 1, null);
      const g = grow(steps); return tree("Rebalance: inorder, then middle as root", g.nodes, g.frames);
    },
  },

  "longest-univalue-path": {
    approach: "Post-order: each node returns the longest downward same-value arm; the path through it is left arm + right arm.",
    idea: ["An arm continues into a child only if the child has the same value.", "Path length (edges) through a node = left arm + right arm; track the best.", "Return max(left arm, right arm) to the parent: a path cannot fork upward."],
    code: `def longestUnivaluePath(root):
    best = 0
    def arm(node):
        nonlocal best
        if not node: return 0
        l, r = arm(node.left), arm(node.right)
        l = l + 1 if node.left and node.left.val == node.val else 0
        r = r + 1 if node.right and node.right.val == node.val else 0
        best = max(best, l + r)
        return max(l, r)
    arm(root)
    return best`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [5, 4, 5, 1, 1, null, 5], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}; let best = 0;
      const arm = (i: number | null): number => { if (i == null) return 0; let l = arm(kids[i][0]), r = arm(kids[i][1]); l = kids[i][0] != null && val(kids[i][0]!) === val(i) ? l + 1 : 0; r = kids[i][1] != null && val(kids[i][1]!) === val(i) ? r + 1 : 0; best = Math.max(best, l + r); badges[i] = `${l}+${r}`; frames.push({ note: `${val(i)}: same-value arms left ${l}, right ${r} → path of ${l + r} edges here (best ${best})`, tones: { [i]: l + r === best && best > 0 ? "found" : "active" }, badges: { ...badges } }); return Math.max(l, r); };
      arm(0);
      return tree(`Longest univalue path: ${best} edges`, nodes, trail(frames));
    },
  },

  "maximum-difference-between-node-and-ancestor": {
    approach: "Pass the min and max seen on the path from the root; at each node the best difference uses one of them.",
    idea: ["The biggest |ancestor - node| for a node uses either the smallest or the largest ancestor.", "So carry (lo, hi) down the path; at a null child, hi - lo is a candidate."],
    code: `def maxAncestorDiff(root):
    def go(node, lo, hi):
        if not node: return hi - lo
        lo, hi = min(lo, node.val), max(hi, node.val)
        return max(go(node.left, lo, hi), go(node.right, lo, hi))
    return go(root, root.val, root.val)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, null, null, 13], { nodes, kids, val } = T(vals), frames: TreeFrame[] = []; let best = 0;
      const go = (i: number | null, lo: number, hi: number) => { if (i == null) return; lo = Math.min(lo, val(i)); hi = Math.max(hi, val(i)); best = Math.max(best, hi - lo); frames.push({ note: `${val(i)}: path min ${lo}, max ${hi} → difference ${hi - lo} (best ${best})`, tones: { [i]: hi - lo === best ? "found" : "active" }, badges: { [i]: `${lo}..${hi}` } }); go(kids[i][0], lo, hi); go(kids[i][1], lo, hi); };
      go(0, val(0), val(0));
      return tree(`Max ancestor difference: ${best}`, nodes, trail(frames));
    },
  },

  "maximum-product-of-splitted-binary-tree": {
    approach: "Get the total sum, then every subtree sum s is one side of a cut: maximise s × (total - s); take mod only at the end.",
    idea: ["Cutting the edge above a node splits the tree into that subtree (sum s) and the rest (total - s).", "One post-order pass collects every subtree sum.", "Compare products with full precision, then apply mod 10⁹ + 7 to the best."],
    code: `def maxProduct(root):
    sums = []
    def s(node):
        if not node: return 0
        t = node.val + s(node.left) + s(node.right)
        sums.append(t)
        return t
    total = s(root)
    return max(x * (total - x) for x in sums) % (10**9 + 7)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6], { nodes, kids, val } = T(vals), sub: Record<number, number> = {};
      const s = (i: number | null): number => { if (i == null) return 0; const t = val(i) + s(kids[i][0]) + s(kids[i][1]); sub[i] = t; return t; };
      const total = s(0); let best = 0; const frames: TreeFrame[] = [{ note: `Total sum = ${total}`, tones: { 0: "active" }, badges: { 0: "Σ " + total } }];
      Object.keys(sub).map(Number).filter((i) => i !== 0).forEach((i) => { const p = sub[i] * (total - sub[i]); best = Math.max(best, p); frames.push({ note: `cut above ${val(i)}: ${sub[i]} × ${total - sub[i]} = ${p} (best ${best})`, tones: { [i]: p === best ? "found" : "window" }, badges: { [i]: "Σ " + sub[i] } }); });
      return tree(`Best split product: ${best}`, nodes, frames);
    },
  },

  "count-complete-tree-nodes": {
    approach: "Compare the leftmost and rightmost depths: equal means a perfect subtree with 2^h - 1 nodes; otherwise recurse.",
    idea: ["In a complete tree, at least one of the two subtrees is perfect.", "Measuring a depth costs O(log n), and you recurse into only one side each level.", "Total O(log² n) instead of visiting every node."],
    code: `def countNodes(root):
    if not root: return 0
    lh = rh = 0
    l, r = root, root
    while l: lh += 1; l = l.left
    while r: rh += 1; r = r.right
    if lh == rh:
        return (1 << lh) - 1
    return 1 + countNodes(root.left) + countNodes(root.right)`,
    lang: "python", time: "O(log² n)", space: "O(log n)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [];
      const depth = (i: number | null, side: 0 | 1) => { let d = 0; while (i != null) { d++; i = kids[i][side]; } return d; };
      const go = (i: number | null): number => { if (i == null) return 0; const lh = depth(i, 0), rh = depth(i, 1); if (lh === rh) { frames.push({ note: `${val(i)}: left depth ${lh} = right depth ${rh} → perfect, ${(1 << lh) - 1} nodes without visiting them`, tones: { [i]: "found" } }); return (1 << lh) - 1; } frames.push({ note: `${val(i)}: left depth ${lh} ≠ right depth ${rh} → count 1 + both children`, tones: { [i]: "active" } }); return 1 + go(kids[i][0]) + go(kids[i][1]); };
      const n = go(0);
      return tree(`Complete tree has ${n} nodes`, nodes, trail(frames));
    },
  },

  "remove-zero-sum-consecutive-nodes-from-linked-list": {
    approach: "Prefix sums: map each prefix value to its LAST node; then link every node to the node after the last occurrence of its prefix.",
    idea: ["If two nodes share a prefix sum, everything between them sums to 0.", "First pass: record the last node for each prefix (dummy has prefix 0).", "Second pass: node.next = last[prefix].next, skipping every zero-sum run at once."],
    code: `def removeZeroSumSublists(head):
    dummy = ListNode(0, head)
    last, s, node = {}, 0, dummy
    while node:
        s += node.val; last[s] = node; node = node.next
    s, node = 0, dummy
    while node:
        s += node.val
        node.next = last[s].next
        node = node.next
    return dummy.next`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals = [0, 1, 2, -3, 3, 1], pre: number[] = []; let s = 0; vals.forEach((v) => { s += v; pre.push(s); });
      const lastIdx = new Map<number, number>(); pre.forEach((p, i) => lastIdx.set(p, i));
      const next = vals.map((_, i) => (i + 1 < vals.length ? i + 1 : -1)), frames: ListFrame[] = [{ note: `Prefix sums (dummy first): [${pre.join(", ")}]`, next: [...next], ptrs: [{ i: 0, label: "dummy" }], tones: { 0: "muted" } }];
      const alive = new Set<number>([0]); let i = 0;
      while (i !== -1) { const j = lastIdx.get(pre[i])!; const to = j + 1 < vals.length ? j + 1 : -1; const skipped = j > i; next[i] = to; frames.push({ note: skipped ? `prefix ${pre[i]} appears again at node ${j}: nodes ${i + 1}..${j} sum to 0 → skip them` : `prefix ${pre[i]} is unique → keep the link`, next: [...next], ptrs: [{ i, label: "node" }], tones: { 0: "muted", ...Object.fromEntries(Array.from({ length: Math.max(0, j - i) }, (_, k) => [i + 1 + k, "bad"])) } }); i = to; if (i !== -1) alive.add(i); }
      return { kind: "list", title: "Remove zero-sum runs from 1 → 2 → -3 → 3 → 1", values: vals.map((v, k) => (k === 0 ? "d" : v)), frames };
    },
  },

  "nearest-exit-from-entrance-in-maze": {
    approach: "BFS from the entrance over empty cells; the first border cell (other than the entrance) reached is the nearest exit.",
    idea: ["Every move costs 1, so BFS gives the fewest steps.", "Mark cells visited when you enqueue them.", "An exit is any empty border cell that is not the entrance."],
    code: `from collections import deque
def nearestExit(maze, entrance):
    R, C = len(maze), len(maze[0])
    q = deque([(entrance[0], entrance[1], 0)])
    maze[entrance[0]][entrance[1]] = "+"
    while q:
        r, c, d = q.popleft()
        for nr, nc in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0 <= nr < R and 0 <= nc < C and maze[nr][nc] == ".":
                if nr in (0, R - 1) or nc in (0, C - 1):
                    return d + 1
                maze[nr][nc] = "+"
                q.append((nr, nc, d + 1))
    return -1`,
    lang: "python", time: "O(R · C)", space: "O(R · C)",
    viz: () => {
      const m = [["+", "+", ".", "+"], [".", ".", ".", "+"], ["+", "+", "+", "."]], R = 3, C = 4, ent: [number, number] = [1, 2];
      const cellsOf = (dist: Map<string, number>) => m.map((row, r) => row.map((x, c) => (x === "+" ? "▉" : dist.has(`${r},${c}`) ? dist.get(`${r},${c}`)! : ".")));
      const dist = new Map([[ent.join(","), 0]]), q: [number, number][] = [ent], frames: TableFrame[] = [{ note: "Start BFS at the entrance (distance 0)", cells: cellsOf(dist), active: ent }];
      let found: [number, number] | null = null;
      while (q.length && !found) { const [r, c] = q.shift()!; for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]] as [number, number][]) { if (nr < 0 || nr >= R || nc < 0 || nc >= C || m[nr][nc] !== "." || dist.has(`${nr},${nc}`)) continue; dist.set(`${nr},${nc}`, dist.get(`${r},${c}`)! + 1); const exit = nr === 0 || nr === R - 1 || nc === 0 || nc === C - 1; frames.push({ note: exit ? `(${nr},${nc}) is on the border → nearest exit at ${dist.get(`${nr},${nc}`)} steps` : `reach (${nr},${nc}) at distance ${dist.get(`${nr},${nc}`)}`, cells: cellsOf(dist), active: [nr, nc], deps: [[r, c]] }); if (exit) { found = [nr, nc]; break; } q.push([nr, nc]); } }
      return { kind: "table", title: "Nearest exit (BFS)", rowHead: ["0", "1", "2"], colHead: ["0", "1", "2", "3"], frames };
    },
  },

  "next-greater-node-in-linked-list": {
    approach: "Copy values into an array, then a monotonic stack of indices gives each node's next greater value.",
    idea: ["Same as Next Greater Element, just read from a linked list.", "Each new value pops every smaller value waiting on the stack; those pops get their answer."],
    code: `def nextLargerNodes(head):
    vals = []
    while head:
        vals.append(head.val); head = head.next
    ans, st = [0] * len(vals), []
    for i, x in enumerate(vals):
        while st and vals[st[-1]] < x:
            ans[st.pop()] = x
        st.append(i)
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [2, 7, 4, 3, 5], ans: (string | number)[] = a.map(() => 0), st: number[] = [], frames: StackFrame[] = [];
      a.forEach((x, i) => { const popped: number[] = []; while (st.length && a[st[st.length - 1]] < x) { const j = st.pop()!; ans[j] = x; popped.push(a[j]); } st.push(i); frames.push({ note: popped.length ? `${x} answers ${popped.join(", ")}` : `push ${x}`, items: st.map((j) => a[j]), incoming: x, popped, side: `answer: [${ans.join(", ")}]` }); });
      return { kind: "stack", title: "Next greater node for 2 → 7 → 4 → 3 → 5", input: a, frames };
    },
  },

  "reverse-substrings-between-each-pair-of-parentheses": {
    approach: "Stack of partial strings: '(' starts a new buffer, ')' reverses the current buffer and appends it to the one below.",
    idea: ["The innermost pair is reversed first; then its text is part of the outer buffer and gets reversed again with it.", "A stack of strings models exactly that nesting. O(n²) worst case; a wormhole pairing trick gets O(n)."],
    code: `def reverseParentheses(s):
    st = [""]
    for ch in s:
        if ch == "(":
            st.append("")
        elif ch == ")":
            top = st.pop()[::-1]
            st[-1] += top
        else:
            st[-1] += ch
    return st[0]`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const s = "(ed(et(oc))el)", st: string[] = [""], frames: StackFrame[] = [];
      for (const ch of s) { if (ch === "(") { st.push(""); frames.push({ note: "'(' → start a new buffer", items: st.map((x) => x || "∅"), incoming: ch }); } else if (ch === ")") { const top = st.pop()!; const rev = [...top].reverse().join(""); st[st.length - 1] += rev; frames.push({ note: `')' → reverse "${top}" to "${rev}" and append it below`, items: st.map((x) => x || "∅"), incoming: ch, popped: [top] }); } else { st[st.length - 1] += ch; frames.push({ note: `'${ch}' → append to the top buffer`, items: st.map((x) => x || "∅"), incoming: ch }); } }
      return { kind: "stack", title: `"${s}" → "${st[0]}"`, input: s.split(""), frames };
    },
  },
};
