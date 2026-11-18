// Stage 9 (Production): the small calculations shared by the flows, the walk-throughs, the figures and the module text. Client-safe: no module text here.

export const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
export const r1 = (x: number) => x.toFixed(1);
export const r2 = (x: number) => x.toFixed(2);
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;

// An example GPU and an example 8B model shape, used across the stage. Round illustrative numbers, not a product spec.
export const GPU = { mem: 80, bw: 3.35, tflops: 990 };   // GB, TB/s, dense bf16 TFLOP/s
export const MODEL = { params: 8, layers: 32, kvHeads: 8, headDim: 128 };   // billions of parameters
export const BF16 = 2;

// Weights in GB: billions of parameters times bytes per parameter.
export const weightsGB = (paramsB: number, bytes: number) => paramsB * bytes;
// KV cache per token: a key and a value, per layer, per KV head, each headDim numbers.
export const kvPerToken = (layers = MODEL.layers, kvHeads = MODEL.kvHeads, headDim = MODEL.headDim, bytes = BF16) => 2 * layers * kvHeads * headDim * bytes;
export const kvGB = (tokens: number, users: number, perToken = kvPerToken()) => (perToken * tokens * users) / 1e9;

// Decode, one token per sequence per step: every weight is read once per step, plus each sequence's KV cache.
// Step time is the larger of the time to move the bytes and the time to do the FLOPs (2 per parameter per token).
export function decodeStep(batch: number, ctx: number, bytesPerWeight = BF16, gpu = GPU, model = MODEL) {
  const bytes = model.params * 1e9 * bytesPerWeight + batch * ctx * kvPerToken(model.layers, model.kvHeads, model.headDim);
  const memS = bytes / (gpu.bw * 1e12), compS = (2 * model.params * 1e9 * batch) / (gpu.tflops * 1e12);
  const stepS = Math.max(memS, compS);
  return { memS, compS, stepS, bound: memS >= compS ? "memory" : "compute", perUser: 1 / stepS, total: batch / stepS };
}
// Upper bound for one sequence with a short context: bandwidth divided by the bytes of weights.
export const decodeCeiling = (weightsGb: number, bw = GPU.bw) => (bw * 1000) / weightsGb;
// Arithmetic intensity of decode: 2 FLOPs per weight per sequence, divided by the bytes per weight.
export const intensity = (batch: number, bytesPerWeight = BF16) => (2 * batch) / bytesPerWeight;
export const ridge = (gpu = GPU) => gpu.tflops / gpu.bw;
// Prefill of p prompt tokens is one big pass: 2 FLOPs per parameter per token.
export const prefillS = (tokens: number, gpu = GPU, model = MODEL) => Math.max((2 * model.params * 1e9 * tokens) / (gpu.tflops * 1e12), (model.params * 1e9 * BF16) / (gpu.bw * 1e12));
export const latency = (ttft: number, outTokens: number, tpot: number) => ttft + outTokens * tpot;

// KV paging: reserve the maximum length per request, or allocate fixed blocks on demand.
export const reserved = (lens: number[], max: number) => lens.length * max;
export const pagedSlots = (lens: number[], block: number) => lens.reduce((a, l) => a + Math.ceil(l / block) * block, 0);
export const used = (lens: number[]) => lens.reduce((a, b) => a + b, 0);
export const blocksFor = (len: number, block: number) => Math.ceil(len / block);
// The three requests drawn in the KV blocks figure.
export const KV_EX = { lens: [37, 90, 12], max: 128, block: 16 };
// A tiny block allocator with reference counts, as a paged KV cache keeps it.
export class BlockPool {
  free: number[]; ref = new Map<number, number>();
  constructor(n: number, order: number[]) { this.free = order.slice(0, n); }
  take() { const b = this.free.shift(); if (b === undefined) throw new Error("pool empty"); this.ref.set(b, 1); return b; }
  share(b: number) { this.ref.set(b, (this.ref.get(b) ?? 0) + 1); return b; }
  drop(b: number) { const r = (this.ref.get(b) ?? 0) - 1; if (r <= 0) { this.ref.delete(b); this.free.push(b); } else this.ref.set(b, r); }
}

