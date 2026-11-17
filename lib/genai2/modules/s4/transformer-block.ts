// Stage 4: the transformer block. Every number below is computed here or in blockPass (stages/s4.flows.ts).
import type { GModule } from "../../types.ts";
import { blockPass } from "../../stages/s4.flows.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);

const pass = blockPass();
// predict: a sublayer that outputs zeros
const X0 = [1.5, -2, 0.5];
// numeric: FFN weights; SwiGLU width that matches; attention weights
const DF = 768, ffn = 2 * DF * 4 * DF, swiH = (8 * DF) / 3;
const DA = 512;
// output: RMSNorm of [3, 4]
const RX = [3, 4], rms = Math.sqrt(RX.reduce((s, v) => s + v * v, 0) / RX.length), rn = RX.map((v) => r2(v / rms));

export const TRANSFORMER_BLOCK: GModule = {
  id: "transformer-block",
  stage: 4,
  title: "The block (norm, FFN, residual)",
  lab: "transformer",
  hook: "A transformer is one block repeated dozens of times. Each block lets tokens talk (attention), lets each token think on its own (the FFN), and never throws away what came before (the residual).",
  blocks: [
    { kind: "figure", id: "s4-block", caption: "A pre-norm block. The residual stream runs straight down. Each sublayer reads a normalised copy and adds its answer back, so the stream is edited, never replaced." },
    { kind: "text", md: "**Two sublayers, two jobs.** Attention moves information between tokens. The feed-forward network (FFN) then works on each token alone, with the same weights at every position: widen, apply a nonlinearity, narrow back.\n\n**Residuals and norms keep it trainable.** Each sublayer adds to x instead of replacing it, and a norm keeps the numbers each sublayer sees at a steady size." },
    { kind: "flow", id: "s4-block-pass" },
    {
      kind: "predict",
      q: `A pre-norm block's attention and FFN both output all zeros for a token whose vector is [${X0.join(", ")}]. What leaves the block?`,
      answer: `[${X0.join(", ")}], unchanged`,
      wrong: [`[${X0.map(() => 0).join(", ")}]`, `Its normalised copy, [${X0.map((v) => r2(v / Math.sqrt(X0.reduce((s, x) => s + x * x, 0) / X0.length))).join(", ")}]`, "Nothing: the token is dropped from the sequence"],
      why: "Each sublayer is added: x + 0 = x. A block can therefore learn to do almost nothing, which is why stacking many blocks is safe, and why gradients reach early layers through the plain additions.",
    },
    {
      kind: "mermaid",
      caption: "Post-norm (the original transformer) normalises after each addition. Pre-norm (most recent LLMs) normalises only the copy each sublayer reads, leaving a clean path down the stream.",
      src: `flowchart TB
  subgraph POST["Post-norm"]
    P1["x"] --> P2["x + attention(x)"] --> P3["norm"]:::warn
  end
  subgraph PRE["Pre-norm"]
    Q1["x"] --> Q2["norm, then attention"] --> Q3["x + result"]:::ok
  end
  POST ~~~ PRE`,
    },
    { kind: "play", id: "s4-ffn-share" },
    {
      kind: "compare",
      head: ["", "Post-norm", "Pre-norm"],
      rows: [
        ["Where the norm sits", "After x + sublayer(x)", "Before the sublayer, on its input only"],
        ["Path down the stream", "Passes through a norm in every block", "Plain additions all the way"],
        ["Training", "Usually needs a careful learning-rate warm-up", "Stable gradients at the start; one 2020 paper trained it without warm-up"],
        ["Extra", "", "One final norm after the last block"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def rmsnorm(x, g, eps=1e-6):
    return g * x / np.sqrt((x ** 2).mean(-1, keepdims=True) + eps)

def attention(x, Wq, Wk, Wv, Wo):
    T, d = x.shape
    s = (x @ Wq) @ (x @ Wk).T / np.sqrt(d)
    s = np.where(np.tril(np.ones((T, T), dtype=bool)), s, -np.inf)   # causal
    w = np.exp(s - s.max(-1, keepdims=True)); w /= w.sum(-1, keepdims=True)
    return w @ (x @ Wv) @ Wo

def swiglu(x, Wg, Wu, Wd):
    gate = x @ Wg
    return (gate / (1 + np.exp(-gate)) * (x @ Wu)) @ Wd   # SiLU(gate) times up, then down

def block(x, p):
    x = x + attention(rmsnorm(x, p["g1"]), *p["attn"])   # pre-norm, residual
    x = x + swiglu(rmsnorm(x, p["g2"]), *p["ffn"])
    return x

rng = np.random.default_rng(0)
T, d, hid = 4, 8, 16
W = lambda a, b: rng.normal(size=(a, b)) / np.sqrt(a)
p = {"g1": np.ones(d), "g2": np.ones(d),
     "attn": [W(d, d) for _ in range(4)], "ffn": [W(d, hid), W(d, hid), W(hid, d)]}
x = rng.normal(size=(T, d))
y = block(x, p)
print("in", x.shape, "out", y.shape)
print("rms after norm:", np.round(np.sqrt((rmsnorm(x, p["g1"]) ** 2).mean(-1)), 3))

assert y.shape == x.shape                       # a block keeps the shape, so blocks stack
zero = {**p, "attn": [np.zeros((d, d))] * 4, "ffn": [np.zeros((d, hid))] * 2 + [np.zeros((hid, d))]}
assert np.allclose(block(x, zero), x)           # zero sublayers: the residual passes x through
`,
    },
    { kind: "text", md: "**Modern defaults.** RMSNorm replaces LayerNorm: it only divides by the root mean square, with no mean subtraction. SwiGLU replaces the plain ReLU FFN: a gate branch and an up branch are multiplied, then projected down. With three matrices instead of two, the hidden width is cut to about 8d/3 to keep the weights equal." },
  ],
  keyPoints: [
    "A block is attention (tokens exchange information) then an FFN (each token processed alone with shared weights).",
    "Each sublayer is residual: x = x + sublayer(norm(x)), so the stream is added to, never replaced.",
    "Pre-norm puts the norm before each sublayer and leaves a clean additive path, which trains deep stacks more stably than post-norm.",
    "RMSNorm rescales by the root mean square only; SwiGLU is a gated FFN with three matrices.",
    "The FFN holds most of a block's weights: about 8d squared against 4d squared for attention at a 4d hidden width.",
  ],
  questions: [
    { id: "ffn-job", level: "easy", kind: "concept",
      q: "What does the feed-forward network in a block do?",
      answer: "Transforms each token's vector on its own, with the same weights at every position",
      wrong: ["Moves information between tokens", "Predicts the next token directly", "Applies the causal mask"],
      why: "Mixing between tokens happens only in attention. The FFN is a small MLP run on every position independently, which is where much of the model's stored knowledge appears to live." },
    { id: "residual-is", level: "easy", kind: "concept",
      q: "What is a residual connection?",
      answer: "The sublayer's output is added to its input: x + f(x)",
      wrong: ["The sublayer's output replaces its input", "The input is multiplied by the output", "The previous block's weights are reused"],
      why: "Adding keeps the original signal. A sublayer only has to learn a change to x, and gradients flow back through the plus sign unchanged." },
    { id: "pre-norm", level: "medium", kind: "concept",
      q: "In a pre-norm block, where is the normalisation applied?",
      answer: "To the input of each sublayer, before attention or the FFN reads it",
      wrong: ["To the residual stream after each addition", "Only once, after the last block", "To the attention weights after softmax"],
      why: "Pre-norm computes x + f(norm(x)). The stream itself is never normalised inside the stack, so there is a clean additive path from the output back to the input. A final norm sits after the last block." },
    { id: "rmsnorm", level: "medium", kind: "concept",
      q: "How does RMSNorm differ from LayerNorm?",
      answer: "It skips subtracting the mean and only divides by the root mean square, times a learned scale",
      wrong: ["It normalises across the batch instead of across features", "It subtracts the mean but does not divide", "It has no learned parameters at all"],
      why: "LayerNorm centres and scales each vector. RMSNorm drops the centring, which is cheaper and in practice works as well for LLMs. Both work per token, across its features." },
    { id: "residual-grad", level: "hard", kind: "concept",
      q: "Why do residual connections help a 50-block model train?",
      answer: "The gradient has a direct path through the additions, so it reaches early blocks without shrinking through every layer",
      wrong: ["They halve the number of parameters", "They remove the need for a learning rate", "They make every block compute the same function"],
      why: "The derivative of x + f(x) with respect to x is 1 plus that of f. Even if f's gradient is small, the 1 carries the signal back, so deep stacks do not suffer vanishing gradients." },
    { id: "swiglu-width", level: "hard", kind: "concept",
      q: "SwiGLU uses three matrices where the ReLU FFN uses two. How do models keep the weight count about the same?",
      answer: "They shrink the hidden width from 4d to about 8d/3",
      wrong: ["They drop the down projection", "They share one matrix between gate and up", "They halve the model width d"],
      why: "2 x d x 4d = 8d squared. With three d by h matrices, 3 x d x h = 8d squared gives h = 8d/3." },
    { id: "ffn-params", level: "medium", kind: "numeric",
      q: `d = ${DF}, and the FFN widens to 4d and back, with no biases. How many weights does it have?`,
      answer: n0(ffn), wrong: [n0(ffn / 2), n0(DF * DF), n0(ffn * 2)],
      why: `Two matrices: ${DF} x ${n0(4 * DF)} and ${n0(4 * DF)} x ${DF}, so 2 x ${DF} x ${n0(4 * DF)} = ${n0(ffn)}.` },
    { id: "swiglu-h", level: "medium", kind: "numeric",
      q: `d = ${DF}. What SwiGLU hidden width gives the same weight count as a 4d ReLU FFN?`,
      answer: n0(swiH), wrong: [n0(4 * DF), n0(3 * DF), n0(DF)],
      why: `8d/3 = 8 x ${DF} / 3 = ${n0(swiH)}. Check: 3 x ${DF} x ${n0(swiH)} = ${n0(3 * DF * swiH)}, the same as 2 x ${DF} x ${n0(4 * DF)}.` },
    { id: "attn-params", level: "easy", kind: "numeric",
      q: `d = ${DA}. How many weights are in a block's attention projections W_Q, W_K, W_V and W_O, without biases?`,
      answer: n0(4 * DA * DA), wrong: [n0(DA * DA), n0(3 * DA * DA), n0(4 * DA)],
      why: `Four ${DA} by ${DA} matrices: 4 x ${n0(DA * DA)} = ${n0(4 * DA * DA)}. Forgetting W_O gives 3d squared.` },
    { id: "rms-out", level: "medium", kind: "output",
      q: "What does this RMSNorm (scale 1) print?",
      code: `import numpy as np\nx = np.array([${RX.map((v) => v.toFixed(1)).join(", ")}])\nprint(np.round(x / np.sqrt(np.mean(x ** 2)), 2))`,
      answer: `[${rn.join(" ")}]`, wrong: [`[${RX.map((v) => String(+(v / 5).toFixed(2))).join(" ")}]`, `[${RX.map((v) => String(+(v / 7).toFixed(2))).join(" ")}]`, "[-1. 1.]"],
      why: `The mean of the squares is (9 + 16) / 2 = 12.5, whose root is ${r2(rms)}. Dividing gives ${rn.join(" and ")}. Dividing by its Euclidean length, 5, is a different operation; LayerNorm would first subtract the mean and give -1 and 1.` },
    { id: "explain-block", level: "medium", kind: "explain",
      q: "Walk through one pre-norm decoder block.",
      answer: `1. Take the residual stream x.\n2. h = RMSNorm(x); run masked multi-head attention on h; x = x + result.\n3. h = RMSNorm(x); run the FFN on h, each token alone; x = x + result.\n4. Pass x to the next block. The shape never changes, so blocks stack.\n\nIn the walk-through above the token went from [${pass.x.join(", ")}] to [${pass.x2.map(r2).join(", ")}]: two additions, never a replacement.` },
    { id: "explain-prenorm", level: "hard", kind: "explain",
      q: "Why do most recent LLMs use pre-norm rather than post-norm?",
      answer: "In post-norm, every residual path passes through a norm, and the gradients near the output are large at initialisation. Training is unstable unless the learning rate warms up slowly.\n\nPre-norm normalises only what each sublayer reads, so the stream is a clean sum from input to output. Gradients are well behaved from the start, deep stacks train reliably, and warm-up matters less. The cost is one extra norm at the end, since the stream itself is never normalised." },
    { id: "explain-roles", level: "medium", kind: "explain",
      q: "Attention and the FFN both transform vectors. What is the difference in their roles?",
      answer: "- Attention is communication: a token's output is a weighted mix of other tokens' values, so information moves between positions. It is the only place this happens.\n- The FFN is computation: it looks at one token's vector alone and transforms it, with the same weights everywhere. It holds most of the block's weights, and much factual knowledge appears to be stored there.\n\nA block alternates the two: gather context, then process it." },
    { id: "trap-ffn-shared", level: "easy", kind: "trap",
      claim: "The FFN in a block applies the same weights to every token position.",
      truth: true,
      why: "It is one MLP run on each position independently. That is why it cannot move information between tokens; only attention can." },
    { id: "trap-batchnorm", level: "medium", kind: "trap",
      claim: "LayerNorm and RMSNorm normalise across the batch, like batch norm.",
      truth: false,
      why: "Both normalise each token's own vector across its features, so a token's result does not depend on the rest of the batch. That makes them work the same in training and in one-token generation." },
    { id: "trap-no-residual", level: "hard", kind: "trap",
      claim: "Without residual connections, a 100-block transformer trains just as well, only more slowly.",
      truth: false,
      why: "Without the additive path, the gradient must pass through every sublayer's derivative in turn and tends to vanish or explode. Deep transformers rely on residuals to train at all." },
  ],
  real: [
    { who: "Ruibin Xiong and co-authors", when: "2020",
      what: "The paper \"On Layer Normalization in the Transformer Architecture\" argued that with the norm after the residual (post-norm), gradients near the output are large at initialisation, which is why a learning-rate warm-up is needed. With the norm inside the residual block (pre-norm), gradients are well behaved.",
      takeaway: "The authors removed the warm-up for pre-norm transformers and report comparable results with significantly less training time and tuning.",
      url: "https://arxiv.org/abs/2002.04745" },
    { who: "Noam Shazeer", when: "2020",
      what: "The paper \"GLU Variants Improve Transformer\" tested gated linear units, an elementwise product of two linear projections with one passed through a nonlinearity, in the transformer's feed-forward sublayer.",
      takeaway: "Some variants gave quality improvements over the standard ReLU or GELU activations.",
      url: "https://arxiv.org/abs/2002.05202" },
  ],
};
