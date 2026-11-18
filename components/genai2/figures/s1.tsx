import type { FIGURE_IDS_1 } from "@/lib/genai2/stages/s1.built";
import { Fit } from "./s1/Fit";
import { Bowl } from "./s1/Bowl";
import { Curves } from "./s1/Curves";

// Exactly the ids in FIGURE_IDS_1: satisfies rejects a missing or an extra key.
export const FIGURES_1 = { "s1-fit": Fit, "s1-bowl": Bowl, "s1-curves": Curves } satisfies Record<(typeof FIGURE_IDS_1)[number], () => React.JSX.Element>;
