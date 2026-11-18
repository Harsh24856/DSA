// Stage 9 (Production) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s9.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { bestK, continuous, decodeCeiling, decodeStep, effBits, GPU, kvGB, mean, MODEL, n0, pct, quantGB, relErr, specCost, specSpeedup, specTokens, staticSpans, weightsGB, WEIGHTS } from "./s9.calc.ts";

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

// batching-engines: static against continuous batching on a mix of short and long requests
export const MIX = { n: 16, short: 40 };
export const mixLens = (every: number, long: number) => Array.from({ length: MIX.n }, (_, i) => (i % every === every - 1 ? long : MIX.short));
function batching(v: Record<string, number>): Flow {
  const { slots, long, every } = v, lens = mixLens(every, long);
  const st = staticSpans(lens, slots), co = continuous(lens, slots);
  const endS = Math.max(...st.map((s) => s[1])), endC = Math.max(...co.map((s) => s[1]));
  const mS = mean(st.map((s) => s[1])), mC = mean(co.map((s) => s[1]));
  const shortS = mean(st.filter((_, i) => lens[i] === MIX.short).map((s) => s[1])), shortC = mean(co.filter((_, i) => lens[i] === MIX.short).map((s) => s[1]));
  const work = lens.reduce((a, b) => a + b, 0), busy = (end: number) => work / (end * slots);
  const f = (x: number) => `${n0(x)} steps`;
  const bars = (a: number, b: number) => [{ label: "static", value: a, tone: "warn" as const }, { label: "continuous", value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${MIX.n} requests on ${slots} slots: 1 in ${every} is ${long} tokens`, format: f, steps: [
    { note: `Static batching takes ${slots} requests at a time and starts the next batch only when the longest one ends: ${f(endS)} in all. Slots are busy ${pct(busy(endS))} of the time.`, tone: "warn", bars: bars(endS, endS) },
    { note: `Continuous batching puts a waiting request into a slot the step it frees: ${f(endC)}, slots busy ${pct(busy(endC))}. Same GPU, same requests.`, tone: "ok", bars: bars(endS, endC) },
    { note: `What users feel: a ${MIX.short} token request finishes after ${f(shortS)} on average with static batches, ${f(shortC)} with continuous. Overall average finish: ${f(mS)} against ${f(mC)}. Short requests stop waiting for long ones.`, tone: "hot", bars: bars(shortS, shortC) },
  ] };
}

// quantisation: bits and group size against memory, the decode speed limit and rounding error
function quantPlay(v: Record<string, number>): Flow {
  const { params, bits, group } = v, gb = quantGB(params, bits, group), base = quantGB(params, 16);
  if (gb > GPU.mem * 8) throw new PlayError(`${gb.toFixed(0)} GB of weights would need more than 8 GPUs of ${GPU.mem} GB. Pick fewer parameters or fewer bits.`);
  const err = relErr(WEIGHTS, bits, group), errT = relErr(WEIGHTS, bits, WEIGHTS.length), gpus = Math.ceil(gb / (GPU.mem * 0.9));
  const f = (x: number) => `${x.toFixed(x < 10 ? 1 : 0)} GB`;
  const bars = (b: number) => [{ label: "16-bit", value: base, tone: "warn" as const }, { label: `${bits}-bit`, value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${params}B parameters, ${bits}-bit, groups of ${group}`, format: f, steps: [
    { note: `In 16-bit the weights take ${params} × 2 = ${f(base)}. Each decode step reads all of them.`, tone: "warn", bars: bars(base) },
    { note: `${bits} bits a weight plus one 16-bit scale per ${group} weights is ${effBits(bits, group).toFixed(3)} bits: ${f(gb)}, ${(base / gb).toFixed(1)} times smaller. That needs ${gpus} GPU${gpus > 1 ? "s" : ""} of ${GPU.mem} GB, and raises the decode limit from ${n0(decodeCeiling(base))} to ${n0(decodeCeiling(gb))} tokens a second.`, tone: "ok", bars: bars(gb) },
    { note: `The price is rounding error. On a sample layer with a few outliers, the error is ${pct(err, 1)} of the weights' size with groups of ${group}, and ${pct(errT, 1)} with one scale for the whole layer. ${bits <= 3 ? "Below 4 bits errors grow fast; such models need careful methods and evals." : "Smaller groups keep each outlier's damage local."}`, tone: bits <= 3 ? "bad" : "hot", bars: bars(gb) },
  ] };
}

// speculative-decoding: acceptance rate, draft length and draft cost against the speedup
function spec(v: Record<string, number>): Flow {
  const a = v.alpha / 100, { k } = v, c = v.cost / 100, e = specTokens(a, k), cost = specCost(k, c), s = e / cost, best = bestK(a, c);
  const f = (x: number) => x.toFixed(2);
  const bars = (x: number, y: number, z: number) => [{ label: "tokens a pass", value: x, tone: "ok" as const }, { label: "cost a pass", value: y, tone: "warn" as const }, { label: "speedup", value: z, tone: "hot" as const }];
  return { kind: "bars", title: `Accept ${v.alpha}%, draft ${k}, draft cost ${v.cost}%`, format: f, steps: [
    { note: `The draft guesses ${k} tokens. Each is accepted with chance ${f(a)}, and the run stops at the first rejection. The large pass always adds one token of its own, so on average it yields (1 - ${f(a)}^${k + 1}) / (1 - ${f(a)}) = ${f(e)} tokens.`, tone: "ok", bars: bars(e, 0, 0) },
    { note: `That pass also cost ${k} draft steps at ${f(c)} of a large step each: ${f(cost)} large steps in all.`, tone: "warn", bars: bars(e, cost, 0) },
    { note: s > 1
      ? `Speedup ${f(e)} / ${f(cost)} = ${f(s)} times, with the output unchanged. ${best === k ? `${k} is the best draft length here.` : `A draft of ${best} would do better (${f(specSpeedup(a, best, c))} times).`} The gain assumes verifying ${k + 1} tokens costs about one step, which holds when the GPU is memory bound.`
      : `Speedup ${f(s)}: no gain over plain decoding. The draft is accepted too rarely or costs too much. Shorten the draft or use a better one.`, tone: s > 1 ? "hot" : "bad", bars: bars(e, cost, s) },
  ] };
}

export const PLAY_9: Record<string, PlayFlow> = {
  "s9-spec": {
    title: "When does speculative decoding pay?",
    knobs: [
      { key: "alpha", label: "Draft tokens accepted (%)", min: 30, max: 95, step: 5, value: 80 },
      { key: "k", label: "Tokens drafted per step", min: 1, max: 10, step: 1, value: 4 },
      { key: "cost", label: "Draft step cost (% of large)", min: 1, max: 40, step: 1, value: 5 },
    ],
    make: spec,
  },
  "s9-quant": {
    title: "Bits against size, speed and error",
    knobs: [
      { key: "params", label: "Parameters (billions)", min: 1, max: 120, step: 1, value: 70 },
      { key: "bits", label: "Bits per weight", min: 2, max: 8, step: 1, value: 4 },
      { key: "group", label: "Weights per scale (group)", min: 32, max: 512, step: 32, value: 128 },
    ],
    make: quantPlay,
  },
  "s9-batching": {
    title: "Static against continuous batching",
    knobs: [
      { key: "slots", label: "Batch slots", min: 1, max: 8, step: 1, value: 4 },
      { key: "long", label: "Long request (tokens)", min: 50, max: 1000, step: 50, value: 400 },
      { key: "every", label: "One long request in every", min: 2, max: 8, step: 1, value: 4 },
    ],
    make: batching,
  },
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
