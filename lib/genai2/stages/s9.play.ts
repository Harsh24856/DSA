// Stage 9 (Production) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s9.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { atLeastOnce, bestK, pairwise, ROLL, continuous, decodeCeiling, decodeStep, effBits, GPU, kvGB, mean, MODEL, n0, pct, quantGB, relErr, specCost, specSpeedup, specTokens, staticSpans, weightsGB, WEIGHTS } from "./s9.calc.ts";

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

// evals-judge: a pairwise judge that favours the first answer it sees, and the order-swap fix
function position(v: Record<string, number>): Flow {
  const pA = v.pA / 100, bias = v.bias / 100, r = pairwise(pA, bias);
  const bars = (x: number, y: number, z: number) => [{ label: "A always first", value: x, tone: "bad" as const }, { label: "random order", value: y, tone: "warn" as const }, { label: "both orders agree", value: z, tone: "ok" as const }];
  return { kind: "bars", title: `A is truly better ${v.pA}% of the time; judge bias ${v.bias}%`, max: 1, format: (x) => pct(x), steps: [
    { note: `The judge compares answer A (new prompt) with B (old). ${v.bias}% of the time it just picks whichever it saw first. Always showing A first, A wins ${pct(r.aFirst)}, not ${pct(pA)}.`, tone: "bad", bars: bars(r.aFirst, 0, 0) },
    { note: `Randomising the order cancels the bias on average: ${pct(r.mixed)}. ${bias > 0 ? "But the bias still adds noise, and pulls the result towards 50%." : "With no bias, order does not matter."}`, tone: "warn", bars: bars(r.aFirst, r.mixed, 0) },
    { note: `Better: run every pair in both orders and count a win only when both runs agree. ${pct(r.tie)} of pairs disagree and count as ties. Among the rest, A wins ${pct(r.swapWin)}. ${Math.abs(r.swapWin - pA) < 0.05 ? "Close to the truth." : `Still off from ${pct(pA)}: a strong bias also hides real preferences, so fix the judge prompt too.`}`, tone: "ok", bars: bars(r.aFirst, r.mixed, r.swapWin) },
  ] };
}

// observability-rollouts: canary size against how fast a bad change shows, and how many users it hurts
export const BASE_BAD = 0.02;
// minutes until the extra bad answers reach 3 standard deviations of the normal count
export const detectMin = (perMin: number, share: number, extra: number, base = BASE_BAD) => (9 * base) / (extra * extra * perMin * share);
function rollout(v: Record<string, number>): Flow {
  const share = v.share / 100, extra = v.extra / 100, per = ROLL.perMin, win = v.win;
  const stat = detectMin(per, share, extra), statFull = detectMin(per, 1, extra);
  const m = Math.max(win, stat), mFull = Math.max(win, statFull);
  if (m > 24 * 60) throw new PlayError(`At ${v.share}%, it would take ${n0(m / 60)} hours to see a change this small. Raise the canary share.`);
  const hurt = per * share * m * extra, hurtFull = per * mFull * extra;
  const t = (x: number) => (x >= 60 ? `${(x / 60).toFixed(1)} h` : `${x.toFixed(x < 10 ? 1 : 0)} min`);
  const bars = (a: number, b: number) => [{ label: "everyone at once", value: a, tone: "bad" as const }, { label: `${v.share}% canary`, value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${v.share}% canary, +${v.extra} points bad, ${win} min alert window`, format: (x) => n0(x), steps: [
    { note: `${n0(per)} requests a minute; normally ${BASE_BAD * 100}% of answers get flagged and the new version adds ${v.extra} points. Your alerts look at ${win} minute windows, and a gap must reach about 3 standard deviations to count.`, bars: bars(0, 0) },
    { note: `On ${v.share}% of traffic the gap becomes clear after ${t(stat)} of data, so you know after ${t(m)}. On all traffic: ${t(statFull)} of data, known after ${t(mFull)}.`, tone: "warn", bars: bars(0, 0) },
    { note: `Extra bad answers before rollback: about ${n0(hurtFull)} sent to everyone, ${n0(hurt)} with the canary. ${stat >= win ? "The canary is so small that waiting for enough data sets the pace; any canary this small hurts about the same number of users, just more slowly." : "The alert window sets the pace, so a smaller canary means fewer users hurt."}`, tone: "ok", bars: bars(hurtFull, hurt) },
  ] };
}

// security-guardrails: a filter that catches most attacks, against an attacker who keeps trying
function attack(v: Record<string, number>): Flow {
  const miss = 1 - v.catch / 100, { tries } = v, any = atLeastOnce(miss, tries), approve = v.approve / 100, harm = atLeastOnce(miss * approve, tries);
  const f = (x: number) => pct(x, x < 0.1 ? 1 : 0);
  const bars = (a: number, b: number, c: number) => [{ label: "one try passes", value: a, tone: "warn" as const }, { label: `any of ${tries} passes`, value: b, tone: "bad" as const }, { label: "harm done", value: c, tone: "ok" as const }];
  return { kind: "bars", title: `Filter catches ${v.catch}%, ${tries} tries, ${v.approve}% approved`, max: 1, format: f, steps: [
    { note: `A guardrail model flags ${v.catch}% of injection attempts. One attempt gets past it ${f(miss)} of the time. That sounds safe.`, tone: "warn", bars: bars(miss, 0, 0) },
    { note: `Attackers retry for free. Over ${tries} tries, at least one passes with chance 1 - ${v.catch / 100}^${tries} = ${f(any)}. A filter lowers the rate; it does not make the system safe.`, tone: "bad", bars: bars(miss, any, 0) },
    { note: `Now limit what a passing attack can do: the risky action needs a person to approve it, and a person approves a malicious request ${v.approve}% of the time. Harm needs both: ${f(harm)} over ${tries} tries. ${v.approve === 0 ? "With no risky action possible, the attack has nowhere to go." : "Cutting the capability works better than a better filter."}`, tone: "ok", bars: bars(miss, any, harm) },
  ] };
}

export const PLAY_9: Record<string, PlayFlow> = {
  "s9-attack": {
    title: "Filters against a patient attacker",
    knobs: [
      { key: "catch", label: "Filter catches (%)", min: 50, max: 99.5, step: 0.5, value: 95 },
      { key: "tries", label: "Attacker's tries", min: 1, max: 200, step: 1, value: 50 },
      { key: "approve", label: "Malicious action approved (%)", min: 0, max: 50, step: 1, value: 2 },
    ],
    make: attack,
  },
  "s9-rollout": {
    title: "How big should a canary be?",
    knobs: [
      { key: "share", label: "Canary share of traffic (%)", min: 1, max: 50, step: 1, value: 5 },
      { key: "extra", label: "Extra bad answers (points)", min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: "win", label: "Alert window (minutes)", min: 5, max: 60, step: 5, value: 15 },
    ],
    make: rollout,
  },
  "s9-position": {
    title: "Position bias in a pairwise judge",
    knobs: [
      { key: "pA", label: "A is truly better (%)", min: 10, max: 90, step: 5, value: 50 },
      { key: "bias", label: "Judge picks the first answer (%)", min: 0, max: 60, step: 5, value: 30 },
    ],
    make: position,
  },
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
