import type { FIGURE_IDS_1 } from "@/lib/genai2/stages/s1.built";

// Exactly the ids in FIGURE_IDS_1: satisfies rejects a missing or an extra key.
export const FIGURES_1 = {} satisfies Record<(typeof FIGURE_IDS_1)[number], () => React.JSX.Element>;
