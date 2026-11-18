// Stage 9 (Production) animated walk-throughs. Every number is computed here or in s9.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { BF16, decodeStep, latency, MODEL, n0, prefillS, weightsGB } from "./s9.calc.ts";

const ms = (s: number) => `${(s * 1000).toFixed(s < 0.01 ? 1 : 0)} ms`;
const sec = (s: number) => (s >= 1 ? `${s.toFixed(2)} s` : ms(s));

// time-memory: one request's latency, piece by piece
export const REQ = { queue: 0.05, prompt: 2000, out: 300 };
function request(): Flow {
  const { queue, prompt, out } = REQ, pre = prefillS(prompt), tpot = decodeStep(1, prompt + out / 2).stepS;
  const ttft = queue + pre, total = latency(ttft, out, tpot), dec = out * tpot;
  const bars = (q: number, p: number, d: number) => [{ label: "queue", value: q }, { label: "prefill", value: p, tone: "hot" as const }, { label: "decode", value: d, tone: "warn" as const }];
  return { kind: "bars", title: `One request: ${n0(prompt)} tokens in, ${out} out`, format: sec, steps: [
    { note: `The request waits ${ms(queue)} for a free slot on the server. Under load this part grows first.`, bars: bars(queue, 0, 0) },
    { note: `Prefill reads all ${n0(prompt)} prompt tokens in one pass. That is ${n0((2 * MODEL.params * prompt) / 1000)} trillion FLOPs, so it takes about ${ms(pre)} on the example GPU. Time to first token (TTFT) is ${ms(ttft)}.`, tone: "hot", bars: bars(queue, pre, 0) },
    { note: `Decode makes one token per step. Each step reads all ${weightsGB(MODEL.params, BF16)} GB of weights plus the KV cache: about ${ms(tpot)} per token (TPOT).`, tone: "warn", bars: bars(queue, pre, tpot) },
    { note: `${out} tokens × ${ms(tpot)} = ${sec(dec)}. The whole reply takes ${sec(total)}, and decode is ${Math.round((dec / total) * 100)}% of it. Long answers are slow because of decode, not because of the prompt.`, tone: "ok", bars: bars(queue, pre, dec) },
  ] };
}

export const FLOWS_9: Record<string, Flow> = {
  "s9-request": request(),
};

