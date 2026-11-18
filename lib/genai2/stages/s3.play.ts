// Stage 3 (Sequences) slider walk-throughs, spread by stages/play.ts into PLAY_FLOWS. Every number is computed here.
import type { Flow, Shape } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { seededRng } from "../rng.ts";

const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${(v / 1e3).toFixed(0)}k` : v.toLocaleString("en-US"));

const r2 = (x: number) => String(Number(x.toFixed(2)));

// rnn-bptt: the RNN unrolled over five steps. A pulse enters at step 1; the bars show how much it still moves each state.
function rnnUnroll(v: Record<string, number>): Flow {
  const { u, x1 } = v, xs = [x1, 0, 0, 0, 0], T = xs.length, W = 1;
  const hs: number[] = [];
  xs.forEach((x, t) => hs.push(Math.tanh(W * x + u * (t ? hs[t - 1] : 0))));
  // d h_t / d x_1: the first slope, then u × (1 - h²) for every later step
  const infl = hs.map((_, t) => (1 - hs[0] ** 2) * W * hs.slice(1, t + 1).reduce((p, h) => p * u * (1 - h * h), 1));
  const X = (t: number) => 48 + 96 * t, HY = 100, XY = 220, BY = 400, BH = 90;
  const shapes = (upto: number, back: boolean): Shape[] => {
    const out: Shape[] = [{ t: "text", id: "lh", x: 8, y: 50, text: "state h", size: 16, tone: "muted" }, { t: "text", id: "lb", x: 8, y: BY - BH - 18, text: "how much x1 still moves h", size: 16, tone: "muted" }];
    xs.forEach((x, t) => {
      const on = t <= upto;
      out.push({ t: "node", id: `x${t}`, x: X(t), y: XY, w: 80, text: `x${t + 1}\n${r2(x)}`, tone: t === 0 ? "hot" : undefined });
      out.push({ t: "line", id: `ux${t}`, x1: X(t), y1: XY - 28, x2: X(t), y2: HY + 28, tone: on && x ? "hot" : "muted", w: on && x ? 4 : 2 });
      if (t) out.push({ t: "line", id: `uh${t}`, x1: X(t - 1) + 40, y1: HY, x2: X(t) - 40, y2: HY, tone: back && t <= upto ? "bad" : on ? "ok" : "muted", w: on ? 2 + 4 * Math.min(1, Math.abs(u)) : 2, dash: !on });
      out.push({ t: "node", id: `h${t}`, x: X(t), y: HY, w: 80, text: on ? `h${t + 1}\n${r2(hs[t])}` : `h${t + 1}\n?`, tone: on ? "ok" : undefined });
      if (on) {
        const bh = Math.max(2, BH * Math.min(1, Math.abs(infl[t]) / Math.max(...infl.map(Math.abs))));
        out.push({ t: "rect", id: `b${t}`, x: X(t) - 22, y: BY - bh, w: 44, h: bh, tone: Math.abs(infl[t]) < 0.05 ? "bad" : "ok", fill: 55 },
          { t: "text", id: `bt${t}`, x: X(t), y: BY + 16, text: r2(infl[t]), size: 15, anchor: "middle" });
      }
    });
    return out;
  };
  const fade = infl[T - 1] / infl[0], grows = Math.abs(fade) > 1;
  return { kind: "scene", title: `An RNN unrolled, u = ${u}`, height: BY + 30, steps: [
    ...xs.map((x, t) => ({
      note: t === 0
        ? `Step 1: the pulse x1 = ${x1} enters: h1 = tanh(${x1} + ${u} × 0) = ${r2(hs[0])}. The same cell, with the same weights, will run at every step. Try: raise u above 1.`
        : `Step ${t + 1}: no new input, so h${t + 1} = tanh(${u} × h${t}) = ${r2(hs[t])}. The arrow from the left is the only way x1 reaches here.`,
      shapes: shapes(t, false),
    })),
    { note: `Backward, the gradient from h${T} to x1 multiplies one slope per arrow. It ends at ${r2(infl[T - 1])}, ${grows ? `${r2(Math.abs(fade))} times the first step's: with u above 1 it grows instead, the exploding case` : `${(Math.abs(fade) * 100).toFixed(0)}% of the first step's: the far past barely trains, the vanishing gradient${u > 1 ? `. A big u does not save it: it pushes h towards 1, where tanh is flat, so each slope u × (1 - h²) is still below 1` : ""}`}.`,
      tone: grows ? "warn" : "bad", shapes: shapes(T - 1, true) },
  ] };
}

// lstm-gru: the LSTM cell drawn as a diagram. The forget gate scales the old memory, the input gate writes, the output gate shows.
const LW = { f: [0.5, 0.5, 1], i: [1, -0.5, 0], o: [0.8, 0.4, 0], g: [1.2, -0.4, 0] } as const, HP = 0.5;
function lstmCell(v: Record<string, number>): Flow {
  const { x, cp } = v, sig = (a: number) => 1 / (1 + Math.exp(-a));
  const pre = (k: keyof typeof LW) => LW[k][0] * x + LW[k][1] * HP + LW[k][2];
  const f = sig(pre("f")), i = sig(pre("i")), o = sig(pre("o")), g = Math.tanh(pre("g")), c = f * cp + i * g, h = o * Math.tanh(c);
  type Stage = 0 | 1 | 2 | 3 | 4;
  const shapes = (s: Stage): Shape[] => {
    const known = (k: number, txt: string) => (s >= k ? txt : "?");
    const gate = (id: string, x0: number, name: string, val: number, k: Stage): Shape => ({ t: "node", id, x: x0, y: 250, w: 70, text: `${name}\n${known(k, r2(val))}`, tone: s === k ? "hot" : s > k ? "ok" : undefined });
    const thick = (val: number, k: Stage) => (s >= k ? 1.5 + 5 * Math.abs(val) : 2);
    return [
      { t: "text", id: "lc", x: 8, y: 26, text: "cell state c, the long-term memory", size: 15, tone: "muted" },
      { t: "line", id: "cline1", x1: 96, y1: 70, x2: 168, y2: 70, tone: "warn", w: 2 + 3 * Math.min(1, Math.abs(cp)) },
      { t: "line", id: "cline2", x1: 196, y1: 70, x2: 286, y2: 70, tone: s >= 2 ? "warn" : "muted", w: s >= 2 ? 2 + 3 * Math.min(1, Math.abs(f * cp)) : 2 },
      { t: "line", id: "cline3", x1: 314, y1: 70, x2: 376, y2: 70, tone: s >= 3 ? "warn" : "muted", w: s >= 3 ? 2 + 3 * Math.min(1, Math.abs(c)) : 2 },
      { t: "node", id: "cp", x: 52, y: 70, w: 84, text: `c old\n${r2(cp)}`, tone: "warn" },
      { t: "node", id: "mulf", x: 182, y: 70, w: 30, text: "×", tone: s >= 2 ? "ok" : undefined },
      { t: "node", id: "add", x: 300, y: 70, w: 30, text: "+", tone: s >= 3 ? "ok" : undefined },
      { t: "node", id: "c", x: 424, y: 70, w: 92, text: `c new\n${known(3, r2(c))}`, tone: s >= 3 ? "warn" : undefined },
      { t: "line", id: "ef", x1: 110, y1: 228, x2: 182, y2: 86, tone: s >= 1 ? "ok" : "muted", w: thick(f, 1) },
      { t: "node", id: "mulig", x: 255, y: 160, w: 30, text: "×", tone: s >= 3 ? "ok" : undefined },
      { t: "line", id: "ei", x1: 200, y1: 228, x2: 255, y2: 176, tone: s >= 1 ? "ok" : "muted", w: thick(i, 1) },
      { t: "line", id: "eg", x1: 290, y1: 228, x2: 260, y2: 176, tone: s >= 1 ? (g < 0 ? "bad" : "ok") : "muted", w: thick(g, 1) },
      { t: "line", id: "eig", x1: 258, y1: 144, x2: 296, y2: 86, tone: s >= 3 ? "ok" : "muted", w: s >= 3 ? 1.5 + 5 * Math.abs(i * g) : 2 },
      { t: "line", id: "eo", x1: 380, y1: 228, x2: 424, y2: 340, tone: s >= 4 ? "ok" : "muted", w: thick(o, 4) },
      { t: "line", id: "ec", x1: 424, y1: 94, x2: 424, y2: 330, tone: s >= 4 ? "warn" : "muted", w: 2, dash: s < 4 },
      ...[110, 200, 290, 380].map((gx, k): Shape => ({ t: "line", id: `ein${k}`, x1: 150, y1: 328, x2: gx, y2: 272, tone: s === 1 ? "hot" : "muted", w: 2 })),
      gate("f", 110, "forget f", f, 1), gate("i", 200, "write i", i, 1), gate("g", 290, "new g", g, 1), gate("o", 380, "show o", o, 1),
      { t: "node", id: "in", x: 150, y: 350, w: 150, text: `h old ${HP}\nx ${r2(x)}`, tone: "hot" },
      { t: "node", id: "h", x: 424, y: 356, w: 92, text: `h new\n${known(4, r2(h))}`, tone: s >= 4 ? "ok" : undefined },
    ];
  };
  return { kind: "scene", title: `One LSTM step, x = ${r2(x)}, old memory ${r2(cp)}`, height: 400, steps: [
    { note: `The old output h and the new input x arrive at the bottom; the old memory c = ${r2(cp)} runs along the top. Try: set x negative, or give the cell a big old memory.`, shapes: shapes(0) },
    { note: `Four small layers read [h, x]. Gates use sigmoid, 0 to 1: forget ${r2(f)}, write ${r2(i)}, show ${r2(o)}. The candidate g uses tanh: ${r2(g)}. Thicker lines are bigger values.`, shapes: shapes(1) },
    { note: `Forget: the old memory is multiplied by f. ${r2(cp)} × ${r2(f)} = ${r2(f * cp)}. ${f > 0.7 ? "The gate is mostly open, so most of the memory survives." : "The gate is half shut, so much of the memory is dropped."}`, shapes: shapes(2) },
    { note: `Write: add i × g = ${r2(i)} × ${r2(g)} = ${r2(i * g)}. New memory c = ${r2(f * cp)} + ${r2(i * g)} = ${r2(c)}. Only multiply and add touch the top line, which is why gradients travel along it so well.`, tone: "ok", shapes: shapes(3) },
    { note: `Show: h = o × tanh(c) = ${r2(o)} × ${r2(Math.tanh(c))} = ${r2(h)}. The output gate decides how much of the memory this step reveals; the memory itself carries on.`, tone: "ok", shapes: shapes(4) },
  ] };
}

// why-order-matters: a window MLP's first layer grows with the window, an RNN's weights do not
const H = 128;
function windowCost(v: Record<string, number>): Flow {
  const { k, d } = v, rnn = d * H + H * H;
  const step = (kk: number, say: string) => ({ note: `Window of ${kk} words: the MLP's first layer has ${kk} × ${d} × ${H} = ${compact(kk * d * H)} weights. The RNN has ${d} × ${H} + ${H} × ${H} = ${compact(rnn)} for any length. ${say}`,
    tone: kk * d * H > rnn ? "warn" as const : "ok" as const,
    bars: [{ label: "window MLP", value: kk * d * H, tone: "warn" as const }, { label: "RNN", value: rnn, tone: "ok" as const }] });
  return { kind: "bars", title: `First-layer weights, embedding size ${d}, hidden ${H}`, format: compact, steps: [
    step(k, `The MLP can look ${k} words back and no further.`),
    step(2 * k, "Double the window and its weights double, and every slot still learns its own copy of each pattern."),
    step(4 * k, `At ${4 * k} words the window reaches further, but a word ${4 * k + 1} back is already out of its reach. The RNN reads any length with the same weights.`),
  ] };
}

