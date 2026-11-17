// Stage 4: tokenisation and BPE. Every number below is computed here or in the BPE run in stages/s4.flows.ts.
import type { GModule } from "../../types.ts";
import { bpeEncode, bpeTrain, BPE_STEPS, CORPUS, corpusTokens } from "../../stages/s4.flows.ts";

const n0 = (x: number) => x.toLocaleString("en-US");

// the walk-through's BPE run
const frames = bpeTrain(CORPUS, BPE_STEPS), last = frames[frames.length - 1];
const merges = frames.slice(1).map((f) => f.merge!);
const baseVocab = new Set(CORPUS.flatMap(([w]) => [...w, "_"])).size;
const nWords = CORPUS.reduce((s, [, n]) => s + n, 0), nChars = corpusTokens(frames[0]), nBpe = corpusTokens(last);
// predict: an unseen word
const NEW = "slowest", newToks = bpeEncode(NEW, frames);
// output: most frequent pair in a string
const PS = "abababcab";
const pairCount = new Map<string, number>();
for (let i = 0; i + 1 < PS.length; i++) pairCount.set(PS.slice(i, i + 2), (pairCount.get(PS.slice(i, i + 2)) ?? 0) + 1);
const [bestPair, bestN] = [...pairCount].reduce((m, x) => (x[1] > m[1] ? x : m));
// numeric: merges needed, embedding table size
const [BYTES, VOCAB, DM] = [256, 32000, 4096];

const py = (toks: string[]) => `[${toks.map((t) => `'${t}'`).join(", ")}]`;

