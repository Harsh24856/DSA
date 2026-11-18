// Stage 1: turning text into vectors. One-hot, bag of words, TF-IDF with cosine similarity, and word2vec. Every number below is computed here or in stages/s1.calc.ts.
// Tokenisation and the transformer's embedding table are stage 4; this module stops at whole words.
import type { GModule } from "../../types.ts";
import { CORPUS, cosine, COUNTS, DOCS, embCos, fmt, idf, SENT, skipPairs, VOCAB, W2V_CFG } from "../../stages/s1.calc.ts";

// predict: the weight of a word found in every document
const theJ = VOCAB.indexOf("the"), theCount = COUNTS[0][theJ];
// numeric: idf in a big collection
const [BN, BDF] = [1000, 10];
// numeric: cosine of two small vectors
const [CA, CB] = [[1, 2, 0], [2, 1, 2]], cab = cosine(CA, CB), cdot = CA.reduce((s, x, i) => s + x * CB[i], 0);
// output: the smoothed idf libraries use, ln((1 + N) / (1 + df)) + 1
const sIdf = (N: number, df: number) => Math.log((1 + N) / (1 + df)) + 1, ON = DOCS.length;
// as Python prints a rounded float: 1.0, not 1
const r3 = (x: number) => { const n = Number(x.toFixed(3)); return Number.isInteger(n) ? n.toFixed(1) : String(n); };
const [dfThe, dfCat] = [VOCAB.indexOf("the"), VOCAB.indexOf("cat")].map((j) => COUNTS.filter((c) => c[j] > 0).length);
// numeric: skip-gram pairs
const WIN = 2, nPairs = skipPairs(SENT, WIN).length;
// concept: one-hot length
const VOC = 50000;