// rnn-bptt: gradient size k steps back, for a linear RNN, after norm clipping, and for a real tanh RNN
const sci = (v: number) => (v !== 0 && (v < 0.001 || v >= 1e4) ? v.toExponential(1) : v >= 100 ? v.toFixed(0) : v.toFixed(3));
function vanish(v: Record<string, number>): Flow {
  const { u, T } = v, CLIP = 5;
  const ks = [...new Set([1, Math.round(T / 4), Math.round(T / 2), Math.round((3 * T) / 4), T])];
  // a scalar tanh RNN on random inputs in [-1, 1]; factor at step t is u (1 - h_t^2)
  const rng = seededRng("s3-vanish"), hs: number[] = [];
  for (let t = 0; t < T; t++) hs.push(Math.tanh(2 * rng() - 1 + u * (t ? hs[t - 1] : 0)));
  const fac = hs.map((h) => u * (1 - h * h));
  const back = (k: number) => fac.slice(T - k).reduce((p, f) => p * f, 1);
  // the shared weight's gradient adds one term per step back, so the size to clip is the sum over all T steps
  const lin = ks.map((k) => u ** k), total = Array.from({ length: T }, (_, k) => u ** (k + 1)).reduce((a, b) => a + b, 0), scale = Math.min(1, CLIP / total);
  const bars = (vals: number[]) => ks.map((k, i) => ({ label: `${k} back`, value: vals[i], tone: vals[i] > 1 ? "bad" as const : vals[i] < 0.01 ? "warn" as const : "ok" as const }));
  return { kind: "bars", title: `Gradient size k steps back, u = ${u}`, format: sci, steps: [
    { note: `No tanh: k steps back multiply u k times. u = ${u} gives ${sci(lin.at(-1)!)} at ${T} steps. ${u < 1 ? "Below 1 it vanishes." : u > 1 ? "Above 1 it explodes." : "Exactly 1 keeps it, a knife edge."}`, tone: u === 1 ? "ok" as const : u < 1 ? "warn" as const : "bad" as const, bars: bars(lin) },
    { note: scale < 1 ? `Clip the norm to ${CLIP}: everything is scaled by ${sci(scale)}, so the update is safe. ${u < 1 ? "The far terms stay tiny next to the near ones." : u > 1 ? "The far terms still dominate: clipping caps the size, not the shape." : "Every term stays equal."}` : `The total is ${sci(total)}, under the clip of ${CLIP}, so clipping changes nothing. It cannot make a small gradient bigger.`, tone: scale < 1 ? "ok" as const : "warn" as const, bars: bars(lin.map((x) => x * scale)) },
    { note: `A real tanh RNN on random inputs: each factor is u × (1 - h squared), at most u. ${u > 1 ? "A large u pushes the units into saturation, where the slope is near 0" : "The slope cuts every factor further"}, so after ${T} steps the gradient is ${sci(back(T))}.`, tone: back(T) < 0.01 ? "warn" as const : "ok" as const, bars: bars(ks.map(back)) },
  ] };
}

