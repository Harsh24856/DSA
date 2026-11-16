import type { FIGURE_IDS_2 } from "@/lib/genai2/stages/s2.built";
import { Neuron } from "./s2/Neuron";
import { Shapes } from "./s2/Shapes";
import { Graph } from "./s2/Graph";
import { Schedule } from "./s2/Schedule";

// Exactly the ids in FIGURE_IDS_2: satisfies rejects a missing or an extra key.
export const FIGURES_2 = { "s2-neuron": Neuron, "s2-shapes": Shapes, "s2-graph": Graph, "s2-schedule": Schedule } satisfies Record<(typeof FIGURE_IDS_2)[number], () => React.JSX.Element>;
