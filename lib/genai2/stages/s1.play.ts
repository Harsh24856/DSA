// Stage 1 (ML basics for LLMs): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { BEST, confusion, fmt, gdLine, idf, LIMIT, LINE, mse, POLY, polyErrorsN, predict, SPAM } from "./s1.calc.ts";

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
  const { lr, steps } = v, hist = gdLine(lr, steps), { max } = LIMIT;
  const at = [0, 1, 2, 5, 10, 20, 50, 100, 200].filter((t) => t <= steps);
  if (at[at.length - 1] !== steps) at.push(steps);
  const end = hist[steps], L0 = hist[0].loss, gap = end.loss - BEST.loss;
  const verdict = lr >= max ? "bad" as const : gap < 0.01 ? "ok" as const : "warn" as const;
  const table = { head: ["step", "w", "b", "MSE"], rows: at.map((t) => [t, fmt(hist[t].w), fmt(hist[t].b), fmt(hist[t].loss)]),
    tones: Object.fromEntries(at.flatMap((t, i) => (hist[t].loss > L0 ? [[String(i), "bad" as const]] : []))) };
  return { kind: "grid", title: `lr ${lr}, ${steps} steps`, steps: [
    { note: `On this data, steps start to overshoot by more than they gain once lr passes ${fmt(max)}. Your lr, ${fmt(lr)}, is ${lr >= max ? "above" : "below"} that line. Stage 2, Optimisers, shows how the steepest direction sets it.`, tone: lr >= max ? "bad" : "ok",
      tables: [{ head: ["", "value"], rows: [["your lr", fmt(lr)], ["limit", fmt(max)]], tones: { "0:1": lr >= max ? "bad" : "ok" } }] },
    { note: lr >= max ? `Too big: every step overshoots the bottom by more than it started, so the loss grows. After ${steps} steps the MSE is ${fmt(end.loss)}.`
      : gap < 0.01 ? `Converged: after ${steps} steps the MSE is ${fmt(end.loss)}, within 0.01 of the best possible ${fmt(BEST.loss)}.`
      : `Still crawling: the MSE is ${fmt(end.loss)} after ${steps} steps, ${fmt(gap)} above the best ${fmt(BEST.loss)}. A larger lr or more steps would finish the job.`,
      tone: verdict, tables: [table] },
  ] };
}

// Overfitting and evaluation: the same flexible model on more and more data. The figure shows degree; this shows data size.
function moreData(v: Record<string, number>): Flow {
  const { d, n } = v;
  if (d + 1 > n) throw new PlayError(`A degree ${d} polynomial needs at least ${d + 1} points. Add points or lower the degree.`);
  const small = polyErrorsN(d, d + 1), mine = polyErrorsN(d, n), noise = POLY.noise ** 2;
  const z = (x: number) => fmt(x < 1e-9 ? 0 : x), gap = mine.val - mine.train;
  const tone = mine.val < 1.5 * noise ? "ok" as const : mine.val < 2.5 * noise ? "warn" as const : "bad" as const;
  const stiff = gap < 0.5 * noise && mine.val >= 2.5 * noise;
  const head = ["points", "train MSE", "val MSE"];
  return { kind: "grid", title: `Degree ${d}, ${n} training points`, steps: [
    { note: `With only ${d + 1} points, a degree ${d} polynomial (${d + 1} coefficients) passes through every one: training error ${z(small.train)}, validation error ${z(small.val)}. It has fitted the noise.`, tone: "bad",
      tables: [{ head, rows: [[d + 1, z(small.train), z(small.val)]], tones: { "0:2": "bad" } }] },
    { note: n <= d + 1 ? `${n} points is still just enough to pass through every one, so nothing changes. Slide the points up.`
      : stiff ? `On ${n} points training and validation agree (gap ${fmt(gap)}), but both are high, validation ${z(mine.val)} against the noise floor ${fmt(noise)}. A degree ${d} curve is too stiff for this pattern: underfitting, which more data cannot fix.`
      : `On ${n} points the curve can no longer weave through each point's noise without missing the others, so it is pulled toward the real pattern. Validation error ${z(mine.val)}, gap to training ${fmt(gap)}. The noise alone costs ${fmt(noise)}.`,
      tone: n <= d + 1 ? "bad" : stiff ? "warn" : tone,
      tables: [{ head, rows: [[d + 1, z(small.train), z(small.val)], [n, z(mine.train), z(mine.val)]], tones: { "0:2": "bad", "1:2": stiff ? "warn" : tone } }] },
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

// Text as numbers: how rarity and repetition set a TF-IDF weight in a large collection.
function idfPlay(v: Record<string, number>): Flow {
  const { N, p, tf } = v, df = Math.max(1, Math.round((N * p) / 100)), w = idf(N, df);
  const rows = [["in every document", N, fmt(idf(N, N)), fmt(tf * idf(N, N))], ["your word", df, fmt(w), fmt(tf * w)], ["in one document", 1, fmt(idf(N, 1)), fmt(tf * idf(N, 1))]];
  const doubled = Math.max(1, Math.round(df / 2));
  return { kind: "grid", title: `${N.toLocaleString("en-US")} documents, word in ${df}`, steps: [
    { note: `idf = ln(N / df) = ln(${N.toLocaleString("en-US")} / ${df}) = ${fmt(w)}. The log keeps it gentle: halving the documents that contain the word (${df} to ${doubled}) adds only ${fmt(idf(N, doubled) - w)}, whatever N is.`, tone: "hot",
      tables: [{ head: ["word", "df", "idf"], rows: rows.map((r) => r.slice(0, 3)), tones: { "1:2": "hot" } }] },
    { note: `The word appears ${tf} times in this document, so its weight is ${tf} × ${fmt(w)} = ${fmt(tf * w)}. A word in every document scores 0 however often it repeats; one found in a single document scores ${fmt(tf * idf(N, 1))}.`, tone: w > 0 ? "ok" : "warn",
      tables: [{ head: ["word", "df", "idf", "tf × idf"], rows, tones: { "1:3": w > 0 ? "ok" : "warn" } }] },
  ] };
}

export const PLAY_1: Record<string, PlayFlow> = {
  "s1-idf": {
    title: "What makes a word count",
    knobs: [
      { key: "N", label: "Documents", min: 10, max: 10000, step: 10, value: 1000 },
      { key: "p", label: "Share containing the word", min: 1, max: 100, step: 1, value: 2, unit: "%" },
      { key: "tf", label: "Times in this document", min: 1, max: 10, step: 1, value: 3 },
    ],
    make: idfPlay,
  },
  "s1-data": {
    title: "Give the model more data",
    knobs: [
      { key: "d", label: "Polynomial degree", min: 1, max: 9, step: 1, value: 9 },
      { key: "n", label: "Training points", min: 10, max: 200, step: 10, value: 20 },
    ],
    make: moreData,
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
