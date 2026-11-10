// Last-day revision sheets, built on the server from the site's own content, so they always match the chapters:
// DSA from the pattern library plus C++ templates, every CS core subject from its interview cards, Gen AI from the
// playbook's question blocks. Only the /other/revise pages import this.
import { GENAI } from "../genai/content";
import { SUBJECT_IDS, loadSubject, partsOf, type SubjectId } from "../other";
import type { Table } from "../other/types";
import { TOPICS } from "../patterns";
import { PLAIN } from "../patterns/plain";
import { CPP_TEMPLATES, type CppTemplate } from "./cpp";
import { htmlQuestions, short, type RevItem } from "./extract";
import { FACTS } from "./facts";

export type RevSection = { id: string; title: string; lead?: string; points?: string[]; items?: RevItem[]; table?: Table; code?: CppTemplate[] };
export type Sheet = { id: string; title: string; blurb: string; sections: RevSection[] };
export type SheetSummary = { id: string; title: string; blurb: string; items: number };

export const SHEET_IDS = ["dsa", ...SUBJECT_IDS, "genai"] as const;
export type SheetId = (typeof SHEET_IDS)[number];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const COMPLEXITY: Table = { head: ["C++ container", "Main operations", "Cost"], rows: [
  ["vector", "index, push_back, pop_back / insert or erase in the middle", "O(1), amortized O(1) / O(n)"],
  ["deque", "push and pop at both ends, index", "O(1)"],
  ["stack, queue", "push, pop, top / front", "O(1)"],
  ["priority_queue", "push, pop / top", "O(log n) / O(1)"],
  ["set, map, multiset", "insert, erase, find, lower_bound", "O(log n), kept sorted"],
  ["unordered_set, unordered_map", "insert, erase, find", "O(1) average, O(n) worst"],
  ["sort / stable_sort", "sort a range", "O(n log n)"],
  ["lower_bound, binary_search", "search a sorted range", "O(log n)"],
  ["nth_element", "k-th smallest, partially ordered", "O(n) average"],
] };
const LIMITS: Table = { head: ["Input size n", "Aim for", "Typical idea"], rows: [
  ["n ≤ 10", "O(n!)", "try every permutation"],
  ["n ≤ 20", "O(2^n · n)", "subsets, bitmask DP"],
  ["n ≤ 500", "O(n^3)", "Floyd-Warshall, interval DP"],
  ["n ≤ 5,000", "O(n^2)", "two nested loops, 2D DP"],
  ["n ≤ 10^6", "O(n log n)", "sorting, heaps, binary search"],
  ["n ≤ 10^8", "O(n)", "one pass, two pointers, prefix sums"],
  ["larger", "O(log n) or O(1)", "math, binary search on the answer"],
] };
const SORTS: Table = { head: ["Sort", "Best", "Average", "Worst", "Extra space", "Stable"], rows: [
  ["Bubble", "O(n)", "O(n^2)", "O(n^2)", "O(1)", "yes"],
  ["Insertion", "O(n)", "O(n^2)", "O(n^2)", "O(1)", "yes"],
  ["Selection", "O(n^2)", "O(n^2)", "O(n^2)", "O(1)", "no"],
  ["Merge", "O(n log n)", "O(n log n)", "O(n log n)", "O(n)", "yes"],
  ["Quick", "O(n log n)", "O(n log n)", "O(n^2)", "O(log n)", "no"],
  ["Heap", "O(n log n)", "O(n log n)", "O(n log n)", "O(1)", "no"],
  ["Counting", "O(n + k)", "O(n + k)", "O(n + k)", "O(k)", "yes"],
] };

