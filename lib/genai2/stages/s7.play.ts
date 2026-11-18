// Stage 7 (RAG) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s7.calc.ts.
import type { Flow, SceneTone, Shape } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { chunkStarts, indexBytes, PAIRS, storedTokens, trainPairs, wilson } from "./s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// rag-ingest: what chunk size and overlap cost, and what overlap buys
function chunks(v: Record<string, number>): Flow {
  const { len, size, pct } = v, over = Math.round((size * pct) / 100);
  const base = chunkStarts(len, size, 0).length, n = chunkStarts(len, size, over).length, stored = storedTokens(len, size, over);
  const bars = (s: number, tone?: "hot" | "warn") => [{ label: "document", value: len }, { label: "in chunks", value: s, tone }];
  return { kind: "bars", title: `${n0(len)} tokens, chunks of ${size}, ${pct}% overlap`, format: n0, steps: [
    { note: `No overlap: ${base} chunk${base > 1 ? "s" : ""}, and every token is stored once. A sentence that crosses a boundary is cut in two, and neither half may match a question about it.`, bars: bars(len) },
    { note: over === 0 ? "Overlap is set to 0, so nothing changes. Raise it to see the cost and the gain." : `Overlap of ${over} tokens: ${n} chunks storing ${n0(stored)} tokens, ${Math.round((stored / len - 1) * 100)}% more to embed and to store.`, tone: over ? "hot" : "warn", bars: bars(stored, over ? "hot" : undefined) },
    { note: over === 0 ? "With no overlap, any passage that crosses a boundary is split. That is the trade: overlap costs tokens and buys whole passages." : `The gain: any passage up to ${over + 1} tokens long now sits whole inside at least one chunk, wherever it falls. Longer passages can still be cut, so split on headings first.`, tone: over ? "ok" : "warn", bars: bars(stored, over ? "hot" : undefined) },
  ] };
}

// vector-search: raw vector memory at four precisions, and the cost of an exact scan
function vecMemory(v: Record<string, number>): Flow {
  const { m, dims } = v, N = m * 1e6, gb = (bytes: number) => (N * dims * bytes) / 1e9;
  const sizes: [string, number][] = [["float32", 4], ["float16", 2], ["int8", 1], ["binary", 1 / 8]];
  const fmt = (x: number) => (x >= 10 ? `${Math.round(x)} GB` : `${x.toFixed(1)} GB`);
  const bars = (hot: number[]) => sizes.map(([label, b], i) => ({ label, value: gb(b), tone: hot.includes(i) ? (i === 0 ? "warn" as const : "ok" as const) : undefined }));
  const ops = N * dims;
  return { kind: "bars", title: `${m} million vectors of ${dims} numbers`, format: fmt, steps: [
    { note: `As 4-byte floats: ${m}M × ${dims} × 4 bytes = ${fmt(gb(4))}, before any index. An exact search reads all of it for every query: ${(ops / 1e9).toFixed(1)} billion multiply-adds.`, tone: "warn", bars: bars([0]) },
    { note: `int8 keeps one byte per number: ${fmt(gb(1))}, 4 times smaller, and usually loses little ranking quality.`, tone: "hot", bars: bars([0, 2]) },
    { note: `Binary keeps one bit per number: ${fmt(gb(1 / 8))}, 32 times smaller, compared with fast bit counts. Search it for a few hundred candidates, then re-score those with the full floats kept on disk.`, tone: "ok", bars: bars([0, 3]) },
  ] };
}

// hybrid-rerank: RRF, first in one list against rank r in both
function rrfPlay(v: Record<string, number>): Flow {
  const { k, r } = v, a = 1 / (k + 1), b = 2 / (k + r), f = (x: number) => x.toFixed(4);
  const bwins = b > a + 1e-12, tie = Math.abs(a - b) < 1e-12;
  const bars = (show: boolean) => [{ label: "A: 1st in one", value: a, tone: !bwins && !tie ? "ok" as const : undefined }, { label: `B: #${r} in both`, value: show ? b : 0, tone: show && bwins ? "ok" as const : undefined }];
  return { kind: "bars", title: `RRF with k = ${k}`, max: 2 / (k + 1), format: f, steps: [
    { note: `A is ranked 1st by keyword search and missing from the vector list: 1 / (${k} + 1) = ${f(a)}.`, tone: "hot", bars: bars(false) },
    { note: `B is ranked ${r} in both lists: 2 / (${k} + ${r}) = ${f(b)}. ${tie ? "Exactly a tie." : bwins ? "B wins: agreement between the two searches beats one first place." : "A wins: B is ranked too low in both to catch up."}`, tone: tie ? "warn" : "ok", bars: bars(true) },
    { note: `B wins while its rank is below k + 2 = ${k + 2}. A small k makes first place count for much more; a large k rewards documents both searches agree on. k = 60 is the usual default.`, tone: "hot", bars: bars(true) },
  ] };
}

