// The study order: topics in the order their ideas build on each other, and inside each topic, every pattern after the
// patterns it needs (NEEDS). STUDY_PATH is the whole route, pattern by pattern, across topics.
// Pattern numbers (n) never change, because links (#p-n), progress and the solve map use them; only the order shown does.

export type Stage = { title: string; blurb: string; topics: string[] };

/** Topics in the order to study them, grouped into stages. Each topic leans only on the ones before it. */
export const STAGES: Stage[] = [
  { title: "Foundations", blurb: "Indexes, loops and counting. Every later topic is built on these.", topics: ["array", "string", "logic-to-code", "bit-and-math"] },
  { title: "Linear structures", blurb: "Pointers and the order things arrive in.", topics: ["linkedlist", "stack"] },
  { title: "Recursion and trees", blurb: "Thinking in subproblems, then the structures recursion is made for.", topics: ["recursion-backtracking", "binary-tree", "heap"] },
  { title: "Sorting-based techniques", blurb: "Sort first, then decide one step at a time.", topics: ["intervals", "greedy"] },
  { title: "Graphs", blurb: "Everything above, generalised to any connections.", topics: ["trie", "graph"] },
  { title: "Dynamic programming", blurb: "Recursion plus memory. Hardest last, once the rest is solid.", topics: ["dp"] },
];

/** Why each topic sits where it does, shown on its Overview. */
export const WHY: Record<string, string> = {
  "array": "Start here: contiguous memory and indexes are the base of almost every question.",
  "string": "A string is an array of characters, so every array technique carries over.",
  "logic-to-code": "Turning a described process into correct loops and index arithmetic, with no special structure.",
  "bit-and-math": "Small tools (bits, gcd, primes, modulo) that later topics use as building blocks.",
  "linkedlist": "The first structure made of pointers instead of indexes.",
  "stack": "Stacks and queues add an order of processing on top of arrays and lists.",
  "recursion-backtracking": "Learn to trust a function that calls itself before trees and DP depend on it.",
  "binary-tree": "Trees are recursion made visible: every pattern here is a recursive function.",
  "heap": "A heap is a complete binary tree stored in an array, so it needs both topics before it.",
  "intervals": "Sorting by start or end, then a sweep or a heap.",
  "greedy": "Sort, then pick the locally best choice, and learn to prove it is safe.",
  "trie": "A tree keyed by characters: the step from trees to general graphs.",
  "graph": "Trees, queues, stacks and heaps all reappear as BFS, DFS and shortest paths.",
  "dp": "Memoised recursion over states: it needs recursion, arrays and graphs thinking, so it comes last.",
};

/**
 * What each pattern needs first: "topic:n" keys, from any topic. This is the source of the order: a pattern is only
 * taught after everything it builds on. Patterns with no entry need nothing beyond their topic's Overview.
 */
export const NEEDS: Record<string, string[]> = {
  // arrays
  "array:2": ["array:8"], "array:3": ["array:2"], "array:7": ["array:8"], "array:4": ["array:1"], "array:9": ["array:1"],
  "array:5": ["array:2"], "array:10": ["array:5"], "array:6": ["array:8"], "array:11": ["array:3", "stack:1"],
  "array:12": ["array:8", "recursion-backtracking:3"], "array:14": ["array:1", "bit-and-math:1"],
  "array:15": ["array:1", "recursion-backtracking:3", "binary-tree:1"],
  // strings
  "string:1": ["array:2"], "string:4": ["string:1"], "string:2": ["array:3", "string:3"], "string:5": ["string:1"],
  "string:8": ["string:3", "bit-and-math:8"], "string:7": ["string:5"], "string:9": ["string:4", "string:7"],
  // logic to code
  "logic-to-code:2": ["logic-to-code:1"], "logic-to-code:3": ["logic-to-code:1"],
  // bits and maths
  "bit-and-math:4": ["bit-and-math:1"], "bit-and-math:2": ["bit-and-math:1"], "bit-and-math:8": ["bit-and-math:1"],
  "bit-and-math:10": ["bit-and-math:9"], "bit-and-math:3": ["bit-and-math:1"], "bit-and-math:5": ["bit-and-math:2", "array:1"],
  "bit-and-math:12": ["bit-and-math:8", "bit-and-math:6"], "bit-and-math:11": ["bit-and-math:3", "dp:1"],
  // linked lists
  "linkedlist:2": ["linkedlist:5"], "linkedlist:1": ["linkedlist:5"], "linkedlist:3": ["linkedlist:1"],
  "linkedlist:4": ["linkedlist:1", "linkedlist:2", "linkedlist:3"], "linkedlist:6": ["linkedlist:5"],
  // stacks and queues
  "stack:1": ["stack:2"], "stack:5": ["stack:2"], "stack:4": ["stack:1"], "stack:3": ["stack:2", "string:6"], "stack:6": ["stack:1"],
  // recursion and backtracking
  "recursion-backtracking:2": ["recursion-backtracking:1"], "recursion-backtracking:3": ["recursion-backtracking:2"],
  "recursion-backtracking:4": ["recursion-backtracking:1"], "recursion-backtracking:5": ["recursion-backtracking:1"],
  "recursion-backtracking:6": ["recursion-backtracking:5", "array:7"],
  // binary trees
  "binary-tree:1": ["recursion-backtracking:1"], "binary-tree:2": ["binary-tree:1"], "binary-tree:3": ["binary-tree:1"],
  "binary-tree:4": ["binary-tree:2"], "binary-tree:6": ["binary-tree:1", "array:7"], "binary-tree:5": ["binary-tree:1", "recursion-backtracking:3"],
  "binary-tree:7": ["binary-tree:2", "recursion-backtracking:4"], "binary-tree:9": ["binary-tree:1"], "binary-tree:8": ["binary-tree:4", "bit-and-math:1"],
  // heaps
  "heap:2": ["heap:1", "string:3"], "heap:3": ["heap:1", "linkedlist:3"], "heap:5": ["heap:1", "array:8"], "heap:4": ["heap:1"], "heap:6": ["heap:4"],
  // intervals
  "intervals:1": ["array:8"], "intervals:4": ["intervals:1", "array:2"], "intervals:3": ["intervals:1"], "intervals:6": ["intervals:1", "heap:1"],
  "intervals:2": ["intervals:1", "array:9"], "intervals:7": ["intervals:3"], "intervals:5": ["intervals:2", "binary-tree:6"],
  // greedy
  "greedy:4": ["string:3"], "greedy:1": ["intervals:3"], "greedy:7": ["array:8"], "greedy:6": ["array:2"], "greedy:5": ["heap:5"], "greedy:8": ["greedy:7"],
  // tries
  "trie:1": ["binary-tree:1"], "trie:5": ["trie:1"], "trie:2": ["trie:1", "recursion-backtracking:5"], "trie:3": ["trie:1", "recursion-backtracking:5"],
  "trie:4": ["trie:1", "bit-and-math:1"],
  // graphs
  "graph:1": ["recursion-backtracking:1"], "graph:8": ["graph:1", "graph:2"], "graph:10": ["graph:2"], "graph:9": ["graph:1", "graph:2"],
  "graph:3": ["graph:1", "graph:2"], "graph:4": ["graph:1"], "graph:5": ["graph:2", "heap:1"], "graph:13": ["graph:5"], "graph:6": ["graph:5"],
  "graph:7": ["graph:4", "heap:1"], "graph:11": ["graph:1"], "graph:12": ["graph:3"], "graph:14": ["graph:1"],
  // dynamic programming
  "dp:1": ["recursion-backtracking:4"], "dp:5": ["dp:1"], "dp:2": ["dp:1"], "dp:3": ["dp:1", "array:7"], "dp:4": ["dp:5"],
  "dp:12": ["dp:5", "bit-and-math:12"], "dp:7": ["dp:1"], "dp:6": ["dp:5"], "dp:11": ["dp:6"], "dp:10": ["dp:1", "binary-tree:2"],
  "dp:8": ["dp:2", "bit-and-math:3"], "dp:9": ["dp:1", "recursion-backtracking:4"],
};

