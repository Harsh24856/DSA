// Must-do "dp" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [509, "Fibonacci Number", "fibonacci-number", "Easy", false],
  [740, "Delete and Earn", "delete-and-earn", "Medium", false],
  [931, "Minimum Falling Path Sum", "minimum-falling-path-sum", "Medium", false],
  [474, "Ones and Zeroes", "ones-and-zeroes", "Medium", false],
  [329, "Longest Increasing Path in a Matrix", "longest-increasing-path-in-a-matrix", "Hard", false],
  [1277, "Count Square Submatrices with All Ones", "count-square-submatrices-with-all-ones", "Medium", false],
  [1105, "Filling Bookcase Shelves", "filling-bookcase-shelves", "Medium", false],
  [1641, "Count Sorted Vowel Strings", "count-sorted-vowel-strings", "Medium", false],
  [871, "Minimum Number of Refueling Stops", "minimum-number-of-refueling-stops", "Hard", false],
  [741, "Cherry Pickup", "cherry-pickup", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "fibonacci-number": "dp:1",
  "delete-and-earn": "dp:1",
  "minimum-falling-path-sum": "dp:5",
  "ones-and-zeroes": "dp:2",
  "longest-increasing-path-in-a-matrix": "recursion-backtracking:4",
};
