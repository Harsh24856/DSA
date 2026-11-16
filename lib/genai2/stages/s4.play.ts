// Gen AI slider walk-throughs, placed in modules by a `play` block; stage 4's registry, spread by stages/play.ts into PLAY_FLOWS.
import type { Flow } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { seededRng } from "../rng.ts";

const WORDS = ["the", "cat", "sat", "on", "mat"];

// One unit-variance number per call (Box-Muller), so a dot product of d of them has spread sqrt(d).
const gauss = (rng: () => number) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
// The first d numbers of a fixed stream: a token's vector at d = 64 starts with its vector at d = 32.
const vec = (seed: string, d: number) => { const r = seededRng(seed); return Array.from({ length: d }, () => gauss(r)); };
const softmax = (s: number[]) => { const m = Math.max(...s), e = s.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };
const r2 = (x: number) => x.toFixed(2);

function attnScale(v: Record<string, number>): Flow {
  const { d, t } = v, q = vec("query:sat", d);
  const raw = WORDS.map((w) => vec("key:" + w, d).reduce((s, k, i) => s + k * q[i], 0));
  const steps = [
    { scores: raw, say: `No scaling: scores run from ${r2(Math.min(...raw))} to ${r2(Math.max(...raw))}. Each is a sum of ${d} products, so for random vectors they grow like sqrt(${d}) = ${r2(Math.sqrt(d))}.` },
    { scores: raw.map((x) => x / Math.sqrt(d)), say: `Divide by sqrt(${d}) = ${r2(Math.sqrt(d))}: scores now run from ${r2(Math.min(...raw) / Math.sqrt(d))} to ${r2(Math.max(...raw) / Math.sqrt(d))}, the same size at any d.` },
    { scores: raw.map((x) => x / (Math.sqrt(d) * t)), say: "Temperature here is an extra divisor for illustration, not the sampling temperature. " + (t === 1 ? "At 1 it changes nothing." : t > 1 ? `At ${t} it divides again, so the weights flatten.` : `At ${t} it multiplies by ${r2(1 / t)}, so the weights sharpen.`) },
  ].map(({ scores, say }) => {
    const w = softmax(scores);
    if (w.some(Number.isNaN)) throw new PlayError("These settings give an undefined weight.");
    const top = w.indexOf(Math.max(...w));
    return { note: `${say} Largest weight: ${r2(w[top])} on "${WORDS[top]}".`, tone: w[top] > 0.9 ? "bad" as const : "ok" as const,
      bars: w.map((x, i) => ({ label: WORDS[i], value: x, tone: i === top ? "hot" as const : undefined })) };
  });
  return { kind: "bars", title: `Weights for "sat" at d = ${d}, temperature ${t}`, max: 1, format: r2, steps };
}

export const PLAY_4: Record<string, PlayFlow> = {
  "s4-attn-scale": {
    title: "Why scale by sqrt(d)",
    knobs: [
      { key: "d", label: "Head size d", min: 2, max: 256, step: 2, value: 64 },
      { key: "t", label: "Temperature", min: 0.25, max: 4, step: 0.25, value: 1 },
    ],
    make: attnScale,
  },
};
