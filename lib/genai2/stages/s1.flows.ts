// Stage 1 (ML basics for LLMs): animated walk-throughs. Client-safe: imports only flow types and s1.calc.ts. Every number shown is computed there.
import type { Flow, GridTable, SceneTone, Shape } from "../../other/flows.ts";
import { accuracy, BEST, bfs, boost, BOOST, boostTruth, CORPUS, COUNTS, DF, DOCS, dot, fmt, FOREST, GD, gdLine, gradLine, grow, IDF, leaves, LINE, LOGIT, LOGIT_RUN, margin, maxMargin, mse, OUTLIER,
  pairCos, perceptron, predict, predictTree, SENT, sgnsStep, sigmoid, skipPairs, SVM_PTS, TFIDF, TREE_TEST, TREE_TRAIN, trainLogit, VOCAB, W2V, W2V_CFG, W2V_PAIRS, type P2, type TNode } from "./s1.calc.ts";

// ---------- scene helpers (shared with s1.play.ts): data to canvas pixels on the 480-wide scene ----------
const q1 = (v: number) => Math.round(v * 10) / 10;
export type Plot = { sx: (v: number) => number; sy: (v: number) => number; X: number; Y: number; w: number; h: number };
/** A plot box at (X, Y), w by h pixels, showing x from x0 to x1 and y from y0 to y1. */
export const plotBox = (X: number, Y: number, w: number, h: number, [x0, x1, y0, y1]: number[]): Plot =>
  ({ sx: (v) => q1(X + ((v - x0) / (x1 - x0)) * w), sy: (v) => q1(Y + h - ((v - y0) / (y1 - y0)) * h), X, Y, w, h });
/** Frame, axis names and end ticks. */
export const axes = (id: string, P: Plot, xName: string, yName: string, ticks: [string, string, string, string] = ["0", "10", "0", "10"]): Shape[] => [
  { t: "rect", id: `${id}-frame`, x: P.X, y: P.Y, w: P.w, h: P.h, tone: "muted", fill: 0, edge: true },
  { t: "text", id: `${id}-xn`, x: P.X + P.w / 2, y: P.Y + P.h + 34, text: xName, tone: "muted", anchor: "middle", size: 17 },
  { t: "text", id: `${id}-yn`, x: P.X - 10, y: P.Y - 16, text: yName, tone: "muted", size: 17 },
  { t: "text", id: `${id}-x0`, x: P.X, y: P.Y + P.h + 14, text: ticks[0], tone: "muted", anchor: "middle", size: 15 },
  { t: "text", id: `${id}-x1`, x: P.X + P.w, y: P.Y + P.h + 14, text: ticks[1], tone: "muted", anchor: "middle", size: 15 },
  { t: "text", id: `${id}-y0`, x: P.X - 8, y: P.Y + P.h, text: ticks[2], tone: "muted", anchor: "end", size: 15 },
  { t: "text", id: `${id}-y1`, x: P.X - 8, y: P.Y, text: ticks[3], tone: "muted", anchor: "end", size: 15 },
];
/** Class 1 is a filled accent dot, class 0 an amber ring, so the two never differ by colour alone. */
export const classDot = (id: string, x: number, y: number, c: number, r = 6): Shape => (c ? { t: "dot", id, x, y, r, tone: "hot" } : { t: "dot", id, x, y, r, tone: "warn", ring: true });
export const points = (id: string, P: Plot, pts: P2[], r = 6): Shape[] => pts.map((p, i) => classDot(`${id}${i}`, P.sx(p.x), P.sy(p.y), p.c, r));
export const classTone = (c: number): SceneTone => (c ? "hot" : "warn");
/** A tree's leaves as shaded boxes in the plot, one shade per predicted class. */
export const regions = (id: string, P: Plot, t: TNode, fill = 30): Shape[] => leaves(t).map((l) => {
  const [x0, x1, y0, y1] = l.box;
  return { t: "rect", id: `${id}${l.id}`, x: P.sx(x0), y: P.sy(y1), w: q1(P.sx(x1) - P.sx(x0)), h: q1(P.sy(y0) - P.sy(y1)), tone: classTone(l.pred), fill };
});
/** A curve as a path: f sampled n + 1 times from a to b, clamped to the plot's y range. */
export const curve = (id: string, P: Plot, f: (x: number) => number, [a, b]: number[], [lo, hi]: number[], n = 80, tone: SceneTone = "ink", dash = false): Shape =>
  ({ t: "path", id, tone, dash, pts: Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n).flatMap((x) => [P.sx(x), P.sy(Math.min(hi, Math.max(lo, f(x))))]) });
