// Stage 10 (Frontier): the calculations shared by the flows, walk-throughs, figures and module text. Client-safe: no module text here.
// Every shape below is an example chosen for round numbers, not the spec of any product.

export const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
export const r1 = (x: number) => x.toFixed(1);
export const r2 = (x: number) => x.toFixed(2);
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
export const comb = (n: number, k: number) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c; };

// ---------- reasoning: spending compute at answer time ----------
// Majority vote over n independent samples (n odd), each right with chance p, wrong ones assumed to agree (the worst case).
export const majority = (p: number, n: number) => { let s = 0; for (let k = Math.floor(n / 2) + 1; k <= n; k++) s += comb(n, k) * p ** k * (1 - p) ** (n - k); return s; };
// Best-of-n with a perfect checker: right if any sample is right.
export const anyRight = (p: number, n: number) => 1 - (1 - p) ** n;
// Thinking costs tokens and time: tokens at a decode rate, and price per million output tokens.
export const thinkCost = (tokens: number, tokPerS: number, perM: number) => ({ s: tokens / tokPerS, usd: (tokens * perM) / 1e6 });
export const THINK = { rate: 60, perM: 10, answer: 300, budgets: [0, 2000, 8000, 32000] };

// ---------- mixture of experts ----------
// An example decoder: SwiGLU FFN (3 matrices), grouped-query attention, untied input and output embeddings.
export const MOE = { d: 4096, ff: 14336, layers: 32, heads: 32, kvHeads: 8, headDim: 128, vocab: 32000, experts: 8, topK: 2 };
export type MoeShape = typeof MOE;
export const expertParams = (m: MoeShape = MOE) => 3 * m.d * m.ff;
export const attnParams = (m: MoeShape = MOE) => 2 * m.d * m.heads * m.headDim + 2 * m.d * m.kvHeads * m.headDim;
export const routerParams = (m: MoeShape = MOE) => m.d * m.experts;
export function moeCount(m: MoeShape = MOE) {
  const shared = m.layers * (attnParams(m) + routerParams(m)) + 2 * m.vocab * m.d;
  const total = shared + m.layers * m.experts * expertParams(m), active = shared + m.layers * m.topK * expertParams(m);
  return { total, active, shared, ratio: active / total };
}
export const B = (x: number) => `${r1(x / 1e9)}B`;
// Softmax router over expert scores, then keep the top k and renormalise.
export const softmax = (s: number[]) => { const mx = Math.max(...s), e = s.map((x) => Math.exp(x - mx)), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };
export function route(scores: number[], k: number) {
  const p = softmax(scores), top = p.map((x, i) => [x, i] as const).sort((a, b) => b[0] - a[0]).slice(0, k);
  const z = top.reduce((a, [x]) => a + x, 0);
  return { p, top: top.map(([x, i]) => ({ e: i, w: x / z })) };
}
// Router scores for a few example tokens (fixed, so the figure and the flow agree).
export const ROUTE_EX: [string, number[]][] = [
  ["def", [2.1, 0.3, -0.5, 1.2, 0.1, -1.0, 0.4, 0.0]],
  ["the", [0.2, 1.9, 0.4, -0.3, 1.5, 0.0, -0.8, 0.1]],
  ["mol", [-0.4, 0.1, 0.3, 0.2, -0.2, 2.4, 1.6, -0.6]],
  ["=", [1.8, -0.2, 0.0, 1.7, 0.3, -0.5, 0.2, -1.1]],
];
// Tokens per expert in a batch; capacity = factor × fair share, overflow is dropped (or sent on by the residual).
export const capacity = (tokens: number, experts: number, k: number, factor: number) => Math.ceil((factor * tokens * k) / experts);
export const dropped = (loads: number[], cap: number) => loads.reduce((a, l) => a + Math.max(0, l - cap), 0);

// ---------- state space models ----------
// Mixing cost per layer for one sequence of n tokens. Causal attention: token i scores i keys and mixes i values, 2 FLOPs per multiply-add.
export const attnMixFlops = (n: number, d: number) => 4 * d * (n * (n + 1)) / 2;
// A diagonal SSM keeps a state of d × N numbers; each token decays it, adds its input, and reads it out: about 6 FLOPs per state entry.
export const ssmMixFlops = (n: number, d: number, N: number) => 6 * d * N * n;
// Memory carried while decoding, per layer, in numbers: attention keeps a key and a value per past token; an SSM keeps its fixed state.
export const kvNumbers = (n: number, d: number) => 2 * d * n;
export const ssmNumbers = (d: number, N: number) => d * N;
export const SSM = { d: 2048, N: 16 };
// A scalar SSM step, h = a h + b x, y = c h, run one token at a time.
export function scan(xs: number[], a: number, b: number, c: number) {
  let h = 0;
  return xs.map((x) => { h = a * h + b * x; return { h, y: c * h }; });
}
// Hybrid: one attention layer in every `every` layers, the rest SSM.
export const hybridKv = (n: number, d: number, layers: number, every: number) => Math.floor(layers / every) * kvNumbers(n, d);

