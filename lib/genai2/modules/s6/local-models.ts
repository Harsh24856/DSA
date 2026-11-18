// Stage 6: running open-weight models on your own machine: memory, quantisation, speed and when it is worth it. Every number below is computed here.
import type { GModule } from "../../types.ts";

const r1 = (x: number) => x.toFixed(1);
const gb = (billions: number, bits: number) => (billions * bits) / 8;

// predict and numerics: weight memory
const [P7, P13, P70] = [7, 13, 70];
// numeric: decode speed bound
const [WGB, BW] = [4, 100];
// output: 8B at 4-bit in Python
const [P8, B4] = [8, 4];
// compare: one 8B model
const P = 8;

export const LOCAL_MODELS: GModule = {
  id: "local-models",
  stage: 6,
  title: "Local models",
  hook: "Open-weight models run on a laptop. Memory decides which ones fit, memory bandwidth decides how fast they talk, and quantisation trades a little quality for both.",
  blocks: [
    { kind: "figure", id: "s6-local-memory", caption: "Weight memory is just size times bits. Halving the bits halves the memory, which decides what fits on your machine." },
    {
      kind: "predict",
      q: `How much memory do the weights of a ${P7}B model take at 4-bit?`,
      answer: `${r1(gb(P7, 4))} GB`, wrong: [`${r1(gb(P7, 16))} GB`, `${r1(gb(P7, 8))} GB`, `${r1(P7 * 4)} GB`],
      why: `Each weight takes 4 bits, half a byte: ${P7} billion × 0.5 bytes = ${r1(gb(P7, 4))} GB. At 16-bit it would be ${r1(gb(P7, 16))} GB. ${r1(P7 * 4)} GB treats 4 bits as 4 bytes.`,
    },
    { kind: "flow", id: "s6-local" },
    { kind: "text", md: "**Why bandwidth sets the speed.** To produce one token, the model reads every weight from memory once. At batch size 1 the arithmetic is quick; waiting for memory is the slow part. So tokens per second is roughly memory bandwidth divided by the size of the weights. Quantising to 4-bit makes the weights smaller, so it speeds up decoding as well as saving memory." },
    { kind: "play", id: "s6-fit" },
    {
      kind: "compare",
      head: ["", "Hosted API", "Local model"],
      rows: [
        ["Data", "Leaves your machine", "Stays on it"],
        ["Cost", "Per token, nothing up front", "Hardware and power, no per-token bill"],
        ["Quality", "Frontier models", `Smaller open models, e.g. ${P}B at ${gb(P, 4)} GB in 4-bit`],
        ["Speed", "Fast, big serving GPUs", "Set by your memory bandwidth"],
        ["Ops", "None", "You update, monitor and secure it"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  subgraph R1["data must not leave the building?"]
    Q1["yes"] --> A1["local or self-hosted"]:::hot
  end
  subgraph R2["need the best quality on hard tasks?"]
    Q2["yes"] --> A2["hosted frontier API"]:::ok
  end
  subgraph R3["offline, or huge steady volume?"]
    Q3["yes"] --> A3["local, if a small model passes your evals"]:::warn
  end
  subgraph R4["just prototyping?"]
    Q4["yes"] --> A4["API now, revisit later"]:::ok
  end
  R1 --> R2 --> R3 --> R4`,
      caption: "Local or API? Take the first question that applies.",
    },
    {
      kind: "code",
      run: true,
      src: `# Will a model fit, and roughly how fast will it decode at batch size 1?
def weight_gb(billions, bits):
    return billions * bits / 8          # billions of weights x bytes per weight

def max_tokens_per_s(billions, bits, bandwidth_gb_s):
    return bandwidth_gb_s / weight_gb(billions, bits)   # every weight is read once per token

laptop = {"memory_gb": 16, "bandwidth_gb_s": 100}
for bits in (16, 8, 4):
    w = weight_gb(8, bits)
    need = w * 1.2                      # assumed 20% extra for the KV cache and runtime
    fits = need <= laptop["memory_gb"]
    speed = max_tokens_per_s(8, bits, laptop["bandwidth_gb_s"])
    print(f"8B at {bits:>2}-bit: {w:4.1f} GB weights, needs ~{need:4.1f} GB, fits: {fits}, <= {speed:4.1f} tokens/s")

assert weight_gb(8, 4) == 4.0 and max_tokens_per_s(8, 4, 100) == 25.0
assert weight_gb(8, 16) * 1.2 > laptop["memory_gb"]     # 16-bit does not fit on this laptop
`,
    },
  ],
  keyPoints: [
    "Weight memory in GB is about billions of parameters × bits per weight ÷ 8; the KV cache and runtime need more on top.",
    "Quantisation stores weights in fewer bits: 4-bit is a quarter of 16-bit, with a small, measurable loss in quality.",
    "Decoding one token reads every weight once, so local speed is roughly memory bandwidth divided by weight size.",
    "Tools such as llama.cpp and Ollama run quantised GGUF files and expose an OpenAI-compatible local server.",
    "Choose local for privacy, offline use or steady high volume, and only after the model passes your evals.",
  ],
  questions: [
    { id: "open-weight", level: "easy", kind: "concept",
      q: "What does \"open-weight model\" mean?",
      answer: "The trained weights can be downloaded and run on your own hardware",
      wrong: ["The training data and code are all public", "It is free to use for any purpose", "It runs only in a web browser"],
      why: "Open weights means you get the parameters. The data and training code are often not released, and the licence may limit some uses, so read it." },
    { id: "gguf", level: "easy", kind: "concept",
      q: "What is a GGUF file?",
      answer: "One file holding a model's weights and the metadata needed to load and run it",
      wrong: ["A Python package for calling hosted APIs", "A dataset format for fine-tuning", "A GPU driver for local inference"],
      why: "GGUF is the format used by llama.cpp and the tools built on it. Weights, often quantised, and settings such as the tokenizer travel together in one file, so a model is a single download." },
    { id: "quant-tradeoff", level: "medium", kind: "concept",
      q: "What do you trade when you quantise a model from 16-bit to 4-bit?",
      answer: "A small loss of quality for a quarter of the weight memory and faster decoding",
      wrong: ["Nothing; 4-bit is lossless", "Speed: 4-bit models decode four times slower", "Context length: 4-bit models accept a quarter of the tokens"],
      why: "Rounding weights to 16 levels loses detail, so quality drops a little, more at 3 or 2 bits. In return the weights are a quarter of the size, and since decoding reads all of them per token, it gets faster too." },
    { id: "memory-bound", level: "hard", kind: "concept",
      q: "At batch size 1, what usually limits how fast a local model writes tokens?",
      answer: "Memory bandwidth, because every weight is read for each new token",
      wrong: ["The number of CPU cores", "The size of the disk", "The length of the system prompt"],
      why: "Each token needs a pass over all the weights but only a little arithmetic per weight, so the chip waits on memory. That is why a machine with fast memory decodes faster even with similar compute." },
    { id: "compat", level: "medium", kind: "concept",
      q: "A local server is \"OpenAI-compatible\". What does that let you do?",
      answer: "Use your existing client code by pointing its base URL at the local server",
      wrong: ["Call hosted frontier models through it for free", "Run any hosted model's weights locally", "Skip the chat template, because the server ignores roles"],
      why: "Compatible means the same endpoints and message format, such as /v1/chat/completions. Your app swaps a URL; the model behind it is still the local one." },
    { id: "template", level: "hard", kind: "concept",
      q: "A local chat model gives rambling, odd replies, though the same model works well in its official runtime. What is a likely cause?",
      answer: "The prompt is not in the chat template the model was fine-tuned with",
      wrong: ["Local models cannot follow instructions", "The temperature must be exactly 0 for local models", "The GPU is too slow, which changes the words"],
      why: "Chat models learn special tokens that mark system, user and assistant turns during fine-tuning. Send plain text, or the wrong template, and the model sees an unfamiliar format. Speed never changes which tokens come out." },
    { id: "gb-13", level: "easy", kind: "numeric",
      q: `How much memory do the weights of a ${P13}B model take at 8-bit?`,
      answer: `${r1(gb(P13, 8))} GB`, wrong: [`${r1(gb(P13, 16))} GB`, `${r1(gb(P13, 4))} GB`, `${r1(P13 * 8)} GB`],
      why: `8 bits is 1 byte, so ${P13} billion weights take ${r1(gb(P13, 8))} GB. 16-bit doubles that to ${r1(gb(P13, 16))} GB.` },
    { id: "gb-70", level: "medium", kind: "numeric",
      q: `A ${P70}B model at 4-bit: how much memory do its weights need?`,
      answer: `${r1(gb(P70, 4))} GB`, wrong: [`${r1(gb(P70, 8))} GB`, `${r1(gb(P70, 16))} GB`, `${r1(P70 / 4)} GB`],
      why: `${P70} billion × 0.5 bytes = ${r1(gb(P70, 4))} GB, before the KV cache. That rules out a 24 GB card but fits a machine with 48 GB or more.` },
    { id: "speed", level: "hard", kind: "numeric",
      q: `A model's weights take ${WGB} GB and your memory bandwidth is ${BW} GB/s. Roughly how many tokens per second can it write at most, at batch size 1?`,
      answer: String(BW / WGB), wrong: [String(BW * WGB), String(BW), String(WGB)],
      why: `Each token reads all ${WGB} GB once, so at most ${BW} / ${WGB} = ${BW / WGB} tokens per second. Real speed is a bit lower; halving the weights by quantising roughly doubles it.` },
    { id: "py-gb", level: "easy", kind: "output",
      q: "What does this print?",
      code: `params = ${P8}e9\nbits = ${B4}\nprint(params * bits / 8 / 1e9)`,
      answer: r1(gb(P8, B4)), wrong: [String(gb(P8, B4)), r1(gb(P8, 16)), r1(P8 * B4)],
      why: `${P8} billion × ${B4} bits ÷ 8 bits per byte = ${gb(P8, B4)} billion bytes, about ${gb(P8, B4)} GB. Python prints a float division result as ${r1(gb(P8, B4))}.` },
    { id: "when-local", level: "medium", kind: "explain",
      q: "When would you run a model locally instead of calling an API?",
      answer: "- Data that must not leave your machines: health, legal, internal code.\n- Offline or edge use with no reliable network.\n- Steady, high volume of simple tasks where hardware beats per-token prices.\n- Full control over the model version, so it never changes under you.\n\nOnly after a small open model passes your evals for the task; for the hardest reasoning, hosted frontier models usually win." },
    { id: "eval-quant", level: "hard", kind: "explain",
      q: "You want to swap a 16-bit model for its 4-bit version. How do you decide?",
      answer: "Run both on the same eval set for your real task and compare accuracy, not just a general benchmark. Look at the failures: quantisation errors tend to hit long reasoning, maths and rare facts first.\n\nAlso measure memory, tokens per second and latency on the target machine. Ship the 4-bit version if the quality drop is within what the task can tolerate; otherwise try a gentler level such as 8-bit." },
    { id: "team", level: "medium", kind: "explain",
      q: "One developer runs a model locally with a desktop tool. Now 50 people need it. What changes?",
      answer: "A desktop runner is built for one user. For a team, run the model on a shared GPU server behind the same OpenAI-compatible API, with a serving engine that batches many requests together (Stage 9 covers continuous batching).\n\nAdd what an API provider would give you: authentication, rate limits, logging of tokens and latency, monitoring, and a plan for model updates." },
    { id: "trap-quarter", level: "easy", kind: "trap",
      claim: "4-bit weights take a quarter of the memory of 16-bit weights.",
      truth: true,
      why: `4 / 16 = 1/4. An ${P}B model goes from ${gb(P, 16)} GB to ${gb(P, 4)} GB of weights. A little extra is stored for the scales, and the KV cache is separate.` },
    { id: "trap-cheaper", level: "medium", kind: "trap",
      claim: "Running a model locally is always cheaper than paying for an API.",
      truth: false,
      why: "Hardware, power and your time cost money, and a GPU sitting idle most of the day is expensive per token. Local wins on cost only with steady, high volume that a small model can handle." },
    { id: "trap-licence", level: "hard", kind: "trap",
      claim: "If a model's weights are free to download, you may use it for anything, including any commercial product.",
      truth: false,
      why: "Downloadable weights come with a licence. Some are fully permissive, others restrict use, scale or field. Read it before shipping." },
  ],
  real: [
    { who: "Elias Frantar and co-authors (GPTQ)", when: "2022",
      what: "GPTQ quantised the weights of a 175 billion parameter model to 3 or 4 bits in about four GPU hours, with negligible accuracy loss reported. The compressed model could run on a single GPU, with end-to-end speedups of about 3.25x on one GPU type and 4.5x on another, compared with 16-bit.",
      takeaway: "Fewer bits per weight shrink memory and speed up decoding, often with little quality lost. Measure it on your task.",
      url: "https://arxiv.org/abs/2210.17323" },
    { who: "Georgi Gerganov and the llama.cpp community", when: "2023",
      what: "llama.cpp began in March 2023 as a plain C/C++ implementation of model inference. Its GGUF format, introduced in August 2023, stores tensors and metadata in one file and supports 2-bit to 8-bit integer types. It includes a server with OpenAI-compatible endpoints such as v1/chat/completions.",
      takeaway: "Efficient code plus quantisation turned ordinary laptops into machines that can run useful models.",
      url: "https://en.wikipedia.org/wiki/Llama.cpp" },
    { who: "Ollama documentation", when: "2026",
      what: "The docs say Ollama offers a subset of the OpenAI API at http://localhost:11434/v1/, including chat completions, completions, models and embeddings. The local server ignores the API key, though OpenAI clients still need some value for it.",
      takeaway: "Moving from a hosted API to a local model can be a base URL change; the quality check is the real work.",
      url: "https://docs.ollama.com/api/openai-compatibility" },
  ],
};
