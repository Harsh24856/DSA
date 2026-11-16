// Stage 6 (Using LLMs) slider walk-throughs, placed in modules by a `play` block. Every number is computed here.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";

const r1 = (x: number) => x.toFixed(1);
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// api-roles-streaming: when does the user first see text, with and without streaming
function stream(v: Record<string, number>): Flow {
  const { n, speed, ttft } = v, first = ttft / 1000, gen = n / speed, all = first + gen, cut = first + (0.2 * n) / speed;
  const sec = (x: number) => `${r1(x)} s`;
  const bars = (block: number, live: number) => [{ label: "blocking", value: block, tone: "warn" as const }, { label: "streaming", value: live, tone: "ok" as const }];
  return { kind: "bars", title: `${n0(n)} tokens at ${speed} per second`, max: all, format: sec, steps: [
    { note: `First words on screen. Blocking waits for the whole answer: ${sec(first)} to the first token plus ${n0(n)} / ${speed} = ${sec(gen)} of generation. Streaming shows the first token at ${sec(first)}.`, tone: "hot", bars: bars(all, first) },
    { note: `Whole answer done: ${sec(all)} either way. Streaming does not make the model faster. It only stops the user staring at a blank screen.`, bars: bars(all, all) },
    { note: `The user reads the first 20% and stops. Your app can close the stream at ${sec(cut)}; the blocking call already ran to ${sec(all)}.`, tone: "ok", bars: bars(all, cut) },
  ] };
}

// prompting-patterns: self-consistency as a majority vote of n independent samples
const comb = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
const majority = (p: number, n: number) => { let s = 0; for (let k = Math.floor(n / 2) + 1; k <= n; k++) s += comb(n, k) * p ** k * (1 - p) ** (n - k); return s; };

function vote(v: Record<string, number>): Flow {
  const p = v.p / 100, N = v.n, ns = Array.from({ length: (N + 1) / 2 }, (_, i) => 2 * i + 1), pct = (x: number) => (x ? `${Math.round(x * 100)}%` : "");
  const top = majority(p, N), worse = top < p;
  const bars = (upto: number) => ns.map((n) => ({ label: `${n} sample${n > 1 ? "s" : ""}`, value: n <= upto ? majority(p, n) : 0, tone: n === upto ? (worse && n > 1 ? "bad" as const : "hot" as const) : undefined }));
  return { kind: "bars", title: `Majority vote when one sample is right ${v.p}% of the time`, max: 1, format: pct, steps: [
    { note: `One sample at temperature above 0 is right ${v.p}% of the time. Self-consistency samples several reasoning paths and keeps the most common final answer.`, bars: bars(1) },
    { note: N === 1 ? "With one sample there is nothing to vote on. Raise the number of samples to see the vote work." : worse
      ? `With ${N} samples the majority is right only ${pct(top)} of the time: below 50%, a vote of right against wrong makes things worse.`
      : `With ${N} samples the majority is right ${pct(top)} of the time, up from ${v.p}%. Each extra pair of samples helps less than the last.`, tone: worse ? "bad" : "ok", bars: bars(N) },
    { note: `The price: ${N} calls instead of 1, so ${N} times the tokens. This model counts every wrong answer as one rival; real wrong answers often disagree, so a plurality vote can do better.`, tone: "warn", bars: bars(N) },
  ] };
}

// structured-output: chance of a valid object after each try, when error feedback fixes a share of the failures
const MAX_TRIES = 5;
function retryOdds(v: Record<string, number>): Flow {
  const p = v.p / 100, q = v.q / 100, T = v.tries;
  const fail = (k: number) => (1 - p) * (1 - q) ** (k - 1);           // still invalid after try k
  const pct = (x: number) => (x ? `${(x * 100).toFixed(1)}%` : "");
  const bars = (upto: number) => Array.from({ length: MAX_TRIES }, (_, i) => ({ label: `try ${i + 1}`, value: i < upto ? 1 - fail(i + 1) : 0, tone: i + 1 === upto ? "hot" as const : undefined }));
  const calls = 1 + Array.from({ length: T - 1 }, (_, j) => fail(j + 1)).reduce((a, b) => a + b, 0);
  const lost = 10000 * fail(T);
  return { kind: "bars", title: `${v.p}% valid first time, feedback fixes ${v.q}%`, max: 1, format: pct, steps: [
    { note: `Try 1: ${v.p}% of replies pass the validator. The rest go back with their exact errors.`, bars: bars(1) },
    { note: T === 1 ? "With one try there is no retry: every failure is final. Allow more tries to see feedback work." : `After ${T} tries, ${pct(1 - fail(T))} are valid. Each retry fixes ${v.q}% of what is still failing.`, tone: T > 1 && q > 0 ? "ok" : "warn", bars: bars(T) },
    { note: `On average ${calls.toFixed(2)} calls per document, and about ${n0(lost)} of every 10,000 still fail. Those must fail loudly, not slip into your database.`, tone: lost >= 1 ? "warn" : "ok", bars: bars(T) },
  ] };
}

export const PLAY_6: Record<string, PlayFlow> = {
  "s6-retry-odds": {
    title: "Validate and retry: how many get through?",
    knobs: [
      { key: "p", label: "Valid on the first try (%)", min: 50, max: 99, step: 1, value: 90 },
      { key: "q", label: "Retry fixes (%)", min: 0, max: 100, step: 10, value: 80 },
      { key: "tries", label: "Tries allowed", min: 1, max: MAX_TRIES, step: 1, value: 3 },
    ],
    make: retryOdds,
  },
  "s6-vote": {
    title: "Self-consistency: is a vote worth it?",
    knobs: [
      { key: "p", label: "One sample right (%)", min: 30, max: 95, step: 5, value: 70 },
      { key: "n", label: "Samples (odd)", min: 1, max: 15, step: 2, value: 9 },
    ],
    make: vote,
  },
  "s6-stream": {
    title: "Streaming: when does text appear?",
    knobs: [
      { key: "n", label: "Answer length (tokens)", min: 50, max: 2000, step: 50, value: 400 },
      { key: "speed", label: "Tokens per second", min: 10, max: 150, step: 10, value: 50 },
      { key: "ttft", label: "Time to first token (ms)", min: 100, max: 3000, step: 100, value: 500 },
    ],
    make: stream,
  },
};

void PlayError;
