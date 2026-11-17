import type { GModule } from "../types.ts";
import { NEURON_ACTIVATIONS } from "../modules/s2/neuron-activations.ts";
import { MLP_FORWARD } from "../modules/s2/mlp-forward.ts";
import { BACKPROP_GRAPH } from "../modules/s2/backprop-graph.ts";
import { OPTIMISERS } from "../modules/s2/optimisers.ts";
import { DEEP_NETS_TRAIN } from "../modules/s2/deep-nets-train.ts";

export const MODULES_2: Record<string, GModule> = { "neuron-activations": NEURON_ACTIVATIONS, "mlp-forward": MLP_FORWARD, "backprop-graph": BACKPROP_GRAPH, "optimisers": OPTIMISERS, "deep-nets-train": DEEP_NETS_TRAIN };
