import type { GModule } from "../types.ts";
import { EMBEDDINGS_POSITIONS } from "../modules/s4/embeddings-positions.ts";
import { SELF_ATTENTION } from "../modules/s4/self-attention.ts";
import { TOKENISATION_BPE } from "../modules/s4/tokenisation-bpe.ts";

export const MODULES_4: Record<string, GModule> = { "tokenisation-bpe": TOKENISATION_BPE, "embeddings-positions": EMBEDDINGS_POSITIONS, "self-attention": SELF_ATTENTION };
