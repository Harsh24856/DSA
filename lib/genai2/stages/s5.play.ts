// Stage 5 (Training LLMs) slider walk-throughs, placed in modules by a `play` block. Client-safe: no module text.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { seededRng } from "../rng.ts";

const r2 = (x: number) => x.toFixed(2);
// 2.97e10 -> "29.7B"; tokens and parameters both read well this way
export const big = (x: number) => (x >= 1e12 ? `${(x / 1e12).toFixed(1)}T` : x >= 1e9 ? `${(x / 1e9).toFixed(1)}B` : x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : `${Math.round(x / 1e3)}K`);
// 1.06e23 -> "1.1 × 10^23"
export const sci = (x: number) => { const [m, e] = x.toExponential(1).split("e"); return `${m} × 10^${Number(e)}`; };

// Assumed per-GPU throughput: 400 trillion bf16 FLOP/s peak at 40% utilisation.
const GPU_FLOPS = 400e12 * 0.4;

function budget(v: Record<string, number>): Flow {
  const { gpus, days, r } = v, C = gpus * GPU_FLOPS * days * 86400;
  const opt = (k: number) => { const N = Math.sqrt(C / (6 * k)); return { N, D: k * N }; };
  const a = opt(20), b = opt(r), serve = b.N / a.N;
  const say = r === 20 ? "That is the rule of thumb itself." : r > 20
    ? `A ${big(b.N)} model on ${big(b.D)} tokens: a little worse loss for this budget, but each token it serves costs ${r2(serve)}x as much, so it is cheaper to run.`
    : `A ${big(b.N)} model on only ${big(b.D)} tokens: under-trained for its size, and each token it serves costs ${r2(serve)}x as much.`;
  return { kind: "grid", title: `${gpus} GPUs for ${days} days`, steps: [
    { note: `Assume each GPU sustains ${sci(GPU_FLOPS)} FLOP/s (400 trillion peak at 40% use). Over ${days} days the cluster does C = ${sci(C)} FLOPs.`,
      tables: [{ head: ["item", "value"], rows: [["GPUs", gpus], ["days", days], ["FLOP/s each", sci(GPU_FLOPS)], ["compute C", sci(C)]], tones: { "3": "hot" } }] },
    { note: `Training costs about 6 FLOPs per parameter per token, C = 6ND. With about 20 tokens per parameter, N = sqrt(C / 120) = ${big(a.N)} and D = ${big(a.D)} tokens.`, tone: "hot",
      tables: [{ head: ["item", "value"], rows: [["params N", big(a.N)], ["tokens D", big(a.D)], ["6ND", sci(6 * a.N * a.D)]], tones: { "0": "ok", "1": "ok" } }] },
    { note: `Now spend the same C at ${r} tokens per parameter. ${say}`, tone: r === 20 ? "ok" : r > 20 ? "ok" : "warn",
      tables: [{ head: ["", "20 / param", `${r} / param`], rows: [["params", big(a.N), big(b.N)], ["tokens", big(a.D), big(b.D)], ["serve cost", "1.00x", `${r2(serve)}x`]], tones: { ":2": r < 20 ? "warn" : "ok" } }] },
  ] };
}

// Data pipelines: LSH banding turns MinHash signatures into candidate pairs. P(candidate) = 1 - (1 - s^r)^b.
const SIMS = [0.2, 0.4, 0.6, 0.8, 0.9];
function lsh(v: Record<string, number>): Flow {
  const { b, r } = v, one = SIMS.map((s) => s ** r), many = SIMS.map((s) => 1 - (1 - s ** r) ** b), t = (1 / b) ** (1 / r);
  const bars = (ps: number[]) => ps.map((p, i) => ({ label: `s = ${SIMS[i]}`, value: p, tone: p >= 0.5 ? "ok" as const : undefined }));
  return { kind: "bars", title: `${b} bands of ${r} rows`, max: 1, format: r2, steps: [
    { note: `Split each signature into bands of ${r} rows. Two pages with Jaccard s match on one whole band with probability s^${r}. That alone misses most near copies.`, bars: bars(one) },
    { note: `With ${b} bands, they become candidates if any band matches: 1 - (1 - s^${r})^${b}. Only candidates are compared, not every pair.`, tone: "hot", bars: bars(many) },
    { note: `The curve turns steep near s = (1/${b})^(1/${r}) = ${r2(t)}. More rows raise that threshold; more bands lower it. Signatures need ${b * r} hashes.`, tone: "ok", bars: bars(many) },
  ] };
}

