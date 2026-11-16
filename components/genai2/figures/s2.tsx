import type { FIGURE_IDS_2 } from "@/lib/genai2/stages/s2.built";
import { Neuron } from "./s2/Neuron";

// Exactly the ids in FIGURE_IDS_2: satisfies rejects a missing or an extra key.
export const FIGURES_2 = { "s2-neuron": Neuron } satisfies Record<(typeof FIGURE_IDS_2)[number], () => React.JSX.Element>;
