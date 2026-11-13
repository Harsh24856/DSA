import type { Diagram } from "../diagram";

export type Complexity = { best: string; average: string; worst: string; space: string; note: string };
export type Viz = { make: (input?: string) => Diagram; input?: string; label?: string };
export type Pattern = {
  n: number; name: string; summary: string;
  signals: string[]; idea: string[]; steps: string[]; code: string;
  complexity: Complexity; traps: string[]; viz: Viz;
  theory?: string[];   // deeper theory, from lib/patterns/deep/<topic>.ts
  cpp?: string;        // C++ template, from lib/patterns/cpp/<topic>__<n>.cpp (tested by cpp_test.py --patterns)
};
/** One operation of a data structure: average cost, worst cost and what to remember. */
export type OpRow = [operation: string, average: string, worst: string, note: string];
/** Everything about the data structure (or technique) behind a topic, shown on the topic's Overview. */
export type TopicOverview = {
  what: string[];                              // what it is and how it sits in memory
  build: string[];                             // how it is implemented from scratch
  code: string;                                // Python implementation from scratch; the C++ one is lib/patterns/cpp/<topic>__0.cpp
  ops: { title: string; rows: OpRow[] }[];     // every operation with its cost
  builtins: [need: string, cpp: string, python: string][];   // what the standard libraries already give you
  when: string[];                              // hints: reach for it when ...
  avoid: string[];                             // ... and when something else is better
  tips: string[];                              // interview tips and classic mistakes
  viz: (Viz & { name: string })[];             // visualisers of the structure's own operations
};
export type Topic = { id: string; name: string; blurb: string; basics: string[]; patterns: Pattern[]; overview?: TopicOverview; cpp?: string };

/** "1, 2, 3" → [1, 2, 3]; ignores junk, caps length so the visualiser stays readable. */
export const nums = (s: string | undefined, fallback: number[], max = 12) => {
  const v = (s ?? "").split(/[\s,]+/).filter(Boolean).map(Number).filter((x) => Number.isFinite(x)).slice(0, max);
  return v.length ? v : fallback;
};
export const text = (s: string | undefined, fallback: string, max = 16) => ((s ?? "").trim() || fallback).slice(0, max);
