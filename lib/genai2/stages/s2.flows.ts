// Stage 2 (Neural networks): animated walk-throughs, and the small math they share with the stage's walk-throughs,
// figures and modules. Client-safe: imports only flow types. Every number shown is computed here.
import type { Flow, GridTable } from "../../other/flows.ts";

/** Short number: 3 decimals, trailing zeros dropped; scientific outside 0.001 to 10,000. */
export const fmt = (x: number) => {
  if (x === 0 || Object.is(x, -0)) return "0";
  const a = Math.abs(x);
  return a < 1e-3 || a >= 1e4 ? x.toExponential(1) : String(Number(x.toFixed(3)));
};

// erf by Abramowitz and Stegun 7.1.26 (error under 1.5e-7), enough for 3 decimals
const erf = (x: number) => {
  const s = Math.sign(x), t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2)), phi = (z: number) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

/** The activations taught in stage 2: value and slope. ReLU's slope at exactly 0 is taken as 0, as frameworks do. */
export const ACTS: { name: string; f: (z: number) => number; d: (z: number) => number }[] = [
  { name: "ReLU", f: (z) => Math.max(0, z), d: (z) => (z > 0 ? 1 : 0) },
  { name: "Leaky ReLU", f: (z) => (z > 0 ? z : 0.01 * z), d: (z) => (z > 0 ? 1 : 0.01) },
  { name: "sigmoid", f: sigmoid, d: (z) => sigmoid(z) * (1 - sigmoid(z)) },
  { name: "tanh", f: Math.tanh, d: (z) => 1 - Math.tanh(z) ** 2 },
  { name: "GELU", f: (z) => z * Phi(z), d: (z) => Phi(z) + z * phi(z) },
  { name: "SiLU", f: (z) => z * sigmoid(z), d: (z) => sigmoid(z) * (1 + z * (1 - sigmoid(z))) },
];
export const act = (name: string) => ACTS.find((a) => a.name === name)!;

// The neuron used by the figure, the walk-through and the module text.
export const NEURON = { x: [2, -1, 0.5], w: [0.6, 0.4, -0.8], b: 0.1, bLow: -1 };
export const neuronZ = (b: number) => NEURON.x.reduce((s, x, i) => s + x * NEURON.w[i], b);

function neuron(): Flow {
  const { x, w, b, bLow } = NEURON, prod = x.map((v, i) => v * w[i]), z = neuronZ(b), zl = neuronZ(bLow);
  const rows = (last: (string | number)[]) => x.map((v, i) => [`x${i + 1}`, v, w[i], last[i]]);
  const T = (last: (string | number)[], tones?: GridTable["tones"]): GridTable => ({ head: ["input", "x", "w", "x × w"], rows: rows(last), tones });
  const show = ["ReLU", "sigmoid", "tanh", "GELU"];
  const A = (zz: number, tones?: GridTable["tones"]): GridTable => ({ label: `z = ${fmt(zz)}`, head: ["activation", "output", "slope"], rows: show.map((n) => [n, fmt(act(n).f(zz)), fmt(act(n).d(zz))]), tones });
  return { kind: "grid", title: "One neuron, by hand", steps: [
    { note: `A neuron has one weight per input and one bias. Here 3 inputs, weights ${w.join(", ")} and bias ${b}.`, tables: [T(["", "", ""])] },
    { note: `Multiply each input by its weight: ${prod.map(fmt).join(", ")}. A big weight means that input matters a lot.`, tables: [T(prod.map(fmt), { ":3": "hot" })] },
    { note: `Add them up and add the bias: z = ${prod.map(fmt).join(" + ")} + ${b} = ${fmt(z)}. This is w · x + b, a straight-line function of the inputs.`, tone: "hot",
      tables: [T(prod.map(fmt)), { label: "pre-activation", rows: [[`z = ${fmt(z)}`]], tones: { "0": "hot" } }] },
    { note: `Pass z through an activation. Each one bends the line differently. The slope column is what the gradient gets multiplied by on the way back.`, tone: "ok", tables: [A(z, { ":1": "ok" })] },
    { note: `Lower the bias to ${bLow}: z = ${fmt(zl)}. ReLU now outputs 0 and its slope is 0, so this input teaches its weights nothing. Sigmoid, tanh and GELU still pass a little gradient.`, tone: "warn",
      tables: [A(zl, { "0": "bad" })] },
  ] };
}

