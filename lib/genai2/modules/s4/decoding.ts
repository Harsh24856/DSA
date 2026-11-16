// Stage 4: decoding strategies. Every number below is computed here or in stages/s4.flows.ts.
import type { GModule } from "../../types.ts";
import { NEXT, SAMPLE, sampleStages, softmax, TREE } from "../../stages/s4.flows.ts";

const r2 = (x: number) => x.toFixed(2);

// the pipeline walk-through
const st = sampleStages(NEXT.map((x) => x[1]), SAMPLE.t, SAMPLE.k, SAMPLE.p);
// predict: how many tokens top-p keeps
const PP = [0.5, 0.3, 0.15, 0.05], P_TOP = 0.9;
const keptCount = (ps: number[], p: number) => { let cum = 0, n = 0; for (const x of [...ps].sort((a, b) => b - a)) { if (cum >= p) break; cum += x; n++; } return n; };
const kept = keptCount(PP, P_TOP);
// numeric: temperature 0.5 on [2, 1, 0]
const L = [2, 1, 0], TT = 0.5, t1 = softmax(L), tHalf = softmax(L.map((x) => x / TT));
// numeric: greedy against the best path in the tree
const g1 = TREE.first.reduce((m, x) => (x[1] > m[1] ? x : m)), g2 = TREE.second[g1[0]].reduce((m, x) => (x[1] > m[1] ? x : m));
const leaves = TREE.first.flatMap(([a, pa]) => TREE.second[a].map(([b, pb]) => ({ a, b, p: pa * pb })));
const best = leaves.reduce((m, l) => (l.p > m.p ? l : m)), greedyP = g1[1] * g2[1];
// output: top-p count in numpy
const OP = [0.4, 0.3, 0.2, 0.1], OPP = 0.8, okept = keptCount(OP, OPP);
// min-p
const MINP = 0.1;

