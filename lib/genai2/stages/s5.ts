import type { GModule } from "../types.ts";
import { DATA_PIPELINES } from "../modules/s5/data-pipelines.ts";
import { PRETRAINING_SCALING } from "../modules/s5/pretraining-scaling.ts";

export const MODULES_5: Record<string, GModule> = {
  "pretraining-scaling": PRETRAINING_SCALING,
  "data-pipelines": DATA_PIPELINES,
};
