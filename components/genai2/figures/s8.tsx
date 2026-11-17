import type { FIGURE_IDS_8 } from "@/lib/genai2/stages/s8.built";
import { ToolCall } from "./s8/ToolCall";
import { ReactTrace } from "./s8/ReactTrace";
import { StateGraph } from "./s8/StateGraph";
import { Glue } from "./s8/Glue";
import { MemoryTiers } from "./s8/MemoryTiers";

// Exactly the ids in FIGURE_IDS_8: satisfies rejects a missing or an extra key.
export const FIGURES_8 = {
  "s8-tool-call": ToolCall,
  "s8-react-trace": ReactTrace,
  "s8-state-graph": StateGraph,
  "s8-glue": Glue,
  "s8-memory-tiers": MemoryTiers,
} satisfies Record<(typeof FIGURE_IDS_8)[number], () => React.JSX.Element>;
