// Stage 2: convolutional networks. A kernel slides over a picture; the same few weights are reused everywhere.
// Every number below is computed here or in s2.calc.ts.
import type { GModule } from "../../types.ts";
import { cnnStack, conv2d, denseVsConv, IMG, KERNELS, maxPool, outSize, receptive } from "../../stages/s2.calc.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const { dense, conv } = denseVsConv();
const stack = cnnStack(), convParams = stack.filter((r) => r[0].startsWith("conv")).reduce((s, r) => s + r[4], 0), denseParams = stack[stack.length - 1][4];

// predict: the vertical-edge map's sign on the bar's two sides
const vmap = conv2d(IMG, KERNELS[0].k).out, vmax = Math.max(...vmap.flat()), vmin = Math.min(...vmap.flat());
// numeric: output size
const [NS, KS, SS, PS] = [32, 5, 1, 2], outA = outSize(NS, KS, SS, PS);
const [NB, KB, SB, PB] = [64, 3, 2, 1], outB = outSize(NB, KB, SB, PB);
// numeric: parameters of a conv layer on a colour image
const [CI, CO, KK] = [3, 64, 3], convRGB = (KK * KK * CI + 1) * CO;
// numeric: receptive field
const RL = 5, rf5 = receptive(RL);
// output: pooling
const POOL = [[1, 3, 2, 0], [4, 2, 1, 1], [0, 0, 5, 6], [1, 2, 7, 8]], pooled = maxPool(POOL);
if (pooled.flat().join() !== "4,2,2,8") throw new Error("pool example drifted");

