// Stage 2: stacking neurons into layers, and the forward pass as matrix shapes. Every number below is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const lin = (a: number, b: number) => a * b + b;   // a Linear(a, b) layer: weights plus biases
const mlp = (sizes: number[]) => sizes.slice(1).reduce((s, b, i) => s + lin(sizes[i], b), 0);
const weightsOnly = (sizes: number[]) => sizes.slice(1).reduce((s, b, i) => s + sizes[i] * b, 0);

// the MNIST-sized MLP used throughout
const [IN, HID, OUT] = [784, 256, 10];
// predict and output: shapes
const [PB, PH] = [32, 128];
// numeric: a three-layer MLP
const BIG = [784, 256, 128, 10];
// trap: first layer against output layer
const first = lin(IN, HID), last = lin(HID, OUT);

export const MLP_FORWARD: GModule = {
  id: "mlp-forward",
  stage: 2,
  title: "MLP and the forward pass",
  hook: "Put many neurons side by side and you have a layer, which is one matrix multiply. Stack layers with a bend between them and you have a network that can learn XOR. Builds on [[neuron-activations]] and the `@` shape rule from [[arrays-broadcasting]].",
  blocks: [
    { kind: "play", id: "s2-net-forward" },
    { kind: "figure", id: "s2-shapes", caption: "Read every forward pass as shapes. The highlighted inner sizes must match; the outer ones give the result. Batch size rides along untouched." },
    { kind: "text", md: `**A layer is one matrix multiply.** Each neuron is one column of W. A batch of B examples is a matrix X of shape (B, d_in), and the layer computes H = f(X W + b) with W of shape (d_in, d_out).\n\nThe bias b has d_out numbers and is added to every row. One big multiply instead of B small ones is what makes GPUs fast.` },
    { kind: "flow", id: "s2-xor" },
    {
      kind: "predict",
      q: `X has shape (${PB}, ${IN}) and W1 has shape (${IN}, ${PH}). What is the shape of X @ W1?`,
      answer: `(${PB}, ${PH})`, wrong: [`(${IN}, ${PH})`, `(${PB}, ${IN})`, `(${PH}, ${PB})`],
      why: `The inner ${IN}s match and disappear; the outer sizes stay. Each of the ${PB} examples now has ${PH} hidden features. The batch size never mixes with the feature sizes.`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  X["image: ${IN} numbers"] --> L1["Linear ${IN} to ${HID}"]
  L1 --> A["ReLU"]:::hot
  A --> L2["Linear ${HID} to ${OUT}"]
  L2 --> S["softmax: ${OUT} probabilities"]
  S --> P["prediction: the largest"]:::ok`,
      caption: "A digit classifier's forward pass: multiply, bend, multiply, then softmax. Take out the ReLU and the two Linear layers collapse into one.",
    },
    { kind: "play", id: "s2-mlp-params" },
    {
      kind: "compare",
      head: ["Tensor", "Shape", "Count", "Learned?"],
      rows: [
        ["X (input)", `(B, ${IN})`, `${n0(IN)} per example`, "No"],
        ["W1", `(${IN}, ${HID})`, n0(IN * HID), "Yes"],
        ["b1", `(${HID},)`, n0(HID), "Yes"],
        ["H (hidden activations)", `(B, ${HID})`, `${n0(HID)} per example`, "No"],
        ["W2", `(${HID}, ${OUT})`, n0(HID * OUT), "Yes"],
        ["b2", `(${OUT},)`, n0(OUT), "Yes"],
        ["All parameters", "", n0(mlp([IN, HID, OUT])), ""],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
B, d_in, h, k = 4, ${IN}, ${HID}, ${OUT}
X = rng.random((B, d_in))                         # 4 flattened 28 x 28 images
W1 = rng.normal(0, np.sqrt(2 / d_in), (d_in, h)); b1 = np.zeros(h)
W2 = rng.normal(0, np.sqrt(2 / h), (h, k));       b2 = np.zeros(k)

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)          # same answer, never overflows
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

H = np.maximum(0, X @ W1 + b1)                    # (4, 256)
logits = H @ W2 + b2                              # (4, 10)
P = softmax(logits)
print("H", H.shape, "logits", logits.shape, "P", P.shape)
print("rows sum to 1:", np.allclose(P.sum(axis=1), 1))
print("predicted classes:", P.argmax(axis=1))

params = W1.size + b1.size + W2.size + b2.size
print("parameters:", params)
assert params == ${mlp([IN, HID, OUT])}
print("softmax of [1000, 1001]:", np.round(softmax(np.array([[1000.0, 1001.0]])), 3))
`,
    },
    { kind: "text", md: "**Wide or deep?** Universal approximation says one hidden layer, wide enough, can approximate any continuous function on a bounded region. It does not say how wide, or whether training will find the weights.\n\nDepth lets later layers reuse features built by earlier ones, so many functions need far fewer units when stacked. That is why real networks are deep, not just wide." },
  ],
  keyPoints: [
    "A layer computes H = f(X W + b): X is (batch, d_in), W is (d_in, d_out), and b is added to every row.",
    "Shapes chain: (B, a) @ (a, b) gives (B, b). The inner sizes must match; the batch size passes straight through.",
    "A Linear(a, b) layer has a × b + b parameters; the widest connection usually holds most of them.",
    "Parameters (weights and biases) are learned and fixed in size; activations are computed per example and grow with the batch.",
    "The last layer gives logits; softmax turns each row into probabilities that sum to 1.",
  ],
  questions: [
    { id: "layer-is-matmul", level: "easy", kind: "concept",
      q: "A layer of 64 neurons reads 32 inputs. How is it computed?",
      answer: "One multiply of the input by a 32 × 64 weight matrix, plus a bias of 64 numbers",
      wrong: ["64 separate dot products that must run one after another", "One multiply by a 64 × 64 weight matrix", "An element-wise product of the input and one weight vector"],
      why: "Each neuron's 32 weights form one column, so the layer's weights form a 32 × 64 matrix. The 64 dot products are independent and run together as a single matrix multiply." },
    { id: "why-batch", level: "medium", kind: "concept",
      q: "Why is a batch passed as one matrix X of shape (B, d_in) instead of one example at a time?",
      answer: "One large matrix multiply keeps the hardware busy; each row's result is the same as computing it alone",
      wrong: ["Batching replaces each example's output with the batch average", "The bias can only be added to a matrix, not a vector", "It reduces the number of parameters"],
      why: "Row i of X W depends only on row i of X, so batching changes nothing in the forward pass of a plain MLP. It just turns many small multiplies into one big one, which GPUs do far faster." },
    { id: "bias-shape", level: "medium", kind: "concept",
      q: `X W has shape (${PB}, ${PH}). What shape is the bias b, and how is it added?`,
      answer: `(${PH},), added to every row`,
      wrong: [`(${PB},), one number per example`, `(${PB}, ${PH}), one number per example and unit`, `(${IN},), one per input`],
      why: `There is one bias per output unit, shared by all examples. NumPy broadcasting copies the ${PH} numbers onto each of the ${PB} rows. A per-example bias would make the model depend on batch position.` },
    { id: "universal", level: "medium", kind: "concept",
      q: "What does the universal approximation theorem say?",
      answer: "One hidden layer, wide enough, can approximate any continuous function on a bounded region as closely as you like",
      wrong: ["Gradient descent always finds the best weights for a wide enough network", "A deep network needs fewer training examples than a shallow one", "Any function can be represented exactly by one neuron with the right activation"],
      why: "It is an existence result: the weights exist. It says nothing about how many units are needed, how much data, or whether training will find them." },
    { id: "why-deep", level: "hard", kind: "concept",
      q: "If one wide hidden layer is enough in theory, why are networks deep?",
      answer: "Later layers reuse features built by earlier ones, so many functions need far fewer units when stacked",
      wrong: ["Deep networks cannot suffer from vanishing gradients", "Wide layers cannot run on GPUs", "Depth removes the need for activations"],
      why: "Edges build shapes, shapes build parts, parts build objects. A shallow network has to build every combination from scratch in one layer, which can take exponentially many units. Depth does bring its own training problems (the last module of this stage)." },
    { id: "logits", level: "easy", kind: "concept",
      q: "In a classifier, what are logits?",
      answer: "The raw scores from the last linear layer, before softmax",
      wrong: ["The probabilities after softmax", "The hidden activations after ReLU", "The log of the input features"],
      why: "Logits can be any real numbers. Softmax exponentiates and normalises them into probabilities. Loss functions often take logits directly because that is more numerically stable." },
    { id: "linear-params", level: "easy", kind: "numeric",
      q: `How many parameters does a Linear(${IN}, ${HID}) layer have?`,
      answer: n0(lin(IN, HID)), wrong: [n0(IN * HID), n0(IN + HID), n0(IN * HID + 2 * HID)],
      why: `${n0(IN)} × ${n0(HID)} = ${n0(IN * HID)} weights plus one bias per output, ${HID}: ${n0(lin(IN, HID))}. Forgetting the bias gives ${n0(IN * HID)}.` },
    { id: "mlp-total", level: "medium", kind: "numeric",
      q: `How many parameters does a ${BIG.join("-")} MLP have, biases included?`,
      answer: n0(mlp(BIG)), wrong: [n0(weightsOnly(BIG)), n0(mlp(BIG.slice(0, 3))), n0(BIG.reduce((a, b) => a + b, 0))],
      why: `${BIG.slice(1).map((b, i) => `${BIG[i]} × ${b} + ${b}`).join(", then ")}. Sum: ${n0(mlp(BIG))}. Without biases it is ${n0(weightsOnly(BIG))}; adding up the layer sizes counts neurons, not parameters.` },
    { id: "macs", level: "hard", kind: "numeric",
      q: `How many multiply-adds does a ${IN}-${HID}-${OUT} MLP do for one example's forward pass (ignore biases and ReLU)?`,
      answer: n0(weightsOnly([IN, HID, OUT])), wrong: [n0(2 * weightsOnly([IN, HID, OUT])), n0(IN + HID + OUT), n0(IN * HID * OUT)],
      why: `Every weight is used exactly once per example: one multiply and one add. ${n0(IN)} × ${n0(HID)} + ${n0(HID)} × ${OUT} = ${n0(weightsOnly([IN, HID, OUT]))}. Counting a multiply and an add as two floating point operations doubles it to ${n0(2 * weightsOnly([IN, HID, OUT]))}, which is a FLOP count, not a multiply-add count.` },
    { id: "shapes-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nX = np.ones((${PB}, ${IN}))\nW1 = np.ones((${IN}, ${PH}))\nW2 = np.ones((${PH}, ${OUT}))\nH = np.maximum(0, X @ W1)\nprint(H.shape, (H @ W2).shape)`,
      answer: `(${PB}, ${PH}) (${PB}, ${OUT})`, wrong: [`(${IN}, ${PH}) (${PH}, ${OUT})`, `(${PB}, ${IN}) (${PB}, ${PH})`, `(${PB}, ${PH}) (${PH}, ${OUT})`],
      why: `ReLU works element by element, so it keeps the shape (${PB}, ${PH}). Then (${PB}, ${PH}) @ (${PH}, ${OUT}) gives (${PB}, ${OUT}): one row of ${OUT} logits per example.` },
    { id: "walk-forward", level: "medium", kind: "explain",
      q: "Walk through the forward pass of a two-layer MLP classifier, with shapes.",
      answer: `Take a batch of B digit images, each flattened to ${IN} numbers: X is (B, ${IN}).\n\n- Hidden layer: Z1 = X W1 + b1, with W1 (${IN}, ${HID}), gives (B, ${HID}). ReLU keeps that shape.\n- Output layer: logits = H W2 + b2, with W2 (${HID}, ${OUT}), gives (B, ${OUT}).\n- Softmax on each row turns the ${OUT} logits into probabilities summing to 1; the prediction is the largest.\n\nDuring training the loss compares those probabilities with the true labels, and the backward pass runs the same graph in reverse.` },
    { id: "stable-softmax", level: "hard", kind: "explain",
      q: "Why is softmax computed as exp(z - max z) in practice?",
      answer: "Mathematically nothing changes: exp(z - c) / sum exp(z - c) equals exp(z) / sum exp(z), because e^-c cancels top and bottom.\n\nNumerically it matters a lot. exp(1000) overflows to infinity in floating point, and infinity divided by infinity is NaN. After subtracting the max, the largest exponent is e^0 = 1 and nothing overflows.\n\nFrameworks also fuse softmax with the cross-entropy loss (log-softmax) for the same reason." },
    { id: "params-vs-acts", level: "easy", kind: "explain",
      q: "What is the difference between parameters and activations, and which grows with batch size?",
      answer: `Parameters are the learned weights and biases. Their count is fixed by the architecture, ${n0(mlp([IN, HID, OUT]))} for a ${IN}-${HID}-${OUT} MLP, whatever the batch.\n\nActivations are the values computed in the forward pass for each example, such as the hidden H of shape (B, ${HID}). They grow linearly with the batch size B.\n\nTraining must keep activations for the backward pass, so they often dominate memory at large batch sizes.` },
    { id: "trap-permute", level: "hard", kind: "trap",
      claim: "Swapping two hidden units, along with their incoming and outgoing weights, leaves the network's outputs unchanged.",
      truth: true,
      why: "The output layer sums over hidden units, and a sum does not care about order. So every network has many equivalent weight settings, one per ordering of its hidden units. It is also why units must start with different random weights: identical units would stay identical." },
    { id: "trap-output-big", level: "medium", kind: "trap",
      claim: `In a ${IN}-${HID}-${OUT} MLP, the output layer holds more parameters than the first layer.`,
      truth: false,
      why: `The first layer has ${n0(IN)} × ${n0(HID)} + ${HID} = ${n0(first)} parameters; the output layer has ${HID} × ${OUT} + ${OUT} = ${n0(last)}. The widest connection, usually next to a large input, holds most of the weights.` },
  ],
};
