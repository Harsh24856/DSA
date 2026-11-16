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

export const FLOWS_2: Record<string, Flow> = {
  "s2-neuron": neuron(),
};
