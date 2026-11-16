import type { FIGURE_IDS_3 } from "@/lib/genai2/stages/s3.built";

// Exactly the ids in FIGURE_IDS_3: satisfies rejects a missing or an extra key.
export const FIGURES_3 = {} satisfies Record<(typeof FIGURE_IDS_3)[number], () => React.JSX.Element>;
