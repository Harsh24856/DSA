// Gen AI reference pages: interview prep, system design, capstone projects, glossary and resources.
// Moved from the old playbook HTML (written for this site) into typed data; rendered by components/genai2/ExtraView.tsx.
import type { ExtraPage } from "./types.ts";

export const INTERVIEW: ExtraPage = {
 "id": "interview",
 "title": "Top Gen AI engineer interview questions",
 "eyebrow": "Interview prep",
 "lede": "Short answers you should be able to give from memory. Open each one only after answering it out loud.",
 "sections": [
  {
   "tag": "Fundamentals + LLM internals · 1–12",
   "title": "How models work",
   "blocks": [],
   "questions": [
    {
     "id": "q1",
     "level": "medium",
     "kind": "explain",
     "q": "Explain self-attention to a non-ML engineer.",
     "answer": "Each word asks \"which other words matter for understanding me?\", scores every other word, and takes a weighted average of their information. Doing this in parallel for all words, many times over, builds up meaning."
    },
    {
     "id": "q2",
     "level": "medium",
     "kind": "explain",
     "q": "Why scale attention scores by √d_k?",
     "answer": "To keep dot products from growing with dimension. Otherwise softmax saturates to one-hot and gradients vanish."
    },
    {
     "id": "q3",
     "level": "medium",
     "kind": "explain",
     "q": "Encoder-only vs decoder-only vs encoder-decoder?",
     "answer": "Bidirectional understanding (BERT: embeddings, classification); causal generation (GPT-style LLMs); separate input reading and output generation joined by cross-attention (T5, Whisper)."
    },
    {
     "id": "q4",
     "level": "medium",
     "kind": "explain",
     "q": "What is the KV cache and why does it limit concurrency?",
     "answer": "Stored keys and values of past tokens, which avoid recomputation during decoding. It grows with context length × batch size and competes with weights for GPU memory, which caps how many users fit."
    },
    {
     "id": "q5",
     "level": "medium",
     "kind": "explain",
     "q": "What is RoPE?",
     "answer": "Rotary position embeddings rotate query and key vectors by a position-dependent angle, so attention depends on relative distance. It can be scaled for longer contexts."
    },
    {
     "id": "q6",
     "level": "medium",
     "kind": "explain",
     "q": "What are GQA and MQA for?",
     "answer": "Sharing K/V heads across query heads to shrink the KV cache and speed up decoding, with little quality loss (GQA) or a bit more loss (MQA)."
    },
    {
     "id": "q7",
     "level": "medium",
     "kind": "explain",
     "q": "Temperature vs top-p?",
     "answer": "Temperature rescales the whole distribution (sharper or flatter). Top-p cuts the tail to the smallest set of tokens covering probability p. Both trade determinism for diversity."
    },
    {
     "id": "q8",
     "level": "medium",
     "kind": "explain",
     "q": "Why do LLMs hallucinate?",
     "answer": "They are trained to produce plausible continuations, not verified facts. Gaps in knowledge, pressure to always answer, and training that rewards confident answers all contribute. Mitigate with retrieval, citations, permission to say \"I don't know\", verification steps and evals."
    },
    {
     "id": "q9",
     "level": "medium",
     "kind": "explain",
     "q": "What are scaling laws, and what did Chinchilla show?",
     "answer": "Loss falls predictably as a power law with parameters, data and compute. Chinchilla showed many models were undertrained: compute-optimal training uses about 20 tokens per parameter. Today, smaller models are deliberately trained far longer to make inference cheap."
    },
    {
     "id": "q10",
     "level": "medium",
     "kind": "explain",
     "q": "What is a Mixture of Experts model?",
     "answer": "Each layer has many FFN experts and a router sends each token to a few of them. Total parameters are large but active parameters per token are small: big capacity, moderate compute, high memory."
    },
    {
     "id": "q11",
     "level": "medium",
     "kind": "explain",
     "q": "How are reasoning models trained?",
     "answer": "On top of SFT, with reinforcement learning on tasks whose answers can be checked automatically (math, code, puzzles). The model is rewarded for correct final answers and learns to write long, self-correcting chains of thought. More thinking at inference time gives better results."
    },
    {
     "id": "q12",
     "level": "medium",
     "kind": "explain",
     "q": "What does FlashAttention optimize?",
     "answer": "Memory traffic. It computes exact attention in tiles inside fast on-chip memory without writing the full score matrix to slow GPU memory. It is faster, with linear memory."
    }
   ]
  },
  {
   "tag": "Building with LLMs · 13–28",
   "title": "RAG, agents and fine-tuning",
   "blocks": [],
   "questions": [
    {
     "id": "q13",
     "level": "medium",
     "kind": "explain",
     "q": "Walk me through a RAG pipeline end to end.",
     "answer": "Parse → chunk with metadata → embed → index (vector + BM25). At query time: rewrite → hybrid retrieve → rerank → build a prompt with sources → generate with citations → validate. Evaluate retrieval and generation separately."
    },
    {
     "id": "q14",
     "level": "medium",
     "kind": "explain",
     "q": "How do you evaluate a RAG system?",
     "answer": "A golden set of real questions with relevant chunks and reference answers. Retrieval: recall@k and MRR. Generation: faithfulness, relevance and correctness via an LLM judge calibrated against human labels. Run it in CI and on sampled production traffic."
    },
    {
     "id": "q15",
     "level": "medium",
     "kind": "explain",
     "q": "Why use hybrid search?",
     "answer": "Dense search captures meaning but misses exact terms (IDs, names, codes). BM25 catches those. Fusing both with RRF beats either one alone on most real corpora."
    },
    {
     "id": "q16",
     "level": "medium",
     "kind": "explain",
     "q": "What does a reranker add?",
     "answer": "A cross-encoder scores each (query, chunk) pair jointly, which is much more accurate than vector similarity. Run it on the top 30–50 candidates to pick the best 3–8."
    },
    {
     "id": "q17",
     "level": "medium",
     "kind": "explain",
     "q": "How do you handle document permissions in RAG?",
     "answer": "Store ACL metadata per chunk and filter at retrieval time using the user's identity, so unauthorized text never reaches the model. Never filter after generation."
    },
    {
     "id": "q18",
     "level": "medium",
     "kind": "explain",
     "q": "Long context vs RAG?",
     "answer": "Long context is simple for a few documents but costs more per query, is slower, and recall drops mid-context. RAG scales to huge corpora, adds citations and permissions, and is cheaper. They are often combined: retrieve, then use a generous context."
    },
    {
     "id": "q19",
     "level": "medium",
     "kind": "explain",
     "q": "What is the difference between a workflow and an agent?",
     "answer": "In a workflow, code fixes the sequence of LLM calls. In an agent, the LLM chooses the next action in a loop. Prefer workflows when the path is known; use agents for open-ended tasks."
    },
    {
     "id": "q20",
     "level": "medium",
     "kind": "explain",
     "q": "How does function calling work?",
     "answer": "You send tool schemas. The model replies with a structured tool call (name + JSON arguments). Your code executes it and sends back a tool result. Loop until the model gives a final answer."
    },
    {
     "id": "q21",
     "level": "medium",
     "kind": "explain",
     "q": "What is MCP and why does it matter?",
     "answer": "An open protocol that standardizes how AI apps connect to tools and data (tools, resources, prompts over stdio or HTTP). Build one server and any MCP-capable host can use it."
    },
    {
     "id": "q22",
     "level": "medium",
     "kind": "explain",
     "q": "How do you make an agent safe and reliable?",
     "answer": "Step and cost limits, least-privilege tools, sandboxed execution, human approval for irreversible actions, untrusted-content handling, full trajectory logging, and a task-success eval suite."
    },
    {
     "id": "q23",
     "level": "medium",
     "kind": "explain",
     "q": "When should you fine-tune?",
     "answer": "After prompting and RAG fall short: to get consistent format or style, to make a small model match a big one on a narrow task, to learn domain language, or to cut prompt length and cost at scale. Not for facts that change."
    },
    {
     "id": "q24",
     "level": "medium",
     "kind": "explain",
     "q": "Explain LoRA.",
     "answer": "Freeze the weights and learn a low-rank update ΔW = B·A (rank r ≪ d) on selected layers. Under 1% of parameters train, adapters are tiny, and they can be merged or swapped."
    },
    {
     "id": "q25",
     "level": "medium",
     "kind": "explain",
     "q": "Explain QLoRA.",
     "answer": "LoRA on a base model stored in 4-bit NF4, with double quantization and paged optimizers. It fine-tunes 7–70B models on one GPU with little quality loss."
    },
    {
     "id": "q26",
     "level": "medium",
     "kind": "explain",
     "q": "DPO vs RLHF?",
     "answer": "RLHF trains a reward model on preferences, then runs PPO with a KL penalty. DPO optimizes the policy directly on preference pairs with a closed-form loss: simpler, stabler, cheaper."
    },
    {
     "id": "q27",
     "level": "medium",
     "kind": "explain",
     "q": "What is GRPO?",
     "answer": "A PPO variant that samples a group of answers per prompt and uses the group-normalized reward as the advantage. There is no critic network. It is used with verifiable rewards to train reasoning."
    },
    {
     "id": "q28",
     "level": "medium",
     "kind": "explain",
     "q": "How do you get reliable structured output?",
     "answer": "Use schema-constrained structured outputs or strict tool schemas, validate with Pydantic, give enum fields and an explicit \"not found\" option, and retry with the validation error on failure."
    }
   ]
  },
  {
   "tag": "Production · 29–40",
   "title": "Serving, ops and security",
   "blocks": [],
   "questions": [
    {
     "id": "q29",
     "level": "medium",
     "kind": "explain",
     "q": "Prefill vs decode?",
     "answer": "Prefill processes the prompt in parallel, is compute-bound, and sets TTFT. Decode generates token by token, is memory-bandwidth-bound, and sets tokens per second."
    },
    {
     "id": "q30",
     "level": "medium",
     "kind": "explain",
     "q": "How do you reduce LLM latency?",
     "answer": "Stream; shorten prompts; prompt or prefix caching; use a smaller or faster model or lower effort; speculative decoding; quantization; parallelize independent calls; cache responses; put servers near users."
    },
    {
     "id": "q31",
     "level": "medium",
     "kind": "explain",
     "q": "How do you reduce LLM cost?",
     "answer": "Caching, routing to small models, batch APIs, trimming context and tool output, capping output tokens, fine-tuning a small model for high-volume tasks, and tracking cost per feature."
    },
    {
     "id": "q32",
     "level": "medium",
     "kind": "explain",
     "q": "What is quantization and what are the trade-offs?",
     "answer": "Storing weights (and sometimes activations or the KV cache) in fewer bits (FP8, INT8, INT4). Less memory and faster decode, with some quality loss that depends on the method (AWQ/GPTQ calibration helps) and the task. Always re-run evals."
    },
    {
     "id": "q33",
     "level": "medium",
     "kind": "explain",
     "q": "Why is vLLM fast?",
     "answer": "PagedAttention manages the KV cache with little waste, and continuous batching keeps the GPU full. Prefix caching and optimized kernels add more."
    },
    {
     "id": "q34",
     "level": "medium",
     "kind": "explain",
     "q": "What do you log for an LLM app?",
     "answer": "Prompt version, inputs, retrieved docs, tool calls, outputs, tokens, latency, cost, model, errors, and user feedback, all linked in one trace per request (with PII handled)."
    },
    {
     "id": "q35",
     "level": "medium",
     "kind": "explain",
     "q": "What is prompt injection, and how do you defend against it?",
     "answer": "Untrusted text that tries to override instructions, either directly from the user or indirectly via documents, web pages or tool output. Defend in layers: separate and label untrusted data, least privilege, human approval, output validation, monitoring. Assume prompts alone won't stop it."
    },
    {
     "id": "q36",
     "level": "medium",
     "kind": "explain",
     "q": "How do you test LLM features in CI?",
     "answer": "A versioned eval set with code-checkable assertions (schema valid, contains a citation, correct label) plus LLM-judge scores with thresholds. Fail the build on regressions. Cache model calls for cheap reruns."
    },
    {
     "id": "q37",
     "level": "medium",
     "kind": "explain",
     "q": "How do you pick an embedding model?",
     "answer": "Shortlist from the MTEB retrieval leaderboard by size, language and licence, then measure recall@k on your own labelled queries. Weigh dimensions (storage), latency and cost."
    },
    {
     "id": "q38",
     "level": "medium",
     "kind": "explain",
     "q": "How do you evaluate an LLM-as-judge?",
     "answer": "Label 50–100 examples by hand and measure the judge's agreement with them. Control for position bias (swap order) and verbosity bias. Use a clear rubric with structured output, and re-check it whenever you change the judge model."
    },
    {
     "id": "q39",
     "level": "medium",
     "kind": "explain",
     "q": "API model or self-hosted open model?",
     "answer": "Weigh data rules, quality needed, volume and utilization, latency, ops capacity, customization needs and lock-in. Hybrid setups are common."
    },
    {
     "id": "q40",
     "level": "medium",
     "kind": "explain",
     "q": "Tell me about a time an LLM feature failed in production.",
     "answer": "Prepare a real story from your projects: the symptom, how traces and evals found the root cause (often retrieval or a prompt change), the fix, and the guardrail or test you added so it couldn't recur."
    }
   ]
  },
  {
   "tag": "Model answers · say it in 60 seconds",
   "title": "Eight answers worth rehearsing out loud",
   "blocks": [
    {
     "kind": "text",
     "md": "Structure each answer as: one-line definition, how it works, one trade-off, one example from your own work."
    }
   ],
   "questions": [
    {
     "id": "q41",
     "level": "medium",
     "kind": "explain",
     "q": "Walk me through how RAG works and where it fails.",
     "answer": "RAG retrieves relevant chunks from your documents and puts them in the prompt so the model answers from them with citations. Offline: parse, chunk, embed, index. Online: retrieve with hybrid search, rerank, generate. It fails at parsing, retrieval (measured by recall@k), ranking, or generation (faithfulness), so I debug by checking each stage on failing questions."
    },
    {
     "id": "q42",
     "level": "medium",
     "kind": "explain",
     "q": "Explain attention and why it is O(n²).",
     "answer": "Each token makes a query, key and value. A token's query is compared with every key, softmax turns the scores into weights, and the output is the weighted sum of values. Every pair of tokens gets a score, so n tokens need n² scores; FlashAttention computes them in tiles to avoid storing the n × n matrix, but the compute is still quadratic."
    },
    {
     "id": "q43",
     "level": "medium",
     "kind": "explain",
     "q": "Prompting vs RAG vs fine-tuning: how do you choose?",
     "answer": "Start with prompting. Add RAG when the model lacks knowledge or the knowledge changes. Fine-tune when you need a consistent behaviour, format or style the prompt cannot reliably produce, or to make a small model do one task cheaply. Knowledge goes in retrieval; behaviour goes in weights."
    },
    {
     "id": "q44",
     "level": "medium",
     "kind": "explain",
     "q": "What is the KV cache and why does it matter for serving?",
     "answer": "During generation each new token needs the keys and values of all earlier tokens; the KV cache stores them so they are not recomputed. It makes decoding fast but grows with context length times concurrent users, so it, not the weights, often limits how many users a GPU can serve. GQA, paging and quantization shrink it."
    },
    {
     "id": "q45",
     "level": "medium",
     "kind": "explain",
     "q": "How do you evaluate an LLM application?",
     "answer": "A versioned test set of real inputs with expected outputs or rubrics; automatic metrics where possible (exact match, schema validity, recall@k), an LLM judge calibrated against human labels for open-ended quality, and online signals (feedback, escalations). Run it in CI so every prompt or model change shows its effect."
    },
    {
     "id": "q46",
     "level": "medium",
     "kind": "explain",
     "q": "What is an agent, and when should you not build one?",
     "answer": "An LLM in a loop that chooses tools until a goal is met. Do not build one when the steps are known in advance: a fixed workflow is cheaper, faster and easier to test. Use an agent when the path genuinely depends on intermediate results, and add step caps, approvals and evals."
    },
    {
     "id": "q47",
     "level": "medium",
     "kind": "explain",
     "q": "How does LoRA work and why is it so cheap?",
     "answer": "LoRA freezes the original weights and learns a low-rank update B·A beside each targeted matrix. With rank 16 on a 4096 × 4096 layer that is 131k trainable numbers instead of 16.8 million, so gradients and optimizer state are tiny; QLoRA also stores the frozen base in 4 bits, so a 7B model fits on one consumer GPU."
    },
    {
     "id": "q48",
     "level": "medium",
     "kind": "explain",
     "q": "How do you defend against prompt injection?",
     "answer": "Assume it will sometimes succeed and limit the damage: least-privilege tools acting with the user's permissions, untrusted text clearly marked as data, human approval for irreversible actions, output validation and allow-listed destinations, and monitoring of tool calls. Prompt wording alone is not a defence."
    }
   ]
  }
 ]
};

