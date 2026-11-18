// Stage 2 (Neural networks): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow, FlowTone, GridTable } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { ACTS, BP, bpLoss, fmt, gauss, sigmoid } from "./s2.flows.ts";
import { seededRng } from "../rng.ts";
import type { SceneTone, Shape } from "../../other/flows.ts";
import { conv2d, IMG, KERNELS, maxPool, NET, netBackward, netForward, type Img } from "./s2.calc.ts";

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
    { note: `A Linear layer from a inputs to b outputs holds a × b weights. The biggest is ${big.label}: ${n0(big.w)} weights, ${Math.round((100 * big.w) / W)}% of all ${n0(W)}.`,
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
  const why = k <= 3 ? "h is large, so the curve bends inside the step (truncation error). The central difference cancels the curvature term, so its error shrinks like h² instead of h."
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

// Optimisers: SGD, momentum and Adam on a ravine, L = (w1² + c w2²) / 2, one gentle direction and one steep.
function ravine(v: Record<string, number>): Flow {
  const { lr, c } = v, start = [3, 1], show = [0, 1, 2, 5, 10, 20, 50];
  const loss = (w: number[]) => 0.5 * (w[0] ** 2 + c * w[1] ** 2), grad = (w: number[]) => [w[0], c * w[1]], L0 = loss(start);
  const run = (kind: "sgd" | "mom" | "adam") => {
    let w = [...start], vel = [0, 0], m = [0, 0], s2 = [0, 0];
    const rows: number[][] = [];
    for (let t = 0; t <= show[show.length - 1]; t++) {
      if (show.includes(t)) rows.push([t, w[0], w[1], loss(w)]);
      const g = grad(w);
      if (kind === "sgd") w = w.map((x, i) => x - lr * g[i]);
      else if (kind === "mom") { vel = vel.map((x, i) => 0.9 * x + g[i]); w = w.map((x, i) => x - lr * vel[i]); }
      else {
        m = m.map((x, i) => 0.9 * x + 0.1 * g[i]); s2 = s2.map((x, i) => 0.999 * x + 0.001 * g[i] ** 2);
        w = w.map((x, i) => x - (lr * m[i] / (1 - 0.9 ** (t + 1))) / (Math.sqrt(s2[i] / (1 - 0.999 ** (t + 1))) + 1e-8));
      }
    }
    return rows;
  };
  const table = (rows: number[][]): GridTable => ({ head: ["step", "w1", "w2", "loss"], rows: rows.map((r) => [r[0], fmt(r[1]), fmt(r[2]), fmt(r[3])]),
    tones: Object.fromEntries(rows.flatMap((r, i): [string, FlowTone][] => (r[3] > L0 * 1.0001 ? [[String(i), "bad"]] : r[3] < 0.01 * L0 ? [[`${i}:3`, "ok"]] : []))) });
  const [S, M, A] = [run("sgd"), run("mom"), run("adam")], end = (r: number[][]) => r[r.length - 1][3];
  const ok = (r: number[][]) => (end(r) > L0 ? "bad" as const : end(r) < 0.01 * L0 ? "ok" as const : "warn" as const);
  const best = ([["SGD", end(S)], ["momentum", end(M)], ["Adam", end(A)]] as [string, number][]).sort((a, b) => a[1] - b[1])[0][0];
  return { kind: "grid", title: `Ravine: steepness ${c}, lr ${lr}`, steps: [
    { note: `SGD: w = w - lr × gradient. The steep weight w2 stays stable only while lr × ${c} < 2; here it is ${fmt(lr * c)}. ${lr * c >= 2 ? "Too big: w2 overshoots further every step." : `The gentle weight w1 shrinks by a factor of only ${fmt(1 - lr)} each step.`}`, tone: ok(S), tables: [table(S)] },
    { note: `Momentum (β = 0.9) keeps adding past gradients, so steady w1 picks up speed, while w2's back and forth partly cancels.${end(M) > L0 ? " With this lr it swings out of control." : ""} Loss after 50 steps: ${fmt(end(M))}.`, tone: ok(M), tables: [table(M)] },
    { note: `Adam divides by each weight's own gradient size, so w1 and w2 each move about lr per step, steep or not. Loss after 50 steps: ${fmt(end(A))}. Lowest here: ${best}.`, tone: ok(A), tables: [table(A)] },
  ] };
}

// Making deep nets train: inverted dropout on n real activations, and what happens to their average.
function dropout(v: Record<string, number>): Flow {
  const { p, n } = v, ra = seededRng("s2-drop-act"), rm = seededRng("s2-drop-mask");
  const a = Array.from({ length: n }, () => Math.abs(gauss(ra))), keep = a.map(() => rm() >= p);
  const kept = keep.filter(Boolean).length, mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / n;
  const ev = mean(a), raw = mean(a.map((x, i) => (keep[i] ? x : 0))), inv = raw / (1 - p);
  const head = ["", "mean output"];
  return { kind: "grid", title: `Dropout p = ${p} on ${n} units`, steps: [
    { note: `Training step: each unit is zeroed with probability ${p}. This time ${kept} of ${n} survive (${fmt((100 * kept) / n)}%). A new random set is dropped every step.`, tone: "hot",
      tables: [{ head: ["units", "count"], rows: [["kept", kept], ["dropped", n - kept]], tones: { "1": "warn" } }] },
    { note: `With units missing, the layer's average output falls from ${fmt(ev)} to ${fmt(raw)}, about ${fmt(1 - p)} of it. At test time nothing is dropped, so the next layer would see larger inputs than it trained on.`, tone: "bad",
      tables: [{ head, rows: [["test, all units", fmt(ev)], ["train, dropped", fmt(raw)]], tones: { "1:1": "bad" } }] },
    { note: `Inverted dropout divides the kept units by 1 - p = ${fmt(1 - p)} during training: ${fmt(raw)} becomes ${fmt(inv)}, close to ${fmt(ev)}. Test time then needs no change at all.`, tone: "ok",
      tables: [{ head, rows: [["test, all units", fmt(ev)], ["train, dropped", fmt(raw)], [`train, ÷ ${fmt(1 - p)}`, fmt(inv)]], tones: { "2:1": "ok" } }] },
  ] };
}

// ---- The XOR network, drawn: values flow forward, gradients flow back ----
const NX = [70, 240, 410], NY = [[110, 290], [110, 290], [200]];
const sgnTone = (v: number): SceneTone => (v > 0 ? "ok" : v < 0 ? "bad" : "muted");
function netShapes(nodes: [string, string, SceneTone?][], edgeLab: (kind: "w1" | "w2", i: number, j: number) => string, w2: number[]): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const w = NET.W1[i][j];
    out.push({ t: "line", id: `e1-${i}${j}`, x1: NX[0] + 46, y1: NY[0][i], x2: NX[1] - 46, y2: NY[1][j], tone: sgnTone(w), w: 1 + 2 * Math.abs(w) });
    // label 30% along the edge, nearer its input, so the two crossing edges' labels do not meet
    const ax = NX[0] + 46, bx = NX[1] - 46, mx = ax + 0.3 * (bx - ax), my = NY[0][i] + 0.3 * (NY[1][j] - NY[0][i]) - 14;
    out.push({ t: "text", id: `l1-${i}${j}`, x: mx, y: my, text: edgeLab("w1", i, j), size: 17, anchor: "middle", tone: "muted" });
  }
  for (let j = 0; j < 2; j++) {
    out.push({ t: "line", id: `e2-${j}`, x1: NX[1] + 46, y1: NY[1][j], x2: NX[2] - 46, y2: NY[2][0], tone: sgnTone(w2[j]), w: 1 + 2 * Math.abs(w2[j]) });
    out.push({ t: "text", id: `l2-${j}`, x: (NX[1] + NX[2]) / 2, y: (NY[1][j] + NY[2][0]) / 2 - 14, text: edgeLab("w2", 0, j), size: 17, anchor: "middle", tone: "muted" });
  }
  const at = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]];
  nodes.forEach(([id, text, tone], k) => out.push({ t: "node", id, x: NX[at[k][0]], y: NY[at[k][0]][at[k][1]], w: 92, text, tone }));
  out.push({ t: "text", id: "h-in", x: NX[0], y: 30, text: "inputs", size: 15, anchor: "middle", tone: "muted" },
    { t: "text", id: "h-hid", x: NX[1], y: 30, text: "hidden (ReLU)", size: 15, anchor: "middle", tone: "muted" },
    { t: "text", id: "h-out", x: NX[2], y: 30, text: "output", size: 15, anchor: "middle", tone: "muted" });
  return out;
}

