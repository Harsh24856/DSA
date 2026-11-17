// Stage 7: fixing the questions plain retrieval gets wrong: rewriting, HyDE, multi-query, graphs and agentic search. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { AGENT_SEARCHES } from "../../stages/s7.flows.ts";
import { anyHit } from "../../stages/s7.play.ts";
import { DOCS } from "../../stages/s7.calc.ts";

const pct = (x: number) => `${Math.round(x * 100)}%`;

// numeric: multi-query ceiling
const [MP, MN] = [0.6, 3], mq = anyHit(MP, MN);
// numeric: agentic loop calls (the same count as the flow)
const agentCalls = AGENT_SEARCHES.length + 1;
// output: three phrasings at 50%
const [OP, ON] = [0.5, 3], oHit = Math.round(anyHit(OP, ON) * 1000) / 1000;

export const ADVANCED_RAG: GModule = {
  id: "advanced-rag",
  stage: 7,
  title: "Advanced RAG (query rewrite, GraphRAG, agentic RAG)",
  hook: "Plain RAG embeds the question as typed and takes the top few chunks. That breaks on follow-ups, vague questions, and questions whose answer is spread across documents. Each fix here targets one of those failures, and each costs extra calls.",
  blocks: [
    { kind: "figure", id: "s7-graph-hops", caption: "Two facts from two different documents, joined at one entity. No single chunk holds the answer, so a top-k search over chunks can miss it." },
    { kind: "text", md: "**Fix the question before you fix the index.** Users type follow-ups (\"and for the EU?\"), vague phrases, and questions with several parts. Search sees only what you send it. Rewriting with the chat history, asking several phrasings, or splitting the question often helps more than a new embedding model." },
    {
      kind: "predict",
      q: "Turn 1: \"What is the refund window for UK customers?\" Turn 2: \"And for the EU?\" Plain RAG embeds turn 2 as typed. What happens?",
      answer: "It retrieves anything about the EU, because the words \"refund window\" are not in the query",
      wrong: ["It finds the EU refund window, because the model remembers turn 1", "It returns nothing, because the query is too short to embed", "It returns the UK answer again"],
      why: "Retrieval sees only the text it is given. \"And for the EU?\" carries no topic, so its nearest chunks are any that mention the EU. Rewrite it with the history into \"What is the refund window for EU customers?\" first.",
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  subgraph R1["follow-up that leans on the chat"]
    a1["rewrite into a standalone question"]:::ok
  end
  subgraph R2["short or vague question"]
    a2["multi-query or HyDE"]:::ok
  end
  subgraph R3["several parts in one question"]
    a3["split into sub-questions"]:::ok
  end
  subgraph R4["themes across the whole corpus"]
    a4["GraphRAG summaries"]:::warn
  end
  subgraph R5["needs several searches in turn"]
    a5["agentic RAG"]:::hot
  end
  R1 --> R2 --> R3 --> R4 --> R5`,
      caption: "Match the fix to the failure. Read top to bottom: the lower the row, the more each question costs.",
    },
    { kind: "play", id: "s7-multi-query" },
    { kind: "text", md: "**HyDE: search with a guess.** Questions and documents are written differently: a question is short and asks, a document is long and states. HyDE has a model write a plausible answer first, then embeds that and searches with it. The guess can be wrong in its details; it only has to read like the documents that hold the real answer." },
    {
      kind: "code",
      run: true,
      src: `import re
import numpy as np

docs = {${DOCS.map(([id, t]) => `\n    "${id}": "${t}",`).join("")}
}
words = sorted({w for t in docs.values() for w in re.findall(r"[a-z0-9-]+", t.lower())})

def embed(text):                      # a toy stand-in for an embedding: word counts, length 1
    v = np.array([re.findall(r"[a-z0-9-]+", text.lower()).count(w) for w in words], float)
    return v / (np.linalg.norm(v) or 1)

def search(text):
    q = embed(text)
    return sorted(docs, key=lambda d: -(embed(docs[d]) @ q))

question = "I returned it, how long until my money is on my card?"
# HyDE: a model writes a plausible answer first; it may be wrong in detail, it only has to read like the documents
fake = "The refund is paid back to the card you used within a few working days."
print("question finds:", search(question)[:3])
print("HyDE finds:    ", search(fake)[:3])
assert search(question)[0] != "D1" and search(fake)[0] == "D1"
`,
    },
    { kind: "flow", id: "s7-agentic" },
    {
      kind: "compare",
      head: ["Technique", "Fixes", "Extra cost per question"],
      rows: [
        ["Query rewrite", "Follow-ups that need the chat history", "1 small model call"],
        ["Multi-query", "Wording that misses the documents' words", "1 call + a search per phrasing"],
        ["HyDE", "Short questions far from document style", "1 call to write the guess"],
        ["Decomposition", "Several questions in one", "1 call + a search per part"],
        ["GraphRAG", "Themes and links across the whole corpus", "Many model calls at indexing"],
        ["Agentic RAG", "Answers that need search, read, search again", "Several model calls and searches"],
      ],
    },
  ],
  keyPoints: [
    "Many failures start with the query: rewrite follow-ups into standalone questions using the chat history.",
    "Multi-query searches several phrasings and fuses the lists; HyDE searches with a model-written guess at the answer.",
    "Decomposition splits a many-part question into sub-questions, each retrieved on its own.",
    "GraphRAG builds an entity graph and community summaries at indexing time, for whole-corpus and multi-hop questions, at a high indexing cost.",
    "Agentic RAG makes search a tool the model calls repeatedly; it handles hard questions, with more calls and latency.",
  ],
  questions: [
    { id: "rewrite", level: "easy", kind: "concept",
      q: "Why rewrite a follow-up question before retrieval in a chat?",
      answer: "So the search query carries the topic from earlier turns and stands on its own",
      wrong: ["To make the question shorter and cheaper to embed", "Because embedding models cannot read questions", "To hide the user's wording from the vector database"],
      why: "The retriever sees only the query string. \"What about the EU?\" has no topic in it; the rewrite puts the earlier context back into the words that get embedded." },
    { id: "hyde-what", level: "medium", kind: "concept",
      q: "In HyDE, what gets embedded and used as the search vector?",
      answer: "A hypothetical answer that a model writes for the question",
      wrong: ["The question repeated three times", "The average of all document vectors", "The top chunk from a first keyword search"],
      why: "A written answer looks more like the stored documents than a short question does, so its vector lands closer to them. The original paper needed no relevance labels for this." },
    { id: "hyde-risk", level: "hard", kind: "concept",
      q: "What is the main risk of HyDE?",
      answer: "If the model's guess is wrong in substance, the search follows the wrong guess",
      wrong: ["The guessed answer is shown to the user as fact", "It needs thousands of labelled question and document pairs", "It works only with keyword search"],
      why: "The guess steers the vector toward documents that look like it. When the model knows nothing about a niche topic, the guess can point at the wrong part of the corpus. Measure recall with and without it." },
    { id: "decompose", level: "medium", kind: "concept",
      q: "\"Compare our 2024 and 2025 refund policies and say which is stricter\" retrieves only 2025 chunks. Which technique fits best?",
      answer: "Decomposition: search for the 2024 policy and the 2025 policy separately, then answer from both",
      wrong: ["HyDE: write a fake comparison and search with it", "A larger chunk size", "A lower similarity threshold"],
      why: "One vector for a two-part question lands near whichever part dominates. Splitting it gives each part its own search, so both policies reach the prompt." },
    { id: "graphrag-when", level: "medium", kind: "concept",
      q: "Which question is GraphRAG built for?",
      answer: "\"What are the main themes across all 3,000 incident reports?\"",
      wrong: ["\"What does error E-4021 mean?\"", "\"What is the refund window in the EU?\"", "\"Who wrote the security policy?\""],
      why: "A global question has no single chunk that answers it. GraphRAG precomputes summaries of groups of related entities and answers from those. The other three are single-fact lookups that plain RAG handles well." },
    { id: "merge", level: "medium", kind: "concept",
      q: "Multi-query sends 3 phrasings and gets 3 ranked lists. How are they usually merged?",
      answer: "Reciprocal rank fusion over the three lists",
      wrong: ["Keep only the first phrasing's list", "Add the three raw similarity scores", "Pick the list with the most results"],
      why: "Each phrasing's list is a ranking of the same corpus; RRF rewards chunks that several phrasings rank well, with no score tuning." },
    { id: "agentic-cost", level: "hard", kind: "concept",
      q: "What is the main trade-off of agentic RAG against a single retrieve-then-answer pass?",
      answer: "It handles questions that need several searches, at the cost of more model calls, latency and less predictable behaviour",
      wrong: ["It is always cheaper because the model searches only when needed", "It removes the need for an index", "It cannot cite its sources"],
      why: `In the walk-through one question took ${agentCalls} model calls and ${AGENT_SEARCHES.length} searches instead of 1 and 1. The loop also needs a step limit and evals, because the model chooses its own path.` },
    { id: "mq-num", level: "medium", kind: "numeric",
      q: `Each phrasing finds the right chunk ${pct(MP)} of the time. If misses were independent, how often would at least one of ${MN} phrasings find it?`,
      answer: pct(mq), wrong: [pct(Math.min(1, MP * MN)), pct(MP), pct(MP ** MN)],
      why: `All ${MN} miss with chance ${(1 - MP).toFixed(1)}^${MN} = ${(1 - MP) ** MN < 0.1 ? ((1 - MP) ** MN).toFixed(3) : ((1 - MP) ** MN).toFixed(2)}, so at least one hits ${pct(mq)} of the time. ${pct(MP ** MN)} is the chance all three hit. Real phrasings miss together more often, so treat this as a ceiling.` },
    { id: "agent-calls", level: "easy", kind: "numeric",
      q: `An agent searches ${AGENT_SEARCHES.length} times, one model call per search decision, then makes one more call to write the answer. How many model calls in all?`,
      answer: String(agentCalls), wrong: [String(AGENT_SEARCHES.length), String(2 * AGENT_SEARCHES.length + 1), "1"],
      why: `Each search is requested by its own model call (${AGENT_SEARCHES.length}), and the final answer needs one more: ${agentCalls}. Plain RAG makes 1.` },
    { id: "mq-out", level: "easy", kind: "output",
      q: "What does this print?",
      code: `p, n = ${OP}, ${ON}\nprint(round(1 - (1 - p) ** n, 3))`,
      answer: String(oHit), wrong: [String(OP ** ON), String(OP * ON), String(1 - OP)],
      why: `(1 - ${OP})^${ON} = ${(1 - OP) ** ON} is the chance that all ${ON} miss, so 1 - ${(1 - OP) ** ON} = ${oHit}.` },
    { id: "graphrag-how", level: "hard", kind: "explain",
      q: "How does GraphRAG work, and when is it worth its cost?",
      answer: "At indexing time a model reads every document and extracts entities and the relations between them, building a knowledge graph. The graph is split into communities of closely related entities, and a model writes a summary of each.\n\nFor a global question, each community summary gives a partial answer and those are combined into one. It is worth it for questions about themes across a whole corpus, or links spread over many documents. Indexing takes many model calls, so first show that plain RAG fails your questions." },
    { id: "when-agentic", level: "medium", kind: "explain",
      q: "When would you choose agentic RAG over a fixed retrieve-then-answer pipeline?",
      answer: "When answering needs more than one search, and the second search depends on what the first found: multi-hop questions, comparisons, or several sources such as documents, a database and the web.\n\nKeep the fixed pipeline for simple lookups: it is faster, cheaper and easier to test. If you go agentic, cap the number of steps, log every tool call, and evaluate on a set of hard questions." },
    { id: "rewrite-design", level: "hard", kind: "explain",
      q: "Design query rewriting for a support chatbot.",
      answer: "- Before each search, a small, fast model gets the last few turns and the new message, and returns one standalone question.\n- Skip the call when the message already stands alone, to save latency.\n- Optionally return 2 or 3 phrasings and fuse their results with RRF.\n- Search with the rewrite, but answer the user's real message, with the history in the prompt.\n- Log original and rewritten queries; evaluate recall@k on follow-up questions from real chats." },
    { id: "trap-graph-cheap", level: "easy", kind: "trap",
      claim: "GraphRAG is cheaper to index than plain RAG, because it stores a graph instead of vectors.",
      truth: false,
      why: "Building the graph needs a model to read every document to extract entities and relations, then more calls to summarise communities. Plain RAG needs only one embedding per chunk." },
    { id: "trap-mq-cost", level: "medium", kind: "trap",
      claim: "Searching several phrasings of a question can raise recall, but every extra phrasing adds search cost and gives less extra recall than the one before.",
      truth: true,
      why: `Even in the best case, with independent misses, ${pct(MP)} per phrasing becomes ${pct(anyHit(MP, 2))} with 2, ${pct(anyHit(MP, 3))} with 3 and ${pct(anyHit(MP, 4))} with 4: smaller gains each time, while each search costs the same.` },
  ],
  real: [
    { who: "Luyu Gao and co-authors", when: "2022",
      what: "\"Precise Zero-Shot Dense Retrieval without Relevance Labels\" introduced HyDE: an instruction-following model writes a hypothetical document for the query, an unsupervised encoder embeds it, and that vector retrieves similar real documents. No relevance labels are needed.",
      takeaway: "A wrong but well-shaped answer can be a better search query than the question itself.",
      url: "https://arxiv.org/abs/2212.10496" },
    { who: "Darren Edge and co-authors", when: "2024",
      what: "\"From Local to Global: A Graph RAG Approach to Query-Focused Summarization\" has a model extract an entity graph from the documents, then precompute summaries of communities of related entities. For a question, each summary gives a partial answer and these are combined. On global questions over datasets of about 1 million tokens, it reported more comprehensive and diverse answers than a conventional RAG baseline.",
      takeaway: "Questions about a whole corpus need an index built for them, not just more chunks.",
      url: "https://arxiv.org/abs/2404.16130" },
  ],
};
