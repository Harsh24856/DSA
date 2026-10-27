// Hand-written solutions, keyed by LeetCode slug. Everything else falls back to its closest pattern.
import { ARRAY_SOLUTIONS } from "./arrays.ts";
import { STRUCT_SOLUTIONS } from "./structures.ts";
import { SQL_SOLUTIONS } from "./sql.ts";
import type { Solution } from "./types";

export const SOLUTIONS: Record<string, Solution> = { ...ARRAY_SOLUTIONS, ...STRUCT_SOLUTIONS, ...SQL_SOLUTIONS };
export type { Solution };
