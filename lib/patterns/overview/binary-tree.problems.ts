// Must-do "binary-tree" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [1448, "Count Good Nodes in Binary Tree", "count-good-nodes-in-binary-tree", "Medium", false],
  [129, "Sum Root to Leaf Numbers", "sum-root-to-leaf-numbers", "Medium", false],
  [958, "Check Completeness of a Binary Tree", "check-completeness-of-a-binary-tree", "Medium", false],
  [938, "Range Sum of BST", "range-sum-of-bst", "Easy", false],
  [99, "Recover Binary Search Tree", "recover-binary-search-tree", "Medium", false],
  [863, "All Nodes Distance K in Binary Tree", "all-nodes-distance-k-in-binary-tree", "Medium", false],
  [437, "Path Sum III", "path-sum-iii", "Medium", false],
  [449, "Serialize and Deserialize BST", "serialize-and-deserialize-bst", "Medium", false],
  [979, "Distribute Coins in Binary Tree", "distribute-coins-in-binary-tree", "Medium", false],
  [968, "Binary Tree Cameras", "binary-tree-cameras", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "count-good-nodes-in-binary-tree": "binary-tree:1",
  "sum-root-to-leaf-numbers": "binary-tree:4",
  "check-completeness-of-a-binary-tree": "binary-tree:3",
  "range-sum-of-bst": "binary-tree:6",
};
