// Extra visualisers per pattern (variants of the same idea). Keyed "topicId:patternNumber".
import * as S from "../sim";
import { nums, text, type Viz } from "./types";

export type Variant = Viz & { name: string };

export const EXTRAS: Record<string, Variant[]> = {
  "array:2": [{ name: "Trapping water", make: () => S.trapWater() }],
  "array:3": [
    { name: "Fixed size k", make: (i) => S.fixedWindow(nums(i, [2, 1, 5, 1, 3, 2, 7])), input: "2, 1, 5, 1, 3, 2, 7", label: "numbers (k = 3)" },
    { name: "Window maximum (deque)", make: (i) => S.monoDeque(nums(i, [1, 3, -1, -3, 5, 3, 6, 7])), input: "1, 3, -1, -3, 5, 3, 6, 7", label: "numbers (k = 3)" },
  ],
  "array:5": [{ name: "Cyclic placement", make: (i) => S.cyclicSort(nums(i, [3, 4, -1, 1], 8)), input: "3, 4, -1, 1", label: "numbers" }],
  "array:7": [{ name: "Search on the answer", make: () => S.answerSearch() }],
  "array:8": [{ name: "Merge sort", make: (i) => S.mergeSort(nums(i, [5, 2, 4, 6, 1, 3, 2, 6], 10)), input: "5, 2, 4, 6, 1, 3, 2, 6", label: "numbers" }],
  "string:2": [{ name: "Fixed window of counts", make: () => S.anagramCount() }],
  "string:4": [{ name: "Two pointers check", make: (i) => S.validPalindrome(text(i, "racecar", 16)), input: "racecar", label: "string" }],
  "linkedlist:1": [{ name: "Cycle in a number sequence", make: (i) => S.cycleNumber(Math.max(1, Math.min(999, Math.round(nums(i, [2])[0])))), input: "2", label: "starting number" }],
  "linkedlist:3": [{ name: "Merge k lists (heap)", make: () => S.kWayMerge() }],
  "linkedlist:4": [{ name: "Step 2 on its own: reverse", make: (i) => S.reverseList(nums(i, [4, 5, 6], 8)), input: "4, 5, 6", label: "list values" }],
  "stack:1": [{ name: "Same idea on heights", make: (i) => S.histogram(nums(i, [2, 1, 5, 6, 2, 3], 9)), input: "2, 1, 5, 6, 2, 3", label: "bar heights" }],
  "stack:4": [{ name: "Trapping water (two pointers)", make: () => S.trapWater() }],
  "heap:1": [
    { name: "How a heap works", make: () => S.heapOps() },
    { name: "Quickselect alternative", make: () => S.quickselect() },
  ],
  "heap:3": [{ name: "Two lists (no heap needed)", make: () => S.mergeLists() }],
  "binary-tree:1": [
    { name: "Preorder", make: () => S.treeTraversal("pre") },
    { name: "Postorder", make: () => S.treeTraversal("post") },
    { name: "Level order", make: () => S.treeTraversal("level") },
  ],
  "binary-tree:3": [{ name: "Inorder for contrast", make: () => S.treeTraversal("in") }],
  "trie:2": [{ name: "Building the trie", make: () => S.trieBuild(["bad", "dad", "mad"]) }],
  "graph:1": [{ name: "BFS for contrast", make: () => S.graphSearch("bfs") }],
  "graph:2": [{ name: "On a grid", make: () => S.gridFlood() }],
  "graph:5": [{ name: "With a negative edge (Bellman-Ford)", make: () => S.bellmanFord() }],
  "graph:7": [{ name: "Union-Find inside Kruskal", make: () => S.unionFind() }],
  "graph:8": [{ name: "Same flood as BFS on a graph", make: () => S.graphSearch("bfs") }],
  "recursion-backtracking:1": [{ name: "Reverse a list recursively", make: () => S.reverseList([1, 2, 3, 4]) }],
  "recursion-backtracking:3": [
    { name: "Fast power", make: () => S.fastPow() },
    { name: "Quickselect (one side only)", make: () => S.quickselect() },
  ],
  "recursion-backtracking:4": [{ name: "Same problem bottom-up", make: (i) => S.houseRobber(nums(i, [2, 7, 9, 3, 1], 9)), input: "2, 7, 9, 3, 1", label: "house values" }],
  "recursion-backtracking:5": [{ name: "Same subsets as bitmasks", make: () => S.bitmaskSubsets() }],
  "dp:1": [{ name: "Top-down with memo", make: () => S.recursionTree("fib") }],
  "dp:4": [{ name: "Grid paths (simpler table)", make: () => S.gridPaths() }],
  "dp:8": [{ name: "All masks of 3 items", make: () => S.bitmaskSubsets() }],
  "greedy:3": [{ name: "With cooldown it needs DP", make: () => S.stateMachine() }],
  "greedy:5": [{ name: "Top-K heap", make: () => S.topK() }],
  "bit-and-math:3": [{ name: "Same subsets as a decision tree", make: () => S.recursionTree("subsets") }],
  "bit-and-math:5": [{ name: "Prefix sums (the + version)", make: () => S.prefixSum() }],
  "bit-and-math:10": [{ name: "Fast and slow on a list", make: () => S.fastSlow() }],
};
