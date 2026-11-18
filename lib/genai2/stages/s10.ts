import type { GModule } from "../types.ts";
import { REASONING_MODELS } from "../modules/s10/reasoning-models.ts";
import { MIXTURE_OF_EXPERTS } from "../modules/s10/mixture-of-experts.ts";
import { STATE_SPACE_HYBRIDS } from "../modules/s10/state-space-hybrids.ts";
import { LONG_CONTEXT } from "../modules/s10/long-context.ts";
import { VISION_LANGUAGE } from "../modules/s10/vision-language.ts";
import { VOICE_REALTIME } from "../modules/s10/voice-realtime.ts";
import { DIFFUSION_FLOW } from "../modules/s10/diffusion-flow.ts";
import { VIDEO_WORLD } from "../modules/s10/video-world.ts";
import { CODING_AGENTS } from "../modules/s10/coding-agents.ts";

export const MODULES_10: Record<string, GModule> = {
  "reasoning-models": REASONING_MODELS,
  "mixture-of-experts": MIXTURE_OF_EXPERTS,
  "state-space-hybrids": STATE_SPACE_HYBRIDS,
  "long-context": LONG_CONTEXT,
  "vision-language": VISION_LANGUAGE,
  "voice-realtime": VOICE_REALTIME,
  "diffusion-flow": DIFFUSION_FLOW,
  "video-world": VIDEO_WORLD,
  "coding-agents": CODING_AGENTS,
};