export const DESIGN: ExtraPage = {
 "id": "design",
 "title": "Gen AI system design cheat sheet",
 "eyebrow": "System design",
 "lede": "A repeatable structure for 45-minute design interviews and real project kickoffs.",
 "sections": [
  {
   "tag": "Framework · answer in this order",
   "title": "Eight steps",
   "blocks": [
    {
     "kind": "mermaid",
     "src": "flowchart LR\n  A[\"1 · Requirements<br/>users, tasks, scale\"] --> B[\"2 · Success metrics<br/>quality, latency, cost\"]\n  B --> C[\"3 · Simplest design<br/>prompt / RAG / workflow\"]\n  C --> D[\"4 · Data + retrieval\"]\n  D --> E[\"5 · Model choice<br/>+ routing\"]\n  E --> F[\"6 · Evals<br/>offline + online\"]\n  F --> G[\"7 · Serving + scaling<br/>cache, batch, fallback\"]\n  G --> H[\"8 · Safety + monitoring\"]",
     "caption": ""
    },
    {
     "kind": "text",
     "md": "**Questions to ask first**\n\n- Who are the users, and how many requests per day and at peak?\n- What does a good answer look like? Who judges it?\n- Latency target (chat feel vs a batch job)? Cost per request budget?\n- Data: where does it live, how fresh must it be, who may see what?\n- Compliance: PII, data residency, audit logs?\n- What happens when the model is wrong? Is a human in the loop?"
    },
    {
     "kind": "text",
     "md": "**Numbers to know**\n\n- 1 token ≈ 4 characters ≈ ¾ of an English word.\n- Typical chat TTFT target: under 1–2 s. Voice: start speaking within about 1 s.\n- Weights: params × bytes (bf16 = 2, int4 ≈ 0.5).\n- KV cache: 2 × layers × kv_heads × head_dim × tokens × bytes.\n- Cost = input tokens × input price + output tokens × output price. Output usually costs several times more per token."
    }
   ]
  },
  {
   "tag": "Common prompts · practise these four",
   "title": "Design exercises",
   "blocks": [
    {
     "kind": "compare",
     "head": [
      "System",
      "Core design",
      "Hard parts to discuss"
     ],
     "rows": [
      [
       "Customer support bot",
       "RAG over help docs + ticket tools + handoff to a human",
       "Hallucinated policies, refunds needing approval, escalation, CSAT eval"
      ],
      [
       "Enterprise document Q&A",
       "Ingestion pipeline, hybrid RAG with ACLs, citations",
       "Permissions, freshness, tables and scans, multi-tenant scale"
      ],
      [
       "Coding assistant",
       "Repo indexing (code-aware chunks, symbols) + agent with file and test tools in a sandbox",
       "Context selection, running tests safely, diff review, latency"
      ],
      [
       "Meeting summarizer",
       "ASR + diarization → structured LLM summary → integrations",
       "Long transcripts (chunk + merge), speaker accuracy, privacy"
      ],
      [
       "Content moderation",
       "Cheap classifier first, LLM for borderline cases, human review queue",
       "Throughput, cost, appeals, adversarial users, multilingual"
      ]
     ]
    }
   ]
  },
  {
   "tag": "Worked design · 1 a support chatbot for 50,000 users",
   "title": "RAG chatbot: requirements to numbers to boxes",
   "blocks": [
    {
     "kind": "text",
     "md": "**Requirements**\n\n- 50,000 daily users, about 4 questions each, answers from 20,000 help articles.\n- First token under 2 s, cited answers, hand-off to a human when unsure.\n- Articles change daily; cost under a fixed monthly budget."
    },
    {
     "kind": "mermaid",
     "src": "flowchart TB\n  CMS[\"help articles (CMS)\"] -->|\"webhook on change\"| ING[\"ingest worker: chunk, embed, upsert\"]\n  ING --> VS[(\"vector + BM25 index\")]\n  U[\"user\"] --> API[\"chat API, streaming\"]\n  API --> R[\"retriever + reranker\"]\n  VS --> R\n  R --> L[\"LLM with a cached system prompt\"]:::hot\n  L --> C{\"confident?\"}\n  C -->|\"yes\"| A[\"answer; traces and feedback logged\"]:::ok\n  C -->|\"no\"| H[\"human agent queue\"]:::warn",
     "caption": "Freshness comes from event-driven re-indexing, not periodic full rebuilds."
    },
    {
     "kind": "text",
     "md": "**Key decisions**\n\n- RAG, not fine-tuning: knowledge changes daily and answers need citations.\n- Hybrid retrieval + reranker: product names and error codes need BM25.\n- Prompt caching on the stable system prompt and tools; small model for greetings and FAQs."
    },
    {
     "kind": "code",
     "src": "# Back-of-envelope sizing for a RAG chatbot: the numbers an interviewer expects you to work out aloud.\nusers_per_day = 50_000\nquestions_per_user = 4\npeak_factor = 3                      # peak traffic vs the daily average\nin_tokens, out_tokens = 3_000, 300   # prompt (system + retrieved chunks + question) and answer\n\nqps_avg = users_per_day * questions_per_user / 86_400\nqps_peak = qps_avg * peak_factor\ntok_out_per_s = qps_peak * out_tokens                     # generation throughput needed at peak\nmonthly_in = users_per_day * questions_per_user * in_tokens * 30\nmonthly_out = users_per_day * questions_per_user * out_tokens * 30\n\nprice_in, price_out = 3 / 1e6, 15 / 1e6                   # example API prices per token; check current ones\ncost = monthly_in * price_in + monthly_out * price_out\ncached = monthly_in * 0.7 * price_in * 0.1 + monthly_in * 0.3 * price_in + monthly_out * price_out   # 70% of prompt cached\n\nprint(f\"average {qps_avg:.1f} req/s, peak {qps_peak:.1f} req/s, {tok_out_per_s:,.0f} output tokens/s at peak\")\nprint(f\"monthly tokens: {monthly_in / 1e9:.1f}B in, {monthly_out / 1e9:.2f}B out\")\nprint(f\"API cost ~${cost:,.0f}/month, ~${cached:,.0f} with 70% of the prompt cached\")\nassert 2 < qps_avg < 3 and cached < cost",
     "run": true
    },
    {
     "kind": "text",
     "md": "**Check yourself**"
    }
   ],
   "questions": [
    {
     "id": "q1",
     "level": "medium",
     "kind": "explain",
     "q": "The cost estimate is over budget. Which levers do you pull, in order?",
     "answer": "Cache the stable prompt prefix (often the biggest win), retrieve fewer and shorter chunks, route simple questions to a smaller model, cap output length, and add a semantic cache for repeated questions. Re-run the evals after each change to confirm quality held."
    },
    {
     "id": "q2",
     "level": "medium",
     "kind": "explain",
     "q": "How do you keep answers fresh when an article changes?",
     "answer": "The CMS sends a webhook; a worker re-chunks and re-embeds only that article, deletes its old chunks by article id and upserts the new ones. Store the article version with each chunk so citations point to the current text, and invalidate cached answers that cited it."
    }
   ]
  },
  {
   "tag": "Worked design · 2 an LLM gateway for a whole company",
   "title": "One front door for every team's model calls",
   "blocks": [
    {
     "kind": "mermaid",
     "src": "flowchart TB\n  T[\"team apps and batch jobs\"] --> GW[\"LLM gateway\"]:::hot\n  GW --> Q[\"keys, quotas, per-team budgets\"]\n  GW -.-> LOG[(\"usage, cost and audit logs, PII redacted\")]\n  Q --> C[\"exact + semantic cache\"]\n  C -->|\"miss\"| RT[\"router: model by task, fallback on errors\"]\n  RT --> P1[\"providers 1 and 2\"]\n  RT --> P3[\"self-hosted vLLM\"]",
     "caption": "Teams call one API; the gateway handles keys, cost, caching, failover and compliance."
    },
    {
     "kind": "text",
     "md": "**Why build it**\n\n- Provider keys stay in one place; teams never see them.\n- Per-team budgets and rate limits stop one runaway job draining the account.\n- Fallback across providers keeps apps up during an outage.\n- One audit log for data-protection reviews."
    },
    {
     "kind": "text",
     "md": "**Hard parts**\n\n- Streaming through the gateway without adding latency.\n- Normalising different providers' request and tool-call formats.\n- Cache keys that respect tenant boundaries.\n- Counting tokens consistently for billing."
    },
    {
     "kind": "text",
     "md": "**Check yourself**"
    }
   ],
   "questions": [
    {
     "id": "q3",
     "level": "medium",
     "kind": "explain",
     "q": "Provider 1 starts returning 429s. What should the gateway do?",
     "answer": "Respect Retry-After with jittered backoff for retriable requests, shift traffic to a fallback provider or model if the request allows it, shed low-priority batch traffic first, and alert. Never retry indefinitely on user-facing requests: fail fast with a clear message."
    },
    {
     "id": "q4",
     "level": "medium",
     "kind": "explain",
     "q": "How would you prevent one team's cached answers leaking to another?",
     "answer": "Include the tenant id (and any user-level scope) in every cache key, never share semantic-cache entries across tenants, and exclude responses containing personal data from caching."
    }
   ]
  },
  {
   "tag": "Worked design · 3 an internal agent platform",
   "title": "Agents that act on company systems, safely",
   "blocks": [
    {
     "kind": "mermaid",
     "src": "flowchart TB\n  UI[\"chat / Slack\"] --> OR[\"orchestrator (LangGraph): state per thread, checkpoints\"]:::hot\n  OR --> MCP[\"MCP servers: tickets, docs search, deploys\"]\n  MCP --> APR{\"risky action?\"}\n  APR -->|\"yes\"| HUM[\"human approval (interrupt)\"]:::warn\n  APR -->|\"no\"| RUN[\"run with the user's own permissions\"]:::ok\n  HUM --> RUN\n  RUN -.-> AUD[(\"audit log of every tool call\")]",
     "caption": "Tools behind MCP servers, the user's own permissions, approvals for anything irreversible, and a full audit trail."
    },
    {
     "kind": "text",
     "md": "**Check yourself**"
    }
   ],
   "questions": [
    {
     "id": "q5",
     "level": "medium",
     "kind": "explain",
     "q": "Why should the agent act with the user's permissions, not a service account?",
     "answer": "So it can never do more than the person asking could do themselves. A shared admin account turns any successful prompt injection into an admin action; per-user credentials limit the damage and keep the audit trail honest."
    },
    {
     "id": "q6",
     "level": "medium",
     "kind": "explain",
     "q": "How do you evaluate an agent before giving it to the whole company?",
     "answer": "Scripted tasks with known end states (was the ticket created with the right fields), measured on success rate, steps, cost and safety violations; replay real traces in a sandbox; red-team with injected documents; then a staged rollout with approvals switched on."
    }
   ]
  }
 ]
};

