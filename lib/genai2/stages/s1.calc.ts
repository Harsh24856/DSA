// Stage 1 (ML basics for LLMs): the data and math shared by the flows, walk-throughs, figures and module text.
// Client-safe: no module text here. Every number shown on the stage's pages is computed from these.
import { seededRng } from "../rng.ts";

/** Short number: 3 decimals, trailing zeros dropped; scientific outside 0.001 to 10,000. */
export const fmt = (x: number) => {
  if (x === 0 || Object.is(x, -0)) return "0";
  const a = Math.abs(x);
  return a < 1e-3 || a >= 1e4 ? x.toExponential(1) : String(Number(x.toFixed(3)));
};
export const r2 = (x: number) => x.toFixed(2);
export const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
export const mean = (xs: number[]) => sum(xs) / xs.length;

// ---------- learning as fitting: hours of practice against a test score out of 10 ----------
export const LINE = { xs: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4], ys: [2.3, 2.9, 3.2, 4.1, 4.4, 5.3, 5.5, 6.4] };
export const predict = (w: number, b: number, x: number) => w * x + b;
export const mse = (w: number, b: number, xs = LINE.xs, ys = LINE.ys) => mean(xs.map((x, i) => (predict(w, b, x) - ys[i]) ** 2));
/** Least squares line: w = cov(x, y) / var(x), b = mean y - w mean x. */
export function fitLine(xs = LINE.xs, ys = LINE.ys) {
  const mx = mean(xs), my = mean(ys);
  const cov = mean(xs.map((x, i) => (x - mx) * (ys[i] - my))), vx = mean(xs.map((x) => (x - mx) ** 2));
  const w = cov / vx, b = my - w * mx;
  return { mx, my, cov, vx, w, b, loss: mse(w, b, xs, ys) };
}
export const BEST = fitLine();

// ---------- loss and gradient descent on that line ----------
/** Gradient of the MSE: dL/dw = 2 mean(e x), dL/db = 2 mean(e), with e = prediction - target. */
export function gradLine(w: number, b: number, xs = LINE.xs, ys = LINE.ys) {
  const e = xs.map((x, i) => predict(w, b, x) - ys[i]);
  return { dw: 2 * mean(e.map((v, i) => v * xs[i])), db: 2 * mean(e) };
}
/** Full-batch gradient descent from (w0, b0); entry t holds the weights after t steps. */
export function gdLine(lr: number, steps: number, w0 = 0, b0 = 0) {
  let w = w0, b = b0;
  const out = [{ t: 0, w, b, loss: mse(w, b) }];
  for (let t = 1; t <= steps; t++) {
    const g = gradLine(w, b);
    w -= lr * g.dw; b -= lr * g.db;
    out.push({ t, w, b, loss: mse(w, b) });
  }
  return out;
}
/** The MSE is a bowl with curvature matrix 2[[mean x², mean x], [mean x, 1]]; gradient descent is stable only below 2 / (largest curvature). */
export function lrLimit(xs = LINE.xs) {
  const a = 2 * mean(xs.map((x) => x * x)), c = 2 * mean(xs), d = 2;
  const tr = a + d, det = a * d - c * c, big = (tr + Math.sqrt(tr * tr - 4 * det)) / 2, small = (tr - Math.sqrt(tr * tr - 4 * det)) / 2;
  return { big, small, max: 2 / big };
}
export const LIMIT = lrLimit();
/** The learning rate used by the gradient descent walk-through, the figure and the module text. */
export const GD = { lr: 0.1, show: [0, 1, 2, 3, 5, 10, 20, 50, 100] };
/** Five errors, one of them an outlier: how squared and absolute losses weigh it. */
export const OUTLIER = [0.5, -0.4, 0.3, -0.2, 4];

