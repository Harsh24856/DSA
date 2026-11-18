// Stage 10 (Frontier) animated walk-throughs. Every number is computed here or in s10.calc.ts.
import type { Flow, GridStep } from "../../other/flows.ts";
import { AUDIO, cascadeMs, CLIP_FIG, eulerCurved, eulerStraight, melFrames, n0, r2, ropeAngle, route, ROUTE_EX, scan, THINK, thinkCost, turns, VID, videoTokens, VOICE } from "./s10.calc.ts";

const sec = (s: number) => `${s.toFixed(s < 10 ? 1 : 0)} s`;

// reasoning-models: what a bigger thinking budget costs in time and money
function think(): Flow {
  const { rate, perM, answer, budgets } = THINK;
  const bars = (t: number) => [{ label: "thinking", value: thinkCost(t, rate, perM).s, tone: "hot" as const }, { label: "answer", value: thinkCost(answer, rate, perM).s, tone: "ok" as const }];
  return { kind: "bars", title: `Thinking budget at ${rate} tokens a second`, format: sec, steps: budgets.map((b, i) => {
    const c = thinkCost(b + answer, rate, perM);
    return { note: i === 0
      ? `No thinking: the ${answer} token answer streams at once and takes ${sec(c.s)}. The first visible token comes almost straight away.`
      : `A budget of ${n0(b)} thinking tokens adds ${sec(thinkCost(b, rate, perM).s)} before the answer starts. At $${perM} per million output tokens the request costs $${c.usd.toFixed(3)}, ${((b + answer) / answer).toFixed(0)} times the plain answer.`,
      tone: i === budgets.length - 1 ? "warn" : undefined, bars: bars(b) };
  }) };
}

// mixture-of-experts: four tokens through one router
function moeRoute(): Flow {
  const steps: GridStep[] = ROUTE_EX.map(([tok, s]) => {
    const { p, top } = route(s, 2), chosen = new Map(top.map((x) => [x.e, x.w]));
    return {
      note: `Token "${tok}": the router gives each of ${s.length} experts a probability. Only the top 2, experts ${top.map((x) => x.e + 1).join(" and ")}, run. Their outputs are mixed with weights ${top.map((x) => r2(x.w)).join(" and ")}, renormalised to sum to 1.`,
      tone: "hot",
      tables: [{ label: `router for "${tok}"`, head: ["expert", "p", "runs?", "weight"], rows: p.map((x, i) => [i + 1, r2(x), chosen.has(i) ? "yes" : "no", chosen.has(i) ? r2(chosen.get(i)!) : "-"]),
        tones: Object.fromEntries(top.map((x) => [String(x.e), "ok" as const])) }],
    };
  });
  const load = Array.from({ length: 8 }, (_, e) => ROUTE_EX.filter(([, s]) => route(s, 2).top.some((x) => x.e === e)).length);
  steps.push({ note: `Across the four tokens, experts got ${load.join(", ")} tokens. ${load.filter((l) => l === 0).length} experts sit idle while experts ${load.flatMap((l, e) => (l === Math.max(...load) ? [e + 1] : [])).join(" and ")} get ${Math.max(...load)} tokens each. Training adds pressure to spread tokens evenly, or GPUs holding busy experts become the bottleneck.`, tone: "warn",
    tables: [{ label: "tokens per expert", head: ["expert", "tokens"], rows: load.map((l, e) => [e + 1, l]) }] });
  return { kind: "grid", title: "Top-2 routing over 8 experts", steps };
}

// state-space-hybrids: a scalar state, run token by token
export const SCAN_EX = { xs: [1, 0, 0, 4, 0, 0], a: 0.5, b: 1, c: 1 };
function ssmScan(): Flow {
  const { xs, a, b, c } = SCAN_EX, out = scan(xs, a, b, c);
  const steps: GridStep[] = xs.map((x, i) => ({
    note: i === 0 ? `The state h starts at 0. Each token does h = ${a} × h + ${b} × x, then y = ${c} × h. Token 1 has x = ${x}, so h = ${r2(out[0].h)}.`
      : `Token ${i + 1}, x = ${x}: the old state is halved and the input added, h = ${r2(out[i].h)}. ${x === 0 ? "With no new input the memory fades." : "A new input jumps in."} The cost of this step is the same at any position.`,
    tone: x ? "hot" : undefined,
    tables: [{ head: ["t", "x", "h", "y"], rows: out.slice(0, i + 1).map((o, j) => [j + 1, xs[j], r2(o.h), r2(o.y)]) }],
  }));
  steps.push({ note: `Only one number of state was ever kept, not ${xs.length} past tokens. A fixed decay forgets everything at the same rate. Mamba makes a and b depend on the input, so the model can choose to hold a token or let it go.`, tone: "ok",
    tables: [{ head: ["t", "x", "h", "y"], rows: out.map((o, j) => [j + 1, xs[j], r2(o.h), r2(o.y)]) }] });
  return { kind: "grid", title: "A state space layer, one token at a time", steps };
}

