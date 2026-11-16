// Gen AI slider walk-throughs, placed in modules by a `play` block; stage 4's registry, spread by stages/play.ts into PLAY_FLOWS.
import type { Flow, GridTable } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { seededRng } from "../rng.ts";
import { bpeTrain, CORPUS, corpusTokens, dot, rope, sinusoid } from "./s4.flows.ts";

const WORDS = ["the", "cat", "sat", "on", "mat"];

// One unit-variance number per call (Box-Muller), so a dot product of d of them has spread sqrt(d).
const gauss = (rng: () => number) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
// The first d numbers of a fixed stream: a token's vector at d = 64 starts with its vector at d = 32.
const vec = (seed: string, d: number) => { const r = seededRng(seed); return Array.from({ length: d }, () => gauss(r)); };
const softmax = (s: number[]) => { const m = Math.max(...s), e = s.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };
const r2 = (x: number) => x.toFixed(2);

function attnScale(v: Record<string, number>): Flow {
  const { d, t } = v, q = vec("query:sat", d);
  const raw = WORDS.map((w) => vec("key:" + w, d).reduce((s, k, i) => s + k * q[i], 0));
  const steps = [
    { scores: raw, say: `No scaling: scores run from ${r2(Math.min(...raw))} to ${r2(Math.max(...raw))}. Each is a sum of ${d} products, so for random vectors they grow like sqrt(${d}) = ${r2(Math.sqrt(d))}.` },
    { scores: raw.map((x) => x / Math.sqrt(d)), say: `Divide by sqrt(${d}) = ${r2(Math.sqrt(d))}: scores now run from ${r2(Math.min(...raw) / Math.sqrt(d))} to ${r2(Math.max(...raw) / Math.sqrt(d))}, the same size at any d.` },
    { scores: raw.map((x) => x / (Math.sqrt(d) * t)), say: "Temperature here is an extra divisor for illustration, not the sampling temperature. " + (t === 1 ? "At 1 it changes nothing." : t > 1 ? `At ${t} it divides again, so the weights flatten.` : `At ${t} it multiplies by ${r2(1 / t)}, so the weights sharpen.`) },
  ].map(({ scores, say }) => {
    const w = softmax(scores);
    if (w.some(Number.isNaN)) throw new PlayError("These settings give an undefined weight.");
    const top = w.indexOf(Math.max(...w));
    return { note: `${say} Largest weight: ${r2(w[top])} on "${WORDS[top]}".`, tone: w[top] > 0.9 ? "bad" as const : "ok" as const,
      bars: w.map((x, i) => ({ label: WORDS[i], value: x, tone: i === top ? "hot" as const : undefined })) };
  });
  return { kind: "bars", title: `Weights for "sat" at d = ${d}, temperature ${t}`, max: 1, format: r2, steps };
}

/* ---------- tokenisation: more merges, fewer tokens ---------- */
const SHOWN = ["lower", "lowest", "slow", "newer", "newest"];
function bpeMerges(v: Record<string, number>): Flow {
  const frames = bpeTrain(CORPUS, v.m), f = frames[frames.length - 1], base = frames[0], n = frames.length - 1;
  const count = (fr: typeof f) => SHOWN.map((w) => fr.words.find((x) => x.w === w)!.toks.length);
  const vocab = new Set(CORPUS.flatMap(([w]) => [...w, "_"])).size;
  const bars = (c: number[], tone?: "ok") => SHOWN.map((w, i) => ({ label: w, value: c[i], tone }));
  return { kind: "bars", title: `Tokens per word after ${n} merges`, max: 7, format: (x) => String(Math.round(x)), steps: [
    { note: `Characters only: ${vocab} symbols in the vocabulary, ${corpusTokens(base)} tokens for the whole corpus. Each word costs its length plus one end marker.`, bars: bars(count(base)) },
    { note: n === 0 ? "No merges yet, so nothing changes. Raise the slider." : `After ${n} merges the vocabulary has ${vocab + n} symbols and the corpus needs ${corpusTokens(f)} tokens. A bigger vocabulary means shorter sequences.`, tone: "ok", bars: bars(count(f), "ok") },
  ] };
}