// SFT: padding against packing for 16 examples of mixed length.
const pct = (x: number) => `${Math.round(x * 100)}%`;
function packing(v: Record<string, number>): Flow {
  const { avg, L } = v, rng = seededRng("s5-sft-lengths"), BATCH = 4;
  const lens = Array.from({ length: 16 }, () => Math.max(8, Math.round(avg * (0.25 + 1.5 * rng()))));
  const real = lens.reduce((a, b) => a + b, 0), longest = Math.max(...lens);
  if (longest > L) throw new PlayError(`The longest example has ${longest} tokens, more than the ${L}-token context. Pick a longer context or shorter examples.`);
  const padL = lens.length * L;
  let padB = 0;
  for (let i = 0; i < lens.length; i += BATCH) padB += BATCH * Math.max(...lens.slice(i, i + BATCH));
  const bins: number[] = [];   // first-fit decreasing: each example goes in the first row with room
  for (const n of [...lens].sort((a, b) => b - a)) { const i = bins.findIndex((u) => u + n <= L); if (i < 0) bins.push(n); else bins[i] += n; }
  const packed = bins.length * L;
  const T = (cols: number) => ({ head: ["", "pad to L", "pad per batch", "pack"].slice(0, cols + 1),
    rows: [["token slots", padL, padB, packed].slice(0, cols + 1), ["wasted", pct(1 - real / padL), pct(1 - real / padB), pct(1 - real / packed)].slice(0, cols + 1)] });
  return { kind: "grid", title: `16 examples, average ${avg} tokens, context ${L}`, steps: [
    { note: `16 examples hold ${real} real tokens, from ${Math.min(...lens)} to ${longest} long. A GPU batch needs rows of equal length.`,
      tables: [{ head: ["examples", "real tokens", "longest"], rows: [[lens.length, real, longest]] }] },
    { note: `Padding every example to the full context L fills ${padL} slots. Padding each batch of ${BATCH} to its own longest example fills ${padB}. Pad tokens cost compute and teach nothing.`, tone: "warn",
      tables: [{ ...T(2), tones: { "1:1": "bad", "1:2": "warn" } }] },
    { note: `Packing puts several examples end to end in ${bins.length} rows of ${L}. A mask keeps each example from attending to its neighbours, so they stay independent.`, tone: "ok",
      tables: [{ ...T(3), tones: { "1:3": "ok" } }] },
  ] };
}

// Preference tuning: how beta and the two log-ratios set the DPO loss and the push.
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const sgn = (x: number) => (x > 0 ? `+${r2(x)}` : r2(x));
function dpoBeta(v: Record<string, number>): Flow {
  const { beta, dc, dr } = v, rc = beta * dc, rr = beta * dr, z = rc - rr, p = sig(z), loss = -Math.log(p), push = 1 - p;
  const T = { head: ["answer", "log-ratio", "reward"], rows: [["chosen", sgn(dc), sgn(rc)], ["rejected", sgn(dr), sgn(rr)]] };
  return { kind: "grid", title: `DPO at β = ${beta}`, steps: [
    { note: `DPO's hidden reward is β times the log-ratio, log π / π_ref: how much more the policy likes an answer than the reference does. Chosen: ${sgn(rc)}. Rejected: ${sgn(rr)}.`, tables: [T] },
    { note: `P(chosen wins) = σ(${sgn(rc)} - (${sgn(rr)})) = ${r2(p)}. Loss = -ln ${r2(p)} = ${r2(loss)}. ${p < 0.5 ? "The pair is ranked the wrong way round, so the loss is high." : "The pair is ranked the right way round."}`, tone: p < 0.5 ? "bad" : "ok",
      tables: [T, { head: ["P(chosen)", "loss"], rows: [[r2(p), r2(loss)]], tones: { "0": p < 0.5 ? "bad" : "ok" } }] },
    { note: `Push on this pair: σ(${r2(-z)}) = ${r2(push)}. A bigger β makes the same log-ratio count for more, so the loss is met with a smaller move: the policy stays nearer the reference.`, tone: "hot",
      tables: [T, { head: ["P(chosen)", "loss", "push"], rows: [[r2(p), r2(loss), r2(push)]], tones: { ":2": "hot" } }] },
  ] };
}