// long-context: why positions past the trained length confuse RoPE, and how interpolation fixes it
export const ROPE_EX = { train: 4096, target: 16384, pair: 63 };
function rope(): Flow {
  const { train, target, pair } = ROPE_EX, stretch = target / train;
  const row = (pos: number, s = 1) => [n0(pos), r2(turns(ropeAngle(pos, pair, 128, 10000, s)))];
  const pos = [1024, 2048, 4096];
  return { kind: "grid", title: "Stretching RoPE past the trained length", steps: [
    { note: `RoPE turns each pair of numbers in a query and key by an angle that grows with position. The slowest pair (pair ${pair + 1} of 64) turns only ${r2(turns(ropeAngle(train, pair)))} of a full circle by position ${n0(train)}, the trained length.`,
      tables: [{ label: "slowest pair, turns", head: ["position", "turns"], rows: pos.map((p) => row(p)) }] },
    { note: `Feed ${n0(target)} tokens and that pair reaches ${r2(turns(ropeAngle(target, pair)))} turns, an angle it never saw in training. Attention scores at those positions are unreliable, and quality drops.`, tone: "bad",
      tables: [{ label: "slowest pair, turns", head: ["position", "turns"], rows: [...pos, target].map((p) => row(p)) }], },
    { note: `Position interpolation divides every position by ${stretch}. Position ${n0(target)} now gets the angle ${n0(target / stretch)} had, inside the trained range. A short fine-tune teaches the model the finer spacing. YaRN refines this per frequency.`, tone: "ok",
      tables: [{ label: `turns, positions divided by ${stretch}`, head: ["position", "turns"], rows: [...pos, target].map((p) => row(p, stretch)) }] },
  ] };
}

// vision-language and video-world: a clip turned into tokens
const CLIP = CLIP_FIG;
function videoChain(): Flow {
  const { seconds, fps, w, h } = CLIP, v = videoTokens(seconds, fps, w, h);
  return { title: `${seconds} s of ${w} x ${h} video to tokens`, steps: [
    { node: `${v.frames} frames of ${w} x ${h}`, note: `${seconds} seconds at ${fps} frames a second is ${v.frames} frames, ${n0(v.frames * w * h)} pixels. Far too many to attend over directly.` },
    { node: "video autoencoder", note: `In this example the encoder shrinks each side ${VID.space} times and time ${VID.time} times: ${v.lat} latent frames of ${w / VID.space} x ${h / VID.space}. Nearby frames are nearly the same, so time compresses well.`, tone: "hot" },
    { node: `cut ${VID.patch} x ${VID.patch} spacetime patches`, note: `Each latent frame becomes ${n0(v.perFrame)} patches. In all, ${n0(v.tokens)} tokens for the clip.` },
    { node: "diffusion transformer", note: `Full attention over ${n0(v.tokens)} tokens is ${n0(v.tokens ** 2 / 1e9)} billion score pairs per head per layer, at every denoising step. That is why video is the most expensive thing to generate.`, tone: "warn" },
    { node: "decode back to pixels", note: "After the last denoising step, the decoder turns the latents back into frames.", tone: "ok" },
  ] };
}

// video-world: an action-conditioned world model in a loop
function worldLoop(): Flow {
  return { kind: "lanes", title: "A world model you can steer", lanes: ["Player or agent", "World model", "Frames"], steps: [
    { from: 2, to: 1, label: "past frames as tokens", note: "The model reads the last few frames, already turned into tokens by a video tokenizer." },
    { from: 0, to: 1, label: "action: move left", note: "It also reads an action. Genie learned its actions from unlabelled video, so they are latent codes, not key presses." },
    { from: 1, to: 1, label: "predict next frame", note: "It predicts the next frame's tokens, given the past and the action. This is next-token prediction over space and time.", tone: "hot" },
    { from: 1, to: 2, label: "new frame shown", note: "The frame is decoded and shown. It becomes part of the past for the next step." },
    { from: 2, to: 1, label: "its own output fed back", note: "From here on the model reads frames it made itself. Small errors are fed back in and can grow, so long rollouts drift.", tone: "warn" },
    { from: 1, to: 0, label: "agent trains inside", note: "An agent can practise inside the model instead of the real world, which is the point for robots and cars.", tone: "ok" },
  ] };
}

