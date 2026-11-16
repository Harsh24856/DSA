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

export const PLAY_3: Record<string, PlayFlow> = {
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
