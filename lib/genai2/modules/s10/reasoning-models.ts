// Stage 10: reasoning models and test-time compute. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { anyRight, majority, n0, pct, r2, THINK, thinkCost } from "../../stages/s10.calc.ts";

// predict: voting when one sample is usually wrong
const PP = 0.4, PN = 15, pMaj = majority(PP, PN);
// numeric: majority of 5 at p = 0.6
const MP = 0.6, MN = 5, m5 = majority(MP, MN);
// numeric: what a thinking budget costs
const TB = 8000, tc = thinkCost(TB + THINK.answer, THINK.rate, THINK.perM), plain = thinkCost(THINK.answer, THINK.rate, THINK.perM);
// output: best of n with a checker
const OP = 0.3, ON = 5, oAny = anyRight(OP, ON);

export const REASONING_MODELS: GModule = {
  id: "reasoning-models",
  stage: 10,
  title: "Reasoning models and test-time compute",
  hook: "A reasoning model writes out its thinking before it answers: it plans, tries, checks and backtracks. You can buy accuracy at answer time instead of training a bigger model, but every thought costs tokens and seconds.",
  blocks: [
    { kind: "figure", id: "s10-vote-curves", caption: "Majority voting over more samples pushes accuracy up only when one sample is right more than half the time. Below that, it locks in the wrong answer." },
    { kind: "text", md: "**What changes.** A reasoning model first writes thinking tokens: a plan, attempts, checks. Then it writes the answer. Training rewards long chains that end in a correct, checkable answer, so habits such as checking work and trying another approach grow on their own.\n\n**Test-time compute** is the budget you spend after training: longer thinking, more samples, or a checker that picks the best one." },
    { kind: "flow", id: "s10-think" },
    {
      kind: "predict",
      q: `One sample is right ${pct(PP)} of the time and the wrong answers agree. You take a majority vote over ${PN} samples. What happens?`,
      answer: `Accuracy falls to about ${pct(pMaj)}`,
      wrong: [`Accuracy rises to about ${pct(majority(1 - PP, PN))}`, `It stays at ${pct(PP)}`, `It reaches ${pct(anyRight(PP, PN))}`],
      why: `More than half of ${PN} samples must be right, and each is right only ${pct(PP)} of the time, so the vote is right ${pct(pMaj)} of the time. Voting amplifies whichever answer is most common. ${pct(anyRight(PP, PN))} is what a perfect checker would get.`,
    },
    { kind: "lab", id: "voting" },
    { kind: "play", id: "s10-vote" },
    {
      kind: "compare",
      head: ["Way to spend compute", "Needs", "Best for"],
      rows: [
        ["Think longer (one sample)", "A reasoning model and a budget", "Hard multi-step problems"],
        ["Self-consistency (vote)", "A final answer you can compare", "Math, short answers, classification"],
        ["Best of n with a checker", "Tests, a proof checker or a reward model", "Code, math with a checker"],
        ["Draft, critique, revise", "Feedback that points at the error", "Writing, plans, code with test output"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  subgraph R1["Many steps and errors are costly?"]
    Q1["yes"] --> A1["more effort or a reasoning model"]:::hot
  end
  subgraph R2["A checker exists?"]
    Q2["yes"] --> A2["sample n, keep one that passes"]:::ok
  end
  subgraph R3["High volume, simple labels?"]
    Q3["yes"] --> A3["low effort, small model"]:::warn
  end
  R1 ~~~ R2
  R2 ~~~ R3`,
      caption: "Pick the cheapest setting that holds quality on your own eval set, per route.",
    },
    {
      kind: "code",
      run: true,
      src: `import math

def majority(p, n):
    # chance that more than half of n independent samples are right
    return sum(math.comb(n, k) * p**k * (1 - p)**(n - k) for k in range(n // 2 + 1, n + 1))

def any_right(p, n):
    # a perfect checker only needs one right sample
    return 1 - (1 - p)**n

for p in (0.4, 0.6, 0.8):
    print(p, [round(majority(p, n), 2) for n in (1, 5, 15)], round(any_right(p, 5), 2))

assert majority(0.8, 15) > majority(0.8, 1)    # votes amplify a good model
assert majority(0.4, 15) < 0.4                 # and a bad one
assert any_right(0.4, 5) > majority(0.4, 5)    # a checker beats voting
`,
    },
    { kind: "text", md: `**Budget it.** Thinking happens before the first visible token, so judge latency by the whole reply. At ${THINK.rate} tokens a second, ${n0(TB)} thinking tokens add ${thinkCost(TB, THINK.rate, THINK.perM).s.toFixed(0)} seconds. Describe the goal and the checks you want, not every step; give all the context up front; and leave the output limit room for the thinking.` },
  ],
  keyPoints: [
    "A reasoning model writes thinking tokens (plan, attempt, check, backtrack) before its answer, and accuracy on hard problems rises with the budget.",
    "It is trained mostly with reinforcement learning on answers that can be checked, such as math results and unit tests.",
    "Test-time compute has three forms: think longer, sample many and vote, or sample many and keep the one a checker accepts.",
    "Voting helps only when one sample is right more than half the time; a real checker beats voting whenever you have one.",
    "Thinking costs tokens and latency on every request, so set effort per route from your own evals.",
  ],
  questions: [
    { id: "differs", level: "easy", kind: "concept",
      q: "What does a reasoning model do that a plain chat model does not?",
      answer: "It writes out intermediate reasoning before giving its final answer",
      wrong: ["It looks up the answer in a database", "It uses a larger vocabulary", "It runs several models and averages their weights"],
      why: "The extra tokens are the work: a plan, attempts and checks. The answer comes after them, which is why the first visible token arrives later." },
    { id: "trained", level: "medium", kind: "concept",
      q: "How are current reasoning models mainly taught to reason?",
      answer: "Reinforcement learning that rewards chains ending in answers that can be checked",
      wrong: ["Supervised learning on millions of human-written proofs only", "A bigger pretraining corpus with no later training", "Adding a calculator layer inside the transformer"],
      why: "A math checker or a unit test gives a reward without a human judge. The DeepSeek-R1 paper reports that self-checking and changing strategy emerged from such rewards alone." },
    { id: "process", level: "hard", kind: "concept",
      q: "What is the difference between an outcome reward model and a process reward model?",
      answer: "An outcome model scores only the final answer; a process model scores each reasoning step",
      wrong: ["An outcome model is trained by people; a process model by a compiler", "A process model scores the speed of the answer", "They are two names for the same model"],
      why: "Step-level feedback tells the learner where a chain went wrong, not just that it did. The Let's Verify Step by Step paper found process supervision did better on MATH." },
    { id: "when-not", level: "easy", kind: "concept",
      q: "Which task gains least from a high reasoning effort?",
      answer: "Tagging a million short support tickets with one of five labels",
      wrong: ["Finding a bug that spans three files", "Proving a tricky inequality", "Planning a long multi-step agent task"],
      why: "Simple labels gain little from long thinking, while every request pays the extra tokens and latency. A small model at low effort, or a fine-tuned classifier, is the usual choice." },
    { id: "vote-needs", level: "medium", kind: "concept",
      q: "Self-consistency needs something that best-of-n with a checker does not. What?",
      answer: "Final answers that can be compared, so the most common one can be picked",
      wrong: ["A unit test for every answer", "A reward model trained on human preferences", "Temperature set to 0"],
      why: "Voting counts identical answers, so it suits numbers and labels but not essays. It needs temperature above 0, or every sample is the same. Best-of-n needs a checker instead." },
    { id: "limit", level: "medium", kind: "concept",
      q: "Your API counts thinking tokens toward the output limit. Replies get cut off mid-sentence on hard prompts only. What is the likely cause?",
      answer: "The output limit is too low, because thinking uses it up first",
      wrong: ["The temperature is too high", "The prompt is too short", "The model ran out of vocabulary"],
      why: "Hard prompts make the model think longer, which leaves too little of the limit for the answer. Raise the limit or lower the effort." },
    { id: "maj5", level: "medium", kind: "numeric",
      q: `One sample is right with chance ${MP}, and wrong answers agree. What is the chance a majority vote of ${MN} samples is right, to 2 decimals?`,
      answer: r2(m5), wrong: [r2(MP), r2(anyRight(MP, MN)), r2(MP ** 3)],
      why: `You need 3, 4 or 5 right: C(5,3)·0.6³·0.4² + C(5,4)·0.6⁴·0.4 + 0.6⁵ = ${r2(m5)}. ${r2(anyRight(MP, MN))} would need a perfect checker.` },
    { id: "cost", level: "easy", kind: "numeric",
      q: `A reply has ${n0(TB)} thinking tokens and a ${THINK.answer} token answer, at $${THINK.perM} per million output tokens and ${THINK.rate} tokens a second. How long does it take?`,
      answer: `About ${tc.s.toFixed(0)} seconds`, wrong: [`About ${plain.s.toFixed(0)} seconds`, `About ${(tc.s / 60).toFixed(0)} seconds`, `About ${(tc.s * 2).toFixed(0)} seconds`],
      why: `${n0(TB + THINK.answer)} tokens at ${THINK.rate} a second is ${tc.s.toFixed(0)} seconds, and $${tc.usd.toFixed(3)}. The answer alone would take ${plain.s.toFixed(0)} seconds. Thinking dominates both time and cost.` },
    { id: "any-out", level: "hard", kind: "output",
      q: "A checker accepts any right answer. What does this print?",
      code: `p, n = ${OP}, ${ON}\nprint(round(1 - (1 - p) ** n, 3))`,
      answer: String(Math.round(oAny * 1000) / 1000), wrong: [String(OP), String(Math.round(majority(OP, ON) * 1000) / 1000), String(OP * ON)],
      why: `All ${ON} samples are wrong with chance 0.7⁵ = ${(0.7 ** 5).toFixed(3)}, so at least one is right with chance ${oAny.toFixed(3)}. A vote over the same samples would be right only ${majority(OP, ON).toFixed(3)} of the time.` },
    { id: "explain-ttc", level: "medium", kind: "explain",
      q: "What is test-time compute scaling?",
      answer: "Getting better answers by spending more computation when the model answers, instead of training a bigger model.\n\nThe budget can go to longer thinking in one sample, to many samples with a vote, or to many samples with a checker that keeps the best. On hard reasoning tasks, accuracy keeps rising as this budget grows. One study found that, matched for compute, a smaller model with a well spent budget can beat a model many times its size on problems it can partly solve." },
    { id: "explain-bon", level: "hard", kind: "explain",
      q: "Compare self-consistency and best-of-n with a verifier. When would you pick each?",
      answer: "- Self-consistency samples n answers and keeps the most common. It needs no checker, only answers you can compare, and works when one sample is right more than half the time and wrong answers scatter.\n- Best-of-n scores each sample with a checker (tests, a math checker, a reward model) and keeps the best. It can find a right answer only one sample found, but it is only as good as the checker.\n\nWith unit tests, pick best-of-n. With short answers and no checker, vote. Both cost n times the tokens, so stop early once a clear winner appears." },
    { id: "explain-prompt", level: "medium", kind: "explain",
      q: "How should prompting change for a reasoning model?",
      answer: "State the goal, the constraints and what a good answer looks like, and put all the context in up front. Ask for the checks that matter, such as running the tests before answering.\n\nDrop rigid step-by-step scripts and \"think step by step\": the model already plans, and a fixed script can make it worse. Leave the output limit room for thinking, and tune the effort setting per route on your own evals." },
    { id: "trap-vote", level: "easy", kind: "trap",
      claim: "Taking a majority vote over more samples always improves accuracy.",
      truth: false,
      why: `Only when one sample is right more than half the time. At ${PP} with agreeing wrong answers, ${PN} votes are right just ${pct(pMaj)} of the time.` },
    { id: "trap-small", level: "hard", kind: "trap",
      claim: "On some problems, a smaller model given more test-time compute can beat a much larger model, at the same total compute.",
      truth: true,
      why: "The test-time compute study reports this for problems where the small model already has some success, by spending its budget adaptively per prompt. On problems it cannot solve at all, more samples do not help." },
  ],
  real: [
    { who: "Jason Wei and co-authors", when: "2022",
      what: "Chain-of-thought prompting: showing a model a few worked examples with intermediate steps substantially improved arithmetic, commonsense and symbolic reasoning, in large enough models.",
      takeaway: "Writing the steps out was the first sign that spending tokens on reasoning buys accuracy.",
      url: "https://arxiv.org/abs/2201.11903" },
    { who: "Xuezhi Wang and co-authors", when: "2022",
      what: "Self-consistency samples several reasoning paths and picks the most consistent final answer. It improved on chain of thought by 17.9% on GSM8K and by smaller margins on other benchmarks.",
      takeaway: "Many samples plus a vote is the simplest form of test-time compute.",
      url: "https://arxiv.org/abs/2203.11171" },
    { who: "Hunter Lightman and co-authors", when: "2023",
      what: "Process supervision, feedback on each step, did significantly better than outcome supervision on MATH. The process-supervised model solved 78% of a representative test subset, and the team released 800,000 step-level labels (PRM800K).",
      takeaway: "A checker that judges each step is a stronger signal than one that judges only the end.",
      url: "https://arxiv.org/abs/2305.20050" },
    { who: "Charlie Snell and co-authors", when: "2024",
      what: "A compute-optimal way to spend test-time compute, chosen per prompt difficulty, was over 4 times more efficient than best-of-N. Matched for FLOPs, a smaller model could beat one 14 times larger on problems it partly solved.",
      takeaway: "How you spend answer-time compute matters as much as how much.",
      url: "https://arxiv.org/abs/2408.03314" },
    { who: "DeepSeek-AI", when: "2025",
      what: "DeepSeek-R1 showed reasoning can be encouraged with pure reinforcement learning, without human-labelled reasoning traces. Self-reflection, verification and changing strategy emerged, and the patterns were used to improve smaller models.",
      takeaway: "Checkable rewards, not hand-written chains, drive the newest reasoning models.",
      url: "https://arxiv.org/abs/2501.12948" },
  ],
};
