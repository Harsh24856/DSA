// Stage 10: diffusion and flow matching. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { cfg, cosineBar, eulerCurved, eulerStraight, linearBar, r2, T } from "../../stages/s10.calc.ts";
import { EULER } from "../../stages/s10.flows.ts";

const MID = 500, LS = Math.sqrt(linearBar(MID)), CS = Math.sqrt(cosineBar(MID));
// predict: one Euler step on a straight path
const { x1, data } = EULER, ONE_S = eulerStraight(x1, data, 1), ONE_C = eulerCurved(x1, data, 1);
// numeric: classifier-free guidance
const [GU, GC, GW] = [0.2, 0.5, 7], G = cfg(GU, GC, GW);
// numeric: signal at step 250
const Q = 250, QL = Math.sqrt(linearBar(Q));

export const DIFFUSION_FLOW: GModule = {
  id: "diffusion-flow",
  stage: 10,
  title: "Diffusion and flow matching",
  hook: "Image generators learn to undo noise. Training adds noise to real images and teaches a network to predict what was added; generation starts from pure noise and removes it step by step, guided by your prompt.",
  blocks: [
    { kind: "figure", id: "s10-noise-curves", caption: `The noise schedule decides how fast the image fades. At step ${MID} of ${T}, a linear schedule keeps ${r2(LS)} of the signal and a cosine schedule ${r2(CS)}.` },
    { kind: "text", md: "**Diffusion.** Forward: mix an image with Gaussian noise, x_t = sqrt(abar_t)·x₀ + sqrt(1 - abar_t)·ε, where abar_t shrinks from 1 to near 0 over the steps. The network learns to predict ε from x_t and t. Backward: start from noise and repeatedly remove the predicted noise.\n\n**Flow matching** learns a velocity that carries noise to data along a chosen path, often a straight line." },
    { kind: "lab", id: "noise" },
    { kind: "flow", id: "g-diffusion" },
    { kind: "play", id: "s10-noise" },
    {
      kind: "predict",
      q: `A flow-matching model has learned the straight path from noise ${x1} to the data point ${data} exactly. You sample with a single Euler step. Where do you land?`,
      answer: `Exactly at ${r2(ONE_S)}`, wrong: [`At ${r2(ONE_C)}, overshooting`, `Halfway, at ${r2((x1 + data) / 2)}`, `Back at ${x1}`],
      why: `On a straight path the velocity, ${r2(data - x1)} per unit of time, is the same everywhere, so one step of the full length lands on the target. A curved path with the same ends lands at ${r2(ONE_C)} in one step, because its speed changes along the way.`,
    },
    { kind: "flow", id: "s10-euler" },
    {
      kind: "compare",
      head: ["", "Diffusion (DDPM style)", "Flow matching"],
      rows: [
        ["Path from noise to data", "Set by the noise schedule, curved", "Chosen, often a straight line"],
        ["Network predicts", "The noise ε", "A velocity v = noise - data"],
        ["Sampling", "Many small denoising steps", "Integrate the velocity with an ODE solver, fewer steps"],
        ["Backbone today", "U-Net, then transformers", "Mostly diffusion transformers over latent patches"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
rng = np.random.default_rng(0)
x0 = rng.normal(size=4)                       # a "clean image" of 4 numbers
eps = rng.normal(size=4)

# diffusion: one jump to any step with a linear beta schedule
betas = np.linspace(1e-4, 0.02, 1000)
abar = np.cumprod(1 - betas)
t = 500
xt = np.sqrt(abar[t - 1]) * x0 + np.sqrt(1 - abar[t - 1]) * eps
print("signal left at t=500:", round(float(np.sqrt(abar[t - 1])), 2))

# flow matching: x_t = (1 - t) x0 + t eps, target velocity v = eps - x0
def path(t): return (1 - t) * x0 + t * eps
v = eps - x0
x = path(1.0) - 1.0 * v                       # one Euler step from t=1 back to t=0
print("one step error:", float(np.abs(x - x0).max()))
assert np.allclose(x, x0)                      # a straight path needs one step
`,
    },
    { kind: "text", md: `**Guidance.** Classifier-free guidance runs the model twice, with and without the prompt, and pushes further in the prompt's direction: ε = ε_uncond + w·(ε_cond - ε_uncond). With ε_uncond = ${GU}, ε_cond = ${GC} and w = ${GW}, the guided value is ${r2(G)}. Larger w follows the prompt more closely and gives less variety; too large looks harsh and oversaturated.` },
  ],
  keyPoints: [
    "Diffusion adds Gaussian noise to data by a schedule, and trains a network to predict that noise from the noisy input and the step.",
    "Generation runs backwards from pure noise; the schedule (linear, cosine) decides how fast the signal fades.",
    "Latent diffusion works in a small autoencoder latent space instead of pixels, which cuts compute a lot.",
    "Flow matching learns a velocity along a chosen path from noise to data; straight paths can be sampled in very few steps.",
    "Classifier-free guidance mixes predictions with and without the prompt; a higher weight follows the prompt more and varies less.",
  ],
  questions: [
    { id: "forward", level: "easy", kind: "concept",
      q: "In diffusion training, what does the forward process do?",
      answer: "Adds Gaussian noise to a real image, more at later steps",
      wrong: ["Removes noise from a random image", "Compresses the image to JPEG", "Draws the image stroke by stroke"],
      why: "Forward is fixed, with no learning: it makes noisy versions whose noise you know, so the network can be trained to predict it. The learned part runs backwards." },
    { id: "target", level: "medium", kind: "concept",
      q: "In a standard diffusion model, what is the network usually trained to predict?",
      answer: "The noise that was added to make x_t", wrong: ["The text prompt", "The next pixel in raster order", "The step number t"],
      why: "Given x_t and t, predict ε, with a squared error loss. Knowing ε gives an estimate of the clean image, so each sampling step can remove some of it." },
    { id: "latent", level: "easy", kind: "concept",
      q: "Why do most image generators run diffusion in a latent space?",
      answer: "The autoencoder's latents are far smaller than the pixels, so every step is much cheaper",
      wrong: ["Pixels cannot hold noise", "Latents make images larger", "The text encoder only understands latents"],
      why: "A pretrained autoencoder shrinks the image, then the decoder turns the final latent back into pixels. The latent diffusion paper reports a large cut in compute against pixel models." },
    { id: "velocity", level: "medium", kind: "concept",
      q: "On the straight path x_t = (1 - t)·x₀ + t·ε, what velocity does flow matching train the network to predict?",
      answer: "ε - x₀, the same at every point of the path", wrong: ["x₀ alone", "ε alone", "x_t divided by t"],
      why: "Differentiate the path in t: dx/dt = ε - x₀. It does not depend on t, which is what makes a straight path easy to follow with few steps." },
    { id: "cfg", level: "medium", kind: "concept",
      q: "What does classifier-free guidance need at sampling time?",
      answer: "Predictions from the same model with the prompt and without it",
      wrong: ["A separate image classifier", "A second, larger diffusion model", "Human feedback on each step"],
      why: "One model is trained with the prompt sometimes dropped, so it learns both. At sampling, the two predictions are combined to push towards the prompt." },
    { id: "dit", level: "hard", kind: "concept",
      q: "What did diffusion transformers (DiT) change in latent diffusion?",
      answer: "They replaced the U-Net with a transformer over latent patches, and quality improved with more compute",
      wrong: ["They removed the noise schedule", "They generate images one pixel at a time", "They replaced the autoencoder with a tokenizer of words"],
      why: "The DiT paper found that models with more forward-pass Gflops consistently reached lower FID. Transformers scale predictably, so image and video models moved to them." },
    { id: "few-steps", level: "hard", kind: "concept",
      q: "Why can rectified or straightened flows sample in very few steps?",
      answer: "Euler steps are exact along a straight line, so big steps no longer drift off the path",
      wrong: ["They use a smaller image size", "They skip the text encoder", "They remove the need for a network"],
      why: `A step follows the current velocity. If the path bends, a big step misses (${r2(ONE_C)} instead of ${data} in the example). If it is straight, one step lands. Rectifying again makes paths straighter.` },
    { id: "signal", level: "medium", kind: "numeric",
      q: `A linear schedule runs beta from 0.0001 to 0.02 over ${T} steps. What share of the image signal, sqrt(abar), is left at step ${Q}?`,
      answer: r2(QL), wrong: [r2(1 - Q / T), r2(Math.sqrt(1 - Q / T)), r2(QL ** 2)],
      why: `abar is the product of (1 - beta) over the first ${Q} steps: ${r2(QL ** 2)}, so sqrt(abar) = ${r2(QL)}. Mixing up abar and its square root, or assuming a straight fade, are common slips.` },
    { id: "guided", level: "easy", kind: "numeric",
      q: `Guidance weight w = ${GW}. The unconditional prediction is ${GU} and the conditional one is ${GC}. What is the guided value?`,
      answer: r2(G), wrong: [r2(GC), r2(GW * GC), r2((GU + GC) / 2)],
      why: `${GU} + ${GW} × (${GC} - ${GU}) = ${r2(G)}. Guidance extrapolates past the conditional prediction, which is why very large w goes outside what training saw.` },
    { id: "euler-out", level: "easy", kind: "output",
      q: "One Euler step along a straight path. What does this print?",
      code: `x1, data, steps = ${x1}, ${data}, 1\nx = x1\nfor _ in range(steps):\n    x -= (1 / steps) * (x1 - data)\nprint(round(x, 2))`,
      answer: String(Math.round(ONE_S * 100) / 100), wrong: [String(x1), String(Math.round(ONE_C * 100) / 100), "0.0"],
      why: `The velocity is ${r2(x1 - data)} towards the data at every point, and one full step covers all of it: ${x1} - ${r2(x1 - data)} = ${r2(ONE_S)}.` },
    { id: "explain-diff", level: "medium", kind: "explain",
      q: "Explain how a diffusion model generates an image from a prompt.",
      answer: "A text encoder turns the prompt into vectors. Generation starts from random noise in a small latent space. At each step the network, conditioned on the prompt and the step, predicts the noise (or a velocity), and the sampler removes part of it. Guidance compares predictions with and without the prompt and pushes towards the prompt.\n\nAfter tens of steps, or a few for distilled models, the autoencoder's decoder turns the final latent into pixels." },
    { id: "explain-fm", level: "hard", kind: "explain",
      q: "How does flow matching differ from classic diffusion, and why did many new models move to it?",
      answer: "Diffusion fixes a noising process and learns to predict the noise; its paths from noise to data are curved, so sampling needs many small steps.\n\nFlow matching picks the path, often a straight line between a noise sample and a data sample, and regresses a network onto the velocity along it. Training is simulation-free and stable, and straighter paths can be integrated in fewer steps. The paper reports better likelihood and samples than diffusion baselines on ImageNet." },
    { id: "explain-w", level: "medium", kind: "explain",
      q: "Images come out oversaturated with harsh colours at guidance 15. Why, and what do you do?",
      answer: "Guidance extrapolates: ε_uncond + w·(ε_cond - ε_uncond). With a large w the prediction lands far outside the range the model saw in training, so latents drift and colours blow out.\n\nLower w to the usual range for that model, and compare a few values on a fixed seed. If prompts are still ignored, improve the prompt or the model rather than pushing w." },
    { id: "trap-classifier", level: "easy", kind: "trap",
      claim: "Classifier-free guidance requires a separately trained image classifier.",
      truth: false,
      why: "That is classifier guidance. The classifier-free method trains one model both with and without the prompt and combines its two predictions." },
    { id: "trap-straight", level: "medium", kind: "trap",
      claim: "Nearly straight flows can give good images with a single Euler step.",
      truth: true,
      why: "The rectified flow paper reports high-quality results even with a single Euler step once paths are nearly straight." },
  ],
  real: [
    { who: "Jonathan Ho, Ajay Jain and Pieter Abbeel", when: "2020",
      what: "Denoising diffusion probabilistic models produced high-quality images, with an FID of 3.17 and an Inception score of 9.46 on unconditional CIFAR-10, and quality similar to ProgressiveGAN on 256 by 256 LSUN.",
      takeaway: "Learning to undo small amounts of noise turned out to be a strong way to generate images.",
      url: "https://arxiv.org/abs/2006.11239" },
    { who: "Robin Rombach and co-authors", when: "2021",
      what: "Latent diffusion trains diffusion in the latent space of pretrained autoencoders instead of pixels, significantly reducing the compute for training and sampling.",
      takeaway: "Moving to latents made high-resolution generation affordable.",
      url: "https://arxiv.org/abs/2112.10752" },
    { who: "Jonathan Ho and Tim Salimans", when: "2022",
      what: "Classifier-free guidance jointly trains a conditional and an unconditional diffusion model and combines their estimates, getting a quality and diversity trade-off like classifier guidance without a classifier.",
      takeaway: "One model, run twice, steers generation towards the prompt.",
      url: "https://arxiv.org/abs/2207.12598" },
    { who: "Yaron Lipman and co-authors", when: "2022",
      what: "Flow matching trains continuous normalizing flows without simulation, by regressing onto fixed paths from noise to data. Optimal transport paths trained and sampled faster than diffusion paths and gave better likelihood and samples on ImageNet.",
      takeaway: "Choosing a straighter path is a design lever, not a fixed property of the method.",
      url: "https://arxiv.org/abs/2210.02747" },
    { who: "Xingchao Liu, Chengyue Gong and Qiang Liu", when: "2022",
      what: "Rectified flow learns paths between two distributions and repeatedly straightens them. Nearly straight flows gave high-quality images even with a single Euler step.",
      takeaway: "Straight paths are what let flow models sample in a handful of steps.",
      url: "https://arxiv.org/abs/2209.03003" },
    { who: "William Peebles and Saining Xie", when: "2022",
      what: "Diffusion transformers replace the U-Net with a transformer on latent patches. More Gflops consistently gave lower FID, and DiT-XL/2 reached an FID of 2.27 on 256 by 256 ImageNet.",
      takeaway: "Image generators now scale like language models.",
      url: "https://arxiv.org/abs/2212.09748" },
  ],
};
