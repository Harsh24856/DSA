import type { Diagram } from "../diagram";

export type Complexity = { best: string; average: string; worst: string; space: string; note: string };
export type Viz = { make: (input?: string) => Diagram; input?: string; label?: string };
export type Pattern = {
  n: number; name: string; summary: string;
  signals: string[]; idea: string[]; steps: string[]; code: string;
  complexity: Complexity; traps: string[]; viz: Viz;
};
export type Topic = { id: string; name: string; blurb: string; basics: string[]; patterns: Pattern[] };

/** "1, 2, 3" → [1, 2, 3]; ignores junk, caps length so the visualiser stays readable. */
export const nums = (s: string | undefined, fallback: number[], max = 12) => {
  const v = (s ?? "").split(/[\s,]+/).filter(Boolean).map(Number).filter((x) => Number.isFinite(x)).slice(0, max);
  return v.length ? v : fallback;
};
export const text = (s: string | undefined, fallback: string, max = 16) => ((s ?? "").trim() || fallback).slice(0, max);
