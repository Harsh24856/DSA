// Stage 7 (RAG) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s7.calc.ts.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { chunkStarts, storedTokens } from "./s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// rag-ingest: what chunk size and overlap cost, and what overlap buys
function chunks(v: Record<string, number>): Flow {
  const { len, size, pct } = v, over = Math.round((size * pct) / 100);
  const base = chunkStarts(len, size, 0).length, n = chunkStarts(len, size, over).length, stored = storedTokens(len, size, over);
  const bars = (s: number, tone?: "hot" | "warn") => [{ label: "document", value: len }, { label: "stored in chunks", value: s, tone }];
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
  const bars = (show: boolean) => [{ label: "A: 1st in one list", value: a, tone: !bwins && !tie ? "ok" as const : undefined }, { label: `B: ${r} in both lists`, value: show ? b : 0, tone: show && bwins ? "ok" as const : undefined }];
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

export const PLAY_7: Record<string, PlayFlow> = {
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
