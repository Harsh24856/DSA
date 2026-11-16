import type { GModule } from "../types.ts";
import { NEURON_ACTIVATIONS } from "../modules/s2/neuron-activations.ts";
import { MLP_FORWARD } from "../modules/s2/mlp-forward.ts";

export const MODULES_2: Record<string, GModule> = { "neuron-activations": NEURON_ACTIVATIONS, "mlp-forward": MLP_FORWARD };
