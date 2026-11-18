// Stage 4: encoder, decoder, encoder-decoder. Every number below is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");

// predict and numeric: open pairs with and without a causal mask
const N = 6, causal = (N * (N + 1)) / 2, full = N * N;
// numeric: cross-attention matrix
const [TT, TS] = [7, 12];
// output: cross-attention output shape
const [DQ, DS, DK, DV] = [3, 5, 8, 16];

export const ENCODER_DECODER: GModule = {
  id: "encoder-decoder",
  stage: 4,
  title: "Encoder, decoder, encoder-decoder",
  hook: "The same block, wired three ways. Whether a token may look ahead, and whether a second sequence is read through cross-attention, decides what the model is good at. Builds on [[transformer-block]], the masks from [[multi-head-masks]] and the cross-attention idea from [[attention-fix]].",
  blocks: [
    { kind: "figure", id: "s4-attn-kinds", caption: "The three attention patterns. An encoder lets every token see every other. A decoder lets a token see only itself and the past. Cross-attention lets each target token read the whole source." },
    { kind: "text", md: "**Encoder-only** models read a whole text with no mask and output a vector per token: good for classifying, tagging and search embeddings.\n\n**Decoder-only** models use the causal mask and predict the next token: they generate, and they power chat assistants.\n\n**Encoder-decoder** models encode a source once, then a decoder writes the output while reading the source through cross-attention: translation, speech to text, summaries." },
    {
      kind: "predict",
      q: `How many query-key pairs are open for ${N} tokens in a decoder's self-attention, against an encoder's?`,
      answer: `${causal} against ${full}`,
      wrong: [`${full} against ${full}`, `${N} against ${full}`, `${(N * (N - 1)) / 2} against ${full}`],
      why: `An encoder opens all ${N} x ${N} = ${full} pairs. A decoder opens the diagonal and below: n(n + 1) / 2 = ${causal}. Forgetting that each token may see itself gives ${(N * (N - 1)) / 2}.`,
    },
    {
      kind: "mermaid",
      caption: "An encoder-decoder translating. The encoder runs once on the source; the decoder runs once per output token and reads the source through cross-attention.",
      src: `flowchart TB
  S["source sentence"] --> E["encoder: no mask"]
  E -->|"K, V"| C["cross-attention"]:::hot
  T["target so far"] --> D["decoder: causal self-attention"]
  D -->|"Q"| C
  C --> N["next target token"]:::ok
  N -->|"append, repeat"| T`,
    },
    { kind: "flow", id: "s4-cross-attn" },
    { kind: "flow", id: "s4-objectives" },
    {
      kind: "compare",
      head: ["Family", "Attention and training", "Good at"],
      rows: [
        ["Encoder-only", "Both sides, no mask; fills in masked tokens", "Classifying, tagging, embeddings for search"],
        ["Decoder-only", "Causal; predicts the next token", "Generating text, chat, code, most general use"],
        ["Encoder-decoder", "Encoder both sides, causal decoder, plus cross-attention", "Translation, speech to text, summaries"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def cross_attention(dec, enc, Wq, Wk, Wv):
    Q = dec @ Wq                     # queries from the decoder
    K, V = enc @ Wk, enc @ Wv        # keys and values from the encoder output
    s = Q @ K.T / np.sqrt(Q.shape[-1])
    w = np.exp(s - s.max(-1, keepdims=True))
    w = w / w.sum(-1, keepdims=True)     # no causal mask: the whole source is known
    return w @ V, w

rng = np.random.default_rng(0)
enc = rng.normal(size=(5, 8))        # 5 source tokens, encoded once
dec = rng.normal(size=(3, 8))        # 3 target tokens so far
Wq, Wk, Wv = (rng.normal(size=(8, 8)) for _ in range(3))
out, w = cross_attention(dec, enc, Wq, Wk, Wv)
print("weights", w.shape, "output", out.shape)
print("target token 3 reads the source as:", np.round(w[2], 2))

assert w.shape == (3, 5)             # target rows, source columns
assert np.allclose(w.sum(-1), 1)
`,
    },
  ],
  keyPoints: [
    "Encoder-only models use bidirectional self-attention and suit understanding tasks such as classification and embeddings.",
    "Decoder-only models use causal self-attention, learn by predicting the next token, and generate text.",
    "Encoder-decoder models add cross-attention: queries come from the decoder, keys and values from the encoder's output.",
    "In an encoder-decoder, the encoder runs once per input; only the decoder runs once per generated token.",
    "Decoder-only training needs nothing but text shifted by one, which is a big reason it dominates large models.",
  ],
  questions: [
    { id: "who-bidir", level: "easy", kind: "concept",
      q: "Which part uses self-attention with no mask, so every token sees both sides?",
      answer: "The encoder", wrong: ["The decoder", "The cross-attention layer, in both directions", "None: every transformer is causal"],
      why: "An encoder reads a complete input, so there is no future to hide. A decoder generates, so it must not see what comes next." },
    { id: "cross-qkv", level: "easy", kind: "concept",
      q: "In cross-attention, where do the queries, keys and values come from?",
      answer: "Queries from the decoder; keys and values from the encoder's output",
      wrong: ["Queries from the encoder; keys and values from the decoder", "All three from the decoder", "All three from the encoder"],
      why: "The decoder is the one asking: for the word I am writing, which source words matter? The source supplies what can be matched (keys) and what is passed on (values)." },
    { id: "dec-objective", level: "medium", kind: "concept",
      q: "What is a decoder-only language model trained to do?",
      answer: "Predict the next token at every position, from the tokens before it",
      wrong: ["Fill in randomly hidden tokens using both sides", "Translate between two fixed languages", "Classify whole sentences"],
      why: "The target is the input shifted left by one, so one sentence of n tokens gives n training examples, all computed in parallel thanks to the causal mask." },
    { id: "enc-objective", level: "medium", kind: "concept",
      q: "What is an encoder-only model such as BERT trained to do?",
      answer: "Predict hidden (masked) tokens using the words on both sides",
      wrong: ["Predict the next token from the left only", "Rebuild the input with a causal mask", "Rank pairs of documents"],
      why: "Masked language modelling hides some tokens and asks for them back. Seeing both sides makes for strong representations of each token, but it is not how text is written left to right." },
    { id: "bert-gen", level: "hard", kind: "concept",
      q: "Why is an encoder-only model a poor fit for writing text left to right?",
      answer: "It was trained to fill gaps with both sides visible, not to predict the next token from the left alone",
      wrong: ["Its vocabulary has no end token", "Its attention cost is cubic", "It has no feed-forward layers"],
      why: "Generation asks: given only the left context, what comes next? A decoder learns exactly that. An encoder has always seen the right context in training and cannot reuse a cache as tokens are appended." },
    { id: "when-encdec", level: "medium", kind: "concept",
      q: "Which task suits an encoder-decoder best?",
      answer: "Turning a complete input into a different output, such as speech into text",
      wrong: ["Open-ended chat with no input beyond the prompt", "Classifying one sentence into one of three labels", "Producing a single vector for search"],
      why: "The input is fully known and differs from the output in kind or language, so encoding it once and reading it through cross-attention fits. Classification and search vectors need only an encoder." },
    { id: "encdec-runs", level: "hard", kind: "concept",
      q: "An encoder-decoder writes a 50-token answer. How often does the encoder run?",
      answer: "Once; its keys and values for cross-attention are reused at every step",
      wrong: ["50 times, once per output token", "51 times, including the end token", "Never; the decoder reads the raw source tokens"],
      why: "The source does not change while the output is written. The decoder runs once per token and reuses the encoder's output, and its cross-attention keys and values can be cached once." },
    { id: "cross-size", level: "medium", kind: "numeric",
      q: `A target of ${TT} tokens cross-attends to a source of ${TS}. How many entries are in one head's cross-attention weight matrix?`,
      answer: n0(TT * TS), wrong: [n0(TT * TT), n0(TS * TS), n0(TT + TS)],
      why: `One row per target query, one column per source key: ${TT} x ${TS} = ${n0(TT * TS)}. Unlike self-attention, the matrix need not be square.` },
    { id: "cross-shape", level: "medium", kind: "output",
      q: "What shape does this cross-attention print?",
      code: `import numpy as np\nQ = np.ones((${DQ}, ${DK}))\nK = np.ones((${DS}, ${DK}))\nV = np.ones((${DS}, ${DV}))\nw = np.exp(Q @ K.T)\nw = w / w.sum(axis=1, keepdims=True)\nprint((w @ V).shape)`,
      answer: `(${DQ}, ${DV})`, wrong: [`(${DS}, ${DV})`, `(${DQ}, ${DS})`, `(${DQ}, ${DK})`],
      why: `The weights are ${DQ} x ${DS} (target by source). Times V, ${DS} x ${DV}, gives one ${DV} wide vector per target token. The source length disappears.` },
    { id: "explain-three", level: "medium", kind: "explain",
      q: "Compare encoder-only, decoder-only and encoder-decoder models, with a task for each.",
      answer: "- Encoder-only: bidirectional self-attention, trained to fill in masked tokens. Output is a vector per token. Task: sentiment classification, or embeddings for search.\n- Decoder-only: causal self-attention, trained to predict the next token. Task: chat, code completion, any generation.\n- Encoder-decoder: an encoder reads the input once with no mask; a causal decoder writes the output and reads the input through cross-attention. Task: translation or speech to text.\n\nThe blocks are the same; the masks and the cross-attention differ." },
    { id: "explain-cross", level: "hard", kind: "explain",
      q: "What is cross-attention, and how does it differ from self-attention?",
      answer: `Self-attention takes Q, K and V from one sequence. Cross-attention takes Q from one sequence (the decoder's) and K, V from another (the encoder's output).\n\nSo the weight matrix is target by source, for example ${TT} x ${TS}, not square, and needs no causal mask because the whole source is known. It lets each output token pick the input tokens it needs, such as the source word being translated. The same idea links text to images or audio in many multimodal models.` },
    { id: "explain-why-decoder", level: "hard", kind: "explain",
      q: "Why have decoder-only models become the default for large language models?",
      answer: "- One simple objective: next-token prediction works on any text with no labels or pairing, so data scales easily.\n- Every task can be phrased as text in, text out, so one model covers many tasks.\n- Training is parallel across positions thanks to the causal mask, and generation reuses a KV cache.\n- One stack instead of two keeps the design simple.\n\nEncoders remain common for embeddings and classification, and encoder-decoders where input and output differ in kind, such as speech." },
    { id: "trap-encoder-once", level: "easy", kind: "trap",
      claim: "An encoder-decoder runs its encoder once per input, not once per generated token.",
      truth: true,
      why: "The source is fixed while the output is written. Its encoding, and the cross-attention keys and values made from it, are reused at every decoding step." },
    { id: "trap-encoder-causal", level: "medium", kind: "trap",
      claim: "Encoder-only models use a causal mask so they can be fine-tuned for classification.",
      truth: false,
      why: "Encoders see both sides with no mask. That is their strength for classification: every token's vector reflects the whole sentence." },
    { id: "trap-dec-translate", level: "medium", kind: "trap",
      claim: "Decoder-only models cannot translate, because they have no encoder.",
      truth: false,
      why: "Put the source text in the prompt and the model continues with the translation. Self-attention over the prompt does the job cross-attention does in an encoder-decoder." },
  ],
  real: [
    { who: "Jacob Devlin and co-authors", when: "2018",
      what: "BERT pre-trained deep bidirectional representations from unlabeled text, conditioning on both left and right context in all layers.",
      takeaway: "The pre-trained model could be adapted to tasks such as question answering by adding just one output layer.",
      url: "https://arxiv.org/abs/1810.04805" },
    { who: "Colin Raffel and co-authors", when: "2019",
      what: "The paper \"Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer\" converted every text-based language problem into a text-to-text format and compared pre-training objectives, architectures, datasets and transfer approaches.",
      takeaway: "Combined with scale and a new dataset, the Colossal Clean Crawled Corpus, the approach reached state-of-the-art results on many benchmarks.",
      url: "https://arxiv.org/abs/1910.10683" },
  ],
};
