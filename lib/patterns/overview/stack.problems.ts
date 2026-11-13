// Must-do "stack" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [225, "Implement Stack using Queues", "implement-stack-using-queues", "Easy", false],
  [622, "Design Circular Queue", "design-circular-queue", "Medium", false],
  [946, "Validate Stack Sequences", "validate-stack-sequences", "Medium", false],
  [1047, "Remove All Adjacent Duplicates In String", "remove-all-adjacent-duplicates-in-string", "Easy", false],
  [933, "Number of Recent Calls", "number-of-recent-calls", "Easy", false],
  [641, "Design Circular Deque", "design-circular-deque", "Medium", false],
  [503, "Next Greater Element II", "next-greater-element-ii", "Medium", false],
  [1381, "Design a Stack With Increment Operation", "design-a-stack-with-increment-operation", "Medium", false],
  [856, "Score of Parentheses", "score-of-parentheses", "Medium", false],
  [316, "Remove Duplicate Letters", "remove-duplicate-letters", "Medium", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "implement-stack-using-queues": "stack:5",
  "design-circular-queue": "stack:5",
  "validate-stack-sequences": "stack:2",
  "remove-all-adjacent-duplicates-in-string": "stack:6",
  "number-of-recent-calls": "array:3",
};
