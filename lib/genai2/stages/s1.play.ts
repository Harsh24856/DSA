// Stage 1 (ML basics for LLMs): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { BEST, BEST_DEG, confusion, DEGREES, fmt, gdLine, LIMIT, LINE, mse, POLY, predict, SPAM } from "./s1.calc.ts";

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

// Overfitting and evaluation: polynomial degree against training and validation error.
function degree(v: Record<string, number>): Flow {
  const d = DEGREES[v.d], best = DEGREES[BEST_DEG], n = POLY.tx.length;
  const state = d.deg < BEST_DEG - 1 && d.val > 1.5 * best.val ? "under" : d.val > 1.5 * best.val ? "over" : "fine";
  const tone = state === "fine" ? "ok" as const : state === "over" ? "bad" as const : "warn" as const;
  const row = (x: typeof d, label: string) => [label, x.deg, fmt(x.train), fmt(x.val)];
  return { kind: "grid", title: `Degree ${d.deg}: ${d.deg + 1} parameters, ${n} points`, steps: [
    { note: `A degree ${d.deg} polynomial has ${d.deg + 1} coefficients. Fitted by least squares to ${n} noisy samples of a smooth curve, its training MSE is ${fmt(d.train)}.${d.deg + 1 >= n ? " With as many coefficients as points it can pass through every one." : ""}`, tone: "hot",
      tables: [{ head: ["", "degree", "train MSE", "val MSE"], rows: [row(d, "yours")], tones: { "0:2": "hot" } }] },
    { note: state === "under" ? `Underfitting: too stiff to follow the curve. Both errors are high; validation ${fmt(d.val)} against the best ${fmt(best.val)} at degree ${BEST_DEG}.`
      : state === "over" ? `Overfitting: training error ${fmt(d.train)} looks great, but on ${POLY.vx.length} new points the error is ${fmt(d.val)}, ${fmt(d.val / best.val)} times the best. Its largest coefficient is ${fmt(d.size)}: it bends hard to hit the noise.`
      : `A good fit: validation error ${fmt(d.val)} is close to the lowest, ${fmt(best.val)} at degree ${BEST_DEG}. The noise itself has variance ${fmt(POLY.noise ** 2)}, so no model can do much better.`,
      tone, tables: [{ head: ["", "degree", "train MSE", "val MSE"], rows: [row(d, "yours"), row(best, "best on val")], tones: { [`0:3`]: tone, "1:3": "ok" } }] },
  ] };
}

// Overfitting and evaluation: one threshold, four counts, three metrics.
function threshold(v: Record<string, number>): Flow {
  const t = Math.round(v.t * 100) / 100, c = confusion(t), pos = c.tp + c.fn;
  if (c.tp + c.fp === 0) throw new PlayError("Nothing is flagged at this threshold, so precision is undefined. Lower it.");
  const pct = (x: number) => `${Math.round(100 * x)}%`;
  return { kind: "grid", title: `Threshold ${fmt(t)}`, steps: [
    { note: `${SPAM.scores.length} emails, ${pos} really spam. Flag every email scoring ${fmt(t)} or more. The confusion matrix counts the four outcomes.`, tone: "hot",
      tables: [{ head: ["", "flagged", "not flagged"], rowHead: ["spam", "not spam"], rows: [[c.tp, c.fn], [c.fp, c.tn]], tones: { "0:0": "ok", "1:1": "ok", "0:1": "bad", "1:0": "bad" } }] },
    { note: `Precision: of ${c.tp + c.fp} flagged, ${c.tp} are spam, ${pct(c.precision)}. Recall: of ${pos} spam, ${c.tp} caught, ${pct(c.recall)}. F1, their harmonic mean, is ${fmt(c.f1)}. Accuracy is ${pct(c.acc)}.`,
      tone: c.f1 >= 0.7 ? "ok" : "warn",
      tables: [{ head: ["metric", "formula", "value"], rows: [["precision", "TP / (TP + FP)", fmt(c.precision)], ["recall", "TP / (TP + FN)", fmt(c.recall)], ["F1", "2PR / (P + R)", fmt(c.f1)], ["accuracy", "right / all", fmt(c.acc)]] }] },
    { note: t >= 0.6 ? `A high threshold flags only sure cases: few false alarms, but ${c.fn} spam slip through. Raise it further and recall keeps falling.`
      : `A low threshold catches more spam but flags ${c.fp} good emails. Lower it further and precision keeps falling.`, tone: "warn",
      tables: [{ head: ["moving the threshold", "precision", "recall"], rows: [["up", "rises (usually)", "falls or stays"], ["down", "falls (usually)", "rises or stays"]] }] },
  ] };
}

export const PLAY_1: Record<string, PlayFlow> = {
  "s1-degree": {
    title: "Turn up the degree",
    knobs: [{ key: "d", label: "Polynomial degree", min: 0, max: 11, step: 1, value: 1 }],
    make: degree,
  },
  "s1-threshold": {
    title: "Move the threshold",
    knobs: [{ key: "t", label: "Spam threshold", min: 0.05, max: 0.95, step: 0.05, value: 0.5 }],
    make: threshold,
  },
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
