// Solutions for the must-do "recursion-backtracking" questions that were new to the app (lib/patterns/overview/recursion-backtracking.problems.ts). See ../arrays.ts for the style.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import type { Solution } from "../types";

type Node = { id: number; label: string; parent: number | null; side?: "L" | "R"; edge?: string };

/** A decision tree that grows as the search runs: nodes reached in earlier frames show as done, later ones as muted. */
const searchTree = (title: string, nodes: Node[], raw: TreeFrame[]): Diagram => {
  const seen = new Set<number>([0]);
  const frames = raw.map((f) => {
    const base: Record<number, Tone> = {};
    nodes.forEach((nd) => { base[nd.id] = seen.has(nd.id) ? "done" : "muted"; });
    Object.keys(f.tones ?? {}).forEach((x) => seen.add(+x));
    return { ...f, tones: { ...base, ...f.tones } };
  });
  return { kind: "tree", title, nodes, frames };
};
const list = (a: (string | number)[]) => `[${a.join(", ")}]`;

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "generate-parentheses": {
    approach: "Build the string one bracket at a time: add '(' while fewer than n are open, add ')' only while it closes an open one. Every leaf is then valid.",
    idea: ["A prefix can still become valid exactly when it has at most n opening brackets and never more closing than opening ones.", "So track opened and closed: '(' is allowed while opened < n, ')' while closed < opened.", "Both rules keep the prefix valid, so no branch ever has to be undone for being wrong: there is no wasted search.", "At length 2n, record the string; then pop the last bracket and try the other choice.", "Trying '(' before ')' produces the answers in sorted order."],
    code: `def generateParenthesis(n):
    out, path = [], []
    def go(opened, closed):
        if len(path) == 2 * n:
            out.append("".join(path))
            return
        if opened < n:
            path.append("(")
            go(opened + 1, closed)
            path.pop()
        if closed < opened:
            path.append(")")
            go(opened, closed + 1)
            path.pop()
    go(0, 0)
    return out`,
    lang: "python", time: "O(4ⁿ / √n)", space: "O(n)",
    viz: () => {
      const n = 3, nodes: Node[] = [{ id: 0, label: "\"\"", parent: null }], raw: TreeFrame[] = [], out: string[] = [];
      raw.push({ note: `n = ${n}: start empty with 0 open and 0 closed`, tones: { 0: "active" } });
      const go = (s: string, o: number, c: number, parent: number) => {
        if (s.length === 2 * n) { out.push(s); return; }
        for (const ch of ["(", ")"]) {
          if (ch === "(" ? o >= n : c >= o) continue;
          const t = s + ch, id = nodes.length;
          nodes.push({ id, label: t, parent, edge: ch });
          const no = o + (ch === "(" ? 1 : 0), nc = c + (ch === ")" ? 1 : 0);
          raw.push(t.length === 2 * n
            ? { note: `Add '${ch}': "${t}" has length ${2 * n}, record it (answer ${out.length + 1})`, tones: { [id]: "found" } }
            : { note: `Add '${ch}' (${ch === "(" ? `${o} < ${n} open` : `${c} closed < ${o} open`}): "${t}", ${no} open, ${nc} closed`, tones: { [id]: "active" } });
          go(t, no, nc, id);
        }
      };
      go("", 0, 0, 0);
      raw.push({ note: `All ${out.length} strings: ${out.join(", ")}`, tones: {} });
      return searchTree(`generateParenthesis(${n})`, nodes, raw);
    },
  },

  "letter-combinations-of-a-phone-number": {
    approach: "One level of recursion per digit; at each level try every letter on that key, append it, recurse, then pop it.",
    idea: ["Digit i decides the letter at position i, so the depth of the search is the number of digits.", "At depth i loop over the 3 or 4 letters of digits[i]: choose a letter, recurse to depth i + 1, then un-choose it.", "When every digit has a letter, record the joined path.", "An empty input has no combinations at all, so return [] rather than [\"\"].", "There are up to 4ⁿ results of length n each, so the output itself sets the cost."],
    code: `def letterCombinations(digits):
    if not digits:
        return []
    keys = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    out, path = [], []
    def go(i):
        if i == len(digits):
            out.append("".join(path))
            return
        for ch in keys[digits[i]]:
            path.append(ch)
            go(i + 1)
            path.pop()
    go(0)
    return out`,
    lang: "python", time: "O(n × 4ⁿ)", space: "O(n)",
    viz: () => {
      const digits = "23", keys: Record<string, string> = { "2": "abc", "3": "def" }, nodes: Node[] = [{ id: 0, label: "\"\"", parent: null }], raw: TreeFrame[] = [], out: string[] = [];
      raw.push({ note: `digits = "${digits}": depth 0 chooses a letter of key 2 (abc), depth 1 a letter of key 3 (def)`, tones: { 0: "active" } });
      const go = (i: number, path: string, parent: number) => {
        if (i === digits.length) return;
        for (const ch of keys[digits[i]]) {
          const id = nodes.length, t = path + ch; nodes.push({ id, label: t, parent, edge: ch });
          if (t.length === digits.length) { out.push(t); raw.push({ note: `Choose '${ch}' for digit ${digits[i]}: "${t}" uses every digit, record it`, tones: { [id]: "found" } }); }
          else raw.push({ note: `Choose '${ch}' for digit ${digits[i]}: path "${t}", go to digit ${digits[i + 1]}`, tones: { [id]: "active" } });
          go(i + 1, t, id);
        }
      };
      go(0, "", 0);
      raw.push({ note: `${out.length} combinations = 3 × 3: ${out.join(", ")}`, tones: {} });
      return searchTree(`letterCombinations("${digits}")`, nodes, raw);
    },
  },

  "subsets-ii": {
    approach: "Sort, then backtrack where every node is a subset; at one depth, skip a value equal to the one just tried so equal subsets are built once.",
    idea: ["Sorting puts equal values next to each other.", "go(start) records the current path as a subset, then tries each next element from start on.", "Two equal values tried at the same depth would start the same subtree twice, so skip nums[i] when i > start and nums[i] == nums[i - 1].", "Equal values can still be taken together, one per depth, which is how [2, 2] appears.", "There are at most 2ⁿ subsets, each copied in O(n)."],
    code: `def subsetsWithDup(nums):
    nums = sorted(nums)
    out, path = [], []
    def go(start):
        out.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return out`,
    lang: "python", time: "O(n × 2ⁿ)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 2], nodes: Node[] = [{ id: 0, label: "[]", parent: null }], raw: TreeFrame[] = [], path: number[] = [];
      let count = 1;
      raw.push({ note: `Sorted: ${list(a)}. Every node is a subset; the root [] is the first`, tones: { 0: "found" } });
      const go = (start: number, parent: number) => {
        for (let i = start; i < a.length; i++) {
          if (i > start && a[i] === a[i - 1]) { raw.push({ note: `Skip index ${i}: ${a[i]} equals the ${a[i]} already tried at this depth under ${list(path)}, it would repeat that subtree`, tones: { [parent]: "bad" } }); continue; }
          path.push(a[i]); const id = nodes.length; nodes.push({ id, label: list(path), parent, edge: `+${a[i]}` }); count++;
          raw.push({ note: `Choose ${a[i]} (index ${i}): record subset ${list(path)}`, tones: { [id]: "found" } });
          go(i + 1, id); path.pop();
        }
      };
      go(0, 0);
      raw.push({ note: `${count} distinct subsets, no duplicates and no set needed`, tones: {} });
      return searchTree(`subsetsWithDup(${list(a)})`, nodes, raw);
    },
  },

  "permutations-ii": {
    approach: "Sort and backtrack with used flags; skip a value equal to its left neighbour unless that neighbour is already in the path, so equal values are always placed left to right.",
    idea: ["Plain permutations of [1, 1, 2] list each arrangement twice, once per order of the two 1s.", "Sort so equal values sit together, and keep a used flag per index.", "Rule: use nums[i] only if nums[i - 1] differs or is already used. Then the copies of a value always enter the path in index order.", "Each distinct arrangement then has exactly one way to be built, so no result set is needed.", "There are at most n! leaves of length n."],
    code: `def permuteUnique(nums):
    nums = sorted(nums)
    out, path, used = [], [], [False] * len(nums)
    def go():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i in range(len(nums)):
            if used[i] or (i > 0 and nums[i] == nums[i - 1] and not used[i - 1]):
                continue
            used[i] = True
            path.append(nums[i])
            go()
            path.pop()
            used[i] = False
    go()
    return out`,
    lang: "python", time: "O(n × n!)", space: "O(n)",
    viz: () => {
      const a = [1, 1, 2], used = a.map(() => false), nodes: Node[] = [{ id: 0, label: "[]", parent: null }], raw: TreeFrame[] = [], path: number[] = [], out: string[] = [];
      raw.push({ note: `Sorted: ${list(a)}. Indices 0 and 1 hold equal values, so index 1 may only be used after index 0`, tones: { 0: "active" } });
      const go = (parent: number) => {
        if (path.length === a.length) return;
        for (let i = 0; i < a.length; i++) {
          if (used[i]) continue;
          if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) { raw.push({ note: `Under ${list(path)}: skip index ${i}, its equal neighbour (index ${i - 1}) is not in the path yet, so this order would repeat`, tones: { [parent]: "bad" } }); continue; }
          used[i] = true; path.push(a[i]);
          const id = nodes.length; nodes.push({ id, label: list(path), parent, edge: `#${i}` });
          if (path.length === a.length) { out.push(list(path)); raw.push({ note: `Choose index ${i}: ${list(path)} is complete, record it`, tones: { [id]: "found" } }); }
          else raw.push({ note: `Choose index ${i} (${a[i]}): path ${list(path)}`, tones: { [id]: "active" } });
          go(id); path.pop(); used[i] = false;
        }
      };
      go(0);
      raw.push({ note: `${out.length} distinct permutations: ${out.join(", ")}`, tones: {} });
      return searchTree(`permuteUnique(${list(a)})`, nodes, raw);
    },
  },

  "combination-sum-ii": {
    approach: "Sort, backtrack from a start index with each number used once (recurse on i + 1), skip equal values at the same depth, and break once a number exceeds what is left.",
    idea: ["Each candidate may be used at most once, so after choosing index i the search continues from i + 1.", "The input can hold duplicates; after sorting, skip candidates[i] when i > start and it equals candidates[i - 1], so the same combination is not built twice.", "Because the list is sorted, the first candidate bigger than the remaining target ends the loop: all later ones are bigger too.", "Record the path when the remaining target hits 0.", "In the worst case every subset is explored, 2ⁿ of them."],
    code: `def combinationSum2(candidates, target):
    cands = sorted(candidates)
    out, path = [], []
    def go(start, left):
        if left == 0:
            out.append(path[:])
            return
        for i in range(start, len(cands)):
            if i > start and cands[i] == cands[i - 1]:
                continue
            if cands[i] > left:
                break
            path.append(cands[i])
            go(i + 1, left - cands[i])
            path.pop()
    go(0, target)
    return out`,
    lang: "python", time: "O(n × 2ⁿ)", space: "O(n)",
    viz: () => {
      const a = [2, 5, 2, 1, 2].sort((x, y) => x - y), target = 5, nodes: Node[] = [{ id: 0, label: "[]", parent: null }], raw: TreeFrame[] = [], path: number[] = [], out: string[] = [];
      raw.push({ note: `Sorted candidates ${list(a)}, target ${target}. Each one used at most once`, tones: { 0: "active" } });
      const go = (start: number, left: number, parent: number) => {
        for (let i = start; i < a.length; i++) {
          if (i > start && a[i] === a[i - 1]) { raw.push({ note: `Under ${list(path)}: skip index ${i}, another ${a[i]} was already tried at this depth`, tones: { [parent]: "bad" } }); continue; }
          if (a[i] > left) { raw.push({ note: `Under ${list(path)}: ${a[i]} is more than the ${left} left. Sorted, so stop this loop`, tones: { [parent]: "bad" } }); break; }
          path.push(a[i]); const id = nodes.length; nodes.push({ id, label: list(path), parent, edge: `+${a[i]}` });
          if (left === a[i]) { out.push(list(path)); raw.push({ note: `Choose ${a[i]}: ${list(path)} sums to ${target}, record it`, tones: { [id]: "found" } }); }
          else { raw.push({ note: `Choose ${a[i]} (index ${i}): ${left - a[i]} left, continue from index ${i + 1}`, tones: { [id]: "active" } }); go(i + 1, left - a[i], id); }
          path.pop();
        }
      };
      go(0, target, 0);
      raw.push({ note: `Answers: ${out.join(", ")}`, tones: {} });
      return searchTree(`combinationSum2(target = ${target})`, nodes, raw);
    },
  },
};
