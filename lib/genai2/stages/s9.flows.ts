// Stage 9 (Production) animated walk-throughs. Every number is computed here or in s9.calc.ts.
import type { Flow, GridStep } from "../../other/flows.ts";
import { BF16, blocksFor, BlockPool, decodeStep, latency, MODEL, n0, prefillS, weightsGB } from "./s9.calc.ts";

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

// kv-cache-paged: block tables, a shared system prompt, and freeing on finish
export const PAGE = { block: 16, sys: 32, qa: 10, qb: 5, gen: 8, pool: [7, 3, 9, 5, 1, 4, 0, 2, 6, 8] };
function blockTable(): Flow {
  const { block, sys, qa, qb, gen, pool: order } = PAGE, pool = new BlockPool(order.length, order);
  const sysBlocks = Math.floor(sys / block);
  const a: number[] = [], b: number[] = [];
  const fill = (len: number, i: number) => Math.min(block, len - i * block);
  const tab = (name: string, blocks: number[], len: number, hot: number[] = []) => ({
    label: `${name}: ${len} tokens`, head: ["logical", "physical", "tokens", "shared by"],
    rows: blocks.map((p, i) => [i, p, `${fill(len, i)}/${block}`, pool.ref.get(p) ?? 0]),
    tones: Object.fromEntries(hot.map((i) => [String(i), "hot" as const])),
  });
  const freeRow = () => ({ label: "free blocks", rows: [[pool.free.join(", ")]] });
  const steps: GridStep[] = [];
  let la = sys + qa;
  for (let i = 0; i < blocksFor(la, block); i++) a.push(pool.take());
  steps.push({ note: `Request A: a ${sys} token system prompt plus a ${qa} token question, ${la} tokens. In blocks of ${block} that is ${a.length} blocks, taken from wherever the pool has free ones. The block table maps A's logical blocks to physical ones.`, tables: [tab("A", a, la), freeRow()] });
  const lb = sys + qb;
  for (let i = 0; i < sysBlocks; i++) b.push(pool.share(a[i]));
  for (let i = sysBlocks; i < blocksFor(lb, block); i++) b.push(pool.take());
  steps.push({ note: `Request B starts with the same system prompt. Its first ${sysBlocks} blocks already hold those keys and values, so B points at them instead of computing and storing them again. Only its own ${qb} tokens need a new block.`, tone: "ok", tables: [tab("B", b, lb, Array.from({ length: sysBlocks }, (_, i) => i)), freeRow()] });
  const before = a.length;
  la += gen;
  while (a.length < blocksFor(la, block)) a.push(pool.take());
  steps.push({ note: `A generates ${gen} tokens. Its last block had ${block - fill(la - gen, before - 1)} free slots, so it fills, and ${a.length - before} new block is taken. Waste stays under one block per request.`, tone: "hot", tables: [tab("A", a, la, [a.length - 1]), freeRow()] });
  const own = a.slice(sysBlocks);
  for (const p of a) pool.drop(p);
  steps.push({ note: `A finishes. Its ${own.length} own blocks go back to the pool at once. The shared ones are still used by B, so their count drops to 1 and they stay. Cached prefixes can also be kept after use, for the next request that starts the same way.`, tone: "ok", tables: [tab("B", b, lb), freeRow()] });
  return { kind: "grid", title: "Block tables and a shared prefix", steps };
}

export const FLOWS_9: Record<string, Flow> = {
  "s9-request": request(),
  "s9-block-table": blockTable(),
};

