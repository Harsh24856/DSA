// Stage 2 (Neural networks): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow, GridTable } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { ACTS, fmt } from "./s2.flows.ts";

// Neuron and activations: output and slope of each activation at z, then the slope multiplied through n layers sitting at the same z.
function actSlope(v: Record<string, number>): Flow {
  const { z, n } = v;
  const outs = ACTS.map((a) => a.f(z)), slopes = ACTS.map((a) => a.d(z)), deep = slopes.map((s) => s ** n);
  const tone = (s: number) => (Math.abs(s) < 0.05 ? "bad" as const : Math.abs(s) > 1.05 ? "warn" as const : Math.abs(s) >= 0.95 ? "ok" as const : undefined);
  const tones = (vals: number[], col: number) => Object.fromEntries(vals.flatMap((s, i) => { const t = tone(s); return t ? [[`${i}:${col}`, t]] : []; })) as GridTable["tones"];
  const dead = ACTS.filter((_, i) => Math.abs(slopes[i]) < 0.05).map((a) => a.name);
  const lost = ACTS.filter((_, i) => Math.abs(deep[i]) < 1e-3).map((a) => a.name);
  const grew = ACTS.filter((_, i) => Math.abs(deep[i]) > 10).map((a) => a.name);
  return { kind: "grid", title: `Activations at z = ${z}`, steps: [
    { note: `The same input z = ${z} through six activations. ReLU and its cousins pass large positive z almost unchanged; sigmoid and tanh squash everything into a fixed range.`,
      tables: [{ head: ["activation", "output"], rows: ACTS.map((a, i) => [a.name, fmt(outs[i])]) }] },
    { note: dead.length ? `Slopes at z = ${z}. ${dead.join(", ")} ${dead.length > 1 ? "have" : "has"} a slope under 0.05 here, so almost no gradient flows back through ${dead.length > 1 ? "them" : "it"}.` : `Slopes at z = ${z}. Every activation still passes a useful gradient here.`,
      tone: dead.length ? "warn" : "ok",
      tables: [{ head: ["activation", "output", "slope"], rows: ACTS.map((a, i) => [a.name, fmt(outs[i]), fmt(slopes[i])]), tones: tones(slopes, 2) }] },
    { note: `If ${n} layers all sat at this z, the backward pass multiplies ${n} slopes together.${lost.length ? ` ${lost.join(", ")}: under 0.001, the gradient has vanished.` : ""}${grew.length ? ` ${grew.join(", ")}: over 10, it grows.` : ""} A slope of exactly 1 keeps it intact.`,
      tone: lost.length ? "bad" : "ok",
      tables: [{ head: ["activation", "slope", `slope^${n}`], rows: ACTS.map((a, i) => [a.name, fmt(slopes[i]), fmt(deep[i])]), tones: tones(deep, 2) }] },
  ] };
}

export const PLAY_2: Record<string, PlayFlow> = {
  "s2-act-slope": {
    title: "Where activations pass the gradient",
    knobs: [
      { key: "z", label: "Input z", min: -6, max: 6, step: 0.5, value: -2 },
      { key: "n", label: "Layers", min: 1, max: 30, step: 1, value: 10 },
    ],
    make: actSlope,
  },
};
