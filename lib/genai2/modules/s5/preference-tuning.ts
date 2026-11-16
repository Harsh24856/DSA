// Stage 5: Preference tuning (RLHF, DPO). Every number below is computed here.
import type { GModule } from "../../types.ts";
import { sigmoid } from "../../stages/s5.flows.ts";

const r2 = (x: number) => x.toFixed(2);

// predict: Bradley-Terry with rewards 1.5 and 0.5
const [PC, PR] = [1.5, 0.5], pWin = sigmoid(PC - PR);
// numeric: rewards 2 and 0
const bt = sigmoid(2);
// numeric: DPO loss when the policy equals the reference
const start = Math.log(2);
// output: one DPO loss
const [OB, PIC, REFC, PIR, REFR] = [0.5, -10, -12, -14, -13], om = (PIC - REFC) - (PIR - REFR), oLoss = -Math.log(sigmoid(OB * om));

export const PREFERENCE_TUNING: GModule = {
  id: "preference-tuning",
  stage: 5,
  title: "Preference tuning (RLHF, DPO)",
  hook: "It is hard to write the perfect answer, but easy to say which of two answers is better. Preference tuning turns those judgements into a better model.",
  blocks: [
    { kind: "figure", id: "s5-rlhf-dpo", caption: "RLHF with PPO juggles four models and samples new answers as it trains. DPO needs only the policy and a frozen reference, and learns from a fixed set of pairs." },
    { kind: "text", md: "**Why preferences?** SFT copies demonstrations, so it can be no better than them. Comparing two answers is easier for people and catches subtle things: tone, honesty, safe refusals.\n\nEach example is a prompt, a **chosen** answer and a **rejected** one. RLHF learns a reward from these pairs and then optimises against it. DPO skips the reward model and trains on the pairs directly." },
    {
      kind: "mermaid",
      caption: "Classic RLHF. The loop samples, scores and updates; the KL term stops the policy drifting far from the reference.",
      src: `flowchart TB
  A["Pairs ranked by people"] --> B["Train a reward model"]
  B --> C["Policy writes answers"]
  C --> D["Reward model scores them"]
  D --> E["PPO update, KL to reference"]:::warn
  E --> C`,
    },
    {
      kind: "predict",
      q: `A reward model gives the chosen answer ${PC} and the rejected one ${PR}. What probability does it put on the chosen answer winning?`,
      answer: r2(pWin),
      wrong: [r2(PC / (PC + PR)), r2(PC - PR), r2(0.5)],
      why: `Reward models use the Bradley-Terry form: P = σ(r_chosen - r_rejected) = σ(${PC - PR}) = ${r2(pWin)}. Only the difference matters, so adding a constant to every reward changes nothing.`,
    },
    { kind: "flow", id: "s5-dpo-step" },
    { kind: "play", id: "s5-dpo-beta" },
    {
      kind: "compare",
      head: ["", "RLHF with PPO", "DPO"],
      rows: [
        ["Models in memory", "4: policy, reference, reward, value", "2: policy, reference"],
        ["Samples during training", "Yes, every step", "No, reads fixed pairs"],
        ["Tuning effort", "High, can be unstable", "Low, close to SFT"],
        ["Beyond the dataset", "Can explore its own answers", "Limited to the pairs given"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
sig = lambda x: 1 / (1 + np.exp(-x))

# Reward model (Bradley-Terry): P(chosen beats rejected) = sigmoid(r_c - r_r)
r_c, r_r = np.array([1.5, 0.2, 2.0]), np.array([0.5, 0.4, -1.0])
print("reward-model loss:", round(float(-np.log(sig(r_c - r_r)).mean()), 3))

# DPO: summed log-probs of each full answer, under the policy and the frozen reference
def dpo_loss(pi_c, pi_r, ref_c, ref_r, beta=0.1):
    margin = (pi_c - ref_c) - (pi_r - ref_r)
    return -np.log(sig(beta * margin)).mean()

pi_c, pi_r = np.array([-12.0, -20.0]), np.array([-15.0, -18.0])
ref_c, ref_r = np.array([-14.0, -21.0]), np.array([-13.0, -18.0])
print("DPO loss:", round(float(dpo_loss(pi_c, pi_r, ref_c, ref_r)), 3))
print("at the start, policy = reference:", round(float(dpo_loss(ref_c, ref_r, ref_c, ref_r)), 3))
assert np.isclose(dpo_loss(ref_c, ref_r, ref_c, ref_r), np.log(2))
`,
    },
  ],
  keyPoints: [
    "Preference data is a prompt with a chosen and a rejected answer; judging is easier than writing the perfect answer.",
    "RLHF trains a reward model with P(chosen wins) = σ(r_chosen - r_rejected), then optimises the policy with PPO against it.",
    "A KL penalty to a frozen reference model stops the policy from drifting into text that fools the reward model.",
    "DPO reaches the same goal with a classification-style loss on the pairs: no reward model and no sampling loop.",
    "β sets how far the policy may move from the reference: a larger β keeps it closer.",
  ],
  questions: [
    { id: "rm-data", level: "easy", kind: "concept",
      q: "What is the reward model in RLHF trained on?",
      answer: "People's comparisons of two or more answers to the same prompt",
      wrong: ["Ideal answers written by people, with next-token loss", "Whether code answers pass their unit tests", "Raw web text, like pretraining"],
      why: "Labelers rank answers, and the reward model learns to score the preferred one higher. Ideal answers are SFT data; unit tests are verifiable rewards, used in RLVR." },
    { id: "dpo-removes", level: "easy", kind: "concept",
      q: "Compared with RLHF using PPO, what does DPO remove?",
      answer: "The separate reward model and the loop that samples new answers during training",
      wrong: ["The frozen reference model", "The preference pairs", "The SFT step before it"],
      why: "DPO shows the RLHF goal can be met by a simple loss on preference pairs, measured against a frozen reference. It still needs the pairs and the reference, and usually starts from an SFT model." },
    { id: "kl", level: "medium", kind: "concept",
      q: "Why does RLHF add a KL penalty between the policy and a reference model?",
      answer: "To stop the policy drifting into odd text that scores high with the reward model but is not actually good",
      wrong: ["To make training faster", "To make the policy copy the reference exactly", "To shrink the model's vocabulary"],
      why: "The reward model is only an approximation of human taste. Pushed hard, the policy finds its blind spots: reward hacking. The KL term keeps the policy near text the reward model has seen." },
    { id: "beta", level: "medium", kind: "concept",
      q: "In DPO, what does a larger β do?",
      answer: "Keeps the policy closer to the reference model",
      wrong: ["Lets the policy move further from the reference", "Raises the learning rate", "Gives the rejected answers more weight than the chosen ones"],
      why: "The hidden reward is β × log(π / π_ref). With a large β a small shift in log-ratio already gives a confident ranking, so the loss is met with a small move. A small β pushes further from the reference." },
    { id: "reference", level: "hard", kind: "concept",
      q: "In DPO, what is the reference model usually?",
      answer: "A frozen copy of the SFT model that training starts from",
      wrong: ["The reward model from RLHF", "The base model before SFT", "A larger teacher model"],
      why: "DPO measures how much the policy's log-probabilities change relative to where it started. The policy and the reference begin equal, so the first loss is ln 2." },
    { id: "length", level: "hard", kind: "concept",
      q: "During RLHF, answers grow longer and longer without saying more. Most likely cause?",
      answer: "The reward model learned to favour length, and the policy is exploiting that",
      wrong: ["The KL penalty is too large", "The context window is too long", "The SFT data had no end tokens"],
      why: "If labelers tended to prefer longer answers, the reward model learns length as a shortcut, and the policy games it. Fixes include length-controlled rewards, a stronger KL term and better preference data." },
    { id: "bt", level: "easy", kind: "numeric",
      q: "A reward model scores the chosen answer 2.0 and the rejected one 0.0. What probability does it give the chosen answer of winning?",
      answer: r2(bt), wrong: [r2(1), r2(2 / 3), r2(0.5)],
      why: `P = σ(2.0 - 0.0) = 1 / (1 + e^-2) = ${r2(bt)}. Scores are not probabilities; only their difference, put through a sigmoid, is.` },
    { id: "start-loss", level: "medium", kind: "numeric",
      q: "DPO starts with the policy equal to the reference. What is the loss on every pair, to 2 decimals?",
      answer: r2(start), wrong: [r2(0), r2(1), r2(Math.log(10))],
      why: `Both log-ratios are 0, so the margin is 0 and σ(0) = 0.5. The loss is -ln 0.5 = ln 2 = ${r2(start)}. A first loss far from this means the setup is wrong.` },
    { id: "dpo-output", level: "hard", kind: "output",
      q: "One DPO loss, with β = 0.5. What does this print?",
      code: `import math\nbeta = ${OB}\nmargin = (${PIC} - (${REFC})) - (${PIR} - (${REFR}))\nloss = -math.log(1 / (1 + math.exp(-beta * margin)))\nprint(round(loss, 3))`,
      answer: String(+oLoss.toFixed(3)), wrong: [String(+(-Math.log(sigmoid(om))).toFixed(3)), String(+Math.log(2).toFixed(3)), String(+(-Math.log(sigmoid(-OB * om))).toFixed(3))],
      why: `Chosen log-ratio = ${PIC} - (${REFC}) = ${PIC - REFC}; rejected = ${PIR} - (${REFR}) = ${PIR - REFR}. Margin = ${om}, times β = ${OB * om}. Loss = -ln σ(${OB * om}) = ${oLoss.toFixed(3)}. Forgetting β gives ${(-Math.log(sigmoid(om))).toFixed(3)}.` },
    { id: "rlhf-steps", level: "medium", kind: "explain",
      q: "Walk through classic RLHF.",
      answer: "1. **SFT:** fine-tune the base model on demonstrations.\n2. **Collect preferences:** for many prompts, sample several answers and have people rank them.\n3. **Train a reward model** to score the preferred answer higher (Bradley-Terry loss).\n4. **RL with PPO:** the policy writes answers, the reward model scores them, and PPO raises the probability of high-scoring ones. A KL penalty to the SFT model keeps it from drifting and gaming the reward.\n\nIt needs four models in memory and careful tuning." },
    { id: "dpo-vs-ppo", level: "hard", kind: "explain",
      q: "DPO or PPO-based RLHF: how do you choose?",
      answer: "**DPO:** simpler, stable and cheap. Two models, no sampling, a loss much like SFT. A good default when you have a fixed set of preference pairs.\n\n**PPO RLHF:** learns online from the model's own fresh answers, so it can improve beyond the dataset, and the reward model can be reused. Harder to tune and needs much more memory.\n\nIn practice teams often run DPO first, and use online RL when they have a strong reward signal and the budget to tune it." },
    { id: "reward-hacking", level: "hard", kind: "explain",
      q: "What is reward hacking in RLHF, and how do you limit it?",
      answer: "The policy finds answers the reward model scores highly that people would not prefer: overly long answers, flattery, confident tone without substance. It happens because the reward model is only an approximation, and RL pushes hard on its weak spots.\n\nLimits: a KL penalty to the reference, early stopping when held-out human ratings stop improving, better and more varied preference data, length-controlled rewards, and refreshing the reward model on the policy's new answers." },
    { id: "trap-dpo-rm", level: "easy", kind: "trap",
      claim: "DPO needs a separately trained reward model.",
      truth: false,
      why: "That is the point of DPO: the policy's log-ratio against the reference acts as an implicit reward, so there is no reward model and no sampling loop." },
    { id: "trap-both-fall", level: "hard", kind: "trap",
      claim: "The DPO loss can fall even while the chosen answer's probability falls.",
      truth: true,
      why: "The loss only sees the margin between the two log-ratios. If the rejected answer's probability falls faster than the chosen one's, the margin grows and the loss drops, even though the chosen answer became less likely." },
    { id: "trap-knowledge", level: "medium", kind: "trap",
      claim: "Preference tuning is mainly how a model learns new facts.",
      truth: false,
      why: "Facts come mostly from pretraining. Preference tuning shapes which of the answers the model can already give it prefers: helpfulness, tone, honesty and refusals." },
  ],
  real: [
    { who: "Long Ouyang and co-authors", when: "2022",
      what: "InstructGPT fine-tuned GPT-3 on demonstrations, then with reinforcement learning from human feedback on rankings of model outputs. In human evaluations, outputs of the 1.3B InstructGPT were preferred to those of the 175B GPT-3.",
      takeaway: "Alignment with human preferences can matter more to users than 100 times more parameters.",
      url: "https://arxiv.org/abs/2203.02155" },
    { who: "Rafael Rafailov and co-authors", when: "2023",
      what: "Direct Preference Optimization (DPO) aligns a language model with human preferences using a simple classification loss, instead of reinforcement learning.",
      takeaway: "Much of what RLHF achieves can be had with a loss as simple to run as SFT.",
      url: "https://arxiv.org/abs/2305.18290" },
  ],
};