// ---------- overfitting: polynomials of rising degree on noisy samples of sin(pi x) ----------
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
export const truth = (x: number) => Math.sin(Math.PI * x);
export const POLY = (() => {
  const r = seededRng("s1-poly"), noise = 0.25, nTrain = 12, nVal = 40;
  const tx = Array.from({ length: nTrain }, (_, i) => -1 + (2 * i) / (nTrain - 1));
  const vx = Array.from({ length: nVal }, () => -1 + 2 * r());
  return { noise, tx, ty: tx.map((x) => truth(x) + noise * gauss(r)), vx, vy: vx.map((x) => truth(x) + noise * gauss(r)) };
})();
/** Solves A z = y by Gaussian elimination with partial pivoting. */
function solve(A: number[][], y: number[]) {
  const n = y.length, M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const z = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) z[r] = (M[r][n] - M.slice(r + 1).reduce((s, _, j) => s + M[r][r + 1 + j] * z[r + 1 + j], 0)) / M[r][r];
  return z;
}
/** Least squares polynomial, coefficients from the constant term up, through the normal equations (fine on [-1, 1] up to degree 11). */
export function polyfit(xs: number[], ys: number[], deg: number) {
  const P = xs.map((x) => Array.from({ length: deg + 1 }, (_, k) => x ** k));
  const A = Array.from({ length: deg + 1 }, (_, i) => Array.from({ length: deg + 1 }, (_, j) => sum(P.map((p) => p[i] * p[j]))));
  return solve(A, Array.from({ length: deg + 1 }, (_, i) => sum(P.map((p, n) => p[i] * ys[n]))));
}
export const polyval = (c: number[], x: number) => c.reduceRight((s, k) => s * x + k, 0);
export function polyErrors(deg: number) {
  const { tx, ty, vx, vy } = POLY, c = polyfit(tx, ty, deg);
  const err = (xs: number[], ys: number[]) => mean(xs.map((x, i) => (polyval(c, x) - ys[i]) ** 2));
  return { deg, c, train: err(tx, ty), val: err(vx, vy), size: Math.max(...c.map(Math.abs)) };
}
/** The same experiment with n training points instead of 12, scored on the same validation points. */
export function polyErrorsN(deg: number, n: number) {
  const r = seededRng(`s1-poly-${n}`), tx = Array.from({ length: n }, (_, i) => -1 + (2 * i) / (n - 1));
  const ty = tx.map((x) => truth(x) + POLY.noise * gauss(r)), c = polyfit(tx, ty, deg);
  const err = (xs: number[], ys: number[]) => mean(xs.map((x, i) => (polyval(c, x) - ys[i]) ** 2));
  return { deg, n, train: err(tx, ty), val: err(POLY.vx, POLY.vy) };
}
export const DEGREES = Array.from({ length: 12 }, (_, d) => polyErrors(d));
export const BEST_DEG = DEGREES.slice(0, 10).reduce((m, d) => (d.val < m.val ? d : m)).deg;

// ---------- precision, recall and F1: a spam filter's scores on 20 emails ----------
export const SPAM = {
  scores: [0.97, 0.93, 0.9, 0.86, 0.81, 0.77, 0.72, 0.66, 0.61, 0.55, 0.5, 0.44, 0.39, 0.33, 0.28, 0.22, 0.17, 0.12, 0.08, 0.03],
  labels: [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
};
/** Confusion counts and metrics when "score at or above t" means spam. Precision is NaN when nothing is flagged. */
export function confusion(t: number, { scores, labels } = SPAM) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  scores.forEach((s, i) => { const p = s >= t; if (p && labels[i]) tp++; else if (p) fp++; else if (labels[i]) fn++; else tn++; });
  const precision = tp / (tp + fp), recall = tp / (tp + fn), f1 = (2 * tp) / (2 * tp + fp + fn), acc = (tp + tn) / scores.length;
  return { tp, fp, fn, tn, precision, recall, f1, acc };
}

// ---------- text as numbers: three short documents ----------
export const DOCS = ["the cat sat on the mat", "the dog sat on the log", "the cat chased the dog"];
export const tokens = (d: string) => d.split(" ");
export const VOCAB = [...new Set(DOCS.flatMap(tokens))].sort();
export const counts = (d: string) => VOCAB.map((w) => tokens(d).filter((t) => t === w).length);
/** idf = ln(N / df): a word in every document gets 0. */
export const idf = (N: number, df: number) => Math.log(N / df);
export const DF = VOCAB.map((w) => DOCS.filter((d) => tokens(d).includes(w)).length);
export const IDF = DF.map((df) => idf(DOCS.length, df));
export const tfidf = (d: string) => counts(d).map((c, j) => c * IDF[j]);
export const cosine = (a: number[], b: number[]) => {
  const dot = sum(a.map((x, i) => x * b[i])), na = Math.hypot(...a), nb = Math.hypot(...b);
  return na && nb ? dot / (na * nb) : 0;
};
export const COUNTS = DOCS.map(counts), TFIDF = DOCS.map(tfidf);
export const pairCos = (vecs: number[][]) => [[0, 1], [0, 2], [1, 2]].map(([i, j]) => ({ i, j, cos: cosine(vecs[i], vecs[j]) }));