// lstm-gru: how much each word still counts in a GRU's final state, h_t = z h_(t-1) + (1 - z) x_t (candidate = the word itself)
const GATE_WORDS = ["the", "key", "was", "under", "the", "old", "mat", "by", "the", "door", "last", "night"], KEY = 1;
function gate(v: Record<string, number>): Flow {
  const { z, n } = v, ws = GATE_WORDS.slice(0, n);
  // weight of word t in h_n: (1 - z_t) times the product of z_s for every later s
  const weights = (zs: number[]) => zs.map((zt, t) => (1 - zt) * zs.slice(t + 1).reduce((p, s) => p * s, 1));
  const p2 = (x: number) => x.toFixed(2);
  const bars = (w: number[]) => w.map((x, t) => ({ label: `${t + 1} ${ws[t]}`, value: x, tone: t === KEY ? "hot" as const : undefined }));
  const same = weights(ws.map(() => z)), write = weights(ws.map((_, t) => (t === KEY ? 0 : z))), hold = weights(ws.map((_, t) => (t === KEY ? 0 : t < KEY ? z : 1)));
  return { kind: "bars", title: `What the final state holds after ${n} words`, max: 1, format: p2, steps: [
    { note: `One fixed gate z = ${z} for every word: each word writes ${p2(1 - z)} and older words fade by ${z} per step. "key" keeps only ${p2(same[KEY])}. The last word dominates.`, tone: "warn", bars: bars(same) },
    { note: `A learned gate reacts to the word: at "key" z drops to 0, so the state is overwritten with "key" and earlier words vanish. Later words still blend in at z = ${z}, so "key" keeps ${p2(write[KEY])}.`, tone: write[KEY] < 0.5 ? "warn" : "ok", bars: bars(write) },
    { note: `If the gate also closes after "key" (z = 1 for the rest), nothing overwrites it: "key" keeps ${p2(hold[KEY])}, and the gradient along that path is multiplied by 1 at each step. That is how gates remember.`, tone: "ok", bars: bars(hold) },
  ] };
}

