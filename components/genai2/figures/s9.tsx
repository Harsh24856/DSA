import type { FIGURE_IDS_9 } from "@/lib/genai2/stages/s9.built";
import { Roofline } from "./s9/Roofline";
import { KvBlocks } from "./s9/KvBlocks";
import { BatchGantt } from "./s9/BatchGantt";
import { QuantSizes } from "./s9/QuantSizes";
import { SpecTokens } from "./s9/SpecTokens";
import { CiBars } from "./s9/CiBars";
import { TraceSpans } from "./s9/TraceSpans";
import { Trifecta } from "./s9/Trifecta";

// Exactly the ids in FIGURE_IDS_9: satisfies rejects a missing or an extra key.
export const FIGURES_9 = {
  "s9-roofline": Roofline,
  "s9-kv-blocks": KvBlocks,
  "s9-batch-gantt": BatchGantt,
  "s9-quant-sizes": QuantSizes,
  "s9-spec-tokens": SpecTokens,
  "s9-ci-bars": CiBars,
  "s9-trace-spans": TraceSpans,
  "s9-trifecta": Trifecta,
} satisfies Record<(typeof FIGURE_IDS_9)[number], () => React.JSX.Element>;
