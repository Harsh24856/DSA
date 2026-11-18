// Stage 10: video and world models. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { CLIP_FIG, n0, pct, rollout, VID, videoTokens } from "../../stages/s10.calc.ts";

const { seconds, fps, w, h } = CLIP_FIG, V = videoTokens(seconds, fps, w, h), V2 = videoTokens(seconds * 2, fps, w, h);
const PAIRS = V.tokens ** 2, PAIRS2 = V2.tokens ** 2;
// numeric: frames to tokens for a small clip
const [OF, OS] = [48, 512], OT = Math.ceil(OF / VID.time) * (OS / (VID.space * VID.patch)) ** 2;
// numeric and trap: drift over a rollout
const [Q, RN] = [0.99, 100], ROLL = rollout(Q, RN);

export const VIDEO_WORLD: GModule = {
  id: "video-world",
  stage: 10,
  title: "Video and world models",
  hook: "A video model is an image model that must also keep things consistent over time. Let it take actions as input, and it becomes a world model: a simulator you can steer, where agents can practise before touching the real world.",
  blocks: [
    { kind: "figure", id: "s10-spacetime", caption: `A ${seconds} second clip becomes a stack of latent frames, each cut into patches: ${n0(V.tokens)} tokens that one transformer denoises together.` },
    { kind: "text", md: "**From images to video.** Video generators extend image diffusion along time. A video autoencoder compresses space and time, the clip is cut into spacetime patches, and a diffusion transformer denoises all of them at once. Attending across frames is what keeps a face the same face and a ball on its path. Training on images and video together helps." },
    { kind: "flow", id: "s10-video-tokens" },
    {
      kind: "predict",
      q: `You double the clip from ${seconds} to ${seconds * 2} seconds at the same size. What happens to the attention score pairs per layer?`,
      answer: `About ${Math.round(PAIRS2 / PAIRS)} times as many`, wrong: [`About ${Math.round(V2.tokens / V.tokens)} times as many`, "The same", `About ${Math.round(PAIRS2 / PAIRS) * 2} times as many`],
      why: `Tokens double, ${n0(V.tokens)} to ${n0(V2.tokens)}, and full attention pairs every token with every other: ${Math.round(PAIRS2 / PAIRS)} times the pairs, at every denoising step. Long video is made in overlapping chunks for this reason.`,
    },
    { kind: "play", id: "s10-video" },
    { kind: "flow", id: "s10-world" },
    {
      kind: "compare",
      head: ["", "Video generator", "World model"],
      rows: [
        ["Input", "A prompt, maybe a first frame", "Past frames plus an action at each step"],
        ["Output", "A whole clip", "The next frame, again and again"],
        ["Generation", "Usually all frames denoised together", "Usually one step at a time, fed back"],
        ["Used for", "Media, ads, previews", "Training and testing agents, robots, games"],
        ["Main failure", "Physics that looks wrong", "Drift as errors feed back over long rollouts"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
# A world model rolled out on its own predictions: small errors feed back.
rng = np.random.default_rng(0)
true_v, steps = 1.0, 100
pos_true, pos_model, v_model = 0.0, 0.0, 1.0
gaps = []
for t in range(steps):
    pos_true += true_v
    v_model += rng.normal(0, 0.01)        # each prediction is a little off
    pos_model += v_model                   # and the next one builds on it
    gaps.append(abs(pos_model - pos_true))
print("gap after 10 steps:", round(gaps[9], 2), " after 100:", round(gaps[-1], 2))
assert gaps[-1] > gaps[9]                  # error compounds with rollout length
`,
    },
    { kind: "text", md: `**Drift.** A world model reads frames it made itself, so mistakes compound. If each step stays faithful with chance ${Q}, all ${RN} steps do only ${pct(ROLL)} of the time. Fixes: train on the model's own rollouts, keep a memory of the scene, re-anchor on real observations, and keep rollouts short when accuracy matters.` },
  ],
  keyPoints: [
    "Video generation extends image diffusion in time: compress the clip, cut spacetime patches, and denoise them together with one transformer.",
    "Tokens grow with length, frame rate and resolution, and full attention with their square, so video is the most expensive thing to generate.",
    "Attention across frames keeps objects and motion consistent; training on images and video together helps.",
    "A world model predicts the next frame from past frames and an action, so agents can practise inside it.",
    "Rolled out on its own output, a world model drifts as errors compound; long rollouts need re-anchoring.",
  ],
  questions: [
    { id: "compress", level: "easy", kind: "concept",
      q: "Why do video models compress time as well as space before the transformer?",
      answer: "Neighbouring frames are nearly the same, so many frames fit in fewer latents with little loss",
      wrong: ["Transformers cannot handle more than one frame", "To make the video play faster", "Because colour must be removed first"],
      why: `At ${fps} frames a second, consecutive frames differ only slightly. Squeezing time ${VID.time} times turns ${V.frames} frames into ${V.lat} latent frames, a ${VID.time} times saving before attention.` },
    { id: "together", level: "medium", kind: "concept",
      q: "Why denoise all frames of a clip together instead of making each frame on its own?",
      answer: "Attention across frames keeps objects, lighting and motion consistent over time",
      wrong: ["It needs fewer tokens", "Frames on their own cannot be decoded", "It removes the need for a prompt"],
      why: "Frames made independently flicker: a shirt changes colour, a hand changes shape. Joint denoising lets every patch see the same object in other frames." },
    { id: "world", level: "easy", kind: "concept",
      q: "What makes a model a world model rather than a plain video generator?",
      answer: "It predicts what happens next given an action, so it can be steered step by step",
      wrong: ["It makes longer videos", "It uses a bigger autoencoder", "It only generates landscapes"],
      why: "The action input is the point. An agent can choose actions and see their outcomes inside the model, like a learned simulator." },
    { id: "latent-actions", level: "hard", kind: "concept",
      q: "Genie learned controllable worlds from internet video with no action labels. How can it know about actions?",
      answer: "It learns a small set of latent actions that explain the change between frames",
      wrong: ["It reads key presses from video captions", "It asks a person to label each frame", "It assumes every video is a game with arrow keys"],
      why: "A latent action model infers a discrete code for what changed between consecutive frames. At play time, a user picks those codes as controls." },
    { id: "drift", level: "medium", kind: "concept",
      q: "A world model looks fine for 2 seconds, then the scene slowly melts. Why?",
      answer: "It is fed its own predictions, so small errors compound over the rollout",
      wrong: ["The GPU overheats", "The prompt runs out", "The autoencoder only supports 2 seconds"],
      why: `Each step builds on the last one's output. With ${Q} chance of staying faithful per step, ${RN} steps stay faithful only ${pct(ROLL)} of the time.` },
    { id: "joint", level: "medium", kind: "concept",
      q: "Why train a video diffusion model on still images as well as videos?",
      answer: "Images add variety and, per the video diffusion paper, lower gradient variance and speed up training",
      wrong: ["Images teach the model motion", "Videos alone cannot be decoded", "Images make the model generate faster at test time"],
      why: "Still images are far more plentiful and varied than video. Treating them as one-frame clips lets the same network learn appearance from them and motion from video." },
    { id: "tokens", level: "medium", kind: "numeric",
      q: `A ${seconds} s, ${w} × ${h} clip at ${fps} fps. The autoencoder shrinks space ${VID.space} times and time ${VID.time} times, then ${VID.patch} × ${VID.patch} patches are cut. How many tokens?`,
      answer: n0(V.tokens), wrong: [n0(V.frames * V.perFrame), n0(V.perFrame), n0(V.tokens / VID.time)],
      why: `${V.frames} frames / ${VID.time} = ${V.lat} latent frames. Each is ${w / VID.space} × ${h / VID.space}, cut into ${VID.patch} × ${VID.patch} patches: ${n0(V.perFrame)}. ${V.lat} × ${n0(V.perFrame)} = ${n0(V.tokens)}.` },
    { id: "rollout", level: "easy", kind: "numeric",
      q: `Each predicted frame stays faithful with chance ${Q}, independently. What is the chance all ${RN} frames of a rollout do?`,
      answer: pct(ROLL), wrong: [pct(Q), pct(1 - (1 - Q) * RN + 0.01), pct(Q / 2)],
      why: `${Q}^${RN} = ${ROLL.toFixed(3)}. Tiny per-step errors become likely failures over long rollouts.` },
    { id: "out", level: "hard", kind: "output",
      q: "Tokens for a small square clip. What does this print?",
      code: `frames, side = ${OF}, ${OS}\nspace, time, patch = ${VID.space}, ${VID.time}, ${VID.patch}\nlatent_frames = -(-frames // time)\nper_frame = (side // (space * patch)) ** 2\nprint(latent_frames * per_frame)`,
      answer: String(OT), wrong: [String(OF * (OS / (VID.space * VID.patch)) ** 2), String((OS / (VID.space * VID.patch)) ** 2), String(OT / VID.patch)],
      why: `${OF} / ${VID.time} = ${OF / VID.time} latent frames; ${OS} / ${VID.space * VID.patch} = ${OS / (VID.space * VID.patch)} patches per side, ${(OS / (VID.space * VID.patch)) ** 2} per frame; ${OT} in all.` },
    { id: "explain-cost", level: "medium", kind: "explain",
      q: "Why is video generation so much more expensive than image generation?",
      answer: `A clip is many images, so it has many more tokens: ${n0(V.tokens)} for ${seconds} seconds of ${w} × ${h} even after compressing space and time. Full attention grows with the square of the tokens, and the whole stack runs at every denoising step.\n\nSo models compress time hard, use fewer sampling steps, attend over windows or factored space and time, and make long videos in overlapping chunks.` },
    { id: "explain-robot", level: "hard", kind: "explain",
      q: "How could a world model help train a robot, and what are the risks?",
      answer: "The robot's policy can practise inside the model: choose actions, see predicted outcomes, and learn from many cheap, safe trials instead of slow and risky real ones. The model can also generate rare situations for testing, and be fine-tuned on the robot's own camera data.\n\nThe risks: the model's physics can be subtly wrong, and a policy may learn to exploit those errors. Rollouts drift. So test in the real world, re-anchor on real observations, and keep measuring the gap between model and reality." },
    { id: "explain-eval", level: "hard", kind: "explain",
      q: "How would you evaluate a video generation model for a product?",
      answer: "- Prompt following: does the clip show what was asked, judged by people or a strong vision model on a fixed prompt set.\n- Consistency: objects, faces and text stay the same across frames.\n- Motion and physics: no melting, popping or impossible movement.\n- Quality per frame, and artefacts at the resolutions you will ship.\n- Cost and latency per second of video.\n- Safety: likeness, logos and harmful content.\nUse fixed seeds and prompts so versions compare fairly." },
    { id: "trap-labels", level: "medium", kind: "trap",
      claim: "Genie was trained to be controllable without any ground-truth action labels.",
      truth: true,
      why: "It learned from unlabelled internet video, inferring latent actions between frames, yet users can act in its generated worlds frame by frame." },
    { id: "trap-double", level: "easy", kind: "trap",
      claim: "Doubling a clip's length doubles the cost of full attention over it.",
      truth: false,
      why: `Tokens double, but full attention pairs them all: ${Math.round(PAIRS2 / PAIRS)} times the work, ${n0(PAIRS / 1e9)} billion to ${n0(PAIRS2 / 1e9)} billion pairs here.` },
  ],
  real: [
    { who: "Jonathan Ho and co-authors", when: "2022",
      what: "Video Diffusion Models extended the standard image diffusion architecture to video. Training on images and video together reduced gradient variance and sped up optimisation, and a new sampling method extended videos in space and time.",
      takeaway: "Video generation grew directly out of image diffusion.",
      url: "https://arxiv.org/abs/2204.03458" },
    { who: "Jake Bruce and co-authors", when: "2024",
      what: "Genie is an 11B parameter generative interactive environment trained without supervision on unlabelled internet videos. It has a video tokenizer, an autoregressive dynamics model and a latent action model, and makes action-controllable worlds from text, images, photos and sketches.",
      takeaway: "Controls can be learned from watching, not only from labelled play.",
      url: "https://arxiv.org/abs/2402.15391" },
    { who: "The Cosmos team", when: "2025",
      what: "The Cosmos platform offers pre-trained world foundation models, video tokenizers, a video curation pipeline and post-training examples, so developers can build world models for physical AI. The authors describe it as open-source with open-weight models.",
      takeaway: "World models are becoming shared base models that robotics teams fine-tune.",
      url: "https://arxiv.org/abs/2501.03575" },
  ],
};
