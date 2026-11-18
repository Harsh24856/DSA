// Stage 2: backpropagation as the chain rule run backwards over a computation graph. Every number below is computed here or in stages/s2.flows.ts.
import type { GModule } from "../../types.ts";
import { BP, bpGraph, fmt } from "../../stages/s2.flows.ts";

const g = bpGraph();
const n0 = (x: number) => x.toLocaleString("en-US");
// predict: fan-out
const [G1, G2] = [3, -1];
// output: fan-out by hand, L = 3x + x^2 at x = 2
const FX = 2, fanAnswer = 3 + 2 * FX;
// compare: one million parameters
const NP = 1_000_000;
// numeric: softmax + cross-entropy gradient
const LOGITS = [2, 1, 0], e = LOGITS.map(Math.exp), Z = e.reduce((a, b) => a + b, 0), P = e.map((v) => v / Z);

export const BACKPROP_GRAPH: GModule = {
  id: "backprop-graph",
  stage: 2,
  title: "Backprop on a graph",
  hook: "Every network is a graph of small steps, and each step knows its own derivative. Backprop just multiplies those derivatives from the loss back to every weight, in one pass. Builds on [[mlp-forward]] and the loss from [[loss-gradient-descent]].",
  blocks: [
    { kind: "figure", id: "s2-graph", caption: `Values flow down; gradients flow back up. Each gradient is the one above it times a local derivative: ∂L/∂w = ∂L/∂z × x = ${fmt(g.dz)} × ${BP.x}, and ∂L/∂b = ∂L/∂z × 1.` },
    { kind: "text", md: "**Backprop is the chain rule, run backwards.** The forward pass computes each node's value and keeps it. The backward pass starts at the loss with ∂L/∂L = 1 and visits nodes in reverse order. Each node multiplies the gradient arriving from above by its own local derivative and hands the result to its inputs. A negative gradient means increasing that weight lowers the loss." },
    { kind: "flow", id: "g-backprop" },
    {
      kind: "predict",
      q: `A value x feeds two later nodes. The gradients they send back to x are ${G1} and ${G2}. What is ∂L/∂x?`,
      answer: String(G1 + G2), wrong: [String(G1), String(G1 * G2), String((G1 + G2) / 2)],
      why: `When a value is used in two places, a small change to it moves the loss through both paths, so the effects add: ${G1} + (${G2}) = ${G1 + G2}. Frameworks accumulate (+=) into a gradient for exactly this reason. Residual connections rely on it too.`,
    },
    { kind: "text", md: "**Three rules cover almost everything.**\n\n- Chain: multiply local derivatives along a path.\n- Fan-out: a value used in two places gets the sum of both gradients.\n- Matrix form: for Y = X W, ∂L/∂W = Xᵀ ∂L/∂Y and ∂L/∂X = ∂L/∂Y Wᵀ. Every gradient has the shape of the thing it belongs to." },
    { kind: "flow", id: "s2-matgrad" },
    {
      kind: "mermaid",
      src: `flowchart TB
  D["mini-batch of data"] --> F["forward: predictions"]
  F --> L["loss: how wrong"]
  L --> B["backward: gradients"]:::hot
  B --> O["optimiser step: update weights"]
  O --> Z["zero the gradients"]
  Z --> D`,
      caption: "The training loop. Backprop is one box in it: it only computes gradients. The optimiser decides what to do with them.",
    },
    {
      kind: "compare",
      head: ["", "Forward mode", "Reverse mode (backprop)"],
      rows: [
        ["Passes to get ∂L/∂(every weight)", "One per weight", "One backward pass"],
        [`At ${n0(NP)} weights`, `${n0(NP)} passes`, "1 pass, about 2 forward passes of work"],
        ["Memory", "Small: nothing kept", "Keeps the forward activations; activation checkpointing keeps some and recomputes the rest"],
        ["Wins when", "Few inputs, many outputs", "Many inputs (weights), one output (the loss)"],
      ],
    },
    { kind: "play", id: "s2-gradcheck" },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# one neuron, one example: L = (sigmoid(w*x + b) - y)^2
w, b, x, y = ${BP.w}, ${BP.b}, ${BP.x.toFixed(1)}, ${BP.y.toFixed(1)}
def loss(w, b):
    p = 1 / (1 + np.exp(-(w * x + b)))
    return (p - y) ** 2

# forward, keeping every intermediate value
z = w * x + b
p = 1 / (1 + np.exp(-z))
L = (p - y) ** 2
# backward: one local derivative at a time, from the loss back
dL_dp = 2 * (p - y)
dp_dz = p * (1 - p)               # sigmoid's slope, never above 0.25
dL_dz = dL_dp * dp_dz
dL_dw, dL_db = dL_dz * x, dL_dz * 1
print("dL/dw", round(dL_dw, 4), " dL/db", round(dL_db, 4))

# check with a central difference
h = 1e-5
num_w = (loss(w + h, b) - loss(w - h, b)) / (2 * h)
print("numeric dL/dw", round(num_w, 4))
assert abs(num_w - dL_dw) < 1e-8

# softmax + cross-entropy: the gradient on the logits is p - onehot(label)
logits, label = np.array([2.0, 1.0, 0.1]), 0
def ce(v):
    e = np.exp(v - v.max())
    return -np.log(e[label] / e.sum())
e = np.exp(logits - logits.max())
probs = e / e.sum()
grad = probs - np.eye(3)[label]
num = np.array([(ce(logits + h * np.eye(3)[i]) - ce(logits - h * np.eye(3)[i])) / (2 * h) for i in range(3)])
print("p - onehot:", np.round(grad, 3))
assert np.allclose(grad, num, atol=1e-7)
`,
    },
    { kind: "text", md: "**The same in PyTorch.** Frameworks build the graph for you. A tensor made with `requires_grad=True` records every operation on it, and `loss.backward()` runs the backward pass, adding each gradient into `.grad`. An `nn.Module` holds the weights, the optimiser's `step()` updates them, and `zero_grad()` clears the gradients first. `model.train()` and `model.eval()` switch layers such as dropout between training and inference." },
    {
      kind: "code",
      torch: true,
      src: `import torch
from torch import nn

# the same neuron, L = (sigmoid(w*x + b) - y)^2, with autograd doing the backward pass
f64 = torch.float64
w = torch.tensor(${BP.w}, dtype=f64, requires_grad=True)    # record every use of w
b = torch.tensor(${BP.b}, dtype=f64, requires_grad=True)
x, y = torch.tensor(${BP.x.toFixed(1)}, dtype=f64), torch.tensor(${BP.y.toFixed(1)}, dtype=f64)
L = (torch.sigmoid(w * x + b) - y) ** 2       # the forward pass builds the graph
L.backward()                                  # fills w.grad and b.grad
print("dL/dw", round(w.grad.item(), 4), " dL/db", round(b.grad.item(), 4))
assert abs(w.grad.item() - (${g.dw})) < 1e-12  # the chain rule by hand gave the same

L = (torch.sigmoid(w * x + b) - y) ** 2
L.backward()                                  # not zeroed: the new gradient is added (+=)
print("after a second backward:", round(w.grad.item(), 4))
assert abs(w.grad.item() - 2 * (${g.dw})) < 1e-12

# the training loop: a module holds the weights, an optimiser updates them
torch.manual_seed(0)
model = nn.Sequential(nn.Linear(1, 1), nn.Sigmoid())
opt = torch.optim.SGD(model.parameters(), lr=1.0)
xs, ys = torch.tensor([[${BP.x.toFixed(1)}]]), torch.tensor([[${BP.y.toFixed(1)}]])
model.train()                                 # training mode: dropout on, BatchNorm uses the batch
for step in range(200):
    opt.zero_grad()                           # clear last step's gradients
    loss = ((model(xs) - ys) ** 2).mean()
    loss.backward()
    opt.step()                                # every weight: w -= lr * w.grad
model.eval()                                  # inference mode
with torch.no_grad():                         # no graph needed when nothing will call backward
    final = ((model(xs) - ys) ** 2).item()
print("loss after 200 steps:", round(final, 4))
assert final < loss.item() < 0.1
`,
    },
  ],
  keyPoints: [
    "Backprop is the chain rule applied in reverse over the computation graph: each node multiplies the incoming gradient by its local derivative.",
    "A value used in several places gets the sum of the gradients from each use.",
    "For Y = X W: ∂L/∂W = Xᵀ ∂L/∂Y and ∂L/∂X = ∂L/∂Y Wᵀ; a gradient always has the shape of its tensor.",
    "Reverse mode gets the gradient for every weight in one backward pass of about twice the forward cost, but it must keep the forward activations.",
    "For softmax with cross-entropy, the gradient on the logits is simply p minus the one-hot label.",
    "In PyTorch, `loss.backward()` adds each gradient into `.grad`; a training step is `zero_grad()`, forward, `backward()`, `step()`.",
  ],
  questions: [
    { id: "backward-computes", level: "easy", kind: "concept",
      q: "What does the backward pass compute?",
      answer: "The gradient of the loss with respect to every node, from the loss back to the inputs",
      wrong: ["A separate loss for every layer", "The new weights, directly", "The forward values again, in reverse order"],
      why: "Backprop only computes ∂L/∂(everything). Changing the weights is the optimiser's job, one step later in the training loop." },
    { id: "dw-shape", level: "medium", kind: "concept",
      q: "Y = X W with X of shape (B, d_in) and W of shape (d_in, d_out). What is the shape of ∂L/∂W?",
      answer: "(d_in, d_out), computed as Xᵀ ∂L/∂Y",
      wrong: ["(B, d_out), the same as Y", "(d_out, d_in), computed as ∂L/∂Y Xᵀ", "(B, d_in), the same as X"],
      why: "A gradient has the shape of the thing it belongs to, and W is (d_in, d_out). Xᵀ is (d_in, B) and ∂L/∂Y is (B, d_out), so Xᵀ ∂L/∂Y lands on exactly that shape. The B dimension is summed away, which adds up every example's contribution." },
    { id: "keep-acts", level: "medium", kind: "concept",
      q: "Why must the forward activations stay in memory until the backward pass?",
      answer: "The local derivatives need them; for example ∂L/∂W = Xᵀ ∂L/∂Y needs the layer's input X",
      wrong: ["The loss is computed again from them at the end", "The optimiser averages them into the weights", "They are the model's parameters"],
      why: "Each local derivative depends on the values seen going forward: sigmoid's slope needs p, a matmul's weight gradient needs its input. That is why training uses far more memory than inference." },
    { id: "reverse-mode", level: "hard", kind: "concept",
      q: "Why do deep learning frameworks use reverse-mode rather than forward-mode differentiation?",
      answer: "One backward pass gives the gradient for every weight; forward mode needs one pass per weight",
      wrong: ["Reverse mode needs less memory than forward mode", "Forward mode cannot handle nonlinear functions", "Reverse mode is exact, while forward mode is only an approximation"],
      why: `Training has millions of inputs (weights) and one output (the loss), the case reverse mode is built for. Both modes are exact. Reverse mode actually costs more memory, since it keeps the forward activations.` },
    { id: "softmax-ce", level: "medium", kind: "concept",
      q: "For softmax followed by cross-entropy, what is the gradient of the loss with respect to the logits z?",
      answer: "p - onehot(y), the predicted probabilities minus the true one-hot label",
      wrong: ["onehot(y) - p", "-log p_y", "p (1 - p)"],
      why: "The softmax and log cancel neatly, leaving predicted minus true. The sign matters: gradient descent subtracts it, so the true class's logit goes up. -log p_y is the loss itself, and p(1 - p) is sigmoid's slope." },
    { id: "checkpointing", level: "hard", kind: "concept",
      q: "What does activation checkpointing trade?",
      answer: "Memory for compute: keep only some activations and recompute the rest during the backward pass",
      wrong: ["Accuracy for speed: skip the gradients of some layers", "Compute for memory: store extra copies so nothing is recomputed", "Precision for memory: store activations in 8 bits"],
      why: "Activations are the big memory cost of training. Keeping a few checkpoints and rerunning the forward pass between them during backward saves memory, for roughly one extra forward pass of work. The gradients come out exactly the same." },
    { id: "zero-grad", level: "easy", kind: "concept",
      q: "Frameworks add (+=) new gradients into the stored ones. What must the training loop do every step?",
      answer: "Zero the stored gradients before the next backward pass",
      wrong: ["Call backward twice", "Divide the gradients by the step number", "Nothing: each backward pass overwrites the last"],
      why: "Accumulating is what makes fan-out correct within one pass. Across steps it means stale gradients pile up unless they are cleared. Leaving them on purpose is gradient accumulation, a way to fake a bigger batch." },
    { id: "torch-grad", level: "easy", kind: "concept",
      q: "In PyTorch, after `loss.backward()`, where is the gradient of the loss with respect to a weight tensor `w`?",
      answer: "In `w.grad`, added to whatever was already there", wrong: ["It is the return value of `loss.backward()`", "In `loss.grad`", "Nowhere: `w` itself has already been updated"],
      why: "`backward()` returns nothing; it walks the recorded graph and accumulates into the `.grad` of every tensor made with `requires_grad=True`. Updating `w` is the optimiser's `step()`, which reads `w.grad`." },
    { id: "chain-numeric", level: "medium", kind: "numeric",
      q: `In the figure, ∂L/∂p = ${fmt(g.dp)}, sigmoid's slope is ${fmt(g.pz)} and x = ${BP.x}. What is ∂L/∂w?`,
      answer: fmt(g.dw), wrong: [fmt(g.dz), fmt(g.dp * BP.x), fmt(-g.dw)],
      why: `Multiply along the path: ∂L/∂w = ∂L/∂p × ∂p/∂z × ∂z/∂w = ${fmt(g.dp)} × ${fmt(g.pz)} × ${BP.x} = ${fmt(g.dw)}. Stopping at ∂L/∂z gives ${fmt(g.dz)}; skipping the sigmoid's slope gives ${fmt(g.dp * BP.x)}. Negative: raise w and the loss falls.` },
    { id: "ce-grad", level: "hard", kind: "numeric",
      q: `Logits [${LOGITS.join(", ")}], true class 0. What is the gradient of softmax cross-entropy on logit 0, to 3 decimals?`,
      answer: fmt(P[0] - 1), wrong: [fmt(P[0]), fmt(1 - P[0]), fmt(-Math.log(P[0]))],
      why: `Softmax gives p = ${P.map(fmt).join(", ")}. The gradient is p - onehot: ${fmt(P[0])} - 1 = ${fmt(P[0] - 1)} for the true class, and ${fmt(P[1])}, ${fmt(P[2])} for the others. ${fmt(-Math.log(P[0]))} is the loss, not its gradient.` },
    { id: "fanout-out", level: "easy", kind: "output",
      q: "x feeds two nodes, a = 3x and b = x², and L = a + b. What does this print?",
      code: `x = ${FX.toFixed(1)}\ndL_da, dL_db = 1.0, 1.0\nda_dx, db_dx = 3.0, 2 * x\ndx = dL_da * da_dx + dL_db * db_dx\nprint(dx)`,
      answer: fanAnswer.toFixed(1), wrong: [(3).toFixed(1), (2 * FX).toFixed(1), (3 * 2 * FX).toFixed(1)],
      why: `x reaches the loss by two paths, so its gradient is the sum: 3 from a, and 2x = ${2 * FX} from b, total ${fanAnswer}. Check: L = 3x + x², so dL/dx = 3 + 2x = ${fanAnswer} at x = ${FX}.` },
    { id: "explain-backprop", level: "medium", kind: "explain",
      q: "Explain backpropagation in a few sentences.",
      answer: "A network is a graph of simple operations, and each one knows its local derivative.\n\n- Forward pass: compute every node's value from the inputs to the loss, and keep the values.\n- Backward pass: start at the loss with gradient 1. Visit the nodes in reverse; each multiplies the gradient from above by its local derivative and passes it to its inputs. Where a value fed several nodes, the gradients add.\n\nOne backward pass, about twice the cost of the forward pass, gives ∂L/∂w for every weight. The optimiser then uses those gradients to update the weights." },
    { id: "derive-ce", level: "hard", kind: "explain",
      q: "Show why the gradient of softmax plus cross-entropy is p - y.",
      answer: "Let p_i = e^(z_i) / Σ_j e^(z_j) and L = -log p_c for the true class c.\n\nThen L = -z_c + log Σ_j e^(z_j).\n\n- The first term gives -1 for i = c and 0 otherwise: minus the one-hot label.\n- The second gives e^(z_i) / Σ_j e^(z_j) = p_i.\n\nSo ∂L/∂z_i = p_i - onehot_i. No softmax Jacobian is needed, the gradient is bounded between -1 and 1, and it is large exactly when the model is confidently wrong." },
    { id: "grad-check", level: "medium", kind: "explain",
      q: "How do you check that a hand-written gradient is correct?",
      answer: "Compare it with a finite difference.\n\n- Nudge one weight both ways: (L(w + h) - L(w - h)) / 2h. The central difference is far more accurate than the one-sided one.\n- Use h around 1e-5 in float64. Too large and the curve bends inside the step; too small and rounding error swamps the difference.\n- Compare with relative error |a - b| / max(|a|, |b|). Below about 1e-6 is a pass.\n\nCheck a few random weights per layer, in float64, with dropout and other randomness turned off." },
    { id: "trap-approx", level: "medium", kind: "trap",
      claim: "Backprop finds gradients approximately, by nudging each weight a little and watching the loss.",
      truth: false,
      why: "That is the finite-difference check, which needs a pass per weight and is only approximate. Backprop applies the chain rule to exact local derivatives, so it gives exact gradients (up to rounding) for every weight in one backward pass." },
    { id: "trap-cost", level: "easy", kind: "trap",
      claim: "The backward pass costs roughly twice as much compute as the forward pass, so one training step is about three forward passes.",
      truth: true,
      why: "For a matmul layer, the forward pass does one multiply (X W), and the backward pass does two of the same size: one for ∂L/∂W and one for ∂L/∂X. That is where the common estimate of about 3 forward passes per training step comes from." },
  ],
  real: [
    { who: "Atilim Gunes Baydin, Barak Pearlmutter, Alexey Radul and Jeffrey Siskind", when: "2015",
      what: "The survey \"Automatic differentiation in machine learning: a survey\" presents automatic differentiation, the machinery behind framework gradients, as a family of techniques that works like backpropagation but covers more cases.",
      takeaway: "Backprop is one use of a general tool: computing exact derivatives of any program built from simple steps.",
      url: "https://arxiv.org/abs/1502.05767" },
  ],
};
