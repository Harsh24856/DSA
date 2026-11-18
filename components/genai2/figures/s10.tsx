import type { FIGURE_IDS_10 } from "@/lib/genai2/stages/s10.built";
import { AgentCurve, NoiseCurves, StateVsKv, VoteCurves } from "./s10/Charts";
import { CtxMemory, MoeLayer, PatchGrid, SpaceTime, VoiceTimeline } from "./s10/Diagrams";

// Exactly the ids in FIGURE_IDS_10: satisfies rejects a missing or an extra key.
export const FIGURES_10 = {
  "s10-vote-curves": VoteCurves,
  "s10-moe-layer": MoeLayer,
  "s10-state-vs-kv": StateVsKv,
  "s10-ctx-memory": CtxMemory,
  "s10-patch-grid": PatchGrid,
  "s10-voice-timeline": VoiceTimeline,
  "s10-noise-curves": NoiseCurves,
  "s10-spacetime": SpaceTime,
  "s10-agent-curve": AgentCurve,
} satisfies Record<(typeof FIGURE_IDS_10)[number], () => React.JSX.Element>;