export const TEXT_AS_NUMBERS: GModule = {
  id: "text-as-numbers",
  stage: 1,
  title: "Text as numbers (one-hot, TF-IDF, word2vec)",
  hook: "A model only does arithmetic, so every word must become a list of numbers. How you choose those numbers decides whether \"cat\" and \"dog\" look related or like strangers.",
  blocks: [
    { kind: "figure", id: "s1-cos", caption: `Cosine similarity between four words. One-hot vectors make every pair a stranger. Word2vec vectors, trained here on ${CORPUS.length} toy sentences, put cat near dog and milk near water, because they appear among the same neighbours.` },
    { kind: "text", md: "**One-hot:** give every word in the vocabulary a slot. A word is a vector of zeros with a single 1 in its slot. It is exact but carries no meaning: every pair of different words is equally far apart.\n\n**Bag of words:** add up the one-hot vectors of a document's words, so a document becomes a vector of counts." },
    {
      kind: "predict",
      q: `"the" appears ${theCount} times in d1 and in all ${DOCS.length} documents. With idf = ln(N / df), what is its TF-IDF weight in d1?`,
      answer: "0", wrong: [String(theCount), fmt(theCount * Math.log(DOCS.length)), fmt(theCount / DOCS.length)],
      why: `df = N = ${DOCS.length}, so idf = ln(${DOCS.length} / ${DOCS.length}) = ln(1) = 0, and ${theCount} × 0 = 0. A word that is in every document cannot tell documents apart, so TF-IDF ignores it.`,
    },
    { kind: "flow", id: "s1-tfidf" },
    { kind: "play", id: "s1-idf" },
    { kind: "text", md: "**Word2vec** learns short, dense vectors from raw text, with no labels. The idea: words used in the same company mean similar things. Train a tiny model to tell real neighbour pairs from random ones, and words that share neighbours are pushed toward the same vectors.\n\nAn LLM's embedding table, in stage 4, holds learned vectors of the same kind, trained with the rest of the model." },
    { kind: "flow", id: "s1-w2v" },
    {
      kind: "compare",
      head: ["", "One-hot", "Bag of words", "TF-IDF", "Word2vec"],
      rows: [
        ["Vector length", "vocabulary size", "vocabulary size", "vocabulary size", "a few hundred, chosen"],
        ["Mostly zeros", "yes", "yes", "yes", "no, dense"],
        ["Describes", "one word", "one document", "one document", "one word"],
        ["Learned from data", "no", "no, counted", "counted, then weighted", "yes, by gradient descent"],
        ["Word never seen before", "no slot", "dropped", "dropped", "no vector"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

docs = ["the cat sat on the mat", "the dog sat on the log", "the cat chased the dog",
        "a dog chased a ball in the park", "the mat by the door is red"]
vocab = sorted({w for d in docs for w in d.split()})
col = {w: j for j, w in enumerate(vocab)}

def counts(text):
    v = np.zeros(len(vocab))
    for w in text.split():
        if w in col:                 # words outside the vocabulary are simply dropped
            v[col[w]] += 1
    return v

C = np.array([counts(d) for d in docs])              # documents x vocabulary
idf = np.log(len(docs) / (C > 0).sum(axis=0))        # ln(N / df)
T = C * idf                                          # TF-IDF matrix

def search(query):
    q = counts(query) * idf
    sims = T @ q / (np.linalg.norm(T, axis=1) * np.linalg.norm(q))
    return np.argsort(-sims), sims

order, sims = search("red mat")
for i in order[:3]:
    print(f"{sims[i]:.3f}  {docs[i]}")

assert order[0] == 4                       # both query words are in the last document
assert idf[col["the"]] < idf[col["red"]]    # common words weigh less than rare ones
`,
    },
  ],
  keyPoints: [
    "One-hot gives each word its own slot; any two different words have cosine similarity 0, so it encodes no meaning.",
    "Bag of words counts each word in a document and throws away the order.",
    "TF-IDF multiplies each count by idf = ln(N / df), so words in every document weigh 0 and rare words weigh most.",
    "Cosine similarity compares the direction of two vectors, not their length, so a long and a short document on one topic still match.",
    "Word2vec learns dense vectors by telling real neighbour pairs from random negatives, so words with similar contexts get similar vectors.",
  ],
  questions: [
    { id: "onehot-len", level: "easy", kind: "concept",
      q: `A vocabulary has ${VOC.toLocaleString("en-US")} words. How long is each one-hot vector?`,
      answer: VOC.toLocaleString("en-US"), wrong: ["1", String(Math.ceil(Math.log2(VOC))), "300"],
      why: `One slot per vocabulary word, so ${VOC.toLocaleString("en-US")} numbers, all 0 except one. ${Math.ceil(Math.log2(VOC))} is how many bits a binary code would need, and a few hundred is a typical dense embedding size.` },
    { id: "onehot-meaning", level: "easy", kind: "concept",
      q: "What can one-hot vectors not express?",
      answer: "That two different words are similar", wrong: ["Which word it is", "That a word is in the vocabulary", "A word that appears twice in a sentence"],
      why: "Every pair of different one-hot vectors has dot product 0, so cat is exactly as far from dog as from carburettor. Identity is all they carry." },
    { id: "tfidf-high", level: "medium", kind: "concept",
      q: "Which word gets the highest TF-IDF weight in a document?",
      answer: "One that appears often in this document and in few others", wrong: ["One that appears in every document", "The longest word in the document", "The first word of the document"],
      why: "TF rewards repetition here, IDF rewards rarity across the collection. A word that is common everywhere scores near 0; a word that is frequent only here marks what the document is about." },
    { id: "cos-length", level: "medium", kind: "concept",
      q: "You paste a document twice into one file, so every count doubles. What is the cosine similarity between the original and the doubled version?",
      answer: "1", wrong: ["0.5", "2", "0"],
      why: "Doubling a vector changes its length, not its direction, and cosine divides out both lengths. That is why cosine, not the raw dot product, is used to compare documents of different sizes." },
    { id: "w2v-task", level: "medium", kind: "concept",
      q: "What task is a skip-gram word2vec model trained on?",
      answer: "Telling whether a word really appears near a centre word", wrong: ["Translating a sentence into another language", "Predicting a document's topic label", "Counting how many documents contain each word"],
      why: "Its labels come from the text itself: real neighbour pairs are positives and random words are negatives. The vectors are a by-product of getting this task right." },
    { id: "negatives", level: "hard", kind: "concept",
      q: "Why does word2vec use negative sampling?",
      answer: "To avoid computing a score for every word in the vocabulary on every step", wrong: ["To remove rare words from the vocabulary", "To make the vectors one-hot", "To stop the model from seeing real pairs"],
      why: `Predicting the right neighbour with a softmax means scoring the whole vocabulary each step. Negative sampling instead scores the real pair plus a few random words (${W2V_CFG.negatives} in this module's toy run), a tiny fraction of the cost.` },
    { id: "unseen", level: "hard", kind: "concept",
      q: "A word2vec model meets a word that was not in its training text. What happens?",
      answer: "It has no vector for it, so the word is lost", wrong: ["It builds the vector from the letters", "It uses the vector of the closest word in the alphabet", "It gives the word a one-hot vector of the same size"],
      why: "Word2vec stores one vector per whole word it saw. Splitting words into smaller pieces, so new words are built from known parts, is how LLM tokenisers avoid this; that is stage 4." },
    { id: "idf-big", level: "easy", kind: "numeric",
      q: `A collection has ${BN.toLocaleString("en-US")} documents and a word is in ${BDF} of them. What is its idf = ln(N / df), to 3 decimals?`,
      answer: fmt(idf(BN, BDF)), wrong: [String(BN / BDF), fmt(Math.log10(BN / BDF)), fmt(BDF / BN)],
      why: `ln(${BN.toLocaleString("en-US")} / ${BDF}) = ln(${BN / BDF}) = ${fmt(idf(BN, BDF))}. The base-10 log would give ${fmt(Math.log10(BN / BDF))}; libraries use the natural log, often with small smoothing terms added.` },
    { id: "cos-calc", level: "hard", kind: "numeric",
      q: `What is the cosine similarity of [${CA.join(", ")}] and [${CB.join(", ")}], to 3 decimals?`,
      answer: fmt(cab), wrong: [String(cdot), fmt(cdot / 9), fmt(1 - cab)],
      why: `Dot product ${CA.map((x, i) => `${x} × ${CB[i]}`).join(" + ")} = ${cdot}. Lengths √${CA.reduce((s, x) => s + x * x, 0)} = ${fmt(Math.hypot(...CA))} and √${CB.reduce((s, x) => s + x * x, 0)} = ${fmt(Math.hypot(...CB))}. ${cdot} / (${fmt(Math.hypot(...CA))} × ${fmt(Math.hypot(...CB))}) = ${fmt(cab)}.` },
    { id: "pairs", level: "medium", kind: "numeric",
      q: `How many skip-gram pairs does "${SENT.join(" ")}" give with a window of ${WIN} words each side?`,
      answer: String(nPairs), wrong: [String(SENT.length * 2 * WIN), String(SENT.length * WIN), String(skipPairs(SENT, 1).length)],
      why: `Each word pairs with up to ${WIN} words on each side, but words near the ends have fewer neighbours: ${SENT.map((_, i) => SENT.filter((__, j) => j !== i && Math.abs(i - j) <= WIN).length).join(" + ")} = ${nPairs}, not ${SENT.length} × ${2 * WIN} = ${SENT.length * 2 * WIN}.` },
    { id: "idf-smooth-out", level: "medium", kind: "output",
      q: "Many libraries smooth the idf. What does this print?",
      code: `import math\nN = ${ON}\nidf = lambda df: math.log((1 + N) / (1 + df)) + 1\nprint(round(idf(${dfThe}), 3), round(idf(${dfCat}), 3))`,
      answer: `${r3(sIdf(ON, dfThe))} ${r3(sIdf(ON, dfCat))}`, wrong: [`${r3(idf(ON, dfThe))} ${r3(idf(ON, dfCat))}`, `${r3(idf(ON, dfThe))} ${r3(sIdf(ON, dfCat))}`, `${r3(sIdf(ON, dfThe))} ${r3(idf(ON, dfCat) + 1)}`],
      why: `The +1 inside stops a division by zero for a word no document contains; the +1 outside keeps a word that is in every document, like "the" (df ${dfThe}), at weight ${r3(sIdf(ON, dfThe))} instead of 0. "cat" (df ${dfCat}) gets ln(${1 + ON} / ${1 + dfCat}) + 1 = ${r3(sIdf(ON, dfCat))}, against plain ln(${ON} / ${dfCat}) = ${r3(idf(ON, dfCat))}. Rare words still weigh more; common ones just no longer vanish.` },
    { id: "tfidf-explain", level: "medium", kind: "explain",
      q: "Explain TF-IDF to a product manager, and say when you would still use it.",
      answer: "- Score each word in a document by how often it appears there (TF), times how rare it is across all documents (IDF). Common words like \"the\" score 0; distinctive words score high.\n- A document becomes a vector of these scores, and a search query is scored the same way, then compared by cosine similarity.\n- Still useful: keyword search, where exact terms such as product codes or names matter; as a cheap baseline; and next to embedding search in a hybrid retriever (stage 7, RAG).\n- Weak spot: it only matches the same words, so \"car\" never finds \"automobile\"." },
    { id: "dense-explain", level: "hard", kind: "explain",
      q: "Why did learned dense vectors replace one-hot and count vectors as model inputs?",
      answer: "- Size: one-hot and count vectors are as long as the vocabulary, tens of thousands of numbers that are almost all 0. Dense vectors use a few hundred.\n- Meaning: one-hot treats every word pair as equally unrelated. Learned vectors put words used in similar contexts close together, so what a model learns about one word carries over to similar words.\n- Learning: the vectors are parameters, tuned by gradient descent for the task, instead of fixed counts.\n\nThe cost: they need training data, and a single whole-word vector cannot tell the senses of a word apart." },
    { id: "trap-order", level: "easy", kind: "trap",
      claim: "\"dog bites man\" and \"man bites dog\" have the same bag-of-words vector.",
      truth: true,
      why: "Both contain dog, bites and man once each. Bag of words, and TF-IDF built on it, keep only counts, so word order, and with it who did what, is gone. Models that read sequences, from stage 3 on, fix this." },
    { id: "trap-neg", level: "medium", kind: "trap",
      claim: "The cosine similarity of two TF-IDF document vectors can be negative.",
      truth: false,
      why: `Counts and idf are never negative, so every entry is at least 0 and so is every dot product. TF-IDF cosine runs from 0 to 1. Learned word vectors have signed entries, so their cosine can go below 0: cat and milk score ${fmt(embCos()[0][2])} in the toy run.` },
  ],
  real: [
    { who: "Karen Spärck Jones", when: "1972",
      what: "In the paper \"A Statistical Interpretation of Term Specificity and Its Application in Retrieval\" she introduced inverse document frequency, a statistical measure of how specific a search term is.",
      takeaway: "Weighting words by rarity is the IDF half of TF-IDF.",
      url: "https://en.wikipedia.org/wiki/Tf%E2%80%93idf" },
    { who: "Tomas Mikolov, Kai Chen, Greg Corrado and Jeffrey Dean", when: "2013",
      what: "The paper \"Efficient Estimation of Word Representations in Vector Space\" proposed two model architectures for learning word vectors from very large data sets. The authors report that learning high-quality vectors from a 1.6 billion word data set took less than a day, at much lower computational cost than earlier neural methods.",
      takeaway: "Cheap training on huge raw text, with no labels, is what made learned word vectors practical.",
      url: "https://arxiv.org/abs/1301.3781" },
  ],
};
