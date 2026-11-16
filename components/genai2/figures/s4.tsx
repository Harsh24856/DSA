import type { FIGURE_IDS_4 } from "@/lib/genai2/stages/s4.built";
import { Qkv } from "./s4/Qkv";

// Exactly the ids in FIGURE_IDS_4: satisfies rejects a missing or an extra key.
export const FIGURES_4 = { "s4-qkv": Qkv } satisfies Record<(typeof FIGURE_IDS_4)[number], () => React.JSX.Element>;
