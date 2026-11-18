// Stage 1 (ML basics for LLMs): animated walk-throughs. Client-safe: imports only flow types and s1.calc.ts. Every number shown is computed there.
import type { Flow, GridTable } from "../../other/flows.ts";
import { BEST, fmt, LINE, mse } from "./s1.calc.ts";

// Learning as fitting: the loop every supervised model runs, from a tiny line to an LLM.
const loop: Flow = { title: "The learning loop", steps: [
  { node: "examples: input and right answer", note: "Training data is pairs: hours practised and the score that followed, or a text and its next word." },
  { node: "model: a function with knobs", note: "Pick a family of functions. A line has two knobs, w and b. An LLM has billions.", tone: "hot" },
  { node: "predict for every example", note: "Run each input through the model with the current knobs." },
  { node: "loss: one number for how wrong", note: "Compare predictions with the answers and boil it down to one score. Lower is better.", tone: "warn" },
  { node: "turn the knobs to lower the loss", note: "Change the parameters a little in the direction that helps, then predict again." },
  { node: "test on examples it never saw", note: "The goal is new inputs, not the training set. Held-out data tells you if it learned the pattern.", tone: "ok" },
] };

// Learning as fitting: the least squares line, worked by hand.
function lsq(): Flow {
  const { xs, ys } = LINE, { mx, my, cov, vx, w, b, loss } = BEST;
  const dx = xs.map((x) => x - mx), dy = ys.map((y) => y - my);
  const T = (cols: (string | number)[][], head: string[], tones?: GridTable["tones"]): GridTable => ({ head, rows: xs.map((_, i) => cols.map((c) => c[i])), tones });
  const nudges = [[w, b], [w + 0.1, b], [w - 0.1, b], [w, b + 0.1]].map(([a, c]) => [fmt(a), fmt(c), fmt(mse(a, c))]);
  return { kind: "grid", title: "The best line, by hand", steps: [
    { note: `${xs.length} students: hours practised (x) and test score (y). Find the line y = w x + b with the smallest mean squared error.`, tables: [T([xs, ys], ["x hours", "y score"])] },
    { note: `Centre both columns: subtract the means, ${fmt(mx)} hours and ${fmt(my)} points. Positive with positive means "more practice, higher score".`,
      tables: [T([dx.map(fmt), dy.map(fmt), dx.map((d, i) => fmt(d * dy[i]))], ["x - x̄", "y - ȳ", "product"], { ":2": "hot" })] },
    { note: `Slope w = mean of the products / mean of (x - x̄)² = ${fmt(cov)} / ${fmt(vx)} = ${fmt(w)}. Each extra hour is worth about ${fmt(w)} points.`, tone: "hot",
      tables: [{ head: ["quantity", "value"], rows: [["cov(x, y)", fmt(cov)], ["var(x)", fmt(vx)], ["w", fmt(w)]], tones: { "2": "hot" } }] },
    { note: `The best line always passes through the mean point, so b = ȳ - w x̄ = ${fmt(my)} - ${fmt(w)} × ${fmt(mx)} = ${fmt(b)}. Its MSE is ${fmt(loss)}.`, tone: "ok",
      tables: [{ head: ["quantity", "value"], rows: [["w", fmt(w)], ["b", fmt(b)], ["MSE", fmt(loss)]], tones: { "2": "ok" } }] },
    { note: `Check it is a minimum: nudge either knob by 0.1 and the error goes up every time. No other line does better on these ${xs.length} points.`, tone: "ok",
      tables: [{ head: ["w", "b", "MSE"], rows: nudges, tones: { "0": "ok", "1:2": "warn", "2:2": "warn", "3:2": "warn" } }] },
  ] };
}

export const FLOWS_1: Record<string, Flow> = {
  "s1-loop": loop,
  "s1-lsq": lsq(),
};
