// Client-safe half of lib/genai2: nothing here may import the index, the module registry or ./modules/ (genai.check.ts scans for it).
// Components import this file only, so the browser never receives module text.
import { shuffle } from "../practice.ts";
import { ROAD, withNeeds } from "./roadmap.ts";
import { seededRng } from "./rng.ts";
import type { RoadEntry, Stage } from "./types.ts";

export { seededRng, withNeeds };
export type { Block, GModule, GQuestion, Level, RoadEntry, Stage } from "./types.ts";

// Ids of the modules that exist (genai.check.ts compares this with the registry); lists live in stages/sN.built.ts.
export { BUILT, FIGURE_IDS } from "./stages/built.ts";
import { BUILT } from "./stages/built.ts";


export const STAGES: Stage[] = ROAD.map(s => ({ ...s, modules: s.modules.map(m => ({ ...m, built: BUILT.includes(m.id) })) }));

export const entry = (id: string): RoadEntry | undefined => STAGES.flatMap(s => s.modules).find(m => m.id === id);
export const moduleKey = (id: string) => "genai2:" + id;
export const questionKey = (m: string, q: string) => "genaiq:" + m + ":" + q;

// The first built module not done yet; while modules are still being built, fall back to the first undone one.
export const nextUp = (done: Record<string, unknown>): string | undefined => {
  const todo = STAGES.flatMap(s => s.modules).filter(m => !done[moduleKey(m.id)]);
  return (todo.find(m => m.built) ?? todo[0])?.id;
};

export const mcqOptions = (q: { answer: string; wrong: string[] }, rng: () => number = Math.random): string[] =>
  shuffle([q.answer, ...q.wrong], rng);
