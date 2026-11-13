// Must-do "logic-to-code" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [36, "Valid Sudoku", "valid-sudoku", "Medium", false],
  [59, "Spiral Matrix II", "spiral-matrix-ii", "Medium", false],
  [1041, "Robot Bounded In Circle", "robot-bounded-in-circle", "Medium", false],
  [874, "Walking Robot Simulation", "walking-robot-simulation", "Medium", false],
  [289, "Game of Life", "game-of-life", "Medium", false],
  [1706, "Where Will the Ball Fall", "where-will-the-ball-fall", "Medium", false],
  [1222, "Queens That Can Attack the King", "queens-that-can-attack-the-king", "Medium", false],
  [2257, "Count Unguarded Cells in the Grid", "count-unguarded-cells-in-the-grid", "Medium", false],
  [1861, "Rotating the Box", "rotating-the-box", "Medium", false],
  [1329, "Sort the Matrix Diagonally", "sort-the-matrix-diagonally", "Medium", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "valid-sudoku": "logic-to-code:1",
  "spiral-matrix-ii": "logic-to-code:1",
  "robot-bounded-in-circle": "logic-to-code:3",
  "walking-robot-simulation": "logic-to-code:3",
};
