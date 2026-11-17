// Stage 8 (Agents) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s8.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { callInput, chainOk, glue, loopInput, MEM_QUERY, MEMORIES, rankMemories, stepWithRetries } from "./s8.calc.ts";

export const kfmt = (x: number) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : x >= 1e4 ? `${Math.round(x / 1e3)}k` : x >= 1e3 ? `${(x / 1e3).toFixed(1)}k` : String(Math.round(x)));
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// tool-calling: tool schemas ride along on every call
export const PICKED = 5;
function toolBudget(v: Record<string, number>): Flow {
  const { tools, per, calls } = v, all = tools * per, few = Math.min(tools, PICKED) * per;
  const bars = (a: number, b: number) => [{ label: "all tools", value: a, tone: "warn" as const }, { label: `${Math.min(tools, PICKED)} picked`, value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${tools} tools, ${per} tokens each, ${calls} calls`, format: kfmt, steps: [
    { note: `Every call that offers the tools carries their names, descriptions and schemas: ${tools} × ${per} = ${n0(all)} input tokens before the user's question.`, tone: "warn", bars: bars(all, all) },
    { note: `A task that takes ${calls} model call${calls > 1 ? "s" : ""} sends them ${calls} time${calls > 1 ? "s" : ""}: ${n0(all * calls)} tokens of schemas alone.`, tone: "hot", bars: bars(all * calls, all * calls) },
    { note: tools > PICKED ? `Offer only the ${PICKED} tools that fit this request (chosen by a router or a search over tool descriptions): ${n0(few * calls)} tokens, ${(all / few).toFixed(1)} times fewer. Fewer, clearer tools are also picked correctly more often.` : `With ${tools} tool${tools > 1 ? "s" : ""} there is nothing to trim. Past a few dozen tools, picking a subset per request saves tokens and wrong picks.`, tone: "ok", bars: bars(all * calls, few * calls) },
  ] };
}

// agent-loop-react: every call resends the history, so input grows with each step
function loopCost(v: Record<string, number>): Flow {
  const { calls, prompt, obs } = v, last = callInput(prompt, obs, calls - 1), run = loopInput(prompt, obs, calls), flat = calls * prompt;
  const bars = (a: number, b: number, c: number) => [{ label: "first call", value: a }, { label: "last call", value: b, tone: "warn" as const }, { label: "whole run", value: c, tone: "hot" as const }];
  return { kind: "bars", title: `${calls} calls, ${prompt} token prompt, ${obs} per result`, format: kfmt, steps: [
    { note: `Call 1 reads the prompt and tool definitions: ${n0(prompt)} tokens.`, bars: bars(prompt, 0, 0) },
    { note: calls === 1 ? "With one call there is no history to resend. Add calls to see it grow." : `Each tool result stays in the history. Call ${calls} reads ${n0(prompt)} + ${calls - 1} × ${n0(obs)} = ${n0(last)} tokens.`, tone: "warn", bars: bars(prompt, last, 0) },
    { note: `The run reads ${n0(run)} input tokens in all, ${(run / flat).toFixed(2)} times what ${calls} calls of the bare prompt would cost. Growth is quadratic in the steps, so trim or summarise old tool results in long runs.`, tone: "hot", bars: bars(prompt, last, run) },
  ] };
}

