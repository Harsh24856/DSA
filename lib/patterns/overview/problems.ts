// Must-do questions per topic (list 0 of each topic in PATTERN_PROBLEMS) and where the new ones map.
import { MUST as ARRAY, MAP as ARRAY_MAP } from "./array.problems.ts";
import { MUST as STRING, MAP as STRING_MAP } from "./string.problems.ts";
import { MUST as LINKEDLIST, MAP as LINKEDLIST_MAP } from "./linkedlist.problems.ts";
import { MUST as STACK, MAP as STACK_MAP } from "./stack.problems.ts";
import { MUST as HEAP, MAP as HEAP_MAP } from "./heap.problems.ts";
import { MUST as INTERVALS, MAP as INTERVALS_MAP } from "./intervals.problems.ts";
import { MUST as BINARY_TREE, MAP as BINARY_TREE_MAP } from "./binary-tree.problems.ts";
import { MUST as TRIE, MAP as TRIE_MAP } from "./trie.problems.ts";
import { MUST as GRAPH, MAP as GRAPH_MAP } from "./graph.problems.ts";
import { MUST as RECURSION_BACKTRACKING, MAP as RECURSION_BACKTRACKING_MAP } from "./recursion-backtracking.problems.ts";
import { MUST as DP, MAP as DP_MAP } from "./dp.problems.ts";
import { MUST as GREEDY, MAP as GREEDY_MAP } from "./greedy.problems.ts";
import { MUST as BIT_AND_MATH, MAP as BIT_AND_MATH_MAP } from "./bit-and-math.problems.ts";
import { MUST as LOGIC_TO_CODE, MAP as LOGIC_TO_CODE_MAP } from "./logic-to-code.problems.ts";
import type { PProblem } from "../problems.ts";

export const MUST_PROBLEMS: Record<string, PProblem[]> = {
  "array": ARRAY,
  "string": STRING,
  "linkedlist": LINKEDLIST,
  "stack": STACK,
  "heap": HEAP,
  "intervals": INTERVALS,
  "binary-tree": BINARY_TREE,
  "trie": TRIE,
  "graph": GRAPH,
  "recursion-backtracking": RECURSION_BACKTRACKING,
  "dp": DP,
  "greedy": GREEDY,
  "bit-and-math": BIT_AND_MATH,
  "logic-to-code": LOGIC_TO_CODE,
};
export const MUST_MAP: Record<string, string> = { ...ARRAY_MAP, ...STRING_MAP, ...LINKEDLIST_MAP, ...STACK_MAP, ...HEAP_MAP, ...INTERVALS_MAP, ...BINARY_TREE_MAP, ...TRIE_MAP, ...GRAPH_MAP, ...RECURSION_BACKTRACKING_MAP, ...DP_MAP, ...GREEDY_MAP, ...BIT_AND_MATH_MAP, ...LOGIC_TO_CODE_MAP };
