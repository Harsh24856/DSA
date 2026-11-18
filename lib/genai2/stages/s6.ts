import type { GModule } from "../types.ts";
import { API_ROLES_STREAMING } from "../modules/s6/api-roles-streaming.ts";
import { PROMPTING_PATTERNS } from "../modules/s6/prompting-patterns.ts";
import { STRUCTURED_OUTPUT } from "../modules/s6/structured-output.ts";
import { CONTEXT_CACHING } from "../modules/s6/context-caching.ts";
import { LOCAL_MODELS } from "../modules/s6/local-models.ts";
import { EVALS_JUDGE } from "../modules/s6/evals-judge.ts";

export const MODULES_6: Record<string, GModule> = {
  "api-roles-streaming": API_ROLES_STREAMING,
  "prompting-patterns": PROMPTING_PATTERNS,
  "structured-output": STRUCTURED_OUTPUT,
  "context-caching": CONTEXT_CACHING,
  "local-models": LOCAL_MODELS,
  "evals-judge": EVALS_JUDGE,
};
