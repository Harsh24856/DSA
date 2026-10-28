// Hand-written solutions for the slugs listed under "batch3" in batches.json. See arrays.ts for the style.
import type { CellsFrame, Diagram, GraphFrame, IntervalsFrame, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { lca, levelTree, range, type TNode } from "../sim.ts";
import type { Solution } from "./types";

type V = (number | null)[];
type Cell = string | number | null;
const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const table = (title: string, rowHead: string[], colHead: string[], frames: TableFrame[]): Diagram => ({ kind: "table", title, rowHead, colHead, frames });
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
const nums = (n: number, from = 0) => Array.from({ length: n }, (_, i) => String(i + from));
const tn = (keys: Iterable<number | string>, t: Tone) => Object.fromEntries([...keys].map((k) => [k, t])) as Record<string, Tone>;
const copy = <T,>(g: T[][]) => g.map((r) => [...r]);
const ek = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
/** Tree helpers over level-order arrays: node id = heap index. */
function T(vals: V) {
  const { nodes, kids } = levelTree(vals);
  return { nodes, kids, val: (i: number) => vals[i] as number };
}

export const BATCH3: Record<string, Solution> = {
  "minimum-genetic-mutation": {
    approach: "BFS from the start gene, where a move changes one letter and must land on a gene in the bank; the first time you reach the end gene is the fewest mutations.",
    idea: ["Each gene is a node; two genes are linked if they differ in exactly one position and the second is in the bank.", "BFS visits genes in order of mutation count, so the first time it pops the end gene, that count is the minimum.", "Try all 8 positions × 4 letters from each gene and keep a seen set."],
    code: `from collections import deque
def minMutation(startGene, endGene, bank):
    bank = set(bank)
    q, seen = deque([(startGene, 0)]), {startGene}
    while q:
        g, d = q.popleft()
        if g == endGene:
            return d
        for i in range(len(g)):
            for ch in "ACGT":
                n = g[:i] + ch + g[i + 1:]
                if n in bank and n not in seen:
                    seen.add(n)
                    q.append((n, d + 1))
    return -1`,
    lang: "python", time: "O(B · L · 4)", space: "O(B)",
    viz: () => {
      const start = "AACCGGTT", end = "AAACGGTA", genes = [start, "AACCGGTA", "AACCGCTA", "AAACGGTA"], steps: (number | null)[] = genes.map((_, i) => (i ? null : 0)), frames: TableFrame[] = [];
      const grid = () => genes.map((g, i) => [...g.split(""), steps[i]] as Cell[]), diff = (a: string, b: string) => [...a].filter((c, i) => c !== b[i]).length;
      frames.push({ note: `Start at ${start} with 0 mutations`, cells: grid(), active: [0, 8] });
      const q = [0];
      while (q.length) {
        const u = q.shift()!;
        if (genes[u] === end) { frames.push({ note: `Popped the end gene ${end} → ${steps[u]} mutations`, cells: grid(), active: [u, 8], tones: tn(nums(8).map((c) => `${u}:${c}`), "found") }); break; }
        for (let v = 1; v < genes.length; v++) if (steps[v] == null && diff(genes[u], genes[v]) === 1) {
          steps[v] = steps[u]! + 1; q.push(v); const at = [...genes[u]].findIndex((c, i) => c !== genes[v][i]);
          frames.push({ note: `${genes[v]} is one letter from ${genes[u]} (position ${at}: ${genes[u][at]} → ${genes[v][at]}) and is in the bank → ${steps[v]} mutation${steps[v] === 1 ? "" : "s"}`, cells: grid(), active: [v, at], deps: [[u, at]] });
        }
      }
      return table(`${start} → ${end}`, ["start", "bank 0", "bank 1", "bank 2"], [...nums(8), "steps"], frames);
    },
  },

  "interval-list-intersections": {
    approach: "Two pointers: the overlap of A[i] and B[j] is [max starts, min ends]; then drop whichever interval ends first.",
    idea: ["Both lists are sorted and disjoint, so only the current pair can overlap.", "If max(starts) ≤ min(ends), that range is an intersection.", "The interval that ends first cannot meet anything later in the other list, so advance its pointer."],
    code: `def intervalIntersection(firstList, secondList):
    A, B = firstList, secondList
    i = j = 0
    out = []
    while i < len(A) and j < len(B):
        lo = max(A[i][0], B[j][0])
        hi = min(A[i][1], B[j][1])
        if lo <= hi:
            out.append([lo, hi])
        if A[i][1] < B[j][1]:
            i += 1
        else:
            j += 1
    return out`,
    lang: "python", time: "O(m + n)", space: "O(1) extra",
    viz: () => {
      const A: [number, number][] = [[0, 2], [5, 10], [13, 23], [24, 25]], B: [number, number][] = [[1, 5], [8, 12], [15, 24], [25, 26]], out: [number, number][] = [], frames: IntervalsFrame[] = [];
      let i = 0, j = 0;
      while (i < A.length && j < B.length) {
        const lo = Math.max(A[i][0], B[j][0]), hi = Math.min(A[i][1], B[j][1]), moveA = A[i][1] < B[j][1];
        if (lo <= hi) out.push([lo, hi]);
        frames.push({ note: `A[${i}] = [${A[i].join(", ")}], B[${j}] = [${B[j].join(", ")}]: ${lo <= hi ? `overlap [${lo}, ${hi}]` : "no overlap"}; ${moveA ? `A[${i}]` : `B[${j}]`} ends first, move past it`, tones: { ...tn(Array.from({ length: i }, (_, k) => k), "done"), ...tn(Array.from({ length: j }, (_, k) => A.length + k), "done"), [i]: "active", [A.length + j]: "active" }, result: [...out] });
        if (moveA) i++; else j++;
      }
      return { kind: "intervals", title: "Top 4 bars are A, bottom 4 are B", items: [...A, ...B], frames };
    },
  },

  "minimum-add-to-make-parentheses-valid": {
    approach: "Count open '(' waiting for a partner; a ')' with none open needs an added '(', and leftover opens each need an added ')'.",
    idea: ["Scan left to right keeping open = number of unmatched '('.", "A ')' closes one if open > 0; otherwise it can only be fixed by inserting a '(' before it.", "At the end every unmatched '(' needs one ')'."],
    code: `def minAddToMakeValid(s):
    open_ = add = 0
    for ch in s:
        if ch == "(":
            open_ += 1
        elif open_:
            open_ -= 1
        else:
            add += 1
    return add + open_`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "())((", frames: StackFrame[] = [], st: string[] = []; let add = 0;
      for (const ch of s) {
        if (ch === "(") { st.push("("); frames.push({ note: "'(' waits for a partner", items: [...st], incoming: ch, side: `added so far ${add}` }); }
        else if (st.length) { st.pop(); frames.push({ note: "')' closes the open '('", items: [...st], incoming: ch, popped: ["("], side: `added so far ${add}` }); }
        else { add++; frames.push({ note: "')' has nothing to close → insert a '(' before it", items: [], incoming: ch, side: `added so far ${add}` }); }
      }
      frames.push({ note: `${st.length} '(' never closed → add ${st.length} ')'. Total ${add + st.length}`, items: [...st], side: `answer ${add + st.length}` });
      return { kind: "stack", title: `"${s}" needs ${add + st.length} additions`, input: s.split(""), frames };
    },
  },

  "the-k-th-lexicographical-string-of-all-happy-strings-of-length-n": {
    approach: "Each position has 2 or 3 allowed letters and each covers 2^(remaining) strings, so divide the rank by that block size to pick each letter directly.",
    idea: ["There are 3 · 2^(n-1) happy strings: 3 choices first, then 2 (anything but the previous letter).", "Use the 0-based rank k - 1. At position i every allowed letter owns a block of 2^(n-1-i) strings in sorted order.", "Pick allowed[rank // block], keep rank % block, and move on."],
    code: `def getHappyString(n, k):
    if k > 3 * 2 ** (n - 1):
        return ""
    k -= 1
    out = []
    for i in range(n):
        block = 2 ** (n - 1 - i)
        opts = [c for c in "abc" if not out or c != out[-1]]
        out.append(opts[k // block])
        k %= block
    return "".join(out)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 3, K = 9, frames: TableFrame[] = [], grid: Cell[][] = Array.from({ length: n }, () => [null, null, null]), out: string[] = []; let k = K - 1;
      frames.push({ note: `${3 * 2 ** (n - 1)} happy strings of length ${n}; string number ${K} has rank ${k} counting from 0`, cells: copy(grid) });
      for (let i = 0; i < n; i++) {
        const block = 2 ** (n - 1 - i), opts = ["a", "b", "c"].filter((c) => c !== out[out.length - 1]), ch = opts[Math.floor(k / block)];
        ["a", "b", "c"].forEach((c, ci) => { const o = opts.indexOf(c); grid[i][ci] = o < 0 ? "×" : block === 1 ? String(o) : `${o * block}-${o * block + block - 1}`; });
        frames.push({ note: `position ${i + 1}: each allowed letter covers ${block} rank${block > 1 ? "s" : ""}; rank ${k} falls in '${ch}' → pick it, rank becomes ${k % block}`, cells: copy(grid), active: [i, "abc".indexOf(ch)] });
        out.push(ch); k %= block;
      }
      frames.push({ note: `Answer "${out.join("")}"`, cells: copy(grid), tones: tn(out.map((c, i) => `${i}:${"abc".indexOf(c)}`), "found") });
      return table(`Happy string n = ${n}, k = ${K}: "${out.join("")}"`, nums(n, 1).map((x) => "pos " + x), ["a", "b", "c"], frames);
    },
  },

  "find-minimum-in-rotated-sorted-array-ii": {
    approach: "Binary search against nums[hi]: bigger mid means the drop is to the right, smaller means mid is in the low part, equal means hi can safely shrink by one.",
    idea: ["If nums[mid] > nums[hi], the minimum is after mid.", "If nums[mid] < nums[hi], mid..hi is sorted, so the minimum is at mid or before.", "If they are equal you cannot tell, but dropping hi keeps a copy of its value at mid, so hi -= 1 is safe. Duplicates make the worst case O(n)."],
    code: `def findMin(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        elif nums[mid] < nums[hi]:
            hi = mid
        else:
            hi -= 1
    return nums[lo]`,
    lang: "python", time: "O(log n), O(n) with many duplicates", space: "O(1)",
    viz: () => {
      const a = [2, 2, 2, 0, 1, 2], frames: CellsFrame[] = []; let lo = 0, hi = a.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1, cmp = a[mid] > a[hi] ? 1 : a[mid] < a[hi] ? -1 : 0;
        frames.push({ note: `nums[mid] = ${a[mid]} ${cmp > 0 ? ">" : cmp < 0 ? "<" : "="} nums[hi] = ${a[hi]} → ${cmp > 0 ? "minimum is right of mid, lo = mid + 1" : cmp < 0 ? "mid..hi is sorted, hi = mid" : "cannot tell, drop hi by one"}`, tones: { ...range(lo, hi), [`0:${mid}`]: "active" }, marks: [{ i: lo, label: "lo" }, { i: mid, label: "mid" }, { i: hi, label: "hi" }] });
        if (cmp > 0) lo = mid + 1; else if (cmp < 0) hi = mid; else hi--;
      }
      frames.push({ note: `lo = hi = ${lo} → minimum ${a[lo]}`, tones: { [`0:${lo}`]: "found" }, marks: [{ i: lo, label: "lo=hi" }] });
      return cells(`Minimum of [${a.join(", ")}]`, [a], frames);
    },
  },

  "maximum-fruits-harvested-after-at-most-k-steps": {
    approach: "Slide a window over the sorted fruit positions; a window [L, R] costs (R - L) plus the shorter trip from start to one end, and shrink it while that exceeds k.",
    idea: ["The best route covers one contiguous range of positions: walk to one end, then turn around to the other.", "Its cost is (R - L) + min(|start - L|, |R - start|), which also works when start is outside [L, R].", "Add fruit at R; while the cost is over k, drop fruit at L. Track the biggest total."],
    code: `def maxTotalFruits(fruits, startPos, k):
    best = total = l = 0
    for pr, ar in fruits:
        total += ar
        while l < len(fruits):
            pl = fruits[l][0]
            if pl > pr or (pr - pl) + min(abs(startPos - pl), abs(pr - startPos)) <= k:
                break
            total -= fruits[l][1]
            l += 1
        best = max(best, total)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const f = [[0, 9], [4, 1], [5, 7], [6, 2], [7, 4], [10, 9]], start = 5, k = 4, frames: CellsFrame[] = []; let l = 0, total = 0, best = 0;
      const rows = [f.map((x) => x[0]), f.map((x) => x[1])], cost = (L: number, R: number) => (R - L) + Math.min(Math.abs(start - L), Math.abs(R - start));
      f.forEach(([pr, ar], r) => {
        total += ar;
        while (l < f.length && f[l][0] <= pr && cost(f[l][0], pr) > k) { total -= f[l][1]; l++; }
        best = Math.max(best, total);
        frames.push({ note: l > r ? `position ${pr} alone is more than ${k} steps from ${start} → window empty` : `add position ${pr}; window ${f[l][0]}..${pr} costs ${cost(f[l][0], pr)} of ${k} steps → ${total} fruit, best ${best}`, tones: { ...range(l, r), ...range(l, r, 1), [`0:${r}`]: l > r ? "bad" : "active" } });
      });
      return cells(`Start at ${start}, k = ${k}: ${best} fruit`, rows, frames, ["position", "fruit"]);
    },
  },

  "count-submatrices-with-all-ones": {
    approach: "Per row, keep the height of 1s ending at each cell; submatrices with bottom-right corner (r, c) number the sum of running minimum heights walking left.",
    idea: ["h[c] = how many consecutive 1s end at this row in column c.", "A submatrix with bottom-right at (r, c) and width w can be as tall as the minimum height over those w columns.", "So walk left from c, keep the running minimum, and add it for each width until it hits 0."],
    code: `def numSubmat(mat):
    n = len(mat[0])
    h = [0] * n
    ans = 0
    for row in mat:
        for j in range(n):
            h[j] = h[j] + 1 if row[j] else 0
        for j in range(n):
            low = h[j]
            for k in range(j, -1, -1):
                low = min(low, h[k])
                if not low:
                    break
                ans += low
    return ans`,
    lang: "python", time: "O(m · n²)", space: "O(n)",
    viz: () => {
      const mat = [[1, 0, 1], [1, 1, 0], [1, 1, 0]], n = 3, h = [0, 0, 0], grid: Cell[][] = mat.map(() => [null, null, null]), frames: TableFrame[] = []; let ans = 0;
      mat.forEach((row, r) => {
        row.forEach((x, j) => { h[j] = x ? h[j] + 1 : 0; grid[r][j] = h[j]; });
        for (let j = 0; j < n; j++) {
          let low = h[j], add = 0; const used: [number, number][] = [], parts: number[] = [];
          for (let k = j; k >= 0; k--) { low = Math.min(low, h[k]); if (!low) break; add += low; parts.push(low); used.push([r, k]); }
          ans += add;
          frames.push({ note: `corner (${r}, ${j}): running minimum heights leftward ${parts.length ? parts.join(" + ") : "none"} = ${add} new (total ${ans})`, cells: copy(grid), active: [r, j], deps: used.slice(1) });
        }
      });
      return table(`Heights of 1s per row: ${ans} all-ones submatrices`, nums(3).map((x) => "row " + x), nums(3), frames);
    },
  },

  "longest-cycle-in-a-graph": {
    approach: "Each node has at most one out-edge, so walk from every unvisited node stamping visit times; meeting a node stamped in this same walk closes a cycle of length now - its stamp.",
    idea: ["Follow edges from a start, giving each new node an increasing time stamp.", "Stop at -1 or at an already stamped node.", "If that node's stamp is from the current walk (≥ the walk's first stamp), the cycle length is current time - that stamp. Each node is walked once overall."],
    code: `def longestCycle(edges):
    stamp = [0] * len(edges)
    t, best = 1, -1
    for s in range(len(edges)):
        if stamp[s]:
            continue
        first, u = t, s
        while u != -1 and not stamp[u]:
            stamp[u] = t
            t += 1
            u = edges[u]
        if u != -1 and stamp[u] >= first:
            best = max(best, t - stamp[u])
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const edges = [3, 3, 4, 2, 3], nodes = [{ id: 0, label: "0", x: 8, y: 20 }, { id: 1, label: "1", x: 8, y: 80 }, { id: 2, label: "2", x: 85, y: 18 }, { id: 3, label: "3", x: 45, y: 50 }, { id: 4, label: "4", x: 85, y: 82 }];
      const stamp = [0, 0, 0, 0, 0], frames: GraphFrame[] = [], tones: Record<number, Tone> = {}; let t = 1, best = -1; const et: Record<string, Tone> = {};
      const badges = () => Object.fromEntries(stamp.map((s, i) => [i, s ? `t${s}` : ""]).filter(([, b]) => b));
      for (let s = 0; s < edges.length; s++) {
        if (stamp[s]) continue;
        const first = t; let u = s;
        while (u !== -1 && !stamp[u]) { stamp[u] = t++; tones[u] = "active"; frames.push({ note: `walk from ${s}: stamp node ${u} with time ${stamp[u]}, follow its edge to ${edges[u]}`, tones: { ...tones }, edgeTones: { ...et }, badges: badges() }); if (edges[u] !== -1) et[ek(u, edges[u])] = "window"; u = edges[u]; }
        const cyc = u !== -1 && stamp[u] >= first;
        if (cyc) { best = Math.max(best, t - stamp[u]); let x = u; do { tones[x] = "found"; et[ek(x, edges[x])] = "found"; x = edges[x]; } while (x !== u); }
        frames.push({ note: u === -1 ? "hit -1: no cycle" : cyc ? `node ${u} was stamped ${stamp[u]} in this walk → cycle of length ${t} - ${stamp[u]} = ${t - stamp[u]}` : `node ${u} was stamped in an earlier walk (${stamp[u]} < ${first}) → nothing new`, tones: { ...tones }, edgeTones: { ...et }, badges: badges() });
        Object.keys(tones).forEach((k) => { if (tones[+k] === "active") tones[+k] = "done"; });
      }
      return { kind: "graph", title: `edges = [${edges.join(", ")}]: longest cycle ${best}`, nodes, edges: edges.map((b, a) => ({ a, b, directed: true })), frames };
    },
  },

  "watering-plants": {
    approach: "Walk the row; when the can holds less than the next plant needs, add the round trip back to the river (2 · i) and refill.",
    idea: ["Reaching plant i from the river side takes one step each.", "If the water left is less than plants[i], walk back i steps and return i steps, then refill.", "Water the plant and take one step forward."],
    code: `def wateringPlants(plants, capacity):
    steps, water = 0, capacity
    for i, p in enumerate(plants):
        if water < p:
            steps += 2 * i
            water = capacity
        water -= p
        steps += 1
    return steps`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const plants = [2, 2, 3, 3], cap = 5, left: (string | number)[] = plants.map(() => ""), frames: CellsFrame[] = []; let steps = 0, water = cap;
      plants.forEach((p, i) => {
        let note = "";
        if (water < p) { note = `${water} left is less than ${p} → walk back to the river and return: +${2 * i} steps, refill to ${cap}. `; steps += 2 * i; water = cap; }
        water -= p; steps += 1; left[i] = water;
        frames.push({ note: `${note}Step to plant ${i} and water it: ${water} left, total steps ${steps}`, rows: [plants, [...left]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found" }, marks: [{ i, label: "you" }] });
      });
      return cells(`Capacity ${cap}: ${steps} steps`, [plants, plants.map(() => "")], frames, ["needs", "water left"]);
    },
  },

  "longest-ideal-subsequence": {
    approach: "dp[c] = longest ideal subsequence ending in letter c; each new letter extends the best dp within k letters of it.",
    idea: ["Only the last letter of a subsequence matters for what can follow it.", "For letter c, look at dp over letters c - k .. c + k and take the max + 1.", "26 states, so each character costs O(k)."],
    code: `def longestIdealString(s, k):
    dp = [0] * 26
    for ch in s:
        c = ord(ch) - 97
        dp[c] = 1 + max(dp[max(0, c - k): c + k + 1])
    return max(dp)`,
    lang: "python", time: "O(n · k)", space: "O(26)",
    viz: () => {
      const s = "acfgbd", k = 2, letters = "abcdefg".split(""), dp = letters.map(() => 0), frames: CellsFrame[] = [];
      for (const ch of s) {
        const c = ch.charCodeAt(0) - 97, lo = Math.max(0, c - k), hi = Math.min(letters.length - 1, c + k), best = Math.max(...dp.slice(lo, hi + 1));
        dp[c] = best + 1;
        frames.push({ note: `'${ch}': best among '${letters[lo]}'..'${letters[hi]}' is ${best} → dp['${ch}'] = ${dp[c]}`, rows: [letters, [...dp]], tones: { ...range(lo, hi, 1), [`1:${c}`]: "active", [`0:${c}`]: "active" } });
      }
      frames.push({ note: `Longest ideal subsequence: ${Math.max(...dp)}`, rows: [letters, [...dp]], tones: { [`1:${dp.indexOf(Math.max(...dp))}`]: "found" } });
      return cells(`"${s}", k = ${k}`, [letters, dp.map(() => 0)], frames, ["letter", "dp"]);
    },
  },

  "minimized-maximum-of-products-distributed-to-any-store": {
    approach: "Binary search the answer x: a product with q items needs ceil(q / x) stores, and x works if the total is at most n.",
    idea: ["A bigger cap x never needs more stores, so feasibility is monotonic.", "For a cap x, stores needed = sum of ceil(q / x).", "Find the smallest x with stores needed ≤ n."],
    code: `def minimizedMaximum(n, quantities):
    lo, hi = 1, max(quantities)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((q + mid - 1) // mid for q in quantities) <= n:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(m log max)", space: "O(1)",
    viz: () => {
      const n = 7, qs = [15, 10, 10], tries: { mid: number; per: number[]; ok: boolean }[] = []; let lo = 1, hi = Math.max(...qs);
      while (lo < hi) { const mid = (lo + hi) >> 1, per = qs.map((q) => Math.ceil(q / mid)), ok = per.reduce((a, b) => a + b, 0) <= n; tries.push({ mid, per, ok }); if (ok) hi = mid; else lo = mid + 1; }
      const frames: TableFrame[] = tries.map((t, r) => ({ note: `cap ${t.mid}: stores ${t.per.join(" + ")} = ${t.per.reduce((a, b) => a + b, 0)} ${t.ok ? `≤ ${n} → works, try smaller` : `> ${n} → too small, go higher`}`, cells: tries.map((x, j) => (j <= r ? [x.mid, ...x.per, x.per.reduce((a, b) => a + b, 0)] : [null, null, null, null, null])), active: [r, 4], tones: { [`${r}:0`]: t.ok ? "found" : "bad" } }));
      frames.push({ note: `Smallest cap that fits in ${n} stores: ${lo}`, cells: frames[frames.length - 1].cells });
      return table(`n = ${n}, quantities [${qs.join(", ")}] → ${lo}`, tries.map((_, i) => `try ${i + 1}`), ["cap", ...qs.map((q) => `q=${q}`), "stores"], frames);
    },
  },

  "basic-calculator-ii": {
    approach: "Keep a stack of terms: + and - push a signed number, * and / combine with the top right away, then sum the stack.",
    idea: ["Remember the operator that came before the current number.", "When the next operator (or the end) arrives: + pushes num, - pushes -num, * and / replace the top with top * num or top / num (truncated toward zero).", "Multiplication binds before addition this way; the answer is the sum of the stack."],
    code: `def calculate(s):
    stack, num, op = [], 0, "+"
    for ch in s + "+":
        if ch.isdigit():
            num = num * 10 + int(ch)
        elif ch in "+-*/":
            if op == "+":
                stack.append(num)
            elif op == "-":
                stack.append(-num)
            elif op == "*":
                stack.append(stack.pop() * num)
            else:
                stack.append(int(stack.pop() / num))
            op, num = ch, 0
    return sum(stack)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "3+2*2-8/4", frames: StackFrame[] = [], st: number[] = []; let num = 0, op = "+";
      [...s + "+"].forEach((ch, idx) => {
        if (/\d/.test(ch)) { num = num * 10 + +ch; return; }
        let note = "", popped: number[] | undefined;
        if (op === "+") { st.push(num); note = `'+' before ${num} → push ${num}`; }
        else if (op === "-") { st.push(-num); note = `'-' before ${num} → push ${-num}`; }
        else { const t = st.pop()!; popped = [t]; const r = op === "*" ? t * num : Math.trunc(t / num); st.push(r); note = `'${op}' before ${num} → pop ${t}, push ${t} ${op} ${num} = ${r}`; }
        frames.push({ note, items: [...st], incoming: String(num), popped, side: `next op ${idx === s.length ? "end" : ch}` });
        op = ch; num = 0;
      });
      const total = st.reduce((a, b) => a + b, 0);
      frames.push({ note: `Sum of the stack: ${st.join(" + ")} = ${total}`, items: [...st], side: `result ${total}` });
      return { kind: "stack", title: `"${s}" = ${total}`, input: s.split(""), frames };
    },
  },

  "partition-array-into-disjoint-intervals": {
    approach: "Track the max of the left part and the max seen so far; any element smaller than the left max forces the cut past it, and the left max becomes the overall max.",
    idea: ["Every element in left must be ≤ every element in right, so left's max matters.", "If nums[i] < leftMax, i must join left, so leftMax jumps to the max of everything up to i.", "The last such i is where left ends; the answer is its length."],
    code: `def partitionDisjoint(nums):
    left_max = cur_max = nums[0]
    cut = 0
    for i in range(1, len(nums)):
        cur_max = max(cur_max, nums[i])
        if nums[i] < left_max:
            cut, left_max = i, cur_max
    return cut + 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [5, 0, 3, 8, 6], frames: CellsFrame[] = []; let leftMax = a[0], cur = a[0], cut = 0;
      frames.push({ note: `left starts as [${a[0]}], left max ${leftMax}`, tones: range(0, 0) });
      for (let i = 1; i < a.length; i++) {
        cur = Math.max(cur, a[i]); const pull = a[i] < leftMax, old = leftMax;
        if (pull) { cut = i; leftMax = cur; }
        frames.push({ note: pull ? `${a[i]} < left max ${old} → it must be in left; left = [0..${i}], left max = ${leftMax}` : `${a[i]} ≥ left max ${leftMax} → can stay on the right`, tones: { ...range(0, cut), [`0:${i}`]: pull ? "bad" : "active" }, marks: [{ i: cut, label: "cut" }] });
      }
      frames.push({ note: `left = [${a.slice(0, cut + 1).join(", ")}], length ${cut + 1}`, tones: { ...range(0, cut, 0, "found") } });
      return cells(`Partition [${a.join(", ")}]`, [a], frames);
    },
  },

  "kth-smallest-number-in-multiplication-table": {
    approach: "Binary search the value x; row i has min(x // i, n) entries ≤ x, so count them and find the smallest x with count ≥ k.",
    idea: ["Row i of the table is i, 2i, ..., ni, so the number of entries ≤ x in it is min(x // i, n).", "That count only grows with x, so binary search for the first x where it reaches k.", "That x is always a real table entry."],
    code: `def findKthNumber(m, n, k):
    lo, hi = 1, m * n
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(min(mid // i, n) for i in range(1, m + 1)) >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(m log(m·n))", space: "O(1)",
    viz: () => {
      const m = 3, n = 3, k = 5, grid = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i + 1) * (j + 1))), frames: TableFrame[] = []; let lo = 1, hi = m * n;
      while (lo < hi) {
        const mid = (lo + hi) >> 1, cnt = grid.reduce((a, _, i) => a + Math.min(Math.floor(mid / (i + 1)), n), 0);
        frames.push({ note: `x = ${mid}: rows have ${grid.map((_, i) => Math.min(Math.floor(mid / (i + 1)), n)).join(" + ")} = ${cnt} entries ≤ ${mid} → ${cnt >= k ? `≥ ${k}, hi = ${mid}` : `< ${k}, lo = ${mid + 1}`}`, cells: grid, tones: tn(grid.flatMap((r, i) => r.map((v, j) => (v <= mid ? `${i}:${j}` : ""))).filter(Boolean), cnt >= k ? "found" : "window") });
        if (cnt >= k) hi = mid; else lo = mid + 1;
      }
      frames.push({ note: `lo = hi = ${lo}: the ${k}th smallest entry`, cells: grid, tones: tn(grid.flatMap((r, i) => r.map((v, j) => (v === lo ? `${i}:${j}` : ""))).filter(Boolean), "found") });
      return table(`${m} × ${n} table, k = ${k} → ${lo}`, nums(m, 1), nums(n, 1), frames);
    },
  },

  "minimum-swaps-to-arrange-a-binary-grid": {
    approach: "Count trailing zeros per row; row i needs at least n - 1 - i of them, so greedily bubble up the nearest row below that has enough.",
    idea: ["The grid is valid when row i has its last n - 1 - i cells zero, which is a trailing-zero count requirement.", "Fill rows top to bottom. For row i take the first row j ≥ i that satisfies it and bubble it up with j - i adjacent swaps.", "Taking the nearest one is optimal since stricter rows come first. If none exists, answer -1."],
    code: `def minSwaps(grid):
    n = len(grid)
    tz = []
    for row in grid:
        z = 0
        while z < n and row[n - 1 - z] == 0:
            z += 1
        tz.append(z)
    swaps = 0
    for i in range(n):
        need = n - 1 - i
        j = i
        while j < n and tz[j] < need:
            j += 1
        if j == n:
            return -1
        tz.insert(i, tz.pop(j))
        swaps += j - i
    return swaps`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      let g = [[0, 0, 1], [1, 1, 0], [1, 0, 0]]; const n = 3, z = (r: number[]) => { let c = 0; while (c < n && r[n - 1 - c] === 0) c++; return c; }, frames: TableFrame[] = []; let swaps = 0;
      const show = () => g.map((r) => [...r, z(r)] as Cell[]);
      frames.push({ note: `Trailing zeros per row: ${g.map(z).join(", ")}`, cells: show() });
      for (let i = 0; i < n; i++) {
        const need = n - 1 - i; let j = i; while (j < n && z(g[j]) < need) j++;
        const row = g[j]; g = [...g.slice(0, i), row, ...g.slice(i, j), ...g.slice(j + 1)]; swaps += j - i;
        frames.push({ note: `row ${i} needs ≥ ${need} trailing zeros; nearest fit is row ${j} → bubble up with ${j - i} swap${j - i === 1 ? "" : "s"} (total ${swaps})`, cells: show(), active: [i, 3], tones: tn(nums(n).map((c) => `${i}:${c}`), "found") });
      }
      return table(`Minimum swaps: ${swaps}`, nums(n).map((x) => "row " + x), [...nums(n), "zeros"], frames);
    },
  },

  "find-two-non-overlapping-sub-arrays-each-with-target-sum": {
    approach: "Sliding window finds every subarray summing to target; best[i] is the shortest one ending at or before i, so a window starting at l pairs with best[l - 1].",
    idea: ["All values are positive, so a window that sums above target only needs its left end moved.", "When the window [l..r] hits target, combine its length with best[l - 1], the shortest valid window that ends before l.", "Then update best[r] = min(best[r - 1], this length)."],
    code: `def minSumOfLengths(arr, target):
    INF = float("inf")
    best = [INF] * len(arr)
    ans, shortest, l, s = INF, INF, 0, 0
    for r, x in enumerate(arr):
        s += x
        while s > target:
            s -= arr[l]
            l += 1
        if s == target:
            if l > 0 and best[l - 1] < INF:
                ans = min(ans, best[l - 1] + r - l + 1)
            shortest = min(shortest, r - l + 1)
        best[r] = shortest
    return -1 if ans == INF else ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 1, 1, 1, 5, 1, 2, 1], target = 3, best: (string | number)[] = a.map(() => ""), frames: CellsFrame[] = []; let ans = Infinity, shortest = Infinity, l = 0, s = 0;
      a.forEach((x, r) => {
        s += x; while (s > target) { s -= a[l]; l++; }
        let note = l > r ? `${x} alone is over ${target} → window empty` : `window [${l}..${r}] sums to ${s}`;
        if (s === target) {
          const prev = l > 0 ? best[l - 1] : "";
          if (typeof prev === "number") { ans = Math.min(ans, prev + r - l + 1); note += ` = target; pair with best[${l - 1}] = ${prev} → ${prev + r - l + 1} (answer ${ans})`; }
          else note += " = target, but nothing valid ends before it";
          shortest = Math.min(shortest, r - l + 1);
        }
        best[r] = shortest === Infinity ? "∞" : shortest;
        frames.push({ note, rows: [a, [...best]], tones: { ...range(l, r, 0, s === target ? "found" : "window"), [`1:${r}`]: "active", ...(s === target && l > 0 ? { [`1:${l - 1}`]: "done" } : {}) } });
      });
      return cells(`Target ${target}: two windows with total length ${ans === Infinity ? -1 : ans}`, [a, a.map(() => "")], frames, ["arr", "best"]);
    },
  },

  "count-unguarded-cells-in-the-grid": {
    approach: "Mark guards and walls, then from each guard sweep in the 4 directions marking cells as guarded until a guard or wall blocks the view.",
    idea: ["Guards and walls block sight, so each sweep stops at the first one.", "Guarded cells do not block, so sweeps pass over them.", "Count the cells left unmarked."],
    code: `def countUnguarded(m, n, guards, walls):
    g = [[0] * n for _ in range(m)]   # 0 free, 1 guarded, 2 guard or wall
    for r, c in guards + walls:
        g[r][c] = 2
    for r, c in guards:
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            y, x = r + dr, c + dc
            while 0 <= y < m and 0 <= x < n and g[y][x] != 2:
                g[y][x] = 1
                y += dr
                x += dc
    return sum(row.count(0) for row in g)`,
    lang: "python", time: "O(m · n + G · (m + n))", space: "O(m · n)",
    viz: () => {
      const m = 4, n = 6, guards = [[0, 0], [1, 1], [2, 3]], walls = [[0, 1], [2, 2], [1, 4]], g: Cell[][] = Array.from({ length: m }, () => Array<Cell>(n).fill(""));
      guards.forEach(([r, c]) => (g[r][c] = "G")); walls.forEach(([r, c]) => (g[r][c] = "W"));
      const frames: TableFrame[] = [{ note: "G = guard, W = wall. Both block sight.", cells: copy(g) }];
      for (const [r, c] of guards) {
        let seen = 0;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let y = r + dr, x = c + dc; while (y >= 0 && y < m && x >= 0 && x < n && g[y][x] !== "G" && g[y][x] !== "W") { if (g[y][x] === "") seen++; g[y][x] = "·"; y += dr; x += dc; } }
        frames.push({ note: `guard at (${r}, ${c}) sweeps 4 directions until blocked: ${seen} new cell${seen === 1 ? "" : "s"} guarded`, cells: copy(g), active: [r, c] });
      }
      const free = g.flat().filter((x) => x === "").length;
      frames.push({ note: `${free} cells are neither guarded nor occupied`, cells: copy(g), tones: tn(g.flatMap((row, r) => row.map((x, c) => (x === "" ? `${r}:${c}` : ""))).filter(Boolean), "found") });
      return table(`${m} × ${n} grid: ${free} unguarded`, nums(m), nums(n), frames);
    },
  },

  "largest-component-size-by-common-factor": {
    approach: "Union each number with each of its prime factors (as separate nodes); numbers sharing a factor meet in the same set, so count set sizes.",
    idea: ["Two numbers are linked when they share a factor > 1, which means they share a prime factor.", "Instead of comparing all pairs, union x with every prime p dividing x (trial division up to √x).", "Count how many numbers share each root; the biggest count is the answer."],
    code: `from collections import Counter
def largestComponentSize(nums):
    parent = {}
    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a, b):
        parent[find(a)] = find(b)
    for x in nums:
        y, p = x, 2
        while p * p <= y:
            if y % p == 0:
                union(x, -p)          # primes stored as negative keys
                while y % p == 0:
                    y //= p
            p += 1
        if y > 1:
            union(x, -y)
    return max(Counter(find(x) for x in nums).values())`,
    lang: "python", time: "O(n √max)", space: "O(n + primes)",
    viz: () => {
      const a = [4, 6, 15, 35], primes = [2, 3, 5, 7], nodes = [...a.map((x, i) => ({ id: i, label: String(x), x: 12 + i * 25, y: 20 })), ...primes.map((p, i) => ({ id: a.length + i, label: `p${p}`, x: 12 + i * 25, y: 82 }))];
      const parent = nodes.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]))), edges: { a: number; b: number }[] = [], et: Record<string, Tone> = {}, frames: GraphFrame[] = [];
      const pal: Tone[] = ["active", "found", "window", "bad", "done", "muted", "active", "found"];
      const tones = () => { const roots = [...new Set(nodes.map((nd) => find(nd.id)))]; return Object.fromEntries(nodes.map((nd) => [nd.id, pal[roots.indexOf(find(nd.id))]])) as Record<number, Tone>; };
      a.forEach((x, i) => {
        const fs = primes.filter((p) => x % p === 0);
        fs.forEach((p) => { const j = a.length + primes.indexOf(p); edges.push({ a: i, b: j }); et[ek(i, j)] = "found"; parent[find(i)] = find(j); });
        frames.push({ note: `${x} has prime factor${fs.length > 1 ? "s" : ""} ${fs.join(", ")} → union ${x} with ${fs.length > 1 ? "each" : "it"}`, tones: tones(), edgeTones: { ...et } });
      });
      const size = Math.max(...a.map((_, i) => a.filter((__, j) => find(j) === find(i)).length));
      frames.push({ note: `All ${size} numbers share one root through their primes → largest component ${size}`, tones: tones(), edgeTones: { ...et } });
      return { kind: "graph", title: `[${a.join(", ")}]: largest component ${size}`, nodes, edges, frames };
    },
  },
  "making-a-large-island": {
    approach: "Label every island with an id and store its size; then each 0 cell joins the distinct islands around it, worth 1 + their sizes.",
    idea: ["Flood fill once, writing an island id (2, 3, ...) into the grid and recording each id's size.", "For every 0, collect the distinct ids among its 4 neighbours (a set, so one island touching twice counts once).", "Answer = max over zeros of 1 + sum of those sizes, or the largest island if there are no zeros."],
    code: `def largestIsland(grid):
    n = len(grid)
    size, label = {}, 2
    for r in range(n):
        for c in range(n):
            if grid[r][c] == 1:
                grid[r][c] = label
                stack, cnt = [(r, c)], 0
                while stack:
                    y, x = stack.pop()
                    cnt += 1
                    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                        if 0 <= ny < n and 0 <= nx < n and grid[ny][nx] == 1:
                            grid[ny][nx] = label
                            stack.append((ny, nx))
                size[label] = cnt
                label += 1
    best = max(size.values(), default=0)
    for r in range(n):
        for c in range(n):
            if grid[r][c] == 0:
                ids = {grid[y][x] for y, x in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1))
                       if 0 <= y < n and 0 <= x < n and grid[y][x] > 1}
                best = max(best, 1 + sum(size[i] for i in ids))
    return best`,
    lang: "python", time: "O(n²)", space: "O(n²)",
    viz: () => {
      const g = [[1, 1, 0], [0, 0, 1], [1, 0, 1]], n = 3, lab: Cell[][] = g.map((r) => r.map((x) => (x ? 1 : 0))), size: Record<string, number> = {}, frames: TableFrame[] = []; let id = 0;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (lab[r][c] === 1) {
        const name = "ABC"[id++], st = [[r, c]]; lab[r][c] = name; let cnt = 0;
        while (st.length) { const [y, x] = st.pop()!; cnt++; for (const [ny, nx] of [[y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1]]) if (lab[ny]?.[nx] === 1) { lab[ny][nx] = name; st.push([ny, nx]); } }
        size[name] = cnt; frames.push({ note: `island ${name} found from (${r}, ${c}), size ${cnt}`, cells: copy(lab), active: [r, c] });
      }
      let best = Math.max(...Object.values(size));
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (lab[r][c] === 0) {
        const near = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([y, x]) => typeof lab[y]?.[x] === "string"), ids = [...new Set(near.map(([y, x]) => lab[y][x] as string))], v = 1 + ids.reduce((a, k) => a + size[k], 0);
        best = Math.max(best, v);
        frames.push({ note: `flip (${r}, ${c}): joins ${ids.length ? ids.join(" + ") : "nothing"} → 1${ids.map((k) => ` + ${size[k]}`).join("")} = ${v} (best ${best})`, cells: copy(lab), active: [r, c], deps: near as [number, number][] });
      }
      return table(`Largest island after one flip: ${best}`, nums(n), nums(n), frames);
    },
  },

  "find-k-th-smallest-pair-distance": {
    approach: "Sort, then binary search the distance d; two pointers count pairs with distance ≤ d in O(n), and the answer is the smallest d with count ≥ k.",
    idea: ["The number of pairs with distance ≤ d grows with d, so binary search d in [0, max - min].", "In sorted order, for each right end r move l until nums[r] - nums[l] ≤ d; then r - l pairs end at r.", "The first d whose count reaches k is the kth smallest distance."],
    code: `def smallestDistancePair(nums, k):
    nums.sort()
    lo, hi = 0, nums[-1] - nums[0]
    while lo < hi:
        mid = (lo + hi) // 2
        cnt = l = 0
        for r in range(len(nums)):
            while nums[r] - nums[l] > mid:
                l += 1
            cnt += r - l
        if cnt >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log n + n log W)", space: "O(1)",
    viz: () => {
      const a = [1, 3, 6, 10, 15], k = 4, frames: CellsFrame[] = []; let lo = 0, hi = a[a.length - 1] - a[0];
      while (lo < hi) {
        const mid = (lo + hi) >> 1, per: number[] = []; let l = 0;
        a.forEach((x, r) => { while (x - a[l] > mid) l++; per.push(r - l); });
        const cnt = per.reduce((s, x) => s + x, 0);
        frames.push({ note: `d = ${mid}: pairs ending at each index ${per.join(" + ")} = ${cnt} → ${cnt >= k ? `≥ ${k}, hi = ${mid}` : `< ${k}, lo = ${mid + 1}`}`, rows: [a, per], tones: tn(per.map((p, i) => (p ? `1:${i}` : "")).filter(Boolean), cnt >= k ? "found" : "window") });
        if (cnt >= k) hi = mid; else lo = mid + 1;
      }
      frames.push({ note: `lo = hi = ${lo}: the ${k}th smallest pair distance`, rows: [a, a.map(() => "")] });
      return cells(`[${a.join(", ")}], k = ${k} → ${lo}`, [a, a.map(() => "")], frames, ["sorted", "pairs ≤ d"]);
    },
  },

  "patching-array": {
    approach: "Keep miss = smallest sum not yet buildable; use nums[i] if it is ≤ miss (miss += nums[i]), otherwise patch in miss itself, which doubles the reach.",
    idea: ["If every sum in [1, miss) can be made, adding a number x ≤ miss extends that to [1, miss + x).", "If the next number is bigger than miss, nothing can make miss, so we must add a number; adding miss itself reaches furthest.", "Stop once miss > n."],
    code: `def minPatches(nums, n):
    miss, i, patches = 1, 0, 0
    while miss <= n:
        if i < len(nums) and nums[i] <= miss:
            miss += nums[i]
            i += 1
        else:
            miss += miss
            patches += 1
    return patches`,
    lang: "python", time: "O(m + log n)", space: "O(1)",
    viz: () => {
      const a = [1, 5, 10], n = 20, frames: CellsFrame[] = []; let miss = 1, i = 0, patches = 0;
      while (miss <= n) {
        if (i < a.length && a[i] <= miss) { frames.push({ note: `${a[i]} ≤ miss ${miss} → every sum below ${miss + a[i]} is now possible`, tones: { [`0:${i}`]: "found" }, marks: [{ i, label: "i" }] }); miss += a[i]; i++; }
        else { frames.push({ note: `${i < a.length ? `${a[i]} > miss ${miss}` : "no numbers left"} → patch in ${miss}; reach becomes ${2 * miss - 1} (patches ${patches + 1})`, tones: i < a.length ? { [`0:${i}`]: "bad" } : {}, marks: i < a.length ? [{ i, label: "i" }] : [] }); miss *= 2; patches++; }
      }
      frames.push({ note: `miss = ${miss} > ${n}: all of 1..${n} covered with ${patches} patches`, tones: tn(a.map((_, k) => `0:${k}`), "done") });
      return cells(`nums = [${a.join(", ")}], n = ${n}: ${patches} patches`, [a], frames);
    },
  },

  "pseudo-palindromic-paths-in-a-binary-tree": {
    approach: "DFS carrying a 10-bit parity mask of digits on the path; a leaf's path can be a palindrome when at most one bit is set.",
    idea: ["A sequence can be rearranged into a palindrome iff at most one digit appears an odd number of times.", "Flip bit d of the mask for every digit d on the way down.", "At a leaf, mask & (mask - 1) == 0 means zero or one odd digit."],
    code: `def pseudoPalindromicPaths(root):
    def dfs(node, mask):
        if not node:
            return 0
        mask ^= 1 << node.val
        if not node.left and not node.right:
            return 1 if mask & (mask - 1) == 0 else 0
        return dfs(node.left, mask) + dfs(node.right, mask)
    return dfs(root, 0)`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [2, 3, 1, 3, 1, null, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], path: number[] = []; let count = 0;
      const odd = (m: number) => [...Array(10).keys()].filter((d) => m >> d & 1);
      const dfs = (i: number | null, mask: number) => {
        if (i == null) return; mask ^= 1 << val(i); path.push(i);
        const leaf = kids[i][0] == null && kids[i][1] == null, ok = leaf && (mask & (mask - 1)) === 0; if (ok) count++;
        frames.push({ note: `${val(i)}: odd digits {${odd(mask).join(", ")}}${leaf ? (ok ? ` → leaf, at most one odd → palindrome possible (count ${count})` : " → leaf, too many odd digits") : ""}`, tones: tn(path, leaf ? (ok ? "found" : "bad") : "active"), badges: { [i]: `{${odd(mask).join(",")}}` } });
        dfs(kids[i][0], mask); dfs(kids[i][1], mask); path.pop();
      };
      dfs(0, 0);
      return tree(`Pseudo-palindromic paths: ${count}`, nodes, frames);
    },
  },

  "design-circular-deque": {
    approach: "A fixed array with a head index and a size; front moves head back by one (mod k), the rear slot is (head + size) mod k.",
    idea: ["Store k slots, head = index of the front, size = how many are used.", "insertFront: head = (head - 1) % k and write there. insertLast: write at (head + size) % k.", "Deletes only move head or shrink size, so every operation is O(1)."],
    code: `class MyCircularDeque:
    def __init__(self, k):
        self.a, self.k, self.head, self.size = [0] * k, k, 0, 0

    def insertFront(self, value):
        if self.size == self.k:
            return False
        self.head = (self.head - 1) % self.k
        self.a[self.head] = value
        self.size += 1
        return True

    def insertLast(self, value):
        if self.size == self.k:
            return False
        self.a[(self.head + self.size) % self.k] = value
        self.size += 1
        return True

    def deleteFront(self):
        if not self.size:
            return False
        self.head = (self.head + 1) % self.k
        self.size -= 1
        return True

    def deleteLast(self):
        if not self.size:
            return False
        self.size -= 1
        return True

    def getFront(self):
        return self.a[self.head] if self.size else -1

    def getRear(self):
        return self.a[(self.head + self.size - 1) % self.k] if self.size else -1

    def isEmpty(self):
        return self.size == 0

    def isFull(self):
        return self.size == self.k`,
    lang: "python", time: "O(1) per operation", space: "O(k)",
    viz: () => {
      const k = 3, a: (string | number)[] = ["", "", ""], frames: CellsFrame[] = []; let head = 0, size = 0;
      const snap = (note: string) => { const used = Array.from({ length: size }, (_, j) => `0:${(head + j) % k}`); frames.push({ note, rows: [[...a]], tones: tn(used, "window"), marks: size ? [{ i: head, label: "front" }, { i: (head + size - 1) % k, label: "rear" }] : [] }); };
      const ops: [string, number?][] = [["insertLast", 1], ["insertLast", 2], ["insertFront", 3], ["insertFront", 4], ["deleteLast"], ["insertFront", 4]];
      for (const [op, v] of ops) {
        if (op.startsWith("insert") && size === k) { snap(`${op}(${v}): full → false`); continue; }
        if (op === "insertLast") { a[(head + size) % k] = v!; size++; }
        else if (op === "insertFront") { head = (head - 1 + k) % k; a[head] = v!; size++; }
        else { a[(head + size - 1) % k] = ""; size--; }
        snap(`${op}${v != null ? `(${v})` : "()"}: head = ${head}, size = ${size}`);
      }
      return cells("MyCircularDeque(3)", [["", "", ""]], frames);
    },
  },

  "minimum-score-after-removals-on-a-tree": {
    approach: "Precompute every subtree XOR and entry/exit times; removing the edges above nodes i and j gives three parts whose XORs follow from whether one is an ancestor of the other.",
    idea: ["Cutting the edge above node i separates subtree(i), whose XOR is xr[i].", "For two cuts i, j: if i is an ancestor of j the parts are xr[j], xr[i] ^ xr[j], total ^ xr[i]; otherwise xr[i], xr[j], total ^ xr[i] ^ xr[j].", "Euler tour times answer 'is i an ancestor of j' in O(1), so all pairs take O(n²)."],
    code: `import sys
def minimumScore(nums, edges):
    sys.setrecursionlimit(10000)
    n = len(nums)
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    xr, tin, tout, t = nums[:], [0] * n, [0] * n, 0
    def dfs(u, p):
        nonlocal t
        tin[u] = t
        t += 1
        for v in adj[u]:
            if v != p:
                dfs(v, u)
                xr[u] ^= xr[v]
        tout[u] = t
    dfs(0, -1)
    anc = lambda a, b: tin[a] <= tin[b] < tout[a]
    total, best = xr[0], float("inf")
    for i in range(1, n):
        for j in range(i + 1, n):
            if anc(i, j):
                parts = (xr[j], xr[i] ^ xr[j], total ^ xr[i])
            elif anc(j, i):
                parts = (xr[i], xr[j] ^ xr[i], total ^ xr[j])
            else:
                parts = (xr[i], xr[j], total ^ xr[i] ^ xr[j])
            best = min(best, max(parts) - min(parts))
    return best`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const val = [1, 5, 5, 4, 11], par = [-1, 0, 1, 1, 3], nodes = [{ id: 0, label: "1", x: 8, y: 50 }, { id: 1, label: "5", x: 35, y: 50 }, { id: 2, label: "5", x: 62, y: 18 }, { id: 3, label: "4", x: 62, y: 82 }, { id: 4, label: "11", x: 90, y: 82 }];
      const xr = [...val]; for (let u = 4; u > 0; u--) xr[par[u]] ^= xr[u];
      const anc = (a: number, b: number) => { for (let x = b; x !== -1; x = par[x]) if (x === a) return true; return false; }, total = xr[0], frames: GraphFrame[] = []; let best = Infinity;
      frames.push({ note: `Subtree XORs (badges). Total XOR = ${total}`, badges: Object.fromEntries(xr.map((x, i) => [i, "x" + x])) });
      for (let i = 1; i < 5; i++) for (let j = i + 1; j < 5; j++) {
        const parts = anc(i, j) ? [xr[j], xr[i] ^ xr[j], total ^ xr[i]] : anc(j, i) ? [xr[i], xr[j] ^ xr[i], total ^ xr[j]] : [xr[i], xr[j], total ^ xr[i] ^ xr[j]], sc = Math.max(...parts) - Math.min(...parts);
        best = Math.min(best, sc);
        frames.push({ note: `cut above ${i} and above ${j}${anc(i, j) || anc(j, i) ? " (nested)" : ""}: parts XOR ${parts.join(", ")} → score ${sc} (best ${best})`, edgeTones: { [ek(par[i], i)]: "bad", [ek(par[j], j)]: "bad" }, tones: { [i]: "active", [j]: "found" }, badges: Object.fromEntries(xr.map((x, k) => [k, "x" + x])) });
      }
      return { kind: "graph", title: `Minimum score ${best}`, nodes, edges: par.slice(1).map((p, k) => ({ a: p, b: k + 1 })), frames };
    },
  },

  "sum-of-distances-in-tree": {
    approach: "One pass computes subtree sizes and the answer for the root; moving the root to child v changes the total by (n - count[v]) - count[v].",
    idea: ["Post-order: count[u] = subtree size, sub[u] = sum of distances from u into its subtree; ans[0] = sub[0].", "Moving from parent p to child v brings count[v] nodes one step closer and the other n - count[v] one step further.", "So ans[v] = ans[p] - count[v] + (n - count[v]), filled top-down."],
    code: `def sumOfDistancesInTree(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    order, parent = [0], [-1] * n
    for u in order:
        for v in adj[u]:
            if v != parent[u]:
                parent[v] = u
                order.append(v)
    count, sub = [1] * n, [0] * n
    for u in reversed(order):
        p = parent[u]
        if p >= 0:
            count[p] += count[u]
            sub[p] += sub[u] + count[u]
    ans = [0] * n
    ans[0] = sub[0]
    for u in order[1:]:
        ans[u] = ans[parent[u]] - count[u] + (n - count[u])
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const n = 6, par = [-1, 0, 0, 2, 2, 2], order = [0, 1, 2, 3, 4, 5], nodes = [{ id: 0, label: "0", x: 30, y: 15 }, { id: 1, label: "1", x: 10, y: 75 }, { id: 2, label: "2", x: 50, y: 50 }, { id: 3, label: "3", x: 30, y: 88 }, { id: 4, label: "4", x: 60, y: 88 }, { id: 5, label: "5", x: 88, y: 88 }];
      const count = Array(n).fill(1), sub = Array(n).fill(0), ans = Array(n).fill(0), frames: GraphFrame[] = [];
      for (const u of [...order].reverse()) { const p = par[u]; if (p >= 0) { count[p] += count[u]; sub[p] += sub[u] + count[u]; } }
      frames.push({ note: `Post-order: subtree sizes ${count.join(", ")}; distance sum from 0 = ${sub[0]}`, tones: { 0: "found" }, badges: Object.fromEntries(count.map((c, i) => [i, "size " + c])) });
      ans[0] = sub[0]; const done: number[] = [0];
      for (const u of order.slice(1)) { ans[u] = ans[par[u]] - count[u] + (n - count[u]); done.push(u); frames.push({ note: `move root ${par[u]} → ${u}: ${count[u]} nodes get closer, ${n - count[u]} get further → ${ans[par[u]]} - ${count[u]} + ${n - count[u]} = ${ans[u]}`, tones: { ...tn(done, "done"), [u]: "active" }, edgeTones: { [ek(par[u], u)]: "found" }, badges: Object.fromEntries(done.map((i) => [i, "Σ" + ans[i]])) }); }
      return { kind: "graph", title: `Answer [${ans.join(", ")}]`, nodes, edges: par.slice(1).map((p, k) => ({ a: p, b: k + 1 })), frames };
    },
  },

  "determine-if-two-strings-are-close": {
    approach: "Swaps allow any order and letter-swaps allow any relabelling of counts, so the two words need the same set of letters and the same multiset of counts.",
    idea: ["Operation 1 (swap positions) means only letter counts matter.", "Operation 2 (swap two letters everywhere) lets counts move between letters that already exist, but never adds a new letter.", "So compare the letter sets and the sorted count lists."],
    code: `from collections import Counter
def closeStrings(word1, word2):
    a, b = Counter(word1), Counter(word2)
    return a.keys() == b.keys() and sorted(a.values()) == sorted(b.values())`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const w1 = "cabbba", w2 = "abbccc", L = ["a", "b", "c"], c1 = L.map((c) => [...w1].filter((x) => x === c).length), c2 = L.map((c) => [...w2].filter((x) => x === c).length), s1 = [...c1].sort(), s2 = [...c2].sort(), e: Cell[] = [null, null, null];
      const frames: TableFrame[] = [
        { note: `Count letters: "${w1}" and "${w2}"`, cells: [c1, c2, e, e] },
        { note: "Same letters on both sides (a, b, c), so relabelling is allowed", cells: [c1, c2, e, e], tones: tn(["0:0", "0:1", "0:2", "1:0", "1:1", "1:2"], "window") },
        { note: `Sorted counts [${s1.join(", ")}] and [${s2.join(", ")}] match → close`, cells: [c1, c2, s1, s2], tones: tn(["2:0", "2:1", "2:2", "3:0", "3:1", "3:2"], "found") },
      ];
      return table(`"${w1}" and "${w2}" are close`, ["word1", "word2", "sorted 1", "sorted 2"], L, frames);
    },
  },

  "k-th-smallest-prime-fraction": {
    approach: "Min-heap of fractions arr[0]/arr[j] for each denominator; pop k - 1 times, each time pushing the next numerator for that denominator.",
    idea: ["For a fixed denominator arr[j], fractions grow with the numerator, so each column is a sorted list.", "Merging n sorted lists with a heap pops fractions in increasing order.", "After k - 1 pops, the heap top is the kth smallest."],
    code: `import heapq
def kthSmallestPrimeFraction(arr, k):
    heap = [(arr[0] / arr[j], 0, j) for j in range(1, len(arr))]
    heapq.heapify(heap)
    for _ in range(k - 1):
        _, i, j = heapq.heappop(heap)
        if i + 1 < j:
            heapq.heappush(heap, (arr[i + 1] / arr[j], i + 1, j))
    _, i, j = heap[0]
    return [arr[i], arr[j]]`,
    lang: "python", time: "O(k log n)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 3, 5], k = 3, grid: Cell[][] = a.map((x, i) => a.map((y, j) => (i < j ? `${x}/${y}` : null))), heap: [number, number, number][] = [], frames: TableFrame[] = [], popped: string[] = [];
      for (let j = 1; j < a.length; j++) heap.push([a[0] / a[j], 0, j]);
      const tones = () => ({ ...tn(popped, "done"), ...tn(heap.map(([, i, j]) => `${i}:${j}`), "window") });
      frames.push({ note: "Heap starts with 1/2, 1/3, 1/5 (smallest numerator per denominator)", cells: grid, tones: tones() });
      for (let t = 0; t < k - 1; t++) {
        heap.sort((x, y) => x[0] - y[0]); const [, i, j] = heap.shift()!; popped.push(`${i}:${j}`); if (i + 1 < j) heap.push([a[i + 1] / a[j], i + 1, j]);
        frames.push({ note: `pop ${a[i]}/${a[j]} (smallest number ${t + 1})${i + 1 < j ? `, push ${a[i + 1]}/${a[j]}` : ""}`, cells: grid, active: [i, j], tones: tones() });
      }
      heap.sort((x, y) => x[0] - y[0]); const [, i, j] = heap[0];
      frames.push({ note: `heap top ${a[i]}/${a[j]} is number ${k}`, cells: grid, tones: { ...tones(), [`${i}:${j}`]: "found" } });
      return table(`k = ${k} → [${a[i]}, ${a[j]}]`, a.map((x) => `num ${x}`), a.map((x) => `/${x}`), frames);
    },
  },

  "minimum-cost-to-make-array-equal": {
    approach: "The cost is minimised at the weighted median: sort by value and pick the first value where the running cost weight reaches half the total.",
    idea: ["Total cost is a sum of |x - t| · cost, which is convex in t.", "Moving t right by one adds the weight of everything at or left of t and removes the weight to the right, so the best t balances the weights: the weighted median.", "Sort pairs, walk until cumulative weight ≥ half, and evaluate the cost there."],
    code: `def minCost(nums, cost):
    pairs = sorted(zip(nums, cost))
    half, acc = (sum(cost) + 1) // 2, 0
    for x, c in pairs:
        acc += c
        if acc >= half:
            target = x
            break
    return sum(abs(x - target) * c for x, c in zip(nums, cost))`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const p = [[1, 2], [2, 14], [3, 3], [5, 1]], total = 20, half = 10, frames: CellsFrame[] = [], acc: (string | number)[] = ["", "", "", ""]; let s = 0, t = -1;
      for (let i = 0; i < p.length; i++) { s += p[i][1]; acc[i] = s; const hit = s >= half; frames.push({ note: `value ${p[i][0]}: cumulative weight ${s}${hit ? ` ≥ ${half} (half of ${total}) → weighted median ${p[i][0]}` : ` < ${half}`}`, rows: [p.map((x) => x[0]), p.map((x) => x[1]), [...acc]], tones: { [`2:${i}`]: hit ? "found" : "active" } }); if (hit) { t = p[i][0]; break; } }
      const cost = p.reduce((a, [x, c]) => a + Math.abs(x - t) * c, 0);
      frames.push({ note: `Move everything to ${t}: ${p.map(([x, c]) => `${Math.abs(x - t)}·${c}`).join(" + ")} = ${cost}`, rows: [p.map((x) => x[0]), p.map((x) => x[1]), [...acc]], tones: { [`0:${p.findIndex((x) => x[0] === t)}`]: "found" } });
      return cells(`Minimum cost ${cost}`, [p.map((x) => x[0]), p.map((x) => x[1]), acc], frames, ["value", "cost", "running"]);
    },
  },

  "insert-delete-getrandom-o1-duplicates-allowed": {
    approach: "A list of values for random picks plus a map value → set of its indices; remove by moving the last element into the freed slot.",
    idea: ["getRandom is random.choice on the list, which is uniform over copies, as required.", "insert appends and records the index in pos[val].", "remove takes any index i of val, writes the last value there, fixes that value's index set, and pops the end: O(1)."],
    code: `import random
from collections import defaultdict
class RandomizedCollection:
    def __init__(self):
        self.vals, self.pos = [], defaultdict(set)

    def insert(self, val):
        self.pos[val].add(len(self.vals))
        self.vals.append(val)
        return len(self.pos[val]) == 1

    def remove(self, val):
        if not self.pos[val]:
            return False
        i, last = self.pos[val].pop(), self.vals[-1]
        self.vals[i] = last
        self.pos[last].add(i)
        self.pos[last].discard(len(self.vals) - 1)
        self.vals.pop()
        return True

    def getRandom(self):
        return random.choice(self.vals)`,
    lang: "python", time: "O(1) average per operation", space: "O(n)",
    viz: () => {
      const vals: number[] = [], frames: CellsFrame[] = [], pos = new Map<number, Set<number>>();
      const show = (note: string, t: Record<string, Tone> = {}) => frames.push({ note: `${note}. pos: ${[...pos].filter(([, s]) => s.size).map(([v, s]) => `${v}→{${[...s].sort().join(",")}}`).join(" ")}`, rows: [vals.length ? [...vals] : [""]], tones: t });
      for (const v of [1, 1, 2, 3]) { if (!pos.has(v)) pos.set(v, new Set()); pos.get(v)!.add(vals.length); vals.push(v); show(`insert ${v} at index ${vals.length - 1}${pos.get(v)!.size > 1 ? " (already present → false)" : " → true"}`, { [`0:${vals.length - 1}`]: "active" }); }
      const i = Math.min(...pos.get(1)!), last = vals[vals.length - 1]; pos.get(1)!.delete(i); vals[i] = last; pos.get(last)!.add(i); pos.get(last)!.delete(vals.length - 1); vals.pop();
      show(`remove 1: free index ${i}, move last value ${last} into it, pop the end`, { [`0:${i}`]: "found" });
      return cells("RandomizedCollection: list + index sets", [[""]], frames);
    },
  },

  "find-original-array-from-doubled-array": {
    approach: "Process values from smallest up: the smallest unused x must be an original, so it consumes one copy of 2x; fail if 2x is missing.",
    idea: ["The smallest remaining value cannot be anyone's double, so it is in the original.", "Take one x and one 2x from the counts (0 needs two zeros).", "If a 2x is missing, the array is not doubled."],
    code: `from collections import Counter
def findOriginalArray(changed):
    if len(changed) % 2:
        return []
    cnt, out = Counter(changed), []
    for x in sorted(changed):
        if cnt[x] == 0:
            continue
        if cnt[2 * x] == 0 or (x == 0 and cnt[0] < 2):
            return []
        cnt[x] -= 1
        cnt[2 * x] -= 1
        out.append(x)
    return out`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 3, 4, 6, 8], used = new Set<number>(), frames: CellsFrame[] = [], out: number[] = [];
      a.forEach((x, i) => {
        if (used.has(i)) { frames.push({ note: `${x} was already used as a double`, tones: tn([...used].map((u) => `0:${u}`), "done"), marks: [{ i, label: "x" }] }); return; }
        const j = a.findIndex((y, k) => y === 2 * x && !used.has(k) && k !== i); used.add(i); used.add(j); out.push(x);
        frames.push({ note: `${x} is the smallest unused → original; pair it with ${2 * x}. original = [${out.join(", ")}]`, tones: { ...tn([...used].map((u) => `0:${u}`), "done"), [`0:${i}`]: "found", [`0:${j}`]: "active" }, marks: [{ i, label: "x" }, { i: j, label: "2x" }] });
      });
      return cells(`Original [${out.join(", ")}]`, [a], frames);
    },
  },

  "design-a-food-rating-system": {
    approach: "One max-heap per cuisine of (-rating, name) plus the current rating per food; a rating change pushes a new entry and stale tops are popped lazily.",
    idea: ["Heap order (-rating, name) gives highest rating, then smallest name.", "changeRating pushes the new pair without searching the heap.", "highestRated pops tops whose rating no longer matches the food's current rating."],
    code: `import heapq
class FoodRatings:
    def __init__(self, foods, cuisines, ratings):
        self.info, self.heaps = {}, {}
        for f, c, r in zip(foods, cuisines, ratings):
            self.info[f] = [c, r]
            heapq.heappush(self.heaps.setdefault(c, []), (-r, f))

    def changeRating(self, food, newRating):
        c = self.info[food][0]
        self.info[food][1] = newRating
        heapq.heappush(self.heaps[c], (-newRating, food))

    def highestRated(self, cuisine):
        h = self.heaps[cuisine]
        while -h[0][0] != self.info[h[0][1]][1]:
            heapq.heappop(h)
        return h[0][1]`,
    lang: "python", time: "O(log n) per call (amortised)", space: "O(n + changes)",
    viz: () => {
      const cur: Record<string, number> = { miso: 12, sushi: 8, ramen: 14 }; let heap: [number, string][] = Object.entries(cur).map(([f, r]) => [r, f]);
      const frames: StackFrame[] = [], order = () => [...heap].sort((x, y) => x[0] - y[0] || (x[1] < y[1] ? 1 : -1)), items = () => order().map(([r, f]) => `${f} ${r}${cur[f] !== r ? " (old)" : ""}`);
      const top = () => { const popped: string[] = []; for (;;) { const [r, f] = order()[heap.length - 1]; if (cur[f] === r) return { f, popped }; popped.push(`${f} ${r}`); heap = heap.filter((e) => !(e[0] === r && e[1] === f)); } };
      frames.push({ note: "japanese heap: highest rating on top", items: items() });
      let t = top(); frames.push({ note: `highestRated → ${t.f}`, items: items(), side: t.f });
      cur.sushi = 16; heap.push([16, "sushi"]); frames.push({ note: "changeRating(sushi, 16): push a new entry, the old one stays", items: items(), incoming: "sushi 16" });
      t = top(); frames.push({ note: `highestRated → ${t.f}`, items: items(), side: t.f });
      cur.ramen = 16; heap.push([16, "ramen"]); frames.push({ note: "changeRating(ramen, 16): tie at 16, smaller name wins", items: items(), incoming: "ramen 16" });
      t = top(); frames.push({ note: `highestRated → ${t.f}`, items: items(), side: t.f });
      cur.sushi = 7; heap.push([7, "sushi"]); frames.push({ note: "changeRating(sushi, 7)", items: items(), incoming: "sushi 7" });
      cur.ramen = 5; heap.push([5, "ramen"]);
      t = top(); frames.push({ note: `changeRating(ramen, 5); highestRated pops stale tops ${t.popped.join(", ")} → ${t.f}`, items: items(), popped: t.popped, side: t.f });
      return { kind: "stack", title: "FoodRatings, japanese cuisine", frames };
    },
  },

  "move-pieces-to-obtain-a-string": {
    approach: "Match pieces in order ignoring blanks: they must be the same letters, each L may only move left (i ≥ j) and each R only right (i ≤ j).",
    idea: ["Pieces cannot pass each other, so the k-th piece of start must become the k-th piece of target.", "Same letter required; an L at i can reach j only if j ≤ i, an R only if j ≥ i.", "Skip '_' with two pointers and check each pair."],
    code: `def canChange(start, target):
    n, i, j = len(start), 0, 0
    while True:
        while i < n and start[i] == "_":
            i += 1
        while j < n and target[j] == "_":
            j += 1
        if i == n or j == n:
            return i == n and j == n
        if start[i] != target[j]:
            return False
        if start[i] == "L" and i < j:
            return False
        if start[i] == "R" and i > j:
            return False
        i += 1
        j += 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "_L__R__R_", t = "L______RR", frames: CellsFrame[] = []; let i = 0, j = 0; const n = s.length;
      for (;;) {
        while (i < n && s[i] === "_") i++; while (j < n && t[j] === "_") j++;
        if (i === n || j === n) { frames.push({ note: "both strings out of pieces at the same time → true", tones: {} }); break; }
        const ok = s[i] === t[j] && !(s[i] === "L" && i < j) && !(s[i] === "R" && i > j);
        frames.push({ note: `${s[i]} at ${i} ↔ ${t[j]} at ${j}: ${s[i] === "L" ? "L moves left" : "R moves right"} ${j - i === 0 ? "0" : Math.abs(j - i)} → ${ok ? "ok" : "impossible"}`, tones: { [`0:${i}`]: ok ? "found" : "bad", [`1:${j}`]: ok ? "found" : "bad" }, marks: [{ i, label: "i" }, { i: j, label: "j", row: 1 }] });
        if (!ok) break; i++; j++;
      }
      return cells(`"${s}" → "${t}"`, [s.split(""), t.split("")], frames, ["start", "target"]);
    },
  },

  "bus-routes": {
    approach: "BFS where taking a bus is one step: from a stop, board every unused bus there and reach all its stops at distance + 1.",
    idea: ["Map each stop to the buses that serve it.", "BFS over stops, but mark buses as used so each route is expanded once.", "The first time the target appears, the number of buses taken is minimal."],
    code: `from collections import defaultdict, deque
def numBusesToDestination(routes, source, target):
    if source == target:
        return 0
    buses = defaultdict(list)
    for b, r in enumerate(routes):
        for s in r:
            buses[s].append(b)
    q, used, seen = deque([(source, 0)]), set(), {source}
    while q:
        s, d = q.popleft()
        for b in buses[s]:
            if b in used:
                continue
            used.add(b)
            for t in routes[b]:
                if t == target:
                    return d + 1
                if t not in seen:
                    seen.add(t)
                    q.append((t, d + 1))
    return -1`,
    lang: "python", time: "O(total stops)", space: "O(total stops)",
    viz: () => {
      const routes = [[1, 2, 7], [3, 6, 7]], stops = [1, 2, 7, 3, 6], nodes = [{ id: 0, label: "1", x: 10, y: 30 }, { id: 1, label: "2", x: 30, y: 85 }, { id: 2, label: "7", x: 50, y: 30 }, { id: 3, label: "3", x: 70, y: 85 }, { id: 4, label: "6", x: 90, y: 30 }], id = (s: number) => stops.indexOf(s);
      const edges = routes.flatMap((r) => r.slice(1).map((s, k) => ({ a: id(r[k]), b: id(s) }))), routeOf = (b: number) => Object.fromEntries(routes[b].slice(1).map((s, k) => [ek(id(routes[b][k]), id(s)), "found" as Tone]));
      const frames: GraphFrame[] = [{ note: "Start at stop 1 with 0 buses", tones: { 0: "active" }, badges: { 0: "0" } }];
      frames.push({ note: "Stop 1 is on bus 0 → board it, reach 2 and 7 with 1 bus", tones: { 0: "done", 1: "window", 2: "window" }, edgeTones: routeOf(0), badges: { 0: "0", 1: "1", 2: "1" } });
      frames.push({ note: "Stop 2: its only bus is used. Stop 7: board bus 1 → reach 3 and the target 6 with 2 buses", tones: { 0: "done", 1: "done", 2: "active", 3: "window", 4: "found" }, edgeTones: { ...routeOf(0), ...routeOf(1) }, badges: { 0: "0", 1: "1", 2: "1", 3: "2", 4: "2" } });
      return { kind: "graph", title: "Routes [1, 2, 7] and [3, 6, 7]: 1 → 6 takes 2 buses", nodes, edges, frames };
    },
  },

  "course-schedule-iii": {
    approach: "Take courses by deadline; if the running time passes the deadline, drop the longest course taken so far (max-heap).",
    idea: ["Doing courses in deadline order is always fine for any chosen set.", "Add each course; if time now exceeds its deadline, removing the longest course frees the most time and keeps the count.", "The heap size at the end is the answer."],
    code: `import heapq
def scheduleCourse(courses):
    t, heap = 0, []
    for d, last in sorted(courses, key=lambda c: c[1]):
        t += d
        heapq.heappush(heap, -d)
        if t > last:
            t += heapq.heappop(heap)    # removes the longest
    return len(heap)`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const cs = [[100, 200], [1000, 1250], [200, 1300], [2000, 3200]], heap: number[] = [], frames: StackFrame[] = []; let t = 0;
      for (const [d, last] of cs) {
        t += d; heap.push(d); heap.sort((x, y) => x - y); let popped: number[] | undefined;
        if (t > last) { const big = heap.pop()!; t -= big; popped = [big]; }
        frames.push({ note: `course (${d}, by ${last}): ${popped ? `time ${t + popped[0]} > ${last} → drop longest ${popped[0]}, time ${t}` : `time ${t} ≤ ${last}, keep`}`, items: [...heap], incoming: d, popped, side: `courses ${heap.length}` });
      }
      return { kind: "stack", title: `Max courses: ${heap.length}`, input: cs.map((c) => c[0]), frames };
    },
  },

  "maximum-tastiness-of-candy-basket": {
    approach: "Binary search the smallest gap g; greedily pick sorted prices that are at least g apart and check if you get k candies.",
    idea: ["Tastiness = the smallest gap between chosen prices, and a bigger target gap is harder to reach.", "For a gap g, taking the first price then each next price ≥ last + g picks the most candies.", "Find the largest g where that count reaches k."],
    code: `def maximumTastiness(price, k):
    price.sort()
    def ok(gap):
        cnt, last = 1, price[0]
        for p in price:
            if p - last >= gap:
                cnt += 1
                last = p
        return cnt >= k
    lo, hi = 0, (price[-1] - price[0]) // (k - 1)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if ok(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo`,
    lang: "python", time: "O(n log n + n log W)", space: "O(1)",
    viz: () => {
      const p = [1, 2, 5, 8, 13, 21], k = 3, frames: CellsFrame[] = []; let lo = 0, hi = Math.floor((p[p.length - 1] - p[0]) / (k - 1));
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1, pick = [0]; let last = p[0];
        p.forEach((x, i) => { if (i && x - last >= mid) { pick.push(i); last = x; } });
        const ok = pick.length >= k;
        frames.push({ note: `gap ${mid}: greedy picks ${pick.map((i) => p[i]).join(", ")} (${pick.length}) → ${ok ? `≥ ${k}, try bigger` : `< ${k}, try smaller`}`, tones: tn(pick.map((i) => `0:${i}`), ok ? "found" : "bad") });
        if (ok) lo = mid; else hi = mid - 1;
      }
      frames.push({ note: `Largest gap that still fits ${k} candies: ${lo}`, tones: {} });
      return cells(`Tastiness ${lo}`, [p], frames);
    },
  },

  "implement-magic-dictionary": {
    approach: "Store every word with one letter replaced by '*' and count them; a search word matches if one of its '*' patterns came from a different word.",
    idea: ["Words that differ in exactly one position i share the pattern with '*' at i.", "Count patterns over the dictionary. For a search word, check each of its patterns.", "Count > 1, or count 1 when the search word itself is not in the dictionary, means some other word differs in exactly that spot."],
    code: `from collections import Counter
class MagicDictionary:
    def buildDict(self, dictionary):
        self.words = set(dictionary)
        self.pat = Counter(w[:i] + "*" + w[i + 1:] for w in dictionary for i in range(len(w)))

    def search(self, searchWord):
        for i in range(len(searchWord)):
            c = self.pat[searchWord[:i] + "*" + searchWord[i + 1:]]
            if c > 1 or (c == 1 and searchWord not in self.words):
                return True
        return False`,
    lang: "python", time: "O(L²) per search", space: "O(N · L²)",
    viz: () => {
      const dict = ["hello", "leetcode"], q = "hhllo", pats = new Map<string, number>(); dict.forEach((w) => [...w].forEach((_, i) => { const p = w.slice(0, i) + "*" + w.slice(i + 1); pats.set(p, (pats.get(p) || 0) + 1); }));
      const rows: Cell[][] = [...q].map(() => [null, null]), frames: TableFrame[] = [];
      for (let i = 0; i < q.length; i++) { const p = q.slice(0, i) + "*" + q.slice(i + 1), c = pats.get(p) || 0; rows[i] = [p, c]; const hit = c > 1 || (c === 1 && !dict.includes(q)); frames.push({ note: `pattern ${p}: count ${c}${hit ? " from another word → true" : ""}`, cells: copy(rows), active: [i, 1], tones: hit ? { [`${i}:0`]: "found" } : {} }); if (hit) break; }
      return table(`search("${q}") in [${dict.join(", ")}]`, nums(q.length).map((x) => "pos " + x), ["pattern", "count"], frames);
    },
  },
  "lowest-common-ancestor-of-a-binary-tree": {
    approach: "Recurse: return the node if it is p or q; if both subtrees return something, this node is the LCA, otherwise pass up whichever side found one.",
    idea: ["A call returns p, q, the LCA, or None for its subtree.", "If the left and right calls both return a node, p and q are on different sides, so the current node is the lowest common ancestor.", "If only one side returns a node, that result (p, q, or an LCA found deeper) goes up."],
    code: `def lowestCommonAncestor(root, p, q):
    if not root or root is p or root is q:
        return root
    L = lowestCommonAncestor(root.left, p, q)
    R = lowestCommonAncestor(root.right, p, q)
    return root if L and R else L or R`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => lca([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 6, 4),
  },

  "count-of-range-sum": {
    approach: "Range sums are differences of prefix sums; merge sort the prefixes and, before each merge, count right-half prefixes within [left + lower, left + upper] with two moving pointers.",
    idea: ["sum(i..j) = P[j + 1] - P[i], so count pairs i < j of prefixes with lower ≤ P[j] - P[i] ≤ upper.", "In merge sort both halves are sorted. For each left value, the valid right values form a window [a, b) that only moves right as the left value grows.", "Add b - a for each left value, then merge. Total O(n log n)."],
    code: `def countRangeSum(nums, lower, upper):
    pre = [0]
    for x in nums:
        pre.append(pre[-1] + x)
    def sort(lo, hi):                  # counts pairs inside pre[lo:hi]
        if hi - lo <= 1:
            return 0
        mid = (lo + hi) // 2
        cnt = sort(lo, mid) + sort(mid, hi)
        a = b = mid
        for left in pre[lo:mid]:
            while a < hi and pre[a] - left < lower:
                a += 1
            while b < hi and pre[b] - left <= upper:
                b += 1
            cnt += b - a
        pre[lo:hi] = sorted(pre[lo:hi])
        return cnt
    return sort(0, len(pre))`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const nums0 = [-2, 5, -1], lower = -2, upper = 2, pre = [0]; nums0.forEach((x) => pre.push(pre[pre.length - 1] + x));
      const frames: CellsFrame[] = [{ note: `Prefix sums [${pre.join(", ")}]: count pairs i < j with ${lower} ≤ P[j] - P[i] ≤ ${upper}`, rows: [[...pre]] }];
      const sort = (lo: number, hi: number): number => {
        if (hi - lo <= 1) return 0; const mid = (lo + hi) >> 1; let cnt = sort(lo, mid) + sort(mid, hi), a = mid, b = mid; const found: string[] = [];
        for (const left of pre.slice(lo, mid)) { while (a < hi && pre[a] - left < lower) a++; while (b < hi && pre[b] - left <= upper) b++; cnt += b - a; for (let k = a; k < b; k++) found.push(`${pre[k]} - ${left}`); }
        frames.push({ note: `merge [${pre.slice(lo, mid).join(", ")}] with [${pre.slice(mid, hi).join(", ")}]: ${found.length ? `valid ${found.join(", ")}` : "no valid pairs"}`, rows: [[...pre]], tones: { ...range(lo, mid - 1, 0, "active"), ...range(mid, hi - 1, 0, "window") } });
        const s = pre.slice(lo, hi).sort((x, y) => x - y); pre.splice(lo, hi - lo, ...s);
        frames.push({ note: `sorted block [${s.join(", ")}] (pairs so far ${cnt} in this block)`, rows: [[...pre]], tones: range(lo, hi - 1, 0, "done") });
        return cnt;
      };
      const ans = sort(0, pre.length);
      return cells(`Range sums in [${lower}, ${upper}]: ${ans}`, [[0, 0, 0, 0]], frames, ["prefix"]);
    },
  },

  "minimum-time-to-repair-cars": {
    approach: "Binary search the time t; a mechanic with rank r fixes floor(sqrt(t / r)) cars in t minutes, so check if the total reaches cars.",
    idea: ["Fixing n cars takes r · n² minutes, so in t minutes a mechanic fixes ⌊√(t / r)⌋.", "More time never fixes fewer cars, so search the smallest t with sum ≥ cars.", "Upper bound: the best mechanic fixing everything alone, min(rank) · cars²."],
    code: `from math import isqrt
def repairCars(ranks, cars):
    lo, hi = 1, min(ranks) * cars * cars
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(isqrt(mid // r) for r in ranks) >= cars:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log(r · c²))", space: "O(1)",
    viz: () => {
      const ranks = [4, 2, 3, 1], cars = 10, tries: Cell[][] = []; let lo = 1, hi = Math.min(...ranks) * cars * cars; const frames: TableFrame[] = [];
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2), per = ranks.map((r) => Math.floor(Math.sqrt(Math.floor(mid / r)))), tot = per.reduce((a, b) => a + b, 0), ok = tot >= cars;
        tries.push([mid, ...per, tot]);
        frames.push({ note: `t = ${mid}: cars fixed ${per.join(" + ")} = ${tot} → ${ok ? `≥ ${cars}, hi = ${mid}` : `< ${cars}, lo = ${mid + 1}`}`, cells: copy(tries), active: [tries.length - 1, 5], tones: { [`${tries.length - 1}:0`]: ok ? "found" : "bad" } });
        if (ok) hi = mid; else lo = mid + 1;
      }
      frames.push({ note: `Minimum time ${lo}`, cells: copy(tries) });
      const pad = (fs: TableFrame[]) => fs.map((f) => ({ ...f, cells: [...f.cells, ...Array.from({ length: tries.length - f.cells.length }, () => Array<Cell>(6).fill(null))] }));
      return table(`ranks [${ranks.join(", ")}], ${cars} cars → ${lo}`, tries.map((_, i) => `try ${i + 1}`), ["t", ...ranks.map((r) => `r=${r}`), "total"], pad(frames));
    },
  },

  "smallest-range-covering-elements-from-k-lists": {
    approach: "Keep one pointer per list in a min-heap and track the current max; the range [heap min, max] covers all lists, so advance the list that holds the min.",
    idea: ["Any covering range must include one element from each list; with one pointer per list the tightest range is [min, max] of the pointed values.", "Only moving the minimum's pointer can shrink the range.", "Stop when that list runs out; keep the best range seen."],
    code: `import heapq
def smallestRange(nums):
    heap = [(row[0], i, 0) for i, row in enumerate(nums)]
    heapq.heapify(heap)
    hi = max(row[0] for row in nums)
    best = [heap[0][0], hi]
    while True:
        lo, i, j = heapq.heappop(heap)
        if hi - lo < best[1] - best[0]:
            best = [lo, hi]
        if j + 1 == len(nums[i]):
            return best
        nxt = nums[i][j + 1]
        hi = max(hi, nxt)
        heapq.heappush(heap, (nxt, i, j + 1))`,
    lang: "python", time: "O(N log k)", space: "O(k)",
    viz: () => {
      const L = [[4, 10, 15, 24, 26], [0, 9, 12, 20], [5, 18, 22, 30]], ptr = [0, 0, 0], frames: CellsFrame[] = []; let best: [number, number] = [0, Infinity];
      const rows = L.map((r) => [...r, ...Array(5 - r.length).fill("")] as (string | number)[]);
      for (;;) {
        const vals = ptr.map((p, i) => L[i][p]), lo = Math.min(...vals), hi = Math.max(...vals), i = vals.indexOf(lo);
        if (hi - lo < best[1] - best[0]) best = [lo, hi];
        const end = ptr[i] + 1 === L[i].length;
        frames.push({ note: `pointers at ${vals.join(", ")} → range [${lo}, ${hi}] (best [${best.join(", ")}]); ${end ? `list ${i} has no next value, stop` : `advance list ${i}, which holds the minimum`}`, rows, tones: Object.fromEntries(ptr.map((p, r) => [`${r}:${p}`, r === i ? "active" : "window"])) as Record<string, Tone> });
        if (end) break; ptr[i]++;
      }
      return cells(`Smallest range [${best.join(", ")}]`, rows, frames, ["list 0", "list 1", "list 2"]);
    },
  },

  "maximum-level-sum-of-a-binary-tree": {
    approach: "BFS level by level, sum each level and keep the first level with the largest sum.",
    idea: ["Process one level at a time with a list of the current row of nodes.", "Compare its sum to the best so far; use > so ties keep the smaller level.", "Build the next row from the children."],
    code: `def maxLevelSum(root):
    best, ans, level, row = float("-inf"), 1, 1, [root]
    while row:
        s = sum(n.val for n in row)
        if s > best:
            best, ans = s, level
        row = [c for n in row for c in (n.left, n.right) if c]
        level += 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(w)",
    viz: () => {
      const vals: V = [1, 7, 0, 7, -8], { nodes, kids, val } = T(vals), frames: TreeFrame[] = []; let row = [0], level = 1, best = -Infinity, ans = 1;
      while (row.length) {
        const s = row.reduce((a, i) => a + val(i), 0); if (s > best) { best = s; ans = level; }
        frames.push({ note: `level ${level}: ${row.map(val).join(" + ")} = ${s} (best level ${ans}, sum ${best})`, tones: tn(row, "active"), badges: { [row[row.length - 1]]: "Σ " + s } });
        row = row.flatMap((i) => kids[i].filter((c): c is number => c != null)); level++;
      }
      return tree(`Max level sum at level ${ans}`, nodes, frames);
    },
  },

  "car-fleet-ii": {
    approach: "Go from the last car backwards with a stack of cars ahead; pop cars this car cannot catch or that vanish into a fleet before it would reach them.",
    idea: ["A car can only hit the car directly ahead (or the fleet that car joins), and after a collision a fleet moves at the slower speed, which is the car ahead's.", "For car i, pop the stack top j if i is not faster, or if catching j takes at least as long as j's own collision time (j merges first, so i would really meet the next car).", "The remaining top gives the time (pos_j - pos_i) / (speed_i - speed_j)."],
    code: `def getCollisionTimes(cars):
    n = len(cars)
    ans, stack = [-1.0] * n, []
    for i in range(n - 1, -1, -1):
        p, s = cars[i]
        while stack:
            j = stack[-1]
            pj, sj = cars[j]
            if s <= sj or (ans[j] > 0 and (pj - p) / (s - sj) >= ans[j]):
                stack.pop()
            else:
                ans[i] = (pj - p) / (s - sj)
                break
        stack.append(i)
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const cars = [[3, 4], [5, 4], [6, 3], [9, 1]], ans = cars.map(() => -1), st: number[] = [], frames: StackFrame[] = [];
      for (let i = cars.length - 1; i >= 0; i--) {
        const [p, s] = cars[i], popped: number[] = []; const why: string[] = [];
        while (st.length) { const j = st[st.length - 1], [pj, sj] = cars[j]; if (s <= sj) { why.push(`car ${j} is not slower`); popped.push(j); st.pop(); continue; } const t = (pj - p) / (s - sj); if (ans[j] > 0 && t >= ans[j]) { why.push(`car ${j} merges at ${ans[j]} before ${t}`); popped.push(j); st.pop(); continue; } ans[i] = t; break; }
        frames.push({ note: `car ${i} (pos ${p}, speed ${s}): ${why.length ? why.join("; ") + ". " : ""}${ans[i] > 0 ? `catches car ${st[st.length - 1]} at time ${ans[i]}` : "never collides"}`, items: [...st].map((j) => `car ${j}`), incoming: `car ${i}`, popped: popped.map((j) => `car ${j}`), side: `ans [${ans.join(", ")}]` });
        st.push(i);
      }
      return { kind: "stack", title: `Collision times [${ans.join(", ")}]`, frames };
    },
  },

  "non-decreasing-subsequences": {
    approach: "Backtrack: extend the path with any later value ≥ its last element, and use a per-level set so the same value is not tried twice at one position.",
    idea: ["Record the path whenever it has at least 2 elements.", "At each depth, choosing the same value at two different indices creates the same subsequences, so skip values already used at this depth.", "Only extend with values ≥ the last element."],
    code: `def findSubsequences(nums):
    out, path = [], []
    def go(start):
        if len(path) > 1:
            out.append(path[:])
        used = set()
        for i in range(start, len(nums)):
            if nums[i] in used or (path and nums[i] < path[-1]):
                continue
            used.add(nums[i])
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return out`,
    lang: "python", time: "O(2ⁿ · n)", space: "O(n)",
    viz: () => {
      const a = [4, 6, 7, 7], frames: StackFrame[] = [], path: number[] = [], out: string[] = [];
      const go = (start: number) => {
        if (path.length > 1) { out.push(`[${path.join(",")}]`); frames.push({ note: `record [${path.join(", ")}] (${out.length} so far)`, items: [...path], side: `found ${out.length}` }); }
        const used = new Set<number>();
        for (let i = start; i < a.length; i++) {
          if (used.has(a[i])) { frames.push({ note: `skip ${a[i]} at index ${i}: already tried at this depth`, items: [...path], incoming: a[i], side: `found ${out.length}` }); continue; }
          if (path.length && a[i] < path[path.length - 1]) continue;
          used.add(a[i]); path.push(a[i]); go(i + 1); path.pop();
        }
      };
      go(0);
      return { kind: "stack", title: `[${a.join(", ")}]: ${out.length} subsequences`, input: a, frames };
    },
  },

  "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance": {
    approach: "Floyd-Warshall for all-pairs shortest paths, then count reachable cities within the threshold for each city and keep the last city with the smallest count.",
    idea: ["n ≤ 100, so O(n³) all-pairs shortest paths is fine.", "For every intermediate k, d[i][j] = min(d[i][j], d[i][k] + d[k][j]).", "Count j with d[i][j] ≤ threshold; ties go to the larger index, so use ≤ while scanning upward."],
    code: `def findTheCity(n, edges, distanceThreshold):
    INF = float("inf")
    d = [[INF] * n for _ in range(n)]
    for i in range(n):
        d[i][i] = 0
    for a, b, w in edges:
        d[a][b] = d[b][a] = w
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    best, city = n + 1, -1
    for i in range(n):
        c = sum(d[i][j] <= distanceThreshold for j in range(n))
        if c <= best:
            best, city = c, i
    return city`,
    lang: "python", time: "O(n³)", space: "O(n²)",
    viz: () => {
      const n = 4, th = 4, d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity))); for (const [a, b, w] of [[0, 1, 3], [1, 2, 1], [1, 3, 4], [2, 3, 1]]) d[a][b] = d[b][a] = w;
      const show = () => d.map((r) => r.map((x) => (x === Infinity ? "∞" : x)) as Cell[]), frames: TableFrame[] = [{ note: "Direct edges only (∞ = no edge yet)", cells: show() }];
      for (let k = 0; k < n; k++) {
        const better: [number, number][] = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) { d[i][j] = d[i][k] + d[k][j]; better.push([i, j]); }
        frames.push({ note: `through city ${k}: ${better.length ? `${better.length} distance${better.length > 1 ? "s" : ""} improved` : "nothing improves"}`, cells: show(), tones: tn(better.map(([i, j]) => `${i}:${j}`), "found"), deps: [...Array(n).keys()].flatMap((x) => [[x, k], [k, x]] as [number, number][]) });
      }
      const cnt = d.map((r) => r.filter((x) => x <= th).length); let best = n + 1, city = -1; cnt.forEach((c, i) => { if (c <= best) { best = c; city = i; } });
      frames.push({ note: `cities within ${th} (including itself): ${cnt.join(", ")} → fewest is ${best}, largest index city ${city}`, cells: show(), tones: tn(d[city].map((x, j) => (x <= th ? `${city}:${j}` : "")).filter(Boolean), "found") });
      return table(`Answer: city ${city}`, nums(n), nums(n), frames);
    },
  },

  "three-equal-parts": {
    approach: "Split the 1s into three equal groups; the third part fixes the pattern (from its first 1 to the end), and the other two parts must start with that same pattern.",
    idea: ["Each part must have exactly a third of the 1s; no 1s means any split works.", "Leading zeros do not matter, so align each part at its first 1. The third part runs to the end of the array, which fixes its length, trailing zeros included.", "Compare the same-length slices starting at each group's first 1; if equal, the cuts fall right after the first two slices."],
    code: `def threeEqualParts(arr):
    ones = [i for i, x in enumerate(arr) if x]
    if not ones:
        return [0, len(arr) - 1]
    if len(ones) % 3:
        return [-1, -1]
    k = len(ones) // 3
    a, b, c = ones[0], ones[k], ones[2 * k]
    tail = len(arr) - c
    if arr[a:a + tail] == arr[b:b + tail] == arr[c:]:
        return [a + tail - 1, b + tail]
    return [-1, -1]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const arr = [0, 1, 0, 1, 1, 0, 1, 1, 0, 1], ones = arr.flatMap((x, i) => (x ? [i] : [])), k = ones.length / 3, [a, b, c] = [ones[0], ones[k], ones[2 * k]], tail = arr.length - c;
      const frames: CellsFrame[] = [
        { note: `${ones.length} ones → ${k} per part; groups start at ${a}, ${b}, ${c}`, tones: tn([a, b, c].map((x) => `0:${x}`), "active") },
        { note: `third part ${c}..${arr.length - 1} is "${arr.slice(c).join("")}", length ${tail}`, tones: range(c, arr.length - 1, 0, "found") },
      ];
      const ok = arr.slice(a, a + tail).join("") === arr.slice(c).join("") && arr.slice(b, b + tail).join("") === arr.slice(c).join("");
      frames.push({ note: `slices from ${a} and ${b} with the same length: "${arr.slice(a, a + tail).join("")}", "${arr.slice(b, b + tail).join("")}" → ${ok ? `match, answer [${a + tail - 1}, ${b + tail}]` : "differ, [-1, -1]"}`, tones: { ...range(a, a + tail - 1, 0, "window"), ...range(b, b + tail - 1, 0, "active"), ...range(c, arr.length - 1, 0, "found") } });
      return cells(ok ? `Cuts [${a + tail - 1}, ${b + tail}]` : "No equal split", [arr], frames);
    },
  },

  "find-longest-awesome-substring": {
    approach: "Track a 10-bit parity mask of digit counts in the prefix; a substring is awesome when its two prefix masks are equal or differ in one bit, so store each mask's first index.",
    idea: ["A substring can be rearranged into a palindrome iff at most one digit has an odd count.", "Substring parity = prefix mask XOR earlier prefix mask, so it must be 0 or a single bit.", "For each prefix, check the same mask and the 10 masks one bit away in a first-seen map."],
    code: `def longestAwesome(s):
    first = {0: -1}
    mask = best = 0
    for i, ch in enumerate(s):
        mask ^= 1 << int(ch)
        if mask in first:
            best = max(best, i - first[mask])
        else:
            first[mask] = i
        for d in range(10):
            m = mask ^ (1 << d)
            if m in first:
                best = max(best, i - first[m])
    return best`,
    lang: "python", time: "O(10 · n)", space: "O(2¹⁰)",
    viz: () => {
      const s = "3242415", first = new Map<number, number>([[0, -1]]), masks: (string | number)[] = [...s].map(() => ""), frames: CellsFrame[] = []; let mask = 0, best = 0;
      const odd = (m: number) => [...Array(10).keys()].filter((d) => m >> d & 1).join(", ") || "none";
      [...s].forEach((ch, i) => {
        mask ^= 1 << +ch; masks[i] = odd(mask); let from = -2;
        if (first.has(mask)) { if (i - first.get(mask)! > best) { best = i - first.get(mask)!; from = first.get(mask)!; } } else first.set(mask, i);
        for (let d = 0; d < 10; d++) { const m = mask ^ (1 << d); if (first.has(m) && i - first.get(m)! > best) { best = i - first.get(m)!; from = first.get(m)!; } }
        frames.push({ note: `after '${ch}' odd digits {${odd(mask)}}${from > -2 ? ` → ${from < 0 ? "the empty prefix" : `the prefix ending at ${from}`} differs by ≤ 1 bit → substring ${from + 1}..${i}, length ${best}` : `, best stays ${best}`}`, rows: [s.split(""), [...masks]], tones: from > -2 ? range(from + 1, i, 0, "found") : { [`0:${i}`]: "active" } });
      });
      return cells(`"${s}": longest awesome ${best}`, [s.split(""), masks], frames, ["digit", "odd set"]);
    },
  },

  "nth-magical-number": {
    approach: "Binary search x: the count of magical numbers ≤ x is x//a + x//b - x//lcm(a, b); find the smallest x with count ≥ n.",
    idea: ["Inclusion-exclusion: multiples of a plus multiples of b, minus those of both (multiples of the lcm).", "The count grows with x, so binary search over [1, n · min(a, b)].", "Return the answer mod 10⁹ + 7."],
    code: `from math import gcd
def nthMagicalNumber(n, a, b):
    lcm = a * b // gcd(a, b)
    lo, hi = 1, n * min(a, b)
    while lo < hi:
        mid = (lo + hi) // 2
        if mid // a + mid // b - mid // lcm >= n:
            hi = mid
        else:
            lo = mid + 1
    return lo % (10**9 + 7)`,
    lang: "python", time: "O(log(n · min(a, b)))", space: "O(1)",
    viz: () => {
      const n = 5, a = 2, b = 3, lcm = 6, xs = Array.from({ length: 10 }, (_, i) => i + 1), frames: CellsFrame[] = []; let lo = 1, hi = n * Math.min(a, b);
      const marks = xs.map((x) => (x % a === 0 || x % b === 0 ? "✓" : ""));
      while (lo < hi) {
        const mid = (lo + hi) >> 1, c = Math.floor(mid / a) + Math.floor(mid / b) - Math.floor(mid / lcm);
        frames.push({ note: `x = ${mid}: ${Math.floor(mid / a)} + ${Math.floor(mid / b)} - ${Math.floor(mid / lcm)} = ${c} magical ≤ ${mid} → ${c >= n ? `≥ ${n}, hi = ${mid}` : `< ${n}, lo = ${mid + 1}`}`, rows: [xs, marks], tones: { ...range(0, mid - 1, 1, c >= n ? "found" : "window"), [`0:${mid - 1}`]: "active" } });
        if (c >= n) hi = mid; else lo = mid + 1;
      }
      frames.push({ note: `The ${n}th number divisible by ${a} or ${b} is ${lo}`, rows: [xs, marks], tones: { [`0:${lo - 1}`]: "found" } });
      return cells(`n = ${n}, a = ${a}, b = ${b} → ${lo}`, [xs, marks], frames, ["x", "magical"]);
    },
  },

  "broken-calculator": {
    approach: "Work backwards from target: halve it when even, add 1 when odd, until it drops to startValue; then the rest is subtractions.",
    idea: ["Going backwards, the moves become 'divide by 2' and 'add 1'.", "While target > start, halving is always at least as good when possible, so halve even targets and make odd ones even with +1.", "Once target ≤ start, only start - target decrements are left."],
    code: `def brokenCalc(startValue, target):
    steps = 0
    while target > startValue:
        target = target // 2 if target % 2 == 0 else target + 1
        steps += 1
    return steps + startValue - target`,
    lang: "python", time: "O(log target)", space: "O(1)",
    viz: () => {
      const start = 3, frames: StackFrame[] = [], seen: number[] = []; let t = 10, steps = 0;
      while (t > start) { const was = t; t = t % 2 === 0 ? t / 2 : t + 1; steps++; seen.push(t); frames.push({ note: `${was} is ${was % 2 ? "odd → undo a decrement: +1" : "even → undo a double: ÷2"} = ${t} (steps ${steps})`, items: [...seen], incoming: was, side: `steps ${steps}` }); }
      frames.push({ note: `${t} ≤ ${start}: ${start - t} more decrement${start - t === 1 ? "" : "s"} → total ${steps + start - t}`, items: [...seen], side: `answer ${steps + start - t}` });
      return { kind: "stack", title: `3 → 10 in ${steps + start - t} operations`, frames };
    },
  },

  "shifting-letters": {
    approach: "Letter i is shifted by the suffix sum shifts[i] + ... + shifts[n-1], so walk from the right keeping a running total.",
    idea: ["shifts[j] moves the first j + 1 letters, so letter i moves by every shifts[j] with j ≥ i.", "Accumulate that suffix sum from the end.", "Shift by total mod 26."],
    code: `def shiftingLetters(s, shifts):
    out, total = [], 0
    for ch, x in zip(reversed(s), reversed(shifts)):
        total += x
        out.append(chr((ord(ch) - 97 + total) % 26 + 97))
    return "".join(reversed(out))`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "abc", sh = [3, 5, 9], suf: (string | number)[] = ["", "", ""], res: string[] = ["", "", ""], frames: CellsFrame[] = []; let total = 0;
      for (let i = s.length - 1; i >= 0; i--) { total += sh[i]; suf[i] = total; res[i] = String.fromCharCode(((s.charCodeAt(i) - 97 + total) % 26) + 97); frames.push({ note: `'${s[i]}' moves by ${sh.slice(i).join(" + ")} = ${total} → '${res[i]}'`, rows: [s.split(""), sh, [...suf], [...res]], tones: { ...range(i, s.length - 1, 1), [`3:${i}`]: "found" } }); }
      return cells(`"${s}" → "${res.join("")}"`, [s.split(""), sh, suf, res], frames, ["letter", "shift", "suffix", "result"]);
    },
  },

  "sum-of-prefix-scores-of-strings": {
    approach: "Insert every word into a trie, counting how many words pass through each node; a word's score is the sum of counts along its path.",
    idea: ["The score of prefix p = number of words starting with p = how many insertions went through p's trie node.", "Store that count on each node while inserting.", "Walking a word again and summing counts gives the sum over all its prefixes."],
    code: `def sumPrefixScores(words):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {})
            node["#"] = node.get("#", 0) + 1
    out = []
    for w in words:
        node, s = root, 0
        for ch in w:
            node = node[ch]
            s += node["#"]
        out.append(s)
    return out`,
    lang: "python", time: "O(total length)", space: "O(total length)",
    viz: () => {
      const words = ["abc", "ab", "bc", "b"], nodes: TNode[] = [{ id: 0, label: "•", parent: null }], child: Record<string, number> = {}, cnt: Record<number, number> = {}, frames: TreeFrame[] = [];
      for (const w of words) for (let k = 1; k <= w.length; k++) { const p = w.slice(0, k); if (!(p in child)) { child[p] = nodes.length; nodes.push({ id: nodes.length, label: w[k - 1], parent: k === 1 ? 0 : child[w.slice(0, k - 1)] }); } }
      const badges = () => Object.fromEntries(Object.entries(cnt).map(([k, v]) => [+k, "×" + v]));
      for (const w of words) { const path = [...w].map((_, k) => child[w.slice(0, k + 1)]); path.forEach((id) => (cnt[id] = (cnt[id] || 0) + 1)); frames.push({ note: `insert "${w}": +1 on each node of its path`, tones: tn(path, "active"), badges: badges() }); }
      for (const w of words) { const path = [...w].map((_, k) => child[w.slice(0, k + 1)]); frames.push({ note: `score("${w}") = ${path.map((id) => cnt[id]).join(" + ")} = ${path.reduce((a, id) => a + cnt[id], 0)}`, tones: tn(path, "found"), badges: badges() }); }
      return tree(`Prefix scores of [${words.join(", ")}]`, nodes, frames);
    },
  },

  "lexicographically-smallest-equivalent-string": {
    approach: "Union-find over the 26 letters, always making the smaller letter the root; then map each letter of baseStr to its root.",
    idea: ["s1[i] ~ s2[i] is an equivalence, so letters form groups.", "When joining two groups, keep the smaller letter as the root, so every root is its group's smallest letter.", "Replace every letter of baseStr with find(letter)."],
    code: `def smallestEquivalentString(s1, s2, baseStr):
    parent = list(range(26))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in zip(s1, s2):
        ra, rb = find(ord(a) - 97), find(ord(b) - 97)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)
    return "".join(chr(find(ord(c) - 97) + 97) for c in baseStr)`,
    lang: "python", time: "O((n + m) α(26))", space: "O(26)",
    viz: () => {
      const s1 = "parker", s2 = "morris", base = "parser", letters = [...new Set(s1 + s2 + base)].sort(), par: Record<string, string> = Object.fromEntries(letters.map((c) => [c, c]));
      const find = (x: string): string => (par[x] === x ? x : (par[x] = find(par[x]))), frames: CellsFrame[] = [];
      for (let i = 0; i < s1.length; i++) { const ra = find(s1[i]), rb = find(s2[i]); if (ra !== rb) par[ra > rb ? ra : rb] = ra < rb ? ra : rb; frames.push({ note: `${s1[i]} ~ ${s2[i]}: ${ra === rb ? "already together" : `group root becomes '${ra < rb ? ra : rb}'`}`, rows: [letters, letters.map(find)], tones: { [`0:${letters.indexOf(s1[i])}`]: "active", [`0:${letters.indexOf(s2[i])}`]: "active" } }); }
      const out = [...base].map(find).join("");
      frames.push({ note: `"${base}" → "${out}"`, rows: [letters, letters.map(find)], tones: tn([...base].map((c) => `1:${letters.indexOf(c)}`), "found") });
      return cells(`"${base}" → "${out}"`, [letters, letters], frames, ["letter", "smallest"]);
    },
  },

  "wildcard-matching": {
    approach: "dp[i][j] = s[:i] matches p[:j]; '*' either matches nothing (dp[i][j-1]) or one more character (dp[i-1][j]), '?' or an equal letter uses dp[i-1][j-1].",
    idea: ["Empty pattern matches only the empty string; a pattern prefix of all '*' matches empty.", "For '*': skip it, or let it swallow s[i-1] and stay on the same '*'.", "Otherwise the characters must match ('?' matches anything) and the rest must match diagonally."],
    code: `def isMatch(s, p):
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(1, n + 1):
        dp[0][j] = dp[0][j - 1] and p[j - 1] == "*"
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 1] or dp[i - 1][j]
            else:
                dp[i][j] = dp[i - 1][j - 1] and p[j - 1] in (s[i - 1], "?")
    return dp[m][n]`,
    lang: "python", time: "O(m · n)", space: "O(m · n)",
    viz: () => {
      const s = "adceb", p = "*a*b", m = s.length, n = p.length, dp: boolean[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false)), cellsOf = (upto: number) => dp.map((r, i) => r.map((v, j) => (i * (n + 1) + j <= upto ? (v ? "T" : "F") : null))), frames: TableFrame[] = [];
      dp[0][0] = true; for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && p[j - 1] === "*";
      frames.push({ note: "Row 0: the empty string matches only leading '*'s", cells: cellsOf(n) });
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const star = p[j - 1] === "*"; dp[i][j] = star ? dp[i][j - 1] || dp[i - 1][j] : dp[i - 1][j - 1] && (p[j - 1] === s[i - 1] || p[j - 1] === "?");
        frames.push({ note: star ? `'*' vs "${s.slice(0, i)}": skip it (left) or swallow '${s[i - 1]}' (up) → ${dp[i][j]}` : `'${p[j - 1]}' vs '${s[i - 1]}' ${p[j - 1] === s[i - 1] ? "match" : "differ"} → ${dp[i][j]}`, cells: cellsOf(i * (n + 1) + j), active: [i, j], deps: star ? [[i, j - 1], [i - 1, j]] : [[i - 1, j - 1]] });
      }
      return table(`"${s}" vs "${p}": ${dp[m][n]}`, ["∅", ...s.split("")], ["∅", ...p.split("")], frames);
    },
  },

  "shortest-subarray-with-sum-at-least-k": {
    approach: "Monotonic deque of prefix-sum indices with increasing values; pop the front while it forms a sum ≥ k, and pop the back while it is not smaller than the new prefix.",
    idea: ["sum(i..j-1) = P[j] - P[i], so for each j we want the latest i with P[i] ≤ P[j] - k.", "If an older index has P ≥ the new P, it can never be a better start, so drop it from the back.", "Once a front index works for j it will only give longer answers later, so pop it after recording."],
    code: `from collections import deque
def shortestSubarray(nums, k):
    pre = [0]
    for x in nums:
        pre.append(pre[-1] + x)
    best, dq = len(nums) + 1, deque()
    for j, p in enumerate(pre):
        while dq and p - pre[dq[0]] >= k:
            best = min(best, j - dq.popleft())
        while dq and pre[dq[-1]] >= p:
            dq.pop()
        dq.append(j)
    return best if best <= len(nums) else -1`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [2, -1, 2, 1], k = 4, pre = [0]; a.forEach((x) => pre.push(pre[pre.length - 1] + x));
      const dq: number[] = [], frames: CellsFrame[] = []; let best = a.length + 1;
      pre.forEach((p, j) => {
        const got: string[] = [];
        while (dq.length && p - pre[dq[0]] >= k) { const i = dq.shift()!; best = Math.min(best, j - i); got.push(`P[${j}] - P[${i}] = ${p - pre[i]} ≥ ${k} → length ${j - i}`); }
        const drop: number[] = []; while (dq.length && pre[dq[dq.length - 1]] >= p) drop.push(dq.pop()!);
        dq.push(j);
        frames.push({ note: `P[${j}] = ${p}: ${got.length ? got.join("; ") : "no front works"}${drop.length ? `; drop ${drop.join(", ")} (not smaller)` : ""}. deque [${dq.join(", ")}], best ${best > a.length ? "none" : best}`, rows: [pre], tones: { ...tn(dq.map((i) => `0:${i}`), "window"), [`0:${j}`]: "active" } });
      });
      return cells(`[${a.join(", ")}], k = ${k}: ${best > a.length ? -1 : best}`, [pre], frames, ["prefix"]);
    },
  },

  "distribute-coins-in-binary-tree": {
    approach: "Post-order: each subtree reports its excess coins (coins - nodes); that many coins must cross the edge to its parent, so add |excess| to the moves.",
    idea: ["A subtree with excess e must send e coins up (or receive -e) across its parent edge.", "excess(node) = excess(left) + excess(right) + node.val - 1.", "Every coin crossing an edge is one move, so the answer is the sum of |excess| over all non-root nodes."],
    code: `def distributeCoins(root):
    moves = 0
    def excess(node):
        nonlocal moves
        if not node:
            return 0
        e = excess(node.left) + excess(node.right) + node.val - 1
        moves += abs(e)
        return e
    excess(root)
    return moves`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [0, 3, 0], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], badges: Record<number, string> = {}; let moves = 0;
      const ex = (i: number | null): number => { if (i == null) return 0; const e = ex(kids[i][0]) + ex(kids[i][1]) + val(i) - 1; moves += Math.abs(e); badges[i] = `e ${e}`; frames.push({ note: `node ${val(i)}: excess ${e}${i ? ` → ${Math.abs(e)} coin${Math.abs(e) === 1 ? "" : "s"} ${e > 0 ? "go up" : e < 0 ? "come down" : "stay"}` : ""} (moves ${moves})`, tones: { [i]: "active" }, badges: { ...badges } }); return e; };
      ex(0);
      return tree(`Coins [0, 3, 0]: ${moves} moves`, nodes, frames);
    },
  },
  "put-marbles-in-bags": {
    approach: "A split between i and i+1 adds weights[i] + weights[i+1] to the score; pick the k - 1 largest pair sums for the max and the k - 1 smallest for the min.",
    idea: ["Each bag costs its first + last weight. The two ends of the whole array are always counted, so they cancel in max - min.", "Every cut between i and i + 1 adds weights[i] + weights[i + 1].", "Sort the n - 1 pair sums: answer = sum of the top k - 1 minus sum of the bottom k - 1."],
    code: `def putMarbles(weights, k):
    pairs = sorted(weights[i] + weights[i + 1] for i in range(len(weights) - 1))
    return sum(pairs[len(pairs) - k + 1:]) - sum(pairs[:k - 1])`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const w = [1, 3, 5, 1], k = 2, pairs = w.slice(1).map((x, i) => w[i] + x), sorted = [...pairs].sort((a, b) => a - b), hi = sorted.slice(sorted.length - k + 1), lo = sorted.slice(0, k - 1);
      const frames: CellsFrame[] = [
        { note: `Cut costs between neighbours: ${pairs.join(", ")}`, rows: [w, [...pairs, ""]], tones: range(0, pairs.length - 1, 1) },
        { note: `Sorted [${sorted.join(", ")}]: max uses the ${k - 1} largest (${hi.join(" + ")}), min the ${k - 1} smallest (${lo.join(" + ")})`, rows: [w, [...sorted, ""]], tones: { ...range(sorted.length - k + 1, sorted.length - 1, 1, "found"), ...range(0, k - 2, 1, "bad") } },
        { note: `Difference ${hi.reduce((a, b) => a + b, 0)} - ${lo.reduce((a, b) => a + b, 0)} = ${hi.reduce((a, b) => a + b, 0) - lo.reduce((a, b) => a + b, 0)}`, rows: [w, [...sorted, ""]] },
      ];
      return cells(`weights [${w.join(", ")}], k = ${k}`, [w, [...pairs, ""]], frames, ["weight", "cut cost"]);
    },
  },

  "minimum-number-of-flips-to-convert-binary-matrix-to-zero-matrix": {
    approach: "The matrix has at most 9 cells, so treat it as a 9-bit state and BFS over states, where each move XORs a precomputed plus-shaped mask.",
    idea: ["Encode cell (r, c) as bit r · n + c; at most 2⁹ = 512 states.", "Flipping cell (r, c) toggles it and its 4 neighbours: one XOR with a fixed mask.", "BFS from the start state; the first time it reaches 0 is the minimum number of flips."],
    code: `from collections import deque
def minFlips(mat):
    m, n = len(mat), len(mat[0])
    start = sum(mat[r][c] << (r * n + c) for r in range(m) for c in range(n))
    flips = []
    for r in range(m):
        for c in range(n):
            f = 0
            for y, x in ((r, c), (r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= y < m and 0 <= x < n:
                    f |= 1 << (y * n + x)
            flips.append(f)
    dist, q = {start: 0}, deque([start])
    while q:
        s = q.popleft()
        if s == 0:
            return dist[s]
        for f in flips:
            t = s ^ f
            if t not in dist:
                dist[t] = dist[s] + 1
                q.append(t)
    return -1`,
    lang: "python", time: "O(2^(mn) · mn)", space: "O(2^(mn))",
    viz: () => {
      const m = 2, n = 2, start = 0b1000, flips: number[] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { let f = 0; for (const [y, x] of [[r, c], [r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (y >= 0 && y < m && x >= 0 && x < n) f |= 1 << (y * n + x); flips.push(f); }
      const dist = new Map([[start, 0]]), prev = new Map<number, [number, number]>(), q = [start];
      while (q.length) { const s = q.shift()!; if (s === 0) break; flips.forEach((f, i) => { const t = s ^ f; if (!dist.has(t)) { dist.set(t, dist.get(s)! + 1); prev.set(t, [s, i]); q.push(t); } }); }
      const path: [number, number][] = []; for (let s = 0; s !== start; s = prev.get(s)![0]) path.unshift([s, prev.get(s)![1]]);
      const grid = (s: number) => [0, 1].map((r) => [0, 1].map((c) => (s >> (r * n + c)) & 1) as Cell[]), frames: TableFrame[] = [{ note: `Start state (bits ${start.toString(2).padStart(4, "0")}); BFS explored ${dist.size} states`, cells: grid(start) }];
      path.forEach(([s, i], k) => frames.push({ note: `flip (${Math.floor(i / n)}, ${i % n}) → toggles it and its neighbours (move ${k + 1})${s === 0 ? ": all zero" : ""}`, cells: grid(s), active: [Math.floor(i / n), i % n] }));
      return table(`[[0, 0], [0, 1]]: ${dist.get(0)} flips`, ["0", "1"], ["0", "1"], frames);
    },
  },

  "number-of-steps-to-reduce-a-number-in-binary-representation-to-one": {
    approach: "Scan bits from the right with a carry: a 0 (after carry) costs one halving, a 1 costs +1 then a halving and leaves a carry; the leading 1 plus a carry costs one more step.",
    idea: ["Even → divide (drop the last bit). Odd → add 1, which turns the bit into 0 and carries left, then divide.", "So a bit value 1 (bit + carry) costs 2 steps and sets carry = 1; values 0 or 2 cost 1 step with the carry unchanged.", "Stop at the leading bit: if a carry reached it, the number is 10 and needs one more divide."],
    code: `def numSteps(s):
    steps = carry = 0
    for i in range(len(s) - 1, 0, -1):
        bit = int(s[i]) + carry
        if bit == 1:
            steps += 2
            carry = 1
        else:
            steps += 1
    return steps + carry`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "1101", frames: CellsFrame[] = []; let steps = 0, carry = 0;
      for (let i = s.length - 1; i > 0; i--) { const bit = +s[i] + carry; if (bit === 1) { steps += 2; carry = 1; } else steps += 1; frames.push({ note: `bit ${s[i]} + carry → ${bit}: ${bit === 1 ? "odd, add 1 and halve (2 steps), carry 1" : "even, halve (1 step)"}. steps ${steps}`, tones: { [`0:${i}`]: "active", ...range(i + 1, s.length - 1, 0, "done") } }); }
      frames.push({ note: `leading 1${carry ? " plus a carry makes 10 → one more halving" : " reached"}: total ${steps + carry}`, tones: { "0:0": "found", ...range(1, s.length - 1, 0, "done") } });
      return cells(`"${s}" (13) → 1 in ${steps + carry} steps`, [s.split("")], frames);
    },
  },

  "largest-submatrix-with-rearrangements": {
    approach: "For each row keep the column heights of consecutive 1s; since columns can be reordered, sort heights descending and the best rectangle is max of height[w] · (w + 1).",
    idea: ["Ending at row r, column c is a bar of height h[c] (consecutive 1s upward).", "Columns may be rearranged freely, so put the tallest bars next to each other.", "After sorting descending, using the first w bars gives width w and height = the w-th bar."],
    code: `def largestSubmatrix(matrix):
    n = len(matrix[0])
    h, best = [0] * n, 0
    for row in matrix:
        h = [h[j] + 1 if row[j] else 0 for j in range(n)]
        for w, height in enumerate(sorted(h, reverse=True), 1):
            best = max(best, w * height)
    return best`,
    lang: "python", time: "O(m · n log n)", space: "O(n)",
    viz: () => {
      const mat = [[0, 0, 1], [1, 1, 1], [1, 0, 1]], frames: CellsFrame[] = []; let h = [0, 0, 0], best = 0;
      mat.forEach((row, r) => {
        h = h.map((x, j) => (row[j] ? x + 1 : 0)); const s = [...h].sort((a, b) => b - a), areas = s.map((x, w) => x * (w + 1)), top = Math.max(...areas); best = Math.max(best, top);
        frames.push({ note: `row ${r}: heights [${h.join(", ")}] sorted [${s.join(", ")}] → areas ${areas.join(", ")} (best ${best})`, rows: [h, s, areas], tones: { [`2:${areas.indexOf(top)}`]: "found", ...range(0, areas.indexOf(top), 1) } });
      });
      return cells(`Largest submatrix area ${best}`, [h, h, h], frames, ["heights", "sorted", "area"]);
    },
  },

  "furthest-building-you-can-reach": {
    approach: "Give every climb a ladder by default (min-heap of climbs); when ladders run out, the smallest climb in the heap is paid with bricks instead.",
    idea: ["Ladders are best spent on the largest climbs so far.", "Push each positive climb into a min-heap; if the heap has more climbs than ladders, pop the smallest and pay it with bricks.", "When bricks go negative, the current building is as far as you can go."],
    code: `import heapq
def furthestBuilding(heights, bricks, ladders):
    heap = []
    for i in range(len(heights) - 1):
        d = heights[i + 1] - heights[i]
        if d <= 0:
            continue
        heapq.heappush(heap, d)
        if len(heap) > ladders:
            bricks -= heapq.heappop(heap)
            if bricks < 0:
                return i
    return len(heights) - 1`,
    lang: "python", time: "O(n log L)", space: "O(L)",
    viz: () => {
      const hs = [4, 2, 7, 6, 9, 14, 12], frames: StackFrame[] = [], heap: number[] = []; let bricks = 5; const ladders = 1; let reach = hs.length - 1;
      for (let i = 0; i < hs.length - 1; i++) {
        const d = hs[i + 1] - hs[i]; if (d <= 0) { frames.push({ note: `${hs[i]} → ${hs[i + 1]}: going down, free`, items: [...heap], side: `bricks ${bricks}` }); continue; }
        heap.push(d); heap.sort((a, b) => b - a); let popped: number[] | undefined;
        if (heap.length > ladders) { const sm = heap.pop()!; bricks -= sm; popped = [sm]; }
        const stop = bricks < 0;
        frames.push({ note: `${hs[i]} → ${hs[i + 1]}: climb ${d}${popped ? `; too few ladders, pay the smallest climb ${popped[0]} with bricks → ${bricks} left${stop ? ", not enough: stop at building " + i : ""}` : ", take a ladder for now"}`, items: [...heap], incoming: d, popped, side: `bricks ${bricks}` });
        if (stop) { reach = i; break; }
      }
      return { kind: "stack", title: `Heights [${hs.join(", ")}], 5 bricks, 1 ladder: reach ${reach}`, frames };
    },
  },

  "all-oone-data-structure": {
    approach: "A doubly linked list of count buckets in increasing order, each holding a set of keys, plus a map key → bucket; inc and dec move a key to the neighbouring bucket in O(1).",
    idea: ["Buckets are sorted by count, so the min key is in the first bucket and the max in the last.", "inc moves a key from bucket c to c + 1, creating that bucket right after if it does not exist; dec moves it to c - 1 (or removes it at count 1).", "Empty buckets are unlinked, so head.next and tail.prev always hold real keys."],
    code: `class Bucket:
    def __init__(self, count):
        self.count, self.keys = count, set()
        self.prev = self.next = None

class AllOne:
    def __init__(self):
        self.head, self.tail = Bucket(0), Bucket(float("inf"))
        self.head.next, self.tail.prev = self.tail, self.head
        self.at = {}                      # key -> its bucket

    def _add_after(self, b, count):
        nb = Bucket(count)
        nb.prev, nb.next = b, b.next
        b.next.prev = nb
        b.next = nb
        return nb

    def _drop(self, b, key):
        b.keys.discard(key)
        if not b.keys:
            b.prev.next, b.next.prev = b.next, b.prev

    def inc(self, key):
        b = self.at.get(key, self.head)
        nxt = b.next if b.next.count == b.count + 1 else self._add_after(b, b.count + 1)
        nxt.keys.add(key)
        self.at[key] = nxt
        if b is not self.head:
            self._drop(b, key)

    def dec(self, key):
        b = self.at[key]
        if b.count == 1:
            del self.at[key]
        else:
            prv = b.prev if b.prev.count == b.count - 1 else self._add_after(b.prev, b.count - 1)
            prv.keys.add(key)
            self.at[key] = prv
        self._drop(b, key)

    def getMaxKey(self):
        return next(iter(self.tail.prev.keys)) if self.tail.prev is not self.head else ""

    def getMinKey(self):
        return next(iter(self.head.next.keys)) if self.head.next is not self.tail else ""`,
    lang: "python", time: "O(1) per operation", space: "O(keys)",
    viz: () => {
      const cnt = new Map<string, number>(), frames: CellsFrame[] = [];
      const snap = (note: string, key: string) => { const cs = [...new Set(cnt.values())].sort((a, b) => a - b), keysOf = (c: number) => [...cnt].filter(([, v]) => v === c).map(([k]) => k).sort().join(","); frames.push({ note: `${note}. min key ${cs.length ? keysOf(cs[0])[0] : "none"}, max key ${cs.length ? keysOf(cs[cs.length - 1])[0] : "none"}`, rows: [cs.length ? cs : [""], cs.length ? cs.map(keysOf) : [""]], tones: cnt.has(key) ? { [`1:${cs.indexOf(cnt.get(key)!)}`]: "active" } : {} }); };
      for (const [op, k] of [["inc", "a"], ["inc", "a"], ["inc", "b"], ["inc", "c"], ["inc", "c"], ["inc", "c"], ["dec", "a"], ["dec", "b"]] as const) {
        const c = cnt.get(k) || 0; if (op === "inc") cnt.set(k, c + 1); else if (c === 1) cnt.delete(k); else cnt.set(k, c - 1);
        snap(`${op}("${k}"): ${op === "inc" ? `bucket ${c} → ${c + 1}` : c === 1 ? "count 1 → removed" : `bucket ${c} → ${c - 1}`}`, k);
      }
      return cells("AllOne: buckets in count order", [[""], [""]], frames, ["count", "keys"]);
    },
  },

  "count-all-possible-routes": {
    approach: "Memoised DFS on (city, fuel left): count 1 if this city is the finish, plus routes from every other city you can afford to drive to.",
    idea: ["The state is just where you are and how much fuel is left; routes may revisit cities.", "ways(c, f) = [c == finish] + sum of ways(nxt, f - |loc[c] - loc[nxt]|) for affordable nxt ≠ c.", "There are n · fuel states with n transitions each."],
    code: `from functools import lru_cache
def countRoutes(locations, start, finish, fuel):
    MOD = 10**9 + 7
    @lru_cache(None)
    def ways(city, f):
        total = 1 if city == finish else 0
        for nxt, loc in enumerate(locations):
            cost = abs(loc - locations[city])
            if nxt != city and cost <= f:
                total += ways(nxt, f - cost)
        return total % MOD
    return ways(start, fuel)`,
    lang: "python", time: "O(n² · fuel)", space: "O(n · fuel)",
    viz: () => {
      const loc = [4, 3, 1], start = 1, finish = 0, fuel = 6, n = 3, memo: Cell[][] = Array.from({ length: n }, () => Array<Cell>(fuel + 1).fill(null)), frames: TableFrame[] = [];
      for (let f = 0; f <= fuel; f++) for (let c = 0; c < n; c++) {
        let t = c === finish ? 1 : 0; const deps: [number, number][] = [];
        for (let x = 0; x < n; x++) { const cost = Math.abs(loc[x] - loc[c]); if (x !== c && cost <= f) { t += memo[x][f - cost] as number; deps.push([x, f - cost]); } }
        memo[c][f] = t;
        if (f >= fuel - 2 || f < 2) frames.push({ note: `ways(city ${c}, fuel ${f}) = ${c === finish ? "1 (at finish)" : "0"}${deps.map(([x, g]) => ` + ways(${x}, ${g})`).join("")} = ${t}`, cells: copy(memo), active: [c, f], deps });
      }
      frames.push({ note: `Answer ways(start ${start}, fuel ${fuel}) = ${memo[start][fuel]}`, cells: copy(memo), tones: { [`${start}:${fuel}`]: "found" } });
      return table(`locations [${loc.join(", ")}], ${start} → ${finish}, fuel ${fuel}`, loc.map((l, i) => `city ${i}`), nums(fuel + 1).map((x) => "f" + x), frames);
    },
  },

  "minimum-weighted-subgraph-with-the-required-paths": {
    approach: "The two paths merge at some node m and share the rest; run Dijkstra from src1, from src2, and from dest on reversed edges, and minimise d1[m] + d2[m] + d3[m].",
    idea: ["An optimal subgraph is two paths src1 → m and src2 → m that meet and then share one path m → dest.", "Dijkstra from src1 and src2 gives the first two parts for every m; Dijkstra from dest on reversed edges gives m → dest.", "Try every meeting node m."],
    code: `import heapq
def minimumWeight(n, edges, src1, src2, dest):
    fwd = [[] for _ in range(n)]
    rev = [[] for _ in range(n)]
    for a, b, w in edges:
        fwd[a].append((b, w))
        rev[b].append((a, w))
    def dijkstra(src, adj):
        dist = [float("inf")] * n
        dist[src] = 0
        heap = [(0, src)]
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            for v, w in adj[u]:
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(heap, (dist[v], v))
        return dist
    a, b, c = dijkstra(src1, fwd), dijkstra(src2, fwd), dijkstra(dest, rev)
    best = min(a[i] + b[i] + c[i] for i in range(n))
    return -1 if best == float("inf") else best`,
    lang: "python", time: "O((n + e) log n)", space: "O(n + e)",
    viz: () => {
      const n = 6, E = [[0, 2, 2], [0, 5, 6], [1, 0, 3], [1, 4, 5], [2, 1, 1], [2, 3, 3], [2, 3, 4], [3, 4, 2], [4, 5, 1]], s1 = 0, s2 = 1, dest = 5;
      const dj = (src: number, rev: boolean) => { const d = Array(n).fill(Infinity), done = new Set<number>(); d[src] = 0; while (done.size < n) { let u = -1; d.forEach((x, i) => { if (!done.has(i) && x < Infinity && (u < 0 || x < d[u])) u = i; }); if (u < 0) break; done.add(u); for (const [a, b, w] of E) { const [x, y] = rev ? [b, a] : [a, b]; if (x === u && d[u] + w < d[y]) d[y] = d[u] + w; } } return d; };
      const A = dj(s1, false), B = dj(s2, false), C = dj(dest, true), tot = A.map((x, i) => x + B[i] + C[i]), best = Math.min(...tot), m = tot.indexOf(best), show = (d: number[]) => d.map((x) => (x === Infinity ? "∞" : x));
      const nodes = [{ id: 0, label: "0", x: 10, y: 20 }, { id: 1, label: "1", x: 10, y: 80 }, { id: 2, label: "2", x: 40, y: 50 }, { id: 3, label: "3", x: 65, y: 85 }, { id: 4, label: "4", x: 70, y: 50 }, { id: 5, label: "5", x: 92, y: 20 }];
      const frames: GraphFrame[] = [
        { note: `Dijkstra from src1 = ${s1}: [${show(A).join(", ")}]`, tones: { [s1]: "active" }, badges: Object.fromEntries(show(A).map((x, i) => [i, "a" + x])) },
        { note: `Dijkstra from src2 = ${s2}: [${show(B).join(", ")}]`, tones: { [s2]: "active" }, badges: Object.fromEntries(show(B).map((x, i) => [i, "b" + x])) },
        { note: `Dijkstra from dest = ${dest} on reversed edges: [${show(C).join(", ")}]`, tones: { [dest]: "active" }, badges: Object.fromEntries(show(C).map((x, i) => [i, "c" + x])) },
        { note: `Sum per meeting node [${show(tot).join(", ")}] → meet at ${m}, total weight ${best}`, tones: { [m]: "found", [s1]: "window", [s2]: "window", [dest]: "window" }, badges: Object.fromEntries(show(tot).map((x, i) => [i, "Σ" + x])) },
      ];
      return { kind: "graph", title: `Minimum weight ${best}`, nodes, edges: E.filter(([a, b], i) => E.findIndex(([x, y]) => x === a && y === b) === i).map(([a, b, w]) => ({ a, b, w, directed: true })), frames };
    },
  },

  "substring-with-concatenation-of-all-words": {
    approach: "All words have length L, so for each offset 0..L-1 slide a window over word-sized chunks, keeping counts and shrinking from the left when a word appears too often.",
    idea: ["Chunks starting at offset o, o + L, o + 2L, ... cover every possible start once across the L offsets.", "Add the chunk at the right; an unknown chunk resets the window; an over-used one shrinks it from the left.", "When the window holds exactly k words, record its start and slide one word on."],
    code: `from collections import Counter
def findSubstring(s, words):
    L, k, need = len(words[0]), len(words), Counter(words)
    out = []
    for off in range(L):
        left, seen, used = off, Counter(), 0
        for right in range(off, len(s) - L + 1, L):
            w = s[right:right + L]
            if w not in need:
                seen.clear()
                used, left = 0, right + L
                continue
            seen[w] += 1
            used += 1
            while seen[w] > need[w]:
                seen[s[left:left + L]] -= 1
                used -= 1
                left += L
            if used == k:
                out.append(left)
                seen[s[left:left + L]] -= 1
                used -= 1
                left += L
    return sorted(out)`,
    lang: "python", time: "O(L · |s|)", space: "O(k)",
    viz: () => {
      const s = "barfoothefoobarman", words = ["foo", "bar"], L = 3, k = 2, frames: CellsFrame[] = [], out: number[] = [];
      const chars = s.split("");
      for (let off = 0; off < L; off++) {
        let left = off, used = 0; const seen = new Map<string, number>();
        for (let right = off; right + L <= s.length; right += L) {
          const w = s.slice(right, right + L);
          if (!words.includes(w)) { seen.clear(); used = 0; left = right + L; if (off === 0) frames.push({ note: `offset ${off}: "${w}" is not a word → reset window after it`, rows: [chars], tones: range(right, right + L - 1, 0, "bad") }); continue; }
          seen.set(w, (seen.get(w) || 0) + 1); used++;
          while ((seen.get(w) || 0) > 1) { const lw = s.slice(left, left + L); seen.set(lw, seen.get(lw)! - 1); used--; left += L; }
          const hit = used === k;
          if (off === 0) frames.push({ note: `offset ${off}: add "${w}", window "${s.slice(left, right + L)}"${hit ? ` holds every word → start ${left}` : ""}`, rows: [chars], tones: range(left, right + L - 1, 0, hit ? "found" : "window") });
          if (hit) { out.push(left); const lw = s.slice(left, left + L); seen.set(lw, seen.get(lw)! - 1); used--; left += L; }
        }
        if (off) frames.push({ note: `offset ${off}: no window of known words; starts so far [${out.join(", ")}]`, rows: [chars] });
      }
      return cells(`Starts [${out.sort((a, b) => a - b).join(", ")}]`, [chars], frames);
    },
  },

  "couples-holding-hands": {
    approach: "Go seat pair by seat pair; if the person's partner (id ^ 1) is not beside them, swap the partner into that seat. Each swap fixes one couple, and that is optimal.",
    idea: ["Partners are 2k and 2k + 1, so x's partner is x ^ 1.", "For seats (i, i + 1): if row[i + 1] is not row[i] ^ 1, swap the partner (found through a position map) into seat i + 1.", "Every swap seats one couple for good and never undoes another, so the count is minimal (it equals n minus the number of swap cycles)."],
    code: `def minSwapsCouples(row):
    pos = {p: i for i, p in enumerate(row)}
    swaps = 0
    for i in range(0, len(row), 2):
        partner = row[i] ^ 1
        if row[i + 1] != partner:
            j = pos[partner]
            row[i + 1], row[j] = row[j], row[i + 1]
            pos[row[j]], pos[partner] = j, i + 1
            swaps += 1
    return swaps`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const row = [0, 3, 4, 1, 2, 5], frames: CellsFrame[] = []; let swaps = 0;
      for (let i = 0; i < row.length; i += 2) {
        const p = row[i] ^ 1;
        if (row[i + 1] === p) { frames.push({ note: `seats ${i}, ${i + 1}: ${row[i]} and ${p} are already a couple`, rows: [[...row]], tones: range(i, i + 1, 0, "found") }); continue; }
        const j = row.indexOf(p); [row[i + 1], row[j]] = [row[j], row[i + 1]]; swaps++;
        frames.push({ note: `seats ${i}, ${i + 1}: ${row[i]}'s partner ${p} sits at ${j} → swap it in (swaps ${swaps})`, rows: [[...row]], tones: { ...range(i, i + 1, 0, "found"), [`0:${j}`]: "active" } });
      }
      return cells(`[0, 3, 4, 1, 2, 5]: ${swaps} swaps`, [[0, 3, 4, 1, 2, 5]], frames);
    },
  },

  "meeting-rooms-iii": {
    approach: "Sort meetings by start; keep a min-heap of free room numbers and a min-heap of (end time, room) for busy rooms; if nothing is free, delay the meeting into the room that frees first.",
    idea: ["Before each meeting, release every busy room whose end ≤ its start.", "If a room is free, take the lowest number. Otherwise pop the earliest-ending room and run the meeting from that end time, keeping its duration.", "Count meetings per room; return the lowest room with the most."],
    code: `import heapq
def mostBooked(n, meetings):
    free, busy, count = list(range(n)), [], [0] * n
    for s, e in sorted(meetings):
        while busy and busy[0][0] <= s:
            heapq.heappush(free, heapq.heappop(busy)[1])
        if free:
            r = heapq.heappop(free)
            heapq.heappush(busy, (e, r))
        else:
            end, r = heapq.heappop(busy)
            heapq.heappush(busy, (end + e - s, r))
        count[r] += 1
    return count.index(max(count))`,
    lang: "python", time: "O(m log m + m log n)", space: "O(n)",
    viz: () => {
      const n = 2, ms: [number, number][] = [[0, 10], [1, 5], [2, 7], [3, 4]], free = [0, 1], busy: [number, number][] = [], count = [0, 0], ran: [number, number][] = [], frames: IntervalsFrame[] = [];
      ms.forEach(([s, e], i) => {
        busy.sort((a, b) => a[0] - b[0] || a[1] - b[1]); while (busy.length && busy[0][0] <= s) { free.push(busy.shift()![1]); free.sort(); }
        let r: number, at: [number, number];
        if (free.length) { r = free.shift()!; at = [s, e]; } else { const [end, rr] = busy.shift()!; r = rr; at = [end, end + e - s]; }
        busy.push([at[1], r]); count[r]++; ran.push(at);
        frames.push({ note: `meeting [${s}, ${e}) → room ${r}${at[0] !== s ? `, delayed to [${at[0]}, ${at[1]})` : ""}. counts [${count.join(", ")}]`, tones: { [i]: "active" }, result: [...ran] });
      });
      const best = count.indexOf(Math.max(...count));
      frames.push({ note: `Most meetings: room ${best} (${count[best]})`, result: [...ran] });
      return { kind: "intervals", title: `${n} rooms: room ${best} hosts the most`, items: ms, frames };
    },
  },

  "4sum-ii": {
    approach: "Count every sum a + b from the first two arrays, then for every c + d add how many times -(c + d) appeared.",
    idea: ["a + b + c + d = 0 means a + b = -(c + d).", "Store the n² pair sums of nums1 and nums2 in a hash map with counts.", "Loop the n² pairs of nums3 and nums4 and look up the complement."],
    code: `from collections import Counter
def fourSumCount(nums1, nums2, nums3, nums4):
    ab = Counter(a + b for a in nums1 for b in nums2)
    return sum(ab[-c - d] for c in nums3 for d in nums4)`,
    lang: "python", time: "O(n²)", space: "O(n²)",
    viz: () => {
      const A = [1, 2], B = [-2, -1], C = [-1, 2], D = [0, 2], ab = new Map<number, number>(); A.forEach((a) => B.forEach((b) => ab.set(a + b, (ab.get(a + b) || 0) + 1)));
      const grid: Cell[][] = C.map(() => D.map(() => null)), frames: TableFrame[] = []; let total = 0;
      frames.push({ note: `Pair sums of nums1 + nums2: ${[...ab].map(([s, c]) => `${s}×${c}`).join(", ")}`, cells: copy(grid) });
      C.forEach((c, i) => D.forEach((d, j) => { const hit = ab.get(-c - d) || 0; total += hit; grid[i][j] = hit; frames.push({ note: `c + d = ${c + d}: need a + b = ${-c - d}, seen ${hit} time${hit === 1 ? "" : "s"} (total ${total})`, cells: copy(grid), active: [i, j], tones: hit ? { [`${i}:${j}`]: "found" } : {} }); }));
      return table(`${total} tuples sum to 0`, C.map((c) => `c=${c}`), D.map((d) => `d=${d}`), frames);
    },
  },

  "sudoku-solver": {
    approach: "Backtracking over the empty cells with sets for each row, column and box, so checking a digit is O(1); undo the placement when the rest cannot be completed.",
    idea: ["Record used digits per row, column and 3 × 3 box.", "Fill empty cells in order: try each digit not used in its row, column or box, recurse, and remove it again if the recursion fails.", "The first full assignment solves the board in place."],
    code: `def solveSudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    empty = []
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                empty.append((r, c))
            else:
                rows[r].add(v); cols[c].add(v); boxes[r // 3 * 3 + c // 3].add(v)
    def go(k):
        if k == len(empty):
            return True
        r, c = empty[k]
        b = r // 3 * 3 + c // 3
        for v in "123456789":
            if v not in rows[r] and v not in cols[c] and v not in boxes[b]:
                board[r][c] = v
                rows[r].add(v); cols[c].add(v); boxes[b].add(v)
                if go(k + 1):
                    return True
                rows[r].discard(v); cols[c].discard(v); boxes[b].discard(v)
        board[r][c] = "."
        return False
    go(0)`,
    lang: "python", time: "O(9^empty) worst, fast in practice", space: "O(81)",
    viz: () => {
      const g: Cell[][] = [["1", "", "", "4"], ["", "", "1", ""], ["", "1", "", ""], ["4", "", "", "1"]], N = 4, empty: [number, number][] = [], frames: TableFrame[] = [];
      g.forEach((r, i) => r.forEach((v, j) => { if (v === "") empty.push([i, j]); }));
      const ok = (r: number, c: number, v: string) => g.every((row, i) => row[c] !== v || i === r) && g[r].every((x, j) => x !== v || j === c) && [0, 1].every((dr) => [0, 1].every((dc) => g[(r & 2) + dr][(c & 2) + dc] !== v));
      frames.push({ note: "Same algorithm on a 4 × 4 board with 2 × 2 boxes (digits 1-4)", cells: copy(g) });
      const go = (k: number): boolean => {
        if (k === empty.length) return true; const [r, c] = empty[k];
        for (const v of ["1", "2", "3", "4"]) if (ok(r, c, v)) { g[r][c] = v; frames.push({ note: `(${r}, ${c}) = ${v}: not in its row, column or box`, cells: copy(g), active: [r, c] }); if (go(k + 1)) return true; g[r][c] = ""; frames.push({ note: `(${r}, ${c}) = ${v} leads to a dead end → undo`, cells: copy(g), tones: { [`${r}:${c}`]: "bad" } }); }
        return false;
      };
      go(0);
      frames.push({ note: "Every cell filled → solved", cells: copy(g), tones: tn(empty.map(([r, c]) => `${r}:${c}`), "found") });
      return table("Backtracking sudoku (4 × 4 demo)", nums(N), nums(N), frames);
    },
  },

  "maximum-score-of-a-good-subarray": {
    approach: "Start with the window [k, k] and grow it one step at a time toward the bigger neighbour, tracking the window minimum and the best min · width.",
    idea: ["Every good subarray contains k, so grow outward from k.", "Extending toward the larger neighbour keeps the minimum as high as possible for each width.", "Each width is checked once, so it is O(n)."],
    code: `def maximumScore(nums, k):
    n = len(nums)
    i = j = k
    low = best = nums[k]
    while i > 0 or j < n - 1:
        if i == 0 or (j < n - 1 and nums[j + 1] > nums[i - 1]):
            j += 1
            low = min(low, nums[j])
        else:
            i -= 1
            low = min(low, nums[i])
        best = max(best, low * (j - i + 1))
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 4, 3, 7, 4, 5], k = 3, n = a.length, frames: CellsFrame[] = []; let i = k, j = k, low = a[k], best = a[k];
      frames.push({ note: `Start at k = ${k}: min ${low}, score ${best}`, tones: range(i, j), marks: [{ i, label: "i" }, { i: j, label: "j" }] });
      while (i > 0 || j < n - 1) {
        const right = i === 0 || (j < n - 1 && a[j + 1] > a[i - 1]); if (right) { j++; low = Math.min(low, a[j]); } else { i--; low = Math.min(low, a[i]); }
        best = Math.max(best, low * (j - i + 1));
        frames.push({ note: `grow ${right ? "right" : "left"} (bigger neighbour) → [${i}..${j}], min ${low} × width ${j - i + 1} = ${low * (j - i + 1)} (best ${best})`, tones: { ...range(i, j), [`0:${right ? j : i}`]: "active" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
      }
      return cells(`Best score ${best}`, [a], frames);
    },
  },

  "longest-path-with-different-adjacent-characters": {
    approach: "Post-order over the tree: each node keeps the two longest downward chains among children with a different letter; the path through it is 1 + both.",
    idea: ["down[u] = 1 + longest down[v] over children v whose letter differs from u's.", "The best path that turns at u uses its two longest such chains: 1 + a + b.", "Process nodes children-first (reverse BFS order) to avoid deep recursion."],
    code: `def longestPath(parent, s):
    n = len(parent)
    kids = [[] for _ in range(n)]
    for i in range(1, n):
        kids[parent[i]].append(i)
    order = [0]
    for u in order:
        order.extend(kids[u])
    down, best = [1] * n, 1
    for u in reversed(order):
        a = b = 0
        for v in kids[u]:
            if s[v] != s[u]:
                if down[v] > a:
                    a, b = down[v], a
                elif down[v] > b:
                    b = down[v]
        down[u] = 1 + a
        best = max(best, 1 + a + b)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const parent = [-1, 0, 0, 1, 1, 2], s = "abacbe", n = 6, nodes: TNode[] = parent.map((p, i) => ({ id: i, label: s[i], parent: p < 0 ? null : p })), kids: number[][] = parent.map(() => []); parent.forEach((p, i) => p >= 0 && kids[p].push(i));
      const order = [0]; for (const u of order) order.push(...kids[u]);
      const down = Array(n).fill(1), frames: TreeFrame[] = [], badges: Record<number, string> = {}; let best = 1;
      for (const u of [...order].reverse()) {
        let a = 0, b = 0; for (const v of kids[u]) if (s[v] !== s[u]) { if (down[v] > a) { b = a; a = down[v]; } else if (down[v] > b) b = down[v]; }
        down[u] = 1 + a; best = Math.max(best, 1 + a + b); badges[u] = `↓${down[u]}`;
        frames.push({ note: `node ${u} '${s[u]}': ${kids[u].length ? `children with a different letter give chains ${a}, ${b}` : "leaf"} → down ${down[u]}, path through it ${1 + a + b} (best ${best})`, tones: { [u]: "active", ...tn(kids[u].filter((v) => s[v] === s[u]), "bad") }, badges: { ...badges } });
      }
      return tree(`Longest path ${best}`, nodes, frames);
    },
  },

  "binary-tree-pruning": {
    approach: "Post-order: prune both children first, then drop this node if it is 0 and has no children left.",
    idea: ["A subtree without a 1 is exactly a node that is 0 whose pruned children are both gone.", "So decide children first, then the node itself.", "Returning None removes it from its parent."],
    code: `def pruneTree(root):
    if not root:
        return None
    root.left = pruneTree(root.left)
    root.right = pruneTree(root.right)
    if not root.left and not root.right and root.val == 0:
        return None
    return root`,
    lang: "python", time: "O(n)", space: "O(h)",
    viz: () => {
      const vals: V = [1, 0, 1, 0, 0, 0, 1], { nodes, kids, val } = T(vals), frames: TreeFrame[] = [], gone = new Set<number>();
      const go = (i: number | null): boolean => { if (i == null) return false; const l = go(kids[i][0]), r = go(kids[i][1]); const keep = l || r || val(i) === 1; if (!keep) gone.add(i); frames.push({ note: `${val(i)}: ${keep ? `kept (${val(i) === 1 ? "is 1" : "a child holds a 1"})` : "0 with no 1 below → pruned"}`, tones: { ...tn(gone, "muted"), [i]: keep ? "found" : "bad" } }); return keep; };
      go(0);
      return tree("Prune subtrees without a 1", nodes, frames);
    },
  },

  "single-number-ii": {
    approach: "Count each bit mod 3 with two masks: ones holds bits seen once, twos holds bits seen twice; a third sighting clears both.",
    idea: ["Every bit of the triple numbers appears a multiple of 3 times; the single number's bits are the leftover.", "ones = (ones ^ x) & ~twos adds x to ones unless the bit is already in twos.", "twos = (twos ^ x) & ~ones moves bits seen twice; at the third time both drop to 0. The answer is ones."],
    code: `def singleNumber(nums):
    ones = twos = 0
    for x in nums:
        ones = (ones ^ x) & ~twos
        twos = (twos ^ x) & ~ones
    return ones`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 2, 3, 2], frames: TableFrame[] = [], bits = (x: number) => x.toString(2).padStart(2, "0").split("") as Cell[]; let ones = 0, twos = 0;
      a.forEach((x) => { ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones; frames.push({ note: `x = ${x} (${x.toString(2).padStart(2, "0")}): ones = ${ones.toString(2).padStart(2, "0")}, twos = ${twos.toString(2).padStart(2, "0")}`, cells: [bits(x), bits(ones), bits(twos)], active: [0, 0] }); });
      frames.push({ note: `Bits seen 3 times cancelled; ones = ${ones} is the single number`, cells: [bits(0), bits(ones), bits(twos)], tones: { "1:0": "found", "1:1": "found" } });
      return table(`[${a.join(", ")}] → ${ones}`, ["x", "ones", "twos"], ["bit 1", "bit 0"], frames);
    },
  },
};
