import * as S from "../sim";
import { nums, type Topic } from "./types";

export const LOGIC: Topic = {
  id: "logic-to-code", name: "Logic to code",
  blurb: "Problems where the idea fits in one line but clean code takes practice: matrices, simulations and string cleanup. The skill tested is translation, not insight.",
  basics: ["Write the one-line idea on paper before typing.", "Name the trap first: boundaries, double counting, in-place overwrites.", "Time yourself; the goal is a faster translation step."],
  patterns: [
    {
      n: 1, name: "Matrix and simulation", summary: "Track boundaries or indices explicitly and update them in a fixed order: spiral, rotate, diagonals, set zeroes, Pascal's triangle, look-and-say.",
      signals: ["spiral / diagonal / boundary traversal", "rotate an image in place", "set matrix zeroes in O(1) space", "generate Pascal's triangle, count and say, reverse words"],
      idea: ["Spiral: keep top, bottom, left, right. Walk one side, then shrink that boundary. Check top <= bottom and left <= right before the bottom and left sides, or single rows and columns are printed twice.", "Rotate 90° clockwise in place: transpose (swap across the diagonal), then reverse every row.", "Set zeroes in O(1) space: use the first row and column as markers, with one extra flag for the first column itself.", "Diagonals: cells on the same anti-diagonal share r + c."],
      steps: ["Write the invariant (what the boundaries mean)", "Do one side or one step", "Update the boundary", "Re-check the loop condition before the next side"],
      code: `def spiral(m):
    out = []
    top, bot, left, right = 0, len(m) - 1, 0, len(m[0]) - 1
    while top <= bot and left <= right:
        for c in range(left, right + 1): out.append(m[top][c])
        top += 1
        for r in range(top, bot + 1): out.append(m[r][right])
        right -= 1
        if top <= bot:
            for c in range(right, left - 1, -1): out.append(m[bot][c])
            bot -= 1
        if left <= right:
            for r in range(bot, top - 1, -1): out.append(m[r][left])
            left += 1
    return out`,
      complexity: { best: "O(R · C)", average: "O(R · C)", worst: "O(R · C)", space: "O(1)", note: "Every cell is read once; output not counted." },
      traps: ["Missing the two boundary checks prints a single middle row twice.", "Zeroing cells while scanning creates false zeroes; mark first, zero later.", "Reverse words: split() without arguments already drops repeated spaces."],
      viz: { make: (i) => { const [r, c] = nums(i, [4, 4], 2); return S.spiral(Math.max(1, Math.min(6, Math.round(r || 4))), Math.max(1, Math.min(6, Math.round(c || 4)))); }, input: "4, 4", label: "rows, columns (up to 6)" },
    },
  ],
};