// seq2seq-bottleneck: numbers available to the decoder, one fixed vector against every encoder state
function bottleneck(v: Record<string, number>): Flow {
  const { n, d } = v, f1 = (x: number) => (Number.isInteger(x) ? x.toLocaleString("en-US") : x.toFixed(1));
  const bars = (a: number, b: number) => [{ label: "fixed vector", value: a, tone: "bad" as const }, { label: "all states", value: b, tone: "ok" as const }];
  return { kind: "bars", title: `What the decoder can see, hidden size ${d}`, format: f1, steps: [
    { note: `A ${n} word source. Basic seq2seq hands over ${f1(d)} numbers. Keeping every encoder state, as attention does, keeps ${f1(n * d)}.`, tone: "warn", bars: bars(d, n * d) },
    { note: `Per word, the fixed vector can spend ${f1(d / n)} numbers. With every state kept, each word keeps all ${f1(d)} of its own.`, tone: d / n < 16 ? "bad" : "warn", bars: bars(d / n, d) },
    { note: `Double the source to ${2 * n} words: the fixed vector stays at ${f1(d)}, now ${f1(d / (2 * n))} per word. The kept states grow to ${f1(2 * n * d)}.`, tone: "bad", bars: bars(d, 2 * n * d) },
  ] };
}

