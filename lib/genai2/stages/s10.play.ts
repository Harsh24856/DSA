// Stage 10 (Frontier) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s10.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { anyRight, attnMixFlops, B, cascadeMs, cosineBar, kvGB, kvNumbers, LC, linearBar, majority, MOE, moeCount, n0, pct, patchTokens, r2, snr, ssmMixFlops, ssmNumbers, SSM, tiledTokens, videoTokens, VOICE, withRetries, chain } from "./s10.calc.ts";

const big = (x: number) => (x >= 1e12 ? `${(x / 1e12).toFixed(1)}T` : x >= 1e9 ? `${(x / 1e9).toFixed(1)}B` : x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : n0(x));

// reasoning-models: majority vote against a perfect checker
function vote(v: Record<string, number>): Flow {
  const p = v.p / 100, { n } = v;
  if (n % 2 === 0) throw new PlayError("Pick an odd number of samples, so a vote cannot tie.");
  const one = p, maj = majority(p, n), best = anyRight(p, n);
  const bars = (a: number, b: number, c: number) => [{ label: "1 sample", value: a, tone: "warn" as const }, { label: "majority vote", value: b, tone: "hot" as const }, { label: "with checker", value: c, tone: "ok" as const }];
  return { kind: "bars", title: `${n} samples, each right ${v.p}% of the time`, format: (x) => pct(x), max: 1, steps: [
    { note: `One sample is right with chance ${r2(p)}. Assume the wrong answers all agree, the worst case for voting.`, bars: bars(one, 0, 0) },
    { note: `Majority of ${n}: right when more than ${Math.floor(n / 2)} samples are. That is ${pct(maj, 1)}. ${p > 0.5 ? "Above one half, voting amplifies the right answer." : p < 0.5 ? "Below one half, voting amplifies the wrong answer: worse than one sample." : "At exactly one half, voting changes nothing."}`, tone: p >= 0.5 ? "hot" : "bad", bars: bars(one, maj, 0) },
    { note: `With a checker that always spots a right answer (unit tests, a proof checker), you need just one right sample in ${n}: ${pct(best, 1)}. The cost in both cases is ${n} times the tokens.`, tone: "ok", bars: bars(one, maj, best) },
  ] };
}

// mixture-of-experts: experts and top-k against total and active parameters
function moe(v: Record<string, number>): Flow {
  const { experts, topK } = v;
  if (topK > experts) throw new PlayError(`Top-${topK} needs at least ${topK} experts.`);
  const m = moeCount({ ...MOE, experts, topK }), dense = moeCount({ ...MOE, experts: 1, topK: 1 });
  const bars = (a: number, b: number) => [{ label: "stored (total)", value: a / 1e9, tone: "warn" as const }, { label: "used per token", value: b / 1e9, tone: "ok" as const }];
  return { kind: "bars", title: `${experts} experts, top-${topK}`, format: (x) => `${x.toFixed(1)}B`, steps: [
    { note: `The dense version of this model has one FFN per layer: ${B(dense.total)} parameters, all used by every token.`, bars: bars(dense.total, dense.active) },
    { note: `With ${experts} expert FFNs per layer the model stores ${B(m.total)}, ${(m.total / dense.total).toFixed(1)} times as much. All of it must sit in GPU memory.`, tone: "warn", bars: bars(m.total, dense.active) },
    { note: `Each token runs only ${topK} expert${topK > 1 ? "s" : ""} plus the shared attention and embeddings: ${B(m.active)} active, ${pct(m.ratio)} of the total. Compute per token follows the active count, memory the total.`, tone: "ok", bars: bars(m.total, m.active) },
  ] };
}

