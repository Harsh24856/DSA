// Stage 5: SFT and chat templates. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { CHAT, END, tag, toks } from "../../stages/s5.flows.ts";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const n0 = (x: number) => x.toLocaleString("en-US");

// predict: the label that hides a token from the loss
const IGNORE = -100;
// numeric: share of tokens in the loss
const [SEQ, PROMPT] = [120, 90], ANS = SEQ - PROMPT;
// numeric: optimiser steps
const [EX, BS, ACC, EP] = [10_000, 16, 4, 3], eff = BS * ACC, steps = Math.ceil(EX / eff) * EP;
// output: masked mean of per-token losses
const NLL = [2.0, 1.0, 0.5, 0.5], MASK = [0, 0, 1, 1];
const masked = NLL.reduce((s, x, i) => s + x * MASK[i], 0) / MASK.reduce((a, b) => a + b, 0);
// figure and text: the example chat
const rendered = CHAT.map(([r, c]) => `${tag(r)} ${c} ${END}`).join(" ");
const answerToks = toks(CHAT[2][1]).length + 1;

export const SFT_CHAT_TEMPLATES: GModule = {
  id: "sft-chat-templates",
  stage: 5,
  title: "SFT and chat templates",
  hook: "A base model only continues text. Show it a few thousand good conversations, train only on the answers, and it starts behaving like an assistant.",
  blocks: [
    { kind: "figure", id: "s5-loss-mask", caption: "The template turns a chat into one token sequence. Prompt tokens are labelled -100 and skipped by the loss. Only the answer and its end token teach the model." },
    { kind: "text", md: "**Supervised fine-tuning (SFT)** continues training a base model on examples of the behaviour you want: a prompt and an ideal reply.\n\nThe loss is the same next-token cross-entropy as pretraining. Two things change: the data is far smaller and cleaner, and the loss counts only the reply tokens." },
    { kind: "flow", id: "s5-chat-template" },
    {
      kind: "predict",
      q: `In SFT, the user's tokens get the label ${IGNORE}. What does that do?`,
      answer: "The loss skips them, so the model is never trained to write user turns",
      wrong: ["It makes the model predict those tokens with extra weight", "It removes those tokens from the input, so the model cannot read them", `It trains the model to output the number ${IGNORE}`],
      why: `${IGNORE} is the conventional ignore index for cross-entropy. The model still reads the prompt as input; it just gets no gradient for predicting it. Here ${answerToks} of the tokens are trained.`,
    },
    { kind: "play", id: "s5-packing" },
    {
      kind: "compare",
      head: ["Mistake", "Symptom"],
      rows: [
        ["Serve with a different template than training", "Rambling replies, role words leak into the text"],
        [`${END} never trained`, "The model never stops and writes the next user turn itself"],
        ["Loss on prompt tokens too", "It learns to imitate users and system prompts"],
        ["Too many epochs on small data", "Memorised replies, weaker general skill"],
        ["Examples all in one style", "It ignores instructions that ask for anything else"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

chat = [("system", "Be brief."), ("user", "Capital of Japan?"), ("assistant", "Tokyo.")]
tokens, train = [], []
for role, text in chat:
    piece = [f"<|{role}|>"] + text.split() + ["<|end|>"]
    tokens += piece
    # train the answer and its end token, never the role header
    train += [False] + [role == "assistant"] * (len(piece) - 1)
train = np.array(train)
print(" ".join(tokens))
print("trained:", [t for t, m in zip(tokens, train) if m])

# made-up per-token losses from a model; the SFT loss averages only the trained ones
nll = np.linspace(3.0, 0.4, len(tokens))
print("SFT loss:", round(float(nll[train].mean()), 3), "over", int(train.sum()), "of", len(tokens), "tokens")
assert train.sum() == 2
`,
    },
    { kind: "text", md: `**The template is part of the model.** The rendered chat above is \`${rendered}\`. A fine-tuned model has learned its own exact markers, so the serving code must render chats the same way.\n\nLibraries store the template with the tokenizer, so \`apply_chat_template\` in Hugging Face Transformers renders it for you.` },
  ],
  keyPoints: [
    "SFT trains a base model on prompt and ideal-reply pairs with the usual next-token cross-entropy.",
    "Prompt tokens get the ignore label (-100), so only the reply and its end token produce gradient.",
    "A chat template wraps each turn in role and end tokens; training and serving must use the same one.",
    "Training the end token is what teaches the model to stop.",
    "Quality and variety of examples matter more than count; too many epochs on small data cause memorising and forgetting.",
  ],
  questions: [
    { id: "sft-data", level: "easy", kind: "concept",
      q: "What does an SFT training example contain?",
      answer: "A prompt and an ideal reply, written or checked by people or a strong model",
      wrong: ["A prompt with two replies and which one people preferred", "Raw web text with no structure", "A prompt and a numeric score for the reply"],
      why: "SFT imitates demonstrations. Two replies with a preference is the data for preference tuning (RLHF or DPO). A score per reply is a reward, used in RL." },
    { id: "why-mask", level: "easy", kind: "concept",
      q: "Why is the loss usually computed only on the assistant's tokens?",
      answer: "So the model learns to write replies, not to predict what users and system prompts say",
      wrong: ["Because prompt tokens cannot be tokenised", "To make each training step use less memory", "Because the attention mask hides the prompt from the model"],
      why: "The prompt is still fed in and attended to. Masking only removes it from the loss, so the gradient comes from replies. Training on prompts too wastes capacity on imitating users." },
    { id: "never-stops", level: "medium", kind: "concept",
      q: "After SFT, the model answers well but never stops and starts writing the next user turn. Most likely cause?",
      answer: `The end-of-turn token was masked out or missing in the training labels`,
      wrong: ["The learning rate was too low", "The context window is too short", "The model needs a larger vocabulary"],
      why: `The model learns to emit ${END} only if that token is in the trained labels at the end of each reply. Without it, nothing teaches it where a reply ends.` },
    { id: "template-mismatch", level: "medium", kind: "concept",
      q: "A model was fine-tuned with one chat template and is served with another that uses different role markers. What happens?",
      answer: "Quality drops: it sees markers it was not trained on and may ramble or leak role text",
      wrong: ["Nothing; the model reads the words, not the markers", "The server refuses to load the model", "It works better, because it sees more variety"],
      why: "The special tokens are the model's cue for who is speaking and when to stop. Change them and the model is out of its training distribution." },
    { id: "new-tokens", level: "hard", kind: "concept",
      q: "You add new special tokens for roles before SFT. What else must you do?",
      answer: "Resize the embedding and output layers and let those new rows train",
      wrong: ["Nothing; new tokens reuse the embedding of the unknown token", "Retrain the tokenizer from scratch on the SFT data", "Freeze the new rows so they keep their random start"],
      why: "Each new token needs a row in the input embedding matrix and in the output layer. They start random or as an average, and must be trained, or the model cannot read or write them well." },
    { id: "forgetting", level: "hard", kind: "concept",
      q: "After SFT on a narrow task, the model got worse at general questions. Which change helps most?",
      answer: "Mix in general instruction data, lower the learning rate or use fewer epochs",
      wrong: ["Train for more epochs on the narrow data", "Raise the learning rate so it learns faster", "Remove the end token from the labels"],
      why: "This is catastrophic forgetting: the weights drift toward the narrow task. Keeping some general data, smaller updates and fewer passes limit the drift. LoRA also helps, since the base weights stay frozen." },
    { id: "loss-share", level: "easy", kind: "numeric",
      q: `A training sequence has ${SEQ} tokens; the prompt is ${PROMPT} of them. What share of tokens counts in the SFT loss?`,
      answer: pct(ANS / SEQ), wrong: [pct(PROMPT / SEQ), "100%", pct(ANS / PROMPT)],
      why: `Only the ${ANS} reply tokens are trained: ${ANS} / ${SEQ} = ${pct(ANS / SEQ)}. ${pct(ANS / PROMPT)} divides by the prompt, not the whole sequence.` },
    { id: "steps", level: "medium", kind: "numeric",
      q: `${n0(EX)} examples, batch size ${BS}, gradient accumulation ${ACC}, ${EP} epochs. How many optimiser steps?`,
      answer: n0(steps), wrong: [n0(Math.ceil(EX / BS) * EP), n0(Math.ceil(EX / eff)), n0(Math.ceil(EX / BS / ACC / EP))],
      why: `Accumulation sums ${ACC} batches before one update, so the effective batch is ${BS} × ${ACC} = ${eff}. Steps per epoch = ceil(${n0(EX)} / ${eff}) = ${Math.ceil(EX / eff)}, times ${EP} epochs = ${n0(steps)}.` },
    { id: "masked-mean", level: "medium", kind: "output",
      q: "Per-token losses and a mask that keeps only the reply. What does this print?",
      code: `import numpy as np\nnll = np.array([${NLL.map((x) => x.toFixed(1)).join(", ")}])\nmask = np.array([${MASK.join(", ")}])\nprint((nll * mask).sum() / mask.sum())`,
      answer: String(masked), wrong: [(NLL.reduce((a, b) => a + b, 0) / NLL.length).toFixed(1), String(masked * 2 / NLL.length), "2.0"],
      why: `Masked tokens add 0, and the sum is divided by the number of kept tokens, ${MASK.reduce((a, b) => a + b, 0)}: (0.5 + 0.5) / 2 = ${masked}. Dividing by all ${NLL.length} tokens would shrink the loss and the gradient.` },
    { id: "what-template", level: "easy", kind: "explain",
      q: "What is a chat template and why does it matter?",
      answer: "A chat template is the rule that turns a list of messages (system, user, assistant) into one token sequence, with special tokens marking each role and the end of each turn.\n\nIt matters because the model learns these markers during SFT. They tell it who is speaking, where its reply starts and when to stop. Serving with a different template, or a missing marker, puts the model out of distribution and quality drops. The template ships with the tokenizer so both sides match." },
    { id: "sft-vs-pretrain", level: "medium", kind: "explain",
      q: "How does SFT differ from pretraining?",
      answer: "- **Same loss:** next-token cross-entropy.\n- **Data:** thousands to millions of curated conversations instead of trillions of raw tokens.\n- **Masking:** loss only on reply tokens, not on the whole text.\n- **Format:** chats rendered with a template and special tokens.\n- **Goal:** teach behaviour and format (follow instructions, answer, stop), not broad knowledge, which comes from pretraining.\n- **Settings:** a smaller learning rate and few epochs, to avoid forgetting." },
    { id: "dataset", level: "hard", kind: "explain",
      q: "How would you build an SFT dataset for a customer-support assistant?",
      answer: "1. **Collect** real tickets and the best agent replies; remove personal data.\n2. **Cover** the spread: common and rare intents, angry users, questions that should be refused or handed to a person.\n3. **Write or generate** extra examples with a strong model, then review a sample by hand.\n4. **Format** as messages with the target model's chat template; include the system prompt you will serve with.\n5. **Clean:** deduplicate, fix wrong answers, keep replies in one consistent style.\n6. **Split** off a held-out set (often 10 to 20%) and evaluate on it, plus a general set to catch forgetting." },
    { id: "trap-facts", level: "medium", kind: "trap",
      claim: "SFT is the most reliable way to give a model a large body of facts that change every week.",
      truth: false,
      why: "SFT is good at behaviour and format but stores new facts unreliably, and every change means retraining. Retrieval (RAG) handles changing facts, with citations." },
    { id: "trap-same-loss", level: "easy", kind: "trap",
      claim: "SFT uses the same next-token cross-entropy loss as pretraining.",
      truth: true,
      why: "The objective does not change. What changes is the data (curated chats) and the mask that limits the loss to reply tokens." },
    { id: "trap-packing", level: "hard", kind: "trap",
      claim: "Packing several short examples into one row needs no change to attention.",
      truth: false,
      why: "With a plain causal mask, a later example could attend to an earlier, unrelated one. Packed training uses a block mask (and restarts positions) so each example sees only itself." },
  ],
  real: [
    { who: "Long Ouyang and co-authors", when: "2022",
      what: "To make InstructGPT, the team first fine-tuned GPT-3 on demonstrations of the desired behaviour written by labelers, then tuned it further with reinforcement learning from human feedback.",
      takeaway: "Supervised fine-tuning on demonstrations is the first step from a base model to an assistant.",
      url: "https://arxiv.org/abs/2203.02155" },
  ],
};
