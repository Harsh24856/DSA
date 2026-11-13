// Solutions for the must-do "trie" questions that were new to the app (lib/patterns/overview/trie.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, Tone, TreeFrame } from "../../diagram";
import type { TNode } from "../../sim.ts";
import type { Solution } from "../types";

/** A trie with fixed node ids in creation order, for the tree renderer. */
function trieOf() {
  const nodes: TNode[] = [{ id: 0, label: "root", parent: null }], kid = new Map<string, number>(), end = new Set<number>();
  const insert = (w: string) => { const path = [0], made: number[] = []; let n = 0; for (const c of w) { let k = kid.get(`${n}:${c}`); if (k == null) { k = nodes.length; nodes.push({ id: k, label: c, parent: n }); kid.set(`${n}:${c}`, k); made.push(k); } n = k; path.push(n); } end.add(n); return { path, made }; };
  const walk = (w: string) => { const path = [0]; let n = 0; for (const c of w) { const k = kid.get(`${n}:${c}`); if (k == null) break; n = k; path.push(n); } return path; };
  const leaf = (id: number) => !nodes.some((x) => x.parent === id);
  return { nodes, insert, walk, leaf, end };
}
const on = (ids: number[], tone: Tone) => Object.fromEntries(ids.map((i) => [i, tone])) as Record<number, Tone>;

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "find-the-length-of-the-longest-common-prefix": {
    approach: "Put every number of arr1 in a trie of digits, then walk each number of arr2 down it; the deepest walk is the answer.",
    idea: ["A common prefix of x and y is a path of digits shared from the left, which is exactly what a trie stores.", "Insert the decimal string of every number in arr1.", "For each number in arr2, walk its digits from the root until a digit has no child. The number of steps is its longest common prefix with any number of arr1.", "Take the maximum over arr2. Comparing every pair would be O(n m d); the trie makes it O((n + m) d) with d at most 9 digits."],
    code: `def longestCommonPrefix(arr1, arr2):
    root = {}
    for x in arr1:
        node = root
        for d in str(x):
            node = node.setdefault(d, {})
    best = 0
    for x in arr2:
        node, k = root, 0
        for d in str(x):
            if d not in node:
                break
            node, k = node[d], k + 1
        best = max(best, k)
    return best`,
    lang: "python", time: "O((n + m) d), d = digits", space: "O(n d)",
    viz: () => {
      const arr1 = [1, 10, 100], arr2 = [1000, 12, 2], t = trieOf(), frames: TreeFrame[] = [];
      for (const x of arr1) { const { path, made } = t.insert(String(x)); frames.push({ note: `Insert ${x} from arr1: digits ${String(x).split("").join(", ")}${made.length < path.length - 1 ? `, reusing the first ${path.length - 1 - made.length}` : ""}`, tones: { ...on(path, "active"), ...on(made, "found") } }); }
      let best = 0;
      for (const y of arr2) {
        const path = t.walk(String(y)), k = path.length - 1; best = Math.max(best, k);
        frames.push({ note: `Walk ${y} from arr2: ${k ? `"${String(y).slice(0, k)}" matches${k < String(y).length ? `, then '${String(y)[k]}' has no child` : ""}` : `the root has no child '${String(y)[0]}'`}. Common prefix ${k}, best ${best}`, tones: { ...on(path, "active"), [path[path.length - 1]]: k ? "found" : "bad" } });
      }
      frames.push({ note: `Longest common prefix over all pairs = ${best}`, tones: {} });
      return { kind: "tree", title: `longestCommonPrefix = ${best}`, nodes: t.nodes, frames };
    },
  },

  "short-encoding-of-words": {
    approach: "Insert every word reversed into a trie; a word costs len + 1 only if its reversed path ends on a leaf, since otherwise it is a suffix of a longer word.",
    idea: ["A word can reuse another word's slot in the reference string exactly when it is a suffix of that word (\"me\" sits inside \"time#\").", "Suffixes become prefixes after reversing, so insert every distinct word reversed into a trie.", "A word whose reversed path ends on a node with children is a suffix of some longer word: it costs nothing.", "A word whose path ends on a leaf needs its own copy plus '#': add len + 1.", "Duplicates are removed first so a repeated word is not counted twice."],
    code: `def minimumLengthEncoding(words):
    root, ends = {}, []
    for w in set(words):
        node = root
        for c in reversed(w):
            node = node.setdefault(c, {})
        ends.append((node, len(w)))
    # a word is needed in the encoding only if its reversed path ends on a leaf
    return sum(n + 1 for node, n in ends if not node)`,
    lang: "python", time: "O(total length)", space: "O(total length)",
    viz: () => {
      const words = ["time", "me", "bell", "ell"], t = trieOf(), frames: TreeFrame[] = [], ends: [string, number][] = [];
      for (const w of words) { const r = [...w].reverse().join(""), { path, made } = t.insert(r); ends.push([w, path[path.length - 1]]); frames.push({ note: `Insert "${w}" reversed, as "${r}"${made.length < r.length ? `: its path reuses ${r.length - made.length} node${r.length - made.length > 1 ? "s" : ""}, so it shares a suffix with an earlier word` : ""}`, tones: { ...on(path, "active"), ...on(made, "found") } }); }
      let total = 0; const kept: string[] = [];
      for (const [w, id] of ends) {
        const leaf = t.leaf(id); if (leaf) { total += w.length + 1; kept.push(w); }
        frames.push({ note: leaf ? `"${w}" ends on a leaf: it needs its own copy, "${w}#", +${w.length + 1}. Total ${total}` : `"${w}" ends on a node with children: it is the suffix of a longer word, so it is free`, tones: { [id]: leaf ? "found" : "bad" } });
      }
      frames.push({ note: `Reference string "${kept.join("#")}#" has length ${total}`, tones: {} });
      return { kind: "tree", title: `minimumLengthEncoding = ${total}`, nodes: t.nodes, frames };
    },
  },

  "extra-characters-in-a-string": {
    approach: "dp[i] = fewest leftover characters in s[i:]; from each i, walk a trie of the dictionary along s to find every word that starts at i.",
    idea: ["dp[i] is the answer for the suffix s[i:], and dp[n] = 0.", "Option 1: leave s[i] over, costing 1 + dp[i + 1].", "Option 2: a dictionary word s[i..j] starts at i, costing dp[j + 1].", "To find those words, walk the trie from the root along s[i], s[i + 1], ... and stop the moment a child is missing: every end node on the way is a word.", "Fill dp from the right; the answer is dp[0]. The trie replaces a set lookup of every substring, which would cost O(n^3) with slicing."],
    code: `def minExtraChar(s, dictionary):
    root = {}
    for w in dictionary:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = True
    n = len(s)
    dp = [0] * (n + 1)              # dp[i] = fewest extra characters in s[i:]
    for i in range(n - 1, -1, -1):
        dp[i] = 1 + dp[i + 1]       # s[i] is left over
        node = root
        for j in range(i, n):
            node = node.get(s[j])
            if node is None:
                break
            if "$" in node:         # s[i:j+1] is a dictionary word
                dp[i] = min(dp[i], dp[j + 1])
    return dp[0]`,
    lang: "python", time: "O(n^2 + total dictionary length)", space: "O(n + total dictionary length)",
    viz: () => {
      const s = "leetscode", dict = ["leet", "code", "leetcode"], n = s.length, dp: number[] = Array(n + 1).fill(0), frames: CellsFrame[] = [];
      const ends = new Set(dict), pre = new Set(dict.flatMap((w) => [...w].map((_, k) => w.slice(0, k + 1))));
      for (let i = n - 1; i >= 0; i--) {
        dp[i] = 1 + dp[i + 1]; const used: string[] = [];
        for (let j = i; j < n; j++) { const sub = s.slice(i, j + 1); if (!pre.has(sub)) break; if (ends.has(sub)) { used.push(sub); dp[i] = Math.min(dp[i], dp[j + 1]); } }
        const show = dp.slice(0, n).map((v, j) => (j >= i ? v : ""));
        frames.push({ note: `i = ${i} ('${s[i]}'): leaving it over costs 1 + dp[${i + 1}] = ${1 + dp[i + 1]}${used.length ? `; the trie walk finds ${used.map((u) => `"${u}" (dp[${i + u.length}] = ${dp[i + u.length]})`).join(", ")}` : "; the trie walk finds no word starting here"}. dp[${i}] = ${dp[i]}`, rows: [[...s], show], tones: { [`1:${i}`]: "found", ...Object.fromEntries(used.flatMap((u) => [...u].map((_, k) => [`0:${i + k}`, "window" as Tone]))) }, marks: [{ i, label: "i" }] });
      }
      frames.push({ note: `dp[0] = ${dp[0]} extra character${dp[0] === 1 ? "" : "s"}`, rows: [[...s], dp.slice(0, n)], tones: { "1:0": "found" } });
      return { kind: "cells", title: `minExtraChar = ${dp[0]}`, rowLabels: ["s", "dp"], rows: [[...s], dp.slice(0, n)], frames };
    },
  },

  "word-break-ii": {
    approach: "Memoised DFS over start positions: walk a trie along s from i, and for every word that ends at j, join it with every sentence for s[j + 1:].",
    idea: ["go(i) returns every sentence that spells s[i:], and go(n) = [\"\"] (one empty sentence).", "From i, walk the trie along s; a missing child ends the walk at once, and each end node marks a word s[i..j].", "For each such word, prefix it to every sentence in go(j + 1).", "Memoise go(i) so each suffix is solved once; the output itself can still be exponential (\"aaaa...\"), which no method avoids.", "Order of the answers: words are tried shortest first, which LeetCode accepts in any order."],
    code: `def wordBreak(s, wordDict):
    root = {}
    for w in wordDict:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = True
    memo = {}
    def go(i):                      # every sentence that spells s[i:]
        if i == len(s):
            return [""]
        if i in memo:
            return memo[i]
        out, node = [], root
        for j in range(i, len(s)):
            node = node.get(s[j])
            if node is None:
                break
            if "$" in node:
                for rest in go(j + 1):
                    out.append(s[i:j + 1] + (" " + rest if rest else ""))
        memo[i] = out
        return out
    return go(0)`,
    lang: "python", time: "O(n^2 + output size)", space: "O(n + output size)",
    viz: () => {
      const s = "catsanddog", dict = ["cat", "cats", "and", "sand", "dog"], n = s.length, memo = new Map<number, string[]>(), frames: CellsFrame[] = [];
      const ends = new Set(dict), pre = new Set(dict.flatMap((w) => [...w].map((_, k) => w.slice(0, k + 1))));
      const counts = () => [...s].map((_, j) => (memo.has(j) ? memo.get(j)!.length : ""));
      const go = (i: number): string[] => {
        if (i === n) return [""];
        if (memo.has(i)) { frames.push({ note: `go(${i}) is already memoised: reuse its ${memo.get(i)!.length} sentence${memo.get(i)!.length === 1 ? "" : "s"}`, rows: [[...s], counts()], tones: { [`1:${i}`]: "found" } }); return memo.get(i)!; }
        const out: string[] = [];
        for (let j = i; j < n; j++) {
          const w = s.slice(i, j + 1); if (!pre.has(w)) break;
          if (ends.has(w)) {
            frames.push({ note: `From ${i}, the trie walk reaches the word end "${w}". Solve the rest from ${j + 1}`, rows: [[...s], counts()], tones: Object.fromEntries([...w].map((_, k) => [`0:${i + k}`, "window" as Tone])), marks: [{ i, label: "i" }] });
            for (const rest of go(j + 1)) out.push(w + (rest ? " " + rest : ""));
          }
        }
        memo.set(i, out);
        frames.push({ note: `go(${i}) = [${out.map((x) => `"${x}"`).join(", ")}]`, rows: [[...s], counts()], tones: { [`1:${i}`]: "found" }, marks: [{ i, label: "i" }] });
        return out;
      };
      const ans = go(0);
      return { kind: "cells", title: `wordBreak: ${ans.length} sentences`, rowLabels: ["s", "count"], rows: [[...s], counts()], frames };
    },
  },
};
