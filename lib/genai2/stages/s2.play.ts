// Stage 2 (Neural networks): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow, GridTable } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { ACTS, BP, bpLoss, fmt, sigmoid } from "./s2.flows.ts";

// Neuron and activations: output and slope of each activation at z, then the slope multiplied through n layers sitting at the same z.
function actSlope(v: Record<string, number>): Flow {
  const { z, n } = v;
  const outs = ACTS.map((a) => a.f(z)), slopes = ACTS.map((a) => a.d(z)), deep = slopes.map((s) => s ** n);
  const tone = (s: number) => (Math.abs(s) < 0.05 ? "bad" as const : Math.abs(s) > 1.05 ? "warn" as const : Math.abs(s) >= 0.95 ? "ok" as const : undefined);
  const tones = (vals: number[], col: number) => Object.fromEntries(vals.flatMap((s, i) => { const t = tone(s); return t ? [[`${i}:${col}`, t]] : []; })) as GridTable["tones"];
  const dead = ACTS.filter((_, i) => Math.abs(slopes[i]) < 0.05).map((a) => a.name);
  const lost = ACTS.filter((_, i) => Math.abs(deep[i]) < 1e-3).map((a) => a.name);
  const grew = ACTS.filter((_, i) => Math.abs(deep[i]) > 10).map((a) => a.name);
  return { kind: "grid", title: `Activations at z = ${z}`, steps: [
    { note: `The same input z = ${z} through six activations. ReLU and its cousins pass large positive z almost unchanged; sigmoid and tanh squash everything into a fixed range.`,
      tables: [{ head: ["activation", "output"], rows: ACTS.map((a, i) => [a.name, fmt(outs[i])]) }] },
    { note: dead.length ? `Slopes at z = ${z}. ${dead.join(", ")} ${dead.length > 1 ? "have" : "has"} a slope under 0.05 here, so almost no gradient flows back through ${dead.length > 1 ? "them" : "it"}.` : `Slopes at z = ${z}. Every activation still passes a useful gradient here.`,
      tone: dead.length ? "warn" : "ok",
      tables: [{ head: ["activation", "output", "slope"], rows: ACTS.map((a, i) => [a.name, fmt(outs[i]), fmt(slopes[i])]), tones: tones(slopes, 2) }] },
    { note: `If ${n} layers all sat at this z, the backward pass multiplies ${n} slopes together.${lost.length ? ` ${lost.join(", ")}: under 0.001, the gradient has vanished.` : ""}${grew.length ? ` ${grew.join(", ")}: over 10, it grows.` : ""} A slope of exactly 1 keeps it intact.`,
      tone: lost.length ? "bad" : "ok",
      tables: [{ head: ["activation", "slope", `slope^${n}`], rows: ACTS.map((a, i) => [a.name, fmt(slopes[i]), fmt(deep[i])]), tones: tones(deep, 2) }] },
  ] };
}

// MLP and the forward pass: where the parameters of an MLP live.
const n0 = (x: number) => x.toLocaleString("en-US");
function mlpParams(v: Record<string, number>): Flow {
  const { din, width, layers, dout } = v;
  const sizes = [din, ...Array.from({ length: layers }, () => width), dout];
  const L = sizes.slice(1).map((b, i) => ({ label: `${sizes[i]}→${b}`, w: sizes[i] * b, b }));
  const W = L.reduce((s, l) => s + l.w, 0), B = L.reduce((s, l) => s + l.b, 0), big = L.reduce((m, l) => (l.w > m.w ? l : m));
  return { kind: "bars", title: `MLP ${sizes.join("-")}`, format: n0, steps: [
    { note: `Each Linear layer from a to b inputs holds a × b weights. The biggest is ${big.label}: ${n0(big.w)} weights, ${Math.round((100 * big.w) / W)}% of all ${n0(W)}.`,
      bars: L.map((l) => ({ label: l.label, value: l.w, tone: l === big ? "hot" as const : undefined })) },
    { note: `Add one bias per output unit: ${n0(B)} biases in all, ${((100 * B) / (W + B)).toFixed(1)}% of the total. The network has ${n0(W + B)} parameters, ${((4 * (W + B)) / 1e6).toFixed(2)} MB at 4 bytes each.`, tone: "ok",
      bars: L.map((l) => ({ label: l.label, value: l.w + l.b, tone: l === big ? "hot" as const : undefined })) },
  ] };
}

