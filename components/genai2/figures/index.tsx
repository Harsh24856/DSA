import { FIGURES_0 } from "./s0";
import { FIGURES_1 } from "./s1";
import { FIGURES_2 } from "./s2";
import { FIGURES_3 } from "./s3";
import { FIGURES_4 } from "./s4";
import { FIGURES_5 } from "./s5";
import { FIGURES_6 } from "./s6";
import { FIGURES_7 } from "./s7";
import { FIGURES_8 } from "./s8";
import { FIGURES_9 } from "./s9";
import { FIGURES_10 } from "./s10";
import type { FIGURE_IDS } from "@/lib/genai2/core";

// Type check only: Blocks loads one stage map at a time. Each stage owns its sN.tsx, whose keys are checked against FIGURE_IDS_N there.
export const FIGURES: Record<(typeof FIGURE_IDS)[number], () => React.JSX.Element> = { ...FIGURES_0, ...FIGURES_1, ...FIGURES_2, ...FIGURES_3, ...FIGURES_4, ...FIGURES_5, ...FIGURES_6, ...FIGURES_7, ...FIGURES_8, ...FIGURES_9, ...FIGURES_10, };
