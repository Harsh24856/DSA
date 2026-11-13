// Must-do "string" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [12, "Integer to Roman", "integer-to-roman", "Medium", false],
  [6, "Zigzag Conversion", "zigzag-conversion", "Medium", false],
  [443, "String Compression", "string-compression", "Medium", false],
  [392, "Is Subsequence", "is-subsequence", "Easy", false],
  [791, "Custom Sort String", "custom-sort-string", "Medium", false],
  [1657, "Determine if Two Strings Are Close", "determine-if-two-strings-are-close", "Medium", false],
  [1347, "Minimum Number of Steps to Make Two Strings Anagram", "minimum-number-of-steps-to-make-two-strings-anagram", "Medium", false],
  [2785, "Sort Vowels in a String", "sort-vowels-in-a-string", "Medium", false],
  [848, "Shifting Letters", "shifting-letters", "Medium", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "integer-to-roman": "bit-and-math:9",
  "zigzag-conversion": "logic-to-code:1",
  "string-compression": "string:1",
  "is-subsequence": "string:1",
};
