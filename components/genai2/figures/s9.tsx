import type { FIGURE_IDS_9 } from "@/lib/genai2/stages/s9.built";

// Exactly the ids in FIGURE_IDS_9: satisfies rejects a missing or an extra key.
export const FIGURES_9 = {} satisfies Record<(typeof FIGURE_IDS_9)[number], () => React.JSX.Element>;
