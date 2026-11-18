import { BUILT_0, FIGURE_IDS_0 } from "./s0.built.ts";
import { BUILT_1, FIGURE_IDS_1 } from "./s1.built.ts";
import { BUILT_2, FIGURE_IDS_2 } from "./s2.built.ts";
import { BUILT_3, FIGURE_IDS_3 } from "./s3.built.ts";
import { BUILT_4, FIGURE_IDS_4 } from "./s4.built.ts";
import { BUILT_5, FIGURE_IDS_5 } from "./s5.built.ts";
import { BUILT_6, FIGURE_IDS_6 } from "./s6.built.ts";
import { BUILT_7, FIGURE_IDS_7 } from "./s7.built.ts";
import { BUILT_8, FIGURE_IDS_8 } from "./s8.built.ts";
import { BUILT_9, FIGURE_IDS_9 } from "./s9.built.ts";
import { BUILT_10, FIGURE_IDS_10 } from "./s10.built.ts";

// Client-safe: only the per-stage .built files, never the module text.
export const BUILT: readonly string[] = [...BUILT_0, ...BUILT_1, ...BUILT_2, ...BUILT_3, ...BUILT_4, ...BUILT_5, ...BUILT_6, ...BUILT_7, ...BUILT_8, ...BUILT_9, ...BUILT_10, ];
export const FIGURE_IDS = [...FIGURE_IDS_0, ...FIGURE_IDS_1, ...FIGURE_IDS_2, ...FIGURE_IDS_3, ...FIGURE_IDS_4, ...FIGURE_IDS_5, ...FIGURE_IDS_6, ...FIGURE_IDS_7, ...FIGURE_IDS_8, ...FIGURE_IDS_9, ...FIGURE_IDS_10, ] as const;