// ---------- word2vec: skip-gram pairs and one negative-sampling step ----------
export const SENT = "the cat sat on the mat".split(" ");
export const skipPairs = (words: string[], win: number) => words.flatMap((c, i) => words.flatMap((o, j) => (j !== i && Math.abs(i - j) <= win ? [[c, o] as [string, string]] : [])));
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
export const dot = (a: number[], b: number[]) => sum(a.map((x, i) => x * b[i]));
/** One skip-gram step with one negative: centre vector v, true context u, sampled negative n. Loss = -ln sigmoid(v.u) - ln sigmoid(-v.n). */
export function sgnsStep(v: number[], u: number[], n: number[], lr: number) {
  const sp = sigmoid(dot(v, u)), sn = sigmoid(dot(v, n));
  const loss = -Math.log(sp) - Math.log(1 - sn);
  const gv = v.map((_, k) => (sp - 1) * u[k] + sn * n[k]), gu = v.map((x) => (sp - 1) * x), gn = v.map((x) => sn * x);
  const v2 = v.map((x, k) => x - lr * gv[k]), u2 = u.map((x, k) => x - lr * gu[k]), n2 = n.map((x, k) => x - lr * gn[k]);
  return { sp, sn, loss, v2, u2, n2, sp2: sigmoid(dot(v2, u2)), sn2: sigmoid(dot(v2, n2)), loss2: -Math.log(sigmoid(dot(v2, u2))) - Math.log(1 - sigmoid(dot(v2, n2))) };
}
export const W2V = { v: [0.2, -0.1, 0.4], u: [0.1, 0.3, -0.2], n: [0.3, -0.2, 0.5], lr: 0.5 };

/** A real, tiny skip-gram with negative sampling, trained on first use (embCos) on a toy corpus where cat and dog, and milk and water, share contexts. */
export const CORPUS = [
  "the cat drinks milk", "the dog drinks water", "the cat drinks water", "the dog drinks milk",
  "a cat sleeps on the mat", "a dog sleeps on the mat", "the cat eats fish", "the dog eats meat",
  "she pours milk in a cup", "she pours water in a cup", "cold milk is good", "cold water is good",
];
export const W2V_CFG = { dim: 8, window: 2, negatives: 3, epochs: 300, lr: 0.05 };
/** `snaps` lists pass counts whose centre vectors are copied out (0 is before training), for the walk-through that watches them move. */
export const trainW2V = (window = W2V_CFG.window, snaps: number[] = []) => {
  const { dim, negatives, epochs, lr } = W2V_CFG, r = seededRng("s1-w2v");
  const sents = CORPUS.map(tokens), vocab = [...new Set(sents.flat())].sort(), id = new Map(vocab.map((w, i) => [w, i]));
  const init = () => vocab.map(() => Array.from({ length: dim }, () => (r() - 0.5) / dim));
  const V = init(), U = vocab.map(() => Array(dim).fill(0));
  const pairs = sents.flatMap((s) => skipPairs(s, window)).map(([c, o]) => [id.get(c)!, id.get(o)!]);
  const update = (c: number, o: number, label: number) => {
    const g = sigmoid(dot(V[c], U[o])) - label, vc = [...V[c]];
    for (let k = 0; k < dim; k++) { V[c][k] -= lr * g * U[o][k]; U[o][k] -= lr * g * vc[k]; }
  };
  const snap = new Map<number, number[][]>(), keep = (e: number) => { if (snaps.includes(e)) snap.set(e, V.map((v) => [...v])); };
  keep(0);
  for (let e = 0; e < epochs; e++) {
    for (const [c, o] of pairs) {
      update(c, o, 1);
      for (let k = 0; k < negatives; k++) { const n = Math.floor(r() * vocab.length); if (n !== o) update(c, n, 0); }
    }
    keep(e + 1);
  }
  return { vocab, vec: (w: string) => V[id.get(w)!], at: (e: number, w: string) => snap.get(e)![id.get(w)!] };
};
/** Training pairs in one pass over the corpus, counted without training. */
export const W2V_PAIRS = CORPUS.map(tokens).flatMap((s) => skipPairs(s, W2V_CFG.window)).length;
export const SHOW = ["cat", "dog", "milk", "water"];
let embCosCache: number[][] | undefined;
/** Cosine grid over SHOW from the toy run. Trained on first call (about 27 ms), so pages that never show it never pay. */
export function embCos() {
  if (embCosCache) return embCosCache;
  const emb = trainW2V(), c = SHOW.map((a) => SHOW.map((b) => cosine(emb.vec(a), emb.vec(b))));
  if (!(c[0][1] > c[0][2] && c[2][3] > c[1][3] && c[0][2] < 0)) throw new Error("the toy word2vec no longer puts cat near dog, milk near water, and cat and milk below 0");
  return (embCosCache = c);
}