export const CAPSTONE: ExtraPage = {
 "id": "capstone",
 "title": "Capstone: a production agentic RAG system",
 "eyebrow": "Capstone",
 "lede": "One portfolio project that uses almost everything above. This is what you show in interviews: architecture, eval numbers, cost and latency, and the trade-offs you made.",
 "sections": [
  {
   "tag": "Spec · what you will build",
   "title": "DocuMind: ask questions over a company's documents",
   "blocks": [
    {
     "kind": "mermaid",
     "src": "flowchart TB\n  subgraph Ingestion\n    SRC[\"docs: Drive, Notion, a folder\"] --> PARSE[\"parse, chunk, contextualize\"]\n    PARSE --> IDX[(\"pgvector + BM25, ACL metadata\")]\n  end\n  subgraph Serving\n    UI[\"web UI: streaming chat + citations\"] --> API[\"FastAPI\"]\n    API --> AG[\"LangGraph agent\"]:::hot\n    AG --> T1[\"search_docs: hybrid + rerank over the index\"]\n    AG --> T2[\"sql_query (read-only), MCP tools\"]\n  end\n  subgraph Quality\n    GS[\"golden set: 50+ questions\"] --> CI[\"CI eval gate\"]\n    TR[\"Langfuse traces from the API\"] --> DASH[\"cost, latency, judge scores\"]\n  end\n  Ingestion ~~~ Serving ~~~ Quality",
     "caption": ""
    },
    {
     "kind": "text",
     "md": "**Must have**\n\n- Ingestion with page-level citations and per-document access groups.\n- Hybrid retrieval + reranker, with numbers proving each step helped.\n- An agent with at least two tools, a step cap and a human-approval step for one action.\n- Structured answers: answer, citations[], confidence, follow_up_questions[].\n- Conversation memory per user thread.\n- An eval suite (recall@5, faithfulness, correctness) running in CI.\n- Tracing, rate limits, input limits and prompt-injection defences.\n- Docker + a live deploy URL."
    },
    {
     "kind": "text",
     "md": "**Stretch goals**\n\n- A fine-tuned small model for query routing or classification (Stage 5).\n- Voice input with Whisper (Stage 10).\n- Images and charts in PDFs through a vision model.\n- Semantic cache with a measured hit rate.\n- Self-hosted vLLM fallback model."
    },
    {
     "kind": "text",
     "md": "**README must show**\n\n- An architecture diagram and the reason for each choice.\n- An eval table: baseline → each improvement.\n- Cost per query, p50/p95 latency, known limitations.\n- A 2-minute demo video or GIF."
    }
   ]
  },
  {
   "tag": "Plan · build order",
   "title": "Milestones",
   "blocks": [
    {
     "kind": "compare",
     "head": [
      "Milestone",
      "Deliverable",
      "Done when"
     ],
     "rows": [
      [
       "1. Data + golden set",
       "Parsed corpus, 50 Q&A with relevant chunk IDs",
       "Questions reviewed by hand"
      ],
      [
       "2. Baseline RAG",
       "Dense retrieval + answer with citations",
       "Eval script prints recall@5 and faithfulness"
      ],
      [
       "3. Better retrieval",
       "BM25 + RRF, reranker, query rewriting",
       "Each step shows a measured change"
      ],
      [
       "4. Agent",
       "LangGraph agent with tools + MCP server",
       "10 multi-step tasks pass"
      ],
      [
       "5. API + UI",
       "FastAPI streaming, simple web UI, memory",
       "Works end to end locally"
      ],
      [
       "6. Ops",
       "Tracing, rate limits, guardrails, Docker",
       "Injection red-team set handled"
      ],
      [
       "7. Ship",
       "CI eval gate, deploy, README, demo",
       "A stranger can try it from the link"
      ]
     ]
    },
    {
     "kind": "text",
     "md": "**Portfolio tip** Write a short blog post: \"I improved RAG recall from X% to Y%: what worked and what didn't.\" Specific numbers and honest failures impress interviewers more than a long feature list."
    }
   ]
  },
  {
   "tag": "Build-along · DocuMind in six steps",
   "title": "Build it, measure it, then talk about it",
   "blocks": [
    {
     "kind": "mermaid",
     "src": "flowchart TB\n  S1[\"1 · ingest: parse PDFs, chunk with page numbers,<br/>embed into pgvector or Qdrant\"] --> S2[\"2 · retrieve: hybrid BM25 + vectors, RRF, reranker\"]\n  S2 --> S3[\"3 · answer: structured output with citations[]<br/>and 'I do not know' when unsupported\"]\n  S3 --> S4[\"4 · agent: LangGraph with search and ticket tools,<br/>step cap, approval before creating tickets\"]\n  S4 --> S5[\"5 · evals in CI: recall@5, faithfulness, correctness<br/>on 100 labelled questions\"]\n  S5 --> S6[\"6 · ship: FastAPI + streaming, tracing, rate limits,<br/>Docker, live URL, README with numbers\"]",
     "caption": "Each step reuses one module: 4 for steps 1 to 3 and 5, 5 for step 4, 7 for step 6."
    },
    {
     "kind": "code",
     "src": "documind/\n  ingest/       parse.py, chunk.py, embed.py\n  retrieval/    bm25.py, vector.py, fuse.py (RRF), rerank.py\n  agent/        graph.py (LangGraph), tools.py, prompts/\n  api/          app.py (FastAPI, streaming), guards.py\n  evals/        questions.jsonl, run_evals.py, report.md\n  infra/        Dockerfile, docker-compose.yml\n  README.md     architecture diagram, eval table, cost and latency",
     "run": true
    },
    {
     "kind": "text",
     "md": "**Resume bullet (fill in your numbers)**"
    },
    {
     "kind": "text",
     "md": "**Template** Built DocuMind, a RAG assistant over 1,200 internal PDFs with hybrid retrieval and a LangGraph agent; raised recall@5 from 0.62 to 0.91 with BM25 + vector fusion and reranking, and cut cost per query 45% with prompt caching (FastAPI, pgvector, Docker)."
    },
    {
     "kind": "text",
     "md": "**60-second project pitch**\n\n- Problem: who asked, and why search was not enough.\n- Architecture: the six steps above, one sentence each.\n- The hardest bug and how evals found it.\n- Numbers: recall, faithfulness, latency, cost.\n- What you would do next with more time."
    },
    {
     "kind": "text",
     "md": "**Questions interviewers ask about your project**"
    }
   ],
   "questions": [
    {
     "id": "q1",
     "level": "medium",
     "kind": "explain",
     "q": "Why did you choose that chunk size?",
     "answer": "Answer with evidence: \"I tried 256, 512 and 1,024 tokens with 15% overlap and measured recall@5 on my 100-question set; 512 scored best because our answers usually span a paragraph.\" An answer backed by an experiment beats a rule of thumb."
    },
    {
     "id": "q2",
     "level": "medium",
     "kind": "explain",
     "q": "How do you know the answers are correct?",
     "answer": "A labelled eval set run in CI: recall@k for retrieval, an LLM judge for faithfulness checked against human labels on a sample, and correctness against reference answers. Plus user feedback logged with each trace."
    },
    {
     "id": "q3",
     "level": "medium",
     "kind": "explain",
     "q": "What breaks first at 100× the traffic?",
     "answer": "Usually cost and rate limits on the LLM API, then the vector store's memory and the reranker's latency. Mitigations: caching, routing to a smaller model, batching rerank calls, sharding or quantizing the index, and queueing ingestion."
    }
   ]
  }
 ]
};

