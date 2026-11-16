import type { GModule } from "../types.ts";
import { API_ROLES_STREAMING } from "../modules/s6/api-roles-streaming.ts";

export const MODULES_6: Record<string, GModule> = {
  "api-roles-streaming": API_ROLES_STREAMING,
};