export const pct = (x: number) => `${Math.round(100 * x)}%`;

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

// ---------- Decision trees: grow a depth 3 tree split by split ----------
const F = { x: "x1", y: "x2" } as const;
export const treeNodeText = (n: TNode, open: boolean) => (n.depth >= 3 ? `${n.c[0]}/${n.c[1]}` : `${open && n.split ? `${F[n.split.f]} < ${n.split.t}` : `${n.c[0] + n.c[1]} points`}\n${n.c[0]}/${n.c[1]}  G ${fmt(Math.round(n.imp * 100) / 100)}`);
function treeGrow(): Flow {
  const tree = grow(TREE_TRAIN, { maxDepth: 3 }), order = bfs(tree), splits = order.filter((n) => n.split);
  const P = plotBox(110, 360, 290, 260, [0, 10, 0, 10]), width = [150, 140, 108, 54], levelY = [44, 124, 204, 280];
  const pos = (n: TNode) => { const k = parseInt(n.id.slice(1).replace(/L/g, "0").replace(/R/g, "1") || "0", 2); return { x: q1(((k + 0.5) * 480) / 2 ** n.depth), y: levelY[n.depth] }; };
  const at = (k: number) => {   // the picture after k splits
    const open = new Set(splits.slice(0, k).map((n) => n.id)), shown = order.filter((n) => n.depth === 0 || open.has(n.id.slice(0, -1)));
    const cur = k ? splits[k - 1] : order[0], sh: Shape[] = [];   // the node this step split (the root before any)
    for (const n of shown) if (n.depth) { const a = pos(n), b = pos(order.find((m) => m.id === n.id.slice(0, -1))!); sh.push({ t: "line", id: `e${n.id}`, x1: b.x, y1: b.y + 20, x2: a.x, y2: a.y - 18, tone: "muted", w: 2 }); }
    for (const n of shown) sh.push({ t: "node", id: `n${n.id}`, ...pos(n), w: width[n.depth], text: treeNodeText(n, open.has(n.id)), tone: n === cur ? "hot" : n.imp === 0 ? "ok" : undefined });
    if (cur) { const [x0, x1, y0, y1] = cur.box; sh.push({ t: "rect", id: "focus", x: P.sx(x0), y: P.sy(y1), w: q1(P.sx(x1) - P.sx(x0)), h: q1(P.sy(y0) - P.sy(y1)), tone: "hot", fill: 14 }); }
    for (const n of splits.slice(0, k)) {
      const [x0, x1, y0, y1] = n.box, s = n.split!;
      sh.push(s.f === "x" ? { t: "line", id: `c${n.id}`, x1: P.sx(s.t), y1: P.sy(y0), x2: P.sx(s.t), y2: P.sy(y1), tone: "ink", w: 3 } : { t: "line", id: `c${n.id}`, x1: P.sx(x0), y1: P.sy(s.t), x2: P.sx(x1), y2: P.sy(s.t), tone: "ink", w: 3 });
    }
    return [...sh, ...axes("ax", P, "x1", "x2"), ...points("p", P, TREE_TRAIN)];
  };
  const r = tree, done = splits.length, acc = accuracy((p) => predictTree(tree, p), TREE_TRAIN);
  return { kind: "scene", title: "A tree grows, one split at a time", height: 680, steps: [
    { note: `${TREE_TRAIN.length} training points: ${r.c[0]} rings and ${r.c[1]} dots. Each box shows rings/dots and its Gini, G = 1 - p(ring)² - p(dot)². The root is mixed: G = ${fmt(r.imp)}.`, shapes: at(0) },
    ...splits.map((n, k) => {
      const s = n.split!, [L, R] = n.kids!;
      return { note: `Split ${k + 1}: try every cut on x1 and x2 in the lit box. ${F[s.f]} < ${s.t} wins: its sides have G ${fmt(L.imp)} and ${fmt(R.imp)}, weighted ${fmt(s.score)}, down from ${fmt(s.parent)}.`,
        tone: "hot" as const, shapes: at(k + 1) };
    }),
    { note: `Depth 3 stops it: ${leaves(tree).length} leaves, each predicting its majority. Training accuracy ${pct(acc)}. Pure boxes (G 0) are green; the rest still mix classes.`, tone: "ok",
      shapes: [...regions("g", P, tree), ...at(done).filter((x) => x.id !== "focus")] },
  ] };
}

