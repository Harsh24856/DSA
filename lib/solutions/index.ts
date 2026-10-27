// Hand-written solutions, keyed by LeetCode slug. Everything else falls back to its closest pattern.
import { ARRAY_SOLUTIONS } from "./arrays.ts";
import { STRUCT_SOLUTIONS } from "./structures.ts";
import { SQL_SOLUTIONS } from "./sql.ts";
import { BATCH1 } from "./batch1.ts";
import { BATCH2 } from "./batch2.ts";
import { BATCH3 } from "./batch3.ts";
import { BATCH4 } from "./batch4.ts";
import { SQL2 } from "./sql2.ts";
import type { Solution } from "./types";

export const SOLUTIONS: Record<string, Solution> = { ...ARRAY_SOLUTIONS, ...STRUCT_SOLUTIONS, ...SQL_SOLUTIONS, ...BATCH1, ...BATCH2, ...BATCH3, ...BATCH4, ...SQL2 };
export type { Solution };
