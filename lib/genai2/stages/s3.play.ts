// Stage 3 (Sequences) slider walk-throughs, spread by stages/play.ts into PLAY_FLOWS. Every number is computed here.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";

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

export const PLAY_3: Record<string, PlayFlow> = {
  "s3-window": {
    title: "A wider window, or a recurrent net?",
    knobs: [
      { key: "k", label: "Window size (words)", min: 1, max: 20, step: 1, value: 5 },
      { key: "d", label: "Embedding size", min: 16, max: 512, step: 16, value: 128 },
    ],
    make: windowCost,
  },
};
