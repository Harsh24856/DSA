// Stage 10: voice and realtime. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { AUDIO, cascadeMs, fullReplyMs, melFrames, n0, VOICE } from "../../stages/s10.calc.ts";

const TOTAL = cascadeMs();
// predict and numeric: waiting for the whole reply
const [RT, RS] = [150, 50], FULL = fullReplyMs(RT, RS);
// numeric: frames in 30 seconds
const F30 = melFrames(30);
// output: samples in one analysis window
const WIN = (AUDIO.rate * AUDIO.winMs) / 1000;
// trap: lowering the end-of-turn wait
const FAST = cascadeMs({ ...VOICE, endpoint: 100 });

export const VOICE_REALTIME: GModule = {
  id: "voice-realtime",
  stage: 10,
  title: "Voice and realtime",
  hook: "In conversation, a pause of a second feels awkward. A voice agent has to hear that you stopped, understand, think and start speaking inside that budget, and stop at once if you interrupt.",
  blocks: [
    { kind: "figure", id: "s10-voice-timeline", caption: `A streaming cascade: each stage starts on the previous one's first output. The example reaches the first sound in ${TOTAL} ms.` },
    { kind: "text", md: "**Two designs.** A **cascade** chains voice activity detection, speech to text, an LLM and text to speech. Each part can be swapped and logged as text. A **speech-to-speech** model takes audio in and gives audio out in one network, which cuts hops and keeps tone of voice, at the cost of less control over each step." },
    { kind: "flow", id: "s10-voice-budget" },
    {
      kind: "predict",
      q: `Instead of streaming, the app waits for the LLM's full ${RT} token reply (at ${RS} tokens a second) before speaking. When does the user hear the first sound?`,
      answer: `About ${n0(FULL)} ms`, wrong: [`About ${n0(TOTAL)} ms`, `About ${n0(TOTAL + VOICE.llm)} ms`, `About ${n0(FULL * 2)} ms`],
      why: `Writing ${RT} tokens at ${RS} a second takes ${n0((RT / RS) * 1000)} ms, added on top of the ${TOTAL} ms streaming path: ${n0(FULL)} ms. Streaming text to the speech model sentence by sentence hides almost all of it.`,
    },
    { kind: "play", id: "s10-voice" },
    { kind: "flow", id: "s10-barge" },
    {
      kind: "compare",
      head: ["", "Cascade", "Speech to speech"],
      rows: [
        ["Hops", "VAD, ASR, LLM, TTS", "One model, audio in and out"],
        ["Latency", "Sum of each stage's first output", "Lower: no text hand-offs"],
        ["Tone and emotion", "Lost in the transcript", "Kept"],
        ["Control and logs", "Text at every step: easy to filter and test", "Harder to inspect and constrain"],
        ["Overlap and interruptions", "Built by hand: VAD and barge-in", "Can be modelled directly (full duplex)"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
rate, hop = ${AUDIO.rate}, ${(AUDIO.rate * AUDIO.hopMs) / 1000}             # 16 kHz audio, a frame every 10 ms
t = np.arange(rate * 2) / rate                     # 2 seconds
speech = (t > 0.5) & (t < 1.3)                     # someone talks from 0.5 s to 1.3 s
rng = np.random.default_rng(0)
audio = 0.02 * rng.normal(size=t.size) + speech * np.sin(2 * np.pi * 220 * t)

frames = audio[: t.size // hop * hop].reshape(-1, hop)
energy = (frames ** 2).mean(axis=1)                 # a very simple voice activity detector
active = energy > 0.05
last = np.flatnonzero(active)[-1]
quiet_needed = 30                                   # 300 ms of silence ends the turn
end_turn = (last + quiet_needed) * hop / rate
print(f"{frames.shape[0]} frames, speech until {(last + 1) * hop / rate:.2f} s, turn ends at {end_turn:.2f} s")
assert abs((last + 1) * hop / rate - 1.3) < 0.02
`,
    },
    { kind: "text", md: `**Where the budget goes.** The end-of-turn wait is a real trade: shorter feels snappier but cuts people off mid-thought. Then the LLM's time to first token. Keep prompts short and cached, stream every stage, start speaking on the first sentence, and say a short filler when a tool call will take a while.` },
  ],
  keyPoints: [
    "A voice cascade is VAD, speech to text, an LLM and text to speech; streaming means each stage starts on the previous one's first output.",
    `Time to first sound is the sum of the end-of-turn wait and each stage's first output: ${TOTAL} ms in the example.`,
    "The end-of-turn wait trades speed against cutting people off; it is often the largest single knob.",
    "Barge-in means stopping playback at once when the user speaks, cancelling the rest, and keeping only what was actually heard in history.",
    "Speech-to-speech models skip the text hops, keep tone and can listen while they speak, but are harder to inspect and control.",
  ],
  questions: [
    { id: "cascade", level: "easy", kind: "concept",
      q: "Which order do the parts of a voice cascade run in?",
      answer: "Voice activity detection, speech to text, LLM, text to speech",
      wrong: ["Text to speech, LLM, speech to text, voice activity detection", "LLM, voice activity detection, text to speech, speech to text", "Speech to text, text to speech, LLM, voice activity detection"],
      why: "Detect when the user is talking and has stopped, transcribe, decide what to say, then speak it. Streaming lets them overlap in time but not change order." },
    { id: "endpoint", level: "medium", kind: "concept",
      q: "You shorten the silence that marks the end of the user's turn from 800 ms to 150 ms. What is the main risk?",
      answer: "The agent cuts in while the user is only pausing to think",
      wrong: ["Speech to text gets less accurate on every word", "The LLM runs out of context", "Text to speech produces a lower voice"],
      why: "People pause mid-sentence. A short wait replies faster but interrupts; a long wait feels slow. Smarter end-of-turn models look at the words, not just silence." },
    { id: "stream-tts", level: "easy", kind: "concept",
      q: "Why send the LLM's reply to text to speech sentence by sentence?",
      answer: "So audio can start playing before the whole reply is written",
      wrong: ["Because TTS cannot read long text", "To save LLM tokens", "So the voice sounds more natural"],
      why: `Waiting for a ${RT} token reply at ${RS} tokens a second adds ${n0((RT / RS) * 1000)} ms. The first sentence is ready long before that.` },
    { id: "barge", level: "medium", kind: "concept",
      q: "The user starts talking while the agent is speaking. What should the agent do?",
      answer: "Stop playback at once, cancel the rest of the reply, and keep only what was spoken in the history",
      wrong: ["Finish the sentence, then listen", "Raise its volume", "Ignore it until the reply ends"],
      why: "Talking over someone feels rude, and the history must match what the user heard, or later turns refer to words they never got." },
    { id: "echo", level: "medium", kind: "concept",
      q: "On a phone speaker, the agent keeps interrupting itself. What is the likely cause?",
      answer: "Its own voice leaks into the microphone and voice detection hears it as the user; echo cancellation is missing",
      wrong: ["The LLM's temperature is too high", "The TTS voice is too slow", "The speech to text model is too large"],
      why: "Without echo cancellation, the agent's audio comes back through the mic and triggers barge-in. Headsets hide the problem; speakerphones show it." },
    { id: "duplex", level: "hard", kind: "concept",
      q: "What does a full-duplex speech model do that a turn-based cascade does not?",
      answer: "It listens and speaks at the same time, so overlap and interruptions are part of the model",
      wrong: ["It transcribes faster than real time", "It uses two LLMs in parallel", "It only answers after the user stops"],
      why: "Moshi, for example, models its own speech and the user's as parallel streams, with no explicit turns. A cascade has to fake this with VAD and barge-in logic." },
    { id: "weak", level: "medium", kind: "concept",
      q: "What made Whisper robust across accents and noise?",
      answer: "Training on a very large, varied set of weakly supervised audio with transcripts from the web",
      wrong: ["A small, perfectly cleaned studio dataset", "Training only on synthetic speech", "A rule-based phoneme dictionary"],
      why: "The paper used 680,000 hours of multilingual, multitask data. Scale and variety, not clean labels, gave zero-shot robustness." },
    { id: "frames", level: "easy", kind: "numeric",
      q: `Audio features are computed every ${AUDIO.hopMs} ms. How many frames does a 30 second clip give?`,
      answer: n0(F30), wrong: [n0(F30 / 10), n0(30 * AUDIO.rate), n0(F30 * 2.5)],
      why: `30,000 ms / ${AUDIO.hopMs} ms = ${n0(F30)}. The ${n0(30 * AUDIO.rate)} samples at ${AUDIO.rate / 1000} kHz are grouped into these frames.` },
    { id: "budget", level: "medium", kind: "numeric",
      q: `End-of-turn wait ${VOICE.endpoint} ms, speech to text ${VOICE.stt} ms, LLM first token ${VOICE.llm} ms, first audio ${VOICE.tts} ms, network ${VOICE.net} ms. When is the first sound, with full streaming?`,
      answer: `${TOTAL} ms`, wrong: [`${TOTAL - VOICE.endpoint} ms`, `${Math.max(...Object.values(VOICE))} ms`, `${n0(FULL)} ms`],
      why: `The stages run one after another up to their first output: ${Object.values(VOICE).join(" + ")} = ${TOTAL} ms. Forgetting the end-of-turn wait is the usual slip; it is often the biggest part.` },
    { id: "win", level: "easy", kind: "output",
      q: "How many samples fall in one 25 ms analysis window? What does this print?",
      code: `rate, win_ms = ${AUDIO.rate}, ${AUDIO.winMs}\nprint(rate * win_ms // 1000)`,
      answer: String(WIN), wrong: [String(AUDIO.rate / AUDIO.hopMs), String(AUDIO.winMs * 1000), String(WIN / 2)],
      why: `${AUDIO.rate} samples a second × 0.025 s = ${WIN}. Windows of ${AUDIO.winMs} ms step every ${AUDIO.hopMs} ms, so they overlap.` },
    { id: "explain-budget", level: "medium", kind: "explain",
      q: "Walk through the latency budget of a voice reply and where you would cut first.",
      answer: `From the moment the user stops: the end-of-turn wait (${VOICE.endpoint} ms here), the final transcript (${VOICE.stt}), the LLM's first token (${VOICE.llm}), the first audio chunk (${VOICE.tts}) and the network (${VOICE.net}): ${TOTAL} ms.\n\nCut first where it is largest: a smarter end-of-turn detector, then a faster or cached LLM prompt. Stream every stage, start speaking on the first sentence, and run servers near the user. Measure the 95th percentile, not just the average.` },
    { id: "explain-choose", level: "hard", kind: "explain",
      q: "When would you choose a cascade over a speech-to-speech model?",
      answer: "Choose a cascade when you need control: text at every step can be logged, filtered for safety, checked against policy and tested. You can swap the best speech to text, LLM and voice separately, and use tools and RAG with ordinary text prompts.\n\nChoose speech to speech when the conversation itself is the product: lowest latency, natural overlap and interruptions, and tone of voice kept. Many teams start with a cascade and keep a transcript even with a speech-to-speech model." },
    { id: "explain-natural", level: "hard", kind: "explain",
      q: "Users say your voice agent feels robotic and slow. What do you change?",
      answer: "- Stream end to end and start speaking on the first sentence.\n- Tune end-of-turn detection on real calls, so it neither cuts in nor waits too long.\n- Support barge-in with echo cancellation, and trim history to what was heard.\n- Write replies for the ear: short sentences, no lists or markdown, numbers said the way people say them.\n- Cover slow tool calls with a short spoken filler.\n- Track time to first audio at the 95th percentile, and listen to recordings." },
    { id: "trap-wait", level: "easy", kind: "trap",
      claim: "Waiting for the LLM's whole reply before starting text to speech adds little delay, because speech synthesis is fast.",
      truth: false,
      why: `The delay is the LLM writing the reply, not the synthesis: ${RT} tokens at ${RS} a second is ${n0((RT / RS) * 1000)} ms extra, ${n0(FULL)} ms in all against ${TOTAL} ms when streaming.` },
    { id: "trap-endpoint", level: "medium", kind: "trap",
      claim: `Cutting the end-of-turn wait from ${VOICE.endpoint} ms to 100 ms brings the example's first sound from ${TOTAL} ms to ${FAST} ms.`,
      truth: true,
      why: `The wait sits in series with every other stage, so it comes straight off the total: ${TOTAL} - ${VOICE.endpoint - 100} = ${FAST} ms. The price is more cut-offs.` },
  ],
  real: [
    { who: "Alec Radford and co-authors", when: "2022",
      what: "Whisper was trained on 680,000 hours of multilingual and multitask audio with weak supervision. Zero-shot, it was often competitive with fully supervised results and approached human accuracy and robustness. The models and code were released.",
      takeaway: "Large, varied, imperfect data made speech recognition robust enough to sit at the front of voice agents.",
      url: "https://arxiv.org/abs/2212.04356" },
    { who: "Alexandre Défossez and co-authors", when: "2024",
      what: "Moshi treats spoken dialogue as speech-to-speech generation, modelling its own speech and the user's as parallel streams with no explicit turns. It is described as the first real-time full-duplex spoken LLM, with 160 ms theoretical and 200 ms practical latency.",
      takeaway: "One model that listens while it speaks removes the cascade's hops and its turn-taking hacks.",
      url: "https://arxiv.org/abs/2410.00037" },
  ],
};
