// Stage 4: embeddings and positions. Every number below is computed here, with the same sinusoid and rope used by the walk-throughs.
import type { GModule } from "../../types.ts";
import { dot, rope, sinusoid } from "../../stages/s4.flows.ts";
import { seededRng } from "../../rng.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);
const vecOf = (seed: string, d: number) => { const r = seededRng(seed); return Array.from({ length: d }, () => r() * 2 - 1); };

// predict: a RoPE score before and after moving both tokens
const q = vecOf("emb:qc", 8), k = vecOf("emb:kc", 8), SHIFT = 100;
const before = dot(rope(q, 5), rope(k, 2)), after = dot(rope(q, 5 + SHIFT), rope(k, 2 + SHIFT));
// numeric: position 0; a RoPE angle; a learned position table
const pe0 = sinusoid(0, 4).map((x) => Math.round(x));
const [AP, AI, AD] = [3, 1, 8], angle = AP / 10000 ** ((2 * AI) / AD);
const [MAXPOS, DM] = [4096, 4096];
// explain: stretching 4K to 16K
const STRETCH = 16 / 4;
// output: lookup shape
const [V, D, IDS] = [1000, 64, [5, 7, 7, 2]];
// trap: same word, two positions
const [P1, P2] = [2, 9], pe1 = sinusoid(P1, 4), pe2 = sinusoid(P2, 4);

