// Stage 1 (ML basics for LLMs): animated walk-throughs. Client-safe: imports only flow types and s1.calc.ts. Every number shown is computed there.
import type { Flow, GridTable } from "../../other/flows.ts";
import { BEST, CORPUS, COUNTS, DF, DOCS, dot, fmt, GD, gdLine, gradLine, IDF, LINE, mse, OUTLIER, pairCos, predict, SENT, sgnsStep, skipPairs, TFIDF, VOCAB, W2V, W2V_CFG, W2V_PAIRS } from "./s1.calc.ts";

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

// Loss and gradient descent: the same line, found by stepping downhill instead of by formula.
function gd(): Flow {
  const { xs, ys } = LINE, { lr, show } = GD, hist = gdLine(lr, show[show.length - 1]);
  const e0 = xs.map((x, i) => predict(0, 0, x) - ys[i]), g0 = gradLine(0, 0), h1 = hist[1];
  return { kind: "grid", title: `Gradient descent, lr ${lr}`, steps: [
    { note: `Start anywhere: w = 0, b = 0. The line predicts 0 for everyone, so every error is minus the score. MSE ${fmt(hist[0].loss)}.`, tone: "bad",
      tables: [{ head: ["x", "y", "error e"], rows: xs.map((x, i) => [x, ys[i], fmt(e0[i])]) }] },
    { note: `The gradient says how the loss changes per unit of each knob: dL/dw = 2 × mean(e × x) = ${fmt(g0.dw)}, dL/db = 2 × mean(e) = ${fmt(g0.db)}. Both negative: raising w or b lowers the loss.`, tone: "hot",
      tables: [{ head: ["knob", "gradient"], rows: [["w", fmt(g0.dw)], ["b", fmt(g0.db)]], tones: { ":1": "hot" } }] },
    { note: `Step against the gradient: w = 0 - ${lr} × (${fmt(g0.dw)}) = ${fmt(h1.w)}, b = ${fmt(h1.b)}. The MSE falls from ${fmt(hist[0].loss)} to ${fmt(h1.loss)}.`, tone: "ok",
      tables: [{ head: ["step", "w", "b", "MSE"], rows: hist.slice(0, 2).map((h) => [h.t, fmt(h.w), fmt(h.b), fmt(h.loss)]), tones: { "1:3": "ok" } }] },
    { note: `Repeat: new errors, new gradient, new step. The loss drops fast at first, then slowly as the bowl flattens. After ${hist.length - 1} steps w = ${fmt(hist[hist.length - 1].w)}, b = ${fmt(hist[hist.length - 1].b)}; the formula gives ${fmt(BEST.w)} and ${fmt(BEST.b)}.`, tone: "ok",
      tables: [{ head: ["step", "w", "b", "MSE"], rows: show.map((t) => [t, fmt(hist[t].w), fmt(hist[t].b), fmt(hist[t].loss)]), tones: { [`${show.length - 1}:3`]: "ok" } }] },
  ] };
}

// Loss and gradient descent: squared against absolute error when one example is far off.
function outlier(): Flow {
  const sq = OUTLIER.map((e) => e * e), ab = OUTLIER.map(Math.abs), top = OUTLIER.length - 1;
  const share = (xs: number[]) => Math.round((100 * xs[top]) / xs.reduce((s, x) => s + x, 0));
  const bars = (xs: number[]) => xs.map((v, i) => ({ label: `e = ${OUTLIER[i]}`, value: v, tone: i === top ? "bad" as const : undefined }));
  return { kind: "bars", title: "One outlier, two losses", format: fmt, steps: [
    { note: `Five errors. Four are small; one example is off by ${OUTLIER[top]}, perhaps a typo in its label. Absolute error counts each miss by its size.`, bars: bars(ab) },
    { note: `Absolute error: the outlier is ${share(ab)}% of the total. Squared error: ${fmt(sq[top])} out of ${fmt(sq.reduce((s, x) => s + x, 0))}, ${share(sq)}% of the total. Minimising MSE will bend the whole fit toward that one point.`, tone: "warn", bars: bars(sq) },
  ] };
}

// Overfitting and evaluation: three splits, three jobs.
const split: Flow = { title: "Train, validation, test", steps: [
  { node: "shuffle, then split the data", note: "A common split is 80% train, 10% validation, 10% test. Split before you look at anything, and keep near-duplicates on the same side." },
  { node: "train: fit the parameters", note: "Gradient descent sees only this part. Its error says how well the model memorised, not how well it generalises.", tone: "hot" },
  { node: "validation: choose the settings", note: "Compare degrees, learning rates and checkpoints here. Every choice you make by looking at it leaks a little of it into the model.", tone: "warn" },
  { node: "test: score once, at the end", note: "Untouched until the very end, so it stays an honest estimate of performance on new data.", tone: "ok" },
  { node: "tune on test and it stops being a test", note: "Pick the best of many runs by their test score and the score is now optimistic. You need fresh data to know the truth.", tone: "bad" },
] };