function netFlow(v: Record<string, number>): Flow {
  const x = [v.x1, v.x2], { z, h, y } = netForward(x), w2 = NET.W2;
  const wl = (k: "w1" | "w2", i: number, j: number) => fmt(k === "w1" ? NET.W1[i][j] : w2[j]);
  const pf = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
  const ins: [string, string, SceneTone?][] = [["x0", `x1\n${fmt(x[0])}`, "hot"], ["x1", `x2\n${fmt(x[1])}`, "hot"]];
  const binary = x.every((xi) => xi === 0 || xi === 1), t = binary ? (x[0] !== x[1] ? 1 : 0) : null;
  const zs = z.map((zj, j) => `${fmt(x[0])}×${pf(NET.W1[0][j])} + ${fmt(x[1])}×${pf(NET.W1[1][j])} ${NET.b1[j] < 0 ? "-" : "+"} ${Math.abs(NET.b1[j])} = ${fmt(zj)}`);
  return { kind: "scene", title: `The XOR network on x = (${fmt(x[0])}, ${fmt(x[1])})`, height: 380, steps: [
    { note: `Two inputs enter on the left. Green lines carry positive weights, red ones negative; thicker means bigger. Try: set both inputs to 1 and watch the second hidden unit switch on.`,
      shapes: netShapes([...ins, ["h0", "h1\n?"], ["h1", "h2\n?"], ["y", "y\n?"]], wl, w2) },
    { note: `Each hidden unit adds its weighted inputs and its bias. h1: ${zs[0]}. h2: ${zs[1]}.`,
      shapes: netShapes([...ins, ["h0", `z1\n${fmt(z[0])}`, "warn"], ["h1", `z2\n${fmt(z[1])}`, "warn"], ["y", "y\n?"]], wl, w2) },
    { note: `ReLU keeps a positive sum and turns a negative one into 0. ${h.map((hj, j) => (z[j] > 0 ? `h${j + 1} fires with ${fmt(hj)}` : `h${j + 1} is off`)).join("; ")}.`,
      tone: h.every((hj) => hj === 0) ? "warn" : undefined,
      shapes: netShapes([...ins, ["h0", `h1\n${fmt(h[0])}`, h[0] > 0 ? "ok" : "muted"], ["h1", `h2\n${fmt(h[1])}`, h[1] > 0 ? "ok" : "muted"], ["y", "y\n?"]], wl, w2) },
    { note: `The output adds the hidden values times their weights: y = ${fmt(h[0])}×${pf(w2[0])} + ${fmt(h[1])}×${pf(w2[1])} = ${fmt(y)}.${t === null ? " Between 0 and 1 the network gives a smooth blend; XOR itself is only defined at the corners." : ` XOR(${x[0]}, ${x[1]}) = ${t}, ${y === t ? "a match" : "a miss"}.`}`,
      tone: t === null ? undefined : y === t ? "ok" : "bad",
      shapes: netShapes([...ins, ["h0", `h1\n${fmt(h[0])}`, h[0] > 0 ? "ok" : "muted"], ["h1", `h2\n${fmt(h[1])}`, h[1] > 0 ? "ok" : "muted"], ["y", `y\n${fmt(y)}`, "hot"]], wl, w2) },
  ] };
}

