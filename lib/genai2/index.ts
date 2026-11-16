// Server-side entry: core plus every module's full text. Import it only from server code (app/ pages, checks);
// client components import ./core.ts so module text never reaches the browser.
import { SELF_ATTENTION } from "./modules/self-attention.ts";
import type { GModule } from "./types.ts";

export * from "./core.ts";

export const MODULES: Record<string, GModule> = { "self-attention": SELF_ATTENTION };