// ---------- Decision trees: five bootstrapped trees vote ----------
function forestVote(): Flow {
  const Q = { x: 4.6, y: 6.2 }, cells = 12, size = 136, gap = 16, X0 = 16;
  const panel = (i: number) => plotBox(X0 + (i % 3) * (size + gap), 24 + Math.floor(i / 3) * (size + 56), size, size, [0, 10, 0, 10]);
  const grid = (id: string, P: Plot, f: (p: { x: number; y: number }) => number): Shape[] => Array.from({ length: cells * cells }, (_, k) => {
    const i = k % cells, j = Math.floor(k / cells), x = (i + 0.5) * (10 / cells), y = (j + 0.5) * (10 / cells);
    return { t: "rect", id: `${id}${k}`, x: P.sx(x - 5 / cells), y: P.sy(y + 5 / cells), w: q1(size / cells + 0.6), h: q1(size / cells + 0.6), tone: classTone(f({ x, y })), fill: 38 };
  });
  const votes = FOREST.trees.map((t) => predictTree(t.tree, Q)), yes = votes.filter(Boolean).length, n = votes.length;
  const tree = (i: number): Shape[] => {
    const P = panel(i), t = FOREST.trees[i].tree;
    return [...regions(`t${i}-`, P, t, 38), { t: "rect", id: `f${i}`, x: P.X, y: P.Y, w: size, h: size, tone: "muted", fill: 0, edge: true },
      { t: "dot", id: `q${i}`, x: P.sx(Q.x), y: P.sy(Q.y), r: 8, tone: "ink" },
      { t: "text", id: `l${i}`, x: P.X + size / 2, y: P.Y + size + 20, text: `tree ${i + 1}: ${votes[i] ? "dot" : "ring"}`, anchor: "middle", size: 17, tone: classTone(votes[i]), bold: true }];
  };
  const P5 = panel(5), forest: Shape[] = [...grid("v", P5, FOREST.predict), { t: "rect", id: "f5", x: P5.X, y: P5.Y, w: size, h: size, tone: "ink", fill: 0, edge: true },
    { t: "dot", id: "q5", x: P5.sx(Q.x), y: P5.sy(Q.y), r: 8, tone: "ink" },
    { t: "text", id: "l5", x: P5.X + size / 2, y: P5.Y + size + 20, text: `${yes} dot, ${n - yes} ring`, anchor: "middle", size: 17, bold: true }];
  const upTo = (k: number) => Array.from({ length: k }, (_, i) => tree(i)).flat();
  const dt = FOREST.deepTest, ft = FOREST.test, avg = FOREST.each.reduce((s, x) => s + x, 0) / n;
  return { kind: "scene", title: "A random forest votes", height: 440, steps: [
    { note: `Tree 1 trains on a bootstrap sample: ${TREE_TRAIN.length} draws with replacement, only ${FOREST.unique[0]} different points. Each split may try one random feature. It grows to full depth. The large plain dot is a new point to classify.`, shapes: upTo(1) },
    { note: `Trees 2 to 5 get their own samples and their own random features, so their regions differ. Each one alone is overfit: on ${TREE_TEST.length} test points they score ${FOREST.each.map(pct).join(", ")}.`, tone: "warn", shapes: upTo(5) },
    { note: `The forest asks every tree and takes the majority. For the large dot, ${Math.max(yes, n - yes)} of ${n} say ${yes * 2 > n ? "dot" : "ring"}. The voted regions are smoother than any single tree.`, tone: "hot", shapes: [...upTo(5), ...forest] },
    { note: `Test accuracy: one fully grown tree ${pct(dt)}, the average single forest tree ${pct(avg)}, the forest of ${n} ${pct(ft)}. Averaging many high-variance trees cancels much of their noise.`, tone: "ok", shapes: [...upTo(5), ...forest] },
  ] };
}

