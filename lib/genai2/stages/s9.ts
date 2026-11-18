import type { GModule } from "../types.ts";
import { TIME_MEMORY } from "../modules/s9/time-memory.ts";
import { KV_CACHE_PAGED } from "../modules/s9/kv-cache-paged.ts";
import { BATCHING_ENGINES } from "../modules/s9/batching-engines.ts";
import { QUANTISATION } from "../modules/s9/quantisation.ts";
import { SPECULATIVE_DECODING } from "../modules/s9/speculative-decoding.ts";
import { EVALS_JUDGE } from "../modules/s9/evals-judge.ts";
import { OBSERVABILITY_ROLLOUTS } from "../modules/s9/observability-rollouts.ts";
import { SECURITY_GUARDRAILS } from "../modules/s9/security-guardrails.ts";

export const MODULES_9: Record<string, GModule> = {
  "time-memory": TIME_MEMORY,
  "kv-cache-paged": KV_CACHE_PAGED,
  "batching-engines": BATCHING_ENGINES,
  quantisation: QUANTISATION,
  "speculative-decoding": SPECULATIVE_DECODING,
  "evals-judge": EVALS_JUDGE,
  "observability-rollouts": OBSERVABILITY_ROLLOUTS,
  "security-guardrails": SECURITY_GUARDRAILS,
};
