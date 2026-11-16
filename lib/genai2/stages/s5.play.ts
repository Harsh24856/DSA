// Stage 5 (Training LLMs) slider walk-throughs, placed in modules by a `play` block. Client-safe: no module text.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";

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

export const PLAY_5: Record<string, PlayFlow> = {
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
