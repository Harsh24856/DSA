// Stage 2: one neuron and the activations that bend it. Every number below is computed here or in stages/s2.flows.ts.
import type { GModule } from "../../types.ts";
import { act, fmt } from "../../stages/s2.flows.ts";

const relu = act("ReLU"), sig = act("sigmoid"), tanh = act("tanh"), leaky = act("Leaky ReLU");
const SIG_MAX = sig.d(0), TANH_MAX = tanh.d(0);
// predict: a negative input into ReLU
const ZP = -3;
// numeric: a neuron by hand
const NX = [1, 3], NW = [2, -1], NB = 0.5, nz = NX[0] * NW[0] + NX[1] * NW[1] + NB;
// numeric: 10 sigmoid layers at their steepest
const L10 = 10, bound = SIG_MAX ** L10;
const sci = (x: number) => x.toExponential(1);
// GELU and SiLU: lowest value and steepest slope, scanned on a fine grid
const grid = Array.from({ length: 1201 }, (_, i) => -6 + i / 100);
const low = (n: string) => fmt(Math.min(...grid.map(act(n).f))), steep = (n: string) => fmt(Math.max(...grid.map(act(n).d)));

export const NEURON_ACTIVATIONS: GModule = {
  id: "neuron-activations",
  stage: 2,
  title: "Neuron and activations",
  hook: "A neuron is a weighted sum and a bend. Without the bend, a stack of a hundred layers is no smarter than one.",
  blocks: [
    { kind: "figure", id: "s2-neuron", caption: "Thicker lines carry bigger weights. The weighted sum plus bias gives z, a straight-line function of the inputs; the activation then bends it." },
    { kind: "text", md: `**A neuron** multiplies each input by a weight, adds a bias and passes the total through an **activation**: y = f(w · x + b). Training only ever changes w and b.\n\nThe activation is the bend. Without it, layer after layer of weighted sums collapses into one weighted sum, so the network can only draw straight boundaries.` },
    { kind: "flow", id: "s2-neuron" },
    { kind: "lab", id: "activation" },
    {
      kind: "predict",
      q: `A ReLU neuron gets z = ${ZP}. What are its output and its slope (the factor the gradient is multiplied by)?`,
      answer: `${relu.f(ZP)} and ${relu.d(ZP)}`,
      wrong: [`${ZP} and 1`, `0 and ${leaky.d(ZP)}`, `${fmt(sig.f(ZP))} and ${fmt(sig.d(ZP))}`],
      why: `ReLU is max(0, z), so any negative z gives ${relu.f(ZP)}, and the flat part has slope ${relu.d(ZP)}. No gradient flows back to this neuron's weights for this example. A slope of ${leaky.d(ZP)} is Leaky ReLU, and ${fmt(sig.f(ZP))} is what sigmoid would give.`,
    },
    { kind: "play", id: "s2-act-slope" },
    {
      kind: "compare",
      head: ["Activation", "Formula", "Output range", "Largest slope", "Weak spot"],
      rows: [
        ["ReLU", "max(0, z)", "0 to infinity", fmt(relu.d(1)), "Slope 0 for z < 0: units can die"],
        ["Leaky ReLU", "z, or 0.01 z if z < 0", "Any number", fmt(leaky.d(1)), "One more choice (the leak)"],
        ["sigmoid", "1 / (1 + e^-z)", "0 to 1", fmt(SIG_MAX), "Saturates; not centred on 0"],
        ["tanh", "(e^z - e^-z) / (e^z + e^-z)", "-1 to 1", fmt(TANH_MAX), "Saturates for large |z|"],
        ["GELU", "z × Φ(z), Φ = normal CDF", `About ${low("GELU")} to infinity`, steep("GELU"), "Costs more than ReLU"],
        ["SiLU (Swish)", "z × sigmoid(z)", `About ${low("SiLU")} to infinity`, steep("SiLU"), "Costs more than ReLU"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
x = rng.normal(size=(5, 3))              # 5 examples, 3 inputs
W1, b1 = rng.normal(size=(3, 4)), rng.normal(size=4)
W2, b2 = rng.normal(size=(4, 2)), rng.normal(size=2)

# two linear layers with no activation...
two = (x @ W1 + b1) @ W2 + b2
# ...are exactly one linear layer
W, b = W1 @ W2, b1 @ W2 + b2
print("collapse:", np.allclose(two, x @ W + b))

# put ReLU between them and the shortcut no longer works
bent = np.maximum(0, x @ W1 + b1) @ W2 + b2
print("with ReLU:", np.allclose(bent, x @ W + b))

# slopes, checked against a small nudge (finite difference)
sig = lambda z: 1 / (1 + np.exp(-z))
z, h = np.linspace(-4, 4, 9), 1e-5
for name, f, d in [("sigmoid", sig, lambda z: sig(z) * (1 - sig(z))),
                   ("tanh", np.tanh, lambda z: 1 - np.tanh(z) ** 2)]:
    nudge = (f(z + h) - f(z - h)) / (2 * h)
    assert np.allclose(nudge, d(z), atol=1e-8)
    print(name, "largest slope:", round(float(d(z).max()), 2))
`,
    },
    { kind: "text", md: `**Which one to pick.** Hidden layers of plain MLPs and CNNs: ReLU, the cheap default. Transformer feed-forward layers: smooth cousins such as GELU or SiLU, which behave like ReLU for large z but keep a small gradient for negative z.\n\nOutputs: sigmoid for one yes or no probability, softmax for one choice out of many. Inside recurrent cells, sigmoid and tanh act as gates.` },
  ],
  keyPoints: [
    "A neuron computes y = f(w · x + b): a weighted sum, a bias, then an activation f.",
    "Without a nonlinear activation, any number of stacked layers equals one linear layer.",
    `The activation's slope multiplies the gradient on the way back: sigmoid's is at most ${fmt(SIG_MAX)}, tanh's at most ${fmt(TANH_MAX)}, ReLU's is 1 or 0.`,
    "ReLU is cheap and does not saturate for positive z, but a unit stuck at negative z gets no gradient (a dead ReLU).",
    "GELU and SiLU are smooth ReLU-like curves used in transformer feed-forward layers; sigmoid and softmax belong at the output.",
  ],
  questions: [
    { id: "neuron-computes", level: "easy", kind: "concept",
      q: "What does one neuron compute before its activation?",
      answer: "A weighted sum of its inputs plus a bias, w · x + b",
      wrong: ["The product of all its inputs", "The largest input times its weight", "The average of its inputs, with no weights"],
      why: "Each input is scaled by its own learned weight, the results are added, and the bias shifts the total. Only then does the activation bend it." },
    { id: "no-activation", level: "medium", kind: "concept",
      q: "You delete every activation from a 10-layer MLP. What can it now represent?",
      answer: "Only a linear function of its input, the same as a single layer",
      wrong: ["A degree-10 polynomial of its input", "Anything a nonlinear network can, it just trains more slowly", "Nothing: every output becomes zero"],
      why: "W2(W1 x + b1) + b2 = (W2 W1) x + (W2 b1 + b2), which is again one weight matrix and one bias. Repeat that ten times and it is still one layer. Products of weights are not powers of x." },
    { id: "range-0-1", level: "easy", kind: "concept",
      q: "Which activation always outputs a number between 0 and 1?",
      answer: "Sigmoid", wrong: ["tanh", "ReLU", "GELU"],
      why: "Sigmoid squashes any z into (0, 1), which is why it suits a yes or no probability. tanh gives -1 to 1, and ReLU and GELU are unbounded above." },
    { id: "dead-relu", level: "medium", kind: "concept",
      q: "What is a dead ReLU?",
      answer: "A unit whose input is negative for every example, so its output and its gradient are always 0 and it stops learning",
      wrong: ["A unit whose weights were set to exactly zero at the start", "A unit whose output is always above 1", "A unit switched off by dropout for one step"],
      why: "ReLU's slope is 0 for negative z. If a large update pushes the bias far negative, z stays below 0 for all data, no gradient reaches the weights, and nothing can bring the unit back. Dropout only switches a unit off for one step." },
    { id: "fix-dead", level: "medium", kind: "concept",
      q: "Which change most directly stops ReLU units from dying?",
      answer: `Leaky ReLU: a small slope such as ${leaky.d(-1)} for negative inputs`,
      wrong: ["Putting a sigmoid on the output layer", "Raising the learning rate", "Starting every weight at zero"],
      why: `With a slope of ${leaky.d(-1)} instead of 0, a unit with negative z still gets a small gradient and can recover. A higher learning rate makes dying more likely, since big updates are what push biases far negative.` },
    { id: "tanh-vs-sigmoid", level: "hard", kind: "concept",
      q: "Why does tanh usually train hidden layers better than sigmoid?",
      answer: `Its outputs are centred on 0 and its largest slope is ${fmt(TANH_MAX)}, against sigmoid's ${fmt(SIG_MAX)}`,
      wrong: ["It never saturates, however large z gets", "It is much cheaper to compute", "Its outputs are always positive, which keeps gradients stable"],
      why: `tanh is a stretched, shifted sigmoid: tanh(z) = 2 sigmoid(2z) - 1. Its slope at 0 is ${fmt(TANH_MAX)} rather than ${fmt(SIG_MAX)}, so less gradient is lost per layer, and zero-centred outputs avoid every weight in the next layer getting a same-sign update. It still saturates for large |z|.` },
    { id: "gelu-vs-relu", level: "hard", kind: "concept",
      q: "How does GELU differ from ReLU?",
      answer: "It is smooth, and small negative inputs give small negative outputs instead of a hard 0",
      wrong: ["It is ReLU shifted left by 1", "It is bounded between -1 and 1", "Its slope is 1 everywhere"],
      why: `GELU(z) = z × Φ(z), where Φ is the normal CDF: it weights z by how likely it is to be positive. At z = -1 it gives ${fmt(act("GELU").f(-1))} where ReLU gives 0, and its slope there is ${fmt(act("GELU").d(-1))}, not 0. For large positive z it matches ReLU.` },
    { id: "neuron-numeric", level: "easy", kind: "numeric",
      q: `A ReLU neuron has inputs [${NX.join(", ")}], weights [${NW.join(", ")}] and bias ${NB}. What does it output?`,
      answer: fmt(relu.f(nz)), wrong: [fmt(nz + 2 * Math.abs(NW[1]) * NX[1]), fmt(NX[0] * NW[0] + NX[1] * NW[1]), fmt(nz)],
      why: `z = ${NX[0]}×${NW[0]} + ${NX[1]}×(${NW[1]}) + ${NB} = ${fmt(nz)}. ${nz < 0 ? `It is negative, so ReLU outputs 0.` : `It is positive, so ReLU passes it unchanged: ${fmt(nz)}.`} Forgetting the bias gives ${fmt(NX[0] * NW[0] + NX[1] * NW[1])}.` },
    { id: "sigmoid-depth", level: "hard", kind: "numeric",
      q: `A gradient passes back through ${L10} sigmoid layers, each at its steepest point. By what factor, at most, do the sigmoid slopes alone shrink it?`,
      answer: sci(bound), wrong: [fmt(SIG_MAX * L10), sci(0.5 ** L10), fmt(SIG_MAX)],
      why: `Sigmoid's slope is at most ${fmt(SIG_MAX)}, at z = 0. The chain rule multiplies one slope per layer: ${fmt(SIG_MAX)}^${L10} = ${sci(bound)}. That is about a millionth, which is the vanishing gradient problem. Slopes multiply; they do not add up to ${fmt(SIG_MAX * L10)}.` },
    { id: "act-at-zero", level: "easy", kind: "output",
      q: "What does this print?",
      code: "import math\nz = 0.0\nprint(round(1 / (1 + math.exp(-z)), 2), math.tanh(z), max(0.0, z))",
      answer: `${sig.f(0)} ${tanh.f(0).toFixed(1)} ${relu.f(0).toFixed(1)}`,
      wrong: ["0.0 0.0 0.0", `1.0 ${tanh.f(0).toFixed(1)} ${relu.f(0).toFixed(1)}`, `${sig.f(0)} 1.0 ${relu.f(0).toFixed(1)}`],
      why: `At z = 0, sigmoid sits exactly halfway, ${sig.f(0)}; tanh and ReLU both give 0. Sigmoid's midpoint is why its outputs are never centred on 0.` },
    { id: "why-nonlinear", level: "medium", kind: "explain",
      q: "Why do neural networks need nonlinear activations?",
      answer: "A linear layer computes W x + b. Stack two: W2(W1 x + b1) + b2 = (W2 W1) x + (W2 b1 + b2), which is just another linear layer. Any depth collapses to one.\n\nA linear model can only draw straight (flat) decision boundaries, so it cannot even learn XOR.\n\nA nonlinear activation between layers breaks the collapse. Each layer can then bend the space, and a wide enough network can approximate any continuous function." },
    { id: "ffn-activation", level: "hard", kind: "explain",
      q: "Why do transformer feed-forward layers use GELU or SiLU rather than sigmoid?",
      answer: `- Sigmoid saturates: for large |z| its slope is near 0, and even its best slope is ${fmt(SIG_MAX)}, so gradients shrink layer after layer.\n- Sigmoid outputs are all positive, which biases the updates of the next layer.\n- GELU and SiLU behave like ReLU for large positive z (slope near 1, no saturation), so deep stacks keep their gradient.\n- Unlike ReLU they are smooth and give a small nonzero gradient for negative z, so units do not die.\n\nThe cost is a little more compute than ReLU.` },
    { id: "where-sigmoid", level: "easy", kind: "explain",
      q: "Where would you still use sigmoid or softmax today?",
      answer: "At the output and in gates, where their bounded range is the point.\n\n- Sigmoid for one yes or no probability (spam or not), and for several independent labels at once.\n- Softmax for one choice out of many classes, such as the next token: it turns scores into probabilities that sum to 1.\n- Sigmoid as a gate (0 = closed, 1 = open) inside LSTM and GRU cells.\n\nIn deep hidden layers ReLU-like activations train better." },
    { id: "trap-piecewise", level: "medium", kind: "trap",
      claim: "A network that uses only ReLU activations computes a piecewise linear function of its input.",
      truth: true,
      why: "Each ReLU is two straight pieces joined at 0, and sums and compositions of piecewise linear functions stay piecewise linear. The network carves the input into regions and is a different linear function in each. Many small pieces can follow any curve closely." },
    { id: "trap-negative", level: "medium", kind: "trap",
      claim: "Because ReLU never outputs a negative number, a ReLU network cannot produce negative outputs.",
      truth: false,
      why: "ReLU sits between the layers, not after the last one. The output layer is linear, and its weights can be negative, so the network can output any number. Only the hidden activations are non-negative." },
    { id: "trap-sig-slope", level: "easy", kind: "trap",
      claim: `Sigmoid's slope is largest at z = 0, where it equals ${sig.f(0)}.`,
      truth: false,
      why: `The value at z = 0 is ${sig.f(0)}; the slope there is sigmoid(0) × (1 - sigmoid(0)) = ${sig.f(0)} × ${1 - sig.f(0)} = ${fmt(SIG_MAX)}. It is the largest slope sigmoid ever has, which is why deep sigmoid stacks lose gradient.` },
  ],
  real: [
    { who: "Dan Hendrycks and Kevin Gimpel", when: "2016",
      what: "The paper \"Gaussian Error Linear Units (GELUs)\" proposed GELU, which multiplies the input by the standard Gaussian CDF at that input. The authors contrast it with ReLU, which gates inputs by their sign, and report gains over ReLU and ELU on vision, language and speech tasks.",
      takeaway: "A smooth gate can beat the hard on or off of ReLU, which is why ReLU is not the only default.",
      url: "https://arxiv.org/abs/1606.08415" },
  ],
};
