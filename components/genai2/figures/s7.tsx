import type { FIGURE_IDS_7 } from "@/lib/genai2/stages/s7.built";
import { ChunkOverlap } from "./s7/ChunkOverlap";
import { HnswLayers } from "./s7/HnswLayers";
import { BiCross } from "./s7/BiCross";

// Exactly the ids in FIGURE_IDS_7: satisfies rejects a missing or an extra key.
export const FIGURES_7 = {
  "s7-chunk-overlap": ChunkOverlap,
  "s7-hnsw-layers": HnswLayers,
  "s7-bi-cross": BiCross,
} satisfies Record<(typeof FIGURE_IDS_7)[number], () => React.JSX.Element>;