// MLP and the forward pass: a 2-2-1 ReLU network that solves XOR, with weights chosen by hand.
export const XOR = { X: [[0, 0], [0, 1], [1, 0], [1, 1]], W1: [[1, 1], [1, 1]], b1: [0, -1], W2: [1, -2], b2: 0 };
function xor(): Flow {
  const { X, W1, b1, W2, b2 } = XOR;
  const Z = X.map((x) => [0, 1].map((j) => x[0] * W1[0][j] + x[1] * W1[1][j] + b1[j]));
  const H = Z.map((z) => z.map((v) => Math.max(0, v)));
  const Y = H.map((h) => h[0] * W2[0] + h[1] * W2[1] + b2), lin = Z.map((z) => z[0] * W2[0] + z[1] * W2[1] + b2);
  const T = X.map((x) => x[0] ^ x[1]), rowHead = X.map((x) => `(${x.join(", ")})`);
  const wrong = lin.flatMap((v, i) => (v === T[i] ? [] : [i]));
  if (Y.some((y, i) => y !== T[i])) throw new Error("the XOR weights no longer solve XOR");
  const G = (head: string[], cols: (number | string)[][], tones?: GridTable["tones"]): GridTable => ({ head, rowHead, rows: X.map((_, i) => cols.map((c) => c[i])), tones });
  const col = (m: number[][], j: number) => m.map((r) => r[j]);
  return { kind: "grid", title: "A tiny MLP learns XOR", steps: [
    { note: "XOR is 1 when exactly one input is 1. Plot the four points: no single straight line puts both 1s on one side, so one linear layer cannot do this.",
      tables: [G(["x1", "x2", "target"], [col(X, 0), col(X, 1), T], { ":2": "hot" })] },
    { note: `Hidden layer, z = x W1 + b1. Both units add the two inputs; unit 2 also has bias ${b1[1]}, so it only turns positive when both inputs are 1.`,
      tables: [G(["x1", "x2", "z1", "z2"], [col(X, 0), col(X, 1), col(Z, 0), col(Z, 1)], { ":3": "hot" })] },
    { note: `ReLU: h = max(0, z). ${((k) => (k === 1 ? "The one negative entry becomes" : `The ${k} negative entries become`))(Z.flat().filter((v) => v < 0).length)} 0. This is the bend that a straight line cannot make.`, tone: "hot",
      tables: [G(["z1", "z2", "h1", "h2"], [col(Z, 0), col(Z, 1), col(H, 0), col(H, 1)], Object.fromEntries(Z.flatMap((z, i) => z.flatMap((v, j) => (v < 0 ? [[`${i}:${j + 2}`, "hot"]] : [])))))] },
    { note: `Output layer, y = ${W2[0]} × h1 ${W2[1] < 0 ? "-" : "+"} ${Math.abs(W2[1])} × h2. Every row now matches XOR.`, tone: "ok",
      tables: [G(["h1", "h2", "y", "target"], [col(H, 0), col(H, 1), Y, T], { ":2": "ok" })] },
    { note: `Take the ReLU out and y = ${W2[0]} × z1 ${W2[1] < 0 ? "-" : "+"} ${Math.abs(W2[1])} × z2 is a straight-line function of x again. It gets ${wrong.length} of 4 wrong: ${wrong.map((i) => rowHead[i]).join(" and ")}.`, tone: "bad",
      tables: [G(["z1", "z2", "y, no ReLU", "target"], [col(Z, 0), col(Z, 1), lin, T], Object.fromEntries(wrong.map((i) => [`${i}:2`, "bad"])))] },
  ] };
}