const METHOD: RevItem[] = [
  { q: "1. Clarify before coding", a: "Restate the problem. Ask about input size, negatives, duplicates, empty input, sorted or not, and the exact output. The constraints usually name the algorithm." },
  { q: "2. Work one example by hand", a: "Use the given example, then make one edge case of your own. Many wrong ideas die here, before any code." },
  { q: "3. Say the brute force and its cost", a: "One sentence: what it does and its time and space. It proves you understand the problem and sets the baseline to beat." },
  { q: "4. Find the repeated work", a: "Ask what the brute force recomputes. Then reach for the tool that removes it: a hash map, sorting, two pointers, prefix sums, a heap, a stack, binary search or DP. Check it fits the input size." },
  { q: "5. Agree the plan, then code", a: "Explain the approach and its complexity, get a nod, then code in small named helpers while talking." },
  { q: "6. Test out loud", a: "Trace the example through your code line by line, then the edge cases. Fix bugs aloud; interviewers grade debugging too." },
  { q: "7. State the final complexity", a: "Time and space, counting the recursion stack and the output. Mention one trade-off or follow-up you would make." },
];
const KEYWORDS: Table = { head: ["When the problem says", "Think of"], rows: [
  ["sorted array, O(log n), find a position", "binary search"],
  ["minimize the maximum, maximize the minimum, least capacity", "binary search on the answer"],
  ["pair or triplet with a sum, sorted input", "two pointers, or a hash map if unsorted"],
  ["longest or shortest substring or subarray with a condition", "sliding window"],
  ["subarray sum equals k, range sums", "prefix sums with a hash map"],
  ["next greater or smaller, stock span, histogram", "monotonic stack"],
  ["max or min of every window", "monotonic deque"],
  ["top k, k-th largest, median of a stream", "heap (two heaps for the median)"],
  ["all subsets, permutations, combinations", "backtracking"],
  ["fewest steps, unweighted shortest path, grid", "BFS"],
  ["weighted shortest path, non-negative weights", "Dijkstra"],
  ["prerequisites, order of tasks", "topological sort"],
  ["groups, connected, merge sets, redundant edge", "union-find or DFS"],
  ["count ways, minimum cost, maximum profit with choices", "dynamic programming"],
  ["intervals, meetings, overlaps", "sort by start, then sweep"],
  ["prefixes of words, autocomplete", "trie"],
  ["range queries with updates", "Fenwick tree or segment tree"],
  ["valid parentheses, nested structure, undo", "stack"],
  ["cycle or middle of a linked list", "fast and slow pointers"],
  ["appears once, XOR, n up to about 20", "bit manipulation, bitmasks"],
  ["find a pattern in a text", "KMP or rolling hash"],
] };
const EDGES: Table = { head: ["Input", "Test with"], rows: [
  ["Array", "empty, one element, all equal, already sorted, reverse sorted, negatives, duplicates, the largest size"],
  ["String", "empty, one character, all the same character, spaces and mixed case, a palindrome"],
  ["Numbers", "0, negatives, INT_MAX and INT_MIN (overflow), results that need long long"],
  ["Linked list", "empty, one node, two nodes, a cycle"],
  ["Tree", "empty, one node, completely skewed (it is really a linked list), duplicate values"],
  ["Graph", "one node, disconnected parts, cycles, self-loops, multiple edges between two nodes"],
  ["Intervals", "touching endpoints, one inside another, unsorted input"],
] };
const GOTCHAS: RevItem[] = [
  { q: "int overflow", a: "Two ints up to 10^9 multiply past 2^31. Use `long long`, and write `1LL * a * b` so the multiplication itself is 64-bit." },
  { q: "Unsigned size()", a: "`v.size() - 1` on an empty vector is a huge number, not -1. Cast first: `(int)v.size() - 1`." },
  { q: "map[key] inserts", a: "Reading `m[k]` creates the key with a default value. Test membership with `count` or `find`." },
  { q: "Comparators must be strict", a: "A sort comparator must return `a < b`, never `a <= b`; otherwise `sort` has undefined behaviour and can crash." },
  { q: "endl is slow", a: "`endl` flushes every line. Use `'\\n'` and `ios::sync_with_stdio(false); cin.tie(nullptr);` for big inputs and outputs." },
  { q: "Copies by value", a: "Passing a `vector` or `string` by value copies it on every call. Pass `const T&`, or `T&` to change it." },
  { q: "Erasing while iterating", a: "After `erase`, the iterator is dead. Write `it = m.erase(it)`, or use C++20 `erase_if`." },
  { q: "Deep recursion", a: "Around 10^5 to 10^6 nested calls overflow the stack. Use an explicit stack or BFS for big inputs." },
  { q: "priority_queue order", a: "It is a max-heap. For a min-heap write `priority_queue<int, vector<int>, greater<int>>`." },
  { q: "Negative division and modulo", a: "`-7 / 2` is -3 and `-7 % 2` is -1 in C++. For a non-negative modulo use `((a % m) + m) % m`." },
  { q: "memset", a: "`memset` sets bytes, so it only works for 0 and -1 in int arrays. Use `fill` or a vector constructor otherwise." },
  { q: "Midpoint overflow", a: "`(lo + hi) / 2` can overflow; write `lo + (hi - lo) / 2`." },
];

