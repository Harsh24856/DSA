// Stage 5: RL with verifiable rewards (GRPO). Every number below is computed here.
import type { GModule } from "../../types.ts";
import { grpoAdv } from "../../stages/s5.play.ts";

const r2 = (x: number) => x.toFixed(2);

// predict: a group where every answer is right
const ALL = 8, allRight = grpoAdv(ALL, ALL);
// numeric: 1 right of 4, population spread
const one = grpoAdv(4, 1);
// numeric: completions per step
const [PROMPTS, GROUP] = [64, 8];
// output: two right of four
const R = [1, 1, 0, 0];
const oa = grpoAdv(R.length, R.filter(Boolean).length);
// numpy prints each float padded to one width: " 1." and "-1."
const outLine = `[${R.map((r) => { const v = r ? oa.right : oa.wrong; return `${v}.`.padStart(3); }).join(" ")}]`;
// clip range used in the text and a question
const EPS = 0.2;

export const RL_VERIFIABLE: GModule = {
  id: "rl-verifiable",
  stage: 5,
  title: "RL with verifiable rewards (GRPO)",
  hook: "For maths and code, a program can check the answer. Let the model try many times, reward the attempts that pass, and it learns to reason its way to right answers.",
  blocks: [
    { kind: "figure", id: "s5-grpo-group", caption: "Each answer is compared with its own siblings. Right answers sit above the group mean and are pushed up; wrong ones sit below and are pushed down." },
    { kind: "text", md: "**Verifiable rewards** come from a checker, not from people or a learned reward model: the final number matches, the unit tests pass, the JSON parses. They are cheap, so the model can practise on many problems.\n\n**GRPO** samples a group of answers for each prompt and scores each against the group's average. That average replaces the value model PPO would need." },
    { kind: "flow", id: "g-grpo" },
    {
      kind: "predict",
      q: `All ${ALL} answers in a group are right. What advantage does each get?`,
      answer: `${r2(allRight.right)} for all of them: no learning signal`,
      wrong: ["+1.00 each, since all are right", `+${r2(1 / ALL)} each, an equal share`, "It cannot be computed, so training stops"],
      why: "Every reward equals the mean, so reward minus mean is 0. With a zero spread, implementations add a tiny number to the divisor and the advantage stays 0. The prompt is too easy to teach anything.",
    },
    { kind: "play", id: "s5-grpo-group" },
    {
      kind: "compare",
      head: ["", "PPO RLHF", "DPO", "GRPO + checker"],
      rows: [
        ["Reward from", "Learned reward model", "Preference pairs", "A program"],
        ["Value model", "Yes", "No", "No: group mean"],
        ["Samples while training", "Yes", "No", "Yes, a group each"],
        ["Best for", "Open-ended taste", "Fixed preference data", "Maths, code, tools"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# 8 answers to one prompt, checked by a program: 1 right, 0 wrong
rewards = np.array([1., 0., 0., 1., 1., 0., 0., 0.])
adv = (rewards - rewards.mean()) / (rewards.std() + 1e-6)
print("advantages:", np.round(adv, 2))

# PPO-style clipped objective for one token of each answer
ratio = np.array([1.30, 0.90, 0.70, 1.05, 1.25, 1.00, 0.80, 1.10])   # pi_new / pi_old
eps = ${EPS}
obj = np.minimum(ratio * adv, np.clip(ratio, 1 - eps, 1 + eps) * adv)
print("clipped objective:", np.round(obj, 2))

assert abs(adv.sum()) < 1e-5          # pushes up and down cancel
assert obj[0] <= 1.2 * adv[0] + 1e-9  # a big jump on a good answer earns no extra credit
`,
    },
  ],
  keyPoints: [
    "A verifiable reward comes from a program that checks the answer (exact match, unit tests, a valid format), not from a learned model.",
    "GRPO samples a group of answers per prompt and uses (reward - group mean) / group spread as each answer's advantage.",
    "The group mean is the baseline, so GRPO needs no value network, which saves memory compared with PPO.",
    "A clipped probability ratio and a KL term to a reference keep each update small.",
    "If a group is all right or all wrong, every advantage is 0: the prompt teaches nothing, and a weak checker invites reward hacking.",
  ],
  questions: [
    { id: "verifiable", level: "easy", kind: "concept",
      q: "Which of these is a verifiable reward?",
      answer: "1 if the generated code passes the unit tests, else 0",
      wrong: ["A reward model's score for helpfulness", "A user's thumbs up on the reply", "The length of the reply"],
      why: "A verifiable reward is computed by a program with a clear right answer. Reward models and thumbs up are learned or human judgements, and length is a proxy that is easy to game." },
    { id: "no-critic", level: "medium", kind: "concept",
      q: "What does GRPO use in place of PPO's value network?",
      answer: "The mean reward of the other answers sampled for the same prompt",
      wrong: ["A frozen reward model", "The reward of the single best answer ever seen", "A fixed baseline of 0.5"],
      why: "PPO trains a critic to predict the expected reward. GRPO estimates it directly from the group, which removes a whole model from memory and from training." },
    { id: "normalise", level: "medium", kind: "concept",
      q: "Why divide by the group's spread (standard deviation) when computing the advantage?",
      answer: "So advantages are on a similar scale for every prompt, whatever its rewards",
      wrong: ["So the rewards become probabilities", "So wrong answers get more weight than right ones", "So the advantages always add up to 1"],
      why: "Without it, prompts with widely spread rewards would dominate the update. After dividing, each group's advantages have spread 1. They add up to 0, not 1." },
    { id: "clip", level: "hard", kind: "concept",
      q: `GRPO keeps PPO's clipped ratio, π_new / π_old clipped to [${1 - EPS}, ${1 + EPS}]. What does the clip do?`,
      answer: "It stops one update from moving an answer's probability too far, which keeps training stable",
      wrong: ["It clips the rewards to between 0 and 1", "It caps how long the answers can be", "It stops the model from producing new tokens"],
      why: `Once the ratio leaves [${1 - EPS}, ${1 + EPS}] in the direction the advantage wants, the objective stops rewarding further change, so the gradient there is 0. Big jumps from one batch cannot run away.` },
    { id: "filter-prompts", level: "hard", kind: "concept",
      q: "Why do RLVR pipelines often drop prompts the model always solves or never solves?",
      answer: "Those groups get zero advantage for every answer, so they cost compute and teach nothing",
      wrong: ["They make the verifier crash", "They raise the KL penalty", "They make the loss negative"],
      why: "All right or all wrong means every reward equals the mean. The useful prompts are the ones the model solves sometimes." },
    { id: "kl-ref", level: "medium", kind: "concept",
      q: "What is the KL term to a reference model for in GRPO?",
      answer: "It keeps the policy from drifting far from where it started, so it keeps its general skills",
      wrong: ["It rewards answers that are right", "It replaces the verifier", "It makes the answers longer"],
      why: "The reward only checks the final answer. Without a pull toward the reference, the model can drift into odd language or lose other abilities while chasing that reward." },
    { id: "adv-one", level: "medium", kind: "numeric",
      q: "A group of 4 answers gets rewards [1, 0, 0, 0]. Using the population standard deviation, what is the right answer's advantage?",
      answer: r2(one.right), wrong: [r2(1 - one.mean), r2(1), r2((1 - one.mean) / Math.sqrt((4 * one.mean * (1 - one.mean)) / 3))],
      why: `Mean = ${r2(one.mean)}. Spread = sqrt(${r2(one.mean)} × ${r2(1 - one.mean)}) = ${r2(one.std)}. Advantage = (1 - ${r2(one.mean)}) / ${r2(one.std)} = ${r2(one.right)}. Forgetting to divide gives ${r2(1 - one.mean)}; the sample standard deviation gives ${r2((1 - one.mean) / Math.sqrt((4 * one.mean * (1 - one.mean)) / 3))}.` },
    { id: "completions", level: "easy", kind: "numeric",
      q: `Each training step uses ${PROMPTS} prompts with a group of ${GROUP} answers each. How many answers are generated per step?`,
      answer: String(PROMPTS * GROUP), wrong: [String(PROMPTS + GROUP), String(PROMPTS), String(PROMPTS * GROUP * 2)],
      why: `${PROMPTS} × ${GROUP} = ${PROMPTS * GROUP}. Generating is the slow part of RLVR, which is why fast inference engines matter for it.` },
    { id: "adv-output", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nr = np.array([${R.join(", ")}])\nprint((r - r.mean()) / r.std())`,
      answer: outLine, wrong: ["[ 0.5  0.5 -0.5 -0.5]", "[1. 1. 0. 0.]", "[ 0.25  0.25 -0.25 -0.25]"],
      why: `Mean ${oa.mean}, spread ${oa.std}. Right answers: (1 - ${oa.mean}) / ${oa.std} = ${oa.right}; wrong: ${oa.wrong}. Half right is the most informative group: the pushes are as large as they can be in both directions.` },
    { id: "grpo-steps", level: "medium", kind: "explain",
      q: "Explain one step of GRPO.",
      answer: "1. Take a batch of prompts with checkable answers.\n2. For each, sample a group of G answers from the current model.\n3. Score each with the verifier (for example 1 if right, 0 if wrong).\n4. Advantage = (reward - group mean) / group spread.\n5. Update the policy to raise the probability of every token in high-advantage answers and lower it in low ones, with PPO's clipped ratio and a KL penalty to a reference model.\n\nNo value network and no learned reward model are needed." },
    { id: "why-rlvr", level: "hard", kind: "explain",
      q: "Why did RL with verifiable rewards become central for reasoning models, and where does it fall short?",
      answer: "**Why:** a checker is cheap and hard to fool compared with a learned reward model, so the model can practise on many problems and get exact feedback. Rewarding only right final answers lets the model find its own ways to get there: longer reasoning, checking and backtracking.\n\n**Limits:** it needs tasks with checkable answers, such as maths, code and formats. Open-ended writing still needs preferences. Weak checkers get gamed, and prompts that are too easy or too hard give no signal." },
    { id: "hacking", level: "hard", kind: "explain",
      q: "Give an example of reward hacking under RLVR, and how you would prevent it.",
      answer: "**Example:** the reward is \"the tests pass\", and the model learns to special-case the test inputs, or to edit the tests, instead of solving the task. A maths checker that only looks for a number in a box can be fooled by printing several numbers.\n\n**Prevention:** hidden and varied tests, sandboxes where the tests cannot be changed, strict answer formats, penalties for format tricks, a KL term, and reading samples of high-reward outputs by hand." },
    { id: "trap-all-wrong", level: "medium", kind: "trap",
      claim: "If every answer in a group is wrong, GRPO still pushes the model toward better answers for that prompt.",
      truth: false,
      why: "All rewards equal the mean, so every advantage is 0 and there is no gradient from that prompt. The model has to get it right sometimes before it can learn from it." },
    { id: "trap-no-pairs", level: "easy", kind: "trap",
      claim: "With a program that checks answers, GRPO needs no human preference pairs.",
      truth: true,
      why: "The verifier supplies the reward directly. That is why RLVR scales to many problems: no labelers in the loop." },
    { id: "trap-unhackable", level: "medium", kind: "trap",
      claim: "A reward computed by code cannot be hacked, because code is exact.",
      truth: false,
      why: "Code checks exactly what it was written to check, and nothing more. Models learn to satisfy the letter of a weak checker, such as special-casing tests." },
  ],
  real: [
    { who: "Zhihong Shao and co-authors", when: "2024",
      what: "The DeepSeekMath paper introduced Group Relative Policy Optimization (GRPO), a variant of PPO that improves mathematical reasoning while reducing PPO's memory use.",
      takeaway: "Dropping the value model makes RL on reasoning tasks cheaper to run.",
      url: "https://arxiv.org/abs/2402.03300" },
    { who: "DeepSeek-AI", when: "2025",
      what: "The DeepSeek-R1 paper reported that the reasoning abilities of LLMs can be incentivized through pure reinforcement learning, without human-labelled reasoning trajectories.",
      takeaway: "Rewarding right answers, not imitating worked solutions, can teach a model to reason.",
      url: "https://arxiv.org/abs/2501.12948" },
  ],
};
