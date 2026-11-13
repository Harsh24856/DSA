// Must-do "trie" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [3043, "Find the Length of the Longest Common Prefix", "find-the-length-of-the-longest-common-prefix", "Medium", false],
  [820, "Short Encoding of Words", "short-encoding-of-words", "Medium", false],
  [2707, "Extra Characters in a String", "extra-characters-in-a-string", "Medium", false],
  [140, "Word Break II", "word-break-ii", "Hard", false],
  [2416, "Sum of Prefix Scores of Strings", "sum-of-prefix-scores-of-strings", "Hard", false],
  [1032, "Stream of Characters", "stream-of-characters", "Hard", false],
  [386, "Lexicographical Numbers", "lexicographical-numbers", "Medium", false],
  [336, "Palindrome Pairs", "palindrome-pairs", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "find-the-length-of-the-longest-common-prefix": "trie:1",
  "short-encoding-of-words": "trie:1",
  "extra-characters-in-a-string": "dp:1",
  "word-break-ii": "recursion-backtracking:4",
};