export const GLOSSARY: ExtraPage = {
 "id": "glossary",
 "title": "Glossary",
 "eyebrow": "Reference",
 "lede": "",
 "sections": [
  {
   "tag": "A–Z · terms you will hear every day",
   "title": "",
   "blocks": [
    {
     "kind": "compare",
     "head": [
      "Term",
      "Meaning"
     ],
     "rows": [
      [
       "Agent",
       "An LLM in a loop that chooses tools until a goal is met."
      ],
      [
       "ALiBi",
       "Positional method that adds a distance penalty to attention scores."
      ],
      [
       "AWQ / GPTQ",
       "Calibrated 4-bit weight quantization methods for GPUs."
      ],
      [
       "BM25",
       "Classic keyword ranking function used in sparse search."
      ],
      [
       "BPE",
       "Byte-pair encoding: a tokenizer built by merging frequent pairs."
      ],
      [
       "Chunking",
       "Splitting documents into retrievable pieces."
      ],
      [
       "CFG",
       "Classifier-free guidance: pushes diffusion toward the prompt."
      ],
      [
       "Context window",
       "Maximum tokens a model can read plus write in one call."
      ],
      [
       "Continuous batching",
       "Adding and removing requests from a running batch every step."
      ],
      [
       "Cross-encoder",
       "A model that scores a query–document pair jointly. Used as a reranker."
      ],
      [
       "DiT",
       "Diffusion Transformer: a transformer used as the denoiser."
      ],
      [
       "Distillation",
       "Training a small model to copy a large one."
      ],
      [
       "DPO",
       "Direct Preference Optimization on chosen/rejected pairs."
      ],
      [
       "Embedding",
       "A vector that represents meaning. Similar text gives nearby vectors."
      ],
      [
       "Eval",
       "A repeatable test set plus scoring for a model or system."
      ],
      [
       "FlashAttention",
       "An IO-aware exact attention kernel. Fast, linear memory."
      ],
      [
       "Flow matching",
       "A generative training method that learns straight noise-to-data paths."
      ],
      [
       "Function calling",
       "The model outputs a structured call for your code to run."
      ],
      [
       "GGUF",
       "llama.cpp file format for quantized local models."
      ],
      [
       "GQA",
       "Grouped-query attention: query heads share K/V heads."
      ],
      [
       "GRPO",
       "Group Relative Policy Optimization. RL without a critic."
      ],
      [
       "Guardrails",
       "Checks on inputs and outputs: policy, PII, schema, injection."
      ],
      [
       "HNSW",
       "Graph-based approximate nearest-neighbour index."
      ],
      [
       "HyDE",
       "Search using an embedding of a hypothetical answer."
      ],
      [
       "KV cache",
       "Stored keys and values of past tokens for fast decoding."
      ],
      [
       "LLM-as-judge",
       "Using a model with a rubric to grade outputs."
      ],
      [
       "LoRA",
       "Low-rank adapters for cheap fine-tuning."
      ],
      [
       "MCP",
       "Model Context Protocol: a standard for connecting tools and data to AI apps."
      ],
      [
       "MoE",
       "Mixture of Experts: tokens routed to a few expert FFNs."
      ],
      [
       "MTEB",
       "Benchmark leaderboard for embedding models."
      ],
      [
       "PagedAttention",
       "vLLM's paged KV-cache memory manager."
      ],
      [
       "PEFT",
       "Parameter-efficient fine-tuning: LoRA, adapters, prefix tuning."
      ],
      [
       "Prefill / decode",
       "Prompt processing phase vs token generation phase."
      ],
      [
       "Prompt caching",
       "Provider-side reuse of a repeated prompt prefix."
      ],
      [
       "Prompt injection",
       "Untrusted text that tries to override instructions."
      ],
      [
       "QLoRA",
       "LoRA on a 4-bit quantized base model."
      ],
      [
       "RAG",
       "Retrieval-augmented generation."
      ],
      [
       "ReAct",
       "Reason + act loop: think, call a tool, observe, repeat."
      ],
      [
       "Reranker",
       "Second-stage model that reorders retrieved candidates."
      ],
      [
       "RLHF",
       "RL from human feedback: reward model plus PPO."
      ],
      [
       "RMSNorm",
       "Normalization by root-mean-square, without mean subtraction."
      ],
      [
       "RoPE",
       "Rotary position embeddings."
      ],
      [
       "RRF",
       "Reciprocal Rank Fusion for merging ranked lists."
      ],
      [
       "SFT",
       "Supervised fine-tuning on demonstrations."
      ],
      [
       "Speculative decoding",
       "A draft model proposes tokens and the big model verifies them."
      ],
      [
       "SSM / Mamba",
       "Linear-time sequence model with a selective state."
      ],
      [
       "Structured outputs",
       "Schema-constrained generation that guarantees valid JSON."
      ],
      [
       "SwiGLU",
       "Gated FFN activation used in modern LLMs."
      ],
      [
       "Test-time compute",
       "Spending more tokens or \"thinking\" at inference for better answers."
      ],
      [
       "TTFT",
       "Time to first token."
      ],
      [
       "VAE",
       "Variational autoencoder with a smooth latent space."
      ],
      [
       "ViT",
       "Vision Transformer: image patches as tokens."
      ]
     ]
    }
   ]
  },
  {
   "tag": "More terms · from the deep dives",
   "title": "",
   "blocks": [
    {
     "kind": "compare",
     "head": [
      "Term",
      "Meaning"
     ],
     "rows": [
      [
       "A2A",
       "Agent-to-agent protocol: agents publish cards and exchange tasks across systems. Stage 8."
      ],
      [
       "Attention sink",
       "Early tokens that soak up attention; keeping them stabilises streaming generation. Stage 4."
      ],
      [
       "Constrained decoding",
       "Masking tokens that would break a schema, so output always parses. Stage 6."
      ],
      [
       "Context engineering",
       "Choosing and ordering what goes into the context window. Stage 6."
      ],
      [
       "DiskANN",
       "Graph index kept on SSD for billion-scale vector search. Stage 7."
      ],
      [
       "IVF",
       "Inverted-file index: cluster vectors and search only the nearest clusters. Stage 7."
      ],
      [
       "LCEL",
       "LangChain Expression Language: compose Runnables with the pipe operator. Stage 8."
      ],
      [
       "LLM gateway",
       "One service in front of all model providers for keys, budgets, caching and failover. System design."
      ],
      [
       "Matryoshka embedding",
       "Embedding whose first dimensions work alone, so it can be truncated. Stage 7."
      ],
      [
       "MLA",
       "Multi-head latent attention: store a compressed latent per token instead of full K and V. Stage 4."
      ],
      [
       "MRR",
       "Mean reciprocal rank: average of 1 / rank of the first relevant result. Stage 7."
      ],
      [
       "Online softmax",
       "Computing softmax block by block with a running max and sum; the core of FlashAttention. Stage 4."
      ],
      [
       "Product quantization",
       "Compress a vector into a few bytes by coding each slice with a small codebook. Stage 7."
      ],
      [
       "Recall@k",
       "Share of the relevant items that appear in the top k results. Stage 7."
      ],
      [
       "Residual stream",
       "The per-token vector every transformer layer reads from and adds to. Stage 4."
      ],
      [
       "RLVR",
       "Reinforcement learning with verifiable rewards: answers checked by a program. Stage 5."
      ],
      [
       "Semantic cache",
       "Reuse an earlier answer when a new question is close enough in embedding space. Stage 9."
      ],
      [
       "Teacher forcing",
       "Training on the true previous tokens instead of the model's own guesses. Stage 4."
      ],
      [
       "YaRN",
       "A RoPE scaling method for extending a model's context length. Stage 4."
      ]
     ]
    }
   ]
  }
 ]
};