// advanced-rag: multi-query, the chance at least one rewrite finds the chunk if misses were independent (a ceiling)
const MAXQ = 8;
export const anyHit = (p: number, n: number) => 1 - (1 - p) ** n;
function multiQuery(v: Record<string, number>): Flow {
  const p = v.p / 100, n = v.n, pct = (x: number) => (x ? `${Math.round(x * 100)}%` : "");
  const bars = (upto: number) => Array.from({ length: MAXQ }, (_, i) => ({ label: `${i + 1} quer${i ? "ies" : "y"}`, value: i < upto ? anyHit(p, i + 1) : 0, tone: i + 1 === upto ? "hot" as const : undefined }));
  const gain = anyHit(p, n) - p;
  return { kind: "bars", title: `Each phrasing finds the chunk ${v.p}% of the time`, max: 1, format: pct, steps: [
    { note: `One phrasing of the question finds the right chunk in its top k ${v.p}% of the time.`, bars: bars(1) },
    { note: n === 1 ? "With one query there is nothing to merge. Add rewrites to see the effect." : `${n} phrasings: at best, at least one of them finds it ${pct(anyHit(p, n))} of the time, ${Math.round(gain * 100)} points more. Their lists are then merged with RRF. Each new phrasing adds less than the one before.`, tone: n > 1 ? "ok" : "warn", bars: bars(n) },
    { note: `That best case assumes each phrasing misses independently. Rewrites of one question tend to miss together, so the real gain is smaller. The cost is certain: ${n} searches and one extra model call to write them.`, tone: "warn", bars: bars(n) },
  ] };
}

// rag-evals: how sure is a recall measured on n questions? (Wilson 95% interval)
function evalCi(v: Record<string, number>): Flow {
  const p = v.p / 100, n = v.n, n4 = 4 * n, pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const [lo, hi] = wilson(p, n), [lo4, hi4] = wilson(p, n4);
  const bars = (l: number, h: number, tone: "warn" | "ok") => [{ label: "low end", value: l, tone }, { label: "measured", value: p, tone: "hot" as const }, { label: "high end", value: h, tone }];
  const half = (hi - lo) / 2;
  return { kind: "bars", title: `Recall measured as ${v.p}% on ${n} questions`, max: 1, format: pct, steps: [
    { note: `On ${n} questions, the true recall behind ${v.p}% is likely anywhere from ${pct(lo)} to ${pct(hi)} (a 95% interval). That is the noise of a small sample, not of the system.`, tone: "warn", bars: bars(lo, hi, "warn") },
    { note: `With ${n4} questions, 4 times as many, the interval is ${pct(lo4)} to ${pct(hi4)}: ${((hi4 - lo4) / (hi - lo)).toFixed(2)} times as wide. Width shrinks with the square root of the set size, so halving it takes 4 times the questions.`, tone: "ok", bars: bars(lo4, hi4, "ok") },
    { note: `So on ${n} questions, treat a change smaller than about ${Math.round(half * 100)} points as noise. Compare old and new on the same questions, and grow the set where the important cases are.`, tone: "hot", bars: bars(lo, hi, "warn") },
  ] };
}

// embedding-models: contrastive training. Questions (filled dots) and their passages (rings) move on the unit circle.
const TONES: SceneTone[] = ["ok", "warn", "hot", "bad"], CX = 240, CY = 200, RAD = 150, SNAPS = [0, 5, 20, 100, 300];
function contrastive(v: Record<string, number>): Flow {
  const tau = v.t, run = trainPairs(tau, SNAPS), r2 = (x: number) => x.toFixed(2);
  const pt = (u: number[]) => [CX + RAD * u[0], CY - RAD * u[1]];
  const shapes = (k: number): Shape[] => {
    const s = run[k], out: Shape[] = [{ t: "path", id: "circle", pts: Array.from({ length: 65 }, (_, i) => [CX + RAD * Math.cos((i / 64) * 2 * Math.PI), CY - RAD * Math.sin((i / 64) * 2 * Math.PI)]).flat(), tone: "muted", w: 1.5, dash: true }];
    s.q.forEach((qv, i) => {
      const [qx, qy] = pt(qv), [px, py] = pt(s.p[i]);
      out.push({ t: "line", id: `pair${i}`, x1: qx, y1: qy, x2: px, y2: py, tone: TONES[i], w: 2, dash: true });
      out.push({ t: "dot", id: `q${i}`, x: qx, y: qy, r: 9, tone: TONES[i] }, { t: "dot", id: `p${i}`, x: px, y: py, r: 9, tone: TONES[i], ring: true });
      out.push({ t: "text", id: `l${i}`, x: CX + (RAD + 34) * qv[0], y: CY - (RAD + 26) * qv[1], text: PAIRS[i], size: 16, anchor: "middle", tone: TONES[i] });
    });
    out.push({ t: "text", id: "stat", x: 12, y: 384, text: `step ${s.step}   loss ${r2(s.loss)}   match cos ${r2(s.pos)}   other cos ${r2(s.neg)}`, size: 16, bold: true });
    return out;
  };
  const last = run[run.length - 1];
  return { kind: "scene", title: `Contrastive training, temperature ${tau}`, height: 400, steps: run.map((s, k) => ({
    note: k === 0 ? `Four questions (dots) and their right passages (rings), placed at random. Matching pairs point apart: average cosine ${r2(s.pos)}. Try: change the temperature.`
      : k < run.length - 1 ? `Step ${s.step}: each question is pulled towards its own passage and pushed from the other three, the in-batch negatives. Loss ${r2(s.loss)}.`
      : `Step ${s.step}: matching pairs sit at cosine ${r2(last.pos)} and other pairs at ${r2(last.neg)}. ${tau >= 0.5 ? `The loss stays at ${r2(last.loss)} even now: a high temperature flattens the softmax, so it cannot be sure.` : tau <= 0.1 ? "A low temperature is strict: the loss hits about 0 as soon as each pair wins clearly, so the pull stops early." : "The four pairs have spread out evenly, as far from each other as a circle allows."}`,
    tone: k === run.length - 1 ? "ok" as const : undefined,
    shapes: shapes(k),
  })) };
}

