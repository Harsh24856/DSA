// Stage 5: Data pipelines. Every number below is computed here.
import type { GModule } from "../../types.ts";

const r2 = (x: number) => x.toFixed(2);
const jaccard = (a: string[], b: string[]) => { const A = new Set(a), B = new Set(b), inter = [...A].filter((x) => B.has(x)).length; return inter / new Set([...A, ...B]).size; };
const lshP = (s: number, r: number, b: number) => 1 - (1 - s ** r) ** b;

// numeric: Jaccard of two small sets
const SA = ["a", "b", "c", "d"], SB = ["c", "d", "e"], J = jaccard(SA, SB);
// numeric: LSH candidate probability
const [LS, LR, LB] = [0.5, 5, 20], lp = lshP(LS, LR, LB);
// output: distinct word pairs
const WORDS = "a b a b a", pairCount = new Set(WORDS.split(" ").slice(0, -1).map((w, i, arr) => `${w} ${WORDS.split(" ")[i + 1]}`)).size;
// predict: a footer date changes one word of a long page; Jaccard on word pairs stays high
const PAGE = 400, changedPairs = 2, jPage = (PAGE - 1 - changedPairs) / (PAGE - 1 + changedPairs);

export const DATA_PIPELINES: GModule = {
  id: "data-pipelines",
  stage: 5,
  title: "Data pipelines",
  hook: "A model is mostly its data. Most of a raw web crawl is thrown away before training, and what is kept, and how often, shapes everything the model can do.",
  blocks: [
    { kind: "figure", id: "s5-funnel", caption: "Each stage keeps only part of what reaches it, so a small share of the raw crawl survives. The shares here are illustrative; real pipelines differ, but the shape is typical." },
    { kind: "text", md: "**Garbage in, garbage out, at trillion-token scale.** A crawl is full of menus, spam, machine-made pages and copies of copies.\n\nThe pipeline turns it into clean, varied, mostly unique text in the right languages, with test sets removed. Then it is tokenised and mixed with other sources, such as code, books and maths, in chosen proportions." },
    { kind: "flow", id: "s5-minhash" },
    {
      kind: "predict",
      q: `Two copies of a ${PAGE}-word article differ only in the date in the footer. Exact SHA-256 dedup: does it remove one?`,
      answer: "No: one changed word gives a completely different hash",
      wrong: ["Yes: the hashes differ in only a few digits", "Yes: SHA-256 ignores small changes", "Only if the date is near the start of the page"],
      why: `A cryptographic hash changes completely for any edit. On word pairs the two pages still have a Jaccard similarity of about ${r2(jPage)}, so near-duplicate search with MinHash catches them.`,
    },
    { kind: "play", id: "s5-lsh" },
    {
      kind: "compare",
      head: ["Stage", "Removes", "How"],
      rows: [
        ["Extract text", "Menus, ads, markup", "HTML to text tools"],
        ["Language ID", "Pages in other languages", "A small classifier per page"],
        ["Quality filter", "Spam, gibberish, keyword lists", "Rules (length, symbols, repeats) and a learned scorer"],
        ["Deduplicate", "Repeated pages and paragraphs", "Exact hashes, then MinHash for near copies"],
        ["Decontaminate", "Benchmark questions", "N-gram overlap with test sets"],
        ["PII and safety", "Emails, phone numbers, toxic text", "Patterns and classifiers"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def shingles(text, k=2):                         # overlapping word pairs
    w = text.split()
    return {" ".join(w[i:i + k]) for i in range(len(w) - k + 1)}

a = shingles("the cat sat on the mat today")
b = shingles("the cat sat on the red mat today")
jac = len(a & b) / len(a | b)
print("exact Jaccard:", round(jac, 3))

# MinHash: 200 random hash functions h(x) = (k*x + c) mod P; keep each set's smallest hash.
ids = {s: i for i, s in enumerate(sorted(a | b))}
rng = np.random.default_rng(1)
P = 2_147_483_647                                # a prime
k, c = rng.integers(1, P, 200), rng.integers(0, P, 200)
def signature(s):
    x = np.array([ids[t] for t in s])
    return ((k[:, None] * x[None, :] + c[:, None]) % P).min(axis=1)

est = np.mean(signature(a) == signature(b))
print("MinHash estimate:", round(float(est), 3))
assert abs(est - jac) < 0.1
`,
    },
    { kind: "text", md: "**The mixture is a choice.** Teams decide how much web, code, maths, books and other languages go in, and may repeat the best sources. They test mixtures with small proxy runs, just like scaling laws.\n\nRepeating data has limits: a few passes over the same text are nearly as good as new text, but the value fades as repeats pile up." },
  ],
  keyPoints: [
    "A pretraining pipeline extracts text, keeps the wanted languages, filters for quality, deduplicates and removes benchmark data.",
    "Exact hashes catch only identical copies; near-duplicates are found with shingles, Jaccard similarity and MinHash.",
    "The chance that two MinHash minimums match equals the Jaccard similarity; LSH bands turn that into fast candidate search.",
    "Decontamination removes test-set text from training data so that benchmark scores stay honest.",
    "The data mixture (web, code, maths, books) and how often each source repeats are deliberate choices tested with small runs.",
  ],
  questions: [
    { id: "why-dedup", level: "easy", kind: "concept",
      q: "Why remove duplicate documents from pretraining data?",
      answer: "Repeats waste compute and push the model to memorise those texts",
      wrong: ["Duplicates make the tokenizer fail", "Duplicates break the causal mask", "The loss cannot be computed on repeated text"],
      why: "Training on the same page many times spends compute without new information and raises the chance the model memorises and regurgitates it. It also tilts the data toward whatever got copied most." },
    { id: "minhash-why", level: "medium", kind: "concept",
      q: "Why does MinHash give an estimate of Jaccard similarity?",
      answer: "For a random hash, the two sets share the same minimum with probability equal to their Jaccard similarity",
      wrong: ["It counts the shared words exactly, but faster", "It compares the two pages' SHA-256 hashes digit by digit", "It measures the cosine similarity of the two pages' embeddings"],
      why: "Under a random hash, each element of the union is equally likely to be the smallest. The minimums match only if that element is in both sets: |A ∩ B| / |A ∪ B|. Averaging over many hash functions gives the estimate." },
    { id: "decontam", level: "medium", kind: "concept",
      q: "What is decontamination in a pretraining pipeline?",
      answer: "Removing text that overlaps with evaluation test sets",
      wrong: ["Removing toxic language", "Removing personal data such as emails", "Removing pages in the wrong language"],
      why: "If benchmark questions and answers are in the training data, the model can recall them and the score overstates its ability. Pipelines search for long n-gram overlaps with test sets and drop matches." },
    { id: "quality-scorer", level: "medium", kind: "concept",
      q: "A common way to keep high-quality web pages at scale is to:",
      answer: "Label a sample for quality, train a small classifier on it, and score every page",
      wrong: ["Keep only pages that rank on the first page of a search engine", "Have people read every page in the crawl", "Keep the longest pages, since length signals quality"],
      why: "People or a strong model can label thousands of pages, not billions. A cheap classifier trained on those labels scales to the whole crawl. Length alone is a weak signal: long pages can be spam." },
    { id: "epochs", level: "hard", kind: "concept",
      q: "You have run out of new text. What did research on data-constrained scaling find about repeating data?",
      answer: "Up to about 4 passes is nearly as good as new data; after that the value of more passes fades",
      wrong: ["Any repetition at all ruins the model", "Repeating data is as good as new data for any number of passes", "Repetition only helps models under 1B parameters"],
      why: "The study reported negligible change in loss for up to 4 epochs compared with unique data, while with more repetition the value of extra compute decays toward zero." },
    { id: "mixture", level: "hard", kind: "concept",
      q: "Why might a lab include more code than its share of the raw web?",
      answer: "The mixture shapes the skills: more code makes a stronger coder, and teams test what else it helps",
      wrong: ["Code is shorter, so training is cheaper", "Code has no duplicates, so it skips dedup", "The tokenizer can only handle code"],
      why: "Pipelines choose mixture weights on purpose. Teams compare mixtures with small proxy runs and keep the one that scores best on the skills they care about." },
    { id: "jaccard-sets", level: "easy", kind: "numeric",
      q: `Page A has shingles {${SA.join(", ")}} and page B has {${SB.join(", ")}}. What is their Jaccard similarity?`,
      answer: r2(J), wrong: [r2(2 / 4), r2(2 / 3), r2(2 / 7)],
      why: `Shared: {c, d}, 2 items. Union: {a, b, c, d, e}, 5 items. 2 / 5 = ${r2(J)}. Dividing by one set's size (2/4 or 2/3) is a common slip.` },
    { id: "lsh-prob", level: "hard", kind: "numeric",
      q: `LSH with b = ${LB} bands of r = ${LR} rows. Two pages have Jaccard ${LS}. What is the chance they become a candidate pair, to 2 decimals?`,
      answer: r2(lp), wrong: [r2(LS ** LR), r2(LS), r2(Math.min(1, LB * LS ** LR))],
      why: `One band matches with probability ${LS}^${LR} = ${(LS ** LR).toFixed(4)}. At least one of ${LB} bands matches with 1 - (1 - ${(LS ** LR).toFixed(4)})^${LB} = ${r2(lp)}. Adding the bands' chances (${r2(LB * LS ** LR)}) double counts overlaps.` },
    { id: "pair-count", level: "easy", kind: "output",
      q: "How many distinct word-pair shingles does this text have? What does this print?",
      code: `w = "${WORDS}".split()\nprint(len({(w[i], w[i + 1]) for i in range(len(w) - 1)}))`,
      answer: String(pairCount), wrong: ["4", "5", "1"],
      why: `There are 4 pairs in order: (a, b), (b, a), (a, b), (b, a). A set keeps distinct ones, so ${pairCount} remain. Shingles are a set, so repeats inside a page do not count twice.` },
    { id: "design", level: "hard", kind: "explain",
      q: "Design a pipeline that turns a raw web crawl into pretraining data.",
      answer: "1. **Extract** main text from HTML; drop navigation, ads and boilerplate.\n2. **Language ID** per page; keep the target languages.\n3. **Quality filters:** cheap rules (length, symbol ratio, repeated lines) first, then a learned quality scorer.\n4. **Deduplicate:** exact hashes for identical copies, MinHash with LSH for near copies, often per paragraph too.\n5. **Decontaminate** against the test sets you will report.\n6. **PII and safety:** mask emails and phone numbers; drop toxic content.\n7. **Tokenise and mix** with code, maths and books at chosen weights.\n\nCheck each stage with small training runs, not just by eye." },
    { id: "contamination", level: "medium", kind: "explain",
      q: "How would you check whether a benchmark leaked into the training data, and why does it matter?",
      answer: "**Why:** a model that saw the test questions can recall answers, so its score measures memory, not skill, and comparisons with other models become unfair.\n\n**How:** break test items into long n-grams (for example 13 words) and search the training data for exact or near matches. Flag items with overlaps, drop them from training, or report scores on a clean subset. Another sign is a model doing much better on the public test set than on fresh, similar questions." },
    { id: "lsh-scale", level: "medium", kind: "explain",
      q: "Why use MinHash with LSH bands instead of comparing every pair of documents?",
      answer: "With n documents there are about n²/2 pairs: for billions of pages that is far too many.\n\nMinHash shrinks each page to a short signature. LSH splits it into bands and hashes each band into buckets. Only pages that share a bucket in some band become candidates, so the work grows roughly with n. Bands and rows set the similarity threshold where pages start to be caught." },
    { id: "trap-unfiltered", level: "easy", kind: "trap",
      claim: "Since more data helps, it is better to train on the whole crawl than to filter most of it away.",
      truth: false,
      why: "Spam, boilerplate and duplicates add tokens without adding knowledge, and can teach bad habits. Quality filtering is a main reason some smaller datasets beat bigger raw ones." },
    { id: "trap-hash", level: "medium", kind: "trap",
      claim: "Two pages with a Jaccard similarity of 0.9 usually have completely different SHA-256 hashes.",
      truth: true,
      why: "Any change, even one character, scrambles a cryptographic hash. That is exactly why exact dedup misses near copies and MinHash is needed." },
    { id: "trap-only-compute", level: "medium", kind: "trap",
      claim: "Deduplication only saves compute; it does not change what the model learns.",
      truth: false,
      why: "Heavily repeated text gets more weight in training and is more likely to be memorised word for word. Dedup changes the mixture the model actually sees." },
  ],
  real: [
    { who: "Guilherme Penedo and co-authors", when: "2024",
      what: "FineWeb is a 15-trillion-token dataset built from 96 Common Crawl snapshots. The same work released FineWeb-Edu, 1.3 trillion tokens of educational text filtered out of FineWeb.",
      takeaway: "Careful extraction, filtering and dedup choices, tested with small runs, are a large part of a model's quality.",
      url: "https://arxiv.org/abs/2406.17557" },
    { who: "Niklas Muennighoff and co-authors", when: "2023",
      what: "\"Scaling Data-Constrained Language Models\" found that training on up to 4 epochs of repeated data gave negligible changes in loss compared with unique data, and that with more repetition the value of added compute decays toward zero.",
      takeaway: "When new text runs out, a few repeats are fine; many are not.",
      url: "https://arxiv.org/abs/2305.16264" },
  ],
};
