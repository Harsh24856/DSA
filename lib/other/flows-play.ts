// Interactive walk-throughs: a flow computed from numbers the learner sets with sliders (components/other/FlowLab.tsx).
// A chapter opts in with `play: "<id>"`; on /patterns, PATTERN_PLAY places one on a topic Overview or a pattern. `make` must return a valid Flow for every allowed combination, or throw a
// PlayError when the numbers have no sensible answer (the page then says so and keeps the last good walk-through).
// check:other runs every one at its defaults and on random combinations.
import type { PlayFlow } from "./flows-play-types.ts";
import { PLAY as QUANT } from "./flows-play-quant.ts";
import { PLAY as LOGIC } from "./flows-play-logic.ts";
import { PLAY as DSA_A, PLACES as PLACES_A } from "./flows-play-dsa-a.ts";
import { PLAY as DSA_B, PLACES as PLACES_B } from "./flows-play-dsa-b.ts";
import { PLAY as DESIGN } from "./flows-play-design.ts";

export { PlayError } from "./flows-play-types.ts";
export type { Knob, PlayFlow } from "./flows-play-types.ts";

export const PLAY_FLOWS: Record<string, PlayFlow> = { ...QUANT, ...LOGIC, ...DSA_A, ...DSA_B, ...DESIGN };
/** Where /patterns shows an interactive walk-through: "<topic>:0" is the Overview, "<topic>:<n>" a pattern. */
export const PATTERN_PLAY: Record<string, string> = { ...PLACES_A, ...PLACES_B };
export const knobDefaults = (p: PlayFlow) => Object.fromEntries(p.knobs.map((k) => [k.key, k.value]));
