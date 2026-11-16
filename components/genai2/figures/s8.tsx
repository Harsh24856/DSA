import type { FIGURE_IDS_8 } from "@/lib/genai2/stages/s8.built";

// Exactly the ids in FIGURE_IDS_8: satisfies rejects a missing or an extra key.
export const FIGURES_8 = {} satisfies Record<(typeof FIGURE_IDS_8)[number], () => React.JSX.Element>;
