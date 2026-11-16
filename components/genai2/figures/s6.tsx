import type { FIGURE_IDS_6 } from "@/lib/genai2/stages/s6.built";
import { ApiCall } from "./s6/ApiCall";
import { ContextWindow } from "./s6/ContextWindow";
import { JsonMask } from "./s6/JsonMask";
import { PromptParts } from "./s6/PromptParts";

// Exactly the ids in FIGURE_IDS_6: satisfies rejects a missing or an extra key.
export const FIGURES_6 = {
  "s6-api-call": ApiCall,
  "s6-prompt-parts": PromptParts,
  "s6-json-mask": JsonMask,
  "s6-context-window": ContextWindow,
} satisfies Record<(typeof FIGURE_IDS_6)[number], () => React.JSX.Element>;
