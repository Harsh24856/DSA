import type { GModule } from "../types.ts";
import { TIME_MEMORY } from "../modules/s9/time-memory.ts";

export const MODULES_9: Record<string, GModule> = {
  "time-memory": TIME_MEMORY,
};
