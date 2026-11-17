// Stage 7 (RAG) animated walk-throughs. Every number is computed here or in s7.calc.ts.
import type { Flow, FlowTone, GridTable } from "../../other/flows.ts";
import { chunkStarts, cosine, dot, norm, storedTokens } from "./s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// rag-ingest: one corpus from files to stored vectors
export const INGEST = { docs: 2000, docLen: 6000, size: 500, overlap: 50, dims: 1024 };
function ingest(): Flow {
  const I = INGEST, per = chunkStarts(I.docLen, I.size, I.overlap).length, stored = storedTokens(I.docLen, I.size, I.overlap);
  const total = I.docs * per, mb = (total * I.dims * 4) / 1e6;
  return { title: "Ingest: from files to an index", steps: [
    { node: "parse: PDF, HTML, slides to text", note: "Keep headings and page numbers. Turn each table into Markdown rows, so a value stays next to its column name. Errors made here reach every later step.", tone: "warn" },
    { node: "clean: drop page furniture", note: "Headers, footers, menus and cookie banners repeat on every page. Left in, they add the same noise to every chunk." },
    { node: "split on headings first", note: "A section is a natural unit of meaning. Only sections that are still too long get cut further." },
    { node: `chunk: ${I.size} tokens, ${I.overlap} overlap`, note: `A ${n0(I.docLen)} token document becomes ${per} chunks holding ${n0(stored)} tokens, ${Math.round((stored / I.docLen - 1) * 100)}% more than the original because of the overlap.`, tone: "hot" },
    { node: "attach metadata", note: "Source, page, heading, date and who may read it. Citations, date filters and permission checks all depend on it." },
    { node: "embed every chunk", note: `${n0(I.docs)} documents × ${per} chunks = ${n0(total)} chunks, each turned into one vector of ${n0(I.dims)} numbers by the same embedding model.` },
    { node: "store vector, text, metadata", note: `As 4-byte floats the vectors take ${n0(total)} × ${n0(I.dims)} × 4 bytes = ${n0(mb)} MB. Keep a hash of each file, so a nightly run re-embeds only what changed.`, tone: "ok" },
  ] };
}

// vector-search: dot product against cosine, then normalising so they agree
export const COS = { q: [0.6, 0.8], docs: [["A", [3, 4]], ["B", [0.8, 0.6]], ["C", [9, 1]], ["D", [0, 1]]] as [string, number[]][] };
function cosineFlow(): Flow {
  const { q, docs } = COS, r2 = (x: number) => x.toFixed(2);
  const rows = docs.map(([id, v]) => ({ id, v, len: norm(v), dp: dot(q, v), cos: cosine(q, v) }));
  const byDot = [...rows].sort((a, b) => b.dp - a.dp), byCos = [...rows].sort((a, b) => b.cos - a.cos);
  const unit = (v: number[]) => v.map((x) => x / norm(v)), l2 = (v: number[]) => unit(v).reduce((s, x, i) => s + (x - q[i]) ** 2, 0);
  const T = (cols: string[], cell: (r: (typeof rows)[number]) => (string | number)[], tones?: Record<string, FlowTone>): GridTable =>
    ({ head: ["doc", ...cols], rows: rows.map((r) => [r.id, ...cell(r)]), tones });
  const at = (id: string) => String(rows.findIndex((r) => r.id === id));
  return { kind: "grid", title: `Ranking 4 vectors for the query [${q.join(", ")}]`, steps: [
    { note: `The query has length ${r2(norm(q))}. The documents point in different directions and have different lengths. C is the longest at ${r2(norm(docs[2][1]))}.`, tables: [T(["vector", "length"], (r) => [`[${r.v.join(", ")}]`, r2(r.len)])] },
    { note: `Plain dot product: ${byDot.map((r) => `${r.id} ${r2(r.dp)}`).join(", ")}. ${byDot[0].id} wins only because it is long, though it points away from the query.`, tone: "warn", tables: [T(["vector", "dot"], (r) => [`[${r.v.join(", ")}]`, r2(r.dp)], { [at(byDot[0].id)]: "warn" })] },
    { note: `Cosine divides by both lengths, so only the angle counts: ${byCos.map((r) => `${r.id} ${r2(r.cos)}`).join(", ")}. ${byCos[0].id} points the same way as the query and scores ${r2(byCos[0].cos)}.`, tone: "hot", tables: [T(["dot", "cosine"], (r) => [r2(r.dp), r2(r.cos)], { [at(byCos[0].id)]: "ok", ":2": "hot" })] },
    { note: "Scale every vector to length 1 when you store it. Then the dot product is the cosine, and squared distance is 2 - 2 × cosine: all three give the same order, and dot is the cheapest.", tone: "ok", tables: [T(["dot of unit", "distance²"], (r) => [r2(dot(q, unit(r.v))), r2(l2(r.v))], { [at(byCos[0].id)]: "ok" })] },
  ] };
}

export const FLOWS_7: Record<string, Flow> = {
  "s7-ingest": ingest(),
  "s7-cosine": cosineFlow(),
};
