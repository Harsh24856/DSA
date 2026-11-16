import type { FIGURE_IDS_6 } from "@/lib/genai2/stages/s6.built";

// Exactly the ids in FIGURE_IDS_6: satisfies rejects a missing or an extra key.
export const FIGURES_6 = {} satisfies Record<(typeof FIGURE_IDS_6)[number], () => React.JSX.Element>;
