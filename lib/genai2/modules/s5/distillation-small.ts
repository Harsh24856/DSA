// Stage 5: Distillation and small models. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { softmaxT } from "../../stages/s5.flows.ts";

const r2 = (x: number) => x.toFixed(2);

// predict: a very high temperature over 5 classes
const K = 5;
// numeric: softmax of [2, 0] at T = 2
const two = softmaxT([2, 0], 2), one = softmaxT([2, 0], 1);
// numeric: serving cost ratio, 2N FLOPs per token
const [BIG, SMALL] = [70, 7];
// output: near-uniform at T = 100
const Z = [1, 2, 3];
const nearUniform = softmaxT(Z, 100).map(r2);
// trap and text: gradient of the soft loss shrinks like 1 / T^2
const TT = 4;

export const DISTILLATION_SMALL: GModule = {
  id: "distillation-small",
  stage: 5,
  title: "Distillation and small models",
  hook: "A huge model knows more than its top answer says. Let a small model copy how the big one spreads its bets, and the small one learns faster and better than from labels alone.",
  blocks: [
    { kind: "figure", id: "s5-soft-targets", caption: "The true label says only \"cat\". The teacher at T = 4 also says a dog or a fox is a closer miss than a cup. That ranking of wrong answers is the extra signal the student learns from." },
    { kind: "text", md: "**Distillation** trains a small **student** to match a big **teacher**. With logit distillation, the student matches the teacher's whole probability spread over the vocabulary at each step. With sequence-level distillation, the student is simply fine-tuned on text the teacher wrote.\n\nA temperature T above 1 softens both spreads so the small probabilities, the teacher's \"dark knowledge\", carry weight." },
    { kind: "flow", id: "s5-distill" },
    {
      kind: "predict",
      q: `A teacher scores ${K} classes. You raise the temperature to a huge value, such as 1,000. What does its softened distribution look like?`,
      answer: `About ${r2(1 / K)} on every class`,
      wrong: ["1.00 on the top class, 0 elsewhere", "The same as at T = 1", "It becomes undefined"],
      why: `Dividing the logits by a huge T makes them all close to 0, and e^0 = 1 for every class, so each gets 1 / ${K} = ${r2(1 / K)}. Too high a T throws away the teacher's ranking; T near 1 hides the small probabilities. A moderate T is the useful middle.`,
    },
    { kind: "play", id: "s5-temperature" },
    {
      kind: "compare",
      head: ["Method", "What changes", "Needs"],
      rows: [
        ["Logit distillation", "Student matches the teacher's probabilities", "Teacher logits, same tokenizer"],
        ["Sequence-level", "Student is fine-tuned on teacher-written answers", "Only the teacher's text"],
        ["Pruning", "Remove weights, heads or layers, then retrain a little", "The model itself"],
        ["Quantisation", "Store weights in fewer bits", "The model itself, maybe some data"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def softmax(z, T=1.0):
    e = np.exp((z - z.max()) / T)
    return e / e.sum()

def kd_loss(z_teacher, z_student, label, T=2.0, alpha=0.5):
    p, q = softmax(z_teacher, T), softmax(z_student, T)
    soft = np.sum(p * np.log(p / q)) * T * T        # KL(teacher || student), times T^2
    hard = -np.log(softmax(z_student)[label])      # usual loss on the true label
    return alpha * soft + (1 - alpha) * hard

teacher = np.array([4.0, 2.0, 0.0])                 # cat, dog, car
student = np.array([3.0, 1.0, 1.0])
print("loss:", round(float(kd_loss(teacher, student, 0)), 3))
print("loss if the student copies the teacher:", round(float(kd_loss(teacher, teacher, 0)), 3))
assert kd_loss(teacher, teacher, 0) < kd_loss(teacher, student, 0)
`,
    },
  ],
  keyPoints: [
    "Distillation trains a small student to match a big teacher's outputs instead of, or as well as, the true labels.",
    "Soft targets carry more information than one-hot labels: they rank the wrong answers, which shows what is similar to what.",
    "A temperature T > 1 softens both distributions; the soft loss is KL(teacher || student) multiplied by T² so its gradients keep their size.",
    "Logit distillation needs the teacher's probabilities and a shared vocabulary; sequence-level distillation only needs text the teacher wrote.",
    "Small models are cheaper and faster to serve; distillation, pruning and quantisation are the main ways to get there.",
  ],
  questions: [
    { id: "kd-what", level: "easy", kind: "concept",
      q: "In knowledge distillation, what does the student learn from?",
      answer: "The teacher's output distributions, often mixed with the true labels",
      wrong: ["The teacher's weights, copied layer by layer", "Only the true labels, like normal training", "The teacher's gradients"],
      why: "The student is trained to produce the same outputs as the teacher. It can be a different shape and size, so weights cannot simply be copied." },
    { id: "soft-why", level: "medium", kind: "concept",
      q: "Why do soft targets teach more than one-hot labels?",
      answer: "They show how the teacher ranks the wrong answers, which reveals what is similar to what",
      wrong: ["They make the loss smaller, so training is faster", "They remove the need for a learning rate", "They stop the student from overfitting by adding noise"],
      why: "A label says only \"cat\". The teacher's spread says \"cat, but dog is a closer miss than car\". That extra structure per example is often called dark knowledge." },
    { id: "t-squared", level: "hard", kind: "concept",
      q: "Why is the soft loss multiplied by T²?",
      answer: "Softening by T shrinks its gradients by about 1 / T², so T² restores their size against the hard loss",
      wrong: ["To make the loss always positive", "Because KL divergence is defined with a T² factor", "To make the student's probabilities sum to 1"],
      why: `The gradient of the soft loss with respect to the student's logits scales like 1 / T². At T = ${TT} it would be about ${TT * TT} times weaker without the factor, and the hard-label loss would dominate.` },
    { id: "seq-level", level: "medium", kind: "concept",
      q: "You can only reach a big model through an API that returns text. Which kind of distillation can you do?",
      answer: "Sequence-level: fine-tune the small model on answers the big model writes",
      wrong: ["Logit distillation over the full vocabulary", "Copying the big model's attention maps", "Layer-by-layer feature matching"],
      why: "Without its probabilities or internals, the teacher's text is all you have. Generating many answers and running SFT on them is how many small instruction and reasoning models are made. Check the provider's terms first." },
    { id: "small-why", level: "easy", kind: "concept",
      q: "Why ship a small distilled model instead of the big teacher?",
      answer: "It is cheaper and faster per request, and can run on smaller hardware or on a device",
      wrong: ["It always scores higher on every benchmark", "It never makes mistakes the teacher would not make", "It needs no evaluation before release"],
      why: "Serving cost grows with model size. A student that keeps most of the teacher's quality on your task can cut cost and latency a lot, but it must still be evaluated." },
    { id: "tokenizer", level: "hard", kind: "concept",
      q: "Why does token-level logit distillation between two LLMs usually need them to share a tokenizer?",
      answer: "The loss compares their probabilities token by token over one vocabulary, so the tokens must mean the same thing",
      wrong: ["Because the two models must have the same number of layers", "Because the student copies the teacher's embedding matrix", "Because KL divergence only works on 2 classes"],
      why: "KL(p || q) needs p and q over the same outcomes. With different tokenizers the next-token distributions are over different sets, and the positions do not line up. Sequence-level distillation avoids this." },
    { id: "softmax-t", level: "medium", kind: "numeric",
      q: "A teacher's logits for two classes are [2, 0]. What is the top class's probability at T = 2, to 2 decimals?",
      answer: r2(two[0]), wrong: [r2(one[0]), r2(0.5), r2(1)],
      why: `Divide by T first: [1, 0]. Softmax gives e^1 / (e^1 + 1) = ${r2(two[0])}. At T = 1 it would be ${r2(one[0])}: a higher T moves probability toward the other class.` },
    { id: "serve-ratio", level: "easy", kind: "numeric",
      q: `A forward pass costs about 2N FLOPs per token. How many times cheaper per token is a ${SMALL}B student than a ${BIG}B teacher?`,
      answer: `${BIG / SMALL}x`, wrong: [`${(BIG / SMALL) ** 2}x`, `${BIG - SMALL}x`, "2x"],
      why: `Cost is linear in N: 2 × ${BIG}B / (2 × ${SMALL}B) = ${BIG / SMALL}. Memory for the weights shrinks by the same factor.` },
    { id: "uniform-output", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nz = np.array([${Z.map((x) => x.toFixed(1)).join(", ")}])\np = np.exp(z / 100)\nprint(np.round(p / p.sum(), 2))`,
      answer: `[${nearUniform.join(" ")}]`, wrong: ["[0.09 0.24 0.67]", "[0.33 0.33 0.33]", "[0.01 0.02 0.03]"],
      why: `At T = 100 the logits become 0.01, 0.02 and 0.03, nearly equal, so the probabilities are all close to 1/3. At T = 1 they would be 0.09, 0.24, 0.67. Rounding gives ${nearUniform.join(", ")}, not three equal values.` },
    { id: "explain-kd", level: "medium", kind: "explain",
      q: "Explain knowledge distillation and its loss.",
      answer: "A large teacher is trained first. A smaller student is then trained on a mix of two losses:\n\n- **Soft loss:** KL divergence between the teacher's and the student's probabilities, both softened with temperature T, multiplied by T².\n- **Hard loss:** the usual cross-entropy on the true label.\n\nTotal = α × soft + (1 - α) × hard. The soft targets carry the teacher's view of which wrong answers are close, so the student learns more per example than from labels alone." },
    { id: "small-reasoning", level: "hard", kind: "explain",
      q: "How are small reasoning models often made from a big one?",
      answer: "1. Train or take a strong reasoning model, for example one trained with RL on checkable tasks.\n2. Have it solve many problems and write out its reasoning.\n3. Keep only traces whose final answers are verified right.\n4. Fine-tune a small model on those traces (sequence-level distillation, plain SFT).\n5. Optionally run RL on the small model afterwards.\n\nCopying good reasoning is far cheaper for a small model than discovering it with RL from scratch." },
    { id: "compress-compare", level: "medium", kind: "explain",
      q: "Distillation, pruning and quantisation all make models cheaper. How do they differ?",
      answer: "- **Distillation** trains a new, smaller model to imitate a big one. Needs training compute and data, gives a different architecture.\n- **Pruning** removes parts of the existing model (weights, heads, layers), usually followed by a little retraining.\n- **Quantisation** keeps the same model but stores weights, and sometimes activations, in fewer bits.\n\nThey stack: a distilled student can be pruned and quantised as well." },
    { id: "trap-flatter", level: "easy", kind: "trap",
      claim: "A higher temperature makes the teacher's distribution flatter.",
      truth: true,
      why: "Dividing the logits by a larger T shrinks the gaps between them, so the probabilities move toward equal. T below 1 does the opposite." },
    { id: "trap-seq-logits", level: "medium", kind: "trap",
      claim: "Sequence-level distillation needs the teacher's logits.",
      truth: false,
      why: "It only needs the text the teacher generates; the student is fine-tuned on it like any SFT data. Logit distillation is the kind that needs probabilities." },
    { id: "trap-same", level: "medium", kind: "trap",
      claim: "Distillation and quantisation are two names for the same thing.",
      truth: false,
      why: "Quantisation stores the same model in fewer bits. Distillation trains a different, smaller model to copy the big one's behaviour." },
  ],
  real: [
    { who: "Geoffrey Hinton, Oriol Vinyals and Jeff Dean", when: "2015",
      what: "\"Distilling the Knowledge in a Neural Network\" built on earlier work showing that the knowledge in an ensemble of models can be compressed into a single model, and developed that compression further.",
      takeaway: "A big model's outputs are a richer training signal than labels alone.",
      url: "https://arxiv.org/abs/1503.02531" },
    { who: "Victor Sanh and co-authors", when: "2019",
      what: "DistilBERT used distillation during pretraining to make a BERT model 40% smaller while keeping 97% of its language understanding, and 60% faster.",
      takeaway: "Most of a big model's skill can survive in a much smaller one.",
      url: "https://arxiv.org/abs/1910.01108" },
    { who: "DeepSeek-AI", when: "2025",
      what: "The DeepSeek-R1 paper reported that the reasoning patterns of its large RL-trained models can be used to guide and improve the reasoning of smaller models.",
      takeaway: "Expensive RL can be done once on a big model, then passed down to small ones.",
      url: "https://arxiv.org/abs/2501.12948" },
  ],
};