// RL with verifiable rewards: GRPO advantages for a group of G answers, k of them right.
export const grpoAdv = (G: number, k: number) => {
  const mean = k / G, std = Math.sqrt(mean * (1 - mean));
  return { mean, std, right: std ? (1 - mean) / std : 0, wrong: std ? -mean / std : 0 };
};
function grpoGroup(v: Record<string, number>): Flow {
  const { G, k } = v;
  if (k > G) throw new PlayError(`Only ${G} answers were sampled, so at most ${G} can be right.`);
  const a = grpoAdv(G, k), none = a.std === 0;
  const rows = (adv: boolean) => [["right", k, adv ? sgn(a.right) : 1], ["wrong", G - k, adv ? sgn(a.wrong) : 0]];
  return { kind: "grid", title: `${k} of ${G} answers right`, steps: [
    { note: `Sample ${G} answers to one prompt. A program checks each: reward 1 if right, 0 if wrong. The group mean is ${r2(a.mean)}.`,
      tables: [{ head: ["answers", "count", "reward"], rows: rows(false), tones: { "0": "ok", "1": "bad" } }] },
    { note: none ? `Every answer got the same reward, so the spread is 0 and every advantage is 0. This prompt teaches nothing: it is too ${k ? "easy" : "hard"} for the model right now.`
      : `Advantage = (reward - mean) / spread, with spread ${r2(a.std)}. Right answers get ${sgn(a.right)}, wrong ones ${sgn(a.wrong)}.`,
      tone: none ? "bad" : "hot", tables: [{ head: ["answers", "count", "advantage"], rows: rows(true), tones: none ? { ":2": "bad" } : { "0:2": "ok", "1:2": "bad" } }] },
    { note: none ? "Training on many such prompts wastes compute, so pipelines often skip prompts the model always or never solves."
      : `Pushes up and down cancel: ${k} × ${sgn(a.right)} + ${G - k} × ${sgn(a.wrong)} = 0. ${k === 1 ? "A rare right answer gets a big push." : G - k === 1 ? "A rare wrong answer gets a big push down." : "The group mean is the baseline; no value model is needed."}`,
      tone: none ? "warn" : "ok", tables: [{ head: ["answers", "count", "advantage"], rows: rows(true) }] },
  ] };
}

// LoRA and QLoRA: training memory before activations. A rough shape: 32 layers of about 12 d² weights each,
// LoRA on the four attention projections. Bytes per trained parameter: bf16 weight 2 + grad 2 + Adam 8 + fp32 master 4 = 16.
export function ftMemory(Nb: number, r: number) {
  const N = Nb * 1e9, d = Math.max(128, Math.round(Math.sqrt(N / (12 * 32)) / 128) * 128), T = 32 * 4 * 2 * d * r;
  return { d, T, full: (16 * N) / 1e9, lora: (2 * N + 16 * T) / 1e9, qlora: (0.5 * N + 16 * T) / 1e9 };
}
const gb = (v: number) => (v < 10 ? `${v.toFixed(1)} GB` : `${Math.round(v)} GB`);
const fits = (v: number) => (v <= 24 ? "fits a 24 GB GPU" : v <= 80 ? "needs an 80 GB GPU" : `needs about ${Math.ceil(v / 80)} GPUs of 80 GB`);
function memory(v: Record<string, number>): Flow {
  const { N, r } = v, m = ftMemory(N, r);
  const bars = (on: number) => [["full", m.full], ["LoRA", m.lora], ["QLoRA", m.qlora]].map(([label, value], i) => ({ label: label as string, value: value as number, tone: i === on ? (i ? "ok" as const : "warn" as const) : undefined }));
  return { kind: "bars", title: `Fine-tuning a ${N}B model, LoRA rank ${r}`, format: gb, steps: [
    { note: `Full fine-tuning keeps a bf16 weight, a gradient, two Adam moments and an fp32 copy for every parameter: 16 bytes × ${N}B = ${gb(m.full)}. It ${fits(m.full)}.`, tone: "warn", bars: bars(0) },
    { note: `LoRA freezes the base (2 bytes each) and trains ${big(m.T)} adapter numbers at 16 bytes: ${gb(m.lora)}. It ${fits(m.lora)}.`, tone: "hot", bars: bars(1) },
    { note: `QLoRA stores the frozen base in 4 bits, half a byte each: ${gb(m.qlora)}. It ${fits(m.qlora)}. Activations add more on top.`, tone: "ok", bars: bars(2) },
  ] };
}

