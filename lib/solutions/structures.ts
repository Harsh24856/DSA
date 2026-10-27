// Hand-written solutions (trees, linked lists, stacks, grids) for the first four weeks of the daily plan.
import type { Diagram, GraphFrame, ListFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
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

  "flatten-a-multilevel-doubly-linked-list": {
    approach: "Iterative DFS with a stack: pop a node, link it after the previous one, then push its next and (on top) its child.",
    idea: ["The flattened order is a preorder walk: a node, then its whole child list, then its own next.", "Pushing next first and child second makes the child come out first.", "Fix both pointers (prev.next and node.prev) as you go and clear every child pointer."],
    code: `def flatten(head):
    if not head:
        return head
    st, prev = [head], None
    while st:
        node = st.pop()
        if prev:
            prev.next, node.prev = node, prev
        if node.next:
            st.append(node.next)
        if node.child:
            st.append(node.child)
            node.child = None
        prev = node
    return head`,
    lang: "python", time: "O(n)", space: "O(depth + n)",
    viz: () => {
      const next: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 7: 8, 8: 9, 9: 10, 11: 12 }, child: Record<number, number> = { 3: 7, 8: 11 };
      const st = [1], out: number[] = [], frames: StackFrame[] = [];
      while (st.length) { const n = st.pop()!; out.push(n); const pushed: number[] = []; if (next[n]) { st.push(next[n]); pushed.push(next[n]); } if (child[n]) { st.push(child[n]); pushed.push(child[n]); } frames.push({ note: `pop ${n}, link it after ${out.length > 1 ? out[out.length - 2] : "nothing (head)"}${pushed.length ? `; push ${pushed.join(" then ")}${child[n] ? " (child on top)" : ""}` : ""}`, items: [...st], popped: [n], side: out.join(" → ") }); }
      return { kind: "stack", title: "Flatten 1-6 with children 3 → 7-10 and 8 → 11-12", frames };
    },
  },

  "restore-the-array-from-adjacent-pairs": {
    approach: "Build the adjacency list; an end of the array has only one neighbour, so start there and keep walking to the neighbour you did not come from.",
    idea: ["The array is a path: inner values have two neighbours, the two ends have one.", "Start at an end and repeatedly step to the neighbour that is not the previous value."],
    code: `from collections import defaultdict
def restoreArray(adjacentPairs):
    g = defaultdict(list)
    for a, b in adjacentPairs:
        g[a].append(b); g[b].append(a)
    start = next(x for x in g if len(g[x]) == 1)
    out, prev = [start], None
    while len(out) < len(g):
        cur = out[-1]
        nxt = g[cur][0] if g[cur][0] != prev else g[cur][-1]
        prev = cur
        out.append(nxt)
    return out`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const pairs = [[4, -2], [1, 4], [-3, 1]], vals = [4, -2, 1, -3], id = (v: number) => vals.indexOf(v);
      const nodes = [{ id: 0, label: "4", x: 45, y: 20 }, { id: 1, label: "-2", x: 12, y: 55 }, { id: 2, label: "1", x: 75, y: 55 }, { id: 3, label: "-3", x: 45, y: 88 }];
      const g = new Map<number, number[]>(); pairs.forEach(([a, b]) => { g.set(a, [...(g.get(a) || []), b]); g.set(b, [...(g.get(b) || []), a]); });
      const deg = Object.fromEntries(vals.map((v) => [id(v), `deg ${g.get(v)!.length}`])); const frames: GraphFrame[] = [{ note: "Neighbour counts: the two ends have exactly one", badges: deg }];
      const start = vals.find((v) => g.get(v)!.length === 1)!, out = [start], tones: Record<number, Tone> = { [id(start)]: "found" }, edgeTones: Record<string, Tone> = {}; let prev: number | null = null;
      frames.push({ note: `start at ${start}: out = [${out.join(", ")}]`, badges: deg, tones: { ...tones } });
      while (out.length < vals.length) { const cur = out[out.length - 1], nb = g.get(cur)!, nxt = nb[0] !== prev ? nb[0] : nb[nb.length - 1]; prev = cur; out.push(nxt); tones[id(nxt)] = "found"; edgeTones[`${Math.min(id(cur), id(nxt))}-${Math.max(id(cur), id(nxt))}`] = "found"; frames.push({ note: `from ${cur} step to ${nxt} (not where we came from): out = [${out.join(", ")}]`, badges: deg, tones: { ...tones, [id(nxt)]: "active" }, edgeTones: { ...edgeTones } }); }
      return { kind: "graph", title: `Restored: [${out.join(", ")}]`, nodes, edges: pairs.map(([a, b]) => ({ a: id(a), b: id(b) })), frames };
    },
  },

  "combination-sum-iii": {
    approach: "Backtrack over digits 1..9 in increasing order, stopping a branch when the digit is bigger than what is left.",
    idea: ["Choosing digits in increasing order makes every combination appear once.", "Track the remaining sum; once a digit exceeds it, larger digits do too, so break.", "Record the path when it has k digits and the remainder is 0."],
    code: `def combinationSum3(k, n):
    out = []
    def go(start, path, rem):
        if len(path) == k:
            if rem == 0:
                out.append(path[:])
            return
        for d in range(start, 10):
            if d > rem:
                break
            path.append(d)
            go(d + 1, path, rem - d)
            path.pop()
    go(1, [], n)
    return out`,
    lang: "python", time: "O(C(9, k) · k)", space: "O(k)",
    viz: () => {
      const k = 3, n = 8, out: number[][] = [], path: number[] = [], frames: StackFrame[] = [];
      const go = (start: number, rem: number) => { if (path.length === k) { if (rem === 0) out.push([...path]); frames.push({ note: rem === 0 ? `[${path.join(", ")}] sums to ${n}: record it` : `${k} digits but ${rem} still left: dead end`, items: [...path], side: `found: ${out.map((p) => `[${p.join(",")}]`).join(" ") || "none"}` }); return; } for (let d = start; d < 10; d++) { if (d > rem) { frames.push({ note: `${d} > remaining ${rem}: stop this branch`, items: [...path], side: `found: ${out.map((p) => `[${p.join(",")}]`).join(" ") || "none"}` }); break; } path.push(d); frames.push({ note: `try ${d}, remaining ${rem - d}`, items: [...path], incoming: d, side: `found: ${out.map((p) => `[${p.join(",")}]`).join(" ") || "none"}` }); go(d + 1, rem - d); path.pop(); } };
      go(1, n);
      return { kind: "stack", title: `k = ${k}, n = ${n}: ${out.map((p) => `[${p.join(", ")}]`).join(", ")}`, frames };
    },
  },

  "recover-binary-search-tree": {
    approach: "Inorder of a BST is sorted; the two swapped nodes show up as drops (prev > cur). Take the first drop's prev and the last drop's cur, then swap their values.",
    idea: ["Swapping two values in a sorted list creates one drop (if adjacent) or two drops.", "first = prev at the first drop, second = cur at the last drop.", "An iterative inorder walk with a stack keeps it O(h) extra space."],
    code: `def recoverTree(root):
    first = second = prev = None
    stack, node = [], root
    while stack or node:
        while node:
            stack.append(node); node = node.left
        node = stack.pop()
        if prev and prev.val > node.val:
            if not first:
                first = prev
            second = node
        prev = node
        node = node.right
    first.val, second.val = second.val, first.val`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [3, 1, 4, null, null, 2], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], st: number[] = []; let node: number | null = 0, prev: number | null = null, first: number | null = null, second: number | null = null;
      while (st.length || node != null) { while (node != null) { st.push(node); node = kids[node][0]; } const cur = st.pop()!; const drop = prev != null && val(prev) > val(cur); if (drop) { if (first == null) first = prev; second = cur; } frames.push({ note: `inorder visits ${val(cur)}${prev == null ? "" : drop ? `: ${val(prev!)} > ${val(cur)} is a drop → first = ${val(first!)}, second = ${val(cur)}` : `: ${val(prev)} < ${val(cur)}, in order`}`, tones: { [cur]: drop ? "bad" : "active", ...(first != null ? { [first]: "bad" } : {}) } }); prev = cur; node = kids[cur][1]; }
      frames.push({ note: `Swap the values of ${val(first!)} and ${val(second!)}`, tones: { [first!]: "found", [second!]: "found" }, labels: { [first!]: String(val(second!)), [second!]: String(val(first!)) } });
      return tree("Recover a BST with two swapped values", nodes, trail(frames));
    },
  },

  "most-stones-removed-with-same-row-or-column": {
    approach: "Stones sharing a row or column form groups; each group can be removed down to one stone, so the answer is stones - groups (Union-Find on rows and columns).",
    idea: ["Inside a connected group you can always remove stones leaf-first until one is left.", "Union each stone's row with its column (columns stored as ~c so they never clash with rows).", "Answer = number of stones - number of groups."],
    code: `def removeStones(stones):
    parent = {}
    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for r, c in stones:
        parent[find(r)] = find(~c)
    groups = {find(x) for x in parent}
    return len(stones) - len(groups)`,
    lang: "python", time: "O(n α(n))", space: "O(n)",
    viz: () => {
      const stones = [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]], nodes = stones.map(([r, c], id) => ({ id, label: `${r},${c}`, x: 15 + c * 35, y: 15 + r * 32 }));
      const edges: { a: number; b: number }[] = []; stones.forEach((s, i) => stones.forEach((t2, j) => { if (j > i && (s[0] === t2[0] || s[1] === t2[1])) edges.push({ a: i, b: j }); }));
      const parent = stones.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))); let groups = stones.length; const edgeTones: Record<string, Tone> = {}, frames: GraphFrame[] = [{ note: `${stones.length} stones, each its own group` }];
      for (const { a, b } of edges) { const ra = find(a), rb = find(b), same = stones[a][0] === stones[b][0] ? `row ${stones[a][0]}` : `column ${stones[a][1]}`; if (ra !== rb) { parent[ra] = rb; groups--; edgeTones[`${a}-${b}`] = "found"; } frames.push({ note: `(${stones[a].join(",")}) and (${stones[b].join(",")}) share ${same}${ra !== rb ? `: merge → ${groups} group${groups === 1 ? "" : "s"}` : ": already together"}`, tones: { [a]: "active", [b]: "active" }, edgeTones: { ...edgeTones } }); }
      frames.push({ note: `${stones.length} stones - ${groups} group${groups === 1 ? "" : "s"} = ${stones.length - groups} removable`, edgeTones: { ...edgeTones }, tones: Object.fromEntries(stones.map((_, i) => [i, "found"])) as Record<number, Tone> });
      return { kind: "graph", title: `Stones removed: ${stones.length - groups}`, nodes, edges, frames };
    },
  },

  "design-a-stack-with-increment-operation": {
    approach: "Lazy increments: store the pending add at index k - 1 only, and pass it down to the element below when popping.",
    idea: ["increment(k, val) affects the bottom k elements. Instead of touching all of them, add val to inc[k - 1].", "When popping index i, its real value is st[i] + inc[i]; then inc[i] moves to inc[i - 1] because it applies to everything below too.", "Every operation is O(1)."],
    code: `class CustomStack:
    def __init__(self, maxSize):
        self.n, self.st, self.inc = maxSize, [], []

    def push(self, x):
        if len(self.st) < self.n:
            self.st.append(x); self.inc.append(0)

    def pop(self):
        if not self.st:
            return -1
        add = self.inc.pop()
        if self.inc:
            self.inc[-1] += add
        return self.st.pop() + add

    def increment(self, k, val):
        if self.st:
            self.inc[min(k, len(self.st)) - 1] += val`,
    lang: "python", time: "O(1) per operation", space: "O(maxSize)",
    viz: () => {
      const max = 3, st: number[] = [], inc: number[] = [], frames: StackFrame[] = [], show = () => st.map((v, i) => (inc[i] ? `${v} +${inc[i]}` : v));
      const ops: [string, number?, number?][] = [["push", 1], ["push", 2], ["pop"], ["push", 2], ["push", 3], ["push", 4], ["increment", 5, 100], ["increment", 2, 100], ["pop"], ["pop"], ["pop"], ["pop"]];
      for (const [op, a, b] of ops) {
        if (op === "push") { const ok = st.length < max; if (ok) { st.push(a!); inc.push(0); } frames.push({ note: ok ? `push(${a})` : `push(${a}) ignored: stack is full (${max})`, items: show(), incoming: a, side: `inc = [${inc.join(", ")}]` }); }
        else if (op === "pop") { if (!st.length) { frames.push({ note: "pop() on an empty stack returns -1", items: [], side: "inc = []" }); continue; } const add = inc.pop()!; if (inc.length) inc[inc.length - 1] += add; const v = st.pop()! + add; frames.push({ note: `pop() returns ${v - add} + ${add} = ${v}${add && inc.length ? `; pass +${add} down` : ""}`, items: show(), popped: [v], side: `inc = [${inc.join(", ")}]` }); }
        else { const i = Math.min(a!, st.length) - 1; inc[i] += b!; frames.push({ note: `increment(${a}, ${b}): only inc[${i}] changes`, items: show(), side: `inc = [${inc.join(", ")}]` }); }
      }
      return { kind: "stack", title: "CustomStack(3) with lazy increments", frames };
    },
  },

  "maximum-binary-tree": {
    approach: "The maximum is the root; the part to its left builds the left subtree and the part to its right builds the right subtree.",
    idea: ["Follow the definition recursively: O(n²) in the worst case (sorted input).", "A decreasing monotonic stack builds the same tree in O(n): each new value adopts the last popped smaller node as its left child and becomes the right child of the stack top."],
    code: `def constructMaximumBinaryTree(nums):
    if not nums:
        return None
    i = nums.index(max(nums))
    return TreeNode(nums[i],
                    constructMaximumBinaryTree(nums[:i]),
                    constructMaximumBinaryTree(nums[i + 1:]))`,
    lang: "python", time: "O(n²) worst", space: "O(n)",
    viz: () => {
      const a = [3, 2, 1, 6, 0, 5]; const steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[] = [];
      const build = (lo: number, hi: number, parent: number | null, side?: "L" | "R") => { if (lo > hi) return; let m = lo; for (let i = lo; i <= hi; i++) if (a[i] > a[m]) m = i; const id = steps.length; steps.push({ label: String(a[m]), parent, side, note: `[${a.slice(lo, hi + 1).join(", ")}] → max ${a[m]} is the ${parent == null ? "root" : `${side === "L" ? "left" : "right"} child`}` }); build(lo, m - 1, id, "L"); build(m + 1, hi, id, "R"); };
      build(0, a.length - 1, null);
      const g = grow(steps); return tree("Maximum binary tree of [3, 2, 1, 6, 0, 5]", g.nodes, g.frames);
    },
  },

  "construct-smallest-number-from-di-string": {
    approach: "Push 1, 2, 3, … onto a stack; at every 'I' (and at the end) pop everything to the output, which reverses each run of 'D's.",
    idea: ["Writing digits in increasing order satisfies every 'I'.", "A run of 'D's needs those digits reversed; a stack reverses them.", "Flushing at each 'I' keeps the number as small as possible."],
    code: `def smallestNumber(pattern):
    out, st = [], []
    for i in range(len(pattern) + 1):
        st.append(str(i + 1))
        if i == len(pattern) or pattern[i] == "I":
            while st:
                out.append(st.pop())
    return "".join(out)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const p = "IIIDIDDD", st: number[] = [], frames: StackFrame[] = []; let out = "";
      for (let i = 0; i <= p.length; i++) { st.push(i + 1); const flush = i === p.length || p[i] === "I"; const popped: number[] = []; if (flush) while (st.length) { const d = st.pop()!; popped.push(d); out += d; } frames.push({ note: `push ${i + 1}; ${i === p.length ? "end of pattern" : `pattern[${i}] = '${p[i]}'`}${flush ? ` → flush ${popped.join("")}` : " → hold it"}`, items: [...st], incoming: i + 1, popped, side: `out = "${out}"` }); }
      return { kind: "stack", title: `"${p}" → "${out}"`, input: [...p], frames };
    },
  },

  "minimum-remove-to-make-valid-parentheses": {
    approach: "Stack of indices of '(': a ')' with an empty stack is deleted; any '(' left on the stack at the end is deleted too.",
    idea: ["Scan left to right. A ')' must match the latest unmatched '('.", "If there is none, that ')' can never be matched: remove it.", "Unmatched '(' are exactly the indices left on the stack."],
    code: `def minRemoveToMakeValid(s):
    s = list(s)
    st = []
    for i, ch in enumerate(s):
        if ch == "(":
            st.append(i)
        elif ch == ")":
            if st:
                st.pop()
            else:
                s[i] = ""
    for i in st:
        s[i] = ""
    return "".join(s)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "a)b(c)d(", chars = [...s], st: number[] = [], frames: StackFrame[] = [];
      chars.forEach((ch, i) => { if (ch === "(") { st.push(i); frames.push({ note: `'(' at ${i}: remember it`, items: st.map((j) => `(@${j}`), incoming: ch }); } else if (ch === ")") { if (st.length) { const j = st.pop()!; frames.push({ note: `')' at ${i} matches '(' at ${j}`, items: st.map((x) => `(@${x}`), incoming: ch, popped: [`(@${j}`] }); } else { chars[i] = ""; frames.push({ note: `')' at ${i} has nothing to match: delete it`, items: [], incoming: ch, side: `delete ${i}` }); } } else frames.push({ note: `'${ch}' is a letter: keep`, items: st.map((j) => `(@${j}`), incoming: ch }); });
      st.forEach((j) => { chars[j] = ""; }); frames.push({ note: `left over: ${st.map((j) => `'(' at ${j}`).join(", ") || "nothing"} → delete. Result "${chars.join("")}"`, items: [], popped: st.map((j) => `(@${j}`), side: `"${chars.join("")}"` });
      return { kind: "stack", title: `"${s}" → "${chars.join("")}"`, input: [...s], frames };
    },
  },

  "deepest-leaves-sum": {
    approach: "BFS level by level; when the next level is empty, the current level is the deepest, so return its sum.",
    idea: ["Level-order traversal processes one depth at a time.", "Keep only the current level; the last non-empty level holds exactly the deepest leaves."],
    code: `def deepestLeavesSum(root):
    level = [root]
    while True:
        nxt = [c for n in level for c in (n.left, n.right) if c]
        if not nxt:
            return sum(n.val for n in level)
        level = nxt`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, null, 6, 7, null, null, null, null, null, null, 8], { nodes, kids, val } = T(vals), frames: TreeFrame[] = []; let level = [0], depth = 0;
      while (true) { const nxt = level.flatMap((i) => kids[i].filter((c): c is number => c != null)), sum = level.reduce((x, i) => x + val(i), 0); frames.push({ note: nxt.length ? `depth ${depth}: [${level.map(val).join(", ")}], next level has ${nxt.length} node${nxt.length === 1 ? "" : "s"}` : `depth ${depth} is the last level: ${level.map(val).join(" + ")} = ${sum}`, tones: Object.fromEntries(level.map((i) => [i, nxt.length ? "active" : "found"])) as Record<number, Tone> }); if (!nxt.length) break; level = nxt; depth++; }
      return tree("Deepest leaves sum", nodes, trail(frames));
    },
  },

  "snapshot-array": {
    approach: "Each index keeps a list of (snap_id, value) changes; get binary-searches for the last change at or before the requested snap.",
    idea: ["Copying the whole array on every snap is too slow. Store only changes.", "Several sets between two snaps overwrite the same entry.", "get(index, snap) = value of the last entry with snap_id ≤ snap: bisect."],
    code: `from bisect import bisect_right
class SnapshotArray:
    def __init__(self, length):
        self.h = [[(-1, 0)] for _ in range(length)]
        self.snap_id = 0

    def set(self, index, val):
        h = self.h[index]
        if h[-1][0] == self.snap_id:
            h[-1] = (self.snap_id, val)
        else:
            h.append((self.snap_id, val))

    def snap(self):
        self.snap_id += 1
        return self.snap_id - 1

    def get(self, index, snap_id):
        h = self.h[index]
        return h[bisect_right(h, (snap_id, float("inf"))) - 1][1]`,
    lang: "python", time: "O(1) set and snap, O(log k) get", space: "O(changes)",
    viz: () => {
      const h: [number, number][][] = [[[-1, 0]], [[-1, 0]], [[-1, 0]]], frames: TableFrame[] = []; let snap = 0;
      const cellsOf = () => h.map((row) => [row.map(([s, v]) => `${s < 0 ? "init" : `s${s}`}:${v}`).join("  ")]);
      const ops: [string, number?, number?][] = [["set", 0, 5], ["snap"], ["set", 0, 6], ["set", 1, 2], ["set", 1, 3], ["snap"], ["get", 0, 0], ["get", 0, 1], ["get", 1, 0]];
      for (const [op, a, b] of ops) {
        if (op === "set") { const row = h[a!], over = row[row.length - 1][0] === snap; if (over) row[row.length - 1] = [snap, b!]; else row.push([snap, b!]); frames.push({ note: `set(${a}, ${b}) during snap ${snap}${over ? ": overwrite this snap's entry" : ": add an entry"}`, cells: cellsOf(), active: [a!, 0] }); }
        else if (op === "snap") { snap++; frames.push({ note: `snap() returns ${snap - 1}; nothing is copied`, cells: cellsOf() }); }
        else { const row = h[a!]; let k = 0; row.forEach(([s], j) => { if (s <= b!) k = j; }); frames.push({ note: `get(${a}, ${b}): last entry with snap ≤ ${b} is ${row[k][0] < 0 ? "init" : `s${row[k][0]}`} → ${row[k][1]}`, cells: cellsOf(), active: [a!, 0] }); }
      }
      return { kind: "table", title: "SnapshotArray(3): store changes only", rowHead: ["index 0", "index 1", "index 2"], colHead: ["history (snap:value)"], frames };
    },
  },

  "find-the-minimum-and-maximum-number-of-nodes-between-critical-points": {
    approach: "Walk the list with prev and cur; record the first and last critical index and the smallest gap between consecutive critical points.",
    idea: ["A node is critical if it is a strict local max or min compared with both neighbours.", "The max distance is last - first; the min distance must be between two consecutive critical points.", "Fewer than two critical points → [-1, -1]."],
    code: `def nodesBetweenCriticalPoints(head):
    first = last = -1
    best = float("inf")
    prev, cur, i = head, head.next, 1
    while cur.next:
        nxt = cur.next.val
        if prev.val < cur.val > nxt or prev.val > cur.val < nxt:
            if first == -1:
                first = i
            else:
                best = min(best, i - last)
            last = i
        prev, cur, i = cur, cur.next, i + 1
    return [-1, -1] if first == last else [best, last - first]`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const v = [5, 3, 1, 2, 5, 1, 2], next = v.map((_, i) => (i + 1 < v.length ? i + 1 : -1)), frames: ListFrame[] = [], tones: Record<number, Tone> = {}; let first = -1, last = -1, best = Number.MAX_SAFE_INTEGER;
      for (let i = 1; i < v.length - 1; i++) { const crit = (v[i - 1] < v[i] && v[i] > v[i + 1]) || (v[i - 1] > v[i] && v[i] < v[i + 1]); let note = `${v[i - 1]}, ${v[i]}, ${v[i + 1]}: `; if (crit) { if (first === -1) { first = i; note += `local ${v[i] > v[i + 1] ? "max" : "min"}, first critical point at ${i}`; } else { best = Math.min(best, i - last); note += `local ${v[i] > v[i + 1] ? "max" : "min"} at ${i}, gap ${i - last} (min gap ${best})`; } last = i; tones[i] = "found"; } else note += "not critical"; frames.push({ note, next, ptrs: [{ i: i - 1, label: "prev" }, { i, label: "cur" }], tones: { ...tones, [i]: crit ? "found" : "active" } }); }
      frames.push({ note: `min gap ${best}, max gap ${last} - ${first} = ${last - first} → [${best}, ${last - first}]`, next, ptrs: [{ i: first, label: "first" }, { i: last, label: "last" }], tones: { ...tones } });
      return { kind: "list", title: `[${v.join(", ")}] → [${best}, ${last - first}]`, values: v, frames };
    },
  },

  "complete-binary-tree-inserter": {
    approach: "Keep every node in a level-order array; the new node at index i hangs under the node at index (i - 1) // 2.",
    idea: ["A complete tree in level order has no gaps, exactly like a heap array.", "So the parent of the next position is (len - 1) // 2: left child if it has none, else right child.", "Insert is O(1) after one BFS in the constructor."],
    code: `class CBTInserter:
    def __init__(self, root):
        self.a, i = [root], 0
        while i < len(self.a):
            n = self.a[i]; i += 1
            if n.left: self.a.append(n.left)
            if n.right: self.a.append(n.right)

    def insert(self, val):
        node = TreeNode(val)
        p = self.a[(len(self.a) - 1) // 2]
        if not p.left:
            p.left = node
        else:
            p.right = node
        self.a.append(node)
        return p.val

    def get_root(self):
        return self.a[0]`,
    lang: "python", time: "O(1) insert", space: "O(n)",
    viz: () => {
      const vals: V = [1, 2, 3, 4, 5, 6, 7], { nodes, val } = T(vals), start = 4, frames: TreeFrame[] = [];
      const muted = (from: number) => Object.fromEntries(vals.map((_, i) => [i, "muted"]).filter(([i]) => (i as number) >= from)) as Record<number, Tone>;
      frames.push({ note: `Start with [${vals.slice(0, start).join(", ")}] stored in level order (faded nodes come later)`, tones: muted(start), badges: Object.fromEntries(vals.slice(0, start).map((_, i) => [i, `#${i}`])) });
      for (let i = start; i < vals.length; i++) { const p = (i - 1) >> 1; frames.push({ note: `insert(${val(i)}) goes to slot ${i}; parent slot (${i} - 1) // 2 = ${p} holds ${val(p)} → ${i % 2 ? "left" : "right"} child, return ${val(p)}`, tones: { ...muted(i + 1), [i]: "found", [p]: "active" }, badges: Object.fromEntries(vals.slice(0, i + 1).map((_, j) => [j, `#${j}`])) }); }
      return tree("Complete binary tree inserter", nodes, frames);
    },
  },

  "add-one-row-to-tree": {
    approach: "Walk to depth - 1; for each node there, put a new node between it and each child (old left goes under the new left, old right under the new right).",
    idea: ["depth == 1 is special: the new node becomes the root with the old tree as its left child.", "Otherwise collect the nodes at depth - 1 with BFS.", "For each, left = new(val, left = old left) and right = new(val, right = old right)."],
    code: `def addOneRow(root, val, depth):
    if depth == 1:
        return TreeNode(val, root)
    level = [root]
    for _ in range(depth - 2):
        level = [c for n in level for c in (n.left, n.right) if c]
    for n in level:
        n.left = TreeNode(val, n.left)
        n.right = TreeNode(val, None, n.right)
    return root`,
    lang: "python", time: "O(n)", space: "O(width)",
    viz: () => {
      const vals: V = [4, 2, 6, 1, 1, 1, 1, 3, null, null, 1, 5], { nodes } = T(vals), added = [3, 4, 5, 6];
      const frames: TreeFrame[] = [{ note: "Tree [4, 2, 6, 3, 1, 5], add a row of 1s at depth 3. Faded nodes are the new row", tones: Object.fromEntries(added.map((i) => [i, "muted"])) as Record<number, Tone> }];
      frames.push({ note: "Depth 2 holds 2 and 6: walk there with BFS", tones: { 1: "active", 2: "active", 3: "muted", 4: "muted", 5: "muted", 6: "muted" } });
      frames.push({ note: "Under 2: new left 1 keeps the old left 3, new right 1 keeps the old right 1", tones: { 1: "active", 3: "found", 4: "found", 5: "muted", 6: "muted" } });
      frames.push({ note: "Under 6: new left 1 keeps the old left 5, new right 1 gets the old right (none)", tones: { 2: "active", 3: "found", 4: "found", 5: "found", 6: "found" } });
      return tree("Add one row of 1s at depth 3", nodes, frames);
    },
  },

  "binary-search-tree-to-greater-sum-tree": {
    approach: "Reverse inorder (right, node, left) visits values from largest to smallest; keep a running total and write it into each node.",
    idea: ["Each node's new value is the sum of all values ≥ it.", "Visiting from largest to smallest, that is exactly the running total including the node itself."],
    code: `def bstToGst(root):
    total = 0
    def go(n):
        nonlocal total
        if not n:
            return
        go(n.right)
        total += n.val
        n.val = total
        go(n.left)
    go(root)
    return root`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [4, 1, 6, 0, 2, 5, 7, null, null, null, 3, null, null, null, 8], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], labels: Record<number, string> = {}; let total = 0;
      const go = (i: number | null) => { if (i == null) return; go(kids[i][1]); total += val(i); labels[i] = String(total); frames.push({ note: `${val(i)}: running total ${total - val(i)} + ${val(i)} = ${total}`, tones: { [i]: "active" }, labels: { ...labels } }); go(kids[i][0]); };
      go(0);
      return tree("BST to greater sum tree", nodes, trail(frames));
    },
  },

  "possible-bipartition": {
    approach: "Two-colour the dislike graph with BFS; a dislike between two people of the same colour makes it impossible.",
    idea: ["Two groups where every dislike crosses between them is exactly a bipartite graph.", "Colour an uncoloured person 1, their dislikes -1, theirs 1, and so on.", "Run it from every uncoloured person, since the graph can be split into parts."],
    code: `from collections import deque
def possibleBipartition(n, dislikes):
    g = [[] for _ in range(n + 1)]
    for a, b in dislikes:
        g[a].append(b); g[b].append(a)
    color = [0] * (n + 1)
    for s in range(1, n + 1):
        if color[s]:
            continue
        color[s] = 1
        q = deque([s])
        while q:
            u = q.popleft()
            for v in g[u]:
                if color[v] == color[u]:
                    return False
                if not color[v]:
                    color[v] = -color[u]
                    q.append(v)
    return True`,
    lang: "python", time: "O(n + e)", space: "O(n + e)",
    viz: () => {
      const n = 5, dis = [[1, 2], [1, 3], [2, 4], [3, 5], [4, 5]], nodes = [{ id: 0, label: "1", x: 50, y: 12 }, { id: 1, label: "2", x: 20, y: 45 }, { id: 2, label: "3", x: 80, y: 45 }, { id: 3, label: "4", x: 25, y: 88 }, { id: 4, label: "5", x: 75, y: 88 }];
      const g: number[][] = Array.from({ length: n + 1 }, () => []); dis.forEach(([a, b]) => { g[a].push(b); g[b].push(a); });
      const color = Array(n + 1).fill(0), frames: GraphFrame[] = [], view = () => ({ tones: Object.fromEntries(color.slice(1).map((c, i) => [i, c === 1 ? "found" : c === -1 ? "active" : "muted"])) as Record<number, Tone>, badges: Object.fromEntries(color.slice(1).map((c, i) => [i, c === 1 ? "A" : c === -1 ? "B" : ""]).filter(([, b]) => b)) });
      let ok = true; color[1] = 1; const q = [1]; frames.push({ note: "Put person 1 in group A", ...view() });
      outer: while (q.length) { const u = q.shift()!; for (const v of g[u]) { if (color[v] === color[u]) { ok = false; frames.push({ note: `${u} and ${v} dislike each other but are both in group ${color[u] === 1 ? "A" : "B"}: impossible`, ...view(), edgeTones: { [`${Math.min(u, v) - 1}-${Math.max(u, v) - 1}`]: "bad" } }); break outer; } if (!color[v]) { color[v] = -color[u]; q.push(v); frames.push({ note: `${u} dislikes ${v} → ${v} goes to group ${color[v] === 1 ? "A" : "B"}`, ...view(), edgeTones: { [`${Math.min(u, v) - 1}-${Math.max(u, v) - 1}`]: "found" } }); } } }
      return { kind: "graph", title: `5 people, a 5-cycle of dislikes: ${ok}`, nodes, edges: dis.map(([a, b]) => ({ a: a - 1, b: b - 1 })), frames };
    },
  },

  "minimize-hamming-distance-after-swap-operations": {
    approach: "Swaps chain together, so indices in one connected component can be rearranged freely; per component, match target values against a counter of source values.",
    idea: ["If a-b and b-c can swap, any order of a, b, c is reachable: Union-Find the allowed swaps.", "For each component, count the source values it holds.", "Each target value that the component's counter can supply is a match; the rest count toward the distance."],
    code: `from collections import Counter, defaultdict
def minimumHammingDistance(source, target, allowedSwaps):
    parent = list(range(len(source)))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for a, b in allowedSwaps:
        parent[find(a)] = find(b)
    have = defaultdict(Counter)
    for i, x in enumerate(source):
        have[find(i)][x] += 1
    ans = 0
    for i, y in enumerate(target):
        c = have[find(i)]
        if c[y] > 0:
            c[y] -= 1
        else:
            ans += 1
    return ans`,
    lang: "python", time: "O((n + s) α(n))", space: "O(n)",
    viz: () => {
      const src = [1, 2, 3, 4], tgt = [2, 1, 4, 5], swaps = [[0, 1], [2, 3]], nodes = src.map((v, i) => ({ id: i, label: String(v), x: 15 + i * 25, y: 50 }));
      const parent = src.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), frames: GraphFrame[] = [], edgeTones: Record<string, Tone> = {}, badges = Object.fromEntries(tgt.map((t2, i) => [i, `want ${t2}`]));
      swaps.forEach(([a, b]) => { parent[find(a)] = find(b); edgeTones[`${a}-${b}`] = "found"; frames.push({ note: `swap ${a}-${b} allowed: indices ${a} and ${b} can hold each other's values`, edgeTones: { ...edgeTones }, badges }); });
      const have = new Map<number, Map<number, number>>(); src.forEach((x, i) => { const r = find(i), c = have.get(r) || new Map(); c.set(x, (c.get(x) || 0) + 1); have.set(r, c); });
      let ans = 0; const tones: Record<number, Tone> = {};
      tgt.forEach((y, i) => { const c = have.get(find(i))!, ok = (c.get(y) || 0) > 0; if (ok) c.set(y, c.get(y)! - 1); else ans++; tones[i] = ok ? "found" : "bad"; frames.push({ note: `index ${i} wants ${y}: ${ok ? "its group has one, match" : "its group has none, mismatch"} (distance ${ans})`, tones: { ...tones }, edgeTones: { ...edgeTones }, badges }); });
      return { kind: "graph", title: `source [${src.join(", ")}] → target [${tgt.join(", ")}]: ${ans}`, nodes, edges: swaps.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "serialize-and-deserialize-bst": {
    approach: "Serialize as preorder values only; a BST's preorder alone rebuilds it, because the value bounds tell where each value belongs.",
    idea: ["No null markers are needed: in preorder a value goes left if it is below the parent, right otherwise.", "Deserialize with (low, high) bounds and a shared index, like building a BST from preorder.", "Both directions are O(n)."],
    code: `class Codec:
    def serialize(self, root):
        out = []
        def pre(n):
            if n:
                out.append(str(n.val)); pre(n.left); pre(n.right)
        pre(root)
        return ",".join(out)

    def deserialize(self, data):
        vals = [int(x) for x in data.split(",")] if data else []
        i = 0
        def build(lo, hi):
            nonlocal i
            if i == len(vals) or not lo < vals[i] < hi:
                return None
            v = vals[i]; i += 1
            return TreeNode(v, build(lo, v), build(v, hi))
        return build(float("-inf"), float("inf"))`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const pre = [5, 3, 2, 4, 7, 8]; let i = 0; const steps: { label: string; parent: number | null; side?: "L" | "R"; note: string }[] = [];
      const fmt = (x: number) => (Number.isFinite(x) ? String(x) : x > 0 ? "+∞" : "-∞");
      const build = (lo: number, hi: number, parent: number | null, side?: "L" | "R") => { if (i === pre.length || !(lo < pre[i] && pre[i] < hi)) return; const v = pre[i++], id = steps.length; steps.push({ label: String(v), parent, side, note: `${parent == null ? `serialize gives "${pre.join(",")}". ` : ""}${v} fits in (${fmt(lo)}, ${fmt(hi)}) → ${parent == null ? "root" : `${side === "L" ? "left" : "right"} child of ${steps[parent].label}`}` }); build(lo, v, id, "L"); build(v, hi, id, "R"); };
      build(-Infinity, Infinity, null);
      const g = grow(steps); return tree(`Deserialize "${pre.join(",")}"`, g.nodes, g.frames);
    },
  },

  "find-the-safest-path-in-a-grid": {
    approach: "Multi-source BFS from every thief gives each cell's safeness; then a max-heap search finds the path whose smallest safeness is largest.",
    idea: ["Safeness of a cell = Manhattan distance to the nearest thief: BFS from all thieves at once.", "A path's safeness is its minimum cell. Like Dijkstra, always expand the cell with the best path value so far (max-heap of min-so-far).", "The first time the bottom-right cell is popped, its value is the answer."],
    code: `from collections import deque
import heapq
def maximumSafenessFactor(grid):
    n = len(grid)
    dist = [[-1] * n for _ in range(n)]
    q = deque((r, c) for r in range(n) for c in range(n) if grid[r][c])
    for r, c in q:
        dist[r][c] = 0
    while q:
        r, c = q.popleft()
        for nr, nc in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0 <= nr < n and 0 <= nc < n and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    heap, seen = [(-dist[0][0], 0, 0)], {(0, 0)}
    while heap:
        s, r, c = heapq.heappop(heap)
        if (r, c) == (n - 1, n - 1):
            return -s
        for nr, nc in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in seen:
                seen.add((nr, nc))
                heapq.heappush(heap, (max(s, -dist[nr][nc]), nr, nc))`,
    lang: "python", time: "O(n² log n)", space: "O(n²)",
    viz: () => {
      const g = [[0, 0, 0, 1], [0, 0, 0, 0], [0, 0, 0, 0], [1, 0, 0, 0]], n = 4, dist: number[][] = g.map((row) => row.map((x) => (x ? 0 : -1))), frames: TableFrame[] = [], D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const show = () => dist.map((row) => row.map((x) => (x < 0 ? null : x)));
      let layer = g.flatMap((row, r) => row.map((x, c) => [r, c, x]).filter((t2) => t2[2]).map(([r2, c2]) => [r2, c2])); frames.push({ note: "Thieves are at distance 0", cells: show(), tones: Object.fromEntries(layer.map(([r, c]) => [`${r}:${c}`, "bad"])) as Record<string, Tone> }); let d = 0;
      while (layer.length) { const nxt: number[][] = []; for (const [r, c] of layer) for (const [dr, dc] of D) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n && dist[nr][nc] === -1) { dist[nr][nc] = d + 1; nxt.push([nr, nc]); } } if (!nxt.length) break; d++; frames.push({ note: `BFS ring ${d}: cells ${d} step${d === 1 ? "" : "s"} from the nearest thief`, cells: show(), tones: Object.fromEntries(nxt.map(([r, c]) => [`${r}:${c}`, "window"])) as Record<string, Tone> }); layer = nxt; }
      const heap: [number, number, number][] = [[dist[0][0], 0, 0]], seen = new Set(["0,0"]), from = new Map<string, string>(); let ans = 0;
      while (heap.length) { heap.sort((a, b) => b[0] - a[0] || a[1] - b[1] || a[2] - b[2]); const [s, r, c] = heap.shift()!; if (r === n - 1 && c === n - 1) { ans = s; const path: string[] = []; let k: string | undefined = `${r},${c}`; while (k) { path.push(k); k = from.get(k); } frames.push({ note: `reached the corner with safeness ${s}`, cells: show(), tones: Object.fromEntries(path.map((p) => [p.replace(",", ":"), "found"])) as Record<string, Tone>, active: [r, c] }); break; } frames.push({ note: `pop (${r},${c}) with best path safeness ${s}`, cells: show(), active: [r, c] }); for (const [dr, dc] of D) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n && !seen.has(`${nr},${nc}`)) { seen.add(`${nr},${nc}`); from.set(`${nr},${nc}`, `${r},${c}`); heap.push([Math.min(s, dist[nr][nc]), nr, nc]); } } }
      return { kind: "table", title: `Safest path: ${ans}`, rowHead: ["0", "1", "2", "3"], colHead: ["0", "1", "2", "3"], frames };
    },
  },

  "find-all-possible-recipes-from-given-supplies": {
    approach: "Topological sort (Kahn): start from the supplies, and each time an ingredient becomes available, lower the missing count of every recipe that uses it.",
    idea: ["Each recipe waits for len(ingredients) items. Edges go ingredient → recipe.", "Process available items from a queue; when a recipe's missing count hits 0, it is makeable and becomes an available item itself.", "Recipes in a cycle never reach 0, so they are correctly left out."],
    code: `from collections import defaultdict, deque
def findAllRecipes(recipes, ingredients, supplies):
    need = {r: len(ing) for r, ing in zip(recipes, ingredients)}
    users = defaultdict(list)
    for r, ing in zip(recipes, ingredients):
        for x in ing:
            users[x].append(r)
    q, out = deque(supplies), []
    while q:
        x = q.popleft()
        for r in users[x]:
            need[r] -= 1
            if need[r] == 0:
                out.append(r)
                q.append(r)
    return out`,
    lang: "python", time: "O(total ingredients + supplies)", space: "O(same)",
    viz: () => {
      const names = ["yeast", "flour", "meat", "bread", "sandwich", "burger"], nodes = [{ id: 0, label: "yeast", x: 12, y: 15 }, { id: 1, label: "flour", x: 12, y: 50 }, { id: 2, label: "meat", x: 12, y: 85 }, { id: 3, label: "bread", x: 45, y: 30 }, { id: 4, label: "sandw", x: 70, y: 60 }, { id: 5, label: "burger", x: 92, y: 30 }];
      const recipes: Record<string, string[]> = { bread: ["yeast", "flour"], sandwich: ["bread", "meat"], burger: ["sandwich", "meat", "bread"] }, id = (s: string) => names.indexOf(s);
      const edges = Object.entries(recipes).flatMap(([r, ing]) => ing.map((x) => ({ a: id(x), b: id(r), directed: true })));
      const need: Record<string, number> = Object.fromEntries(Object.entries(recipes).map(([r, ing]) => [r, ing.length])), q = ["yeast", "flour", "meat"], out: string[] = [], frames: GraphFrame[] = [], tones: Record<number, Tone> = { 0: "found", 1: "found", 2: "found" }, edgeTones: Record<string, Tone> = {};
      const badges = () => Object.fromEntries(Object.keys(recipes).map((r) => [id(r), need[r] ? `needs ${need[r]}` : "ready"]));
      frames.push({ note: "Supplies are available from the start", tones: { ...tones }, badges: badges() });
      while (q.length) { const x = q.shift()!; const done: string[] = []; for (const [r, ing] of Object.entries(recipes)) if (ing.includes(x)) { need[r]--; edgeTones[`${Math.min(id(x), id(r))}-${Math.max(id(x), id(r))}`] = "found"; if (need[r] === 0) { out.push(r); q.push(r); tones[id(r)] = "found"; done.push(r); } } frames.push({ note: `${x} is available${done.length ? `: ${done.join(", ")} can now be made` : ""}`, tones: { ...tones, [id(x)]: "active" }, edgeTones: { ...edgeTones }, badges: badges() }); }
      return { kind: "graph", title: `Makeable: ${out.join(", ")}`, nodes, edges, frames };
    },
  },

  "all-paths-from-source-to-target": {
    approach: "DFS from node 0 keeping the current path; the graph is acyclic, so no visited set is needed. Record the path whenever you reach n - 1.",
    idea: ["In a DAG a path can never revisit a node, so plain DFS enumerates every path once.", "Append the neighbour, recurse, pop (backtracking).", "There can be exponentially many paths, so the output dominates the cost."],
    code: `def allPathsSourceTarget(graph):
    out, target = [], len(graph) - 1
    def go(u, path):
        if u == target:
            out.append(path[:])
            return
        for v in graph[u]:
            path.append(v)
            go(v, path)
            path.pop()
    go(0, [0])
    return out`,
    lang: "python", time: "O(2ⁿ · n)", space: "O(n)",
    viz: () => {
      const graph = [[4, 3, 1], [3, 2, 4], [3], [4], []], t2 = 4, nodes = [{ id: 0, label: "0", x: 12, y: 50 }, { id: 1, label: "1", x: 40, y: 15 }, { id: 2, label: "2", x: 68, y: 15 }, { id: 3, label: "3", x: 60, y: 85 }, { id: 4, label: "4", x: 92, y: 50 }];
      const edges = graph.flatMap((vs, u) => vs.map((v) => ({ a: u, b: v, directed: true }))), out: number[][] = [], frames: GraphFrame[] = [], path = [0];
      const view = (tone: Tone) => ({ tones: Object.fromEntries(path.map((p) => [p, tone])) as Record<number, Tone>, edgeTones: Object.fromEntries(path.slice(1).map((p, k) => [`${Math.min(p, path[k])}-${Math.max(p, path[k])}`, tone])) as Record<string, Tone> });
      const go = (u: number) => { if (u === t2) { out.push([...path]); frames.push({ note: `reached ${t2}: path ${out.length} = [${path.join(" → ")}]`, ...view("found") }); return; } for (const v of graph[u]) { path.push(v); frames.push({ note: `${u} → ${v}`, ...view("active") }); go(v); path.pop(); } };
      go(0);
      return { kind: "graph", title: `${out.length} paths from 0 to ${t2}`, nodes, edges, frames };
    },
  },
};