// Text as numbers: bag of words, then TF-IDF, on three short documents.
function tfidfFlow(): Flow {
  const D = DOCS.map((_, i) => `d${i + 1}`), cc = pairCos(COUNTS), tc = pairCos(TFIDF);
  const theIdx = VOCAB.indexOf("the");
  return { kind: "grid", title: "From documents to TF-IDF", steps: [
    { note: `Three documents: ${DOCS.map((d, i) => `d${i + 1} "${d}"`).join(", ")}. Bag of words: one row per vocabulary word, one count per document. Word order is thrown away.`,
      tables: [{ head: ["word", ...D], rows: VOCAB.map((w, j) => [w, ...COUNTS.map((c) => c[j])]), tones: { [`${theIdx}`]: "warn" } }] },
    { note: `Document frequency (df): how many documents contain the word. idf = ln(N / df) with N = ${DOCS.length}. "the" is everywhere, so its idf is ln(1) = 0. A word in one document gets ln(${DOCS.length}) = ${fmt(Math.log(DOCS.length))}.`, tone: "hot",
      tables: [{ head: ["word", "df", "idf"], rows: VOCAB.map((w, j) => [w, DF[j], fmt(IDF[j])]), tones: { [`${theIdx}:2`]: "bad", ":2": "hot" } }] },
    { note: "TF-IDF = count × idf. Words that are frequent here but rare elsewhere get the weight. \"the\" now counts for nothing, and \"mat\", \"log\" and \"chased\" stand out.", tone: "ok",
      tables: [{ head: ["word", ...D], rows: VOCAB.map((w, j) => [w, ...TFIDF.map((t) => fmt(t[j]))]), tones: { [`${theIdx}`]: "bad" } }] },
    { note: `Cosine similarity between documents. On raw counts every pair looks alike, ${cc.map((p) => fmt(p.cos)).join(", ")}, because "the" dominates. With TF-IDF the scores drop to ${tc.map((p) => fmt(p.cos)).join(", ")}, and d1 and d2, which share "sat on", stay the closest pair.`, tone: "ok",
      tables: [{ head: ["pair", "counts", "TF-IDF"], rows: cc.map((p, k) => [`d${p.i + 1}, d${p.j + 1}`, fmt(p.cos), fmt(tc[k].cos)]), tones: { "0:2": "ok" } }] },
  ] };
}

// Text as numbers: where word2vec's training pairs come from, and one negative-sampling step.
function w2vFlow(): Flow {
  const c = 2, win = 2;
  const ctx = SENT.flatMap((w, j) => (j !== c && Math.abs(j - c) <= win ? [w] : []));
  const { v, u, n, lr } = W2V, s = sgnsStep(v, u, n, lr);
  return { kind: "grid", title: "word2vec: skip-gram with negative sampling", steps: [
    { note: `Slide a window of ${win} words each side over "${SENT.join(" ")}". The centre word "${SENT[c]}" makes one training pair with each neighbour. The whole sentence gives ${skipPairs(SENT, win).length} pairs; a window of 1 would give ${skipPairs(SENT, 1).length}.`, tone: "hot",
      tables: [{ head: ["centre", "context"], rows: ctx.map((w) => [SENT[c], w]) }] },
    { note: `Each word has two learned vectors: one as a centre word (v) and one as a context word (u). Take the real pair (cat, sat) and one random "negative" word, log. The model wants σ(v · u) near 1 for the real pair and σ(v · u') near 0 for the negative.`,
      tables: [{ head: ["pair", "v · u", "σ", "want"], rows: [["cat, sat", fmt(dot(v, u)), fmt(s.sp), 1], ["cat, log", fmt(dot(v, n)), fmt(s.sn), 0]], tones: { "0:2": "warn", "1:2": "warn" } }] },
    { note: `Loss = -ln σ(v · u) - ln(1 - σ(v · u')) = ${fmt(s.loss)}. One gradient step with lr ${lr} pulls cat's vector toward sat's and pushes it from log's. The loss falls to ${fmt(s.loss2)}.`, tone: "ok",
      tables: [{ head: ["pair", "σ before", "σ after"], rows: [["cat, sat", fmt(s.sp), fmt(s.sp2)], ["cat, log", fmt(s.sn), fmt(s.sn2)]], tones: { "0:2": "ok", "1:2": "ok" } }] },
    { note: `Repeat over every pair in a big corpus. Words that appear next to the same neighbours get pulled toward the same vectors, so they end up close. Negative sampling scores ${W2V_CFG.negatives} random words per pair instead of the whole vocabulary, which keeps each step cheap.`, tone: "ok",
      tables: [{ head: ["toy run", "value"], rows: [["sentences", CORPUS.length], ["pairs per pass", W2V_PAIRS], ["passes", W2V_CFG.epochs], ["vector size", W2V_CFG.dim]] }] },
  ] };
}

export const FLOWS_1: Record<string, Flow> = {
  "s1-tfidf": tfidfFlow(),
  "s1-w2v": w2vFlow(),
  "s1-split": split,
  "s1-loop": loop,
  "s1-lsq": lsq(),
  "s1-gd": gd(),
  "s1-outlier": outlier(),
};