// ---------- decision trees: two features, two classes, a little label noise ----------
export type P2 = { x: number; y: number; c: 0 | 1 };
export type Feat = "x" | "y";
/** The real pattern: class 1 in the upper right, and in a small upper left corner. */
export const treeTruth = (x: number, y: number): 0 | 1 => ((x > 5.5 && y > 3.5) || (x < 2.5 && y > 7) ? 1 : 0);
function makeP2(seed: string, n: number, flip: number): P2[] {
  const r = seededRng(seed);
  return Array.from({ length: n }, () => {
    const x = Math.round(100 * r()) / 10, y = Math.round(100 * r()) / 10, c = treeTruth(x, y);
    return { x, y, c: (r() < flip ? 1 - c : c) as 0 | 1 };
  });
}
export const TREE_FLIP = 0.1;
export const TREE_TRAIN = makeP2("s1-tree-24", 50, TREE_FLIP), TREE_TEST = makeP2("s1-tree-test", 400, TREE_FLIP);

/** Gini = 1 - p0² - p1²: the chance two points drawn at random from the node disagree. */
export const gini = (a: number, b: number) => { const n = a + b; return n ? 1 - (a / n) ** 2 - (b / n) ** 2 : 0; };
/** Entropy in bits: -Σ p log2 p. 1 for a 50/50 node, 0 for a pure one. */
export const entropy = (a: number, b: number) => { const n = a + b; return [a, b].reduce((s, k) => (k ? s - (k / n) * Math.log2(k / n) : s), 0); };
export type Crit = "gini" | "entropy";
const IMP = { gini, entropy };
const cnt = (pts: P2[]): [number, number] => [pts.filter((p) => !p.c).length, pts.filter((p) => p.c).length];
export type Split = { f: Feat; t: number; score: number; gain: number; parent: number };
/** The cut with the lowest weighted impurity of the two sides, over every midpoint between neighbouring values. */
export function bestSplit(pts: P2[], crit: Crit = "gini", minLeaf = 1, feats: Feat[] = ["x", "y"]): Split | undefined {
  const imp = IMP[crit], parent = imp(...cnt(pts));
  let best: Split | undefined;
  for (const f of feats) {
    const vals = [...new Set(pts.map((p) => p[f]))].sort((a, b) => a - b);
    for (let i = 1; i < vals.length; i++) {
      const t = Math.round(((vals[i - 1] + vals[i]) / 2) * 100) / 100, L = pts.filter((p) => p[f] < t), R = pts.filter((p) => p[f] >= t);
      if (L.length < minLeaf || R.length < minLeaf) continue;
      const score = (L.length * imp(...cnt(L)) + R.length * imp(...cnt(R))) / pts.length;
      if (!best || score < best.score - 1e-12) best = { f, t, score, gain: parent - score, parent };
    }
  }
  return best;
}
/** One cut of the data: the two sides' counts and impurities, and their weighted mean (the score bestSplit minimises). */
export function cutScore(f: Feat, t: number, pts: P2[] = TREE_TRAIN, crit: Crit = "gini") {
  const L = cnt(pts.filter((p) => p[f] < t)), R = cnt(pts.filter((p) => p[f] >= t)), nl = L[0] + L[1], nr = R[0] + R[1], imp = IMP[crit];
  return { L, R, gl: imp(...L), gr: imp(...R), score: (nl * imp(...L) + nr * imp(...R)) / pts.length, parent: imp(...cnt(pts)) };
}
export type Box = [number, number, number, number];   // x from, x to, y from, y to
export type TNode = { id: string; depth: number; pts: P2[]; c: [number, number]; imp: number; pred: 0 | 1; box: Box; split?: Split; kids?: [TNode, TNode] };
export type GrowOpts = { maxDepth: number; minLeaf?: number; crit?: Crit; feats?: () => Feat[] };
/** CART: split while the node is impure, the depth allows it and some cut lowers the impurity. `feats` picks the features a node may try (a random forest tries one). */
export function grow(pts: P2[], o: GrowOpts, id = "r", depth = 0, box: Box = [0, 10, 0, 10]): TNode {
  const c = cnt(pts), crit = o.crit ?? "gini", node: TNode = { id, depth, pts, c, imp: IMP[crit](...c), pred: c[1] > c[0] ? 1 : 0, box };
  if (depth >= o.maxDepth || node.imp === 0) return node;
  let s = bestSplit(pts, crit, o.minLeaf ?? 1, o.feats?.());
  if (o.feats && !(s && s.gain > 1e-12)) s = bestSplit(pts, crit, o.minLeaf ?? 1);
  if (!s || s.gain <= 1e-12) return node;
  const [x0, x1, y0, y1] = box, lb: Box = s.f === "x" ? [x0, s.t, y0, y1] : [x0, x1, y0, s.t], rb: Box = s.f === "x" ? [s.t, x1, y0, y1] : [x0, x1, s.t, y1];
  node.split = s;
  node.kids = [grow(pts.filter((p) => p[s.f] < s.t), o, id + "L", depth + 1, lb), grow(pts.filter((p) => p[s.f] >= s.t), o, id + "R", depth + 1, rb)];
  return node;
}
export const predictTree = (n: TNode, p: { x: number; y: number }): 0 | 1 => (n.kids && n.split ? predictTree(n.kids[p[n.split.f] < n.split.t ? 0 : 1], p) : n.pred);
export const leaves = (n: TNode): TNode[] => (n.kids ? [...leaves(n.kids[0]), ...leaves(n.kids[1])] : [n]);
/** Nodes in the order a tree grows them, level by level. */
export const bfs = (n: TNode): TNode[] => { const out = [n]; for (let i = 0; i < out.length; i++) out.push(...(out[i].kids ?? [])); return out; };
export const accuracy = (f: (p: P2) => number, pts: P2[]) => pts.filter((p) => f(p) === p.c).length / pts.length;
/** Train and test accuracy for every depth from 1 to 10, unpruned (one point per leaf allowed). */
export const DEPTHS = Array.from({ length: 10 }, (_, i) => {
  const t = grow(TREE_TRAIN, { maxDepth: i + 1 });
  return { depth: i + 1, train: accuracy((p) => predictTree(t, p), TREE_TRAIN), test: accuracy((p) => predictTree(t, p), TREE_TEST), leaves: leaves(t).length };
});
export const BEST_TREE_DEPTH = DEPTHS.reduce((m, d) => (d.test > m.test ? d : m)).depth;

