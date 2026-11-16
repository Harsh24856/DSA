import type { GModule } from "../types.ts";
import { API_ROLES_STREAMING } from "../modules/s6/api-roles-streaming.ts";
import { PROMPTING_PATTERNS } from "../modules/s6/prompting-patterns.ts";

export const MODULES_6: Record<string, GModule> = {
  "api-roles-streaming": API_ROLES_STREAMING,
  "prompting-patterns": PROMPTING_PATTERNS,
};