// voice-realtime: a cascade's time to first audio, and what a barge-in must do
function voiceBudget(): Flow {
  const v = VOICE, order: [keyof typeof VOICE, string][] = [["endpoint", "end of turn"], ["stt", "speech to text"], ["llm", "LLM first token"], ["tts", "first audio chunk"], ["net", "network"]];
  const fmt = (x: number) => `${Math.round(x)} ms`;
  return { kind: "bars", title: "Time to first audio in a streaming cascade", format: fmt, steps: order.map(([k, name], i) => {
    const sum = order.slice(0, i + 1).reduce((a, [kk]) => a + v[kk], 0);
    return { note: i === 0 ? `The user stops talking. The system waits ${v.endpoint} ms of silence to be sure the turn is over: too short and it cuts people off, too long and it feels slow.`
      : i === order.length - 1 ? `Add ${v.net} ms of network both ways: ${cascadeMs()} ms to the first sound. Audio is split into ${AUDIO.hopMs} ms frames, ${melFrames(1)} a second, so every stage can stream.`
      : `${name}: ${v[k]} ms. Running total ${sum} ms. Each stage starts on the previous one's first output, not its last.`,
      tone: i === order.length - 1 ? "hot" : undefined,
      bars: order.map(([kk, nn], j) => ({ label: nn, value: j <= i ? v[kk] : 0, tone: j === i ? ("hot" as const) : undefined })) };
  }) };
}
function bargeIn(): Flow {
  return { kind: "lanes", title: "Barge-in: the user talks over the agent", lanes: ["User", "Voice agent", "Speaker"], steps: [
    { from: 1, to: 2, label: "speaking a reply", note: "The agent is part way through a spoken answer, streaming audio chunks." },
    { from: 0, to: 1, label: "user starts talking", note: "Voice activity detection hears the user over the agent's own audio, after echo is cancelled.", tone: "warn" },
    { from: 1, to: 2, label: "stop audio now", note: "The agent stops playback within a frame or two and cancels the rest of the LLM and TTS stream.", tone: "hot" },
    { from: 1, to: 1, label: "trim history", note: "It records only the words that were actually played, so the history matches what the user heard." },
    { from: 0, to: 1, label: "new turn", note: "The user's words start a new turn. A full-duplex model listens and speaks at once, so this is built in.", tone: "ok" },
  ] };
}

// diffusion-flow: Euler steps along a straight and a curved path
export const EULER = { x1: 1.5, data: -0.3, steps: [1, 2, 4, 16] };
function eulerFlow(): Flow {
  const { x1, data, steps } = EULER, err = (x: number) => Math.abs(x - data);
  return { kind: "bars", title: "Sampling steps: straight against curved paths", format: (x) => x.toFixed(3), steps: steps.map((n, i) => {
    const s = err(eulerStraight(x1, data, n)), c = err(eulerCurved(x1, data, n));
    return { note: i === 0
      ? `Start at noise ${x1}, aim for the data point ${data}. On a straight path the velocity never changes, so 1 Euler step lands with error ${s.toFixed(3)}. On a curved path, 1 step misses by ${c.toFixed(3)}.`
      : `${n} steps: straight error ${s.toFixed(3)}, curved error ${c.toFixed(3)}. ${i === steps.length - 1 ? "The curved path needs many steps to follow its bend. Straighter paths are why flow-matching models sample in fewer steps." : "More steps follow the curve better."}`,
      tone: i === steps.length - 1 ? "ok" : "hot",
      bars: [{ label: "straight path", value: s, tone: "ok" as const }, { label: "curved path", value: c, tone: "warn" as const }] };
  }) };
}

// coding-agents: one issue, end to end
function agentLoop(): Flow {
  return { kind: "lanes", title: "A coding agent fixes one issue", lanes: ["Developer", "Agent", "Repo and tests"], steps: [
    { from: 0, to: 1, label: "issue + done criteria", note: "The developer gives the goal and how to know it is done: which test must pass, what not to touch." },
    { from: 1, to: 2, label: "search, read files", note: "The agent explores first: it greps, opens files and reads the failing test, building its own context.", tone: "hot" },
    { from: 1, to: 2, label: "edit two files", note: "It makes a small edit through a tool that shows the changed lines, so mistakes are easy to see." },
    { from: 2, to: 1, label: "test fails: trace", note: "It runs the tests. One fails, and the trace goes back into the context as feedback.", tone: "bad" },
    { from: 1, to: 2, label: "fix, rerun: pass", note: "It reads the trace, fixes the cause, and reruns the whole suite. Tests are the verifier.", tone: "ok" },
    { from: 1, to: 0, label: "diff for review", note: "It stops and shows the diff. A person reviews and merges, and never gives it secrets it does not need.", tone: "ok" },
  ] };
}

export const FLOWS_10: Record<string, Flow> = {
  "s10-think": think(),
  "s10-moe-route": moeRoute(),
  "s10-scan": ssmScan(),
  "s10-rope": rope(),
  "s10-video-tokens": videoChain(),
  "s10-world": worldLoop(),
  "s10-voice-budget": voiceBudget(),
  "s10-barge": bargeIn(),
  "s10-euler": eulerFlow(),
  "s10-agent-loop": agentLoop(),
};
