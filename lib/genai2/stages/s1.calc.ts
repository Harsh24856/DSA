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