// agent-loop-react: small error rates compound over many steps
function reliability(v: Record<string, number>): Flow {
  const p = v.p / 100, { n, r } = v, task = chainOk(p, n), retry = chainOk(stepWithRetries(p, r), n);
  const f = (x: number) => `${(x * 100).toFixed(1)}%`;
  const bars = (b: number, c: number) => [{ label: "one step", value: p, tone: "ok" as const }, { label: `all ${n} steps`, value: b, tone: "warn" as const }, { label: "with retries", value: c, tone: "hot" as const }];
  return { kind: "bars", title: `${v.p}% a step, ${n} steps`, max: 1, format: f, steps: [
    { note: `Each step works ${f(p)} of the time. That sounds safe.`, tone: "ok", bars: bars(0, 0) },
    { note: `The task needs every step to work: ${f(p)} to the power ${n} = ${f(task)}, if failures are independent. Long agent runs fail more than their steps suggest.`, tone: "warn", bars: bars(task, 0) },
    { note: r === 1 ? "With one try per step there is no retry. Raise tries to see what checking and retrying buys." : `If a failed step can be detected (a test, a validator, an error result) and retried up to ${r} times, a step fails only ${f((1 - p) ** r)} of the time and the task succeeds ${f(retry)}. Retries help only failures you can see.`, tone: "hot", bars: bars(task, retry) },
  ] };
}