// ---------- Decision trees: gradient boosting, stump by stump ----------
function boostFlow(): Flow {
  const { xs, ys, lr } = BOOST, show = [0, 1, 2, 3, 10, 40], runs = boost(show[show.length - 1]);
  const P = plotBox(56, 40, 400, 300, [0, 10, 0, 4.5]);
  const at = (m: number, sticks: boolean): Shape[] => {
    const f = runs[m].at;
    return [...axes("ax", P, "x", "y", ["0", "10", "0", "4.5"]),
      curve("truth", P, boostTruth, [0, 10], [0, 4.5], 80, "muted", true),
      ...(sticks ? xs.map((x, i): Shape => ({ t: "line", id: `r${i}`, x1: P.sx(x), y1: P.sy(ys[i]), x2: P.sx(x), y2: P.sy(f(x)), tone: "bad", w: 2 })) : []),
      curve("model", P, f, [0, 10], [0, 4.5], 200, "hot"),
      ...xs.map((x, i): Shape => ({ t: "dot", id: `p${i}`, x: P.sx(x), y: P.sy(ys[i]), r: 5, tone: "ink" })),
      { t: "text", id: "lab", x: P.X + 10, y: P.Y + 18, text: `round ${m}: train MSE ${fmt(runs[m].mse)}`, size: 18, bold: true }];
  };
  const s1 = runs[1].stump!;
  return { kind: "scene", title: "Boosting: each stump fixes what is left", height: 400, steps: [
    { note: `Round 0 predicts the mean, ${fmt(runs[0].at(0))}, everywhere. The red sticks are the residuals, target minus prediction: what is still wrong. Train MSE ${fmt(runs[0].mse)}.`, tone: "bad", shapes: at(0, true) },
    { note: `Round 1 fits a stump, one split, to the residuals: x < ${fmt(s1.t)} gets ${fmt(s1.left)}, the rest ${fmt(s1.right)}. Add ${lr} times it (the learning rate). MSE ${fmt(runs[1].mse)}.`, tone: "hot", shapes: at(1, true) },
    ...show.slice(2).map((m) => ({ note: m <= 3 ? `Round ${m}: a new stump on the new residuals, added at ${lr} strength. Each tree is weak; the sum gets better. MSE ${fmt(runs[m].mse)}.`
      : m < show[show.length - 1] ? `After ${m} rounds the steps follow the wave. Train MSE ${fmt(runs[m].mse)}, test MSE on ${BOOST.tx.length} new points ${fmt(runs[m].test)}.`
      : `After ${m} rounds train MSE ${fmt(runs[m].mse)} is below the noise level, ${fmt(BOOST.noise ** 2)}, so part of what it learned is noise. Test MSE ${fmt(runs[m].test)}. Choose the number of rounds by validation error.`,
      tone: m > 3 ? "ok" as const : undefined, shapes: at(m, m <= 10) })),
  ] };
}

// ---------- Classic models: logistic regression learns its sigmoid ----------
function logitFlow(): Flow {
  const { xs, ys } = LOGIT, { lr, show } = LOGIT_RUN, run = trainLogit(lr, show[show.length - 1]);
  const P = plotBox(56, 40, 400, 280, [0, 7.5, 0, 1]);
  const at = (t: number): Shape[] => {
    const { w, b } = run[t], bd = w ? -b / w : NaN, acc = xs.filter((x, i) => (sigmoid(w * x + b) >= 0.5 ? 1 : 0) === ys[i]).length / xs.length;
    return [...axes("ax", P, "hours of revision", "p(pass)", ["0", "7.5", "0", "1"]),
      { t: "line", id: "half", x1: P.X, y1: P.sy(0.5), x2: P.X + P.w, y2: P.sy(0.5), tone: "muted", w: 1.5, dash: true },
      ...(Number.isFinite(bd) && bd > 0 && bd < 7.5 ? [{ t: "line" as const, id: "bd", x1: P.sx(bd), y1: P.Y, x2: P.sx(bd), y2: P.Y + P.h, tone: "ok" as const, w: 3 }] : []),
      curve("sig", P, (x) => sigmoid(w * x + b), [0, 7.5], [0, 1], 80, "hot"),
      ...xs.map((x, i) => classDot(`p${i}`, P.sx(x), P.sy(ys[i]), ys[i], 7)),
      { t: "text", id: "lab", x: P.X + 10, y: P.Y + P.h - 40, text: `step ${t}: log loss ${fmt(run[t].loss)}, accuracy ${pct(acc)}`, size: 17, bold: true }];
  };
  const end = run[show[show.length - 1]], bd = -end.b / end.w;
  return { kind: "scene", title: "Logistic regression: fitting the sigmoid", height: 380, steps: show.map((t, i) => ({
    note: i === 0 ? `${xs.length} students: hours revised, and pass (dot, at 1) or fail (ring, at 0). The model is p = σ(w x + b), σ(z) = 1 / (1 + e^-z). At w = b = 0 it says 0.5 for everyone: log loss ln 2 = ${fmt(run[0].loss)}.`
      : i < show.length - 1 ? `Step ${t} of gradient descent on the log loss (lr ${lr}): w = ${fmt(run[t].w)}, b = ${fmt(run[t].b)}. The curve tilts and sharpens; the green line is where p crosses 0.5.`
      : `After ${t} steps: w = ${fmt(end.w)}, b = ${fmt(end.b)}, log loss ${fmt(end.loss)}. The boundary sits at x = -b / w = ${fmt(bd)} hours. The overlapping students keep the loss above 0.`,
    tone: i === show.length - 1 ? "ok" as const : undefined, shapes: at(t) })) };
}

