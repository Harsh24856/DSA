// Stage 9: the KV cache, and how paged attention stops it wasting memory. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { blocksFor, GPU, KV_EX, kvGB, kvPerToken, MODEL, n0, pagedSlots, r1, reserved, used, weightsGB } from "../../stages/s9.calc.ts";

const { lens, max, block } = KV_EX, RES = reserved(lens, max), PG = pagedSlots(lens, block), USED = used(lens);
const pctUsed = (u: number, r: number) => `${Math.round((u / r) * 100)}%`;
// predict: one request in blocks
const PL = 50, pBlocks = blocksFor(PL, 16), pWaste = pBlocks * 16 - PL;
// numeric: users that fit
const perTok = kvPerToken(), room = GPU.mem * 0.9 - weightsGB(MODEL.params, 2), CTX = 4096;
const perUser = kvGB(CTX, 1), fitUsers = Math.floor(room / perUser);
const MAXR = 8192, avgLen = 1000, fitReserve = Math.floor(room / kvGB(MAXR, 1)), fitPaged = Math.floor(room / kvGB(Math.ceil(avgLen / 16) * 16, 1));
// numeric: prefix sharing saves
const [SYS, NREQ] = [3000, 20], sharedSave = (NREQ - 1) * SYS;
// output: block count
const OUT_LENS = [5, 16, 17, 40], OUT_B = 16, outBlocks = OUT_LENS.reduce((a, l) => a + blocksFor(l, OUT_B), 0);
// worst case waste per request
const worst = block - 1;

