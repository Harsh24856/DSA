// Must-do "recursion-backtracking" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [22, "Generate Parentheses", "generate-parentheses", "Medium", false],
  [17, "Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "Medium", false],
  [90, "Subsets II", "subsets-ii", "Medium", false],
  [47, "Permutations II", "permutations-ii", "Medium", false],
  [40, "Combination Sum II", "combination-sum-ii", "Medium", false],
  [216, "Combination Sum III", "combination-sum-iii", "Medium", false],
  [784, "Letter Case Permutation", "letter-case-permutation", "Medium", false],
  [980, "Unique Paths III", "unique-paths-iii", "Hard", false],
  [37, "Sudoku Solver", "sudoku-solver", "Hard", false],
  [301, "Remove Invalid Parentheses", "remove-invalid-parentheses", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "generate-parentheses": "recursion-backtracking:5",
  "letter-combinations-of-a-phone-number": "recursion-backtracking:5",
  "subsets-ii": "recursion-backtracking:5",
  "permutations-ii": "recursion-backtracking:5",
  "combination-sum-ii": "recursion-backtracking:5",
};