// Backprop on a graph: checking the chain-rule gradient with finite differences of step h = 10^-k.
function gradCheck(v: Record<string, number>): Flow {
  const { k, w } = v, h = 10 ** -k, p = sigmoid(w * BP.x + BP.b);
  const g = 2 * (p - BP.y) * p * (1 - p) * BP.x;
  const fwd = (bpLoss(w + h) - bpLoss(w)) / h, cen = (bpLoss(w + h) - bpLoss(w - h)) / (2 * h);
  const rel = (n: number) => Math.abs(n - g) / Math.abs(g);
  const sig = (n: number) => n.toPrecision(7), err = (n: number) => rel(n).toExponential(1);
  const tone = (n: number) => (rel(n) < 1e-6 ? "ok" as const : rel(n) > 1e-3 ? "bad" as const : "warn" as const);
  const why = k <= 3 ? "h is large, so the curve bends inside the step (truncation error). The central difference cancels the first bend and does far better."
    : k >= 10 ? "h is tiny, so L(w + h) and L(w) agree in almost every digit and the subtraction keeps only rounding noise." : "This middle range is where gradient checks are done.";
  const head = ["method", "gradient", "rel. error"];
  return { kind: "grid", title: `Gradient check at w = ${w}, h = 1e-${k}`, steps: [
    { note: `The chain rule gives dL/dw = 2(p - y) × p(1 - p) × x = ${sig(g)} exactly, in one backward pass.`, tables: [{ head, rows: [["chain rule", sig(g), "0"]], tones: { "0": "ok" } }] },
    { note: `Forward difference: (L(w + h) - L(w)) / h. Relative error ${err(fwd)}. ${why}`, tone: tone(fwd) === "ok" ? "ok" : "warn",
      tables: [{ head, rows: [["chain rule", sig(g), "0"], ["forward", sig(fwd), err(fwd)]], tones: { "1:2": tone(fwd) } }] },
    { note: `Central difference: (L(w + h) - L(w - h)) / 2h. Relative error ${err(cen)}. Below 1e-6 the hand-written gradient is trusted.`, tone: tone(cen) === "ok" ? "ok" : "warn",
      tables: [{ head, rows: [["chain rule", sig(g), "0"], ["forward", sig(fwd), err(fwd)], ["central", sig(cen), err(cen)]], tones: { "1:2": tone(fwd), "2:2": tone(cen) } }] },
  ] };
}

export const PLAY_2: Record<string, PlayFlow> = {
  "s2-act-slope": {
    title: "Where activations pass the gradient",
    knobs: [
      { key: "z", label: "Input z", min: -6, max: 6, step: 0.5, value: -2 },
      { key: "n", label: "Layers", min: 1, max: 30, step: 1, value: 10 },
    ],
    make: actSlope,
  },
  "s2-mlp-params": {
    title: "Where an MLP's parameters live",
    knobs: [
      { key: "din", label: "Inputs", min: 8, max: 1024, step: 8, value: 784 },
      { key: "width", label: "Hidden width", min: 8, max: 1024, step: 8, value: 256 },
      { key: "layers", label: "Hidden layers", min: 1, max: 5, step: 1, value: 2 },
      { key: "dout", label: "Outputs", min: 2, max: 100, step: 1, value: 10 },
    ],
    make: mlpParams,
  },
  "s2-gradcheck": {
    title: "Checking a gradient by nudging",
    knobs: [
      { key: "k", label: "Step h = 10 to the minus", min: 1, max: 14, step: 1, value: 5 },
      { key: "w", label: "Weight w", min: -3, max: 3, step: 0.25, value: 0.5 },
    ],
    make: gradCheck,
  },
};