// state-space-hybrids: sequence length against mixing cost and decode memory
function ssm(v: Record<string, number>): Flow {
  const n = v.k * 1024, { N } = v, d = SSM.d;
  const fa = attnMixFlops(n, d), fs = ssmMixFlops(n, d, N), ma = kvNumbers(n, d), ms = ssmNumbers(d, N);
  const bars = (a: number, b: number) => [{ label: "attention", value: a, tone: "warn" as const }, { label: "state space", value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${n0(n)} tokens, state size ${N}, width ${n0(d)}`, format: big, steps: [
    { note: `Mixing cost for one layer. Attention compares every token with every earlier one: ${big(fa)} FLOPs, growing with n squared.`, tone: "warn", bars: bars(fa, 0) },
    { note: `The state space layer touches its ${n0(d)} × ${N} state once per token: ${big(fs)} FLOPs, growing with n. ${fa > fs ? `Attention costs ${(fa / fs).toFixed(0)} times more here.` : "At this length attention is still cheaper."}`, tone: "ok", bars: bars(fa, fs) },
    { note: `Memory while decoding, in numbers per layer: attention keeps ${big(ma)} for its keys and values; the SSM keeps ${big(ms)}, at any length. ${ma > ms ? `That is ${(ma / ms).toFixed(0)} times less.` : "Short prompts are where the KV cache is still small."}`, tone: "hot", bars: bars(ma, ms) },
  ] };
}

// long-context: context length, KV heads and users against GPU memory
function ctx(v: Record<string, number>): Flow {
  const tokens = v.k * 1024, { kvHeads, users } = v, m = { ...LC, kvHeads };
  const kv = kvGB(tokens, m) * users, total = kv + LC.weightsGB, gpus = Math.ceil(total / 80);
  if (gpus > 16) throw new PlayError(`${n0(total)} GB would need ${gpus} GPUs of 80 GB. Fewer users, fewer KV heads or a shorter context.`);
  const f = (x: number) => `${x.toFixed(x < 10 ? 1 : 0)} GB`;
  const bars = (a: number) => [{ label: "weights", value: LC.weightsGB, tone: "warn" as const }, { label: "KV cache", value: a, tone: "hot" as const }];
  return { kind: "bars", title: `${n0(tokens)} tokens, ${kvHeads} KV heads, ${users} user${users > 1 ? "s" : ""}`, format: f, steps: [
    { note: `An example 8B model: ${LC.weightsGB} GB of 16-bit weights, ${LC.layers} layers, head size ${LC.headDim}.`, bars: bars(0) },
    { note: `Each token keeps a key and a value in every layer for each of ${kvHeads} KV heads: ${n0(2 * LC.layers * kvHeads * LC.headDim * LC.bytes / 1024)} KiB. ${n0(tokens)} tokens × ${users} user${users > 1 ? "s" : ""} = ${f(kv)}.`, tone: "hot", bars: bars(kv) },
    { note: `${f(total)} in all: ${gpus} GPU${gpus > 1 ? "s" : ""} of 80 GB. ${kv > LC.weightsGB ? "The cache, not the model, decides the hardware." : "The weights still dominate."} ${kvHeads > 8 ? "Grouped-query attention with fewer KV heads would shrink this." : ""}`.trim(), tone: kv > LC.weightsGB ? "bad" : "ok", bars: bars(kv) },
  ] };
}

// vision-language: image size and patch size against visual tokens
function patches(v: Record<string, number>): Flow {
  const { w, h, patch } = v, plain = patchTokens(w, h, patch), tiled = tiledTokens(w, h, 448, patch), small = patchTokens(Math.round(w / 2), Math.round(h / 2), patch);
  const bars = (a: number, b: number, c: number) => [{ label: "whole image", value: a, tone: "hot" as const }, { label: "tiles of 448", value: b, tone: "warn" as const }, { label: "half size", value: c, tone: "ok" as const }];
  return { kind: "bars", title: `${w} x ${h} image, ${patch} px patches`, format: n0, steps: [
    { note: `Patches of ${patch} × ${patch}: ${Math.floor(w / patch)} across and ${Math.floor(h / patch)} down, ${n0(plain)} visual tokens. Each one costs like a text token.`, tone: "hot", bars: bars(plain, 0, 0) },
    { note: `Many models cut a big image into 448 tiles plus one small overview tile, so each tile is seen at the encoder's size: ${n0(tiled)} tokens.`, tone: "warn", bars: bars(plain, tiled, 0) },
    { note: `Halve both sides first and the whole image costs ${n0(small)} tokens, about a quarter, because tokens grow with area. Resize to the smallest size that still answers the question.`, tone: "ok", bars: bars(plain, tiled, small) },
  ] };
}