function dsaSheet(): Sheet {
  const patterns: RevSection[] = TOPICS.map((t) => ({
    id: `p-${t.id}`, title: `Patterns: ${t.name}`,
    items: t.patterns.map((p) => {
      const key = `${t.id}:${p.n}`;
      return {
        q: p.name,
        a: `**Spot it:** ${p.signals.slice(0, 2).join("; ")}. **Remember:** ${PLAIN[key]?.remember ?? p.summary} **Cost:** ${p.complexity.average} time, ${p.complexity.space} space.`,
        trap: p.traps[0],
      };
    }),
  }));
  return {
    id: "dsa", title: "DSA tech interview cheat sheet", blurb: "How to run a coding interview, which pattern a problem is asking for, the edge cases to test, the C++ mistakes that fail submissions, the complexities to quote, 28 tested C++ templates, and all 85 patterns with their signals and traps.",
    sections: [
      { id: "method", title: "How to solve it in the interview", items: METHOD },
      { id: "keywords", title: "Which pattern is this?", lead: "The wording of a problem usually gives the pattern away.", table: KEYWORDS },
      { id: "limits", title: "Input size to complexity", lead: "Read the constraints first: they tell you which algorithm the interviewer expects. About 10^8 simple operations run in a second.", table: LIMITS },
      { id: "edges", title: "Edge cases to test", table: EDGES },
      { id: "gotchas", title: "C++ mistakes that fail submissions", items: GOTCHAS },
      { id: "containers", title: "C++ containers and their costs", table: COMPLEXITY },
      { id: "sorting", title: "Sorting algorithms", table: SORTS },
      { id: "cpp", title: "C++ templates to know by heart", lead: "Each one compiles and passes its own test on every check. Read the comment lines: they are the parts people get wrong.", code: CPP_TEMPLATES },
      ...patterns,
    ],
  };
}

async function subjectSheet(id: SubjectId): Promise<Sheet> {
  const s = await loadSubject(id);
  const chapters: RevSection[] = partsOf(s.chapters, s.parts).flatMap((part) => part.chapters.map((c) => ({
    id: c.id, title: part.title ? `${part.title}: ${c.title}` : c.title,
    lead: short(c.summary, 240),
    points: c.points,
    table: c.table,
    items: c.cards.map((x) => ({ q: x.q, a: short(x.a), trap: x.trap ? short(x.trap, 200) : undefined })),
  })));
  // the sheet must cover the whole subject: every chapter and every interview question
  const cards = s.chapters.reduce((n, c) => n + c.cards.length, 0), listed = chapters.reduce((n, c) => n + (c.items?.length ?? 0), 0);
  if (chapters.length !== s.chapters.length || listed !== cards) throw new Error(`revision sheet ${id} misses chapters or questions`);
  const facts = FACTS[id] ?? [];
  return {
    id, title: s.name,
    blurb: `The ${s.name} facts to know cold, then every chapter's key points and every interview question on this site with the answer to give first and the trap interviewers wait for.`,
    sections: [...facts.map((f) => ({ ...f, title: `Must know: ${f.title}` })), ...chapters],
  };
}

function genaiSheet(): Sheet {
  const order = ["interview", ...GENAI.filter((g) => g.module).map((g) => g.id), "design"];
  const sections = order.flatMap((id) => {
    const g = GENAI.find((x) => x.id === id);
    const items = g ? htmlQuestions(g.html) : [];
    return g && items.length ? [{ id: slug(g.id), title: g.title, items }] : [];
  });
  return { id: "genai", title: "Gen AI", blurb: "The top Gen AI engineer interview questions first, then every question from each module and the system design sheet, with short answers.", sections };
}

export async function buildSheet(id: SheetId): Promise<Sheet> {
  if (id === "dsa") return dsaSheet();
  if (id === "genai") return genaiSheet();
  return subjectSheet(id);
}

export const countItems = (s: Sheet) => s.sections.reduce((n, x) => n + (x.items?.length ?? 0) + (x.code?.length ?? 0), 0);