// ---------- random forest: bootstrap samples, one random feature per split, majority vote ----------
export const FOREST = (() => {
  const r = seededRng("s1-forest"), n = TREE_TRAIN.length;
  const trees = Array.from({ length: 5 }, () => {
    const boot = Array.from({ length: n }, () => TREE_TRAIN[Math.floor(r() * n)]);
    return { boot, tree: grow(boot, { maxDepth: 20, feats: () => [r() < 0.5 ? "x" : "y"] }) };
  });
  const vote = (p: { x: number; y: number }) => trees.filter((t) => predictTree(t.tree, p) === 1).length;
  const predict = (p: { x: number; y: number }) => (vote(p) * 2 > trees.length ? 1 : 0);
  const deep = grow(TREE_TRAIN, { maxDepth: 20 });
  return { trees, vote, predict, deep,
    test: accuracy(predict, TREE_TEST), deepTest: accuracy((p) => predictTree(deep, p), TREE_TEST), each: trees.map((t) => accuracy((p) => predictTree(t.tree, p), TREE_TEST)),
    unique: trees.map((t) => new Set(t.boot).size) };
})();

// ---------- gradient boosting: stumps fitted to what is still wrong ----------
export const boostTruth = (x: number) => 2 + 1.6 * Math.sin(0.8 * x);
export const BOOST = (() => {
  const r = seededRng("s1-boost"), xs = Array.from({ length: 24 }, (_, i) => Math.round((0.3 + i * 0.41) * 100) / 100);
  const noise = 0.3, ys = xs.map((x) => Math.round((boostTruth(x) + noise * gauss(r)) * 100) / 100);
  const tx = Array.from({ length: 200 }, () => 10 * r()), ty = tx.map((x) => boostTruth(x) + noise * gauss(r));
  return { xs, ys, tx, ty, noise, lr: 0.5 };
})();
export type Stump = { t: number; left: number; right: number };
/** The one-split tree with the lowest squared error on the targets r. */
export function fitStump(xs: number[], r: number[]): Stump {
  let best = { t: xs[0], left: mean(r), right: mean(r), sse: Infinity };
  for (let i = 1; i < xs.length; i++) {
    const t = (xs[i - 1] + xs[i]) / 2, L = r.filter((_, j) => xs[j] < t), R = r.filter((_, j) => xs[j] >= t);
    const l = mean(L), rr = mean(R), sse = sum(L.map((v) => (v - l) ** 2)) + sum(R.map((v) => (v - rr) ** 2));
    if (sse < best.sse - 1e-12) best = { t, left: l, right: rr, sse };
  }
  return { t: best.t, left: best.left, right: best.right };
}
/** Round 0 predicts the mean; each round fits a stump to the residuals and adds lr times it. Entry m is the model after m rounds. */
export function boost(rounds: number, { xs, ys, lr } = BOOST) {
  const base = mean(ys), stumps: Stump[] = [];
  const at = (x: number, m: number) => base + lr * sum(stumps.slice(0, m).map((s) => (x < s.t ? s.left : s.right)));
  for (let m = 0; m < rounds; m++) stumps.push(fitStump(xs, ys.map((y, i) => y - at(xs[i], m))));
  return Array.from({ length: rounds + 1 }, (_, m) => ({ m, at: (x: number) => at(x, m), stump: stumps[m - 1], mse: mean(xs.map((x, i) => (at(x, m) - ys[i]) ** 2)),
    test: mean(BOOST.tx.map((x, i) => (at(x, m) - BOOST.ty[i]) ** 2)) }));
}

