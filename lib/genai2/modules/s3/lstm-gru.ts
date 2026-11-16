// Stage 3, module 3: gated recurrent cells (LSTM and GRU), plus bidirectional reading. Every number is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");

// parameters, one bias vector per gate
const gateParams = (d: number, h: number) => h * (d + h) + h;
const [D, H] = [100, 128], lstmP = 4 * gateParams(D, H), gruP = 3 * gateParams(D, H);
const [CD, CH] = [256, 256];
// numeric: GRU size from an LSTM's size
const LSTM_TOTAL = 400_000, gruFromLstm = (LSTM_TOTAL * 3) / 4;
// output: one cell update
const [F, C, I, G] = [0.9, 2.0, 0.5, -0.4], cNew = String(Number((F * C + I * G).toFixed(2)));
// forget bias at init
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const keep = (f: number, k: number) => f ** k;

export const LSTM_GRU: GModule = {
  id: "lstm-gru",
  stage: 3,
  title: "LSTM and GRU",
  hook: "Give the memory a protected lane and let small gates decide what to erase, what to write and what to show. That is how an RNN learns to remember for hundreds of steps.",
  blocks: [
    { kind: "figure", id: "s3-lstm", caption: "The cell state runs along the top, touched only by one multiply (forget) and one add (write). Four small layers read the previous output and the input: three sigmoid gates and one tanh candidate." },
    { kind: "flow", id: "s3-lstm-step" },
    { kind: "text", md: "**The equations**, each a learned layer over [h_{t-1}, x_t]:\n\nf = σ(...), i = σ(...), o = σ(...), g = tanh(...)\n\nc_t = f ⊙ c_{t-1} + i ⊙ g, and h_t = o ⊙ tanh(c_t)\n\nThe cell update is a multiply and an add, not a squash through a weight matrix. Going back one step along c multiplies the gradient by f alone. With f near 1 the gradient survives." },
    {
      kind: "predict",
      q: "In an LSTM the forget gate outputs 1 and the input gate outputs 0. What is the new cell state c_t?",
      answer: "Exactly c_{t-1}, unchanged", wrong: ["Zero: the cell is erased", "The candidate g", "tanh(c_{t-1})"],
      why: "c_t = f ⊙ c_{t-1} + i ⊙ g = 1 × c_{t-1} + 0 × g. The memory passes through untouched, and so does its gradient. This is the constant error flow the LSTM was designed for.",
    },
    { kind: "play", id: "s3-gate" },
    { kind: "text", md: "**GRU: the same idea, smaller.** It has no separate cell. An update gate z mixes old and new: h_t = z ⊙ h_{t-1} + (1 - z) ⊙ h̃, where the candidate h̃ = tanh(W x_t + U (r ⊙ h_{t-1})). The reset gate r chooses how much of the past the candidate may read. Some texts and libraries swap the roles of z and 1 - z; the idea is the same." },
    {
      kind: "compare",
      head: ["", "Plain RNN", "LSTM", "GRU"],
      rows: [
        ["States", "h", "h and a cell c", "h"],
        ["Gates", "None", "Forget, input, output", "Update, reset"],
        ["Path back one step", "U times the tanh slope", "f, elementwise, along c", "z, elementwise, along h"],
        [`Parameters at d = h = ${CD}`, n0(gateParams(CD, CH)), n0(4 * gateParams(CD, CH)), n0(3 * gateParams(CD, CH))],
      ],
    },
    { kind: "figure", id: "s3-birnn", caption: "A bidirectional RNN runs one RNN left to right and another right to left, then joins their states, so every position sees both sides. It needs the whole input first." },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

sig = lambda a: 1 / (1 + np.exp(-a))
rng = np.random.default_rng(1)
d, h = 3, 4
Wf, Wi, Wo, Wg = (rng.normal(0, 0.5, (h, h + d)) for _ in range(4))
bf, bi, bo, bg = np.ones(h), np.zeros(h), np.zeros(h), np.zeros(h)   # forget bias starts at 1

def lstm_step(x, h_prev, c_prev):
    z = np.concatenate([h_prev, x])
    f, i, o = sig(Wf @ z + bf), sig(Wi @ z + bi), sig(Wo @ z + bo)
    g = np.tanh(Wg @ z + bg)
    c = f * c_prev + i * g          # protected lane: multiply, then add
    return o * np.tanh(c), c, f

x, h0, c0 = rng.normal(size=d), rng.normal(size=h), rng.normal(size=h)
_, c1, f = lstm_step(x, h0, c0)

# the gradient of c1 with respect to c0 along the cell lane is exactly f
eps = 1e-6
dc = [(lstm_step(x, h0, c0 + eps * e)[1] - lstm_step(x, h0, c0 - eps * e)[1])[k] / (2 * eps)
      for k, e in enumerate(np.eye(h))]
print("forget gate f:", np.round(f, 3))
print("dc1/dc0      :", np.round(dc, 3))
assert np.allclose(dc, f)

params = 4 * (h * (h + d) + h)
print("LSTM parameters:", params, " GRU:", 3 * (h * (h + d) + h))
assert params == sum(m.size for m in (Wf, Wi, Wo, Wg, bf, bi, bo, bg))
`,
    },
  ],
  keyPoints: [
    "An LSTM keeps a cell state c updated by c_t = f ⊙ c_{t-1} + i ⊙ g, and shows h_t = o ⊙ tanh(c_t).",
    "Gates use sigmoid so they output fractions between 0 and 1; the candidate uses tanh so it can add or subtract.",
    "Along the cell, one step back multiplies the gradient by f only, so with f near 1 it survives many steps.",
    "A GRU merges cell and hidden state and uses two gates (update, reset), with about three quarters of an LSTM's parameters.",
    "A bidirectional RNN reads both ways and joins the states, which helps tagging and encoding but cannot generate left to right.",
  ],
  questions: [
    { id: "forget-gate", level: "easy", kind: "concept",
      q: "Which LSTM gate decides what to erase from the cell state?",
      answer: "The forget gate", wrong: ["The input gate", "The output gate", "The reset gate"],
      why: "The forget gate multiplies the old cell: 0 erases a slot, 1 keeps it. The input gate scales what is written, the output gate what is shown, and the reset gate belongs to the GRU." },
    { id: "sigmoid-gates", level: "easy", kind: "concept",
      q: "Why do LSTM and GRU gates use a sigmoid?",
      answer: "It outputs a value between 0 and 1, a fraction that says how much to let through",
      wrong: ["It is centred on zero, so gates can be negative", "Its slope is always 1, so gradients never shrink", "It is cheaper to compute than tanh"],
      why: "A gate multiplies another signal, so it must act like a dial from closed (0) to open (1). The candidate uses tanh instead, because new content must be able to push the cell up or down." },
    { id: "additive", level: "medium", kind: "concept",
      q: "What is the main reason an LSTM suffers less from vanishing gradients than a plain RNN?",
      answer: "The cell is updated by multiply-and-add, so one step back along the cell multiplies the gradient by the forget gate, which can stay near 1",
      wrong: ["It uses ReLU instead of tanh", "It has four times the parameters, so gradients are larger", "It is not trained with backpropagation through time"],
      why: "In a plain RNN every step back goes through U and a tanh slope. Along the LSTM cell, dc_t/dc_{t-1} = f, with no weight matrix and no squash. The model can learn f near 1 for slots it needs to keep." },
    { id: "gru-gates", level: "easy", kind: "concept",
      q: "Which gates does a GRU have?",
      answer: "An update gate and a reset gate", wrong: ["Forget, input and output gates", "Only a forget gate", "An update gate and an output gate"],
      why: "Two gates, and no separate cell state. The update gate mixes old state and new candidate; the reset gate controls how much of the old state the candidate may use." },
    { id: "reset-zero", level: "hard", kind: "concept",
      q: "In a GRU, what happens when the reset gate is close to 0?",
      answer: "The candidate is computed almost only from the current input, ignoring the previous state",
      wrong: ["The hidden state is set to zero", "The update gate is switched off", "The current input is ignored"],
      why: "The candidate is tanh(W x + U (r ⊙ h_{t-1})). With r near 0 the previous state is dropped from it, so the unit can start fresh. Whether the old state survives is still the update gate's choice." },
    { id: "forget-bias", level: "hard", kind: "concept",
      q: "Why is the forget gate's bias often initialised to 1 rather than 0?",
      answer: `So f starts near σ(1) = ${sig(1).toFixed(2)} instead of ${sig(0).toFixed(2)}, keeping memory and gradients alive early in training`,
      wrong: ["So the cell starts erased and fills up slowly", "Because a bias of 0 makes the sigmoid undefined", "So the forget gate starts fully closed, at exactly 0"],
      why: `Along the cell the gradient is multiplied by f at each step. Over 20 steps, f = ${sig(0).toFixed(2)} keeps ${keep(sig(0), 20).toExponential(1)} of it, while f = ${sig(1).toFixed(2)} keeps ${keep(sig(1), 20).toExponential(1)}. Starting closer to \"remember\" lets learning reach further back from the first update.` },
    { id: "bidir-gen", level: "medium", kind: "concept",
      q: "Why can a bidirectional RNN not be used to generate text one token at a time?",
      answer: "Its backward pass needs the tokens after the current position, which do not exist yet",
      wrong: ["It has twice the parameters, which is too slow", "Its two states cannot be concatenated at generation time", "It can only be used with GRU cells"],
      why: "The right-to-left RNN starts from the end of the input. During generation the end is unknown. So bidirectional models are used where the whole input is available: tagging, classification and encoders." },
    { id: "h-or-c", level: "medium", kind: "concept",
      q: "Which LSTM state is passed up to the next layer and used for predictions?",
      answer: "h_t, the output o ⊙ tanh(c_t)", wrong: ["c_t, the cell state", "The forget gate f", "The candidate g"],
      why: "The cell is internal memory, carried only to the next time step. The output gate decides which parts of it to expose as h_t, which goes to the next layer, the next step's gates and the prediction." },
    { id: "lstm-params", level: "medium", kind: "numeric",
      q: `An LSTM layer has input size ${D} and hidden size ${H}, with one bias vector per gate. How many parameters does it have?`,
      answer: n0(lstmP), wrong: [n0(gateParams(D, H)), n0(gruP), n0(4 * H * (D + H))],
      why: `Each of the 4 layers (f, i, o, g) maps [h, x] of size ${H + D} to ${H}, plus a bias: ${H} × ${H + D} + ${H} = ${n0(gateParams(D, H))}. Times 4 gives ${n0(lstmP)}. A GRU has 3 such layers: ${n0(gruP)}. Some libraries keep two bias vectors per gate, which adds ${n0(4 * H)}.` },
    { id: "gru-from-lstm", level: "medium", kind: "numeric",
      q: `An LSTM layer has ${n0(LSTM_TOTAL)} parameters. About how many does a GRU with the same input and hidden sizes have?`,
      answer: n0(gruFromLstm), wrong: [n0(LSTM_TOTAL / 2), n0(LSTM_TOTAL), n0((LSTM_TOTAL * 5) / 4)],
      why: `Both build every gate from the same [h, x] input, so the size is proportional to the number of gate layers: 3 for the GRU against 4 for the LSTM. ${n0(LSTM_TOTAL)} × 3/4 = ${n0(gruFromLstm)}.` },
    { id: "cell-output", level: "easy", kind: "output",
      q: "One slot of an LSTM cell. What does this print?",
      code: `f, c_prev, i, g = ${F}, ${C}, ${I}, ${G}\nc = f * c_prev + i * g\nprint(round(c, 2))`,
      answer: cNew, wrong: [String(Number((F * C).toFixed(2))), String(Number((F * C + G).toFixed(2))), String(Number((F * C * I * G).toFixed(2)))],
      why: `Keep ${F} of the old ${C} (${(F * C).toFixed(1)}), then add ${I} × ${G} = ${(I * G).toFixed(1)}. A negative candidate lowers the cell; that is why g uses tanh, not sigmoid.` },
    { id: "walk-lstm", level: "hard", kind: "explain",
      q: "Walk through one LSTM step.",
      answer: "Inputs: the previous output h_{t-1}, the previous cell c_{t-1}, and the input x_t.\n\n1. Four layers read [h_{t-1}, x_t]: forget f, input i and output o (sigmoid, values 0 to 1) and candidate g (tanh, values -1 to 1).\n2. Update the cell: c_t = f ⊙ c_{t-1} + i ⊙ g. Forget part of the old memory, write part of the new.\n3. Output: h_t = o ⊙ tanh(c_t). The output gate chooses what to show.\n\nWhy it works: along c, one step back multiplies the gradient by f only, so memory and gradients can last for many steps when f stays near 1." },
    { id: "lstm-vs-gru", level: "medium", kind: "explain",
      q: "LSTM or GRU: how do they differ, and how would you choose?",
      answer: `- **Structure:** an LSTM has a separate cell and three gates; a GRU has one state and two gates.\n- **Size and speed:** a GRU has about 3/4 of the parameters (${n0(3 * gateParams(CD, CH))} against ${n0(4 * gateParams(CD, CH))} at d = h = ${CD}), so it is a little faster and can do better on small data.\n- **Quality:** on most tasks they perform similarly; neither wins everywhere.\n\nChoose the GRU for a smaller, faster model and the LSTM as a strong default when memory over long spans matters. In practice, try both: it is a cheap hyperparameter.` },
    { id: "bidirectional", level: "medium", kind: "explain",
      q: "What is a bidirectional RNN, and when would you use one?",
      answer: "Two RNNs read the same input: one left to right, one right to left. At each position their states are concatenated, so the representation has size 2h and sees both the left and the right context.\n\nUse it when the whole input is known before you need an answer: tagging each word (\"bank\" depends on later words), named entity recognition, sentence classification, and the encoder of a translation model.\n\nDo not use it for generation or streaming, where the future is not available yet." },
    { id: "trap-gru-smaller", level: "easy", kind: "trap",
      claim: "With the same input and hidden sizes, a GRU has fewer parameters than an LSTM.",
      truth: true,
      why: `A GRU has 3 gate-sized layers to the LSTM's 4: ${n0(gruP)} against ${n0(lstmP)} at input ${D}, hidden ${H}.` },
    { id: "trap-1997-forget", level: "hard", kind: "trap",
      claim: "The LSTM as first published in 1997 already had a forget gate.",
      truth: false,
      why: "The forget gate was added later. A 2000 paper by Gers, Schmidhuber and Cummins showed that the original LSTM's state could grow without bound on continual input streams, and proposed the forget gate so a cell can learn to reset itself." },
    { id: "trap-no-clip", level: "medium", kind: "trap",
      claim: "LSTMs cannot have exploding gradients, so gradient clipping is never needed with them.",
      truth: false,
      why: "The cell lane eases vanishing, but gradients also flow through the gates and the recurrent weights, and they can still blow up. Clipping the gradient norm remains a standard part of training LSTMs." },
  ],
  real: [
    { who: "Sepp Hochreiter and Jürgen Schmidhuber", when: "1997",
      what: "The paper \"Long Short-Term Memory\" observed that error signals fade as they flow back in time in recurrent nets. It kept the error constant through special units, called constant error carousels, with multiplicative gates controlling access, and reported bridging time lags of over 1,000 steps.",
      takeaway: "The protected, additive memory lane is the whole trick, and it came first; the forget gate came three years later.",
      url: "https://mlanthology.org/neco/1997/hochreiter1997neco-long/" },
    { who: "Felix Gers, Jürgen Schmidhuber and Fred Cummins", when: "2000",
      what: "\"Learning to Forget\" showed that on continual input streams with no marked ends, the original LSTM's state could grow without bound and break the network. Their adaptive forget gate lets each cell learn when to reset itself, and solved continual tasks that the earlier methods failed.",
      takeaway: "The f in every modern LSTM equation was a fix found by testing on long, unsegmented streams.",
      url: "https://mlanthology.org/neco/2000/gers2000neco-learning/" },
    { who: "Kyunghyun Cho and co-authors", when: "2014",
      what: "The RNN Encoder-Decoder paper proposed a new hidden unit, motivated by the LSTM but simpler to compute, with a reset gate and an update gate. This unit is what is now called the GRU.",
      takeaway: "The GRU was introduced inside a translation paper, as a lighter cell for the encoder and decoder.",
      url: "https://arxiv.org/abs/1406.1078" },
  ],
};
