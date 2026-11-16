import type { FIGURE_IDS } from "@/lib/genai2";

// One small component per figure id; Task 4 adds them.
export const FIGURES: Record<(typeof FIGURE_IDS)[number], () => React.JSX.Element> = {};