/* ---------- positions: only distance matters with RoPE ---------- */
const STARTS = [0, 7, 50, 300];
function ropeShift(v: Record<string, number>): Flow {
  const { gap, d } = v, q = vec("rope:q", d), k = vec("rope:k", d);
  const plain = dot(q, k), abs = STARTS.map((n) => dot(q.map((x, i) => x + sinusoid(n + gap, d)[i]), k.map((x, i) => x + sinusoid(n, d)[i])));
  const rot = STARTS.map((n) => dot(rope(q, n + gap), rope(k, n)));
  const T = (s: number[], tone: "ok" | "warn" | "hot"): GridTable => ({ head: ["q at", "k at", "score"], rows: STARTS.map((n, i) => [n + gap, n, r2(s[i])]), tones: { ":2": tone } });
  const spread = Math.max(...abs) - Math.min(...abs);
  return { kind: "grid", title: `One query and one key, ${gap} apart, d = ${d}`, steps: [
    { note: `No position at all: the score is ${r2(plain)} wherever the pair sits, and at any distance too. Attention alone cannot see order.`, tone: "warn", tables: [T(STARTS.map(() => plain), "warn")] },
    { note: `Add sinusoidal vectors to q and k: the score now changes with where the pair sits, by up to ${r2(spread)}, though the gap is the same.`, tone: "hot", tables: [T(abs, "hot")] },
    { note: `RoPE: rotate q by its position and k by its own. The score is ${r2(rot[0])} at every start: it depends only on the gap, ${gap}. Move the gap slider and it changes.`, tone: "ok", tables: [T(rot, "ok")] },
  ] };
}

/* ---------- multi-head: grouped-query attention shrinks the KV cache ---------- */
export const KV_SHAPE = { layers: 32, headDim: 128, bytes: 2 };
export const kvGB = (heads: number, tokens: number) => (2 * KV_SHAPE.layers * heads * KV_SHAPE.headDim * tokens * KV_SHAPE.bytes) / 1e9;
function gqaCache(v: Record<string, number>): Flow {
  const { kv, g, ctx } = v, H = kv * g, tokens = ctx * 1024;
  const mha = kvGB(H, tokens), yours = kvGB(kv, tokens), mqa = kvGB(1, tokens);
  const bars = (show: number) => [{ label: `MHA, ${H}`, value: mha, tone: "warn" as const }, { label: `GQA, ${kv}`, value: show > 1 ? yours : 0, tone: "hot" as const }, { label: "MQA, 1", value: show > 2 ? mqa : 0, tone: "ok" as const }];
  return { kind: "bars", title: `KV cache, one ${tokens.toLocaleString("en-US")} token sequence`, format: (x) => (x ? `${x.toFixed(2)} GB` : ""), steps: [
    { note: `${H} query heads, each with its own K and V head: ${mha.toFixed(2)} GB. Example shape: ${KV_SHAPE.layers} layers, head size ${KV_SHAPE.headDim}, ${KV_SHAPE.bytes} bytes a number.`, tone: "warn", bars: bars(1) },
    { note: g === 1 ? "One query head per K, V head is plain multi-head attention: no saving." : `Share each K, V head among ${g} query heads: ${kv} K, V heads, ${g} times smaller at ${yours.toFixed(2)} GB. Every query head keeps its own Q.`, tone: "hot", bars: bars(2) },
    { note: `One K, V head for all (multi-query): ${mqa.toFixed(2)} GB, the smallest, but quality can drop. Grouped-query sits in between.`, tone: "ok", bars: bars(3) },
  ] };
}

/* ---------- the block: where the weights live ---------- */
function ffnShare(v: Record<string, number>): Flow {
  const { d, m } = v, attn = 4 * d * d, ffn = 2 * m * d * d, norm = 2 * d, tot = attn + ffn + norm;
  const fmt = (x: number) => (!x ? "" : x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : `${(x / 1e3).toFixed(1)}K`);
  const bars = (s: number) => [{ label: "attention", value: attn, tone: "hot" as const }, { label: "FFN", value: s > 1 ? ffn : 0, tone: "ok" as const }, { label: "2 norms", value: s > 2 ? norm : 0 }];
  return { kind: "bars", title: `Weights in one block, d = ${d}`, format: fmt, steps: [
    { note: `Attention has four ${d} by ${d} matrices (Q, K, V, O): 4d squared = ${attn.toLocaleString("en-US")} weights.`, bars: bars(1) },
    { note: `The FFN widens each token to ${m}d = ${(m * d).toLocaleString("en-US")} and comes back: 2 x ${m} x d squared = ${ffn.toLocaleString("en-US")}.`, tone: "ok", bars: bars(2) },
    { note: `The two RMSNorms add only ${norm.toLocaleString("en-US")} scales. The FFN holds ${Math.round((100 * ffn) / tot)}% of this block's weights.`, tone: ffn > attn ? "ok" : "warn", bars: bars(3) },
  ] };
}

