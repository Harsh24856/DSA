import type { FIGURE_IDS_0 } from "@/lib/genai2/stages/s0.built";
import { Stretch } from "./s0/Stretch";
import { Axes } from "./s0/Axes";

// Exactly the ids in FIGURE_IDS_0: satisfies rejects a missing or an extra key.
export const FIGURES_0 = { "s0-stretch": Stretch, "s0-axes": Axes } satisfies Record<(typeof FIGURE_IDS_0)[number], () => React.JSX.Element>;