// ---------- long context ----------
export const LC = { layers: 32, kvHeads: 8, headDim: 128, bytes: 2, weightsGB: 16 };
export const kvBytesPerToken = (m = LC) => 2 * m.layers * m.kvHeads * m.headDim * m.bytes;
export const kvGB = (tokens: number, m = LC) => (kvBytesPerToken(m) * tokens) / 1e9;
export const CTX_STEPS = [8192, 32768, 131072, 1048576];
export const kTok = (n: number) => (n >= 1048576 ? `${n / 1048576}M` : `${n / 1024}K`);
// RoPE: the angle of dimension pair i at position pos, base 10000, head size d. Interpolation divides positions by the stretch factor.
export const ropeAngle = (pos: number, i: number, d = 128, base = 10000, stretch = 1) => (pos / stretch) * base ** (-(2 * i) / d);
export const turns = (rad: number) => rad / (2 * Math.PI);
// Ring attention: split n tokens over g devices; each holds n/g keys and passes blocks around the ring, g - 1 hops.
export const ringShare = (n: number, g: number) => ({ perDevice: n / g, hops: g - 1 });

// ---------- vision ----------
export const patchTokens = (w: number, h: number, patch: number, merge = 1) => Math.floor(w / (patch * merge)) * Math.floor(h / (patch * merge));
export const tiles = (w: number, h: number, tile: number) => Math.ceil(w / tile) * Math.ceil(h / tile);
// Tile the image, plus one downscaled overview tile.
export const tiledTokens = (w: number, h: number, tile: number, patch: number) => (tiles(w, h, tile) + 1) * patchTokens(tile, tile, patch);
// CLIP-style score: cosine of an image vector with each caption vector.
export const cos = (a: number[], b: number[]) => { const dot = a.reduce((s, x, i) => s + x * b[i], 0), na = Math.hypot(...a), nb = Math.hypot(...b); return dot / (na * nb); };

// ---------- voice ----------
export const AUDIO = { rate: 16000, hopMs: 10, winMs: 25 };
export const melFrames = (seconds: number, hopMs = AUDIO.hopMs) => Math.floor((seconds * 1000) / hopMs);
// A cascade's time to first audio: end-of-turn wait, then each stage's time to its first output, plus network.
export const VOICE = { endpoint: 300, stt: 150, llm: 300, tts: 100, net: 50 };
export const cascadeMs = (v = VOICE) => v.endpoint + v.stt + v.llm + v.tts + v.net;
// Waiting for the full reply instead of streaming: the LLM must write all its tokens first.
export const fullReplyMs = (tokens: number, tokPerS: number, v = VOICE) => cascadeMs(v) + (tokens / tokPerS) * 1000;

// ---------- diffusion and flow matching ----------
export const T = 1000;
export const linearBetas = (t = T, lo = 1e-4, hi = 0.02) => Array.from({ length: t }, (_, i) => lo + ((hi - lo) * i) / (t - 1));
export function alphaBars(betas: number[]) { let a = 1; return betas.map((b) => (a *= 1 - b)); }
// Cosine schedule: alpha-bar follows a squared cosine, offset s so the first steps are not too small.
export const cosineBar = (t: number, total = T, s = 0.008) => { const f = (x: number) => Math.cos(((x / total + s) / (1 + s)) * (Math.PI / 2)) ** 2; return f(t) / f(0); };
export const LINEAR_BAR = alphaBars(linearBetas());
export const linearBar = (t: number) => (t <= 0 ? 1 : LINEAR_BAR[Math.min(T, t) - 1]);
// Share of the signal left at step t: sqrt(alpha-bar). Signal to noise ratio: abar / (1 - abar).
export const snr = (ab: number) => ab / (1 - ab);
// Classifier-free guidance: push past the conditional prediction.
export const cfg = (u: number, c: number, w: number) => u + w * (c - u);
// Euler steps along a velocity field from t = 1 (noise) to t = 0 (data). The flow-matching path is straight: v = noise - data.
export function eulerStraight(x1: number, data: number, steps: number) {
  let x = x1;
  for (let i = 0; i < steps; i++) x -= (1 / steps) * (x1 - data);   // the velocity is the same at every point of a straight path
  return x;
}
// A curved path for contrast: x(t) = data + (x1 - data) t^2. Its velocity 2(x1 - data)t changes along the way, so big steps overshoot or undershoot.
export function eulerCurved(x1: number, data: number, steps: number) {
  let x = x1, t = 1;
  for (let i = 0; i < steps; i++) { const tt = t; x -= (1 / steps) * 2 * (x1 - data) * tt; t -= 1 / steps; }
  return x;
}

// ---------- video ----------
// A latent video: the autoencoder shrinks space by `space` per side and time by `time`; the transformer then cuts 2 × 2 patches.
export const VID = { space: 8, time: 4, patch: 2 };
export function videoTokens(seconds: number, fps: number, w: number, h: number, v = VID) {
  const frames = Math.round(seconds * fps), lat = Math.ceil(frames / v.time);
  const perFrame = Math.floor(w / (v.space * v.patch)) * Math.floor(h / (v.space * v.patch));
  return { frames, lat, perFrame, tokens: lat * perFrame };
}
// A world model rolled forward on its own output: if each frame stays faithful with chance q, all n do with chance q^n.
export const rollout = (q: number, n: number) => q ** n;

// ---------- coding agents ----------
// A task of k steps, each done right with chance p. Tests catch a failed attempt; the agent may retry r times.
export const chain = (p: number, k: number) => p ** k;
export const withRetries = (p: number, k: number, r: number) => 1 - (1 - chain(p, k)) ** r;
// The unbiased pass@k estimate from n samples of which c pass.
export const passAtK = (n: number, c: number, k: number) => (n - c < k ? 1 : 1 - comb(n - c, k) / comb(n, k));
// The clip used by the video flow and figure.
export const CLIP_FIG = { seconds: 5, fps: 24, w: 1280, h: 720 };
