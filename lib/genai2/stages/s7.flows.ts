// Stage 7 (RAG) animated walk-throughs. Every number is computed here or in s7.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { chunkStarts, storedTokens } from "./s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// rag-ingest: one corpus from files to stored vectors
export const INGEST = { docs: 2000, docLen: 6000, size: 500, overlap: 50, dims: 1024 };
function ingest(): Flow {
  const I = INGEST, per = chunkStarts(I.docLen, I.size, I.overlap).length, stored = storedTokens(I.docLen, I.size, I.overlap);
  const total = I.docs * per, gb = (total * I.dims * 4) / 1e9;
  return { title: "Ingest: from files to an index", steps: [
    { node: "parse: PDF, HTML, slides to text", note: "Keep headings and page numbers. Turn each table into Markdown rows, so a value stays next to its column name. Bad parsing causes most later failures.", tone: "warn" },
    { node: "clean: drop page furniture", note: "Headers, footers, menus and cookie banners repeat on every page. Left in, they add the same noise to every chunk." },
    { node: "split on headings first", note: "A section is a natural unit of meaning. Only sections that are still too long get cut further." },
    { node: `chunk: ${I.size} tokens, ${I.overlap} overlap`, note: `A ${n0(I.docLen)} token document becomes ${per} chunks holding ${n0(stored)} tokens, ${Math.round((stored / I.docLen - 1) * 100)}% more than the original because of the overlap.`, tone: "hot" },
    { node: "attach metadata", note: "Source, page, heading, date and who may read it. Citations, date filters and permission checks all depend on it." },
    { node: "embed every chunk", note: `${n0(I.docs)} documents × ${per} chunks = ${n0(total)} chunks, each turned into one vector of ${n0(I.dims)} numbers by the same embedding model.` },
    { node: "store vector, text, metadata", note: `As 4-byte floats the vectors take ${n0(total)} × ${n0(I.dims)} × 4 bytes = ${gb.toFixed(2)} GB. Keep a hash of each file, so a nightly run re-embeds only what changed.`, tone: "ok" },
  ] };
}

export const FLOWS_7: Record<string, Flow> = {
  "s7-ingest": ingest(),
};
