// Stage 7: measuring a RAG system, retrieval and generation apart. Every number below is computed here or in s7.calc.ts.
import type { GModule } from "../../types.ts";
import { dcg, ndcg, precisionAt, recallAt, rr, wilson } from "../../stages/s7.calc.ts";

const r2 = (x: number) => x.toFixed(2);
const r3 = (x: number) => x.toFixed(3);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// the code block's eval set: three queries, retrieved lists and labelled relevant chunks
const EVAL: { q: string; got: string[]; rel: string[] }[] = [
  { q: "refund window for EU customers", got: ["C4", "C1", "C9", "C2", "C7"], rel: ["C1", "C2", "C3"] },
  { q: "what does error E-4021 mean", got: ["C5", "C8", "C6", "C3", "C2"], rel: ["C6"] },
  { q: "who approves a card retry", got: ["C3", "C4", "C1", "C9", "C8"], rel: ["C2", "C10"] },
];
const per = EVAL.map(({ got, rel }) => { const s = new Set(rel); return { rec: recallAt(got, s, 5), rr: rr(got, s), nd: ndcg(got.map((d) => (s.has(d) ? 1 : 0)), rel.map(() => 1)) }; });
const [mRec, mRr, mNd] = [mean(per.map((p) => p.rec)), mean(per.map((p) => p.rr)), mean(per.map((p) => p.nd))];
// numeric: recall@5 with 2 of 4 relevant found
const [RF, RT, RK] = [2, 4, 5];
// numeric: MRR over three queries, first hits at ranks 1 and 3 and one miss
const HITS = [1, 3, 0], mrr = mean(HITS.map((h) => (h ? 1 / h : 0)));
// numeric: DCG of grades [3, 2, 0]
const G = [3, 2, 0], dcgG = dcg(G);
// output: precision@4
const PG = ["a", "b", "c", "d"], PR = new Set(["b", "d", "x"]), p4 = precisionAt(PG, PR, 4);
// trap: noise on 50 questions
const [TN, TP, TNEW] = [50, 0.8, 0.84], [tlo, thi] = wilson(TP, TN);

