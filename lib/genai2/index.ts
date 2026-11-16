// Server-side entry: core plus every module's full text. Import it only from server code (app/ pages, checks);
// client components import ./core.ts so module text never reaches the browser.
import { MODULES } from "./stages/modules.ts";

export * from "./core.ts";

export { MODULES };
