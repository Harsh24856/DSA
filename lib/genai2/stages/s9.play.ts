// Stage 9 (Production) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s9.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { decodeStep, GPU, kvGB, MODEL, n0, weightsGB } from "./s9.calc.ts";

const ms = (s: number) => `${(s * 1000).toFixed(s < 0.001 ? 2 : 1)} ms`;

// time-memory: batch size moves decode from memory bound towards compute bound
function roofline(v: Record<string, number>): Flow {
  const { batch, bits, ctx } = v;
  if (bits === 12) throw new PlayError("No common weight format uses 12 bits. Pick 4, 8 or 16.");
  const bpw = bits / 8, w = weightsGB(MODEL.params, bpw), kv = kvGB(ctx, batch);
  if (w + kv > GPU.mem) throw new PlayError(`${n0(batch)} users at ${n0(ctx)} tokens need ${kv.toFixed(0)} GB of KV cache on top of ${w} GB of weights, more than the ${GPU.mem} GB GPU. Lower the batch or the context.`);
  const one = decodeStep(1, ctx, bpw), d = decodeStep(batch, ctx, bpw);
  const f = (x: number) => `${n0(x)} tok/s`;
  const bars = (a: number, b: number) => [{ label: "per user", value: a, tone: "ok" as const }, { label: "whole GPU", value: b, tone: "hot" as const }];
  return { kind: "bars", title: `Batch ${batch}, ${bits}-bit weights, ${n0(ctx)} token context`, format: f, steps: [
    { note: `One user alone: each step moves ${w} GB of weights and ${(kvGB(ctx, 1)).toFixed(2)} GB of KV cache, taking ${ms(one.memS)}. The maths takes only ${ms(one.compS)}. About ${n0(one.perUser)} tokens per second.`, tone: "warn", bars: bars(one.perUser, one.total) },
    { note: `With ${batch} users in one batch, the weights are read once and used ${batch} times. The KV cache is not shared: it is now ${kv.toFixed(1)} GB. Step time: ${ms(d.memS)} to move bytes, ${ms(d.compS)} of maths.`, bars: bars(d.perUser, d.total) },
    { note: d.bound === "memory"
      ? `Still memory bound, so each user gets ${n0(d.perUser)} tok/s and the GPU makes ${n0(d.total)} in all, ${(d.total / one.total).toFixed(1)} times one user. Batching is close to free until the KV cache or the compute roof stops it.`
      : `Now compute bound: the maths takes longer than moving the bytes. Each user drops to ${n0(d.perUser)} tok/s while the GPU makes ${n0(d.total)}. Past this point a bigger batch buys little.`, tone: d.bound === "memory" ? "ok" : "hot", bars: bars(d.perUser, d.total) },
  ] };
}

export const PLAY_9: Record<string, PlayFlow> = {
  "s9-roofline": {
    title: "Batch size against tokens per second",
    knobs: [
      { key: "batch", label: "Users in the batch", min: 1, max: 160, step: 1, value: 32 },
      { key: "bits", label: "Bits per weight", min: 4, max: 16, step: 4, value: 16 },
      { key: "ctx", label: "Context per user (tokens)", min: 256, max: 8192, step: 256, value: 2048 },
    ],
    make: roofline,
  },
};
