import type { GModule } from "../types.ts";
import { LORA_QLORA } from "../modules/s5/lora-qlora.ts";
import { RL_VERIFIABLE } from "../modules/s5/rl-verifiable.ts";
import { PREFERENCE_TUNING } from "../modules/s5/preference-tuning.ts";
import { DATA_PIPELINES } from "../modules/s5/data-pipelines.ts";
import { SFT_CHAT_TEMPLATES } from "../modules/s5/sft-chat-templates.ts";
import { PRETRAINING_SCALING } from "../modules/s5/pretraining-scaling.ts";

export const MODULES_5: Record<string, GModule> = {
  "pretraining-scaling": PRETRAINING_SCALING,
  "data-pipelines": DATA_PIPELINES,
  "sft-chat-templates": SFT_CHAT_TEMPLATES,
  "preference-tuning": PREFERENCE_TUNING,
  "rl-verifiable": RL_VERIFIABLE,
  "lora-qlora": LORA_QLORA,
};
