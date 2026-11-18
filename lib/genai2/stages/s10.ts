import type { GModule } from "../types.ts";
import { REASONING_MODELS } from "../modules/s10/reasoning-models.ts";
import { MIXTURE_OF_EXPERTS } from "../modules/s10/mixture-of-experts.ts";
import { STATE_SPACE_HYBRIDS } from "../modules/s10/state-space-hybrids.ts";
import { LONG_CONTEXT } from "../modules/s10/long-context.ts";

export const MODULES_10: Record<string, GModule> = {
  "reasoning-models": REASONING_MODELS,
  "mixture-of-experts": MIXTURE_OF_EXPERTS,
  "state-space-hybrids": STATE_SPACE_HYBRIDS,
  "long-context": LONG_CONTEXT,
};
