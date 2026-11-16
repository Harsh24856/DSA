import { shuffle } from "../practice.ts";
import { ROAD, withNeeds } from "./roadmap.ts";
import { seededRng } from "./rng.ts";
import { SELF_ATTENTION } from "./modules/self-attention.ts";
import type { GModule, RoadEntry, Stage } from "./types.ts";

export { seededRng, withNeeds };
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

export const mcqOptions = (q: { answer: string; wrong: string[] }, rng: () => number = Math.random): string[] =>
  shuffle([q.answer, ...q.wrong], rng);
