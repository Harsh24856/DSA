import type { FIGURE_IDS_5 } from "@/lib/genai2/stages/s5.built";
import { Funnel } from "./s5/Funnel";
import { LossMask } from "./s5/LossMask";
import { Scaling } from "./s5/Scaling";
import { RlhfDpo } from "./s5/RlhfDpo";
import { GrpoGroup } from "./s5/GrpoGroup";
import { Lora } from "./s5/Lora";
// Exactly the ids in FIGURE_IDS_5: satisfies rejects a missing or an extra key.
export const FIGURES_5 = {
  "s5-scaling": Scaling,
  "s5-funnel": Funnel,
  "s5-loss-mask": LossMask,
  "s5-rlhf-dpo": RlhfDpo,
  "s5-grpo-group": GrpoGroup,
  "s5-lora": Lora,
} satisfies Record<(typeof FIGURE_IDS_5)[number], () => React.JSX.Element>;
