// Stage 6: deciding what goes into the context window, in what order, and caching the part that never changes. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { BUDGET, fit } from "../../stages/s6.flows.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// numeric: one prefix reused across calls, with one provider's multipliers (most models): write 1.25x, read 0.1x
const [WRITE, READ, PRE, CALLS] = [1.25, 0.1, 10000, 5];
const plain = CALLS * PRE, cached = WRITE * PRE + (CALLS - 1) * READ * PRE;
// numeric: documents that fit under the 60% cap
const B = BUDGET, docs = fit(1).docs, budget = B.window - B.reserve, fixed = B.system + B.tools + B.question;
// output: the 4 characters per token rule
const PHRASE = "refund policy ", REPS = 300, est = Math.floor((PHRASE.length * REPS) / 4);

export const CONTEXT_CACHING: GModule = {
  id: "context-caching",
  stage: 6,
  title: "Context engineering and caching",
  hook: "The context window is a budget, not a bin. Decide what earns a place, put it in an order the model reads well, and pay full price for the part that never changes only once.",
  blocks: [
    { kind: "figure", id: "s6-context-window", caption: "One request's window. Stable parts go first so they can be cached; the question goes last; room for the answer is kept free." },
    { kind: "text", md: "**More context is not free.** Every token costs money and latency, and quality often falls as unrelated text piles up. Models also use the start and end of a long input better than the middle. So: retrieve only what this question needs, trim tool output, summarise old turns, and put the question and key rules last." },
    { kind: "flow", id: "s6-budget" },
    {
      kind: "predict",
      q: "Your system prompt starts with \"Current time: 10:42:07\". Every request reuses the same long system prompt after that line. What cache hit rate do you expect?",
      answer: "Close to zero",
      wrong: ["Close to 100%, because the rest of the prompt is the same", "About 50%", "100% within the same minute"],
      why: "A cache hit needs the prefix to match exactly, from the very first token. The timestamp changes every second and sits at the start, so nothing after it can be reused. Move per-request values after the cached part.",
    },
    { kind: "flow", id: "g-cache" },
    { kind: "play", id: "s6-cache" },
    { kind: "lab", id: "cost" },
    {
      kind: "mermaid",
      src: `flowchart TB
  A["tool definitions: stable, cache"]:::ok --> B["system prompt: role, rules, format: stable, cache"]:::ok
  B --> C["long reference docs: stable per session, cache"]:::ok
  C --> D["summary of older turns"]
  D --> E["recent turns, oldest dropped first"]
  E --> F["chunks retrieved for this question"]:::warn
  F --> G["the question and final instructions, last"]:::hot
  G --> H["room reserved for the answer"]`,
      caption: "The order to build every request. Green parts form the cached prefix; anything that changes per request comes after them.",
    },
    {
      kind: "code",
      run: true,
      src: `# Fit a request into a fixed window: stable parts first, best documents up to a cap, newest history kept.
def tokens(text):                       # rough rule: about 4 characters per token in English
    return max(1, len(text) // 4)

def build(window, reserve, system, tools, docs, history, question, doc_share=0.6):
    budget = window - reserve           # keep room for the answer first
    used = tokens(system) + tokens(tools) + tokens(question)
    kept_docs = []
    for d in docs:                      # docs arrive best first from the retriever
        if used + tokens(d) > budget * doc_share:
            break
        kept_docs.append(d); used += tokens(d)
    kept = []
    for turn in reversed(history):      # newest turns matter most
        if used + tokens(turn) > budget:
            break
        kept.insert(0, turn); used += tokens(turn)
    return {"used": used, "budget": budget, "docs": len(kept_docs), "turns": len(kept)}

plan = build(window=${B.window}, reserve=${B.reserve},
             system="s" * ${B.system * 4}, tools="t" * ${B.tools * 4}, question="q" * ${B.question * 4},
             docs=["d" * ${B.doc * 4}] * ${B.docs}, history=["h" * ${B.exchange * 4}] * 19)
print(plan)
assert plan["used"] <= plan["budget"]
assert plan["docs"] == ${docs} and plan["turns"] == ${fit(20).kept}   # the same numbers as the walk-through above
`,
    },
  ],
  keyPoints: [
    "Context is a budget: reserve room for the answer, cap retrieved text and keep only the best chunks.",
    "Order every request stable first (tools, system prompt, reference docs), then history and retrieved chunks, then the question last.",
    "Prompt caching reuses an exact prefix: one changed token early on, such as a timestamp, and nothing after it hits.",
    "Models use the start and end of a long context better than the middle, so put the question and key rules last.",
    "When history grows, drop the oldest turns or summarise them (compaction); trim tool output to the fields the model needs.",
  ],
  questions: [
    { id: "prefix-match", level: "easy", kind: "concept",
      q: "What must be true for a prompt cache hit?",
      answer: "The prompt must start with exactly the same tokens as the cached prefix",
      wrong: ["The question must be similar in meaning to an earlier one", "The same user must send the request", "The answer must be the same as last time"],
      why: "Prompt caching stores the model's work on a prefix and reuses it only when the new request begins with the identical text, up to the cache breakpoint. Similar meaning does not count; one changed character early on is a miss." },
    { id: "order", level: "easy", kind: "concept",
      q: "In what order should a request's parts go, for caching and for quality?",
      answer: "Tools, system prompt, reference docs, then history, retrieved chunks and the question last",
      wrong: ["The question first, so the model sees it before anything else", "Retrieved chunks first, because they matter most", "Any order; the model reads everything equally"],
      why: "Stable parts first make one long reusable prefix. The question last sits where long-context models pay the most attention, right before they answer." },
    { id: "lost-middle", level: "medium", kind: "concept",
      q: "A key rule sits in the middle of a 50 page context and the model often ignores it. What is the best first fix?",
      answer: "Move the rule next to the question at the end, and cut text the task does not need",
      wrong: ["Write the rule in capital letters where it is", "Switch to a model with an even longer window", "Repeat the whole context twice"],
      why: "Models recall the start and end of long inputs better than the middle. A bigger window does not change that, and repeating everything doubles the cost." },
    { id: "compaction", level: "medium", kind: "concept",
      q: "What is compaction in a long chat?",
      answer: "Replacing older turns with a short summary, keeping recent turns in full",
      wrong: ["Compressing the prompt with gzip before sending it", "Removing the system prompt once the model has seen it", "Shortening each word to save tokens"],
      why: "A summary keeps the facts that matter, like an order number or a decision, in a few hundred tokens. The model reads text, so byte-level compression does not help, and the system prompt must stay because the API is stateless." },
    { id: "jit", level: "medium", kind: "concept",
      q: "You have 2,000 help articles. What usually works better than pasting them all into every request?",
      answer: "Retrieve the few articles relevant to this question, or give the model a search tool",
      wrong: ["Pasting them all, because a bigger context always means a better answer", "Fine-tuning the model on them every week", "Pasting the first 50 articles only"],
      why: "Just-in-time context keeps the window small, cheap and relevant. Pasting everything is costly, slow, and buries the right passage in noise." },
    { id: "trim-tools", level: "easy", kind: "concept",
      q: "A tool returns a 5,000 line JSON record, of which the model needs 3 fields. What should your tool wrapper do?",
      answer: "Return only the 3 fields the model needs",
      wrong: ["Return all of it, so the model has full context", "Return the first 100 lines", "Return a link to the file instead"],
      why: "Tool output goes into the context like any other text and is resent on later turns. Trimming it saves tokens on every call and keeps the useful values easy to find." },
    { id: "per-user", level: "hard", kind: "concept",
      q: "Each request includes the user's name and today's date. Where should they go?",
      answer: "After the cached prefix, near the question",
      wrong: ["At the very top of the system prompt", "Inside the tool definitions", "Nowhere; the model cannot use them"],
      why: "Anything that varies per user or per day breaks every cache hit if it sits before the stable part. Placed after the breakpoint, it costs a few fresh tokens and the long prefix stays shared." },
    { id: "cache-cost", level: "hard", kind: "numeric",
      q: `A ${n0(PRE)} token prefix is reused across ${CALLS} calls inside the cache lifetime. A cache write costs ${WRITE}x the input price and a read ${READ}x. In base-price tokens, what do the ${CALLS} prefixes cost with caching?`,
      answer: n0(cached), wrong: [n0(plain), n0(CALLS * READ * PRE), n0(PRE + (CALLS - 1) * READ * PRE)],
      why: `The first call writes: ${WRITE} × ${n0(PRE)} = ${n0(WRITE * PRE)}. The other ${CALLS - 1} read: ${CALLS - 1} × ${n0(READ * PRE)} = ${n0((CALLS - 1) * READ * PRE)}. Total ${n0(cached)}, against ${n0(plain)} without caching. ${n0(PRE + (CALLS - 1) * READ * PRE)} forgets the write surcharge.` },
    { id: "docs-fit", level: "medium", kind: "numeric",
      q: `Window ${n0(B.window)}, with ${n0(B.reserve)} reserved for the answer. System, tools and question take ${n0(fixed)}. Documents of ${n0(B.doc)} tokens are added, best first, while that running total stays within ${B.docShare * 100}% of the budget. How many fit?`,
      answer: String(docs), wrong: [String(Math.floor((budget * B.docShare) / B.doc)), String(Math.floor((budget - fixed) / B.doc)), String(Math.floor((B.window * B.docShare) / B.doc))],
      why: `The cap is ${B.docShare * 100}% of ${n0(budget)} = ${n0(budget * B.docShare)} tokens for everything so far, and ${n0(fixed)} is already used. ${n0(fixed)} + ${docs} × ${n0(B.doc)} = ${n0(fixed + docs * B.doc)} fits; one more would make ${n0(fixed + (docs + 1) * B.doc)}.` },
    { id: "estimate", level: "easy", kind: "output",
      q: "A quick token estimate. What does this print?",
      code: `text = "${PHRASE}" * ${REPS}\nprint(len(text) // 4)`,
      answer: String(est), wrong: [String(PHRASE.length * REPS), String(REPS * 2), String(REPS)],
      why: `${PHRASE.length} characters × ${REPS} = ${n0(PHRASE.length * REPS)} characters, and about 4 characters per token gives ${n0(est)}. It is a rough rule for English; count with the real tokenizer when the budget is tight.` },
    { id: "zero-hits", level: "medium", kind: "explain",
      q: "Your prompt cache hit rate is near zero. What are the usual causes?",
      answer: "Something early in the prompt changes on every call: a timestamp, a request id or user name in the system prompt, tools listed in a different order, JSON with unsorted keys, or retrieved documents placed before the stable instructions.\n\nOther causes: the prefix is shorter than the provider's minimum cacheable length, or calls come further apart than the cache lifetime. Fix it by moving everything that varies after the breakpoint and checking the cache read counts in the usage data." },
    { id: "history-full", level: "medium", kind: "explain",
      q: "In a long chat, history is filling the window. What are your options?",
      answer: "- Keep a sliding window of the most recent turns.\n- Summarise older turns into a short running note (compaction).\n- Store durable facts in long-term memory and retrieve them when relevant.\n- Trim tool results to the fields the model needs.\n- Never drop the system prompt or the current question." },
    { id: "chatbot-cost", level: "hard", kind: "explain",
      q: "Design an internal chatbot for 10,000 employees. Where does history live, and how do you cap cost?",
      answer: "Store conversations in your own database, keyed by user and thread. Each turn, rebuild the context from the system prompt, a summary of older turns and the last few turns.\n\nCap cost with prompt caching for the stable prefix, a max_tokens limit, routing simple questions to a small model, per-user rate limits, and a dashboard of tokens per user per day so you see spikes early." },
    { id: "trap-time-top", level: "easy", kind: "trap",
      claim: "Putting the current time at the top of the system prompt does not affect caching.",
      truth: false,
      why: "The cache matches an exact prefix from the first token. A value that changes every call at the very top means every call misses." },
    { id: "trap-paste-all", level: "medium", kind: "trap",
      claim: "With a large enough context window, pasting everything in gives answers as good as careful selection.",
      truth: false,
      why: "Long contexts cost more, run slower, and models use information in the middle less reliably. Selecting the relevant text usually beats a full window on quality too." },
    { id: "trap-one-reuse", level: "hard", kind: "trap",
      claim: `If a cache write costs ${WRITE}x and a read ${READ}x the input price, caching a prefix that is used just twice is already cheaper than not caching.`,
      truth: true,
      why: `Two calls cost ${WRITE} + ${READ} = ${(WRITE + READ).toFixed(2)} prefix-prices with caching, against 2 without. Every further reuse saves another ${(1 - READ).toFixed(1)}.` },
  ],
  real: [
    { who: "Nelson F. Liu and co-authors", when: "2023",
      what: "\"Lost in the Middle: How Language Models Use Long Contexts\" moved the relevant passage around inside long inputs. Models did best when it sat near the beginning or the end, and performance dropped clearly when it was in the middle, even for models built for long contexts.",
      takeaway: "Where you put information in the window matters, not just whether it is there.",
      url: "https://arxiv.org/abs/2307.03172" },
    { who: "A model provider's prompt caching documentation", when: "2026",
      what: "The docs say cache hits need 100% identical prompt segments up to the marked block. A cache write with the default 5 minute lifetime costs 1.25 times the base input price, a read costs 0.1 times for most models, and each use refreshes the lifetime at no cost.",
      takeaway: "Caching pays from the first reuse, but only for a byte-identical prefix used again within the lifetime.",
      url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
  ],
};