export const TOKENISATION_BPE: GModule = {
  id: "tokenisation-bpe",
  stage: 4,
  title: "Tokenisation and BPE",
  hook: "A model never sees letters or words. It sees a list of numbers, one per token, and BPE decides where one token ends and the next begins.",
  blocks: [
    { kind: "figure", id: "s4-bpe-tree", caption: `The word "lowest" after each merge BPE learned from a small corpus. It starts as ${"lowest".length} characters plus an end marker and ends as ${bpeEncode("lowest", frames).length} tokens.` },
    { kind: "text", md: "**A tokenizer turns text into ids** from a fixed list, the vocabulary. Whole words fail on any word not in the list. Single characters never fail, but make sequences long, and attention costs grow with length squared.\n\n**Subwords sit in between.** Byte-pair encoding (BPE) starts from characters (or the 256 byte values) and keeps merging the most frequent neighbouring pair into a new token." },
    { kind: "flow", id: "s4-bpe-train" },
    {
      kind: "predict",
      q: `"${NEW}" never appears in the training corpus. After the ${BPE_STEPS} merges above, how is it split?`,
      answer: `${newToks.length} tokens: ${newToks.join(" ")}`,
      wrong: ["1 token: an unknown-word marker", `${NEW.length + 1} tokens: one per character, plus the end marker`, `2 tokens: slow and est_`],
      why: `Encoding replays the learned merges in order: ${merges.map((m) => `${m.a} + ${m.b}`).join(", ")}. No merge joins ${newToks.slice(0, 2).map((t) => `"${t}"`).join(" and ")}, so they stay apart. An unseen word is cut into known pieces, never dropped.`,
    },
    { kind: "play", id: "s4-bpe-merges" },
    { kind: "lab", id: "bpe" },
    {
      kind: "compare",
      head: ["Unit", "Unknown words", `Tokens for this corpus`],
      rows: [
        ["Whole words", "Need a special unknown token", `${nWords}, but every new word fails`],
        ["Characters", "Never", `${nChars}, counting end markers`],
        [`BPE, ${BPE_STEPS} merges`, "Never: split into known pieces", `${nBpe}, with a vocabulary of ${baseVocab + BPE_STEPS}`],
      ],
    },
    { kind: "flow", id: "g-text" },
    {
      kind: "code",
      run: true,
      src: `from collections import Counter

corpus = {${CORPUS.map(([w, n]) => `"${w}": ${n}`).join(", ")}}
words = {w: list(w) + ["_"] for w in corpus}     # "_" marks the end of a word

def merge(toks, a, b):
    out, i = [], 0
    while i < len(toks):
        if i + 1 < len(toks) and toks[i] == a and toks[i + 1] == b:
            out.append(a + b); i += 2
        else:
            out.append(toks[i]); i += 1
    return out

merges = []
for _ in range(${BPE_STEPS}):
    pairs = Counter()
    for w, toks in words.items():
        for p in zip(toks, toks[1:]):
            pairs[p] += corpus[w]                 # weight by how often the word appears
    (a, b), n = max(pairs.items(), key=lambda kv: kv[1])
    merges.append((a, b))
    words = {w: merge(t, a, b) for w, t in words.items()}
    print(f"merge {len(merges)}: {a} + {b}  (seen {n} times)")

def encode(word):
    toks = list(word) + ["_"]
    for a, b in merges:                           # replay merges in the order learned
        toks = merge(toks, a, b)
    return toks

print("${NEW} ->", encode("${NEW}"))
assert merges[0] == ("${merges[0].a}", "${merges[0].b}")
assert encode("${NEW}") == ${py(newToks)}
`,
    },
    { kind: "text", md: "**Tokens explain odd failures.** A model asked to count the r's in \"strawberry\" sees a few multi-letter tokens, not ten letters. Long numbers split into uneven chunks, which hurts arithmetic. Text in a language the tokenizer saw little of needs more tokens per word, so it costs more and fills the context faster. Prices and context limits are counted in tokens, never characters." },
  ],
  keyPoints: [
    "A tokenizer maps text to ids from a fixed vocabulary; the model only ever sees those ids.",
    "BPE training starts from characters or bytes and repeatedly merges the most frequent adjacent pair into a new token.",
    "Encoding a new text replays the learned merges in order, so an unseen word is split into known pieces, never dropped.",
    "Starting from the 256 byte values means any string can be encoded, with no unknown token.",
    "A bigger vocabulary gives shorter sequences but a bigger embedding table and output layer.",
    "Tokens explain failures such as letter counting, and cost and context limits are counted in tokens.",
  ],
  questions: [
    { id: "why-subword", level: "easy", kind: "concept",
      q: "Why do LLMs use subword tokens rather than whole words?",
      answer: "Any word, even an unseen one, can be built from known pieces, while sequences stay fairly short",
      wrong: ["Whole words are too short for attention to work", "Subwords let the model skip the embedding layer", "Subword vocabularies are always smaller than the alphabet"],
      why: "Whole-word vocabularies break on new words, names and typos. Characters never break but make sequences long. Subwords keep common words whole and split rare ones." },
    { id: "merge-rule", level: "easy", kind: "concept",
      q: "At each training step, which pair does BPE merge?",
      answer: "The most frequent adjacent pair of symbols in the corpus",
      wrong: ["The rarest adjacent pair, to cover rare words", "The two longest tokens in the vocabulary", "A random pair, to keep the vocabulary diverse"],
      why: `Frequency is the whole rule. In the walk-through, "${merges[0].a}" + "${merges[0].b}" appears ${merges[0].count} times, more than any other pair, so it is merged first.` },
    { id: "bytes", level: "medium", kind: "concept",
      q: "Byte-level BPE starts from the 256 possible byte values instead of characters. What does that buy?",
      answer: "Any text in any language, emoji included, can be encoded with no unknown token",
      wrong: ["Every word becomes exactly one token", "The vocabulary can never grow beyond 256", "Tokenisation no longer depends on the training corpus"],
      why: "Every string is a sequence of UTF-8 bytes, and all 256 bytes are in the base vocabulary. The worst case is one token per byte, which is long but never fails." },
    { id: "strawberry", level: "medium", kind: "concept",
      q: "Why does an LLM often miscount the letter r in \"strawberry\"?",
      answer: "It receives a few multi-letter token ids, not individual letters",
      wrong: ["Its context window is too short for a ten-letter word", "Softmax cannot output a count", "The causal mask hides the later letters"],
      why: "The model has to have learned the spelling inside each token. Asking it to spell the word out letter by letter first, or giving it a code tool, usually fixes the count." },
    { id: "encode-order", level: "medium", kind: "concept",
      q: "When a trained BPE tokenizer encodes new text, how are the merges applied?",
      answer: "In the order they were learned: earlier merges take priority",
      wrong: ["Longest matching token first, ignoring the order learned", "Only the last merge learned is applied", "The pair counts are recomputed on the new text"],
      why: `The merge list is the tokenizer. Replaying it in order is what turns "${NEW}" into ${newToks.join(" ")} above. Recounting pairs on the new text would give different splits for the same word in different documents.` },
    { id: "vocab-tradeoff", level: "hard", kind: "concept",
      q: "You double the vocabulary size of a tokenizer. What is the main cost?",
      answer: "A larger embedding table and output layer, and rare tokens that each get little training",
      wrong: ["Longer sequences for the same text", "Attention becomes cubic in length", "The model can no longer encode unseen words"],
      why: "More merges make sequences shorter, which is the gain. The price is vocab x d parameters at both the input and the output softmax, and the extra tokens are rarer, so each is seen less often in training." },
    { id: "other-lang", level: "hard", kind: "concept",
      q: "The same paragraph costs far more tokens in Hindi than in English on one model. What is the likely cause?",
      answer: "The tokenizer was trained mostly on English, so it learned few merges for Hindi text",
      wrong: ["Hindi words are longer, so attention must be cubic", "The model translates the text to English before reading it", "Non-English text is always one token per byte by design"],
      why: "Merges follow frequency in the tokenizer's training data. Little Hindi data means few Hindi merges, so words split into many small pieces: higher cost, slower output and less room in the context." },
    { id: "merges-needed", level: "easy", kind: "numeric",
      q: `A byte-level tokenizer starts with ${BYTES} tokens and should end at ${n0(VOCAB)}, with no special tokens. How many merges does training learn?`,
      answer: n0(VOCAB - BYTES), wrong: [n0(VOCAB), n0(VOCAB + BYTES), n0(VOCAB / 2)],
      why: `Each merge adds exactly one token. ${n0(VOCAB)} - ${BYTES} = ${n0(VOCAB - BYTES)}.` },
    { id: "embed-size", level: "medium", kind: "numeric",
      q: `A vocabulary of ${n0(VOCAB)} tokens and a model width d = ${n0(DM)}. How many numbers are in the embedding table?`,
      answer: n0(VOCAB * DM), wrong: [n0(VOCAB + DM), n0(VOCAB * DM * 2), n0(DM * DM)],
      why: `One row of d numbers per token: ${n0(VOCAB)} x ${n0(DM)} = ${n0(VOCAB * DM)}. If the output layer is not tied to it, it holds the same amount again.` },
    { id: "pair-count", level: "medium", kind: "output",
      q: "This is the counting step of BPE on one string. What does it print?",
      code: `from collections import Counter\ns = "${PS}"\npairs = Counter(zip(s, s[1:]))\nbest = max(pairs, key=pairs.get)\nprint(best, pairs[best])`,
      answer: `('${bestPair[0]}', '${bestPair[1]}') ${bestN}`,
      wrong: [`('${bestPair[1]}', '${bestPair[0]}') ${pairCount.get(bestPair[1] + bestPair[0])}`, `('${bestPair[0]}', '${bestPair[1]}') ${PS.split(bestPair).length}`, `('a', 'b') ${PS.length - 1}`],
      why: `zip(s, s[1:]) lists every adjacent pair: ${[...PS].slice(0, -1).map((c, i) => c + PS[i + 1]).join(", ")}. "${bestPair}" appears ${bestN} times, more than any other, so it would be merged first.` },
    { id: "explain-bpe", level: "medium", kind: "explain",
      q: "Explain how BPE training works.",
      answer: "1. Split every word of the training text into characters (or bytes), with a marker for where a word ends.\n2. Count every adjacent pair of symbols, weighted by how often each word appears.\n3. Merge the most frequent pair everywhere into one new symbol and add it to the vocabulary.\n4. Repeat until the vocabulary reaches the target size.\n\nThe ordered list of merges is the tokenizer. To encode new text, split it the same way and replay the merges in order." },
    { id: "why-not-chars", level: "hard", kind: "explain",
      q: "Characters never produce unknown words. Why not tokenise every model at character level?",
      answer: `- Sequences get several times longer. In the example corpus, characters need ${nChars} tokens against ${nBpe} after just ${BPE_STEPS} merges.\n- Attention cost grows with the square of length, and the context window is counted in tokens, so the model sees less text.\n- Generation is one token per step, so output is slower.\n- The model must spend layers assembling letters into words before it can work with meaning.\n\nSubwords keep the robustness (via byte fallback) at a far shorter length.` },
    { id: "special", level: "medium", kind: "explain",
      q: "What are special tokens, and why do they matter?",
      answer: "Special tokens are ids reserved for structure rather than text: start and end of a sequence, padding, and in chat models the markers around each role's turn.\n\nThey matter because the model learns behaviour from them. The end token is how it knows to stop, and chat markers are how it tells the user's text from its own. If you format a prompt without the template the model was trained on, quality drops." },
    { id: "trap-cost", level: "easy", kind: "trap",
      claim: "The same sentence can cost a different number of tokens on two different models.",
      truth: true,
      why: "Each model family trains its own tokenizer on its own data with its own vocabulary size, so the splits differ. Always count tokens with the tokenizer of the model you call." },
    { id: "trap-unk", level: "medium", kind: "trap",
      claim: "A byte-level BPE tokenizer must output an unknown token for a word it never saw in training.",
      truth: false,
      why: `It falls back to smaller pieces, down to single bytes, all of which are in the vocabulary. "${NEW}" above was never seen, yet it became ${newToks.join(" ")}.` },
    { id: "trap-four", level: "medium", kind: "trap",
      claim: "One token is always exactly four characters.",
      truth: false,
      why: "Four characters per token is a rough average for English text on some tokenizers. A common word may be one token, a rare word or a number may be many, and other languages differ again." },
  ],
  real: [
    { who: "Rico Sennrich, Barry Haddow and Alexandra Birch", when: "2015",
      what: "Their paper \"Neural Machine Translation of Rare Words with Subword Units\" encoded rare and unknown words as sequences of subword units, and used byte pair encoding, a compression algorithm, to choose them.",
      takeaway: "On the WMT 15 translation tasks English-German and English-Russian, subword models improve over a back-off dictionary baseline by up to 1.1 and 1.3 BLEU, respectively.",
      url: "https://arxiv.org/abs/1508.07909" },
  ],
};

