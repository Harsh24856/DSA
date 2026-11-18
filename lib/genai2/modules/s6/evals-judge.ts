// Stage 6: evals, and how to trust an LLM judge. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { CI_EX, diffCI, kappa, nNeeded, pairwise, se } from "../../stages/s6.calc.ts";

const p1 = CI_EX.p1, p2 = CI_EX.p2, [n1, n2] = CI_EX.ns;
const [lo1, hi1] = diffCI(p1, p2, n1), [lo2, hi2] = diffCI(p1, p2, n2), need = nNeeded(p1, p2);
const pts = (x: number) => `${(x * 100).toFixed(1)}`;
// numeric: standard error at 80% on 200 items
const [SP, SN] = [0.8, 200], seHalf = 1.96 * se(SP, SN);
// numeric: kappa from a table
const K = kappa(40, 10, 5, 45);
// trap: always-good judge
const GOOD = 0.9;
// position bias example
const PB = pairwise(0.5, 0.3);
// output: kappa code
const OK_ = [14, 3, 1, 2], ok = kappa(...(OK_ as [number, number, number, number]));
const r2 = (x: number) => x.toFixed(2);
// generation metrics: token F1 for short answers, and the unbiased pass@k estimate for code
const toks = (t: string) => t.toLowerCase().split(/\s+/).filter(Boolean);
function tokenF1(pred: string, gold: string) {
  const p = toks(pred), g = toks(gold), left = [...g];
  let hit = 0;
  for (const w of p) { const i = left.indexOf(w); if (i >= 0) { hit++; left.splice(i, 1); } }
  if (!hit) return 0;
  const pr = hit / p.length, rc = hit / g.length;
  return (2 * pr * rc) / (pr + rc);
}
const choose = (n: number, k: number) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; };
const passAtK = (n: number, c: number, k: number) => (n - c < k ? 1 : 1 - choose(n - c, k) / choose(n, k));
const [GOLD, PRED] = ["the eiffel tower in paris", "eiffel tower paris"], F1 = tokenF1(PRED, GOLD);
const [PN, PC, PK] = [10, 3, 5], PASS = passAtK(PN, PC, PK);
if (Math.abs(F1 - 0.75) > 1e-9) throw new Error("F1 example drifted");