// Batching: static batches wait for their longest member; continuous batching refills a slot as soon as it frees.
export function staticSteps(lens: number[], slots: number) {
  let t = 0;
  for (let i = 0; i < lens.length; i += slots) t += Math.max(...lens.slice(i, i + slots));
  return t;
}
// Returns [start, end] per request (in steps) under continuous batching, in arrival order.
export function continuous(lens: number[], slots: number): [number, number][] {
  const free = Array(slots).fill(0) as number[];
  return lens.map((l) => { const i = free.indexOf(Math.min(...free)), s = free[i]; free[i] = s + l; return [s, s + l]; });
}
export function staticSpans(lens: number[], slots: number): [number, number][] {
  const out: [number, number][] = []; let t = 0;
  for (let i = 0; i < lens.length; i += slots) { const b = lens.slice(i, i + slots); b.forEach((l) => out.push([t, t + l])); t += Math.max(...b); }
  return out;
}
export const BATCH_LENS = [30, 420, 60, 120, 45, 200, 90, 30];
export const BATCH_SLOTS = 4;

// Quantisation: symmetric round to nearest with a scale s = max|x| / qmax.
export const qmax = (bits: number) => 2 ** (bits - 1) - 1;
export function quantise(xs: number[], bits: number, group = xs.length) {
  const out: { q: number; back: number }[] = [];
  for (let i = 0; i < xs.length; i += group) {
    const g = xs.slice(i, i + group), s = Math.max(...g.map(Math.abs)) / qmax(bits) || 1;
    for (const x of g) { const q = Math.round(x / s); out.push({ q, back: q * s }); }
  }
  return out;
}
// Effective bits per weight when every group of `group` weights also stores one 16-bit scale.
export const effBits = (bits: number, group: number) => bits + 16 / group;
export const quantGB = (paramsB: number, bits: number, group = Infinity) => (paramsB * effBits(bits, group)) / 8;

// Speculative decoding: acceptance rate a, draft length k, draft cost c (one draft step against one target step).
export const specTokens = (a: number, k: number) => (a === 1 ? k + 1 : (1 - a ** (k + 1)) / (1 - a));
export const specCost = (k: number, c: number) => k * c + 1;
export const specSpeedup = (a: number, k: number, c: number) => specTokens(a, k) / specCost(k, c);
export const bestK = (a: number, c: number, maxK = 12) => Array.from({ length: maxK }, (_, i) => i + 1).reduce((b, k) => (specSpeedup(a, k, c) > specSpeedup(a, b, c) ? k : b), 1);

// Evals: standard error of an accuracy, the 95% interval of a difference, and the items needed to see it.
export const se = (p: number, n: number) => Math.sqrt((p * (1 - p)) / n);
export const diffCI = (p1: number, p2: number, n: number) => { const s = Math.sqrt((p1 * (1 - p1)) / n + (p2 * (1 - p2)) / n), d = p2 - p1; return [d - 1.96 * s, d + 1.96 * s] as const; };
export const nNeeded = (p1: number, p2: number) => Math.ceil((1.96 ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / (p2 - p1) ** 2);
// Cohen's kappa from a 2 x 2 table: both good, judge good only, human good only, both bad.
export function kappa(both: number, jOnly: number, hOnly: number, none: number) {
  const n = both + jOnly + hOnly + none, po = (both + none) / n, pj = (both + jOnly) / n, ph = (both + hOnly) / n;
  const pe = pj * ph + (1 - pj) * (1 - ph);
  return { po, pe, k: (po - pe) / (1 - pe) };
}

// Observability: nearest-rank percentile.
export const percentile = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)]; };
export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
// A day of request latencies in ms: most fast, a slow tail.
export const LAT_MS = [820, 760, 910, 700, 880, 790, 850, 1020, 740, 960, 810, 870, 930, 780, 3900, 720, 890, 840, 4600, 800];
// Bad requests served before a rollback: traffic per minute, share exposed, minutes to detect, bad rate of the change.
export const badServed = (perMin: number, share: number, minutes: number, badRate: number) => perMin * share * minutes * badRate;
// A canary is judged on its own sample: how many errors do we expect in `n` canary requests at a given error rate?
export const expected = (n: number, rate: number) => n * rate;

// Security: an attack that works with chance p per try, tried n times, succeeds at least once with 1 - (1 - p)^n.
export const atLeastOnce = (p: number, n: number) => 1 - (1 - p) ** n;
export type Caps = { secrets: boolean; untrusted: boolean; outbound: boolean };
export const trifecta = (c: Caps) => c.secrets && c.untrusted && c.outbound;