// ---------- logistic regression: hours of revision against pass (1) or fail (0) ----------
export const LOGIT = { xs: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7], ys: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1] };
export const logLoss = (w: number, b: number, xs = LOGIT.xs, ys = LOGIT.ys) => mean(xs.map((x, i) => { const p = sigmoid(w * x + b); return -(ys[i] ? Math.log(p) : Math.log(1 - p)); }));
/** Gradient descent on the mean log loss; the gradient is mean((p - y) x) and mean(p - y). Entry t is the model after t steps. */
export function trainLogit(lr: number, steps: number, { xs, ys } = LOGIT) {
  let w = 0, b = 0;
  const out = [{ t: 0, w, b, loss: logLoss(w, b, xs, ys) }];
  for (let t = 1; t <= steps; t++) {
    const e = xs.map((x, i) => sigmoid(w * x + b) - ys[i]);
    w -= lr * mean(e.map((v, i) => v * xs[i])); b -= lr * mean(e);
    out.push({ t, w, b, loss: logLoss(w, b, xs, ys) });
  }
  return out;
}
export const LOGIT_RUN = { lr: 0.2, show: [0, 1, 5, 20, 100, 500, 3000] };

// ---------- k-nearest neighbours on the tree data ----------
const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
/** The k training points closest to p (ties broken by position in the list) and the majority class among them. */
export function knn(p: { x: number; y: number }, k: number, train: P2[] = TREE_TRAIN) {
  const near = train.map((q, i) => ({ q, i, d: d2(p, q) })).sort((a, b) => a.d - b.d || a.i - b.i).slice(0, k);
  const ones = near.filter((n) => n.q.c).length;
  return { near, ones, pred: (ones * 2 > k ? 1 : 0) as 0 | 1 };
}

