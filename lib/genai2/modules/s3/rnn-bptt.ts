// Stage 3, module 2: the recurrent net, how it is trained (backprop through time) and why its gradients vanish or explode. Every number is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r3 = (x: number) => x.toFixed(3);

// predict: a linear RNN's gradient factor after k steps
const [PU, PK] = [0.5, 10], pv = PU ** PK;
// numeric: parameter count
const [D, H] = [100, 200], params = H * D + H * H + H;
// numeric: 0.9 to the 50
const [DU, DK] = [0.9, 50], decay = DU ** DK;
// output: a scalar RNN on one pulse
const OU = 0.5, OX = [1, 0, 0];
const outH = OX.reduce<number[]>((hs, x) => [...hs, Math.tanh(x + OU * (hs.at(-1) ?? 0))], []);
const pyList = (xs: number[]) => `[${xs.map((x) => String(Number(x.toFixed(2)))).join(", ")}]`;
// trap: clipping
const CLIP = 5;
// truncated BPTT
const CHUNK = 20;

export const RNN_BPTT: GModule = {
  id: "rnn-bptt",
  stage: 3,
  title: "RNN and BPTT",
  hook: "A recurrent net reads one token at a time and carries a memory forward. Training it means sending the error back through every step, and that is where it struggles. Builds on [[backprop-graph]], gradient clipping from [[optimisers]] and the order problem in [[why-order-matters]].",
  blocks: [
    { kind: "figure", id: "s3-unroll", caption: "One cell with a loop is the same as a chain of copies that share W and U. Training sends the gradient back along the chain (dashed), through U at every step." },
    { kind: "text", md: "**The recurrence:** h_t = tanh(W x_t + U h_{t-1} + b). The new state mixes the current input with the previous state, through the same W and U at every step. An output, if the task needs one, is read from h_t.\n\nThe walk-through runs a one-number RNN forward on a single pulse of input, then sends the gradient back." },
    { kind: "flow", id: "s3-rnn-steps" },
    {
      kind: "predict",
      q: `A linear RNN has recurrent weight u = ${PU} and no tanh. How big is the gradient factor from step t back to step t - ${PK}?`,
      answer: r3(pv), wrong: [r3(PU), r3(PU / PK), r3(PU * PK)],
      why: `Each step back multiplies by u, so ${PK} steps give u to the ${PK} = ${PU}^${PK} = ${pv.toFixed(6)}, about ${r3(pv)}. Repeated multiplication, not addition, is why gradients shrink so fast.`,
    },
    { kind: "play", id: "s3-vanish" },
    {
      kind: "compare",
      head: ["", "Vanishing", "Exploding"],
      rows: [
        ["Cause", "Factors below 1 multiplied over many steps", "Factors above 1 multiplied over many steps"],
        ["Symptom", "Loss falls, but long-range links are never learned", "Loss jumps or becomes NaN"],
        ["Easy to see?", "No, training just quietly plateaus", "Yes, it breaks loudly"],
        ["Fixes", "Gated cells (LSTM, GRU), good init, residual paths, attention", `Gradient norm clipping, for example to ${CLIP}; a lower learning rate`],
      ],
    },
    {
      kind: "mermaid",
      caption: `Truncated BPTT on a long stream: the state is carried forward, but gradients stop at each ${CHUNK}-step chunk boundary.`,
      src: `flowchart TB
  C1["chunk 1: steps 1 to ${CHUNK}<br/>forward, then backward"] -->|"pass h forward, no gradient"| C2["chunk 2: steps ${CHUNK + 1} to ${2 * CHUNK}<br/>forward, then backward"]
  C2 -->|"pass h forward, no gradient"| C3["chunk 3 ..."]
  C2 -.->|"cut"| X["gradient never crosses a boundary"]:::warn`,
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
d, h, T = 3, 4, 6
W = rng.normal(0, 0.5, (h, d))
U = rng.normal(0, 0.5, (h, h))
xs = rng.normal(size=(T, d))
target = rng.normal(size=h)

def forward(U):
    hs = [np.zeros(h)]
    for x in xs:                                  # one step at a time, in order
        hs.append(np.tanh(W @ x + U @ hs[-1]))
    return 0.5 * np.sum((hs[-1] - target) ** 2), hs

def bptt(U):
    loss, hs = forward(U)
    dU, dh, sizes = np.zeros_like(U), hs[-1] - target, []
    for t in range(T, 0, -1):                     # walk the chain backwards
        da = dh * (1 - hs[t] ** 2)                # back through tanh
        dU += np.outer(da, hs[t - 1])             # U is shared: add every step's share
        dh = U.T @ da                             # hand the gradient to h_{t-1}
        sizes.append(np.linalg.norm(dh))
    return dU, sizes

dU, sizes = bptt(U)
eps, E = 1e-6, np.zeros_like(U)
E[0, 1] = eps
numeric = (forward(U + E)[0] - forward(U - E)[0]) / (2 * eps)
print("BPTT:", round(dU[0, 1], 6), " finite difference:", round(numeric, 6))
print("gradient size at h_t, going back:", np.round(sizes, 4))
assert np.isclose(dU[0, 1], numeric, atol=1e-6)
`,
    },
  ],
  keyPoints: [
    "An RNN updates h_t = tanh(W x_t + U h_{t-1} + b) with the same W and U at every step, so its size does not depend on the length.",
    "Backprop through time unrolls the loop into a chain and runs ordinary backprop; the gradient for a shared weight is the sum over all steps.",
    "Going back k steps multiplies k factors of U and the tanh slope, so the gradient shrinks (vanishes) or grows (explodes) roughly exponentially in k.",
    "Clipping the gradient norm stops explosions; vanishing needs a different design, such as the gated cells of [[lstm-gru]], the next module.",
    "Each step needs the previous state, so an RNN cannot process the positions of a sequence in parallel.",
  ],
  questions: [
    { id: "same-weights", level: "easy", kind: "concept",
      q: "In an unrolled RNN, what is true of the weights W and U at different time steps?",
      answer: "They are the same matrices, reused at every step",
      wrong: ["Each step has its own copy, learned separately", "U is used only at the first step", "They are re-initialised at the start of every step"],
      why: "Unrolling is only a picture of the loop. Sharing means one set of weights serves every step, which is why an RNN handles any length and its parameter count does not grow." },
    { id: "h-depends", level: "easy", kind: "concept",
      q: "What does an RNN use to compute the hidden state h_t?",
      answer: "The current input x_t and the previous hidden state h_{t-1}",
      wrong: ["Only the current input x_t", "All inputs x_1 to x_n at once", "Only the previous output y_{t-1}"],
      why: "The previous state is the memory: everything before step t reaches h_t only through h_{t-1}. That single path is both the RNN's strength and its bottleneck." },
    { id: "vanish-cause", level: "medium", kind: "concept",
      q: "What causes vanishing gradients in a plain RNN?",
      answer: "The gradient is multiplied by U and the tanh slope at every step back, and these factors are usually smaller than 1",
      wrong: ["The learning rate is set too small", "The softmax output saturates at the last step", "The model has too many parameters for the data"],
      why: "Backprop through k steps is a product of k Jacobians. A product of k numbers below 1 shrinks exponentially, so steps far back get almost no learning signal. A smaller learning rate scales every gradient equally and does not change which steps vanish." },
    { id: "clip-fix", level: "medium", kind: "concept",
      q: "Training an RNN, the loss suddenly becomes NaN after a huge update. What is the standard fix?",
      answer: "Clip the gradient norm before each update",
      wrong: ["Switch tanh to sigmoid", "Raise the learning rate so training escapes the bad region", "Add dropout to the hidden state"],
      why: "A sudden huge step is an exploding gradient. Clipping rescales the whole gradient vector when its norm passes a threshold, keeping the direction but capping the step. Sigmoid has an even smaller slope, which helps nothing here and worsens vanishing." },
    { id: "tanh-slope", level: "medium", kind: "concept",
      q: "What is the largest value of the derivative of tanh, and where does it occur?",
      answer: "1, at input 0", wrong: ["0.25, at input 0", "1, at very large inputs", "It has no maximum"],
      why: "tanh'(a) = 1 - tanh(a)^2, which is 1 at a = 0 and falls towards 0 as the unit saturates. So each step back multiplies by at most |U|-sized factors, and by much less when units saturate. 0.25 is the sigmoid's maximum slope." },
    { id: "truncated", level: "hard", kind: "concept",
      q: `With truncated BPTT, a long stream is trained in chunks of ${CHUNK} steps, and the state is carried from one chunk to the next. What does the model lose?`,
      answer: `Gradients never cross a chunk boundary, so learning cannot directly link events more than ${CHUNK} steps apart`,
      wrong: [`The forward pass can only see the last ${CHUNK} inputs`, `The model cannot be run on sequences longer than ${CHUNK} at test time`, "The hidden state must be reset to zero at every chunk"],
      why: `The forward state still flows across chunks, so the model can use older information. But no error signal travels back more than ${CHUNK} steps, so it is never trained to store something for longer than that. It is a trade of long-range learning for memory and speed.` },
    { id: "singular", level: "hard", kind: "concept",
      q: "In a linear RNN h_t = U h_{t-1}, what happens to the gradient sent back k steps if the largest singular value of U is below 1?",
      answer: "It shrinks at least as fast as that singular value to the power k",
      wrong: ["It grows, because U is applied k times", "It is unchanged, because U is the same at every step", "It depends only on the inputs, not on U"],
      why: "The gradient back k steps is multiplied by U transposed k times. The largest singular value is the most any vector can be stretched, so below 1 every direction shrinks geometrically. Above 1 some direction can grow, which is when explosions become possible." },
    { id: "param-count", level: "medium", kind: "numeric",
      q: `An RNN has input size ${D} and hidden size ${H}, with one bias vector. How many parameters are in W, U and b together?`,
      answer: n0(params), wrong: [n0(H * D + H), n0(H * D + H * H), n0(H * D + D * D + H)],
      why: `W is ${H} × ${D} = ${n0(H * D)}, U is ${H} × ${H} = ${n0(H * H)}, b is ${H}: ${n0(params)}. The same count serves a 5 word or a 5,000 word input.` },
    { id: "decay-50", level: "medium", kind: "numeric",
      q: `Every step back multiplies the gradient by ${DU}. What is left after ${DK} steps, to 3 decimals?`,
      answer: r3(decay), wrong: [r3(DU), r3(1 - DU), r3(0.5)],
      why: `${DU}^${DK} = ${decay.toFixed(5)}. Even a factor close to 1 leaves about half a percent after ${DK} steps. That is the vanishing gradient in one line.` },
    { id: "pulse-output", level: "easy", kind: "output",
      q: "A one-number RNN gets a single pulse of input, then zeros. What does this print?",
      code: `import math\nu, h, hs = ${OU}, 0.0, []\nfor x in [${OX.join(", ")}]:\n    h = math.tanh(x + u * h)\n    hs.append(round(h, 2))\nprint(hs)`,
      answer: pyList(outH), wrong: [pyList([outH[0], outH[0], outH[0]]), pyList([1, OU, OU * OU]), pyList([outH[0], 0, 0])],
      why: `Step 1: tanh(1) = ${outH[0].toFixed(2)}. After that the input is 0, so each step is tanh(${OU} × h): the memory of the pulse fades step by step. With u below 1 and no new input, an RNN forgets.` },
    { id: "explain-bptt", level: "medium", kind: "explain",
      q: "Explain backpropagation through time.",
      answer: "1. Unroll the RNN over the sequence: one copy of the cell per step, all sharing W and U.\n2. Run the forward pass step by step, keeping every hidden state.\n3. Compute the loss (at the last step, or summed over steps).\n4. Run ordinary backprop backwards along the chain. At each step the gradient goes back through the tanh and then through U to the previous state.\n5. Because W and U are shared, their gradient is the sum of the contributions from every step.\n\nMemory grows with the length, since all states are stored. Truncated BPTT limits this by backpropagating over fixed-size chunks." },
    { id: "vanish-explode", level: "hard", kind: "explain",
      q: "Why do RNN gradients vanish or explode, and how is each handled?",
      answer: "The gradient from step t back to step t - k is a product of k Jacobians, each roughly U transposed times the tanh slope. A product of k factors behaves like a number raised to the power k: below 1 it vanishes, above 1 it can explode.\n\n- **Exploding:** clip the gradient norm, so a rare huge step is capped. Easy to detect, since the loss spikes or becomes NaN.\n- **Vanishing:** harder, because training just quietly fails to learn long-range links. Fixes change the architecture: LSTM and GRU add a gated, mostly additive path; careful initialisation helps; attention gives direct paths that skip the chain entirely." },
    { id: "sum-over-time", level: "hard", kind: "explain",
      q: "Why is the gradient for U a sum over time steps, and what does that mean for long sequences?",
      answer: "U is used at every step, so changing it changes every step's computation. By the multivariable chain rule, its total gradient adds up each step's contribution.\n\nEach contribution measures how the loss depends on U through a path of some length. Short paths give large terms, long paths give tiny (vanished) terms. So the sum is dominated by recent steps, and the update mostly teaches short-range patterns, even though the sum formally includes every step." },
    { id: "trap-params-fixed", level: "easy", kind: "trap",
      claim: "An RNN has the same number of parameters whether it reads 10 tokens or 10,000 tokens.",
      truth: true,
      why: `The same W, U and b are reused at every step: ${n0(params)} at input ${D}, hidden ${H}. What grows with length is compute, and the memory for the stored states during training.` },
    { id: "trap-clip-vanish", level: "medium", kind: "trap",
      claim: "Gradient clipping fixes vanishing gradients.",
      truth: false,
      why: `Clipping only scales a gradient down when its norm exceeds a threshold, such as ${CLIP}. A vanishing gradient is already tiny, so clipping leaves it untouched. Vanishing needs gated cells, better initialisation or attention.` },
  ],
  real: [
    { who: "Razvan Pascanu, Tomas Mikolov and Yoshua Bengio", when: "2012",
      what: "The paper \"On the difficulty of training Recurrent Neural Networks\" studied the vanishing and exploding gradient problems from analytical, geometric and dynamical systems views. It proposed gradient norm clipping for exploding gradients and a soft constraint for vanishing ones.",
      takeaway: "Gradient clipping, now a default in training recipes, was proposed as the answer to exploding gradients in RNNs.",
      url: "https://arxiv.org/abs/1211.5063" },
  ],
};
