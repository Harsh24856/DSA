import type { GModule } from "../types.ts";
import { TOOL_CALLING } from "../modules/s8/tool-calling.ts";
import { SECURITY_GUARDRAILS } from "../modules/s8/security-guardrails.ts";
import { AGENT_LOOP_REACT } from "../modules/s8/agent-loop-react.ts";
import { STATE_GRAPHS } from "../modules/s8/state-graphs.ts";
import { MCP_A2A } from "../modules/s8/mcp-a2a.ts";
import { AGENT_MEMORY } from "../modules/s8/agent-memory.ts";
import { COMPUTER_USE } from "../modules/s8/computer-use.ts";
import { MULTI_AGENT } from "../modules/s8/multi-agent.ts";

export const MODULES_8: Record<string, GModule> = {
  "tool-calling": TOOL_CALLING,
  "security-guardrails": SECURITY_GUARDRAILS,
  "agent-loop-react": AGENT_LOOP_REACT,
  "state-graphs": STATE_GRAPHS,
  "mcp-a2a": MCP_A2A,
  "agent-memory": AGENT_MEMORY,
  "computer-use": COMPUTER_USE,
  "multi-agent": MULTI_AGENT,
};