export const RESOURCES: ExtraPage = {
 "id": "resources",
 "title": "Best resources, by module",
 "eyebrow": "Reference",
 "lede": "Free unless noted. Use these to go deeper after finishing a module, not instead of building.",
 "sections": [
  {
   "tag": "Go deeper",
   "title": "",
   "blocks": [],
   "links": [
    {
     "title": "Neural Networks: Zero to Hero",
     "url": "https://karpathy.ai/zero-to-hero.html",
     "note": "Karpathy's videos, backprop to GPT. Stages 2 to 4."
    },
    {
     "title": "nanoGPT",
     "url": "https://github.com/karpathy/nanoGPT",
     "note": "Minimal GPT training code. Stage 4 project."
    },
    {
     "title": "Dive into Deep Learning",
     "url": "https://d2l.ai",
     "note": "Free book with code for every architecture. Stages 2 and 3."
    },
    {
     "title": "Attention Is All You Need",
     "url": "https://arxiv.org/abs/1706.03762",
     "note": "The transformer paper. Stages 3 and 4."
    },
    {
     "title": "The Illustrated Transformer",
     "url": "https://jalammar.github.io/illustrated-transformer/",
     "note": "The classic visual explanation."
    },
    {
     "title": "Stanford CS336",
     "url": "https://cs336.stanford.edu",
     "note": "Language modeling from scratch. Advanced, Stage 4."
    },
    {
     "title": "Hugging Face LLM Course",
     "url": "https://huggingface.co/learn/llm-course",
     "note": "Transformers, datasets, fine-tuning. Stages 4 and 5."
    },
    {
     "title": "Claude API docs",
     "url": "https://platform.claude.com/docs",
     "note": "Messages, tools, caching, structured outputs, prompting guides. Stage 6."
    },
    {
     "title": "Building Effective Agents",
     "url": "https://www.anthropic.com/engineering/building-effective-agents",
     "note": "Workflow vs agent patterns. Stage 8."
    },
    {
     "title": "Model Context Protocol",
     "url": "https://modelcontextprotocol.io",
     "note": "Spec, SDKs and example servers. Stage 8."
    },
    {
     "title": "LangGraph docs",
     "url": "https://docs.langchain.com/oss/python/langgraph/overview",
     "note": "State graphs, memory, human-in-the-loop. Stage 8."
    },
    {
     "title": "MTEB leaderboard",
     "url": "https://huggingface.co/spaces/mteb/leaderboard",
     "note": "Choosing embedding models. Stage 7."
    },
    {
     "title": "RAGAS",
     "url": "https://docs.ragas.io",
     "note": "RAG evaluation metrics. Stage 7."
    },
    {
     "title": "TRL docs",
     "url": "https://huggingface.co/docs/trl",
     "note": "SFT, DPO, GRPO trainers. Stage 5."
    },
    {
     "title": "vLLM docs",
     "url": "https://docs.vllm.ai",
     "note": "Serving, quantization, multi-LoRA. Stage 9."
    },
    {
     "title": "OWASP Top 10 for LLM Apps",
     "url": "https://genai.owasp.org/llm-top-10/",
     "note": "The security checklist. Stage 9."
    },
    {
     "title": "Diffusers docs",
     "url": "https://huggingface.co/docs/diffusers",
     "note": "Image and video generation pipelines. Stage 10."
    },
    {
     "title": "Lil'Log",
     "url": "https://lilianweng.github.io",
     "note": "Deep, clear posts on agents, diffusion, RLHF, hallucination."
    },
    {
     "title": "AI Engineering, Chip Huyen (book, paid)The best single book on building with foundation models.",
     "url": "",
     "note": ""
    },
    {
     "title": "Build a Large Language Model (From Scratch), Sebastian Raschka (book, paid)Code-first LLM internals and fine-tuning.",
     "url": "",
     "note": ""
    }
   ]
  },
  {
   "tag": "Papers · the original sources behind the deep dives",
   "title": "",
   "blocks": [],
   "links": [
    {
     "title": "RoFormer (RoPE)",
     "url": "https://arxiv.org/abs/2104.09864",
     "note": "Rotary position embeddings. See [[embeddings-positions]]."
    },
    {
     "title": "FlashAttention",
     "url": "https://arxiv.org/abs/2205.14135",
     "note": "Exact attention with tiling and the online softmax. See [[self-attention]]."
    },
    {
     "title": "Speculative decoding",
     "url": "https://arxiv.org/abs/2211.17192",
     "note": "Draft and verify without changing the output distribution. See [[speculative-decoding]]."
    },
    {
     "title": "Mamba",
     "url": "https://arxiv.org/abs/2312.00752",
     "note": "Selective state space models. Stage 3.10."
    },
    {
     "title": "Retrieval-augmented generation",
     "url": "https://arxiv.org/abs/2005.11401",
     "note": "The paper that named RAG. Stage 7."
    },
    {
     "title": "HNSW",
     "url": "https://arxiv.org/abs/1603.09320",
     "note": "The graph index inside most vector databases. Stage 7.7."
    },
    {
     "title": "ColBERT",
     "url": "https://arxiv.org/abs/2004.12832",
     "note": "Late interaction retrieval. Stage 7.8."
    },
    {
     "title": "LoRA",
     "url": "https://arxiv.org/abs/2106.09685",
     "note": "Low-rank adaptation. Stage 5."
    },
    {
     "title": "QLoRA",
     "url": "https://arxiv.org/abs/2305.14314",
     "note": "Fine-tuning on a 4-bit base model. Stage 5."
    },
    {
     "title": "DPO",
     "url": "https://arxiv.org/abs/2305.18290",
     "note": "Preference tuning without a reward model. Stage 5.5."
    },
    {
     "title": "DeepSeek-R1",
     "url": "https://arxiv.org/abs/2501.12948",
     "note": "Reasoning from RL with verifiable rewards. Stage 5.5."
    },
    {
     "title": "PagedAttention (vLLM)",
     "url": "https://arxiv.org/abs/2309.06180",
     "note": "KV cache as memory pages. Stage 9.6."
    },
    {
     "title": "Flow matching",
     "url": "https://arxiv.org/abs/2210.02747",
     "note": "The training objective behind recent image and video models. Stage 10.4."
    }
   ]
  },
  {
   "tag": "Tools and guides · what you will actually install and read",
   "title": "",
   "blocks": [],
   "links": [
    {
     "title": "LangChain and LangGraph docs",
     "url": "https://docs.langchain.com/oss/python/langgraph/overview",
     "note": "create_agent, middleware, graphs, persistence. Stage 8."
    },
    {
     "title": "A2A protocol",
     "url": "https://github.com/a2aproject/A2A",
     "note": "Agent-to-agent spec and samples. Stage 8.9."
    },
    {
     "title": "Contextual retrieval",
     "url": "https://www.anthropic.com/engineering/contextual-retrieval",
     "note": "Prepend chunk context before embedding. Stage 7.8."
    },
    {
     "title": "pgvector",
     "url": "https://github.com/pgvector/pgvector",
     "note": "Vector search inside Postgres. Stage 7."
    },
    {
     "title": "FAISS",
     "url": "https://github.com/facebookresearch/faiss",
     "note": "IVF, PQ and HNSW indexes to experiment with. Stage 7.7."
    },
    {
     "title": "SGLang",
     "url": "https://github.com/sgl-project/sglang",
     "note": "Serving engine with RadixAttention prefix caching. Stage 9."
    },
    {
     "title": "Pydantic",
     "url": "https://docs.pydantic.dev",
     "note": "Schemas for structured output and validation. Stage 6.8."
    },
    {
     "title": "3Blue1Brown: neural networks",
     "url": "https://www.3blue1brown.com/topics/neural-networks",
     "note": "Visual intuition for backprop and transformers. Stages 2 and 4."
    },
    {
     "title": "Hugging Face smol course",
     "url": "https://github.com/huggingface/smol-course",
     "note": "Hands-on fine-tuning of small models. Stage 5."
    }
   ]
  }
 ]
};
