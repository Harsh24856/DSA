import type { FIGURE_IDS_2 } from "@/lib/genai2/stages/s2.built";
import { Neuron } from "./s2/Neuron";
import { Shapes } from "./s2/Shapes";
import { Graph } from "./s2/Graph";
import { Schedule } from "./s2/Schedule";
import { Init } from "./s2/Init";
import { Norms } from "./s2/Norms";
import { Receptive } from "./s2/Receptive";

// Exactly the ids in FIGURE_IDS_2: satisfies rejects a missing or an extra key.
export const FIGURES_2 = { "s2-neuron": Neuron, "s2-shapes": Shapes, "s2-graph": Graph, "s2-schedule": Schedule, "s2-init": Init, "s2-norms": Norms, "s2-receptive": Receptive } satisfies Record<(typeof FIGURE_IDS_2)[number], () => React.JSX.Element>;
