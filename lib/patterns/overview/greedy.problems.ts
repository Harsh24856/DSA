// Must-do "greedy" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [678, "Valid Parenthesis String", "valid-parenthesis-string", "Medium", false],
  [1899, "Merge Triplets to Form Target Triplet", "merge-triplets-to-form-target-triplet", "Medium", false],
  [738, "Monotone Increasing Digits", "monotone-increasing-digits", "Medium", false],
  [649, "Dota2 Senate", "dota2-senate", "Medium", false],
  [334, "Increasing Triplet Subsequence", "increasing-triplet-subsequence", "Medium", false],
  [945, "Minimum Increment to Make Array Unique", "minimum-increment-to-make-array-unique", "Medium", false],
  [1642, "Furthest Building You Can Reach", "furthest-building-you-can-reach", "Medium", false],
  [871, "Minimum Number of Refueling Stops", "minimum-number-of-refueling-stops", "Hard", false],
  [630, "Course Schedule III", "course-schedule-iii", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "valid-parenthesis-string": "greedy:2",
  "merge-triplets-to-form-target-triplet": "greedy:2",
  "monotone-increasing-digits": "bit-and-math:9",
  "dota2-senate": "greedy:5",
};