// voice-realtime: the budget of a streaming cascade
function voice(v: Record<string, number>): Flow {
  const b = { ...VOICE, endpoint: v.endpoint, llm: v.llm, tts: v.tts }, total = cascadeMs(b), f = (x: number) => `${Math.round(x)} ms`;
  const parts = (on: boolean) => [{ label: "end of turn", value: b.endpoint }, { label: "speech to text", value: b.stt }, { label: "LLM first token", value: b.llm, tone: "hot" as const }, { label: "first audio", value: b.tts }, { label: "total", value: on ? total : 0, tone: (total <= 800 ? "ok" : "bad") as "ok" | "bad" }];
  return { kind: "bars", title: `Endpoint ${v.endpoint} ms, LLM ${v.llm} ms, TTS ${v.tts} ms`, format: f, steps: [
    { note: `Each stage streams, so only its time to first output counts. Speech to text adds ${b.stt} ms and the network ${b.net} ms.`, bars: parts(false) },
    { note: `Total to the first sound: ${total} ms. ${total <= 800 ? "That feels like a natural reply." : "Over about a second, people notice the pause."} The biggest knobs are usually the end-of-turn wait and the LLM's first token.`, tone: total <= 800 ? "ok" : "bad", bars: parts(true) },
  ] };
}

// diffusion-flow: how much signal is left at step t under two schedules
function noise(v: Record<string, number>): Flow {
  const { t } = v, lin = linearBar(t), co = cosineBar(t);
  const bars = (a: number, b: number) => [{ label: "linear schedule", value: a, tone: "warn" as const }, { label: "cosine schedule", value: b, tone: "ok" as const }];
  return { kind: "bars", title: `Step ${t} of 1000`, format: r2, max: 1, steps: [
    { note: `x_t = sqrt(abar) × image + sqrt(1 - abar) × noise. At step ${t} the linear schedule keeps sqrt(abar) = ${r2(Math.sqrt(lin))} of the image signal; the cosine one keeps ${r2(Math.sqrt(co))}.`, bars: bars(Math.sqrt(lin), Math.sqrt(co)) },
    { note: `Signal to noise ratio: ${snr(lin) > 100 ? n0(snr(lin)) : r2(snr(lin))} against ${snr(co) > 100 ? n0(snr(co)) : r2(snr(co))}. ${lin < co ? "The linear schedule destroys the image early, wasting late steps on near-pure noise. The cosine schedule spreads the damage more evenly." : "Near the start both keep almost all of the image."}`, tone: "hot", bars: bars(Math.sqrt(lin), Math.sqrt(co)) },
  ] };
}

// video-world: clip length, frame rate and height against tokens
function video(v: Record<string, number>): Flow {
  const { seconds, fps, h } = v, w = Math.round((h * 16) / 9), x = videoTokens(seconds, fps, w, h), img = videoTokens(1 / fps, fps, w, h);
  if (x.tokens > 2e6) throw new PlayError(`${n0(x.tokens)} tokens is past what one model call attends over. Make the clip shorter or smaller.`);
  const bars = (a: number, b: number) => [{ label: "one frame", value: a, tone: "ok" as const }, { label: "whole clip", value: b, tone: "hot" as const }];
  return { kind: "bars", title: `${seconds} s at ${fps} fps, ${w} x ${h}`, format: n0, steps: [
    { note: `One latent frame of ${w} × ${h} is ${n0(img.perFrame)} tokens, like a single image.`, tone: "ok", bars: bars(img.tokens, 0) },
    { note: `${x.frames} frames, squeezed 4 times in time to ${x.lat} latent frames: ${n0(x.tokens)} tokens. Full attention compares ${big(x.tokens ** 2)} pairs, at every denoising step.`, tone: "hot", bars: bars(img.tokens, x.tokens) },
  ] };
}

