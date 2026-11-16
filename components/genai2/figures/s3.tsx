import type { FIGURE_IDS_3 } from "@/lib/genai2/stages/s3.built";
import { Bag } from "./s3/Bag";
import { Unroll } from "./s3/Unroll";

// Exactly the ids in FIGURE_IDS_3: satisfies rejects a missing or an extra key.
export const FIGURES_3 = { "s3-bag": Bag, "s3-unroll": Unroll } satisfies Record<(typeof FIGURE_IDS_3)[number], () => React.JSX.Element>;
