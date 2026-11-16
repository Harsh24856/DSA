// Stage 5: LoRA and QLoRA. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { big, ftMemory } from "../../stages/s5.play.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const gb = (x: number) => (x < 10 ? `${x.toFixed(1)} GB` : `${Math.round(x)} GB`);

// numeric: one layer
const [D, R] = [4096, 8], full = D * D, low = 2 * D * R;
// compare and numeric: a 7B model, rank 16
const m7 = ftMemory(7, 16), adapterMB = (m7.T * 2) / 1e6;
// output: shape and rank of B @ A
const [OD, OR, OK] = [6, 2, 5];

export const LORA_QLORA: GModule = {
  id: "lora-qlora",
  stage: 5,
  title: "LoRA and QLoRA",
  hook: "Fine-tuning every weight of a big model needs a rack of GPUs. Freeze it, train two thin matrices beside each layer, and the same job fits on one card.",
  blocks: [
    { kind: "figure", id: "s5-lora", caption: "LoRA leaves the big matrix alone and learns its change as B times A. The product has the full shape, but B and A hold a tiny fraction of the numbers." },
    { kind: "flow", id: "g-lora" },
    { kind: "text", md: "**Why it works:** the change a fine-tune makes to a weight matrix tends to have low rank: a few directions matter. LoRA bets on that and learns the change as B (d × r) times A (r × d), with r small, often 8 to 64.\n\nB starts at zero, so the model starts exactly as the base. The update is scaled by α / r." },
    {
      kind: "predict",
      q: "B is set to all zeros and A to small random numbers. Before any training step, what does the LoRA layer output?",
      answer: "Exactly what the frozen base layer outputs",
      wrong: ["Random noise, because A is random", "All zeros", "The base output scaled by α / r"],
      why: "B × A = 0 when B is zero, so h = W x + 0. Training starts from the base model's known-good behaviour. Gradients still reach B, because they depend on A x, which is not zero.",
    },
    { kind: "lab", id: "lora" },
    { kind: "play", id: "s5-ft-memory" },
    {
      kind: "compare",
      head: [`7B model, r = 16`, "Full", "LoRA", "QLoRA"],
      rows: [
        ["Trained numbers", big(7e9), big(m7.T), big(m7.T)],
        ["Bytes per frozen weight", "none frozen", "2 (bf16)", "0.5 (4-bit)"],
        ["Memory before activations", gb(m7.full), gb(m7.lora), gb(m7.qlora)],
        ["What you save", "A whole model", `${n0(adapterMB)} MB adapter`, `${n0(adapterMB)} MB adapter`],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
d, r, alpha = 64, 4, 8
W = rng.normal(size=(d, d))              # frozen
A = rng.normal(size=(r, d)) * 0.01       # trainable
B = np.zeros((d, r))                     # trainable, starts at 0
x = rng.normal(size=d)

h = W @ x + (alpha / r) * B @ (A @ x)
print("equal to the base at step 0:", np.allclose(h, W @ x))

B = rng.normal(size=(d, r))              # pretend training moved B
delta = (alpha / r) * B @ A
print("rank of the update:", np.linalg.matrix_rank(delta), "of", d)
merged = W + delta                       # merge for serving: one matrix again
print("merged gives the same output:", np.allclose(merged @ x, W @ x + (alpha / r) * B @ (A @ x)))
print("trainable:", A.size + B.size, "against", W.size)
assert np.linalg.matrix_rank(delta) == r
`,
    },
  ],
  keyPoints: [
    "LoRA freezes the weight W and learns its change as B A, with B of size d × r and A of size r × d, r small.",
    "B starts at zero, so training starts from the base model; the update is scaled by α / r.",
    "Only the adapters need gradients and Adam state, so memory drops from about 16 bytes per parameter to about 2 for the frozen base.",
    "After training, B A can be merged into W for no extra latency, or kept apart so many adapters share one base.",
    "QLoRA stores the frozen base in 4-bit NF4 and trains 16-bit adapters on top, so large models fit on one GPU.",
  ],
  questions: [
    { id: "trained", level: "easy", kind: "concept",
      q: "In LoRA, which numbers are trained?",
      answer: "Only the small matrices A and B added beside chosen layers",
      wrong: ["Every weight in the model, at a lower learning rate", "Only the last layer", "Only the embedding table"],
      why: "The base weights stay frozen. Only A and B get gradients and optimiser state, usually well under 1% of the parameters." },
    { id: "low-rank", level: "medium", kind: "concept",
      q: "Why can a rank of 8 or 16 be enough for a fine-tune?",
      answer: "The change a task needs in each weight matrix tends to lie in a few directions",
      wrong: ["Because low rank makes the model run faster at inference", "Because the base weights already have rank 8", "Because larger ranks cannot be trained with Adam"],
      why: "LoRA assumes the update ΔW has low intrinsic rank. The base matrices are full rank; it is the change that is small. Harder domain shifts may need a higher rank." },
    { id: "alpha", level: "medium", kind: "concept",
      q: "LoRA scales the update by α / r. What is that scaling for?",
      answer: "It keeps the size of the update steady when you change r, so the learning rate need not be re-tuned",
      wrong: ["It sets how many layers get adapters", "It is the dropout rate of the adapters", "It sets the number of bits for the base weights"],
      why: "With more rank, B A has more terms and tends to grow. Dividing by r offsets that, and α sets the overall strength. A common choice is α = 2r." },
    { id: "merge", level: "medium", kind: "concept",
      q: "Why does a merged LoRA model run as fast as the base model?",
      answer: "W + (α / r) B A is computed once and stored as one matrix of the original shape",
      wrong: ["The adapters run on a separate GPU", "Merging deletes half the layers", "Merging converts the model to 4 bits"],
      why: "The sum has exactly W's shape, so inference does the same work as before. Keeping adapters apart costs a little extra compute but lets you swap them." },
    { id: "qlora", level: "easy", kind: "concept",
      q: "What does QLoRA add to LoRA?",
      answer: "The frozen base is stored in 4 bits, while the adapters train in 16-bit",
      wrong: ["The adapters are stored in 4 bits and the base in 16-bit", "It trains every weight, but in 4 bits", "It removes the B matrix"],
      why: "The frozen base is the largest part of memory, so 4-bit storage cuts it to a quarter of bf16. The weights are dequantised on the fly for each step, and gradients flow through them into the adapters." },
    { id: "multi-lora", level: "hard", kind: "concept",
      q: "You serve 50 customers, each with their own fine-tune of the same base. What is the cheapest setup?",
      answer: "One copy of the base in memory, with each customer's LoRA adapter applied per request",
      wrong: ["50 merged full models, one per customer", "One merged model with all 50 adapters added together", "Retrain one model on all 50 datasets each night"],
      why: "Adapters are small, so many fit beside one base. Merging all of them into one would mix their behaviours; 50 merged copies would need 50 times the memory." },
    { id: "params", level: "easy", kind: "numeric",
      q: `A ${D} × ${D} layer gets a LoRA adapter of rank ${R}. How many trainable numbers is that?`,
      answer: n0(low), wrong: [n0(D * R), n0(full), n0(D * R * R)],
      why: `A is ${R} × ${D} and B is ${D} × ${R}: 2 × ${D} × ${R} = ${n0(low)}. Counting only one of them gives ${n0(D * R)}.` },
    { id: "fraction", level: "medium", kind: "numeric",
      q: `What share of that ${D} × ${D} layer's size is the rank-${R} adapter?`,
      answer: `${((low / full) * 100).toFixed(2)}%`, wrong: [`${((R / D) * 100).toFixed(2)}%`, `${((low / full) * 1000).toFixed(2)}%`, "1.00%"],
      why: `${n0(low)} / ${n0(full)} = ${((low / full) * 100).toFixed(2)}%, which is 2r / d = ${2 * R} / ${D}.` },
    { id: "full-mem", level: "hard", kind: "numeric",
      q: "Full fine-tuning in mixed precision with Adam costs about 16 bytes per parameter before activations. How much memory for a 7B model?",
      answer: gb(m7.full), wrong: [gb(7 * 2), gb(7 * 4), gb(7 * 8)],
      why: `bf16 weight 2 + bf16 gradient 2 + Adam's two fp32 moments 8 + an fp32 master copy 4 = 16 bytes. 16 × 7B = ${gb(m7.full)}. ${gb(14)} is only the bf16 weights, enough to run the model but not to train it.` },
    { id: "rank-output", level: "medium", kind: "output",
      q: "B is 6 × 2 and A is 2 × 5, both random. What does this print?",
      code: `import numpy as np\nrng = np.random.default_rng(0)\nB = rng.normal(size=(${OD}, ${OR}))\nA = rng.normal(size=(${OR}, ${OK}))\nprint((B @ A).shape, np.linalg.matrix_rank(B @ A))`,
      answer: `(${OD}, ${OK}) ${OR}`, wrong: [`(${OD}, ${OK}) ${OK}`, `(${OR}, ${OR}) ${OR}`, `(${OD}, ${OK}) ${OD}`],
      why: `The product has the outer shape, ${OD} × ${OK}, but every column is a mix of B's ${OR} columns, so its rank is at most ${OR}. That is the whole idea of LoRA: a full-shape update with only rank r.` },
    { id: "how-lora", level: "medium", kind: "explain",
      q: "Explain how LoRA works and why it saves memory.",
      answer: "LoRA freezes each chosen weight matrix W and adds a trainable low-rank path: h = W x + (α / r) B A x, with A (r × d) and B (d × r), r small. B starts at zero so training begins at the base model.\n\nMemory falls because gradients and Adam state, which cost far more than the weights, exist only for A and B. The frozen W needs just its bf16 copy. The saved result is a small adapter file instead of a whole model, and it can be merged into W for serving." },
    { id: "lora-vs-full", level: "hard", kind: "explain",
      q: "When would you choose full fine-tuning over LoRA?",
      answer: "- **LoRA** by default: style, format, a narrow task, many tenants, little GPU memory. Quality is usually close to full fine-tuning on these.\n- **Full fine-tuning** when the shift is large (new language, heavy domain knowledge, continued pretraining), when you have lots of data and the budget, and when every last point of quality matters.\n- Middle ground: raise the rank and target the MLP layers as well as attention.\n\nEither way, compare on a held-out set rather than assuming." },
    { id: "qlora-tricks", level: "hard", kind: "explain",
      q: "What are the main ideas in QLoRA?",
      answer: "- **4-bit NormalFloat (NF4):** a 4-bit type designed for weights that follow a normal distribution, used for the frozen base.\n- **Double quantisation:** the per-block scaling constants are themselves quantised, saving more memory.\n- **Paged optimisers:** optimiser state can move between GPU and CPU memory to survive memory spikes.\n- **LoRA adapters in 16-bit** on top; the base is dequantised on the fly for each matrix multiply.\n\nThe paper reports fine-tuning a 65B model on a single 48 GB GPU while keeping 16-bit fine-tuning performance." },
    { id: "trap-latency", level: "medium", kind: "trap",
      claim: "A LoRA model is slower at inference than the base, even after the adapter is merged.",
      truth: false,
      why: "Merging adds B A into W once. The merged matrix has the original shape, so inference costs exactly the same." },
    { id: "trap-qlora-precision", level: "easy", kind: "trap",
      claim: "QLoRA keeps the frozen base in 4 bits but trains the adapters in higher precision.",
      truth: true,
      why: "Only storage of the frozen weights is 4-bit. The adapters and the compute use 16-bit, which is why quality stays close to 16-bit fine-tuning." },
    { id: "trap-rank", level: "medium", kind: "trap",
      claim: "A higher LoRA rank is always better.",
      truth: false,
      why: "Higher rank means more capacity but more memory and more risk of overfitting small data. For style and format tasks, ranks of 8 to 16 are usually enough." },
  ],
  real: [
    { who: "Edward J. Hu and co-authors", when: "2021",
      what: "The LoRA paper froze the pretrained weights and trained low-rank matrices in each Transformer layer. Compared with fine-tuning GPT-3 175B with Adam, it reported 10,000 times fewer trainable parameters and 3 times less GPU memory.",
      takeaway: "Most of the cost of fine-tuning is the optimiser state for weights you did not need to change.",
      url: "https://arxiv.org/abs/2106.09685" },
    { who: "Tim Dettmers and co-authors", when: "2023",
      what: "QLoRA fine-tuned a 65B model on a single 48 GB GPU while keeping 16-bit fine-tuning performance, using 4-bit NormalFloat, double quantisation and paged optimisers.",
      takeaway: "Quantising only the frozen part makes big-model fine-tuning possible on one card.",
      url: "https://arxiv.org/abs/2305.14314" },
  ],
};
