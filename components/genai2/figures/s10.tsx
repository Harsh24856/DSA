import type { FIGURE_IDS_10 } from "@/lib/genai2/stages/s10.built";

// Exactly the ids in FIGURE_IDS_10: satisfies rejects a missing or an extra key.
export const FIGURES_10 = {} satisfies Record<(typeof FIGURE_IDS_10)[number], () => React.JSX.Element>;
