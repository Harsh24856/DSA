// Deeper theory and new patterns, one file per topic so they can be written in parallel.
import * as ARRAY from "./array";
import * as STRING from "./string";
import * as LINKEDLIST from "./linkedlist";
import * as STACK from "./stack";
import * as HEAP from "./heap";
import * as INTERVALS from "./intervals";
import * as BINARY_TREE from "./binary-tree";
import * as TRIE from "./trie";
import * as GRAPH from "./graph";
import * as RECURSION_BACKTRACKING from "./recursion-backtracking";
import * as DP from "./dp";
import * as GREEDY from "./greedy";
import * as BIT_AND_MATH from "./bit-and-math";
import * as LOGIC_TO_CODE from "./logic-to-code";
import type { Pattern } from "../types";

export const DEEP: Record<string, { THEORY: Record<number, string[]>; MORE: Pattern[] }> = {
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