// embedding-models: what the index costs at each dimension and precision
function indexSize(v: Record<string, number>): Flow {
  const { m, d } = v, N = m * 1e6, gb = (bits: number, dims = d) => indexBytes(N, dims, bits) / 1e9;
  const fmt = (x: number) => (x < 1 ? x.toFixed(2) : x < 10 ? x.toFixed(1) : x.toFixed(0));
  const bars = (dims: number) => [
    { label: "float32", value: gb(32, dims), tone: "bad" as const }, { label: "float16", value: gb(16, dims), tone: "warn" as const },
    { label: "int8", value: gb(8, dims) }, { label: "binary (1 bit)", value: gb(1, dims), tone: "ok" as const },
  ];
  const cut = Math.min(256, d);
  return { kind: "bars", title: `${m} million chunks at ${d} dimensions`, max: gb(32), format: (x) => `${fmt(x)} GB`, steps: [
    { note: `Each vector is ${d} numbers. At float32 that is ${n0(d * 4)} bytes per chunk and ${fmt(gb(32))} GB for ${m} million chunks, before any index structure. Try: more chunks, or fewer dimensions.`, bars: bars(d) },
    { note: `Quantise to cut it: int8 is a quarter of float32, and 1-bit binary a thirty-second, at some loss in ranking quality. A common fix is to search the small copy, then rescore the top results with the full vectors.`, tone: "ok", bars: bars(d) },
    { note: d > cut ? `Matryoshka-trained models put the most important information first, so a vector can be cut to its first ${cut} numbers and still work: ${fmt(gb(32, cut))} GB at float32. Check recall on your own eval set before cutting.`
      : `At ${d} dimensions the vectors are already short. Cutting further, even with a Matryoshka-trained model, starts to cost recall quickly.`, tone: "ok", bars: bars(cut) },
  ] };
}

export const PLAY_7: Record<string, PlayFlow> = {
  "s7-contrastive": {
    title: "Train an embedder",
    knobs: [{ key: "t", label: "Temperature", min: 0.05, max: 1, step: 0.05, value: 0.2 }],
    make: contrastive,
  },
  "s7-index-size": {
    title: "What the vectors cost",
    knobs: [
      { key: "m", label: "Chunks (millions)", min: 1, max: 100, step: 1, value: 10 },
      { key: "d", label: "Dimensions", min: 256, max: 3072, step: 256, value: 1024 },
    ],
    make: indexSize,
  },
  "s7-eval-ci": {
    title: "How many eval questions do you need?",
    knobs: [
      { key: "n", label: "Questions in the eval set", min: 20, max: 500, step: 10, value: 50 },
      { key: "p", label: "Measured recall (%)", min: 50, max: 99, step: 1, value: 80 },
    ],
    make: evalCi,
  },
  "s7-multi-query": {
    title: "Multi-query: how much do more phrasings help?",
    knobs: [
      { key: "p", label: "One phrasing finds it (%)", min: 10, max: 90, step: 5, value: 60 },
      { key: "n", label: "Phrasings", min: 1, max: MAXQ, step: 1, value: 3 },
    ],
    make: multiQuery,
  },
  "s7-rrf": {
    title: "Reciprocal rank fusion: one first place or two good ranks?",
    knobs: [
      { key: "k", label: "k", min: 1, max: 100, step: 1, value: 60 },
      { key: "r", label: "B's rank in both lists", min: 1, max: 30, step: 1, value: 5 },
    ],
    make: rrfPlay,
  },
  "s7-vec-memory": {
    title: "How much memory do the vectors need?",
    knobs: [
      { key: "m", label: "Vectors (millions)", min: 1, max: 200, step: 1, value: 10 },
      { key: "dims", label: "Numbers per vector", min: 256, max: 3072, step: 256, value: 1024 },
    ],
    make: vecMemory,
  },
  "s7-chunks": {
    title: "Chunk size and overlap: what do they cost?",
    knobs: [
      { key: "len", label: "Document length (tokens)", min: 500, max: 20000, step: 500, value: 6000 },
      { key: "size", label: "Chunk size (tokens)", min: 100, max: 1000, step: 50, value: 500 },
      { key: "pct", label: "Overlap (% of chunk)", min: 0, max: 50, step: 5, value: 10 },
    ],
    make: chunks,
  },
};
