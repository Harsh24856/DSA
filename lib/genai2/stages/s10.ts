import type { GModule } from "../types.ts";
import { REASONING_MODELS } from "../modules/s10/reasoning-models.ts";

export const MODULES_10: Record<string, GModule> = {
  "reasoning-models": REASONING_MODELS,
};
