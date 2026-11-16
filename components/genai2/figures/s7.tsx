import type { FIGURE_IDS_7 } from "@/lib/genai2/stages/s7.built";

// Exactly the ids in FIGURE_IDS_7: satisfies rejects a missing or an extra key.
export const FIGURES_7 = {} satisfies Record<(typeof FIGURE_IDS_7)[number], () => React.JSX.Element>;
