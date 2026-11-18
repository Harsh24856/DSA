import type { GModule } from "../types.ts";
import { LEARNING_AS_FITTING } from "../modules/s1/learning-as-fitting.ts";
import { LOSS_GRADIENT_DESCENT } from "../modules/s1/loss-gradient-descent.ts";

export const MODULES_1: Record<string, GModule> = { "learning-as-fitting": LEARNING_AS_FITTING, "loss-gradient-descent": LOSS_GRADIENT_DESCENT };
