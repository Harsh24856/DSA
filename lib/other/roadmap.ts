// CS core as a roadmap. CHAPTER_NEEDS lists, per subject, the chapters to finish before each chapter; SUBJECTS_ROAD
// orders the subjects themselves in stages, each with the subjects it builds on. System Design has its own list in
// design-roadmap.ts. `withNeeds` attaches the lists and throws if anything points forward, so every order is learnable.
import type { Subject } from "./types.ts";

export const CHAPTER_NEEDS: Record<string, Record<string, string[]>> = {
  os: {
    process: [], states: ["process"], scheduling: ["states"], sync: ["process"], deadlock: ["sync"],
    memory: ["process"], virtual: ["memory"], storage: ["process"], ipc: ["sync"],
  },
  dbms: {
    basics: [], keys: ["basics"], er: ["keys"], normal: ["keys"], acid: ["basics"], concurrency: ["acid"],
    indexing: ["keys"], scale: ["acid", "indexing"],
  },
  cn: {
    layers: [], addressing: ["layers"], transport: ["layers"], dns: ["transport"], http: ["transport"],
    url: ["dns", "http"], routing: ["addressing"], security: ["http"],
  },
  sql: {
    order: [], nulls: ["order"], joins: ["order"], grouping: ["order"], subqueries: ["joins", "grouping"],
    windows: ["grouping"], patterns: ["windows", "subqueries"], ddl: ["order"],
  },
  oops: {
    basics: [], encapsulation: ["basics"], ctors: ["basics"], inheritance: ["encapsulation", "ctors"], polymorphism: ["inheritance"],
    abstraction: ["polymorphism"], static: ["encapsulation"], relationships: ["inheritance"], solid: ["abstraction", "relationships"],
    exceptions: ["ctors"],
  },
  aptitude: {
    drill: [], numbers: [], percent: ["numbers"], si: ["percent"], ci: ["si"], ratio: ["percent"], ages: ["ratio"],
    work: ["ratio"], speed: ["ratio"], boats: ["speed"], area: ["numbers"], geometry: ["area"], counting: ["numbers"],
    probability: ["counting"], clocks: ["speed"], calendar: ["numbers"], direction: [], blood: [], mirror: [], seating: [],
    venn: [], syllogism: ["venn"], "letter-series": [], "number-series": ["numbers"], coding: ["letter-series"],
    reasoning: ["syllogism"], di: ["percent", "ratio"],
  },
  syntax: {
    basics: [], control: ["basics"], functions: ["control"], strings: ["basics"], collections: ["control"],
    classes: ["functions"], errors: ["functions"], generics: ["classes", "collections"], functional: ["functions", "collections"],
    "dsa-toolkit": ["collections"], async: ["functions"], memory: ["collections"],
  },
  react: {
    jsx: [], state: ["jsx"], lists: ["state"], effects: ["state"], forms: ["state"], react19: ["forms", "effects"],
    context: ["state"], perf: ["effects"], hooks: ["effects"], server: ["effects"], internals: ["state", "perf"],
  },
  node: {
    runtime: [], "event-loop": ["runtime"], "fs-streams": ["event-loop"], http: ["runtime"], middleware: ["http"],
    rest: ["middleware"], auth: ["rest"], data: ["rest", "event-loop"], security: ["auth"], testing: ["rest"],
  },
};

/** The subjects in learning order, in stages; `needs` are subjects worth finishing first. */
export const SUBJECTS_ROAD: { stage: string; subjects: { id: string; needs: string[] }[] }[] = [
  { stage: "Foundations", subjects: [{ id: "syntax", needs: [] }, { id: "os", needs: [] }, { id: "dbms", needs: [] }, { id: "aptitude", needs: [] }] },
  { stage: "Core", subjects: [{ id: "oops", needs: ["syntax"] }, { id: "sql", needs: ["dbms"] }, { id: "cn", needs: ["os"] }] },
  { stage: "Build", subjects: [{ id: "react", needs: ["syntax"] }, { id: "node", needs: ["syntax", "cn"] }] },
  { stage: "Design", subjects: [{ id: "design", needs: ["os", "dbms", "cn"] }] },
];

/** Checks one ordered list of ids against its needs: every id listed, every need known and earlier. */
export const checkOrder = (where: string, ids: string[], needs: Record<string, string[]>) => {
  if (ids.length !== Object.keys(needs).length || ids.some((id) => !needs[id])) throw new Error(`${where}: the roadmap and the chapter list differ`);
  ids.forEach((id, i) => { for (const n of needs[id]) { const at = ids.indexOf(n); if (at < 0 || at >= i) throw new Error(`${where}: ${id} needs ${n}, which must come before it`); } });
};
checkOrder("CS core subjects", SUBJECTS_ROAD.flatMap((s) => s.subjects.map((x) => x.id)), Object.fromEntries(SUBJECTS_ROAD.flatMap((s) => s.subjects.map((x) => [x.id, x.needs]))));

/** The subject with each chapter's `needs` set from CHAPTER_NEEDS (subjects without a list are returned as they are). */
export const withNeeds = (s: Subject): Subject => {
  const map = CHAPTER_NEEDS[s.id];
  if (!map) return s;
  checkOrder(s.id, s.chapters.map((c) => c.id), map);
  return { ...s, chapters: s.chapters.map((c) => ({ ...c, needs: map[c.id] })) };
};