function backFlow(v: Record<string, number>): Flow {
  const x = [v.x1, v.x2], w2 = [NET.W2[0], v.w], t = x[0] !== x[1] ? 1 : 0;
  const g = netBackward(x, t, w2);
  const ins: [string, string, SceneTone?][] = [["x0", `x1\n${fmt(x[0])}`], ["x1", `x2\n${fmt(x[1])}`]];
  const hid = (lab: (j: number) => string, tone: (j: number) => SceneTone | undefined): [string, string, SceneTone?][] => [0, 1].map((j) => [`h${j}`, lab(j), tone(j)]);
  const wl = (k: "w1" | "w2", i: number, j: number) => fmt(k === "w1" ? NET.W1[i][j] : w2[j]);
  const gl2 = (k: "w1" | "w2", i: number, j: number) => (k === "w2" ? `∂ ${fmt(g.dW2[j])}` : fmt(NET.W1[i][j]));
  const gl1 = (k: "w1" | "w2", i: number, j: number) => `∂ ${fmt(k === "w1" ? g.dW1[i][j] : g.dW2[j])}`;
  const dead = [0, 1].filter((j) => g.z[j] <= 0).map((j) => `h${j + 1}`);
  if (g.loss === 0) return { kind: "scene", title: "Nothing to learn", height: 380, steps: [
    { note: `With this weight the network already gives ${fmt(g.y)} for XOR(${x[0]}, ${x[1]}) = ${t}. The loss is 0, so every gradient is 0. Try: move the weight away from -2.`, tone: "ok",
      shapes: netShapes([...ins, ...hid((j) => `h${j + 1}\n${fmt(g.h[j])}`, () => undefined), ["y", `y\n${fmt(g.y)}`, "ok"]], wl, w2) },
    { note: "∂L/∂y = 2(y - t) = 0, and every gradient further back is that 0 times something. A training step leaves all the weights where they are.",
      shapes: netShapes([...ins, ...hid((j) => `∂z${j + 1}\n0`, () => "muted"), ["y", "∂y\n0", "ok"]], () => "∂ 0", w2) }] };
  return { kind: "scene", title: `Backprop for x = (${x[0]}, ${x[1]}), target ${t}`, height: 380, steps: [
    { note: `Forward first: the output is ${fmt(g.y)} but XOR(${x[0]}, ${x[1]}) is ${t}. Squared loss (y - t)² = ${fmt(g.loss)}. Try: change the h2 weight and see which gradients grow.`, tone: "bad",
      shapes: netShapes([...ins, ...hid((j) => `h${j + 1}\n${fmt(g.h[j])}`, (j) => (g.h[j] > 0 ? "ok" : "muted")), ["y", `y ${fmt(g.y)}\nt ${t}`, "bad"]], wl, w2) },
    { note: `The error signal starts at the output: ∂L/∂y = 2(y - t) = ${fmt(g.dy)}. ${g.dy > 0 ? "Positive: y should go down." : "Negative: y should go up."}`, tone: "hot",
      shapes: netShapes([...ins, ...hid((j) => `h${j + 1}\n${fmt(g.h[j])}`, () => undefined), ["y", `∂y\n${fmt(g.dy)}`, "hot"]], wl, w2) },
    { note: `Each output weight's gradient is the error times the value that flowed through it: ∂L/∂w = ${fmt(g.dy)} × h. ${g.h.some((hj) => hj === 0) ? "A hidden unit that sent 0 gets a zero gradient on its weight." : "Both hidden units sent a value, so both weights move."}`,
      shapes: netShapes([...ins, ...hid((j) => `h${j + 1}\n${fmt(g.h[j])}`, () => undefined), ["y", `∂y\n${fmt(g.dy)}`, "hot"]], gl2, w2) },
    { note: `The error flows back into each hidden unit through its weight, then through ReLU. ${dead.length ? `${dead.join(" and ")} had a sum of 0 or less, so ReLU's slope is 0 and no gradient gets past.` : "Both units fired, so ReLU passes the gradient unchanged."}`,
      tone: dead.length ? "warn" : undefined,
      shapes: netShapes([...ins, ...hid((j) => `∂z${j + 1}\n${fmt(g.dz[j])}`, (j) => (g.z[j] <= 0 ? "muted" : "hot")), ["y", `∂y\n${fmt(g.dy)}`, "hot"]], gl2, w2) },
    { note: `Last, every first-layer weight gets ∂z × its input.${x.includes(0) ? " An input of 0 gives a zero gradient, so its weights do not move on this example." : " Both inputs are 1, so each weight's gradient equals the ∂z of the unit it feeds."} A step of gradient descent subtracts each ∂ times the learning rate.`, tone: "ok",
      shapes: netShapes([...ins.map(([id, txt]): [string, string, SceneTone?] => [id, txt, "hot"]), ...hid((j) => `∂z${j + 1}\n${fmt(g.dz[j])}`, (j) => (g.z[j] <= 0 ? "muted" : "hot")), ["y", `∂y\n${fmt(g.dy)}`, "hot"]], gl1, w2) },
  ] };
}