export const KV_CACHE_PAGED: GModule = {
  id: "kv-cache-paged",
  stage: 9,
  title: "KV cache and paged attention",
  hook: "Every token a model has seen leaves a key and a value in every layer. Keeping them saves recomputing the past, but they fill GPU memory fast. How you store them decides how many users one GPU can serve.",
  blocks: [
    { kind: "figure", id: "s9-kv-blocks", caption: `Reserving the maximum for every request leaves most of the memory empty: ${pctUsed(USED, RES)} used. Fixed blocks handed out on demand waste at most part of the last block: ${pctUsed(USED, PG)} used.` },
    { kind: "flow", id: "g-kv" },
    { kind: "text", md: `**What the cache holds.** For each token, each layer stores its key and value vectors, for each KV head. That is ${perTok / 1024} KiB a token for the example ${MODEL.params}B model. A new token's query must meet every old key, so dropping them means recomputing the whole prefix at every step.\n\n**The waste.** A server does not know how long an answer will be. Reserving the maximum length per request leaves most of it empty.` },
    {
      kind: "predict",
      q: `A request holds ${PL} tokens. The cache hands out blocks of 16 tokens. How many blocks does it use, and how many slots sit empty?`,
      answer: `${pBlocks} blocks, ${pWaste} empty`, wrong: [`${PL / 16} blocks, 0 empty`, `${pBlocks - 1} blocks, ${PL - (pBlocks - 1) * 16} empty`, `${pBlocks + 1} blocks, ${pWaste + 16} empty`],
      why: `${PL} / 16 rounds up to ${pBlocks} blocks, ${pBlocks * 16} slots. Only the last block is partly filled: ${pBlocks * 16} - ${PL} = ${pWaste}. Waste never reaches a whole block.`,
    },
    { kind: "lab", id: "paging" },
    { kind: "flow", id: "s9-block-table" },
    {
      kind: "compare",
      head: ["", "Reserve max length", "Paged blocks"],
      rows: [
        ["Memory per request", "Fixed at the maximum, up front", "Grows one block at a time"],
        ["Empty space", "Everything past the real length", `At most ${worst} slots (block ${block})`],
        ["Shared prompt", "Copied per request", "Blocks shared, counted by reference"],
        ["Cost", "Simple contiguous reads", "A block table lookup in the attention kernel"],
      ],
    },
    { kind: "text", md: `**Prefix caching.** Requests that start the same way (system prompt, tool definitions, a long document) can point at the same blocks. The server skips their prefill and stores them once. Put stable content first and anything that changes, such as the date or the user's name, last, so the shared prefix stays long.` },
    {
      kind: "mermaid",
      src: `flowchart TB
  N["new request"] --> H{"prefix blocks already cached?"}
  H -->|yes| R["point block table at them"]:::ok
  H -->|no| P["prefill, store new blocks"]:::warn
  R --> D["prefill only the new tokens"]
  P --> D
  D --> G["decode: add a block every ${block} tokens"]
  G --> F["finish: drop references, free unshared blocks"]`,
      caption: "A cache hit skips the shared part of prefill, which cuts time to first token and cost.",
    },
    {
      kind: "code",
      run: true,
      src: `import math
lens, max_len, block = ${JSON.stringify(lens)}, ${max}, ${block}

reserved = len(lens) * max_len                       # one max-length region per request
paged = sum(math.ceil(n / block) * block for n in lens)   # whole blocks, on demand
used = sum(lens)
print(f"reserve: {used}/{reserved} used ({used/reserved:.0%})")
print(f"paged:   {used}/{paged} used ({used/paged:.0%})")
assert paged - used < block * len(lens)              # under one block of waste per request
`,
    },
  ],
  keyPoints: [
    "The KV cache stores each past token's key and value in every layer, so decode reads them instead of recomputing the prefix.",
    "Its size is 2 × layers × KV heads × head size × bytes, per token, per active request; at long contexts it outgrows the weights.",
    "Reserving the maximum length per request wastes most of that memory, because real lengths are short and unknown in advance.",
    "Paged attention stores the cache in fixed blocks with a block table per request, so waste is under one block per request and more requests fit.",
    "Blocks can be shared by reference: requests with the same prefix reuse its blocks and skip its prefill (prefix caching).",
  ],
  questions: [
    { id: "why-cache", level: "easy", kind: "concept",
      q: "What does the KV cache save during decode?",
      answer: "Recomputing the keys and values of every earlier token at each step",
      wrong: ["Recomputing the model weights", "Storing the sampled tokens as text", "Running softmax over the vocabulary"],
      why: "Earlier tokens' keys and values never change, so they are stored once and read at every later step. Without the cache, the work per step grows with the whole prefix." },
    { id: "what-stored", level: "easy", kind: "concept",
      q: "Per token, what does the KV cache keep?",
      answer: "A key and a value vector for each layer and each KV head",
      wrong: ["One vector for the whole model", "The query, key and value for the last layer only", "The token's logits"],
      why: "Every layer has its own attention, so every layer keeps its own keys and values. Queries are not stored: only the newest token's query is needed, and it is made fresh." },
    { id: "frag", level: "medium", kind: "concept",
      q: "Why does reserving one contiguous region of maximum length per request waste memory?",
      answer: "Most requests end far short of the maximum, and the unused part cannot be lent to others",
      wrong: ["Contiguous memory is slower to read", "The GPU cannot address regions over 1 GB", "Keys and values must be stored twice"],
      why: `In the figure, ${lens.length} requests reserve ${RES} slots for ${USED} real tokens: ${pctUsed(USED, RES)} used. The server cannot know the answer length in advance, so it must reserve for the worst case.` },
    { id: "os-idea", level: "medium", kind: "concept",
      q: "Paged attention borrows its main idea from where?",
      answer: "Virtual memory paging in operating systems",
      wrong: ["Database B-tree indexes", "Network packet routing", "CPU branch prediction"],
      why: "Like an OS page table, a block table maps a request's logical blocks to physical blocks anywhere in memory, so memory need not be contiguous and can be allocated on demand." },
    { id: "block-size", level: "hard", kind: "concept",
      q: "What happens if you make the KV blocks much larger, say 512 tokens?",
      answer: "More waste in each request's last block, though fewer table lookups",
      wrong: ["Less waste, because fewer blocks are needed", "No change: block size only affects speed", "The model's quality drops"],
      why: "Waste per request is up to one block minus one token. Bigger blocks waste more and share prefixes less finely; tiny blocks add bookkeeping. Blocks of about 16 tokens are a common middle." },
    { id: "prefix-order", level: "medium", kind: "concept",
      q: "To get the most from prefix caching, where should today's date go in a prompt?",
      answer: "After the stable parts, near the end",
      wrong: ["First, so the model sees it early", "In the middle of the tool definitions", "It does not matter for caching"],
      why: "A cache hit needs an exact match from the first token. A date at the start changes every day, so nothing after it can be reused." },
    { id: "share-safe", level: "hard", kind: "concept",
      q: "Two sequences share a partly filled block, for example two samples forked from one prompt. One of them must now append its own token to that block. What should the cache do?",
      answer: "Copy the block, give the copy to that sequence, and write there (copy on write)",
      wrong: ["Write in place; the other sequence will skip the new slot", "Free the block and recompute both prefixes", "Pause the other sequence until this one finishes"],
      why: "Shared blocks are read only. If a request must change a shared block, it gets its own copy first (copy on write), and the reference count tells the cache when a block is free." },
    { id: "users-fit", level: "medium", kind: "numeric",
      q: `After ${weightsGB(MODEL.params, 2)} GB of weights and a 10% margin, ${r1(room)} GB of an ${GPU.mem} GB GPU is left. Each user at ${n0(CTX)} tokens needs ${perUser.toFixed(2)} GB of cache. How many users fit?`,
      answer: String(fitUsers), wrong: [String(Math.floor(GPU.mem / perUser)), String(fitUsers * 2), String(Math.floor(fitUsers / 2))],
      why: `${r1(room)} / ${perUser.toFixed(2)} = ${(room / perUser).toFixed(1)}, so ${fitUsers}. Dividing the whole ${GPU.mem} GB forgets the weights.` },
    { id: "reserve-vs-paged", level: "hard", kind: "numeric",
      q: `A server reserves ${n0(MAXR)} tokens per request, but requests average ${n0(avgLen)}. With paged blocks of 16 instead, about how many times as many requests fit in the same ${r1(room)} GB?`,
      answer: `About ${Math.round(fitPaged / fitReserve)} times`, wrong: ["About the same", `About ${Math.round(fitPaged / fitReserve / 4)} times`, `About ${Math.round(fitPaged / fitReserve) * 4} times`],
      why: `Reserving: ${fitReserve} requests. Paged, each holds about ${Math.ceil(avgLen / 16) * 16} slots: ${fitPaged} requests, about ${Math.round(fitPaged / fitReserve)} times as many. More requests in memory means bigger batches and higher throughput.` },
    { id: "prefix-save", level: "medium", kind: "numeric",
      q: `${NREQ} requests share a ${n0(SYS)} token system prompt. With prefix caching, how many prompt tokens of prefill are skipped?`,
      answer: n0(sharedSave), wrong: [n0(NREQ * SYS), n0(SYS), "0"],
      why: `The first request must prefill the prompt and store it. The other ${NREQ - 1} reuse it: ${NREQ - 1} × ${n0(SYS)} = ${n0(sharedSave)}.` },
    { id: "blocks-out", level: "easy", kind: "output",
      q: "How many blocks do these requests take? What does this print?",
      code: `import math\nlens = ${JSON.stringify(OUT_LENS)}\nprint(sum(math.ceil(n / ${OUT_B}) for n in lens))`,
      answer: String(outBlocks), wrong: [String(Math.ceil(OUT_LENS.reduce((a, b) => a + b, 0) / OUT_B)), String(OUT_LENS.length), String(outBlocks + 1)],
      why: `${OUT_LENS.map((l) => `${l} needs ${blocksFor(l, OUT_B)}`).join(", ")}: ${outBlocks} in all. Blocks belong to one request, so you round up per request, not over the total.` },
    { id: "explain-paged", level: "medium", kind: "explain",
      q: "What problem does paged attention solve, and how?",
      answer: `Serving systems used to reserve one contiguous KV region per request at the maximum length. Most requests stop early, so most of that memory sat empty and fewer requests fit.\n\nPaged attention splits the cache into fixed blocks (say ${block} tokens) and gives each request a block table, like an OS page table. Blocks are taken only as tokens arrive and returned when the request ends, so waste is under one block per request. Blocks can also be shared between requests with the same prefix.` },
    { id: "explain-prefix", level: "hard", kind: "explain",
      q: "Why does prefix caching help so much for RAG and agents, and what can break it?",
      answer: "Agents and RAG apps resend the same long system prompt, tool definitions and often the same documents on every call. Reusing their cached blocks skips that prefill, which cuts time to first token and compute.\n\nIt breaks when anything early in the prompt changes: a timestamp, a user name or reordered tools at the start. Keep stable parts first, changing parts last, and route requests with the same prefix to the same server so its cache is warm." },
    { id: "explain-shrink", level: "hard", kind: "explain",
      q: "The KV cache, not the weights, limits how many users your GPU serves. What can you do?",
      answer: "- Store it more compactly: an 8-bit or FP8 KV cache halves it against bf16, after checking quality.\n- Use a model with fewer KV heads (grouped query attention), which shrinks it per token.\n- Waste less: paged blocks instead of max-length reservations, and shared prefix blocks.\n- Cap context length, or trim old turns and tool results.\n- Split the model across more GPUs so each holds part of the cache, or move idle conversations' cache to CPU memory and back." },
    { id: "trap-compute", level: "medium", kind: "trap",
      claim: "Paged attention reduces the number of attention FLOPs per token.",
      truth: false,
      why: "It changes where keys and values live, not how many are compared. The gain is memory: less waste means more requests in a batch, which raises throughput." },
    { id: "trap-waste", level: "easy", kind: "trap",
      claim: `With blocks of ${block} tokens, a request never wastes more than ${worst} slots of KV cache.`,
      truth: true,
      why: `Only the last block can be partly empty, and it holds at least 1 token, so at most ${block} - 1 = ${worst} slots are unused.` },
  ],
  real: [
    { who: "Woosuk Kwon and co-authors", when: "2023",
      what: "The PagedAttention paper, which introduced the vLLM serving system, says KV cache memory was being wasted by fragmentation and duplication. Inspired by OS paging, vLLM reaches near-zero KV cache waste and shares cache within and across requests. It reports 2 to 4 times the throughput of earlier systems at the same latency.",
      takeaway: "Memory management, not a new model, was the gain: fitting more requests in memory lets the server batch more.",
      url: "https://arxiv.org/abs/2309.06180" },
    { who: "Lianmin Zheng and co-authors", when: "2023",
      what: "The SGLang paper describes RadixAttention, a way to reuse the KV cache across model calls, and reports up to 6.4 times higher throughput than other inference systems on its workloads.",
      takeaway: "Programs that call a model many times with shared prefixes gain the most from reusing the cache.",
      url: "https://arxiv.org/abs/2312.07104" },
  ],
};
