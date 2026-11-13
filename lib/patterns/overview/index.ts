// Topic overviews, one file per topic.
import { OVERVIEW as ARRAY } from "./array";
import { OVERVIEW as STRING } from "./string";
import { OVERVIEW as LINKEDLIST } from "./linkedlist";
import { OVERVIEW as STACK } from "./stack";
import { OVERVIEW as HEAP } from "./heap";
import { OVERVIEW as INTERVALS } from "./intervals";
import { OVERVIEW as BINARY_TREE } from "./binary-tree";
import { OVERVIEW as TRIE } from "./trie";
import { OVERVIEW as GRAPH } from "./graph";
import { OVERVIEW as RECURSION_BACKTRACKING } from "./recursion-backtracking";
import { OVERVIEW as DP } from "./dp";
import { OVERVIEW as GREEDY } from "./greedy";
import { OVERVIEW as BIT_AND_MATH } from "./bit-and-math";
import { OVERVIEW as LOGIC_TO_CODE } from "./logic-to-code";
import type { TopicOverview } from "../types";

export const OVERVIEWS: Record<string, TopicOverview | undefined> = {
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
