import type { FIGURE_IDS_4 } from "@/lib/genai2/stages/s4.built";
import { AttnKinds } from "./s4/AttnKinds";
import { Block } from "./s4/Block";
import { BpeTree } from "./s4/BpeTree";
import { DecodeTree } from "./s4/DecodeTree";
import { Heads } from "./s4/Heads";
import { Qkv } from "./s4/Qkv";
import { RopeDial } from "./s4/RopeDial";

// Exactly the ids in FIGURE_IDS_4: satisfies rejects a missing or an extra key.
export const FIGURES_4 = {
  "s4-qkv": Qkv, "s4-bpe-tree": BpeTree, "s4-rope-dial": RopeDial, "s4-heads": Heads, "s4-block": Block, "s4-attn-kinds": AttnKinds, "s4-decode-tree": DecodeTree,
} satisfies Record<(typeof FIGURE_IDS_4)[number], () => React.JSX.Element>;
