// Must-do "linkedlist" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [707, "Design Linked List", "design-linked-list", "Medium", false],
  [203, "Remove Linked List Elements", "remove-linked-list-elements", "Easy", false],
  [328, "Odd Even Linked List", "odd-even-linked-list", "Medium", false],
  [61, "Rotate List", "rotate-list", "Medium", false],
  [147, "Insertion Sort List", "insertion-sort-list", "Medium", false],
  [445, "Add Two Numbers II", "add-two-numbers-ii", "Medium", false],
  [2095, "Delete the Middle Node of a Linked List", "delete-the-middle-node-of-a-linked-list", "Medium", false],
  [430, "Flatten a Multilevel Doubly Linked List", "flatten-a-multilevel-doubly-linked-list", "Medium", false],
  [1171, "Remove Zero Sum Consecutive Nodes from Linked List", "remove-zero-sum-consecutive-nodes-from-linked-list", "Medium", false],
  [1669, "Merge In Between Linked Lists", "merge-in-between-linked-lists", "Medium", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "design-linked-list": "linkedlist:5",
  "remove-linked-list-elements": "linkedlist:5",
  "odd-even-linked-list": "linkedlist:4",
  "rotate-list": "linkedlist:4",
  "insertion-sort-list": "linkedlist:3",
};