export const CNN: GModule = {
  id: "cnn",
  stage: 2,
  title: "Convolutional networks (convolution, pooling, feature maps)",
  hook: "A dense layer treats a picture as one long list and forgets which pixels are neighbours. A convolution slides one small set of weights over the picture, so it finds a pattern wherever it appears. Builds on [[mlp-forward]].",
  blocks: [
    { kind: "play", id: "s2-conv" },
    { kind: "text", md: `**One kernel, many places.** A kernel is a small grid of weights, here 3×3. At each position, multiply it with the patch under it and add, then slide. The result is a **feature map** that is bright where the patch looks like the kernel.\n\nThe same 9 weights are used at every position. That sharing is why a conv layer is tiny and why it finds an edge in any corner.` },
    {
      kind: "predict",
      q: "The vertical-edge kernel has +1s on its left column and -1s on its right. What does its map show along the bar's left and right edges?",
      answer: `A positive band on one side and a negative band on the other (here ${vmax} and ${vmin})`,
      wrong: ["Zeros everywhere, because the bar is symmetric", "The same positive value on both edges", "Large values only in the middle of the bar"],
      why: `On one edge the bright pixels sit under the +1 column, on the other under the -1 column, so the sums take opposite signs: ${vmax} and ${vmin}. Inside the bar and in empty space both columns see the same thing and cancel to 0.`,
    },
    { kind: "figure", id: "s2-receptive", caption: "Click a layer count. Each 3×3 layer widens what one output pixel can see by 2, and a conv layer needs a tiny fraction of a dense layer's weights." },
    { kind: "flow", id: "s2-cnn-stack" },
    {
      kind: "compare",
      head: ["", "Dense layer", "Conv layer"],
      rows: [
        ["Connects", "every input to every output", "a small window to each output"],
        ["Weights", "one per input and output pair", "one kernel, shared everywhere"],
        ["Knows neighbours", "no, any order of pixels looks the same", "yes, it reads local patches"],
        ["A shifted pattern", "needs to be learned again", "gives the same response, shifted"],
        [`28×28 to 8 maps of 26×26`, `${n0(dense)} parameters`, `${conv} parameters`],
      ],
    },
    { kind: "text", md: `**Channels.** A colour picture has 3 channels, so each kernel is 3×3×3 and reads all of them at once. A layer with 64 kernels outputs 64 maps, and the next layer's kernels are 3×3×64.\n\n**Pooling** shrinks each map, usually by taking the max of every 2×2 block. It has no weights. It keeps the strongest response and makes later layers see a wider area.` },
    {
      kind: "mermaid",
      src: `flowchart TB
  A["picture 28×28×1"] --> B["conv 3×3 + ReLU: edges"]
  B --> C["pool: half size"]
  C --> D["conv 3×3 + ReLU: corners, strokes"]
  D --> E["pool, flatten"]
  E --> F["dense: which digit"]:::hot`,
      caption: "Early layers find edges, later layers combine them into parts, and a dense layer at the end makes the call.",
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def conv2d(img, k, stride=1, pad=0):
    img = np.pad(img, pad)
    n, f = img.shape[0], k.shape[0]
    m = (n - f) // stride + 1
    out = np.zeros((m, m))
    for r in range(m):
        for c in range(m):
            patch = img[r*stride:r*stride+f, c*stride:c*stride+f]
            out[r, c] = (patch * k).sum()   # same weights at every position
    return out

def max_pool(a):
    m = a.shape[0] // 2
    return a[:2*m, :2*m].reshape(m, 2, m, 2).max(axis=(1, 3))

img = np.zeros((7, 7)); img[1:6, 1] = 1; img[5, 1:6] = 1   # an "L"
k = np.array([[1, 0, -1]] * 3)                            # vertical edge
fmap = conv2d(img, k)
print(fmap.astype(int))
pooled = max_pool(np.maximum(fmap, 0))
print(pooled.astype(int))
assert fmap.shape == (5, 5) and fmap.max() == ${vmax} and fmap.min() == ${vmin}
assert pooled.shape == (2, 2)`,
    },
    { kind: "text", md: `**Where CNNs sit today.** Convolutions still run phone cameras and many vision models. In large models they now share the stage with the vision transformer, which cuts the picture into patches and uses attention instead of sliding windows. The ideas you learned here, local patches and shared weights, carry over.` },
  ],
  keyPoints: [
    "A convolution slides one small kernel over the input; the same weights are used at every position.",
    `Output side = (n + 2p - k) / s + 1, rounded down: padding keeps the size, stride shrinks it.`,
    "Each kernel spans all input channels and makes one output map; a layer with C kernels outputs C maps.",
    "Max pooling halves height and width, has no weights and keeps the strongest response.",
    `Stacking 3×3 layers widens the receptive field by 2 per layer: ${RL} layers see ${rf5}×${rf5}.`,
  ],
  questions: [
    { id: "why-conv", level: "easy", kind: "concept",
      q: "Why does a convolution need far fewer weights than a dense layer on the same picture?",
      answer: "It reuses one small kernel at every position instead of a weight per input and output pair",
      wrong: ["It skips the bias terms", "It only looks at every other pixel", "It stores its weights in lower precision"],
      why: `Weight sharing: a 3×3 kernel has 9 weights wherever it sits. For 28×28 to 8 maps of 26×26 that is ${conv} parameters against ${n0(dense)} for a dense layer.` },
    { id: "shift", level: "medium", kind: "concept",
      q: "A cat moves 10 pixels to the right. What happens to a conv layer's feature maps?",
      answer: "The responses move 10 pixels to the right too",
      wrong: ["They stay exactly the same", "They are scrambled, so the layer must relearn the cat", "They all drop to zero"],
      why: "Convolution is translation equivariant: shift the input and the output shifts the same way. Pooling and later layers then make the final answer roughly invariant to the shift." },
    { id: "pool-weights", level: "easy", kind: "concept",
      q: "How many learnable weights does a 2×2 max pooling layer have?",
      answer: "None",
      wrong: ["4 per channel", "4 in total", "One per output pixel"],
      why: "Pooling is a fixed rule, take the max of each block. It has nothing to learn, which is why the CNN table shows 0 parameters for it." },
    { id: "channels", level: "medium", kind: "concept",
      q: "A layer takes 16 maps in and outputs 32 maps with 3×3 kernels. What shape is one kernel?",
      answer: "3×3×16",
      wrong: ["3×3", "3×3×32", "16×32"],
      why: "Each kernel reads every input channel at once, so it is 3×3 per channel times 16 channels. There are 32 such kernels, one per output map." },
    { id: "stride-effect", level: "easy", kind: "concept",
      q: "What does a stride of 2 do?",
      answer: "Moves the kernel 2 pixels per step, roughly halving the output's height and width",
      wrong: ["Uses a kernel twice as large", "Runs the convolution twice", "Adds 2 pixels of padding"],
      why: "Stride is the step size. Taking every second position gives about half as many positions per side." },
    { id: "padding", level: "medium", kind: "concept",
      q: "Why add one pixel of zero padding around a picture before a 3×3 convolution?",
      answer: "So the output keeps the input's size and edge pixels get used as often as centre pixels",
      wrong: ["To make the kernel learn faster", "To remove noise at the edges", "Because a kernel cannot read the first row otherwise"],
      why: `Without padding a 3×3 kernel trims one pixel per side: ${IMG.length}×${IMG.length} becomes ${outSize(IMG.length, 3, 1, 0)}×${outSize(IMG.length, 3, 1, 0)}. With one pixel of padding the side stays ${outSize(IMG.length, 3, 1, 1)}.` },
    { id: "out-size", level: "medium", kind: "numeric",
      q: `A ${NS}×${NS} input goes through a ${KS}×${KS} convolution with stride ${SS} and padding ${PS}. What is the output side?`,
      answer: String(outA), wrong: [String(outA - 4), String(outA + 2), String(outSize(NS, KS, SS, 0) + 1)],
      why: `(${NS} + 2×${PS} - ${KS}) / ${SS} + 1 = ${outA}. Padding 2 exactly makes up for the 4 pixels a 5×5 kernel trims.` },
    { id: "out-stride", level: "hard", kind: "numeric",
      q: `A ${NB}×${NB} input, a ${KB}×${KB} kernel, stride ${SB}, padding ${PB}. Output side?`,
      answer: String(outB), wrong: [String(NB), String(outB - 1), String(NB / 4)],
      why: `(${NB} + 2×${PB} - ${KB}) / ${SB} + 1 = ${(NB + 2 * PB - KB) / SB} + 1, rounded down to ${outB}. Stride 2 roughly halves the side.` },
    { id: "rgb-params", level: "medium", kind: "numeric",
      q: `A conv layer reads an RGB image (${CI} channels) with ${CO} kernels of ${KK}×${KK}, each with a bias. How many parameters?`,
      answer: n0(convRGB), wrong: [n0(KK * KK * CO), n0(KK * KK * CI * CO), n0((KK * KK + 1) * CO)],
      why: `Each kernel has ${KK}×${KK}×${CI} = ${KK * KK * CI} weights plus 1 bias, and there are ${CO} kernels: ${KK * KK * CI + 1} × ${CO} = ${n0(convRGB)}. The picture's height and width do not appear.` },
    { id: "pool-out", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import numpy as np
a = np.array(${JSON.stringify(POOL)})
print(a.reshape(2, 2, 2, 2).max(axis=(1, 3)).flatten().tolist())`,
      answer: JSON.stringify(pooled.flat()).replace(/,/g, ", "), wrong: ["[4, 3, 2, 8]", "[8]", "[2, 1, 5, 8]"],
      why: "Each 2×2 block keeps its max: top-left {1,3,4,2} gives 4, top-right {2,0,1,1} gives 2, bottom-left {0,0,1,2} gives 2, bottom-right {5,6,7,8} gives 8." },
    { id: "explain-feature-map", level: "medium", kind: "explain",
      q: "Explain what a feature map is and how one is made.",
      answer: "A feature map is the output of one kernel slid over the whole input. At every position the kernel's weights are multiplied with the patch under it and summed, usually plus a bias and then ReLU. Each value says how strongly that patch matches the pattern the kernel has learned, so the map shows where in the picture that pattern appears. A layer with many kernels outputs one map per kernel." },
    { id: "explain-hierarchy", level: "hard", kind: "explain",
      q: "Why do deeper conv layers detect larger, more complex shapes than early ones?",
      answer: `Each 3×3 layer looks at a small window of the layer below, but that layer already summarises a window of its own input, so the receptive field grows with depth: ${RL} stacked 3×3 layers see ${rf5}×${rf5} pixels, and pooling widens it faster. Early layers can only see enough to find edges and colour blobs; later layers combine those into corners and strokes, then into parts and whole objects.` },
    { id: "explain-vs-dense", level: "medium", kind: "explain",
      q: "When would you pick a CNN over an MLP, and why?",
      answer: `When the input has a grid structure where nearby values belong together, like images, spectrograms or board games. A CNN uses that structure: local windows and shared weights give far fewer parameters (${conv} against ${n0(dense)} in this lesson's example), it generalises to patterns in new positions, and it needs less data. An MLP treats every input as unrelated, so it suits tabular data with no spatial order.` },
    { id: "trap-flip", level: "hard", kind: "trap",
      claim: "Deep learning libraries flip the kernel before sliding it, as in the textbook definition of convolution.",
      truth: false,
      why: "What libraries call convolution is cross-correlation: the kernel is used as is, with no flip. Since the weights are learned, a flipped kernel would just be learned flipped, so nothing is lost." },
    { id: "trap-pool-loses", level: "medium", kind: "trap",
      claim: "Max pooling throws away the exact position of a feature inside each 2×2 block.",
      truth: true,
      why: "Only the largest value survives, not where in the block it was. That small loss of position is the price for a smaller map and some tolerance to tiny shifts." },
    { id: "trap-size-params", level: "medium", kind: "trap",
      claim: "A conv layer on a 1024×1024 image has more parameters than the same layer on a 32×32 image.",
      truth: false,
      why: `Parameters depend only on kernel size and channels: ${KK}×${KK}×${CI} + 1 per kernel, whatever the image size. A bigger image costs more compute, not more weights. The CNN in this lesson keeps ${n0(convParams)} conv parameters against ${n0(denseParams)} in its single dense layer.` },
  ],
};