export const RAG_EVALS: GModule = {
  id: "rag-evals",
  stage: 7,
  title: "RAG evals",
  hook: "\"It looks right\" does not survive the next change to chunking, embeddings or prompts. A small labelled set of questions, scored separately for retrieval and for the answer, tells you what broke and where.",
  blocks: [
    { kind: "figure", id: "s7-diagnose", caption: "Two checks per question sort every failure into one box. Each box points to a different part of the pipeline to fix." },
    { kind: "text", md: "**Score the two halves apart.** Retrieval metrics ask whether the right chunks reached the prompt; they need questions labelled with the chunks that answer them. Generation metrics ask whether the answer is supported by those chunks (faithfulness), answers what was asked (relevance), and matches a reference answer (correctness)." },
    { kind: "flow", id: "g-recall" },
    {
      kind: "predict",
      q: "Retrieval recall@5 on your eval set is 0.95, yet users say answers are often wrong. Where do you look first?",
      answer: "Generation: the prompt, the order and amount of context, and whether answers stay faithful to it",
      wrong: ["Retrieval: swap in a bigger embedding model", "Chunking: make the chunks smaller", "The eval set: recall that high must be a labelling bug"],
      why: "The right chunks already reach the prompt 95% of the time, so the failure happens after retrieval. Score faithfulness and correctness on the failing cases, and check for long, noisy context and missing \"say you do not know\" rules.",
    },
    { kind: "flow", id: "s7-ndcg" },
    { kind: "play", id: "s7-eval-ci" },
    {
      kind: "mermaid",
      src: `flowchart TB
  A["a wrong answer"]:::bad --> B["was the fact in the parsed text?"]
  B -- no --> B1["fix parsing"]:::warn
  B -- yes --> C["was its chunk in the top k?"]
  C -- no --> C1["fix chunking, search, query"]:::warn
  C -- yes --> D["was the answer faithful to it?"]
  D -- no --> D1["fix prompt, context, model"]:::warn
  D -- yes --> E["check the label itself"]:::ok`,
      caption: "Walk the pipeline in order. The first step that fails is the one to fix.",
    },
    {
      kind: "code",
      run: true,
      src: `import math

# each eval item: retrieved chunk ids (best first) and the labelled relevant ids
evals = [${EVAL.map((e) => `\n    (${JSON.stringify(e.got)}, ${JSON.stringify(e.rel)}),   # ${e.q}`).join("")}
]

def recall_at(got, rel, k=5):
    return len(set(got[:k]) & set(rel)) / len(rel)

def reciprocal_rank(got, rel):
    return next((1 / i for i, d in enumerate(got, 1) if d in rel), 0.0)

def ndcg_at(got, rel, k=5):                 # binary grades: 1 if relevant
    dcg = sum(1 / math.log2(i + 1) for i, d in enumerate(got[:k], 1) if d in rel)
    ideal = sum(1 / math.log2(i + 1) for i in range(1, min(len(rel), k) + 1))
    return dcg / ideal

scores = [(recall_at(g, r), reciprocal_rank(g, r), ndcg_at(g, r)) for g, r in evals]
avg = [round(sum(s[j] for s in scores) / len(scores), 3) for j in range(3)]
print("recall@5, MRR, nDCG@5:", avg)
assert avg == [${r3(mRec)}, ${r3(mRr)}, ${r3(mNd)}]
assert scores[2] == (0, 0, 0)               # query 3 found nothing: look at it first
`,
    },
  ],
  keyPoints: [
    "Measure retrieval and generation separately, so a bad answer points to the half that failed.",
    "Recall@k asks whether the right chunks reached the prompt; MRR rewards the first right chunk ranking high; nDCG uses graded relevance and order.",
    "Faithfulness checks that every claim is supported by the retrieved text; correctness compares with a reference answer.",
    "Build 50 to 200 real questions with labelled chunks, including unanswerable and exact-ID cases; check every label by hand.",
    "Small eval sets are noisy: on 50 questions a change of a few points can be chance, so compare on the same questions and grow the set.",
  ],
  questions: [
    { id: "separate", level: "easy", kind: "concept",
      q: "Why score retrieval and generation separately in a RAG system?",
      answer: "So a wrong answer can be traced to the half that failed: the search or the model's use of what it found",
      wrong: ["Because generation cannot be measured at all", "Because retrieval metrics are cheaper, so only they matter", "Because the two always fail together"],
      why: "An end-to-end score drops for many reasons. Knowing whether the right chunk was retrieved splits the problem in two, and each half has different fixes." },
    { id: "recall-def", level: "easy", kind: "concept",
      q: "What does recall@5 measure for one question?",
      answer: "The share of its relevant chunks that appear in the top 5 results",
      wrong: ["The share of the top 5 results that are relevant", "The rank of the first relevant chunk", "Whether the final answer is correct"],
      why: "Recall asks how much of what you needed you found. The share of the top 5 that is relevant is precision@5; the first hit's rank feeds MRR." },
    { id: "mrr-def", level: "medium", kind: "concept",
      q: "Two retrievers both have recall@5 of 1.0 on a question. Retriever A puts the right chunk at rank 1, B at rank 4. Which metric tells them apart?",
      answer: "MRR: A scores 1 and B scores 0.25",
      wrong: ["Recall@5, if you round it", "Precision@5: A scores higher", "None; they are equally good"],
      why: "Reciprocal rank is 1 / rank of the first relevant result, so it rewards putting the answer near the top. Precision@5 is the same for both, since each has one relevant chunk in the five." },
    { id: "ndcg-when", level: "medium", kind: "concept",
      q: "When is nDCG more useful than recall@k?",
      answer: "When chunks are graded (exact answer, partly relevant, related) and their order matters",
      wrong: ["When each question has exactly one relevant chunk and order does not matter", "When you have no labels at all", "When you only care whether the answer text is fluent"],
      why: "nDCG gives each result its grade, discounted by rank, and divides by the best possible order. Recall counts relevant chunks equally and ignores where they sit." },
    { id: "faithful-def", level: "medium", kind: "concept",
      q: "What does a faithfulness (groundedness) score check?",
      answer: "That every claim in the answer is supported by the retrieved context",
      wrong: ["That the answer matches the reference answer word for word", "That the retrieved chunks are relevant to the question", "That the answer is polite and on brand"],
      why: "Faithfulness compares the answer with the context the model was given. An answer can be faithful and still wrong if the context is wrong, which is why correctness is a separate score." },
    { id: "judge-bias", level: "hard", kind: "concept",
      q: "An LLM judge compares two answers and prefers whichever is shown first more often than chance. What is the standard fix?",
      answer: "Judge each pair twice with the order swapped, and count a win only when both orders agree",
      wrong: ["Always show the better answer first", "Raise the judge's temperature", "Ask the judge to be fair in the prompt"],
      why: "That is position bias. Swapping cancels it out. Check the judge against a few dozen human labels too, since judges also favour longer answers and their own model family." },
    { id: "golden", level: "medium", kind: "concept",
      q: "Which eval set will catch the most real problems?",
      answer: "Real user questions, each labelled with its relevant chunks, including unanswerable and exact-ID cases",
      wrong: ["Questions a model generated from each chunk, with no human check", "The 20 questions the team finds easiest to answer", "Questions copied from a public benchmark"],
      why: "Real questions carry the wording, typos and follow-ups your users actually send. Model-written drafts are fine as a start, but a human must check every label." },
    { id: "recall-num", level: "easy", kind: "numeric",
      q: `A question has ${RT} relevant chunks. The top ${RK} results contain ${RF} of them. What is recall@${RK}?`,
      answer: r2(RF / RT), wrong: [r2(RF / RK), r2(RF / (RT - 1)), r2(1)],
      why: `Recall = found / relevant = ${RF} / ${RT} = ${r2(RF / RT)}. ${r2(RF / RK)} is ${RF} / ${RK}, the precision@${RK}.` },
    { id: "mrr-num", level: "medium", kind: "numeric",
      q: `Over ${HITS.length} questions, the first relevant chunk is at rank ${HITS[0]}, at rank ${HITS[1]}, and never found. What is the MRR?`,
      answer: r2(mrr), wrong: [r2(mean(HITS.filter(Boolean).map((h) => 1 / h))), r2(1 / mean(HITS.filter(Boolean))), r2(mean(HITS))],
      why: `Reciprocal ranks ${HITS.map((h) => (h ? `1/${h}` : "0")).join(", ")}; their mean is ${r2(mrr)}. Dropping the miss gives ${r2(mean(HITS.filter(Boolean).map((h) => 1 / h)))}, which hides the failure.` },
    { id: "dcg-num", level: "hard", kind: "numeric",
      q: `The top ${G.length} results have relevance grades ${G.join(", ")}. With DCG = sum of grade / log2(rank + 1), what is the DCG?`,
      answer: r2(dcgG), wrong: [r2(G.reduce((a, b) => a + b, 0)), r2(G[0] + G[1] / 2), r2(G[0])],
      why: `${G[0]} / log2(2) + ${G[1]} / log2(3) + ${G[2]} / log2(4) = ${G[0]} + ${r2(G[1] / Math.log2(3))} + 0 = ${r2(dcgG)}. Without the discount it would be ${G.reduce((a, b) => a + b, 0)}.` },
    { id: "p4-out", level: "easy", kind: "output",
      q: "What does this print?",
      code: `got = [${PG.map((x) => `"${x}"`).join(", ")}]\nrel = {${[...PR].map((x) => `"${x}"`).join(", ")}}\nprint(len([d for d in got[:4] if d in rel]) / 4)`,
      answer: String(p4), wrong: [String(PG.filter((d) => PR.has(d)).length / PR.size), "2", "0.25"],
      why: `${PG.filter((d) => PR.has(d)).join(" and ")} of the top 4 are relevant: ${PG.filter((d) => PR.has(d)).length} / 4 = ${p4}, the precision@4. Recall would divide by the ${PR.size} relevant items instead.` },
    { id: "recall-high", level: "medium", kind: "explain",
      q: "Recall@5 is 0.95 but users say answers are wrong. Where do you look, and how?",
      answer: "Retrieval is working, so look at generation. Take the failing questions and check faithfulness: are the claims supported by the chunks that were retrieved? Check whether the context is too long or badly ordered, whether a contradicting chunk confused the model, whether the prompt asks for citations and allows \"I do not know\", and whether chunks lack the surrounding context needed to read them. Also re-check a few labels: a relevant chunk may be outdated." },
    { id: "ci-gate", level: "hard", kind: "explain",
      q: "How do you stop a change to chunking or prompts from quietly making RAG worse?",
      answer: "- Keep a versioned eval set of 50 to 200 labelled real questions, with hard cases: unanswerable, multi-hop, exact IDs.\n- In CI, run retrieval metrics (recall@k, MRR) on every change; they are cheap and need no model.\n- Run generation metrics (faithfulness, correctness) with a judge checked against human labels.\n- Compare against the last release on the same questions, and fail the build when a metric drops by more than the noise of the set.\n- Add every production failure to the set." },
    { id: "unanswerable", level: "medium", kind: "explain",
      q: "Why include questions the documents cannot answer in a RAG eval set?",
      answer: "Retrieval always returns something, so the model always sees some chunks. Without unanswerable cases you never test whether it admits it does not know, or invents an answer from loosely related text.\n\nScore them on whether the system declines or asks for more detail. A drop here often follows prompt changes that push the model to always be helpful." },
    { id: "trap-faithful", level: "easy", kind: "trap",
      claim: "A high faithfulness score means the answers are correct.",
      truth: false,
      why: "Faithfulness only says the answer agrees with the retrieved text. If retrieval brought an outdated policy, a faithful answer repeats the outdated policy. Correctness against reference answers is a separate check." },
    { id: "trap-noise", level: "hard", kind: "trap",
      claim: `On an eval set of ${TN} questions, recall rising from ${Math.round(TP * 100)}% to ${Math.round(TNEW * 100)}% after a change could easily be noise.`,
      truth: true,
      why: `At ${Math.round(TP * 100)}% on ${TN} questions the 95% interval runs from about ${Math.round(tlo * 100)}% to ${Math.round(thi * 100)}%, so ${Math.round(TNEW * 100)}% sits well inside it. Compare old and new on the same questions and look at which ones changed, or grow the set.` },
  ],
  real: [
    { who: "Shahul Es and co-authors", when: "2023",
      what: "\"Ragas: Automated Evaluation of Retrieval Augmented Generation\" proposed a reference-free framework that scores a RAG pipeline without ground-truth human annotations, along three lines: whether retrieval finds relevant, focused context, whether the model uses that context faithfully, and the quality of the generated answer.",
      takeaway: "Splitting a RAG score into retrieval, faithfulness and answer quality is the standard way to find what broke.",
      url: "https://arxiv.org/abs/2309.15217" },
  ],
};