/** Pattern numbers of each topic in teaching order: what a pattern needs from its own topic always comes before it. */
export const PATTERN_ORDER: Record<string, number[]> = {
  "array": [8, 1, 2, 3, 7, 4, 9, 5, 10, 13, 6, 11, 12, 14, 15],
  "string": [3, 1, 4, 2, 6, 5, 8, 7, 9],
  "logic-to-code": [1, 2, 3],
  "bit-and-math": [1, 4, 2, 9, 6, 7, 8, 10, 3, 5, 12, 11],
  "linkedlist": [5, 2, 1, 3, 4, 6],
  "stack": [2, 1, 5, 4, 3, 6],
  "recursion-backtracking": [1, 2, 3, 4, 5, 6],
  "binary-tree": [1, 2, 3, 4, 6, 5, 7, 9, 8],
  "heap": [1, 2, 3, 5, 4, 6],
  "intervals": [1, 4, 3, 6, 2, 7, 5],
  "greedy": [3, 2, 4, 1, 7, 6, 5, 8],
  "trie": [1, 5, 2, 3, 4],
  "graph": [1, 2, 8, 10, 9, 3, 4, 5, 13, 6, 7, 11, 12, 14],
  "dp": [1, 5, 2, 3, 4, 12, 7, 6, 11, 10, 8, 9],
};

export const TOPIC_ORDER = STAGES.flatMap((s) => s.topics);
export const stageOf = (topic: string) => STAGES.find((s) => s.topics.includes(topic));

/**
 * The whole route, pattern by pattern: topics in order, each topic's patterns in order, but a pattern that needs one
 * from a later topic waits until that one has been placed. Throws if NEEDS has a cycle or a key that does not exist.
 */
export function studyPath(exists: Set<string>): string[] {
  for (const [k, ns] of Object.entries(NEEDS)) for (const x of [k, ...ns]) if (!exists.has(x)) throw new Error(`lib/patterns/order.ts: unknown pattern ${x}`);
  for (const [t, order] of Object.entries(PATTERN_ORDER)) order.forEach((n, i) => {
    for (const need of NEEDS[`${t}:${n}`] ?? []) if (need.startsWith(`${t}:`) && order.indexOf(+need.split(":")[1]) > i) throw new Error(`lib/patterns/order.ts: ${t}:${n} comes before ${need}, which it needs`);
  });
  const placed = new Set<string>(), path: string[] = [];
  const todo = TOPIC_ORDER.flatMap((t) => (PATTERN_ORDER[t] ?? []).map((n) => `${t}:${n}`));
  while (path.length < todo.length) {
    const next = todo.find((k) => !placed.has(k) && (NEEDS[k] ?? []).every((x) => placed.has(x)));
    if (!next) throw new Error("lib/patterns/order.ts: NEEDS has a cycle");
    placed.add(next); path.push(next);
  }
  return path;
}
