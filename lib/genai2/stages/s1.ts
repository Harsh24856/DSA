import type { GModule } from "../types.ts";
import { LEARNING_AS_FITTING } from "../modules/s1/learning-as-fitting.ts";
import { LOSS_GRADIENT_DESCENT } from "../modules/s1/loss-gradient-descent.ts";
import { OVERFITTING_EVALUATION } from "../modules/s1/overfitting-evaluation.ts";
import { TEXT_AS_NUMBERS } from "../modules/s1/text-as-numbers.ts";

export const MODULES_1: Record<string, GModule> = {
  "learning-as-fitting": LEARNING_AS_FITTING, "loss-gradient-descent": LOSS_GRADIENT_DESCENT, "overfitting-evaluation": OVERFITTING_EVALUATION,
  "text-as-numbers": TEXT_AS_NUMBERS,
};
