import type { GModule } from "../types.ts";
import { TOOL_CALLING } from "../modules/s8/tool-calling.ts";
import { AGENT_LOOP_REACT } from "../modules/s8/agent-loop-react.ts";

export const MODULES_8: Record<string, GModule> = {
  "tool-calling": TOOL_CALLING,
  "agent-loop-react": AGENT_LOOP_REACT,
};
