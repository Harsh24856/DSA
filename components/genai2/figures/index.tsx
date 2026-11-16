import type { FIGURE_IDS } from "@/lib/genai2/core";
import { Qkv } from "./Qkv";

// One small component per figure id (genai.check.ts compares these keys with FIGURE_IDS).
export const FIGURES: Record<(typeof FIGURE_IDS)[number], () => React.JSX.Element> = {
  qkv: Qkv,
};
