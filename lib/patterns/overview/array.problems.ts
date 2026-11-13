// Must-do "array" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [88, "Merge Sorted Array", "merge-sorted-array", "Easy", false],
  [26, "Remove Duplicates from Sorted Array", "remove-duplicates-from-sorted-array", "Easy", false],
  [706, "Design HashMap", "design-hashmap", "Easy", false],
  [380, "Insert Delete GetRandom O(1)", "insert-delete-getrandom-o1", "Medium", false],
  [442, "Find All Duplicates in an Array", "find-all-duplicates-in-an-array", "Medium", false],
  [525, "Contiguous Array", "contiguous-array", "Medium", false],
  [974, "Subarray Sums Divisible by K", "subarray-sums-divisible-by-k", "Medium", false],
  [454, "4Sum II", "4sum-ii", "Medium", false],
  [1146, "Snapshot Array", "snapshot-array", "Medium", false],
  [164, "Maximum Gap", "maximum-gap", "Medium", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "merge-sorted-array": "array:2",
  "remove-duplicates-from-sorted-array": "array:2",
  "design-hashmap": "string:3",
  "insert-delete-getrandom-o1": "array:5",
};
