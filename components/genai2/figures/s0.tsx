import type { FIGURE_IDS_0 } from "@/lib/genai2/stages/s0.built";

// Exactly the ids in FIGURE_IDS_0: satisfies rejects a missing or an extra key.
export const FIGURES_0 = {} satisfies Record<(typeof FIGURE_IDS_0)[number], () => React.JSX.Element>;
