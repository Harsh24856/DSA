// Stage 2: what makes deep networks trainable: initialisation, normalisation, residual connections and dropout. Every number below is computed here or in stages/s2.flows.ts.
import type { GModule } from "../../types.ts";
import { fmt, REACH, VANISH } from "../../stages/s2.flows.ts";

const sci = (x: number) => x.toExponential(1);
const n0 = (x: number) => x.toLocaleString("en-US"), f4 = (x: number) => x.toFixed(4);
// predict: ReLU layers with Var(w) = 1/n (the 2 left out of He init)
const DEPTH = 20, shrink = 0.5 ** DEPTH;
// numeric: He init standard deviation
const NIN = 512, heStd = Math.sqrt(2 / NIN);
// numeric: inverted dropout
const [DP, DV] = [0.2, 3];
// numeric: LayerNorm parameters
const DM = 4096;
// output: normalise a row
const ROW = [2, 4, 6, 8];
// the vanishing-gradient walk-through, at the first layer
const first = REACH.map((r) => r[VANISH.depth]);

export const DEEP_NETS_TRAIN: GModule = {
  id: "deep-nets-train",
  stage: 2,
  title: "Making deep nets train (init, normalisation, residuals, dropout)",
  hook: "Stack 100 layers and, left alone, the signal either dies or explodes before it reaches the end. Four habits keep it alive: careful init, normalisation, skip connections and dropout.",
  blocks: [
    { kind: "flow", id: "s2-vanish" },
    { kind: "text", md: `**The backward pass multiplies one factor per layer.** If the factors sit below 1, the gradient shrinks exponentially and the first layers stop learning (vanishing). Above 1, it blows up (exploding). In the walk-through, after ${VANISH.depth} layers the sigmoid net keeps ${sci(first[0])} of its gradient while the He-initialised ReLU net keeps ${fmt(first[2])}.` },
    { kind: "figure", id: "s2-init", caption: `Each ReLU layer scales the signal by √(n × Var(w) / 2). Only Var(w) = 2/n, He init, keeps that factor at 1 through all ${DEPTH} layers.` },
    {
      kind: "predict",
      q: `A ReLU network uses Var(w) = 1/n, forgetting He's factor of 2. After ${DEPTH} layers, what is the activations' variance compared with the input's?`,
      answer: `About ${sci(shrink)} of it`, wrong: ["About the same", "About half of it", `About ${n0(2 ** DEPTH)} times larger`],
      why: `ReLU zeroes about half its inputs, so each layer multiplies the variance by n × (1/n) / 2 = 1/2. Over ${DEPTH} layers that is (1/2)^${DEPTH} = ${sci(shrink)}: the signal is gone. He init uses 2/n to make the factor exactly 1.`,
    },
    { kind: "figure", id: "s2-norms", caption: "Normalisation rescales numbers to mean 0 and spread 1, then lets the model learn a scale (and shift). The difference is which numbers are averaged." },
    {
      kind: "compare",
      head: ["", "BatchNorm", "LayerNorm", "RMSNorm"],
      rows: [
        ["Averages over", "One feature, across the batch", "One example, across its features", "One example, across its features"],
        ["Subtracts the mean", "Yes", "Yes", "No: divides by the root mean square"],
        ["Learned per feature", "Scale and shift", "Scale and shift", "Scale only"],
        ["Training vs inference", "Different: batch statistics, then running averages", "Identical", "Identical"],
        ["Suits", "CNNs with large batches", "Transformers, any batch size", "Transformers, slightly cheaper"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  X["x"] --> N["norm: LayerNorm or RMSNorm"]
  N --> F["layer: attention or MLP"]
  F --> ADD(("+")):::hot
  X -->|"skip path"| ADD
  ADD --> Y["x + F(norm(x))"]:::ok`,
      caption: "A pre-norm residual block. The skip path carries x, and its gradient, straight through: the derivative of x + F(x) is 1 + F'(x), so it never multiplies down to zero.",
    },
    { kind: "play", id: "s2-dropout" },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
n, depth = 256, ${DEPTH}
x0 = rng.normal(size=(512, n))
for name, var in [("1/n", 1 / n), ("He 2/n", 2 / n), ("4/n", 4 / n)]:
    h = x0
    for _ in range(depth):
        h = np.maximum(0, h @ rng.normal(0, np.sqrt(var), (n, n)))
    print(f"{name:7s} mean square after {depth} ReLU layers: {np.mean(h ** 2):.3g}")

def layer_norm(x, eps=1e-5):
    mu, var = x.mean(-1, keepdims=True), x.var(-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps)

def rms_norm(x, eps=1e-5):
    return x / np.sqrt((x ** 2).mean(-1, keepdims=True) + eps)

t = np.array([[1.0, 2.0, 3.0, 4.0]])
print("LayerNorm:", np.round(layer_norm(t), 2))
print("RMSNorm:  ", np.round(rms_norm(t), 2))

# inverted dropout keeps the average the same, so inference needs no change
p, a = 0.5, np.abs(rng.normal(size=100_000))
keep = rng.random(a.shape) >= p
train = a * keep / (1 - p)
print("inference mean", round(a.mean(), 3), " training mean", round(train.mean(), 3))
assert abs(train.mean() - a.mean()) < 0.01
`,
    },
    { kind: "text", md: "**Dropout** zeroes each unit with probability p on every training step, so no unit can rely on one particular partner. Inverted dropout divides the survivors by 1 - p, so the average is unchanged and inference simply uses every unit with no scaling.\n\nCall `model.eval()` before testing: dropout and BatchNorm both behave differently in training and inference." },
  ],
  keyPoints: [
    "Gradients pass through one factor per layer; factors below 1 make them vanish, above 1 make them explode.",
    "Initialise so each layer keeps the variance: Xavier (about 1/n) for tanh and sigmoid, He (2/n) for ReLU, which zeroes half its inputs.",
    "BatchNorm normalises each feature across the batch; LayerNorm and RMSNorm normalise each example across its features, so they act the same at any batch size and at inference.",
    "A residual connection computes x + F(x); its gradient has a direct path of 1, so very deep stacks still train.",
    "Dropout zeroes units at random during training only; inverted dropout rescales by 1 / (1 - p) so inference needs no change.",
  ],
  questions: [
    { id: "init-goal", level: "easy", kind: "concept",
      q: "What are Xavier and He initialisation trying to achieve?",
      answer: "Keep the variance of activations (and gradients) about the same from layer to layer",
      wrong: ["Make every weight start at the same value", "Make the starting loss exactly zero", "Make the matrix multiplies run faster"],
      why: "If each layer multiplies the variance by more than 1, signals explode with depth; by less than 1, they vanish. Choosing Var(w) so the factor is 1 keeps every layer in a useful range." },
    { id: "he-two", level: "medium", kind: "concept",
      q: "Why does He initialisation use Var(w) = 2/n_in rather than 1/n_in?",
      answer: "ReLU zeroes about half its inputs, halving the signal's second moment; the 2 makes up for it",
      wrong: ["Each block has two layers", "It compensates for dropout", "ReLU doubles the variance, so the 2 is needed to cancel it"],
      why: "For a symmetric input, ReLU keeps only the positive half, so the mean square of its output is half the input's variance. Doubling Var(w) restores a factor of exactly 1 per layer." },
    { id: "zero-init", level: "easy", kind: "concept",
      q: "You start every weight in an MLP's hidden layers at 0. What happens?",
      answer: "Every unit in a layer computes the same thing and gets the same update, so they never become different",
      wrong: ["It trains normally, just more slowly", "The gradients explode on the first step", "Only the biases learn, which is enough for most tasks"],
      why: "Identical weights mean identical outputs and identical gradients, so the symmetry is never broken and a layer acts like a single unit. Random initialisation exists to break that symmetry." },
    { id: "ln-axis", level: "medium", kind: "concept",
      q: "What does LayerNorm normalise over?",
      answer: "The features of each example on its own",
      wrong: ["Each feature across the examples in the batch", "The weights of each layer", "Each position across the whole sequence"],
      why: "LayerNorm takes one example's (or one token's) vector and rescales it to mean 0 and spread 1. Normalising one feature across the batch is BatchNorm." },
    { id: "rmsnorm", level: "medium", kind: "concept",
      q: "How does RMSNorm differ from LayerNorm?",
      answer: "It skips subtracting the mean and only divides by the root mean square",
      wrong: ["It normalises across the batch instead of the features", "It adds a learned mean before scaling", "It divides by the largest absolute value"],
      why: "RMSNorm keeps the rescaling and drops the centring (and the learned shift). It needs one statistic instead of two, so it is a little cheaper, and in practice it trains about as well." },
    { id: "bn-eval", level: "hard", kind: "concept",
      q: "What statistics does BatchNorm use at inference time?",
      answer: "Running averages of the mean and variance collected during training",
      wrong: ["The mean and variance of the current inference batch", "None: it is switched off at inference", "The statistics of the single example being predicted"],
      why: "At inference the batch may be one example, so batch statistics would be meaningless. BatchNorm stores running averages while training and uses them later. Forgetting `model.eval()` means it keeps using the batch, a classic bug." },
    { id: "residual-grad", level: "medium", kind: "concept",
      q: "For a residual block y = x + F(x), what is dy/dx?",
      answer: "1 + dF/dx",
      wrong: ["dF/dx", "1 - dF/dx", "2"],
      why: "The derivative of x is 1, and the sum rule adds F's part. Even when dF/dx is tiny, the gradient keeps the 1 and passes straight through, so stacking blocks does not multiply it toward zero." },
    { id: "pre-norm", level: "hard", kind: "concept",
      q: "In a pre-norm transformer block, where does the normalisation sit?",
      answer: "Inside the branch, before the layer: y = x + F(norm(x)), leaving the skip path untouched",
      wrong: ["After the addition: y = norm(x + F(x))", "On the skip path: y = norm(x) + F(x)", "Only once, after the final block"],
      why: "Pre-norm keeps a clean identity path from the output all the way back to the input, which makes deep stacks stable to train. norm(x + F(x)) is the original post-norm layout, which puts a normalisation on the main path of every block." },
    { id: "he-std", level: "easy", kind: "numeric",
      q: `He initialisation, n_in = ${NIN}. What is the standard deviation of the weights?`,
      answer: f4(heStd), wrong: [f4(Math.sqrt(1 / NIN)), f4(2 / NIN), f4(2 * heStd)],
      why: `Var(w) = 2 / ${NIN} = ${f4(2 / NIN)}, so the standard deviation is √(2 / ${NIN}) = ${f4(heStd)}. ${f4(2 / NIN)} is the variance, not the standard deviation, and ${f4(Math.sqrt(1 / NIN))} forgets the 2.` },
    { id: "dropout-scale", level: "medium", kind: "numeric",
      q: `Inverted dropout with p = ${DP}. A unit computes ${DV.toFixed(1)} and is kept. What does it output during training?`,
      answer: fmt(DV / (1 - DP)), wrong: [fmt(DV * (1 - DP)), DV.toFixed(1), fmt(DV * DP)],
      why: `Kept units are divided by 1 - p = ${fmt(1 - DP)}: ${DV} / ${fmt(1 - DP)} = ${fmt(DV / (1 - DP))}. On average ${fmt(1 - DP)} of units survive, so the expected output stays ${DV}, the same as at inference.` },
    { id: "ln-params", level: "hard", kind: "numeric",
      q: `How many learned parameters does a LayerNorm over ${n0(DM)} features have?`,
      answer: n0(2 * DM), wrong: [n0(DM), n0(DM * DM), "2"],
      why: `One scale and one shift per feature: 2 × ${n0(DM)} = ${n0(2 * DM)}. RMSNorm has only the scale, ${n0(DM)}. The mean and variance are computed from the input, not learned.` },
    { id: "norm-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nx = np.array([${ROW.map((v) => v.toFixed(1)).join(", ")}])\ny = (x - x.mean()) / x.std()\nprint(round(float(y.mean()), 6) + 0.0, round(float(y.std()), 6))`,
      answer: "0.0 1.0", wrong: [`${(ROW.reduce((a, b) => a + b, 0) / ROW.length).toFixed(1)} 1.0`, "0.0 0.0", "1.0 0.0"],
      why: `Subtracting the mean (${ROW.reduce((a, b) => a + b, 0) / ROW.length}) centres the row on 0, and dividing by the standard deviation makes its spread 1. That is LayerNorm on one row, before its learned scale and shift.` },
    { id: "residual-explain", level: "hard", kind: "explain",
      q: "Why do residual connections let very deep networks train?",
      answer: "A block outputs y = x + F(x), so dy/dx = 1 + dF/dx.\n\n- Backward: the identity term carries the gradient back unchanged even when dF/dx is tiny, so it is not multiplied down layer after layer. There is a short path from the loss to every layer.\n- Forward: each block only has to learn a correction to x. If a block is not useful, F can stay near 0 and the block does almost nothing, so adding depth rarely hurts.\n\nThat is why stacks of 100 layers or more, in ResNets and transformers, still train." },
    { id: "ln-not-bn", level: "hard", kind: "explain",
      q: "Why do transformers use LayerNorm or RMSNorm instead of BatchNorm?",
      answer: "- BatchNorm's statistics come from the batch, which is noisy for small batches and awkward with variable-length sequences and padding.\n- It behaves differently in training (batch statistics) and inference (running averages), a source of bugs and mismatch.\n- In generation the model handles one token at a time, so there is no meaningful batch.\n\nLayerNorm and RMSNorm normalise each token's own vector, so they behave the same at any batch size, any sequence length, in training and at inference." },
    { id: "overfit", level: "medium", kind: "explain",
      q: "Training loss keeps falling, but validation loss starts rising after epoch 5. What do you do?",
      answer: "The model is overfitting: it is memorising the training set.\n\n- Keep the epoch 5 checkpoint (early stopping).\n- Add regularisation: dropout, weight decay, data augmentation.\n- Get more data, or use a smaller model.\n\nAlso check the split itself: overlap between training and validation data (leakage) can hide or fake this pattern." },
    { id: "bf16", level: "medium", kind: "explain",
      q: "Why is bf16 usually preferred over fp16 for training large models?",
      answer: "Both use 16 bits, split differently.\n\n- bf16 keeps fp32's 8 exponent bits, so it covers the same range of magnitudes. Tiny gradients and large activations neither underflow nor overflow, and no loss scaling is needed.\n- fp16 has more mantissa (precision) bits but only 5 exponent bits, so its range is much smaller. Training in fp16 needs loss scaling to stop small gradients rounding to zero.\n\nFor training, range matters more than the extra precision." },
    { id: "trap-dropout-infer", level: "easy", kind: "trap",
      claim: "Dropout should also be applied at inference, so the network sees the same conditions as in training.",
      truth: false,
      why: "At inference every unit is used and nothing is dropped. Inverted dropout already rescaled the training outputs by 1 / (1 - p), so the averages match. Leaving dropout on at inference makes predictions random and worse." },
    { id: "trap-bn-batch", level: "medium", kind: "trap",
      claim: "In training mode, BatchNorm makes one example's output depend on the other examples in its batch.",
      truth: true,
      why: "The mean and variance used to normalise come from the whole batch, so changing a neighbour changes them, and with them this example's output. LayerNorm avoids this by using only the example's own features." },
  ],
  real: [
    { who: "Kaiming He, Xiangyu Zhang, Shaoqing Ren and Jian Sun", when: "2015",
      what: "The paper \"Delving Deep into Rectifiers\" derived a weight initialisation designed for rectifier (ReLU-family) units. The abstract says it makes it possible to train very deep rectified networks from scratch.",
      takeaway: "The factor of 2 in He init comes from treating ReLU's effect on variance properly.",
      url: "https://arxiv.org/abs/1502.01852" },
    { who: "Kaiming He, Xiangyu Zhang, Shaoqing Ren and Jian Sun", when: "2015",
      what: "The paper \"Deep Residual Learning for Image Recognition\" had layers learn residual functions of their inputs. The abstract reports networks of 152 layers on ImageNet and analyses 100 and 1000 layer networks on CIFAR-10; an ensemble won first place in the ILSVRC 2015 classification task.",
      takeaway: "Skip connections turned extreme depth from untrainable into routine.",
      url: "https://arxiv.org/abs/1512.03385" },
    { who: "Jimmy Lei Ba, Jamie Ryan Kiros and Geoffrey Hinton", when: "2016",
      what: "The paper \"Layer Normalization\" pointed out that batch normalisation depends on the mini-batch size and is hard to apply to recurrent networks. Layer normalisation computes its statistics from a single training case, so it performs exactly the same computation at training and test time.",
      takeaway: "Normalising each example on its own is what made it fit sequence models.",
      url: "https://arxiv.org/abs/1607.06450" },
    { who: "Nitish Srivastava, Geoffrey Hinton, Alex Krizhevsky, Ilya Sutskever and Ruslan Salakhutdinov", when: "2014",
      what: "The paper \"Dropout: A Simple Way to Prevent Neural Networks from Overfitting\" randomly drops units during training, which samples from many thinned networks. At test time the full network is used with smaller weights, which approximates averaging those thinned networks.",
      takeaway: "Inverted dropout does the same scaling during training instead, so test time stays untouched.",
      url: "https://jmlr.org/papers/v15/srivastava14a.html" },
  ],
};
