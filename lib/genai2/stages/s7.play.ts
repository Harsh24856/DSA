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

export const PLAY_7: Record<string, PlayFlow> = {
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