export const EVALS_JUDGE: GModule = {
  id: "evals-judge",
  stage: 6,
  title: "Evals and LLM as judge",
  hook: "You changed the prompt and the answers look better. Are they? An eval set tells you, if it is real, big enough and graded by something you have checked. An LLM judge scales the grading, but it must earn your trust first.",
  blocks: [
    { kind: "figure", id: "s6-ci-bars", caption: `The same two scores, ${Math.round(p1 * 100)}% and ${Math.round(p2 * 100)}%. On ${n1} items the intervals overlap and the gain could be zero. On ${n2.toLocaleString("en-US")} items it is clear.` },
    { kind: "flow", id: "g-evalloop" },
    { kind: "text", md: "**Start small and real.** 30 to 100 real inputs, including the ones users complained about. For each, write what good means: a reference answer, facts that must appear, or a yes or no rubric. Tag items (easy, hard, adversarial, by feature) and freeze a version.\n\n**Grade cheapest first.** Code checks (valid JSON, test passes), then reference match, then an LLM judge, then people on a sample." },
    {
      kind: "predict",
      q: `Version A scores ${Math.round(p1 * 100)}% and version B ${Math.round(p2 * 100)}% on the same ${n1} items, graded independently. Has B shown a real gain?`,
      answer: `No: the 95% interval for the gain runs from ${pts(lo1)} to ${pts(hi1)} points`,
      wrong: [`Yes: ${Math.round((p2 - p1) * 100)} points is a clear gain`, "Yes: any gain above 1 point is real", `No: you need at least ${n2.toLocaleString("en-US")} items for any eval`],
      why: `The standard error of each score is about sqrt(p(1 - p) / n). The difference has an interval of ${pts(lo1)} to ${pts(hi1)} points, which includes 0. To see a ${Math.round((p2 - p1) * 100)} point gain this way you need about ${need.toLocaleString("en-US")} items, or a paired comparison.`,
    },
    { kind: "lab", id: "significance" },
    { kind: "flow", id: "g-kappa" },
    { kind: "play", id: "s6-position" },
    {
      kind: "compare",
      head: ["Grader", "Good for", "Watch out"],
      rows: [
        ["Code checks", "Format, tool calls, code that must pass tests", "Says nothing about truth"],
        ["Reference match", "Extraction, maths, labels", "Right answers worded differently"],
        ["LLM judge", "Open answers: faithfulness, tone, helpfulness", "Biases; calibrate against people"],
        ["Pairwise judge", "Choosing between two prompts or models", "Position bias; run both orders"],
        ["People", "Ground truth, checking the judge", "Slow and costly; use samples"],
      ],
    },
    {
      kind: "compare",
      head: ["Metric", "Measures", "Use it for", "Trap"],
      rows: [
        ["Exact match", "answer equals the reference", "short facts, labels, maths", "zero credit for a correct paraphrase"],
        ["Token F1", "word overlap with the reference", "short answers", `"${PRED}" scores ${r2(F1)} against "${GOLD}"`],
        ["BLEU, ROUGE", "n-gram overlap with references", "translation, summaries", "rewards copying words, not being right"],
        ["pass@k", "chance one of k samples passes the tests", "code", "needs real tests; flaky tests inflate it"],
        ["Perplexity", "how surprised the model is by held-out text", "comparing base models", "says nothing about answers to tasks"],
      ],
    },
    { kind: "text", md: "**Contamination.** A public benchmark may have leaked into the training data, and then a high score shows memory, not skill. Prefer a private set built from your own inputs, and watch for scores that jump on old benchmarks but not on fresh ones. Perplexity was defined in [[pretraining-scaling]]." },
    { kind: "text", md: "**A judge you can trust.** Give it the question, the context, the answer and a reference if you have one. Ask for a short reason, then a score per criterion (yes or no beats 1 to 10). Grade 50 to 100 items yourself and measure agreement with kappa, not raw agreement. Fix the rubric until they agree." },
    {
      kind: "code",
      run: true,
      src: `import math
# judge against a person on 100 answers: both good, judge only, person only, both bad
both, j_only, h_only, none = 40, 10, 5, 45
n = both + j_only + h_only + none
po = (both + none) / n                               # raw agreement
pj, ph = (both + j_only) / n, (both + h_only) / n
pe = pj * ph + (1 - pj) * (1 - ph)                   # agreement expected by chance
kappa = (po - pe) / (1 - pe)
recall_bad = none / (none + j_only)                  # of the answers the person called bad, how many did the judge catch?
print(f"agreement {po:.2f}, kappa {kappa:.2f}, judge catches {recall_bad:.0%} of bad answers")

# is a gain real? 95% interval for two accuracies on n items
p1, p2, items = ${p1}, ${p2}, ${n1}
half = 1.96 * math.sqrt(p1 * (1 - p1) / items + p2 * (1 - p2) / items)
print(f"gain {p2 - p1:+.3f} +/- {half:.3f}")
assert p2 - p1 - half < 0 < kappa
`,
    },
  ],
  keyPoints: [
    "An eval set is real inputs with a clear definition of good, tagged and versioned; production failures keep joining it.",
    "Grade with the cheapest reliable grader first: code checks, reference match, then an LLM judge, then people on samples.",
    "Small sets are noisy: put a confidence interval on every difference, and compare versions item by item on the same items.",
    "An LLM judge has biases (position, length, its own model family, leniency); calibrate it against human labels with kappa before trusting it.",
    "Pairwise judges must see each pair in both orders; count a win only when both agree.",
    "Match the metric to the task: exact match or F1 for short facts, pass@k with tests for code, overlap scores only as a rough guide; watch for contaminated benchmarks.",
  ],
  questions: [
    { id: "first-set", level: "easy", kind: "concept",
      q: "What is the best source for a first eval set?",
      answer: "Real user inputs, including the ones that went wrong", wrong: ["Questions the model writes about itself", "A public benchmark only", "The prompt engineer's favourite examples"],
      why: "Your product's real traffic is the spec. Public benchmarks and invented items miss your users' phrasing, topics and failure modes." },
    { id: "grader-order", level: "easy", kind: "concept",
      q: "An answer must be valid JSON with a required field. How should you grade that part?",
      answer: "A code check", wrong: ["An LLM judge with a 1 to 10 scale", "A person reading every output", "Pairwise comparison against an old version"],
      why: "Format rules are exact and cheap to check in code. Save the judge for what code cannot check, like faithfulness or tone." },
    { id: "raw-agree", level: "medium", kind: "concept",
      q: `${Math.round(GOOD * 100)}% of answers are good. A judge agrees with people ${Math.round(GOOD * 100)}% of the time. Why might it be useless?`,
      answer: "A judge that always says good would agree just as often while catching no failures",
      wrong: [`${Math.round(GOOD * 100)}% is below the usual threshold of 95%`, "People are always right, so 10% disagreement means the judge is wrong", "Agreement cannot be measured on good answers"],
      why: "Raw agreement flatters a judge when one label dominates. Kappa removes chance agreement, and the judge's recall on bad answers tells you if it catches what matters." },
    { id: "biases", level: "medium", kind: "concept",
      q: "Which is a known bias of LLM judges?",
      answer: "Preferring longer answers", wrong: ["Preferring answers with fewer tokens every time", "Refusing to grade code", "Scoring every answer zero"],
      why: "Studies of LLM judges report position bias, verbosity bias and a preference for their own outputs. Rubrics that reward correctness, not length, and order swapping help." },
    { id: "paired", level: "hard", kind: "concept",
      q: "Why compare two versions item by item on the same items, rather than only their totals?",
      answer: "Item difficulty cancels out, so smaller real changes show up, and you see which items broke",
      wrong: ["It doubles the number of items for free", "Totals cannot be computed for LLM outputs", "It removes the need for a reference answer"],
      why: "Many items are hard or easy for both versions. Pairing looks only at items that changed, which cuts noise, and lists regressions hidden inside a higher total." },
    { id: "rubric", level: "medium", kind: "concept",
      q: "Which rubric gives the most reliable judge scores?",
      answer: "Yes or no per criterion, such as: every claim is supported by the context",
      wrong: ["One overall score from 1 to 10", "A free-form paragraph with no score", "Ask the judge whether it likes the answer"],
      why: "Narrow binary questions are easier to apply the same way each time, for people and for models. A vague 1 to 10 scale drifts." },
    { id: "offline-online", level: "hard", kind: "concept",
      q: "Offline eval scores went up, but user complaints rose. What is the most likely cause?",
      answer: "The eval set no longer matches real traffic, or the metric rewards something users do not value",
      wrong: ["Users are wrong about quality", "The offline set is too large", "The judge model was upgraded, so complaints must be noise"],
      why: "Inputs drift and metrics can be gamed by length or style. Sample the complaints, add them to the set and check whether the rubric measures what users care about." },
    { id: "se", level: "medium", kind: "numeric",
      q: `One version scores ${Math.round(SP * 100)}% on ${SN} items. About how wide is its 95% interval on each side?`,
      answer: `About ±${(seHalf * 100).toFixed(1)} points`, wrong: [`About ±${(se(SP, SN) * 100).toFixed(1)} points`, "About ±0.5 points", `About ±${(seHalf * 200).toFixed(1)} points`],
      why: `1.96 × sqrt(${SP} × ${r2(1 - SP)} / ${SN}) = ${r2(seHalf)}, about ${(seHalf * 100).toFixed(1)} points. Halving it needs four times the items.` },
    { id: "kappa-num", level: "hard", kind: "numeric",
      q: "On 100 answers: both say good 40, judge only 10, person only 5, both bad 45. What is Cohen's kappa?",
      answer: r2(K.k), wrong: [r2(K.po), r2(K.pe), r2(1 - K.k)],
      why: `Agreement = (40 + 45) / 100 = ${r2(K.po)}. Chance = 0.5 × 0.45 + 0.5 × 0.55 = ${r2(K.pe)}. Kappa = (${r2(K.po)} - ${r2(K.pe)}) / (1 - ${r2(K.pe)}) = ${r2(K.k)}, which is substantial.` },
    { id: "need-n", level: "medium", kind: "numeric",
      q: `About how many items per version does an unpaired test need to show a ${Math.round(p1 * 100)}% to ${Math.round(p2 * 100)}% gain at 95%?`,
      answer: `About ${need.toLocaleString("en-US")}`, wrong: [`About ${n1}`, `About ${Math.round(need / 10).toLocaleString("en-US")}`, `About ${(need * 10).toLocaleString("en-US")}`],
      why: `n ≈ 1.96² × (p1(1 - p1) + p2(1 - p2)) / gain² = ${need.toLocaleString("en-US")}. A paired design on the same items needs far fewer.` },
    { id: "kappa-out", level: "medium", kind: "output",
      q: "Kappa for a judge against a person. What does this print?",
      code: `both, j_only, h_only, none = ${OK_.join(", ")}\nn = both + j_only + h_only + none\npo = (both + none) / n\npj, ph = (both + j_only) / n, (both + h_only) / n\npe = pj * ph + (1 - pj) * (1 - ph)\nprint(round((po - pe) / (1 - pe), 2))`,
      answer: String(Math.round(ok.k * 100) / 100), wrong: [String(Math.round(ok.po * 100) / 100), String(Math.round(ok.pe * 100) / 100), "1.0"],
      why: `Raw agreement is ${r2(ok.po)}, but most answers are good, so chance agreement is already ${r2(ok.pe)}. Kappa is only ${r2(ok.k)}: weak. Fix the rubric before trusting this judge.` },
    { id: "explain-build", level: "medium", kind: "explain",
      q: "How would you build an eval set for a new feature that answers questions from your help-centre articles?",
      answer: "- Collect 50 to 100 real questions; include past failures and hard cases.\n- For each, write a reference answer or the facts that must appear, and the article it should come from.\n- Tag items by topic and difficulty, and keep some questions no article answers, where the right reply is to say so.\n- Grade with yes or no criteria: correct, supported by the article, complete. Check an LLM judge against your own labels first.\n- Freeze a version, run it on every change in CI, and add every production failure to it." },
    { id: "explain-calibrate", level: "hard", kind: "explain",
      q: "How do you make an LLM judge trustworthy?",
      answer: "- Write a rubric a person could apply: narrow yes or no criteria.\n- Give the judge the question, context, answer and a reference; ask for a reason, then the score.\n- Label 50 to 100 items yourself, compare, and report kappa and the judge's recall on bad answers.\n- Read the disagreements and fix the rubric until agreement is substantial.\n- For pairwise, run both orders and count only agreeing verdicts.\n- Recheck after any change to the judge model or the rubric." },
    { id: "explain-ci", level: "medium", kind: "explain",
      q: "Your team wants to ship because the new prompt scored 2 points higher. What do you ask?",
      answer: "How many items, and is the gain outside the noise? Put a 95% interval around the difference; if it includes 0, the gain is not shown.\n\nCompare item by item: which items did it fix and which did it break? A higher total can hide regressions on important cases. Also check cost and latency, which may have moved too." },
    { id: "token-f1", level: "medium", kind: "numeric",
      q: `The reference is "${GOLD}" and the model answers "${PRED}". What is the token F1 (lowercased, split on spaces)?`,
      answer: r2(F1), wrong: ["0", r2(3 / 5), "1.00"],
      why: `3 words overlap. Precision is 3 of ${toks(PRED).length} = 1, recall is 3 of ${toks(GOLD).length} = 0.6, and F1 = 2 × 1 × 0.6 / 1.6 = ${r2(F1)}. Exact match would give 0 for the same answer.` },
    { id: "pass-at-k", level: "hard", kind: "numeric",
      q: `You sample ${PN} programs for a task and ${PC} pass the tests. Using the unbiased estimate 1 - C(n - c, k) / C(n, k), what is pass@${PK}?`,
      answer: r2(PASS), wrong: [r2(PC / PN), r2(1 - (1 - PC / PN) ** PK), "1.00"],
      why: `C(${PN - PC}, ${PK}) / C(${PN}, ${PK}) = ${choose(PN - PC, PK)} / ${choose(PN, PK)} is the chance that all ${PK} picks fail, so pass@${PK} = ${r2(PASS)}. Plain accuracy, ${r2(PC / PN)}, is pass@1.` },
    { id: "trap-contamination", level: "medium", kind: "trap",
      claim: "A model that scores much higher on an old public benchmark than on a fresh set of similar questions may have seen the benchmark in training.",
      truth: true,
      why: "That gap is a classic sign of contamination: the old questions were memorised. Fresh or private sets measure skill on inputs the model cannot have seen." },
    { id: "trap-length", level: "easy", kind: "trap",
      claim: "An LLM judge that agrees with people over 80% of the time needs no further checking on your task.",
      truth: false,
      why: "Agreement on one benchmark does not carry over to your rubric and data, and raw agreement can be high by chance. Measure it on your own labelled sample." },
    { id: "trap-swap", level: "medium", kind: "trap",
      claim: "Running each pairwise comparison in both orders and counting only agreeing verdicts removes most of the effect of position bias.",
      truth: true,
      why: `In the walk-through, a judge that picks the first answer 30% of the time shows A winning ${Math.round(PB.aFirst * 100)}% when A is always first. With both orders, ${Math.round(PB.tie * 100)}% become ties and the rest split ${Math.round(PB.swapWin * 100)}% for A, the true rate.` },
  ],
  real: [
    { who: "Lianmin Zheng and co-authors", when: "2023",
      what: "The MT-Bench and Chatbot Arena paper studied strong LLMs as judges. It names position, verbosity and self-enhancement biases and limited reasoning, and found that strong judges reach over 80% agreement with human preferences, about the level at which humans agree with each other.",
      takeaway: "A judge can stand in for people on many comparisons, but only once its biases are measured and handled.",
      url: "https://arxiv.org/abs/2306.05685" },
  ],
};