// ---- Convolution: a 3×3 kernel slides over the picture ----
const CELL = 34, IX = 12, KX = 350, GY = 44;
const cellNum = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
function gridShapes(id: string, a: Img, x0: number, y0: number, tone: (v: number) => SceneTone, strength: (v: number) => number, show: (r: number, c: number) => boolean = () => true): Shape[] {
  return a.flatMap((row, r) => row.flatMap((v, c): Shape[] => !show(r, c) ? [] : [
    { t: "rect", id: `${id}${r}-${c}`, x: x0 + c * CELL, y: y0 + r * CELL, w: CELL - 2, h: CELL - 2, tone: tone(v), fill: strength(v), edge: false },
    { t: "text", id: `${id}t${r}-${c}`, x: x0 + c * CELL + CELL / 2 - 1, y: y0 + r * CELL + CELL / 2 - 1, text: cellNum(v), size: 15, anchor: "middle" },
  ]));
}
function convFlow(v: Record<string, number>): Flow {
  const K = KERNELS[v.k], s = v.s, p = v.p, { padded, out } = conv2d(IMG, K.k, s, p), m = out.length;
  const max = Math.max(...out.flat().map(Math.abs)) || 1;
  const outTone = (x: number): SceneTone => (x > 0 ? "ok" : x < 0 ? "bad" : "muted");
  const outFill = (x: number) => (x === 0 ? 4 : 12 + Math.round((Math.abs(x) / max) * 50));
  const img = gridShapes("i", padded, IX, GY, (x) => (x ? "hot" : "muted"), (x) => (x ? 45 : 6));
  const win = (r: number, c: number): Shape => ({ t: "rect", id: "win", x: IX + c * s * CELL - 2, y: GY + r * s * CELL - 2, w: 3 * CELL + 2, h: 3 * CELL + 2, tone: "warn", fill: 0, edge: true });
  const OY = GY + padded.length * CELL + 44, OX = IX;
  const kern = gridShapes("k", K.k, KX, GY, (x) => (x > 0 ? "ok" : x < 0 ? "bad" : "muted"), (x) => (x ? 30 : 6));
  const lab = [
    { t: "text", id: "li", x: IX, y: 22, text: `picture ${padded.length}×${padded.length}${p ? " (padded)" : ""}`, size: 17, tone: "muted" },
    { t: "text", id: "lk", x: KX, y: 22, text: "kernel", size: 17, tone: "muted" },
    { t: "text", id: "lo", x: OX, y: OY - 20, text: `feature map ${m}×${m}`, size: 17, tone: "muted" },
    ...kern,
  ] as Shape[];
  const order: [number, number][] = [[0, 0], [0, 1], [1, 1]].filter(([r, c]) => r < m && c < m) as [number, number][];
  const terms = (r: number, c: number) => {
    const t: string[] = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const a = padded[r * s + i][c * s + j], w = K.k[i][j]; if (a && w) t.push(cellNum(a * w)); }
    return t.length ? `${t.map((x, i) => (i ? (x.startsWith("-") ? `- ${x.slice(1)}` : `+ ${x}`) : x)).join(" ")} = ${cellNum(out[r][c])}` : "no lit pixel meets a non-zero weight, so 0";
  };
  const seen = (k: number) => (r: number, c: number) => order.slice(0, k + 1).some(([a, b]) => a === r && b === c);
  const relu = out.map((row) => row.map((x) => Math.max(0, x))), pooled = maxPool(relu);
  const best = out.flat().indexOf(Math.max(...out.flat())), br = Math.floor(best / m), bc = best % m;
  const steps = order.map(([r, c], k) => ({
    note: k === 0
      ? `The ${K.name} kernel sits on the top-left 3×3 patch. Multiply each pixel by the weight under it and add: ${terms(r, c)}. Try: switch the kernel, or set stride 2.`
      : `Slide ${s} pixel${s > 1 ? "s" : ""} and repeat with the same 9 weights: ${terms(r, c)}.`,
    shapes: [...lab, ...img, win(r, c), ...gridShapes("o", out, OX, OY, outTone, outFill, seen(k))],
  }));
  steps.push({
    note: `Every position done: (${IMG.length} + 2×${p} - 3) / ${s} + 1 = ${m} per side. The brightest response is ${cellNum(out[br][bc])} at row ${br + 1}, column ${bc + 1}: the pattern the kernel looks for is strongest there.`,
    shapes: [...lab, ...img, ...gridShapes("o", out, OX, OY, outTone, outFill)],
  });
  if (pooled.length) steps.push({
    note: `ReLU zeroes the negatives, then 2×2 max pooling keeps the largest value in each block: ${m}×${m} becomes ${pooled.length}×${pooled.length}. The map gets smaller but keeps where the strong responses were.`,
    shapes: [...lab.filter((x) => x.id !== "lo"), { t: "text", id: "lo", x: OX, y: OY - 20, text: `after ReLU and pooling ${pooled.length}×${pooled.length}`, size: 17, tone: "muted" }, ...img,
      ...gridShapes("o", pooled, OX, OY, outTone, outFill)],
  } as (typeof steps)[number]);
  return { kind: "scene", title: `${K.name} kernel, stride ${s}, padding ${p}`, height: OY + m * CELL + 12, steps };
}

