// Must-do "bit-and-math" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [172, "Factorial Trailing Zeroes", "factorial-trailing-zeroes", "Medium", false],
  [89, "Gray Code", "gray-code", "Medium", false],
  [476, "Number Complement", "number-complement", "Easy", false],
  [166, "Fraction to Recurring Decimal", "fraction-to-recurring-decimal", "Medium", false],
  [1318, "Minimum Flips to Make a OR b Equal to c", "minimum-flips-to-make-a-or-b-equal-to-c", "Medium", false],
  [2433, "Find The Original Array of Prefix Xor", "find-the-original-array-of-prefix-xor", "Medium", false],
  [2429, "Minimize XOR", "minimize-xor", "Medium", false],
  [974, "Subarray Sums Divisible by K", "subarray-sums-divisible-by-k", "Medium", false],
  [1492, "The kth Factor of n", "the-kth-factor-of-n", "Medium", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "factorial-trailing-zeroes": "bit-and-math:9",
  "gray-code": "bit-and-math:2",
  "number-complement": "bit-and-math:1",
  "fraction-to-recurring-decimal": "bit-and-math:10",
};