// Distillation: what temperature does to a teacher's distribution.
export const KD_CLASSES = ["cat", "dog", "fox", "car", "cup"], KD_LOGITS = [6, 3, 2, 0, -1];
const softT = (z: number[], T: number) => { const e = z.map((x) => Math.exp(x / T)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
const bits = (p: number[]) => -p.reduce((s, x) => s + (x > 0 ? x * Math.log2(x) : 0), 0);
function temperature(v: Record<string, number>): Flow {
  const { T } = v, p1 = softT(KD_LOGITS, 1), pT = softT(KD_LOGITS, T);
  const bars = (p: number[]) => p.map((x, i) => ({ label: KD_CLASSES[i], value: x, tone: i === 0 ? "hot" as const : undefined }));
  return { kind: "bars", title: `Teacher output at T = ${T}`, max: 1, format: r2, steps: [
    { note: `At T = 1 the teacher puts ${r2(p1[0])} on cat. The other classes share ${r2(1 - p1[0])}, too little for a student to learn much from. Spread: ${r2(bits(p1))} bits.`, bars: bars(p1) },
    { note: `Divide the logits by T = ${T}: cat now gets ${r2(pT[0])} and the rest ${r2(1 - pT[0])}. Spread: ${r2(bits(pT))} bits. ${T > 1 ? "The ranking dog > fox > car > cup is now easy to see." : T < 1 ? "T below 1 sharpens it instead." : "Same as before."}`, tone: T > 1 ? "ok" : "warn", bars: bars(pT) },
    { note: `Very high T flattens everything toward ${r2(1 / KD_CLASSES.length)} each, and the ranking signal fades again. Distillation usually picks a moderate T, from about 2 to 5.`, bars: bars(pT) },
  ] };
}

// pretraining-scaling: memory per GPU for mixed-precision Adam (ZeRO paper, arXiv 1910.02054: 2Ψ fp16 weights, 2Ψ fp16
// gradients, 12Ψ for the fp32 copy, momentum and variance). ZeRO stage 1 splits the optimizer states over the GPUs,
// stage 2 also the gradients, stage 3 also the weights. Activations are left out.
export function trainMem(params: number, gpus: number, stage: number) {
  const w = 2 * params, g = 2 * params, o = 12 * params;
  return { w: stage >= 3 ? w / gpus : w, g: stage >= 2 ? g / gpus : g, o: stage >= 1 ? o / gpus : o };
}
function trainMemory(v: Record<string, number>): Flow {
  const { b, n, z } = v, P = b * 1e9, GB = 1e9, CARD = 80;
  const base = trainMem(P, n, 0), m = trainMem(P, n, z);
  const tot = (x: { w: number; g: number; o: number }) => (x.w + x.g + x.o) / GB;
  const bars = (x: { w: number; g: number; o: number }) => [
    { label: "fp16 weights", value: x.w / GB }, { label: "fp16 gradients", value: x.g / GB },
    { label: "fp32 copy + Adam m, v", value: x.o / GB, tone: "warn" as const },
    { label: "total per GPU", value: tot(x), tone: tot(x) <= CARD ? "ok" as const : "bad" as const },
    { label: "one 80 GB GPU", value: CARD },
  ];
  const fits = tot(m) <= CARD;
  return { kind: "bars", title: `${b}B parameters on ${n} GPU${n > 1 ? "s" : ""}, ZeRO stage ${z}`, max: Math.max(tot(base), CARD), format: (x) => `${x.toFixed(x < 10 ? 1 : 0)} GB`, steps: [
    { note: `Plain data parallel: every GPU holds everything. 2 bytes of weights, 2 of gradients and 12 of optimizer state per parameter make 16 bytes: ${tot(base).toFixed(0)} GB before a single activation. Try: raise the ZeRO stage.`,
      tone: tot(base) <= CARD ? "ok" : "bad", bars: bars(base) },
    { note: z === 0 ? `Stage 0 changes nothing: the ${n} GPUs only split the batch. ${fits ? "It fits." : "It does not fit on one card."}`
      : `ZeRO stage ${z} splits the ${["", "optimizer state", "optimizer state and gradients", "optimizer state, gradients and weights"][z]} across the ${n} GPUs: ${tot(m).toFixed(1)} GB each. ${fits ? "Now it fits, with room left for activations." : "Still too big: add GPUs, a higher stage, or split the model itself."}`,
      tone: fits ? "ok" : "bad", bars: bars(m) },
  ] };
}

export const PLAY_5: Record<string, PlayFlow> = {
  "s5-train-memory": {
    title: "Fit training on your GPUs",
    knobs: [
      { key: "b", label: "Parameters (billions)", min: 1, max: 70, step: 1, value: 7 },
      { key: "n", label: "GPUs", min: 1, max: 64, step: 1, value: 8 },
      { key: "z", label: "ZeRO stage", min: 0, max: 3, step: 1, value: 0 },
    ],
    make: trainMemory,
  },
  "s5-temperature": {
    title: "Softening the teacher",
    knobs: [{ key: "T", label: "Temperature T", min: 0.5, max: 8, step: 0.5, value: 2 }],
    make: temperature,
  },
  "s5-ft-memory": {
    title: "Will it fit on my GPU?",
    knobs: [
      { key: "N", label: "Model size, billions", min: 1, max: 70, step: 1, value: 8 },
      { key: "r", label: "LoRA rank r", min: 4, max: 128, step: 4, value: 16 },
    ],
    make: memory,
  },
  "s5-grpo-group": {
    title: "GRPO advantages for one group",
    knobs: [
      { key: "G", label: "Group size G", min: 2, max: 16, step: 1, value: 8 },
      { key: "k", label: "Right answers k", min: 0, max: 16, step: 1, value: 3 },
    ],
    make: grpoGroup,
  },
  "s5-dpo-beta": {
    title: "What β does in DPO",
    knobs: [
      { key: "beta", label: "β", min: 0.05, max: 1, step: 0.05, value: 0.1 },
      { key: "dc", label: "Chosen log-ratio", min: -5, max: 5, step: 0.5, value: 2 },
      { key: "dr", label: "Rejected log-ratio", min: -5, max: 5, step: 0.5, value: -2 },
    ],
    make: dpoBeta,
  },
  "s5-packing": {
    title: "Padding or packing SFT examples",
    knobs: [
      { key: "avg", label: "Average example length", min: 32, max: 1024, step: 32, value: 256 },
      { key: "L", label: "Context length L", min: 512, max: 8192, step: 512, value: 2048 },
    ],
    make: packing,
  },
  "s5-lsh": {
    title: "Tuning near-duplicate search",
    knobs: [
      { key: "b", label: "Bands b", min: 1, max: 30, step: 1, value: 20 },
      { key: "r", label: "Rows per band r", min: 1, max: 10, step: 1, value: 5 },
    ],
    make: lsh,
  },
  "s5-compute-budget": {
    title: "What can a compute budget train?",
    knobs: [
      { key: "gpus", label: "GPUs", min: 8, max: 2048, step: 8, value: 256 },
      { key: "days", label: "Days", min: 1, max: 90, step: 1, value: 30 },
      { key: "r", label: "Tokens per parameter", min: 5, max: 400, step: 5, value: 20 },
    ],
    make: budget,
  },
};