// ---------- support vector machine: the widest street between two separable classes ----------
export const SVM_PTS: P2[] = (() => {
  const r = seededRng("s1-svm"), out: P2[] = [];
  while (out.length < 16) {
    const x = Math.round(1 + 80 * r()) / 10, y = Math.round(1 + 80 * r()) / 10, s = y - (0.7 * x + 1.6);
    if (Math.abs(s) > 1.1 && out.filter((p) => p.c === (s > 0 ? 1 : 0)).length < 8) out.push({ x, y, c: s > 0 ? 1 : 0 });
  }
  return out;
})();
/** Perceptron from w = 0: add y x for every misclassified point, in order, until a pass makes no mistake. Returns the line w·x + b = 0. */
export function perceptron(pts = SVM_PTS) {
  let w = [0, 0], b = 0, passes = 0, updates = 0;
  for (let mistakes = 1; mistakes && passes < 1000; passes++) {
    mistakes = 0;
    for (const p of pts) { const s = p.c ? 1 : -1; if (s * (w[0] * p.x + w[1] * p.y + b) <= 0) { w = [w[0] + s * p.x, w[1] + s * p.y]; b += s; mistakes++; updates++; } }
  }
  return { w, b, passes, updates };
}
/** Distance from the line w·x + b = 0 to the nearest point, signed: negative if some point is on the wrong side. */
export const margin = (w: number[], b: number, pts = SVM_PTS) => Math.min(...pts.map((p) => ((p.c ? 1 : -1) * (w[0] * p.x + w[1] * p.y + b)) / Math.hypot(w[0], w[1])));
/** The maximum margin line, exactly. The best direction is either along the gap between one point of each class, or
 *  square to the segment between two points of one class; try them all and keep the widest street. */
export function maxMargin(pts = SVM_PTS) {
  const P = pts.filter((p) => p.c), N = pts.filter((p) => !p.c), dirs: number[][] = [];
  for (const a of P) for (const c of N) dirs.push([a.x - c.x, a.y - c.y]);
  for (const S of [P, N]) for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) { const dx = S[j].x - S[i].x, dy = S[j].y - S[i].y; dirs.push([-dy, dx], [dy, -dx]); }
  let best = { u: [1, 0], lo: 0, hi: 0, half: -Infinity };
  for (const d of dirs) {
    const len = Math.hypot(d[0], d[1]), u = [d[0] / len, d[1] / len], pr = (p: P2) => u[0] * p.x + u[1] * p.y;
    const lo = Math.max(...N.map(pr)), hi = Math.min(...P.map(pr)), half = (hi - lo) / 2;
    if (half > best.half + 1e-12) best = { u, lo, hi, half };
  }
  const { u, lo, hi, half } = best, b = -(lo + hi) / 2, sv = pts.filter((p) => Math.abs(u[0] * p.x + u[1] * p.y + b) - half < 1e-9);
  return { w: u, b, half, sv };
}

// ---------- k-means on three blobs ----------
export const BLOBS = (() => {
  const r = seededRng("s1-blobs"), centres = [[2.6, 7.2], [7.3, 7.4], [5, 2.6]], c = (v: number) => Math.min(9.7, Math.max(0.3, v));
  return centres.flatMap(([cx, cy]) => Array.from({ length: 12 }, () => ({ x: Math.round(c(cx + 1.1 * gauss(r)) * 10) / 10, y: Math.round(c(cy + 1.1 * gauss(r)) * 10) / 10 })));
})();
type XY = { x: number; y: number };
/** Lloyd's k-means from k distinct starting points picked by the seed: assign each point to its nearest centre, move each centre to
 *  the mean of its points, repeat until no point changes cluster. Entry i holds the centres, the assignment to them and the inertia. */
