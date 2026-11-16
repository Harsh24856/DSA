import type { FIGURE_IDS_5 } from "@/lib/genai2/stages/s5.built";

// Exactly the ids in FIGURE_IDS_5: satisfies rejects a missing or an extra key.
export const FIGURES_5 = {} satisfies Record<(typeof FIGURE_IDS_5)[number], () => React.JSX.Element>;
