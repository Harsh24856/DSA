import type { FIGURE_IDS_8 } from "@/lib/genai2/stages/s8.built";
import { ToolCall } from "./s8/ToolCall";
import { ReactTrace } from "./s8/ReactTrace";

// Exactly the ids in FIGURE_IDS_8: satisfies rejects a missing or an extra key.
export const FIGURES_8 = {
  "s8-tool-call": ToolCall,
  "s8-react-trace": ReactTrace,
} satisfies Record<(typeof FIGURE_IDS_8)[number], () => React.JSX.Element>;
