import { shuffle } from "../practice.ts";
import { ROAD, withNeeds } from "./roadmap.ts";
import { SELF_ATTENTION } from "./modules/self-attention.ts";
import type { GModule, RoadEntry, Stage } from "./types.ts";

export { withNeeds };
export type { Block, GModule, GQuestion, Level, RoadEntry, Stage } from "./types.ts";

export const MODULES: Record<string, GModule> = { "self-attention": SELF_ATTENTION };

// Every figure id has a component in components/genai2/figures (genai.check.ts compares the two).
export const FIGURE_IDS = ["qkv"] as const;

export const STAGES: Stage[] = ROAD.map(s => ({ ...s, modules: s.modules.map(m => ({ ...m, built: m.id in MODULES })) }));

export const entry = (id: string): RoadEntry | undefined => STAGES.flatMap(s => s.modules).find(m => m.id === id);
export const moduleKey = (id: string) => "genai2:" + id;
export const questionKey = (m: string, q: string) => "genaiq:" + m + ":" + q;

export const nextUp = (done: Record<string, unknown>): string | undefined =>
  STAGES.flatMap(s => s.modules).find(m => !done[moduleKey(m.id)])?.id;

// Deterministic rng from a string (FNV-1a hash into mulberry32), so server and client shuffle alike.
export const seededRng = (seed: string): (() => number) => {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const mcqOptions = (q: { answer: string; wrong: string[] }, rng: () => number = Math.random): string[] =>
  shuffle([q.answer, ...q.wrong], rng);