// Backprop on a graph: one sigmoid neuron with a squared loss, forward values and every gradient.
export const BP = { w: 0.5, x: 2, b: -0.2, y: 1 };
export const bpLoss = (w: number, b = BP.b) => (sigmoid(w * BP.x + b) - BP.y) ** 2;
export function bpGraph() {
  const { w, x, b, y } = BP, z = w * x + b, p = sigmoid(z), L = (p - y) ** 2;
  const dp = 2 * (p - y), pz = p * (1 - p), dz = dp * pz;
  return { z, p, L, dp, pz, dz, dw: dz * x, db: dz, dx: dz * w };
}

// Backprop on a graph: the matrix rule for Y = X W, checked by nudging one weight.
const matmul = (A: number[][], B: number[][]) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const tr = (A: number[][]) => A[0].map((_, j) => A.map((r) => r[j]));
function matGrad(): Flow {
  const X = [[1, 2, 0], [0, 1, -1]], W = [[1, 0], [-1, 2], [0.5, 1]], G = [[1, 0], [0, -1]];
  const Y = matmul(X, W), dW = matmul(tr(X), G), dX = matmul(G, tr(W));
  const L = (Wm: number[][]) => matmul(X, Wm).flat().reduce((s, v, i) => s + v * G.flat()[i], 0);   // L = sum of Y times G, so dL/dY = G
  const [r, c, h] = [1, 0, 1e-6], Wn = W.map((row, i) => row.map((v, j) => (i === r && j === c ? v + h : v)));
  const nudge = (L(Wn) - L(W)) / h;
  const M = (label: string, m: number[][], tone?: "hot" | "ok"): GridTable => ({ label: `${label} (${m.length} × ${m[0].length})`, rows: m.map((row) => row.map(fmt)), tones: tone ? { ":0": tone, ":1": tone, ":2": tone } : undefined });
  return { kind: "grid", title: "Gradients of Y = X W", steps: [
    { note: `Forward: X is ${X.length} × ${X[0].length}, W is ${W.length} × ${W[0].length}, so Y = X W is ${Y.length} × ${Y[0].length}. Keep X: the backward pass needs it.`, tables: [M("X", X), M("W", W), M("Y = X W", Y, "hot")] },
    { note: "The layer above sends back dL/dY. It always has exactly Y's shape: one number per entry of Y, saying how the loss changes if that entry grows.", tone: "hot", tables: [M("dL/dY", G, "hot")] },
    { note: `dL/dW = Xᵀ dL/dY. Xᵀ is ${X[0].length} × ${X.length} and dL/dY is ${G.length} × ${G[0].length}, so the result is ${dW.length} × ${dW[0].length}, the same shape as W. That is how you remember where the transpose goes.`, tone: "ok",
      tables: [M("Xᵀ", tr(X)), M("dL/dY", G), M("dL/dW", dW, "ok")] },
    { note: `dL/dX = dL/dY Wᵀ: ${dX.length} × ${dX[0].length}, the shape of X. This is what the layer passes further back to the layer below.`, tone: "ok",
      tables: [M("dL/dY", G), M("Wᵀ", tr(W)), M("dL/dX", dX, "ok")] },
    { note: `Check one entry. Nudge W row ${r + 1}, column ${c + 1} by ${h} and the loss moves by ${fmt(nudge)} per unit. The formula said ${fmt(dW[r][c])}.`, tone: Math.abs(nudge - dW[r][c]) < 1e-6 ? "ok" : "bad",
      tables: [{ head: ["entry", "formula", "nudge"], rows: [[`W[${r + 1}][${c + 1}]`, fmt(dW[r][c]), fmt(nudge)]], tones: { "0": "ok" } }] },
  ] };
}

export const FLOWS_2: Record<string, Flow> = {
  "s2-neuron": neuron(),
  "s2-xor": xor(),
  "s2-matgrad": matGrad(),
};
