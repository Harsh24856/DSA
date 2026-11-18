// Stage 1 (ML basics for LLMs): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { BEST, fmt, gdLine, LIMIT, LINE, mse, predict } from "./s1.calc.ts";

// Learning as fitting: fit the line by hand, then compare with least squares.
function line(v: Record<string, number>): Flow {
  const { w, b } = v, { xs, ys } = LINE;
  const pred = xs.map((x) => predict(w, b, x)), err = pred.map((p, i) => p - ys[i]), L = mse(w, b), ratio = L / BEST.loss;
  const worst = err.reduce((m, e, i) => (Math.abs(e) > Math.abs(err[m]) ? i : m), 0);
  const side = err.filter((e) => e > 0).length;
  return { kind: "grid", title: `Your line: y = ${fmt(w)} x + ${fmt(b)}`, steps: [
    { note: `Every student gets a prediction from your two knobs. The error is prediction minus the real score. ${side} of ${xs.length} predictions are too high.`,
      tables: [{ head: ["x", "y", "predicted", "error"], rows: xs.map((x, i) => [x, ys[i], fmt(pred[i]), fmt(err[i])]), tones: { [`${worst}:3`]: "warn" } }] },
    { note: `Square each error so misses on both sides count, then average: MSE = ${fmt(L)}. The biggest miss, ${fmt(err[worst])} at x = ${xs[worst]}, contributes ${fmt(err[worst] ** 2)} before averaging.`, tone: "hot",
      tables: [{ head: ["x", "error", "error²"], rows: xs.map((x, i) => [x, fmt(err[i]), fmt(err[i] ** 2)]), tones: { [`${worst}:2`]: "warn" } }] },
    { note: ratio < 1.05 ? `Your MSE ${fmt(L)} is within 5% of the least squares line, w = ${fmt(BEST.w)}, b = ${fmt(BEST.b)}. You found the bottom by hand.`
      : `Least squares picks w = ${fmt(BEST.w)} and b = ${fmt(BEST.b)}, MSE ${fmt(BEST.loss)}. Yours is ${fmt(ratio)} times worse. Training is the search for those knobs, done by an algorithm instead of by hand.`,
      tone: ratio < 1.05 ? "ok" : "warn",
      tables: [{ head: ["line", "w", "b", "MSE"], rows: [["yours", fmt(w), fmt(b), fmt(L)], ["least squares", fmt(BEST.w), fmt(BEST.b), fmt(BEST.loss)]], tones: { "1:3": "ok" } }] },
  ] };
}

// Loss and gradient descent: the learning rate decides between crawling, converging and blowing up.
function lrRun(v: Record<string, number>): Flow {
  const { lr, steps } = v, hist = gdLine(lr, steps), { max, big } = LIMIT;
  const at = [0, 1, 2, 5, 10, 20, 50, 100, 200].filter((t) => t <= steps);
  if (at[at.length - 1] !== steps) at.push(steps);
  const end = hist[steps], L0 = hist[0].loss, gap = end.loss - BEST.loss;
  const verdict = lr >= max ? "bad" as const : gap < 0.01 ? "ok" as const : "warn" as const;
  const table = { head: ["step", "w", "b", "MSE"], rows: at.map((t) => [t, fmt(hist[t].w), fmt(hist[t].b), fmt(hist[t].loss)]),
    tones: Object.fromEntries(at.flatMap((t, i) => (hist[t].loss > L0 ? [[String(i), "bad" as const]] : []))) };
  return { kind: "grid", title: `lr ${lr}, ${steps} steps`, steps: [
    { note: `The bowl's steepest direction has curvature ${fmt(big)}. Gradient descent shrinks the error along it only while lr × ${fmt(big)} < 2, so lr must stay under ${fmt(max)}. Here lr × ${fmt(big)} = ${fmt(lr * big)}.`, tone: lr >= max ? "bad" : "ok",
      tables: [{ head: ["", "value"], rows: [["your lr", fmt(lr)], ["limit", fmt(max)]], tones: { "0:1": lr >= max ? "bad" : "ok" } }] },
    { note: lr >= max ? `Too big: every step overshoots the bottom by more than it started, so the loss grows. After ${steps} steps the MSE is ${fmt(end.loss)}.`
      : gap < 0.01 ? `Converged: after ${steps} steps the MSE is ${fmt(end.loss)}, within 0.01 of the best possible ${fmt(BEST.loss)}.`
      : `Still crawling: the MSE is ${fmt(end.loss)} after ${steps} steps, ${fmt(gap)} above the best ${fmt(BEST.loss)}. A larger lr or more steps would finish the job.`,
      tone: verdict, tables: [table] },
  ] };
}

export const PLAY_1: Record<string, PlayFlow> = {
  "s1-lr": {
    title: "Pick the learning rate",
    knobs: [
      { key: "lr", label: "Learning rate", min: 0.01, max: 0.2, step: 0.01, value: 0.05 },
      { key: "steps", label: "Steps", min: 10, max: 200, step: 10, value: 50 },
    ],
    make: lrRun,
  },
  "s1-line": {
    title: "Fit the line by hand",
    knobs: [
      { key: "w", label: "Slope w", min: 0, max: 2.5, step: 0.05, value: 0.5 },
      { key: "b", label: "Intercept b", min: 0, max: 5, step: 0.1, value: 3 },
    ],
    make: line,
  },
};
