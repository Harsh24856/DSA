import type { GModule } from "../types.ts";
import { SELF_ATTENTION } from "../modules/s4/self-attention.ts";

export const MODULES_4: Record<string, GModule> = { "self-attention": SELF_ATTENTION };
