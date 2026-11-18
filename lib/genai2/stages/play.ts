import { PLAY_0 } from "./s0.play.ts";
import { PLAY_1 } from "./s1.play.ts";
import { PLAY_2 } from "./s2.play.ts";
import { PLAY_3 } from "./s3.play.ts";
import { PLAY_4 } from "./s4.play.ts";
import { PLAY_5 } from "./s5.play.ts";
import { PLAY_6 } from "./s6.play.ts";
import { PLAY_7 } from "./s7.play.ts";
import { PLAY_8 } from "./s8.play.ts";
import { PLAY_9 } from "./s9.play.ts";
import { PLAY_10 } from "./s10.play.ts";

import type { PlayFlow } from "../../other/flows-play-types.ts";
export const GENAI_PLAY: Record<string, PlayFlow> = { ...PLAY_0, ...PLAY_1, ...PLAY_2, ...PLAY_3, ...PLAY_4, ...PLAY_5, ...PLAY_6, ...PLAY_7, ...PLAY_8, ...PLAY_9, ...PLAY_10, };
