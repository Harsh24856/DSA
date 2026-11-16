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

export const FLOWS_2: Record<string, Flow> = {
  "s2-neuron": neuron(),
  "s2-xor": xor(),
};
