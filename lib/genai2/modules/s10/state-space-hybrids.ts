// Stage 10: state space models and hybrids. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { attnMixFlops, kvGB, kvNumbers, LC, n0, r1, scan, ssmMixFlops, ssmNumbers, SSM } from "../../stages/s10.calc.ts";

const { d, N } = SSM, STATE = ssmNumbers(d, N), KV1 = kvNumbers(1, d), CROSS = STATE / KV1;
// numeric: mixing cost ratio at 32K
const FN = 32768, FR = attnMixFlops(FN, d) / ssmMixFlops(FN, d, N), FR1 = attnMixFlops(1024, d) / ssmMixFlops(1024, d, N);
// numeric: hybrid KV cache, one attention layer in EVERY
const HT = 131072, EVERY = 8, FULL = kvGB(HT), HYB = FULL / EVERY, ATT_LAYERS = LC.layers / EVERY;
// output: a scalar scan
const OX = [2, 0, 0, 4], OA = 0.5, OH = scan(OX, OA, 1, 1).at(-1)!.h;
// predict: decode cost late in a sequence
const [P1, P2] = [1000, 100000];

export const STATE_SPACE_HYBRIDS: GModule = {
  id: "state-space-hybrids",
  stage: 10,
  title: "State space models and hybrids",
  hook: "Attention re-reads every past token for each new one. A state space model squeezes the past into a fixed-size state and updates it token by token, so its cost grows in a straight line. Hybrids mix the two to get both speed and sharp recall.",
  blocks: [
    { kind: "figure", id: "s10-state-vs-kv", caption: `While decoding, attention keeps ${n0(KV1)} numbers per token per layer, so its cache grows without end. The state space layer keeps ${n0(STATE)}, whatever the length.` },
    { kind: "text", md: "**The idea.** A state space model (SSM) is a linear recurrence: each token updates a hidden state, h = a·h + b·x, and the output reads it, y = c·h. Like an RNN it has a fixed memory, so decoding costs the same at token 10 and at token 100,000.\n\n**What made it work for language:** Mamba makes a and b depend on the current token, so the model can choose to hold or forget each input." },
    { kind: "flow", id: "s10-scan" },
    {
      kind: "predict",
      q: `An SSM layer is decoding token ${n0(P2)} instead of token ${n0(P1)}. How much state does it read to make the next token, compared with before?`,
      answer: "The same amount",
      wrong: [`${P2 / P1} times as much`, `${(P2 / P1) ** 2} times as much`, "Half as much, because old tokens have faded"],
      why: `The state has a fixed size, ${n0(d)} × ${N} per layer here. Attention, by contrast, would read ${P2 / P1} times as many keys and values at token ${n0(P2)}.`,
    },
    { kind: "play", id: "s10-ssm" },
    {
      kind: "compare",
      head: ["", "Attention", "State space layer"],
      rows: [
        ["Training cost over n tokens", "Grows with n squared", "Grows with n (parallel scan)"],
        ["Decode cost per token", "Grows with the past", "Fixed"],
        ["Memory while decoding", `KV cache: ${n0(KV1)} numbers per token per layer`, `Fixed state: ${n0(STATE)} numbers per layer`],
        ["Exact recall of an old detail", "Strong: it can look straight back", "Weaker: the detail must survive in the state"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
rng = np.random.default_rng(1)
n, d, N = 12, 4, 8
x = rng.normal(size=(n, d))

# selective: decay and input weights depend on each token, as in Mamba
W_dt = rng.normal(size=(d, d)) * 0.5
A = -np.exp(rng.normal(size=(d, N)))          # negative, so the state decays
B = rng.normal(size=(n, N)); C = rng.normal(size=(n, N))

def ssm(x):
    h = np.zeros((d, N)); ys = []
    for t in range(n):
        dt = np.log1p(np.exp(x[t] @ W_dt))     # softplus: a step size per channel, from the input
        a = np.exp(dt[:, None] * A)            # decay in (0, 1)
        h = a * h + (dt[:, None] * B[t]) * x[t][:, None]
        ys.append(h @ C[t])                    # read the state out
    return np.array(ys), h

y, h = ssm(x)
print("output", y.shape, "state", h.shape)    # the state is the same size at any n
assert h.shape == (d, N) and y.shape == (n, d)
`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  I["tokens"] --> S1["SSM layers x 3"]:::ok
  S1 --> A1["attention layer"]:::hot
  A1 --> S2["SSM layers x 3"]:::ok
  S2 --> A2["attention layer"]:::hot
  A2 --> O["next token"]`,
      caption: `A hybrid stack: mostly SSM layers for cheap long-range mixing, with a few attention layers for exact lookups. With 1 attention layer in ${EVERY}, the KV cache shrinks ${EVERY} times.`,
    },
    { kind: "text", md: `**Why hybrids.** A fixed state cannot keep every detail, so pure SSMs are weaker at copying an exact string from far back. A few attention layers fix that, and only they keep a KV cache. With ${ATT_LAYERS} attention layers out of ${LC.layers}, a ${n0(HT)} token context needs ${r1(HYB)} GB of cache instead of ${r1(FULL)} GB in the example model.` },
  ],
  keyPoints: [
    "A state space model is a linear recurrence: each token updates a fixed-size state, and the output reads it.",
    "Training runs as a parallel scan in time that grows with n; decoding costs the same at every position, with no KV cache.",
    "Mamba makes the state's decay and input depend on the token (selection), so it can keep or forget each input.",
    "A fixed state is weaker at exact recall of old details, which attention does well.",
    "Hybrids interleave many SSM layers with a few attention layers, cutting the KV cache while keeping sharp recall.",
  ],
  questions: [
    { id: "state", level: "easy", kind: "concept",
      q: "What does an SSM layer carry from one token to the next while decoding?",
      answer: "A fixed-size hidden state", wrong: ["The keys and values of every past token", "The full prompt as text", "Nothing; each token is processed alone"],
      why: "The state is the whole memory. Its size is set by the model's width and state size, not by how many tokens came before." },
    { id: "selective", level: "medium", kind: "concept",
      q: "What did Mamba change compared with earlier state space models?",
      answer: "It made the state's parameters depend on the input, so it can choose what to keep",
      wrong: ["It added full attention to every layer", "It made the state grow with the sequence", "It removed the recurrence and used convolutions only"],
      why: "Earlier SSMs used the same dynamics for every token, which the Mamba paper says left them weak at content-based reasoning. Input-dependent parameters let a token reset or hold the state." },
    { id: "parallel", level: "medium", kind: "concept",
      q: "If an SSM is a recurrence, how is it trained fast on GPUs?",
      answer: "The linear recurrence can be computed with a parallel scan instead of one step at a time",
      wrong: ["It is trained only on very short sequences", "It cannot be; SSMs train slower than RNNs", "Training uses attention and switches to the SSM afterwards"],
      why: "Because each update is linear in h, steps can be combined in a tree, like a prefix sum. A nonlinear LSTM cannot be split this way." },
    { id: "recall", level: "hard", kind: "concept",
      q: "A pure SSM must repeat a 30 digit code that appeared 50,000 tokens earlier. Why might it fail where attention succeeds?",
      answer: "Its fixed state may have overwritten the code; attention can look straight back at those tokens",
      wrong: ["SSMs cannot output digits", "The KV cache of the SSM overflows", "SSMs only see the last 512 tokens by design"],
      why: "Everything the SSM remembers must fit in its state, so old exact details compete with everything since. Attention keeps every key and value and can read any of them. This is the main reason for hybrids." },
    { id: "hybrid", level: "medium", kind: "concept",
      q: "Why do hybrid models keep a few attention layers among many SSM layers?",
      answer: "For exact lookups far back, while most layers stay cheap and cache-free",
      wrong: ["Because SSM layers cannot be stacked", "To make training slower but more stable", "Because the tokenizer needs attention"],
      why: "Most mixing is done by SSM layers in linear time. The few attention layers give precise retrieval, and only they need a KV cache." },
    { id: "flops", level: "medium", kind: "numeric",
      q: `At ${n0(FN)} tokens, width ${n0(d)} and state size ${N}, about how many times more mixing FLOPs does causal attention need than the SSM, per layer?`,
      answer: `About ${n0(FR)} times`, wrong: [`About ${n0(FR1)} times`, "About the same", `About ${n0(FR * 32)} times`],
      why: `Attention: 4 × d × n(n + 1)/2. SSM: 6 × d × N × n. The ratio is about n / (3N) = ${n0(FR)}. At ${n0(1024)} tokens it is only ${n0(FR1)}: the gap grows with length.` },
    { id: "hybrid-kv", level: "easy", kind: "numeric",
      q: `The example model needs ${r1(FULL)} GB of KV cache at ${n0(HT)} tokens. A hybrid keeps attention in only 1 of every ${EVERY} layers. How much KV cache does it need?`,
      answer: `${r1(HYB)} GB`, wrong: [`${r1(FULL)} GB`, "0 GB", `${r1(FULL / 2)} GB`],
      why: `Only the ${ATT_LAYERS} attention layers keep keys and values: ${r1(FULL)} / ${EVERY} = ${r1(HYB)} GB. The SSM layers add a small fixed state each.` },
    { id: "scan-out", level: "easy", kind: "output",
      q: "A one-number state with decay 0.5. What does this print?",
      code: `h = 0\nfor x in ${JSON.stringify(OX)}:\n    h = ${OA} * h + x\nprint(h)`,
      answer: String(OH), wrong: [String(OX.reduce((a, b) => a + b, 0)), String(OX.at(-1)), String(OH * 2)],
      why: `h goes ${scan(OX, OA, 1, 1).map((s) => s.h).join(", ")}. The first input has been halved three times (${OX[0]} → ${OX[0] * OA ** 3}) before the 4 is added: old inputs fade.` },
    { id: "explain-linear", level: "medium", kind: "explain",
      q: "Why does an SSM scale linearly with sequence length while attention scales quadratically?",
      answer: "Attention compares each token with every earlier token, so n tokens make about n²/2 pairs of work, and decoding a token reads the whole KV cache.\n\nAn SSM keeps a fixed-size state. Each token does a fixed amount of work: decay the state, add its input, read it out. n tokens cost n times that, and decoding a token costs the same at any position. The price is that the past is compressed into that state." },
    { id: "explain-when", level: "hard", kind: "explain",
      q: "When would you still choose a pure transformer over an SSM or hybrid?",
      answer: "- When the task depends on exact retrieval anywhere in the context, such as copying, quoting or matching a detail far back.\n- When contexts are short, so attention's quadratic cost is small and its mature tooling (kernels, caching, serving engines) wins.\n- When the best available model for your task is a transformer: quality on your evals matters more than architecture.\n\nChoose SSMs or hybrids for very long inputs, streaming, or tight memory, where the KV cache is the limit." },
    { id: "explain-design", level: "hard", kind: "explain",
      q: "Describe how a hybrid model is put together and what each part does.",
      answer: `It stacks blocks of mostly SSM (for example Mamba) layers, with an attention layer every few layers, and often MoE feed-forward layers for capacity.\n\nThe SSM layers mix information along the sequence in linear time with no cache. The attention layers give exact lookups, and only they need a KV cache, so with 1 in ${EVERY} the cache is ${EVERY} times smaller. The result handles long contexts with less memory and higher throughput than a pure transformer of similar quality.` },
    { id: "trap-fixed", level: "easy", kind: "trap",
      claim: "While decoding, an SSM layer's work per token does not grow with the number of earlier tokens.",
      truth: true,
      why: `It reads and updates the same ${n0(STATE)} number state at every step. Attention's work per token grows with the past.` },
    { id: "trap-exact", level: "medium", kind: "trap",
      claim: "An SSM remembers every past token exactly, just as a KV cache does.",
      truth: false,
      why: `Its state is fixed, here ${n0(STATE)} numbers per layer, the size of ${CROSS} tokens of KV cache. Longer pasts must be compressed into it, so detail is lost.` },
  ],
  real: [
    { who: "Albert Gu and Tri Dao", when: "2023",
      what: "Mamba made SSM parameters depend on the input, so the model can selectively keep or drop information, with a hardware-aware parallel algorithm. It reported about 5 times the inference throughput of Transformers, linear scaling in length, and a 3B model matching Transformers twice its size.",
      takeaway: "Selection was the missing piece that made recurrent models competitive on language.",
      url: "https://arxiv.org/abs/2312.00752" },
    { who: "Tri Dao and Albert Gu", when: "2024",
      what: "The state space duality paper links SSMs and attention variants through structured matrices. Its Mamba-2 core layer is 2 to 8 times faster than Mamba's while staying competitive with Transformers on language modelling.",
      takeaway: "SSMs and attention are closer relatives than they look, which makes mixing them natural.",
      url: "https://arxiv.org/abs/2405.21060" },
    { who: "The Jamba team", when: "2024",
      what: "Jamba interleaves blocks of Transformer and Mamba layers and adds MoE to some of them. It shows strong results up to 256K tokens of context, and the configuration described fits in a single 80GB GPU.",
      takeaway: "A hybrid can serve very long contexts on hardware a pure transformer of similar size would outgrow.",
      url: "https://arxiv.org/abs/2403.19887" },
  ],
};