/* ---------- decoding: beam search against greedy ---------- */
const BEAM_V = ["cat", "dog", "sat", "ran"];
const nextProbs = (prefix: string) => { const r = seededRng("beam:" + prefix); return softmax(BEAM_V.map(() => 2.2 * gauss(r))); };
function beam(v: Record<string, number>): Flow {
  const { b, len } = v;
  let beams = [{ text: "the", p: 1 }];
  const steps: { note: string; tone?: "ok" | "hot" | "warn"; tables: GridTable[] }[] = [];
  for (let t = 1; t <= len; t++) {
    const cand = beams.flatMap((x) => nextProbs(x.text).map((p, i) => ({ text: x.text + " " + BEAM_V[i], p: x.p * p })));
    cand.sort((a, c) => c.p - a.p);
    const from = beams.length;
    beams = cand.slice(0, b);
    steps.push({ note: `Step ${t}: extend ${from === 1 ? "the 1 beam" : `each of the ${from} beams`} by all ${BEAM_V.length} words: ${cand.length} candidates. Keep the ${beams.length} with the highest total probability.`, tone: "hot",
      tables: [{ head: ["rank", "text so far", "prob"], rows: beams.map((x, i) => [i + 1, x.text, x.p.toFixed(3)]), tones: { "0": "hot" } }] });
  }
  let g = { text: "the", p: 1 };
  for (let t = 0; t < len; t++) { const ps = nextProbs(g.text), i = ps.indexOf(Math.max(...ps)); g = { text: g.text + " " + BEAM_V[i], p: g.p * ps[i] }; }
  const best = beams[0], better = best.p > g.p * (1 + 1e-9);
  steps.push({ note: b === 1 ? "Width 1 is greedy search: one beam, the top word each time." : better ? `Beam search found a sentence ${(best.p / g.p).toFixed(1)} times as likely as greedy's. Greedy took the best word at each step and could not go back.` : "Here greedy already found the most likely sentence. A beam only helps when an early second choice pays off later: try another length.",
    tone: better ? "ok" : "warn", tables: [{ head: ["search", "text", "prob"], rows: [["greedy", g.text, g.p.toFixed(3)], [`beam ${b}`, best.text, best.p.toFixed(3)]], tones: { "1": better ? "ok" : "warn" } }] });
  return { kind: "grid", title: `Beam search, width ${b}, ${len} words`, steps };
}

export const PLAY_4: Record<string, PlayFlow> = {
  "s4-attn-scale": {
    title: "Why scale by sqrt(d)",
    knobs: [
      { key: "d", label: "Head size d", min: 2, max: 256, step: 2, value: 64 },
      { key: "t", label: "Temperature", min: 0.25, max: 4, step: 0.25, value: 1 },
    ],
    make: attnScale,
  },
  "s4-bpe-merges": { title: "How many merges", knobs: [{ key: "m", label: "Merges learned", min: 0, max: 14, value: 4 }], make: bpeMerges },
  "s4-rope-shift": {
    title: "Absolute positions against RoPE",
    knobs: [{ key: "gap", label: "Distance between the tokens", min: 0, max: 16, value: 3 }, { key: "d", label: "Head size d", min: 2, max: 16, step: 2, value: 8 }],
    make: ropeShift,
  },
  "s4-gqa-cache": {
    title: "Sharing keys and values between heads",
    knobs: [{ key: "kv", label: "K, V heads", min: 1, max: 16, value: 8 }, { key: "g", label: "Query heads per K, V head", min: 1, max: 8, value: 4 }, { key: "ctx", label: "Context", min: 1, max: 128, value: 8, unit: "K tokens" }],
    make: gqaCache,
  },
  "s4-ffn-share": {
    title: "Where a block's weights live",
    knobs: [{ key: "d", label: "Model width d", min: 256, max: 8192, step: 256, value: 4096 }, { key: "m", label: "FFN width, times d", min: 1, max: 8, step: 0.5, value: 4 }],
    make: ffnShare,
  },
  "s4-beam": {
    title: "Beam search against greedy",
    knobs: [{ key: "b", label: "Beam width", min: 1, max: 4, value: 2 }, { key: "len", label: "Words to generate", min: 2, max: 4, value: 3 }],
    make: beam,
  },
};
