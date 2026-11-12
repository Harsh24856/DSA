// Practice lists for the new patterns, merged into PATTERN_PROBLEMS by lib/patterns/problems.ts.
import { PROBLEMS as ARRAY } from "./array.problems.ts";
import { PROBLEMS as STRING } from "./string.problems.ts";
import { PROBLEMS as LINKEDLIST } from "./linkedlist.problems.ts";
import { PROBLEMS as STACK } from "./stack.problems.ts";
import { PROBLEMS as HEAP } from "./heap.problems.ts";
import { PROBLEMS as INTERVALS } from "./intervals.problems.ts";
import { PROBLEMS as BINARY_TREE } from "./binary-tree.problems.ts";
import { PROBLEMS as TRIE } from "./trie.problems.ts";
import { PROBLEMS as GRAPH } from "./graph.problems.ts";
import { PROBLEMS as RECURSION_BACKTRACKING } from "./recursion-backtracking.problems.ts";
import { PROBLEMS as DP } from "./dp.problems.ts";
import { PROBLEMS as GREEDY } from "./greedy.problems.ts";
import { PROBLEMS as BIT_AND_MATH } from "./bit-and-math.problems.ts";
import { PROBLEMS as LOGIC_TO_CODE } from "./logic-to-code.problems.ts";
import type { PProblem } from "../problems.ts";

export const MORE_PROBLEMS: Record<string, Record<number, PProblem[]>> = {
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