export const EMBEDDINGS_POSITIONS: GModule = {
  id: "embeddings-positions",
  stage: 4,
  title: "Embeddings and positions (sinusoidal, RoPE)",
  hook: "A token id is just a row number. The embedding table turns it into a vector of meaning, and a position scheme tells attention where in the sentence it sits.",
  blocks: [
    { kind: "flow", id: "s4-embed-lookup" },
    { kind: "text", md: "**An embedding is a lookup.** The table has one learned row of d numbers per token in the vocabulary. Training moves the rows so tokens used in similar ways end up close together.\n\n**Attention is blind to order.** It compares every pair of tokens the same way wherever they sit, so \"dog bites man\" and \"man bites dog\" look alike. Position must be added, either to the input vectors or inside attention." },
    { kind: "figure", id: "s4-rope-dial", caption: "RoPE in one picture. Each pair of numbers in q and k is an arrow, turned by an angle that grows with position. Moving both tokens later turns both arrows further, but the angle between them, and so their dot product, stays the same." },
    {
      kind: "predict",
      q: `With RoPE, a query at position 5 and a key at position 2 give a score of ${r2(before)}. Move both ${SHIFT} positions later, to ${5 + SHIFT} and ${2 + SHIFT}. What is the score now?`,
      answer: r2(after),
      wrong: [r2(before * SHIFT), r2(0), r2(before + SHIFT / 100)],
      why: `RoPE turns q by ${5 + SHIFT} times its angles and k by ${2 + SHIFT} times, so the turn between them is still 3 times the angles, exactly as at 5 and 2. The score is ${r2(after)} both times. Only the distance, 3, reaches the score.`,
    },
    { kind: "play", id: "s4-rope-shift" },
    {
      kind: "mermaid",
      caption: "Where each method puts position. Absolute schemes add it once at the input; RoPE and ALiBi act on the scores inside every attention layer.",
      src: `flowchart TB
  subgraph A["Learned or sinusoidal"]
    A1["token vector + position vector"] --> A2["every layer sees the sum"]
  end
  subgraph R["RoPE"]
    R1["rotate q and k by position"] --> R2["score depends on distance"]:::hot
  end
  subgraph L["ALiBi"]
    L1["raw score q . k"] --> L2["minus slope x distance"]
  end
  A ~~~ R ~~~ L`,
    },
    {
      kind: "compare",
      head: ["Scheme", "Where", "Past the training length"],
      rows: [
        ["Learned absolute", "Added to the input", "No vector exists for an unseen position"],
        ["Sinusoidal", "Added to the input", "Defined for any position, but quality drops"],
        ["RoPE", "Rotates q and k in every layer", "Defined; can be stretched with scaling and a short fine-tune"],
        ["ALiBi", "Subtracts a distance penalty from scores", "Defined; designed to carry to longer inputs"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def sinusoidal(n_pos, d):
    pos = np.arange(n_pos)[:, None]
    i = np.arange(d // 2)[None, :]
    ang = pos / 10000 ** (2 * i / d)       # pair i turns slower as i grows
    pe = np.zeros((n_pos, d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(ang), np.cos(ang)
    return pe

def rope(x, pos, base=10000):
    d = x.shape[-1]
    ang = pos / base ** (np.arange(d // 2) * 2 / d)
    c, s = np.cos(ang), np.sin(ang)
    x1, x2 = x[0::2], x[1::2]
    out = np.empty_like(x)
    out[0::2], out[1::2] = x1 * c - x2 * s, x1 * s + x2 * c   # turn each pair
    return out

print("position 0:", np.round(sinusoidal(50, 8)[0], 2))
rng = np.random.default_rng(0)
q, k = rng.normal(size=8), rng.normal(size=8)
for m, n in [(5, 2), (105, 102), (1005, 1002)]:
    print(f"q at {m}, k at {n}: score {rope(q, m) @ rope(k, n):.4f}")

s = [rope(q, m) @ rope(k, n) for m, n in [(5, 2), (105, 102)]]
assert np.isclose(s[0], s[1])                                      # only the distance matters
assert np.isclose(np.linalg.norm(rope(q, 7)), np.linalg.norm(q))   # a rotation keeps length
`,
    },
    { kind: "text", md: "**Why RoPE won.** It costs no parameters, it leaves the values untouched (only who attends to whom changes), and the same pattern works at any offset in the text, because a score sees only the distance. Context can later be stretched by slowing the rotations, then fine-tuning briefly on long documents." },
  ],
  keyPoints: [
    "The embedding layer is a vocab by d table of learned numbers; a token id selects one row.",
    "Self-attention ignores order, so position information must be added.",
    "Sinusoidal encodings add sine and cosine waves of different speeds to the input; fast waves separate nearby positions, slow ones far positions.",
    "RoPE rotates each pair of numbers in q and k by an angle proportional to position, in every layer, so a score depends only on the distance between tokens.",
    "Learned absolute positions have no vector beyond the trained length; RoPE can be stretched with scaling and a short fine-tune.",
  ],
  questions: [
    { id: "emb-is", level: "easy", kind: "concept",
      q: "What does an embedding layer do with a token id?",
      answer: "Selects that row of a learned vocab by d table",
      wrong: ["Multiplies the id by a learned scalar", "Hashes the id into a random vector each time", "Runs the id through attention to find its meaning"],
      why: "It is a plain lookup, the same as multiplying a one-hot vector by the table. The rows are learned by backprop like any other weight." },
    { id: "order-blind", level: "easy", kind: "concept",
      q: "Why must a transformer add position information at all?",
      answer: "Self-attention treats the input as a set, so without it word order is invisible",
      wrong: ["Softmax needs positions to sum to 1", "The embedding table has no row for repeated words", "Positions make the KV cache smaller"],
      why: "Attention scores every pair the same way regardless of where it sits. Shuffle the tokens and each token's output just moves with it." },
    { id: "sin-speeds", level: "medium", kind: "concept",
      q: "In sinusoidal encodings, how do the first pairs of dimensions differ from the last?",
      answer: "The first pairs change quickly with position; the last change very slowly",
      wrong: ["The first pairs use cosine only, the last sine only", "The first pairs are learned, the last are fixed", "All pairs change at the same speed but start at different phases"],
      why: "Pair i uses angle pos / 10000^(2i/d). At i = 0 the angle is the position itself, a fast clock. As i grows the divisor grows towards 10000, so the clock ticks slowly. Together they work like the hands of a clock." },
    { id: "rope-where", level: "medium", kind: "concept",
      q: "Where is RoPE applied?",
      answer: "To the queries and keys, inside every attention layer",
      wrong: ["To the token embeddings, once, before the first layer", "To the values, so outputs carry position", "To the logits, just before sampling"],
      why: "Position should change who attends to whom, which is set by q . k. Values carry content and are left alone. Nothing is added to the embeddings." },
    { id: "rope-relative", level: "hard", kind: "concept",
      q: "With RoPE, a query at position m and a key at position n. Through what does position reach their score?",
      answer: "Only m - n, their distance",
      wrong: ["Only m + n", "Only m, the query's position", "The larger of m and n"],
      why: `Rotating q by m angles and k by n angles leaves a relative turn of (m - n) angles between them, and a dot product depends only on the relative angle. The walk-through above shows the same score at every start for a fixed gap.` },
    { id: "tying", level: "hard", kind: "concept",
      q: "Some models tie the output layer to the embedding table. What does that mean?",
      answer: "One vocab by d matrix both looks up input vectors and, transposed, scores every token at the output",
      wrong: ["The output layer is frozen at its initial values", "The embedding table is copied into every block", "Input and output use different vocabularies of the same size"],
      why: "The output layer maps a d wide vector to one logit per token, the same shape as the table turned on its side. Sharing it saves vocab x d parameters." },
    { id: "learned-limit", level: "medium", kind: "concept",
      q: `A model with learned absolute positions was trained on sequences of up to ${n0(2048)} tokens. What happens at position ${n0(3000)}?`,
      answer: "There is no trained vector for that position",
      wrong: ["The model reuses position 0, which works as well", "It interpolates smoothly with no loss of quality", "The position is computed by sine and cosine instead"],
      why: "A learned table has exactly as many rows as the longest training length. Formula-based schemes (sinusoidal, RoPE) at least give every position a value, though quality still needs work past the training length." },
    { id: "pe-zero", level: "easy", kind: "numeric",
      q: "What is the sinusoidal position vector for position 0, with d = 4?",
      answer: `[${pe0.join(", ")}]`, wrong: ["[0, 0, 0, 0]", "[1, 1, 1, 1]", "[1, 0, 1, 0]"],
      why: "Even dimensions are sin(angle), odd ones cos(angle), and every angle is 0 at position 0. sin 0 = 0 and cos 0 = 1." },
    { id: "rope-angle", level: "medium", kind: "numeric",
      q: `RoPE with base 10000 and head size d = ${AD}. What angle, in radians, turns pair i = ${AI} at position ${AP}?`,
      answer: r2(angle), wrong: [r2(AP), r2(AP / 10000), r2(AP / ((2 * AI) / AD))],
      why: `Angle = pos / 10000^(2i/d) = ${AP} / 10000^(${2 * AI}/${AD}) = ${AP} / ${10000 ** ((2 * AI) / AD)} = ${r2(angle)}.` },
    { id: "pos-table", level: "medium", kind: "numeric",
      q: `A learned absolute position table covers ${n0(MAXPOS)} positions at width d = ${n0(DM)}. How many parameters does it hold?`,
      answer: n0(MAXPOS * DM), wrong: [n0(MAXPOS + DM), n0(MAXPOS * DM * 2), "0"],
      why: `One learned row of d numbers per position: ${n0(MAXPOS)} x ${n0(DM)} = ${n0(MAXPOS * DM)}. Sinusoidal and RoPE have no parameters at all.` },
    { id: "lookup-shape", level: "easy", kind: "output",
      q: "What shape does this embedding lookup print?",
      code: `import numpy as np\nE = np.zeros((${V}, ${D}))\nids = [${IDS.join(", ")}]\nprint(E[ids].shape)`,
      answer: `(${IDS.length}, ${D})`, wrong: [`(${V}, ${D})`, `(${new Set(IDS).size}, ${D})`, `(${D}, ${IDS.length})`],
      why: `One row per id, repeats included: ${IDS.length} ids give ${IDS.length} rows of ${D}. The repeated id 7 simply returns the same row twice.` },
    { id: "explain-sin", level: "medium", kind: "explain",
      q: "How do sinusoidal position encodings work?",
      answer: "Each position gets a vector the same width as the embeddings. Pair i of it is sin and cos of pos / 10000^(2i/d), and it is added to the token's embedding before the first layer.\n\nThe pairs are clocks at different speeds. Fast pairs tell neighbours apart, slow pairs tell far positions apart, so together every position gets a distinct pattern. There is nothing to learn, and any position has a value, though quality still drops past the lengths seen in training." },
    { id: "explain-rope", level: "hard", kind: "explain",
      q: "Explain RoPE and why most recent LLMs prefer it to added positions.",
      answer: `- Split q and k into pairs of numbers. Turn each pair by an angle equal to the position times that pair's speed.\n- The score q . k then depends on the relative turn between q and k, which is (m - n) times the speeds: only the distance between the tokens.\n- It runs in every attention layer, has no parameters, and leaves the values untouched.\n\nWhy it is preferred: the same attention pattern works anywhere in the text, it does not crowd the embedding with position numbers, and the rotation speeds can be slowed to stretch the context with a short fine-tune.` },
    { id: "explain-stretch", level: "hard", kind: "explain",
      q: "A model uses RoPE and was trained on 4K tokens. How can it be stretched to 16K, and what does it cost?",
      answer: `Positions past 4K give rotation angles the model never saw, so attention degrades. Position interpolation divides every position by ${STRETCH}, so all angles fall back into the trained range, then a short fine-tune on long documents adapts the model. Refinements stretch the slow-turning pairs more than the fast ones, which keeps nearby detail sharp.\n\nThe cost: the KV cache grows ${STRETCH} times, attention compute grows about ${STRETCH ** 2} times, and a long window does not guarantee the model uses the middle of it well, so test it.` },
    { id: "trap-same-word", level: "easy", kind: "trap",
      claim: `With sinusoidal encodings, the same word at positions ${P1} and ${P2} enters the first layer as two different vectors.`,
      truth: true,
      why: `Its embedding row is the same, but the position vectors differ: [${pe1.map(r2).join(", ")}] against [${pe2.map(r2).join(", ")}] at d = 4. The sums differ, which is how the layers tell them apart.` },
    { id: "trap-rope-add", level: "medium", kind: "trap",
      claim: "RoPE adds a position vector to each token embedding before the first layer.",
      truth: false,
      why: "That describes sinusoidal or learned absolute encodings. RoPE adds nothing to the embeddings; it rotates q and k inside each attention layer." },
    { id: "trap-width", level: "medium", kind: "trap",
      claim: "A wider embedding (larger d) lets the model fit more tokens in its context window.",
      truth: false,
      why: "d is how many numbers describe each token. The context length is set by training and the position scheme, and limited in practice by memory for the KV cache, which grows with both d and length." },
  ],
  real: [
    { who: "Jianlin Su and co-authors", when: "2021",
      what: "The paper \"RoFormer: Enhanced Transformer with Rotary Position Embedding\" introduced RoPE. It encodes absolute position with a rotation matrix and brings an explicit relative position dependency into self-attention.",
      takeaway: "Among RoPE's properties the paper lists flexibility in sequence length and a dependency between tokens that decays as their distance grows.",
      url: "https://arxiv.org/abs/2104.09864" },
  ],
};
