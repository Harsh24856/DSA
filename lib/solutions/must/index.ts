// Solutions for the must-do questions added with the topic overviews.
import { MUST_SOLUTIONS as ARRAY } from "./array.ts";
import { MUST_SOLUTIONS as STRING } from "./string.ts";
import { MUST_SOLUTIONS as LINKEDLIST } from "./linkedlist.ts";
import { MUST_SOLUTIONS as STACK } from "./stack.ts";
import { MUST_SOLUTIONS as HEAP } from "./heap.ts";
import { MUST_SOLUTIONS as INTERVALS } from "./intervals.ts";
import { MUST_SOLUTIONS as BINARY_TREE } from "./binary-tree.ts";
import { MUST_SOLUTIONS as TRIE } from "./trie.ts";
import { MUST_SOLUTIONS as GRAPH } from "./graph.ts";
import { MUST_SOLUTIONS as RECURSION_BACKTRACKING } from "./recursion-backtracking.ts";
import { MUST_SOLUTIONS as DP } from "./dp.ts";
import { MUST_SOLUTIONS as GREEDY } from "./greedy.ts";
import { MUST_SOLUTIONS as BIT_AND_MATH } from "./bit-and-math.ts";
import { MUST_SOLUTIONS as LOGIC_TO_CODE } from "./logic-to-code.ts";
import type { Solution } from "../types";

export const MUST: Record<string, Solution> = { ...ARRAY, ...STRING, ...LINKEDLIST, ...STACK, ...HEAP, ...INTERVALS, ...BINARY_TREE, ...TRIE, ...GRAPH, ...RECURSION_BACKTRACKING, ...DP, ...GREEDY, ...BIT_AND_MATH, ...LOGIC_TO_CODE };
