// Stage 9 (Production) animated walk-throughs. Every number is computed here or in s9.calc.ts.
import type { ChainStep, Flow, GridStep, LaneStep } from "../../other/flows.ts";
import { BF16, blocksFor, BlockPool, decodeStep, expected, kvPerToken, ROLL, latency, MODEL, n0, prefillS, weightsGB } from "./s9.calc.ts";

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

// batching-engines: a long prompt arrives while others are streaming; chunked prefill, then separate prefill and decode pools
export const LONGP = { prompt: 32768, chunk: 2048, batch: 32, ctx: 2048 };
function longPrompt(): Flow {
  const { prompt, chunk, batch, ctx } = LONGP, full = prefillS(prompt), part = prefillS(chunk), step = decodeStep(batch, ctx).stepS;
  return { kind: "lanes", title: "A long prompt meets a busy server", lanes: ["Router", "Prefill", "Decode"], steps: [
    { from: 2, to: 2, label: `${batch} users streaming`, note: `${batch} users are mid-answer. Each decode step takes about ${ms(step)}, so every user sees a new token that often.` },
    { from: 0, to: 1, label: `${n0(prompt)} token prompt`, note: `A request arrives with a ${n0(prompt)} token document. Its prefill takes about ${ms(full)} on the example GPU, for the weight multiplies alone.`, tone: "warn" },
    { from: 1, to: 1, label: `stall: ${ms(full)}`, note: `On one GPU running both phases, that pass blocks the batch: ${batch} users get no token for ${ms(full)}, about ${Math.round(full / step)} missed steps. The stream visibly freezes.`, tone: "bad" },
    { from: 1, to: 1, label: `chunks of ${n0(chunk)}`, note: `Chunked prefill cuts the prompt into ${prompt / chunk} pieces of ${n0(chunk)} tokens and runs one piece alongside each decode step. Each piece adds about ${ms(part)}, so the others keep streaming.`, tone: "hot" },
    { from: 0, to: 1, label: "prefill pool", note: "Larger services go further and split the phases: prefill on one pool of GPUs tuned for compute, decode on another tuned for memory bandwidth." },
    { from: 1, to: 2, label: "send KV cache", note: `When prefill ends, its KV cache moves to a decode GPU: ${n0(prompt)} × ${kvPerToken() / 1024} KiB = ${(prompt * kvPerToken() / 2 ** 30).toFixed(0)} GiB here. Moving it costs network time, which is the price of the split.`, tone: "warn" },
    { from: 2, to: 0, label: "tokens stream", note: "The new user joins the running decode batch in the next step. Neither phase waits on the other.", tone: "ok" },
  ] };
}

// speculative-decoding: three rounds of draft and verify, counting large-model passes
export const SPEC_ROUNDS = { k: 4, accepted: [3, 4, 0] };
function specRounds(): Flow {
  const { k, accepted } = SPEC_ROUNDS;
  let total = 0;
  const steps: LaneStep[] = [];
  accepted.forEach((n, r) => {
    const got = n + 1;   // accepted draft tokens, plus one token from the large model (a correction, or a bonus if all were accepted)
    total += got;
    steps.push({ from: 0, to: 1, label: `round ${r + 1}: ${k} guesses`, note: r === 0 ? `The small draft model writes ${k} tokens one by one. It is cheap, so this takes a fraction of one large step.` : `${k} new guesses, starting after the ${total - got} tokens kept so far.` });
    steps.push({ from: 1, to: 1, label: `check ${k} in 1 pass`, note: r === 0 ? `The large model scores all ${k} guesses at once, like a short prefill. Decode is memory bound, so checking ${k + 1} positions costs about the same as making 1.` : `Again one pass for all ${k} guesses.`, tone: "hot" });
    steps.push({ from: 1, to: 0, label: n === k ? `all ${k} kept + 1 bonus` : n === 0 ? "first guess wrong" : `${n} kept, then a fix`, note: n === k
      ? `Every guess matches, and the same pass gives one more token for free: ${got} tokens. ${total} so far, in ${r + 1} large passes.`
      : n === 0 ? `The first guess is rejected. The large model's own token replaces it, so the round still makes ${got} token, no worse than plain decoding. ${total} so far, in ${r + 1} passes.`
      : `It keeps ${n} and rejects guess ${n + 1}, replacing it with its own choice. Guesses after it are thrown away. ${got} tokens: ${total} so far, in ${r + 1} large pass${r ? "es" : ""}.`, tone: n === 0 ? "warn" : "ok" });
  });
  steps.push({ from: 1, to: 0, label: `${total} tokens, ${accepted.length} passes`, note: `Plain decoding would need ${total} large passes for ${total} tokens. Here it took ${accepted.length}, plus ${k * accepted.length} draft steps. The accept rule keeps the output distribution exactly the large model's.`, tone: "ok" });
  return { kind: "lanes", title: "Draft, verify, repeat", lanes: ["Draft model", "Large model"], steps };
}

// observability-rollouts: a staged rollout of a new prompt, with a gate at each stage
export const CANARY = { stages: [0.01, 0.1, 0.5, 1], minutes: 30, baseBad: 0.02, newBad: 0.03 };
function canary(): Flow {
  const { stages, minutes, baseBad, newBad } = CANARY, per = ROLL.perMin;
  const seen = (share: number) => per * share * minutes;
  const steps: ChainStep[] = [
    { node: "shadow: 0% of users see it", note: `The new prompt runs on copies of real requests, and its answers are thrown away. You see its cost, latency and judge scores on real inputs with no user risk.` },
    ...stages.slice(0, 2).map((s, i): ChainStep => {
      const n = seen(s), exp = expected(n, baseBad), got = expected(n, newBad), z = (got - exp) / Math.sqrt(exp);
      return { node: `canary: ${Math.round(s * 100)}% of traffic`, tone: i === 1 ? "bad" : "hot", note: i === 0
        ? `${Math.round(s * 100)}% of ${n0(per)} requests a minute for ${minutes} min is ${n0(n)} requests. The old prompt's bad-answer rate is ${baseBad * 100}%, so about ${n0(exp)} flagged answers are normal. The canary shows ${n0(got)}, ${z.toFixed(1)} standard deviations above: suspicious, but small counts are noisy. The gate passes with a warning.`
        : `At ${Math.round(s * 100)}%, ${n0(n)} requests: about ${n0(exp)} expected, ${n0(got)} seen. Now the gap is ${z.toFixed(1)} standard deviations: not noise. The gate fails.` };
    }),
    { node: "roll back to the old prompt", tone: "ok", note: `Rolling back is one config change, because prompts are versioned like code. ${n0(seen(stages[0]) * newBad + seen(stages[1]) * newBad - (seen(stages[0]) + seen(stages[1])) * baseBad)} extra bad answers reached users, against ${n0(per * minutes * (newBad - baseBad))} in the same ${minutes} min had it gone to everyone at once.` },
    { node: "bad cases join the eval set", note: "Pull the flagged answers, find why, and add them to the offline set so CI catches this class of failure next time." },
  ];
  return { title: "Rolling out a new prompt", steps };
}

export const FLOWS_9: Record<string, Flow> = {
  "s9-canary": canary(),
  "s9-spec-rounds": specRounds(),
  "s9-long-prompt": longPrompt(),
  "s9-request": request(),
  "s9-block-table": blockTable(),
};