export const DECODING: GModule = {
  id: "decoding",
  stage: 4,
  title: "Decoding (greedy, temperature, top-k, top-p, beam)",
  hook: "The model only gives probabilities for the next token. Which one you actually pick, every single step, decides whether the text is dull, creative, or nonsense.",
  blocks: [
    { kind: "figure", id: "s4-decode-tree", caption: `Greedy takes the best word at each step: "${g1[0]}", then "${g2[0]}", ${r2(greedyP)} in all. The most likely sentence starts with the second-best word: "${best.a} ${best.b}", ${r2(best.p)}. Choosing locally is not choosing globally.` },
    { kind: "text", md: "**Every step ends in a choice.** The last layer gives one logit per vocabulary token. Softmax turns them into probabilities, and a decoding strategy picks one token. It is appended, and the model runs again.\n\n**Two families.** Search (greedy, beam) looks for likely text and is deterministic. Sampling (temperature, top-k, top-p) draws at random from a reshaped distribution, so the same prompt can give different answers." },
    { kind: "flow", id: "s4-decode-pipeline" },
    {
      kind: "predict",
      q: `Probabilities are ${PP.join(", ")}. How many tokens does top-p = ${P_TOP} keep?`,
      answer: String(kept),
      wrong: [String(kept - 1), String(PP.length), "1"],
      why: `Add from the top until the total reaches ${P_TOP}: ${PP.slice(0, kept).map((x, i) => PP.slice(0, i + 1).reduce((a, b) => a + b, 0).toFixed(2)).join(", then ")}. After ${kept - 1} tokens the total is still below ${P_TOP}, so token ${kept} is needed, and then the set is complete.`,
    },
    { kind: "lab", id: "sampling" },
    { kind: "play", id: "s4-beam" },
    {
      kind: "compare",
      head: ["Strategy", "How it picks", "Use it for"],
      rows: [
        ["Greedy", "Always the top token", "Short, factual answers; can loop on long text"],
        ["Temperature T", "Divide logits by T, then sample", "Below 1: focused. Above 1: varied, then incoherent"],
        ["Top-k", "Sample from the k most likely", "A fixed cut of the long tail"],
        ["Top-p", "Sample from the smallest set reaching p", "A cut that adapts to how sure the model is"],
        ["Min-p", `Keep tokens at least p times the top one`, "Like top-p, scaled by the top token"],
        ["Beam, width b", "Keep the b most likely partial texts", "Translation and other tasks with one right answer"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def sample(logits, t=1.0, k=None, p=1.0, rng=np.random.default_rng(0)):
    if t == 0:
        return int(np.argmax(logits))                 # greedy
    z = np.asarray(logits) / t                        # temperature
    probs = np.exp(z - z.max()); probs /= probs.sum()
    order = np.argsort(-probs)
    keep = np.zeros(len(probs), dtype=bool)
    keep[order[:k]] = True                            # top-k (k=None keeps all)
    sorted_p = probs[order] * keep[order]
    sorted_p /= sorted_p.sum()
    before = np.cumsum(sorted_p) - sorted_p           # total of the tokens above each one
    keep[order[before >= p]] = False                  # top-p
    final = np.where(keep, probs, 0); final /= final.sum()
    return int(rng.choice(len(probs), p=final))

words = [${NEXT.map(([w]) => `"${w}"`).join(", ")}]
logits = [${NEXT.map(([, l]) => l.toFixed(1)).join(", ")}]
print("greedy:", words[sample(logits, t=0)])
draws = [words[sample(logits, t=${SAMPLE.t}, k=${SAMPLE.k}, p=${SAMPLE.p})] for _ in range(1000)]
print({w: draws.count(w) for w in words})

assert sample(logits, t=0) == 0                                      # top logit
assert all(d in words[:${st.final.filter((x) => x > 0).length}] for d in draws)   # cut tokens never appear
`,
    },
    { kind: "text", md: "**Pick by task.** Extraction, classification and code want low temperature or greedy, so answers are repeatable. Brainstorming and stories want temperature near 1 with top-p around 0.9, so text varies without wandering into the tail. Beam search suits translation, where one faithful output is wanted; in open-ended writing it tends to give bland, repetitive text." },
  ],
  keyPoints: [
    "Greedy takes the top token each step: deterministic, but it can loop and can miss the most likely sentence.",
    "Temperature divides the logits before softmax: below 1 sharpens, above 1 flattens, and the order of tokens never changes.",
    "Top-k keeps a fixed number of tokens; top-p keeps the smallest set whose probabilities reach p, so it adapts to the model's confidence.",
    "Beam search keeps the b most likely partial texts; good for translation, often bland for open-ended text.",
    "Cut tokens are removed and the rest renormalised before sampling.",
  ],
  questions: [
    { id: "greedy", level: "easy", kind: "concept",
      q: "What does greedy decoding do at each step?",
      answer: "Picks the single most likely next token",
      wrong: ["Samples a token in proportion to its probability", "Keeps the b most likely partial texts", "Picks the token that makes the whole sentence most likely"],
      why: "Greedy is argmax every step. It is fast and repeatable, but a locally best choice can lead to a worse whole sentence, as the tree above shows." },
    { id: "temp-low", level: "easy", kind: "concept",
      q: "What does a temperature below 1 do to the next-token distribution?",
      answer: "Makes it sharper, so likely tokens get even more probability",
      wrong: ["Makes it flatter, so rare tokens are picked more", "Removes all but the top k tokens", "Reverses the order of the tokens"],
      why: `Dividing logits by T < 1 stretches the gaps between them. On logits [${L.join(", ")}], T = 1 gives the top token ${r2(t1[0])} and T = ${TT} gives ${r2(tHalf[0])}.` },
    { id: "top-p", level: "medium", kind: "concept",
      q: "Which tokens does top-p (nucleus) sampling keep?",
      answer: "The smallest set of most likely tokens whose probabilities add up to at least p",
      wrong: ["Every token with probability at least p", "The p most likely tokens", "A random fraction p of the vocabulary"],
      why: "Sort by probability and add from the top until the total reaches p. A confident model keeps few tokens; an unsure one keeps many." },
    { id: "p-vs-k", level: "medium", kind: "concept",
      q: "Why is top-p often preferred to top-k?",
      answer: "Its cut adapts to how spread out the distribution is; a fixed k keeps too many tokens when the model is sure and too few when it is not",
      wrong: ["It is deterministic, unlike top-k", "It never needs renormalising", "It always keeps fewer tokens than top-k"],
      why: "After \"The capital of France is\" one token deserves almost all the mass; after \"My favourite food is\" dozens are reasonable. A fixed k treats both the same." },
    { id: "beam-open", level: "hard", kind: "concept",
      q: "Why is beam search rarely used for open-ended chat or stories?",
      answer: "Seeking the most likely text tends to give bland, repetitive output",
      wrong: ["It cannot be run on a GPU", "It only works with encoder-only models", "It ignores the model's probabilities"],
      why: "High-likelihood text is safe and generic, and repeating a phrase often scores well. Sampling with a truncated tail keeps text fluent and varied. Beam search stays useful where one faithful output is wanted, such as translation." },
    { id: "temp-where", level: "hard", kind: "concept",
      q: "Where is temperature applied?",
      answer: "To the logits, divided by T, before softmax",
      wrong: ["To the probabilities, divided by T, after softmax", "To the attention scores inside every layer", "To the embeddings before the first layer"],
      why: "Dividing probabilities by T and renormalising would change nothing. Dividing logits changes the gaps that softmax exponentiates, which is what reshapes the distribution." },
    { id: "min-p", level: "medium", kind: "concept",
      q: `Min-p sampling with p = ${MINP}: which tokens are kept?`,
      answer: `Those with probability at least ${MINP} times the top token's`,
      wrong: [`Those with probability at least ${MINP}`, `The ${MINP * 100}% least likely tokens`, "The smallest set reaching a total of the top token's probability"],
      why: `The threshold scales with the top token. If the top token has 0.80, the cut is ${r2(0.8 * MINP)}; if it has 0.20, the cut is ${r2(0.2 * MINP)}, so more tokens survive when the model is unsure.` },
    { id: "kept", level: "easy", kind: "numeric",
      q: `Probabilities are ${OP.join(", ")}. How many tokens does top-p = ${OPP} keep?`,
      answer: String(okept), wrong: [String(okept - 1), String(OP.length), "1"],
      why: `Running totals: ${OP.map((_, i) => OP.slice(0, i + 1).reduce((a, b) => a + b, 0).toFixed(1)).join(", ")}. The total first reaches ${OPP} at token ${okept}.` },
    { id: "temp-num", level: "medium", kind: "numeric",
      q: `Logits [${L.join(", ")}] at temperature ${TT}. What is the top token's probability, to 2 decimals?`,
      answer: r2(tHalf[0]), wrong: [r2(t1[0]), r2(softmax(L.map((x) => x * TT))[0]), r2(1)],
      why: `Divide by ${TT}: [${L.map((x) => x / TT).join(", ")}]. Softmax gives ${tHalf.map(r2).join(", ")}. At T = 1 the top token had ${r2(t1[0])}; multiplying instead of dividing gives ${r2(softmax(L.map((x) => x * TT))[0])}.` },
    { id: "tree", level: "hard", kind: "numeric",
      q: `In the tree above, greedy's sentence has probability ${r2(greedyP)}. How much more likely is the best two-word sentence?`,
      answer: `${(best.p / greedyP).toFixed(1)} times`, wrong: ["1.0 times: greedy is optimal", `${(best.p / greedyP + 1).toFixed(1)} times`, `${(TREE.first[0][1] / TREE.first[1][1]).toFixed(1)} times`],
      why: `Best: ${r2(TREE.first.find((x) => x[0] === best.a)![1])} x ${r2(TREE.second[best.a].find((x) => x[0] === best.b)![1])} = ${r2(best.p)}. Greedy: ${r2(g1[1])} x ${r2(g2[1])} = ${r2(greedyP)}. Ratio ${(best.p / greedyP).toFixed(1)}. A beam of width 2 would keep "${best.a}" and find it.` },
    { id: "topp-out", level: "medium", kind: "output",
      q: "How many tokens survive this top-p cut? What does it print?",
      code: `import numpy as np\np = np.array([${OP.join(", ")}])\norder = np.argsort(-p)\nbefore = np.cumsum(p[order]) - p[order]\nprint(int((before < ${OPP}).sum()))`,
      answer: String(okept), wrong: [String(okept - 1), String(OP.length), "0"],
      why: `before is the total of the tokens ranked above each one: ${OP.map((_, i) => OP.slice(0, i).reduce((a, b) => a + b, 0).toFixed(1)).join(", ")}. A token is kept while that total is still below ${OPP}: ${okept} tokens.` },
    { id: "explain-choose", level: "medium", kind: "explain",
      q: "Which decoding settings would you use for extraction, creative writing and translation, and why?",
      answer: "- Extracting fields or classifying: greedy or temperature near 0. You want the same, most likely answer every time.\n- Creative writing or brainstorming: temperature around 0.7 to 1 with top-p around 0.9. Varied text, with the unreliable tail cut off.\n- Translation: beam search with a small width. One faithful output is wanted, and a beam finds more likely sentences than greedy.\n\nNone of these settings changes which token the model ranks first; they only reshape or cut the distribution." },
    { id: "explain-loops", level: "hard", kind: "explain",
      q: "Why does greedy or beam decoding often repeat itself on long text, and how does sampling help?",
      answer: "Once a phrase appears, repeating it becomes likely: the context now contains it, and copying is easy for attention. Greedy always takes that likely option, so a loop feeds itself, and beam search, which chases the highest likelihood, makes it worse.\n\nSampling sometimes takes a less likely token, which breaks the loop. Truncating with top-k or top-p keeps those choices sensible. Repetition penalties, which lower the logits of tokens already used, are another common fix." },
    { id: "explain-beam", level: "medium", kind: "explain",
      q: "Explain beam search with width b.",
      answer: "Keep b partial texts, the beams, scored by total log probability.\n1. Extend every beam by every possible next token.\n2. Score each candidate: the beam's score plus the log probability of the new token.\n3. Keep the b best candidates and drop the rest.\n4. Repeat until the beams end; return the best, often with a length penalty so short outputs are not unfairly favoured.\n\nWidth 1 is greedy. A wider beam explores more, costs more, and still is not guaranteed to find the single most likely text." },
    { id: "trap-t1", level: "easy", kind: "trap",
      claim: "Sampling with temperature 1, no top-k and top-p = 1 draws from the model's distribution unchanged.",
      truth: true,
      why: "Dividing logits by 1 changes nothing, top-p = 1 keeps every token, and no top-k cut is applied. This is pure sampling." },
    { id: "trap-temp-order", level: "medium", kind: "trap",
      claim: "Raising the temperature can change which token is most likely.",
      truth: false,
      why: "Dividing every logit by the same positive T keeps their order, so the top token stays on top. Temperature only changes how far ahead it is." },
    { id: "trap-beam-best", level: "hard", kind: "trap",
      claim: "Beam search always returns the most likely complete sequence.",
      truth: false,
      why: "It drops all but b candidates at every step, so a sequence whose start looked weak can be lost before its strong ending appears. It is a better search than greedy, not an exact one." },
  ],
  real: [
    { who: "Ari Holtzman and co-authors", when: "2019",
      what: "The paper \"The Curious Case of Neural Text Degeneration\" found that decoding by likelihood produces text that is bland and strangely repetitive, and proposed nucleus sampling: drawing from the dynamic nucleus of the distribution and cutting the unreliable tail.",
      takeaway: "The authors report that nucleus sampling gives diversity without giving up fluency or coherence, and that the decoding strategy alone can change text quality a lot with the same model.",
      url: "https://arxiv.org/abs/1904.09751" },
  ],
};
