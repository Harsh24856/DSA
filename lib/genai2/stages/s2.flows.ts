// Stage 2 (Neural networks): animated walk-throughs, and the small math they share with the stage's walk-throughs,
// figures and modules. Client-safe: imports only flow types. Every number shown is computed here.
import type { Flow, GridTable } from "../../other/flows.ts";
import { seededRng } from "../rng.ts";
import { cnnStack } from "./s2.calc.ts";

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
// A sum written with its signs: [[1.2, "1.2"], [-0.4, "0.4"]] gives "1.2 - 0.4". Each text is the term's size, without its sign.
export const signedSum = (terms: [number, string][]) => terms.map(([v, t], i) => (i === 0 ? (v < 0 ? `-${t}` : t) : `${v < 0 ? "-" : "+"} ${t}`)).join(" ");
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
    { note: `Add them up and add the bias: z = ${signedSum([...prod, b].map((v): [number, string] => [v, fmt(Math.abs(v))]))} = ${fmt(z)}. This is w · x + b, a straight-line function of the inputs.`, tone: "hot",
      tables: [T(prod.map(fmt)), { label: "pre-activation", rows: [[`z = ${fmt(z)}`]], tones: { "0": "hot" } }] },
    { note: `Pass z through an activation. Each one bends the line differently. The slope column is what the gradient gets multiplied by on the way back.`, tone: "ok", tables: [A(z, { ":1": "ok" })] },
    { note: `Lower the bias to ${bLow}: z = ${fmt(zl)}. ReLU now outputs 0 and its slope is 0, so this input teaches its weights nothing. Sigmoid, tanh and GELU still pass gradient: slopes ${["sigmoid", "tanh", "GELU"].map((n) => fmt(act(n).d(zl))).join(", ")}.`, tone: "warn",
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

// Optimisers: Adam's update, and the warmup plus cosine schedule.
export const ADAM = { lr: 0.01, b1: 0.9, b2: 0.999, eps: 1e-8 };
/** Runs Adam on a gradient sequence; returns each step's m-hat, sqrt(v-hat) and the step taken (positive = weight goes down). */
export function adamSteps(gs: number[], correct = true) {
  const { lr, b1, b2, eps } = ADAM;
  let m = 0, v = 0;
  return gs.map((g, i) => {
    const t = i + 1;
    m = b1 * m + (1 - b1) * g; v = b2 * v + (1 - b2) * g * g;
    const mh = correct ? m / (1 - b1 ** t) : m, vh = correct ? v / (1 - b2 ** t) : v;
    return { g, mh, sv: Math.sqrt(vh), step: (lr * mh) / (Math.sqrt(vh) + eps) };
  });
}
export const SCHED = { peak: 3e-4, min: 3e-5, warm: 1000, total: 10000 };
export const lrAt = (t: number) => {
  const { peak, min, warm, total } = SCHED;
  if (t < warm) return (peak * t) / warm;
  return min + 0.5 * (peak - min) * (1 + Math.cos((Math.PI * (t - warm)) / (total - warm)));
};

function adamFlow(): Flow {
  const gA = [4, 3.6, 4.4, 4], gB = gA.map((g) => g / 1000), { lr } = ADAM;
  const A = adamSteps(gA), B = adamSteps(gB), raw = adamSteps(gA, false)[0];
  const ratio = Math.round(gA[0] / gB[0]);
  return { kind: "grid", title: "Adam against SGD, step by step", steps: [
    { note: `Weight A sees gradients near ${gA[0]}, weight B near ${gB[0]}: ${ratio} times smaller. SGD with lr ${lr} moves each by lr × gradient, so B barely moves.`, tone: "warn",
      tables: [{ head: ["weight", "gradient", "SGD step"], rows: [["A", gA[0], fmt(lr * gA[0])], ["B", gB[0], fmt(lr * gB[0])]], tones: { "1:2": "bad" } }] },
    { note: `Adam keeps m, an average of gradients, and v, an average of squared gradients. Step = lr × m̂ / √v̂. At t = 1, m̂ = g and √v̂ = |g|, so both weights move lr (ε aside).`, tone: "ok",
      tables: [{ head: ["g", "m̂", "√v̂", "step"], rowHead: ["A", "B"], rows: [A[0], B[0]].map((x) => [fmt(x.g), fmt(x.mh), fmt(x.sv), fmt(x.step)]), tones: { ":3": "ok" } }] },
    { note: `Why the hats? m and v start at 0, so early averages are too small. Uncorrected at t = 1: m = ${fmt(raw.mh)}, √v = ${fmt(raw.sv)}, a step of ${fmt(raw.step)}, ${fmt(raw.step / lr)} times lr. Dividing by (1 - β^t) fixes it.`, tone: "warn",
      tables: [{ head: ["version", "m", "√v", "step"], rows: [["no hats", fmt(raw.mh), fmt(raw.sv), fmt(raw.step)], ["with hats", fmt(A[0].mh), fmt(A[0].sv), fmt(A[0].step)]], tones: { "0:3": "bad", "1:3": "ok" } }] },
    { note: `Four steps. The gradients wobble, but A and B take the same steps, about lr each, even though their gradients differ ${ratio} times. Adam ignores the gradient's scale and keeps its direction and consistency.`, tone: "ok",
      tables: [{ head: ["t", "A grad", "A step", "B step"], rows: A.map((x, i) => [i + 1, fmt(x.g), fmt(x.step), fmt(B[i].step)]), tones: { ":2": "ok", ":3": "ok" } }] },
  ] };
}

// Making deep nets train: a real 12-layer network, run forward and backward, measuring how much gradient reaches each layer.
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
export const VANISH = { width: 32, depth: 12, batch: 8, resScale: 0.25 };
type Net = { label: string; act: "sigmoid" | "relu"; varW: number; residual?: boolean };
function gradReach(net: Net) {
  const { width: N, depth: D, batch, resScale } = VANISH, r = seededRng("s2-vanish");
  const f = net.act === "sigmoid" ? sigmoid : (z: number) => Math.max(0, z);
  const df = net.act === "sigmoid" ? (z: number) => sigmoid(z) * (1 - sigmoid(z)) : (z: number) => (z > 0 ? 1 : 0);
  const sd = Math.sqrt(net.varW / N) * (net.residual ? resScale : 1);
  const Ws = Array.from({ length: D }, () => Array.from({ length: N }, () => Array.from({ length: N }, () => gauss(r) * sd)));
  const sum = Array(D + 1).fill(0);
  for (let b = 0; b < batch; b++) {
    let h = Array.from({ length: N }, () => gauss(r));
    const Zs: number[][] = [];
    for (const W of Ws) {
      const z = W.map((row) => row.reduce((s, w, j) => s + w * h[j], 0)), a = z.map(f);
      Zs.push(z); h = net.residual ? h.map((x, i) => x + a[i]) : a;
    }
    let g = Array.from({ length: N }, () => gauss(r));
    const top = Math.hypot(...g);
    sum[0] += 1;
    for (let k = D - 1; k >= 0; k--) {
      const dz = g.map((x, i) => x * df(Zs[k][i]));
      const back = Array.from({ length: N }, (_, j) => Ws[k].reduce((s, row, i) => s + row[j] * dz[i], 0));
      g = net.residual ? g.map((x, j) => x + back[j]) : back;
      sum[D - k] += Math.hypot(...g) / top;
    }
  }
  return sum.map((x) => x / batch);   // [k] = gradient size k layers below the top, relative to the top
}
export const NETS: Net[] = [
  { label: "sigmoid", act: "sigmoid", varW: 1 },
  { label: "ReLU, 1/n", act: "relu", varW: 1 },
  { label: "ReLU, He", act: "relu", varW: 2 },
  { label: "residual", act: "relu", varW: 2, residual: true },
];
export const REACH = NETS.map(gradReach);
function vanish(): Flow {
  const D = VANISH.depth, at = [0, 3, 6, 9, 12];
  const bars = (k: number) => NETS.map((n, i) => ({ label: n.label, value: REACH[i][k], tone: REACH[i][k] < 0.01 ? "bad" as const : REACH[i][k] > 0.5 ? "ok" as const : "warn" as const }));
  return { kind: "bars", title: `Gradient reaching each layer of a ${D}-layer net`, format: fmt, steps: at.map((k) => ({
    tone: k === 0 ? undefined : REACH[0][k] < 0.01 ? "bad" as const : "warn" as const,
    note: k === 0
      ? `Four real ${D}-layer networks, ${VANISH.width} units wide, the same random input. The residual one adds each layer to its input (x + F(x)), with its branch weights started ${VANISH.resScale} times smaller. At the top each gradient is scaled to 1.`
      : k < D ? `${k} layers down. Sigmoid has ${fmt(REACH[0][k])} left: each layer multiplies by a slope of at most ${fmt(sigmoid(0) * (1 - sigmoid(0)))}. ReLU with weight variance 1/n keeps ${fmt(REACH[1][k])}.`
      : `At the first layer: sigmoid ${fmt(REACH[0][k])}, ReLU 1/n ${fmt(REACH[1][k])}, ReLU He ${fmt(REACH[2][k])}, residual ${fmt(REACH[3][k])}. He init and the skip path keep the first layers learning.`,
    bars: bars(k),
  })) };
}

// Convolutional networks: the shape of the data after every layer of a small digit classifier.
function cnnShapes(): Flow {
  const rows = cnnStack(), n0 = (x: number) => x.toLocaleString("en-US");
  const head = ["layer", "output", "params"], cell = (r: (typeof rows)[number]) => [r[0], r[1] === 1 && r[2] === 1 ? String(r[3]) : `${r[1]}×${r[2]}×${r[3]}`, n0(r[4])];
  const conv = rows.reduce((s, r) => s + (r[0].startsWith("conv") ? r[4] : 0), 0), dense = rows[rows.length - 1][4];
  const upto = (k: number, note: string, tone?: "ok" | "hot" | "warn") => ({ note, tone, tables: [{ head, rows: rows.slice(0, k).map(cell), tones: { [String(k - 1)]: "hot" as const } }] });
  return { kind: "grid", title: "A small CNN for 28×28 digits", steps: [
    upto(2, `A 3×3 convolution with ${rows[1][3]} filters: each filter makes one map, and no padding trims a pixel from every edge (28 to ${rows[1][1]}). Only ${n0(rows[1][4])} parameters.`),
    upto(3, `Max pooling halves height and width and has no weights: ${rows[2][1]}×${rows[2][2]}.`),
    upto(5, `A second conv reads all ${rows[2][3]} maps at once, so each filter has 3×3×${rows[2][3]} + 1 weights. Pool again: ${rows[4][1]}×${rows[4][2]}×${rows[4][3]}.`),
    upto(7, `Flatten to ${n0(rows[5][3])} numbers and finish with a dense layer. The two convs hold ${n0(conv)} parameters; the one dense layer holds ${n0(dense)}.`, "ok"),
  ] };
}

export const FLOWS_2: Record<string, Flow> = {
  "s2-cnn-stack": cnnShapes(),
  "s2-neuron": neuron(),
  "s2-xor": xor(),
  "s2-matgrad": matGrad(),
  "s2-adam": adamFlow(),
  "s2-vanish": vanish(),
};
