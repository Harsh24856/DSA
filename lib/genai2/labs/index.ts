// Server-only: lab content (references and hidden tests). Client components get one lab as props
// and import ./harness.ts and ./types.ts only.
import { TRANSFORMER } from "./transformer.ts";
import type { Lab } from "./types.ts";

export const LABS: Record<string, Lab> = { [TRANSFORMER.id]: TRANSFORMER };
