// Stage 7: the offline half of RAG, from raw files to stored vectors. Every number below is computed here or in s7.calc.ts.
import type { GModule } from "../../types.ts";
import { chunkStarts, storedTokens } from "../../stages/s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// predict and figure: 1,000 tokens, chunks of 300, overlap 60
const [PN, PS, PO] = [1000, 300, 60], pCount = chunkStarts(PN, PS, PO).length, pStored = storedTokens(PN, PS, PO);
// numeric: chunk count for another document
const [CN, CS, CO] = [2000, 512, 64], cCount = chunkStarts(CN, CS, CO).length;
// numeric: storage of float32 vectors
const [VN, VD] = [200_000, 768], vMB = (VN * VD * 4) / 1e6;
// output: python range gives the same starts as chunkStarts
const [ON, OS, OO] = [5000, 500, 100], oCount = chunkStarts(ON, OS, OO).length;
// trap: what overlap costs
const extra = Math.round((pStored / PN - 1) * 100);

export const RAG_INGEST: GModule = {
  id: "rag-ingest",
  stage: 7,
  title: "Ingest (parse, chunk, embed)",
  hook: "Before a model can answer from your documents, they have to be turned into small, searchable pieces. Most bad RAG answers start here, long before any model is called.",
  blocks: [
    { kind: "flow", id: "g-rag" },
    { kind: "text", md: "**Why RAG at all?** A model knows only what it saw in training. It has never read your handbook, and it knew nothing after its cutoff. RAG finds the right passages at question time and puts them in the prompt, so the answer can quote and cite them. Updating knowledge means re-indexing a file, not retraining a model." },
    {
      kind: "compare",
      head: ["Need", "Reach for", "Why"],
      rows: [
        ["Answers from your own or changing documents", "RAG", "update by re-indexing; answers can cite sources"],
        ["A format, tone or task the model gets wrong", "Prompting first, then fine-tuning", "examples fix most format issues; tuning bakes in the rest"],
        ["New facts the model must know without lookups", "Neither alone", "fine-tuning teaches style better than facts; prefer RAG"],
        ["Lower cost or latency at scale", "Fine-tune a smaller model", "a tuned small model can match a big one on one task"],
      ],
    },
    { kind: "flow", id: "s7-ingest" },
    { kind: "figure", id: "s7-chunk-overlap", caption: `Chunks of ${PS} tokens that overlap by ${PO}. The shared spans are stored twice, which is the price of never cutting a short passage in half.` },
    {
      kind: "predict",
      q: `A ${n0(PN)} token document is cut into chunks of ${PS} tokens, each new chunk starting ${PS - PO} tokens after the last (an overlap of ${PO}). How many chunks?`,
      answer: String(pCount), wrong: [String(Math.floor(PN / PS)), String(Math.ceil(PN / PS) + 1), String(Math.ceil(PN / PO))],
      why: `Starts at ${chunkStarts(PN, PS, PO).join(", ")}. The chunk at ${chunkStarts(PN, PS, PO).at(-1)} already reaches the end, so it is the last: ${pCount} chunks. ${Math.floor(PN / PS)} forgets that the overlap makes each step shorter than a chunk.`,
    },
    { kind: "play", id: "s7-chunks" },
    { kind: "lab", id: "chunk" },
    {
      kind: "compare",
      head: ["Strategy", "How it splits", "Watch out for"],
      rows: [
        ["Fixed size + overlap", "Every n tokens, sharing a few with the next", "Cuts through sentences and tables"],
        ["Structure-aware", "One section, FAQ entry or table per chunk", "Very long sections still need cutting"],
        ["Semantic", "Where the topic shifts, found with embeddings", "An extra model pass at ingest"],
        ["Parent-child", "Search small chunks, send their parent section", "Two sizes to store and keep in sync"],
        ["Contextual", "Prepend a line saying where the chunk comes from", "One model call per chunk at ingest"],
      ],
    },
    { kind: "text", md: "**An embedding is a meaning fingerprint.** A model reads a chunk and returns one vector, often a few hundred to a few thousand numbers. Chunks that mean similar things get nearby vectors, even with different words. Every chunk and every question must go through the same model. How these models are trained is the next module, [[embedding-models]]." },
    {
      kind: "code",
      run: true,
      src: `import numpy as np, zlib

def chunk(n, size, overlap):
    step, s, spans = size - overlap, 0, []
    while True:
        spans.append((s, min(s + size, n)))
        if s + size >= n:
            return spans
        s += step

spans = chunk(${PN}, ${PS}, ${PO})
print(spans, "stored:", sum(e - s for s, e in spans))
assert len(spans) == ${pCount} and sum(e - s for s, e in spans) == ${pStored}
# any passage up to overlap + 1 tokens long sits whole inside some chunk
L = ${PO} + 1
assert all(any(s <= a and a + L <= e for s, e in spans) for a in range(${PN} - L + 1))

# a toy embedding: hash each word into 64 slots, then scale to length 1
def embed(text, d=64):
    v = np.zeros(d)
    for w in text.lower().split():
        v[zlib.crc32(w.encode()) % d] += 1
    return v / np.linalg.norm(v)

a = embed("refunds go back to the original card")
b = embed("refunds go back to the card used")
c = embed("shipping is free above 50 dollars")
print("a.b =", round(float(a @ b), 2), " a.c =", round(float(a @ c), 2))
assert a @ b > a @ c                          # shared words, closer vectors
assert abs(np.linalg.norm(a) - 1) < 1e-9      # unit length: dot product is the cosine
`,
    },
  ],
  keyPoints: [
    "RAG has two halves: ingest runs offline (parse, chunk, embed, store); retrieval runs per question.",
    "Parsing is often the real problem: keep headings and page numbers, and turn tables into rows that keep their column names.",
    "Split on structure first, then by size; overlap stops short passages being cut in half at a small storage cost.",
    "Store metadata with every chunk (source, page, date, who may read it) for citations, filters and permissions.",
    "Use one embedding model for chunks and questions, and re-embed everything when you change it.",
  ],
  questions: [
    { id: "why-rag", level: "easy", kind: "concept",
      q: "A support bot must answer from a policy handbook that changes every week. Why is RAG usually a better fit than fine-tuning?",
      answer: "Updating means re-indexing the changed pages, and answers can cite the passage they used",
      wrong: ["Fine-tuning cannot change a model's behaviour at all", "RAG makes the model itself smaller and faster", "RAG removes the need for a system prompt"],
      why: "Facts that change belong in an index you can update in minutes. Fine-tuning shapes behaviour and style, takes a training run per change, and cannot point to its source." },
    { id: "offline", level: "easy", kind: "concept",
      q: "Which of these runs offline, before any user asks anything?",
      answer: "Chunking and embedding the documents",
      wrong: ["Embedding the user's question", "Reranking the retrieved chunks", "Building the prompt with the top chunks"],
      why: "Ingest prepares the index ahead of time. Everything that depends on the question, including embedding it, happens online per request." },
    { id: "tables", level: "medium", kind: "concept",
      q: "A price table in a PDF is parsed into loose lines of numbers, and questions about prices fail. What is the best fix?",
      answer: "Parse the table into Markdown or HTML rows, so each value keeps its column name",
      wrong: ["Use a bigger chunk size so the whole page fits", "Switch to an embedding model with more dimensions", "Drop tables from the index"],
      why: "A number with no header means nothing to an embedding or to the model. Keeping rows and headers together fixes the text itself; a bigger chunk or model still sees noise." },
    { id: "big-chunks", level: "medium", kind: "concept",
      q: "What goes wrong when chunks are very large, say whole 20 page chapters?",
      answer: "One vector blurs many topics, so matches get weaker, and each hit fills the prompt with text that does not help",
      wrong: ["Nothing; larger chunks always give better recall", "The embedding model refuses text longer than a sentence", "Overlap stops working above 1,000 tokens"],
      why: "An embedding summarises its whole input. Many topics in one vector match no single question well, and every retrieved chunk costs prompt tokens." },
    { id: "parent-child", level: "medium", kind: "concept",
      q: "What is parent-child chunking?",
      answer: "Search over small chunks for precise matches, then give the model the larger section each one came from",
      wrong: ["Embed the whole document once and every chunk again", "Let a parent model write each chunk's text", "Keep only chunks whose parent heading matches the question"],
      why: "Small chunks match sharply; large sections give the model enough context. Parent-child gets both, at the cost of storing two levels." },
    { id: "new-model", level: "hard", kind: "concept",
      q: "You switch to a better embedding model. The documents have not changed. What must you do?",
      answer: "Re-embed every chunk with the new model before searching with it",
      wrong: ["Nothing; vectors of the same size are interchangeable", "Re-embed only new documents from now on", "Embed only the questions with the new model"],
      why: "Each model places meaning in its own space. A question vector from model B compared with chunk vectors from model A gives scores with no meaning, even when the sizes match." },
    { id: "acl", level: "hard", kind: "concept",
      q: "Some documents may be read only by the finance team. Where should that rule be enforced?",
      answer: "As a metadata filter in the search itself, so restricted chunks never come back for other users",
      wrong: ["In the system prompt: tell the model not to reveal finance text", "After generation, by scanning the answer for numbers", "Nowhere; embeddings already hide private details"],
      why: "Anything retrieved can leak into the answer, and a prompt instruction is not a security boundary. Filter by the user's groups when you search, using the access field stored with each chunk." },
    { id: "chunk-count", level: "easy", kind: "numeric",
      q: `A ${n0(CN)} token document, chunks of ${CS} tokens with an overlap of ${CO}. How many chunks?`,
      answer: String(cCount), wrong: [String(Math.ceil(CN / CS)), String(cCount + 1), String(Math.floor(CN / CO))],
      why: `Each chunk starts ${CS - CO} tokens after the last: ${chunkStarts(CN, CS, CO).join(", ")}. The last start reaches the end, so ${cCount}. ${Math.ceil(CN / CS)} ignores the overlap.` },
    { id: "storage", level: "medium", kind: "numeric",
      q: `${n0(VN)} chunks, ${VD} numbers per vector, stored as 4-byte floats. About how many MB do the vectors take?`,
      answer: `${n0(vMB)} MB`, wrong: [`${n0(vMB / 4)} MB`, `${n0(vMB * 8)} MB`, `${n0((VN * VD) / 1e6 / 8)} MB`],
      why: `${n0(VN)} × ${VD} × 4 bytes = ${n0(VN * VD * 4)} bytes, about ${n0(vMB)} MB. The text and metadata are stored too, and an index adds its own overhead.` },
    { id: "range-starts", level: "medium", kind: "output",
      q: "These are the chunk starts for a document. How many chunks? What does this print?",
      code: `n, size, overlap = ${ON}, ${OS}, ${OO}\nstarts = list(range(0, n - overlap, size - overlap))\nprint(len(starts))`,
      answer: String(oCount), wrong: [String(ON / OS), String(oCount + 1), String(Math.floor(ON / OO))],
      why: `Starts step by ${OS - OO}: 0, ${OS - OO}, ..., ${chunkStarts(ON, OS, OO).at(-1)}. The range stops before n - overlap = ${ON - OO}, which is exactly where a start would add only tokens already stored. ${oCount} chunks.` },
    { id: "pick-size", level: "medium", kind: "explain",
      q: "How do you choose a chunk size?",
      answer: "Start from the structure: one section or FAQ entry per chunk, and cut only long sections, to a few hundred tokens with a little overlap.\n\nThen measure. Build a small set of real questions with the chunks that answer them, try two or three sizes, and keep the one with the best recall@k and answer quality. Small chunks match precisely but lose context; large ones keep context but blur the match and cost prompt tokens. Parent-child chunking gets both." },
    { id: "contextual", level: "hard", kind: "explain",
      q: "What is contextual retrieval, and why does it help?",
      answer: "Before embedding, a model writes a short line saying where the chunk sits, such as \"From the 2025 refund policy, section on EU customers\", and that line is stored with the chunk.\n\nA chunk like \"Customers get 14 days\" means nothing alone: which customers, which policy? The added line puts the missing words back, so both vector and keyword search can match it. It costs one model call per chunk at ingest, which prompt caching keeps cheap because the whole document is the shared prefix." },
    { id: "nightly", level: "hard", kind: "explain",
      q: "Design ingest for 5 million internal documents that change daily, with team permissions.",
      answer: "- Pull changes from each source and keep a content hash per document, so only new or changed files are parsed and re-embedded; deleted files remove their chunks.\n- Parse with layout awareness, split on headings, then by size with a little overlap.\n- Store each chunk with source, page, date and the groups allowed to read it.\n- Embed in batches, upsert by a stable chunk id, and record the embedding model version.\n- At query time, filter by the user's groups inside the search.\n- Watch freshness lag, failed parses and cost per day." },
    { id: "trap-overlap-free", level: "easy", kind: "trap",
      claim: "Chunk overlap improves retrieval at no extra cost.",
      truth: false,
      why: `Overlapping tokens are stored and embedded twice. ${n0(PN)} tokens in chunks of ${PS} with ${PO} overlap store ${n0(pStored)} tokens, ${extra}% more, and that adds embedding cost, storage and duplicate hits.` },
    { id: "trap-reembed", level: "medium", kind: "trap",
      claim: "After switching embedding models, every chunk must be embedded again, even though no text changed.",
      truth: true,
      why: "Vectors are comparable only within one model's space. Mixing old chunk vectors with new question vectors makes similarity scores meaningless." },
  ],
  real: [
    { who: "Patrick Lewis and co-authors", when: "2020",
      what: "\"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks\" joined a pretrained seq2seq generator to a dense vector index of Wikipedia, searched by a neural retriever, so the model could draw on retrieved passages when it wrote.",
      takeaway: "The knowledge sits in an index you can swap or update, apart from the model's own weights.",
      url: "https://arxiv.org/abs/2005.11401" },
    { who: "A model provider's engineering post", when: "September 2024",
      what: "\"Contextual Retrieval\" prepended a short, model-written context of usually 50 to 100 tokens to each chunk before embedding and keyword indexing. Top-20 retrieval failures fell 35% with contextual embeddings, 49% when contextual BM25 was added, and 67% with reranking on top.",
      takeaway: "Fixing what a chunk says about itself at ingest can matter as much as a better search.",
      url: "https://www.anthropic.com/news/contextual-retrieval" },
  ],
};
