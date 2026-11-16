// Stage 3 (Sequences) slider walk-throughs, spread by stages/play.ts into PLAY_FLOWS. Every number is computed here.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { seededRng } from "../rng.ts";

const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${(v / 1e3).toFixed(0)}k` : v.toLocaleString("en-US"));

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
    step(4 * k, `At ${4 * k} words the window reaches further, but a sentence of ${4 * k + 1} words is already too long for it. The RNN reads any length with the same weights.`),
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
  const lin = ks.map((k) => u ** k), total = lin.reduce((a, b) => a + b, 0), scale = Math.min(1, CLIP / total);
  const bars = (vals: number[]) => ks.map((k, i) => ({ label: `${k} back`, value: vals[i], tone: vals[i] > 1 ? "bad" as const : vals[i] < 0.01 ? "warn" as const : "ok" as const }));
  return { kind: "bars", title: `Gradient size k steps back, u = ${u}`, format: sci, steps: [
    { note: `No tanh: k steps back multiply u k times. u = ${u} gives ${sci(lin.at(-1)!)} at ${T} steps. ${u < 1 ? "Below 1 it vanishes." : u > 1 ? "Above 1 it explodes." : "Exactly 1 keeps it, a knife edge."}`, tone: u === 1 ? "ok" as const : u < 1 ? "warn" as const : "bad" as const, bars: bars(lin) },
    { note: scale < 1 ? `Clip the norm to ${CLIP}: everything is scaled by ${sci(scale)}, so the update is safe. The far terms are still tiny next to the near ones.` : `The total is ${sci(total)}, under the clip of ${CLIP}, so clipping changes nothing. It cannot make a small gradient bigger.`, tone: scale < 1 ? "ok" as const : "warn" as const, bars: bars(lin.map((x) => x * scale)) },
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

export const PLAY_3: Record<string, PlayFlow> = {
  "s3-bottleneck": {
    title: "Squeezing a sentence into one vector",
    knobs: [
      { key: "n", label: "Source length (words)", min: 5, max: 100, step: 5, value: 20 },
      { key: "d", label: "Hidden size", min: 64, max: 1024, step: 64, value: 256 },
    ],
    make: bottleneck,
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
