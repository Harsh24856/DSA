import type { GModule } from "../types.ts";
import { TIME_MEMORY } from "../modules/s9/time-memory.ts";
import { KV_CACHE_PAGED } from "../modules/s9/kv-cache-paged.ts";
import { BATCHING_ENGINES } from "../modules/s9/batching-engines.ts";

export const MODULES_9: Record<string, GModule> = {
  "time-memory": TIME_MEMORY,
  "kv-cache-paged": KV_CACHE_PAGED,
  "batching-engines": BATCHING_ENGINES,
};
