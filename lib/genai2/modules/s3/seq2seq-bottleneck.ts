// Stage 3, module 4: the encoder-decoder (seq2seq) and the fixed-size vector that limits it. Every number is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");

// predict and trap: the context size does not change with the input
const CTX = 512, [L1, L2] = [10, 100];
// numeric: numbers per word
const [BD, BN] = [512, 64];
// numeric: the 2014 model's sentence vector (4 layers, 1000 cells, a hidden and a cell state each)
const [LAYERS, CELLS] = [4, 1000], sentVec = LAYERS * CELLS * 2;
// output: encoder loop
const [OD, OH] = [8, 16];

export const SEQ2SEQ_BOTTLENECK: GModule = {
  id: "seq2seq-bottleneck",
  stage: 3,
  title: "Seq2seq and the bottleneck",
  hook: "One RNN reads the whole sentence, another writes the translation. Everything the writer knows has to pass through a single fixed-size vector, and long sentences do not fit. Builds on [[lstm-gru]].",
  blocks: [
    { kind: "figure", id: "s3-seq2seq", caption: "The encoder reads the source; only its final state, the context vector, reaches the decoder. The decoder feeds each word it writes back in as its next input." },
    { kind: "flow", id: "s3-seq2seq" },
    { kind: "text", md: "**The catch:** the context has the same size for 5 words or 50.\n\nThis decoder picks the single best word at each step. [[decoding]] in the next stage compares that with beam search and sampling." },
    {
      kind: "predict",
      q: `An encoder has hidden size ${CTX}. How large is the context vector for a ${L1} word sentence, and for a ${L2} word one?`,
      answer: `${CTX} numbers for both`, wrong: [`${n0(CTX * L1)} and ${n0(CTX * L2)}`, `${CTX / L1} and ${(CTX / L2).toFixed(2)}`, `${CTX} and ${n0(CTX * (L2 / L1))}`],
      why: `The context is the encoder's last hidden state, so its size is the hidden size, ${CTX}, whatever the length. ${L2} words must squeeze into the same ${CTX} numbers as ${L1}. That is the bottleneck.`,
    },
    { kind: "play", id: "s3-bottleneck" },
    {
      kind: "mermaid",
      caption: "Training feeds the decoder the true previous word (teacher forcing). At inference it must feed its own guesses, so one early mistake can carry forward.",
      src: `flowchart TB
  subgraph TR["Training"]
    direction TB
    T1["input: true previous word"] --> T2["predict next word"]
    T2 --> T3["loss against the true next word"]:::ok
  end
  subgraph INF["Inference"]
    direction TB
    I1["input: the model's own last word"] --> I2["predict next word"]
    I2 --> I3["a mistake feeds the next step"]:::warn
  end
  TR ~~~ INF`,
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
vocab, d, h = 12, 6, 16
E = rng.normal(0, 0.5, (vocab, d))
W_enc, U_enc = rng.normal(0, 0.3, (h, d)), rng.normal(0, 0.3, (h, h))
W_dec, U_dec = rng.normal(0, 0.3, (h, d)), rng.normal(0, 0.3, (h, h))
V_out = rng.normal(0, 0.5, (vocab, h))
BOS, EOS = 0, 1

def encode(ids):
    hs = np.zeros(h)
    for t in ids:
        hs = np.tanh(W_enc @ E[t] + U_enc @ hs)
    return hs                                   # the whole sentence, in h numbers

def decode(context, max_len=8):
    s, word, out = context, BOS, []
    for _ in range(max_len):                    # greedy: feed back the best word
        s = np.tanh(W_dec @ E[word] + U_dec @ s)
        word = int(np.argmax(V_out @ s))
        if word == EOS:
            break
        out.append(word)
    return out

short, long_ = [3, 4, 5], list(rng.integers(2, vocab, 40))
c1, c2 = encode(short), encode(long_)
print("context sizes:", c1.shape, c2.shape)
print("greedy output (untrained):", decode(c1))
assert c1.shape == c2.shape == (h,)
`,
    },
  ],
  keyPoints: [
    "An encoder RNN reads the input; its final state, the context vector, starts a decoder RNN that writes the output.",
    "The decoder writes one token at a time, feeding each back in, from a start token until it emits an end token, so lengths can differ.",
    "Training uses teacher forcing (true previous token); inference feeds the model's own guesses, a mismatch called exposure bias.",
    "The context has a fixed size whatever the input length, so long inputs lose detail: quality drops as sentences grow.",
  ],
  questions: [
    { id: "decoder-start", level: "easy", kind: "concept",
      q: "In a basic seq2seq model, what does the decoder start from?",
      answer: "The encoder's final hidden state, the context vector",
      wrong: ["The average of all the input embeddings", "A fresh zero state, with the input given at every step", "The encoder's first hidden state"],
      why: "The final state is the only summary the basic model passes over. Every later improvement, attention first, was about letting the decoder see more than this one vector." },
    { id: "stop", level: "easy", kind: "concept",
      q: "How does a seq2seq decoder know when the output is finished?",
      answer: "It generates a special end-of-sequence token", wrong: ["It stops after as many words as the input had", "The context vector stores the output length", "It always writes a fixed number of words"],
      why: "The end token is part of the vocabulary and appears at the end of every training target, so the model learns when to emit it. That is how output length becomes free of input length." },
    { id: "bottleneck", level: "medium", kind: "concept",
      q: "What is the bottleneck in a basic encoder-decoder?",
      answer: "The whole input must be compressed into one fixed-size vector before decoding starts",
      wrong: ["The decoder's vocabulary is smaller than the encoder's", "The decoder can only run on a CPU", "The encoder can read only a fixed number of words"],
      why: "The encoder can read any length, but its summary cannot grow. Short sentences fit; long ones lose details, especially early words, which have been overwritten many times." },
    { id: "lengths", level: "medium", kind: "concept",
      q: "Why can seq2seq translate a 7 word sentence into a 9 word one?",
      answer: "The encoder and decoder are separate loops, and the decoder runs until it emits the end token",
      wrong: ["It pads both sentences to 9 words and tags each position", "It predicts the output length first and splits the context into that many parts", "It cannot: input and output must have the same length"],
      why: "The aligned many-to-many shape emits one output per input step. Seq2seq decouples them: reading is one loop, writing is another, joined only by the context." },
    { id: "exposure-bias", level: "hard", kind: "concept",
      q: "What is exposure bias in a seq2seq model trained with teacher forcing?",
      answer: "In training it only ever sees true previous words, so at inference its own mistakes put it in states it never learned from",
      wrong: ["The encoder sees more data than the decoder", "The model is biased towards frequent words in the training set", "The context vector leaks the target sentence into training"],
      why: "Teacher forcing makes training fast and stable, but inference feeds back guesses. One wrong word changes the next input, and errors can compound. Scheduled sampling, which sometimes feeds the model's own guesses in training, is one fix." },
    { id: "bidir-still", level: "hard", kind: "concept",
      q: "You make the seq2seq encoder bidirectional, as in [[lstm-gru]]. What still limits the decoder on long sentences?",
      answer: "It still receives one fixed-size vector, so the bottleneck stays",
      wrong: ["Nothing: every word is now read twice, so nothing is lost", "The decoder can now read each source word directly", "Teacher forcing no longer works with a bidirectional encoder"],
      why: "Reading both ways gives every position a richer state, but the basic decoder only gets the final summary. The fix is to let the decoder read every encoder state, which is attention, and the first attention model did pair it with a bidirectional encoder." },
    { id: "per-word", level: "easy", kind: "numeric",
      q: `A context vector has ${BD} numbers and the source has ${BN} words. On average, how many numbers per word can it spend?`,
      answer: String(BD / BN), wrong: [String(BD), n0(BD * BN), String(BN / BD)],
      why: `${BD} / ${BN} = ${BD / BN}. Double the sentence and the budget halves. Attention removes this limit by keeping every encoder state (${n0(BD * BN)} numbers here).` },
    { id: "deep-state", level: "hard", kind: "numeric",
      q: `An encoder is an LSTM with ${LAYERS} layers of ${n0(CELLS)} cells, and its whole final state (every layer's hidden and cell state) is passed to the decoder. How many numbers represent the sentence?`,
      answer: n0(sentVec), wrong: [n0(LAYERS * CELLS), n0(CELLS), n0(CELLS * 2)],
      why: `Each layer has a hidden state and a cell state of ${n0(CELLS)} each: ${LAYERS} × ${n0(CELLS)} × 2 = ${n0(sentVec)}. These were the sizes of the 2014 Sequence to Sequence paper, which reported ${n0(sentVec)} numbers per sentence.` },
    { id: "context-shape", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nd, h = ${OD}, ${OH}\nW, U = np.ones((h, d)) * 0.01, np.eye(h) * 0.5\ndef encode(xs):\n    s = np.zeros(h)\n    for x in xs:\n        s = np.tanh(W @ x + U @ s)\n    return s\nprint(encode(np.ones((3, d))).shape, encode(np.ones((50, d))).shape)`,
      answer: `(${OH},) (${OH},)`, wrong: [`(3, ${OH}) (50, ${OH})`, `(${OD},) (${OD},)`, `(3,) (50,)`],
      why: `The loop overwrites one state of size h = ${OH} at each step and returns it. 3 words or 50, the summary is ${OH} numbers.` },
    { id: "explain-bottleneck", level: "medium", kind: "explain",
      q: "What is the bottleneck problem in seq2seq, and what is the evidence for it?",
      answer: "The decoder sees the input only through the encoder's final state, a vector of fixed size. Short inputs fit; long inputs must be squeezed, and early words have been overwritten many times by the time the encoder finishes.\n\nEvidence: in 2014 studies, translation quality of the basic encoder-decoder dropped quickly as sentences got longer. The attention paper that followed named the fixed-length vector as the bottleneck and showed that letting the decoder look at every encoder state removed most of the drop." },
    { id: "train-vs-infer", level: "medium", kind: "explain",
      q: "How does decoding differ between training and inference in seq2seq?",
      answer: "**Training (teacher forcing):** the decoder gets the true previous target word at every step. All the loss terms are computed against the known target, and errors do not compound.\n\n**Inference:** there is no target. The decoder feeds back its own previous output, chosen greedily or by beam search, and stops at the end token.\n\nThe gap between the two is exposure bias: the model never practised recovering from its own mistakes." },
    { id: "why-two", level: "hard", kind: "explain",
      q: "Why use an encoder and a separate decoder for translation, instead of one RNN that emits a word at each input step?",
      answer: "- **Lengths differ:** a source of 7 words may need 9 in the target. One output per input step cannot do that.\n- **Order changes:** \"the black cat\" becomes \"le chat noir\". The second target word depends on the third source word, which a left-to-right tagger has not read yet.\n- **Different jobs:** the encoder learns to understand one language, the decoder to write another, with their own weights and vocabularies.\n\nThe price is that everything the decoder knows passes through the context vector, which attention later fixed." },
    { id: "trap-same-size", level: "easy", kind: "trap",
      claim: "In a basic seq2seq model, the context vector has the same size for a 5 word input and a 50 word input.",
      truth: true,
      why: `It is the encoder's final hidden state, so its size is the hidden size, for example ${CTX}, whatever the length. That is exactly why long inputs suffer.` },
    { id: "trap-tf-inference", level: "medium", kind: "trap",
      claim: "Teacher forcing is used at inference time to keep the decoder on track.",
      truth: false,
      why: "Teacher forcing needs the true target, which does not exist at inference. It is a training technique; at inference the decoder feeds itself, which is where exposure bias shows up." },
  ],
  real: [
    { who: "Ilya Sutskever, Oriol Vinyals and Quoc Le", when: "2014",
      what: "\"Sequence to Sequence Learning with Neural Networks\" encoded a sentence into a fixed vector with a deep LSTM and decoded it with another. On WMT'14 English to French it reached 34.8 BLEU against 33.3 for a phrase-based system.",
      takeaway: "A plain encoder-decoder could compete with years of engineered systems.",
      url: "https://arxiv.org/abs/1409.3215" },
    { who: "Kyunghyun Cho and co-authors", when: "2014",
      what: "\"On the Properties of Neural Machine Translation: Encoder-Decoder Approaches\" found that translation was relatively good for short sentences without unknown words, but that performance degraded rapidly as sentences got longer.",
      takeaway: "Measuring quality by sentence length exposed the fixed-vector bottleneck that attention was built to fix.",
      url: "https://arxiv.org/abs/1409.1259" },
  ],
};