// attention-fix: softmax dilution, the right word's weight as the source grows
function alignSharp(v: Record<string, number>): Flow {
  const { s, n } = v, p2 = (x: number) => x.toFixed(2);
  const split = (gap: number, len: number) => { const z = Math.exp(gap) + len - 1; return [Math.exp(gap) / z, 1 / z, (len - 1) / z]; };
  const bars = (w: number[]) => [{ label: "right word", value: w[0], tone: "ok" as const }, { label: "each other", value: w[1] }, { label: "others total", value: w[2], tone: "warn" as const }];
  const a = split(s, n), b = split(s, 2 * n), fix = s + Math.log(2), c = split(fix, 2 * n);
  return { kind: "bars", title: `Attention on the right word, score lead ${s}`, max: 1, format: p2, steps: [
    { note: `${n} source words. The right one scores ${s} above the rest, so it gets ${p2(a[0])} of the weight; the other ${n - 1} share ${p2(a[2])}.`, tone: a[0] >= 0.5 ? "ok" : "warn", bars: bars(a) },
    { note: `Double the source to ${2 * n} words with the same lead: the right word drops to ${p2(b[0])}. Many small weights add up and blur the context.`, tone: "warn", bars: bars(b) },
    { note: `Raise the lead by ln 2 = ${p2(Math.log(2))} (to ${p2(fix)}) and the right word is up to ${p2(c[0])}, close to the ${p2(a[0])} it had at ${n} words. A sharper score, learned in training, beats a longer source.`, tone: "ok", bars: bars(c) },
  ] };
}

export const PLAY_3: Record<string, PlayFlow> = {
  "s3-align-sharp": {
    title: "Longer sources dilute attention",
    knobs: [
      { key: "s", label: "Score lead of the right word", min: 0, max: 6, step: 0.5, value: 2 },
      { key: "n", label: "Source length (words)", min: 4, max: 40, step: 4, value: 8 },
    ],
    make: alignSharp,
  },
  "s3-bottleneck": {
    title: "Squeezing a sentence into one vector",
    knobs: [
      { key: "n", label: "Source length (words)", min: 5, max: 100, step: 5, value: 20 },
      { key: "d", label: "Hidden size", min: 64, max: 1024, step: 64, value: 256 },
    ],
    make: bottleneck,
  },
  "s3-rnn-unroll": {
    title: "Unroll an RNN",
    knobs: [
      { key: "u", label: "Recurrent weight u", min: 0.2, max: 2, step: 0.1, value: 0.8 },
      { key: "x1", label: "First input x1", min: 0.5, max: 3, step: 0.5, value: 1 },
    ],
    make: rnnUnroll,
  },
  "s3-lstm-cell": {
    title: "Open and close the gates",
    knobs: [
      { key: "x", label: "Input x", min: -2, max: 2, step: 0.5, value: 1 },
      { key: "cp", label: "Old memory c", min: -2, max: 2, step: 0.5, value: 0.8 },
    ],
    make: lstmCell,
  },
  "s3-gate": {
    title: "Write once, hold with a gate",
    knobs: [
      { key: "z", label: "Update gate z (keep old)", min: 0.5, max: 0.99, step: 0.01, value: 0.8 },
      { key: "n", label: "Words read", min: 4, max: 12, step: 1, value: 8 },
    ],
    make: gate,
  },
  "s3-vanish": {
    title: "Vanishing and exploding gradients",
    knobs: [
      { key: "u", label: "Recurrent weight u", min: 0.1, max: 2, step: 0.1, value: 0.9 },
      { key: "T", label: "Steps back", min: 8, max: 48, step: 4, value: 24 },
    ],
    make: vanish,
  },
  "s3-window": {
    title: "A wider window, or a recurrent net?",
    knobs: [
      { key: "k", label: "Window size (words)", min: 1, max: 20, step: 1, value: 5 },
      { key: "d", label: "Embedding size", min: 16, max: 512, step: 16, value: 128 },
    ],
    make: windowCost,
  },
};