export function kmeans(k: number, seed: number, pts: XY[] = BLOBS) {
  const r = seededRng(`s1-km-${seed}`), idx: number[] = [];
  while (idx.length < k) { const i = Math.floor(r() * pts.length); if (!idx.includes(i)) idx.push(i); }
  let cent = idx.map((i) => ({ ...pts[i] }));
  const assign = (cs: XY[]) => pts.map((p) => cs.reduce((m, c, j) => (d2(p, c) < d2(p, cs[m]) ? j : m), 0));
  const inertia = (cs: XY[], a: number[]) => sum(pts.map((p, i) => d2(p, cs[a[i]])));
  const out: { cent: XY[]; a: number[]; inertia: number }[] = [];
  let a = assign(cent);
  out.push({ cent, a, inertia: inertia(cent, a) });
  for (let it = 0; it < 20; it++) {
    cent = cent.map((c, j) => { const m = pts.filter((_, i) => a[i] === j); return m.length ? { x: mean(m.map((p) => p.x)), y: mean(m.map((p) => p.y)) } : c; });
    const a2 = assign(cent);
    out.push({ cent, a: a2, inertia: inertia(cent, a2) });
    if (a2.every((v, i) => v === a[i])) break;
    a = a2;
  }
  return out;
}
/** The best final inertia over five starts, for k from 1 to 6: the elbow curve. */
export const ELBOW = Array.from({ length: 6 }, (_, i) => ({ k: i + 1, inertia: Math.min(...[1, 2, 3, 4, 5].map((s) => kmeans(i + 1, s).at(-1)!.inertia)) }));

// ---------- PCA: twenty points that mostly vary along one direction ----------
export const PCA_PTS = (() => {
  const r = seededRng("s1-pca");
  return Array.from({ length: 20 }, () => { const t = 1.4 * gauss(r); return { x: Math.round((5 + 1.5 * t + 0.8 * gauss(r)) * 10) / 10, y: Math.round((5 + 0.9 * t + 0.8 * gauss(r)) * 10) / 10 }; });
})();
/** Covariance, its eigenvalues and the first principal direction (as an angle in degrees, 0 to 180) of 2-D points. */
export function pca2d(pts: XY[] = PCA_PTS) {
  const mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  const sxx = mean(pts.map((p) => (p.x - mx) ** 2)), syy = mean(pts.map((p) => (p.y - my) ** 2)), sxy = mean(pts.map((p) => (p.x - mx) * (p.y - my)));
  const tr = sxx + syy, gap = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2), l1 = tr / 2 + gap, l2 = tr / 2 - gap;
  const ang = ((((Math.atan2(2 * sxy, sxx - syy) / 2) * 180) / Math.PI) + 180) % 180;
  return { mx, my, sxx, syy, sxy, l1, l2, ang, total: tr };
}
/** Variance of the points projected on the direction at `deg` degrees: uᵀ C u. */
export const varAlong = (deg: number, c = pca2d()) => { const a = (deg * Math.PI) / 180, u = [Math.cos(a), Math.sin(a)]; return c.sxx * u[0] ** 2 + 2 * c.sxy * u[0] * u[1] + c.syy * u[1] ** 2; };
/** Top two principal directions of n-dimensional vectors, by power iteration with deflation, and each vector's two coordinates on them. */
export function pcaTop2(vs: number[][]) {
  const d = vs[0].length, m = Array.from({ length: d }, (_, k) => mean(vs.map((v) => v[k]))), X = vs.map((v) => v.map((x, k) => x - m[k]));
  const C = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => mean(X.map((v) => v[i] * v[j]))));
  const axes: number[][] = [];
  for (let a = 0; a < 2; a++) {
    let u = Array.from({ length: d }, (_, k) => 1 + k / d);
    for (let it = 0; it < 500; it++) {
      let v = C.map((row) => dot(row, u));
      for (const prev of axes) { const pv = dot(v, prev); v = v.map((x, k) => x - pv * prev[k]); }
      const n = Math.hypot(...v); u = v.map((x) => x / n);
    }
    axes.push(u);
  }
  return { m, axes, project: (v: number[]) => axes.map((ax) => dot(v.map((x, k) => x - m[k]), ax)) };
}