export const PLAY_2: Record<string, PlayFlow> = {
  "s2-net-forward": {
    title: "Push numbers through a network",
    knobs: [
      { key: "x1", label: "Input x1", min: 0, max: 1, step: 0.5, value: 1 },
      { key: "x2", label: "Input x2", min: 0, max: 1, step: 0.5, value: 0 },
    ],
    make: netFlow,
  },
  "s2-net-backward": {
    title: "Send the error back",
    knobs: [
      { key: "x1", label: "Input x1", min: 0, max: 1, step: 1, value: 1 },
      { key: "x2", label: "Input x2", min: 0, max: 1, step: 1, value: 1 },
      { key: "w", label: "Weight from h2 to y", min: -3, max: 1, step: 0.5, value: -1 },
    ],
    make: backFlow,
  },
  "s2-conv": {
    title: "Slide a kernel over a picture",
    knobs: [
      { key: "k", label: "Kernel (0 vertical, 1 horizontal, 2 blur)", min: 0, max: 2, step: 1, value: 0 },
      { key: "s", label: "Stride", min: 1, max: 2, step: 1, value: 1 },
      { key: "p", label: "Padding", min: 0, max: 1, step: 1, value: 0 },
    ],
    make: convFlow,
  },
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
  "s2-ravine": {
    title: "SGD, momentum and Adam in a ravine",
    knobs: [
      { key: "lr", label: "Learning rate", min: 0.01, max: 1, step: 0.01, value: 0.06 },
      { key: "c", label: "Steepness of w2", min: 1, max: 50, step: 1, value: 30 },
    ],
    make: ravine,
  },
  "s2-dropout": {
    title: "Why dropout rescales",
    knobs: [
      { key: "p", label: "Drop probability p", min: 0.05, max: 0.9, step: 0.05, value: 0.5 },
      { key: "n", label: "Units", min: 100, max: 2000, step: 100, value: 500 },
    ],
    make: dropout,
  },
};