// coding-agents: per-step reliability, task length and retries
function agent(v: Record<string, number>): Flow {
  const p = v.p / 100, { k, r } = v, once = chain(p, k), many = withRetries(p, k, r);
  const bars = (a: number, b: number) => [{ label: "one attempt", value: a, tone: "warn" as const }, { label: `${r} attempts + tests`, value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${k} steps at ${v.p}% each, ${r} attempts`, format: (x) => pct(x), max: 1, steps: [
    { note: `Every one of ${k} steps must go right: ${r2(p)}^${k} = ${pct(once, 1)}. Long tasks fail even when each step is reliable.`, tone: "warn", bars: bars(once, 0) },
    { note: `If tests catch a failed attempt, the agent can try again from a clean state. Any of ${r} attempts passing: ${pct(many, 1)}. Without a test that fails on wrong code, retries add nothing.`, tone: "ok", bars: bars(once, many) },
  ] };
}

export const PLAY_10: Record<string, PlayFlow> = {
  "s10-vote": { title: "Voting against a checker", knobs: [
    { key: "p", label: "One sample right (%)", min: 10, max: 95, step: 5, value: 60 },
    { key: "n", label: "Samples", min: 1, max: 31, step: 2, value: 5 }], make: vote },
  "s10-moe": { title: "Experts against parameters", knobs: [
    { key: "experts", label: "Experts per layer", min: 1, max: 64, step: 1, value: 8 },
    { key: "topK", label: "Experts per token (top-k)", min: 1, max: 8, step: 1, value: 2 }], make: moe },
  "s10-ssm": { title: "Attention against a state space layer", knobs: [
    { key: "k", label: "Sequence length (K tokens)", min: 1, max: 256, step: 1, value: 32 },
    { key: "N", label: "State size N", min: 8, max: 128, step: 8, value: 16 }], make: ssm },
  "s10-ctx": { title: "Context length against GPU memory", knobs: [
    { key: "k", label: "Context (K tokens)", min: 4, max: 1024, step: 4, value: 128 },
    { key: "kvHeads", label: "KV heads", min: 1, max: 32, step: 1, value: 8 },
    { key: "users", label: "Users at once", min: 1, max: 8, step: 1, value: 1 }], make: ctx },
  "s10-patches": { title: "Image size against visual tokens", knobs: [
    { key: "w", label: "Width (px)", min: 224, max: 2240, step: 112, value: 1344 },
    { key: "h", label: "Height (px)", min: 224, max: 2240, step: 112, value: 896 },
    { key: "patch", label: "Patch size (px)", min: 14, max: 28, step: 2, value: 14 }], make: patches },
  "s10-voice": { title: "A voice reply's latency budget", knobs: [
    { key: "endpoint", label: "End-of-turn wait (ms)", min: 100, max: 1000, step: 50, value: 300 },
    { key: "llm", label: "LLM first token (ms)", min: 100, max: 1500, step: 50, value: 300 },
    { key: "tts", label: "First audio chunk (ms)", min: 50, max: 600, step: 50, value: 100 }], make: voice },
  "s10-noise": { title: "Two noise schedules", knobs: [
    { key: "t", label: "Step t", min: 10, max: 990, step: 10, value: 400 }], make: noise },
  "s10-video": { title: "Clip size against tokens", knobs: [
    { key: "seconds", label: "Length (s)", min: 1, max: 20, step: 1, value: 5 },
    { key: "fps", label: "Frames per second", min: 8, max: 30, step: 2, value: 24 },
    { key: "h", label: "Height (px)", min: 256, max: 1088, step: 32, value: 704 }], make: video },
  "s10-agent": { title: "Long tasks and retries", knobs: [
    { key: "p", label: "Each step right (%)", min: 70, max: 99, step: 1, value: 95 },
    { key: "k", label: "Steps in the task", min: 1, max: 60, step: 1, value: 20 },
    { key: "r", label: "Attempts", min: 1, max: 8, step: 1, value: 3 }], make: agent },
};
