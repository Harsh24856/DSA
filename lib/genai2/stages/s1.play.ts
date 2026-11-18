// Stage 1 (ML basics for LLMs): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { BEST, fmt, LINE, mse, predict } from "./s1.calc.ts";

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

export const PLAY_1: Record<string, PlayFlow> = {
  "s1-line": {
    title: "Fit the line by hand",
    knobs: [
      { key: "w", label: "Slope w", min: 0, max: 2.5, step: 0.05, value: 0.5 },
      { key: "b", label: "Intercept b", min: 0, max: 5, step: 0.1, value: 3 },
    ],
    make: line,
  },
};
