// Stage 6: what a solid prompt contains and the patterns built from several calls. Every number below is computed here.
import type { GModule } from "../../types.ts";

const r3 = (x: number) => x.toFixed(3);
const comb = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
const majority = (p: number, n: number) => { let s = 0; for (let k = Math.floor(n / 2) + 1; k <= n; k++) s += comb(n, k) * p ** k * (1 - p) ** (n - k); return s; };

// numeric: a vote of 3 at 70%
const [P, N3] = [0.7, 3], v3 = majority(P, N3);
// numeric: calls on the hard path (router, three steps, evaluator twice, one revision)
const STEPS = 3, FAILS = 1, calls = 1 + STEPS + (FAILS + 1) + FAILS;
// output: a few-shot prompt ends with an open slot
const EX = 2;
// trap: below 50%, voting hurts
const [PLOW, NLOW] = [0.4, 9], vlow = majority(PLOW, NLOW);

export const PROMPTING_PATTERNS: GModule = {
  id: "prompting-patterns",
  stage: 6,
  title: "Prompting patterns",
  hook: "A prompt is a spec. Give the model a role, rules, a format, examples, the data and the question, in that order, and most \"the model is dumb\" bugs go away.",
  blocks: [
    { kind: "figure", id: "s6-prompt-parts", caption: "Six parts of a solid prompt. The first four never change between calls; the documents and the question change every time and go last." },
    { kind: "text", md: "**Be specific.** Say who the model is, what success looks like and what to do, not only what to avoid. Wrap data in tags like `<documents>` so it cannot be mistaken for instructions. Give a **way out**: \"if the documents do not say, reply that you do not know\". Without one, the model fills the gap with a guess." },
    {
      kind: "predict",
      q: "The model invents an answer whenever the documents do not contain it. Which single change helps most?",
      answer: "Tell it exactly what to reply when the documents lack the answer",
      wrong: ["Raise the temperature so it explores other answers", "Add more examples where the answer is in the documents", "Ask it to answer in fewer words"],
      why: "The model was given no allowed way to say \"not found\", so it guessed. An explicit escape hatch, plus one example that uses it, makes \"I don't have that information\" a valid answer. Examples that always find the answer teach the opposite.",
    },
    {
      kind: "compare",
      head: ["Pattern", "Cost", "Use when"],
      rows: [
        ["Zero-shot", "1 call", "The task is common and clearly described"],
        ["Few-shot", "1 call, longer prompt", "Format, labels or style must match"],
        ["Chain of thought", "1 call, more output", "Several reasoning steps, maths, logic"],
        ["Prompt chaining", "1 call per step", "The task has clear stages"],
        ["Routing", "1 extra small call", "Easy and hard requests are mixed"],
        ["Self-consistency", "n calls", "A checkable final answer must be right"],
        ["Evaluator loop", "2 or more calls", "You can write the quality bar down"],
      ],
    },
    { kind: "flow", id: "s6-chain" },
    {
      kind: "mermaid",
      src: `flowchart TB
  subgraph R1["wrong format or style?"]
    Q1["yes"] --> A1["add 2 to 5 varied examples and a schema"]:::ok
  end
  subgraph R2["needs several reasoning steps?"]
    Q2["yes"] --> A2["ask it to reason first, or use a reasoning model"]:::ok
  end
  subgraph R3["task has clear stages?"]
    Q3["yes"] --> A3["chain: one call per stage"]:::ok
  end
  subgraph R4["easy and hard requests mixed?"]
    Q4["yes"] --> A4["route: a cheap call picks the path"]:::hot
  end
  subgraph R5["must be right, can pay for n calls?"]
    Q5["yes"] --> A5["sample n answers, take the majority"]:::warn
  end
  R1 --> R2 --> R3 --> R4 --> R5`,
      caption: "Which pattern to reach for. Start from the top: the cheap fixes come first.",
    },
    { kind: "text", md: "**Chain of thought** asks the model to write its reasoning before the answer. The reasoning tokens are extra computation, and later tokens can build on earlier ones. **Self-consistency** goes further: sample several reasoning paths at temperature above 0 and keep the most common final answer. Try the vote below." },
    { kind: "play", id: "s6-vote" },
    {
      kind: "code",
      run: true,
      src: `import random
from math import comb

def majority_right(p, n):
    # chance that more than half of n independent samples are right
    return sum(comb(n, k) * p**k * (1 - p)**(n - k) for k in range(n // 2 + 1, n + 1))

random.seed(0)
def simulate(p, n, trials=20000):
    wins = 0
    for _ in range(trials):
        right = sum(random.random() < p for _ in range(n))
        wins += right > n / 2
    return wins / trials

for n in (1, 3, 5, 9):
    print(f"n={n}: exact {majority_right(0.7, n):.3f}, simulated {simulate(0.7, n):.3f}, cost {n}x")

assert abs(majority_right(0.7, 3) - 0.784) < 1e-9   # 0.7^3 + 3 * 0.7^2 * 0.3
assert majority_right(0.4, 9) < 0.4                  # below 50%, a two-way vote makes it worse
`,
    },
  ],
  keyPoints: [
    "A solid prompt has a role and goal, rules, an output format, a way out when the answer is missing, a few examples, the data in tags and the question last.",
    "Say what to do, specifically. Examples teach format, length and labels faster than descriptions.",
    "Chain of thought trades extra output tokens and latency for better multi-step reasoning.",
    "Chaining splits a task into calls you can test one at a time; routing sends easy requests down a cheap path.",
    "Self-consistency samples several answers at temperature above 0 and takes the majority, at n times the cost.",
    "Add a pattern only when an eval shows it helps; every one adds calls, tokens or latency.",
  ],
  questions: [
    { id: "few-shot", level: "easy", kind: "concept",
      q: "What is few-shot prompting?",
      answer: "Putting a few worked input and output examples in the prompt",
      wrong: ["Fine-tuning the model on a few examples", "Sampling a few answers and picking the best", "Asking the same question to a few different models"],
      why: "Few-shot lives entirely in the prompt; no weights change. Fine-tuning on examples is training, and sampling several answers is self-consistency." },
    { id: "cot", level: "easy", kind: "concept",
      q: "What does chain-of-thought prompting ask the model to do?",
      answer: "Write out its reasoning steps before giving the final answer",
      wrong: ["Answer first, then justify the answer", "Call itself in a loop until the answer stops changing", "Split the task across several separate API calls"],
      why: "The model generates left to right, so reasoning written first can feed the answer. Reasoning written after the answer cannot change it. Several separate calls is prompt chaining." },
    { id: "positive", level: "medium", kind: "concept",
      q: "Replies keep coming back with markdown headings, which your UI shows as raw # signs. Which instruction usually works best?",
      answer: "Write plain paragraphs with no headings, like the example below",
      wrong: ["NEVER USE MARKDOWN!!!", "Remove the system prompt so the model has fewer rules", "Raise the temperature so the style varies"],
      why: "A clear target plus an example tells the model what to produce. A shouted ban names the unwanted thing without saying what to write instead. Temperature changes randomness, not style rules." },
    { id: "tags", level: "medium", kind: "concept",
      q: "Why wrap retrieved documents in tags such as <documents>?",
      answer: "So the model can tell data apart from your instructions",
      wrong: ["Because the API parses the tags and validates the documents", "Because tags make the text use fewer tokens", "Because the tokenizer refuses untagged text"],
      why: "The tags are plain text to the API; they only help the model see where data starts and ends. That also makes a line inside a document less likely to be taken as an order, one layer of defence against prompt injection." },
    { id: "sc-temp", level: "medium", kind: "concept",
      q: "For self-consistency, how should the n answers be sampled?",
      answer: "At a temperature above 0, so the reasoning paths differ",
      wrong: ["At temperature 0, so every answer is consistent", "With the same random seed every time", "With max_tokens set very low so the answers are short"],
      why: "The vote only helps if the samples are independent tries. At temperature 0 decoding is greedy, so the samples come out (almost) identical and the vote is n copies of one answer." },
    { id: "chain-benefit", level: "medium", kind: "concept",
      q: "What is the main gain of splitting one big prompt into a chain of smaller calls?",
      answer: "Each step can be tested and fixed on its own",
      wrong: ["It always uses fewer tokens", "It always answers faster", "It removes the need for evals"],
      why: "A chain usually costs more tokens and more latency, since steps run one after another. What you buy is control: a failing step shows up in its own test, so you know what to fix." },
    { id: "example-bias", level: "hard", kind: "concept",
      q: "All 4 few-shot examples in your classifier are labelled \"positive\". What is the likely effect?",
      answer: "The model leans toward answering \"positive\"",
      wrong: ["None, because examples only show the format", "The model refuses to answer \"positive\"", "The model learns the task better because the examples agree"],
      why: "Models copy what examples show, including how often each label appears and how long answers are. Use varied examples that cover each label and an edge case." },
    { id: "vote3", level: "medium", kind: "numeric",
      q: `One sample is right with probability ${P}. You sample ${N3} answers independently and take the majority. What is the chance the majority is right?`,
      answer: r3(v3), wrong: [r3(P), r3(P ** 3), r3(1 - (1 - P) ** 3)],
      why: `The majority is right if 2 or 3 are right: ${P}^3 + 3 × ${P}^2 × ${(1 - P).toFixed(1)} = ${r3(P ** 3)} + ${r3(3 * P * P * (1 - P))} = ${r3(v3)}. ${r3(P ** 3)} is \"all three right\" and ${r3(1 - (1 - P) ** 3)} is \"at least one right\", which a vote does not give you.` },
    { id: "chain-calls", level: "easy", kind: "numeric",
      q: `A request goes through a router, a ${STEPS} step chain, and an evaluator that rejects the first draft once. The writer revises, and the evaluator passes it. How many model calls in all?`,
      answer: String(calls), wrong: [String(calls - 1), String(1 + STEPS), String(calls - 2)],
      why: `Router 1 + steps ${STEPS} + evaluator ${FAILS + 1} (fail, then pass) + revision ${FAILS} = ${calls}. Count calls like this before adding a pattern: each one adds cost and latency.` },
    { id: "slot", level: "easy", kind: "output",
      q: "A few-shot prompt for a sentiment label. What does this print?",
      code: `examples = [("great phone", "positive"), ("broke in a day", "negative")]\nprompt = "".join(f"Review: {r}\\nLabel: {l}\\n\\n" for r, l in examples)\nprompt += "Review: works fine\\nLabel:"\nprint(prompt.count("Label:"))`,
      answer: String(EX + 1), wrong: [String(EX), String(EX + 2), "1"],
      why: `${EX} filled labels from the examples plus one open "Label:" at the end. The prompt stops right where the answer goes, so the model's most likely next tokens are a label in the same format.` },
    { id: "parts", level: "easy", kind: "explain",
      q: "What does a solid prompt for a support bot contain?",
      answer: "- A role and goal: who the model is and what a good answer is.\n- Rules: use only the documents, cite them.\n- An output format: length, structure, or a schema.\n- A way out: what to say when the documents do not answer it.\n- A few varied examples.\n- The documents in tags, then the user's question last." },
    { id: "fewshot-vs-ft", level: "medium", kind: "explain",
      q: "Few-shot examples or fine-tuning: when is each right?",
      answer: "Start with few-shot. It is instant, cheap to change and easy to test.\n\nFine-tune when you have hundreds or more good examples and need a consistent style or format at scale, when the examples make every prompt long and costly, or when you want a small cheap model to match a bigger one on one narrow task. Fine-tuning teaches behaviour; it is a poor way to add facts, which belong in retrieval." },
    { id: "debug", level: "hard", kind: "explain",
      q: "A prompt gives a wrong answer on about 1 in 10 inputs. How do you fix it?",
      answer: "Build a small eval set first: real inputs with the expected answers, including the failures.\n\nRead the failures and group them: missing information, ignored rule, wrong format, ambiguous question. Change one thing aimed at the biggest group, such as a clearer rule, an example of that case or a way out, then rerun the whole set. Keep the change only if the score improves and nothing else breaks." },
    { id: "cot-cost", level: "medium", kind: "explain",
      q: "What are the costs of chain of thought, and when is it not worth it?",
      answer: "The reasoning is extra output tokens, which are usually the expensive ones, and they add latency before the answer appears.\n\nIt is not worth it for simple lookups, classification or extraction, where there is nothing to reason through. Reasoning models already think before answering, so adding \"think step by step\" to them adds little; control their depth with the effort or thinking setting instead." },
    { id: "trap-cot-always", level: "easy", kind: "trap",
      claim: "Adding \"think step by step\" improves every task.",
      truth: false,
      why: "It helps multi-step reasoning. On simple lookups it only adds tokens and latency, and the chain-of-thought paper reported the gains appear in large models, not small ones." },
    { id: "trap-temp0", level: "medium", kind: "trap",
      claim: "At temperature 0, sampling 5 answers for self-consistency mostly gives the same answer 5 times, so the vote adds little.",
      truth: true,
      why: "Temperature 0 picks the most likely token every time, so every path is (nearly) the same. The vote needs varied paths, which come from sampling above 0." },
    { id: "trap-vote-low", level: "hard", kind: "trap",
      claim: `If each sample is right only ${PLOW * 100}% of the time and every wrong sample gives the same wrong answer, a majority vote of ${NLOW} raises accuracy.`,
      truth: false,
      why: `With one rival answer that wins ${100 - PLOW * 100}% of the time, the rival usually holds the majority. The chance the right answer wins falls to ${r3(vlow)}, below ${PLOW}. Voting helps only when right is the most common single answer.` },
  ],
  real: [
    { who: "Jason Wei and co-authors", when: "2022",
      what: "\"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models\" showed that a few examples with written-out reasoning steps improve results on arithmetic, commonsense and symbolic reasoning. With eight such examples, a 540B model reached state-of-the-art accuracy on the GSM8K maths word problems.",
      takeaway: "The authors report the ability appears in sufficiently large models, so test it on yours.",
      url: "https://arxiv.org/abs/2201.11903" },
    { who: "Xuezhi Wang and co-authors", when: "2022",
      what: "\"Self-Consistency Improves Chain of Thought Reasoning in Language Models\" replaced greedy decoding with sampling several reasoning paths and keeping the most consistent answer. They report gains over chain of thought of 17.9% on GSM8K and 11.0% on SVAMP.",
      takeaway: "Several different paths that agree are stronger evidence than one path.",
      url: "https://arxiv.org/abs/2203.11171" },
  ],
};