// state-graphs: what a checkpoint saves when a long run crashes
function resume(v: Record<string, number>): Flow {
  const { n, k, sec } = v;
  if (k > n) throw new PlayError(`The run has only ${n} steps, so it cannot fail at step ${k}. Move the failing step down.`);
  const t = (x: number) => (x >= 60 ? `${(x / 60).toFixed(1)} min` : `${Math.round(x)} s`);
  const bars = (a: number, b: number) => [{ label: "no checkpoint", value: a, tone: "warn" as const }, { label: "checkpoints", value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${n} steps of ${sec} s, crash at step ${k}`, format: t, steps: [
    { note: `The run crashes during step ${k}. Steps 1 to ${k - 1} took ${t((k - 1) * sec)}${k === 1 ? ", which is nothing yet" : ""}.`, bars: bars((k - 1) * sec, (k - 1) * sec) },
    { note: `Without checkpoints, a restart begins again at step 1 and repeats ${k} steps (${t(k * sec)}), side effects included. With a checkpoint after every step, ${k === 1 ? "there is nothing saved yet, so it re-runs step 1 from the input" : `it reloads the state saved after step ${k - 1} and re-runs only step ${k}`}: ${t(sec)}.`, tone: "hot", bars: bars(k * sec, sec) },
    { note: `Finishing the whole run after the crash: ${t(n * sec)} without checkpoints, ${t((n - k + 1) * sec)} with them. The failed step still runs twice, so make its side effects idempotent.`, tone: "ok", bars: bars(n * sec, (n - k + 1) * sec) },
  ] };
}

// mcp-a2a: the N times M integration problem
function nm(v: Record<string, number>): Flow {
  const { apps, tools } = v, g = glue(apps, tools);
  const bars = (a: number, b: number) => [{ label: "pairwise glue", value: a, tone: "warn" as const }, { label: "one protocol", value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${apps} apps, ${tools} tools`, format: (x) => n0(x), steps: [
    { note: `Without a shared protocol, every app needs its own connector for every tool: ${apps} × ${tools} = ${n0(g.pairs)} pieces of glue to write and keep working.`, tone: "warn", bars: bars(g.pairs, 0) },
    { note: `With one protocol, each app implements a client once and each tool ships a server once: ${apps} + ${tools} = ${n0(g.protocol)}.`, tone: "ok", bars: bars(g.pairs, g.protocol) },
    { note: g.pairs > g.protocol ? `${n0(g.pairs - g.protocol)} fewer integrations. Adding one more tool now costs 1 server instead of ${apps} connectors.` : `With so few apps or tools, a protocol saves nothing yet (${n0(g.pairs)} against ${n0(g.protocol)}). It pays off as both sides grow.`, tone: "hot", bars: bars(g.pairs, g.protocol) },
  ] };
}

// agent-memory: how the weights decide which memories reach the context
function memDecay(v: Record<string, number>): Flow {
  const { half, wi, wr } = v, K = 2;
  const stage = (w: number[]) => { const r = rankMemories(half, w), top = r.slice(0, K).map((m) => m.id); return { top, bars: MEMORIES.map((m) => ({ label: m.text, value: r.find((x) => x.id === m.id)!.score, tone: top.includes(m.id) ? "ok" as const : undefined })) }; };
  const a = stage([1, 0, 0]), b = stage([1, wi, 0]), c = stage([1, wi, wr]);
  const names = (ids: string[]) => ids.map((id) => MEMORIES.find((m) => m.id === id)!.text.toLowerCase()).join(" and ");
  return { kind: "bars", title: `Half-life ${half} h, importance × ${wi}, relevance × ${wr}`, max: 1 + 3 + 3, format: (x) => x.toFixed(2), steps: [
    { note: `Recency only, halving every ${half} hours: the top ${K} are ${names(a.top)}.`, tone: "warn", bars: a.bars },
    { note: wi ? `Add importance × ${wi}: now ${names(b.top)}. Facts marked as important when saved hold on as they age.` : "Importance has weight 0, so nothing changes. Raise it to keep important old facts.", tone: "hot", bars: b.bars },
    { note: wr ? `Add relevance to "${MEM_QUERY}" × ${wr}: ${names(c.top)} reach the context. Tune the weights on real requests, and check what gets left out.` : "Relevance has weight 0, so the request itself is ignored. Raise it so the memories fit what is being asked.", tone: "ok", bars: c.bars },
  ] };
}

export const PLAY_8: Record<string, PlayFlow> = {
  "s8-mem-decay": {
    title: "Which memories reach the context?",
    knobs: [
      { key: "half", label: "Recency half-life (hours)", min: 1, max: 720, step: 1, value: 24 },
      { key: "wi", label: "Weight on importance", min: 0, max: 3, step: 0.5, value: 1 },
      { key: "wr", label: "Weight on relevance", min: 0, max: 3, step: 0.5, value: 1 },
    ],
    make: memDecay,
  },
  "s8-nm": {
    title: "Why a shared protocol? Count the integrations",
    knobs: [
      { key: "apps", label: "AI apps", min: 1, max: 20, step: 1, value: 5 },
      { key: "tools", label: "Tools and data sources", min: 1, max: 50, step: 1, value: 20 },
    ],
    make: nm,
  },
  "s8-resume": {
    title: "What does a checkpoint save after a crash?",
    knobs: [
      { key: "n", label: "Steps in the run", min: 3, max: 30, step: 1, value: 12 },
      { key: "k", label: "Step that crashes", min: 1, max: 30, step: 1, value: 9 },
      { key: "sec", label: "Seconds per step", min: 1, max: 120, step: 1, value: 20 },
    ],
    make: resume,
  },
  "s8-loop-cost": {
    title: "How fast does an agent's context grow?",
    knobs: [
      { key: "calls", label: "Model calls in the run", min: 1, max: 30, step: 1, value: 10 },
      { key: "prompt", label: "Prompt and tools (tokens)", min: 500, max: 8000, step: 500, value: 2000 },
      { key: "obs", label: "Tokens per tool result", min: 100, max: 3000, step: 100, value: 500 },
    ],
    make: loopCost,
  },
  "s8-reliability": {
    title: "Why long agent runs fail",
    knobs: [
      { key: "p", label: "One step succeeds (%)", min: 80, max: 99.5, step: 0.5, value: 95 },
      { key: "n", label: "Steps in the task", min: 1, max: 50, step: 1, value: 10 },
      { key: "r", label: "Tries per step", min: 1, max: 3, step: 1, value: 1 },
    ],
    make: reliability,
  },
  "s8-tool-budget": {
    title: "What do tool schemas cost?",
    knobs: [
      { key: "tools", label: "Tools offered", min: 1, max: 80, step: 1, value: 40 },
      { key: "per", label: "Tokens per tool definition", min: 50, max: 600, step: 10, value: 150 },
      { key: "calls", label: "Model calls per task", min: 1, max: 20, step: 1, value: 6 },
    ],
    make: toolBudget,
  },
};