// ---------- Classic models: the support vector machine's widest street ----------
function svmFlow(): Flow {
  const P = plotBox(70, 30, 340, 340, [0, 10, 0, 10]), pc = perceptron(), mm = maxMargin(), pm = margin(pc.w, pc.b);
  /** The line w·x + b = off, clipped to the plot square. */
  const lineAt = (id: string, w: number[], b: number, off: number, tone: SceneTone, dash = false): Shape => {
    const pts: number[][] = [];
    for (const x of [0, 10]) { const y = (off - b - w[0] * x) / w[1]; if (y >= 0 && y <= 10) pts.push([x, y]); }
    for (const y of [0, 10]) { const x = (off - b - w[1] * y) / w[0]; if (x > 0 && x < 10) pts.push([x, y]); }
    const [a, c] = pts;
    return { t: "line", id, x1: P.sx(a[0]), y1: P.sy(a[1]), x2: P.sx(c[0]), y2: P.sy(c[1]), tone, w: 3, dash };
  };
  const n = Math.hypot(...pc.w), pw = pc.w.map((v) => v / n), pb = pc.b / n;
  const base = [...axes("ax", P, "x1", "x2"), ...points("p", P, SVM_PTS, 7)];
  const street = (w: number[], b: number, half: number, tone: SceneTone): Shape[] => [lineAt("m", w, b, 0, tone), lineAt("u", w, b, half, "muted", true), lineAt("d", w, b, -half, "muted", true)];
  return { kind: "scene", title: "SVM: the widest street", height: 420, steps: [
    { note: `${SVM_PTS.length} points that a straight line can separate. Many lines do it. Which one will do best on new points?`, shapes: base },
    { note: `The perceptron stops at the first line with no mistakes, after ${pc.updates} updates. It works, but its nearest point is only ${fmt(pm)} away: a small nudge in new data crosses it.`, tone: "warn", shapes: [...street(pw, pb, pm, "warn"), ...base] },
    { note: `The SVM picks the line with the widest gap, or margin, to the nearest points: ${fmt(mm.half)} on each side, a street ${fmt(2 * mm.half)} wide.`, tone: "hot", shapes: [...street(mm.w, mm.b, mm.half, "hot"), ...base] },
    { note: `Only the ${mm.sv.length} points on the edges of the street, the support vectors, fix where it lies. Move any other point (without crossing the street) and the line stays put.`, tone: "ok",
      shapes: [...street(mm.w, mm.b, mm.half, "hot"), ...mm.sv.map((p, i): Shape => ({ t: "dot", id: `sv${i}`, x: P.sx(p.x), y: P.sy(p.y), r: 14, tone: "ok", ring: true })), ...base] },
  ] };
}

export const FLOWS_1: Record<string, Flow> = {
  "s1-tree-grow": treeGrow(),
  "s1-forest": forestVote(),
  "s1-boost": boostFlow(),
  "s1-logit": logitFlow(),
  "s1-svm": svmFlow(),
  "s1-tfidf": tfidfFlow(),
  "s1-w2v": w2vFlow(),
  "s1-split": split,
  "s1-loop": loop,
  "s1-lsq": lsq(),
  "s1-gd": gd(),
  "s1-outlier": outlier(),
};
